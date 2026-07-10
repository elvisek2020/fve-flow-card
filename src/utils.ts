import type { HomeAssistant, SeverityFields } from './types';

export const SEVERITY_COLORS = {
  red: '#ff5252',
  yellow: '#ffd740',
  green: '#00e676',
} as const;

/**
 * Semaforová barva podle prahů: pod `yellow_from` červená, od `yellow_from`
 * žlutá, od `green_from` zelená. `severity_invert` význam obrátí.
 * Vrací undefined, pokud prahy nejsou nakonfigurované.
 */
export function severityColor(value: number, cfg?: SeverityFields): string | undefined {
  if (!cfg || (cfg.yellow_from == null && cfg.green_from == null)) return undefined;
  const yellowFrom = cfg.yellow_from ?? cfg.green_from!;
  const greenFrom = Math.max(cfg.green_from ?? cfg.yellow_from!, yellowFrom);
  let level: keyof typeof SEVERITY_COLORS =
    value < yellowFrom ? 'red' : value < greenFrom ? 'yellow' : 'green';
  if (cfg.severity_invert) {
    level = level === 'red' ? 'green' : level === 'green' ? 'red' : 'yellow';
  }
  return SEVERITY_COLORS[level];
}

/** Bezpečně převede stav entity na číslo; NaN → fallback. */
export function toNum(hass: HomeAssistant | undefined, entityId: string | undefined, fallback = 0): number {
  if (!hass || !entityId) return fallback;
  const st = hass.states[entityId];
  if (!st) return fallback;
  const v = parseFloat(st.state);
  return Number.isFinite(v) ? v : fallback;
}

/** True, pokud entita existuje a má číselný stav. */
export function hasNum(hass: HomeAssistant | undefined, entityId: string | undefined): boolean {
  if (!hass || !entityId) return false;
  const st = hass.states[entityId];
  return !!st && Number.isFinite(parseFloat(st.state));
}

const nf1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

/** Formát výkonu: 259 W / 1,3 kW. */
export function formatPower(w: number): string {
  const abs = Math.abs(w);
  if (abs >= 10000) return `${nf1.format(w / 1000)} kW`;
  if (abs >= 1000) return `${nf2.format(w / 1000)} kW`;
  return `${nf0.format(w)} W`;
}

/** Formát energie v kWh: 7,1 kWh / 11,48 MWh. */
export function formatEnergy(kwh: number): string {
  if (Math.abs(kwh) >= 1000) return `${nf2.format(kwh / 1000)} MWh`;
  return `${nf1.format(kwh)} kWh`;
}

/** Surový stav entity + jednotka (pro textové/ostatní senzory). */
export function formatState(hass: HomeAssistant | undefined, entityId: string | undefined): string {
  if (!hass || !entityId) return '—';
  const st = hass.states[entityId];
  if (!st || st.state === 'unknown' || st.state === 'unavailable') return '—';
  const unit = (st.attributes.unit_of_measurement as string | undefined) ?? '';
  const num = parseFloat(st.state);
  if (Number.isFinite(num) && String(num) === st.state.trim()) {
    return unit ? `${nf1.format(num)} ${unit}` : nf1.format(num);
  }
  return unit ? `${st.state} ${unit}` : st.state;
}

/** Vystřelí HA event (bubbles + composed). */
export function fireEvent(node: HTMLElement, type: string, detail?: unknown): void {
  node.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable: false }),
  );
}

/** Otevře nativní HA more-info dialog (historie + logbook entity). */
export function moreInfo(node: HTMLElement, entityId?: string): void {
  if (!entityId) return;
  fireEvent(node, 'hass-more-info', { entityId });
}

/**
 * Délka oběhu tečky po lince podle výkonu (vzor Enhanced Power Flow Card):
 * duration = max(min, max − pct·(max−min)), pct = |P|/maxPower.
 * Kvantováno na 0,25 s, aby se SMIL animace nerestartovala při každé drobné změně.
 */
export function flowDuration(
  powerAbs: number,
  maxPower: number,
  minDur: number,
  maxDur: number,
): number {
  const pct = Math.min(1, Math.max(0, powerAbs / Math.max(1, maxPower)));
  const dur = Math.max(minDur, maxDur - pct * (maxDur - minDur));
  return Math.round(dur * 4) / 4;
}
