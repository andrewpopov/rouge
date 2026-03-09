# Agent 4

## Role

Own Rouge's architecture-quality and technical-debt lane.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

Worktree rule:
- Start each ticket in an isolated worktree created with `./scripts/create-agent-worktree.sh 4 <ROUGE-ticket>`.
- Do not develop in the shared repo root checkout. That checkout is for integration and project-management review only.

## Own

- `docs/CODEBASE_RULES.md`
- `docs/APPLICATION_ARCHITECTURE.md`
- architecture-facing parts of `PROJECT_MANAGER.md`
- behavior-preserving extractions in `src/**`
- behavior-preserving suite cleanup in `tests/*.test.ts`
- `eslint.config.js`
- `tsconfig*.json`
- `tests/helpers/browser-harness.ts`

## Do Not Own

- new gameplay mechanics
- shell design
- progression design
- world-content feature design

## Active Tickets

- epic: `ROUGE-1` Architecture Stabilization
- current large-file strike: `ROUGE-51`, `ROUGE-43`, `ROUGE-42`
- follow-on architecture cleanup: `ROUGE-47`, `ROUGE-49`
- older architecture backlog still open: `ROUGE-5`, `ROUGE-17`, `ROUGE-6`, `ROUGE-7`

Work these in the order set in Tira and by the project manager.

## Current Focus

- `ROUGE-51` is still in progress on `master`: `src/quests/world-node-engine.ts` is now down to roughly `0.6k` lines behind the new `src/quests/world-node-catalog.ts`, but the quest-domain authored catalog is still the largest file in the repo at roughly `9.6k` lines and remains the highest-value tech-debt target.
- Continue `ROUGE-51` from `src/quests/world-node-catalog.ts`, `src/quests/world-node-zones.ts`, and `src/quests/world-node-variants.ts` instead of re-expanding `src/quests/world-node-engine.ts`.
- Then land `ROUGE-43`: split authored content out of `src/content/game-content.ts` and progression-tree definitions out of `src/state/persistence.ts`.
- Then land `ROUGE-42`: extract the next combat helper seams so `src/combat/combat-engine.ts` does not become the next monolith.
- Only after those large-file passes settle should Agent 4 move to `ROUGE-47` module-registration centralization and `ROUGE-49` further oversized test splitting.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, create a dedicated worktree with `./scripts/create-agent-worktree.sh 4 <ROUGE-ticket>`.
2. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
3. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
4. Add or update automated tests for every extracted seam, harness change, or structural cleanup that affects behavior.
5. Run `npm run check` before you consider the ticket ready.
6. Sync architecture docs whenever module ownership, boot order, or extraction seams changed materially.
7. Commit coherent changes in the isolated worktree, then prepare the landing with `./scripts/land-agent-worktree.sh <worktree-path>`.
8. Before any push, verify the active GitHub account and only push while authenticated as `andrewpopov`.
9. Push from the isolated worktree onto `master`. Do not stop at a local green run.
10. Before finishing, update the ticket in Tira with a comment describing what landed.
11. Move the ticket to `DONE` only after the relevant commit is on `master`.
12. If only part of the scope landed, leave the ticket open and say what remains.

## Stop Condition

You are not done when the code works locally. You are done only when:

- the ticket work is committed on `master`
- the required tests passed
- Tira is updated
- the ticket status matches reality

## Coordination

- Coordinate with Agent 1 before changing shared shell test seams.
- Coordinate with Agent 2 before restructuring shared run, reward, item, or state seams.
- Coordinate with Agent 3 before extracting content or world-node seams they actively own.
- Coordinate with Agent 5 before changing browser-harness or quality-gate ownership.
