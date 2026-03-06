# Class Deckbuilder Progression

_Snapshot: 2026-03-06_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `GAME_GUIDE.md` for the player-facing overview.
- Use this document for the class, skill, deck, and upgrade-path combat model.

## Core Loop

- Everyone keeps a shared attack/defense starter shell.
- Each class adds high-fidelity Diablo II class expression on top of that shell.
- The deck remains the dominant turn-by-turn action surface.
- Signature class skills live on a fixed skill bar, not in the draw pile.
- Skill points are spent on canonical Diablo II class trees.
- Gear, mercenaries, and meta progression amplify the build but should not replace hand play.

## Recommended Runtime Model

Use three distinct layers:

1. Fixed skill bar
- iconic class actives the player should always be able to access
- starts with `1` equipped active
- expands to `2-3` equipped slots over a run

2. Deck
- tactical combat actions
- class-expression cards
- combo pieces
- generated temporary cards

3. Passive progression
- skill-tree bonuses
- gear stats and passives
- mercenary passives
- account-level `Legacy` bonuses

Rule:
- if the player should always be able to access it, it should not live in the draw pile
- if the player should draw, sequence, and build around it, it belongs in the deck

## Skills vs Cards

### Skills

- Use energy or a class resource.
- Use cooldowns or cast limits.
- Hit harder than a baseline card, but less often.
- Establish class identity before the first draw.

### Cards

- Carry the bulk of combat sequencing.
- Express tree themes, tactical variation, and combo structure.
- Change more often during the run than fixed skills do.

### Consumables

- Core consumables such as potions should remain off-deck.
- Potions should live in quick-use inventory and not dilute the draw pile.
- Later tactical consumables such as scrolls or bombs can generate temporary cards if needed.

## Upgrade Path Model

### Run-Scoped Upgrade Paths

These should be the canonical class trees.

#### Barbarian

- `Combat Skills`
  - active attacks
  - movement tools
  - burst finishers
- `Combat Masteries`
  - weapon scaling
  - crit / hit / penetration style passives
  - baseline attack enhancers
- `Warcries`
  - control
  - buffs
  - defensive utility
  - mercenary support

#### Sorceress

- `Fire`
  - aggressive damage
  - burn and explosive payoff
- `Cold`
  - control
  - freeze
  - defensive utility
- `Lightning`
  - energy conversion
  - chain damage
  - tempo and mobility

### Account-Scoped Upgrade Paths

These should live in `Legacy`, separate from class trees.

Recommended `Legacy` paths:

- `Survival`
  - healing efficiency
  - resistances
  - safer early acts
- `Fortune`
  - gold gain
  - vendor value
  - economy smoothing
- `Arsenal`
  - gear quality
  - equipment flexibility
  - item support
- `Retinue`
  - mercenary strength
  - mercenary survivability
  - mercenary utility

Rule:
- class trees define build identity inside the run
- `Legacy` defines long-run account shaping
- avoid giving both systems the same bonuses too often

## Exact Starting Kits

These are implementation-grade starting kit specs for the first playable classes.

### Barbarian Starting Kit

#### Starting Skill Bar

| Slot | Skill | Cost | Cooldown | Exact Text |
|---|---|---:|---:|---|
| 1 | `Bash` | 1 | 1 | `Deal 9 damage. If the target already took damage this turn, gain 3 Block.` |

#### Starting Deck (`14`)

| Qty | Card | Cost | Type | Exact Text |
|---:|---|---:|---|---|
| 3 | `Strike` | 1 | Attack | `Deal 6 damage.` |
| 3 | `Guard` | 1 | Skill | `Gain 6 Block.` |
| 1 | `Advance` | 0 | Skill | `Gain 1 Energy. Draw 1. Exhaust.` |
| 1 | `Recover` | 1 | Skill | `Heal 4. Exhaust.` |
| 2 | `Crushing Swing` | 2 | Attack | `Deal 11 damage. If the target already took damage this turn, deal 4 more.` |
| 2 | `War Shout` | 1 | Skill | `Gain 5 Block. Your next Attack this turn deals +4 damage.` |
| 1 | `Battle Instinct` | 0 | Skill | `Draw 2. If your hand contains 2 or more Attack cards, gain 1 Energy. Exhaust.` |
| 1 | `Blood Rush` | 1 | Attack | `Lose 3 HP. Deal 14 damage.` |

