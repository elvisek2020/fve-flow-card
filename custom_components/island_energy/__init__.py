"""Hybrid Energy: island PV battery forecast, grid (AC IN) charge planning and cooling.

The integration also ships the Lovelace cards ``custom:fve-flow-card`` and
``custom:fve-flow-mini-card`` and registers them as an extra frontend module.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from pathlib import Path

import voluptuous as vol
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .const import DOMAIN, FRONTEND_FILE, FRONTEND_URL
from .runtime import IslandEnergyRuntime

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.SWITCH, Platform.NUMBER, Platform.BUTTON]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type IslandEnergyConfigEntry = ConfigEntry[IslandEnergyRuntime]

CHARGE_NOW_SCHEMA = vol.Schema(
    {
        vol.Optional("target_soc"): vol.All(vol.Coerce(float), vol.Range(min=1, max=100)),
        vol.Optional("duration"): vol.All(vol.Coerce(int), vol.Range(min=15, max=1440)),
    }
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    await _register_frontend(hass)
    _register_services(hass)
    return True


async def _register_frontend(hass: HomeAssistant) -> None:
    """Serve the bundled cards and load them on every dashboard."""
    path = Path(__file__).parent / FRONTEND_FILE
    if "frontend" not in hass.config.components or getattr(hass, "http", None) is None:
        return
    if not await hass.async_add_executor_job(path.exists):
        _LOGGER.warning("Card bundle %s not found, the Lovelace cards will not be loaded", path)
        return
    await hass.http.async_register_static_paths([StaticPathConfig(FRONTEND_URL, str(path), True)])
    integration = await async_get_integration(hass, DOMAIN)
    add_extra_js_url(hass, f"{FRONTEND_URL}?v={integration.version}")


async def async_setup_entry(hass: HomeAssistant, entry: IslandEnergyConfigEntry) -> bool:
    runtime = IslandEnergyRuntime(hass, entry)
    entry.runtime_data = runtime
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_create_background_task(hass, runtime.async_start(), f"{DOMAIN} start")
    entry.async_on_unload(runtime.async_stop)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: IslandEnergyConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_reload(hass: HomeAssistant, entry: IslandEnergyConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


def _runtime(hass: HomeAssistant) -> IslandEnergyRuntime:
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_loaded")


def _register_services(hass: HomeAssistant) -> None:
    async def charge_now(call: ServiceCall) -> None:
        duration = call.data.get("duration")
        await _runtime(hass).async_charge_now(
            call.data.get("target_soc"), timedelta(minutes=duration) if duration else None
        )

    async def stop_charging(call: ServiceCall) -> None:
        await _runtime(hass).async_stop_charging()

    async def skip_tonight(call: ServiceCall) -> None:
        await _runtime(hass).async_skip_tonight()

    async def recompute(call: ServiceCall) -> None:
        runtime = _runtime(hass)
        await runtime.async_refresh_history()
        await runtime.async_recompute()

    hass.services.async_register(DOMAIN, "charge_now", charge_now, schema=CHARGE_NOW_SCHEMA)
    hass.services.async_register(DOMAIN, "stop_charging", stop_charging)
    hass.services.async_register(DOMAIN, "skip_tonight", skip_tonight)
    hass.services.async_register(DOMAIN, "recompute", recompute)
