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
CONF_DC_POWER: Final = "dc_power"
CONF_ACTIVE_INPUT: Final = "active_input"
CONF_INVERTER_STATE: Final = "inverter_state"
CONF_AC_IN_SWITCH: Final = "ac_in_switch"
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
SET_FULL_EVERY: Final = "full_every_days"
SET_COOLING_ON: Final = "cooling_on"
SET_COOLING_OFF: Final = "cooling_off"
SET_AUTO_CHARGING: Final = "auto_charging"
SET_AUTO_COOLING: Final = "auto_cooling"

DEFAULT_SETTINGS: Final[dict[str, float | bool]] = {
    SET_CEILING: 90.0,
    SET_MIN_SOC: 20.0,
    SET_CHARGE_POWER: 2600.0,
    SET_FULL_EVERY: 7.0,
    SET_COOLING_ON: 1000.0,
    SET_COOLING_OFF: 900.0,
    SET_AUTO_CHARGING: False,
    SET_AUTO_COOLING: False,
}

RECOMPUTE_INTERVAL: Final = timedelta(minutes=15)
HISTORY_INTERVAL: Final = timedelta(hours=1)
CONTROL_INTERVAL: Final = timedelta(minutes=1)
COOLING_INTERVAL: Final = timedelta(seconds=30)
#: Protect the AC IN contactor from cycling.
MIN_ON: Final = timedelta(minutes=15)
MIN_OFF: Final = timedelta(minutes=10)
#: After switching AC IN on, the GX must report the grid as active input by then.
VERIFY_AFTER: Final = timedelta(minutes=3)
PAST_DAYS: Final = 5
PROFILE_DAYS: Final = 7
