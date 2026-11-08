from datetime import date, time, timedelta

import pytest

from custom_components.island_energy.core.forecast import ChargeWindow
from custom_components.island_energy.core.planner import PlannerConfig, night_bounds, plan, schedule_latest

from .helpers import FLAT_600, TZ, at, days_from, pv_day

D = date(2026, 10, 20)  # "today"
T = D + timedelta(days=1)  # "tomorrow"
# 20 kWh battery, 600 W flat load (14.4 kWh/day ≈ 72 %/day), night window 21:00 → 08:00


def run(soc_now, tomorrow_kwh, nt=None, now=None, cfg=None, pv_kwh=25, days=None):
    pv = []
    for i in range(7):
        kwh = days[i] if days and i < len(days) else (pv_kwh if i != 1 else tomorrow_kwh)
        pv += pv_day(D + timedelta(days=i), kwh)
    return plan(
        now=now or at(D, 21),
        tz=TZ,
        soc_now=soc_now,
        capacity_kwh=20,
        pv=pv,
        profile_w=FLAT_600,
        days=days_from(D),
        nt=nt,
        cfg=cfg,
    )


def tomorrow_night(res):
    return next(n for n in res.nights if n.target_day == T)


def test_no_charge_when_the_reserve_holds():
    res = run(soc_now=70, tomorrow_kwh=25)
    night = tomorrow_night(res)
    assert night.needed_kwh == 0 and night.windows == ()
    assert night.reserve_min_without >= 30


def test_dark_day_charges_only_up_to_the_reserve():
    res = run(soc_now=50, tomorrow_kwh=2)
    night = tomorrow_night(res)
    assert night.reserve_min_without < 30 and night.needed_kwh > 0
    # just enough for the reserve until the next night, not "100 % after PV"
    assert night.reserve_min == pytest.approx(30, abs=3)
    # only inside the night window, as late as possible
    assert night.windows[0].start >= at(D, 21) and night.windows[-1].end <= at(T, 8)
    assert night.windows[-1].end == at(T, 8)


def test_sunny_day_after_a_low_night_does_not_top_up_for_pv():
    # Old goal "reach 100 % after PV" would charge here; the reserve holds without it.
    res = run(soc_now=60, tomorrow_kwh=12)
    assert tomorrow_night(res).needed_kwh == 0


def test_ceiling_is_a_hard_limit():
    cfg = PlannerConfig(ceiling_pct=50, reserve_pct=30)
    res = run(soc_now=40, tomorrow_kwh=0, cfg=cfg)
    night = tomorrow_night(res)
    assert night.short  # 50 % at 8:00 is not enough for 13 h without PV
    assert max(p.hi for p in res.points if at(D, 21) <= p.t <= at(T, 8)) <= 50.0001


def test_daytime_low_tariff_is_not_used():
    nt = [
        ChargeWindow(at(D, 21, 15), at(T, 7, 15)),
        ChargeWindow(at(T, 8, 15), at(T, 9, 15)),
        ChargeWindow(at(T, 10, 15), at(T, 18, 15)),
    ]
    res = run(soc_now=40, tomorrow_kwh=2, nt=nt)
    for w in tomorrow_night(res).windows:
        assert at(D, 21, 15) <= w.start and w.end <= at(T, 7, 15)


def test_charge_only_inside_nt_windows_latest_first():
    nt = [ChargeWindow(at(D, 22), at(T, 1)), ChargeWindow(at(T, 3), at(T, 4))]
    res = run(soc_now=50, tomorrow_kwh=2, nt=nt)
    for w in tomorrow_night(res).windows:
        assert any(n.start <= w.start and w.end <= n.end for n in nt)
    assert tomorrow_night(res).windows[-1].end == at(T, 4)


def test_custom_night_interval():
    cfg = PlannerConfig(night_start=time(23, 0), night_end=time(6, 0))
    res = run(soc_now=50, tomorrow_kwh=2, cfg=cfg)
    for w in tomorrow_night(res).windows:
        assert at(D, 23) <= w.start and w.end <= at(T, 6)


SUNSETS = {D + timedelta(days=i): at(D + timedelta(days=i), 16, 21) for i in range(-1, 8)}


