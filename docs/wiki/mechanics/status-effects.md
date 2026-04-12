# Status Effects

All live combat statuses, debuffs, and targeting-state effects in the current build.

Last updated: 2026-04-11

Documentation note:
- Start with [PROJECT_MASTER.md](/Users/andrew/proj/rouge/docs/PROJECT_MASTER.md).
- Use [LIVE_MECHANICS_AND_BALANCE.md](/Users/andrew/proj/rouge/docs/LIVE_MECHANICS_AND_BALANCE.md) for the routing rules and owner-doc map.
- Use this file for exact current-build timing, stacking, decay, resistance, and immunity semantics.

## Current Rule

Status timing is deterministic and should be read literally:

- hero `Burn` and `Poison` tick at the start of the next player turn, then lose `1` stack
- hero `Chill`, `Energy Drain`, `Amplify`, and `Weaken` affect the upcoming player turn before they decay at end of turn
- enemy `Burn`, `Poison`, `Freeze`, `Stun`, and `Paralyze` are resolved during enemy action timing
- enemy `Slow` affects intent advancement rather than raw damage directly

## Hero-Side Debuffs

These are the live debuffs enemies and traits can apply to the hero.

| Status | Live effect | Resistance / immunity | Decay timing |
|---|---|---|---|
| `Burn` | Deal fire damage equal to current stacks | `fire` immunity negates it; `fire` resistance reduces damage | Ticks at start of player turn, then `-1` stack |
| `Poison` | Deal poison damage equal to current stacks | `poison` immunity negates it; `poison` resistance reduces damage | Ticks at start of player turn, then `-1` stack |
| `Chill` | Draw `1` fewer card on the next player turn | `cold` immunity negates application | Decays at end of player turn after affecting draw |
| `Energy Drain` | Start the next player turn with `1` less Energy | none | Decays at end of player turn after affecting energy |
| `Amplify` | Hero takes `+50%` incoming damage | none | Decays at end of player turn after the enemy phase and the following player turn have both felt it |
| `Weaken` | Hero melee and weapon-scaled damage is reduced to `70%` | none | Decays at end of player turn after affecting output |

Notes:

- hero `Burn` and `Poison` bypass Guard
- hero `Amplify` applies before hero resistance reduces incoming damage
- `Chill`, `Energy Drain`, `Amplify`, and `Weaken` are stack-based duration states, not one-shot triggers

## Enemy-Side Statuses

These are the live statuses the hero, cards, skills, weapon effects, and summons can apply to enemies.

| Status | Live effect | Stack behavior | Decay timing |
|---|---|---|---|
| `Burn` | Enemy takes damage equal to current stacks | additive | At enemy action start, then `-1` stack |
| `Poison` | Enemy takes damage equal to current stacks and bypasses Guard | additive | At enemy action start, then `-1` stack |
| `Slow` | Enemy repeats its current intent instead of advancing to the next one | additive duration | Loses `1` stack when intent advancement is checked |
| `Freeze` | Enemy skips its action phase | additive duration | Loses `1` stack when a phase is skipped |
| `Stun` | Enemy skips one action phase | non-additive; current helper sets to the applied value | Clears to `0` after the skipped phase |
| `Paralyze` | Enemy attack intents are halved for that phase | additive duration | Loses `1` stack after the weakened phase |

Notes:

- enemy `Burn` uses normal damage resolution, so Guard can absorb it
- enemy `Poison` is direct life loss and ignores Guard
- `Freeze` and `Stun` are both hard crowd control, but `Stun` is consumed in one skip even if overapplied
- `Slow` changes cadence, not just attack numbers

## Targeting-State Effects

These are not normal damage statuses, but they are part of live combat-state behavior.

| Effect | Live effect | Decay timing |
|---|---|---|
| `Taunt` | Redirects single-target enemy attacks toward the taunting target when possible | Decays at the start of the next player turn after the enemy phase is resolved |
| `Fade` | Redirects single-target enemy attacks away from the hero when another valid target exists | Decays at the start of the next player turn after the enemy phase is resolved |
| `Mark` | Flags an enemy for mercenary targeting and mark-consumption payoffs | Persists until consumed, replaced, or the target dies |

Notes:

- `attack_all` effects ignore `Taunt` and `Fade`
- current live taunt use is mercenary-facing rather than a broad ally-stance system

## Application Surface

The live card-effect status surface currently includes:

- `apply_burn`
- `apply_burn_all`
- `apply_poison`
- `apply_poison_all`
- `apply_slow`
- `apply_slow_all`
- `apply_freeze`
- `apply_freeze_all`
- `apply_stun`
- `apply_stun_all`
- `apply_paralyze`
- `apply_paralyze_all`
- `apply_taunt`

The combat runtime also supports:

- hero-side debuff application from enemy intents and traits
- status riders from skills and weapon effects
- status interaction inside minion, mercenary, and enemy-action flows

## Resistance And Immunity

Current live rules:

- hero resistances come from `armorProfile.resistances`
- hero immunities come from `armorProfile.immunities`
- immunity blocks both damage and status application for matching elemental hero debuffs
- direct incoming damage still respects the hero resistance pipeline after `Amplify`
- enemy-side resistances and immunities are encounter-content concerns and should not be assumed unless the current enemy data says so

## Regression Coverage

The live status contract is currently covered by:

- [tests/combat-effect-status-contracts.test.ts](/Users/andrew/proj/rouge/tests/combat-effect-status-contracts.test.ts)
- [tests/combat-turns.test.ts](/Users/andrew/proj/rouge/tests/combat-turns.test.ts)
- [tests/monster-actions.test.ts](/Users/andrew/proj/rouge/tests/monster-actions.test.ts)
- [tests/combat-log-and-mechanics.test.ts](/Users/andrew/proj/rouge/tests/combat-log-and-mechanics.test.ts)
- [tests/combat-scenarios.test.ts](/Users/andrew/proj/rouge/tests/combat-scenarios.test.ts)

If status behavior changes, update this file and the relevant tests together.

## Source Files

- [src/combat/monster-traits.ts](/Users/andrew/proj/rouge/src/combat/monster-traits.ts)
- [src/combat/combat-engine-turns.ts](/Users/andrew/proj/rouge/src/combat/combat-engine-turns.ts)
- [src/combat/combat-engine-enemy-turns.ts](/Users/andrew/proj/rouge/src/combat/combat-engine-enemy-turns.ts)
- [src/combat/combat-engine-damage.ts](/Users/andrew/proj/rouge/src/combat/combat-engine-damage.ts)
- [src/combat/card-effects.ts](/Users/andrew/proj/rouge/src/combat/card-effects.ts)
