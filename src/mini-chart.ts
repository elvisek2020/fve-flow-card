import { svg, nothing, type TemplateResult } from 'lit';
import type { HistoryPoint } from './sparkline';

export interface MiniChartColors {
  actual: string;
  forecast: string;
}

/**
 * Lehký graf „dnes" (00:00–24:00) bez apexcharts — plná plocha pro
 * skutečnou výrobu FVE, přerušovaná čára pro Solcast predikci. Čistě
 * vizuální přehled, žádný tooltip ani interaktivita (na rozdíl od 48h
 * historie ve velké kartě, která pro to používá apexcharts-card).
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
  const tRange = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const maxValue = Math.max(1, ...actual.map(([, v]) => v), ...forecast.map(([, v]) => v));

  const toXY = ([t, v]: HistoryPoint): [number, number] => {
    const px = x + Math.max(0, Math.min(1, (t - t0) / tRange)) * w;
    const py = y + h - Math.max(0, Math.min(1, v / maxValue)) * h;
    return [px, py];
  };

  const pathFor = (points: HistoryPoint[]): string =>
    points
      .map(toXY)
      .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
      .join(' ');

  const actualLine = actual.length > 1 ? pathFor(actual) : '';
  const forecastLine = forecast.length > 1 ? pathFor(forecast) : '';
  const actualArea = actualLine
    ? `${actualLine} L ${toXY(actual[actual.length - 1])[0].toFixed(1)} ${(y + h).toFixed(1)} L ${toXY(actual[0])[0].toFixed(1)} ${(y + h).toFixed(1)} Z`
    : '';

  const nowX = x + Math.max(0, Math.min(1, (now - t0) / tRange)) * w;
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
            stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>`
        : nothing}
      ${actualLine
        ? svg`<path d="${actualLine}" fill="none" stroke="${colors.actual}" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round"/>`
        : nothing}
    </g>`;
}
