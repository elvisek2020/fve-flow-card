# Changelog

Poznámky k vydání. Sekce `## vX.Y.Z` se při releasu automaticky použije jako
text vydání na GitHubu — a ten Home Assistant / HACS ukazuje v okně aktualizace.

Nejnovější verze je nahoře.

## v2.0.1 — 2026-10-20

### 🐛 Opravy

- Entity integrace mají pevná anglická `entity_id` (např.
  `sensor.hybrid_energy_battery_forecast`) bez ohledu na jazyk Home Assistantu;
  názvy entit zůstávají česky. Platí pro nově vytvořené entity.
- Blok **Nabíjení ze sítě**: řádek s dnešní energií do nabíječe a průchodem už
  nepřetéká mimo box.

### 🎨 Vzhled

- Tok **síť → AC IN měniče** i v mobilním zobrazení karty.
- Vysvětlení plánu řekne, když nabíjení začíná dřív kvůli minimálnímu SoC,
  a kWh píše s desetinnou čárkou.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.0 — 2026-10-20

Z karty se stala **integrace Hybrid Energy**, která si kartu nese s sebou.

### ✨ Novinky

- **Plán nabíjení ze sítě (AC IN):** dobije jen to, co panely nestihnou, aby
  baterie po dni z panelů došla na 100 %. Ze sítě nejvýš na strop 90 %
  (jednou týdně 100 %), jen v nízkém tarifu (EG.D HDO) a co nejpozději.
- **Řízení AC IN** s ochranou stykače a kontrolou, že měnič opravdu nabíjí ze sítě.
  Tlačítka **Nabít teď**, **Vypnout nabíjení**, **Dnes v noci nenabíjet**.
- **Stínový režim** jako výchozí: integrace jen počítá a ukazuje plán, dokud
  nezapneš **Povolit automatické nabíjení**.
- **Chlazení** měniče podle jeho zátěže včetně nabíjení ze sítě (zapne nad 1 kW,
  vypne pod 900 W).
- Karta: blok **Nabíjení ze sítě** pod baterií (stav, plán na noc, příkon ze sítě,
  dnešní energie do nabíječe a průchodem, ovládání)
  a v prognóze sloupec **AC IN** (kolik, kdy a jak dlouho).
- **AC IN měniče ve scéně a v bilancích** (nová sekce `ac_in`): při nabíjení ze
  sítě modrý tok síť → AC IN měniče, baterie „ze sítě“ v barvě sítě, odečtení
  od patra a fáze, přes které je AC IN napájený. V Analýze se energie z AC IN
  počítá jako síť (soběstačnost, „Z FVE“), v Patrech je zvlášť jako
  **FVE – nabíjení ze sítě** a v DC bilanci jako příjem baterie mimo MPPT.
  Mini karta odečte AC IN od FVE (`ac_in_power`).

### 🛠️ Pod kapotou

- Prognóza výdrže se počítá v integraci (Python), karta ji jen zobrazuje.
- Profil odběru v prognóze nebere nabíjení ze sítě (AC IN) jako výrobu ani odběr.
- Karty načítá integrace sama, ruční Lovelace resource není potřeba.

### ⚠️ Změny, které vyžadují zásah

- V HACS kartu (kategorie Dashboard) odeber a repo přidej znovu jako
  **Integration**; ruční resource `/local/fve-flow-card.js` smaž. Postup je
  v README v části „Přechod z verze 1.x“.

> [!WARNING]
> Automatické nabíjení je po instalaci vypnuté (stínový režim). Zapni ho, až
> plán pár dní sedí, a nouzovou automatizaci ponech.

## v1.1.1 — 2026-10-12

### 🎨 Vzhled

- Poznámka pod prognózou výdrže vysvětluje, odkud je budoucí spotřeba —
  průměrný odběr z baterie za posledních 7 dní (včetně ztrát měniče),
  bez rozlišení všedního dne a víkendu.

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v1.1.0 — 2026-10-11

### ✨ Novinky

- **Barevné tečky k patrům** — tečky, které putují od měniče a ze sítě do
  jednotlivých pater, mají každá svůj odstín (ostrov zelená / žlutá / oranžová /
  bílá, síť v modrých tónech). Je vidět, která kam jde.
- Když tečka do patra dorazí, **okraj patra jemně zapulzuje** její barvou
  (nejvýš zhruba jednou za 5 s, při vypnuté animaci ne).

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v1.0.0 — 2026-10-11

První stabilní verze. Karta umí všechno, co jsem od ní chtěl:

- animované toky energie z ostrovní FVE a ze sítě do jednotlivých pater a fází,
- pruh energie baterie v kWh,
- **Prognózu výdrže** — ranní minimum a jestli / kdy se baterie nabije na 100 %,
  simulace po 15 minutách na 7 dní,
- okno **Analýza** — zdroje domu, patra, výroba vs. predikce, heatmapy výroby
  a SoC, DC bilance a zatížení fází, za 24 h až 90 dní,
- mini kartu pro hlavní dashboard.

### 🎨 Vzhled

- Stav dne v prognóze jako výraznější **čtvereček** se sytými barvami
  (zelená = nabije se na 100 %, oranžová = jen částečně, červená = ráno pod prahem).

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.10.2 — 2026-10-11

### 🎨 Vzhled

- Poznámka pod tabulkou prognózy bez řádku o šedých řádcích historie.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.10.1 — 2026-10-11

### 🎨 Vzhled

- Prognóza výdrže: bez souhrnného textu a řádku „Teď · kapacita · odběr ·
  práh“ nahoře — pod nadpisem je rovnou tabulka.
- Poznámka pod tabulkou rozdělená po větách na samostatné řádky.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.10.0 — 2026-10-11

### ✨ Novinky

- **Nová prognóza výdrže baterie** — odpovídá na ranní otázku:
  - nahoře souhrn: jak hluboko baterie v noci klesla, jestli a **kdy se dnes
    nabije na 100 %** (jinak na kolik) a kolik bude mít **zítra ráno**,
  - tabulka se sloupci **Ráno** (nejnižší SoC před začátkem nabíjení, s časem)
    a **Max** (nejvyšší SoC dne, u 100 % čas nabití),
  - barevná tečka: zelená = nabije se na 100 %, oranžová = jen částečně,
    šedá = nenabíjí se, červená = ráno pod prahem.
- Historie (5 dní) ukazuje naměřené ranní minimum a maximum z hodinových
  statistik SoC.

### 🛠️ Pod kapotou

- Místo denní bilance **simulace SoC po 15 minutách** na 7 dní: výroba podle
  průběhu dne ze Solcastu (`detailedForecast`) minus hodinový profil odběru
  z baterie (průměr posledních 7 dní, včetně ztrát měniče).

> [!NOTE]
> Sloupec „SoC po bilanci“ nahradily sloupce Ráno a Max. Pokud máš baterii
> v Ah, zkontroluj `battery.nominal_voltage` — kapacita přímo ovlivňuje výsledek.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.9.0 — 2026-10-03

### ✨ Novinky

- Nové nastavení **`battery.nominal_voltage`** (výchozí 48 V) — jmenovité napětí
  pro přepočet kapacity baterie z Ah na kWh. V editoru „Jmenovité napětí
  baterie (V)“ pod kapacitou.

### 🐛 Opravy

- Kapacita baterie v Ah se už nepřepočítává přes **aktuální** napětí — dřív
  kolísala s nabitím a byla nadsazená (např. 400 Ah × 49,8–52,3 V =
  19,9–20,9 kWh). Nově stabilně 400 Ah × 48 V = **19,2 kWh** v prognóze výdrže,
  Analýze (cykly, využití kapacity, čára kapacity) i v pruhu energie baterie.

> [!NOTE]
> Hodnoty kapacity a odvozená čísla mohou být po aktualizaci o pár procent nižší —
> odpovídají jmenovité kapacitě sady. Pokud máš jiné jmenovité napětí než 48 V,
> nastav `battery.nominal_voltage`.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.15 — 2026-10-03

### ✨ Novinky

- **Pruh energie baterie** dole v boxu baterie: „V baterii X kWh · z Y kWh“
  (SoC × kapacita), pruh v barvě SoC a ryska na prahu prognózy
  (`forecast.min_soc_pct`, výchozí 10 %). Zobrazí se, když je známá kapacita.

### 🎨 Vzhled

- Box baterie bez prázdného místa po přesunu Prognózy; výška scény počítá
  i se spodkem baterie (při 1–2 patrech se neořízne).

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.14 — 2026-10-03

### ✨ Novinky

- Samostatné tlačítko **PROGNÓZA** pod měničem, nad Analýzou — stejný styl
  jako ANALÝZA, s ikonou kalendáře. Nahrazuje malý chip „Prognóza“ u baterie.
  Bez potřebných entit je ztlumené a ukáže, co chybí.

### 🐛 Opravy

- Tabulka prognózy na mobilu: datum a hodnoty se už nezalamují na dva řádky.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.13 — 2026-10-03

### 🐛 Opravy

