export {};

import assert from "node:assert/strict";
import { test } from "node:test";

import { runPowerCalibrationReport } from "./helpers/power-calibration-report";

test("power calibration report is deterministic and produces ratio buckets", () => {
  const report = runPowerCalibrationReport({
    classIds: ["barbarian"],
    scenarioIds: ["mainline_conservative"],
    encounterSetIds: ["act5_endgame"],
    runsPerEncounter: 2,
    encounterLimit: 2,
    determinismChecks: 2,
  });

  assert.equal(report.determinism.identical, true);
  assert.equal(report.determinism.checks, 2);
  assert.ok(report.overall.sampleCount > 0);
  assert.ok(report.kinds.boss.sampleCount > 0);
  assert.ok(report.kinds.boss.buckets.some((bucket) => bucket.encounterCount > 0));
  assert.ok(report.kinds.boss.targetBandSummary.runCount >= 0);
  const bossSample = report.samples.find((sample) => sample.kind === "boss");
  assert.ok(bossSample);
  assert.ok((bossSample?.bossAdjustedPowerScore || 0) >= (bossSample?.buildPowerScore || 0));
  assert.ok((bossSample?.analysisPowerRatio || 0) >= (bossSample?.powerRatio || 0));
  assert.ok(report.kinds.battle.sampleCount > 0 || report.kinds.elite.sampleCount > 0);
  assert.ok(
    report.kinds.battle.buckets.some((bucket) => bucket.encounterCount > 0) ||
      report.kinds.elite.buckets.some((bucket) => bucket.encounterCount > 0)
  );
});

test("power calibration report captures elite samples from miniboss encounter sets", () => {
  const report = runPowerCalibrationReport({
    classIds: ["barbarian"],
    scenarioIds: ["mainline_rewarded"],
    encounterSetIds: ["act5_unique_packs"],
    runsPerEncounter: 2,
    encounterLimit: 4,
    determinismChecks: 1,
  });

  assert.ok(report.kinds.elite.sampleCount > 0);
  assert.ok(report.kinds.elite.buckets.some((bucket) => bucket.encounterCount > 0));
});

test("power calibration report supports real progression checkpoint probes", () => {
  const report = runPowerCalibrationReport({
    source: "progression",
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    throughActNumber: 2,
    probeRuns: 1,
    seedOffsets: [0],
    determinismChecks: 2,
  });

  assert.equal(report.source, "progression");
  assert.equal(report.determinism.identical, true);
  assert.ok(report.overall.sampleCount > 0);
  assert.deepEqual(report.policyIds, ["aggressive"]);
  assert.deepEqual(report.seedOffsets, [0]);
  const bossSample = report.samples.find((sample) => sample.source === "progression" && sample.kind === "boss");
  assert.ok(bossSample);
  assert.equal(bossSample?.policyId, "aggressive");
  assert.ok(Number(bossSample?.actNumber || 0) >= 1);
  assert.ok((bossSample?.bossAdjustedPowerScore || 0) >= (bossSample?.buildPowerScore || 0));
  assert.ok((bossSample?.analysisPowerRatio || 0) >= (bossSample?.powerRatio || 0));
});
