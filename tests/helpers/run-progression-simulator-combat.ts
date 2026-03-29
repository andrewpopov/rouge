import {
  ATTACK_INTENT_KINDS,
  SIMULATION_SCORING_WEIGHTS,
  createSeededRandom,
  createTrackedRandom,
  getPolicyDefinitions,
  roundTo,
  type AppHarness,
  type BuildPolicyDefinition,
  type CombatCandidateAction,
} from "./run-progression-simulator-core"
import {
  getMatchingWeaponProficienciesForCombatState,
  getWeaponEquipment,
  scoreCard,
} from "./run-progression-simulator-scoring"

export interface SimulatedCombatResult {
  outcome: string
  turns: number
  heroLifePct: number
  mercenaryLifePct: number
  enemyLifePct: number
}

function getIncomingThreat(state: CombatState) {
  return state.enemies.reduce((sum, enemy) => {
    if (!enemy.alive || !enemy.currentIntent) {
      return sum
    }
    const intent = enemy.currentIntent
    if (ATTACK_INTENT_KINDS.has(intent.kind)) {
      const aoeMultiplier =
        intent.kind === "attack_all" || intent.kind === "attack_burn_all" || intent.kind === "attack_lightning_all" || intent.kind === "attack_poison_all"
          ? 1.35
          : 1
      const statusBonus =
        intent.kind === "attack_burn" || intent.kind === "attack_burn_all" || intent.kind === "attack_poison" || intent.kind === "attack_poison_all" || intent.kind === "attack_chill"
          ? 2
          : intent.kind === "drain_energy"
            ? 1
            : 0
      return sum + (Number(intent.value || 0) + statusBonus) * aoeMultiplier
    }
    if (intent.kind === "charge") {
      const aoeMultiplier = intent.target === "all_allies" ? 1.4 : 1.1
      const typedThreatBonus =
        intent.damageType === "fire" || intent.damageType === "poison" || intent.damageType === "lightning" || intent.damageType === "cold"
          ? 2
          : 0
      return sum + (Number(intent.value || 0) + typedThreatBonus) * aoeMultiplier
    }
    if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
      return sum + 3
    }
    return sum
  }, 0)
}

function hasChargeThreat(state: CombatState) {
  return state.enemies.some((enemy) => enemy.alive && enemy.currentIntent?.kind === "charge")
}

function getThreatPressure(state: CombatState) {
  return getIncomingThreat(state) / Math.max(1, state.hero.life + state.hero.guard)
}

function getEnemyStatusScore(state: CombatState) {
  return state.enemies.reduce((sum, enemy) => {
    return (
      sum +
      enemy.burn * SIMULATION_SCORING_WEIGHTS.status.burn +
      enemy.poison * SIMULATION_SCORING_WEIGHTS.status.poison +
      enemy.slow * SIMULATION_SCORING_WEIGHTS.status.slow +
      enemy.freeze * SIMULATION_SCORING_WEIGHTS.status.freeze +
      enemy.stun * SIMULATION_SCORING_WEIGHTS.status.stun +
      enemy.paralyze * SIMULATION_SCORING_WEIGHTS.status.paralyze
    )
  }, 0)
}

function getHeroDebuffScore(state: CombatState) {
  return (
    state.hero.heroBurn * SIMULATION_SCORING_WEIGHTS.heroDebuff.heroBurn +
    state.hero.heroPoison * SIMULATION_SCORING_WEIGHTS.heroDebuff.heroPoison +
    state.hero.chill * SIMULATION_SCORING_WEIGHTS.heroDebuff.chill +
    state.hero.amplify * SIMULATION_SCORING_WEIGHTS.heroDebuff.amplify +
    state.hero.weaken * SIMULATION_SCORING_WEIGHTS.heroDebuff.weaken +
    state.hero.energyDrain * SIMULATION_SCORING_WEIGHTS.heroDebuff.energyDrain
  )
}

