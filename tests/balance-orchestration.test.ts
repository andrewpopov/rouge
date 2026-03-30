export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

import {
  type BalanceExperimentSpec,
  buildBalanceArtifact,
  buildBalanceRunTasks,
  createBalanceSnapshotTokenFromState,
  evaluateBalanceBands,
  executeBalanceRunTask,
  getBalanceExperimentCatalog,
  restoreBalanceSnapshotToken,
  runProgressionFromBalanceSnapshotToken,
  traceFromBalanceSnapshotToken,
} from "./helpers/balance-orchestration";
import { createQuietAppHarness, createProgressionSimulationSeed, createSimulationState } from "./helpers/run-progression-simulator";

const ROOT = path.resolve(__dirname, "..", "..");
const ORCHESTRATOR_SCRIPT = path.join(ROOT, "scripts", "run-balance-orchestrator.js");

function createTinyExperimentSpec(): BalanceExperimentSpec {
  return {
    experimentId: "test_tiny_campaign",
    title: "Test Tiny Campaign",
    scenarioType: "campaign" as const,
    classIds: ["barbarian"],
    policyIds: ["aggressive"],
    seedOffsets: [0],
    throughActNumber: 2,
    probeRuns: 0,
    maxCombatTurns: 24,
    concurrency: 1,
    traceFailures: true,
    traceOutliers: true,
    slowRunThresholdMs: 1,
    expectedBands: [],
    tags: ["test"],
  };
}

test("balance catalog exposes standard suites", () => {
  const catalog = getBalanceExperimentCatalog();
  assert.ok(catalog.optimized_campaign);
  assert.ok(catalog.weak_campaign);
  assert.ok(catalog.endgame_balance);
  assert.ok(catalog.committed_archetype_campaign);
  assert.ok(catalog.committed_archetype_boss_probe);
  assert.ok(catalog.nightly_full_matrix);
  assert.ok(catalog.local_smoke);
});

test("committed archetype suites expand one task per named lane", () => {
  const catalog = getBalanceExperimentCatalog();
  const spec: BalanceExperimentSpec = {
    ...catalog.committed_archetype_campaign,
    classIds: ["sorceress"],
    seedOffsets: [0],
    policyIds: ["aggressive"],
    concurrency: 1,
  };
  const tasks = buildBalanceRunTasks(spec);
  assert.equal(tasks.length, 3);
  assert.deepEqual(
    tasks.map((task) => task.targetArchetypeId).sort(),
    ["sorceress_cold", "sorceress_fire", "sorceress_lightning"]
  );
});

test("natural archetype convergence artifacts summarize live lane outcomes", () => {
  const catalog = getBalanceExperimentCatalog();
  const spec: BalanceExperimentSpec = {
    ...catalog.archetype_convergence,
    classIds: ["sorceress"],
    policyIds: ["aggressive"],
    seedOffsets: [0],
    throughActNumber: 1,
    concurrency: 1,
  };
  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);
  const artifact = buildBalanceArtifact(spec, [result.record]);

  assert.ok(artifact.aggregate.archetypes.naturalConvergence.length > 0);
  assert.equal(artifact.aggregate.archetypes.naturalConvergence[0]?.classId, "sorceress");
  assert.equal(artifact.aggregate.archetypes.naturalConvergence[0]?.policyId, "aggressive");
});

test("balance snapshot tokens restore and resume progression", () => {
  const harness = createQuietAppHarness();
  const seed = createProgressionSimulationSeed("barbarian", "aggressive", 1, 0);
  const state = createSimulationState(harness, "barbarian", seed);
  const tokenRef = createBalanceSnapshotTokenFromState(harness, state, {
    captureKind: "start",
    label: "Run start",
    runKey: "token-test",
    policyId: "aggressive",
    throughActNumber: 1,
    probeRuns: 0,
    maxCombatTurns: 24,
    seedOffset: 0,
    simulationContext: {
      policyId: "aggressive",
      throughActNumber: 1,
      probeRuns: 0,
      maxCombatTurns: 24,
      seedOffset: 0,
      progress: {
        actionCounts: {},
        rewardKindCounts: {},
        rewardEffectCounts: {},
        rewardRoleCounts: {},
        strategyRoleCounts: {},
        zoneKindCounts: {},
        zoneRoleCounts: {},
        nodeTypeCounts: {},
        encounterResults: [],
      },
      checkpoints: [],
      failure: null,
      lastEncounterContext: null,
      archetypePlan: {
        targetArchetypeId: "barbarian_combat_skills",
        targetArchetypeLabel: "Combat Pressure",
        targetBand: "flagship",
        commitmentMode: "committed",
        commitAct: 2,
        commitCheckpoint: "first_safe_zone",
        commitmentLocked: false,
        commitmentSatisfied: false,
        committedByCheckpoint: false,
        committedAtCheckpointId: "",
        postCommitCheckpointCount: 0,
        driftCountAfterCommit: 0,
        fallbackDebtCardCount: 0,
        fallbackDebtWeight: 0,
        fallbackWeaponDebt: false,
        exitedFallbackGear: false,
        laneIntegrityByCheckpoint: [],
      },
    },
  });

  const restored = restoreBalanceSnapshotToken(tokenRef.token);
  assert.equal(restored.state.run?.classId, "barbarian");
  assert.equal(restored.envelope.capture.kind, "start");
  assert.equal(restored.envelope.digest, tokenRef.digest);

  const resumed = runProgressionFromBalanceSnapshotToken(tokenRef.token);
  assert.equal(resumed.outcome, "reached_checkpoint");
  assert.equal(resumed.finalActNumber, 1);
  assert.equal(resumed.summary.archetypeCommitment?.targetArchetypeId, "barbarian_combat_skills");
});

