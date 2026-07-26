---
name: fve-flow-release
description: >-
  Releases Hybrid Energy Flow Card (fve-flow-card): SemVer bump in package.json,
  Release commit, push to main, and vX.Y.Z tag for HACS. Use when the user asks
  for verze, release, „verze a git", „posli do gitu", tag, or HACS publish.
---

# fve-flow-card — release workflow

## Kdy použít

Uživatel chce vydat změnu: „verze a git", „aktualizuj verzi a pošli do gitu",
„tag", „release".

## Pravda o buildu

- **Release asset staví GitHub Actions** (`.github/workflows/release.yml`) při
  pushi tagu `v*`: `npm ci` → `npm run build` → přiloží `dist/fve-flow-card.js`
  k GitHub Release. HACS bere tenhle asset (`hacs.json` → `filename`).
- **Nepouštěj `npm run build` jen kvůli release commitu.** Lokální build jen
  když uživatel chce ověřit změnu lokálně / zkopírovat do HA.
- Validate workflow (`validate.yml`) build kontroluje na push/PR — to nestačí
  na HACS release; potřeba je **tag**.

## Postup (default)

1. Zjisti aktuální verzi v `package.json` a zvedni SemVer (patch, pokud není
   řečeno jinak): `0.6.7` → `0.6.8`.
2. **Jediný soubor s verzí pro release:** `package.json`.
   Rollup při CI buildu vloží verzi jako `__CARD_VERSION__`.
3. Commit (styl historie):

   ```text
   Release vX.Y.Z: krátký popis změny česky
   ```

   Příklady z historie:
   - `Release v0.6.7: větší čtverec a mezera u tlačítka ZPĚT`
   - `Release v0.6.5: konfigurovatelné tlačítko ZPĚT pod měničem`

4. Commitni relevantní změny (src, README, `package.json`).
   `dist/` může zůstat jak je — CI ho přegeneruje. Pokud je `dist/` v diffu
   ze staršího lokálního buildu a uživatel nechce šum, nech ho nebo ho
   necommituj zbytečně; priorita je src + version.
5. Vytvoř tag a pushni **commit i tag**:

   ```bash
   git tag vX.Y.Z
   git push -u origin HEAD
   git push origin vX.Y.Z
   ```

6. Ověř: `git status` clean, `git ls-remote --tags origin 'vX.Y.Z'`.
7. Stručně reportuj: verze, hash commitu, že tag je venku (HACS update po
   doběhnutí Actions).

## Co NEdělat

- Neměň verzi ani necommituj/nepushuj, dokud o to uživatel neřekne.
- Nespouštěj `npm run build` „pro jistotu" při release — zdržuje a není potřeba
  pro HACS asset.
- Nezapomeň na tag: push jen `main` **bez** `vX.Y.Z` = žádný GitHub Release /
  HACS update.
- Nepoužívej `git commit --amend`, force push, ani úpravy git config.

## Pokud smart-mode zablokuje tag

Tag je u „verze a git" **součást zadání** (HACS). Požádej o approval a zopakuj
push tagu. Když uživatel approval přeskočí, pushni aspoň commit a výslovně
řekni, že tag chybí a release neběží.

## Rychlý checklist

```
- [ ] package.json version bumped
- [ ] commit: Release vX.Y.Z: …
- [ ] git push origin HEAD
- [ ] git tag vX.Y.Z && git push origin vX.Y.Z
- [ ] tag visible on remote
```
