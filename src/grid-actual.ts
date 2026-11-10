/**
 * Skutečné nabíjení ze sítě přes AC IN po kalendářních dnech (okno Prognóza).
 * Energie z čítačů MultiPlusu (nabíječ + průchod, stejně jako „Celkem dnes ze
 * sítě“ v kartě), úseky nabíjení a SoC z 5min statistik recorderu.
 */
import type { AcInConfig, HomeAssistant } from './types';
import { fetchFineRows, HOUR_MS, type RowMap, type StatRow } from './analysis-stats';

export interface GridActualDay {
  /** kWh ze sítě přes AC IN (nabíječ + průchod) za kalendářní den. */
  kwh: number;
  /** Z toho do nabíječe a průchodem do domu (null = čítač není nastavený). */
  charger: number | null;
  pass: number | null;
  /** Souvislé úseky nabíjení ze sítě v rámci dne (ms), na půlnoci rozdělené. */
  windows: Array<{ start: number; end: number }>;
  /** SoC na začátku prvního a na konci posledního úseku. */
  startSoc: number | null;
  endSoc: number | null;
}

/** Od jakého průměrného příkonu AC IN se interval počítá jako nabíjení ze sítě (W). */
export const GRID_ACTIVE_W = 50;
/** Úseky s mezerou do 10 min jsou jedno nabíjení. */
const MERGE_GAP_MS = 10 * 60 * 1000;
/** Rezerva nad maximem příkonu, než se změna čítače považuje za skok (reset, výpadek). */
const CAP_FACTOR = 1.2;
const CAP_SLACK_KWH = 0.01;
/** Bez příkonu: víc než 25 kW průměrně je nesmysl (skok čítače). */
const ABS_CAP_KW = 25;

/** Místní datum YYYY-MM-DD (stejný tvar jako `PlannerDay.date`). */
export function localDate(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Slot {
  start: number;
  end: number;
  charger: number | null;
  pass: number | null;
  powerMean: number | null;
  powerMax: number | null;
  socMin: number | null;
  socMax: number | null;
}

export interface GridActualRows {
  charger?: StatRow[];
  pass?: StatRow[];
  power?: StatRow[];
  soc?: StatRow[];
}

/**
 * Energie, úseky a SoC po dnech. Čítače jdou přes `change` recorderu (ten u
 * `total_increasing` sám přečká nulování po restartu měniče). Záporná změna se
 * nepočítá a změna nad možné maximum podle příkonu (skok čítače) se nahradí
 * integrálem příkonu.
 */
export function gridActualByDay(rows: GridActualRows): Map<string, GridActualDay> {
  const slots = new Map<number, Slot>();
  const slot = (r: StatRow): Slot => {
    let s = slots.get(r.start);
    if (!s) {
      s = { start: r.start, end: r.end, charger: null, pass: null, powerMean: null, powerMax: null, socMin: null, socMax: null };
      slots.set(r.start, s);
    }
    return s;
  };
  for (const r of rows.charger ?? []) if (r.change != null) slot(r).charger = Math.max(0, r.change);
  for (const r of rows.pass ?? []) if (r.change != null) slot(r).pass = Math.max(0, r.change);
  for (const r of rows.power ?? []) {
    const s = slot(r);
    s.powerMean = r.mean ?? null;
    s.powerMax = r.max ?? r.mean ?? null;
  }
  for (const r of rows.soc ?? []) {
    const s = slot(r);
    s.socMin = r.min ?? r.mean ?? null;
    s.socMax = r.max ?? r.mean ?? null;
  }
  const meters = !!(rows.charger?.length || rows.pass?.length);
  const hasPower = !!rows.power?.length;

  const out = new Map<string, GridActualDay>();
  const day = (key: string): GridActualDay => {
    let d = out.get(key);
    if (!d) {
      d = { kwh: 0, charger: meters ? 0 : null, pass: meters ? 0 : null, windows: [], startSoc: null, endSoc: null };
      out.set(key, d);
    }
    return d;
  };
  // Poslední aktivní interval dne (pro SoC na konci úseku).
  const lastActive = new Map<string, Slot>();

  for (const s of [...slots.values()].sort((a, b) => a.start - b.start)) {
    const hours = (s.end - s.start) / HOUR_MS;
    const key = localDate(s.start);
    const d = day(key);
    let charger = s.charger ?? 0;
    let pass = s.pass ?? 0;
    let e = charger + pass;
    const integral = s.powerMean != null ? (Math.max(0, s.powerMean) / 1000) * hours : null;
    if (!meters || (s.charger == null && s.pass == null)) {
      // Bez čítačů (nebo jim chybí řádek) integrál příkonu, celé jako nabíječ.
      e = integral ?? 0;
      charger = e;
      pass = 0;
    } else {
      const cap =
        s.powerMax != null ? (Math.max(0, s.powerMax) / 1000) * hours * CAP_FACTOR + CAP_SLACK_KWH : ABS_CAP_KW * hours;
      if (e > cap) {
        // Skok čítače: energii vezme z příkonu, poměr nabíječ / průchod zahodí.
        e = integral ?? 0;
        charger = e;
        pass = 0;
      }
    }
    d.kwh += e;
    if (d.charger != null) d.charger += charger;
    if (d.pass != null) d.pass += pass;

    const active = hasPower ? (s.powerMean ?? 0) > GRID_ACTIVE_W : e / hours > GRID_ACTIVE_W / 1000;
    if (!active) continue;
    const last = d.windows[d.windows.length - 1];
    if (last && s.start - last.end <= MERGE_GAP_MS) {
      last.end = s.end;
    } else {
      d.windows.push({ start: s.start, end: s.end });
      if (d.windows.length === 1) d.startSoc = s.socMin;
    }
    lastActive.set(key, s);
  }
  for (const [key, s] of lastActive) out.get(key)!.endSoc = s.socMax;
  return out;
}

/** Statistiky pro `gridActualByDay` od `start` do `end` (5min, starší část hodinová). */
export async function fetchGridActual(
  hass: HomeAssistant,
  ac: AcInConfig,
  socId: string | undefined,
  start: number,
  end: number,
): Promise<Map<string, GridActualDay>> {
  const energyIds = [ac.energy_to_charger, ac.energy_passthrough].filter((x): x is string => !!x);
  const powerIds = [ac.power, socId].filter((x): x is string => !!x);
  const [energy, power] = await Promise.all([
    energyIds.length ? fetchFineRows(hass, energyIds, start, end, ['change']) : null,
    powerIds.length ? fetchFineRows(hass, powerIds, start, end, ['mean', 'min', 'max']) : null,
  ]);
  const get = (m: { rows: RowMap } | null, id?: string) => (m && id ? m.rows.get(id) : undefined);
  return gridActualByDay({
    charger: get(energy, ac.energy_to_charger),
    pass: get(energy, ac.energy_passthrough),
    power: get(power, ac.power),
    soc: get(power, socId),
  });
}
