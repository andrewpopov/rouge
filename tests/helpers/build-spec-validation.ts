/**
 * Build Spec Validation System
 *
 * Three layers:
 * 1. BUILD_SPECS — target card lists + stat expectations per build
 * 2. Battle testing — validate each spec against encounters at expected power levels
 * 3. Monte Carlo — estimate probability of achieving each spec via normal progression
 */
import { createCombatHarness, createAppHarness } from "./browser-harness"
import {
  createQuietAppHarness,
  createSeededRandom,
  createProgressionSimulationSeed,
  getPolicyDefinitions,
} from "./run-progression-simulator-core"

// ── Build Spec Definitions ────────────────────────────────────────────────────

export interface BuildSpec {
  id: string
  classId: string
  label: string
  preferredTreeId: string
  targetDeckSize: [number, number] // [min, max]
  coreCards: string[]              // must-have cards (the synergy engine)
  flexCards: string[]              // good-to-have cards (fill remaining slots)
  unwantedCards: string[]          // actively avoid these
  statTargets: {
    act1: { damageBonus: number; guardBonus: number; maxLife: number; maxEnergy: number }
    act3: { damageBonus: number; guardBonus: number; maxLife: number; maxEnergy: number }
    act5: { damageBonus: number; guardBonus: number; maxLife: number; maxEnergy: number }
  }
}

