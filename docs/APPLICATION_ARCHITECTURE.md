# Application Architecture

Last updated: March 7, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CODEBASE_RULES.md` for live module ownership and architecture patterns.
- Use `IMPLEMENTATION_PROGRESS.md` for the live milestone snapshot.
- Use this document as the engineering bridge between the current runtime and the next product-manager-approved build targets.
- Treat `COMBAT_FOUNDATION.md` as current combat truth and `GAME_ENGINE_FLOW_PLAN.md` as broader product-direction guidance.

## Purpose

This document answers one question:

- how do we grow the current party-combat prototype into the full Diablo II-inspired run loop without losing the working architecture.

It defines:

- the top-level game loop
- the live runtime state model
- the current domain boundaries
- the next extraction and build seams
- the implementation order that should drive team work

## Current Runtime Truth

The live workspace already has four active implementation layers.

### 1. Browser delivery layer

- `index.html` defines script order and boot wiring.
- the browser loads emitted runtime files from `generated/src/**`.

### 2. TypeScript source modules under `src/`

- `src/content/game-content.ts` owns authored cards, hero defaults, mercenaries, and fallback content
- `src/content/seed-loader.ts` loads the live seed bundle
- `src/content/content-validator.ts` validates seed, generated, world-node, and affix content
- `src/content/encounter-registry.ts` derives act encounter, boss, elite-affix, and archetype-behavior catalogs from seed data
- `src/character/class-registry.ts` adapts class seeds into hero shells and starter decks
- `src/quests/world-node-engine.ts` owns quest, shrine, aftermath-event, and opportunity node families plus reward-flow resolution
- `src/run/run-factory.ts` owns run creation, route generation, progression actions, reward application, and act advancement
- `src/combat/combat-engine.ts` owns deterministic encounter resolution
- `src/items/item-system.ts` owns loadout, inventory, stash, sockets, runes, and runewords
- `src/town/service-registry.ts` owns healer, belt, vendor, mercenary, and progression town actions
- `src/state/*.ts` owns run or profile persistence and migrations
- `src/app/app-engine.ts` owns top-level phase transitions and app-level orchestration
- `src/app/main.ts` is a thin DOM and event bridge into phase-owned `src/ui/*` modules

### 3. Seed and authored data

- `data/seeds/d2/*.json` currently supply classes, zones, enemy pools, monsters, bosses, items, runes, and runewords
- `skills.json` and `assets-manifest.json` exist in the repo but are not yet wired into the live runtime
- `src/types/game.d.ts` owns shared runtime contracts across app, run, combat, content, items, persistence, and tests

### 4. Verification and packaging

- `tests/*.test.ts` compile into `generated/tests/*.test.js` and load the browser runtime in a VM harness
- `scripts/build.js` copies `index.html`, emitted runtime files, assets, and seed data into `dist/`

## What The Live Runtime Already Owns

- boot-time seed loading
- seed and generated-content validation
- front door, character select, safe zone, world map, encounter, reward, act transition, and run-end phases
- front-door saved-run review plus continue or explicit abandon flow, profile summary, and onboarding surfaces
- phase-owned UI modules under `src/ui/*` with `src/app/main.ts` kept thin
- class-derived hero setup and mercenary selection
- five-act route generation and generated encounter pools
- act-specific boss scripting, multi-affix elite packages, and act-tuned archetype behavior
- quest, shrine, aftermath-event, and opportunity nodes routed through the existing reward flow
- safe-zone recovery, belt refill, mercenary hire or replace or revive, vendor refresh or buy or sell, inventory or stash actions, and town-hub presentation panels
- deterministic combat plus choice-based reward carry-through
- run snapshots, profile-backed stash persistence, run-history tracking, and lightweight profile meta defaults

## What The Live Runtime Still Does Not Own

- class skill trees and `skills.json` integrated into live progression
- manual stat allocation beyond the current vitality, focus, and command training model
- broader meta or profile UX such as unlocks, settings, and tutorial flags
- broader mercenary pool and richer mercenary scaling rules
- broader authored node catalogs beyond the current quest, shrine, aftermath-event, and opportunity set
- broader item breadth and wider runeword coverage

## Product Loop

The live and target loop should stay structurally aligned:

```mermaid
flowchart TD
  A["Boot"] --> B["Front Door"]
  B --> C["Character Select or Continue Run"]
  C --> D["Act Safe Zone"]
  D --> E["Town Services"]
  E --> F["World Map"]
  F --> G{"Node Type"}
  G -->|"Battle"| H["Encounter"]
  G -->|"Miniboss"| H
  G -->|"Boss"| H
  G -->|"Quest"| I["Node Reward"]
  G -->|"Shrine"| I
  G -->|"Aftermath Event"| I
  G -->|"Opportunity"| I
  H --> J["Reward"]
  I --> F
  J --> K{"Act Boss Cleared?"}
  K -->|"No"| F
  K -->|"Yes"| L["Act Transition"]
  L --> M{"Act V Cleared?"}
  M -->|"No"| D
  M -->|"Yes"| N["Run Complete"]
  H --> O["Run Failed"]
```

## Phase Contract

The runtime now uses one explicit top-level phase enum:

- `boot`
- `front_door`
- `character_select`
- `safe_zone`
- `world_map`
- `encounter`
- `reward`
- `act_transition`
- `run_complete`
- `run_failed`

Reserved future addition:

- `meta_sync`

Rules:

- only the app shell changes top-level phase
- combat turn flow is not a top-level app phase
- vendor, stash, and progression spend flows are subviews inside `safe_zone`
- tooltips and confirmation panels never become top-level phases

## Live State Model

The current runtime effectively stabilizes around five state buckets.

### `AppState`

Owns shell-level control:

- current top-level phase
- loaded registries and content
- selected class and mercenary UI state
- current profile
- active run
- active combat state
- shell error state

### `ProfileState`

Owns account-level persisted state that already exists:

- active run snapshot
- stash entries
- run history

Future extraction target:

- a broader `MetaState` can eventually absorb unlocks, settings, tutorials, and legacy progression if that surface grows enough to justify separation

### `RunState`

Owns one run across acts:

- selected class
- selected mercenary contract
- current act, zone, and node
- route graph and reachable nodes
- deck and card upgrades carried between fights
- equipped items
- carried inventory and stash transfer boundaries
- rune and socket state
- potion belt and refill state
- quest, shrine, and event outcomes
- follow-up consequence flags
- gold, XP, level, training ranks, and skill points
- reward queue
- town service state including vendor stock

### `CombatState`

Owns one encounter only:

- combatants
- combat resources
- intent schedule
- temporary statuses
- temporary buffs and debuffs
- draw, hand, and discard state
- encounter outcome

### `UIState`

Owns interaction state only:

- selected class and mercenary
- pending abandon confirmation
- selected target
- open panel
- hovered card, item, or node
- recent message or notification state

## Domain Boundaries

The application should keep these domain boundaries intact.

### 1. App Shell

Responsibility:

- boot the game
- load registries
- load or create profile
- load or create or continue run
- enforce top-level phase transitions
- hand the correct state slice to the correct screen

Current files:

- `src/app/app-engine.ts`
- `src/app/main.ts`

Future extraction targets:

- `src/app/phase-controller.ts`
- `src/app/navigation-state.ts`

### 2. Content Registry

Responsibility:

- load normalized content from seed and authored sources
- validate IDs and references
- expose immutable registries for classes, items, runes, runewords, enemies, mercenaries, zones, bosses, cards, and world nodes

Current files:

- `src/content/game-content.ts`
- `src/content/seed-loader.ts`
- `src/content/encounter-registry.ts`
- `src/content/content-validator.ts`

Next expansion:

- load and validate `skills.json`
- add normalization support for broader content families

### 3. Character and Progression Domain

Responsibility:

- class baselines
- level-based training growth
- future class-family progression
- future stat allocation
- derived combat values
- class starter decks

Current files:

- `src/character/class-registry.ts`
- `src/run/run-factory.ts`

Future extraction targets:

- `src/character/stat-system.ts`
- `src/character/skill-tree-system.ts`
- `src/character/deck-builder.ts`

### 4. Run Domain

Responsibility:

- create a run
- generate act routes
- advance nodes
- hand off into encounter, quest, shrine, event, and reward resolution
- decide act transitions and run completion

Current file:

- `src/run/run-factory.ts`

Future extraction targets:

- `src/run/run-state.ts`
- `src/run/world-map-generator.ts`
- `src/run/node-resolver.ts`
- `src/run/act-transition.ts`

### 5. Combat Domain

Responsibility:

- pure deterministic combat resolution
- card play
- status resolution
- enemy AI
- mercenary AI
- encounter win or loss result

Current bridge:

- `src/combat/combat-engine.ts`

Future split:

- `src/combat/combat-state.ts`
- `src/combat/card-resolution.ts`
- `src/combat/enemy-ai.ts`
- `src/combat/mercenary-ai.ts`
- `src/combat/status-system.ts`

### 6. Rewards and Economy Domain

Responsibility:

- reward offers after fights and nodes
- gold payouts
- potion payouts
- item and rune offers
- card rewards
- progression spend hooks
- vendor stock generation and pricing

Current files:

- `src/rewards/reward-engine.ts`
- `src/items/item-system.ts`
- `src/town/service-registry.ts`

Future extraction targets:

- `src/rewards/card-reward-system.ts`
- `src/rewards/drop-tables.ts`
- `src/economy/vendor-system.ts`
- `src/economy/gold-ledger.ts`

### 7. Itemization Domain

Responsibility:

- inventory
- stash handoff
- equipment slots
- runes
- sockets
- runewords
- combat bonuses derived from loadout

Current file:

- `src/items/item-system.ts`

Future extraction targets:

- `src/items/equipment-system.ts`
- `src/items/rune-system.ts`
- `src/items/runeword-system.ts`

### 8. Town and Services Domain

Responsibility:

- safe-zone service availability
- healing
- vendor flows
- stash transfer
- progression spend actions
- mercenary hire or replace or revive

Current file:

- `src/town/service-registry.ts`

Future extraction targets:

- `src/town/town-state.ts`
- `src/town/mercenary-hall.ts`
- `src/town/vendor-inventory.ts`

### 9. Quest and Event Domain

Responsibility:

- quest generation
- quest follow-up consequences
- shrine effects
- aftermath-event outcomes
- opportunity-chain outcomes
- future special-event families

Current file:

- `src/quests/world-node-engine.ts`

Future extraction targets:

- `src/quests/quest-system.ts`
- `src/events/event-system.ts`

### 10. Persistence Domain

Responsibility:

- save or load profile and run snapshots
- versioning and migrations
- run history records
- crash-safe resume

Current files:

- `src/state/persistence.ts`
- `src/state/save-migrations.ts`
- `src/state/profile-migrations.ts`

### 11. UI Domain

Responsibility:

- front door
- character select
- safe zone
- world map
- combat HUD
- reward panels
- act transition
- run summary

Current files:

- `src/app/main.ts`
- `src/ui/ui-common.ts`
- `src/ui/front-door-view.ts`
- `src/ui/character-select-view.ts`
- `src/ui/safe-zone-view.ts`
- `src/ui/world-map-view.ts`
- `src/ui/combat-view.ts`
- `src/ui/reward-view.ts`
- `src/ui/act-transition-view.ts`
- `src/ui/run-summary-view.ts`

## Data Ownership Rules

These rules keep the loop coherent.

1. Content data is read-only at runtime.
- do not mutate registries

2. `RunState` owns permanent-in-run changes.
- gained gold
- deck changes
- inventory and loadout changes
- quest, shrine, and event outcomes
- progression and vendor state

3. `CombatState` owns temporary encounter changes.
- damage
- temporary Guard
- Burn
- target marks
- next-attack buffs

4. Combat rewards are applied only after encounter resolution.
- fights and nodes resolve through app or run reward seams, not direct permanent mutation from UI code

5. Mercenary definition and mercenary combat instance are separate.
- catalog data lives in content
- hired mercenary state lives in `RunState`
- combat copy lives in `CombatState`

## Screen Ownership

The live prototype already ships thin versions of these screens. The next build should deepen them without collapsing their boundaries.

1. `Front Door`
- start run
- continue run
- abandon run
- saved-run summary
- run-history and stash summary

2. `Character Select`
- class pick
- class preview
- starter deck preview
- mercenary preview

3. `Safe Zone`
- healing
- vendor
- inventory and stash
- mercenary hire or replace or revive
- progression spend actions
- leave town

4. `World Map`
- act and zone labels
- reachable nodes
- node prerequisites
- quest, shrine, aftermath, and opportunity visibility
- boss route visibility

5. `Encounter`
- combat HUD
- target selection
- card play
- potion belt
- mercenary status
- visible enemy intents

6. `Reward`
- post-fight and post-node rewards
- card, item, rune, or boon choices
- quest, shrine, event, and opportunity outcome summaries

7. `Run End`
- win or loss summary
- build recap
- run-history handoff

## Full Game Loop Build Order

Implement in this order. Current status is noted so the live workspace and plan stay aligned.

### Milestone 1: Content and Bootstrap (`implemented`)

Live:

- seed loader
- class registry
- encounter registry
- content validation
- build packaging

Still missing:

- skill-tree and asset-manifest content wired into the runtime
- broader normalization

### Milestone 2: App Shell and Run Lifecycle (`implemented`)

Live:

- front door
- continue or abandon run
- profile hall and onboarding guidance
- character select
- app engine
- run creation
- safe-zone handoff
- profile-backed snapshot bootstrap

Still missing:

- broader profile settings or unlock surfaces beyond the current shell

### Milestone 3: World Map Loop (`implemented`)

Live:

- act route generator
- node traversal
- battle, miniboss, boss, quest, shrine, aftermath, and opportunity nodes
- return-to-map after encounter or node
- act transitions through Act V

Still missing:

- richer routing and broader authored node catalogs

### Milestone 4: Rewards and Progression (`partial`)

Live:

- reward screens
- gold, XP, and potion payouts
- card additions and upgrades
- party boons
- item and rune reward choices
- training-rank spends in town

Still missing:

- class-family progression
- skill-tree progression
- manual stat allocation

### Milestone 5: Safe Zone and Mercenary Management (`partial`)

Live:

- town services
- mercenary hire or replace or revive
- vendor stock refresh and buy or sell flows
- stash and inventory actions

Still missing:

- broader service differentiation
- broader mercenary roster and scaling

### Milestone 6: Itemization (`partial`)

Live:

- item and rune rewards
- equipment and inventory
- stash transfer
- sockets
- early runewords

Still missing:

- broader loot breadth
- deeper replacement pressure
- wider runeword coverage

### Milestone 7: Quests, Shrines, and Events (`partial`)

Live:

- quest, shrine, aftermath-event, and opportunity nodes
- consequence flags and multi-step chain state
- node reward resolution through the existing phase machine

Still missing:

- broader authored route-side catalogs

### Milestone 8: Run Completion and Meta (`partial`)

Live:

- act transitions through Act V
- run summary
- run history
- active-run and stash persistence

Still missing:

- unlocks
- settings
- tutorial state
- broader meta progression

## Guardrails

Do not:

- reintroduce lane movement as a core combat system
- make forecast UI solve turns for the player
- let town logic leak into the combat resolver
- let combat directly mutate profile or meta state
- hardcode item, rune, or mercenary behavior in UI files

Do:

- keep combat deterministic
- keep content data-driven
- keep encounter state separate from run state
- keep top-level app phases explicit
- keep growing the game by adding domains, not by expanding `src/app/main.ts`

## Immediate Next Execution Targets

The next implementation work should follow the product-manager-owned lanes:

1. Agent 1
- deepen front-door and town UX around the current profile, vendor, stash, progression, and node systems

2. Agent 2
- load skill-tree seed content and build class-family progression, manual stat allocation, broader loot breadth, and deeper profile or meta persistence

3. Agent 3
- broaden node families, deepen quest chains, expand elite or archetype variety, and harden the content pipeline for those new authored surfaces
