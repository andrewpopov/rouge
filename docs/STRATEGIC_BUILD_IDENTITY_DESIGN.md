# Strategic Build Identity Design

_Snapshot: 2026-03-31_

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `DECKBUILDER_COMBAT_MODEL.md` for the high-level hybrid gameplay model.
- Use this document for target-state strategy design: build identity, deck pressure, boss asks, and run-shaping decisions.
- Use `STRATEGIC_GAMEPLAY_EXECUTION_PLAN.md` for the concrete modification plan.
- Use `CLASS_STRATEGY_GUIDE_SYSTEM.md` and `docs/strategy-guides/*.md` for per-class guide-source material.
- Use `IMPLEMENTATION_PROGRESS.md` for current live status and `artifacts/balance/latest.md` for the latest deterministic balance snapshot.

## Purpose

Rouge should ask the player to win the run by building a strategy, not by accumulating generic power.

The target feel is closer to the best parts of _Slay the Spire_ and _Monster Train_:

- early choices narrow later possibilities
- deck composition matters enough that a single card can improve or damage the build
- bosses force preparation instead of being simple stat checks
- itemization reinforces an archetype instead of replacing the need for one
- randomness creates tension around draws, shops, loot, and route options, but coherent planning still beats drifting into a pile of goodstuff

The dark-fantasy ARPG theme changes the surface area, not the goal. Rouge should feel like a Blood Rogue run where the player is assembling a deck, a skill path, a mercenary package, and an item plan that all point in the same direction.

## External Strategic Read

Rouge should intentionally split its references instead of treating _Slay the Spire_ and _Monster Train_ as the same kind of model.

### What _Slay the Spire_ gets right

Primary design read:

- Anthony Giovannetti's GDC talk and notes on enemy intent, hand tension, and balance iteration

- A run is defined by synergy, not by collecting individually strong cards.
- Lean decks make every draft choice matter; adding the wrong card is a real cost.
- Tactical turns have strategic consequences because enemy intents are visible, healing is limited, and every point of damage taken can hurt future fights.
- Card removal, upgrades, and route choices matter because they shape whether the deck draws its important pieces often enough.

Rouge translation:

- _Slay the Spire_ is the better reference for combat turns, hand pressure, energy pressure, and readable enemy asks.

### What _Monster Train_ gets right

Primary design read:

- official _Monster Train_ game materials and feature descriptions
- champion or clan reinforcement, merchant upgrades, and route-layer planning

- Winning decks are planned engines, not accidental piles.
- The best builds usually revolve around one or two centerpiece interactions with support pieces that improve consistency.
- Strategy exists at multiple levels at once: run pathing, upgrade routing, sequencing, and battlefield planning.
- Bosses have enough health and enough specific asks that players must plan toward them instead of assuming raw stats will carry the run.

Rouge translation:

- _Monster Train_ is the better reference for between-fight reinforcement, merchant pressure, and turning a few key cards into exceptional pieces.

### What Diablo II contributes

- class fantasy
- three-tree identity
- specialization pressure
- utility splash
- repeat-run boss and matchup preparation

Rouge translation:

- D2 should provide the class shape and preparation mindset, not override the fact that Rouge is a deckbuilder in actual play.

## Rouge Translation

Rouge should apply those same strategic ideas through Blood Rogue systems.

- Class trees are the archetype lanes.
- Skill cards are the tactical engine pieces.
- Weapon families and proficiencies are the delivery system for those plans.
- Runes and runewords are the medium-term power projects that sharpen a build.
- Quests and world nodes are the route-layer choices that either reinforce, pivot, or smooth a run.
- Mercenary contracts are support packages.
- Bosses are act-level exams for the build the player has assembled.

The player should feel like they are not just "playing a class." They are building a version of that class that has a game plan.

The clean summary is:

- _Slay the Spire_ for turn tension
- _Monster Train_ for upgrade and reinforcement structure
- Diablo II for specialization and matchup-prep identity

## Design Principles

### 1. Early picks should seed identity

Act I should not fully lock the run, but it should establish momentum.