Opening pattern:

- `Bash` gives Barbarian a reliable identity button every fight.
- `War Shout` creates clear attack windows.
- `Crushing Swing` and `Blood Rush` provide early burst choices.
- The deck should feel aggressive, stable, and easy to understand on first run.

Preferred early upgrade-path direction:

- first flexible ranks in `Combat Skills` or `Warcries`
- `Combat Masteries` should become the passive scaling backbone after the first few rewards

### Sorceress Starting Kit

#### Starting Skill Bar

| Slot | Skill | Cost | Cooldown | Exact Text |
|---|---|---:|---:|---|
| 1 | `Fire Bolt` | 1 | 1 | `Deal 8 damage. If this is the first Spell you used this turn, gain 1 Energy.` |

#### Starting Deck (`14`)

| Qty | Card | Cost | Type | Exact Text |
|---:|---|---:|---|---|
| 2 | `Strike` | 1 | Attack | `Deal 5 damage.` |
| 2 | `Guard` | 1 | Skill | `Gain 5 Block.` |
| 2 | `Focus` | 0 | Skill | `Gain 1 Energy. Exhaust.` |
| 1 | `Recover` | 1 | Skill | `Heal 4. Exhaust.` |
| 2 | `Flame Spark` | 1 | Spell | `Deal 7 damage. If this is the first Spell you played this turn, gain 1 Energy.` |
| 2 | `Cold Snap` | 1 | Spell | `Deal 5 damage. Gain 4 Block.` |
| 2 | `Warmth` | 1 | Skill | `Gain 1 Energy now and 1 Energy next turn. Exhaust.` |
| 1 | `Arc Surge` | 2 | Spell | `Deal 4 damage to all enemies. If you played another Spell this turn, draw 1.` |

Opening pattern:

- `Fire Bolt` gives Sorceress a stable first-cast tempo tool.
- `Focus` and `Warmth` smooth out spell turns.
- `Cold Snap` gives defense without breaking spell identity.
- `Arc Surge` provides the first multi-target payoff card.

Preferred early upgrade-path direction:

- `Fire` for cleaner early aggression
- `Cold` for safer control-heavy runs
- `Lightning` if the run is already showing strong energy or chain-cast support

## How Class Cards Progress

- Unlocking a tree does not instantly add every skill to the deck.
- Unlocking a tree adds eligible class-card families to the reward pool.
- The first copies of a class card are added to the deck.
- Once a class card reaches its copy cap, duplicate rewards rank up that card family instead.
- Same-tree cards in the deck can provide passive support bonuses to related cards.

## Reward-Pool Contract

Use the following rules for class-card rewards:

- Card rewards should normally present `3` choices.
- A standard battle card reward should contain:
  - `1` class-neutral or starter-shell upgrade option
  - `2` class reward-pool options
- At run start, only tier-1 class reward pools are eligible.
- Before the player spends a skill point, tier-1 class reward cards should be weighted evenly across the class's `3` trees.
- After the player invests in a class tree, at least `1` class reward option on future screens should come from an invested tree whenever possible.
- Card rewards and skill unlocks should remain separate:
  - cards change the draw pile
  - skill points unlock skill-bar actives and passives
- Default copy cap for class reward cards should be `2`.
- After a class reward card reaches copy cap, repeat offerings should rank that card up instead of adding a third copy.

Implementation note:

- `Combat Masteries` for Barbarian is still mostly a passive tree, but it should contribute mastery-themed reward cards so the tree can influence deck shape without overloading the skill bar.

