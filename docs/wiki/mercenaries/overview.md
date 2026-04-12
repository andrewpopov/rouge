# Mercenaries

> All mercenary types, behaviors, auras, and route perk progressions.

Last updated: 2026-04-11

## Hero Base Stats

| Property | Value |
|----------|-------|
| Name | Wanderer |
| Class | Rogue |
| Max Life | 42 |
| Max Energy | 3 |
| Hand Size | 5 |
| Potion Heal | 12 |

## Primary Mercenaries (With Route Perks)

These are the main mercenaries with full route perk progression trees.

### Blackwood Hunter (Rogue Scout)

| Property | Value |
|----------|-------|
| ID | `rogue_scout` |
| Act Origin | 1 |
| Max Life | 45 |
| Attack | 6 |
| Behavior | `mark_hunter` |
| Aura | Precision — Your ranged cards deal +2 damage |
| Passive | Consumes hero marks for extra damage |

**Best with:** Amazon (ranged builds), any build that uses `mark_enemy_for_mercenary` cards.

### Sepulcher Spearwall (Desert Guard)

| Property | Value |
|----------|-------|
| ID | `desert_guard` |
| Act Origin | 2 |
| Max Life | 52 |
| Attack | 5 |
| Behavior | `guard_after_attack` |
| Aura | Chill — All enemies deal 2 less damage |
| Passive | Gains Guard after attacking |

**Best with:** Defensive builds, Paladin Sanctuary Anchor, any build that values damage reduction.

### River Spellblade (Iron Wolf)

| Property | Value |
|----------|-------|
| ID | `iron_wolf` |
| Act Origin | 3 |
| Max Life | 26 |
| Attack | 4 |
| Behavior | `burn_finisher` |
| Aura | Enchant — Your fire and Burn effects deal +2 |
| Passive | Deals extra damage to burning enemies |

**Best with:** Sorceress Fire Burst, Druid Elemental Storm, any burn-stacking build.

### River Shadow (Kurast Shadow)

| Property | Value |
|----------|-------|
| ID | `kurast_shadow` |
| Act Origin | 3 |
| Max Life | 48 |
| Attack | 6 |
| Behavior | `backline_hunter` |
| Aura | Amplify — Wounded enemies take +3 damage from all sources |
| Passive | Prioritizes support and ranged enemies, cuts them down harder |

**Best with:** Builds that struggle with backline enemies, builds with sustained damage that benefit from amplify.

## Secondary Mercenaries (No Route Perks)

### Act 1 Variants

**Blackwood Tracker** — `rogue_tracker`
- 40 HP, 5 ATK, `wounded_hunter` behavior
- Aura: Venom — Your Poison applications deal +2
- Prioritizes wounded enemies, finishes with poison

**Blackwood Sentinel** — `rogue_sentinel`
- 50 HP, 4 ATK, `guard_after_attack` behavior
- Aura: Vigilance — Party gains +4 Guard at start of each turn
- Defensive scout, gains Guard after attacking

### Act 2 Variants

**Sunwell Lancer** — `sunwell_lancer`
- 48 HP, 7 ATK, `might_striker` behavior
- Aura: Might — Hero and summons deal +3 damage
- Hits hard with raw physical force

**Oasis Warmage** — `oasis_warmage`
- 38 HP, 4 ATK, `spell_support` behavior
- Aura: Meditation — Hero recovers +1 Energy every 3 turns
- Supports with arcane energy recovery

### Act 3 Variant

**River Sage** — `kurast_sage`
- 35 HP, 3 ATK, `heal_support` behavior
- Aura: Prayer — Heal hero and mercenary 3 each turn
- Heals the party each turn instead of dealing damage

### Act 5 Variant

**Frosthaven Berserker** — `harrogath_berserker`
- 44 HP, 8 ATK, `might_striker` behavior
- Aura: Fanaticism — Hero and all allies deal +2 damage
- Hits with berserker fury, inspires the whole party

## Mercenary Behaviors

### Targeting Priority

| Behavior | Targeting Logic |
|----------|----------------|
| `mark_hunter` | Marked enemy first, then default (lowest life) |
| `backline_hunter` | Support → Ranged → default |
| `guard_breaker` | Highest guard target first |
| `boss_hunter` | Boss → Elite → default |
| `wounded_hunter` | Lowest health ratio first |
| `burn_finisher` | Default targeting (bonus on burning targets) |
| `guard_after_attack` | Default targeting (gains guard post-attack) |
| `might_striker` | Default targeting (raw damage) |
| `spell_support` | Default targeting (energy support) |
| `heal_support` | Default targeting (heals instead of attacks) |

### Damage Calculation

```
base = attack + nextAttackBonus + contractAttackBonus + tempMercenaryDamageBonus
```

**Behavior bonuses (on matching condition):**
| Behavior | Bonus | Condition |
|----------|-------|-----------|
| `mark_hunter` | +markBonus + contractBehaviorBonus | Hit marked target |
| `burn_finisher` | +2 + contractBehaviorBonus | Target has burn |
| `guard_breaker` | +2 + contractBehaviorBonus | Target has guard (clears it) |
| `boss_hunter` | +3 + contractBehaviorBonus | Target is boss/elite |
| `backline_hunter` | +2 + contractBehaviorBonus | Target is support/ranged |
| `wounded_hunter` | +3 + contractBehaviorBonus | Target life <= 50% |

### Post-Attack Effects

| Behavior | After Attack |
|----------|-------------|
| `guard_after_attack` | Gains 2 + contractBehaviorBonus Guard |

## Route Perk System

Primary mercenaries have 12 route perks that unlock through quest progression. Perks provide escalating bonuses:

**Bonus Types:**
- `attackBonus` / `attackBonusPerAct` — Merc damage scaling
- `behaviorBonus` / `behaviorBonusPerAct` — Behavior effect scaling
- `startGuard` / `startGuardPerAct` — Merc starting guard
- `heroStartGuard` / `heroStartGuardPerAct` — Hero starting guard
- `heroDamageBonus` / `heroDamageBonusPerAct` — Hero damage scaling
- `openingDraw` / `openingDrawPerAct` — Extra opening cards
- `scalingStartAct` — Act at which per-act bonuses begin

Route perks are tied to specific quest flags and accumulate through the run, making mercenary progression a key long-term investment.

## Source Files

- `src/content/game-content-mercenaries.ts` — Mercenary definitions
- `src/combat/combat-engine-mercenary.ts` — Behavior implementations
