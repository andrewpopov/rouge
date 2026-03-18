# Rouge Tech Debt & Code Quality Plan

**Date:** 2026-03-18
**Status:** All actionable phases complete
**Scope:** Full codebase review — 140 files, ~48K lines

## Current Health

| Check | Status |
|-------|--------|
| Build | PASS — clean compilation |
| Tests | PASS — 258/258 |
| Lint | PASS — 0 errors |
| TS Strictness | `strict: false` — `noImplicitAny` on, `strictNullChecks` **off** |

## Completed

- **Phase 1** — Fixed dead ternary, stale version fallbacks, unsafe non-null assertion, drawCards self-reference and null guard
- **Phase 2** — Added 4 missing exploration event action dispatchers
- **Phase 3** — Deduplicated `slugify`, `parseInteger`, `isObject`, `hasTownFeature`, `getFocusedAccountTreeId` into `ROUGE_UTILS`. Consolidated `getUpgradableCardIds` (via `ROUGE_REWARD_ENGINE`), `getPreferredClassId` (via `__ROUGE_APP_ENGINE_RUN`), `CORE_TOWN_FEATURE_IDS` (via `__ROUGE_PROFILE_MIGRATIONS_DATA`). Net: -101 lines, 14 files touched.
- **Phase 3 (cont.)** — Replaced `Number.parseInt(String(...))` with `toNumber` across 16 files (28 occurrences). Deduplicated `getTrainingRankCount`, `getLevelForXp`, `getTrainingTrackForLevel`, `createDefaultTraining`, `createDefaultAttributes`, `createDefaultClassProgression` in `save-migrations.ts` (import from `ROUGE_RUN_STATE`). Deduplicated `sanitizePlannedRunewordId` in `persistence-core.ts` (import from `__ROUGE_PROFILE_MIGRATIONS_DATA`). Deduplicated `getPlanningSummary` in `item-system-rewards.ts` (import from `__ROUGE_ITEM_TOWN_PRICING`). Net: -237 additional lines across 25 files.
- **Phase 4.1** — Added `RewardChoiceEffectKind` union type (21 members) replacing `kind: string` on `RewardChoiceEffect`
- **Phase 4.3** — Typed `choiceBuilder` parameter in `catalog-opp-helpers.ts` with concrete factory signature
- **Phase 5.2** — Extracted `sharedOfferBonus` in vendor stock generation
- **Phase 5.3** — Replaced 9 sequential feature-flag `if` blocks with `PIVOT_FEATURE_LABELS` table
- **Phase 5.6** — Merged near-identical `buildTownActionCard`/`buildMercenaryActionCard` into shared `buildActionCard` helper
- **Phase 6.1** — Added card ID validation for `classStarterDecks` and `classRewardPools` tiers in content validator
- **Phase 5.5** — Extracted `renderAllySprite`, `renderEnemySprite`, `renderHandCard` from monolithic combat-view render function
- **Phase 6.2** — Added `__ROUGE_OPP_STAGING` completeness check for opportunity catalog load order
- **Phase 6.3** — Added `console.warn` when `getTreeArchetype` falls back to positional index
- **Phase 6.4** — Verified `sweeping_strike`/`multishot_plus` are intentional thematic variants in different reward pools
- **Phase 7.1** — Auto-fixed 39 lint errors (curly, template literals, prefer-const); remaining lint errors resolved
- **Phase 7.2** — Extracted magic numbers: `EVENT_PROBABILITY`, `THORNS_DAMAGE`, `REGENERATION_AMOUNT`
- **Phase 7.4** — Replaced inline `style="display:none"` tab visibility with CSS class `hall-tab--hidden`
- **Phase 7.5** — Exported `buildBadgeRow` in render-utils API and type declaration
- **Phase 7.6** — Added `aria-label` to non-interactive world map waypoints

## Remaining (deferred — larger scope or low ROI)

