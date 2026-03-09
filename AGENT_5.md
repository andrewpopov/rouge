# Agent 5

## Mission

Own Rouge's release-confidence and automated-verification lane.

Your job is to keep the landed gate real: `npm run quality`, `npm run test:coverage`, the built-bundle smoke path, and the compiled-browser harness drift checks all need to stay trustworthy while feature work keeps landing.

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

The quality lane is live only if Rouge keeps all of these healthy at the same time:

- `npm run quality`
- `npm run test:coverage`
- the built-bundle browser smoke path
- the compiled-browser harness-to-bundle drift guard
- targeted backfill whenever coverage or smoke expose a new risk

## Current Baseline

Live now:

- `npm run lint`
- `npm run build`
- `npm run test:compiled`
- `npm run check`
- `npm run test:e2e`
- `npm run quality`
- `npm run test:coverage`
- a Playwright smoke pass against the shipped `dist/` bundle covering boot, front door, character select, safe zone, world map, saved-run restore, and the stable return-to-town path
- explicit coverage thresholds on the compiled-browser suite, with `generated/src/app/main.js` and `generated/src/content/seed-loader.js` deliberately owned by the e2e lane instead of the Node coverage lane
- a regression test that keeps `tests/helpers/browser-harness.ts` aligned with `index.html` so Agent 4's compiled-browser seam does not drift from the shipped bundle

Still weak:

- the smoke path stops at the outer-loop restore or return seam; encounter, reward, act-transition, and run-summary browser checks still lean mostly on compiled-browser tests
- browser-only boot failure states are covered indirectly; there is still room for a direct bad-seed or boot-error browser smoke assertion
- coverage output is console-first; there is not yet a persisted artifact history or trend report

## Immediate Next Batch

Build the next release-confidence pass on top of the landed gate:

- deepen the built-bundle smoke path into encounter, reward, act-transition, and run-summary checkpoints without making it flaky
- add direct browser checks for seed-loading and boot-error failure surfaces that are intentionally excluded from the Node coverage lane
- use coverage deltas to backfill the next high-risk shell, account, route, and harness seams instead of adding low-value assertion churn

## Current Assigned Batch

The original Agent 5 batch is landed:

- epic: `ROUGE-25` Release Confidence And Test Quality
- `ROUGE-26` Establish the full quality gate
- `ROUGE-27` Add coverage reporting and thresholds
- `ROUGE-28` Backfill missing regression and end-to-end coverage

Until the project manager assigns the next Tira ticket set, work this follow-on queue in order:

1. built-bundle smoke expansion
- keep using the shipped browser bundle instead of a Node-only shortcut
- add stable encounter, reward, act-transition, and run-summary checkpoints on top of the existing outer-loop smoke
- keep failure messages phase-specific

2. browser-only boot coverage
- keep `generated/src/app/main.js` and `generated/src/content/seed-loader.js` documented as e2e-owned
- add direct browser smoke for bad-seed or boot-error states before tightening that exclusion any further

3. coverage-driven backfill
- review the latest `npm run test:coverage` output after each meaningful landing
- prioritize shell continuity, account-read-model drift, route consequence drift, and harness drift before lower-value gaps
- add regression tests when the coverage output exposes new unprotected branches in recently touched seams

## Deliverables

- a stable `npm run quality` gate
- a stable `npm run test:coverage` gate
- a small, reliable built-bundle smoke path
- a maintained harness-to-bundle drift guard
- a running backlog of coverage-driven regression additions instead of deferred "test later" gaps

## Test And Landing Rule

- before the first code edit, first new test file, or first tooling change for a new ticket, move that ticket to `IN_PROGRESS` in Tira
- add or update automated coverage for every quality seam you change
- run `npm run quality` and `npm run test:coverage` before calling a quality batch complete
- do not mark a quality ticket `DONE` until the work is landed as coherent commit(s) on `master`, the gates are green, and docs are synced
- if only part of a ticket lands, leave it open and add a Tira comment describing what shipped and what remains

## Collaboration Notes

- coordinate with Agent 4 before touching `tests/helpers/browser-harness.ts`, shared manifest ownership, or browser bootstrap order
- coordinate with Agent 1 when smoke assertions depend on shell wording or navigation changes
- coordinate with Agent 2 when coverage gaps point at progression, economy, restore, or migration behavior
- coordinate with Agent 3 when coverage gaps point at route consequences, validation, or combat-content drift

## Acceptance Criteria

- Rouge keeps a dedicated release-confidence lane instead of a one-off quality batch
- `npm run quality` proves lint, build, compiled-browser tests, and built-bundle smoke together
- `npm run test:coverage` enforces explicit thresholds and documented exclusions
- the harness drift guard keeps the compiled-browser path aligned with the shipped bundle
- Agent 5 follow-on work is driven by real coverage or smoke gaps rather than generic QA language

## Pickup Prompt

Keep Rouge's release-confidence lane honest. Start from the live `npm run quality` and `npm run test:coverage` gates, then expand the built-bundle smoke suite deeper into the outer loop without forking the browser bootstrap path away from Agent 4's harness ownership. Use fresh coverage output to choose the next shell, account, route, or harness regression tests, and keep browser-only boot seams documented as e2e-owned until direct browser checks cover them cleanly.
