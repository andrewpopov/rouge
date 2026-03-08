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
- progression-facing parts of `tests/app-engine*.test.ts`

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
- profile persistence already stores active runs, stash, run history, settings, preferred class, progression summaries, unlock ownership, tutorial ownership, and migration coverage

Still weak:

- class progression still needs to feel like a full build system instead of a basic tree-unlock scaffold
- account unlock and tutorial ownership now include prerequisite-aware archive or economy or mastery progression trees, focused-tree APIs, later-tier gates like `heroic_annals`, `mythic_annals`, `eternal_annals`, `artisan_stock`, `brokerage_charter`, `treasury_exchange`, `war_college`, `paragon_doctrine`, and `apex_doctrine`, richer archived run summaries, and shell-level focus review or control surfaces, but broader cross-tree identity and broader account-review depth still need to be built
- late-run loot replacement pressure and item curation now include profile-aware reward-side replacement pivots and late-act premium trade leverage, but still need more authored breadth and tuning beyond the current higher-tier loot band
- vendor and stash flows now speak the account feature language for stock, rune routing, refresh pressure, pricing, archive retention, stash planning, direct `treasury_exchange` consignment, and account-review summaries, but the broader economy still needs stronger long-horizon sinks and stronger stash or archive planning value
- reward curation now has account-tree-driven encounter payouts, boss pivots, and apex mastery inflection points, but it still needs broader late-act authored variety and deeper feature-gated inflection points

## Completion Notes (2026-03-08)

The current Agent 2 slice is live for the runtime backbone and the account-facing shell seams it owns.

Completed work:

- class progression now clamps tree investment, keeps favored-tree state valid, exposes stable progression summaries, and hands derived bonuses to combat or shell consumers
- rewards, town spends, vendors, stash flow, restore, and run archival now all round-trip through the same progression or account model
- item, rune, and runeword breadth plus late-act vendor curation are live, with a higher tier-7 or tier-8 loot band, socket-ready late-game bases, stronger progression-tier targeting, profile-aware reward-side equipment curation, and boss build-pivot pressure
- profile persistence now owns explicit account milestone unlock rules, mutable settings or tutorial APIs, migration coverage, and account-facing summary APIs
- profile persistence now also owns broader account progression trees, focused-tree control APIs, and richer account-summary contracts built on the same profile seam
- account milestones now materially affect town economy rules, including starting vendor depth, refresh pricing, buy or sell pricing, and rune routing for unfinished runewords
- account milestones now also affect reward generation, including encounter gold payouts, reward-side gold bonuses, stronger boss progression pivots, and economy-gated late-act replacement curation for equipment rewards
- new account-tree feature gates are live, including `chronicle_vault`, `heroic_annals`, and `mythic_annals` for deeper archive retention, `salvage_tithes`, `artisan_stock`, and `brokerage_charter` for stronger long-horizon economy pressure plus later-tier vendor curation, and `training_grounds`, `war_college`, plus `paragon_doctrine` for stronger mastery-side reward pivots
- the current account-tree pass now also has prerequisite-aware capstones, with `eternal_annals` deepening archive retention and comparison-grade archive review, `treasury_exchange` deepening late-act vendor leverage and stash-planning value, and `apex_doctrine` hardening apex boss-progression pivots
- `treasury_exchange` now also provides a live town sink by consigning vendor offers directly into profile stash, with explicit consignment-fee previews and stash-planning pressure surfaced through town summaries
- vendor rune routing now inspects both carried loadout state and stash-planned bases when `runeword_codex` and `treasury_exchange` are live, so unfinished runewords in stash can influence targeted rune offers
- profile meta now also owns weapon or armor runeword planning charters, with app-engine mutation seams, front-door planning controls, and stable account-summary read models instead of shell-owned planning state
- vendor consignment previews, vendor equipment or rune routing, and reward-side equipment pivots now all read those planning charters so long-horizon runeword targets materially affect town and late-act reward behavior
- archived run history now also records planned weapon or armor runewords plus which charter targets were actually fulfilled on that expedition, so planning is preserved as account history instead of a temporary current-profile toggle
- account planning summaries now expose archive-backed charter ledgers, including archived or fulfilled counts and best-act records for the current weapon or armor targets, and town or reward behavior now reacts more strongly while a charter is still unfulfilled across the account
- focused account trees now bias live runtime behavior, including archive retention, vendor pressure, and mastery-side boss rewards
- archived run history now stores richer progression or economy snapshots, favored-tree carry-through, active runewords, loadout-tier or socket state, stash-planning state, and newly unlocked account-feature deltas
- account-facing read models now include richer stash, archive, and capstone-review summaries so shell consumers can stay off raw profile internals
- front door, safe zone, and run-end shell surfaces now read the live unlock, tutorial, and account-summary seams instead of reserving that space as a future placeholder
- front door, safe zone, and run-end shell surfaces now also expose focused-tree review and live account-focus controls through the existing shell action path
- front door now also exposes live profile-settings toggles plus tutorial complete or dismiss or restore controls through the existing account mutation path
- front door now also exposes direct preferred-class controls, and character select now honors explicit preferred class over recent class while still following recent history when the account preference has not diverged
- front door now also exposes an interactive archive-review desk over richer archived run summaries, with latest or older or newer navigation routed through app-engine instead of a shell-owned persistence layer
- regression coverage exists for migration backfill, capped progression investment, archived profile meta, account-tree or settings or tutorial or preferred-class or archive-review mutation behavior, later-tier archive or economy or mastery gate behavior, capstone gating or read-model behavior, reward-side milestone behavior, late-act economy or replacement-pivot behavior, and account-surface rendering
- `npm run check` currently passes against this slice, with compiled tests `157/157`

