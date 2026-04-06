# Project Master

Last updated: April 5, 2026.

## Purpose

This file is the repo entry point.

Use it to separate:

- current implementation truth
- live architecture patterns
- restored target-state guidance
- retired prototype material that should stay deleted

## Direction

Rouge is now a dark-fantasy roguelite deckbuilder built around party combat:

- the player character
- one mercenary companion
- an encounter-sized enemy pack

The retired lane or steam or telegraph prototype remains deleted from the active repo surface.

## Current Build

The live browser build is a multi-screen app-loop prototype built on the combat foundation.

Implemented now:

- boot-time seed loading from `data/seeds/d2/*.json`
- boss-specific combat portrait resolution, dark-fantasy monster fallbacks, the removal of the retired steampunk icon runtime, a genre-sourced generated monster portrait batch, and a repacked monster portrait pass for clearer in-combat silhouettes
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
- socketed weapon and armor progression with carried inventory, stash transfer, rune insertion, broader item or rune or runeword catalogs, a higher late-game loot band, socket-ready late vendor stock, milestone-aware rune routing or pricing across carried and stash-planned bases, treasury-exchange late-market leverage plus direct vendor-to-stash consignment, sovereign-tier market pressure through `merchant_principate`, `sovereign_exchange`, and `ascendant_exchange`, third-wave market pressure through `trade_hegemony`, `imperial_exchange`, and `mythic_exchange`, profile-owned runeword planning charters plus archive-backed charter ledgers and stash-ready charter staging summaries that steer vendor and reward curation, archive-backed repeat-forge pricing or rune-routing pressure once a charter is already proven, live planning-id sanitization against the current runeword catalog during hydrate or archive review or town routing, cross-tree convergence pressure like `chronicle_exchange`, `sovereign_exchange`, `legendary_annals`, `ascendant_exchange`, `imperial_exchange`, `immortal_annals`, and `mythic_exchange`, profile-aware reward-side replacement curation, quest-driven runeforge rewards that can equip a compatible base and finish the socket or rune recipe through the shared reward seam, boss-guaranteed rune drops plus missing-rune weighting in loot and vendor stock for unfinished runeword projects, combat bonus handoff, a live white or blue or yellow or brown rarity ladder, typed weapon-damage and status-affix rolls, armor resistances with unique-only immunities, unique-only bonus seams like `+1` hand size, and weapon-family combat profiles that grant proficiency-matched attack and support bonuses plus on-hit Burn or Freeze or Shock or Slow or Crushing effects for families like bows, crossbows, javelins, spears, maces, polearms, staves, and wands
- act-zone loot tables with per-entry drop weights, difficulty-scaled drop counts, boss-biased unique drops, and class-aware vendor or reward-side weapon replacement pressure
- deterministic seeded run creation, loot, town-service outcomes, combat simulation, skill-audit reporting, power-curve reporting, class-policy progression sweeps, and checkpoint reporting for active runewords or hand-size carry-through during balance work
- tuned balance around the deterministic progression simulator, with the row-level committed ledger now serving as the primary balance surface instead of any single frozen matrix: [committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json) and [committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md) currently merge the newest known result for each `class / policy / lane / seed` row and now sit at `417 / 420` clears (`0.993`), backed by an append-only history dataset in [committed-history.json](/Users/andrew/proj/rouge/artifacts/balance/committed-history.json) and [committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md) with `996` recorded row versions across those same `420` run keys; the tracked rescue wave for the current row set is complete, so the active balance phase has shifted from lane survival into deck-quality cleanup, payoff-monoculture cleanup, and targeted regression prevention, while large committed matrices remain periodic recalibration passes rather than the routine control loop
- balance tooling now carries explicit training state and normalized analysis state through row artifacts: targeted runs can serialize `requestedTrainingLoadout`, final `skillBar`, final checkpoint power, last encounter or boss hero and enemy power, training realization, and final build summary, so reruns of the same row can be compared directly instead of inferred from deep blobs; the next broad recalibration should still be the training-aware committed matrix defined in [docs/BALANCE_MATRIX_SPEC.md](/Users/andrew/proj/rouge/docs/BALANCE_MATRIX_SPEC.md) instead of another mixed-contract broad sample
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

## Balance Workflow

