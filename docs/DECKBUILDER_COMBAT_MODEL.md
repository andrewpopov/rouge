# Deckbuilder Combat Model

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document for the target gameplay spine: deck rotation, hand rules, combo structure, reward randomness, and how D2 flavor should sit on top of deckbuilder gameplay.
- Use `DECKBUILDER_PROGRESSION_AUDIT.md` for the live runtime gaps against this target model.
- Use `OPTIMIZED_DECK_PROFILE.md` for the target late-game deck shape and the intended build journey from starter shell to finished deck.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for class-specific deck and skill guidance.
- Use `SKILL_ACTION_SURFACE_SYNTHESIS.md` for deciding which benchmark-derived mechanics belong on fixed skills versus deck cards.
- Use `SKILL_TAXONOMY.md` for the canonical fixed-skill families and slot roles.
- Use `D2_SPECIALIZATION_MODEL.md` for one-tree specialization and utility-splash rules.
- Use `COMBAT_DECISION_DESIGN.md` for turn-to-turn hand and enemy-intent design rules.
- Use `COMBAT_FOUNDATION.md` for current combat runtime truth.

## Purpose

Rouge should be a real roguelite deckbuilder first, with Diablo II class fantasy layered on top.

That means:

- the main strategy is deck construction
- the main tactical puzzle is hand sequencing against visible intent
- reward randomness shapes the run
- draw randomness shapes each fight
- deterministic deck rotation makes the system readable and learnable

Rouge should not feel like "Diablo II with cards."
It should feel like a deckbuilder with D2-flavored classes, lanes, and boss-prep problems.

## Core Thesis

Use these references for the gameplay spine:

- _Slay the Spire_
- _Monster Train_

Use Diablo II for:

- class identity
- three-tree build structure
- primary specialization plus light utility splash
- repeated-run matchup preparation
- soft-counter planning

The intended result is:

- D2 gives the build fantasy
- deckbuilders give the gameplay

## Reference Model Split

Rouge should not borrow the same things from _Slay the Spire_ and _Monster Train_.

They are good at different layers.

### What we take from Slay the Spire

Primary source:

- Anthony Giovannetti's GDC talk and slides on balance and iteration

Key takeaways for Rouge:

- combat should be driven by hand tension, not just card quality
- enemy intent must be readable before the player commits
- energy should force tradeoffs inside a hand
- every card should have a place, but nothing should become so universally correct that the run always solves the same way

Rouge implication:

- _Slay the Spire_ should be the main reference for turn structure
- if we are deciding how hand, draw, energy, blocking, and sequencing should feel, _Slay the Spire_ is the better north star

### What we take from Monster Train

Primary sources:

- official Monster Train site and DLC pages

Key takeaways for Rouge:

- the run gets a lot of strategy from combining a primary lane with a supporting lane
- merchant and upgrade structure can be a major source of run identity
- strong runs are often built around one high-synergy package rather than evenly strong generic cards
- the game adds strategic depth through route choices, upgrade timing, and higher-level build shaping, not only hand sequencing

Rouge implication:

- _Monster Train_ should be the main reference for run-level upgrade structure
- if we are deciding how evolutions, merchants, upgrade timing, and engine reinforcement should work, _Monster Train_ is the better north star

### What we take from Diablo II

Diablo II should stay responsible for:

- class fantasy
- three-tree identity
- specialization pressure
- utility splash
- repeat-run matchup preparation

Rouge implication:

- D2 is the thematic and build-structure skin
- it should not override the fact that Rouge is a deckbuilder in play

## The Hybrid We Actually Want

The clean version is:

- _Slay the Spire_ for combat turns
- _Monster Train_ for upgrade and engine shaping
- Diablo II for class identity and matchup-prep structure

That means Rouge should feel like:

- **STS in combat**
- **MT in upgrade and reinforcement pressure**
- **D2 in class fantasy and specialization**

## Combat And Progression Must Coexist

Rouge should not treat combat strategy and deck progression as separate systems.

They should reinforce each other on three different layers:

### Combat layer: _Slay the Spire_

- hand quality matters because energy is scarce
- enemy intent is readable before the player commits
- draw order changes the tactical problem
- the question each turn is "which line matters most right now?"

### Progression layer: _Monster Train_

- the run becomes powerful by repeatedly sharpening a small number of important cards or units
- upgrades are a strategic resource, not just a stat bonus
- route choices and merchant timing shape whether an engine actually comes online
- a run can look average in raw card count but still be powerful because its best pieces are heavily reinforced

### Identity layer: Diablo II

- the class gives the run three recognizable directions
- deep investment into one lane should outperform shallow spread
- light off-tree utility splash is healthy
- repeated losses should teach the player what counter tech or utility splash to plan earlier next time

The design consequence is:

- Rouge should not copy only one of these models
- the best run should feel tactically like _Slay the Spire_, structurally like _Monster Train_, and thematically like Diablo II

