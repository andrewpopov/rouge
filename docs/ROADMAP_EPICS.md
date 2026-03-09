# Roadmap Epics

Last updated: March 9, 2026.

Use this file as the short epic-level status map. For live implementation truth, defer to `docs/IMPLEMENTATION_PROGRESS.md`. For current agent pickup detail, defer to `docs/TEAM_WORKSTREAMS.md` and the `AGENT_*.md` files.

| Epic | Status | Owner | Current note |
|---|---|---|---|
| `ROUGE-1` Architecture And Code Quality | `active` | Agent 4 | Keep the compiled-browser harness stable, continue hotspot extractions, and codify the resulting seams. |
| `ROUGE-2` Progression, Economy, And Account Backbone | `active` | Agent 2 | Broaden account growth, archive or stash read models, and longer-horizon economy pressure on top of the live planning and convergence layer. |
| `ROUGE-3` World Content And Combat Depth | `active` | Agent 3 | Deepen late-route consequence fabrics, encounter breadth, and validation where authored content can still drift silently. |
| `ROUGE-21` Full Player-Facing Shell | `active` | Agent 1 | Extend the live hall, town, route, reward, and run-end continuity surfaces without redefining backend seams. |
| `ROUGE-25` Release Confidence And Test Quality | `implemented` | Agent 5 | `npm run quality`, `npm run test:coverage`, built-bundle smoke coverage, and harness drift protection are now live on `master`. |

## Near-Term Notes

- Agent 5's original `ROUGE-25` batch is complete; the next quality follow-on should expand browser smoke deeper into encounter, reward, act transition, and run summary surfaces.
- Browser-only boot scripts remain e2e-owned for now: `generated/src/content/seed-loader.js` and `generated/src/app/main.js`.
- The next roadmap re-scope should add explicit tickets for the post-landing Agent 5 follow-on instead of keeping the completed `ROUGE-26` to `ROUGE-28` batch as the active brief.
