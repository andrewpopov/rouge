# Combat Decision Audit

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read this after `COMBAT_DECISION_DESIGN.md`.
- Use this document for the concrete audit of where the live build still falls short on hand tension, skill-card interest, and enemy-intent depth.
- Treat this as a design-facing audit, not current runtime truth beyond the files cited here.

## Purpose

This document answers one question:

Where does Rouge still fail to create interesting tactical decisions even though the outer progression, encounter composition, and balance tooling have gotten much stronger?

## High-Level Conclusion

Rouge's outer combat scaffolding is now ahead of its inner combat verbs.

That means:

- encounter composition is richer than the individual enemy decisions inside those encounters
- archetype planning is richer than the low-tier cards that pilot those archetypes turn to turn
- bosses and minibosses are closer to the target than starter hands and early enemy turns are

The result is a game that often has strong run structure but still too many flat turns.

## What We Audited

We reviewed:

- class starter decks and tier-1 cards in `src/content/class-cards-*.ts`
- hero baseline energy and hand setup in `src/character/class-registry.ts`, `src/content/game-content-mercenaries.ts`, and `src/combat/combat-engine-turns.ts`
- generic enemy intent sets and boss intent sets in `src/content/encounter-registry-enemy-builders.ts`
- elite package profiles in `src/content/encounter-registry-enemy-builders-data.ts`
- miniboss and boss package composition in `src/content/encounter-registry-builders.ts`

## Audit Findings

## 1. Starter decks still over-index on flat one-cost cards

The biggest early-combat problem is not only energy.
It is that too many starter cards are simple one-cost rate cards with shallow context sensitivity.

Common starter patterns across classes:

- `deal damage`
- `deal damage + gain guard`
- `heal + gain guard`
- `draw 1` stapled to a generic support effect

Examples:

- Amazon starter cards lean heavily on simple pressure or safety cards like `Magic Arrow`, `Dodge`, and `Critical Strike` in [src/content/class-cards-amazon.ts](/Users/andrew/proj/rouge/src/content/class-cards-amazon.ts)
- Assassin starts with several cards that mostly read as flat attack or attack-plus-guard in [src/content/class-cards-assassin.ts](/Users/andrew/proj/rouge/src/content/class-cards-assassin.ts)
- Barbarian and Paladin both have multiple tier-1 cards that are mostly "numbers with a small cushion" in [src/content/class-cards-barbarian.ts](/Users/andrew/proj/rouge/src/content/class-cards-barbarian.ts) and [src/content/class-cards-paladin.ts](/Users/andrew/proj/rouge/src/content/class-cards-paladin.ts)

The standouts are the cards that already create a real question:

- Necromancer `Raise Skeleton`
- Druid `Raven`
- Druid `Poison Creeper`
- Amazon `Inner Sight`

Those are closer to the target because they ask the player to choose setup, support, or delayed value instead of only immediate rate.

## 2. Several starter cards are too safety-heavy for Act I tension

Many tier-1 cards include healing or guard in ways that smooth early combat more than they create decisions.

Examples:

- Sorceress `Frozen Armor` is `1` cost for `Heal 10` plus `Gain 6 Guard` in [src/content/class-cards-sorceress.ts](/Users/andrew/proj/rouge/src/content/class-cards-sorceress.ts)
- Assassin `Cloak of Shadows` is `Heal 6` plus `Gain 3 Guard`
- Necromancer `Life Tap` is `Heal 6` plus `Gain 3 Guard`
- Barbarian `Natural Resistance` is `Heal 5` plus `Gain 2 Guard`
- Paladin `Cleansing` is `Heal 5` plus `Gain 2 Guard`
- Druid `Lycanthropy` is `Heal 4` plus `Gain 1 Guard`

One such card in a class can be healthy.
Multiple cheap safety cards in the same starting environment make early bad hands too recoverable and reduce the cost of greedy play.

## 3. Class starters often preview class fantasy, but not class decisions

We already preview class fantasy reasonably well.

Examples:

- Amazon starts with bow, jab, and mercenary-mark cues
- Sorceress starts with fire, ice, and lightning cues
- Necromancer starts with skeletons and bone defense

But too many of those previews do not yet produce distinct tactical questions.

Target:

- the player's first five combats should already teach what kinds of choices this class asks for

Current reality:

- many class starters still teach that the correct answer is "play the best rate card and use the remaining energy on the next safest one"

## 4. The opening-state baseline still allows low-friction turns

The live baseline still combines:

- class-derived `maxEnergy` up to `4` from mana in [src/character/class-registry.ts](/Users/andrew/proj/rouge/src/character/class-registry.ts)
- a default `handSize` of `5` in [src/content/game-content-mercenaries.ts](/Users/andrew/proj/rouge/src/content/game-content-mercenaries.ts)
- turn-start refill to the hand target in [src/combat/combat-engine-turns.ts](/Users/andrew/proj/rouge/src/combat/combat-engine-turns.ts)

That is not automatically wrong.
It becomes a problem because the card pool is still full of low-context one-cost cards.

So the real issue is:

- baseline energy and hand rules are exposing a card-design weakness we can currently feel very clearly

## 5. Generic enemy roles are still too generic

The fallback role intents in [src/content/encounter-registry-enemy-builders.ts](/Users/andrew/proj/rouge/src/content/encounter-registry-enemy-builders.ts) are still dominated by two-step patterns such as:

- support: `heal_ally` or `guard_allies` plus a light attack
- ranged: `attack` or `attack_all`
- brute: `guard` plus `attack` or `sunder_attack`
- raider: `attack`, `attack_and_guard`, or `guard`

