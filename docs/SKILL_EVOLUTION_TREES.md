# Skill Evolution Trees

_Snapshot: 2026-03-19_

Documentation note:
- Use `VENDOR_DESIGN.md` for how evolutions interact with the blacksmith vendor.
- Use `CLASS_DECKBUILDER_PROGRESSION.md` for starter decks and reward pools.
- This document defines every evolution chain per class and the synergy bonuses between cards in the same tree.

## How Evolution Works

Cards evolve along their class tree. A tier-1 card can be taken to the **blacksmith** and evolved into its tier-2 successor, which can later evolve into tier-3, and so on. Evolution **replaces** the card in your deck -- deck size never increases from an evolution.

Rules:
- Each card has at most **one** evolution target.
- Some tier-1 cards share an evolution target (branching entry points into a chain).
- Evolution requires **tree investment** (tree rank 2+ for tier-2, rank 3+ for tier-3, rank 4+ for tier-4) OR reaching the corresponding act.
- Evolved cards keep any generic upgrades (Sharpen, Fortify, etc.) already applied.
- Cards marked as **foundation** are starter/utility cards that do not evolve. They are designed to be purged via the Sage as your deck matures.

## Synergy Bonuses

Cards in the same tree grant passive bonuses to each other when both are in the deck:

| Same-Tree Cards in Deck | Bonus |
|--------------------------|-------|
| 2 cards from same tree | Each deals +1 damage |
| 3 cards from same tree | Each deals +2 damage |
| 4+ cards from same tree | Each deals +2 damage, cheapest costs 1 less (min 0) |

Synergy bonuses stack with generic upgrades. This rewards deep tree commitment: a deck with 4 Fire cards gets more total value than 2 Fire + 2 Cold.

---

## Sorceress

### Cold Tree

```
Ice Bolt ──────> Frost Nova ──────> Blizzard ──────> Frozen Orb
(T1, 1 cost)    (T2, 2 cost)      (T3, 2 cost)     (T4, 2 cost)
5 dmg, 1 Slow   4 AoE, 1 Freeze   6 AoE, 1 Freeze  8 AoE, 2 Freeze
```

Cold identity: Crowd control through Slow and Freeze. Scales from single-target control to full-board lockdown.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Ice Bolt | 1 | 1 | Deal 5 cold damage. Apply 1 Slow. |
| Frost Nova | 2 | 2 | Deal 4 cold damage to all enemies. Apply 1 Freeze to all. |
| Blizzard | 3 | 2 | Deal 6 cold damage to all enemies. Apply 1 Freeze to all. |
| Frozen Orb | 4 | 2 | Deal 8 cold damage to all enemies. Apply 2 Freeze to all. |

### Fire Tree

```
Fire Bolt ──────> Fireball ────────> Meteor
(T1, 1 cost)     (T2, 2 cost)       (T3, 2 cost)
6 dmg, 2 Burn    10 dmg, 3 Burn     9 AoE, 3 Burn AoE

Inferno (T2, 1 cost) ──────> Hydra (T4, 2 cost)
5 dmg, 4 Burn                8 AoE, 5 Burn AoE
```

Fire identity: Raw damage and Burn stacking. Two paths -- burst (Fireball -> Meteor) and sustained DoT (Inferno -> Hydra).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Fire Bolt | 1 | 1 | Deal 6 fire damage. Apply 2 Burn. |
| Fireball | 2 | 2 | Deal 10 fire damage. Apply 3 Burn. |
| Meteor | 3 | 2 | Deal 9 fire damage to all enemies. Apply 3 Burn to all. |
| Inferno | 2 | 1 | Deal 5 fire damage. Apply 4 Burn. |
| Hydra | 4 | 2 | Deal 8 fire damage to all enemies. Apply 5 Burn to all. |

### Lightning Tree

```
Charged Bolt ──────> Static Field ──────> Chain Lightning ──────> Lightning Mastery
(T1, 1 cost)        (T2, 1 cost)         (T3, 2 cost)           (T4, 2 cost)
7 dmg, 1 Paralyze   4 AoE, 1 Para AoE    7 AoE, 1 Para AoE     10 AoE, 2 Para AoE
```

