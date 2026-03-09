# Agent 1

## Role

Own the player-facing shell for Rouge.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not treat this file as a second spec.

## Own

- `src/ui/*`
- `src/app/main.ts`
- shell-facing wiring in `src/app/app-engine.ts`
- `index.html`
- `styles.css`
- shell-facing test coverage in `tests/app-engine*.test.ts`

## Do Not Own

- progression formulas
- reward formulas
- item, rune, and runeword rules
- persistence ownership
- world-node rules
- combat rules

## Active Tickets

- previous completed epic: `ROUGE-21` Account Meta Continuity
- active epic: `ROUGE-52` Expedition Launch And Town Prep Clarity
- `ROUGE-53`
- `ROUGE-54`
- `ROUGE-55`

Work these in the order set in Tira and by the project manager.

## Current Focus

- `ROUGE-21` is landed on `master`: the shared account-meta continuity board, charter or convergence drilldowns, and their compiled-browser coverage are now live.
- Start with `ROUGE-53`: make the hall-to-character-select-to-safe-zone path read like one expedition launch flow.
- Then land `ROUGE-54`: before-or-after comparison treatment for the most important town-prep actions.
- Finish with `ROUGE-55`: compiled-browser regression coverage for launch and town-prep continuity.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
2. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
3. Add or update automated tests for every shell behavior you change.
4. Run `npm run check` before you consider the ticket ready.
5. Sync docs if shell contracts, ownership, or user-facing flow changed materially.
6. Commit coherent changes directly onto `master`. Do not stop at a local green run.
7. Before any push, verify the active GitHub account and only push while authenticated as `andrewpopov`.
8. Before finishing, update the ticket in Tira with a comment describing what landed.
9. Move the ticket to `DONE` only after the relevant commit is on `master`.
10. If only part of the scope landed, leave the ticket open and say what remains.

## Stop Condition

You are not done when the code works locally. You are done only when:

- the ticket work is committed on `master`
- the required tests passed
- Tira is updated
- the ticket status matches reality

## Coordination

- Coordinate with Agent 2 for new account-summary or progression read-model needs.
- Coordinate with Agent 3 for new node-family or encounter metadata that needs shell treatment.
- Coordinate with Agent 4 before changing shared shell test harness pieces.
- Coordinate with Agent 5 when shell changes need broader regression or e2e follow-through.
