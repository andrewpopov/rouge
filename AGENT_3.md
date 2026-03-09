# Agent 3

## Role

Own Rouge's world-content and combat-depth expansion.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

Worktree rule:
- Start each ticket in an isolated worktree created with `./scripts/create-agent-worktree.sh 3 <ROUGE-ticket>`.
- Do not develop in the shared repo root checkout. That checkout is for integration and project-management review only.

## Own

- `src/content/*`
- `src/quests/*`
- `src/combat/*`
- content-facing wiring in `src/app/app-engine.ts`
- content-facing shared types in `src/types/game.d.ts`
- `tests/combat-engine.test.ts`
- content-facing app-engine coverage in `tests/app-engine*.test.ts`

## Do Not Own

- shell presentation
- profile ownership
- economy ownership
- class progression formulas

## Active Tickets

- epic: `ROUGE-3` Late-Route Consequence Depth
- `ROUGE-11`
- `ROUGE-12`
- `ROUGE-13`
- `ROUGE-19`

Work these in the order set in Tira and by the project manager.

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, create a dedicated worktree with `./scripts/create-agent-worktree.sh 3 <ROUGE-ticket>`.
2. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
3. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
4. Add or update automated tests for every node, encounter, boss, modifier, mercenary, or validation behavior you change.
5. Run `npm run check` before you consider the ticket ready.
6. Sync docs if route taxonomy, content seams, or combat-content ownership changed materially.
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

- Coordinate with Agent 1 when new node families or act signals need shell treatment.
- Coordinate with Agent 2 when route outcomes need progression or economy consequences.
- Coordinate with Agent 4 before extracting or reshaping shared content architecture seams.
- Coordinate with Agent 5 when new content surfaces need broader regression or e2e follow-through.
