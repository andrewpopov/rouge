import {
  buildCombatStateForEncounter,
  playStateCombat,
  traceCombatStateWithPolicy,
} from "./run-progression-simulator-combat"
import {
  DEFAULT_CLASS_IDS,
  clamp,
  cloneContinuationContext,
  createEmptyPolicyProgressSummary,
  createProgressionSimulationSeed,
  createQuietAppHarness,
  createSeededRandom,
  createTrackedRandom,
  getMercenaryIdForClass,
  applyClassStrategy,
  getPolicyDefinitions,
  getPolicySimulationAssumptions,
  getRunProgressionPolicyDefinitions,
  getTrackedRandomState,
  hashString,
  incrementCount,
  type ArchetypeCommitCheckpoint,
  type ArchetypeCommitmentMode,
  type BuildPolicyDefinition,
  type CheckpointProbeProfile,
  type PolicyProgressSummary,
  type PolicyRunSummary,
  type PolicySimulationHooks,
  type PolicySimulationReport,
  type RunArchetypeSimulationPlan,
  type RunProgressionContinuationContext,
  type RunProgressionSimulationOptions,
  type RunProgressionTrainingLoadout,
  type RunProgressionSimulationReport,
  type SafeZoneCheckpointSummary,
  type SimulationFailureSummary,
} from "./run-progression-simulator-core"
import {
  buildArchetypeLaneMetrics,
  cloneRun,
  discardLowestValueCarriedEntry,
  evaluateRunScore,
  optimizeSafeZoneRun,
} from "./run-progression-simulator-scoring"
import {
  buildCheckpointSummary,
  buildEncounterMetric,
  buildPolicyRunSummary,
} from "./run-progression-simulator-trace"

export {
  createProgressionSimulationSeed,
  createQuietAppHarness,
  createTrackedRandom,
  getRunProgressionPolicyDefinitions,
  getTrackedRandomState,
  traceCombatStateWithPolicy,
}

export type {
  PolicySimulationReport,
  PolicyRunSummary,
  RunArchetypeSimulationPlan,
  RunProgressionContinuationContext,
  RunProgressionSimulationOptions,
  RunProgressionTrainingLoadout,
  RunProgressionSimulationReport,
  SafeZoneCheckpointSummary,
  SimulationFailureSummary,
}

function buildArchetypeSimulationPlan(
  harness: ReturnType<typeof createQuietAppHarness>,
  classId: string,
  input?: Partial<RunArchetypeSimulationPlan> | null
): RunArchetypeSimulationPlan | null {
  const targetArchetypeId = String(input?.targetArchetypeId || "").trim()
  if (!targetArchetypeId) {
    return null
  }
  const catalogEntry = harness.browserWindow.ROUGE_REWARD_ENGINE
    ?.getArchetypeCatalog?.(classId)?.[classId]?.[targetArchetypeId] || null
  if (!catalogEntry) {
    throw new Error(`Unknown archetype target ${targetArchetypeId} for class ${classId}.`)
  }
  return {
    targetArchetypeId,
    targetArchetypeLabel: String(input?.targetArchetypeLabel || catalogEntry.label || targetArchetypeId),
    targetBand: input?.targetBand === "flagship" ? "flagship" : "secondary",
    commitmentMode: (input?.commitmentMode || "committed") as ArchetypeCommitmentMode,
    commitAct: clamp(Number(input?.commitAct || 2), 1, 5),
    commitCheckpoint: (input?.commitCheckpoint || "first_safe_zone") as ArchetypeCommitCheckpoint,
    commitmentLocked: Boolean(input?.commitmentLocked),
    commitmentSatisfied: Boolean(input?.commitmentSatisfied),
    committedByCheckpoint: Boolean(input?.committedByCheckpoint),
    committedAtCheckpointId: String(input?.committedAtCheckpointId || ""),
    postCommitCheckpointCount: Number(input?.postCommitCheckpointCount || 0),
    driftCountAfterCommit: Number(input?.driftCountAfterCommit || 0),
    fallbackDebtCardCount: Number(input?.fallbackDebtCardCount || 0),
    fallbackDebtWeight: Number(input?.fallbackDebtWeight || 0),
    fallbackWeaponDebt: Boolean(input?.fallbackWeaponDebt),
    exitedFallbackGear: Boolean(input?.exitedFallbackGear),
    laneIntegrityByCheckpoint: Array.isArray(input?.laneIntegrityByCheckpoint)
      ? input!.laneIntegrityByCheckpoint!.map((entry) => ({
          checkpointId: String(entry.checkpointId || ""),
          actNumber: Number(entry.actNumber || 0),
          laneIntegrity: Number(entry.laneIntegrity || 0),
        }))
      : [],
  }
}

function getSimulationAssumptions(archetypePlan: RunArchetypeSimulationPlan | null) {
  const assumptions = [...getPolicySimulationAssumptions()]
  if (archetypePlan?.targetArchetypeId) {
    assumptions.push(
      `Archetype testing is ${archetypePlan.commitmentMode}; target lane ${archetypePlan.targetArchetypeLabel} is preferred in Act I and locked by Act ${archetypePlan.commitAct} ${archetypePlan.commitCheckpoint.replaceAll("_", " ")}.`
    )
  }
  return assumptions
}

export function applySimulationTrainingLoadout(
  harness: ReturnType<typeof createQuietAppHarness>,
  state: AppState,
  trainingLoadout?: RunProgressionTrainingLoadout | null
) {
  if (!state.run || !trainingLoadout) {
    return
  }
  const progressionApi = harness.browserWindow.ROUGE_RUN_PROGRESSION
  if (!progressionApi) {
    return
  }
  const run = state.run
  const favoredTreeId = String(trainingLoadout.favoredTreeId || "")
  const treeRanks = run.progression?.classProgression?.treeRanks || {}
  if (favoredTreeId && Number(treeRanks[favoredTreeId] || 0) > 0) {
    run.progression.classProgression.favoredTreeId = favoredTreeId
  }

  progressionApi.syncUnlockedClassSkills(run, harness.content)

  const requestedUnlocks = [
    ...(Array.isArray(trainingLoadout.unlockedSkillIds) ? trainingLoadout.unlockedSkillIds : []),
    ...Object.values(trainingLoadout.equippedSkillIds || {}),
  ].filter(Boolean)

  requestedUnlocks.forEach((skillId) => {
    progressionApi.unlockTrainingSkill(run, harness.content, skillId)
  })

  ;(["slot2", "slot3"] as RunSkillBarSlotKey[]).forEach((slotKey) => {
    const skillId = trainingLoadout.equippedSkillIds?.[slotKey]
    if (!skillId) {
      return
    }
    progressionApi.unlockTrainingSkill(run, harness.content, skillId)
    progressionApi.equipTrainingSkill(run, harness.content, slotKey, skillId)
  })

  if (favoredTreeId && Number(treeRanks[favoredTreeId] || 0) > 0) {
    run.progression.classProgression.favoredTreeId = favoredTreeId
  }
  progressionApi.syncUnlockedClassSkills(run, harness.content)
}

