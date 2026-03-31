import { createAppHarness } from "./browser-harness"

export type AppHarness = ReturnType<typeof createAppHarness>

export const DEFAULT_CLASS_IDS = [
  "amazon",
  "assassin",
  "barbarian",
  "druid",
  "necromancer",
  "paladin",
  "sorceress",
] as const
const DEFAULT_POLICY_IDS = ["balanced", "aggressive", "control", "bulwark"] as const

const DEFAULT_MERCENARY_BY_CLASS: Record<string, string> = {
  amazon: "rogue_scout",
  assassin: "rogue_scout",
  barbarian: "desert_guard",
  druid: "desert_guard",
  necromancer: "iron_wolf",
  paladin: "desert_guard",
  sorceress: "iron_wolf",
}

export const POLICY_ARCHETYPE_PRIORITIES: Record<string, Record<string, string[]>> = {
  aggressive: {
    amazon: ["amazon_bow_and_crossbow", "amazon_javelin_and_spear"],
    assassin: ["assassin_martial_arts", "assassin_traps"],
    barbarian: ["barbarian_combat_skills", "barbarian_warcries"],
    druid: ["druid_elemental", "druid_shape_shifting"],
    necromancer: ["necromancer_poison_and_bone", "necromancer_curses"],
    paladin: ["paladin_combat_skills", "paladin_offensive_auras"],
    sorceress: ["sorceress_lightning", "sorceress_fire"],
  },
}

export const SIMULATION_SCORING_WEIGHTS = {
  cardEffectBase: {
    damage: 2.2,
    damage_all: 2.8,
    gain_guard_self: 1.3,
    gain_guard_party: 1.6,
    heal_hero: 1.6,
    heal_mercenary: 0.8,
    draw: 3.0,
    mark_enemy_for_mercenary: 3.0,
    buff_mercenary_next_attack: 2.0,
    apply_burn: 2.0,
    apply_burn_all: 2.5,
    apply_poison: 2.0,
    apply_poison_all: 2.5,
    apply_slow: 2.2,
    apply_slow_all: 2.8,
    apply_freeze: 2.6,
    apply_freeze_all: 3.0,
    apply_stun: 2.8,
    apply_stun_all: 3.2,
    apply_paralyze: 2.8,
    apply_paralyze_all: 3.2,
    summon_minion: 3.6,
  } as Record<CardEffectKind, number>,
  status: {
    burn: 1.5,
    poison: 1.5,
    slow: 2.5,
    freeze: 3.5,
    stun: 4.0,
    paralyze: 4.0,
  },
  heroDebuff: {
    heroBurn: 1.5,
    heroPoison: 1.5,
    chill: 1.5,
    amplify: 2.0,
    weaken: 2.0,
    energyDrain: 1.5,
  },
}

export const ATTACK_INTENT_KINDS = new Set<EnemyIntentKind>([
  "attack",
  "attack_all",
  "attack_and_guard",
  "drain_attack",
  "sunder_attack",
  "attack_burn",
  "attack_burn_all",
  "attack_lightning",
  "attack_lightning_all",
  "attack_poison",
  "attack_poison_all",
  "attack_chill",
  "drain_energy",
])

export interface BuildPolicyDefinition {
  id: string
  label: string
  description: string
  heroLifeWeight: number
  heroEnergyWeight: number
  heroDamageWeight: number
  heroGuardWeight: number
  heroBurnWeight: number
  heroPotionWeight: number
  mercenaryLifeWeight: number
  mercenaryAttackWeight: number
  goldWeight: number
  potionChargeWeight: number
  currentLifeWeight: number
  currentMercLifeWeight: number
  deckTopWeight: number
  deckRestWeight: number
  deckBloatPenalty: number
  weaponWeight: number
  armorWeight: number
  matchingProficiencyWeight: number
  bankedSkillPointWeight: number
  bankedClassPointWeight: number
  bankedAttributePointWeight: number
  cardEffectMultipliers: Partial<Record<CardEffectKind, number>>
}

