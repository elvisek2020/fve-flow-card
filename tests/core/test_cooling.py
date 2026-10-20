from datetime import UTC, datetime, timedelta

from custom_components.island_energy.core.cooling import CoolingController, inverter_load

T0 = datetime(2026, 10, 20, 12, tzinfo=UTC)


def m(minutes: float) -> datetime:
    return T0 + timedelta(minutes=minutes)


def test_inverter_load_takes_largest_abs():
    assert inverter_load(460, 3273, -2801) == 3273
    assert inverter_load(None, None) is None


def test_turns_on_after_delay_and_off_with_hysteresis():
    c = CoolingController()
    assert c.step(m(0), 1200) is False
    assert c.step(m(1), 1200) is True
    # between thresholds: stays on
    assert c.step(m(5), 950) is True
    # below 900 W, but min run (10 min) and off delay (5 min) apply
    assert c.step(m(6), 500) is True
    assert c.step(m(10), 500) is True
    # below since m(6): off delay 5 min and min run 10 min (since m(1)) both met at m(11)
    assert c.step(m(11), 500) is False


def test_short_spike_does_not_start_fans():
    c = CoolingController()
    c.step(m(0), 2000)
    c.step(m(0.5), 300)
    assert c.step(m(2), 300) is False


def test_unknown_load_keeps_state():
    c = CoolingController(on=True, since=m(-30))
    assert c.step(m(0), None) is True
