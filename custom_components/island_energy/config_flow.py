"""Config and options flow: which entities Hybrid Energy reads and controls."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_AC_IN_POWER,
    CONF_AC_IN_SWITCH,
    CONF_ACTIVE_INPUT,
    CONF_BATTERY_INVERT,
    CONF_BATTERY_POWER,
    CONF_CAPACITY,
    CONF_DAILY_LOAD,
    CONF_DC_POWER,
    CONF_FAN_SWITCH,
    CONF_HDO_SENSOR,
    CONF_INVERTER_POWER,
    CONF_INVERTER_STATE,
    CONF_NOMINAL_VOLTAGE,
    CONF_NOTIFY,
    CONF_PV_POWER,
    CONF_SOC,
    CONF_SOLCAST,
    DOMAIN,
    NAME,
)

SENSOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor"))
SWITCH = selector.EntitySelector(selector.EntitySelectorConfig(domain="switch"))


def _schema(values: dict[str, Any]) -> vol.Schema:
    def key(name: str, required: bool = False) -> vol.Marker:
        marker = vol.Required if required else vol.Optional
        if name in values and values[name] not in (None, ""):
            return marker(name, description={"suggested_value": values[name]})
        return marker(name)

    fields: dict[vol.Marker, Any] = {
        key(CONF_SOC, True): SENSOR,
        key(CONF_BATTERY_POWER, True): SENSOR,
        key(CONF_BATTERY_INVERT): selector.BooleanSelector(),
        key(CONF_PV_POWER, True): SENSOR,
        key(CONF_CAPACITY, True): SENSOR,
        vol.Optional(CONF_NOMINAL_VOLTAGE, default=values.get(CONF_NOMINAL_VOLTAGE, 48)): selector.NumberSelector(
            selector.NumberSelectorConfig(min=12, max=60, step=0.1, unit_of_measurement="V", mode="box")
        ),
        key(CONF_SOLCAST[0], True): SENSOR,
    }
    for name in CONF_SOLCAST[1:]:
        fields[key(name)] = SENSOR
    for name in (CONF_INVERTER_POWER, CONF_AC_IN_POWER, CONF_DC_POWER, CONF_ACTIVE_INPUT, CONF_INVERTER_STATE):
        fields[key(name)] = SENSOR
    fields[key(CONF_AC_IN_SWITCH)] = SWITCH
    fields[key(CONF_FAN_SWITCH)] = SWITCH
    fields[key(CONF_HDO_SENSOR)] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain=["binary_sensor", "sensor"])
    )
    fields[key(CONF_DAILY_LOAD)] = SENSOR
    fields[key(CONF_NOTIFY)] = selector.TextSelector()
    return vol.Schema(fields)


class IslandEnergyConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title=NAME, data=user_input)
        return self.async_show_form(step_id="user", data_schema=_schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return IslandEnergyOptionsFlow()


class IslandEnergyOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            # Options replace the whole entity set; cleared optional fields are dropped.
            return self.async_create_entry(data=user_input)
        values = {**self.config_entry.data, **self.config_entry.options}
        return self.async_show_form(step_id="init", data_schema=_schema(values))
