# Deckbuilder Progression Audit

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `DECKBUILDER_COMBAT_MODEL.md` for the target hybrid gameplay model.
- Use `OPTIMIZED_DECK_PROFILE.md` for the target late-game deck shape and the intended build journey.
- Use this document as the live-gap audit for reward screens, evolutions, upgrades, purge tools, merchant reinforcement, and how they interact with combat.

## Purpose

Rouge now has a clearer target:

- _Slay the Spire_ for turn tension and deck curation
- _Monster Train_ for reinforcement, merchants, and vertical upgrade pressure
- Diablo II for class identity, specialization, and matchup-prep mindset

This audit answers a practical question:

- where does the live runtime already support that model
- where is it only partially aligned
- where is it still fighting the intended feel

## The Contract We Want

At a high level:

- reward screens decide what the deck is trying to do
- tree investment decides what deserves repeated reinforcement
- blacksmith evolution and upgrade make a few important cards exceptional
- purge and transform keep the deck coherent
- items and runewords reinforce the plan instead of replacing it
- combat proves whether the deck can cycle into that plan under pressure

## Audit Summary

| System | Live Status | Read |
|---|---|---|
| Deterministic draw/discard/reshuffle | `live` | Good foundation. The deck cycle is real and readable. |
| Reward-screen direction | `partial` | Role-aware and specialization-biased, but still mixes direction and vertical power more than we want. |
| Tree specialization | `partial` | Strong framework exists, but content still does not always honor the utility-splash rule cleanly. |
| Blacksmith reinforcement | `partial` | Evolutions exist and `_plus` refinements now live in town runtime, but full slot-style upgrade depth still does not. |
| Sage deck surgery | `partial` | Purge is good and transform is now constrained, but transform still needs more authored strategic purpose. |
| Merchant reinforcement | `partial` | Town economy is rich, but item-side systems are much stronger than card-side reinforcement. |
| Gambler | `off-model` | Too noisy and too willing to inject random off-plan cards without enough structure. |
| Duplicate deck-surgery seams | `resolved` | Quartermaster no longer overlaps with sage on deck surgery in live town actions. |

## Current Live Truth

### 1. Deterministic deck cycling is already real

Status: `live`

Current runtime:

- combat uses draw pile, hand, and discard pile
- the discard pile reshuffles into draw when draw runs out
- the full hand discards at end of turn

Source:

- `src/combat/combat-engine-turns.ts`

Why this matters:

- this is the most important deckbuilder foundation
- we do not need to redesign the card-rotation model before working on rewards and upgrades

### 2. Reward screens already shape direction, but not cleanly enough

Status: `partial`

Current runtime:

- rewards already bias toward class path preference
- rewards are role-aware
- rewards can offer:
  - a primary engine-oriented card
  - a support or tech card
  - an upgrade replacement
  - equipment
  - progression or boon choices

Source:

- `src/rewards/reward-engine-builder.ts`

What is good:

- rewards are not pure random-card vending
- primary-tree reinforcement exists
- support and tech roles are already recognized

What is still off:

- reward screens still do too much vertical growth through `_plus` replacement offers
- reward boons remain fairly generic and stat-heavy
- reward logic does not yet clearly separate:
  - "what enters the deck"
  - from "what becomes exceptional later"
- rewards do not yet use enough upcoming miniboss or boss ask logic when offering answer tools

Design conclusion:

- reward screens are close to the desired role, but they should skew more toward direction, answer, and consistency
- towns should carry more of the reinforcement burden

### 3. Tree specialization framework is stronger than content follow-through

Status: `partial`

Current runtime:

- specialization metadata exists
- reward routing can prefer primary trees and support trees
- splash-role metadata exists

Source:

- `src/rewards/reward-engine-archetypes.ts`
- `src/rewards/reward-engine-builder.ts`
- `src/character/class-registry.ts`

What is good:

- the systemic bias toward one primary tree plus support already exists

What is still off:

- some content pools still allow too much off-plan card growth
- support splash and off-tree damage are not yet consistently distinguished at the content layer
- gambler and transform systems can still undermine specialization too easily

Design conclusion:

- the specialization scaffold is no longer the main blocker
- content and town systems are the bigger gap now

### 4. Blacksmith is still narrower than the full intended model, but it is cleaner now

Status: `partial`

Current runtime:

- blacksmith currently offers card evolutions
- blacksmith now also offers `_plus` refinements for eligible cards
- evolving a card replaces it in-place and keeps deck size stable

Source:

- `src/items/item-town-deck-services.ts`

What is good:

- this matches the desired "small number of important cards get better" direction
- evolution is already doing the most valuable part of the job

What is still off:

- the runtime blacksmith still does not offer the full slot-based generic-upgrade layer described in `VENDOR_DESIGN.md`
- upgrade-slot logic described in the docs is not currently the main town-facing reality
- the intended tension between:
  - evolve now
  - or generically reinforce now
  is now present in a lighter form, but not at full Monster Train-style depth

Design conclusion:

- either the blacksmith needs real generic upgrades in runtime
- or the docs need to be narrowed so evolution is the explicit primary service and generic upgrades live elsewhere

### 5. Sage purge is healthy, and transform is narrower now

Status: `partial`

Current runtime:

- sage offers:
  - identify evolution paths
  - purge one card with escalating cost
  - transform one card into a random same-tier card

