/**
 * Čistý model prognózy výdrže baterie — simulace SoC po 15 minutách:
 * výroba podle Solcastu (detailedForecast) − hodinový profil odběru z baterie.
 * Pro každý den hledá „ranní minimum“ (SoC ve chvíli, kdy se baterie začne
 * nabíjet) a „maximum“ dne (a kdy dosáhne 100 %). Bez závislosti na Lit / DOM.
 */

export type ForecastDayKind = 'past' | 'today' | 'tomorrow' | 'future';

/** Výroba v intervalu (W) — z detailedForecast Solcastu. */
export interface PvPeriod {
  start: number;
  end: number;
  w: number;
}

/** Bod časové osy SoC: naměřený (hodina, min / max) nebo simulovaný (lo = hi). */
export interface SocPoint {
  t: number;
  /** Nejnižší SoC v bodě (u hodinové statistiky min). */
  lo: number;
  /** Nejvyšší SoC v bodě (u hodinové statistiky max). */
  hi: number;
  /** Baterie se v tomto bodě nabíjí (výroba > odběr). */
  charging: boolean;
  measured: boolean;
}

export interface ForecastDay {
  label: string;
  kind: ForecastDayKind;
  start: number;
  end: number;
  pvKwh: number | null;
  loadKwh: number | null;
}

export interface ForecastDayResult extends ForecastDay {
  /** Ranní minimum — SoC, když se baterie začne nabíjet (bez nabíjení minimum dne). */
  trough: number | null;
  troughAt: number | null;
  /** Nejvyšší SoC po začátku nabíjení. */
  peak: number | null;
  peakAt: number | null;
  /** Kdy SoC dosáhne 100 % (≥ 99,5 %), jinak null. */
  fullAt: number | null;
  /** Baterie se v tento den nabíjí. */
  charges: boolean;
  /** Ranní minimum pod prahem min_soc_pct. */
  risk: boolean;
  /** Hodnoty jsou z historie (ne z simulace). */
  measured: boolean;
}

export interface BatteryForecastResult {
  days: ForecastDayResult[];
  minSocPct: number;
  /** Žádný den (dnes a dál) nemá ranní minimum pod prahem. */
  ok: boolean;
  /** Odkud je profil odběru: odběr z baterie (DC), výstup měniče (AC), nebo rovnoměrně. */
  loadSource: 'dc' | 'ac' | 'flat';
  /** Denní odběr podle profilu (kWh). */
  dailyLoadKwh: number;
}

export const FULL_SOC = 99.5;
const STEP_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function clampSoc(soc: number): number {
  if (!Number.isFinite(soc)) return 0;
  return Math.min(100, Math.max(0, soc));
}

export function forwardKind(index: number): ForecastDayKind {
  if (index === 0) return 'today';
  if (index === 1) return 'tomorrow';
  return 'future';
}

/** Řádek hodinové statistiky (podmnožina StatRow). */
export interface HourRow {
  start: number;
  mean?: number | null;
  min?: number | null;
  max?: number | null;
}

/**
 * Hodinový profil odběru (W, 24 hodnot podle místní hodiny). Primárně odběr
 * z baterie na DC straně = výroba − nabíjení (zahrnuje ztráty měniče), jinak
 * výstup měniče, jinak rovnoměrně z denní spotřeby. Hodina potřebuje ≥ 3 vzorky.
 */
export function buildLoadProfile(opts: {
  pv?: HourRow[];
  /** Výkon baterie, kladný = nabíjení. */
  battery?: HourRow[];
  inverter?: HourRow[];
  fallbackDailyKwh: number;
}): { profile: number[]; source: 'dc' | 'ac' | 'flat' } {
  const average = (pairs: Array<[number, number]>) => {
    const sum = new Array<number>(24).fill(0);
    const cnt = new Array<number>(24).fill(0);
    for (const [t, w] of pairs) {
      const h = new Date(t).getHours();
      sum[h] += w;
      cnt[h]++;
    }
    return cnt.every((c) => c >= 3) ? sum.map((v, h) => Math.max(0, v / cnt[h])) : null;
  };
  if (opts.pv?.length && opts.battery?.length) {
    const bat = new Map(opts.battery.map((r) => [r.start, r.mean]));
    const pairs: Array<[number, number]> = [];
    for (const r of opts.pv) {
      const b = bat.get(r.start);
      if (r.mean != null && b != null) pairs.push([r.start, r.mean - b]);
    }
    const p = average(pairs);
    if (p) return { profile: p, source: 'dc' };
  }
  if (opts.inverter?.length) {
    const p = average(opts.inverter.filter((r) => r.mean != null).map((r) => [r.start, r.mean!]));
    if (p) return { profile: p, source: 'ac' };
  }
  const flat = (Math.max(0, opts.fallbackDailyKwh) * 1000) / 24;
  return { profile: new Array<number>(24).fill(flat), source: 'flat' };
}

/**
 * Naměřená časová osa SoC z hodinových statistik (min / max SoC, nabíjení
 * podle průměrného výkonu baterie > 50 W).
 */
export function measuredPoints(soc: HourRow[], battery: HourRow[] | undefined): SocPoint[] {
  const bat = new Map((battery ?? []).map((r) => [r.start, r.mean]));
  return soc
    .filter((r) => r.min != null || r.mean != null)
    .map((r) => {
      const lo = r.min ?? r.mean!;
      const hi = r.max ?? r.mean!;
      const b = bat.get(r.start);
      return {
        t: r.start,
        lo,
        hi,
        charging: b != null ? b > 50 : hi - lo > 1 && (r.mean ?? lo) > lo,
        measured: true,
      };
    });
}

