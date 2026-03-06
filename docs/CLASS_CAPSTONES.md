# Class Capstones

_Snapshot: 2026-03-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for starter kits and tier-1 class cards.
- Use `CLASS_REWARD_TIERS.md` for tier-2 class cards and rank-up rules.
- Use this document for tier-3 class cards, boss-tier reward rules, and capstone nodes.

## Purpose

This document defines the top end of class progression for the first playable classes.

It answers four questions:

1. When do tier-3 class cards unlock?
2. How are boss-tier class rewards gated?
3. What are the exact late-run cards for `Barbarian` and `Sorceress`?
4. What are the capstone nodes for each class tree?

## Late-Progression Contract

Recommended unlock ladder:

- `Tier 1`: available from run start
- `Tier 2`: unlocks at `2` points in the relevant tree
- `Tier 3`: unlocks at `4` points in the relevant tree
- `Boss-tier capstone reward`: unlocks at `6` points in the relevant tree and should only appear on act-boss reward screens from `Act IV` onward

Late-run reward rules:

- standard battles may offer tier-3 cards at low weight once unlocked
- miniboss rewards should heavily bias toward unlocked tier-2 and tier-3 cards
- act-boss rewards should be the main source of capstone nodes
- a run should normally end with `1` primary capstone tree, not full capstones in multiple trees

## Capstone Node Rules

Capstone nodes are the top reward from a committed tree.

Rules:

- each tree has `1` capstone node
- a capstone node may be:
  - a fixed-skill-bar active
  - a passive node that does not use a skill slot
- each run should allow only `1` capstone node pick per class
- if the capstone is an active and all skill slots are full, the player must replace an equipped skill
- active capstones may share a name with an existing card family; in that case, the capstone is the always-available skill-bar version of that ability line

Recommended late skill-slot rule:

- classes start with `1` skill slot
- unlock slot `2` in the early-mid run
- unlock slot `3` by the late midgame or before first capstone access

## Barbarian Tier-3 Reward Pools

### Combat Skills

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Frenzy` | 2 | Attack | `4` points in `Combat Skills` | `Deal 9 damage twice. If both hits target the same enemy, your next Attack this turn costs 1 less.` | `Deal 10 damage twice. If both hits target the same enemy, your next Attack this turn costs 1 less.` | `Deal 11 damage twice. If both hits target the same enemy, your next Attack this turn costs 1 less and deals +2 damage.` |
| `Whirlwind` | 3 | Attack | `4` points in `Combat Skills` | `Deal 6 damage to all enemies twice.` | `Deal 7 damage to all enemies twice.` | `Deal 8 damage to all enemies twice.` |

Combat Skills tier-3 role:

- turn the tree into a true high-damage melee payoff path
- support both single-target burst and multi-target cleanup
- point directly at a `Berserk` capstone finish

### Combat Masteries

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Mace Mastery` | 1 | Skill | `4` points in `Combat Masteries` | `This combat, your Attacks deal +2 damage and ignore 4 Block. Draw 1. Exhaust.` | `This combat, your Attacks deal +3 damage and ignore 5 Block. Draw 1. Exhaust.` | `This combat, your Attacks deal +4 damage and ignore 6 Block. Draw 1. Exhaust.` |
| `Polearm Mastery` | 2 | Attack | `4` points in `Combat Masteries` | `Deal 12 damage to target. If another enemy exists, deal 8 damage to it.` | `Deal 14 damage to target. If another enemy exists, deal 9 damage to it.` | `Deal 16 damage to target. If another enemy exists, deal 10 damage to it.` |

Combat Masteries tier-3 role:

- make the passive-heavy mastery tree matter at the top end of a run
- reward clean, efficient heavy-attack turns
- support gear-led Barbarian lines without replacing deck decisions

