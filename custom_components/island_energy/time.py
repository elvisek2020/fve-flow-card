"""Times: night charging interval "charge from" / "charge until" (restored after restart)."""

from __future__ import annotations

from datetime import time

from homeassistant.components.time import TimeEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import IslandEnergyConfigEntry
from .const import SET_NIGHT_END, SET_NIGHT_START
from .core.planner import hours_to_time
from .entity import IslandEnergyEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities([SettingTime(rt, SET_NIGHT_START), SettingTime(rt, SET_NIGHT_END)])


class SettingTime(IslandEnergyEntity, TimeEntity, RestoreEntity):
    _domain = "time"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, runtime, key: str) -> None:
        super().__init__(runtime, key)
        self._key = key

    @property
    def native_value(self) -> time:
        return hours_to_time(float(self.runtime.settings[self._key]))

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is None:
            return
        try:
            value = time.fromisoformat(last.state)
        except ValueError:
            return
        self.runtime.set_setting(self._key, value.hour + value.minute / 60)

    async def async_set_value(self, value: time) -> None:
        self.runtime.set_setting(self._key, value.hour + value.minute / 60)
