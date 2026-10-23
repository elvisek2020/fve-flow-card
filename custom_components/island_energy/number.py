"""Numbers: planner and cooling settings (restored after restart)."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.components.number import NumberEntityDescription, NumberMode, RestoreNumber
from homeassistant.const import PERCENTAGE, UnitOfPower
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IslandEnergyConfigEntry
from .const import (
    SET_CEILING,
    SET_CHARGE_POWER,
    SET_COOLING_OFF,
    SET_COOLING_ON,
    SET_MIN_SOC,
    SET_RESERVE,
)
from .entity import IslandEnergyEntity


@dataclass(frozen=True, kw_only=True)
class SettingDescription(NumberEntityDescription):
    pass


DESCRIPTIONS = (
    SettingDescription(
        key=SET_CEILING, native_min_value=50, native_max_value=100, native_step=1, native_unit_of_measurement=PERCENTAGE
    ),
    SettingDescription(
        key=SET_MIN_SOC, native_min_value=5, native_max_value=60, native_step=1, native_unit_of_measurement=PERCENTAGE
    ),
    SettingDescription(
        key=SET_CHARGE_POWER,
        native_min_value=500,
        native_max_value=6000,
        native_step=100,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    SettingDescription(
        key=SET_RESERVE, native_min_value=10, native_max_value=80, native_step=1, native_unit_of_measurement=PERCENTAGE
    ),
    SettingDescription(
        key=SET_COOLING_ON,
        native_min_value=100,
        native_max_value=5000,
        native_step=50,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    SettingDescription(
        key=SET_COOLING_OFF,
        native_min_value=100,
        native_max_value=5000,
        native_step=50,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    rt = entry.runtime_data
    async_add_entities(SettingNumber(rt, d) for d in DESCRIPTIONS)


class SettingNumber(IslandEnergyEntity, RestoreNumber):
    _domain = "number"
    _attr_mode = NumberMode.BOX
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, runtime, description: SettingDescription) -> None:
        super().__init__(runtime, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> float:
        return float(self.runtime.settings[self.entity_description.key])

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_number_data()
        if last is not None and last.native_value is not None:
            self.runtime.set_setting(self.entity_description.key, float(last.native_value))

    async def async_set_native_value(self, value: float) -> None:
        self.runtime.set_setting(self.entity_description.key, value)
