# Class Strategies — Optimal Play Patterns

Each class has a primary fantasy and an optimal build strategy the sim should target.
Balance should be tuned so that each strategy can beat the game when played well.

---

## Amazon — Marksman
**Fantasy**: Precision strikes that set up devastating mercenary follow-ups.

**Draft priority**: Mark cards > merc buff cards > draw > single-target damage
**Deck goal**: Thin (16-18 cards). Every card should either mark, buff merc, or deal burst damage.
**Combat pattern**: Turn 1: Use Call the Shot (marks + preps next card). Turn 2+: Play mark cards, let merc clean up marked targets. Focus fire one enemy at a time.
**Skill path**: Command tree → merc scaling. Bridge: mark/buff combo. Capstone: big mark + burst.
**Equipment**: Bow family (preferred). Ranged damage scaling.
**Weakness**: No self-protection. Merc must stay alive. Falls apart if merc dies early.
**Balance target**: Should beat Act 5 boss ~50% of the time with good merc management.

---

## Assassin — Martial Artist
**Fantasy**: Skill combos that chain into devastating burst turns.

**Draft priority**: Draw > cost-reducing cards > stun/paralyze > single-target burst
**Deck goal**: Very thin (14-16 cards). Needs to see skill combos reliably.
**Combat pattern**: Turn 1: Shadow Feint (guard + prep next card -1 cost + damage). Follow with biggest damage card at reduced cost. Stun high-threat enemies to buy time.
**Skill path**: Martial arts tree → combo chains. Bridge: conversion (energy manipulation). Capstone: big burst.
**Equipment**: Claws/swords (preferred). Attack speed matters more than raw damage.
**Weakness**: Low sustain. Must kill fast or get overwhelmed. Needs good draws.
**Balance target**: Highest burst potential. Should beat Act 5 boss ~60% with good combos, but inconsistent.

---

## Barbarian — Berserker
**Fantasy**: Unstoppable melee force that gets stronger as the fight goes longer.

**Draft priority**: Damage > guard > heal > melee-synergy cards
**Deck goal**: Medium (18-20 cards). Wants solid melee cards and sustain.
**Combat pattern**: Swing hard, use Guard Stance when threatened, Rallying Bash for conditional guard. Melee strike every turn. Outlast through raw HP.
**Skill path**: Combat skills tree → raw damage. Bridge: masteries (weapon scaling). Capstone: war cry / heavy burst.
**Equipment**: Swords/maces (preferred). Biggest weapon damage bonus possible.
**Weakness**: No energy tricks. Limited AoE. Slow against packs.
**Balance target**: Reliable but not flashy. ~50% Act 5 boss. Strongest at Act 3-4 where raw stats dominate.

---

## Druid — Elementalist
**Fantasy**: Versatile caster who summons allies and burns enemies.

**Draft priority**: Summon > burn/elemental > draw > guard
**Deck goal**: Medium (18-20 cards). Mix of summons and elemental damage.
**Combat pattern**: Turn 1: Primal Attunement (guard + prep next summon/spell). Summon a minion early, then pile on elemental damage. Minions tank while hero applies burn.
**Skill path**: Elemental tree → fire/wind. Command tree for summon support. Bridge: conversion or recovery. Capstone: elemental burst or persistent summon.
**Equipment**: Staves (preferred). Energy and burn bonus scaling.
**Weakness**: Split focus. Jack of all trades, master of none. Summons can be wiped by AoE.
**Balance target**: Most flexible class. ~50% Act 5 boss with either summon or elemental focus.

---

## Necromancer — Summoner
**Fantasy**: Army commander who overwhelms enemies with expendable minions.

**Draft priority**: Summon > draw > poison > guard (for self-protection while minions work)
**Deck goal**: VERY thin (14-16 cards). Must cycle back to summon cards every 2-3 turns. Aggressively remove non-summon starters.
**Combat pattern**: Turn 1: Raise Servant (summon or reinforce). Every turn: play summon/reinforce if available, draw if not, guard if threatened. Let minions do the damage. Never waste energy on direct damage when summon is available.
**Skill path**: Summoning tree → max minion power. Bridge: army scaling. Capstone: persistent summon.
**Equipment**: Wands (preferred). Energy scaling > damage.
**Weakness**: Slow start. If minions die and no summon cards in hand, defenseless. Needs thin deck to cycle.
**Balance target**: Weakest early, strongest late with army online. ~40% Act 5 boss but should dominate Acts 1-3.

