# Class Starter Skill Bar Specs

_Snapshot: 2026-04-04_

## Purpose

This document defines the target starter skill-bar specs for all `7` classes.

It answers:

- what each class should start with in `Slot 1`
- which `2-3` skills should be the first unlock candidates
- what role those unlocks should play in the first expansion of the skill bar

Use it with:

- [CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)

This is target design, not a claim that the live runtime already supports every skill here.

## Starter Bar Contract

- each class begins with `1` equipped skill in `Slot 1`
- the starter skill should establish identity from fight one
- the first unlock should usually fill `Slot 2` with a tactical or support role
- `Slot 3` should remain the later commitment or capstone slot

## Amazon

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Call the Shot` | `Command` | `1` | `1` | `Choose an enemy. Your next 2 ranged hits or your mercenary's next hit against it each deal +4 damage.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Bow Volley` | `Serrated Volley` | `Trigger-Arming` | `1` | `2` | `Your next 2 ranged cards this turn deal +3 damage. If they hit the same enemy, apply 1 Slow each time.` |
| `Javelin Storm` | `Spear Break` | `Answer` | `1` | `2` | `Deal 7 damage. If the target is attacking next turn, it deals 6 less damage and your mercenary deals +4 damage against it.` |
| `Passive Tempo` | `Evasive Step` | `Answer` | `1` | `2` | `Gain 7 Guard. The next enemy attack against you or your mercenary this turn deals 6 less damage.` |

### Use

- `Call the Shot` should teach target designation and mercenary coordination immediately.
- The first unlock should usually add either a safe answer or a precise ranged payoff window.

## Assassin

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Shadow Feint` | `State` | `1` | `1` | `Gain 6 Guard. Your next Assassin card this turn costs 1 less and deals +4 damage or gains +4 Guard.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Martial Burst` | `Marked Opening` | `Trigger-Arming` | `1` | `2` | `Choose an enemy. Your next Attack and your mercenary's next hit against it each deal +5 damage.` |
| `Trap Field` | `Prepared Ground` | `Trigger-Arming` | `1` | `2` | `Your next Trap or field card this turn deals +5 damage and applies 1 Slow to all enemies it hits.` |
| `Shadow Tempo` | `Execution Window` | `Conversion` | `2` | `3` | `Your next 2 Assassin damage cards this turn deal +6 damage to enemies with Burn, Poison, Slow, or Mark.` |

### Use

- `Shadow Feint` should make Assassin feel setup-first from the first fight.
- The first unlock should deepen cash-out sequencing instead of just adding another burst button.

## Barbarian

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Bash` | `State` | `1` | `1` | `Deal 9 damage. If the target already took damage this turn, gain 3 Block.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Combat Pressure` | `Double Swing` | `Commitment` | `1` | `1` | `Deal 5 damage twice.` |
| `Combat Pressure` | `Leap` | `Answer` | `1` | `2` | `Gain 8 Block. Your next Attack this turn deals +5 damage.` |
| `Warcry Tempo` | `Howl` | `Answer` | `1` | `2` | `All non-boss enemies deal 4 less damage next turn.` |

### Use

- `Bash` stays the clean opener and identity button.
- The first unlock should usually solve either aggression consistency or telegraph respect.

## Druid

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Primal Attunement` | `State` | `1` | `1` | `Gain 5 Guard. Your next Spell or Shapeshift card this turn deals +4 damage. If your next card this turn summons, that summon gains +2 power.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Elemental Storm` | `Tempest Channel` | `Trigger-Arming` | `1` | `2` | `Your next 2 elemental cards this turn each apply +1 Burn or +1 Slow.` |
| `Shifter Bruiser` | `Stonebark` | `Answer` | `1` | `2` | `You and your mercenary gain 6 Guard. The next enemy that attacks this turn gains 1 Slow.` |
| `Summoner Engine` | `Pack Call` | `Command` | `1` | `2` | `Summon a Wolf for 2 turns. If you already control a summon, reinforce it by +2 instead.` |

### Use

- `Primal Attunement` should establish Druid as a context-setting class.
- The first unlock should bias the run toward elemental, shifter, or summon play without forcing it immediately.

## Necromancer

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Raise Servant` | `Command` | `1` | `1` | `Summon a Skeleton for 2 turns. If you already control a summon, reinforce it by +2 instead.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Bone Burst` | `Unholy Order` | `Command` | `1` | `2` | `Choose an enemy. Your summons and mercenary each deal +4 damage on their next hit against it.` |
| `Curse Control` | `Grave Mend` | `Recovery` | `1` | `2` | `Heal 5. If you control a summon, it gains +2 power and +1 turn.` |
| `Summon Swarm` | `Corpse Pact` | `Conversion` | `2` | `3` | `If an enemy or summon died this turn, deal 9 damage to all enemies and heal 4.` |

### Use

- `Raise Servant` should make Necromancer feel board-centric immediately.
- The first unlock should either protect the board or create a death-to-value conversion line.

## Paladin

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Sanctify` | `State` | `1` | `1` | `You and your mercenary gain 6 Guard. Your next Attack or Aura card this turn deals +4 damage or gains +4 Guard.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Combat Zeal` | `Zealous Chorus` | `Command` | `1` | `2` | `You and your mercenary gain +3 damage this turn. Gain 5 Guard.` |
| `Offensive Aura` | `Righteous Verdict` | `Answer` | `1` | `2` | `Choose an enemy. Your next 2 hits against it deal +4 damage. If it is attacking, it deals 5 less damage next turn.` |
| `Defensive Anchor` | `Aegis Prayer` | `Answer` | `1` | `2` | `Remove 1 debuff from the party. Gain 8 Guard. The next enemy attack this turn deals 5 less damage.` |

### Use

- `Sanctify` should establish Paladin as both protective and offensive.
- The first unlock should usually add either a boss-answer tool or a party-command spike.

## Sorceress

### Starter Skill

| Slot | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `1` | `Fire Bolt` | `State` | `1` | `1` | `Deal 8 damage. If this is the first Spell you used this turn, gain 1 Energy.` |

### Candidate First Unlocks

| Tree Bias | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Fire Burst` | `Fire Ball` | `Commitment` | `2` | `1` | `Deal 13 damage. Apply 2 Burn.` |
| `Cold Control` | `Frozen Armor` | `Answer` | `1` | `3` | `Gain 10 Block. The next enemy that attacks you this turn gains 2 Chill.` |
| `Lightning Tempo` | `Charged Bolt` | `Conversion` | `1` | `1` | `Deal 4 damage 3 times, randomly split among enemies.` |

### Use

- `Fire Bolt` should stay the opener because it already teaches spell sequencing.
- The first unlock should decide whether the run leans toward fire payoff, cold safety, or lightning tempo.

## Roster-Level Check

The roster should feel like this at the start of a run:

- Amazon starts precise and commanding.
- Assassin starts setup-first and timing-sensitive.
- Barbarian starts clear, sturdy, and proactive.
- Druid starts by establishing context.
- Necromancer starts by putting a board piece into play.
- Paladin starts by protecting and empowering the party.
- Sorceress starts by rewarding spell sequencing immediately.

If two classes feel like they start with the same kind of button, the starter-skill set is too flat.

## Next Use

Use this doc to draft:

1. exact `Slot 2` unlock pools by tree
2. exact `Slot 3` capstone skill pools by tree
3. skill unlock timing and tree-gating rules
4. skill upgrade paths that change behavior, not only numbers
