# Rouge Game Wiki

> Live reference documents for game agents and developers.
> Update these whenever engine, data, or balance changes are made.

Last updated: 2026-04-11

## How to Use

These docs are the source of truth for what the game does and how systems interact.
Agents should consult these before making balance, AI, or content decisions.

When you change game mechanics, update the relevant wiki doc in the same PR.

---

## Core Mechanics

| Doc | Covers |
|-----|--------|
| [Combat System](mechanics/combat-system.md) | Turn loop, energy, guard, damage, life, draw, potions |
| [Status Effects](mechanics/status-effects.md) | All buffs, debuffs, and their resolution rules |
| [Card System](mechanics/card-system.md) | Card effects, behavior tags, counter tags, deck economy, upgrades |
| [Item System](mechanics/item-system.md) | Equipment slots, weapon families, affixes, runes, runewords |
| [Encounter Modifiers](mechanics/encounter-modifiers.md) | Combat setup modifiers that change encounter dynamics |
| [Monster Traits](mechanics/monster-traits.md) | Elite affixes, death effects, scaling by act |
| [Rewards & Drops](mechanics/rewards-and-drops.md) | Encounter rewards, item/rune drop rates, card rewards, progression boons, shrines |

## Classes (7)

| Class | Overview | Builds |
|-------|----------|--------|
| [Amazon](classes/amazon.md) | Ranged/javelin precision class | [Bow Volley](builds/amazon-bow-volley.md), [Javelin Storm](builds/amazon-javelin-storm.md), [Passive Tempo](builds/amazon-passive-tempo.md) |
| [Assassin](classes/assassin.md) | Melee combo / trap specialist | [Martial Burst](builds/assassin-martial-burst.md), [Shadow Tempo](builds/assassin-shadow-tempo.md), [Trap Field](builds/assassin-trap-field.md) |
| [Barbarian](classes/barbarian.md) | Frontline melee / warcry class | [Combat Pressure](builds/barbarian-combat-pressure.md), [Mastery Frontline](builds/barbarian-mastery-frontline.md), [Warcry Tempo](builds/barbarian-warcry-tempo.md) |
| [Druid](classes/druid.md) | Summoner / elemental / shapeshifter | [Elemental Storm](builds/druid-elemental-storm.md), [Shifter Bruiser](builds/druid-shifter-bruiser.md), [Summoner Engine](builds/druid-summoner-engine.md) |
| [Necromancer](classes/necromancer.md) | Summoner / curse / bone specialist | [Curse Control](builds/necromancer-curse-control.md), [Bone Burst](builds/necromancer-bone-burst.md), [Summon Swarm](builds/necromancer-summon-swarm.md) |
| [Paladin](classes/paladin.md) | Aura / combat holy warrior | [Combat Zeal](builds/paladin-combat-zeal.md), [Sanctuary Anchor](builds/paladin-sanctuary-anchor.md), [Aura Judgment](builds/paladin-aura-judgment.md) |
| [Sorceress](classes/sorceress.md) | Elemental magic specialist | [Cold Control](builds/sorceress-cold-control.md), [Fire Burst](builds/sorceress-fire-burst.md), [Lightning Tempo](builds/sorceress-lightning-tempo.md) |

## World

| Doc | Covers |
|-----|--------|
| [Act 1 — The Sightless Eye](zones/act-1.md) | Rogue Encampment through Catacombs |
| [Act 2 — The Secret of the Vizjerei](zones/act-2.md) | Lut Gholein through Tal Rasha's Tomb |
| [Act 3 — The Infernal Gate](zones/act-3.md) | Kurast Docks through Durance of Hate |
| [Act 4 — The Harrowing](zones/act-4.md) | Pandemonium Fortress through Chaos Sanctuary |
| [Act 5 — Lord of Destruction](zones/act-5.md) | Harrogath through Worldstone Chamber |

## Enemies & Bosses

| Doc | Covers |
|-----|--------|
| [Enemy Catalog](enemies/catalog.md) | All enemy types by act, roles, stats |
| [Act Bosses](bosses/act-bosses.md) | Andariel, Duriel, Mephisto, Diablo, Baal |
| [Quest Bosses](bosses/quest-bosses.md) | Minibosses, super uniques, quest encounters |

## Mercenaries

| Doc | Covers |
|-----|--------|
| [Mercenary Guide](mercenaries/overview.md) | All mercs, behaviors, auras, route perks |

## Town & Economy

| Doc | Covers |
|-----|--------|
| [Town Services](town/services.md) | Healer, quartermaster, vendors, deck surgery, training |
| [Economy & Vendors](town/economy.md) | Pricing, economy features, vendor progression |

---

## Maintenance Rules

1. **Update on engine change** — If you modify combat, cards, items, or AI, update the relevant wiki doc
2. **Source of truth** — These docs describe what the game *currently* does, not aspirational design
3. **Numbers matter** — Include exact values, formulas, and thresholds so agents can optimize
4. **Cross-reference** — Link between docs when systems interact (e.g. status effects ↔ card effects)
5. **Date stamp** — Update the "Last updated" line when you edit a doc