## Keyword Assumptions

These keywords are used in the exact card text below.

- `Burn X`: the target takes `X` damage at the end of its turn, then `Burn` decreases by `1`.
- `Chill X`: the target deals `X` less damage with its next attack, then remove `Chill`.
- `Exhaust`: remove the card from combat after use.

## Exact Tier-1 Reward Pools

These are the first non-starter class reward cards that should enter the run.

### Barbarian Tier-1 Reward Pools

#### Combat Skills

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Double Swing` | 1 | Attack | 2 | `Deal 4 damage twice. If the target already took damage this turn, gain 1 Energy next turn.` |
| `Leap` | 1 | Skill | 2 | `Gain 7 Block. Your next Attack this turn deals +4 damage.` |
| `Cleave` | 2 | Attack | 2 | `Deal 8 damage to all enemies.` |
| `Stun` | 2 | Attack | 2 | `Deal 9 damage. The target deals 6 less damage with its next attack.` |

Combat Skills tier-1 role:

- make Barbarian's early card rewards feel aggressive and direct
- reward attack sequencing without requiring a deep combo engine
- establish the route toward multi-hit, cleave, and control-heavy attack turns

#### Combat Masteries

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Sword Mastery` | 1 | Skill | 2 | `This combat, your Attacks deal +2 damage. Draw 1. Exhaust.` |
| `Iron Skin` | 1 | Skill | 2 | `Gain 8 Block. Gain 1 Block whenever you play an Attack this turn.` |
| `Increased Speed` | 0 | Skill | 2 | `Draw 1. Your next Attack this turn costs 1 less. Exhaust.` |
| `Natural Resistance` | 1 | Skill | 2 | `Gain 6 Block. Remove 1 debuff. Draw 1.` |

Combat Masteries tier-1 role:

- supply the passive-feeling support cards that make repeated Attacks scale better
- let Barbarian runs stabilize without abandoning aggression
- act as the deck-facing expression of a tree that is otherwise mostly passive

#### Warcries

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Howl` | 1 | Skill | 2 | `Gain 6 Block. All non-boss enemies deal 3 less damage next turn.` |
| `Taunt` | 0 | Skill | 2 | `Choose an enemy. Your next Attack against it deals +6 damage. Draw 1. Exhaust.` |
| `Battle Cry` | 1 | Skill | 2 | `All enemies deal 2 less damage next turn. Your next Attack this turn deals +3 damage.` |
| `Shout` | 2 | Skill | 2 | `Gain 12 Block. Your mercenary deals +4 damage on its next attack.` |

Warcries tier-1 role:

- create defensive tempo and safe attack windows
- connect Barbarian support play to mercenary value
- make early Warcries feel like tactical setup, not passive stat padding

### Sorceress Tier-1 Reward Pools

#### Fire

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Fire Ball` | 2 | Spell | 2 | `Deal 12 damage. Apply 2 Burn.` |
| `Inferno` | 1 | Spell | 2 | `Deal 4 damage to all enemies. Apply 1 Burn to all enemies.` |
| `Blaze` | 1 | Skill | 2 | `Gain 5 Block. Your next Spell this turn deals +5 damage.` |
| `Enchant` | 1 | Skill | 2 | `Your next 2 cards that deal damage this combat deal +3 damage. Draw 1.` |

Fire tier-1 role:

- push the Sorceress toward direct damage and burn pressure
- reward multi-spell turns without demanding late-game energy support
- keep the fire package aggressive and easy to read early

