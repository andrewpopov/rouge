import crypto from "node:crypto";

import {
  runBalanceSimulationReport,
  type BalanceSimulationOptions,
  type BalanceSimulationReport,
} from "./combat-simulator";
import { getDefaultPowerBands, type PowerBandRange } from "./power-curve-report";
import {
  createProgressionSimulationSeed,
  createQuietAppHarness,
  createSimulationState,
  runProgressionPolicyFromState,
  type RunProgressionSimulationOptions,
  type RunProgressionSimulationReport,
} from "./run-progression-simulator";
import { getPolicyDefinitions } from "./run-progression-simulator-core";

type EncounterBandKind = "boss" | "miniboss" | "elite" | "battle";
type PowerCalibrationSource = "synthetic" | "progression";
type CheckpointProbeProfile = NonNullable<RunProgressionSimulationOptions["checkpointProbeProfile"]>

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const DEFAULT_SCENARIO_IDS = ["mainline_rewarded"];
const DEFAULT_POLICY_IDS = ["aggressive"];

export interface PowerCalibrationBucketRange {
  min: number;
  max: number | null;
  label: string;
}

export interface PowerCalibrationSample {
  source: PowerCalibrationSource;
  encounterSetId: string;
  classId: string;
  className: string;
  scenarioId: string;
  scenarioLabel: string;
  policyId: string;
  policyLabel: string;
  checkpointKind: "synthetic" | "safe_zone" | "pre_boss";
  checkpointId: string;
  checkpointLabel: string;
  actNumber: number;
  seedOffset: number;
  encounterId: string;
  encounterName: string;
  zoneTitle: string;
  kind: EncounterBandKind;
  runs: number;
  buildPowerScore: number;
  bossReadinessScore: number;
  bossAdjustedPowerScore: number;
  enemyPowerScore: number;
  powerRatio: number;
  analysisPowerRatio: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
}

export interface PowerCalibrationBucketSummary {
  kind: EncounterBandKind;
  label: string;
  min: number;
  max: number | null;
  encounterCount: number;
  runCount: number;
  averagePowerRatio: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
}

export interface PowerCalibrationTargetBandSummary {
  kind: EncounterBandKind;
  band: PowerBandRange;
  encounterCount: number;
  runCount: number;
  averagePowerRatio: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
}

export interface PowerCalibrationMonotonicityViolation {
  metric: "winRate" | "averageTurns";
  previousBucket: string;
  previousValue: number;
  nextBucket: string;
  nextValue: number;
}

export interface PowerCalibrationKindSummary {
  kind: EncounterBandKind;
  sampleCount: number;
  runCount: number;
  averagePowerRatio: number;
  averageWinRate: number;
  averageTurns: number;
  buckets: PowerCalibrationBucketSummary[];
  targetBandSummary: PowerCalibrationTargetBandSummary;
  monotonicity: {
    winRateNonDecreasing: boolean;
    turnsNonIncreasing: boolean;
    violations: PowerCalibrationMonotonicityViolation[];
  };
}

export interface PowerCalibrationDeterminismCheck {
  checks: number;
  identical: boolean;
  digests: string[];
}

export interface PowerCalibrationReport {
  generatedAt: string;
  source: PowerCalibrationSource;
  classIds: string[];
  scenarioIds: string[];
  policyIds: string[];
  seedOffsets: number[];
  encounterSetIds: string[];
  checkpointProbeProfile: CheckpointProbeProfile;
  runsPerEncounter: number;
  encounterLimit: number;
  throughActNumber: number;
  probeRuns: number;
  targetBands: Record<EncounterBandKind, PowerBandRange>;
  bucketRanges: PowerCalibrationBucketRange[];
  determinism: PowerCalibrationDeterminismCheck;
  overall: {
    sampleCount: number;
    runCount: number;
    averagePowerRatio: number;
    averageWinRate: number;
    averageTurns: number;
  };
  kinds: Record<EncounterBandKind, PowerCalibrationKindSummary>;
  samples: PowerCalibrationSample[];
}

