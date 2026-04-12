# Optimized Build Profiles

_Snapshot: 2026-04-06_

## Purpose

This document defines what a finished, optimized deck should look like for each class lane at the end of a successful run.

It answers:

- what 18-22 cards should be in a lane's ideal Act 5 deck
- what the 2-3 discovery combos are that players build around
- what gets purged vs kept at each act transition
- what the engine firing moment looks like
- how act-based unlock pacing leads to the optimal hand
- what balance passes should validate

Use it with:

- [CLASS_ARCHETYPE_ENGINE_MAP.md](/Users/andrew/proj/rouge/docs/CLASS_ARCHETYPE_ENGINE_MAP.md)
- [CLASS_CARD_AUTHORING_MATRIX.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_AUTHORING_MATRIX.md)
- [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md)
- [CLASS_DECKBUILDER_PROGRESSION.md](/Users/andrew/proj/rouge/docs/CLASS_DECKBUILDER_PROGRESSION.md)
- [BALANCE_PLAN.md](/Users/andrew/proj/rouge/docs/BALANCE_PLAN.md)
- [D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md)

This is a target-design document, not a claim that the live build already produces these outcomes.

## Benchmark Reference

### What STS teaches about optimized decks

- A good Heart-ready deck has 25-35 cards, not 40
- The engine core is 4-8 cards that make each other better
- The rest is defense, draw, and answers for specific boss mechanics
- 3-5 dead cards (Strikes/Defends) are tolerable IF draw is sufficient to cycle past them
- The best decks have inevitability: they scale faster than the enemy can kill them

### What separates "works" from "dominates"

A deck that works has a win condition, enough defense, and can close fights.

A deck that dominates has:

- **inevitability** — it scales non-linearly (strength doubles, poison triples, burn stacks, summons compound)
- **redundancy** — multiple paths to find engine pieces (draw, cycling, retain-like effects)
- **interaction** — can answer any enemy pattern (AoE, single-target, boss mechanics)
- **tempo** — can defend while assembling the engine, not 5 dead setup turns
- **card quality** — even the worst card in the deck does something useful

The single biggest differentiator is **scaling speed**: how fast the deck reaches its "I can't die" state. 2-3 turns faster is the gap between good and dominant.

### What gets purged

Cards with linear fixed value (Strike deals 6, always 6) get purged first. Cards with multiplicative or conditional value get kept. The question is always: "does this card get better as my engine comes online?"

## Universal Deck Shape

Every optimized Rouge deck should converge toward this shape by Act 5:

| Component | Card Count | Role |
| --- | ---: | --- |
| Engine core | 4-6 | Cards that make each other better |
| Scaling | 2-3 | Cards that make later turns stronger than earlier turns |
| Answers | 3-4 | Cards that handle specific boss/encounter mechanics |
| Draw and cycling | 2-3 | Cards that find engine pieces consistently |
| Sustain | 2-3 | Guard, healing, damage reduction |
| Remaining shell | 3-5 | Unremoved starters, utility splash |
| **Total** | **18-24** | |

If a deck has more than 28 cards at Act 5, it has not been refined enough.

If a deck has fewer than 16 cards, it is dangerously thin against status or multi-enemy encounters.

The sweet spot is 18-24 cards where every card drawn advances the engine, answers a threat, or draws into something that does.

## Druid

### Elemental Storm — Optimized Profile

**Engine fantasy:** Burn setup into elemental burst. Hurricane and Tornado exploit Slowed enemies while Armageddon detonates accumulated Burn.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Firestorm | cheap Burn setup |
| 1 | Twister | cheap Slow setup + draw |
| 1 | Arctic Blast | cold AoE + Slow |
| 1 | Fissure | Burn AoE |
| 1 | Volcano | heavy Burn AoE |
| 1 | Tornado | physical AoE + Slow payoff |
| 1 | Eruption | Burn-to-burst conversion (THE payoff card) |
| 1 | Gale Force | Slow-count scaling |
| 1 | Hurricane | cold AoE + massive Guard |
| 1 | Armageddon | capstone fire AoE |
| 1 | Elemental Mastery | persistent scaling (Burn +2, Slow +1 duration) |
| 1 | Cyclone Armor | Guard + draw |
| 1 | Primal Roar | answer (debuff enemies) |
| 1 | Nature's Balance | conditional draw + Guard |
| 2-3 | remaining shell | Guard, heal, mercenary |

