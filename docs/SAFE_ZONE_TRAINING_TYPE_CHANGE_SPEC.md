# Safe Zone Training Type Change Spec

_Snapshot: 2026-04-04_

## Purpose

This document defines the exact type changes needed to implement the safe-zone training screen cleanly.

It focuses on:

- [content.d.ts](/Users/andrew/proj/rouge/src/types/content.d.ts)
- [run.d.ts](/Users/andrew/proj/rouge/src/types/run.d.ts)
- [api.d.ts](/Users/andrew/proj/rouge/src/types/api.d.ts)

It also notes the immediate follow-on touchpoints that must stay in sync:

- [run-state.ts](/Users/andrew/proj/rouge/src/run/run-state.ts)
- [run-factory.ts](/Users/andrew/proj/rouge/src/run/run-factory.ts)
- [run-progression.ts](/Users/andrew/proj/rouge/src/run/run-progression.ts)
- [save-migrations.ts](/Users/andrew/proj/rouge/src/state/save-migrations.ts)
- [class-registry.ts](/Users/andrew/proj/rouge/src/character/class-registry.ts)
- [content-validator-runtime-content.ts](/Users/andrew/proj/rouge/src/content/content-validator-runtime-content.ts)

Use it with:

- [SAFE_ZONE_TRAINING_SCREEN_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md)
- [SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md)
- [SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md)
- [SKILLS_JSON_TRAINING_SCHEMA_PLAN.md](/Users/andrew/proj/rouge/docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)

This is a type and contract spec, not an implementation patch.

## Guiding Rules

The type changes should preserve four rules.

1. Keep point spending on the existing town-action spine.
2. Persist only player-owned choices, not derived gate state.
3. Make the content catalog rich enough to render and validate bar skills directly.
4. Keep the first implementation small enough that migrations and UI can stay readable.

## What Must Change

### Current blocking gaps

Right now:

- `RuntimeClassSkillDefinition` only knows `id`, `name`, and `requiredLevel`
- `RunClassProgressionState` has no equipped-skill-bar state
- `AppState.ui` has no training-screen state

That means the training screen cannot cleanly answer:

- what slot a skill belongs to
- whether a skill is a starter, bridge, or capstone
- what the currently equipped bar is
- what the user is currently selecting or comparing in the training UI

## 1. `content.d.ts` Changes

### Add explicit skill-bar vocabulary

Add these shared type unions:

```ts
type SkillFamilyId =
  | "state"
  | "command"
  | "answer"
  | "trigger_arming"
  | "conversion"
  | "recovery"
  | "commitment";

type ClassSkillSlotNumber = 1 | 2 | 3;

type ClassSkillTier = "starter" | "bridge" | "capstone";
```

These types should live in [content.d.ts](/Users/andrew/proj/rouge/src/types/content.d.ts) because they belong to authored class-skill content.

### Extend `SkillSeedDefinition`

The seed-level class-skill type must grow so `skills.json` can actually author bar skills.

Current:

```ts
interface SkillSeedDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}
```

Recommended:

```ts
interface SkillSeedDefinition {
  id: string;
  name: string;
  requiredLevel: number;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  isStarter?: boolean;
  chargeCount?: number;
  oncePerBattle?: boolean;
}
```

### Extend `ClassSkillsSeedEntry`

Add:

```ts
starterSkillId: string;
```

This keeps `Slot 1` deterministic and avoids guessing it from tree order or skill rank.

### Extend `RuntimeClassSkillDefinition`

Current:

```ts
interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}
```

Recommended:

```ts
interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  isStarter?: boolean;
  chargeCount?: number;
  oncePerBattle?: boolean;
}
```

### Extend `RuntimeClassProgressionDefinition`

Current:

```ts
interface RuntimeClassProgressionDefinition {
  classId: string;
  className: string;
  trees: RuntimeClassTreeDefinition[];
}
```

Recommended:

```ts
interface RuntimeClassProgressionDefinition {
  classId: string;
  className: string;
  starterSkillId: string;
  trees: RuntimeClassTreeDefinition[];
}
```

### What should not change in `content.d.ts`

Do not add:

- slot-unlock levels per class
- favored-tree gate booleans
- bridge-ready or capstone-ready flags

Those are progression rules, not authored content.

## 2. `run.d.ts` Changes

### Add slot-key vocabulary

Add:

```ts
type RunSkillBarSlotKey = "slot1" | "slot2" | "slot3";
```

