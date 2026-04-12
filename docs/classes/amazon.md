# Amazon

## Current Sim Status
- Clear rate: 3/3 (full clear, 3 seeds -- strongest raw clear rate)
- Build quality: 61/100
- Deck size: 20 (target: 14-17)
- Engine: guided_arrow x4 + strafe x4 + freezing_arrow x3 + pierce x3
- Deck slightly bloated (20-21 vs 14-17 target)

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
- Deck bloats to 20-21, well above the 14-17 target
- BQ 61 is low despite 3/3 clears; deck has too many off-spec cards
- Optimizer needs tighter discipline on deck size and card selection
- Strongest raw clear rate of all classes despite bloated deck

#### Bugs Fixed (latest session)
- tempSummonPowerBonus was never consumed by minions (critical for Druid/Necro)
- World node hero_max_life rewards destroyed overheal buffer
- Safe zone optimizer spent gold on deck shaping before healer
- support_build duplicate flooding (teleport x10, fade x10)

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

---

## Build Guide: Marksman

### Gear Progression

Amazon preferred weapon families: **Bows, Crossbows, Javelins, Spears, Polearms**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Short Bow | Bows | +1 dmg, +1 guard | Bow start for Marksman |
| 1 | Javelin | Javelins | +2 dmg, +1 guard, +1 energy | Javazon start; energy is valuable |
| 2 | Long Bow | Bows | +2 dmg, +1 guard | First bow upgrade |
| 2 | Crossbow | Crossbows | +2 dmg | Crossbow alternative |
| 2 | Spear | Spears | +2 dmg, +1 guard | Javazon melee option |
| 3 | Composite Bow | Bows | +3 dmg, +1 energy | Energy + damage; great for Marksman |
| 3 | War Javelin | Javelins | +5 dmg, +1 guard, +2 energy | Best Act 3 Javazon weapon |
| 4 | Cedar Bow | Bows | +5 dmg, +1 guard, +1 energy | Strong Act 4 bow |
| 4 | Edge Bow | Bows | +5 dmg, +2 guard | Guard-focused bow |
| 4 | Siege Crossbow | Crossbows | +4 dmg, +1 guard | Crossbow alternative |
| 4 | War Spear | Spears | +6 dmg, +2 guard | Javazon Act 4 |
| 5 | Hydra Bow | Bows | +8 dmg, +2 guard, +1 energy | Best endgame bow (tier 8) |
| 5 | Ashwood Bow | Bows | +7 dmg, +2 guard, +1 energy | Strong alternative |
| 5 | Gorgon Crossbow | Crossbows | +7 dmg, +2 guard | Endgame crossbow (tier 8) |
| 5 | Hyperion Javelin | Javelins | +8 dmg, +1 guard, +2 energy | Endgame javelin (tier 7) |
| 5 | Ghost Spear | Spears | +8 dmg, +2 guard | Endgame spear (tier 8) |

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Quilted Armor | +6 maxLife, +1 guard |
| 2 | Scale Mail | +8 maxLife, +4 merc life |
| 3 | Ring Mail | +10 maxLife, +6 merc life |
| 4 | Plate Mail / Field Plate | +13-14 maxLife, +6 merc life |
| 5 | Ancient Armor / Archon Plate | +20-24 maxLife, +2-3 guard |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Inner_sight for slow + merc mark; call_the_shot (starter) for setup
- **Key pickups**: inner_sight, magic_arrow, dodge, critical_strike
- **Tree investment**: 1-2 ranks in martial; first threshold gives +1 dmg +1 guard
- **Danger signs**: No slow application; Amazon DPS depends on status payoffs

**Act 2 (Levels 7-12)**
- **Priority**: Cold_arrow for slow stacking; weapon upgrade (Long Bow or Crossbow)
- **Key pickups**: cold_arrow, multiple_shot, penetrate
- **Tree investment**: 3-4 ranks; second threshold unlock
- **Danger signs**: Deck bloating past 17; Amazon needs clean draws for ranged chains

**Act 3 (Levels 13-18)**
- **Priority**: Guided_arrow (16 dmg + draw) is the card that makes Marksman real
- **Key pickups**: guided_arrow, strafe, inner_calm, exploding_arrow
- **Tree investment**: 5-6 ranks; cumulative dmg + guard bonuses significant
- **Danger signs**: No draw cards -- Amazon without draw stalls between burst turns

**Act 4 (Levels 19-24)**
- **Priority**: Cedar Bow (+5 dmg +1 energy); pierce or arrow_mastery capstone
- **Key pickups**: pierce (26 dmg + merc +18), freezing_arrow, arrow_mastery (aura)
- **Tree investment**: 7-8 ranks
- **Danger signs**: Deck at 21 (current sim problem) -- must trim to 14-17

