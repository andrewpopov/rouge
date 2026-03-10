# Implementation Progress

Last updated: March 9, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this file as the canonical implementation tracker for the live repo.
- Update this file whenever the live runtime meaningfully changes.
- Do not use this file for target-state design; use `APPLICATION_ARCHITECTURE.md` and `GAME_ENGINE_FLOW_PLAN.md` for that.

## Purpose

This document answers four questions:

- what is live right now
- what is partial versus missing
- what milestone the repo is currently in
- what the next implementation gates are

## Status Legend

- `implemented`: live in the current runtime and covered by the active browser or test path
- `partial`: live in a limited form, but not yet at target-state scope
- `planned`: intended next, but not live in the runtime

## Current Snapshot

Verified against:

- `src/**/*.ts`
- `tests/*.test.ts`
- emitted browser runtime under `generated/`

Most recent verification:

- latest shell gate run: `npm run check`
- latest broader quality lanes still on file: `npm run quality`, `npm run test:coverage`
- compiled browser tests passing: `206`
- compiled browser tests skipped: `0`
- built-bundle smoke tests passing: `4`
- coverage gates passing: `90.93` lines, `66.50` branches, `95.38` functions

## System Tracker

| Area | Status | Live now | Still missing |
|---|---|---|---|
| Boot and seed loading | `implemented` | Seed loader, class registry, live `skills.json` progression catalog wiring, encounter registry, content validation, world-node validation, packaged browser build | Broader seed normalization and future asset-manifest inputs |
| App shell | `implemented` | Front-door profile hall with a hall navigator, primary expedition wing, dedicated unlock galleries, dedicated vault logistics, a richer vault or archive wing with interactive archive-review controls plus an archive signal board, onboarding guidance, character select, safe zone, world map, encounter, reward, act transition, run-end, autosave or restore hooks, a hall-to-character-select-to-safe-zone expedition launch flow, route-intel panels, a route decision desk, town prep drilldowns, a reward continuity desk, an act delta review wrapper, explicit reward or run-end delta reviews, and a safe-zone before-or-after desk for the highest-value town-prep actions, plus live unlock or tutorial or account-summary panels and focused-tree review or focus controls across front door, town, reward, act transition, and run-end review, with direct front-door preferred-class or settings or tutorial controls plus a runeword-planning desk, capstone-watch treatment, charter-ledger review, stash-ready charter staging review, cross-tree convergence review, a hall decision desk, a town prep comparison board, a run-end hall handoff, a shared account-meta continuity board across hall or town or map or reward or act-transition or run-end, and a shared charter or convergence drilldown layer across those same shell phases | Broader account controls beyond the current continuity, decision-support, launch-readability, and drilldown shell |
| World map loop | `implemented` | Multi-act route generation, battle or miniboss or boss traversal, quest or shrine or aftermath-event or multiple opportunity nodes, consequence-gated route payoffs, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, detour-lane payoffs, escalation-lane payoffs, five-package consequence-conditioned branch-battle and branch-miniboss encounter and reward ladders, a seven-package boss ladder, return to map, return to town | Broader act-route layouts and route topology beyond the current quest or shrine or aftermath-event plus shrine-opportunity and crossroad-opportunity and reserve-opportunity and relay-opportunity and culmination-opportunity and parallel legacy-opportunity or reckoning-opportunity or recovery-opportunity or accord-opportunity that reconverge in covenant before opening detour and escalation |
| Combat foundation | `implemented` | Deterministic party combat, enemy intents, mercenary turn, potion actions, seven mercenary contracts, twelve-per-contract route perks with compound crossroad-linked scaling plus reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked late-route packages, act-specific boss scripting, five-package consequence-conditioned branch-battle and branch-miniboss encounter and reward ladders, a seven-package boss ladder, four elite-affix families per act, broader opening plus six-branch-battle and six-branch-miniboss pools, a twenty-kind encounter-local modifier catalog, act-tuned archetype behavior, mobilized and posted aftermath boss courts, and stronger escort, court-reserve, boss-salvo, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, ritual-cadence, and elite-opener scripting | Broader route topology beyond the current covenant-plus-detour-plus-escalation late-route fabric; future route families can still deepen late-run mercenary payoff |
| Rewards | `implemented` | Card add, card upgrade, boons, gold or XP or potion payouts, progression-point rewards, manual training or class or attribute spend paths, milestone-aware encounter gold payouts, training-grounds or mastery-focus or war-college or paragon-doctrine or apex-doctrine or legend-doctrine or mythic-doctrine reward pivots, archive-backed `war_annals` or `legendary_annals` or `immortal_annals` mastery pressure, profile-aware late-act equipment replacement pivots, stronger boss build pivots, and progression-aware reward summaries | More authored reward curation, broader feature-gated reward lanes, and deeper late-act reward variety |
| Safe-zone services | `implemented` | Healing, belt refill, mercenary hire or replace or revive, vendor refresh, buying, selling, direct vendor-to-stash consignment, inventory or stash actions, town return flow, a town navigator, service drilldowns, departure-readiness framing, and milestone-aware town pricing or refresh rules with focused economy-tree pressure | Broader safe-zone service differentiation |
| Itemization | `implemented` | Equipment rewards, level or trophy-aware item floors, carried inventory, profile stash transfer, equip or unequip or socket flows, broader item or rune or runeword catalogs, a higher tier-7 or tier-8 loot band, socket-ready late vendor stock, milestone-aware rune routing across carried and stash-planned bases, salvage-tithe pricing pressure, artisan-stock late-vendor curation, brokerage-charter trade leverage, treasury-exchange premium market leverage plus direct vendor-to-stash consignment, sovereign-tier market leverage through `merchant_principate`, `sovereign_exchange`, and `ascendant_exchange`, third-wave market leverage through `trade_hegemony`, `imperial_exchange`, and `mythic_exchange`, profile-owned runeword planning charters that steer vendor previews or rune routing or replacement pivots, archive-backed unfulfilled-charter pressure in town or reward curation, stash-ready charter staging summaries for compatible or prepared or ready bases, archive-backed repeat-forge pricing or rune-routing pressure once a charter is already proven, cross-charter planning overview summaries for missing-base or socket or rune pressure, content-aware planning-id sanitization across hydrate or summaries or town routing, cross-tree convergence pressure through `chronicle_exchange`, `sovereign_exchange`, `legendary_annals`, `ascendant_exchange`, `imperial_exchange`, `immortal_annals`, and `mythic_exchange`, profile-aware reward-side replacement curation, and combat bonus handoff | Final late-run loot tuning and more authored item breadth |
| Persistence and meta | `implemented` | Schema-versioned run snapshots, autosave or restore, profile-backed active-run snapshots, stash persistence, richer run-history snapshots with progression or economy or unlock deltas plus loadout-tier or stash-planning carry-through, mutable profile settings, focused account-tree controls, preferred-class tracking plus direct preferred-class mutation and default-selection rules, account unlock milestones, tutorial-state ownership, profile-owned runeword planning targets, archived charter-target carry-through plus fulfillment ledgers, migration coverage, prerequisite-aware account-tree capstones, cross-tree convergence bundles, richer stash or archive or capstone-review summary APIs, stash-ready planning-charter summaries for weapon or armor targets, cross-charter planning-overview summaries with next-action guidance, archive-backed repeat-forge charter summaries with best-clear detail, shell-routed archive review over stored run-history summaries, live feature gates that feed archive retention, town economy, or reward behavior, including heroic-annals or mythic-annals or eternal-annals or sovereign-annals or imperial-annals retention, brokerage-charter or treasury-exchange or merchant-principate or trade-hegemony economy depth, paragon-doctrine or apex-doctrine or legend-doctrine or mythic-doctrine mastery pivots, `chronicle_exchange` or `war_annals` or `paragon_exchange` or `sovereign_exchange` or `legendary_annals` or `ascendant_exchange` or `imperial_exchange` or `immortal_annals` or `mythic_exchange`, later-tier account nodes, shell-facing preferred-class or settings or tutorial or planning controls, and hydrate-time runeword-planning sanitization against the live catalog | Broader account UX and future unlock trees beyond the current archive or economy or mastery pass, current convergence review, current shared account-meta continuity layer, and current focused-tree plus archive-review shell controls |
| Quests, shrines, and events | `implemented` | Quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, detour-opportunity, escalation-opportunity, and main-opportunity node families, broader shrine blessings, quest outcome ledger, follow-up and chain consequence tracking, consequence-gated opportunity variants, and non-combat route rewards through app or run flow | Broader route topology and later-act node-family expansion beyond the current legacy-plus-reckoning-plus-recovery-plus-accord-into-covenant-plus-detour-plus-escalation pass |
| UI extraction | `implemented` | `src/app/main.ts` is a thin boot or dispatch bridge, phase-owned UI modules live under `src/ui/*`, and split compiled-browser app-engine suites plus a shared browser harness cover shell, progression, node, and validation flows | Dedicated unlock or settings surfaces beyond the current shell |
| Content validation | `implemented` | Seed or runtime reference validation, world-node catalog validation, authored-path reachability checks through the split `content-validator-world-paths`, `content-validator-world-opportunities`, and `content-validator-runtime-content` helper chain, elite-affix validation, and clearer boot-time failures | Broader normalization coverage for future encounter modifiers and route families |
| Automated verification | `implemented` | Strict lint, reproducible build packaging, compiled-browser regression suites, a top-level `npm run check` gate, a built-bundle browser smoke path through `npm run test:e2e` and `npm run test:e2e:built`, a full `npm run quality` gate, explicit coverage thresholds through `npm run test:coverage`, direct browser bad-seed boot-failure coverage, corrupted persisted-storage fallback coverage, a harness-to-bundle drift regression test, local quality-artifact history under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots, clear quality or coverage delta summaries plus coverage headroom in the latest artifact report, and a five-scenario built-bundle smoke lane backed by compiled-browser safe-zone, reward-restore, route-payoff, and malformed-profile regression coverage | Additional browser-only fault injection breadth can still expand later |