#### Cold

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Ice Bolt` | 1 | Spell | 2 | `Deal 7 damage. Apply 2 Chill.` |
| `Frozen Armor` | 1 | Skill | 2 | `Gain 8 Block. The next enemy that attacks you this turn gains 2 Chill.` |
| `Frost Nova` | 2 | Spell | 2 | `Deal 5 damage to all enemies. Apply 1 Chill to all enemies.` |
| `Ice Blast` | 2 | Spell | 2 | `Deal 10 damage. If the target has Chill, draw 1 and apply 1 more Chill.` |

Cold tier-1 role:

- give Sorceress an early defensive identity without becoming a pure turtle class
- translate chill and freeze fantasy into damage control and safety windows
- support slower spell sequencing and safer elite fights

#### Lightning

| Card | Cost | Type | Copy Cap | Exact Text |
|---|---:|---|---:|---|
| `Charged Bolt` | 1 | Spell | 2 | `Deal 3 damage 3 times, randomly split among enemies.` |
| `Static Field` | 1 | Spell | 2 | `Deal 6 damage to all enemies. Elites and bosses take 3 instead.` |
| `Telekinesis` | 0 | Spell | 2 | `Draw 1. The next enemy you hit this turn deals 5 less damage next turn. Exhaust.` |
| `Nova` | 2 | Spell | 2 | `Deal 8 damage to all enemies. If you played another Spell this turn, gain 1 Energy next turn.` |

Lightning tier-1 role:

- support high-tempo spell turns and flexible target coverage
- create an early energy and sequencing identity without needing full combo density
- give Sorceress a path into chain-cast and board-control play

## Early Skill Unlock Options

These are the first skill-bar unlock candidates that should sit behind early tree investment.

### Barbarian

| Tree | Skill | Cost | Cooldown | Exact Text |
|---|---|---:|---:|---|
| `Combat Skills` | `Double Swing` | 1 | 1 | `Deal 5 damage twice.` |
| `Combat Skills` | `Leap` | 1 | 2 | `Gain 8 Block. Your next Attack this turn deals +5 damage.` |
| `Warcries` | `Howl` | 1 | 2 | `All non-boss enemies deal 4 less damage next turn.` |
| `Warcries` | `Battle Cry` | 1 | 2 | `One enemy deals 6 less damage next turn. Your next Attack against it deals +5 damage.` |

Barbarian tier-1 skill rule:

- `Combat Masteries` should not add early skill-bar actives
- it should focus on passive ranks and mastery-themed card unlocks instead

### Sorceress

| Tree | Skill | Cost | Cooldown | Exact Text |
|---|---|---:|---:|---|
| `Fire` | `Fire Ball` | 2 | 1 | `Deal 13 damage. Apply 2 Burn.` |
| `Fire` | `Inferno` | 1 | 2 | `Deal 5 damage to all enemies. Apply 1 Burn to all enemies.` |
| `Cold` | `Frozen Armor` | 1 | 3 | `Gain 10 Block. The next enemy that attacks you this turn gains 2 Chill.` |
| `Cold` | `Frost Nova` | 2 | 2 | `Deal 5 damage to all enemies. Apply 1 Chill to all enemies.` |
| `Lightning` | `Charged Bolt` | 1 | 1 | `Deal 4 damage 3 times, randomly split among enemies.` |
| `Lightning` | `Static Field` | 1 | 2 | `Deal 7 damage to all enemies. Elites and bosses take 4 instead.` |

Sorceress tier-1 skill rule:

- Sorceress should reach its second equipped skill slot earlier than Barbarian if the run is leaning spell-heavy
- the first spell-bar expansion should reinforce tree commitment, not turn every tree into a splash package

## Deckbuilder vs Roguelite Contract

The deckbuilder layer should answer:

- what do I do this turn
- what combo am I building toward
- which cards deserve space in the deck

The roguelite layer should answer:

- where do I route
- what loot do I take
- what class-tree direction do I commit to
- how does long-run progression evolve

Hard rules:

- no roguelite layer should make the hand feel secondary
- no fixed-skill system should make the deck feel optional
- no consumable system should flood the deck with maintenance cards

## Current Runtime Note

Current runtime implementation still differs from this target model in places:

- some starter skills are currently represented as class cards
- the live class roster is still smaller than the target roster
- this document should be treated as the intended progression model for future implementation work
