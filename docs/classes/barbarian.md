# Barbarian

## Current Sim Status
- Clear rate: 3/3 (full clear)
- Build quality: 56/100
- Deck size: 18 (target: 13-18)

## Primary Build: Berserker
**Tree:** barbarian_combat_masteries (martial)
**Target deck:** 13-16 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| bash | 1 | 2 | 14 dmg | payoff |
| double_swing | 2 | 1 | 6+5 dmg | payoff |
| sword_mastery | 1 | 1 | 8 dmg, draw 1 | support |
| stun | 2 | 1 | 10 dmg, 1 Stun | answer |
| axe_mastery | 2 | 1 | 10 dmg, next atk +3 | setup |
| concentrate | 3 | 1 | heal 4, 14 dmg, 12 guard | payoff |

### Flex Cards (good-to-have)
- frenzy (T3, 2E) -- 10+9 dmg, draw 1
- weapon_mastery (T2, 1E) -- 10 dmg, merc +8, draw 1
- battle_charge (T2, 1E) -- 9 dmg, draw 1
- iron_skin (T1, 1E) -- 14 guard, draw 1
- find_potion (T1, 1E) -- heal 6, 14 guard, draw 1
- natural_resistance (T1, 1E) -- heal 6, 14 guard, draw 1
- howl (T1, 1E) -- slow all, 14 guard, draw 1
- rally_mercenary, guard_stance

### Unwanted (actively avoid)
- swing, measured_swing, kick, field_dressing, mark_target

### Synergy Loop
1. Play axe_mastery or increased_stamina to buff next attacks (+3 per hit)
2. Follow with bash (14 dmg) or frenzy (10+9 dmg) for amplified burst
3. Stun locks high-threat enemies while you cycle damage
4. Tight deck (13-16) ensures combo pieces recur every 2-3 turns

### Evolution Chains
- bash -> stun -> concentrate -> berserk
- double_swing -> frenzy
- sword_mastery -> weapon_mastery -> battle_instinct
- iron_skin -> steel_skin
- natural_resistance -> unyielding
- howl -> shout -> battle_orders -> war_cry
- leap -> leap_attack -> whirlwind

### Known Issues
- **BQ 56 is lowest of all classes** -- wins via raw stat values not synergy
- Optimizer replaces core cards with off-spec cards during progression
- Deck bloats to 18 (above 16 target for Berserker) reducing combo density
- No energy issues but synergy loop underperforms relative to card count

## Secondary Build: Warcrier
**Tree:** barbarian_warcries (command)
**Target deck:** 15-18 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| howl | 1 | 1 | slow all, 14 guard, draw 1 | answer |
| shout | 2 | 1 | slow all, party 14 guard, draw 1, taunt | support |
| battle_cry | 2 | 1 | enemies -3 dmg, next atk +4, 14 guard, draw 1 | setup |
| battle_orders | 3 | 2 | heal 10, slow all, party 22 guard, merc +16 | support |
| war_cry | 4 | 2 | 14 AoE dmg, stun all | answer |
| fury_howl | 3 | 1 | slow all, next 2 atks +4, 14 guard, draw 1 | setup |

### Synergy Loop
1. Play warcry cards to generate guard + slow + draw
2. Battle_command aura makes all warcries draw +1 and gain +4 guard
3. Sustained value engine out-attritions any boss
4. Mercenary does primary damage via buffed attacks

### Evolution Chains
- howl -> shout -> battle_orders -> war_cry

---

## Build Guide: Berserker

### Gear Progression

Barbarian preferred weapon families: **Swords, Maces, Polearms**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Short Sword | Swords | +1 dmg, +1 merc atk | Starting weapon |
| 1 | Mace | Maces | +2 dmg, +1 merc atk | Alternate start if offered |
| 2 | Morning Star | Maces | +3 dmg, +1 guard, +1 merc atk | First real upgrade |
| 3 | Flail | Maces | +4 dmg, +1 guard, +4 maxLife | Sustain option |
| 3 | Long Sword | Swords | +4 dmg, +1 guard | Pure damage option |
| 4 | War Hammer | Maces | +9 dmg, +4 guard, +10 maxLife | Best Act 4 weapon for Barbarian |
| 4 | Bastard Sword | Swords | +5 dmg, +2 guard | If Sword-committed |
| 5 | Maul | Maces | +11 dmg, +4 guard, +12 maxLife | Top endgame pick |
| 5 | Colossus Blade | Swords | +8 dmg, +2 guard | Sword endgame |
| 5 | Grim Scythe | Polearms | +6 dmg, +1 guard, +2 merc atk | Polearm endgame |

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Quilted Armor / Breast Plate | +6-7 maxLife |
| 2 | Chain Mail | +9 maxLife, +1 guard |
| 3 | Splint Mail | +11 maxLife, +1 guard |
| 4 | Field Plate | +14 maxLife, +6 merc life |
| 5 | Ancient Armor / Archon Plate | +20-24 maxLife, +2-3 guard |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Establish early combat pressure with bash and sword_mastery
- **Key pickups**: bash, sword_mastery, iron_skin, find_potion
- **Tree investment**: 1-2 ranks in martial; hit first unlock threshold for +1 dmg +1 guard
- **Danger signs**: If you have no guard-generating cards by mid-Act 1, elite fights become coin flips

