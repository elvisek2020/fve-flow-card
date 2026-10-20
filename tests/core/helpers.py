"""Synthetic data for core tests."""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from custom_components.island_energy.core.forecast import ForecastDay, PvPeriod

TZ = ZoneInfo("Europe/Prague")


def at(d: date, hour: int, minute: int = 0) -> datetime:
    return datetime(d.year, d.month, d.day, hour, minute, tzinfo=TZ)


def midnight(d: date) -> datetime:
    return at(d, 0)


def pv_day(d: date, kwh: float) -> list[PvPeriod]:
    """Half-hour sine between 7 and 19 h, scaled to ``kwh``."""
    shape = []
    for i in range(24):
        start = at(d, 7) + timedelta(minutes=30 * i)
        h = 7 + (i + 0.5) / 2
        shape.append((start, math.sin(math.pi * (h - 7) / 12)))
    total = sum(w * 0.5 / 1000 for _, w in shape)
    return [PvPeriod(s, s + timedelta(minutes=30), w * kwh / total) for s, w in shape]


def days_from(first: date, count: int = 7) -> list[ForecastDay]:
    kinds = ["today", "tomorrow"] + ["future"] * (count - 2)
    out = []
    for i in range(count):
        d = first + timedelta(days=i)
        out.append(ForecastDay(d.isoformat(), kinds[i], midnight(d), midnight(d + timedelta(days=1)), None, None))
    return out


#: Flat 600 W load = 14.4 kWh/day.
FLAT_600 = [600.0] * 24
