# Druid

## Current Sim Status
- Clear rate: 1/3 (first clear achieved, 3 seeds)
- Build quality: 69/100
- Deck size: 19 (target: 16-20)
- Engine: heart_of_wolverine x3-4 + pack_howl x2 (summoner engine works when deployed)
- Fails when: (1) town healer can't restore HP between Act 5 fights, (2) Baal's 3483 total HP pool is massive

## Primary Build: Summoner
**Tree:** druid_summoning (command)
**Target deck:** 16-20 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| raven | 1 | 1 | party 14 guard, summon Raven (4 dmg + merc mark) | setup |
| poison_creeper | 1 | 1 | party 14 guard, summon Creeper (4 dmg + 4 poison) | setup |
| oak_sage | 2 | 1 | party 14 guard, summon Oak Sage (heals 4/turn) | support |
| spirit_wolf | 2 | 1 | 14 guard, summon Wolf (5 cold + 1 slow/turn) | setup |
| heart_of_wolverine | 3 | 1 | party 14 guard, draw 1, summon (6 dmg + merc +7) | scaling |
| pack_howl | 3 | 1 | 5 guard, all summons +4 dmg, draw 1 if 3+ summons | payoff |

### Flex Cards (good-to-have)
- natures_wrath (T3, 1E) -- 7 dmg, 2 burn, 1 slow, +4 if summon active
- dire_wolf (T2, 2E) -- 22 guard, summon Dire Wolf (7 dmg + 4 guard/turn)
- natures_balance (T2, 1E) -- heal 6, 14 guard, draw 1 if summon active
- firestorm (T1, 1E) -- 5 dmg, 4 burn
- werewolf (T1, 1E) -- 11 dmg, heal 5
- cyclone_armor (T1, 1E) -- 14 guard, draw 1
- lycanthropy (T1, 1E) -- heal 6, 14 guard, draw 1
- werebear (T2, 1E) -- 9 dmg, 1 slow, 6+6 guard, taunt
- rally_mercenary, swing, kick

### Unwanted (actively avoid)
- measured_swing, mark_target, field_dressing

### Synergy Loop
1. Play raven + poison_creeper early to establish summon board (8+ persistent DPS)
2. Add spirit_wolf and heart_of_wolverine for 20+ persistent damage per turn
3. Pack_howl buffs all summons +4 each; at 3+ summons, draws a card
4. Board accumulates; hero plays guard/draw cards while summons do damage

### Evolution Chains
- raven -> oak_sage -> heart_of_wolverine -> summon_grizzly
- firestorm -> molten_boulder -> volcano -> armageddon
- fissure -> tornado -> hurricane
- werewolf -> werebear -> fury

### Known Issues
- **First clear achieved (1/3)** -- summoner engine works when fully deployed
- Still fails at Act 5 (a5) and Act 1 (a1) in 2 of 3 seeds
- Town healer can't restore HP between Act 5 fights, leaving hero depleted for Baal
- Baal's 3483 total HP pool is massive and overwhelms the summon board
- Needs more mid-cost payoff cards that benefit from having summons active

#### Bugs Fixed (latest session)
- tempSummonPowerBonus was never consumed by minions (this was the critical fix for Druid -- summons now properly benefit from power bonuses)
- World node hero_max_life rewards destroyed overheal buffer
- Safe zone optimizer spent gold on deck shaping before healer
- support_build duplicate flooding (teleport x10, fade x10)

## Secondary Build: Elementalist
**Tree:** druid_elemental (arcane)
**Target deck:** 14-17 cards

### Core Cards (must-have)
| Card | Tier | Cost | Effect | Role |
|------|------|------|--------|------|
| firestorm | 1 | 1 | 5 dmg, 4 burn | setup |
| molten_boulder | 2 | 2 | 11 dmg, 3 burn | payoff |
| fissure | 2 | 2 | 6 AoE dmg, 2 burn all | payoff |
| volcano | 3 | 2 | 8 AoE dmg, 4 burn all | payoff |
| tornado | 3 | 2 | 12 AoE dmg (+4 if slowed) | payoff |
| twister | 2 | 1 | 5 AoE dmg, slow all, draw 1 | setup |