This is the run-owned slot language.

### Add equipped-bar state

Add:

```ts
interface RunEquippedSkillBarState {
  slot1SkillId: string;
  slot2SkillId: string;
  slot3SkillId: string;
}
```

### Extend `RunClassProgressionState`

Current:

```ts
interface RunClassProgressionState {
  favoredTreeId: string;
  primaryTreeId: string;
  secondaryUtilityTreeId: string;
  specializationStage: RunSpecializationStage;
  treeRanks: Record<string, number>;
  unlockedSkillIds: string[];
  archetypeScores: Record<string, number>;
  offTreeUtilityCount: number;
  offTreeDamageCount: number;
  counterCoverageTags: CounterTag[];
}
```

Recommended:

```ts
interface RunClassProgressionState {
  favoredTreeId: string;
  primaryTreeId: string;
  secondaryUtilityTreeId: string;
  specializationStage: RunSpecializationStage;
  treeRanks: Record<string, number>;
  unlockedSkillIds: string[];
  equippedSkillBar: RunEquippedSkillBarState;
  archetypeScores: Record<string, number>;
  offTreeUtilityCount: number;
  offTreeDamageCount: number;
  counterCoverageTags: CounterTag[];
}
```

### Semantic change for `unlockedSkillIds`

This field stays, but its meaning changes.

Old meaning:

- auto-derived skills allowed by level plus tree rank

New meaning:

- skills explicitly learned for bar use in this run

That means `eligible` should become derived, not persisted.

### What should not change in `run.d.ts`

Do not add persisted fields for:

- `slot2Unlocked`
- `slot3Unlocked`
- `bridgeReady`
- `capstoneReady`
- selected training-tree UI state

Those should stay derived or UI-owned.

## 3. `api.d.ts` Changes

### Add UI-state vocabulary

Add:

```ts
type TrainingViewSource = "" | "safe_zone" | "act_transition";

type TrainingViewMode = "browse" | "unlock" | "equip" | "swap";
```

### Add `TrainingViewState`

Add:

```ts
interface TrainingViewState {
  open: boolean;
  source: TrainingViewSource;
  selectedTreeId: string;
  selectedSkillId: string;
  compareSkillId: string;
  selectedSlot: "" | RunSkillBarSlotKey;
  mode: TrainingViewMode;
}
```

### Extend `AppState.ui`

Current `AppState.ui` owns town and inventory focus, but not training.

Add:

```ts
trainingView: TrainingViewState;
```

Recommended location:

- next to `townFocus` and other safe-zone / overlay UI state

### Add training-screen view-model interfaces

Because the training screen will likely be built by a shared model-builder and rendered by one or more UI modules, add explicit cross-module view-model types.

Recommended minimum:

```ts
type TrainingSkillStateId =
  | "starter"
  | "locked_by_level"
  | "locked_by_tree_points"
  | "locked_by_favored_tree"
  | "locked_by_slot"
  | "unlockable"
  | "unlocked"
  | "equipped";

interface TrainingSkillViewModel {
  skillId: string;
  treeId: string;
  name: string;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  state: TrainingSkillStateId;
  gateLabel: string;
  canUnlock: boolean;
  canEquip: boolean;
  isEquipped: boolean;
}

interface TrainingTreeViewModel {
  treeId: string;
  treeName: string;
  rank: number;
  isFavored: boolean;
  bridgeReady: boolean;
  capstoneReady: boolean;
  nextMilestoneLabel: string;
}

interface TrainingSlotViewModel {
  slot: RunSkillBarSlotKey;
  roleLabel: string;
  equippedSkillId: string;
  equippedSkillName: string;
  stateLabel: string;
  gateLabel: string;
}

interface TrainingScreenModel {
  classId: string;
  className: string;
  level: number;
  favoredTreeId: string;
  favoredTreeName: string;
  slots: TrainingSlotViewModel[];
  trees: TrainingTreeViewModel[];
  selectedTreeId: string;
  selectedSkillId: string;
  selectedSkill: TrainingSkillViewModel | null;
  compareSkill: TrainingSkillViewModel | null;
  candidateSkills: TrainingSkillViewModel[];
  skillPointsAvailable: number;
  classPointsAvailable: number;
  attributePointsAvailable: number;
  nextSlotGateLabel: string;
}
```

These belong in [api.d.ts](/Users/andrew/proj/rouge/src/types/api.d.ts) because they are shared UI/application contracts rather than raw content.

