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
- a Playwright smoke pass against the shipped `dist/` bundle covering boot, front door, character select, safe zone, world map, encounter, reward, act transition, run summary, saved-run restore, the stable return-to-town path, and a direct bad-seed boot-failure path
- explicit coverage thresholds on the compiled-browser suite, with `generated/src/app/main.js` and `generated/src/content/seed-loader.js` deliberately owned by the e2e lane instead of the Node coverage lane
- a regression test that keeps `tests/helpers/browser-harness.ts` aligned with `index.html` so Agent 4's compiled-browser seam does not drift from the shipped bundle

Still weak:

- the browser smoke lane still samples one stable progression path plus one targeted boot-failure path; broader restore permutations and richer browser-only fault injection still lean mostly on compiled-browser tests
- coverage output is console-first; there is not yet a persisted artifact history or trend report

## Immediate Next Batch

The `ROUGE-29` follow-through batch is landed on `master`.

Until the project manager assigns the next explicit Tira batch, keep the quality lane moving with this follow-on queue:

- turn the console-only quality and coverage output into persisted artifact history or trend reporting
- widen browser-only fault injection only where the shipped bundle still owns behavior that compiled-browser tests cannot see cleanly
- keep using fresh coverage output to backfill the next high-risk shell, account, route, and harness seams instead of adding low-value assertion churn

## Current Assigned Batch

The original Agent 5 batch is landed on `master`:

- epic: `ROUGE-25` Release Confidence And Test Quality
- `ROUGE-26` Establish the full quality gate
- `ROUGE-27` Add coverage reporting and thresholds
- `ROUGE-28` Backfill missing regression and end-to-end coverage

The next batch is also landed on `master`:

Epic and tickets:

- epic: `ROUGE-29` Built-Bundle Smoke And Coverage Follow-Through
- `ROUGE-30` Expand built-bundle smoke through encounter, reward, act transition, and run summary
- `ROUGE-31` Add browser-only boot and bad-seed smoke coverage
- `ROUGE-32` Add coverage-driven regression backfill across shell, account, route, and harness seams

- `ROUGE-30` expanded built-bundle smoke through encounter, reward, act transition, and run summary
- `ROUGE-31` added direct browser-only boot and bad-seed smoke coverage
- `ROUGE-32` backfilled shell continuity and late-route regression coverage from fresh coverage output

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
- do not mark a future quality ticket `DONE` until the work is landed as coherent commit(s) on `master`, the gates are green, and docs are synced
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

Keep Rouge's release-confidence lane honest. Start from the live `npm run quality` and `npm run test:coverage` gates plus the shipped-bundle smoke path through encounter, reward, act transition, run summary, and direct bad-seed boot failure. Keep browser-only seams documented as e2e-owned until any further fault-injection coverage lands cleanly, add persisted quality-artifact history when it materially improves release tracking, and use fresh coverage output to choose the next shell, account, route, or harness regression tests.
