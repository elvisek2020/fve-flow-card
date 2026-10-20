"""Low-tariff (NT) windows from the EG.D Distribuce HDO integration.

Two sources are supported:

- ``HDO_HOURLY`` on the "HDO Status" binary sensor: a dict of local 15-minute
  slots (``"2026-10-20T00:00:00": 3.83``) covering today and tomorrow. Values are
  the tariff prices (``price_nt`` / ``price_vt``; older versions 1.0 / 2.0), the
  lower one is NT. Preferred.
- Slot texts ``all_times_today`` / ``all_times_tomorrow`` of the "next HDO
  time" sensor (or ``hdo_times_today`` as one comma separated string), e.g.
  ``"00 - 07:15"``, ``"Zítra 21:15 - 23:59"``. Times are shortened by
  ``str.replace(':00', '')`` ("22:00:00" → "22") and "23:59" means midnight.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping, Sequence
from datetime import date, datetime, time, timedelta, tzinfo

from .forecast import ChargeWindow

_SLOT = re.compile(r"(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*-\s*(\d{1,2})(?::(\d{2}))?(?::\d{2})?")


def _at(day: date, hour: int, minute: int, tz: tzinfo) -> datetime:
    if hour == 23 and minute == 59:  # "until the end of the day"
        return datetime.combine(day + timedelta(days=1), time(0, 0), tz)
    if hour >= 24:
        return datetime.combine(day + timedelta(days=1), time(0, minute), tz)
    return datetime.combine(day, time(hour, minute), tz)


def parse_slots(texts: Iterable[str] | str | None, day: date, tz: tzinfo) -> list[ChargeWindow]:
    """Parse slot texts of one day; a slot ending before it starts runs past midnight."""
    if isinstance(texts, str):
        texts = texts.split(",")
    out: list[ChargeWindow] = []
    for text in texts or ():
        m = _SLOT.search(str(text))
        if not m:
            continue
        h0, m0, h1, m1 = int(m[1]), int(m[2] or 0), int(m[3]), int(m[4] or 0)
        start = _at(day, h0, m0, tz)
        end = _at(day, h1, m1, tz)
        if end <= start:
            end += timedelta(days=1)
        out.append(ChargeWindow(start, end))
    return out


def merge(windows: Iterable[ChargeWindow]) -> list[ChargeWindow]:
    """Sort and merge overlapping or touching windows."""
    out: list[ChargeWindow] = []
    for w in sorted(windows, key=lambda x: x.start):
        if out and w.start <= out[-1].end:
            last = out[-1]
            out[-1] = ChargeWindow(last.start, max(last.end, w.end))
        else:
            out.append(w)
    return out


def nt_windows(
    today_texts: Sequence[str] | None,
    tomorrow_texts: Sequence[str] | None,
    today: date,
    tz: tzinfo,
    horizon_days: int = 8,
) -> list[ChargeWindow]:
    """NT windows from today over ``horizon_days``; days after tomorrow repeat tomorrow's pattern."""
    windows = parse_slots(today_texts, today, tz)
    pattern = _texts(tomorrow_texts) or _texts(today_texts)
    for d in range(1, horizon_days):
        windows += parse_slots(pattern, today + timedelta(days=d), tz)
    return merge(windows)


def _texts(texts: Iterable[str] | str | None) -> list[str]:
    """Slot texts as a list; one comma separated string is split (never into characters)."""
    if not texts:
        return []
    if isinstance(texts, str):
        return [t for t in texts.split(",") if t.strip()]
    return list(texts)


def windows_from_hourly(
    slots: Mapping[str, object] | None, tz: tzinfo, nt_value: float | None = None
) -> list[ChargeWindow]:
    """NT windows from ``HDO_HOURLY`` (local ISO 15-minute slots).

    ``nt_value`` is the NT price (attribute ``price_nt``); without it the lower of
    the values is NT. One value only and no ``nt_value``: unknown → no windows.
    """
    parsed: list[tuple[datetime, float]] = []
    for key, value in (slots or {}).items():
        try:
            parsed.append((datetime.fromisoformat(str(key)), float(value)))  # type: ignore[arg-type]
        except (TypeError, ValueError):
            continue
    values = {v for _, v in parsed}
    if nt_value is None or not any(abs(v - nt_value) < 1e-6 for v in values):
        # No (or a non-matching) NT price, e.g. older 1.0 / 2.0 values: the lower is NT.
        if len(values) < 2:
            return []
        nt_value = min(values)
    out: list[ChargeWindow] = []
    for start, value in parsed:
        if abs(value - nt_value) > 1e-6:
            continue
        if start.tzinfo is None:
            start = start.replace(tzinfo=tz)
        out.append(ChargeWindow(start, start + timedelta(minutes=15)))
    return merge(out)


def extend_pattern(windows: Sequence[ChargeWindow], until: datetime, tz: tzinfo) -> list[ChargeWindow]:
    """Repeat the last known day's NT pattern up to ``until`` (HDO only knows today + tomorrow)."""
    if not windows:
        return []
    last_day = max(w.start for w in windows).astimezone(tz).date()
    # The last day's windows clipped to that day — including the part of a window
    # that started the evening before (e.g. 21:15 → 07:15 gives 00:00–07:15).
    day_start = datetime.combine(last_day, time(0, 0), tz)
    day_end = datetime.combine(last_day + timedelta(days=1), time(0, 0), tz)
    pattern = clip(windows, day_start, day_end)
    out = list(windows)
    shift = 1
    while True:
        added = False
        for w in pattern:
            s = _shift(w.start, shift, tz)
            if s >= until:
                continue
            out.append(ChargeWindow(s, _shift(w.end, shift, tz)))
            added = True
        if not added:
            break
        shift += 1
    return merge(out)


def _shift(t: datetime, days: int, tz: tzinfo) -> datetime:
    local = t.astimezone(tz)
    d = local.date() + timedelta(days=days)
    return datetime.combine(d, local.time().replace(tzinfo=None), tz)


def clip(windows: Iterable[ChargeWindow], start: datetime, end: datetime) -> list[ChargeWindow]:
    """Intersect windows with [start, end)."""
    out = []
    for w in windows:
        s, e = max(w.start, start), min(w.end, end)
        if e > s:
            out.append(ChargeWindow(s, e))
    return out
