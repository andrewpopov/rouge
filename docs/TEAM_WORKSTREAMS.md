# Team Workstreams

Last updated: March 8, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read `IMPLEMENTATION_PROGRESS.md` first for the live baseline.
- Use this document to split implementation across multiple contributors without breaking the live architecture.
- Use `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`, and `AGENT_5.md` as the actual assignment sheets.
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
- [AGENT_5.md](/Users/andrew/proj/rouge/AGENT_5.md)
- [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md)

## Review Snapshot

The live runtime is already past the earlier scaffold phase.

Already landed in the live runtime:

- extracted phase-owned UI modules under `src/ui/*`
- front-door saved-run review plus continue or abandon flow
- active-run autosave and restore with save migrations
- profile-backed stash, settings, preferred class, unlock, tutorial, and run-history persistence
- prerequisite-aware account trees, capstones, and cross-tree convergence bundles with shell-facing account summaries
- `skills.json` progression catalog wiring plus manual class and attribute spending
- vendor refresh or buy or sell flows plus carried inventory and profile stash transfer
- sockets, rune insertion, and expanded runeword activation
- split run-domain helpers under `src/run/*` plus split item-domain helpers under `src/items/*`
- seed, runtime, world-node, and elite-affix validation
- quest, shrine, event, and multiple opportunity nodes routed through the reward flow, including shrine-specific, crossroad, reserve-lane, relay-lane, culmination-lane, legacy-lane, reckoning-lane, recovery-lane, accord-lane, covenant-lane, detour-lane, escalation-lane, consequence-gated opportunity variants, and consequence-conditioned branch or miniboss or boss encounter and reward packages
- seven mercenary contracts plus twelve-per-contract compound route-linked combat perks, larger act encounter pools with six branch battles and six branch minibosses per act, a sixteen-kind encounter-local modifier catalog, four elite-affix families per act, stronger escort, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence scripting, and deeper boss escorts

The active team split is now five larger workstreams:

1. Agent 1: full player-facing shell
2. Agent 2: progression, economy, and account backbone
3. Agent 3: world-content and combat-depth expansion
4. Agent 4: architecture and code-quality hardening
5. Agent 5: release confidence and automated verification

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
- every workstream must move its active Tira ticket(s) to `IN_PROGRESS` before the first code edit, first new test file, or first tooling change for that ticket
- every completed workstream must land as one or more coherent commits directly on `master`; do not stop at local edits or a green run
- no PR is required unless a future project-manager update explicitly asks for one

## Active Assignment Shape

All five agents should own large, vertically coherent build slices.

General expectation for all five:

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
5. [AGENT_5.md](/Users/andrew/proj/rouge/AGENT_5.md)

Current Tira mapping:

1. Agent 1: epic `ROUGE-21`, tickets `ROUGE-22`, `ROUGE-23`, `ROUGE-24`
2. Agent 2: epic `ROUGE-2`, tickets `ROUGE-8`, `ROUGE-9`, `ROUGE-10`, `ROUGE-18`
3. Agent 3: epic `ROUGE-3`, tickets `ROUGE-11`, `ROUGE-12`, `ROUGE-13`, `ROUGE-19`
4. Agent 4: epic `ROUGE-1`, tickets `ROUGE-5`, `ROUGE-6`, `ROUGE-7`, `ROUGE-17`
5. Agent 5: epic `ROUGE-25`, tickets `ROUGE-26`, `ROUGE-27`, `ROUGE-28`

The current chunking is:

1. Agent 1 owns the full player-facing shell:
   - account-hall decision support and convergence visibility
   - onboarding and tutorial continuity
   - town-prep comparison and run-management UX
   - route intel, reward, and run-end change summaries on top of the now-live hall decision desk, prep comparison board, and hall handoff
2. Agent 2 owns the progression and account backbone:
   - second-wave account growth beyond the current capstones, convergences, and live planning-charter layer
   - late-act item or rune or runeword economy depth
   - archive, stash, and profile read-model depth
   - reward and town integration around one progression model
3. Agent 3 owns world-content and combat depth:
   - deeper detour or escalation follow-through and broader late-route node catalogs
   - deeper quest and event consequence chains that feed later encounters and rewards across the live covenant-plus-detour-plus-escalation fabric
   - encounter-pack breadth on top of the live sixteen-modifier baseline
   - elite or boss depth and mercenary payoff growth only where new route fabrics justify it
   - content validation and reachability hardening
4. Agent 4 owns architecture and code quality:
   - compiled-browser harness and test-surface cleanup on top of the now-centralized browser manifest seams
   - maintain the `content-validator-world-paths`, `content-validator-world-opportunities`, and `content-validator-runtime-content` seams
   - maintain the new `encounter-registry` helper chain
   - keep `content-validator.ts` thin and keep late-route validation out of the public entry
   - first safe `world-node-engine` helper extraction
   - lint suppression and structural debt reduction
   - architecture rule maintenance
5. Agent 5 owns release confidence and automated verification:
   - lint, build, compiled-browser, and e2e quality-gate ownership
   - coverage reporting and thresholds
   - missing-test backfill across shell, account, route, and harness seams
   - coordination with Agent 4 on shared browser bootstrap and harness ownership

Current start order for this round:

1. Agent 4
   - keep `tests/helpers/browser-harness.ts` as the single boot-order source of truth
   - continue the remaining app-engine suite cleanup, starting with the biggest world-node-heavy suite
   - stage the first safe `world-node-engine` helper extraction with Agent 3 after the harness pass is stable
2. Agent 5
   - establish the release-confidence lane with lint, build, compiled-browser tests, browser e2e smoke, and coverage reporting
   - coordinate with Agent 4 instead of creating a second browser bootstrap path
   - use the new coverage output to drive missing-test backfill
3. Agent 2
   - land second-wave account growth plus richer archive or stash or economy read models
   - then deepen late-act replacement pressure and economy sinks on top of the live planning-charter layer
4. Agent 3
   - deepen the live detour and escalation lanes into broader act-facing payoff and encounter packages
   - then push consequence-linked encounter, boss, and reward payoff deeper across the late-route fabric
5. Agent 1
   - land the next route-intel and reward continuity pass on top of the now-live hall navigator, hall decision desk, prep comparison board, convergence review, and delta-summary shell

Current landing guidance:

1. land shared type, profile, and progression contract changes first
2. let Agent 4 keep the compiled-browser harness aligned, finish the remaining app-engine test-surface cleanup, and only do further validator or `world-node-engine` follow-on work from the new helper chain and coordinated extraction seam
3. let Agent 5 establish the quality gate and coverage seams on top of Agent 4's stable browser bootstrap instead of forking it
4. let Agent 2 land the next shared type, profile, progression, reward, and economy contract changes before downstream consumers depend on new backend seams
5. let Agent 3 land wider route and combat content on the stable progression, reward, and mercenary contracts, building on the live detour or escalation fabric instead of re-establishing it
6. let Agent 1 land the next shell pass on top of the latest profile, route, archive, reward, and node surfaces, using the new hall or town or run-end decision-support model as the baseline
7. let Agent 4 only keep expanding `world-node-engine` extractions after the first coordinated helper pass lands cleanly

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
9. the corresponding Tira ticket is already `IN_PROGRESS` before the first edit and only moves to `DONE` after the landing commit is on `master`