export const BUILD_POLICIES: Record<string, BuildPolicyDefinition> = {
  balanced: {
    id: "balanced",
    label: "Balanced",
    description: "Mixed offense, survival, and build quality with no extreme bias.",
    heroLifeWeight: 1.05,
    heroEnergyWeight: 0.75,
    heroDamageWeight: 2.7,
    heroGuardWeight: 1.85,
    heroBurnWeight: 1.1,
    heroPotionWeight: 0.9,
    mercenaryLifeWeight: 0.8,
    mercenaryAttackWeight: 1.45,
    goldWeight: 0.05,
    potionChargeWeight: 2.1,
    currentLifeWeight: 0.8,
    currentMercLifeWeight: 0.45,
    deckTopWeight: 1.0,
    deckRestWeight: 0.4,
    deckBloatPenalty: 1.6,
    weaponWeight: 1.0,
    armorWeight: 1.0,
    matchingProficiencyWeight: 2.1,
    bankedSkillPointWeight: 2.0,
    bankedClassPointWeight: 4.0,
    bankedAttributePointWeight: 3.5,
    cardEffectMultipliers: {
      draw: 1.1,
      summon_minion: 1.1,
      mark_enemy_for_mercenary: 1.05,
      buff_mercenary_next_attack: 1.05,
    },
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    description: "Prioritizes fast kills, high-pressure weapon lines, and burst card quality.",
    heroLifeWeight: 0.85,
    heroEnergyWeight: 0.55,
    heroDamageWeight: 3.35,
    heroGuardWeight: 1.2,
    heroBurnWeight: 1.2,
    heroPotionWeight: 0.7,
    mercenaryLifeWeight: 0.55,
    mercenaryAttackWeight: 1.8,
    goldWeight: 0.015,
    potionChargeWeight: 1.4,
    currentLifeWeight: 0.55,
    currentMercLifeWeight: 0.25,
    deckTopWeight: 1.15,
    deckRestWeight: 0.3,
    deckBloatPenalty: 2.1,
    weaponWeight: 1.25,
    armorWeight: 0.8,
    matchingProficiencyWeight: 2.8,
    bankedSkillPointWeight: 1.6,
    bankedClassPointWeight: 3.5,
    bankedAttributePointWeight: 3.0,
    cardEffectMultipliers: {
      damage: 1.3,
      damage_all: 1.25,
      summon_minion: 1.05,
      apply_burn: 1.1,
      apply_burn_all: 1.1,
      mark_enemy_for_mercenary: 1.2,
      buff_mercenary_next_attack: 1.15,
      gain_guard_self: 0.8,
      gain_guard_party: 0.8,
      heal_hero: 0.75,
      heal_mercenary: 0.7,
      draw: 0.95,
      apply_freeze: 0.85,
      apply_freeze_all: 0.85,
      apply_stun: 0.9,
      apply_stun_all: 0.9,
      apply_slow: 0.85,
      apply_slow_all: 0.85,
      apply_paralyze: 0.85,
      apply_paralyze_all: 0.85,
    },
  },
  control: {
    id: "control",
    label: "Control",
    description: "Leans on energy, draw, typed damage, and disabling effects to win slower fights.",
    heroLifeWeight: 0.9,
    heroEnergyWeight: 1.25,
    heroDamageWeight: 2.35,
    heroGuardWeight: 1.05,
    heroBurnWeight: 1.8,
    heroPotionWeight: 0.8,
    mercenaryLifeWeight: 0.6,
    mercenaryAttackWeight: 1.25,
    goldWeight: 0.04,
    potionChargeWeight: 1.6,
    currentLifeWeight: 0.6,
    currentMercLifeWeight: 0.3,
    deckTopWeight: 1.05,
    deckRestWeight: 0.45,
    deckBloatPenalty: 1.7,
    weaponWeight: 1.05,
    armorWeight: 0.9,
    matchingProficiencyWeight: 2.0,
    bankedSkillPointWeight: 2.2,
    bankedClassPointWeight: 4.2,
    bankedAttributePointWeight: 3.8,
    cardEffectMultipliers: {
      draw: 1.25,
      summon_minion: 1.2,
      apply_burn: 1.3,
      apply_burn_all: 1.35,
      apply_poison: 1.25,
      apply_poison_all: 1.3,
      apply_slow: 1.35,
      apply_slow_all: 1.35,
      apply_freeze: 1.4,
      apply_freeze_all: 1.4,
      apply_stun: 1.3,
      apply_stun_all: 1.3,
      apply_paralyze: 1.35,
      apply_paralyze_all: 1.35,
      gain_guard_self: 0.85,
      gain_guard_party: 0.9,
      heal_hero: 0.8,
      heal_mercenary: 0.75,
      damage: 0.95,
    },
  },
  bulwark: {
    id: "bulwark",
    label: "Bulwark",
    description: "Favours guard, life, mercenary durability, and attrition-resistant setups.",
    heroLifeWeight: 1.55,
    heroEnergyWeight: 0.65,
    heroDamageWeight: 2.05,
    heroGuardWeight: 2.25,
    heroBurnWeight: 0.8,
    heroPotionWeight: 1.35,
    mercenaryLifeWeight: 1.25,
    mercenaryAttackWeight: 1.25,
    goldWeight: 0.06,
    potionChargeWeight: 2.6,
    currentLifeWeight: 1.0,
    currentMercLifeWeight: 0.7,
    deckTopWeight: 0.95,
    deckRestWeight: 0.45,
    deckBloatPenalty: 1.45,
    weaponWeight: 0.95,
    armorWeight: 1.25,
    matchingProficiencyWeight: 1.8,
    bankedSkillPointWeight: 2.1,
    bankedClassPointWeight: 4.0,
    bankedAttributePointWeight: 3.7,
    cardEffectMultipliers: {
      gain_guard_self: 1.35,
      gain_guard_party: 1.4,
      summon_minion: 1.15,
      heal_hero: 1.3,
      heal_mercenary: 1.25,
      mark_enemy_for_mercenary: 1.15,
      buff_mercenary_next_attack: 1.15,
      damage: 0.95,
      damage_all: 0.95,
      draw: 0.95,
    },
  },
}

