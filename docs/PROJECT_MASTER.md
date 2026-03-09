# Project Master

Last updated: March 9, 2026.

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
- seed, runtime, world-node, and elite-affix validation with clearer failure messages through a split content-validator helper chain
- front door, character select, safe zone, world map, encounter, reward, act transition, and run-end phases
- front-door saved-snapshot review with explicit continue or abandon flow plus profile, stash, run-history, and onboarding panels
- seed-driven class selection and class-derived hero shells
- seven mercenary contracts with distinct targeting or support behaviors plus route-linked combat perk packages, including crossroad-linked compound scaling hooks and reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked late-route payoffs
- generated act encounter catalogs and zone routes across Acts I-V with broader opening, branch-battle, and miniboss pools
- act-specific boss scripting, deeper boss escorts, four elite-affix families per act, a sixteen-kind encounter-local modifier catalog, six branch-battle and six branch-miniboss packages per act, stronger escort, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence scripting, and act-tuned archetype behavior
- potions as support actions and automatic mercenary turns
- quest, shrine, aftermath-event, and multiple opportunity world nodes on the map, all routed through the existing reward flow with broader shrine blessings, shrine-specific branches, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, detour-lane payoffs, escalation-lane payoffs, consequence-gated opportunity variants, and four-package-per-role branch or miniboss or boss encounter and reward ladders that promote later-route variants through earlier shrine and crossroad flags
- quest outcome tracking plus shrine, event, and opportunity ledgers with explicit multi-step chain consequences on the run
- reward choice screens with deck growth, card upgrades, party boons, item or rune progression, progression-point rewards, milestone-aware encounter payouts, profile-aware late-act equipment replacement pivots, and stronger account-gated boss pivots up through `legend_doctrine` and `legendary_annals`
- `skills.json`-backed class trees with capped tree investment, favored-tree summaries, level-based training, manual class-tree investment, manual stat allocation, and derived combat-bonus handoff
- socketed weapon and armor progression with carried inventory, stash transfer, rune insertion, broader item or rune or runeword catalogs, a higher late-game loot band, socket-ready late vendor stock, milestone-aware rune routing or pricing across carried and stash-planned bases, treasury-exchange late-market leverage plus direct vendor-to-stash consignment, sovereign-tier market pressure through `merchant_principate`, `sovereign_exchange`, and `ascendant_exchange`, profile-owned runeword planning charters plus archive-backed charter ledgers and stash-ready charter staging summaries that steer vendor and reward curation, live planning-id sanitization against the current runeword catalog during hydrate or archive review or town routing, cross-tree convergence pressure like `chronicle_exchange`, `sovereign_exchange`, `legendary_annals`, and `ascendant_exchange`, profile-aware reward-side replacement curation, and combat bonus handoff
- account progression trees across archive, economy, and mastery now include prerequisite-aware capstones and live gates like chronicle-vault or heroic-annals or mythic-annals or eternal-annals or sovereign-annals retention, salvage-tithe or artisan-stock or brokerage-charter or treasury-exchange or merchant-principate economy pressure, training-grounds or war-college or paragon-doctrine or apex-doctrine or legend-doctrine reward pivots, and cross-tree convergence bundles like `chronicle_exchange`, `war_annals`, `paragon_exchange`, `sovereign_exchange`, `legendary_annals`, and `ascendant_exchange`
- stronger shell UX with a navigable front-door account hall, a primary expedition wing, a vault or archive wing, town navigators, service drilldowns, route-intel panels, a world-map route decision desk, a reward continuity desk, an act-transition delta wrapper, explicit reward or run-end delta reviews, live unlock or tutorial or account-summary surfacing, focused-tree review or control surfaces, direct front-door preferred-class or settings or tutorial or runeword-planning controls, charter-ledger review, interactive archived-run review from the account hall, a hall decision desk, a town prep comparison board, a run-end hall handoff, a shared account-meta continuity board across hall or town or map or reward or act-transition or run-end, and a shared charter or convergence drilldown layer across those same shell phases
- safe-zone services for healing, belt refill, mercenary hire or replace or revive, vendor refresh or buy or sell or consign to stash, inventory or stash actions, and departure-readiness framing
- return-to-town flow from the world map without losing route progress
- schema-versioned run snapshots plus profile-backed active-run, stash, richer run-history summaries, stash or archive or capstone-review summary APIs, stash-ready planning-charter staging summaries, cross-charter planning-overview summaries with next-action pressure, mutable settings, milestone-driven unlock, tutorial, and profile-meta persistence with live town-economy or reward feature gates plus content-aware planning-charter sanitization during hydrate and migration
- strict lint, reproducible build packaging, compiled-browser regression verification through `npm run check`, a built-bundle browser smoke path through `npm run test:e2e`, a full `npm run quality` gate, explicit coverage thresholds through `npm run test:coverage`, a harness-to-bundle drift regression test, and local quality-artifact history under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots

Not implemented now:

- broader account-level unlock trees and broader account UX beyond the current archive or economy or mastery trees, the current sovereign-annals or merchant-principate or legend-doctrine second wave, current capstone or convergence review, navigable account hall, town drilldowns, route-intel shell, preferred-class or settings or tutorial or runeword-planning controls, charter-ledger review, interactive archive-review desk, the current shared account-meta continuity board, the current shared charter or convergence drilldown layer, and the current hall or town or map or reward or act-transition or run-end decision-support layer
- broader mercenary route-perk breadth tied to future route families beyond the current twelve-per-contract route-perk baseline and reserve-or-relay-or-culmination-or-legacy-or-reckoning-or-recovery-or-accord-or-covenant-linked payoff pass
- broader route topology beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, and parallel legacy-opportunity or reckoning-opportunity or recovery-opportunity or accord-opportunity lanes that reconverge in covenant before opening detour and escalation per act
- broader encounter-local modifier catalogs and escort or boss scripting beyond the current sixteen-modifier combat baseline
- final late-run loot tuning and broader feature-gated reward variety beyond the current higher-tier item, rune, and runeword catalog
- broader browser smoke depth beyond the current outer-loop restore or return path and broader browser-only fault injection beyond the current stable progression and targeted boot-failure paths

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
- [src/quests/world-node-engine.ts](/Users/andrew/proj/rouge/src/quests/world-node-engine.ts)
- [src/quests/world-node-outcomes.ts](/Users/andrew/proj/rouge/src/quests/world-node-outcomes.ts)
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
- [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md)
- [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md)
- [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md)
- [AGENT_4.md](/Users/andrew/proj/rouge/AGENT_4.md)
- [AGENT_5.md](/Users/andrew/proj/rouge/AGENT_5.md)
- [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md)

These describe what is actually authored and playable now. `generated/` and `dist/` are runtime outputs, not editable source.

Use [docs/IMPLEMENTATION_PROGRESS.md](/Users/andrew/proj/rouge/docs/IMPLEMENTATION_PROGRESS.md) as the canonical live progress tracker for implementation status and milestone state.

### 2. Product-direction guidance

- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md)
- [docs/ROADMAP_EPICS.md](/Users/andrew/proj/rouge/docs/ROADMAP_EPICS.md)
- [docs/TEAM_WORKSTREAMS.md](/Users/andrew/proj/rouge/docs/TEAM_WORKSTREAMS.md)
- [AGENT_1.md](/Users/andrew/proj/rouge/AGENT_1.md)
- [AGENT_2.md](/Users/andrew/proj/rouge/AGENT_2.md)
- [AGENT_3.md](/Users/andrew/proj/rouge/AGENT_3.md)
- [AGENT_4.md](/Users/andrew/proj/rouge/AGENT_4.md)
- [AGENT_5.md](/Users/andrew/proj/rouge/AGENT_5.md)
- [PROJECT_MANAGER.md](/Users/andrew/proj/rouge/PROJECT_MANAGER.md)
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md)
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md)
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md)
- [docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md](/Users/andrew/proj/rouge/docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md)
- [docs/VISUAL_DESIGN_TRD.md](/Users/andrew/proj/rouge/docs/VISUAL_DESIGN_TRD.md)
- [docs/DIABLO_INSPIRED_MIGRATION_PLAN.md](/Users/andrew/proj/rouge/docs/DIABLO_INSPIRED_MIGRATION_PLAN.md)
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md)

These capture intended Diablo II structure and next execution targets. They are product-direction truth, not automatic runtime truth.

Use [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md) as the engineering bridge between the live repo and the target loop. Use the agent docs as the current product-manager-approved execution lanes.

### 3. Operational support

- [docs/ASSET_PACKS.md](/Users/andrew/proj/rouge/docs/ASSET_PACKS.md)
- [docs/ATTRIBUTION.md](/Users/andrew/proj/rouge/docs/ATTRIBUTION.md)

These support sourcing and legal tracking.

## Working Rule

Future system work should extend the party-combat model and the current phase-driven app shell directly. Do not reintroduce train lanes, reactor heat, telegraph tracks, or other legacy prototype mechanics.