These are readable, which is good.
But many of them still do not ask an interesting enough question.

They often test:

- do you have enough damage
- do you have enough guard

They less often test:

- do you interrupt the setup now
- do you kill the support unit before the spike turn
- do you spend this turn stabilizing because a tax effect is coming next

## 6. Elite and miniboss package variety relies more on composition than on enemy verbs

The miniboss and elite package work in [src/content/encounter-registry-builders.ts](/Users/andrew/proj/rouge/src/content/encounter-registry-builders.ts) is good structural progress.

The game now varies:

- escorts
- backlines
- modifiers
- elite combinations
- branch package names and themes

But many fights still end up asking a composition question more than a turn-by-turn behavior question.

In other words:

- the room looks different
- the actual enemy decisions inside the room are still too often "shoot, guard, heal, rush"

That is why the encounter shell feels stronger than the underlying enemy verbs.

## 7. Bosses are better than normal enemies, but still lean too hard on stat-plus-telegraph loops

Bosses are the healthiest part of the current enemy design.
They already use:

- telegraphed charge turns
- summons
- party-wide pressure
- guard and recovery cycles
- typed-damage identity

That is all good.

But even the boss sets in [src/content/encounter-registry-enemy-builders.ts](/Users/andrew/proj/rouge/src/content/encounter-registry-enemy-builders.ts) still lean heavily on:

- `guard_allies`
- `attack_all`
- `heal_and_guard`
- `charge`
- `sunder_attack`

The bosses are asking clearer questions than normal enemies, but they are still often doing so with a limited verb set.

The next step is not "more boss life."
It is "more boss asks."

## 8. We do not yet have enough tax and disruption patterns

The combat design target calls for enemy intent families like:

- spike
- tax
- setup
- protection
- disruption

We already have some spike and setup.
We have some protection through escort and guard logic.

We have much less of:

- real hand-tax pressure
- draw-tax pressure
- sequencing disruption
- punishable support turns that alter the player's next decision

That makes many fights more about raw throughput than about adapting your plan.

## 9. We do not yet have enough salvage cards in low tiers

If bad draws are supposed to be interesting, the player needs real low-tier salvage tools.

Current low-tier cards provide:

- generic healing
- generic guard
- some draw
- some summon setup

We need more cards that specifically rescue awkward hands, for example:

- small redraw or selective cycle
- conditional energy refund
- card-cost conversion
- retain or delayed-value support
- emergency anti-spike tools

Without those, "imperfect draw" becomes either trivial or miserable instead of strategic.

## Priority Problems To Fix

These are the biggest design gaps in order:

1. Starter decks contain too many flat one-cost cards and too many cheap safety cards.
2. Generic enemy roles do not create enough tactical questions.
3. Minibosses are composition-rich but verb-poor.
4. Bosses still need more unique asks instead of more stat reinforcement.
5. The low-tier card pool lacks enough salvage and conversion tools.

## Recommended Next Passes

## Pass 1. Starter deck rewrite

For every class:

- keep `2-3` identity cards
- replace at least `2-3` generic rate cards with answer, setup, payoff, or salvage cards
- reduce cheap heal-plus-guard density
- make at least one starter card care about visible enemy intent or board state

Starter decks should stop feeling like:

- damage card
- safer damage card
- heal card

and start feeling like:

- solve this turn
- set up next turn
- take a greedy line if you think you can afford it

## Pass 2. Low-tier card-role audit

For each class, tier-1 and tier-2 cards should be tagged by role:

- answer
- setup
- payoff
- conversion
- salvage

Then fix any class that is missing one of those roles in the early game.

Current likely gaps:

- Barbarian lacks enough early setup and salvage
- Paladin lacks enough early conditional or stateful offense
- Amazon has identity but still too much flat safety
- Sorceress has element flavor but too much generic sustain smoothing

## Pass 3. Enemy role-library expansion

Add more reusable enemy verbs, especially for non-boss enemies:

- punishable charge or ritual turns
- targeted support shielding
- draw-tax or energy-tax turns
- target-marking turns
- anti-setup disruption
- softer but more frequent support turns that force target-priority changes

Do this before increasing damage further.

## Pass 4. Miniboss design briefs

Every branch miniboss package should answer:

- what is the main question of this fight
- what is the secondary complication
- which deck weakness is being tested
- what visible punish window exists

If a miniboss package cannot answer those questions, it is still mostly a composition package, not a true miniboss exam.

## Pass 5. Boss-intent enrichment

Each act boss should get at least `1-2` more unique patterns that are not just:

- bigger attack
- bigger guard
- bigger heal

Examples of target direction:

- Briar Matron: stronger poison and brood timing puzzle
- Sepulcher Devourer: clearer "protect the mercenary or lose tempo" turns
- Idol Patriarch: more meaningful backline or lightning timing asks
- Cinder Tyrant: clearer telegraph-respect and recovery-window patterning
- Siege Tyrant: more add-management and disruption choices

## Metrics To Add

The current sims are good, but to support this design pass we should add:

- opening-hand full-spend rate by class
- average number of meaningful unplayed cards on turns `1-3`
- average unspent energy on turns `1-3`
- intent-response classification:
  - block turn
  - race turn
  - punish-window turn
  - setup turn
- enemy-verb coverage by encounter kind:
  - battle
  - elite
  - miniboss
  - boss

## Decision Rule

If a card or enemy only changes the number, it should justify why the decision changed too.

Rouge does not need every fight to be lethal.
It does need more fights where:

- the enemy is clearly asking something
- the hand offers multiple real answers
- the player cannot take every answer at once
