# Skill Unlock And Gating Rules

_Snapshot: 2026-04-04_

## Purpose

This document defines when Rouge skill-bar slots should open and what kind of tree investment should be required to unlock each pool.

It answers:

- when `Slot 2` should open
- when `Slot 3` should open
- how much tree commitment should be required
- how utility splashes should interact with skill unlocks
- when skills can be swapped or re-equipped
- when cooldowns are enough versus when a skill should be once-per-battle

Use it with:

- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [CARD_ACTION_SURFACE_REVIEW.md](/Users/andrew/proj/rouge/docs/CARD_ACTION_SURFACE_REVIEW.md)
- [SKILL_ACTION_SURFACE_SYNTHESIS.md](/Users/andrew/proj/rouge/docs/SKILL_ACTION_SURFACE_SYNTHESIS.md)

This is target design, not a claim that the live runtime already supports every rule here.

## Benchmark Baseline

Rouge should borrow different progression lessons from each benchmark.

### Slay the Spire

Keep the opening simple.

Use:

- one clear starting identity
- low front-loaded rules burden
- deterministic access to your main class tool from fight one

Do not copy:

- heavy skill-bar growth inside a run
- class-specific slot timing complexity

### Monster Train

Use predictable power-step timing.

Use:

- champion-style upgrade moments at known campaign milestones
- strong commitment around a chosen line
- capstone moments that arrive early enough to matter for several acts

Do not copy:

- huge late-game escalation from stacked permanent upgrades on every active

### Across the Obelisk

Use role-aware investment.

Use:

- skill unlocks that care about party role and tree direction
- support and answer tools that feel earned through build investment

Do not copy:

- a sprawling active-skill surface that competes with deck play

### Wildfrost

Keep the active vocabulary compact and readable.

Use:

- a small number of strong, distinct active tools
- clean timing rules

Do not copy:

- too many simultaneous active counters or row-rule complications

### Vault of the Void

Treat skill loadout as a between-fight decision, not an in-fight toy.

Use:

- loadout changes at safe planning moments
- commitment via build structure, not via random reward rolls

Do not copy:

- overly elaborate pre-fight micromanagement on every node

## Core Rouge Rule

Rouge should use a layered skill progression model:

- campaign pacing opens slots
- tree investment unlocks pools
- safe-zone training equips skills

That means:

- slots do **not** come from random rewards
- skill pools do **not** come from random rewards
- card rewards and skill unlocks stay separate

The deck remains the main tactical surface.

The skill bar should become more expressive over the run, but in a predictable and readable way.

## Canonical Slot Timing

| Slot | Role | Earliest Expected Timing | Global Gate | Tree Gate | Equip Rule |
| --- | --- | --- | --- | --- | --- |
| `Slot 1` | identity | first fight | none | none | fixed starter for the run |
| `Slot 2` | tactical bridge | Act I -> Act II | `Level 6+` checked at safe zone or act transition | `3+` points in any one tree unlock that tree's bridge pool | equip or swap only in safe zone training |
| `Slot 3` | commitment capstone | Act II -> Act III | `Level 12+` checked at safe zone or act transition | `6+` points in a favored tree plus at least `1` unlocked bridge skill from that tree | equip or swap only in safe zone training |

These are target defaults for the first full Rouge skill-bar model.

Do not vary these timings by class in the first implementation.

Class identity should come from the skills themselves, not from one class unlocking the second slot much earlier than another.

## Slot Rules

### Slot 1: Identity Slot

`Slot 1` should be stable and simple.

Rules:

- every class starts with exactly `1` equipped `Slot 1` skill
- that skill is fixed for the run in the first implementation
- `Slot 1` should not require tree gating
- `Slot 1` should teach the class before the first draw

Why:

- this is the Slay the Spire lesson applied correctly
- the player should understand the class immediately
- early run complexity should come from cards and enemy asks, not from bar configuration overload

### Slot 2: Tactical Bridge Slot

`Slot 2` is the first meaningful bar expansion.

Rules:

- `Slot 2` opens only at a safe zone or act transition
- the player must be `Level 6+`
- the player must have `3+` points in at least one tree
- once those conditions are met, each qualifying tree exposes its two `Slot 2` bridge candidates

Expected feel:

- the player has already learned the starter skill
- the run now chooses a tactical direction
- the bridge skill previews the committed lane without replacing it

Why this threshold:

- it matches Monster Train's lesson that early power-step moments should happen at predictable ring or act timings
- it keeps Act I readable
- it gives Acts II-V enough time for bridge skills to matter

### Slot 3: Commitment Capstone Slot

`Slot 3` is the mid-run commitment moment.

Rules:

- `Slot 3` opens only at a safe zone or act transition
- the player must be `Level 12+`
- the player must have `6+` points in one tree
- that tree must be the current favored tree
- the player must already have unlocked at least one bridge skill from that same tree

