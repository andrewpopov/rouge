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
- UI-facing parts of `tests/app-engine.test.ts`

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

Still weak:

- the front door still reads more like a utility surface than an account or profile hall
- current onboarding is informative but not yet structured like a proper guided first-run experience
- town services exist, but the safe zone still needs stronger hierarchy and clearer grouping
- world-map and node detail views need stronger route pressure, consequence, and reward explanation
- end-run and profile-review surfaces still need to feel like part of one connected shell

## Chunk 1: Account Shell And Front Door

Build the front door into a durable account-entry surface.

This includes:

- active-run resume or abandon presentation
- stash visibility
- run-history browsing
- profile settings surfacing
- preferred-class surfacing
- reserved layout space for unlocks and future account systems

Expectations:

- do not invent a new top-level phase
- do not move profile ownership out of `src/state/*`
- keep new shell surfaces render-only unless a shared contract is explicitly approved

## Chunk 2: Guided Play And Onboarding

Turn the current guidance into a real first-run and low-friction play layer.

This includes:

- clearer class-pick framing
- stronger "what do I do next" guidance in town, map, combat, and reward phases
- tutorial or onboarding presentation that can later bind to real tutorial-state persistence
- player-facing explanation of node types, mercenary role, rewards, and town systems

Expectations:

- do not invent hidden game rules inside the shell
- do not make UI the owner of tutorial progression logic
- build the shell so Agent 2 can later plug in account unlock and tutorial-state data

## Chunk 3: Town Hub And Run Management UX

Turn the safe zone into a real town hub.

This includes:

- stronger grouping for healer, belt, vendor, stash, mercenary, training, and class-spend services
- clearer distinction between run-local state and profile-level state
- stronger loadout and build-state readability before leaving town
- better run-management clarity around returning to map, restoring momentum, and preparing for the next route decision

Expectations:

- keep service execution in town, run, item, reward, and state modules
- keep the shell responsible for layout, explanation, and interaction routing

## Chunk 4: World Map, Node, Reward, And Run-End Presentation

Make the outer loop readable all the way through.

This includes:

- clearer route structure, act pressure, and boss progression on the world map
- stronger distinction between battle, miniboss, boss, quest, shrine, event, and opportunity nodes
- more explicit consequence and preview treatment for route-side nodes
- reward panels that clearly explain permanent run mutation
- stronger run-complete or run-failed review surfaces tied back into front-door history

Expectations:

- preserve the current `world_map -> encounter -> reward -> world_map` loop
- preserve the current phase machine
- keep reward mutation in domain modules

## Deliverables

- a front door that reads like an account or profile hall
- a stronger guided-play shell across all active phases
- a town hub that is organized around real services and build state
- clearer map, node, reward, and run-end presentation
- stable insertion points for unlocks, settings, and future meta panels
- regression coverage for the expanded shell flow
- doc sync if shell ownership or module boundaries change

## Collaboration Notes

- coordinate with Agent 2 on any new profile summary, unlock, tutorial, or progression summary data you need rendered
- coordinate with Agent 3 when new node families or encounter metadata need shell treatment
- do not redefine `app-engine` or run-state contracts casually; escalate shared shell-contract changes to the project manager first

## Acceptance Criteria

- the front door feels like the game entry surface, not a debug launcher
- the shell explains the current game loop clearly across town, map, combat, reward, and run-end
- safe-zone presentation is grouped and readable enough to support the current economy and progression systems
- node-specific and reward-specific information is surfaced without major shell surgery
- `src/app/main.ts` remains a thin boot and dispatch bridge
- gameplay mutation is not moved into UI code
- `npm run check` passes

## Pickup Prompt

Build Rouge's full player-facing shell. Turn the current front door into a real account hall, turn onboarding into a structured guided-play layer, reorganize the safe zone into a readable town hub, and make world-map, node, reward, and run-end surfaces explain the live systems clearly. Keep `src/app/main.ts` thin, keep gameplay mutation in domain modules, and leave clean insertion points for unlocks, settings, and future account systems.
