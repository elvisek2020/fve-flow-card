"""Grid (AC IN) charge planner.

Goal: a **reserve until the next night**. Each night the grid tops up only as
much as the battery needs so that the simulated SoC (Solcast estimate minus the
load profile) does not drop below the reserve from the end of the night window
until the next night window starts. The grid charges only at night (between
"charge from" and "charge until", intersected with the low-tariff (NT) windows),
as late as possible, never above the AC IN ceiling, and keeps the SoC above the
minimum before that (minimum protection may use any NT time). PV fills the rest
during the day, so the battery is not topped up from the grid while PV could.

The plan is rolled over the forecast horizon night by night; when a night cannot
reach the reserve even at the ceiling, the night before charges more (up to the
ceiling).
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass, field, replace
from datetime import date, datetime, time, timedelta, tzinfo

from .forecast import (
    ChargeWindow,
    DayResult,
    ForecastDay,
    PvPeriod,
    SocPoint,
    analyze_days,
    simulate,
    with_grid,
)
from .hdo import clip, merge

QUARTER = timedelta(minutes=15)


@dataclass(frozen=True)
class PlannerConfig:
    charge_power_w: float = 2600.0
    ceiling_pct: float = 90.0
    #: SoC to keep from the end of the night window until the next night.
    reserve_pct: float = 30.0
    min_soc_pct: float = 10.0
    min_charge_kwh: float = 0.5
    #: Night charging interval (local time; over midnight when start > end).
    night_start: time = time(21, 0)
    night_end: time = time(8, 0)


@dataclass(frozen=True)
class NightPlan:
    """Grid charging prepared for ``target_day`` (the night before it)."""

    target_day: date
    #: End of the night window (charging is over by then).
    deadline: datetime
    ceiling: float
    needed_kwh: float
    windows: tuple[ChargeWindow, ...]
    #: Lowest simulated SoC from the end of the night until the next night, without
    #: this night's grid charging / with the plan.
    reserve_min_without: float
    reserve_min: float | None = None
    #: The reserve is not reached (ceiling or NT time too small).
    short: bool = False
    #: Charging starts early so the SoC does not fall below the minimum first.
    protect_min: bool = False
    #: Charges up to the ceiling because a later night alone cannot keep the reserve.
    boosted: bool = False


@dataclass(frozen=True)
class PlanResult:
    nights: list[NightPlan]
    points: list[SocPoint]
    days: list[DayResult]
    windows: list[ChargeWindow] = field(default_factory=list)

    @property
    def next_night(self) -> NightPlan | None:
        return self.nights[0] if self.nights else None


def hours_to_time(hours: float) -> time:
    """Settings keep the night interval as hours (21.5 = 21:30)."""
    minutes = round(hours * 60) % (24 * 60)
    return time(minutes // 60, minutes % 60)


def _ceil_quarter(hours: float) -> timedelta:
    return QUARTER * math.ceil(round(hours * 4, 6))


def schedule_latest(
    allowed: Sequence[ChargeWindow], duration: timedelta, ceiling: float
) -> tuple[list[ChargeWindow], bool]:
    """Fill ``duration`` into ``allowed`` windows from the end (as late as possible).

    Returns the windows (chronological) and whether the allowed time was too short.
    """
    left = duration
    out: list[ChargeWindow] = []
    for w in sorted(allowed, key=lambda x: x.end, reverse=True):
        if left <= timedelta(0):
            break
        length = w.end - w.start
        take = min(length, left)
        out.append(ChargeWindow(w.end - take, w.end, ceiling))
        left -= take
    return sorted(out, key=lambda x: x.start), left > timedelta(0)


def night_bounds(day: ForecastDay, tz: tzinfo, cfg: PlannerConfig) -> tuple[datetime, datetime, datetime]:
    """Night window before ``day`` and the start of the next one: (start, end, next start)."""
    d = day.start.astimezone(tz).date()

    def at(x: date, t: time) -> datetime:
        return datetime.combine(x, t, tz)

    if cfg.night_start > cfg.night_end:  # over midnight (21:00 → 08:00)
        return at(d - timedelta(days=1), cfg.night_start), at(d, cfg.night_end), at(d, cfg.night_start)
    return at(d, cfg.night_start), at(d, cfg.night_end), at(d + timedelta(days=1), cfg.night_start)


def plan(
    *,
    now: datetime,
    tz: tzinfo,
    soc_now: float,
    capacity_kwh: float,
    pv: Sequence[PvPeriod],
    profile_w: Sequence[float],
    days: Sequence[ForecastDay],
    history: Sequence[SocPoint] = (),
    nt: Sequence[ChargeWindow] | None = None,
    cfg: PlannerConfig | None = None,
) -> PlanResult:
    """Plan grid charging night by night over the forward ``days`` and simulate the result.

    ``nt`` = low-tariff windows (None = charging allowed any time). ``history`` are
    measured points before ``now`` (for past days and today's morning low).
    """
    cfg = cfg or PlannerConfig()
    cap = max(0.001, capacity_kwh)
    forward = [d for d in days if d.kind != "past"]
    until = max((d.end for d in forward), default=now)

    def run(windows: Sequence[ChargeWindow]) -> list[SocPoint]:
        return simulate(
            now=now,
            soc_now=soc_now,
            capacity_kwh=cap,
            pv=pv,
            profile_w=profile_w,
            until=until,
            tz=tz,
            windows=windows,
            charge_power_w=cfg.charge_power_w,
        )

    nights_days = [(d, *night_bounds(d, tz, cfg)) for d in forward]
    nights_days = [n for n in nights_days if n[2] > now and n[1] < until]

    def plan_night(
        day: ForecastDay, ns: datetime, ne: datetime, next_ns: datetime, windows: list[ChargeWindow], boost: bool
    ) -> tuple[NightPlan, list[ChargeWindow], bool]:
        start_bound = max(now, ns)
        allowed = clip(nt if nt is not None else [ChargeWindow(start_bound, ne)], start_bound, ne)
        span_start = ne
        points = run(windows)
        span = [p for p in points if span_start <= p.t <= next_ns]
        reserve_without = min((p.lo for p in span), default=100.0)
        soc_end = _soc_at(points, span_start)
        soc_end = soc_end if soc_end is not None else soc_now
        ceiling = cfg.ceiling_pct
        room = max(0.0, ceiling - soc_end)
        reserve_need = room if boost else max(0.0, cfg.reserve_pct - reserve_without)
        short = reserve_need > room + 0.5
        need_pct = min(reserve_need, room)
        # Never below the minimum before the window ends (wins over the ceiling).
        trough = min((p.lo for p in points if p.t <= span_start), default=soc_now)
        min_need = max(0.0, cfg.min_soc_pct - trough)
        need_pct = max(need_pct, min_need)
        if min_need > 0:
            ceiling = max(ceiling, min(100.0, cfg.min_soc_pct + 2 + min_need))
        target = soc_end + need_pct
        new: list[ChargeWindow] = []
        protect = False
        time_short = False

        def span_min(trial: Sequence[SocPoint]) -> float:
            return min((p.lo for p in trial if span_start <= p.t <= next_ns), default=100.0)

        if need_pct / 100 * cap >= cfg.min_charge_kwh:
            # The simulation clamps the SoC at 0 %, so the deficit is refined against
            # the simulated reserve itself, not computed once.
            on_reserve = not boost and reserve_need >= min_need
            duration = _ceil_quarter(need_pct / 100 * cap * 1000 / max(1.0, cfg.charge_power_w))
            for _ in range(8):
                new, too_short = schedule_latest(allowed, duration, ceiling)
                time_short = too_short
                trial = run(merge_keep_ceiling(windows + new))
                # The ceiling may stop charging early: drop the unused tail so the
                # charging still ends as late as possible.
                used = [p.t for p in trial if p.grid_kwh > 0 and any(w.start <= p.t < w.end for w in new)]
                if used and new and used[-1] + QUARTER < new[-1].end:
                    duration = max(QUARTER, duration - (new[-1].end - (used[-1] + QUARTER)))
                    short = short or (not boost and span_min(trial) < cfg.reserve_pct - 0.5)
                    continue
                got_end = _soc_at(trial, span_start)
                if got_end is None:
                    break
                if on_reserve:
                    missing = cfg.reserve_pct - span_min(trial)
                    if 0 <= -missing < 3 or abs(missing) < 0.5:
                        break
                    if missing > 0 and (too_short or got_end >= ceiling - 0.5):
                        short = True
                        break
                else:
                    missing = target - got_end
                    if abs(missing) < 1.5 or too_short:
                        break
                step = _ceil_quarter(abs(missing) / 100 * cap * 1000 / max(1.0, cfg.charge_power_w))
                duration = max(QUARTER, duration + (step if missing > 0 else -step))
            # Latest charging must not let the SoC fall below the minimum first:
            # then charge from the moment the SoC would cross the minimum, in any
            # NT time (also before the night window).
            if min_need > 0:
                trial = run(merge_keep_ceiling(windows + new))
                if min((p.lo for p in trial if p.t <= span_start), default=100) < cfg.min_soc_pct - 0.5:
                    base = run(windows)
                    cross = next((p.t for p in base if p.t <= span_start and p.lo < cfg.min_soc_pct + 2), now)
                    any_nt = nt if nt is not None else [ChargeWindow(now, span_start)]
                    guard = clip(any_nt, max(now, cross - QUARTER), span_start)
                    new, time_short = schedule_earliest(guard, duration, ceiling)
                    protect = True
        night = NightPlan(
            target_day=day.start.astimezone(tz).date(),
            deadline=ne,
            ceiling=ceiling,
            needed_kwh=0.0,
            windows=(),
            reserve_min_without=reserve_without,
            short=short or time_short,
            protect_min=protect,
            boosted=boost,
        )
        return night, new, time_short

    # Night by night; a night whose NT time is too short for the reserve makes the
    # night before charge up to the ceiling (and re-plans from there). A shortage
    # from the ceiling itself cannot be helped by earlier nights.
    per_night: list[list[ChargeWindow]] = []
    plans: list[NightPlan] = []
    boost: set[int] = set()
    i = 0
    steps = 0
    while i < len(nights_days):
        steps += 1
        earlier = merge_keep_ceiling([w for ws in per_night[:i] for w in ws])
        day, ns, ne, next_ns = nights_days[i]
        night, new, time_short = plan_night(day, ns, ne, next_ns, earlier, i in boost)
        del per_night[i:]
        del plans[i:]
        per_night.append(new)
        plans.append(night)
        if time_short and i > 0 and (i - 1) not in boost and steps < 4 * len(nights_days):
            boost.add(i - 1)
            i -= 1
            continue
        i += 1

    windows = merge_keep_ceiling([w for ws in per_night for w in ws])
    points = run(windows)
    nights: list[NightPlan] = []
    for night, new, (_, _, ne, next_ns) in zip(plans, per_night, nights_days, strict=True):
        charged = [p for p in points if p.grid_kwh > 0 and any(w.start <= p.t < w.end for w in new)]
        span = [p.lo for p in points if ne <= p.t <= next_ns]
        nights.append(
            replace(
                night,
                needed_kwh=round(sum(p.grid_kwh for p in charged), 2),
                windows=tuple(_actual_windows(charged, night.ceiling)),
                reserve_min=min(span) if span else None,
            )
        )

    timeline = [p for p in history if p.t < now] + points
    results = analyze_days(days, timeline, cfg.min_soc_pct)
    by_day = {n.target_day: n for n in nights}
    out: list[DayResult] = []
    for r in results:
        night = by_day.get(r.day.start.astimezone(tz).date())
        if night and night.windows:
            kwh = sum(p.grid_kwh for p in points if any(w.start <= p.t < w.end for w in night.windows))
            r = with_grid(r, round(kwh, 2), night.windows, points)
        out.append(r)
    return PlanResult(nights=nights, points=points, days=out, windows=windows)


def schedule_earliest(
    allowed: Sequence[ChargeWindow], duration: timedelta, ceiling: float
) -> tuple[list[ChargeWindow], bool]:
    """Fill ``duration`` into ``allowed`` windows from the start (minimum-SoC protection)."""
    left = duration
    out: list[ChargeWindow] = []
    for w in sorted(allowed, key=lambda x: x.start):
        if left <= timedelta(0):
            break
        take = min(w.end - w.start, left)
        out.append(ChargeWindow(w.start, w.start + take, ceiling))
        left -= take
    return out, left > timedelta(0)


def _soc_at(points: Sequence[SocPoint], t: datetime) -> float | None:
    for p in points:
        if p.t >= t:
            return p.lo
    return None


def _actual_windows(charged: Sequence[SocPoint], ceiling: float) -> list[ChargeWindow]:
    """Charging steps actually used in the simulation (the ceiling may end a window early)."""
    out: list[ChargeWindow] = []
    for p in charged:
        end = p.t + QUARTER - timedelta(seconds=p.t.timestamp() % QUARTER.total_seconds())
        if out and p.t <= out[-1].end:
            out[-1] = ChargeWindow(out[-1].start, end, ceiling)
        else:
            out.append(ChargeWindow(p.t, end, ceiling))
    return out


def merge_keep_ceiling(windows: Sequence[ChargeWindow]) -> list[ChargeWindow]:
    """Merge windows per ceiling (windows of different nights never overlap)."""
    out: list[ChargeWindow] = []
    for ceiling in sorted({w.ceiling for w in windows}):
        out += [ChargeWindow(w.start, w.end, ceiling) for w in merge(w for w in windows if w.ceiling == ceiling)]
    return sorted(out, key=lambda w: w.start)
