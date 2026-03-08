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
- the current shell already exposes stash, run history, progression summaries, onboarding guidance, town services, world-map flow, node views, combat, rewards, and run-end screens
- front-door UI already reads profile settings, preferred class, and account-summary signals from the live profile meta seam
- safe-zone, world-map, and run-end views already have the structural panels needed for a larger shell pass

Still weak:

- the shell now exposes most of the right information, but it still reads as one large information wall instead of a product with clear navigation and drilldowns
- onboarding is broader now, but it still needs cleaner phase-to-phase continuity from front door to class select to town to route
- town services exist, but the safe zone still needs stronger hierarchy, clearer build-readability, service drilldowns, and clearer account-vs-run separation
- world-map and node detail views need stronger route pressure, consequence, and reward explanation
- reward and run-end surfaces already explain more, but they still need clearer before-or-after change summaries and next-action guidance

Important runtime note:

- `app-engine` already exposes profile-setting and tutorial mutation actions
- `src/ui/action-dispatcher.ts` already routes settings, tutorial, preferred-class, account-focus, and archive-review actions
- do not spend this batch rebuilding the control surface that is already live; improve the shell around it

## Immediate Next Batch

Agent 1's next batch is the second shell-structure pass. Do not wait on new backend work unless the current runtime truly cannot support the view.

Build the next product-shell layer on top of the controls and summaries that already exist:

- turn the front door into a navigable account hall with clearer subareas for the active expedition, archive desk, progression trees, class preference, settings, and tutorial state
- turn the safe zone into a build-prep hub with clearer service grouping, gear or rune readability, mercenary context, and "ready to leave town" clarity
- turn the world map into a route-intel surface with a readable legend, clearer node identity, stronger consequence preview, and better act-pressure context
- turn reward and run-end screens into explicit before-or-after mutation summaries so the player can immediately understand what changed and what to do next

This batch should be shell-heavy and API-light:

- consume the existing profile, summary, route, archive, reward, and node data first
- use the already-live profile settings, tutorial, preferred-class, account-focus, and archive-review APIs before asking for new backend seams
- only request new APIs from Agent 2 or Agent 3 when the current runtime truly cannot support the shell need
- coordinate with Agent 4 before touching shared shell test coverage or `tests/helpers/browser-harness.ts`
- land the batch in coherent commits directly on `master` after tests and doc sync are complete

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

1. front-door structure pass
- split the hall into clearer active-expedition, archive, progression, and control regions inside `src/ui/front-door-view.ts`
- use `src/ui/render-utils.ts`, `styles.css`, and existing profile summaries before asking for new state
- add or update shell coverage in `tests/app-engine-shell.test.ts` and any related `tests/app-engine*.test.ts`

2. safe-zone preparation pass
- turn `src/ui/safe-zone-view.ts` into a clearer prep hub with service grouping, build readability, and pre-departure framing
- add service-specific comparison or drilldown panels without moving service logic out of town, item, reward, or state modules

3. route, reward, and run-end delta pass
- strengthen route-intel presentation in `src/ui/world-map-view.ts`
- add explicit change-summary treatment in `src/ui/reward-view.ts` and `src/ui/run-summary-view.ts`
- make node, reward, and archive consequences easier to read without adding new top-level phases

4. shell consistency cleanup
- keep `src/app/main.ts` thin
- only touch `src/app/app-engine.ts` for shell-facing wiring that cannot stay in views or the dispatcher
- sync docs if the shell’s ownership seams or visible navigation model materially change

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
- a stronger guided-play shell across all active phases
- a town hub that is organized around real services, build state, departure readiness, and service drilldowns
- clearer map, node, reward, and run-end presentation with explicit player guidance and change summaries
- active insertion points for the current unlock, tutorial, settings, account-tree, and archive-review seams plus stable space for future meta panels
- regression coverage for the expanded shell flow
- doc sync if shell ownership or module boundaries change

## Test And Landing Rule

- add or update automated coverage for every shell behavior you change, starting with `tests/app-engine*.test.ts` and any affected domain tests
- include action-dispatch coverage when you add interactive account-hall, settings, or tutorial controls
- run `npm run check` before calling the batch complete
- do not stop at local edits or a green test run; finish by landing the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 2 on any new profile summary, unlock, tutorial, or progression summary data you need rendered
- coordinate with Agent 3 when new node families or encounter metadata need shell treatment
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

Build Rouge's next shell batch now. Turn the front door into a navigable account hall with clearer subareas and drilldowns, reorganize the safe zone into a clearer town-prep hub with service-specific comparison panels, and make world-map, node, reward, and run-end surfaces explain the live systems through stronger route intel and explicit before-or-after change summaries. Use the existing settings, tutorial, preferred-class, account-focus, and archive-review actions rather than inventing new shell-owned state. Keep `src/app/main.ts` thin, coordinate with Agent 4 on shared shell test coverage, and keep gameplay mutation in domain modules.
