# Team Workstreams

Last updated: March 9, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read `IMPLEMENTATION_PROGRESS.md` first for the live baseline.
- Use this document to split implementation across multiple contributors without breaking the live architecture.
- Use `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`, and `AGENT_5.md` as the actual assignment sheets.
- Use `PROJECT_MANAGER.md` for orchestration rules.
- Use `CODEBASE_RULES.md` for ownership rules and `APPLICATION_ARCHITECTURE.md` for the longer target-state plan.
- Treat tickets referenced in this document and the agent sheets as the active plan. Unreferenced `ROUGE-*` tickets in Tira are backlog parking-lot items until they are promoted here.
- The repo root checkout is the integration worktree only. Agents must start ticket work from dedicated helper-created worktrees under `./scripts/create-agent-worktree.sh`.

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
- quest, shrine, event, and multiple opportunity nodes routed through the reward flow, including shrine-specific, crossroad, reserve-lane, relay-lane, culmination-lane, legacy-lane, reckoning-lane, recovery-lane, accord-lane, covenant-lane, detour-lane, escalation-lane, consequence-gated opportunity variants, five-package branch-battle and branch-miniboss consequence encounter and reward ladders, and a seven-package boss aftermath ladder
- seven mercenary contracts plus twelve-per-contract compound route-linked combat perks, larger act encounter pools with six branch battles and six branch minibosses per act, a twenty-kind encounter-local modifier catalog, four elite-affix families per act, stronger escort, court-reserve, boss-salvo, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence scripting, mobilized and posted aftermath boss courts, and deeper boss escorts

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
- `src/quests/world-node-catalog.ts`
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
- every workstream must happen in its own isolated worktree, not in the shared root checkout
- every workstream must move its active Tira ticket(s) to `IN_PROGRESS` before the first code edit, first new test file, or first tooling change for that ticket
- every completed workstream must land from the isolated worktree onto `master`; do not stop at local edits or a green run
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

1. Agent 1: completed epics `ROUGE-21` and `ROUGE-52`; parked epic `ROUGE-60`; active epic `ROUGE-68`, tickets `ROUGE-69`, `ROUGE-70`, `ROUGE-71`
2. Agent 2: epic `ROUGE-2`, tickets `ROUGE-9`, `ROUGE-10`, `ROUGE-18`
3. Agent 3: epic `ROUGE-3`, tickets `ROUGE-11`, `ROUGE-12`, `ROUGE-13`, `ROUGE-19`
4. Agent 4: epic `ROUGE-1` plus current large-file queue `ROUGE-51`, `ROUGE-43`, `ROUGE-42`, with `ROUGE-47` and `ROUGE-49` as follow-ons and `ROUGE-5`, `ROUGE-17`, `ROUGE-6`, `ROUGE-7` as secondary backlog
5. Agent 5: completed epics `ROUGE-25`, `ROUGE-29`, `ROUGE-56`, and `ROUGE-64`; next quality pickup pending promotion in Tira

The current chunking is:

1. Agent 1 owns the shell-specific large-file strike:
   - split `src/ui/front-door-view.ts`, now roughly `1.4k` lines
   - split `src/ui/ui-common.ts`, now roughly `1.0k` lines
   - split shell-heavy compiled-browser suites, starting with `tests/app-engine-shell.test.ts`, now roughly `1.6k` lines
   - keep shell coverage green so the parked `ROUGE-60` resume-and-recovery follow-on can restart on smaller seams
2. Agent 2 owns the progression and account backbone:
   - broader account growth beyond the current sovereign-annals or merchant-principate or legend-doctrine second wave, current convergences, and live planning-charter layer
   - late-act item or rune or runeword economy depth beyond the current sovereign-market layer
   - archive, stash, and profile read-model depth
   - reward and town integration around one progression model
3. Agent 3 owns world-content and combat depth:
   - boss or escort consequence expression and broader late-route node catalogs on top of the live detour or escalation follow-through
   - deeper quest and event consequence chains that feed later encounters and rewards across the live covenant-plus-detour-plus-escalation fabric and the current five-package branch-battle or branch-miniboss ladder plus seven-package boss aftermath ladder
   - encounter-pack breadth on top of the live sixteen-modifier baseline
   - elite or boss depth and mercenary payoff growth only where new route fabrics justify it
   - content validation and reachability hardening
4. Agent 4 owns architecture and code quality:
   - break up the biggest runtime hotspots first, continuing from `src/quests/world-node-catalog.ts` while keeping `src/quests/world-node-engine.ts` thin
   - extract authored-content seams out of `src/content/game-content.ts` and `src/state/persistence.ts`
   - keep `src/combat/combat-engine.ts` from becoming the next giant file
   - centralize module-registration ownership after the large-file passes settle
   - keep test-surface cleanup and architecture docs aligned with the new seams
5. Agent 5 owns release confidence and automated verification:
   - keep `npm run quality` and `npm run test:coverage` green
   - maintain the local quality-artifact history and current five-test built smoke lane
   - land new browser-only fault injection or regression backfill only when new feature work exposes a concrete gap
   - continued ownership of `npm run quality` and `npm run test:coverage`

Current start order for this round:

1. Agent 4
   - continue the large-file strike with `ROUGE-51` on `src/quests/world-node-catalog.ts` after thinning `src/quests/world-node-engine.ts`
   - then land `ROUGE-43` on `src/content/game-content.ts` and `src/state/persistence.ts`
   - then land `ROUGE-42` on `src/combat/combat-engine.ts`
2. Agent 1
   - start the shell-specific large-file strike with `ROUGE-69` on `src/ui/front-door-view.ts` and `src/ui/ui-common.ts`
   - then land `ROUGE-70` on `tests/app-engine-shell.test.ts` and any clearly shell-owned follow-on suite splits
   - then land `ROUGE-71` so shell coverage stays strong after the decomposition
3. Agent 2
   - build on the live second-wave account growth with richer archive or stash or economy read models
   - then deepen late-act replacement pressure and economy sinks on top of the live planning-charter and sovereign-market layer
4. Agent 3
   - deepen boss or escort consequence expression on top of the live detour and escalation payoff packages
   - then widen mercenary payoff only if that follow-through creates a real new combat seam
5. Agent 5
   - keep the landed release-confidence lane green while the other batches move
   - use the current artifact deltas and five-test built smoke baseline to spot the next real gap
   - pull the next quality batch only after Tira promotes it

Current landing guidance:

1. land shared type, profile, and progression contract changes first
2. let Agent 4 land the quest/content large-file breakup pass first, continuing from `src/quests/world-node-catalog.ts`, then `src/content/game-content.ts` plus `src/state/persistence.ts`, then `src/combat/combat-engine.ts`
3. let Agent 1 land the shell-specific large-file breakup pass in parallel where it stays on `src/ui/*` and shell-owned suites instead of world/content hotspots
4. let Agent 5 broaden the quality lane only after Agent 4's or Agent 1's large-file seams settle where shared harness or bootstrap ownership is involved and a new Tira-promoted release-confidence gap exists
5. let Agent 2 land the next shared type, profile, progression, reward, and economy contract changes before downstream consumers depend on new backend seams
6. let Agent 3 land wider route and combat content on the stable progression, reward, and mercenary contracts, building on the live detour or escalation fabric instead of re-establishing it
7. let Agent 1 return to the parked `ROUGE-60` resume and recovery shell feature pass only after the shell hotspots are smaller
8. let Agent 4 return to secondary architecture backlog like module registration and further test splits after the giant-file strike settles

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