function scoreSingleEnemyThreat(enemy: CombatEnemyState) {
  if (!enemy.alive || !enemy.currentIntent) {
    return 0
  }
  const intent = enemy.currentIntent
  const baseValue = Number(intent.value || 0)
  if (
    intent.kind === "attack_all" ||
    intent.kind === "attack_burn_all" ||
    intent.kind === "attack_lightning_all" ||
    intent.kind === "attack_poison_all"
  ) {
    return baseValue * 1.45
  }
  if (intent.kind === "charge") {
    const typedThreatBonus =
      intent.damageType === "fire" || intent.damageType === "poison" || intent.damageType === "lightning" || intent.damageType === "cold"
        ? 2
        : 0
    return (baseValue + typedThreatBonus) * (intent.target === "all_allies" ? 1.45 : 1.2)
  }
  if (
    intent.kind === "attack" ||
    intent.kind === "attack_burn" ||
    intent.kind === "attack_poison" ||
    intent.kind === "attack_chill" ||
    intent.kind === "sunder_attack" ||
    intent.kind === "drain_attack"
  ) {
    return baseValue
  }
  if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
    return 4
  }
  return 1
}

function getPriorityEnemyTargets(state: CombatState) {
  const aliveEnemies = state.enemies.filter((enemy) => enemy.alive)
  if (aliveEnemies.length <= 2) {
    return aliveEnemies
  }

  const targets: CombatEnemyState[] = []
  const addTarget = (enemy: CombatEnemyState | undefined) => {
    if (!enemy || targets.some((candidate) => candidate.id === enemy.id)) {
      return
    }
    targets.push(enemy)
  }

  addTarget(aliveEnemies.find((enemy) => enemy.id === state.mercenary.markedEnemyId))

  const lowestEffectiveLife = [...aliveEnemies].sort((left, right) => {
    return left.life + left.guard - (right.life + right.guard) || left.id.localeCompare(right.id)
  })
  addTarget(lowestEffectiveLife[0])

  const highestThreat = [...aliveEnemies].sort((left, right) => {
    return scoreSingleEnemyThreat(right) - scoreSingleEnemyThreat(left) || right.maxLife - left.maxLife || left.id.localeCompare(right.id)
  })
  addTarget(highestThreat[0])

  if (targets.length < 2) {
    addTarget(lowestEffectiveLife[1])
  }
  if (targets.length < 3) {
    addTarget(highestThreat[1])
  }

  return targets.length > 0 ? targets : aliveEnemies.slice(0, 2)
}

function cloneCombatState(state: CombatState) {
  const clone = JSON.parse(JSON.stringify(state)) as CombatState
  clone.randomFn = state.randomFn
  return clone
}

function getHandValue(state: CombatState, content: GameContent, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  return state.hand.reduce((sum, entry) => {
    return sum + Math.max(0, scoreCard(content.cardCatalog[entry.cardId], policy, matchingProficiencies))
  }, 0)
}

