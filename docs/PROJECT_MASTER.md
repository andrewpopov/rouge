# Rouge Project Master Document

_Last updated: 2026-03-06_
_Snapshot date: 2026-03-06_

## Purpose

This is the top-level project tracker for the repo.

Use it to answer four questions quickly:

1. What game are we actually building?
2. What is already implemented vs still planned?
3. Which docs are canonical for each area?
4. What are the current risks, gaps, and next execution priorities?

This document does not replace specialized docs. It organizes them, defines precedence, and records the current project snapshot.

Maintainer note:
- For documentation sync work in this repo, prefer using the `$game-doc-maintainer` skill so the master doc, game guide, and gameplay docs move together.

## Project Identity

- Repo / working name: `rouge`
- Target product identity: high-fidelity Diablo II-inspired dark-fantasy roguelite deckbuilder
- Final player-facing product name: TBD
- Retired prototype name: `Brassline: Last Reactor` (historical only; do not use in new product docs or UI copy)
- Current reality: the codebase is in migration from a retired steampunk prototype into the target dark-fantasy game structure
- Fidelity target: preserve canonical Diablo II class/town/zone/NPC/boss structure and quest beats where feasible; compress only when run format, scope, or legal asset constraints require it

Practical interpretation:

- The runtime is already shipping D2-inspired systems, seeds, icons, classes, gear, quests, and reward-tree content.
- The live shell, terminology, and some balance assumptions still reflect the retired steampunk prototype.
- New product-facing docs should assume high D2 fidelity by default, not loose thematic inspiration.
- Documentation must distinguish between:
  - current implementation truth
  - approved target direction
  - historical prototype reference

## Documentation Hierarchy

When docs conflict, use this order.

### 1. Master overview and status

- `PROJECT_MASTER.md` (this file)
  - Canonical project overview, status snapshot, doc map, and conflict resolution.

### 2. Gameplay architecture and runtime flow

- `GAME_ENGINE_FLOW_PLAN.md`
  - Canonical target-state product flow, content model, and run structure for the D2-inspired game.
- `CORE_ENGINE_LOOP.md`
  - Canonical current implementation notes for the engine loop and phase controller.

Rule:
- If `GAME_ENGINE_FLOW_PLAN.md` and `CORE_ENGINE_LOOP.md` differ, treat `CORE_ENGINE_LOOP.md` as current implementation truth and `GAME_ENGINE_FLOW_PLAN.md` as target-state design.

### 3. UX and visual direction

- `VISUAL_DESIGN_TRD.md`
  - Canonical target UI surface plan, component map, and build order.
- `MVP_ART_SPEC.md`
  - Historical steampunk prototype visual spec; reference-only unless a legacy surface still depends on it.

Rule:
- For all new UI work, prefer `VISUAL_DESIGN_TRD.md` over `MVP_ART_SPEC.md`.

### 4. Player-facing guide

- `GAME_GUIDE.md`
  - Canonical player-facing explanation of the current playable build, loop, combat rules, class/deck progression, and known transitional terminology.

Rule:
- If `GAME_GUIDE.md` and implementation differ, treat code as implementation truth and update the guide quickly.

### 5. Content canon and reference material

- `PROGRESSION_REFERENCE.md`
  - Canonical D2 naming/reference baseline for classes, skills, acts, zones, enemies, and bosses.
- `CARD_ECONOMY_SPEC.md`
  - Canonical working spec for shared reward-card structure, neutral/common cards, and town card inventory.
- `CLASS_REWARD_TIERS.md`
  - Canonical working spec for higher-tier class reward cards and card-family rank-up rules.
- `CLASS_CAPSTONES.md`
  - Canonical working spec for tier-3 class cards, boss-tier reward rules, and capstone nodes.
- `USER_SCENARIOS_AND_FEATURE_GUIDES.md`
  - Canonical feature onboarding and content-addition workflow reference.

### 6. Active delivery planning

- `SPRINT_2_BACKLOG.md`
  - Current active backlog and near-term execution order.
- `NEXT_SPRINT_PLAN.md`
  - Prior sprint planning context; use for continuity, not for current priority over `SPRINT_2_BACKLOG.md`.
- `DIABLO_INSPIRED_MIGRATION_PLAN.md`
  - Canonical migration roadmap from prototype theme to target D2-inspired game.

### 7. Supporting operational docs

- `BALANCE_GUIDE.md`
- `ASSET_PACKS.md`
- `ATTRIBUTION.md`

These are implementation support docs, not product-direction docs.

## Current Snapshot

### Product status

- Genre direction is stable: turn-based roguelite with deckbuilder combat.
- Theme direction is stable: Diablo II-inspired dark fantasy.
- Presentation is transitional: current UI still exposes retired prototype branding and reactor/steam/hull terminology.
- The repo contains both legacy prototype structures and migration-era systems at the same time.

### Current implementation snapshot

As of 2026-03-06, the repo contains:

- `31` test files under `tests/`
- `main.js` at `4017` lines, still acting as a large coordinator despite module extraction
- Current engine loop module in `engine-core.js`
- D2 seed data for:
  - `7` canonical classes
  - `5` acts
  - `5` act enemy-pool documents
- Implemented runtime class content for:
  - `7` playable canonical classes
  - `210` generated class skills
  - `210` generated class spell cards
- `242` cards in the current runtime card catalog (`32` global cards + `210` generated class cards)
- `92` generated enemy blueprints from D2 seed pools
- `7` artifacts
- `8` run gear items (`6` normal reward items + `2` quest-only relics)
- `5` reward-tree nodes
- `3` quest templates that generate seeded map contracts per run
- `4` meta upgrade paths

Documentation snapshot notes:

- `SPRINT_2_BACKLOG.md` reports `123/123` passing tests.
- `NEXT_SPRINT_PLAN.md` still reflects an earlier baseline (`68` passing, `20` cards, `12` enemies, `5` sectors).
- This means sprint planning documentation has advanced, but the older sprint plan should now be treated as historical context.
- Current quest implementation truth:
  - quests are generated from the current seeded stage-node route
  - active contracts target specific chest nodes, shrine nodes, or boss sectors
  - rewards currently include quest-only relic gear, stat points, and skill points
  - contracts can be completed or missed; they are not intended to all resolve every run

## Current Game Definition

The current playable game is best described as:

- a deterministic, browser-based, turn-based combat prototype
- with deckbuilder-style hand play, telegraphed enemy intents, and reward choices
- extended by run gear, seeded D2 class systems, class-card rewards, spell ranks, same-tree deck synergies, quests, reward-tree progression, save/resume, interludes, and seeded content scaffolding
- while still wrapped in retired prototype HUD and vocabulary

The target game is:

- a Diablo II-inspired roguelite/deckbuilder
- organized around Acts I-V, canonical zones, canonical bosses, and class-driven build identity
- with clear node routing, boss preparation, gear drops, objective-based meta progression, and stronger dark-fantasy presentation

## Current Player-Facing Loop

What exists now:

1. Start or restart a run.
2. Choose one of the `7` canonical seeded classes.
3. Begin with a shared base shell plus class starter cards from the selected class.
4. Fight deterministic encounters with visible telegraphs and reward choices.
5. Improve the run through cards, upgrades, artifacts, gear, class growth, seeded quests, reward-tree unlocks, class-card ranks, and same-tree deck synergies.
6. Use the quest panel to evaluate map-bound contracts:
   - chest contracts for quest-only relic gear
   - shrine contracts for extra stat points
   - boss contracts for extra skill points
   - each contract can be completed or missed based on its challenge condition
6. Persist state through save/resume and run records.

What the target flow should become:

1. Choose class and starter deck.
2. Progress through D2-inspired Acts and zones.
3. Resolve node sequences of `enemy`, `chest`, and `shrine`.
4. Prepare for act bosses with clear route and risk information.
5. Carry progress into persistent meta systems after win or failure.

## Core Systems Map

### Current runtime modules

Major runtime areas already exist for:

- engine control
- combat resolution
- run flow
- progression and progression content
- persistence and snapshots
- class content and class system
- gear system
- quest system
- reward tree
- encounter modifiers
- enemy UI and forecast/threat surfaces

### State model

The docs and code converge on four major state buckets:

- meta state
- run state
- combat state
- UI state

This is the right long-term model and should remain the organizing structure for future refactors.

### Current phase model vs target phase model

Current implementation in `engine-core.js`:

- `run_setup`
- `player`
- `enemy`
- `reward`
- `interlude`
- `run_victory`
- `gameover`
- `run_failed`

Target design in `GAME_ENGINE_FLOW_PLAN.md`:

- `run_setup`
- `character_select`
- `safe_zone`
- `world_map`
- `encounter`
- `reward`
- `act_transition`
- `run_complete`
- `run_failed`

Project implication:

- The engine loop is modularized, but the higher-level D2 run structure is not yet fully represented in phase naming or phase contracts.
- This is one of the clearest architecture gaps still open.

### Recommended phase architecture

The project should stop treating every combat turn step as a top-level app phase.

Recommended split:

- top-level engine phases should represent run-state changes
- combat turn sequencing should live inside `CombatState` as subphases
- UI overlays should not become phases unless they gate mutation

Recommended direction:

- top-level run phases:
  - `run_setup`
  - `character_select`
  - `safe_zone`
  - `world_map`
  - `encounter`
  - `reward`
  - `act_transition`
  - `run_complete`
  - `run_failed`
- combat subphases inside `CombatState`:
  - `combat_start`
  - `player_turn`
  - `enemy_telegraph`
  - `enemy_resolve`
  - `combat_cleanup`

Why this matters:

- it keeps the engine phase enum about run flow instead of turn timing
- it avoids proliferating one-off global phases for local combat behavior
- it gives `main.js` and UI logic a cleaner mutation contract

## Content Model

### Canonical source direction

The intended content model is data-first:

- `data/seeds/d2/classes.json`
- `data/seeds/d2/skills.json`
- `data/seeds/d2/zones.json`
- `data/seeds/d2/enemy-pools.json`
- `data/seeds/d2/assets-manifest.json`

This is the correct long-term direction and should remain the rule:

- new content in JSON first
- runtime normalization second
- hardcoded content only as temporary scaffolding

### Current implementation reality

The repo is partially there:

- canonical D2 seeds exist and are non-trivial
- runtime loaders and seeded progression generation exist
- some content is still hardcoded in runtime modules for the currently playable subset

Important distinction:

- D2 seed coverage is broader than the currently implemented playable runtime content
- seed data represents the content target space
- hardcoded runtime catalogs represent what is currently shipped/playable

## UX and Visual Direction

### Approved direction

The approved target visual direction is:

- dark-fantasy
- Diablo-inspired iconography and framing
- explicit front-door navigation
- stronger separation of `combat now` vs `build later`
- clearer support for run history, legacy progression, account, and admin surfaces

### Transitional reality

The current shell still shows:

- retired prototype title and copy
- hull / steam / heat terminology
- prototype-era combat HUD framing

This means the art and UI work is not just polish; it is part of core product identity migration.

### Working rule

Until the rename/theme migration is complete:

- preserve test-stable hooks and runtime behavior
- move visuals and terminology toward the high-fidelity Diablo II target incrementally
- avoid introducing new steampunk-specific language in fresh work

## Assets and Legal Rules

The asset policy is settled and should not drift:

- do not ship Blizzard-owned Diablo II assets directly
- use legal replacements for shipping content
- keep `shipping_safe` and `reference_only` asset use conceptually separate

Current supporting sources:

- Kenney packs for CC0 UI elements
- Game-icons for CC BY iconography
- curated Diablo-inspired icon sets in `assets/curated/themes/diablo-inspired`
- reference-only extraction/research material in `assets/diablo2_downloads`

Operational docs:

- `ASSET_PACKS.md`
- `ATTRIBUTION.md`

## Active Roadmap

### Near-term execution

Current active near-term work is defined by `SPRINT_2_BACKLOG.md`:

- new card mechanics
- deeper artifact pool
- more enemy variety
- reward UX improvements
- more route variety
- branch-style meta progression
- more extraction from `main.js`

### Migration roadmap

The larger product transition remains:

1. Visual foundation
2. Icon and art swap
3. Gear drop system
4. Objective/boss upgrade trees
5. Content pass and balance

Important note:

- pieces of phases `3` and `4` already exist in code (`gear-system.js`, `reward-tree.js`, `quest-system.js`)
- the migration plan should now be interpreted as partially implemented rather than untouched future work

## Component Task Tracks

This section turns high-level component goals into execution tracks. Start here when converting the master plan into actual work.

### Track 01: Game Loop Evolution

Status: `next up`

Goal:

- evolve the current combat-first prototype into a full run loop built around:
  - character selection
  - act safe zones
  - world-map traversal
  - encounter nodes
  - boss exits
  - per-act event content

#### Target v1 run loop

1. Player starts a new run.
2. Player selects a character from a D2-inspired selector screen.
3. Player spawns in the current act safe zone.
4. Player can visit vendors and then leave town through the act exit.
5. Player enters the act world map and repeatedly loops through `world_map -> encounter -> reward`.
6. Each act contains roughly `10-12` stage advances, with named zones acting as progression checkpoints.
7. Zones can contain multiple encounters, including multi-stage combat chains.
8. The world map collapses into a single boss exit for the act.
9. Boss reward resolves before transition to the next act.
8. Clearing the boss returns the player to the next act safe zone.
9. Repeat through the run.

#### Locked design decisions

These decisions are already chosen for this track and should be treated as implementation constraints unless intentionally revised.

- A full run spans Acts `I-V`.
- Top-level run phases are:
  - `run_setup`
  - `character_select`
  - `safe_zone`
  - `world_map`
  - `encounter`
  - `reward`
  - `act_transition`
  - `run_complete`
  - `run_failed`
- Within an act, the dominant loop is repeated `world_map -> encounter -> reward`.
- Initial playable class set is `Barbarian` and `Sorceress`.
- High D2 fidelity is the default interpretation for content structure, NPC roles, zones, bosses, and event beats.
- Character select should show:
  - portrait
  - full body presentation
  - starter deck preview
  - core stats
  - starting skill
  - difficulty tag
- Safe zones use a static scene with clickable hotspots, not free movement.
- Vendors use `gold` only in v1.
- Healing is a guaranteed town preparation action.
- Act I town hotspots are:
  - Akara
  - Charsi
  - Cain (quest-unlocked)
  - Kashya (mercenary service unlocked by Blood Raven quest)
  - no Gheed in v1
- Vendors can sell:
  - temporary buffs
  - potions
  - gear
  - cards
