# Combat Decision Design

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document for target-state combat feel: hand tension, energy pressure, skill-card design, enemy intent design, and encounter-role expectations.
- Use `COMBAT_DECISION_AUDIT.md` for the concrete live-build audit and prioritized gap list.
- Use `COMBAT_FOUNDATION.md` for live combat truth.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for class and card-surface guidance.
- Use `MONSTER-IMPLEMENTATION-GUIDE.md` for monster-family implementation backlog.
- Use `STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md` for sequencing and prioritization.

## Purpose

Rouge combat should feel strategic because the player is asked to make a real decision inside an imperfect hand against readable enemy pressure.

This document exists to keep us from solving that problem with flat stat inflation, bland starter cards, or enemies that only hit harder.

## The Reference We Actually Want

The useful lesson from _Slay the Spire_ is not "copy `3` energy and `5` cards."

The useful lesson is:

- enemy intent is readable before the player commits
- energy is tight enough that a hand contains competing good options
- taking damage matters later, so short-term greed has consequences
- card value is contextual, not absolute
- broken turns are exciting because they are earned rather than baseline

Reference reading:

- [PC Gamer interview with Anthony Giovannetti](https://www.pcgamer.com/slay-the-spire-designer-discusses-new-characters-and-card-game-inspirations/)
- [GDC Vault: Slay the Spire - Metrics Driven Design and Balance](https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics)
- [Transcript notes for the GDC talk](https://lilys.ai/en/notes/138321)

## Rouge Combat Thesis

Rouge should produce turns that feel like:

- "Do I spend energy surviving, pushing damage, or setting up next turn?"
- "Which card matters most against this visible intent?"
- "Can I afford to leave value in hand because the wrong play now loses later?"

Rouge should avoid turns that feel like:

- "I can just play every card that matters."
- "The enemy attack was random, so the right play was unknowable."
- "My cards are interchangeable; any order works."
- "This fight is only hard because the numbers are larger."

## Current Live Gap

The live combat baseline still refills the hand to the class target each turn and starts the hero with full energy.
Because class-derived shells can currently start as high as `4` energy on a `5`-card opening hand, some new-character turns allow "play almost everything" sequencing.

That weakens three things we want Rouge to be good at:

- card sequencing
- defense versus setup tradeoffs
- class identity through hand texture

## Core Rules

### 1. Visible intent is non-negotiable

Enemy actions must stay readable before the player acts.

That means:

- the player should know which enemy is attacking, fortifying, debuffing, summoning, or charging
- the player should know whether a turn is a race turn, block turn, or setup window
- surprise should come from encounter composition and turn arcs, not hidden math

### 2. Energy should force choices inside a good hand

The best baseline turns are not weak hands.
They are hands with multiple reasonable plays and not enough energy to do all of them.

Target feeling:

- most turns present `1-2` meaningful cards that remain unplayed
- the unplayed cards feel like a real loss, not dead clutter
- extra draw creates more choice pressure before it creates more raw throughput

### 3. Baseline power should not remove early tension

Opening turns should not be solved by default generosity.

Preferred tuning order:

1. clearer intent and enemy asks
2. more interesting opening draw texture
3. more conditional or stateful starter cards
4. only then base-energy adjustment

### 4. Skills and attacks should ask different questions

Flat damage and flat block are allowed, but they cannot dominate the ecosystem.

The player should regularly see cards and enemy intents that ask:

- can you answer a telegraphed spike
- can you punish a setup turn
- can you stabilize an awkward hand
- can you cash in a payoff without dying first
- can you attack the right target instead of the closest target

## Skill Design Rules

### Good Rouge skill cards do one of five jobs

1. `Immediate answer`
- solves the current turn
- block, cleanse, interrupt, target access, anti-Guard, anti-summon

2. `Setup`
- weaker now, stronger later
- mark, trap, stance, burn seed, delayed draw, next-turn energy

3. `Payoff`
- rewards prior setup or specific board states
- heavy burst, multi-hit finisher, consume-mark hit, chill payoff, corpse payoff

4. `Conversion`
- turns one resource into another
- card draw into cheaper play, Guard into damage, spare energy into retained value

5. `Salvage`
- rescues bad hands
- cheap cycle, emergency block, conditional energy, redraw, targeted exhaust

### Skill design heuristics

- every archetype should have a mix of answer, setup, payoff, and salvage cards
- `0`-cost and energy-positive cards should usually be conditional, tactical, or temporary
- draw cards should create better choices, not only higher throughput
- starter cards should already preview the class decision space instead of being seven near-identical fillers
- a card is more interesting when its value changes based on visible intent, enemy state, or what you already played this turn

### Skill red flags

- "always play this first" cards with no board-state dependency
- cards that are just rate-efficient enough to be correct in almost every hand
- too many generic attacks that differ only by number
- too many defense cards that only say "gain block"
- setup cards that do not pay off fast enough to justify the turn they cost

## Enemy Intent Design Rules

### Good enemy attacks do more than hit harder

Enemy intents should create a tactical question, not only a damage check.

Useful intent families:

1. `Spike`
- big telegraphed attack
- asks for block, debuff, kill pressure, or timing discipline

2. `Tax`
- drain, weak, discard pressure, card-cost pressure, anti-draw pressure
- asks whether the player must prevent the effect or play through it

3. `Setup`
- guard, fortify, summon, ritual, charge, support positioning
- creates a punish window if the player can respond

4. `Protection`
- shields a backliner, taunts, redirects, or buffs another enemy
- asks for target priority and sequencing

5. `Disruption`
- reorders priorities, punishes greed, or interferes with the player's normal engine
- should be visible early enough to plan around

### Enemy-pattern heuristics

- every miniboss and boss should have a readable turn arc, not a random move bag
- enemy support units should matter because they distort the puzzle, not only because they add HP to the room
- when an enemy applies a debuff, that debuff should change the player's next decision in a visible way
- the best enemy turns create windows: "deal with this now or pay later"
- the player should lose because they answered the wrong question, not because the encounter hid the question

### Enemy-pattern red flags

- repeated single-target attacks with only damage scaling changed
- damage spikes with no visible setup
- buffs that do not change target priority or turn planning
- bosses that are only hard because they have too much life
- enemies that invalidate entire card types without telegraph or counterplay

## Encounter Roles

### Battle

- expressive, readable, generally generous
- lets the player test their build and enjoy synergies
- should still reward correct target priority and sequencing

### Elite

- stronger flow check
- should tax resources and punish autopilot
- should not be the primary wipe source for most runs

### Miniboss

- the mid-run exam
- should expose deck weaknesses before the act boss does
- should ask one clear question and one secondary complication

### Boss

- the act-defining exam
- should require multiple cycles
- should test planning, adaptation, and consistency more than burst alone

## Design Consequences For Rouge

### We need more interesting player cards

That means:

- more conditional starters
- more stateful attack cards
- more "good now vs better later" choices
- more salvage tools that keep bad hands playable
- fewer generically efficient class cards that are correct in every deck

### We need more interesting enemy attacks

That means:

- more telegraphed spike turns
- more punishable setup turns
- more support and protection patterns
- more debuffs that alter next-turn play meaningfully
- more miniboss patterns that test a specific deck weakness

## Next Design Passes

1. Audit starter decks for "play everything" turns and reduce generic filler.
2. Rebuild low-tier skill cards around answer, setup, payoff, and salvage roles.
3. Audit enemy intent sets so every act has:
- readable spike turns
- punishable setup turns
- at least one support/protection pattern that changes target priority
4. Reframe minibosses as the main non-boss exams.
5. Use balance sims to check:
- how often the player spends the entire opening hand
- average unspent energy by act and class
- how often visible intent creates a real attack-vs-block tradeoff
- whether fights are being won by sequencing or only by inflated stats

## Decision Rule

When we are unsure whether to add raw numbers or a better decision, prefer the better decision.

Rouge combat gets better when:

- the hand contains competing good plays
- the enemy clearly asks a question
- the player can answer that question in multiple class-specific ways

not when both sides simply hit harder.
