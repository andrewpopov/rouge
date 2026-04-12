# Monster Traits (Elite Affixes)

> Elite enchantments, death effects, and affix scaling by act.

Last updated: 2026-04-11

## Elite Affix Traits (8 Types)

### On-Attack Traits

| Trait | On-Attack Effect | On-Death Effect |
|-------|-----------------|-----------------|
| **EXTRA_FAST** | Faster action speed | None |
| **EXTRA_STRONG** | Increased damage | None |
| **CURSED** | Applies 2 Amplify to hero | None |
| **COLD_ENCHANTED** | Applies 1 Chill to hero | Applies 2 Chill to hero |
| **FIRE_ENCHANTED** | Applies 1 Burn to hero | Deals 25% maxLife fire damage (bypasses guard) |
| **LIGHTNING_ENCHANTED** | Lightning damage on hit | None |
| **STONE_SKIN** | Increased defense/guard | None |
| **MANA_BURN** | Applies 1 Energy Drain to hero | None |

### Trait Details

**CURSED** — Most dangerous for sustained fights. Amplify stacking increases all incoming damage. Priority: kill cursed enemies fast or bring anti-amplify answers.

**COLD_ENCHANTED** — Dual threat: chill on attack reduces your draw (fewer cards = fewer plays), and death explosion applies 2 chill. Can cascade if multiple cold-enchanted enemies die in sequence.

**FIRE_ENCHANTED** — On-death explosion deals 25% of the enemy's maxLife as fire damage that bypasses guard. Dangerous on high-HP enemies. Plan life totals before killing.

**MANA_BURN** — Energy drain reduces your energy for the next turn. Against mana burn enemies, play high-cost cards early before energy is drained.

## Death Traits

| Trait | Effect on Death |
|-------|----------------|
| **death_explosion** | Deals 30% of maxLife as physical damage to hero (bypasses guard) |
| **death_poison** | Releases poison cloud — applies 2 poison stacks to hero |
| **death_spawn** | Spawns 2 creatures with 30% of original's maxLife each |

### Death Trait Strategy

- **death_explosion** — Account for burst damage when killing enemies. Don't kill a death_explosion enemy at low life.
- **death_poison** — Poison stacks are manageable but accumulate. Kill multiple death_poison enemies in the same turn and heal up.
- **death_spawn** — Creates reinforcements. AoE damage becomes more valuable. Kill spawners before focusing single-target.

## Spawn Traits

| Trait | Effect on Spawn |
|-------|----------------|
| **summon_allies_on_spawn** | Summons additional allies when entering combat. Configurable count, life ratio, attack ratio. |

## Affix Count Scaling by Act

Enemies gain more affixes as the run progresses:

| Act | Normal (min-max) | Elite (min-max) |
|-----|-----------------|-----------------|
| Act 0 (tutorial) | 0-0 | 0-0 |
| Act 1 | 0-0 | 1-1 |
| Act 2 | 0-0 | 1-1 |
| Act 3 | 0-1 | 1-2 |
| Act 4 | 0-1 | 2-3 |
| Act 5 | 1-1 | 2-3 |

**Key scaling breakpoints:**
- **Act 3** — First time normal enemies can roll an affix. Deck needs at least basic answers.
- **Act 4** — Elites get 2-3 affixes. Compound threat combinations become common (e.g., CURSED + FIRE_ENCHANTED = amplify stacking + death explosion).
- **Act 5** — Every enemy has at least 1 affix. No more "clean" fights.

## Dangerous Affix Combinations

| Combo | Why It's Dangerous |
|-------|--------------------|
| CURSED + FIRE_ENCHANTED | Amplify increases the fire death explosion damage |
| COLD_ENCHANTED + MANA_BURN | Reduced draw + reduced energy = can't play cards |
| EXTRA_STRONG + EXTRA_FAST | Raw stat overload, pure DPS check |
| FIRE_ENCHANTED + death_explosion | Double death burst — 25% fire + 30% physical, both bypass guard |
| CURSED + COLD_ENCHANTED | Amplify + chill = take more damage AND draw fewer answers |

## Source Files

- `src/combat/monster-traits.ts` — Trait definitions, on-attack effects, on-death effects, affix scaling
- `src/combat/combat-engine-monster-actions.ts` — TRAIT constants re-exported
