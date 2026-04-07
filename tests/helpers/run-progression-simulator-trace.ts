import {
  scoreBossAdjustedPartyPower,
  scoreEncounterPowerFromDefinition,
  scorePartyPower,
} from "./balance-power-score"
import { simulateEncounterWithRun, type SimulatedCombatResult } from "./run-progression-simulator-combat"
import {
  type BuildJourneySummary,
  hashString,
  roundTo,
  type AppHarness,
  type ArchetypeLaneMetrics,
  type BuildPolicyDefinition,
  type CheckpointProbeProfile,
  type EncounterRunMetric,
  type FinalDeckProfileSummary,
  type FinalBuildSummary,
  type PolicyProgressSummary,
  type PolicyRunSummary,
  type ProbeEncounterSummary,
  type RunCheckpointKind,
  type RunArchetypeSimulationPlan,
  type SafeZoneCheckpointSummary,
  type SimulationFailureSummary,
  type WorldProgressSummary,
} from "./run-progression-simulator-core"
import {
  buildArchetypeLaneMetrics,
  buildDeckStats,
  createScoringRun,
  getArmorEquipment,
  getWeaponEquipment,
} from "./run-progression-simulator-scoring"

function buildArchetypeCommitmentSnapshot(
  archetypePlan: RunArchetypeSimulationPlan | null | undefined,
  laneMetrics: ArchetypeLaneMetrics | null
) {
  if (!archetypePlan?.targetArchetypeId) {
    return null
  }
  return {
    targetArchetypeId: archetypePlan.targetArchetypeId,
    targetArchetypeLabel: archetypePlan.targetArchetypeLabel,
    targetBand: archetypePlan.targetBand,
    commitmentMode: archetypePlan.commitmentMode,
    commitmentLocked: archetypePlan.commitmentLocked,
    commitmentSatisfied: archetypePlan.commitmentSatisfied,
    laneMetrics,
  }
}

type CheckpointProbeEntry = {
  encounterId: string
  encounterName: string
  zoneTitle: string
  kind: "boss" | "miniboss" | "elite" | "battle"
}

interface CheckpointSummaryOptions {
  checkpointKind?: RunCheckpointKind
  checkpointId?: string
  label?: string
  probeProfile?: CheckpointProbeProfile
  probeEntries?: CheckpointProbeEntry[]
}

function buildCheckpointTrainingState(harness: AppHarness, run: RunState) {
  const classProgression = harness.classRegistry.getClassProgression(harness.content, run.classId)
  const progressionSkills = Array.isArray(classProgression?.trees)
    ? classProgression.trees.flatMap((tree) => tree.skills || [])
    : []
  const equippedSkillIds = {
    slot1: String(run.progression?.classProgression?.equippedSkillBar?.slot1SkillId || ""),
    slot2: String(run.progression?.classProgression?.equippedSkillBar?.slot2SkillId || ""),
    slot3: String(run.progression?.classProgression?.equippedSkillBar?.slot3SkillId || ""),
  }
  const equippedSkillNames = {
    slot1: progressionSkills.find((skill) => skill.id === equippedSkillIds.slot1)?.name || "",
    slot2: progressionSkills.find((skill) => skill.id === equippedSkillIds.slot2)?.name || "",
    slot3: progressionSkills.find((skill) => skill.id === equippedSkillIds.slot3)?.name || "",
  }
  const unlockedSkillIds = Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
    ? [...run.progression.classProgression.unlockedSkillIds]
    : []
  const filledSlots = Object.values(equippedSkillIds).filter(Boolean).length
  const favoredTreeId = String(run.progression?.classProgression?.favoredTreeId || "")
  return {
    bankedSkillPoints: Number(run.progression?.skillPointsAvailable || 0),
    favoredTreeRank: Number(run.progression?.classProgression?.treeRanks?.[favoredTreeId] || 0),
    unlockedSkillCount: unlockedSkillIds.length,
    unlockedSkillIds,
    slotStateLabel: `${filledSlots} / 3`,
    equippedSkillIds,
    equippedSkillNames,
  }
}

type ProbeCandidate = CheckpointProbeEntry & {
  zoneRole: string
  nodeType: string
  enemyPowerScore: number
}

function isSideZoneRole(zoneRole: string) {
  return zoneRole === "branchBattle" || zoneRole === "branchMiniboss" || zoneRole.startsWith("side_")
}

function dedupeProbeEntries(entries: Array<CheckpointProbeEntry | null | undefined>) {
  const seen = new Set<string>()
  const deduped: CheckpointProbeEntry[] = []
  entries.forEach((entry) => {
    if (!entry || seen.has(entry.encounterId)) {
      return
    }
    seen.add(entry.encounterId)
    deduped.push(entry)
  })
  return deduped
}

function normalizeCardId(cardId: string) {
  return String(cardId || "").replace(/_plus$/, "")
}

function getCardDefinition(harness: AppHarness, cardId: string) {
  return harness.content.cardCatalog?.[cardId] || harness.content.cardCatalog?.[normalizeCardId(cardId)] || null
}

function getCardTree(harness: AppHarness, cardId: string) {
  return String(harness.browserWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree?.(normalizeCardId(cardId)) || "")
}

function cardMatchesProgressionTree(treeId: string, cardId: string, harness: AppHarness) {
  const cardTree = getCardTree(harness, cardId)
  return Boolean(treeId && cardTree && (treeId.includes(cardTree) || cardTree.includes(treeId)))
}

function buildEvolutionReverseMap(harness: AppHarness) {
  const chains = harness.browserWindow.__ROUGE_SKILL_EVOLUTION?.EVOLUTION_CHAINS || {}
  return Object.entries(chains).reduce((map, [sourceId, entry]) => {
    const targetId = normalizeCardId(String((entry as { targetId?: string } | null)?.targetId || ""))
    if (targetId) {
      map[targetId] = normalizeCardId(sourceId)
    }
    return map
  }, {} as Record<string, string>)
}

function getEvolutionRootCardId(cardId: string, reverseMap: Record<string, string>) {
  let current = normalizeCardId(cardId)
  const seen = new Set<string>()
  while (reverseMap[current] && !seen.has(current)) {
    seen.add(current)
    current = normalizeCardId(reverseMap[current])
  }
  return current
}

