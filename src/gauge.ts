import { svg, type TemplateResult } from 'lit';

/** Prahy semaforu gauge — pod `yellowFrom` červená, od `greenFrom` zelená. */
export interface ArcGaugeThresholds {
  yellowFrom: number;
  greenFrom: number;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = toRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Kruhový oblouk mezi dvěma úhly (ve stupních, po směru hodinových ručiček). */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * Půlkruhový (180°) gauge se semaforovými zónami — track jde od 180°
 * (vlevo) přes 270° (nahoru) do 360° (vpravo), vzor HA gauge karty.
 * Vrací jen geometrii (zóny + ručička + náboj); popisky/text si vykresluje
 * volající, stejně jako u ostatních ikon v `icons.ts`.
 */
export function renderArcGauge(
  cx: number,
  cy: number,
  r: number,
  value: number,
  min: number,
  max: number,
  thresholds: ArcGaugeThresholds,
  color: string,
  strokeWidth = 14,
): TemplateResult {
  const span = Math.max(1e-6, max - min);
  const angleFor = (v: number) => 180 + ((Math.max(min, Math.min(max, v)) - min) / span) * 180;
  const yellowAngle = angleFor(thresholds.yellowFrom);
  const greenAngle = Math.max(angleFor(thresholds.greenFrom), yellowAngle);
  const needleAngle = angleFor(value);
  const needleInner = polar(cx, cy, r * 0.4, needleAngle);
  const needleOuter = polar(cx, cy, r + 3, needleAngle);

  return svg`
    <g>
      <path d="${arcPath(cx, cy, r, 180, yellowAngle)}" fill="none" stroke="#ff5252"
        stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.5"/>
      <path d="${arcPath(cx, cy, r, yellowAngle, greenAngle)}" fill="none" stroke="#ffd740"
        stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.5"/>
      <path d="${arcPath(cx, cy, r, greenAngle, 360)}" fill="none" stroke="#00e676"
        stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.5"/>
      <line x1="${needleInner.x.toFixed(2)}" y1="${needleInner.y.toFixed(2)}"
        x2="${needleOuter.x.toFixed(2)}" y2="${needleOuter.y.toFixed(2)}"
        stroke="${color}" stroke-width="4" stroke-linecap="round"
        style="filter: drop-shadow(0 0 6px ${color})"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="${color}" style="filter: drop-shadow(0 0 6px ${color})"/>
    </g>`;
}
