# Comprehensive Balance Plan - 2026-03-27

## Test matrix

This plan is based on four current-state checks:

1. Optimized campaign sweep  
   `npm run sim:progression-class-sweep -- --policy aggressive --through-act 5 --probe-runs 0 --seeds 2`

2. Weak early-game sweep  
   `npm run sim:progression-class-sweep -- --policy balanced,control,bulwark --through-act 2 --probe-runs 0 --seeds 2`

3. Act V endgame fight sweep  
   `npm run sim:balance -- --class amazon,assassin,barbarian,druid,necromancer,paladin,sorceress --scenario mainline_conservative,mainline_rewarded --set act5_endgame --runs 2`

4. Skill audit and seeded progression snapshots  
   `npm run sim:skill-audit -- --json`  
   plus direct seed-0 progression snapshots from the live simulator for runes, weapons, armor, hand size, and quest/reward telemetry.

## Executive summary

- Optimized runs can beat the game, but they are not yet in a uniformly healthy place.
- Current optimized seed results are:
  - Amazon: `1/2`
  - Assassin: `2/2`
  - Barbarian: `1/2`
  - Druid: `2/2`
  - Necromancer: `0/2`
  - Paladin: `1/2`
  - Sorceress: `2/2`
- Every optimized campaign failure in this sample died at **Act IV Diablo**.
- Weak lines are still too safe early. In `42/42` weak runs, every class/policy reached Act II.
- Act V boss tuning is much closer to target than the campaign curve:
  - Baal is near parity and often the hardest fight.
  - Non-boss Act V elites and battles are still too soft.
- Runes and runewords are now functioning as a real progression system.
- Hand size exists mechanically, but it is not showing up often enough to matter for current balance.

## What the data says

### Character skills

The skill audit still shows meaningful outliers.

Most under-band cards in the current audit:

- Amazon: `Critical Strike`, `Strafe`, `Guided Arrow`, `Valkyrie`
- Barbarian: `Natural Resistance`, `Frenzy`
- Druid: `Lycanthropy`, `Heart of Wolverine`
- Necromancer: `Life Tap`, `Skeletal Mage`

Most over-band cards in the current audit:

- Necromancer: `Decrepify`, `Revive`, `Raise Skeleton`
- Paladin: `Conviction`, `Holy Shield`, `Holy Freeze`
- Sorceress: `Frozen Armor`, `Charged Bolt`, `Warmth`
- Amazon: `Power Strike`, `Charged Strike`

Interpretation:

- Amazon’s **javelin** line looks stronger than its **bow/passive** line.
- Necromancer has several individually strong cards, but still fails the campaign. That means the problem is not “all Necromancer cards are weak”; it is more likely **campaign pacing, Diablo interaction, or build consistency**.
- Paladin also has several over-band cards while only going `1/2` in the optimized campaign sweep, which again points to **encounter interaction and curve issues**, not raw card EV alone.

### Runes

Runes are no longer a dead system.

In the seed-0 optimized progression snapshots:

- Amazon forged `3` runewords and finished with `Crescent Moon + Stealth`
- Assassin finished with `Steel + Stealth`
- Barbarian finished with `Strength + Stealth`
- Druid finished with `Strength + Stealth`
- Necromancer reached Act IV failure with `White + Stealth`
- Paladin finished with `Strength + Stealth`
- Sorceress finished with `Leaf + Stealth`

Reward-effect telemetry from full runs shows rune support is live:

- `grant_rune`: usually `1-4` times per run
- `add_socket`: usually `4-11` times per run
- `socket_rune`: usually `4-11` times per run

Interpretation:

- We should treat runes and runewords as **baseline progression systems now**, not optional flavor.
- The current economy is good enough that most classes can finish with `2` active runewords.
- Immediate rune-access buffs are not the priority.

### Weapons

Typed weapon damage and status effects are live and visible in final builds:

- Amazon ended on a `Partizan` with fire damage and stacked slow
- Druid ended on a `War Hammer` with fire/cold plus crushing/slow
- Necromancer ended on a `Lich Wand` with poison plus slow
- Sorceress ended on a `Gnarled Staff` with fire/cold/lightning plus burn/freeze/shock

Weapon identity is still uneven:

- Amazon’s winning seed used a **Polearm** runeword line rather than a bow-first fantasy.
- Barbarian and Paladin both converge toward similar large melee bases.
- Sorceress and Necromancer look healthy from an identity perspective.

Interpretation:

- Weapons are scaling and differentiating by damage type/effect correctly.
- The remaining problem is **family identity and incentive structure**, especially for Amazon.
- We should not do a global weapon buff. We should tune family lanes.

### Armor

Armor progression exists, but it is still a low-signal axis in real runs.

Seed-0 optimized final armor snapshots:

- Most classes finished on white or blue armor
- Final physical resistance totals were usually only `1-4`
- No seed-0 optimized run finished with an armor immunity

Interpretation:

- Armor is readable and not overtuned anymore, which is good.
- But armor is not yet making many interesting late-run decisions.
- If we want armor to matter more, we need either:
  - more meaningful resist access on gear/rewards, or
  - more enemy elemental pressure outside the few marquee bosses.

### Enemy skills

Boss skill packages are doing most of the real work.

Campaign evidence:

- All optimized failures in this pass were **Diablo** in Act IV.

Act V endgame evidence:

- Baal is the hardest current endgame check.
- Baal win rates are often `50%` for classes near parity in the conservative scenario.
- Non-boss Act V encounters are still mostly `100%` wins in `1-3` turns.

Interpretation:

- Diablo is currently the main campaign gate.
- Baal is close to the right difficulty target.
- Most normal/elite enemy skill packages are still too soft compared with boss packages.

### Enemy stats

Act V endgame balance sweep:

- Baal ratios are close to target, usually around `0.90x - 1.16x` party/enemy power.
- Act V non-boss encounters are still commonly `2.9x - 5.1x`.

Interpretation:

- Boss stats are much closer to where they should be than elite/battle stats.
- The game does not need another broad boss stat hike.
- It needs **more pressure in normal/elite fights**, especially later acts.

### Hand size

Hand size is technically supported, but it is not a current balance lever.

Across the seed-0 optimized roster snapshot:

- Every class finished at `5` hand size.
- No hand-size bonus showed up in the sampled endgame builds.

Interpretation:

- `+1 hand size` is currently a chase affix, not a balance-defining system.
- We should not tune the main game around hand size yet.
- If we want hand size to matter, we need a higher appearance rate or more sources.

### Quest completion

Quest systems are firing reliably.

Successful seed-0 optimized runs typically finished with:

- `4` quest outcomes
- `4` follow-ups resolved
- `4` quest chains resolved
- `5` shrine outcomes
- `4` event outcomes
- `53` opportunity outcomes
- `69` resolved nodes

Necromancer still reached:

- `3` quest outcomes
- `3` follow-ups
- `3` quest chains
- `40` opportunity outcomes

before failing at Diablo.

Interpretation:

- Quest completion itself is healthy.
- Opportunity nodes dominate route volume by a wide margin.

### Quest rewards

Reward traffic is heavily concentrated in generic progression effects.

Common reward-effect counts in successful runs:

- `hero_max_life`: about `88-93`
- `gold_bonus`: about `59-61`
- `refill_potions`: about `49-54`
- `mercenary_attack`: about `51-54`
- `mercenary_max_life`: about `50-53`
- `record_node_outcome`: `64`
- `record_quest_consequence`: `49`

Interpretation:

- Quest and opportunity systems work, but a lot of their reward power still resolves into:
  - generic life
  - gold
  - potion sustain
  - mercenary stats
- That makes route-side rewards dependable, but not as distinctive as they could be.

## Concrete balance plan

### Priority 1: fix the campaign bottlenecks, not the whole game

