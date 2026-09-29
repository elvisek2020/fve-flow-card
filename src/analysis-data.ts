/**
 * Data okna Analýza: období, plán entit s fallbacky, načtení statistik
 * a odvozené veličiny (soběstačnost, neměřeno, DC bilance, predikce).
 * Každé číslo může být samostatně `null` (UI „—“), odhad má `approx`.
 */
import type { FveFlowCardConfig, HomeAssistant } from './types';
import { toLocalDayKey } from './daily-stats';
import {
  FIVE_MIN_MS,
  HOUR_MS,
  addSlots,
  fetchFineRows,
  fetchHistoryPoints,
  fetchStats,
  integrateRows,
  meterByDay,
  pointsToRows,
  rowsToSlots,
  type RowMap,
  type SlotGrid,
  type Slots,
  type StatRow,
} from './analysis-stats';

export type AnalysisPeriod = 'last24h' | 'today' | 'yesterday' | 'week' | 'month';

export interface DayInfo {
  key: string;
  start: number;
  end: number;
  label: string;
}

export interface PeriodRange {
  period: AnalysisPeriod;
  start: number;
  /** Konec dat: dnes = teď, včera = dnešní půlnoc. */
  end: number;
  /** Konec posledního dne (osa grafu 0–24 h). */
  dayEnd: number;
  days: DayInfo[];
  /** Jeden den → průběh dne; víc dní → denní sloupce. */
  intraday: boolean;
  includesToday: boolean;
  label: string;
}

const fmtWeekday = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric' });
const fmtDayMonth = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' });

/** Období podle lokální půlnoci (DST den má 23 / 25 h); 24 h = klouzavé okno do teď. */
export function periodRange(period: AnalysisPeriod, now = new Date()): PeriodRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const dayStart = (offset: number) => new Date(y, m, d + offset).getTime();
  if (period === 'last24h') {
    const end = now.getTime();
    // Začátek zarovnaný na 5 min (sloty statistik); okno zasahuje do včerejška.
    const start = Math.floor((end - 24 * HOUR_MS) / FIVE_MIN_MS) * FIVE_MIN_MS;
    const days = [-1, 0].map((off) => {
      const s = dayStart(off);
      return { key: toLocalDayKey(new Date(s)), start: s, end: dayStart(off + 1), label: off ? 'Včera' : 'Dnes' };
    });
    return {
      period,
      start,
      end,
      dayEnd: end,
      days: days.filter((x) => x.end > start),
      intraday: true,
      includesToday: true,
      label: 'posledních 24 h',
    };
  }
  const count = period === 'week' ? 7 : period === 'month' ? 30 : 1;
  const first = period === 'yesterday' ? -1 : -(count - 1);
  const days: DayInfo[] = [];
  for (let k = 0; k < count; k++) {
    const off = first + k;
    const start = dayStart(off);
    const date = new Date(start);
    days.push({
      key: toLocalDayKey(date),
      start,
      end: dayStart(off + 1),
      label:
        period === 'today'
          ? 'Dnes'
          : period === 'yesterday'
            ? 'Včera'
            : period === 'week'
              ? fmtWeekday.format(date)
              : fmtDayMonth.format(date),
    });
  }
  const includesToday = period !== 'yesterday';
  const start = days[0].start;
  const dayEnd = days[days.length - 1].end;
  return {
    period,
    start,
    end: includesToday ? now.getTime() : dayEnd,
    dayEnd,
    days,
    intraday: count === 1,
    includesToday,
    label:
      period === 'today'
        ? 'dnes'
        : period === 'yesterday'
          ? 'včera'
          : `${fmtDayMonth.format(new Date(start))} – ${fmtDayMonth.format(new Date(dayStart(0)))}`,
  };
}

// ---------------------------------------------------------------------------
// Plán entit
// ---------------------------------------------------------------------------

type Candidate =
  | { kind: 'meter'; id: string; daily: boolean }
  | { kind: 'integral'; ids: string[]; sign: 'pos' | 'neg'; signed: boolean }
  | { kind: 'floors'; part: 'fve' | 'grid' };

interface FloorPlan {
  name: string;
  fve: Candidate[];
  grid: Candidate[];
}

export interface AnalysisPlan {
  fve: Candidate[];
  grid: Candidate[];
  pv: Candidate[];
  charge: Candidate[];
  discharge: Candidate[];
  floors: FloorPlan[];
  fveConfigured: boolean;
  gridConfigured: boolean;
  chart: { pv?: string; battery?: string; ac?: string; grid: string[]; soc?: string };
  solcast: { today?: string; tomorrow?: string; remaining?: string };
  batteryInvert: boolean;
  fullSocPct: number;
  minSocPct: number;
  gridName: string;
}

const clean = (v?: string): string | undefined => v?.trim() || undefined;

function meter(id: string | undefined, daily: boolean): Candidate[] {
  const i = clean(id);
  return i ? [{ kind: 'meter', id: i, daily }] : [];
}

function integral(ids: Array<string | undefined>, sign: 'pos' | 'neg' = 'pos', signed = false): Candidate[] {
  const list = ids.map(clean).filter((x): x is string => !!x);
  return list.length ? [{ kind: 'integral', ids: list, sign, signed }] : [];
}