## Milestone Tracker

### Milestone 1: Content and Bootstrap

Status:
- `implemented`

Live:
- seed loader
- class registry
- generated encounter registry
- build packaging
- seed, runtime, world-node, and affix validation

Remaining:
- richer content normalization
- future asset-manifest inputs

### Milestone 2: App Shell and Run Lifecycle

Status:
- `implemented`

Live:
- front door
- saved-run review plus continue or abandon flow
- profile hall with a hall navigator, primary expedition wing, dedicated unlock galleries, dedicated vault logistics, a richer vault or archive wing with an archive signal board, and capstone watch surfacing
- a hall decision desk, town prep comparison board, a hall-to-character-select-to-safe-zone expedition launch flow, a safe-zone before-or-after desk for the highest-value town-prep actions, a world-map route decision desk, a reward continuity desk, an act delta review wrapper, a run-end hall handoff, a shared account-meta continuity board, and a shared charter or convergence drilldown layer that compare archive delta, convergence pressure, charter pressure, mastery pressure, live account bonuses, shell handoff, next-action guidance, slot-level charter posture, and the next convergence lane
- character select
- app engine
- run creation
- safe-zone entry and exit
- profile-backed snapshot bootstrap
- onboarding and clarity surfaces across town, map, combat, reward, and run-end review, plus reward or archive delta framing and before-or-after town-prep action treatment

