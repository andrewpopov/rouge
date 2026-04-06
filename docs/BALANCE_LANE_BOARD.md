# Balance Lane Board

_Snapshot: 2026-04-04_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document as the current lane-by-lane read from the latest row-level committed ledger.
- Use `BALANCE_PLAN.md` for broader policy and `BALANCE_EXECUTION_CHECKLIST.md` for the short working queue.
- The ledger already folds newer focused reruns over older broad-matrix rows when they share the same `runKey`.

## Source

This board is based on the merged committed ledger:

- `artifacts/balance/committed-ledger.json`
- `artifacts/balance/committed-ledger.md`
- ledger generator: `scripts/run-balance-ledger.js`

Run shape:

- `7` classes
- `3` committed lanes per class
- `2` policies: `aggressive` and `balanced`
- `10` seeds per lane
- `42` lane summaries
- `420` total runs

## Overall Read

This is now the main operating board. It is built from the newest known row for each `class / policy / lane / seed`, so it is more useful than any single frozen matrix.

Useful aggregate read from the current ledger:

- overall row count: `420`
- overall clears: `420`
- overall clear rate: `1.000`

What is working:

- the row-based rescue wave is complete for the currently tracked `420` rows
- every current `class / policy / lane / seed` row in the merged ledger is now a clear
- route identity and progression shape held while the failing rows were repaired
- the balance loop should now focus on deck-quality cleanup and regression prevention, not broad collapse rescue

What is still important:

- a clean ledger does not mean the work is done; it means the active rescue queue is empty
- payoff monoculture is still the most obvious next quality problem
- recently repaired rows still deserve light boss-answer and deck-shape monitoring
- new content or reward changes should be expected to create new targeted rows over time

Current class or policy totals from the merged ledger:

- all `14` `class / policy` cells are currently `30 / 30`

Current lane totals from the merged ledger:

- all `42` committed lanes are currently `10 / 10`

## Active Queue

There are no active failing rows in the merged ledger right now. The next queue is quality-first:

1. deck-quality cleanup on recently repaired winners that still end in payoff monoculture
2. boss-answer cleanup on lanes that only recently flipped and still rely on narrow Act IV answers
3. targeted reruns for any new regressions introduced by class-card, reward, combat, or item changes
4. periodic recalibration matrices only when the ledger stops giving a coherent broad picture

## Cross-Cutting Patterns

### 1. Rescue work has shifted into polish work

The important question is no longer "which lane still collapses?" It is "which healthy lane is still winning with an ugly or too-centralized package?"

### 2. Payoff monoculture is now the main system-level quality problem

Even with the ledger clean, some lanes still trend too hard into one payoff family:

- Sorceress fire into `Hydra+`
- Sorceress cold into `Frozen Orb+`
- Necromancer summoning into `Revive+`
- Paladin aura into `Conviction+`
- Amazon passive into `Pierce+`
- Assassin shadow into `Shadow Warrior+`

This is the next system-level cleanup target.

### 3. Boss-answer packages still deserve monitoring

The old structural gates still matter:

- `The Cinder Tyrant`
- `Black Gate Patrol`
- `The Briar Matron`

Those fights no longer own active failing rows, but they are still the right places to sanity-check whether repaired lanes are winning with the intended answers.

### 4. The ledger, not any single matrix, is now the live truth

The board should change when row updates change it. Full matrices are still useful, but only as occasional recalibration.

## Working Rule

Treat this board as the current lane-health source of truth until the committed ledger is regenerated with newer row results.
