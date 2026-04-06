# Druid Lane Packages

_Snapshot: 2026-04-02_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use this document as the package-level design reference for Druid.
- Use `CLASS_IDENTITY_PATHS.md` for the roster-level lane map.
- Use `BALANCE_LANE_BOARD.md` for the live lane-health snapshot.
- Use this document when tuning Druid rewards, starter shell, refinements, evolutions, and boss-readiness support.

## Purpose

This is the first class-level package framework in the Monster Train sense:

- not just "which tree is this lane from"
- but "what exact package is the run trying to assemble"

For Druid, that matters immediately because the original lane board showed Druid as the weakest overall class family, but the focused rescue passes changed that picture:

- `Aggressive / Elemental Storm`: healthy
- `Aggressive / Shifter Bruiser`: playable but weak
- `Aggressive / Summoner Engine`: healthy after focused rescue
- `Balanced / Elemental Storm`: healthy after focused rescue
- `Balanced / Shifter Bruiser`: playable but weak
- `Balanced / Summoner Engine`: healthy after focused rescue

The goal is to make each Druid lane work like a real package:

- an anchor package
- a support package
- a payoff identity
- a reinforcement plan
- a recognizable weak version and strong version

## Druid Strategic Identity

Druid should be the class where the player most clearly chooses between:

- spell package
- bruiser package
- board engine package

That means Druid should not feel like:

- generic mixed-value cards from three trees
- summon cards that stall without ending fights
- elemental cards that wait too long to matter
- shape-shift cards that are honest but too fair

Druid should feel like:

- a class with three genuinely different package families
- one primary package plus a light support splash
- early randomness that points toward one of those packages without solving the run immediately

## Package Design Rules

For Druid specifically:

- `Elemental Storm` is the flagship payoff package.
- `Shifter Bruiser` is the stable floor package.
- `Summoner Engine` is the scaling engine package.

Allowed splash rules:

- `Elemental Storm` may use a light summoning splash for stall or board support.
- `Shifter Bruiser` may use a light summoning splash for sustain or protection.
- `Summoner Engine` may use a light elemental or shape-shift splash only to stabilize setup turns or close fights.

Not allowed:

- summon decks winning mostly as low-quality elemental piles
- elemental decks bloating into generic summon value
- shifter decks becoming "midrange goodstuff with some heals"

## Package 1: Elemental Storm

### Core fantasy

The player survives awkward early turns, then starts converting spell cycles into explosive typed-damage payoff turns.

This should be the clearest "setup then overwhelm" Druid lane.

### Anchor package

Current live anchor cards:

- `druid_firestorm`
- `druid_molten_boulder`
- `druid_fissure`
- `druid_tornado`
- `druid_volcano`
- `druid_hurricane`
- `druid_armageddon`

Anchor pattern:

- early typed-damage setup
- midgame area pressure
- late reinforced payoff spell turns

### Support package

Preferred support tools:

- `druid_cyclone_armor`
- `druid_oak_sage`
- `druid_raven`
- one light draw or sustain bridge like `druid_lycanthropy`

What support is doing here:

- buying time for spell turns
- preventing early collapse
- covering setup windows against miniboss and boss pressure

### Payoff identity

The lane should win because:

- spell turns become decisive
- typed-damage packets stack into broad cleanup
- the player reaches a point where one good cycle swings the fight

It should not win because:

- summons quietly carried the board
- the deck simply became a generic defense pile

### Reinforcement priorities

Good refine or evolve targets:

- `druid_firestorm` as the early bridge
- `druid_fissure` as the first real engine signal
- `druid_tornado` or `druid_volcano` as midgame reinforcement targets
- `druid_armageddon` and `druid_hurricane` as late payoff anchors

The intended growth pattern is:

- early bridge spell
- midgame area-control reinforcement
- one or two late centerpiece payoff spells

### Weak version

The weak version of the lane looks like:

- too much setup, not enough close
- awkward hands with stall but no spell conversion
- dying before reinforcement matters

### Strong version

The strong version looks like:

- one reinforced early bridge
- one reinforced midgame area spell
- one late centerpiece payoff
- only a light defensive or summon splash

### Current live gap

The focused rescue pass worked here:

- `Balanced / Elemental Storm`: `0.667`, healthy

That means the package now has a workable bridge into its first real payoff cycle. The remaining issue is narrower:

- the surviving failure still clustered at `Ashen Throne / The Cinder Tyrant`

So the next tuning direction is:

- preserve the stronger early bridge
- watch late Act IV boss pressure
- avoid widening the support splash just because the lane now clears

## Package 2: Shifter Bruiser

### Core fantasy

The player uses durable melee turns, self-healing, and guard conversion to stay stable while building toward repeated bruiser payoff turns.

This should be the most reliable Druid lane, even if it is not the flashiest.

### Anchor package

Current live anchor cards:

- `druid_werewolf`
- `druid_werebear`
- `druid_fury`
- `druid_lycanthropy`

Anchor pattern:

- one-card pressure turns
- enough sustain to survive fair fights
- late repeated melee payoff anchored by `Fury`