/**
 * Pořadí zdrojů: měřák → integrál výkonu → součet pater. Integrál má přednost
 * před součtem pater, protože ten nezná neměřené okruhy (Neměřeno by bylo 0).
 */
export function buildPlan(cfg: FveFlowCardConfig): AnalysisPlan {
  const inv = cfg.inverter ?? {};
  const g = cfg.grid ?? {};
  const pv = cfg.pv ?? {};
  const b = cfg.battery ?? {};
  const s = cfg.solcast ?? {};
  const acId = clean(inv.load_power) ?? clean(inv.power);
  const acInPhases = [g.phase_a, g.phase_b, g.phase_c];
  const gridPowerIds = clean(g.power) ? [g.power] : acInPhases;

  const floors: FloorPlan[] = (cfg.floors ?? []).map((f, i) => {
    const phases = [f.phase_a_entity, f.phase_b_entity, f.phase_c_entity];
    const hasGrid = !!(clean(f.grid_power) || clean(f.grid_energy) || phases.some(clean));
    const hasFve = !!(clean(f.island_power) || clean(f.island_energy));
    return {
      name: f.name || `Patro ${i + 1}`,
      fve: hasFve ? [...meter(f.island_energy, false), ...integral([f.island_power])] : [],
      grid: hasGrid
        ? [...meter(f.grid_energy, false), ...integral(clean(f.grid_power) ? [f.grid_power] : phases)]
        : [],
    };
  });

  const floorGridPowerIds = (cfg.floors ?? []).flatMap((f) =>
    clean(f.grid_power) ? [f.grid_power!] : [f.phase_a_entity, f.phase_b_entity, f.phase_c_entity],
  );
  const chartGrid = [...gridPowerIds, ...(gridPowerIds.some(clean) ? [] : floorGridPowerIds)]
    .map(clean)
    .filter((x): x is string => !!x);

  const fve = [...meter(inv.energy_today, true), ...integral([acId])];
  const grid = [...meter(g.energy_total, false), ...meter(g.energy_today, true), ...integral(gridPowerIds)];

  return {
    fve: [...fve, { kind: 'floors', part: 'fve' }],
    grid: [...grid, { kind: 'floors', part: 'grid' }],
    pv: [...meter(pv.energy_today, true), ...meter(pv.energy_total, false), ...integral([pv.power])],
    charge: integral([b.power], b.invert ? 'neg' : 'pos', true),
    discharge: integral([b.power], b.invert ? 'pos' : 'neg', true),
    floors,
    fveConfigured: fve.length > 0 || floors.some((f) => f.fve.length),
    gridConfigured: grid.length > 0 || floors.some((f) => f.grid.length),
    chart: {
      pv: clean(pv.power),
      battery: clean(b.power),
      ac: acId,
      grid: chartGrid,
      soc: clean(b.soc),
    },
    solcast: { today: clean(s.total_today), tomorrow: clean(s.total_tomorrow), remaining: clean(s.remaining_today) },
    batteryInvert: !!b.invert,
    fullSocPct: cfg.analysis?.full_soc_pct ?? 98,
    minSocPct: cfg.forecast?.min_soc_pct ?? 10,
    gridName: g.name || 'Síť',
  };
}

// ---------------------------------------------------------------------------
// Veličiny a jejich rozlišení
// ---------------------------------------------------------------------------

export interface Quantity {
  total: number | null;
  byDay: Map<string, number>;
  /** Odhad (integrál s mezerami / hodinovou přesností, neúplný součet pater…). */
  approx: boolean;
  source: 'meter' | 'integral' | 'floors' | 'none';
  /** Dny doplněné součtem pater — nehodí se pro srovnání hlavní dodávky s patry. */
  fromFloors?: Set<string>;
}

const none = (): Quantity => ({ total: null, byDay: new Map(), approx: false, source: 'none' });

function sumMap(m: Map<string, number>): number {
  let s = 0;
  for (const v of m.values()) s += v;
  return s;
}

interface Store {
  dayRows: boolean;
  meters: RowMap;
  power: RowMap;
  hourly: Set<string>;
  fetchedMeters: Set<string>;
  fetchedPower: Set<string>;
  /** Délka rozsahu, kterou by měla pokrýt data (pro „≈“ u integrálů). */
  expectedMs: number;
  /** Dny, které má veličina pokrýt (chybějící se doplní dalším zdrojem v řetězci). */
  dayKeys: string[];
}

const dayKeyOf = (t: number): string => toLocalDayKey(new Date(t));

type Eval = Quantity | 'pending' | null;

