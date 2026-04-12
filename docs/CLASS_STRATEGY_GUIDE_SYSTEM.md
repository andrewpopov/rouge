# Class Strategy Guide System

Last updated: April 11, 2026.

## Purpose

This document defines how Rouge should maintain per-class strategy source material that we can later turn into player-facing game guides.

These docs are not the same thing as the final game guide. They are the internal strategy briefs we keep current as the build evolves.

Use them for:

- class identity and archetype language
- intended build paths
- weapon and rune or runeword pairing notes
- boss-answer expectations
- “what this build is trying to do” explanations

Do not use them for:

- volatile exact balance numbers
- pretending an archetype is fully live if the runtime does not support it yet
- replacing current-build truth from implementation docs

## Source Of Truth Split

Keep these layers separate:

- Current build truth:
  - `docs/LIVE_MECHANICS_AND_BALANCE.md`
  - `src/rewards/reward-engine.ts`
  - `src/run/run-progression.ts`
  - `src/items/*`
  - `artifacts/balance/committed-ledger.md`
  - `docs/POWER_CALIBRATION.md`
  - `docs/IMPLEMENTATION_PROGRESS.md`
- Strategy design truth:
  - `docs/CLASS_IDENTITY_PATHS.md`
  - `docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md`
  - `docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md`
- Guide-source truth:
  - this document
  - `docs/CLASS_IDENTITY_PATHS.md`
  - `docs/strategy-guides/README.md`
  - `docs/strategy-guides/*.md`

If there is a conflict:

1. code and tests win for live behavior
2. balance artifacts win for latest sampled performance
3. strategy docs describe intended play pattern and future guide framing

## Document Set

Maintain these files:

- `docs/CLASS_IDENTITY_PATHS.md`
- `docs/strategy-guides/README.md`
- `docs/strategy-guides/amazon.md`
- `docs/strategy-guides/assassin.md`
- `docs/strategy-guides/barbarian.md`
- `docs/strategy-guides/druid.md`
- `docs/strategy-guides/necromancer.md`
- `docs/strategy-guides/paladin.md`
- `docs/strategy-guides/sorceress.md`

Each class doc should stay short enough to scan quickly, but rich enough that we can generate:

- a future player-facing class guide
- a build-path explainer
- a “how to draft this class” guide
- a boss-prep checklist

## Required Sections Per Class

Each class strategy source doc should include:

### 1. Live tracked archetypes

These should match the archetypes the reward engine and archetype-scoring model actually recognize.

### 2. Strategy snapshot

Brief answer to:

- what the class is trying to do
- what its main lanes are
- what its strongest strategic tension should feel like

### 3. Archetype briefs

For each archetype, document:

- identity
- core tree focus
- support tree focus
- preferred weapon families
- likely rune or runeword direction
- what the build needs to survive bosses
- common failure mode

### 4. Run-shaping signals

Document the early signs that a run is moving into that lane:

- first tree investments
- first good weapon families
- early reward patterns
- first key support pieces

### 5. Guide-generation notes

Document what the eventual player-facing guide should emphasize:

- deck plan
- weapon plan
- rune or runeword plan
- boss plan
- what to avoid

## Maintenance Rules

- Keep archetype names aligned with `src/rewards/reward-engine.ts`.
- If a lane is named in these docs, it should also exist in the archetype-aware balance suites as a committed lane target unless it is explicitly marked as a support or sub-lane.
- Prefer stable language over card-by-card lists when the exact card pool may still move.
- Only mention exact cards when they are central to the identity and likely to stay there.
- Call out uncertainty honestly if an archetype is intended but not yet fully validated in the simulator.
- Refresh these docs after:
  - reward-engine archetype changes
  - major class-card balance passes
  - weapon-family identity changes
  - rune or runeword strategy changes
  - boss-design passes that alter what a class must prepare for

## Recommended Update Workflow

1. Confirm the live archetypes in `src/rewards/reward-engine.ts`.
2. Check the latest lane snapshot in `artifacts/balance/committed-ledger.md` and the broader interpretation in `docs/POWER_CALIBRATION.md`.
3. Update the affected class strategy source doc.
4. Update `docs/strategy-guides/README.md` if the roster-wide framing changed.
5. Update `docs/PROJECT_MASTER.md` links only if the doc map changed.
6. Update `docs/LIVE_MECHANICS_AND_BALANCE.md` if the class meta shift changes the high-level doctrine or owner-doc routing.

## Current Status

As of April 11, 2026:

- the reward engine has live archetype tags and archetype score tracking
- reward screens now bias toward tracked archetype identity
- progression summaries and simulator outputs now expose dominant and secondary archetypes
- the balance orchestrator now supports both natural convergence suites and committed archetype suites
- named lanes can now be validated as full build targets instead of only being described in strategy docs
- the next step is to keep the per-class strategy source docs current as class balance and archetype support continue to improve
