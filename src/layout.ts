export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  pv: Rect;
  mppt: Rect;
  battery: Rect;
  inverter: Rect;
  solcast: Rect;
  grid: Rect;
  floors: Rect[];
  paths: {
    pvMppt: string;
    mpptInv: string;
    batInv: string;
    /** Přerušovaná spojnice FVE panely ↔ Solcast predikce (bez animace). */
    pvSolcast: string;
    islandTaps: string[];
    gridTaps: string[];
  };
}

// Širší box kvůli rozdělení na FVE zónu (vlevo) a grid zónu (vpravo).
const FLOOR_W = 380;
// Patro má jen jeden řádek chipů (FVE + grid fáze vedle sebe).
const FLOOR_H = 170;
// Grid uzel má navíc řádek se souhrnnou energií, proto potřebuje víc
// místa nad chipy, aby se ikonka fáze nepřekrývala s textem "Celkem ze sítě/dnes".
const GRID_H = 210;
const FLOOR_GAP = 30;
// Stejná mezera mezi AC-IN a prvním patrem jako mezi jednotlivými patry.
const FLOORS_TOP = 40 + GRID_H + FLOOR_GAP;
// Oba svislé trunky (FVE vlevo, grid vpravo) drží od boxů pater stejný odstup.
const TRUNK_GAP = 40;
const GRID_TRUNK_X = 1388;
const FLOOR_X = GRID_TRUNK_X - TRUNK_GAP - FLOOR_W;
const ISLAND_TRUNK_X = FLOOR_X - TRUNK_GAP;

/**
 * Spočítá souřadnice uzlů a SVG cesty propojení pro daný počet pater.
 * Pevný viewBox → responzivní škálování celé scény.
 */
export function computeLayout(floorCount: number): Layout {
  const n = Math.max(1, floorCount);

  const pv: Rect = { x: 50, y: 40, w: 300, h: 190 };
  const mppt: Rect = { x: 50, y: 280, w: 300, h: 150 };
  const battery: Rect = { x: 50, y: 480, w: 300, h: 320 };
  // Střední sloupec (měnič + Solcast) vycentrovaný mezi pravou hranu
  // levého sloupce a levou hranu boxů pater — stejná mezera vlevo i vpravo.
  const LEFT_EDGE = 350;
  const MID_W = 280;
  const MID_X = Math.round((LEFT_EDGE + FLOOR_X - MID_W) / 2);
  const inverter: Rect = { x: MID_X, y: 360, w: MID_W, h: 260 };
  // Predikce sedí nahoře vedle FVE panelů; střed dole zůstává volný.
  const solcast: Rect = { x: MID_X, y: 40, w: MID_W, h: 190 };
  const grid: Rect = { x: FLOOR_X, y: 40, w: FLOOR_W, h: GRID_H };

  const floors: Rect[] = [];
  for (let i = 0; i < n; i++) {
    floors.push({
      x: FLOOR_X,
      y: FLOORS_TOP + i * (FLOOR_H + FLOOR_GAP),
      w: FLOOR_W,
      h: FLOOR_H,
    });
  }
  const floorsBottom = floors[floors.length - 1].y + FLOOR_H;

  const pvCx = pv.x + pv.w / 2;
  const mpptMidY = mppt.y + mppt.h / 2;
  const invDcY = inverter.y + 50; // port DC-in z MPPT
  const invBatY = inverter.y + 120; // port baterie
  const invOutY = inverter.y + inverter.h / 2; // port AC-out (ostrovní sběrnice)
  const batPortY = battery.y + 150;
  const gridPortY = grid.y + grid.h / 2;

  const paths = {
    pvMppt: `M ${pvCx} ${pv.y + pv.h} L ${pvCx} ${mppt.y}`,
    pvSolcast: `M ${pv.x + pv.w} ${pv.y + pv.h / 2} H ${solcast.x}`,
    mpptInv: `M ${mppt.x + mppt.w} ${mpptMidY} H ${inverter.x - 80} V ${invDcY} H ${inverter.x}`,
    batInv: `M ${battery.x + battery.w} ${batPortY} H ${inverter.x - 40} V ${invBatY} H ${inverter.x}`,
    islandTaps: floors.map((f) => {
      const fy = f.y + f.h / 2;
      return `M ${inverter.x + inverter.w} ${invOutY} H ${ISLAND_TRUNK_X} V ${fy} H ${f.x}`;
    }),
    gridTaps: floors.map((f) => {
      const fy = f.y + f.h / 2;
      return `M ${grid.x + grid.w} ${gridPortY} H ${GRID_TRUNK_X} V ${fy} H ${f.x + f.w}`;
    }),
  };

  return {
    width: 1440,
    height: Math.max(820, floorsBottom + 40),
    pv,
    mppt,
    battery,
    inverter,
    solcast,
    grid,
    floors,
    paths,
  };
}

