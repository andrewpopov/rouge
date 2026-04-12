import { getMatchingProficienciesForWeapon } from "./balance-power-score"
import {
  POLICY_ARCHETYPE_PRIORITIES,
  SIMULATION_SCORING_WEIGHTS,
  type AppHarness,
  type ArchetypeLaneMetrics,
  type BuildPolicyDefinition,
  type RunArchetypeSimulationPlan,
} from "./run-progression-simulator-core"
import { BUILD_SPECS, type BuildSpec } from "./build-spec-validation"

const purgeSpecsByClass: Record<string, BuildSpec> = {}
for (const spec of BUILD_SPECS) {
  if (!purgeSpecsByClass[spec.classId]) {
    purgeSpecsByClass[spec.classId] = spec
  }
}

export function getWeaponEquipment(run: RunState) {
  return run.loadout?.weapon || null
}

export function getArmorEquipment(run: RunState) {
  return run.loadout?.armor || null
}

function getWeaponFamily(harness: AppHarness, run: RunState) {
  const weaponEquipment = getWeaponEquipment(run)
  return harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponEquipment?.itemId || "", harness.content) || ""
}

function getWeaponProfile(harness: AppHarness, run: RunState) {
  return harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(getWeaponEquipment(run), harness.content) || null
}

function getArchetypeCatalogEntry(harness: AppHarness, classId: string, archetypeId: string) {
  return harness.browserWindow.ROUGE_REWARD_ENGINE
    ?.getArchetypeCatalog?.(classId)?.[classId]?.[archetypeId] || null
}

function getCardAlignmentWeight(harness: AppHarness, cardId: string) {
  const rewardRole = harness.browserWindow.ROUGE_REWARD_ENGINE?.getCardRewardRole?.(cardId, harness.content) || "foundation"
  return Number(harness.browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES?.CARD_ROLE_SCORE_WEIGHTS?.[rewardRole] || 1)
}

export function buildArchetypeLaneMetrics(
  harness: AppHarness,
  run: RunState,
  targetArchetypeId: string
): ArchetypeLaneMetrics | null {
  if (!targetArchetypeId) {
    return null
  }

  const rewardEngine = harness.browserWindow.ROUGE_REWARD_ENGINE
  const targetEntry = getArchetypeCatalogEntry(harness, run.classId, targetArchetypeId)
  if (!rewardEngine || !targetEntry) {
    return null
  }

  let alignedCardWeight = 0
  let totalCardWeight = 0
  let offLaneCardCount = 0

  ;(Array.isArray(run.deck) ? run.deck : []).forEach((cardId) => {
    const tags = rewardEngine.getCardArchetypeTags?.(cardId, harness.content) || []
    const weight = getCardAlignmentWeight(harness, cardId)
    totalCardWeight += weight
    if (Array.isArray(tags) && tags.includes(targetArchetypeId)) {
      alignedCardWeight += weight
      return
    }
    offLaneCardCount += 1
  })

  const weaponFamily = getWeaponFamily(harness, run)
  const alignedWeapon = !weaponFamily
    ? false
    : targetEntry.weaponFamilies.length === 0 || targetEntry.weaponFamilies.includes(weaponFamily)
  const weaponAlignment = !weaponFamily ? 0.5 : alignedWeapon ? 1 : 0

  const scoreEntries = rewardEngine.getArchetypeScoreEntries?.(run, harness.content) || []
  const totalScore = scoreEntries.reduce((sum, entry) => sum + Number(entry.score || 0), 0)
  const targetScore = Number(scoreEntries.find((entry) => entry.archetypeId === targetArchetypeId)?.score || 0)
  const scoreAlignment = totalScore > 0 ? Math.min(1, targetScore / totalScore) : 0
  const deckAlignment = totalCardWeight > 0 ? alignedCardWeight / totalCardWeight : 0
  const laneIntegrity = Math.max(
    0,
    Math.min(1, deckAlignment * 0.65 + weaponAlignment * 0.25 + Math.min(1, scoreAlignment * 1.5) * 0.1)
  )

  return {
    targetArchetypeId,
    targetArchetypeLabel: String(targetEntry.label || targetArchetypeId),
    deckAlignment,
    weaponAlignment,
    scoreAlignment,
    laneIntegrity,
    offLaneCardCount,
    offLaneCardWeight: Math.max(0, totalCardWeight - alignedCardWeight),
    alignedWeapon,
  }
}

function getLoadoutItemTier(harness: AppHarness, equipment: RunEquipmentState | null | undefined) {
  if (!equipment?.itemId) {
    return 0
  }
  return Number(harness.content.itemCatalog?.[equipment.itemId]?.progressionTier || 0)
}

function getLoadoutTierScore(harness: AppHarness, run: RunState) {
  const weaponTier = getLoadoutItemTier(harness, run.loadout?.weapon || null)
  const armorTier = getLoadoutItemTier(harness, run.loadout?.armor || null)
  const helmTier = getLoadoutItemTier(harness, run.loadout?.helm || null)
  const shieldTier = getLoadoutItemTier(harness, run.loadout?.shield || null)
  const preferredWeaponFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  const weaponFamily = getWeaponFamily(harness, run)
  const preferredWeaponTierWeight =
    preferredWeaponFamilies.length === 0 || preferredWeaponFamilies.includes(weaponFamily)
      ? 26
      : 10
  return weaponTier * preferredWeaponTierWeight + armorTier * 14 + helmTier * 6 + shieldTier * 6
}

function getEquipmentRarityScore(rarity: string | undefined) {
  switch (String(rarity || "").toLowerCase()) {
    case "brown":
      return 4
    case "yellow":
      return 3
    case "blue":
      return 2
    default:
      return 1
  }
}

function getCarriedEntryScore(harness: AppHarness, entry: InventoryEntry) {
  if (entry.kind === "equipment") {
    const item = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, entry.equipment.itemId)
    const tier = Number(item?.progressionTier || 0)
    return tier * 10 + getEquipmentRarityScore(entry.equipment.rarity)
  }
  const rune = harness.browserWindow.ROUGE_ITEM_CATALOG.getRuneDefinition(harness.content, entry.runeId)
  const tier = Number(rune?.progressionTier || 0)
  return 100 + tier * 10
}

export function discardLowestValueCarriedEntry(harness: AppHarness, run: RunState) {
  const carried = Array.isArray(run.inventory?.carried) ? run.inventory.carried : []
  if (carried.length === 0) {
    return false
  }
  let lowestIndex = 0
  let lowestScore = getCarriedEntryScore(harness, carried[0])
  for (let index = 1; index < carried.length; index += 1) {
    const score = getCarriedEntryScore(harness, carried[index])
    if (score < lowestScore) {
      lowestScore = score
      lowestIndex = index
    }
  }
  carried.splice(lowestIndex, 1)
  return true
}

function getMatchingWeaponProficienciesForRun(
  harness: AppHarness,
  run: RunState,
  weaponProfile?: WeaponCombatProfile | null
) {
  return getMatchingProficienciesForWeapon(
    getWeaponFamily(harness, run),
    weaponProfile ?? getWeaponProfile(harness, run)
  )
}

export function getMatchingWeaponProficienciesForCombatState(state: CombatState) {
  return getMatchingProficienciesForWeapon(state.weaponFamily || "", state.weaponProfile || undefined)
}