Lightning identity: AoE damage with Paralyze. Cost-efficient early, scales into heavy board-wide pressure.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Charged Bolt | 1 | 1 | Deal 7 lightning damage. Apply 1 Paralyze. |
| Static Field | 2 | 1 | Deal 4 lightning damage to all enemies. Apply 1 Paralyze to all. |
| Chain Lightning | 3 | 2 | Deal 7 lightning damage to all enemies. Apply 1 Paralyze to all. |
| Lightning Mastery | 4 | 2 | Deal 10 lightning damage to all enemies. Apply 2 Paralyze to all. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Warmth | 1 | Guard + Draw cycle | Medium -- useful until deck is tight |
| Energy Shield | 1 | Damage + Guard hybrid | High -- weak at both jobs |
| Frozen Armor | 1 | Heal + Guard sustain | Medium -- good early survivability |

---

## Barbarian

### Combat Skills Tree

```
Bash ──────> Stun ──────> Concentrate ──────> Berserk
(T1, 1)     (T2, 1)      (T3, 1)             (T4, 2)
9 dmg        10 dmg       10 dmg, 6 Guard     18 dmg

                           Leap Attack (T3, 2) ──────> Whirlwind (T4, 2)
                           8 AoE                        10 AoE, 5 Guard
```

Two paths: single-target power (Bash -> Berserk) and AoE clearing (Leap Attack -> Whirlwind).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Bash | 1 | 1 | Deal 9 damage. |
| Stun | 2 | 1 | Deal 10 damage. |
| Concentrate | 3 | 1 | Deal 10 damage. Gain 6 Guard. |
| Berserk | 4 | 2 | Deal 18 magic damage. |
| Double Swing | 2 | 1 | Deal 6 damage. Deal 5 damage. |
| Frenzy | 3 | 2 | Deal 8 damage. Deal 7 damage. Draw 1. |
| Leap | 2 | 1 | Deal 8 damage. Gain 4 Guard. |
| Leap Attack | 3 | 2 | Deal 8 damage to all enemies. |
| Whirlwind | 4 | 2 | Deal 10 damage to all enemies. Gain 5 Guard. |

Alternate entry point:
```
Double Swing ──────> Frenzy
(T2, 1 cost)        (T3, 2 cost)
6+5 multi-hit        8+7 multi-hit, Draw 1
```

### Warcries Tree

```
Howl ──────> Shout ──────> Battle Orders ──────> War Cry
(T1, 1)     (T2, 1)       (T3, 2)               (T4, 2)
6 Guard,     7 Party       10 Party Guard,        6 AoE, 8 Party
Draw 1       Guard         Merc +4                Guard
```

Warcries identity: Party defense and mercenary synergy. Every evolution is a strict upgrade to the support role.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Howl | 1 | 1 | Gain 6 Guard. Draw 1 card. |
| Shout | 2 | 1 | You and your mercenary gain 7 Guard. |
| Battle Orders | 3 | 2 | You and your mercenary gain 10 Guard. Mercenary next attack +4. |
| War Cry | 4 | 2 | Deal 6 damage to all enemies. You and your mercenary gain 8 Guard. |

### Masteries Tree

```
Sword Mastery ──────> Leap ──────> Concentrate
(T1, 1 cost)         (T2, 1)      (T3, 1)
7 dmg, 3 Guard       8 dmg,       10 dmg, 6 Guard
                      4 Guard
```

Masteries identity: Efficient damage + Guard hybrids. Steady, reliable cards that scale well with generic upgrades.

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Iron Skin | 1 | Damage + Guard hybrid | Medium |
| Find Potion | 1 | Heal + Guard sustain | High -- early crutch |
| Natural Resistance | 1 | Heal + Guard sustain | High -- early crutch |

---

## Necromancer

### Poison & Bone Tree

```
Teeth ──────> Corpse Explosion ──────> Bone Spear ──────> Bone Spirit
(T1, 1)       (T2, 2)                 (T3, 2)            (T4, 2)
7 magic dmg    6 fire AoE              14 magic dmg       16 magic dmg, Draw 1
```

```
Bone Wall ──────> Poison Dagger ──────> Skeletal Mage ──────> Poison Nova
(T1, 1)           (T2, 1)              (T3, 1)               (T4, 2)
5 dmg, 4 Guard    5 dmg, 3 Poison      6 dmg, 3 Poison,      7 poison AoE,
                                        Merc +3               4 Poison AoE
```

