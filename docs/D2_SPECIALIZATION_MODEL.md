# D2 Specialization Model

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document for Rouge's Diablo II-inspired specialization rules, behavior pie, and boss-counter design.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for the broader deck and skill loop.
- Use `MONSTER-IMPLEMENTATION-GUIDE.md` together with this document for boss and miniboss asks.

## Purpose

Rouge should mirror the structure of Diablo II buildcraft without copying Diablo II literally.

The target feel is:

- each class has `3` real skill lanes
- strong runs specialize into `1` primary lane
- light off-tree investment is mostly utility, counters, and recovery
- reward randomness helps decide which lane becomes the run's main commitment
- repeated runs teach matchup preparation, not just raw stat chasing

This is the model behind the runtime specialization state, reward weighting, simulator metrics, and future starter-card and boss-skill rewrites.

## External D2 References

These public build overviews were used as the structural inspiration for the lane map, not as a literal 1:1 mechanical spec:

- [Sorceress Class and Builds - Icy Veins](https://www.icy-veins.com/d2/sorceress-class-and-builds)
- [Druid Class and Builds - Icy Veins](https://www.icy-veins.com/d2/druid-class-and-builds)
- [Necromancer Class and Builds - Icy Veins](https://www.icy-veins.com/d2/necromancer-class-and-builds)
- [Summoner Necromancer Build - Icy Veins](https://www.icy-veins.com/d2/summoner-necromancer-build)
- [Amazon builds overview - Diablo Tavern](https://diablotavern.com/d2/classes/amazon/builds/)
- [Best Paladin Builds - Diablo Tavern](https://diablotavern.com/d2/classes/paladin/paladin-best-builds/)
- [Assassin Class and Builds - Icy Veins](https://www.icy-veins.com/d2/assassin-class-and-builds)
- [Barbarian Class and Builds - Icy Veins](https://www.icy-veins.com/d2/barbarian-class-and-builds)
- [Paladin Class and Builds - Icy Veins](https://www.icy-veins.com/d2/paladin-class-and-builds)

The shared D2 lesson is consistent:

- heavy investment into one tree creates the real payoff
- off-tree investment is usually small and purposeful
- some classes use limited hybridization as utility or immunity tech
- repeated runs teach encounter prep and counter coverage

## Core Specialization Rule

Rouge should support exactly one dominant lane per successful run.

The run can still branch, but the branching should look like:

- primary lane for throughput and payoff
- utility splash for defense, draw, disruption, resist tech, or matchup answers
- very limited secondary damage only when the class explicitly supports it

The important anti-goal is broad off-tree goodstuff.

If a run ends with strong damage coming from multiple unrelated trees by default, the build model is too loose.

## Behavior Pie

This is the shared verb catalog for player cards, boss skills, and miniboss asks.

- `pressure`
  - direct damage, multi-hit, cleave, piercing, delayed burst
- `mitigation`
  - guard, resist, redirect, intercept, anti-spike defense
- `setup`
  - mark, trap, charge, ritual, delayed effect, summon
- `payoff`
  - consume marks, detonate statuses, corpse cash-ins, burst windows
- `salvage`
  - redraw, hand smoothing, emergency block, conditional energy
- `conversion`
  - guard to damage, health to power, energy to future value
- `tax`
  - weaken, draw tax, energy tax, healing denial, engine pressure
- `disruption`
  - interrupt, silence, delay, target forcing, anti-setup pressure
- `protection`
  - escort, taunt, backline shielding, ally guard
- `scaling`
  - repeated triggers, stored power, escalating engines

Card definitions should declare:

- `behaviorTags`
- `roleTag`
- `counterTags`
- `splashRole`

Enemy intents and encounter asks should declare:

- `intentRole`
- `askTags`
- `counterTags`

This gives us a shared language for both player-build design and encounter design.

## Specialization Stages

Rouge should make specialization visible in both rewards and balance reporting.

### Exploratory

- tree ranks `0-1`
- broad class weighting
- the run is still discovering its lane

### Candidate

- tree rank `2`
- tier-2 rewards unlock for that tree
- next miniboss or boss reward should guarantee one on-tree offer

### Primary

- tree rank `4+`
- at least `2` ranks ahead of the other trees
- sets `primaryTreeId`
- reward weighting should strongly favor the primary lane
- off-tree damage should drop sharply

### Mastery

- tree rank `6+`
- highest payoff cards and capstone evolutions come online
- the run should feel finished rather than exploratory

## Reward Weighting Rule

After specialization, reward routing should look like this:

- exploratory: broad class-weighted offers
- candidate: moderate primary-tree bias
- primary: `70%` primary lane, `20%` approved utility splash, `10%` pivot or neutral
- mastery: `80%` primary lane, `15%` approved utility splash, `5%` pivot or neutral

Utility splash means:

- defense
- draw smoothing
- disruption
- recovery
- resist tech
- matchup tools

Not:

- routine secondary damage packages for every class

The one intentional exception is Sorceress, which can support limited dual-element damage as counter tech.

## Class Lane Map

Each class should keep `3` supported lanes.

### Amazon

- `Bow Volley`
  - D2 mirror: Bowazon
  - primary theme: ranged pressure and setup payoff
- `Javelin Storm`
  - D2 mirror: Javazon
  - primary theme: burst pressure and scaling throws
- `Passive Tempo`
  - D2 mirror: passive utility splash around a bow or javelin core
  - should stay a hybrid utility lane, not a generic stat soup lane

### Assassin

- `Martial Burst`
  - D2 mirror: Martial Arts
- `Trap Field`
  - D2 mirror: Trapsin
- `Shadow Tempo`
  - D2 mirror: martial or trap core with Shadow utility splash

### Barbarian

- `Combat Pressure`
  - D2 mirror: Frenzy, Berserk, Whirlwind style combat core
- `Warcry Tempo`
  - D2 mirror: Singer / War Cry
- `Mastery Frontline`
  - D2 mirror: combat core plus mastery reinforcement

### Druid

- `Elemental Storm`
  - D2 mirror: Wind / Elemental
- `Shifter Bruiser`
  - D2 mirror: Fury / Wereform
- `Summoner Engine`
  - D2 mirror: Summoner

### Necromancer

- `Bone Burst`
  - D2 mirror: Bone caster
- `Summon Swarm`
  - D2 mirror: Summoner
- `Curse Control`
  - D2 mirror: utility-heavy hybrid lane
  - curses should mostly amplify a bone or summon core rather than replace it as a full damage lane

### Paladin

- `Combat Zeal`
  - D2 mirror: Zealot / Smiter
- `Aura Judgment`
  - D2 mirror: holy-caster or offensive-aura core
- `Sanctuary Anchor`
  - D2 mirror: aura-driven support/combat hybrid

### Sorceress

- `Cold Control`
  - D2 mirror: Cold Sorceress
- `Fire Burst`
  - D2 mirror: Fire Sorceress
- `Lightning Tempo`
  - D2 mirror: Lightning Sorceress

Sorceress is the class where limited dual-element damage tech is intentionally allowed as part of the lane model.

## Early Card Direction

Starter decks and tier-1 and tier-2 pools should be rewritten around roles, not just rates.

Each class should start with:

- `2-3` identity cards
- `1-2` answer cards
- `1-2` setup cards
- `1` salvage card
- `1` payoff or conversion preview

Rules for the first pass:

- reduce generic cheap damage fillers
- remove excess cheap heal-plus-guard safety cards
- make at least one early card per tree care about visible enemy intent or board state
- keep at least one utility splash card per class valuable even after specialization
- keep zero-cost and energy-positive effects mostly in salvage or conditional roles, not generic throughput

## Boss And Miniboss Counter Model

Rouge should use soft counters, not Diablo II immunities copied literally.

That means:

- heavy resistance or pressure themes
- telegraphed punish windows
- support shells and escort problems
- asks that reward earlier prep

Act asks should trend like this:

- Act I: poison sustain, attrition discipline
- Act II: durability, guard break, positional pressure
- Act III: backline reach, lightning mitigation, support disruption
- Act IV: fire pressure, telegraph respect, secondary answers to fire-heavy threats
- Act V: summon handling, disruption recovery, freeze or control resilience

Boss and miniboss design rules:

- every miniboss gets one main ask and one complication
- every boss gets one repeatable setup or punish cycle and one counter-planning ask
- off-tree utility cards should exist to answer those asks

Repeated runs should teach:

- "I need anti-burn"
- "I need more backline reach"
- "I need a summon answer"

Not:

- "I just need more raw stats"

## Balance And Simulator Expectations

The simulator and balance reports should answer these questions directly:

- did the run lock a primary tree by the first safe zone of Act II
- how much off-tree utility did the run carry
- how much off-tree damage slipped through
- what counter tags did the run cover
- which counter tags were missing when it failed
- how often did the opening hand fully spend
- how much early energy went unused
- how often did the player keep meaningful cards unplayed on turns `1-3`

The desired successful-run shape is:

- one dominant tree by mid-Act II
- one light utility splash
- off-tree damage as the exception
- boss prep that emerges from reward randomness and repeated-run learning

## Practical Design Rule

When we design a new card or boss skill, we should answer four things before we name it:

1. What behavior tags does it express?
2. Is it primary-lane payoff, utility splash, or hybrid-only?
3. What boss or miniboss ask does it answer or create?
4. Which D2-style lane does it reinforce?

Flavor comes after the behavior is coherent.