### Synergy Loop
1. Firestorm and fissure apply burn across enemies
2. Twister/arctic_blast apply slow
3. Tornado deals +4 to all slowed enemies
4. Eruption deals +4 per burn stack (max 5)

### Evolution Chains
- firestorm -> molten_boulder -> volcano -> armageddon
- fissure -> tornado -> hurricane

---

## Build Guide: Summoner

### Gear Progression

Druid preferred weapon families: **Staves, Maces**.

| Act | Weapon | Family | Key Bonuses | Notes |
|-----|--------|--------|-------------|-------|
| 1 | (starter deck only) | -- | -- | No Act 1 staff or mace available at tier 1 |
| 2 | Battle Staff | Staves | +2 dmg, +3 energy, +2 burn | First staff; energy is critical for summoning |
| 2 | Morning Star | Maces | +3 dmg, +1 guard, +1 merc atk | Mace fallback if no staff |
| 3 | Gnarled Staff | Staves | +3 dmg, +3 energy, +4 guard, +3 burn | Major upgrade; energy + guard |
| 3 | Flail | Maces | +4 dmg, +1 guard, +4 maxLife | Sustain-focused mace |
| 4 | War Staff | Staves | +5 dmg, +4 energy, +4 guard, +6 burn, +8 maxLife | Best Act 4 weapon for Druid |
| 4 | War Hammer | Maces | +9 dmg, +4 guard, +10 maxLife | Bruiser fallback |
| 5 | War Staff (keep) | Staves | -- | War Staff is T5; no higher staff exists |
| 5 | Maul | Maces | +11 dmg, +4 guard, +12 maxLife | Shapeshifter endgame |

**Armor progression:**

| Act | Armor | Key Bonuses |
|-----|-------|-------------|
| 1 | Quilted Armor | +6 maxLife, +1 guard |
| 2 | Scale Mail | +8 maxLife, +4 merc life |
| 3 | Ring Mail | +10 maxLife, +6 merc life |
| 4 | Ghost Armor | +12 maxLife, +1 energy, +1 guard |
| 5 | Mage Plate / Archon Plate | +14-24 maxLife, +1-2 energy |

### Act-by-Act Progression

**Act 1 (Levels 1-6)**
- **Priority**: Survive with starter deck; play primal_attunement for early setup
- **Key pickups**: raven, poison_creeper, cyclone_armor
- **Tree investment**: 1-2 ranks in command; first threshold gives +1 merc atk + 2 merc life
- **Danger signs**: No summon cards by end of Act 1 means the engine never starts; consider pivoting to elemental

**Act 2 (Levels 7-12)**
- **Priority**: Establish 2+ summons on board; get Battle Staff for energy
- **Key pickups**: oak_sage, spirit_wolf, natures_balance
- **Tree investment**: 3-4 ranks; second threshold gives another +1 merc atk + 1 dmg
- **Danger signs**: Only 1 summon card and no draw -- engine stalls and you fall behind on DPS

**Act 3 (Levels 13-18)**
- **Priority**: Hit 3+ summons for pack_howl draw trigger; lock in summon scaling
- **Key pickups**: heart_of_wolverine, pack_howl, dire_wolf
- **Tree investment**: 5-6 ranks; cumulative merc + summon scaling now meaningful
- **Danger signs**: Spending energy on non-summon cards; board never reaches critical mass

**Act 4 (Levels 19-24)**
- **Priority**: War Staff is the biggest power spike; pack_howl + 4 summons = 16 bonus damage/turn
- **Key pickups**: natures_wrath, summon_grizzly (capstone)
- **Tree investment**: 7-8 ranks
- **Danger signs**: Deck above 20 cards -- draw becomes too inconsistent to find pack_howl

