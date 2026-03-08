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
- acts already have act-specific encounter pools, a thirteen-kind encounter-local modifier catalog, four elite-affix families per act, stronger escort, support-screen, sniper-nest, and phalanx-march scripting, archetype behavior, deeper boss escorts, and a seven-contract mercenary roster with multiple targeting behaviors plus twelve route perks per contract, including reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked compound scaling packages
- world nodes already support quest, shrine, event, and multiple opportunity families with follow-up consequence tracking, broader shrine blessings, shrine-specific branches, crossroad payoffs, reserve-lane payoffs, relay-lane payoffs, culmination-lane payoffs, legacy-lane payoffs, reckoning-lane payoffs, recovery-lane payoffs, accord-lane payoffs, covenant-lane payoffs, consequence-gated opportunity variants, and consequence-conditioned branch encounter packages
- content validation already covers core seed, generated content, world nodes, elite-affix references, and authored-path reachability for route-side content

Still weak:

- route topology now reaches quest -> event -> opportunity plus shrine -> shrine-opportunity plus crossroad -> reserve -> relay -> culmination with parallel legacy, reckoning, recovery, and accord lanes that converge again in covenant, but it still needs broader alternate fabrics or deeper combat-linked payoff beyond the current late-route convergence per act
- quest and event chains still need more downstream payoff beyond the current follow-up, shrine branch, crossroad, reserve, relay, culmination, legacy, reckoning, recovery, accord, and covenant handoffs
- encounter packs still need broader modifier catalogs or stronger escort or boss scripting beyond the current thirteen-modifier, sniper-nest, and phalanx-march baseline
- mercenary route-perk catalogs now have a twelve-per-contract baseline with reserve-linked, relay-linked, culmination-linked, legacy-linked, reckoning-linked, recovery-linked, accord-linked, and covenant-linked scaling, but later route families could still grow late-run contract payoff further beyond the current covenant-linked perk pass
- validation and normalization still need to keep expanding as the authored surface grows

## Immediate Next Batch

Build the next route-depth and combat-depth pass beyond the current baseline:

- deepen quest, shrine, aftermath-event, and opportunity chains so later nodes, encounters, and rewards pay off earlier consequences beyond the current legacy-and-reckoning-and-recovery-and-accord-into-covenant handoff plus branch-encounter retunes
- broaden route consequence payoff so the current covenant convergence changes more than reward text and one branch encounter retune
- broaden the live encounter-local modifier catalog, strengthen escort or boss scripting, or add equivalent combat-side authored depth beyond the current thirteen-modifier baseline where it improves act identity
- only deepen mercenary route-perk breadth again when new route families or combat packages create a meaningful later payoff seam beyond the current covenant-linked perk pass
- harden validation and normalization around every new authored content seam you add

This batch should make Acts I-V feel materially broader, not just numerically larger.

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

1. consequence payoff pass
- make earlier quest, shrine, and opportunity outcomes influence later nodes, encounter packages, or reward consequences more deeply than the current legacy or reckoning or recovery or accord or covenant handoff
- extend node and validation coverage in `tests/app-engine-world-nodes.test.ts` and `tests/app-engine-world-node-validation.test.ts`

2. combat-depth pass
- broaden encounter-local authored depth in `src/content/encounter-registry.ts` and `src/combat/combat-engine.ts`
- prioritize new modifier families, escort or boss scripting, and act identity before extending mercenary perk breadth again

3. route-topology extension only if it creates a real new payoff seam
- only add more route families if they change consequence payoff materially beyond the current covenant convergence
- keep route resolution deterministic and reachable through authored-path validation

4. mercenary extension only if justified
- only add more mercenary route-perk depth if the new route fabric creates a real new payoff seam
- if you do, keep the new perks validated and covered in both runtime validation and combat or node tests

## Chunk 1: Consequence Payoff And Late-Route Follow-Through

Expand the non-combat side of the run into a richer act loop now that covenant exists.

This includes:

- making earlier node outcomes change later node resolution, encounter packages, or reward meaning more materially
- deepening authored quest, shrine, event, and opportunity chains beyond the current covenant close
- broadening the node catalog only when it creates a stronger payoff seam instead of another shallow branch
- introducing clearer route identities such as detour, escalation, recovery, or gamble lanes without breaking the current phase machine
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

- add or update automated coverage for every new node, encounter, elite, boss, mercenary, or validation behavior you change
- keep `tests/combat-engine.test.ts`, `tests/app-engine*.test.ts`, and any new content-validation coverage in sync with the authored surface
- run `npm run check` before calling the batch complete
- land the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 2 when node or combat outcomes need new reward, progression, or economy effects
- coordinate with Agent 1 when new node families, encounter metadata, or act signals need new shell treatment
- if shared type or phase-contract changes are required, escalate to the project manager before landing them

## Acceptance Criteria

- the route loop offers materially more authored variety than the current baseline
- quest and event chains have deeper payoff than the current simple follow-up structure
- route fabrics feel materially different from each other, not just like longer chains
- act combat content feels broader through encounter mix, elite behavior, boss scripting, mercenary breadth, or equivalent systems
- validation covers the new content surfaces and fails clearly on bad data
- combat remains deterministic for fixed inputs
- `npm run check` passes

## Pickup Prompt

Build Agent 3's next world-content pass beyond the current seven-contract, twelve-route-perk-per-mercenary, crossroad, reserve-lane, relay-lane, culmination-lane, legacy-lane, reckoning-lane, recovery-lane, accord-lane, covenant-lane, consequence-conditioned branch-encounter, four-affix-per-act, and thirteen-modifier combat baseline. Deepen downstream quest, shrine, event, and opportunity payoff beyond the current legacy-and-reckoning-and-recovery-and-accord-into-covenant handoff plus branch-encounter retunes, and broaden encounter-local modifiers or escort or boss scripting where it improves act identity. Only extend mercenary route perks further if new consequence or combat packages create a real later-run payoff seam beyond the current covenant-linked perk pass. Keep node logic in content, quest, app, and run seams, keep combat deterministic, and make the larger authored surface fail clearly when content is incomplete.
