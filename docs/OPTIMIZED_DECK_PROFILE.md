# Optimized Deck Profile

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `DECKBUILDER_COMBAT_MODEL.md` for the overall gameplay spine.
- Use this document to define what a strong endgame Rouge deck should look like, how it should get there, and how we should judge whether the climb was fun and rewarding.
- Use `DECKBUILDER_PROGRESSION_AUDIT.md` for the current runtime gaps against this target.
- Use `CLASS_IDENTITY_PATHS.md` and `D2_SPECIALIZATION_MODEL.md` for class lane and specialization rules.

## Purpose

Rouge should be able to answer three related questions:

- what does an optimized late-game deck look like
- how did it become that deck from the starting shell
- was the path to that deck interesting, tense, and rewarding

This document is the source of truth for those answers.

## Core Principle

An optimized Rouge deck is not just a deck that clears.

It is a deck that:

- has one clear primary engine
- has a light utility or counter splash
- has a small number of reinforced centerpiece cards
- cycles into its good turns reliably
- has answers that reflect what the run learned it needed

And the path to it should feel earned:

- exploratory in Act I
- committed by early Act II
- sharpened in Acts II-III
- tested and solved in Acts IV-V

## What We Are Optimizing For

We are not trying to optimize for:

- the largest raw pile of stats
- the most individually powerful cards
- the most random high-roll outcome
- a generic goodstuff deck that wins without a real plan

We are trying to optimize for:

- deck coherence
- engine reliability
- matchup coverage
- reinforcement quality
- a satisfying climb from weak starting shell to clear build identity

## Optimized Late-Game Deck Shape

Most successful late-game decks should look like:

- one primary engine
- one light utility splash
- `2-4` centerpiece cards that have been evolved, refined, or otherwise clearly reinforced
- enough consistency and salvage that the engine can show up on time
- enough answers that bosses and minibosses test the deck honestly instead of exposing a missing basic tool

### Desired composition by role

The exact numbers can vary by lane, but an optimized late-game deck should usually contain:

- `3-5` engine or setup cards
- `2-4` payoff or finisher cards
- `2-4` support or consistency cards
- `1-3` answer cards
- `1-2` salvage cards
- very few pure filler cards left from the starting shell

This is not a rigid formula.
It is a shape check.

### Desired specialization shape

For most classes:

- primary tree is clearly dominant
- off-tree damage is rare
- off-tree utility is present and justified

Expected exception:

- Sorceress may occasionally support limited dual-element damage tech as deliberate matchup coverage

## Target Deck Size Bands

The goal is not "smallest possible deck" by default.
The goal is "small enough to cycle the important lines reliably."

Suggested target bands:

- pressure or tempo decks: `9-13` cards
- setup or payoff spell decks: `10-14` cards
- summon or scaling decks: `11-15` cards
- hybrid control decks: `10-14` cards

Warning signs:

- below target band:
  - deck may be over-thinned and lose flexibility
- above target band:
  - deck may be carrying too much filler, too many pivots, or too much unfocused value

## Optimized Deck Families

Rouge should support several strong endgame deck families.

### Pressure decks

Examples:

- Bow Volley
- Combat Zeal
- Combat Pressure

What they look like:

- low dead-turn rate
- stable damage delivery
- a few support cards that preserve momentum
- one or two reinforced attacks that define the kill pattern

What they still need:

- anti-spike defense
- telegraph respect
- boss closing reliability

### Setup-payoff decks

Examples:

- Fire Burst
- Bone Burst
- Trap Field

What they look like:

- setup cards are clearly worth drawing
- payoff cards are meaningfully stronger because setup exists
- consistency cards help connect setup to payoff inside one or two deck cycles

What they still need:

- enough defense or stall to survive weak setup turns
- enough draw quality to avoid "all setup, no payoff" or the reverse

### Scaling or engine decks

Examples:

- Summoner Engine
- Summon Swarm
- Aura Judgment

What they look like:

- the deck gets stronger across multiple turns or cycles
- support cards keep the engine alive
- the deck wins because its engine stays online, not because one raw stat card carried everything

What they still need:

- early stabilization
- anti-disruption tools
- a clear endgame closing pattern

### Control or answer-heavy decks

Examples:

- Cold Control
- Curse Control
- Shadow Tempo

What they look like:

- enemy pressure becomes manageable
- control cards buy time for a real kill plan
- utility splash is especially important

What they still need:

- proof that control turns into a win condition
- enough payoff that the run does not just stall politely

## What An Earned Build Journey Looks Like

### Act I: signal reading

We want:

- the run to expose one or two plausible lanes
- early rewards to create tension between options
- the player to start reading what the run supports

We do not want:

- a solved deck by the end of the first zone
- or no direction at all

### Early Act II: visible commitment

We want:

- one primary lane becoming obvious
- first serious card clean-up starting to matter
- first evolution or refinement decisions starting to feel important

By this point, a strong run should stop looking like a generic class pile.

### Acts II-III: sharpening

We want:

- key cards getting evolved or refined
- weak shell cards getting removed
- answers and consistency being added on purpose
- route and town decisions reinforcing the same plan

This should be the most satisfying deck-construction phase in the run.

### Acts IV-V: solving

We want:

- the deck to be mostly known
- late decisions to be about polish and matchup coverage
- bosses to test whether the build actually works when cycled under pressure

Late-game success should feel like the deck was assembled and piloted, not just numerically inflated.

## Failure Modes During The Climb

These are healthy failure modes because they teach the player something:

- over-drafting and bloating the deck
- committing too late
- taking too much off-tree damage
- skipping consistency or salvage
- failing to tech for a known boss or miniboss ask
- over-investing in economy or safety while never finishing the engine

These are weaker failure modes because they teach less:

- raw unavoidable stat checks
- hidden boss asks
- high-roll dependency without meaningful planning response

## Fun And Rewarding Build Criteria

A run should feel fun and rewarding to build when:

- early rewards create genuine lane tension
- towns meaningfully sharpen the deck
- purges and refinements feel like strong, readable decisions
- the player can feel the deck getting cleaner and more reliable
- boss losses point to a clear lesson
- a later successful run can be explained by a better plan, not just better luck

### The climb should feel rewarding

Good signs:

- the player remembers specific draft or town decisions that mattered
- one or two cards became "the run's cards"
- the final deck feels recognizably different from the start

Bad signs:

- the deck wins mostly because every card is generically fine
- the player cannot explain why the winning deck worked
- the path felt like passive accumulation instead of active shaping

## Reporting Questions We Should Be Able To Answer

For every serious balance or progression report, Rouge should eventually be able to answer:

- what was the deck's primary engine
- what was its utility splash
- what were its centerpiece cards
- how many filler cards remained
- when did the run commit
- when did the run get cleaner
- what answers did it carry
- what answers did it miss
- did the final deck match the intended optimized shape for its lane

## Target Report Shape

Future simulator or dashboard reporting should include three layers:

### 1. Endgame deck profile

- final deck size
- primary tree share
- off-tree utility share
- off-tree damage share
- number of evolved or refined centerpiece cards
- role mix:
  - engine
  - payoff
  - support
  - answer
  - salvage

### 2. Build journey profile

- act of first commitment
- act of first major reinforcement
- purge count by act
- evolution or refinement count by act
- major drift events
- recovery from drift, if any

### 3. Satisfaction profile

This is partly subjective, but the system can still look for strong proxies:

- meaningful reward choices
- meaningful town choices
- whether the deck became cleaner over time
- whether failed runs exposed missing counters or missing coherence

## Acceptance Criteria

We should consider the deckbuilder model healthier when:

- optimized decks are clearly identifiable by lane
- strong runs usually end with one engine plus support, not soup
- the path from starter deck to late-game deck is visibly legible
- reinforcement and purge decisions matter as much as raw reward luck
- late-game decks feel earned, not handed over
- we can point to specific cards and choices that made the deck work

## Current Recommendation

Use this document as the standard for future reporting work.

The next implementation step after this doc should be:

1. add endgame deck profile reporting
2. add build journey reporting
3. then compare real runs against these target shapes instead of judging only by clear rate