- iPhone / aplikace HA: okno **Analýza** už nezasahuje pod stavový řádek
  (hodiny, signál) ani pod domovskou lištu — respektuje bezpečné okraje displeje.
- Stejně ohraničená výška oken historie a prognózy.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.12 — 2026-10-01

### 🛠️ Pod kapotou

- Poznámky k vydání se berou z `CHANGELOG.md` — v okně aktualizace v Home
  Assistantu je teď přehled novinek a oprav místo holého odkazu.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.11 — 2026-09-30

### 🎨 Vzhled

- Legenda heatmapy SoC jen s barevným pruhem — položka „≥ 98 %“ odebrána
  (bílý rámeček v grafu zůstává).

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.10 — 2026-09-30

### 🎨 Vzhled

- Heatmapa SoC: bílý rámeček jen v hodinách s průměrným SoC **98–100 %**
  (dřív od 90 %).
- Bublina heatmapy SoC bez nadbytečné poznámky „SoC ≥ 98 %“.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.9 — 2026-09-29

### ✨ Novinky

- **Bubliny s hodnotami** ve všech grafech Analýzy — po najetí myší nebo
  klepnutí prstem (na dotyku jde i přejíždět po grafu):
  - průběh dne: svislá čára a hodnoty všech řad v 5min úseku, u skládaných
    i celkem, u výroby predikce a pásmo p10–p90, nabíjení / vybíjení baterie,
  - denní sloupce: hodnoty celého dne, součet a kapacita baterie,
  - heatmapy: hodnota buňky + doplňující údaj (výroba ↔ SoC).

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.8 — 2026-09-29

### 🎨 Vzhled

- Heatmapa SoC s výraznými barevnými přechody (červená → oranžová → fialová →
  modrá → světle zelená → tmavě zelená) a legendou jako pruh s popisky.
- Zatížení fází: kratší nadpis, ukazatele přes celou šířku ve skupinách
  (špičky · průměr · fáze · měnič).

### 🐛 Opravy

- „Baterie plná“ na heatmapách podle hodinového průměru SoC, výchozí práh
  `full_soc_pct` **99 %** — večer při klesajícím SoC už se hodina neoznačí.

> [!TIP]
> Po aktualizaci obnov stránku bez cache, případně zvyš `?v=` u resource.

## v0.8.7 — 2026-09-29

### ✨ Novinky

- Heatmapa **SoC baterie po hodinách** (0–24 h).
- Heatmapy odpovídají vybranému období (u 24 h jen hodiny uvnitř okna).

### 🎨 Vzhled

- Heatmapa výroby s pevným rozsahem 4–22 h.

## v0.8.6 — 2026-09-29

### ✨ Novinky

- Analýza: období **14, 60 a 90 dní**.
- Karta FVE a predikce: **heatmapa výroby** dny × hodiny, plná baterie orámovaná.

### 🧹 Odebráno

- Řádky „Teď“ a jejich pětisekundové obnovování.

## v0.8.5 — 2026-09-29

### ✨ Novinky

- Karta **Zatížení fází** pro dimenzování měniče: L1–L3 + výstup měniče,
  špička současně a horní odhad.
- Blok **Baterie vs. spotřeba**: kapacita × dní, vybito, využití kapacity,
  pokrytí spotřeby; vícedenní sloupce s čárou kapacity.

### 🧹 Odebráno

- Shrnutí (automatické postřehy) a patička s předpoklady.

## v0.8.4 — 2026-09-29

### ✨ Novinky

- Výchozí období **24 h** (klouzavých posledních 24 hodin).

### 🎨 Vzhled

- Dva sloupce karet už od šířky tabletu, okno ukotvené k okrajům obrazovky.

## v0.8.3 — 2026-09-29

### 🐛 Opravy

- Okno Analýza na iPadu: pevná velikost (WebKit tělo už nesmrskne na nulu),
  záložní barvy pro starší Safari bez `color-mix()`.

## v0.8.2 — 2026-09-28

### 🐛 Opravy

- Chybějící dny měřáku se doplní z dalšího zdroje (integrál výkonu, součet pater).
- Neměřeno, nesoulad měřáků a DC bilance jen za dny s daty ze všech měřáků.

## v0.8.1 — 2026-09-28

### 🎨 Vzhled

- Tlačítko ANALÝZA pod ZPĚT, širší a čitelnější okno.

## v0.8.0 — 2026-09-28

### ✨ Novinky

- Okno **Analýza**: zdroje domu, tokový diagram pater, výroba vs. predikce
  Solcast, DC bilance MPPT · baterie · střídač — za Dnes / Včera / 7 / 30 dní.
