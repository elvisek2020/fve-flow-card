import { LitElement, html, css, svg, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorConfig, FveFlowCardConfig, HomeAssistant, PhaseSpec } from './types';
import { computeLayout, type Layout, type Rect } from './layout';
import { renderFlow, type FlowOptions } from './flow';
import {
  iconBattery,
  iconHome,
  iconInverter,
  iconMppt,
  iconPylon,
  iconSolarPanel,
  iconSun,
} from './icons';
import {
  formatEnergy,
  formatPower,
  formatState,
  hasNum,
  moreInfo,
  severityColor,
  toNum,
} from './utils';
import './editor';

const CARD_VERSION = '__CARD_VERSION__';

const C = {
  solar: '#00e676',
  island: '#00e676',
  grid: '#4fc3f7',
  charge: '#e040fb',
  discharge: '#ffb74d',
  ok: '#69f0ae',
  warn: '#ffb74d',
  crit: '#ff5252',
};

console.info(
  `%c FVE-FLOW-CARD %c v${CARD_VERSION} `,
  'color: #0a0f16; background: #00e676; font-weight: 700;',
  'color: #00e676; background: #0a0f16; font-weight: 700;',
);

interface FlowBase {
  deadband: number;
  maxPower: number;
  minDuration: number;
  maxDuration: number;
  dots: number;
  animate: boolean;
}