function hasPreferredWeaponFamily(harness: AppHarness, run: RunState) {
  const preferred = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  return preferred.includes(getWeaponFamily(harness, run))
}

function getWeaponProficiencyWeight(proficiencyCounts: Record<string, number>, proficiency?: string) {
  if (!proficiency) {
    return 1
  }
  const cardCount = Number(proficiencyCounts[proficiency] || 0)
  if (cardCount <= 0) {
    return 0.1
  }
  return 1 + Math.min(0.45, cardCount * 0.08)
}

function scoreWeaponProfileForDeck(profile: WeaponCombatProfile | undefined, proficiencyCounts: Record<string, number>) {
  if (!profile) {
    return 0
  }
  const attackScore = Object.entries(profile.attackDamageByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 2.6 * getWeaponProficiencyWeight(proficiencyCounts, proficiency)
  }, 0)
  const supportScore = Object.entries(profile.supportValueByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 1.3 * getWeaponProficiencyWeight(proficiencyCounts, proficiency)
  }, 0)
  const typedDamageScore = (profile.typedDamage || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 2.4 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency)
  }, 0)
  const effectScore = (profile.effects || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 1.7 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency)
  }, 0)
  return attackScore + supportScore + typedDamageScore + effectScore
}

function scoreArmorProfile(profile: ArmorMitigationProfile | undefined) {
  if (!profile) {
    return 0
  }
  const resistanceScore = (profile.resistances || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.85
  const immunityScore = (profile.immunities || []).length * 12
  return resistanceScore + immunityScore
}

function normalizeScoringCardId(cardId: string) {
  return String(cardId || "").replace(/_plus$/, "")
}

function getScoringCardDefinition(harness: AppHarness, cardId: string) {
  return harness.content.cardCatalog?.[cardId] || harness.content.cardCatalog?.[normalizeScoringCardId(cardId)] || null
}

function getScoringCardTree(harness: AppHarness, cardId: string) {
  return String(harness.browserWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree?.(normalizeScoringCardId(cardId)) || "")
}

function buildEvolutionReverseMapForScoring(harness: AppHarness) {
  const chains = harness.browserWindow.__ROUGE_SKILL_EVOLUTION?.EVOLUTION_CHAINS || {}
  return Object.entries(chains).reduce((map, [sourceId, entry]) => {
    const targetId = normalizeScoringCardId(String((entry as { targetId?: string } | null)?.targetId || ""))
    if (targetId) {
      map[targetId] = normalizeScoringCardId(sourceId)
    }
    return map
  }, {} as Record<string, string>)
}

function buildEvolutionForwardMapForScoring(harness: AppHarness) {
  const chains = harness.browserWindow.__ROUGE_SKILL_EVOLUTION?.EVOLUTION_CHAINS || {}
  return Object.entries(chains).reduce((map, [sourceId, entry]) => {
    const sourceBaseId = normalizeScoringCardId(sourceId)
    const targetBaseId = normalizeScoringCardId(String((entry as { targetId?: string } | null)?.targetId || ""))
    if (sourceBaseId && targetBaseId) {
      map[sourceBaseId] = targetBaseId
    }
    return map
  }, {} as Record<string, string>)
}

function getEvolutionRootCardIdForScoring(cardId: string, reverseMap: Record<string, string>) {
  let current = normalizeScoringCardId(cardId)
  const seen = new Set<string>()
  while (reverseMap[current] && !seen.has(current)) {
    seen.add(current)
    current = normalizeScoringCardId(reverseMap[current])
  }
  return current
}

function getStarterShellTargetByAct(actNumber: number) {
  if (actNumber <= 1) {
    return 10
  }
  if (actNumber === 2) {
    return 8
  }
  if (actNumber === 3) {
    return 6
  }
  if (actNumber === 4) {
    return 4
  }
  return 3
}

function getReinforcementTargetByAct(actNumber: number) {
  if (actNumber <= 1) {
    return 1
  }
  if (actNumber === 2) {
    return 3
  }
  if (actNumber === 3) {
    return 5
  }
  if (actNumber === 4) {
    return 6
  }
  return 7
}

function getSupportSplashCapByStage(stage: string) {
  return stage === "primary" || stage === "mastery" ? 3 : 4
}

function getOffTreeUtilityCapByStage(stage: string) {
  return stage === "primary" || stage === "mastery" ? 2 : 3
}

type DeckConstructionState = {
  buildPath: ReturnType<NonNullable<AppHarness["browserWindow"]["__ROUGE_REWARD_ENGINE_ARCHETYPES"]>["getRewardPathPreference"]> | null
  specialization: ReturnType<NonNullable<AppHarness["browserWindow"]["__ROUGE_REWARD_ENGINE_ARCHETYPES"]>["getSpecializationSnapshot"]> | null
  roleCounts: Record<CardRoleTag, number>
  starterCountsByCardId: Record<string, number>
  duplicateCounts: Record<string, number>
  unchangedStarterCount: number
  refinedCount: number
  evolvedCount: number
  primaryTreeCardCount: number
  supportTreeCardCount: number
}

function buildDeckConstructionState(harness: AppHarness, run: RunState): DeckConstructionState {
  const archetypes = harness.browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES
  const buildPath = archetypes?.getRewardPathPreference?.(run, harness.content) || null
  const specialization = archetypes?.getSpecializationSnapshot?.(run, harness.content) || null
  const reverseEvolutionMap = buildEvolutionReverseMapForScoring(harness)
  const starterDeck = harness.classRegistry.getStarterDeckForClass(harness.content, run.classId) || []
  const starterBaseIds = new Set(starterDeck.map((cardId) => normalizeScoringCardId(cardId)))

  const roleCounts: Record<CardRoleTag, number> = {
    answer: 0,
    setup: 0,
    payoff: 0,
    salvage: 0,
    conversion: 0,
    support: 0,
  }
  const starterCountsByCardId: Record<string, number> = {}
  const duplicateCounts: Record<string, number> = {}
  let unchangedStarterCount = 0
  let refinedCount = 0
  let evolvedCount = 0
  let primaryTreeCardCount = 0
  let supportTreeCardCount = 0

  ;(Array.isArray(run.deck) ? run.deck : []).forEach((cardId) => {
    const card = getScoringCardDefinition(harness, cardId)
    const baseCardId = normalizeScoringCardId(cardId)
    const rootCardId = getEvolutionRootCardIdForScoring(cardId, reverseEvolutionMap)
    const treeId = getScoringCardTree(harness, cardId)
    const roleTag = ((card?.roleTag as CardRoleTag | undefined) || "answer")
    const refined = String(cardId || "").endsWith("_plus")
    const evolved = rootCardId !== baseCardId

    duplicateCounts[baseCardId] = Number(duplicateCounts[baseCardId] || 0) + 1
    roleCounts[roleTag] = Number(roleCounts[roleTag] || 0) + 1

    if (starterBaseIds.has(baseCardId) && !refined && rootCardId === baseCardId) {
      unchangedStarterCount += 1
      starterCountsByCardId[baseCardId] = Number(starterCountsByCardId[baseCardId] || 0) + 1
    }
    if (refined) {
      refinedCount += 1
    }
    if (evolved) {
      evolvedCount += 1
    }
    if (buildPath?.primaryTrees?.includes(treeId)) {
      primaryTreeCardCount += 1
    }
    if (buildPath?.supportTrees?.includes(treeId)) {
      supportTreeCardCount += 1
    }
  })

  return {
    buildPath,
    specialization,
    roleCounts,
    starterCountsByCardId,
    duplicateCounts,
    unchangedStarterCount,
    refinedCount,
    evolvedCount,
    primaryTreeCardCount,
    supportTreeCardCount,
  }
}

function scoreDeckConstructionState(harness: AppHarness, run: RunState, policy: BuildPolicyDefinition) {
  const deckState = buildDeckConstructionState(harness, run)
  const starterShellTarget = getStarterShellTargetByAct(Number(run.actNumber || 1))
  const reinforcementTarget = getReinforcementTargetByAct(Number(run.actNumber || 1))
  const reinforcedCount = deckState.refinedCount + deckState.evolvedCount
  const specializationStage = String(deckState.specialization?.specializationStage || "exploratory")
  const offTreeDamageCount = Number(deckState.specialization?.offTreeDamageCount || 0)
  const offTreeUtilityCount = Number(deckState.specialization?.offTreeUtilityCount || 0)
  const supportSplashCap = getSupportSplashCapByStage(specializationStage)
  const offTreeUtilityCap = getOffTreeUtilityCapByStage(specializationStage)
  const primaryRatio = run.deck.length > 0 ? deckState.primaryTreeCardCount / run.deck.length : 0
  const policyStarterPenaltyMultiplier = policy.id === "aggressive" ? 1.2 : policy.id === "balanced" ? 1.0 : 0.9

  let total = 0

  if (deckState.unchangedStarterCount <= starterShellTarget) {
    total += 20
  } else {
    total -= (deckState.unchangedStarterCount - starterShellTarget) * 13 * policyStarterPenaltyMultiplier
  }

  if (reinforcedCount >= reinforcementTarget) {
    total += 34 + Math.min(4, reinforcedCount - reinforcementTarget) * 6
  } else {
    total -= (reinforcementTarget - reinforcedCount) * 18
  }

  total += Math.min(4, deckState.refinedCount) * 10
  total += Math.min(4, deckState.evolvedCount) * 14
  total += Math.min(0.75, primaryRatio) * 70
  total += Math.min(1, deckState.supportTreeCardCount) * 6
  total += Math.min(1, offTreeUtilityCount) * 10
  if (deckState.supportTreeCardCount > supportSplashCap) {
    total -= (deckState.supportTreeCardCount - supportSplashCap) * (specializationStage === "primary" || specializationStage === "mastery" ? 18 : 12)
  }
  if (offTreeUtilityCount > offTreeUtilityCap) {
    total -= (offTreeUtilityCount - offTreeUtilityCap) * (specializationStage === "primary" || specializationStage === "mastery" ? 22 : 14)
  }
  total -= offTreeDamageCount * (specializationStage === "primary" || specializationStage === "mastery" ? 16 : 9)

  if (deckState.roleCounts.salvage >= 1) {
    total += 10
  }
  if (deckState.roleCounts.answer >= 1) {
    total += 10
  }
  if (deckState.roleCounts.setup >= 1 && deckState.roleCounts.payoff >= 1) {
    total += 12
  }
  if (run.deck.length > 18) {
    const excessCards = run.deck.length - 18
    // Quadratic scaling: each additional card over 18 is progressively worse
    total -= excessCards * (4.0 + excessCards * 0.8)
  }

  return total
}

function getArchetypeRunewordAdjustment(
  archetypeId: string,
  slot: "weapon" | "armor",
  runewordId: string
) {
  if (!archetypeId || !runewordId) {
    return 1
  }

  if (archetypeId === "barbarian_combat_masteries") {
    if (slot === "weapon" && runewordId === "black") {
      return 0.45
    }
    if (slot === "armor" && runewordId === "stealth") {
      return 1.2
    }
  }

  return 1
}

function scoreRunewordProgress(
  harness: AppHarness,
  run: RunState,
  archetypePlan?: RunArchetypeSimulationPlan | null
) {
  const itemCatalog = harness.browserWindow.ROUGE_ITEM_CATALOG
  const loadout = itemCatalog.buildHydratedLoadout(run, harness.content)
  const targetArchetypeId =
    archetypePlan?.targetArchetypeId ||
    String(run.progression?.classProgression?.favoredTreeId || "")

  function getRunewordPower(runeword: RuntimeRunewordDefinition | null) {
    if (!runeword) {
      return 0
    }
    return Object.values(runeword.bonuses || {}).reduce((sum, value) => {
      return sum + Math.max(0, Number(value || 0))
    }, 0)
  }

  return (["weapon", "armor"] as const).reduce((total, slot) => {
    const equipment = loadout[slot]
    if (!equipment) {
      return total
    }

    const targetRuneword = itemCatalog.getPreferredRunewordForEquipment(equipment, run, harness.content)
    if (!targetRuneword) {
      return total
    }

    const currentRuneword = itemCatalog.getRunewordDefinition(harness.content, equipment.runewordId || "")
    const currentPower = getRunewordPower(currentRuneword)
    const runewordAdjustment = getArchetypeRunewordAdjustment(targetArchetypeId, slot, targetRuneword.id)
    const targetPower = getRunewordPower(targetRuneword) * runewordAdjustment
    const targetSocketCount = Math.max(1, Number(targetRuneword.socketCount || 0))
    const insertedRunes = Array.isArray(equipment.insertedRunes) ? equipment.insertedRunes : []
    const prefixLength = insertedRunes.reduce((count: number, runeId: string, index: number) => {
      return count === index && targetRuneword.requiredRunes[index] === runeId ? count + 1 : count
    }, 0)
    const socketProgress = Math.min(targetSocketCount, Number(equipment.socketsUnlocked || 0)) / targetSocketCount
    const runeProgress = prefixLength / Math.max(1, targetRuneword.requiredRunes.length)
    const upgradeGap = Math.max(0, targetPower - currentPower)
    const isTargetComplete =
      equipment.runewordId === targetRuneword.id &&
      Number(equipment.socketsUnlocked || 0) >= targetSocketCount &&
      insertedRunes.length >= targetRuneword.requiredRunes.length

    if (isTargetComplete) {
      return total + targetPower * 5.5
    }

    return total + targetPower * (1.2 + socketProgress + runeProgress) + upgradeGap * 3.5
  }, 0)
}

function scoreArchetypePlan(
  harness: AppHarness,
  run: RunState,
  policy: BuildPolicyDefinition,
  archetypePlan?: RunArchetypeSimulationPlan | null
) {
  const rewardEngine = harness.browserWindow.ROUGE_REWARD_ENGINE
  const entries = rewardEngine?.getArchetypeScoreEntries?.(run, harness.content) || []
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0
  }

  const primary = entries[0] || null
  const secondary = entries[1] || null
  const preferred = archetypePlan?.targetArchetypeId
    ? (POLICY_ARCHETYPE_PRIORITIES[policy.id]?.[run.classId] || [])
    : []
  const preferredEntries = entries.filter((entry) => preferred.includes(entry.archetypeId))
  const bestPreferredScore = Number(preferredEntries[0]?.score || 0)
  const commitmentScore = Math.max(0, Number(primary?.score || 0) - Number(secondary?.score || 0))
  const specializationStage = String(run.progression?.classProgression?.specializationStage || "exploratory")
  const earlyNaturalExploration =
    !archetypePlan?.targetArchetypeId &&
    specializationStage === "exploratory" &&
    Number(run.actNumber || 1) <= 1

  let total =
    Number(primary?.score || 0) * (earlyNaturalExploration ? 0.1 : 0.2) +
    commitmentScore * (earlyNaturalExploration ? 0.08 : 0.35)

  if (preferred.length > 0 && !earlyNaturalExploration) {
    total += bestPreferredScore * 0.45
    if (primary && preferred.includes(primary.archetypeId)) {
      total += preferred[0] === primary.archetypeId ? 18 : 10
    } else if (primary) {
      total -= 12
    }
    if (secondary && preferred.includes(secondary.archetypeId)) {
      total += 6
    }
  }

  if (archetypePlan?.targetArchetypeId) {
    const targetScore = Number(entries.find((entry) => entry.archetypeId === archetypePlan.targetArchetypeId)?.score || 0)
    const laneMetrics = buildArchetypeLaneMetrics(harness, run, archetypePlan.targetArchetypeId)
    total += targetScore * (archetypePlan.commitmentLocked ? 2.35 : 1.1)
    if (laneMetrics) {
      total += laneMetrics.laneIntegrity * (archetypePlan.commitmentLocked ? 320 : 145)
      total -= laneMetrics.offLaneCardWeight * (archetypePlan.commitmentLocked ? 1.05 : 0.35)
      if (!laneMetrics.alignedWeapon) {
        total -= archetypePlan.commitmentLocked ? 96 : 22
      } else {
        total += archetypePlan.commitmentLocked ? 34 : 10
      }
    }
    if (primary?.archetypeId === archetypePlan.targetArchetypeId) {
      total += archetypePlan.commitmentLocked ? 118 : 34
    } else if (archetypePlan.commitmentLocked) {
      total -= 110
    }
  }

  return total
}

