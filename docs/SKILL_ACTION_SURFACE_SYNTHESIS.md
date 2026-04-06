# Skill Action Surface Synthesis

_Snapshot: 2026-04-05_

## Purpose

This document turns the benchmark research into Rouge-specific design guidance.

The main question is not:

- what cool mechanics exist in other deckbuilders

It is:

- which mechanic families belong on Rouge's fixed skill bar
- which mechanic families belong on Rouge's deck cards
- which mechanic families should stay out of Rouge entirely

This is a synthesis doc, not an implementation plan.

Use it together with:

- [CARD_ACTION_SURFACE_REVIEW.md](/Users/andrew/proj/rouge/docs/CARD_ACTION_SURFACE_REVIEW.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md)
- [docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md](/Users/andrew/proj/rouge/docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md)

## Reference Priority

This synthesis now treats two games as Rouge's main design anchors:

- `Slay the Spire`
- `Monster Train`

Use them for first-order decisions.

Use these as secondary calibration only:

- `Across the Obelisk`
- `Wildfrost`
- `Vault of the Void`

The practical split is:

- borrow card-state manipulation, temporary combat mutation, and next-card rule shaping from _Slay the Spire_
- borrow persistent engine state, trigger language, and package readability from _Monster Train_
- use the other games only to sanity-check party support, timing clarity, and status readability

## Starting Constraint

Rouge already has a declared split:

- fixed skill bar for always-available class expression
- deck for tactical sequencing and build identity

That means many excellent benchmark mechanics should **not** go onto skills even if they are strategically valuable.

If a mechanic is exciting mainly because:

- it interacts with draw order
- it interacts with hand retention
- it changes where cards go
- it changes other cards temporarily

then it probably belongs on deck cards, not on fixed skills.

## Benchmark Learnings

### Slay the Spire

Take away:

- card state during combat is a major strategic layer
- temporary upgrades and cost changes make turns feel alive
- lifecycle mechanics like `Exhaust`, `Retain`, and `Innate` create timing tension

Skill implication for Rouge:

- use StS as Rouge's primary reference for what should stay on deck cards rather than fixed skills
- when a skill interacts with cards, prefer StS-style "arm a context" over "become a second hand"

### Monster Train

Take away:

- explicit package identity is good
- trigger vocabularies make packages feel real
- behavior-grafting upgrades are more exciting than number-only upgrades
- once-per-battle and persistent-card rules are powerful

Skill implication for Rouge:

- use Monster Train as Rouge's primary reference for skill-trigger language, persistent engine state, and package-defining support skills
- prefer MT-style readable engines over diffuse passive soup

### Across the Obelisk

Take away:

- party support can be strategic
- statuses can be shared team engines
- support timing and ally amplification matter in multi-actor combat

Skill implication for Rouge:

- use Across the Obelisk as a secondary check when designing mercenary-facing and party-facing skills
- keep its influence narrower than StS and Monster Train

### Wildfrost

Take away:

- a small number of strong tactical keywords can create a lot of depth
- timing and reaction rules matter
- upgrades are exciting when they change behavior

Skill implication for Rouge:

- use Wildfrost as a secondary readability reference for compact tactical keywords and reaction timing

### Vault of the Void

Take away:

- lifecycle vocabulary itself is strategic depth
- deck surgery and customization can be part of the game’s strategy
- class-owned combat rules can stay bespoke

Skill implication for Rouge:

- use Vault as a secondary reference for class-owned combat states and behavior-changing upgrades

## Core Split Rouge Should Keep

### Fixed skills should own

- class identity
- class-owned combat states
- party commands
- ally amplification
- summon or mercenary trigger arming
- tactical emergency buttons
- once-per-battle rule changes

### Deck cards should own

- draw tension
- card lifecycle
- discard and recover loops
- temporary upgrades and temporary cost changes
- generated cards
- copy effects
- kill-check mechanics
- next-card and next-skill combo scaffolding

### Hybrid space

Some mechanic families can exist on both:

- class resources
- summon triggers
- mark or target designation
- status amplification
- delayed cash-out windows

But the fixed skill version should establish a combat rule, while the deck-card version should exploit it.

This is the main combined lesson from the two primary anchors:

- _Slay the Spire_ says the deck should own most of the card-state complexity
- _Monster Train_ says reliable non-card systems should make package identity and engine state legible

## What To Apply To Rouge Skills

The fixed skill bar should become more strategically interesting in six ways.

### 1. Class-owned combat state skills

Skills should establish bespoke class states that change how deck cards are evaluated.

Examples of the pattern:

- enter a mastery state
- arm a shadow state
- prime an elemental attunement
- start a warcry window
- sanctify the party for a short duration

These are not copies of StS stances or Defect orbs.

They are Rouge versions of the same lesson:

- cards are more interesting when the player can first create a context for them

### 2. Party-command and ally-amplification skills

This is a Rouge-native need first, and a secondary lesson from Across the Obelisk.

Skills should be able to:

- direct mercenary focus
- improve a mercenary or minion trigger window
- apply party-wide protection or status conversion
- mark a target so the whole deck or party can cash it out
- grant one short tactical rule to the whole team

These make the skill bar feel like leadership and class command, not just bigger card buttons.

