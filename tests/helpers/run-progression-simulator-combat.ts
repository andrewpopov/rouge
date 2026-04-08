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
  openingHandFullSpend: boolean
  openingHandCardsPlayed: number
  openingHandSize: number
  turn1UnspentEnergy: number
  earlyUnspentEnergyAverage: number
  earlyMeaningfulUnplayedRate: number
  averageEarlyCandidateCount: number
  averageEarlyMeaningfulCandidateCount: number
  averageEarlyDecisionScoreSpread: number
  earlyCloseDecisionRate: number
  averageEarlyEndTurnRegret: number
  skillActionRate: number
  skillUseTurnRate: number
  readySkillUnusedTurnRate: number
  slot1UseRate: number
  slot2UseRate: number
  slot3UseRate: number
  beamDecisionRate: number
  averageBeamDepth: number
  beamOverrideRate: number
  logSummary: CombatLogSummary
}

interface TurnDecisionTelemetry {
  startingEnergy: number
  startingHandSize: number
  cardsPlayed: number
  endingEnergy: number
  endingHandSize: number
  meaningfulUnplayed: number
  candidateCount: number
  meaningfulCandidateCount: number
  decisionScoreSpread: number
  endTurnRegret: number
  readySkillCount: number
  skillActionsUsed: number
  slot1Used: boolean
  slot2Used: boolean
  slot3Used: boolean
  beamUsed: boolean
  beamDepth: number
  beamOverride: boolean
}

interface CombatActionChoiceStats {
  action: CombatCandidateAction
  candidateCount: number
  meaningfulCandidateCount: number
  bestScore: number
  secondBestScore: number
  scoreSpread: number
  endTurnScore: number
  endTurnRegret: number
  beamUsed: boolean
  beamDepth: number
  beamOverride: boolean
}

const MEANINGFUL_DECISION_MARGIN = 8
const CLOSE_DECISION_SPREAD_THRESHOLD = 6
const PASS_REGRET_SIGNIFICANCE_THRESHOLD = 2
const LOOKAHEAD_TARGET_LIMIT = 3

interface BeamSearchConfig {
  depth: number
  beamWidth: number
  expandPerNode: number
  scoreDecay: number
}

export interface CombatSimulationHooks {
  slowStepThresholdMs?: number
  onProgress?: (payload: {
    stage:
      | "turn_start"
      | "action_select_started"
      | "action_selected"
      | "action_executed"
      | "end_turn_started"
      | "end_turn_completed"
      | "combat_complete"
    turn: number
    actionIndex: number
    candidateCount: number
    bestScore: number
    stepElapsedMs: number
    encounterElapsedMs: number
    detail?: string
  }) => void
}

export function getIncomingThreat(state: CombatState) {
  return getIncomingThreatProfile(state).totalThreat
}

export function getIncomingThreatProfile(state: CombatState) {
  return state.enemies.reduce(
    (profile, enemy) => {
      if (!enemy.alive || !enemy.currentIntent) {
        return profile
      }
      const intent = enemy.currentIntent
      const projectedFatalAilment = enemy.burn + enemy.poison >= enemy.life
      let pendingDeathBurstThreat = 0
      if (projectedFatalAilment && Array.isArray(enemy.traits)) {
        if (enemy.traits.includes("death_explosion")) {
          pendingDeathBurstThreat += Math.max(1, Math.floor(enemy.maxLife * 0.3))
        }
        if (enemy.traits.includes("fire_enchanted")) {
          pendingDeathBurstThreat += Math.max(1, Math.floor(enemy.maxLife * 0.25))
        }
      }
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
        const guardedThreat = (Number(intent.value || 0) + statusBonus) * aoeMultiplier
        return {
          totalThreat: profile.totalThreat + guardedThreat + pendingDeathBurstThreat,
          guardedThreat: profile.guardedThreat + guardedThreat,
          bypassGuardThreat: profile.bypassGuardThreat + pendingDeathBurstThreat,
        }
      }
      if (intent.kind === "charge") {
        const aoeMultiplier = intent.target === "all_allies" ? 1.4 : 1.1
        const typedThreatBonus =
          intent.damageType === "fire" || intent.damageType === "poison" || intent.damageType === "lightning" || intent.damageType === "cold"
            ? 2
            : 0
        const guardedThreat = (Number(intent.value || 0) + typedThreatBonus) * aoeMultiplier
        return {
          totalThreat: profile.totalThreat + guardedThreat + pendingDeathBurstThreat,
          guardedThreat: profile.guardedThreat + guardedThreat,
          bypassGuardThreat: profile.bypassGuardThreat + pendingDeathBurstThreat,
        }
      }
      if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
        return {
          totalThreat: profile.totalThreat + 3 + pendingDeathBurstThreat,
          guardedThreat: profile.guardedThreat + 3,
          bypassGuardThreat: profile.bypassGuardThreat + pendingDeathBurstThreat,
        }
      }

      return {
        totalThreat: profile.totalThreat + pendingDeathBurstThreat,
        guardedThreat: profile.guardedThreat,
        bypassGuardThreat: profile.bypassGuardThreat + pendingDeathBurstThreat,
      }
    },
    { totalThreat: 0, guardedThreat: 0, bypassGuardThreat: 0 }
  )
}

export function getThreatShortfall(state: CombatState) {
  const profile = getIncomingThreatProfile(state)
  const lifeAfterBypass = state.hero.life - profile.bypassGuardThreat
  const bypassShortfall = lifeAfterBypass <= 0 ? 1 + Math.max(0, -lifeAfterBypass) : 0
  const guardedCapacity = Math.max(0, lifeAfterBypass) + state.hero.guard
  const guardedShortfall = Math.max(0, profile.guardedThreat - guardedCapacity)
  return bypassShortfall + guardedShortfall
}

export function hasChargeThreat(state: CombatState) {
  return state.enemies.some((enemy) => enemy.alive && enemy.currentIntent?.kind === "charge")
}

export function getThreatPressure(state: CombatState) {
  const profile = getIncomingThreatProfile(state)
  const lifeAfterBypass = Math.max(0, state.hero.life - profile.bypassGuardThreat)
  const guardedCapacity = lifeAfterBypass + state.hero.guard
  const bypassPressure = profile.bypassGuardThreat / Math.max(1, state.hero.life)
  const guardedPressure = profile.guardedThreat / Math.max(1, guardedCapacity)
  return bypassPressure + guardedPressure
}

