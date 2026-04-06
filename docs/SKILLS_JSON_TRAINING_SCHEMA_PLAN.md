# Skills JSON Training Schema Plan

_Snapshot: 2026-04-04_

## Purpose

This document defines how the live class-skill seed file should evolve from a Diablo II reference catalog into a Rouge-authored training and skill-bar catalog.

Primary file:

- [data/seeds/d2/skills.json](/Users/andrew/proj/rouge/data/seeds/d2/skills.json)

Primary runtime seam:

- [class-registry.ts](/Users/andrew/proj/rouge/src/character/class-registry.ts)

Use it with:

- [SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_TYPE_CHANGE_SPEC.md)
- [SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_IMPLEMENTATION_PLAN.md)
- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)

## Current Reality

The live `skills.json` file is already richer than the current TypeScript surface admits.

Today the file contains fields such as:

- `description`
- `skillType`
- `damageType`
- `active`
- `prerequisites`
- `synergies`

But the current typed runtime only normalizes:

- `id`
- `name`
- `requiredLevel`

That mismatch is why the training work needs an explicit schema plan.

## Design Decision

Keep `skills.json` as the runtime-loaded skill source.

Do not split skill-bar authoring into a second parallel file for the first implementation.

Reason:

- the runtime already loads and normalizes this file
- tree ownership already lives here
- starter, bridge, and capstone catalogs want to stay adjacent to the skill-tree source
- a second file would create cross-reference drift immediately

So the right model is:

- preserve the existing Diablo II reference fields
- add Rouge-owned training and bar-skill fields beside them

## What Should Stay

Preserve these existing reference-oriented fields where they already exist:

- `description`
- `skillType`
- `damageType`
- `active`
- `prerequisites`
- `synergies`

These are still useful for:

- flavor and provenance
- later class-guide copy
- possible future tooltip/reference surfaces
- keeping the D2 baseline visible inside the authored data

Do not delete them just because the runtime does not currently consume them deeply.

## What Rouge Needs To Add

### Class root

Each class entry should gain:

```json
{
  "classId": "amazon",
  "className": "Amazon",
  "starterSkillId": "amazon_call_the_shot",
  "trees": []
}
```

### Skill entry

Each skill entry should grow from:

```json
{
  "id": "amazon_magic_arrow",
  "name": "Magic Arrow",
  "requiredLevel": 1
}
```

to something like:

```json
{
  "id": "amazon_call_the_shot",
  "name": "Call the Shot",
  "requiredLevel": 1,
  "description": "Mark a target and steady the line.",
  "skillType": "command",
  "damageType": "physical",
  "active": true,
  "prerequisites": [],
  "synergies": [],
  "family": "command",
  "slot": 1,
  "tier": "starter",
  "cost": 1,
  "cooldown": 2,
  "summary": "Mark one enemy and ready the next ranged payoff.",
  "exactText": "Mark an enemy. Your next Bow or Javelin payoff this turn deals +6 damage.",
  "isStarter": true
}
```

Optional Rouge-only fields:

- `chargeCount`
- `oncePerBattle`

## Schema Rules

### Required Rouge-owned fields

Every bar-skill entry should author:

- `family`
- `slot`
- `tier`
- `cost`
- `cooldown`
- `summary`
- `exactText`

### Optional Rouge-owned fields

Only use when needed:

- `isStarter`
- `chargeCount`
- `oncePerBattle`

### Authoring rules

- `starterSkillId` must point to a `slot: 1`, `tier: "starter"` skill inside the same class entry
- `slot` must be `1`, `2`, or `3`
- `tier` must be `starter`, `bridge`, or `capstone`
- do not author unlock gates like favored-tree booleans or slot-level gates in the file
- do not author UI-only state in the file

Those are runtime rules, not seed content.

## Mapping Existing D2 Data To Rouge Skill Bars

We should be explicit that this is no longer a pure Diablo II mirror.

The new catalog is a Rouge-authored adaptation layer.

That means:

- some skill IDs may remain D2-derived
- some skill IDs may become Rouge originals
- the reference fields stay as historical or flavor context
- the bar-skill fields are the runtime truth for the new training system

This is acceptable and desirable.

We are not building a D2 encyclopedia.

We are building a Rouge skill catalog with D2 lineage.

## Normalization Contract In `class-registry.ts`

The registry should do four things with the enriched file.

1. Validate that the authoring shape is coherent.
2. Normalize to `RuntimeClassSkillDefinition`.
3. Normalize `starterSkillId` onto `RuntimeClassProgressionDefinition`.
4. Ignore fields that are still reference-only if the current runtime does not need them yet.

The registry should not:

- infer missing `family`, `slot`, or `tier` from guesses
- invent `starterSkillId` from tree order
- hide malformed skill authoring by silently defaulting everything

If a bar-skill field is required for the training screen, it should be authored directly.

## Recommended Authoring Strategy

Use a staged migration.

### Stage 1

Enrich the classes that already have completed skill-bar docs:

- Amazon
- Assassin
- Barbarian
- Druid
- Necromancer
- Paladin
- Sorceress

Only add fields for:

- one starter skill
- the approved bridge pool candidates
- the approved capstone pool candidates

### Stage 2

Validate normalization and training-screen rendering against those skills.

### Stage 3

Backfill richer authoring and non-bar reference cleanup later if needed.

That keeps the first implementation small and avoids turning this into a total data rewrite.

## What We Should Not Do

Do not:

- create a second hidden JSON file just for equipped-skill metadata
- derive skill-bar text from scattered docs at runtime
- leave starter ownership implicit
- keep `skills.json` as a pure reference file while the runtime reads another untracked source

Those approaches would make the content story harder to maintain.

## First Implementation Success Criteria

This schema plan is working when:

- one class entry can fully describe its starter, bridge, and capstone bar skills
- the registry can normalize those fields without hardcoded exceptions
- the validator catches malformed starter or slot/tier combinations
- the training screen can render directly from normalized content without doc lookups

That is the standard the first data pass should meet.
