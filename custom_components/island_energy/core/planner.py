"""Grid (AC IN) charge planner.

Goal: after the next day of PV the battery should reach 100 %. The grid only
tops up what PV will not manage, never above the AC IN ceiling (90 %, or 100 %
when the battery has not been full for a week), never lets the morning low
drop below ``min_soc``, charges only in low-tariff (NT) windows and as late as
possible before PV takes over in the morning.

The plan is rolled over the whole forecast horizon night by night, so the
forecast table can show the expected grid charge for every day.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, tzinfo

from .forecast import (
    FULL_SOC,
    ChargeWindow,
    DayResult,
    ForecastDay,
    PvPeriod,
    SocPoint,
    analyze_days,
    first_charge_index,
    simulate,
    with_grid,
)
from .hdo import clip, merge

QUARTER = timedelta(minutes=15)
#: How far before the morning deadline a night's charging may start.
NIGHT_SPAN = timedelta(hours=18)


@dataclass(frozen=True)
class PlannerConfig:
    charge_power_w: float = 2600.0
    ceiling_pct: float = 90.0
    full_ceiling_pct: float = 100.0
    full_every_days: int = 7
    min_soc_pct: float = 10.0
    min_charge_kwh: float = 0.5


@dataclass(frozen=True)
class NightPlan:
    """Grid charging prepared for ``target_day`` (the night before it)."""

    target_day: date
    deadline: datetime
    ceiling: float
    needed_kwh: float
    windows: tuple[ChargeWindow, ...]
    trough_without: float
    peak_without: float | None
    #: NT time before the deadline is not enough for the needed energy.
    short: bool = False
    #: Charging starts early so the SoC does not fall below the minimum first.
    protect_min: bool = False


@dataclass(frozen=True)
class PlanResult:
    nights: list[NightPlan]
    points: list[SocPoint]
    days: list[DayResult]
    windows: list[ChargeWindow] = field(default_factory=list)

    @property
    def next_night(self) -> NightPlan | None:
        return self.nights[0] if self.nights else None


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
    last_full: datetime | None = None,
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

    windows: list[ChargeWindow] = []
    nights: list[NightPlan] = []
    full = last_full
    for day in forward:
        points = run(windows)
        pts = [p for p in points if day.start <= p.t < day.end]
        if not pts:
            continue
        c = first_charge_index(pts)
        if c >= 0 and pts[c].t <= now:
            # PV charging has already started today: nothing to prepare.
            full = _update_full(full, pts)
            continue
        if c < 0:
            # No PV charging that day at all: still protect the minimum, by noon.
            noon = day.start + timedelta(hours=12)
            c = next((i for i, p in enumerate(pts) if p.t >= noon), len(pts) - 1)
            if pts[c].t <= now:
                continue
        deadline = pts[c].t
        trough = min(p.lo for p in points if p.t <= deadline)
        trough_at_deadline = pts[c].lo
        peak = max((p.hi for p in pts[c:]), default=None) if first_charge_index(pts) >= 0 else None
        ceiling = (
            cfg.full_ceiling_pct
            if full is None or deadline - full >= timedelta(days=cfg.full_every_days)
            else cfg.ceiling_pct
        )
        # Missing SoC to reach 100 % after the PV day, capped by the AC IN
        # ceiling; protecting the minimum SoC wins over the ceiling.
        pv_need = max(0.0, 100.0 - (peak if peak is not None else trough_at_deadline))
        room = max(0.0, ceiling - trough_at_deadline)
        min_need = max(0.0, cfg.min_soc_pct - trough)
        need_pct = max(min(pv_need, room), min_need)
        target = trough_at_deadline + need_pct
        # The minimum may need more than the ceiling allows.
        ceiling = max(ceiling, min(100.0, cfg.min_soc_pct + 1)) if min_need > 0 else ceiling
        new: list[ChargeWindow] = []
        short = False
        protect = False
        if need_pct / 100 * cap >= cfg.min_charge_kwh:
            start_bound = max(now, deadline - NIGHT_SPAN)
            allowed = clip(nt if nt is not None else [ChargeWindow(start_bound, deadline)], start_bound, deadline)
            # While charging, loads run from the grid, so the battery also stops
            # discharging: refine the duration against the simulated result.
            duration = _ceil_quarter(need_pct / 100 * cap * 1000 / max(1.0, cfg.charge_power_w))
            for _ in range(5):
                new, short = schedule_latest(allowed, duration, ceiling)
                trial = run(merge_keep_ceiling(windows + new))
                # The ceiling may stop charging early: drop the unused tail so the
                # charging still ends as late as possible.
                used = [p.t for p in trial if p.grid_kwh > 0 and any(w.start <= p.t < w.end for w in new)]
                if used and new and used[-1] + QUARTER < new[-1].end:
                    duration = max(QUARTER, duration - (new[-1].end - (used[-1] + QUARTER)))
                    continue
                got = _soc_at(trial, deadline)
                if got is None or abs(got - target) < 1.5 or short:
                    break
                missing_kwh = (target - got) / 100 * cap
                step = _ceil_quarter(abs(missing_kwh) * 1000 / max(1.0, cfg.charge_power_w))
                duration = max(QUARTER, duration + (step if missing_kwh > 0 else -step))
            # Latest charging must not let the SoC fall below the minimum first:
            # then charge from the moment the SoC would cross the minimum.
            if min_need > 0:
                trial = run(merge_keep_ceiling(windows + new))
                if min((p.lo for p in trial if p.t <= deadline), default=100) < cfg.min_soc_pct - 0.5:
                    base = run(windows)
                    cross = next((p.t for p in base if p.t <= deadline and p.lo < cfg.min_soc_pct + 2), start_bound)
                    guard = clip(allowed, max(start_bound, cross - QUARTER), deadline)
                    # Charge enough at the crossing to last until the deadline.
                    ceiling = max(ceiling, min(100.0, cfg.min_soc_pct + 2 + min_need))
                    new, short = schedule_earliest(guard, duration, ceiling)
                    protect = True
            windows = merge_keep_ceiling(windows + new)
        points = run(windows)
        charged = [p for p in points if p.grid_kwh > 0 and any(w.start <= p.t < w.end for w in new)]
        actual = _actual_windows(charged, ceiling)
        nights.append(
            NightPlan(
                target_day=day.start.astimezone(tz).date(),
                deadline=deadline,
                ceiling=ceiling,
                needed_kwh=round(sum(p.grid_kwh for p in charged), 2),
                windows=tuple(actual),
                trough_without=trough_at_deadline,
                peak_without=peak,
                short=short,
                protect_min=protect,
            )
        )
        full = _update_full(full, [p for p in points if day.start <= p.t < day.end])

    points = run(windows)
    timeline = [p for p in history if p.t < now] + points
    results = analyze_days(days, timeline, cfg.min_soc_pct)
    by_day = {n.target_day: n for n in nights}
    out: list[DayResult] = []
    for r in results:
        night = by_day.get(r.day.start.astimezone(tz).date())
        if night and night.windows:
            kwh = sum(p.grid_kwh for p in points if any(w.start <= p.t < w.end for w in night.windows))
            r = with_grid(r, round(kwh, 2), night.windows)
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


def _update_full(full: datetime | None, pts: Sequence[SocPoint]) -> datetime | None:
    for p in pts:
        if p.hi >= FULL_SOC:
            return p.t if full is None or p.t > full else full
    return full