def evening_nt(days: int = 8) -> list[ChargeWindow]:
    """NT 19:15 → 07:15 every night."""
    return [ChargeWindow(at(D + timedelta(days=i), 19, 15), at(D + timedelta(days=i + 1), 7, 15)) for i in range(days)]


def test_night_bounds_open_at_sunset_and_keep_the_reserve_until_the_evening():
    day = days_from(D)[1]
    cfg = PlannerConfig(night_starts=SUNSETS)
    assert night_bounds(day, TZ, cfg) == (at(D, 16, 21), at(T, 8), at(T, 21))
    # A sunset later than the fixed time: the next night cannot charge earlier.
    late = {D: at(D, 21, 30), T: at(T, 21, 30)}
    assert night_bounds(day, TZ, PlannerConfig(night_starts=late)) == (at(D, 21, 30), at(T, 8), at(T, 21, 30))
    # A date without sunset falls back to the fixed time.
    assert night_bounds(day, TZ, PlannerConfig()) == (at(D, 21), at(T, 8), at(T, 21))


def test_sunset_start_does_not_change_a_plan_that_fits_late():
    kwargs = {"soc_now": 50, "tomorrow_kwh": 2, "nt": evening_nt(), "now": at(D, 15)}
    fixed = run(**kwargs)
    sunset = run(**kwargs, cfg=PlannerConfig(night_starts=SUNSETS))
    assert tomorrow_night(fixed).needed_kwh > 0
    assert [n.windows for n in sunset.nights] == [n.windows for n in fixed.nights]
    assert [n.needed_kwh for n in sunset.nights] == [n.needed_kwh for n in fixed.nights]
    # The evening after sunset still counts against the reserve.
    assert [n.reserve_min_without for n in sunset.nights] == [n.reserve_min_without for n in fixed.nights]


def test_sunset_start_uses_the_evening_only_when_the_later_nt_is_short():
    nt = [ChargeWindow(at(D, 19, 15), at(D, 21)), ChargeWindow(at(D, 22), at(D, 22, 30))]
    kwargs = {"soc_now": 50, "tomorrow_kwh": 2, "nt": nt, "now": at(D, 15)}
    fixed = tomorrow_night(run(**kwargs))
    assert all(w.start >= at(D, 22) for w in fixed.windows)
    night = tomorrow_night(run(**kwargs, cfg=PlannerConfig(night_starts=SUNSETS)))
    assert night.windows[-1].start == at(D, 22)  # the latest NT is filled first
    assert at(D, 19, 15) <= night.windows[0].start < at(D, 21)
    assert night.needed_kwh > fixed.needed_kwh


def test_low_tariff_before_sunset_stays_unused():
    nt = [ChargeWindow(at(D, 15), at(D, 18)), ChargeWindow(at(D, 22), at(D, 22, 30))]
    cfg = PlannerConfig(min_soc_pct=0, night_starts=SUNSETS)  # the minimum may use any NT
    res = run(soc_now=50, tomorrow_kwh=0, nt=nt, now=at(D, 12), cfg=cfg, days=[0, 0])
    night = tomorrow_night(res)
    assert night.windows and night.windows[0].start >= at(D, 16, 15)
    assert sum((w.end - w.start for w in night.windows), timedelta()) > timedelta(minutes=30)


def test_minimum_protection_may_start_before_the_night():
    cfg = PlannerConfig(min_soc_pct=20)
    res = run(soc_now=22, tomorrow_kwh=2, now=at(D, 18), cfg=cfg)
    night = tomorrow_night(res)
    assert night.protect_min and night.windows[0].start < at(D, 21)
    assert min(p.lo for p in res.points if p.t <= at(T, 8)) >= 20 - 1


def test_short_night_makes_the_night_before_charge_more():
    # Night before day 2 has only half an hour of NT: night 1 charges up to the ceiling.
    d2 = D + timedelta(days=2)
    nt = [ChargeWindow(at(D, 21), at(T, 8)), ChargeWindow(at(d2, 5), at(d2, 5, 30))]
    nt += [ChargeWindow(at(D + timedelta(days=i), 21), at(D + timedelta(days=i + 1), 8)) for i in range(2, 7)]
    res = run(soc_now=50, tomorrow_kwh=2, nt=nt, days=[25, 2, 2])
    first = tomorrow_night(res)
    assert first.boosted
    end_soc = next(p.lo for p in res.points if p.t >= first.windows[-1].end)
    assert end_soc == pytest.approx(90, abs=1.5)


