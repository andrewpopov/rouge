# Monster Variety & Skills — Implementation Guide

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `LIVE_MECHANICS_AND_BALANCE.md` for the current live doctrine and documentation routing.
- Use `COMBAT_DECISION_DESIGN.md` for the target feel of enemy intents and why specific patterns are interesting.
- Use `D2_SPECIALIZATION_MODEL.md` for the soft-counter and boss-prep model that minibosses and bosses should teach.
- Use this document for monster-family implementation backlog and concrete mechanic candidates.

## Current State

The live build is no longer using a purely generic monster layer.

Current runtime truth:

- act bosses have distinct scripted loops and act-specific ask tags
- branch elites and miniboss packages expose encounter ask tags intended to preview boss asks
- enemies can apply player-side debuffs including Burn, Poison, Chill, Amplify, Weaken, and Energy Drain
- enemy scripts support summon, teleport, charge, sunder, heal-and-guard, and elemental party attacks
- elite and encounter modifiers are a major part of how an act teaches the player what the boss will later demand

The game still uses broad role scaffolding across the non-boss roster, but that scaffolding is now layered with traits, scripted intents, modifiers, and act-specific ask profiles instead of a single uniform behavior model.

## Boss And Elite Doctrine

- each act boss should ask a different question of the deck, not just hit harder than the last one
- branch elites and minibosses should preview one or more boss asks so the act teaches before it punishes
- boss courts and escorts should reinforce the boss pattern rather than distract from it
- encounter ask tags should stay aligned with the live mechanics because reward routing and player guidance use them

## Remaining Expansion Backlog

The sections below are still useful as future-facing backlog, but they are not a description of untouched systems anymore. Many of the items below are already partially live and should be read as `expand or deepen`, not `build from zero`.

The game still has **100+ named D2 monsters** across 5 acts in `d2-zone-monsters.json`, and a large part of the remaining opportunity is pushing more of that roster beyond the current role-and-modifier baseline:

| Role | Behavior |
|------|----------|
| **Raider** | attack → guard rotation |
| **Ranged** | attack / attack_all rotation |
| **Support** | heal_ally / guard_allies rotation |
| **Brute** | guard → heavy attack rotation |

---

## What D2 Monsters Actually Do (Key Missing Behaviors)

### 1. RESURRECTION (Highest Priority)
**D2:** Fallen Shaman, Greater Mummy, Fetish Shaman all resurrect their dead allies. This is THE defining mechanic of D2 combat — kill the shaman first or the fight never ends.

**Current:** No resurrection exists. Dead enemies stay dead.

**Implementation:**
- New `EnemyIntentKind`: `"resurrect_ally"`
- When executed: find first dead non-shaman enemy in `state.enemies`, set `alive = true`, restore to 50% `maxLife`, reset guard/status to 0
- Shaman intent rotation: `resurrect_ally` (priority) → `attack` or `heal_ally`
- Add check: only attempt resurrect if a dead ally exists, otherwise fall through to secondary intent

### 2. STATUS EFFECTS ON PLAYER (Critical Gap)
**D2:** Monsters apply freeze, slow, poison, burn, curses, mana drain to the player constantly. The player must manage their own debuffs.

**Current:** Players apply 6 status effects TO enemies. Enemies never apply anything TO the player.

**New player-side status effects needed:**

| Effect | Source Monsters | Mechanic |
|--------|----------------|----------|
| **Chill** (slow) | Frozen Horror, Cold Mages, Spiders | Hero draws 1 fewer card next turn |
| **Burn** | Balrog, Imp, Fire Mages, Fetish Shaman | Hero takes X fire damage at turn start |
| **Poison** | Zombie (death), Viper, Maggot, Mummy | Hero takes X poison damage at turn start (bypass guard) |
| **Amplify Damage** | Oblivion Knight, Cursed elites | Hero takes +50% damage for 2 turns |
| **Weaken** | Oblivion Knight | Hero deals -30% damage for 2 turns |
| **Energy Drain** | Wraith, Willowisp, Finger Mage | Hero starts with 1 less energy next turn |

**Implementation:**
- Add to `CombatHeroState`: `burn`, `poison`, `chill`, `amplifyDamage`, `weaken`, `energyDrain`
- Process at start of `startPlayerTurn()`: tick burn/poison damage, apply chill (reduce draw), apply energy drain
- New `EnemyIntentKind` values: `"attack_burn"`, `"attack_poison"`, `"attack_chill"`, `"curse_amplify"`, `"curse_weaken"`, `"drain_energy"`

