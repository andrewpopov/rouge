# Sprite Generation Backlog

Last updated: March 25, 2026.

## Scope

This is the live replacement queue for every runtime-driven monster or character sprite surface currently used by the app.

Included:

- 69 regular enemy family sprites from `assets/curated/sprites/enemies`
- 62 boss sprites from `assets/curated/sprites/bosses`
- 7 player-class portraits from `assets/curated/portraits`
- 6 mercenary sprites from `assets/curated/sprites/mercenaries`

Excluded:

- item art
- UI icons
- town or world-map background scenes
- NPC placement art baked into zone backdrops

## Import Workflow

Generated final art now lives under:

- `assets/curated/rouge-art/enemies`
- `assets/curated/rouge-art/bosses`
- `assets/curated/rouge-art/portraits`
- `assets/curated/rouge-art/mercenaries`

The app prefers files in `assets/curated/rouge-art` over the older curated sprite folders when the slug exists in the Rouge art manifest.

Importer command:

- `node scripts/import-latest-generated-art.js --kind enemy --slug fallen`
- `node scripts/import-latest-generated-art.js --kind boss --slug andariel`
- `node scripts/import-latest-generated-art.js --kind portrait --slug barbarian`
- `node scripts/import-latest-generated-art.js --kind mercenary --slug rogue_scout`

Use `--dry-run` to verify which Downloads image would be imported without moving it.

## Shared Generation Spec

Use this as the default art direction for every prompt unless a specific monster needs an override:

- Diablo II-inspired dark-fantasy action RPG portrait, but clearly original Rouge art direction
- single subject only
- full body or full creature visible
- square composition, centered subject, all limbs, horns, wings, staffs, weapons, spell fire, and trailing cloth fully inside frame
- silhouette must read cleanly when downscaled to `128x128`
- no text, UI, logos, borders, frames, or watermarks
- no cinematic background scene
- grimy materials, worn leather, tarnished metal, bone, cloth, ash, blood, embers
- grounded anatomy and costume design; avoid cartoon, chibi, anime, glossy 3D, sci-fi, or steampunk reads
- do not copy exact Diablo II renders or sprite poses; use D2 as thematic reference only

## Hard Prompt Requirements

Append these requirements to every generation prompt unless there is a monster-specific reason not to:

- output `1024x1024` PNG
- one subject only; no companions, no corpse pile, no environment props, no second figure
- `3/4` view facing right by default
- subject centered and scaled to fill roughly `70%` to `85%` of the canvas height
- keep at least `48px` of empty space between the outer silhouette and every canvas edge
- do not crop ears, horns, fingers, feet, weapons, flame tips, cloth tails, or spirit wisps
- no ground plane, no cast shadow, no fog cloud outside the silhouette, no vignette, no halo backdrop, no painterly background wash
- spell effects are allowed only if they are attached directly to the subject and remain fully inside the silhouette
- preserve large readable shapes over micro-detail; the image must still read at `128x128`
- materials should be dirty and tactile, not glossy or airbrushed

## Transparency And Cutout Rules

This is the part that matters most for import quality:

- preferred output is a true transparent background with real alpha
- if the generator cannot produce transparency, use a single flat chroma-key background color only: pure bright green `#00FF00`
- if chroma-key fallback is used, there must be no gradients, no lighting falloff, no glow bloom, no smoke, and no shadow outside the character silhouette
- background color must not appear in the subject
- edge handling must be clean: no soft dark fringe, no blurry background residue, no semi-opaque backdrop plate behind the subject
- empty canvas area should be fully transparent or fully chroma-key green, never a painted dark field

## Composition And Readability Rules

These points should be stated directly in prompts to reduce cleanup work:

- pose must read immediately at portrait size; favor one clear weapon, one clear gesture, and one dominant silhouette
- avoid extreme perspective foreshortening that hides limbs or makes the subject read as cropped
- avoid side-on profile and avoid straight-on symmetry unless the monster design demands it
- weapons and staffs should be thick enough to survive downscaling
- facial read should be strong from a distance: glowing eyes, skull face, tusks, horns, or other major features should remain legible
- floating enemies still need a clear body mass and should not dissolve into loose smoke
- cloth tears, fur edges, bone charms, and flame tongues should support the silhouette instead of turning into noisy outline chatter

## Negative Requirements

Call these out explicitly when prompting:

- no photorealism
- no glossy `3D` render look
- no generic mobile-game fantasy look
- no steampunk
- no sci-fi
- no anime or cartoon stylization
- no cinematic environment scene
- no border, frame, nameplate, caption, watermark, or logo
- no oversized weapon or ornament clipping outside the canvas
- no modern clothing, props, or materials unless the monster concept explicitly needs them

## Reusable Prompt Footer

Paste this footer into every prompt after the monster-specific description:

```text
Full body visible, 3/4 view facing right, centered on a square canvas. Keep all limbs, weapons, staff tips, flames, horns, ears, cloth tails, and trailing effects fully inside frame. Subject should fill roughly 70% to 85% of the canvas height with a clean margin to every edge. Strong readable silhouette for downscaling to a 128x128 in-game portrait.

Hard output requirement: transparent background with real alpha. No vignette, no glow field, no painted backdrop, no floor, no fog bank outside the silhouette, no cast shadow, no ambient gradient, no border, no text, no watermark, no other characters. The file must drop directly into the game as a cutout PNG with minimal or no post-processing.

If true transparency is impossible, use a single flat chroma-key background color only: pure bright green #00FF00, with no gradients, no shadows, no bloom, and no color spill onto the character.

Avoid: photorealism, glossy 3D, cartoon, anime, steampunk, sci-fi, giant cinematic scene, tiny unreadable detail, or any composition that depends on a background to work.

Target output: 1024x1024 PNG, single subject, portrait-ready, cutout-ready.
```