function getDeckFamilyTargetBand(deckFamily: FinalDeckProfileSummary["deckFamily"]) {
  switch (deckFamily) {
    case "pressure":
      return { min: 9, max: 13 }
    case "setup_payoff":
      return { min: 10, max: 14 }
    case "scaling_engine":
      return { min: 11, max: 15 }
    case "control_answer":
      return { min: 10, max: 14 }
    default:
      return { min: 10, max: 14 }
  }
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

function buildDeckFamilySignals(
  engineCardCount: number,
  roleCounts: FinalDeckProfileSummary["roleCounts"],
  behaviorCounts: FinalDeckProfileSummary["behaviorCounts"],
  preferredBehaviorTags: CardBehaviorTag[] = []
) {
  const preferred = new Set(preferredBehaviorTags || [])
  const pressureSignal =
    Number(behaviorCounts.pressure || 0) * 1.2 +
    roleCounts.payoff * 0.8 +
    engineCardCount * 0.5 +
    (preferred.has("pressure") ? 1.5 : 0)
  const setupPayoffSignal =
    Number(behaviorCounts.setup || 0) * 1.35 +
    Number(behaviorCounts.payoff || 0) * 1.2 +
    roleCounts.setup * 1.45 +
    roleCounts.payoff * 1.45 +
    roleCounts.conversion * 0.8 +
    (preferred.has("setup") ? 1.1 : 0) +
    (preferred.has("payoff") ? 1.1 : 0)
  const scalingSignal =
    Number(behaviorCounts.scaling || 0) * 1.5 +
    Number(behaviorCounts.protection || 0) * 0.8 +
    roleCounts.support * 1.25 +
    roleCounts.salvage * 0.7 +
    engineCardCount * 0.7 +
    (preferred.has("scaling") ? 1.4 : 0) +
    (preferred.has("protection") ? 0.6 : 0)
  const controlSignal =
    roleCounts.answer * 1.35 +
    roleCounts.support * 1.15 +
    Number(behaviorCounts.disruption || 0) * 1.35 +
    Number(behaviorCounts.tax || 0) * 1.1 +
    Number(behaviorCounts.mitigation || 0) * 1.1 +
    roleCounts.salvage * 0.6 +
    (preferred.has("disruption") ? 1.2 : 0) +
    (preferred.has("tax") ? 0.9 : 0) +
    (preferred.has("mitigation") ? 0.7 : 0)

  return {
    pressure: pressureSignal,
    setup_payoff: setupPayoffSignal,
    scaling_engine: scalingSignal,
    control_answer: controlSignal,
  }
}

function classifyDeckFamily(
  engineCardCount: number,
  roleCounts: FinalDeckProfileSummary["roleCounts"],
  behaviorCounts: FinalDeckProfileSummary["behaviorCounts"],
  preferredBehaviorTags: CardBehaviorTag[] = []
): FinalDeckProfileSummary["deckFamily"] {
  const signals = buildDeckFamilySignals(engineCardCount, roleCounts, behaviorCounts, preferredBehaviorTags)
  const ranked = Object.entries(signals)
    .sort((left, right) => right[1] - left[1])
  const best = ranked[0] || ["hybrid", 0]
  const second = ranked[1] || ["hybrid", 0]
  const setupSignal = Number(signals.setup_payoff || 0)
  const controlSignal = Number(signals.control_answer || 0)
  const scalingSignal = Number(signals.scaling_engine || 0)
  const pressureSignal = Number(signals.pressure || 0)

  if (roleCounts.setup >= 2 && roleCounts.payoff >= 2 && setupSignal >= pressureSignal * 0.78) {
    return "setup_payoff"
  }
  if (
    controlSignal >= Math.max(pressureSignal, scalingSignal) &&
    (roleCounts.answer + roleCounts.support >= 3 || Number(behaviorCounts.disruption || 0) + Number(behaviorCounts.tax || 0) >= 2)
  ) {
    return "control_answer"
  }
  if (
    scalingSignal >= Math.max(pressureSignal, controlSignal) &&
    (engineCardCount >= 2 || roleCounts.support >= 2 || Number(behaviorCounts.scaling || 0) >= 2)
  ) {
    return "scaling_engine"
  }
  if (best[1] < 4.5) {
    return "hybrid"
  }
  if (pressureSignal >= controlSignal && pressureSignal >= scalingSignal && (best[1] - second[1] >= 1.25 || pressureSignal >= 6)) {
    return "pressure"
  }
  return (best[0] as FinalDeckProfileSummary["deckFamily"]) || "hybrid"
}

function buildFinalDeckProfileSummary(
  harness: AppHarness,
  run: RunState,
  policy: BuildPolicyDefinition,
  progressionSummary: RunProgressionSummary | null | undefined
): FinalDeckProfileSummary {
  const buildPath = harness.browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES?.getRewardPathPreference?.(run, harness.content) || null
  const reverseEvolutionMap = buildEvolutionReverseMap(harness)
  const starterDeck = harness.classRegistry.getStarterDeckForClass(harness.content, run.classId) || []
  const starterBaseIds = new Set(starterDeck.map((cardId) => normalizeCardId(cardId)))
  const roleCounts: FinalDeckProfileSummary["roleCounts"] = {
    setup: 0,
    payoff: 0,
    support: 0,
    answer: 0,
    salvage: 0,
    conversion: 0,
  }
  const behaviorCounts: FinalDeckProfileSummary["behaviorCounts"] = {}
  let engineCardCount = 0
  let primaryTreeCardCount = 0
  let secondaryUtilityTreeCardCount = 0
  let starterShellCardsRemaining = 0
  let refinedCardCount = 0
  let evolvedCardCount = 0
  let reinforcedCardCount = 0

  const centerpieceByCardId = new Map<string, {
    cardId: string
    title: string
    count: number
    roleTag: CardRoleTag
    tree: string
    reinforced: boolean
    score: number
  }>()

  ;(Array.isArray(run.deck) ? run.deck : []).forEach((cardId) => {
    const card = getCardDefinition(harness, cardId)
    const baseCardId = normalizeCardId(cardId)
    const rootCardId = getEvolutionRootCardId(cardId, reverseEvolutionMap)
    const roleTag = (card?.roleTag as CardRoleTag | undefined) || "answer"
    const rewardRole = String(card?.rewardRole || "foundation")
    const tree = getCardTree(harness, cardId)
    const refined = cardId.endsWith("_plus")
    const evolved = rootCardId !== baseCardId
    const reinforced = refined || evolved

    if (rewardRole === "engine") {
      engineCardCount += 1
    }
    roleCounts[roleTag] += 1
    ;(Array.isArray(card?.behaviorTags) ? card.behaviorTags : []).forEach((tag) => {
      behaviorCounts[tag] = Number(behaviorCounts[tag] || 0) + 1
    })
    if (cardMatchesProgressionTree(progressionSummary?.primaryTreeId || "", cardId, harness)) {
      primaryTreeCardCount += 1
    }
    if (cardMatchesProgressionTree(progressionSummary?.secondaryUtilityTreeId || "", cardId, harness)) {
      secondaryUtilityTreeCardCount += 1
    }
    if (starterBaseIds.has(baseCardId) && !refined && rootCardId === baseCardId) {
      starterShellCardsRemaining += 1
    }
    if (refined) {
      refinedCardCount += 1
    }
    if (evolved) {
      evolvedCardCount += 1
    }
    if (reinforced) {
      reinforcedCardCount += 1
    }

    const existing = centerpieceByCardId.get(cardId)
    const score =
      Number(card?.tier || 1) * 10 +
      (reinforced ? 18 : 0) +
      (rewardRole === "engine" ? 8 : 0) +
      (roleTag === "payoff" ? 7 : roleTag === "setup" ? 5 : roleTag === "conversion" ? 4 : 0)
    if (existing) {
      existing.count += 1
      existing.score += score
      return
    }
    centerpieceByCardId.set(cardId, {
      cardId,
      title: String(card?.title || cardId),
      count: 1,
      roleTag,
      tree,
      reinforced,
      score,
    })
  })

  const deckFamily = classifyDeckFamily(engineCardCount, roleCounts, behaviorCounts, buildPath?.behaviorTags || [])
  const targetBand = getDeckFamilyTargetBand(deckFamily)
  const deckSizeStatus =
    run.deck.length < targetBand.min ? "under_band" : run.deck.length > targetBand.max ? "over_band" : "within_band"
  const reinforcementTarget = getReinforcementTargetByAct(Number(run.actNumber || 1))

  let targetShapeFit = 0
  targetShapeFit += deckSizeStatus === "within_band" ? 0.2 : deckSizeStatus === "under_band" ? 0.08 : 0.04
  targetShapeFit += progressionSummary?.specializationStage === "mastery"
    ? 0.2
    : progressionSummary?.specializationStage === "primary"
      ? 0.16
      : progressionSummary?.specializationStage === "candidate"
        ? 0.08
        : 0
  targetShapeFit += Number(progressionSummary?.offTreeDamageCount || 0) <= 2
    ? 0.15
    : Number(progressionSummary?.offTreeDamageCount || 0) <= 4
      ? 0.08
      : 0.02
  targetShapeFit += Number(progressionSummary?.offTreeUtilityCount || 0) >= 1 ? 0.1 : 0.02
  targetShapeFit += reinforcedCardCount >= reinforcementTarget
    ? 0.18
    : reinforcedCardCount >= Math.max(1, reinforcementTarget - 1)
      ? 0.1
      : 0.02
  targetShapeFit += starterShellCardsRemaining <= 2 ? 0.1 : starterShellCardsRemaining <= 4 ? 0.05 : 0.01
  targetShapeFit += roleCounts.salvage >= 1 ? 0.1 : 0.02
  targetShapeFit += roleCounts.answer >= 1 ? 0.1 : 0.02
  targetShapeFit += (() => {
    switch (deckFamily) {
      case "pressure":
        return Number(behaviorCounts.pressure || 0) >= 4 ? 0.1 : 0.04
      case "setup_payoff":
        return roleCounts.setup >= 2 && roleCounts.payoff >= 2 ? 0.1 : 0.04
      case "scaling_engine":
        return Number(behaviorCounts.scaling || 0) >= 2 && roleCounts.support >= 2 ? 0.1 : 0.04
      case "control_answer":
        return roleCounts.answer >= 2 && roleCounts.support >= 2 ? 0.1 : 0.04
      default:
        return primaryTreeCardCount >= Math.max(3, Math.ceil(run.deck.length * 0.35)) ? 0.1 : 0.04
    }
  })()

  const centerpieceCards = [...centerpieceByCardId.values()]
    .sort((left, right) => right.score - left.score || right.count - left.count || left.title.localeCompare(right.title))
    .slice(0, 4)
    .map(({ score: _score, ...entry }) => entry)

  return {
    deckFamily,
    engineCardCount,
    roleCounts,
    behaviorCounts,
    targetDeckSizeMin: targetBand.min,
    targetDeckSizeMax: targetBand.max,
    deckSizeStatus,
    targetShapeFit: roundTo(Math.min(1, targetShapeFit), 3),
    primaryTreeCardCount,
    secondaryUtilityTreeCardCount,
    starterShellCardsRemaining,
    refinedCardCount,
    evolvedCardCount,
    reinforcedCardCount,
    centerpieceCards,
  }
}

function sumCountsWithPrefix(counts: Record<string, number> | null | undefined, prefix: string) {
  return Object.entries(counts || {}).reduce((sum, [key, value]) => {
    return key.startsWith(prefix) ? sum + Number(value || 0) : sum
  }, 0)
}

function buildBuildJourneySummary(
  checkpoints: SafeZoneCheckpointSummary[],
  finalBuild: FinalBuildSummary
): BuildJourneySummary {
  const orderedCheckpoints = checkpoints
    .slice()
    .sort((left, right) =>
      left.actNumber - right.actNumber ||
      Number(left.checkpointKind === "safe_zone") - Number(right.checkpointKind === "safe_zone") ||
      left.checkpointId.localeCompare(right.checkpointId)
    )
  const safeCheckpoints = orderedCheckpoints.filter((checkpoint) => checkpoint.checkpointKind === "safe_zone")
  const commitmentCheckpoint = orderedCheckpoints.find((checkpoint) => {
    return Boolean(checkpoint.primaryTreeId) || checkpoint.specializationStage !== "exploratory"
  }) || null
  const committedPrimaryTreeId = String(commitmentCheckpoint?.primaryTreeId || finalBuild.primaryTreeId || "")
  const committedAtAct = Number(commitmentCheckpoint?.actNumber || 0)

  const rewardUpgradesByAct: Record<string, number> = {}
  const refinementsByAct: Record<string, number> = {}
  const evolutionsByAct: Record<string, number> = {}
  const purgesByAct: Record<string, number> = {}
  const transformsByAct: Record<string, number> = {}
  const driftActs = new Set<number>()

  let previousSafeCheckpoint: SafeZoneCheckpointSummary | null = null
  safeCheckpoints.forEach((checkpoint) => {
    const actKey = String(checkpoint.actNumber)
    const previousChoiceCounts = previousSafeCheckpoint?.choiceCounts || {}
    const previousTownCounts = previousSafeCheckpoint?.townActionCounts || {}
    rewardUpgradesByAct[actKey] = Math.max(0, Number(checkpoint.choiceCounts.upgrade || 0) - Number(previousChoiceCounts.upgrade || 0))
    refinementsByAct[actKey] = Math.max(
      0,
      sumCountsWithPrefix(checkpoint.townActionCounts, "blacksmith_refine_") - sumCountsWithPrefix(previousTownCounts, "blacksmith_refine_")
    )
    evolutionsByAct[actKey] = Math.max(
      0,
      sumCountsWithPrefix(checkpoint.townActionCounts, "blacksmith_evolve_") - sumCountsWithPrefix(previousTownCounts, "blacksmith_evolve_")
    )
    purgesByAct[actKey] = Math.max(
      0,
      sumCountsWithPrefix(checkpoint.townActionCounts, "sage_purge_") - sumCountsWithPrefix(previousTownCounts, "sage_purge_")
    )
    transformsByAct[actKey] = Math.max(
      0,
      sumCountsWithPrefix(checkpoint.townActionCounts, "sage_transform_") - sumCountsWithPrefix(previousTownCounts, "sage_transform_")
    )
    if (committedPrimaryTreeId && checkpoint.actNumber >= committedAtAct && checkpoint.primaryTreeId && checkpoint.primaryTreeId !== committedPrimaryTreeId) {
      driftActs.add(checkpoint.actNumber)
    }
    previousSafeCheckpoint = checkpoint
  })

  const totalRewardUpgrades = Object.values(rewardUpgradesByAct).reduce((sum, value) => sum + Number(value || 0), 0)
  const totalRefinements = Object.values(refinementsByAct).reduce((sum, value) => sum + Number(value || 0), 0)
  const totalEvolutions = Object.values(evolutionsByAct).reduce((sum, value) => sum + Number(value || 0), 0)
  const totalPurges = Object.values(purgesByAct).reduce((sum, value) => sum + Number(value || 0), 0)
  const totalTransforms = Object.values(transformsByAct).reduce((sum, value) => sum + Number(value || 0), 0)

  return {
    committedAtAct,
    committedPrimaryTreeId,
    firstMajorReinforcementAct: Number(
      Object.keys(rewardUpgradesByAct)
        .map((key) => Number(key))
        .find((actNumber) =>
          Number(rewardUpgradesByAct[String(actNumber)] || 0) +
            Number(refinementsByAct[String(actNumber)] || 0) +
            Number(evolutionsByAct[String(actNumber)] || 0) >
          0
        ) || 0
    ),
    firstPurgeAct: Number(
      Object.keys(purgesByAct)
        .map((key) => Number(key))
        .find((actNumber) => Number(purgesByAct[String(actNumber)] || 0) > 0) || 0
    ),
    rewardUpgradesByAct,
    refinementsByAct,
    evolutionsByAct,
    purgesByAct,
    transformsByAct,
    driftActs: [...driftActs].sort((left, right) => left - right),
    recoveredFromDrift: driftActs.size > 0 && finalBuild.primaryTreeId === committedPrimaryTreeId,
    totalRewardUpgrades,
    totalRefinements,
    totalEvolutions,
    totalPurges,
    totalTransforms,
  }
}

function getActProbeEncounters(
  harness: AppHarness,
  actNumber: number,
  checkpointKind: RunCheckpointKind = "safe_zone",
  probeProfile: CheckpointProbeProfile = "default"
) {
  const act = harness.seedBundle.zones.acts?.find((entry: ActSeed) => entry.act === actNumber) || null
  if (!act) {
    return []
  }

  const run = harness.runFactory.createRun({
    content: harness.content,
    seedBundle: harness.seedBundle,
    classDefinition: harness.classRegistry.getClassDefinition(harness.seedBundle, "barbarian"),
    heroDefinition: harness.classRegistry.createHeroFromClass(
      harness.content,
      harness.classRegistry.getClassDefinition(harness.seedBundle, "barbarian")
    ),
    mercenaryId: "desert_guard",
    starterDeck: harness.classRegistry.getStarterDeckForClass(harness.content, "barbarian"),
  })
  run.currentActIndex = Math.max(0, Math.min(actNumber - 1, run.acts.length - 1))
  harness.browserWindow.ROUGE_RUN_ROUTE_BUILDER.syncCurrentActFields(run)
  const currentAct = run.acts[run.currentActIndex]

  const entries = currentAct.zones.flatMap((zone) => {
    return (zone.encounterIds || []).map((encounterId) => {
      const encounter = harness.content.encounterCatalog[encounterId]
      if (!encounter) {
        return null
      }
      const hasBoss = zone.kind === "boss" || encounter.enemies.some((enemy) => enemy.templateId.endsWith("_boss"))
      const hasMiniboss = zone.kind === "miniboss"
      const hasElite = !hasMiniboss && encounter.enemies.some((enemy) => enemy.templateId.includes("_elite"))
      const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, encounterId).total
      return {
        encounterId,
        encounterName: encounter.name,
        zoneTitle: zone.title,
        kind: hasBoss ? ("boss" as const) : hasMiniboss ? ("miniboss" as const) : hasElite ? ("elite" as const) : ("battle" as const),
        zoneRole: String(zone.zoneRole || ""),
        nodeType: String(zone.nodeType || ""),
        enemyPowerScore,
      }
    })
  }).filter(Boolean) as ProbeCandidate[]

  const uniqueById = Array.from(new Map(entries.map((entry) => [entry.encounterId, entry])).values())
  const boss = uniqueById.find((entry) => entry.kind === "boss") || null
  if (checkpointKind === "pre_boss") {
    return boss ? [boss] : []
  }

  const minibossCandidates = uniqueById
    .filter((entry) => entry.kind === "miniboss")
    .sort((left, right) => {
      return (
        right.enemyPowerScore - left.enemyPowerScore ||
        Number(isSideZoneRole(right.zoneRole)) - Number(isSideZoneRole(left.zoneRole)) ||
        left.encounterId.localeCompare(right.encounterId)
      )
    })
  const eliteCandidates = uniqueById
    .filter((entry) => entry.kind === "elite")
    .sort((left, right) => {
      return (
        right.enemyPowerScore - left.enemyPowerScore ||
        Number(isSideZoneRole(right.zoneRole)) - Number(isSideZoneRole(left.zoneRole)) ||
        left.encounterId.localeCompare(right.encounterId)
      )
    })
  const battleCandidates = uniqueById
    .filter((entry) => entry.kind === "battle")
    .sort((left, right) => {
      return (
        right.enemyPowerScore - left.enemyPowerScore ||
        Number(isSideZoneRole(right.zoneRole)) - Number(isSideZoneRole(left.zoneRole)) ||
        left.encounterId.localeCompare(right.encounterId)
      )
    })

  const defaultMiniboss = uniqueById.find((entry) => entry.kind === "miniboss") || null
  const defaultElite = uniqueById.find((entry) => entry.kind === "elite") || null
  const defaultBattle = [...uniqueById].reverse().find((entry) => entry.kind === "battle") || null
  if (probeProfile !== "pressure") {
    return [defaultMiniboss, defaultElite, defaultBattle].filter(Boolean) as CheckpointProbeEntry[]
  }

  const hardestMiniboss = minibossCandidates[0] || null
  const sideElite = eliteCandidates.find((entry) => isSideZoneRole(entry.zoneRole)) || null
  const sideBattle = battleCandidates.find((entry) => isSideZoneRole(entry.zoneRole)) || null
  const hardestElite = eliteCandidates[0] || null
  const hardestBattle = battleCandidates[0] || null

  return dedupeProbeEntries([
    hardestMiniboss,
    defaultMiniboss,
    hardestElite,
    sideElite,
    defaultElite,
    hardestBattle,
    sideBattle,
    defaultBattle,
  ])
}

