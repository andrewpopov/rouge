# Card Action Surface Comparative Review

_Snapshot: 2026-04-05_

## Purpose

This document reviews the kinds of card-driven strategic actions that make modern deckbuilders feel rich during combat.

The goal is not to decide implementation immediately.

The goal is to answer:

- what strategic verbs do benchmark games actually give the player
- which of those verbs belong to card text versus broader combat systems
- which of those verbs Rouge already supports in runtime
- which missing categories are likely to matter most for Rouge later
- which imported mechanics would fit Rouge well, and which would not

This is a comparative design reference, not a commitment to ship any specific mechanic.

## Reference Priority

Rouge should use the benchmark set unevenly.

Primary design anchors:

- `Slay the Spire`
- `Monster Train`

Secondary calibration references:

- `Across the Obelisk`
- `Wildfrost`
- `Vault of the Void`

That means:

- use _Slay the Spire_ as the main reference for card-state manipulation, temporary combat mutation, and fight-local rule changes
- use _Monster Train_ as the main reference for persistent engine state, trigger vocabularies, and package-defining support structure
- use the other games to pressure-test edge cases, especially party support, timing clarity, and status readability, but not as first-order structure

Detailed benchmark source tracking lives in:

- [docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md](/Users/andrew/proj/rouge/docs/wiki/inspirations/DECKBUILDER_ACTION_SURFACE_SOURCES.md)

## Source Note

For _Slay the Spire_, use the wiki as the reference surface for:

- `Keywords`
- `Upgrade`
- `Armaments`
- `Apotheosis`
- `Master Reality`
- `Double Tap`
- `Burst`
- `Nightmare`
- `Infernal Blade`
- `Discovery`
- `Feed`
- `Ritual Dagger`
- `Lesson Learned`
- `Buffs`

For _Monster Train_, use the wiki as the reference surface for:

- card effects and spell keywords
- status effects
- triggered unit effects
- card upgrades
- board and floor movement effects

For _Across the Obelisk_, use the wiki as the reference surface for:

- keywords and effects
- status systems
- card lifecycle terms like `Vanish`
- draw, retain, and sight-reveal style mechanics
- party-role and multi-actor combat interactions

For _Wildfrost_, use the wiki as the reference surface for:

- keyword and reaction rules
- row and position mechanics
- `Consume`, `Recall`, and item lifecycle rules
- status packages like `Snow`, `Shroom`, `Overburn`, `Ink`, `Haze`, and `Spice`
- charm-based keyword grafting

For _Vault of the Void_, use the wiki and companion references as the reference surface for:

- card lifecycle terms like `Purge`, `Expel`, `Rebound`, `Volatile`, and `Opener`
- sideboard and deck-sculpting systems
- `Void Stone` upgrade customization
- class resource systems like `Combo`, `Zeal`, `Overcharge`, and `Corruption`
- discard, destroy, and special-pile interactions

For Rouge, current runtime code is truth:

- `src/types/content.d.ts`
- `src/types/combat.d.ts`
- `src/combat/combat-engine.ts`
- `src/combat/combat-engine-turns.ts`
- `src/combat/card-effects.ts`
- `src/content/game-content.ts`

Important implementation note:

- some Rouge planning docs already talk about mechanics like `Exhaust`
- current runtime does **not** implement those mechanics yet

## The Real Question

The useful comparison is not:

- how many status effects a game has

It is:

- how many ways cards can change other cards
- how many ways cards can change future turns
- how many ways cards can change the rules of the current fight
- how many ways combat creates subgoals beyond simple damage racing

That is the action surface that makes deckbuilders feel strategically alive.

## Quick Comparison

Read this table with the priority rule above in mind:

- the first two columns are the main design targets
- the remaining benchmark columns are useful checks, not equal-weight templates

