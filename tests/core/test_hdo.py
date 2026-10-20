from datetime import date, timedelta

from custom_components.island_energy.core.hdo import clip, nt_windows, parse_slots

from .helpers import TZ, at

D = date(2026, 10, 20)


def test_parse_shortened_times():
    # EG.D integration strips ':00' → "22" / "06:30"
    out = parse_slots(["00 - 06:30", "08:15 - 09", "22 - 24"], D, TZ)
    assert [(w.start, w.end) for w in out] == [
        (at(D, 0), at(D, 6, 30)),
        (at(D, 8, 15), at(D, 9)),
        (at(D, 22), at(D + timedelta(days=1), 0)),
    ]


def test_parse_tomorrow_prefix_and_overnight():
    out = parse_slots(["Zítra 22 - 6"], D, TZ)
    assert out[0].start == at(D, 22)
    assert out[0].end == at(D + timedelta(days=1), 6)


def test_nt_windows_merge_midnight_and_repeat_pattern():
    out = nt_windows(["0 - 6", "22 - 24"], ["Zítra 0 - 6", "Zítra 22 - 24"], D, TZ, horizon_days=3)
    assert (out[0].start, out[0].end) == (at(D, 0), at(D, 6))
    # 22–24 today merges with 0–6 tomorrow
    assert (out[1].start, out[1].end) == (at(D, 22), at(D + timedelta(days=1), 6))
    assert out[-1].end == at(D + timedelta(days=3), 0)


def test_clip():
    out = nt_windows(["0 - 24"], None, D, TZ, horizon_days=1)
    (w,) = clip(out, at(D, 3), at(D, 5))
    assert (w.start, w.end) == (at(D, 3), at(D, 5))


def test_2359_means_midnight_and_comma_string():
    out = parse_slots("00-07:15, 08:15-09:15, 21:15-23:59", D, TZ)
    assert out[-1].end == at(D + timedelta(days=1), 0)
    assert len(out) == 3


def test_windows_from_hdo_hourly_and_pattern_extension():
    from custom_components.island_energy.core.hdo import extend_pattern, windows_from_hourly

    hourly = {}
    for day in (D, D + timedelta(days=1)):
        for q in range(96):
            t = at(day, 0) + timedelta(minutes=15 * q)
            vt = (t.hour == 7 and t.minute >= 15) or (t.hour == 8 and t.minute < 15)
            hourly[t.replace(tzinfo=None).isoformat()] = 2.0 if vt else 1.0
    out = windows_from_hourly(hourly, TZ)
    assert (out[0].start, out[0].end) == (at(D, 0), at(D, 7, 15))
    # 08:15 today … 07:15 tomorrow is one continuous NT window
    assert (out[1].start, out[1].end) == (at(D, 8, 15), at(D + timedelta(days=1), 7, 15))
    ext = extend_pattern(out, at(D + timedelta(days=3), 0), TZ)
    assert ext[-1].end == at(D + timedelta(days=3), 0)