function syncCommittedArchetypePreference(
  state: AppState,
  archetypePlan: RunArchetypeSimulationPlan | null
) {
  if (!archetypePlan?.targetArchetypeId || archetypePlan.commitmentMode !== "committed" || !state.run?.progression?.classProgression) {
    return
  }
  const classProgression = state.run.progression.classProgression
  classProgression.favoredTreeId = archetypePlan.targetArchetypeId
  const currentTargetRank = Number(classProgression.treeRanks?.[archetypePlan.targetArchetypeId] || 0)
  const targetRankFloor = archetypePlan.commitmentLocked ? 4 : 2
  if (!classProgression.treeRanks) {
    classProgression.treeRanks = {}
  }
  if (currentTargetRank < targetRankFloor) {
    classProgression.treeRanks[archetypePlan.targetArchetypeId] = targetRankFloor
  }
}

function updateArchetypeCommitmentLock(
  state: AppState,
  archetypePlan: RunArchetypeSimulationPlan | null,
  afterRewardClaim = false
) {
  if (!archetypePlan?.targetArchetypeId || archetypePlan.commitmentMode !== "committed" || !state.run) {
    return
  }
  if (archetypePlan.commitmentLocked) {
    return
  }
  const actNumber = Number(state.run.actNumber || 1)
  if (actNumber < archetypePlan.commitAct) {
    return
  }
  if (archetypePlan.commitCheckpoint === "first_reward" && !afterRewardClaim) {
    return
  }
  archetypePlan.commitmentLocked = true
}

function updateArchetypeCommitmentProgress(
  harness: ReturnType<typeof createQuietAppHarness>,
  run: RunState,
  checkpoint: SafeZoneCheckpointSummary | null,
  archetypePlan: RunArchetypeSimulationPlan | null
) {
  if (!archetypePlan?.targetArchetypeId) {
    return
  }
  const progressionSummary = harness.runFactory.getProgressionSummary(run, harness.content)
  const laneMetrics = buildArchetypeLaneMetrics(harness, run, archetypePlan.targetArchetypeId)
  const commitmentSatisfied =
    (progressionSummary?.dominantArchetypeId || "") === archetypePlan.targetArchetypeId ||
    Number(laneMetrics?.laneIntegrity || 0) >= 0.6

  if (commitmentSatisfied) {
    archetypePlan.commitmentSatisfied = true
  }

  if (!checkpoint) {
    return
  }

  if (checkpoint.checkpointKind === "pre_boss") {
    return
  }

  if (!archetypePlan.laneIntegrityByCheckpoint.some((entry) => entry.checkpointId === checkpoint.checkpointId)) {
    archetypePlan.laneIntegrityByCheckpoint.push({
      checkpointId: checkpoint.checkpointId,
      actNumber: checkpoint.actNumber,
      laneIntegrity: Number(laneMetrics?.laneIntegrity || 0),
    })
  }

  if (checkpoint.actNumber < archetypePlan.commitAct) {
    return
  }

  if (!archetypePlan.committedAtCheckpointId) {
    archetypePlan.fallbackDebtCardCount = Number(laneMetrics?.offLaneCardCount || 0)
    archetypePlan.fallbackDebtWeight = Number(laneMetrics?.offLaneCardWeight || 0)
    archetypePlan.fallbackWeaponDebt = !Boolean(laneMetrics?.alignedWeapon)
  }

  archetypePlan.postCommitCheckpointCount += 1
  if ((progressionSummary?.dominantArchetypeId || "") !== archetypePlan.targetArchetypeId) {
    archetypePlan.driftCountAfterCommit += 1
  }
  if (!archetypePlan.committedByCheckpoint) {
    archetypePlan.committedByCheckpoint = commitmentSatisfied
    if (commitmentSatisfied) {
      archetypePlan.committedAtCheckpointId = checkpoint.checkpointId
    }
  } else if (laneMetrics?.alignedWeapon) {
    archetypePlan.exitedFallbackGear = true
  }
}