| Category | Slay the Spire | Monster Train | Across the Obelisk | Wildfrost | Vault of the Void | Rouge Runtime Today |
| --- | --- | --- | --- | --- | --- | --- |
| Card leaves combat after use | Strong (`Exhaust`, `Ethereal`) | Strong (`Consume`) | Strong (`Vanish`) | Moderate (`Consume`) | Strong (`Purge`, `Expel`) | Missing |
| Card stays available across turns | Strong (`Retain`, `Innate`) | Strong (`Holdover`, `Permafrost`, `Intrinsic`) | Moderate (`Retain`, draw retention effects) | Moderate via board persistence and `Recall` loops | Strong (`Retain`, `Rebound`, opener shaping) | Missing |
| Temporary card mutation in combat | Strong | Moderate | Low to moderate | Low | Moderate to strong | Missing |
| Create temporary cards/copies | Strong | Strong | Moderate | Low to moderate | Strong | Missing |
| Kill-check mechanics | Strong (`Fatal`) | Strong (`Slay`, `Harvest`, death loops) | Moderate via target and status cashout timing | Strong via on-kill and reaction timing | Moderate via damage-cashout sequencing | Mostly missing |
| Class combat states | Strong (`Stances`, `Orbs`, `Focus`) | Strong (`Burnout`, `Reform`, `Emberdrain`, status packages) | Strong (`Bless`, `Fortify`, `Sanctify`, `Stealth`, `Wet`, `Spark`, `Sight`) | Strong (`Snow`, `Shroom`, `Overburn`, `Ink`, `Haze`, `Spice`, `Shell`) | Strong (`Combo`, `Zeal`, `Overcharge`, `Corruption`, `Future Strike`) | Weak |
| Board topology | Low | Very strong | Moderate via front/backline and party rows | Strong via rows, counters, reactions, and yank/recall | Low | Low |
| Trigger vocabulary | Moderate | Very strong | Moderate | Strong | Moderate | Weak |
| Static upgrade economy | Moderate | Very strong | Strong | Very strong via charms | Very strong via `Void Stones` | Moderate via `_plus` |
| Card-to-card manipulation | Strong | Moderate | Moderate | Low | Strong | Very weak |

## Slay The Spire: Strategic Action Surface

_Slay the Spire_ is strongest when cards manipulate card state and combat rules directly.

### 1. Card lifecycle modifiers

These are some of the highest-value strategic verbs in _Slay the Spire_:

- `Exhaust`
  - remove the card from combat after use
  - create an exhaust pile as a new resource zone
  - enable exhaust synergies and exhaust recursion
- `Ethereal`
  - if a card remains in hand at end of turn, it exhausts
  - creates timing pressure
- `Retain`
  - card stays in hand instead of being discarded
  - allows delayed payoff timing
- `Innate`
  - guaranteed opening-hand access
  - changes opener consistency and deck construction
- `Unplayable`
  - some cards intentionally clog hand space until another system interacts with them

This family matters because it turns a card into a stateful object instead of a one-turn command.

### 2. Hand, draw, discard, and pile manipulation

_Slay the Spire_ frequently creates decisions around card location:

- draw
- discard as cost
- discard for payoff
- `Scry`
- fetch from discard
- place cards on top of draw pile
- shuffle junk into draw or discard
- create cards in hand
- create cards in draw pile
- create temporary cards for this combat
- create copies next turn

This is a large reason Silent, Defect, and Watcher turns feel expressive instead of linear.

### 3. Temporary card mutation during combat

_Slay the Spire_ cards can change other cards during the current fight:

- temporary upgrades for this combat
- upgrade one card in hand
- upgrade all cards in hand
- upgrade all cards in hand, draw, discard, and exhaust
- generated cards arrive upgraded
- generated cards cost `0` this turn
- retained cards become cheaper over time
- next card type is played twice
- chosen card is copied next turn

This is one of the biggest reasons the game feels alive. Cards do not only affect enemies. They affect the deck itself.

### 4. Combat-scoped player-state systems

_Slay the Spire_ also has class-defining player states:

- Watcher stances
  - `Wrath`
  - `Calm`
  - `Divinity` via `Mantra`
- Defect orb system
  - `Channel`
  - `Evoke`
  - orb slots
  - `Focus`
- combat buffs and debuffs with counters or rule changes
  - `Artifact`
  - `Buffer`
  - `Intangible`
  - `Barricade`
  - `Strength`
  - `Dexterity`
  - temporary stat gain paired with later stat-loss debuffs