**Act 5 (Levels 25-30)**
- **Priority**: Hydra Bow (tier 8, +8 dmg); final capstone
- **Key pickups**: thunder_volley, valkyrie; endgame armor
- **Tree investment**: Max ranks; full threshold bonuses
- **Danger signs**: Baal's minion swarm requires AoE (multiple_shot, strafe); pure single-target loses

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Amazon has a solid Act 1 thanks to inner_sight marking + merc damage
- Required hero DPS: ~20/turn (magic_arrow + merc mark easily reaches this)
- Inner_sight turn 1 for slow + merc +8; magic_arrow for draw cycling
- **What kills you**: Ignoring minion summons; they pile up while you focus the boss

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Cold_arrow slow disrupts Duriel's charge timing; ranged keeps hero safe
- Required hero DPS: ~25-30/turn
- Lead with cold_arrow for slow; penetrate for merc +10; dodge for guard
- **What kills you**: Merc dies to Burrow Charge; losing merc mark damage

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Multiple_shot (7 AoE + slow all) handles his Durance Ward summons
- Required hero DPS: ~35-40/turn
- Guided_arrow (16 dmg + draw) is the primary damage card here
- Strafe (9 AoE + slow) if available for board control
- **What kills you**: Lightning Nova AoE with no guard; dodge alone is not enough

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- Amazon's ranged cards keep hero at distance but Apocalypse still hits
- Required hero DPS: ~45-50/turn
- Pierce (26 dmg + merc +18) is the burst answer; arrow_mastery aura (+3 ranged) amplifies all
- Inner_calm (heal 6, guard, next ranged +3) provides sustain
- **What kills you**: Infernal Resurgence out-healing you; need sustained DPS, not burst alone

**Baal (Act 5) -- ~150-200 dmg/turn**
- Minion summons + Rift Burst AoE; Amazon must AoE the minions while bursting Baal
- Required hero DPS: ~50-60/turn
- Multiple_shot / strafe for minion clear; guided_arrow + pierce for Baal damage
- Thunder_volley (capstone AoE) if available solves the minion problem
- **What kills you**: Deck too big (21 cards in sim); key cards come too slowly

### Reference Endgame Deck (Marksman, 16 cards)

```
1x magic_arrow         -- 7 magic dmg, draw 1; cheap cycle
1x cold_arrow          -- 7 cold, 1 slow; status applicator
1x guided_arrow        -- 16 dmg, draw 1; primary single-target
1x multiple_shot       -- 7 AoE, slow all; board control
1x strafe             -- 9 AoE, slow all, 6 guard, draw 1; upgraded AoE
1x inner_sight         -- slow, merc +8, draw 1; merc damage enabler
1x penetrate           -- 10 dmg, 1 slow, merc +10; merc scaling
1x pierce             -- 26 dmg, merc +18; endgame finisher
1x critical_strike     -- 14 dmg, draw 1; burst damage
1x dodge              -- 14 guard, draw 1; defensive anchor
1x inner_calm          -- heal 6, 14 guard, draw 1, next ranged +3; sustain + buff
1x exploding_arrow     -- 8 fire, 3 burn, draw 1; elemental splash
1x freezing_arrow      -- cold + freeze; crowd control capstone
1x arrow_mastery       -- aura: ranged cards +3 dmg; engine
1x rally_mercenary     -- mercenary activation
1x guard_stance        -- emergency guard
```

### Reference Endgame Deck (Javazon, 15 cards)

```
1x jab                -- 7+6 dmg; cheap multi-hit
1x power_strike        -- 11 lightning, 2 paralyze; primary setup
1x charged_strike      -- 12x2 lightning, 3 paralyze; burst payoff
1x lightning_bolt      -- 8 lightning, 1 paralyze; ranged option
1x lightning_strike    -- 14 + 7 AoE, 2 paralyze all; AoE burst
1x lightning_fury      -- 13 AoE, 3 paralyze all; capstone AoE
1x inner_sight         -- slow, merc +8, draw 1; merc enabler
1x penetrate           -- 10 dmg, slow, merc +10; merc scaling
1x dodge              -- 14 guard, draw 1; defense
1x critical_strike     -- 14 dmg, draw 1; filler burst
1x decoy             -- guard + distraction; setup defense
1x javelin_mastery     -- aura: javelin cards +3 dmg +1 paralyze; engine
1x storm_javelin       -- +8 if paralyzed; conditional burst
1x war_pike           -- capstone melee finisher
1x rally_mercenary     -- mercenary activation
```

---

## Sim Findings
- Amazon clears 3/3 with strongest raw clear rate; BQ 61 shows the optimizer is over-acquiring cards
- Converges to guided_arrow x4 + strafe x4 + freezing_arrow x3 + pierce x3
- Deck at 20-21 is 3-4 cards over target maximum of 17
- Marksman build has excellent merc synergy via inner_sight/penetrate marking
- Javazon paralyze chain is theoretically strong but not the sim's primary path