Use the deterministic simulator tooling for balance checks instead of one-off feel tuning.

- current snapshot and latest interpretation live in [artifacts/balance/latest.md](/Users/andrew/proj/rouge/artifacts/balance/latest.md)
- use [docs/BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md) as the operating plan for which suites matter, what order to tune in, and what counts as success
- use [docs/BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md) as the short working checklist for the current balance phase
- use [docs/BALANCE_LANE_BOARD.md](/Users/andrew/proj/rouge/docs/BALANCE_LANE_BOARD.md) as the current lane-by-lane snapshot from the merged committed ledger
- use [docs/BALANCE_MATRIX_SPEC.md](/Users/andrew/proj/rouge/docs/BALANCE_MATRIX_SPEC.md) as the source of truth for what the periodic complete matrix should contain in the training-aware runtime
- `npm run sim:skill-audit` audits card-value outliers by tier, cost, and role
- `npm run sim:balance -- --class barbarian,sorceress --scenario mainline_conservative,mainline_rewarded --set act5_endgame --runs 8` measures encounter win rate, turn length, and party-vs-enemy power on fixed endgame sets
- `npm run sim:progression -- --class barbarian,sorceress --policy aggressive --through-act 3 --probe-runs 0` runs a deterministic campaign checkpoint sim and now reports active runewords at each safe zone
- `npm run sim:progression-class-sweep -- --policy aggressive --through-act 5 --probe-runs 0 --seeds 4` is the main optimized-build clear-rate sweep
- `npm run sim:progression-class-sweep -- --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 4` is the main weak-build early-pressure sweep
- `npm run sim:power-curve -- --class barbarian --policy aggressive --through-act 5` compares checkpoint probes to the target boss or miniboss or elite or battle power bands

Near-term combat direction lives in [docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md) and [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md).

- keep visible enemy intent as the main fairness tool for tactical turns
- use energy to force meaningful sequencing choices instead of letting early hands dump trivially
- use [docs/DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md) as the source of truth for the hybrid gameplay model: `Slay the Spire` and `Monster Train` are now the primary deckbuilder design anchors, while Diablo II remains the class-identity and matchup-prep anchor
- treat `Slay the Spire` as the main source for card-state manipulation, temporary combat mutation, and next-card rule tension
- treat `Monster Train` as the main source for persistent engine state, trigger language, and package readability
- treat the other reviewed deckbuilders as secondary calibration references, not equal-weight structure sources
- use [docs/DECKBUILDER_PROGRESSION_AUDIT.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_PROGRESSION_AUDIT.md) as the live-gap audit for reward screens, evolutions, deck surgery, and merchant reinforcement
- use [docs/OPTIMIZED_DECK_PROFILE.md](/Users/andrew/proj/rouge/docs/OPTIMIZED_DECK_PROFILE.md) as the target-state definition of what a strong late-game deck should look like and whether the path to it felt earned
- use [docs/D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md) as the source of truth for one-tree specialization, utility splash rules, and soft-counter boss prep
- treat bosses and minibosses as the real exams while normal battles and most elites stay more expressive and generous
- use [docs/COMBAT_DECISION_DESIGN.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_DESIGN.md) as the target-state reference for hand tension, skill-card roles, and enemy-intent design
- use [docs/COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md) as the current prioritized gap list for starter cards, enemy verbs, and encounter decision depth

The current rule is to rerun the smallest relevant row set after major combat, loot, or class-card changes, regenerate the committed ledger, and only escalate to a broader matrix when the row-level picture is unclear or a systemic regression is suspected.

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