// Mobilní (úzký) layout — jeden sloupec, uzly pod sebou. Šířka boxu i výšky
// jednotlivých uzlů kopírují desktop verzi (stejný obsah = stejná potřebná
// výška), jen jsou poskládané svisle místo do širokého schématu.
const MOBILE_WIDTH = 520;
const MOBILE_NODE_W = 480;
const MOBILE_X = (MOBILE_WIDTH - MOBILE_NODE_W) / 2;
const MOBILE_GAP = 26;
// Trunky pro toky do pater vedou v okrajích mimo box, aby nekřížily obsah:
// ostrovní (FVE) vlevo, gridový vpravo — patra tak zachovají stejné
// rozložení zón (FVE vlevo / grid vpravo) jako v širokém layoutu.
const MOBILE_ISLAND_TRUNK_X = MOBILE_X - 10;
const MOBILE_GRID_TRUNK_X = MOBILE_X + MOBILE_NODE_W + 10;

/**
 * Vertikální layout pro úzké obrazovky (< 640 px). Pořadí shora:
 * FVE → Solcast → MPPT → Baterie → Měnič → Síť (AC-IN) → patra.
 * Toky mezi uzly, které nejsou v pořadí bezprostředně za sebou
 * (FVE→MPPT přeskakuje Solcast, MPPT→Měnič přeskakuje Baterii), obchází
 * mezilehlý box krátkou odbočkou k pravému okraji scény.
 */
export function computeMobileLayout(floorCount: number): Layout {
  const n = Math.max(1, floorCount);
  const x = MOBILE_X;
  const w = MOBILE_NODE_W;
  let y = 40;

  const pv: Rect = { x, y, w, h: 190 };
  y += pv.h + MOBILE_GAP;
  const solcast: Rect = { x, y, w, h: 190 };
  y += solcast.h + MOBILE_GAP;
  const mppt: Rect = { x, y, w, h: 150 };
  y += mppt.h + MOBILE_GAP;
  const battery: Rect = { x, y, w, h: 320 };
  y += battery.h + MOBILE_GAP;
  const inverter: Rect = { x, y, w, h: 260 };
  y += inverter.h + MOBILE_GAP;
  const grid: Rect = { x, y, w, h: 210 };
  y += grid.h + MOBILE_GAP;

  const floorTop = y;
  const floorH = 170;
  const floors: Rect[] = [];
  for (let i = 0; i < n; i++) {
    floors.push({ x, y: floorTop + i * (floorH + MOBILE_GAP), w, h: floorH });
  }
  const floorsBottom = floors[floors.length - 1].y + floorH;

  // FVE ↔ Solcast jsou v pořadí hned za sebou — krátká svislá spojka.
  const pvSolcast = `M ${pv.x + pv.w / 2} ${pv.y + pv.h} L ${solcast.x + solcast.w / 2} ${solcast.y}`;

  // FVE → MPPT obchází box Solcastu odbočkou k pravému okraji.
  const pvOutY = pv.y + pv.h * 0.65;
  const mpptInY = mppt.y + mppt.h * 0.35;
  const pvMppt = `M ${pv.x + pv.w} ${pvOutY} H ${MOBILE_GRID_TRUNK_X} V ${mpptInY} H ${mppt.x + mppt.w}`;

  // MPPT → Měnič obchází box Baterie stejnou odbočkou.
  const mpptOutY = mppt.y + mppt.h * 0.65;
  const invInY = inverter.y + inverter.h * 0.3;
  const mpptInv = `M ${mppt.x + mppt.w} ${mpptOutY} H ${MOBILE_GRID_TRUNK_X} V ${invInY} H ${inverter.x + inverter.w}`;

  // Baterie ↔ Měnič jsou přímí sousedi — přímá svislá spojka.
  const batInv = `M ${battery.x + battery.w / 2} ${battery.y + battery.h} L ${inverter.x + inverter.w / 2} ${inverter.y}`;

  const invPortY = inverter.y + inverter.h - 24;
  const gridPortY = grid.y + grid.h / 2;

  const islandTaps = floors.map((f) => {
    const fy = f.y + f.h / 2;
    return `M ${inverter.x} ${invPortY} H ${MOBILE_ISLAND_TRUNK_X} V ${fy} H ${f.x}`;
  });
  const gridTaps = floors.map((f) => {
    const fy = f.y + f.h / 2;
    return `M ${grid.x + grid.w} ${gridPortY} H ${MOBILE_GRID_TRUNK_X} V ${fy} H ${f.x + f.w}`;
  });

  return {
    width: MOBILE_WIDTH,
    height: Math.max(600, floorsBottom + 40),
    pv,
    mppt,
    battery,
    inverter,
    solcast,
    grid,
    floors,
    paths: { pvMppt, mpptInv, batInv, pvSolcast, islandTaps, gridTaps },
  };
}