function evalCandidate(
  c: Candidate,
  st: Store,
  floorParts: (part: 'fve' | 'grid') => Quantity[] | null,
): Eval {
  if (c.kind === 'meter') {
    if (!st.fetchedMeters.has(c.id)) return 'pending';
    const rows = st.meters.get(c.id);
    if (!rows) return null;
    const byDay = meterByDay(rows, dayKeyOf, { dayRows: st.dayRows, daily: c.daily });
    // Měřák založený uprostřed období: jeho první den je neúplný → doplní ho další zdroj.
    if (st.dayRows) {
      const first = [...byDay.keys()].sort()[0];
      if (first && st.dayKeys.length && first > st.dayKeys[0]) byDay.delete(first);
    }
    if (!byDay.size) return null;
    return { total: sumMap(byDay), byDay, approx: false, source: 'meter' };
  }
  if (c.kind === 'integral') {
    if (c.ids.some((id) => !st.fetchedPower.has(id))) return 'pending';
    const byDay = new Map<string, number>();
    let minCovered = Infinity;
    let any = false;
    let hourly = false;
    for (const id of c.ids) {
      const rows = st.power.get(id);
      if (!rows) continue;
      any = true;
      if (st.hourly.has(id)) hourly = true;
      const r = integrateRows(rows, c.sign, dayKeyOf);
      minCovered = Math.min(minCovered, r.coveredMs);
      for (const [k, v] of r.byDay) byDay.set(k, (byDay.get(k) ?? 0) + v);
    }
    if (!any) return null;
    const approx = minCovered < 0.95 * st.expectedMs || (c.signed && hourly);
    return { total: sumMap(byDay), byDay, approx, source: 'integral' };
  }
  const parts = floorParts(c.part);
  if (!parts || !parts.length) return null;
  const known = parts.filter((q) => q.total != null);
  if (!known.length) return null;
  // Jen dny, kdy mají data všechna patra s daty — jinak by součet podhodnotil.
  const byDay = new Map<string, number>();
  for (const k of known[0].byDay.keys()) {
    if (known.every((q) => q.byDay.has(k))) byDay.set(k, known.reduce((sum, q) => sum + q.byDay.get(k)!, 0));
  }
  if (!byDay.size) return null;
  return {
    total: sumMap(byDay),
    byDay,
    approx: known.length < parts.length || known.some((q) => q.approx),
    source: 'floors',
    fromFloors: new Set(byDay.keys()),
  };
}

interface Resolved {
  fve: Quantity;
  grid: Quantity;
  pv: Quantity;
  charge: Quantity;
  discharge: Quantity;
  floors: Array<{ fve: Quantity | null; grid: Quantity | null }>;
  pendingPower: string[];
}

function resolveChain(
  chain: Candidate[],
  st: Store,
  floorParts: (part: 'fve' | 'grid') => Quantity[] | null,
  pending: Set<string>,
): Quantity {
  // Dny doplňuje po sobě: první zdroj s daty, chybějící dny z dalších v řetězci
  // (např. měřák založený před 11 dny + integrál výkonu za zbytek období).
  let acc: Quantity | null = null;
  for (const c of chain) {
    const missing = acc ? st.dayKeys.filter((k) => !acc!.byDay.has(k)) : st.dayKeys;
    if (acc && !missing.length) break;
    const r = evalCandidate(c, st, floorParts);
    if (r === 'pending') {
      if (c.kind === 'integral') c.ids.forEach((id) => pending.add(id));
      break;
    }
    if (!r) continue;
    if (!acc) {
      acc = { ...r, byDay: new Map(r.byDay), fromFloors: r.fromFloors ? new Set(r.fromFloors) : undefined };
      continue;
    }
    for (const k of missing) {
      const v = r.byDay.get(k);
      if (v == null) continue;
      acc.byDay.set(k, v);
      acc.approx = true;
      if (r.source === 'floors') (acc.fromFloors ??= new Set()).add(k);
    }
  }
  if (!acc) return none();
  acc.total = sumMap(acc.byDay);
  return acc;
}

function resolveAll(plan: AnalysisPlan, st: Store): Resolved {
  const pending = new Set<string>();
  const noFloors = () => null;
  const floors = plan.floors.map((f) => ({
    fve: f.fve.length ? resolveChain(f.fve, st, noFloors, pending) : null,
    grid: f.grid.length ? resolveChain(f.grid, st, noFloors, pending) : null,
  }));
  const floorParts = (part: 'fve' | 'grid'): Quantity[] | null => {
    const list = floors.map((f) => f[part]).filter((q): q is Quantity => q != null);
    return list.length ? list : null;
  };
  return {
    fve: resolveChain(plan.fve, st, floorParts, pending),
    grid: resolveChain(plan.grid, st, floorParts, pending),
    pv: resolveChain(plan.pv, st, floorParts, pending),
    charge: resolveChain(plan.charge, st, floorParts, pending),
    discharge: resolveChain(plan.discharge, st, floorParts, pending),
    floors,
    pendingPower: [...pending],
  };
}

function meterIds(plan: AnalysisPlan): string[] {
  const all = [plan.fve, plan.grid, plan.pv, ...plan.floors.flatMap((f) => [f.fve, f.grid])].flat();
  return all.flatMap((c) => (c.kind === 'meter' ? [c.id] : []));
}

// ---------------------------------------------------------------------------
// Solcast
// ---------------------------------------------------------------------------

/** Půlhodinové období predikce (W). */
export interface ForecastPeriod {
  start: number;
  end: number;
  p50: number;
  p10: number | null;
  p90: number | null;
}

/** `detailedForecast` (kW) → období v rozsahu [from, to) ve W. */
export function parseDetailed(attr: unknown, from: number, to: number): ForecastPeriod[] {
  if (!Array.isArray(attr)) return [];
  const kw = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n * 1000 : null;
  };
  const items = attr
    .map((item) => {
      const rec = (item ?? {}) as Record<string, unknown>;
      return {
        start: Date.parse(String(rec.period_start ?? '')),
        p50: kw(rec.pv_estimate),
        p10: kw(rec.pv_estimate10),
        p90: kw(rec.pv_estimate90),
      };
    })
    .filter((x) => Number.isFinite(x.start) && x.p50 != null)
    .sort((a, b) => a.start - b.start);
  return items
    .map((x, i) => ({
      start: x.start,
      end: items[i + 1] && items[i + 1].start - x.start <= HOUR_MS ? items[i + 1].start : x.start + 30 * 60 * 1000,
      p50: x.p50!,
      p10: x.p10,
      p90: x.p90,
    }))
    .filter((p) => p.end > from && p.start < to);
}

