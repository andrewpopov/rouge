# Enemy Catalog

> All enemy types organized by act, with roles and key threats.

Last updated: 2026-04-11

## Enemy Roles

| Role | Description | Targeted By |
|------|-------------|-------------|
| **Raider** | Fast melee frontline, high attack | AMBUSH, VANGUARD, WAR_DRUMS modifiers |
| **Brute** | Tank/armored, high guard/HP | VANGUARD, LINEBREAKER, PHALANX modifiers |
| **Ranged** | Backline damage, projectile attacks | CROSSFIRE, SNIPER, BOSS_SALVO modifiers |
| **Support** | Healing/buffing, utility | TRIAGE, RITUAL, ESCORT modifiers |
| **Boss** | Act/major boss encounter | BOSS_SCREEN, BOSS_ONSLAUGHT modifiers |

## Act 1 — The Sightless Eye (21 Types)

| Enemy | Role | Threat Notes |
|-------|------|-------------|
| Fallen | Raider | Low HP swarm, resurrects via shaman |
| Fallen Shaman | Support | Resurrects fallen — kill first |
| Spike Fiend | Ranged | Quill-based ranged attacks |
| Zombie | Raider | Slow, high HP for tier |
| Wendigo | Brute | Heavy melee, high HP |
| Corrupt Rogue | Raider | Fast melee, decent damage |
| Corrupt Rogue Archer | Ranged | Ranged physical damage |
| Corrupt Rogue Spearwoman | Raider | Melee with reach |
| Skeleton | Raider | Basic undead melee |
| Skeleton Archer | Ranged | Ranged undead |
| Skeleton Mage | Ranged | Elemental ranged (varies) |
| Goatman | Raider | Fast, aggressive melee |
| Blood Hawk | Ranged | Flying, hard to target |
| Tainted | Raider | Corrupted, fast attacks |
| Giant Spider | Raider | Poison on hit |
| Wraith | Ranged | Mana drain on hit |
| Fetish | Raider | Small, fast, swarm |
| Vampire | Support | Life drain, heal self |
| Flying Scimitar | Ranged | Animated weapon |
| Blood Hawk Nest | Support | Spawns blood hawks |
| Gargoyle Trap | Ranged | Stationary, triggers on proximity |

## Act 2 — The Secret of the Vizjerei (18 Types)

| Enemy | Role | Threat Notes |
|-------|------|-------------|
| Leaper | Raider | Fast, leaping attack |
| Scarab Demon | Raider | Lightning on hit |
| Sand Maggot | Brute | Tanky, slow, poison spit |
| Sand Maggot Egg | Support | Hatches into young |
| Sand Maggot Young | Raider | Spawned from eggs |
| Vulture Demon | Ranged | Flying ranged attacks |
| Swarm | Raider | Poison, hard to hit |
| Sabre Cat | Raider | Fast melee, pounce |
| Slinger | Ranged | Projectile ranged |
| Mummy | Raider | Undead melee, poison on death |
| Greater Mummy | Support | Resurrects mummies — priority kill |
| Sand Raider | Raider | Fast desert warrior |
| Bat Demon | Ranged | Flying, fast |
| Claw Viper | Raider | Fast melee, cold |
| Baboon Demon | Raider | Fast primate, high attack speed |
| Blunderbore | Brute | Heavy melee, stun potential |
| Lightning Spire | Ranged | Stationary, lightning AoE |
| Mummy Sarcophagus | Support | Spawns mummies |

## Act 3 — The Infernal Gate (10 Types)

| Enemy | Role | Threat Notes |
|-------|------|-------------|
| Fetish Shaman | Support | Inferno spell, buffs fetish |
| Giant Mosquito | Ranged | Fast, life drain |
| Thorned Hulk | Brute | Heavy melee, thorns reflect |
| Frog Demon | Raider | Poison melee |
| Willowisp | Ranged | Lightning, hard to hit |
| Bone Fetish | Raider | Explodes on death (death_explosion) |
| Tentacle Beast | Brute | High HP, grab attacks |
| Zakarum Zealot | Raider | Holy warrior, fast attacks |
| Zakarum Priest | Support | Healing, buffs zealots — priority kill |
| Council Member | Brute | Elite caster, fire/lightning |

## Act 4 — The Harrowing (6 Types)

| Enemy | Role | Threat Notes |
|-------|------|-------------|
| Finger Mage | Ranged | Elemental caster |
| Megademon | Brute | Heavy melee, high HP |
| Regurgitator | Brute | Ranged vomit attack, spawns |
| Oblivion Knight | Support | Curses, iron maiden, bone spirit |
| Vile Mother | Support | Spawns vile children |
| Vile Child | Raider | Spawned swarm from mothers |

## Act 5 — Lord of Destruction (17 Native + Guest Types)

| Enemy | Role | Threat Notes |
|-------|------|-------------|
| Baal's Minion | Raider | Elite melee, boss escort |
| Suicide Minion | Raider | Explodes on death |
| Death Mauler | Brute | Burrows, heavy melee |
| Catapult | Ranged | Siege ranged, high damage |
| Overseer | Support | Buffs nearby minions |
| Demon Imp | Ranged | Small, fast, ranged |
| Siege Beast | Brute | Heavy, siege attacks |
| Abominable | Brute | Cold-enhanced, high HP |
| Reanimated Horde | Raider | Undead swarm |
| Succubus | Ranged | Blood missiles, curses |
| Stygian Fury | Ranged | Fast flying, lightning |
| Frozen Horror | Brute | Cold aura, freeze on hit |
| Blood Lord | Brute | Heavy melee, blood magic |
| Putrid Defiler | Support | Poison, corpse use |
| Pain Worm | Ranged | Burrowing ranged attacks |
| Minion of Destruction | Brute | Baal's elite, very high stats |
| Reziarfg | Brute | Demon boss type |

**Note:** Act 5 Nightmare/Hell adds ~45 guest enemies from Acts 1-4.

## Encounter Archetypes

| Pattern | Composition | Key Threat |
|---------|-------------|-----------|
| Fallen Pack | Fallen + Fallen Shaman | Resurrection pressure from shamans |
| Undead Legion | Skeleton + Archer + Mage | Mixed ranged/melee attrition |
| Beast Ambush | Sabre Cat + Leaper + Vulture | Fast openers, momentum spikes |
| Kurast Fanatics | Zealot + Priest + Council | Priests must die first |
| Hell Siege | Catapult + Overseer + Imp | Ranged setup with support |
| Baal Throne Wave | Minion + Destruction | Endgame elite pressure |

## Source Files

- `data/seeds/d2/monsters.json` — Enemy definitions
- `data/seeds/d2/enemy-pools.json` — Encounter pool compositions
- `data/seeds/d2/zone-monsters.json` — Zone-specific spawning