export interface CombatCandidateAction {
  type: "card" | "melee" | "potion" | "end_turn"
  score: number
  instanceId?: string
  targetId?: string
  potionTarget?: "hero" | "mercenary"
}

export interface EncounterRunMetric {
  actNumber: number
  encounterId: string
  encounterName: string
  zoneTitle: string
  kind: "boss" | "miniboss" | "elite" | "battle"
  zoneKind: string
  zoneRole: string
  outcome: string
  turns: number
  heroLifePct: number
  mercenaryLifePct: number
  enemyLifePct: number
  heroPowerScore: number
  enemyPowerScore: number
  powerRatio: number
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
}

export type ArchetypeCommitmentMode = "natural" | "committed"
export type ArchetypeCommitCheckpoint = "act_start" | "first_safe_zone" | "first_reward"
export type ArchetypeTargetBand = "flagship" | "secondary"

export interface ArchetypeLaneMetrics {
  targetArchetypeId: string
  targetArchetypeLabel: string
  deckAlignment: number
  weaponAlignment: number
  scoreAlignment: number
  laneIntegrity: number
  offLaneCardCount: number
  offLaneCardWeight: number
  alignedWeapon: boolean
}

export interface ArchetypeLaneIntegrityCheckpoint {
  checkpointId: string
  actNumber: number
  laneIntegrity: number
}

export interface RunArchetypeSimulationPlan {
  targetArchetypeId: string
  targetArchetypeLabel: string
  targetBand: ArchetypeTargetBand
  commitmentMode: ArchetypeCommitmentMode
  commitAct: number
  commitCheckpoint: ArchetypeCommitCheckpoint
  commitmentLocked: boolean
  commitmentSatisfied: boolean
  committedByCheckpoint: boolean
  committedAtCheckpointId: string
  postCommitCheckpointCount: number
  driftCountAfterCommit: number
  fallbackDebtCardCount: number
  fallbackDebtWeight: number
  fallbackWeaponDebt: boolean
  exitedFallbackGear: boolean
  laneIntegrityByCheckpoint: ArchetypeLaneIntegrityCheckpoint[]
}

