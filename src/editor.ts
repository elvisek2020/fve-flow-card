import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorConfig, FveFlowCardConfig, HomeAssistant } from './types';
import { fireEvent } from './utils';

const ENTITY = { entity: { domain: 'sensor' } };
const SWITCH = { entity: { domain: 'switch' } };
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
    // FVE panely a MPPT jsou v UI dvě samostatné sekce první úrovně,
    // ale obě mají name: 'pv' — data tak zůstávají plochá v cfg.pv
    // (žádná migrace configu). Vnořený formulář dostává celý objekt pv,
    // takže změna v jedné sekci nepřepíše pole té druhé.
    name: 'pv',
    type: 'expandable',
    title: 'FVE panely',
    icon: 'mdi:solar-power',
    schema: [
      { name: 'power', required: true, selector: ENTITY },
      { name: 'energy_today', selector: ENTITY },
      { name: 'energy_total', selector: ENTITY },
      { name: 'max_power_today', selector: ENTITY },
      { name: 'name', selector: TEXT, custom_label: 'Vlastní název FVE panelů' },
      ...SEVERITY_W,
    ],
  },
  {
    name: 'pv',
    type: 'expandable',
    title: 'MPPT regulátor',
    icon: 'mdi:current-dc',
    schema: [
      { name: 'voltage', selector: ENTITY },
      { name: 'current', selector: ENTITY },
      { name: 'mppt_state', selector: ENTITY },
      { name: 'mppt_switch', selector: SWITCH },
      { name: 'mppt_name', selector: TEXT, custom_label: 'Vlastní název MPPT regulátoru' },
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
      { name: 'cycles', selector: ENTITY },
      { name: 'time_to_full', selector: ENTITY },
      { name: 'capacity', selector: ENTITY },
      { name: 'invert', selector: BOOL },
      { name: 'name', selector: TEXT, custom_label: 'Vlastní název baterie' },
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
      { name: 'voltage', selector: ENTITY },
      { name: 'current', selector: ENTITY },
      { name: 'load_power', selector: ENTITY },
      { name: 'days_in_service', selector: ENTITY },
      { name: 'fan_switch', selector: SWITCH },
      { name: 'name', selector: TEXT, custom_label: 'Vlastní název měniče' },
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
      { name: 'name', selector: TEXT, custom_label: 'Vlastní název sítě' },
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
      { name: 'total_tomorrow', selector: ENTITY },
      ...SEVERITY_W,
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
      { name: 'sparklines', selector: BOOL },
    ],
  },
];

/**
 * Schéma jednoho patra. Grid a FVE větev jsou samostatné skládací sekce
 * (stejně jako u hlavního formuláře), ale data zůstávají plochá přímo
 * v objektu patra — proto `flatten: true`. Fáze L1–L3 patří pod Grid,
 * protože jde o rozpad gridové AC-OUT větve (Shelly), ne FVE.
 */
const FLOOR_SCHEMA = [
  { name: 'name', required: true, selector: TEXT, custom_label: 'Název patra' },
  {
    name: 'floor_grid',
    type: 'expandable',
    flatten: true,
    expanded: true,
    title: 'Grid (síť) — Shelly *-GRID-AC-OUT',
    icon: 'mdi:transmission-tower',
    schema: [
      { name: 'grid_power', selector: ENTITY },
      { name: 'grid_energy', selector: ENTITY },
      { name: 'phase_a_entity', selector: ENTITY },
      { name: 'phase_a_name', selector: TEXT },
      { name: 'phase_a_icon', selector: ICON },
      { name: 'phase_b_entity', selector: ENTITY },
      { name: 'phase_b_name', selector: TEXT },
      { name: 'phase_b_icon', selector: ICON },
      { name: 'phase_c_entity', selector: ENTITY },
      { name: 'phase_c_name', selector: TEXT },
      { name: 'phase_c_icon', selector: ICON },
    ],
  },
  {
    name: 'floor_fve',
    type: 'expandable',
    flatten: true,
    expanded: true,
    title: 'FVE (ostrov)',
    icon: 'mdi:solar-power',
    schema: [
      { name: 'island_power', selector: ENTITY },
      { name: 'island_energy', selector: ENTITY },
    ],
  },
];