@customElement('fve-flow-card')
export class FveFlowCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: FveFlowCardConfig;

  public setConfig(config: FveFlowCardConfig): void {
    if (!config) throw new Error('Chybí konfigurace');
    this._config = config;
  }

  public getCardSize(): number {
    return 12;
  }

  public getGridOptions(): Record<string, unknown> {
    return { columns: 'full', rows: 8, min_rows: 4 };
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('fve-flow-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      title: 'Tok energie',
      pv: {
        power: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky',
        energy_today: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynos_dnes',
        energy_total: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos',
        max_power_today: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_maximalni_vykon_dnes',
        voltage: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_napeti_fv_sbernice',
        current: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_proud_dc_bateriove_sbernice',
        mppt_state: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_provozni_rezim_mppt',
      },
      battery: {
        soc: 'sensor.pylontech_battery_id_512_nabijeni',
        power: 'sensor.pylontech_battery_id_512_vykon',
        voltage: 'sensor.pylontech_battery_id_512_napeti_dc_sbernice',
        current: 'sensor.pylontech_battery_id_512_proud_dc_sbernice',
        temperature: 'sensor.pylontech_battery_id_512_teplota',
        soh: 'sensor.pylontech_battery_id_512_zdravi',
        runtime: 'sensor.baterie_odhadovana_vydrz_2',
        time_to_full: 'sensor.baterie_doba_do_plneho_nabiti',
        capacity: 'sensor.pylontech_battery_id_512_instalovana_kapacita',
      },
      inverter: {
        power: 'sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1',
        state: 'sensor.multiplus_ii_48_5000_70_50_id_275_stav',
        load_power: 'sensor.gx_device_kriticke_zateze_na_l1',
        total_yield: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos',
        days_in_service: 'sensor.fve_pocet_dni_v_provozu',
        name: 'MultiPlus-II',
      },
      grid: {
        power: 'sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_vykon',
        phase_a: 'sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_a_vykon',
        phase_b: 'sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_b_vykon',
        phase_c: 'sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_c_vykon',
        energy_total: 'sensor.1np_vstupni_chodba_dub_1np_grid_ac_in_energie',
        name: 'Síť ČEZ',
      },
      solcast: {
        power_now: 'sensor.solcast_pv_forecast_power_now',
        remaining_today: 'sensor.solcast_pv_forecast_forecast_remaining_today',
        total_today: 'sensor.solcast_pv_forecast_forecast_today',
      },
      floors: [
        {
          name: '0NP',
          grid_energy: 'sensor.0np_pradelna_dub_0np_grid_ac_out_energie',
          phase_a_entity: 'sensor.0np_pradelna_dub_0np_grid_ac_out_phase_a_vykon',
          phase_b_entity: 'sensor.0np_pradelna_dub_0np_grid_ac_out_phase_b_vykon',
          phase_c_entity: 'sensor.0np_pradelna_dub_0np_grid_ac_out_phase_c_vykon',
        },
        {
          name: '1NP',
          grid_energy: 'sensor.dub_1np_grid_ac_out_energie',
          phase_a_entity: 'sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_a_vykon',
          phase_b_entity: 'sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_b_vykon',
          phase_c_entity: 'sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_c_vykon',
        },
      ],
    };
  }

  private _flowBase(): FlowBase {
    const o = this._config?.options ?? {};
    return {
      deadband: o.deadband_w ?? 25,
      maxPower: o.max_flow_w ?? 5000,
      minDuration: o.min_duration ?? 1.4,
      maxDuration: o.max_duration ?? 6,
      dots: o.dots ?? 3,
      animate: o.animation !== false,
    };
  }

  private _open(entityId?: string): void {
    moreInfo(this, entityId);
  }

  /** Fáze patra rozbalené z ploché konfigurace. */
  private _phases(f: FloorConfig): PhaseSpec[] {
    const out: PhaseSpec[] = [];
    const defs: Array<[string | undefined, string | undefined, string | undefined, string]> = [
      [f.phase_a_entity, f.phase_a_name, f.phase_a_icon, 'L1'],
      [f.phase_b_entity, f.phase_b_name, f.phase_b_icon, 'L2'],
      [f.phase_c_entity, f.phase_c_name, f.phase_c_icon, 'L3'],
    ];
    for (const [entity, name, icon, label] of defs) {
      if (entity) out.push({ entity, name: name || label, icon: icon || 'mdi:flash', label });
    }
    return out;
  }

  private _floorGridPower(f: FloorConfig): number {
    if (f.grid_power && hasNum(this.hass, f.grid_power)) return toNum(this.hass, f.grid_power);
    return this._phases(f).reduce((sum, p) => sum + toNum(this.hass, p.entity), 0);
  }

  protected render(): TemplateResult {
    const cfg = this._config;
    if (!cfg) return html``;
    if (!this.hass) return html`<ha-card></ha-card>`;

    const floors = cfg.floors ?? [];
    const layout = computeLayout(Math.max(1, floors.length));
    const base = this._flowBase();

    const pvP = toNum(this.hass, cfg.pv?.power);
    const rawBatP = toNum(this.hass, cfg.battery?.power);
    const batP = cfg.battery?.invert ? -rawBatP : rawBatP; // kladné = nabíjení
    const charging = batP >= base.deadband;
    const discharging = batP <= -base.deadband;
    const islandTotal = hasNum(this.hass, cfg.inverter?.load_power)
      ? toNum(this.hass, cfg.inverter?.load_power)
      : toNum(this.hass, cfg.inverter?.power);
    const gridTotal = hasNum(this.hass, cfg.grid?.power)
      ? toNum(this.hass, cfg.grid?.power)
      : floors.reduce((s, f) => s + this._floorGridPower(f), 0);

    const flow = (id: string, d: string, extra: Partial<FlowOptions> & { power: number; color: string }) =>
      renderFlow(id, d, { ...base, reverse: false, hidden: false, ...extra });

    return html`
      <ha-card>
        <svg
          viewBox="0 0 ${layout.width} ${layout.height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          ${cfg.title
            ? svg`<text class="card-title" x="${layout.width / 2}" y="26" text-anchor="middle">${cfg.title}</text>`
            : nothing}

          <!-- Toky (pod uzly) -->
          ${cfg.solcast?.power_now || cfg.solcast?.remaining_today || cfg.solcast?.total_today
            ? svg`<path d="${layout.paths.pvSolcast}" fill="none" stroke="#ffd54f"
                stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>`
            : nothing}
          ${flow('pv-mppt', layout.paths.pvMppt, { power: pvP, color: C.solar, hidden: !cfg.pv?.power })}
          ${flow('mppt-inv', layout.paths.mpptInv, { power: pvP, color: C.solar, hidden: !cfg.pv?.power })}
          ${flow('bat-inv', layout.paths.batInv, {
            power: batP,
            color: charging ? C.charge : C.discharge,
            reverse: charging,
            hidden: !cfg.battery?.power,
          })}
          ${layout.paths.islandTaps.map((d, i) => {
            const f = floors[i];
            const p = f?.island_power && hasNum(this.hass, f.island_power)
              ? toNum(this.hass, f.island_power)
              : islandTotal;
            return flow(`island-${i}`, d, { power: p, color: C.island });
          })}
          ${layout.paths.gridTaps.map((d, i) => {
            const f = floors[i];
            return flow(`grid-${i}`, d, { power: f ? this._floorGridPower(f) : 0, color: C.grid });
          })}

          <!-- Uzly -->
          ${this._nodePv(layout.pv)}
          ${this._nodeMppt(layout.mppt)}
          ${this._nodeBattery(layout.battery, batP, charging, discharging)}
          ${this._nodeInverter(layout.inverter, islandTotal)}
          ${this._nodeSolcast(layout.solcast)}
          ${this._nodeGrid(layout.grid, gridTotal)}
          ${layout.floors.map((r, i) => (floors[i] ? this._nodeFloor(r, floors[i]) : nothing))}
        </svg>
      </ha-card>
    `;
  }

  /** Skleněný panel uzlu s neonovým rámem. */
  private _panel(r: Rect, accent: string, active = true): TemplateResult {
    return svg`
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="18"
        fill="rgba(14, 24, 34, 0.72)"
        stroke="${accent}" stroke-opacity="${active ? 0.5 : 0.18}" stroke-width="1.5"
        style="${active ? `filter: drop-shadow(0 0 10px ${accent}40)` : ''}"/>`;
  }

  /** Tenký progress bar na spodní hraně uzlu (pozice hodnoty v rozsahu prahů). */
  private _bar(r: Rect, value: number, max: number, color: string): TemplateResult {
    const w = r.w - 40;
    const pct = Math.max(0, Math.min(1, Math.abs(value) / Math.max(1, max)));
    return svg`
      <rect x="${r.x + 20}" y="${r.y + r.h - 12}" width="${w}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      <rect x="${r.x + 20}" y="${r.y + r.h - 12}" width="${Math.max(4, w * pct)}" height="4" rx="2"
        fill="${color}" style="filter: drop-shadow(0 0 4px ${color})"/>`;
  }

  /** Neviditelná klikací plocha přes celý uzel. */
  private _hit(r: Rect, entityId?: string): TemplateResult | typeof nothing {
    if (!entityId) return nothing;
    return svg`
      <rect class="hit" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="18"
        fill="transparent" @click=${() => this._open(entityId)}>
        <title>Zobrazit historii</title>
      </rect>`;
  }

  private _nodePv(r: Rect): TemplateResult {
    const pv = this._config?.pv ?? {};
    const p = toNum(this.hass, pv.power);
    const active = Math.abs(p) >= this._flowBase().deadband;
    const sev = severityColor(p, pv);
    const accent = sev ?? C.solar;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">FVE panely</text>
      ${iconSolarPanel(r.x + 18, r.y + 46, 60, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 92}" y="${r.y + 84}" style="fill: ${accent}">${pv.power ? formatPower(p) : '—'}</text>
      ${sev ? this._bar(r, p, pv.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="small" x="${r.x + 92}" y="${r.y + 112}">
        Dnes <tspan class="strong">${pv.energy_today ? formatEnergy(toNum(this.hass, pv.energy_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 92}" y="${r.y + 134}">
        Celkem <tspan class="strong">${pv.energy_total ? formatEnergy(toNum(this.hass, pv.energy_total)) : '—'}</tspan>
      </text>
      <text class="tiny" x="${r.x + 92}" y="${r.y + 156}">
        ${pv.max_power_today ? `špička dnes ${formatPower(toNum(this.hass, pv.max_power_today))}` : ''}
      </text>
      ${this._hit(r, pv.power)}
    `;
  }

  private _nodeMppt(r: Rect): TemplateResult {
    const pv = this._config?.pv ?? {};
    const state = formatState(this.hass, pv.mppt_state);
    return svg`
      ${this._panel(r, C.solar, state !== '—')}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">MPPT regulátor</text>
      ${iconMppt(r.x + 18, r.y + 44, 48, C.solar)}
      <text class="medium" x="${r.x + 80}" y="${r.y + 66}">${state}</text>
      <text class="small" x="${r.x + 80}" y="${r.y + 92}">
        ${pv.voltage ? formatState(this.hass, pv.voltage) : '—'} ·
        ${pv.current ? formatState(this.hass, pv.current) : '—'}
      </text>
      <text class="tiny" x="${r.x + 20}" y="${r.y + 116}">FV sběrnice → DC</text>
      ${this._hit(r, pv.mppt_state ?? pv.voltage)}
    `;
  }

  private _nodeBattery(r: Rect, batP: number, charging: boolean, discharging: boolean): TemplateResult {
    const b = this._config?.battery ?? {};
    const soc = toNum(this.hass, b.soc, 0);
    // Prahy konfigurovatelné, default žlutá od 15 %, zelená od 40 %.
    const socColor = severityColor(soc, {
      yellow_from: b.yellow_from ?? 15,
      green_from: b.green_from ?? 40,
      severity_invert: b.severity_invert,
    })!;
    const stateText = charging
      ? `▲ nabíjení ${formatPower(Math.abs(batP))}`
      : discharging
        ? `▼ vybíjení ${formatPower(Math.abs(batP))}`
        : '● klidový stav';
    const stateColor = charging ? C.charge : discharging ? C.discharge : 'rgba(220,235,245,0.55)';
    return svg`
      ${this._panel(r, socColor, true)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">Baterie Pylontech</text>
      ${iconBattery(r.x + 30, r.y + 62, 58, 168, soc, socColor)}
      <text class="tiny" x="${r.x + 59}" y="${r.y + 252}" text-anchor="middle">
        ${b.capacity ? formatState(this.hass, b.capacity) : ''}
      </text>
      <text class="big" x="${r.x + 118}" y="${r.y + 90}" style="fill: ${socColor}">${b.soc ? `${Math.round(soc)} %` : '—'}</text>
      <text class="medium" x="${r.x + 118}" y="${r.y + 122}" style="fill: ${stateColor}">${b.power ? stateText : ''}</text>
      <text class="small" x="${r.x + 118}" y="${r.y + 152}">
        ${b.voltage ? formatState(this.hass, b.voltage) : '—'} ·
        ${b.current ? formatState(this.hass, b.current) : '—'}
      </text>
      <text class="small" x="${r.x + 118}" y="${r.y + 176}">
        ${b.temperature ? formatState(this.hass, b.temperature) : '—'}
        ${b.soh ? ` · SoH ${formatState(this.hass, b.soh)}` : ''}
      </text>
      <text class="tiny" x="${r.x + 118}" y="${r.y + 204}">
        ${b.runtime ? `Výdrž ${formatState(this.hass, b.runtime)}` : ''}
      </text>
      <text class="tiny" x="${r.x + 118}" y="${r.y + 226}">
        ${charging && b.time_to_full ? `Do nabití ${formatState(this.hass, b.time_to_full)}` : ''}
      </text>
      ${this._hit(r, b.soc)}
    `;
  }

  private _nodeInverter(r: Rect, islandTotal: number): TemplateResult {
    const inv = this._config?.inverter ?? {};
    const p = hasNum(this.hass, inv.power) ? toNum(this.hass, inv.power) : islandTotal;
    const state = formatState(this.hass, inv.state);
    const active = Math.abs(p) >= this._flowBase().deadband || state !== '—';
    const sev = severityColor(p, inv);
    const accent = sev ?? C.island;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">Měnič ${inv.name ?? 'MultiPlus-II'}</text>
      ${iconInverter(r.x + 18, r.y + 46, 56, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${formatPower(p)}</text>
      ${sev ? this._bar(r, p, inv.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <circle cx="${r.x + 96}" cy="${r.y + 106}" r="4" fill="${state !== '—' ? C.ok : 'rgba(148,170,190,0.4)'}"/>
      <text class="small" x="${r.x + 108}" y="${r.y + 111}">${state}</text>
      <text class="tiny" x="${r.x + 20}" y="${r.y + 146}">
        ${inv.load_power && inv.power ? `Kritické zátěže ${formatPower(toNum(this.hass, inv.load_power))}` : 'Ostrovní spotřeba'}
      </text>
      ${inv.total_yield
        ? svg`<text class="small" x="${r.x + 20}" y="${r.y + 176}">
            Celkový výnos <tspan class="strong">${formatEnergy(toNum(this.hass, inv.total_yield))}</tspan>
          </text>`
        : nothing}
      ${inv.days_in_service
        ? svg`<text class="small" x="${r.x + 20}" y="${r.y + 200}">
            V provozu <tspan class="strong">${formatState(this.hass, inv.days_in_service)}</tspan>
          </text>`
        : nothing}
      ${this._hit(r, inv.power ?? inv.load_power)}
    `;
  }

  private _nodeSolcast(r: Rect): TemplateResult | typeof nothing {
    const s = this._config?.solcast;
    if (!s || (!s.power_now && !s.remaining_today && !s.total_today)) return nothing;
    return svg`
      ${this._panel(r, '#ffd54f', true)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">Předpověď Solcast</text>
      ${iconSun(r.x + 16, r.y + 58, 56, '#ffd54f')}
      <text class="medium" x="${r.x + 88}" y="${r.y + 84}" fill="#ffd54f">
        ${s.power_now ? formatPower(toNum(this.hass, s.power_now)) : '—'}
      </text>
      <text class="small" x="${r.x + 88}" y="${r.y + 116}">
        Zbývá dnes <tspan class="strong">${s.remaining_today ? formatEnergy(toNum(this.hass, s.remaining_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 88}" y="${r.y + 142}">
        Dnes celkem <tspan class="strong">${s.total_today ? formatEnergy(toNum(this.hass, s.total_today)) : '—'}</tspan>
      </text>
      ${this._hit(r, s.power_now)}
    `;
  }

  private _nodeGrid(r: Rect, gridTotal: number): TemplateResult {
    const g = this._config?.grid ?? {};
    const active = Math.abs(gridTotal) >= this._flowBase().deadband;
    const phases = [g.phase_a, g.phase_b, g.phase_c]
      .map((e, i) => (e ? `L${i + 1} ${formatPower(toNum(this.hass, e))}` : null))
      .filter(Boolean)
      .join(' · ');
    const sev = severityColor(gridTotal, g);
    const accent = sev ?? C.grid;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${g.name ?? 'Síť ČEZ'} · AC-IN</text>
      ${iconPylon(r.x + 16, r.y + 40, 58, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 82}" style="fill: ${accent}">${formatPower(gridTotal)}</text>
      ${sev ? this._bar(r, gridTotal, g.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="tiny" x="${r.x + 90}" y="${r.y + 106}">${phases}</text>
      <text class="tiny" x="${r.x + 90}" y="${r.y + 128}">
        ${g.energy_total ? `Celkem ${formatEnergy(toNum(this.hass, g.energy_total))}` : ''}
        ${g.energy_today ? ` · dnes ${formatEnergy(toNum(this.hass, g.energy_today))}` : ''}
      </text>
      ${this._hit(r, g.power)}
    `;
  }

  private _nodeFloor(r: Rect, f: FloorConfig): TemplateResult {
    const gridP = this._floorGridPower(f);
    const hasIsland = !!f.island_power && hasNum(this.hass, f.island_power);
    const islandP = hasIsland ? toNum(this.hass, f.island_power) : 0;
    const phases = this._phases(f);
    const active = Math.abs(gridP) >= this._flowBase().deadband || (hasIsland && Math.abs(islandP) >= this._flowBase().deadband);
    const accent = hasIsland && islandP > gridP ? C.island : C.grid;
    return svg`
      ${this._panel(r, accent, active)}
      ${iconHome(r.x + 16, r.y + 12, 30, accent)}
      <text class="floor-name" x="${r.x + 54}" y="${r.y + 34}">${f.name ?? 'Patro'}</text>
      <text class="tiny" x="${r.x + 54}" y="${r.y + 56}">
        ${f.grid_energy ? `ze sítě ${formatEnergy(toNum(this.hass, f.grid_energy))}` : ''}
        ${f.island_energy ? ` · z fve ${formatEnergy(toNum(this.hass, f.island_energy))}` : ''}
      </text>
      ${hasIsland
        ? svg`
          <text class="floor-val" x="${r.x + r.w - 20}" y="${r.y + 32}" text-anchor="end">
            <tspan class="dim">fve </tspan><tspan class="val-island strong">${formatPower(islandP)}</tspan>
          </text>
          <text class="floor-val" x="${r.x + r.w - 20}" y="${r.y + 56}" text-anchor="end">
            <tspan class="dim">síť </tspan><tspan class="val-grid strong">${formatPower(gridP)}</tspan>
          </text>`
        : svg`
          <text class="floor-val" x="${r.x + r.w - 20}" y="${r.y + 32}" text-anchor="end">
            <tspan class="dim">síť </tspan><tspan class="val-grid strong">${formatPower(gridP)}</tspan>
          </text>`}
      ${phases.length
        ? svg`
          <foreignObject x="${r.x + 14}" y="${r.y + r.h - 88}" width="${r.w - 28}" height="76">
            ${html`
              <div class="chips" xmlns="http://www.w3.org/1999/xhtml">
                ${phases.map(
                  (ph) => html`
                    <div
                      class="chip"
                      title=${`${ph.label} · ${ph.name}`}
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this._open(ph.entity);
                      }}
                    >
                      <ha-icon .icon=${ph.icon}></ha-icon>
                      <span class="chip-value">${formatPower(toNum(this.hass, ph.entity))}</span>
                      <span class="chip-name">${ph.name}</span>
                    </div>
                  `,
                )}
              </div>
            `}
          </foreignObject>`
        : nothing}
      ${this._hit({ x: r.x, y: r.y, w: r.w, h: 64 }, f.grid_power ?? f.island_power ?? phases[0]?.entity)}
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      overflow: hidden;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(1100px 700px at 18% -10%, #122433 0%, transparent 60%),
        radial-gradient(900px 600px at 95% 105%, #0d1d2e 0%, transparent 55%),
        linear-gradient(160deg, #0b141d 0%, #070c12 100%);
      border: 1px solid rgba(120, 180, 210, 0.08);
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      /* Vejít se i na výšku: viewport minus HA hlavička a odsazení.
         SVG drží poměr stran (viewBox + meet), takže se jen zmenší a vycentruje. */
      max-height: calc(100vh - var(--header-height, 56px) - 24px);
      font-family: var(--paper-font-body1_-_font-family, 'Roboto', 'Segoe UI', sans-serif);
    }
    text {
      fill: rgba(226, 240, 248, 0.92);
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.4);
    }
    .node-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .big {
      font-size: 32px;
      font-weight: 700;
    }
    .medium {
      font-size: 17px;
      font-weight: 600;
    }
    .small {
      font-size: 14px;
      fill: rgba(226, 240, 248, 0.62);
    }
    .tiny {
      font-size: 11.5px;
      fill: rgba(226, 240, 248, 0.45);
    }
    .strong {
      font-weight: 700;
      fill: rgba(226, 240, 248, 0.92);
    }
    .dim {
      fill: rgba(226, 240, 248, 0.45);
    }
    .floor-name {
      font-size: 20px;
      font-weight: 700;
    }
    .floor-val {
      font-size: 15px;
    }
    .val-island {
      fill: #00e676;
    }
    .val-island.strong {
      fill: #00e676;
    }
    .val-grid {
      fill: #4fc3f7;
    }
    .val-grid.strong {
      fill: #4fc3f7;
    }
    .hit {
      cursor: pointer;
    }
    .hit:hover {
      fill: rgba(255, 255, 255, 0.04);
    }
    .chips {
      display: flex;
      gap: 8px;
      height: 100%;
      box-sizing: border-box;
    }
    .chip {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(120, 180, 210, 0.16);
      border-radius: 12px;
      cursor: pointer;
      padding: 4px 2px;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .chip:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(79, 195, 247, 0.55);
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
      color: rgba(226, 240, 248, 0.75);
    }
    .chip-value {
      font-size: 13px;
      font-weight: 700;
      color: #4fc3f7;
      line-height: 1.1;
    }
    .chip-name {
      font-size: 10px;
      color: rgba(226, 240, 248, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.1;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'fve-flow-card': FveFlowCard;
  }
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fve-flow-card',
  name: 'FVE Flow Card',
  description:
    'Animovaný diagram toků energie pro ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.',
  preview: false,
  documentationURL: 'https://github.com/elvisek/fve-flow-card',
});