- The first tree investments, weapon family, and first few card picks should bias future offers.
- Reward routing should increasingly reinforce the player's emerging path.
- Pivots should stay possible, but they should have a real opportunity cost in lost tempo, deck pollution, or delayed scaling.

### 2. Winning builds should have an engine, support, and answers

A successful deck should not just "do damage." It should contain:

- a primary engine
- support cards or passives that make the engine reliable
- defensive or tempo tools that let the engine come online
- specific answer cards for boss patterns, elites, or problem enemies

Examples:

- a Bow Amazon that wins through repeated ranged pressure plus freeze or draw support
- a Bone Necromancer that needs curse setup and survivability before the burst matters
- a Zeal Paladin that needs enough guard or aura support to survive burst windows

### 3. Deck curation must matter more than raw accumulation

Rouge should reward saying no.

- Good builds should value card skips, card removal, or upgrade choices over taking every reward.
- Starter-shell cards should become liabilities if the player does not replace or upgrade them thoughtfully.
- Late-game successful decks should feel curated rather than merely enlarged.

### 4. Bosses should test planning, not only damage racing

No boss should be a one-turn target dummy for optimized builds.

- Boss fights should last long enough for draw order, sequencing, and setup to matter.
- Multi-turn telegraphs should force tradeoffs between greed and safety.
- Each act boss should ask a different strategic question.

Target examples:

- The Briar Matron should test poison handling, early sustain, and whether the player can survive a longer opener.
- The Sepulcher Devourer should test guard, mercenary protection, and surviving direct pressure.
- The Idol Patriarch should test backline disruption, lightning mitigation, and tempo recovery.
- The Cinder Tyrant should test burst survival, telegraph reading, and whether the deck has a real late-game plan.
- The Siege Tyrant should test consistency, summon handling, and the ability to fight through disruption.

### 5. Items should reinforce archetypes, not replace them

Weapons, armor, runes, and uniques should make a strategy sharper.

- Weapon families should deepen matching skill plans.
- Armor should support the defensive model of the build instead of being a universal answer.
- Runewords should be realistic mid-run goals that push a deck further into its intended lane.
- Uniques should feel like archetype-defining spikes, not generic stat packages.

### 6. Hand size and draw manipulation should be build-defining axes

Hand size should matter because the run contains real engines and real tension.

- Combo, spell-chain, and setup-heavy archetypes should value extra hand size much more than blunt aggro decks do.
- Opening draw and hand size should be especially meaningful on classes like Sorceress, Assassin traps, and Necromancer control.
- These bonuses should stay rare enough that they create identity rather than becoming mandatory baseline power.

### 7. Quest rewards should shape builds

Quest rewards should not mostly read as generic gold or life.

- Quests should frequently offer "reinforce current plan" versus "flexible economy" versus "risky pivot" decisions.
- Runeforge quests should help complete a real project, not just hand over disconnected materials.
- Class-flavored quests should sometimes expose a strategy earlier than normal rewards would.

### 8. Randomness should create adaptation pressure, not erase skill

We want deck draw, loot, and route variation to matter.

- Strong builds should still need to navigate awkward draws.
- Weak builds should still sometimes survive through good tactical play.
- The system should reward planning around likely variance instead of only rewarding perfect high-rolls.

## Intended Run Shape

### Act I: Seed the path

The player should start identifying what kind of run this is.

- take the first meaningful tree direction
- identify likely weapon family
- choose whether the run is leaning aggressive, setup-heavy, defensive, or summon-based
- begin the first rune or runeword project if possible

The desired feeling is not "I already know the final deck." It is "I know what kind of deck I am trying to become."

### Act II: Commit to a real plan

By the middle of Act II, the build should have visible structure.

- the favored tree should be real
- the deck should have a primary win condition
- the player should be making route choices to support that condition
- the build should be looking for consistency, not just raw card count

### Act III: Refine and tech

By Act III, the player should know what the deck does well and what can kill it.

- add boss answers
- trim dead cards
- reinforce the best draw patterns
- chase weapon, armor, and runeword upgrades that fit the plan

### Acts IV-V: Solve the endgame exam