function scoreCombatStateDelta(
  before: CombatState,
  after: CombatState,
  content: GameContent,
  actionType: CombatCandidateAction["type"],
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const beforeEnemyLife = before.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const beforeEnemyGuard = before.enemies.reduce((sum, enemy) => sum + enemy.guard, 0)
  const afterEnemyLife = after.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const afterEnemyGuard = after.enemies.reduce((sum, enemy) => sum + enemy.guard, 0)
  const beforeLivingEnemies = before.enemies.filter((enemy) => enemy.alive).length
  const afterLivingEnemies = after.enemies.filter((enemy) => enemy.alive).length
  const beforeThreat = getIncomingThreat(before)
  const afterThreat = getIncomingThreat(after)
  const beforeShortfall = Math.max(0, beforeThreat - (before.hero.life + before.hero.guard))
  const afterShortfall = Math.max(0, afterThreat - (after.hero.life + after.hero.guard))
  const beforePressure = getThreatPressure(before)
  const afterPressure = getThreatPressure(after)
  const chargeThreat = hasChargeThreat(before)
  const beforeSafeFromThreat = beforeShortfall <= 0
  const afterSafeFromThreat = afterShortfall <= 0

  let score =
    (beforeEnemyLife - afterEnemyLife) * 3.4 +
    (beforeEnemyGuard - afterEnemyGuard) * 1.0 +
    (after.hero.life - before.hero.life) * 2.3 +
    (after.hero.guard - before.hero.guard) * (1.6 + policy.heroGuardWeight * 0.2) +
    (after.mercenary.life - before.mercenary.life) * 0.9 +
    (after.mercenary.guard - before.mercenary.guard) * 0.7 +
    (beforeLivingEnemies - afterLivingEnemies) * 45 +
    (getEnemyStatusScore(after) - getEnemyStatusScore(before)) * 1.5 +
    (getHeroDebuffScore(before) - getHeroDebuffScore(after)) * 2.0 +
    (beforeShortfall - afterShortfall) * (chargeThreat ? 14 : 7) +
    (beforePressure - afterPressure) * (chargeThreat ? 42 : 18) +
    (getHandValue(after, content, policy, matchingProficiencies) - getHandValue(before, content, policy, matchingProficiencies)) * 0.12

  if (!beforeSafeFromThreat && afterSafeFromThreat) {
    score += chargeThreat ? 42 : 18
  }
  if (chargeThreat && after.hero.guard > before.hero.guard && afterShortfall < beforeShortfall) {
    score += 10
  }

  if (after.mercenary.markedEnemyId && !before.mercenary.markedEnemyId) {
    score += 6
  }
  score += (after.mercenary.nextAttackBonus - before.mercenary.nextAttackBonus) * 2.5
  score += (after.mercenary.markBonus - before.mercenary.markBonus) * 2.5
  if (after.outcome === "victory") {
    score += 1000
  }
  if (after.outcome === "defeat") {
    score -= 1000
  }
  if (actionType === "potion") {
    score -= 5
    if (before.hero.life <= beforeThreat || before.hero.life / Math.max(1, before.hero.maxLife) <= 0.35) {
      score += 18
    }
    if (chargeThreat && beforePressure >= 0.55) {
      score += 12
    }
    if ((before.hero.heroBurn + before.hero.heroPoison) >= 2 && before.hero.life / Math.max(1, before.hero.maxLife) <= 0.6) {
      score += 8
    }
  }
  if (actionType === "end_turn") {
    score -= 2 + afterShortfall * 2
    if (chargeThreat) {
      score -= 10 + afterPressure * 8
    }
  }
  return score
}

