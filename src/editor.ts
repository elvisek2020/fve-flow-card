import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorConfig, FveFlowCardConfig, HomeAssistant } from './types';
import { fireEvent } from './utils';

const ENTITY = { entity: { domain: 'sensor' } };
const TEXT = { text: {} };
const ICON = { icon: {} };
const BOOL = { boolean: {} };
const numBox = (min: number, max: number, step = 1) => ({
  number: { min, max, step, mode: 'box' as const },
});

/** Prahy semaforu (W varianty) — červená pod žlutou, zelená od green_from. */
const SEVERITY_W = [
  { name: 'yellow_from', selector: numBox(0, 20000, 50) },
  { name: 'green_from', selector: numBox(0, 20000, 50) },
  { name: 'bar_max', selector: numBox(100, 30000, 100) },
  { name: 'severity_invert', selector: BOOL },
];

/** Prahy semaforu pro baterii (%). */
const SEVERITY_PCT = [
  { name: 'yellow_from', selector: numBox(0, 100, 1) },
  { name: 'green_from', selector: numBox(0, 100, 1) },
];

/** Schéma hlavního formuláře (vše kromě pater). */
const SCHEMA = [
  { name: 'title', selector: TEXT },
  {
    name: 'pv',
    type: 'expandable',
    icon: 'mdi:solar-power',
    schema: [
      { name: 'power', required: true, selector: ENTITY },
      { name: 'energy_today', selector: ENTITY },
      { name: 'energy_total', selector: ENTITY },
      { name: 'max_power_today', selector: ENTITY },
      { name: 'voltage', selector: ENTITY },
      { name: 'current', selector: ENTITY },
      { name: 'mppt_state', selector: ENTITY },
      ...SEVERITY_W,
    ],
  },
  {
    name: 'battery',
    type: 'expandable',
    icon: 'mdi:battery-high',
    schema: [
      { name: 'soc', required: true, selector: ENTITY },
      { name: 'power', selector: ENTITY },
      { name: 'voltage', selector: ENTITY },
      { name: 'current', selector: ENTITY },
      { name: 'temperature', selector: ENTITY },
      { name: 'soh', selector: ENTITY },
      { name: 'runtime', selector: ENTITY },
      { name: 'time_to_full', selector: ENTITY },
      { name: 'capacity', selector: ENTITY },
      { name: 'invert', selector: BOOL },
      ...SEVERITY_PCT,
    ],
  },
  {
    name: 'inverter',
    type: 'expandable',
    icon: 'mdi:sine-wave',
    schema: [
      { name: 'power', selector: ENTITY },
      { name: 'state', selector: ENTITY },
      { name: 'load_power', selector: ENTITY },
      { name: 'name', selector: TEXT },
      ...SEVERITY_W,
    ],
  },
  {
    name: 'grid',
    type: 'expandable',
    icon: 'mdi:transmission-tower',
    schema: [
      { name: 'power', selector: ENTITY },
      { name: 'phase_a', selector: ENTITY },
      { name: 'phase_b', selector: ENTITY },
      { name: 'phase_c', selector: ENTITY },
      { name: 'energy_total', selector: ENTITY },
      { name: 'energy_today', selector: ENTITY },
      { name: 'name', selector: TEXT },
      ...SEVERITY_W,
    ],
  },
  {
    name: 'solcast',
    type: 'expandable',
    icon: 'mdi:weather-sunny',
    schema: [
      { name: 'power_now', selector: ENTITY },
      { name: 'remaining_today', selector: ENTITY },
      { name: 'total_today', selector: ENTITY },
    ],
  },
  {
    name: 'options',
    type: 'expandable',
    icon: 'mdi:tune',
    schema: [
      { name: 'max_flow_w', selector: numBox(500, 20000, 100) },
      { name: 'deadband_w', selector: numBox(0, 500, 5) },
      { name: 'dots', selector: numBox(1, 8) },
      { name: 'min_duration', selector: numBox(0.5, 10, 0.1) },
      { name: 'max_duration', selector: numBox(1, 20, 0.5) },
      { name: 'animation', selector: BOOL },
    ],
  },
];

/** Schéma jednoho patra — ploché klíče, ať se data ukládají přímo do objektu patra. */
const FLOOR_SCHEMA = [
  { name: 'name', required: true, selector: TEXT },
  { name: 'grid_power', selector: ENTITY },
  { name: 'grid_energy', selector: ENTITY },
  { name: 'island_power', selector: ENTITY },
  { name: 'island_energy', selector: ENTITY },
  { name: 'phase_a_entity', selector: ENTITY },
  { name: 'phase_a_name', selector: TEXT },
  { name: 'phase_a_icon', selector: ICON },
  { name: 'phase_b_entity', selector: ENTITY },
  { name: 'phase_b_name', selector: TEXT },
  { name: 'phase_b_icon', selector: ICON },
  { name: 'phase_c_entity', selector: ENTITY },
  { name: 'phase_c_name', selector: TEXT },
  { name: 'phase_c_icon', selector: ICON },
];