/**
 * Simulace SoC od `now` po 15 min do konce horizontu:
 * SoC += (výroba − odběr) × Δt / kapacita, ořez 0–100 %.
 */
export function simulatePoints(opts: {
  now: number;
  socNow: number;
  capacityKwh: number;
  pv: PvPeriod[];
  profileW: number[];
  until: number;
}): SocPoint[] {
  const cap = Math.max(0.001, opts.capacityKwh);
  const pv = [...opts.pv].sort((a, b) => a.start - b.start);
  const points: SocPoint[] = [];
  let soc = clampSoc(opts.socNow);
  let k = 0;
  // První krok jen do nejbližší čtvrthodiny, dál po celých 15 min (čitelné časy).
  let t = opts.now;
  while (t < opts.until) {
    const next = Math.min(opts.until, (Math.floor(t / STEP_MS) + 1) * STEP_MS);
    const mid = (t + next) / 2;
    while (k < pv.length && pv[k].end <= mid) k++;
    const pvW = k < pv.length && pv[k].start <= mid ? pv[k].w : 0;
    const loadW = opts.profileW[new Date(mid).getHours()] ?? 0;
    const net = pvW - loadW;
    points.push({ t, lo: soc, hi: soc, charging: net > 0, measured: false });
    soc = clampSoc(soc + ((net * (next - t)) / HOUR_MS / 1000 / cap) * 100);
    t = next;
  }
  points.push({ t: opts.until, lo: soc, hi: soc, charging: false, measured: false });
  return points;
}

/**
 * Pro každý den z časové osy: ranní minimum (do prvního nabíjení), maximum
 * po něm a čas dosažení 100 %. Body mimo den se ignorují.
 */
export function analyzeDays(
  days: ForecastDay[],
  points: SocPoint[],
  minSocPct: number,
): ForecastDayResult[] {
  return days.map((day) => {
    const pts = points.filter((p) => p.t >= day.start && p.t < day.end);
    const base = { ...day, trough: null, troughAt: null, peak: null, peakAt: null, fullAt: null, charges: false, risk: false };
    if (!pts.length) return { ...base, measured: day.kind === 'past' };
    const c = pts.findIndex((p) => p.charging);
    const before = c < 0 ? pts : pts.slice(0, c + 1);
    let trough = before[0];
    for (const p of before) if (p.lo < trough.lo) trough = p;
    let peak: SocPoint | null = null;
    let fullAt: number | null = null;
    if (c >= 0) {
      for (const p of pts.slice(c)) {
        if (!peak || p.hi > peak.hi) peak = p;
        if (fullAt == null && p.hi >= FULL_SOC) fullAt = p.t;
      }
    }
    return {
      ...base,
      trough: trough.lo,
      troughAt: trough.t,
      peak: peak ? peak.hi : null,
      peakAt: peak ? peak.t : null,
      fullAt,
      charges: c >= 0,
      risk: trough.lo < minSocPct,
      measured: pts.every((p) => p.measured),
    };
  });
}

/**
 * Výroba dne jako intervaly ve W. S detailedForecast přímo; bez něj se tvar
 * půjčí z jiného dne (škálovaný na denní kWh), jinak sinus 7–19 h.
 */
export function pvPeriodsForDay(
  dayStart: number,
  dayKwh: number | null,
  detailed: PvPeriod[],
  template: PvPeriod[] | null,
): PvPeriod[] {
  if (detailed.length) return detailed;
  if (dayKwh == null || dayKwh <= 0) return [];
  const shape: Array<{ off: number; len: number; w: number }> = template?.length
    ? template.map((p) => {
        const d0 = new Date(p.start);
        const midnight = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime();
        return { off: p.start - midnight, len: p.end - p.start, w: p.w };
      })
    : Array.from({ length: 24 }, (_, i) => {
        const h = 7 + (i + 0.5) / 2;
        return { off: (7 * 2 + i) * 30 * 60 * 1000, len: 30 * 60 * 1000, w: Math.sin((Math.PI * (h - 7)) / 12) };
      });
  const total = shape.reduce((a, s) => a + (s.w * s.len) / HOUR_MS / 1000, 0);
  if (total <= 0) return [];
  const k = dayKwh / total;
  return shape.map((s) => ({ start: dayStart + s.off, end: dayStart + s.off + s.len, w: s.w * k }));
}

/**
 * Převede kapacitu entity na kWh.
 * Ah → kWh přes napětí (default 48 V u EasySolar-II 48).
 */
export function capacityToKwh(
  value: number,
  unit: string | undefined,
  voltageV = 48,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const u = (unit ?? '').trim().toLowerCase();
  if (u === 'kwh' || u === 'kw·h' || u === 'kw.h') return value;
  if (u === 'wh') return value / 1000;
  if (u === 'ah' || u === 'a·h' || u === 'a.h') {
    const v = Number.isFinite(voltageV) && voltageV > 0 ? voltageV : 48;
    return (value * v) / 1000;
  }
  // Bez jednotky předpokládáme kWh (typické u template / ručních senzorů).
  return value;
}

/** Popisky Dnes / Zítra / zkrácené datum pro dalších 5 dní. */
export function forecastDayLabels(now = new Date(), locale = 'cs-CZ'): string[] {
  const labels: string[] = ['Dnes', 'Zítra'];
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });
  for (let i = 2; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    labels.push(fmt.format(d));
  }
  return labels;
}

/**
 * Popisky pro `count` dní zpět (nejstarší první), bez dneška.
 * Stejný formát data jako u forward D3+.
 */
export function pastDayLabels(count: number, now = new Date(), locale = 'cs-CZ'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });
  const labels: string[] = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(fmt.format(d));
  }
  return labels;
}
