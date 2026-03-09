# Agent 5

## Role

Own Rouge's release-confidence and automated-verification lane.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

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

- Agent 5's `ROUGE-25` and `ROUGE-29` batches are already landed on `master`.
- The live baseline now includes `npm run quality`, `npm run test:coverage`, built-bundle smoke through encounter or reward or act transition or run summary plus direct bad-seed boot failure, and local quality-artifact history under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots.
- Next pickup stays Tira-owned. Until a new ticket is assigned, treat browser-only fault injection and the next coverage-driven regression backfill as the follow-on seam.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
2. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
3. Add or update automated tests for every quality seam you change.
4. Run `npm run quality` and `npm run test:coverage` before you consider the ticket ready.
5. Sync docs if quality gates, coverage expectations, or release-confidence ownership changed materially.
6. Commit coherent changes directly onto `master`. Do not stop at a local green run.
7. Before finishing, update the ticket in Tira with a comment describing what landed.
8. Move the ticket to `DONE` only after the relevant commit is on `master`.
9. If only part of the scope landed, leave the ticket open and say what remains.

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
