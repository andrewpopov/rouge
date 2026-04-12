# Sorceress

> Elemental magic specialist — cold control, fire burst, or lightning tempo disruption.

Last updated: 2026-04-11

## Identity

Sorceress is the purest spellcaster class with three elemental paths. Cold Control freezes and disrupts. Fire Burst applies maximum pressure through burn stacking. Lightning Tempo combines sustained pressure with salvage and disruption. Highest energy (35 mana) but lowest HP (40) — the glass cannon.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 10 |
| DEX | 25 |
| VIT | 10 |
| ENE | 35 |
| HP | 40 |
| Mana | 35 |

Sorceress has the highest ENE (35) and lowest HP (40) and STR (10). Pure spellcaster statline.

## Skill Trees (3)

### Cold Spells
- **Focus:** Freeze/slow control, setup into payoff, defensive disruption
- **Key skills:** Ice Bolt, Frozen Armor, Frost Nova, Ice Blast, Shiver Armor, Glacial Spike, Blizzard, Chilling Armor, Frozen Orb, Cold Mastery
- **Progression:** ice bolt → ice blast → glacial spike → blizzard → frozen orb

### Fire Spells
- **Focus:** Maximum damage, burn stacking, AoE pressure
- **Key skills:** Fire Bolt, Warmth, Inferno, Blaze, Fire Ball, Fire Wall, Enchant, Meteor, Fire Mastery, Hydra
- **Progression:** fire bolt → fire ball → meteor → hydra

### Lightning Spells
- **Focus:** Sustained pressure, energy manipulation, chain damage
- **Key skills:** Charged Bolt, Static Field, Telekinesis, Nova, Lightning, Chain Lightning, Teleport, Thunder Storm, Energy Shield, Lightning Mastery
- **Progression:** charged bolt → lightning → chain lightning; static field → nova → thunder storm

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Cold Control](../builds/sorceress-cold-control.md) | Cold | Lightning | Staves | Setup/disruption, freeze into payoff |
| [Fire Burst](../builds/sorceress-fire-burst.md) | Fire | — | Staves | Maximum pressure, burn scaling |
| [Lightning Tempo](../builds/sorceress-lightning-tempo.md) | Lightning | Cold | Staves | Sustained pressure, salvage/disruption |

## Run-Shaping Signals

- Early cold spell picks + freeze/slow effects → **Cold Control**
- Early fire damage + burn stacking cards → **Fire Burst**
- Early lightning + static field / chain effects → **Lightning Tempo**

## Deck Targets

- Optimal deck size: 14-17 cards
- All Sorceress builds use Staves
- Staves have element-specific affixes: burn (fire), freeze (cold), shock (lightning)
- Leaf runeword (Tir+Ral) is exceptional for fire builds (+5 burn)

## Key Matchup Notes

- Lowest HP in the game (40) — Sorceress dies to unmitigated burst
- Cold Control is the safest lane via freeze/slow disruption
- Fire Burst has the highest damage ceiling but needs the fight to last long enough for burn to pay off
- Lightning Tempo is the most flexible and can pivot between damage and utility
- Teleport (lightning tree) is uniquely powerful for repositioning and emergency escape
- Enchant (fire tree) can buff mercenary damage for ally-focused strategies
- Energy Shield (lightning tree) converts damage to mana — synergizes with high ENE stat

## Source Files

- `data/seeds/d2/skills.json` (classId: "sorceress")
- `src/rewards/reward-engine-archetypes-data.ts` (sorceress archetypes)
- `docs/strategy-guides/sorceress.md` (strategy source)
- `docs/classes/sorceress.md` (sim status)
