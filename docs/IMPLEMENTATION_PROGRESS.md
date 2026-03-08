# Implementation Progress

Last updated: March 8, 2026.

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

- latest command run: `npm run check`
- compiled browser tests passing: `157`

## System Tracker

| Area | Status | Live now | Still missing |
|---|---|---|---|
| Boot and seed loading | `implemented` | Seed loader, class registry, live `skills.json` progression catalog wiring, encounter registry, content validation, world-node validation, packaged browser build | Broader seed normalization and future asset-manifest inputs |
| App shell | `implemented` | Front-door profile hall with saved-run review, stash and run-history surfacing, interactive archive-review controls over richer archived runs, onboarding guidance, character select, safe zone, world map, encounter, reward, act transition, run-end, autosave or restore hooks, and live unlock or tutorial or account-summary panels plus focused-tree review or focus controls across front door, town, and run-end review, with direct front-door preferred-class or settings or tutorial controls plus a runeword-planning desk and charter-ledger review | Broader unlock panels, richer account-hall presentation, and broader account controls beyond the current profile shell |
| World map loop | `implemented` | Multi-act route generation, battle or miniboss or boss traversal, quest or shrine or aftermath-event or multiple opportunity nodes, consequence-gated route payoffs, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, consequence-conditioned branch or miniboss or boss encounter and reward packages, return to map, return to town | Broader act-route layouts and route topology beyond the current quest or shrine or aftermath-event plus shrine-opportunity and crossroad-opportunity and reserve-opportunity and relay-opportunity and culmination-opportunity and parallel legacy-opportunity or reckoning-opportunity or recovery-opportunity or accord-opportunity that reconverge in covenant |
| Combat foundation | `implemented` | Deterministic party combat, enemy intents, mercenary turn, potion actions, seven mercenary contracts, twelve-per-contract route perks with compound crossroad-linked scaling plus reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked late-route packages, act-specific boss scripting, consequence-conditioned branch or miniboss or boss encounter and reward packages, four elite-affix families per act, broader opening and branch-miniboss pools, a fourteen-kind encounter-local modifier catalog, act-tuned archetype behavior, and stronger escort, backline-screen, boss-screen, sniper-nest, phalanx-march, and elite-opener scripting | Broader encounter-local modifier catalogs and stronger boss or escort scripting beyond the current fourteen-modifier baseline; future route families can still deepen late-run mercenary payoff |
| Rewards | `implemented` | Card add, card upgrade, boons, gold or XP or potion payouts, progression-point rewards, manual training or class or attribute spend paths, milestone-aware encounter gold payouts, training-grounds or mastery-focus or war-college or paragon-doctrine or apex-doctrine reward pivots, profile-aware late-act equipment replacement pivots, stronger boss build pivots, and progression-aware reward summaries | More authored reward curation, broader feature-gated reward lanes, and deeper late-act reward variety |
| Safe-zone services | `implemented` | Healing, belt refill, mercenary hire or replace or revive, vendor refresh, buying, selling, direct vendor-to-stash consignment, inventory or stash actions, town return flow, clearer departure or persistence guidance, and milestone-aware town pricing or refresh rules with focused economy-tree pressure | Broader safe-zone service differentiation |
| Itemization | `implemented` | Equipment rewards, level or trophy-aware item floors, carried inventory, profile stash transfer, equip or unequip or socket flows, broader item or rune or runeword catalogs, a higher tier-7 or tier-8 loot band, socket-ready late vendor stock, milestone-aware rune routing across carried and stash-planned bases, salvage-tithe pricing pressure, artisan-stock late-vendor curation, brokerage-charter trade leverage, treasury-exchange premium market leverage plus direct vendor-to-stash consignment, profile-owned runeword planning charters that steer vendor previews or rune routing or replacement pivots, archive-backed unfulfilled-charter pressure in town or reward curation, profile-aware reward-side replacement curation, and combat bonus handoff | Final late-run loot tuning and more authored item breadth |
| Persistence and meta | `implemented` | Schema-versioned run snapshots, autosave or restore, profile-backed active-run snapshots, stash persistence, richer run-history snapshots with progression or economy or unlock deltas plus loadout-tier or stash-planning carry-through, mutable profile settings, focused account-tree controls, preferred-class tracking plus direct preferred-class mutation and default-selection rules, account unlock milestones, tutorial-state ownership, profile-owned runeword planning targets, archived charter-target carry-through plus fulfillment ledgers, migration coverage, prerequisite-aware account-tree capstones, richer stash or archive or capstone-review summary APIs, shell-routed archive review over stored run-history summaries, and live feature gates that feed archive retention, town economy, or reward behavior, including heroic-annals or mythic-annals or eternal-annals retention, brokerage-charter or treasury-exchange economy depth, paragon-doctrine or apex-doctrine mastery pivots, later-tier account nodes, and shell-facing preferred-class or settings or tutorial or planning controls | Broader account UX and future unlock trees beyond the current archive or economy or mastery pass and current focused-tree plus archive-review shell controls |
| Quests, shrines, and events | `implemented` | Quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, covenant-opportunity, and main-opportunity node families, broader shrine blessings, quest outcome ledger, follow-up and chain consequence tracking, consequence-gated opportunity variants, and non-combat route rewards through app or run flow | Broader route topology and later-act node-family expansion beyond the current legacy-plus-reckoning-plus-recovery-plus-accord-into-covenant pass |
| UI extraction | `implemented` | `src/app/main.ts` is a thin boot or dispatch bridge, phase-owned UI modules live under `src/ui/*`, and split compiled-browser app-engine suites plus a shared browser harness cover shell, progression, node, and validation flows | Dedicated unlock or settings surfaces beyond the current shell |
| Content validation | `implemented` | Seed or runtime reference validation, world-node catalog validation, authored-path reachability checks, elite-affix validation, and clearer boot-time failures | Broader normalization coverage for future encounter modifiers and route families |

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
- profile hall with stash and run-history surfacing
- character select
- app engine
- run creation
- safe-zone entry and exit
- profile-backed snapshot bootstrap
- onboarding and clarity surfaces across town, map, combat, and reward