const LABELS: Record<string, string> = {
  title: 'Titulek karty',
  pv: 'FVE / MPPT',
  mppt_switch: 'Spínač MPPT (switch) — ovládací tlačítko',
  fan_switch: 'Spínač chlazení měniče (switch) — ovládací tlačítko',
  battery: 'Baterie',
  inverter: 'Měnič',
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
  cycles: 'Počet nabíjecích cyklů',
  time_to_full: 'Doba do plného nabití',
  capacity: 'Instalovaná kapacita',
  invert: 'Obrátit znaménko výkonu baterie',
  state: 'Stav měniče',
  load_power: 'Ostrovní spotřeba — kritické zátěže (W)',
  days_in_service: 'Počet dní v provozu',
  name: 'Vlastní název',
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
  total_tomorrow: 'Zítra celkem (kWh)',
  max_flow_w: 'Výkon pro plnou rychlost animace (W)',
  deadband_w: 'Mrtvá zóna — pod tímto výkonem je linka neaktivní (W)',
  dots: 'Počet svítících teček na jedné aktivní lince',
  min_duration: 'Nejrychlejší oběh tečky — při max. výkonu (s)',
  max_duration: 'Nejpomalejší oběh tečky — těsně nad mrtvou zónou (s)',
  animation: 'Animace pulzujících teček zapnuté',
  sparklines: 'Mini trendové křivky v rozích uzlů',
  yellow_from: 'Žlutá od hodnoty (pod ní červená)',
  green_from: 'Zelená od hodnoty',
  bar_max: 'Rozsah progress baru (max)',
  severity_invert: 'Obrátit barvy (vysoká hodnota = špatná)',
  grid_power: 'Výkon ze sítě (W) — nepovinné, jinak součet fází',
  grid_energy: 'Energie ze sítě (kWh)',
  island_power: 'Výkon z FVE (W)',
  island_energy: 'Energie z FVE (kWh)',
};

/**
 * Doplňující vysvětlující text pod polem (ha-form `computeHelper`).
 * Používá se hlavně pro sekci „Chování a animace", kde názvy polí
 * sami o sobě nejsou úplně samovysvětlující.
 */
const HELPERS: Record<string, string> = {
  mppt_switch: 'Když je vyplněno, zobrazí se v panelu MPPT tlačítko Zapnout/Vypnout. Přepnutí je chráněné potvrzovacím dialogem.',
  fan_switch: 'Když je vyplněno, zobrazí se v panelu měniče tlačítko Zapnout/Vypnout chlazení (např. chytrá zásuvka s ventilátorem). Přepíná se okamžitě bez potvrzení.',
  max_flow_w: 'Výkon, při kterém pulzy na lince běží nejrychleji (rychlost je od "mrtvé zóny" po tuto hodnotu plynulá). Nastav podle reálné špičky tvého systému, např. 5000 W pro měnič 5 kW.',
  deadband_w: 'Pod touto hodnotou je tok energie tak malý, že se linka vykreslí jako klidná/šedá bez pulzů — potlačí to "věčné" mihotání kvůli šumu měření.',
  dots: 'Kolik světelných teček se najednou pohybuje po jedné aktivní lince. Víc teček = hustší, "plnější" tok při vysokém výkonu.',
  min_duration: 'Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon na hraně `max_flow_w` (nejrychlejší možný pohyb).',
  max_duration: 'Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon jen kousek nad `deadband_w` (nejpomalejší, "sotva tekoucí" pohyb).',
  animation: 'Vypnutím se pulzující tečky nekreslí vůbec — čísla, barvy a stavy uzlů se ale dál aktualizují normálně. Vhodné na slabší zařízení nebo pokud animace nechceš.',
  sparklines: 'Malá křivka trendu za poslední hodinu v pravém horním rohu uzlů FVE, baterie (SoC), měnič a síť. Data se tahají z historie HA a obnovují se každých 5 minut.',
};

@customElement('fve-flow-card-editor')
export class FveFlowCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: FveFlowCardConfig;

  public setConfig(config: FveFlowCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (schema: { name: string; custom_label?: string }): string =>
    schema.custom_label ?? LABELS[schema.name] ?? schema.name;

  private _computeHelper = (schema: { name: string }): string | undefined =>
    HELPERS[schema.name];

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;
    const floors = this._config.floors ?? [];
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
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
                .computeHelper=${this._computeHelper}
                @value-changed=${(e: CustomEvent) => this._floorChanged(e, idx)}
              ></ha-form>
            </div>
          </ha-expansion-panel>
        `,
      )}
      ${!floors.length
        ? html`<div class="hint">
            Zatím žádná patra — přidej první přes tlačítko výše. Každé patro může mít grid větev
            (Shelly *-GRID-AC-OUT), FVE větev a pojmenované fáze.
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
