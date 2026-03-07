# Team Workstreams

Last updated: March 7, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read `IMPLEMENTATION_PROGRESS.md` first for the live baseline.
- Use this document to split implementation across multiple contributors without breaking the live architecture.
- Use `AGENT_1.md`, `AGENT_2.md`, and `AGENT_3.md` as the actual assignment sheets.
- Use `PROJECT_MANAGER.md` for orchestration rules.
- Use `CODEBASE_RULES.md` for ownership rules and `APPLICATION_ARCHITECTURE.md` for the longer target-state plan.

## Purpose

This document answers three questions:

- what contracts must stay stable while multiple people work in parallel
- which subsystem slices are active right now
- which assignment sheet each teammate should pick up next

## Assignment Files

- [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md)
- [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md)
- [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md)
- [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md)

## Review Snapshot

The live runtime is already past the earlier scaffold phase.

Already landed in the live runtime:

- extracted phase-owned UI modules under `src/ui/*`
- front-door saved-run review plus continue or abandon flow
- active-run autosave and restore with save migrations
- profile-backed stash, settings, preferred class, and run-history persistence
- `skills.json` progression catalog wiring plus manual class and attribute spending
- vendor refresh or buy or sell flows plus carried inventory and profile stash transfer
- sockets, rune insertion, and expanded runeword activation
- seed, runtime, world-node, and elite-affix validation
- quest, shrine, event, and opportunity nodes routed through the reward flow
- act-specific encounter pools, elite-affix behavior, and boss scripting

The active team split is now three larger product slices:

1. Agent 1: full player-facing shell
2. Agent 2: progression, economy, and account backbone
3. Agent 3: world-content and combat-depth expansion

## Freeze These Contracts First

These are the shared contracts that should not be casually changed during parallel work:

- top-level phases stay:
  - `boot`
  - `front_door`
  - `character_select`
  - `safe_zone`
  - `world_map`
  - `encounter`
  - `reward`
  - `act_transition`
  - `run_complete`
  - `run_failed`
- public browser exports stay under `window.ROUGE_*`
- `src/` TypeScript is the only editable runtime source of truth
- `generated/` and `dist/` remain output only
- `combat-engine` owns encounter-local mutation only
- `run-factory` owns persistent run mutation only
- `app-engine` owns top-level phase transitions only

## Hotspots And Team Rules

These files are conflict hotspots:

- `src/types/game.d.ts`
- `src/app/app-engine.ts`
- `src/app/main.ts`
- `src/town/service-registry.ts`
- `src/state/*.ts`
- `index.html`
- `tests/app-engine.test.ts`

Parallel-work rules:

- assign one integrator to merge shared type changes in `src/types/game.d.ts`
- avoid direct edits to `src/app/main.ts` unless the task is explicitly UI-focused
- prefer additive domain modules under `src/*` over expanding `main.ts`
- keep new runtime surfaces behind existing domain APIs and `window.ROUGE_*`
- rewrite agent docs when a review shows that an assignment has already been completed in code
- every workstream must end with `npm run check`

## Active Assignment Shape

All three agents should own large, vertically coherent build slices.

General expectation for all three:

- ship a subsystem that materially advances the whole game
- avoid microtasks, one-off cleanup passes, and partial refactors with no product outcome
- preserve the current phase machine and browser contract
- document shared-contract changes before merge
- sync docs for the owned subsystem

Use the standalone assignment sheets as the source of truth for the detailed task list:

1. [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md)
2. [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md)
3. [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md)

The current chunking is:

1. Agent 1 owns the full player-facing shell:
   - account hall
   - onboarding
   - town hub
   - map, node, reward, and run-end presentation
2. Agent 2 owns the progression and account backbone:
   - class progression
   - item or rune or runeword economy
   - reward integration
   - profile persistence
   - unlock and tutorial-state ownership seams
3. Agent 3 owns world-content and combat depth:
   - route-side node catalogs
   - quest and event chains
   - encounter packs
   - elite and boss depth
   - mercenary breadth
   - content validation

Current sequencing guidance:

1. land shared type, profile, and progression contract changes first
2. land Agent 2's backbone work before wide shell or content dependencies build on it
3. land Agent 3's wider content pass on the stable progression and reward contracts
4. land Agent 1's shell expansion against the now-stable domain and account APIs

## Integration Checklist

Before merging any agent branch:

1. the branch scope still matches the current agent assignment file
2. shared-type or shared-contract changes are called out explicitly
3. `npm run check` passes
4. top-level phases did not drift
5. generated output was rebuilt if needed
6. docs were updated if the live runtime changed
