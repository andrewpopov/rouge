# Deckbuilder Action Surface Sources

_Snapshot: 2026-04-04_

## Purpose

This file tracks the external source documents used for benchmark deckbuilder action-surface reviews.

Use it together with:

- [CARD_ACTION_SURFACE_REVIEW.md](/Users/andrew/proj/rouge/docs/CARD_ACTION_SURFACE_REVIEW.md)
- [DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md)

This is an internal reference surface, not a claim that Rouge should copy these games literally.

## Slay the Spire

Primary wiki:

- [Slay the Spire Wiki](https://slaythespire.wiki.gg/wiki/Slay_the_Spire_Wiki)

Core source pages:

- [Keywords](https://slaythespire.wiki.gg/wiki/Keywords)
- [Upgrade](https://slaythespire.wiki.gg/wiki/Upgrade)
- [Buffs](https://slaythespire.wiki.gg/wiki/Buffs)
- [Armaments](https://slaythespire.wiki.gg/wiki/Armaments)
- [Apotheosis](https://slaythespire.wiki.gg/wiki/Apotheosis)
- [Master Reality](https://slaythespire.wiki.gg/wiki/Master_Reality)
- [Double Tap](https://slaythespire.wiki.gg/wiki/Double_Tap)
- [Burst](https://slaythespire.wiki.gg/wiki/Burst)
- [Nightmare](https://slaythespire.wiki.gg/wiki/Nightmare)
- [Infernal Blade](https://slaythespire.wiki.gg/wiki/Infernal_Blade)
- [Discovery](https://slaythespire.wiki.gg/wiki/Discovery)
- [Feed](https://slaythespire.wiki.gg/wiki/Feed)
- [Ritual Dagger](https://slaythespire.wiki.gg/wiki/Ritual_Dagger)
- [Lesson Learned](https://slaythespire.wiki.gg/wiki/Lesson_Learned)

Use this benchmark for:

- card lifecycle
- hand and pile manipulation
- temporary upgrades and cost changes
- kill-check mechanics

## Monster Train

Primary wiki:

- [Monster Train Wiki](https://monster-train.fandom.com/wiki/Monster_Train_Wiki)

Core source pages:

- [Card Effects](https://monster-train.fandom.com/wiki/Card_Effects)
- [Status Effects](https://monster-train.fandom.com/wiki/Status_Effects)
- [Triggered Effects](https://monster-train.fandom.com/wiki/Triggered_Effects)
- [Merchant of Magic](https://monster-train.fandom.com/wiki/Merchant_of_Magic)

Use this benchmark for:

- trigger vocabularies
- package identity
- card persistence upgrades
- behavior-grafting upgrades
- board topology

## Across the Obelisk

Primary wiki surfaces:

- [Across the Obelisk Wiki](https://acrosstheobelisk.wiki.fextralife.com/Across+the+Obelisk+Wiki)
- [Across the Obelisk Fandom Wiki](https://across-the-obelisk.fandom.com/wiki/Across_the_Obelisk_Wiki)

Recommended source searches and topic surfaces:

- `Vanish`
- `Retain`
- `Sight`
- `Bless`
- `Fortify`
- `Sanctify`
- `Wet`
- `Spark`
- `Stealth`
- `Taunt`

Use this benchmark for:

- party-role coordination
- team-oriented status layering
- information and reveal effects
- multi-actor support timing

## Wildfrost

Primary wiki:

- [Wildfrost Wiki](https://wildfrostwiki.com/Wildfrost_Wiki)

Core source pages:

- [Keywords](https://wildfrostwiki.com/Keywords)
- [Reactions](https://wildfrostwiki.com/Reactions)
- [Charms](https://wildfrostwiki.com/Charms)

Recommended source searches and topic surfaces:

- `Recall`
- `Consume`
- `Frenzy`
- `Barrage`
- `Aimless`
- `Smackback`
- `Teeth`
- `Snow`
- `Shroom`
- `Spice`
- `Shell`
- `Overburn`
- `Ink`
- `Haze`

Use this benchmark for:

- timing-counter tactics
- reaction keywords
- compact board-state tactics
- status packages as deck identity
- behavior-changing upgrade grafts

## Vault of the Void

Primary wiki surfaces:

- [Vault of the Void Wiki](https://vault-of-the-void.fandom.com/wiki/Vault_of_the_Void_Wiki)
- [Vault of the Void Companion](https://companion.vaultofthevoid.com/)

Recommended source searches and topic surfaces:

- `Purge`
- `Expel`
- `Rebound`
- `Retain`
- `Volatile`
- `Opener`
- `Set Up`
- `Void Stones`
- `Combo`
- `Zeal`
- `Overcharge`
- `Corruption`

Use this benchmark for:

- rich lifecycle vocabulary
- sideboard and deck surgery
- behavior-grafting upgrade systems
- class-specific combat rules
- discard and special-pile control

## Rouge Runtime Truth

When benchmarking against Rouge, these local files are the implementation truth:

- [content.d.ts](/Users/andrew/proj/rouge/src/types/content.d.ts)
- [combat.d.ts](/Users/andrew/proj/rouge/src/types/combat.d.ts)
- [combat-engine.ts](/Users/andrew/proj/rouge/src/combat/combat-engine.ts)
- [combat-engine-turns.ts](/Users/andrew/proj/rouge/src/combat/combat-engine-turns.ts)
- [card-effects.ts](/Users/andrew/proj/rouge/src/combat/card-effects.ts)
- [game-content.ts](/Users/andrew/proj/rouge/src/content/game-content.ts)

## Working Rule

When using these references:

- do not treat benchmark mechanics as auto-approved for Rouge
- use them to compare action-surface categories, not to justify literal copying
- keep current Rouge runtime truth separate from target design and inspiration
