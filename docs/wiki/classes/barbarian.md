# Barbarian

> Frontline melee class — raw combat pressure, durable mastery scaling, or warcry tempo control.

Last updated: 2026-04-11

## Identity

Barbarian is a frontline class whose lanes differ by how it converts weapon pressure into survivable fights. It should not collapse into "attack every turn." The interesting question is whether the run is raw combat pressure, durable mastery scaling, or timing-based warcry tempo.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 30 |
| DEX | 20 |
| VIT | 25 |
| ENE | 10 |
| HP | 55 |
| Mana | 10 |

## Skill Trees (3)

### Combat Skills
- **Focus:** Direct damage, weapon strikes, conversion attacks
- **Key skills:** Bash, Double Swing, Stun, Concentrate, Frenzy, Berserk, Whirlwind
- **Progression:** bash → stun → concentrate → berserk; double_swing → frenzy; leap → leap_attack → whirlwind

### Combat Masteries
- **Focus:** Weapon scaling, passive efficiency, durable frontline
- **Key skills:** Sword Mastery, Axe Mastery, Mace Mastery, Polearm Mastery, Increased Stamina, Increased Speed, Iron Skin, Natural Resistance
- **Progression:** sword_mastery → weapon_mastery → battle_instinct; iron_skin → steel_skin; natural_resistance → unyielding

### Warcries
- **Focus:** Buffs, debuffs, party control, mercenary timing
- **Key skills:** Howl, Shout, Battle Cry, Battle Orders, Battle Command, War Cry, Taunt, Find Potion
- **Progression:** howl → shout → battle_orders → war_cry

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Combat Pressure](../builds/barbarian-combat-pressure.md) | Combat Skills | Warcries, Masteries | Sword, Mace | Proactive damage, just enough defense |
| [Mastery Frontline](../builds/barbarian-mastery-frontline.md) | Masteries | Warcries | Sword, Mace | Weapon scaling, durable and stable |
| [Warcry Tempo](../builds/barbarian-warcry-tempo.md) | Warcries | Combat Skills, Masteries | Mace, Sword | Buffs, guard, mercenary timing |

## Run-Shaping Signals

- Early combat-tree picks + strong melee weapon → **Combat Pressure**
- Mastery investment + stable weapon progression → **Mastery Frontline**
- Repeated guard, buff, or mercenary support picks → **Warcry Tempo**

## Deck Targets

- Optimal deck size: 13-18 cards
- Actively avoid: swing, measured_swing, kick, field_dressing, mark_target

## Key Matchup Notes

- Barbarian still needs a boss plan — raw damage alone dies to telegraphed burst
- Weapon quality matters more for Barbarian than most classes
- Combat Pressure is the default-feeling lane but still requires restraint on overextending
- Warcry Tempo is the most "deckbuilder" Barbarian lane — timing windows matter
- Lowest energy (10 mana) means Barbarian is most vulnerable to mana_burn affixes

## Source Files

- `data/seeds/d2/skills.json` (classId: "barbarian")
- `src/rewards/reward-engine-archetypes-data.ts` (barbarian archetypes)
- `docs/strategy-guides/barbarian.md` (strategy source)
- `docs/classes/barbarian.md` (sim status)