export interface PowerCalibrationReportOptions extends BalanceSimulationOptions, RunProgressionSimulationOptions {
  source?: PowerCalibrationSource;
  encounterSetIds?: string[];
  determinismChecks?: number;
  bucketRanges?: PowerCalibrationBucketRange[];
  seedOffsets?: number[];
  verboseProgress?: boolean;
  onProgress?: (event: PowerCalibrationProgressEvent) => void;
}

export interface PowerCalibrationProgressEvent {
  status: "started" | "encounter" | "checkpoint" | "combat" | "operation" | "completed";
  source: PowerCalibrationSource;
  passIndex: number;
  totalPasses: number;
  completedUnits: number;
  totalUnits: number;
  classId: string;
  scenarioId: string;
  policyId: string;
  seedOffset: number;
  encounterSetId: string;
  elapsedMs: number;
  detail?: string;
}

const DEFAULT_ENCOUNTER_SET_IDS = ["act5_all"];

export function getDefaultPowerCalibrationBuckets(): PowerCalibrationBucketRange[] {
  return [
    { min: 0, max: 0.8, label: "<0.8x" },
    { min: 0.8, max: 1.0, label: "0.8-1.0x" },
    { min: 1.0, max: 1.2, label: "1.0-1.2x" },
    { min: 1.2, max: 1.5, label: "1.2-1.5x" },
    { min: 1.5, max: 2.0, label: "1.5-2.0x" },
    { min: 2.0, max: 3.0, label: "2.0-3.0x" },
    { min: 3.0, max: 5.0, label: "3.0-5.0x" },
    { min: 5.0, max: null, label: "5.0x+" },
  ];
}

