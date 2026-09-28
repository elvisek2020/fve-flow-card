/**
 * Primitiva okna Analýza: statistiky recorderu (WS), REST historie
 * a čistá matematika nad řadami (bez Lit / DOM).
 */
import type { HomeAssistant } from './types';

export type StatPeriod = '5minute' | 'hour' | 'day';
export type StatType = 'change' | 'state' | 'mean' | 'min' | 'max';

/** Jeden řádek statistiky (časy v ms). */
export interface StatRow {
  start: number;
  end: number;
  change?: number | null;
  state?: number | null;
  mean?: number | null;
  min?: number | null;
  max?: number | null;
}

export type RowMap = Map<string, StatRow[]>;

/** Pravidelná mřížka 5min slotů jednoho dne (DST den má 276 / 300 slotů). */
export interface SlotGrid {
  start: number;
  step: number;
  n: number;
}

export type Slots = (number | null)[];

export const FIVE_MIN_MS = 5 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
/** Výchozí retence krátkodobých (5min) statistik v recorderu (purge_keep_days = 10). */
const SHORT_TERM_MS = 10 * 24 * HOUR_MS;
const TIMEOUT_MS = 20000;

function toMs(v: unknown): number {
  return typeof v === 'number' ? v : Date.parse(String(v));
}

function toNumOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Statistiky více entit jedním voláním `recorder/statistics_during_period`.
 * Prázdný seznam = žádné volání (HA by jinak vrátil všechny statistiky).
 */
export async function fetchStats(
  hass: HomeAssistant,
  ids: string[],
  start: number,
  end: number,
  period: StatPeriod,
  types: StatType[],
): Promise<RowMap> {
  const out: RowMap = new Map();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!hass.callWS || !unique.length || end <= start) return out;
  const result = await withTimeout(
    hass.callWS<Record<string, Array<Record<string, unknown>>>>({
      type: 'recorder/statistics_during_period',
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      statistic_ids: unique,
      period,
      units: { energy: 'kWh', power: 'W' },
      types,
    }),
  );
  for (const id of unique) {
    const raw = result?.[id];
    if (!Array.isArray(raw) || !raw.length) continue;
    const rows = raw
      .map(
        (r): StatRow => ({
          start: toMs(r.start),
          end: toMs(r.end),
          change: toNumOrNull(r.change),
          state: toNumOrNull(r.state),
          mean: toNumOrNull(r.mean),
          min: toNumOrNull(r.min),
          max: toNumOrNull(r.max),
        }),
      )
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end))
      .sort((a, b) => a.start - b.start);
    if (rows.length) out.set(id, rows);
  }
  return out;
}

/**
 * Jemné řádky pro integraci a grafy: 5min statistiky za posledních ~10 dní,
 * starší část rozsahu hodinové. Kratší retenci (5min řádky začínají později)
 * doplní hodinové řádky. `usedHourly` hlásí, že přesnost je jen hodinová.
 */
export async function fetchFineRows(
  hass: HomeAssistant,
  ids: string[],
  start: number,
  end: number,
  types: StatType[],
): Promise<{ rows: RowMap; usedHourly: Set<string> }> {
  const usedHourly = new Set<string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length || end <= start) return { rows: new Map(), usedHourly };

  const split = Math.min(end, Math.max(start, Math.floor((Date.now() - SHORT_TERM_MS) / HOUR_MS) * HOUR_MS));
  const [older, recent] = await Promise.all([
    split > start ? fetchStats(hass, unique, start, split, 'hour', types) : Promise.resolve<RowMap>(new Map()),
    fetchStats(hass, unique, split, end, '5minute', types),
  ]);

  // 5min řádky začínají pozdě → mezeru vyplnit hodinovými (kratší retence).
  const gapEnds = new Map<string, number>();
  for (const id of unique) {
    const first = recent.get(id)?.[0];
    if (first && first.start > split + HOUR_MS) gapEnds.set(id, first.start);
  }
  let gap: RowMap = new Map();
  if (gapEnds.size) {
    const gapEnd = Math.max(...gapEnds.values());
    gap = await fetchStats(hass, [...gapEnds.keys()], split, gapEnd, 'hour', types);
  }

  const rows: RowMap = new Map();
  for (const id of unique) {
    const gapEnd = gapEnds.get(id);
    const gapRows = gapEnd != null ? (gap.get(id) ?? []).filter((r) => r.end <= gapEnd) : [];
    const olderRows = older.get(id) ?? [];
    if (olderRows.length || gapRows.length) usedHourly.add(id);
    const merged = [...olderRows, ...gapRows, ...(recent.get(id) ?? [])];
    if (merged.length) rows.set(id, merged);
  }
  return { rows, usedHourly };
}