Remaining:
- broader account-level controls beyond the current hall or town or map or reward or act-transition or run-end continuity, decision-support, and drilldown shell

### Milestone 3: World Map Loop

Status:
- `implemented`

Live:
- Acts I-V route shell
- battle or miniboss or boss traversal
- quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, and main-opportunity traversal
- return to map after encounters
- act transitions
- return from world map to safe zone

Remaining:
- richer route variation
- broader route topology beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, detour-opportunity, and escalation-opportunity set

### Milestone 4: Rewards and Progression

Status:
- `implemented`

Live:
- reward screens
- card additions
- card upgrades
- party boons
- run-summary mutation
- permanent vitality, focus, and command training
- manual skill-point spending in town
- `skills.json`-driven class-tree progression
- manual class-point and attribute-point spending in town
- reward-granted class and attribute points
- item or rune loadout rewards
- favored-tree progression summaries and derived combat bonuses
- milestone-aware encounter gold payouts and reward-side gold-bonus scaling
- stronger late-act boss progression pivots, including account-gated boss progression upgrades and training-grounds or mastery-focus reinforcement

Remaining:
- deeper reward tiers and more authored late-act reward curation

### Milestone 5: Safe Zone and Mercenary Management

Status:
- `partial`

Live:
- healing
- belt refill
- mercenary hire
- mercenary replacement
- mercenary revive
- seven mercenary contracts with twelve-per-contract route-linked combat perk bonuses, including crossroad-linked scaling hooks plus reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked late payoffs
- vendor stock refresh and buy or sell flows
- inventory, stash, and progression spend actions
- town navigator, service drilldowns, departure-readiness framing, and before-or-after comparison treatment for the highest-value prep actions

Remaining:
- broader safe-zone service differentiation
- broader town-side meta prep surfaces beyond the current navigator and service-drilldown pass
- broader late-run mercenary payoff only if future route families create new contract-side seams beyond the current covenant-linked perk pass

### Milestone 6: Itemization

Status:
- `implemented`

Live:
- item rewards
- rune rewards
- equipment loadout
- carried inventory and profile stash transfer
- level or trophy-aware reward floors
- equip, unequip, and socket flows through domain APIs
- sockets as explicit equipment state
- expanded item, rune, and runeword catalogs
- higher tier-7 or tier-8 loot band, socket-ready late vendor stock, and stronger replacement pressure
- combat stat bonuses from loadout

Remaining:
- final item-replacement tuning
- more authored late-run loot breadth

### Milestone 7: Quests, Shrines, and Events

Status:
- `partial`

