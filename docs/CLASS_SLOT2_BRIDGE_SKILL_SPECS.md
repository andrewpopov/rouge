# Class Slot 2 Bridge Skill Specs

_Snapshot: 2026-04-04_

## Purpose

This document defines the target `Slot 2` bridge skill pools for all `7` classes.

It answers:

- what the first real skill-bar expansion should look like
- how each tree gets from its starter identity to its `Slot 3` capstone
- which tactical, support, or setup skills should live in the bridge layer

Use it with:

- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT3_CAPSTONE_SKILL_SPECS.md)
- [CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md)

This is target design, not a claim that the live runtime already supports every skill here.

## Slot 2 Contract

`Slot 2` should usually do one of three jobs:

- solve an immediate combat ask
- arm a payoff that deck cards can exploit
- bridge the starter skill toward a committed lane identity

It should not be:

- a mini-capstone
- a generic filler button
- a second starter skill with bigger numbers

## Amazon

### Bow Volley

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Serrated Volley` | `Trigger-Arming` | `1` | `2` | `Your next 2 ranged cards this turn deal +3 damage. If they hit the same enemy, apply 1 Slow each time.` |
| `Pinning Fire` | `Answer` | `1` | `2` | `Deal 6 damage. If the target is attacking next turn, it deals 6 less damage and gains 1 Slow.` |

### Javelin Storm

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Spear Break` | `Answer` | `1` | `2` | `Deal 7 damage. If the target is attacking next turn, it deals 6 less damage and your mercenary deals +4 damage against it.` |
| `Storm Step` | `Trigger-Arming` | `1` | `2` | `Gain 5 Guard. Your next Attack this turn deals +5 damage to all enemies it hits.` |

### Passive Tempo

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Evasive Step` | `Answer` | `1` | `2` | `Gain 7 Guard. The next enemy attack against you or your mercenary this turn deals 6 less damage.` |
| `Hunter's Focus` | `Command` | `1` | `2` | `Choose an enemy. Your next single-target card this turn and your mercenary's next hit against it each draw 1 if they damage it.` |

## Assassin

### Martial Burst

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Marked Opening` | `Trigger-Arming` | `1` | `2` | `Choose an enemy. Your next Attack and your mercenary's next hit against it each deal +5 damage.` |
| `Flash Step` | `Answer` | `1` | `2` | `Gain 7 Guard. Your next Assassin damage card this turn costs 1 less.` |

### Trap Field

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Prepared Ground` | `Trigger-Arming` | `1` | `2` | `Your next Trap or field card this turn deals +5 damage and applies 1 Slow to all enemies it hits.` |
| `Wire Snare` | `Answer` | `1` | `2` | `Apply 1 Slow to all enemies. The next enemy that attacks this turn deals 6 less damage.` |

### Shadow Tempo

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Execution Window` | `Conversion` | `2` | `3` | `Your next 2 Assassin damage cards this turn deal +6 damage to enemies with Burn, Poison, Slow, or Mark.` |
| `Veil Step` | `State` | `1` | `2` | `Gain 6 Guard. Your next shadow card this turn draws 1 and costs 1 less.` |

## Barbarian

### Combat Pressure

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Double Swing` | `Commitment` | `1` | `1` | `Deal 5 damage twice.` |
| `Leap` | `Answer` | `1` | `2` | `Gain 8 Block. Your next Attack this turn deals +5 damage.` |

### Mastery Frontline

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Iron Discipline` | `State` | `1` | `2` | `Gain 7 Guard. Your next 2 Attacks this turn each ignore 3 Guard.` |
| `Measured Blow` | `Conversion` | `1` | `2` | `Deal 8 damage. If you gained Guard this turn, deal 4 more.` |

### Warcry Tempo

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Howl` | `Answer` | `1` | `2` | `All non-boss enemies deal 4 less damage next turn.` |
| `Battle Cry` | `Command` | `1` | `2` | `One enemy deals 6 less damage next turn. Your next Attack against it and your mercenary's next hit each deal +5 damage.` |

## Druid