function chooseBestRewardChoice(
  harness: ReturnType<typeof createQuietAppHarness>,
  run: RunState,
  _profile: ProfileState,
  reward: RunReward,
  policy: BuildPolicyDefinition,
  archetypePlan?: RunArchetypeSimulationPlan | null
) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T
  const choices = Array.isArray(reward.choices) ? reward.choices : []
  let bestChoice = choices[0] || null
  let bestScore = Number.NEGATIVE_INFINITY

  function getCommittedChoiceBias(choice: RewardChoice, runClone: RunState) {
    if (!archetypePlan?.targetArchetypeId || archetypePlan.commitmentMode !== "committed") {
      return 0
    }

    const rewardEngine = harness.browserWindow.ROUGE_REWARD_ENGINE
    const archetypeRuntime = harness.browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES
    const targetEntry = rewardEngine?.getArchetypeCatalog?.(run.classId)?.[run.classId]?.[archetypePlan.targetArchetypeId] || null
    if (!rewardEngine || !archetypeRuntime || !targetEntry) {
      return 0
    }

    const commitLocked = Boolean(archetypePlan.commitmentLocked)
    const primaryTrees = Array.isArray(targetEntry.primaryTrees) ? targetEntry.primaryTrees : []
    const supportTrees = Array.isArray(targetEntry.supportTrees) ? targetEntry.supportTrees : []
    const targetFamilies = Array.isArray(targetEntry.weaponFamilies) ? targetEntry.weaponFamilies : []
    const nextWeaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(runClone.loadout?.weapon?.itemId || "", harness.content) || ""
    let total = 0

    ;(Array.isArray(choice.effects) ? choice.effects : []).forEach((effect) => {
      if (effect.kind === "add_card") {
        const treeId = archetypeRuntime.getCardTree?.(effect.cardId || "") || ""
        if (primaryTrees.includes(treeId)) {
          total += commitLocked ? 180 : 220
          return
        }
        if (supportTrees.includes(treeId)) {
          total += commitLocked ? 65 : 90
          return
        }
        total -= commitLocked ? 150 : 45
        return
      }

      if (effect.kind === "upgrade_card") {
        const baseTreeId = archetypeRuntime.getCardTree?.(effect.fromCardId || effect.toCardId || "") || ""
        if (primaryTrees.includes(baseTreeId)) {
          total += commitLocked ? 150 : 185
          return
        }
        if (supportTrees.includes(baseTreeId)) {
          total += commitLocked ? 55 : 80
          return
        }
        total -= commitLocked ? 120 : 35
        return
      }

      if (effect.kind === "class_point") {
        total += commitLocked ? 18 : 28
      }
    })

    if (targetFamilies.length > 0 && nextWeaponFamily) {
      total += targetFamilies.includes(nextWeaponFamily)
        ? (commitLocked ? 110 : 135)
        : (commitLocked ? -125 : -32)
    }

    return total
  }

  choices.forEach((choice) => {
    const runClone = cloneRun(harness, run)
    const rewardClone = deepClone(reward)
    const applyResult = harness.runFactory.applyReward(runClone, rewardClone, choice.id, harness.content)
    if (!applyResult.ok) {
      return
    }

    const assumeFullResources = reward.endsAct || reward.clearsZone
    if (reward.endsAct && runClone.currentActIndex < runClone.acts.length - 1) {
      harness.runFactory.advanceToNextAct(runClone, harness.content)
    }

    let score = evaluateRunScore(harness, runClone, policy, {
      assumeFullResources,
      archetypePlan: archetypePlan || null,
    }) + getCommittedChoiceBias(choice, runClone)

    // Penalize card-adding choices when deck is already bloated
    const addsCard = (Array.isArray(choice.effects) ? choice.effects : []).some((e) => e.kind === "add_card")
    if (addsCard && run.deck.length >= 22) {
      score -= (run.deck.length - 20) * policy.deckBloatPenalty * 2.5
    }
    if (addsCard && run.deck.length >= 28) {
      score -= (run.deck.length - 26) * policy.deckBloatPenalty * 4
    }

    if (score > bestScore) {
      bestScore = score
      bestChoice = choice
    }
  })

  return bestChoice
}

function countSelectedZone(progress: PolicyProgressSummary, zone: ZoneState | null) {
  if (!zone) {
    return
  }
  incrementCount(progress.zoneKindCounts, zone.kind || "unknown")
  incrementCount(progress.zoneRoleCounts, zone.zoneRole || "unknown")
  incrementCount(progress.nodeTypeCounts, zone.nodeType || zone.kind || "unknown")
}

function countChoice(progress: PolicyProgressSummary, reward: RunReward | null, choice: RewardChoice | null) {
  if (reward) {
    incrementCount(progress.rewardKindCounts, reward.kind || "unknown")
  }
  if (!choice) {
    return
  }
  incrementCount(progress.actionCounts, choice.kind || "unknown")
  incrementCount(progress.rewardRoleCounts, choice.cardRewardRole || "none")
  incrementCount(progress.strategyRoleCounts, choice.strategyRole || "none")
  ;(Array.isArray(choice.effects) ? choice.effects : []).forEach((effect) => {
    incrementCount(progress.rewardEffectCounts, effect.kind || "unknown")
  })
}

function countTownAction(progress: PolicyProgressSummary, actionId: string) {
  if (!actionId) {
    return
  }
  incrementCount(progress.townActionCounts, actionId)
}

function getZoneUnlockValue(run: RunState, zone: ZoneState) {
  const currentAct = run.acts[run.currentActIndex]
  return currentAct.zones.reduce((sum, candidate) => {
    return !candidate.cleared && Array.isArray(candidate.prerequisites) && candidate.prerequisites.includes(zone.id) ? sum + 1 : sum
  }, 0)
}

function chooseNextZone(run: RunState, reachableZones: ZoneState[]) {
  const nonBoss = reachableZones.filter((zone) => zone.kind !== "boss")
  const pool = nonBoss.length > 0 ? nonBoss : reachableZones
  return pool
    .slice()
    .sort((left, right) => {
      const leftWorldNodeScore =
        (left.kind === "quest" ? 500 : 0) +
        (left.kind === "shrine" ? 470 : 0) +
        (left.kind === "event" ? 440 : 0) +
        (left.kind === "opportunity" ? 410 : 0)
      const rightWorldNodeScore =
        (right.kind === "quest" ? 500 : 0) +
        (right.kind === "shrine" ? 470 : 0) +
        (right.kind === "event" ? 440 : 0) +
        (right.kind === "opportunity" ? 410 : 0)
      const leftScore =
        leftWorldNodeScore +
        (left.kind === "miniboss" ? 320 : 0) +
        (left.zoneRole === "branchBattle" ? 280 : 0) +
        (left.zoneRole === "opening" ? 220 : 0) +
        getZoneUnlockValue(run, left) * 30 -
        left.encountersCleared * 4
      const rightScore =
        rightWorldNodeScore +
        (right.kind === "miniboss" ? 320 : 0) +
        (right.zoneRole === "branchBattle" ? 280 : 0) +
        (right.zoneRole === "opening" ? 220 : 0) +
        getZoneUnlockValue(run, right) * 30 -
        right.encountersCleared * 4
      return rightScore - leftScore || left.title.localeCompare(right.title)
    })[0]
}

