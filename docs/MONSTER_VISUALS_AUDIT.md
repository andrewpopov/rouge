# Monster Visuals Audit

Last updated: March 24, 2026.

## Scope

This document tracks the current monster-portrait pipeline used by combat and the remaining gaps before the roster feels consistently Diablo II-like while drifting into Rouge's own dark-fantasy portrait treatment.

## Landed In This Pass

- Boss encounters now resolve art from `assets/curated/sprites/bosses` instead of falling back through the generic enemy resolver.
- The retired steampunk icon runtime has been deleted. Missing or intentionally-disabled monster portraits now use Diablo-inspired fallback icons.
- The combat portrait presentation now bottom-aligns enemy sprites, uses pixel-art rendering for enemy PNGs, and adds a subtle hostile halo behind enemy figures.
- Existing enemy and boss PNGs were repacked with `scripts/polish-monster-sprites.sh` so the visible silhouette fills more of the portrait slot.
- `scripts/generate-monster-sprites.py` now exports first-pass monster portraits from raw Diablo II source sheets into a Rouge-specific graded style.
- The first generated enemy batch now covers: `baboon_demon`, `council_member`, `demon_imp`, `fallen`, `fallen_shaman`, `fetish`, `fetish_shaman`, `frog_demon`, `giant_mosquito`, `goatman`, `regurgitator`, `sand_maggot`, `sand_maggot_young`, `vampire`, `vulture_demon`, and `wraith`.

## Current Runtime Rules

Primary runtime files:

- `src/content/asset-map.ts`
- `src/content/asset-map-data.ts`
- `styles.css`
- `scripts/polish-monster-sprites.sh`
- `scripts/generate-monster-sprites.py`

The current portrait selection order is:

1. Use a curated enemy PNG when the family has a usable sprite.
2. Use a curated boss PNG when the template is a boss and the boss sprite is not on the broken-sprite denylist.
3. Fall back to a Diablo-inspired SVG chosen by monster-name keywords.

## Intentional Fallbacks

These are currently forced off their PNG sprite path because the curated still is visibly worse than a themed icon.

Regular enemies:

- `baal_s_minion`
- `fire_tower`
- `lightning_spire`

Bosses:

- `bishibosh`
- `corpsefire`
- `eyeback_the_unleashed`
- `fire_eye`
- `rakanishu`

## Remaining Gaps

The current pass improves readability and thematic consistency, but it does not solve the full art problem. The remaining issues are mostly source quality and extraction quality, not CSS.

Still needed:

- replace placeholder-quality boss stills that are really sprite-sheet fragments, prop-only crops, or low-value duplicates
- replace the weakest remaining enemy stills with curated source-sheet extracts instead of relying on repack plus fallback
- widen the extraction manifest so the remaining Act I-V families use deliberate frames rather than generic auto-crops
- evaluate whether a small set of hero monsters should use animated GIF or multi-frame rendering instead of still PNG portraits

Highest-priority missing or weak families after the generated batch:

- `zombie`
- `mummy`
- `scarab_demon`
- `skeleton`
- `succubus`
- `zakarum_zealot`
- `blood_lord`
- `blunderbore`
- support props like `fire_tower`, `lightning_spire`, and `mummy_sarcophagus`

## Recommended Next Pass

Priority order:

1. Expand `scripts/generate-monster-sprites.py` with explicit source overrides for the weakest core families: `zombie`, `mummy`, `scarab_demon`, `skeleton`, and `succubus`.
2. Curate the worst visible bosses first: the boss roster is now wired correctly, so bad source picks are much easier to spot.
3. Replace weak support or trap families with deliberate D2 frame extracts: `fire_tower`, `lightning_spire`, `mummy_sarcophagus`, and similar thin or prop-like silhouettes.
4. Keep `scripts/polish-monster-sprites.sh` as the final normalization step after any new batch extraction.
