# Balance Plan

_Snapshot: 2026-04-05_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document as the operating plan for balance work: what we are optimizing for, which scenarios matter, what to tune first, and what counts as done.
- Use `BALANCE_EXECUTION_CHECKLIST.md` for the short working checklist.
- Use `BALANCE_LANE_BOARD.md` for the current class-and-lane snapshot from the latest committed ledger.
- Use `BALANCE_MATRIX_SPEC.md` for the shape of the periodic complete recalibration matrix in the training-aware runtime.
- Use `DECKBUILDER_COMBAT_MODEL.md` for the target gameplay spine.
- Use `OPTIMIZED_DECK_PROFILE.md` for target endgame deck shape and build-journey expectations.
- Use `COMBAT_DECISION_DESIGN.md` and `COMBAT_DECISION_AUDIT.md` for turn-quality goals and verb gaps.
- Use `D2_SPECIALIZATION_MODEL.md` for specialization and utility-splash rules.
- Use `artifacts/balance/latest.md`, `artifacts/balance/committed-ledger.json`, `artifacts/balance/committed-ledger.md`, and `artifacts/balance/committed-history.md` for the latest sampled state.

## Purpose

Rouge needs a balance plan that answers four questions clearly:

- what kind of game feel we are actually balancing toward
- which datasets we trust for which decisions
- what order we should tune systems and classes in
- what evidence counts as success

This document is that plan.

## Target Feel

Rouge is a deckbuilder first.

The actual gameplay model should feel closer to:

- _Slay the Spire_ in combat turns
- _Monster Train_ in reinforcement and run-level shaping

Diablo II is the flavor and build-identity layer:

- class fantasy
- three-tree structure
- strong primary specialization
- light utility splash
- repeat-run matchup preparation

That means we are **not** balancing toward:

- a literal D2 skill tree simulator
- broad goodstuff piles
- stat-check combat with weak deckbuilding
- generic every-fight lethality

We **are** balancing toward:

- one strong primary engine
- one light utility or counter splash
- deterministic deck cycling
- meaningful hand tension
- reward randomness that changes the run
- bosses and minibosses as the real exams

## Core Balance Pillars

### 1. Deck quality is the main strategic layer

Winning should come from:

- building a coherent deck
- reinforcing the right cards
- trimming weak rotation later
- bringing the right utility or counters

Winning should not mostly come from:

- drawing generic high-rate cards
- keeping a bloated deck that happens to clear
- raw stat inflation with weak build identity

### 2. Reinforcement is mandatory, purge is optimization

Strong decks should become strong mainly through:

- `refine`
- `evolve`
- reward-side upgrades

`purge` is important, but it is cleanup:

- useful for reducing filler
- useful for fixing rotation late
- not the main power source

### 3. Commitment should happen early, but not instantly

Healthy run arc:

- Act I: explore lane candidates
- early Act II: commit
- Acts II-III: reinforce and tighten
- Acts IV-V: solve asks and prove the build

If every run hard-locks in the opening few rewards, branchability is too low.
If strong runs are still unfocused by Act II, branchability is too high or reward shaping is too soft.

### 4. Bosses and minibosses are the real exams

Normal battles and regular elites can stay generous if:

- turns still feel meaningful
- the deck gets to do cool things
- card draw and sequencing still matter

The real structural checks should come from:

- minibosses exposing weak preparation
- bosses testing whether the deck has answers

### 5. Losses must teach something

Good loss:

- “I needed better backline reach.”
- “I needed anti-burn.”
- “I committed too late.”
- “I over-kept off-tree damage.”

Bad loss:

- “I guess the numbers were too small.”
- “I drew bad.”
- “This lane just never comes together.”

## What We Trust

Different balance tools answer different questions.

### Most trustworthy for lane viability and class parity

- the committed ledger built from latest known row results
- focused committed-lane campaign reruns that update those rows
- occasional full campaign aggressive and balanced matrices

These are where we should answer:

- can this lane clear
- how often does it clear
- does the weak-policy version have a fair floor
- where do failures cluster

Operational rule:

- use the ledger as the normal decision surface
- rerun only the smallest relevant row set after a fix
- regenerate the ledger
- use a full `420`-run matrix only when we need a broad recalibration or suspect the ledger is hiding a systemic regression

### Most trustworthy for encounter and curve tuning

- progression pressure calibration
- committed boss and miniboss probe suites

These are where we should answer:

- are battles too soft
- are minibosses exposing bad prep
- is one boss still carrying too much of the game

