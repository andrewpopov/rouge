# Rouge UI Redesign Plan

## Problem Statement

Every screen dumps ALL information at once with developer-guide prose as primary content.
The game mechanics are solid but buried under walls of explanatory text.
It reads like internal documentation, not a game.

## Design Philosophy

- **Game first, documentation second** — guides available via help/info buttons, never primary content
- **One choice at a time** — wizard steps and focused panels, not walls
- **Show, don't tell** — stat bars, badges, and icons instead of paragraphs
- **Short flavor text only** — "Consumes hero marks for extra damage." not "The mercenary is a separate contract. They auto-act in combat and can later be swapped or revived in town without resetting route progress."
- **Pokemon/Slay the Spire energy** — simple, visual, game-like

## Core Game Loop

```
Title → Pick Hero → Pick Merc → Town Hub → World Map → Combat → Rewards → repeat
```

---

## Screen-by-Screen Redesign

### 1. Welcome Screen (FRONT_DOOR, !hallExpanded)

**Current:** Title + tagline + Begin Expedition. Bare but acceptable.

**Redesign:** Atmospheric title card with game state.

```
┌─────────────────────────────────────┐
│         ROGUELITE DECKBUILDER       │
│             R O U G E               │
│     ─────────── ◆ ───────────      │
│                                     │
│  ┌─ SAVED EXPEDITION ────────────┐  │
│  │  Amazon Lv.4 · Act II · 38 HP │  │
│  │  [Continue]     [Abandon]      │  │
│  └────────────────────────────────┘  │
│                                     │
│        [ New Expedition ]           │
│                                     │
│   ┌──────┐  ┌──────┐  ┌──────┐    │
│   │Vault │  │Stats │  │ ⚙️   │    │
│   └──────┘  └──────┘  └──────┘    │
└─────────────────────────────────────┘
```

**Changes:** Minimal. Keep what works. Polish the saved-run card.

---

### 2. Character Select (CHARACTER_SELECT) → Step Wizard

**Current:** 5 massive sections dumped at once (~2500px tall). "Recruitment Brief" and "Expedition Launch Flow" are developer docs.

**Redesign:** Two-step wizard. Pick hero, then pick merc, then deploy.

#### Step 1: Pick Your Hero

```
┌─────────────────────────────────────┐
│  CHOOSE YOUR HERO          Step 1/2 │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ AMAZON  │  │ ASSASSIN│          │
│  │ hunter  │  │ hunter  │          │
│  │         │  │         │          │
│  │ HP: 50  │  │ HP: 50  │          │
│  │ NRG: 3  │  │ NRG: 3  │          │
│  │ Hand: 5 │  │ Hand: 5 │          │
│  │         │  │         │          │
│  │ Bow &   │  │ Martial │          │
│  │ Javelin │  │ Shadow  │          │
│  │ Passive │  │ Traps   │          │
│  └─────────┘  └─────────┘          │
│  ┌─────────┐  ┌─────────┐          │
│  │BARBARIAN│  │  DRUID  │          │
│  │ warrior │  │ warrior │          │
│  │ ...     │  │ ...     │          │
│  └─────────┘  └─────────┘          │
│  (etc for all 7 classes)            │
│                                     │
│  Selected: Amazon                   │
│  [ Next → ]                         │
└─────────────────────────────────────┘
```

Each class card shows:
- Class name (large)
- Archetype badge (hunter/warrior/caster)
- 4 key stats as compact bar or number
- Skill tree names (humanized, not raw IDs)
- 1-line flavor if any

NO: "Recruitment Brief", "Expedition Launch Flow", "Class Shell" explanations, raw IDs like "bow_and_crossbow"

#### Step 2: Pick Your Companion

```
┌─────────────────────────────────────┐
│  CHOOSE COMPANION          Step 2/2 │
│                                     │
│  Hero: Amazon (hunter)              │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ROGUE SCOUT · Act I Hunter    │ │
│  │ HP: 28  ATK: 5                │ │
│  │ Consumes marks for extra dmg  │ │
│  │                    [Selected] │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ DESERT GUARD · Act II Wall    │ │
│  │ HP: 34  ATK: 4                │ │
│  │ Gains Guard after attacking   │ │
│  │                      [Hire]   │ │
│  └────────────────────────────────┘ │
│  (etc for all mercenaries)          │
│                                     │
│  [ ← Back ]  [ Enter Encampment ]  │
└─────────────────────────────────────┘
```