export function createSimulationState(
  harness: ReturnType<typeof createQuietAppHarness>,
  classId: string,
  seed: number,
  options: {
    trainingLoadout?: RunProgressionTrainingLoadout | null
  } = {}
) {
  const mercenaryId = getMercenaryIdForClass(classId)
  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: createSeededRandom(seed),
  })
  harness.appEngine.startCharacterSelect(state)
  harness.appEngine.setSelectedClass(state, classId)
  harness.appEngine.setSelectedMercenary(state, mercenaryId)
  const startResult = harness.appEngine.startRun(state)
  if (!startResult.ok || !state.run) {
    throw new Error(startResult.message || `Could not start run for class ${classId}.`)
  }
  applySimulationTrainingLoadout(harness, state, options.trainingLoadout)
  return state
}

export function createSimulationStateFromSnapshot(
  harness: ReturnType<typeof createQuietAppHarness>,
  serializedSnapshot: string,
  randomSeed: number,
  randomState?: number
) {
  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: createTrackedRandom(randomSeed, randomState),
  })
  const result = harness.appEngine.loadRunSnapshot(state, serializedSnapshot)
  if (!result.ok || !state.run) {
    throw new Error(result.message || "Could not restore simulation snapshot.")
  }
  return state
}

export function runProgressionPolicyFromState(
  harness: ReturnType<typeof createQuietAppHarness>,
  state: AppState,
  classId: string,
  policy: BuildPolicyDefinition,
  throughActNumber: number,
  probeRuns: number,
  maxCombatTurns: number,
  seedOffset = 0,
  continuation?: Partial<RunProgressionContinuationContext>,
  hooks?: PolicySimulationHooks,
  archetypePlanInput?: Partial<RunArchetypeSimulationPlan> | null,
  checkpointProbeProfile: CheckpointProbeProfile = "default",
  trainingLoadoutInput: RunProgressionTrainingLoadout | null = null
): PolicySimulationReport {
  const safeZoneMaxIterations = 12
  const PHASES = harness.appEngine.PHASES
  const checkpoints = Array.isArray(continuation?.checkpoints) ? continuation.checkpoints.map((entry) => ({ ...entry })) : []
  const progress = continuation?.progress
    ? JSON.parse(JSON.stringify(continuation.progress)) as PolicyProgressSummary
    : createEmptyPolicyProgressSummary()
  let failure: SimulationFailureSummary | null = continuation?.failure ? { ...continuation.failure } : null
  let lastEncounterContext: SimulationFailureSummary | null = continuation?.lastEncounterContext
    ? { ...continuation.lastEncounterContext }
    : null
  const archetypePlan = continuation?.archetypePlan
    ? buildArchetypeSimulationPlan(harness, classId, continuation.archetypePlan)
    : buildArchetypeSimulationPlan(harness, classId, archetypePlanInput)
  const requestedTrainingLoadout = continuation?.trainingLoadout || trainingLoadoutInput || null
  let blockedTownRecoverySignature = ""

  const getTownRecoverySignature = () => {
    if (!state.run) {
      return ""
    }
    return [
      state.run.actNumber,
      Number(state.run.hero.currentLife || 0),
      Number(state.run.hero.maxLife || 0),
      Number(state.run.belt.current || 0),
      Number(state.run.mercenary.currentLife || 0),
      Number(state.run.gold || 0),
    ].join("|")
  }

  const continuationContext = () => cloneContinuationContext({
    policyId: policy.id,
    throughActNumber,
    probeRuns,
    maxCombatTurns,
    seedOffset,
    trainingLoadout: requestedTrainingLoadout ? JSON.parse(JSON.stringify(requestedTrainingLoadout)) as RunProgressionTrainingLoadout : null,
    progress,
    checkpoints,
    failure,
    lastEncounterContext,
    archetypePlan: archetypePlan ? JSON.parse(JSON.stringify(archetypePlan)) as RunArchetypeSimulationPlan : null,
  })

  const reportOperation = (
    stage: "started" | "completed",
    operation:
      | "optimize_safe_zone"
      | "build_checkpoint"
      | "sync_encounter_outcome"
      | "choose_reward"
      | "claim_reward"
      | "leave_safe_zone"
      | "return_to_safe_zone"
      | "select_zone"
      | "continue_act_transition",
    elapsedMs: number,
    detail = ""
  ) => {
    hooks?.onOperationProgress?.({
      classId,
      policy,
      seedOffset,
      stage,
      operation,
      actNumber: Number(state.run?.actNumber || failure?.actNumber || 0),
      phase: String(state.phase || ""),
      elapsedMs,
      detail,
    })
  }

  if (!continuation) {
    syncCommittedArchetypePreference(state, archetypePlan)
    applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
    updateArchetypeCommitmentLock(state, archetypePlan)
    reportOperation("started", "optimize_safe_zone", 0, "initial")
    const optimizeStartedAt = Date.now()
    optimizeSafeZoneRun(harness, state.run as RunState, state.profile, policy, safeZoneMaxIterations, archetypePlan, {
      onTownActionApplied: (actionId) => countTownAction(progress, actionId),
    })
    applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
    reportOperation("completed", "optimize_safe_zone", Date.now() - optimizeStartedAt, "initial")
    reportOperation("started", "build_checkpoint", 0, "initial")
    const checkpointStartedAt = Date.now()
    const initialCheckpoint = buildCheckpointSummary(
      harness,
      state.run as RunState,
      state.profile,
      policy,
      state.run!.actNumber,
      progress,
      probeRuns,
      maxCombatTurns,
      archetypePlan,
      {
        probeProfile: checkpointProbeProfile,
      }
    )
    reportOperation("completed", "build_checkpoint", Date.now() - checkpointStartedAt, "initial")
    updateArchetypeCommitmentProgress(harness, state.run as RunState, initialCheckpoint, archetypePlan)
    checkpoints.push(initialCheckpoint)
    hooks?.onInitialized?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      continuationContext: continuationContext(),
    })
    hooks?.onCheckpoint?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      checkpoint: initialCheckpoint,
      continuationContext: continuationContext(),
    })
    hooks?.onCheckpointLite?.({
      policy,
      classId,
      seedOffset,
      checkpoint: initialCheckpoint,
    })
  } else {
    syncCommittedArchetypePreference(state, archetypePlan)
    applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
    updateArchetypeCommitmentLock(state, archetypePlan)
    hooks?.onInitialized?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      continuationContext: continuationContext(),
    })
  }

  while (state.run) {
    if (state.phase === PHASES.SAFE_ZONE) {
      if (state.run.actNumber >= throughActNumber && throughActNumber < 5) {
        const report: PolicySimulationReport = {
          policyId: policy.id,
          policyLabel: policy.label,
          description: policy.description,
          assumptions: getSimulationAssumptions(archetypePlan),
          outcome: "reached_checkpoint",
          finalActNumber: state.run.actNumber,
          finalLevel: state.run.level,
          checkpoints,
          failure: null,
          summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress, checkpoints, archetypePlan),
        }
        hooks?.onRunComplete?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          report,
          continuationContext: continuationContext(),
        })
        return report
      }

      reportOperation("started", "leave_safe_zone", 0, `act ${state.run.actNumber}`)
      const leaveStartedAt = Date.now()
      const leaveResult = harness.appEngine.leaveSafeZone(state)
      reportOperation("completed", "leave_safe_zone", Date.now() - leaveStartedAt, leaveResult.ok ? `act ${state.run?.actNumber || 0}` : leaveResult.message || "failed")
      if (!leaveResult.ok) {
        throw new Error(leaveResult.message || "Could not leave safe zone.")
      }
      continue
    }

    if (state.phase === PHASES.WORLD_MAP) {
      const needsTown =
        state.run.hero.currentLife <= Math.ceil(state.run.hero.maxLife * 0.5) ||
        state.run.belt.current <= 0 ||
        state.run.mercenary.currentLife <= 0
      const townRecoverySignature = getTownRecoverySignature()
      if (!needsTown) {
        blockedTownRecoverySignature = ""
      }
      if (needsTown && blockedTownRecoverySignature === townRecoverySignature) {
        reportOperation("completed", "return_to_safe_zone", 0, "skipped repeat town recovery")
      }
      if (needsTown && blockedTownRecoverySignature !== townRecoverySignature) {
        reportOperation("started", "return_to_safe_zone", 0, `act ${state.run.actNumber}`)
        const returnStartedAt = Date.now()
        const returnResult = harness.appEngine.returnToSafeZone(state)
        reportOperation("completed", "return_to_safe_zone", Date.now() - returnStartedAt, returnResult.ok ? `act ${state.run?.actNumber || 0}` : returnResult.message || "failed")
        if (returnResult.ok) {
          syncCommittedArchetypePreference(state, archetypePlan)
          applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
          updateArchetypeCommitmentLock(state, archetypePlan)
          reportOperation("started", "optimize_safe_zone", 0, "town return")
          const optimizeStartedAt = Date.now()
          optimizeSafeZoneRun(harness, state.run, state.profile, policy, safeZoneMaxIterations, archetypePlan, {
            onTownActionApplied: (actionId) => countTownAction(progress, actionId),
          })
          applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
          reportOperation("completed", "optimize_safe_zone", Date.now() - optimizeStartedAt, "town return")
          const postRecoverySignature = getTownRecoverySignature()
          blockedTownRecoverySignature = postRecoverySignature === townRecoverySignature ? postRecoverySignature : ""
          continue
        }
        blockedTownRecoverySignature = townRecoverySignature
      }

      const reachableZones = harness.runFactory.getReachableZones(state.run)
      if (reachableZones.length === 0) {
        throw new Error(`No reachable zones remain in Act ${state.run.actNumber}.`)
      }
      let selectedZone: ZoneState | null = null
      let lastSelectMessage = ""
      const candidates = reachableZones.slice()
      while (candidates.length > 0 && !selectedZone) {
        const nextZone = chooseNextZone(state.run, candidates)
        reportOperation("started", "select_zone", 0, nextZone.title)
        const selectStartedAt = Date.now()
        const selectResult = harness.appEngine.selectZone(state, nextZone.id)
        reportOperation("completed", "select_zone", Date.now() - selectStartedAt, selectResult.ok ? nextZone.title : selectResult.message || nextZone.title)
      if (selectResult.ok) {
        selectedZone = nextZone
        countSelectedZone(progress, selectedZone)
        break
        }
        lastSelectMessage = selectResult.message || `Could not select zone ${nextZone.id}.`
        const candidateIndex = candidates.findIndex((zone) => zone.id === nextZone.id)
        if (candidateIndex >= 0) {
          candidates.splice(candidateIndex, 1)
        } else {
          break
        }
      }
      if (!selectedZone) {
        throw new Error(lastSelectMessage || `Could not select any reachable zone in Act ${state.run.actNumber}.`)
      }
      if (state.phase === PHASES.ENCOUNTER) {
        const encounter = harness.content.encounterCatalog[state.run.activeEncounterId]
        if (selectedZone.kind === "boss") {
          reportOperation("started", "build_checkpoint", 0, `act ${state.run.actNumber} pre-boss`)
          const checkpointStartedAt = Date.now()
          const preBossCheckpoint = buildCheckpointSummary(
            harness,
            state.run,
            state.profile,
            policy,
            state.run.actNumber,
            progress,
            probeRuns,
            maxCombatTurns,
            archetypePlan,
            {
              checkpointKind: "pre_boss",
              checkpointId: `act_${state.run.actNumber}_pre_boss`,
              label: `Act ${state.run.actNumber} Pre-Boss`,
              probeEntries: [
                {
                  encounterId: state.run.activeEncounterId,
                  encounterName: encounter?.name || state.run.activeEncounterId,
                  zoneTitle: selectedZone.title,
                  kind: "boss",
                },
              ],
            }
          )
          reportOperation("completed", "build_checkpoint", Date.now() - checkpointStartedAt, `act ${state.run.actNumber} pre-boss`)
          checkpoints.push(preBossCheckpoint)
          hooks?.onCheckpointLite?.({
            policy,
            classId,
            seedOffset,
            checkpoint: preBossCheckpoint,
          })
          hooks?.onCheckpoint?.({
            state,
            harness,
            policy,
            classId,
            seedOffset,
            checkpoint: preBossCheckpoint,
            continuationContext: continuationContext(),
          })
        }
        lastEncounterContext = {
          actNumber: state.run.actNumber,
          zoneTitle: selectedZone.title,
          encounterId: state.run.activeEncounterId,
          encounterName: encounter?.name || state.run.activeEncounterId,
          kind: selectedZone.kind === "boss" ? "boss" : selectedZone.kind === "miniboss" ? "miniboss" : "battle",
          zoneKind: selectedZone.kind || "",
          zoneRole: selectedZone.zoneRole || "",
          nodeType: selectedZone.nodeType || "",
        }
        hooks?.onEncounterStartLite?.({
          policy,
          classId,
          seedOffset,
          encounter: { ...lastEncounterContext },
        })
        hooks?.onEncounterStart?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          encounter: { ...lastEncounterContext },
          continuationContext: continuationContext(),
        })
      }
      continue
    }

    if (state.phase === PHASES.ENCOUNTER) {
      const currentEncounterContext = lastEncounterContext ? { ...lastEncounterContext } : null
      let combatResult: ReturnType<typeof playStateCombat> = null
      if (hooks?.autoWinCombat && state.combat) {
        // Auto-win: force victory without running combat simulation
        state.combat.enemies.forEach((enemy: CombatEnemyState) => {
          enemy.life = 0
          enemy.alive = false
        })
        state.combat.outcome = "victory" as CombatOutcome
      } else {
        combatResult = playStateCombat(
          harness,
          state,
          policy,
          maxCombatTurns,
          hooks?.onEncounterProgress && currentEncounterContext
            ? {
                onProgress: (progressEvent) => {
                  hooks.onEncounterProgress?.({
                    classId,
                    policy,
                    seedOffset,
                    encounter: currentEncounterContext,
                    stage: progressEvent.stage,
                    turn: progressEvent.turn,
                    actionIndex: progressEvent.actionIndex,
                    candidateCount: progressEvent.candidateCount,
                    bestScore: progressEvent.bestScore,
                    stepElapsedMs: progressEvent.stepElapsedMs,
                    encounterElapsedMs: progressEvent.encounterElapsedMs,
                    detail: progressEvent.detail,
                  })
                },
              }
            : undefined
        )
      }
      const encounterMetric = buildEncounterMetric(harness, state.run, lastEncounterContext, combatResult)
      if (encounterMetric) {
        progress.encounterResults.push(encounterMetric)
      }
      reportOperation("started", "sync_encounter_outcome", 0, lastEncounterContext?.encounterName || "")
      const syncStartedAt = Date.now()
      const outcomeResult = harness.appEngine.syncEncounterOutcome(state)
      reportOperation("completed", "sync_encounter_outcome", Date.now() - syncStartedAt, lastEncounterContext?.encounterName || "")
      if (!outcomeResult.ok) {
        throw new Error(outcomeResult.message || "Could not sync encounter outcome.")
      }
      if (state.phase === PHASES.RUN_FAILED) {
        failure = lastEncounterContext
        const report: PolicySimulationReport = {
          policyId: policy.id,
          policyLabel: policy.label,
          description: policy.description,
          assumptions: getSimulationAssumptions(archetypePlan),
          outcome: "run_failed",
          finalActNumber: failure?.actNumber || state.run?.actNumber || 1,
          finalLevel: state.run?.level || 1,
          checkpoints,
          failure,
          summary: buildPolicyRunSummary(harness, state.run as RunState, state.profile, policy, progress, checkpoints, archetypePlan),
        }
        hooks?.onRunFailure?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          failure,
          report,
          continuationContext: continuationContext(),
        })
        return report
      }
      continue
    }

    if (state.phase === PHASES.REWARD) {
      const reward = state.run.pendingReward
      if (!reward) {
        throw new Error("Reward phase is active without a pending reward.")
      }
      syncCommittedArchetypePreference(state, archetypePlan)
      reportOperation("started", "choose_reward", 0, reward.title)
      const chooseRewardStartedAt = Date.now()
      const primaryChoice = chooseBestRewardChoice(harness, state.run, state.profile, reward, policy, archetypePlan)
      reportOperation(
        "completed",
        "choose_reward",
        Date.now() - chooseRewardStartedAt,
        `${reward.title} -> ${primaryChoice?.title || primaryChoice?.id || "none"}`
      )
      const orderedChoices = [
        primaryChoice,
        ...((Array.isArray(reward.choices) ? reward.choices : []).filter((choice) => choice.id !== primaryChoice?.id)),
      ].filter(Boolean) as RewardChoice[]
      let claimed = false
      let lastClaimMessage = ""
      let lastChoiceSummary = ""
      for (const choice of orderedChoices) {
        let attempts = 0
        while (attempts <= ((state.run.inventory?.carried?.length || 0) + 1)) {
          reportOperation("started", "claim_reward", 0, `${reward.title} -> ${choice?.title || choice?.id || "choice"}`)
          const claimStartedAt = Date.now()
          const claimResult = harness.appEngine.claimRewardAndAdvance(state, choice?.id || "")
          reportOperation(
            "completed",
            "claim_reward",
            Date.now() - claimStartedAt,
            claimResult.ok
              ? `${reward.title} -> ${choice?.title || choice?.id || "choice"}`
              : claimResult.message || `${reward.title} -> ${choice?.title || choice?.id || "choice"}`
          )
          if (claimResult.ok) {
            countChoice(progress, reward, choice)
            updateArchetypeCommitmentLock(state, archetypePlan, true)
            claimed = true
            break
          }
          lastClaimMessage = claimResult.message || "Could not claim reward."
          lastChoiceSummary = `${reward.title} -> ${choice?.title || choice?.id || "choice"} (${(choice?.effects || []).map((effect) => effect.kind).join(", ")})`
          if (!lastClaimMessage.includes("Not enough inventory space")) {
            console.error(`Reward claim failed: ${lastClaimMessage} [${lastChoiceSummary}]`)
            break
          }
          if (!discardLowestValueCarriedEntry(harness, state.run)) {
            break
          }
          attempts += 1
        }
        if (claimed) {
          break
        }
      }
      if (!claimed) {
        throw new Error(`${lastClaimMessage || "Could not claim reward."} [${lastChoiceSummary}]`)
      }
      continue
    }

    if (state.phase === PHASES.ACT_TRANSITION) {
      if (state.run?.guide?.overlayKind === "reward") {
        const guideResult = harness.appEngine.continueActGuide(state)
        if (!guideResult.ok) {
          throw new Error(guideResult.message || "Could not dismiss act guide.")
        }
        if (state.run?.guide?.overlayKind === "reward") {
          state.run.guide.overlayKind = ""
          state.run.guide.targetActNumber = 0
        }
      }
      reportOperation("started", "continue_act_transition", 0, `act ${state.run?.actNumber || 0}`)
      const continueStartedAt = Date.now()
      const continueResult = harness.appEngine.continueActTransition(state)
      reportOperation("completed", "continue_act_transition", Date.now() - continueStartedAt, continueResult.ok ? `act ${state.run?.actNumber || 0}` : continueResult.message || "failed")
      if (!continueResult.ok) {
        throw new Error(continueResult.message || "Could not continue act transition.")
      }
      syncCommittedArchetypePreference(state, archetypePlan)
      applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
      updateArchetypeCommitmentLock(state, archetypePlan)
      reportOperation("started", "optimize_safe_zone", 0, "act transition")
      const optimizeStartedAt = Date.now()
      optimizeSafeZoneRun(harness, state.run, state.profile, policy, 24, archetypePlan, {
        onTownActionApplied: (actionId) => countTownAction(progress, actionId),
      })
      applySimulationTrainingLoadout(harness, state, requestedTrainingLoadout)
      reportOperation("completed", "optimize_safe_zone", Date.now() - optimizeStartedAt, "act transition")
      reportOperation("started", "build_checkpoint", 0, `act ${state.run.actNumber}`)
      const checkpointStartedAt = Date.now()
      const checkpoint = buildCheckpointSummary(
        harness,
        state.run,
        state.profile,
        policy,
        state.run.actNumber,
        progress,
        probeRuns,
        maxCombatTurns,
        archetypePlan,
        {
          probeProfile: checkpointProbeProfile,
        }
      )
      reportOperation("completed", "build_checkpoint", Date.now() - checkpointStartedAt, `act ${state.run.actNumber}`)
      updateArchetypeCommitmentProgress(harness, state.run, checkpoint, archetypePlan)
      checkpoints.push(checkpoint)
      hooks?.onCheckpointLite?.({
        policy,
        classId,
        seedOffset,
        checkpoint,
      })
      hooks?.onCheckpoint?.({
        state,
        harness,
        policy,
        classId,
        seedOffset,
        checkpoint,
        continuationContext: continuationContext(),
      })
      continue
    }

    if (state.phase === PHASES.RUN_COMPLETE) {
      const report: PolicySimulationReport = {
        policyId: policy.id,
        policyLabel: policy.label,
        description: policy.description,
          assumptions: getSimulationAssumptions(archetypePlan),
        outcome: "run_complete",
        finalActNumber: state.run.actNumber,
        finalLevel: state.run.level,
        checkpoints,
        failure: null,
        summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress, checkpoints, archetypePlan),
      }
      hooks?.onRunComplete?.({
        state,
        harness,
        policy,
        classId,
        seedOffset,
        report,
        continuationContext: continuationContext(),
      })
      return report
    }

    throw new Error(`Unsupported simulation phase: ${state.phase}`)
  }

  throw new Error("Simulation exited without an active run.")
}

