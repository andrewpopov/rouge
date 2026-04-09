# Sim Validation Report

_2026-04-08_

Systematic validation of each sim component to verify data quality.

## 1. Town Optimization

**Status: Working correctly**

Auto-win builds produce reasonable characters:
- Class cards appear in deck (not generic neutral-only)
- Tree ranks concentrate in preferred tree (14 ranks by Act 4)
- Skills unlock at Act 3 Lv15 (slot 2 bridge skills)
- Equipment upgrades through acts (starter → Mace → War Hammer)
- Deck sizes 18-27 (improved from 30-34, target 14-20)

**Known limitation:** Deck bloat penalty not aggressive enough — decks still 22-27 at endgame vs 14-20 target.

## 2. Per-Archetype Combat (Act 1-3 Bosses)

**Status: Reveals real balance issues**

| Class | A1 Boss | A2 Boss | A3 Boss | Act 1 DMG |
|-------|---------|---------|---------|-----------|
| Barbarian | **3/3** | 3/3 | 3/3 | 13 |
| Necromancer | **3/3** | 3/3 | 2/3 | 0 (summons) |
| Assassin | 2/3 | 3/3 | 3/3 | 10 |
| Sorceress | 2/3 | 3/3 | 3/3 | 16 |
| **Paladin** | **0/3** | 3/3 | 3/3 | 3 |
| **Druid** | **0/3** | 3/3 | 3/3 | 3 |
| **Amazon** | **0/3** | 3/3 | 2/3 | 3 |

**Finding: Paladin, Druid, Amazon have 3 damage at Act 1.** Barbarian has 13. This 4x damage gap causes 0% boss win rate for three classes. All three recover by Act 2 (3/3) once tree ranks and equipment catch up.

**Root cause:** The Act 1 boss (Andariel, 34 incoming damage) requires enough offense to kill before damage accumulates. Classes with 3 dmg can't kill fast enough despite surviving individual turns.

## 3. AI Decision Quality

**Status: Correct priorities**

Decision audit at Act 1 boss shows:
- AI generates 19-117 Guard on T1 (appropriate defense against 34 incoming)
- AI plays offensive cards when safe, defensive when threatened
- Score 0 decisions are aura/buff cards that generate Guard (correct)
- Victory correlates with drawing offense cards early
- Defeat correlates with all-defense hands that can't close the fight

**The AI is not the problem.** It plays correctly given the cards it draws. The issue is the deck composition — too many defensive cards for Paladin.

## 4. Full Campaign Progression

**Status: Barbarian and Assassin clear Act 3 in real combat**

| Class | Outcome | Time | Notes |
|-------|---------|------|-------|
| Barbarian | Act 3 cleared | 36s | 2 bosses defeated |
| Assassin | Act 3 cleared | 31s | 2 bosses defeated |
| Paladin | Failed Act 1 | 1s | Boss burst death |

Full Act 5 runs in progress for Barbarian and Assassin.

## 5. Balance Findings (validated by sim)

### Act 1 boss too punishing for defensive classes
- Andariel deals 34 damage on opening turn
- Classes with < 10 damage bonus can't kill fast enough
- Fix options: reduce Andariel's escort damage, or buff early-game damage for defensive classes

### Damage scaling gap at Act 1
- Barbarian gets 13 dmg from Morning Star + combat bonuses
- Paladin/Druid/Amazon get only 3 dmg at the same level
- The weapon damage bonus and class stat allocation need investigation

### Deck composition matters more than raw stats
- Paladin with 78hp and 117 Guard still loses if no damage cards in hand
- Draw RNG determines Act 1 boss outcome for marginal builds
- Need more guaranteed damage in defensive class starter decks

## Sim Trust Level

| Component | Trust | Notes |
|-----------|-------|-------|
| Town optimization | **High** | Produces class-appropriate builds |
| Combat AI decisions | **High** | Correct defensive/offensive priority |
| Act 1-3 boss results | **High** | Consistent with class design intent |
| Act 4-5 results | **Medium** | Need full campaign validation |
| Deck bloat | **Medium** | Still above target but improving |
| Skill progression | **High** | Correct tree concentration, skills unlock |
| Power score calibration | **Medium** | Need more data points |