### 3. Tactical answer skills

Skills should sometimes exist to answer a boss ask directly:

- anti-fire-pressure answer
- anti-summon answer
- telegraph-respect answer
- backline disruption answer
- emergency life stabilization

These should not dominate the deck.

They should function as reliable pressure valves that let the deck stay more specialized.

### 4. Once-per-battle or charge-based skills

This is mainly a Monster Train lesson, with Wildfrost and Vault only acting as secondary checks.

Some skills should feel like:

- a once-per-battle commitment
- a limited-charge tactical reset
- a powerful engine starter that must be timed well

This gives fixed skills meaningful pacing instead of just cooldown cycling.

### 5. Trigger-arming skills

Skills should be allowed to set short-lived rule hooks such as:

- your next attack does something extra
- your next summon gains a bonus
- your next status application spreads
- your next mercenary hit cashes out a mark
- your next fire spell converts defense into pressure

This is a very safe way to deepen skills without turning them into deck replacements.

### 6. Information and intent-management skills

Rouge already has visible intent, so we do not need to import `Sight` literally.

But we can still learn the broader lesson:

- information can be a combat resource

Skill examples in this family:

- expose hidden escort pressure
- preview or alter one future enemy action
- improve target selection for mercenary or minions
- reveal which enemy is the real payoff target this turn

## What Not To Put On Fixed Skills

These are high-value mechanics, but they belong on deck cards instead:

- `Exhaust` and exhaust-recursion loops
- `Retain`
- `Ethereal`
- `Innate`
- temporary hand-wide upgrade effects
- temporary hand-wide cost reduction
- `Scry`
- discard-as-cost loops
- recover-from-discard loops
- create temporary cards in hand
- copy a chosen card next turn
- `Fatal`

These mechanics are exciting precisely because they interact with hand flow and deck state.

If they move to fixed skills, they lose much of what makes them interesting.

## Best Skill Patterns For Rouge

These patterns should be read through the primary-anchor lens:

- _Slay the Spire_ for "set up a context that cards cash out"
- _Monster Train_ for "make the engine state obvious and reusable"

If Rouge wants more strategic skills without undermining deck play, the best patterns are:

### Pattern A: establish a state, let cards exploit it

Skill:

- establish a short combat state

Cards:

- become stronger or behave differently inside that state

This is the cleanest translation of the benchmark learnings.

### Pattern B: command the party, let cards cash it out

Skill:

- direct the mercenary or empower the next ally action

Cards:

- exploit that party state through marks, summons, support tags, or payoff hits

### Pattern C: create one answer window

Skill:

- open a brief defensive or disruption window

Cards:

- convert that survival window into pressure

### Pattern D: arm a trigger package

Skill:

- arm a trigger like summon, slay, strike, or status spread

Cards:

- repeatedly exploit that trigger

This is the most Monster Train-like pattern and probably one of the best fits for Rouge.

## Skill Upgrade Lessons

The benchmarks are unusually consistent here:

- the most interesting upgrades add behavior
- the least interesting upgrades only increase numbers

So Rouge skill upgrades should more often change:

- timing
- target pattern
- trigger scope
- ally coverage
- rule text

and less often only change:

- raw damage
- raw guard
- raw heal

That does not mean no numeric scaling.

It means upgraded skills should more often feel like:

- now this also marks
- now this affects the party
- now this arms your next two summons
- now this becomes once-per-battle but much stronger
- now this changes from self-defense to team command

## A Rouge-Specific Target

The fixed skill bar should eventually feel like:

- the place where class identity becomes reliable
- the place where the player creates a combat state
- the place where party command lives
- the place where boss-answer reliability lives

The deck should still feel like:

- the place where the player sequences
- the place where they exploit state
- the place where card-state mechanics live
- the place where the run’s main engine is piloted

That separation is important.

If skills become too expressive in the same way cards are expressive, the deck stops mattering enough.

## Proposed Apply / Avoid / Study Later Split

### Apply to skills later

- bespoke class combat states
- party command
- ally-amplification rules
- trigger-arming rules
- tactical answer buttons
- limited-charge or once-per-battle skill windows
- information and target-management support

### Apply to cards later

- lifecycle mechanics
- temporary upgrades
- temporary cost mutation
- generated temporary cards
- discard and recover loops
- kill-check mechanics
- next-card and next-skill combo rules

### Avoid as literal imports

- Monster Train floor topology
- Wildfrost exact board format
- direct copies of Watcher stances
- direct copies of Defect orb geometry
- Vault sideboarding as-is

### Study later before deciding

- whether Rouge needs a special pile like exhaust or expel
- whether generated cards should be temporary-only or persist in some cases
- whether skill upgrades should use keyword grafting like charms or void stones
- whether mercenary and minion triggers should share one vocabulary or separate ones

## Bottom Line

The best benchmark lesson is not:

- add more mechanics

It is:

- put the right mechanic on the right surface

For Rouge, that means:

- skills should establish identity, states, party command, and tactical answer windows
- cards should own most hand-state and deck-state complexity
- upgrades should add behavior more often
- party support should become a real strategic layer

That is the path that keeps Rouge a deckbuilder while still making the skill bar much more exciting.
