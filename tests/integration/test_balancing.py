"""Balancing hold: a manual charge to 100 % keeps AC IN on after SoC 100 for a while."""

from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed, async_mock_service

from custom_components.island_energy.const import DOMAIN, SET_BALANCE_DELTA, SET_BALANCE_MINUTES

from .test_integration import TZ, start_with, switch_service

CELLS = {"cell_voltage_max": "sensor.cell_max", "cell_voltage_min": "sensor.cell_min", "notify_service": "notify.phone"}


def cells(hass: HomeAssistant, hi: float, lo: float, unit: str = "V") -> None:
    hass.states.async_set("sensor.cell_max", str(hi), {"unit_of_measurement": unit})
    hass.states.async_set("sensor.cell_min", str(lo), {"unit_of_measurement": unit})


def soc(hass: HomeAssistant, value: float) -> None:
    hass.states.async_set("sensor.soc", str(value), {"unit_of_measurement": "%"})


async def _full(hass: HomeAssistant, freezer, extra: dict | None = None):
    """Charging to 100 % with the cell entities, notify mocked; returns (entry, rt, calls, notes)."""
    entry = await start_with(hass, freezer, {**CELLS, **(extra or {})})
    rt = entry.runtime_data
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    notes = async_mock_service(hass, "notify", "phone")
    cells(hass, 3.531, 3.503)
    await hass.services.async_call("button", "press", {"entity_id": "button.hybrid_energy_charge_full"}, blocking=True)
    assert calls == [("switch.ac_in", True)]
    hass.states.async_set("sensor.active_input", "grid")  # the GX took the grid (no fault)
    return entry, rt, calls, notes


async def test_charge_to_100_holds_ac_in_for_balancing(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls, notes = await _full(hass, freezer)
    start = dt_util.now()
    soc(hass, 100)
    await rt.async_control()
    # 100 % reached: AC IN stays on, 60 min balancing (default)
    assert calls == [("switch.ac_in", True)] and rt.status == "balancing"
    assert rt.manual.balance_until == start + timedelta(minutes=60)
    info = rt.session_info()
    assert info["balancing"] and info["cell_delta_mv"] == 28.0 and info["remaining_kwh"] == 0.0
    assert rt.charge_events()[0].end == rt.manual.balance_until  # the calendar keeps the boiler clear
    await hass.async_block_till_done()
    status = hass.states.get("sensor.hybrid_energy_planner_status")
    assert status.state == "balancing" and status.attributes["cell_delta_mv"] == 28.0

    freezer.tick(timedelta(minutes=30))
    soc(hass, 99)  # a dip to 99 % neither ends nor restarts anything
    await rt.async_control()
    assert calls == [("switch.ac_in", True)] and rt.status == "balancing"

    freezer.tick(timedelta(minutes=31))
    cells(hass, 3.528, 3.508)
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.async_block_till_done()
    (note,) = notes
    assert "po 61 min" in note.data["message"] and "28 → 20 mV" in note.data["message"]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_balancing_ends_early_below_the_cell_spread(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls, notes = await _full(hass, freezer)
    rt.set_setting(SET_BALANCE_DELTA, 15)
    soc(hass, 100)
    await rt.async_control()
    assert rt.status == "balancing"
    freezer.tick(timedelta(minutes=10))
    cells(hass, 3521, 3507, unit="mV")  # mV entities work too: 14 mV
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.async_block_till_done()
    assert "rozdíl článků pod 15 mV" in notes[0].data["message"]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_no_hold_when_the_setting_is_zero(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls, notes = await _full(hass, freezer)
    rt.set_setting(SET_BALANCE_MINUTES, 0)
    soc(hass, 100)
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.async_block_till_done()
    assert notes == []
    await hass.config_entries.async_unload(entry.entry_id)


async def test_no_hold_below_100(hass: HomeAssistant, freezer) -> None:
    entry = await start_with(hass, freezer, CELLS)
    rt = entry.runtime_data
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 80}, blocking=True)
    assert "balance_minutes" not in rt.session_info()
    hass.states.async_set("sensor.active_input", "grid")
    freezer.tick(timedelta(minutes=16))  # past the minimum on-time
    soc(hass, 80)
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.config_entries.async_unload(entry.entry_id)


async def test_manual_stop_ends_balancing_with_the_spread(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls, notes = await _full(hass, freezer)
    soc(hass, 100)
    await rt.async_control()
    freezer.tick(timedelta(minutes=5))
    stop = {"entity_id": "button.hybrid_energy_stop_charging"}
    await hass.services.async_call("button", "press", stop, blocking=True)
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.async_block_till_done()
    assert "ručně přerušeno" in notes[0].data["message"]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_balancing_in_low_tariff_stops_when_the_low_tariff_ends(hass: HomeAssistant, freezer) -> None:
    from custom_components.island_energy.core.forecast import ChargeWindow

    entry = await start_with(hass, freezer, CELLS)  # 22:00
    rt = entry.runtime_data
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    async_mock_service(hass, "notify", "phone")
    cells(hass, 3.531, 3.503)
    tz = dt_util.get_time_zone(TZ)
    rt.nt = [ChargeWindow(datetime(2026, 10, 20, 21, 15, tzinfo=tz), datetime(2026, 10, 20, 22, 30, tzinfo=tz))]
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 100, "low_tariff_only": True}, blocking=True)
    hass.states.async_set("sensor.active_input", "grid")
    assert rt.session_info()["balance_minutes"] == 60
    soc(hass, 100)
    freezer.move_to(datetime(2026, 10, 20, 22, 10, tzinfo=tz))
    await rt.async_control()
    assert rt.status == "balancing" and rt.manual.balance_until == datetime(2026, 10, 20, 23, 10, tzinfo=tz)
    freezer.move_to(datetime(2026, 10, 20, 22, 31, tzinfo=tz))  # NT over: the hold ends with it
    await rt.async_control()
    assert calls[-1] == ("switch.ac_in", False) and rt.manual is None
    await hass.config_entries.async_unload(entry.entry_id)


