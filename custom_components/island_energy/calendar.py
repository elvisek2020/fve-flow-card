"""Calendar: AC IN charging from the grid, running and planned.

Other integrations (e.g. a boiler controller) can keep clear of it without knowing
about this one: they only pick the calendar entity.
"""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import IslandEnergyConfigEntry
from .entity import IslandEnergyEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: IslandEnergyConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([ChargingCalendar(entry.runtime_data, "charging_schedule")])


class ChargingCalendar(IslandEnergyEntity, CalendarEntity):
    """Running charge (estimated end) and the planned windows that will really start."""

    _domain = "calendar"

    def _events(self) -> list[CalendarEvent]:
        return [
            CalendarEvent(start=e.start, end=e.end, summary=e.summary, description=e.description)
            for e in self.runtime.charge_events()
        ]

    @property
    def event(self) -> CalendarEvent | None:
        now = dt_util.now()
        return next((e for e in self._events() if e.end > now), None)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        return [e for e in self._events() if e.end > start_date and e.start < end_date]