function summarizeProbeRuns(
  harness: AppHarness,
  entry: { encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "miniboss" | "elite" | "battle" },
  counterCoverageTags: CounterTag[],
  heroPowerScore: number,
  runs: SimulatedCombatResult[]
): ProbeEncounterSummary {
  const divisor = Math.max(1, runs.length)
  const wins = runs.filter((result) => result.outcome === "victory").length
  const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, entry.encounterId).total
  const askTags = Array.isArray(harness.content.encounterCatalog?.[entry.encounterId]?.askTags)
    ? [...(harness.content.encounterCatalog?.[entry.encounterId]?.askTags || [])]
    : []
  const missingCounterTags = askTags.filter((tag) => !counterCoverageTags.includes(tag))
  return {
    encounterId: entry.encounterId,
    encounterName: entry.encounterName,
    zoneTitle: entry.zoneTitle,
    kind: entry.kind,
    askTags,
    missingCounterTags,
    enemyPowerScore,
    powerDelta: roundTo(heroPowerScore - enemyPowerScore),
    powerRatio: roundTo(heroPowerScore / Math.max(1, enemyPowerScore)),
    runs: runs.length,
    winRate: wins / divisor,
    averageTurns: roundTo(runs.reduce((sum, result) => sum + result.turns, 0) / divisor),
    averageHeroLifePct: roundTo((runs.reduce((sum, result) => sum + result.heroLifePct, 0) / divisor) * 100),
    averageMercenaryLifePct: roundTo((runs.reduce((sum, result) => sum + result.mercenaryLifePct, 0) / divisor) * 100),
    averageEnemyLifePct: roundTo((runs.reduce((sum, result) => sum + result.enemyLifePct, 0) / divisor) * 100),
    openingHandFullSpendRate: roundTo(runs.filter((result) => result.openingHandFullSpend).length / divisor, 3),
    averageTurn1UnspentEnergy: roundTo(runs.reduce((sum, result) => sum + Number(result.turn1UnspentEnergy || 0), 0) / divisor),
    averageEarlyUnspentEnergy: roundTo(runs.reduce((sum, result) => sum + Number(result.earlyUnspentEnergyAverage || 0), 0) / divisor),
    averageEarlyMeaningfulUnplayedRate: roundTo(
      runs.reduce((sum, result) => sum + Number(result.earlyMeaningfulUnplayedRate || 0), 0) / divisor,
      3
    ),
    averageEarlyCandidateCount: roundTo(runs.reduce((sum, result) => sum + Number(result.averageEarlyCandidateCount || 0), 0) / divisor, 3),
    averageEarlyMeaningfulCandidateCount: roundTo(
      runs.reduce((sum, result) => sum + Number(result.averageEarlyMeaningfulCandidateCount || 0), 0) / divisor,
      3
    ),
    averageEarlyDecisionScoreSpread: roundTo(
      runs.reduce((sum, result) => sum + Number(result.averageEarlyDecisionScoreSpread || 0), 0) / divisor,
      3
    ),
    earlyCloseDecisionRate: roundTo(runs.reduce((sum, result) => sum + Number(result.earlyCloseDecisionRate || 0), 0) / divisor, 3),
    averageEarlyEndTurnRegret: roundTo(
      runs.reduce((sum, result) => sum + Number(result.averageEarlyEndTurnRegret || 0), 0) / divisor,
      3
    ),
    skillActionRate: roundTo(runs.reduce((sum, result) => sum + Number(result.skillActionRate || 0), 0) / divisor, 3),
    skillUseTurnRate: roundTo(runs.reduce((sum, result) => sum + Number(result.skillUseTurnRate || 0), 0) / divisor, 3),
    readySkillUnusedTurnRate: roundTo(
      runs.reduce((sum, result) => sum + Number(result.readySkillUnusedTurnRate || 0), 0) / divisor,
      3
    ),
    slot1UseRate: roundTo(runs.reduce((sum, result) => sum + Number(result.slot1UseRate || 0), 0) / divisor, 3),
    slot2UseRate: roundTo(runs.reduce((sum, result) => sum + Number(result.slot2UseRate || 0), 0) / divisor, 3),
    slot3UseRate: roundTo(runs.reduce((sum, result) => sum + Number(result.slot3UseRate || 0), 0) / divisor, 3),
    beamDecisionRate: roundTo(runs.reduce((sum, result) => sum + Number(result.beamDecisionRate || 0), 0) / divisor, 3),
    averageBeamDepth: roundTo(runs.reduce((sum, result) => sum + Number(result.averageBeamDepth || 0), 0) / divisor, 3),
    beamOverrideRate: roundTo(runs.reduce((sum, result) => sum + Number(result.beamOverrideRate || 0), 0) / divisor, 3),
  }
}

