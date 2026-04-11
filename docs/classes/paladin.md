# Paladin

## Current Sim Status
- Clear rate: 3/3 (full clear)
- Build quality: 78/100
- Deck size: 16 (target: 13-18)

## Primary Build: Zealot
**Tree:** paladin_offensive_auras (support)
**Target deck:** 13-16 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| holy_fire | 2 | 1 | 9 dmg, 4 burn, merc +6, draw 1 | setup |
| thorns | 1 | 1 | 5 dmg, 2 burn | setup |
| charge | 2 | 1 | 12 dmg, next atk +3 | setup |
| blessed_aim | 2 | 1 | next 2 atks +4, 14 guard, draw 1 | setup |
| vengeance | 3 | 2 | 13 dmg, 5 burn | setup |
| concentration | 2 | 1 | next aura/atk +5, 14 guard, draw 1 | setup |

### Flex Cards (good-to-have)
- sacrifice (T1, 2E) -- 15 dmg
- smite (T1, 1E) -- 6 dmg
- might (T1, 1E) -- 6 dmg, 1 slow, merc +8, draw 1
- prayer (T1, 1E) -- heal 6, merc heal 5, 14 guard, draw 1
- cleansing (T1, 1E) -- heal 6, 14 guard, draw 1
- defiance (T2, 1E) -- party 14 guard, draw 1, taunt
- rally_mercenary, guard_stance

### Unwanted (actively avoid)
- swing, measured_swing, kick, mark_target

### Synergy Loop
1. Holy_fire (4 burn) and thorns (2 burn) apply burn to targets
2. Blessed_aim buffs next 2 attacks +4 each; concentration buffs next aura/attack +5
3. Holy_strike deals +3 per hit (3 hits) if target has burn or slow = +9 bonus
4. Charge adds +3 to next attack; everything chains into massive burst turns
5. Crusade gives party +5 damage for full-turn amplification

### Evolution Chains
- might -> holy_fire -> fanaticism -> conviction
- thorns -> fanaticism -> conviction
- sacrifice -> zeal -> blessed_hammer -> fist_of_the_heavens
- smite -> holy_bolt -> vengeance
- prayer -> defiance -> holy_freeze

### Known Issues
- **offensive_auras fix is working** -- 3/3 clears now
- Act 1 failures in some seeds from elite trait RNG (extra_fast + extra_strong combo)
- These are trait-system issues, not paladin card balance problems
- BQ 78 is second highest; paladin is currently the best-balanced class

## Secondary Build: Guardian
**Tree:** paladin_defensive_auras (support)
**Target deck:** 15-18 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| prayer | 1 | 1 | heal 6, merc heal 5, 14 guard, draw 1 | support |
| defiance | 2 | 1 | party 14 guard, draw 1, taunt | support |
| holy_freeze | 3 | 2 | 8 AoE cold, freeze all, merc +6 | payoff |
| cleansing | 1 | 1 | heal 6, 14 guard, draw 1 | salvage |
| meditation | 3 | 1 | heal 6, merc heal 6, 14 guard, draw 1 | salvage |
| holy_shield | 3 | 1 | party 18 guard, 8 AoE magic, draw 2 | payoff |

### Synergy Loop
1. Prayer and meditation sustain party HP across long fights
2. Defiance generates party guard + taunt to absorb damage
3. Holy_freeze does 8 AoE + freeze all for board control
4. Aura_mastery (capstone) makes all aura cards +4 dmg +4 guard
5. Mercenary does the killing while paladin sustains

### Evolution Chains
- prayer -> defiance -> holy_freeze

## Sim Findings
- Paladin is the strongest performing class: 3/3 clear, BQ 78
- Offensive auras build has excellent burn + buff stacking synergy
- Act 1 RNG deaths are from trait combinations, not card balance
- Guardian build is viable but slower; Zealot is primary
