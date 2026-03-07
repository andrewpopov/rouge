# Agent 3

## Mission

Own Rouge's world-content and combat-depth expansion.

Your job is not to add one more event node or one more encounter package. Your job is to make Acts I-V feel like a fuller game by expanding route-side content, mercenary content, encounter variety, elite behavior, and content-pipeline durability together.

This is a large vertical slice:

- route-side node families
- quest and event consequence chains
- encounter-pack breadth
- elite and boss depth
- mercenary roster or content-side scaling breadth
- content validation and authoring safeguards

## Own These Areas

- `src/content/*`
- `src/quests/*`
- `src/combat/*`
- content-facing parts of `src/app/app-engine.ts`
- content-facing shared types in `src/types/game.d.ts`
- `tests/combat-engine.test.ts`
- node or content-facing parts of `tests/app-engine.test.ts`

## Do Not Own

- shell layout or onboarding presentation
- profile or persistence ownership
- vendor and stash economy rules
- class progression formulas

## Product Goal

Ship the content depth that makes the run loop feel like a real multi-act game.

When this slice lands, Rouge should have a much stronger answer for:

- why Acts I-V feel different from each other
- why route decisions matter beyond simple combat pacing
- how quest, shrine, event, and opportunity chains branch into later content
- how encounters, elites, bosses, and mercenary support evolve across the run

## Current Baseline

Live now:

- D2 seed bundles already drive classes, acts, zones, enemies, items, runes, bosses, and skills
- acts already have act-specific encounter pools, elite-affix families, archetype behavior, and boss scripting
- world nodes already support quest, shrine, event, and opportunity families with follow-up consequence tracking
- content validation already covers core seed, generated content, world nodes, and elite-affix references

Still weak:

- route-side content still needs broader authored catalogs inside each act
- quest and event chains still need deeper downstream payoff and wider structural variety
- encounter packs still need broader authored enemy-role combinations and more act identity
- mercenary breadth and content-driven scaling still need more depth
- validation and normalization need to keep expanding as the authored surface grows

## Chunk 1: Route-Side Content Expansion

Expand the non-combat side of the run into a richer act loop.

This includes:

- broadening the node catalog inside each act
- deepening authored quest, shrine, event, and opportunity chains
- adding stronger downstream consequence payoff into later route nodes or rewards
- preserving the current `world_map -> reward -> world_map` resolution seam for non-combat nodes

Expectations:

- keep node resolution in content, quest, app, and run seams
- do not move route-side outcome logic into shell files

## Chunk 2: Encounter, Elite, Boss, And Mercenary Content Depth

Expand the combat-facing authored surface.

This includes:

- more encounter-pack breadth per act
- stronger enemy-role combinations and support behavior
- broader elite-affix families or equivalent encounter modifiers
- stronger boss or escort scripting where it improves act identity
- broader mercenary roster or content-side scaling hooks that fit the current party-combat model

Expectations:

- preserve deterministic combat for fixed inputs
- keep encounter-local mutation in combat
- keep content authoring data-driven where possible

## Chunk 3: Act Identity And Content Pipeline Hardening

Make content scale without turning brittle.

This includes:

- stronger act identity in generated or authored encounter and node packages
- broader validation and normalization for the larger content surface
- safer failure modes when authored quest, node, or encounter data is incomplete
- doc sync if node taxonomy, act content seams, or combat-content ownership change materially

Expectations:

- new content should fail clearly when bad
- the pipeline should still be understandable to future contributors

## Deliverables

- broader authored route-side catalogs across the current node families and any approved additions
- richer quest or event consequence chains with later payoff
- deeper encounter, elite, boss, and mercenary content variety
- stronger per-act identity across both route-side and combat-side content
- broader validation and normalization coverage for the expanded content surface
- regression tests for the new node, content, and combat behaviors

## Collaboration Notes

- coordinate with Agent 2 when node or combat outcomes need new reward, progression, or economy effects
- coordinate with Agent 1 when new node families, encounter metadata, or act signals need new shell treatment
- if shared type or phase-contract changes are required, escalate to the project manager before landing them

## Acceptance Criteria

- the route loop offers materially more authored variety than the current baseline
- quest and event chains have deeper payoff than the current simple follow-up structure
- act combat content feels broader through encounter mix, elite behavior, boss scripting, mercenary breadth, or equivalent systems
- validation covers the new content surfaces and fails clearly on bad data
- combat remains deterministic for fixed inputs
- `npm run check` passes

## Pickup Prompt

Build Rouge's world-content and combat-depth pass. Expand route-side node catalogs and consequence chains across Acts I-V, deepen encounter, elite, boss, and mercenary content so the acts feel materially different, and harden the content pipeline so the larger authored surface validates and fails clearly. Keep node logic in content, quest, app, and run seams, keep combat deterministic, and preserve the current phase model.