export function buildCheckpointSummary(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  actNumber: number,
  progress: PolicyProgressSummary,
  probeRuns: number,
  maxCombatTurns: number,
  archetypePlan?: RunArchetypeSimulationPlan | null,
  options: CheckpointSummaryOptions = {}
): SafeZoneCheckpointSummary {
  const checkpointKind = options.checkpointKind || "safe_zone"
  const scoringRun = createScoringRun(harness, run, true)
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, profile)
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(getWeaponEquipment(scoringRun), harness.content) || null
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content)
  const weaponEquipment = getWeaponEquipment(scoringRun)
  const weaponItem = weaponEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquipment.itemId) : null
  const deckStats = buildDeckStats(harness, scoringRun, policy)
  const progressionSummary = harness.runFactory.getProgressionSummary(scoringRun, harness.content)
  const activeRunewords = harness.itemSystem.getActiveRunewords(scoringRun, harness.content) || []
  const laneMetrics = archetypePlan?.targetArchetypeId
    ? buildArchetypeLaneMetrics(harness, scoringRun, archetypePlan.targetArchetypeId)
    : null
  const partyPowerInput = {
    content: harness.content,
    deckCardIds: scoringRun.deck,
    heroState: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenaryState: {
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    weaponProfile,
    armorProfile,
    weaponFamily: weaponItem?.family || "",
    classPreferredFamilies: harness.classRegistry.getPreferredWeaponFamilies(scoringRun.classId) || [],
    gold: scoringRun.gold,
    potions: scoringRun.belt.current,
    level: scoringRun.level,
    bankedSkillPoints: Number(scoringRun.progression?.skillPointsAvailable || 0),
    bankedClassPoints: Number(scoringRun.progression?.classPointsAvailable || 0),
    bankedAttributePoints: Number(scoringRun.progression?.attributePointsAvailable || 0),
    includeCurrentResources: false,
  }
  const partyPower = scorePartyPower(partyPowerInput)
  const bossAdjustedPower = scoreBossAdjustedPartyPower(partyPowerInput)
  const probeEntries = options.probeEntries || getActProbeEncounters(harness, actNumber, checkpointKind, options.probeProfile || "default")
  const probeRunBase = createScoringRun(harness, run, true)
  const probes = probeRuns > 0 ? probeEntries.map((entry, index) => {
    const runs = Array.from({ length: probeRuns }, (_, probeIndex) => {
      const seed = hashString([policy.id, String(actNumber), entry.encounterId, String(index), String(probeIndex)].join("|"))
      return simulateEncounterWithRun(harness, probeRunBase, profile, entry.encounterId, policy, maxCombatTurns, seed)
    })
    return summarizeProbeRuns(
      harness,
      entry,
      Array.isArray(progressionSummary?.counterCoverageTags) ? progressionSummary.counterCoverageTags : [],
      partyPower.total,
      runs
    )
  }) : []

  return {
    checkpointKind,
    checkpointId: options.checkpointId || `act_${actNumber}_${checkpointKind}`,
    label: options.label || (checkpointKind === "pre_boss" ? `Act ${actNumber} Pre-Boss` : `Act ${actNumber} Safe Zone`),
    actNumber,
    level: run.level,
    gold: run.gold,
    powerScore: partyPower.total,
    bossReadinessScore: bossAdjustedPower.bossReadiness.total,
    bossAdjustedPowerScore: bossAdjustedPower.total,
    powerBreakdown: {
      offense: partyPower.offense,
      defense: partyPower.defense,
      sustain: partyPower.sustain,
      utility: partyPower.utility,
      deck: partyPower.deck,
      equipment: partyPower.equipment,
      progression: partyPower.progression,
      resources: partyPower.resources,
    },
    deckSize: run.deck.length,
    topCards: deckStats.topCards,
    deckProficiencies: Object.entries(deckStats.proficiencyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([proficiency, count]) => ({ proficiency, count })),
    hero: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenary: {
      name: run.mercenary.name,
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    attributes: { ...(run.progression?.attributes || {}) },
    training: { ...(run.progression?.training || {}) },
    favoredTreeId: progressionSummary?.favoredTreeId || "",
    favoredTreeName: progressionSummary?.favoredTreeName || "",
    primaryTreeId: progressionSummary?.primaryTreeId || "",
    secondaryUtilityTreeId: progressionSummary?.secondaryUtilityTreeId || "",
    specializationStage: progressionSummary?.specializationStage || "exploratory",
    offTreeUtilityCount: Number(progressionSummary?.offTreeUtilityCount || 0),
    offTreeDamageCount: Number(progressionSummary?.offTreeDamageCount || 0),
    counterCoverageTags: Array.isArray(progressionSummary?.counterCoverageTags) ? [...progressionSummary.counterCoverageTags] : [],
    dominantArchetypeId: progressionSummary?.dominantArchetypeId || "",
    dominantArchetypeLabel: progressionSummary?.dominantArchetypeLabel || "",
    dominantArchetypeScore: Number(progressionSummary?.dominantArchetypeScore || 0),
    secondaryArchetypeId: progressionSummary?.secondaryArchetypeId || "",
    secondaryArchetypeLabel: progressionSummary?.secondaryArchetypeLabel || "",
    secondaryArchetypeScore: Number(progressionSummary?.secondaryArchetypeScore || 0),
    archetypeScores: Array.isArray(progressionSummary?.archetypeScores)
      ? progressionSummary.archetypeScores.map((entry) => ({
          archetypeId: entry.archetypeId,
          label: entry.label,
          score: Number(entry.score || 0),
        }))
      : [],
    weapon: weaponEquipment
      ? {
          itemId: weaponEquipment.itemId,
          name: weaponItem?.name || weaponEquipment.itemId,
          family: weaponItem?.family || "",
          rarity: weaponEquipment.rarity || "white",
        }
      : null,
    activeRunewords,
    runewordsForged: Number(scoringRun.summary?.runewordsForged || 0),
    armor: {
      resistances: (armorProfile?.resistances || []).map((entry) => ({
        type: entry.type,
        amount: Number(entry.amount || 0),
      })),
      immunities: [...(armorProfile?.immunities || [])],
    },
    choiceCounts: { ...progress.actionCounts },
    townActionCounts: { ...progress.townActionCounts },
    trainingState: buildCheckpointTrainingState(harness, scoringRun),
    probes,
    archetypeCommitment: buildArchetypeCommitmentSnapshot(archetypePlan || null, laneMetrics),
  }
}

function buildFinalBuildSummary(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  archetypePlan?: RunArchetypeSimulationPlan | null
): FinalBuildSummary {
  const scoringRun = createScoringRun(harness, run, true)
  const progressionSummary = harness.runFactory.getProgressionSummary(scoringRun, harness.content)
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, profile)
  const weaponEquipment = getWeaponEquipment(scoringRun)
  const armorEquipment = getArmorEquipment(scoringRun)
  const weaponItem = weaponEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquipment.itemId) : null
  const armorItem = armorEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, armorEquipment.itemId) : null
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content) || null
  const activeRunewords = harness.itemSystem.getActiveRunewords(scoringRun, harness.content) || []
  const deckStats = buildDeckStats(harness, scoringRun, policy)
  const preferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(scoringRun.classId) || []
  const laneMetrics = archetypePlan?.targetArchetypeId
    ? buildArchetypeLaneMetrics(harness, scoringRun, archetypePlan.targetArchetypeId)
    : null

  return {
    level: scoringRun.level,
    deckSize: scoringRun.deck.length,
    topCards: deckStats.topCards,
    deckProficiencies: Object.entries(deckStats.proficiencyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([proficiency, count]) => ({ proficiency, count })),
    hero: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenary: {
      name: scoringRun.mercenary.name,
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    weapon: weaponEquipment
      ? {
          itemId: weaponEquipment.itemId,
          name: weaponItem?.name || weaponEquipment.itemId,
          family: weaponItem?.family || "",
          rarity: weaponEquipment.rarity || "white",
          preferredForClass: preferredFamilies.includes(weaponItem?.family || ""),
          damageTypes: (weaponProfile?.typedDamage || []).map((entry) => ({
            type: entry.type,
            amount: Number(entry.amount || 0),
          })),
          effects: (weaponProfile?.effects || []).map((entry) => ({
            kind: entry.kind,
            amount: Number(entry.amount || 0),
          })),
        }
      : null,
    armor: armorEquipment
      ? {
          itemId: armorEquipment.itemId,
          name: armorItem?.name || armorEquipment.itemId,
          rarity: armorEquipment.rarity || "white",
          resistances: (armorProfile?.resistances || []).map((entry) => ({
            type: entry.type,
            amount: Number(entry.amount || 0),
          })),
          immunities: [...(armorProfile?.immunities || [])],
        }
      : null,
    favoredTreeId: progressionSummary?.favoredTreeId || "",
    favoredTreeName: progressionSummary?.favoredTreeName || "",
    primaryTreeId: progressionSummary?.primaryTreeId || "",
    secondaryUtilityTreeId: progressionSummary?.secondaryUtilityTreeId || "",
    specializationStage: progressionSummary?.specializationStage || "exploratory",
    offTreeUtilityCount: Number(progressionSummary?.offTreeUtilityCount || 0),
    offTreeDamageCount: Number(progressionSummary?.offTreeDamageCount || 0),
    counterCoverageTags: Array.isArray(progressionSummary?.counterCoverageTags) ? [...progressionSummary.counterCoverageTags] : [],
    dominantArchetypeId: progressionSummary?.dominantArchetypeId || "",
    dominantArchetypeLabel: progressionSummary?.dominantArchetypeLabel || "",
    dominantArchetypeScore: Number(progressionSummary?.dominantArchetypeScore || 0),
    secondaryArchetypeId: progressionSummary?.secondaryArchetypeId || "",
    secondaryArchetypeLabel: progressionSummary?.secondaryArchetypeLabel || "",
    secondaryArchetypeScore: Number(progressionSummary?.secondaryArchetypeScore || 0),
    archetypeScores: Array.isArray(progressionSummary?.archetypeScores)
      ? progressionSummary.archetypeScores.map((entry) => ({
          archetypeId: entry.archetypeId,
          label: entry.label,
          score: Number(entry.score || 0),
        }))
      : [],
    activeRunewords,
    deckProfile: buildFinalDeckProfileSummary(harness, scoringRun, policy, progressionSummary),
    archetypeCommitment: archetypePlan?.targetArchetypeId
      ? {
          targetArchetypeId: archetypePlan.targetArchetypeId,
          targetArchetypeLabel: archetypePlan.targetArchetypeLabel,
          targetBand: archetypePlan.targetBand,
          commitmentMode: archetypePlan.commitmentMode,
          commitmentLocked: archetypePlan.commitmentLocked,
          commitmentSatisfied: archetypePlan.commitmentSatisfied,
          committedByCheckpoint: archetypePlan.committedByCheckpoint,
          committedAtCheckpointId: archetypePlan.committedAtCheckpointId,
          driftRateAfterCommit: archetypePlan.postCommitCheckpointCount > 0
            ? roundTo(archetypePlan.driftCountAfterCommit / archetypePlan.postCommitCheckpointCount, 3)
            : 0,
          driftCountAfterCommit: archetypePlan.driftCountAfterCommit,
          postCommitCheckpointCount: archetypePlan.postCommitCheckpointCount,
          fallbackDebtCardCount: archetypePlan.fallbackDebtCardCount,
          fallbackDebtWeight: archetypePlan.fallbackDebtWeight,
          fallbackWeaponDebt: archetypePlan.fallbackWeaponDebt,
          exitedFallbackGear: archetypePlan.exitedFallbackGear,
          laneIntegrity: Number(laneMetrics?.laneIntegrity || 0),
        }
      : null,
  }
}

