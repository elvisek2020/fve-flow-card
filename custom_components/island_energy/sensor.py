"""Sensors: grid charge plan, next charging, forecast (for the card) and status."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE, UnitOfEnergy
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IslandEnergyConfigEntry
from .entity import IslandEnergyEntity

STATUSES = ["shadow", "idle", "planned", "charging", "manual", "external", "skipped", "fault"]


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities(
        [
            PlanSensor(rt, "grid_charge_plan"),
            NextChargeSensor(rt, "next_charge"),
            ForecastSensor(rt, "forecast"),
            StatusSensor(rt, "status"),
        ]
    )


class PlanSensor(IslandEnergyEntity, SensorEntity):
    """Energy to charge from AC IN for the next night (kWh)."""

    _domain = "sensor"

    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_suggested_display_precision = 1

    @property
    def native_value(self) -> float | None:
        night = self.runtime.result.next_night if self.runtime.result else None
        return night.needed_kwh if night else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        night = self.runtime.result.next_night if self.runtime.result else None
        if night is None:
            return {"reason": self.runtime.reason()}
        return {
            "target_day": night.target_day.isoformat(),
            "deadline": night.deadline.isoformat(),
            "ceiling": night.ceiling,
            "windows": [{"start": w.start.isoformat(), "end": w.end.isoformat()} for w in night.windows],
            "short": night.short,
            "reason": self.runtime.reason(),
            "hdo": self.runtime.nt is not None,
            "learned_charge_power_w": round(self.runtime.learned_charge_w) if self.runtime.learned_charge_w else None,
        }


class NextChargeSensor(IslandEnergyEntity, SensorEntity):
    """Start of the next planned charging window."""

    _domain = "sensor"

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime | None:
        window = self.runtime.next_window
        return window.start if window else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        window = self.runtime.next_window
        return {"end": window.end.isoformat() if window else None}


class ForecastSensor(IslandEnergyEntity, SensorEntity):
    """Next morning low (%); the attribute ``days`` is the forecast table shown by the card."""

    _domain = "sensor"

    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0
    _unrecorded_attributes = frozenset({"days", "profile_w"})

    @property
    def native_value(self) -> float | None:
        upcoming = [d for d in self.runtime.days if d.day.kind in ("today", "tomorrow") and d.trough is not None]
        now = self.runtime.generated
        nxt = next((d for d in upcoming if now and d.trough_at and d.trough_at > now), None)
        return round(nxt.trough, 1) if nxt else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        rt = self.runtime
        return {
            "days": rt.days_export(),
            "capacity_kwh": round(rt.capacity, 2),
            "daily_load_kwh": round(sum(rt.profile) / 1000, 2) if rt.profile else None,
            "load_source": rt.load_source,
            "min_soc": rt.settings.get("min_soc"),
            "ceiling": rt.settings.get("ceiling"),
            "generated": rt.generated.isoformat() if rt.generated else None,
            "profile_w": [round(w) for w in rt.profile],
        }


class StatusSensor(IslandEnergyEntity, SensorEntity):
    _domain = "sensor"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATUSES

    @property
    def native_value(self) -> str:
        return self.runtime.status

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        rt = self.runtime
        return {
            "manual_target": rt.manual.target if rt.manual else None,
            "session_target": rt.session.target if rt.session else None,
            "suppressed_until": rt.suppress_until.isoformat() if rt.suppress_until else None,
            "skip_until": rt.skip_night.isoformat() if rt.skip_night else None,
        }
