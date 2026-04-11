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

---

## Build Guide: Lightning Sorceress

### Gear Progression

Sorceress preferred weapon families: **Wands, Staves**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Yew Wand | Wands | +1 energy, +1 guard, +1 merc atk | Starting wand; energy is everything |
| 2 | Battle Staff | Staves | +2 dmg, +3 energy, +2 burn | Staff path starts here; energy premium |
| 3 | Wand | Wands | +2 energy, +1 guard, +2 merc atk | Wand path continues |
| 3 | Gnarled Staff | Staves | +3 dmg, +3 energy, +4 guard, +3 burn | Best Act 3 caster weapon |
| 4 | Bone Wand | Wands | +3 energy, +3 dmg, +4 guard, +4 merc atk | Major power spike |
| 4 | War Staff | Staves | +5 dmg, +4 energy, +4 guard, +6 burn, +8 maxLife | Best Act 4 overall |
| 5 | Lich Wand | Wands | +4 energy, +3 dmg, +4 guard, +5 merc atk | Endgame wand |
| 5 | War Staff (keep) | Staves | -- | War Staff remains best staff at Act 5 |

**Note**: Staves offer higher burn bonuses (critical for Fire build), while Wands offer more energy and merc attack. Lightning builds prefer whichever gives the most energy. Fire builds should always take Staves.

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Quilted Armor | +6 maxLife, +1 guard |
| 2 | Chain Mail | +9 maxLife, +1 guard |
| 3 | Splint Mail | +11 maxLife, +1 guard |
| 4 | Ghost Armor | +12 maxLife, +1 energy, +1 guard |
| 5 | Mage Plate | +14 maxLife, +2 energy |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Fire_bolt (starter) for early damage; energy_shield for defense
- **Key pickups**: fire_bolt (or ice_bolt), energy_shield, warmth
- **Tree investment**: 1-2 ranks in arcane; first threshold gives +1 burn
- **Danger signs**: No guard generation; Sorceress has the lowest base HP in the game

**Act 2 (Levels 7-12)**
- **Priority**: Commit to an element; Battle Staff or Scimitar depending on weapon drops
- **Key pickups (Lightning)**: charged_bolt, static_field, enchant
- **Key pickups (Fire)**: fireball, inferno, blaze
- **Key pickups (Cold)**: frost_nova, ice_blast
- **Tree investment**: 3-4 ranks; energy + burn bonuses accumulating
- **Danger signs**: Mixing elements -- spreading thin across trees wastes synergy

**Act 3 (Levels 13-18)**
- **Priority**: Core spell chain assembled; spell_surge or thunder_storm for buff stacking
- **Key pickups (Lightning)**: chain_lightning, thunder_storm, spell_surge
- **Key pickups (Fire)**: fire_wall, combustion, blaze
- **Key pickups (Cold)**: blizzard, glacial_spike
- **Tree investment**: 5-6 ranks; cumulative energy and spell bonuses now significant
- **Danger signs**: Reward pool not offering core lightning cards (known issue); pivot to fire or cold

**Act 4 (Levels 19-24)**
- **Priority**: Bone Wand or War Staff; capstone spell investment
- **Key pickups (Lightning)**: lightning, nova, arc_mastery (aura capstone)
- **Key pickups (Fire)**: meteor, combustion, fire_mastery (aura)
- **Key pickups (Cold)**: frozen_orb, cold_mastery (aura)
- **Tree investment**: 7-8 ranks
- **Danger signs**: Aura capstone without enough spells to buff -- Lightning Mastery with no lightning cards

