# Non-Character Art Backlog

Last updated: March 29, 2026.

Documentation note:
- Start with [PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md).
- Use [BLOOD_ROGUE_VISUAL_IDENTITY.md](/Users/andrew/proj/rouge/docs/BLOOD_ROGUE_VISUAL_IDENTITY.md) for the canonical quality bar and style direction.
- Use [SPRITE_GENERATION_BACKLOG.md](/Users/andrew/proj/rouge/docs/SPRITE_GENERATION_BACKLOG.md) for the completed enemy, boss, portrait, and mercenary cutout pipeline.

## Purpose

The character-side `rouge-art` rollout is complete. This document tracks the remaining non-character art buckets that still matter to the live runtime:

- item equipment art
- rune art
- scenic combat background art

This is a separate queue on purpose. These surfaces do not share the same import path or manifest model as the finished character and monster backlog.

## Current Runtime Reality

Important implementation truth:

- item and rune art are still wired directly through [asset-map-data.ts](/Users/andrew/proj/rouge/src/content/asset-map-data.ts)
- combat backgrounds are wired by zone-title matching through [combat-backgrounds.ts](/Users/andrew/proj/rouge/src/content/combat-backgrounds.ts)
- there is no `rouge-art` override manifest yet for items, runes, or backgrounds

That means the next art pass is a direct-replacement workflow:

1. generate a batched sheet
2. split it into labeled PNGs
3. review outputs
4. replace or add the target files
5. update [asset-map-data.ts](/Users/andrew/proj/rouge/src/content/asset-map-data.ts) if filenames or extensions change

## Priority Order

1. Weapons, armor, and wearable gear
2. Optional rune polish
3. Optional scenic combat background refresh
4. Manual map-like surfaces only if we decide to revisit them later

## What Needs Generation vs What Can Stay

High priority:

- weapons
- body armor
- helms, shields, gloves, boots, belts
- jewelry

Low priority:

- runes
- combat backgrounds

Not a good fit for the batched sprite-sheet workflow:

- act route maps in `assets/curated/act-maps`
- town maps in `assets/curated/town-maps`

Those are diagrammatic or map-like surfaces rather than simple cutout or icon sheets.

## Batch Workflow

The fastest workflow is to generate coherent grids instead of single assets:

1. choose one batch id from `data/art-batches/non-character-sheet-batches.json`
2. use the matching prompt block below
3. generate one full grid sheet in row-major order
4. split it with `scripts/split-generated-sheet.py`
5. review the individual outputs before wiring them into the runtime

Splitter example:

```bash
python3 scripts/split-generated-sheet.py \
  --sheet ~/Downloads/generated-weapons-sheet.png \
  --batch-id weapons_blades_and_blunts
```

The splitter writes outputs under:

```text
output/generated-sheet-splits/<batch-id>/
```

Each batch also writes `_split-manifest.json` with the exact crop boxes and output filenames.

Practical note from the first live equipment pass:

- dense mixed long-weapon sheets are risky when the generator snaps back to `1024 x 1024`
- bows/crossbows and polearms/throwing weapons should be split into separate sheets rather than forcing one oversized mixed batch

## Shared Prompt Rules

Use these rules for every item or rune sheet:

- one grid sheet only
- exact cell order matters; left to right, top to bottom
- one subject per cell
- every subject fully inside its own cell
- no overlap between cells
- no labels, captions, grid numbers, or watermark
- same camera language and lighting across the entire sheet
- transparent background preferred; if that fails, the whole sheet background must be a single flat chroma-key green `#00FF00`
- no painted backdrop plate inside each cell
- no cast shadows outside the item silhouette
- items should feel hand-painted, dark-fantasy, tactile, and grounded

For scenic background packs:

- use full rectangular scene panels rather than cutout subjects
- keep one distinct scene per cell
- avoid text, labels, UI, borders, and watermarks
- keep the scene readable after cropping to the cell

## Shared Item Sheet Prompt Template

