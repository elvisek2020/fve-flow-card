"""Integration tests: config flow, entities, shadow mode and AC IN control."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.island_energy.const import DOMAIN

TZ = "Europe/Prague"
CONFIG = {
    "soc": "sensor.soc",
    "battery_power": "sensor.bat",
    "pv_power": "sensor.pv",
    "capacity": "sensor.cap",
    "nominal_voltage": 50,
    "solcast_today": "sensor.sc_today",
    "solcast_tomorrow": "sensor.sc_tomorrow",
    "ac_in_switch": "switch.ac_in",
    "active_input": "sensor.active_input",
    "fan_switch": "switch.fan",
    "inverter_power": "sensor.ac_out",
    "daily_load": "sensor.daily",
}


def detailed(day: datetime, kwh: float) -> list[dict]:
    """Half hours between 8 and 16 h with ``kwh`` spread evenly."""
    per = kwh / 16
    return [
        {"period_start": (day + timedelta(hours=8, minutes=30 * i)).isoformat(), "pv_estimate": per * 2}
        for i in range(16)
    ]


async def setup_states(hass: HomeAssistant, soc: float, now: datetime) -> None:
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    hass.states.async_set("sensor.soc", str(soc), {"unit_of_measurement": "%"})
    hass.states.async_set("sensor.bat", "-500", {"unit_of_measurement": "W"})
    hass.states.async_set("sensor.pv", "0", {"unit_of_measurement": "W"})
    hass.states.async_set("sensor.cap", "400", {"unit_of_measurement": "Ah"})
    hass.states.async_set("sensor.daily", "14.4", {"unit_of_measurement": "kWh"})
    hass.states.async_set("sensor.sc_today", "10", {"detailedForecast": detailed(today, 10)})
    hass.states.async_set("sensor.sc_tomorrow", "4", {"detailedForecast": detailed(today + timedelta(days=1), 4)})
    hass.states.async_set("switch.ac_in", "off")
    hass.states.async_set("switch.fan", "off")
    hass.states.async_set("sensor.active_input", "not_connected")
    hass.states.async_set("sensor.ac_out", "450", {"unit_of_measurement": "W"})


@pytest.fixture
async def ready(hass: HomeAssistant, freezer):
    await hass.config.async_set_time_zone(TZ)
    now = datetime(2026, 10, 20, 22, 0, tzinfo=dt_util.get_time_zone(TZ))
    freezer.move_to(now)
    await setup_states(hass, 40, now)
    entry = MockConfigEntry(domain=DOMAIN, data=CONFIG, title="Hybrid Energy")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    # Plán se počítá v úloze na pozadí (start integrace) — počkat i na ni.
    await hass.async_block_till_done(wait_background_tasks=True)
    yield entry
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


async def test_config_flow_creates_entry(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], CONFIG)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["soc"] == "sensor.soc"


async def test_setup_plans_in_shadow_mode(hass: HomeAssistant, ready) -> None:
    turn_on = async_mock_service(hass, "switch", "turn_on")
    forecast = hass.states.get("sensor.hybrid_energy_battery_forecast")
    assert forecast is not None
    assert len(forecast.attributes["days"]) == 12
    plan = hass.states.get("sensor.hybrid_energy_grid_charge_plan")
    assert float(plan.state) > 0  # weak tomorrow → grid needed
    assert plan.attributes["windows"]
    assert hass.states.get("sensor.hybrid_energy_planner_status").state == "shadow"
    await ready.runtime_data.async_control()
    assert turn_on == []  # shadow mode never switches


async def test_auto_charging_switches_on_inside_window(hass: HomeAssistant, ready, freezer) -> None:
    turn_on = async_mock_service(hass, "switch", "turn_on")
    rt = ready.runtime_data
    rt.set_setting("auto_charging", True)
    window = rt.result.next_night.windows[0]
    freezer.move_to(window.start + timedelta(minutes=5))
    await rt.async_control()
    assert [c.data["entity_id"] for c in turn_on if c.data["entity_id"] == "switch.ac_in"] == ["switch.ac_in"]


async def test_charge_now_and_stop(hass: HomeAssistant, ready) -> None:
    turn_on = async_mock_service(hass, "switch", "turn_on")
    turn_off = async_mock_service(hass, "switch", "turn_off")
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 80}, blocking=True)
    assert turn_on and turn_on[-1].data["entity_id"] == "switch.ac_in"
    hass.states.async_set("switch.ac_in", "on")
    await hass.services.async_call(DOMAIN, "stop_charging", {}, blocking=True)
    assert turn_off and turn_off[-1].data["entity_id"] == "switch.ac_in"


async def test_external_switch_on_is_not_fought(hass: HomeAssistant, ready) -> None:
    turn_off = async_mock_service(hass, "switch", "turn_off")
    rt = ready.runtime_data
    rt.set_setting("auto_charging", True)
    hass.states.async_set("switch.ac_in", "on")  # e.g. the failsafe automation
    await rt.async_control()
    assert turn_off == []
    assert rt.status == "external"


async def test_entity_ids_are_english_in_czech_ha(hass: HomeAssistant, freezer) -> None:
    """entity_id must not follow the HA language — the card looks them up."""
    hass.config.language = "cs"
    await hass.config.async_set_time_zone(TZ)
    now = datetime(2026, 10, 20, 22, 0, tzinfo=dt_util.get_time_zone(TZ))
    freezer.move_to(now)
    await setup_states(hass, 40, now)
    entry = MockConfigEntry(domain=DOMAIN, data=CONFIG, title="Hybrid Energy")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    for eid in (
        "sensor.hybrid_energy_battery_forecast",
        "sensor.hybrid_energy_grid_charge_plan",
        "sensor.hybrid_energy_planner_status",
        "binary_sensor.hybrid_energy_grid_charging",
        "switch.hybrid_energy_allow_automatic_charging",
        "button.hybrid_energy_charge_now",
        "number.hybrid_energy_minimum_soc",
    ):
        assert hass.states.get(eid) is not None, eid
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


async def test_card_bundle_is_a_lovelace_resource(hass: HomeAssistant, hass_storage) -> None:
    from homeassistant.components.lovelace.const import LOVELACE_DATA
    from homeassistant.setup import async_setup_component

    from custom_components.island_energy import _async_register_resource, async_remove_entry
    from custom_components.island_energy.const import FRONTEND_URL

    hass_storage["lovelace_resources"] = {
        "version": 1,
        "key": "lovelace_resources",
        "data": {
            "items": [
                {"id": "other", "type": "module", "url": "/hacsfiles/other/other.js"},
                {"id": "map", "type": "js", "url": f"{FRONTEND_URL}.map"},
                {"id": "old", "type": "js", "url": f"{FRONTEND_URL}?v=2.0.4"},
                {"id": "dup", "type": "module", "url": f"{FRONTEND_URL}?v=2.0.3"},
            ]
        },
    }
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data[LOVELACE_DATA].resources

    assert await _async_register_resource(hass, f"{FRONTEND_URL}?v=9.9.9")
    items = {i["id"]: i for i in resources.async_items()}
    # stale version updated in place, duplicate removed, foreign resource kept
    assert items["old"]["url"] == f"{FRONTEND_URL}?v=9.9.9"
    assert items["old"]["type"] == "module"
    assert "dup" not in items and "other" in items and "map" in items

    # idempotent: a second run creates nothing new
    assert await _async_register_resource(hass, f"{FRONTEND_URL}?v=9.9.9")
    assert len(resources.async_items()) == 3

    await async_remove_entry(hass, MockConfigEntry(domain=DOMAIN))
    assert sorted(i["id"] for i in resources.async_items()) == ["map", "other"]


async def test_card_resource_created_when_missing(hass: HomeAssistant) -> None:
    from homeassistant.components.lovelace.const import LOVELACE_DATA
    from homeassistant.setup import async_setup_component

    from custom_components.island_energy import _async_register_resource
    from custom_components.island_energy.const import FRONTEND_URL

    assert await async_setup_component(hass, "lovelace", {})
    assert await _async_register_resource(hass, f"{FRONTEND_URL}?v=1.0.0")
    (item,) = hass.data[LOVELACE_DATA].resources.async_items()
    assert item["type"] == "module" and item["url"] == f"{FRONTEND_URL}?v=1.0.0"
