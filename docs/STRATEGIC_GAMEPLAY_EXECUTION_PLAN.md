# Strategic Gameplay Execution Plan

_Snapshot: 2026-03-28_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Read this after `STRATEGIC_BUILD_IDENTITY_DESIGN.md`.
- Use this document as the concrete modification plan for moving Rouge closer to the strategic feel of _Slay the Spire_ and _Monster Train_.
- Use `CLASS_STRATEGY_GUIDE_SYSTEM.md` and `docs/strategy-guides/*.md` for the per-class source material that future player guides should be written from.

## Goal

Rouge should ask players to build a strategy, commit to it, and pilot it through imperfect draws and boss exams.

That means we need to increase:

- archetype commitment
- deck curation pressure
- route-level tradeoffs
- boss-specific preparation
- differences between strong, weak, and pivoting builds

And we need to reduce:

- generic reward inflation
- overly safe weak openings
- off-class goodstuff solutions
- fights that end before draw sequencing matters

## Current Gap

Compared with the target strategic model in [docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md):

- Rouge is already good at long-run progression systems: skills, weapons, runes, runewords, quests, and deterministic balance tooling.
- Rouge is only partially good at deckbuilder-style strategic tension.
- The live game still lets too many runs succeed through broad stat gain and safe early routing instead of asking players to curate a deck and solve matchup-specific problems.

The big live problems are:

1. Early weak runs are still too safe.
2. Quest and route rewards are too generically life/gold/mercenary-heavy.
3. Bosses are more interesting than before, but too much of the strategic burden still sits on the Cinder Tyrant.
4. Build identity exists, but class fantasy and weapon fantasy do not always align.
5. Hand size and draw shaping exist mechanically, but not yet as major strategic axes.

## Target Player Experience

We want a Rouge run to feel like this:

### Act I

- The player starts discovering what the run wants to be.
- Early picks create momentum toward a lane.
- Weak or unfocused runs can fail before Act II.
- Beating the Briar Matron should feel earned, not automatic.

### Act II-III

- The player is no longer asking "what class am I?"
- They are asking "am I Bow Amazon, Javelin Amazon, or Passive Tempo Amazon?"
- Rewards, quests, gear, and route choices increasingly reinforce or challenge that identity.
- Elites and minibosses expose deck weaknesses before the act boss does.

### Act IV-V

- The player is refining a strategy, not discovering one from scratch.
- Bosses take long enough for sequencing, setup, and recovery to matter.
- Deck draw randomness creates tactical tension because the build has real engine pieces and real support pieces.
- A strong run feels piloted, not merely numerically inflated.

## Required Game Changes

## 1. Make archetype commitment a first-class system

We already have favored-tree routing. We should push it further.

### Change

Add a visible commitment model for each run:

- `primary archetype`
- `secondary support package`
- `commitment strength`

Commitment strength should increase when the player repeatedly chooses:

- the same tree
- the same proficiency family
- the same archetype-tagged reward families
- matching runewords or gear lines

### Why

This moves Rouge from "reward bias exists under the hood" to "the run is actually becoming something."

### Implementation direction

- Tag class cards, skills, runewords, and some quests with archetype ids.
- Track `archetypeScore` per run in addition to `favoredTreeId`.
- Use `archetypeScore` to drive:
  - reward weighting
  - quest reward variants
  - vendor bias
  - simulator reporting

### Success check

By mid-Act II, most successful runs should show:

- one dominant archetype
- one recognizable support archetype
- fewer off-fantasy weapon outcomes

## 2. Change reward screens from “good options” to “strategic roles”

Reward screens should feel like decisions, not just upgrades.

### Change

Standard card rewards should usually contain:

- `1` engine reinforcement
- `1` support or consistency option
- `1` pivot, tech, or utility option

Quest rewards should usually contain:

- `1` current-build reinforcement
- `1` economy or safety option
- `1` risky pivot or project acceleration option

### Why

This mirrors what makes STS and Monster Train strategic: the choices are not equivalent kinds of value.

### Implementation direction

- Expand reward tagging beyond tree ownership into card role tags:
  - `engine`
  - `support`
  - `defense`
  - `draw`
  - `tech`
  - `pivot`
- Force reward construction to fill those roles instead of only sampling weighted class pools.
- Add more explicit skip encouragement when the three options are weak for the current run.

### Success check

Reward screens should much more often read as:

- “take the thing my deck wants”
- “take the thing that makes my deck work more often”
- “take the thing that solves a future problem”

instead of “three decent class cards.”

## 3. Increase deck curation pressure

If deck size and dead draws do not hurt enough, the game will never feel like STS or Monster Train.

### Change

Make deck cleanliness more important.

### Required modifications