Two paths: pure magic burst (Teeth -> Bone Spirit) and poison DoT with merc synergy (Bone Wall -> Poison Nova).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Teeth | 1 | 1 | Deal 7 magic damage. |
| Corpse Explosion | 2 | 2 | Deal 6 fire damage to all enemies. |
| Bone Spear | 3 | 2 | Deal 14 magic damage. |
| Bone Spirit | 4 | 2 | Deal 16 magic damage. Draw 1 card. |
| Bone Wall | 1 | 1 | Deal 5 damage. Gain 4 Guard. |
| Poison Dagger | 2 | 1 | Deal 5 poison damage. Apply 3 Poison. |
| Skeletal Mage | 3 | 1 | Deal 6 damage. Apply 3 Poison. Mercenary next attack +3. |
| Poison Nova | 4 | 2 | Deal 7 poison damage to all enemies. Apply 4 Poison to all. |

### Curses Tree

```
Amplify Damage ──────> Iron Maiden ──────> Decrepify
(T1, 1)               (T2, 1)             (T3, 1)
3 dmg, Merc +6         4 dmg, Merc +7      5 dmg, Merc +8, Draw 1
```

Curses identity: Mercenary force multiplier. Every evolution increases the mark value and adds utility.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Amplify Damage | 1 | 1 | Deal 3 damage. Your mercenary deals +6 to this target. |
| Iron Maiden | 2 | 1 | Deal 4 damage. Your mercenary deals +7 to this target. |
| Decrepify | 3 | 1 | Deal 5 damage. Your mercenary deals +8 to this target. Draw 1 card. |

### Summoning Tree

```
Raise Skeleton ──────> Clay Golem ──────> Blood Golem ──────> Revive
(T1, 1)               (T2, 1)            (T3, 2)             (T4, 2)
Heal Merc 5,           6 Party Guard,     Heal 8,              Heal Merc 10,
Merc +3, Draw 1        Merc +3            6 Party Guard        8 Party Guard, Merc +5
```

Summoning identity: Mercenary sustain and party defense. Keeps your merc alive and fighting.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Raise Skeleton | 1 | 1 | Heal your mercenary 5. Mercenary next attack +3. Draw 1 card. |
| Clay Golem | 2 | 1 | You and your mercenary gain 6 Guard. Mercenary next attack +3. |
| Blood Golem | 3 | 2 | Heal 8. You and your mercenary gain 6 Guard. |
| Revive | 4 | 2 | Heal your mercenary 10. You and your mercenary gain 8 Guard. Mercenary next attack +5. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Bone Armor | 1 | Pure Guard | Medium -- decent but one-dimensional |
| Life Tap | 1 | Heal + Guard sustain | High -- early crutch |

---

## Amazon

### Bow & Crossbow Tree

```
Magic Arrow ──────> Cold Arrow ──────> Guided Arrow ──────> Freezing Arrow
(T1, 1)             (T2, 1)            (T3, 1)              (T4, 2)
7 magic dmg          7 cold, 1 Slow     12 dmg, Draw 1       7 cold AoE, 1 Freeze AoE

Fire Arrow ──────> Exploding Arrow ──────> Strafe
(T1, 1)            (T2, 2)                (T3, 2)
5 dmg, 2 Burn      8 fire, 3 Burn         7 AoE, Draw 1
```

Two paths: precision (Magic Arrow -> Freezing Arrow) and fire AoE (Fire Arrow -> Strafe).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Magic Arrow | 1 | 1 | Deal 7 magic damage. Ignores guard. |
| Cold Arrow | 2 | 1 | Deal 7 cold damage. Apply 1 Slow. |
| Guided Arrow | 3 | 1 | Deal 12 damage. Draw 1 card. |
| Freezing Arrow | 4 | 2 | Deal 7 cold damage to all enemies. Apply 1 Freeze to all. |
| Fire Arrow | 1 | 1 | Deal 5 damage. Apply 2 Burn. |
| Exploding Arrow | 2 | 2 | Deal 8 fire damage. Apply 3 Burn. |
| Strafe | 3 | 2 | Deal 7 damage to all enemies. Draw 1 card. |
| Multiple Shot | 2 | 2 | Deal 5 damage to all enemies. |

### Javelin & Spear Tree

