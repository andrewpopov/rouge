# Crafted Combat Sim Workflow

Last updated: April 6, 2026.

## Purpose

Use the crafted combat sim when we want to answer:

- how a specific hand-built build performs into a boss or monster pack
- whether a new bridge or capstone skill is actually valuable in battle
- whether a lane is failing because of build formation or because the fight exam is too hard
- whether a regression is about card numbers, skill-bar usage, or encounter asks

This is not the row-level campaign ledger. It is the focused duel and boss-check tool.

## Entry Point

Script:

- [scripts/run-crafted-combat-sim.js](/Users/andrew/proj/rouge/scripts/run-crafted-combat-sim.js)
- [scripts/run-crafted-combat-suite.js](/Users/andrew/proj/rouge/scripts/run-crafted-combat-suite.js)
- [scripts/run-crafted-combat-diff.js](/Users/andrew/proj/rouge/scripts/run-crafted-combat-diff.js)

Core helper:

- [tests/helpers/combat-simulator.ts](/Users/andrew/proj/rouge/tests/helpers/combat-simulator.ts)

Example spec library:

- [data/balance/crafted-combat-specs](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs)

## What A Crafted Spec Can Control

- class, mercenary, seed, act, level, max turns
- direct `encounterId`, multiple `encounterIds`, or an `encounterSetId`
- exact deck cards or starter deck plus added cards
- tree ranks and favored tree
- unlocked and equipped skills
- explicit gear by slot
- potion count, gold, hero overrides, mercenary overrides
- `bypassTrainingGates` for hypothetical or future-facing skill-bar checks

## Standard Commands

Human-readable run:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-sim.js \
  --spec /Users/andrew/proj/rouge/data/balance/crafted-combat-specs/sorceress-fire-act4-boss.json
```

JSON report to stdout:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-sim.js \
  --spec /Users/andrew/proj/rouge/data/balance/crafted-combat-specs/sorceress-fire-act4-boss.json \
  --json
```

JSON report saved to disk:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-sim.js \
  --spec /Users/andrew/proj/rouge/data/balance/crafted-combat-specs/sorceress-fire-act4-boss.json \
  --output /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/sorceress-fire-act4-boss.json
```

Run the whole starter suite:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-suite.js \
  --output-dir /Users/andrew/proj/rouge/artifacts/balance/crafted-runs \
  --summary /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/summary.json
```

Run only tagged Act IV boss regressions:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-suite.js \
  --tag boss,act4,skill-regression \
  --output-dir /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/act4
```

Run only summon-focused checks:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-suite.js \
  --tag summon \
  --summary /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/summon-summary.json
```

Compare two crafted reports:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-diff.js \
  --before /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/sorceress-before.json \
  --after /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/sorceress-after.json
```

Compare two suite summaries:

```bash
node /Users/andrew/proj/rouge/scripts/run-crafted-combat-diff.js \
  --before /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/before-summary.json \
  --after /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/after-summary.json \
  --output /Users/andrew/proj/rouge/artifacts/balance/crafted-runs/diff.json
```

## Included Starter Specs

- [template.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/template.json)
- [sorceress-fire-act4-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/sorceress-fire-act4-boss.json)
- [barbarian-mastery-act4-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/barbarian-mastery-act4-boss.json)
- [necromancer-summon-act5-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/necromancer-summon-act5-boss.json)
- [amazon-bow-act5-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/amazon-bow-act5-boss.json)
- [assassin-shadow-act4-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/assassin-shadow-act4-boss.json)
- [druid-summon-act5-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/druid-summon-act5-boss.json)
- [paladin-offensive-auras-act5-boss.json](/Users/andrew/proj/rouge/data/balance/crafted-combat-specs/paladin-offensive-auras-act5-boss.json)

## Recommended Uses

Use crafted combat before a row rerun when:

- a new skill was added or retuned
- a capstone feels dead and we want to see if the fight pilot ever chooses it
- a boss failure is consistent but the lane otherwise forms correctly
- we need a quick pressure check without paying for a full campaign rerun

Use the row-level committed balance flow when:

- we need to know if the full run still forms and clears
- reward routing, safe-zone optimization, or progression timing changed
- the issue is not isolated to one encounter exam

## Reading The Output

The crafted report gives us:

- requested build input
- actual build summary with power and boss-readiness
- actual training state, including favored tree and equipped skills
- per-encounter win rate, turns, power ratio, skill usage, and beam-search use

The diff tool gives us:

- before/after power and boss-readiness deltas
- before/after win-rate deltas
- per-encounter power-ratio and slot-use deltas
- suite-level average win-rate and boss-readiness movement

Focus on:

- `build.training`
- `encounters[].powerRatio`
- `encounters[].skillActionRate`
- `encounters[].slot2UseRate`
- `encounters[].slot3UseRate`
- `encounters[].beamDecisionRate`

For suite summaries, also watch:

- average win rate across the spec pack
- builds that have strong power but still fail cleanly
- capstones that are equipped but still not producing wins

## Working Rule

Crafted combat sims are for targeted diagnosis and fast regression checks.

They should inform balance decisions, but they do not replace the campaign ledger or the periodic committed matrix.
