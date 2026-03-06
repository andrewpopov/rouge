# Diablo II High-Fidelity Migration Plan

Documentation note:
- Start with `PROJECT_MASTER.md`.
- This document covers migration work from the retired prototype toward the target product.

## 1. Guardrails

- Do **not** use Blizzard-owned Diablo II assets directly.
- Use legal replacement assets (CC0 / CC BY) with attribution.
- Keep gameplay deterministic and testable while re-theming visuals/content.
- Preserve canonical Diablo II structure, NPC roles, zones, bosses, and quest beats where feasible.

## 2. Asset Intake (Completed)

- Downloaded Game-icons dark-fantasy tags into `assets/source/game-icons` and `assets/raw/game-icons`:
  - `medieval-fantasy`, `weapon`, `blade`, `skull`, `blood`, `fire`, `poison`, `armor`, `zombie`, `vampire`, `death`, `mask`
- Curated theme-ready icon set in:
  - `assets/curated/themes/diablo-inspired/icons`
- Icon remap scaffold:
  - `assets/curated/themes/diablo-inspired/icon-map.json`
- Repeatable commands:
  - `./scripts/download-dark-fantasy-assets.sh`
  - `./scripts/curate-dark-fantasy-icons.sh`

## 3. Migration Goals

- Replace sci-fi/steampunk visual language with gothic dark-fantasy.
- Move from loose inspiration toward high-fidelity Diablo II run structure with legal replacement assets.
- Introduce run gear drops (loot pickups) that modify stats/synergies.
- Add objective/boss-gated upgrade trees (persistent progression).
- Preserve current turn-based tactical loop and telegraph readability.

## 4. Implementation Phases

## Phase A: Visual Foundation

- Update `styles.css` theme tokens (palette, fonts, panel/button/card treatments).
- Replace top-level copy in `index.html`/HUD with dark-fantasy terminology.
- Add optional theme toggle (`classic` vs `diablo-inspired`) to reduce rollout risk.

Acceptance:
- UI reads as dark-fantasy at a glance.
- Existing interaction tests remain green.

## Phase B: Icon + Art Swap

- Add `DIABLO_THEME_ASSET_MAP` config (cards/enemies/ui icon mapping).
- Wire theme mappings into:
  - card rendering (`main.js`, `run-ui.js`)
  - enemy rendering (`enemy-ui.js`, `enemy-catalog.js`)
  - HUD icons (`index.html`, `styles.css`)
- Keep old curated set as fallback.

Acceptance:
- No missing icon paths.
- Enemy/card roles remain visually distinct.

## Phase C: Gear Drop System (Run Loot)

- New run-scoped state:
  - `game.gearInventory`
  - `game.equippedGear` (`weapon`, `armor`, `trinket`)
- Add gear catalog module:
  - rarity tiers, slot restrictions, stat modifiers, proc effects.
- Reward integration:
  - gear options added to reward pool after elite/boss/objective completions.
- HUD:
  - gear strip + tooltip panel + quick equip/swap.

Acceptance:
- Gear changes combat outcomes (damage/block/heat/energy or conditional procs).
- Run summary shows acquired/equipped gear.

## Phase D: Objective/Boss Upgrade Trees (Meta)

- New tree model:
  - nodes, edges, unlock costs, prerequisites, objective keys.
- Unlock sources:
  - boss kills
  - explicit objectives (no-hit sector, speed clear, elite streak, etc.).
- Persisted state:
  - account-level unlock ledger + per-path levels/branch choices.
- UI:
  - dedicated tree view panel with locked/unlocked state and unlock text.

Acceptance:
- Completing objectives or boss milestones unlocks expected nodes.
- Progress persists across runs and survives reload.

## Phase E: Content Pass + Balance

- Add dark-fantasy themed enemies/cards/gear names and descriptions.
- Rebalance around new gear + tree synergies.
- Expand automated tests for:
  - unlock conditions
  - reward distribution
  - persistence migration
  - regression smoke runs

Acceptance:
- No soft-locks in progression.
- Win/loss rates remain in target band after re-tune.

## 5. Data/Code Work Items

- New modules:
  - `gear-catalog.js`
  - `gear-system.js`
  - `upgrade-tree.js`
  - `objective-tracker.js`
- Existing modules to extend:
  - `main.js`, `run-flow.js`, `progression.js`, `meta-progression.js`, `run-ui.js`, `hud-state.js`, `persistence.js`
- New tests:
  - `tests/gear-system.test.js`
  - `tests/upgrade-tree.test.js`
  - `tests/objective-tracker.test.js`
  - `tests/diablo-theme-smoke.test.js`

## 6. Recommended Rollout Order

1. Phase A + B first (theme + asset swap, no mechanics risk).
2. Ship Phase C gear as run-only feature flag.
3. Ship Phase D tree unlocks in limited branch set.
4. Phase E rebalance once telemetry/feedback stabilizes.
