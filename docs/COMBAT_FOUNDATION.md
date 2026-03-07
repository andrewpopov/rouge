# Combat Foundation

Last updated: March 7, 2026.

## Live Rule Set

The current build is a turn-based encounter between:

- `1` hero
- `1` mercenary
- `N` enemies from the selected encounter

The player acts through cards in hand. The mercenary acts automatically when the player ends the turn. Enemies then resolve their visible intents in sequence.

## Current Resources

- `Life`: persistent health inside the encounter
- `Guard`: temporary mitigation that absorbs damage before Life
- `Energy`: the hero's card-play resource each turn
- `Potions`: off-deck combat support actions
- `Burn`: enemy damage-over-time status currently supported in the live build

## Ally Flow

1. Start turn with full hero `Energy`.
2. Play cards from hand.
3. Use a potion on the hero or mercenary if needed.
4. End turn.
5. Mercenary attacks automatically.
6. Enemies act.
7. New turn begins if the encounter is still live.

## Live Cards

Starter combat package currently includes:

- direct single-target damage
- damage plus self-Guard
- mark-for-mercenary support
- Burn application
- party Guard support
- mercenary next-attack buffs
- area damage
- self-heal and mercenary heal
- draw support

## Live Mercenary Behaviors

- `Rogue Scout`: consumes hero marks for bonus damage
- `Desert Guard`: gains Guard after attacking
- `Iron Wolf`: deals bonus damage to burning enemies

## Live Enemy Behaviors

- direct attacks
- Guard turns
- ally healing turns

This is intentionally small. The current purpose is to lock the combat contract before larger systems like itemization, rune sockets, encounter affixes, and town services are layered back in.

## Near-Term Expansion Targets

- class-specific decks instead of one shared foundation deck
- more mercenary AI patterns and support skills
- elite modifiers and boss scripting
- item and rune hooks that modify cards and mercenary behavior
- encounter rewards and carry-forward run state
