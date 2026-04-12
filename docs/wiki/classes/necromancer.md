# Necromancer

> Dark arts specialist — curse disruption, bone burst damage, or undead army swarm.

Last updated: 2026-04-11

## Identity

Necromancer commands death itself through three distinct paths. Curse Control disrupts and debuffs enemies while allies do the killing. Bone Burst applies direct pressure through bone and poison magic. Summon Swarm raises an undead army that overwhelms through numbers.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 15 |
| DEX | 25 |
| VIT | 15 |
| ENE | 25 |
| HP | 45 |
| Mana | 25 |

Necromancer has the lowest HP (45) and VIT (15) — the most fragile class. Defense must come from curses, summons, or bone armor.

## Skill Trees (3)

### Curses
- **Focus:** Debuff application, enemy disruption, support/conversion
- **Key skills:** Amplify Damage, Dim Vision, Weaken, Terror, Confuse, Attract, Decrepify, Lower Resist
- **Progression:** Basic curses → mass curses → lower resist

### Poison and Bone
- **Focus:** Direct damage, bone armor, poison DoT
- **Key skills:** Teeth, Bone Armor, Poison Dagger, Corpse Explosion, Bone Spear, Bone Wall, Poison Nova, Bone Spirit, Bone Prison
- **Progression:** teeth → bone spear → bone spirit; poison dagger → poison nova

### Summoning
- **Focus:** Undead army, golem variants, skeleton mastery
- **Key skills:** Raise Skeleton, Skeleton Mastery, Clay Golem, Golem Mastery, Raise Skeletal Mage, Blood Golem, Iron Golem, Fire Golem, Revive
- **Progression:** raise skeleton → skeletal mage → revive; clay golem → blood → iron → fire

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Curse Control](../builds/necromancer-curse-control.md) | Curses | Poison/Bone, Summoning | Wands | Tax/disruption, support conversion |
| [Bone Burst](../builds/necromancer-bone-burst.md) | Poison & Bone | Curses | Wands | Direct pressure, setup/payoff |
| [Summon Swarm](../builds/necromancer-summon-swarm.md) | Summoning | Curses, Poison/Bone | Wands | Army building, scaling minions |

## Run-Shaping Signals

- Early curse cards + debuff-oriented play → **Curse Control**
- Early bone/poison damage cards → **Bone Burst**
- Early skeleton/golem summon cards → **Summon Swarm**

## Deck Targets

- Optimal deck size: 14-17 cards
- All Necromancer builds use Wands — locked weapon family
- Wand affixes: Slow (2), Curses proficiency

## Key Matchup Notes

- Lowest HP class — needs defensive answers from the start
- Curse Control is hybrid-friendly and supports other damage sources well
- Bone Burst has the most consistent solo damage output
- Summon Swarm needs early army investment to snowball
- Corpse Explosion is a key mechanic — dead enemies fuel more damage
- Necromancer is uniquely strong against death_spawn enemies (more corpses = more resources)

## Source Files

- `data/seeds/d2/skills.json` (classId: "necromancer")
- `src/rewards/reward-engine-archetypes-data.ts` (necromancer archetypes)
- `docs/strategy-guides/necromancer.md` (strategy source)
- `docs/classes/necromancer.md` (sim status)
