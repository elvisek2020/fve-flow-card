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

/**
 * Denní energie (kWh) za posledních `daysBack` celých dní (bez dneška).
 * Preferuje `change` ze statistics; fallback na `state` (typické u denních meterů).
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
    const result = await hass.callWS<StatisticsResult>({
      type: 'recorder/statistics_during_period',
      start_time: start.toISOString(),
      end_time: today.toISOString(),
      statistic_ids: [entityId],
      period: 'day',
      units: { energy: 'kWh' },
      types: ['change', 'state'],
    });

    const series = result?.[entityId];
    if (!Array.isArray(series)) return out;

    for (const pt of series) {
      const key = pointDayKey(pt.start);
      if (!key) continue;
      // Dnešek do historie nepatří (forward řádek „Dnes“).
      if (key >= toLocalDayKey(today)) continue;

      let value: number | null = null;
      if (pt.change != null && Number.isFinite(pt.change)) {
        value = pt.change;
      } else if (pt.state != null && Number.isFinite(pt.state)) {
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

/** Lokální YYYY-MM-DD pro den `offset` relativně k dnes (záporné = minulost). */
export function localDayKeyOffset(offset: number, now = new Date()): string {
  const d = startOfLocalDay(now);
  d.setDate(d.getDate() + offset);
  return toLocalDayKey(d);
}