The late run should be about refinement, not discovering a build from scratch.

- late choices should sharpen consistency and matchup answers
- final bosses should punish decks that never developed a coherent plan
- a winning late-game build should feel "piloted" rather than just numerically large

## Target Archetypes By Class

These are the strategies Rouge should explicitly support and test for.

### Amazon

- `Bow Volley`: repeated ranged pressure, backline clear, chill or freeze support, and deck-thinning toward reliable multishot turns.
- `Javelin Storm`: chain or shock pressure, pierce-style turns, risky aggressive sequencing, and strong single-turn tempo.
- `Passive Tempo`: critical-hit, dodge, mercenary support, and payoff from efficient repeated attacks instead of big spells.

### Assassin

- `Martial Burst`: charge-build or payoff turns, sequence-sensitive burst, and survival tools that preserve momentum until the burst arrives.
- `Trap Field`: delayed area control, enemy-wave planning, and careful pacing so traps matter over multiple turns.
- `Shadow Tempo`: evasion, clone or setup value, and tactical flexibility through a wider set of medium-value lines.

### Barbarian

- `Combat Pressure`: weapon-driven frontline aggression, guard-positive attacks, and aggressive turns that still respect incoming boss telegraphs.
- `Mastery Frontline`: steadier scaling through weapon specialization, more resilient draw patterns, and less explosive but more reliable pressure.
- `Warcry Tempo`: taunt, guard, buff, and mercenary synergy, using timing and sequencing rather than only raw hits.

### Druid

- `Elemental Storm`: spell sequencing, typed-damage specialization, and scaling that rewards surviving until bigger turns matter.
- `Shifter Bruiser`: durable melee identity with stance or attack chaining and enough sustain to outlast awkward draws.
- `Summoner Engine`: board-building through wolves, vines, or allied support, where the run wins by stabilizing and scaling.

### Necromancer

- `Bone Burst`: setup-heavy burst deck with curses or control buying the time needed for payoff spells.
- `Curse Control`: enemy weakening, slower attrition, and deliberate tech choices against elites and bosses.
- `Summon Swarm`: minion density, corpse or sacrifice synergies, and defensive planning around keeping the engine alive.

### Paladin

- `Combat Zeal`: repeated frontline attacks with aura-backed guard and sustain windows.
- `Offensive Aura`: build-around scaling that turns ordinary attacks into explosive pressure if the engine is assembled.
- `Defensive Anchor`: defensive auras, survivability, and long-fight dominance if the player drafts enough payoff.

### Sorceress

- `Fire Burst`: delayed spike turns, burn setup, and explosive payoff that needs protection and sequencing.
- `Cold Control`: freeze or slow pressure, safety through denial, and careful conversion from control to lethal.
- `Lightning Tempo`: draw or energy acceleration, swing turns, and highly variable lines that reward planning for volatility.

## System Implications

### Reward Engine

The reward system should keep moving toward four strategic roles:

- reinforce the current engine
- offer one support piece
- occasionally offer a real pivot
- occasionally offer a utility or economy answer

The player should rarely feel like all three cards are unrelated.

### Class Progression

- Favored-tree routing should stay sticky once the player commits.
- Tree investment should unlock card families that make sense for the strategy.
- Later rewards should not flatten all three trees back into a generic soup.

### Weapons

- Weapon families should map cleanly onto archetypes.
- The best weapon for a build should usually be the one that matches its actual skill plan.
- Off-class stat sticks should remain possible but clearly second-best in most successful runs.

### Armor

- Armor should shape how a build survives, not erase threat.
- Distinct archetypes should care about different defensive packages: guard, resistances, immunities, sustain, or tempo protection.

### Runes and Runewords

- Mid-run runewords should be attainable often enough to matter.
- A runeword should feel like a planned archetype spike, not a rare novelty.
- Rune routing should support the current build more often than it offers unrelated generic value.

### Hand Size

- Hand size should become a premium strategy stat, not just a nice bonus.
- The game should include at least a few archetypes that genuinely change texture with `+1` hand size or opening draw.
- Boss pacing has to be long enough for this to matter.

