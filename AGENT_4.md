# Agent 4

## Mission

Own Rouge's architecture quality and technical-debt reduction lane.

Your job is not to do random cleanup. Your job is to make the codebase easier to extend without changing the live game contract: extract oversized modules, tighten architecture seams, reduce lint suppressions, and keep the browser-facing runtime stable while the feature agents keep shipping.

Treat this as a recurring operating loop, not a one-off cleanup pass:

1. establish or sharpen one architecture seam
2. move code behind that seam without changing behavior
3. reduce the lint or test debt exposed by the extraction
4. codify the stable rule in the docs
5. repeat on the next hotspot

This is a large vertical slice:

- architecture pattern enforcement
- oversized module extraction
- lint and type-safety cleanup
- test-harness and test-file structure cleanup
- codebase rule maintenance

## Own These Areas

- `docs/CODEBASE_RULES.md`
- `docs/APPLICATION_ARCHITECTURE.md`
- architecture-facing parts of `PROJECT_MANAGER.md`
- cross-cutting refactors in `src/**` when the goal is extraction, modularity, or behavior-preserving cleanup
- cross-cutting refactors in `tests/*.test.ts`
- `eslint.config.js`
- `tsconfig*.json`

## Do Not Own

- new gameplay mechanics
- reward tuning or economy tuning as product design
- shell presentation decisions that belong to Agent 1
- progression feature design that belongs to Agent 2
- world-content expansion that belongs to Agent 3

## Product Goal

Ship a codebase that can survive the next several feature waves without collapsing into giant single-file systems and fragile tests.

When this slice lands, Rouge should have:

- clearer domain seams
- fewer oversized hotspot files
- less lint suppression debt
- better-organized browser-boundary tests
- clearer architecture rules for future contributors

## Current Baseline

The runtime is functionally strong, but the codebase has obvious pressure points:

- `src/quests/world-node-engine.ts` is roughly `11.5k` lines
- `src/content/content-validator.ts` is roughly `0.9k` lines after the world-opportunity helper extraction
- `src/content/content-validator-world-paths.ts` now owns authored-path state collectors, reference-state assembly, and opportunity-variant matching for validation-heavy world content
- `src/content/content-validator-world-opportunities.ts` now owns late-route opportunity-family validation plus shared reward, grant, and string-id helpers for world-node validation
- `src/content/content-validator-runtime-content.ts` now owns starter-deck, class-progression, mercenary route-perk, generated-encounter, and consequence-package validation for runtime content
- `src/content/encounter-registry.ts` is down to roughly `0.05k` lines after the encounter-builder extraction
- `src/content/encounter-registry-builders.ts` now owns act encounter-set assembly
- `src/content/encounter-registry-enemy-builders.ts` now owns act enemy-pool normalization, elite-affix lookups, and generated enemy template or intent builders
- the item runtime is now split across `src/items/item-data.ts`, `src/items/item-catalog.ts`, `src/items/item-loadout.ts`, `src/items/item-town.ts`, and `src/items/item-system.ts`
- `src/items/item-system.ts` is down to roughly `0.5k` lines after the split and the browser seam now loads the helper chain through `index.html`, `tests/helpers/browser-harness.ts`, and `src/types/game.d.ts`
- the app-engine test surface is now split across `tests/app-engine.test.ts`, `tests/app-engine-world-nodes.test.ts`, `tests/app-engine-world-nodes-late-routes.test.ts`, and `tests/app-engine-world-node-validation.test.ts`; the remaining largest suites are still `tests/app-engine-world-nodes.test.ts` at roughly `2.3k` lines and `tests/app-engine.test.ts` at roughly `1.8k` lines
- `src/run/run-factory.ts` is roughly `0.3k` lines after the route-builder and reward-flow extractions
- `tests/helpers/browser-harness.ts` is the shared compiled-browser seam and now centralizes the shared runtime manifests so validator and encounter helper boot order have one maintained source of truth per seam while the large suites shrink further
- the validator helper chain now loads as `content-validator-world-paths` -> `content-validator-world-opportunities` -> `content-validator-runtime-content` -> `content-validator` through `index.html`, `tests/helpers/browser-harness.ts`, and `src/types/game.d.ts`, so those files must stay aligned whenever any private validator helper changes boot order
- the encounter-registry helper chain now loads through `index.html`, `tests/helpers/browser-harness.ts`, and `src/types/game.d.ts`, so those files must stay aligned whenever generated encounter boot order changes

Current lint-debt signals:

- `src/content/game-content.ts` disables `max-lines`
- `src/types/game.d.ts` disables `max-lines`

The architecture rules are directionally correct, but they are not yet backed by enough extraction work in the biggest hotspots.

## Operating Loop

