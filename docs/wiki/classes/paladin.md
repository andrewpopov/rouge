# Paladin

> Holy warrior — melee combat zeal, defensive sanctuary anchor, or offensive aura judgment.

Last updated: 2026-04-11

## Identity

Paladin combines direct combat with aura-based party effects. Combat Zeal is a straightforward melee fighter with mitigation. Sanctuary Anchor is the premier defensive build, protecting the whole party. Aura Judgment sets up offensive auras that amplify all damage sources.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 25 |
| DEX | 20 |
| VIT | 25 |
| ENE | 15 |
| HP | 55 |
| Mana | 15 |

## Skill Trees (3)

### Combat Skills
- **Focus:** Direct melee damage, weapon strikes, holy attacks
- **Key skills:** Sacrifice, Smite, Holy Bolt, Zeal, Charge, Vengeance, Blessed Hammer, Conversion, Fist of the Heavens
- **Progression:** Basic attacks → zeal/charge → blessed hammer → fist of heavens

### Defensive Auras
- **Focus:** Party protection, healing, damage reduction
- **Key skills:** Prayer, Resist Fire, Resist Cold, Resist Lightning, Defiance, Cleansing, Vigor, Meditation, Redemption, Salvation
- **Progression:** Resist auras → cleansing/defiance → meditation/redemption → salvation

### Offensive Auras
- **Focus:** Damage amplification, elemental auras, conviction
- **Key skills:** Might, Holy Fire, Thorns, Blessed Aim, Concentration, Holy Freeze, Holy Shock, Sanctuary, Fanaticism, Conviction
- **Progression:** Might → concentration → fanaticism; holy fire → holy freeze → holy shock → conviction

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Combat Zeal](../builds/paladin-combat-zeal.md) | Combat Skills | Off/Def Auras | Maces, Swords | Direct melee, mitigation |
| [Sanctuary Anchor](../builds/paladin-sanctuary-anchor.md) | Defensive Auras | Combat, Off Auras | Maces, Swords | Protection, support, party survival |
| [Aura Judgment](../builds/paladin-aura-judgment.md) | Offensive Auras | Defensive Auras | Maces, Swords | Setup/amplify, aura-empowered payoffs |

## Run-Shaping Signals

- Early combat skill picks + strong melee weapon → **Combat Zeal**
- Early defensive aura picks + party protection → **Sanctuary Anchor**
- Early offensive aura picks + damage amplification → **Aura Judgment**

## Deck Targets

- Optimal deck size: 14-17 cards
- Paladin has strong access to both Maces and Swords
- Scepters are a Mace sub-family option

## Key Matchup Notes

- Combat Zeal is the most straightforward path — reliable damage + some defense
- Sanctuary Anchor is the safest build but can stall on damage against high-HP bosses
- Aura Judgment is the most synergy-dependent — needs the aura engine running to perform
- Paladin's balanced stats (55 HP, decent across the board) make all three paths viable
- Paladin Shields provide unique defensive bonuses not available to other classes

## Source Files

- `data/seeds/d2/skills.json` (classId: "paladin")
- `src/rewards/reward-engine-archetypes-data.ts` (paladin archetypes)
- `docs/strategy-guides/paladin.md` (strategy source)
- `docs/classes/paladin.md` (sim status)