function buildWorldProgressSummary(run: RunState): WorldProgressSummary {
  const questOutcomes = Object.values(run.world?.questOutcomes || {})
  return {
    resolvedNodeCount: Array.isArray(run.world?.resolvedNodeIds) ? run.world.resolvedNodeIds.length : 0,
    worldFlagCount: Array.isArray(run.world?.worldFlags) ? run.world.worldFlags.length : 0,
    questOutcomes: questOutcomes.length,
    questFollowUpsResolved: questOutcomes.filter((entry) => Boolean(entry.followUpNodeId)).length,
    questChainsResolved: questOutcomes.filter((entry) => entry.status === "chain_resolved").length,
    shrineOutcomes: Object.keys(run.world?.shrineOutcomes || {}).length,
    eventOutcomes: Object.keys(run.world?.eventOutcomes || {}).length,
    opportunityOutcomes: Object.keys(run.world?.opportunityOutcomes || {}).length,
  }
}

function buildEncounterMetricsByKind(encounters: EncounterRunMetric[]) {
  const byKind: Record<string, EncounterRunMetric[]> = {}
  encounters.forEach((entry) => {
    const kind = entry.kind || "battle"
    byKind[kind] = byKind[kind] || []
    byKind[kind].push(entry)
  })

  return Object.fromEntries(
    Object.entries(byKind).map(([kind, entries]) => {
      const count = Math.max(1, entries.length)
      const wins = entries.filter((entry) => entry.outcome === "victory").length
      return [kind, {
        count: entries.length,
        winRate: roundTo(wins / count, 3),
        averageTurns: roundTo(entries.reduce((sum, entry) => sum + Number(entry.turns || 0), 0) / count),
        averageHeroLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.heroLifePct || 0), 0) / count),
        averageMercenaryLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.mercenaryLifePct || 0), 0) / count),
        averageEnemyLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.enemyLifePct || 0), 0) / count),
        averagePowerRatio: roundTo(entries.reduce((sum, entry) => sum + Number(entry.powerRatio || 0), 0) / count),
        openingHandFullSpendRate: roundTo(entries.filter((entry) => entry.openingHandFullSpend).length / count, 3),
        averageTurn1UnspentEnergy: roundTo(entries.reduce((sum, entry) => sum + Number(entry.turn1UnspentEnergy || 0), 0) / count),
        averageEarlyUnspentEnergy: roundTo(entries.reduce((sum, entry) => sum + Number(entry.earlyUnspentEnergyAverage || 0), 0) / count),
        averageEarlyMeaningfulUnplayedRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.earlyMeaningfulUnplayedRate || 0), 0) / count,
          3
        ),
        averageEarlyCandidateCount: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.averageEarlyCandidateCount || 0), 0) / count,
          3
        ),
        averageEarlyMeaningfulCandidateCount: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.averageEarlyMeaningfulCandidateCount || 0), 0) / count,
          3
        ),
        averageEarlyDecisionScoreSpread: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.averageEarlyDecisionScoreSpread || 0), 0) / count,
          3
        ),
        earlyCloseDecisionRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.earlyCloseDecisionRate || 0), 0) / count,
          3
        ),
        averageEarlyEndTurnRegret: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.averageEarlyEndTurnRegret || 0), 0) / count,
          3
        ),
        skillActionRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.skillActionRate || 0), 0) / count,
          3
        ),
        skillUseTurnRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.skillUseTurnRate || 0), 0) / count,
          3
        ),
        readySkillUnusedTurnRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.readySkillUnusedTurnRate || 0), 0) / count,
          3
        ),
        slot1UseRate: roundTo(entries.reduce((sum, entry) => sum + Number(entry.slot1UseRate || 0), 0) / count, 3),
        slot2UseRate: roundTo(entries.reduce((sum, entry) => sum + Number(entry.slot2UseRate || 0), 0) / count, 3),
        slot3UseRate: roundTo(entries.reduce((sum, entry) => sum + Number(entry.slot3UseRate || 0), 0) / count, 3),
        beamDecisionRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.beamDecisionRate || 0), 0) / count,
          3
        ),
        averageBeamDepth: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.averageBeamDepth || 0), 0) / count,
          3
        ),
        beamOverrideRate: roundTo(
          entries.reduce((sum, entry) => sum + Number(entry.beamOverrideRate || 0), 0) / count,
          3
        ),
      }]
    })
  )
}