def test_grid_kwh_attributed_to_target_day():
    res = run(soc_now=50, tomorrow_kwh=2)
    tomorrow = res.days[1]
    night = tomorrow_night(res)
    assert tomorrow.grid_kwh == pytest.approx(night.needed_kwh, abs=0.01)
    assert tomorrow.grid_windows == night.windows


def test_schedule_latest_reports_short_time():
    allowed = [ChargeWindow(at(D, 23), at(T, 0))]
    out, short = schedule_latest(allowed, timedelta(hours=2), 90)
    assert short
    assert out == [ChargeWindow(at(D, 23), at(T, 0), 90)]


def test_day_reports_soc_at_start_and_end_of_grid_charging():
    res = run(soc_now=50, tomorrow_kwh=2)
    night = tomorrow_night(res)
    day = next(d for d in res.days if d.day.kind == "tomorrow")
    assert day.grid_kwh > 0
    assert day.grid_start_at == night.windows[0].start
    assert day.grid_end_at == night.windows[-1].end
    assert day.grid_start_soc < day.grid_end_soc <= 90.0001
    other = next(d for d in res.days if d.day.kind == "today")
    assert other.grid_start_soc is None and other.grid_end_soc is None


def test_minimum_protection_stays_within_its_own_night():
    # Regression: a later night's minimum protection looked for the SoC crossing from
    # "now" and put its charging into an earlier morning (even daytime NT).
    from datetime import datetime

    d0 = date(2026, 10, 25)
    nt = []
    for i in range(9):
        d = d0 + timedelta(days=i - 1)
        weekend = d.weekday() >= 5
        slots = [(0, 0, 8 if weekend else 7, 15), (21, 15, 24, 0)]
        slots += [(9, 15, 10, 15), (11, 15, 18, 15)] if weekend else [(8, 15, 9, 15), (10, 15, 18, 15)]
        for h0, m0, h1, m1 in slots:
            nt.append(ChargeWindow(at(d, h0, m0), at(d + timedelta(days=1), 0) if h1 == 24 else at(d, h1, m1)))
    pv = []
    for i, kwh in enumerate((7, 14, 7, 9, 10, 12, 3)):
        pv += pv_day(d0 + timedelta(days=i), kwh)
    cfg = PlannerConfig(charge_power_w=2083, ceiling_pct=90, reserve_pct=30, min_soc_pct=25)
    res = plan(
        now=at(d0, 22), tz=TZ, soc_now=50, capacity_kwh=19.2, pv=pv, profile_w=[700.0] * 24,
        days=days_from(d0), nt=nt, cfg=cfg,
    )  # fmt: skip
    for night in res.nights:
        previous_end = datetime.combine(night.target_day - timedelta(days=1), time(8, 0), TZ)
        assert all(w.start >= previous_end for w in night.windows), night
    assert min(p.lo for p in res.points if p.t < at(d0 + timedelta(days=6), 21)) >= 24


def test_reserve_hysteresis_keeps_the_plan_from_flipping():
    def need(soc, cfg, held=frozenset()):
        pv = []
        for i in range(7):
            pv += pv_day(D + timedelta(days=i), 12 if i == 1 else 25)
        res = plan(
            now=at(D, 21),
            tz=TZ,
            soc_now=soc,
            capacity_kwh=20,
            pv=pv,
            profile_w=FLAT_600,
            days=days_from(D),
            cfg=cfg,
            held=held,
        )
        return tomorrow_night(res).needed_kwh

    # reserve 28.8 % (just under 30): a new plan waits for reserve − 2 %, a held one keeps charging
    small = PlannerConfig(min_charge_kwh=0.1, reserve_hysteresis_pct=2.0)
    assert need(61, small) == 0
    assert need(61, small, frozenset({T})) > 0
    # 0.64 kWh missing: below the 1 kWh start, above half of it while held
    cfg = PlannerConfig(min_charge_kwh=1.0, reserve_hysteresis_pct=2.0)
    assert need(59, cfg) == 0
    assert need(59, cfg, frozenset({T})) > 0
    # a clear deficit (reserve ~20 %) plans charging also without the hold
    assert need(52, cfg) > 0
