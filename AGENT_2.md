# Agent 2

## Role

Own Rouge's progression, economy, and account backbone.

Tira is the source of truth for scope, acceptance criteria, and required tests. Do not duplicate ticket detail here.

Worktree rule:
- Start each ticket in an isolated worktree created with `./scripts/create-agent-worktree.sh 2 <ROUGE-ticket>`.
- Do not develop in the shared repo root checkout. That checkout is for integration and project-management review only.

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

## Current Baseline

- the account backbone now includes archive, economy, and mastery trees through the live third wave: `imperial_annals`, `trade_hegemony`, and `mythic_doctrine`
- the live convergence layer now extends through `imperial_exchange`, `immortal_annals`, and `mythic_exchange`
- the next Agent 2 implementation lane is no longer "add another tree layer"; it is stronger account review data and longer-horizon economy pressure beyond the current third-wave market and mastery pass

## Execution Rules

1. Before your first code edit, first new test, or first tooling change for a ticket, create a dedicated worktree with `./scripts/create-agent-worktree.sh 2 <ROUGE-ticket>`.
2. Before your first code edit, first new test, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira.
3. Implement the ticket exactly as written in Tira. Acceptance criteria live there.
4. Add or update automated tests for every progression, economy, persistence, or profile behavior you change.
5. Run `npm run check` before you consider the ticket ready.
6. Sync docs if progression ownership, account contracts, or persistence shape changed materially.
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

- Coordinate with Agent 1 on read models needed by the shell.
- Coordinate with Agent 3 when route outcomes need new progression or economy effects.
- Coordinate with Agent 4 before restructuring shared architecture seams.
- Coordinate with Agent 5 when new economy or persistence behavior needs broader regression coverage.