### Quests and World Nodes

- Quest completion should frequently influence build quality, not just economy.
- World nodes should offer route-layer tradeoffs between immediate strength, long-term consistency, and specific build projects.
- Some quests should meaningfully accelerate runewords, specific weapon families, or favored-tree card quality.

### Enemy and Boss Design

- Regular encounters should pressure the weak points of archetypes without hard-countering them every run.
- Elites should punish one-dimensional decks.
- Bosses should ask build-specific questions and should generally survive long enough for multiple deck cycles or engine turns.

## Design Rules To Hold Us To

- Every class should have at least `2` clearly viable endgame archetypes and ideally `3`.
- Every archetype should have a distinct failure mode.
- A good build should be recognizable by Act II.
- A winning late-game deck should usually have a coherent primary tree, a secondary support package, and one or more explicit boss answers.
- Boss fights should be long enough that draw order matters, not so long that every fight becomes a grind.
- The player should feel real pressure to skip weak rewards, remove bad cards, and chase consistency.

## What Is Already Moving In The Right Direction

The live runtime already has pieces of this target:

- favored-tree progression summaries and sticky favored-tree routing
- reward bias toward invested or emerging build paths
- weapon-family proficiencies and typed weapon effects
- rune and runeword support with quest-driven runeforge rewards
- deterministic balance simulation, power scoring, and progression sweeps
- boss-specific scripting with telegraphed multi-turn abilities

That means this document is not a rewrite request. It is a direction-setting document for how to keep tuning the systems that are already live.

## Next Design Work

### 1. Author real endgame deck plans per class

For each class, document:

- `2-3` intended winning archetypes
- their must-have card families
- their support cards
- their ideal weapon families
- their key rune or runeword projects
- the boss questions they are supposed to answer

### 2. Turn bosses into archetype exams

Each act boss should have a sharper design brief:

- what weak build it punishes
- what prepared build can do to answer it
- how many turns we want the fight to last for weak, normal, and optimized builds

### 3. Make quests more build-shaping

We should push quest rewards toward:

- archetype reinforcement
- runeword acceleration
- specific weapon or armor project support
- harder pivot offers with real upside

### 4. Make hand size a real strategic stat

We should add a small, controlled set of effects around:

- `+1` opening draw
- `+1` max hand size
- discard or draw conversion
- retain-style or temporary-card support where appropriate

### 5. Keep using deterministic sweeps as the guardrail

We should keep validating:

- optimized policies should usually clear
- weaker policies should still fail early with some frequency
- class archetypes should not collapse into the same goodstuff shell

## Balance Check Commands

Use these commands to validate the strategy layer after major changes:

- `npm run sim:skill-audit`
- `npm run sim:balance -- --class amazon,barbarian,necromancer,paladin,sorceress --scenario mainline_conservative,mainline_rewarded --set act5_endgame --runs 8`
- `npm run sim:progression -- --class amazon,barbarian,necromancer,paladin,sorceress --policy aggressive,balanced,control --through-act 5`
- `npm run sim:progression-class-sweep -- --policy aggressive --through-act 5 --probe-runs 0 --seeds 4`
- `npm run sim:progression-class-sweep -- --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 4`
- `npm run sim:power-curve -- --class barbarian --policy aggressive --through-act 5`
- `npm run sim:boss-strength -- --class amazon,barbarian,necromancer,paladin,sorceress --policy aggressive,balanced,control,bulwark --through-act 4 --probe-runs 1 --seeds 2`

## References

External inspiration:

- [PC Gamer review: Slay the Spire is a brilliant genre mash-up with third-act problems](https://www.pcgamer.com/slay-the-spire-is-a-brilliant-genre-mash-up-with-third-act-problems/)
- [PC Gamer review: Monster Train review](https://www.pcgamer.com/monster-train-review/)
- [PC Gamer feature: Monster Train is a deckbuilder that tries to do it all and actually pulls it off](https://www.pcgamer.com/monster-train-is-a-deckbuilder-that-tries-to-do-it-all-and-actually-pulls-it-off/)
