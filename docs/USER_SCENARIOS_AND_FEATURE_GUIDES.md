# User Scenarios and Feature Guides

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `PROJECT_MASTER.md` plus `COMBAT_FOUNDATION.md` for the current-build explanation.
- This document supports player scenarios and content workflows.

## 1) Primary User Scenarios

### Scenario A: First-Time Player (Clarity-First)
- Goal: understand identity, objective, and controls in first 2 minutes.
- Entry: starts run, selects class, enters Act I Forsaken Palisade.
- Expected experience:
  - sees clear class identity and starter skills in character select.
  - arrives in Forsaken Palisade and recognizes town vendors / services.
  - finds the exit to Blighted Moors without confusion.
  - understands that world traversal is branching and one-way.
  - completes first combat and receives understandable reward.
- Success criteria:
  - player can explain what the class does, what the town services are, and how to leave town for the world map.

### Scenario B: Build Crafter (Systems-First)
- Goal: shape a class build through stats, tree nodes, gear, and deck.
- Entry: mid-run with multiple rewards available.
- Expected experience:
  - compares upgrade options with clear stat deltas.
  - allocates stat points intentionally.
  - chooses tree node unlocks that impact combat next zone.
  - sees when a quest payout will add a unique relic, extra stat points, or a skill point.
- Success criteria:
  - build choices and contract rewards are visible in HUD and materially change outcomes.

### Scenario C: Risk-Taker Pathing
- Goal: route through high-risk nodes for stronger rewards.
- Entry: act world tree offers mixed reachable branches.
- Expected experience:
  - battle nodes feel dangerous but rewarding.
  - miniboss nodes signal higher risk and higher payout.
  - route choices change the path to the act boss in readable ways.
  - active quest contracts call out specific chest, shrine, and boss targets on the current map.
  - the player understands that some contracts will be missed if heat, damage, or boss-clear conditions are not met.
- Success criteria:
  - routing and contract decisions change win probability in meaningful ways.

### Scenario D: Boss Preparation and Execution
- Goal: read boss pattern and prep before final node.
- Entry: boss zone in each act.
- Expected experience:
  - telegraphed dangerous attacks are readable.
  - player plans cooldowns and consumables.
  - boss kill transitions cleanly to act completion.
- Success criteria:
  - player can identify at least one boss pattern and counter it.

### Scenario E: Failure, Learn, Retry
- Goal: failed run still feels informative and motivating.
- Entry: player dies in zone or boss encounter.
- Expected experience:
  - defeat summary shows cause, build state, and progression gained.
  - quick restart path exists with class/build adjustments.
- Success criteria:
  - player restarts within 30 seconds with a clear change in plan.

### Scenario F: Mercenary Synergy Builder
- Goal: pick and leverage a mercenary that complements class and deck plan.
- Entry: player reaches a safe-zone mercenary hire service.
- Expected experience:
  - sees clear mercenary roles and passive/active contributions.
  - can compare tradeoffs before hiring/replacing.
  - notices merc action impact in next combat turn cycle.
- Success criteria:
  - player can explain why they hired that merc and identify one payoff turn.

## 2) Feature Guides

### Guide 1: Add a New Class
1. Add class baseline in `data/seeds/d2/classes.json`.
2. Add class trees/skills in `data/seeds/d2/skills.json`.
3. Add class visuals in `data/seeds/d2/assets-manifest.json`.
4. Hook to runtime class registry and class select UI.
5. Add tests:
- class appears in select screen.
- starter skills/deck valid.
- class save/load round-trips.

### Guide 2: Add or Edit Skill Trees
1. Add or update tree ID and skills in `skills.json`.
2. Ensure prerequisite graph is acyclic.
3. Map tree icon in `assets-manifest.json` (`skillTreeIcons`).
4. Implement effect handlers for any new effect keys.
5. Add tests:
- unlock rules.
- cooldown/energy behavior.
- persistence of learned nodes.

### Guide 3: Add Zones and Encounter Routing
1. Edit target act in `zones.json` (`mainlineZones` and `sideZones`).
2. Define how named zones compress into the act world tree.
3. Validate traversal balance for `battle`, `miniboss`, and boss progression.
4. Add any required zone art references to `assets-manifest.json`.
5. Add tests:
- world-tree generation always valid.
- boss route always remains reachable.

### Guide 4: Add Enemies and Bosses
1. Add enemies to relevant act pool in `enemy-pools.json`.
2. Add/adjust encounter archetype packs.
3. Add boss metadata under `actBosses` (themes/zone).
4. Map sprites/icons in `assets-manifest.json`.
5. Implement intents and telegraphs in runtime enemy blueprint logic.
6. Add tests:
- intent sequence validity.
- cook-time telegraphs resolve correctly.
- loot and XP distribution expected.

### Guide 5: Add Special Event Content (Placeholder Track)
1. Add event metadata and choice/outcome structure.
2. Keep event scope distinct from town vendors and combat nodes.
3. Map event visuals and SFX from `assets-manifest.json`.
4. Update event UI descriptions for expected value/risk.
5. Add tests:
- event resolution is deterministic.
- invalid event data falls back safely.

### Guide 6: Asset Integration Workflow
1. Choose `shipping_safe` or `reference_only` asset tier.
2. Register file in `assets-manifest.json`.
3. Add fallback icon for missing/unloaded assets.
4. Verify path existence and load in desktop/mobile layouts.
5. Add attribution/license note if required.

### Guide 7: Add or Tune Mercenaries
1. Define mercenary metadata and scaling fields in config (`id`, `role`, `baseHp`, `hpPerLevel`, `baseAttack`, `skills`).
2. Add hire windows and cost rules to safe-zone progression logic.
3. Implement deterministic action priority (support if player low, else offense).
4. Add UI row for current mercenary status and turn action log.
5. Add tests:
- hiring/replacing behavior.
- revive/safe-zone recovery behavior.
- deterministic turn decisions for fixed board states.

## 3) Scenario Acceptance Matrix
- Onboarding clarity: Scenario A + town readability + clear exit to first world-map route.
- Build depth: Scenario B + meaningful stat/tree/gear delta.
- Routing strategy: Scenario C + risk/reward visible before commit.
- Quest contract clarity: Scenario C + target, reward, and missed/completed state visible in HUD.
- Boss readability: Scenario D + telegraph preview + counterplay window.
- Retry loop quality: Scenario E + clear post-run summary and fast restart.
- Companion clarity: Scenario F + mercenary value visible within one combat.

## 4) Release Checklist for Each Iteration
- `Data`: IDs validated, no broken references.
- `Gameplay`: no soft-locks in node or turn flow.
- `UX`: class/act/zone/node status always visible.
- `Balance`: battle/miniboss/boss/vendor expected value in target range.
- `Tech`: tests green, save migration safe.
