"""Battery SoC forecast: 15-minute simulation of PV minus an hourly load profile.

Port of the card's former ``battery-forecast.ts``. For every day it finds the
"morning low" (SoC at the moment the battery starts charging from PV) and the
day's peak (and when it reaches 100 %). Optional grid charge windows (AC IN)
raise the SoC up to a ceiling.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field, replace
from datetime import datetime, timedelta, tzinfo
from typing import Literal

STEP = timedelta(minutes=15)
FULL_SOC = 99.5
#: Battery power above this (W, positive = charging) counts as "charging" in history.
CHARGING_W = 50.0
#: Mean AC IN (grid) power above this (W) marks an hour with grid charging / passthrough.
AC_IN_W = 50.0

LoadSource = Literal["dc", "ac", "flat"]
DayKind = Literal["past", "today", "tomorrow", "future"]


@dataclass(frozen=True)
class PvPeriod:
    """Forecast PV power (W) in [start, end)."""

    start: datetime
    end: datetime
    w: float


@dataclass(frozen=True)
class HourRow:
    """One hourly long-term statistics row."""

    start: datetime
    mean: float | None = None
    min: float | None = None
    max: float | None = None


@dataclass(frozen=True)
class ChargeWindow:
    """Grid (AC IN) charging interval; charging stops when SoC reaches ``ceiling``."""

    start: datetime
    end: datetime
    ceiling: float = 100.0


@dataclass(frozen=True)
class SocPoint:
    """Point of the SoC timeline: measured hour (min/max) or simulated step (lo == hi)."""

    t: datetime
    lo: float
    hi: float
    charging: bool
    measured: bool
    #: Energy charged from the grid during this step (kWh).
    grid_kwh: float = 0.0


@dataclass(frozen=True)
class ForecastDay:
    label: str
    kind: DayKind
    start: datetime
    end: datetime
    pv_kwh: float | None
    load_kwh: float | None


@dataclass(frozen=True)
class DayResult:
    day: ForecastDay
    trough: float | None = None
    trough_at: datetime | None = None
    peak: float | None = None
    peak_at: datetime | None = None
    full_at: datetime | None = None
    charges: bool = False
    risk: bool = False
    measured: bool = False
    #: Grid charging attributed to this day (the night before it), kWh.
    grid_kwh: float = 0.0
    grid_windows: tuple[ChargeWindow, ...] = field(default_factory=tuple)


def clamp_soc(soc: float) -> float:
    return min(100.0, max(0.0, soc))


def parse_detailed(attr: object, start: datetime, end: datetime) -> list[PvPeriod]:
    """Solcast ``detailedForecast`` (kW, ``pv_estimate``) → periods in W within [start, end)."""
    if not isinstance(attr, list):
        return []
    items: list[tuple[datetime, float]] = []
    for rec in attr:
        if not isinstance(rec, dict):
            continue
        raw = rec.get("period_start")
        try:
            t = raw if isinstance(raw, datetime) else datetime.fromisoformat(str(raw))
            kw = float(rec.get("pv_estimate"))
        except (TypeError, ValueError):
            continue
        if t.tzinfo is None:
            continue
        items.append((t, kw * 1000.0))
    items.sort(key=lambda x: x[0])
    out: list[PvPeriod] = []
    for i, (t, w) in enumerate(items):
        nxt = items[i + 1][0] if i + 1 < len(items) else None
        e = nxt if nxt is not None and nxt - t <= timedelta(hours=1) else t + timedelta(minutes=30)
        if e > start and t < end:
            out.append(PvPeriod(t, e, w))
    return out


def pv_periods_for_day(
    day_start: datetime,
    day_kwh: float | None,
    detailed: Sequence[PvPeriod],
    template: Sequence[PvPeriod] | None,
) -> list[PvPeriod]:
    """PV of one day; without ``detailedForecast`` borrow the shape of another day (scaled)."""
    if detailed:
        return list(detailed)
    if day_kwh is None or day_kwh <= 0:
        return []
    if template:
        shape = [
            (p.start - p.start.replace(hour=0, minute=0, second=0, microsecond=0), p.end - p.start, p.w)
            for p in template
        ]
    else:
        import math

        shape = []
        for i in range(24):
            h = 7 + (i + 0.5) / 2
            shape.append((timedelta(minutes=30 * (14 + i)), timedelta(minutes=30), math.sin(math.pi * (h - 7) / 12)))
    total = sum(w * length.total_seconds() / 3600 / 1000 for _, length, w in shape)
    if total <= 0:
        return []
    k = day_kwh / total
    return [PvPeriod(day_start + off, day_start + off + length, w * k) for off, length, w in shape]


def dc_load_rows(
    pv: Iterable[HourRow],
    battery: Iterable[HourRow],
    inverter: Iterable[HourRow] | None = None,
    ac_in: Iterable[HourRow] | None = None,
) -> list[HourRow]:
    """Hourly DC draw of the island loads (what PV + battery must supply), W.

    Normally PV − battery charging power (includes inverter losses). In hours with
    grid power on the Victron AC IN the battery is charged from the grid and the
    loads run from the grid, so that difference is meaningless: such hours use the
    inverter AC output × the loss factor learned from the clean hours (or are
    skipped without an AC output reading). Grid charging is therefore neither
    load nor production.
    """
    bat = {r.start: r.mean for r in battery}
    acin = {r.start: r.mean for r in ac_in or ()}
    acout = {r.start: r.mean for r in inverter or ()}
    clean: list[HourRow] = []
    grid_hours: list[datetime] = []
    ratios: list[float] = []
    for r in pv:
        b = bat.get(r.start)
        if r.mean is None or b is None:
            continue
        if (acin.get(r.start) or 0) > AC_IN_W:
            grid_hours.append(r.start)
            continue
        load = r.mean - b
        clean.append(HourRow(r.start, load))
        out = acout.get(r.start)
        if out is not None and out > 100:
            ratios.append(load / out)
    ratios.sort()
    loss = min(1.3, max(1.0, ratios[len(ratios) // 2])) if ratios else 1.04
    for t in grid_hours:
        out = acout.get(t)
        if out is not None:
            clean.append(HourRow(t, out * loss))
    return sorted(clean, key=lambda r: r.start)


def learned_charge_power(dc: Iterable[HourRow], ac_in: Iterable[HourRow], min_hours: int = 2) -> float | None:
    """Typical grid charging power into the battery (W): median DC power of hours
    fully on AC IN (mean AC IN power > 2 kW). None with too little data."""
    acin = {r.start: r.mean for r in ac_in}
    vals = sorted(r.mean for r in dc if r.mean is not None and r.mean > 0 and (acin.get(r.start) or 0) > 2000)
    if len(vals) < min_hours:
        return None
    return vals[len(vals) // 2]


def build_load_profile(
    *,
    tz: tzinfo,
    pv: Iterable[HourRow] | None,
    battery: Iterable[HourRow] | None,
    inverter: Iterable[HourRow] | None,
    fallback_daily_kwh: float,
    ac_in: Iterable[HourRow] | None = None,
    min_samples: int = 3,
) -> tuple[list[float], LoadSource]:
    """Hourly load profile (W by local hour).

    Primary source is the DC draw from the battery side (``dc_load_rows``: PV −
    battery charging, grid-charging hours replaced by AC output × losses), then
    the inverter AC output, then the fallback daily energy spread evenly.
    ``battery`` must be positive when charging.
    """
    inverter = list(inverter) if inverter is not None else None

    def average(pairs: Iterable[tuple[datetime, float]]) -> list[float] | None:
        total = [0.0] * 24
        count = [0] * 24
        for t, w in pairs:
            h = t.astimezone(tz).hour
            total[h] += w
            count[h] += 1
        if any(c < min_samples for c in count):
            return None
        return [max(0.0, total[h] / count[h]) for h in range(24)]

    if pv is not None and battery is not None:
        rows = dc_load_rows(pv, battery, inverter, ac_in)
        profile = average((r.start, r.mean) for r in rows if r.mean is not None)
        if profile:
            return profile, "dc"
    if inverter is not None:
        profile = average((r.start, r.mean) for r in inverter if r.mean is not None)
        if profile:
            return profile, "ac"
    flat = max(0.0, fallback_daily_kwh) * 1000.0 / 24
    return [flat] * 24, "flat"


def measured_points(
    soc: Iterable[HourRow], battery: Iterable[HourRow] | None, ac_in: Iterable[HourRow] | None = None
) -> list[SocPoint]:
    """Measured SoC timeline from hourly statistics (charging = mean battery power > 50 W).

    Hours with grid power on AC IN are marked as grid charging (``grid_kwh``), so
    the morning low is not mistaken for the start of PV charging.
    """
    bat = {r.start: r.mean for r in battery or ()}
    acin = {r.start: r.mean for r in ac_in or ()}
    out: list[SocPoint] = []
    for r in soc:
        lo = r.min if r.min is not None else r.mean
        hi = r.max if r.max is not None else r.mean
        if lo is None or hi is None:
            continue
        grid_w = acin.get(r.start) or 0
        if grid_w > AC_IN_W:
            out.append(SocPoint(r.start, lo, hi, True, True, grid_w / 1000))
            continue
        b = bat.get(r.start)
        charging = b > CHARGING_W if b is not None else (hi - lo > 1 and (r.mean if r.mean is not None else lo) > lo)
        out.append(SocPoint(r.start, lo, hi, charging, True))
    return out


def simulate(
    *,
    now: datetime,
    soc_now: float,
    capacity_kwh: float,
    pv: Sequence[PvPeriod],
    profile_w: Sequence[float],
    until: datetime,
    tz: tzinfo,
    windows: Sequence[ChargeWindow] = (),
    charge_power_w: float = 0.0,
) -> list[SocPoint]:
    """Simulate SoC from ``now`` in 15-minute steps (first step to the next quarter hour).

    Outside grid windows: SoC += (PV − load) × Δt / capacity. Inside a window the
    loads run from the grid and the battery gets ``charge_power_w`` plus PV, until
    SoC reaches the window's ceiling (then charging stops, as the runtime would).
    """
    cap = max(0.001, capacity_kwh)
    pv_sorted = sorted(pv, key=lambda p: p.start)
    win = sorted(windows, key=lambda w: w.start)
    points: list[SocPoint] = []
    done: set[int] = set()
    soc = clamp_soc(soc_now)
    k = 0
    t = now
    step_s = STEP.total_seconds()
    while t < until:
        epoch = t.timestamp()
        nxt = min(until, datetime.fromtimestamp((epoch // step_s + 1) * step_s, t.tzinfo))
        mid = t + (nxt - t) / 2
        while k < len(pv_sorted) and pv_sorted[k].end <= mid:
            k += 1
        pv_w = pv_sorted[k].w if k < len(pv_sorted) and pv_sorted[k].start <= mid else 0.0
        load_w = profile_w[mid.astimezone(tz).hour]
        hours = (nxt - t).total_seconds() / 3600
        active = next((i for i, w in enumerate(win) if w.start <= mid < w.end and i not in done), None)
        if active is not None and soc >= win[active].ceiling:
            done.add(active)
            active = None
        if active is not None:
            charge_ceiling = win[active].ceiling
            net = pv_w + charge_power_w
            grid_kwh = charge_power_w * hours / 1000
            new_soc = soc + net * hours / 1000 / cap * 100
            if new_soc > charge_ceiling:
                # Charging stops at the ceiling; count only the energy actually needed.
                grid_kwh = max(0.0, grid_kwh - (new_soc - charge_ceiling) / 100 * cap)
                new_soc = max(soc, charge_ceiling)
                # Once the ceiling is reached the window is over (no re-charging cycles).
                done.add(active)
            points.append(SocPoint(t, soc, soc, True, False, grid_kwh))
            soc = clamp_soc(new_soc)
        else:
            net = pv_w - load_w
            points.append(SocPoint(t, soc, soc, net > 0, False))
            soc = clamp_soc(soc + net * hours / 1000 / cap * 100)
        t = nxt
    points.append(SocPoint(until, soc, soc, False, False))
    return points


def first_charge_index(points: Sequence[SocPoint], from_grid: bool = False) -> int:
    """Index of the first point charging from PV (grid steps are ignored unless ``from_grid``)."""
    for i, p in enumerate(points):
        if p.charging and (from_grid or p.grid_kwh == 0):
            return i
    return -1


def analyze_days(days: Sequence[ForecastDay], points: Sequence[SocPoint], min_soc_pct: float) -> list[DayResult]:
    """Per day: morning low (until PV charging starts), peak after it and time of 100 %."""
    out: list[DayResult] = []
    for day in days:
        pts = [p for p in points if day.start <= p.t < day.end]
        if not pts:
            out.append(DayResult(day, measured=day.kind == "past"))
            continue
        c = first_charge_index(pts)
        before = pts if c < 0 else pts[: c + 1]
        # Morning low = after the night's grid charging (if any), before PV takes over.
        last_grid = max((i for i, p in enumerate(before) if p.grid_kwh > 0), default=-1)
        if 0 <= last_grid < len(before) - 1:
            before = before[last_grid + 1 :]
        trough = min(before, key=lambda p: p.lo)
        peak: SocPoint | None = None
        full_at: datetime | None = None
        if c >= 0:
            for p in pts[c:]:
                if peak is None or p.hi > peak.hi:
                    peak = p
                if full_at is None and p.hi >= FULL_SOC:
                    full_at = p.t
        out.append(
            DayResult(
                day,
                trough=trough.lo,
                trough_at=trough.t,
                peak=peak.hi if peak else None,
                peak_at=peak.t if peak else None,
                full_at=full_at,
                charges=c >= 0,
                risk=trough.lo < min_soc_pct,
                measured=all(p.measured for p in pts),
            )
        )
    return out


def with_grid(result: DayResult, kwh: float, windows: Sequence[ChargeWindow]) -> DayResult:
    return replace(result, grid_kwh=kwh, grid_windows=tuple(windows))
