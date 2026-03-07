# Agent 2

## Mission

Own Rouge's progression, economy, and account backbone.

Your job is not to add one more progression knob. Your job is to turn the current run-growth scaffold into the durable system spine that powers class growth, item growth, loot replacement pressure, profile persistence, and future meta unlocks.

This is a large vertical slice:

- class progression
- attribute and class spending
- rewards integration
- item, rune, and runeword depth
- vendor and stash economy
- profile persistence and account-level meta hooks

## Own These Areas

- `src/run/*`
- `src/rewards/*`
- `src/items/*`
- `src/state/*`
- `src/character/*`
- progression-facing shared types in `src/types/game.d.ts`
- progression-facing parts of `tests/app-engine.test.ts`

## Do Not Own

- shell layout or presentation beyond minimal integration coverage
- encounter-local combat rules
- world-node catalog authoring
- content validation policy unrelated to progression or economy data

## Product Goal

Ship the full build-growth backbone for the game.

When this slice lands, Rouge should have a coherent answer for:

- how a class grows during a run
- how a build changes through rewards and town choices
- how items and runes replace each other across acts
- how profile data survives across sessions
- where future unlocks and tutorials will live at the account layer

## Current Baseline

Live now:

- `skills.json` is already loaded and used for class-progression catalog wiring
- class-point and attribute-point spending already exist in town
- rewards already grant cards, upgrades, boons, items, runes, and progression points
- itemization already supports inventory, stash, sockets, runes, runewords, vendor buying, selling, and refresh
- profile persistence already stores active runs, stash, run history, settings, preferred class, and progression summaries

Still weak:

- class progression still needs to feel like a full build system instead of a basic tree-unlock scaffold
- profile meta shape exists, but account unlocks and tutorial-state ownership are not yet real systems
- late-run loot replacement pressure and item curation still need much deeper tuning
- vendor and stash flows exist, but the broader economy still needs stronger long-horizon rules
- reward curation needs stronger late-act and boss inflection points

## Chunk 1: Class Progression Spine

Turn the current class progression scaffold into a durable build system.

This includes:

- hardening the `skills.json` runtime seam
- making class spend, attribute spend, and progression summaries feel complete
- ensuring class progression has clean derived outputs for combat and shell consumers
- keeping class growth compatible with rewards, town services, persistence, and saved-run restore

Expectations:

- keep formulas and spend mutation in domain modules
- keep combat consuming derived values rather than becoming the owner of progression
- make type changes explicit and stable

## Chunk 2: Economy, Loot Pressure, And Itemization Depth

Turn the current item and rune layer into a real multi-act build economy.

This includes:

- expanding curated item, rune, and runeword breadth
- improving replacement tension so later acts force real loadout decisions
- tuning vendor inventory, refresh pressure, and sell or stash loops
- tightening reward and town integration around equipment and rune growth

Expectations:

- keep economy logic out of shell code
- preserve deterministic reward mutation through domain APIs
- keep inventory and stash contracts stable for the shell and persistence layers

## Chunk 3: Account Persistence And Meta Hooks

Turn the current profile scaffold into the backbone for account-level progression.

This includes:

- durable schema support for profile evolution
- explicit ownership for unlock data
- explicit ownership for tutorial-state data
- stronger progression summaries and account-facing data APIs
- migration coverage for older snapshots as the profile shape grows

Expectations:

- do not break active-run restore
- keep schema versioning clean
- leave Agent 1 a stable read surface for account hall and onboarding UI

## Chunk 4: Reward And Town Integration

Make the progression backbone the real owner of run growth.

This includes:

- ensuring rewards, town actions, vendors, stash flows, and class spends all move through one coherent progression model
- making boss and late-act rewards feel like build pivots
- ensuring progression changes round-trip through run snapshots and profile saves cleanly

Expectations:

- no one-off mutation paths hiding in UI or content files
- reward summaries and town summaries should reflect the same underlying data model

## Deliverables

- a stronger class progression system with stable runtime contracts
- deeper item, rune, runeword, and vendor economy breadth
- real account-level unlock and tutorial-state ownership seams
- stronger profile persistence and migration coverage
- reward and town integration around the deeper progression backbone
- regression coverage for progression, economy, and persistence round-trips
- doc sync if progression ownership or profile contracts change

## Collaboration Notes

- coordinate with Agent 1 on the minimum summary APIs needed for front-door, town, and run-end surfaces
- coordinate with Agent 3 when quest, shrine, event, opportunity, or encounter outcomes need new economy or progression effects
- call out any `src/types/game.d.ts` changes before merge and let the project manager sequence them if multiple agents are touching shared contracts

## Acceptance Criteria

- class progression feels like a real build-growth backbone rather than a thin unlock scaffold
- account-level unlock and tutorial-state ownership exists as a stable runtime seam
- item, rune, runeword, vendor, stash, and reward systems behave like one economy rather than isolated features
- profile persistence survives the expanded meta shape through clean migrations
- combat still consumes derived values rather than owning progression logic
- `npm run check` passes

## Pickup Prompt

Build Rouge's progression and account backbone. Harden the class progression system, deepen the multi-act item or rune or runeword economy, turn the current profile scaffold into the home for unlock and tutorial-state ownership, and make rewards and town services operate through one coherent build-growth model. Keep mutation in run, rewards, items, character, and state modules, keep combat deterministic, and expose stable summary APIs for the shell.