```text
Create a single dark fantasy ARPG item sprite sheet for Rouge.

Goal:
Generate one clean grid sheet that can be split into separate item icons after export.

Canvas:
<CANVAS_SIZE> PNG

Grid:
<COLS> columns by <ROWS> rows
Exact cell order matters: left to right, top to bottom.
One item per cell only.

Background:
Preferred: true transparency with real alpha across the whole sheet.
Fallback only if transparency is impossible: one single flat chroma-key green background across the entire sheet, pure #00FF00, with no gradients, no shadows, no bloom, no texture, and no color spill onto the items.

Art direction:
Hand-painted dark fantasy item art for Blood Rogue.
Grounded Diablo-inspired item silhouettes, but clearly original.
Dirty metal, worn leather, bone, wood, cloth, tarnish, grime, ash, and believable material wear.
Strong inventory readability at small size.

Composition rules:
Every item centered inside its own cell with clean empty space around it.
Do not let any item touch a cell edge.
Do not let any item overlap another cell.
No text, no labels, no cell numbers, no border, no watermark, no extra props.
Consistent lighting and perspective across the entire sheet.

Avoid:
Photorealism, glossy 3D, cartoon, anime, mobile-game icon style, steampunk, sci-fi, giant decorative flourishes, or background scenes.

Cell order:
<CELL_ORDER>
```

## Shared Scenic Background Pack Prompt Template

```text
Create a single dark fantasy ARPG scenic background sheet for Rouge.

Goal:
Generate one grid sheet containing multiple separate environment backdrops that can be split into individual background files after export.

Canvas:
<CANVAS_SIZE> PNG

Grid:
<COLS> columns by <ROWS> rows
Exact cell order matters: left to right, top to bottom.
One environment scene per cell only.

Scene rules:
Each cell must contain a complete standalone backdrop.
No text, no labels, no UI, no watermark, no frame.
Keep the horizon and focal shapes readable after cell cropping.
Use the same overall paint quality and mood across the full sheet, but make each environment distinct.

Art direction:
Hand-painted dark fantasy environment art for Blood Rogue.
Moody, grim, tactile, readable, and grounded.
No modern props, no sci-fi, no anime, no glossy 3D.

Cell order:
<CELL_ORDER>
```

## Recommended Batches

### Phase 1: Equipment

`weapons_blades_and_blunts`

- priority: high
- grid: `5 x 4`
- recommended canvas: `3072 x 3072`
- labels:
  `short_sword`, `scimitar`, `sabre`, `long_sword`, `falchion`,
  `crystal_sword`, `bastard_sword`, `broad_sword`, `war_sword`, `rune_sword`,
  `legend_sword`, `zweihander`, `balrog_blade`, `colossus_blade`, `mace`,
  `morning_star`, `flail`, `war_hammer`, `maul`

`weapons_bows_and_crossbows`

- priority: high
- grid: `4 x 3`
- recommended canvas: `2048 x 2048`
- labels:
  `short_bow`, `long_bow`, `composite_bow`, `crossbow`,
  `ashwood_bow`, `cedar_bow`, `stag_bow`, `edge_bow`,
  `siege_crossbow`, `hydra_bow`, `gorgon_crossbow`

`weapons_polearms_and_throwing`

- priority: high
- grid: `4 x 2`
- recommended canvas: `2048 x 1024`
- labels:
  `partizan`, `grim_scythe`, `javelin`, `spear`,
  `war_javelin`, `war_spear`, `hyperion_javelin`, `ghost_spear`

`weapons_wands_staves_and_family_icons`

- priority: medium
- grid: `4 x 3`
- recommended canvas: `2048 x 2048`
- labels:
  `wand`, `yew_wand`, `bone_wand`, `lich_wand`,
  `battle_staff`, `gnarled_staff`, `war_staff`,
  `weapon-bow`, `weapon-crossbow`, `weapon-javelin`, `weapon-spear`

`armor_body`

- priority: high
- grid: `5 x 4`
- recommended canvas: `3072 x 3072`
- labels:
  `quilted_armor`, `leather_armor`, `ghost_armor`, `breast_plate`, `light_plate`,
  `scale_mail`, `chain_mail`, `ring_mail`, `splint_mail`, `plate_mail`,
  `field_plate`, `gothic_plate`, `full_plate_mail`, `mage_plate`, `ancient_armor`,
  `ornate_plate`, `boneweave`, `chaos_armor`, `hellforge_plate`, `archon_plate`

`gear_helms_and_shields`

- priority: high
- grid: `5 x 2`
- recommended canvas: `2560 x 1024`
- labels:
  `cap`, `skull_cap`, `helm`, `great_helm`, `crown`,
  `buckler`, `small_shield`, `large_shield`, `tower_shield`, `monarch`

`gear_gloves_boots_and_belts`

- priority: medium
- grid: `4 x 3`
- recommended canvas: `2048 x 2048`
- labels:
  `leather_gloves`, `heavy_gloves`, `chain_gloves`, `gauntlets`,
  `boots`, `heavy_boots`, `chain_boots`, `war_boots`,
  `sash`, `light_belt`, `heavy_belt`, `war_belt`

