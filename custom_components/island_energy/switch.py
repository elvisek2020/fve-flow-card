"""Switches: allow automatic charging, allow automatic cooling (restored, default off)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import IslandEnergyConfigEntry
from .const import SET_AUTO_CHARGING, SET_AUTO_COOLING
from .entity import IslandEnergyEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities([SettingSwitch(rt, SET_AUTO_CHARGING), SettingSwitch(rt, SET_AUTO_COOLING)])


class SettingSwitch(IslandEnergyEntity, SwitchEntity, RestoreEntity):
    def __init__(self, runtime, key: str) -> None:
        super().__init__(runtime, key)
        self._key = key

    @property
    def is_on(self) -> bool:
        return bool(self.runtime.settings[self._key])

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is not None and last.state in ("on", "off"):
            self.runtime.set_setting(self._key, last.state == STATE_ON)

    async def async_turn_on(self, **kwargs: Any) -> None:
        self.runtime.set_setting(self._key, True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        self.runtime.set_setting(self._key, False)