Still open-ended:

- broader unlock rules, further progression-tree breadth beyond the current archive or economy or mastery trees plus `heroic_annals` or `mythic_annals` or `eternal_annals`, `artisan_stock` or `brokerage_charter` or `treasury_exchange`, and `war_college` or `paragon_doctrine` or `apex_doctrine`, and broader account UX beyond the current focused-tree review controls, archive-review desk, shell summaries, current runeword-planning desk, and current charter-ledger review
- deeper authored loot breadth, broader feature-gated reward variety, and longer-horizon economy tuning
- broader future meta loops built on the current account seams and richer archive data plus stash or archive review models

## Immediate Next Batch

Build the next long-horizon economy and planning pass on top of the systems that are already live:

- deepen the account model that sits behind the live preferred-class or settings or tutorial or focused-tree or planning mutation APIs instead of rebuilding those APIs
- deepen Act IV-V item, rune, runeword, vendor, and boss-reward pressure so later acts force real replacement decisions instead of simple linear upgrades
- turn the current stash, archive, vendor, and reward seams into stronger long-horizon planning systems with better economy sinks built on the existing ownership seams and current read models
- broaden future tree growth past the current capstone pass without fragmenting the profile seam or pushing logic into shell consumers

This batch should materially improve the durability of the whole game spine, not just add more values to store.

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

1. late-act economy and replacement-pressure pass
- deepen Acts IV-V item, rune, runeword, reward, and vendor pressure through `src/items/*`, `src/rewards/*`, and `src/run/*`
- make the player choose between replacement, stash planning, and economy sinks instead of only taking obvious upgrades

2. long-horizon planning and sink pass
- build stronger stash, archive, and vendor planning value on top of the current capstones and account read models
- deepen the account model behind the existing preferred-class or settings or tutorial or focus or planning APIs instead of replacing those seams

3. integration and regression pass
- ensure reward, town, stash, restore, and archive flows all agree on the same progression model
- extend `tests/app-engine-progression.test.ts`, `tests/app-engine.test.ts`, and any affected domain tests to cover the new capstones and economy behavior

## Chunk 1: Account Tree Capstones And Feature Gates

Turn the current archive or economy or mastery trees into a broader account progression layer.

This includes:

- adding later-tier archive or economy or mastery nodes beyond the current later-tier pass
- introducing clearer prerequisites or tier groupings so future node growth stays understandable
- exposing stronger account-review summaries that reflect those nodes cleanly
- defining capstone-style nodes or bundles that materially change archive, economy, or mastery behavior without fragmenting the profile model
- keeping the new feature gates grounded in existing reward, town, archive, and profile seams
- making future tree growth easier without fragmenting the profile model