- **4.2** — Remove `[key: string]: unknown` index signatures on `HeroDefinition`/`MercenaryDefinition` — attempted and reverted, runtime properties are dynamically added
- **4.4** — ~30 `Record<string, any>` window properties → `Record<string, unknown>` — mechanical but large scope
- **4.5** — 19 `as unknown as Record<string, ...>` casts → `ItemBonusKey` union — requires type infrastructure
- **4.6** — Enable `strictNullChecks` — very large lift across entire codebase
- **5.1** — `pickProgressionChoice` 200+ lines complexity reduction — moderate risk for moderate gain
- **5.4** — `getVendorTierAllowance`/`getVendorRefreshCost` feature tables — different values per function makes shared table awkward
- **7.3** — Replace remaining static inline styles with CSS classes — scattered low-impact changes
- **3.5** — Consolidate `ACCOUNT_PROGRESSION_TREES` data — two copies have different shapes (slim migration vs full UI)

---

## Phase 1 — Critical Bugs

These are correctness issues that should be fixed immediately.

### 1.1 Dead ternary in `saveToStorage`
- **File:** `src/state/persistence.ts:212`
- **Problem:** Both branches of a ternary call `restoreSnapshot(snapshot)` identically — the conditional is inert and likely hides a serialization bug
- **Fix:** Determine original intent (likely `serializeSnapshot` on one branch) and correct

### 1.2 Stale schema version fallbacks
- **File:** `src/state/persistence-core.ts:11-12`
- **Problem:** Fallback values are `4` and `1`, but actual current versions are `5` and `8`. If migration modules fail to load, snapshots get tagged with wrong versions
- **Fix:** Update fallbacks to match `CURRENT_SCHEMA_VERSION` (5) and `CURRENT_PROFILE_SCHEMA_VERSION` (8)

### 1.3 Unsafe non-null assertion on `find()` result
- **File:** `src/ui/character-select-view.ts:114`
- **Problem:** `find()` returns `undefined` when no match, but `!` assertion will throw at runtime if `selectedClassId` is stale
- **Fix:** Replace `!` with a guard check, or pass the already-resolved `selectedClass` variable

### 1.4 `drawCards` self-references via global instead of closure
- **File:** `src/combat/combat-engine-turns.ts:387`
- **Problem:** Looks up `shuffleInPlace` via `runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS._shuffleInPlace` instead of closure — returns `undefined` if called before module assignment
- **Fix:** Reference `shuffleInPlace` directly by closure

### 1.5 `drawCards` pushes potentially `undefined` into hand
- **File:** `src/combat/combat-engine-turns.ts:397`
- **Problem:** `state.hand.push(state.drawPile.pop())` — `pop()` returns `T | undefined`
- **Fix:** Assign to variable, null-check before pushing

---

## Phase 2 — Functional Issues

### 2.1 Exploration event actions not dispatched
- **Files:** `src/ui/combat-view.ts:145,162,190,197` + `src/ui/action-dispatcher.ts`
- **Problem:** Buttons with `data-action="skip-event-card-pick"`, `"pick-event-choice"`, etc. have no corresponding `case` in the dispatcher switch. Clicking them silently does nothing.
- **Fix:** Add missing cases to `action-dispatcher.ts`

### 2.2 Direct state mutation bypassing app engine
- **File:** `src/ui/action-dispatcher.ts:220,253,278,287,349-364,403-415`
- **Problem:** ~6 places directly mutate `appState.ui.*`, `appState.combat.*`, and `run.*` instead of going through `appEngine` methods. The `debug-set-act` block is especially dangerous.
- **Fix:** Introduce `appEngine` methods for `setScrollMapOpen`, `setTownFocus`, `setSelectedEnemy`, and move debug-act logic into the engine layer

---

## Phase 3 — Shared Utilities (Deduplication)

The dominant tech debt pattern is **duplication forced by the IIFE module architecture**. The same helpers are redefined in 3-5 places because modules can't import from each other directly. Expanding `ROUGE_UTILS` is the fix.

### 3.1 Move to `ROUGE_UTILS` (or a new early-load shared module)

