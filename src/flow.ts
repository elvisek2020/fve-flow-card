import { svg, nothing, type TemplateResult } from 'lit';
import { flowDuration } from './utils';

export interface FlowOptions {
  /** Absolutní výkon (W) řídící rychlost a aktivitu linky. */
  power: number;
  /** Barva aktivní linky a teček. */
  color: string;
  /** Obrácený směr (tečky poběží od konce cesty k začátku). */
  reverse?: boolean;
  /** Pod tímto výkonem je linka „dormant" — šedá, bez teček. */
  deadband: number;
  /** Výkon pro plnou rychlost animace. */
  maxPower: number;
  minDuration: number;
  maxDuration: number;
  /** Počet teček na lince. */
  dots: number;
  /** Vypnout animaci (jen statická linka). */
  animate: boolean;
  /** Linku úplně skrýt (chybí entita). */
  hidden?: boolean;
}

const DORMANT_STROKE = 'rgba(148, 170, 190, 0.16)';

/**
 * Vykreslí propojovací cestu + multi-dot světelné pulzy.
 * Mechanika po vzoru Enhanced Power Flow Card (SMIL animateMotion + mpath,
 * směr přes keyPoints) a Venus OS Dashboardu (fázově posunuté tečky).
 */
export function renderFlow(id: string, d: string, opts: FlowOptions): TemplateResult | typeof nothing {
  if (opts.hidden) return nothing;

  const active = opts.animate && Math.abs(opts.power) >= opts.deadband;
  const pathId = `flow-${id}`;

  const pathTpl = svg`
    <path id="${pathId}" d="${d}" fill="none"
      stroke="${active ? opts.color : DORMANT_STROKE}"
      stroke-width="${active ? 3 : 2}"
      stroke-linecap="round"
      opacity="${active ? 0.85 : 1}"
      style="${active ? `filter: drop-shadow(0 0 4px ${opts.color})` : ''}"/>`;

  if (!active) return pathTpl;

  const dur = flowDuration(Math.abs(opts.power), opts.maxPower, opts.minDuration, opts.maxDuration);
  const keyPoints = opts.reverse ? '1;0' : '0;1';
  const n = Math.max(1, opts.dots);

  const dots: TemplateResult[] = [];
  for (let i = 0; i < n; i++) {
    // Fázový posun teček přes záporný begin → souvislý „proud" světel.
    const begin = -((i * dur) / n).toFixed(2);
    dots.push(svg`
      <circle cx="0" cy="0" r="5" fill="${opts.color}"
        style="filter: drop-shadow(0 0 6px ${opts.color})">
        <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite"
          keyPoints="${keyPoints}" keyTimes="0;1" calcMode="linear">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>`);
  }

  return svg`${pathTpl}${dots}`;
}
