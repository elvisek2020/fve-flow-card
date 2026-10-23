import type { HomeAssistant } from './types';
import { plannerDays, type LoadSource, type PlannerDay, type PlannerEntities } from './planner';
import { formatEnergy } from './utils';

export interface ForecastDialogOptions {
  /** Aktuální hass (dialog se obnovuje, dokud je otevřený). */
  getHass: () => HomeAssistant | undefined;
  planner: PlannerEntities;
}

const DIALOG_TAG = 'fve-flow-forecast-dialog';
const REFRESH_MS = 5000;

const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
const fmtTime = new Intl.DateTimeFormat('cs-CZ', { hour: 'numeric', minute: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });

const LOAD_TEXT: Record<LoadSource, string> = {
  dc:
    'Budoucí spotřeba je průměrný odběr z baterie za posledních 7 dní (včetně ztrát měniče) — ' +
    'nerozlišuje všední den a víkend a může se lišit od naměřené spotřeby domu v minulých dnech.',
  ac:
    'Budoucí spotřeba je průměrný výstup měniče za posledních 7 dní — ' +
    'nerozlišuje všední den a víkend a nepočítá se ztrátami měniče.',
  flat: 'Budoucí spotřeba je záložní denní spotřeba, rozložená rovnoměrně do celého dne.',
};

function formatSoc(pct: number): string {
  return `${nf0.format(Math.round(pct))} %`;
}

function kwh(v: number | null | undefined): string {
  return v == null || !Number.isFinite(v) ? '—' : formatEnergy(v);
}

/** Čas z historie (už proběhlý) je jen po hodinách → „~7:00“. */
function formatAt(iso: string | null): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  return `${t < Date.now() ? '~' : ''}${fmtTime.format(t)}`;
}

function dayLabel(d: PlannerDay): string {
  if (d.kind === 'today') return 'Dnes';
  if (d.kind === 'tomorrow') return 'Zítra';
  return fmtDay.format(new Date(`${d.date}T12:00:00`));
}

/** Stav dne: pod prahem / nabije se na 100 % / jen částečně / nenabíjí se. */
function dayState(day: PlannerDay): { cls: string; title: string } {
  if (day.trough == null) return { cls: '', title: '' };
  if (day.risk) return { cls: 'bad', title: 'Ráno pod prahem' };
  if (day.full_at != null) return { cls: 'ok', title: 'Nabije se na 100 %' };
  if (day.charges) return { cls: 'part', title: 'Nenabije se na 100 %' };
  return { cls: 'none', title: 'Nenabíjí se' };
}

const MUTED_DASH = '<span class="muted">—</span>';

function hasGrid(day: PlannerDay): boolean {
  return day.kind !== 'past' && !!day.grid_kwh && day.grid_windows.length > 0;
}

/** AC IN od / do: SoC a pod ním čas, kdy noční nabíjení ze sítě začne / skončí. */
function gridEdgeCell(day: PlannerDay, edge: 'start' | 'end'): string {
  if (!hasGrid(day)) return MUTED_DASH;
  const soc = edge === 'start' ? day.grid_start_soc : day.grid_end_soc;
  const at =
    (edge === 'start' ? day.grid_start_at : day.grid_end_at) ??
    (edge === 'start' ? day.grid_windows[0].start : day.grid_windows[day.grid_windows.length - 1].end);
  const time = escapeHtml(fmtTime.format(Date.parse(at)));
  return soc == null ? `<small>${time}</small>` : `${escapeHtml(formatSoc(soc))}<small>${time}</small>`;
}

/** Ze sítě: kWh a pod tím, jak dlouho se nabíjí (okna v bublině). */
function gridAmountCell(day: PlannerDay): string {
  if (!hasGrid(day)) return MUTED_DASH;
  let minutes = 0;
  for (const w of day.grid_windows) minutes += (Date.parse(w.end) - Date.parse(w.start)) / 60000;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const dur = h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
  const title = day.grid_windows
    .map((w) => `${fmtTime.format(Date.parse(w.start))}–${fmtTime.format(Date.parse(w.end))}`)
    .join(', ');
  return `<span title="${escapeHtml(title)}">${escapeHtml(formatEnergy(day.grid_kwh))}<small class="dur">${dur}</small></span>`;
}