## Import Acceptance Check

Do not mark a sprite complete unless it passes these checks:

- the newest imported file is the correct slug in `assets/curated/rouge-art/...`
- alpha channel is present, or the image is on a flat `#00FF00` background ready for keyed removal
- corners and outer empty areas are transparent or chroma-key green, not painted dark
- the subject reads clearly at small size and is not cropped
- `npm run build` passes after import

## Recommended Prompt Order

This is the order I recommend for one-by-one generation so we establish the visual language before we hit the long tail:

1. `fallen` regenerate with true transparency or clean cutout
2. `fallen_shaman` regenerate with true transparency or clean cutout
3. `zombie`
4. `skeleton`
5. `goatman`
6. `wraith`
7. `barbarian`
8. `amazon`
9. `rogue_scout`
10. `blood_raven`
11. `andariel`
12. `fetish`

## Player Classes

- [x] `amazon`
- [x] `assassin`
- [x] `barbarian`
- [x] `druid`
- [x] `necromancer`
- [x] `paladin`
- [x] `sorceress`

## Mercenaries

- [x] `desert_guard`
- [x] `harrogath_captain`
- [x] `iron_wolf`
- [x] `kurast_shadow`
- [x] `rogue_scout`
- [x] `templar_vanguard`

## Regular Enemy Families

- [x] `abominable`
- [x] `baal_s_minion`
- [x] `baboon_demon`
- [x] `bat_demon`
- [x] `blood_hawk`
- [x] `blood_hawk_nest`
- [x] `blood_lord`
- [x] `blunderbore`
- [x] `bone_fetish`
- [x] `catapult`
- [x] `claw_viper`
- [x] `corrupt_rogue`
- [x] `corrupt_rogue_archer`
- [x] `corrupt_rogue_spearwoman`
- [x] `council_member`
- [x] `death_mauler`
- [x] `demon_imp`
- [x] `fallen`
- [x] `fallen_shaman`
- [x] `fetish`
- [x] `fetish_shaman`
- [x] `fire_tower`
- [x] `flying_scimitar`
- [x] `frog_demon`
- [x] `frozen_horror`
- [x] `gargoyle_trap`
- [x] `giant_mosquito`
- [x] `giant_spider`
- [x] `goatman`
- [x] `leaper`
- [x] `lightning_spire`
- [x] `megademon`
- [x] `minion_of_destruction`
- [x] `mummy`
- [x] `mummy_sarcophagus`
- [x] `oblivion_knight`
- [x] `overseer`
- [x] `pain_worm`
- [x] `reanimated_horde`
- [x] `regurgitator`
- [x] `reziarfg`
- [x] `sabre_cat`
- [x] `sand_maggot`
- [x] `sand_maggot_egg`
- [x] `sand_maggot_young`
- [x] `sand_raider`
- [x] `scarab_demon`
- [x] `siege_beast`
- [x] `skeleton`
- [x] `skeleton_archer`
- [x] `skeleton_mage`
- [x] `slinger`
- [x] `spike_fiend`
- [x] `stygian_fury`
- [x] `succubus`
- [x] `suicide_minion`
- [x] `swarm`
- [x] `tainted`
- [x] `undead_horror`
- [x] `vampire`
- [x] `vile_child`
- [x] `vile_mother`
- [x] `vulture_demon`
- [x] `wendigo`
- [x] `willowisp`
- [x] `wraith`
- [x] `zakarum_priest`
- [x] `zakarum_zealot`
- [x] `zombie`

## Bosses

- [x] `andariel`
- [x] `baal`
- [x] `bartuc_the_bloody`
- [x] `battlemaid_sarina`
- [x] `beetleburst`
- [x] `bishibosh`
- [x] `blood_raven`
- [x] `bloodwitch_the_wild`
- [x] `bonebreaker`
- [x] `bonesaw_breaker`
- [x] `bremm_sparkfist`
- [x] `coldcrow`
- [x] `coldworm_the_burrower`
- [x] `colenzo_the_annihilator`
- [x] `corpsefire`
- [x] `creeping_feature`
- [ ] `dac_farren`
- [ ] `dark_elder`
- [ ] `diablo`
- [ ] `duriel`
- [ ] `eldritch_the_rectifier`
- [ ] `eyeback_the_unleashed`
- [ ] `fangskin`
- [ ] `fire_eye`
- [ ] `frozenstein`
- [ ] `geleb_flamefinger`
- [ ] `griswold`
- [ ] `hephasto_the_armorer`
- [ ] `icehawk_riftwing`
- [ ] `infector_of_souls`
- [ ] `ismail_vilehand`
- [ ] `izual`
- [ ] `korlic`
- [ ] `lilith`
- [ ] `lister_the_tormentor`
- [ ] `lord_de_seis`
- [ ] `madawc`
- [ ] `maffer_dragonhand`
- [ ] `nihlathak`
- [ ] `pandemonium_diablo`
- [ ] `pindleskin`
- [ ] `pitspawn_fouldog`
- [ ] `rakanishu`
- [ ] `sharptooth_slayer`
- [ ] `shenk_the_overseer`
- [ ] `snapchip_shatter`
- [ ] `sszark_the_burning`
- [ ] `talic`
- [ ] `the_countess`
- [ ] `the_cow_king`
- [ ] `the_smith`
- [ ] `the_summoner`
- [ ] `thresh_socket`
- [ ] `toorc_icefist`
- [ ] `treehead_woodfist`
- [ ] `uber_baal`
- [ ] `uber_diablo`
- [ ] `uber_duriel`
- [ ] `uber_izual`
- [ ] `ventar_the_unholy`
- [ ] `witch_doctor_endugu`
- [ ] `wyand_voidbringer`
