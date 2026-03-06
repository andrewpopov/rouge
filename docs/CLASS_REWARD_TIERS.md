# Class Reward Tiers

_Snapshot: 2026-03-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for starter kits and tier-1 class cards.
- Use `CARD_ECONOMY_SPEC.md` for neutral/common cards and town card sales.
- Use this document for higher class reward tiers and card-family rank-up rules.
- Use `CLASS_CAPSTONES.md` for tier-3 class cards and capstone nodes.

## Purpose

This document defines how class-card progression should move beyond the starter deck and tier-1 pool.

It answers three questions:

1. When do higher-tier class cards unlock?
2. How do duplicate offers convert into card-family ranks?
3. What are the exact tier-2 rewards for `Barbarian` and `Sorceress`?

## Tier Unlock Rules

Recommended rules:

- `Tier 1` class cards are eligible from run start.
- `Tier 2` class cards unlock when the player has spent `2` points in the relevant class tree.
- Once a tree unlocks tier 2, the next `miniboss` or `boss` reward should guarantee at least `1` offer from that tree's tier-2 pool.
- After that guarantee is consumed, standard battle rewards may offer tier-2 cards from invested trees at low weight.
- Town vendors should not sell tier-2 class cards in Act I.
- Earliest town sale of a tier-2 class card should be Act II, at premium price, and only for already-invested trees.

## Card-Family Rank-Up Contract

When a card family reaches copy cap, future offers should rank up that family instead of adding extra copies.

Recommended rules:

- default copy cap for class cards: `2`
- default maximum family rank: `III`
- starter cards, tier-1 cards, and tier-2 cards all use the same rank ladder
- premium vendor cards should usually cap at `Rank II`
- relic/artifact effects should not rank through card rewards

Reward-screen behavior:

- if a card is below copy cap, the reward adds a copy
- if a card is at copy cap and below max rank, the reward upgrades that family by `+1` rank
- if a card is at copy cap and max rank, its reward weight should drop sharply for the rest of the run

Design rule:

- rank-ups should preserve card identity
- they should make the chosen card more reliable or explosive, not change its role entirely

## Barbarian Tier-2 Reward Pools

### Combat Skills

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Concentrate` | 2 | Attack | `2` points in `Combat Skills` | `Deal 14 damage. Gain 6 Block.` | `Deal 17 damage. Gain 7 Block.` | `Deal 20 damage. Gain 8 Block.` |
| `Leap Attack` | 2 | Attack | `2` points in `Combat Skills` | `Deal 11 damage. If you played a Skill first this turn, deal 7 more.` | `Deal 13 damage. If you played a Skill first this turn, deal 8 more.` | `Deal 15 damage. If you played a Skill first this turn, deal 9 more.` |

Combat Skills tier-2 role:

- upgrade Barbarian from solid early sequencing into real burst turns
- reward attack-first or skill-setup attack lines
- establish the path toward later `Whirlwind` / `Berserk` style finishers

### Combat Masteries

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Axe Mastery` | 1 | Skill | `2` points in `Combat Masteries` | `This combat, your Attacks that cost 2 or more deal +4 damage. Draw 1. Exhaust.` | `This combat, your Attacks that cost 2 or more deal +5 damage. Draw 1. Exhaust.` | `This combat, your Attacks that cost 2 or more deal +6 damage. Draw 1. Exhaust.` |
| `Throwing Mastery` | 1 | Attack | `2` points in `Combat Masteries` | `Deal 6 damage to up to 2 enemies. Draw 1.` | `Deal 7 damage to up to 2 enemies. Draw 1.` | `Deal 8 damage to up to 2 enemies. Draw 1.` |

Combat Masteries tier-2 role:

- let mastery investment scale deck quality without flooding the skill bar
- create a stable backbone for heavier attacks and multi-target turns
- keep the mastery tree relevant even when it is mostly passive elsewhere

