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
  getPolicyDefinitions,
  getPolicySimulationAssumptions,
  getRunProgressionPolicyDefinitions,
  getTrackedRandomState,
  hashString,
  incrementCount,
  type BuildPolicyDefinition,
  type PolicyProgressSummary,
  type PolicyRunSummary,
  type PolicySimulationHooks,
  type PolicySimulationReport,
  type RunProgressionContinuationContext,
  type RunProgressionSimulationOptions,
  type RunProgressionSimulationReport,
  type SafeZoneCheckpointSummary,
  type SimulationFailureSummary,
} from "./run-progression-simulator-core"
import {
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
  PolicyRunSummary,
  RunProgressionContinuationContext,
  RunProgressionSimulationOptions,
  RunProgressionSimulationReport,
  SafeZoneCheckpointSummary,
  SimulationFailureSummary,
}

function chooseBestRewardChoice(
  harness: ReturnType<typeof createQuietAppHarness>,
  run: RunState,
  _profile: ProfileState,
  reward: RunReward,
  policy: BuildPolicyDefinition
) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T
  const choices = Array.isArray(reward.choices) ? reward.choices : []
  let bestChoice = choices[0] || null
  let bestScore = Number.NEGATIVE_INFINITY

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

    const score = evaluateRunScore(harness, runClone, policy, { assumeFullResources })
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
  seed: number
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
  hooks?: PolicySimulationHooks
): PolicySimulationReport {
  const PHASES = harness.appEngine.PHASES
  const checkpoints = Array.isArray(continuation?.checkpoints) ? continuation.checkpoints.map((entry) => ({ ...entry })) : []
  const progress = continuation?.progress
    ? JSON.parse(JSON.stringify(continuation.progress)) as PolicyProgressSummary
    : createEmptyPolicyProgressSummary()
  let failure: SimulationFailureSummary | null = continuation?.failure ? { ...continuation.failure } : null
  let lastEncounterContext: SimulationFailureSummary | null = continuation?.lastEncounterContext
    ? { ...continuation.lastEncounterContext }
    : null

  const continuationContext = () => cloneContinuationContext({
    policyId: policy.id,
    throughActNumber,
    probeRuns,
    maxCombatTurns,
    seedOffset,
    progress,
    checkpoints,
    failure,
    lastEncounterContext,
  })

  if (!continuation) {
    optimizeSafeZoneRun(harness, state.run as RunState, state.profile, policy)
    const initialCheckpoint = buildCheckpointSummary(
      harness,
      state.run as RunState,
      state.profile,
      policy,
      state.run!.actNumber,
      progress,
      probeRuns,
      maxCombatTurns
    )
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
  } else {
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
          assumptions: getPolicySimulationAssumptions(),
          outcome: "reached_checkpoint",
          finalActNumber: state.run.actNumber,
          finalLevel: state.run.level,
          checkpoints,
          failure: null,
          summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress),
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
        lastEncounterContext = {
          actNumber: state.run.actNumber,
          zoneTitle: selectedZone.title,
          encounterId: state.run.activeEncounterId,
          encounterName: encounter?.name || state.run.activeEncounterId,
          kind: selectedZone.kind === "boss" ? "boss" : selectedZone.kind === "miniboss" ? "elite" : "battle",
          zoneKind: selectedZone.kind || "",
          zoneRole: selectedZone.zoneRole || "",
          nodeType: selectedZone.nodeType || "",
        }
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
      const combatResult = playStateCombat(harness, state, policy, maxCombatTurns)
      const encounterMetric = buildEncounterMetric(harness, state.run, lastEncounterContext, combatResult)
      if (encounterMetric) {
        progress.encounterResults.push(encounterMetric)
      }
      const outcomeResult = harness.appEngine.syncEncounterOutcome(state)
      if (!outcomeResult.ok) {
        throw new Error(outcomeResult.message || "Could not sync encounter outcome.")
      }
      if (state.phase === PHASES.RUN_FAILED) {
        failure = lastEncounterContext
        const report: PolicySimulationReport = {
          policyId: policy.id,
          policyLabel: policy.label,
          description: policy.description,
          assumptions: getPolicySimulationAssumptions(),
          outcome: "run_failed",
          finalActNumber: failure?.actNumber || state.run?.actNumber || 1,
          finalLevel: state.run?.level || 1,
          checkpoints,
          failure,
          summary: buildPolicyRunSummary(harness, state.run as RunState, state.profile, policy, progress),
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
      const primaryChoice = chooseBestRewardChoice(harness, state.run, state.profile, reward, policy)
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
          const claimResult = harness.appEngine.claimRewardAndAdvance(state, choice?.id || "")
          if (claimResult.ok) {
            countChoice(progress, reward, choice)
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
      const continueResult = harness.appEngine.continueActTransition(state)
      if (!continueResult.ok) {
        throw new Error(continueResult.message || "Could not continue act transition.")
      }
      optimizeSafeZoneRun(harness, state.run, state.profile, policy)
      const checkpoint = buildCheckpointSummary(harness, state.run, state.profile, policy, state.run.actNumber, progress, probeRuns, maxCombatTurns)
      checkpoints.push(checkpoint)
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
        assumptions: getPolicySimulationAssumptions(),
        outcome: "run_complete",
        finalActNumber: state.run.actNumber,
        finalLevel: state.run.level,
        checkpoints,
        failure: null,
        summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress),
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
  hooks?: PolicySimulationHooks
): PolicySimulationReport {
  const seed = createProgressionSimulationSeed(classId, policy.id, throughActNumber, seedOffset)
  const state = createSimulationState(harness, classId, seed)
  return runProgressionPolicyFromState(harness, state, classId, policy, throughActNumber, probeRuns, maxCombatTurns, seedOffset, undefined, hooks)
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
  const policy = getPolicyDefinitions([options.policyId || "aggressive"])[0]
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
      policyReports: policies.map((policy) => {
        const harness = createQuietAppHarness()
        return simulatePolicyRun(harness, classId, policy, throughActNumber, probeRuns, maxCombatTurns, seedOffset)
      }),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    throughActNumber,
    classReports,
  }
}