- Increase the value of purging starter cards and dead cards.
- Add more meaningful opportunities to skip low-value card rewards.
- Make transforms and upgrades more attractive relative to blind card addition.
- Add a small number of “junk” or “curse-like” enemy or route effects that punish greedy drafting and test recovery.

### Why

A strategy game needs bad additions to be costly.

### Implementation direction

- Keep Sage purge as a core deckbuilder tool and consider lowering early purge friction slightly.
- Add encounter modifiers or quest risks that insert temporary or persistent junk cards.
- Make some later rewards offer:
  - `upgrade 2`
  - `purge 1`
  - `take 1 strong card`
  so the player has to decide between consistency and raw ceiling.

### Success check

Late-game successful decks should be:

- smaller
- more upgraded
- more internally coherent

than weaker comparison runs.

## 4. Make bosses multi-cycle exams, not damage races

We want planning and draw variance to matter. That requires longer fights.

### Change

Bosses should generally survive long enough for:

- at least one setup cycle
- at least one pressure cycle
- at least one recovery or adaptation turn

### Boss pacing target

For competent or optimized builds:

- The Briar Matron: roughly `5-7` turns
- The Sepulcher Devourer: roughly `6-8` turns
- The Idol Patriarch: roughly `7-9` turns
- The Cinder Tyrant: roughly `8-11` turns
- The Siege Tyrant: roughly `9-12` turns

For weak or unfocused builds:

- some acts should fail before the kill if the build did not prepare answers

### Required modifications

- Raise boss effective survivability through guard, phase steps, adds, recovery, or anti-burst openers.
- Reduce pure “stat wall” tuning and increase “boss asks.”
- Give each boss a short design brief:
  - what strategy it punishes
  - what strategy it rewards
  - what answer cards or defenses the player should want

### Specific boss asks

- The Briar Matron:
  - tests early sustain, poison handling, and whether the deck can survive a longer opener
  - should not die before the player sees meaningful variance
- The Sepulcher Devourer:
  - tests guard, frontline durability, and mercenary protection
- The Idol Patriarch:
  - tests backline pressure, lightning mitigation, and recovery after spike turns
- The Cinder Tyrant:
  - tests late-game consistency, telegraph respect, and burst survival
- The Siege Tyrant:
  - tests anti-disruption planning, add handling, and consistency over a long fight

## 5. Make elites the mid-run exams

Right now bosses are doing too much of the real testing.

### Change

Elites and minibosses should punish one-dimensional decks earlier.

### Required modifications

- Add more elite packages that stress:
  - AoE reliance
  - weak defense
  - slow setup
  - lack of draw
  - inability to answer support enemies
- Increase elite pressure more through mechanics than raw damage.
- Give more elite fights a “problem shape” the player has to solve.

### Success check

By Act II-III, bad archetype construction should already be visible in elite outcomes, not only at the Cinder Tyrant.

## 6. Push weapon families into archetype identity

Weapons should help define what kind of deck the player has.

### Change

Make each family a clearer strategic commitment.

### Required modifications

- Bow and Crossbow:
  - should reinforce repetition, distance, consistency, and multi-target pressure
- Javelin and Spear:
  - should reinforce burst turns, shock, pierce-style aggression, and risk
- Sword and Axe:
  - should reinforce frontline tempo, direct pressure, and efficient repeated attacks
- Mace and Hammer:
  - should reinforce crushing, guard-positive combat, and bruiser plans
- Staff:
  - should reinforce spell chaining, energy scaling, and setup turns
- Wand:
  - should reinforce curses, minions, control, and payoff spells

### Why

The best weapon should usually deepen the deck’s plan, not simply add the highest number.

### Success check

We should see fewer runs where:

- Amazon wins on polearm goodstuff
- melee classes converge on the same broad weapon path
- classes abandon their intended proficiency identity late

## 7. Make armor matter by matchup, not only durability

Armor should support strategy, not just lower incoming damage.

### Change

Armor should become a matchup and planning choice.

### Required modifications

- Add more reward and vendor surfaces that present armor as:
  - physical-anchor gear
  - elemental-answer gear
  - poison-answer gear
  - hand/draw-support unique gear
- Tie some boss and elite asks more clearly to resist packages.
- Make unique armor effects more archetype-shaped, not just defensive.

### Success check

Players should more often say:

- “I need poison answer armor before the Briar Matron”
- “I want lightning safety before the Idol Patriarch”
- “I can risk lower armor because this build wants hand size”

## 8. Treat runes and runewords as strategy projects

This system is healthy enough to build around now.

### Change

Turn runewords into deliberate mid-run plans instead of fortunate bonuses.

### Required modifications

- Surface planned runewords more clearly in reward and map logic.
- Offer more quest choices that say:
  - finish your current project
  - broaden your economy
  - pivot into a different class-fantasy project
- Add more archetype-specific runeword goals per class.

### Why

