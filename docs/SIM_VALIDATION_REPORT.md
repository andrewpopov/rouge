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

## 6. Cross-Validation: Boss Test vs Full Campaign

Tested all 7 classes with default archetype: 5 boss fights + 2 full campaign seeds.

| Class | Boss Test A1 | Campaign A1-3 | Match? |
|-------|-------------|---------------|--------|
| Barbarian | 5/5 | 2/2 clear | ✓ |
| Assassin | 4/5 | 2/2 clear | ✓ |
| Sorceress | 4/5 | 2/2 clear | ✓ |
| Necromancer | 3/5 | 2/2 clear | ✓ |
| Paladin | 0/5 | 0/2 fail A1 | ✓ |
| Druid | 0/5 | 1/2 (seed-dep) | ~partial |
| Amazon | 0/5 | 2/2 clear | ✗ mismatch |

Amazon mismatch: auto-win builds underrepresent Act 1 strength because
they don't earn combat XP. Real campaign builds are stronger at Act 1.

## 7. V3 Matrix Review — Sim Bugs Found

Manual review of V3 matrix (105 runs, 27% clear rate) revealed:
- **Necromancer 0%**: Built Bone Mage (poison_and_bone tree) instead of
  Summoner. preferredTreeId bias too weak (+50 vs concentration +40).
- **Amazon 0%**: Built Passive tree instead of Bow. Same bias issue.
- **Sorceress 13%**: Split across cold/fire/lightning instead of fire focus.

All three were **sim bugs, not balance issues**. Fixed with +120/-80 bias.

After fix, Necromancer goes from 0/5 to 3/5 at Act 1 boss. Amazon from 0
to 4/5 at Act 3 boss. Sorceress from mixed to 4/5 at Act 1.

## Sim Trust Level

| Component | Trust | Notes |
|-----------|-------|-------|
| Town optimization | **High** | Produces class-appropriate builds |
| Combat AI decisions | **High** | Correct defensive/offensive priority |
| Tree investment | **High** | Preferred tree bias fixed, all trees correct |
| Act 1-3 boss results | **High** | 6/7 classes match campaign results |
| Act 4-5 results | **Medium** | V4 matrix running for validation |
| Deck bloat | **Medium** | 20-26 cards, target 14-20 |
| Skill progression | **High** | Slot 2 unlocks at Act 3 |
| Amazon Act 1 test | **Low** | Mismatch with campaign — auto-win builds too weak |