Every batch in this lane should follow the same cycle:

### Step 1: Establish the seam

- choose one hotspot file
- identify the missing domain boundary inside it
- extract a stable helper, builder, resolver, or harness around that boundary

### Step 2: Move code behind the seam

- move behavior into the new module without changing runtime contracts
- keep public browser exports and single-writer ownership intact
- prefer clear domain names over generic `utils` dumping

### Step 3: Pay off the local debt

- remove local `max-lines` suppression if the extraction makes it realistic
- split or simplify tests that became easier to isolate
- delete duplicated setup or dead helpers created by the old monolith

### Step 4: Lock the pattern in

- update `docs/CODEBASE_RULES.md` if a new stable seam now exists
- update `docs/APPLICATION_ARCHITECTURE.md` or `PROJECT_MANAGER.md` if the landing pattern changed
- leave the next hotspot with a clearer entry point for the next pass

## Immediate Next Batch

Build the next concrete architecture-hardening pass on top of the live runtime:

- finish the remaining outer-loop test cleanup around the split app-engine suites without losing the compiled-browser boundary
- keep the centralized helper-chain manifests in `tests/helpers/browser-harness.ts` as the only maintained compiled-browser boot-order source while the suite split continues
- extract one or more oversized core modules into smaller domain helpers without changing behavior
- reduce lint suppression debt where extraction makes that realistic
- codify the resulting patterns in the architecture docs so future feature work follows the same seams, including helper-script boot order when a browser entry depends on a private helper

This batch should make the codebase easier to work in immediately, not just add process language.

## Current Priority Queue

Work this list from top to bottom unless the project manager explicitly reorders it:

1. keep `tests/app-engine*.test.ts` aligned and finish the remaining suite cleanup around `tests/helpers/browser-harness.ts`
2. keep `src/content/content-validator.ts` thin and keep late-route validation behind `src/content/content-validator-world-opportunities.ts`; if a follow-on pass is warranted, target the remaining early world-node checks instead of re-expanding the public entry
3. keep `src/content/encounter-registry.ts` thin by preventing logic drift back out of `src/content/encounter-registry-builders.ts` or `src/content/encounter-registry-enemy-builders.ts`
4. keep `src/run/run-factory.ts` and `src/run/run-reward-flow.ts` thin by preventing logic drift back into them
5. stage the first safe extractions out of `src/quests/world-node-engine.ts` only after coordinating with Agent 3

Do not start with `world-node-engine.ts` as a giant rewrite. Earn that extraction by shrinking the surrounding hotspots first and by proving the pattern in smaller modules.

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

1. next suite split
- reduce the next oversized compiled-browser suite, starting with `tests/app-engine-world-nodes.test.ts`
- keep `tests/app-engine*.test.ts` aligned with `tests/helpers/browser-harness.ts`
- keep the new manifest arrays in `tests/helpers/browser-harness.ts` as the single maintained source of truth when browser seams change
- keep the resulting split easier to scan than the current single large world-node suite

2. first `world-node-engine` helper extraction
- coordinate with Agent 3 and extract one contained late-route or consequence-resolution helper out of `src/quests/world-node-engine.ts` without starting a giant rewrite
- keep `src/content/encounter-registry.ts`, `src/run/run-factory.ts`, and `src/run/run-reward-flow.ts` thin by routing new logic back through their helper seams

3. follow-on seam prep
- keep late-route opportunity-family validation and shared reward or grant helpers inside `src/content/content-validator-world-opportunities.ts`
- if a follow-on validator extraction is warranted, build from `src/content/content-validator-world-paths.ts`, `src/content/content-validator-world-opportunities.ts`, and `src/content/content-validator-runtime-content.ts` instead of re-expanding the public validator entry
- update `docs/CODEBASE_RULES.md`, `docs/APPLICATION_ARCHITECTURE.md`, `docs/TEAM_WORKSTREAMS.md`, and `PROJECT_MANAGER.md` whenever helper ownership or boot order changes
- leave the remaining app-engine suite split or later `world-node-engine` follow-on with a clearer entry point once the current pass lands cleanly

## Chunk 1: Oversized Runtime Extraction

Target the biggest runtime hotspots first.

This includes:

- keeping the new item-runtime split clean and behavior-preserving
- extracting coherent helpers or submodules out of `src/content/content-validator.ts` or `src/content/encounter-registry.ts`
- keeping `src/run/run-factory.ts` and `src/run/run-reward-flow.ts` as thin orchestration surfaces after the earlier extractions
- only touching `src/quests/world-node-engine.ts` when the extraction is behavior-preserving and coordinated with Agent 3

Expectations:

- preserve `window.ROUGE_*` browser contracts
- preserve the single-writer ownership rules in `app-engine`, `run-factory`, and `combat-engine`
- prefer extractions that create future seams, not just helper dumping
- keep behavior-preserving refactors small enough to review and land coherently on `master`

## Chunk 2: Test Surface Hardening

Clean up the highest-friction test surface without weakening it.

This includes:

- keeping the split `tests/app-engine*.test.ts` surface coherent and finishing any remaining suite cleanup
- keeping the tests validating compiled browser output, not a separate Node-only path
- reducing duplicate setup code across app-engine and combat-engine test surfaces where practical
- extracting reusable browser-loader or fixture helpers when they improve scanability

Expectations:

- preserve coverage of live browser-boundary behavior
- keep test intent easier to scan after the split than before it
- do not trade clarity for clever abstraction
- prefer a few explicit thematic suites over one giant helper maze

## Chunk 3: Lint And Quality Debt Reduction

Use the extraction work to reduce structural debt.

This includes:

- removing `eslint-disable max-lines` from touched modules where realistic
- tightening local typing or helper boundaries where current giant modules blur responsibilities
- avoiding new suppressions unless they are narrowly justified and documented
- tightening lint policy only when the repo can stay green after the change

Expectations:

- do not churn unrelated files just to make counts look better
- make measurable debt reduction in touched hotspots
- keep `npm run check` green throughout
- prefer deleting suppressions over replacing them with different blanket suppressions

## Chunk 4: Architecture Rule Maintenance

Turn the extraction work into lasting rules.

This includes:

- updating `docs/CODEBASE_RULES.md` when a new stable extraction seam is established
- updating `docs/APPLICATION_ARCHITECTURE.md` when domain boundaries materially improve
- documenting extraction triggers, ownership, or hotspot handling in `PROJECT_MANAGER.md` if the work changes how the team should land future refactors
- keeping the agent docs honest when a hotspot is no longer the right next target

Expectations:

- do not let the docs promise seams that the code does not actually have
- keep the docs short and operational, not aspirational

## First Pass Definition Of Done

The next completed Agent 4 batch should leave the repo in this shape:

- the current worktree is green again
- the compiled-browser app-engine test surface has a clear suite layout and shared harness ownership
- at least one runtime hotspot under `src/content` is materially smaller
- at least one touched `max-lines` suppression is removed or a cleaner follow-on removal path is documented
- the team docs describe the new seam accurately
- feature agents have a lower-conflict surface for their next work

## Deliverables

- at least one materially smaller runtime hotspot through extraction
- a cleaner and more maintainable outer-loop test surface
- reduced lint suppression debt in touched hotspots or a cleaner follow-on seam for the next suppression-removal pass
- updated architecture docs that match the new seams
- regression coverage proving the extraction preserved behavior

## Test And Landing Rule

- add or update automated coverage for any extracted behavior or changed test harness seam
- run `npm run check` before calling the batch complete
- do not stop at local edits or a green test run; finish by landing the work as coherent commit(s) directly on `master`
- no PR is required for this project unless the project manager changes the delivery rule later

## Collaboration Notes

- coordinate with Agent 1 before touching `src/ui/*` or shell-facing `src/app/*` files
- coordinate with Agent 2 before extracting progression/account hotspots they are actively changing
- coordinate with Agent 3 before extracting `src/quests/world-node-engine.ts` or other world-content files they are actively changing
- escalate hotspot sequencing to the project manager when an extraction touches a file already claimed by a feature batch
- prefer landing small architecture passes between larger feature batches if that reduces rebase pain on `master`

## Acceptance Criteria

- the extracted modules are easier to understand than the pre-extraction file
- browser/runtime behavior is unchanged except for intentional bug fixes
- the public browser contract remains stable
- touched lint suppressions are reduced or clearly justified
- `npm run check` passes

## Pickup Prompt

Build Rouge's next architecture batch as a repeating loop. Start from the now-centralized compiled-browser manifests in `tests/helpers/browser-harness.ts`, keep them as the only maintained boot-order source, and keep shrinking the largest remaining compiled-browser suites without weakening coverage. Treat `src/content/content-validator-world-paths.ts`, `src/content/content-validator-world-opportunities.ts`, and `src/content/content-validator-runtime-content.ts` as the stable private helper chain behind `src/content/content-validator.ts`, and do not let late-route validation or shared reward or grant helpers drift back into the public entry. Use the existing encounter-registry, run-domain, and item-domain helper chains as the owner-preserving extraction pattern, keep `window.ROUGE_*` and single-writer ownership intact, document helper boot order whenever it changes, and coordinate with Agent 3 on the first safe `world-node-engine.ts` helper extraction instead of attempting a giant rewrite. Keep `npm run check` green before landing coherent commits on `master`.
