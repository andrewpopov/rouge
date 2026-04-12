# Druid

> Versatile nature class — elemental burn/slow, shapeshifter bruiser, or summoner army engine.

Last updated: 2026-04-11

## Identity

Druid is the most versatile class with three fundamentally different playstyles. Elemental Storm sets up burn/slow into burst payoffs. Shifter Bruiser is a self-sustaining melee fighter with multi-hit and healing. Summoner Engine builds a persistent army that scales over the fight.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 15 |
| DEX | 20 |
| VIT | 25 |
| ENE | 20 |
| HP | 55 |
| Mana | 20 |

## Skill Trees (3)

### Elemental
- **Focus:** Fire/cold setup into burst payoffs, AoE pressure
- **Key skills:** Firestorm, Arctic Blast, Fissure, Cyclone Armor, Twister, Volcano, Hurricane, Armageddon
- **Progression:** Setup spells → AoE burst → ultimate storms

### Shape Shifting
- **Focus:** Transformation-based melee, self-healing, multi-hit sustain
- **Key skills:** Werewolf, Lycanthropy, Feral Rage, Rabies, Fire Claws, Hunger, Shock Wave, Fury
- **Progression:** Basic forms → enhanced attacks → ultimate fury

### Summoning
- **Focus:** Persistent army building, vine healing, spirit buffs
- **Key skills:** Raven, Spirit Wolf, Dire Wolf, Grizzly, Carrion Vine, Solar Creeper, Heart of Wolverine, Spirit of Barbs, Oak Sage
- **Progression:** Basic summons → dire wolves → grizzly; vines → spirits → sage

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Elemental Storm](../builds/druid-elemental-storm.md) | Elemental | Summoning | Staves, Maces | Burn/slow setup into burst |
| [Shifter Bruiser](../builds/druid-shifter-bruiser.md) | Shape Shifting | Summoning | Maces, Polearms | Multi-hit sustain, self-healing |
| [Summoner Engine](../builds/druid-summoner-engine.md) | Summoning | Elemental | Staves, Maces | Persistent army, scaling minions |

## Run-Shaping Signals

- Early elemental damage cards + staves → **Elemental Storm**
- Early shapeshifting + melee weapon → **Shifter Bruiser**
- Early summon cards + vine/spirit support → **Summoner Engine**

## Deck Targets

- Optimal deck size: 14-17 cards
- Summoner Engine can run slightly larger decks since army persists between turns

## Key Matchup Notes

- Elemental Storm excels at AoE fights but needs setup time against fast openers
- Shifter Bruiser is self-sufficient but can struggle with multiple status-applying enemies
- Summoner Engine snowballs hard but is weak to AoE enemy attacks that clear the board
- Druid has the most weapon flexibility (Staves, Maces, Polearms across builds)

## Source Files

- `data/seeds/d2/skills.json` (classId: "druid")
- `src/rewards/reward-engine-archetypes-data.ts` (druid archetypes)
- `docs/strategy-guides/druid.md` (strategy source)
- `docs/classes/druid.md` (sim status)
