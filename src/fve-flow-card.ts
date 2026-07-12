import { LitElement, html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  FloorConfig,
  FveFlowCardConfig,
  GridConfig,
  HomeAssistant,
  PhaseSpec,
  SolcastConfig,
} from './types';
import { computeLayout, computeMobileLayout, type Layout, type Rect } from './layout';
import { renderFlow, type FlowOptions } from './flow';
import { renderPhaseChips } from './phase-chips';
import {
  iconBattery,
  iconFan,
  iconGear,
  iconHome,
  iconInverter,
  iconMppt,
  iconPower,
  iconPylon,
  iconSolarPanel,
  iconSun,
} from './icons';
import { openConfirmDialog } from './confirm-dialog';
import {
  formatEnergy,
  formatPower,
  formatState,
  hasNum,
  moreInfo,
  severityColor,
  toNum,
} from './utils';
import { openHistoryDialog, type HistorySeries } from './history-dialog';
import { fetchHistory, renderSparkline, type HistoryPoint } from './sparkline';
import './editor';
import './fve-flow-mini-card';

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

const PHASE_STYLE: Record<string, { color: string; border: string }> = {
  L1: { color: '#f5f5f5', border: 'rgba(245,245,245,0.28)' },
  // Fyzická černá je na tmavém dashboardu nahrazena kontrastní grafitovou.
  L2: { color: '#78909c', border: 'rgba(120,144,156,0.35)' },
  L3: { color: '#b87333', border: 'rgba(184,115,51,0.38)' },
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

  /** Historie za poslední hodinu pro sparkliny, klíč = entity_id. */
  @state() private _spark: Map<string, HistoryPoint[]> = new Map();
  private _sparkEntities: string[] = [];
  private _sparkTimer?: number;

  /** Vertikální mobilní layout pod breakpointem šířky karty (ne viewportu). */
  @state() private _narrow = false;
  private _resizeObserver?: ResizeObserver;
  private static readonly NARROW_BREAKPOINT = 640;

  public setConfig(config: FveFlowCardConfig): void {
    if (!config) throw new Error('Chybí konfigurace');
    this._config = config;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // Periodické obnovení sparklin — nezávislé na `hass` update cyklu,
    // aby se historie netahala při každé změně stavu entit (1×/s).
    this._sparkTimer = window.setInterval(() => void this._refreshSparklines(), 5 * 60 * 1000);
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) this._narrow = width < FveFlowCard.NARROW_BREAKPOINT;
    });
    this._resizeObserver.observe(this);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._sparkTimer !== undefined) {
      window.clearInterval(this._sparkTimer);
      this._sparkTimer = undefined;
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.toggleAttribute('narrow', this._narrow);
    if (!this.hass || !this._config) return;
    const entities = this._sparklineEntities();
    const same =
      entities.length === this._sparkEntities.length &&
      entities.every((e, i) => e === this._sparkEntities[i]);
    if (!same) {
      this._sparkEntities = entities;
      void this._refreshSparklines();
    }
  }

  /** Entity sledované sparklinami — jen nakonfigurované, když je funkce zapnutá. */
  private _sparklineEntities(): string[] {
    const cfg = this._config;
    if (!cfg || cfg.options?.sparklines === false) return [];
    return [cfg.pv?.power, cfg.battery?.soc, cfg.inverter?.power, cfg.grid?.power].filter(
      (e): e is string => !!e,
    );
  }

  private async _refreshSparklines(): Promise<void> {
    if (!this.hass) return;
    const entities = this._sparklineEntities();
    if (!entities.length) {
      if (this._spark.size) this._spark = new Map();
      return;
    }
    const hass = this.hass;
    const results = await Promise.all(entities.map((e) => fetchHistory(hass, e)));
    const next = new Map<string, HistoryPoint[]>();
    entities.forEach((e, i) => next.set(e, results[i]));
    this._spark = next;
  }

  /** Mini trend v pravém horním rohu uzlu, pod titulkem. Bez dat se nevykreslí. */
  private _sparklineNode(entityId: string | undefined, r: Rect, color: string): TemplateResult | typeof nothing {
    if (!entityId) return nothing;
    const points = this._spark.get(entityId);
    if (!points?.length) return nothing;
    return renderSparkline(points, r.x + r.w - 104, r.y + 34, 90, 20, color);
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
        total_tomorrow: 'sensor.solcast_pv_forecast_forecast_tomorrow',
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

  private _entityName(entityId: string, fallback?: string): string {
    const friendlyName = this.hass?.states[entityId]?.attributes.friendly_name;
    return fallback || (typeof friendlyName === 'string' ? friendlyName : entityId);
  }

  private _historySeries(entityId: string | undefined, name: string, color: string): HistorySeries[] {
    return entityId ? [{ entity: entityId, name, color }] : [];
  }

  private async _openHistory(
    series: HistorySeries[],
    title: string,
    spanOffset?: string,
    rangeLabel?: string,
  ): Promise<void> {
    if (!this.hass || !series.length) return;
    const opened = await openHistoryDialog({
      hass: this.hass,
      title,
      series,
      spanOffset,
      rangeLabel,
    });
    if (!opened) moreInfo(this, series[0].entity);
  }

  private _openEntity(entityId: string | undefined, title: string, color: string): void {
    if (!entityId) return;
    void this._openHistory(
      this._historySeries(entityId, this._entityName(entityId, title), color),
      title,
    );
  }

  private _openSolcastHistory(solcast: SolcastConfig): void {
    if (!solcast.power_now) return;
    const forecastEntities = [solcast.total_today, solcast.total_tomorrow].filter(
      (entity): entity is string => !!entity,
    );
    if (!forecastEntities.length) {
      this._openEntity(solcast.power_now, 'Předpověď Solcast', '#ffd54f');
      return;
    }

    const dataGenerator = `
      const entityIds = ${JSON.stringify(forecastEntities)};
      const now = Date.now();
      const forecastEnd = now + 24 * 60 * 60 * 1000;
      return entityIds
        .flatMap((entityId) => {
          const forecastEntity = hass.states[entityId];
          return forecastEntity && Array.isArray(forecastEntity.attributes.detailedForecast)
            ? forecastEntity.attributes.detailedForecast
            : [];
        })
        .map((item) => {
          const timestamp = new Date(item.period_start).getTime();
          const watts = Number(item.pv_estimate) * 1000;
          return [timestamp, watts];
        })
        .filter(([timestamp, watts]) =>
          timestamp >= now - 30 * 60 * 1000 &&
          timestamp <= forecastEnd &&
          Number.isFinite(watts)
        )
        .map(([timestamp, watts]) => [Math.max(timestamp, now), watts]);
    `;

    void this._openHistory(
      [
        {
          entity: solcast.power_now,
          name: 'Skutečnost',
          color: '#4fc3f7',
          opacity: 0.18,
          extendTo: 'now',
          fill: 'null',
        },
        {
          entity: forecastEntities[0],
          name: 'Predikce',
          color: '#ffd54f',
          dataGenerator,
          strokeDash: 5,
          opacity: 0.12,
          extendTo: false,
        },
      ],
      'Solcast · skutečnost a predikce',
      '+24h',
      '24 h historie · 24 h predikce',
    );
  }

  private _openFloorHistory(f: FloorConfig, phases: PhaseSpec[]): void {
    const title = `${f.name || 'Patro'} · výkon`;
    const series: HistorySeries[] = [];

    if (f.grid_power) {
      series.push({ entity: f.grid_power, name: 'Síť', color: C.grid });
    } else {
      phases.forEach((phase) => {
        series.push({
          entity: phase.entity,
          name: phase.name || phase.label,
          color: PHASE_STYLE[phase.label]?.color ?? C.grid,
        });
      });
    }
    if (f.island_power) {
      series.push({ entity: f.island_power, name: 'FVE', color: C.island });
    }

    void this._openHistory(series, title);
  }

  /** Fáze gridu AC-IN (L1–L3). */
  private _gridPhases(g: GridConfig): PhaseSpec[] {
    const defs: Array<[string | undefined, string]> = [
      [g.phase_a, 'L1'],
      [g.phase_b, 'L2'],
      [g.phase_c, 'L3'],
    ];
    return defs
      .filter(([entity]) => !!entity)
      .map(([entity, label]) => ({
        entity: entity!,
        name: label,
        icon: 'mdi:flash',
        label,
      }));
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

  private _switchOn(entityId: string): boolean {
    return this.hass?.states[entityId]?.state === 'on';
  }

  private _toggleSwitch(entityId: string): void {
    void this.hass?.callService?.(
      'switch',
      this._switchOn(entityId) ? 'turn_off' : 'turn_on',
      { entity_id: entityId },
    );
  }

  /** Přepnutí chráněné potvrzovacím dialogem (MPPT). */
  private async _toggleSwitchConfirmed(entityId: string, name: string): Promise<void> {
    const on = this._switchOn(entityId);
    const confirmed = await openConfirmDialog({
      title: on ? `Vypnout ${name}?` : `Zapnout ${name}?`,
      message: on
        ? `Regulátor se odpojí a přestane nabíjet z FVE. Opravdu chceš ${name} vypnout?`
        : `Regulátor se připojí a začne nabíjet z FVE. Opravdu chceš ${name} zapnout?`,
      confirmLabel: on ? 'Vypnout' : 'Zapnout',
      accent: on ? C.warn : C.ok,
    });
    if (confirmed) this._toggleSwitch(entityId);
  }

  /**
   * Malý ovládací chip (spínač) uvnitř panelu — ikona + Zapnout/Vypnout.
   * Vykresluje se až po klikací ploše `_hit`, aby klik nepropadl do historie.
   */
  private _controlChip(
    x: number,
    y: number,
    entityId: string,
    label: string,
    icon: (ix: number, iy: number, size: number, color: string, spin?: boolean) => TemplateResult,
    onClick: () => void,
  ): TemplateResult {
    const w = 96;
    const h = 30;
    const on = this._switchOn(entityId);
    const accent = on ? '#26c6da' : 'rgba(148,170,190,0.55)';
    return svg`
      <g class="ctrl-chip" @click=${(e: Event) => {
        e.stopPropagation();
        onClick();
      }}>
        <title>${label} · ${on ? 'zapnuto' : 'vypnuto'}</title>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"
          fill="rgba(255,255,255,0.05)" stroke="${accent}" stroke-opacity="${on ? 0.7 : 0.35}"
          stroke-width="1" style="${on ? `filter: drop-shadow(0 0 6px ${accent}60)` : ''}"/>
        ${icon(x + 9, y + 8, 14, accent, on)}
        <text class="ctrl-label" x="${x + 30}" y="${y + 19.5}" style="fill: ${on ? '#bfeef5' : 'rgba(226,240,248,0.6)'}">
          ${on ? 'Vypnout' : 'Zapnout'}
        </text>
      </g>`;
  }

  /**
   * Přepne dashboard přímo do editačního režimu (HA URL param `?edit=1`),
   * bez ručního průchodu přes postranní menu → Nastavení → Dashboardy.
   * Panelový view s jedinou kartou pak hned nabídne tužku pro její úpravu.
   */
  private _openDashboardEdit(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('edit', '1');
    window.history.pushState(null, '', url.toString());
    window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
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
    const layout = this._narrow
      ? computeMobileLayout(Math.max(1, floors.length))
      : computeLayout(Math.max(1, floors.length));
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
          <g class="settings-btn" @click=${(e: Event) => {
            e.stopPropagation();
            this._openDashboardEdit();
          }}>
            <title>Upravit dashboard</title>
            <circle cx="${layout.width - 28}" cy="20" r="15" fill="rgba(255,255,255,0.05)"
              stroke="rgba(148,170,190,0.4)" stroke-width="1"/>
            ${iconGear(layout.width - 28 - 8, 12, 16, 'rgba(226,240,248,0.55)')}
          </g>

          <!-- Toky (pod uzly) -->
          ${cfg.solcast?.power_now ||
          cfg.solcast?.remaining_today ||
          cfg.solcast?.total_today ||
          cfg.solcast?.total_tomorrow
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
    const y = r.y + r.h - 12;
    return svg`
      <rect x="${r.x + 20}" y="${y}" width="${w}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      ${pct > 0
        ? svg`<rect x="${r.x + 20}" y="${y}" width="${Math.max(4, w * pct)}" height="4" rx="2"
            fill="${color}" style="filter: drop-shadow(0 0 4px ${color})"/>`
        : nothing}`;
  }

  /** Neviditelná klikací plocha přes celý uzel. */
  private _hit(r: Rect, onClick?: () => void): TemplateResult | typeof nothing {
    if (!onClick) return nothing;
    return svg`
      <rect class="hit" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="18"
        fill="transparent" @click=${onClick}>
        <title>Zobrazit graf za 48 hodin</title>
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
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${pv.name || 'FVE panely'}</text>
      ${this._sparklineNode(pv.power, r, accent)}
      ${iconSolarPanel(r.x + 18, r.y + 46, 60, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${pv.power ? formatPower(p) : '—'}</text>
      ${sev ? this._bar(r, p, pv.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="small" x="${r.x + 90}" y="${r.y + 112}">
        Dnes <tspan class="strong">${pv.energy_today ? formatEnergy(toNum(this.hass, pv.energy_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 134}">
        Špička dnes <tspan class="strong">${pv.max_power_today ? formatPower(toNum(this.hass, pv.max_power_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 156}">
        Celkem <tspan class="strong">${pv.energy_total ? formatEnergy(toNum(this.hass, pv.energy_total)) : '—'}</tspan>
      </text>
      ${this._hit(
        r,
        pv.power ? () => this._openEntity(pv.power, pv.name || 'FVE panely', accent) : undefined,
      )}
    `;
  }

  private _nodeMppt(r: Rect): TemplateResult {
    const pv = this._config?.pv ?? {};
    const state = formatState(this.hass, pv.mppt_state);
    const rawState = pv.mppt_state
      ? this.hass?.states[pv.mppt_state]?.state.trim().toLowerCase()
      : undefined;
    const active =
      !!rawState && !['off', 'vypnuto', 'unknown', 'unavailable'].includes(rawState);
    return svg`
      ${this._panel(r, C.solar, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${pv.mppt_name || 'MPPT regulátor'}</text>
      ${iconMppt(r.x + 18, r.y + 44, 48, active ? C.solar : 'rgba(148,170,190,0.5)')}
      <text class="medium" x="${r.x + 80}" y="${r.y + 66}">${state}</text>
      <text class="small" x="${r.x + 80}" y="${r.y + 92}">
        Napětí <tspan class="strong">${pv.voltage ? formatState(this.hass, pv.voltage) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 80}" y="${r.y + 114}">
        Proud <tspan class="strong">${pv.current ? formatState(this.hass, pv.current) : '—'}</tspan>
      </text>
      ${this._hit(
        r,
        pv.mppt_state || pv.voltage
          ? () => moreInfo(this, pv.mppt_state ?? pv.voltage)
          : undefined,
      )}
      ${pv.mppt_switch
        ? this._controlChip(r.x + r.w - 110, r.y + 12, pv.mppt_switch, pv.mppt_name || 'MPPT regulátor', iconPower, () =>
            void this._toggleSwitchConfirmed(pv.mppt_switch!, pv.mppt_name || 'MPPT regulátor'))
        : nothing}
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
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${b.name || 'Baterie Pylontech'}</text>
      ${this._sparklineNode(b.soc, r, socColor)}
      ${iconBattery(r.x + 30, r.y + 62, 58, 168, soc, socColor)}
      <text class="tiny" x="${r.x + 59}" y="${r.y + 252}" text-anchor="middle">
        ${b.capacity ? formatState(this.hass, b.capacity) : ''}
      </text>
      <text class="big" x="${r.x + 118}" y="${r.y + 90}" style="fill: ${socColor}">${b.soc ? `${Math.round(soc)} %` : '—'}</text>
      <text class="medium" x="${r.x + 118}" y="${r.y + 122}" style="fill: ${stateColor}">${b.power ? stateText : ''}</text>
      <text class="small" x="${r.x + 118}" y="${r.y + 152}">
        Napětí <tspan class="strong">${b.voltage ? formatState(this.hass, b.voltage) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 118}" y="${r.y + 174}">
        Proud <tspan class="strong">${b.current ? formatState(this.hass, b.current) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 118}" y="${r.y + 196}">
        Teplota <tspan class="strong">${b.temperature ? formatState(this.hass, b.temperature) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 118}" y="${r.y + 218}">
        ${b.soh ? `SoH ${formatState(this.hass, b.soh)}` : ''}
      </text>
      <text class="tiny" x="${r.x + 118}" y="${r.y + 242}">
        ${b.runtime ? `Výdrž ${formatState(this.hass, b.runtime)}` : ''}
      </text>
      <text class="tiny" x="${r.x + 118}" y="${r.y + 262}">
        ${b.cycles ? `Počet cyklů ${formatState(this.hass, b.cycles)}` : ''}
      </text>
      <text class="tiny" x="${r.x + 118}" y="${r.y + 282}">
        ${charging && b.time_to_full ? `Do nabití ${formatState(this.hass, b.time_to_full)}` : ''}
      </text>
      ${this._hit(
        r,
        b.soc
          ? () => this._openEntity(b.soc, `${b.name || 'Baterie Pylontech'} · SoC`, socColor)
          : undefined,
      )}
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
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${inv.name || 'Měnič MultiPlus-II'}</text>
      ${this._sparklineNode(inv.power, r, accent)}
      ${iconInverter(r.x + 18, r.y + 46, 56, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${formatPower(p)}</text>
      <circle cx="${r.x + 96}" cy="${r.y + 106}" r="4" fill="${state !== '—' ? C.ok : 'rgba(148,170,190,0.4)'}"/>
      <text class="small" x="${r.x + 108}" y="${r.y + 111}">${state}</text>
      ${inv.voltage
        ? svg`<text class="small" x="${r.x + 90}" y="${r.y + 138}">
            Napětí <tspan class="strong">${formatState(this.hass, inv.voltage)}</tspan>
          </text>`
        : nothing}
      ${inv.current
        ? svg`<text class="small" x="${r.x + 90}" y="${r.y + 160}">
            Proud <tspan class="strong">${formatState(this.hass, inv.current)}</tspan>
          </text>`
        : nothing}
      ${inv.load_power
        ? svg`<text class="tiny" x="${r.x + 90}" y="${r.y + 184}">
            Kritické zátěže ${formatPower(toNum(this.hass, inv.load_power))}
          </text>`
        : nothing}
      ${sev ? this._bar(r, p, inv.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      ${inv.days_in_service
        ? svg`<text class="tiny" x="${r.x + 20}" y="${r.y + r.h - 20}">
            Počet dní v provozu <tspan class="strong">${formatState(this.hass, inv.days_in_service)}</tspan>
          </text>`
        : nothing}
      ${this._hit(
        r,
        inv.power || inv.load_power
          ? () => this._openEntity(inv.power ?? inv.load_power, inv.name || 'Měnič MultiPlus-II', accent)
          : undefined,
      )}
      ${inv.fan_switch
        ? this._controlChip(r.x + r.w - 110, r.y + r.h - 52, inv.fan_switch, 'Chlazení', iconFan, () =>
            this._toggleSwitch(inv.fan_switch!))
        : nothing}
    `;
  }

  private _nodeSolcast(r: Rect): TemplateResult | typeof nothing {
    const s = this._config?.solcast;
    if (!s || (!s.power_now && !s.remaining_today && !s.total_today && !s.total_tomorrow)) return nothing;
    const p = toNum(this.hass, s.power_now);
    const sev = severityColor(p, s);
    const accent = sev ?? '#ffd54f';
    // Stejné chování jako FVE: při nulové predikci se rámeček ztlumí.
    const active = Math.abs(p) >= this._flowBase().deadband;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">Předpověď Solcast</text>
      ${iconSun(r.x + 16, r.y + 58, 56, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">
        ${s.power_now ? formatPower(p) : '—'}
      </text>
      ${sev ? this._bar(r, p, s.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="small" x="${r.x + 90}" y="${r.y + 112}">
        Zbývá dnes <tspan class="strong">${s.remaining_today ? formatEnergy(toNum(this.hass, s.remaining_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 134}">
        Dnes celkem <tspan class="strong">${s.total_today ? formatEnergy(toNum(this.hass, s.total_today)) : '—'}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 156}">
        Zítra celkem <tspan class="strong">${s.total_tomorrow ? formatEnergy(toNum(this.hass, s.total_tomorrow)) : '—'}</tspan>
      </text>
      ${this._hit(
        r,
        s.power_now ? () => this._openSolcastHistory(s) : undefined,
      )}
    `;
  }

  private _nodeGrid(r: Rect, gridTotal: number): TemplateResult {
    const g = this._config?.grid ?? {};
    const active = Math.abs(gridTotal) >= this._flowBase().deadband;
    const phaseSpecs = this._gridPhases(g);
    const sev = severityColor(gridTotal, g);
    const accent = sev ?? C.grid;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${g.name || 'Síť ČEZ'}</text>
      ${this._sparklineNode(g.power, r, accent)}
      ${iconPylon(r.x + 16, r.y + 44, 52, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${formatPower(gridTotal)}</text>
      ${sev ? this._bar(r, gridTotal, g.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="tiny" x="${r.x + 90}" y="${r.y + 108}">
        ${g.energy_total ? `Celkem ze sítě ${formatEnergy(toNum(this.hass, g.energy_total))}` : ''}
        ${g.energy_today ? ` · dnes ${formatEnergy(toNum(this.hass, g.energy_today))}` : ''}
      </text>
      ${this._hit(
        r,
        g.power ? () => this._openEntity(g.power, g.name || 'Síť', accent) : undefined,
      )}
      ${phaseSpecs.length
        ? renderPhaseChips(
            r,
            phaseSpecs,
            this.hass,
            (id) => {
              const phase = phaseSpecs.find((item) => item.entity === id);
              this._openEntity(
                id,
                this._entityName(id),
                phase ? PHASE_STYLE[phase.label]?.color ?? C.grid : C.grid,
              );
            },
            {
              itemStyle: (phase) => ({
                iconColor: PHASE_STYLE[phase.label]?.color ?? C.grid,
                borderColor: PHASE_STYLE[phase.label]?.border,
              }),
            },
          )
        : nothing}
    `;
  }

  private _nodeFloor(r: Rect, f: FloorConfig): TemplateResult {
    const gridP = this._floorGridPower(f);
    const hasIsland = !!f.island_power && hasNum(this.hass, f.island_power);
    const islandP = hasIsland ? toNum(this.hass, f.island_power) : 0;
    const phases = this._phases(f);
    const active = Math.abs(gridP) >= this._flowBase().deadband || (hasIsland && Math.abs(islandP) >= this._flowBase().deadband);
    const accent = hasIsland && islandP > gridP ? C.island : C.grid;
    // FVE chip(y) vlevo (kudy vstupuje zelený tok z měniče), grid fáze
    // vpravo (kudy vstupuje modrý tok ze sítě). Připraveno i na 3f FVE.
    const fveChips: PhaseSpec[] = hasIsland
      ? [{ entity: f.island_power!, name: 'FVE výroba', icon: 'mdi:solar-power', label: 'FVE' }]
      : [];
    const gridChips = phases;

    const openChip = (id: string, isFve: boolean) => {
      const chip = [...fveChips, ...gridChips].find((item) => item.entity === id);
      this._openEntity(
        id,
        chip ? `${f.name || 'Patro'} · ${chip.name}` : this._entityName(id),
        isFve ? C.island : chip ? PHASE_STYLE[chip.label]?.color ?? C.grid : C.grid,
      );
    };
    const fveStyle = { icon: iconSun, iconColor: C.island, borderColor: 'rgba(0,230,118,0.22)' };
    const gridStyle = (ph: PhaseSpec) => ({
      iconColor: PHASE_STYLE[ph.label]?.color ?? C.grid,
      borderColor: PHASE_STYLE[ph.label]?.border,
    });

    // Šířky zón proporcionálně podle počtu chipů (1 FVE + 3 grid = 1:3).
    const pad = 14;
    const split = fveChips.length > 0 && gridChips.length > 0;
    const dividerSpace = 24;
    const innerW = r.w - pad * 2;
    const availW = innerW - (split ? dividerSpace : 0);
    const totalChips = fveChips.length + gridChips.length;
    const fveW = split ? (availW * fveChips.length) / totalChips : availW;
    const fveZone = { x: r.x + pad, w: fveW };
    const gridZone = split
      ? { x: r.x + pad + fveW + dividerSpace, w: availW - fveW }
      : { x: r.x + pad, w: availW };
    // Svislá dělicí linka přes výšku řady chipů (viz geometrie v phase-chips.ts).
    const chipTop = r.y + r.h - 72 - 24;
    const dividerX = r.x + pad + fveW + dividerSpace / 2;

    return svg`
      ${this._panel(r, accent, active)}
      ${iconHome(r.x + 16, r.y + 12, 30, accent)}
      <text class="floor-name" x="${r.x + 54}" y="${r.y + 34}">${f.name ?? 'Patro'}</text>
      <text class="floor-val" x="${r.x + r.w - 20}" y="${r.y + 32}" text-anchor="end">
        <tspan class="dim">síť </tspan><tspan class="val-grid strong">${formatPower(gridP)}</tspan>
      </text>
      <text class="tiny" x="${r.x + 54}" y="${r.y + 56}">
        ${f.grid_energy ? `Celkem ze sítě ${formatEnergy(toNum(this.hass, f.grid_energy))}` : ''}
        ${f.island_energy ? ` · z fve ${formatEnergy(toNum(this.hass, f.island_energy))}` : ''}
      </text>
      ${this._hit(
        { x: r.x, y: r.y, w: r.w, h: 64 },
        f.grid_power || f.island_power || phases.length
          ? () => this._openFloorHistory(f, phases)
          : undefined,
      )}
      ${split
        ? svg`<line x1="${dividerX}" y1="${chipTop - 4}" x2="${dividerX}" y2="${chipTop + 76}"
            stroke="rgba(148,170,190,0.18)" stroke-width="1"/>`
        : nothing}
      ${fveChips.length
        ? renderPhaseChips(r, fveChips, this.hass, (id) => openChip(id, true), {
            itemStyle: () => fveStyle,
            zone: fveZone,
          })
        : nothing}
      ${gridChips.length
        ? renderPhaseChips(r, gridChips, this.hass, (id) => openChip(id, false), {
            itemStyle: gridStyle,
            zone: gridZone,
          })
        : nothing}
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
    /* Úzká karta (mobil): scéna je vertikální a delší než okno, takže se
       nechá stránku rolovat místo vnucování max-height clampu.
       !important — HA grid/masonry wrapper okolo karty někdy vnucuje
       vlastní výšku podle počtu řádků, tady musí vyhrát obsah. */
    :host([narrow]) {
      height: auto !important;
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
    :host([narrow]) ha-card {
      height: auto !important;
      overflow: visible;
      align-items: flex-start;
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
    :host([narrow]) svg {
      max-height: none;
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
    .phase-chip {
      cursor: pointer;
    }
    .phase-chip rect {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .phase-chip:hover rect {
      fill: rgba(255, 255, 255, 0.09);
      stroke: rgba(79, 195, 247, 0.55);
    }
    .chip-value {
      font-size: 13px;
      font-weight: 700;
      fill: #4fc3f7;
    }
    .chip-name {
      font-size: 10px;
      fill: rgba(226, 240, 248, 0.5);
    }
    .ctrl-chip {
      cursor: pointer;
    }
    .ctrl-chip rect {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .ctrl-chip:hover rect {
      fill: rgba(255, 255, 255, 0.1);
    }
    .ctrl-label {
      font-size: 12px;
      font-weight: 650;
      letter-spacing: 0.03em;
    }
    .settings-btn {
      cursor: pointer;
    }
    .settings-btn circle {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .settings-btn:hover circle {
      fill: rgba(255, 255, 255, 0.1);
      stroke: rgba(79, 195, 247, 0.55);
    }
    /* Rotace lopatek ventilátoru, když je chlazení zapnuté. */
    .spin {
      transform-box: fill-box;
      transform-origin: center;
      animation: fve-fan-spin 2.2s linear infinite;
    }
    @keyframes fve-fan-spin {
      to {
        transform: rotate(360deg);
      }
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
