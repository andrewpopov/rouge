# Agent 1

## Mission

Own the full player-facing shell for Rouge.

Your job is not to polish one screen. Your job is to make the entire game readable, navigable, and product-ready from `boot` through `run_complete` without pushing gameplay logic back into the shell.

This is a large vertical slice:

- front door and account hall
- onboarding and tutorial surfacing
- safe-zone or town presentation
- world-map readability
- reward readability
- run-end and profile review surfaces

## Own These Areas

- `src/ui/*`
- `src/app/main.ts`
- shell-facing parts of `src/app/app-engine.ts`
- `index.html`
- `styles.css`
- UI-facing parts of `tests/app-engine*.test.ts`

## Do Not Own

- reward formulas
- class progression formulas
- item, rune, and runeword rules
- persistence schema design
- world-node resolution rules
- encounter-local combat rules

## Product Goal

Ship a coherent shell that can carry the whole game.

When this slice lands, Rouge should no longer feel like a developer harness with working systems behind it. It should feel like a playable product shell around the current runtime.

## Current Baseline

Live now:

- phase-owned UI modules already exist under `src/ui/*`
- `src/app/main.ts` is already a thin boot and dispatch bridge
- the front door already supports saved-run review plus continue and abandon flow
- the front door now reads as a navigable account hall with a hall navigator, primary expedition wing, dedicated unlock galleries, dedicated vault logistics, a richer vault or archive wing with an archive signal board, focused account-tree review, capstone watch treatment, and grouped settings or tutorial or preferred-class or planning controls
- the current shell already exposes stash, run history, progression summaries, onboarding guidance, town services, world-map flow, node views, combat, rewards, and run-end screens
- front-door UI already reads profile settings, preferred class, and account-summary signals from the live profile meta seam
- safe zone now reads as a prep hub with a town navigator, run-vs-profile framing, loadout review, service drilldowns, and departure-readiness treatment
- front door, safe zone, and run-end now include decision-support surfaces that summarize archive change, convergence pressure, charter pressure, live account bonuses, prep comparisons, and next-action guidance without taking ownership of progression logic
- world-map now matches that decision-support shell with a route decision desk that answers what changed, what is blocked, what account pressure is riding the run, and what the next route-side click hands back into
- world-map and node views now expose route-intel panels, a consequence ledger, stronger node-family labeling, and clearer late-opportunity-family treatment
- reward, act-transition, and run-end now include explicit continuity or delta surfaces instead of relying only on generic copy, with reward handoff guidance into map or act transition or run-end review and hall re-entry guidance that points back into the richer account hall

Still weak:

- the decision-support and continuity shell is now live across hall, town, map, reward, act-transition, and run-end, but the next shell pass still needs a stronger shared account-meta layer across those surfaces
- onboarding continuity is much stronger now, but future account progression or unlock data still needs better insertion points once Agent 2 extends those read models
- town, map, reward, and run-end readability are in better shape, but future shell work should extend the current navigable model instead of rebuilding the structure again

Important runtime note:

- `app-engine` already exposes profile-setting and tutorial mutation actions
- `src/ui/action-dispatcher.ts` already routes settings, tutorial, preferred-class, account-focus, and archive-review actions
- do not spend this batch rebuilding the control surface that is already live; improve the shell around it

## Immediate Next Batch

Agent 1's decision-support and continuity pass is now live across hall, town, map, reward, act-transition, and run-end. The next batch is a broader account-meta continuity pass on top of those existing desks. Do not wait on new backend work unless the runtime truly cannot support the view.

Build on the richer hall, prep hub, route desk, reward desk, transition wrapper, and hall handoff that already exist:

- extend a shared account-meta layer across hall, town, map, reward, act-transition, and run-end so archive pressure, charter staging, mastery pressure, and convergence pressure stay legible without each view inventing its own one-off summary
- preserve the current route, reward, and transition continuity so broader Agent 2 and Agent 3 data can land without another structural rewrite
- make the shell better at comparing run-local state, account-level pressure, and the next meaningful decision without becoming the owner of gameplay logic
- only ask for new APIs when the current hall navigator, archive-review, focused-tree, convergence, tutorial, settings, planning, or delta seams truly cannot support the shell need

This batch should stay shell-heavy and API-light:

- consume the existing profile, summary, route, archive, reward, and node data first
- use the already-live profile settings, tutorial, preferred-class, account-focus, archive-review, and planning APIs before asking for new backend seams
- only request new APIs from Agent 2 or Agent 3 when the current runtime truly cannot support the shell need
- coordinate with Agent 4 before touching shared shell test coverage or `tests/helpers/browser-harness.ts`
- land the batch in coherent commits directly on `master` after tests and doc sync are complete

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

1. account-hall decision-support pass
- the hall decision desk, prep comparison board, and run-end hall handoff are now live in `src/ui/front-door-view.ts`, `src/ui/safe-zone-view.ts`, and `src/ui/run-summary-view.ts`
- they use the existing account summary, convergence summary, planning summary, and archive-review seams without adding new runtime contracts
- shell coverage for those surfaces now lives in `tests/app-engine-shell.test.ts`

2. route-intel continuity pass
- the route decision desk is now live in `src/ui/world-map-view.ts`
- the map now answers what changed, what is blocked, what account pressure is riding the run, and what the next route-side action hands back into
- keep node-family explanation, consequence ledger treatment, and act-pressure readability aligned with the now-live hall or town or reward or act-transition or run-end comparison surfaces

3. reward and transition delta pass
- reward continuity and act-transition delta desks are now live in `src/ui/reward-view.ts` and `src/ui/act-transition-view.ts`
- reward and transition screens now show account-impact carry-through and next-action guidance without inventing shell-owned progression logic
- keep `src/app/main.ts` thin, only touch `src/app/app-engine.ts` for shell-facing wiring that cannot stay in views or the dispatcher, and sync docs if the visible shell model changes materially