### Warcries

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Battle Command` | 2 | Skill | `4` points in `Warcries` | `Gain 8 Block. Draw 1. Your next Attack this turn deals +8 damage. Your mercenary gains +4 damage this combat. Exhaust.` | `Gain 10 Block. Draw 1. Your next Attack this turn deals +9 damage. Your mercenary gains +5 damage this combat. Exhaust.` | `Gain 12 Block. Draw 1. Your next Attack this turn deals +10 damage. Your mercenary gains +6 damage this combat. Exhaust.` |
| `Grim Ward` | 2 | Skill | `4` points in `Warcries` | `Choose an enemy. It deals 8 less damage next turn. When it dies this combat, all enemies take 8 damage.` | `Choose an enemy. It deals 9 less damage next turn. When it dies this combat, all enemies take 10 damage.` | `Choose an enemy. It deals 10 less damage next turn. When it dies this combat, all enemies take 12 damage.` |

Warcries tier-3 role:

- let Warcries own late-fight tempo instead of only early safety
- deepen mercenary synergy and encounter control
- keep support Barbarian builds viable into boss-heavy acts

## Barbarian Capstone Nodes

### Combat Skills Capstone

| Tree | Node | Kind | Cost | Cooldown | Exact Text |
|---|---|---|---:|---:|---|
| `Combat Skills` | `Berserk` | Active | 2 | 2 | `Deal 26 damage. Ignore Block. Lose all Block.` |

### Combat Masteries Capstone

| Tree | Node | Kind | Exact Text |
|---|---|---|---|
| `Combat Masteries` | `Weapon Mastery` | Passive | `Your first Attack each turn costs 1 less, deals +6 damage, and ignores 6 Block.` |

### Warcries Capstone

| Tree | Node | Kind | Cost | Cooldown | Exact Text |
|---|---|---|---:|---:|---|
| `Warcries` | `Battle Orders` | Active | 2 | 3 | `Gain 14 Block. Heal 6. Your next Attack this turn deals +10 damage. Your mercenary gains +6 damage this combat.` |

## Sorceress Tier-3 Reward Pools

### Fire

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Hydra` | 3 | Spell | `4` points in `Fire` | `Summon Hydra for 3 turns. At the end of your turn, Hydra deals 5 damage to a random enemy.` | `Summon Hydra for 3 turns. At the end of your turn, Hydra deals 6 damage to a random enemy.` | `Summon Hydra for 3 turns. At the end of your turn, Hydra deals 7 damage to a random enemy.` |
| `Fire Mastery` | 1 | Skill | `4` points in `Fire` | `This combat, your Spells deal +3 damage and Burn you apply is increased by 1. Exhaust.` | `This combat, your Spells deal +4 damage and Burn you apply is increased by 1. Exhaust.` | `This combat, your Spells deal +5 damage and Burn you apply is increased by 2. Exhaust.` |

Fire tier-3 role:

- make dedicated fire runs snowball into sustained damage and burn scaling
- add a true late-fire engine without replacing spell sequencing
- point directly at a `Meteor` capstone finish

### Cold

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Blizzard` | 3 | Spell | `4` points in `Cold` | `Deal 8 damage to all enemies. Apply 2 Chill to all enemies.` | `Deal 9 damage to all enemies. Apply 2 Chill to all enemies.` | `Deal 10 damage to all enemies. Apply 3 Chill to all enemies.` |
| `Cold Mastery` | 1 | Skill | `4` points in `Cold` | `This combat, enemies with Chill take +3 damage from your Spells. Draw 1. Exhaust.` | `This combat, enemies with Chill take +4 damage from your Spells. Draw 1. Exhaust.` | `This combat, enemies with Chill take +5 damage from your Spells. Draw 1. Exhaust.` |

Cold tier-3 role:

- turn layered chill into a real boss and elite kill engine
- give cold builds a clean path from control into payoff
- point directly at a `Frozen Orb` capstone finish

### Lightning

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Thunder Storm` | 2 | Skill | `4` points in `Lightning` | `For the next 3 turns, at the end of your turn, deal 6 damage to a random enemy.` | `For the next 3 turns, at the end of your turn, deal 7 damage to a random enemy.` | `For the next 3 turns, at the end of your turn, deal 8 damage to a random enemy.` |
| `Teleport` | 1 | Skill | `4` points in `Lightning` | `Gain 10 Block. Your next Spell this turn costs 1 less and deals +5 damage.` | `Gain 12 Block. Your next Spell this turn costs 1 less and deals +6 damage.` | `Gain 14 Block. Your next Spell this turn costs 1 less and deals +7 damage.` |

Lightning tier-3 role:

- make lightning the cleanest tempo and chain-cast tree
- convert energy and sequencing into real late-run scaling
- point directly at a `Chain Lightning` capstone finish

## Sorceress Capstone Nodes

### Fire Capstone

| Tree | Node | Kind | Cost | Cooldown | Exact Text |
|---|---|---|---:|---:|---|
| `Fire` | `Meteor` | Active | 3 | 2 | `Deal 22 damage to target and 10 damage to all other enemies. Apply 3 Burn to all enemies.` |

### Cold Capstone

| Tree | Node | Kind | Cost | Cooldown | Exact Text |
|---|---|---|---:|---:|---|
| `Cold` | `Frozen Orb` | Active | 2 | 2 | `Deal 16 damage to all enemies. Apply 2 Chill to all enemies. If an enemy already had Chill, draw 1.` |

### Lightning Capstone

| Tree | Node | Kind | Cost | Cooldown | Exact Text |
|---|---|---|---:|---:|---|
| `Lightning` | `Chain Lightning` | Active | 2 | 2 | `Deal 18 damage to target and 10 damage to all other enemies. If this is the second Spell you used this turn, gain 1 Energy next turn.` |

## Run-Shaping Guidance

Recommended late-run outcomes:

- a focused single-tree build should usually end with:
  - `1` capstone node
  - `2-4` cards from that tree at rank `II` or better
  - `1-2` splash cards from another tree at most
- a hybrid build should usually end with:
  - no more than `1` capstone node
  - a strong primary tree with tier-3 access
  - a secondary tree supplying utility, defense, or energy support

Hard rule:

- capstones should finish builds
- they should not invalidate the deckbuilder layer by themselves

## Current Scope Note

This is a working design spec, not runtime truth.

The current implementation still needs:

- tier-3 card family metadata
- capstone reward hooks on act-boss screens
- late skill-slot unlock support
- runtime support for multi-turn effects such as `Hydra` and `Thunder Storm`
