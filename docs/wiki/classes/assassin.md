# Assassin

> Melee combo specialist — charge-release burst, shadow control, or trap field setup.

Last updated: 2026-04-11

## Identity

Assassin is a combo-oriented class that builds charges into explosive releases, uses shadow discipline for survivability and disruption, or sets up persistent trap fields. The class rewards sequencing skill and punishes sloppy play order.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 20 |
| DEX | 20 |
| VIT | 20 |
| ENE | 25 |
| HP | 50 |
| Mana | 25 |

## Skill Trees (3)

### Martial Arts
- **Focus:** Charge accumulation → explosive release, elemental combos
- **Key skills:** Tiger Strike, Dragon Talon, Dragon Claw, Cobra Strike, Dragon Tail, Dragon Flight
- **Progression:** Charge skills → release skills → ultimate combos

### Shadow Disciplines
- **Focus:** Survivability, disruption, cloak-based tempo
- **Key skills:** Burst of Speed, Cloak of Shadows, Fade, Weapon Block, Shadow Warrior, Shadow Master, Mind Blast
- **Progression:** Defensive buffs → summon shadows → master shadow

### Traps
- **Focus:** Setup-based damage, persistent field effects, tax-style pressure
- **Key skills:** Fire Blast, Charged Bolt Sentry, Wake of Inferno, Lightning Sentry, Death Sentry, Blade Shield
- **Progression:** Basic traps → advanced sentries → death sentry chain

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Martial Burst](../builds/assassin-martial-burst.md) | Martial Arts | Shadow | Swords | Charge-release melee, elemental combo |
| [Shadow Tempo](../builds/assassin-shadow-tempo.md) | Shadow Disciplines | — | Swords | Disruption/mitigation, control |
| [Trap Field](../builds/assassin-trap-field.md) | Traps | Shadow | Swords | Setup/tax, persistent trap damage |

## Run-Shaping Signals

- Early martial arts charge skills + melee weapon → **Martial Burst**
- Early shadow discipline buffs + survivability picks → **Shadow Tempo**
- Early trap setup cards + persistent damage → **Trap Field**

## Deck Targets

- Optimal deck size: 14-17 cards
- Martial Burst needs tight sequencing — every dead card breaks combos
- Shadow Tempo is the most hybrid-friendly, can splash utility
- Trap Field wants setup cards early, payoff cards later

## Key Matchup Notes

- Martial Burst excels against single tough enemies but struggles with swarms
- Shadow Tempo is the safest lane but can stall against high-HP bosses
- Trap Field provides persistent AoE but is weak to fast openers that kill before traps activate
- All Assassin builds use Swords — weapon quality matters but family is locked

## Source Files

- `data/seeds/d2/skills.json` (classId: "assassin")
- `src/rewards/reward-engine-archetypes-data.ts` (assassin archetypes)
- `docs/strategy-guides/assassin.md` (strategy source)
- `docs/classes/assassin.md` (sim status)
