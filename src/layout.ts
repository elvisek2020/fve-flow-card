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
