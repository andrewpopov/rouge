# Rewards & Drop System

> Encounter rewards, item drops, card rewards, rune drops, and progression boons.

Last updated: 2026-04-11

## Encounter Reward Summary

Every encounter awards a combination of gold, XP, items, cards, and progression boons:

| Zone Type | Gold | XP | Items | Rune | Potion | Cards |
|-----------|------|----|-------|------|--------|-------|
| Battle | 10 + act*4 | 5 + act*2 | 1 | — | — | Yes |
| Miniboss | 16 + act*6 | 8 + act*3 | 3 | If active project | 1 | Yes |
| Boss | 28 + act*10 | 14 + act*4 | 4 | 1 guaranteed | 1 | Yes |

---

## Item (Equipment) Drops

### Drop Count by Zone Type

| Zone Type | Base Items | Act 3+ | Act 4+ | Act 5+ |
|-----------|-----------|--------|--------|--------|
| Battle | 1 | 1 | 2 | 2 |
| Branch Battle | 2 | 2 | 2 | 2 |
| Miniboss | 3 | 4 | 4 | 4 |
| Boss | 4 | 5 | 5 | 6 |

### Target Tier Calculation

```
levelAllowance = min(2, floor((level - 1) / 2))
trophyAllowance = zone.kind === "boss" ? 1 : min(1, bossTrophies.length)
zoneAllowance = zone.kind === "boss" ? 1 : 0
targetTier = max(1, min(maxCatalogTier, actNumber + levelAllowance + trophyAllowance + zoneAllowance))
```

### Tier Range by Zone

| Zone Type | Min Tier | Max Tier |
|-----------|----------|----------|
| Boss | targetTier | targetTier + 2 |
| Miniboss | targetTier | targetTier + 1 |
| Other | targetTier - 2 | targetTier |

### Equipment Weighting

Items are selected by weighted random. Weights are affected by:

| Factor | Weight Bonus |
|--------|-------------|
| Main weapon/armor slot | +3 |
| Tier proximity to target | 10 - (tierDelta * 3) |
| Strategic weapon family (primary) | +8 |
| Strategic weapon family (secondary) | +5 |
| Preferred weapon family | +3 |

### Late-Act Economy Feature Bonuses (Act 4+, Miniboss/Boss)

| Feature | Tier Bias | Socket Bias |
|---------|-----------|-------------|
| artisanStock / brokerageCharter | — | +2 |
| treasuryExchange | +1 | — |
| merchantPrincipate | +1 | +1 |
| tradeHegemony | — | +1 |
| paragonExchange | +1 | — |
| ascendantExchange | +2 | +1 |
| imperialExchange | +2 | +2 |
| mythicExchange | +3 | +3 |

### Planning-Focused Drops

If the player has an active runeword project:
- Equipment table is filtered to compatible base items
- Prioritizes items matching the planned runeword's base tier
- Only applies with runeword planning feature unlocked

---

## Rune Drops

### Guaranteed Rune Drops

| Zone Type | Guaranteed? | Condition |
|-----------|-------------|-----------|
| Boss | Always | 1 guaranteed rune |
| Miniboss | Conditional | 1 rune if active runeword project |
| Battle | Never | No guaranteed runes |

### Rune Drop Weighting

| Factor | Weight |
|--------|--------|
| Base weight | 7 - (tierDelta * 2) |
| Boss bonus (tier >= targetTier - 1) | +1 |
| Next target rune — Boss | +7 |
| Next target rune — Miniboss | +5 |
| Next target rune — Battle | +3 |
| Remaining target runes — Boss | +4 |
| Remaining target runes — Miniboss | +3 |
| Remaining target runes — Battle | +1 |
| Early-act bonus (act <= 2, tier <= actNumber + 2) | +1 |

**Key insight:** Active runeword projects heavily bias rune drops toward needed runes, especially from bosses (+7 weight for next target rune).

---

## Card Rewards

### Card Selection Pool

Card offerings are filtered by:
- **Zone kind** — battle/miniboss/boss
- **Act number** — determines available card tiers
- **Class** — class-specific card pools
- **Build archetype** — reinforcement/pivot/support scoring

### Deck Size Limits

| Limit | Formula |
|-------|---------|
| Upgrade threshold | 12 + actNumber * 2 |
| Soft cap | 14 + actNumber * 2 |
| Hard cap | 18 + actNumber * 3 |

### Card Reward Types

| Type | Behavior |
|------|----------|
| **Reinforce Build** | Upgrade existing cards with +version variants, prioritizes primary tree |
| **Support Build** | Add new support/utility cards, prioritizes support trees |
| **Pivot Build** | Switch archetype direction, mixed role emphasis |

