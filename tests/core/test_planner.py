from datetime import date, timedelta

import pytest

from custom_components.island_energy.core.forecast import ChargeWindow
from custom_components.island_energy.core.planner import PlannerConfig, plan, schedule_latest

from .helpers import FLAT_600, TZ, at, days_from, pv_day

D = date(2026, 10, 20)  # "today"
T = D + timedelta(days=1)  # "tomorrow"
RECENT_FULL = at(D, 12)  # battery was full today → normal 90 % ceiling


def run(soc_now, tomorrow_kwh, nt=None, last_full=RECENT_FULL, now=None, cfg=None):
    pv = []
    for i in range(7):
        pv += pv_day(D + timedelta(days=i), 25 if i != 1 else tomorrow_kwh)
    return plan(
        now=now or at(D, 21),
        tz=TZ,
        soc_now=soc_now,
        capacity_kwh=20,
        pv=pv,
        profile_w=FLAT_600,
        days=days_from(D),
        nt=nt,
        last_full=last_full,
        cfg=cfg,
    )


def test_no_charge_when_pv_fills_battery():
    res = run(soc_now=70, tomorrow_kwh=25)
    night = res.next_night
    assert night is not None and night.target_day == T
    assert night.needed_kwh == 0
    assert night.windows == ()


def test_charge_tops_up_what_pv_misses_up_to_ceiling():
    res = run(soc_now=50, tomorrow_kwh=8)
    night = res.next_night
    assert night is not None and night.needed_kwh > 0
    # Ceiling 90 % → SoC at the end of charging never above 90 %
    charging = [p for p in res.points if p.grid_kwh > 0]
    assert charging and max(p.hi for p in res.points if p.t <= night.deadline) <= 90.0001
    # Charging ends right at the morning deadline (as late as possible)
    assert night.windows[-1].end == night.deadline


def test_charge_only_inside_nt_windows():
    nt = [ChargeWindow(at(D, 22), at(T, 1)), ChargeWindow(at(T, 3), at(T, 4))]
    res = run(soc_now=50, tomorrow_kwh=8, nt=nt)
    for w in res.next_night.windows:
        assert any(n.start <= w.start and w.end <= n.end for n in nt)
    # latest first: the 3–4 h slot is used before 22–1 h
    assert res.next_night.windows[-1].end == at(T, 4)


def test_weekly_full_charge_uses_100_ceiling():
    res = run(soc_now=50, tomorrow_kwh=8, last_full=at(D - timedelta(days=8), 12))
    assert res.next_night.ceiling == 100
    res = run(soc_now=50, tomorrow_kwh=8)
    assert res.next_night.ceiling == 90


def test_min_soc_protection_overrides_small_ceiling_room():
    # Ceiling below the minimum: the minimum still wins.
    cfg = PlannerConfig(ceiling_pct=15, min_soc_pct=25)
    res = run(soc_now=30, tomorrow_kwh=25, cfg=cfg)
    assert res.next_night.needed_kwh > 0
    assert res.days[1].trough >= 25 - 1


def test_dark_day_still_protects_minimum():
    cfg = PlannerConfig(min_soc_pct=20)
    res = run(soc_now=30, tomorrow_kwh=1, cfg=cfg)
    night = res.next_night
    assert night is not None and night.needed_kwh > 0
    assert min(p.lo for p in res.points if p.t <= night.deadline) >= 20 - 1


def test_grid_kwh_attributed_to_target_day():
    res = run(soc_now=50, tomorrow_kwh=8)
    tomorrow = res.days[1]
    assert tomorrow.grid_kwh == pytest.approx(res.next_night.needed_kwh, abs=0.01)
    assert tomorrow.grid_windows == res.next_night.windows


def test_schedule_latest_reports_short_time():
    allowed = [ChargeWindow(at(D, 23), at(T, 0))]
    out, short = schedule_latest(allowed, timedelta(hours=2), 90)
    assert short
    assert out == [ChargeWindow(at(D, 23), at(T, 0), 90)]


def test_day_reports_soc_at_start_and_end_of_grid_charging():
    res = run(soc_now=50, tomorrow_kwh=8)
    night = res.next_night
    day = next(d for d in res.days if d.day.kind == "tomorrow")
    assert day.grid_kwh > 0
    assert day.grid_start_at == night.windows[0].start
    assert day.grid_end_at == night.windows[-1].end
    # charging (plus early PV) raises the SoC up to the 90 % ceiling
    assert day.grid_start_soc < day.grid_end_soc <= 90.0001
    # a day without grid charging has no start / end
    other = next(d for d in res.days if d.day.kind == "today")
    assert other.grid_start_soc is None and other.grid_end_soc is None
