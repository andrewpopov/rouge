# Balance Snapshot

Generated: March 27, 2026.

## Commands

- optimized clear-rate sweep:
  - `npm run sim:progression-class-sweep -- --policy aggressive --through-act 5 --probe-runs 0 --seeds 4`
- weak-build early-pressure sweep:
  - `npm run sim:progression-class-sweep -- --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 4`
- per-run deterministic checkpoint view:
  - `npm run sim:progression -- --class barbarian,sorceress --policy aggressive --through-act 5 --probe-runs 0`
- power-curve report:
  - `npm run sim:power-curve -- --class barbarian --policy aggressive --through-act 5`
- encounter-set balance report:
  - `npm run sim:balance -- --class barbarian,sorceress --scenario mainline_conservative,mainline_rewarded --set act5_endgame --runs 8`
- skill-value audit:
  - `npm run sim:skill-audit`
- focused runtime regression lane:
  - `node --test generated/tests/item-system.test.js generated/tests/app-engine-account-economy.test.js generated/tests/app-engine-world-nodes.test.js generated/tests/run-progression-simulator.test.js generated/tests/app-engine-progression.test.js`

## How To Read It

- `sim:progression-class-sweep` is the main pass or fail gate for class-policy balance.
- `sim:progression` is the best human-readable checkpoint report. It now prints hand size plus active runewords at each safe zone.
- `sim:power-curve` is the band check. Use it when a class feels too strong or too weak at a specific act.
- `sim:balance` is the fixed encounter-set check for boss or elite pacing once campaign balance already looks sane.
- `sim:skill-audit` is the class-card normalization tool. Use it before hand-tuning skill numbers by feel.

## Aggressive Optimized Band

- Amazon: `3/4` complete. Seed `0` fails at `Act IV Diablo`.
- Assassin: `3/4` complete. Seed `2` fails at `Act IV Diablo`.
- Druid: `3/4` complete. Seed `0` fails at `Act IV Diablo`.
- Sorceress: `3/4` complete. Seed `3` fails at `Act IV Diablo`.

Additional current sample on slower classes:

- Barbarian: seeds `0-2` all complete on the latest post-fix run; seed `3` remained a slow-path sim.
- Necromancer: seeds `0-2` all complete on the latest post-fix run; seed `3` remained a slow-path sim.
- Paladin: after the late guard-focused Paladin card pass, seeds `1` and `2` now complete, seed `3` already completed, and seed `0` remained a slow-path sim. Current read is at least `3/4`, with no remaining confirmed Paladin failure in the sampled set.

## Weak Build Early Pressure

Through Act II, 4 seeds each:

- Amazon `Balanced`, `Control`, `Bulwark`: `100%` reached Act II.
- Assassin `Balanced`: `50%` failed in Act I at Andariel.
- Assassin `Control`, `Bulwark`: `100%` reached Act II.
- Barbarian `Balanced`, `Control`, `Bulwark`: `100%` reached Act II.
- Druid `Balanced`, `Control`, `Bulwark`: `100%` reached Act II.
- Necromancer `Balanced`, `Control`, `Bulwark`: `100%` reached Act II.
- Paladin `Balanced`, `Control`, `Bulwark`: `100%` reached Act II.
- Sorceress `Balanced`: `25%` failed in Act I at Andariel.
- Sorceress `Control`: `100%` reached Act II.
- Sorceress `Bulwark`: `50%` failed in Act I at Andariel.

## Read

- The deterministic aggressive target band is working for Amazon, Assassin, Druid, and Sorceress.
- The deterministic aggressive target band now also looks acceptable for Paladin after the late guard-focused card pass.
- Andariel is once again a real Act I failure point for weaker lines, especially Assassin and Sorceress.
- Diablo remains the main optimized-build gate.
- The remaining uncertainty is simulator throughput on a few slow-path seeds, not a newly confirmed roster outlier.

## March 27 Follow-Up

