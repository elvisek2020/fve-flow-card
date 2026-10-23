"""Constants of Hybrid Energy."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "island_energy"
NAME: Final = "Hybrid Energy"

#: URL under which the bundled Lovelace cards are served.
FRONTEND_URL: Final = f"/{DOMAIN}/fve-flow-card.js"
FRONTEND_FILE: Final = "frontend/fve-flow-card.js"

# Config entry keys (entity ids unless noted)
CONF_SOC: Final = "soc"
CONF_BATTERY_POWER: Final = "battery_power"
CONF_BATTERY_INVERT: Final = "battery_invert"  # bool
CONF_PV_POWER: Final = "pv_power"
CONF_CAPACITY: Final = "capacity"
CONF_NOMINAL_VOLTAGE: Final = "nominal_voltage"  # number, V
CONF_INVERTER_POWER: Final = "inverter_power"  # AC out
CONF_AC_IN_POWER: Final = "ac_in_power"
CONF_DC_POWER: Final = "dc_power"  # signed inverter power; on Victron the AC side
CONF_DC_CURRENT: Final = "dc_current"  # inverter DC current (A, + = into battery)
CONF_DC_VOLTAGE: Final = "dc_voltage"  # inverter DC voltage (V)
CONF_ACTIVE_INPUT: Final = "active_input"
CONF_INVERTER_STATE: Final = "inverter_state"
CONF_AC_IN_SWITCH: Final = "ac_in_switch"
CONF_IGNORE_AC_IN: Final = "ignore_ac_in_switch"  # Victron "Ignore AC input" (graceful disconnect)
CONF_AC_IN_VOLTAGE: Final = "ac_in_voltage"  # grid voltage on AC IN (V)
CONF_FAN_SWITCH: Final = "fan_switch"
CONF_DAILY_LOAD: Final = "daily_load"  # fallback energy (kWh/day)
CONF_HDO_SENSOR: Final = "hdo_sensor"
CONF_NOTIFY: Final = "notify_service"  # e.g. "notify.mobile_app_phone"
CONF_SOLCAST: Final = (
    "solcast_today",
    "solcast_tomorrow",
    "solcast_day_3",
    "solcast_day_4",
    "solcast_day_5",
    "solcast_day_6",
    "solcast_day_7",
)

# Settings (number / switch entities, restored after restart)
SET_CEILING: Final = "ceiling"
SET_MIN_SOC: Final = "min_soc"
SET_CHARGE_POWER: Final = "charge_power"
SET_RESERVE: Final = "reserve"
SET_NIGHT_START: Final = "night_start"  # local time, hours (21.0 = 21:00)
SET_NIGHT_END: Final = "night_end"
SET_COOLING_ON: Final = "cooling_on"
SET_COOLING_OFF: Final = "cooling_off"
SET_AUTO_CHARGING: Final = "auto_charging"
SET_AUTO_COOLING: Final = "auto_cooling"

DEFAULT_SETTINGS: Final[dict[str, float | bool]] = {
    SET_CEILING: 90.0,
    SET_MIN_SOC: 20.0,
    SET_CHARGE_POWER: 2600.0,
    SET_RESERVE: 30.0,
    SET_NIGHT_START: 21.0,
    SET_NIGHT_END: 8.0,
    SET_COOLING_ON: 1000.0,
    SET_COOLING_OFF: 900.0,
    SET_AUTO_CHARGING: False,
    SET_AUTO_COOLING: False,
}

#: Stable English object ids (``<domain>.hybrid_energy_<id>``) — the card finds the
#: entities by them and they must not depend on the HA language.
OBJECT_IDS: Final[dict[str, str]] = {
    "grid_charge_plan": "grid_charge_plan",
    "next_charge": "next_charging",
    "forecast": "battery_forecast",
    "status": "planner_status",
    "charging": "grid_charging",
    "low_tariff": "low_tariff",
    SET_AUTO_CHARGING: "allow_automatic_charging",
    SET_AUTO_COOLING: "allow_automatic_cooling",
    SET_CEILING: "grid_charge_ceiling",
    SET_MIN_SOC: "minimum_soc",
    SET_CHARGE_POWER: "grid_charge_power",
    SET_RESERVE: "grid_charge_reserve",
    SET_NIGHT_START: "night_charge_from",
    SET_NIGHT_END: "night_charge_until",
    SET_COOLING_ON: "cooling_on_above",
    SET_COOLING_OFF: "cooling_off_below",
    "charge_now": "charge_now",
    "stop_charging": "stop_charging",
    "skip_tonight": "skip_tonight",
}

RECOMPUTE_INTERVAL: Final = timedelta(minutes=15)
HISTORY_INTERVAL: Final = timedelta(hours=1)
CONTROL_INTERVAL: Final = timedelta(minutes=1)
COOLING_INTERVAL: Final = timedelta(seconds=30)
#: Protect the AC IN contactor from cycling.
MIN_ON: Final = timedelta(minutes=15)
MIN_OFF: Final = timedelta(minutes=10)
#: Graceful disconnect: after "ignore AC input" wait at most this long for the GX
#: to leave the grid before the contactor opens (no current through the contactor).
RELEASE_TIMEOUT: Final = timedelta(seconds=30)
#: Without an active-input entity: fixed settle time after "ignore AC input".
RELEASE_SETTLE: Final = timedelta(seconds=5)
#: AC IN switched on but no grid on the input this long → fault (tripped breaker / RCD).
FAULT_AFTER: Final = timedelta(minutes=2)
#: After a fault automatic charging retries after this time (or "charge now").
FAULT_RETRY: Final = timedelta(minutes=30)
#: Grid voltage on AC IN below this counts as "no grid".
MIN_GRID_VOLTAGE: Final = 180.0
PAST_DAYS: Final = 5
PROFILE_DAYS: Final = 7
