# Visual Asset Status

Last updated: April 9, 2026.

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
- `73` enemy files in `assets/curated/rouge-art/enemies`
- `68` boss files in `assets/curated/rouge-art/bosses`

Current verdict:

- strong enough for live use
- no broad replacement pass needed
- no active subject-art repair queue remains
- battlefield summon art is now live for every runtime-supported summon family and summon template through `assets/curated/minion-illustrations`
- fallback portrait and sprite folders are safeguards, not the quality baseline

### Active Subject-Art Fix Queue

There is no active curated enemy or boss repair queue right now.

Recent approved outcomes from the last selective review:

- primary current art kept: `lightning_spire`
- primary replacement kept live: `fire_tower`, `bishibosh`, `corpsefire`, `fire_eye`
- approved alt variant added: `baal_s_minion__gpt15high_refresh_v2`
- approved alt variants added: `eyeback_the_unleashed__gpt15high_refresh_v1`, `eyeback_the_unleashed__gpt15high_refresh_v2`

Important distinction:

- these are not missing-file gaps
- the approved generated files now exist as additive variants in `assets/curated/rouge-art`
- unique-art variant rotation is handled through `src/content/rouge-art-manifest.ts`

Current staged review artifacts:

- `tmp/imagegen/broken-non-card-art-sheet.png`
- `tmp/imagegen/reference-non-card-art-sheet.png`
- `tmp/imagegen/non_card_art_replace8_review.md`
- `tmp/imagegen/non_card_art_replace8_gpt15low.jsonl`
- `tmp/imagegen/non-card-replace7-gpt15high-comparison.png`
- `tmp/imagegen/non-card-reroll3-gpt15high-comparison.png`

Historical note:

- the review artifact names still say `replace8` because they were staged before `rakanishu` was repaired and promoted live

Current decision:

- the explicit broken-sprite guardrail is cleared
- keep `lightning_spire` on its current primary art
- keep the approved `baal_s_minion` and `eyeback_the_unleashed` generated versions as alt art, not base replacements
- do not reopen a broad enemy or boss replacement program unless another live asset clearly fails in context

### Battlefield Summon Art

The battlefield summon-art pass is now live.

Current runtime truth:

- repeated summons reinforce an existing battlefield unit in `src/combat/combat-engine-turns.ts`
- live summon templates are defined in `src/combat/combat-engine-minions.ts`
- summon art resolves through `src/content/asset-map.ts`
- the command-stage summon rack in `src/ui/combat-view-renderers.ts` now renders dedicated summon illustrations instead of text-only labels
- curated summon art now lives in `assets/curated/minion-illustrations`

Current live coverage:

- `3` stack-family ladders are live with `15` total variants:
  - Skeleton Army: `5` tiers
  - Wolf Pack: `5` tiers
  - Necromancer Golem: `5` tiers
- `14` persistent singleton summons now have direct illustrations:
  - `necromancer_revive`
  - `amazon_valkyrie`
  - `amazon_decoy`
  - `druid_raven`
  - `druid_poison_creeper`
  - `druid_oak_sage`
  - `druid_heart_of_wolverine`
  - `druid_grizzly`
  - `assassin_shadow_master`
  - `druid_solar_creeper`
  - `druid_spirit_of_barbs`
  - `druid_carrion_vine`
  - `druid_treant`
  - `sorceress_hydra`
- `7` temporary battlefield device ladders are now live with `21` total variants:
  - `assassin_blade_sentinel`: tiers `1-3`
  - `assassin_charged_bolt_sentry`: tiers `1-3`
  - `assassin_wake_of_fire`: tiers `1-3`
  - `assassin_lightning_sentry`: tiers `1-3`
  - `assassin_death_sentry`: tiers `1-3`
  - `assassin_shadow_trap`: tiers `1-3`
  - `assassin_wake_of_inferno`: tiers `1-3`

Current decision:

- treat battlefield summon art as complete for all runtime-supported summons
- do not reopen the summon-art queue unless a live asset proves weak in context or a new runtime summon template lands

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

There is still no broad coverage gap left right now.

The best remaining image work is selective:

1. an ability-first reroll pass for select class card illustrations that currently read too much like repeated hero portraits with minor FX swaps
2. explicit skill-icon coverage for Rouge-original class cards that still rely on fallback or alias behavior
3. one-off replacement of another genuinely weak live asset if it stands out in context
4. net-new art for future features or future content expansions
5. optional luxury repaint work for map-like or poster-like surfaces if we want a premium presentation pass later

Current verdict on card illustrations:

- coverage is complete
- the next issue is differentiation, not absence
- the highest-value reroll classes are currently `Assassin`, `Barbarian`, `Paladin`, `Sorceress`, and `Amazon`
- the working review and candidate queue for that pass lives in `tmp/imagegen/card-illustration-ability-first-review.md`

## What Should Not Be Churned Right Now

Do not start a blind broad replacement pass for:

- class skill icons
- hero, mercenary, enemy, or boss subject art as a whole
- combat backgrounds
- the current item and rune buckets as a whole

Allowed exception:

- selective class-card rerolls when the current art is coverage-complete but too character-redundant to read distinctly at a glance

- one-off replacement of a clearly weak live asset if it actually fails in context

Those surfaces are either already strong or now have an approved live primary or alt-art solution.

## Document Boundaries

- `BLOOD_ROGUE_VISUAL_IDENTITY.md`: canonical quality bar and visual-review standard
- `VISUAL_DESIGN_TRD.md`: screen/component planning and acceptance criteria
- `ART_GENERATION_WORKFLOW.md`: practical generation/import workflow for future art work

The older audit and backlog docs remain in the repo as compatibility landing pages, but this file is now the single current-state source for visual asset status.