- [docs/BLOOD_ROGUE_VISUAL_IDENTITY.md](/Users/andrew/proj/rouge/docs/BLOOD_ROGUE_VISUAL_IDENTITY.md)
- [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md)
- [docs/ROADMAP_EPICS.md](/Users/andrew/proj/rouge/docs/ROADMAP_EPICS.md)
- [docs/GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)
- [docs/DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md)
- [docs/CARD_ACTION_SURFACE_REVIEW.md](/Users/andrew/proj/rouge/docs/CARD_ACTION_SURFACE_REVIEW.md)
- [docs/SKILL_ACTION_SURFACE_SYNTHESIS.md](/Users/andrew/proj/rouge/docs/SKILL_ACTION_SURFACE_SYNTHESIS.md)
- [docs/SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [docs/CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [docs/CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [docs/SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md)
- [docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md)
- [docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md)
- [docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md)
- [docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md](/Users/andrew/proj/rouge/docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md)
- [docs/DECKBUILDER_PROGRESSION_AUDIT.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_PROGRESSION_AUDIT.md)
- [docs/BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md)
- [docs/BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md)
- [docs/OPTIMIZED_DECK_PROFILE.md](/Users/andrew/proj/rouge/docs/OPTIMIZED_DECK_PROFILE.md)
- [docs/CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [docs/D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md)
- [docs/CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md)
- [docs/DRUID_LANE_PACKAGES.md](/Users/andrew/proj/rouge/docs/DRUID_LANE_PACKAGES.md)
- [docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md)
- [docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md)
- [docs/CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md)
- [docs/strategy-guides/README.md](/Users/andrew/proj/rouge/docs/strategy-guides/README.md)
- [docs/CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md)
- [docs/CLASS_REWARD_TIERS.md](/Users/andrew/proj/rouge/docs/CLASS_REWARD_TIERS.md)
- [docs/CLASS_CAPSTONES.md](/Users/andrew/proj/rouge/docs/CLASS_CAPSTONES.md)
- [docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md](/Users/andrew/proj/rouge/docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md)
- [docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md](/Users/andrew/proj/rouge/docs/USER_SCENARIOS_AND_FEATURE_GUIDES.md)
- [docs/VISUAL_DESIGN_TRD.md](/Users/andrew/proj/rouge/docs/VISUAL_DESIGN_TRD.md)
- [docs/ui-redesign-plan.md](/Users/andrew/proj/rouge/docs/ui-redesign-plan.md)
- [docs/PROGRESSION_REFERENCE.md](/Users/andrew/proj/rouge/docs/PROGRESSION_REFERENCE.md)

These capture intended Blood Rogue structure and next execution targets. They are product-direction truth, not automatic runtime truth.

Use [docs/CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md), [docs/CLASS_STRATEGY_GUIDE_SYSTEM.md](/Users/andrew/proj/rouge/docs/CLASS_STRATEGY_GUIDE_SYSTEM.md), and [docs/strategy-guides/README.md](/Users/andrew/proj/rouge/docs/strategy-guides/README.md) as the internal source set for future player-facing class guides and build explainers.

Use [docs/BLOOD_ROGUE_VISUAL_IDENTITY.md](/Users/andrew/proj/rouge/docs/BLOOD_ROGUE_VISUAL_IDENTITY.md) as the canonical source for look, feel, and "what good looks like" during visual reviews. `VISUAL_DESIGN_TRD.md` and `ui-redesign-plan.md` should support that standard, not redefine it.

Use [docs/APPLICATION_ARCHITECTURE.md](/Users/andrew/proj/rouge/docs/APPLICATION_ARCHITECTURE.md) as the engineering bridge between the live repo and the target loop.

### 3. Operational support

- [docs/MONSTER-IMPLEMENTATION-GUIDE.md](/Users/andrew/proj/rouge/docs/MONSTER-IMPLEMENTATION-GUIDE.md)
- [docs/VISUAL_ASSET_STATUS.md](/Users/andrew/proj/rouge/docs/VISUAL_ASSET_STATUS.md)
- [docs/ART_GENERATION_WORKFLOW.md](/Users/andrew/proj/rouge/docs/ART_GENERATION_WORKFLOW.md)
- [docs/ATTRIBUTION.md](/Users/andrew/proj/rouge/docs/ATTRIBUTION.md)
- [artifacts/balance/latest.md](/Users/andrew/proj/rouge/artifacts/balance/latest.md)

These support asset sourcing, legal tracking, and the current deterministic balance snapshot.

The older visual asset audit and backlog docs remain in the repo as compatibility landing pages, but `VISUAL_ASSET_STATUS.md` now owns current asset truth and `ART_GENERATION_WORKFLOW.md` now owns generation and import workflow.

## Working Rule

Future system work should extend the party-combat model and the current phase-driven app shell directly. Do not reintroduce train lanes, reactor heat, telegraph tracks, or other legacy prototype mechanics.