### 3. MONSTER PASSIVE TRAITS (Major Gap)
**D2:** Monsters have inherent passive behaviors that fundamentally change how you fight them.

**New `EnemyTemplate` field:** `traits?: MonsterTrait[]`

| Trait | Monsters | Effect |
|-------|----------|--------|
| **`swift`** | Fetish, Flayer, Soul Killer | Execute attack intent **twice** per turn |
| **`flee_on_ally_death`** | Fallen, Carver, Devilkin | Skip next action when an ally dies |
| **`death_explosion`** | Stygian Doll, Bone Fetish | On death: deal 30% maxHP damage to hero (bypasses guard) |
| **`death_poison`** | Dried Corpse, Plague Bearer | On death: apply 2 poison to hero |
| **`death_spawn`** | Grotesque, Flesh Spawner | On death: add 1-2 weak minions to encounter |
| **`frenzy`** | Thorned Hulk, Frenzied Ice Spawn | Below 50% HP: +50% attack damage |
| **`thorns`** | Scarab Demon | When damaged: deal 1-2 back to hero |
| **`regeneration`** | Greater Mummy | Heal 1-2 HP per turn |

**Implementation:**
- Add `traits?: string[]` to `EnemyTemplate` and `CombatEnemyState`
- In `resolveEnemyAction()`: check traits before/after action
  - `swift`: call the action resolution twice
  - `frenzy`: multiply intentValue by 1.5 when below 50% HP
  - `thorns`: hook into `dealDamage()` — if target has thorns, deal damage back
- In `handleDefeat()`: check death traits
  - `death_explosion`: deal % maxHP to hero
  - `death_poison`: apply poison to hero
  - `death_spawn`: push new enemies into `state.enemies`
- In `advanceEnemyIntents()`: check `flee_on_ally_death` when any enemy dies

### 4. SUMMONING / MINION SPAWNING (Medium Priority)
**D2:** Sand Maggots lay eggs → Young. Flesh Spawners spawn Vile Children. Grotesques burst on death.

**Current:** Enemy count is fixed at encounter start.

**Implementation:**
- New `EnemyIntentKind`: `"summon_minion"`
- When executed: create a new `CombatEnemyState` and push to `state.enemies`
- Cap at `ROUGE_LIMITS.MAX_ENEMIES_IN_COMBAT` (suggest 6)
- Summoned minions use a weak template (40% HP of normal raider, same act scaling)
- Pre-build "summoned minion" templates per act in encounter registry

### 5. CORPSE INTERACTION (Medium Priority)
**D2:** Corpse Spitters eat corpses to deny resurrection. Death Maulers use Corpse Explosion.

**Current:** Dead enemies are just `alive: false` with no further interaction.

**Implementation:**
- Track `consumed: boolean` on dead enemies
- Corpse Spitter intent `"consume_corpse"`: mark dead enemy as consumed, heal self
- Death Mauler intent `"corpse_explosion"`: deal 2 × dead enemy count damage to all party
- Consumed corpses can't be resurrected

### 6. MONSTER-SPECIFIC INTENTS (High Priority)
Instead of generic role-based intents, key monsters should have custom intent sets:

#### Fallen Shaman (Act 1 support)
```
1. Resurrect Fallen → if no dead: Fireball (attack, apply 1 burn)
2. Heal wounded ally
```

#### Fetish (Act 3 raider) — with `swift` trait
```
1. Knife Stab (attack at 60% normal damage) — executed TWICE
2. Dart Throw (attack at 60% normal damage) — executed TWICE
```

#### Stygian Doll (Act 3 raider) — with `death_explosion` trait
```
1. Suicidal Rush (sunder_attack, targets hero)
2. Knife Stab (attack)
On death: explode for 30% maxHP damage to hero
```

#### Oblivion Knight (Act 4 support)
```
1. Amplify Damage curse (hero takes +50% damage for 2 turns)
2. Bone Spirit (high damage, ignores guard)
3. Decrepify curse (hero deals -30% damage for 2 turns)
```

#### Greater Mummy / Unraveler (Act 2-3 support)
```
1. Resurrect dead undead ally → if none: Unholy Bolt
2. Poison Breath (apply 3 poison to hero)
Passive: regenerate 1 HP/turn
```

#### Willowisp / Gloam (Act 3-5 ranged)
```
1. Lightning Bolt (very high single-target damage)
2. Energy Drain (reduce hero energy by 1 next turn)
Stats: +50% attack, -30% HP vs normal ranged
```