Each merc card shows:
- Name + role badge
- HP + Attack as numbers
- 1-line ability description
- Select/Selected state

NO: "Deployment Checklist", "What Happens Next" bullet lists

---

### 3. Town / Safe Zone (SAFE_ZONE) → Visual Hub

**Current:** ~10,000px wall. Every service, every stat, every explanation at once.

**Redesign:** Compact status bar + grid of location tiles. Click a tile to expand its panel.

```
┌─────────────────────────────────────┐
│  ROGUE ENCAMPMENT · Act I           │
│  Amazon Lv.1 · HP 50/50 · 0 Gold   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ ❤ HEALER │  │ 🧪 BELT  │        │
│  │ HP Full  │  │ 2/2 Full │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │ ⚔ TRAIN  │  │ 🏪 SHOP  │        │
│  │ 0 pts    │  │ 4 items  │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │ 🎒 PACK  │  │ 🛡 MERCS │        │
│  │ 3 slots  │  │ Active   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  [ 🗺 Step Onto The World Map ]     │
└─────────────────────────────────────┘
```

When a tile is clicked → expand inline or overlay panel showing that service's actions:

```
┌──────────────────────────────────────┐
│  🏪 VENDOR ARCADE            [ ✕ ]  │
│                                      │
│  ┌────────────────┐ ┌─────────────┐  │
│  │ Iron Sword     │ │ Buckler     │  │
│  │ +3 ATK         │ │ +2 Guard    │  │
│  │ [Buy 28g]      │ │ [Buy 28g]   │  │
│  └────────────────┘ └─────────────┘  │
│  ┌────────────────┐                  │
│  │ Refresh Stock  │                  │
│  │ [14g]          │                  │
│  └────────────────┘                  │
└──────────────────────────────────────┘
```

NO: "Expedition Launch Flow", "Town Districts" explanations, "Recovery Ward" prose paragraphs, world ledger dump, readiness check walls

**Implementation approach:** Add `townFocus` to `appState.ui`. When null, show hub grid. When set to a district ID, show that district's actions. This is a UI-only change — the existing town action system stays intact.

---

### 4. World Map (WORLD_MAP) → Path Picker

**Current:** ~6000px wall with every zone, node family explanation, pressure analysis.

**Redesign:** Compact zone list grouped by availability.

```
┌─────────────────────────────────────┐
│  ACT I: THE SIGHTLESS EYE           │
│  Amazon Lv.1 · 2/16 zones cleared  │
├─────────────────────────────────────┤
│                                     │
│  AVAILABLE                          │
│  ┌────────────────────────────────┐ │
│  │ 🗡 Blood Moor        Battle   │ │
│  │    2 encounters · Normal       │ │
│  │                      [Enter]  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 🏛 Den of Evil       Quest    │ │
│  │    1 encounter · Quest reward  │ │
│  │                      [Enter]  │ │
│  └────────────────────────────────┘ │
│                                     │
│  LOCKED (3)                         │
│  Cold Plains · Stony Field · ...    │
│                                     │
│  [ ← Return to Encampment ]        │
└─────────────────────────────────────┘
```

NO: "Map Brief", "Node Family" explanations, "Route Pressure" analysis, "Aftermath" prose

---

### 5. Combat (ENCOUNTER) → Tighten Layout

**Current:** Actually decent! Closest to feeling like a game. Needs cleanup.

**Redesign:** Remove prose, tighten spacing.

```
┌─────────────────────────────────────┐
│  BLOOD MOOR · Encounter 1/2        │
├─────────────────────────────────────┤
│                                     │
│  ┌─ ENEMIES ─────────────────────┐  │
│  │ Fallen       18/18 HP  Atk:5 │  │
│  │ Spike Fiend  18/18 HP  Atk:5 │  │
│  │ Fallen Shaman 17/17 HP Heal:4│  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ YOUR PARTY ──────────────────┐  │
│  │ Amazon    50/50 HP  NRG: 3/3 │  │
│  │ Rogue     28/28 HP  ATK: 5   │  │
│  │ [Potion Hero] [Potion Merc]   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ HAND ────────────────────────┐  │
│  │ Battle Orders (2) · Quick     │  │
│  │ Slash (1) · Second Wind (1)   │  │
│  │ Focus Fire (1) · Fire Bolt(1) │  │
│  └───────────────────────────────┘  │
│                                     │
│  Target: Fallen                     │
│  [ End Turn ]                       │
└─────────────────────────────────────┘
```