- Starter sustain was trimmed slightly on Amazon, Barbarian, Druid, Necromancer, and Paladin tier-1 cards to reduce weak-line early safety.
- Andariel's poison sequence was sharpened so her charge creates more guard, `Poison Burst` hits harder, and `Venom Claw` applies heavier poison.
- Focused regression checks still cleared on optimized aggressive samples:
  - Amazon seed `1`: `run_complete`
  - Barbarian seed `1`: `run_complete`
  - Paladin seed `1`: `run_complete`
  - Sorceress seed `1`: `run_complete`
- Focused weak-line spot checks still showed some sturdy openings:
  - Amazon `Balanced` seed `0`: reached Act II
  - Amazon `Balanced` seed `2`: reached Act II
  - Barbarian `Balanced` seed `0`: reached Act II
  - Paladin `Balanced` seed `0`: reached Act II
  - Paladin `Balanced` seed `2`: reached Act II
- Weak-line failures at Andariel still reproduce on fragile seeds:
  - Assassin `Balanced` seed `2`: failed at Andariel
  - Sorceress `Bulwark` seed `2`: failed at Andariel
- Conclusion: this pass preserves the optimized endgame band and sharpens the Act I boss check, but it does not fully solve the broader “safe weak openings” problem on its own.

## March 27 Rune And Unique Follow-Up

- Runes and runewords are now materially easier to use in a live run:
  - bosses always stamp at least one rune into the reward pile
  - minibosses can do the same when the run has an active unfinished runeword project
  - rune loot weights now bias toward the next missing recipe piece
  - vendor rune stock is deeper and more willing to surface missing recipe runes
  - quest rewards can equip a compatible base, add sockets, and finish a recipe through the normal reward seam
- Unique-only bonus lines now include `+1` hand size. That bonus is live in combat, visible in UI summaries, and included in simulator scoring.
- Focused progression spot-check after the rune follow-up:
  - `npm run sim:progression -- --class barbarian,sorceress --policy aggressive --through-act 3 --probe-runs 0`
  - Barbarian reached Act II with `Strength` active, then Act III with `Strength` and `Stealth`
  - Sorceress reached Act II with `Leaf` active, then Act III with `Leaf` and `Stealth`
- No fresh full 4-seed class sweep has been rerun after the rune-economy and hand-size-affix follow-up. The last broad optimized and weak-line sweep results above are still the roster baseline.

## March 27 Targeted Late-Game Follow-Up

- Late-game class and weapon tuning was pushed specifically at the remaining `Act IV Diablo` failures:
  - Amazon bow-side boss cards were already holding after the earlier pass.
  - Barbarian got more guard on `Concentrate`, `Berserk`, and `War Cry`.
  - Paladin got more guard on `Zeal`, `Holy Shield`, and `Fist of the Heavens`.
  - Necromancer got more single-target and guard on `Decrepify`, `Bone Spirit`, and `Revive`.
  - Mace progression was raised at the top end through `War Hammer` and `Maul`.
  - `Strength` now grants a small guard bonus.
  - `White` was corrected away from an irrelevant burn bonus and now grants real wand-build combat value.
  - `Bone Wand` and `Lich Wand` were pushed up so the Necromancer weapon ladder no longer plateaus at Act IV.
- Exact previously failing deterministic seeds that now clear:
  - `Paladin / Aggressive / seed 1`: `run_complete`
  - `Necromancer / Aggressive / seed 0`: `run_complete`
  - `Barbarian / Aggressive / seed 1`: `run_complete`
- With those flips, the previously weak late-game roster outliers no longer reproduce on the same deterministic checkpoints.

## March 27 Early-Game Follow-Up

- Starter sustain was trimmed again on the sturdier early classes:
  - Amazon `Critical Strike`
  - Barbarian `Find Potion`, `Natural Resistance`
  - Druid `Lycanthropy`, `Oak Sage`
  - Paladin `Prayer`, `Cleansing`
- Result on a fresh deterministic sturdy-class weak-opening sweep:
  - `npm run sim:progression-class-sweep -- --class amazon,barbarian,druid,paladin --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 2`
  - Outcome: `24/24` runs still reached `Act II`
- Current interpretation:
  - late optimized balance improved materially
  - weak Act I failures still mostly live on fragile classes like Assassin and Sorceress
  - sturdy weak builds are still too safe early
  - the next early-game pass should target encounter / reward / progression structure rather than keep shaving individual starter cards
