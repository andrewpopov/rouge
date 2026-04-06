# Class Card Execution Plan

_Snapshot: 2026-04-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document as the operating plan for class-card expansion work.
- Use [CLASS_CARD_AUTHORING_MATRIX.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_AUTHORING_MATRIX.md) for the per-class target shape, lane diagnosis, and final `50`-card package goals.
- Use [CARD_ECONOMY_SPEC.md](/Users/andrew/proj/rouge/docs/CARD_ECONOMY_SPEC.md) for the shared foundation-card rules and reward-surface constraints.
- Use [BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md) and [BALANCE_EXECUTION_CHECKLIST.md](/Users/andrew/proj/rouge/docs/BALANCE_EXECUTION_CHECKLIST.md) for validation policy after each content batch.
- Use [COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md) and [DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md) for turn-quality guardrails.

## Purpose

The class authoring matrix answers what healthy class pools should eventually look like.

This document answers the execution questions:

1. what order we should implement class-card work in
2. what the first batch for each class should contain
3. when shared foundation cards should enter the plan
4. what validation gates must pass before we move on

This is an implementation-order document, not a balance snapshot and not a claim that the live build already contains these packages.

## Operating Rules

- Expand class depth before shared breadth.
- Ship `8-12` card batches, not `33`-card moonshots.
- Use each batch to make a lane play better, not just to increase total count.
- Fix metadata drift before claiming reward-routing or lane-health improvements.
- Preserve tree identity. Hybrid cards should create controlled splashes, not erase the three-tree model.
- Do not let foundation cards become the normal reward backbone before class pools are deep enough to carry runs on their own.

## Current Baseline

These counts are the current live class-card definitions in the authored class-card files, not starter-deck reference counts.

| Class | Live cards | Primary first problem | Wave 1 batch |
|---|---:|---|---:|
| Amazon | `23` | Javelin lane is too thin and Passive is doing too much generic smoothing | `9` |
| Assassin | `17` | Trap lane cannot sustain a full run and Shadow lacks a real closer | `9` |
| Barbarian | `21` | Too many safe-rate cards and too little setup or salvage texture | `8` |
| Druid | `17` | Shape Shifting is too thin and Summoning lacks enough board conversion | `10` |
| Necromancer | `17` | Curses are too thin and the class lacks enough deliberate setup | `10` |
| Paladin | `17` | Aura packages need real engines and less safe-rate filler | `8` |
| Sorceress | `17` | Spell-engine texture is too soft and the early shell overuses generic safety | `8` |

## Phase Structure

### Phase 0: Prep And Guardrails

Before the main class wave:

1. Audit all existing class cards for `roleTag`, `rewardRole`, and `splashRole`.
2. Keep the now-fixed metadata surface in [src/content/class-cards-paladin.ts](/Users/andrew/proj/rouge/src/content/class-cards-paladin.ts) and [src/content/class-cards-sorceress.ts](/Users/andrew/proj/rouge/src/content/class-cards-sorceress.ts) explicit as new cards are added.
3. Make sure analysis and reward tooling can still surface:
   - tree mix
   - role mix
   - payoff concentration
   - off-tree splash rate
4. Keep shared foundation-card work limited to starter-shell or fallback support until the first four class waves are stable.

### Phase 1: Lane Rescue Wave

Goal:

- move the weakest or thinnest lane packages from “concept exists” to “real run destination”
- get classes into roughly the `25-32` card range
- improve lane formation before expanding shared pools

Execution order:

1. Druid
2. Necromancer
3. Assassin
4. Amazon

This order follows the current balance pressure and the largest live package gaps.

### Phase 2: Texture And Metadata Wave

Goal:

- deepen classes that already have a viable spine but still feel too samey
- finish metadata cleanup before more reward-routing work
- get classes into roughly the `28-34` card range

Execution order:

1. Barbarian
2. Paladin
3. Sorceress

### Phase 3: Shared Foundation Wave

Goal:

- add the shared `10-15` foundation-card pool without stealing the spotlight from class pools
- use foundation cards for glue, fallback access, and route or vendor texture

Timing rule:

- do not build the full foundation pool first
- start with `4-6` foundation cards only after the Phase 1 classes pass their validation gates
- finish the full `10-15` card pool only after every class has completed at least one authored wave

### Phase 4: Depth To Fifty

Goal:

- move every class from the first stable `25-34` card range toward the full `50`
- add late-payoff, boss-tech, hybrid bridge, and lane-specific rare-equivalent cards
- preserve the STS-like class-first reward model while making each tree feel replayable

## Wave Size Rules

For each class:

- `Wave 1`: `8-12` cards focused on rescuing the weakest lane and adding missing setup or answer pieces
- `Wave 2`: `8-10` cards focused on deepening mid-run decision texture and hybrid bridges
- `Wave 3`: remaining cards needed to reach `50`, focused on late-payoff, rare-equivalent identity, and boss tech

Do not count a card as progress if it is only:

- another safe `damage + guard`
- another filler attack with different numbers
- a duplicate-rate answer that does not change deckbuilding decisions

## Class Order And First Batches

### 1. Druid

Wave 1 batch: `10` cards