## Current Live Truth

These points are already true in the runtime today:

- combat uses a draw pile, hand, and discard pile
- when the draw pile is empty, the discard pile is reshuffled into a new draw pile
- the player draws back up toward hand size each turn
- the entire hand is discarded at end of turn

Live implementation reference:

- `src/combat/combat-engine-turns.ts`
- `drawCards(...)` reshuffles discard into draw when needed
- `discardHand(...)` moves the whole hand into discard at end of turn

So the deterministic deck-cycle foundation is already present.

## Target Player Experience

We want a run to feel like this:

### Early run

- the player is reading what the run offers
- starter cards hint at possible engines
- the first few rewards suggest one or two viable lanes

### Mid run

- the player is no longer building a generic class pile
- they are building one real engine
- the deck is getting tighter, cleaner, and more synergistic

### Late run

- the player knows what the deck does
- bosses and minibosses test whether the deck has the right answers
- victories feel piloted, not merely stat-inflated

### After a loss

- the player can explain what was missing
- the next run can prepare for that ask earlier

## Non-Negotiable Gameplay Pillars

### 1. Deterministic deck rotation

The deck cycle should be legible.

Rules:

- cards are drawn from the draw pile
- played or discarded cards go to discard
- when draw is empty, reshuffle discard into draw
- no hidden refresh or random replacement layer beyond draw effects and authored card text

Why:

- players can plan around reshuffles
- combo density matters
- the deck becomes something the player can learn and pilot

### 2. Reward randomness defines the run

The player should not be able to force the same final deck every run.

Rules:

- reward availability should strongly influence which engine is realistic
- vendors and upgrades should reinforce available lanes, not erase run identity
- the strongest decks are assembled from what the run offered well, not from a static solved script

### 3. Combo-first deck construction

The deck should be built from relationships between cards, not just isolated card quality.

Rouge decks should rely on:

- setup
- payoff
- answers
- consistency
- salvage
- scaling

More specifically:

- setup cards should make later turns better
- payoff cards should need support
- consistency cards should improve rotation and combo reliability
- utility splash cards should solve problems the primary engine does not

## What Combo Means In Rouge

"Combo" should not mean only one thing.

Rouge should support several healthy combo shapes:

### Sequence combo

- cards get better because of order
- example: setup first, then payoff; block first, then counterattack; first-spell bonuses; trap arm then detonate

### Density combo

- the deck gets stronger because enough cards from the same engine show up often
- example: fire deck that reliably finds burn starters and burn payoff in one cycle

### Upgrade combo

- a small number of heavily reinforced cards carry the run
- this is where _Monster Train_ is especially useful as a reference

### Counter combo

- the deck contains a main engine plus a few support cards that solve a known boss or miniboss ask
- example: anti-burn, anti-backline, anti-summon, guard break, cleanse

### Salvage combo

- awkward hands still produce a useful line because the deck has redraw, filter, conditional energy, retain-like setup, or emergency defense

Rouge does not need to revolve around:

- literal infinite loops
- only two-card A+B combos
- one-turn kill assumptions

The better target is:

- decks whose cards become much stronger together than apart

### 4. One main engine, one light splash

This is the D2 contribution to deckbuilding structure.

Strong runs should usually show:

- one primary tree / engine
- one lighter support package
- little off-tree damage
- meaningful off-tree utility

The one routine partial exception is Sorceress, where limited dual-element damage tech can be acceptable as matchup coverage.

### 5. Readable tactical variation

The tactical puzzle should come from:

- draw order
- enemy intent
- sequencing constraints
- board state

The tactical puzzle should not come from:

- hidden enemy behavior
- arbitrary immunity walls
- flat stat checks with no decision texture

## The Deck Contract

The player deck is the main strategic object in Rouge combat.

It should contain:

- core engine cards
- utility cards
- answers to specific asks
- consistency tools
- a small number of finishers or major payoffs

It should not become:

- a pile of generic rate cards
- a giant deck that wins through raw value inflation
- a stack of individually strong but unconnected effects

### Desired deck states

Good late-run decks should generally be:

- tighter
- more upgraded or evolved
- more internally coherent
- more capable of repeating their good turns

Weak decks should fail because:

- they are unfocused
- they never found or reinforced a real engine
- they drafted too much clutter
- they skipped needed utility or matchup answers

## Card Role Model

Rouge cards should usually belong to one of these roles:

### Engine

- defines what the deck is trying to do repeatedly
- examples: trap core, fire-burn core, summon core, attack-chain core

### Enabler

- turns on engine cards or payoff windows
- examples: mark, trap seed, first-spell bonus, corpse setup, stance prep

### Payoff

- cashes in earlier setup
- should feel strong because the deck made it possible

### Consistency

- draw, filter, retain-like setup, tutoring, cheap cycle, recursion where appropriate
- should make the engine happen more often, not just add free power

### Answer

