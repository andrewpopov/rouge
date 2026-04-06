import crypto from "node:crypto";
import zlib from "node:zlib";

import { createAppHarness } from "./browser-harness";
import { runBalanceSimulationReport, type BalanceSimulationReport } from "./combat-simulator";
import {
  applySimulationTrainingLoadout,
  createQuietAppHarness,
  createProgressionSimulationSeed,
  createSimulationState,
  createSimulationStateFromSnapshot,
  getRunProgressionPolicyDefinitions,
  getTrackedRandomState,
  runProgressionPolicyFromState,
  traceCombatStateWithPolicy,
  type PolicySimulationReport,
  type PolicyRunSummary,
  type RunProgressionContinuationContext,
  type RunProgressionTrainingLoadout,
  type SafeZoneCheckpointSummary,
  type SimulationFailureSummary,
} from "./run-progression-simulator";

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"] as const;
const DEFAULT_POLICY_IDS = ["aggressive", "balanced", "control", "bulwark"] as const;
const FLAGSHIP_ARCHETYPE_BY_CLASS: Record<string, string> = {
  amazon: "amazon_bow_and_crossbow",
  assassin: "assassin_martial_arts",
  barbarian: "barbarian_combat_skills",
  druid: "druid_elemental",
  necromancer: "necromancer_poison_and_bone",
  paladin: "paladin_combat_skills",
  sorceress: "sorceress_fire",
};

type BalanceCommitmentMode = "natural" | "committed";
type BalanceCommitCheckpoint = "act_start" | "first_safe_zone" | "first_reward";
type BalanceArchetypeTargetBand = "flagship" | "secondary";

export type BalanceScenarioType =
  | "campaign"
  | "checkpoint_probe"
  | "boss_probe"
  | "miniboss_probe"
  | "elite_probe"
  | "combat_balance"
  | "loot_economy"
  | "quest_strategy"
  | "archetype_convergence";

export interface BalanceMetricBand {
  metricId: string;
  label: string;
  min?: number;
  max?: number;
  severity?: "hard" | "soft";
}

export interface BalanceExperimentSpec {
  experimentId: string;
  title: string;
  scenarioType: BalanceScenarioType;
  classIds: string[];
  policyIds: string[];
  seedOffsets: number[];
  throughActNumber: number;
  probeRuns: number;
  maxCombatTurns: number;
  concurrency?: number;
  scenarioIds?: string[];
  encounterSetId?: string;
  runsPerEncounter?: number;
  encounterLimit?: number;
  expectedBands?: BalanceMetricBand[];
  baselineArtifactPath?: string;
  traceFailures?: boolean;
  traceOutliers?: boolean;
  slowRunThresholdMs?: number;
  tags?: string[];
  targetArchetypeId?: string;
  commitmentMode?: BalanceCommitmentMode;
  commitAct?: number;
  commitCheckpoint?: BalanceCommitCheckpoint;
}

export interface BalanceRunKey {
  experimentId: string;
  scenarioType: BalanceScenarioType;
  classId: string;
  policyId: string;
  seedOffset: number;
  targetArchetypeId?: string;
}

export interface BalanceRunTask {
  runKey: BalanceRunKey;
  classId: string;
  policyId: string;
  seedOffset: number;
  targetArchetypeId?: string;
  targetArchetypeLabel?: string;
  targetBand?: BalanceArchetypeTargetBand;
  trainingLoadout?: RunProgressionTrainingLoadout | null;
}

export interface BalanceArchetypeCatalogEntry extends RewardEngineArchetypeCatalogEntry {
  classId: string;
  targetBand: BalanceArchetypeTargetBand;
}

export interface BalanceSnapshotTokenEnvelope {
  kind: "rouge.balance.snapshot";
  version: 1;
  digest: string;
  capturedAt: string;
  capture: {
    kind: "start" | "checkpoint" | "pre_boss" | "pre_failure" | "failure" | "final";
    label: string;
    checkpointId?: string;
    encounterId?: string;
    runKey?: string;
  };
  snapshot: RunSnapshotEnvelope;
  combatState: CombatState | null;
  rng: {
    seed: number;
    state: number;
  } | null;
  simulation: {
    classId: string;
    policyId: string;
    throughActNumber: number;
    probeRuns: number;
    maxCombatTurns: number;
    seedOffset: number;
    continuationContext: RunProgressionContinuationContext | null;
  } | null;
}

export interface BalanceSnapshotReference {
  kind: BalanceSnapshotTokenEnvelope["capture"]["kind"];
  label: string;
  digest: string;
  token: string;
  checkpointId?: string;
  encounterId?: string;
}

export interface BalanceTraceReference {
  traceId: string;
  reason: string;
  snapshotDigest: string;
  artifactPath?: string;
}

export interface BalanceRunRecord {
  runKey: string;
  experimentId: string;
  scenarioType: BalanceScenarioType;
  classId: string;
  className: string;
  policyId: string;
  policyLabel: string;
  seedOffset: number;
  targetArchetypeId: string;
  targetArchetypeLabel: string;
  targetBand: BalanceArchetypeTargetBand | "";
  commitmentMode: BalanceCommitmentMode;
  outcome: string;
  finalActNumber: number;
  finalLevel: number;
  failure: SimulationFailureSummary | null;
  durationMs: number;
  completedAt: string;
  requestedTrainingLoadout?: RunProgressionTrainingLoadout | null;
  skillBar?: {
    favoredTreeId: string;
    unlockedSkillCount: number;
    unlockedSkillIds: string[];
    unlockedSkillNames: string[];
    slotStateLabel: string;
    equippedSkillIds: Record<RunSkillBarSlotKey, string>;
    equippedSkillNames: Record<RunSkillBarSlotKey, string>;
  };
  analysis?: {
    finalCheckpoint: {
      checkpointId: string;
      checkpointKind: "safe_zone" | "pre_boss";
      actNumber: number;
      level: number;
      powerScore: number;
      bossReadinessScore: number;
      bossAdjustedPowerScore: number;
    } | null;
    lastEncounter: {
      encounterId: string;
      encounterName: string;
      zoneTitle: string;
      kind: string;
      outcome: string;
      turns: number;
      heroPowerScore: number;
      enemyPowerScore: number;
      powerRatio: number;
    } | null;
    lastBoss: {
      encounterId: string;
      encounterName: string;
      zoneTitle: string;
      kind: string;
      outcome: string;
      turns: number;
      heroPowerScore: number;
      enemyPowerScore: number;
      powerRatio: number;
    } | null;
    trainingRealization: {
      favoredTreeRequested: string;
      favoredTreeActual: string;
      favoredTreeMatched: boolean;
      requestedUnlockedSkillIds: string[];
      actualUnlockedSkillIds: string[];
      slot2RequestedSkillId: string;
      slot2ActualSkillId: string;
      slot2Matched: boolean;
      slot3RequestedSkillId: string;
      slot3ActualSkillId: string;
      slot3Matched: boolean;
      fullyRealized: boolean;
    } | null;
    finalBuild: {
      hero: {
        maxLife: number;
        maxEnergy: number;
        handSize: number;
        potionHeal: number;
        damageBonus: number;
        guardBonus: number;
        burnBonus: number;
      };
      mercenary: {
        name: string;
        maxLife: number;
        attack: number;
      };
      weaponName: string;
      weaponFamily: string;
      armorName: string;
      favoredTreeId: string;
      favoredTreeName: string;
      dominantArchetypeId: string;
      dominantArchetypeLabel: string;
      secondaryArchetypeId: string;
      secondaryArchetypeLabel: string;
      deckFamily: string;
      targetShapeFit: number;
      starterShellCardsRemaining: number;
      reinforcedCardCount: number;
      deckSize: number;
      activeRunewords: string[];
      counterCoverageTags: string[];
      offTreeUtilityCount: number;
      offTreeDamageCount: number;
      topCards: string[];
      centerpieceCards: string[];
    };
  };
  checkpoints: SafeZoneCheckpointSummary[];
  summary: PolicyRunSummary;
  snapshots: Record<string, BalanceSnapshotReference>;
  traces: BalanceTraceReference[];
  archetypeEvaluation: PolicyRunSummary["archetypeCommitment"] | null;
  combat?: {
    scenarioId: string;
    scenarioLabel: string;
    encounterSetId: string;
    encounterSetLabel: string;
    runsPerEncounter: number;
    assumptions: string[];
    build: {
      level: number;
      actNumber: number;
      deckSize: number;
      powerScore: number;
      hero: {
        maxLife: number;
        maxEnergy: number;
        handSize: number;
        potionHeal: number;
        damageBonus: number;
        guardBonus: number;
        burnBonus: number;
      };
      mercenary: {
        maxLife: number;
        attack: number;
      };
      weapon: {
        itemId: string;
        name: string;
        family: string;
        rarity: string;
      } | null;
      armorResistances: Array<{ type: DamageType; amount: number }>;
      armorImmunities: DamageType[];
      notes: string[];
    };
    overall: {
      winRate: number;
      wins: number;
      losses: number;
      timeouts: number;
      averageTurns: number;
      averageHeroLifePct: number;
      averageMercenaryLifePct: number;
      averagePotionsRemaining: number;
      averageEnemyLifePct: number;
      openingHandFullSpendRate?: number;
      averageTurn1UnspentEnergy?: number;
      averageEarlyUnspentEnergy?: number;
      averageEarlyMeaningfulUnplayedRate?: number;
      averageEarlyCandidateCount?: number;
      averageEarlyMeaningfulCandidateCount?: number;
      averageEarlyDecisionScoreSpread?: number;
      earlyCloseDecisionRate?: number;
      averageEarlyEndTurnRegret?: number;
    };
    encounters: Array<{
      encounterId: string;
      encounterName: string;
      zoneTitle: string;
      zoneKind: string;
      kind: "boss" | "miniboss" | "elite" | "battle";
      runs: number;
      enemyPowerScore: number;
      powerDelta: number;
      powerRatio: number;
      winRate: number;
      wins: number;
      losses: number;
      timeouts: number;
      averageTurns: number;
      averageHeroLifePct: number;
      averageMercenaryLifePct: number;
      averagePotionsRemaining: number;
      averageEnemyLifePct: number;
      openingHandFullSpendRate?: number;
      averageTurn1UnspentEnergy?: number;
      averageEarlyUnspentEnergy?: number;
      averageEarlyMeaningfulUnplayedRate?: number;
      averageEarlyCandidateCount?: number;
      averageEarlyMeaningfulCandidateCount?: number;
      averageEarlyDecisionScoreSpread?: number;
      earlyCloseDecisionRate?: number;
      averageEarlyEndTurnRegret?: number;
    }>;
  } | null;
}

function buildRunSkillBarSummary(
  harness: ReturnType<typeof createQuietAppHarness>,
  run: RunState | null | undefined
): BalanceRunRecord["skillBar"] {
  if (!run) {
    return undefined;
  }
  const classProgression = harness.classRegistry.getClassProgression(harness.content, run.classId);
  const progressionSkills = Array.isArray(classProgression?.trees)
    ? classProgression.trees.flatMap((tree: RuntimeClassTreeDefinition) => tree.skills || [])
    : [];
  const equippedSkillIds = {
    slot1: run.progression?.classProgression?.equippedSkillBar?.slot1SkillId || "",
    slot2: run.progression?.classProgression?.equippedSkillBar?.slot2SkillId || "",
    slot3: run.progression?.classProgression?.equippedSkillBar?.slot3SkillId || "",
  };
  const equippedSkillNames = {
    slot1: progressionSkills.find((skill: RuntimeClassSkillDefinition) => skill.id === equippedSkillIds.slot1)?.name || "",
    slot2: progressionSkills.find((skill: RuntimeClassSkillDefinition) => skill.id === equippedSkillIds.slot2)?.name || "",
    slot3: progressionSkills.find((skill: RuntimeClassSkillDefinition) => skill.id === equippedSkillIds.slot3)?.name || "",
  };
  const unlockedSkillCount = Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
    ? run.progression.classProgression.unlockedSkillIds.length
    : 0;
  const unlockedSkillIds = Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
    ? [...run.progression.classProgression.unlockedSkillIds]
    : [];
  const unlockedSkillNames = unlockedSkillIds
    .map((skillId) => progressionSkills.find((skill: RuntimeClassSkillDefinition) => skill.id === skillId)?.name || "")
    .filter(Boolean);
  const filledSlots = Object.values(equippedSkillIds).filter(Boolean).length;
  return {
    favoredTreeId: String(run.progression?.classProgression?.favoredTreeId || ""),
    unlockedSkillCount,
    unlockedSkillIds,
    unlockedSkillNames,
    slotStateLabel: `${filledSlots} / 3`,
    equippedSkillIds,
    equippedSkillNames,
  };
}

function buildTrainingRealizationSummary(
  requestedTrainingLoadout: RunProgressionTrainingLoadout | null | undefined,
  skillBar: BalanceRunRecord["skillBar"]
): NonNullable<BalanceRunRecord["analysis"]>["trainingRealization"] {
  if (!requestedTrainingLoadout && !skillBar) {
    return null;
  }
  const requestedUnlockedSkillIds = Array.isArray(requestedTrainingLoadout?.unlockedSkillIds)
    ? requestedTrainingLoadout.unlockedSkillIds.filter(Boolean)
    : [];
  const actualUnlockedSkillIds = Array.isArray(skillBar?.unlockedSkillIds)
    ? skillBar.unlockedSkillIds.filter(Boolean)
    : [];
  const slot2RequestedSkillId = String(requestedTrainingLoadout?.equippedSkillIds?.slot2 || "");
  const slot3RequestedSkillId = String(requestedTrainingLoadout?.equippedSkillIds?.slot3 || "");
  const slot2ActualSkillId = String(skillBar?.equippedSkillIds?.slot2 || "");
  const slot3ActualSkillId = String(skillBar?.equippedSkillIds?.slot3 || "");
  const favoredTreeRequested = String(requestedTrainingLoadout?.favoredTreeId || "");
  const favoredTreeActual = String(skillBar?.favoredTreeId || "");
  const slot2Matched = !slot2RequestedSkillId || slot2RequestedSkillId === slot2ActualSkillId;
  const slot3Matched = !slot3RequestedSkillId || slot3RequestedSkillId === slot3ActualSkillId;
  const favoredTreeMatched = !favoredTreeRequested || favoredTreeRequested === favoredTreeActual;
  const unlockedMatched = requestedUnlockedSkillIds.every((skillId) => actualUnlockedSkillIds.includes(skillId));
  return {
    favoredTreeRequested,
    favoredTreeActual,
    favoredTreeMatched,
    requestedUnlockedSkillIds,
    actualUnlockedSkillIds,
    slot2RequestedSkillId,
    slot2ActualSkillId,
    slot2Matched,
    slot3RequestedSkillId,
    slot3ActualSkillId,
    slot3Matched,
    fullyRealized: favoredTreeMatched && slot2Matched && slot3Matched && unlockedMatched,
  };
}