Source:

- `src/items/item-town-deck-services.ts`

What is good:

- purge is doing exactly what a deckbuilder needs
- identify supports the evolution loop well

What is still off:

- transform is now much more coherent than before, but it is still a generic substitution tool rather than a deeply authored strategic service
- transform still lacks explicit player-facing lane language like:
  - reinforce lane
  - pivot lane
  - answer-tech search

Design conclusion:

- purge should stay central
- transform should become narrower and more intentional:
  - same tier plus same role
  - or same tier plus same class tree family
  - or explicitly "pivot transform" with a stronger warning and different pricing

### 6. Quartermaster no longer duplicates deck-surgery identity in live town actions

Status: `resolved`

Current runtime:

- quartermaster no longer exposes deck-surgery actions in the live town action list

Source:

- `src/town/service-registry.ts`

What is good:

- town roles are clearer
- sage now cleanly owns deck surgery
- quartermaster is back to supply and field-prep duties

Design conclusion:

- keep it this way unless we later add a truly different quartermaster-specific deck interaction

### 7. Merchant systems are strong, but card reinforcement is weaker than item reinforcement

Status: `partial`

Current runtime:

- town and vendor systems already have deep economy logic
- refresh, stash planning, socket commissions, equipment replacement, and runeword support are all substantial

Source:

- `src/items/item-town-actions.ts`
- `src/items/item-system-choice.ts`
- `src/items/item-town-vendor*.ts`

What is good:

- the item side already has strong strategic identity
- vendor planning and replacement pressure feel meaningfully deckbuilder-adjacent at the run level

What is still off:

- item reinforcement is more mature than card reinforcement
- towns still risk feeling more like item-planning hubs than engine-reinforcement hubs
- that can pull attention away from the deck as the main strategic object

Design conclusion:

- we do not need less item depth
- we need card reinforcement systems to catch up so the deck stays central

### 8. Gambler is still too unconstrained

Status: `off-model`

Current runtime:

- gambler buys can add random cards by broad tier buckets
- silver and gold outcomes can inject off-tree cards fairly freely

Source:

- `src/items/item-town-deck-services.ts`

What is good:

- gambler should remain the high-variance seam
- it is healthy to have one system that can occasionally create wild pivots

What is still off:

- the current card outcomes are mostly tier-based, not role- or specialization-aware
- gambler can add clutter faster than it creates interesting strategic temptation
- this works against the "one engine plus light splash" rule too often

Design conclusion:

- gambler should become more legible as one of:
  - risky reinforcement
  - risky pivot
  - risky answer-tech
- not just broad random card injection

## The Most Important Mismatches

These are the three biggest mismatches between the current runtime and the desired model.

### 1. Reward screens still carry too much reinforcement work

We want:

- rewards to decide what the deck is trying to do

Right now:

- rewards also do a meaningful amount of vertical strengthening through `_plus` upgrades

That is not wrong, but it muddies the system.

### 2. Blacksmith and sage do not yet form one clean reinforcement loop

We want:

- blacksmith = sharpen a plan
- sage = clean a plan

Right now:

- blacksmith mostly evolves
- sage purges well
- sage transform is too noisy
- quartermaster also cuts cards

The loop is useful, but it is not yet cleanly legible.

### 3. Gambler and transform can still undermine specialization too easily

We want:

- specialization to be the normal winning path
- utility splash to be clever support

Right now:

- transform and gambler can still produce too much off-plan clutter without enough strategic framing

## Recommended Implementation Order

### Pass 1. Lock the town reinforcement contract

Decide and document one clean split:

- blacksmith: evolution plus intentional reinforcement
- sage: purge, identify, and constrained transform
- quartermaster: either lose deck surgery or become explicitly a one-time emergency field service

This is the most important clarity pass.

### Pass 2. Move reward screens further toward direction, answers, and consistency

Adjust rewards so they more often:

- seed engine
- reinforce engine identity
- offer answer tools
- offer consistency tools

And less often:

- act as the main vertical power source

### Pass 3. Narrow transform and gambler around specialization rules

Transform should become more coherent.

Gambler should become more intentional:

- support risky pivots
- support niche answer-tech
- occasionally high-roll power

But not just spray random off-plan deck clutter.

### Pass 4. Decide where generic upgrades actually live

We should choose one of two paths:

1. implement real blacksmith generic upgrades in runtime
2. or narrow the target model and explicitly say:
   - evolution is the main town reinforcement path
   - `_plus` rewards are the secondary generic-upgrade path

Either can work, but the hybrid is currently muddy.

## Acceptance Criteria For The Next Runtime Pass

We should consider this area healthier when:

- rewards mostly decide deck direction, not just raw vertical growth
- blacksmith, sage, and any remaining deck-surgery service each have one clear job
- a specialized deck is harder to derail accidentally through transform or gambler noise
- towns feel like places where we sharpen a plan, not just buy stats or chaos
- deck coherence explains more wins and losses than generic reward inflation does

## Current Recommendation

Do not start with boss balance here.

Start with the deck-shaping contract:

1. blacksmith
2. sage
3. quartermaster overlap
4. gambler
5. reward-screen vertical-growth share

That is the shortest path to making Rouge feel more like a true deckbuilder while preserving the Diablo II class fantasy layer.
