# Agent 2

## Role

Own Rouge's progression, economy, and account backbone.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

## Own

- `src/run/*`
- `src/rewards/*`
- `src/items/*`
- `src/state/*`
- `src/character/*`
- progression-facing shared types in `src/types/game.d.ts`
- progression-facing app-engine coverage in `tests/app-engine*.test.ts`

## Do Not Own

- shell presentation
- combat rules
- route-content authoring
- content validation policy outside progression/economy seams

## Active Tickets

- epic: `ROUGE-2` Account And Economy Depth
- `ROUGE-10`
- `ROUGE-9`
- `ROUGE-18`

Work these in the order set in Tira and by the project manager.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
2. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
3. Add or update automated tests for every progression, economy, persistence, or profile behavior you change.
4. Run `npm run check` before you consider the ticket ready.
5. Sync docs if progression ownership, account contracts, or persistence shape changed materially.
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

- Coordinate with Agent 1 on read models needed by the shell.
- Coordinate with Agent 3 when route outcomes need new progression or economy effects.
- Coordinate with Agent 4 before restructuring shared architecture seams.
- Coordinate with Agent 5 when new economy or persistence behavior needs broader regression coverage.