async def test_balancing_survives_a_restart(hass: HomeAssistant, freezer, hass_storage) -> None:
    entry, rt, _calls, _notes = await _full(hass, freezer)
    soc(hass, 100)
    await rt.async_control()
    until = rt.manual.balance_until
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
    await hass.async_block_till_done()
    saved = hass_storage[f"{DOMAIN}.he1"]["data"]["manual"]
    assert saved["balance_until"] == until.isoformat() and saved["balance_start_mv"] == 28.0
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    rt = entry.runtime_data
    assert rt.manual.balance_until == until and rt.status == "balancing"
    await hass.config_entries.async_unload(entry.entry_id)


# ---------------------------------------------------------------- BMS full charge request

REQUEST = {"full_charge_request": "binary_sensor.full_request", "notify_service": "notify.phone"}


async def _with_request(hass: HomeAssistant, freezer, auto: bool = True, state: str = "off"):
    from custom_components.island_energy.const import SET_AUTO_CHARGING

    hass.states.async_set("binary_sensor.full_request", state)
    entry = await start_with(hass, freezer, REQUEST)  # 22:00, no HDO → the night low tariff
    rt = entry.runtime_data
    rt.set_setting(SET_AUTO_CHARGING, auto)
    calls: list[tuple[str, bool]] = []
    switch_service(hass, calls)
    notes = async_mock_service(hass, "notify", "phone")
    return entry, rt, calls, notes


async def test_bms_request_plans_a_full_charge_in_the_low_tariff(hass: HomeAssistant, freezer) -> None:
    entry, rt, calls, notes = await _with_request(hass, freezer)
    await rt.async_control()
    assert rt.manual is None and calls == []
    hass.states.async_set("binary_sensor.full_request", "on")
    await rt.async_control()
    assert rt.manual.target == 100.0 and rt.manual.low_tariff_only and rt.manual.by_bms
    assert calls == [("switch.ac_in", True)]  # 22:00 is inside the night low tariff
    assert rt.session_info()["by_bms"] is True
    await hass.async_block_till_done()
    assert "BMS žádá plné nabití" in notes[0].data["message"]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_bms_request_is_answered_once_until_it_clears(hass: HomeAssistant, freezer) -> None:
    entry, rt, _calls, _notes = await _with_request(hass, freezer, state="1")  # sensor style: 1
    hass.states.async_set("sensor.active_input", "grid")
    await rt.async_control()
    assert rt.manual is not None and rt.full_request_handled
    stop = {"entity_id": "button.hybrid_energy_stop_charging"}
    await hass.services.async_call("button", "press", stop, blocking=True)
    assert rt.manual is None
    assert rt.suppress_until is not None
    freezer.move_to(datetime(2026, 10, 21, 9, 0, tzinfo=dt_util.get_time_zone(TZ)))
    await rt.async_control()  # the stop expired, the request is still on: no new charge
    assert rt.manual is None and not rt._blocked(dt_util.now())
    hass.states.async_set("binary_sensor.full_request", "0")  # cleared …
    await rt.async_control()
    assert not rt.full_request_handled
    hass.states.async_set("binary_sensor.full_request", "1")  # … and asked again
    await rt.async_control()
    assert rt.manual is not None and rt.manual.by_bms and rt.status == "manual_waiting"  # by day: waits
    await hass.config_entries.async_unload(entry.entry_id)


async def test_bms_request_waits_for_automatic_charging(hass: HomeAssistant, freezer) -> None:
    from custom_components.island_energy.const import SET_AUTO_CHARGING

    entry, rt, calls, _notes = await _with_request(hass, freezer, auto=False, state="on")
    await rt.async_control()
    assert rt.manual is None and calls == [] and not rt.full_request_handled  # shadow mode
    rt.set_setting(SET_AUTO_CHARGING, True)
    await rt.async_control()
    assert rt.manual is not None and rt.manual.by_bms
    await hass.config_entries.async_unload(entry.entry_id)


async def test_bms_request_does_not_replace_a_manual_charge(hass: HomeAssistant, freezer) -> None:
    entry, rt, _calls, _notes = await _with_request(hass, freezer)
    await hass.services.async_call(DOMAIN, "charge_now", {"target_soc": 80}, blocking=True)
    hass.states.async_set("binary_sensor.full_request", "on")
    await rt.async_control()
    assert rt.manual.target == 80 and not rt.manual.by_bms and not rt.full_request_handled
    await hass.config_entries.async_unload(entry.entry_id)


async def test_answered_bms_request_survives_a_restart(hass: HomeAssistant, freezer, hass_storage) -> None:
    hass_storage[f"{DOMAIN}.he1"] = {"version": 1, "key": f"{DOMAIN}.he1", "data": {"full_request_handled": True}}
    entry, rt, calls, _notes = await _with_request(hass, freezer, state="on")
    await rt.async_control()
    assert rt.manual is None and calls == []  # already answered before the restart
    await hass.config_entries.async_unload(entry.entry_id)