function buildRunAnalysisSummary(
  report: PolicySimulationReport,
  requestedTrainingLoadout: RunProgressionTrainingLoadout | null | undefined,
  skillBar: BalanceRunRecord["skillBar"]
): BalanceRunRecord["analysis"] {
  const checkpoints = Array.isArray(report.checkpoints) ? report.checkpoints : [];
  const finalCheckpoint = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  const encounterResults = Array.isArray(report.summary?.encounterResults) ? report.summary.encounterResults : [];
  const lastEncounter = encounterResults.length > 0 ? encounterResults[encounterResults.length - 1] : null;
  const lastBoss = [...encounterResults].reverse().find((encounter) => encounter.kind === "boss") || null;
  const finalBuild = report.summary?.finalBuild || buildEmptyFinalBuild();
  return {
    finalCheckpoint: finalCheckpoint
      ? {
          checkpointId: finalCheckpoint.checkpointId,
          checkpointKind: finalCheckpoint.checkpointKind,
          actNumber: Number(finalCheckpoint.actNumber || 0),
          level: Number(finalCheckpoint.level || 0),
          powerScore: Number(finalCheckpoint.powerScore || 0),
          bossReadinessScore: Number(finalCheckpoint.bossReadinessScore || 0),
          bossAdjustedPowerScore: Number(finalCheckpoint.bossAdjustedPowerScore || 0),
        }
      : null,
    lastEncounter: lastEncounter
      ? {
          encounterId: lastEncounter.encounterId,
          encounterName: lastEncounter.encounterName,
          zoneTitle: lastEncounter.zoneTitle,
          kind: lastEncounter.kind,
          outcome: lastEncounter.outcome,
          turns: Number(lastEncounter.turns || 0),
          heroPowerScore: Number(lastEncounter.heroPowerScore || 0),
          enemyPowerScore: Number(lastEncounter.enemyPowerScore || 0),
          powerRatio: Number(lastEncounter.powerRatio || 0),
        }
      : null,
    lastBoss: lastBoss
      ? {
          encounterId: lastBoss.encounterId,
          encounterName: lastBoss.encounterName,
          zoneTitle: lastBoss.zoneTitle,
          kind: lastBoss.kind,
          outcome: lastBoss.outcome,
          turns: Number(lastBoss.turns || 0),
          heroPowerScore: Number(lastBoss.heroPowerScore || 0),
          enemyPowerScore: Number(lastBoss.enemyPowerScore || 0),
          powerRatio: Number(lastBoss.powerRatio || 0),
        }
      : null,
    trainingRealization: buildTrainingRealizationSummary(requestedTrainingLoadout, skillBar),
    finalBuild: {
      hero: { ...finalBuild.hero },
      mercenary: { ...finalBuild.mercenary },
      weaponName: finalBuild.weapon?.name || "",
      weaponFamily: finalBuild.weapon?.family || "",
      armorName: finalBuild.armor?.name || "",
      favoredTreeId: finalBuild.favoredTreeId || "",
      favoredTreeName: finalBuild.favoredTreeName || "",
      dominantArchetypeId: finalBuild.dominantArchetypeId || "",
      dominantArchetypeLabel: finalBuild.dominantArchetypeLabel || "",
      secondaryArchetypeId: finalBuild.secondaryArchetypeId || "",
      secondaryArchetypeLabel: finalBuild.secondaryArchetypeLabel || "",
      deckFamily: finalBuild.deckProfile?.deckFamily || "",
      targetShapeFit: Number(finalBuild.deckProfile?.targetShapeFit || 0),
      starterShellCardsRemaining: Number(finalBuild.deckProfile?.starterShellCardsRemaining || 0),
      reinforcedCardCount: Number(finalBuild.deckProfile?.reinforcedCardCount || 0),
      deckSize: Number(finalBuild.deckSize || 0),
      activeRunewords: [...(finalBuild.activeRunewords || [])],
      counterCoverageTags: [...(finalBuild.counterCoverageTags || [])],
      offTreeUtilityCount: Number(finalBuild.offTreeUtilityCount || 0),
      offTreeDamageCount: Number(finalBuild.offTreeDamageCount || 0),
      topCards: [...(finalBuild.topCards || [])],
      centerpieceCards: Array.isArray(finalBuild.deckProfile?.centerpieceCards)
        ? finalBuild.deckProfile.centerpieceCards
          .map((entry: { title?: string; cardId?: string }) => entry.title || entry.cardId)
          .filter(Boolean)
        : [],
    },
  };
}

function buildTaskTrainingLoadout(
  harness: ReturnType<typeof createQuietAppHarness>,
  classId: string,
  targetArchetypeId?: string
): RunProgressionTrainingLoadout | null {
  const treeId = String(targetArchetypeId || "");
  if (!treeId) {
    return null;
  }
  const classProgression = harness.classRegistry.getClassProgression(harness.content, classId);
  const targetTree = classProgression?.trees?.find((tree: RuntimeClassTreeDefinition) => tree.id === treeId) || null;
  if (!targetTree) {
    return null;
  }
  const bridgeSkill = targetTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2 || skill.tier === "bridge") || null;
  const capstoneSkill = targetTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 3 || skill.tier === "capstone") || null;
  const unlockedSkillIds = [bridgeSkill?.id || "", capstoneSkill?.id || ""].filter(Boolean);
  return {
    favoredTreeId: targetTree.id,
    unlockedSkillIds,
    equippedSkillIds: {
      slot2: bridgeSkill?.id || "",
      slot3: capstoneSkill?.id || "",
    },
  };
}

export interface BalanceBandEvaluation {
  metricId: string;
  label: string;
  actual: number | null;
  min?: number;
  max?: number;
  severity: "hard" | "soft";
  status: "pass" | "fail" | "missing";
}

export interface BalanceAggregateGroupSummary {
  classId: string;
  className: string;
  policyId: string;
  policyLabel: string;
  targetArchetypeId: string;
  targetArchetypeLabel: string;
  targetBand: BalanceArchetypeTargetBand | "";
  commitmentMode: BalanceCommitmentMode;
  runs: number;
  winRate: number;
  failureRate: number;
  act2Rate: number;
  act5Rate: number;
  averageFinalAct: number;
  averageFinalLevel: number;
  averageDurationMs: number;
}

export interface BalanceNaturalConvergenceSummary {
  classId: string;
  className: string;
  policyId: string;
  policyLabel: string;
  archetypeId: string;
  archetypeLabel: string;
  runs: number;
  convergenceRate: number;
  averageCommitAct: number;
  averageFinalLaneIntegrity: number;
}

export interface BalanceCommittedLaneSummary {
  classId: string;
  className: string;
  policyId: string;
  policyLabel: string;
  targetArchetypeId: string;
  targetArchetypeLabel: string;
  targetBand: BalanceArchetypeTargetBand;
  runs: number;
  clearRate: number;
  committedByCheckpointRate: number;
  identityDriftRate: number;
  averageLaneIntegrityAct2: number;
  averageLaneIntegrityAct3: number;
  averageLaneIntegrityAct4: number;
  averageLaneIntegrityFinal: number;
  averageBossTurns: number;
  commonEndWeapons: string[];
  commonRunewords: string[];
  commonFailureEncounters: string[];
  laneHealth: "healthy" | "playable but weak" | "identity drift" | "not viable";
}

export interface BalanceDecisionTensionSummary {
  status: "too solved" | "healthy tension" | "too clunky" | "mixed";
  reasons: string[];
}

export interface BalanceAggregateReport {
  experimentId: string;
  title: string;
  scenarioType: BalanceScenarioType;
  runs: number;
  completedRuns: number;
  coverageRate: number;
  overall: {
    winRate: number;
    failureRate: number;
    act2Rate: number;
    act5Rate: number;
    averageFinalAct: number;
    averageFinalLevel: number;
    averageDurationMs: number;
    averageRunewords: number;
    offArchetypeWeaponRate: number;
    handSizeBonusRate: number;
    combatSampleWinRate: number;
    primarySpecializationRate: number;
    masteryRate: number;
    averageOffTreeUtilityCount: number;
    averageOffTreeDamageCount: number;
    averageCounterCoverageCount: number;
    averageTargetShapeFit: number;
    averageStarterShellCardsRemaining: number;
    averageReinforcedCardCount: number;
    averageCenterpieceCount: number;
    deckFamilyDistribution: Record<string, number>;
    averageCommittedAtAct: number;
    averageFirstMajorReinforcementAct: number;
    averagePurgeCount: number;
    averageRefinementCount: number;
    averageEvolutionCount: number;
    openingHandFullSpendRate: number;
    averageTurn1UnspentEnergy: number;
    averageEarlyUnspentEnergy: number;
    averageEarlyMeaningfulUnplayedRate: number;
    averageEarlyCandidateCount: number;
    averageEarlyMeaningfulCandidateCount: number;
    averageEarlyDecisionScoreSpread: number;
    earlyCloseDecisionRate: number;
    averageEarlyEndTurnRegret: number;
    decisionTension: BalanceDecisionTensionSummary;
  };
  encounterMetricsByKind: Record<string, {
    count: number;
    winRate: number;
    averageTurns: number;
    averageHeroLifePct: number;
    averageMercenaryLifePct: number;
    averageEnemyLifePct: number;
    averagePowerRatio: number;
    openingHandFullSpendRate: number;
    averageTurn1UnspentEnergy: number;
    averageEarlyUnspentEnergy: number;
    averageEarlyMeaningfulUnplayedRate: number;
    averageEarlyCandidateCount: number;
    averageEarlyMeaningfulCandidateCount: number;
    averageEarlyDecisionScoreSpread: number;
    earlyCloseDecisionRate: number;
    averageEarlyEndTurnRegret: number;
    decisionTension: BalanceDecisionTensionSummary;
  }>;
  strategyRoleCounts: Record<string, number>;
  rewardRoleCounts: Record<string, number>;
  groups: BalanceAggregateGroupSummary[];
  archetypes: {
    naturalConvergence: BalanceNaturalConvergenceSummary[];
    committedLanes: BalanceCommittedLaneSummary[];
  };
}

export interface BalanceArtifact {
  generatedAt: string;
  experiment: BalanceExperimentSpec;
  runs: BalanceRunRecord[];
  aggregate: BalanceAggregateReport;
  bands: BalanceBandEvaluation[];
  baselineComparison: {
    baselinePath: string;
    deltas: Record<string, number>;
  } | null;
}

export interface BalanceJobState {
  startedAt: string;
  updatedAt: string;
  mode: "run" | "resume" | "retry-failures" | "retry-slow-runs";
  experimentId: string;
  artifactPath: string;
  logPath?: string;
  totalRuns: number;
  completedRuns: number;
  pendingRunKeys: string[];
  failedRunKeys: string[];
  slowRunKeys: string[];
}

export interface BalanceRunExecutionResult {
  record: BalanceRunRecord;
  tracePayloads: Array<{
    traceId: string;
    reason: string;
    snapshotDigest: string;
    payload: unknown;
  }>;
}

function buildEmptyDeckProfile(): PolicyRunSummary["finalBuild"]["deckProfile"] {
  return {
    deckFamily: "hybrid",
    engineCardCount: 0,
    roleCounts: {
      setup: 0,
      payoff: 0,
      support: 0,
      answer: 0,
      salvage: 0,
      conversion: 0,
    },
    behaviorCounts: {},
    targetDeckSizeMin: 10,
    targetDeckSizeMax: 14,
    deckSizeStatus: "within_band",
    targetShapeFit: 0,
    primaryTreeCardCount: 0,
    secondaryUtilityTreeCardCount: 0,
    starterShellCardsRemaining: 0,
    refinedCardCount: 0,
    evolvedCardCount: 0,
    reinforcedCardCount: 0,
    centerpieceCards: [],
  };
}

function buildEmptyBuildJourney(): PolicyRunSummary["buildJourney"] {
  return {
    committedAtAct: 0,
    committedPrimaryTreeId: "",
    firstMajorReinforcementAct: 0,
    firstPurgeAct: 0,
    rewardUpgradesByAct: {},
    refinementsByAct: {},
    evolutionsByAct: {},
    purgesByAct: {},
    transformsByAct: {},
    driftActs: [],
    recoveredFromDrift: false,
    totalRewardUpgrades: 0,
    totalRefinements: 0,
    totalEvolutions: 0,
    totalPurges: 0,
    totalTransforms: 0,
  };
}

function buildEmptyFinalBuild(): PolicyRunSummary["finalBuild"] {
  return {
    level: 0,
    deckSize: 0,
    topCards: [],
    deckProficiencies: [],
    hero: {
      maxLife: 0,
      maxEnergy: 0,
      handSize: 5,
      potionHeal: 0,
      damageBonus: 0,
      guardBonus: 0,
      burnBonus: 0,
    },
    mercenary: {
      name: "",
      maxLife: 0,
      attack: 0,
    },
    weapon: null,
    armor: null,
    favoredTreeId: "",
    favoredTreeName: "",
    dominantArchetypeId: "",
    dominantArchetypeLabel: "",
    dominantArchetypeScore: 0,
    secondaryArchetypeId: "",
    secondaryArchetypeLabel: "",
    secondaryArchetypeScore: 0,
    primaryTreeId: "",
    secondaryUtilityTreeId: "",
    specializationStage: "exploratory",
    offTreeUtilityCount: 0,
    offTreeDamageCount: 0,
    counterCoverageTags: [],
    archetypeScores: [],
    activeRunewords: [],
    deckProfile: buildEmptyDeckProfile(),
    archetypeCommitment: null,
  };
}

function buildEmptySummary(): PolicyRunSummary {
  return {
    runSummary: {} as RunState["summary"],
    zoneKindCounts: {},
    zoneRoleCounts: {},
    nodeTypeCounts: {},
    rewardKindCounts: {},
    choiceKindCounts: {},
    rewardEffectCounts: {},
    rewardRoleCounts: {},
    strategyRoleCounts: {},
    townActionCounts: {},
    encounterResults: [],
    encounterMetricsByKind: {},
    world: {
      resolvedNodeCount: 0,
      worldFlagCount: 0,
      questOutcomes: 0,
      questFollowUpsResolved: 0,
      questChainsResolved: 0,
      shrineOutcomes: 0,
      eventOutcomes: 0,
      opportunityOutcomes: 0,
    },
    finalBuild: buildEmptyFinalBuild(),
    buildJourney: buildEmptyBuildJourney(),
    archetypeCommitment: null,
  };
}

export function createSyntheticBalanceRunRecord(
  spec: BalanceExperimentSpec,
  task: BalanceRunTask,
  options: {
    outcome?: string;
    durationMs?: number;
    failureLabel?: string;
    errorMessage?: string;
  } = {}
): BalanceRunRecord {
  const summary = buildEmptySummary();
  if (options.errorMessage) {
    summary.rewardEffectCounts.worker_error = 1;
  }
  const failureLabel = options.failureLabel || "Worker failure";
  return {
    runKey: buildRunKeyString(task.runKey),
    experimentId: spec.experimentId,
    scenarioType: spec.scenarioType,
    classId: task.classId,
    className: task.classId,
    policyId: task.policyId,
    policyLabel: task.policyId,
    seedOffset: task.seedOffset,
    targetArchetypeId: task.targetArchetypeId || "",
    targetArchetypeLabel: task.targetArchetypeLabel || "",
    targetBand: task.targetBand || "",
    commitmentMode: spec.commitmentMode || "natural",
    outcome: options.outcome || "run_failed",
    finalActNumber: 0,
    finalLevel: 0,
    failure: {
      actNumber: 0,
      zoneTitle: failureLabel,
      encounterId: "synthetic_failure",
      encounterName: options.errorMessage ? `${failureLabel}: ${options.errorMessage}` : failureLabel,
      kind: "battle",
      zoneKind: "synthetic",
      zoneRole: "synthetic",
      nodeType: "synthetic",
    },
    durationMs: Number(options.durationMs || 0),
    completedAt: new Date().toISOString(),
    requestedTrainingLoadout: task.trainingLoadout || null,
    checkpoints: [],
    summary,
    snapshots: {},
    traces: [],
    archetypeEvaluation: null,
  };
}