## Chunk 1: Account Hall Navigation And Drilldowns

Turn the front door from a dense account sheet into a navigable account hall.

This includes:

- active-run resume or abandon presentation as a primary panel
- a clearer archive desk for browsing stored runs and account-history context
- a clearer account progression section for current archive or economy or mastery summaries
- profile settings, account-focus, archive-review, tutorial, and preferred-class controls grouped intentionally instead of scattered through one sheet
- dedicated drilldown or summary areas for account progression, archive review, and control surfaces so the hall stops feeling like one long scroller
- stable layout space for future account systems beyond the current buckets

Expectations:

- do not invent a new top-level phase
- do not move profile ownership out of `src/state/*`
- use the existing profile meta seam for real settings controls first, and only request new state actions when the current seam truly cannot support the control

## Chunk 2: Guided Play And Onboarding Continuity

Turn the current guidance into a real first-run and low-friction play layer.

This includes:

- clearer class-pick framing
- stronger "what do I do next" guidance in town, map, combat, reward, and run-end phases
- onboarding presentation that binds to the live tutorial-state persistence seam
- cleaner visual continuity between hall guidance, character select guidance, town guidance, route guidance, reward explanation, and run-end recap
- player-facing explanation of node types, mercenary role, rewards, and town systems

Expectations:

- do not invent hidden game rules inside the shell
- do not make UI the owner of tutorial progression logic
- build the shell so Agent 2 can later plug in broader unlock-tree and meta-progression data

## Chunk 3: Town Prep And Run Management UX

Turn the safe zone into a real town hub.

This includes:

- stronger grouping for healer, belt, vendor, stash, mercenary, training, and class-spend services
- clearer distinction between run-local state and profile-level state
- stronger loadout, rune, and build-state readability before leaving town
- service-specific drilldowns or comparison panels for the most important prep actions instead of one flat service sheet
- stronger visibility for account carry-forward state such as stash, unlock progress, tutorial progress, and focused account-tree effects
- better run-management clarity around returning to map, restoring momentum, and preparing for the next route decision
- a stronger pre-departure summary that makes unresolved spend paths and preparation options obvious

Expectations:

- keep service execution in town, run, item, reward, and state modules
- keep the shell responsible for layout, explanation, and interaction routing

## Chunk 4: Route Intel, Reward, And Run-End Presentation

Make the outer loop readable all the way through.

This includes:

- clearer route structure, act pressure, and boss progression on the world map
- stronger distinction between battle, miniboss, boss, quest, shrine, event, and the newer opportunity families
- more explicit consequence, preview, and lane-treatment for route-side nodes
- reward panels that clearly explain permanent run mutation, immediate build impact, and carry-forward effects
- explicit delta views for rewards and run-end review so the player can see what changed in deck, loadout, account state, and route state
- stronger run-complete or run-failed review surfaces tied back into archive history, account progression, and next-action guidance

Expectations:

- preserve the current `world_map -> encounter -> reward -> world_map` loop
- preserve the current phase machine
- keep reward mutation in domain modules

## Deliverables

- a front door that reads like a real account hall with clearer subareas and drilldowns
- a stronger archive desk, account-progression area, and active-expedition area inside that hall
- dedicated unlock, vault-logistics, archive-signal, and capstone-watch surfaces inside the account hall
- a stronger guided-play shell across all active phases
- a town hub that is organized around real services, build state, departure readiness, and service drilldowns
- clearer map, node, reward, and run-end presentation with explicit player guidance and change summaries
- active insertion points for the current unlock, tutorial, settings, account-tree, and archive-review seams plus stable space for future meta panels
- regression coverage for the expanded shell flow
- doc sync if shell ownership or module boundaries change

## Test And Landing Rule

- before the first code edit, first new test file, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira
- add or update automated coverage for every shell behavior you change, starting with `tests/app-engine*.test.ts` and any affected domain tests
- include action-dispatch coverage when you add interactive account-hall, settings, or tutorial controls
- run `npm run check` before calling the batch complete
- do not stop at local edits or a green test run; finish by landing the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 2 on any new profile summary, unlock, tutorial, or progression summary data you need rendered
- coordinate with Agent 3 when new node families or encounter metadata need shell treatment
- coordinate with Agent 5 when new shell flows need e2e coverage or broader regression follow-through
- do not redefine `app-engine` or run-state contracts casually; escalate shared shell-contract changes to the project manager first
- call out any `src/types/game.d.ts`, `src/app/app-engine.ts`, or `src/app/main.ts` contract changes before landing on `master`

## Acceptance Criteria

- the front door feels like the game entry surface, not a debug launcher
- settings, unlock, tutorial, account-tree, preferred-class, and archive-review features feel like one coherent account hall
- the shell explains the current game loop clearly across town, map, combat, reward, and run-end
- safe-zone presentation is grouped and readable enough to support the current economy and progression systems
- route-side and reward-side information is surfaced without major shell surgery
- `src/app/main.ts` remains a thin boot and dispatch bridge
- gameplay mutation is not moved into UI code
- `npm run check` passes

## Pickup Prompt

Build Rouge's next shell batch now. Treat the live account hall, archive desk, convergence review, charter ledger, prep hub, route-intel map, and delta-heavy reward or run-end shell as the baseline. Turn those existing surfaces into clearer decision support: show what changed, what is blocked, what pressure is active, and what the player should do next without inventing shell-owned progression logic. Use the existing settings, tutorial, preferred-class, account-focus, convergence, archive-review, planning, and summary actions before asking for new backend seams. Keep `src/app/main.ts` thin, coordinate with Agent 4 on shared shell test coverage, and keep gameplay mutation in domain modules.