These systems matter because they create engines instead of isolated card plays.

### 5. Kill-check and combat-objective mechanics

_Slay the Spire_ uses combat-local subgoals:

- `Fatal`
  - kill with this card to trigger a special effect
- permanent progression triggered inside combat
  - gain max HP
  - permanently increase a card’s damage
  - permanently upgrade a card

This creates a second axis of play:

- not just “win the fight”
- but “win the fight while landing the right killing blow”

### 6. Triggered next-turn and next-card logic

Another major source of depth is transient combat rules:

- next attack is played twice
- next skill is played twice
- first card each turn is played twice
- next turn your attacks deal double damage
- retain this until you want to cash it in
- at start of turn, draw or upgrade or discard or gain energy

## Monster Train: Strategic Action Surface

_Monster Train_ is strongest when cards assemble explicit engine packages around unit triggers, board position, and card persistence rules.

Compared to _Slay the Spire_:

- _Slay the Spire_ is stronger at hand-state manipulation
- _Monster Train_ is stronger at package identity, board topology, and trigger vocabularies

### 1. Card lifecycle and spell persistence mechanics

These are the highest-signal Monster Train card-state verbs:

- `Consume`
  - remove the card from combat after use
  - strongest direct parallel to `Exhaust`
- `Holdover`
  - card returns to hand at end of turn
  - strong delayed-cashout and combo support
- `Permafrost`
  - card is retained in hand until used
  - similar to a specialized `Retain`
- `Intrinsic`
  - card starts in opening hand
  - strong opener consistency tool
- `Spellchain`
  - add a copy of the spell to hand after play
  - powerful repeat/copy support
- `Purge`
  - remove permanently from the deck for the rest of the run
  - run-level deck shaping, not just combat shaping
- `Offering`
  - cast and immediately discard a card
  - directly turns the hand into a new action
- `X-cost` and ember-scaling effects
  - spend variable resources for scalable outcomes
- `Extract`
  - spend pip/resource pressure from the floor or room system

This family matters because Monster Train makes “will I see this again” a core strategic axis.

### 2. Trigger vocabulary on units

Monster Train’s biggest strength is its trigger language:

- `Summon`
- `Strike`
- `Slay`
- `Incant`
- `Rally`
- `Resolve`
- `Revenge`
- `Harvest`
- `Extinguish`
- `Rejuvenate`
- `Inspire`
- `Gorge`
- `Hatch`

This is one of the most important design lessons from Monster Train.

Cards and units are exciting because they do not just produce numbers. They plug into a trigger system the player can deliberately build around.

### 3. Board topology and floor control

Monster Train adds an entire strategic layer that _Slay the Spire_ does not emphasize:

- floor choice
- unit placement
- capacity management
- front line versus back line
- ascending and descending units
- preserving the right unit in the right room
- room-targeted spell value instead of only enemy-targeted value

This makes “where” a card happens almost as important as “what” it does.

This part is powerful, but it is also the least directly portable to Rouge.

### 4. Unit combat keywords and attack-shape modifiers

Monster Train has a dense set of attack-shape and survivability keywords:

- `Multistrike`
- `Quick`
- `Sweep`
- `Trample`
- `Endless`
- `Burnout`
- `Reform`
- `Piercing`
- `Damage Shield`
- `Armor`
- `Stealth`
- `Spell Shield`

These change how units survive, attack, recur, and cash out over time.

### 5. Status packages and resource-pressure systems

Monster Train also supports strong class-local status engines:

- `Rage`
- `Frostbite`
- `Sap`
- `Daze`
- `Emberdrain`
- `Melee Weakness`

These are not just debuffs. They often define how a clan package wins.

### 6. Upgrade economy as a strategic action surface

Monster Train’s merchant upgrade system is unusually important.

A card’s strategic identity is shaped not just by its printed text, but by which upgrade package gets attached to it:

- cost reduction
- `Holdover`
- `Permafrost`
- `Intrinsic`
- `Consume`
- added magic power
- copied spell behavior
- large unit-stat and keyword injections

