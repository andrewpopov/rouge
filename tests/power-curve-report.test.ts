export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runPowerCurveReport } from "./helpers/power-curve-report";

test("power curve report grades checkpoint probes against target bands", () => {
  const report = runPowerCurveReport({
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    throughActNumber: 2,
    probeRuns: 1,
    maxCombatTurns: 24,
  });

  assert.equal(report.classReports.length, 1);
  assert.equal(report.throughActNumber, 2);
  assert.equal(report.targetBands.boss.min, 1.1);
  assert.equal(report.targetBands.miniboss.max, 1.8);
  assert.equal(report.targetBands.elite.max, 2.4);

  const policyReport = report.classReports[0].policyReports[0];
  assert.ok(policyReport.checkpoints.length >= 2);
  const probeCount = policyReport.checkpoints.reduce((sum, checkpoint) => sum + checkpoint.probes.length, 0);
  assert.ok(probeCount > 0);
  assert.equal(
    policyReport.counts.below_target + policyReport.counts.on_target + policyReport.counts.above_target,
    probeCount
  );

  const preBossCheckpoint = policyReport.checkpoints.find((checkpoint) => /Pre-Boss/.test(checkpoint.label));
  const bossProbe = preBossCheckpoint?.probes.find((probe) => probe.kind === "boss");
  const safeZoneMinibossProbe = policyReport.checkpoints
    .flatMap((checkpoint) => checkpoint.probes)
    .find((probe) => probe.kind === "miniboss");
  assert.ok(preBossCheckpoint);
  assert.ok(bossProbe);
  assert.ok(safeZoneMinibossProbe);
  assert.ok((bossProbe?.powerRatio || 0) > 0);
  assert.ok((safeZoneMinibossProbe?.powerRatio || 0) > 0);
  assert.match(bossProbe?.status || "", /^(below_target|on_target|above_target)$/);
  assert.match(safeZoneMinibossProbe?.status || "", /^(below_target|on_target|above_target)$/);
});
