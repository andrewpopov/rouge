# Skill Taxonomy

_Snapshot: 2026-04-06_

## Purpose

This document defines the canonical skill families for Rouge's fixed skill bar.

It answers:

- what kinds of skills Rouge should have
- what each skill family is for
- what should live on the skill bar versus in the deck
- how classes should combine these families differently

Use it together with:

- [SKILL_ACTION_SURFACE_SYNTHESIS.md](/Users/andrew/proj/rouge/docs/SKILL_ACTION_SURFACE_SYNTHESIS.md)
- [CORE_SKILL_SYSTEM_SPEC.md](/Users/andrew/proj/rouge/docs/CORE_SKILL_SYSTEM_SPEC.md)
- [CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md)

This is a design taxonomy, not an implementation commitment.

## Primary Design Anchors

This taxonomy should be interpreted mainly through:

- `Slay the Spire`
- `Monster Train`

Their roles are different:

- _Slay the Spire_ is the main reminder that fixed skills should not steal card-state complexity from the deck
- _Monster Train_ is the main reminder that fixed skills and persistent combat systems should make engines and package identity easier to read

The other reviewed games are useful secondary checks, but they should not outweigh these two when the docs conflict in spirit.

## Working Rule

Fixed skills should do one of three things:

- establish a combat context
- command the party or answer a fight ask
- open a payoff window for deck cards to exploit

They should **not** become a second hand of pseudo-cards.

If a mechanic is mainly interesting because it interacts with:

- draw order
- discard
- retain
- temporary card upgrades
- temporary card costs
- generated cards

then it belongs in the deck, not on the fixed skill bar.

That is the core StS lesson.

The core Monster Train lesson is the complement:

- fixed skills are allowed to establish persistent engine state
- fixed skills are allowed to name and arm package hooks
- fixed skills should make the build's operating language more legible, not more noisy

## The Seven Rouge Skill Families

### 1. State Skills

Purpose:

- establish a class-owned combat state that changes card evaluation

What they do:

- arm a mastery window
- enter a shadow state
- prime an elemental attunement
- sanctify the party
- open a warcry or zeal state

Why they belong on the skill bar:

- they create reliable class identity
- they are stronger when always available
- they make deck cards context-sensitive without replacing them
- they create readable engine state in the Monster Train sense without needing extra board clutter

Good upgrade directions:

- longer duration
- wider ally coverage
- stronger secondary rule
- added trigger interaction

Bad upgrade directions:

- only more damage

### 2. Command Skills

Purpose:

- direct the mercenary, summons, or the whole party

What they do:

- direct focus onto one target
- arm the next mercenary hit
- improve the next summon or minion turn
- grant party-wide protection
- designate a payoff target for allied actions

Why they belong on the skill bar:

- Rouge is party-based
- command is more interesting when reliable
- these effects create coordination instead of standalone damage buttons
- they give the build a visible operating language instead of hiding all synergy in card text

Good upgrade directions:

- broader party impact
- stronger ally trigger interaction
- better target designation
- added support rider

### 3. Answer Skills

Purpose:

- reliably answer encounter asks that the deck should not always have to overfit around

What they do:

- stabilize against fire pressure
- interrupt summoning or backline screens
- answer telegraphed burst
- buy one turn against attrition
- give emergency life or guard stabilization

Why they belong on the skill bar:

- boss asks should be answerable without turning every deck into generic goodstuff
- reliable answer tools let decks stay specialized

Good upgrade directions:

- narrower but stronger answer identity
- better boss utility
- improved party coverage

### 4. Trigger-Arming Skills

Purpose:

- set a short rule hook that deck cards can exploit immediately after

What they do:

- your next attack does something extra
- your next summon gains a new rider
- your next status application spreads
- your next mercenary hit cashes out a mark
- your next elemental card converts defense into offense

Why they belong on the skill bar:

- they create combo texture without replacing card play
- they make sequencing matter
- they are one of the safest ways to deepen skills
- they let Rouge borrow StS-style sequencing tension without turning the skill bar into pseudo-cards

Good upgrade directions:

- more trigger scope
- two-card window instead of one-card window
- better cross-tree synergy

### 5. Conversion Skills

Purpose:

- convert one combat resource or state into another

What they do:

- turn guard into pressure
- turn marks into spread damage
- turn status stacks into a burst window
- turn summoned presence into protection
- turn a defensive state into a payoff state

Why they belong on the skill bar:

- they create class-specific resource language
- they help bridge support and payoff without needing card-state complexity on skills
- they support Monster Train-style package readability by making the engine's cash-out step explicit

Good upgrade directions:

- cleaner conversion ratio
- added rider on cash-out
- improved multi-actor interaction

### 6. Recovery Skills

Purpose:

- rescue a bad turn, restore tempo, or reset a failing board state

What they do:

- emergency heal or cleanse
- recover the mercenary
- resummon or reinforce a key ally
- reset a pressure pattern briefly
- patch a hand-neutral turn with one reliable stabilizer

Why they belong on the skill bar:

- recovery is most valuable when dependable
- this lets the deck stay proactive without becoming too fragile

Good upgrade directions:

- better tempo-neutral recovery
- recovery plus one setup rider
- ally-inclusive stabilization

### 7. Commitment Skills

Purpose:

- create one high-commitment, limited-use moment that defines a fight

What they do:

- once-per-battle engine starter
- short power spike that must be timed well
- limited-charge reset or offensive commitment
- capstone combat stance

Why they belong on the skill bar:

- these are identity-defining moments
- they feel better as reliable class signatures than as random draws
- they let Rouge borrow Monster Train's high-commitment engine beats without copying its floor system

Good upgrade directions:

- stronger identity shift
- better payoff conversion
- cleaner downside or cooldown profile

## What Skills Should Not Be

Fixed skills should not be:

- generic damage nukes with no surrounding context
- mini deck cards that happen to ignore draw
- the main source of hand manipulation
- the main source of temporary card upgrades
- the main source of generated cards
- overloaded boss-answer plus payoff plus sustain buttons

If a skill does too many jobs, the deck loses importance.

## Slot Guidance

Rouge should usually build skill bars out of complementary families, not three unrelated actives.

### Slot 1: Identity Slot

Best families:

- `State`
- `Command`

This slot should tell the player what kind of class they are piloting before the first draw.

### Slot 2: Tactical Slot

Best families:

- `Answer`
- `Trigger-Arming`
- `Recovery`

This slot should help the player solve immediate combat asks.

### Slot 3: Commitment Slot

Best families:

- `Commitment`
- `Conversion`

This slot should be the high-signal payoff or engine-defining action.

## Class Bias Map

Each class should use the taxonomy differently.

### Amazon

Primary families:

- `Command`
- `Answer`
- `Trigger-Arming`

Why:

- Amazon should feel precise, ranged, and tactically disciplined
- her skill bar should help target selection, lane control, and payoff timing

### Assassin

Primary families:

- `State`
- `Trigger-Arming`
- `Conversion`

Why:

- Assassin wants hidden setup, cash-out timing, and short shadow windows

### Barbarian

Primary families:

- `State`
- `Answer`
- `Commitment`

Why:

- Barbarian should feel like controlled aggression and momentum
- the bar should create mastery windows and reliable pressure valves

### Druid

Primary families:

- `State`
- `Command`
- `Trigger-Arming`

Why:

- Druid wants attunement, summon support, and shape or nature-state setup

### Necromancer

Primary families:

- `Command`
- `Conversion`
- `Recovery`

Why:

- Necromancer should feel like corpse, summon, and attrition control
- the bar should help manage board presence and convert death into value

### Paladin

Primary families:

- `State`
- `Answer`
- `Command`

Why:

- Paladin should feel like conviction, sanctity, and party leadership
- support and answer identity should be very strong here

### Sorceress

Primary families:

- `State`
- `Conversion`
- `Commitment`

Why:

- Sorceress should feel like attunement and elemental cash-out windows
- the bar should create spell contexts rather than replace spell cards

## Upgrade Rule

Skill upgrades should more often add behavior than pure numbers.

Good skill-upgrade examples:

- now affects the whole party
- now arms your next two cards instead of one
- now converts a status into a different payoff
- now creates a stronger state with a shorter window
- now adds a boss-answer rider

Weak skill-upgrade examples:

- same skill, plus `3` damage
- same skill, plus `2` guard
- same skill, plus `1` heal

Number upgrades are fine, but they should usually support a behavior change.

## Apply / Avoid / Study Later

### Apply

- `State`
- `Command`
- `Answer`
- `Trigger-Arming`
- `Conversion`
- `Recovery`
- `Commitment`

### Avoid

- card-lifecycle mechanics on skills
- hand-wide temporary upgrades on skills
- large pile-manipulation systems on skills
- random generated-card spam on skills
- literal imports of benchmark-specific geometry systems

### Study Later

- whether `Recovery` should stay a separate family or be embedded into `Answer`
- whether `Conversion` belongs in all classes or only certain class fantasies
- whether `Commitment` should mean once-per-battle, charge-based, or both
- how much mercenary and minion command should share one rules language

## Bottom Line

Rouge does not need dozens of skill types.

It needs a small, stable taxonomy that makes the skill bar:

- reliable
- class-defining
- strategically expressive
- clearly different from the deck

These seven families are enough to give Rouge strong skill identity without letting the skill bar replace deck play.