- Relics / artifacts are drop-only.
- Mercenaries are in scope.
- Each act is its own traversal tree and contains named zones as progression elements.
- Acts should contain `10-12` stage advances by default, based on D2 area-level pacing.
- Side-zone-style routing should emphasize player choice in a Slay the Spire-like map structure.
- Named zones are major checkpoints that can contain multiple encounters.
- Zones may contain up to `5` encounters in a multi-stage chain.
- No backtracking on world maps.
- Players should see:
  - current node
  - next reachable branches
  - a ghosted outline of the larger tree
- Vendors are town-only, not field nodes.
- `special_event` should remain placeholder scope for now.
- Every act ends in a boss.
- Each act should include `1-2` authored miniboss or special combat encounters in addition to the final boss.
- After boss clear, the player gets reward resolution first, then exits to the next act.
- Towns mostly share core services, with room for unique act-specific additions later.
- The initial class roster now follows canonical Diablo II naming.
- Mercenaries need their own panel, act after the player on each turn, target random enemies by default, and can carry equipment.
- Cards remain the dominant per-turn action surface.
- Consumables are still unresolved: they may become cards or remain a separate system.
- Class skill presentation relative to hand cards remains unresolved.
- Power split across deck/class tree/gear/meta remains unresolved.
- Act I should include the following signature content:
  - Den of Evil
  - Blood Raven
  - Cain rescue / Tristram
  - Countess-style cursed tower
  - Andariel approach and boss finish

#### Suggested D2 progression-tree compression by act

These are recommended structure defaults based on canonical D2 mainline vs side content. They should be treated as the baseline for progression-tree implementation unless replaced by a more specific act spec.

##### Act I

- Mandatory backbone:
  - Rogue Encampment
  - Blood Moor
  - Cold Plains
  - Stony Field
  - Underground Passage
  - Dark Wood
  - Black Marsh
  - Tamoe Highland
  - Monastery Gate / Outer Cloister
  - Barracks / Jail
  - Cathedral / Catacombs
  - Andariel
- Optional or branchable content:
  - Den of Evil
  - Burial Grounds / Blood Raven
  - Tristram / Cain rescue
  - Countess-style tower branch

##### Act II

- Mandatory backbone:
  - Lut Gholein
  - Rocky Waste
  - Dry Hills / Halls of the Dead
  - Far Oasis / Maggot Lair
  - Lost City / Valley of Snakes
  - Harem / Palace Cellar
  - Arcane Sanctuary
  - Canyon of the Magi
  - Tal Rasha's Tomb
  - Tal Rasha's Chamber / Duriel
- Optional or branchable content:
  - Sewers / Radament-style branch
  - alternate act-middle routing emphasis between Dry Hills, Far Oasis, and Lost City

##### Act III

- Mandatory backbone:
  - Kurast Docks
  - Spider Forest
  - Flayer Jungle
  - Lower Kurast
  - Kurast Bazaar
  - Upper Kurast
  - Kurast Causeway
  - Travincal
  - Durance of Hate
  - Mephisto
- Optional or branchable content:
  - Spider Cavern
  - Great Marsh
  - Flayer Dungeon
  - Sewers

##### Act IV

- Mandatory backbone:
  - Pandemonium Fortress
  - Outer Steppes
  - Plains of Despair
  - City of the Damned
  - River of Flame
  - Chaos Sanctuary
  - Diablo
- Optional or branchable content:
  - Izual-style branch content inside Plains of Despair
  - Hellforge-style branch content inside River of Flame
- Compression note:
  - Act IV is canonically shorter, so stage count should be extended through multi-encounter zones and authored combat beats rather than by inventing many extra locations.

##### Act V

- Mandatory backbone:
  - Harrogath
  - Bloody Foothills
  - Frigid Highlands
  - Arreat Plateau
  - Crystalline Passage
  - Glacial Trail
  - Frozen Tundra
  - Ancients' Way
  - Arreat Summit
  - Worldstone Keep
  - Throne of Destruction
  - Worldstone Chamber / Baal
- Optional or branchable content:
  - Nihlathak temple chain
  - Frozen River
  - Drifter Cavern
  - Abaddon
  - Pit of Acheron
  - Infernal Pit
  - Icy Cellar

##### Progression-tree rule

- Mandatory backbone zones should define the act spine.
- Optional zones should enter as player-choice branches, miniboss branches, or quest branches.
- Short acts should hit target stage count by deepening encounter chains inside mandatory zones, not by inventing non-canonical map flow.

#### Proposed top-level phase flow for this track

- `run_setup`
- `character_select`
- `safe_zone`
- `world_map`
- `encounter`
- `reward`
- `act_transition`
- `run_complete`
- `run_failed`

This is the recommended direction for the run loop, even if runtime implementation migrates there incrementally.

#### Epic 01: Character Select Experience

Objective:

- replace direct run start with a class-pick surface that captures the iconic Diablo II character-select vibe.

Tasks:

1. Define the character-select UX contract:
   - selectable class roster for v1
   - focus/hover/select states
   - class summary content
   - confirm/start-run action
2. Define the visual treatment for a D2-inspired selector:
   - character portraits or stand-ins
   - background environment
   - class nameplate treatment
   - ambient UI framing
