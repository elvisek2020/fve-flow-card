"""Reading Home Assistant state and statistics into core inputs."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import UTC, date, datetime, timedelta, tzinfo
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.statistics import statistics_during_period
from homeassistant.core import HomeAssistant

from .core.forecast import (
    ChargeWindow,
    ForecastDay,
    HourRow,
    PvPeriod,
    parse_detailed,
    pv_periods_for_day,
)
from .core.hdo import extend_pattern, nt_windows, windows_from_hourly

UNAVAILABLE = ("unknown", "unavailable", "", None)


def state_float(hass: HomeAssistant, entity_id: str | None) -> float | None:
    """Numeric state of an entity, or None."""
    if not entity_id:
        return None
    st = hass.states.get(entity_id)
    if st is None or st.state in UNAVAILABLE:
        return None
    try:
        return float(st.state)
    except ValueError:
        return None


def capacity_kwh(hass: HomeAssistant, entity_id: str | None, nominal_voltage: float) -> float:
    """Battery capacity in kWh; Ah is converted with the nominal voltage (not the live one)."""
    value = state_float(hass, entity_id)
    if value is None or value <= 0:
        return 0.0
    unit = str(hass.states.get(entity_id).attributes.get("unit_of_measurement", "")).strip().lower()
    if unit in ("wh",):
        return value / 1000
    if unit in ("ah", "a·h", "a.h"):
        return value * (nominal_voltage if nominal_voltage > 0 else 48.0) / 1000
    return value


async def fetch_hourly(
    hass: HomeAssistant, entity_ids: Iterable[str | None], start: datetime, end: datetime
) -> dict[str, list[HourRow]]:
    """Hourly mean/min/max long-term statistics of the given entities."""
    ids = {e for e in entity_ids if e}
    if not ids:
        return {}
    raw: Mapping[str, list[Mapping[str, Any]]] = await get_instance(hass).async_add_executor_job(
        statistics_during_period, hass, start, end, ids, "hour", None, {"mean", "min", "max"}
    )
    out: dict[str, list[HourRow]] = {}
    for eid, rows in raw.items():
        out[eid] = [
            HourRow(_ts(r["start"]), r.get("mean"), r.get("min"), r.get("max"))
            for r in rows
            if r.get("start") is not None
        ]
    return out


def _ts(value: float | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromtimestamp(value, UTC)


def solcast_pv(
    hass: HomeAssistant, entity_ids: list[str | None], today: datetime
) -> tuple[list[PvPeriod], list[float | None]]:
    """PV periods for today + 6 days and the daily totals (kWh) from Solcast entities."""
    detailed: list[list[PvPeriod]] = []
    totals: list[float | None] = []
    for i, eid in enumerate(entity_ids):
        start = today + timedelta(days=i)
        st = hass.states.get(eid) if eid else None
        detailed.append(
            parse_detailed(st.attributes.get("detailedForecast") if st else None, start, start + timedelta(days=1))
        )
        totals.append(state_float(hass, eid))
    template = next((d for d in detailed if d), None)
    pv: list[PvPeriod] = []
    for i, d in enumerate(detailed):
        pv += pv_periods_for_day(today + timedelta(days=i), totals[i], d, template)
    return pv, totals


def hdo_windows(hass: HomeAssistant, entity_id: str | None, today: date, tz: tzinfo) -> list[ChargeWindow] | None:
    """NT windows from the EG.D Distribuce HDO integration; None = unknown (charge any time).

    Accepts the "HDO Status" binary sensor (``HDO_HOURLY``, preferred) or the
    "next HDO time" sensor (``all_times_today`` / ``all_times_tomorrow``).
    """
    if not entity_id:
        return None
    st = hass.states.get(entity_id)
    if st is None or st.state in ("unknown", "unavailable"):
        return None
    horizon = datetime.combine(today + timedelta(days=8), datetime.min.time(), tz)
    try:
        nt_price = float(st.attributes["price_nt"])
    except (KeyError, TypeError, ValueError):
        nt_price = None
    hourly = windows_from_hourly(st.attributes.get("HDO_HOURLY"), tz, nt_price)
    if hourly:
        return extend_pattern(hourly, horizon, tz)
    today_slots = st.attributes.get("all_times_today") or st.attributes.get("hdo_times_today")
    tomorrow_slots = st.attributes.get("all_times_tomorrow") or st.attributes.get("hdo_times_tomorrow")
    if not today_slots and not tomorrow_slots:
        return None
    return nt_windows(today_slots, tomorrow_slots, today, tz)


def day_energy(rows: Iterable[HourRow], start: datetime, end: datetime, sign: float = 1.0) -> float | None:
    """Energy (kWh) of hourly mean power rows within [start, end); None without data."""
    vals = [r.mean * sign for r in rows if r.mean is not None and start <= r.start < end]
    return round(sum(vals) / 1000, 2) if vals else None


def build_days(tz: tzinfo, now: datetime, past_days: int) -> tuple[list[ForecastDay], datetime]:
    """Past days + today + 6 days (local midnights). Energies are filled in later."""
    today = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    days: list[ForecastDay] = []
    for i in range(-past_days, 7):
        start = _local_midnight(today, i, tz)
        end = _local_midnight(today, i + 1, tz)
        kind = "past" if i < 0 else "today" if i == 0 else "tomorrow" if i == 1 else "future"
        days.append(ForecastDay(start.date().isoformat(), kind, start, end, None, None))
    return days, today


def _local_midnight(today: datetime, offset: int, tz: tzinfo) -> datetime:
    d = (today + timedelta(days=offset, hours=12)).date()
    return datetime(d.year, d.month, d.day, tzinfo=tz)