**Act 5 (Levels 25-30)**
- **Priority**: Capstone summons and full board; hero plays guard while summons deal 30+ DPS
- **Key pickups**: wild_stampede or force_of_nature capstone
- **Tree investment**: Max ranks
- **Danger signs**: Baal's AoE kills summons -- need cyclone_armor and guard density to protect the board

### Boss Strategy

**Andariel (Act 1) -- ~50-70 dmg/turn, 120 HP**
- Druid struggles here; summon board is not yet established
- Required hero DPS: ~20/turn (hard to reach with 1-2 summons)
- Deploy raven or poison_creeper turn 1; use cyclone_armor for guard
- Poison_creeper's poison counters her minion swarm
- **What kills you**: Not having any summons out; hero alone lacks damage

**Duriel (Act 2) -- ~70-90 dmg/turn**
- Sunder attacks threaten mercenary; guard generation is critical
- Required hero DPS: ~25/turn (2 summons + hero can reach this)
- Spirit_wolf's cold + slow buys time; oak_sage sustains HP
- **What kills you**: Mercenary dies to Burrow Charge and you lose secondary damage

**Mephisto (Act 3) -- ~100-150 dmg/turn, 311 HP**
- Lightning AoE threatens summons; this is the hardest boss for summoner Druid
- Required hero DPS: ~35/turn (3 summons + pack_howl buff needed)
- Heart_of_wolverine's merc buff helps push damage; play guard cards to protect board
- **What kills you**: Lightning Nova kills fragile summons, collapsing your DPS engine

**Diablo (Act 4) -- ~125-175 dmg/turn, 376 HP**
- Fire AoE + burn; board must be resilient
- Required hero DPS: ~45/turn (4 summons with pack_howl = 32+ from summons alone)
- Lead with natures_wrath for burn + slow; let summon board do the work
- **What kills you**: Apocalypse AoE wipes summons and you cannot rebuild fast enough

**Baal (Act 5) -- ~150-200 dmg/turn**
- Summons minions himself -- the fight becomes board vs board
- Required hero DPS: ~50/turn (full summon board + grizzly needed)
- Deploy all summons turn 1; pack_howl immediately; wild_stampede for AoE
- **What kills you**: Baal's Rift Burst AoE kills your entire board in one turn

### Reference Endgame Deck (Summoner, 18 cards)

```
2x raven                -- summon Raven (4 dmg + merc mark); party guard
1x poison_creeper       -- summon Creeper (4 dmg + 4 poison/turn)
1x oak_sage             -- summon Oak Sage (heals 4/turn)
1x spirit_wolf          -- summon Wolf (5 cold + slow/turn)
1x dire_wolf            -- summon Dire Wolf (7 dmg + 4 guard/turn)
1x heart_of_wolverine   -- summon (6 dmg + merc +7/turn); draw 1
1x summon_grizzly       -- capstone summon; highest persistent DPS
1x pack_howl            -- all summons +4 dmg; draw 1 if 3+ summons
1x natures_wrath        -- 7 dmg, burn, slow; +4 if summon active
1x natures_balance      -- heal 6, guard, draw 1 if summon active
1x cyclone_armor        -- 14 guard, draw 1; board protection
1x lycanthropy          -- heal 6, 14 guard, draw 1; sustain
1x werebear             -- 9 dmg, slow, guard, taunt; emergency tank
1x firestorm            -- 5 dmg, 4 burn; filler damage
1x wild_stampede        -- capstone AoE; 5 dmg per summon
1x rally_mercenary      -- mercenary activation for damage spike
```

---

## Sim Findings
- First clear achieved (1/3) after tempSummonPowerBonus fix -- up from 0/3
- Summoner engine works when deployed: heart_of_wolverine x3-4 + pack_howl x2
- Still fails 2/3 seeds: town healer can't restore HP between Act 5 fights, and Baal's 3483 HP pool overwhelms
- BQ 69; deck size 19 is within the 16-20 target range
- Pack_howl is the key scaling card but needs 3+ summons to generate draw
