export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runProgressionSimulationReport } from "./helpers/run-progression-simulator";

test("run progression simulator produces checkpoint data for an early act", () => {
  const report = runProgressionSimulationReport({
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    throughActNumber: 2,
    probeRuns: 1,
    maxCombatTurns: 24,
  });

  assert.equal(report.classReports.length, 1);
  const classReport = report.classReports[0];
  assert.equal(classReport.classId, "barbarian");
  assert.equal(classReport.policyReports.length, 1);

  const policyReport = classReport.policyReports[0];
  assert.ok(policyReport.checkpoints.length >= 2);
  assert.equal(policyReport.checkpoints[0].actNumber, 1);
  const act1SafeZone = policyReport.checkpoints.find((checkpoint) => checkpoint.checkpointId === "act_1_safe_zone");
  const act1PreBoss = policyReport.checkpoints.find((checkpoint) => checkpoint.checkpointId === "act_1_pre_boss");
  const act2SafeZone = policyReport.checkpoints.find((checkpoint) => checkpoint.checkpointId === "act_2_safe_zone");
  assert.ok(act1SafeZone);
  assert.ok(act1PreBoss);
  assert.ok(act2SafeZone);
  assert.equal(act1SafeZone?.checkpointKind, "safe_zone");
  assert.equal(act1PreBoss?.checkpointKind, "pre_boss");
  assert.ok((act1SafeZone?.probes.length || 0) > 0);
  assert.equal(Boolean(act1SafeZone?.probes.find((probe) => probe.kind === "boss")), false);
  assert.ok(policyReport.finalLevel >= 1);
  assert.ok((act2SafeZone?.powerScore || 0) > 0);
  assert.ok((act2SafeZone?.powerBreakdown.deck || 0) > 0);
  assert.ok((act2SafeZone?.deckSize || 0) <= 24);
  assert.ok(policyReport.summary.runSummary.encountersCleared >= 0);
  assert.ok(policyReport.summary.world.questOutcomes >= 0);
  assert.ok(policyReport.summary.finalBuild.hero.handSize >= 5);
  assert.ok(policyReport.summary.finalBuild.deckProficiencies.length > 0);
  const act1BossProbe = act1PreBoss?.probes.find((probe) => probe.kind === "boss");
  assert.ok(act1BossProbe);
  assert.ok((act1BossProbe?.enemyPowerScore || 0) > 0);
  assert.ok((act1BossProbe?.powerRatio || 0) > 0);
  assert.ok((act1BossProbe?.averageTurns || 0) >= 1);
});

test("run progression simulator can skip checkpoint probes for fast rng sweeps", () => {
  const report = runProgressionSimulationReport({
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    throughActNumber: 1,
    probeRuns: 0,
    maxCombatTurns: 24,
    seedOffset: 2,
  });

  assert.equal(report.classReports.length, 1);
  const policyReport = report.classReports[0].policyReports[0];
  assert.ok(policyReport.checkpoints.length >= 1);
  assert.equal(policyReport.checkpoints[0].probes.length, 0);
  assert.ok(typeof policyReport.summary.rewardKindCounts === "object");
  assert.ok(typeof policyReport.summary.choiceKindCounts === "object");
});

test("run progression simulator is deterministic for the same seed", () => {
  const options = {
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    throughActNumber: 2,
    probeRuns: 0,
    maxCombatTurns: 24,
    seedOffset: 3,
  };

  const firstReport = runProgressionSimulationReport(options);
  const secondReport = runProgressionSimulationReport(options);
  const firstSnapshot = JSON.stringify({
    throughActNumber: firstReport.throughActNumber,
    classReports: firstReport.classReports,
  });
  const secondSnapshot = JSON.stringify({
    throughActNumber: secondReport.throughActNumber,
    classReports: secondReport.classReports,
  });

  if (firstSnapshot !== secondSnapshot) {
    throw new Error("Progression simulator report drifted for the same seed.");
  }
});
