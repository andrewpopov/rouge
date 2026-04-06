# Balance Matrix Spec

_Snapshot: 2026-04-05_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document to define what the periodic complete balance matrix should be in the training-aware runtime.
- Use `BALANCE_PLAN.md` for broader balance policy.
- Use `BALANCE_EXECUTION_CHECKLIST.md` for the day-to-day row loop.
- Use `BALANCE_LANE_BOARD.md` for the current live queue from the merged ledger.

## Purpose

The ledger is still the normal operating surface.

The history dataset now sits next to it:

- [artifacts/balance/committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json)
- [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- [artifacts/balance/committed-history.json](/Users/andrew/proj/rouge/artifacts/balance/committed-history.json)
- [artifacts/balance/committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md)

This document defines the separate broad recalibration pass we still need occasionally:

- one complete matrix that gives us a coherent current-build snapshot
- one stable row contract for that matrix
- one clear rerun rule so we do not fall back into constant broad reruns

## Core Rule

Use targeted rows for normal balance work.

Use the complete matrix only to:

- establish a new broad baseline
- sanity-check whether the ledger still reflects the real runtime
- detect systemic shifts that smaller row updates might hide

## Canonical Complete Matrix

The new complete matrix should be the training-aware committed-lane campaign surface.

Dimensions:

- `7` classes
- `2` policies: `aggressive`, `balanced`
- `3` committed lanes per class
- `10` seeds per lane

That gives:

- `42` lane cells
- `420` total rows

Scenario contract:

- suite: `committed_archetype_campaign`
- scenario type: `campaign`
- through act: `5`
- probe runs: `0`
- max combat turns: `36`
- concurrency: `4`

## Why This Matrix Needs A New Contract

The runtime now carries explicit training state.

Runs can seed a requested training plan and serialize the actual final skill bar. That means a broad matrix produced before the training-aware row contract is not identical to a broad matrix produced after it.

So the next complete matrix should be read as:

- the first post-training broad baseline
- not just another rerun of the old contract

## Row Model

Keep the mental model simple:

- one row = one `class / policy / lane / seed` run
- newer rows replace older rows only when they represent the same runtime contract

Required row fields:

- `runKey`
- `classId`, `className`
- `policyId`, `policyLabel`
- `seedOffset`
- `targetArchetypeId`, `targetArchetypeLabel`, `targetBand`
- `requestedTrainingLoadout`
- `skillBar`
- `analysis`
- `outcome`
- `finalActNumber`
- `finalLevel`
- `failure`
- `summary`
- `checkpoints`
- `durationMs`
- `completedAt`

Training-specific fields are now mandatory for the complete matrix:

- `requestedTrainingLoadout.favoredTreeId`
- `requestedTrainingLoadout.unlockedSkillIds`
- `requestedTrainingLoadout.equippedSkillIds.slot2`
- `requestedTrainingLoadout.equippedSkillIds.slot3`
- `skillBar.favoredTreeId`
- `skillBar.unlockedSkillCount`
- `skillBar.unlockedSkillIds`
- `skillBar.unlockedSkillNames`
- `skillBar.slotStateLabel`
- `skillBar.equippedSkillIds`
- `skillBar.equippedSkillNames`
- `analysis.finalCheckpoint.powerScore`
- `analysis.finalCheckpoint.bossReadinessScore`
- `analysis.lastEncounter.heroPowerScore`
- `analysis.lastEncounter.enemyPowerScore`
- `analysis.lastEncounter.powerRatio`
- `analysis.lastBoss.heroPowerScore`
- `analysis.lastBoss.enemyPowerScore`
- `analysis.lastBoss.powerRatio`
- `analysis.trainingRealization`
- `analysis.finalBuild`

## What The Complete Matrix Must Answer

### 1. Survival

- row clear rate
- class or policy totals
- lane totals
- failure hotspots by act, zone, and encounter

### 2. Lane Integrity

- committed-by-checkpoint behavior
- identity drift
- off-tree pressure
- whether the final run still looks like the requested lane

### 3. Training Realization

This is the new part and it should be explicit.

For each lane, the matrix should tell us:

- how often the requested favored tree stayed favored
- how often `slot2` was actually equipped
- how often `slot3` was actually equipped
- how often the requested capstone failed to materialize even in winning rows

A row is now suspicious if it clears but:

- never fills `slot3`
- diverges from the requested favored tree
- or wins while the requested training plan is mostly unrealized

That is not automatically a bug, but it is now a real balance and progression signal.

### 4. Deck Quality

The matrix should still support the older quality reads:

- payoff monoculture
- weak answer packages
- ugly winners
- clean vs messy setup or support or payoff ratios

## Required Aggregate Views

The complete matrix report should include:

- overall `420`-row clear rate
- class or policy totals
- lane totals
- failure hotspots
- slot fill rates by lane
- capstone uptake by lane
- requested-vs-actual favored-tree alignment
- rows that reached `Level 12+` but still ended without `slot3`
- rerun deltas for the same `runKey`, especially checkpoint power, boss power ratio, and capstone realization changes

That last view is important now. It is one of the clearest ways to spot:

- broken capstone gates
- bad training routing
- lanes whose requested capstone is not actually relevant enough to survive the run

## Recommended Artifact Shape

Canonical artifact family:

- `artifacts/balance/<matrix-name>.json`
- `artifacts/balance/<matrix-name>.md`
- `artifacts/balance/<matrix-name>.job.json`
- `artifacts/balance/<matrix-name>-traces/`

Canonical analysis artifacts generated from row history:

- `artifacts/balance/row-history.jsonl`
- `artifacts/balance/committed-history.json`
- `artifacts/balance/committed-history.md`
- `artifacts/balance/committed-ledger.json`
- `artifacts/balance/committed-ledger.md`

Recommended name for the first post-training broad baseline:

- `complete-training-aware-committed-matrix-v1.json`
- `complete-training-aware-committed-matrix-v1.md`

## Recommended Command Shape

```bash
node ./scripts/run-balance-orchestrator.js \
  --suite committed_archetype_campaign \
  --class amazon,assassin,barbarian,druid,necromancer,paladin,sorceress \
  --policy aggressive,balanced \
  --seeds 10 \
  --concurrency 4 \
  --output artifacts/balance/complete-training-aware-committed-matrix-v1.json
```

## Rerun Rule

Rerun the complete matrix when:

- the runtime contract changed broadly
- training, reward routing, or progression changed across many lanes
- combat rules changed broadly enough that many old rows are probably stale
- the ledger has accumulated enough targeted overrides that the broad picture is unclear

Do not rerun the complete matrix when:

- one lane got a local fix
- one boss got a narrow change
- one or two seeds are the only real question

## Relationship To The Ledger

The ledger remains the live operating board.

The complete matrix should do three things for it:

1. establish a clean broad baseline for the current runtime contract
2. provide a coherent seed bank for future row replacement
3. reveal broad signals the targeted row loop might miss

After the matrix is done:

- fold its rows into the ledger
- update the lane board
- go back to targeted reruns

## Current Recommendation

The next complete matrix should be:

- the training-aware committed-lane campaign matrix
- `420` rows
- built on the explicit training-loadout contract
- treated as the first post-training broad baseline

That is the right broad snapshot to trust next.
