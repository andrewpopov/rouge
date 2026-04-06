# Safe Zone Training Implementation Plan

_Snapshot: 2026-04-04_

## Purpose

This document is the file-by-file implementation handoff for the safe-zone training system.

Use it after reading:

- [SAFE_ZONE_TRAINING_SCREEN_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md)
- [SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md)
- [SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md)
- [SKILLS_JSON_TRAINING_SCHEMA_PLAN.md](/Users/andrew/proj/rouge/docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md)

This is the bridge from approved design to implementation work.

## Implementation Goal

Ship the first training screen without building a second progression system.

That means:

- class-point spending stays on the existing town-action rails
- skill unlock and equip flow becomes an explicit training-screen layer
- run state persists only player-owned choices
- content becomes rich enough to render bar skills directly

## Recommended Build Order

Build in this order:

1. content and type contracts
2. run-state defaults and migrations
3. progression semantics
4. app-engine and dispatcher actions
5. safe-zone UI and act-transition entry
6. tests and migration verification

Do not start with markup.

The hardest bugs here will come from data meaning drift, not from HTML.

## Phase 1: Content and Type Contracts

### [src/types/content.d.ts](/Users/andrew/proj/rouge/src/types/content.d.ts)

Add the content vocabulary defined in [SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md):

- `SkillFamilyId`
- `ClassSkillSlotNumber`
- `ClassSkillTier`
- expanded `SkillSeedDefinition`
- `starterSkillId` on `ClassSkillsSeedEntry`
- expanded `RuntimeClassSkillDefinition`
- `starterSkillId` on `RuntimeClassProgressionDefinition`

Important rule:

- keep slot unlock timing and favored-tree gates out of authored content

### [data/seeds/d2/skills.json](/Users/andrew/proj/rouge/data/seeds/d2/skills.json)

Apply the authoring plan from [SKILLS_JSON_TRAINING_SCHEMA_PLAN.md](/Users/andrew/proj/rouge/docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md):

- preserve D2 reference fields already in the file
- add Rouge-owned bar-skill fields
- add `starterSkillId` at each class root

First implementation scope:

- author the starter, bridge, and capstone catalog only for the classes we have already specified in docs
- do not try to invent later skill-tree depth beyond the current design set

### [src/character/class-registry.ts](/Users/andrew/proj/rouge/src/character/class-registry.ts)

Update normalization so runtime class progression carries the richer skill data.

Tasks:

- expand `normalizeSkillDefinition(...)`
- validate and normalize `family`, `slot`, `tier`, `cost`, `cooldown`, `summary`, `exactText`
- preserve existing sort behavior by `requiredLevel`, then name
- normalize `starterSkillId`
- expose the richer skill data through `getClassProgression(...)`

Do not:

- derive slot unlocks here
- auto-equip skills here

Registry responsibility should stay:

- content normalization
- light validation
- deterministic runtime shape

### [src/content/content-validator-runtime-content.ts](/Users/andrew/proj/rouge/src/content/content-validator-runtime-content.ts)

Add validation for the new authored fields.

Minimum checks:

- every class progression entry has a valid `starterSkillId`
- every `starterSkillId` points at a `slot: 1`, `tier: "starter"` skill in that class
- every skill has valid `family`, `slot`, `tier`, `cost`, and `cooldown`
- `oncePerBattle` and `chargeCount` stay optional but must be coherent when present

## Phase 2: Run-State Defaults and Migrations

### [src/types/run.d.ts](/Users/andrew/proj/rouge/src/types/run.d.ts)

Add:

- `RunSkillBarSlotKey`
- `RunEquippedSkillBarState`
- `equippedSkillBar` on `RunClassProgressionState`

Keep `unlockedSkillIds`, but implement its new semantic meaning from the type spec:

- explicitly learned skills for this run

### [src/run/run-state.ts](/Users/andrew/proj/rouge/src/run/run-state.ts)

Update default state construction.

Tasks:

