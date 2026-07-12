import { svg, nothing, type TemplateResult } from 'lit';
import type { HistoryPoint } from './sparkline';

export interface MiniChartColors {
  actual: string;
  forecast: string;
}

const BUCKET_MS = 30 * 60 * 1000;

/**
 * Zprůměruje syrové vzorky do pravidelných 30min košíků — vyhladí šum
 * senzoru (jednotlivé krátké špičky), aby výsledná křivka nebyla
 * "roztřesená" a nevznikaly na ní ostré zlomy.
 */
function bucketAverage(points: HistoryPoint[], t0: number, t1: number): HistoryPoint[] {
  if (!points.length) return [];
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const [t, v] of points) {
    if (t < t0 || t > t1) continue;
    const key = Math.floor((t - t0) / BUCKET_MS);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += v;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, bucket]): HistoryPoint => [t0 + key * BUCKET_MS + BUCKET_MS / 2, bucket.sum / bucket.count]);
}

/** Hladká Catmull-Rom křivka (převedená na kubické Beziery) — plynulý přechod bez zlomů. */
function smoothPath(coords: Array<[number, number]>): string {
  if (coords.length < 2) return '';
  if (coords.length === 2) {
    const [[x0, y0], [x1, y1]] = coords;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Lehký graf „dnes" (00:00–24:00) bez apexcharts — plná plocha pro
 * skutečnou výrobu FVE, přerušovaná čára pro Solcast predikci. Vstupní
 * vzorky se nejdřív zprůměrují do 30min košíků a proloží hladkou
 * Catmull-Rom křivkou, takže ani zašuměná data senzoru nevytváří ostré
 * zlomy/"kruhy" na lince. Čistě vizuální přehled, žádný tooltip.
 */
export function renderMiniChart(
  actual: HistoryPoint[],
  forecast: HistoryPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
  colors: MiniChartColors,
): TemplateResult | typeof nothing {
  if (actual.length < 2 && forecast.length < 2) return nothing;

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const t0 = dayStart.getTime();
  const t1 = t0 + 24 * 60 * 60 * 1000;
  const now = Date.now();

  const actualBinned = bucketAverage(actual, t0, t1);
  const forecastBinned = bucketAverage(forecast, t0, t1);
  const maxValue = Math.max(1, ...actualBinned.map(([, v]) => v), ...forecastBinned.map(([, v]) => v));

  const toXY = ([t, v]: HistoryPoint): [number, number] => {
    const px = x + Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) * w;
    const py = y + h - Math.max(0, Math.min(1, v / maxValue)) * h;
    return [px, py];
  };

  const actualCoords = actualBinned.map(toXY);
  const forecastCoords = forecastBinned.map(toXY);
  const actualLine = actualCoords.length > 1 ? smoothPath(actualCoords) : '';
  const forecastLine = forecastCoords.length > 1 ? smoothPath(forecastCoords) : '';
  const actualArea = actualLine
    ? `${actualLine} L ${actualCoords[actualCoords.length - 1][0].toFixed(1)} ${(y + h).toFixed(1)} L ${actualCoords[0][0].toFixed(1)} ${(y + h).toFixed(1)} Z`
    : '';

  const nowX = x + Math.max(0, Math.min(1, (now - t0) / (t1 - t0))) * w;
  const hourMarks = [0, 6, 12, 18, 24];

  return svg`
    <g>
      <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="rgba(148,170,190,0.18)" stroke-width="1"/>
      ${hourMarks.map((hour) => {
        const hx = x + (hour / 24) * w;
        return svg`
          <line x1="${hx}" y1="${y}" x2="${hx}" y2="${y + h}" stroke="rgba(148,170,190,0.07)" stroke-width="1"/>
          <text x="${hx}" y="${y + h + 13}" text-anchor="middle" class="chart-axis">${String(hour).padStart(2, '0')}</text>
        `;
      })}
      ${nowX >= x && nowX <= x + w
        ? svg`<line x1="${nowX.toFixed(1)}" y1="${y}" x2="${nowX.toFixed(1)}" y2="${y + h}"
            stroke="rgba(226,240,248,0.35)" stroke-width="1" stroke-dasharray="3 4"/>`
        : nothing}
      ${actualArea ? svg`<path d="${actualArea}" fill="${colors.actual}" opacity="0.16"/>` : nothing}
      ${forecastLine
        ? svg`<path d="${forecastLine}" fill="none" stroke="${colors.forecast}" stroke-width="2"
            stroke-dasharray="5 4" stroke-linecap="round" opacity="0.85"/>`
        : nothing}
      ${actualLine
        ? svg`<path d="${actualLine}" fill="none" stroke="${colors.actual}" stroke-width="2" stroke-linecap="round"/>`
        : nothing}
    </g>`;
}
