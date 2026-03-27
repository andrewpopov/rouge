# Balance Snapshot

Generated: March 27, 2026.

## Commands

- `node ./scripts/run-progression-class-sweep.js --class amazon,assassin,druid,sorceress --policy aggressive --through-act 5 --probe-runs 0 --seeds 4`
- `node ./scripts/run-progression-class-sweep.js --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 4`
- direct follow-up probes:
  - `node ./scripts/run-progression-sim.js --class paladin --policy aggressive --through-act 5 --seed-offset 1 --json`
  - `node ./scripts/run-progression-sim.js --class paladin --policy aggressive --through-act 5 --seed-offset 2 --json`

## Aggressive Optimized Band

- Amazon: `3/4` complete. Seed `0` fails at `Act IV Diablo`.
- Assassin: `3/4` complete. Seed `2` fails at `Act IV Diablo`.
- Druid: `3/4` complete. Seed `0` fails at `Act IV Diablo`.
- Sorceress: `3/4` complete. Seed `3` fails at `Act IV Diablo`.

Additional current sample on slower classes:

- Barbarian: seeds `0-2` all complete on the latest post-fix run; seed `3` remained a slow-path sim.
- Necromancer: seeds `0-2` all complete on the latest post-fix run; seed `3` remained a slow-path sim.
- Paladin: direct rechecks show seed `1` fails at `Act IV Diablo`, seed `2` fails at `Act IV Diablo`, and seed `3` completes. Seed `0` remained a slow-path sim.

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
- Andariel is once again a real Act I failure point for weaker lines, especially Assassin and Sorceress.
- Diablo remains the main optimized-build gate.
- Paladin is the clearest remaining aggressive outlier and still needs a narrow follow-up before balance should be frozen.