### Most trustworthy for turn-quality signals

- decision-tension metrics from progression simulation
- focused Act I-II smokes after card or reward changes

These are where we should answer:

- are opening hands too dumpable
- are turns too solved
- are decks too clunky

## Current Working Read

As of April 5, 2026:

- the committed ledger is the active lane-health snapshot:
  - [artifacts/balance/committed-ledger.json](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.json)
  - [artifacts/balance/committed-ledger.md](/Users/andrew/proj/rouge/artifacts/balance/committed-ledger.md)
- the append-only history view now sits next to it:
  - [artifacts/balance/committed-history.json](/Users/andrew/proj/rouge/artifacts/balance/committed-history.json)
  - [artifacts/balance/committed-history.md](/Users/andrew/proj/rouge/artifacts/balance/committed-history.md)
- it currently holds `420` latest rows at `417 / 420` clears (`99.3%`), backed by `996` historical row versions
- the active rescue queue for the tracked row set is empty
- most of the meaningful remaining work is now deck-quality cleanup rather than lane survival
- payoff monoculture is now one of the main next cleanup problems
- full committed matrices still matter as periodic recalibration, but the ledger remains the live operating surface
- because the runtime now carries explicit training loadouts, equipped skill bars, and normalized row analysis fields like final checkpoint power and last-boss power ratio, reruns of the same row can now be compared directly instead of inferred from deep nested summaries
- the next complete recalibration matrix should still be read as a post-training baseline rather than casually mixed with older pre-training broad samples

Large matrices still matter, but now mainly as recalibration snapshots. They should not replace the row-level loop.

## The Main Balance Questions

Every serious pass should try to answer these in order.

### 1. Does the lane form correctly?

Questions:

- does the deck commit by early Act II
- does it keep one dominant tree
- is off-tree damage low
- is the splash actually utility-first

If not, do not tune boss numbers yet.

### 2. Does the deck become powerful in the right way?

Questions:

- is power coming from reinforcement
- are centerpiece cards being upgraded and evolved
- is purge helping rotation instead of replacing progression
- does the final deck look intentional

If not, fix progression and reward routing before encounter tuning.

### 3. Do the combats ask real questions?

Questions:

- can the player dump the opening hand too often
- are there meaningful unplayed options
- are turns too solved
- are boss and miniboss turns readable and demanding

If not, fix card roles, enemy intent, and hand pressure before final parity calls.

### 4. Is the encounter curve healthy?

Questions:

- are battles expressive but not decisive
- are minibosses the right early warning checks
- are bosses too concentrated in one act
- are balanced runs unfairly dead on arrival

### 5. Is class parity acceptable?

Only after the first four are in decent shape should we make stronger calls on:

- class ranking
- lane ranking
- final clear-rate targets

### 6. Are we learning efficiently?

Questions:

- did we rerun only the rows the fix could actually affect
- did the ledger move in the direction we expected
- are we avoiding broad reruns when a smaller row update would answer the question

If not, the workflow is wasting time even if the balance direction is correct.

## Balance Scorecard

### Primary metrics

These are the metrics we should optimize around first.

- committed-lane clear rate
- committed-by-checkpoint rate
- lane integrity
- final target-shape fit
- starter-shell cleanup
- refinement and evolution counts
- off-tree damage count
- off-tree utility count
- failure location clustering
- miniboss and boss clear or failure distribution

### Diagnostic metrics

These are useful guardrails, not the main goal by themselves.

- opening-hand full-spend rate
- average early unspent energy
- average early meaningful unplayed rate
- average early candidate count
- average early meaningful candidate count
- average early decision score spread
- early close-decision rate
- average early end-turn regret

### Interpretation rule

If primary metrics and diagnostic metrics disagree:

- trust primary metrics for build viability
- use diagnostics to explain why the turn quality feels wrong

## Current Target Bands

These are target **plan** values, not claims about the live build today.

### Committed lane viability

For flagship lanes:

- `Aggressive` clear rate target: `0.70 - 0.95`
- `Balanced` clear rate target: `0.45 - 0.80`

For secondary or hybrid lanes:

- `Aggressive` clear rate target: `0.55 - 0.85`
- `Balanced` clear rate target: `0.30 - 0.65`

### Commitment and identity

- committed by first safe zone of Act II on most strong runs
- final lane integrity target: `>= 0.65`
- off-tree damage should be rare outside deliberate hybrid cases
- off-tree utility should be present, but light

