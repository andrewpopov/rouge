export {};

import {
  applyClassStrategy,
  getPolicyDefinitions,
  hashString,
  type PolicySimulationReport,
  type SafeZoneCheckpointSummary,
} from "./run-progression-simulator-core";
import {
  createQuietAppHarness,
  createSimulationState,
  runProgressionPolicyFromState,
} from "./run-progression-simulator";

export type PiecemealSimMode = "full_campaign" | "power_curve";

export interface PowerSnapshot {
  actNumber: number;
  checkpointKind: string;
  level: number;
  powerScore: number;
  bossAdjustedPowerScore: number;
  deckSize: number;
  heroMaxLife: number;
  heroMaxEnergy: number;
  heroDamageBonus: number;
  heroGuardBonus: number;
  mercAttack: number;
  mercMaxLife: number;
  weaponName: string;
  weaponFamily: string;
  favoredTree: string;
  topCards: string[];
}

export interface CampaignSimResult {
  classId: string;
  policyId: string;
  seed: number;
  outcome: string;
  finalActNumber: number;
  finalLevel: number;
  finalPowerScore: number;
  finalDeckSize: number;
  powerCurve: PowerSnapshot[];
  encounterCount: number;
  bossesDefeated: number;
  failureZone: string;
  failureEncounter: string;
  durationMs: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function extractPowerSnapshot(checkpoint: SafeZoneCheckpointSummary): PowerSnapshot {
  return {
    actNumber: checkpoint.actNumber,
    checkpointKind: checkpoint.checkpointKind || "safe_zone",
    level: checkpoint.level,
    powerScore: Math.round(checkpoint.powerScore || 0),
    bossAdjustedPowerScore: Math.round(checkpoint.bossAdjustedPowerScore || 0),
    deckSize: checkpoint.deckSize || 0,
    heroMaxLife: checkpoint.hero?.maxLife || 0,
    heroMaxEnergy: checkpoint.hero?.maxEnergy || 0,
    heroDamageBonus: checkpoint.hero?.damageBonus || 0,
    heroGuardBonus: checkpoint.hero?.guardBonus || 0,
    mercAttack: checkpoint.mercenary?.attack || 0,
    mercMaxLife: checkpoint.mercenary?.maxLife || 0,
    weaponName: String((checkpoint as { equipment?: { weaponName?: string } }).equipment?.weaponName || ""),
    weaponFamily: String((checkpoint as { equipment?: { weaponFamily?: string } }).equipment?.weaponFamily || ""),
    favoredTree: String((checkpoint as { training?: { favoredTreeName?: string } }).training?.favoredTreeName || ""),
    topCards: Array.isArray((checkpoint as { topCards?: string[] }).topCards) ? (checkpoint as { topCards?: string[] }).topCards! : [],
  };
}

export function runCampaignSim(options: {
  classId: string;
  policyId?: string;
  seedOffset?: number;
  throughActNumber?: number;
  maxCombatTurns?: number;
}): CampaignSimResult {
  const startedAt = Date.now();
  const classId = options.classId;
  const throughActNumber = clamp(options.throughActNumber || 5, 1, 5);
  const maxCombatTurns = Math.max(12, options.maxCombatTurns || 36);
  const seedOffset = Math.max(0, options.seedOffset || 0);
  const basePolicy = getPolicyDefinitions([options.policyId || "aggressive"])[0];
  const policy = applyClassStrategy(basePolicy, classId);
  const seed = hashString([classId, policy.id, String(throughActNumber), String(seedOffset)].join("|"));

  const harness = createQuietAppHarness();
  const state = createSimulationState(harness, classId, seed);

  const report = runProgressionPolicyFromState(
    harness,
    state,
    classId,
    policy,
    throughActNumber,
    0,
    maxCombatTurns,
    seedOffset
  );

  const powerCurve = (report.checkpoints || []).map(extractPowerSnapshot);
  const encounterResults = report.summary?.encounterResults || [];

  return {
    classId,
    policyId: policy.id,
    seed,
    outcome: report.outcome,
    finalActNumber: report.finalActNumber,
    finalLevel: report.finalLevel,
    finalPowerScore: powerCurve.length > 0 ? powerCurve[powerCurve.length - 1].powerScore : 0,
    finalDeckSize: report.summary?.finalBuild?.deckSize || 0,
    powerCurve,
    encounterCount: encounterResults.length,
    bossesDefeated: encounterResults.filter((e: { kind?: string; outcome?: string }) => e.kind === "boss" && e.outcome === "victory").length,
    failureZone: report.failure?.zoneTitle || "",
    failureEncounter: report.failure?.encounterName || "",
    durationMs: Date.now() - startedAt,
  };
}

export function runRewardDistributionSim(
  classId: string,
  seedCount: number,
  policyId = "aggressive"
): {
  classId: string;
  runs: number;
  cleared: number;
  clearRate: number;
  avgFinalPower: number;
  minFinalPower: number;
  maxFinalPower: number;
  avgDeckSize: number;
  avgLevel: number;
  powerByAct: Record<number, { avg: number; min: number; max: number; count: number }>;
  failureActs: Record<number, number>;
} {
  const results: CampaignSimResult[] = [];
  for (let i = 0; i < seedCount; i += 1) {
    results.push(runCampaignSim({ classId, policyId, seedOffset: i }));
  }

  const cleared = results.filter((r) => r.outcome === "run_complete").length;
  const powers = results.map((r) => r.finalPowerScore);
  const powerByAct: Record<number, { avg: number; min: number; max: number; count: number }> = {};
  const failureActs: Record<number, number> = {};

  for (const result of results) {
    if (result.outcome === "run_failed") {
      failureActs[result.finalActNumber] = (failureActs[result.finalActNumber] || 0) + 1;
    }
    for (const snapshot of result.powerCurve) {
      const act = snapshot.actNumber;
      if (!powerByAct[act]) {
        powerByAct[act] = { avg: 0, min: Infinity, max: -Infinity, count: 0 };
      }
      powerByAct[act].count += 1;
      powerByAct[act].avg += snapshot.powerScore;
      powerByAct[act].min = Math.min(powerByAct[act].min, snapshot.powerScore);
      powerByAct[act].max = Math.max(powerByAct[act].max, snapshot.powerScore);
    }
  }

  for (const entry of Object.values(powerByAct)) {
    entry.avg = Math.round(entry.avg / Math.max(1, entry.count));
  }

  return {
    classId,
    runs: results.length,
    cleared,
    clearRate: cleared / Math.max(1, results.length),
    avgFinalPower: Math.round(powers.reduce((s, p) => s + p, 0) / Math.max(1, powers.length)),
    minFinalPower: Math.min(...(powers.length > 0 ? powers : [0])),
    maxFinalPower: Math.max(...(powers.length > 0 ? powers : [0])),
    avgDeckSize: Math.round(results.reduce((s, r) => s + r.finalDeckSize, 0) / Math.max(1, results.length)),
    avgLevel: Math.round(results.reduce((s, r) => s + r.finalLevel, 0) / Math.max(1, results.length)),
    powerByAct,
    failureActs,
  };
}
