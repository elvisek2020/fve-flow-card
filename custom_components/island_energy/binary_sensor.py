"""Binary sensors: charging from the grid, low tariff now."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.const import STATE_ON
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

from . import IslandEnergyConfigEntry
from .const import CONF_AC_IN_SWITCH, CONF_AC_IN_VOLTAGE, CONF_ACTIVE_INPUT
from .entity import IslandEnergyEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities([ChargingSensor(rt, "charging"), LowTariffSensor(rt, "low_tariff")])


class ChargingSensor(IslandEnergyEntity, BinarySensorEntity):
    """AC IN is on and the GX uses the grid as its active input."""

    _domain = "binary_sensor"

    _attr_device_class = BinarySensorDeviceClass.BATTERY_CHARGING

    @property
    def is_on(self) -> bool | None:
        cfg = self.runtime.cfg
        sw = self.hass.states.get(cfg.get(CONF_AC_IN_SWITCH) or "")
        if sw is None:
            return None
        # Switched on without grid (tripped breaker / RCD) is not charging.
        return sw.state == STATE_ON and self.runtime.grid_present() is not False

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        cfg = self.runtime.cfg
        keys = (CONF_AC_IN_SWITCH, CONF_ACTIVE_INPUT, CONF_AC_IN_VOLTAGE)
        watched = [e for e in (cfg.get(k) for k in keys) if e]
        if watched:
            self.async_on_remove(async_track_state_change_event(self.hass, watched, self._changed))

    @callback
    def _changed(self, _event) -> None:
        self.async_write_ha_state()


class LowTariffSensor(IslandEnergyEntity, BinarySensorEntity):
    """Now is inside a low-tariff (NT) window; unknown without the HDO sensor."""

    _domain = "binary_sensor"

    @property
    def is_on(self) -> bool | None:
        if self.runtime.nt is None:
            return None
        now = dt_util.now()
        return any(w.start <= now < w.end for w in self.runtime.nt)
