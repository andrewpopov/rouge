# Visual Asset Status

Last updated: April 2, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `BLOOD_ROGUE_VISUAL_IDENTITY.md` for the canonical visual quality bar.
- This is the current-truth status document for live visual assets and visual replacement priority.

## Purpose

This document is the single current-state summary for Blood Rogue's shipped visual asset buckets.

Use it to answer:

- which art families are live
- which families are strong, acceptable, or legacy-only
- where image-generation work is still worth doing
- where we should stop churning art because the live set is already good enough

## Current Runtime Snapshot

### 1. Subject Art

The live runtime resolves known hero, mercenary, enemy, and boss subjects through `assets/curated/rouge-art`.

Current live folder counts:

- `7` class portraits in `assets/curated/rouge-art/portraits`
- `6` mercenary portraits in `assets/curated/rouge-art/mercenaries`
- `72` enemy files in `assets/curated/rouge-art/enemies`
- `66` boss files in `assets/curated/rouge-art/bosses`

Current verdict:

- strong enough for live use
- no broad replacement pass needed
- fallback portrait and sprite folders are safeguards, not the quality baseline

### 2. Icon Systems

The live icon language is intentionally mixed.

Current live families:

- `203` raster PNG icons in `assets/curated/skill-icons`
- `44` SVG fallback and utility icons in `assets/curated/themes/diablo-inspired/icons`

Current verdict:

- the Diablo II-style `skill-icons` family is approved live-quality for now because recognition value is high
- the gothic SVG pack is good for fallback and utility states, not as the flagship primary card-icon language
- icon work is now selective, not a blanket replacement program

### 3. Combat Backgrounds

The zone background pass is complete in the live runtime.

Current live state:

- `70` mapped combat zones in `src/content/combat-backgrounds.ts`
- `0` shared background files in that zone mapping

Important note:

- generic act-level environment files such as `moor.webp`, `desert.webp`, `jungle.webp`, `hell.webp`, and `worldstone_keep.webp` still matter for shell-level and stage-level framing
- those generic files are not evidence that the zone-unique pass is incomplete

Current verdict:

- strong enough for live use
- no active background generation pass needed

### 4. Non-Character Item and Rune Art

The runtime still uses direct curated sprite folders for inventory and reward art.

Current live counts:

- `100` item PNGs in `assets/curated/sprites/items`
- `23` rune PNGs in `assets/curated/sprites/runes`

Current verdict:

- accepted live-quality for now
- broad batch replacement is not currently justified
- future work should be one-off or feature-driven, not a forced replacement program

## Latest Generation Review

The most recent non-character generation pass tested these equipment batches:

- `weapons_blades_and_blunts`
- `armor_body_early_and_mid`
- `gear_helms_and_shields`
- `weapons_wands_staves_and_family_icons`

Outcome:

- none of the generated batches beat the current live item set strongly enough to import
- the live item set remains the better visual choice for the app right now

Review artifacts were preserved in-repo:

- `output/generated-sheet-splits/weapons_blades_and_blunts/`
- `output/generated-sheet-splits/armor_body_early_and_mid/`
- `output/generated-sheet-splits/gear_helms_and_shields/`
- `output/generated-sheet-splits/weapons_wands_staves_and_family_icons/`
- `tmp/item-art-review/`

This matters because it changes the replacement priority:

- item and rune generation is no longer an assumed “must do next”
- if we generate again, it should be to solve a specific weak live read, not to churn a generally stronger existing set

## Quality Verdict By Bucket

### Strong / Keep

- `assets/curated/rouge-art`
- `assets/curated/combat-backgrounds`
- `assets/curated/act-maps`
- `assets/curated/town-portraits`
- title and character-select hero surfaces

### Accepted For Now

- `assets/curated/skill-icons`
- `assets/curated/sprites/items`
- `assets/curated/sprites/runes`
- generic stage-level combat environment files used by shell framing

### Legacy Support Only

- `assets/curated/portraits`
- old sprite fallback paths that remain in the runtime as defensive seams

## What Still Justifies New Images

There is no large required image-generation bucket left right now.

The best remaining image work is selective:

1. one-off replacement of a genuinely weak live asset if it stands out in context
2. net-new art for future features or future content expansions
3. luxury repaint work for map-like or poster-like surfaces if we want a premium presentation pass later

## What Should Not Be Churned Right Now

Do not start a broad replacement pass for:

- class skill icons
- hero, mercenary, enemy, or boss subject art
- combat backgrounds
- the current item and rune buckets as a whole

Those surfaces are either already strong or were just tested against replacement candidates that did not improve the live app.

## Document Boundaries

- `BLOOD_ROGUE_VISUAL_IDENTITY.md`: canonical quality bar and visual-review standard
- `VISUAL_DESIGN_TRD.md`: screen/component planning and acceptance criteria
- `ART_GENERATION_WORKFLOW.md`: practical generation/import workflow for future art work

The older audit and backlog docs remain in the repo as compatibility landing pages, but this file is now the single current-state source for visual asset status.