3. Define the data contract for selector content:
   - class ID
   - display name
   - summary text
   - portrait/icon reference
   - starter loadout references
4. Wire run start to selected class state rather than immediate default-run bootstrap.
5. Add acceptance tests for:
   - class can be selected
   - selected class persists into run start
   - invalid/missing class falls back safely

Done when:

- a run always begins with explicit character selection
- the selected class is visible and correct when entering Act I

#### Epic 02: Safe Zone / Town Framework

Objective:

- establish a reusable act-town structure that functions as the player’s preparation hub.

Tasks:

1. Define the safe-zone data model:
   - act ID
   - town ID/name
   - background/view type
   - vendor slots
   - exit definitions
   - town event hooks
2. Define town interaction rules:
   - what the player can do in town
   - what is blocked in town
   - whether town is free navigation or menu-based interaction over a static scene
3. Implement a top-down-safe-zone view placeholder suitable for early production.
4. Add support for reusable vendor icons and interactive hotspots.
5. Define town exit behavior into the world-map flow.
6. Add test coverage for:
   - entering town after act transition
   - opening vendor interactions
   - leaving town to the world map

Done when:

- each act can load into a safe-zone state with vendors and a clear world exit

#### Epic 03: Act I Rogue Encampment v1

Objective:

- implement the first concrete safe zone using Rogue Encampment as the model.

Tasks:

1. Create the Act I Rogue Encampment scene shell.
2. Add `2-3` vendor interaction points using placeholder icons and labels.
3. Add the town exit that leads to Blood Moor.
4. Define the initial vendor mix for v1:
   - healing / supplies
   - gear / repair / trade
   - information / identify / mercenary unlock support
5. Decide what is purchasable in v1:
   - cards
   - gear
   - potions
   - temporary buffs
6. Add onboarding copy for:
   - where the player is
   - what vendors do
   - how to leave town

Done when:

- a player can pick a class, enter Rogue Encampment, visit vendors, and leave for Blood Moor

#### Epic 04: World Map Tree Generator

Objective:

- replace the current linear-ish route feel with a real branching world-zone tree.

Tasks:

1. Define the world-map graph contract:
   - map ID
   - act ID
   - entrance node
   - branching node graph
   - exit node
   - boss node
2. Implement a generator with these structural rules:
   - starts at width `1`
   - fans out gradually
   - max width `6`
   - collapses back to `1` exit path
   - ends in boss fight
3. Define path-count rules per depth so map generation is readable and not noisy.
4. Enforce one-way forward traversal with no backtracking.
5. Make named zones function as major checkpoints that can contain multiple encounter nodes.
6. Add a world-map UI representation that clearly shows:
   - current node
   - reachable next nodes
   - locked/unavailable branches
   - boss destination
   - ghosted tree outline
7. Add tests for:
   - graph validity
   - no dead-end soft locks
   - width cap respected
   - boss exit always reachable

Done when:

- each generated world map has a readable branch structure from entrance to boss exit

#### Epic 05: Encounter Node System

Objective:

- formalize node resolution as the heart of moment-to-moment run traversal.

Tasks:

1. Define the node-type contract for:
   - `battle`
   - `special_event`
   - `boss`
   - `miniboss`
2. Define what data every node needs:
   - node ID
   - type
   - difficulty or tier
   - content payload
   - rewards
   - completion state
3. Build a node resolver that routes the player into the correct interaction surface by type.
4. Define post-node return behavior:
   - when player returns to map
   - when rewards happen immediately
   - when state transitions to town or act transition
5. Add boss-node rules:
   - always terminal for that map
   - always routes into act progression on clear
6. Add miniboss rules:
   - appears `1-2` times per act
   - is authored, not random
   - behaves as a high-threat encounter, not a map-ending boss
7. Add zone-chain rules:
   - zones may contain multiple sequential encounters
   - a large zone may contain up to `5` encounters
8. Add tests for each node type and transition.

Done when:

- moving through the world map consistently resolves node content and returns to the correct next state

#### Epic 06: Vendor System Integration

Objective:

- make vendors part of the run loop, not just decorative town markers.

Tasks:

1. Define vendor archetypes for v1.
2. Define each vendor’s inventory and pricing rules.
3. Implement vendor interaction UI with buy / inspect / leave flows.
4. Define stock refresh rules:
   - static per act
   - per visit
   - per run seed
5. Define which currencies/resources vendors use.
6. Add tests for:
   - purchases
   - insufficient funds
   - stock persistence or refresh behavior

Done when:

- vendor interactions meaningfully affect run preparation and traversal decisions

#### Epic 07: Special Event Framework

Objective:

- support authored act-specific events as a distinct node type.

Status note:

- placeholder only for now; do not front-load implementation ahead of character select, town, world map, combat routing, and boss progression.

Tasks:

1. Define the special-event data schema:
   - event ID
   - act
   - trigger conditions
   - text payload
   - choice set
   - outcomes
2. Define event outcome types:
   - resource gain/loss
   - card changes
   - gear or vendor access
   - temporary buffs/debuffs
   - route changes
