# Non-Card Art Replacement Backlog

Last updated: April 6, 2026.

## Summary

- `8` selective subject-art replacements remain.
- These are not missing-file gaps.
- The current files already exist under `assets/curated/rouge-art`, but the runtime intentionally skips them through `BROKEN_ENEMY_SPRITES` and `BROKEN_BOSS_SPRITES` in `src/content/asset-map-data.ts`.
- Scope should stay narrow: reroll these eight only, compare against the current files, and import only if the new result is clearly better.

## Review Artifacts

- Current broken-set sheet: `tmp/imagegen/broken-non-card-art-sheet.png`
- Reference quality sheet: `tmp/imagegen/reference-non-card-art-sheet.png`
- Prompt batch: `tmp/imagegen/non_card_art_replace8_gpt15low.jsonl`

## Targets

| Slug | Display | Bucket | Act | Family / Base | Current read | Prompt direction |
|---|---|---|---:|---|---|---|
| `baal_s_minion` | Baal's Minion | enemy | 5 | demonic infantry brute | silhouette is workable, but the finish feels flatter and less premium than the stronger Act V enemy set | push a more muscular, quick-footed siege beast with bony armor knobs and a cleaner aggressive pose |
| `fire_tower` | Fire Tower | enemy | 2 | infernal sentry construct | readable idea, but it lands closer to a static prop render than a premium Rouge subject sprite | push a harsher black-iron tower with hellfire vents, skull details, and stronger menace |
| `lightning_spire` | Lightning Spire | enemy | 2 | arcane guardian construct | clean silhouette, but reads more emblematic than fully painted and integrated | push an ancient occult spire with crackling blue energy, weathered stone-metal materials, and stronger depth |
| `bishibosh` | Bishibosh | boss | 1 | Fallen Shaman | current version reads, but does not feel as premium or memorable as the stronger boss portraits | push a fire-enchanted goblin shaman with staff, ritual trophies, and a nastier command presence |
| `corpsefire` | Corpsefire | boss | 1 | Zombie | serviceable silhouette, but the flesh and lighting feel generic next to the better undead and boss pieces | push a swollen spectral-hit zombie miniboss with colder eye glow and stronger corpse texture |
| `eyeback_the_unleashed` | Eyeback the Unleashed | boss | 5 | Death Mauler | strong base shape, but the focal read is muddier than the best Act V marquee monsters | push a hulking horned death mauler with clearer head read, more premium armor-hide texture, and stronger forward threat |
| `fire_eye` | Fire Eye | boss | 2 | Invader | weakest boss read in the set; too subdued for a portal guardian and not distinct enough in silhouette | push a fast fire-enchanted palace guardian with desert occult robes, flame in hand, and a more dangerous supernatural read |
| `rakanishu` | Rakanishu | boss | 1 | Carver | recognizable, but the current style drifts a little caricatured and the lightning treatment feels too playful | push a lightning-enchanted carver chief with feral speed, sharper menace, and cleaner electric framing |

## Notes By Target

### Enemy Targets

- `baal_s_minion`
  Current seed summary: stealthy, quick-footed, unusually tough for its size, with bony knobs protruding from thick hide.
- `fire_tower`
  Current seed summary: an unmanned sentry tower built to emit fireballs when magical fields are crossed.
- `lightning_spire`
  Current seed summary: an ancient enchanted guardian spire that emits lightning bolts at intruders in the Arcane Sanctuary.

### Boss Targets

- `bishibosh`
  Base monster: `Fallen Shaman`
  Seed notes: Act I super unique, Cold Plains, `Magic Resistant` and `Fire Enchanted`.
- `corpsefire`
  Base monster: `Zombie`
  Seed notes: Act I super unique, Den of Evil, `Spectral Hit`.
- `rakanishu`
  Base monster: `Carver`
  Seed notes: Act I super unique, Stony Field, `Lightning Enchanted` and `Extra Fast`.
- `fire_eye`
  Base monster: `Invader`
  Seed notes: Act II super unique, Palace Cellar, `Fire Enchanted` and `Extra Fast`.
- `eyeback_the_unleashed`
  Base monster: `Death Mauler`
  Seed notes: Act V super unique, Frigid Highlands, `Extra Strong` and `Extra Fast`.

## Recommendation

Use `gpt-image-1.5` at `quality: low` for the first replacement pass:

- it already hit the best cost-to-quality point on the card-art work
- this bucket is only `8` images
- the repo workflow for subject art already expects `1024x1024`, one subject, and no scene background

After generation:

1. compare each candidate directly against the current file
2. import only the clear wins
3. leave any weak rerolls out of the runtime and keep the fallback guardrail in place until a better replacement exists