function roundTo(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let cachedArchetypeCatalog: Record<string, Record<string, BalanceArchetypeCatalogEntry>> | null = null;

function digestString(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodeCompressedJson(value: unknown) {
  const json = JSON.stringify(value);
  return zlib.deflateRawSync(Buffer.from(json, "utf8")).toString("base64url");
}

function decodeCompressedJson<T>(token: string): T {
  const json = zlib.inflateRawSync(Buffer.from(token, "base64url")).toString("utf8");
  return JSON.parse(json) as T;
}

function getPolicyDefinition(policyId: string) {
  const policy = getRunProgressionPolicyDefinitions().find((entry) => entry.id === policyId);
  if (!policy) {
    throw new Error(`Unknown progression policy: ${policyId}`);
  }
  return policy;
}

function buildRunKeyString(runKey: BalanceRunKey) {
  const target = runKey.targetArchetypeId ? `:${runKey.targetArchetypeId}` : "";
  return `${runKey.experimentId}:${runKey.scenarioType}:${runKey.classId}:${runKey.policyId}:${runKey.seedOffset}${target}`;
}

export function getBalanceArchetypeCatalog(): Record<string, Record<string, BalanceArchetypeCatalogEntry>> {
  if (cachedArchetypeCatalog) {
    return clone(cachedArchetypeCatalog);
  }
  const harness = createQuietAppHarness();
  const rawCatalog = harness.browserWindow.ROUGE_REWARD_ENGINE
    ?.getArchetypeCatalog?.() || {};
  cachedArchetypeCatalog = Object.fromEntries(
    Object.entries(rawCatalog).map(([classId, entries]) => [
      classId,
      Object.fromEntries(
        Object.entries(entries || {}).map(([archetypeId, entry]) => [
          archetypeId,
          {
            classId,
            archetypeId,
            label: String(entry.label || archetypeId),
            primaryTrees: [...(entry.primaryTrees || [])],
            supportTrees: [...(entry.supportTrees || [])],
            weaponFamilies: [...(entry.weaponFamilies || [])],
            targetBand: FLAGSHIP_ARCHETYPE_BY_CLASS[classId] === archetypeId ? "flagship" : "secondary",
          },
        ])
      ),
    ])
  );
  return clone(cachedArchetypeCatalog);
}

function getCommittedTaskArchetypes(spec: BalanceExperimentSpec, classId: string): BalanceArchetypeCatalogEntry[] {
  const classCatalog = getBalanceArchetypeCatalog()[classId] || {};
  const entries = Object.values(classCatalog);
  if (spec.targetArchetypeId) {
    return entries.filter((entry) => entry.archetypeId === spec.targetArchetypeId);
  }
  return entries.sort((left, right) => {
    const bandOrder = left.targetBand === right.targetBand ? 0 : left.targetBand === "flagship" ? -1 : 1;
    return bandOrder || left.label.localeCompare(right.label);
  });
}

function buildTaskArchetypePlan(spec: BalanceExperimentSpec, task: BalanceRunTask) {
  if (spec.commitmentMode !== "committed" || !task.targetArchetypeId) {
    return null;
  }
  return {
    targetArchetypeId: task.targetArchetypeId,
    targetArchetypeLabel: task.targetArchetypeLabel || task.targetArchetypeId,
    targetBand: task.targetBand || "secondary",
    commitmentMode: spec.commitmentMode,
    commitAct: Number(spec.commitAct || 2),
    commitCheckpoint: spec.commitCheckpoint || "first_safe_zone",
  };
}

function mergeCounts(target: Record<string, number>, source: Record<string, number> | null | undefined) {
  Object.entries(source || {}).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + Number(value || 0);
  });
}

function aggregateEncounterMetrics(records: BalanceRunRecord[]) {
  const byKind: Record<string, {
    count: number;
    sampleWeight: number;
    winWeighted: number;
    turnsWeighted: number;
    heroLifeWeighted: number;
    mercLifeWeighted: number;
    enemyLifeWeighted: number;
    powerRatioWeighted: number;
    openingFullSpendWeighted: number;
    turn1UnspentEnergyWeighted: number;
    earlyUnspentEnergyWeighted: number;
    earlyMeaningfulUnplayedWeighted: number;
    earlyCandidateCountWeighted: number;
    earlyMeaningfulCandidateCountWeighted: number;
    earlyDecisionScoreSpreadWeighted: number;
    earlyCloseDecisionWeighted: number;
    earlyEndTurnRegretWeighted: number;
  }> = {};
  records.forEach((record) => {
    if (record.combat) {
      record.combat.encounters.forEach((entry) => {
        const kind = entry.kind || "battle";
        byKind[kind] = byKind[kind] || {
          count: 0,
          sampleWeight: 0,
          winWeighted: 0,
          turnsWeighted: 0,
          heroLifeWeighted: 0,
          mercLifeWeighted: 0,
          enemyLifeWeighted: 0,
          powerRatioWeighted: 0,
          openingFullSpendWeighted: 0,
          turn1UnspentEnergyWeighted: 0,
          earlyUnspentEnergyWeighted: 0,
          earlyMeaningfulUnplayedWeighted: 0,
          earlyCandidateCountWeighted: 0,
          earlyMeaningfulCandidateCountWeighted: 0,
          earlyDecisionScoreSpreadWeighted: 0,
          earlyCloseDecisionWeighted: 0,
          earlyEndTurnRegretWeighted: 0,
        };
        const aggregate = byKind[kind];
        const weight = Math.max(1, Number(entry.runs || 1));
        aggregate.count += 1;
        aggregate.sampleWeight += weight;
        aggregate.winWeighted += Number(entry.winRate || 0) * weight;
        aggregate.turnsWeighted += Number(entry.averageTurns || 0) * weight;
        aggregate.heroLifeWeighted += Number(entry.averageHeroLifePct || 0) * weight;
        aggregate.mercLifeWeighted += Number(entry.averageMercenaryLifePct || 0) * weight;
        aggregate.enemyLifeWeighted += Number(entry.averageEnemyLifePct || 0) * weight;
        aggregate.powerRatioWeighted += Number(entry.powerRatio || 0) * weight;
        aggregate.openingFullSpendWeighted += Number(entry.openingHandFullSpendRate || 0) * weight;
        aggregate.turn1UnspentEnergyWeighted += Number(entry.averageTurn1UnspentEnergy || 0) * weight;
        aggregate.earlyUnspentEnergyWeighted += Number(entry.averageEarlyUnspentEnergy || 0) * weight;
        aggregate.earlyMeaningfulUnplayedWeighted += Number(entry.averageEarlyMeaningfulUnplayedRate || 0) * weight;
        aggregate.earlyCandidateCountWeighted += Number(entry.averageEarlyCandidateCount || 0) * weight;
        aggregate.earlyMeaningfulCandidateCountWeighted += Number(entry.averageEarlyMeaningfulCandidateCount || 0) * weight;
        aggregate.earlyDecisionScoreSpreadWeighted += Number(entry.averageEarlyDecisionScoreSpread || 0) * weight;
        aggregate.earlyCloseDecisionWeighted += Number(entry.earlyCloseDecisionRate || 0) * weight;
        aggregate.earlyEndTurnRegretWeighted += Number(entry.averageEarlyEndTurnRegret || 0) * weight;
      });
      return;
    }

    (record.summary.encounterResults || []).forEach((entry) => {
      const kind = entry.kind || "battle";
      byKind[kind] = byKind[kind] || {
        count: 0,
        sampleWeight: 0,
        winWeighted: 0,
        turnsWeighted: 0,
        heroLifeWeighted: 0,
        mercLifeWeighted: 0,
        enemyLifeWeighted: 0,
        powerRatioWeighted: 0,
        openingFullSpendWeighted: 0,
        turn1UnspentEnergyWeighted: 0,
        earlyUnspentEnergyWeighted: 0,
        earlyMeaningfulUnplayedWeighted: 0,
        earlyCandidateCountWeighted: 0,
        earlyMeaningfulCandidateCountWeighted: 0,
        earlyDecisionScoreSpreadWeighted: 0,
        earlyCloseDecisionWeighted: 0,
        earlyEndTurnRegretWeighted: 0,
      };
      const aggregate = byKind[kind];
      aggregate.count += 1;
      aggregate.sampleWeight += 1;
      aggregate.winWeighted += entry.outcome === "victory" ? 1 : 0;
      aggregate.turnsWeighted += Number(entry.turns || 0);
      aggregate.heroLifeWeighted += Number(entry.heroLifePct || 0);
      aggregate.mercLifeWeighted += Number(entry.mercenaryLifePct || 0);
      aggregate.enemyLifeWeighted += Number(entry.enemyLifePct || 0);
      aggregate.powerRatioWeighted += Number(entry.powerRatio || 0);
      aggregate.openingFullSpendWeighted += entry.openingHandFullSpend ? 1 : 0;
      aggregate.turn1UnspentEnergyWeighted += Number(entry.turn1UnspentEnergy || 0);
      aggregate.earlyUnspentEnergyWeighted += Number(entry.earlyUnspentEnergyAverage || 0);
      aggregate.earlyMeaningfulUnplayedWeighted += Number(entry.earlyMeaningfulUnplayedRate || 0);
      aggregate.earlyCandidateCountWeighted += Number(entry.averageEarlyCandidateCount || 0);
      aggregate.earlyMeaningfulCandidateCountWeighted += Number(entry.averageEarlyMeaningfulCandidateCount || 0);
      aggregate.earlyDecisionScoreSpreadWeighted += Number(entry.averageEarlyDecisionScoreSpread || 0);
      aggregate.earlyCloseDecisionWeighted += Number(entry.earlyCloseDecisionRate || 0);
      aggregate.earlyEndTurnRegretWeighted += Number(entry.averageEarlyEndTurnRegret || 0);
    });
  });
  return Object.fromEntries(
    Object.entries(byKind).map(([kind, aggregate]) => {
      const weight = Math.max(1, aggregate.sampleWeight);
      const entry = {
        count: aggregate.count,
        winRate: roundTo(aggregate.winWeighted / weight),
        averageTurns: roundTo(aggregate.turnsWeighted / weight),
        averageHeroLifePct: roundTo(aggregate.heroLifeWeighted / weight),
        averageMercenaryLifePct: roundTo(aggregate.mercLifeWeighted / weight),
        averageEnemyLifePct: roundTo(aggregate.enemyLifeWeighted / weight),
        averagePowerRatio: roundTo(aggregate.powerRatioWeighted / weight),
        openingHandFullSpendRate: roundTo(aggregate.openingFullSpendWeighted / weight),
        averageTurn1UnspentEnergy: roundTo(aggregate.turn1UnspentEnergyWeighted / weight),
        averageEarlyUnspentEnergy: roundTo(aggregate.earlyUnspentEnergyWeighted / weight),
        averageEarlyMeaningfulUnplayedRate: roundTo(aggregate.earlyMeaningfulUnplayedWeighted / weight),
        averageEarlyCandidateCount: roundTo(aggregate.earlyCandidateCountWeighted / weight, 3),
        averageEarlyMeaningfulCandidateCount: roundTo(aggregate.earlyMeaningfulCandidateCountWeighted / weight, 3),
        averageEarlyDecisionScoreSpread: roundTo(aggregate.earlyDecisionScoreSpreadWeighted / weight, 3),
        earlyCloseDecisionRate: roundTo(aggregate.earlyCloseDecisionWeighted / weight, 3),
        averageEarlyEndTurnRegret: roundTo(aggregate.earlyEndTurnRegretWeighted / weight, 3),
      };
      return [kind, {
        ...entry,
        decisionTension: buildDecisionTensionSummary(entry),
      }];
    })
  );
}

export function getBalanceExperimentCatalog(): Record<string, BalanceExperimentSpec> {
  return {
    optimized_campaign: {
      experimentId: "optimized_campaign",
      title: "Optimized Campaign",
      scenarioType: "campaign",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "overall.win_rate", label: "Optimized clear rate", min: 0.55, max: 0.95, severity: "hard" },
        { metricId: "encounter.boss.average_turns", label: "Boss pacing", min: 4, max: 14, severity: "soft" },
      ],
      tags: ["baseline", "optimized", "campaign"],
    },
    weak_campaign: {
      experimentId: "weak_campaign",
      title: "Weak Campaign",
      scenarioType: "campaign",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["balanced", "control", "bulwark"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 2,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: false,
      slowRunThresholdMs: 45000,
      expectedBands: [
        { metricId: "overall.act2_rate", label: "Weak-line Act II reach rate", min: 0.35, max: 0.95, severity: "hard" },
        { metricId: "encounter.boss.average_turns", label: "Early boss pacing", min: 3, max: 12, severity: "soft" },
      ],
      tags: ["baseline", "weak", "campaign"],
    },
    boss_pacing: {
      experimentId: "boss_pacing",
      title: "Boss Pacing",
      scenarioType: "boss_probe",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 1,
      maxCombatTurns: 48,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "encounter.boss.average_turns", label: "Boss average turns", min: 4, max: 14, severity: "hard" },
      ],
      tags: ["baseline", "boss"],
    },
    miniboss_pressure: {
      experimentId: "miniboss_pressure",
      title: "Miniboss Pressure",
      scenarioType: "miniboss_probe",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 1,
      maxCombatTurns: 42,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "encounter.miniboss.average_turns", label: "Miniboss average turns", min: 3, max: 10, severity: "soft" },
        { metricId: "encounter.miniboss.win_rate", label: "Miniboss win rate", min: 0.55, max: 0.98, severity: "soft" },
      ],
      tags: ["baseline", "miniboss"],
    },
    endgame_balance: {
      experimentId: "endgame_balance",
      title: "Endgame Balance",
      scenarioType: "combat_balance",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: [],
      scenarioIds: ["mainline_conservative", "mainline_rewarded", "full_clear_power"],
      seedOffsets: [0],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 1,
      encounterSetId: "act5_endgame",
      runsPerEncounter: 16,
      encounterLimit: 0,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "overall.combat_sample_win_rate", label: "Endgame sample win rate", min: 0.35, max: 0.98, severity: "soft" },
        { metricId: "encounter.boss.average_turns", label: "Boss pacing", min: 4, max: 14, severity: "hard" },
      ],
      tags: ["baseline", "combat", "endgame"],
    },
    elite_pressure: {
      experimentId: "elite_pressure",
      title: "Elite Flow",
      scenarioType: "elite_probe",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 1,
      maxCombatTurns: 42,
      concurrency: 4,
      traceFailures: false,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "encounter.elite.average_turns", label: "Elite average turns", min: 1.5, max: 7, severity: "soft" },
        { metricId: "encounter.battle.average_turns", label: "Battle average turns", min: 1.25, max: 8, severity: "soft" },
      ],
      tags: ["baseline", "elite", "soft-pressure"],
    },
    loot_rune_economy: {
      experimentId: "loot_rune_economy",
      title: "Loot Rune Economy",
      scenarioType: "loot_economy",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "overall.average_runewords", label: "Average active runewords", min: 1, max: 3.5, severity: "soft" },
        { metricId: "overall.off_archetype_weapon_rate", label: "Off-archetype weapon drift", max: 0.45, severity: "soft" },
      ],
      tags: ["baseline", "loot", "runes"],
    },
    archetype_convergence: {
      experimentId: "archetype_convergence",
      title: "Archetype Convergence",
      scenarioType: "archetype_convergence",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 60000,
      commitmentMode: "natural",
      expectedBands: [
        { metricId: "overall.off_archetype_weapon_rate", label: "Final off-archetype weapon rate", max: 0.45, severity: "soft" },
      ],
      tags: ["baseline", "archetype"],
    },
    committed_archetype_campaign: {
      experimentId: "committed_archetype_campaign",
      title: "Committed Archetype Campaign",
      scenarioType: "campaign",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      commitmentMode: "committed",
      commitAct: 2,
      commitCheckpoint: "first_safe_zone",
      expectedBands: [],
      tags: ["baseline", "archetype", "committed"],
    },
    committed_archetype_boss_probe: {
      experimentId: "committed_archetype_boss_probe",
      title: "Committed Archetype Boss Probe",
      scenarioType: "boss_probe",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 1,
      maxCombatTurns: 48,
      concurrency: 4,
      traceFailures: false,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      commitmentMode: "committed",
      commitAct: 2,
      commitCheckpoint: "first_safe_zone",
      expectedBands: [],
      tags: ["baseline", "boss", "archetype", "committed"],
    },
    quest_strategy_pressure: {
      experimentId: "quest_strategy_pressure",
      title: "Quest Strategy Pressure",
      scenarioType: "quest_strategy",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 60000,
      expectedBands: [
        { metricId: "strategy.reinforce.rate", label: "Reinforce selection rate", min: 0.25, max: 0.8, severity: "soft" },
      ],
      tags: ["baseline", "quest", "strategy"],
    },
    nightly_full_matrix: {
      experimentId: "nightly_full_matrix",
      title: "Nightly Full Matrix",
      scenarioType: "campaign",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: [...DEFAULT_POLICY_IDS],
      seedOffsets: [0, 1, 2, 3, 4],
      throughActNumber: 5,
      probeRuns: 0,
      maxCombatTurns: 36,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 60000,
      expectedBands: [],
      tags: ["nightly", "matrix"],
    },
    local_smoke: {
      experimentId: "local_smoke",
      title: "Local Smoke",
      scenarioType: "campaign",
      classIds: ["amazon", "barbarian", "sorceress"],
      policyIds: ["aggressive", "balanced"],
      seedOffsets: [0, 1],
      throughActNumber: 3,
      probeRuns: 0,
      maxCombatTurns: 30,
      concurrency: 1,
      traceFailures: true,
      traceOutliers: false,
      slowRunThresholdMs: 30000,
      expectedBands: [],
      tags: ["local", "smoke"],
    },
    deep_analysis: {
      experimentId: "deep_analysis",
      title: "Deep Analysis",
      scenarioType: "campaign",
      classIds: [...DEFAULT_CLASS_IDS],
      policyIds: [...DEFAULT_POLICY_IDS],
      seedOffsets: [0, 1, 2, 3, 4, 5, 6, 7],
      throughActNumber: 5,
      probeRuns: 1,
      maxCombatTurns: 48,
      concurrency: 4,
      traceFailures: true,
      traceOutliers: true,
      slowRunThresholdMs: 90000,
      expectedBands: [],
      tags: ["deep", "matrix", "artifact-heavy"],
    },
  };
}

