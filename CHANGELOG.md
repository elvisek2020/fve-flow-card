# Changelog

Poznámky k vydání. Sekce `## vX.Y.Z` se při releasu automaticky použije jako
text vydání na GitHubu — a ten Home Assistant / HACS ukazuje v okně aktualizace.

Nejnovější verze je nahoře.

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
