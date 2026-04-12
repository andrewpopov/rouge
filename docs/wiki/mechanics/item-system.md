# Item System

> Equipment slots, weapon families, affixes, runes, and runewords.

Last updated: 2026-04-11

## Equipment Slots (9)

| Slot | Equippable Types |
|------|-----------------|
| Weapon | Swords, Maces, Axes, Polearms, Spears, Javelins, Bows, Crossbows, Staves, Wands, Scepters, Daggers, Throwing Weapons, Assassin Katars, Sorceress Orbs |
| Armor (Body) | Body Armor |
| Helm | Helms, Circlets, Barbarian Helms, Druid Pelts, Necromancer Shrunken Heads |
| Shield | Shields, Paladin Shields |
| Gloves | Gloves |
| Boots | Boots |
| Belt | Belts |
| Ring | Rings |
| Amulet | Amulets |

## Item Rarity Tiers

| Color | Tier | Description |
|-------|------|-------------|
| White | Normal | Base items, no bonuses |
| Blue | Magic | 1-2 random affixes |
| Yellow | Rare | Multiple random affixes |
| Brown | Unique | Fixed, named items with special properties |
| Green | Set | Part of a named set with set bonuses |

## Item Tier Progression

| Tier | When Available |
|------|---------------|
| Normal | Acts 1-2 |
| Exceptional | Acts 2-3 |
| Elite | Acts 4-5 |

Total items in database: 493 (291 weapons, 202 armor)

## Item Bonus Types

Equipment provides bonuses tracked via `ItemBonusSet`:

| Bonus | Effect |
|-------|--------|
| `heroDamageBonus` | +N to all damage dealt |
| `heroGuardBonus` | +N to all guard gained |
| `heroMaxLife` | +N maximum life |
| `heroMaxEnergy` | +N maximum energy per turn |
| `heroBurnBonus` | +N to all burn applied |
| `heroPotionHeal` | +N potion healing |
| `mercenaryAttack` | +N mercenary attack damage |
| `mercenaryMaxLife` | +N mercenary maximum life |

## Weapon Families & Class Preferences

| Family | Used By | Special Effects |
|--------|---------|-----------------|
| Swords | Assassin, Barbarian, Paladin | Crushing (3) + Burn (2) |
| Maces | Barbarian, Paladin, Druid | Crushing (3) + Burn (2) |
| Axes | Barbarian | Crushing + Burn |
| Polearms | Barbarian, Druid | Slow (2) |
| Spears | Amazon | Slow (2), Javelin proficiency |
| Javelins | Amazon | Shock (2), Javelin proficiency |
| Bows | Amazon | Burn (3), Bow proficiency |
| Crossbows | Amazon | Freeze (2), Bow proficiency |
| Staves | Druid, Sorceress | Burn/Freeze/Shock (1 each, element-specific) |
| Wands | Necromancer, Sorceress | Slow (2), Curses proficiency |
| Scepters | Paladin | Mace-family bonuses |
| Daggers | Various | Basic physical |
| Assassin Katars | Assassin (class-specific) | Martial arts synergy |
| Sorceress Orbs | Sorceress (class-specific) | Spell synergy |

### Archetype Weapon Mapping

| Archetype | Primary Weapons |
|-----------|----------------|
| Amazon Bow Volley | Bows, Crossbows |
| Amazon Javelin Storm | Javelins, Spears |
| Amazon Passive Tempo | Bows, Javelins, Spears |
| Assassin (all) | Swords |
| Barbarian Combat | Swords, Maces |
| Barbarian Masteries | Swords, Maces |
| Barbarian Warcries | Maces, Swords |
| Druid Elemental | Staves, Maces |
| Druid Shape-Shifting | Maces, Polearms |
| Druid Summoning | Staves, Maces |
| Necromancer (all) | Wands |
| Paladin (all) | Maces, Swords |
| Sorceress (all) | Staves |

## Weapon Effect Kinds

| Effect | Damage Type | Description |
|--------|------------|-------------|
| Burn | Fire | Fire DoT on hit |
| Slow | Cold | Movement/speed reduction |
| Freeze | Cold | Hard CC on hit |
| Shock | Lightning | Paralyze effect |
| Crushing | Physical | Guard-breaking |

## Runes (17 Total, Tiers 1-8)

