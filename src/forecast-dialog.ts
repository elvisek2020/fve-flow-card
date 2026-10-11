import type { BatteryForecastResult, ForecastDayResult } from './battery-forecast';
import { formatEnergy } from './utils';

export interface ForecastDialogOptions {
  result: BatteryForecastResult;
  accent?: string;
}

const DIALOG_TAG = 'fve-flow-forecast-dialog';

const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

function formatSoc(pct: number): string {
  return `${nf0.format(Math.round(pct))} %`;
}

function formatPv(kwh: number | null): string {
  if (kwh == null || !Number.isFinite(kwh)) return '—';
  return formatEnergy(kwh);
}

const fmtTime = new Intl.DateTimeFormat('cs-CZ', { hour: 'numeric', minute: '2-digit' });

/** Čas z historie (už proběhlý) je jen po hodinách → „~7:00“. */
function formatAt(t: number | null): string {
  if (t == null) return '';
  return `${t < Date.now() ? '~' : ''}${fmtTime.format(t)}`;
}

/** Stav dne: pod prahem / nabije se na 100 % / jen částečně / nenabíjí se. */
function dayState(day: ForecastDayResult): { cls: string; title: string } {
  if (day.trough == null) return { cls: '', title: '' };
  if (day.risk) return { cls: 'bad', title: 'Ráno pod prahem' };
  if (day.fullAt != null) return { cls: 'ok', title: 'Nabije se na 100 %' };
  if (day.charges) return { cls: 'part', title: 'Nenabije se na 100 %' };
  return { cls: 'none', title: 'Nenabíjí se' };
}

const SOURCE_TEXT: Record<BatteryForecastResult['loadSource'], string> = {
  dc: 'průměrný odběr z baterie po hodinách za 7 dní',
  ac: 'průměrný výstup měniče po hodinách za 7 dní',
  flat: 'včerejší spotřeba rozložená rovnoměrně',
};

class FveFlowForecastDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private readonly _note: HTMLDivElement;
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
          max-height: calc(100vh - 32px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
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
          max-height: calc(100vh - 100px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
        }
        td small {
          display: block;
          margin-top: 1px;
          color: rgba(220, 235, 245, 0.45);
          font-size: 11px;
          font-weight: 400;
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
        td {
          /* „po 28. 9.“ a „26,5 kWh“ na jeden řádek i na úzkém mobilu. */
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 420px) {
          th, td {
            padding: 8px 4px;
          }
          table {
            font-size: 12.5px;
          }
        }
        td.muted {
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.45));
        }
        tr.risk td {
          background: color-mix(in srgb, #ff5252 8%, transparent);
        }
        tr.past td {
          color: rgba(220, 235, 245, 0.38);
        }
        tr.past + tr.today td {
          border-top: 1px solid rgba(130, 190, 220, 0.28);
        }
        tr.today td,
        tr.tomorrow td {
          color: var(--primary-text-color, #e6f4fa);
          font-weight: 650;
        }
        tr.future td {
          color: rgba(220, 235, 245, 0.62);
        }
        /* Stav dne jako výrazný čtvereček (zelená / oranžová / šedá / červená). */
        .dot {
          display: inline-block;
          width: 13px;
          height: 13px;
          border-radius: 3px;
          vertical-align: middle;
        }
        .dot.ok { background: #00e676; box-shadow: 0 0 10px #00e676aa; }
        .dot.part { background: #ffa726; box-shadow: 0 0 10px #ffa726aa; }
        .dot.none { background: #90a4ae; }
        .dot.bad { background: #ff1744; box-shadow: 0 0 10px #ff1744aa; }
        tr.past .dot { opacity: 0.6; box-shadow: none; }
        .note {
          margin: 14px 0 0;
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.5));
          font-size: 11.5px;
          line-height: 1.4;
        }
        .note p {
          margin: 0 0 3px;
        }
      </style>
      <dialog aria-labelledby="forecast-title">
        <header>
          <span class="accent" aria-hidden="true"></span>
          <h2 id="forecast-title">Prognóza výdrže baterie</h2>
          <button type="button" class="close" aria-label="Zavřít">×</button>
        </header>
        <div class="body">
          <table>
            <thead>
              <tr>
                <th>Den</th>
                <th>Výroba</th>
                <th>Spotřeba</th>
                <th title="Nejnižší SoC, než se baterie začne nabíjet">Ráno</th>
                <th title="Nejvyšší SoC dne, u 100 % čas nabití">Max</th>
                <th></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <div class="note"></div>
        </div>
      </dialog>
    `;

    this._dialog = root.querySelector('dialog')!;
    this._note = root.querySelector('.note')!;
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
    // Patička po větách — každá na vlastním řádku.
    this._note.replaceChildren(
      ...[
        `Simulace SoC po 15 minutách: výroba podle Solcastu (průběh dne) − ${SOURCE_TEXT[result.loadSource]}.`,
        'Ráno = nejnižší SoC, než se baterie začne nabíjet.',
        'Max = nejvyšší SoC dne (u 100 % čas nabití).',
      ].map((text) => {
        const line = document.createElement('p');
        line.textContent = text;
        return line;
      }),
    );

    this._tbody.replaceChildren();
    for (const day of result.days) {
      const tr = document.createElement('tr');
      tr.classList.add(day.kind);
      if (day.risk) tr.classList.add('risk');
      const state = dayState(day);
      const loadText = day.loadKwh == null ? '—' : formatEnergy(Math.max(0, day.loadKwh));
      const trough =
        day.trough == null
          ? '—'
          : `${escapeHtml(formatSoc(day.trough))}<small>${escapeHtml(formatAt(day.troughAt))}</small>`;
      const max =
        day.peak == null
          ? day.trough == null
            ? '—'
            : '<small>nenabíjí</small>'
          : `${escapeHtml(formatSoc(day.fullAt != null ? 100 : day.peak))}<small>${escapeHtml(
              formatAt(day.fullAt ?? day.peakAt),
            )}</small>`;
      tr.innerHTML = `
        <td>${escapeHtml(day.label)}</td>
        <td class="${day.pvKwh == null ? 'muted' : ''}">${escapeHtml(formatPv(day.pvKwh))}</td>
        <td class="${loadText === '—' ? 'muted' : ''}">${escapeHtml(loadText)}</td>
        <td>${trough}</td>
        <td>${max}</td>
        <td>${state.cls ? `<span class="dot ${state.cls}" title="${state.title}"></span>` : ''}</td>
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
