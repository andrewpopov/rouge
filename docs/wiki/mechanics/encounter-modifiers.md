# Encounter Modifiers

> Combat setup modifiers that change encounter dynamics before the first turn.

Last updated: 2026-04-11

## Overview

Encounter modifiers are applied at combat start to create tactical variety. They buff specific enemy roles, change opening dynamics, or create positional advantages. Understanding these is critical for deck building — your deck needs answers for modified encounters, not just vanilla fights.

## Positioning Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **FORTIFIED_LINE** | All enemies | Enemy line starts with guard |
| **ESCORT_BULWARK** | Elite + Support enemies | Gain starting guard |
| **BACKLINE_SCREEN** | Ranged + Support enemies | Gain starting guard |
| **SNIPER_NEST** | Ranged (backline) enemies | Gain guard + attack bonus |

**Counter strategy:** Guard-breaking effects (sunder, crushing blow), AoE damage to bypass guard walls, or high single-target burst to punch through.

## Momentum Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **AMBUSH_OPENING** | Raider + Ranged enemies | Shift first intent (faster opener) |
| **VANGUARD_RUSH** | Raider + Brute enemies | Shift opening intent to aggressive |
| **ESCORT_COMMAND** | Elite + Support enemies | Advance script (faster ability cycle) |
| **ELITE_ONSLAUGHT** | Elite enemies | Advance script + hit harder |

**Counter strategy:** Early guard generation, disruption (stun/freeze) on turn 1, or enough life/mitigation to absorb the burst opener.

## Combo Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **ESCORT_ROTATION** | Non-boss escorts | Gain guard + advance intent |
| **COURT_RESERVES** | Elite + Backline enemies | Gain guard + intense opening |
| **PHALANX_MARCH** | Brute + Elite enemies | Gain guard + advance script |

**Counter strategy:** AoE pressure to thin the escort before combos develop, or focused burst on the key combo piece.

## Damage Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **CROSSFIRE_LANES** | Ranged enemies | Hit harder |
| **WAR_DRUMS** | Raider + Brute enemies | Hit harder |
| **LINEBREAKER_CHARGE** | Heavy enemies | Shift to breach scripts, hit harder |

**Counter strategy:** Kill damage-buffed enemies first, stack guard for the burst turns, or use disruption to prevent attacks.

## Support Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **TRIAGE_COMMAND** | Support enemies | Restore more life to allies |
| **TRIAGE_SCREEN** | Support enemies | Gain guard + restore more life |

**Counter strategy:** Priority-kill support enemies or use AoE to outpace healing. Backline-hunter mercenaries excel here.

## Ritual Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **RITUAL_CADENCE** | Support + Boss enemies | Gain guard, warding intensifies |

Ritual intent priority order: heal_allies > heal_and_guard > heal_ally > resurrect_ally > guard_allies > guard

**Counter strategy:** Overwhelming burst before ritual effects stack, or disruption to interrupt the healing chain.

## Boss Modifiers

| Modifier | Targets | Effect |
|----------|---------|--------|
| **BOSS_SCREEN** | Boss + Escorts | Boss gains guard, escorts gain guard, opener intensifies |
| **BOSS_ONSLAUGHT** | Boss | Boss shifts to attack script, hits harder |
| **BOSS_SALVO** | Boss + Ranged | Boss and ranged shift to attacks, hit harder |

**Counter strategy:** Boss encounters require both sustained damage and burst mitigation. Guard-positive cards and timed disruption are essential.

## Modifier Interaction with Enemy Roles

| Enemy Role | Most Dangerous Modifiers |
|------------|------------------------|
| Raider | AMBUSH_OPENING, VANGUARD_RUSH, WAR_DRUMS |
| Brute | VANGUARD_RUSH, LINEBREAKER_CHARGE, PHALANX_MARCH, WAR_DRUMS |
| Ranged | BACKLINE_SCREEN, CROSSFIRE_LANES, SNIPER_NEST, BOSS_SALVO |
| Support | ESCORT_BULWARK, TRIAGE_COMMAND, TRIAGE_SCREEN, RITUAL_CADENCE |
| Boss | BOSS_SCREEN, BOSS_ONSLAUGHT, BOSS_SALVO, RITUAL_CADENCE |

## Source Files

- `src/combat/combat-modifiers.ts` — All modifier constants and definitions
