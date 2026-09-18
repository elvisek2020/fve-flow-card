/**
 * Čistý model prognózy výdrže baterie (denní bilance PV − spotřeba).
 * Bez závislosti na Lit / DOM — vhodný i pro pozdější reuse v automatizaci.
 */

export interface BatteryForecastDayInput {
  /** Popisek dne (Dnes / Zítra / datum). */
  label: string;
  /** Predikce výroby (kWh); null = chybí senzor. */
  pvKwh: number | null;
}

export interface BatteryForecastInput {
  socNow: number;
  capacityKwh: number;
  dailyLoadKwh: number;
  minSocPct: number;
  days: BatteryForecastDayInput[];
}

export interface BatteryForecastDayResult {
  label: string;
  pvKwh: number | null;
  loadKwh: number;
  socStart: number;
  socEnd: number;
  /** SoC na konci dne pod min_soc_pct. */
  risk: boolean;
}

export interface BatteryForecastResult {
  days: BatteryForecastDayResult[];
  /** Žádný den nekončí pod prahem. */
  ok: boolean;
  /** Index prvního rizikového dne, nebo null. */
  firstRiskDayIndex: number | null;
  minSocPct: number;
  /** Nejnižší SoC v horizontu. */
  lowestSoc: number;
}

function clampSoc(soc: number): number {
  if (!Number.isFinite(soc)) return 0;
  return Math.min(100, Math.max(0, soc));
}

/**
 * Simuluje denní SoC: delta = pv − load, SoC se clampuje na 0–100 %.
 * Chybějící PV se bere jako 0 kWh (konzervativní).
 */
export function computeBatteryForecast(input: BatteryForecastInput): BatteryForecastResult {
  const capacity = Math.max(0.001, input.capacityKwh);
  const load = Math.max(0, input.dailyLoadKwh);
  const minSoc = clampSoc(input.minSocPct);
  let soc = clampSoc(input.socNow);
  const days: BatteryForecastDayResult[] = [];
  let firstRiskDayIndex: number | null = null;
  let lowestSoc = soc;

  for (let i = 0; i < input.days.length; i++) {
    const day = input.days[i];
    const socStart = soc;
    const pv = day.pvKwh != null && Number.isFinite(day.pvKwh) ? Math.max(0, day.pvKwh) : 0;
    const delta = pv - load;
    const socEnd = clampSoc(socStart + (delta / capacity) * 100);
    const risk = socEnd < minSoc;
    if (risk && firstRiskDayIndex == null) firstRiskDayIndex = i;
    lowestSoc = Math.min(lowestSoc, socEnd);
    days.push({
      label: day.label,
      pvKwh: day.pvKwh,
      loadKwh: load,
      socStart,
      socEnd,
      risk,
    });
    soc = socEnd;
  }

  return {
    days,
    ok: firstRiskDayIndex == null,
    firstRiskDayIndex,
    minSocPct: minSoc,
    lowestSoc,
  };
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
