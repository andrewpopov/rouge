# Project Manager

## Role

This file defines the project-manager role for Rouge.

The project manager owns orchestration, prioritization, merge sequencing, progress tracking, blocker resolution, and documentation freshness across the agent workstreams.

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

After every meaningful review:

1. compare `src/**/*.ts` and `tests/*.test.ts` against the current agent briefs
2. rewrite any agent brief that is asking for work already landed in code
3. keep the active assignment docs focused on the next meaty subsystem slices
4. sync `docs/TEAM_WORKSTREAMS.md` if the active split changed

### 3. Assign And Sequence Work

Default parallel lanes:

1. Agent 1: full player-facing shell
2. Agent 2: progression, economy, and account backbone
3. Agent 3: world-content and combat-depth expansion

### 4. Manage Hotspots

Watch these files closely:

- `src/types/game.d.ts`
- `src/app/app-engine.ts`
- `src/app/main.ts`
- `src/town/service-registry.ts`
- `src/state/*.ts`
- `index.html`
- `tests/app-engine.test.ts`

If two agents need the same hotspot:

1. approve the contract change explicitly
2. define which branch lands first
3. require the second branch to rebase after the first lands

### 5. Gate Merges

No branch is considered complete until:

- scope matches the assigned agent doc
- docs are updated if the live runtime changed
- `npm run check` passes
- any shared-type changes are clearly called out

No agent doc is considered current if it mainly describes work already implemented in the repo.

## Merge Order Guidance

Default order when branches overlap:

1. shared contracts and type changes
2. Agent 2 backbone changes
3. Agent 3 world-content and combat-depth changes
4. Agent 1 shell integration and presentation changes

If a branch is mostly presentation-only, it can land earlier as long as it does not redefine contracts.

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

## Source Of Truth Order

When tracking or making decisions:

1. `src/**/*.ts`
2. `tests/*.test.ts`
3. `docs/IMPLEMENTATION_PROGRESS.md`
4. `docs/PROJECT_MASTER.md`
5. `docs/TEAM_WORKSTREAMS.md`
6. `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`
7. product-direction planning docs

## Immediate Operating Rule

The project manager should keep agent tasks meaty, stable, and vertically coherent. Do not assign one-off microtasks when a larger subsystem slice can be owned end-to-end.

Current expectation:

- Agent 1 should ship a shell layer that can carry the whole product
- Agent 2 should ship the progression and account systems that the rest of the game builds on
- Agent 3 should ship the world-content and combat-depth that makes the acts feel materially different
