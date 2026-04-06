# Class Card Authoring Matrix

_Snapshot: 2026-04-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for the hybrid skill or deck or progression contract.
- Use `CLASS_IDENTITY_PATHS.md` for the named lane map and flagship-versus-secondary intent.
- Use `D2_SPECIALIZATION_MODEL.md` for specialization rules, behavior tags, and reward-weighting targets.
- Use `CARD_ECONOMY_SPEC.md` for the shared foundation-card layer and vendor-card role.
- Use [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md) for phased implementation order, first content batches, and validation gates.
- Use this document for per-class card-package targets, lane health checks, and authoring order.

## Purpose

This document turns the class lane map into an authoring plan.

It answers:

1. How large each class pool should become.
2. What kinds of cards each class needs beyond raw count.
3. What gameplay loop each lane should teach over a run.
4. Which holes in the current authored pool are blocking replayable depth.

This is a target-design document, not a claim that the current live card files already meet these targets.

## Roster Card Model

Working target:

- `10-15` shared foundation cards across the whole roster.
- `50` class cards per class.

Terminology note:

- The user-facing idea of “core cards” is approved.
- In docs, prefer `foundation cards` for that shared pool so it does not collide with `core skills` on the fixed skill bar.

Recommended class breakdown at `50` cards:

- `8` class-glue cards per class.
- `12` cards for the flagship lane.
- `12` cards for the second full lane.
- `10` cards for the support or control lane.
- `8` hybrid bridge cards per class.

Longer-term expansion target:

- `55-60` class cards per class once the roster can support multiple subpackages inside the same lane and richer late-act boss tech.

Working rules:

- Foundation cards smooth runs; class cards define runs.
- STS provides the card-pool shape, but Rouge class packages should still map cleanly to class trees and their approved hybrid splashes.
- Every lane needs setup, payoff, answers, and at least one form of salvage or consistency.
- Secondary lanes must still be real destinations, not flavor-only splashes.
- Off-tree splash should mostly be utility, recovery, disruption, or matchup tech.
- A class should not rely on repeated `damage + guard + draw` cards as its main source of variety.

## Slay the Spire Reference Model

Use _Slay the Spire_ as the structure reference, not as a literal content template.

Reference sources:

- [Cards](https://slay-the-spire.fandom.com/wiki/Cards)
- [Colorless Cards](https://slay-the-spire.fandom.com/wiki/Colorless_Cards)

Counted from those card lists:

- each STS class has `75` class cards
- average per class is about `4` starter or basic cards, `19` common cards, `35` uncommon cards, and `17` rare cards
- average per class is about `28` attacks, `35` skills, and `13` powers

The important design read:

- class cards are the main source of replayability
- most of the pool is not starter filler; it is build-around and mid-run decision content
- non-attack cards outnumber attacks
- the shared or colorless pool exists, but it is not usually the backbone of normal reward screens

Rouge translation at `50` class cards:

- `4` starter or basic class cards
- `12-13` early or common-like class cards
- `23-24` uncommon-like class cards that do most of the lane-defining work
- `10-11` rare or late-payoff class cards

Rouge action-surface translation:

- roughly `16-18` direct pressure or payoff cards
- roughly `24-26` setup or support or answer or salvage cards
- roughly `6-8` scaling or state or engine cards

Rule:

- if Rouge follows STS well, class pools will become deeper mostly by adding more meaningful setup, support, engine, and conversion cards, not just more attacks.

Lane health checks:

- The lane forms naturally by late Act I or early Act II.
- The lane produces distinct turns, not just stronger rates.
- The lane has a clear boss plan.
- The lane can support a winning deck without collapsing into generic goodstuff.

## Working Order

This document was filled in one class at a time in this order:

1. Amazon
2. Assassin
3. Barbarian
4. Druid
5. Necromancer
6. Paladin
7. Sorceress

That order is the audit sequence, not the live implementation order.

Use [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md) for the active class-card work queue.

## Amazon

### Current Audit

Current live inventory in [src/content/class-cards-amazon.ts](/Users/andrew/proj/rouge/src/content/class-cards-amazon.ts):

- `23` total class cards.
- Tree split: `Bow 8 / Javelin 4 / Passive 11`.
- Role split: `Support 5 / Payoff 11 / Setup 2 / Answer 4 / Salvage 1`.
- Starter deck remains heavily rate- and safety-based, which matches the broader starter-card concern called out in [COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md#L55).

Current gap summary:

- `Bow Volley` is the healthiest live lane, but it still leans too much on safe pressure cards instead of target-selection or cadence questions.
- `Javelin Storm` is too thin to sustain a full run; `4` javelin cards is not enough to carry a primary lane.
- `Passive Tempo` has too much surface area relative to its intended role and risks becoming a stat-smoothing pile instead of a support lane.
- The live pool asks for class fantasy, but not enough class decisions.

### Amazon Target Feel

Amazon should be the roster's clean precision class.

It should support:

- one stable and learnable lane
- one explosive and punishable lane
- one efficiency-forward support lane

The class should win by selecting targets, preserving tempo, and cashing out prepared windows, not by brute-forcing every turn with safe rate cards.

### Healthy Gameplay Loops

#### Bow Volley

Combat loop:

- identify the right target
- arm ranged cadence or a volley window
- convert repeated precise hits into safe pressure

Main decisions:

- when to spend setup on a backliner versus the current frontline threat
- when to use AoE or control to preserve cadence instead of forcing raw damage

Boss test:

- survive long enough to line up repeated payoff cycles without losing the precision plan

#### Javelin Storm

Combat loop:

- prime a committed attack turn
- overtake the fight with one risky pressure spike
- recover posture before the next punish window

Main decisions:

- when to overcommit for lethal or near-lethal pressure
- how much defensive recovery the deck needs after an aggressive turn

Boss test:

- build enough protection that burst windows are dangerous but not suicidal

#### Passive Tempo

Combat loop:

- gain small edges through dodge, command, and efficiency
- preserve hand quality and target control
- convert a support-rich shell into a real finisher

Main decisions:

- when to spend efficiency tools for survival versus saving them for a payoff turn
- how much of the deck can be support before the run loses closing power

Boss test:

- turn efficiency into inevitability before late bosses stabilize

### Amazon Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Amazon lane can use without erasing lane identity |
| Bow Volley package | `12` | stable ranged pressure, target selection, and volley payoffs |
| Javelin Storm package | `12` | risky tempo spikes, cleave, shock, and recovery-after-commit |
| Passive Tempo package | `10` | dodge, command, crit-style efficiency, and finisher enablement |
| Hybrid bridge cards | `8` | legal passive splash and limited bow or javelin pivots |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-backline or anti-summon answer
  - `1` mercenary-command card
  - `1` precise single-target fallback payoff
  - `3` flexible tempo cards that do not belong to one lane only
- `Bow Volley`
  - `3` setup cards
  - `4` payoff cards
  - `2` answer cards
  - `1` salvage or cadence card
  - `1` scaling card
  - `1` multi-target finisher
  - `1` target-designation or mark card
- `Javelin Storm`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` recovery card
  - `1` scaling card
  - `1` conversion card
  - `1` wave-crack or boss-phase finisher
- `Passive Tempo`
  - `3` support or setup cards
  - `2` answer cards
  - `1` salvage card
  - `2` conversion or scaling cards
  - `1` finisher-enabler
  - `1` mercenary-command or target-control card
- `Hybrid bridge cards`
  - `3` passive-plus-bow support cards
  - `2` passive-plus-javelin support cards
  - `2` constrained bow-or-javelin pivot cards
  - `1` late hybrid tech card

### Authoring Rules For Amazon

#### Bow Volley

- Bow should own target designation, backline reach, and repeated-hit payoff.
- Bow setup should create a named firing lane, not just extra damage.
- Bow needs at least one real anti-summon or anti-backline tool that is still on-plan.
- Bow scaling should reward repeated ranged hits, not read as a generic stat aura.
- Bow cards should stop defaulting to `damage + guard + draw` as the safest baseline.

#### Javelin Storm

- Javelin must feel like committed pressure, not “bow but closer.”
- Javelin needs both a risky spike card and a posture-recovery card.
- Javelin should own paralyze, chain, pierce, and attack-window payoff.
- Javelin must have one true lane payoff that can end a wave or crack a boss phase.
- Passive support can help Javelin survive, but it should not carry the whole lane's defensive budget.

#### Passive Tempo

- Passive is a support lane, not a standalone damage soup.
- Passive should own dodge, crit-style conversion, mercenary focus, and tempo preservation.
- Passive should have very few direct-damage cards.
- Passive cards should make Bow or Javelin cards evaluate differently.
- Passive should include at least one explicit “support turns into kill pressure” converter.

#### Hybrid Bridges

- Passive is the approved splash tree for Amazon.
- Bow and Javelin may share tempo or targeting tools, but not routine interchangeable damage cards.
- Hybrid cards should mostly provide targeting, recovery, control, or command value.
- Bridge cards should keep pivots possible without erasing the need to commit by Act II.

### Keep, Rework, Add

Keep as anchor patterns:

- `Inner Sight`: one of the better current examples of setup plus command plus protection.
- `Slow Missiles`: good example of a real answer card.
- `Multiple Shot`: a useful seed for Bow multi-target identity.
- `Lightning Fury`: a good late Javelin payoff anchor.
- `Valkyrie`: a good passive-bridge anchor if its final role stays support-first.

Rework or narrow:

- `Magic Arrow`: too generically efficient; should become a cadence or precision fallback instead of a best-rate default.
- `Jab`: needs a clearer Javelin identity than “deal damage twice.”
- `Critical Strike`: should become a finisher enabler or accuracy conversion card, not a generic premium attack.
- `Dodge`, `Avoid`, and `Evade`: too much of the same safety space; each should own a different decision.
- `Penetrate`: currently overloaded; should narrow into passive targeting or ranged-pierce support.

Add card families:

- `Bow setup`: mark-the-prey, line-the-shot, or next-ranged-hit windows.
- `Bow payoff`: isolated-target cashouts, backline volleys, and repeated-hit rewards.
- `Javelin setup`: commit-now cards that arm chain or pierce turns.
- `Javelin recovery`: regain guard or reset tempo after aggression.
- `Passive conversion`: crit, dodge, or mercenary-command tools that turn clean play into closing power.

### Amazon Exit Criteria

Amazon is ready to leave active card-model rescue work when:

- `Bow Volley` can form a real mark or volley plan by Act II.
- `Javelin Storm` has enough authored depth to sustain a primary-lane run.
- `Passive Tempo` improves Bow or Javelin more often than it replaces them.
- the starter deck teaches targeting, commitment, and support timing instead of mostly teaching safe rate play.

## Assassin

### Current Audit

Current live inventory in [src/content/class-cards-assassin.ts](/Users/andrew/proj/rouge/src/content/class-cards-assassin.ts):

- `17` total class cards.
- Tree split: `Martial Arts 6 / Traps 4 / Shadow 7`.
- Role split: `Setup 5 / Answer 3 / Support 1 / Payoff 7 / Salvage 1`.
- The live pool previews all three trees, but it does not yet sustain three full lanes.

Current gap summary:

- `Martial Burst` has the clearest current identity, but too many cards still read like flat attack or attack-plus-cushion instead of true setup-to-cashout sequencing.
- `Trap Field` is the thinnest live lane and matches the explicit cleanup priority in [BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md#L487).
- `Shadow Tempo` currently preserves tempo better than it closes fights; it risks becoming “play fair forever.”
- The starter environment previews Assassin fantasy, but it still under-teaches setup/payoff ratios and draw-order pressure.

### Assassin Target Feel

Assassin should be the roster's most sequencing-sensitive class.

It should support:

- one flagship burst lane built from planning and nerve
- one true delayed-control lane built from trap setup and board shaping
- one flexible tempo lane built from shadow tools, evasion, and choice density

The class should feel dangerous because the player plans turns ahead, not because every card is efficient on rate.

### Healthy Gameplay Loops

#### Martial Burst

Combat loop:

- prepare a charge or burst window
- survive or preserve position for one key turn
- cash out with a decisive martial payoff

Main decisions:

- when to hold payoff for a cleaner burst line instead of spending it for medium value
- when to spend defense or mobility on preserving the burst turn

Boss test:

- survive telegraphed punishment long enough to convert setup into a real swing turn

#### Trap Field

Combat loop:

- plant delayed threat
- stall, redirect, or shape the fight so the field matters
- convert that field into wave control or a boss stabilization window

Main decisions:

- where to spend tempo on setup versus immediate survival
- how many slow trap pieces the deck can carry before draw order collapses

Boss test:

- become a real late-game control plan instead of an Act I-II gimmick

#### Shadow Tempo

Combat loop:

- preserve hand quality and tactical options
- use evasion, clones, or command tools to absorb awkward turns
- turn clean medium-value lines into one reliable closing plan

Main decisions:

- when to spend shadow tools on safety versus on finisher setup
- how much support density the deck can hold before it stops threatening lethal

Boss test:

- prove that flexibility still ends fights on time

### Assassin Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Assassin lane can use without erasing lane identity |
| Martial Burst package | `12` | setup-to-cashout sequencing, burst preservation, and decisive finishers |
| Trap Field package | `12` | delayed pressure, stall tools, field scaling, and board-shape control |
| Shadow Tempo package | `10` | evasion, hand smoothing, clones, target control, and flexible conversion |
| Hybrid bridge cards | `8` | legal shadow splash, martial-trap transitions, and matchup tech |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-backline or anti-summon answer
  - `1` mercenary-command or target-mark card
  - `1` precise single-target fallback payoff
  - `3` flexible tempo cards that do not belong to one lane only
- `Martial Burst`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or hand-fix card
  - `1` scaling card
  - `1` finisher
  - `1` burst-preservation card
- `Trap Field`
  - `3` setup cards
  - `2` stall or answer cards
  - `2` field-scaling cards
  - `2` payoff cards
  - `1` salvage or cycle card
  - `1` boss-control card
  - `1` late field finisher
- `Shadow Tempo`
  - `3` support or setup cards
  - `2` answer cards
  - `2` salvage or hand-texture cards
  - `2` conversion cards
  - `1` finisher-enabler
- `Hybrid bridge cards`
  - `3` shadow-plus-martial support cards
  - `3` shadow-plus-trap support cards
  - `1` constrained martial-trap pivot card
  - `1` late hybrid tech card

### Authoring Rules For Assassin

#### Martial Burst

- Martial should own the clearest setup-to-payoff ratio in the roster.
- Martial setup should arm later damage, not just be an attack with a rider.
- Martial payoff should feel worth waiting for.
- Martial needs at least one card family that rewards careful hand sequencing across a full turn.
- Martial must not solve every problem with self-contained burst cards.

#### Trap Field

- Traps must feel delayed, positional, and board-shaping.
- Trap cards need enough stall and protection that playing a trap is a real plan, not a tempo punt.
- Trap payoff should include both anti-wave and anti-boss expressions.
- Trap scaling should come from field persistence, trigger multiplication, or enemy-shape manipulation.
- Trap should not become “burn AoE with different names.”

#### Shadow Tempo

- Shadow should own evasion, adaptation, clones, and tactical rescue.
- Shadow needs real hand-texture tools because this is the lane that should most care about choice density.
- Shadow should support both Martial and Trap without replacing either as a generic goodstuff package.
- Shadow needs at least one explicit closer or finisher-enabler so the lane does not stall forever.
- Shadow direct damage should stay modest unless it is part of a conversion or closing pattern.

#### Hybrid Bridges

- Shadow is the approved Assassin splash tree.
- Martial and Trap may share timing tools, but they should not blur into the same damage package.
- Hybrid cards should mostly provide setup protection, hand smoothing, target designation, or delayed payoff conversion.
- Bridge cards should keep pivots possible without removing the cost of late commitment.

### Keep, Rework, Add

Keep as anchor patterns:

- `Wake of Fire`: strong seed for the delayed-field lane.
- `Burst of Speed`: good seed for hand smoothing and tempo preservation.
- `Psychic Hammer`: useful example of a real answer card.
- `Blade Shield`: good hybrid seed for pressure plus protection plus setup.
- `Death Sentry`: good late trap payoff anchor if the lane around it gets deeper.

Rework or narrow:

- `Tiger Strike`: too flat for a flagship setup card; it should clearly arm a later cashout.
- `Fire Blast`: useful starter fantasy, but it needs to belong more clearly to a real trap plan.
- `Claw Mastery`: too close to generic rate-plus-mark; should become a martial or hybrid bridge with sharper purpose.
- `Cloak of Shadows`: too generic as pure safety; should become a real shadow choice card.
- `Cobra Strike`: should feel like a martial sustain-cashout card, not just good numbers and healing.

Add card families:

- `Martial setup`: charge, combo-counter, or next-strike arming cards.
- `Martial payoff`: burst-window cashouts and finishers.
- `Trap stall`: survive-until-trigger cards that still feel on-plan.
- `Trap scaling`: extra pulses, bigger fields, or trigger-doubling tools.
- `Shadow texture`: draw ordering, card selection, retain-style setup, or clone support.
- `Shadow conversion`: tools that turn flexibility into lethal instead of only safety.

### Assassin Exit Criteria

Assassin is ready to leave active card-model rescue work when:

- `Martial Burst` routinely produces a real setup-then-cashout turn pattern.
- `Trap Field` has enough authored depth to function as a full-run lane.
- `Shadow Tempo` produces choice-dense turns without losing a closing plan.
- the early deck teaches setup/payoff ratios and draw-order pressure instead of mostly teaching generic attack-plus-safety play.

## Barbarian

### Current Audit

Current live inventory in [src/content/class-cards-barbarian.ts](/Users/andrew/proj/rouge/src/content/class-cards-barbarian.ts):

- `21` total class cards.
- Tree split: `Combat Skills 9 / Masteries 7 / Warcries 5`.
- Role split: `Payoff 8 / Answer 5 / Support 6 / Salvage 1 / Setup 1`.
- The live tree coverage is healthier than several other classes, but the turn texture is still too flat.

Current gap summary:

- `Combat Pressure` has enough raw attacks, but not enough setup or timing language to feel smarter than “hit hard.”
- `Mastery Frontline` has stable cards, but too many still read as generic rate-plus-guard instead of weapon-identity scaling.
- `Warcry Tempo` has the right fantasy but too little authored breadth to be a full support-to-kill lane yet.
- The early audit already flags this class as missing enough setup and salvage in the opening game in [COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md#L279).

### Barbarian Target Feel

Barbarian should be the roster's weapon-first frontline class.

It should support:

- one flagship lane built around safe aggression
- one stable lane built around weapon mastery and clean draw texture
- one synergy lane built around warcries, party timing, and support-to-payoff conversion

The class should not collapse into “attack every turn.” It should ask how the run converts pressure into survivable fights.

### Healthy Gameplay Loops

#### Combat Pressure

Combat loop:

- establish a pressure turn
- sequence one setup or safety piece before the heavy swing
- keep attacking without dying to the return hit

Main decisions:

- when to press damage versus when to preserve the next attack window
- which attack turn is worth committing the deck's best payoff into

Boss test:

- hit hard without folding to telegraphed punish windows

#### Mastery Frontline

Combat loop:

- leverage weapon-aligned cards to keep hands stable
- turn mastery effects into cleaner or stronger attack turns
- outlast awkward draws while still closing fights on time

Main decisions:

- when to spend support cards on present tempo versus holding them for a better weapon turn
- how much of the deck should be reliability before it starts losing top-end damage

Boss test:

- stay steady through bad draws without becoming toothless

#### Warcry Tempo

Combat loop:

- establish party-wide control, guard, or buff structure
- use the opening created by that structure to land a real kill turn
- repeat that cadence before the fight slips into stall

Main decisions:

- when to spend a warcry for safety and when to spend it to arm a payoff turn
- how much support density the deck can hold before it stops threatening lethal

Boss test:

- avoid low-damage stall by converting buff windows into actual finishes

### Barbarian Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Barbarian lane can use without erasing lane identity |
| Combat Pressure package | `12` | safe aggression, sequencing attacks, and decisive frontline payoffs |
| Warcry Tempo package | `12` | buffs, taunts, party guard, enemy tax, and support-to-kill windows |
| Mastery Frontline package | `10` | weapon-based reliability, fewer dead turns, and stable scaling |
| Hybrid bridge cards | `8` | legal warcry or mastery splash, weapon-tech transitions, and matchup tools |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-burst or telegraph-respect answer
  - `1` anti-summon or anti-backline answer
  - `1` mercenary-support or party-support card
  - `1` precise single-target fallback payoff
  - `2` flexible tempo cards that do not belong to one lane only
- `Combat Pressure`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or redraw card
  - `1` scaling card
  - `1` finisher
  - `1` safe-aggression converter
- `Warcry Tempo`
  - `3` support or setup cards
  - `2` answer cards
  - `2` payoff-conversion cards
  - `2` party-scaling cards
  - `1` salvage card
  - `1` boss-control card
  - `1` late warcry finisher
- `Mastery Frontline`
  - `3` support or setup cards
  - `2` payoff cards
  - `2` answer cards
  - `1` salvage card
  - `1` scaling card
  - `1` weapon-family identity card
- `Hybrid bridge cards`
  - `3` mastery-plus-combat support cards
  - `3` warcry-plus-combat support cards
  - `1` mastery-plus-warcry stabilizer
  - `1` late hybrid tech card

### Authoring Rules For Barbarian

#### Combat Pressure

- Combat Skills should own the clearest safe-aggression cards in the class.
- Combat setup should arm heavier swings, not just be another attack.
- Combat payoffs should reward sequencing and pressure management.
- Combat needs at least one wave-clear finisher and one single-target boss-crack finisher.
- Combat direct damage should stop doing all the expressive work alone.

#### Mastery Frontline

- Masteries should feel like weapon-backed reliability, not passive filler.
- Mastery cards should improve attack quality, draw texture, or conversion into stronger turns.
- Masteries need one or two explicit weapon-family identity cards so the lane feels authored, not generic.
- Mastery support should help survive bad hands without replacing the need for finishers.
- Mastery should be stable, but never toothless.

#### Warcry Tempo

- Warcries should own buffs, taunts, guard, debuff pressure, and mercenary timing.
- Warcry cards need explicit support-to-payoff conversion so the lane can actually kill.
- Warcry scaling should create cadence, not only bigger block numbers.
- Warcry needs at least one card family that makes enemy intent matter.
- Warcries should be the most deckbuilder-shaped Barbarian lane, not just the defensive lane.

#### Hybrid Bridges

- Combat is the approved pressure core for both Masteries and Warcries.
- Mastery splash should mostly provide reliability, weapon texture, or efficient scaling.
- Warcry splash should mostly provide timing, protection, tax, or boss answers.
- Hybrid cards should preserve the difference between “stable pressure” and “support cadence.”

### Keep, Rework, Add

Keep as anchor patterns:

- `Howl`: good early answer seed that already respects enemy timing.
- `Battle Orders`: good late warcry anchor for party-scale support.
- `Leap`: useful seed for setup if the class gets more follow-through around it.
- `Whirlwind`: good late combat payoff anchor.
- `Battle Instinct`: good late mastery or hybrid anchor for draw-quality direction.

Rework or narrow:

- `Bash`: too generic as the flagship attack seed; should teach pressure timing, not only damage rate.
- `Sword Mastery`: too close to “good stats on one card”; should become a clearer mastery identity piece.
- `Find Potion`: useful salvage slot, but it needs a more class-shaped decision than generic healing.
- `Iron Skin` and `Natural Resistance`: too much overlapping safety space; they should diverge into different decisions.
- `Concentrate`: should feel like a safe-aggression payoff rather than just durable damage.

Add card families:

- `Combat setup`: next-attack arming, wounded-target rewards, or commit-now windows.
- `Combat conversion`: guard-to-damage, position-to-damage, or overcommit-with-cover cards.
- `Mastery identity`: weapon-family and attack-quality shaping cards.
- `Mastery salvage`: stable redraw or hand-shaping without losing tempo.
- `Warcry conversion`: buffs or tax that explicitly turn into lethal pressure.
- `Warcry cadence`: intent-reading, taunt, or party-command tools that matter in boss fights.

### Barbarian Exit Criteria

Barbarian is ready to leave active card-model rescue work when:

- `Combat Pressure` feels like smart aggression instead of raw stat racing.
- `Mastery Frontline` supports a real stable lane without becoming generic support soup.
- `Warcry Tempo` can win through support cadence instead of stalling.
- the early deck teaches setup, salvage, and pressure management instead of mostly teaching attack-plus-cushion play.

## Druid

### Current Audit

Current live inventory in [src/content/class-cards-druid.ts](/Users/andrew/proj/rouge/src/content/class-cards-druid.ts):

- `17` total class cards.
- Tree split: `Elemental 8 / Shape Shifting 4 / Summoning 5`.
- Role split: `Setup 3 / Payoff 9 / Answer 2 / Salvage 1 / Support 2`.
- The live pool already creates more texture contrast than several other classes, but the lanes are still too shallow and too payoff-heavy.

Current gap summary:

- `Elemental Storm` has the healthiest payoff spine, but it still needs more setup-to-conversion texture than raw AoE spell count.
- `Shifter Bruiser` is the thinnest authored tree and aligns with the “playable but weak” status already called out in [DRUID_LANE_PACKAGES.md](/Users/andrew/proj/rouge/docs/DRUID_LANE_PACKAGES.md).
- `Summoner Engine` has good anchor seeds, but it still risks splitting between “stalling board” and “real engine” depending on support density.
- The class in general still leans too heavily on payoff cards and does not yet have enough lane-specific salvage, bridge, and conversion tools.

### Druid Target Feel

Druid should be the roster's widest texture-change class.

It should support:

- one payoff-heavy spell lane
- one sturdy bruiser lane
- one board-engine lane

The class should feel like three genuinely different packages sharing a hero shell, not one mixed-value pile with different card names.

### Healthy Gameplay Loops

#### Elemental Storm

Combat loop:

- survive an awkward opener
- arm a typed-damage or spell-cycle window
- convert one strong elemental cycle into a major fight swing

Main decisions:

- when to spend support on surviving now versus saving it for the spell turn
- which spell cycle is worth committing reinforcement and payoff into

Boss test:

- survive long enough for the large spell turns to matter

#### Shifter Bruiser

Combat loop:

- chain durable melee turns
- use sustain or guard conversion to preserve pressure
- keep the run from becoming too fair to close

Main decisions:

- when to spend healing or guard for survival versus holding it to keep offense online
- how much support the lane needs before it stops being a bruiser deck

Boss test:

- keep enough reach that late bosses do not simply stabilize through the fair plan

#### Summoner Engine

Combat loop:

- establish one or two important board pieces
- protect the board while it starts generating value
- convert board presence into inevitability or a decisive payoff turn

Main decisions:

- when to invest in more board versus protecting the board already built
- how much non-summon support is needed before the engine becomes consistent

Boss test:

- survive the vulnerable setup turns and then force the boss to fight the board on your terms

### Druid Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Druid lane can use without erasing lane identity |
| Elemental Storm package | `12` | spell sequencing, typed-damage setup, and large elemental payoffs |
| Summoner Engine package | `12` | board setup, minion protection, scaling, and payoff conversion |
| Shifter Bruiser package | `10` | durable melee cadence, sustain, and bruiser finishers |
| Hybrid bridge cards | `8` | legal summon splash, elemental stabilization, and bruiser protection tech |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-summon or anti-backline answer
  - `1` anti-burst or telegraph-respect answer
  - `1` party-support or mercenary-support card
  - `1` precise single-target fallback payoff
  - `2` flexible tempo cards that do not belong to one lane only
- `Elemental Storm`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or cycle card
  - `1` scaling card
  - `1` finisher
  - `1` typed-damage converter
- `Summoner Engine`
  - `3` board-setup cards
  - `2` board-protection cards
  - `2` scaling cards
  - `2` payoff-conversion cards
  - `1` salvage or cycle card
  - `1` boss-stabilizer
  - `1` late engine finisher
- `Shifter Bruiser`
  - `3` setup or support cards
  - `3` payoff cards
  - `2` answer cards
  - `1` salvage card
  - `1` sustain-or-guard conversion card
- `Hybrid bridge cards`
  - `3` elemental-plus-summon support cards
  - `3` shifter-plus-summon support cards
  - `1` elemental-plus-shifter stabilizer
  - `1` late hybrid tech card

### Authoring Rules For Druid

#### Elemental Storm

- Elemental should own delayed spell payoff and typed-damage identity.
- Elemental setup should change how later spells evaluate, not just add small riders.
- Elemental needs enough cycling or bridge support that its strong turns happen on time.
- Elemental should win because one spell cycle matters, not because every spell is just a big rate card.
- Elemental support splash should mostly buy time and preserve the spell plan.

#### Shifter Bruiser

- Shape Shifting should own durable melee cadence and honest-but-not-fair pressure.
- Shifter needs more than healing and guard stapled to attacks; it needs true cadence tools and finishers.
- Shifter should feel weapon-aware and body-forward, not like generic self-heal midrange.
- Shifter support should preserve tempo, not replace the lane with summon value.
- Shifter must have at least one clear answer to the late-game “too fair” failure mode.

#### Summoner Engine

- Summoning should own board-building, board protection, and board-based payoff.
- Summon cards must distinguish between “setup body,” “support body,” and “finisher body.”
- Summoning needs explicit conversion cards that turn board presence into lethal or inevitability.
- Summoning should be the clearest engine lane in the class, not just the safest lane.
- Summon support should reward protecting and sequencing around the board already built.

#### Hybrid Bridges

- Summoning is the approved support tree for both Elemental and Shifter.
- Elemental splash should mostly provide stall, protection, or bridge damage for Summoner.
- Shifter splash should mostly provide protection, sustain, or closing help for Summoner.
- Hybrid cards should preserve the difference between spell package, bruiser package, and board engine.

### Keep, Rework, Add

Keep as anchor patterns:

- `Raven`: strong early setup seed and one of the better current starter cards in the whole roster.
- `Poison Creeper`: strong early summon-engine seed.
- `Oak Sage`: useful board-support anchor.
- `Fissure`: good midgame elemental bridge.
- `Summon Grizzly`: good late summon payoff anchor if the lane around it gets deeper.

Rework or narrow:

- `Firestorm`: useful starter fantasy, but it needs a clearer role in an actual spell-cycle plan.
- `Werewolf`: too much of its identity is just good numbers plus sustain; it needs a more authored bruiser role.
- `Lycanthropy`: currently reads as generic smoothing and should become a more class-shaped bruiser support card.
- `Cyclone Armor`: solid answer slot, but it can do more to support elemental timing specifically.
- `Tornado`: needs more lane-defining purpose than “large AoE damage.”

Add card families:

- `Elemental setup`: attunement, next-spell arming, or typed-damage sequencing cards.
- `Elemental conversion`: burn or storm states that cash into larger spell turns.
- `Shifter cadence`: attack-chain and sustain-preservation cards.
- `Shifter reach`: bruiser finishers and anti-stall closers.
- `Summon protection`: keep-the-board-alive cards.
- `Summon conversion`: cards that turn board presence into burst, scaling, or inevitability.

### Druid Exit Criteria

Druid is ready to leave active card-model rescue work when:

- `Elemental Storm` produces a real setup-then-spell-cycle identity instead of just stacked AoE.
- `Shifter Bruiser` stops being the “playable but weak” lane and gains enough authored depth to close boss fights.
- `Summoner Engine` can reliably become a real board engine instead of a stall package.
- the class teaches three clearly different package textures by Act II: spell package, bruiser package, and board engine.

## Necromancer

### Current Audit

Current live inventory in [src/content/class-cards-necromancer.ts](/Users/andrew/proj/rouge/src/content/class-cards-necromancer.ts):

- `17` total class cards.
- Tree split: `Poison and Bone 8 / Curses 4 / Summoning 5`.
- Role split: `Payoff 7 / Answer 3 / Support 5 / Setup 1 / Salvage 1`.
- The live pool clearly previews the class fantasy, but it is still too shallow and too payoff-biased for the most deliberate setup class in the roster.

Current gap summary:

- `Bone Burst` has the clearest current payoff spine, but it still lacks enough authored setup and burst-window language.
- `Curse Control` is too thin to feel like a full lane and still risks proving the guide warning that control alone is not a win condition.
- `Summon Swarm` has good anchors, but it still needs more explicit board-protection and board-to-payoff conversion.
- Across the class, true setup is under-authored: there is only one live `setup` card in the role audit, which is much too low for Necromancer's intended identity.

### Necromancer Target Feel

Necromancer should be the roster's most deliberate setup class.

It should support:

- one flagship lane built around control-then-burst
- one tactical lane built around curses and attrition control
- one engine lane built around minion presence and board sequencing

The class should not feel like generic caster value with undead art on top. It should feel like the player is preparing a kill condition.

### Healthy Gameplay Loops

#### Bone Burst

Combat loop:

- weaken or shape the fight first
- line up one clean damage window
- detonate that window with a bone or poison payoff

Main decisions:

- when to spend a payoff card early for tempo versus holding it for the real burst turn
- how much setup is enough before the deck starts losing closing speed

Boss test:

- line up a finishing sequence before the boss overwhelms the setup

#### Curse Control

Combat loop:

- weaken the enemy's ability to race
- buy time through curses, tax, and tactical support
- convert that control into inevitability or a safe kill sequence

Main decisions:

- when to spend curses for immediate survival versus for the future cashout turn
- how much finishing support the lane needs before it stops being pure delay

Boss test:

- prove that control becomes a real answer, not just delayed defeat

#### Summon Swarm

Combat loop:

- establish one or two key minions
- protect and reinforce the board
- convert minion presence into scaling pressure or a decisive close

Main decisions:

- when to invest in more summons versus protecting the ones already online
- how much off-tree support is needed before the engine becomes reliable

Boss test:

- survive the vulnerable setup turns and then let the boss lose to the board state

### Necromancer Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Necromancer lane can use without erasing lane identity |
| Bone Burst package | `12` | setup-to-detonation sequencing, bone payoff, and clean kill windows |
| Summon Swarm package | `12` | minion setup, board protection, scaling, and board-to-payoff conversion |
| Curse Control package | `10` | tax, weakness, attrition pressure, and control-to-kill tools |
| Hybrid bridge cards | `8` | legal curse splash, summon stabilization, and bone-close support |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-summon or anti-backline answer
  - `1` anti-burst or telegraph-respect answer
  - `1` mercenary-mark or target-designation card
  - `1` precise single-target fallback payoff
  - `2` flexible tempo cards that do not belong to one lane only
- `Bone Burst`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or cycle card
  - `1` scaling card
  - `1` finisher
  - `1` burst-window converter
- `Summon Swarm`
  - `3` board-setup cards
  - `2` board-protection cards
  - `2` scaling cards
  - `2` payoff-conversion cards
  - `1` salvage or cycle card
  - `1` boss-stabilizer
  - `1` late summon finisher
- `Curse Control`
  - `3` curse or tax cards
  - `2` answer cards
  - `2` control-to-payoff conversion cards
  - `1` salvage card
  - `1` support card
  - `1` finisher-enabler
- `Hybrid bridge cards`
  - `3` curse-plus-bone support cards
  - `3` curse-plus-summon support cards
  - `1` summon-plus-bone stabilizer
  - `1` late hybrid tech card

### Authoring Rules For Necromancer

#### Bone Burst

- Poison and Bone should own the clearest setup-then-detonate pattern in the class.
- Bone setup should create kill windows, not just be another direct-damage spell.
- Bone payoffs should feel worth the waiting and support around them.
- Bone needs enough cycling and target-shaping that the burst can arrive on time.
- Bone direct damage should not carry the whole lane without support from setup or curses.

#### Curse Control

- Curses should own weakening, tax, target designation, and control pressure.
- Curse cards need explicit conversion into lethal or inevitability so the lane can actually end fights.
- Curses should help both Bone Burst and Summon Swarm without collapsing into generic utility soup.
- Curse scaling should make long fights feel increasingly controlled, not just increasingly slow.
- Curse direct damage should stay secondary to control and conversion.

#### Summon Swarm

- Summoning should own board presence, board protection, and minion-based payoff.
- Summon cards must distinguish between cheap setup bodies, support bodies, and closer bodies.
- Summoning needs explicit board-to-payoff conversion so the lane is not only passive sustain.
- Summoning should feel like a real engine lane, not a stall package with occasional damage.
- Summon support should reward sequencing around the board that already exists.

#### Hybrid Bridges

- Curses are the approved support tree for both Bone Burst and Summon Swarm.
- Bone splash should mostly provide close tools and tactical answers for Curses and Summons.
- Summon splash should mostly provide board stabilization and inevitability support.
- Hybrid cards should preserve the difference between tactical control, burst setup, and board engine.

### Keep, Rework, Add

Keep as anchor patterns:

- `Raise Skeleton`: one of the best early setup seeds already in the repo.
- `Clay Golem`: useful board-protection and answer anchor.
- `Amplify Damage`: good curse-support seed.
- `Skeletal Mage`: good hybrid summon-payoff anchor.
- `Bone Spirit`: good late bone finisher anchor.

Rework or narrow:

- `Teeth`: too generic as the opening bone card; it should point toward a burst lane, not just be rate.
- `Bone Armor` and `Bone Wall`: useful answer space, but they need sharper distinction from one another.
- `Corpse Explosion`: flavorful, but it needs a clearer role inside an actual control or payoff plan.
- `Life Tap`: too much generic smoothing for a class that should care more about setup timing.
- `Iron Maiden`: should feel more like a true curse-control or conversion card than a light support rider.

Add card families:

- `Bone setup`: corpse-state, next-spell arming, or burst-window preparation cards.
- `Bone conversion`: curse-to-burst and setup-to-detonation cards.
- `Curse tax`: enemy weakening and pressure-management cards.
- `Curse kill`: tools that convert control into inevitability or lethal.
- `Summon protection`: keep-the-board-alive cards.
- `Summon conversion`: cards that turn minion count or minion attacks into a closer.

### Necromancer Exit Criteria

Necromancer is ready to leave active card-model rescue work when:

- `Bone Burst` routinely produces a real control-then-detonate turn pattern.
- `Curse Control` can win through tactical control without becoming “stall and hope.”
- `Summon Swarm` becomes a true board engine instead of only a survivability package.
- the class teaches setup timing, control conversion, and board sequencing by Act II instead of mostly teaching generic caster rates with undead support.

## Paladin

### Current Audit

Current live inventory in [src/content/class-cards-paladin.ts](/Users/andrew/proj/rouge/src/content/class-cards-paladin.ts):

- `17` total class cards.
- Tree split: `Combat 7 / Offensive Auras 5 / Defensive Auras 5`.
- Role split: `Payoff 7 / Setup 4 / Support 3 / Salvage 1 / Answer 2`.
- The known undefined metadata drift is fixed, but the live pool still leans too heavily on safe-rate payoff cards relative to real aura engines.

Current gap summary:

- `Combat Zeal` has the clearest current lane shape, but too many early cards still read as “numbers with a cushion” instead of pressure-with-structure.
- `Offensive Aura` has the right fantasy, but it still lacks enough authored build-around density to feel like a real lane.
- `Defensive Anchor` can survive, but it still risks proving the class-guide warning that safety without payoff is not enough.
- The broader combat audit already flags Paladin as lacking enough early conditional or stateful offense in [COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md#L280).
- Metadata cleanup is part of the lane work here: `Sacrifice`, `Smite`, `Holy Bolt`, `Zeal`, `Vengeance`, `Blessed Hammer`, and `Fist of the Heavens` still need complete role or reward or splash tagging before the reward model can fully express the design.

### Paladin Target Feel

Paladin should be the roster's most readable “safe but proactive” class.

It should support:

- one learnable lane built around repeated attacks with aura cover
- one build-around lane where aura structure turns ordinary attacks into major turns
- one anchor lane where defense becomes inevitability instead of passive delay

The class should feel righteous, stable, and legible, but still punish runs that never build a real closing plan.

### Healthy Gameplay Loops

#### Combat Zeal

Combat loop:

- establish a safe attack cadence
- use aura support to keep swinging through enemy pressure
- convert repeated attack turns into a clean finish before the fight drags

Main decisions:

- when to push one more attack versus when to preserve position for the next cycle
- which support effects are worth spending on this turn versus saving for the real pressure turn

Boss test:

- keep the pressure on without overattacking into telegraphed spikes

#### Offensive Aura

Combat loop:

- establish one or two real aura pieces
- leverage those auras to make ordinary attacks suddenly threatening
- maintain engine uptime long enough for the payoff turns to matter

Main decisions:

- when to take a slower aura-setup turn versus when to attack immediately
- how much attack density the lane needs before more aura support stops being worth it

Boss test:

- make the aura engine matter before the boss overwhelms the setup

#### Defensive Anchor

Combat loop:

- stabilize the party and weather the enemy plan
- use defensive aura structure to buy safe offensive windows
- convert survivability into inevitability instead of drift

Main decisions:

- when to spend defense simply to survive versus when to bank it for a stronger conversion turn
- how much payoff the deck needs before long-fight stability becomes stall

Boss test:

- answer burst windows while still ending the fight in time

### Paladin Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Paladin lane can use without erasing lane identity |
| Combat Zeal package | `12` | repeated attacks, safe cadence, and melee conversion payoffs |
| Offensive Aura package | `12` | aura setup, aura scaling, and attack-engine build-arounds |
| Defensive Anchor package | `10` | survivability, defensive structure, and defense-to-kill conversion |
| Hybrid bridge cards | `8` | legal combat or aura splash, party support, and matchup tools |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-burst or telegraph-respect answer
  - `1` anti-summon or anti-backline answer
  - `1` mercenary-support or party-support card
  - `1` precise single-target fallback payoff
  - `2` flexible tempo cards that do not belong to one lane only
- `Combat Zeal`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or cycle card
  - `1` scaling card
  - `1` finisher
  - `1` cadence-preservation card
- `Offensive Aura`
  - `3` aura-setup cards
  - `2` attack-support cards
  - `2` scaling cards
  - `2` payoff-conversion cards
  - `1` salvage or cycle card
  - `1` boss-engine stabilizer
  - `1` late aura finisher
- `Defensive Anchor`
  - `3` support or setup cards
  - `2` answer cards
  - `2` conversion cards
  - `1` salvage card
  - `1` payoff card
  - `1` inevitability tool
- `Hybrid bridge cards`
  - `3` combat-plus-offensive-aura support cards
  - `3` combat-plus-defensive-aura support cards
  - `1` offensive-plus-defensive-aura stabilizer
  - `1` late hybrid tech card

### Authoring Rules For Paladin

#### Combat Zeal

- Combat should own the clearest repeated-attack lane in the class.
- Combat setup should make later attacks safer or more rewarding, not just be another hit.
- Combat payoffs should reward cadence and discipline, not pure stat racing.
- Combat needs at least one finisher that feels earned by prior safe aggression.
- Combat should teach the player when to stop attacking, not just how to attack more.

#### Offensive Aura

- Offensive Auras should own build-around scaling and stateful offense.
- Aura cards need enough attack-facing support that the lane is not just passive buffs and pretty text.
- Offensive Aura should make normal combat cards evaluate differently when the engine is online.
- The lane needs explicit “aura is active, now cash it in” cards.
- Offensive Aura should be Paladin's most synergy-sensitive lane, not its safest lane.

#### Defensive Anchor

- Defensive Auras should own survivability, party shielding, and burst-window answers.
- Defensive cards need explicit defense-to-payoff conversion so the lane can close.
- Defensive Anchor should win by inevitability and structure, not by refusing to die forever.
- Defensive support should make boss telegraphs easier to solve, not erase the need to solve them.
- Defensive direct damage should stay secondary unless it is part of a conversion pattern.

#### Hybrid Bridges

- Combat is the approved pressure core for both aura trees.
- Offensive Aura splash should mostly provide scaling, attack enhancement, or stateful offense.
- Defensive Aura splash should mostly provide survivability, protection, and telegraph-respect tools.
- Hybrid cards should preserve the difference between “safe attack cadence,” “aura engine,” and “defensive inevitability.”

### Keep, Rework, Add

Keep as anchor patterns:

- `Might`: good early setup seed that already hints at support plus pressure.
- `Holy Fire`: useful offensive-aura bridge.
- `Holy Freeze`: good defensive-aura payoff anchor.
- `Holy Shield`: useful defense-plus-pressure anchor.
- `Conviction`: good late offensive-aura finisher anchor.

Rework or narrow:

- `Sacrifice`: too generic as an opening flagship attack; it should teach a class-specific risk or cadence rule.
- `Smite`: currently too plain and under-tagged; it should become a clearer combat or defensive bridge piece.
- `Prayer` and `Cleansing`: too much overlapping sustain space; they should support different decisions.
- `Holy Bolt`: needs a clearer lane role than “damage plus a little heal.”
- `Blessed Hammer`: flavorful, but it needs a clearer engine or payoff identity than generic AoE magic damage.

Add card families:

- `Combat cadence`: repeated-attack setup and safe-aggression cards.
- `Combat conversion`: aura-backed melee cashouts and finisher tools.
- `Offensive aura setup`: state-establishing cards that make attacks matter more.
- `Offensive aura payoff`: attack-engine and scaling cashout cards.
- `Defensive conversion`: guard or protection into damage or inevitability cards.
- `Defensive anchor`: boss-answer and attrition-control cards that still progress the kill.

### Paladin Exit Criteria

Paladin is ready to leave active card-model rescue work when:

- `Combat Zeal` teaches disciplined repeated attacks instead of mostly teaching safe rate cards.
- `Offensive Aura` becomes a real build-around lane with enough attack-engine density.
- `Defensive Anchor` wins through structured inevitability instead of passive stall.
- the early deck teaches stateful or conditional offense by Act II, and Paladin card metadata is complete enough for the reward model to reflect those lanes accurately.

## Sorceress

### Current Audit

Current live inventory in [src/content/class-cards-sorceress.ts](/Users/andrew/proj/rouge/src/content/class-cards-sorceress.ts):

- `17` total class cards.
- Tree split: `Cold 5 / Fire 6 / Lightning 6`.
- Role split: `Setup 6 / Answer 3 / Support 1 / Payoff 6 / Salvage 1`.
- The known undefined metadata drift is fixed, but the live pool still needs much clearer spell-engine texture and lane-specific closers.

Current gap summary:

- `Fire Burst` has the clearest current payoff route, but too many fire cards still rely on sustain smoothing instead of real setup-to-explode sequencing.
- `Cold Control` has the right denial fantasy, but it still risks drafting too much safety without enough close tools.
- `Lightning Tempo` has the right volatility fantasy, but it still lacks enough authored hand-texture and acceleration identity.
- The broader combat audit already calls out Sorceress as having element flavor but too much generic sustain smoothing in [COMBAT_DECISION_AUDIT.md](/Users/andrew/proj/rouge/docs/COMBAT_DECISION_AUDIT.md#L282).
- Metadata cleanup is part of the lane work here: `Ice Bolt`, `Charged Bolt`, `Frost Nova`, `Static Field`, `Chain Lightning`, and `Lightning Mastery` still need complete role or reward or splash tagging before the reward model can express the intended lane map cleanly.

### Sorceress Target Feel

Sorceress should be the roster's clearest spell-engine class.

It should support:

- one flagship lane built around delayed explosive fire payoff
- one control lane built around cold denial and safe conversion
- one volatile lane built around lightning tempo, draw texture, and acceleration

The class should care more than most about hand quality, timing, and whether the player has actually built an engine instead of just collecting strong spells.

### Healthy Gameplay Loops

#### Fire Burst

Combat loop:

- survive the vulnerable setup turn
- stack burn or fire-state pressure
- cash that setup into one major explosive turn

Main decisions:

- when to spend a fire payoff now versus wait for the stronger ignition window
- how much safety the deck needs before it starts diluting its payoff core

Boss test:

- survive long enough to convert payoff turns into an actual kill sequence

#### Cold Control

Combat loop:

- deny enemy tempo through slow or freeze tools
- stabilize behind that denial
- convert the safe board state into a clean close

Main decisions:

- when to spend control to survive now versus save it for the scariest enemy turn
- how many safety cards the lane can hold before it starts losing kill pressure

Boss test:

- keep the fight safe without overdrafting control and failing to finish

#### Lightning Tempo

Combat loop:

- improve hand quality and sequencing
- convert draw or energy acceleration into swing turns
- leverage volatility without assuming the perfect turn always appears

Main decisions:

- when to spend a tempo tool for immediate stability versus hold it for the high-value chain turn
- how much payoff the lane needs before more draw or acceleration stops being worth it

Boss test:

- manage volatility well enough that the lane feels skillful instead of random

### Sorceress Package Target

Working target: `50` class cards

| Package | Target Count | Purpose |
|---|---:|---|
| Class glue | `8` | cards any Sorceress lane can use without erasing lane identity |
| Fire Burst package | `12` | burn setup, delayed explosive turns, and fire payoff engines |
| Lightning Tempo package | `12` | draw texture, acceleration, sequencing, and volatile swing turns |
| Cold Control package | `10` | denial, stabilization, and safe close tools |
| Hybrid bridge cards | `8` | legal dual-element tech, control bridges, and matchup tools |

Recommended package rules:

- `Class glue`
  - `1` salvage card
  - `1` recovery card
  - `1` anti-summon or anti-backline answer
  - `1` anti-burst or telegraph-respect answer
  - `1` hand-quality or cycle card
  - `1` precise single-target fallback payoff
  - `2` flexible tempo cards that do not belong to one lane only
- `Fire Burst`
  - `3` setup cards
  - `4` payoff cards
  - `1` answer card
  - `1` salvage or cycle card
  - `1` scaling card
  - `1` finisher
  - `1` fire-state converter
- `Lightning Tempo`
  - `3` acceleration or texture cards
  - `2` payoff cards
  - `2` answer cards
  - `2` sequencing or conversion cards
  - `1` salvage card
  - `1` boss-stabilizer
  - `1` late lightning finisher
- `Cold Control`
  - `3` control or setup cards
  - `2` answer cards
  - `2` payoff-conversion cards
  - `1` salvage card
  - `1` support card
  - `1` finisher-enabler
- `Hybrid bridge cards`
  - `3` cold-plus-lightning support cards
  - `2` fire-plus-lightning support cards
  - `1` fire-plus-cold stabilizer
  - `2` late dual-element tech cards

### Authoring Rules For Sorceress

#### Fire Burst

- Fire should own delayed payoff and explosive close tools.
- Fire setup should create a later detonation window, not just add damage and burn on the same card.
- Fire cards need enough bridge support that the lane can survive to its best turns without becoming sustain soup.
- Fire payoffs should feel earned by prior sequencing and setup.
- Fire support should preserve the engine, not replace it.

#### Cold Control

- Cold should own freeze, slow, denial, and safe-board-state creation.
- Cold control needs explicit close tools so the lane does not become “stall forever.”
- Cold should reward precision and timing, not just raw defensive density.
- Cold support should help convert control into lethal, not just prolong the fight.
- Cold direct damage should stay secondary to its denial role unless it is part of a close pattern.

#### Lightning Tempo

- Lightning should own draw texture, acceleration, sequencing, and volatile swing turns.
- Lightning needs real hand-quality tools, because this is the class lane that should care most about card flow.
- Lightning should feel like the most variance-sensitive lane in the roster, but still controllable with skill.
- Lightning payoffs should reward careful setup of the chain turn rather than generic AoE rates.
- Lightning should be the one class lane where limited dual-element damage tech is acceptable, but only as constrained tech, not as routine goodstuff.

#### Hybrid Bridges

- Lightning is the approved support tree for both Fire Burst and Cold Control.
- Cold-plus-lightning bridges should mostly provide control, texture, or safe acceleration.
- Fire-plus-lightning bridges should mostly provide payoff timing and chain-turn support.
- Dual-element bridges must stay clearly support or tech oriented unless they are explicit late-game payoff exceptions.

### Keep, Rework, Add

Keep as anchor patterns:

- `Static Field`: strong seed for lightning setup and swing-turn structure.
- `Teleport`: good hand-texture anchor.
- `Meteor`: useful fire payoff anchor if the lane around it becomes more setup-driven.
- `Frozen Orb`: good late cold payoff anchor.
- `Hydra`: good late fire finisher anchor.

Rework or narrow:

- `Ice Bolt`: too plain and under-tagged; it should clearly teach cold timing and denial.
- `Charged Bolt`: needs a clearer lightning-tempo role than generic damage plus paralyze.
- `Warmth` and `Frozen Armor`: too much of Sorceress early identity is generic safety smoothing.
- `Fireball`: should feel more like a fire-engine bridge than a self-contained premium rate spell.
- `Chain Lightning`: needs a clearer lane role than generic multi-target lightning damage.

Add card families:

- `Fire setup`: ignite, burn-threshold, and next-spell arming cards.
- `Fire conversion`: cards that cash accumulated fire state into a decisive turn.
- `Cold denial`: freeze or slow control packages that lead to a close.
- `Cold close`: tools that turn the safe board state into lethal.
- `Lightning texture`: draw, selection, hand-ordering, or energy-tempo cards.
- `Lightning swing`: cards that reward getting the chain turn exactly right.

### Sorceress Exit Criteria

Sorceress is ready to leave active card-model rescue work when:

- `Fire Burst` produces a real setup-then-explode spell-engine pattern.
- `Cold Control` can reliably close after stabilizing the fight.
- `Lightning Tempo` gains enough authored hand-texture and acceleration support to feel like a real lane.
- the early deck teaches hand texture, timing, and engine building by Act II, and Sorceress card metadata is complete enough for the reward model to surface those lanes accurately.
