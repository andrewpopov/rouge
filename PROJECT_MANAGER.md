# Project Manager

## Role

This file defines the project-manager role for Rouge.

The project manager owns orchestration, prioritization, landing sequencing, progress tracking, blocker resolution, and documentation freshness across the agent workstreams.

## Shared Worktree Rule

The repo root checkout is the integration worktree only.

- Agents must not do feature work in the shared root checkout.
- Every ticket starts from a dedicated worktree created with `./scripts/create-agent-worktree.sh <agent> <ROUGE-ticket>`.
- Every landing is prepared from that isolated worktree with `./scripts/land-agent-worktree.sh <worktree-path>`.
- Agents still land onto `master`, but they do the work from isolated `codex/*` branches so they stop stepping on each other.

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
- `AGENT_5.md`

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
5. Agent 5: release confidence and automated verification

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
- `src/quests/world-node-catalog-opportunities.ts`
- `src/quests/world-node-catalog.ts`
- `package.json`
- `tests/e2e/*`
- `index.html`
- `tests/app-engine*.test.ts`

If two agents need the same hotspot:

1. approve the contract change explicitly
2. define which workstream lands on `master` first
3. require the second workstream to rebase or replay its isolated worktree branch on top of the latest `origin/master` before landing

### 5. Gate Landings

No workstream is considered ready to land on `master` until:

- scope matches the assigned agent doc
- docs are updated if the live runtime changed
- automated tests were added or updated for the behavior that changed
- `npm run check` passes
- the work happened in an isolated agent worktree instead of the shared root checkout
- any shared-type changes are clearly called out
- the corresponding Tira ticket was moved to `IN_PROGRESS` before the first code edit, first new test file, or first tooling change for that ticket
- the final state is recorded in coherent commit(s) and pushed onto `master`

Agents are not done when code exists locally or when tests are green. They are done only when the assigned batch is actually landed on `master`.

No agent doc is considered current if it mainly describes work already implemented in the repo.

## Landing Order Guidance

Default order when workstreams overlap:

1. shared contracts and type changes
2. Agent 4 behavior-preserving extraction or test-surface cleanup that reduces hotspot pressure without redefining product behavior
3. Agent 5 quality-gate, coverage, and e2e work that builds on Agent 4's stable browser seam
4. Agent 2 backbone changes
5. Agent 3 world-content and combat-depth changes
6. Agent 1 shell-only changes that consume already-stable APIs
7. Agent 4 follow-on hotspot extraction after the feature landings settle
8. Agent 5 follow-on missing-test backfill after new feature landings expand the surface
9. Agent 1 follow-on shell integration for any new APIs or content surfaces

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
6. `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`, `AGENT_5.md`
7. product-direction planning docs

## Immediate Operating Rule

The project manager should keep agent tasks meaty, stable, and vertically coherent. Do not assign one-off microtasks when a larger subsystem slice can be owned end-to-end.

Current expectation:

- Agent 1 should own the shell layer and keep its biggest shell-owned files small enough that product work does not keep colliding in the same checkout
- Agent 2 should ship the progression and account systems that the rest of the game builds on
- Agent 3 should ship the world-content and combat-depth that makes the acts feel materially different
- Agent 4 should keep the codebase extensible by running a repeating loop: establish one stable seam, move code behind it, pay off the local lint or test debt, document the rule, then repeat without changing product direction
- Agent 5 should keep release confidence real by owning lint or build or compiled-browser or e2e or coverage gates and by turning missing-test gaps into landed tests

Current Agent 1 priority order:

1. `ROUGE-69`: split `src/ui/front-door-view.ts` and `src/ui/ui-common.ts`, now the biggest shell-owned runtime hotspots at roughly `1.4k` and `1.0k` lines
2. `ROUGE-70`: split `tests/app-engine-shell.test.ts`, now the biggest shell-owned suite at roughly `1.6k` lines
3. `ROUGE-71`: keep shell regression coverage whole after the shell decomposition
4. return to the parked `ROUGE-60` resume-and-recovery feature pass only after the shell surfaces are smaller

Current Agent 4 priority order:

1. `ROUGE-51`: continue the quest-domain large-file strike from `src/quests/world-node-catalog-opportunities.ts`, now the current largest quest hotspot at roughly `6.6k` lines with `src/quests/world-node-catalog.ts` reduced to roughly `3.0k`, while keeping `src/quests/world-node-engine.ts` thin
2. `ROUGE-43`: extract authored-content seams out of `src/content/game-content.ts` and progression-tree definitions out of `src/state/persistence.ts`
3. `ROUGE-42`: extract the next combat helper seams out of `src/combat/combat-engine.ts`
4. `ROUGE-47`: centralize module-registration ownership after the large-file passes settle
5. `ROUGE-49`: keep shrinking oversized tests where the new seams make a split materially clearer

Current sequencing guidance:

1. let Agent 4 go first on the large-file tech-debt strike so the next feature work lands on smaller seams
2. let Agent 1 run the shell-specific large-file strike in parallel with Agent 4 where the files do not overlap
3. let Agent 2 land the next shared progression, account, reward, and economy contracts on top of the live planning-charter and convergence layer
4. let Agent 3 land the next route and combat content expansion on those stable contracts, building on the live covenant-plus-detour-plus-escalation fabric instead of re-establishing it
5. let Agent 5 keep the quality gate green and use the live artifact history plus the five-test built smoke baseline to identify the next release-confidence gap only after new feature landings expand the surface
6. let Agent 1 return to the parked resume-and-recovery feature pass only after the shell decomposition settles