This matters because Monster Train makes “what keyword can I graft onto this card” part of the core strategy loop.

### 7. Why Monster Train feels different from Slay the Spire

Monster Train feels strategically rich for different reasons:

- less hand-state elegance than _Slay the Spire_
- more obvious package identity
- more board geometry
- more trigger stacking
- more “one card becomes the center of the run” behavior

That makes it especially relevant for Rouge, because Rouge already wants stronger build-package identity than _Slay the Spire_ does.

## Across the Obelisk: Strategic Action Surface

_Across the Obelisk_ is strongest when cards participate in a shared party-state economy: statuses, row targeting, reveal effects, support timing, and lifecycle-limited cards all matter because four allied actors are solving the same fight together.

Compared to _Slay the Spire_ and _Monster Train_:

- it is less elegant at card-state manipulation than _Slay the Spire_
- it is less explosive at trigger-engine vocabulary than _Monster Train_
- it is stronger than both at showing how party combat changes card evaluation

### 1. Card lifecycle and availability mechanics

The most relevant action-surface mechanics are:

- `Vanish`
  - remove the card from combat when played
  - the closest Across the Obelisk parallel to `Exhaust` or `Consume`
- `Retain`
  - keep specific cards available across turns
  - supports delayed payoff timing and setup cards
- reveal and opener consistency effects
  - cards and statuses that expose enemy intent or enemy hand
  - these are not the same as `Innate`, but they still reshape turn planning

Across the Obelisk has less card-lifecycle richness than _Slay the Spire_ or _Monster Train_, but more than Rouge currently does.

### 2. Party-state and role coordination

This is the game’s most important strategic contribution.

Cards are not evaluated only by:

- raw damage
- raw block

They are evaluated by:

- which ally they support
- whether they front-load or back-load survivability
- whether they make another hero’s status package stronger
- whether they protect the right party member for the current enemy pattern

That creates strategy through role interaction:

- tank routing
- healer timing
- support setup
- striker payoff windows

This is especially relevant to Rouge because Rouge also has more than one allied actor in combat.

### 3. Status-layer strategy

Across the Obelisk has a dense status vocabulary and many of those statuses are engine pieces, not just damage riders.

Examples include:

- `Bless`
- `Fortify`
- `Stealth`
- `Taunt`
- `Burn`
- `Bleed`
- `Poison`
- `Chill`
- `Wet`
- `Spark`
- `Sight`
- `Mark`
- `Sanctify`
- `Thorns`
- `Regeneration`

The important lesson is not “copy these names.”

It is:

- status packages can define a deck’s identity
- support cards are interesting when they amplify a teammate’s engine
- reveal, resistance-shaping, and target-forcing statuses create planning value

### 4. Reveal and information mechanics

Across the Obelisk has a meaningful information axis:

- `Sight`
  - reveal enemy cards or enemy intent information
- party coordination around what is about to happen
- proactive mitigation because upcoming enemy actions are more knowable

This is notable because it creates strategic depth through information, not just damage or defense.

Rouge already has visible enemy intents, so it does not need to copy `Sight` literally.

But the design lesson still matters:

- information itself can be a combat resource
- cards can improve planning, not just output

### 5. Resistance and status-conversion play

Across the Obelisk often makes statuses matter through resistances and cross-status relationships:

- `Wet` amplifying lightning vulnerability
- `Spark` interacting with nearby enemies and lightning pressure
- `Burn`, `Chill`, and similar effects influencing resistance profiles
- statuses that remove or counter other statuses

This creates decks that feel like true element packages instead of simple damage labels.

Rouge already gestures at this through Burn, Freeze, Poison, Slow, and encounter counter-tags, but it does not yet push that interaction surface very far.

### 6. Upgrade identity

Across the Obelisk’s upgrade model matters strategically because upgrades often change:

- cost
- color role
- target pattern
- status payload
- lifecycle behavior like `Vanish`

This is an important contrast with Rouge’s current `_plus` model.

Rouge upgrades mostly say:

- same card
- better numbers

Across the Obelisk upgrades more often say:

- same card family
- meaningfully different job

