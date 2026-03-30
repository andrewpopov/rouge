import {
  scoreBossAdjustedPartyPower,
  scoreEncounterPowerFromDefinition,
  scorePartyPower,
} from "./balance-power-score"
import { simulateEncounterWithRun, type SimulatedCombatResult } from "./run-progression-simulator-combat"
import {
  hashString,
  roundTo,
  type AppHarness,
  type ArchetypeLaneMetrics,
  type BuildPolicyDefinition,
  type EncounterRunMetric,
  type FinalBuildSummary,
  type PolicyProgressSummary,
  type PolicyRunSummary,
  type ProbeEncounterSummary,
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

function getActProbeEncounters(harness: AppHarness, actNumber: number) {
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
      const hasElite = zone.kind === "miniboss" || encounter.enemies.some((enemy) => enemy.templateId.includes("_elite"))
      return {
        encounterId,
        encounterName: encounter.name,
        zoneTitle: zone.title,
        kind: hasBoss ? ("boss" as const) : hasElite ? ("elite" as const) : ("battle" as const),
      }
    })
  }).filter(Boolean) as Array<{ encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" }>

  const uniqueById = Array.from(new Map(entries.map((entry) => [entry.encounterId, entry])).values())
  const boss = uniqueById.find((entry) => entry.kind === "boss") || null
  const elite = uniqueById.find((entry) => entry.kind === "elite") || null
  const battle = [...uniqueById].reverse().find((entry) => entry.kind === "battle") || null
  return [boss, elite, battle].filter(Boolean) as Array<{ encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" }>
}

function summarizeProbeRuns(
  harness: AppHarness,
  entry: { encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" },
  heroPowerScore: number,
  runs: SimulatedCombatResult[]
): ProbeEncounterSummary {
  const divisor = Math.max(1, runs.length)
  const wins = runs.filter((result) => result.outcome === "victory").length
  const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, entry.encounterId).total
  return {
    encounterId: entry.encounterId,
    encounterName: entry.encounterName,
    zoneTitle: entry.zoneTitle,
    kind: entry.kind,
    enemyPowerScore,
    powerDelta: roundTo(heroPowerScore - enemyPowerScore),
    powerRatio: roundTo(heroPowerScore / Math.max(1, enemyPowerScore)),
    runs: runs.length,
    winRate: wins / divisor,
    averageTurns: roundTo(runs.reduce((sum, result) => sum + result.turns, 0) / divisor),
    averageHeroLifePct: roundTo((runs.reduce((sum, result) => sum + result.heroLifePct, 0) / divisor) * 100),
    averageMercenaryLifePct: roundTo((runs.reduce((sum, result) => sum + result.mercenaryLifePct, 0) / divisor) * 100),
    averageEnemyLifePct: roundTo((runs.reduce((sum, result) => sum + result.enemyLifePct, 0) / divisor) * 100),
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
  archetypePlan?: RunArchetypeSimulationPlan | null
): SafeZoneCheckpointSummary {
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
  const probeEntries = getActProbeEncounters(harness, actNumber)
  const probeRunBase = createScoringRun(harness, run, true)
  const probes = probeRuns > 0 ? probeEntries.map((entry, index) => {
    const runs = Array.from({ length: probeRuns }, (_, probeIndex) => {
      const seed = hashString([policy.id, String(actNumber), entry.encounterId, String(index), String(probeIndex)].join("|"))
      return simulateEncounterWithRun(harness, probeRunBase, profile, entry.encounterId, policy, maxCombatTurns, seed)
    })
    return summarizeProbeRuns(harness, entry, partyPower.total, runs)
  }) : []

  return {
    checkpointId: `act_${actNumber}_safe_zone`,
    label: `Act ${actNumber} Safe Zone`,
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
    encounterResults: progress.encounterResults.map((entry) => ({ ...entry })),
    encounterMetricsByKind: buildEncounterMetricsByKind(progress.encounterResults),
    world: buildWorldProgressSummary(run),
    finalBuild,
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
  }
}