function simulatePolicyRun(
  harness: ReturnType<typeof createQuietAppHarness>,
  classId: string,
  policy: BuildPolicyDefinition,
  throughActNumber: number,
  probeRuns: number,
  maxCombatTurns: number,
  seedOffset = 0,
  hooks?: PolicySimulationHooks,
  archetypePlan?: Partial<RunArchetypeSimulationPlan> | null,
  checkpointProbeProfile: CheckpointProbeProfile = "default"
): PolicySimulationReport {
  const seed = createProgressionSimulationSeed(classId, policy.id, throughActNumber, seedOffset)
  const state = createSimulationState(harness, classId, seed)
  return runProgressionPolicyFromState(
    harness,
    state,
    classId,
    policy,
    throughActNumber,
    probeRuns,
    maxCombatTurns,
    seedOffset,
    undefined,
    hooks,
    archetypePlan,
    checkpointProbeProfile
  )
}

export function runProgressionEncounterTrace(options: {
  classId?: string
  policyId?: string
  targetActNumber?: number
  encounterId?: string
  seedOffset?: number
  maxCombatTurns?: number
} = {}) {
  const classId = String(options.classId || "druid")
  const targetActNumber = clamp(options.targetActNumber || 4, 1, 5)
  const encounterId = String(options.encounterId || `act_${targetActNumber}_boss`)
  const seedOffset = Math.max(0, options.seedOffset || 0)
  const maxCombatTurns = Math.max(12, options.maxCombatTurns || 36)
  const basePolicy = getPolicyDefinitions([options.policyId || "aggressive"])[0]
  const policy = applyClassStrategy(basePolicy, classId)
  const seed = hashString([classId, policy.id, "5", String(seedOffset)].join("|"))
  const harness = createQuietAppHarness()
  const state = createSimulationState(harness, classId, seed)
  const PHASES = harness.appEngine.PHASES

  optimizeSafeZoneRun(harness, state.run as RunState, state.profile, policy)

  let encounterContext: { actNumber: number; zoneTitle: string; encounterId: string; encounterName: string } | null = null

  while (state.run) {
    if (state.phase === PHASES.SAFE_ZONE) {
      const leaveResult = harness.appEngine.leaveSafeZone(state)
      if (!leaveResult.ok) {
        throw new Error(leaveResult.message || "Could not leave safe zone.")
      }
      continue
    }

    if (state.phase === PHASES.WORLD_MAP) {
      const needsTown =
        state.run.hero.currentLife <= Math.ceil(state.run.hero.maxLife * 0.5) ||
        state.run.belt.current <= 0 ||
        state.run.mercenary.currentLife <= 0
      if (needsTown) {
        const returnResult = harness.appEngine.returnToSafeZone(state)
        if (returnResult.ok) {
          optimizeSafeZoneRun(harness, state.run, state.profile, policy)
          continue
        }
      }

      const reachableZones = harness.runFactory.getReachableZones(state.run)
      if (reachableZones.length === 0) {
        throw new Error(`No reachable zones remain in Act ${state.run.actNumber}.`)
      }

      let selectedZone: ZoneState | null = null
      let lastSelectMessage = ""
      const candidates = reachableZones.slice()
      while (candidates.length > 0 && !selectedZone) {
        const nextZone = chooseNextZone(state.run, candidates)
        const selectResult = harness.appEngine.selectZone(state, nextZone.id)
        if (selectResult.ok) {
          selectedZone = nextZone
          break
        }
        lastSelectMessage = selectResult.message || `Could not select zone ${nextZone.id}.`
        const candidateIndex = candidates.findIndex((zone) => zone.id === nextZone.id)
        if (candidateIndex >= 0) {
          candidates.splice(candidateIndex, 1)
        } else {
          break
        }
      }
      if (!selectedZone) {
        throw new Error(lastSelectMessage || `Could not select any reachable zone in Act ${state.run.actNumber}.`)
      }
      if (state.phase === PHASES.ENCOUNTER) {
        const encounter = harness.content.encounterCatalog[state.run.activeEncounterId]
        encounterContext = {
          actNumber: state.run.actNumber,
          zoneTitle: selectedZone.title,
          encounterId: state.run.activeEncounterId,
          encounterName: encounter?.name || state.run.activeEncounterId,
        }
        if (state.run.activeEncounterId === encounterId) {
          break
        }
      }
      continue
    }

    if (state.phase === PHASES.ENCOUNTER) {
      playStateCombat(harness, state, policy, maxCombatTurns)
      const outcomeResult = harness.appEngine.syncEncounterOutcome(state)
      if (!outcomeResult.ok) {
        throw new Error(outcomeResult.message || "Could not sync encounter outcome.")
      }
      if (state.phase === PHASES.RUN_FAILED) {
        throw new Error(`Run failed before reaching ${encounterId}.`)
      }
      continue
    }

    if (state.phase === PHASES.REWARD) {
      const reward = state.run.pendingReward
      if (!reward) {
        throw new Error("Reward phase is active without a pending reward.")
      }
      const primaryChoice = chooseBestRewardChoice(harness, state.run, state.profile, reward, policy)
      const claimResult = harness.appEngine.claimRewardAndAdvance(state, primaryChoice?.id || "")
      if (!claimResult.ok) {
        throw new Error(claimResult.message || "Could not claim reward.")
      }
      continue
    }

    if (state.phase === PHASES.ACT_TRANSITION) {
      if (state.run?.guide?.overlayKind === "reward") {
        const guideResult = harness.appEngine.continueActGuide(state)
        if (!guideResult.ok) {
          throw new Error(guideResult.message || "Could not dismiss act guide.")
        }
        if (state.run?.guide?.overlayKind === "reward") {
          state.run.guide.overlayKind = ""
          state.run.guide.targetActNumber = 0
        }
      }
      const continueResult = harness.appEngine.continueActTransition(state)
      if (!continueResult.ok) {
        throw new Error(continueResult.message || "Could not continue act transition.")
      }
      optimizeSafeZoneRun(harness, state.run, state.profile, policy)
      continue
    }

    if (state.phase === PHASES.RUN_COMPLETE) {
      throw new Error(`Run completed before reaching ${encounterId}.`)
    }

    throw new Error(`Unsupported simulation phase: ${state.phase}`)
  }

  if (!state.run || state.phase !== PHASES.ENCOUNTER || state.run.activeEncounterId !== encounterId) {
    throw new Error(`Could not reach encounter ${encounterId}.`)
  }

  const combatState = buildCombatStateForEncounter(
    harness,
    state.run,
    state.profile,
    encounterId,
    seed,
    state.randomFn || createSeededRandom(seed)
  )
  const trace = traceCombatStateWithPolicy(harness, combatState, policy.id, maxCombatTurns)

  return {
    classId,
    policyId: policy.id,
    policyLabel: policy.label,
    seedOffset,
    encounterId,
    encounterName: encounterContext?.encounterName || encounterId,
    zoneTitle: encounterContext?.zoneTitle || "",
    outcome: trace.outcome,
    turns: trace.turns,
    finalState: trace.finalState,
    recentLog: trace.recentLog,
  }
}

