# Sprint 2 Backlog (March 2026)

## Baseline Snapshot

- Tests: `123/123` passing
- Sectors: `5`
- Enemy templates: `12`
- Cards: `20`
- Artifacts: `3`
- Upgrade paths: `4` (+ tier unlocks)
- Current highlights shipped:
  - weighted sector pools + elites
  - encounter modifiers
  - reward artifacts + rarity UI
  - reward intel (elite risk + likely threat odds)
  - save/resume + onboarding + interludes

## Sprint Objective

Increase run variety and deckbuilding depth while keeping stability (`npm test` green, no resume/onboarding regressions).

## Priority Backlog

| ID | Priority | Area | Deliverable | Estimate | Acceptance Criteria |
|---|---|---|---|---|---|
| S2-01 | P0 | Card Mechanics | Add `6` new cards with at least `1` new keyword mechanic (not numeric-only scaling). | 2-3 days | New keyword is deterministic, visible in card text, and has unit + integration coverage. |
| S2-02 | P0 | Artifact Depth | Add `4-6` new artifacts (offense/defense/economy split) with rarity + weight tuning. | 1-2 days | Artifact rewards remain mixed with card/upgrade flow; no duplicate artifact ownership; tests pass. |
| S2-03 | P0 | Enemy Variety | Add `2` new enemy templates and at least `1` elite intent cycle beyond current patterns. | 2 days | Enemies appear in configured sectors, render in UI, and have intent/telegraph tests. |
| S2-04 | P0 | Reward UX | Threat chip tooltip in reward intel showing intent family and danger tags (e.g. `lob`, `sweep`, `aim`). | 1 day | Hover/focus on chip shows correct description and lane impact hints; UI tests added. |
| S2-05 | P1 | Route Variety | Expand interlude/event pool and add one additional branch point or dynamic event roll. | 1-2 days | Route can diverge in at least `2` places per run seed; tests validate branching behavior. |
| S2-06 | P1 | Meta Progression | Add branch-style meta choices (non-linear unlock decision) with migration-safe defaults. | 2-3 days | Legacy saves migrate cleanly; choices create observable run-start differences; tests added. |
| S2-07 | P1 | Code Organization | Extract one more domain from `main.js` (target: reward intel or turn orchestration). | 1-2 days | `main.js` shrinks, module-surface + script-order contracts updated, full suite green. |
| S2-08 | P2 | Balance/Telemetry | Add lightweight run telemetry summary for playtest balancing (card pick rates, artifact pick rates). | 1 day | Data recorded per run and surfaced in run summary/debug safely; tests for schema defaults. |
| S2-09 | P2 | Release Readiness | Add release checklist + versioned changelog flow for playtest drops. | 0.5 day | Documented process exists and is repeatable; no runtime impact. |

## Recommended Execution Order

1. `S2-01` Card mechanics
2. `S2-03` Enemy variety
3. `S2-02` Artifact depth
4. `S2-04` Reward UX tooltip
5. `S2-05` Route variety
6. `S2-06` Meta branches
7. `S2-07` Main loop extraction
8. `S2-08` Telemetry
9. `S2-09` Release readiness

## Scope Guardrails

- Every new mechanic requires:
  - `1` positive-path test
  - `1` edge/fallback-path test
- Any module extraction must update:
  - `tests/module-surface-contract.test.js`
  - `tests/script-order-contract.test.js`
- Avoid introducing unbounded complexity in a single sprint item; split into follow-up tasks when needed.

## Definition of Done (Sprint 2)

- `S2-01` through `S2-07` complete
- Full test suite remains green
- No known P1 regressions in run flow, rewards, onboarding, or resume
- Balance pass completed on at least `10` manual playtest runs
