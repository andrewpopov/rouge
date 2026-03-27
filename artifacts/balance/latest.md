# Balance Snapshot

Generated: March 27, 2026.

## Commands

- `node ./scripts/run-progression-class-sweep.js --class amazon,assassin,druid,sorceress --policy aggressive --through-act 5 --probe-runs 0 --seeds 4`
- `node ./scripts/run-progression-class-sweep.js --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 4`
- direct follow-up probes:
  - `node ./scripts/run-progression-sim.js --class paladin --policy aggressive --through-act 5 --seed-offset 1 --json`
  - `node ./scripts/run-progression-sim.js --class paladin --policy aggressive --through-act 5 --seed-offset 2 --json`
  - same two Paladin seeds rerun after the late-guard card pass

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