Remaining:
- broader meta bootstrap and profile settings or unlock panels

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
- broader route topology beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, accord-opportunity, and covenant-opportunity set

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

Remaining:
- broader safe-zone service differentiation
- richer front-door and town onboarding
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
- quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, recovery-opportunity, and main-opportunity nodes
- quest outcome, follow-up, and chain consequence tracking
- shrine, event, and opportunity outcome ledgers
- non-combat reward resolution through the existing phase machine

Remaining:
- broader route topology
- more per-act quest and node breadth beyond the current expanded chain-plus-crossroad-plus-reserve-plus-relay-plus-culmination-plus-legacy-plus-reckoning-plus-recovery catalogs

### Milestone 8: Run Completion and Meta

Status:
- `implemented`

Live:
- act transitions through Act V
- run summary screen
- profile-backed run history and active-run snapshot persistence
- richer archived run-history summaries with progression or economy or unlock carry-through
- profile settings, account-tree focus controls, progression summaries, shell-facing focused-tree review plus tutorial-or-settings-or-planning control panels, front-door archive-review navigation over stored run history, and charter-ledger review over archived planning targets
- account unlock buckets, archive or economy or mastery trees with later-tier nodes like heroic annals or mythic annals, artisan stock or brokerage charter, and war college or paragon doctrine, plus tutorial-state ownership
- profile migration coverage and account-facing summary APIs
- preferred-class control and runeword-planning controls from the front door plus carry-through into character select or town economy summaries, with archive-backed charter-ledger feedback

Remaining:
- broader profile and account UX

## Active Next Gates

These are the next high-value implementation gates from the current baseline:

1. deepen the shell beyond the current hall or town or map or reward surfaces by adding clearer navigation, drilldown panels, and change summaries without re-expanding `src/app/main.ts`
2. grow the live archive or economy or mastery trees into broader capstone-style account systems, stronger account review data, and longer-horizon economy sinks on top of the current focus or settings or tutorial or planning seams
3. broaden authored route-side catalogs beyond the current quest, shrine, aftermath-event, shrine-opportunity, crossroad-opportunity, reserve-opportunity, relay-opportunity, culmination-opportunity, legacy-opportunity, reckoning-opportunity, and recovery-opportunity fabric
4. deepen downstream route payoff beyond the current legacy-and-reckoning-and-recovery pass and push later consequence payoffs into encounter packages, boss scripting, and reward consequences
5. broaden the encounter-local modifier catalog and escort or boss scripting beyond the current fourteen-modifier combat baseline
6. continue tuning late-run replacement pressure, account-gated reward variety, and long-horizon stash or vendor economy pressure beyond the current higher-tier item, rune, and runeword band plus the current treasury-exchange consignment sink, current runeword-planning charters, and current charter-ledger pressure
7. extract oversized hotspot modules, reduce `max-lines` suppression debt, and keep the remaining large suites shrinking without breaking the compiled-browser harness

Current Agent 4 focus order:

1. keep `tests/app-engine*.test.ts` aligned with `tests/helpers/browser-harness.ts` and finish the remaining suite cleanup
2. keep shrinking `src/content/content-validator.ts` from the new `src/content/content-validator-world-paths.ts` and `src/content/content-validator-runtime-content.ts` seams when a follow-on pass is warranted
3. keep `src/content/encounter-registry.ts` thin by routing generated-encounter work through the new helper chain
4. keep `src/run/run-factory.ts` and `src/run/run-reward-flow.ts` thin after the earlier run-domain and reward-flow extractions
5. stage smaller first extractions before attempting any coordinated pass on `src/quests/world-node-engine.ts`

## Update Rule

When implementation changes:

1. update this file first with the new status
2. update `PROJECT_MASTER.md` if the top-level snapshot changed
3. update `APPLICATION_ARCHITECTURE.md` if milestone status changed
4. update `TEAM_WORKSTREAMS.md` if team pickup guidance changed
5. update `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, `AGENT_4.md`, or `PROJECT_MANAGER.md` if team execution rules changed
