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

/** Ventilátor (mdi:fan, box 24) — `spin` roztočí lopatky přes CSS třídu .spin. */
export function iconFan(x: number, y: number, size: number, color: string, spin = false): TemplateResult {
  const s = size / 24;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" fill="${color}"
       style="filter: drop-shadow(0 0 4px ${color})">
      <path class="${spin ? 'spin' : ''}" d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z"/>
    </g>`;
}

/** Vypínač (mdi:power, box 24) pro ovládací tlačítko MPPT. */
export function iconPower(x: number, y: number, size: number, color: string): TemplateResult {
  const s = size / 24;
  return svg`
    <g transform="translate(${x},${y}) scale(${s})" fill="${color}"
       style="filter: drop-shadow(0 0 4px ${color})">
      <path d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"/>
    </g>`;
}
