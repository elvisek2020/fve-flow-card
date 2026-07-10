import type { HomeAssistant, LovelaceCard, LovelaceCardHelpers } from './types';

export interface HistorySeries {
  entity: string;
  name: string;
  color: string;
  dataGenerator?: string;
  strokeDash?: number;
  opacity?: number;
  extendTo?: 'end' | 'now' | false;
  fill?: 'last' | 'zero' | 'null';
}

export interface HistoryDialogOptions {
  hass: HomeAssistant;
  title: string;
  series: HistorySeries[];
  spanOffset?: string;
  rangeLabel?: string;
}

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<LovelaceCardHelpers>;
  }
}

const DIALOG_TAG = 'fve-flow-history-dialog';

class FveFlowHistoryDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private readonly _chartHost: HTMLDivElement;

  public constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host {
          --dialog-accent: #4fc3f7;
          color: var(--primary-text-color, #e6f4fa);
          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
        }
        dialog {
          width: min(920px, calc(100vw - 32px));
          max-width: 920px;
          max-height: calc(100vh - 32px);
          padding: 0;
          overflow: hidden;
          color: inherit;
          background:
            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 38%),
            rgba(7, 16, 25, 0.98);
          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);
          border-radius: 20px;
          box-shadow: 0 0 32px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 24px 80px rgba(0, 0, 0, 0.55);
        }
        dialog::backdrop {
          background: rgba(0, 7, 13, 0.76);
          backdrop-filter: blur(5px);
        }
        header {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 64px;
          padding: 0 18px 0 22px;
          border-bottom: 1px solid rgba(130, 190, 220, 0.12);
        }
        .accent {
          width: 9px;
          height: 9px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--dialog-accent);
          box-shadow: 0 0 10px var(--dialog-accent);
        }
        h2 {
          min-width: 0;
          flex: 1;
          margin: 0;
          overflow: hidden;
          color: var(--primary-text-color, #e6f4fa);
          font-size: 17px;
          font-weight: 650;
          letter-spacing: 0.02em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .range {
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.62));
          font-size: 12px;
          white-space: nowrap;
        }
        button {
          display: grid;
          width: 38px;
          height: 38px;
          padding: 0;
          place-items: center;
          color: var(--secondary-text-color, #a8bbc6);
          font: inherit;
          font-size: 25px;
          line-height: 1;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 50%;
        }
        button:hover,
        button:focus-visible {
          color: var(--primary-text-color, #fff);
          outline: 1px solid var(--dialog-accent);
        }
        .chart {
          min-height: 390px;
          padding: 12px;
          overflow: auto;
        }
        .chart > * {
          display: block;
          width: 100%;
        }
        @media (max-width: 600px) {
          dialog {
            width: calc(100vw - 16px);
            max-height: calc(100vh - 16px);
            border-radius: 16px;
          }
          header {
            min-height: 58px;
            padding: 0 10px 0 16px;
          }
          h2 {
            font-size: 15px;
          }
          .range {
            display: none;
          }
          .chart {
            min-height: 320px;
            padding: 8px;
          }
        }
      </style>
      <dialog aria-labelledby="history-title">
        <header>
          <span class="accent" aria-hidden="true"></span>
          <h2 id="history-title"></h2>
          <span class="range">posledních 48 hodin</span>
          <button type="button" aria-label="Zavřít graf" title="Zavřít">×</button>
        </header>
        <div class="chart"></div>
      </dialog>
    `;

    this._dialog = root.querySelector('dialog')!;
    this._chartHost = root.querySelector('.chart')!;
    root.querySelector('button')!.addEventListener('click', () => this._dialog.close());
    this._dialog.addEventListener('click', (event) => {
      if (event.target === this._dialog) this._dialog.close();
    });
    this._dialog.addEventListener('close', () => this.remove());
  }

  public show(title: string, rangeLabel: string, accent: string, card: LovelaceCard): void {
    this.shadowRoot!.querySelector('h2')!.textContent = title;
    this.shadowRoot!.querySelector('.range')!.textContent = rangeLabel;
    this.style.setProperty('--dialog-accent', accent);
    this._chartHost.replaceChildren(card);
    this._dialog.showModal();
  }
}

if (!customElements.get(DIALOG_TAG)) {
  customElements.define(DIALOG_TAG, FveFlowHistoryDialog);
}

/**
 * Otevře kontinuální 48h graf přes apexcharts-card.
 * `false` znamená, že ApexCharts není dostupný a volající má použít fallback.
 */
export async function openHistoryDialog(options: HistoryDialogOptions): Promise<boolean> {
  if (!options.series.length) return false;

  try {
    // HACS resources se mohou registrovat až po vykreslení hlavní karty.
    // Krátce počkej, aby první klik neskončil zbytečně v nativním fallbacku.
    if (!customElements.get('apexcharts-card')) {
      await Promise.race([
        customElements.whenDefined('apexcharts-card'),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
      ]);
    }
    if (!customElements.get('apexcharts-card')) {
      console.warn('[FVE Flow Card] apexcharts-card není zaregistrovaná.');
      return false;
    }

    const config: Record<string, unknown> = {
      type: 'custom:apexcharts-card',
      graph_span: '48h',
      ...(options.spanOffset ? { span: { offset: options.spanOffset } } : {}),
      update_interval: '1min',
      header: { show: false },
      now: { show: true, label: 'Nyní' },
      apex_config: {
        chart: {
          height: 360,
          background: 'transparent',
          animations: { enabled: true, easing: 'easeinout', speed: 500 },
        },
        legend: {
          show: options.series.length > 1,
          position: 'top',
          horizontalAlign: 'left',
        },
        grid: { borderColor: 'rgba(148, 170, 190, 0.12)' },
        tooltip: { shared: true, intersect: false },
      },
      series: options.series.map((series) => ({
        entity: series.entity,
        name: series.name,
        color: series.color,
        type: 'area',
        curve: 'smooth',
        stroke_width: 2,
        stroke_dash: series.strokeDash ?? 0,
        opacity: series.opacity ?? 0.22,
        extend_to: series.extendTo ?? 'end',
        ...(series.dataGenerator
          ? { data_generator: series.dataGenerator }
          : {
              fill_raw: series.fill ?? 'last',
              group_by: {
                func: 'avg',
                duration: '5min',
                fill: series.fill ?? 'last',
              },
            }),
        show: {
          extremas: true,
          in_header: false,
        },
      })),
    };

    let card: LovelaceCard | undefined;
    if (window.loadCardHelpers) {
      try {
        const helpers = await window.loadCardHelpers();
        card = await Promise.resolve(helpers.createCardElement(config));
        if (card.tagName.toLowerCase() === 'hui-error-card') card = undefined;
      } catch (helperError) {
        console.warn('[FVE Flow Card] HA card helpers selhaly, zkouším přímé vytvoření.', helperError);
      }
    }

    if (!card) {
      const directCard = document.createElement('apexcharts-card') as LovelaceCard;
      if (typeof directCard.setConfig !== 'function') return false;
      directCard.setConfig(config);
      card = directCard;
    }

    card.hass = options.hass;
    card.style.setProperty('--ha-card-background', 'transparent');
    card.style.setProperty('--card-background-color', 'transparent');
    card.style.setProperty('--ha-card-box-shadow', 'none');

    const dialog = document.createElement(DIALOG_TAG) as FveFlowHistoryDialog;
    document.body.append(dialog);
    dialog.show(
      options.title,
      options.rangeLabel || 'posledních 48 hodin',
      options.series[0].color,
      card,
    );
    return true;
  } catch (error) {
    console.warn('[FVE Flow Card] Nepodařilo se otevřít 48h graf, používám nativní historii.', error);
    return false;
  }
}
