# Rouge — Game Evaluation

Prioritized assessment of game completeness and polish gaps.
Priority order: Combat Feel > Run Variety > Meta-Progression > Audio > Onboarding.

_Updated: 2026-04-08_

---

## 1. Combat Feel

**Rating: Good foundation, recently improved**

### What exists
- Damage numbers with color-coding (red/blue/green/orange) and scale bounce animation
- Hit flash (3x brightness), damage shake, screen shake on big hits/kills
- Impact stamps: "Hit", "Crushed", "Guard Shaved", "Broken", "Finished"
- Status effect flashes for all 6 types (burn, poison, freeze, stun, paralyze, slow)
- Card fly-out clone, hand readying animation, turn/phase banners
- Deck flow notices, low HP throb, upgraded card shimmer

### Recently shipped
- **Procedural combat audio** (14 sounds): card play, hit (damage-scaled), guard block/break, enemy death, heal, status apply, turn start, victory/defeat stingers, skill, melee, potion, summon
- **Enemy knockback** on big hits (30%+ HP), guard break stagger animation
- **Death burst** animation (brightness flash → scale → shrink with rotation + grayscale)
- **Persistent status auras** for all 6 status types (freeze=blue, stun=gold, paralyze=purple, slow=cyan, burn=orange, poison=green) — continuous glow on afflicted enemies
- **Enemy inspect panel** — click a selected enemy to see HP, intent, all statuses with descriptions, stack counts, traits
- **Structured combat log** (Field Log) with actor tags, effect chips (damage/heal/guard/status), turn dividers

### Still missing
- Card combo momentum (no visual escalation for playing multiple cards per turn)
- Approach bonus selection animation
- Minion entrance animation

---

## 2. Run Variety

**Rating: Very high — one of the game's strengths**

### What exists
- 31 unique exploration events across 8 categories, each with 3 choices
- 336 class-specific cards (46-51 per class) plus 17 neutral cards
- 70+ consequence encounter/reward packages gated behind world flags
- 19+ world opportunity types with quest chains
- Equipment: 65 base items × tier 1-8 × 5 rarity levels, seeded per encounter
- Runeword system, archetype tracking, seeded RNG

### Neutral card redesign (shipped)
Replaced class-flavored neutral cards with generic adventurer actions:
Swing, Measured Swing, Kick (stun), Shove (slow), Mark Target, Guard Stance, Forward Guard, Field Dressing, Rally Mercenary, Throw Oil, Brace, Scout Ahead, Regroup, Hold the Line, Triage, Crushing Blow, Press the Attack

---

## 3. Meta-Progression

**Rating: Deep systems, needs better surfacing**

Unchanged from initial assessment. 3 progression trees, 27 milestones, class unlock system, stash, boss trophies. Missing unlock celebrations, difficulty tiers, class mastery tracks.

---

## 4. Audio

**Rating: Shipped — procedural sounds in place**

### What exists now
- `src/audio/combat-audio.ts` — Web Audio API procedural sound module
- 14 distinct sounds: cardPlay, hit (damage-scaled), guardBlock, guardBreak, enemyDeath, heal, statusApply, turnStart, victory, defeat, skillUse, meleeStrike, potionUse, summon
- Volume control (`setVolume`) and mute toggle (`setMuted`)
- Wired into action dispatcher: each combat action triggers appropriate sound
- Graceful degradation when AudioContext unavailable

### Still needed
- Ambient combat/town loops
- Boss encounter theme
- UI interaction sounds (menu, hover, select)

---

## 5. Onboarding

**Rating: Infrastructure exists, content is skeletal**

Unchanged from initial assessment. Tutorial state tracking exists but no content catalog. No guided first combat, no contextual help, no mechanic-specific tutorials.

---

## Summary Matrix

| Area | Systems | Content | Polish | Status |
|------|---------|---------|--------|--------|
| Combat Feel | Strong | Complete | **Shipped** — audio, VFX, auras, inspect | Done for now |
| Run Variety | Excellent | Deep | Neutral cards redesigned | Done |
| Meta-Progression | Deep | Complete | Needs surfacing | Unchanged |
| Audio | **Shipped** | 14 sounds | Needs ambient/themes | Partially done |
| Onboarding | Infrastructure | Skeletal | Needs content | Unchanged |