/** Číselné stavy entit z REST historie ([ms, hodnota], seřazené). */
export async function fetchHistoryPoints(
  hass: HomeAssistant,
  ids: string[],
  start: number,
  end: number,
): Promise<Map<string, Array<[number, number]>>> {
  const out = new Map<string, Array<[number, number]>>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!hass.callApi || !unique.length || end <= start) return out;
  const path =
    `history/period/${new Date(start).toISOString()}` +
    `?filter_entity_id=${unique.map(encodeURIComponent).join(',')}` +
    `&end_time=${encodeURIComponent(new Date(end).toISOString())}` +
    '&minimal_response&no_attributes';
  const result = await withTimeout(hass.callApi('GET', path));
  if (!Array.isArray(result)) return out;
  for (const series of result) {
    if (!Array.isArray(series) || !series.length) continue;
    const id = (series[0] as { entity_id?: string })?.entity_id;
    if (!id) continue;
    const points: Array<[number, number]> = [];
    for (const item of series as Array<{ state?: string; last_changed?: string; last_updated?: string }>) {
      const v = parseFloat(item?.state ?? '');
      const t = Date.parse(item?.last_changed ?? item?.last_updated ?? '');
      if (Number.isFinite(v) && Number.isFinite(t)) points.push([t, v]);
    }
    points.sort((a, b) => a[0] - b[0]);
    out.set(id, points);
  }
  return out;
}

/**
 * Stavy (držené do další změny) → časově vážené 5min průměry, min a max.
 * REST fallback pro entity bez dlouhodobých statistik.
 */
export function pointsToRows(
  points: Array<[number, number]>,
  start: number,
  end: number,
  step = FIVE_MIN_MS,
): StatRow[] {
  const rows: StatRow[] = [];
  let idx = 0;
  let cur: number | null = null;
  while (idx < points.length && points[idx][0] <= start) {
    cur = points[idx][1];
    idx++;
  }
  for (let s = start; s < end; s += step) {
    const e = Math.min(s + step, end);
    let acc = 0;
    let dur = 0;
    let t = s;
    let mn = Infinity;
    let mx = -Infinity;
    const take = (v: number, until: number) => {
      acc += v * (until - t);
      dur += until - t;
      mn = Math.min(mn, v);
      mx = Math.max(mx, v);
    };
    while (idx < points.length && points[idx][0] < e) {
      const [pt, pv] = points[idx];
      if (cur != null) take(cur, pt);
      cur = pv;
      t = pt;
      idx++;
    }
    if (cur != null) take(cur, e);
    if (dur > 0) rows.push({ start: s, end: e, mean: acc / dur, min: mn, max: mx });
  }
  return rows;
}

/** Energie (kWh) z průměrů výkonu (W). `pos` / `neg` = jen kladná / záporná část (absolutně). */
export function integrateRows(
  rows: StatRow[],
  sign: 'pos' | 'neg',
  dayKeyOf: (t: number) => string,
): { byDay: Map<string, number>; coveredMs: number } {
  const byDay = new Map<string, number>();
  let coveredMs = 0;
  for (const r of rows) {
    if (r.mean == null) continue;
    const v = sign === 'pos' ? Math.max(0, r.mean) : Math.max(0, -r.mean);
    const kwh = (v * (r.end - r.start)) / HOUR_MS / 1000;
    const key = dayKeyOf(r.start);
    byDay.set(key, (byDay.get(key) ?? 0) + kwh);
    coveredMs += r.end - r.start;
  }
  return { byDay, coveredMs };
}

/**
 * Měřák (kWh) po dnech. Jemné řádky: Σ max(0, change) — záporná změna je
 * reset denního měřáku (i `state_class: total` bez `last_reset`).
 * Denní řádky denního měřáku: max(change, state) — `state` je stav na konci dne.
 */
export function meterByDay(
  rows: StatRow[],
  dayKeyOf: (t: number) => string,
  opts: { dayRows: boolean; daily: boolean },
): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    let v: number | null = null;
    if (opts.dayRows && opts.daily) {
      const candidates = [r.change, r.state].filter((x): x is number => x != null && x >= 0);
      v = candidates.length ? Math.max(...candidates) : null;
    } else if (r.change != null) {
      v = Math.max(0, r.change);
    }
    if (v == null) continue;
    const key = dayKeyOf(r.start);
    byDay.set(key, (byDay.get(key) ?? 0) + v);
  }
  return byDay;
}

/** Hodnoty řádků do 5min slotů dne (hodinový řádek vyplní svých 12 slotů). */
export function rowsToSlots(
  rows: StatRow[] | undefined,
  grid: SlotGrid,
  field: 'mean' | 'min' | 'max',
): Slots {
  const out: Slots = new Array(grid.n).fill(null);
  for (const r of rows ?? []) {
    const v = r[field];
    if (v == null) continue;
    const i0 = Math.max(0, Math.round((r.start - grid.start) / grid.step));
    const i1 = Math.min(grid.n, Math.round((r.end - grid.start) / grid.step));
    for (let i = i0; i < i1; i++) out[i] = v;
  }
  return out;
}

/** Součet slotů po prvcích; null jen tam, kde jsou null všechny vstupy. */
export function addSlots(list: Slots[], n: number): Slots {
  const out: Slots = new Array(n).fill(null);
  for (const s of list) {
    for (let i = 0; i < n; i++) {
      const v = s[i];
      if (v != null) out[i] = (out[i] ?? 0) + v;
    }
  }
  return out;
}