### Warcries

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Battle Orders` | 2 | Skill | `2` points in `Warcries` | `Gain 10 Block. Heal 4. Your mercenary gains +3 damage this combat. Exhaust.` | `Gain 12 Block. Heal 5. Your mercenary gains +3 damage this combat. Exhaust.` | `Gain 14 Block. Heal 6. Your mercenary gains +4 damage this combat. Exhaust.` |
| `War Cry` | 2 | Skill | `2` points in `Warcries` | `Deal 5 damage to all enemies. All enemies deal 3 less damage next turn.` | `Deal 6 damage to all enemies. All enemies deal 4 less damage next turn.` | `Deal 7 damage to all enemies. All enemies deal 5 less damage next turn.` |

Warcries tier-2 role:

- push Warcries past basic setup into encounter-shaping control
- make mercenary-backed support builds feel intentional
- give Barbarian a real defensive or team-support branch

## Sorceress Tier-2 Reward Pools

### Fire

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Fire Wall` | 2 | Spell | `2` points in `Fire` | `Deal 6 damage. Apply 3 Burn. If the target already has Burn, deal 4 damage to all enemies.` | `Deal 7 damage. Apply 3 Burn. If the target already has Burn, deal 5 damage to all enemies.` | `Deal 8 damage. Apply 4 Burn. If the target already has Burn, deal 6 damage to all enemies.` |
| `Meteor` | 3 | Spell | `2` points in `Fire` | `Deal 16 damage to target and 6 damage to all other enemies. Apply 2 Burn to all enemies.` | `Deal 18 damage to target and 7 damage to all other enemies. Apply 2 Burn to all enemies.` | `Deal 20 damage to target and 8 damage to all other enemies. Apply 3 Burn to all enemies.` |

Fire tier-2 role:

- convert early burn pressure into real encounter-ending payoff
- make dedicated fire lines feel distinct from generic spell damage
- set up the late route toward `Hydra` or other high-ceiling fire finishers

### Cold

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Glacial Spike` | 2 | Spell | `2` points in `Cold` | `Deal 9 damage to target and 4 damage to all other enemies. Apply 2 Chill to the target and 1 Chill to all other enemies.` | `Deal 10 damage to target and 5 damage to all other enemies. Apply 2 Chill to the target and 1 Chill to all other enemies.` | `Deal 11 damage to target and 6 damage to all other enemies. Apply 3 Chill to the target and 1 Chill to all other enemies.` |
| `Shiver Armor` | 1 | Skill | `2` points in `Cold` | `Gain 9 Block. Until your next turn, each enemy that attacks you gains 2 Chill.` | `Gain 11 Block. Until your next turn, each enemy that attacks you gains 2 Chill.` | `Gain 13 Block. Until your next turn, each enemy that attacks you gains 3 Chill.` |

Cold tier-2 role:

- deepen the defensive-control identity instead of just adding more damage
- make elite and boss fights safer through layered chill application
- prepare the line toward late `Blizzard` / `Frozen Orb` style payoff

### Lightning

| Card | Cost | Type | Unlock | Rank I | Rank II | Rank III |
|---|---:|---|---|---|---|---|
| `Lightning` | 2 | Spell | `2` points in `Lightning` | `Deal 15 damage. If this is the second Spell you played this turn, gain 1 Energy next turn.` | `Deal 17 damage. If this is the second Spell you played this turn, gain 1 Energy next turn.` | `Deal 19 damage. If this is the second Spell you played this turn, gain 1 Energy next turn.` |
| `Chain Lightning` | 3 | Spell | `2` points in `Lightning` | `Deal 8 damage to target and 5 damage to up to 2 other enemies.` | `Deal 9 damage to target and 6 damage to up to 2 other enemies.` | `Deal 10 damage to target and 7 damage to up to 2 other enemies.` |

Lightning tier-2 role:

- reward high-tempo spell turns with bigger payoff cards
- create the first real chain-damage identity for the class
- set up the line toward later `Teleport`, `Thunder Storm`, or other high-skill-cap lightning tools

## Reward Weighting Guidance

Recommended class reward weighting after tree investment:

- if the player has `0` points in all trees beyond baseline:
  - even weighting across tier-1 pools
- if the player has `1` point in a tree:
  - modest bias toward that tree's tier-1 pool
- if the player has `2+` points in a tree:
  - strong bias toward that tree
  - tier-2 pool becomes eligible
- if the player has invested across two trees:
  - keep one tree as primary for reward weighting
  - let the second tree appear often enough to sustain hybrid builds

## Current Scope Note

This is a working design spec, not runtime truth.

The current implementation still needs:

- class-card family rank metadata
- reward-weighting hooks
- tree-aware reward unlock checks
- UI support for copy vs rank-up reward resolution
