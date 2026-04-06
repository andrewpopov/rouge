# Class Slot 3 Capstone Skill Specs

_Snapshot: 2026-04-04_

## Purpose

This document defines the target `Slot 3` capstone skill candidates for all `7` classes.

It answers:

- what late skill-bar actives should represent each tree or lane
- what a real commitment skill should look like in Rouge
- how each class should create a capstone moment without replacing deck play

Use it with:

- [CLASS_STARTER_SKILL_BAR_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_STARTER_SKILL_BAR_SPECS.md)
- [CLASS_SLOT2_BRIDGE_SKILL_SPECS.md](/Users/andrew/proj/rouge/docs/CLASS_SLOT2_BRIDGE_SKILL_SPECS.md)
- [CLASS_SKILL_BAR_BLUEPRINTS.md](/Users/andrew/proj/rouge/docs/CLASS_SKILL_BAR_BLUEPRINTS.md)
- [SKILL_UNLOCK_AND_GATING_RULES.md](/Users/andrew/proj/rouge/docs/SKILL_UNLOCK_AND_GATING_RULES.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [CLASS_IDENTITY_PATHS.md](/Users/andrew/proj/rouge/docs/CLASS_IDENTITY_PATHS.md)

This is target design, not a claim that the live runtime already supports every skill here.

## Slot 3 Contract

`Slot 3` should feel like a real capstone or commitment moment.

It should usually be one of:

- `Commitment`
- `Conversion`
- `Command`
- `Trigger-Arming`

It should not be:

- just a larger starter skill
- just a generic nuke
- so self-sufficient that the deck becomes secondary

## Amazon

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Bow Volley` | `Kill Zone` | `Trigger-Arming` | `2` | `4` | `Choose an enemy. Your next 3 ranged hits this turn and your mercenary's next hit against it each deal +6 damage. If any of those hits damage it while it is attacking next turn, it deals 8 less damage.` |
| `Javelin Storm` | `Storm Spear` | `Commitment` | `2` | `4` | `Deal 10 damage to all enemies. Your next Attack this turn deals +8 damage to all enemies it hits.` |
| `Passive Tempo` | `Predator's Calm` | `Conversion` | `2` | `4` | `Gain 10 Guard. Your next 3 damaging cards this turn each gain +5 damage and draw 1 if they hit only one enemy.` |

Use:

- Amazon capstones should feel precise and controlled, not random artillery.

## Assassin

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Martial Burst` | `Death Blossom` | `Commitment` | `2` | `4` | `Your next 2 Assassin damage cards this turn each cost 1 less and deal +8 damage. If they hit the same enemy, gain 1 Energy next turn.` |
| `Trap Field` | `Night Maze` | `Trigger-Arming` | `2` | `4` | `Your next Trap, field, or shadow setup card this turn triggers twice. All enemies gain 1 Slow.` |
| `Shadow Tempo` | `Living Shade` | `Conversion` | `2` | `4` | `For this turn, your Assassin cards deal +5 damage to enemies with Burn, Poison, Slow, Freeze, or Mark. Gain 6 Guard.` |

Use:

- Assassin capstones should cash out preparation, not replace it.

## Barbarian

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Combat Pressure` | `Relentless Assault` | `Commitment` | `2` | `4` | `Deal 10 damage. Your next 2 Attacks this turn each deal +6 damage. If they hit the same enemy, gain 6 Guard.` |
| `Mastery Frontline` | `Perfect Form` | `State` | `2` | `4` | `For this turn, your Attacks cost 1 less, ignore 5 Guard, and gain +4 damage. Gain 8 Guard.` |
| `Warcry Tempo` | `Warlord's Command` | `Command` | `2` | `4` | `You and your mercenary gain +5 damage this turn. All enemies deal 4 less damage next turn. Draw 1.` |

Use:

- Barbarian capstones should feel like a timed surge, not permanent autopilot.

## Druid

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Elemental Storm` | `Cataclysm` | `Commitment` | `2` | `4` | `Deal 8 damage to all enemies. Your next 2 elemental cards this turn each apply +2 Burn or +2 Slow and deal +4 damage.` |
| `Shifter Bruiser` | `Elder Shape` | `State` | `2` | `4` | `Gain 10 Guard. Your next 2 Shapeshift or melee cards this turn each deal +6 damage and apply 1 Slow.` |
| `Summoner Engine` | `Wild Convergence` | `Command` | `2` | `4` | `Summon a Bear for 2 turns. If you already control a summon, all your summons gain +2 power and +1 turn instead.` |

Use:

- Druid capstones should clearly separate spell payoff, bruiser payoff, and summon payoff.

## Necromancer

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Bone Burst` | `Grave Rupture` | `Conversion` | `2` | `4` | `Deal 12 damage. If an enemy died this turn, deal 8 damage to all enemies and apply 2 Poison to all enemies.` |
| `Curse Control` | `Black Benediction` | `Command` | `2` | `4` | `All enemies deal 4 less damage next turn. Your next 2 curse or control cards this turn each draw 1 and deal +4 damage or apply +1 extra status.` |
| `Summon Swarm` | `Army of Dust` | `Commitment` | `2` | `4` | `Summon 2 Skeletons for 2 turns. If you already control summons, reinforce all of them by +2 instead.` |

Use:

- Necromancer capstones should make death and board presence matter immediately.

## Paladin

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Combat Zeal` | `Judgment March` | `Command` | `2` | `4` | `You and your mercenary gain +5 damage this turn. Your next 2 Attack or Aura cards this turn each gain +4 damage or +4 Guard.` |
| `Offensive Aura` | `Fanatic Decree` | `Commitment` | `2` | `4` | `For this turn, your Attacks and Aura cards deal +5 damage. The next 2 enemies you hit each deal 6 less damage next turn.` |
| `Defensive Anchor` | `Bulwark of Faith` | `Answer` | `2` | `4` | `Remove 1 debuff from the party. You and your mercenary gain 12 Guard. The next attack against either ally this turn deals 10 less damage.` |

Use:

- Paladin capstones should feel like righteous leadership, not passive turtling.

## Sorceress

| Tree | Skill | Family | Cost | Cooldown | Exact Text |
| --- | --- | --- | ---: | ---: | --- |
| `Fire Burst` | `Meteor Rain` | `Commitment` | `2` | `4` | `Deal 9 damage to all enemies. Apply 2 Burn to all enemies. Your next Spell this turn deals +8 damage.` |
| `Cold Control` | `Absolute Zero` | `Answer` | `2` | `4` | `Gain 10 Guard. Apply 1 Slow and 1 Freeze to all enemies. Your next Spell this turn draws 1.` |
| `Lightning Tempo` | `Storm Rhythm` | `Conversion` | `2` | `4` | `Gain 1 Energy now. Your next 3 Spells this turn each deal +4 damage. If any of them hit multiple enemies, draw 1.` |

Use:

- Sorceress capstones should be explosive but still sequencing-sensitive.

## Roster-Level Check

The roster should feel like this when `Slot 3` unlocks:

- Amazon becomes more precise and dangerous.
- Assassin becomes more surgical and timing-sensitive.
- Barbarian gets a real surge turn.
- Druid gets a clear package-defining payoff.
- Necromancer gets a true board or death payoff.
- Paladin gets a righteous command window.
- Sorceress gets a high-risk, high-payoff spell moment.

If a capstone can win fights by itself regardless of deck support, it is too strong.

If a capstone does not noticeably change how the deck should be played that turn, it is too weak.

## Next Use

Use this doc to draft:

1. skill upgrade trees for each capstone
2. capstone-specific usage gating such as cooldown versus charge versus once-per-battle
3. tree-specific capstone upgrade paths that deepen lane identity without replacing deck play