export interface PolicyProgressSummary {
  actionCounts: Record<string, number>
  townActionCounts: Record<string, number>
  rewardKindCounts: Record<string, number>
  rewardEffectCounts: Record<string, number>
  rewardRoleCounts: Record<string, number>
  strategyRoleCounts: Record<string, number>
  zoneKindCounts: Record<string, number>
  zoneRoleCounts: Record<string, number>
  nodeTypeCounts: Record<string, number>
  encounterResults: EncounterRunMetric[]
}

export interface ProbeEncounterSummary {
  encounterId: string
  encounterName: string
  zoneTitle: string
  kind: "boss" | "miniboss" | "elite" | "battle"
  askTags: CounterTag[]
  missingCounterTags: CounterTag[]
  enemyPowerScore: number
  powerDelta: number
  powerRatio: number
  runs: number
  winRate: number
  averageTurns: number
  averageHeroLifePct: number
  averageMercenaryLifePct: number
  averageEnemyLifePct: number
  openingHandFullSpendRate: number
  averageTurn1UnspentEnergy: number
  averageEarlyUnspentEnergy: number
  averageEarlyMeaningfulUnplayedRate: number
  averageEarlyCandidateCount: number
  averageEarlyMeaningfulCandidateCount: number
  averageEarlyDecisionScoreSpread: number
  earlyCloseDecisionRate: number
  averageEarlyEndTurnRegret: number
}

export type CheckpointProbeProfile = "default" | "pressure"
export type RunCheckpointKind = "safe_zone" | "pre_boss"

export type DeckFamily = "pressure" | "setup_payoff" | "scaling_engine" | "control_answer" | "hybrid"

export interface FinalDeckProfileSummary {
  deckFamily: DeckFamily
  engineCardCount: number
  roleCounts: {
    setup: number
    payoff: number
    support: number
    answer: number
    salvage: number
    conversion: number
  }
  behaviorCounts: Partial<Record<CardBehaviorTag, number>>
  targetDeckSizeMin: number
  targetDeckSizeMax: number
  deckSizeStatus: "under_band" | "within_band" | "over_band"
  targetShapeFit: number
  primaryTreeCardCount: number
  secondaryUtilityTreeCardCount: number
  starterShellCardsRemaining: number
  refinedCardCount: number
  evolvedCardCount: number
  reinforcedCardCount: number
  centerpieceCards: Array<{
    cardId: string
    title: string
    count: number
    roleTag: CardRoleTag
    tree: string
    reinforced: boolean
  }>
}

export interface BuildJourneySummary {
  committedAtAct: number
  committedPrimaryTreeId: string
  firstMajorReinforcementAct: number
  firstPurgeAct: number
  rewardUpgradesByAct: Record<string, number>
  refinementsByAct: Record<string, number>
  evolutionsByAct: Record<string, number>
  purgesByAct: Record<string, number>
  transformsByAct: Record<string, number>
  driftActs: number[]
  recoveredFromDrift: boolean
  totalRewardUpgrades: number
  totalRefinements: number
  totalEvolutions: number
  totalPurges: number
  totalTransforms: number
}

