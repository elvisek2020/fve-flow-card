/**
 * SVG grafy okna Analýza (bez externích knihoven): průběh dne, denní sloupce
 * a tokový diagram (Sankey). Kreslí se ve skutečné šířce karty v px.
 */
import { svg, nothing, type TemplateResult } from 'lit';
import { smoothPath } from './mini-chart';
import type { SlotGrid, Slots } from './analysis-stats';
import type { DayInfo, ForecastPeriod } from './analysis-data';

const GRID_LINE = 'rgba(148,170,190,0.12)';
const AXIS_TEXT = 'rgba(226,240,248,0.42)';

/** „Hezké“ kroky osy (1 / 2 / 2,5 / 5 × 10^n). */
export function niceScale(min: number, max: number, ticks = 4): { lo: number; hi: number; step: number } {
  if (!(max > min)) max = min + 1;
  const raw = (max - min) / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
}

function yTicks(sc: { lo: number; hi: number; step: number }): number[] {
  const out: number[] = [];
  for (let v = sc.lo; v <= sc.hi + sc.step / 1000; v += sc.step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

const f1 = (n: number) => n.toFixed(1);

// ---------------------------------------------------------------------------
// Bublina s hodnotami (data-tip → vykreslí okno Analýza)
// ---------------------------------------------------------------------------

export interface TipRow {
  /** Barva tečky. */
  c?: string;
  l: string;
  v: string;
}

export interface Tip {
  /** Nadpis (čas / den). */
  h: string;
  r: TipRow[];
  /** Poznámka pod hodnotami. */
  n?: string;
}

const tipAttr = (t: Tip) => JSON.stringify(t);
const fmtHm = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });
const hhmm = (t: number) => fmtHm.format(t);

// ---------------------------------------------------------------------------
// Průběh dne
// ---------------------------------------------------------------------------

export interface TimeSeries {
  label: string;
  color: string;
  values: Slots;
  kind: 'area' | 'line';
  /** Záporná část jinou barvou (baterie: nabíjení + / vybíjení −). */
  negColor?: string;
  /** Skládaná plocha (jen nezáporné hodnoty). */
  stack?: boolean;
  /** Přerušovaná čára (jen kind: 'line'). */
  dash?: string;
  /** Popisek záporných hodnot v bublině (baterie: „Vybíjení“), hodnota bez znaménka. */
  negLabel?: string;
}

export interface TimeChartOptions {
  width: number;
  height: number;
  grid: SlotGrid;
  /** Osa x: začátek a konec dne. */
  x0: number;
  x1: number;
  series: TimeSeries[];
  forecast?: { color: string; periods: ForecastPeriod[] };
  spans?: Array<{ from: number; to: number }>;
  spanColor?: string;
  spanTitle?: string;
  now?: number | null;
  yFixed?: [number, number];
  refLine?: { value: number; color: string };
  yFormat: (v: number) => string;
  /** Bez popisků osy x (úzký pásek pod jiným grafem). */
  compact?: boolean;
  /** Formát hodnot v bublině (výchozí yFormat). */
  valueFormat?: (v: number) => string;
  /** Formát začátku slotu v nadpisu bubliny (výchozí HH:MM). */
  timeFormat?: (t: number) => string;
}