3. Build the event resolver and choice UI.
4. Add fallback handling for incomplete or invalid event data.
5. Add test coverage for deterministic event resolution.

Done when:

- the game can present authored events as first-class node content

#### Epic 08: Per-Act Key Event Catalog

Objective:

- define the signature event set for each act so acts feel distinct beyond art and enemies.

Tasks:

1. Create a key-event list for each act.
2. For each act, classify events by role:
   - flavor
   - economy
   - risk/reward
   - narrative beat
   - boss preparation
3. Write Act I key events first as the template set.
   - `Den of Evil`
   - `Blood Raven`
   - `Cain Rescue / Tristram`
   - `Cursed Tower / Countess-style encounter`
   - `Andariel approach`
4. Define minimum event counts per act for v1.
5. Decide which events are mandatory, weighted, or rare.
6. Link events to town/world/boss context where relevant.

Done when:

- every act has a defined event identity, even if only Act I is fully implemented first

#### Epic 09: Run-Flow State Migration

Objective:

- align the actual runtime with the new run loop instead of layering new screens on top of the old phase model.

Tasks:

1. Add missing top-level run phases required for this track.
2. Migrate current start-run flow into:
   - character select
   - safe zone
   - world map
   - encounter
3. Collapse current combat-turn phases into combat subphases under the encounter/combat state model.
4. Define transition rules for:
   - town to world
   - world to node
   - node to reward
   - boss clear to act transition
5. Update tests and debug helpers for the new phase model.

Done when:

- the runtime phase model matches the documented run loop closely enough that future content can build on it cleanly

#### Suggested execution order

1. Epic 09: Run-flow state migration contract
2. Epic 01: Character select experience
3. Epic 02: Safe zone / town framework
4. Epic 03: Act I Rogue Encampment v1
5. Epic 04: World map tree generator
6. Epic 05: Encounter node system
7. Epic 06: Vendor system integration
8. Epic 07: Special event framework
9. Epic 08: Per-act key event catalog

#### Immediate design decisions still needed for this track

Before implementation accelerates, lock these:

1. Exact stage-count targets by act beyond the current `10-12+` direction.
2. What additional town prep actions exist beyond the heal / vendor / mercenary baseline.
3. How class skills are surfaced relative to the hand.
4. Whether consumables become cards or remain a separate item system.
5. Rough power split across deck shaping, class tree, gear, and meta progression.

#### Suggested build-grammar defaults (pending approval)

These are proposed defaults for unresolved deckbuilder-vs-roguelite questions.

1. Class skills vs hand:
   - use a hybrid model
   - keep `1` signature active skill available from the start on a fixed skill bar
   - unlock additional equippable skill slots later (`2-3` total over the run)
   - keep passive tree effects in the class tree
   - let class-themed reward cards express the broader tree family inside the deck
2. Consumables:
   - keep core consumables off-deck in a separate inventory/quick-use system
   - potions should not dilute the draw pile
   - later tactical consumables such as scrolls, bombs, or charms can create temporary cards if needed
3. Power split:
   - target roughly `40%` deck shaping
   - `30%` class tree / skills
   - `20%` gear + mercenary loadout
   - `10%` meta progression
4. Design principle:
   - deckbuilder systems should decide combat turns
   - roguelite systems should decide route, loot access, scarcity, and long-term progression
   - no roguelite layer should be allowed to make the hand feel secondary
5. Upgrade-path recommendation:
   - in-run upgrade paths should be the class's canonical D2 trees
   - account-level `Legacy` paths should remain separate and mostly economy/survivability/mercenary focused
6. Skill recommendation:
   - signature actives live on a fixed skill bar
   - broader class expression lives in the deck
   - passives remain in trees and gear

#### Current working class-progression spec

Use `CLASS_DECKBUILDER_PROGRESSION.md` as the current working contract for first-playable class combat kits.

It now defines:

- exact `Barbarian` and `Sorceress` starting decks
- exact starting skill-bar actives
- the tier-1 class reward-pool contract
- exact tier-1 reward cards for each starting class tree
- early skill unlock candidates by tree

Working reward-pool assumptions from that spec:

- standard card rewards should present `3` options
- default shape is `1` neutral/starter-shell upgrade and `2` class reward-pool options
- only tier-1 class cards are eligible at run start
- spending a skill point should bias future class-card offers toward invested trees
- class-card rewards and skill unlocks should remain separate systems

Related shared-economy spec:

- `CARD_ECONOMY_SPEC.md` now defines:
  - exact neutral/common reward cards
  - town vendor card-sale rules
  - Act I vendor card roles for Akara and Charsi
  - non-card service rules for Cain and Kashya
  - vendor card price bands and refresh rules

Related class reward-tier spec:

- `CLASS_REWARD_TIERS.md` now defines:
  - tier-2 unlock rules by class tree
  - duplicate-to-rank-up behavior for card families
  - exact rank I-III text for tier-2 Barbarian cards
  - exact rank I-III text for tier-2 Sorceress cards
  - reward-weighting guidance for single-tree and hybrid builds