function listCandidateActions(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const candidates: CombatCandidateAction[] = []
  const threatPressure = getThreatPressure(state)
  const chargeThreat = hasChargeThreat(state)
  const maxCardEntriesToEvaluate = chargeThreat ? 12 : threatPressure >= 0.5 ? 9 : 6
  if (state.phase !== "player" || state.outcome) {
    return candidates
  }

  const playableEntries = state.hand
    .map((entry) => ({
      entry,
      card: content.cardCatalog[entry.cardId],
    }))
    .filter((candidate) => candidate.card && candidate.card.cost <= state.hero.energy)
    .sort((left, right) => {
      return (
        scoreCard(right.card, policy, matchingProficiencies) - scoreCard(left.card, policy, matchingProficiencies) ||
        left.entry.instanceId.localeCompare(right.entry.instanceId)
      )
    })
    .slice(0, maxCardEntriesToEvaluate)

  playableEntries.forEach(({ entry, card }) => {
    if (card.target === "enemy") {
      getPriorityEnemyTargets(state).forEach((enemy) => {
        candidates.push({
          type: "card",
          score: Number.NEGATIVE_INFINITY,
          instanceId: entry.instanceId,
          targetId: enemy.id,
        })
      })
      return
    }
    candidates.push({
      type: "card",
      score: Number.NEGATIVE_INFINITY,
      instanceId: entry.instanceId,
    })
  })

  if (state.potions > 0) {
    if (state.hero.alive && state.hero.life < state.hero.maxLife) {
      candidates.push({ type: "potion", score: Number.NEGATIVE_INFINITY, potionTarget: "hero" })
    }
    if (state.mercenary.alive && state.mercenary.life < state.mercenary.maxLife) {
      candidates.push({ type: "potion", score: Number.NEGATIVE_INFINITY, potionTarget: "mercenary" })
    }
  }

  if (!state.meleeUsed && state.enemies.some((enemy) => enemy.alive)) {
    candidates.push({ type: "melee", score: Number.NEGATIVE_INFINITY })
  }

  candidates.push({ type: "end_turn", score: Number.NEGATIVE_INFINITY })

  return candidates.map((candidate) => {
    if (candidate.type === "end_turn") {
      const clone = cloneCombatState(state)
      engine.endTurn(clone)
      return {
        ...candidate,
        score: scoreCombatStateDelta(state, clone, content, "end_turn", policy, matchingProficiencies),
      }
    }

    const clone = cloneCombatState(state)
    let result: ActionResult = { ok: false, message: "Unknown action." }
    if (candidate.type === "card" && candidate.instanceId) {
      result = engine.playCard(clone, content, candidate.instanceId, candidate.targetId || "")
    } else if (candidate.type === "melee") {
      result = engine.meleeStrike(clone, content)
    } else if (candidate.type === "potion" && candidate.potionTarget) {
      result = engine.usePotion(clone, candidate.potionTarget)
    }

    if (!result.ok) {
      return { ...candidate, score: Number.NEGATIVE_INFINITY }
    }

    return {
      ...candidate,
      score: scoreCombatStateDelta(state, clone, content, candidate.type, policy, matchingProficiencies),
    }
  })
}

function chooseBestCombatAction(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const candidates = listCandidateActions(state, content, engine, policy, matchingProficiencies).sort((left, right) => right.score - left.score)
  const best = candidates[0] || { type: "end_turn", score: 0 }
  const endTurnCandidate = candidates.find((candidate) => candidate.type === "end_turn") || null
  const bestActiveCandidate = candidates.find((candidate) => candidate.type !== "end_turn") || null
  const chargeThreat = hasChargeThreat(state)
  const threatPressure = getThreatPressure(state)
  if (best.score < 1) {
    if (
      bestActiveCandidate &&
      (chargeThreat || threatPressure >= 0.45) &&
      bestActiveCandidate.score > Number(endTurnCandidate?.score ?? Number.NEGATIVE_INFINITY)
    ) {
      return bestActiveCandidate
    }
    return { type: "end_turn", score: 0 } as CombatCandidateAction
  }
  return best
}

function executeCombatAction(action: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
  if (action.type === "card" && action.instanceId) {
    return engine.playCard(state, content, action.instanceId, action.targetId || "")
  }
  if (action.type === "melee") {
    return engine.meleeStrike(state, content)
  }
  if (action.type === "potion" && action.potionTarget) {
    return engine.usePotion(state, action.potionTarget)
  }
  return engine.endTurn(state)
}

function describeTraceAction(action: CombatCandidateAction, state: CombatState, content: GameContent) {
  if (action.type === "card" && action.instanceId) {
    const entry = state.hand.find((candidate) => candidate.instanceId === action.instanceId) || null
    const card = entry ? content.cardCatalog[entry.cardId] : null
    const target = action.targetId ? state.enemies.find((enemy) => enemy.id === action.targetId) : null
    return target ? `Card: ${card?.title || entry?.cardId || action.instanceId} -> ${target.name}` : `Card: ${card?.title || entry?.cardId || action.instanceId}`
  }
  if (action.type === "melee") {
    return "Melee strike"
  }
  if (action.type === "potion") {
    return `Potion -> ${action.potionTarget || "hero"}`
  }
  return "End turn"
}

