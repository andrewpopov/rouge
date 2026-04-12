# Assassin

## Current Sim Status
- Clear rate: 3/3 (full clear, 3 seeds)
- Build quality: 75/100
- Deck size: 16 (target: 12-17)
- Shadow spec working (94% focus)
- Engine: shadow_warrior x4 + fade x3 + cobra_strike x3
- Core starters evolve: psychic_hammer -> burst_of_speed -> fade, claw_mastery -> blade_shield -> shadow_warrior

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
- **Now 3/3 clears** -- shadow spec fully functional at 94% focus
- Core cards evolve via psychic_hammer -> burst_of_speed -> fade and claw_mastery -> blade_shield -> shadow_warrior chains, which is the intended progression
- Fade flooding fixed (10 -> 4 copies) in prior session; support_build duplicate flooding fix this session prevents recurrence
- Shadow build relies heavily on merc damage; if merc dies, damage collapses

#### Bugs Fixed (latest session)
- tempSummonPowerBonus was never consumed by minions (critical for Druid/Necro)
- World node hero_max_life rewards destroyed overheal buffer
- Safe zone optimizer spent gold on deck shaping before healer
- support_build duplicate flooding (teleport x10, fade x10)

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

---

## Build Guide: Shadow Master

### Gear Progression

Assassin preferred weapon family: **Swords**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Short Sword | Swords | +1 dmg, +1 merc atk | Only option at Act 1 |
| 2 | Scimitar | Swords | +3 dmg, +1 guard | First real upgrade |
| 3 | Sabre | Swords | +3 dmg, +1 burn | Burn synergy for martial splashes |
| 3 | Long Sword | Swords | +4 dmg, +1 guard | Raw damage if no burn cards |
| 4 | Crystal Sword | Swords | +4 dmg, +1 guard, +1 energy | Energy matters for Shadow Master chain plays |
| 4 | Bastard Sword | Swords | +5 dmg, +2 guard | Highest Act 4 damage |
| 5 | Rune Sword | Swords | +5 dmg, +2 guard, +1 energy | Best shadow endgame; energy premium |
| 5 | Balrog Blade | Swords | +7 dmg, +2 guard, +1 merc atk | Highest tier 8 sword; merc synergy |
| 5 | Colossus Blade | Swords | +8 dmg, +2 guard | Pure damage endgame |

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Quilted Armor | +6 maxLife, +1 guard |
| 2 | Leather Armor | +8 maxLife, +2 potion heal |
| 3 | Splint Mail | +11 maxLife, +1 guard |
| 4 | Ghost Armor | +12 maxLife, +1 energy, +1 guard |
| 5 | Mage Plate / Archon Plate | +14-24 maxLife, +1-2 energy |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Establish tempo with shadow_feint (starter) and early draw cards
- **Key pickups**: psychic_hammer, claw_mastery, cloak_of_shadows, fire_blast
- **Tree investment**: 1-2 ranks in command; first threshold gives +1 merc atk + 2 merc life
- **Danger signs**: No draw acceleration; Assassin without card velocity is a worse Barbarian

**Act 2 (Levels 7-12)**
- **Priority**: Burst_of_speed for draw engine; Scimitar upgrade; merc mark scaling
- **Key pickups**: burst_of_speed, blade_shield, weapon_block, venom
- **Tree investment**: 3-4 ranks; draw and guard density improving
- **Danger signs**: Deck bloat above 17; Shadow Master needs tight cycling

**Act 3 (Levels 13-18)**
- **Priority**: Shadow_veil (-1 cost next 2) enables the chain engine; fade for defense
- **Key pickups**: shadow_veil, fade, cobra_strike
- **Tree investment**: 5-6 ranks; cumulative stat bonuses now meaningful
- **Danger signs**: All setup cards and no payoff -- discounting cheap cards has no value

**Act 4 (Levels 19-24)**
- **Priority**: Crystal Sword (energy) or Bastard Sword (damage); capstone investment
- **Key pickups**: shadow_warrior, lethal_tempo (aura capstone), shadow_master
- **Tree investment**: 7-8 ranks
- **Danger signs**: This is where Assassin fails (1/3 seeds) -- merc dying collapses damage

