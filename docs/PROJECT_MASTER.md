# Project Master

Last updated: March 27, 2026.

## Purpose

This file is the repo entry point.

Use it to separate:

- current implementation truth
- live architecture patterns
- restored target-state guidance
- retired prototype material that should stay deleted

## Direction

Rouge is now a Diablo II-inspired roguelite deckbuilder built around party combat:

- the player character
- one mercenary companion
- an encounter-sized enemy pack

The retired lane or steam or telegraph prototype remains deleted from the active repo surface.

## Current Build

The live browser build is a multi-screen app-loop prototype built on the combat foundation.

Implemented now:

- boot-time seed loading from `data/seeds/d2/*.json`
- boss-specific combat portrait resolution, Diablo-themed monster fallbacks, the removal of the retired steampunk icon runtime, a D2-sourced generated monster portrait batch, and a repacked monster portrait pass for clearer in-combat silhouettes
- seed, runtime, world-node, and elite-affix validation with clearer failure messages through a split content-validator helper chain
- front door, character select, safe zone, world map, encounter, reward, act transition, and run-end phases
- front-door saved-snapshot review with explicit continue or abandon flow plus profile, stash, run-history, and onboarding panels
- seed-driven class selection and class-derived hero shells
- seven mercenary contracts with distinct targeting or support behaviors plus route-linked combat perk packages, including crossroad-linked compound scaling hooks and reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked late-route payoffs
- generated act encounter catalogs and zone routes across Acts I-V with broader opening, branch-battle, and miniboss pools
- act-specific boss scripting, deeper boss escorts, four elite-affix families per act, a twenty-kind encounter-local modifier catalog, six branch-battle and six branch-miniboss packages per act, stronger escort, court-reserve, boss-salvo, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence scripting, mobilized and posted aftermath boss courts, and act-tuned archetype behavior
- potions as support actions and automatic mercenary turns
- quest, shrine, aftermath-event, and multiple opportunity world nodes on the map, all routed through the existing reward flow with broader shrine blessings, shrine-specific branches, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, detour-lane payoffs, escalation-lane payoffs, consequence-gated opportunity variants, five-package branch-battle and branch-miniboss encounter and reward ladders, and a seven-package boss ladder that promote later-route variants through earlier shrine and crossroad flags
- quest outcome tracking plus shrine, event, and opportunity ledgers with explicit multi-step chain consequences on the run
- reward choice screens with deck growth, card upgrades, party boons, item or rune progression, progression-point rewards, milestone-aware encounter payouts, profile-aware late-act equipment replacement pivots, and stronger account-gated boss pivots up through `mythic_doctrine` and `immortal_annals`
- `skills.json`-backed class trees with capped tree investment, favored-tree summaries, level-based training, manual class-tree investment, manual stat allocation, and derived combat-bonus handoff
- socketed weapon and armor progression with carried inventory, stash transfer, rune insertion, broader item or rune or runeword catalogs, a higher late-game loot band, socket-ready late vendor stock, milestone-aware rune routing or pricing across carried and stash-planned bases, treasury-exchange late-market leverage plus direct vendor-to-stash consignment, sovereign-tier market pressure through `merchant_principate`, `sovereign_exchange`, and `ascendant_exchange`, third-wave market pressure through `trade_hegemony`, `imperial_exchange`, and `mythic_exchange`, profile-owned runeword planning charters plus archive-backed charter ledgers and stash-ready charter staging summaries that steer vendor and reward curation, archive-backed repeat-forge pricing or rune-routing pressure once a charter is already proven, live planning-id sanitization against the current runeword catalog during hydrate or archive review or town routing, cross-tree convergence pressure like `chronicle_exchange`, `sovereign_exchange`, `legendary_annals`, `ascendant_exchange`, `imperial_exchange`, `immortal_annals`, and `mythic_exchange`, profile-aware reward-side replacement curation, combat bonus handoff, a live white or blue or yellow or brown rarity ladder, typed weapon-damage and status-affix rolls, armor resistances with unique-only immunities, and weapon-family combat profiles that grant proficiency-matched attack and support bonuses plus on-hit Burn or Freeze or Shock or Slow or Crushing effects for families like bows, crossbows, javelins, spears, maces, polearms, staves, and wands
- D2-inspired zone loot tables with per-entry drop weights, difficulty-scaled drop counts, boss-biased unique drops, and class-aware vendor or reward-side weapon replacement pressure
- deterministic seeded run creation, loot, town-service outcomes, combat simulation, skill-audit reporting, power-curve reporting, and class-policy progression sweeps for balance work
- tuned balance around the deterministic progression simulator, with current aggressive optimized builds generally living near the intended clear band while weaker policies can fail as early as Act I against Andariel
- account progression trees across archive, economy, and mastery now include prerequisite-aware capstones and live gates like chronicle-vault or heroic-annals or mythic-annals or eternal-annals or sovereign-annals or imperial-annals retention, salvage-tithe or artisan-stock or brokerage-charter or treasury-exchange or merchant-principate or trade-hegemony economy pressure, training-grounds or war-college or paragon-doctrine or apex-doctrine or legend-doctrine or mythic-doctrine reward pivots, and cross-tree convergence bundles like `chronicle_exchange`, `war_annals`, `paragon_exchange`, `sovereign_exchange`, `legendary_annals`, `ascendant_exchange`, `imperial_exchange`, `immortal_annals`, and `mythic_exchange`
- stronger shell UX with a navigable front-door account hall, a primary expedition wing, a vault or archive wing, a hall-to-character-select-to-safe-zone expedition launch flow, town navigators, service drilldowns, route-intel panels, a world-map route decision desk, a reward continuity desk, an act-transition delta wrapper, explicit reward or run-end delta reviews, live unlock or tutorial or account-summary surfacing, focused-tree review or control surfaces, direct front-door preferred-class or settings or tutorial or runeword-planning controls, charter-ledger review, interactive archived-run review from the account hall, a hall decision desk, a town prep comparison board, a safe-zone before-or-after desk for the highest-value town-prep actions, a run-end hall handoff, a shared account-meta continuity board across hall or town or map or reward or act-transition or run-end, and a shared charter or convergence drilldown layer across those same shell phases
- safe-zone services for healing, belt refill, mercenary hire or replace or revive, vendor refresh or buy or sell or consign to stash, inventory or stash actions, departure-readiness framing, and before-or-after action treatment for the highest-value prep decisions
- return-to-town flow from the world map without losing route progress
- schema-versioned run snapshots plus profile-backed active-run, stash, richer run-history summaries, stash or archive or capstone-review summary APIs, stash-ready planning-charter staging summaries, cross-charter planning-overview summaries with next-action pressure, archive-backed repeat-forge charter summaries with best-clear detail, mutable settings, milestone-driven unlock, tutorial, and profile-meta persistence with live town-economy or reward feature gates plus content-aware planning-charter sanitization during hydrate and migration
- strict lint, reproducible build packaging, compiled-browser regression verification through `npm run check`, a built-bundle browser smoke path through `npm run test:e2e`, a full `npm run quality` gate, explicit coverage thresholds through `npm run test:coverage`, a harness-to-bundle drift regression test, and local quality-artifact history under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots, clear quality or coverage delta summaries, coverage headroom reporting, and a five-scenario built-bundle smoke lane covering saved-run return, safe-zone restore, act-transition or run-summary checkpoints, bad-seed boot failure, and corrupted-storage fallback

