"""Hybrid Energy: island PV battery forecast, grid (AC IN) charge planning and cooling.

The integration also ships the Lovelace cards ``custom:fve-flow-card`` and
``custom:fve-flow-mini-card`` and registers them as a Lovelace resource
(storage mode) or an extra frontend module (YAML mode).
"""

from __future__ import annotations

import logging
from datetime import timedelta
from pathlib import Path

import voluptuous as vol
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .const import DOMAIN, FRONTEND_FILE, FRONTEND_URL
from .runtime import STORAGE_VERSION, IslandEnergyRuntime

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
    url = f"{FRONTEND_URL}?v={integration.version}"
    # Lovelace resources load before the dashboard renders its cards; an extra JS
    # module races with it and a card may stay "Custom element doesn't exist".
    if not await _async_register_resource(hass, url):
        add_extra_js_url(hass, url)


def _lovelace_resources(hass: HomeAssistant) -> ResourceStorageCollection | None:
    """The storage-mode resource collection, or None (YAML mode / no Lovelace)."""
    data = hass.data.get(LOVELACE_DATA)
    resources = getattr(data, "resources", None)
    return resources if isinstance(resources, ResourceStorageCollection) else None


def _is_ours(item: dict) -> bool:
    """Our resource: the same path, whatever ``?v=`` it carries."""
    return str(item.get("url", "")).split("?", 1)[0] == FRONTEND_URL


async def _async_register_resource(hass: HomeAssistant, url: str) -> bool:
    """Create or update the card bundle as a Lovelace module resource."""
    resources = _lovelace_resources(hass)
    if resources is None:
        return False
    try:
        await resources.async_get_info()  # loads the collection from storage
        ours = [item for item in resources.async_items() if _is_ours(item)]
        if not ours:
            await resources.async_create_item({"res_type": "module", "url": url})
        else:
            first, *extra = ours
            if first.get("url") != url or first.get("type") != "module":
                await resources.async_update_item(first["id"], {"res_type": "module", "url": url})
            for item in extra:
                await resources.async_delete_item(item["id"])
    except Exception:
        _LOGGER.exception("Could not register the card bundle as a Lovelace resource")
        return False
    return True


async def async_remove_entry(hass: HomeAssistant, entry: IslandEnergyConfigEntry) -> None:
    """Integration removed: drop the saved control state and the card resource."""
    await Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}").async_remove()
    resources = _lovelace_resources(hass)
    if resources is None:
        return
    await resources.async_get_info()
    for item in list(resources.async_items()):
        if _is_ours(item):
            await resources.async_delete_item(item["id"])


async def async_setup_entry(hass: HomeAssistant, entry: IslandEnergyConfigEntry) -> bool:
    runtime = IslandEnergyRuntime(hass, entry)
    entry.runtime_data = runtime
    await runtime.async_restore()  # before the entities restore their settings
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