Expected feel:

- the run has a real primary lane
- the capstone arrives early enough to shape Acts III-V
- the capstone confirms commitment instead of creating it from nothing

Why this threshold:

- it gives Rouge a Monster Train-like mid-run commitment beat
- it preserves Diablo-style primary-tree investment
- it avoids a late capstone that barely matters

## Tree Commitment Rules

### Bridge Pools

Bridge pools are the main place where utility splashes are allowed.

Rules:

- any tree with `3+` points can unlock its `Slot 2` pool once `Slot 2` is globally open
- it is fine for the player to equip a bridge skill from a secondary tree
- this is where light utility splash should live

Examples:

- Paladin can splash a defensive `Answer` bridge while building toward offensive aura commitment
- Druid can splash a summon bridge while remaining elemental-primary
- Barbarian can use a warcry bridge even if the capstone path is mastery

### Capstone Pools

Capstone pools should require real commitment.

Rules:

- only the favored tree can unlock a `Slot 3` capstone
- favored tree means:
  - it has the highest point total
  - it is ahead of every other tree by at least `2` points
- if trees are tied, capstone access stays locked
- if the favored tree changes later, capstone eligibility can change with it

This preserves the Diablo-style rule:

- one primary tree
- light utility splash
- not three equal lanes

## Equip And Swap Rules

Skills should be equipped and swapped only in deliberate planning spaces.

Default rule:

- equip and swap only in safe zones or act-transition training screens

Do not allow:

- reward-screen swapping
- map-node swapping
- in-combat swapping

For the first full implementation:

- swapping unlocked skills should be free
- the commitment comes from slot timing and tree investment, not from an extra gold tax

If later testing shows degenerate boss-only swapping, add friction later.

Do not front-load that friction before the base system proves it needs it.

## Cooldowns, Charges, And Once-Per-Battle Rules

The benchmark games suggest a clear Rouge split.

### Slot 1

Default:

- low cooldown
- no charges
- no once-per-battle restriction

Why:

- this is the always-available identity tool

### Slot 2

Default:

- cooldown-based
- usually `2-3` turns
- no once-per-battle restriction

Why:

- this slot is the reliable tactical problem-solver or trigger bridge

### Slot 3

Default:

- cost `2`
- long cooldown, usually `4`

Use once-per-battle or charge limits only when the capstone:

- rewrites fight rules for multiple turns
- performs a board-reset style answer
- summons or reinforces a major board presence that would dominate repeated use

Do not make every capstone once-per-battle by default.

Rouge wants commitment moments, not a bar full of relic buttons.

## Upgrade And Progression Rules

Skill growth should mostly come from behavior upgrades and tree ranks, not from constantly adding more active buttons.

Preferred pattern:

- `Slot 1` gets minor support from broad class investment
- `Slot 2` gets stronger through bridge-skill upgrades and tree synergy
- `Slot 3` gets behavior-rich upgrades once the run is already committed

Avoid:

- unlocking more than `3` active slots
- letting the account layer grant extra combat slots
- letting random rewards mutate the skill bar directly

Permanent account progression can unlock:

- new starter variants later
- alternate bridge candidates
- alternate capstone variants

But it should not change the `1 -> 2 -> 3` slot progression rhythm inside a run.

## Anti-Patterns

Do not do these:

- unlock `Slot 2` before the player has learned the class starter
- unlock `Slot 3` so late that it only matters for one boss
- let splash trees unlock capstones as easily as primary trees
- vary slot timing per class in the first implementation
- use random rewards as the main skill unlock surface
- put draw or discard or retain or temporary upgrade complexity onto skills because they are "important"

Those mechanics belong on cards.

## Roster-Level Check

If the system is working, the run should feel like this:

- Act I teaches the class through `Slot 1`
- Act II adds a tactical bridge and starts revealing the real lane
- Act III locks in the committed lane with `Slot 3`
- Acts IV-V sharpen deck quality and skill upgrades rather than adding more bar complexity

If the player can fully express the build before Act I ends, slot pacing is too fast.

If the build still feels incomplete in Act IV because the capstone came too late, slot pacing is too slow.

## Bottom Line

Rouge should not treat skill unlocks like random card rewards.

It should treat them like a small, reliable progression spine:

- predictable slot timing
- tree-driven pool access
- safe-zone equipping
- one primary tree with light utility splash

That gives Rouge the right mix of:

- Slay the Spire opener clarity
- Monster Train commitment timing
- Across the Obelisk party-role support
- Wildfrost readability
- Vault of the Void loadout discipline

## Next Use

Use this doc to draft:

1. skill-upgrade trees for starter, bridge, and capstone skills
2. safe-zone training UI for skill unlocking and re-equipping
3. per-class unlock examples that show how a run moves from `Slot 1` to `Slot 3`