export interface SafeZoneCheckpointSummary {
  checkpointKind: RunCheckpointKind
  checkpointId: string
  label: string
  actNumber: number
  level: number
  gold: number
  powerScore: number
  bossReadinessScore: number
  bossAdjustedPowerScore: number
  powerBreakdown: {
    offense: number
    defense: number
    sustain: number
    utility: number
    deck: number
    equipment: number
    progression: number
    resources: number
  }
  deckSize: number
  topCards: string[]
  deckProficiencies: Array<{ proficiency: string; count: number }>
  hero: {
    maxLife: number
    maxEnergy: number
    handSize: number
    potionHeal: number
    damageBonus: number
    guardBonus: number
    burnBonus: number
  }
  mercenary: {
    name: string
    maxLife: number
    attack: number
  }
  attributes: Record<string, number>
  training: Record<string, number>
  favoredTreeId: string
  favoredTreeName: string
  primaryTreeId: string
  secondaryUtilityTreeId: string
  specializationStage: RunSpecializationStage
  offTreeUtilityCount: number
  offTreeDamageCount: number
  counterCoverageTags: CounterTag[]
  dominantArchetypeId: string
  dominantArchetypeLabel: string
  dominantArchetypeScore: number
  secondaryArchetypeId: string
  secondaryArchetypeLabel: string
  secondaryArchetypeScore: number
  archetypeScores: Array<{ archetypeId: string; label: string; score: number }>
  weapon: {
    itemId: string
    name: string
    family: string
    rarity: string
  } | null
  activeRunewords: string[]
  runewordsForged: number
  armor: {
    resistances: Array<{ type: DamageType; amount: number }>
    immunities: DamageType[]
  }
  choiceCounts: Record<string, number>
  townActionCounts: Record<string, number>
  probes: ProbeEncounterSummary[]
  archetypeCommitment: {
    targetArchetypeId: string
    targetArchetypeLabel: string
    targetBand: ArchetypeTargetBand
    commitmentMode: ArchetypeCommitmentMode
    commitmentLocked: boolean
    commitmentSatisfied: boolean
    laneMetrics: ArchetypeLaneMetrics | null
  } | null
}

export interface SimulationFailureSummary {
  actNumber: number
  zoneTitle: string
  encounterId: string
  encounterName: string
  kind?: "boss" | "miniboss" | "elite" | "battle"
  zoneKind?: string
  zoneRole?: string
  nodeType?: string
}

export interface FinalBuildSummary {
  level: number
  deckSize: number
  topCards: string[]
  deckProficiencies: Array<{ proficiency: string; count: number }>
  hero: {
    maxLife: number
    maxEnergy: number
    handSize: number
    potionHeal: number
    damageBonus: number
    guardBonus: number
    burnBonus: number
  }
  mercenary: {
    name: string
    maxLife: number
    attack: number
  }
  weapon: {
    itemId: string
    name: string
    family: string
    rarity: string
    preferredForClass: boolean
    damageTypes: Array<{ type: WeaponDamageType; amount: number }>
    effects: Array<{ kind: WeaponEffectKind; amount: number }>
  } | null
  armor: {
    itemId: string
    name: string
    rarity: string
    resistances: Array<{ type: DamageType; amount: number }>
    immunities: DamageType[]
  } | null
  favoredTreeId: string
  favoredTreeName: string
  primaryTreeId: string
  secondaryUtilityTreeId: string
  specializationStage: RunSpecializationStage
  offTreeUtilityCount: number
  offTreeDamageCount: number
  counterCoverageTags: CounterTag[]
  dominantArchetypeId: string
  dominantArchetypeLabel: string
  dominantArchetypeScore: number
  secondaryArchetypeId: string
  secondaryArchetypeLabel: string
  secondaryArchetypeScore: number
  archetypeScores: Array<{ archetypeId: string; label: string; score: number }>
  activeRunewords: string[]
  deckProfile: FinalDeckProfileSummary
  archetypeCommitment: {
    targetArchetypeId: string
    targetArchetypeLabel: string
    targetBand: ArchetypeTargetBand
    commitmentMode: ArchetypeCommitmentMode
    commitmentLocked: boolean
    commitmentSatisfied: boolean
    committedByCheckpoint: boolean
    committedAtCheckpointId: string
    driftRateAfterCommit: number
    driftCountAfterCommit: number
    postCommitCheckpointCount: number
    fallbackDebtCardCount: number
    fallbackDebtWeight: number
    fallbackWeaponDebt: boolean
    exitedFallbackGear: boolean
    laneIntegrity: number
  } | null
}

export interface WorldProgressSummary {
  resolvedNodeCount: number
  worldFlagCount: number
  questOutcomes: number
  questFollowUpsResolved: number
  questChainsResolved: number
  shrineOutcomes: number
  eventOutcomes: number
  opportunityOutcomes: number
}

