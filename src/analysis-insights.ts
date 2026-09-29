/** Automatické postřehy („Shrnutí“) okna Analýza — čistá pravidla nad daty. */
import type { AnalysisData } from './analysis-data';
import { formatEnergy } from './utils';

export type InsightTone = 'good' | 'info' | 'warn' | 'bad';

export interface Insight {
  tone: InsightTone;
  text: string;
  prio: number;
}

const TONE_ORDER: Record<InsightTone, number> = { bad: 0, warn: 1, good: 2, info: 3 };
const MAX_INSIGHTS = 6;

const nf1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
const pct = (v: number) => `${Math.round(v * 100)} %`;
const kwh = (v: number) => formatEnergy(v);

export function buildInsights(d: AnalysisData): Insight[] {
  const out: Insight[] = [];
  const single = d.range.intraday;
  const when =
    d.range.period === 'last24h'
      ? 'Za posledních 24 h'
      : d.range.period === 'today'
        ? 'Dnes'
        : d.range.period === 'yesterday'
          ? 'Včera'
          : `Za ${d.range.days.length} dní`;
  const live = d.range.period === 'today' || d.range.period === 'last24h';

  // Soběstačnost domu.
  if (d.gridConfigured && d.selfSufficiency != null && d.house != null && d.fve.total != null) {
    const p = d.selfSufficiency;
    out.push({
      tone: p >= 0.9 ? 'good' : p >= 0.6 ? 'info' : 'warn',
      prio: 10,
      text: `${when} FVE pokryla ${pct(p)} spotřeby domu (${kwh(d.fve.total)} z ${kwh(d.house)}).`,
    });
  }

  // Výroba vs predikce.
  const f = d.forecast.fulfilment;
  if (f != null && d.pv.total != null) {
    const ref = live ? 'predikce do teď' : 'predikce den předem';
    out.push({
      tone: f >= 0.95 ? 'good' : f >= 0.8 ? 'info' : 'warn',
      prio: 20,
      text:
        d.range.period === 'last24h'
          ? `Dnešní výroba je na ${pct(f)} ${ref}.`
          : `Výroba ${kwh(d.pv.total)} = ${pct(f)} ${ref}.`,
    });
  }

  // Nevyužitá výroba při plné baterii.
  const c = d.forecast.curtailed;
  if (c && c.p50 >= 0.3) {
    const range = c.p10 != null && c.p10 < c.p50 - 0.05 ? `${nf1.format(c.p10)}–${nf1.format(c.p50)} kWh` : kwh(c.p50);
    out.push({
      tone: c.p50 >= 1 ? 'warn' : 'info',
      prio: 15,
      text: `Při plné baterii mohlo zůstat nevyužito ≈ ${range} — větší spotřebiče pouštěj kolem poledne.`,
    });
  }
  if (!single && d.fullDays != null && d.fullDays > 0) {
    out.push({
      tone: 'info',
      prio: 40,
      text: `Baterie byla plná v ${d.fullDays} z ${d.range.days.length} dní — přebytky šlo využít.`,
    });
  }

  // Minimum SoC.
  if (d.soc.min != null && d.soc.min < d.minSocPct) {
    out.push({ tone: 'bad', prio: 5, text: `SoC kleslo až na ${Math.round(d.soc.min)} % (práh ${d.minSocPct} %).` });
  }

  // Patra.
  const floors = d.floors.filter((x) => x.total != null && x.total > 0.05);
  if (floors.length > 1) {
    const top = floors.reduce((a, b) => (b.total! > a.total! ? b : a));
    out.push({
      tone: 'info',
      prio: 30,
      text: `Nejvíc spotřebovalo ${top.name}: ${kwh(top.total!)}${top.share != null ? ` (${pct(top.share)} domu)` : ''}.`,
    });
    const gridFloors = floors.filter((x) => (x.grid ?? 0) > 0.05);
    if (gridFloors.length > 1) {
      const topGrid = gridFloors.reduce((a, b) => (b.grid! > a.grid! ? b : a));
      out.push({ tone: 'info', prio: 35, text: `Ze sítě nejvíc odebírá ${topGrid.name} (${kwh(topGrid.grid!)}).` });
    }
  }

  // Neměřená spotřeba a nesoulad měřáků.
  for (const key of ['fve', 'grid'] as const) {
    const main = d[key].total;
    const u = d.unmeasured[key];
    if (u != null && u > 0 && main && u / main >= 0.05) {
      out.push({
        tone: 'info',
        prio: 45,
        text: `Neměřená ${key === 'fve' ? 'ostrovní' : 'síťová'} spotřeba ${kwh(u)} (${pct(u / main)}) — okruhy mimo měřená patra.`,
      });
    }
    const m = d.mismatch[key];
    if (m != null && m > 0) {
      out.push({
        tone: 'warn',
        prio: 12,
        text: `Patra naměřila o ${kwh(m)} víc než ${key === 'fve' ? 'měnič' : 'přívod ze sítě'} — zkontroluj měřáky.`,
      });
    }
  }

  // DC bilance.
  if (d.dc.mismatch) {
    out.push({
      tone: 'warn',
      prio: 25,
      text: 'DC bilance nesedí — střídač dodal víc, než přišlo z FVE a baterie (jiný zdroj nabíjení nebo chyba měření).',
    });
  } else if (d.dc.efficiency != null && d.dc.losses != null && d.dc.losses > 0.05) {
    out.push({
      tone: d.dc.efficiency < 0.85 ? 'warn' : 'info',
      prio: 50,
      text: `Ztráty měniče a DC ${kwh(d.dc.losses)} (účinnost ${pct(d.dc.efficiency)}).`,
    });
  }
  if (d.dc.cycles != null && d.discharge.total != null && d.discharge.total > 0.1) {
    const socTxt =
      d.soc.min != null && d.soc.max != null ? `, SoC ${Math.round(d.soc.min)}–${Math.round(d.soc.max)} %` : '';
    out.push({ tone: 'info', prio: 55, text: `Baterie ${nf2.format(d.dc.cycles)} ekv. cyklu${socTxt}.` });
  }

  // Zítřek.
  if (live && d.forecast.tomorrow != null && d.forecast.total != null) {
    const t = d.forecast.tomorrow;
    const diff = t - d.forecast.total;
    out.push({
      tone: 'info',
      prio: 60,
      text: `Zítra Solcast ${kwh(t)} — ${Math.abs(diff) < 0.5 ? 'podobně jako dnes' : diff > 0 ? `o ${kwh(diff)} víc než dnes` : `o ${kwh(-diff)} méně než dnes`}.`,
    });
  }

  // Nejlepší a nejslabší den.
  if (!single) {
    const days = d.range.days
      .slice(0, -1)
      .map((day) => ({ day, v: d.pv.byDay.get(day.key) }))
      .filter((x): x is { day: typeof x.day; v: number } => x.v != null);
    if (days.length >= 3) {
      const best = days.reduce((a, b) => (b.v > a.v ? b : a));
      const worst = days.reduce((a, b) => (b.v < a.v ? b : a));
      out.push({
        tone: 'info',
        prio: 65,
        text: `Nejlepší den ${best.day.label} (${kwh(best.v)}), nejslabší ${worst.day.label} (${kwh(worst.v)}).`,
      });
    }
  }

  return out
    .sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || a.prio - b.prio)
    .slice(0, MAX_INSIGHTS);
}