export function scoreCard(card: CardDefinition | null | undefined, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  if (!card) {
    return Number.NEGATIVE_INFINITY
  }
  const effectScore = (card.effects || []).reduce((sum, effect) => {
    const multiplier = policy.cardEffectMultipliers[effect.kind] || 1
    let effectMagnitude = Number(effect.value || 0)
    if (effect.kind === "summon_minion") {
      effectMagnitude += Number(effect.secondaryValue || 0) * 0.8
    }
    return sum + SIMULATION_SCORING_WEIGHTS.cardEffectBase[effect.kind] * effectMagnitude * multiplier
  }, 0)
  const tierBonus = Number(card.tier || 1) * 2.5
  const neutralTargetBonus = card.target === "none" ? 1 : 0
  const proficiencyBonus = card.proficiency && matchingProficiencies.has(card.proficiency) ? policy.matchingProficiencyWeight : 0
  return effectScore + tierBonus + neutralTargetBonus + proficiencyBonus - card.cost * 2.4
}

export function buildDeckStats(harness: AppHarness, run: RunState, policy: BuildPolicyDefinition) {
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForRun(harness, run))
  const preferredFamilyMatch = hasPreferredWeaponFamily(harness, run)
  const scores = run.deck
    .map((cardId) => scoreCard(harness.content.cardCatalog[cardId], policy, matchingProficiencies))
    .filter((score) => Number.isFinite(score))
    .sort((left, right) => right - left)
  const topCards = scores.slice(0, 10)
  const restCards = scores.slice(10)
  const deckScore =
    topCards.reduce((sum, score) => sum + score, 0) * policy.deckTopWeight +
    restCards.reduce((sum, score) => sum + score, 0) * policy.deckRestWeight -
    Math.max(0, run.deck.length - 16) * policy.deckBloatPenalty * (1 + Math.max(0, run.deck.length - 20) * 0.15)

  const proficiencyCounts = run.deck.reduce((counts, cardId) => {
    const proficiency = harness.content.cardCatalog[cardId]?.proficiency || "neutral"
    counts[proficiency] = (counts[proficiency] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const matchingProficiencyCount = [...matchingProficiencies].reduce((sum, proficiency) => {
    return sum + Number(proficiencyCounts[proficiency] || 0)
  }, 0)
  return {
    deckScore,
    matchingProficiencyCount,
    preferredFamilyMatch,
    topCards: run.deck
      .slice()
      .sort((leftId, rightId) => {
        return scoreCard(harness.content.cardCatalog[rightId], policy, matchingProficiencies) -
          scoreCard(harness.content.cardCatalog[leftId], policy, matchingProficiencies)
      })
      .slice(0, 5)
      .map((cardId) => harness.content.cardCatalog[cardId]?.title || cardId),
    proficiencyCounts,
  }
}

export function createScoringRun(harness: AppHarness, run: RunState, assumeFullResources: boolean) {
  const clone = cloneAndHydrateRun(harness, run)
  if (assumeFullResources) {
    const bonuses = harness.runFactory.buildCombatBonuses(clone, harness.content, null)
    clone.hero.currentLife = clone.hero.maxLife + Number(bonuses.heroMaxLife || 0)
    clone.mercenary.currentLife = clone.mercenary.maxLife + Number(bonuses.mercenaryMaxLife || 0)
    clone.belt.current = clone.belt.max
  }
  return clone
}

function computeRunScoreFromParts(
  harness: AppHarness,
  scoringRun: RunState,
  policy: BuildPolicyDefinition,
  overrides: ReturnType<AppHarness["runFactory"]["createCombatOverrides"]>,
  deckStats: ReturnType<typeof buildDeckStats>,
  weaponProfile: ReturnType<typeof getWeaponProfile>,
  armorProfile: ReturnType<AppHarness["itemSystem"]["buildCombatMitigationProfile"]>,
  archetypePlan: RunArchetypeSimulationPlan | null
) {
  return (
    scoringRun.level * 6 +
    overrides.heroState.maxLife * policy.heroLifeWeight +
    overrides.heroState.maxEnergy * policy.heroEnergyWeight +
    Math.max(0, Number(overrides.heroState.handSize || 5) - 5) * 8 +
    Number(overrides.heroState.damageBonus || 0) * policy.heroDamageWeight +
    Number(overrides.heroState.guardBonus || 0) * policy.heroGuardWeight +
    Number(overrides.heroState.burnBonus || 0) * policy.heroBurnWeight +
    overrides.heroState.potionHeal * policy.heroPotionWeight +
    overrides.mercenaryState.maxLife * policy.mercenaryLifeWeight +
    overrides.mercenaryState.attack * policy.mercenaryAttackWeight +
    scoringRun.gold * policy.goldWeight +
    scoringRun.belt.current * policy.potionChargeWeight +
    scoringRun.hero.currentLife * policy.currentLifeWeight +
    Math.max(0, scoringRun.mercenary.currentLife) * policy.currentMercLifeWeight +
    deckStats.deckScore +
    deckStats.matchingProficiencyCount * policy.matchingProficiencyWeight +
    (deckStats.preferredFamilyMatch ? 24 : 0) +
    getLoadoutTierScore(harness, scoringRun) +
    scoreWeaponProfileForDeck(weaponProfile || undefined, deckStats.proficiencyCounts) * policy.weaponWeight +
    scoreArmorProfile(armorProfile || undefined) * policy.armorWeight +
    scoreRunewordProgress(harness, scoringRun, archetypePlan) +
    scoreDeckConstructionState(harness, scoringRun, policy) +
    scoreArchetypePlan(harness, scoringRun, policy, archetypePlan) +
    Number(scoringRun.progression?.skillPointsAvailable || 0) * policy.bankedSkillPointWeight +
    Number(scoringRun.progression?.classPointsAvailable || 0) * policy.bankedClassPointWeight +
    Number(scoringRun.progression?.attributePointsAvailable || 0) * policy.bankedAttributePointWeight
  )
}

export function evaluateRunScore(
  harness: AppHarness,
  run: RunState,
  policy: BuildPolicyDefinition,
  options: { assumeFullResources: boolean; archetypePlan?: RunArchetypeSimulationPlan | null }
) {
  const scoringRun = createScoringRun(harness, run, options.assumeFullResources)
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, null)
  const weaponProfile = getWeaponProfile(harness, scoringRun)
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content) || null
  const deckStats = buildDeckStats(harness, scoringRun, policy)
  return computeRunScoreFromParts(harness, scoringRun, policy, overrides, deckStats, weaponProfile, armorProfile, options.archetypePlan || null)
}

