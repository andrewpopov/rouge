# Safe Zone Training Runtime Model

_Snapshot: 2026-04-04_

## Purpose

This document maps the training-screen spec onto Rouge's current runtime.

It answers:

- what data already exists
- what runtime state is missing
- what should remain a `TownAction`
- what should become dedicated training-screen actions
- what content-model changes are required before the screen can be implemented cleanly

Use it with:

- [SAFE_ZONE_TRAINING_SCREEN_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md)
- [SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md)
- [SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_ACTION_DISPATCHER_CONTRACT.md)
- [SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md)
- [SKILLS_JSON_TRAINING_SCHEMA_PLAN.md](/Users/andrew/proj/rouge/docs/SKILLS_JSON_TRAINING_SCHEMA_PLAN.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [GAME_ENGINE_FLOW_PLAN.md](/Users/andrew/proj/rouge/docs/GAME_ENGINE_FLOW_PLAN.md)

This is an implementation-shaping design doc, not a claim that the runtime already supports the final system.

## Current Runtime: What We Already Have

The current runtime is closer than it first looks.

### Live state already present

In the current runtime we already have:

- safe zone as a real app phase
- sage-owned `Bloodline Training` service grouping
- class-tree ranks in `run.progression.classProgression.treeRanks`
- favored-tree tracking in `run.progression.classProgression.favoredTreeId`
- unlocked class skill IDs in `run.progression.classProgression.unlockedSkillIds`
- class-tree spend actions like:
  - `progression_tree_<treeId>`
  - `progression_attribute_<attribute>`
  - `progression_spend_<track>`
- safe-zone action routing through `appEngine.useTownAction(...)`
- safe-zone UI focus through `appState.ui.townFocus`

That means we do **not** need a new progression subsystem.

We need a better state model on top of the current one.

### Live constraints

The current runtime still has three important gaps:

1. `unlockedSkillIds` is currently auto-derived from tree rank and level.
2. There is no run-owned equipped-skill-bar state.
3. `RuntimeClassSkillDefinition` is too thin for bar-skill rendering.

Those are the main blockers.

## Key Runtime Decision

Keep the current progression spine.

Do **not** build a second progression system just for the training screen.

Recommended ownership split:

- `TownAction` remains the right surface for point spending and other simple town spends.
- a dedicated training-screen state model should own tree selection, skill selection, compare state, and slot intent.
- dedicated training actions should own unlock, equip, and swap operations.

That gives us:

- simple progression spends staying on the existing town-action rails
- richer skill-bar interactions without forcing them into the generic `TownAction` card format

## Current Runtime Surfaces

### App state

Current `AppState.ui` already owns:

- `townFocus`
- `inventoryOpen`
- `routeIntelOpen`
- run-summary step state

It does **not** yet own any training-screen-specific state.

### Run state

Current `RunClassProgressionState` owns:

- `favoredTreeId`
- `primaryTreeId`
- `secondaryUtilityTreeId`
- `specializationStage`
- `treeRanks`
- `unlockedSkillIds`
- `archetypeScores`
- off-tree counters

It does **not** yet own:

- equipped skill slots
- explicit slot-unlock history
- explicit learned-versus-eligible distinction

### Content model

Current `RuntimeClassSkillDefinition` only owns:

- `id`
- `name`
- `requiredLevel`

That is not enough to render or validate a skill-bar screen.

## Recommended Content Model Changes

The current `skills.json` progression catalog needs to grow from a tree-rank list into a bar-skill catalog.

### Extend `RuntimeClassSkillDefinition`

Add:

- `family`
- `slot`
- `tier`
- `cost`
- `cooldown`
- `summary`
- `exactText`
- `isStarter`
- optional `chargeCount`
- optional `oncePerBattle`

Recommended target shape:

```ts
interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
  family: SkillFamilyId;
  slot: 1 | 2 | 3;
  tier: "starter" | "bridge" | "capstone";
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  isStarter?: boolean;
  chargeCount?: number;
  oncePerBattle?: boolean;
}
```

### Add class-level starter ownership

Each class progression definition should also expose:

- `starterSkillId`

This keeps `Slot 1` deterministic and avoids guessing it from tree order.

### Why this matters

Without this change the training screen would need to stitch together:

- doc-only skill specs
- live tree catalog
- ad hoc UI lookup tables

That would drift quickly and be hard to validate.

## Recommended Run-State Changes

### 1. Keep `treeRanks`

No change needed.

This remains the source of investment truth.

### 2. Change the meaning of `unlockedSkillIds`

Current meaning:

- auto-derived skills available because the tree rank and level allow them

Recommended meaning:

- skills the player has explicitly unlocked for bar use in this run

Important implementation rule:

- stop auto-populating `unlockedSkillIds` directly from tree rank
- derive `eligibleSkillIds` in the training model instead

This is the biggest semantic shift in the runtime model.

It is the right one because the new system needs:

- `eligible`
- `unlocked`
- `equipped`

Those are different states.

### 3. Add equipped slot state

Recommended addition to `RunClassProgressionState`:

```ts
equippedSkillBar: {
  slot1SkillId: string;
  slot2SkillId: string;
  slot3SkillId: string;
}
```

Rules:

- `slot1SkillId` should be seeded at run creation from `starterSkillId`
- `slot2SkillId` starts empty
- `slot3SkillId` starts empty

### 4. Do not persist derived gate state

Do **not** persist:

- `slot2Unlocked`
- `slot3Unlocked`
- `bridgeReady`
- `capstoneReady`

Those should be derived from:

- level
- tree ranks
- favored tree
- unlocked bridge skills

Persist only player-owned choices.

## Recommended UI-State Additions

Add a compact training-screen UI subtree under `AppState.ui`.

Recommended shape:

```ts
trainingView: {
  open: boolean;
  source: "" | "safe_zone" | "act_transition";
  selectedTreeId: string;
  selectedSkillId: string;
  compareSkillId: string;
  selectedSlot: "" | "slot1" | "slot2" | "slot3";
  mode: "browse" | "unlock" | "equip" | "swap";
}
```

### Why this is enough

This covers:

- whether the screen is open
- which tree the user is inspecting
- which skill the detail panel is showing
- whether the user is comparing against an equipped skill
- which slot is being targeted
- which action mode the footer should show

Do not add:

- deep modal stacks
- many nested confirmation states
- tree graph camera position

Keep the first implementation simple.

## Derived Training Screen Model

Do not render directly from raw run state.

Build a derived training-screen model.

Recommended function:

```ts
buildTrainingScreenModel(appState, content): TrainingScreenModel
```

That model should compute:

- current slot summary
- current favored tree
- per-tree gate status
- per-skill state:
  - `starter`
  - `locked_by_level`
  - `locked_by_tree_points`
  - `locked_by_favored_tree`
  - `locked_by_slot`
  - `unlockable`
  - `unlocked`
  - `equipped`
- compare target if the selected skill would replace an equipped one

### Important derived sets

The model should compute these sets explicitly:

- `eligibleSkillIds`
- `unlockableSkillIds`
- `equippableSkillIds`
- `equippedSkillIds`

That avoids overloading one field with several meanings.

## Action Surface Recommendation

### Keep these as `TownAction`

These fit the existing town-action card model and should stay there:

- spend skill point on training drills
- spend class point in a tree
- spend attribute point
- open the training screen from the sage service

### Do not force these into `TownAction`

These need richer selection and compare context:

- unlock a specific bridge or capstone skill
- equip a skill into `Slot 2`
- equip a skill into `Slot 3`
- swap an equipped bridge or capstone
- close the training screen
- change tree selection or detail selection

These should be dedicated training actions handled by the action dispatcher and app engine.

## Recommended Training Action IDs

UI-only:

- `open-training-screen`
- `close-training-screen`
- `select-training-tree`
- `select-training-skill`
- `select-training-slot`
- `set-training-compare`

Run-mutating:

- `unlock-training-skill`
- `equip-training-skill`
- `swap-training-skill`

Recommended payload style:

- `data-tree-id`
- `data-skill-id`
- `data-slot`

Do not encode everything into one opaque string if avoidable.

The current dispatcher already supports dataset-driven actions cleanly.

## App-Engine Ownership

Recommended split:

### Action dispatcher

Owns:

- opening and closing the training screen
- updating `ui.trainingView`
- sending unlock/equip/swap commands to the app engine

### App engine

Owns:

- validating whether training actions are legal in the current phase
- mutating run-owned unlock/equip state
- persisting the run snapshot after training changes

### Run progression helpers

Own:

- gate checks
- favored-tree calculation
- eligible-skill calculation
- migration-safe seeding of slot state

### Town services

Continue to own:

- point-spend actions
- sage services unrelated to skill equip flow

## Validation Rules

Training actions should validate these rules centrally:

- only in `safe_zone` or `act_transition`
- `Slot 2` skill must have `slot = 2`
- `Slot 3` skill must have `slot = 3`
- the skill must be in the selected class's progression catalog
- the skill must satisfy level gate
- the skill must satisfy tree-point gate
- capstones must satisfy favored-tree rules
- equip target must be compatible with the slot

Return clear player-facing errors.

Do not silently fail.

## Migration Rules

This system touches persistence, so the migration plan matters.

### Required migration changes

1. add `equippedSkillBar` defaults
2. seed `slot1SkillId` from the class starter for existing runs if possible
3. preserve existing `treeRanks`
4. preserve existing `favoredTreeId`

### Compatibility rule for `unlockedSkillIds`

Because its meaning changes, migration should be conservative.

Recommended first-pass migration:

- keep existing `unlockedSkillIds`
- filter them to skills still present in the class catalog
- treat them as already learned on older runs

That avoids stripping player progress when the training screen goes live.

## First Playable Implementation Scope

The first implementation should be smaller than the full target model.

Ship in this order:

1. add catalog fields needed to render starter/bridge/capstone skills
2. add `equippedSkillBar` to run state and migrations
3. add `ui.trainingView`
4. build `TrainingScreenModel`
5. add the safe-zone training overlay
6. keep point-spend actions in `TownAction`
7. add unlock/equip/swap training actions
8. persist and restore the new state

Do not block the first implementation on:

- account-wide starter variants
- refund flows
- capstone-specific charge systems
- advanced compare visualizations

## Tests To Add

### State and migration

- new runs seed `slot1SkillId`
- old snapshots migrate cleanly with default slot state
- unlocked skill IDs survive save and restore

### Gate behavior

- `Slot 2` unlocks only at `Level 6+` with `3+` tree points
- `Slot 3` unlocks only at `Level 12+` with favored-tree rules
- tied trees block capstone access

### Equip behavior

- bridge skills only equip into `Slot 2`
- capstones only equip into `Slot 3`
- swapping persists through save and restore

### UI behavior

- opening the sage training overlay populates the correct tree by default
- selecting a tree updates the candidate list
- selecting a skill updates the detail panel

## Bottom Line

The runtime path is straightforward if we keep the ownership clean:

- `TownAction` for generic point spending
- training-screen UI state for browsing and comparison
- run-owned learned/equipped skill state
- derived gate logic instead of persisting gate booleans

The two biggest implementation truths are:

1. the skill catalog needs richer fields
2. `unlockedSkillIds` must stop meaning only "auto-derived from tree rank"

Once those are fixed, the rest fits naturally into the current safe-zone architecture.

## Next Use

Use this doc to draft:

1. the training-screen action dispatcher contract
2. the first implementation task list across app engine, run progression, and safe-zone UI
3. the content-schema update plan for `skills.json`