export function renderTimeChart(o: TimeChartOptions): TemplateResult {
  const pl = 56;
  const pr = 10;
  const pt = 8;
  const pb = o.compact ? 6 : 20;
  const iw = Math.max(10, o.width - pl - pr);
  const ih = Math.max(10, o.height - pt - pb);
  const x = (t: number) => pl + ((t - o.x0) / (o.x1 - o.x0)) * iw;
  const mid = (i: number) => o.grid.start + (i + 0.5) * o.grid.step;

  // Skládané plochy: kumulace po slotech.
  const base = new Array<number>(o.grid.n).fill(0);
  const layers = o.series.map((s) => {
    if (s.kind !== 'area' || !s.stack) return { s, lower: null as number[] | null, upper: null as Slots | null };
    const lower = base.slice();
    const upper: Slots = s.values.map((v, i) => (v == null ? null : lower[i] + Math.max(0, v)));
    upper.forEach((u, i) => {
      if (u != null) base[i] = u;
    });
    return { s, lower, upper };
  });

  let lo = 0;
  let hi = 0;
  for (const l of layers) {
    for (const v of l.upper ?? l.s.values) {
      if (v == null) continue;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  for (const p of o.forecast?.periods ?? []) hi = Math.max(hi, p.p90 ?? p.p50);
  // Bez dat: rozumná výchozí osa (1 kW) místo „0 W, 0 W, 1 W“.
  if (hi - lo < 1) hi = lo + 1000;
  const sc = o.yFixed
    ? { lo: o.yFixed[0], hi: o.yFixed[1], step: (o.yFixed[1] - o.yFixed[0]) / (o.compact ? 2 : 4) }
    : niceScale(lo, hi);
  const y = (v: number) => pt + ih - ((v - sc.lo) / (sc.hi - sc.lo)) * ih;
  const yZero = y(Math.max(sc.lo, Math.min(sc.hi, 0)));

  /** Souvislé úseky (null přeruší čáru). */
  const segments = (vals: Slots): Array<Array<[number, number]>> => {
    const segs: Array<Array<[number, number]>> = [];
    let cur: Array<[number, number]> = [];
    vals.forEach((v, i) => {
      if (v == null) {
        if (cur.length) segs.push(cur);
        cur = [];
        return;
      }
      cur.push([x(mid(i)), y(v)]);
    });
    if (cur.length) segs.push(cur);
    return segs;
  };
  const line = (pts: Array<[number, number]>) => pts.map(([px, py], i) => `${i ? 'L' : 'M'}${f1(px)} ${f1(py)}`).join(' ');
  const areaToZero = (pts: Array<[number, number]>) =>
    `${line(pts)} L${f1(pts[pts.length - 1][0])} ${f1(yZero)} L${f1(pts[0][0])} ${f1(yZero)} Z`;

  const layerTpl = layers.map(({ s, lower, upper }) => {
    if (upper && lower) {
      // Skládaná plocha: horní hrana tam, dolní zpět.
      const segs: Array<Array<[number, number, number]>> = [];
      let cur: Array<[number, number, number]> = [];
      upper.forEach((u, i) => {
        if (u == null) {
          if (cur.length) segs.push(cur);
          cur = [];
          return;
        }
        cur.push([x(mid(i)), y(u), y(lower[i])]);
      });
      if (cur.length) segs.push(cur);
      return segs.map((seg) => {
        const top = seg.map(([px, py], i) => `${i ? 'L' : 'M'}${f1(px)} ${f1(py)}`).join(' ');
        const bottom = seg
          .slice()
          .reverse()
          .map(([px, , pb2]) => `L${f1(px)} ${f1(pb2)}`)
          .join(' ');
        return svg`
          <path d="${top} ${bottom} Z" fill="${s.color}" opacity="0.28"/>
          <path d="${top}" fill="none" stroke="${s.color}" stroke-width="1.5" opacity="0.9"/>`;
      });
    }
    if (s.kind === 'area') {
      const parts: Array<[Slots, string]> = [[s.values.map((v) => (v == null ? null : Math.max(0, v))), s.color]];
      if (s.negColor) parts.push([s.values.map((v) => (v == null ? null : Math.min(0, v))), s.negColor]);
      return parts.map(([vals, color]) =>
        segments(vals).map(
          (seg) => svg`
            <path d="${areaToZero(seg)}" fill="${color}" opacity="0.22"/>
            <path d="${line(seg)}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.9"/>`,
        ),
      );
    }
    return segments(s.values).map(
      (seg) => svg`<path d="${line(seg)}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linejoin="round"
        stroke-dasharray="${s.dash ?? ''}"/>`,
    );
  });

  // Predikce: pásmo p10–p90 + přerušovaná p50.
  let forecastTpl: TemplateResult | typeof nothing = nothing;
  const fp = o.forecast?.periods ?? [];
  if (o.forecast && fp.length > 1) {
    const pmid = (p: ForecastPeriod) => x((p.start + p.end) / 2);
    const band = fp.filter((p) => p.p10 != null && p.p90 != null);
    const bandPath =
      band.length > 1
        ? `${band.map((p, i) => `${i ? 'L' : 'M'}${f1(pmid(p))} ${f1(y(p.p90!))}`).join(' ')} ` +
          `${band
            .slice()
            .reverse()
            .map((p) => `L${f1(pmid(p))} ${f1(y(p.p10!))}`)
            .join(' ')} Z`
        : '';
    forecastTpl = svg`
      ${bandPath ? svg`<path d="${bandPath}" fill="${o.forecast.color}" opacity="0.1"/>` : nothing}
      <path d="${smoothPath(fp.map((p): [number, number] => [pmid(p), y(p.p50)]))}" fill="none" stroke="${o.forecast.color}"
        stroke-width="1.8" stroke-dasharray="5 4" opacity="0.9"/>`;
  }

  // Značky po 6 h v lokálním čase — funguje pro den (00–24) i klouzavých 24 h.
  const d0 = new Date(o.x0);
  const hours: Array<{ label: string; t: number }> = [];
  for (let h = 0; h <= 48; h += 6) {
    const t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), h).getTime();
    if (t < o.x0 - 60000 || t > o.x1 + 60000) continue;
    const hh = new Date(t).getHours();
    hours.push({ t, label: hh === 0 && t >= o.x1 - 60000 ? '24' : String(hh).padStart(2, '0') });
  }

  // Bublina: průhledný svislý pruh na každý slot (nahoře, zachytává ukazatel).
  const vf = o.valueFormat ?? o.yFormat;
  const tf = o.timeFormat ?? hhmm;
  const slotW = (iw * o.grid.step) / (o.x1 - o.x0);
  const stacked = o.series.filter((s) => s.stack);
  const hover: TemplateResult[] = [];
  for (let i = 0; i < o.grid.n; i++) {
    const t0 = o.grid.start + i * o.grid.step;
    if (t0 < o.x0 || t0 >= o.x1) continue;
    const rows: TipRow[] = [];
    for (const s of o.series) {
      const v = s.values[i];
      if (v == null) continue;
      const neg = v < 0 && !!s.negLabel;
      rows.push({ c: v < 0 && s.negColor ? s.negColor : s.color, l: neg ? s.negLabel! : s.label, v: vf(neg ? -v : v) });
    }
    if (stacked.length > 1) {
      const vals = stacked.map((s) => s.values[i]).filter((v): v is number => v != null);
      if (vals.length > 1) rows.push({ l: 'Celkem', v: vf(vals.reduce((a, v) => a + Math.max(0, v), 0)) });
    }
    const tm = mid(i);
    const fpp = fp.find((p) => tm >= p.start && tm < p.end);
    if (fpp && o.forecast) {
      rows.push({ c: o.forecast.color, l: 'Predikce', v: vf(fpp.p50) });
      if (fpp.p10 != null && fpp.p90 != null) rows.push({ l: 'p10–p90', v: `${vf(fpp.p10)} – ${vf(fpp.p90)}` });
    }
    if (!rows.length) continue;
    const inSpan = (o.spans ?? []).some((sp) => tm >= sp.from && tm < sp.to);
    const tip: Tip = { h: `${tf(t0)}–${hhmm(t0 + o.grid.step)}`, r: rows, n: inSpan ? o.spanTitle : undefined };
    hover.push(svg`<rect class="hov-line" x="${f1(x(t0))}" y="${pt}" width="${f1(Math.max(1, slotW))}" height="${ih}"
      data-tip="${tipAttr(tip)}"/>`);
  }

  return svg`
    ${(o.spans ?? []).map(
      (sp) => svg`<rect x="${f1(x(sp.from))}" y="${pt}" width="${f1(Math.max(1, x(sp.to) - x(sp.from)))}" height="${ih}"
        fill="${o.spanColor ?? '#69f0ae'}" opacity="0.08"/>`,
    )}
    ${yTicks(sc).map(
      (v) => svg`
        <line x1="${pl}" x2="${pl + iw}" y1="${f1(y(v))}" y2="${f1(y(v))}" stroke="${GRID_LINE}"/>
        <text x="${pl - 6}" y="${f1(y(v) + 3.5)}" text-anchor="end" class="axis">${o.yFormat(v)}</text>`,
    )}
    ${o.compact
      ? nothing
      : hours.map(
          ({ label, t }) => svg`
            <line x1="${f1(x(t))}" x2="${f1(x(t))}" y1="${pt}" y2="${pt + ih}" stroke="${GRID_LINE}"/>
            <text x="${f1(x(t))}" y="${pt + ih + 14}" text-anchor="middle" class="axis">${label}</text>`,
        )}
    ${sc.lo < 0 ? svg`<line x1="${pl}" x2="${pl + iw}" y1="${f1(yZero)}" y2="${f1(yZero)}" stroke="rgba(226,240,248,0.3)"/>` : nothing}
    ${o.refLine
      ? svg`<line x1="${pl}" x2="${pl + iw}" y1="${f1(y(o.refLine.value))}" y2="${f1(y(o.refLine.value))}"
          stroke="${o.refLine.color}" stroke-dasharray="3 4" opacity="0.7"/>`
      : nothing}
    ${forecastTpl}
    ${layerTpl}
    ${o.now != null && o.now > o.x0 && o.now < o.x1
      ? svg`<line x1="${f1(x(o.now))}" x2="${f1(x(o.now))}" y1="${pt}" y2="${pt + ih}"
          stroke="rgba(226,240,248,0.45)" stroke-dasharray="3 4"/>`
      : nothing}
    ${hover}`;
}

