# Balance Simulation — Current Status

_Updated: 2026-04-08_

## Sim Infrastructure

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| Combat AI (scoring) | `tests/helpers/run-progression-simulator-combat.ts` | Intent-aware action scoring, focus fire, skill prep |
| Combat AI (balance sim) | `tests/helpers/combat-simulator.ts` | Same scoring, used by synthetic encounter tests |
| Progression sim | `tests/helpers/run-progression-simulator.ts` | Full campaign simulation with town optimization |
| Balance orchestrator | `tests/helpers/balance-orchestration.ts` | Multi-run experiment framework |
| Build snapshots | `tests/helpers/build-snapshot.ts` | Generate, edit, and test character builds |
| Piecemeal sim | `tests/helpers/piecemeal-sim.ts` | Campaign runs with auto-win option |
| Power scoring | `tests/helpers/balance-power-score.ts` | Party/enemy power calculation |
| Town optimization | `tests/helpers/run-progression-simulator-scoring.ts` | Equipment/card/skill decisions |
| SQLite persistence | `scripts/balance-db.js` | Run history, artifacts, job state |
| Combat log | `src/combat/combat-log.ts` | Structured event log for analysis |

### Class Strategies
Each class has tuned policy overrides in `run-progression-simulator-core.ts`:
- **Necromancer Summoner**: summon 2.5x, draw 1.8x, bloat penalty 2.8x
- **Amazon Marksman**: mark 2.2x, merc buff 1.8x
- **Barbarian Berserker**: damage 1.5x, weapon 1.5x, proficiency 3.0x
- **Druid Elementalist**: summon 1.6x, burn 1.4x
- **Assassin Martial Artist**: draw 1.4x, stun 1.5x, bloat 2.6x
- **Paladin Guardian**: party guard 1.6x, heal 1.4x
- **Sorceress Fire**: burn 1.8x, energy 1.5x, draw 1.4x

### Encounter Sets
Per-act encounter filtering: `act1_bosses` through `act5_bosses`, `act1_endgame` through `act5_endgame`, `act1_all` through `act5_all`, `all_bosses`.

## Sim Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Boss matrix (7×5×3) | ~2s | Synthetic builds, fast |
| Auto-win campaign (5 acts) | ~2-3 min | Dominated by town optimization |
| Full campaign (5 acts) | ~6-10 min | Combat + town optimization |
| 63-run matrix (7×3×3) | ~10 hours | Background orchestrator |

### Optimization History
| Change | Before → After | Speedup |
|--------|---------------|---------|
| Shallow clone in town opt | 77s → 42s (2 acts) | 45% |
| Candidate pre-filtering | 42s → 35s | 54% cumulative |
| Aggressive candidate limit | 35s → 26s | **66% cumulative** |

Bottleneck: `evaluateRunScore` called ~720 times per safe zone visit. Each call: clone run + hydrate + compute overrides + score deck/equipment. `hydrateRun` is 1.5ms per call.

## Sim AI Quality

### What the AI does well
- **Intent-aware defense**: Guard scores higher when incoming damage exceeds current Guard
- **Kill priority**: Bonus for killing enemies that are about to attack (+3.5x threat removed)
- **Lethal prevention**: +80 bonus for actions that prevent death next turn
- **Focus fire**: +8 for bringing enemies below 25% HP
- **Skill ordering**: Skills that buff next card score higher (+2-4x for cost reduction/damage bonus)
- **Draw scaling**: Drawing cards worth more when hand is empty (0-2 cards: +4)

### What the AI does NOT do
- Multi-turn planning beyond 3-move beam search
- Hand management (holding cards for combos)
- Enemy intent prediction (only sees current intent, not patterns)
- Energy reservation (plays greedily, doesn't save energy for guard)
- Cooldown awareness (doesn't end turn to get skill back faster)

### Validated via decision audit
- AI plays Guard Stance first (score 61.5) when 27 damage incoming — correct
- Defense > offense > heal priority ordering confirmed
- 92% burst death rate is a real game problem, not AI weakness

## Known Sim Problems

### Build quality
1. **Decks too fat**: Sim builds 28-34 card decks, strategies target 14-20. Class strategy bloat penalties aren't driving enough card removal via sage_purge actions.
2. **Skills not unlocking**: Builds at Lv16 only have slot 1 skill. Sim isn't investing class points into trees fast enough to meet slot 2 (Lv6 + 3 ranks) and slot 3 (Lv12 + 6 ranks) gates.
3. **Town optimization capped**: Pre-filtering limits gear to 6 candidates and deck to 4 — may miss optimal choices.

### Speed
- Full campaign too slow for rapid iteration (~6-10 min each)
- Town optimization is 98% of runtime even with auto-win combat
- Need cached/delta scoring in `evaluateRunScore` for further speedup

### Coverage
- Only one archetype strategy per class (no fire vs cold sorc comparison)
- Bulwark policy produces 0% win rate — either broken or the game can't support pure defense
- No human baseline to calibrate against

## Data Available

### SQLite (balance-runs.db)
- 464 total runs across experiments
- 144 runs with full combat log data (post-nerf + v2-strategy)
- Each run has: outcome, defeat cause, power scores, checkpoint data, combat log summary

### Key queries
```sql
-- Win rate by class and policy
SELECT class_id, policy_id,
  COUNT(CASE WHEN outcome='run_complete' THEN 1 END) as wins,
  COUNT(*) as total
FROM balance_run_history
WHERE experiment_id LIKE 'post_nerf%'
GROUP BY class_id, policy_id;

-- Defeat causes
SELECT defeat_cause, COUNT(*)
FROM balance_run_history
WHERE outcome != 'run_complete' AND defeat_cause != ''
GROUP BY defeat_cause;

-- Power scores: wins vs failures
SELECT class_id,
  AVG(CASE WHEN outcome='run_complete' THEN final_checkpoint_power_score END) as win_power,
  AVG(CASE WHEN outcome!='run_complete' THEN final_checkpoint_power_score END) as fail_power
FROM balance_run_history
GROUP BY class_id;
```

## Next Steps

1. **Fix deck bloat** — increase sage_purge action priority in town optimization
2. **Fix skill progression** — ensure class point investment meets tree rank gates by Act 2
3. **Add second archetype per class** — test build diversity (fire vs cold sorc, bow vs javelin amazon)
4. **Speed: cached scoring** — avoid redundant `evaluateRunScore` calls via delta computation
5. **Human baseline** — play 5 runs, compare to sim predictions
