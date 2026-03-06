# Next Sprint Plan

Documentation note:
- Start with `PROJECT_MASTER.md`.
- This is historical planning context and should not override the current master plan.

## Objective

Deepen run-to-run variety and deckbuilding decisions while keeping the current stable loop and test discipline.

Current baseline (February 2026):

- Sectors: 5
- Enemies: 12
- Cards: 20
- Upgrade paths: 4
- Tests: 68 passing
- `main.js`: 1981 lines (reduced via module extraction)

## Completed From Initial Plan

- Content Pack v1 shipped (`5` sectors, `12` enemies, `20` cards)
- Run structure v1 shipped (event/shop interludes + route branch option)
- Quest contracts v1 shipped (seeded chest/shrine/boss contracts with relic/stat/skill rewards)
- Onboarding v1 shipped (panel, dismiss/toggle, highlighted controls)
- Save/Resume v1 shipped (snapshot restore + corrupt fallback)
- Modularization progress landed:
  - runtime modules for progression, run-flow, HUD/UI, persistence, snapshots
  - catalog extraction (`enemy-catalog.js`, `card-catalog.js`)

## Current Biggest Gaps

1. Mid-run variety is improved by seeded stage nodes and quest contracts, but route branching and encounter-pool variety are still limited.
2. Deckbuilding depth is mostly numeric tuning; there are few interaction mechanics.
3. Meta progression is linear and capped to four paths with limited strategic tradeoff.
4. `main.js` still coordinates many concerns and should be reduced further.

## Scope (Next Sprint)

### 1) Encounter Variety v2

Deliver:

- Add encounter modifiers (e.g., armored wave, overheat storm, low-visibility telegraphs)
- Add at least 2 elite enemy templates with stronger intent patterns
- Add weighted sector enemy pools with per-run variation

Acceptance criteria:

- At least 3 distinct encounter modifier types are active in normal runs
- Elites appear predictably and are visible in UI preview/tooltip
- Add tests for modifier application + elite spawn validation

### 2) Card System Depth v2

Deliver:

- Add 6-8 new cards centered on interaction mechanics (not only damage/block scaling)
- Introduce at least one new card-level keyword with rules text and tests
- Add one targeted deck-thinning option in interludes or rewards

Acceptance criteria:

- New cards are available in reward flow and render correctly in UI
- Keyword behavior is deterministic and covered by tests
- Add tests for new keyword + reward integration

### 3) Meta Progression v2

Deliver:

- Add unlockable path tiers or branches beyond linear level-ups
- Persist unlock state with migration-safe defaults
- Surface clearer upgrade impact preview in reward/meta UI

Acceptance criteria:

- Existing saves migrate without breaking run start
- Upgrade choices produce observable run-start differences
- Add tests for persistence + migration + UI summary values

### 4) Main Loop Organization v2

Deliver:

- Extract at least one additional domain from `main.js` (recommended: turn orchestration or action wiring)
- Keep module-surface and script-order contract tests updated
- Maintain strict no-regression behavior in smoke and resume tests

Acceptance criteria:

- `main.js` reduced further while keeping runtime behavior stable
- No contract test drift after extraction
- Full suite remains green

## Quality Gates

- `npm test` must pass locally and in CI.
- Any new mechanic requires:
  - one positive-path test
  - one edge/fallback-path test
- Module extraction changes must update:
  - `tests/module-surface-contract.test.js`
  - `tests/script-order-contract.test.js`

## Exit Criteria

Sprint is complete when:

- Scope items 1-4 are shipped
- Test suite remains green
- No known P1 regressions in run progression, rewards, onboarding, or resume