- `4` Shape Shifting cards: form entry, form hold, wounded conversion, and a real finisher
- `3` Summoning cards: summon protection, summon reinforcement, and board-to-payoff conversion
- `2` Elemental cards: spell-cycle primer and elemental bridge support
- `1` class-glue salvage card usable in any Druid shell

Gate before moving on:

- Shape Shifting can carry weak-policy floor without hiding behind Elemental payoff cards.
- Summoning decks show a boss plan beyond passive board stall.

### 2. Necromancer

Wave 1 batch: `10` cards

- `3` Curse cards: curse setup, curse retention or propagation, and curse cashout
- `3` Summoning cards: minion protection, reinforcement, and board-conversion payoff
- `2` Poison and Bone cards: prep piece and burst-window payoff
- `1` class-glue salvage card
- `1` boss-answer tech card

Gate before moving on:

- Curse Control can close fights instead of only delaying them.
- Summon runs have a deliberate cashout path and do not rely on slow inevitability alone.

### 3. Assassin

Wave 1 batch: `9` cards

- `4` Trap cards: arm, stall, detonate, and trap reload or sustain
- `2` Shadow cards: hand-smoothing tempo tool and a real closer
- `2` Martial Arts cards: setup-to-cashout bridge and safe aggression piece
- `1` class-glue salvage or answer card

Gate before moving on:

- Trap Field can carry a run through Act II without collapsing into Martial fallback damage.
- Shadow Tempo can actually end fights and is not only medium-value support.

### 4. Amazon

Wave 1 batch: `9` cards

- `4` Javelin cards: priming tool, spike turn payoff, recovery-after-commit card, and wave or boss finisher
- `2` Bow cards: target-selection setup and cadence-preserving answer
- `2` Passive cards: support bridge and precision payoff enabler
- `1` class-glue anti-backline or anti-summon answer

Gate before moving on:

- Javelin Storm is a real destination lane, not a splash package.
- Passive cards support Bow or Javelin plans instead of becoming generic smoothing soup.

### 5. Barbarian

Wave 1 batch: `8` cards

- `2` Warcry cards: setup-to-kill conversion and recovery-support tempo piece
- `2` Masteries cards: weapon-commitment setup and scaling payoff
- `2` Combat Skills cards: attack-timing question and finisher
- `1` class-glue salvage card
- `1` anti-backline or anti-support answer card

Gate before moving on:

- Barbarian turns ask for timing and sequencing, not just rate.
- Warcry support turns can convert into lethal pressure instead of only prolonging the fight.

### 6. Paladin

Metadata note:

- the current `17`-card pool now carries explicit metadata; keep that standard intact as the next batch lands

Wave 1 batch: `8` cards

- `3` Offensive Aura cards: aura engine, aura reinforcement, and attack payoff
- `2` Defensive Aura cards: defense-to-inevitability conversion and anti-burst answer
- `2` Combat cards: zeal-chain bridge and offensive closer
- `1` class-glue tech or recovery card

Gate before moving on:

- reward routing can classify the whole Paladin pool cleanly
- Offensive Aura and Defensive Anchor each have a real engine loop, not just safer numbers

### 7. Sorceress

Metadata note:

- the current `17`-card pool now carries explicit metadata; keep that standard intact as the next batch lands

Wave 1 batch: `8` cards

- `3` Lightning cards: chain engine, draw or energy smoother, and payoff finisher
- `2` Cold cards: denial setup and reliable closer
- `2` Fire cards: ignite-now or explode-later package support
- `1` class-glue salvage or tech card

Gate before moving on:

- Lightning Tempo has a recognizable spell-engine loop
- Fire and Cold both have clearer reasons to exist beyond generic burn or freeze rates

## Shared Foundation Sequencing

Shared foundation cards are still part of the plan, but they should arrive in controlled waves.

### Foundation Batch F1

Timing:

- after Druid, Necromancer, Assassin, and Amazon have completed Wave 1 and passed their gates

Scope:

- `4-6` cards total
- mostly starter-shell or fallback tools

Priority card types:

- one universal salvage card
- one anti-backline or anti-summon answer
- one mercenary-command support card
- one anti-status or anti-burst defense card
- one consistency or project-acceleration card

### Foundation Batch F2

Timing:

- after every class has completed at least one authored wave

Scope:

- grow from `4-6` cards to the full `10-15`

Priority card types:

- vendor and event texture cards
- route-tech cards
- narrow but exciting problem-solver cards
- low-frequency reward fallback cards

Rule:

- foundation cards should make bad or awkward runs less dead; they should not define the majority of winning decks

## Validation Loop

For each class batch:

1. author the smallest coherent batch that can rescue the targeted lane
2. run `1-3` focused smokes for the target lane and at least one neighboring lane
3. inspect final deck shape, tree mix, and role mix
4. rerun the smallest relevant ledger slice
5. regenerate the ledger views
6. only then move to the next class

Use failure language that teaches something:

- lane did not form
- lane formed but lacked a closer
- deck overkept off-tree damage
- deck lacked backline or boss answers

Avoid vague conclusions like:

- numbers too small
- class still weak somehow

## Done Conditions

This execution plan is working if:

- each class reaches a first stable wave with a real secondary-lane destination
- shared foundation cards remain supplemental instead of taking over reward screens
- focused reruns show cleaner lane formation and cleaner final deck identity
- classes begin to approach `50` cards through deliberate package work rather than filler inflation