### Elemental Storm

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Tempest Channel` | `Trigger-Arming` | `1` | `2` | `Your next 2 elemental cards this turn each apply +1 Burn or +1 Slow.` |
| `Arc Root` | `Conversion` | `1` | `2` | `Gain 6 Guard. Your next elemental damage card this turn deals +5 damage to all enemies it hits.` |

### Shifter Bruiser

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Stonebark` | `Answer` | `1` | `2` | `You and your mercenary gain 6 Guard. The next enemy that attacks this turn gains 1 Slow.` |
| `Predatory Lunge` | `Trigger-Arming` | `1` | `2` | `Your next Shapeshift or melee card this turn deals +6 damage. If it hits a slowed enemy, draw 1.` |

### Summoner Engine

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Pack Call` | `Command` | `1` | `2` | `Summon a Wolf for 2 turns. If you already control a summon, reinforce it by +2 instead.` |
| `Spirit Shepherd` | `Recovery` | `1` | `2` | `Heal 4. Your summons gain +2 power this turn and +1 turn if any summon is already active.` |

## Necromancer

### Bone Burst

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Unholy Order` | `Command` | `1` | `2` | `Choose an enemy. Your summons and mercenary each deal +4 damage on their next hit against it.` |
| `Bone Ward` | `Answer` | `1` | `2` | `Gain 7 Guard. If an enemy dies this turn, draw 1.` |

### Curse Control

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Grave Mend` | `Recovery` | `1` | `2` | `Heal 5. If you control a summon, it gains +2 power and +1 turn.` |
| `Hex Pulse` | `Trigger-Arming` | `1` | `2` | `Your next curse or control card this turn applies +1 extra status and draws 1.` |

### Summon Swarm

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Corpse Pact` | `Conversion` | `2` | `3` | `If an enemy or summon died this turn, deal 9 damage to all enemies and heal 4.` |
| `Mass Reassembly` | `Recovery` | `1` | `2` | `Reinforce all your summons by +1. If you have no summons, summon a Skeleton for 2 turns.` |

## Paladin

### Combat Zeal

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Zealous Chorus` | `Command` | `1` | `2` | `You and your mercenary gain +3 damage this turn. Gain 5 Guard.` |
| `Crusader's Step` | `Trigger-Arming` | `1` | `2` | `Your next Attack this turn deals +6 damage. If it hits an attacking enemy, gain 6 Guard.` |

### Offensive Aura

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Righteous Verdict` | `Answer` | `1` | `2` | `Choose an enemy. Your next 2 hits against it deal +4 damage. If it is attacking, it deals 5 less damage next turn.` |
| `Aura Surge` | `State` | `1` | `2` | `Your next Aura or Attack card this turn gains +5 damage or +5 Guard. Draw 1.` |

### Defensive Anchor

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Aegis Prayer` | `Answer` | `1` | `2` | `Remove 1 debuff from the party. Gain 8 Guard. The next enemy attack this turn deals 5 less damage.` |
| `Shield of Grace` | `Recovery` | `1` | `2` | `Heal 4. You and your mercenary gain 5 Guard.` |

## Sorceress

### Fire Burst

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Fire Ball` | `Commitment` | `2` | `1` | `Deal 13 damage. Apply 2 Burn.` |
| `Kindle` | `Conversion` | `1` | `2` | `Gain 1 Energy next turn. Your next Spell this turn deals +6 damage.` |

### Cold Control

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Frozen Armor` | `Answer` | `1` | `3` | `Gain 10 Block. The next enemy that attacks you this turn gains 2 Chill.` |
| `Crippling Frost` | `Trigger-Arming` | `1` | `2` | `Your next Spell this turn applies 1 Slow and 1 Freeze if it damages an enemy.` |

### Lightning Tempo

| Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | ---: | ---: | --- |
| `Charged Bolt` | `Conversion` | `1` | `1` | `Deal 4 damage 3 times, randomly split among enemies.` |
| `Static Flow` | `State` | `1` | `2` | `Gain 1 Energy now. Your next Spell this turn draws 1 if it hits multiple enemies.` |

## Roster-Level Check

The bridge layer should do this across the roster:

- make each tree feel more committed by the time `Slot 2` opens
- solve a real tactical ask
- preview the capstone pattern without replacing it

If `Slot 2` feels optional, the bridge is too weak.

If `Slot 2` already feels like a capstone, the bridge is too strong.

## Next Use

Use this doc to draft:

1. upgrade paths for bridge skills
2. the class skill implementation roadmap
3. class examples that show when players should pivot a bridge skill versus keep it equipped into late acts
