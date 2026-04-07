# Rouge — Game Evaluation

Prioritized assessment of game completeness and polish gaps.
Priority order: Combat Feel > Run Variety > Meta-Progression > Audio > Onboarding.

---

## 1. Combat Feel

**Rating: Functional, not weighty**

### What exists (strong foundation)
- Damage numbers with color-coding (red/blue/green/orange) and scale bounce animation
- Hit flash (3x brightness spike, 0.4s) and damage shake (-8px to +7px, 0.35s)
- Screen shake on big hits (15+ damage) and kills
- Impact stamps: "Hit", "Crushed", "Guard Shaved", "Broken", "Finished" — color-coded, staggered
- Status effect flashes: burn (orange glow), poison (green glow), freeze/stun (cyan/yellow)
- Card fly-out clone on play (scale 1.12→0.6, floats upward, 0.3s)
- Hand readying animation on player turn (brightness pulse, 45ms stagger per card)
- Turn banner with scale bounce (1.5→1), phase pulse in header
- Enemy action sequence banners (enemy name + action, 180ms stagger)
- Deck flow notices ("Fresh hand", "Deck recycled") with pile pulse effects
- Victory/defeat backdrop blur + title pop-in with color glow
- Low HP bar throb (<30% health)
- Upgraded card shimmer aura (continuous gold glow)

### What's missing (flat impact hierarchy)
- **No enemy knockback/stagger on big hits** — damage feels the same at 3 and 30
- **Weak enemy death** — fades to 12% opacity + grayscale. No burst, scatter, or dramatic exit
- **No guard break spectacle** — cyan flash is brief and understated
- **No card combo momentum** — playing 3 cards in a turn feels like playing 1 card three times
- **No persistent status auras** — burn/poison flash briefly then disappear visually
- **Mercenary actions are quiet** — mark consumption and merc crits have no special feedback
- **Approach bonus selection has no animation** — choice locks in silently
- **No minion entrance animation** — summons just appear

### Recommended improvements (highest impact first)
1. **Enemy stagger on big hits**: 10px slide + 1-2deg rotation on 15+ damage (0.35s)
2. **Enhanced death animation**: Scale-down with rotation + white flash + brief particle scatter
3. **Persistent status auras**: Semi-transparent glow layers around afflicted enemies
4. **Guard break emphasis**: Enemy recoil + "Exposed" indicator state
5. **Card combo glow**: Hand brightness/glow intensifies with each card played per turn
6. **Approach choice pop-in**: Selected card scales up with glow on lock-in

---

## 2. Run Variety

**Rating: Very high — one of the game's strengths**

### What exists
- **31 unique exploration events** across 8 categories, each with 3 choices
- **336 class-specific cards** (46-51 per class) plus 17 neutral cards
- **70+ consequence encounter packages** gated behind world flags from earlier choices
- **70+ consequence reward packages** similarly gated
- **19+ world opportunity types** (shrine, crossroad, relay, culmination, legacy, reckoning, accord, covenant, detour, escalation...)
- **Quest chains**: 5 core quests per act with branching outcomes that set world flags
- **Equipment**: 65 base items × tier 1-8 × 5 rarity levels, seeded per encounter
- **Runeword system**: Socket + combine runes for unique effects
- **Archetype tracking**: Card drafting scored by archetype, influencing future reward offerings
- **Deck divergence**: Soft cap 14+(act×2), hard cap 18+(act×3). Two runs with same class diverge by Act 2
- **Seeded RNG**: Run seed deterministically varies rewards, events, and loot per run

### Potential gaps
- **Same-zone encounters are fixed order** — revisiting a zone gives identical enemies
- **Early Act 1 can feel samey** — most variety kicks in from Act 2's world nodes onward
- **Event probability is 20% flat** — no scaling based on how many events the player has seen

### Recommendations
1. Shuffle encounter order within zones using the run seed
2. Front-load one early event in Act 1 to establish variety from the start
3. Consider pity-timer for events (guarantee one every N zones if unlucky)

---

## 3. Meta-Progression

**Rating: Deep systems, needs better surfacing**

### What exists
- **3 progression trees** (Archives, Economy, Mastery) with 27 major milestones + 9 convergences
- **Class unlock system**: Barbarian/Sorceress/Amazon free; Paladin (Act 2), Assassin (Act 3), Necromancer (5 bosses), Druid (3 classes played)
- **Boss Trophy Gallery**: Boss kills unlock extra class points from future bosses
- **Training Grounds / War College / Doctrine chain**: Progressive boss reward scaling (up to Mythic Doctrine at 20 bosses)
- **Economy scaling**: Gold multipliers from economy tree (500→1200→2500→4000→6500→9000 gold milestones)
- **Stash system**: Carry equipment and runes between runs (base 20 slots, expandable to 120+)
- **Run history**: Full stats per run, capacity 20→120+ with archive tree
- **Town features**: Unlocked progressively (vendor stock, runeword codex, artisan stock)

