# Project Manager

## Role

This file defines the project-manager role for Rouge.

The project manager owns orchestration, prioritization, landing sequencing, progress tracking, blocker resolution, and documentation freshness across the agent workstreams.

## Core Responsibilities

### 1. Own Shared Contracts

Protect these shared contracts:

- top-level app phases
- `window.ROUGE_*` browser exports
- ownership split between:
  - `app-engine`
  - `run-factory`
  - `combat-engine`
- `src/**/*.ts` as source of truth

### 2. Maintain The Project Tracking Docs

Keep these current:

- `docs/IMPLEMENTATION_PROGRESS.md`
- `docs/PROJECT_MASTER.md`
- `docs/TEAM_WORKSTREAMS.md`
- `AGENT_1.md`
- `AGENT_2.md`
- `AGENT_3.md`
- `AGENT_4.md`

After every meaningful review:

1. compare `src/**/*.ts` and `tests/*.test.ts` against the current agent briefs
2. rewrite any agent brief that is asking for work already landed in code
3. keep the active assignment docs focused on the next meaty subsystem slices
4. sync `docs/TEAM_WORKSTREAMS.md` if the active split changed
5. remove fake dependencies when the runtime already exposes the needed API seam

### 3. Assign And Sequence Work

Default parallel lanes:

1. Agent 1: full player-facing shell
2. Agent 2: progression, economy, and account backbone
3. Agent 3: world-content and combat-depth expansion
4. Agent 4: architecture and code-quality hardening

### 4. Manage Hotspots

Watch these files closely:

- `src/types/game.d.ts`
- `src/app/app-engine.ts`
- `src/app/main.ts`
- `src/town/service-registry.ts`
- `src/state/*.ts`
- `src/run/run-factory.ts`
- `src/items/*.ts`
- `src/content/content-validator.ts`
- `src/content/encounter-registry.ts`
- `src/quests/world-node-engine.ts`
- `index.html`
- `tests/app-engine*.test.ts`

If two agents need the same hotspot:

1. approve the contract change explicitly
2. define which workstream lands on `master` first
3. require the second workstream to rebase or replay on top of the latest `master` before landing

### 5. Gate Landings

No workstream is considered ready to land on `master` until:

- scope matches the assigned agent doc
- docs are updated if the live runtime changed
- automated tests were added or updated for the behavior that changed
- `npm run check` passes
- any shared-type changes are clearly called out
- the final state is recorded in coherent commit(s) on `master`

Agents are not done when code exists locally or when tests are green. They are done only when the assigned batch is actually landed on `master`.

No agent doc is considered current if it mainly describes work already implemented in the repo.

## Landing Order Guidance

Default order when workstreams overlap:

1. shared contracts and type changes
2. Agent 4 behavior-preserving extraction or test-surface cleanup that reduces hotspot pressure without redefining product behavior
3. Agent 2 backbone changes
4. Agent 3 world-content and combat-depth changes
5. Agent 1 shell-only changes that consume already-stable APIs
6. Agent 4 follow-on hotspot extraction after the feature landings settle
7. Agent 1 follow-on shell integration for any new APIs or content surfaces

If a batch is mostly presentation-only, it can land earlier as long as it does not redefine contracts.

## Blocker Policy

If an agent is blocked by another slice:

1. record the blocker in `docs/IMPLEMENTATION_PROGRESS.md` or the current planning thread
2. narrow the missing contract or dependency to one explicit question
3. either:
   - resolve it centrally as project manager, or
   - re-scope the blocked agent onto the next internal subtask

Do not let agents stall on vague “waiting for X” blockers.

## Review Cadence

For every meaningful implementation drop, the project manager should verify:

1. what changed in the live runtime
2. what milestone status changed
3. whether any agent docs need to be rewritten
4. whether the next task lists should be re-split

The project manager should treat stale agent briefs as a process bug and fix them immediately.

The project manager should also fix stale landing instructions immediately when the delivery process changes. The current project rule is direct commits onto `master`; do not leave PR-only language in active assignment docs unless the team explicitly switches back.

The project manager should not leave already-landed runtime seams assigned as future backend work. If APIs like profile-setting mutation, tutorial mutation, encounter modifiers, or mercenary route perks are already live, rewrite the briefs so agents build on them instead of waiting for them.

## Source Of Truth Order

When tracking or making decisions:

1. `src/**/*.ts`
2. `tests/*.test.ts`
3. `docs/IMPLEMENTATION_PROGRESS.md`
4. `docs/PROJECT_MASTER.md`
5. `docs/TEAM_WORKSTREAMS.md`
6. `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`
7. product-direction planning docs

## Immediate Operating Rule

The project manager should keep agent tasks meaty, stable, and vertically coherent. Do not assign one-off microtasks when a larger subsystem slice can be owned end-to-end.

Current expectation:

- Agent 1 should ship a shell layer that can carry the whole product
- Agent 2 should ship the progression and account systems that the rest of the game builds on
- Agent 3 should ship the world-content and combat-depth that makes the acts feel materially different
- Agent 4 should keep the codebase extensible by running a repeating loop: establish one stable seam, move code behind it, pay off the local lint or test debt, document the rule, then repeat without changing product direction

Current Agent 4 priority order:

1. keep the centralized manifests in `tests/helpers/browser-harness.ts` as the single compiled-browser boot-order source of truth and keep `tests/app-engine*.test.ts` aligned whenever browser script order or boot seams change
2. keep late-route validation behind `src/content/content-validator-world-opportunities.ts` and only shrink the remaining early world-node checks out of `src/content/content-validator.ts` when a follow-on pass is warranted
3. keep `src/content/encounter-registry.ts` thin by preventing logic drift back out of `src/content/encounter-registry-builders.ts` or `src/content/encounter-registry-enemy-builders.ts`
4. keep the run helpers small by avoiding new logic drift back into `src/run/run-factory.ts` or `src/run/run-reward-flow.ts`
5. then coordinate the first safe extractions out of `src/quests/world-node-engine.ts` with Agent 3

Current sequencing guidance:

1. let Agent 4 keep the compiled-browser harness aligned, continue the remaining app-engine suite cleanup, and only do validator or `world-node-engine` follow-on work from the existing helper chain and coordinated extraction seam
2. let Agent 2 land the next shared progression, account, reward, and economy contracts on top of the live planning-charter and convergence layer
3. let Agent 3 land the next route and combat content expansion on those stable contracts, building on the live covenant-plus-detour-plus-escalation fabric instead of re-establishing it
4. let Agent 1 land the next shell pass on top of the latest profile, archive, route, reward, and node surfaces, starting with account-hall decision support and safe-zone comparison surfaces
5. let Agent 4 only expand `src/quests/world-node-engine.ts` extraction further after the first helper pass and the next suite split settle cleanly
