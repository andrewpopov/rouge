# rouge

Diablo II-inspired roguelite deckbuilder built around a phase-driven app loop and deterministic party combat.

## Current State

The live repo now contains a TypeScript-first browser prototype with:

- boot-time seed loading from `data/seeds/d2/*.json`
- seed and generated-content validation
- front door, character select, safe zone, world map, encounter, reward, act transition, and run-end screens
- class-derived hero shells and one mercenary companion chosen at run start
- act-based zone routing with `world_map -> encounter -> reward` repetition across Acts I-V
- quest, shrine, aftermath-event, and multiple opportunity world nodes routed through the same reward flow
- visible enemy intents, automatic mercenary turns, boss scripting, elite affix behavior, and encounter-local modifiers
- reward choices that can add cards, upgrade cards, grant boons, and grant item or rune progression
- `skills.json`-backed class trees, manual class or attribute spending, split item-domain helpers for inventory or stash flow, sockets, runes, and runewords
- town services for healing, belt refill, mercenary hire or replace or revive, vendor refresh or buy or sell, and inventory or stash actions
- profile-backed active-run persistence, stash persistence, run-history tracking, preferred class, settings, tutorial state, archive review, and account-level unlock or progression ownership
- split compiled-browser app-engine suites in `tests/app-engine*.test.ts` backed by `tests/helpers/browser-harness.ts`

Editable source lives in `src/**/*.ts`. The browser runs emitted JS from `generated/`, and `dist/` is packaged output.

Start with [docs/PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md), then read [docs/IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md), [docs/CODEBASE_RULES.md](/Users/andrew/proj/rouge/docs/CODEBASE_RULES.md), [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md), and [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md).

For team execution, use [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md), [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md), [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md), [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md), [AGENT_4.md](/Users/andrew/proj/rouge/AGENT_4.md), and [AGENT_5.md](/Users/andrew/proj/rouge/AGENT_5.md).

## Guidance Layers

The repo separates live engineering truth from target-state planning:

- [docs/CODEBASE_RULES.md](/Users/andrew/proj/rouge/docs/CODEBASE_RULES.md): live source-of-truth map and architecture patterns
- [docs/IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md): current implementation tracker and milestone snapshot
- [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md): current combat contract
- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md): live application structure plus the next build seams
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md): product-direction run loop and target system contracts
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md): class and build direction
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md): card and vendor economy direction
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md): class reward structure
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md): late-run class payoffs
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md): canonical D2 reference baseline

## Commands

```bash
npm run lint
npm test
npm run build
npm run check
npm start
```