#### Succubus (Act 5 ranged)
```
1. Blood Mana curse (cards cost 1 HP per energy cost for 2 turns)
2. Blood Star (guaranteed hit ranged attack)
```

#### Balrog / Venom Lord (Act 4-5 brute)
```
1. Guard + Inferno (gain guard AND apply 2 burn to all party)
2. Crushing Blow (highest single-target damage)
Stats: 130% normal brute HP, 120% attack
```

#### Scarab Demon (Act 2 brute) — with `thorns` trait
```
1. Guard (high value)
2. Charged Bolt attack
Passive: when damaged, deal 1-2 back to attacker
```

#### Frozen Horror (Act 5 raider)
```
1. Frost Strike (attack + apply 1 chill to hero)
2. Arctic Blast (attack_all + apply 1 chill to hero)
```

---

## Implementation Plan — Phased Approach

### Phase 1: Player Status Effects
**Files:** `combat.d.ts`, `combat-engine-turns.ts`

1. Add `burn`, `poison`, `chill`, `weakened`, `amplified`, `energyDrain` to `CombatHeroState`
2. Add turn-start processing in `startPlayerTurn()`:
   - Burn: deal damage, decrement
   - Poison: deal damage (bypass guard), decrement
   - Chill: reduce hand draw by 1, decrement
   - Weakened: checked in card effect resolution (reduce damage), decrement
   - Amplified: checked in `dealDamage()` when hero is target, decrement
   - Energy Drain: reduce max energy by 1 this turn, decrement
3. New `EnemyIntentKind` values for applying effects to player
4. Handle in `resolveEnemyAction()`

### Phase 2: Monster Traits System
**Files:** `content.d.ts`, `combat-engine-turns.ts`, `encounter-registry-enemy-builders.ts`

1. Add `traits?: string[]` to `EnemyTemplate` and `CombatEnemyState`
2. Implement trait processing in combat engine
3. Start with: `swift`, `frenzy`, `death_explosion`, `death_poison`

### Phase 3: Resurrection & Summoning
**Files:** `combat-engine-turns.ts`, `encounter-registry-enemy-builders.ts`

1. Add `resurrect_ally` intent kind
2. Add `summon_minion` intent kind
3. Add resurrection logic in `resolveEnemyAction()`
4. Add `MAX_ENEMIES_IN_COMBAT` limit
5. Build summoned-minion templates

### Phase 4: Monster-Specific Intent Sets
**Files:** `encounter-registry-enemy-builders.ts`, `encounter-registry-enemy-builders-data.ts`

1. Create `MONSTER_FAMILY_OVERRIDES` map: monster name keywords → custom intent builders
2. In `buildIntentSet()`, check for family-specific overrides before falling back to generic role intents
3. Wire up all the specific intent sets listed above

### Phase 5: D2 Monster Modifiers for Elites
**Files:** `encounter-registry-enemy-builders-data.ts`

1. Add D2-style modifier effects: Cold Enchanted, Fire Enchanted, Lightning Enchanted, Cursed, Extra Fast, Extra Strong, Mana Burn, Stone Skin
2. These replace or supplement the current affix system with more D2-authentic behaviors

---

## Priority Order

1. **Player status effects** — biggest gameplay gap, enables everything else
2. **Monster-specific intents** (Shaman resurrect, Fetish swift) — most recognizable D2 flavor
3. **Passive traits** (death explosion, frenzy, thorns) — deepens tactical decisions
4. **Summoning/spawning** — adds encounter dynamism
5. **Corpse mechanics** — nice to have, creates interesting counter-play
6. **D2 elite modifiers** — polishes the experience

---

## Data File Reference

- `src/content/d2-monster-traits.json` — Complete D2 monster family data with traits, abilities, and adaptation notes
- `src/content/d2-zone-monsters.json` — Zone-to-monster mapping (already exists)

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/types/combat.d.ts` | Add hero status effects, enemy traits |
| `src/types/content.d.ts` | New intent kinds, trait types |
| `src/combat/combat-engine-turns.ts` | Trait processing, player DOTs, resurrection, summoning |
| `src/combat/combat-engine.ts` | Card effect resolution for weakened/amplified |
| `src/content/encounter-registry-enemy-builders.ts` | Family-specific intent builders |
| `src/content/encounter-registry-enemy-builders-data.ts` | Monster family overrides, new modifier profiles |
| `src/content/encounter-registry-builders-zones.ts` | Wire traits to zone encounters |
| `src/ui/combat-view.ts` | Display player status effects, trait indicators on enemies |
