import type { HomeAssistant } from './types';

/** Jedna denní statistika (change / state) z recorderu. */
interface StatisticPoint {
  start: string | number;
  end?: string | number;
  change?: number | null;
  state?: number | null;
  sum?: number | null;
  mean?: number | null;
}

type StatisticsResult = Record<string, StatisticPoint[]>;

function toLocalDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function pointDayKey(start: string | number): string | null {
  const t = typeof start === 'number' ? start : Date.parse(start);
  if (!Number.isFinite(t)) return null;
  return toLocalDayKey(new Date(t));
}

function isNum(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v);
}

/**
 * Denní energie (kWh) za posledních `daysBack` celých dní (bez dneška).
 * Preferuje `change` ze statistics; fallback na `state` (typické u denních meterů,
 * i když `change` vyjde záporně — např. `state_class: total` bez `last_reset`).
 * Bez callWS / při chybě vrátí prázdnou mapu — UI ukáže „—“.
 */
export async function fetchDailyEnergyKwh(
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
  daysBack: number,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!hass?.callWS || !entityId?.trim() || daysBack <= 0) return out;

  const today = startOfLocalDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - daysBack);

  try {
    const series = await fetchDayStats(hass, entityId, start, today, ['change', 'state']);
    for (const pt of series) {
      const key = pointDayKey(pt.start);
      if (!key) continue;
      // Dnešek do historie nepatří (forward řádek „Dnes“).
      if (key >= toLocalDayKey(today)) continue;

      let value: number | null = null;
      if (isNum(pt.change) && pt.change >= 0) {
        value = pt.change;
      } else if (isNum(pt.state)) {
        value = pt.state;
      }
      if (value == null || value < 0) continue;
      out.set(key, value);
    }
  } catch {
    // recorder / LTS nedostupné — past řádky zůstanou prázdné
  }

  return out;
}

/**
 * Denní spotřeba z entity „včerejšek“ (Utility Meter `last_period`): hodnota
 * během dne X = spotřeba dne X−1. Čte se proto `state` na konci dne X
 * a přiřadí se ke dni X−1; včerejšek bere aktuální stav entity.
 * `change` tu nedává smysl (rozdíl dvou různých dní).
 */
export async function fetchYesterdaySensorKwh(
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
  daysBack: number,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!hass || !entityId?.trim() || daysBack <= 0) return out;

  const current = parseFloat(hass.states[entityId]?.state ?? '');
  if (Number.isFinite(current) && current >= 0) out.set(localDayKeyOffset(-1), current);
  if (!hass.callWS || daysBack < 2) return out;

  const today = startOfLocalDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (daysBack - 1));

  try {
    const series = await fetchDayStats(hass, entityId, start, today, ['state']);
    for (const pt of series) {
      const t = typeof pt.start === 'number' ? pt.start : Date.parse(pt.start);
      if (!Number.isFinite(t) || !isNum(pt.state) || pt.state < 0) continue;
      const day = startOfLocalDay(new Date(t));
      if (day >= today) continue;
      day.setDate(day.getDate() - 1);
      out.set(toLocalDayKey(day), pt.state);
    }
  } catch {
    // recorder / LTS nedostupné — zůstane jen včerejšek
  }

  return out;
}

async function fetchDayStats(
  hass: HomeAssistant,
  entityId: string,
  start: Date,
  end: Date,
  types: string[],
): Promise<StatisticPoint[]> {
  const result = await hass.callWS!<StatisticsResult>({
    type: 'recorder/statistics_during_period',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    statistic_ids: [entityId],
    period: 'day',
    units: { energy: 'kWh' },
    types,
  });
  const series = result?.[entityId];
  return Array.isArray(series) ? series : [];
}

/** Lokální YYYY-MM-DD pro den `offset` relativně k dnes (záporné = minulost). */
export function localDayKeyOffset(offset: number, now = new Date()): string {
  const d = startOfLocalDay(now);
  d.setDate(d.getDate() + offset);
  return toLocalDayKey(d);
}