// ---------------------------------------------------------------------------
// Denní sloupce
// ---------------------------------------------------------------------------

export interface ColumnSeries {
  label: string;
  color: string;
  values: Array<number | null>;
  /** Jen obrys (predikce). */
  outline?: boolean;
}

export interface ColumnsOptions {
  width: number;
  height: number;
  days: DayInfo[];
  series: ColumnSeries[];
  mode: 'stacked' | 'grouped';
  /** Poslední sloupec (dnešek) je rozpracovaný → ztlumit. */
  partialLast?: boolean;
  /** Vodorovná referenční čára (např. kapacita baterie). */
  refLine?: { value: number; color: string; label?: string };
  yFormat: (v: number) => string;
  valueFormat: (v: number) => string;
}

export function renderColumns(o: ColumnsOptions): TemplateResult {
  const pl = 56;
  const pr = 10;
  const pt = 8;
  const pb = 22;
  const iw = Math.max(10, o.width - pl - pr);
  const ih = Math.max(10, o.height - pt - pb);
  const n = o.days.length;
  const band = iw / n;
  let max = 0;
  for (let i = 0; i < n; i++) {
    if (o.mode === 'stacked') max = Math.max(max, o.series.reduce((s, se) => s + (se.values[i] ?? 0), 0));
    else for (const se of o.series) max = Math.max(max, se.values[i] ?? 0);
  }
  if (o.refLine) max = Math.max(max, o.refLine.value);
  const sc = niceScale(0, max > 0 ? max : 10);
  const y = (v: number) => pt + ih - ((v - sc.lo) / (sc.hi - sc.lo)) * ih;
  const stride = Math.max(1, Math.ceil((n * 44) / iw));
  const barW = o.mode === 'stacked' ? band * 0.62 : Math.max(2, (band * 0.8) / o.series.length);

  const bars = o.days.map((day, i) => {
    const x0 = pl + i * band;
    const faded = o.partialLast && i === n - 1;
    let acc = 0;
    return svg`<g opacity="${faded ? 0.55 : 1}">${o.series.map((se, k) => {
      const v = se.values[i];
      if (v == null || v <= 0) return nothing;
      const bx = o.mode === 'stacked' ? x0 + (band - barW) / 2 : x0 + (band - barW * o.series.length) / 2 + k * barW;
      const top = o.mode === 'stacked' ? y(acc + v) : y(v);
      const bottom = o.mode === 'stacked' ? y(acc) : y(0);
      if (o.mode === 'stacked') acc += v;
      const h = Math.max(1, bottom - top);
      const w = Math.max(1, barW - (o.mode === 'grouped' ? 1 : 0));
      return svg`<rect x="${f1(bx)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" rx="1.5"
        fill="${se.outline ? 'none' : se.color}" fill-opacity="0.75"
        stroke="${se.color}" stroke-width="${se.outline ? 1.4 : 0}" stroke-dasharray="${se.outline ? '3 2' : ''}"/>`;
    })}</g>`;
  });

  // Bublina: průhledný pruh přes celý den se všemi hodnotami.
  const hover = o.days.map((day, i) => {
    const rows: TipRow[] = [];
    for (const se of o.series) {
      const v = se.values[i];
      if (v != null) rows.push({ c: se.color, l: se.label, v: o.valueFormat(v) });
    }
    if (o.mode === 'stacked' && rows.length > 1) {
      rows.push({ l: 'Celkem', v: o.valueFormat(o.series.reduce((a, se) => a + (se.values[i] ?? 0), 0)) });
    }
    if (!rows.length) return nothing;
    const faded = o.partialLast && i === n - 1;
    const tip: Tip = { h: `${day.label}${faded ? ' (zatím)' : ''}`, r: rows, n: o.refLine?.label };
    return svg`<rect class="hov-band" x="${f1(pl + i * band)}" y="${pt}" width="${f1(band)}" height="${ih}"
      data-tip="${tipAttr(tip)}"/>`;
  });

  return svg`
    ${yTicks(sc).map(
      (v) => svg`
        <line x1="${pl}" x2="${pl + iw}" y1="${f1(y(v))}" y2="${f1(y(v))}" stroke="${GRID_LINE}"/>
        <text x="${pl - 6}" y="${f1(y(v) + 3.5)}" text-anchor="end" class="axis">${o.yFormat(v)}</text>`,
    )}
    ${bars}
    ${o.refLine
      ? svg`<line x1="${pl}" x2="${pl + iw}" y1="${f1(y(o.refLine.value))}" y2="${f1(y(o.refLine.value))}"
          stroke="${o.refLine.color}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.85">
          <title>${o.refLine.label ?? ''}</title></line>
        ${o.refLine.label
          ? svg`<text x="${pl + iw}" y="${f1(y(o.refLine.value) - 5)}" text-anchor="end" class="axis"
              style="fill:${o.refLine.color}">${o.refLine.label}</text>`
          : nothing}`
      : nothing}
    ${o.days.map((day, i) =>
      (n - 1 - i) % stride === 0
        ? svg`<text x="${f1(pl + (i + 0.5) * band)}" y="${pt + ih + 15}" text-anchor="middle" class="axis">${day.label}</text>`
        : nothing,
    )}
    ${hover}`;
}

