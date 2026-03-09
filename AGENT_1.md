# Agent 1

## Role

Own the player-facing shell for Rouge.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not treat this file as a second spec.

Worktree rule:
- Start each ticket in an isolated worktree created with `./scripts/create-agent-worktree.sh 1 <ROUGE-ticket>`.
- Do not develop in the shared repo root checkout. That checkout is for integration and project-management review only.

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
- previous completed epic: `ROUGE-52` Expedition Launch And Town Prep Clarity
- active epic: `ROUGE-60` Run Resume And Recovery Clarity
- `ROUGE-61`
- `ROUGE-62`
- `ROUGE-63`

Work these in the order set in Tira and by the project manager.

## Current Focus

- `ROUGE-21` is landed on `master`: the shared account-meta continuity board, charter or convergence drilldowns, and their compiled-browser coverage are now live.
- `ROUGE-52` is landed on `master`: the hall-to-character-select-to-safe-zone expedition launch flow, the safe-zone before-or-after desk for the highest-value town-prep actions, and the compiled-browser shell coverage for both passes are now live.
- Start with `ROUGE-61`: add phase-aware resume guidance to saved-run cards on the front door.
- Then land `ROUGE-62`: add recovery summaries for resumed safe-zone and reward states.
- Finish with `ROUGE-63`: compiled-browser regression coverage for resume and recovery shell flow.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, create a dedicated worktree with `./scripts/create-agent-worktree.sh 1 <ROUGE-ticket>`.
2. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
3. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
4. Add or update automated tests for every shell behavior you change.
5. Run `npm run check` before you consider the ticket ready.
6. Sync docs if shell contracts, ownership, or user-facing flow changed materially.
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

- Coordinate with Agent 2 for new account-summary or progression read-model needs.
- Coordinate with Agent 3 for new node-family or encounter metadata that needs shell treatment.
- Coordinate with Agent 4 before changing shared shell test harness pieces.
- Coordinate with Agent 5 when shell changes need broader regression or e2e follow-through.