That is a useful design lesson even if Rouge never copies the exact card-color model.

### 7. Why Across the Obelisk matters for Rouge

Across the Obelisk is especially relevant because Rouge is also party-based.

The most important lessons are:

- support cards become much more interesting in multi-actor combat
- status packages can be role-coordinated, not just self-contained
- cards that help another ally’s plan can be as strategic as direct payoff cards
- combat can be deep even without `StS`-level card mutation or `Monster Train`-level board topology

## Wildfrost: Strategic Action Surface

_Wildfrost_ is strongest when cards participate in a compact tactical board with explicit timing counters, row pressure, reaction keywords, and extremely behavior-rich status packages.

Compared to the earlier benchmarks:

- it is less about hand and pile manipulation than _Slay the Spire_
- it is less about engine trigger ladders than _Monster Train_
- it is stronger than both at making board-state timing matter every turn

### 1. Board timing as a core card verb

Wildfrost makes timing visible through counters.

That means card value is shaped by:

- when a unit attacks
- whether an enemy can be frozen, delayed, or disrupted
- whether a support unit should stay active or be recalled
- how many turns a status has to matter before the next attack cycle

This is a very different kind of excitement from _Slay the Spire_.

It is less about pile manipulation and more about tactical clock manipulation.

### 2. Lifecycle and availability mechanics

The highest-signal lifecycle verbs are:

- `Consume`
  - one-use items and effects
- `Recall`
  - pull a companion back to hand, reset board position, or protect it from a bad exchange
- board persistence
  - companions and clunkers remain on board, so a card’s strategic value is not just its one-turn spell text

This makes “when do I cash this in” and “when do I remove this from danger” central to play.

### 3. Reaction and attack-shape keywords

Wildfrost has a dense set of compact tactical keywords:

- `Frenzy`
- `Barrage`
- `Aimless`
- `Smackback`
- `Teeth`
- `Longshot`
- `Yank`

These change:

- target shape
- retaliation
- attack sequencing
- who gets exposed first

The lesson is that combat can get much richer from a small number of high-signal tactical keywords.

### 4. Status packages as engine identity

Wildfrost statuses often define the whole shape of a build:

- `Snow`
- `Shroom`
- `Spice`
- `Shell`
- `Overburn`
- `Ink`
- `Haze`
- `Bom`

These statuses are not just damage riders.

They define:

- which allies want to attack
- which enemies are safe to leave alive
- whether damage should be front-loaded or delayed
- whether a support card is actually a payoff card for the deck

### 5. Charm economy and behavior grafting

One of Wildfrost’s biggest lessons is that upgrades can add behavior, not just stats.

Charms often change:

- attack shape
- survivability
- trigger pattern
- status payload
- whether a card now supports a different shell

This is especially relevant to Rouge because it reinforces a point we also get from Monster Train:

- upgrades are most strategically interesting when they change how a card behaves

### 6. Why Wildfrost matters for Rouge

Wildfrost is useful to Rouge for three reasons:

- it shows how compact timing counters can make a fight tactically rich
- it shows how a small reaction vocabulary can create a lot of expression
- it shows how status packages can carry deck identity without needing huge hand-state complexity

The least portable part is its exact board model.

The most portable parts are:

- behavior-rich statuses
- compact reaction keywords
- tactical once-per-battle and recall-style decisions

## Vault of the Void: Strategic Action Surface

_Vault of the Void_ is strongest when the player is allowed to sculpt deck behavior aggressively before and during combat.

Compared to the other benchmarks:

- it is one of the strongest references for card lifecycle vocabulary
- it is unusually strong at customization and deck surgery
- it is less about board geometry and more about exact deck-state control

### 1. Card lifecycle vocabulary

Vault of the Void has a rich lifecycle language:

- `Purge`
- `Expel`
- `Rebound`
- `Retain`
- `Volatile`
- `Opener`
- `Set Up`

This matters because cards are not just played and discarded.

They can:

- leave the fight
- move into specialized piles
- come back later
- be reserved for the opener
- be deliberately primed for a future turn

This is one of the clearest examples of how card-state vocabulary alone can deepen a deckbuilder.

