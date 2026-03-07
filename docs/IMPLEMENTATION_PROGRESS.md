# Implementation Progress

Last updated: March 7, 2026.

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

- compiled browser tests passing: `42`
- latest command run: `npm run check`

## System Tracker

| Area | Status | Live now | Still missing |
|---|---|---|---|
| Boot and seed loading | `implemented` | Seed loader, class registry, live `skills.json` progression catalog wiring, encounter registry, content validation, world-node validation, packaged browser build | Broader seed normalization and future asset-manifest inputs |
| App shell | `implemented` | Front-door profile hall with saved-run review, stash and run-history surfacing, onboarding guidance, character select, safe zone, world map, encounter, reward, act transition, run-end, and autosave or restore hooks | Broader unlock or settings panels beyond the current profile shell |
| World map loop | `implemented` | Multi-act route generation, battle or miniboss or boss traversal, quest or shrine or aftermath-event or opportunity nodes, return to map, return to town | Broader act-route layouts and more authored node catalogs |
| Combat foundation | `implemented` | Deterministic party combat, enemy intents, mercenary turn, potion actions, act-specific boss scripting, multi-affix elite packages, act-tuned archetype behavior, and stronger late-act escorts | More authored encounter packs and enemy-role breadth |
| Rewards | `implemented` | Card add, card upgrade, boons, gold or XP or potion payouts, progression-point rewards, manual training or class or attribute spend paths, and reward summaries | More authored reward curation and deeper late-act reward variety |
| Safe-zone services | `implemented` | Healing, belt refill, mercenary hire or replace or revive, vendor refresh, buying, selling, inventory or stash actions, town return flow, and clearer departure or persistence guidance | Broader safe-zone service differentiation |
| Itemization | `implemented` | Equipment rewards, level or trophy-aware item floors, carried inventory, profile stash transfer, equip or unequip or socket flows, broader rune catalogs, expanded runeword activation, vendor economy, and combat bonus handoff | Deeper late-run loot tuning and more authored item breadth |
| Persistence and meta | `partial` | Schema-versioned run snapshots, autosave or restore, profile-backed active-run snapshots, stash persistence, run-history hooks, profile settings, preferred-class tracking, and progression summaries | Account unlocks, tutorial-state management, and broader account UX |
| Quests, shrines, and events | `implemented` | Quest, shrine, aftermath-event, and opportunity node families, quest outcome ledger, follow-up and chain consequence tracking, and non-combat route rewards through app or run flow | Broader authored route-side catalogs beyond the current four-node chain |
| UI extraction | `implemented` | `src/app/main.ts` is a thin boot or dispatch bridge, phase-owned UI modules live under `src/ui/*`, and shell smoke coverage spans front door, town, map, combat, reward, persistence, and node-specific flows | Dedicated unlock or settings surfaces beyond the current shell |
| Content validation | `implemented` | Seed or runtime reference validation, world-node catalog validation, elite-affix validation, and clearer boot-time failures | Broader normalization coverage |

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
- quest, shrine, aftermath-event, and opportunity traversal
- return to map after encounters
- act transitions
- return from world map to safe zone

Remaining:
- richer route variation
- broader authored node catalogs beyond the current quest, shrine, aftermath-event, and opportunity set

### Milestone 4: Rewards and Progression

Status:
- `partial`

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
- vendor stock refresh and buy or sell flows
- inventory, stash, and progression spend actions

Remaining:
- broader safe-zone service differentiation
- richer front-door and town onboarding
- broader mercenary roster and scaling

### Milestone 6: Itemization

Status:
- `partial`

Live:
- item rewards
- rune rewards
- equipment loadout
- carried inventory and profile stash transfer
- level or trophy-aware reward floors
- equip, unequip, and socket flows through domain APIs
- sockets as explicit equipment state
- expanded rune catalog and runeword activation
- combat stat bonuses from loadout

Remaining:
- deeper item-replacement tension
- more authored late-run loot breadth

### Milestone 7: Quests, Shrines, and Events

Status:
- `partial`

Live:
- quest, shrine, aftermath-event, and opportunity nodes
- quest outcome, follow-up, and chain consequence tracking
- shrine, event, and opportunity outcome ledgers
- non-combat reward resolution through the existing phase machine

Remaining:
- broader authored route-side catalogs
- more per-act quest and node breadth

### Milestone 8: Run Completion and Meta

Status:
- `partial`

Live:
- act transitions through Act V
- run summary screen
- profile-backed run history and active-run snapshot persistence
- profile settings and progression summaries
- preferred-class carry-through into character select

Remaining:
- account unlocks and tutorial-state management
- broader profile and account UX

## Active Next Gates

These are the next high-value implementation gates from the current baseline:

1. deepen the front door and account shell around the current profile settings, run history, preferred-class, and stash systems without re-expanding `src/app/main.ts`
2. turn the new profile meta shape into actual unlock and tutorial-state systems
3. broaden authored route-side catalogs beyond the current quest, shrine, aftermath-event, and opportunity chain
4. deepen encounter packs beyond the current multi-affix elite and act-archetype pass, alongside mercenary breadth
5. tune late-run loot replacement pressure and expand the curated item, rune, and runeword catalog further

## Update Rule

When implementation changes:

1. update this file first with the new status
2. update `PROJECT_MASTER.md` if the top-level snapshot changed
3. update `APPLICATION_ARCHITECTURE.md` if milestone status changed
4. update `TEAM_WORKSTREAMS.md` if team pickup guidance changed
5. update `AGENT_1.md`, `AGENT_2.md`, `AGENT_3.md`, or `PROJECT_MANAGER.md` if team execution rules changed