**Discovery combos:**

- **Eruption + Burn stacking** — Eruption deals +4 per Burn stack on each enemy. Play Firestorm + Fissure over 2 turns to stack 6+ Burn, then Eruption deals 6 base + 24 bonus = 30 AoE. This is the Catalyst moment.
- **Gale Force + Slow stacking** — Each Slowed enemy adds +3 to Gale Force. Against 3 Slowed enemies that is 4 + 9 = 13 AoE, plus it applies Slow to set up next turn. Self-reinforcing loop.
- **Elemental Mastery + any Burn/Slow card** — Persistent scaling means every Burn card applies +2 and every Slow lasts longer. Transforms the whole deck.

**Purge priority:** Werewolf (wrong lane), Lycanthropy (weak healing), extra copies of Raven/Poison Creeper (summon lane).

**The moment:** A turn where Eruption detonates 6+ Burn stacks on 3 enemies for 30+ AoE damage while Hurricane freezes the board and Gale Force scales off all the Slow.

### Shifter Bruiser — Optimized Profile

**Engine fantasy:** Transform into werewolf form and sustain through rapid multi-hit attacks with life leech. Each hit gets stronger.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Werewolf | starter melee + sustain |
| 1 | Feral Rage | setup (+3 next melee) + heal |
| 1 | Maul | heavy single-target + Stun |
| 1 | Werebear | answer (Guard + Slow) |
| 1 | Fury | multi-hit payoff |
| 1 | Fire Claws | elemental melee + Burn |
| 1 | Rabies | Poison spread |
| 1 | Shock Wave | AoE Stun answer |
| 1 | Hunger | healing burst + Slow payoff |
| 1 | Primal Fury | 3-hit capstone + life leech |
| 1 | Savage Pounce | status conversion closer |
| 1 | Cyclone Armor | Guard + draw |
| 1 | Lycanthropy | heal + draw |
| 1 | Hibernation | emergency recovery |
| 2-3 | remaining shell | utility, splash |

**Discovery combos:**

- **Feral Rage + Fury** — Feral Rage arms +3, then Fury's 3 hits each benefit. Total: 8 + 12 + 11 + 10 + 9 Guard = massive single turn.
- **Shock Wave + Savage Pounce** — Shock Wave stuns all, then Savage Pounce deals +8 to stunned target. Setup into payoff.
- **Primal Fury + any healing** — 3 hits healing 3 each = 9 HP recovered while dealing 30 damage. The sustain machine.

**Purge priority:** Firestorm (wrong lane), Raven/Poison Creeper (summon lane), extra Guard-only cards.

**The moment:** A Feral Rage into Primal Fury turn where 3 hits each deal 13+ damage with life leech, sustaining through a boss hit.

### Summoner Engine — Optimized Profile

**Engine fantasy:** Build a persistent animal army. Each summon acts every turn. Pack Howl and Heart of Wolverine make all summons stronger simultaneously.

