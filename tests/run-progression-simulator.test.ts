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
  assert.equal(policyReport.checkpoints[1].actNumber, 2);
  assert.ok(policyReport.checkpoints[0].probes.length > 0);
  assert.ok(policyReport.finalLevel >= 1);
  assert.ok(policyReport.checkpoints[1].powerScore > 0);
  assert.ok(policyReport.checkpoints[1].powerBreakdown.deck > 0);
  assert.ok(policyReport.checkpoints[1].deckSize <= 24);
  const act2BossProbe = policyReport.checkpoints[1].probes.find((probe) => probe.kind === "boss");
  assert.ok(act2BossProbe);
  assert.ok((act2BossProbe?.enemyPowerScore || 0) > 0);
  assert.ok((act2BossProbe?.powerRatio || 0) > 0);
  assert.ok((act2BossProbe?.averageTurns || 0) >= 1);
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
});
