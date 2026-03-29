import crypto from "node:crypto";
import zlib from "node:zlib";

import { createAppHarness } from "./browser-harness";
import { runBalanceSimulationReport, type BalanceSimulationReport } from "./combat-simulator";
import {
  createQuietAppHarness,
  createProgressionSimulationSeed,
  createSimulationState,
  createSimulationStateFromSnapshot,
  getRunProgressionPolicyDefinitions,
  getTrackedRandomState,
  runProgressionPolicyFromState,
  traceCombatStateWithPolicy,
  type PolicyRunSummary,
  type RunProgressionContinuationContext,
  type SafeZoneCheckpointSummary,
  type SimulationFailureSummary,
} from "./run-progression-simulator";

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"] as const;
const DEFAULT_POLICY_IDS = ["aggressive", "balanced", "control", "bulwark"] as const;

export type BalanceScenarioType =
  | "campaign"
  | "checkpoint_probe"
  | "boss_probe"
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
}

export interface BalanceRunKey {
  experimentId: string;
  scenarioType: BalanceScenarioType;
  classId: string;
  policyId: string;
  seedOffset: number;
}

export interface BalanceRunTask {
  runKey: BalanceRunKey;
  classId: string;
  policyId: string;
  seedOffset: number;
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
  outcome: string;
  finalActNumber: number;
  finalLevel: number;
  failure: SimulationFailureSummary | null;
  durationMs: number;
  completedAt: string;
  checkpoints: SafeZoneCheckpointSummary[];
  summary: PolicyRunSummary;
  snapshots: Record<string, BalanceSnapshotReference>;
  traces: BalanceTraceReference[];
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
    };
    encounters: Array<{
      encounterId: string;
      encounterName: string;
      zoneTitle: string;
      zoneKind: string;
      kind: "boss" | "elite" | "battle";
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
    }>;
  } | null;
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
  runs: number;
  winRate: number;
  failureRate: number;
  act2Rate: number;
  act5Rate: number;
  averageFinalAct: number;
  averageFinalLevel: number;
  averageDurationMs: number;
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
  };
  encounterMetricsByKind: Record<string, {
    count: number;
    winRate: number;
    averageTurns: number;
    averageHeroLifePct: number;
    averageMercenaryLifePct: number;
    averageEnemyLifePct: number;
    averagePowerRatio: number;
  }>;
  strategyRoleCounts: Record<string, number>;
  rewardRoleCounts: Record<string, number>;
  groups: BalanceAggregateGroupSummary[];
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