Related capstone spec:

- `CLASS_CAPSTONES.md` now defines:
  - tier-3 unlock rules by tree
  - boss-tier capstone reward gating
  - exact tier-3 `Barbarian` and `Sorceress` cards
  - exact capstone nodes for each starting class tree
  - late-run guidance for focused vs hybrid builds

#### Suggested reward-economy defaults (pending approval)

These are proposed defaults for unresolved reward questions.

1. Reward-source matrix:
   - `battle`: XP, gold, potion chance, low-weight gear/card chance
   - `miniboss`: XP, gold, guaranteed reward choice (`gear` or `card`), higher potion chance
   - `boss`: large XP/gold burst, guaranteed premium reward choice, act transition
   - `town vendors`: spend gold on potions, temporary buffs, gear, and cards
   - `special_event`: future conditional outcomes only
2. Reward floors:
   - every `battle` should always grant XP + gold
   - every `miniboss` should always grant XP + gold + one meaningful reward choice
   - every `boss` should always grant XP + gold + one premium reward choice before act transition
   - every town should always offer at least one useful buff/service, one consumable option, and one progression-shopping option
3. Rarity, weights, and duplicate protection:
   - artifacts/relics: hard unique within a run
   - gear: weighted by act and rarity, with soft bias toward unseen items
   - cards: soft duplicate protection within a reward screen, but duplicates allowed across the run where rank-up or deck copies are meaningful
   - bosses and minibosses should skew toward unseen or underrepresented rewards

## Main Gaps To Track

These are the highest-value project gaps revealed by the documentation review.

### 1. Naming and theme mismatch

- Code and UI still present the game with retired prototype branding
- Product direction and new systems are D2-inspired
- This creates confusion in docs, UX, and implementation priorities

### 2. Current engine phases do not yet match the intended D2 run structure

- The low-level engine exists
- The higher-level run phase taxonomy still needs to be migrated

### 3. Seed content breadth exceeds shipped runtime depth

- Seeds cover the full canonical D2 reference space
- Playable runtime content currently implements only a subset

### 4. `main.js` remains oversized

- Modularization has clearly progressed
- Coordination, action wiring, and UI ownership are still too concentrated

### 5. Visual/navigation product shell is underdefined in implementation

- `VISUAL_DESIGN_TRD.md` is strong
- the runtime UI has not yet caught up to that target surface model

## Underdesigned Areas

These are not just missing tasks. These are areas where the project still lacks enough design decisions to implement confidently without rework.

### P0 decision debt

#### 1. Product naming and vocabulary

Why it is underdesigned:

- the target fantasy direction is clear, but the player-facing lexicon is not locked
- the runtime still mixes dark-fantasy systems with reactor/steam/hull terminology
- there is no glossary defining canonical words for resources, failure states, menus, and progression surfaces

Decisions still needed:

- final product name or stable working title
- whether combat resources remain mechanical abstractions or become fully in-world terms
- canonical labels for `Legacy`, classes, run rewards, failure/victory states, and onboarding copy

Why this is P0:

- naming drift creates UI churn, tutorial churn, and inconsistent content authoring

#### 2. Phase model and run-state taxonomy

Why it is underdesigned:

- the current runtime phase enum is combat-turn oriented
- the target design is route/node oriented
- there is no single written contract separating top-level run phases from combat subphases

Decisions still needed:

- which states belong in the engine phase enum
- which states belong only inside `CombatState`
- how current `player`, `enemy`, `interlude`, `run_victory`, and `gameover` map into the target model

Why this is P0:

- phase ambiguity leaks into `main.js`, UI gating, tests, and future content systems

#### 3. Player build grammar

Why it is underdesigned:

- the project now contains cards, class skills, stats, gear, artifacts, quests, reward-tree bonuses, and meta upgrades
- the docs do not fully specify which layer is primary, which layers are passive, and how many active decision surfaces the player should manage mid-run

Decisions still needed:

- whether cards remain the dominant per-turn action surface in all classes
- how class skills are surfaced relative to hand cards
- whether consumables and mercenary actions compete for the same decision bandwidth
- how much build power should come from deck shaping vs class tree vs gear vs meta

Why this is P0:

- without a build grammar, new content adds complexity faster than clarity

#### 4. Reward economy contract

Why it is underdesigned:

- reward sources now include cards, artifacts, gear, upgrade paths, XP, gold, potions, skill points, stat points, quests, and reward-tree unlocks
- the docs describe pieces of this, but not one end-to-end contract for reward cadence and source ownership

Decisions still needed:

- which node types can grant which reward categories
- what reward floors exist for battle nodes, minibosses, bosses, town vendors, and future special events
- how rarity, weight, and duplicate protection should work across the whole run

Why this is P0:

- reward ambiguity breaks pacing faster than content scarcity does

#### 5. Meta progression stack

Why it is underdesigned:

- `upgradePaths`, reward-tree unlocks, quests, and the planned `Legacy` hub all touch long-term progression
- their boundaries are not yet cleanly defined

Decisions still needed:

- which systems are run-scoped vs account-scoped
- which systems unlock power vs provide goals vs provide currency
- whether quests are run contracts, account objectives, or both

Why this is P0:

- overlapping progression systems create redundancy, unclear motivation, and persistence complexity

### P1 decision debt

#### 6. Act compression and route structure

Why it is underdesigned:

- D2 canon gives a large zone list, but the intended run length and compression ratio per act are still fuzzy
- the docs say Acts I-V and canonical zones, but do not yet define the practical playable abstraction

Decisions still needed:

- how many playable stages each act should contain
- how side zones enter the route
- whether acts are always sequential in one run or can be shortened/branched for variant modes

#### 7. Safe-zone, event, and mercenary loop

Why it is underdesigned:

- interludes exist in the current game
- safe zones and mercenary hiring are now part of the target run loop
- the exact relationship between town services, event beats, and mercenary management is not fixed

Decisions still needed:

- what remains a temporary `interlude` compatibility concept vs what becomes a real safe-zone or event surface
- what preparation actions are legal in each act town
- whether mercenary management is a dedicated town service, a separate panel, or a special reward-like interaction

#### 8. Front-door information architecture

Why it is underdesigned:

- `VISUAL_DESIGN_TRD.md` defines strong UI targets
- the product-level decisions around guest mode, account scope, admin visibility, and navigation depth are still incomplete

Decisions still needed:

- whether guest play remains first-class
- what data is local-only vs account-bound
- whether admin is a real near-term product surface or a deferred operational tool

#### 9. Failure loop and run-summary contract

Why it is underdesigned:

- the scenarios call for quick learning and restart
- the exact contents of failure summaries, carry-forward rewards, and restart shortcuts are not fully specified

Decisions still needed:

- what a loss screen must explain
- what progression is granted on failure vs victory
- what build recap is necessary to make retry decisions actionable

#### 10. Narrative and quest model

Why it is underdesigned:

- there is already a systemic quest-contract runtime, but narrative framing is still thin
- the project has not fully chosen how literal its high-fidelity Diablo II story adaptation should be

Current implementation truth:

- quests are seeded run contracts, not authored story beats
- the current shipped contract set targets:
  - one chest node
  - one shrine node
  - one boss sector
- those contracts currently reward:
  - quest-only relic gear
  - stat points
  - skill points
- contracts can be missed and should not all be expected to complete every run

Decisions still needed:

- whether authored fiction should wrap the existing systemic contract model or replace part of it
- how bosses, acts, safe zones, and special events are narrated
- how much written flavor is needed for rewards, interludes, and progression hubs

## Practical Rules Going Forward

When adding or updating work in this repo:

1. Update this master doc when project status, priorities, or source-of-truth rules change.
2. Add content through D2 seed JSON first whenever feasible.
3. Treat `VISUAL_DESIGN_TRD.md` as the target for UI work, not `MVP_ART_SPEC.md`.
4. Treat `SPRINT_2_BACKLOG.md` as the current execution queue unless explicitly replaced.
5. Treat `PROGRESSION_REFERENCE.md` as naming canon for high-fidelity Diablo II content.
6. Do not introduce new shipping dependencies on Blizzard-owned assets.
7. Do not use `Brassline` / `Last Reactor` in new docs except when referring to retired prototype history or technical runtime namespaces.
8. Prefer extracting logic out of `main.js` instead of adding new domains directly into it.

## Document Map

Use this section as the quick index for the repo docs.

| Document | Role |
|---|---|
| `PROJECT_MASTER.md` | Project overview, source-of-truth map, status snapshot |
| `GAME_ENGINE_FLOW_PLAN.md` | Target gameplay architecture and D2 run structure |
| `CORE_ENGINE_LOOP.md` | Current engine implementation contract |
| `VISUAL_DESIGN_TRD.md` | Target UI/UX implementation plan |
| `USER_SCENARIOS_AND_FEATURE_GUIDES.md` | Player scenarios and content workflow guides |
| `CLASS_DECKBUILDER_PROGRESSION.md` | Supporting class/deck progression concept |
| `PROGRESSION_REFERENCE.md` | Canon D2 reference baseline |
| `DIABLO_INSPIRED_MIGRATION_PLAN.md` | Theme/content migration roadmap |
| `SPRINT_2_BACKLOG.md` | Current active backlog |
| `NEXT_SPRINT_PLAN.md` | Prior planning baseline |
| `BALANCE_GUIDE.md` | Runtime tuning guide |
| `ASSET_PACKS.md` | Asset acquisition workflow |
| `ATTRIBUTION.md` | Licensing and credits |
| `MVP_ART_SPEC.md` | Historical prototype art spec |

## Recommended Next Cleanup Pass

The next documentation cleanup should do three things:

1. Add a short pointer from the repo root or README to this master doc.
2. Mark `MVP_ART_SPEC.md` and `NEXT_SPRINT_PLAN.md` explicitly as historical/reference docs.
3. Convert the current phase model from mixed combat/run states into the documented run-phase plus combat-subphase split.
