# Vendor Design

_Snapshot: 2026-03-19_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CARD_ECONOMY_SPEC.md` for shared card pools and town pricing.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for class trees and reward pools.
- Use this document for vendor intent, interaction model, and design rationale.

## Design Principles

### One Vendor, One Job

Every vendor should have a single clear purpose. The player walks up, sees what the vendor does, makes one meaningful decision, and moves on. No vendor should present a multi-tab shop interface. Minimize choices per visit.

### Upgrades Over Accumulation

Inspired by Monster Train's merchant model and classic ARPG-style skill synergy systems: the late game should reward upgrading and combining existing cards, not stockpiling new ones. A tight 12-card deck with upgraded synergies should outperform a bloated 25-card deck with scattered effects.

Core mechanic: **skill tree stacking**. Higher-tier spells from the same class tree should upgrade onto lower-tier cards rather than adding new cards to the deck. Investing in `Fire Ball` when you already have `Fire Bolt` should transform `Fire Bolt` into `Fire Ball`, not add a second card. This mirrors classic synergy-driven ARPG progression where leveling related skills strengthens the whole tree, and it naturally keeps decks lean.

### Gold Is Tension

Every vendor interaction should cost enough gold to create real trade-offs. Healing competes with upgrading. Upgrading competes with gambling. Gambling competes with buying gear. The player should never be able to do everything in one town visit.

## Vendor Roles

### Healer

**Intent**: Restore party health for gold.

**Interaction**: One action. Pay gold, heal to full (or heal a fixed amount). Price scales with act number and missing health.

**Design notes**:
- Simplest vendor in the game.
- Exists to create gold tension: every coin spent healing is a coin not spent upgrading or gambling.
- Should never sell cards, potions, or anything else.

| Act | Heal Cost (per missing HP) |
|-----|---------------------------|
| 1   | 2 gold                    |
| 2   | 3 gold                    |
| 3   | 4 gold                    |
| 4   | 5 gold                    |
| 5   | 6 gold                    |

### Blacksmith

**Intent**: Upgrade cards. The Monster Train merchant equivalent.

**Interaction**: Pick one card from your deck, pick one upgrade to apply. Two-step choice, both small. The blacksmith shows 2-3 available upgrades (from a pool seeded by act and class).

**Core mechanic: Skill Tree Stacking**

When the player brings a card that has a higher-tier version in the same class tree, the blacksmith can **evolve** it instead of applying a generic upgrade. This is the primary deck-thinning and power-scaling mechanic.

Evolution examples:

| Base Card | Evolves Into | Tree | Requirement |
|-----------|-------------|------|-------------|
| `Fire Bolt` | `Fire Ball` | Fire | Act 2+ or tree rank 2+ |
| `Fire Ball` | `Meteor` | Fire | Act 4+ or tree rank 4+ |
| `Ice Bolt` | `Ice Blast` | Cold | Act 2+ or tree rank 2+ |
| `Ice Blast` | `Blizzard` | Cold | Act 4+ or tree rank 4+ |
| `Charged Bolt` | `Lightning` | Lightning | Act 2+ or tree rank 2+ |
| `Teeth` | `Bone Spear` | Poison & Bone | Act 2+ or tree rank 2+ |
| `Bash` | `Concentrate` | Combat Skills | Act 2+ or tree rank 2+ |
| `Double Swing` | `Frenzy` | Combat Skills | Act 3+ or tree rank 3+ |

Evolution rules:
- The old card is removed and the new card takes its slot.
- Deck size stays the same or shrinks (never grows from an evolution).
- Evolution costs more than a generic upgrade but less than buying a new card.
- The evolved card retains any generic upgrades already applied.

Generic upgrades (when no evolution is available):

| Upgrade | Effect | Cost |
|---------|--------|------|
| Sharpen | Card deals +3 damage | 40-60 gold |
| Fortify | Card grants +3 Block | 40-60 gold |
| Temper | Card costs 1 less Energy (once per card) | 80-100 gold |
| Hone | Card gains "Draw 1" | 60-80 gold |

Upgrade slot limit: each card has **2 upgrade slots** (matching Monster Train's model). Evolution does not consume a slot.

**What the blacksmith does NOT do**:
- Sell cards
- Sell equipment
- Remove cards from the deck

### Vendor

**Intent**: Buy and sell equipment and runes.

**Interaction**: Browse a short stock list (3-5 items). Buy gear, sell gear. Stock refreshes once per act.

This vendor already exists and is well-defined in the current implementation. No card sales. Equipment and runes only.

**Design notes**:
- Vendor stock should complement the current build, not replace reward-screen loot.
- Refresh mechanic (pay gold to reroll stock) stays, with escalating cost.
- Rune sales support the runeword system as the equipment-side build expression.

### Gambler

**Intent**: High-risk, high-reward mystery purchases. Both cards and equipment.

**Interaction**: The gambler presents 3 face-down purchases at different price points. The player picks one (or none). Each purchase is revealed after payment.

| Tier | Cost | Contents |
|------|------|----------|
| Bronze | 60-80 gold | Random neutral card, random tier-1 equipment, or a small gold refund |
| Silver | 120-160 gold | Random class card (any tree), random tier-2 equipment, or a rune |
| Gold | 200-280 gold | Random rare class card, random tier-3+ equipment, or a premium rune |

Outcome weights should favor middling results. The gambler should feel like a trap that occasionally pays off huge, not a reliable upgrade path.

**Design notes**:
- Expensive by design. Gambling twice in one town should strain most gold reserves.
- Mystery cards bypass the normal reward-pool filtering: you might get a card from a tree you haven't invested in, which is part of the risk.
- Equipment outcomes follow the classic cursed-market fantasy: pay for an unidentified item, and it could be magic, rare, or junk.
- The gambler is the only vendor where the player can get cards from uninvested trees. This is a feature, not a bug: it creates splashy moments and occasional build pivots.
- Acts 1-2 should only offer Bronze and Silver. Gold tier unlocks in Act 3+.

### Mercenary

**Intent**: Hire, swap, or revive a mercenary.

**Interaction**: One choice. Pick a merc from the act's available contracts, or pay to revive a downed merc. Current implementation is solid.

**Design notes**:
- Merc NPCs should not sell cards or upgrades.
- Merc power comes from the hire choice, route quest perks, and gear (if we add merc equipment later).
- Revive cost should scale with act to stay meaningful.

### Camp Sage (Corven Vale)

**Intent**: Deck surgery. Remove cards, transform cards, identify upgrade paths.

**Interaction**: Pick one service per visit.

| Service | Effect | Cost |
|---------|--------|------|
| **Purge** | Remove one card from your deck permanently | 50 gold, +25 per subsequent purge this run |
| **Transform** | Replace one card with a random card of the same tier and type | 40 gold |
| **Identify** | Reveal evolution paths for all eligible cards (informational, no deck change) | Free |

**Design notes**:
- Purging is the single most important service in a deckbuilder. Removing starter `Strike` and `Guard` cards to increase draw consistency is a core skill-expression.
- Escalating purge cost (50, 75, 100, 125...) mirrors Monster Train's model and prevents infinite thinning.
- Transform is the gamble-lite option: cheaper than the gambler, but you lose the card you had.
- Identify is free to encourage visiting the camp sage. It teaches the player about the evolution system and surfaces what the blacksmith can do.
- The camp sage should **not** sell cards. His value is in deck manipulation, not deck expansion.

### Stash

**Intent**: Cross-run persistent storage.

**Interaction**: Deposit or withdraw items. Current implementation is solid.

**Design notes**:
- Stash should handle equipment and runes only.
- Cards should not be stashable across runs (they are run-scoped).
- Could later support a "sideboard" mechanic: swap cards between active deck and a small bench. But this is not v1.

### Travel (Dagan, Salek)

**Intent**: Flavor and act transition.

**Interaction**: None in v1. Exists for atmosphere and campaign continuity.

**Future potential**: Could sell "shortcut" map items that skip zones on the world map, at the cost of missed rewards. Low priority.

## Vendor Summary Matrix

| Vendor | Action | Sells Cards? | Sells Gear? | Modifies Deck? | Gold Sink? |
|--------|--------|:---:|:---:|:---:|:---:|
| Healer | Heal party | No | No | No | Yes |
| Blacksmith | Upgrade/evolve cards | No | No | Yes (upgrade) | Yes |
| Vendor | Buy/sell equipment | No | Yes | No | Yes |
| Gambler | Mystery purchase | Yes (random) | Yes (random) | Yes (add) | Yes (expensive) |
| Mercenary | Hire/revive merc | No | No | No | Yes |
| Sage | Purge/transform cards | No | No | Yes (remove/transform) | Yes |
| Stash | Store items | No | No | No | No |
| Travel | Flavor | No | No | No | No |

## Skill Tree Stacking: Full Design

This is the central mechanic that ties vendors to the card progression system.

### How It Works

Classic synergy-driven ARPG skill systems grant bonuses across related abilities: investing in `Fire Bolt` makes `Fire Ball` stronger. In Rouge, this translates to a card evolution chain where lower-tier cards physically transform into higher-tier cards.

```
Tier 1          Tier 2          Tier 3
Fire Bolt  -->  Fire Ball  -->  Meteor
Ice Bolt   -->  Ice Blast  -->  Blizzard
Teeth      -->  Bone Spear -->  Bone Spirit
Bash       -->  Concentrate --> Berserk
```

### Why This Works for a Roguelite Card Builder

1. **Deck stays lean.** Evolution replaces cards instead of adding them. A player who evolves aggressively ends up with a tight, powerful deck.
2. **Rewards tree commitment.** You can only evolve along a tree you've invested in. Spreading across all three trees means shallow evolution. Committing deep into one tree means reaching tier-3 evolutions.
3. **Creates blacksmith tension.** Do you evolve `Fire Bolt` into `Fire Ball` (more damage, same slot) or apply two generic upgrades to `Fire Bolt` (cheaper, keeps flexibility)?
4. **Reinforces the Blood Rogue fantasy.** Players who love deep elemental or weapon specialization get the same feeling of watching a signature skill grow through investment.
5. **Natural difficulty curve.** Early acts are about choosing a tree direction. Mid acts are about evolving your core cards. Late acts are about perfecting a tight combo deck with tier-3 cards and generic upgrades stacked on top.

### Synergy Bonuses (Passive)

Beyond evolution, cards from the same tree should grant passive bonuses to each other when both are in the deck:

- Having `Fire Bolt` and `Fire Ball` in the same deck: `Fire Ball` deals +2 damage (synergy bonus from a related tree card).
- Having 3+ cards from the same tree: all cards in that tree gain a small bonus (e.g., +1 damage or -1 cost to the cheapest card).

This rewards tree focus without requiring evolution. Even if you add `Fire Ball` as a new card (from rewards), having `Fire Bolt` still in the deck makes it better.

### Interaction With Vendors

| Vendor | Relationship to Stacking |
|--------|-------------------------|
| Blacksmith | Performs evolutions and generic upgrades |
| Sage | Removes starter cards to make room for evolved tree cards |
| Gambler | Can drop off-tree cards that break synergy focus (risk) |
| Rewards | Primary source of new tier-1 cards to seed evolution chains |

## Town Visit Flow

A typical town visit should feel like:

1. **Assess**: Check health, check deck, check gold.
2. **Heal** if needed (healer).
3. **One big decision**: Upgrade a card (blacksmith), remove a card (sage), buy gear (vendor), or gamble.
4. **Leave town** and continue the route.

The player should rarely have enough gold to do more than one major action per town visit. This keeps town visits fast and decision-dense.

## Economy Guardrails

- Healing should cost roughly 30-50% of a typical zone's gold reward.
- A blacksmith evolution should cost roughly one full zone's gold reward.
- A gambler purchase should cost 1.5-2x a zone's gold reward.
- A sage purge should cost roughly 60-80% of a zone's gold reward.
- The player should accumulate enough gold per act to make 2-3 major vendor purchases.

## Relationship to CARD_ECONOMY_SPEC

`CARD_ECONOMY_SPEC.md` currently describes vendors (Mireya, Braska) selling cards directly. This document supersedes that model:

- **Vendors no longer sell cards directly.** Card acquisition comes from combat rewards and the gambler only.
- **Blacksmith replaces the "card shop" concept** with upgrade/evolution services.
- **Sage replaces ad-hoc card removal** with a dedicated, escalating-cost purge service.
- Card pricing tables in `CARD_ECONOMY_SPEC.md` should be retired in favor of the blacksmith upgrade costs and gambler mystery costs defined here.
- The neutral/common card pool and town-exclusive premium cards from `CARD_ECONOMY_SPEC.md` should move into the gambler's outcome tables and the combat reward pool.

## Current Scope Note

This is a working design spec, not current runtime truth.

The current implementation needs:
- Skill tree evolution chain definitions per class
- Blacksmith upgrade UI and logic
- Sage purge/transform UI and logic
- Gambler mystery-purchase UI and logic
- Synergy bonus calculation in combat
- Gold economy rebalancing around the new vendor roles
