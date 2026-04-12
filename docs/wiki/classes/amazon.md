# Amazon

> Ranged precision class — bow consistency, javelin burst, or passive efficiency.

Last updated: 2026-04-11

## Identity

Amazon is a precision class whose runs split between ranged consistency, javelin tempo bursts, and passive-enabled efficiency. Early choices make it clear whether the run is becoming a ranged engine, an all-in javelin pressure deck, or a tempo shell that wins by efficiency.

## Base Stats

| Stat | Value |
|------|-------|
| STR | 20 |
| DEX | 25 |
| VIT | 20 |
| ENE | 15 |
| HP | 50 |
| Mana | 15 |

## Skill Trees (3)

### Bow and Crossbow
- **Focus:** Ranged multi-hit, slow/freeze application, consistent pressure
- **Key skills:** Magic Arrow, Cold Arrow, Multiple Shot, Guided Arrow, Strafe, Freezing Arrow
- **Progression:** magic_arrow → cold_arrow → guided_arrow → freezing_arrow; fire_arrow → exploding_arrow → strafe

### Javelin and Spear
- **Focus:** Lightning burst, paralyze chains, tempo spikes
- **Key skills:** Jab, Power Strike, Charged Strike, Lightning Bolt, Lightning Strike, Lightning Fury
- **Progression:** jab → power_strike → charged_strike → lightning_fury

### Passive and Magic
- **Focus:** Dodge, crit scaling, efficiency, mercenary support
- **Key skills:** Inner Sight, Critical Strike, Dodge, Penetrate, Avoid, Deadly Strike, Evade, Pierce, Valkyrie
- **Progression:** inner_sight → penetrate → valkyrie; critical_strike → deadly_strike → pierce; dodge → avoid → evade

## Build Archetypes (3)

| Archetype | Primary Tree | Support Tree | Weapons | Style |
|-----------|-------------|--------------|---------|-------|
| [Bow Volley](../builds/amazon-bow-volley.md) | Bow & Crossbow | Passive | Bow, Crossbow | Consistent ranged pressure, multi-target |
| [Javelin Storm](../builds/amazon-javelin-storm.md) | Javelin & Spear | Passive | Javelin, Spear | Charge-consuming AoE burst, lightning |
| [Passive Tempo](../builds/amazon-passive-tempo.md) | Passive & Magic | Bow, Javelin | Bow, Javelin | Dodge-crit efficiency, scaling |

## Run-Shaping Signals

- Early Bow investment + bow-family weapon → **Bow Volley**
- Early Jab or Charged Strike + javelin-family weapon → **Javelin Storm**
- Early passive support without locked weapon lane → **Passive Tempo**

## Deck Targets

- Optimal deck size: 14-17 cards
- Actively avoid: swing, measured_swing, kick, mark_target (neutral filler)

## Key Matchup Notes

- Amazon struggles against high-guard enemies without sunder effects — needs slow/freeze to control
- Bow Volley is the most stable lane but lacks burst for fast boss kills
- Javelin Storm has highest upside but overcommit risk on boss turns
- Passive Tempo needs a real damage payoff — passive scaling alone doesn't close games

## Source Files

- `data/seeds/d2/skills.json` (classId: "amazon")
- `src/rewards/reward-engine-archetypes-data.ts` (amazon archetypes)
- `docs/strategy-guides/amazon.md` (strategy source)
- `docs/classes/amazon.md` (sim status)
