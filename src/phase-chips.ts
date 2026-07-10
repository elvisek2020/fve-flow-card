import { svg, type TemplateResult } from 'lit';
import type { HomeAssistant, PhaseSpec } from './types';
import type { Rect } from './layout';
import { iconBolt } from './icons';
import { formatPower, toNum } from './utils';

/**
 * Fáze patra vykreslené čistě v SVG (bez foreignObject + ha-icon).
 * foreignObject v škálovaném SVG způsobuje „utečení" ikon do středu scény.
 */
export function renderPhaseChips(
  r: Rect,
  phases: PhaseSpec[],
  hass: HomeAssistant | undefined,
  onOpen: (entityId: string) => void,
): TemplateResult {
  const pad = 14;
  const chipH = 72;
  const chipY = r.y + r.h - chipH - 10;
  const gap = 8;
  const totalW = r.w - pad * 2;
  const chipW = (totalW - gap * Math.max(0, phases.length - 1)) / phases.length;

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
          fill="rgba(255,255,255,0.045)" stroke="rgba(120,180,210,0.16)" stroke-width="1"/>
        ${iconBolt(iconX, iconY, iconSize, 'rgba(226,240,248,0.75)')}
        <text x="${cx}" y="${chipY + 38}" text-anchor="middle" class="chip-value">${power}</text>
        <text x="${cx}" y="${chipY + 56}" text-anchor="middle" class="chip-name">${ph.name}</text>
      </g>`;
  })}`;
}
