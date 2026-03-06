# Core Engine and App Loop

Documentation note:
- Start with `PROJECT_MASTER.md`.
- This document records current implementation behavior plus the recommended migration path.

## Purpose
- Centralize game phase transitions.
- Run gameplay actions through one dispatch loop.
- Keep rendering/event updates deterministic and testable.

## Engine Module
- Runtime module: `engine-core.js`
- Global API: `window.BRASSLINE_ENGINE_CORE`
- `BRASSLINE` is a legacy runtime namespace, not the desired product-facing name.

### Exposed APIs
- `createPhaseController(...)`
- `createActionLoop(...)`
- `createRenderLoop(...)`
- `createGameEngine(...)`

## Current Runtime Phase Model
- `run_setup`
- `player`
- `enemy`
- `reward`
- `interlude`
- `run_victory`
- `gameover`
- `run_failed`

Transitions are validated in the engine, and `main.js` uses `setGamePhase(...)` to route phase changes.

### Current Phase Contracts

| Phase | Current meaning | Main actions allowed | Typical exits |
|---|---|---|---|
| `run_setup` | fresh run setup, reset, or resume boundary | initialize state, load snapshot, begin encounter | `player`, `reward`, terminal phases |
| `player` | player-controlled combat turn | play cards, use skills/items, move, end turn | `enemy`, `reward`, terminal phases |
| `enemy` | enemy-resolution turn | resolve intents, apply enemy-side turn effects | `player`, `reward`, terminal phases |
| `reward` | post-clear reward selection | choose reward, skip reward, continue route | `interlude`, `player`, terminal phases |
| `interlude` | non-combat event/shop-style choice | resolve one interlude option, branch route | `player`, terminal phases |
| `run_victory` | current successful terminal state | restart or inspect summary | `run_setup`, `player` |
| `gameover` | current loss terminal state | restart or inspect summary | `run_setup`, `player` |
| `run_failed` | reserved failure terminal state | none meaningfully wired yet | `run_setup`, `player` |

### Current Weaknesses

- `player` and `enemy` are combat subphases but currently occupy the same level as run phases.
- `interlude` mixes multiple future concepts: events, safe-zone transitions, and route transitions.
- `run_victory` and `gameover` are implementation-specific terminal labels rather than clean run outcomes.
- `run_failed` exists in the enum but is not yet meaningfully used by current flow logic.

## Recommended Phase Migration

The next phase-model cleanup should split run-state flow from combat turn flow.

### Top-Level Run Phases

- `run_setup`
- `character_select`
- `safe_zone`
- `world_map`
- `encounter`
- `reward`
- `act_transition`
- `run_complete`
- `run_failed`

### Combat Subphases

These should live inside `CombatState`, not the global engine enum:

- `combat_start`
- `player_turn`
- `enemy_telegraph`
- `enemy_resolve`
- `combat_cleanup`

### Migration Mapping

| Current phase | Target direction |
|---|---|
| `run_setup` | stays `run_setup` |
| `player` | becomes `encounter` + `player_turn` |
| `enemy` | becomes `encounter` + `enemy_telegraph` / `enemy_resolve` |
| `reward` | stays `reward` |
| `interlude` | becomes safe-zone, world-map, or placeholder event flow depending content type |
| `run_victory` | becomes `run_complete` |
| `gameover` | becomes `run_failed` |
| `run_failed` | becomes the actual canonical failure terminal state |

### Rules

- Global engine phases should describe where the run is, not whose turn it is.
- Combat timing belongs in combat state.
- Tooltips, modal panels, and hover state are UI state, not phase state.
- If a new state does not change mutation rules, it probably should not be a top-level phase.

## App Loop Model
- User/system actions are routed through `runGameAction(actionId, execute)`.
- The engine executes actions in order via the action loop.
- A render request is emitted after each successful action and each successful phase transition.

## Integration Points
- `player-actions.js`
  - `startPlayerTurn` and `endTurn` now support `setGamePhaseFn`.
- `run-flow.js`
  - `beginInterlude`, `beginSectorBattle`, `applyRewardAndAdvance`, `checkEndStates` now support `setGamePhaseFn`.
- `main.js`
  - Owns one engine instance (`gameEngine`).
  - Routes phase changes with `setGamePhase(...)`.
  - Routes control/forecast actions with `runGameAction(...)`.
  - Routes enemy-card selection/tooltip, hand-card play, reward choice, and interlude choice clicks with `runGameAction(...)`.

## Debug Hooks
- `window.__brasslineDebug.engine`
- `window.__brasslineDebug.setGamePhase(...)`
- `window.__brasslineDebug.runGameAction(...)`

These are intended for diagnostics and deterministic test control.