function roundTo(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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
  return `${runKey.experimentId}:${runKey.scenarioType}:${runKey.classId}:${runKey.policyId}:${runKey.seedOffset}`;
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
    });
  });
  return Object.fromEntries(
    Object.entries(byKind).map(([kind, aggregate]) => {
      const weight = Math.max(1, aggregate.sampleWeight);
      return [kind, {
        count: aggregate.count,
        winRate: roundTo(aggregate.winWeighted / weight),
        averageTurns: roundTo(aggregate.turnsWeighted / weight),
        averageHeroLifePct: roundTo(aggregate.heroLifeWeighted / weight),
        averageMercenaryLifePct: roundTo(aggregate.mercLifeWeighted / weight),
        averageEnemyLifePct: roundTo(aggregate.enemyLifeWeighted / weight),
        averagePowerRatio: roundTo(aggregate.powerRatioWeighted / weight),
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
      title: "Elite Pressure",
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
        { metricId: "encounter.elite.average_turns", label: "Elite average turns", min: 2.5, max: 10, severity: "soft" },
      ],
      tags: ["baseline", "elite"],
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
      expectedBands: [
        { metricId: "overall.off_archetype_weapon_rate", label: "Final off-archetype weapon rate", max: 0.45, severity: "soft" },
      ],
      tags: ["baseline", "archetype"],
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
  const policyIds =
    spec.scenarioType === "combat_balance"
      ? (spec.scenarioIds && spec.scenarioIds.length > 0 ? spec.scenarioIds : spec.policyIds)
      : spec.policyIds;
  spec.classIds.forEach((classId) => {
    policyIds.forEach((policyId) => {
      spec.seedOffsets.forEach((seedOffset) => {
        tasks.push({
          runKey: {
            experimentId: spec.experimentId,
            scenarioType: spec.scenarioType,
            classId,
            policyId,
            seedOffset,
          },
          classId,
          policyId,
          seedOffset,
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

export function aggregateBalanceRunRecords(spec: BalanceExperimentSpec, records: BalanceRunRecord[]): BalanceAggregateReport {
  const groups = new Map<string, {
    classId: string;
    className: string;
    policyId: string;
    policyLabel: string;
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

  records.forEach((record) => {
    const key = `${record.classId}:${record.policyId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        classId: record.classId,
        className: record.className,
        policyId: record.policyId,
        policyLabel: record.policyLabel,
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
    mergeCounts(rewardRoleCounts, record.summary.rewardRoleCounts);
    mergeCounts(strategyRoleCounts, record.summary.strategyRoleCounts);
  });

  const divisor = Math.max(1, records.length);
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
        runs: group.runs,
        winRate: roundTo(group.wins / Math.max(1, group.runs)),
        failureRate: roundTo(group.failures / Math.max(1, group.runs)),
        act2Rate: roundTo(group.act2 / Math.max(1, group.runs)),
        act5Rate: roundTo(group.act5 / Math.max(1, group.runs)),
        averageFinalAct: roundTo(group.finalActTotal / Math.max(1, group.runs)),
        averageFinalLevel: roundTo(group.finalLevelTotal / Math.max(1, group.runs)),
        averageDurationMs: roundTo(group.durationTotal / Math.max(1, group.runs)),
      }))
      .sort((left, right) => left.className.localeCompare(right.className) || left.policyLabel.localeCompare(right.policyLabel)),
  };
}

function resolveMetricValue(report: BalanceAggregateReport, metricId: string): number | null {
  if (metricId === "overall.win_rate") { return report.overall.winRate; }
  if (metricId === "overall.failure_rate") { return report.overall.failureRate; }
  if (metricId === "overall.act2_rate") { return report.overall.act2Rate; }
  if (metricId === "overall.act5_rate") { return report.overall.act5Rate; }
  if (metricId === "overall.average_runewords") { return report.overall.averageRunewords; }
  if (metricId === "overall.off_archetype_weapon_rate") { return report.overall.offArchetypeWeaponRate; }
  if (metricId === "overall.hand_size_bonus_rate") { return report.overall.handSizeBonusRate; }
  if (metricId === "overall.combat_sample_win_rate") { return report.overall.combatSampleWinRate; }

  const encounterMatch = metricId.match(/^encounter\.(boss|elite|battle)\.(average_turns|win_rate|average_power_ratio)$/);
  if (encounterMatch) {
    const [, kind, field] = encounterMatch;
    const entry = report.encounterMetricsByKind[kind];
    if (!entry) {
      return null;
    }
    if (field === "average_turns") { return entry.averageTurns; }
    if (field === "win_rate") { return entry.winRate; }
    if (field === "average_power_ratio") { return entry.averagePowerRatio; }
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
    "",
    "## Encounter Metrics",
  ];

  Object.entries(artifact.aggregate.encounterMetricsByKind).forEach(([kind, entry]) => {
    lines.push(`- ${kind}: ${entry.averageTurns.toFixed(2)} turns, ${(entry.winRate * 100).toFixed(1)}% win, ${entry.averagePowerRatio.toFixed(2)}x ratio`);
  });

  lines.push("", "## Groups");
  artifact.aggregate.groups.forEach((group) => {
    lines.push(`- ${group.className} / ${group.policyLabel}: ${(group.winRate * 100).toFixed(1)}% win, Act V ${(group.act5Rate * 100).toFixed(1)}%, avg level ${group.averageFinalLevel.toFixed(2)}`);
  });

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
  kind: "boss" | "elite" | "battle";
  runs: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
  powerRatio: number;
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
  }> = {};

  encounters.forEach((entry) => {
    const kind = entry.kind || "battle";
    byKind[kind] = byKind[kind] || { count: 0, weight: 0, win: 0, turns: 0, hero: 0, merc: 0, enemy: 0, ratio: 0 };
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
  });

  return Object.fromEntries(
    Object.entries(byKind).map(([kind, aggregate]) => {
      const weight = Math.max(1, aggregate.weight);
      return [kind, {
        count: aggregate.count,
        winRate: roundTo(aggregate.win / weight),
        averageTurns: roundTo(aggregate.turns / weight),
        averageHeroLifePct: roundTo(aggregate.hero / weight),
        averageMercenaryLifePct: roundTo(aggregate.merc / weight),
        averageEnemyLifePct: roundTo(aggregate.enemy / weight),
        averagePowerRatio: roundTo(aggregate.ratio / weight),
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
    archetypeScores: [],
    activeRunewords: [],
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
    outcome: "simulation_complete",
    finalActNumber: Number(scenarioReport.build.actNumber || 0),
    finalLevel: Number(scenarioReport.build.level || 0),
    failure: null,
    durationMs: 0,
    completedAt: new Date().toISOString(),
    checkpoints: [],
    summary,
    snapshots: {},
    traces: [],
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
  if (options.snapshotToken) {
    const { harness, state, envelope } = restoreBalanceSnapshotToken(options.snapshotToken);
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
      hooks
    );
  } else {
    const harness = createQuietAppHarness();
    const seed = createProgressionSimulationSeed(task.classId, task.policyId, spec.throughActNumber, task.seedOffset);
    const state = createSimulationState(harness, task.classId, seed);
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
      hooks
    );
  }
  const durationMs = Date.now() - startedAt;

  const record: BalanceRunRecord = {
    runKey: buildRunKeyString(task.runKey),
    experimentId: spec.experimentId,
    scenarioType: spec.scenarioType,
    classId: task.classId,
    className,
    policyId: task.policyId,
    policyLabel: report.policyLabel,
    seedOffset: task.seedOffset,
    outcome: report.outcome,
    finalActNumber: Number(report.finalActNumber || 0),
    finalLevel: Number(report.finalLevel || 0),
    failure: report.failure || null,
    durationMs,
    completedAt: new Date().toISOString(),
    checkpoints: clone(report.checkpoints || []),
    summary: clone(report.summary),
    snapshots,
    traces: [],
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