test("balance run task captures boss snapshots and trace payloads", () => {
  const spec = createTinyExperimentSpec();
  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);

  assert.equal(result.record.outcome === "run_complete" || result.record.outcome === "run_failed" || result.record.outcome === "reached_checkpoint", true);
  assert.ok(result.record.snapshots.start);
  assert.ok(result.record.snapshots.final);

  const bossSnapshot = Object.values(result.record.snapshots).find((snapshot) => snapshot.kind === "pre_boss");
  assert.ok(bossSnapshot, "expected a pre_boss snapshot for the act boss");

  const trace = traceFromBalanceSnapshotToken(bossSnapshot!.token, spec.maxCombatTurns);
  assert.equal(trace.mode, "combat");
  assert.ok(trace.encounterId);
});

test("balance artifact aggregates metrics and evaluates bands", () => {
  const spec = createTinyExperimentSpec();
  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);
  const artifact = buildBalanceArtifact(
    {
      ...spec,
      expectedBands: [
        { metricId: "overall.act2_rate", label: "Act II reach", min: 0.5, severity: "hard" },
      ],
    },
    [result.record]
  );

  assert.equal(artifact.runs.length, 1);
  assert.ok(artifact.aggregate.coverageRate > 0);
  assert.ok(Array.isArray(artifact.bands));
  assert.equal(artifact.bands[0].status, "pass");

  const missingBand = evaluateBalanceBands(artifact.aggregate, [
    { metricId: "group.amazon.aggressive.win_rate", label: "Missing group", min: 0.5 },
  ]);
  assert.equal(missingBand[0].status, "missing");
});

test("committed lane runs stay separated in aggregate reporting", () => {
  const catalog = getBalanceExperimentCatalog();
  const spec: BalanceExperimentSpec = {
    ...catalog.committed_archetype_campaign,
    classIds: ["sorceress"],
    policyIds: ["aggressive"],
    seedOffsets: [0],
    throughActNumber: 1,
    targetArchetypeId: "sorceress_fire",
    concurrency: 1,
  };
  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);
  const artifact = buildBalanceArtifact(spec, [result.record]);

  assert.equal(artifact.runs[0].targetArchetypeId, "sorceress_fire");
  assert.equal(artifact.aggregate.groups[0]?.targetArchetypeId, "sorceress_fire");
  assert.equal(artifact.aggregate.archetypes.committedLanes[0]?.targetArchetypeId, "sorceress_fire");
});

test("lane-specific metric bands resolve committed archetype values", () => {
  const catalog = getBalanceExperimentCatalog();
  const spec: BalanceExperimentSpec = {
    ...catalog.committed_archetype_campaign,
    classIds: ["sorceress"],
    policyIds: ["aggressive"],
    seedOffsets: [0],
    throughActNumber: 1,
    targetArchetypeId: "sorceress_fire",
    concurrency: 1,
    expectedBands: [
      { metricId: "lane.sorceress.sorceress_fire.clear_rate", label: "Fire clear rate", min: 0, max: 1, severity: "hard" },
      { metricId: "lane.sorceress.sorceress_fire.commit_rate", label: "Fire commit rate", min: 0, max: 1, severity: "hard" },
    ],
  };
  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);
  const artifact = buildBalanceArtifact(spec, [result.record]);

  assert.equal(artifact.bands.length, 2);
  assert.ok(artifact.bands.every((band) => band.status === "pass"));
});

