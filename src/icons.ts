import { svg, type TemplateResult } from 'lit';

/**
 * Neonové line-art ikony komponent. Každá ikona je kreslená do boxu 64×64
 * (stroke-based, barva přes parametr) a umísťuje se pomocí transform.
 */

export function iconSolarPanel(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <path d="M14 8 L58 8 L50 44 L6 44 Z"/>
      <line x1="28" y1="8" x2="21" y2="44"/>
      <line x1="43" y1="8" x2="36" y2="44"/>
      <line x1="11" y1="26" x2="54" y2="26"/>
      <line x1="28" y1="44" x2="28" y2="56"/>
      <line x1="18" y1="56" x2="38" y2="56"/>
    </g>`;
}

export function iconSun(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="3" stroke-linecap="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <circle cx="32" cy="32" r="12"/>
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>`;
}

export function iconMppt(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <rect x="8" y="12" width="48" height="40" rx="6"/>
      <path d="M16 40 L26 40 L32 24 L38 40 L48 40"/>
      <line x1="24" y1="52" x2="24" y2="58"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
    </g>`;
}

/** Baterie s dynamickým fill podle SoC (0–100). */
export function iconBattery(
  x: number,
  y: number,
  width: number,
  height: number,
  soc: number,
  color: string,
): TemplateResult {
  const pad = 6;
  const capW = width * 0.4;
  const capH = 10;
  const innerH = height - 2 * pad;
  const fillH = Math.max(0, Math.min(1, soc / 100)) * innerH;
  return svg`
    <g style="filter: drop-shadow(0 0 6px ${color})">
      <rect x="${x + (width - capW) / 2}" y="${y - capH}" width="${capW}" height="${capH + 4}" rx="3"
        fill="none" stroke="${color}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10"
        fill="rgba(0,0,0,0.35)" stroke="${color}" stroke-width="3"/>
      <rect x="${x + pad}" y="${y + pad + (innerH - fillH)}" width="${width - 2 * pad}" height="${fillH}" rx="5"
        fill="${color}" opacity="0.85"/>
    </g>`;
}

export function iconInverter(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <rect x="6" y="6" width="52" height="52" rx="10"/>
      <path d="M20 26 A 14 14 0 0 1 44 26" />
      <path d="M44 26 l 1 -8 m -1 8 l -8 -1"/>
      <path d="M44 38 A 14 14 0 0 1 20 38" />
      <path d="M20 38 l -1 8 m 1 -8 l 8 1"/>
    </g>`;
}

/** Stožár VN (ČEZ). */
export function iconPylon(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <path d="M22 58 L28 12 L36 12 L42 58"/>
      <line x1="14" y1="20" x2="50" y2="20"/>
      <line x1="10" y1="32" x2="54" y2="32"/>
      <line x1="27" y1="20" x2="37" y2="32"/>
      <line x1="37" y1="20" x2="27" y2="32"/>
      <line x1="14" y1="20" x2="18" y2="28"/>
      <line x1="50" y1="20" x2="46" y2="28"/>
      <line x1="25" y1="44" x2="39" y2="44"/>
      <line x1="25" y1="44" x2="34" y2="58"/>
      <line x1="39" y1="44" x2="30" y2="58"/>
    </g>`;
}

export function iconHome(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" stroke="${color}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${color})">
      <path d="M8 32 L32 10 L56 32"/>
      <path d="M14 28 L14 56 L50 56 L50 28"/>
      <path d="M26 56 L26 40 L38 40 L38 56"/>
    </g>`;
}

/** Blesk pro drobné akcenty. */
export function iconBolt(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 64;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" fill="${color}"
       style="filter: drop-shadow(0 0 4px ${color})">
      <path d="M36 4 L14 36 L28 36 L24 60 L50 26 L34 26 Z"/>
    </g>`;
}
