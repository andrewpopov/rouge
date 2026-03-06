# Card Economy Spec

_Snapshot: 2026-03-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for class-specific starter kits and tree reward cards.
- Use this document for shared reward-card structure, neutral/common cards, and town card inventory.

## Purpose

This document defines the shared card economy around the class decks.

It answers four questions:

1. What goes into non-class reward screens?
2. How should neutral/common cards support early deckbuilding?
3. What kinds of cards can towns sell?
4. How do vendors complement class reward pools without replacing them?

## Reward-Offer Structure

Recommended default shape for an early battle card reward:

- `3` choices total
- `1` neutral/common option
- `2` class reward-pool options

Rules:

- neutral/common cards should always be legal from run start
- tier-1 class cards should be legal from run start
- higher-tier class cards should require tree investment and later act progression
- town cards should be weaker and more curated than combat-earned class rewards
- artifacts/relics should never be sold through town card stock

## Neutral / Common Reward Pool

These are the early shared cards that any class can add without committing to a tree.

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Heavy Strike` | 2 | Attack | 2 | `Deal 12 damage.` |
| `Brace` | 1 | Skill | 2 | `Gain 8 Block.` |
| `Second Wind` | 0 | Skill | 2 | `Gain 4 Block. Draw 1. Exhaust.` |
| `Field Dressing` | 1 | Skill | 2 | `Heal 5. Remove 1 debuff. Exhaust.` |
| `Battle Focus` | 1 | Skill | 2 | `Draw 2. Your next card this turn costs 1 less. Exhaust.` |
| `Finisher` | 1 | Attack | 2 | `Deal 7 damage. If the target is below half Health, deal 6 more.` |
| `Push Forward` | 0 | Skill | 2 | `Draw 1. Gain 1 Energy next turn. Exhaust.` |
| `Guard Break` | 1 | Attack | 2 | `Deal 6 damage. If the target has Block, remove all of it before dealing damage.` |

Pool role:

- patch weak early hands
- provide the baseline reward option that is never build-dead
- give town vendors a legal card stock that works for both classes

## Town Card Economy Contract

Town cards should be a support layer, not the primary source of build identity.

Hard rules:

- vendors mostly sell neutral/common cards
- vendors may sell a small number of tier-1 class cards
- vendors should never sell boss-exclusive cards or deep tree cards
- vendor cards should cost enough gold to compete with potions, buffs, gear, and mercenary upkeep

Recommended price bands:

- neutral/common card: `45-60` gold
- tier-1 class card: `70-90` gold
- premium town-exclusive utility/combat card: `85-110` gold

Recommended refresh rule:

- generate vendor stock when the player enters a town for the first time in that act
- keep the stock stable for the rest of that act
- reroll stock only on entering the next act safe zone

## Act I Vendor Roles

### Akara

Primary role:

- healing
- potions
- temporary buffs
- utility/support card sales

Default stock shape:

- `2` neutral utility cards
- `1` class support card weighted toward invested trees
- `1` premium utility card

Recommended eligible stock:

| Card | Price | Notes |
|---|---:|---|
| `Field Dressing` | 45 | sustain purchase |
| `Second Wind` | 45 | defensive smoothing |
| `Battle Focus` | 55 | setup / cycle tool |
| `Natural Resistance` | 80 | Barbarian support option |
| `Howl` | 75 | Barbarian defensive tempo option |
| `Frozen Armor` | 80 | Sorceress defensive option |
| `Telekinesis` | 75 | Sorceress utility option |
| `Ward Sigil` | 95 | town-exclusive utility card |

### Charsi

Primary role:

- gear
- repair / upkeep equivalent
- attack / armor card sales

Default stock shape:

- `2` neutral combat cards
- `1` class combat card weighted toward invested trees
- `1` premium combat card

Recommended eligible stock:

| Card | Price | Notes |
|---|---:|---|
| `Heavy Strike` | 50 | baseline damage upgrade |
| `Brace` | 45 | baseline defense upgrade |
| `Finisher` | 55 | aggressive generalist option |
| `Guard Break` | 55 | anti-block utility |
| `Cleave` | 85 | Barbarian AoE option |
| `Stun` | 80 | Barbarian control option |
| `Fire Ball` | 85 | Sorceress damage option |
| `Ice Blast` | 85 | Sorceress control-damage option |
| `Tempered Steel` | 100 | town-exclusive combat card |

### Cain

Primary role:

- identify / info / quest progression

Rule:

- Cain should not sell cards in v1
- his value should come from route intel, item identification-style services, and quest context

### Kashya

Primary role:

- mercenary hire, replace, equip, and revive

Rule:

- Kashya should not sell cards in v1
- mercenary power should come through hire choice and equipment, not through overlap with town card shops

## Town-Exclusive Premium Cards

These can appear in vendor stock but should not be normal battle rewards.

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Ward Sigil` | 1 | Skill | 1 | `Gain 7 Block. The next debuff that would be applied to you this combat is ignored. Exhaust.` |
| `Tempered Steel` | 1 | Skill | 1 | `This combat, your Attacks and Spells deal +2 damage. Gain 5 Block. Exhaust.` |

Design role:

- give towns a few compelling purchases without eclipsing class-tree rewards
- create meaningful gold tension even when the player skips potions or gear
- let utility and combat vendors feel distinct

## Integration Notes

- battle rewards should remain the main source of class identity
- minibosses and bosses should remain the main source of premium combat upgrades
- town cards should help smooth a build, patch a weakness, or reinforce an invested tree
- if a vendor offers a class card, it should usually match an already-invested tree

## Current Scope Note

This is a working design spec, not current runtime truth.

The current implementation still needs:

- vendor stock data structures
- pricing hooks
- card shop UI
- class-aware inventory weighting