export function buildBalanceRunTasks(spec: BalanceExperimentSpec): BalanceRunTask[] {
  const tasks: BalanceRunTask[] = [];
  const harness = createQuietAppHarness();
  const policyIds =
    spec.scenarioType === "combat_balance"
      ? (spec.scenarioIds && spec.scenarioIds.length > 0 ? spec.scenarioIds : spec.policyIds)
      : spec.policyIds;
  spec.classIds.forEach((classId) => {
    const archetypeTargets =
      spec.commitmentMode === "committed"
        ? getCommittedTaskArchetypes(spec, classId)
        : [null];
    policyIds.forEach((policyId) => {
      archetypeTargets.forEach((targetEntry) => {
        spec.seedOffsets.forEach((seedOffset) => {
          tasks.push({
            runKey: {
              experimentId: spec.experimentId,
              scenarioType: spec.scenarioType,
              classId,
              policyId,
              seedOffset,
              targetArchetypeId: targetEntry?.archetypeId,
            },
            classId,
            policyId,
            seedOffset,
            targetArchetypeId: targetEntry?.archetypeId,
            targetArchetypeLabel: targetEntry?.label,
            targetBand: targetEntry?.targetBand,
            trainingLoadout: buildTaskTrainingLoadout(harness, classId, targetEntry?.archetypeId),
          });
        });
      });
    });
  });
  return tasks;
}

export function createBalanceSnapshotTokenFromState(
  harness: ReturnType<typeof createAppHarness>,
  state: AppState,
  options: {
    captureKind: BalanceSnapshotTokenEnvelope["capture"]["kind"];
    label: string;
    checkpointId?: string;
    encounterId?: string;
    runKey?: string;
    simulationContext?: RunProgressionContinuationContext | null;
    policyId?: string;
    throughActNumber?: number;
    probeRuns?: number;
    maxCombatTurns?: number;
    seedOffset?: number;
  }
): BalanceSnapshotReference {
  const serializedSnapshot = harness.appEngine.saveRunSnapshot(state);
  if (!serializedSnapshot) {
    throw new Error(`Could not serialize run snapshot for ${options.label}.`);
  }
  const restoredSnapshot = harness.persistence.restoreSnapshot(serializedSnapshot);
  if (!restoredSnapshot) {
    throw new Error(`Could not restore run snapshot for ${options.label}.`);
  }
  const rng = getTrackedRandomState(state.randomFn);
  const combatState = state.combat ? clone(state.combat as CombatState) : null;
  if (combatState) {
    combatState.randomFn = undefined as unknown as RandomFn;
  }
  const envelopeBase = {
    kind: "rouge.balance.snapshot" as const,
    version: 1 as const,
    capturedAt: new Date().toISOString(),
    capture: {
      kind: options.captureKind,
      label: options.label,
      checkpointId: options.checkpointId || "",
      encounterId: options.encounterId || "",
      runKey: options.runKey || "",
    },
    snapshot: clone(restoredSnapshot),
    combatState,
    rng: rng ? { seed: rng.seed, state: rng.state } : null,
    simulation: options.policyId
      ? {
          classId: state.run?.classId || restoredSnapshot.run?.classId || "",
          policyId: options.policyId,
          throughActNumber: Number(options.throughActNumber || 5),
          probeRuns: Number(options.probeRuns || 0),
          maxCombatTurns: Number(options.maxCombatTurns || 36),
          seedOffset: Number(options.seedOffset || 0),
          continuationContext: options.simulationContext ? clone(options.simulationContext) : null,
        }
      : null,
  };
  const digest = digestString(JSON.stringify(envelopeBase)).slice(0, 16);
  const envelope: BalanceSnapshotTokenEnvelope = {
    ...envelopeBase,
    digest,
  };
  const token = encodeCompressedJson(envelope);
  return {
    kind: options.captureKind,
    label: options.label,
    digest,
    token,
    checkpointId: options.checkpointId,
    encounterId: options.encounterId,
  };
}

export function decodeBalanceSnapshotToken(token: string): BalanceSnapshotTokenEnvelope {
  return decodeCompressedJson<BalanceSnapshotTokenEnvelope>(token);
}

export function restoreBalanceSnapshotToken(token: string) {
  const envelope = decodeBalanceSnapshotToken(token);
  const harness = createQuietAppHarness();
  const randomSeed = Number(envelope.rng?.seed || 1);
  const randomState = Number(envelope.rng?.state || randomSeed);
  const state = createSimulationStateFromSnapshot(harness, JSON.stringify(envelope.snapshot), randomSeed, randomState);
  if (envelope.combatState) {
    state.combat = clone(envelope.combatState);
    if (state.combat) {
      state.combat.randomFn = state.randomFn;
    }
    state.phase = envelope.snapshot.phase as AppPhase;
  }
  return { harness, state, envelope };
}

export function runProgressionFromBalanceSnapshotToken(token: string) {
  const { harness, state, envelope } = restoreBalanceSnapshotToken(token);
  const simulation = envelope.simulation;
  if (!simulation) {
    throw new Error("Snapshot token does not include progression simulation context.");
  }
  const policy = getPolicyDefinition(simulation.policyId);
  return runProgressionPolicyFromState(
    harness,
    state,
    simulation.classId || state.run?.classId || "",
    policy,
    simulation.throughActNumber,
    simulation.probeRuns,
    simulation.maxCombatTurns,
    simulation.seedOffset,
    simulation.continuationContext || undefined
  );
}

export function traceFromBalanceSnapshotToken(token: string, maxCombatTurns?: number) {
  const { harness, state, envelope } = restoreBalanceSnapshotToken(token);
  const policyId = envelope.simulation?.policyId || "aggressive";
  if (state.phase !== harness.appEngine.PHASES.ENCOUNTER || !state.combat) {
    return {
      mode: "snapshot",
      digest: envelope.digest,
      capture: envelope.capture,
      classId: state.run?.classId || envelope.snapshot.run?.classId || "",
      actNumber: state.run?.actNumber || envelope.snapshot.run?.actNumber || 0,
      phase: state.phase,
      encounterId: state.run?.activeEncounterId || "",
      token,
    };
  }

  const trace = traceCombatStateWithPolicy(harness, state.combat, policyId, maxCombatTurns || envelope.simulation?.maxCombatTurns || 36);
  return {
    mode: "combat",
    digest: envelope.digest,
    capture: envelope.capture,
    classId: state.run?.classId || envelope.snapshot.run?.classId || "",
    actNumber: state.run?.actNumber || envelope.snapshot.run?.actNumber || 0,
    encounterId: state.run?.activeEncounterId || envelope.capture.encounterId || "",
    policyId,
    ...trace,
  };
}

function getCheckpointLaneIntegrity(record: BalanceRunRecord, actNumber: number) {
  return Number(
    record.checkpoints.find((checkpoint) => checkpoint.actNumber === actNumber)?.archetypeCommitment?.laneMetrics?.laneIntegrity || 0
  );
}

function summarizeTopCounts(counts: Record<string, number>, limit = 3) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

function getFinalArchetypeScoreShare(record: BalanceRunRecord) {
  const entries = Array.isArray(record.summary.finalBuild?.archetypeScores) ? record.summary.finalBuild.archetypeScores : [];
  const total = entries.reduce((sum, entry) => sum + Number(entry.score || 0), 0);
  const dominantId = String(record.summary.finalBuild?.dominantArchetypeId || "");
  if (!dominantId || total <= 0) {
    return 0;
  }
  return Number(entries.find((entry) => entry.archetypeId === dominantId)?.score || 0) / total;
}

function getNaturalCommitAct(record: BalanceRunRecord) {
  const finalDominant = String(record.summary.finalBuild?.dominantArchetypeId || "");
  if (!finalDominant) {
    return 0;
  }
  const committedCheckpoint = record.checkpoints.find((checkpoint) => {
    const stage = String(checkpoint.specializationStage || "exploratory");
    if (stage === "exploratory") {
      return false;
    }
    return checkpoint.primaryTreeId === finalDominant || checkpoint.dominantArchetypeId === finalDominant;
  });
  return Number(committedCheckpoint?.actNumber || 0);
}

function classifyLaneHealth(
  targetBand: BalanceArchetypeTargetBand,
  clearRate: number,
  committedByCheckpointRate: number,
  identityDriftRate: number,
  averageLaneIntegrityFinal: number
): BalanceCommittedLaneSummary["laneHealth"] {
  const clearFloor = targetBand === "flagship" ? 0.6 : 0.35;
  if (clearRate >= clearFloor && committedByCheckpointRate >= 0.7 && identityDriftRate <= 0.35 && averageLaneIntegrityFinal >= 0.65) {
    return "healthy";
  }
  if (averageLaneIntegrityFinal < 0.5 || committedByCheckpointRate < 0.5) {
    return "identity drift";
  }
  if (clearRate >= Math.max(0.2, clearFloor - 0.2)) {
    return "playable but weak";
  }
  return "not viable";
}

type DecisionTensionMetricShape = {
  openingHandFullSpendRate: number;
  averageEarlyUnspentEnergy: number;
  averageEarlyMeaningfulUnplayedRate: number;
  averageEarlyCandidateCount: number;
  averageEarlyMeaningfulCandidateCount: number;
  averageEarlyDecisionScoreSpread: number;
  earlyCloseDecisionRate: number;
  averageEarlyEndTurnRegret: number;
};

function buildDecisionTensionSummary(metrics: DecisionTensionMetricShape): BalanceDecisionTensionSummary {
  const solvedReasons: string[] = [];
  const clunkyReasons: string[] = [];
  const healthyReasons: string[] = [];

  if (metrics.openingHandFullSpendRate >= 0.45) {
    solvedReasons.push("opening hands empty too often");
  } else if (metrics.openingHandFullSpendRate <= 0.3) {
    healthyReasons.push("opening hands usually keep at least one option back");
  }

  if (metrics.averageEarlyDecisionScoreSpread >= 9) {
    solvedReasons.push("top action dominates the early turn");
  } else if (metrics.averageEarlyDecisionScoreSpread <= 6.5) {
    healthyReasons.push("top actions stay close enough to compete");
  }

  if (metrics.earlyCloseDecisionRate >= 0.25) {
    healthyReasons.push("close decisions appear regularly");
  } else if (metrics.earlyCloseDecisionRate <= 0.1) {
    solvedReasons.push("too few close early decisions");
  }

  if (metrics.averageEarlyMeaningfulCandidateCount >= 1.6) {
    healthyReasons.push("multiple meaningful actions appear early");
  } else if (metrics.averageEarlyMeaningfulCandidateCount <= 1.15 && metrics.averageEarlyEndTurnRegret >= 7) {
    solvedReasons.push("early turns collapse into one obvious active line");
  } else if (metrics.averageEarlyMeaningfulCandidateCount <= 1.15) {
    clunkyReasons.push("too few meaningful early plays");
  }

  if (metrics.averageEarlyUnspentEnergy >= 4.5) {
    clunkyReasons.push("too much early energy strands in hand");
  } else if (metrics.averageEarlyUnspentEnergy >= 0.5 && metrics.averageEarlyUnspentEnergy <= 3.5) {
    healthyReasons.push("early energy tension is present without bricking the hand");
  }

  if (metrics.averageEarlyEndTurnRegret <= 4) {
    clunkyReasons.push("ending turn is too often close to the best line");
  } else if (metrics.averageEarlyEndTurnRegret >= 6 && metrics.averageEarlyEndTurnRegret <= 12) {
    healthyReasons.push("passing early turns carries real but not absurd cost");
  } else if (metrics.averageEarlyEndTurnRegret > 14 && metrics.averageEarlyDecisionScoreSpread >= 8) {
    solvedReasons.push("the early turn has a very obvious best action");
  }

  const solvedScore = solvedReasons.length;
  const clunkyScore = clunkyReasons.length;
  const healthyScore = healthyReasons.length;

  if (clunkyScore >= 2 && clunkyScore > solvedScore && healthyScore < 3) {
    return {
      status: "too clunky",
      reasons: clunkyReasons.slice(0, 3),
    };
  }

  if (solvedScore >= 2 && solvedScore > clunkyScore && healthyScore < 3) {
    return {
      status: "too solved",
      reasons: solvedReasons.slice(0, 3),
    };
  }

  if (healthyScore >= 3 && solvedScore <= 1 && clunkyScore <= 1) {
    return {
      status: "healthy tension",
      reasons: healthyReasons.slice(0, 3),
    };
  }

  return {
    status: "mixed",
    reasons: [...healthyReasons, ...solvedReasons, ...clunkyReasons].slice(0, 3),
  };
}