### Deck quality

- target-shape fit on strong runs: `>= 0.80`
- starter-shell cards remaining by late game: low and deliberate
- reinforcement counts should clearly exceed purge counts as the main source of strength

### Turn quality

Healthy tension should look like:

- opening full-spend is not routine
- boss full-spend is near zero
- early turns often contain a meaningful unplayed option
- turns are neither trivially solved nor routinely dead

### Encounter structure

- battles: expressive and mostly favorable
- minibosses: the first real build checks
- bosses: decisive, but not all concentrated into one single spike

## Tuning Order

This is the recommended order for future balance work.

### Phase 1: Lane integrity and deck shape

Goal:

- every named lane forms correctly
- reinforcement beats filler
- utility splash stays light

Typical fixes:

- reward routing
- starter shell composition
- refine/evolve weighting
- duplicate caps
- off-tree routing clamps

### Phase 2: Weak-policy floor

Goal:

- `Balanced` should be worse than `Aggressive`
- it should not be a dead-on-arrival mode for healthy lanes

Typical fixes:

- Act I and Act II starter floor
- answer density
- support and salvage access
- weak-policy opening reward shape

### Phase 3: Boss and miniboss asks

Goal:

- minibosses expose missing prep
- bosses test real coverage and sequencing

Typical fixes:

- boss turn scripting
- miniboss complication packages
- soft-counter asks by act
- support utility availability

### Phase 4: Branchability and run diversity

Goal:

- reward randomness matters
- different seeds can create different strong decks
- not every class collapses into one lane

Typical fixes:

- seed-aware reward selection
- early reward pool breadth
- tier-2 engine diversity
- hybrid scoring guardrails

### Phase 5: Final parity and pacing

Goal:

- class and lane results land inside target bands
- failure locations feel fair
- endgame decks look intentional

Typical fixes:

- card numbers
- boss pacing
- late-run reinforcement ceilings
- lane-specific finisher tuning

## Scenario Set We Should Keep Running

### 1. Committed lane campaign matrix

Use for:

- lane viability
- class parity
- strong vs average lane health

Baseline command shape:

```bash
node ./scripts/run-balance-orchestrator.js \
  --suite committed_archetype_campaign \
  --class amazon,assassin,barbarian,druid,necromancer,paladin,sorceress \
  --policy aggressive,balanced \
  --seeds 6 \
  --concurrency 4
```

This is the closest thing we currently have to the core balance board.

### 2. Natural convergence matrix

Use for:

- branchability
- reward-driven run diversity
- “what do runs become without forcing?”

Run this after major reward-pool or starter-deck changes.

### 3. Progression pressure calibration

Use for:

- battle/miniboss/boss curve checks
- power-model sanity
- act-by-act ask coverage

### 4. Focused lane repair smokes

Use for:

- one class
- one lane
- one or two seeds
- one targeted question

These should happen before relaunching a big matrix after a localized fix.

### 5. Full current-build aggressive campaign matrix

Use for:

- “what optimized late-game decks do we actually reach now?”
- seed-by-seed endgame deck inventory
- deck-profile proof after content changes

## Class Priority Queue

This should be updated as batches finish, but the working order right now is:

1. Druid weak-policy floor
2. Necromancer lane reliability and lane spread
3. Assassin trap late-deck identity cleanup
4. Amazon lane spread and weaker secondary-lane support
5. Balanced-floor review across all classes once the current committed-lane batch finishes

## What Not To Do

- Do not tune bosses first when a lane still forms incorrectly.
- Do not use purge to fake progression.
- Do not read one-seed smokes as class-parity proof.
- Do not treat synthetic isolated combat calibration as the final truth about run health.
- Do not call a lane healthy if it only clears as a bloated payoff pile.
- Do not force every class into the same hand texture; class feel can vary.

## Exit Criteria For A Lane

A lane is ready to stop receiving active rescue tuning when:

- it forms naturally or under commitment without weird routing tricks
- it reaches its target clear band
- its late deck matches the intended optimized profile
- off-tree damage stays constrained
- the splash remains utility-first
- failures teach something actionable

## Exit Criteria For The Whole Balance Pass

This balance phase is in a good place when:

- most flagship aggressive lanes are in band
- balanced lanes are weaker but not collapsing unfairly
- minibosses and bosses are the real exams
- reward randomness still produces multiple viable run shapes
- endgame decks look intentional and rewarding to build

That is the point where we should stop broad systemic rework and move to narrower content or numbers tuning.
