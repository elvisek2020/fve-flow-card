"""Cooling fan control by inverter load (no temperature, no night window).

Load = max(|AC out|, AC in power, |DC power|), so grid charging counts too.
Turn on above ``on_w`` held for ``on_delay``, off below ``off_w`` held for
``off_delay``; once on, the fans run at least ``min_run``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class CoolingConfig:
    on_w: float = 1000.0
    off_w: float = 900.0
    on_delay: timedelta = timedelta(minutes=1)
    off_delay: timedelta = timedelta(minutes=5)
    min_run: timedelta = timedelta(minutes=10)


def inverter_load(*values: float | None) -> float | None:
    """Largest absolute value of the available power readings (W)."""
    known = [abs(v) for v in values if v is not None]
    return max(known) if known else None


class CoolingController:
    """Hysteresis state machine; ``step`` returns the desired fan state."""

    def __init__(self, cfg: CoolingConfig | None = None, on: bool = False, since: datetime | None = None) -> None:
        self.cfg = cfg or CoolingConfig()
        self.on = on
        self.since = since
        self._above: datetime | None = None
        self._below: datetime | None = None

    def step(self, now: datetime, load_w: float | None) -> bool:
        if load_w is None:
            # Unknown load: keep the current state, restart the timers.
            self._above = self._below = None
            return self.on
        if load_w > self.cfg.on_w:
            self._below = None
            self._above = self._above or now
            if not self.on and now - self._above >= self.cfg.on_delay:
                self.on, self.since = True, now
        elif load_w < self.cfg.off_w:
            self._above = None
            self._below = self._below or now
            ran = now - self.since if self.since else self.cfg.min_run
            if self.on and now - self._below >= self.cfg.off_delay and ran >= self.cfg.min_run:
                self.on, self.since = False, now
        else:
            self._above = self._below = None
        return self.on
