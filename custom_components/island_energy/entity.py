"""Base entity of Hybrid Energy."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, NAME, OBJECT_IDS
from .runtime import IslandEnergyRuntime


class IslandEnergyEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    #: Platform domain of the concrete entity (sensor, switch …).
    _domain: str = ""

    def __init__(self, runtime: IslandEnergyRuntime, key: str) -> None:
        self.runtime = runtime
        entry_id = runtime.entry.entry_id
        self._attr_unique_id = f"{entry_id}_{key}"
        self._attr_translation_key = key
        # Fixed English entity_id regardless of the HA language (names stay translated).
        if self._domain:
            self.entity_id = f"{self._domain}.hybrid_energy_{OBJECT_IDS.get(key, key)}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name=NAME,
            manufacturer="elvisek2020",
            model="Plánovač ostrovní FVE",
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.runtime.async_add_listener(self.async_write_ha_state))