| Function | Duplicated In | Copies |
|----------|--------------|--------|
| `slugify` / `slugifyZone` | `run-state.ts`, `run-route-builder.ts`, `encounter-registry-builders-zones.ts`, `encounter-registry.ts`, `world-node-zones.ts` | 5 (**differing regex**: `/^_\|_$/` vs `/^_+\|_+$/`) |
| `parseInteger` | `combat-engine.ts`, `combat-modifiers.ts` | 2 (unsafe `value as string` cast) |
| `isObject` | `save-migrations.ts`, `profile-migrations-data.ts` | 2 |
| `hasTownFeature` | `item-town-pricing.ts`, `reward-engine-progression.ts`, `run-reward-flow.ts` | 3 |
| `getFocusedAccountTreeId` | `item-town-pricing.ts`, `reward-engine-progression.ts` | 2 |
| `sanitizePlannedRunewordId` | `persistence-core.ts`, `profile-migrations-data.ts` | 2 |
| `getPlanningSummary` (30-line fallback) | `item-town-pricing.ts`, `item-system-rewards.ts` | 2 |

### 3.2 Import from existing namespaces instead of redeclaring

| Function | Already Exported On | Duplicated In |
|----------|-------------------|---------------|
| `applyGuard` / `appendLog` | `__ROUGE_COMBAT_ENGINE_TURNS` | `combat-modifiers.ts` |
| `getUpgradableCardIds` | `ROUGE_EXPLORATION_EVENTS` | `reward-engine.ts` |
| `getPreferredClassId` | One of `app-engine-run` / `app-engine-profile` | The other |
| `getTrainingRankCount` | `ROUGE_RUN_STATE` | `save-migrations.ts`, `app-engine-run.ts`, `reward-view.ts`, `safe-zone-operations-view.ts` |
| `getLevelForXp` / `getTrainingTrackForLevel` | `ROUGE_RUN_STATE` | `save-migrations.ts`, `app-engine-run.ts` |
| `createDefaultTraining` / `createDefaultAttributes` | `ROUGE_RUN_STATE` | `save-migrations.ts`, `item-loadout.ts` |

### 3.3 Extract `Number.parseInt(String(effect.value || 0), 10) || 0` pattern
- **28 occurrences** across `reward-engine.ts`, `exploration-events.ts`, `reward-view-continuity.ts`
- `ROUGE_UTILS.toNumber` already exists — use it

### 3.4 Consolidate `CORE_TOWN_FEATURE_IDS`
- Defined in `persistence-core-data.ts`, `profile-migrations-data.ts`, `app-engine-run.ts` (3 places)
- Single source of truth needed

### 3.5 Consolidate `ACCOUNT_PROGRESSION_TREES` data
- Full copy in `persistence-core-data.ts`, stripped copy in `profile-migrations-data.ts`
- Adding a node requires editing both files

---

## Phase 4 — Type Safety

### 4.1 Add `RewardChoiceEffectKind` union type
- **File:** `src/types/run.d.ts:42`
- Replace `kind: string` with the 16+ known values so TypeScript catches missing switch cases
- Known values: `add_card`, `upgrade_card`, `hero_max_life`, `hero_max_energy`, `hero_potion_heal`, `mercenary_attack`, `mercenary_max_life`, `belt_capacity`, `refill_potions`, `gold_bonus`, `equip_item`, `add_socket`, `socket_rune`, `record_quest_outcome`, `record_quest_follow_up`, `record_quest_consequence`, `record_node_outcome`, `class_point`, `attribute_point`

### 4.2 Remove `[key: string]: unknown` index signatures
- **File:** `src/types/content.d.ts:88,100`
- `HeroDefinition` and `MercenaryDefinition` have index signatures that defeat property name checking
- These are redundant given explicitly-typed `baseStats: Record<string, unknown>` fields

### 4.3 Type `choiceBuilder` parameter properly
- **File:** `src/quests/catalog-opp-helpers.ts:66`
- Replace `(...args: unknown[]) => WorldNodeChoiceDefinition` with concrete factory signature

### 4.4 Reduce `Record<string, any>` window properties
- **File:** `src/types/ui.d.ts:354-474`
- ~30 properties typed as `Record<string, any>` — at minimum change to `Record<string, unknown>` to force narrowing
- Ideally create proper interface types for the most-used namespaces

### 4.5 Eliminate `as unknown as Record<string, ...>` casts
- 19 occurrences across `src/items/`, `src/content/`
- Define `ItemBonusKey` union and proper typed access patterns

### 4.6 Enable `strictNullChecks` (incremental)
- Currently off in `tsconfig.base.json`
- Enabling would surface many `undefined`-safety issues
- Can be done incrementally with `// @ts-expect-error` annotations on existing code