class FveFlowForecastDialog extends HTMLElement {
  private readonly _dialog: HTMLDialogElement;
  private readonly _note: HTMLDivElement;
  private readonly _tbody: HTMLTableSectionElement;
  private _options?: ForecastDialogOptions;
  private _timer?: number;
  private _stamp = '';

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
          width: min(1000px, calc(100vw - 32px));
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
          padding: 10px 14px;
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
        /* Volné místo rozdělit mezi sloupce, ne jen před AC IN. */
        th:nth-child(1) {
          width: 13%;
        }
        th:nth-child(2),
        th:nth-child(3) {
          width: 12%;
        }
        th:nth-child(4),
        th:nth-child(5),
        th:nth-child(6),
        th:nth-child(7) {
          width: 10%;
        }
        th:nth-child(8) {
          width: 12%;
        }
        th {
          white-space: nowrap;
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
          /* Na mobilu se nevejde: spotřeba je u předpovědi stejná, kWh ze sítě je
             vidět z rozdílu SoC od / do (v bublině okna), hlavičky jen „od“ / „do“. */
          .col-load,
          .col-grid,
          .m-hide,
          .dur {
            display: none;
          }
        }
        td.muted,
        span.muted {
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
        .empty {
          padding: 24px 0;
          color: var(--secondary-text-color, rgba(220, 235, 245, 0.6));
          text-align: center;
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
                <th class="col-load">Spotřeba</th>
                <th title="Nejnižší SoC, než se baterie začne nabíjet">Ráno</th>
                <th title="Nejvyšší SoC dne, u 100 % čas nabití">Max</th>
                <th title="SoC a čas, kdy noční nabíjení ze sítě (AC IN) začne"><span class="m-hide">AC IN </span>od</th>
                <th title="SoC a čas, kdy nabíjení ze sítě skončí"><span class="m-hide">AC IN </span>do</th>
                <th class="col-grid" title="Kolik se nabije ze sítě a jak dlouho (okna v bublině)">Ze sítě</th>
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
    this._dialog.addEventListener('close', () => {
      window.clearInterval(this._timer);
      this.remove();
    });
  }

  public show(options: ForecastDialogOptions): void {
    this._options = options;
    this._render(true);
    this._dialog.showModal();
    this._timer = window.setInterval(() => this._render(false), REFRESH_MS);
  }

  private _render(force: boolean): void {
    const hass = this._options?.getHass();
    const p = this._options?.planner;
    if (!hass || !p) return;
    const stamp = [p.forecast]
      .map((id) => (id ? hass.states[id]?.last_updated ?? hass.states[id]?.state : ''))
      .join('|');
    if (!force && stamp === this._stamp) return;
    this._stamp = stamp;

    const forecast = hass.states[p.forecast];
    const days = plannerDays(hass, p);
    const risk = days.some((d) => d.kind !== 'past' && d.risk);
    const today = days.find((d) => d.kind === 'today' || d.kind === 'tomorrow');
    this.style.setProperty('--dialog-accent', risk ? '#ff5252' : today?.full_at ? '#69f0ae' : '#ffb74d');

    this._tbody.replaceChildren();
    if (!days.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="9" class="empty">Integrace zatím prognózu nespočítala.</td>';
      this._tbody.append(tr);
    }
    for (const day of days) {
      const tr = document.createElement('tr');
      tr.classList.add(day.kind);
      if (day.risk) tr.classList.add('risk');
      const state = dayState(day);
      const trough =
        day.trough == null
          ? '—'
          : `${escapeHtml(formatSoc(day.trough))}<small>${escapeHtml(formatAt(day.trough_at))}</small>`;
      const max =
        day.peak == null
          ? day.trough == null
            ? '—'
            : '<small>nenabíjí</small>'
          : `${escapeHtml(formatSoc(day.full_at != null ? 100 : day.peak))}<small>${escapeHtml(
              formatAt(day.full_at ?? day.peak_at),
            )}</small>`;
      tr.innerHTML = `
        <td>${escapeHtml(dayLabel(day))}</td>
        <td class="${day.pv_kwh == null ? 'muted' : ''}">${escapeHtml(kwh(day.pv_kwh))}</td>
        <td class="col-load ${day.load_kwh == null ? 'muted' : ''}">${escapeHtml(kwh(day.load_kwh))}</td>
        <td>${trough}</td>
        <td>${max}</td>
        <td>${gridEdgeCell(day, 'start')}</td>
        <td>${gridEdgeCell(day, 'end')}</td>
        <td class="col-grid">${gridAmountCell(day)}</td>
        <td>${state.cls ? `<span class="dot ${state.cls}" title="${state.title}"></span>` : ''}</td>
      `;
      this._tbody.append(tr);
    }

    const source = (forecast?.attributes.load_source as LoadSource | undefined) ?? 'dc';
    this._note.replaceChildren(
      ...[
        'Prognózu a plán nabíjení počítá integrace Hybrid Energy po 15 minutách: výroba podle Solcastu minus spotřeba.',
        'Ráno = nejnižší SoC, než začnou nabíjet panely (po případném nočním nabíjení ze sítě).',
        'Max = nejvyšší SoC dne (u 100 % čas nabití).',
        'AC IN od / do = SoC a čas, kdy noční nabíjení ze sítě před daným dnem začne a skončí; Ze sítě = kolik kWh a jak dlouho. Dobíjí se jen rezerva do další noci, zbytek dobijí panely.',
        LOAD_TEXT[source] ?? LOAD_TEXT.dc,
      ].map((text) => {
        const line = document.createElement('p');
        line.textContent = text;
        return line;
      }),
    );
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

/** Otevře okno s prognózou výdrže a plánem nabíjení z integrace Hybrid Energy. */
export function openForecastDialog(options: ForecastDialogOptions): void {
  const dialog = document.createElement(DIALOG_TAG) as FveFlowForecastDialog;
  document.body.append(dialog);
  dialog.show(options);
}