Live:
- quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, and main-opportunity nodes
- quest outcome, follow-up, and chain consequence tracking
- shrine, event, and opportunity outcome ledgers
- non-combat reward resolution through the existing phase machine

Remaining:
- broader route topology
- more per-act quest and node breadth beyond the current expanded chain-plus-crossroad-plus-reserve-plus-relay-plus-culmination-plus-legacy-plus-reckoning-plus-recovery-plus-accord-plus-covenant-plus-detour-plus-escalation catalogs

### Milestone 8: Run Completion and Meta

Status:
- `implemented`

Live:
- act transitions through Act V
- run summary screen
- profile-backed run history and active-run snapshot persistence
- richer archived run-history summaries with progression or economy or unlock carry-through
- profile settings, account-tree focus controls, progression summaries, shell-facing focused-tree review plus tutorial-or-settings-or-planning control panels, front-door archive-review navigation over stored run history, explicit run-end archive-delta review, and charter-ledger review over archived planning targets
- account unlock buckets, archive or economy or mastery trees with later-tier nodes like heroic annals or mythic annals, artisan stock or brokerage charter, and war college or paragon doctrine, plus tutorial-state ownership
- profile migration coverage and account-facing summary APIs
- preferred-class control and runeword-planning controls from the front door plus carry-through into character select or town economy summaries, with archive-backed charter-ledger feedback

Remaining:
- broader profile and account UX

## Active Next Gates

These are the next high-value implementation gates from the current baseline:

1. keep breaking up the largest runtime hotspots with Agent 4, continuing from `src/quests/world-node-catalog-opportunities.ts` at roughly `6.6k` lines with `src/quests/world-node-catalog.ts` now reduced to roughly `3.0k` and `src/quests/world-node-engine.ts` still thin, then `src/content/game-content.ts` plus `src/state/persistence.ts`, then `src/combat/combat-engine.ts`, while keeping the browser boundary and tests green
2. keep the now-live local quality-artifact deltas under `artifacts/quality/latest.md`, the current five-test built smoke lane, and the current restore-path plus malformed-profile backfill green so the next release-confidence gap is visible when new feature work expands the surface
3. build on the live archive or economy or mastery trees, the current imperial-annals or trade-hegemony or mythic-doctrine third wave, and the current convergence layer with stronger account review data and longer-horizon economy sinks
4. break up the shell-owned hotspots with Agent 1, starting from `src/ui/front-door-view.ts` at roughly `1.4k` lines, `src/ui/ui-common.ts` at roughly `1.0k`, and `tests/app-engine-shell.test.ts` at roughly `1.6k`, then restart the parked resume-and-recovery shell feature pass on those smaller seams
5. broaden authored route-side catalogs beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, detour-opportunity, and escalation-opportunity fabric
6. deepen the live detour and escalation payoff into encounter packages, boss scripting, and reward consequences, and only add a further late-route family if it is materially different from the current covenant-plus-detour-plus-escalation fabric
7. continue tuning late-run replacement pressure, account-gated reward variety, and long-horizon stash or vendor economy pressure beyond the current higher-tier item, rune, and runeword band plus the current treasury-exchange consignment sink, the current trade-hegemony or imperial-exchange or mythic-exchange market layer, current runeword-planning charters, and current charter-ledger pressure

Current Agent 4 focus order:

1. `ROUGE-51`: keep splitting the quest domain from `src/quests/world-node-catalog-opportunities.ts` and the remaining catalog assembly helpers while preserving `src/quests/world-node-engine.ts` as the thin public surface
2. `ROUGE-43`: extract authored-content and progression-definition seams out of `src/content/game-content.ts` and `src/state/persistence.ts`
3. `ROUGE-42`: extract the next stable combat helper seams out of `src/combat/combat-engine.ts`
4. `ROUGE-47`: centralize module-registration ownership after the large-file extractions settle
5. `ROUGE-49`: keep shrinking oversized test files where the new seams make a split clearer

Current Agent 1 focus order:

1. `ROUGE-69`: split `src/ui/front-door-view.ts` and `src/ui/ui-common.ts` into smaller shell-owned helpers
2. `ROUGE-70`: split the oversized shell-heavy compiled-browser suites, starting with `tests/app-engine-shell.test.ts`
3. `ROUGE-71`: keep shell coverage green after the decomposition and leave the smaller seams ready for the parked `ROUGE-60` follow-on

## Update Rule

When implementation changes:

1. update this file first with the new status
2. update `PROJECT_MASTER.md` if the top-level snapshot changed
3. update `APPLICATION_ARCHITECTURE.md` if milestone status changed
4. update `TEAM_WORKSTREAMS.md` if team pickup guidance changed
5. update `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`, `AGENT_5.md`, or `PROJECT_MANAGER.md` if team execution rules changed