/** Predikovaná energie (kWh) v intervalu [from, until). */
export function forecastKwh(periods: ForecastPeriod[], from: number, until: number, field: 'p50' | 'p10' = 'p50'): number {
  let kwh = 0;
  for (const p of periods) {
    const v = field === 'p50' ? p.p50 : p.p10;
    if (v == null) continue;
    const overlap = Math.min(p.end, until) - Math.max(p.start, from);
    if (overlap > 0) kwh += (v * overlap) / HOUR_MS / 1000;
  }
  return kwh;
}

/**
 * Predikce den předem: první hodnota `total_today` po půlnoci daného dne,
 * záložně poslední `total_tomorrow` z předchozího dne. Limit = retence recorderu.
 */
async function fetchDayAhead(
  hass: HomeAssistant,
  plan: AnalysisPlan,
  days: DayInfo[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const ids = [plan.solcast.today, plan.solcast.tomorrow].filter((x): x is string => !!x);
  if (!ids.length || !days.length) return out;
  const start = days[0].start - 24 * HOUR_MS;
  const end = Math.min(Date.now(), days[days.length - 1].start + 3 * HOUR_MS);
  const points = await fetchHistoryPoints(hass, ids, start, end);
  const today = plan.solcast.today ? points.get(plan.solcast.today) ?? [] : [];
  const tomorrow = plan.solcast.tomorrow ? points.get(plan.solcast.tomorrow) ?? [] : [];
  for (const d of days) {
    const first = today.find(([t]) => t >= d.start && t < d.start + 3 * HOUR_MS);
    if (first) {
      out.set(d.key, first[1]);
      continue;
    }
    const prev = tomorrow.filter(([t]) => t >= d.start - 24 * HOUR_MS && t < d.start).pop();
    if (prev) out.set(d.key, prev[1]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Výsledek
// ---------------------------------------------------------------------------

export interface FloorResult {
  name: string;
  fve: number | null;
  grid: number | null;
  hasFve: boolean;
  hasGrid: boolean;
  total: number | null;
  share: number | null;
  approx: boolean;
}

export interface IntradaySeries {
  grid: SlotGrid;
  pv: Slots;
  battery: Slots;
  ac: Slots;
  gridW: Slots;
  soc: Slots;
  /** Úseky, kdy byla baterie plná (SoC max ≥ práh). */
  fullSpans: Array<{ from: number; to: number }>;
}

export interface AnalysisData {
  range: PeriodRange;
  /** Čas, ke kterému jsou data (konec posledního statistického řádku). */
  asOf: number | null;
  fve: Quantity;
  grid: Quantity;
  pv: Quantity;
  charge: Quantity;
  discharge: Quantity;
  fveConfigured: boolean;
  gridConfigured: boolean;
  gridName: string;
  floors: FloorResult[];
  house: number | null;
  selfSufficiency: number | null;
  unmeasured: { fve: number | null; grid: number | null };
  mismatch: { fve: number | null; grid: number | null };
  dc: {
    /** Hodnoty za dny, kdy mají data všechny čtyři veličiny (FVE, nabito, vybito, AC). */
    pv: number | null;
    charge: number | null;
    discharge: number | null;
    ac: number | null;
    inverterIn: number | null;
    losses: number | null;
    efficiency: number | null;
    cycles: number | null;
    mismatch: boolean;
    days: number | null;
  };
  /** Počet dní, ze kterých jsou spočítané bilance (Neměřeno / nesoulad / DC). */
  balanceDays: { fve: number | null; grid: number | null; dc: number | null; total: number };
  soc: { min: number | null; max: number | null };
  /** Víc dní: počet dní s plnou baterií. */
  fullDays: number | null;
  forecast: {
    periods: ForecastPeriod[];
    soFar: number | null;
    total: number | null;
    remaining: number | null;
    tomorrow: number | null;
    byDay: Map<string, number>;
    fulfilment: number | null;
    curtailed: { p50: number; p10: number | null } | null;
  };
  series: IntradaySeries | null;
  warnings: string[];
  minSocPct: number;
  fullSocPct: number;
  capacityKwh: number;
}

export interface AnalysisContext {
  hass: HomeAssistant;
  plan: AnalysisPlan;
  capacityKwh: number;
}

async function safe<T>(p: Promise<T>, fallback: T, warnings: string[], label: string): Promise<T> {
  try {
    return await p;
  } catch {
    warnings.push(`${label} se nepodařilo načíst.`);
    return fallback;
  }
}

function numState(hass: HomeAssistant, id?: string): number | null {
  if (!id) return null;
  const v = parseFloat(hass.states[id]?.state ?? '');
  return Number.isFinite(v) ? v : null;
}

function kwhState(hass: HomeAssistant, id?: string): number | null {
  const v = numState(hass, id);
  if (v == null || !id) return null;
  const unit = String(hass.states[id]?.attributes.unit_of_measurement ?? 'kWh').toLowerCase();
  return unit === 'wh' ? v / 1000 : unit === 'mwh' ? v * 1000 : v;
}

/** Načte statistiky, dotáhne chybějící integrály (max. 2 kola) a vrátí rozlišené veličiny. */
async function resolveWithFetch(
  ctx: AnalysisContext,
  st: Store,
  fetchPower: (ids: string[]) => Promise<{ rows: RowMap; usedHourly: Set<string> }>,
): Promise<Resolved> {
  let res = resolveAll(ctx.plan, st);
  for (let round = 0; round < 2 && res.pendingPower.length; round++) {
    const ids = res.pendingPower;
    const fetched = await fetchPower(ids);
    ids.forEach((id) => st.fetchedPower.add(id));
    for (const [id, rows] of fetched.rows) st.power.set(id, rows);
    fetched.usedHourly.forEach((id) => st.hourly.add(id));
    res = resolveAll(ctx.plan, st);
  }
  return res;
}

function socRange(rows: StatRow[] | undefined): { min: number | null; max: number | null } {
  let mn = Infinity;
  let mx = -Infinity;
  for (const r of rows ?? []) {
    if (r.min != null) mn = Math.min(mn, r.min);
    if (r.max != null) mx = Math.max(mx, r.max);
  }
  return { min: Number.isFinite(mn) ? mn : null, max: Number.isFinite(mx) ? mx : null };
}

function fullSpans(grid: SlotGrid, socMax: Slots, fullSoc: number): Array<{ from: number; to: number }> {
  const spans: Array<{ from: number; to: number }> = [];
  let from: number | null = null;
  for (let i = 0; i <= grid.n; i++) {
    const full = i < grid.n && socMax[i] != null && socMax[i]! >= fullSoc;
    const t = grid.start + i * grid.step;
    if (full && from == null) from = t;
    if (!full && from != null) {
      spans.push({ from, to: t });
      from = null;
    }
  }
  return spans;
}

/** Jeden den (Dnes / Včera): 5min statistiky, průběh dne, predikce a nevyužitá výroba. */
export async function loadDay(ctx: AnalysisContext, range: PeriodRange): Promise<AnalysisData> {
  const { hass, plan } = ctx;
  const warnings: string[] = [];
  const chartIds = [plan.chart.pv, plan.chart.battery, plan.chart.ac, plan.chart.soc, ...plan.chart.grid].filter(
    (x): x is string => !!x,
  );
  const mIds = meterIds(plan);
  const empty = { rows: new Map() as RowMap, usedHourly: new Set<string>() };
  const [meters, power] = await Promise.all([
    safe(fetchFineRows(hass, mIds, range.start, range.end, ['change']), empty, warnings, 'Statistiky měřáků'),
    safe(fetchFineRows(hass, chartIds, range.start, range.end, ['mean', 'min', 'max']), empty, warnings, 'Statistiky výkonů'),
  ]);

  // Entity bez dlouhodobých statistik: průběh dne z REST historie.
  const missing = chartIds.filter((id) => !power.rows.has(id));
  if (missing.length) {
    const points = await safe(fetchHistoryPoints(hass, missing, range.start, range.end), new Map(), warnings, 'Historie');
    for (const [id, pts] of points) {
      const rows = pointsToRows(pts, range.start, range.end);
      if (rows.length) power.rows.set(id, rows);
    }
  }

  if (!meters.rows.size && !power.rows.size && (mIds.length || chartIds.length)) {
    warnings.push(
      'Home Assistant nevrátil žádné statistiky — entity potřebují state_class (measurement u výkonu, total_increasing u energie).',
    );
  }
  const allRows = [...meters.rows.values(), ...power.rows.values()].flat();
  const asOf = allRows.length ? Math.min(range.end, Math.max(...allRows.map((r) => r.end))) : null;
  const st: Store = {
    dayRows: false,
    meters: meters.rows,
    power: power.rows,
    hourly: power.usedHourly,
    fetchedMeters: new Set(mIds),
    fetchedPower: new Set(chartIds),
    expectedMs: Math.max(1, (asOf ?? range.end) - range.start),
    dayKeys: range.days.map((x) => x.key),
  };
  const res = await resolveWithFetch(ctx, st, (ids) =>
    safe(fetchFineRows(hass, ids, range.start, range.end, ['mean']), empty, warnings, 'Statistiky výkonů'),
  );

  // Průběh dne v 5min slotech.
  const grid: SlotGrid = { start: range.start, step: FIVE_MIN_MS, n: Math.round((range.dayEnd - range.start) / FIVE_MIN_MS) };
  const slot = (id?: string, field: 'mean' | 'max' = 'mean') => rowsToSlots(id ? power.rows.get(id) : undefined, grid, field);
  const battery = slot(plan.chart.battery).map((v) => (v == null ? null : plan.batteryInvert ? -v : v));
  const socMax = slot(plan.chart.soc, 'max');
  const series: IntradaySeries = {
    grid,
    pv: slot(plan.chart.pv),
    battery,
    ac: slot(plan.chart.ac),
    gridW: addSlots(plan.chart.grid.map((id) => slot(id)), grid.n),
    soc: slot(plan.chart.soc),
    fullSpans: fullSpans(grid, socMax, plan.fullSocPct),
  };

  // Predikce (Dnes i 24 h berou živou predikci dneška; detailedForecast je jen od půlnoci).
  const today = range.period === 'today' || range.period === 'last24h';
  const todayStart = range.days[range.days.length - 1].start;
  const periods = today && plan.solcast.today
    ? parseDetailed(hass.states[plan.solcast.today]?.attributes.detailedForecast, range.start, range.dayEnd)
    : [];
  const until = asOf ?? range.end;
  const soFar = periods.length ? forecastKwh(periods, Math.max(range.start, todayStart), until) : null;
  let dayAhead = new Map<string, number>();
  if (!today) {
    dayAhead = await safe(fetchDayAhead(hass, plan, range.days), new Map(), warnings, 'Historie predikce Solcast');
    if (plan.solcast.today && !dayAhead.size) warnings.push('Predikce Solcast za včerejšek není v historii.');
  }
  const total = today ? kwhState(hass, plan.solcast.today) : dayAhead.get(range.days[0].key) ?? null;
  // U 24 h se plnění porovnává jen za dnešní část okna (predikce jen od půlnoci).
  let pvTotal = res.pv.total;
  if (range.period === 'last24h') {
    let kwh = 0;
    let any = false;
    series.pv.forEach((v, i) => {
      const t = grid.start + i * grid.step;
      if (v == null || t < todayStart || t + grid.step > until) return;
      kwh += (v * grid.step) / HOUR_MS / 1000;
      any = true;
    });
    pvTotal = any ? kwh : null;
  }
  const ref = today ? soFar : total;
  const fulfilment = pvTotal != null && ref != null && ref > 0.1 ? pvTotal / ref : null;

  // Nevyužitá výroba: sloty s plnou baterií, kde skutečnost zaostala za predikcí.
  let curtailed: { p50: number; p10: number | null } | null = null;
  if (periods.length && plan.chart.soc && plan.chart.pv) {
    let p50 = 0;
    let p10 = 0;
    let hasP10 = true;
    let counted = false;
    for (let i = 0; i < grid.n; i++) {
      const t = grid.start + i * grid.step;
      if (t + grid.step > until) break;
      const pvW = series.pv[i];
      if (pvW == null || socMax[i] == null || socMax[i]! < plan.fullSocPct) continue;
      const mid = t + grid.step / 2;
      const p = periods.find((x) => mid >= x.start && mid < x.end);
      if (!p) continue;
      counted = true;
      const h = grid.step / HOUR_MS / 1000;
      p50 += Math.max(0, p.p50 - pvW) * h;
      if (p.p10 == null) hasP10 = false;
      else p10 += Math.max(0, p.p10 - pvW) * h;
    }
    if (counted) curtailed = { p50, p10: hasP10 ? p10 : null };
  }

  const soc = socRange(plan.chart.soc ? power.rows.get(plan.chart.soc) : undefined);
  return derive(ctx, range, res, {
    asOf,
    soc,
    fullDays: null,
    series,
    warnings,
    forecast: {
      periods,
      soFar,
      total,
      remaining: today ? kwhState(hass, plan.solcast.remaining) : null,
      tomorrow: today ? kwhState(hass, plan.solcast.tomorrow) : null,
      byDay: dayAhead,
      fulfilment,
      curtailed,
    },
  });
}

/**
 * 7 / 30 dní: minulé dny z denních statistik (měřáky) a jemných řádků
 * (baterie), dnešní sloupec z dat Dnes (jeden zdroj pravdy).
 */
export async function loadRange(
  ctx: AnalysisContext,
  range: PeriodRange,
  todayData: Promise<AnalysisData>,
): Promise<AnalysisData> {
  const { hass, plan } = ctx;
  const warnings: string[] = [];
  const todayStart = range.days[range.days.length - 1].start;
  const mIds = meterIds(plan);
  const batteryIds = plan.chart.battery ? [plan.chart.battery] : [];
  const empty = { rows: new Map() as RowMap, usedHourly: new Set<string>() };
  const [meters, socRows, battery, dayAhead] = await Promise.all([
    safe(fetchStats(hass, mIds, range.start, todayStart, 'day', ['change', 'state']), new Map() as RowMap, warnings, 'Denní statistiky'),
    safe(
      fetchStats(hass, plan.chart.soc ? [plan.chart.soc] : [], range.start, todayStart, 'day', ['min', 'max']),
      new Map() as RowMap,
      warnings,
      'Statistiky SoC',
    ),
    safe(fetchFineRows(hass, batteryIds, range.start, todayStart, ['mean']), empty, warnings, 'Statistiky baterie'),
    safe(fetchDayAhead(hass, plan, range.days), new Map<string, number>(), warnings, 'Historie predikce Solcast'),
  ]);
  const st: Store = {
    dayRows: true,
    meters,
    power: battery.rows,
    hourly: battery.usedHourly,
    fetchedMeters: new Set(mIds),
    fetchedPower: new Set(batteryIds),
    expectedMs: Math.max(1, todayStart - range.start),
    dayKeys: range.days.slice(0, -1).map((d) => d.key),
  };
  const past = await resolveWithFetch(ctx, st, (ids) =>
    safe(fetchFineRows(hass, ids, range.start, todayStart, ['mean']), empty, warnings, 'Statistiky výkonů'),
  );

  let today: AnalysisData | null = null;
  try {
    today = await todayData;
  } catch {
    warnings.push('Data za dnešek se nepodařilo načíst.');
  }
  const todayKey = range.days[range.days.length - 1].key;
  const pastKeys = range.days.slice(0, -1).map((d) => d.key);
  const merge = (q: Quantity, t: Quantity | undefined): Quantity => {
    if (q.source === 'none' && (!t || t.total == null)) return none();
    const byDay = new Map(q.byDay);
    if (t?.total != null) byDay.set(todayKey, t.total);
    const missingPast = q.source !== 'none' && pastKeys.some((k) => !byDay.has(k));
    const fromFloors = new Set([...(q.fromFloors ?? [])]);
    if (t?.total != null && t.source === 'floors') fromFloors.add(todayKey);
    return {
      total: byDay.size ? sumMap(byDay) : null,
      byDay,
      approx: q.approx || !!t?.approx || missingPast || q.source === 'none',
      source: q.source !== 'none' ? q.source : t?.source ?? 'none',
      fromFloors: fromFloors.size ? fromFloors : undefined,
    };
  };
  const res: Resolved = {
    fve: merge(past.fve, today?.fve),
    grid: merge(past.grid, today?.grid),
    pv: merge(past.pv, today?.pv),
    charge: merge(past.charge, today?.charge),
    discharge: merge(past.discharge, today?.discharge),
    floors: past.floors.map((f, i) => ({
      fve: f.fve ? merge(f.fve, today ? floorQuantity(today, i, 'fve') : undefined) : null,
      grid: f.grid ? merge(f.grid, today ? floorQuantity(today, i, 'grid') : undefined) : null,
    })),
    pendingPower: [],
  };
  const missingDays = pastKeys.filter((k) => !res.pv.byDay.has(k) && !res.fve.byDay.has(k)).length;
  if (missingDays && (res.pv.source !== 'none' || res.fve.source !== 'none')) {
    warnings.push(`Chybí data za ${missingDays} ${missingDays === 1 ? 'den' : missingDays < 5 ? 'dny' : 'dní'}.`);
  }

  // SoC a plné dny (včetně dneška).
  const socMin: number[] = [];
  const socMaxByDay = new Map<string, number>();
  for (const r of socRows.get(plan.chart.soc ?? '') ?? []) {
    if (r.min != null) socMin.push(r.min);
    if (r.max != null) socMaxByDay.set(dayKeyOf(r.start), r.max);
  }
  if (today?.soc.min != null) socMin.push(today.soc.min);
  if (today?.soc.max != null) socMaxByDay.set(todayKey, today.soc.max);
  const socMaxes = [...socMaxByDay.values()];
  const soc = {
    min: socMin.length ? Math.min(...socMin) : null,
    max: socMaxes.length ? Math.max(...socMaxes) : null,
  };
  const fullDays = socMaxes.length ? socMaxes.filter((v) => v >= plan.fullSocPct).length : null;

  // Plnění predikce jen za celé dny (dnešek je rozpracovaný).
  let sumA = 0;
  let sumF = 0;
  for (const k of pastKeys) {
    const a = res.pv.byDay.get(k);
    const f = dayAhead.get(k);
    if (a != null && f != null) {
      sumA += a;
      sumF += f;
    }
  }
  if (plan.solcast.today && pastKeys.some((k) => !dayAhead.has(k))) {
    warnings.push(`Predikce Solcast je jen za ${pastKeys.filter((k) => dayAhead.has(k)).length} z ${pastKeys.length} minulých dní (retence recorderu).`);
  }
  const pastForecast = pastKeys.reduce((s, k) => s + (dayAhead.get(k) ?? 0), 0);

  return derive(ctx, range, res, {
    asOf: today?.asOf ?? null,
    soc,
    fullDays,
    series: null,
    warnings: [...warnings, ...(today?.warnings ?? [])],
    forecast: {
      periods: [],
      soFar: null,
      total: dayAhead.size ? pastForecast + (dayAhead.get(todayKey) ?? 0) : null,
      remaining: null,
      tomorrow: null,
      byDay: dayAhead,
      fulfilment: sumF > 0.1 ? sumA / sumF : null,
      curtailed: null,
    },
  });
}

/** Veličina patra z hotových dat (pro dnešní sloupec vícedenního období). */
function floorQuantity(d: AnalysisData, i: number, part: 'fve' | 'grid'): Quantity | undefined {
  const f = d.floors[i];
  const v = f?.[part];
  if (v == null) return undefined;
  return { total: v, byDay: new Map([[d.range.days[0].key, v]]), approx: f.approx, source: 'meter' };
}

interface DeriveExtra {
  asOf: number | null;
  soc: { min: number | null; max: number | null };
  fullDays: number | null;
  series: IntradaySeries | null;
  warnings: string[];
  forecast: AnalysisData['forecast'];
}

/** Dny, kdy mají data všechny veličiny (a hlavní dodávka není jen součtem pater). */
function commonDays(qs: Quantity[], exclude?: Set<string>): string[] {
  if (!qs.length) return [];
  return [...qs[0].byDay.keys()].filter((k) => !exclude?.has(k) && qs.every((q) => q.byDay.has(k)));
}

const sumDays = (q: Quantity, days: string[]) => days.reduce((s, k) => s + (q.byDay.get(k) ?? 0), 0);

/**
 * Rozdíl hlavní dodávky a součtu pater s tolerancí max(0,05 kWh, 2 %) — jen za
 * společné dny, aby měřák s kratší historií nevyrobil falešný nesoulad.
 */
function unmeasuredOf(
  main: Quantity,
  parts: Quantity[],
): { u: number | null; mismatch: number | null; days: number | null } {
  if (main.total == null || main.source === 'floors' || !parts.length) return { u: null, mismatch: null, days: null };
  const days = commonDays([main, ...parts], main.fromFloors);
  if (!days.length) return { u: null, mismatch: null, days: 0 };
  const m = sumDays(main, days);
  const d = m - parts.reduce((s, q) => s + sumDays(q, days), 0);
  const tol = Math.max(0.05, 0.02 * m);
  if (d > tol) return { u: d, mismatch: null, days: days.length };
  if (d < -tol) return { u: 0, mismatch: -d, days: days.length };
  return { u: 0, mismatch: null, days: days.length };
}

function derive(ctx: AnalysisContext, range: PeriodRange, res: Resolved, x: DeriveExtra): AnalysisData {
  const { plan, capacityKwh } = ctx;
  const fve = res.fve.total;
  const grid = res.grid.total;
  const configured = [plan.fveConfigured ? fve : 0, plan.gridConfigured ? grid : 0];
  const house = configured.some((v) => v == null) || (fve == null && grid == null) ? null : (fve ?? 0) + (grid ?? 0);
  const floors: FloorResult[] = plan.floors.map((f, i) => {
    const q = res.floors[i];
    const fv = q.fve?.total ?? null;
    const gv = q.grid?.total ?? null;
    const known = [fv, gv].filter((v): v is number => v != null);
    const total = known.length ? known.reduce((s, v) => s + v, 0) : null;
    return {
      name: f.name,
      fve: fv,
      grid: gv,
      hasFve: q.fve != null,
      hasGrid: q.grid != null,
      total,
      share: total != null && house != null && house > 0 ? total / house : null,
      approx: !!(q.fve?.approx || q.grid?.approx) || (q.fve != null && fv == null) || (q.grid != null && gv == null),
    };
  });
  const partsOf = (part: 'fve' | 'grid') =>
    res.floors.map((f) => f[part]).filter((q): q is Quantity => q != null);
  const uf = unmeasuredOf(res.fve, partsOf('fve'));
  const ug = unmeasuredOf(res.grid, partsOf('grid'));

  // DC bilance jen za společné dny: vstup střídače = FVE − nabito + vybito; ztráty = vstup − AC.
  const dis = res.discharge.total;
  let dc: AnalysisData['dc'] = {
    pv: null,
    charge: null,
    discharge: null,
    ac: null,
    inverterIn: null,
    losses: null,
    efficiency: null,
    cycles: null,
    mismatch: false,
    days: null,
  };
  const dcQs = [res.pv, res.charge, res.discharge, res.fve];
  if (dcQs.every((q) => q.total != null)) {
    const days = commonDays(dcQs);
    if (days.length) {
      const [pv, ch, di, ac] = dcQs.map((q) => sumDays(q, days));
      const inverterIn = pv - ch + di;
      const raw = inverterIn - ac;
      const tol = Math.max(0.05, 0.03 * Math.abs(inverterIn));
      const mismatch = raw < -tol;
      dc = {
        pv,
        charge: ch,
        discharge: di,
        ac,
        inverterIn,
        losses: mismatch ? null : Math.max(0, raw),
        efficiency: !mismatch && inverterIn > 0.05 ? Math.min(1, ac / inverterIn) : null,
        cycles: null,
        mismatch,
        days: days.length,
      };
    }
  }
  dc.cycles = dis != null && capacityKwh > 0 ? dis / capacityKwh : null;

  // Upozornění, když bilance nejde spočítat za celé období.
  // 24 h zasahuje do dvou kalendářních dnů jen částečně — pokrytí po dnech tu nedává smysl.
  const totalDays = range.period === 'last24h' ? 0 : range.days.length;
  const warnings = [...x.warnings];
  const partial = (days: number | null, what: string) => {
    if (days != null && days > 0 && days < totalDays) {
      warnings.push(`${what} je spočítané jen za ${days} z ${totalDays} dní (ostatní dny nemají data ze všech měřáků).`);
    }
  };
  partial(uf.days, 'Neměřeno a nesoulad FVE');
  partial(ug.days, 'Neměřeno a nesoulad sítě');
  partial(dc.days, 'DC bilance');

  return {
    range,
    asOf: x.asOf,
    fve: res.fve,
    grid: res.grid,
    pv: res.pv,
    charge: res.charge,
    discharge: res.discharge,
    fveConfigured: plan.fveConfigured,
    gridConfigured: plan.gridConfigured,
    gridName: plan.gridName,
    floors,
    house,
    selfSufficiency: house != null && house > 0 && fve != null ? fve / house : null,
    unmeasured: { fve: uf.u, grid: ug.u },
    mismatch: { fve: uf.mismatch, grid: ug.mismatch },
    dc,
    balanceDays: { fve: uf.days, grid: ug.days, dc: dc.days, total: totalDays },
    soc: x.soc,
    fullDays: x.fullDays,
    forecast: x.forecast,
    series: x.series,
    warnings: [...new Set(warnings)],
    minSocPct: plan.minSocPct,
    fullSocPct: plan.fullSocPct,
    capacityKwh,
  };
}
