# Balance Execution Checklist

_Snapshot: 2026-04-05_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `BALANCE_PLAN.md` for the full reasoning and policy.
- Use `BALANCE_LANE_BOARD.md` for the current lane board from the latest row-level ledger.
- Use `BALANCE_MATRIX_SPEC.md` for the design of the periodic complete recalibration matrix.
- Use this document as the short working checklist for the next balance passes.
- Keep this checklist action-oriented. If the strategic direction changes, update `BALANCE_PLAN.md` first.

## Purpose

This is the short version of the balance plan:

- what we should do now
- what we should do next
- what can wait
- what we must check before moving on

## Current Operating Assumption

The active decision surface is the row-level committed ledger:

- [artifacts/balance/committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json)
- [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- [artifacts/balance/committed-history.json](/Users/andrew/proj/rouge/artifacts/balance/committed-history.json)
- [artifacts/balance/committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md)

Treat each `class / policy / lane / seed` run as a row.

- rerun only the rows touched by a fix
- append the new row version into the balance history store
- regenerate the ledger and history views
- let the newest row become the active ledger row for that `runKey`, but keep older row versions available for comparison

Use a full `420`-run committed matrix only when we need a broad recalibration, not as the normal loop.

Current ledger state:

- `420` rows
- `417 / 420` clears
- active rescue queue: empty
- active balance phase: deck-quality cleanup and regression prevention

Training/progression note:

- the live build now has learned skill state and an equipped skill bar that can affect combat flow
- row artifacts now record the requested training loadout and the resulting `skillBar`
- row artifacts now also normalize analysis fields like final checkpoint power, last encounter or boss hero and enemy power, training realization, and final build summary
- the next complete recalibration should be a training-aware committed matrix, not a mixed pre-training comparison
- do not compare pre-training-bar rows against post-training-bar rows as if they were the same runtime contract
- use [docs/CRAFTED_COMBAT_SIM_WORKFLOW.md](/Users/andrew/proj/rouge/docs/CRAFTED_COMBAT_SIM_WORKFLOW.md) when a skill or boss interaction needs a focused duel or boss-check before a full row rerun

## Do Now

### 1. Use the ledger-backed lane board as the active quality map

Primary sources:

- [artifacts/balance/committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json)
- [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- [artifacts/balance/committed-history.json](/Users/andrew/proj/rouge/artifacts/balance/committed-history.json)
- [docs/BALANCE_LANE_BOARD.md](/Users/andrew/proj/rouge/docs/BALANCE_LANE_BOARD.md)

### 2. Work the top polish targets in this order

1. use the ledger to choose the smallest row set that reflects the quality issue we actually touched
2. rerun the touched rows only
3. regenerate the ledger
4. only escalate to a class slice if multiple rows in the same lane or class regress together
5. only escalate to a full committed matrix if the ledger stops giving a coherent broad picture

### 3. Shift the main work from rescue to package quality

Prioritize:

- payoff monoculture cleanup
- clearer in-tree boss-answer packages
- cleaner setup or support or payoff ratios in winning decks
- keeping recently repaired rows stable after local changes

### 4. Keep the current progression rule

When fixing a lane:

- reinforcement first
- lane identity second
- purge only as cleanup

Do not fix weak lanes by over-relying on purge or by letting off-tree damage grow.

## Do Next

### 1. Run focused smokes before touching any larger sample

For each lane fix:

- run `1-3` seed focused smokes
- verify lane formation by Act II
- verify the final deck is moving toward the target shape

Use focused smokes for:

- starter shell changes
- reward-routing changes
- refine/evolve weighting changes
- duplicate-cap changes
- boss-answer package changes
- deck-quality cleanup changes

Use crafted combat sims for:

- bridge or capstone skill checks
- boss-specific regression checks
- direct encounter pressure debugging
- “did the new skill matter?” validation before spending row budget

### 2. Re-run the smallest relevant row set after a local fix

If the fix is:

- lane-local: rerun only the affected lane seeds
- seed-local: rerun only the failed or suspect seeds
- class-wide: rerun only the affected class slice
- reward-routing or systemic: rerun the smallest broad slice that meaningfully exercises the change

After any rerun:

- regenerate [artifacts/balance/committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json)
- re-read [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- re-check [artifacts/balance/committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md) when you need to compare against the prior version of the same row
- only then decide whether more rows are needed

### 3. Re-run natural convergence after branchability changes

Any time we change:

- seed-aware reward shaping
- starter deck openness
- early reward pool breadth
- tier-2 engine availability

we should rerun natural convergence before claiming branchability improved.

### 4. Re-run pressure calibration after encounter changes

Any time we change:

- miniboss structure
- boss asks
- battle or elite pressure

we should rerun progression pressure calibration before making parity conclusions.

## Do Later

### 1. Broader parity confirmation

After the current polish queue is stable and the ledger still looks coherent:

- run a larger committed-lane matrix
- likely `10` seeds
- same `aggressive + balanced` structure

This is a recalibration tool, not the default control loop.

### 2. Natural convergence confirmation

After lane floor and reward routing are healthier:

- rerun natural convergence
- confirm that multiple lanes are viable without forcing

### 3. Boss and miniboss polish

Only after lane formation and weak-policy floor are in decent shape:

- tune boss pacing
- tune miniboss asks
- smooth any remaining act spikes

## Per-Pass Workflow

Use this order every time:

1. identify the weak row, ugly winner, or system-level quality problem
2. decide whether the problem is formation, progression, turn quality, answer package, or duplicate shaping
3. make the smallest fix that addresses that layer
4. run a focused smoke
5. inspect deck profile and failure point
6. regenerate the ledger
7. only then rerun a broader slice if the row updates still leave the picture unclear

## Fast Decision Rules

### If a lane fails because the deck never forms

Fix:

- starter shell
- early reward shaping
- commitment routing

Do not fix:

- boss numbers first

### If a lane clears but the final deck looks messy

Fix:

- reinforcement routing
- duplicate caps
- off-tree clamps
- cleanup incentives
- payoff competition inside the lane

Do not fix:

- clear-rate numbers first

### If `Balanced` dies too early

Fix:

- answer access
- support density
- salvage availability
- early curve floor

Do not fix:

- only the late boss

### If combat feels flat

Fix:

- hand tension
- card roles
- enemy intent

Do not fix:

- only raw damage and HP

## Hard Gates Before Declaring A Lane Healthy

Do not call a lane healthy until it satisfies all of these:

- it forms by early Act II
- it keeps one clear primary engine
- off-tree damage stays constrained
- splash remains utility-first
- reinforcement is the main source of power
- final deck looks like the intended optimized profile

## Hard Gates Before Declaring The Balance Phase Healthy

Do not call the current balance phase healthy until:

- flagship `Aggressive` lanes are broadly in band
- `Balanced` lanes are weaker but not collapsing unfairly
- minibosses and bosses are the real exams
- reward randomness still creates different viable run shapes
- endgame decks feel intentional and rewarding to build

The ledger can be clean before this phase is fully done. A `420 / 420` ledger means rescue is complete for the tracked row set, not that quality work is finished.

## What To Avoid

- do not broad-tune every class at once
- do not use one-seed runs as parity proof
- do not rerun a full `420`-run matrix just to confirm one lane-local fix
- do not rescue a lane by turning it into payoff soup
- do not let support splash become half the deck
- do not overfit to synthetic combat probes when the campaign matrix disagrees
- do not mistake a clean ledger for permission to stop checking deck quality

## Immediate Next Review

1. read [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md) first
2. pick either the first regression row or the ugliest monoculture-heavy healthy lane from the ledger
3. rerun only the smallest row set needed to answer that problem
4. regenerate the ledger and update the lane board if the queue changes
5. treat any full committed matrix as a periodic calibration pass, not the routine next step