- extend `createDefaultClassProgression()` with empty equipped slots
- use stable slot keys
- keep `slot1` empty at the raw default layer if the class starter is seeded later in run creation

Recommended default:

```ts
equippedSkillBar: {
  slot1SkillId: "",
  slot2SkillId: "",
  slot3SkillId: "",
}
```

### [src/run/run-factory.ts](/Users/andrew/proj/rouge/src/run/run-factory.ts)

Seed the class starter skill into the run on create and hydrate.

Tasks:

- on `createRun(...)`, look up the class progression definition
- seed `equippedSkillBar.slot1SkillId` from `starterSkillId`
- seed `unlockedSkillIds` with the starter skill
- on `hydrateRun(...)`, normalize missing equipped-slot state
- preserve existing unlocked skills from snapshots where present

Important rule:

- hydration should repair old saves safely, not silently wipe explicit unlocked skills

### [src/state/save-migrations.ts](/Users/andrew/proj/rouge/src/state/save-migrations.ts)

Add migration support for the richer class progression state.

Tasks:

- update `CURRENT_SCHEMA_VERSION`
- extend `ensureClassProgression(...)`
- normalize missing `equippedSkillBar`
- preserve existing `unlockedSkillIds`
- do not fabricate derived readiness flags

Migration rule:

- old saves should come forward with a starter in `slot1` if the class progression definition exists
- if the class catalog is unavailable, keep the slots empty instead of guessing badly

## Phase 3: Progression Semantics

### [src/run/run-progression.ts](/Users/andrew/proj/rouge/src/run/run-progression.ts)

This is the semantic pivot.

Right now `syncUnlockedClassSkills(...)` auto-derives `unlockedSkillIds` from tree ranks and level. That behavior must change.

Tasks:

- split `eligible` from `unlocked`
- add helpers that derive:
  - eligible skills
  - slot-2 availability
  - slot-3 availability
  - favored-tree state under the approved gating rules
- stop replacing `unlockedSkillIds` with auto-derived eligible skills
- keep tree-rank normalization and favored-tree cleanup

Recommended helper set:

- `getEligibleClassSkills(run, content)`
- `isSkillUnlockEligible(run, content, skillId)`
- `isTrainingSlotUnlocked(run, content, slot)`
- `canEquipSkillInSlot(run, content, skillId, slot)`

Update summary/reporting surfaces:

- progression summary should distinguish:
  - eligible skills
  - unlocked skills
  - equipped skills

Do not:

- hide the semantic change inside UI code

This logic belongs in progression/runtime code.

## Phase 4: App Engine and Dispatcher

### [src/types/api.d.ts](/Users/andrew/proj/rouge/src/types/api.d.ts)

Add:

- `TrainingViewSource`
- `TrainingViewMode`
- `TrainingViewState`
- `TrainingScreenModel` and related view-model types if shared across modules
- `AppEngineApi` methods for opening and mutating the training view

### [src/app/app-engine.ts](/Users/andrew/proj/rouge/src/app/app-engine.ts)

Add the training-screen mutation surface.

Recommended methods:

- `openTrainingView(state, source?)`
- `closeTrainingView(state)`
- `selectTrainingTree(state, treeId)`
- `selectTrainingSkill(state, skillId)`
- `setTrainingCompare(state, skillId)`
- `selectTrainingSlot(state, slot)`
- `unlockTrainingSkill(state, skillId)`
- `equipTrainingSkill(state, slot, skillId)`

Rules:

- UI-only mutations should not hit town services
- unlock/equip actions should set `state.error` on failure
- successful actions should clear `state.error`
- town point spends remain in `useTownAction(...)`

### [src/ui/action-dispatcher.ts](/Users/andrew/proj/rouge/src/ui/action-dispatcher.ts)

Implement the contract in [SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md).

Tasks:

- add click handlers for the training actions
- add `Escape` handling to close the training view
- keep training actions out of the generic `use-town-action` path except for class-point spends

Important split:

- `use-town-action`: spend point, heal, buy, hire, purge
- dedicated training actions: browse, compare, unlock, equip, swap

## Phase 5: UI and View Models

### [src/ui/safe-zone-operations-view-model.ts](/Users/andrew/proj/rouge/src/ui/safe-zone-operations-view-model.ts)

Add a small training summary seam:

- current slot occupancy
- next slot gate line
- favored-tree summary

This lets the existing safe-zone overview surface the training state before the full screen opens.

### [src/ui/safe-zone-view.ts](/Users/andrew/proj/rouge/src/ui/safe-zone-view.ts)

Integrate the training overlay entry.

Tasks:

- route the sage training card into `open-training-view`
- render training overlay shell when `appState.ui.trainingView.open`
- preserve existing `townFocus` ownership for the sage overlay

### [src/ui/safe-zone-view-merchant-presentation.ts](/Users/andrew/proj/rouge/src/ui/safe-zone-view-merchant-presentation.ts)

Keep `Bloodline Training` as the user-facing service label, but change its content from a flat card list into a screen entry surface.

Tasks:

- let the training card open the dedicated screen
- keep progression spend actions visible from the training surface, not duplicated everywhere in the merchant presentation

### [src/ui/act-transition-view.ts](/Users/andrew/proj/rouge/src/ui/act-transition-view.ts)

Add the secondary training entry.

Tasks:

- add `Training` CTA
- open the same training view with `source: "act_transition"`
- do not create a second implementation of the same screen

### New or shared training renderer

Prefer creating a focused renderer module instead of bloating an existing large UI file.

Recommended new file:

- `/Users/andrew/proj/rouge/src/ui/training-view.ts`

Possible responsibilities:

- `buildTrainingScreenModel(appState, content)`
- render slot rail
- render tree commitment panel
- render candidate list
- render compare/detail panel

## Phase 6: Tests

### Types and normalization

Add or extend tests around:

- class-skill normalization
- starter-skill ownership
- invalid slot/tier combinations

Likely files:

- `/Users/andrew/proj/rouge/tests/content-validator-runtime-content.test.ts`
- `/Users/andrew/proj/rouge/tests/app-engine-progression.test.ts`

### Progression semantics

Add tests for:

- eligible versus unlocked distinction
- `Slot 2` unlock rule
- `Slot 3` favored-tree rule
- starter skill seeding
- equip validation

Likely files:

- `/Users/andrew/proj/rouge/tests/app-engine-progression.test.ts`
- `/Users/andrew/proj/rouge/tests/run-factory.test.ts`
- `/Users/andrew/proj/rouge/tests/run-progression.test.ts`

### Save migration coverage

Add migration tests for:

- old snapshots without `equippedSkillBar`
- snapshots with stale `unlockedSkillIds`
- starter-skill backfill on hydrate

Likely file:

- `/Users/andrew/proj/rouge/tests/save-migrations.test.ts`

### Dispatcher and UI behavior

Add tests for:

- opening and closing the training view
- skill selection and compare state
- `Escape` closing behavior
- unlock/equip button wiring

Likely files:

- `/Users/andrew/proj/rouge/tests/app-engine-shell.test.ts`
- browser-style UI tests if the repo already uses them for shell interactions

## Non-Goals For The First Pass

Do not bundle these into the first implementation:

- in-combat skill-bar execution changes
- skill cooldown resolver changes
- class-resource redesign
- account-level skill unlock persistence
- dynamic drag-and-drop slot UI
- per-class slot timing exceptions

The first goal is a clean training unlock/equip surface.

## Recommended First Implementation Milestone

Call the first milestone done when all of these are true:

- the sage training screen opens from the safe zone
- `Slot 1` starter skill is seeded on new and migrated runs
- the screen can distinguish `eligible`, `unlocked`, and `equipped`
- `Slot 2` and `Slot 3` gates render correctly
- the player can unlock and equip one bridge skill and one capstone skill
- old saves migrate without losing progression

That is the smallest milestone that proves the design is real.