function buildNaturalConvergenceSummaries(records: BalanceRunRecord[]): BalanceNaturalConvergenceSummary[] {
  const groups = new Map<string, {
    classId: string;
    className: string;
    policyId: string;
    policyLabel: string;
    archetypeId: string;
    archetypeLabel: string;
    runs: number;
    commitActTotal: number;
    finalIntegrityTotal: number;
  }>();

  records
    .filter((record) => record.commitmentMode === "natural")
    .forEach((record) => {
      const archetypeId = String(record.summary.finalBuild?.dominantArchetypeId || "");
      if (!archetypeId) {
        return;
      }
      const archetypeLabel = String(record.summary.finalBuild?.dominantArchetypeLabel || archetypeId);
      const key = `${record.classId}:${record.policyId}:${archetypeId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          classId: record.classId,
          className: record.className,
          policyId: record.policyId,
          policyLabel: record.policyLabel,
          archetypeId,
          archetypeLabel,
          runs: 0,
          commitActTotal: 0,
          finalIntegrityTotal: 0,
        });
      }
      const group = groups.get(key)!;
      group.runs += 1;
      group.commitActTotal += getNaturalCommitAct(record);
      group.finalIntegrityTotal += getFinalArchetypeScoreShare(record);
    });

  const totalsByClassPolicy = new Map<string, number>();
  records
    .filter((record) => record.commitmentMode === "natural")
    .forEach((record) => {
      const key = `${record.classId}:${record.policyId}`;
      totalsByClassPolicy.set(key, (totalsByClassPolicy.get(key) || 0) + 1);
    });

  return [...groups.values()]
    .map((group) => {
      const totalForLanePool = Math.max(1, Number(totalsByClassPolicy.get(`${group.classId}:${group.policyId}`) || 0));
      return {
        classId: group.classId,
        className: group.className,
        policyId: group.policyId,
        policyLabel: group.policyLabel,
        archetypeId: group.archetypeId,
        archetypeLabel: group.archetypeLabel,
        runs: group.runs,
        convergenceRate: roundTo(group.runs / totalForLanePool),
        averageCommitAct: roundTo(group.commitActTotal / Math.max(1, group.runs)),
        averageFinalLaneIntegrity: roundTo(group.finalIntegrityTotal / Math.max(1, group.runs)),
      };
    })
    .sort((left, right) =>
      left.className.localeCompare(right.className) ||
      left.policyLabel.localeCompare(right.policyLabel) ||
      right.convergenceRate - left.convergenceRate ||
      left.archetypeLabel.localeCompare(right.archetypeLabel)
    );
}

function buildCommittedLaneSummaries(records: BalanceRunRecord[]): BalanceCommittedLaneSummary[] {
  const groups = new Map<string, {
    classId: string;
    className: string;
    policyId: string;
    policyLabel: string;
    targetArchetypeId: string;
    targetArchetypeLabel: string;
    targetBand: BalanceArchetypeTargetBand;
    runs: number;
    clears: number;
    committedByCheckpoint: number;
    driftRateTotal: number;
    laneIntegrityAct2: number;
    laneIntegrityAct3: number;
    laneIntegrityAct4: number;
    laneIntegrityFinal: number;
    bossTurnsTotal: number;
    bossTurnsCount: number;
    endWeapons: Record<string, number>;
    runewords: Record<string, number>;
    failures: Record<string, number>;
  }>();

  records
    .filter((record) => record.commitmentMode === "committed" && record.targetArchetypeId)
    .forEach((record) => {
      const key = `${record.classId}:${record.policyId}:${record.targetArchetypeId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          classId: record.classId,
          className: record.className,
          policyId: record.policyId,
          policyLabel: record.policyLabel,
          targetArchetypeId: record.targetArchetypeId,
          targetArchetypeLabel: record.targetArchetypeLabel,
          targetBand: (record.targetBand || "secondary") as BalanceArchetypeTargetBand,
          runs: 0,
          clears: 0,
          committedByCheckpoint: 0,
          driftRateTotal: 0,
          laneIntegrityAct2: 0,
          laneIntegrityAct3: 0,
          laneIntegrityAct4: 0,
          laneIntegrityFinal: 0,
          bossTurnsTotal: 0,
          bossTurnsCount: 0,
          endWeapons: {},
          runewords: {},
          failures: {},
        });
      }
      const group = groups.get(key)!;
      const evaluation = record.archetypeEvaluation;
      group.runs += 1;
      group.clears += record.outcome === "run_complete" ? 1 : 0;
      group.committedByCheckpoint += evaluation?.committedByCheckpoint ? 1 : 0;
      group.driftRateTotal += Number(evaluation?.driftRateAfterCommit || 0);
      group.laneIntegrityAct2 += getCheckpointLaneIntegrity(record, 2);
      group.laneIntegrityAct3 += getCheckpointLaneIntegrity(record, 3);
      group.laneIntegrityAct4 += getCheckpointLaneIntegrity(record, 4);
      group.laneIntegrityFinal += Number(evaluation?.laneIntegrity || 0);
      const bossTurns = Number(record.summary.encounterMetricsByKind?.boss?.averageTurns || 0);
      if (bossTurns > 0) {
        group.bossTurnsTotal += bossTurns;
        group.bossTurnsCount += 1;
      }
      const weaponLabel = String(record.summary.finalBuild?.weapon?.name || "");
      if (weaponLabel) {
        group.endWeapons[weaponLabel] = (group.endWeapons[weaponLabel] || 0) + 1;
      }
      (record.summary.finalBuild?.activeRunewords || []).forEach((runewordId) => {
        group.runewords[runewordId] = (group.runewords[runewordId] || 0) + 1;
      });
      if (record.failure?.encounterName) {
        const failureLabel = `${record.failure.zoneTitle} / ${record.failure.encounterName}`;
        group.failures[failureLabel] = (group.failures[failureLabel] || 0) + 1;
      }
    });

  return [...groups.values()]
    .map((group) => {
      const runs = Math.max(1, group.runs);
      const clearRate = roundTo(group.clears / runs);
      const committedByCheckpointRate = roundTo(group.committedByCheckpoint / runs);
      const identityDriftRate = roundTo(group.driftRateTotal / runs);
      const averageLaneIntegrityFinal = roundTo(group.laneIntegrityFinal / runs);
      return {
        classId: group.classId,
        className: group.className,
        policyId: group.policyId,
        policyLabel: group.policyLabel,
        targetArchetypeId: group.targetArchetypeId,
        targetArchetypeLabel: group.targetArchetypeLabel,
        targetBand: group.targetBand,
        runs: group.runs,
        clearRate,
        committedByCheckpointRate,
        identityDriftRate,
        averageLaneIntegrityAct2: roundTo(group.laneIntegrityAct2 / runs),
        averageLaneIntegrityAct3: roundTo(group.laneIntegrityAct3 / runs),
        averageLaneIntegrityAct4: roundTo(group.laneIntegrityAct4 / runs),
        averageLaneIntegrityFinal,
        averageBossTurns: group.bossTurnsCount > 0 ? roundTo(group.bossTurnsTotal / group.bossTurnsCount) : 0,
        commonEndWeapons: summarizeTopCounts(group.endWeapons),
        commonRunewords: summarizeTopCounts(group.runewords),
        commonFailureEncounters: summarizeTopCounts(group.failures),
        laneHealth: classifyLaneHealth(group.targetBand, clearRate, committedByCheckpointRate, identityDriftRate, averageLaneIntegrityFinal),
      };
    })
    .sort((left, right) =>
      left.className.localeCompare(right.className) ||
      left.policyLabel.localeCompare(right.policyLabel) ||
      left.targetArchetypeLabel.localeCompare(right.targetArchetypeLabel)
    );
}

export function aggregateBalanceRunRecords(spec: BalanceExperimentSpec, records: BalanceRunRecord[]): BalanceAggregateReport {
  const groups = new Map<string, {
    classId: string;
    className: string;
    policyId: string;
    policyLabel: string;
    targetArchetypeId: string;
    targetArchetypeLabel: string;
    targetBand: BalanceArchetypeTargetBand | "";
    commitmentMode: BalanceCommitmentMode;
    runs: number;
    wins: number;
    failures: number;
    act2: number;
    act5: number;
    finalActTotal: number;
    finalLevelTotal: number;
    durationTotal: number;
  }>();
  const rewardRoleCounts: Record<string, number> = {};
  const strategyRoleCounts: Record<string, number> = {};
  let wins = 0;
  let failures = 0;
  let act2 = 0;
  let act5 = 0;
  let finalActTotal = 0;
  let finalLevelTotal = 0;
  let durationTotal = 0;
  let runewordTotal = 0;
  let offArchetypeWeapons = 0;
  let handSizeBonusCount = 0;
  let combatWinRateTotal = 0;
  let primarySpecializationCount = 0;
  let masteryCount = 0;
  let offTreeUtilityTotal = 0;
  let offTreeDamageTotal = 0;
  let counterCoverageTotal = 0;
  let targetShapeFitTotal = 0;
  let starterShellCardsRemainingTotal = 0;
  let reinforcedCardCountTotal = 0;
  let centerpieceCountTotal = 0;
  const deckFamilyDistribution: Record<string, number> = {};
  let committedAtActTotal = 0;
  let firstMajorReinforcementActTotal = 0;
  let purgeCountTotal = 0;
  let refinementCountTotal = 0;
  let evolutionCountTotal = 0;
  let openingHandFullSpendTotal = 0;
  let turn1UnspentEnergyTotal = 0;
  let earlyUnspentEnergyTotal = 0;
  let earlyMeaningfulUnplayedTotal = 0;
  let earlyCandidateCountTotal = 0;
  let earlyMeaningfulCandidateCountTotal = 0;
  let earlyDecisionScoreSpreadTotal = 0;
  let earlyCloseDecisionTotal = 0;
  let earlyEndTurnRegretTotal = 0;

  records.forEach((record) => {
    const key = `${record.classId}:${record.policyId}:${record.targetArchetypeId || "natural"}:${record.commitmentMode}`;
    if (!groups.has(key)) {
      groups.set(key, {
        classId: record.classId,
        className: record.className,
        policyId: record.policyId,
        policyLabel: record.policyLabel,
        targetArchetypeId: record.targetArchetypeId,
        targetArchetypeLabel: record.targetArchetypeLabel,
        targetBand: record.targetBand,
        commitmentMode: record.commitmentMode,
        runs: 0,
        wins: 0,
        failures: 0,
        act2: 0,
        act5: 0,
        finalActTotal: 0,
        finalLevelTotal: 0,
        durationTotal: 0,
      });
    }
    const group = groups.get(key)!;
    const recordWinRate = record.combat ? Number(record.combat.overall.winRate || 0) : (record.outcome === "run_complete" ? 1 : 0);
    const recordFailureRate = record.combat ? 1 - recordWinRate : (record.outcome === "run_failed" ? 1 : 0);
    group.runs += 1;
    group.wins += recordWinRate;
    group.failures += recordFailureRate;
    group.act2 += record.finalActNumber >= 2 ? 1 : 0;
    group.act5 += record.finalActNumber >= 5 ? 1 : 0;
    group.finalActTotal += record.finalActNumber;
    group.finalLevelTotal += record.finalLevel;
    group.durationTotal += Number(record.durationMs || 0);

    wins += recordWinRate;
    failures += recordFailureRate;
    act2 += record.finalActNumber >= 2 ? 1 : 0;
    act5 += record.finalActNumber >= 5 ? 1 : 0;
    finalActTotal += record.finalActNumber;
    finalLevelTotal += record.finalLevel;
    durationTotal += Number(record.durationMs || 0);
    runewordTotal += Number(record.summary.finalBuild?.activeRunewords?.length || 0);
    offArchetypeWeapons += record.summary.finalBuild?.weapon?.preferredForClass === false ? 1 : 0;
    handSizeBonusCount += Number(record.summary.finalBuild?.hero?.handSize || 5) > 5 ? 1 : 0;
    combatWinRateTotal += record.combat ? Number(record.combat.overall.winRate || 0) : recordWinRate;
    const specializationStage = record.summary.finalBuild?.specializationStage || "exploratory";
    primarySpecializationCount += specializationStage === "primary" || specializationStage === "mastery" ? 1 : 0;
    masteryCount += specializationStage === "mastery" ? 1 : 0;
    offTreeUtilityTotal += Number(record.summary.finalBuild?.offTreeUtilityCount || 0);
    offTreeDamageTotal += Number(record.summary.finalBuild?.offTreeDamageCount || 0);
    counterCoverageTotal += Array.isArray(record.summary.finalBuild?.counterCoverageTags)
      ? record.summary.finalBuild.counterCoverageTags.length
      : 0;
    targetShapeFitTotal += Number(record.summary.finalBuild?.deckProfile?.targetShapeFit || 0);
    starterShellCardsRemainingTotal += Number(record.summary.finalBuild?.deckProfile?.starterShellCardsRemaining || 0);
    reinforcedCardCountTotal += Number(record.summary.finalBuild?.deckProfile?.reinforcedCardCount || 0);
    centerpieceCountTotal += Array.isArray(record.summary.finalBuild?.deckProfile?.centerpieceCards)
      ? record.summary.finalBuild.deckProfile.centerpieceCards.length
      : 0;
    const deckFamily = record.summary.finalBuild?.deckProfile?.deckFamily || "hybrid";
    deckFamilyDistribution[deckFamily] = Number(deckFamilyDistribution[deckFamily] || 0) + 1;
    committedAtActTotal += Number(record.summary.buildJourney?.committedAtAct || 0);
    firstMajorReinforcementActTotal += Number(record.summary.buildJourney?.firstMajorReinforcementAct || 0);
    purgeCountTotal += Number(record.summary.buildJourney?.totalPurges || 0);
    refinementCountTotal += Number(record.summary.buildJourney?.totalRefinements || 0);
    evolutionCountTotal += Number(record.summary.buildJourney?.totalEvolutions || 0);
    const encounterDivisor = Math.max(1, Number(record.summary.encounterResults?.length || 0));
    openingHandFullSpendTotal += (record.summary.encounterResults || []).filter((entry) => entry.openingHandFullSpend).length / encounterDivisor;
    turn1UnspentEnergyTotal += (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.turn1UnspentEnergy || 0), 0) / encounterDivisor;
    earlyUnspentEnergyTotal += (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.earlyUnspentEnergyAverage || 0), 0) / encounterDivisor;
    earlyMeaningfulUnplayedTotal += (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.earlyMeaningfulUnplayedRate || 0), 0) / encounterDivisor;
    earlyCandidateCountTotal += (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.averageEarlyCandidateCount || 0), 0) / encounterDivisor;
    earlyMeaningfulCandidateCountTotal +=
      (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.averageEarlyMeaningfulCandidateCount || 0), 0) /
      encounterDivisor;
    earlyDecisionScoreSpreadTotal +=
      (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.averageEarlyDecisionScoreSpread || 0), 0) /
      encounterDivisor;
    earlyCloseDecisionTotal += (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.earlyCloseDecisionRate || 0), 0) / encounterDivisor;
    earlyEndTurnRegretTotal +=
      (record.summary.encounterResults || []).reduce((sum, entry) => sum + Number(entry.averageEarlyEndTurnRegret || 0), 0) / encounterDivisor;
    mergeCounts(rewardRoleCounts, record.summary.rewardRoleCounts);
    mergeCounts(strategyRoleCounts, record.summary.strategyRoleCounts);
  });

  const divisor = Math.max(1, records.length);
  const overallDecisionMetrics = {
    openingHandFullSpendRate: roundTo(openingHandFullSpendTotal / divisor),
    averageEarlyUnspentEnergy: roundTo(earlyUnspentEnergyTotal / divisor),
    averageEarlyMeaningfulUnplayedRate: roundTo(earlyMeaningfulUnplayedTotal / divisor),
    averageEarlyCandidateCount: roundTo(earlyCandidateCountTotal / divisor, 3),
    averageEarlyMeaningfulCandidateCount: roundTo(earlyMeaningfulCandidateCountTotal / divisor, 3),
    averageEarlyDecisionScoreSpread: roundTo(earlyDecisionScoreSpreadTotal / divisor, 3),
    earlyCloseDecisionRate: roundTo(earlyCloseDecisionTotal / divisor, 3),
    averageEarlyEndTurnRegret: roundTo(earlyEndTurnRegretTotal / divisor, 3),
  };
  return {
    experimentId: spec.experimentId,
    title: spec.title,
    scenarioType: spec.scenarioType,
    runs: records.length,
    completedRuns: records.length,
    coverageRate: roundTo(records.length / Math.max(1, buildBalanceRunTasks(spec).length)),
    overall: {
      winRate: roundTo(wins / divisor),
      failureRate: roundTo(failures / divisor),
      act2Rate: roundTo(act2 / divisor),
      act5Rate: roundTo(act5 / divisor),
      averageFinalAct: roundTo(finalActTotal / divisor),
      averageFinalLevel: roundTo(finalLevelTotal / divisor),
      averageDurationMs: roundTo(durationTotal / divisor),
      averageRunewords: roundTo(runewordTotal / divisor),
      offArchetypeWeaponRate: roundTo(offArchetypeWeapons / divisor),
      handSizeBonusRate: roundTo(handSizeBonusCount / divisor),
      combatSampleWinRate: roundTo(combatWinRateTotal / divisor),
      primarySpecializationRate: roundTo(primarySpecializationCount / divisor),
      masteryRate: roundTo(masteryCount / divisor),
      averageOffTreeUtilityCount: roundTo(offTreeUtilityTotal / divisor),
      averageOffTreeDamageCount: roundTo(offTreeDamageTotal / divisor),
      averageCounterCoverageCount: roundTo(counterCoverageTotal / divisor),
      averageTargetShapeFit: roundTo(targetShapeFitTotal / divisor, 3),
      averageStarterShellCardsRemaining: roundTo(starterShellCardsRemainingTotal / divisor, 3),
      averageReinforcedCardCount: roundTo(reinforcedCardCountTotal / divisor, 3),
      averageCenterpieceCount: roundTo(centerpieceCountTotal / divisor, 3),
      deckFamilyDistribution: Object.fromEntries(
        Object.entries(deckFamilyDistribution)
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([family, count]) => [family, roundTo(count / divisor, 3)])
      ),
      averageCommittedAtAct: roundTo(committedAtActTotal / divisor, 3),
      averageFirstMajorReinforcementAct: roundTo(firstMajorReinforcementActTotal / divisor, 3),
      averagePurgeCount: roundTo(purgeCountTotal / divisor, 3),
      averageRefinementCount: roundTo(refinementCountTotal / divisor, 3),
      averageEvolutionCount: roundTo(evolutionCountTotal / divisor, 3),
      openingHandFullSpendRate: overallDecisionMetrics.openingHandFullSpendRate,
      averageTurn1UnspentEnergy: roundTo(turn1UnspentEnergyTotal / divisor),
      averageEarlyUnspentEnergy: overallDecisionMetrics.averageEarlyUnspentEnergy,
      averageEarlyMeaningfulUnplayedRate: overallDecisionMetrics.averageEarlyMeaningfulUnplayedRate,
      averageEarlyCandidateCount: overallDecisionMetrics.averageEarlyCandidateCount,
      averageEarlyMeaningfulCandidateCount: overallDecisionMetrics.averageEarlyMeaningfulCandidateCount,
      averageEarlyDecisionScoreSpread: overallDecisionMetrics.averageEarlyDecisionScoreSpread,
      earlyCloseDecisionRate: overallDecisionMetrics.earlyCloseDecisionRate,
      averageEarlyEndTurnRegret: overallDecisionMetrics.averageEarlyEndTurnRegret,
      decisionTension: buildDecisionTensionSummary(overallDecisionMetrics),
    },
    encounterMetricsByKind: aggregateEncounterMetrics(records),
    strategyRoleCounts,
    rewardRoleCounts,
    groups: [...groups.values()]
      .map((group) => ({
        classId: group.classId,
        className: group.className,
        policyId: group.policyId,
        policyLabel: group.policyLabel,
        targetArchetypeId: group.targetArchetypeId,
        targetArchetypeLabel: group.targetArchetypeLabel,
        targetBand: group.targetBand,
        commitmentMode: group.commitmentMode,
        runs: group.runs,
        winRate: roundTo(group.wins / Math.max(1, group.runs)),
        failureRate: roundTo(group.failures / Math.max(1, group.runs)),
        act2Rate: roundTo(group.act2 / Math.max(1, group.runs)),
        act5Rate: roundTo(group.act5 / Math.max(1, group.runs)),
        averageFinalAct: roundTo(group.finalActTotal / Math.max(1, group.runs)),
        averageFinalLevel: roundTo(group.finalLevelTotal / Math.max(1, group.runs)),
        averageDurationMs: roundTo(group.durationTotal / Math.max(1, group.runs)),
      }))
      .sort((left, right) =>
        left.className.localeCompare(right.className) ||
        left.policyLabel.localeCompare(right.policyLabel) ||
        left.targetArchetypeLabel.localeCompare(right.targetArchetypeLabel)
      ),
    archetypes: {
      naturalConvergence: buildNaturalConvergenceSummaries(records),
      committedLanes: buildCommittedLaneSummaries(records),
    },
  };
}