NO: "Combat still runs through the deterministic engine..." header prose, "Battle Orders" tutorial section (move to help/info button), "Encounter Brief" explanation cards

---

### 6. Rewards (REWARD) → Clean Choice

**Current:** Verbose with advance guide and context prose.

**Redesign:** Simple pick-one screen.

```
┌─────────────────────────────────────┐
│  VICTORY · Choose Your Reward       │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │  Jab                          │ │
│  │  Deal 8 damage. Apply Mark.   │ │
│  │  Deck +1                      │ │
│  │                     [Claim]   │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  Potion Upgrade               │ │
│  │  +5 potion heal power         │ │
│  │  Permanent                    │ │
│  │                     [Claim]   │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  Gold Purse                   │ │
│  │  +18 gold                     │ │
│  │                     [Claim]   │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

NO: "Advance Guide", "Reward Context" prose, "How claiming affects run state"

---

### 7. Documentation / Guides → Accessible but Hidden

All the removed prose moves to an optional help system:
- **Info button (?)** on each screen header → shows contextual help overlay
- **Tutorial system** (already exists) → triggered on first visit to each screen
- **Account Hall** (hallExpanded) → keeps the deep analytics for power users

This means:
- "Recruitment Brief" → help overlay on character select
- "Expedition Launch Flow" → removed entirely (it's a developer artifact)
- "Battle Orders" → help overlay on combat screen
- "Town Districts" prose → help overlay on town hub
- "Map Brief" → help overlay on world map

---

## Implementation Order

### Phase 1: Character Select Wizard (highest impact, most broken screen)
1. Add `charSelectStep` to `appState.ui` (1 = hero, 2 = merc)
2. Rewrite `character-select-view.ts` render function
3. Strip "Recruitment Brief", "Expedition Launch Flow", "Deployment Checklist"
4. Show class cards in step 1, merc cards in step 2
5. Humanize raw IDs (bow_and_crossbow → Bow & Crossbow)
6. Update tests

### Phase 2: Town Hub
1. Add `townFocus` to `appState.ui` (null = hub grid, string = district ID)
2. Rewrite `safe-zone-view.ts` to show hub grid by default
3. Keep `safe-zone-operations-view.ts` for district detail panels
4. Strip all prose, keep action cards
5. Update action dispatcher for `focus-town-district` / `close-town-district`
6. Update tests

### Phase 3: Combat Cleanup
1. Remove header prose from combat-view.ts
2. Remove "Battle Orders" tutorial section
3. Remove "Encounter Brief" explanation cards
4. Tighten card layout
5. Update tests

### Phase 4: World Map Simplify
1. Remove "Map Brief" and "Node Family" prose
2. Group zones: Available / Locked / Cleared
3. Compact zone cards (name + type + encounter count + enter button)
4. Update tests

### Phase 5: Reward Cleanup
1. Remove "Advance Guide" and "Reward Context" prose
2. Simple choice cards with effect preview
3. Update tests

### Phase 6: Welcome Screen Polish
1. Minor visual improvements
2. Better saved-run card
3. Smooth animations

---

## Test Strategy

Tests use `innerHTML` checks so they find text regardless of visibility.
Key constraint: tests assert on specific text strings from the prose we're removing.

**Approach:**
- Tests that check for game data (class names, stats, action labels) → keep
- Tests that check for prose ("The hall now pins the same archive...") → update assertions
- Use `display:none` pattern where needed for data that tests expect but shouldn't be primary UI
- Run `npm run check` after each phase to catch breakage

---

## Files to Modify

| Phase | Files | Scope |
|-------|-------|-------|
| 1 | character-select-view.ts, action-dispatcher.ts, game.d.ts, app-engine.ts, tests | Rewrite view |
| 2 | safe-zone-view.ts, safe-zone-operations-view.ts, action-dispatcher.ts, game.d.ts, tests | Rewrite view |
| 3 | combat-view.ts, tests | Strip prose |
| 4 | world-map-view.ts, tests | Simplify |
| 5 | reward-view.ts, tests | Strip prose |
| 6 | front-door-view.ts, styles.css | Polish |

---

## What We Keep

- All game mechanics (combat engine, reward engine, town actions, progression)
- The action dispatcher pattern (data-action click handling)
- The phase machine (app-engine state transitions)
- The buildShell pattern (for consistent page structure)
- CSS design system (dark fantasy theme, gold accents, serif fonts)
- Account hall (behind "Account" nav on welcome screen)
- All existing game data and content