export function cloneRun(harness: AppHarness, run: RunState) {
  return cloneAndHydrateRun(harness, run)
}

function shallowCloneRun(harness: AppHarness, run: RunState): RunState {
  const clone = Object.assign({}, run) as RunState
  // Deep-copy only the fields that town actions mutate
  clone.deck = [...run.deck]
  clone.hero = { ...run.hero }
  clone.mercenary = { ...run.mercenary }
  clone.belt = { ...run.belt }
  clone.inventory = run.inventory
    ? JSON.parse(JSON.stringify(run.inventory)) as RunInventoryState
    : run.inventory
  clone.loadout = {
    weapon: run.loadout.weapon ? { ...run.loadout.weapon } : null,
    armor: run.loadout.armor ? { ...run.loadout.armor } : null,
    helm: run.loadout.helm ? { ...run.loadout.helm } : null,
    shield: run.loadout.shield ? { ...run.loadout.shield } : null,
    gloves: run.loadout.gloves ? { ...run.loadout.gloves } : null,
    boots: run.loadout.boots ? { ...run.loadout.boots } : null,
    belt: run.loadout.belt ? { ...run.loadout.belt } : null,
    ring1: run.loadout.ring1 ? { ...run.loadout.ring1 } : null,
    ring2: run.loadout.ring2 ? { ...run.loadout.ring2 } : null,
    amulet: run.loadout.amulet ? { ...run.loadout.amulet } : null,
  }
  clone.progression = run.progression ? { ...run.progression, classProgression: { ...run.progression.classProgression, treeRanks: { ...run.progression.classProgression.treeRanks }, unlockedSkillIds: [...run.progression.classProgression.unlockedSkillIds], equippedSkillBar: { ...run.progression.classProgression.equippedSkillBar } } } : run.progression
  clone.town = run.town ? { ...run.town } : run.town
  clone.summary = run.summary ? { ...run.summary } : run.summary
  // Acts, zones, world state: shared references (town actions don't modify these)
  // Skip hydrateRun — callers that need hydration (applyAction) do their own
  return clone
}

