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
 * Horizontální poloha bodu na obloučku v rozsahu 0 (vlevo) – 1 (vpravo).
 * Track jde přesně od 180° do 360°, kde je x monotónní — díky tomu jde
 * gradient zarovnaný na osu x 1:1 přeložit na úhlovou pozici na oblouku.
 */
const fracForAngle = (deg: number): number => (Math.cos(toRad(deg)) + 1) / 2;

const GRADIENT_ID = 'fve-gauge-gradient';

/**
 * Ručička přesně podle nativní HA `ha-gauge` komponenty (viz
 * home-assistant/frontend, src/components/ha-gauge.ts) — úzká „jehla"
 * s kulatým hrotem, který přesahuje mimo poloměr oblouku, a zaobleným
 * zadním koncem uvnitř. Souřadnice jsou v původní 40-jednotkové bázi
 * HA komponenty (střed gauge = [0,0], poloměr oblouku = 40) a v klidu
 * míří vlevo (na hodnotu `min`) — díky `scale`/`rotate` transformu ji
 * lze 1:1 přenést na libovolný poloměr a úhel.
 */
const NEEDLE_PATH = 'M -34,-3 L -48,-1 A 1,1,0,0,0,-48,1 L -34,3 A 2,2,0,0,0,-34,-3 Z';
const NEEDLE_BASIS_RADIUS = 40;

/**
 * Půlkruhový (180°) gauge s plynulým semaforovým přechodem
 * červená → žlutá → zelená. Track je jediný souvislý `<path>` barvený
 * lineárním gradientem zarovnaným na osu oblouku — žádné švy ani zaoblené
 * „kolečka" na hranicích zón, jak by vznikly při skládání z několika
 * samostatných segmentů se `stroke-linecap="round"`. Přechody jsou jemné,
 * ale úzké (`BLEND`), takže barva stále zůstává v okolí reálného prahu.
 * Aktuální hodnota je vyznačená ručičkou ve stejném tvaru, jaký používá
 * nativní HA gauge karta (`ha-gauge` s `needle: true`) — tenká jehla
 * s hrotem přesahujícím mimo oblouček.
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
  const markerAngle = angleFor(value);

  // NEEDLE_PATH v klidu míří vlevo (180° v naší konvenci) — stačí tedy
  // pootočit o rozdíl od 180° a přeškálovat z HA-basis poloměru (40) na
  // reálný poloměr oblouku `r`. Ručička se otáčí kolem středu gauge (cx,cy),
  // ne kolem bodu na obloučku — přesně jako u nativní HA komponenty.
  const needleRotation = markerAngle - 180;
  const needleScale = r / NEEDLE_BASIS_RADIUS;

  const BLEND = 0.05;
  const yFrac = fracForAngle(yellowAngle);
  const gFrac = fracForAngle(greenAngle);
  let last = 0;
  const stops = [
    { offset: 0, color: '#ff5252' },
    { offset: yFrac - BLEND, color: '#ff5252' },
    { offset: yFrac + BLEND, color: '#ffd740' },
    { offset: gFrac - BLEND, color: '#ffd740' },
    { offset: gFrac + BLEND, color: '#00e676' },
    { offset: 1, color: '#00e676' },
  ].map((s) => {
    const offset = Math.max(last, Math.min(1, s.offset));
    last = offset;
    return { offset, color: s.color };
  });

  return svg`
    <defs>
      <linearGradient id="${GRADIENT_ID}" gradientUnits="userSpaceOnUse"
        x1="${(cx - r).toFixed(2)}" y1="${cy}" x2="${(cx + r).toFixed(2)}" y2="${cy}">
        ${stops.map((s) => svg`<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}"/>`)}
      </linearGradient>
    </defs>
    <path d="${arcPath(cx, cy, r, 180, 360)}" fill="none" stroke="url(#${GRADIENT_ID})"
      stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.55"/>
    <g transform="translate(${cx},${cy}) rotate(${needleRotation.toFixed(2)}) scale(${needleScale.toFixed(3)})"
      fill="rgba(226,240,248,0.95)" stroke="rgba(8,14,20,0.9)" stroke-width="1" stroke-linecap="round"
      style="filter: drop-shadow(0 0 5px ${color})">
      <path d="${NEEDLE_PATH}"/>
    </g>`;
}