```
Jab ──────> Power Strike ──────> Charged Strike ──────> Lightning Fury
(T1, 1)     (T2, 1)              (T3, 2)                (T4, 2)
5+3 multi    9 lightning,          12 lightning,           9 lightning AoE,
             1 Paralyze            2 Paralyze              2 Paralyze AoE
```

Javelin identity: Lightning damage and Paralyze. Scales from cheap multi-hit into devastating AoE.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Jab | 1 | 1 | Deal 5 damage. Deal 3 damage. |
| Power Strike | 2 | 1 | Deal 9 lightning damage. Apply 1 Paralyze. |
| Charged Strike | 3 | 2 | Deal 12 lightning damage. Apply 2 Paralyze. |
| Lightning Fury | 4 | 2 | Deal 9 lightning damage to all enemies. Apply 2 Paralyze to all. |

### Passive & Magic Tree

```
Inner Sight ──────> Valkyrie
(T1, 1)             (T3, 2)
3 dmg, Merc +5      8 Party Guard, Merc +4
```

Passive tree is sparse by design. Inner Sight evolves into Valkyrie for merc-focused builds. Other passives are foundations.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Inner Sight | 1 | 1 | Deal 3 damage. Your mercenary deals +5 to this target. |
| Valkyrie | 3 | 2 | You and your mercenary gain 8 Guard. Mercenary next attack +4. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Dodge | 1 | Damage + Guard hybrid | Medium |
| Critical Strike | 1 | Heal + Guard sustain | High -- early crutch |

---

## Assassin

### Martial Arts Tree

```
Tiger Strike ──────> Cobra Strike ──────> Claws of Thunder ──────> Phoenix Strike
(T1, 1)              (T2, 1)              (T3, 2)                  (T4, 2)
5+4 multi-hit         8 dmg, Heal 4        14 lightning dmg          12 dmg, 4 Burn, Draw 1
```

Martial Arts identity: Multi-hit into heavy single-target finishers. Cobra Strike adds lifesteal for sustain.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Tiger Strike | 1 | 1 | Deal 5 damage. Deal 4 damage. |
| Cobra Strike | 2 | 1 | Deal 8 damage. Heal 4. |
| Claws of Thunder | 3 | 2 | Deal 14 lightning damage. |
| Phoenix Strike | 4 | 2 | Deal 12 damage. Apply 4 Burn. Draw 1 card. |

### Traps Tree

```
Fire Blast ──────> Wake of Fire ──────> Lightning Sentry ──────> Death Sentry
(T1, 1)            (T2, 2)              (T3, 2)                  (T4, 2)
5 fire, 2 Burn     4 fire AoE,           6 lightning AoE,          8 lightning AoE,
                    2 Burn AoE            1 Paralyze AoE            2 Paralyze AoE
```

Traps identity: AoE damage with element variety. Fire early, lightning late. Board control specialist.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Fire Blast | 1 | 1 | Deal 5 fire damage. Apply 2 Burn. |
| Wake of Fire | 2 | 2 | Deal 4 fire damage to all enemies. Apply 2 Burn to all. |
| Lightning Sentry | 3 | 2 | Deal 6 lightning damage to all enemies. Apply 1 Paralyze to all. |
| Death Sentry | 4 | 2 | Deal 8 lightning damage to all enemies. Apply 2 Paralyze to all. |

### Shadow Disciplines Tree

```
Psychic Hammer ──────> Burst of Speed ──────> Fade
(T1, 1)                (T2, 1)                (T3, 1)
4 dmg, 4 Guard         6 Guard, Draw 2         7 Party Guard

Claw Mastery ──────> Shadow Warrior
(T1, 1)              (T3, 1)
8 dmg                 Heal Merc 6, Merc +5
```

Shadow identity: Utility and flexibility. Two branches -- defensive cycle (Psychic Hammer -> Fade) and merc support (Claw Mastery -> Shadow Warrior).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Psychic Hammer | 1 | 1 | Deal 4 damage. Gain 4 Guard. |
| Burst of Speed | 2 | 1 | Gain 6 Guard. Draw 2 cards. |
| Fade | 3 | 1 | You and your mercenary gain 7 Guard. |
| Claw Mastery | 1 | 1 | Deal 8 damage. |
| Shadow Warrior | 3 | 1 | Heal your mercenary 6. Mercenary next attack +5. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Blade Shield | 1 | Damage + Guard hybrid | Medium |
| Cloak of Shadows | 1 | Heal + Guard sustain | High -- early crutch |

