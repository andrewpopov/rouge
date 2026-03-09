# Roadmap Epics

Last updated: March 9, 2026.

Use this file as the short epic-level status map. For live implementation truth, defer to `docs/IMPLEMENTATION_PROGRESS.md`. For current agent pickup detail, defer to `docs/TEAM_WORKSTREAMS.md` and the `AGENT_*.md` files.

Backlog rule:
- A `ROUGE-*` ticket is part of the active execution plan only if it is referenced here and on the owning `AGENT_*.md` sheet. Older `TODO` tickets that are not referenced are backlog parking-lot items, not current assignments.

| Epic | Status | Owner | Current note |
|---|---|---|---|
| `ROUGE-1` Architecture And Code Quality | `active` | Agent 4 | Keep the compiled-browser harness stable, continue hotspot extractions, and codify the resulting seams. |
| `ROUGE-2` Progression, Economy, And Account Backbone | `active` | Agent 2 | Broaden account growth, archive or stash read models, and longer-horizon economy pressure on top of the live planning and convergence layer. |
| `ROUGE-3` World Content And Combat Depth | `active` | Agent 3 | Deepen late-route consequence fabrics, encounter breadth, and validation where authored content can still drift silently. |
| `ROUGE-21` Account Meta Continuity | `implemented` | Agent 1 | The shared account-meta continuity board, charter or convergence drilldowns, and compiled-browser shell coverage are live on `master`. |
| `ROUGE-52` Expedition Launch And Town Prep Clarity | `implemented` | Agent 1 | The expedition launch runway and safe-zone before-or-after desk are live on `master`. |
| `ROUGE-60` Run Resume And Recovery Clarity | `active` | Agent 1 | Make saved-run resume cards and resumed safe-zone or reward states easier to understand. |
| `ROUGE-25` Release Confidence And Test Quality | `implemented` | Agent 5 | `npm run quality`, `npm run test:coverage`, built-bundle smoke coverage, and harness drift protection are now live on `master`. |
| `ROUGE-29` Built-Bundle Smoke And Coverage Follow-Through | `implemented` | Agent 5 | Built-bundle smoke now reaches encounter, reward, act transition, run summary, and direct bad-seed boot failure, with coverage-driven shell and route backfill landed on `master`. |
| `ROUGE-56` Quality Artifact Trends And Restore Smoke | `implemented` | Agent 5 | `artifacts/quality/latest.md` now surfaces delta summaries and coverage headroom, built smoke adds a safe-zone restore permutation, and restore-path shell backfill is landed on `master`. |
| `ROUGE-64` Flake Stabilization And Browser Fault Injection | `active` | Agent 5 | Stabilize the transient route-payoff flake, add the next browser-only failure smoke path, and land one more artifact-driven regression backfill. |

## Near-Term Notes

- Agent 4's next batch is a dedicated large-file strike: `src/quests/world-node-engine.ts` at roughly `11.3k` lines, then `src/content/game-content.ts` plus `src/state/persistence.ts`, then `src/combat/combat-engine.ts`.
- Agent 1's `ROUGE-21` and `ROUGE-52` batches are complete on `master`; the next shell pass is `ROUGE-60`.
- Agent 5's `ROUGE-25`, `ROUGE-29`, and `ROUGE-56` batches are complete on `master`; the next quality pass is `ROUGE-64`.
- Browser-only boot scripts remain e2e-owned for now: `generated/src/content/seed-loader.js` and `generated/src/app/main.js`.
- Local quality-artifact history is now live under `artifacts/quality/latest.md` plus rolling `artifacts/quality/*.json` snapshots.
- The next Agent 5 follow-on should use the now-live artifact deltas and restore-smoke baseline to stabilize the transient route-payoff flake, choose the next browser-only fault injection, and land the next coverage-backed regression backfill beyond the current stable progression and targeted boot-failure checks.
