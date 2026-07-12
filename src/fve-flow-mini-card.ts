import { LitElement, html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FveFlowMiniCardConfig, HomeAssistant } from './types';
import { formatPower, formatState, moreInfo, severityColor, toNum } from './utils';
import { fetchHistory, type HistoryPoint } from './sparkline';
import { renderArcGauge } from './gauge';
import { renderMiniChart } from './mini-chart';
import { iconArrow } from './icons';
import './mini-editor';

const C_ACTUAL = '#00e676';
const C_FORECAST = '#ffd54f';
const HISTORY_REFRESH_MS = 5 * 60 * 1000;

/**
 * Kompaktní karta pro hlavní dashboard: baterie jako hlavní ukazatel
 * (gauge se SoC, výdrž/doba do nabití) + hlavičkové hodnoty výroby FVE
 * ("Realita") vs. Solcast predikce ("Predikce") + lehký graf dnešního dne.
 * Klik kamkoli na kartu naviguje na velký `fve-flow-card` dashboard
 * (bez `navigation_path` otevře jen historii baterie jako fallback).
 */
@customElement('fve-flow-mini-card')
export class FveFlowMiniCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: FveFlowMiniCardConfig;

  /** Historie výkonu FVE od půlnoci (pro graf) — samostatná od velkokarty sparklin. */
  @state() private _actual: HistoryPoint[] = [];
  private _historyEntity?: string;
  private _historyTimer?: number;

  public setConfig(config: FveFlowMiniCardConfig): void {
    if (!config) throw new Error('Chybí konfigurace');
    this._config = config;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._historyTimer = window.setInterval(() => void this._refreshHistory(), HISTORY_REFRESH_MS);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._historyTimer !== undefined) {
      window.clearInterval(this._historyTimer);
      this._historyTimer = undefined;
    }
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (!this.hass || !this._config) return;
    const entity = this._config.pv_power;
    if (entity !== this._historyEntity) {
      this._historyEntity = entity;
      void this._refreshHistory();
    }
  }

  private _minutesSinceMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    return Math.max(1, Math.round((now.getTime() - midnight.getTime()) / 60000));
  }

  private async _refreshHistory(): Promise<void> {
    const entity = this._config?.pv_power;
    if (!this.hass || !entity) {
      this._actual = [];
      return;
    }
    this._actual = await fetchHistory(this.hass, entity, this._minutesSinceMidnight());
  }

  /** Dnešní křivka Solcast predikce z atributu `detailedForecast`, počítá se přímo z hass.states. */
  private _forecastPoints(): HistoryPoint[] {
    const entityId = this._config?.solcast_total_today;
    const stateObj = entityId ? this.hass?.states[entityId] : undefined;
    const detailed = stateObj?.attributes.detailedForecast;
    if (!Array.isArray(detailed)) return [];

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const t0 = dayStart.getTime();
    const t1 = t0 + 24 * 60 * 60 * 1000;

    const points: HistoryPoint[] = [];
    for (const item of detailed) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as { period_start?: string; pv_estimate?: number };
      const t = new Date(rec.period_start ?? '').getTime();
      const w = Number(rec.pv_estimate) * 1000;
      if (Number.isFinite(t) && Number.isFinite(w) && t >= t0 && t <= t1) points.push([t, w]);
    }
    return points.sort((a, b) => a[0] - b[0]);
  }

  private _handleClick(): void {
    const path = this._config?.navigation_path?.trim();
    if (path) {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
      return;
    }
    moreInfo(this, this._config?.battery?.soc);
  }

  public getCardSize(): number {
    return 6;
  }

  public getGridOptions(): Record<string, unknown> {
    // "auto" = výška sekce se přizpůsobí skutečnému obsahu karty (viz
    // dynamické "H" v render() a `svg { height: auto }` ve stylech) —
    // karta se tak zmenší, když zmizí spodní sekce s grafem, a zase
    // zvětší, jakmile se objeví. Pokud kartu už máte na dashboardu se
    // starším nastavením (pevné `rows`), přepněte jí v editoru rozvržení
    // výšku na „Automaticky", ať se toto chování uplatní.
    return { columns: 6, rows: 'auto' };
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('fve-flow-mini-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      title: 'FVE přehled',
      battery: {
        soc: 'sensor.pylontech_battery_id_512_nabijeni',
        power: 'sensor.pylontech_battery_id_512_vykon',
        runtime: 'sensor.baterie_odhadovana_vydrz_2',
        time_to_full: 'sensor.baterie_doba_do_plneho_nabiti',
      },
      pv_power: 'sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky',
      solcast_power_now: 'sensor.solcast_pv_forecast_power_now',
      solcast_total_today: 'sensor.solcast_pv_forecast_forecast_today',
      navigation_path: '/lovelace/fve-flow',
    };
  }

  protected render(): TemplateResult {
    const cfg = this._config;
    if (!cfg) return html``;
    if (!this.hass) return html`<ha-card></ha-card>`;

    const b = cfg.battery ?? {};
    const soc = toNum(this.hass, b.soc, 0);
    const yellowFrom = b.yellow_from ?? 15;
    const greenFrom = Math.max(b.green_from ?? 40, yellowFrom);
    const socColor =
      severityColor(soc, { yellow_from: yellowFrom, green_from: greenFrom, severity_invert: b.severity_invert }) ??
      C_ACTUAL;

    const rawBatP = toNum(this.hass, b.power);
    const batP = b.invert ? -rawBatP : rawBatP;
    const chargeThreshold = b.charge_threshold_w ?? 25;
    const charging = batP >= chargeThreshold;
    const discharging = batP <= -chargeThreshold;
    const stateText = charging
      ? `Nabíjení ${formatPower(Math.abs(batP))}`
      : discharging
        ? `Vybíjení ${formatPower(Math.abs(batP))}`
        : 'Klidový stav';
    const stateColor = charging ? '#e040fb' : discharging ? '#ffb74d' : 'rgba(220,235,245,0.55)';
    const stateArrow = charging ? 'up' : discharging ? 'down' : undefined;

    const pvNow = toNum(this.hass, cfg.pv_power);
    const solcastNow = toNum(this.hass, cfg.solcast_power_now);

    const forecastPoints = this._forecastPoints();
    const chartMinPower = cfg.chart_min_power_w ?? 50;
    // Podle aktuálního výkonu FVE ("Realita"), ne podle špičky celého dne —
    // graf tak zmizí, jakmile výroba klesne pod limit (typicky v noci),
    // a znovu se objeví, jakmile FVE zase vyrábí nad limit.
    const hasChartSignal = pvNow >= chartMinPower;

    const W = 400;
    const cx = W / 2;
    const cy = 114;
    const r = 74;

    const infoLines: Array<{ text: string; color?: string; arrow?: 'up' | 'down' }> = [];
    if (b.power) infoLines.push({ text: stateText, color: stateColor, arrow: stateArrow });
    if (b.runtime) infoLines.push({ text: `Odhadovaná výdrž ${formatState(this.hass, b.runtime)}` });
    if (charging && b.time_to_full) {
      infoLines.push({ text: `Do plného nabití ${formatState(this.hass, b.time_to_full)}` });
    }

    // Bez spodní sekce (Realita/Predikce + graf) karta nepotřebuje celou
    // výšku — "H" (výška viewBoxu) se zkrátí přesně na to, co reálně
    // zobrazujeme (nadpis + gauge + info řádky), a díky `svg { height: auto }`
    // se tak zmenší i skutečná výška celé karty, ne jen posune obsah v rámci
    // pořád stejně velkého boxu.
    const noChartBottom = cy + 50 + Math.max(0, infoLines.length - 1) * 18 + 20;
    const H = hasChartSignal ? 368 : noChartBottom;

    return html`
      <ha-card @click=${() => this._handleClick()}>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">
          ${cfg.title
            ? svg`<text class="card-title" x="${cx}" y="20" text-anchor="middle">${cfg.title}</text>`
            : nothing}

          ${renderArcGauge(cx, cy, r, soc, 0, 100, { yellowFrom, greenFrom }, socColor)}
          <text class="gauge-value" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill: ${socColor}">
            ${b.soc ? `${Math.round(soc)} %` : '—'}
          </text>
          <text class="gauge-label" x="${cx}" y="${cy + 30}" text-anchor="middle">
            ${b.name || 'Stav baterie'}
          </text>
          ${infoLines.map((line, i) => {
            const lineY = cy + 50 + i * 18;
            return svg`
              ${line.arrow ? iconArrow(cx - 78, lineY - 13, 16, line.color ?? 'currentColor', line.arrow) : nothing}
              <text class="info-line" x="${cx}" y="${lineY}" text-anchor="middle"
                style="${line.color ? `fill: ${line.color}` : ''}">${line.text}</text>
            `;
          })}

          ${hasChartSignal
            ? svg`
              <line x1="24" y1="220" x2="${W - 24}" y2="220" stroke="rgba(148,170,190,0.14)" stroke-width="1"/>

              <text class="headline-value" x="${W * 0.28}" y="252" text-anchor="middle" style="fill: ${C_ACTUAL}">
                ${cfg.pv_power ? formatPower(pvNow) : '—'}
              </text>
              <text class="headline-label" x="${W * 0.28}" y="270" text-anchor="middle">Realita</text>

              <text class="headline-value" x="${W * 0.72}" y="252" text-anchor="middle" style="fill: ${C_FORECAST}">
                ${cfg.solcast_power_now ? formatPower(solcastNow) : '—'}
              </text>
              <text class="headline-label" x="${W * 0.72}" y="270" text-anchor="middle">Predikce</text>

              ${renderMiniChart(this._actual, forecastPoints, 24, 284, W - 48, 56, {
                actual: C_ACTUAL,
                forecast: C_FORECAST,
              })}
            `
            : nothing}
        </svg>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      /* Žádná pevná výška — karta se skutečně zmenší/zvětší podle obsahu
         (viz dynamické "H" ve viewBoxu SVG níže), místo aby jen vyplnila
         napevno danou plochu a přebytek nechala jako prázdné místo.
         V "sections" pohledu HA k tomu potřebuje grid_options.rows: auto
         na kartě (v masonry pohledu funguje automaticky). */
      overflow: hidden;
      padding: 4px;
      cursor: pointer;
      background:
        radial-gradient(1100px 700px at 18% -10%, #122433 0%, transparent 60%),
        radial-gradient(900px 600px at 95% 105%, #0d1d2e 0%, transparent 55%),
        linear-gradient(160deg, #0b141d 0%, #070c12 100%);
      border: 1px solid rgba(120, 180, 210, 0.08);
    }
    svg {
      display: block;
      /* Výška se dopočítá z poměru stran viewBoxu (šířka/H) — díky tomu
         "auto" skutečně respektuje aktuální "H" nastavené v render() a
         karta se opravdu zmenší, když zmizí spodní sekce s grafem. */
      width: 100%;
      height: auto;
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
    .gauge-value {
      font-size: 30px;
      font-weight: 700;
    }
    .gauge-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .info-line {
      font-size: 13px;
      fill: rgba(226, 240, 248, 0.65);
    }
    .headline-value {
      font-size: 22px;
      font-weight: 700;
    }
    .headline-label {
      font-size: 11.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .chart-axis {
      font-size: 10px;
      fill: rgba(226, 240, 248, 0.35);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'fve-flow-mini-card': FveFlowMiniCard;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fve-flow-mini-card',
  name: 'FVE Flow Mini Card',
  description:
    'Kompaktní karta: baterie jako gauge s výdrží, výroba FVE vs. Solcast predikce. Klik naviguje na velký FVE Flow dashboard.',
  preview: false,
  documentationURL: 'https://github.com/elvisek/fve-flow-card',
});