### Support package

Preferred support tools:

- `druid_cyclone_armor`
- `druid_oak_sage`
- `druid_heart_of_wolverine`
- possibly one summon stabilizer if it protects tempo instead of replacing the lane

What support is doing here:

- smoothing weak hands
- making bruiser turns safer
- giving the deck enough durability to keep attacking

### Payoff identity

The lane should win because:

- it survives better than other Druid lanes
- its attack cycles remain efficient under pressure
- reinforced bruiser cards turn stable turns into real closing pressure

It should not win because:

- it accidentally turns into a summon deck
- it merely refuses to die without a real finisher

### Reinforcement priorities

Good refine or evolve targets:

- `druid_werewolf`
- `druid_werebear`
- `druid_fury`
- one support card that improves survivability without bloating the deck

### Weak version

The weak version looks like:

- very fair attacks
- enough healing to survive hallway fights
- not enough reach to close bosses or high-pressure minibosses

### Strong version

The strong version looks like:

- reinforced bruiser core
- one or two real defensive answers
- just enough support splash to keep pressure online

### Current live gap

`Shifter Bruiser` is not collapsing completely, but it is still below where we want it:

- `Aggressive`: playable but weak
- `Balanced`: playable but weak

That points to a floor and finishing problem, not an identity problem.

The rescue direction should be:

- better payoff reinforcement
- better reach into bosses
- tighter support package

## Package 3: Summoner Engine

### Core fantasy

The player survives the vulnerable setup turns, establishes board presence, and then wins because the board keeps producing value every cycle.

This should be the clearest engine deck in the class.

### Anchor package

Current live anchor cards:

- `druid_raven`
- `druid_poison_creeper`
- `druid_oak_sage`
- `druid_heart_of_wolverine`
- `druid_summon_grizzly`

Anchor pattern:

- early board presence
- engine protection and sustain
- a scaling board state that eventually becomes the run's main win condition

### Support package

Preferred support tools:

- `druid_cyclone_armor`
- one elemental bridge card such as `druid_firestorm` or `druid_fissure`
- one bruiser answer only if it helps survive setup turns

What support is doing here:

- keeping the player alive while summons matter
- covering turns where the engine is not online yet
- giving the deck one real answer line against early pressure

### Payoff identity

The lane should win because:

- summons stay online
- support effects compound the board
- the board eventually produces enough offense and protection to overwhelm the fight

It should not win because:

- the deck quietly pivots into elemental or bruiser damage
- the board exists, but the deck has no actual close

### Reinforcement priorities

Good refine or evolve targets:

- one early summon anchor
- one sustain or board-support summon
- one late centerpiece such as `druid_summon_grizzly`

The package should not be reinforced by spreading upgrades evenly across too many low-impact summons.

### Weak version

The weak version looks like:

- lots of setup
- not enough early stabilization
- no clear moment where the board becomes decisive

### Strong version

The strong version looks like:

- one early summon anchor that reliably sticks
- one midgame support summon that keeps the engine alive
- one late finisher or board-swing card
- only a tiny off-tree bridge package

### Current live gap

The focused rescue pass worked here too:

- `Aggressive / Summoner Engine`: `1.000`, healthy
- `Balanced / Summoner Engine`: `0.667`, healthy

The key fix was reward timing. When `Heart of Wolverine` was available too early, the lane spammed payoff before the setup floor was online. Moving that payoff out of the early reward pool restored the package spine:

- early summon anchors first
- support and stabilization second
- late payoff cards after the board is actually online

The remaining gap is narrower now:

- the one weak-policy loss still clustered at `Ashen Throne / The Cinder Tyrant`
- boss turns are trending too solved, so the lane should not get more blunt payoff density by default
- support splash still needs to stay light so the package remains a true summon engine

## Early Randomness And Lane Choice

Druid should choose its package based on what early rewards actually support.

Healthy early signals:

- elemental bridge spell plus an area-payoff reward -> move toward `Elemental Storm`
- bruiser card plus survivability reinforcement -> move toward `Shifter Bruiser`
- summon density plus one real engine support card -> move toward `Summoner Engine`

Unhealthy early signals:

- every path asking for the same generic support cards
- summon starts needing too much off-tree help to stay alive
- elemental starts being unplayable unless it high-rolls late payoffs immediately

## What To Tune Next For Druid

Use this order:

1. lift `Shifter Bruiser`
   - now the clearest remaining Druid lane gap
   - still looks like a floor and finishing problem, not an identity problem

2. monitor rescued `Summoner Engine` against late Act IV pressure
   - keep the new reward timing
   - avoid drifting back into early payoff spam

3. monitor rescued `Elemental Storm` against late Act IV pressure
   - preserve the stronger bridge
   - avoid broadening the lane into generic summon support

## Working Rule

Do not tune Druid only by raw lane clear rates.

Tune Druid by asking:

- does each lane have a real anchor package
- does reinforcement clearly improve that package
- does the support splash stay light
- does the lane win because its package worked, not because it drifted into generic value
