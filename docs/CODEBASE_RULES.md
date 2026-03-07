# Codebase Rules

Last updated: March 7, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document for live module ownership and architecture patterns that new code must follow.
- Use `APPLICATION_ARCHITECTURE.md` for target-state domain planning and staged build order.

## Purpose

This document answers three questions:

- what files are the editable source of truth
- how the live runtime is assembled
- what architectural patterns all new systems must follow

## Live Source Of Truth

Editable source:

- `index.html`
- `styles.css`
- `src/**/*.ts`
- `src/types/game.d.ts`
- `tests/*.test.ts`
- `data/seeds/d2/*.json`
- `docs/COMBAT_FOUNDATION.md`
- `docs/CODEBASE_RULES.md`

Generated output:

- `generated/src/**/*.js`
- `generated/tests/**/*.test.js`
- `dist/`

Rules:

- edit TypeScript under `src/` and tests under `tests/`
- do not hand-edit `generated/` or `dist/`
- the browser currently runs emitted JS, but the authored source of truth is TypeScript

## Live Module Map

### Delivery Layer

- `index.html`
  - defines the shell and script order
  - loads emitted browser runtime from `generated/src/**`

- `scripts/build.js`
  - copies `index.html`, generated runtime files, assets, and seed data into `dist/`

### Source Modules

- `src/content/game-content.ts`
  - authored hero defaults, cards, mercenaries, starter deck profiles, and fallback encounters

- `src/content/seed-loader.ts`
  - loads the D2 seed bundle from `data/seeds/d2/*.json`

- `src/content/encounter-registry.ts`
  - merges authored content with seed-derived act encounter and enemy sets

- `src/character/class-registry.ts`
  - turns class seed data into hero shells and starter deck selection

- `src/run/run-factory.ts`
  - owns `RunState`, act generation, zone progression, reward application, and act advancement

- `src/combat/combat-engine.ts`
  - owns deterministic encounter resolution and encounter-local mutation

- `src/app/app-engine.ts`
  - owns top-level app phases and the handoff between run and combat

- `src/app/main.ts`
  - renders the UI and forwards DOM events into the app and combat APIs

- `src/types/game.d.ts`
  - shared structural contracts for app, run, combat, content, and test harnesses

### Verification Layer

- `tests/app-engine.test.ts`
  - validates the outer app loop against the compiled browser runtime

- `tests/combat-engine.test.ts`
  - validates the encounter contract against the compiled browser runtime

The tests intentionally exercise `generated/` output through a `vm` browser sandbox. That is part of the architecture.

## Live Data Flow

1. `index.html` loads emitted browser scripts from `generated/src/**`.
2. `src/content/seed-loader.ts` loads D2 seed data.
3. `src/content/encounter-registry.ts` merges authored content and seed-derived encounter sets into runtime registries.
4. `src/app/app-engine.ts` creates `AppState` and preloads selectable classes and mercenaries.
5. `src/app/app-engine.ts` starts a run by asking `src/character/class-registry.ts` for the hero shell and starter deck, then asking `src/run/run-factory.ts` to create `RunState`.
6. `src/app/app-engine.ts` enters an encounter by asking `src/run/run-factory.ts` for the next encounter and passing run-state overrides into `src/combat/combat-engine.ts`.
7. `src/combat/combat-engine.ts` resolves the encounter without mutating broader run progression directly.
8. `src/app/app-engine.ts` snapshots encounter results back into `RunState`.
9. `src/run/run-factory.ts` applies reward and progression mutation.

## Architecture Patterns

### 1. TypeScript-First Source

- All editable runtime logic belongs in `src/**/*.ts`.
- The browser runs emitted JS from `generated/`, but that output is disposable.
- If a runtime behavior changes, the TS source changes first.

### 2. Thin Delivery Bridges

- `index.html` and `src/app/main.ts` are delivery bridges, not domain logic dumps.
- New mechanics should land in a domain module first.
- Keep browser boot and DOM wiring thin even while the UI is still concentrated in `src/app/main.ts`.

### 3. Stable Public Browser Contract

- The live browser and tests depend on `window.ROUGE_*` exports.
- Internal extraction is allowed, but the public browser contract should stay stable until the entry strategy changes everywhere together.
- If a public runtime name changes, update `index.html`, tests, and docs in the same change.

### 4. Single-Writer State Ownership

- `app-engine` is the only owner of top-level phase changes.
- `run-factory` is the only owner of persistent in-run progression mutation.
- `combat-engine` is the only owner of encounter-local mutation.
- Render code reads state and dispatches actions. It does not own progression logic.

### 5. Registry Versus Instance Separation

- Content definitions are immutable registries.
- `RunState` and `CombatState` are mutable instances built from those registries.
- Systems should pass IDs and snapshots across boundaries instead of sharing mutable references to registries.

### 6. Data-Driven Content Composition

- Author static combat content in `src/content/game-content.ts`.
- Keep D2 reference data in `data/seeds/d2/*.json`.
- Generate act, zone, and encounter variants in registry/factory code, not in UI render functions.

### 7. Deterministic Combat Boundary

- Combat must stay deterministic for a given `randomFn`.
- Keep the combat API centered on `createCombatState`, `playCard`, `endTurn`, and `usePotion`.
- Run progression, rewards, and map routing happen outside combat.

### 8. Reward Seam Pattern

- Encounter completion does not directly mutate long-lived progression.
- Combat reports outcome and post-fight values.
- Reward application is the seam where gold, XP, zone clears, act clears, future item grants, and future deck changes enter `RunState`.

### 9. Domain-First Extraction

- Grow the game by adding or splitting domains under `src/`.
- Do not solve every new need by expanding `src/app/main.ts`.
- Prefer small extractions such as `src/ui/*`, `src/rewards/*`, `src/state/*`, and `src/economy/*`.

### 10. Explicit Phase Machine

- Use top-level app phases for major screens only.
- Keep subviews like vendor panels, reward choices, and safe-zone services inside phase-local UI state.
- Do not create top-level phases for tooltips, confirms, or one-off overlays.

### 11. ID-Based Contracts

- Cross-domain handoffs should use IDs, snapshots, and explicit result objects.
- Avoid hidden coupling through DOM state or mutable global references.
- A zone points at encounter IDs; encounters point at enemy template IDs; runtime systems resolve through registries.

### 12. Verification At The Public Boundary

- Lint is strict and warning-free.
- Compile before serving or testing.
- Tests should continue to validate the emitted browser contract, not a separate Node-only path.

## Safe Change Pattern

When adding a feature:

1. put content and reference data in `src/content/*` or `data/seeds/d2/*.json`
2. put encounter-only logic in `src/combat/*`
3. put persistent run mutation in `src/run/*`
4. route top-level transitions through `src/app/app-engine.ts`
5. keep DOM work in `src/app/main.ts` or future `src/ui/*`
6. preserve the `window.ROUGE_*` public contract unless the whole entry strategy changes together

## Verification Surface

Use these commands when touching live runtime behavior:

```bash
npm run lint
npm test
npm run build
npm run check
```
