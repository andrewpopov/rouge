# Card System

> Card effects, deck economy, behavior tags, and upgrade paths.

Last updated: 2026-04-11

## Card Economy

### Deck Structure

- **Starter Deck** — Class-specific initial deck (varies by class)
- **Draw Pile** — Unplayed cards, shuffled
- **Hand** — Currently playable cards (up to 5)
- **Discard Pile** — Played cards
- **Deck Surgery** — One-time card removal per run (minimum deck size: 5)

### Per-Turn Flow

1. Draw up to hand size (default 5)
2. Play cards during hero phase (costs energy)
3. Played cards go to discard
4. When draw pile empty, shuffle discard into draw pile

### Card Rewards

- 3 card choices per reward
- Cards scored by archetype alignment
- Reward engine uses archetype data to weight offerings

## Card Effect Kinds (25 Types)

### Damage

| Kind | Target | Description |
|------|--------|-------------|
| `damage` | Single enemy | Direct damage |
| `damage_all` | All enemies | AoE damage |

### Defense

| Kind | Target | Description |
|------|--------|-------------|
| `gain_guard_self` | Hero | Hero gains guard |
| `gain_guard_party` | Hero + Mercenary | Party-wide guard |

### Healing

| Kind | Target | Description |
|------|--------|-------------|
| `heal_hero` | Hero | Restore hero life |
| `heal_mercenary` | Mercenary | Restore mercenary life |

### Status Effects

| Kind | Target | Status |
|------|--------|--------|
| `apply_burn` / `apply_burn_all` | Single / All | Burn (fire DoT) |
| `apply_poison` / `apply_poison_all` | Single / All | Poison (DoT) |
| `apply_slow` / `apply_slow_all` | Single / All | Slow |
| `apply_freeze` / `apply_freeze_all` | Single / All | Freeze (hard CC) |
| `apply_stun` / `apply_stun_all` | Single / All | Stun (hard CC) |
| `apply_paralyze` / `apply_paralyze_all` | Single / All | Paralyze (lightning CC) |

### Utility

| Kind | Target | Description |
|------|--------|-------------|
| `draw` | Self | Draw additional cards |
| `mark_enemy_for_mercenary` | Enemy | Mark for mercenary targeting + bonus damage |
| `buff_mercenary_next_attack` | Mercenary | Bonus damage on merc's next attack |
| `apply_taunt` | Mercenary | Force enemies to target merc |
| `apply_fade` | Hero | Reduce hero threat |
| `summon_minion` | Board | Summon a creature to fight |

## Card Behavior Tags (11 Types)

These describe the strategic role/pattern of a card:

| Tag | Meaning | Example |
|-----|---------|---------|
| `pressure` | Direct offensive output | Damage cards, multi-hit |
| `mitigation` | Defensive management | Guard gain, healing |
| `setup` | Condition-setting for payoffs | Applying slow/burn before payoff cards |
| `payoff` | Conditional damage/value triggers | Bonus damage to slowed/burning targets |
| `salvage` | Recovery from bad states | Heal after burst, emergency guard |
| `conversion` | Turning resources into other resources | Energy into guard, life into damage |
| `support` | Enabling allies | Mercenary buffs, mark, draw |
| `tax` | Persistent cost on enemies | Ongoing DoT, energy denial |
| `disruption` | Interfering with enemy plans | Stun, freeze, slow |
| `protection` | Party-wide defensiveness | Party guard, damage reduction |
| `scaling` | Value that grows mid-run | Persistent bonuses, stacking effects |

## Counter Tags (11 Types)

These describe what enemy patterns a deck can handle:

| Tag | Counters |
|-----|----------|
| `anti_attrition` | Grinding/long fights |
| `anti_guard_break` | High penetration / sunder attacks |
| `anti_backline` | Ranged/summon threats |
| `anti_support_disruption` | Enemy control/debuffs |
| `anti_fire_pressure` | Burn damage / fire burst |
| `anti_lightning_pressure` | Shock/electrical threats |
| `anti_summon` | Minion swarms |
| `anti_control` | Status/CC effects |
| `anti_tax` | Resource denial |
| `telegraph_respect` | Telegraphed burst (charge intents) |

## Card Splash Roles

| Splash Role | Meaning |
|-------------|---------|
| `primary_only` | Only offered to its primary archetype |
| `utility_splash_ok` | Can appear as utility pick in other archetypes |
| `hybrid_only` | Only for hybrid archetype builds |

## Card Roles (Quality Scoring)

| Role | Score Weight | Description |
|------|-------------|-------------|
| `foundation` | 1 | Basic/starter card |
| `engine` | 4 | Core synergy piece (highest value) |
| `support` | 2 | Utility/support card |
| `tech` | 2 | Situational answer card |

## Archetype Scoring

Cards are scored for archetype fit using:

- `TREE_RANK_SCORE_WEIGHT`: 12 — Base score for tree alignment
- `FAVORED_TREE_SCORE_BONUS`: 2 — Extra for favored tree
- `PRIMARY_TREE_CARD_SCORE_MULTIPLIER`: 1.0 — Full score for primary tree
- `SUPPORT_TREE_CARD_SCORE_MULTIPLIER`: 0.45 — Reduced score for support tree
- `SECONDARY_WEAPON_FAMILY_THRESHOLD`: 0.7 — Threshold for secondary weapon picks

## Evolution Chains

Cards evolve along tree-specific chains. Each evolution:
- Replaces the previous card in the deck
- Has stronger effects and/or lower relative cost
- May unlock new effect types (e.g., AoE, status application)

Evolution is gated by skill tree investment and run progression.

## Shared Neutral Cards

All classes have access to shared neutral cards:

| Card | Cost | Effect |
|------|------|--------|
| swing | 1E | Basic melee attack |
| measured_swing | 1E | Stronger basic attack |
| kick | 1E | Basic attack + utility |
| mark_target | 1E | Mark for mercenary |
| field_dressing | 1E | Heal |
| guard_stance | 1E | Guard gain |
| rally_mercenary | 1E | Mercenary buff |
| scout_ahead | 1E | Draw/information |
| shove | 1E | Displacement/utility |

These are generally "unwanted" in optimized builds — a sign of deck bloat.

## Source Files

- `src/combat/card-effects.ts` — Effect resolution
- `src/combat/card-behavior-data.ts` — Behavior and counter tag definitions
- `src/rewards/reward-engine-archetypes-data.ts` — Archetype scoring data
- `src/rewards/reward-engine.ts` — Reward offering logic