**Act 5 (Levels 25-30)**
- **Priority**: Endgame weapon; capstone spell; deck trim to 14-16
- **Key pickups**: overcharge, hydra, tempest (depending on element)
- **Tree investment**: Max ranks; full threshold bonuses
- **Danger signs**: Deck above 17 means spells come too slowly; Sorceress must be tight

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Sorceress has the weakest Act 1 of any class; low HP, limited damage
- Required hero DPS: ~20/turn (fire_bolt + energy_shield cycling barely reaches this)
- Fire_bolt for damage; energy_shield for guard; warmth for sustain
- **What kills you**: Poison stacking with no heal; Sorceress base HP cannot absorb it

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Spell damage starts to come online; charged_bolt's paralyze helps
- Required hero DPS: ~25/turn
- Static_field (AoE + paralyze) or frost_nova (freeze all) buys time
- Enchant buffs merc for secondary damage
- **What kills you**: Duriel's sunder when you have no guard; mercenary dying removes damage

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning vs lightning; Mephisto uses the same element, so you take type-matched hits
- Required hero DPS: ~35-40/turn
- Chain_lightning (9 AoE + paralyze) is the answer; spell_surge -> chain_lightning for 15 AoE
- **What kills you**: Lightning Nova AoE while you are mid-chain; need guard pre-deployed

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- This is where Sorceress historically fails (0/3 clear)
- Required hero DPS: ~45-50/turn
- Thunder_storm (+5 next spell) -> spell_surge (+6 next spell) -> lightning (20+11) = 31 single hit
- Fire build: burn stack -> combustion (3x per stack, max 5) = 15 bonus AoE
- **What kills you**: Apocalypse AoE burn + Infernal Resurgence heal; DPS must exceed heal rate

**Baal (Act 5) -- ~150-200 dmg/turn**
- Minion swarm + Rift Burst AoE; Sorceress needs AoE to handle board
- Required hero DPS: ~55/turn
- Nova or chain_lightning for AoE; frozen_orb (10 AoE + freeze) if cold build
- Arc_mastery aura (+3 dmg +1 draw to all lightning) sustains the chain
- **What kills you**: Rift Burst during a turn where you drew setup cards instead of damage

### Reference Endgame Deck (Lightning, 15 cards)

```
1x charged_bolt        -- 8 lightning, 1 paralyze; early setup
1x static_field        -- 5 AoE lightning, paralyze all, draw 1; board control
1x chain_lightning     -- 9 AoE lightning, paralyze all, draw 1; primary AoE
1x lightning           -- 20 lightning, 2 paralyze, draw 1; single-target burst
1x nova               -- 8 AoE lightning, paralyze all; board wipe
1x thunder_storm       -- 6 AoE, paralyze all, next spell +5; buff enabler
1x spell_surge         -- 5 AoE, next spell +6, draw 1; damage amplifier
1x energy_shield       -- 14 guard, draw 1; defensive anchor
1x warmth             -- heal 6, merc heal 4, party 14 guard, draw 1; sustain
1x enchant            -- next 2 spells +4, merc +8, 14 guard, draw 1; buff
1x arcane_focus        -- heal 6, 14 guard, draw 1, next spell -1 cost; utility
1x arc_mastery         -- aura: lightning spells +3 dmg +1 draw; engine
1x overcharge          -- +6 AoE if played spell earlier; finisher
1x lightning_mastery   -- capstone; massive lightning scaling
1x rally_mercenary     -- mercenary activation
```

### Reference Endgame Deck (Fire, 15 cards)

```
1x fire_bolt           -- 10 fire, 4 burn; cheap applicator
1x fireball            -- 12 fire, 4 burn, merc +6; primary damage
1x inferno             -- 7 fire, 6 burn, merc +4; burn stacker
1x blaze              -- 4 AoE fire, 3 burn all, merc +6; AoE burn
1x fire_wall           -- 7 AoE fire, 5 burn all, merc +8; heavy burn
1x combustion          -- 6 AoE fire, +3 per burn (max 5); burst payoff
1x meteor             -- massive single-target fire + burn; finisher
1x energy_shield       -- 14 guard, draw 1; defense
1x warmth             -- heal 6, party 14 guard, draw 1; sustain
1x enchant            -- next 2 spells +4, merc +8, draw 1; buff
1x arcane_focus        -- heal 6, 14 guard, draw 1, -1 cost; utility
1x fire_mastery        -- aura: fire spells +3 dmg +2 burn; engine
1x conflagration       -- +8 to enemies with 4+ burn; capstone payoff
1x hydra              -- capstone persistent fire damage
1x rally_mercenary     -- mercenary activation
```

---

## Sim Findings
- 0/3 clear rate is the worst tied with druid and necromancer
- Root cause: lightning and thunder_storm are never offered as rewards
- Optimizer keeps Lightning Mastery aura but purges the attack cards it should buff
- teleport flooding was fixed (10 -> 3) but deeper reward pool issues remain
- Fire and frost builds may be viable alternatives but are not the sim's primary spec