---

## Druid

### Elemental Tree

```
Firestorm ──────> Molten Boulder ──────> Volcano ──────> Armageddon
(T1, 1)           (T2, 2)                (T3, 2)          (T4, 2)
5 fire, 2 Burn    10 fire, 2 Burn        7 fire AoE,      9 fire AoE,
                                          3 Burn AoE       4 Burn AoE

              Fissure (T2, 2) ──────> Tornado (T3, 2) ──────> Hurricane (T4, 2)
              5 fire AoE,              9 AoE                    8 cold AoE,
              2 Burn AoE                                        6 Guard
```

Two paths: pure fire DoT (Firestorm -> Armageddon) and wind/mixed AoE (Fissure -> Hurricane).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Firestorm | 1 | 1 | Deal 5 fire damage. Apply 2 Burn. |
| Molten Boulder | 2 | 2 | Deal 10 fire damage. Apply 2 Burn. |
| Volcano | 3 | 2 | Deal 7 fire damage to all enemies. Apply 3 Burn to all. |
| Armageddon | 4 | 2 | Deal 9 fire damage to all enemies. Apply 4 Burn to all. |
| Fissure | 2 | 2 | Deal 5 fire damage to all enemies. Apply 2 Burn to all. |
| Tornado | 3 | 2 | Deal 9 damage to all enemies. |
| Hurricane | 4 | 2 | Deal 8 cold damage to all enemies. Gain 6 Guard. |

### Shape Shifting Tree

```
Werewolf ──────> Werebear ──────> Fury
(T1, 1)          (T2, 1)          (T3, 2)
8 dmg, 2 Guard   7 dmg, 5 Guard   7+6+5 triple-hit
```

Shape Shifting identity: Efficient melee with scaling Guard. Short chain but each card is high-value.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Werewolf | 1 | 1 | Deal 8 damage. Gain 2 Guard. |
| Werebear | 2 | 1 | Deal 7 damage. Gain 5 Guard. |
| Fury | 3 | 2 | Deal 7 damage. Deal 6 damage. Deal 5 damage. |

### Summoning Tree

```
Raven ──────> Oak Sage ──────> Heart of Wolverine ──────> Summon Grizzly
(T1, 1)       (T2, 1)          (T3, 1)                    (T4, 2)
4 dmg,         Heal 6,          6 Party Guard,              10 Party Guard,
Merc +4        Heal Merc 6      Merc +5                     Merc +5
```

Summoning identity: Party sustain and merc amplification. Every card in the chain heals or buffs your team.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Raven | 1 | 1 | Deal 4 damage. Your mercenary deals +4 to this target. |
| Oak Sage | 2 | 1 | Heal 6. Heal your mercenary 6. |
| Heart of Wolverine | 3 | 1 | You and your mercenary gain 6 Guard. Mercenary next attack +5. |
| Summon Grizzly | 4 | 2 | You and your mercenary gain 10 Guard. Mercenary next attack +5. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Poison Creeper | 1 | Poison DoT applicator | Medium -- decent if stacking poison |
| Cyclone Armor | 1 | Damage + Guard hybrid | Medium |
| Lycanthropy | 1 | Heal + Guard sustain | High -- early crutch |

---

## Paladin

### Combat Tree

```
Sacrifice ──────> Zeal ──────> Blessed Hammer ──────> Fist of the Heavens
(T1, 1)           (T2, 2)      (T3, 2)                (T4, 2)
10 dmg             5+4+3 multi  8 magic AoE            16 magic dmg, Heal 5

Smite ──────> Holy Bolt ──────> Vengeance
(T1, 1)       (T2, 1)          (T3, 2)
6 dmg,         8 magic, Heal 3  10 dmg, 3 Burn
4 Guard
```

