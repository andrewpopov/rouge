# Act Bosses

> The five major act bosses, their behavior, resistances, and strategy.

Last updated: 2026-04-11

## Boss Overview

| Boss | Act | Zone | Theme |
|------|-----|------|-------|
| Andariel | 1 | Catacombs | Poison, bleed, fast melee |
| Duriel | 2 | Tal Rasha's Chamber | Charge, cold aura, high melee burst |
| Mephisto | 3 | Durance of Hate | Lightning, cold orb, skull missile |
| Diablo | 4 | Chaos Sanctuary | Fire nova, lightning hose, bone prison |
| Baal | 5 | Worldstone Chamber | Mana burn, clone pressure, cold wedge, tentacles |

---

## Andariel — Maiden of Anguish (Act 1)

**Group:** super_unique

**Health by Difficulty:**
| Difficulty | HP |
|-----------|-----|
| Normal | 1,024 |
| Nightmare | 24,800 |
| Hell | 60,031 |

**Resistances:**

| Difficulty | Fire | Cold | Lightning | Poison | Physical | Magic |
|-----------|------|------|-----------|--------|----------|-------|
| Normal | -50% | 50% | 50% | 80% | 0% | 0% |
| Nightmare | -50% | 50% | 50% | 50% | 0% | 0% |
| Hell | -50% | 66% | 66% | 66% | 66% | 0% |

**Special Abilities:** Poison Bolt, Poison Wave

**Strategy:**
- **Fire weakness** (-50% all difficulties) — fire builds have a major advantage
- High poison resistance — poison builds are ineffective
- Fast melee attacks — need guard/mitigation for sustained melee pressure
- First boss check: if your build can't handle Andariel's poison + melee, it won't survive later acts

**Rune Drops:** Normal: Nef, Nightmare: Ko, Hell: Lo

---

## Duriel (Act 2)

**Group:** super_unique

**Theme:** Charge-based cold melee. Opens with devastating charge attack, then sustained cold pressure.

**Key Mechanics:**
- Opening charge deals massive burst damage
- Cold aura applies chill, reducing draw
- High physical melee damage
- Enclosed arena — no room to maneuver

**Strategy:**
- Survive the opening charge (guard is essential)
- Cold resistance/immunity counters chill stacking
- Shorter fight = better (attrition favors Duriel)
- Fire and lightning damage bypass his physical focus

---

## Mephisto — Lord of Hatred (Act 3)

**Group:** super_unique

**Theme:** Mixed elemental attacks. Lightning, cold orb, and skull missiles create multi-element pressure.

**Key Mechanics:**
- Lightning hose attack for sustained damage
- Cold orb for AoE + chill
- Skull missiles for physical/magic damage
- Escorts possible (Council members)

**Strategy:**
- Multi-element resistance needed (no single element counters all attacks)
- Kill escorts first if present
- Lightning resistance is most important (highest damage attack)
- Disruption/freeze to interrupt casting chains

---

## Diablo — Lord of Terror (Act 4)

**Group:** super_unique

**Theme:** Fire nova, lightning hose, bone prison. The ultimate combined threat.

**Key Mechanics:**
- Fire Nova — AoE fire burst
- Lightning Hose — Sustained lightning beam
- Bone Prison — Control effect (locks hero)
- Red Lightning — High burst damage

**Strategy:**
- Highest combined damage output of any boss
- Need answers for fire AND lightning (dual element threat)
- Bone prison control requires CC break or guard to survive during lockdown
- Long fight — need sustained healing/guard, not just burst
- Chaos Sanctuary pre-fight encounters are dangerous (seal guardians)

---

## Baal — Lord of Destruction (Act 5)

**Group:** super_unique

**Theme:** Mana burn, clone pressure, cold wedge, tentacle summons. The final boss.

**Key Mechanics:**
- Mana Burn — Drains energy, disrupts card plays
- Clone Summon — Creates a Baal clone that must be dealt with
- Cold Wedge — AoE cold damage + chill
- Tentacle Spawn — Summons tentacle adds for sustained pressure
- Throne Room waves before the fight

**Strategy:**
- Energy management is critical — Mana Burn punishes high-energy builds
- Must handle adds (tentacles, clones) while damaging Baal
- Cold resistance helps with wedge attacks
- Throne of Destruction waves before boss room serve as endurance check
- Need both single-target boss damage AND AoE for adds
- This is the final skill check — deck must answer everything

---

## Boss Difficulty Scaling

| Property | Normal | Nightmare | Hell |
|----------|--------|-----------|------|
| HP multiplier | 1x | ~25x | ~60x |
| Resistance scaling | Base | +0-10% | +16-50% |
| Drain effectiveness | 100% | 66% | 33% |
| Affix count (non-boss) | Per act table | Per act table | Per act table |

## Source Files

- `data/seeds/d2/bosses.json` — Boss definitions
- `src/combat/combat-engine-monster-actions.ts` — Boss intent resolution
