/**
 * Okno Analýza: 4 karty (Zdroje domu, Patra, FVE a predikce,
 * MPPT · baterie · střídač) za Dnes / Včera / 7 / 30 dní.
 * LitElement s nativním `<dialog>`, ve stejném skleněném stylu jako grafy.
 */
import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import type { FveFlowCardConfig, HomeAssistant } from './types';
import {
  buildPlan,
  loadDay,
  loadRange,
  periodRange,
  PERIOD_DAYS,
  type AnalysisData,
  type AnalysisPeriod,
  type Quantity,
} from './analysis-data';
import {
  renderHeatmap,
  renderColumns,
  renderSankey,
  renderTimeChart,
  type SankeyLink,
  type SankeyNode,
  type Tip,
} from './analysis-charts';
import { C, NEUTRAL } from './palette';
import { formatEnergy, formatPower } from './utils';

export interface AnalysisDialogOptions {
  getHass: () => HomeAssistant | undefined;
  config: FveFlowCardConfig;
  getCapacityKwh: () => number;
}

const TAG = 'fve-flow-analysis-dialog';
const PERIODS: Array<[AnalysisPeriod, string]> = [
  ['last24h', '24 h'],
  ['today', 'Dnes'],
  ['yesterday', 'Včera'],
  ['week', '7 dní'],
  ['d14', '14 dní'],
  ['month', '30 dní'],
  ['d60', '60 dní'],
  ['d90', '90 dní'],
];
const TODAY_TTL_MS = 5 * 60 * 1000;
const FLOOR_COLOR = '#b0bec5';

const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
const fmtTime = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });
const fmtDate = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' });
const fmtWeekday = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short' });
/** Od kolika % SoC je buňka heatmapy SoC orámovaná (baterie prakticky plná). */
const SOC_HIGH = 98;

type Rgb = [number, number, number];

/**
 * Barevné zastávky SoC pro heatmapu — sytý přechod mezi výraznými odstíny,
 * ať se sousední hodnoty neslévají: do `yellow` červená (konec), do `green`
 * sytá oranžová, 40–60 % přes fialovou k modré, 60–80 % k světle zelené,
 * 80–100 % do tmavě zelené (≥ 98 % navíc bílý rámeček). Dvě zastávky na
 * stejné pozici = ostrý přechod.
 */
function socStops(yellow: number, green: number): Array<[number, Rgb]> {
  const mid = green + (60 - green) / 2;
  return [
    [0, [183, 28, 28]],
    [yellow, [255, 82, 82]],
    [yellow, [255, 109, 0]],
    [green, [255, 160, 0]],
    [mid, [171, 71, 188]],
    [60, [41, 121, 255]],
    [80, [118, 255, 3]],
    [90, [0, 200, 83]],
    [100, [0, 121, 58]],
  ];
}