// ---------------------------------------------------------------------------
// Sankey
// ---------------------------------------------------------------------------

export interface SankeyNode {
  id: string;
  label: string;
  /** Druhý řádek popisku (např. „8,1 kWh · 34 %“). */
  sub?: string;
  column: number;
  color: string;
  /** Kreslit i s nulovou hodnotou (ztlumený pahýl) — patra. */
  keep?: boolean;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  /** Tlumený pás (Neměřeno, Ztráty). */
  faint?: boolean;
  title?: string;
}

export interface SankeyOptions {
  id: string;
  width: number;
  height: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** Svislá mezera mezi uzly (víc místa pro popisek nad uzlem). Default 14. */
  pad?: number;
}

interface LNode extends SankeyNode {
  ins: LLink[];
  outs: LLink[];
  value: number;
  col: number;
  x: number;
  y: number;
  h: number;
}

interface LLink extends SankeyLink {
  src: LNode;
  tgt: LNode;
  t: number;
  y0: number;
  y1: number;
}

const NODE_W = 10;
const DEFAULT_PAD = 14;
const MIN_LINK = 1.5;
const MIN_NODE = 3;
const EPS = 0.005;
const LABEL_H = 36;

/** Rozprostře středy popisků tak, aby se nepřekrývaly (a vešly se do výšky). */
function spreadLabels(items: Array<{ want: number; set: (v: number) => void }>, height: number): void {
  const sorted = items.slice().sort((a, b) => a.want - b.want);
  const pos = sorted.map((i) => i.want);
  for (let i = 0; i < pos.length; i++) pos[i] = Math.max(pos[i], i ? pos[i - 1] + LABEL_H : LABEL_H / 2 - 4);
  for (let i = pos.length - 1; i >= 0; i--) {
    const limit = i === pos.length - 1 ? height - LABEL_H / 2 + 4 : pos[i + 1] - LABEL_H;
    pos[i] = Math.min(pos[i], limit);
  }
  sorted.forEach((item, i) => item.set(pos[i]));
}