`gear_jewelry`

- priority: medium
- grid: `4 x 2`
- recommended canvas: `2048 x 1024`
- labels:
  `ring`, `coral_ring`, `jade_ring`, `diamond_ring`,
  `amulet`, `jade_amulet`, `prismatic_amulet`, `highlords_amulet`

### Phase 2: Runes

`runes_core_set`

- priority: low
- grid: `5 x 5`
- recommended canvas: `3072 x 3072`
- labels:
  `el`, `eld`, `tir`, `eth`, `ith`,
  `nef`, `tal`, `ral`, `ort`, `thul`,
  `amn`, `sol`, `shael`, `hel`, `lum`,
  `dol`, `io`, `ko`, `fal`, `lem`,
  `pul`, `um`, `mal`

### Phase 3: Scenic Combat Background Packs

`combat_backgrounds_wilds_and_ruins`

- priority: low
- grid: `4 x 2`
- recommended canvas: `4096 x 2304`
- labels:
  `moor`, `plains`, `forest`, `cave`,
  `ruins`, `stony_field`, `tamoe_highland`, `tristram`

`combat_backgrounds_desert_jungle_and_sanctum`

- priority: low
- grid: `4 x 2`
- recommended canvas: `4096 x 2304`
- labels:
  `desert`, `canyon`, `oasis`, `jungle`,
  `marsh`, `tomb`, `temple`, `monastery`

`combat_backgrounds_hell_and_siege`

- priority: low
- grid: `4 x 2`
- recommended canvas: `4096 x 2304`
- labels:
  `hell`, `worldstone_keep`, `throne_of_destruction`, `mountain`,
  `frozen_tundra`, `ice`, `ancients_way`

## Worked Prompt: First Equipment Sheet

Use this first:

```text
Create a single dark fantasy ARPG item sprite sheet for Rouge.

Goal:
Generate one clean grid sheet that can be split into separate item icons after export.

Canvas:
3072x3072 PNG

Grid:
5 columns by 4 rows.
Exact cell order matters: left to right, top to bottom.
One item per cell only.

Background:
Preferred: true transparency with real alpha across the whole sheet.
Fallback only if transparency is impossible: one single flat chroma-key green background across the entire sheet, pure #00FF00, with no gradients, no shadows, no bloom, no texture, and no color spill onto the items.

Art direction:
Hand-painted dark fantasy item art for Blood Rogue.
Grounded Diablo-inspired item silhouettes, but clearly original.
Dirty metal, worn leather, bone, wood, cloth, tarnish, grime, ash, and believable material wear.
Strong inventory readability at small size.

Composition rules:
Every item centered inside its own cell with clean empty space around it.
Do not let any item touch a cell edge.
Do not let any item overlap another cell.
No text, no labels, no cell numbers, no border, no watermark, no extra props.
Consistent lighting and perspective across the entire sheet.

Avoid:
Photorealism, glossy 3D, cartoon, anime, mobile-game icon style, steampunk, sci-fi, giant decorative flourishes, or background scenes.

Cell order:
row 1: short_sword, scimitar, sabre, long_sword, falchion
row 2: crystal_sword, bastard_sword, broad_sword, war_sword, rune_sword
row 3: legend_sword, zweihander, balrog_blade, colossus_blade, mace
row 4: morning_star, flail, war_hammer, maul, empty
```

## Import Notes

For items:

- split to PNG first
- review outputs in `output/generated-sheet-splits/<batch-id>/`
- replace the old art only after we decide which files are good enough
- update [asset-map-data.ts](/Users/andrew/proj/rouge/src/content/asset-map-data.ts) from legacy `.gif` or `.svg` references to the new `.png` files as each batch is approved

For runes:

- the live rune set already has complete coverage
- treat rune generation as polish, not a missing-content blocker

For combat backgrounds:

- keep the current files unless a new pack clearly beats them
- if we regenerate a pack, sanity-check [combat-backgrounds.ts](/Users/andrew/proj/rouge/src/content/combat-backgrounds.ts) and the act-level background maps in the UI views before landing replacements

## Acceptance Check

Do not mark a batch done unless:

- the generated sheet follows the intended cell order
- split outputs keep the correct filenames
- empty background areas are transparent or pure `#00FF00`
- items remain readable at small size
- backgrounds remain readable after crop
- `npm run build` still passes after wiring the approved outputs into the app
