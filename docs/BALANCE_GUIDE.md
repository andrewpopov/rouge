# Balance Guide

This project reads gameplay tuning from `window.BRASSLINE_BALANCE` in [`balance.js`](../balance.js).

## How It Works

- Values in `balance.js` override in-code defaults.
- Invalid values automatically fall back to safe defaults.
- Most changes apply after `initGame()` (restart run).

## Top-Level Keys

- `rules`
- `rewards`
- `telegraph`
- `player`
- `upgrades`
- `upgradePaths`
- `overclock`
- `enemies`
- `cards`
- `progression`
- `ui`

## Recommended Ranges

- `rules.handSize`: `3` to `8`
- `rules.maxHeat`: `80` to `160`
- `rules.trackLanes`: `3` to `7` (UI is tuned for `5`)
- `rewards.choiceCount`: `2` to `4`
- `rewards.chosenHeal`: `4` to `16`
- `rewards.skipHeal`: `0` to `12`
- `player.baseMaxHull`: `50` to `120`
- `player.baseMaxEnergy`: `2` to `6`
- `player.startHeat`: `0` to `80`
- `player.carryRatio`: `0.2` to `0.8`
- `player.carryFloor`: `0` to `40`
- `upgrades.hullPerHullPlatingLevel`: `2` to `12`
- `upgrades.turnStartCoolingBase`: `0` to `16`
- `upgrades.turnStartCoolingPerLevel`: `0` to `6`
- `upgrades.turnStartBlockPerGuardLevel`: `0` to `6`
- `overclock.heatGain`: `4` to `20`
- `overclock.strainThreshold`: `70` to `120`
- `overclock.strainDamage`: `1` to `8`
- `upgradePaths.<id>.maxLevel`: `1` to `9`

## Path IDs (Fixed)

These IDs are gameplay-wired and should be kept:

- `condenser_bank`
- `coolant_loop`
- `hull_plating`
- `guard_protocol`

You can tune each path’s:

- `title`
- `icon`
- `description`
- `maxLevel`

## Enemies

`enemies.<enemyId>` supports:

- `maxHp`
- `startIntentIndex` (optional)
- `intents[]` fields used by each enemy pattern:
  - `value`
  - `hits`
  - `cookTier`
  - `radius`
  - `width`

## Cards

`cards.<cardId>` supports:

- Display text:
  - `cost`
  - `text`
  - `heatText`
- Effect values:
  - `heatGain`
  - damage / block / draw / energy / threshold keys used by that card

## Progression

`progression` supports:

- `sectors[]`: `name`, `boss`, `enemies[]` (`key`, `power`)
- `starterDeck[]`: card IDs
- `rewardPool[]`: card IDs
- `interludes[]` (optional): non-combat nodes shown after a sector reward
  - `afterSector`: 1-based cleared-sector index
  - `type`: `event` or `shop`
  - `title`, `description`
  - `options[]`:
    - `label`
    - optional effects: `hull`, `heat`, `addCard`, `removeCard`
    - optional route branch: `targetSector` (1-based sector index, forward only)

Invalid IDs are dropped automatically. Empty/invalid lists fall back to defaults.

## Safety Notes

- Large changes can make runs unwinnable or trivial quickly.
- Prefer small value changes, then playtest.
- If a section is malformed, the game falls back to built-in defaults for stability.