const LABELS: Record<string, string> = {
  title: 'Titulek karty',
  pv: 'FVE / MPPT',
  battery: 'Baterie',
  inverter: 'Měnič (ostrov)',
  grid: 'Síť (grid)',
  solcast: 'Předpověď Solcast',
  options: 'Chování a animace',
  power: 'Výkon (W)',
  energy_today: 'Energie dnes (kWh)',
  energy_total: 'Energie celkem (kWh)',
  max_power_today: 'Maximální výkon dnes (W)',
  voltage: 'Napětí (V)',
  current: 'Proud (A)',
  mppt_state: 'Režim / stav MPPT',
  soc: 'Nabití SoC (%)',
  temperature: 'Teplota',
  soh: 'Zdraví SoH (%)',
  runtime: 'Odhadovaná výdrž',
  time_to_full: 'Doba do plného nabití',
  capacity: 'Instalovaná kapacita',
  invert: 'Obrátit znaménko výkonu baterie',
  state: 'Stav měniče',
  load_power: 'Ostrovní spotřeba — kritické zátěže (W)',
  name: 'Název',
  phase_a: 'Fáze L1',
  phase_b: 'Fáze L2',
  phase_c: 'Fáze L3',
  phase_a_entity: 'Entita výkonu L1 (W)',
  phase_a_name: 'Vlastní název L1 (např. Pračka)',
  phase_a_icon: 'Ikona L1',
  phase_b_entity: 'Entita výkonu L2 (W)',
  phase_b_name: 'Vlastní název L2 (např. Sušička)',
  phase_b_icon: 'Ikona L2',
  phase_c_entity: 'Entita výkonu L3 (W)',
  phase_c_name: 'Vlastní název L3 (např. Sporák)',
  phase_c_icon: 'Ikona L3',
  power_now: 'Predikovaný výkon teď (W)',
  remaining_today: 'Zbývá dnes (kWh)',
  total_today: 'Dnes celkem (kWh)',
  max_flow_w: 'Výkon pro plnou rychlost animace (W)',
  deadband_w: 'Mrtvá zóna linky (W)',
  dots: 'Počet teček na lince',
  min_duration: 'Nejrychlejší oběh (s)',
  max_duration: 'Nejpomalejší oběh (s)',
  animation: 'Animace zapnuté',
  yellow_from: 'Žlutá od hodnoty (pod ní červená)',
  green_from: 'Zelená od hodnoty',
  bar_max: 'Rozsah progress baru (max)',
  severity_invert: 'Obrátit barvy (vysoká hodnota = špatná)',
  grid_power: 'Výkon ze sítě (W) — nepovinné, jinak součet fází',
  grid_energy: 'Energie ze sítě (kWh)',
  island_power: 'Výkon z ostrova (W) — budoucí Shelly',
  island_energy: 'Energie z ostrova (kWh)',
};

@customElement('fve-flow-card-editor')
export class FveFlowCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: FveFlowCardConfig;

  public setConfig(config: FveFlowCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (schema: { name: string }): string =>
    LABELS[schema.name] ?? schema.name;

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;
    const floors = this._config.floors ?? [];
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._mainChanged}
      ></ha-form>

      <div class="floors-header">
        <span>Patra (${floors.length})</span>
        <button class="add" @click=${this._addFloor}>+ Přidat patro</button>
      </div>

      ${floors.map(
        (floor, idx) => html`
          <ha-expansion-panel outlined>
            <div slot="header" class="floor-header">
              <span>${floor.name || `Patro ${idx + 1}`}</span>
              <button
                class="remove"
                title="Odebrat patro"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._removeFloor(idx);
                }}
              >
                ✕
              </button>
            </div>
            <div class="floor-body">
              <ha-form
                .hass=${this.hass}
                .data=${floor}
                .schema=${FLOOR_SCHEMA}
                .computeLabel=${this._computeLabel}
                @value-changed=${(e: CustomEvent) => this._floorChanged(e, idx)}
              ></ha-form>
            </div>
          </ha-expansion-panel>
        `,
      )}
      ${!floors.length
        ? html`<div class="hint">
            Zatím žádná patra — přidej první přes tlačítko výše. Každé patro může mít grid větev
            (Shelly *-GRID-AC-OUT), ostrovní větev (budoucí Shelly na FVE straně) a pojmenované fáze.
          </div>`
        : nothing}
    `;
  }

  private _mainChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = ev.detail.value as FveFlowCardConfig;
    this._emit({ ...value, floors: this._config?.floors ?? [] });
  }

  private _floorChanged(ev: CustomEvent, idx: number): void {
    ev.stopPropagation();
    const floors = [...(this._config?.floors ?? [])];
    floors[idx] = ev.detail.value as FloorConfig;
    this._emit({ ...(this._config as FveFlowCardConfig), floors });
  }

  private _addFloor(): void {
    const floors = [...(this._config?.floors ?? []), { name: `Patro ${(this._config?.floors?.length ?? 0) + 1}` }];
    this._emit({ ...(this._config as FveFlowCardConfig), floors });
  }

  private _removeFloor(idx: number): void {
    const floors = (this._config?.floors ?? []).filter((_, i) => i !== idx);
    this._emit({ ...(this._config as FveFlowCardConfig), floors });
  }

  private _emit(config: FveFlowCardConfig): void {
    this._config = config;
    fireEvent(this, 'config-changed', { config });
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-form {
      display: block;
      margin-bottom: 16px;
    }
    .floors-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0 12px;
      font-weight: 600;
    }
    .floors-header .add {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    ha-expansion-panel {
      display: block;
      margin-bottom: 8px;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-right: 8px;
    }
    .floor-header .remove {
      background: transparent;
      border: 1px solid var(--divider-color, #444);
      color: var(--secondary-text-color);
      border-radius: 6px;
      padding: 2px 8px;
      cursor: pointer;
    }
    .floor-header .remove:hover {
      color: var(--error-color, #f44336);
      border-color: var(--error-color, #f44336);
    }
    .floor-body {
      padding: 12px;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      padding: 8px 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'fve-flow-card-editor': FveFlowCardEditor;
  }
}
