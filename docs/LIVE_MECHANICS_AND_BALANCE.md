# Live Mechanics and Balance

Last updated: April 11, 2026.

## Purpose

This is the routing and maintenance doc for Rouge's live gameplay documentation.

Use it to keep three things aligned:

- current implementation truth
- desired balance targets and build-shaping doctrine
- player-facing strategy and mechanic explanation

This document is for:

- agents making gameplay changes
- designers reviewing mechanics or balance direction
- future player-guide authors who need a stable internal source set

Do not use this document to override code, tests, or balance artifacts. It is the doc map and doctrine layer, not the executable source of truth.

## Truth Order

When docs disagree, use this order:

1. code and regression tests
2. live balance artifacts and simulator outputs
3. current-build mechanic docs
4. target-state design docs
5. player-facing guide docs

Rule:

- never describe a mechanic as live unless code and tests already support it
- never describe a balance target as achieved unless the current artifacts support it
- keep target-state design separate from current-build explanation

## Owner Docs

### Current build truth

- [PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md)
- [COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md)
- [wiki/mechanics/status-effects.md](/Users/andrew/proj/rouge/docs/wiki/mechanics/status-effects.md)
- [USER_SCENARIOS_AND_FEATURE_GUIDES.md](/Users/andrew/proj/rouge/docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md)
- [IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md)

### Build-shaping and balance doctrine

- [BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md)
- [BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md)
- [BALANCE_MATRIX_SPEC.md](/Users/andrew/proj/rouge/docs/BALANCE_MATRIX_SPEC.md)
- [POWER_CALIBRATION.md](/Users/andrew/proj/rouge/docs/POWER_CALIBRATION.md)
- [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- [artifacts/balance/committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md)

### Skill, class, and card structure

- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [CORE_SKILL_SYSTEM_SPEC.md](/Users/andrew/proj/rouge/docs/CORE_SKILL_SYSTEM_SPEC.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [CLASS_CARD_AUTHORING_MATRIX.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_AUTHORING_MATRIX.md)
- [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md)
- [CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md)

### Strategy and future player guides

- [CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md)
- [CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md)
- [strategy-guides/README.md](/Users/andrew/proj/rouge/docs/strategy-guides/README.md)
- [strategy-guides](/Users/andrew/proj/rouge/docs/strategy-guides/README.md)

## Live Gameplay Doctrine

These are the high-level rules we want the docs, code, and balance work to reinforce.

### Combat surface

- the deck is the main turn-by-turn action surface
- core skills are deterministic floor-raisers, not a second hand
- the mercenary is a real combat actor, but should not replace deck sequencing
- visible enemy intent must stay readable enough for tactical decisions

### Encounter doctrine

- each act boss should pose a distinct tactical question rather than another generic damage race
- branch elites and minibosses should preview one or more asks from the act boss so the act teaches before it punishes
- boss encounters should test different build shapes differently: sustain, guard break, backline reach, elemental pressure, summon control, and recovery timing should all matter somewhere
- encounter ask tags should stay aligned with the live scripts because reward routing and player guidance depend on them

### Skill doctrine

- starter, bridge, and capstone skills should create identity, setup, counterplay, and windows
- core skills should stay low-cost and low direct-throughput compared with payoff cards
- deck cards and core skills should not share ids or collapse into the same runtime object
- one run should usually converge on one primary tree with optional splash support, not equal investment in all trees

### Card-pool doctrine

- target class pool: `50` class cards per class
- target shared foundation pool: `10-15` cards
- reward flow should remain class-first, with shared foundation cards acting as glue rather than the main attraction
- each class should support three real tree-shaped lanes with distinct gameplay loops

### Balance doctrine

- use the committed ledger as the normal operating balance surface
- prefer targeted row reruns over broad full-matrix reruns
- evaluate deck quality, lane integrity, and realization of training plans, not just win rate
- avoid fixing weak classes by letting off-tree damage or generic throughput become dominant

### Status-effect doctrine

- status timing must be deterministic and documented
- a debuff should normally affect the upcoming turn before it expires
- hard crowd control should create windows, not indefinite locks
- resistance and immunity behavior must be explicit in both code and docs
- every live status or effect kind should have regression coverage

## Current Meta Targets

These are the desired gameplay outcomes the live docs should keep pointing toward.

- early fights should be recoverable even on awkward draws
- early consistency should come from class identity and tactical floor, not from overpowered slot buttons
- winning decks should look like coherent lane builds, not piles of generic rate cards
- each class should have repeatable but non-scripted runs, with enough card variety to avoid repetitive play
- bosses should ask for preparation and answers, not just raw stat checks
- elites and minibosses should teach the same answers their act boss will later demand
- defensive play should remain viable without turning into low-pressure stalemates

## Documentation Update Matrix

When a change lands, update the owner docs that actually own that truth.

### If you change a live combat rule

Update:

- [COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md) if the rule changes encounter flow or core combat framing
- [wiki/mechanics/status-effects.md](/Users/andrew/proj/rouge/docs/wiki/mechanics/status-effects.md) if timing, stacking, resistance, immunity, or duration changed
- [PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md) if the current-build summary materially changed

### If you change cards, skills, trees, or training

Update:

- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [CORE_SKILL_SYSTEM_SPEC.md](/Users/andrew/proj/rouge/docs/CORE_SKILL_SYSTEM_SPEC.md) if the approved slot model changed
- [CLASS_CARD_AUTHORING_MATRIX.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_AUTHORING_MATRIX.md) and [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md) if class-package strategy changed
- [CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md) and the relevant strategy guide if the class meta changed

### If you find a bug or drift

Do this:

- add or tighten a regression test first if the bug changes runtime semantics
- update the owning mechanic doc if the bug changes what readers should currently believe
- if the bug revealed a design mismatch rather than just an implementation bug, update the target-state doc too

Rule:

- do not leave docs silently describing pre-fix behavior after the code changed
- do not leave docs pretending the target-state spec is already live

### If you refresh balance conclusions

Update:

- [BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md) for operating procedure
- [BALANCE_MATRIX_SPEC.md](/Users/andrew/proj/rouge/docs/BALANCE_MATRIX_SPEC.md) if the broad contract changed
- [POWER_CALIBRATION.md](/Users/andrew/proj/rouge/docs/POWER_CALIBRATION.md) only when the numbers themselves are refreshed
- [CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md) and the class guides if the practical class meta changed

## Required Standard For Agents

Any agent changing gameplay should leave behind:

- at least one regression test if runtime behavior changed
- the owning current-truth doc updated if player-visible semantics changed
- the owning target-state or strategy doc updated if the intended doctrine changed

If the change is too small to justify a doc edit, the agent should at least confirm which owner doc still remains accurate.

## Recommended Starting Points

For agents:

1. [PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md)
2. this doc
3. the owning mechanic or balance doc for the area being changed

For player-guide work:

1. [CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md)
2. [strategy-guides/README.md](/Users/andrew/proj/rouge/docs/strategy-guides/README.md)
3. [wiki/mechanics/status-effects.md](/Users/andrew/proj/rouge/docs/wiki/mechanics/status-effects.md)

For balance work:

1. [BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md)
2. [BALANCE_MATRIX_SPEC.md](/Users/andrew/proj/rouge/docs/BALANCE_MATRIX_SPEC.md)
3. [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
