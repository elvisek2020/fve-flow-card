import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FveFlowMiniCardConfig, HomeAssistant } from './types';
import { fireEvent } from './utils';

const ENTITY = { entity: { domain: 'sensor' } };
const TEXT = { text: {} };
const BOOL = { boolean: {} };
const numBox = (min: number, max: number, step = 1) => ({
  number: { min, max, step, mode: 'box' as const },
});

const SCHEMA = [
  { name: 'title', selector: TEXT },
  {
    name: 'battery',
    type: 'expandable',
    icon: 'mdi:battery-high',
    schema: [
      { name: 'soc', required: true, selector: ENTITY },
      { name: 'power', selector: ENTITY },
      { name: 'runtime', selector: ENTITY },
      { name: 'time_to_full', selector: ENTITY },
      { name: 'invert', selector: BOOL },
      { name: 'charge_threshold_w', selector: numBox(0, 500, 5) },
      { name: 'yellow_from', selector: numBox(0, 100, 1) },
      { name: 'green_from', selector: numBox(0, 100, 1) },
      { name: 'name', selector: TEXT, custom_label: 'Vlastní název baterie' },
    ],
  },
  {
    name: 'loads',
    type: 'expandable',
    flatten: true,
    title: 'Spotřeba FVE / síť',
    icon: 'mdi:flash',
    schema: [
      {
        name: 'fve_load',
        selector: ENTITY,
        custom_label: 'Spotřeba z FVE (W) — vlevo u baterie',
      },
      {
        name: 'grid_power',
        selector: ENTITY,
        custom_label: 'Spotřeba ze sítě (W) — vpravo u baterie',
      },
    ],
  },
  {
    // flatten: true — pole se ukládají přímo do konfigurace karty
    // (pv_power, solcast_power_now, solcast_total_today), sekce je jen
    // vizuální seskupení ve formuláři (vzor floor_grid/floor_fve v editor.ts).
    name: 'solar',
    type: 'expandable',
    flatten: true,
    title: 'FVE a Solcast predikce',
    icon: 'mdi:solar-power',
    schema: [
      { name: 'pv_power', selector: ENTITY, custom_label: 'Aktuální výkon FVE (W) — „Realita"' },
      {
        name: 'solcast_power_now',
        selector: ENTITY,
        custom_label: 'Predikovaný výkon teď (W) — „Predikce"',
      },
      {
        name: 'solcast_total_today',
        selector: ENTITY,
        custom_label: 'Entita s dnešní Solcast predikcí (zdroj grafu)',
      },
      { name: 'chart_min_power_w', selector: numBox(0, 2000, 10) },
    ],
  },
  {
    name: 'navigation',
    type: 'expandable',
    flatten: true,
    title: 'Navigace',
    icon: 'mdi:gesture-tap',
    schema: [{ name: 'navigation_path', selector: TEXT, custom_label: 'Cesta velkého dashboardu' }],
  },
];

const LABELS: Record<string, string> = {
  title: 'Titulek karty',
  battery: 'Baterie',
  soc: 'Nabití SoC (%)',
  power: 'Výkon baterie (W)',
  runtime: 'Odhadovaná výdrž',
  time_to_full: 'Doba do plného nabití',
  invert: 'Obrátit znaménko výkonu baterie',
  charge_threshold_w: 'Práh pro "nabíjí" (W)',
  yellow_from: 'Žlutá od hodnoty (pod ní červená)',
  green_from: 'Zelená od hodnoty',
  name: 'Vlastní název',
  chart_min_power_w: 'Minimální aktuální výkon FVE pro zobrazení grafu (W)',
};

const HELPERS: Record<string, string> = {
  yellow_from: 'Výchozí 15 % — pod touto hranicí je gauge červený.',
  green_from: 'Výchozí 40 % — od této hranice je gauge zelený.',
  invert: 'Zapni, pokud tvá baterie hlásí kladný výkon při vybíjení (obrácená konvence než Victron).',
  charge_threshold_w:
    'Od jakého výkonu (W) se baterie počítá jako "nabíjí" — ovlivňuje, kdy se zobrazí řádek "Do plného nabití". Výchozí 25 W potlačí šum kolem nuly; sniž, pokud chceš vidět dobu do nabití i při velmi slabém nabíjení.',
  fve_load:
    'Typicky kritické zátěže / výstup měniče (ostrovní spotřeba). Zobrazí se vlevo vedle gauge jako „FVE". Bez entity se levá strana nevykreslí.',
  grid_power:
    'Typicky AC-IN ze Shelly. Zobrazí se vpravo vedle gauge jako „síť". Bez entity se pravá strana nevykreslí.',
  solcast_total_today:
    'Stejná entita jako u velké karty ("Dnes celkem") — karta si z jejího atributu detailedForecast sama vybere dnešní hodiny pro graf.',
  chart_min_power_w:
    'Graf se zobrazí jen dokud aktuální výkon FVE ("Realita") dosahuje alespoň této hodnoty — v noci nebo při velmi slabé výrobě tak zmizí úplně (žádný placeholder text). Výchozí 50 W.',
  navigation_path:
    'Cesta velkého Hybrid Energy Flow dashboardu, např. /lovelace/fve-flow — najdeš ji v adresním řádku prohlížeče, když máš velkou kartu otevřenou. Bez vyplnění klik na kartu otevře jen historii baterie.',
};

@customElement('fve-flow-mini-card-editor')
export class FveFlowMiniCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: FveFlowMiniCardConfig;

  public setConfig(config: FveFlowMiniCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (schema: { name: string; custom_label?: string }): string =>
    schema.custom_label ?? LABELS[schema.name] ?? schema.name;

  private _computeHelper = (schema: { name: string }): string | undefined => HELPERS[schema.name];

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        @value-changed=${this._changed}
      ></ha-form>
    `;
  }

  private _changed(ev: CustomEvent): void {
    ev.stopPropagation();
    const config = ev.detail.value as FveFlowMiniCardConfig;
    this._config = config;
    fireEvent(this, 'config-changed', { config });
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-form {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'fve-flow-mini-card-editor': FveFlowMiniCardEditor;
  }
}
