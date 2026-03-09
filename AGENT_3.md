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
- node or content-facing parts of `tests/app-engine*.test.ts`

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
- acts already have act-specific encounter pools, a sixteen-kind encounter-local modifier catalog, six branch-battle and six branch-miniboss packages per act, four elite-affix families per act, stronger escort, backline-screen, boss-screen, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence scripting, act-specific covenant boss retunes, archetype behavior, deeper boss escorts, and a seven-contract mercenary roster with multiple targeting behaviors plus twelve route perks per contract, including reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked compound scaling packages
- world nodes already support quest, shrine, event, and multiple opportunity families with follow-up consequence tracking, broader shrine blessings, shrine-specific branches, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, detour-lane payoffs, escalation-lane payoffs, consequence-gated opportunity variants, and four-package-per-role branch or miniboss or boss encounter and combat reward ladders that promote later-route variants through earlier shrine and crossroad flags
- content validation already covers core seed, generated content, world nodes, elite-affix references, and authored-path reachability for route-side content

Still weak:

- route topology now reaches quest -> event -> opportunity plus shrine -> shrine-opportunity plus crossroad -> reserve -> relay -> culmination with parallel legacy, reckoning, recovery, and accord lanes that converge again in covenant before opening detour and escalation follow-through lanes plus four-package-per-role branch or miniboss or boss payoff ladders, but it still needs broader alternate fabrics or more distinct act routing beyond the current late-route pattern per act
- quest and event chains now pay into deeper detour-and-escalation encounter and reward ladders, but boss and escort expression still tops out at the current branch or miniboss or boss package swaps per act
- encounter packs still need broader modifier catalogs or stronger escort or boss scripting beyond the current sixteen-modifier, linebreaker-charge, ritual-cadence, boss-screen, sniper-nest, and phalanx-march baseline, especially where late-route consequences should change how acts close
- mercenary route-perk catalogs now have a twelve-per-contract baseline with reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked scaling, but detour and escalation do not yet create a real later-run contract payoff seam
- validation and normalization still need to keep expanding as the authored surface grows

## Immediate Next Batch

Build the next route-depth and combat-depth pass beyond the current baseline:

- build on the now-live covenant -> detour or escalation late-route fabric plus the current four-package-per-role consequence ladder instead of re-establishing it, and push those late-route outcomes into stronger boss or escort expression
- deepen quest, shrine, aftermath-event, and opportunity chains so later nodes, bosses, escorts, and rewards pay off earlier consequences beyond the current detour-or-escalation encounter and reward ladder
- push more of that consequence payoff into actual boss scripts, escort packages, and reward consequences instead of only encounter-id swaps or flat number shifts
- only deepen mercenary route-perk breadth again when that follow-through or a newly added route family creates a meaningful later payoff seam beyond the current covenant-linked perk pass
- harden validation and normalization around every new authored content seam you add

This batch should make Acts I-V feel materially broader, not just numerically larger.

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

Epic and tickets:

- epic: `ROUGE-3` Late-Route Consequence Depth
- `ROUGE-11` Differentiate detour and escalation by act
- `ROUGE-12` Push route consequences deeper into encounters, bosses, and rewards
- `ROUGE-13` Harden late-route validation and reachability coverage
- `ROUGE-19` Add late-route determinism and validation coverage

1. `ROUGE-11` boss-and-escort follow-through pass
- the detour-and-escalation consequence ladders are now live on `master`
- deepen the post-covenant late-route fabric so detour and escalation materially retune boss courts, escorts, or equivalent act-defining fights instead of only swapping branch or miniboss or boss packages and rewards
- if you introduce a second late-route family beyond detour and escalation, keep it act-facing, materially different, and reachable through authored-path validation

2. `ROUGE-12` consequence-to-boss-and-escort pass
- make earlier quest, shrine, and opportunity outcomes influence later nodes, detour or escalation packages, boss scripts, escort packages, or reward consequences more deeply than the current four-package branch-or-miniboss-or-boss ladder
- build from the now-live `world-node-outcomes` seam and the dedicated late-route suites instead of putting more giant logic back into `tests/app-engine-world-nodes.test.ts`

3. `ROUGE-13` and `ROUGE-19` validation and determinism pass
- extend node and validation coverage in `tests/app-engine-world-nodes-route-chain.test.ts`, `tests/app-engine-world-nodes-route-payoffs.test.ts`, `tests/app-engine-world-nodes-late-routes.test.ts`, and `tests/app-engine-world-node-validation.test.ts`
- only add more mercenary route-perk depth if the boss-or-escort follow-through or a new route family creates a real new payoff seam
- if you do, keep the new perks validated and covered in both runtime validation and combat or node tests

