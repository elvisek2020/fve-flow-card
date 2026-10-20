"""Runtime of Hybrid Energy: recompute the plan, drive AC IN and the cooling fans.

Safety rules:
- With automatic charging off (default, "shadow mode") AC IN is only switched
  by the explicit "charge now" / "stop charging" actions.
- The integration only switches AC IN off when it switched it on itself, so an
  external failsafe automation or a manual switch-on is never fought.
- Minimum on/off times protect the contactor from cycling.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_ON
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.util import dt as dt_util

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
    CONF_NOMINAL_VOLTAGE,
    CONF_NOTIFY,
    CONF_PV_POWER,
    CONF_SOC,
    CONF_SOLCAST,
    CONTROL_INTERVAL,
    COOLING_INTERVAL,
    DEFAULT_SETTINGS,
    DOMAIN,
    HISTORY_INTERVAL,
    MIN_OFF,
    MIN_ON,
    NAME,
    PAST_DAYS,
    PROFILE_DAYS,
    RECOMPUTE_INTERVAL,
    SET_AUTO_CHARGING,
    SET_AUTO_COOLING,
    SET_CEILING,
    SET_CHARGE_POWER,
    SET_COOLING_OFF,
    SET_COOLING_ON,
    SET_FULL_EVERY,
    SET_MIN_SOC,
    VERIFY_AFTER,
)
from .core.cooling import CoolingConfig, CoolingController, inverter_load
from .core.forecast import (
    FULL_SOC,
    ChargeWindow,
    DayResult,
    ForecastDay,
    HourRow,
    LoadSource,
    SocPoint,
    build_load_profile,
    dc_load_rows,
    learned_charge_power,
    measured_points,
)
from .core.planner import PlannerConfig, PlanResult, plan
from .data import (
    build_days,
    capacity_kwh,
    day_energy,
    fetch_hourly,
    hdo_windows,
    solcast_pv,
    state_float,
)

_LOGGER = logging.getLogger(__name__)


@dataclass
class ManualCharge:
    """ "Charge now": until ``target`` SoC or ``until`` time."""

    target: float
    until: datetime


class IslandEnergyRuntime:
    """Owns the plan and all control decisions of one config entry."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        # The options flow stores the whole entity set (cleared fields are dropped).
        self.cfg: dict[str, Any] = dict(entry.options) if entry.options else dict(entry.data)
        self.tz = dt_util.get_default_time_zone()
        self.settings: dict[str, float | bool] = dict(DEFAULT_SETTINGS)
        self.result: PlanResult | None = None
        self.days: list[DayResult] = []
        self.profile: list[float] = []
        self.load_source: LoadSource = "flat"
        self.capacity: float = 0.0
        self.nt: list[ChargeWindow] | None = None
        #: Skutečný výkon nabíjení ze sítě do baterie z historie (W), jen pro informaci.
        self.learned_charge_w: float | None = None
        self.generated: datetime | None = None
        self.status: str = "shadow"
        self.manual: ManualCharge | None = None
        #: Planned charging in progress: keeps going to its target even if the
        #: recomputed plan would move the rest later (no on/off cycling).
        self.session: ManualCharge | None = None
        #: "Stop charging" pressed: no automatic charging until this time.
        self.suppress_until: datetime | None = None
        self.skip_night: datetime | None = None
        self._history: dict[str, list[HourRow]] = {}
        self._last_full: datetime | None = None
        self._we_switched_on = False
        self._last_switch: datetime | None = None
        self._cooling = CoolingController(self._cooling_cfg())
        self._cooling_target: bool | None = None
        self._unsubs: list[CALLBACK_TYPE] = []
        self._listeners: list[Callable[[], None]] = []
        self._pending: CALLBACK_TYPE | None = None
        self._verify: CALLBACK_TYPE | None = None

    # ------------------------------------------------------------------ lifecycle

    async def async_start(self) -> None:
        await self.async_refresh_history()
        await self.async_recompute()
        self._unsubs += [
            async_track_time_interval(self.hass, self._interval_recompute, RECOMPUTE_INTERVAL),
            async_track_time_interval(self.hass, self._interval_history, HISTORY_INTERVAL),
            async_track_time_interval(self.hass, self._interval_control, CONTROL_INTERVAL),
            async_track_time_interval(self.hass, self._interval_cooling, COOLING_INTERVAL),
        ]
        watched = [self.cfg.get(CONF_SOC), self.cfg.get(CONF_HDO_SENSOR), *(self.cfg.get(k) for k in CONF_SOLCAST)]
        watched = [w for w in watched if w]
        if watched:
            self._unsubs.append(async_track_state_change_event(self.hass, watched, self._on_input_change))

    @callback
    def async_stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        for timer in (self._pending, self._verify):
            if timer:
                timer()
        self._pending = self._verify = None

    @callback
    def async_add_listener(self, update: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    @callback
    def _notify_listeners(self) -> None:
        for update in list(self._listeners):
            update()

    # ------------------------------------------------------------------ settings

    @callback
    def set_setting(self, key: str, value: float | bool) -> None:
        self.settings[key] = value
        if key in (SET_COOLING_ON, SET_COOLING_OFF):
            self._cooling.cfg = self._cooling_cfg()
        if key in (SET_CEILING, SET_MIN_SOC, SET_CHARGE_POWER, SET_FULL_EVERY):
            self._schedule_recompute(5)
        self._update_status()
        self._notify_listeners()

    def _cooling_cfg(self) -> CoolingConfig:
        return CoolingConfig(on_w=float(self.settings[SET_COOLING_ON]), off_w=float(self.settings[SET_COOLING_OFF]))

    def _planner_cfg(self) -> PlannerConfig:
        return PlannerConfig(
            charge_power_w=float(self.settings[SET_CHARGE_POWER]),
            ceiling_pct=float(self.settings[SET_CEILING]),
            full_every_days=int(self.settings[SET_FULL_EVERY]),
            min_soc_pct=float(self.settings[SET_MIN_SOC]),
        )

    # ------------------------------------------------------------------ data + plan

    async def async_refresh_history(self) -> None:
        now = dt_util.now()
        start = (now - timedelta(days=max(PROFILE_DAYS, PAST_DAYS) + 1)).replace(minute=0, second=0, microsecond=0)
        keys = (CONF_PV_POWER, CONF_BATTERY_POWER, CONF_INVERTER_POWER, CONF_SOC, CONF_AC_IN_POWER, CONF_DC_POWER)
        ids = [self.cfg.get(k) for k in keys]
        try:
            self._history = await fetch_hourly(self.hass, ids, start, now)
        except Exception:  # recorder may not be ready yet; keep the old history
            _LOGGER.exception("Reading statistics failed")
            return
        sign = -1.0 if self.cfg.get(CONF_BATTERY_INVERT) else 1.0
        bat = self._history.get(self.cfg.get(CONF_BATTERY_POWER) or "", [])
        if sign < 0:
            self._history[self.cfg[CONF_BATTERY_POWER]] = [
                HourRow(r.start, None if r.mean is None else -r.mean, r.min, r.max) for r in bat
            ]
        today = now.astimezone(self.tz).replace(hour=0, minute=0, second=0, microsecond=0)
        week = today - timedelta(days=PROFILE_DAYS)

        def full_days(eid: str | None) -> list[HourRow] | None:
            rows = self._history.get(eid or "")
            return [r for r in rows if week <= r.start < today] if rows is not None else None

        self.profile, self.load_source = build_load_profile(
            tz=self.tz,
            pv=full_days(self.cfg.get(CONF_PV_POWER)),
            battery=full_days(self.cfg.get(CONF_BATTERY_POWER)),
            inverter=full_days(self.cfg.get(CONF_INVERTER_POWER)),
            ac_in=full_days(self.cfg.get(CONF_AC_IN_POWER)),
            fallback_daily_kwh=state_float(self.hass, self.cfg.get(CONF_DAILY_LOAD)) or 14.0,
        )
        self.learned_charge_w = learned_charge_power(
            self._history.get(self.cfg.get(CONF_DC_POWER) or "", []),
            self._history.get(self.cfg.get(CONF_AC_IN_POWER) or "", []),
        )
        soc_rows = self._history.get(self.cfg.get(CONF_SOC) or "", [])
        fulls = [r.start for r in soc_rows if (r.max if r.max is not None else r.mean or 0) >= FULL_SOC]
        if fulls:
            self._last_full = max(fulls)

    async def async_recompute(self) -> None:
        soc = state_float(self.hass, self.cfg.get(CONF_SOC))
        self.capacity = capacity_kwh(
            self.hass, self.cfg.get(CONF_CAPACITY), float(self.cfg.get(CONF_NOMINAL_VOLTAGE) or 48)
        )
        if soc is None or self.capacity <= 0 or not self.profile:
            _LOGGER.debug("Plan skipped: soc=%s capacity=%s", soc, self.capacity)
            return
        now = dt_util.now()
        if soc >= FULL_SOC:
            self._last_full = now
        days, today = build_days(self.tz, now, PAST_DAYS)
        pv, totals = solcast_pv(self.hass, [self.cfg.get(k) for k in CONF_SOLCAST], today)
        self.nt = hdo_windows(self.hass, self.cfg.get(CONF_HDO_SENSOR), today.date(), self.tz)
        daily_load = round(sum(self.profile) / 1000, 2)
        days = self._fill_energy(days, totals, daily_load)
        history = measured_points(
            self._history.get(self.cfg.get(CONF_SOC) or "", []),
            self._history.get(self.cfg.get(CONF_BATTERY_POWER) or ""),
            self._history.get(self.cfg.get(CONF_AC_IN_POWER) or ""),
        )
        result = await self.hass.async_add_executor_job(
            lambda: plan(
                now=now,
                tz=self.tz,
                soc_now=soc,
                capacity_kwh=self.capacity,
                pv=pv,
                profile_w=self.profile,
                days=days,
                history=history,
                nt=self.nt,
                last_full=self._last_full,
                cfg=self._planner_cfg(),
            )
        )
        self.result = result
        self.days = result.days
        self.generated = now
        self._update_status()
        self._notify_listeners()

    def _fill_energy(self, days: list[ForecastDay], totals: list[float | None], daily_load: float) -> list[ForecastDay]:
        pv_rows = self._history.get(self.cfg.get(CONF_PV_POWER) or "", [])
        dc_rows = dc_load_rows(
            pv_rows,
            self._history.get(self.cfg.get(CONF_BATTERY_POWER) or "", []),
            self._history.get(self.cfg.get(CONF_INVERTER_POWER) or ""),
            self._history.get(self.cfg.get(CONF_AC_IN_POWER) or ""),
        )
        out = []
        fwd = 0
        for d in days:
            if d.kind == "past":
                out.append(
                    ForecastDay(
                        d.label,
                        d.kind,
                        d.start,
                        d.end,
                        day_energy(pv_rows, d.start, d.end),
                        day_energy(dc_rows, d.start, d.end),
                    )
                )
            else:
                out.append(ForecastDay(d.label, d.kind, d.start, d.end, totals[fwd], daily_load))
                fwd += 1
        return out

    # ------------------------------------------------------------------ control

    @property
    def next_window(self) -> ChargeWindow | None:
        now = dt_util.now()
        if not self.result:
            return None
        return next((w for w in self.result.windows if w.end > now), None)

    def _blocked(self, now: datetime) -> bool:
        return bool((self.suppress_until and now < self.suppress_until) or (self.skip_night and now < self.skip_night))

    def _planned_session(self, now: datetime, soc: float) -> ManualCharge | None:
        """Start a charging session when a planned window is active."""
        if not self.result or self._blocked(now):
            return None
        window = next((w for w in self.result.windows if w.start <= now < w.end and soc < w.ceiling), None)
        night = self.result.next_night
        if window is None or night is None or self.capacity <= 0:
            return None
        target = min(window.ceiling, soc + night.needed_kwh / self.capacity * 100)
        return ManualCharge(target=target, until=night.deadline) if target > soc else None

    async def async_control(self) -> None:
        sw = self.cfg.get(CONF_AC_IN_SWITCH)
        if not sw:
            return
        st = self.hass.states.get(sw)
        soc = state_float(self.hass, self.cfg.get(CONF_SOC))
        if st is None or st.state in ("unknown", "unavailable") or soc is None:
            return
        now = dt_util.now()
        is_on = st.state == STATE_ON
        desired: bool | None = None
        reason = ""
        if self.manual:
            if soc >= self.manual.target or now >= self.manual.until:
                self.manual = None
                desired, reason = False, "ruční nabíjení dokončeno"
            else:
                desired, reason = True, f"ruční nabíjení do {self.manual.target:.0f} %"
        elif self.settings[SET_AUTO_CHARGING]:
            if self.session and (soc >= self.session.target or now >= self.session.until or self._blocked(now)):
                self.session = None
                desired, reason = False, "plánované nabíjení dokončeno"
            elif not self.session:
                self.session = self._planned_session(now, soc)
            if self.session:
                desired, reason = True, f"podle plánu do {self.session.target:.0f} %"
            elif desired is None:
                desired, reason = False, "mimo plán"
        if desired is True and not is_on:
            if self._last_switch and now - self._last_switch < MIN_OFF and not self.manual:
                return
            await self._switch(sw, True, reason)
        elif desired is False and is_on and self._we_switched_on:
            if self._last_switch and now - self._last_switch < MIN_ON and soc < FULL_SOC:
                return
            await self._switch(sw, False, reason)
        self._update_status()

    async def _switch(self, entity_id: str, on: bool, reason: str) -> None:
        await self.hass.services.async_call("switch", "turn_on" if on else "turn_off", {"entity_id": entity_id})
        self._last_switch = dt_util.now()
        self._we_switched_on = on
        soc = state_float(self.hass, self.cfg.get(CONF_SOC))
        msg = f"{'Zapínám' if on else 'Vypínám'} nabíjení z AC IN ({reason}, SoC {soc:.0f} %)"
        self._log(msg)
        if self._verify:
            self._verify()
            self._verify = None
        if on:
            self._verify = async_call_later(self.hass, VERIFY_AFTER, self._verify_charging)
        self._notify_listeners()

    @callback
    def _verify_charging(self, _now: datetime) -> None:
        self._verify = None
        source = self.hass.states.get(self.cfg.get(CONF_ACTIVE_INPUT) or "")
        sw = self.hass.states.get(self.cfg.get(CONF_AC_IN_SWITCH) or "")
        if source is None or sw is None or sw.state != STATE_ON:
            return
        if source.state != "grid":
            self._log(f"AC IN je zapnutý, ale GX hlásí aktivní vstup „{source.state}“ — nabíjení neběží?", notify=True)

    async def async_cooling(self) -> None:
        fan = self.cfg.get(CONF_FAN_SWITCH)
        load = inverter_load(
            state_float(self.hass, self.cfg.get(CONF_INVERTER_POWER)),
            state_float(self.hass, self.cfg.get(CONF_AC_IN_POWER)),
            state_float(self.hass, self.cfg.get(CONF_DC_POWER)),
        )
        desired = self._cooling.step(dt_util.now(), load)
        if not fan or not self.settings[SET_AUTO_COOLING]:
            self._cooling_target = None
            return
        # Edge-triggered: a manual switch stays until the controller changes its mind.
        if desired != self._cooling_target:
            self._cooling_target = desired
            st = self.hass.states.get(fan)
            if st is not None and (st.state == STATE_ON) != desired:
                await self.hass.services.async_call("switch", "turn_on" if desired else "turn_off", {"entity_id": fan})
                self._log(f"{'Zapínám' if desired else 'Vypínám'} chlazení (zátěž měniče {load or 0:.0f} W)")

    # ------------------------------------------------------------------ actions

    async def async_charge_now(self, target: float | None = None, duration: timedelta | None = None) -> None:
        now = dt_util.now()
        self.manual = ManualCharge(
            target=float(target if target is not None else self.settings[SET_CEILING]),
            until=now + (duration or timedelta(hours=12)),
        )
        self.suppress_until = None
        sw = self.cfg.get(CONF_AC_IN_SWITCH)
        st = self.hass.states.get(sw) if sw else None
        if sw and st is not None and st.state != STATE_ON:
            await self._switch(sw, True, f"ručně, do {self.manual.target:.0f} %")
        self._update_status()
        self._notify_listeners()

    async def async_stop_charging(self) -> None:
        now = dt_util.now()
        self.manual = None
        self.session = None
        window = next((w for w in (self.result.windows if self.result else []) if w.start <= now < w.end), None)
        self.suppress_until = window.end if window else now + MIN_OFF
        sw = self.cfg.get(CONF_AC_IN_SWITCH)
        st = self.hass.states.get(sw) if sw else None
        if sw and st is not None and st.state == STATE_ON:
            # Explicit user action: switch off even if someone else switched it on.
            await self._switch(sw, False, "ručně vypnuto")
        self._update_status()
        self._notify_listeners()

    async def async_skip_tonight(self) -> None:
        night = self.result.next_night if self.result else None
        self.skip_night = night.deadline if night else dt_util.now() + timedelta(hours=12)
        self.session = None
        self._log("Dnes v noci nenabíjím (ručně přeskočeno)")
        self._update_status()
        self._notify_listeners()

    # ------------------------------------------------------------------ helpers

    @callback
    def _update_status(self) -> None:
        sw = self.hass.states.get(self.cfg.get(CONF_AC_IN_SWITCH) or "")
        charging = sw is not None and sw.state == STATE_ON
        if self.manual:
            self.status = "manual"
        elif charging:
            self.status = "charging" if self._we_switched_on else "external"
        elif not self.settings[SET_AUTO_CHARGING]:
            self.status = "shadow"
        elif self.skip_night and dt_util.now() < self.skip_night:
            self.status = "skipped"
        elif self.next_window:
            self.status = "planned"
        else:
            self.status = "idle"

    def _log(self, message: str, notify: bool = False) -> None:
        _LOGGER.info(message)
        if "logbook" in self.hass.config.components:
            from homeassistant.components.logbook import async_log_entry

            async_log_entry(self.hass, NAME, message, DOMAIN)
        service = (self.cfg.get(CONF_NOTIFY) or "").strip()
        if notify and service.startswith("notify."):
            self.hass.async_create_task(
                self.hass.services.async_call("notify", service.split(".", 1)[1], {"title": NAME, "message": message})
            )

    def _schedule_recompute(self, delay: float) -> None:
        if self._pending:
            self._pending()

        @callback
        def _fire(_now: datetime) -> None:
            self._pending = None
            self.hass.async_create_task(self.async_recompute())

        self._pending = async_call_later(self.hass, delay, _fire)

    @callback
    def _on_input_change(self, _event: Event) -> None:
        self._schedule_recompute(30)

    async def _interval_recompute(self, _now: datetime) -> None:
        await self.async_recompute()

    async def _interval_history(self, _now: datetime) -> None:
        await self.async_refresh_history()

    async def _interval_control(self, _now: datetime) -> None:
        await self.async_control()

    async def _interval_cooling(self, _now: datetime) -> None:
        await self.async_cooling()

    # ------------------------------------------------------------------ export for entities / card

    def days_export(self) -> list[dict[str, Any]]:
        """Forecast table for the card (sensor attribute)."""

        def iso(t: datetime | None) -> str | None:
            return t.isoformat() if t else None

        def r1(v: float | None) -> float | None:
            return None if v is None else round(v, 1)

        return [
            {
                "date": d.day.start.date().isoformat(),
                "kind": d.day.kind,
                "pv_kwh": r1(d.day.pv_kwh),
                "load_kwh": r1(d.day.load_kwh),
                "trough": r1(d.trough),
                "trough_at": iso(d.trough_at),
                "peak": r1(d.peak),
                "peak_at": iso(d.peak_at),
                "full_at": iso(d.full_at),
                "charges": d.charges,
                "risk": d.risk,
                "measured": d.measured,
                "grid_kwh": round(d.grid_kwh, 2),
                "grid_windows": [{"start": iso(w.start), "end": iso(w.end)} for w in d.grid_windows],
            }
            for d in self.days
        ]

    def reason(self) -> str:
        """Human readable explanation of the next night's plan (Czech)."""
        night = self.result.next_night if self.result else None
        if night is None:
            return "Plán zatím není spočítaný."
        when = night.target_day.strftime("%-d. %-m.")
        peak = f"{night.peak_without:.0f} %" if night.peak_without is not None else "bez nabíjení z FV"
        if night.needed_kwh <= 0:
            return f"{when}: panely baterii dobijí (max {peak}), ze sítě nenabíjím."
        windows = ", ".join(f"{_hm(w.start)}–{_hm(w.end)}" for w in night.windows)
        kwh = f"{night.needed_kwh:.1f}".replace(".", ",")
        text = (
            f"{when}: bez sítě ráno {night.trough_without:.0f} % a max {peak} → "
            f"dobít {kwh} kWh ({windows}), strop {night.ceiling:.0f} %."
        )
        if night.protect_min:
            text += f" Kvůli minimu {float(self.settings[SET_MIN_SOC]):.0f} % začíná dřív."
        if night.short:
            text += " NT okna nestačí na celé dobití."
        if self.nt is None:
            text += " Bez HDO: nabíjí se kdykoli."
        return text

    def history_points(self) -> list[SocPoint]:
        return measured_points(self._history.get(self.cfg.get(CONF_SOC) or "", []), None)


def _hm(t: datetime) -> str:
    return dt_util.as_local(t).strftime("%H:%M")
