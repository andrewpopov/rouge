# Core Skill System Spec

_Snapshot: 2026-04-06_

## Purpose

This document defines Rouge's approved target model for core skills.

It answers:

- what core skills are for
- how core skills relate to class trees and deck cards
- what belongs in each core slot
- what power budget core skills should obey
- what runtime and data-model changes should support the system
- how to migrate away from shared card or skill duplication

Use it with:

- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [SKILL_ACTION_SURFACE_SYNTHESIS.md](/Users/andrew/proj/rouge/docs/SKILL_ACTION_SURFACE_SYNTHESIS.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [SAFE_ZONE_TRAINING_RUNTIME_MODEL.md](/Users/andrew/proj/rouge/docs/SAFE_ZONE_TRAINING_RUNTIME_MODEL.md)
- [D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md)

This is target direction, not a claim that the live runtime already satisfies every rule here.

## Decision Summary

Rouge should treat core skills as:

- fixed-skill-bar actions
- low-cost, low-direct-impact floor-raisers
- a separate combat surface from deck cards
- still owned by class trees for unlocks, specialization, and build identity

Approved direction:

- core skills should **not** share ids or exact behaviors with cards
- core skills should live in a dedicated skill catalog, not in the deck-card pool
- class trees should still determine which core skills unlock and which late skills become eligible
- the deck should remain the main throughput, combo, and payoff surface

In other words:

- tree ownership stays shared
- combat surface stays separate

That is the clean answer to the current confusion.

Rouge should not treat slot skills as just "cards that bypass draw."

Rouge should treat them as reliable class-owned context setters, answer buttons, and payoff-window openers that keep bad draws from collapsing the whole turn.

## Core Skill Job

Core skills should do four things well:

- raise the floor on weak or awkward hands
- make class identity visible before the first draw
- provide reliable tactical answers without forcing every deck to overfit around them
- create short windows or states that deck cards exploit

Core skills should be valuable at almost any point in a fight, but they should not become the main reason the player wins the fight.

The healthy mental model is:

- core skills create context
- cards exploit context

## What Core Skills Are Not

Core skills should not become:

- the highest raw-damage buttons in the build
- the main source of draw or discard manipulation
- the main source of generated cards
- generic always-press-on-cooldown value buttons
- a second hand that makes deck quality stop mattering
- random reward outcomes

If a mechanic is interesting mainly because it manipulates:

- draw order
- retain
- exhaust
- discard or recover loops
- temporary card costs
- temporary card upgrades

then it belongs on deck cards, not on core skills.

## Relationship To Trees

Core skills should tie to class trees, but they should not hard-lock the run too early.

Rules:

- every core skill belongs to one class tree
- tree investment unlocks later core-skill pools
- bridge skills are the main place where utility splash is allowed
- capstone core skills should require real tree commitment
- the starter core skill should establish class identity before it establishes a fully committed lane

This means Rouge should support:

- `3` real tree paths per class across runs
- branching and light utility splash inside a run
- one dominant lane by the time the run reaches capstone territory

This matches the specialization rule in [D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md).

## Separate Pool, Shared Ownership

Rouge should keep a dedicated core-skill catalog.

That catalog should be:

- separate from the deck-card catalog
- surfaced through training and the skill bar
- organized under class trees

Do **not** use one shared authored object for both a card and a core skill.

Do **not** reuse ids between the card surface and the core-skill surface.

If a card wants to reference a core-skill concept, use metadata such as:

- `skillRef`
- shared tags
- shared tree or family identifiers

But keep the authored gameplay objects separate.

## Slot Contract

### Slot 1: Identity Floor

Job:

- provide one always-available class-owned action
- teach the class from fight one
- make bad opening draws less punishing

Guidelines:

- usually `0-1` cost
- usually `1-2` cooldown
- usually low direct damage or low direct guard
- should mostly be `State`, `Command`, `Answer`, or `Trigger-Arming`

Avoid:

- best-in-class damage
- a full defensive reset
- a lane-commitment lock by itself

### Slot 2: Tactical Bridge

Job:

- provide the first meaningful answer or bridge tool
- let the player add utility splash or lean toward a lane
- solve a real combat problem without replacing the deck

Guidelines:

- usually `1` cost
- usually `2-3` cooldown
- may be `Answer`, `Command`, `Recovery`, `Trigger-Arming`, or narrow `Conversion`
- should usually help the next `1-2` cards or the next enemy cycle matter more

Avoid:

- a second starter skill with bigger numbers
- a mini-capstone
- broad generic throughput

### Slot 3: Commitment Window

Job:

- mark the committed lane
- create one meaningful payoff window
- reward timing and tree investment

Guidelines:

- usually `1-2` cost
- usually `2-4` cooldown or limited-charge
- may use `Commitment`, `Conversion`, `Trigger-Arming`, or once-per-battle timing
- should create a strong turn window, not replace an entire turn of card play

Avoid:

- a raw nuke that outclasses deck payoffs
- a full engine by itself
- a permanent no-brainer buff with no timing tension

## Power Budget Rules

Core skills should be tuned below the ceiling of a real deck engine.

Practical rules:

- a core skill can be reliable
- a core skill can be tactically important
- a core skill can be stronger than one narrow card in one exact moment
- a core skill should not become the main source of repeated throughput over several turns

Stand-alone damage rule:

- direct damage on a core skill should usually be no better than a good same-stage card unless the skill is notably narrower, delayed, or cooldown-limited

Stand-alone defense rule:

- direct guard or healing on a core skill should usually stabilize a turn, not erase the need for defensive cards

Scaling rule:

- most core-skill scaling should come from creating better windows for cards, summons, or mercenary actions rather than from stacking bigger standalone numbers

## Allowed Core-Skill Value Types

Healthy value types for core skills:

- target designation
- next-hit or next-card arming
- mercenary or summon command
- one-turn telegraph respect
- anti-backline or anti-summon answers
- short combat states
- narrow recovery
- limited once-per-battle commitment windows

Unhealthy value types for core skills:

- broad hand refills
- routine zero-cost energy-positive spam
- deck-thinning or discard engines
- copied-card loops
- large unconditional screen wipes
- generic "deal a lot of damage" buttons

## Starter And Path Selection

The starter core skill should not do all the work of path selection by itself.

Approved direction:

- `Slot 1` should remain mostly class-identity-first
- early path direction should come from tree investment, early card rewards, and bridge-skill unlock choices
- later commitment should come from favored-tree rules, not from the starter skill alone

Optional future extension:

- add a run-start `startingPathBiasTreeId`
- use it to bias the opening deck, first reward offers, and training-screen defaults
- do **not** let it count as free tree ranks
- do **not** let it override actual favored-tree determination later

That preserves early player intent without turning the starter slot into a hidden build lock.

## Authoring Model

For the first clean implementation, the class skill catalog should be treated as the core-skill catalog.

That means:

- entries in `skills.json` are authored as core skills
- deck cards live in card content files, not in the skill catalog
- tree membership for a core skill comes from the class-tree structure that contains it

Required authored data should continue to include:

- `family`
- `slot`
- `tier`
- `cost`
- `cooldown`
- `summary`
- `exactText`

Recommended additions for balance and UI clarity:

- `coreRole`
- `counterTags`
- `synergyTags`

Recommended shape:

```ts
interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
  family: SkillFamilyId;
  slot: 1 | 2 | 3;
  tier: "starter" | "bridge" | "capstone";
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  isStarter?: boolean;
  chargeCount?: number;
  oncePerBattle?: boolean;
  coreRole?: "identity" | "answer" | "command" | "recovery" | "trigger" | "commitment";
  counterTags?: string[];
  synergyTags?: string[];
}
```

These extra tags should help:

- training UI explanations
- simulator reporting
- future balance audits

They should not be used to hide bad content design.

## Runtime Model

Keep the current broad runtime split:

- `starterSkillId` identifies the starter core skill
- `unlockedSkillIds` tracks learned core skills for this run
- `equippedSkillBar` tracks chosen core-skill loadout
- tree ranks and favored-tree state gate bridge and capstone access

Clarify the meaning:

- these states govern the core-skill surface only
- they do not represent deck cards
- reward screens should not directly grant core skills

Training should remain the place where the player:

- sees eligible core skills
- learns a core skill
- equips it into an open slot

Reward screens should remain the place where the player:

- adds deck cards
- upgrades cards
- pivots the combat engine

## Interaction With Cards

Core skills and cards should often cooperate, but they should not collapse into one object.

Approved rules:

- a card may exploit a state or target mark created by a core skill
- a core skill may set up the next card, summon, or mercenary action
- a card may reference a core-skill family or tag for synergy text
- a card and a core skill should not be authored as the same move with the same id

If Rouge wants both a card and a core skill named after the same fantasy concept, then:

- author them separately
- give them different ids
- make their jobs meaningfully different

Example:

- a core skill version of `Call the Shot` can designate a target and arm the next ranged window
- a card version of a bow payoff can cash that window out

That is healthy.

Unhealthy:

- `Fire Arrow` exists as both a core skill and a card with overlapping identity and unclear separation

## Example Class Use

Amazon is a good model for the desired behavior:

- the starter core skill should be a low-impact target-designation or precision tool
- Bow, Javelin, and Passive trees should each expose different bridge or capstone core-skill candidates
- the player can still draft cards from another tree and pivot later
- the run should only feel truly committed once tree ranks and reward direction create a favored lane

That means a run can:

- start with a precise ranged floor-raiser
- learn a Javelin bridge skill later
- keep some Bow cards early
- fully commit to Javelin by mid-run if rewards and tree points support it

This is the desired kind of flexibility.

## Migration Plan

### Phase 1: Clean terminology

- treat "class skill," "starter skill," and "equipped skill bar" docs as describing the core-skill surface
- stop describing duplicated starter cards as if they are the intended long-term model

### Phase 2: Remove shared card or skill duplication

- replace any same-id card or skill overlaps
- keep card and core-skill ids distinct
- rewrite starter decks so they do not duplicate the starter core skill's gameplay role too closely

### Phase 3: Replace high-impact starters

- replace reused D2-actives that behave like ordinary attacks with Rouge-authored low-impact starter core skills
- favor target designation, state, answer, and command patterns over raw damage buttons

### Phase 4: Add richer core metadata

- add `coreRole`
- add `counterTags`
- add `synergyTags`
- surface those tags in training UI and balance tools

### Phase 5: Optional early path bias

- add `startingPathBiasTreeId` only if early-run direction still feels too muddy
- use it as a bias input, not as a hidden commitment override

## Explicit Anti-Goals

Do not:

- give every class three strong damage buttons
- let random rewards mutate the core-skill bar directly
- let core skills become the main source of draw smoothing
- solve every encounter ask through core-skill utility alone
- make tree commitment irrelevant by giving all trees equal late-slot access
- build the system around duplicated card and skill objects

## Final Rule

If a player can ignore deck quality because the skill bar carries the run, the core-skill model is failing.

If a player always has one sensible action, can survive a weak draw more often, and still needs cards to deliver the real win condition, the core-skill model is working.
