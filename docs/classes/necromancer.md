# Necromancer

## Current Sim Status
- Clear rate: 0/3 (fails Act 4)
- Build quality: 75/100
- Deck size: 14 (target: 16-20)
- Seed variance: 0 (all seeds produce identical decks)

## Primary Build: Summoner
**Tree:** necromancer_summoning (command)
**Target deck:** 16-20 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| raise_skeleton | 1 | 1 | 4 dmg, summon Skeleton (7 dmg/turn) | setup |
| clay_golem | 2 | 1 | 4 AoE, slow all, summon Golem (7 dmg + 6 guard/turn) | answer |
| skeletal_mage | 2 | 1 | 5 dmg, poison all, summon Mage (8 dmg + poison/turn) | payoff |
| skeleton_mastery | 2 | 1 | all summons +4 dmg, 14 guard, draw 1 | support |
| golem_mastery | 3 | 1 | all summons +2 (golem +3), 14 guard, draw 1 | support |
| amplify_damage | 1 | 1 | 2 dmg, merc +8, draw 1 | support |

### Flex Cards (good-to-have)
- life_tap (T1, 1E) -- heal 6, 14 guard, draw 1
- bone_armor (T1, 1E) -- 16 guard, draw 1
- dark_pact (T2, 1E) -- lose 3 HP, 14 guard, draw 2
- soul_harvest (T3, 1E) -- heal 6, 14 guard, draw 1 if summon
- bone_offering (T4, 1E) -- scaling support
- rally_mercenary
- teeth (T1, 1E) -- 7 magic dmg

### Unwanted (actively avoid)
- swing, measured_swing, kick, mark_target

### Synergy Loop
1. Raise_skeleton establishes persistent 7 dmg/turn per skeleton
2. Clay_golem adds AoE slow + 7 dmg + 6 party guard per turn
3. Skeletal_mage fires for 8 + poison each turn
4. Skeleton_mastery and golem_mastery buff all summons (+4 and +2/+3)
5. Amplify_damage marks targets for merc +8, multiplying total damage

### Evolution Chains
- raise_skeleton -> skeletal_mage -> revive
- clay_golem -> blood_golem -> revive
- teeth -> corpse_explosion -> bone_spear -> bone_spirit
- bone_wall -> poison_dagger -> poison_nova
- amplify_damage -> iron_maiden -> decrepify

### Known Issues
- **golem_mastery cost fixed (9 -> 2)** but core summons evolve away during progression
- raise_skeleton and clay_golem get evolved into skeletal_mage and blood_golem, breaking the summon board
- **0 seed variance** -- all 3 seeds produce identical decks; no exploration
- Deck at 14 is undersized for a 16-20 target engine build
- Needs evolution policy that preserves summon diversity instead of always upgrading

## Secondary Build: Bone Mage
**Tree:** necromancer_poison_and_bone (arcane)
**Target deck:** 14-16 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| teeth | 1 | 1 | 7 magic dmg | payoff |
| bone_spear | 3 | 2 | 16 magic dmg (+6 if poisoned) | payoff |
| poison_dagger | 2 | 1 | 6 dmg, 4 poison, draw 1 | payoff |
| corpse_explosion | 2 | 2 | 6 AoE (+6 if enemy died last turn) | payoff |
| poison_explosion | 2 | 1 | 4 AoE, 3 poison all | setup |
| bone_wall | 1 | 1 | 4 dmg | answer |

### Synergy Loop
1. Poison_dagger and poison_explosion spread poison across enemies
2. Bone_spear deals +6 against poisoned targets
3. Corpse_explosion chains +6 AoE when enemies die
4. Kill cascade: kill one -> CE -> kill more -> CE again

### Evolution Chains
- teeth -> corpse_explosion -> bone_spear -> bone_spirit
- bone_wall -> poison_dagger -> poison_nova

---

## Build Guide: Summoner

### Gear Progression

Necromancer preferred weapon family: **Wands**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | Yew Wand | Wands | +1 energy, +1 guard, +1 merc atk | Starting weapon; energy matters most |
| 3 | Wand | Wands | +2 energy, +1 guard, +2 merc atk | First upgrade; Act 2 has no wand |
| 4 | Bone Wand | Wands | +3 energy, +3 dmg, +4 guard, +4 merc atk | Major power spike; all stats |
| 5 | Lich Wand | Wands | +4 energy, +3 dmg, +4 guard, +5 merc atk | Endgame best-in-slot |

**Note**: Wands have gaps at Act 2 -- Necromancer must survive Act 2 on the Yew Wand. This is a known progression weakness.

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Breast Plate | +7 maxLife, +1 potion heal |
| 2 | Leather Armor | +8 maxLife, +2 potion heal |
| 3 | Ring Mail | +10 maxLife, +6 merc life |
| 4 | Ghost Armor | +12 maxLife, +1 energy, +1 guard |
| 5 | Mage Plate | +14 maxLife, +2 energy |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Get raise_skeleton and raise_servant on board immediately
- **Key pickups**: raise_skeleton, amplify_damage, life_tap, bone_armor
- **Tree investment**: 1-2 ranks in command; first threshold gives +1 merc atk + 2 merc life
- **Danger signs**: No summon card by mid-Act 1; hero has no solo damage to carry fights