**Ideal Act 5 deck (~22 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Raven | scout summon |
| 1 | Poison Creeper | poison summon |
| 1 | Oak Sage | healing spirit |
| 1 | Spirit Wolf | cold wolf |
| 1 | Carrion Vine | death-recovery summon |
| 1 | Heart of Wolverine | damage aura spirit |
| 1 | Dire Wolf | pack scaling |
| 1 | Spirit of Barbs | AoE thorns summon |
| 1 | Pack Howl | buff all summons (THE scaling card) |
| 1 | Summon Grizzly | capstone tank summon |
| 1 | Wild Stampede | summon-count AoE payoff |
| 1 | Force of Nature | reinforce all + AoE payoff |
| 1 | Cyclone Armor | Guard + draw |
| 1 | Lycanthropy | heal + draw |
| 1 | Renewal | heal + reinforce |
| 2-3 | remaining shell | utility |

**Discovery combos:**

- **Pack Howl + 3 summons** — Each summon deals +4 bonus. With 3 summons that is 12 bonus damage per turn cycle, plus draw if 3+. Repeatable every time Pack Howl is drawn.
- **Wild Stampede + 4 summons** — Deals 5 per summon to all enemies = 20 AoE. The MT Gorge payoff.
- **Heart of Wolverine + Dire Wolf + anything** — Wolverine marks for +7 merc damage, Dire Wolf deals +3 with 2+ summons. Pack synergy compounds.
- **Force of Nature + full board** — Reinforce all by +3 AND each deals 5 damage. Late-game this is 15-20 extra AoE + permanent board growth.

**Purge priority:** Firestorm (wrong lane), Werewolf (shifter lane), damage-only cards without summon synergy.

**The moment:** A board with Grizzly tanking, Dire Wolf + Spirit Wolf dealing bonus damage, Heart of Wolverine marking, then Pack Howl buffs everything and Wild Stampede converts the full board into 20+ AoE.

## Necromancer

### Bone Burst — Optimized Profile

**Engine fantasy:** Magic-damage projectiles that pierce. Poison sets up death, Corpse Explosion chains, Bone Spirit closes.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Teeth | cheap magic damage |
| 1 | Poison Dagger | Poison setup + draw |
| 1 | Poison Explosion | AoE Poison setup |
| 1 | Corpse Explosion | death-chain AoE (THE engine card) |
| 1 | Bone Spear | heavy magic + Poison payoff |
| 1 | Bone Prison | setup (debuff + arm next bone card) |
| 1 | Bone Shrapnel | magic AoE |
| 1 | Bone Spirit | single-target closer |
| 1 | Poison Nova | AoE Poison + Poison payoff |
| 1 | Corpse Lance | death-conversion single-target |
| 1 | Bone Plague | persistent scaling (+3 bone/poison damage) |
| 1 | Bone Armor | Guard |
| 1 | Lower Resist | amplify Poison/Burn + merc mark |
| 1 | Life Tap | salvage |
| 2-3 | remaining shell | Guard, heal |

**Discovery combos:**

- **Poison Nova + Corpse Explosion** — Poison Nova weakens everything. First kill triggers Corpse Explosion for +6 chain AoE against Poisoned enemies. The Fishymancer cascade.
- **Bone Plague + Bone Spear/Spirit** — Bone Plague adds +3 to ALL bone and poison cards for the rest of combat. Bone Spirit goes from 24 to 27 base, Bone Spear from 16+6 to 19+6 vs Poisoned. Demon Form energy.
- **Lower Resist + Poison Nova** — Lower Resist adds +3 to next 2 Poison applications, then Poison Nova hits all enemies with amplified Poison.
- **Corpse Lance + any kill** — If something died last turn, Corpse Lance deals 20 + 10 = 30 single target. The closer after a Corpse Explosion chain.

**The moment:** Poison Nova poisons everything, first enemy dies, Corpse Explosion chains across all enemies dealing bonus damage to Poisoned targets, Corpse Lance finishes the boss.

### Curse Control — Optimized Profile

**Engine fantasy:** Debuff everything so thoroughly that your minions, mercenary, and damage cards hit 2-3x harder. The puppet master.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Amplify Damage | merc mark + draw |
| 1 | Iron Maiden | merc mark |
| 1 | Dim Vision | single-target debuff + Slow |
| 1 | Weaken | AoE damage reduction |
| 1 | Decrepify | heavy merc mark + Slow + draw |
| 1 | Terror | AoE damage reduction + draw |
| 1 | Lower Resist | amplify elemental damage |
| 1 | Confuse | redirect attacks |
| 1 | Curse Mastery | persistent scaling (+2 merc mark, +1 draw) |
| 1 | Mass Curse | capstone AoE debuff + merc mark all |
| 1 | Corpse Explosion | AoE payoff after debuff |
| 1 | Bone Armor | Guard |
| 1 | Life Tap | salvage |
| 1 | Soul Harvest | conditional heal + draw |
| 2-3 | remaining shell | damage, Guard |

**Discovery combos:**

- **Curse Mastery + Decrepify** — Decrepify now marks for 16 merc damage AND draws 2 cards. Every curse becomes a cantrip.
- **Mass Curse + Corpse Explosion** — All enemies deal 5 less, merc deals +12 to everything, then Corpse Explosion chains cascade against weakened targets.
- **Lower Resist + any Poison/Burn card** — Amplifies elemental applications for the whole party. Curse lane enabling bone/summon splash damage.

**The moment:** Curse Mastery is active, you play Decrepify (draw 2 + mark for 16) into Mass Curse (all enemies deal 5 less, merc hits everything for 12) into Corpse Explosion chaining against debuffed enemies.

### Summon Swarm — Optimized Profile

**Engine fantasy:** Wall of undead with Skeleton Mastery scaling them all. Corpse Explosion converts deaths into AoE. Army of the Dead is the capstone payoff.

**Ideal Act 5 deck (~22 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Raise Skeleton | starter summon |
| 1 | Clay Golem | tank summon + Slow |
| 1 | Skeletal Mage | Poison summon |
| 1 | Skeleton Mastery | buff all summons (THE scaling card) |
| 1 | Blood Golem | sustain summon + heal |
| 1 | Golem Mastery | reinforce all + golem bonus |
| 1 | Summon Resist | extend all summon duration |
| 1 | Iron Golem | late tank + Slow |
| 1 | Fire Golem | AoE Burn summon |
| 1 | Revive | capstone summon |
| 1 | Army of the Dead | summon-count AoE payoff |
| 1 | Corpse Explosion | death-chain AoE |
| 1 | Amplify Damage | merc mark + draw |
| 1 | Bone Armor | Guard |
| 1 | Life Tap | salvage |
| 2-3 | remaining shell | Guard, heal |

**Discovery combos:**

- **Skeleton Mastery + 4 summons** — Each summon deals +4 bonus. Board of 4 summons = 16 extra damage per turn. Repeatable.
- **Army of the Dead + 4 summons** — 5 per summon to all = 20 AoE + reinforce all by +2. Permanent board growth.
- **Golem Mastery + Iron/Blood/Fire Golem** — Golem gets +3 instead of +2. Specialized summon scaling.
- **Corpse Explosion + Amplify Damage** — Double physical component of CE after Amp Damage curse.

**The moment:** Board has 4 summons, play Skeleton Mastery (all deal +4), then Army of the Dead (20 AoE + reinforce +2), then everything attacks with boosted stats.

## Amazon

### Bow Volley — Optimized Profile

**Engine fantasy:** Precision ranged volleys where each arrow is amplified. Arrow Mastery makes every ranged card stronger. Multi-shot and Strafe clear screens.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Magic Arrow | cheap ranged + draw |
| 1 | Fire Arrow | Burn setup |
| 1 | Cold Arrow | Slow + Guard |
| 1 | Multiple Shot | AoE + Slow |
| 1 | Exploding Arrow | Burn + draw |
| 1 | Guided Arrow | heavy single-target + draw |
| 1 | Strafe | AoE + draw |
| 1 | Immolation Arrow | Burn AoE |
| 1 | Arrow Mastery | persistent +3 all ranged (THE scaling card) |
| 1 | Pierce | capstone single-target |
| 1 | Freezing Arrow | AoE Freeze |
| 1 | Dodge | Guard + draw |
| 1 | Inner Calm | heal + draw + arm next ranged |
| 1 | Battle Focus | answer |
| 2-3 | remaining shell | utility |

**Discovery combos:**

- **Arrow Mastery + Strafe/Multiple Shot** — Every AoE ranged card deals +3 to ALL enemies. Strafe becomes 12 AoE + draw.
- **Ice Arrow + Freezing Arrow** — Freeze everything, then follow up with Guided Arrow or Pierce on frozen targets.
- **Immolation Arrow + Fire Arrow** — Stack Burn across the board, then Burn ticks whittle everything down between turns.

**The moment:** Arrow Mastery active, play Strafe (12 AoE + Slow + draw) into Guided Arrow (19 single target) into Freezing Arrow (12 AoE + Freeze). Three ranged cards, each amplified by +3.

### Javelin Storm — Optimized Profile

**Engine fantasy:** Build up Paralyze stacks through cheap javelins, then Lightning Fury and Storm Javelin convert those stacks into massive AoE.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Jab | cheap multi-hit |
| 1 | Power Strike | Paralyze + Guard |
| 1 | Lightning Bolt | Paralyze setup |
| 1 | Impale | status payoff (deals more to Paralyzed/Slowed) |
| 1 | Lightning Strike | AoE + Paralyze |
| 1 | Fend | 3-hit payoff |
| 1 | Charged Strike | 2-hit lightning burst |
| 1 | Lightning Fury | capstone AoE |
| 1 | Storm Javelin | Paralyze payoff closer |
| 1 | Javelin Mastery | persistent +3 javelin damage + +1 Paralyze |
| 1 | Dodge | Guard + draw |
| 1 | Inner Sight | merc mark + draw |
| 1 | Precision | status conversion closer |
| 2-3 | remaining shell | Guard, heal |

**Discovery combos:**

- **Javelin Mastery + Lightning Strike** — Lightning Strike now deals 17 + 10 AoE + 3 Paralyze. Every javelin card becomes overstatted.
- **Impale + any Paralyze** — Impale deals 14 + 5 = 19 to Paralyzed targets. Cheap devastating single-target after setup.
- **Storm Javelin + existing Paralyze** — 18 + 8 = 26 single target if target already Paralyzed, plus AoE.
- **Fend × scaling** — 3 hits means Javelin Mastery adds +9 total. With status payoff that could be 33+ single target.

**The moment:** Javelin Mastery active, Lightning Bolt applies 2 Paralyze, then Fend deals 3 × 11+ = 33+ to Paralyzed target, then Lightning Fury clears the board.

## Assassin

### Martial Burst — Optimized Profile

**Engine fantasy:** Charge-up melee setup, then finishers that consume status and deal bonus damage. The combo fighter.

**Ideal Act 5 deck (~20 cards):**

| Qty | Card | Role |
| ---: | --- | --- |
| 1 | Tiger Strike | cheap setup (arms next melee) |
| 1 | Claw Mastery | merc setup + Guard |
| 1 | Fists of Fire | Burn melee + draw |
| 1 | Cobra Strike | life steal melee + draw |
| 1 | Dragon Talon | 3-hit payoff |
| 1 | Claws of Thunder | lightning burst + draw |
| 1 | Dragon Claw | 2-hit + status payoff |
| 1 | Dragon Tail | AoE fire finisher + combo bonus |
| 1 | Phoenix Strike | capstone burst |
| 1 | Dragon Flight | combo-rewarding closer |
| 1 | Combo Mastery | persistent +3 melee +2 Guard |
| 1 | Cloak of Shadows | Guard + draw |
| 1 | Weapon Block | answer |
| 2-3 | remaining shell | Guard, heal |

**Discovery combos:**

- **Combo Mastery + Dragon Talon** — Dragon Talon deals 3 × (5+3) = 24, each hit gaining +2 Guard = +6 Guard. The multi-hit amplifier.
- **Tiger Strike + Dragon Tail** — Tiger Strike arms +3, then Dragon Tail deals 12+3 AoE + 3 Burn to all + 5 combo bonus = 20 AoE fire. Setup into AoE finisher.
- **Dragon Claw + any status** — Against a Burned/Poisoned/Paralyzed target, Dragon Claw deals 2 × (7+3) = 20. Cheap devastating payoff.
- **Fists of Fire + Dragon Flight** — Fists applies Burn, then Dragon Flight deals 20+10 combo bonus = 30 single target.

**The moment:** Combo Mastery active, Tiger Strike arms +3, then Dragon Talon hits 3 × 8 = 24 with +6 Guard, then Dragon Tail converts the combo into 20+ AoE fire.

### Trap Field — Optimized Profile

**Engine fantasy:** Place autonomous traps that stack damage each turn. Trap Mastery makes all traps stronger. Death Sentry chains kills.

**See CLASS_ARCHETYPE_ENGINE_MAP.md for the full trap engine. Key combo: Trap Mastery + Lightning Sentry + Wake of Fire layered = 3 autonomous damage sources scaling +3 each per turn.**

### Shadow Tempo — Optimized Profile

**Engine fantasy:** Speed and hand cycling. Lethal Tempo makes every draw generate more draws. Venom adds Poison to melee. Shadow Master coordinates the mercenary.**

**Key combo: Lethal Tempo (draw engine) + Burst of Speed (draw 2 + merc) + Venom (Poison + arm next melee) into Shadow Master (burst + merc coordination). 4-5 cards per turn, each drawing into the next.**

## Barbarian

### Combat Pressure — Optimized Profile

**Engine fantasy:** Frenzy escalation into Whirlwind AoE. Each attack makes the next stronger. Combat Mastery is the persistent scaling card.

**Key combos:**
- **Combat Mastery + Frenzy Rush** — 3 × (9+3) = 36 + 9 heal + 6 Guard. The Ironclad Strength + Sword Boomerang moment.
- **Fury Howl + Whirlwind** — Slow all + arm next 2 attacks +4, then Whirlwind hits everything for 16+4 = 20 AoE while healing 5.
- **Guard Slam with 20+ Guard** — 10 + 10 bonus = 20 damage from defense alone. The Body Slam payoff.

### Mastery Frontline — Optimized Profile

**Key combos:**
- **Iron Fortress** — Gain 20 Guard then deal half as damage to all = 10 AoE + heal. The Barricade + Body Slam pattern.
- **Combat Mastery + multi-hit** — All attacks deal +3 and gain +3 Guard. Frenzy becomes 2 × 12 = 24 + 6 Guard.

### Warcry Tempo — Optimized Profile

**Key combos:**
- **Battle Command + Battle Orders** — Battle Command makes all warcries draw +1 and gain +4 Guard. Battle Orders then heals 6, draws 2, gives 26 Guard, +16 merc. Every warcry becomes a power card.
- **War Cry + Warlord Shout** — Stun all + 14 AoE, then all enemies deal 5 less + party +5 damage + 16 Guard. Two-turn safe window.

## Paladin

### Combat Zeal — Optimized Profile

**Key combos:**
- **Combat Mastery + Zealous Fury** — 4 × (7+3) = 40 + 12 heal + 6 Guard. The Zeal fantasy realized.
- **Holy Strike + Burn/Slow setup** — 3 × (8+3) = 33 to a Burned target. Multi-hit × status conversion.
- **Charge + Holy Strike** — Charge arms +3, then Holy Strike's 3 hits each benefit = 33+9 = 42 total.

### Offensive Aura — Optimized Profile

**Key combos:**
- **Aura Mastery + Blessed Hammer/Holy Shield** — All aura cards deal +4 and gain +4. Blessed Hammer becomes 13 AoE. Holy Shield becomes 22 party Guard + 12 AoE + draw 2.
- **Conviction + Hammer Storm** — Conviction applies Burn/Slow to all, then Hammer Storm deals +5 to each with status = 19 AoE.
- **Concentration + Fanaticism** — Concentration arms +5 on next aura, then Fanaticism hits 15 AoE + party Guard + merc buff.

### Defensive Anchor — Optimized Profile

**Key combos:**
- **Holy Fortress** — Gain 18 Guard, deal half as AoE. The Paladin Body Slam.
- **Salvation + Redemption** — Salvation gives 22 party Guard + enemies deal 4 less, then Redemption heals 14+ if something died. Unkillable.

## Sorceress

### Fire Burst — Optimized Profile

**Key combos:**
- **Fire Mastery + Conflagration** — Fire Mastery adds +3 damage and +2 Burn to all fire spells. Conflagration deals 12+3 = 15 AoE + 8 Burn, then +8 bonus to enemies with 4+ Burn.
- **Combustion + Burn stacking** — Like Druid Eruption: +3 per Burn stack per enemy. Stack 6 Burn = 6 + 18 = 24 AoE.
- **Fire Wall + Meteor** — Fire Wall applies 5 Burn to all, Meteor adds 4 more + 10 damage. 9 Burn ticking = massive between-turn damage.

### Cold Control — Optimized Profile

**Key combos:**
- **Cold Mastery + Frozen Orb** — Cold Mastery adds +3 damage and +1 Slow. Frozen Orb becomes 13 AoE + 3 Freeze + 10 Guard. Dominant control.
- **Ice Blast + Slow stacking** — Ice Blast deals +6 to already-Slowed targets. After Cold Mastery, everything is permanently Slowed.
- **Chilling Armor + Glacial Spike** — Reactive defense that freezes attackers, then Glacial Spike converts Freeze into damage.

### Lightning Tempo — Optimized Profile

**Key combos:**
- **Arc Mastery + Chain Lightning** — Arc Mastery makes lightning spells draw +1 extra. Chain Lightning already draws 1, now draws 2. Every lightning spell cycles the deck.
- **Overcharge + spell chaining** — If another spell was played this turn, Overcharge deals 10+6 = 16 AoE + 2 Paralyze. The tempo fantasy.
- **Thunder Storm + Lightning** — Thunder Storm arms +5 on next spell, then Lightning deals 20+5 = 25 + draw.

## Act-Based Unlock Pacing

The optimal deck does not exist at the start of a run. It forms through deliberate act-by-act decisions. The unlock pacing must create natural decision points where the player shapes their deck toward one of these profiles.

### Act 1: Exploration and Identity (Deck 13-15 cards)

**Player state:** Starter shell + 1-3 early rewards.

**What should happen:**
- The starter skill (Slot 1) establishes class identity
- First 2-3 card rewards preview which lanes are available
- The player should see at least 1 card from each of the 3 class trees in early rewards
- Purge 0-1 starter cards at the Act 1 sage

**Decision quality:** "Which of these 3 trees looks promising given what I have been offered?"

**Balance checkpoint:** The player should NOT be able to identify the optimal build yet. If one tree always looks better in Act 1, reward weighting is wrong.

### Act 2: Lane Commitment (Deck 16-20 cards)

**Player state:** Slot 2 unlocks (bridge skill). Tree ranks at 2-3.

**What should happen:**
- Reward weighting starts favoring the tree with the most investment
- The player takes 3-5 lane-specific cards
- The engine core starts forming (2-3 engine cards acquired)
- Purge 1-2 starter cards that don't fit the lane
- The bridge skill should complement the forming engine

**Decision quality:** "I'm committing to Elemental Storm. Do I take Eruption now or shore up defense?"

**Balance checkpoint:** The engine should be visible but not yet online. The player should feel the lane forming but still need specific pieces. If the engine is already dominating by Act 2, scaling is too front-loaded.

### Act 3: Engine Online (Deck 18-22 cards)

**Player state:** Slot 3 unlocks (capstone skill). Tree ranks at 4-6. Favored tree established.

**What should happen:**
- The engine core should be complete (4-6 engine cards)
- The scaling card should arrive (Mastery, Bone Plague, Combo Mastery, etc.)
- The player actively purges non-engine cards
- Deck size should stop growing and start shrinking
- The capstone skill should create a new "moment" in combat

**Decision quality:** "My engine is online. Do I take another engine piece (redundancy) or an answer for the Act 3 boss?"

**Balance checkpoint:** The engine should fire for the first time in Act 3. The player should experience the "aha" moment where their cards work together. If the engine never fires until Act 4, card quality or draw is insufficient.

### Act 4: Refinement (Deck 18-22 cards, tighter)

**Player state:** Engine fully online. Deck at peak efficiency.

**What should happen:**
- Purge remaining dead cards aggressively
- Take only cards that strengthen the engine or answer specific boss mechanics
- Upgrades (blacksmith) matter more than new cards
- The player should feel the deck is a machine, not a pile

**Decision quality:** "I have 20 cards and every draw is good. Do I skip this reward entirely?"

**Balance checkpoint:** If the player is still taking generic cards in Act 4, the engine hasn't formed correctly. If the player skips most rewards because the deck is already perfect, that is healthy.

### Act 5: Mastery (Deck 18-22 cards, polished)

**Player state:** Deck is finished. Boss prep.

**What should happen:**
- Final upgrades and boss-tech answers
- The deck should cycle its engine every 2-3 turns
- The "moment" should happen reliably in every fight

**Decision quality:** "Which of my remaining 2 unupgraded engine cards benefits most from the blacksmith?"

**Balance checkpoint:** If the final boss is a stat check, the boss design is wrong. If the player loses because they didn't answer a specific boss mechanic despite having a strong engine, that is healthy — it teaches boss prep for next run.

## Balance Pass Framework

### Pass 1: Engine Formation Audit

For each of the 21 class lanes (7 classes x 3 lanes):

1. Can the engine core (4-6 cards) be assembled by mid Act 3?
2. Is the scaling card available in tier 3 or early tier 4?
3. Does the engine produce non-linear returns? (Each additional engine card makes the others better, not just +6 damage)
4. Can the engine fire within 3 turns of a fight start once assembled?

**Failure mode:** If a lane's engine requires 6+ specific cards that only appear in late tiers, it will never form in time.

### Pass 2: Discovery Combo Validation

For each lane's 2-3 discovery combos:

1. Are both/all combo pieces available in the same tier window?
2. Does the combo produce a noticeable power spike? (At least 50% more output than playing the cards independently)
3. Is the combo discoverable? (Would a player who reads both card texts realize they go together?)
4. Is the combo reliable? (Can the player draw both pieces in the same hand with reasonable draw support?)

**Failure mode:** If the combo requires 3 specific cards in a 5-card hand from a 22-card deck with no draw support, it fires too rarely.

### Pass 3: Purge Path Validation

For each lane:

1. Are there clear "wrong lane" cards the player should purge?
2. Does purging 3-4 starter cards noticeably improve engine consistency?
3. Is the optimal Act 5 deck achievable through normal purge opportunities?
4. Are purge costs balanced against the benefit? (Purging should feel good, not mandatory)

**Failure mode:** If the optimal deck requires purging 8+ cards but only 4-5 purge opportunities exist, deck quality will never peak.

### Pass 4: Scaling Speed Audit

For each lane's engine:

1. How many turns does it take to reach "inevitability" (engine produces more value than enemies deal)?
2. Does the scaling card (Mastery, Bone Plague, etc.) arrive early enough to matter for 3+ acts?
3. Is the scaling curve non-linear? (Turn 5 should be noticeably stronger than turn 3, not just +6 damage)
4. Does the scaling have a ceiling? (Infinite scaling is fine if it takes real investment; free infinite scaling breaks the game)

**Failure mode:** If the engine reaches inevitability on turn 2, the deck is too powerful. If it reaches inevitability on turn 8, most fights are over before the engine matters.

### Pass 5: Lane Parity Check

Across all 21 lanes:

1. Do all lanes reach comparable power levels at comparable investment?
2. Do all lanes have at least 1 discovery combo that players get excited about?
3. Do all lanes have a clear "moment" that feels different from other lanes?
4. Do no 2 lanes from different classes play identically?

**Failure mode:** If Druid Elemental and Sorceress Fire play the same way (stack Burn, detonate), one needs a different mechanical identity.

### Pass 6: Hand Quality Audit

For each lane's optimized deck at Act 5:

1. Simulate 100 random 5-card hands from the ideal 20-card deck
2. What percentage of hands can advance the engine? (Target: 80%+)
3. What percentage of hands contain the scaling card or a draw card? (Target: 60%+)
4. What percentage of hands are "dead" (no engine card, no draw, no answer)? (Target: less than 5%)
5. What is the average energy cost of a 5-card hand? (Target: 4-6 energy, creating 1-2 unplayed card decisions)

**Failure mode:** If more than 10% of hands in the optimized deck cannot advance the engine, the deck either has too many dead cards or insufficient draw.

### Pass 7: Reward Path Audit

For each lane:

1. Simulate 100 runs with the act-based unlock pacing
2. What percentage of runs form the engine core by Act 3? (Target: 70%+)
3. What percentage of runs find the scaling card by Act 4? (Target: 60%+)
4. What percentage of runs reach the optimized deck shape by Act 5? (Target: 40%+)
5. What are the most common failure points? (No scaling card? Wrong lane cards offered? Insufficient purge?)

**Failure mode:** If fewer than 50% of committed-lane runs form the engine core by Act 3, either reward weighting is wrong or the engine requires too many specific pieces.

## Anti-Patterns

### Decks that feel optimized but are not

- **Goodstuff pile** — Every card is individually strong but no two cards make each other better. Wins through raw stats, not engine.
- **Draw spiral** — The deck draws itself every turn but never deals enough damage because all the cards are draw/cycle.
- **Setup forever** — The deck has great setup cards but the payoff never arrives because there are too few payoff cards or they are too expensive.
- **Overkill single target** — The deck can deal 100 damage to one enemy but cannot handle 3 enemies because it has no AoE.

### Signs the card pool is unhealthy

- **One lane dominates all classes** — If every class's best deck is "stack Burn and detonate," Burn is overtuned or other engines are undertuned.
- **Purge is always wrong** — If the optimal deck at every card count is "take everything offered," individual card power is too low and quantity compensates.
- **Purge is always right** — If the optimal deck is always the thinnest possible deck, starter cards are too weak and draw is too good.
- **Discovery combos never fire** — If the intended combos require too many specific pieces, they are theoretically cool but practically irrelevant.

## Next Use

Use this doc to build:

1. automated balance simulation that tracks engine formation per lane
2. hand quality audit tools that evaluate random draws from target decks
3. reward path analysis that tracks how often specific engine cards are offered
4. per-act checkpoint validation in the run progression simulator
