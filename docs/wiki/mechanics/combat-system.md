# Combat System

> Core combat loop, resources, and resolution rules.

Last updated: 2026-04-11

## Turn Structure

Each combat round follows this order:

1. **Start of Turn** — Tick status effects (burn damage, poison damage), apply per-turn aura effects, replenish energy
2. **Hero Phase** — Player plays cards (costs energy), uses skills (cooldown-based), uses potions
3. **Mercenary Phase** — Mercenary auto-attacks based on behavior targeting
4. **Minion Phase** — Summoned minions attack based on AI priorities
5. **Enemy Phase** — Each living enemy resolves its current intent
6. **End of Turn** — Decay temporary effects, advance enemy intent scripts, draw cards for next turn

## Core Resources

### Life (HP)

| Entity | Base HP | Notes |
|--------|---------|-------|
| Hero (Amazon) | 50 | STR 20, DEX 25, VIT 20, ENE 15 |
| Hero (Assassin) | 50 | STR 20, DEX 20, VIT 20, ENE 25 |
| Hero (Barbarian) | 55 | STR 30, DEX 20, VIT 25, ENE 10 |
| Hero (Druid) | 55 | STR 15, DEX 20, VIT 25, ENE 20 |
| Hero (Necromancer) | 45 | STR 15, DEX 25, VIT 15, ENE 25 |
| Hero (Paladin) | 55 | STR 25, DEX 20, VIT 25, ENE 15 |
| Hero (Sorceress) | 40 | STR 10, DEX 25, VIT 10, ENE 35 |

Life is modified by equipment (heroMaxLife bonuses) and item set effects.

### Energy (Mana)

- Base energy: 3 (all classes, modified by equipment heroMaxEnergy)
- Replenishes fully at start of each turn
- Cards cost 1-2 energy to play
- Energy drain status reduces available energy

### Guard (Block/Shield)

- Absorbs damage before life
- Does not persist between turns unless granted by specific effects
- Sunder attacks bypass guard
- Guard can be gained from cards, skills, equipment, and encounter effects

### Hand & Draw

- Base hand size: 5
- Draw 5 cards at start of each turn (from draw pile)
- When draw pile is empty, shuffle discard pile into draw pile
- Some cards and effects grant additional draw
- Chill status reduces draw by 1 per stack

## Damage Resolution

### Damage Types

| Type | Applied By | Status Effect |
|------|-----------|---------------|
| Physical | Melee, weapon attacks | None (base) |
| Fire | Fire cards, burn effects | Burn (DoT) |
| Cold | Cold cards, freeze effects | Freeze/Slow/Chill |
| Lightning | Lightning cards | Paralyze/Stun |
| Poison | Poison cards | Poison (DoT) |
| Magic | Pure magic damage | None (unresistable) |

### Damage Formula

```
finalDamage = baseDamage + bonuses
effectiveDamage = max(0, finalDamage - guard)
lifeRemaining = life - effectiveDamage
```

**Bonuses that modify damage:**
- `heroDamageBonus` — Persistent per-combat bonus from cards/skills
- `heroGuardBonus` — Persistent per-combat bonus to guard generation
- `heroBurnBonus` — Persistent per-combat bonus to burn application
- Weapon combat profile bonuses
- Mercenary aura bonuses (e.g., Precision +2, Might +3)
- Amplify debuff increases incoming damage
- Weaken debuff reduces outgoing damage

### Guard Interaction

- Damage hits guard first, then life
- `sunder_attack` intent bypasses guard entirely
- `death_explosion` trait bypasses guard (30% of maxLife as physical)
- Crushing blow weapon effect breaks enemy guard

## Potions

- Hero carries potion charges on belt
- Each use heals `potionHeal` HP (base 12, modified by equipment)
- Charges are limited and refilled at town quartermaster
- Using a potion costs no energy

## Win/Loss Conditions

- **Win**: All enemies in the encounter are dead
- **Loss**: Hero life reaches 0 (mercenary death does not end combat)
- **Run Win**: Clear all acts through Act 5 boss (Baal)
- **Run Loss**: Hero dies in any encounter

## Skill System

Skills are separate from cards:
- **Active skills** — Usable abilities with cooldowns (not drawn from deck)
- **Passive skills** — Persistent bonuses active for the run
- **Aura skills** — Ongoing effects that modify combat state

Skills evolve through trees with prerequisites. See [Card System](card-system.md) for card-specific mechanics.

## Source Files

- `src/combat/combat-engine.ts` — Main combat loop
- `src/combat/combat-engine-turns.ts` — Turn resolution
- `src/combat/combat-engine-skills.ts` — Skill resolution
- `src/combat/combat-engine-minions.ts` — Summon/minion system
- `src/types/combat.d.ts` — Combat state types