Expectations:

- keep account progression mutation in domain modules
- keep shell consumers reading summaries instead of becoming owners of account logic
- make type changes explicit and stable

## Chunk 2: Economy, Loot Pressure, And Itemization Depth

Turn the current item and rune layer into a real multi-act build economy.

This includes:

- expanding curated item, rune, and runeword breadth
- improving replacement tension so later acts force real loadout decisions
- tightening vendor inventory, refresh pressure, sell or stash loops, and account-economy gates
- adding stronger long-horizon sinks or planning value on top of the current stash, archive, vendor, and reward seams
- improving how reward and town systems steer the player toward meaningful item, rune, and runeword pivots
- strengthening late-act boss and elite rewards as build pivots rather than flat payout bumps

Expectations:

- keep economy logic out of shell code
- preserve deterministic reward mutation through domain APIs
- keep inventory and stash contracts stable for the shell and persistence layers

## Chunk 3: Profile Persistence, Archive Depth, And Read Models

Turn the current profile scaffold into the backbone for account-level progression.

This includes:

- durable schema support for profile evolution
- richer archived run-history summaries and account-facing review data
- stronger progression summaries, comparison-ready archive data, and account-facing read APIs
- better stash, archive, and economy read models so Agent 1 can present richer planning surfaces without new shell-owned logic
- migration coverage for older snapshots as the profile shape grows

Expectations:

- do not break active-run restore
- keep schema versioning clean
- leave Agent 1 a stable read surface for account hall and onboarding UI
- do not spend this batch rebuilding settings or tutorial mutation APIs that already exist in persistence and `app-engine`

## Chunk 4: Reward And Town Integration

Make the progression backbone the real owner of run growth.

This includes:

- ensuring rewards, town actions, vendors, stash flows, and class spends all move through one coherent progression model
- making boss and late-act rewards feel like build pivots
- ensuring new account-tree gates and economy rules show up consistently in both reward generation and town behavior
- ensuring progression changes round-trip through run snapshots and profile saves cleanly

Expectations:

- no one-off mutation paths hiding in UI or content files
- reward summaries and town summaries should reflect the same underlying data model

## Deliverables

- a stronger class progression system with stable runtime contracts
- deeper item, rune, runeword, and vendor economy breadth with stronger late-act replacement pressure
- broader account-level progression trees and feature gates built on the current ownership seams
- stronger profile persistence, archive-review data, and migration coverage
- reward and town integration around the deeper progression backbone
- regression coverage for progression, economy, and persistence round-trips
- doc sync if progression ownership or profile contracts change

## Test And Landing Rule

- add or update automated coverage for every progression, economy, persistence, or profile behavior you change
- keep `tests/app-engine*.test.ts` and any affected domain coverage in sync with the new rules
- run `npm run check` before calling the batch complete
- do not stop at local edits or a green test run; finish by landing the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 1 on the minimum summary APIs needed for front-door, town, and run-end surfaces
- coordinate with Agent 3 when quest, shrine, event, opportunity, or encounter outcomes need new economy or progression effects
- call out any `src/types/game.d.ts` changes before landing and let the project manager sequence them if multiple agents are touching shared contracts

## Acceptance Criteria

- class progression feels like a real build-growth backbone rather than a thin unlock scaffold
- account-level progression trees and feature gates are materially broader than the current baseline
- item, rune, runeword, vendor, stash, and reward systems behave like one economy rather than isolated features
- later acts create real replacement pressure instead of simple linear upgrades
- profile persistence survives the expanded meta shape through clean migrations
- combat still consumes derived values rather than owning progression logic
- `npm run check` passes

## Pickup Prompt

Build Rouge's next progression and account batch. Push the archive or economy or mastery trees into a capstone-style second wave of account systems, deepen the multi-act item or rune or runeword economy so Acts IV-V force meaningful replacement decisions, strengthen stash or archive or economy read models for the shell, and make rewards and town services operate through one coherent build-growth model with stronger long-horizon sinks. Keep mutation in run, rewards, items, character, and state modules, keep combat deterministic, and expose stable summary APIs for the shell.