export function getEnemyStatusScore(state: CombatState) {
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

export function getHeroDebuffScore(state: CombatState) {
  return (
    state.hero.heroBurn * SIMULATION_SCORING_WEIGHTS.heroDebuff.heroBurn +
    state.hero.heroPoison * SIMULATION_SCORING_WEIGHTS.heroDebuff.heroPoison +
    state.hero.chill * SIMULATION_SCORING_WEIGHTS.heroDebuff.chill +
    state.hero.amplify * SIMULATION_SCORING_WEIGHTS.heroDebuff.amplify +
    state.hero.weaken * SIMULATION_SCORING_WEIGHTS.heroDebuff.weaken +
    state.hero.energyDrain * SIMULATION_SCORING_WEIGHTS.heroDebuff.energyDrain
  )
}

function scoreUnusedSkillOpportunity(skill: CombatEquippedSkillState) {
  let score = skill.slot === 3 || skill.tier === "capstone" ? 10 : skill.slot === 2 || skill.tier === "bridge" ? 8 : 6
  if (skill.family === "answer" || skill.family === "recovery" || skill.family === "commitment") {
    score += 1
  }
  if (skill.skillType === "summon" || skill.skillType === "spell") {
    score += 1
  }
  return score
}

function isSkillUsableForOpportunity(skill: CombatEquippedSkillState, availableEnergy: number) {
  return (
    skill.active &&
    skill.cost <= Math.max(1, availableEnergy) &&
    skill.remainingCooldown <= 0 &&
    (!skill.oncePerBattle || !skill.usedThisBattle) &&
    (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
  )
}

function isSkillReadyNow(skill: CombatEquippedSkillState, availableEnergy: number) {
  return (
    skill.active &&
    skill.cost <= Math.max(0, availableEnergy) &&
    skill.remainingCooldown <= 0 &&
    (!skill.oncePerBattle || !skill.usedThisBattle) &&
    (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
  )
}

function getMeaningfulUnplayedCount(
  state: CombatState,
  content: GameContent,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>,
  startingEnergy: number
) {
  const cardCount = state.hand.reduce((count, entry) => {
    const card = content.cardCatalog[entry.cardId]
    if (!card) {
      return count
    }
    if (Number(card.cost || 0) > Math.max(1, startingEnergy)) {
      return count
    }
    return scoreCard(card, policy, matchingProficiencies) >= 8 ? count + 1 : count
  }, 0)
  const skillCount = state.equippedSkills.reduce((count, skill) => {
    if (!isSkillUsableForOpportunity(skill, startingEnergy)) {
      return count
    }
    return scoreUnusedSkillOpportunity(skill) >= 8 ? count + 1 : count
  }, 0)
  return cardCount + skillCount
}

function getReadySkillCount(state: CombatState, availableEnergy: number) {
  return state.equippedSkills.reduce((count, skill) => {
    return isSkillReadyNow(skill, availableEnergy) ? count + 1 : count
  }, 0)
}

function summarizeTurnTelemetry(turns: TurnDecisionTelemetry[]) {
  const earlyTurns = turns.slice(0, 3)
  const opening = turns[0] || {
    startingEnergy: 0,
    startingHandSize: 0,
    cardsPlayed: 0,
    endingEnergy: 0,
    endingHandSize: 0,
    meaningfulUnplayed: 0,
    candidateCount: 0,
    meaningfulCandidateCount: 0,
    decisionScoreSpread: 0,
    endTurnRegret: 0,
    readySkillCount: 0,
    skillActionsUsed: 0,
    slot1Used: false,
    slot2Used: false,
    slot3Used: false,
    beamUsed: false,
    beamDepth: 0,
    beamOverride: false,
  }
  const divisor = Math.max(1, earlyTurns.length)
  const totalTurns = Math.max(1, turns.length)
  const beamTurns = turns.filter((turn) => turn.beamUsed)
  const readySkillTurns = turns.filter((turn) => turn.readySkillCount > 0)
  return {
    openingHandFullSpend: opening.endingHandSize === 0,
    openingHandCardsPlayed: opening.cardsPlayed,
    openingHandSize: opening.startingHandSize,
    turn1UnspentEnergy: opening.endingEnergy,
    earlyUnspentEnergyAverage: roundTo(earlyTurns.reduce((sum, turn) => sum + turn.endingEnergy, 0) / divisor),
    earlyMeaningfulUnplayedRate: roundTo(earlyTurns.filter((turn) => turn.meaningfulUnplayed > 0).length / divisor, 3),
    averageEarlyCandidateCount: roundTo(earlyTurns.reduce((sum, turn) => sum + turn.candidateCount, 0) / divisor),
    averageEarlyMeaningfulCandidateCount: roundTo(
      earlyTurns.reduce((sum, turn) => sum + turn.meaningfulCandidateCount, 0) / divisor,
      3
    ),
    averageEarlyDecisionScoreSpread: roundTo(
      earlyTurns.reduce((sum, turn) => sum + turn.decisionScoreSpread, 0) / divisor,
      3
    ),
    earlyCloseDecisionRate: roundTo(
      earlyTurns.filter((turn) => turn.meaningfulCandidateCount >= 2 && turn.decisionScoreSpread <= CLOSE_DECISION_SPREAD_THRESHOLD).length / divisor,
      3
    ),
    averageEarlyEndTurnRegret: roundTo(earlyTurns.reduce((sum, turn) => sum + turn.endTurnRegret, 0) / divisor, 3),
    skillActionRate: roundTo(turns.reduce((sum, turn) => sum + turn.skillActionsUsed, 0) / totalTurns, 3),
    skillUseTurnRate: roundTo(turns.filter((turn) => turn.skillActionsUsed > 0).length / totalTurns, 3),
    readySkillUnusedTurnRate: roundTo(
      readySkillTurns.filter((turn) => turn.skillActionsUsed === 0).length / Math.max(1, readySkillTurns.length),
      3
    ),
    slot1UseRate: roundTo(turns.filter((turn) => turn.slot1Used).length / totalTurns, 3),
    slot2UseRate: roundTo(turns.filter((turn) => turn.slot2Used).length / totalTurns, 3),
    slot3UseRate: roundTo(turns.filter((turn) => turn.slot3Used).length / totalTurns, 3),
    beamDecisionRate: roundTo(beamTurns.length / totalTurns, 3),
    averageBeamDepth: roundTo(
      beamTurns.reduce((sum, turn) => sum + turn.beamDepth, 0) / Math.max(1, beamTurns.length),
      3
    ),
    beamOverrideRate: roundTo(turns.filter((turn) => turn.beamOverride).length / totalTurns, 3),
  }
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
  // The action scorer clones combat state repeatedly; keep the clone cheap by
  // omitting the ever-growing log and reattaching the RNG callback afterward.
  const clone = structuredClone({
    ...state,
    log: [],
    randomFn: undefined,
  }) as CombatState
  clone.randomFn = state.randomFn
  return clone
}

function getHandValue(state: CombatState, content: GameContent, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  return state.hand.reduce((sum, entry) => {
    return sum + Math.max(0, scoreCard(content.cardCatalog[entry.cardId], policy, matchingProficiencies))
  }, 0)
}

function getCombatActionKey(candidate: CombatCandidateAction) {
  return [
    candidate.type,
    candidate.instanceId || "",
    candidate.slotKey || "",
    candidate.targetId || "",
    candidate.potionTarget || "",
  ].join(":")
}

function skillNeedsEnemyTarget(skill: CombatEquippedSkillState) {
  return skill.skillType === "attack" || skill.skillType === "spell" || skill.skillType === "debuff"
}

function hasPreparedSkillWindow(state: CombatState) {
  return Object.values(state.skillModifiers || {}).some((value) => Number(value || 0) > 0)
}

function hasReadyActiveSkill(state: CombatState) {
  return state.equippedSkills.some((skill) => {
    return (
      skill.active &&
      state.hero.energy >= skill.cost &&
      skill.remainingCooldown <= 0 &&
      (!skill.oncePerBattle || !skill.usedThisBattle) &&
      (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
    )
  })
}

function isBossEncounterState(state: CombatState) {
  const encounterId = String(state.encounter?.id || "")
  return encounterId.includes("_boss") || state.enemies.some((enemy) => enemy.alive && String(enemy.templateId || "").endsWith("_boss"))
}

function isDifficultEncounterState(state: CombatState) {
  const encounterId = String(state.encounter?.id || "")
  return (
    isBossEncounterState(state) ||
    encounterId.includes("_miniboss") ||
    state.enemies.some((enemy) => enemy.alive && String(enemy.templateId || "").includes("_elite")) ||
    hasChargeThreat(state) ||
    getThreatPressure(state) >= 0.55
  )
}

function getBeamSearchConfig(state: CombatState): BeamSearchConfig {
  const deservesDeepSearch =
    state.turn <= 4 || getThreatShortfall(state) > 0 || getThreatPressure(state) >= 0.5 || hasReadyActiveSkill(state) || hasPreparedSkillWindow(state)
  if (isBossEncounterState(state) && deservesDeepSearch) {
    return { depth: 3, beamWidth: 8, expandPerNode: 4, scoreDecay: 0.9 }
  }
  if (isDifficultEncounterState(state) && deservesDeepSearch) {
    return { depth: 2, beamWidth: 6, expandPerNode: 3, scoreDecay: 0.88 }
  }
  return { depth: 0, beamWidth: 0, expandPerNode: 0, scoreDecay: 0 }
}

function scoreCombatStateDelta(
  before: CombatState,
  after: CombatState,
  content: GameContent,
  actionType: CombatCandidateAction["type"],
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const beforeThreatProfile = getIncomingThreatProfile(before)
  const afterThreatProfile = getIncomingThreatProfile(after)
  const beforeBypassRatio = beforeThreatProfile.totalThreat > 0 ? beforeThreatProfile.bypassGuardThreat / beforeThreatProfile.totalThreat : 0
  const afterBypassRatio = afterThreatProfile.totalThreat > 0 ? afterThreatProfile.bypassGuardThreat / afterThreatProfile.totalThreat : 0
  const guardValueFactor = Math.max(0.15, 1 - Math.max(beforeBypassRatio, afterBypassRatio))
  const beforeEnemyLife = before.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const beforeEnemyGuard = before.enemies.reduce((sum, enemy) => sum + enemy.guard, 0)
  const afterEnemyLife = after.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const afterEnemyGuard = after.enemies.reduce((sum, enemy) => sum + enemy.guard, 0)
  const beforeLivingEnemies = before.enemies.filter((enemy) => enemy.alive).length
  const afterLivingEnemies = after.enemies.filter((enemy) => enemy.alive).length
  const beforeShortfall = getThreatShortfall(before)
  const afterShortfall = getThreatShortfall(after)
  const beforePressure = getThreatPressure(before)
  const afterPressure = getThreatPressure(after)
  const chargeThreat = hasChargeThreat(before)
  const beforeSafeFromThreat = beforeShortfall <= 0
  const afterSafeFromThreat = afterShortfall <= 0
  const underImmediateThreat = beforeShortfall > 0 || (chargeThreat && beforePressure >= 0.55)
  const shortfallWeight = underImmediateThreat ? (chargeThreat ? 22 : 12) : (chargeThreat ? 14 : 7)

  // Intent-aware defense: compute exact incoming damage and scale guard/heal value proportionally
  const heroHpRatio = before.hero.maxLife > 0 ? before.hero.life / before.hero.maxLife : 1
  const survivalUrgency = heroHpRatio < 0.3 ? 2.5 : heroHpRatio < 0.5 ? 1.8 : heroHpRatio < 0.7 ? 1.3 : 1.0
  const incomingThreat = getIncomingThreat(before)
  const guardGap = Math.max(0, incomingThreat - before.hero.guard)
  const guardSurplus = Math.max(0, before.hero.guard - incomingThreat)
  // Guard value scales with how much we need: high when gap exists, diminishes past sufficiency
  const guardUrgency = guardGap > 0 ? 1.5 + Math.min(1.5, guardGap / Math.max(1, before.hero.maxLife) * 3) : Math.max(0.4, 1 - guardSurplus * 0.06)
  // Would this action prevent lethal? (hero dies if no guard gained)
  const wouldBeLethal = incomingThreat > before.hero.guard + before.hero.life
  const afterSurvivesLethal = wouldBeLethal && (incomingThreat <= after.hero.guard + after.hero.life)
  // Kill-removes-threat: killing an enemy removes its incoming intent damage
  const killedEnemyThreatRemoved = before.enemies.reduce((sum, enemy) => {
    if (!enemy.alive) { return sum }
    const afterEnemy = after.enemies.find((e) => e.id === enemy.id)
    if (afterEnemy && !afterEnemy.alive && enemy.currentIntent) {
      const intentValue = Number(enemy.currentIntent.value || 0)
      if (ATTACK_INTENT_KINDS.has(enemy.currentIntent.kind)) { return sum + intentValue }
      if (enemy.currentIntent.kind === "charge") { return sum + intentValue }
    }
    return sum
  }, 0)

  // Focus fire: bonus for bringing an enemy close to death
  let focusFireBonus = 0
  for (const enemy of before.enemies) {
    if (!enemy.alive) { continue }
    const afterEnemy = after.enemies.find((e) => e.id === enemy.id)
    if (!afterEnemy) { continue }
    const lifeLost = enemy.life - afterEnemy.life
    if (lifeLost > 0 && afterEnemy.alive && afterEnemy.life <= afterEnemy.maxLife * 0.25) {
      focusFireBonus += 8
    }
  }

  // Skill-buffs-next-card: value skill modifiers that prep the next card
  let skillPrepBonus = 0
  if (actionType === "skill") {
    const mods = after.skillModifiers
    const beforeMods = before.skillModifiers
    if (mods.nextCardDamageBonus > beforeMods.nextCardDamageBonus) {
      skillPrepBonus += (mods.nextCardDamageBonus - beforeMods.nextCardDamageBonus) * 2.0
    }
    if (mods.nextCardCostReduction > beforeMods.nextCardCostReduction) {
      skillPrepBonus += (mods.nextCardCostReduction - beforeMods.nextCardCostReduction) * 4.0
    }
    if (mods.nextCardGuard > beforeMods.nextCardGuard) {
      skillPrepBonus += (mods.nextCardGuard - beforeMods.nextCardGuard) * 1.5
    }
    if (mods.nextCardBurn > beforeMods.nextCardBurn) {
      skillPrepBonus += (mods.nextCardBurn - beforeMods.nextCardBurn) * 1.5
    }
    if (mods.nextCardDraw > beforeMods.nextCardDraw) {
      skillPrepBonus += (mods.nextCardDraw - beforeMods.nextCardDraw) * 3.0
    }
  }

  // Draw value: worth more when hand is small
  const drawBonus = after.hand.length > before.hand.length ? (before.hand.length <= 2 ? 4 : 1) : 0

  let score =
    (beforeEnemyLife - afterEnemyLife) * 3.0 +
    (beforeEnemyGuard - afterEnemyGuard) * 1.0 +
    (after.hero.life - before.hero.life) * (2.5 * survivalUrgency) +
    (after.hero.guard - before.hero.guard) * (2.2 + policy.heroGuardWeight * 0.3) * guardValueFactor * guardUrgency +
    (after.mercenary.life - before.mercenary.life) * 1.8 +
    (after.mercenary.guard - before.mercenary.guard) * 1.2 * guardValueFactor +
    (beforeLivingEnemies - afterLivingEnemies) * 45 +
    killedEnemyThreatRemoved * 3.5 +
    focusFireBonus +
    skillPrepBonus +
    drawBonus +
    (getEnemyStatusScore(after) - getEnemyStatusScore(before)) * 1.2 +
    (getHeroDebuffScore(before) - getHeroDebuffScore(after)) * 2.0 +
    (beforeShortfall - afterShortfall) * shortfallWeight +
    (beforePressure - afterPressure) * (chargeThreat ? 42 : 18) +
    (getHandValue(after, content, policy, matchingProficiencies) - getHandValue(before, content, policy, matchingProficiencies)) * 0.12

  // Lethal prevention bonus: surviving a kill shot is extremely valuable
  if (afterSurvivesLethal) {
    score += 80
  }

  if (!beforeSafeFromThreat && afterSafeFromThreat) {
    score += chargeThreat ? 90 : 45
  }
  if (beforeSafeFromThreat && !afterSafeFromThreat) {
    score -= chargeThreat ? 100 : 50
  }
  if (!beforeSafeFromThreat && !afterSafeFromThreat) {
    score += (beforeShortfall - afterShortfall) * (chargeThreat ? 18 : 10)
  }
  if (chargeThreat && after.hero.guard > before.hero.guard && afterShortfall < beforeShortfall) {
    score += 18
  }
  if (afterThreatProfile.bypassGuardThreat > beforeThreatProfile.bypassGuardThreat) {
    score -= (afterThreatProfile.bypassGuardThreat - beforeThreatProfile.bypassGuardThreat) * 0.9
  }
  if (afterThreatProfile.bypassGuardThreat > 0 && after.hero.life < before.hero.life) {
    score -= (before.hero.life - after.hero.life) * 1.4
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
    // Potions are just healing — score based on survival value, no flat penalty
    if (wouldBeLethal) {
      score += 30
    }
    if ((before.hero.heroBurn + before.hero.heroPoison) >= 2 && heroHpRatio <= 0.6) {
      score += 8
    }
  }
  if (actionType === "end_turn") {
    score -= 2 + afterShortfall * (underImmediateThreat ? 5 : 2)
    if (chargeThreat) {
      score -= 10 + afterPressure * 8
    }
    if (!afterSafeFromThreat) {
      score -= chargeThreat ? 40 : 18
    }
  }
  return score
}

function buildCandidateActions(
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

  state.equippedSkills
    .filter((skill) => {
      return (
        skill.active &&
        state.hero.energy >= skill.cost &&
        skill.remainingCooldown <= 0 &&
        (!skill.oncePerBattle || !skill.usedThisBattle) &&
        (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
      )
    })
    .forEach((skill) => {
      if (skillNeedsEnemyTarget(skill) && state.enemies.some((enemy) => enemy.alive)) {
        getPriorityEnemyTargets(state)
          .slice(0, LOOKAHEAD_TARGET_LIMIT)
          .forEach((enemy) => {
            candidates.push({
              type: "skill",
              score: Number.NEGATIVE_INFINITY,
              slotKey: skill.slotKey,
              targetId: enemy.id,
            })
          })
        return
      }
      candidates.push({
        type: "skill",
        score: Number.NEGATIVE_INFINITY,
        slotKey: skill.slotKey,
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
  return candidates
}

function scoreCandidateActionImmediate(
  candidate: CombatCandidateAction,
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  if (candidate.type === "end_turn") {
    const clone = cloneCombatState(state)
    engine.endTurn(clone)
    const afterShortfall = getThreatShortfall(clone)
    return {
      ...candidate,
      afterShortfall,
      score: scoreCombatStateDelta(state, clone, content, "end_turn", policy, matchingProficiencies),
    }
  }

  const clone = cloneCombatState(state)
  let result: ActionResult = { ok: false, message: "Unknown action." }
  if (candidate.type === "card" && candidate.instanceId) {
    result = engine.playCard(clone, content, candidate.instanceId, candidate.targetId || "")
  } else if (candidate.type === "skill" && candidate.slotKey) {
    result = engine.useSkill(clone, candidate.slotKey, candidate.targetId || "")
  } else if (candidate.type === "melee") {
    result = engine.meleeStrike(clone, content)
  } else if (candidate.type === "potion" && candidate.potionTarget) {
    result = engine.usePotion(clone, candidate.potionTarget)
  }

  if (!result.ok) {
    return { ...candidate, score: Number.NEGATIVE_INFINITY }
  }

  const afterShortfall = getThreatShortfall(clone)

  return {
    ...candidate,
    afterShortfall,
    score: scoreCombatStateDelta(state, clone, content, candidate.type, policy, matchingProficiencies),
  }
}

function listCandidateActions(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  return buildCandidateActions(state, content, engine, policy, matchingProficiencies)
    .map((candidate) => scoreCandidateActionImmediate(candidate, state, content, engine, policy, matchingProficiencies))
}

interface BeamSearchNode {
  state: CombatState
  firstAction: CombatCandidateAction
  sequenceScore: number
  depth: number
  terminalShortfall: number
  terminal: boolean
}

interface BeamSearchChoice {
  action: CombatCandidateAction
  score: number
  terminalShortfall: number
}

function getBeamNodeRank(node: BeamSearchNode, initialShortfall: number, chargeThreat: boolean) {
  let rank = Number(node.sequenceScore)
  const shortfallImprovement = Math.max(0, initialShortfall - node.terminalShortfall)
  rank += shortfallImprovement * (chargeThreat ? 24 : 12)
  if (node.terminalShortfall <= 0) {
    rank += chargeThreat ? 80 : 40
  }
  return rank
}

function runBeamSearch(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>,
  rootCandidates: CombatCandidateAction[],
  config: BeamSearchConfig
): BeamSearchChoice | null {
  if (config.depth <= 0 || rootCandidates.length === 0) {
    return null
  }

  const initialShortfall = getThreatShortfall(state)
  const chargeThreat = hasChargeThreat(state)
  const seedCandidates = [...rootCandidates]
    .filter((candidate) => Number.isFinite(Number(candidate.score)))
    .sort((left, right) => Number(right.score) - Number(left.score))
  const rootKeys = new Set(
    seedCandidates
      .slice(0, config.beamWidth)
      .map((candidate) => getCombatActionKey(candidate))
  )
  const bestSkill = seedCandidates.find((candidate) => candidate.type === "skill") || null
  if (bestSkill) {
    rootKeys.add(getCombatActionKey(bestSkill))
  }
  if (initialShortfall > 0) {
    const bestThreatReducer =
      seedCandidates
        .filter((candidate) => Number.isFinite(Number(candidate.afterShortfall)))
        .sort((left, right) => {
          const shortfallDelta =
            Number(left.afterShortfall ?? Number.POSITIVE_INFINITY) - Number(right.afterShortfall ?? Number.POSITIVE_INFINITY)
          if (shortfallDelta !== 0) {
            return shortfallDelta
          }
          return Number(right.score) - Number(left.score)
        })[0] || null
    if (bestThreatReducer) {
      rootKeys.add(getCombatActionKey(bestThreatReducer))
    }
  }

  let frontier: BeamSearchNode[] = seedCandidates
    .filter((candidate) => rootKeys.has(getCombatActionKey(candidate)))
    .map((candidate) => {
      const clone = cloneCombatState(state)
      const result = executeCombatAction(candidate, clone, content, engine)
      if (!result.ok) {
        return null
      }
      return {
        state: clone,
        firstAction: candidate,
        sequenceScore: Number(candidate.score),
        depth: 1,
        terminalShortfall: getThreatShortfall(clone),
        terminal: Boolean(clone.outcome) || clone.phase !== "player" || candidate.type === "end_turn",
      }
    })
    .filter(Boolean) as BeamSearchNode[]

  if (frontier.length === 0) {
    return null
  }

  frontier = frontier
    .sort((left, right) => getBeamNodeRank(right, initialShortfall, chargeThreat) - getBeamNodeRank(left, initialShortfall, chargeThreat))
    .slice(0, config.beamWidth)

  for (let depth = 1; depth < config.depth; depth += 1) {
    const nextFrontier: BeamSearchNode[] = []
    frontier.forEach((node) => {
      if (node.terminal || node.depth >= config.depth) {
        nextFrontier.push(node)
        return
      }

      const candidates = buildCandidateActions(node.state, content, engine, policy, matchingProficiencies)
        .map((candidate) => scoreCandidateActionImmediate(candidate, node.state, content, engine, policy, matchingProficiencies))
        .filter((candidate) => Number.isFinite(Number(candidate.score)))
        .sort((left, right) => Number(right.score) - Number(left.score))
      const branchKeys = new Set(
        candidates
          .slice(0, config.expandPerNode)
          .map((candidate) => getCombatActionKey(candidate))
      )
      const branchSkill = candidates.find((candidate) => candidate.type === "skill") || null
      if (branchSkill) {
        branchKeys.add(getCombatActionKey(branchSkill))
      }

      candidates
        .filter((candidate) => branchKeys.has(getCombatActionKey(candidate)))
        .forEach((candidate) => {
          const clone = cloneCombatState(node.state)
          const result = executeCombatAction(candidate, clone, content, engine)
          if (!result.ok) {
            return
          }
          nextFrontier.push({
            state: clone,
            firstAction: node.firstAction,
            sequenceScore: roundTo(
              node.sequenceScore + Number(candidate.score) * Math.pow(config.scoreDecay, node.depth),
              3
            ),
            depth: node.depth + 1,
            terminalShortfall: getThreatShortfall(clone),
            terminal: Boolean(clone.outcome) || clone.phase !== "player" || candidate.type === "end_turn",
          })
        })
    })

    if (nextFrontier.length === 0) {
      break
    }

    frontier = nextFrontier
      .sort((left, right) => getBeamNodeRank(right, initialShortfall, chargeThreat) - getBeamNodeRank(left, initialShortfall, chargeThreat))
      .slice(0, config.beamWidth)
  }

  const bestNode = [...frontier]
    .sort((left, right) => getBeamNodeRank(right, initialShortfall, chargeThreat) - getBeamNodeRank(left, initialShortfall, chargeThreat))[0] || null

  return bestNode
    ? {
        action: bestNode.firstAction,
        score: bestNode.sequenceScore,
        terminalShortfall: bestNode.terminalShortfall,
      }
    : null
}

function chooseBestCombatAction(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  return chooseBestCombatActionWithStats(state, content, engine, policy, matchingProficiencies).action
}

function chooseBestCombatActionWithStats(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) : CombatActionChoiceStats {
  const candidates = listCandidateActions(state, content, engine, policy, matchingProficiencies).sort((left, right) => right.score - left.score)
  const beamConfig = getBeamSearchConfig(state)
  const best = candidates[0] || ({ type: "end_turn", score: 0 } as CombatCandidateAction)
  const endTurnCandidate = candidates.find((candidate) => candidate.type === "end_turn") || null
  const bestActiveCandidate = candidates.find((candidate) => candidate.type !== "end_turn") || null
  const finiteCandidates = candidates.filter((candidate) => Number.isFinite(Number(candidate.score)))
  const activeFiniteCandidates = finiteCandidates.filter((candidate) => candidate.type !== "end_turn")
  const currentShortfall = getThreatShortfall(state)
  const bestThreatReducer =
    currentShortfall > 0
      ? [...activeFiniteCandidates]
          .filter((candidate) => Number.isFinite(Number(candidate.afterShortfall)))
          .sort((left, right) => {
            const shortfallDelta =
              Number(left.afterShortfall ?? Number.POSITIVE_INFINITY) - Number(right.afterShortfall ?? Number.POSITIVE_INFINITY)
            if (shortfallDelta !== 0) {
              return shortfallDelta
            }
            return Number(right.score) - Number(left.score)
          })[0] || null
      : null
  const bestActiveScore = Number(bestActiveCandidate?.score ?? Number.NEGATIVE_INFINITY)
  const endTurnScore = Number(endTurnCandidate?.score ?? Number.NEGATIVE_INFINITY)
  const meaningfulFloor = Math.max(bestActiveScore - MEANINGFUL_DECISION_MARGIN, endTurnScore + PASS_REGRET_SIGNIFICANCE_THRESHOLD)
  const meaningfulCandidateCount = Number.isFinite(bestActiveScore)
    ? activeFiniteCandidates.filter((candidate) => Number(candidate.score) >= meaningfulFloor).length
    : 0
  const bestScore = Number(finiteCandidates[0]?.score ?? 0)
  const secondBestScore = Number(finiteCandidates[1]?.score ?? bestScore)
  const scoreSpread = roundTo(Math.max(0, bestScore - secondBestScore), 3)
  const endTurnRegret = roundTo(
    Number.isFinite(bestActiveScore) && Number.isFinite(endTurnScore) ? Math.max(0, bestActiveScore - endTurnScore) : 0,
    3
  )
  const chargeThreat = hasChargeThreat(state)
  const threatPressure = getThreatPressure(state)
  let action: CombatCandidateAction
  const beamChoice =
    beamConfig.depth > 0 && activeFiniteCandidates.length > 1
      ? runBeamSearch(state, content, engine, policy, matchingProficiencies, finiteCandidates, beamConfig)
      : null
  if (beamChoice) {
    action = beamChoice.action
  } else if (
    currentShortfall > 0 &&
    bestThreatReducer &&
    Number(bestThreatReducer.afterShortfall ?? Number.POSITIVE_INFINITY) < currentShortfall
  ) {
    action = bestThreatReducer
  } else if (best.score < 1) {
    if (
      bestActiveCandidate &&
      (chargeThreat || threatPressure >= 0.45) &&
      bestActiveCandidate.score > Number(endTurnCandidate?.score ?? Number.NEGATIVE_INFINITY)
    ) {
      action = bestActiveCandidate
    } else {
      action = { type: "end_turn", score: 0 } as CombatCandidateAction
    }
  } else {
    action = best
  }
  const beamUsed = Boolean(beamChoice)
  const beamDepth = beamUsed ? beamConfig.depth : 0
  const beamOverride = beamUsed && getCombatActionKey(action) !== getCombatActionKey(best)
  return {
    action,
    candidateCount: candidates.length,
    meaningfulCandidateCount,
    bestScore,
    secondBestScore,
    scoreSpread,
    endTurnScore: Number.isFinite(endTurnScore) ? roundTo(endTurnScore, 3) : 0,
    endTurnRegret,
    beamUsed,
    beamDepth,
    beamOverride,
  }
}

function executeCombatAction(action: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
  if (action.type === "card" && action.instanceId) {
    return engine.playCard(state, content, action.instanceId, action.targetId || "")
  }
  if (action.type === "skill" && action.slotKey) {
    return engine.useSkill(state, action.slotKey, action.targetId || "")
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
  if (action.type === "skill" && action.slotKey) {
    const skill = state.equippedSkills.find((entry) => entry.slotKey === action.slotKey) || null
    const target = action.targetId ? state.enemies.find((enemy) => enemy.id === action.targetId) : null
    return target ? `Skill: ${skill?.name || action.slotKey} -> ${target.name}` : `Skill: ${skill?.name || action.slotKey}`
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
    turnTrace.log = [...combatState.log].slice(0, 16).reverse().map((entry: CombatLogEntry) => entry.message)
    turnTrace.logEntries = [...combatState.log].slice(0, 16).reverse()
    turns.push(turnTrace)
  }

  return {
    outcome: combatState.outcome || "timeout",
    turns,
    finalState: snapshotTraceState(combatState, harness.content),
    recentLog: [...combatState.log].slice(0, 24).reverse().map((entry: CombatLogEntry) => entry.message),
    recentLogEntries: [...combatState.log].slice(0, 24).reverse(),
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
  const classProgression = harness.classRegistry.getClassProgression(harness.content, run.classId) || null
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, profile)
  const combatBonuses = harness.itemSystem.buildCombatBonuses(run, harness.content)
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null
  const weaponEquipment = getWeaponEquipment(run)
  const weaponItemId = weaponEquipment?.itemId || ""
  const weaponItem = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponItemId)
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || ""
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  const allSkills = classProgression ? classProgression.trees.flatMap((tree: RuntimeClassTreeDefinition) => tree.skills) : []
  const equippedSkillBar = run.progression?.classProgression?.equippedSkillBar || {
    slot1SkillId: "",
    slot2SkillId: "",
    slot3SkillId: "",
  }
  const equippedSkills = (["slot1", "slot2", "slot3"] as RunSkillBarSlotKey[])
    .map((slotKey) => {
      const skillId = equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || ""
      const skill = allSkills.find((entry: RuntimeClassSkillDefinition) => entry.id === skillId) || null
      return skill ? { slotKey, skill } : null
    })
    .filter(Boolean) as CombatSkillLoadoutEntry[]

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
    equippedSkills,
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
  const turnTelemetry: TurnDecisionTelemetry[] = []

  while (!combatState.outcome && combatState.turn < maxTurns) {
    if (combatState.phase !== "player") {
      harness.combatEngine.endTurn(combatState)
      continue
    }
    const telemetry: TurnDecisionTelemetry = {
      startingEnergy: Number(combatState.hero.energy || 0),
      startingHandSize: combatState.hand.length,
      cardsPlayed: 0,
      endingEnergy: 0,
      endingHandSize: 0,
      meaningfulUnplayed: 0,
      candidateCount: 0,
      meaningfulCandidateCount: 0,
      decisionScoreSpread: 0,
      endTurnRegret: 0,
      readySkillCount: getReadySkillCount(combatState, Number(combatState.hero.energy || 0)),
      skillActionsUsed: 0,
      slot1Used: false,
      slot2Used: false,
      slot3Used: false,
      beamUsed: false,
      beamDepth: 0,
      beamOverride: false,
    }
    let actionsTaken = 0
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const choice = chooseBestCombatActionWithStats(combatState, harness.content, harness.combatEngine, policy, matchingProficiencies)
      if (actionsTaken === 0) {
        telemetry.candidateCount = choice.candidateCount
        telemetry.meaningfulCandidateCount = choice.meaningfulCandidateCount
        telemetry.decisionScoreSpread = choice.scoreSpread
        telemetry.endTurnRegret = choice.endTurnRegret
        telemetry.beamUsed = choice.beamUsed
        telemetry.beamDepth = choice.beamDepth
        telemetry.beamOverride = choice.beamOverride
      }
      const result = executeCombatAction(choice.action, combatState, harness.content, harness.combatEngine)
      if (result.ok && choice.action.type === "card") {
        telemetry.cardsPlayed += 1
      } else if (result.ok && choice.action.type === "skill") {
        telemetry.skillActionsUsed += 1
        telemetry[`${choice.action.slotKey}Used` as "slot1Used" | "slot2Used" | "slot3Used"] = true
      }
      actionsTaken += 1
      if (!result.ok || choice.action.type === "end_turn") {
        break
      }
    }
    telemetry.endingEnergy = Number(combatState.hero.energy || 0)
    telemetry.endingHandSize = combatState.hand.length
    telemetry.meaningfulUnplayed = getMeaningfulUnplayedCount(
      combatState,
      harness.content,
      policy,
      matchingProficiencies,
      telemetry.startingEnergy
    )
    turnTelemetry.push(telemetry)
    if (!combatState.outcome && combatState.phase === "player") {
      harness.combatEngine.endTurn(combatState)
    }
  }

  const remainingEnemyLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.life, 0)
  const enemyMaxLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.maxLife, 0)
  const telemetrySummary = summarizeTurnTelemetry(turnTelemetry)
  const logSummary = harness.browserWindow.__ROUGE_COMBAT_LOG.summarizeCombatLog(combatState)
  return {
    outcome: combatState.outcome || "timeout",
    turns: combatState.turn,
    heroLifePct: combatState.hero.maxLife > 0 ? combatState.hero.life / combatState.hero.maxLife : 0,
    mercenaryLifePct: combatState.mercenary.maxLife > 0 ? combatState.mercenary.life / combatState.mercenary.maxLife : 0,
    enemyLifePct: enemyMaxLife > 0 ? remainingEnemyLife / enemyMaxLife : 0,
    ...telemetrySummary,
    logSummary,
  }
}

export function playStateCombat(
  harness: AppHarness,
  state: AppState,
  policy: BuildPolicyDefinition,
  maxCombatTurns: number,
  hooks?: CombatSimulationHooks
): SimulatedCombatResult | null {
  if (!state.combat) {
    return null
  }
  const startingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0)
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(state.combat))
  const actionLimitPerTurn = 32
  const encounterStartedAt = Date.now()
  const slowStepThresholdMs = Math.max(250, Number(hooks?.slowStepThresholdMs || 1500))
  const turnTelemetry: TurnDecisionTelemetry[] = []

  while (!state.combat.outcome && state.combat.turn < maxCombatTurns) {
    if (state.combat.phase !== "player") {
      const shouldLogStart = Number(state.combat.turn || 0) === 0
      if (shouldLogStart) {
        hooks?.onProgress?.({
          stage: "end_turn_started",
          turn: Number(state.combat.turn || 0),
          actionIndex: 0,
          candidateCount: 0,
          bestScore: 0,
          stepElapsedMs: 0,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `phase ${state.combat.phase}`,
        })
      }
      const endTurnStartedAt = Date.now()
      harness.combatEngine.endTurn(state.combat)
      const endTurnElapsedMs = Date.now() - endTurnStartedAt
      if (shouldLogStart || endTurnElapsedMs >= slowStepThresholdMs) {
        hooks?.onProgress?.({
          stage: "end_turn_completed",
          turn: Number(state.combat.turn || 0),
          actionIndex: 0,
          candidateCount: 0,
          bestScore: 0,
          stepElapsedMs: endTurnElapsedMs,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `phase ${state.combat.phase}`,
        })
      }
      continue
    }
    let actionsTaken = 0
    const telemetry: TurnDecisionTelemetry = {
      startingEnergy: Number(state.combat.hero.energy || 0),
      startingHandSize: state.combat.hand.length,
      cardsPlayed: 0,
      endingEnergy: 0,
      endingHandSize: 0,
      meaningfulUnplayed: 0,
      candidateCount: 0,
      meaningfulCandidateCount: 0,
      decisionScoreSpread: 0,
      endTurnRegret: 0,
      readySkillCount: getReadySkillCount(state.combat, Number(state.combat.hero.energy || 0)),
      skillActionsUsed: 0,
      slot1Used: false,
      slot2Used: false,
      slot3Used: false,
      beamUsed: false,
      beamDepth: 0,
      beamOverride: false,
    }
    if (Number(state.combat.turn || 0) === 0 || Number(state.combat.turn || 0) % 5 === 0) {
      hooks?.onProgress?.({
        stage: "turn_start",
        turn: Number(state.combat.turn || 0),
        actionIndex: 0,
        candidateCount: 0,
        bestScore: 0,
        stepElapsedMs: 0,
        encounterElapsedMs: Date.now() - encounterStartedAt,
        detail: `energy ${state.combat.hero.energy} hand ${state.combat.hand.length}`,
      })
    }
    while (state.combat.phase === "player" && !state.combat.outcome && actionsTaken < actionLimitPerTurn) {
      const shouldLogAction = Number(state.combat.turn || 0) === 0 && actionsTaken === 0
      if (shouldLogAction) {
        hooks?.onProgress?.({
          stage: "action_select_started",
          turn: Number(state.combat.turn || 0),
          actionIndex: actionsTaken,
          candidateCount: 0,
          bestScore: 0,
          stepElapsedMs: 0,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `energy ${state.combat.hero.energy} hand ${state.combat.hand.length}`,
        })
      }
      const chooseStartedAt = Date.now()
      const choice = chooseBestCombatActionWithStats(state.combat, harness.content, harness.combatEngine, policy, matchingProficiencies)
      if (actionsTaken === 0) {
        telemetry.candidateCount = choice.candidateCount
        telemetry.meaningfulCandidateCount = choice.meaningfulCandidateCount
        telemetry.decisionScoreSpread = choice.scoreSpread
        telemetry.endTurnRegret = choice.endTurnRegret
        telemetry.beamUsed = choice.beamUsed
        telemetry.beamDepth = choice.beamDepth
        telemetry.beamOverride = choice.beamOverride
      }
      const chooseElapsedMs = Date.now() - chooseStartedAt
      if (shouldLogAction || chooseElapsedMs >= slowStepThresholdMs) {
        hooks?.onProgress?.({
          stage: "action_selected",
          turn: Number(state.combat.turn || 0),
          actionIndex: actionsTaken,
          candidateCount: choice.candidateCount,
          bestScore: roundTo(choice.bestScore, 2),
          stepElapsedMs: chooseElapsedMs,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `action ${choice.action.type}`,
        })
      }
      const executeStartedAt = Date.now()
      const result = executeCombatAction(choice.action, state.combat, harness.content, harness.combatEngine)
      if (result.ok && choice.action.type === "card") {
        telemetry.cardsPlayed += 1
      } else if (result.ok && choice.action.type === "skill") {
        telemetry.skillActionsUsed += 1
        telemetry[`${choice.action.slotKey}Used` as "slot1Used" | "slot2Used" | "slot3Used"] = true
      }
      const executeElapsedMs = Date.now() - executeStartedAt
      if (shouldLogAction || executeElapsedMs >= slowStepThresholdMs) {
        hooks?.onProgress?.({
          stage: "action_executed",
          turn: Number(state.combat.turn || 0),
          actionIndex: actionsTaken,
          candidateCount: choice.candidateCount,
          bestScore: roundTo(choice.bestScore, 2),
          stepElapsedMs: executeElapsedMs,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `${choice.action.type} ok=${result.ok ? "yes" : "no"}`,
        })
      }
      actionsTaken += 1
      if (!result.ok || choice.action.type === "end_turn") {
        break
      }
    }
    telemetry.endingEnergy = Number(state.combat.hero.energy || 0)
    telemetry.endingHandSize = state.combat.hand.length
    telemetry.meaningfulUnplayed = getMeaningfulUnplayedCount(
      state.combat,
      harness.content,
      policy,
      matchingProficiencies,
      telemetry.startingEnergy
    )
    turnTelemetry.push(telemetry)
    if (!state.combat.outcome && state.combat.phase === "player") {
      const endTurnStartedAt = Date.now()
      if (Number(state.combat.turn || 0) === 0) {
        hooks?.onProgress?.({
          stage: "end_turn_started",
          turn: Number(state.combat.turn || 0),
          actionIndex: actionsTaken,
          candidateCount: 0,
          bestScore: 0,
          stepElapsedMs: 0,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: "player phase fallback",
        })
      }
      harness.combatEngine.endTurn(state.combat)
      const endTurnElapsedMs = Date.now() - endTurnStartedAt
      if (Number(state.combat.turn || 0) === 0 || endTurnElapsedMs >= slowStepThresholdMs) {
        hooks?.onProgress?.({
          stage: "end_turn_completed",
          turn: Number(state.combat.turn || 0),
          actionIndex: actionsTaken,
          candidateCount: 0,
          bestScore: 0,
          stepElapsedMs: endTurnElapsedMs,
          encounterElapsedMs: Date.now() - encounterStartedAt,
          detail: `phase ${state.combat.phase}`,
        })
      }
    }
  }

  if (!state.combat.outcome) {
    state.combat.outcome = "defeat"
  }
  hooks?.onProgress?.({
    stage: "combat_complete",
    turn: Number(state.combat.turn || 0),
    actionIndex: 0,
    candidateCount: 0,
    bestScore: 0,
    stepElapsedMs: 0,
    encounterElapsedMs: Date.now() - encounterStartedAt,
    detail: `outcome ${state.combat.outcome || "defeat"}`,
  })
  const remainingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0)
  const telemetrySummary = summarizeTurnTelemetry(turnTelemetry)
  const logSummary = harness.browserWindow.__ROUGE_COMBAT_LOG.summarizeCombatLog(state.combat)
  return {
    outcome: state.combat.outcome || "defeat",
    turns: Number(state.combat.turn || 0),
    heroLifePct: state.combat.hero.maxLife > 0 ? roundTo((Number(state.combat.hero.life || 0) / Number(state.combat.hero.maxLife || 1)) * 100) : 0,
    mercenaryLifePct:
      state.combat.mercenary.maxLife > 0
        ? roundTo((Number(state.combat.mercenary.life || 0) / Number(state.combat.mercenary.maxLife || 1)) * 100)
        : 0,
    enemyLifePct: startingEnemyLife > 0 ? roundTo((remainingEnemyLife / startingEnemyLife) * 100) : 0,
    ...telemetrySummary,
    logSummary,
  }
}