export function renderSankey(o: SankeyOptions): TemplateResult {
  const W = o.width;
  const H = o.height;
  const PAD = o.pad ?? DEFAULT_PAD;
  const nodes = new Map<string, LNode>();
  for (const n of o.nodes) nodes.set(n.id, { ...n, ins: [], outs: [], value: 0, col: 0, x: 0, y: 0, h: 0 });
  const links: LLink[] = [];
  for (const l of o.links) {
    const src = nodes.get(l.source);
    const tgt = nodes.get(l.target);
    if (!src || !tgt || !(l.value > EPS)) continue;
    const link: LLink = { ...l, src, tgt, t: 0, y0: 0, y1: 0 };
    src.outs.push(link);
    tgt.ins.push(link);
    links.push(link);
  }
  for (const n of nodes.values()) {
    const sIn = n.ins.reduce((s, l) => s + l.value, 0);
    const sOut = n.outs.reduce((s, l) => s + l.value, 0);
    n.value = Math.max(sIn, sOut);
  }
  const visible = [...nodes.values()].filter((n) => n.value > EPS || n.keep);
  if (!visible.some((n) => n.value > EPS)) {
    return svg`<text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="empty">Žádná data za období</text>`;
  }

  // Sloupce v deklarovaném pořadí.
  const colIds = [...new Set(visible.map((n) => n.column))].sort((a, b) => a - b);
  const cols = colIds.map((c) => visible.filter((n) => n.column === c));
  cols.forEach((list, ci) => list.forEach((n) => (n.col = ci)));

  // Měřítko: každý sloupec se vejde i s minimální tloušťkou pásů a mezerami.
  let k = Infinity;
  for (const list of cols) {
    const V = list.reduce((s, n) => s + n.value, 0);
    if (V <= EPS) continue;
    const zero = list.filter((n) => n.value <= EPS).length;
    const ends = list.reduce((s, n) => s + Math.max(n.ins.length, n.outs.length), 0);
    const avail = H - PAD * (list.length - 1) - MIN_NODE * zero - MIN_LINK * ends;
    k = Math.min(k, avail / V);
  }
  if (!Number.isFinite(k) || k <= 0) k = 0.01;
  for (const l of links) l.t = Math.max(MIN_LINK, l.value * k);
  for (const n of visible) {
    n.h = Math.max(
      MIN_NODE,
      n.ins.reduce((s, l) => s + l.t, 0),
      n.outs.reduce((s, l) => s + l.t, 0),
    );
  }

  // x pozice: popisky krajních sloupců vně (jen na hodně úzké kartě dovnitř).
  const narrow = W < 340;
  const gutterL = narrow ? 4 : Math.min(130, W * 0.24);
  const gutterR = narrow ? 4 : Math.min(160, W * 0.28);
  const C = cols.length;
  cols.forEach((list, ci) => {
    const x = C === 1 ? gutterL : gutterL + (ci * (W - gutterL - gutterR - NODE_W)) / (C - 1);
    list.forEach((n) => (n.x = x));
  });

  // y pozice: první sloupec vystředěný, další podle středu zdrojů.
  cols.forEach((list, ci) => {
    const total = list.reduce((s, n) => s + n.h, 0) + PAD * (list.length - 1);
    if (ci === 0) {
      let yy = Math.max(0, (H - total) / 2);
      for (const n of list) {
        n.y = yy;
        yy += n.h + PAD;
      }
      return;
    }
    let prevBottom = -PAD;
    for (const n of list) {
      const wsum = n.ins.reduce((s, l) => s + l.t, 0);
      const want = wsum > 0 ? n.ins.reduce((s, l) => s + (l.src.y + l.src.h / 2) * l.t, 0) / wsum - n.h / 2 : prevBottom + PAD;
      n.y = Math.max(prevBottom + PAD, want, 0);
      prevBottom = n.y + n.h;
    }
    const last = list[list.length - 1];
    if (last.y + last.h > H) {
      last.y = H - last.h;
      for (let i = list.length - 2; i >= 0; i--) list[i].y = Math.min(list[i].y, list[i + 1].y - PAD - list[i].h);
      if (list[0].y < 0) {
        let yy = 0;
        for (const n of list) {
          n.y = Math.max(n.y, yy);
          yy = n.y + n.h + PAD;
        }
      }
    }
  });

  // Sloty pásů v uzlech (seřazené podle protějšku, bez křížení).
  for (const n of visible) {
    const outs = n.outs.slice().sort((a, b) => a.tgt.y + a.tgt.h / 2 - (b.tgt.y + b.tgt.h / 2));
    const ins = n.ins.slice().sort((a, b) => a.src.y + a.src.h / 2 - (b.src.y + b.src.h / 2));
    let yo = n.y + (n.h - outs.reduce((s, l) => s + l.t, 0)) / 2;
    for (const l of outs) {
      l.y0 = yo + l.t / 2;
      yo += l.t;
    }
    let yi = n.y + (n.h - ins.reduce((s, l) => s + l.t, 0)) / 2;
    for (const l of ins) {
      l.y1 = yi + l.t / 2;
      yi += l.t;
    }
  }

  // Popisky: vlevo u prvního sloupce, vpravo u posledního. Prostřední sloupec:
  // uzel bez výstupů vpravo, bez vstupů vlevo, průchozí uzel nad sebou.
  interface Label {
    n: LNode;
    x: number;
    anchor: 'start' | 'end' | 'middle';
    cy: number;
    halo: boolean;
  }
  const labels: Label[] = visible.map((n) => {
    const first = n.col === 0;
    const lastCol = n.col === C - 1 && C > 1;
    const cy = n.y + n.h / 2;
    if (first) {
      return narrow
        ? { n, x: n.x + NODE_W + 6, anchor: 'start', cy, halo: true }
        : { n, x: n.x - 6, anchor: 'end', cy, halo: false };
    }
    if (lastCol) {
      return narrow
        ? { n, x: n.x - 6, anchor: 'end', cy, halo: true }
        : { n, x: n.x + NODE_W + 6, anchor: 'start', cy, halo: false };
    }
    if (!n.outs.length) return { n, x: n.x + NODE_W + 6, anchor: 'start', cy, halo: true };
    if (!n.ins.length) return { n, x: n.x - 6, anchor: 'end', cy, halo: true };
    return { n, x: n.x + NODE_W / 2, anchor: 'middle', cy: n.y - 19, halo: true };
  });
  const groups = new Map<string, Label[]>();
  for (const l of labels) {
    if (l.anchor === 'middle') continue;
    const key = `${l.n.col}|${l.anchor}`;
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }
  for (const list of groups.values()) {
    spreadLabels(
      list.map((l) => ({ want: l.cy, set: (v: number) => (l.cy = v) })),
      H,
    );
  }

  const pid = o.id;
  return svg`
    <defs>
      ${links.map((l, i) => {
        const x0 = l.src.x + NODE_W;
        const x1 = l.tgt.x;
        return svg`<linearGradient id="${pid}-g${i}" gradientUnits="userSpaceOnUse" x1="${f1(x0)}" y1="0" x2="${f1(x1)}" y2="0">
          <stop offset="0" stop-color="${l.src.color}"/><stop offset="1" stop-color="${l.tgt.color}"/></linearGradient>`;
      })}
    </defs>
    ${links.map((l, i) => {
      const x0 = l.src.x + NODE_W;
      const x1 = l.tgt.x;
      const xm = (x0 + x1) / 2;
      return svg`<path class="link${l.faint ? ' faint' : ''}"
        d="M${f1(x0)} ${f1(l.y0)} C${f1(xm)} ${f1(l.y0)}, ${f1(xm)} ${f1(l.y1)}, ${f1(x1)} ${f1(l.y1)}"
        fill="none" stroke="url(#${pid}-g${i})" stroke-width="${f1(l.t)}">
        <title>${l.title ?? `${l.src.label} → ${l.tgt.label}`}</title></path>`;
    })}
    ${visible.map(
      (n) => svg`<rect x="${f1(n.x)}" y="${f1(n.y)}" width="${NODE_W}" height="${f1(n.h)}" rx="2"
        fill="${n.color}" opacity="${n.value > EPS ? 0.95 : 0.35}"><title>${n.label}${n.sub ? ` · ${n.sub}` : ''}</title></rect>`,
    )}
    ${labels.map((l) => {
      const moved = l.anchor !== 'middle' && Math.abs(l.cy - (l.n.y + l.n.h / 2)) > 6;
      const edge = l.anchor === 'end' ? l.x + 4 : l.x - 4;
      return svg`
        ${moved
          ? svg`<line x1="${f1(edge)}" y1="${f1(l.n.y + l.n.h / 2)}" x2="${f1(edge)}" y2="${f1(l.cy)}"
              stroke="rgba(226,240,248,0.25)"/>`
          : nothing}
        <text x="${f1(l.x)}" y="${f1(l.cy - 3)}" text-anchor="${l.anchor}" class="s-name${l.halo ? ' halo' : ''}">${l.n.label}</text>
        ${l.n.sub
          ? svg`<text x="${f1(l.x)}" y="${f1(l.cy + 14)}" text-anchor="${l.anchor}" class="s-sub${l.halo ? ' halo' : ''}">${l.n.sub}</text>`
          : nothing}`;
    })}`;
}

