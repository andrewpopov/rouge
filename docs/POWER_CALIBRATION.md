# Power Calibration — Balance Data from 144 Campaign Runs

Data from post-nerf and v2-strategy experiments in balance-runs.db.

## Win Rate Matrix

| Class | Aggressive | Balanced | Control | Bulwark |
|-------|-----------|----------|---------|---------|
| Sorceress | **100%** | **100%** | **100%** | 0% |
| Paladin | **100%** | **100%** | 33% | 0% |
| Assassin | 89% | 67% | 67% | 0% |
| Amazon | 67% | 17% | 33% | 0% |
| Druid | 67% | 17% | 33% | 0% |
| Necromancer | 56% | 33% | 67% | 0% |
| Barbarian | 44% | 17% | 33% | 0% |

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

- **92% burst deaths** — hero killed in 1-2 turns
- **8% attrition** — ground down over 8+ turns
- **0% energy/merc collapse** — these aren't happening

## Failure Distribution by Act

- Act 1: 13 failures (26%)
- Act 2: 5 failures (10%)
- Act 4: 30 failures (60%)
- Act 5: 2 failures (4%)

**Act 4 is the primary gate.** The difficulty jump from Act 3 to Act 4 causes 60% of all run deaths.

## Balance Recommendations

1. **Reduce Act 4 spike** — either lower enemy scaling at Act 4 or increase Act 3 rewards
2. **Add burst protection** — 92% burst deaths means Guard/HP is insufficient against big hits. Consider:
   - Higher base Guard values on neutral cards
   - Act 4 encounter modifier tuning (reduce opening burst)
   - Town feature that grants Guard at combat start
3. **Fix Bulwark policy** — 0% across all classes. Either buff defensive scaling or rethink the policy
4. **Buff Barbarian** — weakest class at 44% aggressive. Core skill (Rallying Bash) gives no scaling Guard
5. **Investigate Amazon/Druid balanced policy** — 17% is very low. Balanced policy may undervalue their key mechanics (marks/summons)