---

## Paladin — Guardian
**Fantasy**: Unbreakable shield that protects the whole party and outlasts any threat.

**Draft priority**: Party guard > heal > merc buff > damage
**Deck goal**: Medium (18-20 cards). Guard cards, healing, merc synergy.
**Combat pattern**: Turn 1: Sanctify (party guard + prep next card). Every turn: prioritize guard when incoming damage is high, offense when safe. Keep merc alive at all costs — merc DPS carries the fight.
**Skill path**: Defense tree → party guard. Support tree for healing. Bridge: aura skills. Capstone: massive party buff.
**Equipment**: Swords + shield (preferred). Guard bonus and merc attack scaling.
**Weakness**: Slow kills. Can time out if not enough offense. Must balance defense and damage.
**Balance target**: Most consistent class. ~60% Act 5 boss. Rarely loses early, sometimes loses late to attrition.

---

## Sorceress — Fire Mage
**Fantasy**: Glass cannon that melts enemies before they can respond.

**Draft priority**: Burn > direct damage > draw > energy cards
**Deck goal**: Thin (16-18 cards). All damage, minimal defense. Wants to see burn cards every turn.
**Combat pattern**: Turn 1: Kindle Bolt (fire damage + cost reduction on opener). Dump all energy into burn/damage. If alive after turn 2, you've probably won. If not, you were never going to.
**Skill path**: Fire tree → burn scaling. Bridge: conversion (energy tricks). Capstone: meteor / big AoE.
**Equipment**: Staves (preferred). Energy and burn bonus.
**Weakness**: Lowest survivability. One bad turn = death. No healing, no guard focus.
**Balance target**: Highest win rate when fights are short (~3-4 turns). ~50% Act 5 boss. Fastest kills or fastest deaths.

---

## Balance Philosophy

The game is balanced when:
1. **Every class can beat Act 5** when played with their optimal strategy (~40-60% win rate)
2. **No class is dominant** — different classes excel at different acts/encounter types
3. **The difficulty curve feels right** — Acts 1-3 are learnable, Act 4 is the gear check, Act 5 is the skill check
4. **Build diversity matters** — within each class, different archetype paths should be viable (even if one is stronger)

The sim should test each class with its optimal strategy, not with generic aggressive/balanced/control policies.

---

## Validation Status (2026-04-08)

### Strategies implemented in sim
All 7 class strategies are defined as policy overrides in `run-progression-simulator-core.ts` and auto-applied via `applyClassStrategy()` in the progression sim.

### Build snapshot results (auto-win campaign to Act 4)
| Class | HP | Dmg | Guard | Deck | Weapon | vs A3 Boss | vs A4 Boss |
|-------|-----|------|-------|------|--------|-----------|-----------|
| Barbarian | 237 | +22 | +7 | 28 | War Hammer | 3/3 | 1/3 |
| Necromancer | 171 | +8 | +13 | 30 | Bone Wand | 1/3 | 0/3 |
| Sorceress | 143 | +7 | +9 | 34 | War Staff | 3/3 | 0/3 |

### Known strategy failures
1. **Deck bloat not controlled**: Necro/Sorc strategies specify thin decks (14-18) but sim builds 30-34 cards. The `deckBloatPenalty` weight isn't driving enough sage_purge/card removal.
2. **Skills not progressing**: All classes at Lv16 only have slot 1 skill. Class point investment isn't meeting tree rank gates for slot 2 (Lv6 + 3 ranks).
3. **Strategies affect drafting but not town decisions enough**: The card effect multipliers influence which rewards are chosen but don't force deck thinning or skill investment.

### What needs to happen
- Town optimization must prioritize sage_purge actions when deck exceeds strategy target
- Class point investment must be front-loaded to hit slot 2 gate by Act 2
- Each strategy needs a `targetDeckSize` field that drives pruning behavior