export function buildPolicyRunSummary(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  progress: PolicyProgressSummary,
  checkpoints: SafeZoneCheckpointSummary[],
  archetypePlan?: RunArchetypeSimulationPlan | null
): PolicyRunSummary {
  const finalBuild = buildFinalBuildSummary(harness, run, profile, policy, archetypePlan || null)
  return {
    runSummary: {
      ...run.summary,
    },
    zoneKindCounts: { ...progress.zoneKindCounts },
    zoneRoleCounts: { ...progress.zoneRoleCounts },
    nodeTypeCounts: { ...progress.nodeTypeCounts },
    rewardKindCounts: { ...progress.rewardKindCounts },
    choiceKindCounts: { ...progress.actionCounts },
    rewardEffectCounts: { ...progress.rewardEffectCounts },
    rewardRoleCounts: { ...progress.rewardRoleCounts },
    strategyRoleCounts: { ...progress.strategyRoleCounts },
    townActionCounts: { ...progress.townActionCounts },
    encounterResults: progress.encounterResults.map((entry) => ({ ...entry })),
    encounterMetricsByKind: buildEncounterMetricsByKind(progress.encounterResults),
    world: buildWorldProgressSummary(run),
    finalBuild,
    buildJourney: buildBuildJourneySummary(checkpoints, finalBuild),
    archetypeCommitment: finalBuild.archetypeCommitment,
  }
}