**Act 2 (Levels 7-12)**
- **Priority**: Add clay_golem for AoE slow; build toward 3 summons
- **Key pickups**: clay_golem, dark_pact (draw engine), skeleton_mastery
- **Tree investment**: 3-4 ranks; merc + summon bonuses accumulating
- **Danger signs**: Stuck on Yew Wand with no energy scaling; summon cards sit unplayed

**Act 3 (Levels 13-18)**
- **Priority**: Wand upgrade + skeletal_mage; skeleton_mastery makes army lethal
- **Key pickups**: skeletal_mage, golem_mastery, soul_harvest
- **Tree investment**: 5-6 ranks; cumulative summon scaling + merc buffs
- **Danger signs**: Evolution replacing raise_skeleton with skeletal_mage (losing board diversity)

**Act 4 (Levels 19-24)**
- **Priority**: Bone Wand is transformative (+3 energy, +4 guard, +4 merc atk)
- **Key pickups**: bone_offering, army_of_dead (capstone)
- **Tree investment**: 7-8 ranks
- **Danger signs**: Deck still at 14 cards (undersized for engine); need to add, not trim

**Act 5 (Levels 25-30)**
- **Priority**: Lich Wand; full summon army; capstone scaling
- **Key pickups**: corpse_harvest, revive
- **Tree investment**: Max ranks; all threshold bonuses
- **Danger signs**: Baal summons his own minions -- your summons must out-scale his

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Necromancer's weakest boss fight; limited summon board
- Required hero DPS: ~20/turn (1-2 skeletons + hero melee barely reaches this)
- Deploy raise_skeleton turn 1; amplify_damage on Andariel for merc +8
- Life_tap for sustain against her poison
- **What kills you**: No summons deployed; hero alone does 5-8 dmg/turn

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Clay_golem's slow is critical here; it delays his charge cycle
- Required hero DPS: ~25/turn (2 summons + merc should reach this)
- Open with clay_golem for slow; amplify_damage for merc burst
- **What kills you**: No slow effect; Duriel charges mercenary to death turn 2

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning AoE threatens summons; this is a scaling checkpoint
- Required hero DPS: ~35/turn (skeleton_mastery +4 to all summons is needed)
- skeleton_mastery before the fight; bone_armor for guard; amplify_damage for merc
- **What kills you**: Summons die to Lightning Nova; army collapses mid-fight

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- This is where Necromancer historically fails (0/3 clear at Act 4)
- Required hero DPS: ~45/turn (full army + bone_offering scaling needed)
- Army_of_dead (5 dmg per summon) is the burst answer; need 4+ summons
- **What kills you**: Infernal Resurgence heals Diablo faster than undersized army can damage

**Baal (Act 5) -- ~150-200 dmg/turn**
- Board-vs-board fight; Baal summons minions via Ruin Crown Call
- Required hero DPS: ~55/turn (full army + golem_mastery + capstones)
- Deploy everything turn 1; corpse_harvest for draw refuel; revive fallen summons
- **What kills you**: Rift Burst AoE wipes your board and you cannot rebuild

### Reference Endgame Deck (Summoner, 18 cards)

```
2x raise_skeleton      -- summon Skeleton (7 dmg/turn each); board foundation
1x clay_golem          -- AoE slow + summon Golem (7 dmg + 6 guard/turn)
1x skeletal_mage       -- poison + summon Mage (8 dmg + poison/turn)
1x blood_golem         -- sustain summon; heals when it attacks
1x skeleton_mastery    -- all summons +4 dmg; 14 guard; draw 1
1x golem_mastery       -- all summons +2 (golem +3); 14 guard; draw 1
1x amplify_damage      -- merc +8; draw 1; damage multiplier
1x life_tap            -- heal 6; 14 guard; draw 1
1x bone_armor          -- 16 guard; draw 1; defensive anchor
1x dark_pact           -- lose 3 HP; 14 guard; draw 2; card velocity
1x soul_harvest        -- heal 6; 14 guard; draw 1 if summon active
1x bone_offering       -- scaling support for army
1x army_of_dead        -- capstone; 5 dmg per summon; burst finisher
1x corpse_harvest      -- capstone; draw engine from corpses
1x revive              -- recover fallen summons; board rebuild
1x rally_mercenary     -- mercenary activation
```

---

## Sim Findings
- BQ 75 is reasonable but 0/3 clear rate reveals a scaling problem past Act 3
- The evolution system actively undermines the summoner build by replacing base summons
- Zero seed variance suggests the optimizer always takes the same path
- Fix needed: evolution policy should not replace the last copy of a core summon card