function roundTo(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function createEmptyBucketSummary(kind: EncounterBandKind, range: PowerCalibrationBucketRange): PowerCalibrationBucketSummary {
  return {
    kind,
    label: range.label,
    min: range.min,
    max: range.max,
    encounterCount: 0,
    runCount: 0,
    averagePowerRatio: 0,
    winRate: 0,
    averageTurns: 0,
    averageHeroLifePct: 0,
    averageMercenaryLifePct: 0,
    averageEnemyLifePct: 0,
  };
}

function buildSampleDigest(samples: PowerCalibrationSample[]) {
  return crypto.createHash("sha256").update(JSON.stringify(samples)).digest("hex");
}

function buildWeightedSummary(samples: PowerCalibrationSample[]) {
  const runCount = samples.reduce((sum, sample) => sum + Math.max(1, Number(sample.runs || 0)), 0);
  if (runCount <= 0) {
    return {
      runCount: 0,
      averagePowerRatio: 0,
      winRate: 0,
      averageTurns: 0,
      averageHeroLifePct: 0,
      averageMercenaryLifePct: 0,
      averageEnemyLifePct: 0,
    };
  }

  function weightedAverage(getValue: (sample: PowerCalibrationSample) => number) {
    return roundTo(
      samples.reduce((sum, sample) => sum + getValue(sample) * Math.max(1, Number(sample.runs || 0)), 0) / runCount
    );
  }

  return {
    runCount,
    averagePowerRatio: weightedAverage((sample) => Number(sample.analysisPowerRatio || 0)),
    winRate: weightedAverage((sample) => Number(sample.winRate || 0)),
    averageTurns: weightedAverage((sample) => Number(sample.averageTurns || 0)),
    averageHeroLifePct: weightedAverage((sample) => Number(sample.averageHeroLifePct || 0)),
    averageMercenaryLifePct: weightedAverage((sample) => Number(sample.averageMercenaryLifePct || 0)),
    averageEnemyLifePct: weightedAverage((sample) => Number(sample.averageEnemyLifePct || 0)),
  };
}

function normalizeSyntheticSamples(reports: Array<{ encounterSetId: string; report: BalanceSimulationReport }>): PowerCalibrationSample[] {
  return reports
    .flatMap(({ encounterSetId, report }) => {
      return report.classReports.flatMap((classReport) => {
        return classReport.scenarios.flatMap((scenario) => {
          return scenario.encounters.map((encounter) => {
            return {
              source: "synthetic",
              encounterSetId,
              classId: classReport.classId,
              className: classReport.className,
              scenarioId: scenario.scenarioId,
              scenarioLabel: scenario.label,
              policyId: "",
              policyLabel: "",
              checkpointKind: "synthetic",
              checkpointId: "",
              checkpointLabel: "",
              actNumber: 0,
              seedOffset: 0,
              encounterId: encounter.encounterId,
              encounterName: encounter.encounterName,
              zoneTitle: encounter.zoneTitle,
              kind: encounter.kind,
              runs: Number(encounter.runs || 0),
              buildPowerScore: Number(scenario.build.powerScore || 0),
              bossReadinessScore: Number(scenario.build.bossReadinessScore || 0),
              bossAdjustedPowerScore: Number(scenario.build.bossAdjustedPowerScore || scenario.build.powerScore || 0),
              enemyPowerScore: Number(encounter.enemyPowerScore || 0),
              powerRatio: Number(encounter.powerRatio || 0),
              analysisPowerRatio:
                encounter.kind === "boss"
                  ? roundTo(
                      Number(scenario.build.bossAdjustedPowerScore || scenario.build.powerScore || 0) /
                        Math.max(1, Number(encounter.enemyPowerScore || 0))
                    )
                  : Number(encounter.powerRatio || 0),
              winRate: Number(encounter.winRate || 0),
              averageTurns: Number(encounter.averageTurns || 0),
              averageHeroLifePct: Number(encounter.averageHeroLifePct || 0),
              averageMercenaryLifePct: Number(encounter.averageMercenaryLifePct || 0),
              averageEnemyLifePct: Number(encounter.averageEnemyLifePct || 0),
            } satisfies PowerCalibrationSample;
          });
        });
      });
    })
    .sort((left, right) => {
      return (
        left.source.localeCompare(right.source) ||
        left.kind.localeCompare(right.kind) ||
        left.classId.localeCompare(right.classId) ||
        left.scenarioId.localeCompare(right.scenarioId) ||
        left.encounterId.localeCompare(right.encounterId)
      );
    });
}

function normalizeProgressionSamples(reports: Array<{ seedOffset: number; report: RunProgressionSimulationReport }>): PowerCalibrationSample[] {
  return reports
    .flatMap(({ seedOffset, report }) => {
      return report.classReports.flatMap((classReport) => {
        return classReport.policyReports.flatMap((policyReport) => {
          return policyReport.checkpoints.flatMap((checkpoint) => {
            return checkpoint.probes.map((probe) => {
              const bossAdjustedPowerScore = Number(checkpoint.bossAdjustedPowerScore || checkpoint.powerScore || 0);
              const enemyPowerScore = Number(probe.enemyPowerScore || 0);
              return {
                source: "progression",
                encounterSetId: "progression_checkpoints",
                classId: classReport.classId,
                className: classReport.className,
                scenarioId: "",
                scenarioLabel: "",
                policyId: policyReport.policyId,
                policyLabel: policyReport.policyLabel,
                checkpointKind: checkpoint.checkpointKind,
                checkpointId: checkpoint.checkpointId,
                checkpointLabel: checkpoint.label,
                actNumber: Number(checkpoint.actNumber || 0),
                seedOffset,
                encounterId: probe.encounterId,
                encounterName: probe.encounterName,
                zoneTitle: probe.zoneTitle,
                kind: probe.kind,
                runs: Number(probe.runs || 0),
                buildPowerScore: Number(checkpoint.powerScore || 0),
                bossReadinessScore: Number(checkpoint.bossReadinessScore || 0),
                bossAdjustedPowerScore,
                enemyPowerScore,
                powerRatio: Number(probe.powerRatio || 0),
                analysisPowerRatio:
                  probe.kind === "boss"
                    ? roundTo(bossAdjustedPowerScore / Math.max(1, enemyPowerScore))
                    : Number(probe.powerRatio || 0),
                winRate: Number(probe.winRate || 0),
                averageTurns: Number(probe.averageTurns || 0),
                averageHeroLifePct: Number(probe.averageHeroLifePct || 0),
                averageMercenaryLifePct: Number(probe.averageMercenaryLifePct || 0),
                averageEnemyLifePct: Number(probe.averageEnemyLifePct || 0),
              } satisfies PowerCalibrationSample;
            });
          });
        });
      });
    })
    .sort((left, right) => {
      return (
        left.source.localeCompare(right.source) ||
        left.kind.localeCompare(right.kind) ||
        left.classId.localeCompare(right.classId) ||
        left.policyId.localeCompare(right.policyId) ||
        left.seedOffset - right.seedOffset ||
        left.checkpointId.localeCompare(right.checkpointId) ||
        left.encounterId.localeCompare(right.encounterId)
      );
    });
}

function getSamplesForBand(samples: PowerCalibrationSample[], band: PowerBandRange) {
  return samples.filter((sample) => sample.analysisPowerRatio >= band.min && sample.analysisPowerRatio <= band.max);
}

function getMonotonicity(buckets: PowerCalibrationBucketSummary[]) {
  const populated = buckets.filter((bucket) => bucket.encounterCount > 0);
  const violations: PowerCalibrationMonotonicityViolation[] = [];

  for (let index = 1; index < populated.length; index += 1) {
    const previous = populated[index - 1];
    const next = populated[index];
    if (next.winRate + 0.05 < previous.winRate) {
      violations.push({
        metric: "winRate",
        previousBucket: previous.label,
        previousValue: previous.winRate,
        nextBucket: next.label,
        nextValue: next.winRate,
      });
    }
    if (next.averageTurns > previous.averageTurns + 0.75) {
      violations.push({
        metric: "averageTurns",
        previousBucket: previous.label,
        previousValue: previous.averageTurns,
        nextBucket: next.label,
        nextValue: next.averageTurns,
      });
    }
  }

  return {
    winRateNonDecreasing: !violations.some((violation) => violation.metric === "winRate"),
    turnsNonIncreasing: !violations.some((violation) => violation.metric === "averageTurns"),
    violations,
  };
}

function buildKindSummary(
  kind: EncounterBandKind,
  samples: PowerCalibrationSample[],
  bucketRanges: PowerCalibrationBucketRange[],
  targetBand: PowerBandRange
): PowerCalibrationKindSummary {
  const buckets = bucketRanges.map((range) => {
    const matching = samples.filter((sample) => {
      return sample.analysisPowerRatio >= range.min && (range.max === null || range.max === undefined || sample.analysisPowerRatio < range.max);
    });
    const weighted = buildWeightedSummary(matching);
    return {
      ...createEmptyBucketSummary(kind, range),
      encounterCount: matching.length,
      runCount: weighted.runCount,
      averagePowerRatio: weighted.averagePowerRatio,
      winRate: weighted.winRate,
      averageTurns: weighted.averageTurns,
      averageHeroLifePct: weighted.averageHeroLifePct,
      averageMercenaryLifePct: weighted.averageMercenaryLifePct,
      averageEnemyLifePct: weighted.averageEnemyLifePct,
    };
  });

  const weighted = buildWeightedSummary(samples);
  const targetBandSamples = getSamplesForBand(samples, targetBand);
  const targetBandWeighted = buildWeightedSummary(targetBandSamples);

  return {
    kind,
    sampleCount: samples.length,
    runCount: weighted.runCount,
    averagePowerRatio: weighted.averagePowerRatio,
    averageWinRate: weighted.winRate,
    averageTurns: weighted.averageTurns,
    buckets,
    targetBandSummary: {
      kind,
      band: targetBand,
      encounterCount: targetBandSamples.length,
      runCount: targetBandWeighted.runCount,
      averagePowerRatio: targetBandWeighted.averagePowerRatio,
      winRate: targetBandWeighted.winRate,
      averageTurns: targetBandWeighted.averageTurns,
      averageHeroLifePct: targetBandWeighted.averageHeroLifePct,
      averageMercenaryLifePct: targetBandWeighted.averageMercenaryLifePct,
      averageEnemyLifePct: targetBandWeighted.averageEnemyLifePct,
    },
    monotonicity: getMonotonicity(buckets),
  };
}

function runCalibrationSamples(options: PowerCalibrationReportOptions, passIndex: number, totalPasses: number) {
  const source = options.source === "progression" ? "progression" : "synthetic";
  const classIds = options.classIds && options.classIds.length > 0 ? options.classIds : DEFAULT_CLASS_IDS;
  if (source === "progression") {
    const policyIds = options.policyIds && options.policyIds.length > 0 ? options.policyIds : DEFAULT_POLICY_IDS;
    const seedOffsets = options.seedOffsets && options.seedOffsets.length > 0 ? options.seedOffsets : [Number(options.seedOffset || 0)];
    const checkpointProbeProfile = options.checkpointProbeProfile || "default";
    const reports: Array<{ seedOffset: number; report: RunProgressionSimulationReport }> = [];
    const totalUnits = seedOffsets.length * classIds.length * policyIds.length;
    let completedUnits = 0;
    const startedAt = Date.now();
    seedOffsets.forEach((seedOffset) => {
      classIds.forEach((classId) => {
        policyIds.forEach((policyId) => {
          const harness = createQuietAppHarness();
          const classDefinition = harness.classRegistry.getClassDefinition(harness.seedBundle, classId);
          if (!classDefinition) {
            throw new Error(`Unknown class: ${classId}`);
          }
          const policy = getPolicyDefinitions([policyId])[0];
          if (!policy) {
            throw new Error(`Unknown policy: ${policyId}`);
          }
          options.onProgress?.({
            status: "started",
            source,
            passIndex,
            totalPasses,
            completedUnits,
            totalUnits,
            classId,
            scenarioId: "",
            policyId,
            seedOffset,
            encounterSetId: "progression_checkpoints",
            elapsedMs: Date.now() - startedAt,
          });
          const seed = createProgressionSimulationSeed(classId, policy.id, Number(options.throughActNumber || 5), seedOffset);
          const state = createSimulationState(harness, classId, seed);
          const policyReport = runProgressionPolicyFromState(
            harness,
            state,
            classId,
            policy,
            Number(options.throughActNumber || 5),
            Number(options.probeRuns ?? options.runsPerEncounter ?? 3),
            Number(options.maxCombatTurns || 36),
            seedOffset,
            undefined,
            {
              onEncounterStartLite: ({ encounter }) => {
                options.onProgress?.({
                  status: "encounter",
                  source,
                  passIndex,
                  totalPasses,
                  completedUnits,
                  totalUnits,
                  classId,
                  scenarioId: "",
                  policyId,
                  seedOffset,
                  encounterSetId: "progression_checkpoints",
                  elapsedMs: Date.now() - startedAt,
                  detail: `act ${encounter.actNumber} ${encounter.kind} ${encounter.zoneTitle} / ${encounter.encounterName}`,
                });
              },
              onEncounterProgress: ({ encounter, stage, turn, actionIndex, candidateCount, bestScore, stepElapsedMs, encounterElapsedMs, detail }) => {
                if (!options.verboseProgress) {
                  return
                }
                options.onProgress?.({
                  status: "combat",
                  source,
                  passIndex,
                  totalPasses,
                  completedUnits,
                  totalUnits,
                  classId,
                  scenarioId: "",
                  policyId,
                  seedOffset,
                  encounterSetId: "progression_checkpoints",
                  elapsedMs: Date.now() - startedAt,
                  detail: [
                    `act ${encounter.actNumber}`,
                    encounter.zoneTitle,
                    encounter.encounterName,
                    `turn ${turn}`,
                    `action ${actionIndex}`,
                    stage,
                    candidateCount > 0 ? `candidates ${candidateCount}` : "",
                    bestScore !== 0 ? `score ${bestScore}` : "",
                    stepElapsedMs > 0 ? `step ${stepElapsedMs}ms` : "",
                    encounterElapsedMs > 0 ? `combat ${encounterElapsedMs}ms` : "",
                    detail || "",
                  ].filter(Boolean).join(" | "),
                });
              },
              onOperationProgress: ({ stage, operation, actNumber, phase, elapsedMs, detail }) => {
                if (!options.verboseProgress) {
                  return
                }
                options.onProgress?.({
                  status: "operation",
                  source,
                  passIndex,
                  totalPasses,
                  completedUnits,
                  totalUnits,
                  classId,
                  scenarioId: "",
                  policyId,
                  seedOffset,
                  encounterSetId: "progression_checkpoints",
                  elapsedMs: Date.now() - startedAt,
                  detail: [
                    `act ${actNumber}`,
                    phase,
                    operation,
                    stage,
                    elapsedMs > 0 ? `${elapsedMs}ms` : "",
                    detail || "",
                  ].filter(Boolean).join(" | "),
                });
              },
              onCheckpointLite: ({ checkpoint }) => {
                options.onProgress?.({
                  status: "checkpoint",
                  source,
                  passIndex,
                  totalPasses,
                  completedUnits,
                  totalUnits,
                  classId,
                  scenarioId: "",
                  policyId,
                  seedOffset,
                  encounterSetId: "progression_checkpoints",
                  elapsedMs: Date.now() - startedAt,
                  detail: `act ${checkpoint.actNumber} level ${checkpoint.level}`,
                });
              },
            },
            undefined,
            checkpointProbeProfile
          );
          const report: RunProgressionSimulationReport = {
            generatedAt: new Date().toISOString(),
            throughActNumber: Number(options.throughActNumber || 5),
            classReports: [
              {
                classId,
                className: classDefinition.name,
                policyReports: [policyReport],
              },
            ],
          };
          reports.push({ seedOffset, report });
          completedUnits += 1;
          options.onProgress?.({
            status: "completed",
            source,
            passIndex,
            totalPasses,
            completedUnits,
            totalUnits,
            classId,
            scenarioId: "",
            policyId,
            seedOffset,
            encounterSetId: "progression_checkpoints",
            elapsedMs: Date.now() - startedAt,
          });
        });
      });
    });
    return normalizeProgressionSamples(reports);
  }
  const scenarioIds = options.scenarioIds && options.scenarioIds.length > 0 ? options.scenarioIds : DEFAULT_SCENARIO_IDS;
  const encounterSetIds = options.encounterSetIds && options.encounterSetIds.length > 0
    ? options.encounterSetIds
    : DEFAULT_ENCOUNTER_SET_IDS;
  const reports: Array<{ encounterSetId: string; report: BalanceSimulationReport }> = [];
  const totalUnits = encounterSetIds.length * classIds.length * scenarioIds.length;
  let completedUnits = 0;
  const startedAt = Date.now();
  encounterSetIds.forEach((encounterSetId) => {
    classIds.forEach((classId) => {
      scenarioIds.forEach((scenarioId) => {
        options.onProgress?.({
          status: "started",
          source,
          passIndex,
          totalPasses,
          completedUnits,
          totalUnits,
          classId,
          scenarioId,
          policyId: "",
          seedOffset: 0,
          encounterSetId,
          elapsedMs: Date.now() - startedAt,
        });
        const report = runBalanceSimulationReport({
          classIds: [classId],
          scenarioIds: [scenarioId],
          encounterSetId,
          runsPerEncounter: options.runsPerEncounter,
          encounterLimit: options.encounterLimit,
        });
        reports.push({ encounterSetId, report });
        completedUnits += 1;
        options.onProgress?.({
          status: "completed",
          source,
          passIndex,
          totalPasses,
          completedUnits,
          totalUnits,
          classId,
          scenarioId,
          policyId: "",
          seedOffset: 0,
          encounterSetId,
          elapsedMs: Date.now() - startedAt,
        });
      });
    });
  });
  return normalizeSyntheticSamples(reports);
}

export function runPowerCalibrationReport(options: PowerCalibrationReportOptions = {}): PowerCalibrationReport {
  const source = options.source === "progression" ? "progression" : "synthetic";
  const classIds = options.classIds && options.classIds.length > 0 ? options.classIds : DEFAULT_CLASS_IDS;
  const scenarioIds = source === "synthetic" && options.scenarioIds && options.scenarioIds.length > 0
    ? options.scenarioIds
    : source === "synthetic"
      ? DEFAULT_SCENARIO_IDS
      : [];
  const policyIds = source === "progression" && options.policyIds && options.policyIds.length > 0
    ? options.policyIds
    : source === "progression"
      ? DEFAULT_POLICY_IDS
      : [];
  const seedOffsets = source === "progression" && options.seedOffsets && options.seedOffsets.length > 0
    ? options.seedOffsets
    : source === "progression"
      ? [Number(options.seedOffset || 0)]
      : [0];
  const encounterSetIds = source === "synthetic"
    ? options.encounterSetIds && options.encounterSetIds.length > 0
      ? options.encounterSetIds
      : DEFAULT_ENCOUNTER_SET_IDS
    : ["progression_checkpoints"];
  const checkpointProbeProfile = source === "progression" ? options.checkpointProbeProfile || "default" : "default";
  const bucketRanges = options.bucketRanges && options.bucketRanges.length > 0
    ? options.bucketRanges
    : getDefaultPowerCalibrationBuckets();
  const determinismChecks = Math.max(1, Number(options.determinismChecks || 1));
  const targetBands = getDefaultPowerBands();

  const determinismSamples: PowerCalibrationSample[][] = [];
  for (let index = 0; index < determinismChecks; index += 1) {
    determinismSamples.push(runCalibrationSamples(options, index + 1, determinismChecks));
  }

  const digests = determinismSamples.map((samples) => buildSampleDigest(samples));
  const samples = determinismSamples[0] || [];
  const overallWeighted = buildWeightedSummary(samples);

  const kinds = {
    boss: buildKindSummary("boss", samples.filter((sample) => sample.kind === "boss"), bucketRanges, targetBands.boss),
    miniboss: buildKindSummary("miniboss", samples.filter((sample) => sample.kind === "miniboss"), bucketRanges, targetBands.miniboss),
    elite: buildKindSummary("elite", samples.filter((sample) => sample.kind === "elite"), bucketRanges, targetBands.elite),
    battle: buildKindSummary("battle", samples.filter((sample) => sample.kind === "battle"), bucketRanges, targetBands.battle),
  } satisfies Record<EncounterBandKind, PowerCalibrationKindSummary>;

  return {
    generatedAt: new Date().toISOString(),
    source,
    classIds,
    scenarioIds,
    policyIds,
    seedOffsets,
    encounterSetIds,
    checkpointProbeProfile,
    runsPerEncounter: Math.max(1, Number(options.runsPerEncounter || 0) || 3),
    encounterLimit: Math.max(0, Number(options.encounterLimit || 0)),
    throughActNumber: Math.max(1, Number(options.throughActNumber || 5)),
    probeRuns: Math.max(0, Number(options.probeRuns ?? options.runsPerEncounter ?? 3)),
    targetBands,
    bucketRanges,
    determinism: {
      checks: determinismChecks,
      identical: digests.every((digest) => digest === digests[0]),
      digests,
    },
    overall: {
      sampleCount: samples.length,
      runCount: overallWeighted.runCount,
      averagePowerRatio: overallWeighted.averagePowerRatio,
      averageWinRate: overallWeighted.winRate,
      averageTurns: overallWeighted.averageTurns,
    },
    kinds,
    samples,
  };
}
