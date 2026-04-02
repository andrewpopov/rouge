# Art Generation Workflow

Last updated: April 2, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `BLOOD_ROGUE_VISUAL_IDENTITY.md` for the canonical visual quality bar.
- Use `VISUAL_ASSET_STATUS.md` for current runtime status and replacement priority.
- This document is the practical workflow for art generation, review, and import.

## Purpose

This document replaces the old split between sprite-generation backlog notes and non-character sheet-generation notes.

Use it to answer:

- when we should generate new art at all
- which runtime seam owns a given asset family
- how to generate and import subject art
- how to generate and review sheet-based item, rune, or background batches

## First Decision: Should We Generate Anything?

Generate new art only if one of these is true:

1. a new feature or new content slug has no art yet
2. a specific live asset is genuinely weak in context
3. we are doing a deliberate premium repaint pass on a marquee surface

Do not generate just because a bucket feels old in theory.

Current keep-for-now decisions:

- keep the live Diablo II-style `skill-icons`
- keep the current live item sprites unless a specific replacement is clearly better
- keep the current live rune sprites unless a specific replacement is clearly better
- keep the current combat background set unless a specific scene is weak in live combat framing

## Runtime Ownership

### Subject Art

Folders:

- `assets/curated/rouge-art/enemies`
- `assets/curated/rouge-art/bosses`
- `assets/curated/rouge-art/portraits`
- `assets/curated/rouge-art/mercenaries`

Primary runtime seams:

- `src/content/asset-map.ts`
- `src/content/asset-map-data.ts`
- `src/content/rouge-art-manifest.ts`
- `scripts/import-latest-generated-art.js`

### Item, Rune, and Background Art

Folders:

- `assets/curated/sprites/items`
- `assets/curated/sprites/runes`
- `assets/curated/combat-backgrounds`

Primary runtime seams:

- `src/content/asset-map-data.ts`
- `src/content/combat-backgrounds.ts`
- `data/art-batches/non-character-sheet-batches.json`
- `scripts/split-generated-sheet.py`

## Subject-Art Workflow

Use this for:

- heroes
- mercenaries
- enemies
- bosses

### Prompt Rules

Default constraints:

- `1024x1024` PNG
- one subject only
- no scene background
- silhouette must read cleanly at `128x128`
- no text, UI, watermark, borders, or extra figures
- grounded dark-fantasy materials and anatomy

Transparency rules:

- prefer true transparent alpha
- fallback only to pure `#00FF00` chroma key if transparency is impossible
- no glow plate, painted backdrop, or cast shadow outside the silhouette

### Import Command

Examples:

```bash
node scripts/import-latest-generated-art.js --kind enemy --slug fallen
node scripts/import-latest-generated-art.js --kind boss --slug andariel
node scripts/import-latest-generated-art.js --kind portrait --slug barbarian
node scripts/import-latest-generated-art.js --kind mercenary --slug rogue_scout
```

Use `--dry-run` first when you are unsure which Downloads file will be selected.

## Sheet-Based Workflow

Use this for:

- item sprites
- rune sprites
- scenic background packs

### Batch Source Of Truth

Choose the batch id from:

- `data/art-batches/non-character-sheet-batches.json`

Do not freestyle label order. The batch file is the source of truth for:

- batch id
- row/column count
- output labels
- crop sizing

### Splitter Command

```bash
python3 scripts/split-generated-sheet.py \
  --sheet ~/Downloads/generated-sheet.png \
  --batch-id <batch-id>
```

Outputs land under:

- `output/generated-sheet-splits/<batch-id>/`

### Sheet Rules

For item and rune sheets:

- one subject per cell
- exact left-to-right, top-to-bottom order
- no labels or watermarks
- transparent background preferred
- fallback chroma key must be flat `#00FF00`
- no scenery plate behind items
- do not let subjects cross cell boundaries

For scenic background sheets:

- one full scene per cell
- keep the scene readable after cropping
- no UI, text, borders, or watermark

## Review Rules Before Import

Do not import a generated asset just because the split succeeded.

Check:

1. did the generator honor the requested canvas shape
2. is the silhouette or scene readable at live size
3. is the output actually better than the current live asset
4. does it preserve the intended family identity
5. does it stay on-brand with `BLOOD_ROGUE_VISUAL_IDENTITY.md`

If the answer is “no” or even “not clearly,” keep the output as a review artifact and do not overwrite the live asset.

## Where Review Artifacts Belong

Keep generated review material in the repo so we do not depend on `Downloads`.

Use:

- `output/generated-sheet-splits/<batch-id>/` for split outputs and source sheet copies
- `tmp/item-art-review/` or similar review boards for before/after comparisons

## Acceptance Checklist

An art batch is done only when:

- the correct batch id and cell order were used
- source sheet was copied into the repo review folder
- split outputs are labeled correctly
- transparency or chroma key is clean
- the new art is clearly better than the current live version
- any imported asset is actually wired through the live runtime seam

## Current Guidance For This Repo

Right now:

- subject-art generation is mostly a spot-fix or new-content workflow
- item and rune generation is optional and should be judged harshly against the live set
- combat background generation is a targeted retry workflow, not a broad missing-content backlog
- map-like and poster-like surfaces are better treated as special premium work than as sprite-sheet generation

## Document Boundaries

- `VISUAL_ASSET_STATUS.md`: what is live and what still needs work
- `BLOOD_ROGUE_VISUAL_IDENTITY.md`: what “good” looks like
- this document: how to generate, review, and import new art safely
