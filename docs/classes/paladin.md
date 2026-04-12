# Paladin

## Current Sim Status
- Clear rate: 3/3 (full clear, 3 seeds)
- Build quality: 78/100 (highest of all classes)
- Deck size: 16 (target: 13-18)
- Engine: holy_freeze x3-4 + defiance x3 + holy_shield x3-4 + conviction
- Offensive auras tree override (+1 dmg/rank) resolved earlier Act 1 failures

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
- Act 1 failures resolved by offensive auras tree override (+1 dmg/rank)
- BQ 78 is the highest of all classes; paladin is currently the best-balanced class
- Converges reliably to holy_freeze + defiance + holy_shield + conviction engine

#### Bugs Fixed (latest session)
- tempSummonPowerBonus was never consumed by minions (critical for Druid/Necro)
- World node hero_max_life rewards destroyed overheal buffer
- Safe zone optimizer spent gold on deck shaping before healer
- support_build duplicate flooding (teleport x10, fade x10)

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

---

## Build Guide: Zealot

### Gear Progression

Paladin preferred weapon families: **Maces, Swords**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Short Sword | Swords | +1 dmg, +1 merc atk | Starting option |
| 1 | Mace | Maces | +2 dmg, +1 merc atk | Slightly better Act 1 start |
| 2 | Morning Star | Maces | +3 dmg, +1 guard, +1 merc atk | First upgrade; guard matters for Paladin |
| 2 | Scimitar | Swords | +3 dmg, +1 guard | Sword alternative |
| 3 | Flail | Maces | +4 dmg, +1 guard, +4 maxLife | Sustain + damage |
| 3 | Long Sword | Swords | +4 dmg, +1 guard | Pure damage |
| 4 | War Hammer | Maces | +9 dmg, +4 guard, +10 maxLife | Best Act 4; defines Paladin power spike |
| 4 | Bastard Sword | Swords | +5 dmg, +2 guard | Sword alternative |
| 5 | Maul | Maces | +11 dmg, +4 guard, +12 maxLife | Endgame best-in-slot |
| 5 | Colossus Blade | Swords | +8 dmg, +2 guard | If Sword-committed |

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Breast Plate | +7 maxLife, +1 potion heal |
| 2 | Chain Mail | +9 maxLife, +1 guard |
| 3 | Splint Mail | +11 maxLife, +1 guard |
| 4 | Plate Mail / Field Plate | +13-14 maxLife, +6 merc life |
| 5 | Boneweave / Archon Plate | +22-24 maxLife, +2-3 guard |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Establish burn application with thorns and early holy cards
- **Key pickups**: thorns, smite, might, prayer
- **Tree investment**: 1-2 ranks in support (offensive_auras tree gives +1 dmg +1 guard per rank)
- **Danger signs**: Elite RNG with extra_fast + extra_strong can kill before burn engine starts

**Act 2 (Levels 7-12)**
- **Priority**: Holy_fire is the build-defining card; get Morning Star for guard
- **Key pickups**: holy_fire, charge, blessed_aim, cleansing
- **Tree investment**: 3-4 ranks; threshold bonus gives +1 dmg +1 maxLife
- **Danger signs**: No burn application cards; the buff chain has nothing to amplify

**Act 3 (Levels 13-18)**
- **Priority**: Vengeance adds 5 burn; concentration enables burst; lock in the loop
- **Key pickups**: vengeance, concentration, holy_strike, defiance
- **Tree investment**: 5-6 ranks; substantial stat bonuses accumulating
- **Danger signs**: All setup cards, no payoff -- drawing buffs without attacks to use them on

**Act 4 (Levels 19-24)**
- **Priority**: War Hammer (+9 dmg, +4 guard, +10 maxLife) is transformative
- **Key pickups**: crusade (party +5 dmg), fanaticism capstone
- **Tree investment**: 7-8 ranks
- **Danger signs**: Deck above 16 cards; Zealot needs tight cycling for burn + buff + strike

**Act 5 (Levels 25-30)**
- **Priority**: Maul endgame; righteous_wrath or divine_command capstone
- **Key pickups**: Final capstone; endgame armor
- **Tree investment**: Max ranks; full threshold bonuses active
- **Danger signs**: Baal's minion summons can overwhelm if you lack AoE (holy_freeze helps)

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Paladin has one of the better Act 1 boss fights thanks to thorns + smite
- Required hero DPS: ~20/turn (thorns burn + smite + merc easily reaches this)
- Thorns turn 1 for burn; prayer if you need sustain; smite for direct damage
- **What kills you**: Elite trait RNG before the boss; the boss itself is manageable

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Holy_fire's burn (4) makes Duriel fights faster; charge interrupts his pattern
- Required hero DPS: ~25-30/turn
- Lead with holy_fire for burn; charge for +3 to next attack; blessed_aim for +4 to next 2
- **What kills you**: Not enough guard; Duriel's sunder strips defense

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning AoE is the primary threat; burn must be stacked high for vengeance payoff
- Required hero DPS: ~35-40/turn
- Concentration -> vengeance (13 dmg + 5 burn) is the core combo here
- Defiance gives party guard + taunt to absorb Lightning Nova
- **What kills you**: No guard response to Lightning Nova; party takes full AoE

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- Fire mirror match; Diablo applies burn too -- but Paladin's burn is stronger
- Required hero DPS: ~45-50/turn
- Crusade (party +5 dmg) amplifies every attack; holy_strike chains 3 hits with burn bonus
- War Hammer + concentration + holy_strike can deal 40+ in a single turn
- **What kills you**: Infernal Resurgence out-heals you if your burst is too spread out

**Baal (Act 5) -- ~150-200 dmg/turn**
- Minion summons + Rift Burst AoE + teleport + self-heal
- Required hero DPS: ~50-60/turn
- Holy_freeze (if Guardian splash) handles minions; otherwise focus Baal directly
- Fanaticism capstone + Maul + full buff chain = 60+ burst turns
- **What kills you**: Splitting damage between Baal and minions; neither dies fast enough

### Reference Endgame Deck (Zealot, 15 cards)

```
1x holy_fire           -- 9 dmg, 4 burn, merc +6, draw 1; engine starter
1x thorns              -- 5 dmg, 2 burn; cheap burn applicator
1x charge              -- 12 dmg, next atk +3; combo bridge
1x blessed_aim         -- next 2 atks +4, 14 guard, draw 1; buff engine
1x vengeance           -- 13 dmg, 5 burn; primary damage card
1x concentration       -- next aura/atk +5, 14 guard, draw 1; burst enabler
1x holy_strike         -- 3-hit chain (+3 per hit if burn/slow); payoff
1x crusade             -- party +5 dmg; full-turn amplification
1x might               -- 6 dmg, slow, merc +8, draw 1; merc damage
1x prayer              -- heal 6, merc heal 5, 14 guard, draw 1; sustain
1x defiance            -- party 14 guard, draw 1, taunt; defensive anchor
1x cleansing           -- heal 6, 14 guard, draw 1; recovery
1x smite              -- 6 dmg; filler / early pressure
1x fanaticism          -- capstone; massive damage + burn scaling
1x sacrifice           -- 15 dmg; burst finisher for boss turns
```

---

## Sim Findings
- Paladin is the strongest performing class: 3/3 clear, BQ 78 (highest)
- Converges to holy_freeze x3-4 + defiance x3 + holy_shield x3-4 + conviction
- Offensive auras tree override (+1 dmg/rank) resolved earlier Act 1 failures
- Guardian build is viable but slower; Zealot is primary