export const BUILD_SPECS: BuildSpec[] = [
  // ── Barbarian ──
  {
    id: "barbarian_berserker",
    classId: "barbarian",
    label: "Barbarian Berserker",
    preferredTreeId: "barbarian_combat_masteries",
    targetDeckSize: [13, 16],
    coreCards: [
      "barbarian_bash", "barbarian_double_swing", "barbarian_sword_mastery",
      "barbarian_stun", "barbarian_axe_mastery", "barbarian_concentrate",
    ],
    flexCards: [
      "barbarian_frenzy", "barbarian_weapon_mastery", "barbarian_battle_charge",
      "barbarian_iron_skin", "barbarian_find_potion", "barbarian_natural_resistance",
      "barbarian_howl", "rally_mercenary", "guard_stance",
    ],
    unwantedCards: ["swing", "measured_swing", "kick", "field_dressing", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 2, maxLife: 65, maxEnergy: 3 },
      act3: { damageBonus: 8, guardBonus: 5, maxLife: 110, maxEnergy: 4 },
      act5: { damageBonus: 14, guardBonus: 8, maxLife: 170, maxEnergy: 5 },
    },
  },
  {
    id: "barbarian_warcrier",
    classId: "barbarian",
    label: "Barbarian Warcrier",
    preferredTreeId: "barbarian_warcries",
    targetDeckSize: [15, 18],
    coreCards: [
      "barbarian_howl", "barbarian_shout", "barbarian_battle_cry",
      "barbarian_battle_orders", "barbarian_war_cry", "barbarian_fury_howl",
    ],
    flexCards: [
      "barbarian_find_potion", "barbarian_iron_skin", "barbarian_natural_resistance",
      "barbarian_bash", "barbarian_sword_mastery", "barbarian_warlord_shout",
      "barbarian_increased_stamina", "rally_mercenary", "barbarian_bulwark",
    ],
    unwantedCards: ["swing", "measured_swing", "kick"],
    statTargets: {
      act1: { damageBonus: 2, guardBonus: 3, maxLife: 70, maxEnergy: 3 },
      act3: { damageBonus: 6, guardBonus: 7, maxLife: 130, maxEnergy: 4 },
      act5: { damageBonus: 10, guardBonus: 12, maxLife: 200, maxEnergy: 5 },
    },
  },

  // ── Druid ──
  {
    id: "druid_summoner",
    classId: "druid",
    label: "Druid Summoner",
    preferredTreeId: "druid_summoning",
    targetDeckSize: [16, 20],
    coreCards: [
      "druid_raven", "druid_poison_creeper", "druid_oak_sage",
      "druid_spirit_wolf", "druid_heart_of_wolverine", "druid_pack_howl",
    ],
    flexCards: [
      "druid_natures_wrath", "druid_dire_wolf", "druid_natures_balance",
      "druid_firestorm", "druid_werewolf", "druid_cyclone_armor",
      "druid_lycanthropy", "druid_werebear", "rally_mercenary", "swing", "kick",
    ],
    unwantedCards: ["measured_swing", "mark_target", "field_dressing"],
    statTargets: {
      act1: { damageBonus: 2, guardBonus: 3, maxLife: 60, maxEnergy: 3 },
      act3: { damageBonus: 5, guardBonus: 6, maxLife: 100, maxEnergy: 4 },
      act5: { damageBonus: 8, guardBonus: 10, maxLife: 160, maxEnergy: 5 },
    },
  },
  {
    id: "druid_elementalist",
    classId: "druid",
    label: "Druid Elementalist",
    preferredTreeId: "druid_elemental",
    targetDeckSize: [14, 17],
    coreCards: [
      "druid_firestorm", "druid_molten_boulder", "druid_fissure",
      "druid_volcano", "druid_tornado", "druid_twister",
    ],
    flexCards: [
      "druid_arctic_blast", "druid_gale_force", "druid_eruption",
      "druid_cyclone_armor", "druid_lycanthropy", "druid_werebear",
      "druid_werewolf", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "mark_target"],
    statTargets: {
      act1: { damageBonus: 2, guardBonus: 2, maxLife: 55, maxEnergy: 3 },
      act3: { damageBonus: 6, guardBonus: 4, maxLife: 95, maxEnergy: 4 },
      act5: { damageBonus: 10, guardBonus: 6, maxLife: 150, maxEnergy: 5 },
    },
  },

  // ── Necromancer ──
  {
    id: "necromancer_summoner",
    classId: "necromancer",
    label: "Necromancer Summoner",
    preferredTreeId: "necromancer_summoning",
    targetDeckSize: [16, 20],
    coreCards: [
      "necromancer_raise_skeleton", "necromancer_clay_golem",
      "necromancer_skeletal_mage", "necromancer_skeleton_mastery",
      "necromancer_golem_mastery", "necromancer_amplify_damage",
    ],
    flexCards: [
      "necromancer_life_tap", "necromancer_bone_armor", "necromancer_dark_pact",
      "necromancer_soul_harvest", "necromancer_bone_offering",
      "rally_mercenary", "necromancer_teeth",
    ],
    unwantedCards: ["swing", "measured_swing", "kick", "mark_target"],
    statTargets: {
      act1: { damageBonus: 1, guardBonus: 3, maxLife: 50, maxEnergy: 3 },
      act3: { damageBonus: 4, guardBonus: 6, maxLife: 90, maxEnergy: 4 },
      act5: { damageBonus: 7, guardBonus: 10, maxLife: 150, maxEnergy: 5 },
    },
  },

  // ── Paladin ──
  {
    id: "paladin_zealot",
    classId: "paladin",
    label: "Paladin Zealot",
    preferredTreeId: "paladin_offensive_auras",
    targetDeckSize: [13, 16],
    coreCards: [
      "paladin_holy_fire", "paladin_thorns", "paladin_charge",
      "paladin_blessed_aim", "paladin_vengeance", "paladin_concentration",
    ],
    flexCards: [
      "paladin_sacrifice", "paladin_smite", "paladin_might",
      "paladin_prayer", "paladin_cleansing", "paladin_defiance",
      "rally_mercenary", "guard_stance",
    ],
    unwantedCards: ["swing", "measured_swing", "kick", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 3, maxLife: 60, maxEnergy: 3 },
      act3: { damageBonus: 7, guardBonus: 6, maxLife: 110, maxEnergy: 4 },
      act5: { damageBonus: 12, guardBonus: 9, maxLife: 170, maxEnergy: 5 },
    },
  },
  {
    id: "paladin_guardian",
    classId: "paladin",
    label: "Paladin Guardian",
    preferredTreeId: "paladin_defensive_auras",
    targetDeckSize: [15, 18],
    coreCards: [
      "paladin_prayer", "paladin_defiance", "paladin_holy_freeze",
      "paladin_cleansing", "paladin_meditation", "paladin_holy_shield",
    ],
    flexCards: [
      "paladin_smite", "paladin_might", "paladin_sacrifice",
      "paladin_thorns", "paladin_holy_bolt", "rally_mercenary",
      "guard_stance", "paladin_righteous_guard",
    ],
    unwantedCards: ["swing", "measured_swing", "kick"],
    statTargets: {
      act1: { damageBonus: 2, guardBonus: 4, maxLife: 65, maxEnergy: 3 },
      act3: { damageBonus: 5, guardBonus: 8, maxLife: 120, maxEnergy: 4 },
      act5: { damageBonus: 8, guardBonus: 14, maxLife: 190, maxEnergy: 5 },
    },
  },

  // ── Assassin ──
  {
    id: "assassin_martial",
    classId: "assassin",
    label: "Assassin Martial Artist",
    preferredTreeId: "assassin_martial_arts",
    targetDeckSize: [12, 15],
    coreCards: [
      "assassin_tiger_strike", "assassin_cobra_strike", "assassin_fists_of_fire",
      "assassin_dragon_talon", "assassin_venom", "assassin_claw_mastery",
    ],
    flexCards: [
      "assassin_burst_of_speed", "assassin_blade_shield", "assassin_weapon_block",
      "assassin_psychic_hammer", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 2, maxLife: 55, maxEnergy: 3 },
      act3: { damageBonus: 9, guardBonus: 4, maxLife: 95, maxEnergy: 4 },
      act5: { damageBonus: 16, guardBonus: 6, maxLife: 150, maxEnergy: 5 },
    },
  },
  {
    id: "assassin_shadow",
    classId: "assassin",
    label: "Assassin Shadow Master",
    preferredTreeId: "assassin_shadow_disciplines",
    targetDeckSize: [14, 17],
    coreCards: [
      "assassin_psychic_hammer", "assassin_burst_of_speed", "assassin_cloak_of_shadows",
      "assassin_fade", "assassin_shadow_warrior", "assassin_claw_mastery",
    ],
    flexCards: [
      "assassin_blade_shield", "assassin_weapon_block", "assassin_venom",
      "assassin_cobra_strike", "assassin_shadow_veil", "assassin_shadow_master",
      "assassin_lethal_tempo", "assassin_natalyas_guard", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 3, maxLife: 55, maxEnergy: 3 },
      act3: { damageBonus: 7, guardBonus: 6, maxLife: 100, maxEnergy: 4 },
      act5: { damageBonus: 12, guardBonus: 9, maxLife: 160, maxEnergy: 5 },
    },
  },

  // ── Sorceress ──
  {
    id: "sorceress_lightning",
    classId: "sorceress",
    label: "Sorceress Lightning",
    preferredTreeId: "sorceress_lightning",
    targetDeckSize: [14, 17],
    coreCards: [
      "sorceress_charged_bolt", "sorceress_static_field", "sorceress_chain_lightning",
      "sorceress_lightning", "sorceress_nova", "sorceress_thunder_storm",
    ],
    flexCards: [
      "sorceress_energy_shield", "sorceress_warmth", "sorceress_enchant",
      "sorceress_spell_surge", "sorceress_arcane_focus", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "kick", "mark_target"],
    statTargets: {
      act1: { damageBonus: 1, guardBonus: 2, maxLife: 45, maxEnergy: 4 },
      act3: { damageBonus: 4, guardBonus: 4, maxLife: 80, maxEnergy: 5 },
      act5: { damageBonus: 7, guardBonus: 6, maxLife: 130, maxEnergy: 5 },
    },
  },

  // ── Amazon ──
  {
    id: "amazon_marksman",
    classId: "amazon",
    label: "Amazon Marksman",
    preferredTreeId: "amazon_bow_and_crossbow",
    targetDeckSize: [14, 17],
    coreCards: [
      "amazon_magic_arrow", "amazon_cold_arrow", "amazon_guided_arrow",
      "amazon_multiple_shot", "amazon_inner_sight", "amazon_penetrate",
    ],
    flexCards: [
      "amazon_strafe", "amazon_critical_strike", "amazon_dodge",
      "amazon_inner_calm", "amazon_exploding_arrow", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "kick", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 2, maxLife: 55, maxEnergy: 3 },
      act3: { damageBonus: 9, guardBonus: 4, maxLife: 95, maxEnergy: 4 },
      act5: { damageBonus: 15, guardBonus: 6, maxLife: 150, maxEnergy: 5 },
    },
  },
  {
    id: "amazon_javazon",
    classId: "amazon",
    label: "Amazon Javazon",
    preferredTreeId: "amazon_javelin_and_spear",
    targetDeckSize: [14, 17],
    coreCards: [
      "amazon_jab", "amazon_power_strike", "amazon_charged_strike",
      "amazon_lightning_bolt", "amazon_lightning_strike", "amazon_inner_sight",
    ],
    flexCards: [
      "amazon_javelin_rush", "amazon_poison_javelin", "amazon_dodge",
      "amazon_critical_strike", "amazon_decoy", "rally_mercenary",
    ],
    unwantedCards: ["swing", "measured_swing", "mark_target"],
    statTargets: {
      act1: { damageBonus: 3, guardBonus: 2, maxLife: 55, maxEnergy: 3 },
      act3: { damageBonus: 9, guardBonus: 4, maxLife: 95, maxEnergy: 4 },
      act5: { damageBonus: 15, guardBonus: 6, maxLife: 150, maxEnergy: 5 },
    },
  },
]