function cloneAndHydrateRun(harness: AppHarness, run: RunState): RunState {
  return harness.runFactory.hydrateRun(shallowCloneRun(harness, run), harness.content)
}

function isOptimizableTownAction(action: TownAction) {
  const actionId = action.id || ""
  if (action.disabled) {
    return false
  }
  if (actionId.startsWith("progression_")) {
    return true
  }
  if (
    actionId === "healer_restore_party" ||
    actionId === "quartermaster_refill_belt"
  ) {
    return true
  }
  if (
    actionId.startsWith("mercenary_contract_") ||
    actionId.startsWith("vendor_buy_") ||
    actionId.startsWith("inventory_equip_") ||
    actionId.startsWith("inventory_socket_") ||
    actionId.startsWith("inventory_commission_") ||
    actionId.startsWith("blacksmith_evolve_") ||
    actionId.startsWith("blacksmith_refine_") ||
    actionId.startsWith("sage_purge_")
  ) {
    return true
  }
  return false
}

function isReinforcementAction(actionId: string) {
  return actionId.startsWith("blacksmith_evolve_") || actionId.startsWith("blacksmith_refine_")
}

function isCleanupAction(actionId: string) {
  return actionId.startsWith("sage_purge_")
}

function scoreTownActionStrategicBias(
  harness: AppHarness,
  beforeRun: RunState,
  afterRun: RunState,
  actionId: string,
  policy?: BuildPolicyDefinition
) {
  const beforeDeck = buildDeckConstructionState(harness, beforeRun)
  const afterDeck = buildDeckConstructionState(harness, afterRun)
  const reverseEvolutionMap = buildEvolutionReverseMapForScoring(harness)
  const forwardEvolutionMap = buildEvolutionForwardMapForScoring(harness)
  const reinforcementTarget = getReinforcementTargetByAct(Number(beforeRun.actNumber || 1))
  const beforeReinforcementDeficit = Math.max(0, reinforcementTarget - (beforeDeck.refinedCount + beforeDeck.evolvedCount))
  const afterReinforcementDeficit = Math.max(0, reinforcementTarget - (afterDeck.refinedCount + afterDeck.evolvedCount))
  const specializationStage = String(beforeDeck.specialization?.specializationStage || "exploratory")
  const supportSplashCap = getSupportSplashCapByStage(specializationStage)
  const offTreeUtilityCap = getOffTreeUtilityCapByStage(specializationStage)
  let total = 0

  total += Math.max(0, beforeDeck.unchangedStarterCount - afterDeck.unchangedStarterCount) * 12
  total += Math.max(0, beforeReinforcementDeficit - afterReinforcementDeficit) * 28
  total += Math.max(0, afterDeck.refinedCount - beforeDeck.refinedCount) * 24
  total += Math.max(0, afterDeck.evolvedCount - beforeDeck.evolvedCount) * 32
  total += Math.max(0, Number(beforeDeck.specialization?.offTreeDamageCount || 0) - Number(afterDeck.specialization?.offTreeDamageCount || 0)) * 18
  const offTreeUtilityGain = Math.max(0, Number(afterDeck.specialization?.offTreeUtilityCount || 0) - Number(beforeDeck.specialization?.offTreeUtilityCount || 0))
  if (Number(beforeDeck.specialization?.offTreeUtilityCount || 0) < offTreeUtilityCap) {
    total += Math.min(offTreeUtilityGain, Math.max(0, offTreeUtilityCap - Number(beforeDeck.specialization?.offTreeUtilityCount || 0))) * 8
  } else if (offTreeUtilityGain > 0) {
    total -= offTreeUtilityGain * (specializationStage === "primary" || specializationStage === "mastery" ? 20 : 12)
  }
  const supportTreeGain = Math.max(0, afterDeck.supportTreeCardCount - beforeDeck.supportTreeCardCount)
  if (beforeDeck.supportTreeCardCount < supportSplashCap) {
    total += Math.min(supportTreeGain, Math.max(0, supportSplashCap - beforeDeck.supportTreeCardCount)) * 5
  } else if (supportTreeGain > 0) {
    total -= supportTreeGain * (specializationStage === "primary" || specializationStage === "mastery" ? 24 : 16)
  }
  total += Math.max(0, beforeRun.deck.length - afterRun.deck.length) * 3

  if (actionId.startsWith("sage_purge_")) {
    const cardId = actionId.replace("sage_purge_", "")
    const baseCardId = normalizeScoringCardId(cardId)
    const card = getScoringCardDefinition(harness, cardId)
    const roleTag = ((card?.roleTag as CardRoleTag | undefined) || "answer")
    const treeId = getScoringCardTree(harness, cardId)
    const duplicateCount = Number(beforeDeck.duplicateCounts[baseCardId] || 0)
    const unchangedStarterCopies = Number(beforeDeck.starterCountsByCardId[baseCardId] || 0)
    const onPrimary = Boolean(beforeDeck.buildPath?.primaryTrees?.includes(treeId))
    const onSupport = Boolean(beforeDeck.buildPath?.supportTrees?.includes(treeId))
    const reinforced = String(cardId || "").endsWith("_plus") || getEvolutionRootCardIdForScoring(cardId, reverseEvolutionMap) !== baseCardId

    if (beforeReinforcementDeficit > 0) {
      total -= 10 + beforeReinforcementDeficit * 3
    }
    // Build-spec-driven purge bias: strongly favor purging unwanted cards, protect core
    const purgeSpec = purgeSpecsByClass[beforeRun.classId]
    const purgeIsUnwanted = purgeSpec && new Set(purgeSpec.unwantedCards).has(baseCardId)
    const purgeIsCore = purgeSpec && new Set(purgeSpec.coreCards).has(baseCardId)

    // Reduce Act 1 purge penalty when purging spec-unwanted cards
    if (Number(beforeRun.actNumber || 1) <= 1) {
      total -= purgeIsUnwanted ? 0 : 8
    }
    // Bonus for purging when deck is bloated (over 20 cards)
    if (beforeRun.deck.length > 20) {
      total += (beforeRun.deck.length - 20) * 4
    }
    if (beforeRun.deck.length > 26) {
      total += (beforeRun.deck.length - 26) * 6
    }

    if (purgeSpec) {
      const flexSet = new Set(purgeSpec.flexCards)
      if (purgeIsCore || new Set(purgeSpec.coreCards).has(cardId)) {
        total -= 200  // Never purge core synergy cards
      } else if (purgeIsUnwanted || new Set(purgeSpec.unwantedCards).has(cardId)) {
        total += 80   // Strongly encourage purging unwanted cards
      } else if (!flexSet.has(baseCardId) && !flexSet.has(cardId)) {
        total += 30   // Encourage purging cards not in the build spec at all
      }
    }

    if (unchangedStarterCopies > 0) {
      total += beforeReinforcementDeficit > 0 ? 4 : 10
    }
    if (duplicateCount >= 3) {
      total += 8
    }
    if (!onPrimary && !onSupport && specializationStage !== "exploratory") {
      total += 10
      if (roleTag === "payoff" || roleTag === "setup") {
        total += 14
      }
    }
    if (reinforced) {
      total -= 26
    }
    if (roleTag === "salvage" && duplicateCount <= 1) {
      total -= 14
    }
    if (roleTag === "answer" && duplicateCount <= 1) {
      total -= 8
    }
    if (onPrimary && roleTag === "payoff") {
      total -= 18
      if (beforeReinforcementDeficit <= 0 && Number(beforeRun.actNumber || 1) >= 4 && duplicateCount >= 4) {
        total += 34 + (duplicateCount - 3) * 18
      }
    } else if (onPrimary && roleTag === "setup") {
      total -= 10
      if (beforeReinforcementDeficit <= 0 && Number(beforeRun.actNumber || 1) >= 4 && duplicateCount >= 6) {
        total += 8 + (duplicateCount - 5) * 8
      }
    } else if (onPrimary && roleTag === "answer") {
      total -= 8
      if (beforeReinforcementDeficit <= 0 && Number(beforeRun.actNumber || 1) >= 4 && duplicateCount >= 5) {
        total += 24 + (duplicateCount - 4) * 14
      }
    } else if (onPrimary && roleTag === "support") {
      total -= 6
      if (beforeReinforcementDeficit <= 0 && Number(beforeRun.actNumber || 1) >= 4 && duplicateCount >= 5) {
        total += 22 + (duplicateCount - 4) * 14
      }
    } else if (onSupport && (roleTag === "support" || roleTag === "salvage")) {
      total -= 6
      if (beforeDeck.supportTreeCardCount >= supportSplashCap && duplicateCount >= 2) {
        total += 20 + (duplicateCount - 1) * 8
      }
    }
  }

  if (actionId.startsWith("blacksmith_refine_") || actionId.startsWith("blacksmith_evolve_")) {
    const cardId = actionId.replace("blacksmith_refine_", "").replace("blacksmith_evolve_", "")
    const card = getScoringCardDefinition(harness, cardId)
    const roleTag = ((card?.roleTag as CardRoleTag | undefined) || "answer")
    const treeId = getScoringCardTree(harness, cardId)
    const onPrimary = Boolean(beforeDeck.buildPath?.primaryTrees?.includes(treeId))
    const onSupport = Boolean(beforeDeck.buildPath?.supportTrees?.includes(treeId))

    if (onPrimary) {
      total += actionId.startsWith("blacksmith_evolve_") ? 24 : 18
    } else if (onSupport) {
      total += 12
      if ((roleTag === "support" || roleTag === "salvage") && beforeDeck.supportTreeCardCount >= supportSplashCap) {
        total -= 36 + (beforeDeck.supportTreeCardCount - (supportSplashCap - 1)) * 8
      }
    } else if (specializationStage !== "exploratory") {
      if (roleTag === "payoff" || roleTag === "setup") {
        total -= actionId.startsWith("blacksmith_evolve_") ? 34 : 24
      } else {
        total -= 10
      }
    }
    if (roleTag === "payoff" || roleTag === "setup" || roleTag === "salvage") {
      total += 8
    }
    if (beforeReinforcementDeficit > 0) {
      total += actionId.startsWith("blacksmith_evolve_") ? 16 : 12
    }
    if (actionId.startsWith("blacksmith_evolve_")) {
      const targetBaseCardId = forwardEvolutionMap[normalizeScoringCardId(cardId)] || ""
      const targetDuplicateCount = Number(afterDeck.duplicateCounts[targetBaseCardId] || 0)
      const targetCard = targetBaseCardId ? getScoringCardDefinition(harness, targetBaseCardId) : null
      const targetRoleTag = ((targetCard?.roleTag as CardRoleTag | undefined) || "answer")
      let payoffDuplicateCap = Number(beforeRun.actNumber || 1) >= 4 ? 3 : 2
      if (targetBaseCardId === "sorceress_hydra") {
        payoffDuplicateCap = 2
      }
      if (targetBaseCardId === "sorceress_lightning_mastery") {
        payoffDuplicateCap = beforeDeck.buildPath?.primaryTrees?.includes("lightning") ? 3 : 1
      }
      if (targetBaseCardId === "amazon_pierce") {
        payoffDuplicateCap = beforeDeck.buildPath?.primaryTrees?.includes("passive") ? 3 : 2
      }
      if (targetBaseCardId === "paladin_conviction") {
        payoffDuplicateCap = 2
      }
      if (targetBaseCardId === "assassin_shadow_warrior" && !beforeDeck.buildPath?.primaryTrees?.includes("shadow")) {
        payoffDuplicateCap = 1
      }
      if (targetBaseCardId === "assassin_shadow_warrior" && beforeDeck.buildPath?.primaryTrees?.includes("shadow")) {
        payoffDuplicateCap = 2
      }
      if (targetBaseCardId === "assassin_phoenix_strike" && !beforeDeck.buildPath?.primaryTrees?.includes("martial_arts")) {
        payoffDuplicateCap = 1
      }
      if (targetBaseCardId === "barbarian_berserk") {
        payoffDuplicateCap = 1
      }
      if (targetBaseCardId === "necromancer_revive") {
        payoffDuplicateCap = 1
      }
      if (targetBaseCardId === "druid_fury") {
        payoffDuplicateCap = 2
      }
      if (targetBaseCardId === "druid_armageddon") {
        payoffDuplicateCap = 2
      }
      if (targetBaseCardId === "druid_summon_grizzly") {
        payoffDuplicateCap = 3
      }
      if (targetBaseCardId === "druid_heart_of_wolverine") {
        payoffDuplicateCap = 3
      }
      if (targetBaseCardId === "sorceress_frozen_orb") {
        payoffDuplicateCap = 3
      }
      if (targetRoleTag === "payoff" && targetDuplicateCount > payoffDuplicateCap) {
        total -= (targetDuplicateCount - payoffDuplicateCap) * 48
      } else if (
        (targetBaseCardId === "barbarian_weapon_mastery" ||
          targetBaseCardId === "barbarian_steel_skin" ||
          targetBaseCardId === "barbarian_unyielding") &&
        targetDuplicateCount > 3
      ) {
        total -= (targetDuplicateCount - 3) * 40
      } else if (targetRoleTag === "support" && Number(beforeRun.actNumber || 1) >= 4 && targetDuplicateCount > 4) {
        total -= (targetDuplicateCount - 4) * 36
      } else if (targetRoleTag === "answer" && Number(beforeRun.actNumber || 1) >= 4 && targetDuplicateCount > 4) {
        total -= (targetDuplicateCount - 4) * 32
      } else if (targetDuplicateCount > 4) {
        total -= (targetDuplicateCount - 4) * 18
      }
    }
  }

  // Tree investment bias: concentrate ranks, reward slot unlock gates
  if (actionId.startsWith("progression_tree_")) {
    const treeId = actionId.replace("progression_tree_", "")
    const beforeRanks = beforeRun.progression?.classProgression?.treeRanks || {}
    const afterRanks = afterRun.progression?.classProgression?.treeRanks || {}
    const beforeHighestRank = Math.max(0, ...Object.values(beforeRanks).map(Number))
    const afterHighestRank = Math.max(0, ...Object.values(afterRanks).map(Number))
    const investedTreeRank = Number(afterRanks[treeId] || 0)
    const beforeTreeRank = Number(beforeRanks[treeId] || 0)
    const heroLevel = Number(beforeRun.level || 1)
    const strategyPreferredTree = String(policy?.preferredTreeId || "")

    // Strong bonus for concentrating in one tree
    if (investedTreeRank > beforeHighestRank) {
      total += 40
    } else if (investedTreeRank === beforeHighestRank) {
      total += 20
    } else {
      total -= 15
    }

    // Bonus for matching the strategy's preferred tree — this is THE dominant factor
    if (strategyPreferredTree && treeId === strategyPreferredTree) {
      total += 120
    } else if (strategyPreferredTree && treeId !== strategyPreferredTree) {
      total -= 80
    }

    // Massive bonus for approaching skill unlock gates
    // Slot 2: needs 3 ranks in any tree + level 6
    if (heroLevel >= 6 && investedTreeRank === 3 && beforeTreeRank === 2) {
      total += 80
    } else if (heroLevel >= 4 && investedTreeRank >= 2 && beforeTreeRank < 2) {
      total += 50
    }

    // Slot 3: needs 6 ranks in favored tree + level 12
    if (heroLevel >= 12 && investedTreeRank === 6 && beforeTreeRank === 5) {
      total += 100
    } else if (heroLevel >= 10 && investedTreeRank >= 5 && beforeTreeRank < 5) {
      total += 60
    }

    // General progression bonus — investing is better than not investing
    total += 25

    // Bonus for matching the favored tree
    const favoredTreeId = beforeRun.progression?.classProgression?.favoredTreeId || ""
    if (favoredTreeId && treeId === favoredTreeId) {
      total += 30
    }
  }

  // Skill point and attribute point spending bonus
  if (actionId.startsWith("progression_spend_") || actionId.startsWith("progression_attribute_")) {
    total += 15
  }

  return total
}

