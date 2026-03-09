# Roadmap Epics

Last updated: March 9, 2026.

Use this file as the short epic-level status map. For live implementation truth, defer to `docs/IMPLEMENTATION_PROGRESS.md`. For current agent pickup detail, defer to `docs/TEAM_WORKSTREAMS.md` and the `AGENT_*.md` files.

| Epic | Status | Owner | Current note |
|---|---|---|---|
| `ROUGE-1` Architecture And Code Quality | `active` | Agent 4 | Keep the compiled-browser harness stable, continue hotspot extractions, and codify the resulting seams. |
| `ROUGE-2` Progression, Economy, And Account Backbone | `active` | Agent 2 | Broaden account growth, archive or stash read models, and longer-horizon economy pressure on top of the live planning and convergence layer. |
| `ROUGE-3` World Content And Combat Depth | `active` | Agent 3 | Deepen late-route consequence fabrics, encounter breadth, and validation where authored content can still drift silently. |
| `ROUGE-21` Account Meta Continuity | `implemented` | Agent 1 | The shared account-meta continuity board, charter or convergence drilldowns, and compiled-browser shell coverage are live on `master`. |
| `ROUGE-52` Expedition Launch And Town Prep Clarity | `active` | Agent 1 | Turn the launch path into one expedition flow and add clearer before-or-after town-prep comparisons. |
| `ROUGE-25` Release Confidence And Test Quality | `implemented` | Agent 5 | `npm run quality`, `npm run test:coverage`, built-bundle smoke coverage, and harness drift protection are now live on `master`. |
| `ROUGE-29` Built-Bundle Smoke And Coverage Follow-Through | `implemented` | Agent 5 | Built-bundle smoke now reaches encounter, reward, act transition, run summary, and direct bad-seed boot failure, with coverage-driven shell and route backfill landed on `master`. |
| `ROUGE-56` Quality Artifact Trends And Restore Smoke | `active` | Agent 5 | Use artifact history to surface meaningful deltas, deepen restore-path smoke coverage, and drive the next regression backfill. |

## Near-Term Notes

- Agent 4's next batch is a dedicated large-file strike: `src/quests/world-node-engine.ts` at roughly `11.3k` lines, then `src/content/game-content.ts` plus `src/state/persistence.ts`, then `src/combat/combat-engine.ts`.
- Agent 1's `ROUGE-21` batch is complete on `master`; the next shell pass is `ROUGE-52`.
- Agent 5's `ROUGE-25` and `ROUGE-29` batches are complete on `master`; the next quality pass is `ROUGE-56`.
- Browser-only boot scripts remain e2e-owned for now: `generated/src/content/seed-loader.js` and `generated/src/app/main.js`.
- Local quality-artifact history is now live under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots.
- The next Agent 5 follow-on should use that history to drive quality deltas, restore-path smoke, and the next coverage-backed regression backfill beyond the current stable progression and targeted boot-failure checks.