### 2. Sideboard and between-fight deck sculpting

Vault of the Void also gets a lot of strategic depth from pre-combat control:

- sideboarding between fights
- trimming or reshaping tools for a specific encounter
- choosing which specialized answers belong in the active deck now

This is a major design lesson for Rouge even if we never copy sideboarding literally.

It proves that:

- deck shaping itself can be a core strategic action surface
- a run can stay exciting when the player has strong control over deck purpose

### 3. Upgrade grafting through Void Stones

Void Stones are one of the best benchmark systems for behavior-changing upgrades.

They often change:

- cost structure
- lifecycle behavior
- payoff scaling
- whether a card becomes opener-tech, recursion-tech, or combo-tech

This is one of the most useful reference points for Rouge’s future upgrade design.

It supports the same lesson as Monster Train and Wildfrost:

- upgrades are most exciting when they add verbs, not only numbers

### 4. Resource systems and class-specific combat rules

Vault of the Void also builds depth through class-owned resource systems such as:

- `Combo`
- `Zeal`
- `Overcharge`
- `Corruption`
- `Future Strike`

These systems make card evaluation context-sensitive and engine-driven.

That makes it a useful reference for Rouge if we eventually want stronger class-owned combat states without copying _Slay the Spire_ stances or orbs directly.

### 5. Draw, discard, destroy, and special-pile control

Vault is also stronger than most deckbuilders at:

- cycling deliberately
- moving cards into and out of special piles
- converting discard and destroy states into value
- making “where does this card go next” a core tactical question

This overlaps with _Slay the Spire_, but it usually feels more explicit and more customizable.

### 6. Why Vault of the Void matters for Rouge

Vault of the Void is useful to Rouge for four reasons:

- it reinforces the value of rich lifecycle vocabulary
- it is one of the best references for behavior-changing upgrades
- it shows how class combat states can stay custom without copying StS exactly
- it proves that deck surgery and card customization can be strategy, not just maintenance

The least portable part is its exact sideboard and pile model.

The most portable parts are:

- richer card lifecycle terms
- behavior-grafting upgrades
- stronger class-specific combat rules
- explicit deck-sculpting verbs

## Comparative Lessons From The Five Benchmarks

### Slay the Spire contributes:

- best-in-class card-state mechanics
- hand and pile manipulation
- temporary upgrades and temporary rule changes
- kill-check card objectives

### Monster Train contributes:

- best-in-class package identity
- trigger vocabularies
- card persistence upgrades
- behavior-grafting upgrade economy

### Across the Obelisk contributes:

- best party-role reference
- status layering as team strategy
- support timing in multi-actor combat
- information and reveal as a meaningful combat resource

### Wildfrost contributes:

- compact timing-counter tactics
- dense reaction keywords
- status packages that define run identity
- charm-driven behavior grafting

### Vault of the Void contributes:

- rich lifecycle vocabulary
- sideboard and deck-surgery strategy
- behavior-changing upgrade surfaces
- strong class-specific combat rules without copying StS directly

## Rouge: Current Runtime Action Surface

Rouge already has a real combat surface, but it is much narrower than any of these benchmark games.

### What Rouge currently supports in runtime

Current implemented `CardEffectKind` values are:

- `damage`
- `damage_all`
- `summon_minion`
- `gain_guard_self`
- `gain_guard_party`
- `heal_hero`
- `heal_mercenary`
- `draw`
- `mark_enemy_for_mercenary`
- `buff_mercenary_next_attack`
- `apply_burn`
- `apply_burn_all`
- `apply_poison`
- `apply_poison_all`
- `apply_slow`
- `apply_slow_all`
- `apply_freeze`
- `apply_freeze_all`
- `apply_stun`
- `apply_stun_all`
- `apply_paralyze`
- `apply_paralyze_all`

That means Rouge already has:

- single-target pressure
- AOE pressure
- party defense
- sustain
- simple draw
- enemy status application
- mercenary mark/setup support
- persistent summons and minions

### What Rouge combat state currently contains

Rouge combat runtime has:

- `drawPile`
- `discardPile`
- `hand`

It does **not** currently have:

- exhaust pile
- retained hand state
- innate hand state
- ethereal cleanup state
- temporary card flags
- per-card cost modifiers in combat
- per-card temporary upgrade state
- generated temporary card metadata

`CardInstance` only contains:

- `instanceId`
- `cardId`

That is a strong sign that cards are currently mostly immutable during combat.

### What happens when a card is played

Current runtime behavior:

- card leaves hand
- effects resolve
- card goes to `discardPile`

There is no runtime branch for:

- exhaust on play
- purge on play
- stay in hand
- return to draw pile
- create a copy
- transform the card instance

### What happens at end of turn

Current runtime behavior:

- whole hand is discarded

There is no runtime branch for:

- retain specific cards
- retain all cards
- ethereal exhaust from hand
- hand-state decay by card tag

### What Rouge does have that is strategically meaningful

Even without card-state mechanics, Rouge already has several useful strategic layers:

- party protection instead of solo block
- minion persistence and reinforcement
- enemy status stacking
- mercenary mark timing
- weapon-family scaling
- route and encounter pressure
- out-of-combat permanent upgrades via `_plus` card variants

That gives Rouge a decent tactical shell.

But it does **not** yet have the deeper “card manipulates card” layer that makes _Slay the Spire_ rich or the deep trigger vocabulary that makes _Monster Train_ rich.

## What Rouge Is Missing Relative To Both Games

### 1. Card lifecycle mechanics

Missing:

- `Exhaust` or `Consume`
- exhaust pile
- return from exhaust
- `Ethereal`
- `Retain`
- `Holdover`-style persistence
- `Innate` or `Intrinsic`
- `Unplayable` as a deliberate state challenge

This is the single biggest missing family.

### 2. Card-location manipulation

Missing:

- explicit discard-as-cost cards
- discard payoffs
- `Scry`
- tutor from draw pile
- recover from discard pile
- place on top of draw pile
- shuffle created cards into draw pile
- create temporary cards in hand, draw pile, or discard

### 3. Temporary combat card mutation

Missing:

- upgrade a card in hand for this combat
- upgrade all cards in hand
- upgrade all cards in combat zones
- generated cards arrive upgraded
- set cost to `0` this turn
- reduce cost this turn
- reduce cost this combat
- copy a card next turn
- card-specific combat stat mutation

### 4. Trigger rules on future cards

Missing:

- next attack played twice
- next skill played twice
- first card each turn gets modified
- next turn delayed buffs
- once-per-combat charge cards
- delayed cash-out cards

### 5. Trigger vocabularies on units and summons

Rouge has minions and mercenaries, which means it is unusually well-positioned to learn from Monster Train here.

Missing or only partial:

- on summon
- on strike
- on slay
- on death
- on ally death
- on turn start
- on turn end
- on spell cast
- on status applied
- on enemy death in lane or pack

Rouge already has the actor model for this. It mostly lacks the explicit trigger vocabulary.

### 6. Kill-check objective mechanics

Missing:

- `Fatal`
- on-kill permanent max-life gain
- on-kill permanent card scaling
- on-kill permanent upgrade
- combat-local subgoals built around who gets the kill and with what card

## Important Design/Runtime Gap

Some Rouge planning docs already describe mechanics like `Exhaust`.

Current runtime does **not** support that.

So there is a design/runtime mismatch:

- design surfaces already understand the value of these mechanics
- runtime card and combat types still do not represent them

That is useful, because it means the design direction is already pointing toward the right kind of depth.

## What Fits Rouge Best

The most useful question is not “what can we copy.”

It is “which mechanics support Rouge’s class packages, party combat, and Diablo-flavored identity.”

### Best fits from Slay the Spire

- `Exhaust`
- `Retain`
- `Innate`
- temporary upgrades
- temporary cost reduction
- generated temporary cards
- kill-check mechanics like `Fatal`
- next-card and next-skill rule modifiers

Why these fit:

- they deepen hand and deck sequencing without changing Rouge’s combat geometry
- they make cards feel more alive during the fight
- they create combo scaffolding for package play

### Best fits from Monster Train

