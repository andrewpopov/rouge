# Amazon

## Current Sim Status
- Clear rate: 3/3 (full clear)
- Build quality: 61/100
- Deck size: 21 (target: 14-17)

## Primary Build: Marksman
**Tree:** amazon_bow_and_crossbow (martial)
**Target deck:** 14-17 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| magic_arrow | 1 | 1 | 7 magic dmg, draw 1 | support |
| cold_arrow | 2 | 1 | 7 cold dmg, 1 slow | payoff |
| guided_arrow | 3 | 1 | 16 dmg, draw 1 | payoff |
| multiple_shot | 2 | 2 | 7 AoE dmg, slow all | support |
| inner_sight | 1 | 1 | 1 slow, merc +8, draw 1 | support |
| penetrate | 2 | 1 | 10 dmg, 1 slow, merc +10 | setup |

### Flex Cards (good-to-have)
- strafe (T3, 2E) -- 9 AoE, slow all, 6 guard, draw 1
- critical_strike (T1, 2E) -- 14 dmg, draw 1
- dodge (T1, 1E) -- 14 guard, draw 1
- inner_calm (T2, 1E) -- heal 6, 14 guard, draw 1, next ranged +3
- exploding_arrow (T2, 2E) -- 8 fire dmg, 3 burn, draw 1
- rally_mercenary

### Unwanted (actively avoid)
- swing, measured_swing, kick, mark_target

### Synergy Loop
1. Inner_sight applies slow + marks for merc +8, generating value every play
2. Cold_arrow and multiple_shot apply slow across enemies
3. Penetrate deals 10 dmg + marks merc +10 on slowed targets
4. Guided_arrow (16 dmg + draw) and pierce (26 dmg + merc +18) are finishers
5. Arrow_mastery aura gives all ranged cards +3 damage

### Evolution Chains
- magic_arrow -> cold_arrow -> guided_arrow -> freezing_arrow
- fire_arrow -> exploding_arrow -> strafe
- inner_sight -> penetrate -> valkyrie
- critical_strike -> deadly_strike -> pierce
- dodge -> avoid -> evade
- jab -> power_strike -> charged_strike -> lightning_fury

### Known Issues
- **Burst death in 2/5 seeds** -- hero plays 0 cards in some turns, dying to burst
- This is a sim AI issue, not a game balance problem
- Deck bloats to 21, well above the 14-17 target
- BQ 61 is low despite 3/3 clears; deck has too many off-spec cards
- Optimizer needs tighter discipline on deck size and card selection

## Secondary Build: Javazon
**Tree:** amazon_javelin_and_spear (martial)
**Target deck:** 14-17 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| jab | 1 | 2 | 7+6 dmg | payoff |
| power_strike | 2 | 1 | 11 lightning dmg, 2 paralyze | payoff |
| charged_strike | 3 | 2 | 12x2 lightning dmg, 3 paralyze | payoff |
| lightning_bolt | 2 | 1 | 8 lightning dmg, 1 paralyze | setup |
| lightning_strike | 3 | 2 | 14 dmg + 7 AoE, 2 paralyze all | payoff |
| inner_sight | 1 | 1 | 1 slow, merc +8, draw 1 | support |

### Synergy Loop
1. Power_strike (11 + 2 paralyze) and charged_strike (12x2 + 3 paralyze) apply paralyze
2. Storm_javelin deals +8 if target paralyzed
3. Lightning_fury deals 13 AoE + 3 paralyze to all
4. Javelin_mastery aura gives javelin cards +3 dmg +1 paralyze
5. Paralyze -> payoff -> more paralyze chain reaction

### Evolution Chains
- jab -> power_strike -> charged_strike -> lightning_fury

## Sim Findings
- Amazon clears 3/3 but BQ 61 shows the optimizer is over-acquiring cards
- Deck at 21 is 4 cards over target maximum of 17
- Burst death problem is sim AI failing to play cards, not amazon balance
- Marksman build has excellent merc synergy via inner_sight/penetrate marking
- Javazon paralyze chain is theoretically strong but not the sim's primary path