export function optimizeSafeZoneRun(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  maxIterations = 24,
  archetypePlan?: RunArchetypeSimulationPlan | null,
  options?: {
    onTownActionApplied?: (actionId: string) => void
  }
) {
  const townServices = harness.browserWindow.ROUGE_TOWN_SERVICES
  function getCurrentReinforcementDeficit(targetRun: RunState) {
    const deckState = buildDeckConstructionState(harness, targetRun)
    const target = getReinforcementTargetByAct(Number(targetRun.actNumber || 1))
    return Math.max(0, target - (deckState.refinedCount + deckState.evolvedCount))
  }
  const isDeckShapingAction = (actionId: string) => {
    return (
      actionId.startsWith("blacksmith_evolve_") ||
      actionId.startsWith("blacksmith_refine_") ||
      actionId.startsWith("sage_purge_")
    )
  }
  const isGearFollowupAction = (actionId: string, allowVendorBuys = true) => {
    return (
      (allowVendorBuys && actionId.startsWith("vendor_buy_")) ||
      actionId.startsWith("inventory_equip_") ||
      actionId.startsWith("inventory_commission_") ||
      actionId.startsWith("inventory_socket_")
    )
  }

  function getEvolutionSpecBias(actionId: string, targetRun: RunState): number {
    const spec = purgeSpecsByClass[targetRun.classId]
    if (!spec) return 0
    const coreSet = new Set(spec.coreCards)
    const flexSet = new Set(spec.flexCards)

    // For evolve actions: check if we're evolving AWAY from a core card
    if (actionId.startsWith("blacksmith_evolve_")) {
      const sourceCardId = actionId.replace("blacksmith_evolve_", "").replace(/_plus$/, "")
      if (coreSet.has(sourceCardId)) {
        // Check if the evolution target is also core/flex — if so, allow it
        const evo = harness.browserWindow.__ROUGE_SKILL_EVOLUTION
        const targetId = evo?.getEvolution?.(sourceCardId)?.targetId || ""
        const targetBase = targetId.replace(/_plus$/, "")
        if (coreSet.has(targetBase) || flexSet.has(targetBase)) return 0
        return -150  // Penalize evolving a core card into something off-spec
      }
    }

    // For refine actions: bonus for refining core/flex cards
    if (actionId.startsWith("blacksmith_refine_")) {
      const cardId = actionId.replace("blacksmith_refine_", "").replace(/_plus$/, "")
      if (coreSet.has(cardId)) return 30
      if (flexSet.has(cardId)) return 10
    }

    return 0
  }

  function findBestDeckShapingAction(targetRun: RunState, cachedBaseScore?: number) {
    const baseScore = cachedBaseScore ?? evaluateRunScore(harness, targetRun, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
    const reinforcementDeficit = getCurrentReinforcementDeficit(targetRun)
    const actNumber = Number(targetRun.actNumber || 1)
    const allActions = townServices
      .listActions(harness.content, targetRun, profile)
      .filter((action: TownAction) => {
        const actionId = action.id || ""
        return !action.disabled && isDeckShapingAction(actionId)
      })
    // Allow both reinforcement and purge actions to compete — purge scoring
    // handles reinforcement deficit via its strategic bias penalty
    const actions = allActions

    let bestAction: TownAction | null = null
    let bestDelta = 0

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, targetRun)
      const result = townServices.applyAction(clone, profile, harness.content, action.id)
      if (!result.ok) {
        return
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
      const specBias = getEvolutionSpecBias(action.id || "", targetRun)
      const delta = nextScore - baseScore + scoreTownActionStrategicBias(harness, targetRun, clone, action.id || "", policy) + specBias
      if (delta > bestDelta) {
        bestDelta = delta
        bestAction = action
      }
    })

    return { bestAction, bestDelta }
  }

  function settleDeckShapingActions(targetRun: RunState, maxDeckActions = 2) {
    for (let actionIndex = 0; actionIndex < maxDeckActions; actionIndex += 1) {
      const { bestAction, bestDelta } = findBestDeckShapingAction(targetRun)
      if (!bestAction || bestDelta <= 1.5) {
        break
      }

      const result = townServices.applyAction(targetRun, profile, harness.content, bestAction.id)
      if (!result.ok) {
        break
      }
      options?.onTownActionApplied?.(bestAction.id)
    }
  }

  function findBestImmediateGearFollowup(targetRun: RunState, allowVendorBuys: boolean, cachedBaseScore?: number) {
    const baseScore = cachedBaseScore ?? evaluateRunScore(harness, targetRun, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
    const actions = townServices
      .listActions(harness.content, targetRun, profile)
      .filter((action: TownAction) => {
        const actionId = action.id || ""
        return !action.disabled && isGearFollowupAction(actionId, allowVendorBuys)
      })

    let bestAction: TownAction | null = null
    let bestDelta = 0

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, targetRun)
      const result = townServices.applyAction(clone, profile, harness.content, action.id)
      if (!result.ok) {
        return
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
      const delta = nextScore - baseScore
      if (delta > bestDelta) {
        bestDelta = delta
        bestAction = action
      }
    })

    return { bestAction, bestDelta }
  }

  function settleGearFollowups(targetRun: RunState, maxFollowups = 4, allowVendorBuys = false) {
    for (let followupIndex = 0; followupIndex < maxFollowups; followupIndex += 1) {
      const deckShapingAction = findBestDeckShapingAction(targetRun)
      if (deckShapingAction.bestAction && deckShapingAction.bestDelta > 3) {
        break
      }
      const { bestAction, bestDelta } = findBestImmediateGearFollowup(targetRun, allowVendorBuys && followupIndex === 0)
      if (!bestAction || bestDelta <= 0.05) {
        break
      }

      const result = townServices.applyAction(targetRun, profile, harness.content, bestAction.id)
      if (!result.ok) {
        break
      }
      options?.onTownActionApplied?.(bestAction.id)
    }
  }

  // Priority: heal before deck shaping — deck evolves can spend all gold leaving none for healer
  const heroHpRatio = run.hero.maxLife > 0 ? (run.hero.currentLife || 0) / run.hero.maxLife : 1
  if (heroHpRatio < 0.9 || (run.belt?.current || 0) < (run.belt?.max || 1)) {
    const healAction = townServices
      .listActions(harness.content, run, profile)
      .find((action: TownAction) => action.id === "healer_restore_party" && !action.disabled)
    if (healAction) {
      const healResult = townServices.applyAction(run, profile, harness.content, healAction.id)
      if (healResult.ok) {
        options?.onTownActionApplied?.(healAction.id)
      }
    }
    const refillAction = townServices
      .listActions(harness.content, run, profile)
      .find((action: TownAction) => action.id === "quartermaster_refill_belt" && !action.disabled)
    if (refillAction) {
      const refillResult = townServices.applyAction(run, profile, harness.content, refillAction.id)
      if (refillResult.ok) {
        options?.onTownActionApplied?.(refillAction.id)
      }
    }
  }

  settleDeckShapingActions(run, Number(run.actNumber || 1) >= 4 ? 6 : Number(run.actNumber || 1) >= 2 ? 4 : 2)

  let consecutiveSmallDeltas = 0
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const baseScore = evaluateRunScore(harness, run, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
    const allActions = townServices
      .listActions(harness.content, run, profile)
      .filter((action: TownAction) => isOptimizableTownAction(action))

    // Pre-filter: prioritize progression actions and limit gear/deck evaluations
    const progressionActions = allActions.filter((a: TownAction) => (a.id || "").startsWith("progression_") || a.id === "healer_restore_party" || a.id === "quartermaster_refill_belt")
    const gearActions = allActions.filter((a: TownAction) => (a.id || "").startsWith("inventory_equip_") || (a.id || "").startsWith("vendor_buy_") || (a.id || "").startsWith("inventory_socket_") || (a.id || "").startsWith("inventory_commission_"))
    const deckActions = allActions.filter((a: TownAction) => isDeckShapingAction(a.id || ""))
    const otherActions = allActions.filter((a: TownAction) => (a.id || "").startsWith("mercenary_contract_") || a.id === "vendor_refresh_stock")
    // Limit evaluations: progression always, gear top 6, deck top 4, other top 2
    const actions = [
      ...progressionActions,
      ...gearActions.slice(0, 6),
      ...deckActions.slice(0, 4),
      ...otherActions.slice(0, 2),
    ]

    let bestAction: TownAction | null = null
    let bestDelta = 0

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, run)
      const result = townServices.applyAction(clone, profile, harness.content, action.id)
      if (!result.ok) {
        return
      }

      if ((action.id || "") === "vendor_refresh_stock") {
        settleGearFollowups(clone, 4, true)
      } else if (isGearFollowupAction(action.id || "")) {
        settleGearFollowups(clone, 4, false)
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false, archetypePlan: archetypePlan || null })
      const delta = nextScore - baseScore + scoreTownActionStrategicBias(harness, run, clone, action.id || "", policy)
      if (delta > bestDelta) {
        bestDelta = delta
        bestAction = action
      }
    })

    if (!bestAction || bestDelta <= 0.05) {
      break
    }

    // Early convergence: stop if recent iterations found only marginal improvements
    if (bestDelta < 1.0) {
      consecutiveSmallDeltas += 1
      if (consecutiveSmallDeltas >= 2) {
        break
      }
    } else {
      consecutiveSmallDeltas = 0
    }

    const result = townServices.applyAction(run, profile, harness.content, bestAction.id)
    if (!result.ok) {
      break
    }
    options?.onTownActionApplied?.(bestAction.id)

    if ((bestAction.id || "") === "vendor_refresh_stock") {
      settleGearFollowups(run, 4, true)
    } else if (isGearFollowupAction(bestAction.id || "")) {
      settleGearFollowups(run, 4, false)
    }
  }
}