// ── Layer 1: Build a test deck from a spec ────────────────────────────────────

export function buildTestDeck(spec: BuildSpec): string[] {
  const deck = [...spec.coreCards]
  const [, maxSize] = spec.targetDeckSize
  for (const card of spec.flexCards) {
    if (deck.length >= maxSize) break
    deck.push(card)
  }
  return deck
}

// ── Layer 2: Battle Test — validate spec against encounters ───────────────────

export interface BattleTestResult {
  specId: string
  encounterIds: string[]
  statLevel: "act1" | "act3" | "act5"
  wins: number
  total: number
  avgTurns: number
  details: Array<{ encounterId: string; seed: number; outcome: string; turns: number }>
}

export function runBattleTest(
  spec: BuildSpec,
  encounterIds: string[],
  statLevel: "act1" | "act3" | "act5",
  seeds = 5
): BattleTestResult {
  const harness = createCombatHarness()
  const deck = buildTestDeck(spec)
  const stats = spec.statTargets[statLevel]
  const details: BattleTestResult["details"] = []

  for (const encounterId of encounterIds) {
    for (let seed = 1; seed <= seeds; seed++) {
      try {
        const state = harness.engine.createCombatState({
          content: harness.content,
          encounterId,
          mercenaryId: "rogue_scout",
          randomFn: createSeededRandom(seed * 1000 + encounterIds.indexOf(encounterId)),
          starterDeck: deck,
          heroState: {
            maxLife: stats.maxLife,
            damageBonus: stats.damageBonus,
            guardBonus: stats.guardBonus,
            maxEnergy: stats.maxEnergy,
            handSize: 5,
            potionHeal: Math.round(stats.maxLife * 0.15),
          },
        })

        // Simple combat AI: play affordable cards targeting weakest enemy
        let turns = 0
        while (!state.outcome && turns < 30) {
          if (state.phase === "player") {
            const hand = [...state.hand]
            hand.sort((a, b) => {
              const da = harness.content.cardCatalog[a.cardId]
              const db = harness.content.cardCatalog[b.cardId]
              return (db?.effects?.[0]?.value || 0) - (da?.effects?.[0]?.value || 0)
            })
            for (const card of hand) {
              const def = harness.content.cardCatalog[card.cardId]
              if (def && def.cost <= state.hero.energy && !state.outcome) {
                const target = state.enemies
                  .filter((e: { alive: boolean }) => e.alive)
                  .sort((a: { life: number }, b: { life: number }) => a.life - b.life)[0]
                harness.engine.playCard(state, harness.content, card.instanceId, target?.id)
              }
            }
            if (!state.outcome) harness.engine.endTurn(state)
          }
          turns++
        }
        details.push({ encounterId, seed, outcome: state.outcome || "timeout", turns })
      } catch {
        details.push({ encounterId, seed, outcome: "error", turns: 0 })
      }
    }
  }

  const wins = details.filter((d) => d.outcome === "victory").length
  const avgTurns = details.reduce((s, d) => s + d.turns, 0) / details.length
  return { specId: spec.id, encounterIds, statLevel, wins, total: details.length, avgTurns, details }
}