**Act 2 (Levels 7-12)**
- **Priority**: Add multi-hit damage and first weapon upgrade
- **Key pickups**: double_swing, axe_mastery, stun; upgrade to Morning Star
- **Tree investment**: 3-4 ranks; second threshold unlock
- **Danger signs**: Deck bloating past 16 cards; taking too many flex cards without payoffs

**Act 3 (Levels 13-18)**
- **Priority**: Lock in damage combo; start pruning deck
- **Key pickups**: concentrate, battle_charge, weapon_mastery
- **Tree investment**: 5-6 ranks; third threshold gives cumulative +3 dmg +3 guard
- **Danger signs**: No burst answer for Mephisto's lightning AoE; relying only on single-target

**Act 4 (Levels 19-24)**
- **Priority**: War Hammer is the single biggest power spike; get it
- **Key pickups**: frenzy (capstone tier); evolve sword_mastery -> weapon_mastery
- **Tree investment**: 7-8 ranks; stat bonuses now significant
- **Danger signs**: If deck is 18+ cards, combo density drops below reliable threshold

**Act 5 (Levels 25-30)**
- **Priority**: Endgame weapon (Maul or Colossus Blade); final deck trim
- **Key pickups**: berserk or combat_mastery capstone
- **Tree investment**: Max ranks; full threshold bonuses active
- **Danger signs**: Baal summons minions -- need AoE answer or you get overrun

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Poison damage is her primary threat; she summons minions and guards them
- Required hero DPS: ~20-25/turn to kill in 5-6 turns
- Play bash turn 1 for immediate pressure; use iron_skin when she telegraphs Poison Burst
- Kill minions quickly -- they accumulate and she guards them
- **What kills you**: Ignoring minions and letting poison stack up

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Sunder attacks strip your guard; Burrow Charge targets mercenary
- Required hero DPS: ~25-30/turn
- Lead with stun to interrupt his charge cycle; keep mercenary alive with guard cards
- **What kills you**: Mercenary dying early, removing your secondary damage source

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning AoE hits everyone; Durance Ward gives him massive guard
- Required hero DPS: ~35-40/turn
- Open with axe_mastery -> bash for burst; save stun for his charge turns
- **What kills you**: Not having enough guard to absorb Lightning Nova AoE

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- Fire AoE, burn stacking, sunder attacks, and self-healing
- Required hero DPS: ~40-50/turn
- This is where War Hammer's +9 dmg + 4 guard shines; concentrate provides heal + guard + damage in one card
- **What kills you**: His Infernal Resurgence heal loop if your DPS is too low

**Baal (Act 5) -- ~150-200 dmg/turn**
- Summons minions, teleports, Rift Burst AoE, self-heal + guard
- Required hero DPS: ~50-60/turn
- Open with your strongest burst combo; use war_cry (if available) to stun-lock minions
- Berserk capstone is critical here for raw damage output
- **What kills you**: Minion swarm overwhelming you while Baal heals behind guard

### Reference Endgame Deck (Berserker, 14 cards)

```
2x bash               -- primary single-target burst (14 dmg each)
1x double_swing        -- efficient multi-hit (6+5 dmg)
1x frenzy              -- capstone burst (10+9 dmg, draw 1)
1x concentrate         -- heal 4, 14 dmg, 12 guard; best all-rounder
1x axe_mastery         -- next attack +3; combo enabler
1x weapon_mastery      -- 10 dmg, merc +8, draw 1; keeps engine running
1x stun                -- 10 dmg + stun; boss interrupt
1x iron_skin           -- 14 guard, draw 1; defensive anchor
1x find_potion         -- heal 6, 14 guard, draw 1; emergency sustain
1x natural_resistance  -- heal 6, 14 guard, draw 1; second sustain slot
1x howl                -- slow all, 14 guard, draw 1; tempo play
1x battle_charge       -- 9 dmg, draw 1; deck cycling
```

---

## Sim Findings
- Barbarian clears 3/3 seeds but with the lowest build quality (56)
- Wins come from high base stats and card values, not synergy exploitation
- Optimizer needs tighter card-selection policy to stay on-spec
- Deck at 18 exceeds Berserker target of 13-16; warcrier target is 15-18
