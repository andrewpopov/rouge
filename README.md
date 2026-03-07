# rouge

Diablo II-inspired roguelite deckbuilder, reset around a new combat foundation.

## Current State

The old lane/steam prototype has been removed from the active app surface.

The live repo now contains a small browser combat foundation centered on:

- one player character
- one mercenary companion
- an encounter-sized enemy pack
- hand-based skill play
- visible enemy intents
- potion support actions

Start with [docs/PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md), then read [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md).

## Restored Guidance

The repo also has restored target-state docs for the Diablo II direction:

- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md): full app structure and build order for the complete game loop
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md): run loop and application flow
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md): classes, skills, and deck grammar
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md): shared card and vendor economy
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md): mid-tier class rewards
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md): late-run class payoffs
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md): canonical D2 reference baseline

Treat those as design guidance. Treat the current combat files as live build truth.

## Commands

```bash
npm run lint
npm test
npm run build
npm run check
npm start
```
