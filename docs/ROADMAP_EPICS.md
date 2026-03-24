# Roadmap Epics

Last updated: March 9, 2026.

Use this file as the short epic-level status map. For live implementation truth, defer to `docs/IMPLEMENTATION_PROGRESS.md`.

| Epic | Status | Owner | Current note |
|---|---|---|---|
| `ROUGE-1` Architecture And Code Quality | `active` | Agent 4 | Keep the compiled-browser harness stable, continue hotspot extractions, and codify the resulting seams. |
| `ROUGE-2` Progression, Economy, And Account Backbone | `active` | Agent 2 | Broaden account review data, archive or stash read models, and longer-horizon economy pressure on top of the live third-wave planning and convergence layer. |
| `ROUGE-3` World Content And Combat Depth | `active` | Agent 3 | Deepen late-route consequence fabrics, encounter breadth, and validation where authored content can still drift silently. |
| `ROUGE-21` Account Meta Continuity | `implemented` | Agent 1 | The shared account-meta continuity board, charter or convergence drilldowns, and compiled-browser shell coverage are live on `master`. |
| `ROUGE-52` Expedition Launch And Town Prep Clarity | `implemented` | Agent 1 | The expedition launch runway and safe-zone before-or-after desk are live on `master`. |
| `ROUGE-68` Shell Surface Decomposition | `active` | Agent 1 | Break up the shell-owned hotspots first so future shell work stops colliding in `front-door-view`, `ui-common`, and the shell-heavy compiled-browser suites. |
| `ROUGE-25` Release Confidence And Test Quality | `implemented` | Agent 5 | `npm run quality`, `npm run test:coverage`, built-bundle smoke coverage, and harness drift protection are now live on `master`. |
| `ROUGE-29` Built-Bundle Smoke And Coverage Follow-Through | `implemented` | Agent 5 | Built-bundle smoke now reaches encounter, reward, act transition, run summary, and direct bad-seed boot failure, with coverage-driven shell and route backfill landed on `master`. |
| `ROUGE-56` Quality Artifact Trends And Restore Smoke | `implemented` | Agent 5 | `artifacts/quality/latest.md` now surfaces delta summaries and coverage headroom, built smoke adds a safe-zone restore permutation, and restore-path shell backfill is landed on `master`. |
| `ROUGE-64` Flake Stabilization And Browser Fault Injection | `implemented` | Agent 5 | Route-payoff replay guards, corrupted-storage browser fallback, and the artifact-driven regression backfill are live on `master`. |

## Near-Term Notes

- Agent 4's next batch is a dedicated quest/content large-file strike: `src/quests/world-node-catalog.ts` at roughly `9.6k` lines, then `src/content/game-content.ts` plus `src/state/persistence.ts`, then `src/combat/combat-engine.ts`.
- Agent 1's `ROUGE-21` and `ROUGE-52` batches are complete on `master`; the next shell batch is `ROUGE-68`, and `ROUGE-60` is parked until the shell files are smaller.
- Agent 5's `ROUGE-25`, `ROUGE-29`, `ROUGE-56`, and `ROUGE-64` batches are complete on `master`; the next quality pass should be promoted from Tira after a new gap appears.
- Browser-only boot scripts remain e2e-owned for now: `generated/src/content/seed-loader.js` and `generated/src/app/main.js`.
- Local quality-artifact history is now live under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots.
- The next Agent 1 follow-on should split `src/ui/front-door-view.ts`, `src/ui/ui-common.ts`, and the shell-heavy compiled-browser suites before resuming the parked resume-and-recovery feature pass.
- Agent 5 should keep the now-live artifact deltas and five-test built smoke baseline green while waiting on the next Tira-promoted release-confidence slice.