1. **Diablo pass, not global late-game buffs**
   - Target classes: Amazon, Barbarian, Paladin, Necromancer
   - Problem: optimized failures are clustering almost entirely at Diablo
   - Direction:
     - reduce how binary Diablo’s burst windows are against melee/frontline and setup-heavy classes
     - prefer class-side survivability or counterplay tools over another broad monster nerf
     - avoid touching Baal unless new samples say we must

2. **Necromancer campaign consistency pass**
   - Problem: `0/2` optimized campaign clears, despite strong endgame sim results and several over-band cards
   - Direction:
     - do not start with `Decrepify` or `Revive` nerfs
     - improve how Necromancer reaches and survives Diablo
     - likely targets: midgame tempo, survivability sequencing, or better access to the right wand/build pieces before Act IV

3. **Amazon weapon/skill identity pass**
   - Problem: bow/passive cards still under-band while javelin and off-family weapon outcomes are stronger
   - Direction:
     - buff bow/passive lane first: `Strafe`, `Guided Arrow`, `Valkyrie`, `Critical Strike`
     - reduce the tendency for optimized Amazon to solve the run with polearm-style endings unless that is intentionally a class fantasy

### Priority 2: make early failure real again

4. **Raise weak-line Act I / early Act II fail pressure**
   - Problem: `42/42` weak runs reached Act II
   - Direction:
     - push early encounter pressure, not late-game power
     - focus on Andariel and Act I-early Act II combat pacing
     - consider slightly lowering early generic sustain and generic life reward density rather than hitting class capstones

5. **Keep optimized runs viable while weak lines stop cruising**
   - Target outcome:
     - optimized lines should usually finish
     - weak lines should sometimes die before Act II
   - That likely means:
     - stronger early enemy pressure
     - slightly less generic reward smoothing
     - no broad late-game player nerf

### Priority 3: improve system identity

6. **Weapon family differentiation**
   - Strengthen identity where needed:
     - Amazon bows/javelins
     - Barbarian frenzy/mastery line
     - Druid summoning support lane
   - Avoid a flat “all weapons stronger” patch

7. **Armor relevance pass**
   - Keep current mitigation values conservative
   - Add more reasons to care about armor choices:
     - more meaningful resistance access
     - more elemental pressure outside bosses
     - clearer reward-side armor specialization

8. **Quest reward specialization**
   - Keep the route systems, but reduce generic reward sameness
   - Add more quest/opportunity outcomes that meaningfully shape:
     - runes/runewords
     - sockets
     - class lanes
     - weapon families
     - elemental or resistance pivots

9. **Treat hand size as optional power for now**
   - Current recommendation:
     - do not balance core combat around hand-size bonuses yet
     - either leave it as a rare unique-only jackpot or add more sources later if we want it to matter systemically

### Priority 4: enemy roster pressure

10. **Raise non-boss elite/battle pressure in later acts**
    - Act V elites and battles are still too soft relative to boss fights
    - Direction:
      - more elite threat
      - more mid-fight pressure
      - less dependence on boss-only danger

## Recommended next implementation order

1. Early-game pressure pass for Act I and early Act II
2. Targeted Diablo/class interaction pass for Amazon, Barbarian, Paladin, Necromancer
3. Amazon bow/passive and Barbarian/Necromancer consistency pass
4. Quest reward specialization pass
5. Late elite/battle pressure pass
6. Re-run the same matrix and compare deltas

## Notes on tooling

- The new comprehensive balance report runner exists at:
  - [scripts/run-comprehensive-balance-report.js](/Users/andrew/proj/rouge/scripts/run-comprehensive-balance-report.js)
- It now uses the expanded simulator telemetry:
  - route kind counts
  - reward effect counts
  - world-node outcome summaries
  - final build summaries for runes, weapons, armor, and hand size
- In practice, large all-in-one sweeps can still hit slow-path full runs. For interactive tuning, the fastest useful workflow is:
  1. `sim:progression-class-sweep` for optimized full clears
  2. `sim:progression-class-sweep` for weak early-game checkpoints
  3. `sim:balance` for endgame encounter pressure
  4. `sim:skill-audit` for card outliers
