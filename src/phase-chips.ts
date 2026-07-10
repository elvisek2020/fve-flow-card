import { svg, type TemplateResult } from 'lit';
import type { HomeAssistant, PhaseSpec } from './types';
import type { Rect } from './layout';
import { iconBolt } from './icons';
import { formatPower, toNum } from './utils';

export interface PhaseChipsOptions {
  /** Index řádku odspodu (0 = u dolního okraje uzlu), pro stohování více řad chipů. */
  rowFromBottom?: number;
  /** Vlastní ikona místo výchozího blesku (např. sluníčko pro FVE výrobu). */
  icon?: (x: number, y: number, size: number, color: string) => TemplateResult;
  /** Barva ikony a jejího glow. */
  iconColor?: string;
  /** Barva rámečku chipu (default neutrální modrošedá). */
  borderColor?: string;
}

/**
 * Fáze patra vykreslené čistě v SVG (bez foreignObject + ha-icon).
 * foreignObject v škálovaném SVG způsobuje „utečení" ikon do středu scény.
 */
export function renderPhaseChips(
  r: Rect,
  phases: PhaseSpec[],
  hass: HomeAssistant | undefined,
  onOpen: (entityId: string) => void,
  opts?: PhaseChipsOptions,
): TemplateResult {
  const pad = 14;
  const chipH = 72;
  const rowGap = 8;
  const row = opts?.rowFromBottom ?? 0;
  const chipY = r.y + r.h - chipH - 10 - row * (chipH + rowGap);
  const gap = 8;
  const totalW = r.w - pad * 2;
  const chipW = (totalW - gap * Math.max(0, phases.length - 1)) / phases.length;
  const drawIcon = opts?.icon ?? iconBolt;
  const iconColor = opts?.iconColor ?? 'rgba(226,240,248,0.75)';
  const borderColor = opts?.borderColor ?? 'rgba(120,180,210,0.16)';

  return svg`${phases.map((ph, i) => {
    const x = r.x + pad + i * (chipW + gap);
    const cx = x + chipW / 2;
    const power = formatPower(toNum(hass, ph.entity));
    const iconSize = 14;
    const iconX = cx - iconSize / 2;
    const iconY = chipY + 8;

    return svg`
      <g class="phase-chip" @click=${(e: Event) => {
        e.stopPropagation();
        onOpen(ph.entity);
      }}>
        <title>${ph.label} · ${ph.name}</title>
        <rect x="${x}" y="${chipY}" width="${chipW}" height="${chipH}" rx="10"
          fill="rgba(255,255,255,0.045)" stroke="${borderColor}" stroke-width="1"/>
        ${drawIcon(iconX, iconY, iconSize, iconColor)}
        <text x="${cx}" y="${chipY + 38}" text-anchor="middle" class="chip-value">${power}</text>
        <text x="${cx}" y="${chipY + 56}" text-anchor="middle" class="chip-name">${ph.name}</text>
      </g>`;
  })}`;
}