### Card Copy Limits

| Card Role | Max Copies |
|-----------|-----------|
| Engine (payoff tier 4+) | 2-3 |
| Engine (setup) | 4 |
| Engine (other) | 4 |
| Support / Tech | 3 |
| Other roles | 2 |

### Evolution Family Limits (Specific Cards)

| Card | Max Copies |
|------|-----------|
| Sorceress Frozen Orb | 10 |
| Barbarian Berserk | 1 |
| Necromancer Revive | 2 |
| Paladin Conviction | 3 |
| Amazon Pierce | 4 |
| Druid Fury | 6 |
| Druid Summon Grizzly | 5 |
| Druid Heart of Wolverine | 5 |
| Druid Armageddon | 4 |
| Sorceress Hydra | 4 |
| Sorceress Lightning Mastery | 4 |
| Assassin Shadow Warrior | 4 |
| Generic engine payoff T4+ | 7 |

---

## Progression Boons

### Per-Encounter Boons

| Zone Type | Boon | Rewards |
|-----------|------|---------|
| Battle | Battle Instinct | +1 attribute point |
| Miniboss | Heroic Instinct | +1 attribute point, +10 gold |
| Boss | Class Mastery | +1 class point, +1 attribute point |

### Boss Class Point Scaling

Base +1 class point, with escalating bonuses from progression features:

| Feature | Bonus | Condition |
|---------|-------|-----------|
| Act progression | +min(2, floor((actNumber-1)/2)) | All bosses |
| Training Grounds | +1 | — |
| War College | +1 | — |
| Paragon Doctrine | +1 | Act 4+ |
| Apex Doctrine | +1 | Act 5+ |
| Legend Doctrine | +1 or +2 | Act 5+ (more for bosses) |
| Mythic Doctrine | +2 or +3 | Act 5+ (more for bosses) |
| War Annals | +1, +2 | Act 4+ (more for Act 5 bosses) |
| Legendary/Immortal Annals | +1, +2 | Act 5+ (more for bosses) |
| Boss Trophy Gallery | +1 | — |
| Mastery Focus | +1 | Act 5+ bosses |

### Additional Boons

| Condition | Extra Boon |
|-----------|-----------|
| Miniboss+ (Act 3+) | +1 class point |
| Branch battle (Act 4+) | +1 class point |

---

## XP Rewards

| Zone Type | Base XP | Act Scaling |
|-----------|---------|-------------|
| Battle | 5 | +2/act |
| Miniboss | 8 | +3/act |
| Boss | 14 | +4/act |

### Quest Consequence XP

| Act | XP Range |
|-----|----------|
| Act 2 | 4-13 xp |
| Act 3 | 5-14 xp |
| Act 4 | 5-15 xp |
| Act 5 | 6-16 xp |

---

## Shrine Rewards

Shrine opportunities are optional encounters offering choices between different bonuses:

### Shrine Types by Act

| Act | Shrine | Base Grant | Choice Bonuses |
|-----|--------|-----------|----------------|
| 1 | Rogue Vigil | 6g, 8xp | max life, potions, merc attack, energy |
| 2 | Sunwell | 8-15g, 10-13xp | Desert-themed stat bonuses |
| 3 | Jade | 10-25g, 12-14xp | Dockside trade/tide blessings |
| 4 | Infernal Altar | 12-27g, 12-15xp | Iron/warfire blessings |
| 5 | Mountain Peak | 10-29g, 6-16xp | Banner/ancient blessings |

Shrine choices typically offer combinations of:
- +hero max life
- +potion refill
- +mercenary attack
- +hero energy
- +mercenary life
- +gold
- +potion heal amount

---

## Loot Seeding

All drops are deterministic given the same inputs:

```
seed = hash(runSeed | zoneId | actNumber | encounterNumber | encountersCleared | uniqueItemsFound)
```

This ensures:
- Same run state = same drops (reproducible)
- Different refreshes/encounters = different results
- No true randomness — all pseudo-random from seed

## Source Files

- `src/run/run-reward-flow.ts` — Core encounter rewards
- `src/rewards/reward-engine-builder.ts` — Card pool generation
- `src/rewards/reward-engine-progression.ts` — Boon scaling
- `src/items/item-system-loot.ts` — Equipment/rune drop logic
- `src/items/item-system-rewards.ts` — Item selection weighting
- `src/content/game-content-rewards*.ts` — Quest consequence rewards
- `src/quests/catalog-opp-shrine*.ts` — Shrine opportunities
