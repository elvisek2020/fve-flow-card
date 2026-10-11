/** Sdílené barvy scény karty a okna Analýza. */
export const C = {
  solar: '#00e676',
  island: '#00e676',
  grid: '#4fc3f7',
  charge: '#e040fb',
  discharge: '#ffb74d',
  ok: '#69f0ae',
  warn: '#ffb74d',
  crit: '#ff5252',
  forecast: '#ffd54f',
  ac: '#26c6da',
  loss: 'rgba(148,170,190,0.6)',
};

/**
 * Odstíny putujících teček k jednotlivým patrům (index patra, dokola) — každé
 * patro má vlastní barvu, ať je vidět, která tečka kam jde. Ostrov v teplých
 * (zelená, žlutá, oranžová, bílá), síť v modrých tónech.
 */
export const FLOOR_DOTS = {
  island: ['#00e676', '#ffea00', '#ff9100', '#ffffff', '#ff80ab'],
  grid: ['#4fc3f7', '#2962ff', '#e1f5fe', '#b388ff', '#00b0ff'],
};

/** Tlumená barva pro nedostupné hodnoty a neaktivní ikony. */
export const NEUTRAL = 'rgba(148,170,190,0.5)';