### What's missing
- **No "this unlocked" moment** — features appear without fanfare or explanation
- **No difficulty tiers** — account progression makes future runs easier but never harder
- **No prestige/ascension system** — after beating Act 5, the same campaign repeats
- **No class mastery track** — playing Amazon 10 times doesn't unlock Amazon-specific rewards
- **No daily/weekly challenges** — every run is self-motivated
- **No cosmetic rewards** — no card skins, alternate portraits, or visual progression

### Recommendations
1. Add unlock celebration UI when milestones are hit (toast + explanation of what changed)
2. Consider a difficulty modifier system (enemy HP/damage scaling) that unlocks after first Act 5 clear
3. Add per-class mastery milestones (play X runs → unlock alternate starter skill or card back)
4. Surface the progression trees more prominently in the hall between runs

---

## 4. Audio

**Rating: Absent**

### What exists
- Zero audio references in the codebase. No sound effects, no music, no Web Audio API usage.

### What's needed (priority order)
1. **Card play sound** — satisfying thwack/whoosh on card commitment
2. **Damage hit sound** — impact scaled by damage amount (light tap vs heavy crunch)
3. **Guard block sound** — metallic clang when guard absorbs damage
4. **Enemy death sound** — crumble/shatter
5. **Turn start chime** — brief audio cue that it's your turn
6. **Status effect sounds** — burn crackle, poison hiss, freeze crack, stun zap
7. **Victory/defeat stingers** — 2-3 second musical phrases
8. **Ambient combat loop** — low tension drone during encounters
9. **Town ambient** — calm loop for safe zones
10. **Boss encounter theme** — distinct from regular combat

### Recommendations
- Start with Web Audio API for procedural sounds (no asset loading)
- Even 5-6 basic sounds (card play, hit, block, death, turn, victory) would transform the experience
- Consider a sound module similar to combat-log.ts — centralized, event-driven, with volume/mute controls

---

## 5. Onboarding

**Rating: Infrastructure exists, content is skeletal**

### What exists
- **Tutorial state tracking**: `seenIds[]`, `completedIds[]`, `dismissedIds[]` on profile
- **Show hints toggle**: `profile.meta.settings.showHints` (default true)
- **Card keyword hints**: 14 keywords with hover tooltips (Guard, Burn, Stun, etc.)
- **Act intro guides**: Narrative route scrolls and boss introductions per act
- **Character select**: Lock icons with unlock requirements shown
- **Three-step launch flow**: Hall → Character Draft → Town Prep

### What's missing
- **No tutorial content catalog** — the state tracking exists but no definitions for what tutorials say
- **No multi-step walkthroughs** — tutorial system is binary (seen/not seen), no step progression
- **No contextual UI help** — no "?" tooltips on town features, loadout slots, or combat mechanics
- **No "first combat" guided experience** — new players face full complexity immediately
- **No mechanic-specific tutorials** — energy, guard, mercenary marks, deck building unexplained
- **No feature unlock tutorials** — "Boss Trophy Gallery unlocked" with no guidance on what it does
- **No tutorial re-enable UI** — `restoreTutorial()` exists in code but isn't exposed

### Recommendations
1. Create `tutorial-catalog.ts` with actual tutorial definitions (title, body, trigger condition, steps)
2. Add a guided first combat: highlight energy → play a card → explain guard → end turn → show enemy phase
3. Add "?" tooltip icons on town features, skill bar slots, and loadout
4. Add unlock celebration + explanation when new features appear
5. Consider a "practice arena" town feature for testing deck/skill combos without risk

---

## Summary Matrix

| Area | Systems | Content | Polish | Priority |
|------|---------|---------|--------|----------|
| Combat Feel | Strong | Complete | Needs weight/hierarchy | 1 |
| Run Variety | Excellent | Deep (336 cards, 31 events, 70+ consequences) | Minor gaps | 2 |
| Meta-Progression | Deep (27 milestones, stash, class unlocks) | Complete | Needs surfacing | 3 |
| Audio | Absent | Absent | Absent | 4 |
| Onboarding | Infrastructure exists | Skeletal | Needs content | 5 |