test("combat balance run task produces aggregated combat record", () => {
  const spec: BalanceExperimentSpec = {
    experimentId: "test_endgame_balance",
    title: "Test Endgame Balance",
    scenarioType: "combat_balance",
    classIds: ["barbarian"],
    policyIds: [],
    scenarioIds: ["mainline_conservative"],
    seedOffsets: [0],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    encounterSetId: "act5_bosses",
    runsPerEncounter: 2,
    encounterLimit: 1,
    concurrency: 1,
    traceFailures: false,
    traceOutliers: false,
    slowRunThresholdMs: 1000,
    expectedBands: [
      { metricId: "encounter.boss.average_turns", label: "Boss turns", min: 1, severity: "soft" },
    ],
    tags: ["test", "combat"],
  };

  const task = buildBalanceRunTasks(spec)[0];
  const result = executeBalanceRunTask(spec, task);
  assert.equal(result.record.scenarioType, "combat_balance");
  assert.ok(result.record.combat);
  assert.equal(result.record.policyLabel, "Mainline Conservative");
  assert.ok(result.record.combat?.encounters.length);

  const artifact = buildBalanceArtifact(spec, [result.record]);
  assert.ok(artifact.aggregate.encounterMetricsByKind.boss);
  assert.ok(artifact.aggregate.overall.combatSampleWinRate >= 0);
  assert.equal(artifact.bands[0].status, "pass");
});

test("balance orchestrator run and resume complete without duplicate records", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-balance-orch-"));
  try {
    const specPath = path.join(tempDir, "spec.json");
    const outputPath = path.join(tempDir, "artifact.json");
    const reportPath = path.join(tempDir, "artifact.md");
    const indexPath = path.join(tempDir, "index.json");
    const jobPath = path.join(tempDir, "artifact.job.json");
    const tracesDir = path.join(tempDir, "traces");
    const spec: BalanceExperimentSpec = {
      experimentId: "test_resume_smoke",
      title: "Test Resume Smoke",
      scenarioType: "campaign",
      classIds: ["barbarian"],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1],
      throughActNumber: 1,
      probeRuns: 0,
      maxCombatTurns: 24,
      concurrency: 1,
      traceFailures: true,
      traceOutliers: false,
      slowRunThresholdMs: 1000,
      expectedBands: [],
      tags: ["test", "resume"],
    };
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

    execFileSync(process.execPath, [
      ORCHESTRATOR_SCRIPT,
      "--mode",
      "run",
      "--spec",
      specPath,
      "--output",
      outputPath,
      "--report",
      reportPath,
      "--index",
      indexPath,
      "--job",
      jobPath,
      "--traces-dir",
      tracesDir,
      "--stop-after",
      "1",
    ], { cwd: ROOT, stdio: "pipe" });

    const partial = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert.equal(partial.runs.length, 1);

    execFileSync(process.execPath, [
      ORCHESTRATOR_SCRIPT,
      "--mode",
      "resume",
      "--spec",
      specPath,
      "--output",
      outputPath,
      "--report",
      reportPath,
      "--index",
      indexPath,
      "--job",
      jobPath,
      "--traces-dir",
      tracesDir,
    ], { cwd: ROOT, stdio: "pipe" });

    const finalArtifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert.equal(finalArtifact.runs.length, 2);
    assert.equal(new Set(finalArtifact.runs.map((run: { runKey: string }) => run.runKey)).size, 2);
    assert.ok(fs.existsSync(reportPath));
    assert.ok(fs.existsSync(jobPath));
    assert.ok(fs.existsSync(indexPath));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("balance orchestrator report mode rebuilds artifact and index", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-balance-report-"));
  try {
    const specPath = path.join(tempDir, "spec.json");
    const outputPath = path.join(tempDir, "artifact.json");
    const reportPath = path.join(tempDir, "artifact.md");
    const indexPath = path.join(tempDir, "index.json");
    const jobPath = path.join(tempDir, "artifact.job.json");
    const tracesDir = path.join(tempDir, "traces");
    const spec: BalanceExperimentSpec = {
      experimentId: "test_report_smoke",
      title: "Test Report Smoke",
      scenarioType: "campaign",
      classIds: ["barbarian"],
      policyIds: ["aggressive"],
      seedOffsets: [0],
      throughActNumber: 1,
      probeRuns: 0,
      maxCombatTurns: 24,
      concurrency: 1,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 1000,
      expectedBands: [],
      tags: ["test", "report"],
    };
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

    execFileSync(process.execPath, [
      ORCHESTRATOR_SCRIPT,
      "--mode",
      "run",
      "--spec",
      specPath,
      "--output",
      outputPath,
      "--report",
      reportPath,
      "--index",
      indexPath,
      "--job",
      jobPath,
      "--traces-dir",
      tracesDir,
    ], { cwd: ROOT, stdio: "pipe" });

    execFileSync(process.execPath, [
      ORCHESTRATOR_SCRIPT,
      "--mode",
      "report",
      "--output",
      outputPath,
      "--report",
      reportPath,
      "--index",
      indexPath,
    ], { cwd: ROOT, stdio: "pipe" });

    const rebuiltArtifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const rebuiltIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    const rebuiltReport = fs.readFileSync(reportPath, "utf8");

    assert.equal(rebuiltArtifact.experiment.experimentId, "test_report_smoke");
    assert.ok(Array.isArray(rebuiltIndex));
    assert.equal(rebuiltIndex[0].experimentId, "test_report_smoke");
    assert.ok(rebuiltReport.includes("Test Report Smoke"));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
