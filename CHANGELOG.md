# Changelog

Poznámky k vydání. Sekce `## vX.Y.Z` se při releasu automaticky použije jako
text vydání na GitHubu — a ten Home Assistant / HACS ukazuje v okně aktualizace.

Nejnovější verze je nahoře.

## v2.1.2 — 2026-10-24

### 🎨 Vzhled

- **Prognóza výdrže**: dnešní řádek je zvýrazněný (podbarvení a modrý proužek)
  a historie ukazuje jen 3 dny zpět.

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v2.1.1 — 2026-10-23

### 🎨 Vzhled

- **Prognóza výdrže**: ve sloupcích *AC IN od* / *do* má čas ze dne před řádkem
  zkratku dne, např. u neděle „so 23:45“. Je tak vidět, že nabíjení začíná už
  večer předtím.

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v2.1.0 — 2026-10-23

### ✨ Novinky

- **Nový cíl plánování: rezerva do další noci.** Integrace v noci dobije jen
  tolik, aby baterie do začátku další noci neklesla pod **Rezervu do další noci**
  (výchozí 30 %). Na 100 % baterii dotahují panely, takže se po dobití ze sítě
  už neztrácí výroba (21.–22. 10. to bylo ~6 kWh).
- Ze sítě se nabíjí **jen v noci**: mezi časy *Nabíjet ze sítě nejdřív od*
  (21:00) a *nejpozději do* (08:00), v nízkém tarifu a co nejpozději. Denní okna
  nízkého tarifu se nepoužijí. Ochrana minima SoC smí nabíjet i dřív.
- Strop nabíjení ze sítě (90 %) je jen horní limit. Když jedné noci nestačí čas
  v nízkém tarifu, dobije víc už noc předtím.
- Časy nízkého tarifu na dny, které HDO ještě nezná, se opakují zvlášť pro
  **všední dny a víkend** (o víkendu EG.D posouvá okna, např. NT do 8:15).
- Důvod plánu ukazuje „min. SoC do další noci X % (rezerva Y %) → dobít Z kWh“,
  senzor plánu má atributy `reserve`, `reserve_min_without`, `reserve_min`.

### ⚠️ Změny, které vyžadují zásah

- Týdenní nabíjení na 100 % ze sítě je zrušené i s nastavením *Plné nabití
  aspoň jednou za*. Entitu `number.hybrid_energy_full_charge_at_least_every`
  můžeš v HA smazat (zůstane jako nedostupná).
- Nové entity: `number.hybrid_energy_grid_charge_reserve`,
  `time.hybrid_energy_night_charge_from`, `time.hybrid_energy_night_charge_until`.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.16 — 2026-10-23

### 🐛 Opravy

- Automatické nabíjení podle plánu se ve **vysokém tarifu** šetrně přeruší
  a v dalším okně nízkého tarifu pokračuje podle přepočítaného plánu. Dřív
  začaté nabíjení jelo až do cíle i přes VT (22. 10. ráno 7:15–8:15).
- Výjimky: když je SoC pod minimem, nabíjí se i ve VT (do minima + 2 %,
  s důvodem v logbooku), a ruční **Nabít teď** jede do cíle bez ohledu na tarif.
- Plánované nabíjení **nepřebíjí**: jeho cíl se s každým přepočtem plánu
  snižuje a nabíjení skončí, jakmile plán ze sítě už nic nepotřebuje (např.
  ráno, když panely zbytek dobijí). 22. 10. jelo o ~1,4 h déle a odpoledne se
  pak kvůli plné baterii ztrácela výroba.
- Nabíjení začne, až se na začátku shodnou dva přepočty plánu po sobě — jeden
  výkyv přepočtu (22. 10. v 5:02) už nespustí celou noc dřív.
- Záznam v logbooku při zapnutí uvádí i okno plánu, které nabíjení spustilo.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.15 — 2026-10-21

### 🎨 Vzhled

- **Prognóza výdrže**: sloupec AC IN je rozdělený na **AC IN od** (SoC a čas,
  kdy nabíjení ze sítě začne), **AC IN do** (SoC a čas konce) a **Ze sítě**
  (kWh a jak dlouho, okna v bublině). Je tak vidět, proč je ráno baterie nabitější.
  Okno je širší (1000 px). Na mobilu jsou jen sloupce *od* a *do*.

### 🛠️ Pod kapotou

- Prognóza (atribut `days`) má u každé noci `grid_start_soc`, `grid_start_at`,
  `grid_end_soc` a `grid_end_at`.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.14 — 2026-10-21

### ✨ Novinky

- Plán nabíjení počítá se **skutečným výkonem nabíjení**, který se integrace
  naučila z historie (DC proud × napětí MultiPlusu), třeba ~2 kW po snížení
  limitu vstupu. Dokud ho nezná, bere nastavení, které se teď jmenuje
  *Výkon nabíjení ze sítě (záloha)*. Co plán používá, ukazují atributy
  `charge_power_w` a `charge_power_source` senzoru plánu.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.13 — 2026-10-21

