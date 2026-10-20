from datetime import date, timedelta

import pytest

from custom_components.island_energy.core.forecast import (
    ChargeWindow,
    HourRow,
    analyze_days,
    build_load_profile,
    measured_points,
    parse_detailed,
    pv_periods_for_day,
    simulate,
)

from .helpers import FLAT_600, TZ, at, days_from, midnight, pv_day

D = date(2026, 10, 20)


def test_parse_detailed_half_hours_in_watts():
    attr = [
        {"period_start": "2026-10-20T12:00:00+02:00", "pv_estimate": 1.5},
        {"period_start": "2026-10-20T12:30:00+02:00", "pv_estimate": 2.0},
        {"period_start": "bad", "pv_estimate": 1},
    ]
    out = parse_detailed(attr, midnight(D), midnight(D + timedelta(days=1)))
    assert [p.w for p in out] == [1500.0, 2000.0]
    assert out[0].end == at(D, 12, 30)
    assert out[1].end - out[1].start == timedelta(minutes=30)


def test_pv_periods_without_detailed_use_template_shape():
    template = pv_day(D, 10)
    out = pv_periods_for_day(midnight(D + timedelta(days=1)), 20, [], template)
    assert sum(p.w * 0.5 / 1000 for p in out) == pytest.approx(20)
    assert out[0].start == at(D + timedelta(days=1), 7)


def test_load_profile_prefers_dc_draw():
    rows_pv, rows_bat = [], []
    for day in range(3):
        for h in range(24):
            t = at(D, 0) + timedelta(days=day, hours=h)
            rows_pv.append(HourRow(t, mean=1000.0 if 10 <= h < 14 else 0.0))
            rows_bat.append(HourRow(t, mean=400.0 if 10 <= h < 14 else -500.0))
    profile, source = build_load_profile(tz=TZ, pv=rows_pv, battery=rows_bat, inverter=None, fallback_daily_kwh=12)
    assert source == "dc"
    assert profile[3] == pytest.approx(500)
    assert profile[11] == pytest.approx(600)


def test_load_profile_falls_back_to_flat():
    profile, source = build_load_profile(tz=TZ, pv=[], battery=[], inverter=[], fallback_daily_kwh=12)
    assert source == "flat"
    assert profile == [500.0] * 24


def test_simulate_discharges_by_load():
    pts = simulate(now=at(D, 0), soc_now=60, capacity_kwh=20, pv=[], profile_w=FLAT_600, until=at(D, 10), tz=TZ)
    # 10 h × 0.6 kW = 6 kWh = 30 % of 20 kWh
    assert pts[-1].lo == pytest.approx(30)


def test_simulate_grid_window_stops_at_ceiling():
    win = [ChargeWindow(at(D, 0), at(D, 6), ceiling=90)]
    pts = simulate(
        now=at(D, 0),
        soc_now=60,
        capacity_kwh=20,
        pv=[],
        profile_w=FLAT_600,
        until=at(D, 6),
        tz=TZ,
        windows=win,
        charge_power_w=2600,
    )
    assert max(p.hi for p in pts) == pytest.approx(90)
    assert sum(p.grid_kwh for p in pts) == pytest.approx(6.0)


def test_simulate_first_step_aligns_to_quarter_hour():
    pts = simulate(now=at(D, 21, 7), soc_now=50, capacity_kwh=20, pv=[], profile_w=FLAT_600, until=at(D, 22), tz=TZ)
    assert pts[1].t == at(D, 21, 15)


def test_analyze_days_morning_low_and_full():
    pv = pv_day(D, 25)
    pts = simulate(
        now=at(D, 0),
        soc_now=60,
        capacity_kwh=20,
        pv=pv,
        profile_w=FLAT_600,
        until=midnight(D + timedelta(days=1)),
        tz=TZ,
    )
    (res,) = analyze_days(days_from(D, 1), pts, 10)
    assert res.charges
    assert res.trough is not None and 30 < res.trough < 60
    assert res.trough_at is not None and res.trough_at.astimezone(TZ).hour in (7, 8)
    assert res.full_at is not None
    assert res.peak == pytest.approx(100)


def test_measured_points_charging_from_battery_power():
    soc = [HourRow(at(D, 8), mean=41, min=40, max=42), HourRow(at(D, 9), mean=45, min=42, max=48)]
    bat = [HourRow(at(D, 8), mean=-300), HourRow(at(D, 9), mean=800)]
    pts = measured_points(soc, bat)
    assert [p.charging for p in pts] == [False, True]
    assert pts[0].lo == 40 and pts[1].hi == 48


def test_dc_load_ignores_grid_charging():
    from custom_components.island_energy.core.forecast import dc_load_rows

    pv, bat, out, acin = [], [], [], []
    for h in range(6):
        t = at(D, h)
        grid = h == 5
        pv.append(HourRow(t, mean=0.0))
        bat.append(HourRow(t, mean=2600.0 if grid else -520.0))  # charging from grid at 5 h
        out.append(HourRow(t, mean=500.0))
        acin.append(HourRow(t, mean=3100.0 if grid else 0.0))
    rows = dc_load_rows(pv, bat, out, acin)
    by = {r.start.hour: r.mean for r in rows}
    assert by[0] == pytest.approx(520)
    # grid hour: AC out × learned loss factor (520 / 500), not −2600
    assert by[5] == pytest.approx(500 * 1.04)


def test_measured_points_mark_grid_hours():
    soc = [HourRow(at(D, 7), mean=42, min=40, max=45)]
    bat = [HourRow(at(D, 7), mean=2000)]
    acin = [HourRow(at(D, 7), mean=3000)]
    (p,) = measured_points(soc, bat, acin)
    assert p.charging and p.grid_kwh > 0


def test_learned_charge_power_from_full_ac_in_hours():
    from custom_components.island_energy.core.forecast import learned_charge_power

    dc = [HourRow(at(D, h), mean=m) for h, m in ((4, 2600.0), (5, 2650.0), (6, 900.0), (7, -500.0))]
    acin = [HourRow(at(D, h), mean=m) for h, m in ((4, 3100.0), (5, 3150.0), (6, 1000.0), (7, 0.0))]
    assert learned_charge_power(dc, acin) == pytest.approx(2650)
    assert learned_charge_power(dc[:1], acin[:1]) is None


def test_product_rows_multiplies_current_and_voltage():
    from custom_components.island_energy.core.forecast import product_rows

    amps = [HourRow(at(D, 4), mean=50.0), HourRow(at(D, 5), mean=None), HourRow(at(D, 6), mean=52.0)]
    volts = [HourRow(at(D, 4), mean=52.0), HourRow(at(D, 5), mean=53.0)]
    (row,) = product_rows(amps, volts)
    assert row.start == at(D, 4)
    assert row.mean == pytest.approx(2600)