// ── Layer 3: Monte Carlo — estimate build achievability ───────────────────────

export interface AchievabilityResult {
  specId: string
  seeds: number
  avgCoreCardsFound: number
  avgDeckSize: number
  avgCoreRatio: number
  bestSeed: { seed: number; coreFound: number; deckSize: number; deck: string[] }
  worstSeed: { seed: number; coreFound: number; deckSize: number; deck: string[] }
}

export function runAchievabilityMonteCarlo(
  spec: BuildSpec,
  numSeeds = 20
): AchievabilityResult {
  const harness = createQuietAppHarness()
  const policy = getPolicyDefinitions(["balanced"])[0]

  const seedResults: Array<{ seed: number; coreFound: number; deckSize: number; deck: string[] }> = []

  for (let seedOffset = 0; seedOffset < numSeeds; seedOffset++) {
    try {
      const { createSimulationState } = require("./run-progression-simulator")
      const { runProgressionPolicyFromState } = require("./run-progression-simulator")

      const seed = createProgressionSimulationSeed(spec.classId, policy.id, 5, seedOffset)
      const state = createSimulationState(harness, spec.classId, seed, {})

      runProgressionPolicyFromState(harness, state, spec.classId, policy, 3, 1, 24, seedOffset)

      const deck = state.run?.deck || []
      // Normalize: strip _plus suffix for matching (cards get upgraded)
      const normalizedDeck = deck.map((c: string) => c.replace(/_plus$/, ""))
      const coreFound = spec.coreCards.filter((c: string) => normalizedDeck.includes(c)).length

      seedResults.push({ seed: seedOffset, coreFound, deckSize: deck.length, deck: [...deck] })
    } catch {
      seedResults.push({ seed: seedOffset, coreFound: 0, deckSize: 0, deck: [] })
    }
  }

  const avgCoreFound = seedResults.reduce((s, r) => s + r.coreFound, 0) / numSeeds
  const avgDeckSize = seedResults.reduce((s, r) => s + r.deckSize, 0) / numSeeds
  const avgCoreRatio = avgCoreFound / spec.coreCards.length

  const sorted = [...seedResults].sort((a, b) => b.coreFound - a.coreFound)
  return {
    specId: spec.id,
    seeds: numSeeds,
    avgCoreCardsFound: avgCoreFound,
    avgDeckSize,
    avgCoreRatio,
    bestSeed: sorted[0],
    worstSeed: sorted[sorted.length - 1],
  }
}