export function buildEncounterMetric(
  harness: AppHarness,
  run: RunState,
  encounter: SimulationFailureSummary | null,
  combatResult: SimulatedCombatResult | null
): EncounterRunMetric | null {
  if (!encounter || !combatResult) {
    return null
  }
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, null)
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null
  const weaponEquipment = getWeaponEquipment(run)
  const weaponItemId = weaponEquipment?.itemId || ""
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || ""
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  const heroPowerScore = scorePartyPower({
    content: harness.content,
    deckCardIds: run.deck,
    heroState: {
      ...overrides.heroState,
      life: run.hero.currentLife,
      currentLife: run.hero.currentLife,
    },
    mercenaryState: {
      ...overrides.mercenaryState,
      life: run.mercenary.currentLife,
      currentLife: run.mercenary.currentLife,
    },
    weaponProfile,
    armorProfile,
    weaponFamily,
    classPreferredFamilies,
    gold: run.gold,
    potions: run.belt.current,
    level: run.level,
    bankedSkillPoints: run.progression?.skillPointsAvailable || 0,
    bankedClassPoints: run.progression?.classPointsAvailable || 0,
    bankedAttributePoints: run.progression?.attributePointsAvailable || 0,
    includeCurrentResources: true,
  }).total
  const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, encounter.encounterId).total
  return {
    actNumber: encounter.actNumber,
    encounterId: encounter.encounterId,
    encounterName: encounter.encounterName,
    zoneTitle: encounter.zoneTitle,
    kind: encounter.kind || "battle",
    zoneKind: encounter.zoneKind || "",
    zoneRole: encounter.zoneRole || "",
    outcome: String(combatResult.outcome || "defeat"),
    turns: Number(combatResult.turns || 0),
    heroLifePct: Number(combatResult.heroLifePct || 0),
    mercenaryLifePct: Number(combatResult.mercenaryLifePct || 0),
    enemyLifePct: Number(combatResult.enemyLifePct || 0),
    heroPowerScore: roundTo(heroPowerScore),
    enemyPowerScore: roundTo(enemyPowerScore),
    powerRatio: roundTo(heroPowerScore / Math.max(1, enemyPowerScore)),
    openingHandFullSpend: Boolean(combatResult.openingHandFullSpend),
    openingHandCardsPlayed: Number(combatResult.openingHandCardsPlayed || 0),
    openingHandSize: Number(combatResult.openingHandSize || 0),
    turn1UnspentEnergy: Number(combatResult.turn1UnspentEnergy || 0),
    earlyUnspentEnergyAverage: Number(combatResult.earlyUnspentEnergyAverage || 0),
    earlyMeaningfulUnplayedRate: Number(combatResult.earlyMeaningfulUnplayedRate || 0),
    averageEarlyCandidateCount: Number(combatResult.averageEarlyCandidateCount || 0),
    averageEarlyMeaningfulCandidateCount: Number(combatResult.averageEarlyMeaningfulCandidateCount || 0),
    averageEarlyDecisionScoreSpread: Number(combatResult.averageEarlyDecisionScoreSpread || 0),
    earlyCloseDecisionRate: Number(combatResult.earlyCloseDecisionRate || 0),
    averageEarlyEndTurnRegret: Number(combatResult.averageEarlyEndTurnRegret || 0),
    skillActionRate: Number(combatResult.skillActionRate || 0),
    skillUseTurnRate: Number(combatResult.skillUseTurnRate || 0),
    readySkillUnusedTurnRate: Number(combatResult.readySkillUnusedTurnRate || 0),
    slot1UseRate: Number(combatResult.slot1UseRate || 0),
    slot2UseRate: Number(combatResult.slot2UseRate || 0),
    slot3UseRate: Number(combatResult.slot3UseRate || 0),
    beamDecisionRate: Number(combatResult.beamDecisionRate || 0),
    averageBeamDepth: Number(combatResult.averageBeamDepth || 0),
    beamOverrideRate: Number(combatResult.beamOverrideRate || 0),
    combatLogSummary: combatResult.logSummary || null,
  }
}
