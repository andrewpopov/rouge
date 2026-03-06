# Rouge Game Guide

_Guide snapshot: 2026-03-06_

Documentation note:
- Start with `PROJECT_MASTER.md` for project status and doc precedence.
- This guide is the player-facing explanation of the current playable build.
- Maintainers should use `$game-doc-maintainer` when refreshing this guide after gameplay changes.

## Table Of Contents

1. [What This Build Is](#what-this-build-is)
2. [Run Structure](#run-structure)
3. [Combat Turn Structure](#combat-turn-structure)
4. [Classes And Starter Decks](#classes-and-starter-decks)
5. [Class Card Progression](#class-card-progression)
6. [Rewards And Build Growth](#rewards-and-build-growth)
7. [Save Resume And Run End](#save-resume-and-run-end)
8. [Transitional Terminology](#transitional-terminology)
9. [Current Practical Tips](#current-practical-tips)

## What This Build Is

- The current playable build is a deterministic, browser-based, turn-based roguelite deckbuilder.
- It is mid-migration from an older steampunk prototype into a Diablo II-inspired dark-fantasy structure.
- The runtime already supports canonical D2 classes, seeded class skill lists, class-card progression, gear, artifacts, quests, reward-tree progression, and save/resume.

What this means in practice:

- Combat is already card-driven.
- Class identity now comes from seeded D2 class trees and class-card rewards.
- Some HUD text and system names still use older terms such as `Steam`, `Heat`, and `Hull`.

## Run Structure

The current run loop is:

1. Choose a class.
2. Start a run with the shared base deck shell plus class starter cards.
3. Fight deterministic encounters.
4. Take one reward after each cleared sector.
5. Build around cards, class growth, gear, artifacts, and passive progression.
6. Continue until run victory or game over.

Current note:
- The higher-level act/town/world-map structure is still partially ahead of the runtime shell.
- The combat and reward loop is the most complete part of the current build.

## Combat Turn Structure

During your turn:

- You draw from your deck into your hand.
- You spend energy to play cards.
- You can shift lanes, overclock, or use other support actions when available.
- Enemies telegraph attacks before they resolve, so positioning matters.

Cards currently fall into these broad buckets:

- `Attack`: direct damage cards, including martial class cards.
- `Spell`: class-driven damage or utility cards, mostly used by caster-style trees.
- `Skill` or `Reactor`: support, setup, block, draw, or resource manipulation cards from the shared shell.

## Classes And Starter Decks

The current seeded runtime includes these classes:

- Amazon
- Assassin
- Barbarian
- Druid
- Necromancer
- Paladin
- Sorceress

Every class starts from two layers:

- A shared base shell that keeps the core deckbuilder loop stable.
- Class starter cards generated from the selected class's seeded starter skills.

This is intentional:

- the shared shell guarantees baseline offense/defense
- class starter cards immediately differentiate the run
- later rewards push the deck toward a specific class tree identity

## Class Card Progression

Class progression is now built around real D2 tree bands.

Each class has three tree attunement nodes. Spending skill points on those nodes unlocks class-card rewards by level band:

- Rank `1`: unlocks skills with required level `1-6`
- Rank `2`: unlocks skills with required level `12-18`
- Rank `3`: unlocks skills with required level `24-30`

How unlocked skills become deck content:

- Unlocking a tree does not add every skill directly into the deck.
- It adds the relevant class cards to the reward pool.
- The first copies of a class card are added to the deck.
- Once you hit the copy cap for that class card, duplicate rewards increase that card family's rank instead.

How power scales:

- Higher rank increases the card's effect value.
- Same-tree class cards in the deck passively increase related cards.
- Support cards from the same tree can strengthen higher-tier cards even when they are not drawn that turn.

Example:

- A Sorceress can unlock Fire cards through Fire tree attunement.
- Adding `Fire Bolt`, `Inferno`, and `Fireball` into the deck makes later Fire cards stronger.
- Extra `Fireball` rewards can start leveling `Fireball` instead of simply adding more copies.

For the design rationale, see `CLASS_DECKBUILDER_PROGRESSION.md`.

## Rewards And Build Growth

Reward sources in the current build include:

- standard card rewards
- unlocked class-card rewards
- gear rewards
- artifacts
- upgrade paths
- class XP, skill points, and stat points
- reward-tree unlocks
- quest progress

Practical build grammar:

- shared cards define your baseline turn quality
- class cards define your build identity
- tree points unlock what class cards can appear
- duplicate class-card rewards deepen a build through rank-ups
- artifacts, gear, and passive systems smooth out or amplify the deck plan

## Save Resume And Run End

- The game supports local save/resume for in-progress runs.
- Run records and some progression state persist across restarts.
- A run ends in either victory or game over.

Current note:
- The save/resume layer is stable enough that documentation should treat it as a real supported feature, not a prototype-only convenience.

## Transitional Terminology

Some runtime vocabulary is still inherited from the older prototype:

- `Steam` currently functions as combat energy.
- `Heat` is the main build-up / stress / overclock resource.
- `Hull` is currently the player's health.

These names are implementation truth today, even though the long-term product language will likely change.

## Current Practical Tips

- Treat cards as the main action surface. Do not assume fixed skill-bar gameplay.
- Spend early skill points to widen the class-card reward pool before chasing narrow specialization.
- Pay attention to same-tree concentration. A tighter tree identity now has real passive payoff.
- Duplicate class-card rewards are often good now because they can rank up an existing family instead of diluting the deck.
- Use the shared shell to survive while the class package is still coming online.