function describeTraceIntent(intent: EnemyIntent | null | undefined) {
  if (!intent) {
    return "No action"
  }
  if (intent.kind === "charge") {
    const scope = intent.target === "all_allies" ? " all" : intent.target === "mercenary" ? " merc" : ""
    const damageType = intent.damageType ? ` ${intent.damageType}` : ""
    return `${intent.label} (${intent.value}${damageType}${scope} next)`
  }
  if (typeof intent.value === "number" && intent.value > 0) {
    return `${intent.label || intent.kind} (${intent.value})`
  }
  return intent.label || intent.kind || "Unknown"
}

function snapshotTraceState(state: CombatState, content: GameContent) {
  return {
    hero: {
      life: state.hero.life,
      maxLife: state.hero.maxLife,
      guard: state.hero.guard,
      energy: state.hero.energy,
      burn: state.hero.heroBurn,
      poison: state.hero.heroPoison,
      chill: state.hero.chill,
      amplify: state.hero.amplify,
      weaken: state.hero.weaken,
      energyDrain: state.hero.energyDrain,
    },
    mercenary: {
      name: state.mercenary.name,
      life: state.mercenary.life,
      maxLife: state.mercenary.maxLife,
      guard: state.mercenary.guard,
      nextAttackBonus: state.mercenary.nextAttackBonus,
      markedEnemyId: state.mercenary.markedEnemyId,
    },
    enemies: state.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        life: enemy.life,
        maxLife: enemy.maxLife,
        guard: enemy.guard,
        burn: enemy.burn,
        poison: enemy.poison,
        slow: enemy.slow,
        freeze: enemy.freeze,
        stun: enemy.stun,
        paralyze: enemy.paralyze,
        intent: describeTraceIntent(enemy.currentIntent),
      })),
    hand: state.hand.map((entry) => ({
      instanceId: entry.instanceId,
      cardId: entry.cardId,
      title: content.cardCatalog[entry.cardId]?.title || entry.cardId,
      cost: Number(content.cardCatalog[entry.cardId]?.cost || 0),
    })),
  }
}

export function traceCombatStateWithPolicy(
  harness: AppHarness,
  combatState: CombatState,
  policyId: string,
  maxCombatTurns = 36
) {
  const policy = getPolicyDefinitions([policyId])[0]
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(combatState))
  const actionLimitPerTurn = 32
  const turns: Array<Record<string, unknown>> = []

  if (!combatState.randomFn) {
    combatState.randomFn = createTrackedRandom(1)
  }

  while (!combatState.outcome && combatState.turn < maxCombatTurns) {
    if (combatState.phase !== "player") {
      harness.combatEngine.endTurn(combatState)
      continue
    }

    const turnTrace: Record<string, unknown> = {
      turn: combatState.turn,
      start: snapshotTraceState(combatState, harness.content),
      actions: [] as string[],
    }

    let actionsTaken = 0
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(combatState, harness.content, harness.combatEngine, policy, matchingProficiencies)
      ;(turnTrace.actions as string[]).push(describeTraceAction(action, combatState, harness.content))
      const result = executeCombatAction(action, combatState, harness.content, harness.combatEngine)
      actionsTaken += 1
      if (!result.ok || action.type === "end_turn") {
        break
      }
    }

    if (!combatState.outcome && combatState.phase === "player") {
      harness.combatEngine.endTurn(combatState)
    }

    turnTrace.end = snapshotTraceState(combatState, harness.content)
    turnTrace.log = [...combatState.log].slice(0, 16).reverse()
    turns.push(turnTrace)
  }

  return {
    outcome: combatState.outcome || "timeout",
    turns,
    finalState: snapshotTraceState(combatState, harness.content),
    recentLog: [...combatState.log].slice(0, 24).reverse(),
  }
}