Monster Train works partly because the player is always steering toward upgrades that complete an engine. Runewords can fill that role in Rouge.

### Success check

Most successful runs should end with one or two runewords that clearly match the deck’s actual archetype.

## 9. Turn hand size and opening draw into real build axes

These are present, but not yet important enough.

### Change

Make draw texture a small but meaningful identity layer.

### Required modifications

- Add a few more rare sources of:
  - `+1 opening draw`
  - `+1 max hand size`
  - draw-to-discard conversion
  - retain-style or delayed-value effects where appropriate
- Put these on:
  - select uniques
  - rare quest outcomes
  - specific runewords
  - possibly a few class-tree unlock thresholds

### Why

If we want draw randomness to create strategy, some builds need to care deeply about hand texture.

### Success check

At least some successful archetypes should start to diverge on:

- hand size
- opening draw
- total draw support

instead of all finishing around the same draw baseline.

## 10. Make quests and world nodes build-shaping

Route choice has to be more than generic resource farming.

### Change

Quest rewards should increasingly ask:

- reinforce the plan
- fund the plan
- pivot the plan

### Required modifications

- Create more quest outcomes that target:
  - favored tree cards
  - specific weapon families
  - rune or runeword acceleration
  - archetype tech cards
  - card purge or refinement
- Reduce the share of route rewards that are only:
  - life
  - gold
  - potion refill
  - mercenary flat stats

### Success check

A player should be able to describe why they took a quest route in strategic terms, not just resource terms.

## 11. Add more early-game failure pressure without breaking optimized runs

We explicitly want Act I failure to be possible.

### Change

Make early runs punish weak decisions more consistently.

### Required modifications

- sharpen Act I elite and miniboss asks, not only the Briar Matron
- reduce how safely sturdy classes coast into Act II on weak policies
- add more early pressure around:
  - deck inefficiency
  - poor target priority
  - lack of sustain planning
  - lack of poison or ranged answer

### Why

If the early game is too safe, then early strategic decisions never feel binding.

### Success check

Weak-policy sweeps should show:

- more regular Act I failures across multiple classes
- but optimized aggressive lines should still remain in the intended clear band

## 12. Build class-specific endgame plans and validate against them

This is the most important long-term shift.

### Change

We should stop tuning classes as collections of cards and start tuning them as intended strategies.

### Required per class

For each class, define `2-3` target endgame builds with:

- signature engine cards
- support cards
- ideal weapon family
- preferred armor profile
- likely rune or runeword targets
- ideal quest reward types
- elite weaknesses
- boss answers

### Why

This is how we get “finely tuned endgame builds” instead of broad class viability.

### Success check

The simulator should be able to label endgame successful runs as recognizable archetypes rather than generic class successes.

## Priority Order

Do the work in this order.

### Phase 1: strategy scaffolding

1. archetype score and commitment system
2. reward role construction
3. quest reward role construction
4. class-by-class intended archetype definitions

### Phase 2: combat pressure

5. boss pacing pass toward longer multi-cycle fights
6. elite package pass
7. early Act I-II pressure pass

### Phase 3: identity reinforcement

8. weapon-family incentive pass
9. armor specialization pass
10. runeword per-archetype routing pass
11. hand size and opening draw expansion

### Phase 4: simulator and balance support

12. archetype-aware simulator scoring
13. boss-turn matrix by class and policy
14. route-reward telemetry by archetype

## Balance Guardrails

We should keep tuning against the deterministic simulator.

### Campaign targets

- optimized or aggressive policies:
  - usually clear
  - not guaranteed
- balanced or control policies:
  - often reach midgame
  - frequently fail before the end
- weak or misbuilt policies:
  - can fail in Act I-II with real regularity

### Strategic targets

- winning runs should show stronger archetype concentration than losing runs
- successful decks should be more curated than failed decks
- boss fights should be long enough for draw variance and setup turns to matter
- route choices should correlate more strongly with final build identity

## Concrete Next Steps

This is the recommended immediate implementation sequence.

1. Add `archetype tags` and `archetypeScore` to cards, runewords, and quest packages.
2. Refactor reward generation into `engine/support/tech` roles.
3. Write `2-3` intended archetypes for each class in implementation-grade detail.
4. Rebuild Act I elites and the Briar Matron around longer fights and clearer asks.
5. Add simulator output for:
   - dominant archetype
   - support archetype
   - deck size
   - purge count
   - reward-role history
6. Re-run deterministic sweeps and compare successful versus failed runs by archetype cohesion.

## Decision Rule

Whenever we are unsure whether to add more generic power or more strategic pressure, prefer strategic pressure.

Rouge will feel closer to _Slay the Spire_ and _Monster Train_ when:

- the run asks the player to choose a lane
- the deck asks the player to protect that lane
- the bosses ask the player to prove that lane works

not when the run simply hands out enough stats to survive anyway.