**Act 5 (Levels 25-30)**
- **Priority**: Endgame sword (Rune Sword for energy, Balrog Blade for raw damage)
- **Key pickups**: natalyas_guard, final capstone
- **Tree investment**: Max ranks; full threshold bonuses active
- **Danger signs**: Baal's AoE disrupts the tempo plan; guard density must survive burst windows

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Shadow_feint + psychic_hammer gives early tempo advantage
- Required hero DPS: ~20/turn (melee + merc mark should reach this)
- Play psychic_hammer for paralyze; cloak_of_shadows for guard
- **What kills you**: No guard cards; Andariel's poison accumulates while you set up

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Burst_of_speed is critical for draw cycling to find answers
- Required hero DPS: ~25/turn
- Lead with blade_shield for persistent damage; weapon_block when Duriel charges
- **What kills you**: Sunder attacks strip guard while mercenary takes Burrow Charge and dies

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning AoE is the key threat; fade (party 24 guard + heal 8) is the answer
- Required hero DPS: ~35/turn
- Fade before Lightning Nova; shadow_veil -> discounted burst for damage
- **What kills you**: Drawing shadow_veil without attacks; all tempo, no pressure

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- This is where Assassin most commonly fails; tests whether real DPS exists
- Required hero DPS: ~45/turn
- Shadow_warrior (+16 merc, mark +16) is the burst answer; need it early
- Lethal_tempo aura + full shadow chain for sustained DPS
- **What kills you**: Merc dies to Hell Charge; without merc, shadow_warrior marks do nothing

**Baal (Act 5) -- ~150-200 dmg/turn**
- Minion summons disrupt single-target focus; Rift Burst AoE during setup turns
- Required hero DPS: ~50/turn
- Blade_shield for persistent AoE against minions; fade for Rift Burst defense
- Shadow_master (12 dmg + merc +18) is the endgame DPS card
- **What kills you**: Rift Burst while mid-setup; guard must be pre-deployed via fade

### Reference Endgame Deck (Shadow Master, 16 cards)

```
1x psychic_hammer      -- 4 dmg, paralyze, merc +8; boss interrupt
1x burst_of_speed      -- 14 guard, merc +10, draw 2; cycle engine
1x cloak_of_shadows    -- 14 guard, draw 1; defensive anchor
1x fade                -- party 24 guard, heal 8, slow all; boss defense
1x shadow_warrior      -- merc mark +16, merc +16; primary DPS enabler
1x shadow_veil         -- next 2 Assassin -1 cost, draw 1; chain engine
1x claw_mastery        -- 8 dmg, merc mark +10; damage + mark
1x blade_shield        -- 6 AoE, slow all, merc +8, draw 1; board control
1x weapon_block        -- 14 guard, next atk -5, draw 1; defensive cycling
1x venom              -- 6 dmg, 4 poison, next melee +4, draw 1; burst setup
1x cobra_strike        -- 10 dmg, draw 1; efficient damage
1x lethal_tempo        -- aura: Assassin cards draw +1 extra; snowball engine
1x shadow_master       -- 12 dmg, merc +18, draw 1; endgame DPS
1x natalyas_guard      -- 14 guard, merc heal 6, next atk -6; late defense
1x rally_mercenary     -- mercenary activation; damage spike
1x fire_blast          -- trap tree splash; filler ranged damage
```

---

## Sim Findings
- 3/3 clear rate with BQ 75; shadow spec working at 94% focus
- Converges to shadow_warrior x4 + fade x3 + cobra_strike x3
- Core starters evolve along intended chains: psychic_hammer -> burst_of_speed -> fade, claw_mastery -> blade_shield -> shadow_warrior
- Shadow build is merc-dependent: shadow_warrior + claw_mastery mark for big merc hits
- Fade flooding fix (10 -> 4) and support_build duplicate flooding fix resolved prior deck quality issues