---

## Phase 5 — Complexity Reduction

### 5.1 `pickProgressionChoice` — 200+ lines, complexity ~30
- **File:** `src/rewards/reward-engine-progression.ts:119-327`
- Same zone-kind compound check repeated 12 times
- **Fix:** Extract `computeProgressionBonuses()`, `applyProgressionBonusEffects()`, `buildProgressionPreviewLines()`

### 5.2 `generateVendorStock` — 13 additive terms repeated 3x
- **File:** `src/items/item-town-vendor.ts:175-220`
- `weaponOfferCount`, `armorOfferCount`, `runeOfferCount` each sum 13 identical feature terms
- **Fix:** Extract `getEconomyOfferBonus(features, run): number` helper

### 5.3 `buildItemChoice` — 9 sequential feature-flag `if` blocks
- **File:** `src/items/item-system.ts:88-131`
- **Fix:** Define `ECONOMY_FEATURE_PREVIEW_LABELS` table, replace with loop

### 5.4 `getVendorTierAllowance` / `getVendorRefreshCost` — 15 features enumerated independently
- **Files:** `src/items/item-town-vendor.ts:34-53`, `src/items/item-town-pricing-fees.ts:131-153`
- **Fix:** `ECONOMY_FEATURE_TIERS` table shared between both functions

### 5.5 `combat-view.ts` render — ~200 lines
- **File:** `src/ui/combat-view.ts:266-464`
- **Fix:** Extract `renderEnemy()`, `renderCardFan()`, `renderAllySprites()`

### 5.6 `buildTownActionCard` / `buildMercenaryActionCard` — near identical
- **File:** `src/ui/render-utils.ts:202-241`
- **Fix:** Merge into `buildActionCard(action, options: { cardClass, bodyClass })`

---

## Phase 6 — Content Validation & Data Integrity

### 6.1 Validate card IDs in reward pools
- **Files:** `src/content/content-validator-runtime-content.ts`, `content-validator.ts`
- No validation that card IDs in `rewardPools`, `classStarterDecks`, `starterDeckProfiles` exist in `cardCatalog`
- A typo silently drops a card from reward selection

### 6.2 Validate `__ROUGE_OPP_STAGING` completeness
- Each opportunity catalog IIFE writes to a global staging object with no load-order enforcement
- A missed `<script>` tag silently produces an empty catalog slot
- **Fix:** Add completeness check in `world-node-catalog.ts` `getCatalog()`

### 6.3 `getTreeArchetype` fragile string matching
- **File:** `src/character/class-registry.ts:97-123`
- Falls back to positional index when no token matches — silent wrong archetype
- **Fix:** Add warning log when fallback is used

### 6.4 `sweeping_strike` / `multishot_plus` — identical mechanics, different IDs
- **File:** `src/content/game-content.ts`
- Both: cost 2, "Deal 6 damage to all enemies", `damage_all` value 6
- If intentional, add a comment; if not, consolidate

---

## Phase 7 — Cleanup & Polish

### 7.1 Fix lint errors (69 total)
- 30 `curly` errors in `scripts/extract-sprites.js` (auto-fixable)
- ~30 `no-unused-vars` in test files
- ~7 `prefer-template` in test files
- 2 `prefer-const` in test files
- All auto-fixable with `eslint --fix` + minor manual cleanup

### 7.2 Extract magic numbers to named constants
- `0.20` exploration event probability (`exploration-events.ts:133`)
- Mercenary bonus values `2`, `3` (`combat-engine-turns.ts:166-188`)
- NPC positions (`safe-zone-view.ts:100-107`)

### 7.3 Replace static inline styles with CSS classes
- `safe-zone-view.ts:156`, `front-door-view.ts:98,108-111,121,213-214`, `combat-view.ts:323,443`

### 7.4 Tab visibility via CSS class instead of inline style
- `front-door-view.ts:210` — `hide()` sets `style="display:none"` instead of toggling a class

### 7.5 Export `buildBadgeRow` in render utils API
- Already defined in `render-utils.ts:24`, just not exposed

### 7.6 Accessibility: add `aria-label` to non-interactive waypoints
- `world-map-view.ts:270-284` — cleared/locked zones are `<div>` with visual indicators invisible to screen readers