// ---------------------------------------------------------------------------
// Heatmapa výroby (dny × hodiny)
// ---------------------------------------------------------------------------

export interface HeatmapOptions {
  width: number;
  days: DayInfo[];
  /** dayKey → 24 hodnot. */
  values: Map<string, Array<number | null>>;
  /** dayKey → 24 příznaků zvýraznění (baterie plná). */
  marks: Map<string, boolean[]>;
  /** Pevný rozsah hodin [od, do) — např. [4, 22] nebo [0, 24]. */
  hours: [number, number];
  /** Barva a sytost buňky podle hodnoty. */
  cellColor: (v: number) => { color: string; opacity: number };
  markColor: string;
  markLabel: string;
  valueFormat: (v: number) => string;
  /** Popisek hodnoty v bublině (např. „Výroba“, „SoC“). */
  tipLabel: string;
  /** Další řádky bubliny pro buňku (den, hodina). */
  tipExtra?: (dayKey: string, hour: number) => TipRow[];
}

/** Sloupce = dny, řádky = hodiny (nahoře ráno), popisky hodin na hranách řádků. */
export function renderHeatmap(o: HeatmapOptions): { tpl: TemplateResult; height: number } {
  const pl = 40;
  const pr = 10;
  const pt = 8;
  const pb = 22;
  const [hMin, hTo] = o.hours;
  const rows = hTo - hMin;
  const n = o.days.length;
  const iw = Math.max(10, o.width - pl - pr);
  const cellW = iw / n;
  const cellH = Math.max(9, Math.min(16, 280 / rows));
  const height = pt + rows * cellH + pb;
  const gap = cellW > 6 ? 1 : 0;
  const stride = Math.max(1, Math.ceil((n * 44) / iw));
  const labelStep = rows > 18 ? 3 : 2;
  const cells: TemplateResult[] = [];
  o.days.forEach((day, i) => {
    const vals = o.values.get(day.key);
    const marks = o.marks.get(day.key);
    for (let h = hMin; h < hTo; h++) {
      const v = vals?.[h];
      const x = pl + i * cellW;
      const y = pt + (h - hMin) * cellH;
      const c = v == null ? { color: 'rgba(148,170,190,1)', opacity: 0.03 } : o.cellColor(v);
      const mark = !!marks?.[h];
      const tip: Tip = {
        h: `${day.label} ${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00`,
        r: [
          { c: v == null ? undefined : c.color, l: o.tipLabel, v: v == null ? 'bez dat' : o.valueFormat(v) },
          ...(o.tipExtra?.(day.key, h) ?? []),
        ],
        n: mark && o.markLabel ? o.markLabel : undefined,
      };
      cells.push(svg`<rect class="cell" x="${f1(x + gap / 2)}" y="${f1(y + gap / 2)}" width="${f1(Math.max(1, cellW - gap))}"
        height="${f1(cellH - gap)}" rx="1.5" fill="${c.color}" fill-opacity="${c.opacity.toFixed(3)}"
        stroke="${mark ? o.markColor : 'none'}" stroke-width="${mark ? 1.2 : 0}" stroke-opacity="0.9"
        data-tip="${tipAttr(tip)}"/>`);
    }
  });
  const hourLabels: number[] = [];
  for (let h = hMin; h <= hTo; h++) if (h % labelStep === 0) hourLabels.push(h);
  const tpl = svg`
    ${cells}
    ${hourLabels.map(
      (h) => svg`<text x="${pl - 6}" y="${f1(pt + (h - hMin) * cellH + 3.5)}" text-anchor="end" class="axis">${String(h).padStart(2, '0')}</text>`,
    )}
    ${o.days.map((day, i) =>
      (n - 1 - i) % stride === 0
        ? svg`<text x="${f1(pl + (i + 0.5) * cellW)}" y="${f1(pt + rows * cellH + 15)}" text-anchor="middle" class="axis">${day.label}</text>`
        : nothing,
    )}`;
  return { tpl, height };
}