| Tier | Rune | Key Bonuses |
|------|------|-------------|
| 1 | El | +1 dmg, +1 guard |
| 2 | Eld | Potions/energy |
| 2 | Tir | Energy/life |
| 2 | Eth | Life bonus |
| 3 | Ith | +2 dmg |
| 3 | Nef | +1 dmg + merc |
| 3 | Tal | Burn |
| 4 | Ral | Burn x2 |
| 4 | Ort | Burn + energy |
| 4 | Thul | Guard + life |
| 5 | Amn | +2 dmg + life |
| 5 | Sol | Guard + merc |
| 5 | Shael | Dmg + guard |
| 6 | Hel, Lum, Dol, Io, Ko | Various mid-tier |
| 7 | Fal, Lem | Life + merc / Dmg + potions |
| 8 | Pul, Um, Mal | High-tier combinations |

## Runewords (20 Total)

Runewords are placed in socketed items for combined bonuses. Key runewords:

| Name | Slot | Runes | Key Bonuses |
|------|------|-------|-------------|
| Steel | Weapon | Tir+El | +6 dmg, +2 guard, +1 merc |
| Stealth | Armor | Tal+Eth | +8 life, +1 energy, +3 guard |
| Malice | Weapon | Ith+El+Eth | +5 dmg, +1 burn |
| Strength | Weapon | Amn+Tir | +4 dmg, +4 life, +1 guard |
| Edge | Weapon (Bows) | Tal+Amn+El | +8 dmg, +3 guard, +2 burn, +1 energy |
| Smoke | Armor | Tal+Eth+Lum | +10 life, +3 guard |
| Myth | Armor | Hel+Amn+Nef | +8 life, +2 guard, +1 merc |
| Leaf | Weapon (Staves) | Tir+Ral | +2 dmg, +2 energy, +5 burn |
| White | Weapon (Wands) | Dol+Io | +5 dmg, +3 guard, +2 merc |
| Black | Weapon (Maces) | Thul+Io+Nef | +9 dmg, +4 guard, +6 life |
| Earthsong | Weapon (Maces/Staves) | Ral+Sol+Io | +5 dmg, +3 guard, +3 burn, +2 life |
| Memory | Weapon (Staves) | Lum+Io+Sol | +3 energy, +4 dmg, +5 guard, +6 life |
| Melody | Weapon (Bows) | Shael+Ko+Nef | +8 dmg, +3 guard, +2 energy |
| Honor | Weapon | Tir+El+Amn | +7 dmg, +2 guard, +2 merc |
| Pattern | Weapon (Swords) | Ort+Dol | +6 dmg, +4 guard, +2 energy, +6 life |
| Lionheart | Armor | Hel+Lum+Fal | +14 life, +2 dmg, +6 merc life |
| Prudence | Armor | Mal+Tir | +12 life, +4 guard, +2 energy |
| Stone | Armor | Shael+Um+Pul | +16 life, +4 guard, +8 merc life |
| Passion | Weapon | Dol+Ort+Lem | +7 dmg, +2 burn, +1 energy |
| Crescent Moon | Weapon (Swords/Polearms/Spears/Javelins) | Shael+Um+Tir | +8 dmg, +3 burn, +1 energy |

## Socketing

- Equipment can have sockets opened by town artisan (Commission Sockets)
- Runes are inserted into sockets
- Completing a runeword recipe provides additional bonus on top of individual rune bonuses
- Socket count varies by item type and tier

## Item Valuation Constants

| Constant | Value | Used For |
|----------|-------|----------|
| MIN_EQUIPMENT_VALUE | 8 | Floor price for equipment |
| EQUIPMENT_TIER_SCALE | 18 | Price scaling per tier |
| SOCKET_VALUE_MULTIPLIER | 6 | Value per socket |
| INSERTED_RUNE_VALUE_MULTIPLIER | 10 | Value per inserted rune |
| RUNEWORD_BONUS_VALUE | 16 | Extra value for completed runeword |
| MIN_RUNE_VALUE | 6 | Floor price for loose runes |
| RUNE_TIER_SCALE | 12 | Price scaling per rune tier |

## Source Files

- `src/items/item-data.ts` — Item definitions and templates
- `src/items/item-data-runes.ts` — Rune and runeword definitions
- `src/items/item-town-actions.ts` — Town item actions
- `src/items/item-town-pricing.ts` — Pricing formulas
- `data/seeds/d2/items.json` — Item database
- `src/types/items.d.ts` — Item type definitions
