# Agent 5

## Mission

Own Rouge's release-confidence and automated-verification lane.

Your job is not to run tests after the fact and report green or red. Your job is to make the repo prove that landed work is safe: linted, built, browser-tested, smoke-tested end to end, coverage-checked, and backfilled with missing tests when gaps show up.

This is a large vertical slice:

- lint and build verification
- compiled-browser regression coverage
- browser end-to-end smoke coverage
- coverage reporting and thresholds
- missing-test backfill across feature lanes

## Own These Areas

- `package.json` quality scripts
- `tests/e2e/*`
- quality-facing helpers under `tests/helpers/*` with Agent 4 coordination
- cross-cutting test additions in `tests/*.test.ts`
- quality-facing helper scripts under `scripts/*`
- quality-facing planning updates in `docs/ROADMAP_EPICS.md`, `docs/TEAM_WORKSTREAMS.md`, and `PROJECT_MANAGER.md`

## Do Not Own

- gameplay mechanics
- shell layout or presentation decisions
- progression or economy formulas
- route-content or combat design
- behavior-changing architecture refactors that belong to Agent 4

## Product Goal

Ship a repo that can justify landing work on `master`.

When this slice lands, Rouge should have a real quality gate:

- lint stays strict
- build stays reproducible
- compiled-browser tests stay authoritative
- end-to-end smoke coverage proves the main loop still boots and flows
- coverage reporting makes missing-test gaps visible
- missing-test follow-through gets owned instead of deferred

## Current Baseline

Live now:

- `npm run lint`
- `npm run build`
- `npm run test:compiled`
- `npm run check`
- Playwright is already installed in `package.json`
- the compiled-browser suite is the main regression surface

Still weak:

- there is no dedicated `test:e2e` browser smoke path yet
- there is no explicit coverage report or threshold gate yet
- there is no dedicated owner for turning new coverage gaps into missing tests
- the repo can pass `npm run check` without proving the shipped browser bundle still works through a real top-level flow

## Immediate Next Batch

Build the first dedicated release-confidence pass for Rouge:

- establish a real quality-gate command that covers lint, build, compiled-browser tests, and browser end-to-end smoke
- add coverage reporting and thresholds that make missing-test gaps visible instead of anecdotal
- use those results to backfill missing regression and smoke coverage across the newest shell, account, route, and harness seams
- coordinate with Agent 4 on browser-harness ownership instead of forking a second browser bootstrap path

This batch should make future landings safer immediately, not just add QA language to the docs.

## Current Assigned Batch

Land this batch in this order unless the project manager explicitly reorders it:

Epic and tickets:

- epic: `ROUGE-25` Release Confidence And Test Quality
- `ROUGE-26` Establish the full quality gate
- `ROUGE-27` Add coverage reporting and thresholds
- `ROUGE-28` Backfill missing regression and end-to-end coverage

1. `ROUGE-26` quality-gate pass
- add a real browser end-to-end smoke path on top of the shipped build instead of relying only on compiled-browser unit coverage
- wire a single top-level quality command that runs lint, build, compiled-browser tests, and end-to-end smoke coverage
- keep the smoke path focused on the real product loop: boot, front door, character select, safe zone, world map, and one stable return path

2. `ROUGE-27` coverage pass
- add explicit coverage reporting for the active runtime and test surface
- set thresholds or equivalent gating rules that are strict enough to catch drift but realistic enough to stay green while the repo is still growing
- document any justified temporary exclusions instead of hiding them in the tooling

3. `ROUGE-28` missing-test backfill pass
- use the new coverage output plus the latest agent batches to find real gaps
- add cross-cutting regression tests where the current feature lanes left important behavior implied instead of protected
- prioritize shell continuity, account-read-model drift, route consequence drift, and browser-harness drift before lower-value test churn

## Chunk 1: End-To-End Smoke Coverage

Turn the browser build into something we can smoke test like a product.

This includes:

- a Playwright-backed or equivalent browser e2e path
- a stable way to boot the built app for e2e runs
- smoke coverage for the main outer loop surfaces
- failure messages that point to the broken phase instead of generic browser errors

Expectations:

- keep the e2e layer small and reliable
- prove the shipped browser bundle works; do not replace it with a Node-only shortcut
- coordinate with Agent 4 before changing shared browser bootstrap ownership

## Chunk 2: Coverage Reporting And Thresholds

Make test depth measurable.

This includes:

- a repeatable coverage command
- thresholds or explicit fail conditions
- documented exclusions when a seam is intentionally not covered yet
- a clear signal for uncovered new work

Expectations:

- do not chase vanity numbers
- use coverage to direct missing tests, not to justify shallow assertions
- keep the reporting workflow simple enough that agents will actually run it

## Chunk 3: Missing-Test Backfill

Use the new quality tools to harden real behavior.

This includes:

- adding regression tests for recently expanded shell seams
- adding progression or economy coverage where read-model drift is still likely
- adding route or validation coverage where authored content can silently regress
- adding e2e smoke assertions when compiled-browser tests are not enough

Expectations:

- add tests with clear product or contract value
- do not rewrite feature code just to make testing easier unless the refactor is clearly behavior-preserving and coordinated

## Deliverables

- a dedicated Agent 5 quality lane
- a real `test:e2e` or equivalent browser smoke path
- a top-level quality command that includes lint, build, compiled-browser tests, and e2e
- explicit coverage reporting with thresholds or documented temporary exclusions
- a first wave of missing-test backfill driven by real gaps
- doc sync for the new quality gate and testing ownership

## Test And Landing Rule

- before the first code edit, first new test file, or first tooling change for a ticket, move that ticket to `IN_PROGRESS` in Tira
- add or update automated coverage for every quality seam you change
- run the current full quality gate before calling the batch complete
- do not mark `ROUGE-26`, `ROUGE-27`, or `ROUGE-28` `DONE` until the work is landed as coherent commit(s) on `master`, the gate is green, and docs are synced
- if only part of a ticket lands, leave it open and add a Tira comment describing what shipped and what remains
- do not stop at a local script or a one-off green run; finish by landing the quality work on `master`

## Collaboration Notes

- coordinate with Agent 4 before touching `tests/helpers/browser-harness.ts`, shared manifest ownership, or browser bootstrap order
- coordinate with Agent 1 when e2e assertions depend on shell wording or navigation
- coordinate with Agent 2 when coverage gaps point at progression, economy, restore, or migration behavior
- coordinate with Agent 3 when coverage gaps point at route consequences, validation, or combat-content drift

## Acceptance Criteria

- Rouge has a dedicated bot lane for release confidence
- the repo can run lint, build, compiled-browser tests, and end-to-end smoke through one repeatable workflow
- coverage reports exist and meaningfully direct missing-test work
- recent major seams have clearer regression protection than they do now
- `npm run check` still passes, and the new quality gate also passes once introduced

## Pickup Prompt

Build Rouge's release-confidence lane now. Start by turning the current `lint -> build -> test:compiled` baseline into a real quality gate with browser end-to-end smoke coverage on the built app, then add coverage reporting that makes missing-test gaps explicit. Use that output to backfill high-value tests across the newest shell, account, route, and harness seams. Coordinate with Agent 4 on shared browser bootstrap ownership, keep the smoke suite small and reliable, and do not call the batch done until the new gate is landed on `master`.
