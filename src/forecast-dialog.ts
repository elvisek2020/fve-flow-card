import type { BatteryForecastResult } from './battery-forecast';
import { formatEnergy } from './utils';

export interface ForecastDialogOptions {
  result: BatteryForecastResult;
  /** Denní spotřeba použitá v modelu (kWh). */
  dailyLoadKwh: number;
  /** Kapacita v kWh použitá v modelu. */
  capacityKwh: number;
  /** Aktuální SoC %. */
  socNow: number;
  accent?: string;
}

const DIALOG_TAG = 'fve-flow-forecast-dialog';

const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

function formatSoc(pct: number): string {
  return `${nf0.format(Math.round(pct))} %`;
}

function formatPv(kwh: number | null): string {
  if (kwh == null || !Number.isFinite(kwh)) return '—';
  return formatEnergy(kwh);
}

class FveFlowForecastDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private readonly _summary: HTMLParagraphElement;
  private readonly _meta: HTMLParagraphElement;
  private readonly _tbody: HTMLTableSectionElement;

  public constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host {
          --dialog-accent: #ffb74d;
          color: var(--primary-text-color, #e6f4fa);
          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
        }
        dialog {
          width: min(560px, calc(100vw - 32px));
          max-height: calc(100vh - 32px);
          padding: 0;
          overflow: hidden;
          color: inherit;
          background:
            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 45%),
            rgba(7, 16, 25, 0.98);
          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);
          border-radius: 18px;
          box-shadow: 0 0 28px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 20px 64px rgba(0, 0, 0, 0.55);
        }
        dialog::backdrop {
          background: rgba(0, 7, 13, 0.76);
          backdrop-filter: blur(5px);
        }
        header {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 56px;
          padding: 0 14px 0 22px;
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
          font-size: 16px;
          font-weight: 650;
          letter-spacing: 0.02em;
        }
        .close {
          width: 36px;
          height: 36px;
          padding: 0;
          color: var(--secondary-text-color, #a8bbc6);
          font: inherit;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          background: transparent;
          border: none;
          border-radius: 10px;
        }
        .close:hover,
        .close:focus-visible {
          color: var(--primary-text-color, #fff);
          background: rgba(255, 255, 255, 0.06);
          outline: none;
        }
        .body {
          padding: 16px 22px 22px;
          overflow: auto;
          max-height: calc(100vh - 100px);
        }
        .summary {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 650;
          line-height: 1.4;
        }
        .summary.ok { color: #69f0ae; }
        .summary.risk { color: #ff8a80; }
        .meta {
          margin: 0 0 16px;
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.68));
          font-size: 12.5px;
          line-height: 1.45;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          padding: 9px 8px;
          text-align: right;
          border-bottom: 1px solid rgba(130, 190, 220, 0.1);
        }
        th:first-child,
        td:first-child {
          text-align: left;
          padding-left: 0;
        }
        th:last-child,
        td:last-child {
          padding-right: 0;
          text-align: center;
          width: 2.5em;
        }
        th {
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.55));
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        td.muted {
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.45));
        }
        tr.risk td {
          background: color-mix(in srgb, #ff5252 8%, transparent);
        }
        .dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          vertical-align: middle;
        }
        .dot.ok { background: #69f0ae; box-shadow: 0 0 8px #69f0ae88; }
        .dot.bad { background: #ff5252; box-shadow: 0 0 8px #ff525288; }
        .note {
          margin: 14px 0 0;
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.5));
          font-size: 11.5px;
          line-height: 1.4;
        }
      </style>
      <dialog aria-labelledby="forecast-title">
        <header>
          <span class="accent" aria-hidden="true"></span>
          <h2 id="forecast-title">Prognóza výdrže baterie</h2>
          <button type="button" class="close" aria-label="Zavřít">×</button>
        </header>
        <div class="body">
          <p class="summary"></p>
          <p class="meta"></p>
          <table>
            <thead>
              <tr>
                <th>Den</th>
                <th>Solcast</th>
                <th>Spotřeba</th>
                <th>SoC konec</th>
                <th></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <p class="note">
            Hrubý denní model: SoC += (Solcast − spotřeba) / kapacita.
            Chybějící predikce se bere jako 0 kWh. Nezohledňuje denní průběh ani grid.
          </p>
        </div>
      </dialog>
    `;

    this._dialog = root.querySelector('dialog')!;
    this._summary = root.querySelector('.summary')!;
    this._meta = root.querySelector('.meta')!;
    this._tbody = root.querySelector('tbody')!;
    root.querySelector('.close')!.addEventListener('click', () => this._dialog.close());
    this._dialog.addEventListener('click', (event) => {
      if (event.target === this._dialog) this._dialog.close();
    });
    this._dialog.addEventListener('close', () => this.remove());
  }

  public show(options: ForecastDialogOptions): void {
    if (options.accent) this.style.setProperty('--dialog-accent', options.accent);
    const { result } = options;
    this._summary.className = `summary ${result.ok ? 'ok' : 'risk'}`;
    if (result.ok) {
      this._summary.textContent = `Vydrží — SoC zůstane nad ${formatSoc(result.minSocPct)} (nejníže ${formatSoc(result.lowestSoc)}).`;
    } else {
      const day = result.days[result.firstRiskDayIndex!];
      this._summary.textContent = `Riziko — ${day.label} končí na ${formatSoc(day.socEnd)} (práh ${formatSoc(result.minSocPct)}).`;
    }
    this._meta.textContent =
      `Teď ${formatSoc(options.socNow)} · kapacita ${nf1.format(options.capacityKwh)} kWh` +
      ` · spotřeba ${formatEnergy(options.dailyLoadKwh)}/den · práh ${formatSoc(result.minSocPct)}`;

    this._tbody.replaceChildren();
    for (const day of result.days) {
      const tr = document.createElement('tr');
      if (day.risk) tr.classList.add('risk');
      tr.innerHTML = `
        <td>${escapeHtml(day.label)}</td>
        <td class="${day.pvKwh == null ? 'muted' : ''}">${escapeHtml(formatPv(day.pvKwh))}</td>
        <td>${escapeHtml(formatEnergy(day.loadKwh))}</td>
        <td>${escapeHtml(formatSoc(day.socEnd))}</td>
        <td><span class="dot ${day.risk ? 'bad' : 'ok'}" title="${day.risk ? 'Riziko' : 'OK'}"></span></td>
      `;
      this._tbody.append(tr);
    }

    this._dialog.showModal();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (!customElements.get(DIALOG_TAG)) {
  customElements.define(DIALOG_TAG, FveFlowForecastDialog);
}

/** Otevře modal s prognózou výdrže baterie. */
export function openForecastDialog(options: ForecastDialogOptions): void {
  const dialog = document.createElement(DIALOG_TAG) as FveFlowForecastDialog;
  document.body.append(dialog);
  dialog.show(options);
}
