"""Buttons: charge now, stop charging, skip tonight."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IslandEnergyConfigEntry
from .entity import IslandEnergyEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities(
        [ActionButton(rt, "charge_now"), ActionButton(rt, "stop_charging"), ActionButton(rt, "skip_tonight")]
    )


class ActionButton(IslandEnergyEntity, ButtonEntity):
    _domain = "button"

    def __init__(self, runtime, key: str) -> None:
        super().__init__(runtime, key)
        self._key = key

    async def async_press(self) -> None:
        if self._key == "charge_now":
            await self.runtime.async_charge_now()
        elif self._key == "stop_charging":
            await self.runtime.async_stop_charging()
        else:
            await self.runtime.async_skip_tonight()