### Extend `AppEngineApi`

Current `AppEngineApi` already owns `useTownAction(...)`.

Add explicit training interactions:

```ts
openTrainingView(state: AppState, source?: TrainingViewSource): ActionResult;
closeTrainingView(state: AppState): ActionResult;
selectTrainingTree(state: AppState, treeId: string): ActionResult;
selectTrainingSkill(state: AppState, skillId: string): ActionResult;
unlockTrainingSkill(state: AppState, skillId: string): ActionResult;
equipTrainingSkill(state: AppState, slot: RunSkillBarSlotKey, skillId: string): ActionResult;
```

Why:

- these are not generic `TownAction` spends
- they need richer UI context and better error messages

### What should not change in `api.d.ts`

Do not add:

- a new app phase just for training
- a second progression API parallel to `RunFactoryApi`
- giant training-modal stacks in `AppState.ui`

## 4. No Change To `TownAction`

`TownAction` should stay unchanged for the first training implementation.

Reason:

- point spends already fit the current town-action card surface
- unlock/equip/swap interactions need richer compare state and should not be squeezed into generic merchant cards

So:

- keep `progression_tree_*`
- keep `progression_attribute_*`
- keep `progression_spend_*`
- add dedicated training actions beside them, not inside `TownAction`

## 5. Immediate Follow-On Code Changes

The type changes imply these exact follow-on updates.

### `run-state.ts`

- seed `equippedSkillBar`
- add default empty values for `slot2SkillId` and `slot3SkillId`

### `run-factory.ts`

- hydrate `equippedSkillBar`
- seed `slot1SkillId` from `starterSkillId` on new runs

### `save-migrations.ts`

- extend `ensureClassProgression(...)`
- migrate older runs with default `equippedSkillBar`
- preserve existing `unlockedSkillIds`

### `run-progression.ts`

- stop using `syncUnlockedClassSkills(...)` to overwrite learned skill IDs
- replace that behavior with:
  - `syncEligibleClassSkills(...)`
  - or a derived training-model helper

The exact function name can change.
The important part is the semantic change.

### `class-registry.ts`

- parse the richer skill seed fields
- validate `starterSkillId`

### `content-validator-runtime-content.ts`

Add validation for:

- `starterSkillId` exists
- each runtime class skill has valid `family`
- each runtime class skill has valid `slot`
- each runtime class skill has valid `tier`
- `cost` and `cooldown` are finite non-negative numbers
- exactly one starter skill resolves for the class starter path

## 6. Migration Contract

The safest first migration is conservative.

### Existing runs

For old runs:

- preserve `treeRanks`
- preserve `favoredTreeId`
- preserve existing `unlockedSkillIds`
- seed:

```ts
equippedSkillBar: {
  slot1SkillId: resolvedStarterSkillId,
  slot2SkillId: "",
  slot3SkillId: "",
}
```

This avoids deleting previously earned progression while still giving old runs a valid bar.

### Do not try to infer old bridge/capstone loadouts

That inference would be noisy and brittle.

Start clean for `Slot 2` and `Slot 3`.

## 7. Test Surface To Update

The exact type changes imply test updates in:

- app-engine progression tests
- snapshot restore tests
- content validation tests
- any future safe-zone training UI tests

Minimum cases:

- new run seeds `slot1SkillId`
- old snapshot migrates with default empty `slot2` and `slot3`
- class content without `starterSkillId` fails validation
- invalid `slot` or `tier` values fail validation
- explicit unlock state survives snapshot restore

## 8. Recommended Order

Implement these type changes in this order:

1. `content.d.ts`
2. `run.d.ts`
3. `api.d.ts`
4. `run-state.ts`
5. `save-migrations.ts`
6. `class-registry.ts`
7. `content-validator-runtime-content.ts`
8. `run-factory.ts`
9. `run-progression.ts`

That order keeps the type graph and migration seam stable while the UI is still being built.

## Bottom Line

The minimum viable type change set is small and clear:

- richer class-skill content
- one persisted equipped-skill-bar object
- one compact training-view UI object
- shared training-screen view-model types

Everything else should stay derived.

That keeps the system readable, migration-safe, and aligned with the training-screen spec instead of turning it into a second progression engine.

## Next Use

Use this doc to draft:

1. the first implementation task list with file-by-file code changes
2. the action-dispatcher contract for the training screen
3. the content-schema update plan for `skills.json`