function socScale(soc: number, yellow: number, green: number): string {
  const stops = socStops(yellow, green);
  const v = Math.min(100, Math.max(0, soc));
  let i = stops.findIndex(([p], k) => k > 0 && v < p);
  if (i < 0) i = stops.length - 1;
  const [p0, c0] = stops[i - 1];
  const [p1, c1] = stops[i];
  const t = p1 > p0 ? Math.min(1, Math.max(0, (v - p0) / (p1 - p0))) : 1;
  const c = c0.map((x, k) => Math.round(x + (c1[k] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** CSS gradient legendy ze stejných zastávek jako `socScale`. */
function socGradient(yellow: number, green: number): string {
  const parts = socStops(yellow, green).map(([p, c]) => `rgb(${c.join(', ')}) ${p}%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

/** Barvy fází jako na scéně karty (L2 grafitová místo černé). */
const PHASE_COLORS: Record<string, string> = { L1: '#e0e0e0', L2: '#78909c', L3: '#b87333', Síť: '#4fc3f7' };

const fmtKwh = (v: number | null | undefined) => (v == null ? '—' : formatEnergy(v));
const fmtQ = (q: Quantity) => (q.total == null ? '—' : `${q.approx ? '≈ ' : ''}${formatEnergy(q.total)}`);
const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${nf0.format(v * 100)} %`);
const fmtW = (v: number | null | undefined) => (v == null ? '—' : formatPower(v));
const axisW = (v: number) => (Math.abs(v) >= 1000 ? `${nf1.format(v / 1000)} kW` : `${nf0.format(v)} W`);
const axisKwh = (v: number) => `${nf1.format(v)} kWh`;

const SOURCE_TEXT: Record<Quantity['source'], string> = {
  meter: 'z měřáku energie',
  integral: 'odhad z průběhu výkonu',
  floors: 'součet pater',
  none: 'bez dat',
};

export class FveFlowAnalysisDialog extends LitElement {
  public options?: AnalysisDialogOptions;

  @state() private _period: AnalysisPeriod = 'last24h';
  @state() private _data?: AnalysisData;
  @state() private _loading = false;
  @state() private _error?: string;
  @state() private _cols = 2;
  @state() private _chartW = 520;

  private _cache = new Map<AnalysisPeriod, { at: number; promise: Promise<AnalysisData> }>();
  private _seq = 0;
  private _refresh?: number;
  private _ro?: ResizeObserver;

  /** Zavře okno (odebere se z DOM po události `close`). */
  public close(): void {
    const dlg = this.renderRoot?.querySelector('dialog');
    if (dlg?.open) dlg.close();
    else this.remove();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // Data 24 h / Dnes se obnovují každých 5 min.
    this._refresh = window.setInterval(() => {
      const live = this._period === 'today' || this._period === 'last24h';
      if (live && !this._loading) void this._load(this._period, true);
    }, TODAY_TTL_MS);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._refresh);
    this._ro?.disconnect();
    this._seq++;
  }

  protected firstUpdated(): void {
    this.renderRoot.querySelector('dialog')?.showModal();
    const grid = this.renderRoot.querySelector('.body');
    if (grid) {
      this._ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? 0;
        if (!w) return;
        // Dva sloupce už od šířky tabletu (iPad na šířku).
        const cols = w >= 760 ? 2 : 1;
        const cell = cols === 2 ? (w - 18) / 2 : w;
        const chartW = Math.max(240, Math.floor((cell - 42) / 10) * 10);
        // Mimo callback — změna layoutu uvnitř by hlásila „ResizeObserver loop“.
        window.setTimeout(() => {
          if (cols !== this._cols) this._cols = cols;
          if (chartW !== this._chartW) this._chartW = chartW;
        }, 0);
      });
      this._ro.observe(grid);
    }
    void this._load('last24h');
  }

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  private _get(period: AnalysisPeriod): Promise<AnalysisData> {
    const hit = this._cache.get(period);
    const ttl = period === 'yesterday' ? Infinity : TODAY_TTL_MS;
    if (hit && Date.now() - hit.at < ttl) return hit.promise;
    const hass = this.options?.getHass();
    if (!hass || !this.options) return Promise.reject(new Error('Home Assistant není k dispozici.'));
    const ctx = { hass, plan: buildPlan(this.options.config), capacityKwh: this.options.getCapacityKwh() };
    const range = periodRange(period);
    const promise = range.intraday ? loadDay(ctx, range) : loadRange(ctx, range, this._get('today'));
    this._cache.set(period, { at: Date.now(), promise });
    promise.catch(() => this._cache.delete(period));
    return promise;
  }

  private async _load(period: AnalysisPeriod, force = false): Promise<void> {
    if (force) {
      this._cache.delete(period);
      if (PERIOD_DAYS[period]) this._cache.delete('today');
    }
    const seq = ++this._seq;
    this._period = period;
    this._loading = true;
    this._error = undefined;
    try {
      const data = await this._get(period);
      if (seq !== this._seq || !this.isConnected) return;
      this._data = data;
    } catch (e) {
      if (seq === this._seq) this._error = e instanceof Error && e.message ? e.message : 'Data se nepodařilo načíst.';
    } finally {
      if (seq === this._seq) this._loading = false;
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  protected render(): TemplateResult {
    const d = this._data;
    const stale = !!d && (this._loading || d.range.period !== this._period);
    return html`
      <dialog
        aria-labelledby="an-title"
        @close=${() => this.remove()}
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.close();
        }}
      >
        <header>
          <span class="accent" aria-hidden="true"></span>
          <h2 id="an-title">Analýza energie</h2>
          <div class="periods" role="group" aria-label="Období">
            ${PERIODS.map(
              ([p, label]) => html`<button
                type="button"
                class=${p === this._period ? 'on' : ''}
                aria-pressed=${p === this._period ? 'true' : 'false'}
                @click=${() => void this._load(p)}
              >
                ${label}
              </button>`,
            )}
          </div>
          <span class="range">${this._rangeText(d)}</span>
          <button type="button" class="icon" title="Obnovit data" @click=${() => void this._load(this._period, true)}>
            ↻
          </button>
          <button type="button" class="icon" title="Zavřít" aria-label="Zavřít" @click=${() => this.close()}>×</button>
        </header>
        <div class="progress${this._loading ? ' on' : ''}"></div>
        <div
          class="body${stale ? ' stale' : ''}"
          @pointermove=${(e: PointerEvent) => this._onPointer(e)}
          @pointerdown=${(e: PointerEvent) => this._onPointer(e)}
          @pointerleave=${(e: PointerEvent) => {
            if (e.pointerType !== 'touch') this._hideTip();
          }}
          @scroll=${() => this._hideTip()}
        >
          ${this._error
            ? html`<div class="error">
                ${this._error}
                <button type="button" @click=${() => void this._load(this._period, true)}>Zkusit znovu</button>
              </div>`
            : nothing}
          ${d ? this._content(d) : this._skeleton()}
        </div>
        <div class="tip" role="tooltip" hidden></div>
      </dialog>
    `;
  }

  private _rangeText(d?: AnalysisData): string {
    if (!d || d.range.period !== this._period) return this._loading ? 'načítám…' : '';
    if (d.range.period === 'today' || d.range.period === 'last24h') {
      return d.asOf ? `${d.range.label} · data k ${fmtTime.format(d.asOf)}` : d.range.label;
    }
    return d.range.label;
  }

  private _skeleton(): TemplateResult {
    return html`<div class="grid cols-${this._cols}">
      ${[0, 1, 2, 3].map(() => html`<article class="card skeleton"><div></div><div></div><div></div></article>`)}
    </div>`;
  }

  private _content(d: AnalysisData): TemplateResult {
    return html`
      <div class="grid cols-${this._cols}">
        ${this._cardSources(d)} ${this._cardFloors(d)} ${this._cardPv(d)} ${this._cardDc(d)}
        ${this._cardPhases(d)}
      </div>
      ${d.warnings.length
        ? html`<div class="foot">${d.warnings.map((w) => html`<p class="warn">${w}</p>`)}</div>`
        : nothing}
    `;
  }

  /** Formáty bubliny časových grafů (u klouzavých 24 h i den v týdnu). */
  private _tipFmt(d: AnalysisData): { valueFormat: (v: number) => string; timeFormat?: (t: number) => string } {
    return {
      valueFormat: formatPower,
      timeFormat: d.range.period === 'last24h' ? (t) => `${fmtWeekday.format(t)} ${fmtTime.format(t)}` : undefined,
    };
  }

  // -------------------------------------------------------------------------
  // Bublina s hodnotami — jeden plovoucí prvek, obsah z data-tip pod ukazatelem.
  // Mimo Lit render (pohyb myši nesmí překreslovat grafy).
  // -------------------------------------------------------------------------

  private _tipTarget?: Element;

  private _onPointer(e: PointerEvent): void {
    const root = this.renderRoot as ShadowRoot;
    const hit = root.elementFromPoint?.(e.clientX, e.clientY) ?? null;
    const el = hit?.closest('[data-tip]') ?? null;
    if (!el) {
      this._hideTip();
      return;
    }
    this._showTip(el, e.clientX, e.clientY, e.pointerType === 'touch');
  }

  private _showTip(el: Element, cx: number, cy: number, touch: boolean): void {
    const root = this.renderRoot as ShadowRoot;
    const tipEl = root.querySelector<HTMLElement>('.tip');
    const dlg = root.querySelector('dialog');
    if (!tipEl || !dlg) return;
    if (el !== this._tipTarget) {
      let tip: Tip;
      try {
        tip = JSON.parse(el.getAttribute('data-tip') ?? '') as Tip;
      } catch {
        this._hideTip();
        return;
      }
      this._tipTarget?.removeAttribute('data-active');
      el.setAttribute('data-active', '');
      this._tipTarget = el;
      const head = document.createElement('div');
      head.className = 'tip-h';
      head.textContent = tip.h;
      const rows = tip.r.map((r) => {
        const row = document.createElement('div');
        row.className = 'tip-r';
        const dot = document.createElement('i');
        if (r.c) dot.style.background = r.c;
        else dot.className = 'none';
        const label = document.createElement('span');
        label.textContent = r.l;
        const value = document.createElement('b');
        value.textContent = r.v;
        row.append(dot, label, value);
        return row;
      });
      const note = tip.n ? document.createElement('div') : null;
      if (note) {
        note.className = 'tip-n';
        note.textContent = tip.n!;
      }
      tipEl.replaceChildren(head, ...rows, ...(note ? [note] : []));
      tipEl.hidden = false;
    }
    const box = dlg.getBoundingClientRect();
    const x = cx - box.left;
    const y = cy - box.top;
    const tw = tipEl.offsetWidth;
    const th = tipEl.offsetHeight;
    // Vedle kurzoru; na dotyku nad prstem, ať ho prst nezakrývá.
    let left = touch ? x - tw / 2 : x + 16;
    if (!touch && left + tw > box.width - 8) left = x - 16 - tw;
    left = Math.max(8, Math.min(box.width - tw - 8, left));
    let top = touch ? y - th - 28 : y - th / 2;
    if (top < 8) top = touch ? y + 28 : 8;
    top = Math.min(box.height - th - 8, top);
    tipEl.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  private _hideTip(): void {
    this._tipTarget?.removeAttribute('data-active');
    this._tipTarget = undefined;
    const tipEl = this.renderRoot?.querySelector<HTMLElement>('.tip');
    if (tipEl) tipEl.hidden = true;
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('_data') || changed.has('_chartW') || changed.has('_cols')) this._hideTip();
  }

  private _chart(h: number, content: TemplateResult, label: string, width?: number): TemplateResult {
    const w = width ?? this._chartW;
    return html`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label=${label}>${content}</svg>`;
  }

  private _legend(items: Array<[string, string, string?]>): TemplateResult {
    return html`<div class="legend">
      ${items.map(
        ([label, color, kind]) => html`<span><i class="${kind ?? 'dot'}" style="--c:${color}"></i>${label}</span>`,
      )}
    </div>`;
  }

  private _kpi(label: string, value: string, color?: string, title?: string, sub?: string): TemplateResult {
    return html`<div class="kpi" title=${title ?? ''}>
      <span class="k-label">${label}</span>
      <span class="k-value" style=${color ? `color:${color}` : ''}>${value}</span>
      ${sub ? html`<span class="k-sub">${sub}</span>` : nothing}
    </div>`;
  }

  private _srcTitle(q: Quantity): string {
    return `Zdroj: ${SOURCE_TEXT[q.source]}${q.approx ? ' (odhad)' : ''}`;
  }

  /** 1 — Zdroje domu: FVE vs síť, soběstačnost. */
  private _cardSources(d: AnalysisData): TemplateResult {
    const fShare = d.house && d.fve.total != null ? d.fve.total / d.house : null;
    const gShare = d.house && d.grid.total != null ? d.grid.total / d.house : null;
    const s = d.series;
    const chart = s
      ? this._chart(
          240,
          renderTimeChart({
            width: this._chartW,
            height: 240,
            grid: s.grid,
            x0: d.range.start,
            x1: d.range.dayEnd,
            series: [
              { label: 'FVE', color: C.island, values: s.ac, kind: 'area', stack: true },
              ...(d.gridConfigured ? [{ label: 'Síť', color: C.grid, values: s.gridW, kind: 'area' as const, stack: true }] : []),
            ],
            now: d.range.period === 'today' ? Date.now() : null,
            yFormat: axisW,
            ...this._tipFmt(d),
          }),
          'Průběh odběru z FVE a ze sítě',
        )
      : this._chart(
          230,
          renderColumns({
            width: this._chartW,
            height: 230,
            days: d.range.days,
            mode: 'stacked',
            partialLast: true,
            series: [
              { label: 'FVE', color: C.island, values: d.range.days.map((x) => d.fve.byDay.get(x.key) ?? null) },
              ...(d.gridConfigured
                ? [{ label: 'Síť', color: C.grid, values: d.range.days.map((x) => d.grid.byDay.get(x.key) ?? null) }]
                : []),
            ],
            yFormat: axisKwh,
            valueFormat: formatEnergy,
          }),
          'Denní spotřeba z FVE a ze sítě',
        );
    return html`<article class="card">
      <h3>Zdroje domu</h3>
      <div class="kpis">
        ${this._kpi('Spotřeba domu', fmtKwh(d.house))}
        ${this._kpi('Z FVE', fmtQ(d.fve), C.island, this._srcTitle(d.fve), fShare != null ? `${fmtPct(fShare)} spotřeby` : undefined)}
        ${d.gridConfigured
          ? this._kpi('Ze sítě', fmtQ(d.grid), C.grid, this._srcTitle(d.grid), gShare != null ? `${fmtPct(gShare)} spotřeby` : undefined)
          : nothing}
        ${this._kpi('Soběstačnost', fmtPct(d.selfSufficiency), C.ok)}
      </div>
      ${fShare != null && gShare != null && fShare + gShare > 0
        ? html`<div class="split" title="Podíl FVE a sítě na spotřebě domu">
            <span style="flex:${fShare};background:${C.island}"></span>
            <span style="flex:${gShare};background:${C.grid}"></span>
          </div>`
        : nothing}
      ${chart}
      ${this._legend([['FVE (měnič)', C.island], ...(d.gridConfigured ? [['Síť', C.grid] as [string, string]] : [])])}
    </article>`;
  }

  /** 2 — Patra: tokový diagram hlavních dodávek do pater + tabulka. */
  private _cardFloors(d: AnalysisData): TemplateResult {
    if (!d.floors.length) {
      return html`<article class="card"><h3>Patra</h3><p class="muted">Karta nemá nakonfigurovaná patra.</p></article>`;
    }
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const pctOf = (v: number, total: number | null) => (total && total > 0 ? ` (${fmtPct(v / total)})` : '');
    if (d.fveConfigured) nodes.push({ id: 'fve', label: 'FVE (měnič)', sub: fmtQ(d.fve), column: 0, color: C.island });
    if (d.gridConfigured) nodes.push({ id: 'grid', label: d.gridName, sub: fmtQ(d.grid), column: 0, color: C.grid });
    d.floors.forEach((f, i) => {
      nodes.push({
        id: `f${i}`,
        label: f.name,
        sub: `${f.approx && f.total != null ? '≈ ' : ''}${fmtKwh(f.total)}${f.share != null ? ` · ${fmtPct(f.share)}` : ''}`,
        column: 1,
        color: FLOOR_COLOR,
        keep: true,
      });
      if (f.fve != null)
        links.push({ source: 'fve', target: `f${i}`, value: f.fve, title: `FVE → ${f.name} · ${formatEnergy(f.fve)}${pctOf(f.fve, d.fve.total)}` });
      if (f.grid != null)
        links.push({ source: 'grid', target: `f${i}`, value: f.grid, title: `Síť → ${f.name} · ${formatEnergy(f.grid)}${pctOf(f.grid, d.grid.total)}` });
    });
    const uF = d.unmeasured.fve ?? 0;
    const uG = d.unmeasured.grid ?? 0;
    if (uF + uG > 0) {
      nodes.push({ id: 'u', label: 'Neměřeno', sub: formatEnergy(uF + uG), column: 1, color: NEUTRAL });
      if (uF > 0) links.push({ source: 'fve', target: 'u', value: uF, faint: true, title: `FVE → neměřeno · ${formatEnergy(uF)}` });
      if (uG > 0) links.push({ source: 'grid', target: 'u', value: uG, faint: true, title: `Síť → neměřeno · ${formatEnergy(uG)}` });
    }
    const right = nodes.filter((n) => n.column === 1).length;
    const h = Math.max(260, Math.min(460, 58 * right + 40));
    const floorsPartial = [d.balanceDays.fve, d.balanceDays.grid].some(
      (x) => x != null && x < d.balanceDays.total,
    );
    const mismatch = [
      d.mismatch.fve ? `FVE: patra o ${formatEnergy(d.mismatch.fve)} víc než měnič` : '',
      d.mismatch.grid ? `síť: patra o ${formatEnergy(d.mismatch.grid)} víc než přívod` : '',
    ].filter(Boolean);
    return html`<article class="card">
      <h3>Patra</h3>
      ${this._chart(h, renderSankey({ id: 'an-floors', width: this._chartW, height: h, nodes, links }), 'Tok energie do pater')}
      <table>
        <thead>
          <tr><th>Patro</th><th>FVE</th><th>Síť</th><th>Celkem</th><th>Podíl</th></tr>
        </thead>
        <tbody>
          ${d.floors.map(
            (f) => html`<tr>
              <td>${f.name}</td>
              <td style="color:${C.island}">${f.hasFve ? fmtKwh(f.fve) : ''}</td>
              <td style="color:${C.grid}">${f.hasGrid ? fmtKwh(f.grid) : ''}</td>
              <td>${f.approx && f.total != null ? '≈ ' : ''}${fmtKwh(f.total)}</td>
              <td>${fmtPct(f.share)}</td>
            </tr>`,
          )}
          ${uF + uG > 0
            ? html`<tr class="muted-row">
                <td>Neměřeno</td>
                <td>${uF > 0 ? formatEnergy(uF) : ''}</td>
                <td>${uG > 0 ? formatEnergy(uG) : ''}</td>
                <td>${formatEnergy(uF + uG)}</td>
                <td>${fmtPct(d.house ? (uF + uG) / d.house : null)}</td>
              </tr>`
            : nothing}
        </tbody>
      </table>
      ${mismatch.length ? html`<p class="warn">Nesoulad měřáků — ${mismatch.join('; ')}.</p>` : nothing}
      ${floorsPartial
        ? html`<p class="note">
            Neměřeno a nesoulad jen za dny, kdy mají data hlavní měřák i všechna patra
            (FVE ${d.balanceDays.fve ?? '—'}, síť ${d.balanceDays.grid ?? '—'} z ${d.balanceDays.total} dní).
          </p>`
        : nothing}
    </article>`;
  }

  /** 3 — FVE a predikce Solcast. */
  private _cardPv(d: AnalysisData): TemplateResult {
    const f = d.forecast;
    const today = d.range.period === 'today' || d.range.period === 'last24h';
    const s = d.series;
    const cur = f.curtailed;
    const fullHours = s && d.soc.max != null
      ? s.fullSpans.reduce((sum, sp) => sum + (sp.to - sp.from), 0) / 3600000
      : null;
    const curText = cur
      ? cur.p10 != null && cur.p10 < cur.p50 - 0.05
        ? `≈ ${nf1.format(cur.p10)}–${nf1.format(cur.p50)} kWh`
        : `≈ ${formatEnergy(cur.p50)}`
      : '—';
    const chart = s
      ? this._chart(
          250,
          renderTimeChart({
            width: this._chartW,
            height: 250,
            grid: s.grid,
            x0: d.range.start,
            x1: d.range.dayEnd,
            series: [{ label: 'Skutečnost', color: C.solar, values: s.pv, kind: 'area' }],
            forecast: f.periods.length ? { color: C.forecast, periods: f.periods } : undefined,
            spans: s.fullSpans,
            spanColor: C.ok,
            spanTitle: `Baterie plná (SoC ≥ ${d.fullSocPct} %)`,
            now: today ? Date.now() : null,
            yFormat: axisW,
            ...this._tipFmt(d),
          }),
          'Výroba FVE a predikce Solcast',
        )
      : this._chart(
          230,
          renderColumns({
            width: this._chartW,
            height: 230,
            days: d.range.days,
            mode: 'grouped',
            partialLast: true,
            series: [
              { label: 'Skutečnost', color: C.solar, values: d.range.days.map((x) => d.pv.byDay.get(x.key) ?? null) },
              { label: 'Predikce', color: C.forecast, outline: true, values: d.range.days.map((x) => f.byDay.get(x.key) ?? null) },
            ],
            yFormat: axisKwh,
            valueFormat: formatEnergy,
          }),
          'Denní výroba a predikce',
        );
    return html`<article class="card">
      <h3>FVE a predikce</h3>
      <div class="kpis">
        ${this._kpi('Vyrobeno', fmtQ(d.pv), C.solar, this._srcTitle(d.pv))}
        ${today
          ? this._kpi(d.range.period === 'last24h' ? 'Predikce dnes do teď' : 'Predikce do teď', fmtKwh(f.soFar), C.forecast)
          : this._kpi('Predikce den předem', fmtKwh(f.total), C.forecast)}
        ${this._kpi('Plnění predikce', fmtPct(f.fulfilment))}
        ${today ? this._kpi('Predikce dnes', fmtKwh(f.total)) : nothing}
        ${today ? this._kpi('Zbývá dnes', fmtKwh(f.remaining)) : nothing}
        ${today ? this._kpi('Zítra', fmtKwh(f.tomorrow)) : nothing}
        ${cur
          ? this._kpi(
              'Možná nevyužito',
              curText,
              cur.p50 >= 1 ? C.warn : undefined,
              'Kolik predikce chybělo ve skutečnosti v době, kdy byla baterie plná (p10–p50)',
            )
          : nothing}
        ${s
          ? this._kpi(
              'Baterie plná',
              fullHours == null ? '—' : `${nf1.format(fullHours)} h`,
              undefined,
              `Doba se SoC ≥ ${d.fullSocPct} % — výroba nad spotřebu se nemá kam uložit`,
            )
          : this._kpi('Dní s plnou baterií', d.fullDays == null ? '—' : `${d.fullDays} z ${d.range.days.length}`)}
      </div>
      ${chart}
      ${s
        ? this._legend([
            ['Skutečnost', C.solar],
            ...(f.periods.length
              ? [
                  ['Predikce', C.forecast, 'dash'] as [string, string, string],
                  ['Pásmo p10–p90', C.forecast, 'band'] as [string, string, string],
                ]
              : []),
            ['Baterie plná', C.ok, 'band'],
          ])
        : this._legend([
            ['Skutečnost', C.solar],
            ['Predikce den předem', C.forecast, 'outline'],
          ])}
      ${this._pvHeatmap(d)}
    </article>`;
  }

  /** 4 — MPPT · baterie · střídač: DC bilance. */
  private _cardDc(d: AnalysisData): TemplateResult {
    const s = d.series;
    // Diagram a ztráty jen za společné dny všech čtyř veličin (viz dc.days).
    const dc = d.dc;
    const pv = dc.pv;
    const ch = dc.charge;
    const dis = dc.discharge;
    const ac = dc.ac;
    const dcPartial = dc.days != null && dc.days < d.balanceDays.total;
    const approxKwh = (v: number | null, q: Quantity) =>
      v == null ? '—' : `${q.approx && !dcPartial ? '≈ ' : ''}${formatEnergy(v)}`;
    const lossPct = dc.losses != null && dc.inverterIn ? dc.losses / dc.inverterIn : null;

    let sankey: TemplateResult | typeof nothing = nothing;
    if (pv != null && ch != null && dis != null && ac != null) {
      const fromPv = Math.min(ch, pv);
      const nodes: SankeyNode[] = [
        { id: 'pv', label: 'FVE (MPPT)', sub: approxKwh(pv, d.pv), column: 0, color: C.solar },
        { id: 'dis', label: 'Z baterie', sub: approxKwh(dis, d.discharge), column: 0, color: C.discharge },
        { id: 'chg', label: 'Do baterie', sub: approxKwh(ch, d.charge), column: 1, color: C.charge },
        { id: 'inv', label: 'Střídač', sub: fmtKwh(dc.inverterIn), column: 1, color: C.ac },
        { id: 'house', label: 'Dům (AC)', sub: approxKwh(ac, d.fve), column: 2, color: C.island },
        { id: 'loss', label: 'Ztráty', sub: fmtKwh(dc.losses), column: 2, color: C.loss },
      ];
      const links: SankeyLink[] = [
        { source: 'pv', target: 'chg', value: fromPv, title: `FVE → baterie · ${formatEnergy(fromPv)}` },
        { source: 'pv', target: 'inv', value: Math.max(0, pv - ch), title: `FVE → střídač · ${formatEnergy(Math.max(0, pv - ch))}` },
        { source: 'dis', target: 'inv', value: dis, title: `Baterie → střídač · ${formatEnergy(dis)}` },
        { source: 'inv', target: 'house', value: ac, title: `Střídač → dům · ${formatEnergy(ac)}` },
        ...(dc.losses ? [{ source: 'inv', target: 'loss', value: dc.losses, faint: true, title: `Ztráty · ${formatEnergy(dc.losses)}` }] : []),
      ];
      sankey = html`${dcPartial
          ? html`<p class="note">Bilance za ${dc.days} z ${d.balanceDays.total} dní — jen dny, kdy mají data všechny měřáky.</p>`
          : nothing}
        ${this._chart(
          280,
          renderSankey({ id: 'an-dc', width: this._chartW, height: 280, nodes, links, pad: 40 }),
          'DC bilance',
        )}`;
    }

    const charts = s
      ? html`${this._chart(
            240,
            renderTimeChart({
              width: this._chartW,
              height: 240,
              grid: s.grid,
              x0: d.range.start,
              x1: d.range.dayEnd,
              series: [
                { label: 'FVE', color: C.solar, values: s.pv, kind: 'area' },
                { label: 'Nabíjení', negLabel: 'Vybíjení', color: C.charge, negColor: C.discharge, values: s.battery, kind: 'area' },
                { label: 'Střídač', color: C.ac, values: s.ac, kind: 'line' },
              ],
              now: d.range.period === 'today' ? Date.now() : null,
              yFormat: axisW,
              ...this._tipFmt(d),
            }),
            'Výkon FVE, baterie a střídače',
          )}
          ${this._chart(
            76,
            renderTimeChart({
              width: this._chartW,
              height: 76,
              grid: s.grid,
              x0: d.range.start,
              x1: d.range.dayEnd,
              series: [{ label: 'SoC', color: C.ok, values: s.soc, kind: 'line' }],
              yFixed: [0, 100],
              refLine: { value: d.fullSocPct, color: C.ok },
              compact: true,
              now: d.range.period === 'today' ? Date.now() : null,
              yFormat: (v) => `${nf0.format(v)} %`,
              timeFormat: this._tipFmt(d).timeFormat,
            }),
            'SoC baterie',
          )}
          ${this._legend([
            ['FVE', C.solar],
            ['Nabíjení', C.charge],
            ['Vybíjení', C.discharge],
            ['Střídač (AC)', C.ac, 'line'],
            ['SoC', C.ok, 'line'],
          ])}`
      : html`${this._chart(
            230,
            renderColumns({
              width: this._chartW,
              height: 230,
              days: d.range.days,
              mode: 'grouped',
              partialLast: true,
              series: [
                { label: 'Z baterie', color: C.discharge, values: d.range.days.map((x) => d.discharge.byDay.get(x.key) ?? null) },
                { label: 'Spotřeba z FVE', color: C.ac, values: d.range.days.map((x) => d.fve.byDay.get(x.key) ?? null) },
              ],
              refLine:
                d.capacityKwh > 0
                  ? { value: d.capacityKwh, color: C.charge, label: `kapacita ${formatEnergy(d.capacityKwh)}` }
                  : undefined,
              yFormat: axisKwh,
              valueFormat: formatEnergy,
            }),
            'Denně z baterie vs. spotřeba z FVE',
          )}
          ${this._legend([
            ['Z baterie', C.discharge],
            ['Spotřeba z FVE (AC)', C.ac],
            ...(d.capacityKwh > 0 ? [['Kapacita baterie / den', C.charge, 'dash'] as [string, string, string]] : []),
          ])}`;

    // Baterie vs. spotřeba: kolik z teoretické kapacity za období se opravdu vybilo.
    const periodDays = d.range.intraday ? 1 : d.range.days.length;
    const capTotal = d.capacityKwh > 0 ? d.capacityKwh * periodDays : null;
    const utilization = capTotal && d.discharge.total != null ? d.discharge.total / capTotal : null;
    const batShare = d.discharge.total != null && d.fve.total ? d.discharge.total / d.fve.total : null;

    return html`<article class="card">
      <h3>MPPT · baterie · střídač</h3>
      <div class="kpis">
        ${this._kpi('FVE (MPPT)', fmtQ(d.pv), C.solar, this._srcTitle(d.pv))}
        ${this._kpi('Nabito', fmtQ(d.charge), C.charge, this._srcTitle(d.charge))}
        ${this._kpi('Vybito', fmtQ(d.discharge), C.discharge, this._srcTitle(d.discharge))}
        ${this._kpi('AC výstup', fmtQ(d.fve), C.ac, this._srcTitle(d.fve))}
        ${this._kpi(
          'Ztráty',
          dc.mismatch ? 'nesedí' : dc.losses == null ? '—' : formatEnergy(dc.losses),
          dc.mismatch ? C.warn : undefined,
          'Vstup střídače (FVE − nabito + vybito) minus AC výstup',
          lossPct != null && !dc.mismatch ? `${fmtPct(lossPct)} vstupu` : undefined,
        )}
        ${this._kpi('Účinnost', fmtPct(dc.efficiency))}
        ${this._kpi(
          'SoC min–max',
          d.soc.min != null && d.soc.max != null ? `${nf0.format(d.soc.min)}–${nf0.format(d.soc.max)} %` : '—',
          d.soc.min != null && d.soc.min < d.minSocPct ? C.crit : undefined,
        )}
        ${this._kpi('Ekv. cyklů', dc.cycles == null ? '—' : nf2.format(dc.cycles), undefined, 'Vybitá energie / kapacita baterie')}
      </div>
      <h4>Baterie vs. spotřeba</h4>
      <div class="kpis">
        ${this._kpi(
          periodDays > 1 ? `Kapacita × ${periodDays} dní` : 'Kapacita baterie',
          fmtKwh(capTotal),
          C.charge,
          'Kolik energie by baterie dodala, kdyby se každý den vybila celá',
          d.capacityKwh > 0 && periodDays > 1 ? `${formatEnergy(d.capacityKwh)} / den` : undefined,
        )}
        ${this._kpi('Vybito z baterie', fmtQ(d.discharge), C.discharge, this._srcTitle(d.discharge))}
        ${this._kpi('Využití kapacity', fmtPct(utilization), undefined, 'Vybito / (kapacita × počet dní)')}
        ${this._kpi(
          'Baterie pokryla',
          fmtPct(batShare),
          undefined,
          'Podíl vybité energie na spotřebě domu z FVE; zbytek šel přímo ze slunce',
          batShare != null ? 'spotřeby z FVE' : undefined,
        )}
      </div>
      ${sankey} ${charts}
      ${this._socHeatmap(d)}
    </article>`;
  }

  /** Heatmapa výroby FVE po hodinách (dny × hodiny), plná baterie orámovaná. */
  private _pvHeatmap(d: AnalysisData): TemplateResult | typeof nothing {
    const hm = d.pvHeatmap;
    if (!hm || !hm.values.size) return nothing;
    const { tpl, height } = renderHeatmap({
      width: this._chartW,
      days: hm.days,
      values: hm.values,
      marks: hm.full,
      hours: [4, 22],
      cellColor: (v) => ({
        color: C.solar,
        opacity: 0.06 + 0.94 * Math.pow(hm.max > 0 ? Math.min(1, v / hm.max) : 0, 0.8),
      }),
      markColor: C.forecast,
      markLabel: `Baterie plná (SoC ≥ ${d.fullSocPct} %) — výroba mohla být omezená`,
      valueFormat: formatPower,
      tipLabel: 'Výroba',
      tipExtra: (key, h) => {
        const soc = hm.soc.get(key)?.[h];
        return soc == null ? [] : [{ l: 'SoC', v: `${nf0.format(soc)} %` }];
      },
    });
    return html`<h4 class="spaced">Výroba po hodinách</h4>
      ${this._chart(height, tpl, 'Výroba FVE po hodinách')}
      <div class="legend">
        <span><i class="scale" style="--c:${C.solar}"></i>0 → ${formatPower(hm.max)} (hodinový průměr)</span>
        <span><i class="outline" style="--c:${C.forecast}"></i>baterie plná — výroba mohla být omezená</span>
      </div>`;
  }

  /**
   * Heatmapa SoC baterie (dny × 0–24 h): přechody podle `socStops` (hranice
   * červené a oranžové = battery.yellow_from / green_from), hodiny s průměrným
   * SoC ≥ 98 % mají bílý rámeček.
   */
  private _socHeatmap(d: AnalysisData): TemplateResult | typeof nothing {
    const hm = d.pvHeatmap;
    if (!hm || !hm.soc.size) return nothing;
    const b = this.options?.config.battery ?? {};
    const thresholds = { yellow_from: b.yellow_from ?? 15, green_from: b.green_from ?? 40, severity_invert: b.severity_invert };
    const high = new Map<string, boolean[]>();
    for (const [key, arr] of hm.soc) high.set(key, arr.map((v) => v != null && v >= SOC_HIGH));
    const { tpl, height } = renderHeatmap({
      width: this._chartW,
      days: hm.days,
      values: hm.soc,
      marks: high,
      hours: [0, 24],
      cellColor: (v) => ({ color: socScale(v, thresholds.yellow_from, thresholds.green_from), opacity: 0.92 }),
      markColor: '#ffffff',
      // Bez poznámky v bublině — hodnota SoC je v ní vidět.
      markLabel: '',
      valueFormat: (v) => `${nf0.format(v)} %`,
      tipLabel: 'SoC (průměr)',
      tipExtra: (key, h) => {
        const pv = hm.values.get(key)?.[h];
        return pv == null ? [] : [{ c: C.solar, l: 'Výroba', v: formatPower(pv) }];
      },
    });
    return html`<h4 class="spaced">SoC baterie po hodinách</h4>
      ${this._chart(height, tpl, 'SoC baterie po hodinách')}
      <div class="legend">
        <span class="soc-legend">
          <i class="soc-bar" style="background:${socGradient(thresholds.yellow_from, thresholds.green_from)}"></i>
          ${[0, thresholds.yellow_from, thresholds.green_from, 60, 80, 100].map(
            (p) => html`<b style="left:${p}%">${p}</b>`,
          )}
        </span>
        <span><i class="outline" style="--c:#ffffff"></i>≥ ${SOC_HIGH} %</span>
      </div>`;
  }

  /** 5 — Zatížení fází: kolik musí měnič utáhnout současně (dimenzování). */
  private _cardPhases(d: AnalysisData): TemplateResult {
    const pl = d.phaseLoad;
    if (!pl) {
      return html`<article class="card wide">
        <h3>Zatížení fází</h3>
        <p class="muted">Chybí výkony fází — doplň síť L1–L3 (nebo fáze pater) a výkon měniče.</p>
      </article>`;
    }
    const colorOf = (label: string) =>
      PHASE_COLORS[label] ?? (label.startsWith('FVE') ? C.island : C.grid);
    const when = (t: number) =>
      d.range.intraday ? fmtTime.format(t) : `${fmtDate.format(t)} ${fmtTime.format(t)}`;
    const s = pl.slots;
    // KPI ve skupinách (špičky · průměr · fáze · měnič) s mezerou mezi skupinami.
    const inverter = pl.perSeries.filter((x) => x.label.startsWith('FVE'));
    const phases = pl.perSeries.filter((x) => !x.label.startsWith('FVE'));
    // Karta přes oba sloupce: 2 × (šířka grafu + padding karty 42) + mezera 18 − padding.
    const wideW = this._cols === 2 ? 2 * this._chartW + 60 : this._chartW;
    const chart = s && d.series
      ? html`${this._chart(
            280,
            renderTimeChart({
              width: wideW,
              height: 280,
              grid: d.series.grid,
              x0: d.range.start,
              x1: d.range.dayEnd,
              series: [
                ...s.series.map((x) => ({ label: x.label, color: colorOf(x.label), values: x.mean, kind: 'area' as const, stack: true })),
                { label: 'Horní odhad', color: C.crit, values: s.totalMax, kind: 'line' as const, dash: '4 4' },
              ],
              now: d.range.period === 'today' ? Date.now() : null,
              yFormat: axisW,
              ...this._tipFmt(d),
            }),
            'Zatížení fází',
            wideW,
          )}
          ${this._legend([
            ...s.series.map((x) => [x.label, colorOf(x.label)] as [string, string]),
            ['Horní odhad (součet 5min maxim)', C.crit, 'dash'],
          ])}`
      : html`${this._chart(
            240,
            renderColumns({
              width: wideW,
              height: 240,
              days: d.range.days,
              mode: 'grouped',
              partialLast: true,
              series: [
                { label: 'Špička současně', color: C.warn, values: d.range.days.map((x) => pl.byDay.get(x.key)?.peak ?? null) },
                { label: 'Horní odhad', color: C.crit, outline: true, values: d.range.days.map((x) => pl.byDay.get(x.key)?.upper ?? null) },
              ],
              yFormat: axisW,
              valueFormat: formatPower,
            }),
            'Denní špičky zatížení',
            wideW,
          )}
          ${this._legend([
            ['Špička současně (5min průměr)', C.warn],
            ['Horní odhad (součet maxim)', C.crit, 'outline'],
          ])}`;
    return html`<article class="card wide">
      <h3>Zatížení fází</h3>
      <div class="kpi-groups">
        <div class="kgroup" style="flex-grow:2">
        ${this._kpi(
          'Špička současně',
          pl.peak ? formatPower(pl.peak.value) : '—',
          C.warn,
          'Nejvyšší součet 5min průměrů všech fází ve stejném okamžiku (spodní odhad)',
          pl.peak ? when(pl.peak.at) : undefined,
        )}
        ${this._kpi(
          'Horní odhad',
          pl.upper ? formatPower(pl.upper.value) : '—',
          C.crit,
          'Nejvyšší součet 5min maxim fází — maxima nemusela nastat současně (horní odhad)',
          pl.upper ? when(pl.upper.at) : undefined,
        )}
        </div>
        <div class="kgroup">${this._kpi('Průměrné zatížení', fmtW(pl.avg))}</div>
        ${[phases, inverter].filter((g) => g.length).map(
          (g) => html`<div class="kgroup" style="flex-grow:${g.length}">
            ${g.map((x) =>
              this._kpi(
                `${x.label} špička`,
                fmtW(x.peak),
                colorOf(x.label),
                'Nejvyšší 5min průměr / maximum dané fáze',
                x.upper != null ? `max ${formatPower(x.upper)}` : undefined,
              ),
            )}
          </div>`,
        )}
      </div>
      ${chart}
      <p class="note">
        Skutečný požadavek na měnič leží mezi špičkou současně a horním odhadem. Krátké rázy
        (rozběh motorů, varná konvice) mohou být ještě vyšší — 5min statistiky je vyhlazují.
        ${pl.hourly ? ' Starší dny jsou jen z hodinových statistik, špičky jsou tam podhodnocené.' : ''}
      </p>
    </article>`;
  }

  static styles = css`
    :host {
      --dialog-accent: #4fc3f7;
      color: var(--primary-text-color, #e6f4fa);
      font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
    }
    /* Velikost z ukotvení k okrajům obrazovky (inset), ne z vw / obsahu:
       WebKit v HA aplikaci na iPadu jinak okno zúží a tělo smrskne na nulu. */
    dialog {
      box-sizing: border-box;
      position: fixed;
      inset: 12px 16px;
      margin: auto;
      width: auto;
      min-width: 0;
      max-width: 1640px;
      height: auto;
      max-height: none;
      padding: 0;
      overflow: hidden;
      color: inherit;
      background: rgba(7, 16, 25, 0.98);
      background:
        radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 38%),
        rgba(7, 16, 25, 0.98);
      border: 1px solid rgba(79, 195, 247, 0.48);
      border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
      box-shadow: 0 0 32px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 24px 80px rgba(0, 0, 0, 0.55);
    }
    dialog[open] {
      display: flex;
      flex-direction: column;
    }
    dialog::backdrop {
      background: rgba(0, 7, 13, 0.76);
      backdrop-filter: blur(5px);
    }
    header {
      display: flex;
      flex: 0 0 auto;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 12px;
      min-height: 60px;
      padding: 10px 14px 10px 22px;
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
      margin: 0;
      font-size: 17px;
      font-weight: 650;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .periods {
      display: flex;
      gap: 4px;
      padding: 3px;
      margin-left: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(130, 190, 220, 0.14);
      border-radius: 11px;
    }
    .periods button {
      padding: 6px 12px;
      color: var(--secondary-text-color, #a8bbc6);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 8px;
    }
    .periods button.on {
      color: #0a0f16;
      background: var(--dialog-accent);
    }
    .periods button:not(.on):hover {
      color: var(--primary-text-color, #fff);
      background: rgba(255, 255, 255, 0.07);
    }
    .range {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--secondary-text-color, rgba(220, 235, 245, 0.62));
      font-size: 12px;
      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon {
      display: grid;
      width: 36px;
      height: 36px;
      padding: 0;
      place-items: center;
      color: var(--secondary-text-color, #a8bbc6);
      font: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 50%;
    }
    .icon:hover,
    .icon:focus-visible {
      color: var(--primary-text-color, #fff);
      outline: 1px solid var(--dialog-accent);
    }
    .progress {
      flex: 0 0 auto;
      height: 2px;
      background: transparent;
    }
    .progress.on {
      background: linear-gradient(90deg, transparent, var(--dialog-accent), transparent);
      background-size: 50% 100%;
      animation: an-progress 1.1s linear infinite;
    }
    @keyframes an-progress {
      from {
        background-position: -50% 0;
      }
      to {
        background-position: 150% 0;
      }
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
      padding: 16px 18px 18px;
      overflow: auto;
      overscroll-behavior: contain;
      transition: opacity 0.2s ease;
    }
    .body.stale {
      opacity: 0.5;
    }
    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: 1fr;
    }
    .grid.cols-2 {
      grid-template-columns: 1fr 1fr;
    }
    .card.wide {
      grid-column: 1 / -1;
    }
    h4.spaced {
      margin-top: 22px;
    }
    .legend .soc-legend {
      position: relative;
      display: inline-block;
      width: 220px;
      height: 26px;
      margin-right: 10px;
    }
    .legend i.soc-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 10px;
      border-radius: 2px;
    }
    .legend .soc-legend b {
      position: absolute;
      top: 12px;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 400;
      white-space: nowrap;
    }
    .legend .soc-legend b:last-child::after {
      content: ' %';
    }
    .legend i.scale {
      width: 42px;
      height: 10px;
      border-radius: 2px;
      background: linear-gradient(90deg, rgba(0, 230, 118, 0.08), var(--c));
    }
    h4 {
      margin: 4px 0 10px;
      color: rgba(226, 240, 248, 0.55);
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .card {
      min-width: 0;
      padding: 18px 20px 20px;
      background: rgba(14, 24, 34, 0.72);
      border: 1px solid rgba(130, 190, 220, 0.12);
      border-radius: 16px;
    }
    h3 {
      margin: 0 0 14px;
      color: rgba(226, 240, 248, 0.55);
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-groups {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 28px;
      margin-bottom: 16px;
    }
    .kgroup {
      display: flex;
      flex: 1 1 auto;
      flex-wrap: wrap;
      gap: 10px;
    }
    .kgroup .kpi {
      flex: 1 1 0;
      min-width: 120px;
    }
    .kpi {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.035);
      border-radius: 10px;
    }
    .k-label {
      overflow: hidden;
      color: rgba(226, 240, 248, 0.55);
      font-size: 12.5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .k-value {
      font-size: 19px;
      font-weight: 700;
      white-space: nowrap;
    }
    .k-sub {
      color: rgba(226, 240, 248, 0.5);
      font-size: 12px;
    }
    .split {
      display: flex;
      height: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      border-radius: 4px;
      gap: 2px;
    }
    .split span {
      min-width: 2px;
      opacity: 0.85;
    }
    .tip {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 5;
      min-width: 150px;
      max-width: 280px;
      padding: 8px 11px;
      color: #e2f0f8;
      font-size: 12.5px;
      pointer-events: none;
      background: rgba(10, 22, 34, 0.97);
      border: 1px solid rgba(79, 195, 247, 0.38);
      border-radius: 10px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
    }
    .tip[hidden] {
      display: none;
    }
    .tip-h {
      margin-bottom: 4px;
      color: rgba(226, 240, 248, 0.85);
      font-weight: 600;
    }
    .tip-r {
      display: flex;
      align-items: center;
      gap: 7px;
      line-height: 1.6;
    }
    .tip-r i {
      flex: none;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .tip-r i.none {
      background: none;
    }
    .tip-r span {
      flex: 1;
      color: rgba(226, 240, 248, 0.68);
    }
    .tip-r b {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .tip-n {
      margin-top: 5px;
      color: rgba(226, 240, 248, 0.55);
      font-size: 11.5px;
    }
    .hov-line,
    .hov-band {
      fill: transparent;
    }
    .hov-line[data-active] {
      fill: rgba(226, 240, 248, 0.28);
    }
    .hov-band[data-active] {
      fill: rgba(226, 240, 248, 0.07);
    }
    rect.cell[data-active] {
      stroke: #ffffff;
      stroke-width: 2;
      stroke-opacity: 1;
    }
    svg.chart {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
      /* Vodorovný tah prstem = přejíždění bubliny, svislý = scroll okna. */
      touch-action: pan-y;
    }
    svg.chart + svg.chart {
      margin-top: 6px;
    }
    .axis {
      fill: rgba(226, 240, 248, 0.45);
      font-size: 11.5px;
    }
    .empty {
      fill: rgba(226, 240, 248, 0.45);
      font-size: 12px;
    }
    .s-name {
      fill: rgba(226, 240, 248, 0.92);
      font-size: 13.5px;
      font-weight: 600;
    }
    .s-sub {
      fill: rgba(226, 240, 248, 0.6);
      font-size: 12.5px;
    }
    .halo {
      paint-order: stroke;
      stroke: rgba(7, 16, 25, 0.9);
      stroke-width: 3px;
    }
    .link {
      stroke-opacity: 0.38;
      transition: stroke-opacity 0.15s ease;
    }
    .link.faint {
      stroke-opacity: 0.18;
    }
    .link:hover {
      stroke-opacity: 0.65;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      margin-top: 10px;
      color: rgba(226, 240, 248, 0.65);
      font-size: 13px;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend i {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--c);
    }
    .legend i.line,
    .legend i.dash {
      height: 0;
      width: 14px;
      border-radius: 0;
      border-top: 2px solid var(--c);
      background: none;
    }
    .legend i.dash {
      border-top-style: dashed;
    }
    .legend i.band {
      border-radius: 2px;
      background: var(--c);
      opacity: 0.35;
    }
    .legend i.outline {
      border-radius: 2px;
      background: none;
      border: 1.5px dashed var(--c);
    }
    table {
      width: 100%;
      margin-top: 14px;
      border-collapse: collapse;
      font-size: 14px;
    }
    th,
    td {
      padding: 8px 8px;
      text-align: right;
      border-bottom: 1px solid rgba(130, 190, 220, 0.08);
      white-space: nowrap;
    }
    th:first-child,
    td:first-child {
      padding-left: 0;
      text-align: left;
    }
    th {
      color: rgba(226, 240, 248, 0.5);
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .muted-row td {
      color: rgba(226, 240, 248, 0.5);
    }
    .muted {
      color: rgba(226, 240, 248, 0.5);
      font-size: 13px;
    }
    .warn {
      color: #ffb74d;
    }
    .note {
      margin: 10px 0 0;
      color: rgba(226, 240, 248, 0.55);
      font-size: 13px;
    }
    .card .warn {
      margin: 10px 0 0;
      font-size: 13px;
    }
    .foot {
      margin-top: 14px;
      color: rgba(226, 240, 248, 0.42);
      font-size: 11.5px;
      line-height: 1.45;
    }
    .foot p {
      margin: 0 0 4px;
    }
    .error {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 10px 12px;
      color: #ffcdd2;
      font-size: 13px;
      background: rgba(255, 82, 82, 0.1);
      border: 1px solid rgba(255, 82, 82, 0.35);
      border-radius: 10px;
    }
    .error button {
      padding: 5px 10px;
      color: inherit;
      font: inherit;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }
    .skeleton {
      min-height: 320px;
    }
    .skeleton div {
      height: 14px;
      margin: 10px 0;
      border-radius: 6px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));
      background-size: 200% 100%;
      animation: an-progress 1.4s linear infinite;
    }
    .skeleton div:first-child {
      width: 40%;
    }
    .skeleton div:last-child {
      height: 180px;
    }
    @media (max-width: 600px) {
      dialog {
        inset: 8px;
        border-radius: 16px;
      }
      header {
        padding: 8px 10px 8px 14px;
      }
      h2 {
        flex: 1;
        font-size: 15px;
      }
      .range {
        order: 6;
        flex-basis: 100%;
        text-align: left;
      }
      .periods {
        order: 5;
        flex-wrap: wrap;
        width: 100%;
        margin-left: 0;
        justify-content: space-between;
      }
      .periods button {
        flex: 1 0 22%;
        padding: 7px 4px;
      }
      .body {
        padding: 12px 10px 14px;
      }
      .card {
        padding: 12px 12px 14px;
      }
    }
  `;
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, FveFlowAnalysisDialog);
}

/** Otevře okno Analýza; vrací prvek, aby ho karta mohla zavřít. */
export function openAnalysisDialog(options: AnalysisDialogOptions): FveFlowAnalysisDialog {
  const el = document.createElement(TAG) as FveFlowAnalysisDialog;
  el.options = options;
  document.body.append(el);
  return el;
}