- block, cleanse, anti-guard, target reach, summon clear, anti-backline, anti-burn
- these make boss and miniboss prep meaningful

### Salvage

- rescues awkward hands
- turns near-miss draws into playable turns

### Scaling

- makes later turns stronger if the player survives and sequences well

## What Upgrades And Evolutions Are For

The upgrade system should serve deck strategy, not just number growth.

### The intended split

This is the upgrade model we should aim for:

- _Slay the Spire_-style rewards determine what enters the deck
- _Monster Train_-style upgrade points determine what becomes exceptional
- D2-style specialization determines which engine deserves that investment

Put more concretely:

- reward screens decide what the deck is trying to do
- town services decide which parts of that plan become reliable
- specialization decides what deserves repeated reinforcement
- combat proves whether the deck can actually cycle into that plan under pressure

### Reward screens

Reward screens should mostly do one of three things:

- seed an engine
- reinforce an engine
- offer consistency or answer tools

They should usually not be the main place where a run gets vertically stronger.

Their main job is direction and composition.

### Evolutions

Card evolution should be the primary vertical-growth path for core class cards.

Desired role:

- convert starter or early engine cards into stronger versions
- keep deck size stable
- reward committing to a tree
- make the core engine sharper instead of wider

This is the most direct point where Rouge should borrow from _Monster Train_:

- a few important cards getting much better matters more than many average cards getting slightly better

### Generic upgrades

Generic upgrades should be secondary reinforcement.

Desired role:

- improve reliability
- reward keeping a core card
- support a chosen engine

Not desired:

- replacing the need for engine identity
- becoming the main reason a build wins

The ideal use is:

- improve combo density
- lower friction
- make existing good lines happen more often

### Merchant and town services

Town services should move closer to a _Monster Train_ role than a generic RPG shop role.

Desired role:

- reinforce the current engine
- sharpen key cards
- improve consistency
- present meaningful opportunity cost against other pathing or economy choices

This means:

- blacksmith and sage services should matter a lot
- run strategy should include planning when to evolve, purge, or reinforce the deck
- towns should not mostly feel like stat vending

### Purges and deck control

_Slay the Spire_ is still the better reference for one critical truth:

- adding the wrong card should hurt
- removing the wrong card should hurt
- a cleaner deck should usually draw its important lines more often

So Rouge should keep purge, transform, and selective skip pressure as first-class deckbuilder tools even while borrowing merchant reinforcement from _Monster Train_.

### Purges and transforms

These are essential deckbuilder tools, not optional cleanup.

Desired role:

- remove dead starter cards
- cut off-lane clutter
- trade breadth for consistency

## Class Flavor Contract

Classes should feel different because:

- they pursue different engine families
- they use different kinds of setup and payoff
- their splash utilities solve different problems

Classes should not mostly differ by:

- flat damage coefficients
- minor stat shifts
- cosmetic card text over identical tactical roles

## Encounter Contract

### Battle

- expressive
- mostly generous
- lets the player enjoy the deck

### Elite

- resource tax and pacing check
- not the main wipe source

### Miniboss

- the mid-run exam
- exposes missing answers before bosses do

### Boss

- the act-defining exam
- tests consistency, answers, and sequencing over multiple cycles

## What A Successful Build Arc Looks Like

### Act I

- identify likely engine directions
- start cutting obvious filler
- pick early answer tools that keep future routes open

### Early Act II

- commit to one main direction
- begin evolving or upgrading the core line
- stop taking broad off-plan damage unless the run truly forces it

### Acts II-III

- increase combo density
- add consistency
- add one or two matchup answers
- improve deck cleanliness

### Acts IV-V

- finish the engine
- solve the late-run asks
- prove that the deck can cycle into its good turns reliably

## Design Consequences

This model implies:

- starter decks should preview engines, not just pad the deck
- low-tier cards need more enablers and consistency tools
- reward construction should think in role terms, not only class-pool terms
- upgrade services should sharpen a deck's existing plan more often than they invent a new one
- bosses and minibosses must ask questions that utility splash cards can answer
- balance work should care about deck coherence, not only win rate

## External References

These were the main external references for this model:

- [Benchmark action-surface source index](/Users/andrew/proj/rouge/docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md)
- [Slay the Spire GDC talk transcript notes](https://lilys.ai/en/notes/138321)
- [Official Monster Train site](https://www.themonstertrain.com/story)
- [Monster Train on Steam](https://store.steampowered.com/app/1102190/Monster_Train/)

## Success Conditions

We are on the right path when:

- good runs are clearly one engine plus utility support
- draw order creates meaningful tactical variation
- reshuffle timing matters
- rewards feel like build decisions instead of generic upgrades
- failed runs teach the player what answer or commitment was missing

We are off path when:

- the best strategy is generic goodstuff
- the player often plays every important card in hand with no tradeoff
- off-tree damage piles win too reliably
- upgrades matter more than deck plan
- losses feel like raw stat failures instead of learnable preparation failures