export interface PolicyRunSummary {
  runSummary: RunState["summary"]
  zoneKindCounts: Record<string, number>
  zoneRoleCounts: Record<string, number>
  nodeTypeCounts: Record<string, number>
  rewardKindCounts: Record<string, number>
  choiceKindCounts: Record<string, number>
  rewardEffectCounts: Record<string, number>
  rewardRoleCounts: Record<string, number>
  strategyRoleCounts: Record<string, number>
  townActionCounts: Record<string, number>
  encounterResults: EncounterRunMetric[]
  encounterMetricsByKind: Record<string, {
    count: number
    winRate: number
    averageTurns: number
    averageHeroLifePct: number
    averageMercenaryLifePct: number
    averageEnemyLifePct: number
    averagePowerRatio: number
    openingHandFullSpendRate: number
    averageTurn1UnspentEnergy: number
    averageEarlyUnspentEnergy: number
    averageEarlyMeaningfulUnplayedRate: number
    averageEarlyCandidateCount: number
    averageEarlyMeaningfulCandidateCount: number
    averageEarlyDecisionScoreSpread: number
    earlyCloseDecisionRate: number
    averageEarlyEndTurnRegret: number
  }>
  world: WorldProgressSummary
  finalBuild: FinalBuildSummary
  buildJourney: BuildJourneySummary
  archetypeCommitment: FinalBuildSummary["archetypeCommitment"]
}

export interface PolicySimulationReport {
  policyId: string
  policyLabel: string
  description: string
  assumptions: string[]
  outcome: "reached_checkpoint" | "run_complete" | "run_failed"
  finalActNumber: number
  finalLevel: number
  checkpoints: SafeZoneCheckpointSummary[]
  failure: SimulationFailureSummary | null
  summary: PolicyRunSummary
}

interface ClassProgressionReport {
  classId: string
  className: string
  policyReports: PolicySimulationReport[]
}

export interface RunProgressionSimulationReport {
  generatedAt: string
  throughActNumber: number
  classReports: ClassProgressionReport[]
}

export interface RunProgressionSimulationOptions {
  classIds?: string[]
  policyIds?: string[]
  throughActNumber?: number
  probeRuns?: number
  maxCombatTurns?: number
  seedOffset?: number
  checkpointProbeProfile?: CheckpointProbeProfile
  targetArchetypeId?: string
  commitmentMode?: ArchetypeCommitmentMode
  commitAct?: number
  commitCheckpoint?: ArchetypeCommitCheckpoint
}

export interface TrackedRandomFn extends RandomFn {
  getState(): number
  getSeed(): number
  setState(state: number): void
}

export interface RunProgressionContinuationContext {
  policyId: string
  throughActNumber: number
  probeRuns: number
  maxCombatTurns: number
  seedOffset: number
  progress: PolicyProgressSummary
  checkpoints: SafeZoneCheckpointSummary[]
  failure: SimulationFailureSummary | null
  lastEncounterContext: SimulationFailureSummary | null
  archetypePlan: RunArchetypeSimulationPlan | null
}