// ── Runner: full validation pipeline ──────────────────────────────────────────

export function validateBuildSpec(spec: BuildSpec) {
  console.log(`\n=== ${spec.label} (${spec.id}) ===`)
  console.log(`Target deck: ${spec.targetDeckSize[0]}-${spec.targetDeckSize[1]} cards`)
  console.log(`Core cards (${spec.coreCards.length}): ${spec.coreCards.join(", ")}`)

  // Battle test at each stat level
  const encounters = ["act_1_boss", "act_3_boss"]
  for (const level of ["act1", "act3", "act5"] as const) {
    const result = runBattleTest(spec, encounters, level, 5)
    console.log(`  ${level} stats: ${result.wins}/${result.total} wins (avg ${result.avgTurns.toFixed(1)}T)`)
    for (const enc of encounters) {
      const encResults = result.details.filter((d) => d.encounterId === enc)
      const encWins = encResults.filter((d) => d.outcome === "victory").length
      console.log(`    ${enc}: ${encWins}/5`)
    }
  }

  // Monte Carlo achievability
  console.log("  Achievability (10 seeds):")
  const mc = runAchievabilityMonteCarlo(spec, 10)
  console.log(`    Core cards found: ${mc.avgCoreCardsFound.toFixed(1)}/${spec.coreCards.length} (${(mc.avgCoreRatio * 100).toFixed(0)}%)`)
  console.log(`    Avg deck size: ${mc.avgDeckSize.toFixed(1)}`)
  console.log(`    Best seed: ${mc.bestSeed.coreFound}/${spec.coreCards.length} core, ${mc.bestSeed.deckSize} cards`)
  console.log(`    Worst seed: ${mc.worstSeed.coreFound}/${spec.coreCards.length} core, ${mc.worstSeed.deckSize} cards`)
}
