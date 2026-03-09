# Agent 5

## Role

Own Rouge's release-confidence and automated-verification lane.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

Worktree rule:
- Start each ticket in an isolated worktree created with `./scripts/create-agent-worktree.sh 5 <ROUGE-ticket>`.
- Do not develop in the shared repo root checkout. That checkout is for integration and project-management review only.

## Own

- `package.json` quality scripts
- `tests/e2e/*`
- quality-facing helpers in `tests/helpers/*` with Agent 4 coordination
- cross-cutting regression additions in `tests/*.test.ts`
- quality-facing helper scripts in `scripts/*`

## Do Not Own

- gameplay mechanics
- shell design
- progression design
- content design
- behavior-changing architecture refactors

## Active Tickets

- completed epics: `ROUGE-25`, `ROUGE-29`, and `ROUGE-56`
- active epic: `ROUGE-64` Flake Stabilization And Browser Fault Injection
- `ROUGE-65`
- `ROUGE-66`
- `ROUGE-67`

Work these in the order set in Tira and by the project manager.

## Current Focus

- `ROUGE-56` is now landed on `master`: `artifacts/quality/latest.md` surfaces clear quality or coverage deltas plus coverage headroom, built-bundle smoke adds a safe-zone restore permutation, and restore-path backfill now covers safe-zone and reward resume paths in the compiled-browser shell suite.
- Treat the current four-test built smoke lane as the new baseline instead of future work.
- Start with `ROUGE-65`: investigate and stabilize the transient route-payoff failure seen on the first full `npm run check` attempt in this review.
- Then land `ROUGE-66`: add the next browser-only fault-injection smoke path beyond the current bad-seed coverage.
- Finish with `ROUGE-67`: use the current artifact deltas to choose and land one more high-value regression backfill.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, create a dedicated worktree with `./scripts/create-agent-worktree.sh 5 <ROUGE-ticket>`.
2. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
3. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
4. Add or update automated tests for every quality seam you change.
5. Run `npm run quality` and `npm run test:coverage` before you consider the ticket ready.
6. Sync docs if quality gates, coverage expectations, or release-confidence ownership changed materially.
7. Commit coherent changes in the isolated worktree, then prepare the landing with `./scripts/land-agent-worktree.sh <worktree-path>`.
8. Before any push, verify the active GitHub account and only push while authenticated as `andrewpopov`.
9. Push from the isolated worktree onto `master`. Do not stop at a local green run.
10. Before finishing, update the ticket in Tira with a comment describing what landed.
11. Move the ticket to `DONE` only after the relevant commit is on `master`.
12. If only part of the scope landed, leave the ticket open and say what remains.

## Stop Condition

You are not done when the code works locally. You are done only when:

- the ticket work is committed on `master`
- the required gates passed
- Tira is updated
- the ticket status matches reality

## Coordination

- Coordinate with Agent 1 when e2e or regression work depends on shell flow changes.
- Coordinate with Agent 2 when coverage gaps point at progression, economy, persistence, or restore paths.
- Coordinate with Agent 3 when coverage gaps point at route, validation, or combat-content risk.
- Coordinate with Agent 4 before changing harness ownership, bundle boot order, or shared test helpers.