export function buildCombatStateForEncounter(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  encounterId: string,
  seed: number,
  randomFn?: RandomFn
) {
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, profile)
  const combatBonuses = harness.itemSystem.buildCombatBonuses(run, harness.content)
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null
  const weaponEquipment = getWeaponEquipment(run)
  const weaponItemId = weaponEquipment?.itemId || ""
  const weaponItem = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponItemId)
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || ""
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []

  return harness.combatEngine.createCombatState({
    content: { ...harness.content, hero: overrides.heroState },
    encounterId,
    mercenaryId: run.mercenary.id,
    heroState: overrides.heroState,
    mercenaryState: overrides.mercenaryState,
    starterDeck: overrides.starterDeck,
    initialPotions: overrides.initialPotions,
    randomFn: randomFn || createSeededRandom(seed),
    weaponFamily,
    weaponName: weaponItem?.name || "",
    weaponDamageBonus: Number(combatBonuses.heroDamageBonus || 0),
    weaponProfile,
    armorProfile,
    classPreferredFamilies,
  })
}

export function simulateEncounterWithRun(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  encounterId: string,
  policy: BuildPolicyDefinition,
  maxTurns: number,
  seed: number
): SimulatedCombatResult {
  const combatState = buildCombatStateForEncounter(harness, run, profile, encounterId, seed)
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(combatState))
  const actionLimitPerTurn = 32

  while (!combatState.outcome && combatState.turn < maxTurns) {
    if (combatState.phase !== "player") {
      harness.combatEngine.endTurn(combatState)
      continue
    }
    let actionsTaken = 0
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(combatState, harness.content, harness.combatEngine, policy, matchingProficiencies)
      const result = executeCombatAction(action, combatState, harness.content, harness.combatEngine)
      actionsTaken += 1
      if (!result.ok || action.type === "end_turn") {
        break
      }
    }
    if (!combatState.outcome && combatState.phase === "player") {
      harness.combatEngine.endTurn(combatState)
    }
  }

  const remainingEnemyLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const enemyMaxLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.maxLife, 0)
  return {
    outcome: combatState.outcome || "timeout",
    turns: combatState.turn,
    heroLifePct: combatState.hero.maxLife > 0 ? combatState.hero.life / combatState.hero.maxLife : 0,
    mercenaryLifePct: combatState.mercenary.maxLife > 0 ? combatState.mercenary.life / combatState.mercenary.maxLife : 0,
    enemyLifePct: enemyMaxLife > 0 ? remainingEnemyLife / enemyMaxLife : 0,
  }
}

export function playStateCombat(
  harness: AppHarness,
  state: AppState,
  policy: BuildPolicyDefinition,
  maxCombatTurns: number
): SimulatedCombatResult | null {
  if (!state.combat) {
    return null
  }
  const startingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0)
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(state.combat))
  const actionLimitPerTurn = 32

  while (!state.combat.outcome && state.combat.turn < maxCombatTurns) {
    if (state.combat.phase !== "player") {
      harness.combatEngine.endTurn(state.combat)
      continue
    }
    let actionsTaken = 0
    while (state.combat.phase === "player" && !state.combat.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(state.combat, harness.content, harness.combatEngine, policy, matchingProficiencies)
      const result = executeCombatAction(action, state.combat, harness.content, harness.combatEngine)
      actionsTaken += 1
      if (!result.ok || action.type === "end_turn") {
        break
      }
    }
    if (!state.combat.outcome && state.combat.phase === "player") {
      harness.combatEngine.endTurn(state.combat)
    }
  }

  if (!state.combat.outcome) {
    state.combat.outcome = "defeat"
  }
  const remainingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0)
  return {
    outcome: state.combat.outcome || "defeat",
    turns: Number(state.combat.turn || 0),
    heroLifePct: state.combat.hero.maxLife > 0 ? roundTo((Number(state.combat.hero.life || 0) / Number(state.combat.hero.maxLife || 1)) * 100) : 0,
    mercenaryLifePct:
      state.combat.mercenary.maxLife > 0
        ? roundTo((Number(state.combat.mercenary.life || 0) / Number(state.combat.mercenary.maxLife || 1)) * 100)
        : 0,
    enemyLifePct: startingEnemyLife > 0 ? roundTo((remainingEnemyLife / startingEnemyLife) * 100) : 0,
  }
}
