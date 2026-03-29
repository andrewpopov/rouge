# Class Strategy Guide Sources

Last updated: March 28, 2026.

## Purpose

This folder is the bridge between Rouge’s internal strategy design and future player-facing game guides.

Use these files to answer:

- what each class is trying to do
- what archetypes are live and tracked
- what early choices seed each path
- what gear or rune projects support the path
- what boss problems the build must solve

## Current Live Archetype Source

The current live archetype lanes come from [src/rewards/reward-engine.ts](/Users/andrew/proj/rouge/src/rewards/reward-engine.ts).

Current tracked lanes:

- Amazon: `Bow Volley`, `Javelin Storm`, `Passive Tempo`
- Assassin: `Martial Burst`, `Shadow Tempo`, `Trap Field`
- Barbarian: `Combat Pressure`, `Mastery Frontline`, `Warcry Tempo`
- Druid: `Elemental Storm`, `Shifter Bruiser`, `Summoner Engine`
- Necromancer: `Curse Control`, `Bone Burst`, `Summon Swarm`
- Paladin: `Combat Zeal`, `Defensive Anchor`, `Offensive Aura`
- Sorceress: `Cold Control`, `Fire Burst`, `Lightning Tempo`

## How To Use These Docs

- For current runtime behavior, verify against code and balance artifacts first.
- For class identity and future guide writing, start with the relevant class doc here.
- For system-level strategy direction, use:
  - [docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_BUILD_IDENTITY_DESIGN.md)
  - [docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md)
- For live balance context, use:
  - [artifacts/balance/latest.md](/Users/andrew/proj/rouge/artifacts/balance/latest.md)

## Class Docs

- [Amazon](/Users/andrew/proj/rouge/docs/strategy-guides/amazon.md)
- [Assassin](/Users/andrew/proj/rouge/docs/strategy-guides/assassin.md)
- [Barbarian](/Users/andrew/proj/rouge/docs/strategy-guides/barbarian.md)
- [Druid](/Users/andrew/proj/rouge/docs/strategy-guides/druid.md)
- [Necromancer](/Users/andrew/proj/rouge/docs/strategy-guides/necromancer.md)
- [Paladin](/Users/andrew/proj/rouge/docs/strategy-guides/paladin.md)
- [Sorceress](/Users/andrew/proj/rouge/docs/strategy-guides/sorceress.md)

## Writing Rule

These are guide-source docs, not marketing copy.

They should stay:

- clear
- implementation-aware
- strategy-focused
- easy to turn into future player help and build guides
