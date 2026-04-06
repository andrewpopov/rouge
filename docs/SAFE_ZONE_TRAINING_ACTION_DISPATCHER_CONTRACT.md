# Safe Zone Training Action Dispatcher Contract

_Snapshot: 2026-04-04_

## Purpose

This document defines the UI action contract for the safe-zone training screen.

It exists so the first implementation does not scatter training behavior across:

- generic `TownAction` buttons
- ad hoc DOM handlers
- hidden app-engine side effects

Use it with:

- [SAFE_ZONE_TRAINING_SCREEN_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_SCREEN_SPEC.md)
- [SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md)
- [SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md)

## Guiding Rules

1. Keep class-point spending on `use-town-action`.
2. Keep training browsing and selection out of `TownAction`.
3. Use `data-action` plus small `data-*` payloads, matching the existing dispatcher style.
4. Use app-engine methods for all training mutations that can fail.
5. Keep the training view open on failure and surface the error through the normal app error channel.

## Existing Dispatcher Pattern

The current dispatcher already follows a clear style:

- every clickable element uses `data-action`
- payloads are carried through `data-*`
- UI-only state changes mutate `appState.ui` directly and re-render
- stateful game mutations route through `appEngine`
- `Escape` closes context-specific overlays such as the spellbook and combat pile view

The training screen should follow that pattern instead of inventing a new one.

## Training Action Families

Split training actions into two groups.

### UI-only actions

These only mutate `appState.ui.trainingView` and then render:

- `open-training-view`
- `close-training-view`
- `select-training-tree`
- `select-training-skill`
- `select-training-slot`
- `set-training-compare`
- `clear-training-compare`
- `set-training-mode`

### Engine-backed actions

These call app-engine methods because they can fail, affect the run, or need validation:

- `unlock-training-skill`
- `equip-training-skill`
- `swap-training-skill`

Point spends remain here:

- `use-town-action`

That keeps the first implementation narrow and predictable.

## Action Table

### `open-training-view`

Purpose:

- open the training overlay from safe zone or act transition

Required dataset:

- `data-action="open-training-view"`

Optional dataset:

- `data-training-source="safe_zone" | "act_transition"`
- `data-tree-id="<treeId>"`
- `data-skill-id="<skillId>"`
- `data-slot-key="slot1" | "slot2" | "slot3"`

Behavior:

- call `appEngine.openTrainingView(...)`
- clear compare state unless an explicit compare target is provided later
- preserve current `townFocus` if launched from the sage overlay

### `close-training-view`

Purpose:

- close the training overlay without mutating run progression

Required dataset:

- `data-action="close-training-view"`

Behavior:

- call `appEngine.closeTrainingView(...)` or mutate UI through a thin wrapper
- keep `townFocus` consistent with the launch source

### `select-training-tree`

Required dataset:

- `data-action="select-training-tree"`
- `data-tree-id="<treeId>"`

Behavior:

- update selected tree
- if current selected skill is outside that tree, clear it
- leave `selectedSlot` untouched unless the UI explicitly wants slot-targeted browsing

### `select-training-skill`

Required dataset:

- `data-action="select-training-skill"`
- `data-skill-id="<skillId>"`

Optional dataset:

- `data-tree-id="<treeId>"`

Behavior:

- update selected skill
- optionally update selected tree when the skill card carries a tree hint

### `select-training-slot`

Required dataset:

- `data-action="select-training-slot"`
- `data-slot-key="slot1" | "slot2" | "slot3"`

Behavior:

- update `selectedSlot`
- do not auto-equip anything
- keep current selected skill so compare/equip buttons can react

### `set-training-compare`

Required dataset:

- `data-action="set-training-compare"`
- `data-compare-skill-id="<skillId>"`

Behavior:

- set compare target in UI state

### `clear-training-compare`

Required dataset:

- `data-action="clear-training-compare"`

Behavior:

- clear compare target only

### `set-training-mode`

Required dataset:

- `data-action="set-training-mode"`
- `data-training-mode="browse" | "unlock" | "equip" | "swap"`

Behavior:

- update mode hint only
- do not use this as a substitute for real validation

### `unlock-training-skill`

Required dataset:

- `data-action="unlock-training-skill"`
- `data-skill-id="<skillId>"`

Optional dataset:

- `data-tree-id="<treeId>"`

Behavior:

- call `appEngine.unlockTrainingSkill(...)`
- on success:
  - clear `state.error`
  - keep the overlay open
  - keep the unlocked skill selected
- on failure:
  - set `state.error`
  - keep the overlay open
  - keep current selection so the player can see what failed

### `equip-training-skill`

Required dataset:

- `data-action="equip-training-skill"`
- `data-skill-id="<skillId>"`
- `data-slot-key="slot1" | "slot2" | "slot3"`

Behavior:

- call `appEngine.equipTrainingSkill(...)`
- on success:
  - clear `state.error`
  - update slot rail immediately
- on failure:
  - set `state.error`
  - keep current compare and selection state

### `swap-training-skill`

Required dataset:

- `data-action="swap-training-skill"`
- `data-skill-id="<skillId>"`
- `data-slot-key="slot1" | "slot2" | "slot3"`

Optional dataset:

- `data-replaced-skill-id="<skillId>"`

Behavior:

- route through the same app-engine equip seam as a normal equip
- use the explicit swap action only when the UI wants swap-specific copy or button labels

## Dataset Naming Rules

Follow the current dispatcher style:

- IDs live in direct `data-*` keys
- no JSON blobs inside the DOM
- no compound serialized state

Preferred keys:

- `data-tree-id`
- `data-skill-id`
- `data-compare-skill-id`
- `data-slot-key`
- `data-training-source`
- `data-training-mode`

Avoid:

- `data-payload`
- `data-training-json`
- comma-separated multi-field strings

## Keyboard Contract

First implementation keyboard scope should stay small.

### `Escape`

Add one new rule:

- when `appState.ui.trainingView.open` is true and the user presses `Escape`, close the training view and re-render

This should sit beside the existing spellbook and combat-pile `Escape` handling in [action-dispatcher.ts](/Users/andrew/proj/rouge/src/ui/action-dispatcher.ts).

### Do not add yet

- arrow-key tree navigation
- hotkey slot swapping
- search/filter keyboard shortcuts

Those can come later once the screen is stable.

## Render Contract

### UI-only actions

- mutate `appState.ui.trainingView`
- call `render()`
- do not touch `state.error` unless they are closing the screen and the chosen policy is to clear notices

### Engine-backed actions

- call app-engine methods
- let app-engine set or clear `state.error`
- always call `render()` after the attempt

### Town spends

The training screen may still display:

- `progression_tree_<treeId>`
- `progression_attribute_<attribute>`
- `progression_spend_<track>`

Those remain:

- `data-action="use-town-action"`
- `data-town-action-id="..."`

That split is intentional.

## Error Contract

Training failures should reuse the normal notice surface that already reads from `appState.error`.

Examples:

- trying to unlock a non-eligible skill
- trying to equip a `Slot 3` skill before the slot is open
- trying to equip a capstone from a non-favored tree

Do not:

- swallow these failures silently
- close the screen on failure
- return success and rely on the player noticing no change

## First-Pass Non-Goals

Do not add dispatcher support yet for:

- drag-and-drop skill cards
- live combat skill activation
- right-click contextual menus
- cross-screen training launch from reward, combat, or world map

The first implementation only needs a clean safe-zone and act-transition training surface.
