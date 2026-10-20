"""Planner on real data from Elvis's HA (local only: ``_docs/testdata`` is not in git)."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.island_energy.core.forecast import (
    ForecastDay,
    HourRow,
    build_load_profile,
    measured_points,
    parse_detailed,
)
from custom_components.island_energy.core.planner import plan

from .helpers import TZ

DATA = Path(__file__).resolve().parents[2] / "_docs" / "testdata"
STATS = DATA / "stats_hourly_14d.json"
SOLCAST = DATA / "solcast_detailed_2026-10-20.json"

PV = "sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky"
BAT = "sensor.pylontech_battery_id_512_vykon"
SOC = "sensor.pylontech_battery_id_512_nabijeni"
INV = "sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1"
ACIN = "sensor.multiplus_ii_48_5000_70_50_id_275_prikon_l1"
DAY_IDS = [
    "sensor.solcast_pv_forecast_forecast_today",
    "sensor.solcast_pv_forecast_forecast_tomorrow",
    *(f"sensor.solcast_pv_forecast_forecast_day_{i}" for i in range(3, 8)),
]

pytestmark = pytest.mark.skipif(not STATS.exists() or not SOLCAST.exists(), reason="no local test data")


def rows(stats: dict, entity: str) -> list[HourRow]:
    return [
        HourRow(datetime.fromtimestamp(r["start"] / 1000, UTC), r.get("mean"), r.get("min"), r.get("max"))
        for r in stats[entity]
    ]


def test_plan_on_real_data(capsys):
    stats = json.loads(STATS.read_text())["statistics"]
    solcast = json.loads(SOLCAST.read_text())
    soc_rows = rows(stats, SOC)
    now = soc_rows[-1].start + timedelta(hours=1)
    today = now.astimezone(TZ).replace(hour=0, minute=0, second=0, microsecond=0)

    def full_days(rs: list[HourRow]) -> list[HourRow]:
        return [r for r in rs if today - timedelta(days=7) <= r.start < today]

    profile, source = build_load_profile(
        tz=TZ,
        pv=full_days(rows(stats, PV)),
        battery=full_days(rows(stats, BAT)),
        inverter=full_days(rows(stats, INV)),
        ac_in=full_days(rows(stats, ACIN)) if ACIN in stats else None,
        fallback_daily_kwh=14,
    )
    assert source == "dc"
    daily = sum(profile) / 1000
    assert 11 < daily < 18

    pv = []
    days = []
    for i, eid in enumerate(DAY_IDS):
        start = today + timedelta(days=i)
        end = start + timedelta(days=1)
        pv += parse_detailed(solcast[eid]["detailedForecast"], start, end)
        days.append(ForecastDay(str(i), "today" if i == 0 else "future", start, end, None, daily))

    res = plan(
        now=now,
        tz=TZ,
        soc_now=soc_rows[-1].mean,
        capacity_kwh=19.2,
        pv=pv,
        profile_w=profile,
        days=days,
        history=measured_points(soc_rows, rows(stats, BAT), rows(stats, ACIN) if ACIN in stats else None),
        last_full=None,
    )
    assert len(res.days) == 7
    assert all(n.needed_kwh >= 0 for n in res.nights)
    with capsys.disabled():
        stamp = f"{now.astimezone(TZ):%d.%m. %H:%M}"
        print(f"\nprofil {source} {daily:.1f} kWh/den, SoC teď {soc_rows[-1].mean:.0f} % ({stamp})")
        for d in res.days:
            win = ", ".join(f"{w.start.astimezone(TZ):%H:%M}–{w.end.astimezone(TZ):%H:%M}" for w in d.grid_windows)
            print(
                f"  {d.day.start.astimezone(TZ):%a %d.%m.} ráno {d.trough or 0:5.1f} % "
                f"max {d.peak or 0:5.1f} %  AC IN {d.grid_kwh:4.1f} kWh {win}"
            )
