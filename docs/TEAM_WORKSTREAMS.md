# Team Workstreams

Last updated: March 8, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read `IMPLEMENTATION_PROGRESS.md` first for the live baseline.
- Use this document to split implementation across multiple contributors without breaking the live architecture.
- Use `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, and `AGENT_4.md` as the actual assignment sheets.
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
- [AGENT_4.md](/Users/andrew/proj/rouge/AGENT_4.md)
- [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md)

## Review Snapshot

The live runtime is already past the earlier scaffold phase.

Already landed in the live runtime:

- extracted phase-owned UI modules under `src/ui/*`
- front-door saved-run review plus continue or abandon flow
- active-run autosave and restore with save migrations
- profile-backed stash, settings, preferred class, unlock, tutorial, and run-history persistence
- `skills.json` progression catalog wiring plus manual class and attribute spending
- vendor refresh or buy or sell flows plus carried inventory and profile stash transfer
- sockets, rune insertion, and expanded runeword activation
- split run-domain helpers under `src/run/*` plus split item-domain helpers under `src/items/*`
- seed, runtime, world-node, and elite-affix validation
- quest, shrine, event, and multiple opportunity nodes routed through the reward flow, including shrine-specific, crossroad, reserve-lane, relay-lane, culmination-lane, legacy-lane, reckoning-lane, recovery-lane, accord-lane, covenant-lane, consequence-gated opportunity variants, and consequence-conditioned branch encounter packages
- seven mercenary contracts plus twelve-per-contract compound route-linked combat perks, larger act encounter pools, a thirteen-kind encounter-local modifier catalog, four elite-affix families per act, stronger escort, support-screen, sniper-nest, and phalanx-march scripting, and deeper boss escorts

The active team split is now four larger workstreams:

1. Agent 1: full player-facing shell
2. Agent 2: progression, economy, and account backbone
3. Agent 3: world-content and combat-depth expansion
4. Agent 4: architecture and code-quality hardening

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
- the run domain owns persistent run mutation, with `run-factory` as the public orchestration surface
- `app-engine` owns top-level phase transitions only

## Hotspots And Team Rules

These files are conflict hotspots:

- `src/types/game.d.ts`
- `src/app/app-engine.ts`
- `src/app/main.ts`
- `src/town/service-registry.ts`
- `src/state/*.ts`
- `src/quests/world-node-engine.ts`
- `src/items/*.ts`
- `src/content/content-validator.ts`
- `src/content/encounter-registry.ts`
- `index.html`
- `tests/app-engine*.test.ts`

Parallel-work rules:

- assign one integrator to coordinate shared type changes in `src/types/game.d.ts`
- avoid direct edits to `src/app/main.ts` unless the task is explicitly UI-focused
- prefer additive domain modules under `src/*` over expanding `main.ts`
- keep new runtime surfaces behind existing domain APIs and `window.ROUGE_*`
- rewrite agent docs when a review shows that an assignment has already been completed in code
- every workstream must add or update automated tests for the behavior it changes
- every workstream must end with `npm run check`
- every completed workstream must land as one or more coherent commits directly on `master`
- no PR is required unless a future project-manager update explicitly asks for one

## Active Assignment Shape

All four agents should own large, vertically coherent build slices.

General expectation for all four:

- ship a subsystem that materially advances the whole game
- avoid microtasks, one-off cleanup passes, and partial refactors with no product outcome
- preserve the current phase machine and browser contract
- document shared-contract changes before landing on `master`
- sync docs for the owned subsystem

Use the standalone assignment sheets as the source of truth for the detailed task list:

1. [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md)
2. [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md)
3. [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md)
4. [AGENT_4.md](/Users/andrew/proj/rouge/AGENT_4.md)

The current chunking is:

1. Agent 1 owns the full player-facing shell:
   - account hall navigation and drilldowns
   - onboarding and tutorial continuity
   - town-prep and run-management UX
   - route intel, reward, and run-end change summaries
2. Agent 2 owns the progression and account backbone:
   - account-tree capstones and feature gates
   - late-act item or rune or runeword economy depth
   - archive, stash, and profile read-model depth
   - reward and town integration around one progression model
3. Agent 3 owns world-content and combat depth:
   - second alternate route fabrics per act and route-side node catalogs
   - deeper quest and event consequence chains
   - encounter-pack breadth on top of the live thirteen-modifier baseline
   - elite or boss depth and mercenary payoff growth only where new route fabrics justify it
   - content validation and reachability hardening
4. Agent 4 owns architecture and code quality:
   - compiled-browser test-surface cleanup
   - maintain the new `content-validator-world-paths` seam
   - maintain the new `encounter-registry` helper chain
   - `content-validator` follow-on extraction next
   - follow-on hotspot extraction
   - lint suppression and structural debt reduction
   - architecture rule maintenance

Current start order for this round:

1. Agent 4
   - keep `tests/helpers/browser-harness.ts` and `tests/app-engine*.test.ts` aligned
   - resume the next hotspot pass in `src/content/content-validator.ts`
2. Agent 2
   - land account-tree capstones plus richer archive or stash or economy read models
   - then deepen late-act replacement pressure and economy sinks
3. Agent 3
   - deepen consequence-linked encounter or reward payoff beyond the covenant convergence lane
   - then broaden modifier or escort or boss scripting where it improves act identity
4. Agent 1
   - land the next shell structure pass on top of the latest stable profile, route, reward, and archive surfaces

Current landing guidance:

1. land shared type, profile, and progression contract changes first
2. let Agent 4 keep the compiled-browser harness aligned, finish the remaining app-engine test-surface cleanup, and land the next `content-validator` follow-on extraction early, because the encounter-registry helper chain is now in place
3. let Agent 2 land shared type, profile, progression, reward, and economy contract changes before downstream consumers depend on new backend seams
4. let Agent 3 land wider route and combat content on the stable progression, reward, and mercenary contracts
5. let Agent 1 land the next shell pass on top of the latest profile, route, archive, reward, and node surfaces
6. let Agent 4 only stage any coordinated `world-node-engine` work after the next `src/content/content-validator.ts` follow-on pass lands cleanly

## Integration Checklist

Before landing any agent batch on `master`:

1. the batch scope still matches the current agent assignment file
2. shared-type or shared-contract changes are called out explicitly
3. automated tests were added or updated for changed behavior
4. `npm run check` passes
5. top-level phases did not drift
6. generated output was rebuilt if needed
7. docs were updated if the live runtime changed
8. the work lands as coherent commit(s) on `master`