Not implemented now:

- broader account-level unlock trees and broader account UX beyond the current archive or economy or mastery trees, current capstone or convergence review, and the current hall or town or map or reward or act-transition or run-end decision-support layer
- broader mercenary route-perk breadth tied to future route families beyond the current twelve-per-contract route-perk baseline and reserve-or-relay-or-culmination-or-legacy-or-reckoning-or-recovery-or-accord-or-covenant-linked payoff pass
- broader route topology beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, and parallel legacy-opportunity or reckoning-opportunity or recovery-opportunity or accord-opportunity lanes that reconverge in covenant before opening detour and escalation per act
- broader encounter-local modifier catalogs, more authored elite packages, and more boss scripting breadth beyond the current five act-boss scripts and twenty-modifier combat baseline
- final late-run loot tuning, more handcrafted unique breadth, and broader feature-gated reward variety beyond the current higher-tier item, rune, and runeword catalog
- broader browser smoke depth beyond the current outer-loop restore, safe-zone restore, act-transition restore, run-summary handoff, corrupted-storage fallback, and return path

## Documentation Layers

When docs conflict, use this order.

### 1. Current build truth

- [index.html](/Users/andrew/proj/rouge/index.html)
- [styles.css](/Users/andrew/proj/rouge/styles.css)
- [src/content/game-content.ts](/Users/andrew/proj/rouge/src/content/game-content.ts)
- [src/content/seed-loader.ts](/Users/andrew/proj/rouge/src/content/seed-loader.ts)
- [src/content/content-validator-world-paths.ts](/Users/andrew/proj/rouge/src/content/content-validator-world-paths.ts)
- [src/content/content-validator-world-opportunities.ts](/Users/andrew/proj/rouge/src/content/content-validator-world-opportunities.ts)
- [src/content/content-validator-runtime-content.ts](/Users/andrew/proj/rouge/src/content/content-validator-runtime-content.ts)
- [src/content/content-validator.ts](/Users/andrew/proj/rouge/src/content/content-validator.ts)
- [src/content/encounter-registry-enemy-builders.ts](/Users/andrew/proj/rouge/src/content/encounter-registry-enemy-builders.ts)
- [src/content/encounter-registry-builders.ts](/Users/andrew/proj/rouge/src/content/encounter-registry-builders.ts)
- [src/content/encounter-registry.ts](/Users/andrew/proj/rouge/src/content/encounter-registry.ts)
- [src/character/class-registry.ts](/Users/andrew/proj/rouge/src/character/class-registry.ts)
- [src/quests/world-node-catalog-opportunities.ts](/Users/andrew/proj/rouge/src/quests/world-node-catalog-opportunities.ts)
- [src/quests/world-node-catalog.ts](/Users/andrew/proj/rouge/src/quests/world-node-catalog.ts)
- [src/quests/world-node-engine.ts](/Users/andrew/proj/rouge/src/quests/world-node-engine.ts)
- [src/quests/world-node-outcomes.ts](/Users/andrew/proj/rouge/src/quests/world-node-outcomes.ts)
- [src/quests/world-node-zones.ts](/Users/andrew/proj/rouge/src/quests/world-node-zones.ts)
- [src/quests/world-node-variants.ts](/Users/andrew/proj/rouge/src/quests/world-node-variants.ts)
- [src/run/run-state.ts](/Users/andrew/proj/rouge/src/run/run-state.ts)
- [src/run/run-route-builder.ts](/Users/andrew/proj/rouge/src/run/run-route-builder.ts)
- [src/run/run-progression.ts](/Users/andrew/proj/rouge/src/run/run-progression.ts)
- [src/run/run-reward-flow.ts](/Users/andrew/proj/rouge/src/run/run-reward-flow.ts)
- [src/run/run-factory.ts](/Users/andrew/proj/rouge/src/run/run-factory.ts)
- [src/combat/combat-modifiers.ts](/Users/andrew/proj/rouge/src/combat/combat-modifiers.ts)
- [src/combat/combat-engine.ts](/Users/andrew/proj/rouge/src/combat/combat-engine.ts)
- [src/app/app-engine.ts](/Users/andrew/proj/rouge/src/app/app-engine.ts)
- [src/app/main.ts](/Users/andrew/proj/rouge/src/app/main.ts)
- [src/rewards/reward-engine.ts](/Users/andrew/proj/rouge/src/rewards/reward-engine.ts)
- [src/town/service-registry.ts](/Users/andrew/proj/rouge/src/town/service-registry.ts)
- [src/items/item-data.ts](/Users/andrew/proj/rouge/src/items/item-data.ts)
- [src/items/item-catalog.ts](/Users/andrew/proj/rouge/src/items/item-catalog.ts)
- [src/items/item-loadout.ts](/Users/andrew/proj/rouge/src/items/item-loadout.ts)
- [src/items/item-town.ts](/Users/andrew/proj/rouge/src/items/item-town.ts)
- [src/items/item-system.ts](/Users/andrew/proj/rouge/src/items/item-system.ts)
- [src/state/persistence.ts](/Users/andrew/proj/rouge/src/state/persistence.ts)
- [src/state/save-migrations.ts](/Users/andrew/proj/rouge/src/state/save-migrations.ts)
- [src/state/profile-migrations.ts](/Users/andrew/proj/rouge/src/state/profile-migrations.ts)
- [src/ui/ui-common.ts](/Users/andrew/proj/rouge/src/ui/ui-common.ts)
- [src/ui/app-shell.ts](/Users/andrew/proj/rouge/src/ui/app-shell.ts)
- [src/ui/action-dispatcher.ts](/Users/andrew/proj/rouge/src/ui/action-dispatcher.ts)
- [src/ui/front-door-view.ts](/Users/andrew/proj/rouge/src/ui/front-door-view.ts)
- [src/ui/character-select-view.ts](/Users/andrew/proj/rouge/src/ui/character-select-view.ts)
- [src/ui/safe-zone-view.ts](/Users/andrew/proj/rouge/src/ui/safe-zone-view.ts)
- [src/ui/world-map-view.ts](/Users/andrew/proj/rouge/src/ui/world-map-view.ts)
- [src/ui/combat-view.ts](/Users/andrew/proj/rouge/src/ui/combat-view.ts)
- [src/ui/reward-view.ts](/Users/andrew/proj/rouge/src/ui/reward-view.ts)
- [src/ui/act-transition-view.ts](/Users/andrew/proj/rouge/src/ui/act-transition-view.ts)
- [src/ui/run-summary-view.ts](/Users/andrew/proj/rouge/src/ui/run-summary-view.ts)
- [src/ui/render-utils.ts](/Users/andrew/proj/rouge/src/ui/render-utils.ts)
- [src/types/game.d.ts](/Users/andrew/proj/rouge/src/types/game.d.ts)
- [tests/helpers/browser-harness.ts](/Users/andrew/proj/rouge/tests/helpers/browser-harness.ts)
- [tests/app-engine-shell.test.ts](/Users/andrew/proj/rouge/tests/app-engine-shell.test.ts)
- [tests/app-engine-account-systems.test.ts](/Users/andrew/proj/rouge/tests/app-engine-account-systems.test.ts)
- [tests/app-engine-world-nodes.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-nodes.test.ts)
- [tests/app-engine-world-nodes-route-chain.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-nodes-route-chain.test.ts)
- [tests/app-engine-world-nodes-route-payoffs.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-nodes-route-payoffs.test.ts)
- [tests/app-engine-world-nodes-late-routes.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-nodes-late-routes.test.ts)
- [tests/app-engine-world-node-validation.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-node-validation.test.ts)
- [tests/app-engine-world-node-gating-validation.test.ts](/Users/andrew/proj/rouge/tests/app-engine-world-node-gating-validation.test.ts)
- [tests/app-engine-progression.test.ts](/Users/andrew/proj/rouge/tests/app-engine-progression.test.ts)
- [tests/combat-engine.test.ts](/Users/andrew/proj/rouge/tests/combat-engine.test.ts)
- [tests/app-engine.test.ts](/Users/andrew/proj/rouge/tests/app-engine.test.ts)
- [docs/COMBAT_FOUNDATION.md](/Users/andrew/proj/rouge/docs/COMBAT_FOUNDATION.md)
- [docs/IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md)
- [docs/CODEBASE_RULES.md](/Users/andrew/proj/rouge/docs/CODEBASE_RULES.md)