export function runProgressionSimulationReport(options: RunProgressionSimulationOptions = {}): RunProgressionSimulationReport {
  const throughActNumber = clamp(options.throughActNumber || 5, 1, 5)
  const probeRuns = Math.max(0, options.probeRuns ?? 3)
  const maxCombatTurns = Math.max(12, options.maxCombatTurns || 36)
  const seedOffset = Math.max(0, options.seedOffset || 0)
  const checkpointProbeProfile = options.checkpointProbeProfile || "default"
  const archetypePlan = options.targetArchetypeId
    ? {
        targetArchetypeId: options.targetArchetypeId,
        commitmentMode: options.commitmentMode || "committed",
        commitAct: options.commitAct || 2,
        commitCheckpoint: options.commitCheckpoint || "first_safe_zone",
      }
    : null
  const classIds = options.classIds && options.classIds.length > 0 ? options.classIds : [...DEFAULT_CLASS_IDS]
  const policies = getPolicyDefinitions(options.policyIds)

  const classReports = classIds.map((classId) => {
    const classHarness = createQuietAppHarness()
    const classDefinition = classHarness.classRegistry.getClassDefinition(classHarness.seedBundle, classId)
    if (!classDefinition) {
      throw new Error(`Unknown class: ${classId}`)
    }

    return {
      classId,
      className: classDefinition.name,
      policyReports: policies.map((basePolicy) => {
        const policy = applyClassStrategy(basePolicy, classId)
        const harness = createQuietAppHarness()
        return simulatePolicyRun(
          harness,
          classId,
          policy,
          throughActNumber,
          probeRuns,
          maxCombatTurns,
          seedOffset,
          undefined,
          archetypePlan,
          checkpointProbeProfile
        )
      }),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    throughActNumber,
    classReports,
  }
}
