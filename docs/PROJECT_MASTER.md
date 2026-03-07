# Project Master

Last updated: March 7, 2026.

## Purpose

This file is the repo entry point.

Use it to separate:

- current implementation truth
- restored target-state guidance
- retired prototype material that should stay deleted

## Direction

Rouge is now a Diablo II-inspired roguelite deckbuilder built around party combat:

- the player character
- one mercenary companion
- an encounter-sized enemy pack

The retired lane/steam/telegraph prototype has been removed from the active repo surface.

## Current Build

The live browser build is a combat foundation, not a full run loop.

Implemented now:

- one hero action deck
- three mercenary profiles
- three sample encounters
- visible enemy intent cycling
- potions as support actions
- automatic mercenary action on the ally turn
- browser UI for repeated combat iteration

Not implemented now:

- world map
- quests
- items
- runes
- shrines
- town services
- progression
- card rewards
- mercenary hiring economy

## Documentation Layers

When docs conflict, use this order.

### 1. Current build truth

- [combat-engine.js](/Users/andrew/proj/rouge/combat-engine.js)
- [content.js](/Users/andrew/proj/rouge/content.js)
- [main.js](/Users/andrew/proj/rouge/main.js)
- [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md)

These describe what is actually playable now.

### 2. Restored target-state guidance

- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md)
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md)
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md)
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md)
- [docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md](/Users/andrew/proj/rouge/docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md)
- [docs/VISUAL_DESIGN_TRD.md](/Users/andrew/proj/rouge/docs/VISUAL_DESIGN_TRD.md)
- [docs/DIABLO_INSPIRED_MIGRATION_PLAN.md](/Users/andrew/proj/rouge/docs/DIABLO_INSPIRED_MIGRATION_PLAN.md)
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md)

These capture the intended Diablo II structure, run flow, class/build grammar, and UI direction. They are planning truth, not current runtime truth.

Use [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md) as the engineering bridge between the current combat foundation and the restored product-direction docs.

### 3. Operational support

- [docs/ASSET_PACKS.md](/Users/andrew/proj/rouge/docs/ASSET_PACKS.md)
- [docs/ATTRIBUTION.md](/Users/andrew/proj/rouge/docs/ATTRIBUTION.md)

These support sourcing and legal tracking.

## Active Canonical Files

- [README.md](/Users/andrew/proj/rouge/README.md)
- [combat-engine.js](/Users/andrew/proj/rouge/combat-engine.js)
- [content.js](/Users/andrew/proj/rouge/content.js)
- [main.js](/Users/andrew/proj/rouge/main.js)
- [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md)
- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md)
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md)

## Working Rule

Any future system work should extend the new party combat model directly. Do not reintroduce train lanes, reactor heat, overclock, telegraph tracks, or other legacy prototype mechanics.

## Restore Boundary

Restored:

- D2 direction docs
- run-flow guidance
- class/build progression guidance
- UI/feature planning docs
- asset and attribution docs

Intentionally still deleted:

- legacy train-game runtime modules
- old screenshots and prototype art references
- current-build docs that described removed mechanics as live truth
