"""Integration tests: config flow, entities, shadow mode and AC IN control."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

import pytest
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed, async_mock_service

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


def switch_service(
    hass: HomeAssistant,
    calls: list[tuple[str, bool]],
    gx_follows_ignore: bool = True,
    lagging: frozenset[str] = frozenset(),
) -> None:
    """Switch services that change the state; "ignore AC in" moves the GX input like a Victron.

    ``lagging`` switches do not update their state (read back later from the device).
    """

    async def handle(call) -> None:
        on = call.service == "turn_on"
        ids = call.data["entity_id"]
        for eid in [ids] if isinstance(ids, str) else ids:
            calls.append((eid, on))
            if eid not in lagging:
                hass.states.async_set(eid, "on" if on else "off")
            if eid == "switch.ignore" and gx_follows_ignore:
                hass.states.async_set("sensor.active_input", "not_connected" if on else "grid")

    hass.services.async_register("switch", "turn_on", handle)
    hass.services.async_register("switch", "turn_off", handle)


async def start_with(hass: HomeAssistant, freezer, extra: dict, ac_in_on: bool = False) -> MockConfigEntry:
    await hass.config.async_set_time_zone(TZ)
    now = datetime(2026, 10, 20, 22, 0, tzinfo=dt_util.get_time_zone(TZ))
    freezer.move_to(now)
    await setup_states(hass, 40, now)
    if ac_in_on:
        hass.states.async_set("switch.ac_in", "on")
        hass.states.async_set("sensor.active_input", "grid")
    entry = MockConfigEntry(domain=DOMAIN, data={**CONFIG, **extra}, title="Hybrid Energy", entry_id="he1")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    return entry


async def test_graceful_disconnect_ignores_ac_input_first(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {"ignore_ac_in_switch": "switch.ignore"})
    hass.states.async_set("switch.ignore", "off")
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    await hass.services.async_call(DOMAIN, "charge_now", {}, blocking=True)
    hass.states.async_set("sensor.active_input", "grid")
    calls.clear()
    await hass.services.async_call(DOMAIN, "stop_charging", {}, blocking=True)
    # ignore AC in → (GX leaves the grid) → open the contactor → stop ignoring
    assert calls == [("switch.ignore", True), ("switch.ac_in", False), ("switch.ignore", False)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_graceful_disconnect_times_out(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {"ignore_ac_in_switch": "switch.ignore"})
    hass.states.async_set("switch.ignore", "off")
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls, gx_follows_ignore=False)
    await hass.services.async_call(DOMAIN, "charge_now", {}, blocking=True)
    hass.states.async_set("sensor.active_input", "grid")
    calls.clear()
    task = hass.async_create_task(hass.services.async_call(DOMAIN, "stop_charging", {}, blocking=True))
    for _ in range(10):
        await asyncio.sleep(0)
    assert calls == [("switch.ignore", True)]  # waiting for the GX to leave the grid
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await task
    # the GX did not let go: the contactor opens anyway
    assert calls == [("switch.ignore", True), ("switch.ac_in", False), ("switch.ignore", False)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_on_without_grid_voltage_is_a_fault(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {"ac_in_voltage": "sensor.ac_in_v"})
    rt = entry.runtime_data
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    hass.states.async_set("sensor.ac_in_v", "0", {"unit_of_measurement": "V"})
    await hass.services.async_call(DOMAIN, "charge_now", {}, blocking=True)
    assert rt.grid_present() is False
    await rt.async_control()
    assert rt.status == "manual" and hass.states.get("switch.ac_in").state == "on"

    freezer.tick(timedelta(minutes=2, seconds=5))
    await rt.async_control()
    await hass.async_block_till_done()
    assert rt.status == "fault"
    assert calls[-1] == ("switch.ac_in", False)
    assert hass.states.get("sensor.hybrid_energy_planner_status").state == "fault"
    assert hass.states.get("binary_sensor.hybrid_energy_grid_charging").state == "off"

    # no automatic retry while the fault lasts; "charge now" retries at once
    rt.set_setting("auto_charging", True)
    await rt.async_control()
    assert hass.states.get("switch.ac_in").state == "off"
    hass.states.async_set("sensor.ac_in_v", "231", {"unit_of_measurement": "V"})
    await hass.services.async_call(DOMAIN, "charge_now", {}, blocking=True)
    assert rt.status == "manual" and hass.states.get("switch.ac_in").state == "on"
    await hass.config_entries.async_unload(entry.entry_id)


async def test_running_charge_is_on_the_plan_sensor(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {})
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 80}, blocking=True)
    await hass.async_block_till_done()
    session = hass.states.get("sensor.hybrid_energy_grid_charge_plan").attributes["session"]
    # 400 Ah × 50 V = 20 kWh, 40 → 80 % = 8 kWh at the 2600 W setting ≈ 3 h 5 min
    assert session["kind"] == "manual" and session["target"] == 80
    assert session["remaining_kwh"] == 8.0
    eta = dt_util.parse_datetime(session["eta"])
    assert timedelta(hours=3) < eta - dt_util.now() < timedelta(hours=3, minutes=10)
    await hass.config_entries.async_unload(entry.entry_id)


async def test_control_state_is_saved(hass: HomeAssistant, freezer, hass_storage) -> None:
    entry = await start_with(hass, freezer, {})
    switch_service(hass, [])
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 80}, blocking=True)
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
    await hass.async_block_till_done()
    data = hass_storage[f"{DOMAIN}.he1"]["data"]
    assert data["we_switched_on"] is True
    assert data["manual"]["target"] == 80
    await hass.config_entries.async_unload(entry.entry_id)


async def test_restart_mid_charge_keeps_ownership(hass: HomeAssistant, freezer, hass_storage) -> None:
    until = datetime(2026, 10, 21, 1, 0, tzinfo=dt_util.get_time_zone(TZ))
    hass_storage[f"{DOMAIN}.he1"] = {
        "version": 1,
        "key": f"{DOMAIN}.he1",
        "data": {
            "we_switched_on": True,
            "manual": None,
            "session": {"target": 60.0, "until": until.isoformat()},
            "suppress_until": None,
            "skip_night": None,
            "fault_until": None,
            "last_switch": None,
        },
    }
    entry = await start_with(hass, freezer, {}, ac_in_on=True)
    rt = entry.runtime_data
    assert rt.status == "charging"  # ours again, not "external"
    assert rt.session is not None and rt.session.target == 60.0
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    rt.set_setting("auto_charging", True)
    hass.states.async_set("sensor.soc", "61", {"unit_of_measurement": "%"})
    await rt.async_control()
    # target reached → we switch off what we switched on before the restart
    assert calls == [("switch.ac_in", False)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_restored_ownership_drops_when_ac_in_is_off(hass: HomeAssistant, freezer, hass_storage) -> None:
    hass_storage[f"{DOMAIN}.he1"] = {"version": 1, "key": f"{DOMAIN}.he1", "data": {"we_switched_on": True}}
    entry = await start_with(hass, freezer, {})
    rt = entry.runtime_data
    await rt.async_control()
    hass.states.async_set("switch.ac_in", "on")  # e.g. the failsafe automation
    await rt.async_control()
    assert rt.status == "external"
    await hass.config_entries.async_unload(entry.entry_id)


async def test_ignore_is_released_even_when_its_state_lags(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {"ignore_ac_in_switch": "switch.ignore"}, ac_in_on=True)
    hass.states.async_set("switch.ignore", "off")
    hass.states.async_set("sensor.active_input", "not_connected")  # input already dead
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls, lagging=frozenset({"switch.ignore"}))
    await hass.services.async_call(DOMAIN, "stop_charging", {}, blocking=True)
    assert calls == [("switch.ignore", True), ("switch.ac_in", False), ("switch.ignore", False)]
    await hass.async_block_till_done()
    # the contactor is off: no longer "external"
    assert hass.states.get("sensor.hybrid_energy_planner_status").state == "shadow"
    await hass.config_entries.async_unload(entry.entry_id)


async def test_stale_ignore_is_released_after_start(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {"ignore_ac_in_switch": "switch.ignore"})
    hass.states.async_set("switch.ignore", "on")
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    await entry.runtime_data.async_control()
    assert calls == [("switch.ignore", False)]
    await entry.runtime_data.async_control()  # only once after a start
    assert calls == [("switch.ignore", False)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_manual_charge_survives_restart_with_restored_settings(
    hass: HomeAssistant, freezer, hass_storage
) -> None:
    from homeassistant.core import State
    from pytest_homeassistant_custom_component.common import mock_restore_cache

    until = datetime(2026, 10, 21, 9, 59, tzinfo=dt_util.get_time_zone(TZ))
    hass_storage[f"{DOMAIN}.he1"] = {
        "version": 1,
        "key": f"{DOMAIN}.he1",
        "data": {"we_switched_on": True, "manual": {"target": 90.0, "until": until.isoformat()}},
    }
    # restored settings are applied while the entities are added (this used to save
    # an empty state over the file before it was read)
    mock_restore_cache(hass, [State("switch.hybrid_energy_allow_automatic_charging", "on")])
    entry = await start_with(hass, freezer, {}, ac_in_on=True)
    rt = entry.runtime_data
    assert rt.settings["auto_charging"] is True
    assert rt.manual is not None and rt.manual.target == 90.0
    assert rt.status == "manual"
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
    await hass.async_block_till_done()
    assert hass_storage[f"{DOMAIN}.he1"]["data"]["manual"]["target"] == 90.0
    await hass.config_entries.async_unload(entry.entry_id)


async def test_charge_now_takes_over_an_external_ac_in(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {}, ac_in_on=True)
    rt = entry.runtime_data
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    await rt.async_control()
    assert rt.status == "external"
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 60}, blocking=True)
    assert rt.status == "manual" and calls == []
    hass.states.async_set("sensor.soc", "61", {"unit_of_measurement": "%"})
    await rt.async_control()
    assert calls == [("switch.ac_in", False)]  # switched off at the target
    await hass.config_entries.async_unload(entry.entry_id)


async def test_plan_uses_learned_charge_power(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, {})
    rt = entry.runtime_data
    assert rt.charge_power_source == "setting"
    assert rt._planner_cfg().charge_power_w == 2600.0
    rt.learned_charge_w = 1999.0
    assert rt.charge_power_source == "learned"
    assert rt._planner_cfg().charge_power_w == 1999.0
    await rt.async_recompute()
    await hass.async_block_till_done()
    attrs = hass.states.get("sensor.hybrid_energy_grid_charge_plan").attributes
    assert attrs["charge_power_w"] == 1999 and attrs["charge_power_source"] == "learned"
    rt.learned_charge_w = 50.0  # implausible: back to the setting
    assert rt._planner_cfg().charge_power_w == 2600.0
    await hass.config_entries.async_unload(entry.entry_id)


async def _charging_session(hass: HomeAssistant, freezer, soc: float = 40):
    """Planned session running (switched on by us) with NT 22:00–22:30 and VT after it."""
    from custom_components.island_energy.const import SET_AUTO_CHARGING
    from custom_components.island_energy.core.forecast import ChargeWindow
    from custom_components.island_energy.runtime import ManualCharge

    entry = await start_with(hass, freezer, {}, ac_in_on=True)
    rt = entry.runtime_data
    rt.set_setting(SET_AUTO_CHARGING, True)
    now = dt_util.now()
    rt.nt = [
        ChargeWindow(now, now + timedelta(minutes=30)),
        ChargeWindow(now + timedelta(hours=1), now + timedelta(hours=2)),
    ]
    rt._we_switched_on = True
    rt.session = ManualCharge(target=80, until=now + timedelta(hours=8))
    hass.states.async_set("sensor.soc", str(soc), {"unit_of_measurement": "%"})
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    return entry, rt, calls


async def test_planned_charging_pauses_in_high_tariff(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls = await _charging_session(hass, freezer)
    await rt.async_control()
    assert calls == [] and rt.session is not None  # NT: keeps charging
    freezer.tick(timedelta(minutes=35))  # VT
    await rt.async_control()
    assert calls == [("switch.ac_in", False)]
    assert rt.session is None
    await hass.config_entries.async_unload(entry.entry_id)


async def test_manual_charging_ignores_the_tariff(hass: HomeAssistant, freezer) -> None:
    from custom_components.island_energy.runtime import ManualCharge

    entry, rt, calls = await _charging_session(hass, freezer)
    rt.session = None
    rt.manual = ManualCharge(target=80, until=dt_util.now() + timedelta(hours=8))
    freezer.tick(timedelta(minutes=35))  # VT
    await rt.async_control()
    assert calls == [] and rt.status == "manual"
    await hass.config_entries.async_unload(entry.entry_id)


async def test_minimum_soc_may_charge_in_high_tariff(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls = await _charging_session(hass, freezer, soc=21)  # minimum 20 % + margin 2
    freezer.tick(timedelta(minutes=35))  # VT
    await rt.async_control()
    assert calls == [] and rt.session is not None  # keeps protecting the minimum

    # not charging, below the minimum in VT: starts charging up to minimum + margin
    rt.session = None
    hass.states.async_set("switch.ac_in", "off")
    hass.states.async_set("sensor.soc", "15", {"unit_of_measurement": "%"})
    await rt.async_control()
    assert calls == [("switch.ac_in", True)]
    assert rt.session is not None and rt.session.target == 22.0
    await hass.config_entries.async_unload(entry.entry_id)


def _fake_plan(rt, needed_kwh: float, windows) -> None:
    from custom_components.island_energy.core.planner import NightPlan, PlanResult

    now = dt_util.now()
    night = NightPlan(now.date(), now + timedelta(hours=8), 90.0, needed_kwh, tuple(windows), 40.0, 90.0)
    rt.result = PlanResult(nights=[night], points=[], days=[], windows=list(windows))


async def test_planned_session_ends_when_the_plan_needs_nothing_more(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls = await _charging_session(hass, freezer, soc=60)
    _fake_plan(rt, 2.0, [])
    await rt.async_control()
    assert calls == [] and rt.session is not None
    # 20 kWh battery (400 Ah × 50 V): 60 % + 2 kWh → target follows the plan down to 70 %
    assert rt.session.target == pytest.approx(70.0)
    _fake_plan(rt, 0.0, [])  # e.g. at sunrise: "PV will fill the battery"
    await rt.async_control()
    assert calls == [("switch.ac_in", False)] and rt.session is None
    await hass.config_entries.async_unload(entry.entry_id)


async def test_planned_session_starts_only_when_two_plans_agree(hass: HomeAssistant, freezer) -> None:
    from custom_components.island_energy.const import SET_AUTO_CHARGING
    from custom_components.island_energy.core.forecast import ChargeWindow

    entry = await start_with(hass, freezer, {})
    rt = entry.runtime_data
    rt.set_setting(SET_AUTO_CHARGING, True)
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    now = dt_util.now()
    window = ChargeWindow(now - timedelta(minutes=5), now + timedelta(hours=1), 90.0)
    _fake_plan(rt, 3.0, [window])
    rt._prev_windows = [ChargeWindow(now + timedelta(minutes=45), now + timedelta(hours=2), 90.0)]
    await rt.async_control()
    assert calls == []  # an outlying recompute alone does not start charging
    rt._prev_windows = [window]
    await rt.async_control()
    assert calls == [("switch.ac_in", True)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_no_restart_cycling_after_the_plan_said_done(hass: HomeAssistant, freezer) -> None:
    from custom_components.island_energy.core.forecast import ChargeWindow

    entry, rt, calls = await _charging_session(hass, freezer, soc=60)
    now = dt_util.now()
    window = ChargeWindow(now - timedelta(minutes=30), now + timedelta(hours=2), 90.0)
    rt.nt = [window]
    _fake_plan(rt, 0.25, [window])
    rt._prev_windows = [window]
    await rt.async_control()
    assert calls == [("switch.ac_in", False)] and rt.session is None  # done (< 0.3 kWh)

    # the plan wobbles back to 0.55 kWh, both recomputes agree: no restart within MIN_OFF
    _fake_plan(rt, 0.55, [window])
    for _ in range(9):
        freezer.tick(timedelta(minutes=1))
        await rt.async_control()
    assert calls == [("switch.ac_in", False)]
    # after 10 min off and two agreeing plans a new start is allowed (contactor protection holds)
    freezer.tick(timedelta(minutes=2))
    await rt.async_control()
    assert calls == [("switch.ac_in", False), ("switch.ac_in", True)]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_no_external_flash_while_the_switch_state_lags(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls = await _charging_session(hass, freezer)
    rt._update_status()
    assert rt.status == "charging"
    statuses: list[str] = []
    rt.async_add_listener(lambda: statuses.append(rt.status))
    switch_service(hass, calls, lagging=frozenset({"switch.ac_in"}))  # Shelly reports later
    freezer.tick(timedelta(minutes=35))  # VT → graceful off
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False)
    assert hass.states.get("switch.ac_in").state == "on"  # not reported yet
    assert "external" not in statuses and rt.status != "external"
    await hass.config_entries.async_unload(entry.entry_id)