## Chunk 1: Consequence Payoff And Late-Route Follow-Through

Expand the non-combat side of the run into a richer act loop now that covenant, detour, and escalation all exist.

This includes:

- making earlier node outcomes change later node resolution, encounter packages, or reward meaning more materially
- deepening authored quest, shrine, event, and opportunity chains beyond the current covenant close
- broadening the node catalog only when it creates a stronger payoff seam instead of another shallow branch
- deepening the now-live detour and escalation identities or introducing a further late-route family only when it materially changes payoff structure without breaking the current phase machine
- adding stronger downstream consequence payoff into later route nodes, encounters, or rewards
- preserving the current `world_map -> reward -> world_map` resolution seam for non-combat nodes

Expectations:

- keep node resolution in content, quest, app, and run seams
- do not move route-side outcome logic into shell files

## Chunk 2: Encounter, Elite, Boss, And Mercenary Content Depth

Expand the combat-facing authored surface.

This includes:

- more encounter-pack breadth per act
- stronger enemy-role combinations and support behavior
- broader elite-affix families or equivalent authored modifier packages on top of the live encounter-modifier seam
- stronger boss or escort scripting where it improves act identity
- richer mercenary contract differentiation or content-side scaling hooks that fit the current party-combat model when new route fabrics create a real payoff seam
- consequence-linked combat packages so route outcomes can materially change later act encounters or bosses
- stronger linkage between act identity and encounter packages so fights feel authored, not only scaled

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
- explicit coverage for new route-fabric reachability and consequence handoff correctness
- doc sync if node taxonomy, act content seams, or combat-content ownership change materially

Expectations:

- new content should fail clearly when bad
- the pipeline should still be understandable to future contributors

## Deliverables

- broader authored route-side catalogs across the current node families and any approved additions
- alternate route fabrics that make act navigation feel less linear and less uniform from act to act
- richer quest or event consequence chains with later payoff
- deeper encounter, elite, boss, and mercenary content variety
- stronger per-act identity across both route-side and combat-side content
- broader validation and normalization coverage for the expanded content surface
- regression tests for the new node, content, and combat behaviors

## Test And Landing Rule

- before the first code edit, first new test file, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira
- add or update automated coverage for every new node, encounter, elite, boss, mercenary, or validation behavior you change
- keep `tests/combat-engine.test.ts`, `tests/app-engine*.test.ts`, and any new content-validation coverage in sync with the authored surface
- run `npm run check` before calling the batch complete
- do not stop at local edits or a green test run; finish by landing the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 2 when node or combat outcomes need new reward, progression, or economy effects
- coordinate with Agent 1 when new node families, encounter metadata, or act signals need new shell treatment
- coordinate with Agent 5 when new route or combat seams need explicit regression, validation, coverage, or e2e follow-through
- if shared type or phase-contract changes are required, escalate to the project manager before landing them

## Acceptance Criteria

- the route loop offers materially more authored variety than the current covenant-plus-detour-plus-escalation baseline
- quest and event chains have deeper payoff than the current simple follow-up structure
- route fabrics feel materially different from each other, not just like longer chains
- act combat content feels broader through encounter mix, elite behavior, boss scripting, mercenary breadth, or equivalent systems
- validation covers the new content surfaces and fails clearly on bad data
- combat remains deterministic for fixed inputs
- `npm run check` passes

## Pickup Prompt

Build Agent 3's next world-content pass beyond the current seven-contract, twelve-route-perk-per-mercenary, crossroad, reserve-lane, relay-lane, culmination-lane, legacy-lane, reckoning-lane, recovery-lane, accord-lane, covenant-lane, detour-lane, and escalation-lane baseline, plus four-package-per-role consequence-conditioned branch-or-miniboss-or-boss encounter and reward ladders, four-affix-per-act, six-branch-battle and six-branch-miniboss encounter pools, and the sixteen-modifier combat baseline with linebreaker-charge and ritual-cadence boss retunes. Build on the live post-covenant detour and escalation lanes by making earlier quest, shrine, event, and opportunity outcomes change later bosses, escorts, and rewards more deeply than the current package ladder, and only extend mercenary route perks further if that follow-through creates a real later-run payoff seam. Keep node logic in content, quest, app, and run seams, keep combat deterministic, and make the larger authored surface fail clearly when content is incomplete.