### 🐛 Opravy

- **Nabít teď** při už sepnutém AC IN (např. zapnutém mimo plánovač) nabíjení
  převezme, takže ho na cíli zase vypne.
- Během šetrného odpojování se v historii stavu plánovače už neobjeví krátké
  „Zapnuto mimo plánovač“.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.12 — 2026-10-21

### 🐛 Opravy

- Běžící nabíjení (i ruční **Nabít teď**) teď opravdu přežije restart Home
  Assistantu. Nastavení obnovená při startu (např. *Povolit automatické nabíjení*)
  přepsala uložený stav prázdným dřív, než se stihl načíst. Uložený stav se teď
  načte před entitami a do té doby se nic neukládá.

> [!TIP]
> Po aktualizaci restartuj Home Assistant. Pokud zrovna běží ruční nabíjení,
> po tomto jednom restartu ho spusť znovu (**Nabít teď**).

## v2.0.11 — 2026-10-21

### 🐛 Opravy

- Prognóza a plán zase počítají s **nočním nabíjením i na další dny**. Integrace
  EG.D (v0.6) posílá v `HDO_HOURLY` ceny tarifů (3,83 / 4,65 Kč) místo 1 / 2,
  takže se nenašel žádný nízký tarif a zbyl jen dnešek do půlnoci. Nízký tarif
  se teď pozná podle `price_nt` (jinak nižší hodnota).
- Textové časy HDO na zítřek (`hdo_times_tomorrow`) se četly špatně a opakovat
  se do dalších dnů nedaly.
- Opakování posledního známého dne zachová i ranní okno (např. 21:15 → 7:15),
  dřív se do dalších dnů přeneslo jen večerní okno do půlnoci.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.10 — 2026-10-21

### 🐛 Opravy

- Šetrné odpojení: „Ignorovat AC vstup“ se po rozepnutí stykače vypne vždy.
  Dřív mohl zůstat zapnutý, když se jeho stav z GX hlásil se zpožděním, a pak
  by se Victron po dalším sepnutí stykače (pojistka, ručně) nepřipojil.
  Integrace ho po startu vypne i tehdy, když zůstal zapnutý při rozepnutém AC IN.
- Stav plánovače se přepočítá hned při změně AC IN (stykač, vstup GX, napětí),
  takže po vypnutí nezůstane viset „Zapnuto mimo plánovač“.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.9 — 2026-10-21

### 🐛 Opravy

- Po restartu Home Assistantu během nabíjení integrace „zapomněla“, že AC IN
  sepnula sama: ukázala stav *Zapnuto mimo plánovač* a po dosažení cíle ani na
  konci okna ho nevypnula. Integrace si teď ukládá, kdo AC IN sepnul, běžící
  nabíjení (cíl a konec), přeskočení, potlačení i chybu bez napětí a po restartu
  je obnoví. Jakmile je AC IN vypnutý, vlastnictví zaniká.

> [!TIP]
> Po aktualizaci restartuj Home Assistant.

## v2.0.8 — 2026-10-20

### ✨ Novinky

- Blok **Nabíjení ze sítě** při běžícím nabíjení (podle plánu i ručním) ukazuje
  místo přepočítaného plánu na zbytek noci cíl a odhad konce, např.
  „Do 62 %, cca do 22:40“ a „Nabije ještě 2,1 kWh“.
- Senzor plánu nabíjení má atribut `session` (cíl SoC, zbývající kWh, odhad
  konce). Odhad počítá z aktuálního výkonu do baterie (DC proud × napětí), jinak
  z naučeného nebo nastaveného výkonu nabíjení.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.7 — 2026-10-20

### ✨ Novinky

- **Šetrné odpojení AC IN:** s novou volitelnou entitou *Ignorovat AC vstup*
  (Victron) integrace nejdřív odpojí MultiPlus od sítě, počká, až GX přestane brát
  síť (max 30 s), a teprve pak rozepne stykač. Stykač už nerozpíná pod proudem
  a proudový chránič nevypadává.
- **Hlídání „sepnuto, ale bez napětí“:** když po sepnutí AC IN do 2 minut nepřijde
  síť (nová volitelná entita *Napětí sítě na AC IN*, jinak aktivní vstup GX),
  integrace stykač rozepne, stav plánovače je **Bez napětí na AC IN**, přijde
  notifikace „zkontroluj jistič nebo proudový chránič“ a nabíjení se to
  nepočítá. Další pokus za 30 min, nebo hned po **Nabít teď**.

### ⚠️ Změny, které vyžadují zásah

- V možnostech integrace doplň *Ignorovat AC vstup*
  (`switch.multiplus_…_ovladani_ignore_ac_in_1`) a *Napětí sítě na AC IN*
  (`sensor.multiplus_…_vstupni_napeti_l1`). Bez nich se odpojuje jako dřív.

