# Power Calibration — Balance Data

_Updated: 2026-04-08_

Data from 144 campaign runs (post-nerf + v2-strategy experiments) in balance-runs.db,
plus build snapshot diagnostics.

## Win Rate Matrix (144 campaign runs)

| Class | Aggressive | Balanced | Control | Bulwark |
|-------|-----------|----------|---------|---------|
| Sorceress | **100%** | **100%** | **100%** | 0% |
| Paladin | **100%** | **100%** | 33% | 0% |
| Assassin | 89% | 67% | 67% | 0% |
| Amazon | 67% | 17% | 33% | 0% |
| Druid | 67% | 17% | 33% | 0% |
| Necromancer | 56% | 33% | 67% | 0% |
| Barbarian | 44% | 17% | 33% | 0% |

## Boss Viability Matrix (per-act, full_clear_power builds)

| Class | Act 1 | Act 2 | Act 3 | Act 4 | Act 5 |
|-------|-------|-------|-------|-------|-------|
| Assassin | 100% | 100% | 100% | 33% | **100%** |
| Paladin | 100% | 100% | 100% | 100% | **67%** |
| Druid | 100% | 100% | 100% | 100% | 33% |
| Barbarian | 100% | 100% | 100% | 67% | 33% |
| Sorceress | 100% | 100% | 100% | 33% | 33% |
| Amazon | 100% | 100% | 100% | 33% | 0% |
| Necromancer | 100% | 100% | 100% | 33% | 33% |

## Power Score Calibration

| Class | Win avg power | Fail avg power | Boss ratio | W/F |
|-------|--------------|----------------|------------|-----|
| Assassin | 4416 | 3027 | 1.37 | 16W/8F |
| Druid | 4074 | 1288 | 1.60 | 9W/15F |
| Barbarian | 4044 | 1537 | 1.58 | 7W/17F |
| Paladin | 3815 | 1100 | 1.16 | 10W/5F |
| Amazon | 3782 | 1782 | 1.69 | 9W/15F |
| Necromancer | 3532 | 1356 | 1.35 | 8W/10F |
| Sorceress | 3295 | 2122 | 1.05 | 12W/3F |

**Key findings:**
- Win threshold: ~3000 power score
- Sorceress wins at lowest power (3295) due to burst
- Failed builds average 1100-3000 — they never reach critical mass
- Boss power ratio needs >1.0x to win

## Defeat Analysis

- **92% burst deaths** (46/50) — hero killed in 1-2 turns
- **8% attrition** (4/50) — ground down over 8+ turns
- **0% energy/merc collapse** — these aren't occurring

## Failure Distribution by Act

| Act | Failures | % of total |
|-----|----------|------------|
| Act 1 | 13 | 26% |
| Act 2 | 5 | 10% |
| Act 4 | 30 | **60%** |
| Act 5 | 2 | 4% |

**Act 4 is the primary gate.** The difficulty jump from Act 3 to Act 4 causes 60% of all run deaths.

## Build Snapshot Diagnostics (auto-win campaign builds at Act 4)

| Class | HP | Energy | Damage | Guard | Deck | Weapon | Merc Atk | vs A3 Boss | vs A4 Boss |
|-------|-----|--------|--------|-------|------|--------|----------|-----------|-----------|
| Barbarian | 237 | 6 | +22 | +7 | 28 | War Hammer | 73 | 3/3 | 1/3 (attrition) |
| Necromancer | 171 | 6 | +8 | +13 | **30** | Bone Wand | 81 | 1/3 | 0/3 (burst) |
| Sorceress | 143 | 6 | +7 | +9 | **34** | War Staff | 67 | 3/3 | 0/3 (burst) |

### Diagnosed Build Problems

1. **Decks are too fat**: Necro 30, Sorceress 34 — strategies say 14-18. Class strategy `deckBloatPenalty` isn't driving enough card removal.
2. **No slot 2/3 skills equipped** at Lv16 — all classes only have core skill. Progression not investing enough class points or tree ranks aren't meeting unlock gates.
3. **Necromancer lowest HP (171)** with bloated deck — can't find summon cards fast enough, dies before army online.
4. **Barbarian dies to attrition** not burst at Act 4 — he survives hits but can't kill fast enough. Needs more burst damage options.

## Sim AI Validation

Decision audit confirmed the AI makes correct defensive choices:
- Guard Stance scores 61.5 (highest) when 27 damage incoming
- Measured Swing 32.3, Field Dressing 18.0, Melee 1.0
- AI correctly prioritizes defense > offense > heal when threatened
- The 92% burst death rate is a real game problem, not an AI problem

## Balance Recommendations (priority order)

1. **Fix deck bloat in sim** — class strategies aren't driving enough card pruning. Necro/Sorc decks should be 16-20, not 30-34.
2. **Fix skill progression in sim** — builds at Lv16 should have bridge skills (Lv6 gate). Sim may not be investing class points correctly.
3. **Reduce Act 4 spike** — 60% of failures. Either lower Act 4 enemy scaling or increase Act 3 reward power.
4. **Add burst protection** — 92% burst deaths. Consider: higher base Guard on neutral cards, encounter modifier tuning, town feature granting combat-start Guard.
5. **Fix Bulwark policy** — 0% across all classes. Either buff defensive damage scaling or remove the policy.
6. **Buff Barbarian** — weakest class. Rallying Bash's 2 Guard doesn't scale with slot tier.