Two paths: burst AoE (Sacrifice -> Fist of the Heavens) and sustain offense (Smite -> Vengeance).

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Sacrifice | 1 | 1 | Deal 10 damage. |
| Zeal | 2 | 2 | Deal 5 damage. Deal 4 damage. Deal 3 damage. |
| Blessed Hammer | 3 | 2 | Deal 8 magic damage to all enemies. |
| Fist of the Heavens | 4 | 2 | Deal 16 magic damage. Heal 5. |
| Smite | 1 | 1 | Deal 6 damage. Gain 4 Guard. |
| Holy Bolt | 2 | 1 | Deal 8 magic damage. Heal 3. |
| Vengeance | 3 | 2 | Deal 10 damage. Apply 3 Burn. |

### Defensive Auras Tree

```
Prayer ──────> Defiance ──────> Holy Freeze ──────> Holy Shield
(T1, 1)        (T2, 1)         (T3, 2)              (T3, 1)
Heal 5 both    8 Party Guard    6 cold AoE,
                                6 Party Guard
```

Note: Holy Shield is an alternate tier-3 evolution from Defiance for players who want pure Guard over AoE.

```
Defiance ──> Holy Freeze (AoE + Party Guard)
         └─> Holy Shield (10 Guard + Draw 1)
```

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Prayer | 1 | 1 | Heal 5. Heal your mercenary 5. |
| Defiance | 2 | 1 | You and your mercenary gain 8 Guard. |
| Holy Freeze | 3 | 2 | Deal 6 cold damage to all enemies. You and your mercenary gain 6 Guard. |
| Holy Shield | 3 | 1 | Gain 10 Guard. Draw 1 card. |

### Offensive Auras Tree

```
Might ──────> Holy Fire ──────> Fanaticism
(T1, 1)       (T2, 1)          (T4, 2)
Merc +5,       6 fire,          6 Party Guard,
Draw 1         3 Burn            Merc +8

Thorns ──────> Conviction
(T1, 1)        (T4, 2)
5 dmg,          7 AoE, Merc +6
4 Guard
```

Offensive Auras identity: Mercenary damage amplification. Might builds into merc-focused endgame; Thorns branches into AoE.

| Card | Tier | Cost | Effect |
|------|------|------|--------|
| Might | 1 | 1 | Mercenary next attack +5. Draw 1 card. |
| Holy Fire | 2 | 1 | Deal 6 fire damage. Apply 3 Burn. |
| Fanaticism | 4 | 2 | You and your mercenary gain 6 Guard. Mercenary next attack +8. |
| Thorns | 1 | 1 | Deal 5 damage. Gain 4 Guard. |
| Conviction | 4 | 2 | Deal 7 damage to all enemies. Your mercenary deals +6 to all targets. |

### Foundation Cards (No Evolution)

| Card | Tier | Role | Purge Priority |
|------|------|------|----------------|
| Cleansing | 1 | Heal + Guard sustain | High -- early crutch |

---

## Shared Card: Rally Mercenary

Every class starts with one copy of `Rally Mercenary` in their deck. This is a neutral foundation card that does not evolve and is a high-priority purge target once your tree cards handle mercenary support.

---

## Evolution Cost Table

| Evolution | Gold Cost | Requirement |
|-----------|-----------|-------------|
| Tier 1 -> Tier 2 | 60 gold | Tree rank 2+ or Act 2+ |
| Tier 2 -> Tier 3 | 100 gold | Tree rank 3+ or Act 3+ |
| Tier 3 -> Tier 4 | 150 gold | Tree rank 4+ or Act 4+ |

Compare to generic upgrades at 40-100 gold. Evolution costs more but transforms the card entirely.

## Strategic Implications

### Deck Thinning Priority

1. **Purge foundation cards first** (Sage). These are filler that dilute draws.
2. **Evolve your core tree** (Blacksmith). Convert tier-1 starters into tier-2/3 as soon as possible.
3. **Stack synergy bonuses**. Keep 3-4 cards from the same tree for the +2 damage bonus.
4. **Skip off-tree card rewards**. A focused 10-card deck with tier-3 evolutions beats a 16-card deck with scattered tier-1 cards.

### Ideal Late-Game Deck Shape

A well-built Act 4-5 deck should look like:

- 3-4 evolved tree cards (tier 3-4) with synergy bonuses
- 1-2 cards from a secondary tree for flexibility
- 1-2 generic upgrades applied to key cards
- 0-1 foundation cards remaining (ideally zero)
- Total deck size: **8-12 cards**

This mirrors the Monster Train endgame: a tight deck that draws its combo pieces every turn.