These describe what is actually authored and playable now. `generated/` and `dist/` are runtime outputs, not editable source.

Use [docs/IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md) as the canonical live progress tracker for implementation status and milestone state.

### 2. Product-direction guidance

- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md)
- [docs/ROADMAP_EPICS.md](/Users/andrew/proj/rouge/docs/ROADMAP_EPICS.md)
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md)
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md)
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md)
- [docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md](/Users/andrew/proj/rouge/docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md)
- [docs/VISUAL_DESIGN_TRD.md](/Users/andrew/proj/rouge/docs/VISUAL_DESIGN_TRD.md)
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md)

These capture intended Diablo II structure and next execution targets. They are product-direction truth, not automatic runtime truth.

Use [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md) as the engineering bridge between the live repo and the target loop.

### 3. Operational support

- [docs/MONSTER-IMPLEMENTATION-GUIDE.md](/Users/andrew/proj/rouge/docs/MONSTER-IMPLEMENTATION-GUIDE.md)
- [docs/SPRITE_GENERATION_BACKLOG.md](/Users/andrew/proj/rouge/docs/SPRITE_GENERATION_BACKLOG.md)
- [docs/ATTRIBUTION.md](/Users/andrew/proj/rouge/docs/ATTRIBUTION.md)

These support asset sourcing and legal tracking.

## Working Rule

Future system work should extend the party-combat model and the current phase-driven app shell directly. Do not reintroduce train lanes, reactor heat, telegraph tracks, or other legacy prototype mechanics.
