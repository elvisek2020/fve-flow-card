import { svg, nothing, type TemplateResult } from 'lit';
import type { HomeAssistant } from './types';

export type HistoryPoint = [time: number, value: number];

/**
 * Natáhne historii entity za posledních `minutes` minut přes HA REST API.
 * Bez `hass.callApi` (test prostředí, starší HA) nebo při chybě vrátí
 * prázdné pole — sparkline se pak jednoduše nevykreslí.
 */
export async function fetchHistory(
  hass: HomeAssistant,
  entityId: string,
  minutes = 60,
): Promise<HistoryPoint[]> {
  if (!hass.callApi) return [];
  const start = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const path = `history/period/${start}?filter_entity_id=${encodeURIComponent(entityId)}&minimal_response&no_attributes`;
  try {
    const result = await hass.callApi('GET', path);
    const series = Array.isArray(result) ? (result[0] as unknown[] | undefined) : undefined;
    if (!Array.isArray(series)) return [];
    const points: HistoryPoint[] = [];
    for (const item of series) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as { state?: string; last_changed?: string; last_updated?: string };
      const value = parseFloat(rec.state ?? '');
      const time = new Date(rec.last_changed ?? rec.last_updated ?? '').getTime();
      if (Number.isFinite(value) && Number.isFinite(time)) points.push([time, value]);
    }
    return points;
  } catch {
    return [];
  }
}

/**
 * Mini trendová křivka v zadaném boxu — normalizuje body do rozsahu
 * (x..x+w, y..y+h) a vykreslí tlumenou linku s jemnou výplní pod ní.
 * Neblokuje klik (pointer-events: none), sedí uvnitř klikací plochy uzlu.
 */
export function renderSparkline(
  points: HistoryPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): TemplateResult | typeof nothing {
  if (points.length < 2) return nothing;

  const values = points.map(([, v]) => v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const t0 = points[0][0];
  const t1 = points[points.length - 1][0];
  const tRange = Math.max(1, t1 - t0);

  const coords = points.map(([t, v]): [number, number] => {
    const px = x + ((t - t0) / tRange) * w;
    const py = range === 0 ? y + h / 2 : y + h - ((v - min) / range) * h;
    return [px, py];
  });

  const linePath = coords
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(' ');
  const baseline = (y + h).toFixed(1);
  const areaPath = `${linePath} L ${coords[coords.length - 1][0].toFixed(1)} ${baseline} L ${coords[0][0].toFixed(1)} ${baseline} Z`;

  return svg`
    <g style="pointer-events: none">
      <path d="${areaPath}" fill="${color}" opacity="0.12"/>
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.5"
        stroke-linejoin="round" stroke-linecap="round" opacity="0.75"/>
    </g>`;
}
