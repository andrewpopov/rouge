# Agent 4

## Role

Own Rouge's architecture-quality and technical-debt lane.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

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
- `ROUGE-5`
- `ROUGE-17`
- `ROUGE-6`
- `ROUGE-7`

Work these in the order set in Tira and by the project manager.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
2. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
3. Add or update automated tests for every extracted seam, harness change, or structural cleanup that affects behavior.
4. Run `npm run check` before you consider the ticket ready.
5. Sync architecture docs whenever module ownership, boot order, or extraction seams changed materially.
6. Commit coherent changes directly onto `master`. Do not stop at a local green run.
7. Before finishing, update the ticket in Tira with a comment describing what landed.
8. Move the ticket to `DONE` only after the relevant commit is on `master`.
9. If only part of the scope landed, leave the ticket open and say what remains.

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
