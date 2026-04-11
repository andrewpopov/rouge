# Assassin

## Current Sim Status
- Clear rate: 2/3 (fails Act 4 in 1 seed)
- Build quality: 75/100
- Deck size: 16 (target: 12-17)

## Primary Build: Shadow Master
**Tree:** assassin_shadow_disciplines (command)
**Target deck:** 14-17 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| psychic_hammer | 1 | 1 | 4 dmg, 1 paralyze, merc +8 | answer |
| burst_of_speed | 2 | 1 | 14 guard, merc +10, draw 2 | salvage |
| cloak_of_shadows | 1 | 1 | 14 guard, draw 1 | support |
| fade | 3 | 1 | party 24 guard, heal 8, slow all, draw 1 | answer |
| shadow_warrior | 3 | 1 | merc mark +16, merc +16, 14 guard | support |
| claw_mastery | 1 | 1 | 8 dmg, merc mark +10 | setup |

### Flex Cards (good-to-have)
- blade_shield (T2, 1E) -- 6 AoE, slow all, merc +8, draw 1
- weapon_block (T2, 1E) -- 14 guard, next atk -5, draw 1
- venom (T2, 1E) -- 6 dmg, 4 poison, next melee +4, draw 1
- cobra_strike (T2, 1E) -- 10 dmg, draw 1
- shadow_veil (T3, 1E) -- 14 guard, next 2 Assassin cards -1 cost, draw 1
- shadow_master (T4, 2E) -- 12 dmg, merc +18, draw 1
- lethal_tempo (T4, 1E) -- aura: Assassin cards draw +1 extra
- natalyas_guard (T4, 1E) -- 14 guard, merc heal 6, next atk -6
- rally_mercenary

### Unwanted (actively avoid)
- swing, measured_swing, mark_target

### Synergy Loop
1. Shadow_veil reduces next 2 Assassin card costs by 1, enabling rapid chains
2. Burst_of_speed draws 2 + guards + buffs merc, cycling through deck fast
3. Lethal_tempo aura makes all Assassin draw cards draw +1 extra -- snowball effect
4. Fade provides massive party guard (24) + heal + slow for defensive turns
5. Shadow_warrior marks enemies for merc +16 + buffs merc +16 for burst damage

### Evolution Chains
- psychic_hammer -> burst_of_speed -> fade
- claw_mastery -> blade_shield -> shadow_warrior
- tiger_strike -> cobra_strike -> claws_of_thunder
- fists_of_fire -> blades_of_ice -> phoenix_strike
- fire_blast -> wake_of_fire -> lightning_sentry -> death_sentry

### Known Issues
- **Fade flooding fixed (10 -> 4 copies)** but shadow spec still fragile
- Core cards evolve via psychic_hammer -> burst_of_speed -> fade chain, which is desirable
- Act 4 failure in 1 seed indicates scaling gap in late game
- Shadow build relies heavily on merc damage; if merc dies, damage collapses

## Secondary Build: Martial Artist
**Tree:** assassin_martial_arts (martial)
**Target deck:** 12-15 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| tiger_strike | 1 | 1 | 7 dmg, next melee +3 | setup |
| cobra_strike | 2 | 1 | 10 dmg, draw 1 | payoff |
| fists_of_fire | 2 | 1 | 8 fire dmg, 3 burn, draw 1 | payoff |
| dragon_talon | 2 | 1 | 5x3 dmg | payoff |
| venom | 2 | 1 | 6 dmg, 4 poison, next melee +4, draw 1 | setup |
| claw_mastery | 1 | 1 | 8 dmg, merc mark +10 | setup |

### Synergy Loop
1. Tiger_strike buffs next melee +3; venom buffs next melee +4
2. Dragon_talon hits 3x with accumulated buffs for big burst
3. Dragon_flight deals +10 if played melee earlier
4. Ultra-tight deck (12-14) means combo fires every turn

### Evolution Chains
- tiger_strike -> cobra_strike -> claws_of_thunder
- fists_of_fire -> blades_of_ice -> phoenix_strike

## Tertiary Build: Trapper
**Tree:** assassin_traps (arcane)
**Target deck:** 14-16 cards

### Core Cards
- fire_blast, wake_of_fire, shock_web, blade_sentinel, lightning_sentry, trap_mastery

### Synergy Loop
1. Traps persist for 3-4 turns dealing damage autonomously
2. Shadow_storm gives all traps +4 damage
3. Hero plays guard/draw while traps control the board

## Sim Findings
- 2/3 clear rate is solid; Act 4 failure is a single-seed scaling issue
- Fade flooding fix (10 -> 4) dramatically improved deck quality
- Shadow build is merc-dependent: shadow_warrior + claw_mastery mark for big merc hits
- Evolution chain psychic_hammer -> burst_of_speed -> fade is the intended progression
