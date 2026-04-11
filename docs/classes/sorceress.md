# Sorceress

## Current Sim Status
- Clear rate: 0/3 (fails Act 4 and Act 5)
- Build quality: 62/100
- Deck size: 18 (target: 14-17)

## Primary Build: Lightning
**Tree:** sorceress_lightning (arcane)
**Target deck:** 14-17 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| charged_bolt | 1 | 1 | 8 lightning dmg, 1 paralyze | setup |
| static_field | 2 | 1 | 5 AoE lightning, paralyze all, draw 1 | setup |
| chain_lightning | 3 | 2 | 9 AoE lightning, paralyze all, draw 1 | payoff |
| lightning | 3 | 2 | 20 lightning dmg, 2 paralyze, draw 1 | payoff |
| nova | 2 | 2 | 8 AoE lightning, paralyze all (+draw if spell played) | payoff |
| thunder_storm | 3 | 1 | 6 AoE lightning, paralyze all, next spell +5 | setup |

### Flex Cards (good-to-have)
- energy_shield (T1, 1E) -- 14 guard, draw 1
- warmth (T1, 1E) -- heal 6, merc heal 4, party 14 guard, draw 1
- enchant (T2, 1E) -- next 2 spells +4, merc +8, 14 guard, draw 1
- spell_surge (T3, 1E) -- 5 AoE, next spell +6, draw 1
- arcane_focus (T2, 1E) -- heal 6, 14 guard, draw 1, next spell -1 cost
- rally_mercenary

### Unwanted (actively avoid)
- swing, measured_swing, kick, mark_target

### Synergy Loop
1. Thunder_storm buffs next spell +5 and paralyzes all enemies
2. Spell_surge buffs next spell +6 and deals 5 AoE
3. Chain_lightning or nova deals massive AoE + paralyze with accumulated buffs
4. Arc_mastery aura gives all lightning spells +3 dmg +1 draw
5. Draw engine snowballs: play spells -> draw cards -> play more spells

### Evolution Chains
- charged_bolt -> static_field -> chain_lightning -> lightning_mastery
- ice_bolt -> frost_nova -> blizzard -> frozen_orb
- fire_bolt -> fireball -> meteor -> hydra
- inferno -> meteor -> hydra

### Known Issues
- **lightning and thunder_storm never appear in reward pool** -- core cards are unreachable
- Optimizer purges attack cards while keeping Lightning Mastery (an aura with no attacks to buff)
- teleport flooding fixed (10 -> 3) but deck still bloats to 18
- Without lightning/thunder_storm, the synergy loop cannot function
- BQ 62 reflects a fundamentally broken reward pool, not just optimizer error

## Secondary Build: Fire
**Tree:** sorceress_fire (arcane)
**Target deck:** 14-16 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| fire_bolt | 1 | 1 | 10 fire dmg, 4 burn | setup |
| fireball | 2 | 2 | 12 fire dmg, 4 burn, merc +6 | payoff |
| inferno | 2 | 1 | 7 fire dmg, 6 burn, merc +4 | setup |
| fire_wall | 3 | 2 | 7 AoE fire, 5 burn all, merc +8 | setup |
| combustion | 3 | 2 | 6 AoE fire, +3 per burn stack (max 5) | payoff |
| blaze | 2 | 1 | 4 AoE fire, 3 burn all, merc +6 | setup |

### Synergy Loop
1. Fire_bolt/inferno/blaze stack burn across enemies
2. Combustion deals 3x damage per burn stack (up to 5) = 15 bonus AoE
3. Conflagration deals +8 to enemies with 4+ burn
4. Fire_mastery aura gives all fire spells +3 dmg +2 burn

## Secondary Build: Frost
**Tree:** sorceress_cold (arcane)
**Target deck:** 14-16 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| ice_bolt | 1 | 1 | 5 cold dmg, 2 slow | setup |
| frost_nova | 2 | 2 | 6 AoE cold, freeze all | payoff |
| blizzard | 3 | 2 | 8 AoE cold, freeze all | setup |
| glacial_spike | 3 | 1 | 10 cold dmg, 1 freeze, 1 slow | answer |
| ice_blast | 3 | 2 | 16 cold dmg, 1 freeze, 2 slow (+6 if slowed) | payoff |
| frozen_orb | 4 | 2 | 10 AoE cold, 2 freeze all | payoff |

### Synergy Loop
1. Ice_bolt/frost_nova apply slow and freeze
2. Ice_blast deals +6 if target already slowed
3. Cold_mastery aura gives cold spells +3 dmg +1 slow
4. Enemies are permanently crowd-controlled

## Sim Findings
- 0/3 clear rate is the worst tied with druid and necromancer
- Root cause: lightning and thunder_storm are never offered as rewards
- Optimizer keeps Lightning Mastery aura but purges the attack cards it should buff
- teleport flooding was fixed (10 -> 3) but deeper reward pool issues remain
- Fire and frost builds may be viable alternatives but are not the sim's primary spec
