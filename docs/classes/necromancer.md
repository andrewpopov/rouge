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

## Sim Findings
- BQ 75 is reasonable but 0/3 clear rate reveals a scaling problem past Act 3
- The evolution system actively undermines the summoner build by replacing base summons
- Zero seed variance suggests the optimizer always takes the same path
- Fix needed: evolution policy should not replace the last copy of a core summon card
