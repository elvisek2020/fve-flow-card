/**
 * Napojení karty na integraci Hybrid Energy (`island_energy`). Prognózu výdrže
 * i plán nabíjení počítá integrace, karta je jen zobrazuje a posílá povely.
 */
import type { HomeAssistant } from './types';

export const PLANNER_DOMAIN = 'island_energy';

/** Entity integrace podle translation_key. */
export interface PlannerEntities {
  forecast: string;
  plan?: string;
  status?: string;
  charging?: string;
  autoCharging?: string;
  chargeNow?: string;
  stopCharging?: string;
  skipTonight?: string;
}

/** Jeden den tabulky prognózy (atribut `days` senzoru prognózy). */
export interface PlannerDay {
  date: string;
  kind: 'past' | 'today' | 'tomorrow' | 'future';
  pv_kwh: number | null;
  load_kwh: number | null;
  trough: number | null;
  trough_at: string | null;
  peak: number | null;
  peak_at: string | null;
  full_at: string | null;
  charges: boolean;
  risk: boolean;
  measured: boolean;
  grid_kwh: number;
  grid_windows: Array<{ start: string; end: string }>;
  /** SoC a čas začátku / konce nočního nabíjení ze sítě (integrace od 2.0.15). */
  grid_start_soc?: number | null;
  grid_start_at?: string | null;
  grid_end_soc?: number | null;
  grid_end_at?: string | null;
}

export type LoadSource = 'dc' | 'ac' | 'flat';

const KEYS: Record<string, keyof PlannerEntities> = {
  forecast: 'forecast',
  grid_charge_plan: 'plan',
  status: 'status',
  charging: 'charging',
  auto_charging: 'autoCharging',
  charge_now: 'chargeNow',
  stop_charging: 'stopCharging',
  skip_tonight: 'skipTonight',
};

/** Výchozí entity_id (anglické názvy entit), když registr entit není k dispozici. */
const FALLBACK: PlannerEntities = {
  forecast: 'sensor.hybrid_energy_battery_forecast',
  plan: 'sensor.hybrid_energy_grid_charge_plan',
  status: 'sensor.hybrid_energy_planner_status',
  charging: 'binary_sensor.hybrid_energy_grid_charging',
  autoCharging: 'switch.hybrid_energy_allow_automatic_charging',
  chargeNow: 'button.hybrid_energy_charge_now',
  stopCharging: 'button.hybrid_energy_stop_charging',
  skipTonight: 'button.hybrid_energy_skip_tonight',
};

/** Najde entity integrace; null = integrace není nastavená. */
export function findPlanner(hass: HomeAssistant | undefined): PlannerEntities | null {
  if (!hass) return null;
  const found: Partial<PlannerEntities> = {};
  for (const entry of Object.values(hass.entities ?? {})) {
    if (entry.platform !== PLANNER_DOMAIN || !entry.translation_key) continue;
    const key = KEYS[entry.translation_key];
    if (key) found[key] = entry.entity_id;
  }
  if (found.forecast && hass.states[found.forecast]) return found as PlannerEntities;
  if (hass.states[FALLBACK.forecast]) {
    return Object.fromEntries(
      Object.entries(FALLBACK).filter(([, id]) => !!hass.states[id as string]),
    ) as unknown as PlannerEntities;
  }
  return null;
}

/** Tabulka prognózy ze senzoru; prázdné pole, dokud integrace nic nespočítala. */
export function plannerDays(hass: HomeAssistant, p: PlannerEntities): PlannerDay[] {
  const days = hass.states[p.forecast]?.attributes.days;
  return Array.isArray(days) ? (days as PlannerDay[]) : [];
}

/** Minimální SoC nastavené v integraci (pro rysku v pruhu energie baterie). */
export function plannerMinSoc(hass: HomeAssistant | undefined, p: PlannerEntities | null): number | null {
  if (!hass || !p) return null;
  const v = Number(hass.states[p.forecast]?.attributes.min_soc);
  return Number.isFinite(v) && v > 0 ? v : null;
}
