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
  iconChart,
  iconFan,
  iconForecast,
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
import { openAnalysisDialog, type FveFlowAnalysisDialog } from './analysis-dialog';
import { C, FLOOR_DOTS, NEUTRAL } from './palette';
import { openForecastDialog } from './forecast-dialog';
import { findPlanner, plannerMinSoc, type PlannerEntities } from './planner';
import { fetchStats } from './analysis-stats';
import {
  capacityToKwh,
  flowDuration,
  formatEnergy,
  formatEnergyEntity,
  formatPower,
  formatPowerEntity,
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


const PHASE_STYLE: Record<string, { color: string; border: string }> = {
  L1: { color: '#f5f5f5', border: 'rgba(245,245,245,0.28)' },
  // Fyzická černá je na tmavém dashboardu nahrazena kontrastní grafitovou.
  L2: { color: '#78909c', border: 'rgba(120,144,156,0.35)' },
  L3: { color: '#b87333', border: 'rgba(184,115,51,0.38)' },
};

console.info(
  `%c HYBRID-ENERGY-FLOW %c v${CARD_VERSION} `,
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
  /** Dnešní energie AC IN (kWh, přírůstek kumulativních čítačů od půlnoci). */
  @state() private _acInToday: { charger: number | null; pass: number | null; battery: number | null } | null = null;
  private _acInTodayKey = '';
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
    this._sparkTimer = window.setInterval(() => {
      void this._refreshSparklines();
      void this._refreshAcInToday();
    }, 5 * 60 * 1000);
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
    // Po návratu na view (reconnect) se sparkliny načtou hned, ne až za 5 min.
    this._sparkEntities = [];
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    // Pohled se zavírá (navigace pryč) → zavřít i otevřené okno Analýza.
    this._analysisDialog?.close();
    this._analysisDialog = undefined;
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
    const a = this._config.ac_in;
    const acKey = `${a?.energy_to_charger ?? ''}|${a?.energy_passthrough ?? ''}|${a?.dc_current ?? ''}|${a?.dc_voltage ?? ''}`;
    if (acKey !== this._acInTodayKey) {
      this._acInTodayKey = acKey;
      void this._refreshAcInToday();
    }
  }

  /**
   * Dnešní energie ze sítě do nabíječe / průchodem: čítače MultiPlusu jsou
   * kumulativní, proto součet 5min statistik `change` od místní půlnoci.
   */
  private async _refreshAcInToday(): Promise<void> {
    const a = this._config?.ac_in;
    const ids = [a?.energy_to_charger, a?.energy_passthrough].filter((x): x is string => !!x);
    const dcIds = a?.dc_current && a?.dc_voltage ? [a.dc_current, a.dc_voltage] : [];
    const powerIds = [...dcIds, a?.power].filter((x): x is string => !!x);
    if (!this.hass || (!ids.length && !dcIds.length)) {
      this._acInToday = null;
      return;
    }
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    try {
      const [rows, power] = await Promise.all([
        fetchStats(this.hass, ids, midnight.getTime(), Date.now(), '5minute', ['change']),
        fetchStats(this.hass, powerIds, midnight.getTime(), Date.now(), '5minute', ['mean']),
      ]);
      const sum = (id?: string) =>
        id && rows.has(id) ? rows.get(id)!.reduce((s, r) => s + Math.max(0, r.change ?? 0), 0) : null;
      // Do baterie: DC výstup nabíječe = proud × napětí MultiPlusu (+ = do baterie), jen při
      // běžícím AC IN; FV nabíjí přes MPPT zvlášť.
      const acMean = new Map((a?.power ? power.get(a.power) ?? [] : []).map((r) => [r.start, r.mean ?? 0]));
      const iRows = dcIds.length ? power.get(dcIds[0]) : undefined;
      const uMean = new Map((dcIds.length ? power.get(dcIds[1]) ?? [] : []).map((r) => [r.start, r.mean]));
      const battery = iRows
        ? iRows.reduce((s, r) => {
            const u = uMean.get(r.start);
            const on = !a?.power || (acMean.get(r.start) ?? 0) > 50;
            if (!on || u == null) return s;
            return s + (Math.max(0, (r.mean ?? 0) * u) * (r.end - r.start)) / 3600000 / 1000;
          }, 0)
        : null;
      this._acInToday = { charger: sum(a?.energy_to_charger), pass: sum(a?.energy_passthrough), battery };
    } catch {
      this._acInToday = null;
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
        energy_today: 'sensor.dum_spotreba_dnes',
        energy_yesterday: 'sensor.dum_spotreba_vcera',
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
        total_day3: 'sensor.solcast_pv_forecast_forecast_day_3',
        total_day4: 'sensor.solcast_pv_forecast_forecast_day_4',
        total_day5: 'sensor.solcast_pv_forecast_forecast_day_5',
        total_day6: 'sensor.solcast_pv_forecast_forecast_day_6',
        total_day7: 'sensor.solcast_pv_forecast_forecast_day_7',
      },
      forecast: {
        min_soc_pct: 10,
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
    if (!this.hass || !series.length || this._historyOpening) return;
    this._historyOpening = true;
    try {
      const opened = await openHistoryDialog({
        hass: this.hass,
        title,
        series,
        spanOffset,
        rangeLabel,
      });
      if (!opened) moreInfo(this, series[0].entity);
    } finally {
      this._historyOpening = false;
    }
  }

  /** Guard proti dvojímu otevření grafu (čekání na apexcharts až 1,5 s). */
  private _historyOpening = false;

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

    // Predikce pokrývá celé okno grafu, pro které jsou data: detailedForecast
    // má dnešek od půlnoci + zítřek, takže jde porovnat i uplynulé hodiny dneška.
    const dataGenerator = `
      const entityIds = ${JSON.stringify(forecastEntities)};
      const now = Date.now();
      const windowStart = now - 24 * 60 * 60 * 1000;
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
          timestamp >= windowStart &&
          timestamp <= forecastEnd &&
          Number.isFinite(watts)
        )
        .sort((a, b) => a[0] - b[0]);
    `;

    // Skutečnost = reálná výroba FVE; bez ní aspoň historie Solcast power_now.
    const actualEntity = this._config?.pv?.power || solcast.power_now;
    void this._openHistory(
      [
        {
          entity: actualEntity,
          name: this._config?.pv?.power ? 'Skutečnost' : 'Solcast (historie)',
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

    if (f.island_power) {
      series.push({ entity: f.island_power, name: f.island_name || 'FVE', color: C.island });
    }
    if (f.grid_power) {
      series.push({ entity: f.grid_power, name: 'Síť', color: C.grid });
    } else {
      phases.forEach((phase) => {
        if (!phase.entity) return;
        series.push({
          entity: phase.entity,
          name: phase.name || phase.label,
          color: PHASE_STYLE[phase.label]?.color ?? C.grid,
        });
      });
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

  /** Fáze patra rozbalené z ploché konfigurace (včetně neaktivních placeholderů). */
  private _phases(f: FloorConfig): PhaseSpec[] {
    const out: PhaseSpec[] = [];
    const defs: Array<
      [string | undefined, string | undefined, string | undefined, boolean | undefined, string]
    > = [
      [f.phase_a_entity, f.phase_a_name, f.phase_a_icon, f.phase_a_show, 'L1'],
      [f.phase_b_entity, f.phase_b_name, f.phase_b_icon, f.phase_b_show, 'L2'],
      [f.phase_c_entity, f.phase_c_name, f.phase_c_icon, f.phase_c_show, 'L3'],
    ];
    // Fáze, přes kterou je napájený AC IN měniče: jeho příkon se od ní odečte.
    const a = this._config?.ac_in;
    const acInPhase = a?.floor && a.floor === f.name ? ({ a: 'L1', b: 'L2', c: 'L3' } as const)[a.phase ?? 'c'] : null;
    const acInW = acInPhase && hasNum(this.hass, a?.power) ? Math.max(0, toNum(this.hass, a!.power)) : 0;
    for (const [entity, name, icon, show, label] of defs) {
      if (entity || show) {
        out.push({
          entity: entity || undefined,
          name: name || label,
          icon: icon || 'mdi:flash',
          label,
          ...(label === acInPhase && acInW > 0 ? { subtractW: acInW } : {}),
        });
      }
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

  private _analysisDialog?: FveFlowAnalysisDialog;

  private _openAnalysis(): void {
    if (!this.hass || !this._config || this._analysisDialog?.isConnected) return;
    this._analysisDialog = openAnalysisDialog({
      getHass: () => this.hass,
      config: this._config,
      getCapacityKwh: () => this._batteryCapacityKwh(),
    });
  }

  /** Tlačítko Analýza nad ZPĚT — stejný skleněný panel, ikona grafu. */
  private _analysisButton(r: Rect): TemplateResult {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    return svg`
      <g class="analysis-btn" @click=${(e: Event) => {
        e.stopPropagation();
        this._openAnalysis();
      }}>
        <title>Analýza energie — patra, zdroje, predikce, baterie</title>
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="14"
          fill="rgba(14, 24, 34, 0.72)"
          stroke="rgba(148,170,190,0.4)" stroke-width="1.5"/>
        ${iconChart(cx - 64, cy - 15, 30, C.grid)}
        <text class="back-label" x="${cx - 24}" y="${cy + 5}">ANALÝZA</text>
      </g>
    `;
  }

  /** Navigace tlačítkem ZPĚT — prázdná cesta = výchozí dashboard. */
  private _navigateBack(): void {
    const path = this._config?.back_button?.path?.trim() || '/';
    window.history.pushState(null, '', path);
    window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
  }

  /**
   * Kapacita baterie v kWh. Ah se přepočte přes jmenovité napětí
   * (battery.nominal_voltage, default 48 V) — ne přes aktuální napětí,
   * jinak by kapacita „dýchala“ s nabitím (49–53 V ≈ ±5 %).
   */
  private _batteryCapacityKwh(): number {
    const b = this._config?.battery;
    if (!b?.capacity || !hasNum(this.hass, b.capacity)) return 0;
    const st = this.hass!.states[b.capacity];
    const unit = st?.attributes.unit_of_measurement as string | undefined;
    return capacityToKwh(toNum(this.hass, b.capacity), unit, b.nominal_voltage ?? 48);
  }

  /** Entity integrace Hybrid Energy, která počítá prognózu a plán nabíjení (null = není). */
  private _planner(): PlannerEntities | null {
    return findPlanner(this.hass);
  }

  /**
   * Blok „Nabíjení ze sítě“ pod baterií (integrace Hybrid Energy): stav plánovače,
   * plán na příští noc a jedno tlačítko Nabít teď ↔ Vypnout nabíjení. Automat (stínový /
   * ostrý režim) se přepíná jen v integraci, ať se omylem nevypne z dashboardu.
   */
  private _chargeBlock(r: Rect): TemplateResult | typeof nothing {
    const p = this._planner();
    const hass = this.hass;
    if (!p || !hass) return nothing;
    const status = p.status ? hass.states[p.status]?.state : undefined;
    const charging = (p.charging ? hass.states[p.charging]?.state === 'on' : false) || status === 'charging' || status === 'manual';
    const plan = p.plan ? hass.states[p.plan] : undefined;
    const kwh = plan ? Number(plan.state) : NaN;
    const windows = (plan?.attributes.windows as Array<{ start: string; end: string }> | undefined) ?? [];
    const hm = (iso: string) => new Date(iso).toLocaleTimeString('cs-CZ', { hour: 'numeric', minute: '2-digit' });
    const STATUS: Record<string, string> = {
      shadow: 'Stínový režim',
      idle: 'Bez plánu',
      planned: 'Naplánováno',
      charging: 'Nabíjí podle plánu',
      manual: 'Ruční nabíjení',
      external: 'Zapnuto mimo plánovač',
      skipped: 'Dnes v noci ne',
    };
    // Jako ostatní panely: vlastní barva (síť), rozsvítí se jen při nabíjení.
    const accent = C.grid;
    const acInW = hasNum(hass, this._config?.ac_in?.power) ? Math.max(0, toNum(hass, this._config!.ac_in!.power)) : 0;
    const planText =
      Number.isFinite(kwh) && kwh > 0 && windows.length
        ? `Noc: ${formatEnergy(kwh)} · ${hm(windows[0].start)}–${hm(windows[windows.length - 1].end)}`
        : Number.isFinite(kwh)
          ? 'Noc: ze sítě nenabíjí'
          : 'Plán se počítá…';
    const press = (entityId?: string) => (e: Event) => {
      e.stopPropagation();
      if (entityId) void hass.callService?.('button', 'press', { entity_id: entityId });
    };
    const bw = r.w - 40;
    const by = r.y + r.h - 44;
    const btn = (x: number, label: string, on: boolean, color: string, onClick: (e: Event) => void) => svg`
      <g class="ctrl-chip" @click=${onClick}>
        <rect x="${x}" y="${by}" width="${bw}" height="28" rx="9" fill="rgba(255,255,255,0.05)"
          stroke="${color}" stroke-opacity="${on ? 0.8 : 0.45}" stroke-width="1"
          style="${on ? `filter: drop-shadow(0 0 6px ${color}60)` : ''}"/>
        <text class="ctrl-label" x="${x + bw / 2}" y="${by + 18.5}" text-anchor="middle"
          style="fill: ${on ? '#e6f4fa' : 'rgba(226,240,248,0.75)'}">${label}</text>
      </g>`;
    return svg`
      ${this._panel(r, accent, charging)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">Nabíjení ze sítě</text>
      ${iconPylon(r.x + 20, r.y + 44, 44, charging ? C.grid : 'rgba(148,170,190,0.55)')}
      <text class="medium" x="${r.x + 80}" y="${r.y + 66}" style="fill: ${charging ? C.grid : '#e6f4fa'}">
        ${status ? STATUS[status] ?? status : '—'}
      </text>
      <text class="small" x="${r.x + 80}" y="${r.y + 90}">${planText}</text>
      ${this._config?.ac_in?.power
        ? svg`<text class="small" x="${r.x + 80}" y="${r.y + 114}">
            Příkon ze sítě <tspan class="strong" style="fill: ${acInW > 0 ? C.grid : '#e6f4fa'}">${formatPower(acInW)}</tspan>
          </text>`
        : nothing}
      ${this._acInToday && (this._acInToday.charger != null || this._acInToday.battery != null)
        ? svg`<text class="tiny" x="${r.x + 20}" y="${r.y + 136}">
            Dnes do nabíječe <tspan class="strong">${formatEnergy(this._acInToday.charger ?? 0)}</tspan>${this._acInToday.battery != null
              ? svg`, do baterie <tspan class="strong" style="fill: ${C.grid}">${formatEnergy(this._acInToday.battery)}</tspan>`
              : nothing}
          </text>`
        : nothing}
      ${this._acInToday?.pass != null
        ? svg`<text class="tiny" x="${r.x + 20}" y="${r.y + 155}">
            Průchod ze sítě do domu <tspan class="strong">${formatEnergy(this._acInToday.pass)}</tspan>
          </text>`
        : nothing}
      ${charging
        ? btn(r.x + 20, 'Vypnout nabíjení', true, C.grid, press(p.stopCharging))
        : btn(r.x + 20, 'Nabít teď', false, C.grid, press(p.chargeNow))}
    `;
  }

  /** Okno prognózy: data a ovládání z integrace Hybrid Energy. */
  private _openBatteryForecast(): void {
    const planner = this._planner();
    if (!planner) return;
    openForecastDialog({ getHass: () => this.hass, planner });
  }

  /**
   * Tlačítko Prognóza nad Analýzou — jen když je nastavená integrace Hybrid
   * Energy. Dokud nemá spočítanou prognózu, je ztlumené s vysvětlením.
   */
  private _forecastButton(r: Rect): TemplateResult {
    const planner = this._planner();
    const ready = !!planner && Array.isArray(this.hass?.states[planner.forecast]?.attributes.days);
    const reason = ready ? null : 'Integrace Hybrid Energy zatím prognózu nespočítala';
    const enabled = !reason;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const color = enabled ? C.warn : 'rgba(148,170,190,0.5)';
    return svg`
      <g class="forecast-btn${enabled ? '' : ' disabled'}" @click=${(e: Event) => {
        e.stopPropagation();
        if (enabled) void this._openBatteryForecast();
      }}>
        <title>${reason ?? 'Prognóza výdrže baterie a plán nabíjení ze sítě'}</title>
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="14"
          fill="rgba(14, 24, 34, 0.72)"
          stroke="rgba(148,170,190,0.4)" stroke-width="1.5"/>
        ${iconForecast(cx - 64, cy - 15, 30, color)}
        <text class="back-label" x="${cx - 24}" y="${reason ? cy - 2 : cy + 5}"
          style="${enabled ? '' : 'fill: rgba(226,240,248,0.45)'}">PROGNÓZA</text>
        ${reason
          ? svg`<text class="tiny" x="${cx}" y="${r.y + r.h - 9}" text-anchor="middle">${reason}</text>`
          : nothing}
      </g>`;
  }

  /**
   * Tlačítko ZPĚT pod měničem — stejný skleněný panel jako uzly,
   * šedý okraj, červený čtverec a bílý popisek (dle mockupu).
   */
  private _backButton(r: Rect): TemplateResult {
    const cx = r.x + r.w / 2;
    const square = 30;
    // Ikona a popisek vycentrované ve svislé ose tlačítka.
    const squareY = r.y + r.h / 2 - 28;
    const labelY = r.y + r.h / 2 + 24;
    return svg`
      <g class="back-btn" @click=${(e: Event) => {
        e.stopPropagation();
        this._navigateBack();
      }}>
        <title>Zpět</title>
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="14"
          fill="rgba(14, 24, 34, 0.72)"
          stroke="rgba(148,170,190,0.4)" stroke-width="1.5"/>
        <rect x="${cx - square / 2}" y="${squareY}" width="${square}" height="${square}"
          fill="none" stroke="${C.crit}" stroke-width="2.5" rx="2"/>
        <text class="back-label" x="${cx}" y="${labelY}" text-anchor="middle">ZPĚT</text>
      </g>
    `;
  }

  /** Má patro nakonfigurovanou gridovou větev (celkový výkon nebo entitu fáze)? */
  private _floorHasGrid(f: FloorConfig): boolean {
    return !!(f.grid_power || this._phases(f).some((p) => p.entity));
  }

  /** Má patro aspoň jednu číselnou gridovou hodnotu (celek nebo fáze)? */
  private _floorGridKnown(f: FloorConfig): boolean {
    return (
      hasNum(this.hass, f.grid_power) || this._phases(f).some((p) => hasNum(this.hass, p.entity))
    );
  }

  /** Odběr patra ze sítě bez AC IN měniče, který je napájený přes toto patro. */
  private _floorGridPower(f: FloorConfig): number {
    const a = this._config?.ac_in;
    const acInW = a?.floor && a.floor === f.name && hasNum(this.hass, a.power) ? Math.max(0, toNum(this.hass, a.power)) : 0;
    if (f.grid_power && hasNum(this.hass, f.grid_power)) return Math.max(0, toNum(this.hass, f.grid_power) - acInW);
    return this._phases(f).reduce(
      (sum, p) => sum + Math.max(0, Math.abs(toNum(this.hass, p.entity)) - (p.subtractW ?? 0)),
      0,
    );
  }

  protected render(): TemplateResult {
    const cfg = this._config;
    if (!cfg) return html``;
    if (!this.hass) return html`<ha-card></ha-card>`;

    const floors = cfg.floors ?? [];
    const buttons = {
      backButton: !!cfg.back_button?.enabled,
      analysisButton: cfg.analysis?.enabled !== false,
      forecastButton: !!this._planner(),
      chargeBlock: !!this._planner(),
      // Řádky kritických zátěží a AC IN by jinak narážely do tlačítka chlazení.
      inverterExtraRows: cfg.inverter?.fan_switch
        ? [cfg.inverter.load_power, cfg.ac_in?.power || cfg.ac_in?.active_input].filter(Boolean).length
        : 0,
    };
    const layout = this._narrow
      ? computeMobileLayout(Math.max(1, floors.length), buttons)
      : computeLayout(Math.max(1, floors.length), buttons);
    const base = this._flowBase();

    const pvP = toNum(this.hass, cfg.pv?.power);
    const rawBatP = toNum(this.hass, cfg.battery?.power);
    const batP = cfg.battery?.invert ? -rawBatP : rawBatP; // kladné = nabíjení
    const acIn = this._acIn();
    const charging = batP >= base.deadband;
    const discharging = batP <= -base.deadband;
    const islandTotal = hasNum(this.hass, cfg.inverter?.load_power)
      ? toNum(this.hass, cfg.inverter?.load_power)
      : toNum(this.hass, cfg.inverter?.power);
    const gridTotal = hasNum(this.hass, cfg.grid?.power)
      ? toNum(this.hass, cfg.grid?.power)
      : floors.reduce((s, f) => s + this._floorGridPower(f), 0);
    const gridKnown =
      hasNum(this.hass, cfg.grid?.power) || floors.some((f) => this._floorGridKnown(f));

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
            // Při nabíjení ze sítě (AC IN) je tok do baterie v barvě sítě, ne FV.
            color: charging ? (acIn.active ? C.grid : C.charge) : C.discharge,
            reverse: charging,
            hidden: !cfg.battery?.power,
          })}
          ${layout.paths.gridAcIn && cfg.ac_in?.power
            ? flow('grid-acin', layout.paths.gridAcIn, {
                power: acIn.active ? acIn.power : 0,
                color: C.grid,
              })
            : nothing}
          ${layout.paths.islandTaps.map((d, i) => {
            // Layout drží min. 1 slot patra — bez nakonfigurovaného patra žádný tok.
            const f = floors[i];
            if (!f) return nothing;
            const p = f.island_power && hasNum(this.hass, f.island_power)
              ? toNum(this.hass, f.island_power)
              : islandTotal;
            return flow(`island-${i}`, d, {
              power: p,
              color: C.island,
              dotColor: FLOOR_DOTS.island[i % FLOOR_DOTS.island.length],
            });
          })}
          ${layout.paths.gridTaps.map((d, i) => {
            // Patro bez gridové větve (jen FVE) nemá spoj ze sítě; trunk tak
            // končí u posledního patra, které síť opravdu má.
            const f = floors[i];
            if (!f || !this._floorHasGrid(f)) return nothing;
            return flow(`grid-${i}`, d, {
              power: this._floorGridPower(f),
              color: C.grid,
              dotColor: FLOOR_DOTS.grid[i % FLOOR_DOTS.grid.length],
            });
          })}

          <!-- Uzly -->
          ${this._nodePv(layout.pv)}
          ${this._nodeMppt(layout.mppt)}
          ${this._nodeBattery(layout.battery, batP, charging, discharging, acIn.active)}
          ${this._nodeInverter(layout.inverter, islandTotal, acIn)}
          ${layout.forecastButton ? this._forecastButton(layout.forecastButton) : nothing}
          ${layout.chargeBlock ? this._chargeBlock(layout.chargeBlock) : nothing}
          ${layout.analysisButton ? this._analysisButton(layout.analysisButton) : nothing}
          ${layout.backButton ? this._backButton(layout.backButton) : nothing}
          ${this._nodeSolcast(layout.solcast)}
          ${this._nodeGrid(layout.grid, gridTotal, gridKnown)}
          ${layout.floors.map((r, i) => (floors[i] ? this._nodeFloor(r, floors[i]) : nothing))}
          ${layout.floors.map((r, i) => {
            // Okraj patra jemně zapulzuje barvou tečky, která do něj právě dorazila.
            const f = floors[i];
            if (!f) return nothing;
            const islandP = f.island_power && hasNum(this.hass, f.island_power) ? toNum(this.hass, f.island_power) : islandTotal;
            return svg`
              ${this._arrivalPulse(r, islandP, FLOOR_DOTS.island[i % FLOOR_DOTS.island.length])}
              ${this._floorHasGrid(f)
                ? this._arrivalPulse(r, this._floorGridPower(f), FLOOR_DOTS.grid[i % FLOOR_DOTS.grid.length])
                : nothing}`;
          })}
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

  /**
   * Jemný puls okraje patra v barvě tečky ve chvíli, kdy tečka dorazí.
   * Tečka 0 doběhne na konec cesty v násobcích `dur` (SMIL časová osa dokumentu),
   * puls běží na začátku cyklu T = k × dur — nejvýš zhruba jednou za 5 s.
   */
  private _arrivalPulse(r: Rect, power: number, color: string): TemplateResult | typeof nothing {
    const base = this._flowBase();
    if (!base.animate || Math.abs(power) < base.deadband) return nothing;
    const dur = flowDuration(Math.abs(power), base.maxPower, base.minDuration, base.maxDuration);
    const period = dur * Math.max(1, Math.ceil(5 / dur));
    // Jeden pomalý, jemný záblesk: náběh 0,6 s, dozvuk 0,9 s.
    const marks = [0, 0.6, 1.5].map((t) => (t / period).toFixed(4));
    return svg`
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="18" fill="none"
        stroke="${color}" stroke-width="2" stroke-opacity="0" pointer-events="none"
        style="filter: drop-shadow(0 0 6px ${color})">
        <animate attributeName="stroke-opacity" values="0;0.65;0;0"
          keyTimes="${marks.join(';')};1" dur="${period}s" begin="0s" repeatCount="indefinite"/>
      </rect>`;
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
  private _hit(
    r: Rect,
    onClick?: () => void,
    title = 'Zobrazit graf za 48 hodin',
  ): TemplateResult | typeof nothing {
    if (!onClick) return nothing;
    return svg`
      <rect class="hit" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="18"
        fill="transparent" @click=${onClick}>
        <title>${title}</title>
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
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${formatPowerEntity(this.hass, pv.power)}</text>
      ${sev ? this._bar(r, p, pv.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="small" x="${r.x + 90}" y="${r.y + 112}">
        Dnes <tspan class="strong">${formatEnergyEntity(this.hass, pv.energy_today)}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 134}">
        Špička dnes <tspan class="strong">${formatPowerEntity(this.hass, pv.max_power_today)}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 156}">
        Celkem <tspan class="strong">${formatEnergyEntity(this.hass, pv.energy_total)}</tspan>
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
    const isOff = rawState === 'off' || rawState === 'vypnuto';
    const active =
      !!rawState && !['off', 'vypnuto', 'unknown', 'unavailable'].includes(rawState);
    // Stejná červená jako u FVE panelů pod prahem (0 W) — zelená jen když MPPT běží.
    const accent = isOff ? C.crit : C.solar;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${pv.mppt_name || 'MPPT regulátor'}</text>
      ${iconMppt(r.x + 18, r.y + 44, 48, active ? accent : 'rgba(148,170,190,0.5)')}
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
          ? () => moreInfo(this, pv.mppt_state || pv.voltage)
          : undefined,
        'Zobrazit detail a historii',
      )}
      ${pv.mppt_switch
        ? this._controlChip(
            r.x + r.w - 110,
            r.y + r.h - 42,
            pv.mppt_switch,
            pv.mppt_name || 'MPPT regulátor',
            iconPower,
            () => void this._toggleSwitchConfirmed(pv.mppt_switch!, pv.mppt_name || 'MPPT regulátor'),
          )
        : nothing}
    `;
  }

  private _nodeBattery(
    r: Rect,
    batP: number,
    charging: boolean,
    discharging: boolean,
    fromGrid = false,
  ): TemplateResult {
    const b = this._config?.battery ?? {};
    const soc = toNum(this.hass, b.soc, 0);
    // Nedostupné SoC nesmí vypadat jako prázdná červená baterie — neutrální šedá.
    const socKnown = hasNum(this.hass, b.soc);
    // Prahy konfigurovatelné, default žlutá od 15 %, zelená od 40 %.
    const socColor = socKnown
      ? severityColor(soc, {
          yellow_from: b.yellow_from ?? 15,
          green_from: b.green_from ?? 40,
          severity_invert: b.severity_invert,
        })!
      : NEUTRAL;
    // Nabíjení ze sítě (AC IN) v barvě sítě, ať je vidět, že nejde o FV.
    const stateText = charging
      ? `▲ ${fromGrid ? 'ze sítě' : 'nabíjení'} ${formatPower(Math.abs(batP))}`
      : discharging
        ? `▼ vybíjení ${formatPower(Math.abs(batP))}`
        : '● klidový stav';
    const stateColor = charging ? (fromGrid ? C.grid : C.charge) : discharging ? C.discharge : 'rgba(220,235,245,0.55)';
    return svg`
      ${this._panel(r, socColor, socKnown)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${b.name || 'Baterie Pylontech'}</text>
      ${this._sparklineNode(b.soc, r, socColor)}
      ${iconBattery(r.x + 30, r.y + 62, 58, 168, soc, socColor)}
      <text class="tiny" x="${r.x + 59}" y="${r.y + 252}" text-anchor="middle">
        ${b.capacity ? formatState(this.hass, b.capacity) : ''}
      </text>
      <text class="big" x="${r.x + 118}" y="${r.y + 90}" style="fill: ${socColor}">${socKnown ? `${Math.round(soc)} %` : '—'}</text>
      <text class="medium" x="${r.x + 118}" y="${r.y + 122}" style="fill: ${stateColor}">${!b.power ? '' : hasNum(this.hass, b.power) ? stateText : '—'}</text>
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
      ${this._batteryEnergyBar(r, socKnown ? soc : null, socColor)}
      ${this._hit(
        r,
        b.soc
          ? () => this._openEntity(b.soc, `${b.name || 'Baterie Pylontech'} · SoC`, socColor)
          : undefined,
      )}
    `;
  }

  /**
   * Pruh energie dole v boxu baterie: nad ním aktuální energie (SoC × kapacita)
   * a celková kapacita v kWh, ryska na prahu prognózy (min_soc_pct).
   */
  private _batteryEnergyBar(r: Rect, soc: number | null, color: string): TemplateResult | typeof nothing {
    const cap = this._batteryCapacityKwh();
    if (cap <= 0) return nothing;
    const x = r.x + 20;
    const w = r.w - 40;
    const y = r.y + r.h - 24;
    const pct = soc == null ? 0 : Math.min(100, Math.max(0, soc));
    const minPct = plannerMinSoc(this.hass, this._planner()) ?? this._config?.forecast?.min_soc_pct ?? 10;
    return svg`
      <text class="small" x="${x}" y="${y - 9}">
        V baterii <tspan class="strong" style="fill: ${color}">${soc == null ? '—' : formatEnergy((cap * pct) / 100)}</tspan>
      </text>
      <text class="small" x="${x + w}" y="${y - 9}" text-anchor="end">
        z <tspan class="strong">${formatEnergy(cap)}</tspan>
      </text>
      <rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="rgba(148,170,190,0.16)"/>
      ${pct > 0
        ? svg`<rect x="${x}" y="${y}" width="${Math.max(8, (w * pct) / 100)}" height="8" rx="4" fill="${color}"
            style="filter: drop-shadow(0 0 4px ${color}80)"/>`
        : nothing}
      <line x1="${x + (w * minPct) / 100}" x2="${x + (w * minPct) / 100}" y1="${y - 2}" y2="${y + 10}"
        stroke="rgba(226,240,248,0.55)" stroke-width="1.5">
        <title>Práh prognózy ${minPct} %</title>
      </line>`;
  }

  /**
   * AC IN Victronu: aktivní, když má příkon nad deadband nebo GX hlásí vstup `grid`.
   * Nabíjení baterie ze sítě = DC proud × napětí měniče (jinak výkon měniče) během AC IN.
   */
  private _acIn(): { active: boolean; power: number; chargeW: number | null; state: string | null } {
    const a = this._config?.ac_in;
    if (!a?.power && !a?.active_input) return { active: false, power: 0, chargeW: null, state: null };
    const power = hasNum(this.hass, a.power) ? toNum(this.hass, a.power) : 0;
    const input = a.active_input ? this.hass?.states[a.active_input]?.state : undefined;
    const active = power >= this._flowBase().deadband || input === 'grid';
    const chargeW =
      hasNum(this.hass, a.dc_current) && hasNum(this.hass, a.dc_voltage)
        ? Math.max(0, toNum(this.hass, a.dc_current) * toNum(this.hass, a.dc_voltage))
        : hasNum(this.hass, a.dc_power)
          ? Math.max(0, toNum(this.hass, a.dc_power))
          : null;
    const state = a.state ? formatState(this.hass, a.state) : null;
    return { active, power, chargeW, state: state && state !== '—' ? state : null };
  }

  private _nodeInverter(
    r: Rect,
    islandTotal: number,
    acIn: { active: boolean; power: number; chargeW: number | null; state: string | null },
  ): TemplateResult {
    const inv = this._config?.inverter ?? {};
    const p = hasNum(this.hass, inv.power) ? toNum(this.hass, inv.power) : islandTotal;
    const pKnown = hasNum(this.hass, inv.power) || hasNum(this.hass, inv.load_power);
    const state = formatState(this.hass, inv.state);
    const active = Math.abs(p) >= this._flowBase().deadband || state !== '—';
    const sev = severityColor(p, inv);
    const accent = sev ?? C.island;
    return svg`
      ${this._panel(r, accent, active)}
      <text class="node-title" x="${r.x + 20}" y="${r.y + 28}">${inv.name || 'Měnič MultiPlus-II'}</text>
      ${this._sparklineNode(inv.power, r, accent)}
      ${iconInverter(r.x + 18, r.y + 46, 56, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="big" x="${r.x + 90}" y="${r.y + 84}" style="fill: ${accent}">${pKnown ? formatPower(p) : '—'}</text>
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
      ${inv.energy_today
        ? svg`<text class="small" x="${r.x + 90}" y="${r.y + 182}">
            Energie dnes <tspan class="strong">${formatEnergyEntity(this.hass, inv.energy_today)}</tspan>
          </text>`
        : nothing}
      ${inv.load_power
        ? svg`<text class="tiny" x="${r.x + 90}" y="${r.y + (inv.energy_today ? 204 : 184)}">
            Kritické zátěže ${formatPowerEntity(this.hass, inv.load_power)}
          </text>`
        : nothing}
      ${acIn.active
        ? svg`<text class="tiny" x="${r.x + 90}" y="${r.y + (inv.load_power ? 224 : 204)}" style="fill: ${C.grid}">
            AC IN <tspan class="strong" style="fill: ${C.grid}">${formatPower(acIn.power)}</tspan>${acIn.chargeW
              ? ` · nabíjí ${formatPower(acIn.chargeW)}`
              : ''}
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
          ? () => this._openEntity(inv.power || inv.load_power, inv.name || 'Měnič MultiPlus-II', accent)
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
        ${formatPowerEntity(this.hass, s.power_now)}
      </text>
      ${sev ? this._bar(r, p, s.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="small" x="${r.x + 90}" y="${r.y + 112}">
        Zbývá dnes <tspan class="strong">${formatEnergyEntity(this.hass, s.remaining_today)}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 134}">
        Dnes celkem <tspan class="strong">${formatEnergyEntity(this.hass, s.total_today)}</tspan>
      </text>
      <text class="small" x="${r.x + 90}" y="${r.y + 156}">
        Zítra celkem <tspan class="strong">${formatEnergyEntity(this.hass, s.total_tomorrow)}</tspan>
      </text>
      ${this._hit(
        r,
        s.power_now ? () => this._openSolcastHistory(s) : undefined,
        'Zobrazit 24 h historie a 24 h predikce',
      )}
    `;
  }

  private _nodeGrid(r: Rect, gridTotal: number, gridKnown: boolean): TemplateResult {
    const g = this._config?.grid ?? {};
    const energyParts = [
      g.energy_total ? `Celkem ze sítě ${formatEnergyEntity(this.hass, g.energy_total)}` : '',
      g.energy_today ? `dnes ${formatEnergyEntity(this.hass, g.energy_today)}` : '',
    ].filter(Boolean);
    const active = Math.abs(gridTotal) >= this._flowBase().deadband;
    const phaseSpecs = this._gridPhases(g);
    const sev = severityColor(gridTotal, g);
    const accent = sev ?? C.grid;
    return svg`
      ${this._panel(r, accent, active)}
      ${this._sparklineNode(g.power, r, accent)}
      ${iconPylon(r.x + 16, r.y + 28, 52, active ? accent : 'rgba(148,170,190,0.5)')}
      <text class="node-title" x="${r.x + r.w - 20}" y="${r.y + 24}" text-anchor="end">${g.name || 'Síť ČEZ'}</text>
      <text class="big" x="${r.x + 90}" y="${r.y + 64}" style="fill: ${accent}">${gridKnown ? formatPower(gridTotal) : '—'}</text>
      ${sev ? this._bar(r, gridTotal, g.bar_max ?? this._flowBase().maxPower, sev) : nothing}
      <text class="tiny" x="${r.x + 90}" y="${r.y + 80}">${energyParts.join(' · ')}</text>
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
    const hasGridSource = this._floorHasGrid(f);
    const active = Math.abs(gridP) >= this._flowBase().deadband || (hasIsland && Math.abs(islandP) >= this._flowBase().deadband);
    const accent = hasIsland && islandP > gridP ? C.island : C.grid;
    // FVE chip(y) vlevo (kudy vstupuje zelený tok z měniče), grid fáze
    // vpravo (kudy vstupuje modrý tok ze sítě). Připraveno i na 3f FVE.
    // Vlastní název z nastavení platí jen pro chip; popisky „FVE / síť"
    // a řádek energie zůstávají se statickým „FVE".
    const fveChipName = f.island_name || 'FVE';
    const fveChips: PhaseSpec[] = hasIsland
      ? [{ entity: f.island_power!, name: fveChipName, icon: 'mdi:solar-power', label: 'FVE' }]
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
    const fveStyle = {
      icon: iconSun,
      iconColor: C.island,
      borderColor: 'rgba(0,230,118,0.22)',
      valueColor: C.island,
    };
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

    let energyLine = '';
    if (f.grid_energy && f.island_energy) {
      energyLine = `Celkem z FVE ${formatEnergyEntity(this.hass, f.island_energy)} · ze sítě ${formatEnergyEntity(this.hass, f.grid_energy)}`;
    } else if (f.island_energy) {
      energyLine = `Celkem z FVE ${formatEnergyEntity(this.hass, f.island_energy)}`;
    } else if (f.grid_energy) {
      energyLine = `Celkem ze sítě ${formatEnergyEntity(this.hass, f.grid_energy)}`;
    }

    const canOpenHistory = !!(f.grid_power || f.island_power || phases.some((p) => p.entity));

    return svg`
      ${this._panel(r, accent, active)}
      ${iconHome(r.x + 16, r.y + 12, 30, accent)}
      <text class="floor-name" x="${r.x + 54}" y="${r.y + 34}">${f.name ?? 'Patro'}</text>
      ${hasGridSource || hasIsland
        ? svg`
          <text class="floor-val" x="${r.x + r.w - 20}" y="${r.y + 32}" text-anchor="end">
            ${hasIsland
              ? svg`<tspan class="dim">FVE </tspan><tspan class="val-island strong">${formatPower(islandP)}</tspan>`
              : nothing}
            ${hasGridSource && hasIsland ? svg`<tspan class="dim"> · </tspan>` : nothing}
            ${hasGridSource
              ? svg`<tspan class="dim">síť </tspan><tspan class="val-grid strong">${this._floorGridKnown(f) ? formatPower(gridP) : '—'}</tspan>`
              : nothing}
          </text>
        `
        : nothing}
      ${energyLine
        ? svg`<text class="tiny" x="${r.x + 54}" y="${r.y + 56}">${energyLine}</text>`
        : nothing}
      ${this._hit(
        { x: r.x, y: r.y, w: r.w, h: 64 },
        canOpenHistory ? () => this._openFloorHistory(f, phases) : undefined,
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
    .phase-chip.inactive {
      cursor: default;
      pointer-events: none;
    }
    .phase-chip rect {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .phase-chip:hover rect {
      fill: rgba(255, 255, 255, 0.09);
      stroke: rgba(79, 195, 247, 0.55);
    }
    .phase-chip.inactive:hover rect {
      fill: rgba(255, 255, 255, 0.045);
      stroke: inherit;
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
    .forecast-btn.disabled {
      cursor: not-allowed;
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
    .back-btn,
    .analysis-btn,
    .forecast-btn:not(.disabled) {
      cursor: pointer;
    }
    .back-btn > rect:first-of-type,
    .analysis-btn > rect:first-of-type,
    .forecast-btn > rect:first-of-type {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .back-btn:hover > rect:first-of-type,
    .analysis-btn:hover > rect:first-of-type,
    .forecast-btn:not(.disabled):hover > rect:first-of-type {
      fill: rgba(255, 255, 255, 0.08);
      stroke: rgba(148, 170, 190, 0.65);
    }
    .back-label {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.18em;
      fill: rgba(226, 240, 248, 0.92);
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
  name: 'Hybrid Energy Flow Card',
  description:
    'Animovaný diagram toků energie pro hybridní instalaci: ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.',
  preview: false,
  documentationURL: 'https://github.com/elvisek2020/fve-flow-card',
});