export interface PolicySimulationHooks {
  onInitialized?: (payload: {
    state: AppState
    harness: AppHarness
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    continuationContext: RunProgressionContinuationContext
  }) => void
  onCheckpointLite?: (payload: {
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    checkpoint: SafeZoneCheckpointSummary
  }) => void
  onCheckpoint?: (payload: {
    state: AppState
    harness: AppHarness
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    checkpoint: SafeZoneCheckpointSummary
    continuationContext: RunProgressionContinuationContext
  }) => void
  onEncounterStartLite?: (payload: {
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    encounter: SimulationFailureSummary
  }) => void
  onEncounterStart?: (payload: {
    state: AppState
    harness: AppHarness
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    encounter: SimulationFailureSummary
    continuationContext: RunProgressionContinuationContext
  }) => void
  onEncounterProgress?: (payload: {
    classId: string
    policy: BuildPolicyDefinition
    seedOffset: number
    encounter: SimulationFailureSummary
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
  onOperationProgress?: (payload: {
    classId: string
    policy: BuildPolicyDefinition
    seedOffset: number
    stage: "started" | "completed"
    operation:
      | "optimize_safe_zone"
      | "build_checkpoint"
      | "sync_encounter_outcome"
      | "choose_reward"
      | "claim_reward"
      | "leave_safe_zone"
      | "return_to_safe_zone"
      | "select_zone"
      | "continue_act_transition"
    actNumber: number
    phase: string
    elapsedMs: number
    detail?: string
  }) => void
  onRunFailure?: (payload: {
    state: AppState
    harness: AppHarness
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    failure: SimulationFailureSummary | null
    report: PolicySimulationReport
    continuationContext: RunProgressionContinuationContext
  }) => void
  onRunComplete?: (payload: {
    state: AppState
    harness: AppHarness
    policy: BuildPolicyDefinition
    classId: string
    seedOffset: number
    report: PolicySimulationReport
    continuationContext: RunProgressionContinuationContext
  }) => void
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function incrementCount(target: Record<string, number>, key: string | null | undefined, amount = 1) {
  const normalizedKey = String(key || "").trim()
  if (!normalizedKey) {
    return
  }
  target[normalizedKey] = (target[normalizedKey] || 0) + amount
}

export function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createProgressionSimulationSeed(classId: string, policyId: string, throughActNumber: number, seedOffset: number) {
  return hashString([classId, policyId, String(throughActNumber), String(seedOffset)].join("|"))
}

export function createTrackedRandom(seed: number, initialState?: number): TrackedRandomFn {
  let state = (initialState ?? seed) >>> 0
  if (!state) {
    state = 1
  }
  const randomFn = (() => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }) as TrackedRandomFn
  randomFn.getState = () => state >>> 0
  randomFn.getSeed = () => (seed >>> 0) || 1
  randomFn.setState = (nextState: number) => {
    state = (nextState >>> 0) || 1
  }
  return randomFn
}

export function createSeededRandom(seed: number): RandomFn {
  return createTrackedRandom(seed)
}

export function getTrackedRandomState(randomFn: RandomFn | null | undefined) {
  const tracked = randomFn as Partial<TrackedRandomFn> | null | undefined
  if (!tracked || typeof tracked.getState !== "function" || typeof tracked.getSeed !== "function") {
    return null
  }
  return {
    seed: Number(tracked.getSeed()),
    state: Number(tracked.getState()),
  }
}

export function createQuietAppHarness() {
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || "")
    if (message.startsWith("getTreeArchetype:")) {
      return
    }
    originalWarn(...args)
  }
  try {
    return createAppHarness()
  } finally {
    console.warn = originalWarn
  }
}

export function getPolicyDefinitions(policyIds: string[] | undefined) {
  const resolvedIds = policyIds && policyIds.length > 0 ? policyIds : [...DEFAULT_POLICY_IDS]
  return resolvedIds.map((policyId) => {
    const policy = BUILD_POLICIES[policyId]
    if (!policy) {
      throw new Error(`Unknown progression policy: ${policyId}`)
    }
    return policy
  })
}

export function getRunProgressionPolicyDefinitions() {
  return Object.values(BUILD_POLICIES).map((policy) => ({ ...policy }))
}

export function getMercenaryIdForClass(classId: string) {
  return DEFAULT_MERCENARY_BY_CLASS[classId] || "rogue_scout"
}

export function createEmptyPolicyProgressSummary(): PolicyProgressSummary {
  return {
    actionCounts: {},
    townActionCounts: {},
    rewardKindCounts: {},
    rewardEffectCounts: {},
    rewardRoleCounts: {},
    strategyRoleCounts: {},
    zoneKindCounts: {},
    zoneRoleCounts: {},
    nodeTypeCounts: {},
    encounterResults: [],
  }
}

export function getPolicySimulationAssumptions() {
  return [
    "Uses the live run/reward/combat runtime with a full-clear route and boss-last ordering.",
    "Reward and safe-zone choices are selected by greedy lookahead against a static power score.",
    "Safe-zone optimization currently covers progression spending, healing, belt refills, mercenary contract actions, vendor refresh/buy/equip lines, rune socketing/commission, blacksmith evolutions, and sage purges.",
    "Randomized town actions such as sage transforms and gambler purchases are still excluded from the optimizer.",
  ]
}

export function cloneContinuationContext(context: RunProgressionContinuationContext): RunProgressionContinuationContext {
  return JSON.parse(JSON.stringify(context)) as RunProgressionContinuationContext
}