- `Consume`-style once-per-battle cards
- `Holdover`-style persistent payoff cards
- strong trigger vocabularies for mercenaries and minions
- death, summon, strike, and resolve style package hooks
- keyword-bearing upgrades that change how a card behaves, not just its numbers
- explicit package-defining support pieces

Why these fit:

- Rouge already cares about build packages
- Rouge already has summons and a mercenary partner
- Rouge already wants cards to feel like specialized tech, not just raw stats

### Best fits from Across the Obelisk

- role-coordinated support cards
- ally-amplifying status packages
- information and reveal as tactical support
- party-protection and target-forcing effects that help another actor’s plan

Why these fit:

- Rouge is already party-based
- Rouge already has ally support seams through the mercenary and minions
- Rouge benefits from making support cards strategically meaningful instead of only defensive

### Best fits from Wildfrost

- compact reaction keywords
- status packages with sharper tactical identities
- recall-style tactical reposition or recovery decisions
- upgrades that add behavior rather than just more numbers

Why these fit:

- Rouge could gain a lot from a small set of high-signal tactical keywords
- Rouge already wants statuses to do more than just add damage
- Wildfrost’s best ideas fit without importing its full board model

### Best fits from Vault of the Void

- richer lifecycle vocabulary
- stronger behavior-grafting upgrade systems
- explicit deck-sculpting verbs
- stronger class-owned combat rules that are not just copied StS stances

Why these fit:

- Rouge already wants specialization and package identity
- Rouge can benefit from more explicit card-behavior customization
- class-owned combat rules fit Rouge’s class fantasy well if kept bespoke

### Weak fits or likely bad literal imports

- full floor-topology combat from Monster Train
- orb-slot style combat geometry from Defect
- direct copy of Watcher stance names or exact stance math
- pyre-specific and train-floor-specific mechanics

These are useful inspiration, but they should not be ported literally.

## Strategic Lesson From Each Benchmark

### Slay the Spire teaches Rouge:

- cards should manipulate cards
- card state during combat is a core strategic layer
- temporary upgrades and lifecycle rules create tension and expression

### Monster Train teaches Rouge:

- explicit build packages are good
- trigger vocabularies make packages feel real
- once-per-battle and persistent-card rules are powerful
- upgrades that graft behavior keywords onto cards create a lot of strategy

### Across the Obelisk teaches Rouge:

- party support can be strategic, not just defensive
- statuses can be team-coordinated engines
- information and reveal effects can be meaningful combat resources

### Wildfrost teaches Rouge:

- timing counters and reaction rules can create a lot of depth
- compact tactical keywords can be more valuable than many weak ones
- upgrades are more exciting when they add behavior

### Vault of the Void teaches Rouge:

- lifecycle vocabulary itself is strategic depth
- sideboard and deck-surgery thinking can sharpen encounter planning
- class combat states can stay bespoke without copying benchmark systems literally

## Concrete Recommendation For Future Design Work

Do **not** jump straight into implementation from this doc.

Use this research to build a Rouge-specific shortlist later.

If we eventually choose to expand Rouge’s action surface, the most promising families are:

1. card lifecycle mechanics
   - `Exhaust` or `Consume`
   - `Retain` or `Holdover`
   - `Innate` or `Intrinsic`
2. combat-local card mutation
   - temporary upgrade
   - temporary cost reduction
   - generated temporary cards
3. trigger vocabulary for mercenary and minion packages
   - summon
   - strike
   - slay
   - death
   - turn-end payoff
4. kill-check mechanics
   - `Fatal`
   - on-kill rewards
5. behavior-changing upgrades
   - not just more numbers
   - more “this card now behaves differently in combat”

## Bottom Line

Rouge already has:

- solid combat numbers
- statuses
- party defense
- summons
- reinforcement

Rouge still lacks most of the card-state mechanics and trigger vocabularies that make the benchmark deckbuilders strategically rich during the fight itself.

The biggest missing layer is not “more statuses.”

It is:

- card lifecycle
- combat-local card mutation
- temporary rule changes
- explicit trigger systems

That is the layer to keep studying across other games before choosing what belongs in Rouge.