### 🎨 Vzhled

- Tlačítko v bloku **Nabíjení ze sítě** říká, co udělá: při nabíjení podle plánu
  **Přerušit nabíjení podle plánu** (plán pokračuje dalším oknem), při ručním
  **Vypnout ruční nabíjení**, jinak **Vypnout nabíjení**.

### 🐛 Opravy

- Když AC IN zapne něco mimo plánovač (stav „Zapnuto mimo plánovač“), blok
  nabízí vypnutí a rozsvítí se, místo tlačítka Nabít teď.
- Blok **Nabíjení ze sítě** při stavu Bez napětí na AC IN svítí červeně.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.6 — 2026-10-20

### 🐛 Opravy

- Karty se po obnovení stránky (hlavně bez cache) občas nenačetly a dashboard
  ukázal „Custom element doesn't exist: fve-flow-mini-card“. Integrace teď kartu
  registruje jako **zdroj dashboardů** (Lovelace resource), který se načítá
  před kartami; při aktualizaci přepíše verzi v adrese a po odebrání integrace
  zdroj smaže. V YAML režimu dashboardů zůstává doplňkový modul frontendu.
- Kdyby se bundle karet načetl dvakrát, už nespadne na opakované registraci
  elementů.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.5 — 2026-10-20

### 🎨 Vzhled

- **Měnič**: s tlačítkem chlazení se panel prodlouží o řádky Kritické zátěže
  a AC IN, takže se text už nedotýká tlačítka. Na desktopu roste nahoru do volného
  místa pod Solcastem, tlačítka pod měničem zůstávají na místě.

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v2.0.4 — 2026-10-20

### 🎨 Vzhled

- Blok **Nabíjení ze sítě** má jedno tlačítko: **Nabít teď**, které se během
  nabíjení změní na **Vypnout nabíjení**. Po vypnutí se nabíjení vrací k plánu.
- Tlačítko **Automat** z karty zmizelo, aby se automatické nabíjení nedalo omylem
  vypnout. Zapíná se v integraci (**Povolit automatické nabíjení**).
- Rámeček bloku **Nabíjení ze sítě** má jako ostatní panely svou barvu (modrá
  sítě): ztlumený, když je jen naplánováno, rozsvícený se září během nabíjení.

> [!TIP]
> Po aktualizaci obnov stránku bez cache.

## v2.0.3 — 2026-10-20

### 🎨 Vzhled

- **Analýza → Zdroje domu**: menší boxíky, „Ze sítě přes AC IN“ se vejde
  do jednoho řádku s ostatními.
- **Analýza → MPPT · baterie · střídač**: uzel „Ze sítě (AC IN)“ bez textu
  o účinnosti, popisek už nepřesahuje.
- **SoC baterie po hodinách**: hodiny, kdy se baterie nabíjela ze sítě přes
  AC IN, mají červený rámeček a v bublině výkon nabíjení.
- **Prognóza výdrže**: širší okno (820 px) a víc místa mezi sloupci.
- Blok **Nabíjení ze sítě**: „Dnes do nabíječe X kWh, do baterie Y kWh“ na jednom
  řádku, pod ním „Průchod ze sítě do domu“. Účinnost nabíjení už se neukazuje.
- Tok **nabíjení ze sítě → měnič (AC IN)** vede z bloku Nabíjení ze sítě do boku
  měniče místo od uzlu sítě. Bez integrace (blok chybí) zůstává tok od sítě.

### 🐛 Opravy

- **Do baterie** se počítá ze skutečného DC výstupu nabíječe (DC proud × DC napětí
  MultiPlusu), ne z výkonu `dc_power`, který je u Victronu na AC straně a dával
  účinnost ~100 %. Platí pro blok Nabíjení ze sítě, Analýzu i atribut
  `learned_charge_power_w` integrace.

### ⚠️ Změny, které vyžadují zásah

- V konfiguraci karty doplň `ac_in.dc_current` a `ac_in.dc_voltage` (DC proud
  a napětí měniče) a stejné entity v možnostech integrace. Bez nich se „do baterie“
  neukazuje.

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

## v2.0.2 — 2026-10-20

### ✨ Novinky

- Blok **Nabíjení ze sítě** ukazuje i energii, která za dnešek skutečně došla
  do baterie, a účinnost nabíjení („Do baterie 2,6 kWh · účinnost nabíjení 90 %“).
- **Analýza**: uzel „Ze sítě (AC IN)“ v DC bilanci počítá energii do baterie
  z DC výkonu MultiPlusu a ukazuje účinnost nabíjení za období.
- Senzor plánu nabíjení má atribut `learned_charge_power_w` — skutečný výkon
  nabíjení ze sítě do baterie zjištěný z historie (zatím jen pro informaci).

> [!TIP]
> Po aktualizaci restartuj Home Assistant a obnov stránku bez cache.

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