function resolveMetricValue(report: BalanceAggregateReport, metricId: string): number | null {
  const averageSummaries = <T extends { runs: number }>(
    entries: T[],
    selector: (entry: T) => number
  ) => {
    if (!entries.length) {
      return null;
    }
    const totalRuns = entries.reduce((sum, entry) => sum + Math.max(1, Number(entry.runs || 0)), 0);
    if (totalRuns <= 0) {
      return null;
    }
    return roundTo(
      entries.reduce((sum, entry) => sum + selector(entry) * Math.max(1, Number(entry.runs || 0)), 0) / totalRuns
    );
  };

  if (metricId === "overall.win_rate") { return report.overall.winRate; }
  if (metricId === "overall.failure_rate") { return report.overall.failureRate; }
  if (metricId === "overall.act2_rate") { return report.overall.act2Rate; }
  if (metricId === "overall.act5_rate") { return report.overall.act5Rate; }
  if (metricId === "overall.average_runewords") { return report.overall.averageRunewords; }
  if (metricId === "overall.off_archetype_weapon_rate") { return report.overall.offArchetypeWeaponRate; }
  if (metricId === "overall.hand_size_bonus_rate") { return report.overall.handSizeBonusRate; }
  if (metricId === "overall.combat_sample_win_rate") { return report.overall.combatSampleWinRate; }
  if (metricId === "overall.primary_specialization_rate") { return report.overall.primarySpecializationRate; }
  if (metricId === "overall.mastery_rate") { return report.overall.masteryRate; }
  if (metricId === "overall.average_off_tree_utility_count") { return report.overall.averageOffTreeUtilityCount; }
  if (metricId === "overall.average_off_tree_damage_count") { return report.overall.averageOffTreeDamageCount; }
  if (metricId === "overall.average_counter_coverage_count") { return report.overall.averageCounterCoverageCount; }
  if (metricId === "overall.opening_hand_full_spend_rate") { return report.overall.openingHandFullSpendRate; }
  if (metricId === "overall.average_turn1_unspent_energy") { return report.overall.averageTurn1UnspentEnergy; }
  if (metricId === "overall.average_early_unspent_energy") { return report.overall.averageEarlyUnspentEnergy; }
  if (metricId === "overall.average_early_meaningful_unplayed_rate") { return report.overall.averageEarlyMeaningfulUnplayedRate; }
  if (metricId === "overall.average_early_candidate_count") { return report.overall.averageEarlyCandidateCount; }
  if (metricId === "overall.average_early_meaningful_candidate_count") { return report.overall.averageEarlyMeaningfulCandidateCount; }
  if (metricId === "overall.average_early_decision_score_spread") { return report.overall.averageEarlyDecisionScoreSpread; }
  if (metricId === "overall.early_close_decision_rate") { return report.overall.earlyCloseDecisionRate; }
  if (metricId === "overall.average_early_end_turn_regret") { return report.overall.averageEarlyEndTurnRegret; }

  const encounterMatch = metricId.match(
    /^encounter\.(boss|miniboss|elite|battle)\.(average_turns|win_rate|average_power_ratio|opening_hand_full_spend_rate|average_turn1_unspent_energy|average_early_unspent_energy|average_early_meaningful_unplayed_rate|average_early_candidate_count|average_early_meaningful_candidate_count|average_early_decision_score_spread|early_close_decision_rate|average_early_end_turn_regret)$/
  );
  if (encounterMatch) {
    const [, kind, field] = encounterMatch;
    const entry = report.encounterMetricsByKind[kind];
    if (!entry) {
      return null;
    }
    if (field === "average_turns") { return entry.averageTurns; }
    if (field === "win_rate") { return entry.winRate; }
    if (field === "average_power_ratio") { return entry.averagePowerRatio; }
    if (field === "opening_hand_full_spend_rate") { return entry.openingHandFullSpendRate; }
    if (field === "average_turn1_unspent_energy") { return entry.averageTurn1UnspentEnergy; }
    if (field === "average_early_unspent_energy") { return entry.averageEarlyUnspentEnergy; }
    if (field === "average_early_meaningful_unplayed_rate") { return entry.averageEarlyMeaningfulUnplayedRate; }
    if (field === "average_early_candidate_count") { return entry.averageEarlyCandidateCount; }
    if (field === "average_early_meaningful_candidate_count") { return entry.averageEarlyMeaningfulCandidateCount; }
    if (field === "average_early_decision_score_spread") { return entry.averageEarlyDecisionScoreSpread; }
    if (field === "early_close_decision_rate") { return entry.earlyCloseDecisionRate; }
    if (field === "average_early_end_turn_regret") { return entry.averageEarlyEndTurnRegret; }
  }

  const groupMatch = metricId.match(/^group\.([a-z_]+)\.([a-z_]+)\.(win_rate|act5_rate|average_final_act)$/);
  if (groupMatch) {
    const [, classId, policyId, field] = groupMatch;
    const group = report.groups.find((entry) => entry.classId === classId && entry.policyId === policyId);
    if (!group) {
      return null;
    }
    if (field === "win_rate") { return group.winRate; }
    if (field === "act5_rate") { return group.act5Rate; }
    if (field === "average_final_act") { return group.averageFinalAct; }
  }

  if (metricId === "strategy.reinforce.rate" || metricId === "strategy.support.rate" || metricId === "strategy.pivot.rate") {
    const strategyId = metricId.split(".")[1];
    const total = Object.values(report.strategyRoleCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    if (total <= 0) {
      return null;
    }
    return roundTo(Number(report.strategyRoleCounts[strategyId] || 0) / total);
  }

  const naturalConvergenceMatch = metricId.match(
    /^convergence\.([a-z_]+)(?:\.([a-z_]+))?\.([a-z0-9_]+)\.(rate|commit_act|final_lane_integrity)$/
  );
  if (naturalConvergenceMatch) {
    const [, classId, policyId, archetypeId, field] = naturalConvergenceMatch;
    const matches = report.archetypes.naturalConvergence.filter(
      (entry) =>
        entry.classId === classId &&
        entry.archetypeId === archetypeId &&
        (!policyId || entry.policyId === policyId)
    );
    if (!matches.length) {
      return null;
    }
    if (field === "rate") {
      return averageSummaries(matches, (entry) => entry.convergenceRate);
    }
    if (field === "commit_act") {
      return averageSummaries(matches, (entry) => entry.averageCommitAct);
    }
    if (field === "final_lane_integrity") {
      return averageSummaries(matches, (entry) => entry.averageFinalLaneIntegrity);
    }
  }

  const committedLaneMatch = metricId.match(
    /^lane\.([a-z_]+)(?:\.([a-z_]+))?\.([a-z0-9_]+)\.(clear_rate|commit_rate|identity_drift_rate|final_lane_integrity|boss_turns)$/
  );
  if (committedLaneMatch) {
    const [, classId, policyId, archetypeId, field] = committedLaneMatch;
    const matches = report.archetypes.committedLanes.filter(
      (entry) =>
        entry.classId === classId &&
        entry.targetArchetypeId === archetypeId &&
        (!policyId || entry.policyId === policyId)
    );
    if (!matches.length) {
      return null;
    }
    if (field === "clear_rate") {
      return averageSummaries(matches, (entry) => entry.clearRate);
    }
    if (field === "commit_rate") {
      return averageSummaries(matches, (entry) => entry.committedByCheckpointRate);
    }
    if (field === "identity_drift_rate") {
      return averageSummaries(matches, (entry) => entry.identityDriftRate);
    }
    if (field === "final_lane_integrity") {
      return averageSummaries(matches, (entry) => entry.averageLaneIntegrityFinal);
    }
    if (field === "boss_turns") {
      return averageSummaries(matches, (entry) => entry.averageBossTurns);
    }
  }

  return null;
}

export function evaluateBalanceBands(report: BalanceAggregateReport, expectedBands: BalanceMetricBand[] = []): BalanceBandEvaluation[] {
  return expectedBands.map((band) => {
    const actual: number | null = resolveMetricValue(report, band.metricId);
    if (actual === null) {
      const missingEvaluation: BalanceBandEvaluation = {
        metricId: band.metricId,
        label: band.label,
        actual: null,
        min: band.min,
        max: band.max,
        severity: band.severity || "soft",
        status: "missing",
      };
      return missingEvaluation;
    }
    const passesMin = band.min === undefined || actual >= band.min;
    const passesMax = band.max === undefined || actual <= band.max;
    const evaluation: BalanceBandEvaluation = {
      metricId: band.metricId,
      label: band.label,
      actual,
      min: band.min,
      max: band.max,
      severity: band.severity || "soft",
      status: passesMin && passesMax ? "pass" : "fail",
    };
    return evaluation;
  });
}

export function compareBalanceArtifacts(current: BalanceAggregateReport, baseline: BalanceAggregateReport) {
  return {
    "overall.win_rate": roundTo(current.overall.winRate - baseline.overall.winRate),
    "overall.combat_sample_win_rate": roundTo(current.overall.combatSampleWinRate - baseline.overall.combatSampleWinRate),
    "overall.act5_rate": roundTo(current.overall.act5Rate - baseline.overall.act5Rate),
    "encounter.boss.average_turns": roundTo(
      Number(current.encounterMetricsByKind.boss?.averageTurns || 0) - Number(baseline.encounterMetricsByKind.boss?.averageTurns || 0)
    ),
    "encounter.miniboss.average_turns": roundTo(
      Number(current.encounterMetricsByKind.miniboss?.averageTurns || 0) - Number(baseline.encounterMetricsByKind.miniboss?.averageTurns || 0)
    ),
    "encounter.elite.average_turns": roundTo(
      Number(current.encounterMetricsByKind.elite?.averageTurns || 0) - Number(baseline.encounterMetricsByKind.elite?.averageTurns || 0)
    ),
    "overall.average_runewords": roundTo(current.overall.averageRunewords - baseline.overall.averageRunewords),
    "overall.off_archetype_weapon_rate": roundTo(
      current.overall.offArchetypeWeaponRate - baseline.overall.offArchetypeWeaponRate
    ),
  };
}

export function buildBalanceArtifact(
  spec: BalanceExperimentSpec,
  runRecords: BalanceRunRecord[],
  baselineArtifact: BalanceArtifact | null = null
): BalanceArtifact {
  const aggregate = aggregateBalanceRunRecords(spec, runRecords);
  return {
    generatedAt: new Date().toISOString(),
    experiment: clone(spec),
    runs: runRecords.map((record) => clone(record)),
    aggregate,
    bands: evaluateBalanceBands(aggregate, spec.expectedBands || []),
    baselineComparison: baselineArtifact
      ? {
          baselinePath: baselineArtifact.experiment.experimentId,
          deltas: compareBalanceArtifacts(aggregate, baselineArtifact.aggregate),
        }
      : null,
  };
}

export function buildBalanceMarkdownReport(artifact: BalanceArtifact) {
  const lines = [
    `# ${artifact.experiment.title}`,
    "",
    `- Experiment: \`${artifact.experiment.experimentId}\``,
    `- Scenario: \`${artifact.experiment.scenarioType}\``,
    `- Coverage: ${artifact.aggregate.completedRuns}/${buildBalanceRunTasks(artifact.experiment).length} runs (${(artifact.aggregate.coverageRate * 100).toFixed(1)}%)`,
    `- Overall win rate: ${(artifact.aggregate.overall.winRate * 100).toFixed(1)}%`,
    `- Combat sample win rate: ${(artifact.aggregate.overall.combatSampleWinRate * 100).toFixed(1)}%`,
    `- Act V reach rate: ${(artifact.aggregate.overall.act5Rate * 100).toFixed(1)}%`,
    `- Average runewords: ${artifact.aggregate.overall.averageRunewords.toFixed(2)}`,
    `- Decision tension: ${artifact.aggregate.overall.decisionTension.status} (${artifact.aggregate.overall.decisionTension.reasons.join("; ") || "no notes"})`,
    "",
    "## Encounter Metrics",
  ];

  ["boss", "miniboss", "elite", "battle"].forEach((kind) => {
    const entry = artifact.aggregate.encounterMetricsByKind[kind];
    if (!entry) {
      return;
    }
    lines.push(
      `- ${kind}: ${entry.averageTurns.toFixed(2)} turns, ${(entry.winRate * 100).toFixed(1)}% win, ${entry.averagePowerRatio.toFixed(2)}x ratio, tension ${entry.decisionTension.status}`
    );
  });

  lines.push("", "## Decision Tension");
  lines.push(
    `- overall: ${artifact.aggregate.overall.decisionTension.status} | candidates ${artifact.aggregate.overall.averageEarlyCandidateCount.toFixed(2)}, meaningful ${artifact.aggregate.overall.averageEarlyMeaningfulCandidateCount.toFixed(2)}, spread ${artifact.aggregate.overall.averageEarlyDecisionScoreSpread.toFixed(2)}, close ${(artifact.aggregate.overall.earlyCloseDecisionRate * 100).toFixed(1)}%, end-turn regret ${artifact.aggregate.overall.averageEarlyEndTurnRegret.toFixed(2)}`
  );
  lines.push(`  notes: ${artifact.aggregate.overall.decisionTension.reasons.join("; ") || "none"}`);
  ["boss", "miniboss", "elite", "battle"].forEach((kind) => {
    const entry = artifact.aggregate.encounterMetricsByKind[kind];
    if (!entry) {
      return;
    }
    lines.push(
      `- ${kind}: ${entry.decisionTension.status} | candidates ${entry.averageEarlyCandidateCount.toFixed(2)}, meaningful ${entry.averageEarlyMeaningfulCandidateCount.toFixed(2)}, spread ${entry.averageEarlyDecisionScoreSpread.toFixed(2)}, close ${(entry.earlyCloseDecisionRate * 100).toFixed(1)}%, end-turn regret ${entry.averageEarlyEndTurnRegret.toFixed(2)}`
    );
    lines.push(`  notes: ${entry.decisionTension.reasons.join("; ") || "none"}`);
  });

  lines.push("", "## Deck Profile");
  lines.push(
    `- target fit ${artifact.aggregate.overall.averageTargetShapeFit.toFixed(2)}, reinforced ${artifact.aggregate.overall.averageReinforcedCardCount.toFixed(2)}, starter shell left ${artifact.aggregate.overall.averageStarterShellCardsRemaining.toFixed(2)}, centerpieces ${artifact.aggregate.overall.averageCenterpieceCount.toFixed(2)}`
  );
  const deckFamilies = Object.entries(artifact.aggregate.overall.deckFamilyDistribution || {})
    .map(([family, rate]) => `${family} ${(Number(rate || 0) * 100).toFixed(1)}%`)
    .join(", ");
  lines.push(`- families: ${deckFamilies || "none"}`);

  lines.push("", "## Build Journey");
  lines.push(
    `- commit act ${artifact.aggregate.overall.averageCommittedAtAct.toFixed(2)}, first reinforcement act ${artifact.aggregate.overall.averageFirstMajorReinforcementAct.toFixed(2)}, purges ${artifact.aggregate.overall.averagePurgeCount.toFixed(2)}, refinements ${artifact.aggregate.overall.averageRefinementCount.toFixed(2)}, evolutions ${artifact.aggregate.overall.averageEvolutionCount.toFixed(2)}`
  );

  lines.push("", "## Groups");
  artifact.aggregate.groups.forEach((group) => {
    const targetSuffix = group.targetArchetypeLabel ? ` / ${group.targetArchetypeLabel}` : "";
    lines.push(`- ${group.className} / ${group.policyLabel}${targetSuffix}: ${(group.winRate * 100).toFixed(1)}% win, Act V ${(group.act5Rate * 100).toFixed(1)}%, avg level ${group.averageFinalLevel.toFixed(2)}`);
  });

  if (artifact.aggregate.archetypes.naturalConvergence.length > 0) {
    lines.push("", "## Natural Convergence");
    artifact.aggregate.archetypes.naturalConvergence.forEach((entry) => {
      lines.push(
        `- ${entry.className} / ${entry.policyLabel} -> ${entry.archetypeLabel}: ${(entry.convergenceRate * 100).toFixed(1)}% convergence, avg commit act ${entry.averageCommitAct.toFixed(2)}, final integrity ${entry.averageFinalLaneIntegrity.toFixed(2)}`
      );
    });
  }

  if (artifact.aggregate.archetypes.committedLanes.length > 0) {
    lines.push("", "## Committed Lanes");
    artifact.aggregate.archetypes.committedLanes.forEach((entry) => {
      const endWeapons = entry.commonEndWeapons.length > 0 ? entry.commonEndWeapons.join(", ") : "none";
      const runewords = entry.commonRunewords.length > 0 ? entry.commonRunewords.join(", ") : "none";
      const failures = entry.commonFailureEncounters.length > 0 ? entry.commonFailureEncounters.join(", ") : "none";
      lines.push(
        `- ${entry.className} / ${entry.targetArchetypeLabel}: ${(entry.clearRate * 100).toFixed(1)}% clear, ${(entry.committedByCheckpointRate * 100).toFixed(1)}% committed by checkpoint, final integrity ${entry.averageLaneIntegrityFinal.toFixed(2)}, boss turns ${entry.averageBossTurns.toFixed(2)}, health ${entry.laneHealth}`
      );
      lines.push(`  end weapons: ${endWeapons}`);
      lines.push(`  runewords: ${runewords}`);
      lines.push(`  common failures: ${failures}`);
    });
  }

  if (artifact.bands.length > 0) {
    lines.push("", "## Bands");
    artifact.bands.forEach((band) => {
      lines.push(`- ${band.label}: ${band.status.toUpperCase()} (${band.actual === null ? "missing" : band.actual})`);
    });
  }

  if (artifact.baselineComparison) {
    lines.push("", "## Baseline Drift");
    Object.entries(artifact.baselineComparison.deltas).forEach(([metricId, delta]) => {
      lines.push(`- ${metricId}: ${delta >= 0 ? "+" : ""}${delta}`);
    });
  }

  return lines.join("\n");
}

function buildCombatEncounterMetrics(encounters: Array<{
  kind: "boss" | "miniboss" | "elite" | "battle";
  runs: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
  powerRatio: number;
  openingHandFullSpendRate?: number;
  averageTurn1UnspentEnergy?: number;
  averageEarlyUnspentEnergy?: number;
  averageEarlyMeaningfulUnplayedRate?: number;
  averageEarlyCandidateCount?: number;
  averageEarlyMeaningfulCandidateCount?: number;
  averageEarlyDecisionScoreSpread?: number;
  earlyCloseDecisionRate?: number;
  averageEarlyEndTurnRegret?: number;
}>) {
  const byKind: Record<string, {
    count: number;
    weight: number;
    win: number;
    turns: number;
    hero: number;
    merc: number;
    enemy: number;
    ratio: number;
    openingFullSpend: number;
    turn1Unspent: number;
    earlyUnspent: number;
    earlyMeaningfulUnplayed: number;
    earlyCandidateCount: number;
    earlyMeaningfulCandidateCount: number;
    earlyDecisionScoreSpread: number;
    earlyCloseDecision: number;
    earlyEndTurnRegret: number;
  }> = {};

  encounters.forEach((entry) => {
    const kind = entry.kind || "battle";
    byKind[kind] = byKind[kind] || {
      count: 0,
      weight: 0,
      win: 0,
      turns: 0,
      hero: 0,
      merc: 0,
      enemy: 0,
      ratio: 0,
      openingFullSpend: 0,
      turn1Unspent: 0,
      earlyUnspent: 0,
      earlyMeaningfulUnplayed: 0,
      earlyCandidateCount: 0,
      earlyMeaningfulCandidateCount: 0,
      earlyDecisionScoreSpread: 0,
      earlyCloseDecision: 0,
      earlyEndTurnRegret: 0,
    };
    const aggregate = byKind[kind];
    const weight = Math.max(1, Number(entry.runs || 1));
    aggregate.count += 1;
    aggregate.weight += weight;
    aggregate.win += Number(entry.winRate || 0) * weight;
    aggregate.turns += Number(entry.averageTurns || 0) * weight;
    aggregate.hero += Number(entry.averageHeroLifePct || 0) * weight;
    aggregate.merc += Number(entry.averageMercenaryLifePct || 0) * weight;
    aggregate.enemy += Number(entry.averageEnemyLifePct || 0) * weight;
    aggregate.ratio += Number(entry.powerRatio || 0) * weight;
    aggregate.openingFullSpend += Number(entry.openingHandFullSpendRate || 0) * weight;
    aggregate.turn1Unspent += Number(entry.averageTurn1UnspentEnergy || 0) * weight;
    aggregate.earlyUnspent += Number(entry.averageEarlyUnspentEnergy || 0) * weight;
    aggregate.earlyMeaningfulUnplayed += Number(entry.averageEarlyMeaningfulUnplayedRate || 0) * weight;
    aggregate.earlyCandidateCount += Number(entry.averageEarlyCandidateCount || 0) * weight;
    aggregate.earlyMeaningfulCandidateCount += Number(entry.averageEarlyMeaningfulCandidateCount || 0) * weight;
    aggregate.earlyDecisionScoreSpread += Number(entry.averageEarlyDecisionScoreSpread || 0) * weight;
    aggregate.earlyCloseDecision += Number(entry.earlyCloseDecisionRate || 0) * weight;
    aggregate.earlyEndTurnRegret += Number(entry.averageEarlyEndTurnRegret || 0) * weight;
  });

  return Object.fromEntries(
    Object.entries(byKind).map(([kind, aggregate]) => {
      const weight = Math.max(1, aggregate.weight);
      const entry = {
        count: aggregate.count,
        winRate: roundTo(aggregate.win / weight),
        averageTurns: roundTo(aggregate.turns / weight),
        averageHeroLifePct: roundTo(aggregate.hero / weight),
        averageMercenaryLifePct: roundTo(aggregate.merc / weight),
        averageEnemyLifePct: roundTo(aggregate.enemy / weight),
        averagePowerRatio: roundTo(aggregate.ratio / weight),
        openingHandFullSpendRate: roundTo(aggregate.openingFullSpend / weight),
        averageTurn1UnspentEnergy: roundTo(aggregate.turn1Unspent / weight),
        averageEarlyUnspentEnergy: roundTo(aggregate.earlyUnspent / weight),
        averageEarlyMeaningfulUnplayedRate: roundTo(aggregate.earlyMeaningfulUnplayed / weight),
        averageEarlyCandidateCount: roundTo(aggregate.earlyCandidateCount / weight, 3),
        averageEarlyMeaningfulCandidateCount: roundTo(aggregate.earlyMeaningfulCandidateCount / weight, 3),
        averageEarlyDecisionScoreSpread: roundTo(aggregate.earlyDecisionScoreSpread / weight, 3),
        earlyCloseDecisionRate: roundTo(aggregate.earlyCloseDecision / weight, 3),
        averageEarlyEndTurnRegret: roundTo(aggregate.earlyEndTurnRegret / weight, 3),
      };
      return [kind, {
        ...entry,
        decisionTension: buildDecisionTensionSummary(entry),
      }];
    })
  );
}

function createCombatBalanceRecord(spec: BalanceExperimentSpec, task: BalanceRunTask): BalanceRunRecord {
  type CombatBalanceClassReport = BalanceSimulationReport["classReports"][number];
  type CombatBalanceScenarioReport = CombatBalanceClassReport["scenarios"][number];
  type CombatBalanceEncounterReport = CombatBalanceScenarioReport["encounters"][number];

  const simulationReport = runBalanceSimulationReport({
    classIds: [task.classId],
    scenarioIds: [task.policyId],
    encounterSetId: spec.encounterSetId || "act5_endgame",
    runsPerEncounter: Math.max(1, Number(spec.runsPerEncounter || 16)),
    encounterLimit: Math.max(0, Number(spec.encounterLimit || 0)),
  });
  const classReport = simulationReport.classReports[0] as CombatBalanceClassReport | undefined;
  const scenarioReport = classReport?.scenarios?.[0] as CombatBalanceScenarioReport | undefined;
  if (!classReport || !scenarioReport) {
    throw new Error(`Combat balance simulation produced no result for ${task.classId} / ${task.policyId}.`);
  }

  const finalBuild = {
    level: Number(scenarioReport.build.level || 0),
    deckSize: Number(scenarioReport.build.deckSize || 0),
    topCards: [...(scenarioReport.build.deckPreview || [])],
    deckProficiencies: [],
    hero: { ...scenarioReport.build.hero },
    mercenary: {
      name: scenarioReport.build.mercenaryName || "Mercenary",
      maxLife: Number(scenarioReport.build.mercenary.maxLife || 0),
      attack: Number(scenarioReport.build.mercenary.attack || 0),
    },
    weapon: scenarioReport.build.weapon
      ? {
          itemId: scenarioReport.build.weapon.itemId,
          name: scenarioReport.build.weapon.name,
          family: scenarioReport.build.weapon.family,
          rarity: scenarioReport.build.weapon.rarity,
          preferredForClass: true,
          damageTypes: [],
          effects: [],
        }
      : null,
    armor: scenarioReport.build.armorResistances?.length > 0 || scenarioReport.build.armorImmunities?.length > 0
      ? {
          itemId: "",
          name: "Armor Profile",
          rarity: "",
          resistances: [...(scenarioReport.build.armorResistances || [])],
          immunities: [...(scenarioReport.build.armorImmunities || [])],
        }
      : null,
    favoredTreeId: "",
    favoredTreeName: "",
    dominantArchetypeId: "",
    dominantArchetypeLabel: "",
    dominantArchetypeScore: 0,
    secondaryArchetypeId: "",
    secondaryArchetypeLabel: "",
    secondaryArchetypeScore: 0,
    primaryTreeId: "",
    secondaryUtilityTreeId: "",
    specializationStage: "exploratory",
    offTreeUtilityCount: 0,
    offTreeDamageCount: 0,
    counterCoverageTags: [],
    archetypeScores: [],
    activeRunewords: [],
    deckProfile: buildEmptyDeckProfile(),
    archetypeCommitment: null,
  } as PolicyRunSummary["finalBuild"];

  const encounterResults = (scenarioReport.encounters || []).map((encounter: CombatBalanceEncounterReport) => ({
    actNumber: Number(scenarioReport.build.actNumber || spec.throughActNumber || 5),
    encounterId: encounter.encounterId,
    encounterName: encounter.encounterName,
    zoneTitle: encounter.zoneTitle,
    kind: encounter.kind || "battle",
    zoneKind: encounter.zoneKind || "battle",
    zoneRole: encounter.kind || "battle",
    outcome: Number(encounter.winRate || 0) >= 0.5 ? "victory" : "defeat",
    turns: Number(encounter.averageTurns || 0),
    heroLifePct: Number(encounter.averageHeroLifePct || 0),
    mercenaryLifePct: Number(encounter.averageMercenaryLifePct || 0),
    enemyLifePct: Number(encounter.averageEnemyLifePct || 0),
    heroPowerScore: Number(scenarioReport.build.powerScore || 0),
    enemyPowerScore: Number(encounter.enemyPowerScore || 0),
    powerRatio: Number(encounter.powerRatio || 0),
    openingHandFullSpend: Number(encounter.openingHandFullSpendRate || 0) >= 0.5,
    openingHandCardsPlayed: 0,
    openingHandSize: 0,
    turn1UnspentEnergy: Number(encounter.averageTurn1UnspentEnergy || 0),
    earlyUnspentEnergyAverage: Number(encounter.averageEarlyUnspentEnergy || 0),
    earlyMeaningfulUnplayedRate: Number(encounter.averageEarlyMeaningfulUnplayedRate || 0),
    averageEarlyCandidateCount: Number(encounter.averageEarlyCandidateCount || 0),
    averageEarlyMeaningfulCandidateCount: Number(encounter.averageEarlyMeaningfulCandidateCount || 0),
    averageEarlyDecisionScoreSpread: Number(encounter.averageEarlyDecisionScoreSpread || 0),
    earlyCloseDecisionRate: Number(encounter.earlyCloseDecisionRate || 0),
    averageEarlyEndTurnRegret: Number(encounter.averageEarlyEndTurnRegret || 0),
  }));

  const summary: PolicyRunSummary = {
    runSummary: {} as RunState["summary"],
    zoneKindCounts: {},
    zoneRoleCounts: {},
    nodeTypeCounts: {},
    rewardKindCounts: {},
    choiceKindCounts: {},
    rewardEffectCounts: {},
    rewardRoleCounts: {},
    strategyRoleCounts: {},
    townActionCounts: {},
    encounterResults,
    encounterMetricsByKind: buildCombatEncounterMetrics(scenarioReport.encounters || []),
    world: {
      resolvedNodeCount: 0,
      worldFlagCount: 0,
      questOutcomes: 0,
      questFollowUpsResolved: 0,
      questChainsResolved: 0,
      shrineOutcomes: 0,
      eventOutcomes: 0,
      opportunityOutcomes: 0,
    },
    finalBuild,
    buildJourney: buildEmptyBuildJourney(),
    archetypeCommitment: null,
  };

  return {
    runKey: buildRunKeyString(task.runKey),
    experimentId: spec.experimentId,
    scenarioType: spec.scenarioType,
    classId: task.classId,
    className: classReport.className || task.classId,
    policyId: task.policyId,
    policyLabel: scenarioReport.label || task.policyId,
    seedOffset: task.seedOffset,
    targetArchetypeId: task.targetArchetypeId || "",
    targetArchetypeLabel: task.targetArchetypeLabel || "",
    targetBand: task.targetBand || "",
    commitmentMode: spec.commitmentMode || "natural",
    outcome: "simulation_complete",
    finalActNumber: Number(scenarioReport.build.actNumber || 0),
    finalLevel: Number(scenarioReport.build.level || 0),
    failure: null,
    durationMs: 0,
    completedAt: new Date().toISOString(),
    requestedTrainingLoadout: task.trainingLoadout || null,
    checkpoints: [],
    summary,
    snapshots: {},
    traces: [],
    archetypeEvaluation: null,
    combat: {
      scenarioId: scenarioReport.scenarioId || task.policyId,
      scenarioLabel: scenarioReport.label || task.policyId,
      encounterSetId: simulationReport.encounterSetId,
      encounterSetLabel: simulationReport.encounterSetLabel,
      runsPerEncounter: simulationReport.runsPerEncounter,
      assumptions: [...(scenarioReport.assumptions || [])],
      build: {
        level: Number(scenarioReport.build.level || 0),
        actNumber: Number(scenarioReport.build.actNumber || 0),
        deckSize: Number(scenarioReport.build.deckSize || 0),
        powerScore: Number(scenarioReport.build.powerScore || 0),
        hero: { ...scenarioReport.build.hero },
        mercenary: { ...scenarioReport.build.mercenary },
        weapon: scenarioReport.build.weapon ? { ...scenarioReport.build.weapon } : null,
        armorResistances: [...(scenarioReport.build.armorResistances || [])],
        armorImmunities: [...(scenarioReport.build.armorImmunities || [])],
        notes: [...(scenarioReport.build.notes || [])],
      },
      overall: { ...scenarioReport.overall },
      encounters: (scenarioReport.encounters || []).map((encounter: CombatBalanceEncounterReport) => ({ ...encounter })),
    },
  };
}

function pickTraceSnapshot(record: BalanceRunRecord, reason: string) {
  if (reason === "failure" && record.snapshots.pre_failure) {
    return record.snapshots.pre_failure;
  }
  const failureSnapshot = Object.values(record.snapshots).find((entry) => entry.kind === "failure");
  if (failureSnapshot) {
    return failureSnapshot;
  }
  const bossSnapshot = Object.values(record.snapshots).find((entry) => entry.kind === "pre_boss");
  if (bossSnapshot) {
    return bossSnapshot;
  }
  return record.snapshots.final || record.snapshots.start || null;
}

function isRunOutlier(record: BalanceRunRecord, spec: BalanceExperimentSpec) {
  const bossMetrics = record.combat
    ? buildCombatEncounterMetrics(record.combat.encounters || []).boss
    : (record.summary.encounterMetricsByKind || {})?.boss;
  if (record.durationMs >= Number(spec.slowRunThresholdMs || 0) && Number(spec.slowRunThresholdMs || 0) > 0) {
    return "slow_run";
  }
  if (bossMetrics && (Number(bossMetrics.averageTurns || 0) < 2 || Number(bossMetrics.averageTurns || 0) > 18)) {
    return "boss_pacing_outlier";
  }
  return "";
}

export function executeBalanceRunTask(
  spec: BalanceExperimentSpec,
  task: BalanceRunTask,
  options: {
    snapshotToken?: string;
  } = {}
): BalanceRunExecutionResult {
  if (spec.scenarioType === "combat_balance") {
    return {
      record: createCombatBalanceRecord(spec, task),
      tracePayloads: [],
    };
  }

  type BalanceHookPayload = {
    harness: ReturnType<typeof createAppHarness>;
    state: AppState;
    continuationContext: RunProgressionContinuationContext;
  };
  type BalanceCheckpointHookPayload = BalanceHookPayload & {
    checkpoint: SafeZoneCheckpointSummary;
  };
  type BalanceEncounterHookPayload = BalanceHookPayload & {
    encounter: SimulationFailureSummary;
  };

  const policy = getPolicyDefinition(task.policyId);
  const archetypePlan = buildTaskArchetypePlan(spec, task);
  const snapshots: Record<string, BalanceSnapshotReference> = {};
  let lastEncounterSnapshot: BalanceSnapshotReference | null = null;

  const hooks = {
    onInitialized: ({ harness, state, continuationContext }: BalanceHookPayload) => {
      snapshots.start = createBalanceSnapshotTokenFromState(harness, state, {
        captureKind: "start",
        label: "Run start",
        runKey: buildRunKeyString(task.runKey),
        simulationContext: continuationContext,
        policyId: task.policyId,
        throughActNumber: spec.throughActNumber,
        probeRuns: spec.probeRuns,
        maxCombatTurns: spec.maxCombatTurns,
        seedOffset: task.seedOffset,
      });
    },
    onCheckpoint: ({ harness, state, checkpoint, continuationContext }: BalanceCheckpointHookPayload) => {
      snapshots[`checkpoint:${checkpoint.checkpointId}`] = createBalanceSnapshotTokenFromState(harness, state, {
        captureKind: "checkpoint",
        label: checkpoint.label,
        checkpointId: checkpoint.checkpointId,
        runKey: buildRunKeyString(task.runKey),
        simulationContext: continuationContext,
        policyId: task.policyId,
        throughActNumber: spec.throughActNumber,
        probeRuns: spec.probeRuns,
        maxCombatTurns: spec.maxCombatTurns,
        seedOffset: task.seedOffset,
      });
    },
    onEncounterStart: ({ harness, state, encounter, continuationContext }: BalanceEncounterHookPayload) => {
      const snapshotRef = createBalanceSnapshotTokenFromState(harness, state, {
        captureKind: encounter.kind === "boss" ? "pre_boss" : "pre_failure",
        label: `${encounter.zoneTitle} / ${encounter.encounterName}`,
        encounterId: encounter.encounterId,
        runKey: buildRunKeyString(task.runKey),
        simulationContext: continuationContext,
        policyId: task.policyId,
        throughActNumber: spec.throughActNumber,
        probeRuns: spec.probeRuns,
        maxCombatTurns: spec.maxCombatTurns,
        seedOffset: task.seedOffset,
      });
      lastEncounterSnapshot = snapshotRef;
      if (encounter.kind === "boss") {
        snapshots[`pre_boss:${encounter.encounterId}`] = snapshotRef;
      }
    },
    onRunFailure: ({ harness, state, continuationContext }: BalanceHookPayload) => {
      if (lastEncounterSnapshot) {
        snapshots.pre_failure = lastEncounterSnapshot;
      }
      snapshots.failure = createBalanceSnapshotTokenFromState(harness, state, {
        captureKind: "failure",
        label: "Failure state",
        runKey: buildRunKeyString(task.runKey),
        simulationContext: continuationContext,
        policyId: task.policyId,
        throughActNumber: spec.throughActNumber,
        probeRuns: spec.probeRuns,
        maxCombatTurns: spec.maxCombatTurns,
        seedOffset: task.seedOffset,
      });
    },
    onRunComplete: ({ harness, state, continuationContext }: BalanceHookPayload) => {
      snapshots.final = createBalanceSnapshotTokenFromState(harness, state, {
        captureKind: "final",
        label: "Final state",
        runKey: buildRunKeyString(task.runKey),
        simulationContext: continuationContext,
        policyId: task.policyId,
        throughActNumber: spec.throughActNumber,
        probeRuns: spec.probeRuns,
        maxCombatTurns: spec.maxCombatTurns,
        seedOffset: task.seedOffset,
      });
    },
  };

  const startedAt = Date.now();
  let report;
  let className = task.classId;
  let finalRun: RunState | null = null;
  let finalHarness: ReturnType<typeof createQuietAppHarness> | null = null;
  if (options.snapshotToken) {
    const { harness, state, envelope } = restoreBalanceSnapshotToken(options.snapshotToken);
    applySimulationTrainingLoadout(harness, state, task.trainingLoadout || envelope.simulation?.continuationContext?.trainingLoadout || null);
    className = state.run?.className || envelope.snapshot.run?.className || task.classId;
    report = runProgressionPolicyFromState(
      harness,
      state,
      task.classId,
      policy,
      spec.throughActNumber,
      spec.probeRuns,
      spec.maxCombatTurns,
      task.seedOffset,
      envelope.simulation?.continuationContext || undefined,
      hooks,
      archetypePlan,
      "default",
      task.trainingLoadout || envelope.simulation?.continuationContext?.trainingLoadout || null
    );
    finalRun = state.run;
    finalHarness = harness;
  } else {
    const harness = createQuietAppHarness();
    const seed = createProgressionSimulationSeed(task.classId, task.policyId, spec.throughActNumber, task.seedOffset);
    const state = createSimulationState(harness, task.classId, seed, {
      trainingLoadout: task.trainingLoadout || null,
    });
    className = state.run?.className || task.classId;
    report = runProgressionPolicyFromState(
      harness,
      state,
      task.classId,
      policy,
      spec.throughActNumber,
      spec.probeRuns,
      spec.maxCombatTurns,
      task.seedOffset,
      undefined,
      hooks,
      archetypePlan,
      "default",
      task.trainingLoadout || null
    );
    finalRun = state.run;
    finalHarness = harness;
  }
  const durationMs = Date.now() - startedAt;
  const finalSkillBar = finalHarness ? buildRunSkillBarSummary(finalHarness, finalRun) : undefined;

  const record: BalanceRunRecord = {
    runKey: buildRunKeyString(task.runKey),
    experimentId: spec.experimentId,
    scenarioType: spec.scenarioType,
    classId: task.classId,
    className,
    policyId: task.policyId,
    policyLabel: report.policyLabel,
    seedOffset: task.seedOffset,
    targetArchetypeId: task.targetArchetypeId || "",
    targetArchetypeLabel: task.targetArchetypeLabel || "",
    targetBand: task.targetBand || "",
    commitmentMode: spec.commitmentMode || "natural",
    outcome: report.outcome,
    finalActNumber: Number(report.finalActNumber || 0),
    finalLevel: Number(report.finalLevel || 0),
    failure: report.failure || null,
    durationMs,
    completedAt: new Date().toISOString(),
    requestedTrainingLoadout: task.trainingLoadout || null,
    skillBar: finalSkillBar,
    analysis: buildRunAnalysisSummary(report, task.trainingLoadout || null, finalSkillBar),
    checkpoints: clone(report.checkpoints || []),
    summary: clone(report.summary),
    snapshots,
    traces: [],
    archetypeEvaluation: clone(report.summary?.archetypeCommitment || null),
  };

  const tracePayloads: BalanceRunExecutionResult["tracePayloads"] = [];
  if (spec.traceFailures && record.outcome === "run_failed") {
    const snapshot = pickTraceSnapshot(record, "failure");
    if (snapshot) {
      tracePayloads.push({
        traceId: `${record.runKey}:failure`,
        reason: "failure",
        snapshotDigest: snapshot.digest,
        payload: traceFromBalanceSnapshotToken(snapshot.token, spec.maxCombatTurns),
      });
      record.traces.push({
        traceId: `${record.runKey}:failure`,
        reason: "failure",
        snapshotDigest: snapshot.digest,
      });
    }
  }

  if (spec.traceOutliers) {
    const outlierReason = isRunOutlier(record, spec);
    if (outlierReason) {
      const snapshot = pickTraceSnapshot(record, outlierReason);
      if (snapshot) {
        tracePayloads.push({
          traceId: `${record.runKey}:${outlierReason}`,
          reason: outlierReason,
          snapshotDigest: snapshot.digest,
          payload: traceFromBalanceSnapshotToken(snapshot.token, spec.maxCombatTurns),
        });
        record.traces.push({
          traceId: `${record.runKey}:${outlierReason}`,
          reason: outlierReason,
          snapshotDigest: snapshot.digest,
        });
      }
    }
  }

  return { record, tracePayloads };
}
