/** Minimální typy HA objektů, které karta potřebuje (bez závislosti na custom-card-helpers). */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language?: string;
  locale?: { language?: string };
  /** HA API — vrátí lokalizovaný stav entity (např. „Vypnuto" místo „off"). */
  formatEntityState?: (stateObj: HassEntity) => string;
}

/** Minimální rozhraní dynamicky vytvořené Lovelace karty. */
export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig?: (config: Record<string, unknown>) => void;
}

/**
 * Barevné prahy uzlu (semafor): pod `yellow_from` červená,
 * od `yellow_from` žlutá, od `green_from` zelená.
 * `severity_invert` obrátí význam (vysoká hodnota = špatná).
 * `bar_max` je rozsah progress baru na spodku uzlu.
 */
export interface SeverityFields {
  yellow_from?: number;
  green_from?: number;
  bar_max?: number;
  severity_invert?: boolean;
}

/** Konfigurace FVE / MPPT sekce. */
export interface PvConfig extends SeverityFields {
  /** Aktuální výkon panelů (W) — povinné. */
  power?: string;
  /** Výnos dnes (kWh). */
  energy_today?: string;
  /** Celkový výnos (kWh). */
  energy_total?: string;
  /** Maximální výkon dnes (W). */
  max_power_today?: string;
  /** Napětí FV sběrnice (V). */
  voltage?: string;
  /** Nabíjecí proud DC (A). */
  current?: string;
  /** Provozní režim MPPT. */
  mppt_state?: string;
  /** Zobrazovaný název panelu FVE, default "FVE panely". */
  name?: string;
  /** Zobrazovaný název MPPT regulátoru, default "MPPT regulátor". */
  mppt_name?: string;
}

/** Konfigurace baterie. Prahy default: žlutá od 15 %, zelená od 40 %. */
export interface BatteryConfig extends SeverityFields {
  /** SoC (%) — povinné pro zobrazení baterie. */
  soc?: string;
  /** Výkon baterie (W), kladný = nabíjení (Victron konvence). */
  power?: string;
  voltage?: string;
  current?: string;
  temperature?: string;
  /** Zdraví SoH (%). */
  soh?: string;
  /** Odhadovaná výdrž. */
  runtime?: string;
  /** Doba do plného nabití. */
  time_to_full?: string;
  /** Počet nabíjecích cyklů. */
  cycles?: string;
  /** Instalovaná kapacita (kWh / Ah). */
  capacity?: string;
  /** Obrátit znaménko výkonu (kladný = vybíjení). */
  invert?: boolean;
  /** Zobrazovaný název, default "Baterie Pylontech". */
  name?: string;
}

/** Konfigurace měniče (ostrovní strana). */
export interface InverterConfig extends SeverityFields {
  /** Výstupní výkon měniče (W). */
  power?: string;
  /** Stav měniče (text). */
  state?: string;
  /** Celková ostrovní spotřeba — kritické zátěže (W). */
  load_power?: string;
  /** Výstupní napětí AC (V). */
  voltage?: string;
  /** Výstupní proud AC (A). */
  current?: string;
  /** Počet dní v provozu — informační řádek. */
  days_in_service?: string;
  /** Zobrazovaný název, default "MultiPlus-II". */
  name?: string;
}

/** Konfigurace gridu (AC-IN). Pro spotřebu se hodí `severity_invert: true`. */
export interface GridConfig extends SeverityFields {
  /** Celkový příkon ze sítě (W). */
  power?: string;
  phase_a?: string;
  phase_b?: string;
  phase_c?: string;
  /** Celková energie ze sítě (kWh). */
  energy_total?: string;
  /** Denní energie ze sítě (kWh). */
  energy_today?: string;
  /** Zobrazovaný název, default "Síť ČEZ". */
  name?: string;
}

/** Konfigurace Solcast predikce. Prahy se počítají z `power_now`. */
export interface SolcastConfig extends SeverityFields {
  /** Predikovaný výkon teď (W). */
  power_now?: string;
  /** Zbývající dnešní predikce (kWh). */
  remaining_today?: string;
  /** Dnešní celková predikce (kWh). */
  total_today?: string;
  /** Zítřejší celková predikce (kWh). */
  total_tomorrow?: string;
}

/**
 * Konfigurace jednoho patra. Patro je uzel se dvěma vstupy:
 * grid větev (Shelly *-GRID-AC-OUT) a FVE/ostrovní větev.
 * Fáze grid větve mají volitelné vlastní názvy + ikony (pračka, sušička, sporák...).
 */
export interface FloorConfig {
  name?: string;
  /** Celkový výkon patra ze sítě (W); pokud chybí, sečtou se fáze. */
  grid_power?: string;
  /** Energie patra ze sítě (kWh). */
  grid_energy?: string;
  /** Výkon patra z ostrova/FVE (W) — patrová Shelly na FVE větvi. */
  island_power?: string;
  /** Energie patra z ostrova (kWh). */
  island_energy?: string;
  phase_a_entity?: string;
  phase_a_name?: string;
  phase_a_icon?: string;
  phase_b_entity?: string;
  phase_b_name?: string;
  phase_b_icon?: string;
  phase_c_entity?: string;
  phase_c_name?: string;
  phase_c_icon?: string;
}

/** Ladění chování toků a animací. */
export interface OptionsConfig {
  /** Výkon (W), při kterém animace běží plnou rychlostí. */
  max_flow_w?: number;
  /** Pod tímto výkonem (W) je linka „mrtvá" — šedá bez animace. */
  deadband_w?: number;
  /** Počet světelných teček na lince. */
  dots?: number;
  /** Nejrychlejší oběh tečky (s). */
  min_duration?: number;
  /** Nejpomalejší oběh tečky (s). */
  max_duration?: number;
  /** Vypnout animace úplně. */
  animation?: boolean;
}

export interface FveFlowCardConfig {
  type: string;
  title?: string;
  pv?: PvConfig;
  battery?: BatteryConfig;
  inverter?: InverterConfig;
  grid?: GridConfig;
  solcast?: SolcastConfig;
  floors?: FloorConfig[];
  options?: OptionsConfig;
  [key: string]: unknown;
}

/** Jedna fáze patra po rozbalení konfigurace. */
export interface PhaseSpec {
  entity: string;
  name: string;
  icon: string;
  label: string; // L1/L2/L3
}
