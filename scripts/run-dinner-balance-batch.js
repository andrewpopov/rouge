#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BALANCE_DIR = path.join(ROOT, "artifacts", "balance");
const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

function timestampForFile(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendLog(filePath, line) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

function buildSeedOffsets(count) {
  return Array.from({ length: count }, (_, index) => index);
}

function buildCampaignSpec({ experimentId, title, policyIds, seedCount, concurrency }) {
  return {
    experimentId,
    title,
    scenarioType: "campaign",
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: [...policyIds],
    seedOffsets: buildSeedOffsets(seedCount),
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    concurrency,
    traceFailures: false,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["dinner-batch", "campaign"],
  };
}

function createScenarios(batchDir) {
  return [
    {
      id: "progression_pressure_calibration",
      title: "Progression Pressure Calibration",
      description: "5-seed progression checkpoint calibration with pressure probes across all classes on aggressive and balanced.",
      expectedMinutes: 90,
      buildCommand() {
        const output = path.join(batchDir, "progression-pressure-calibration.json");
        return {
          cwd: ROOT,
          output,
          report: output.replace(/\.json$/i, ".md"),
          command: process.execPath,
          args: [
            path.join(ROOT, "scripts", "run-power-calibration-report.js"),
            "--source", "progression",
            "--class", DEFAULT_CLASS_IDS.join(","),
            "--policy", "aggressive,balanced",
            "--through-act", "5",
            "--probe-runs", "1",
            "--seed-offsets", "0,1,2,3,4",
            "--determinism-checks", "1",
            "--probe-profile", "pressure",
            "--output", output,
            "--progress-log", output.replace(/\.json$/i, ".progress.log"),
            "--status-file", output.replace(/\.json$/i, ".status.json"),
          ],
        };
      },
    },
    {
      id: "campaign_aggressive_matrix",
      title: "Campaign Aggressive Matrix",
      description: "8-seed aggressive full-campaign parity run across all classes.",
      expectedMinutes: 70,
      buildCommand() {
        const output = path.join(batchDir, "campaign-aggressive-matrix.json");
        const report = output.replace(/\.json$/i, ".md");
        const job = output.replace(/\.json$/i, ".job.json");
        const tracesDir = output.replace(/\.json$/i, "-traces");
        const specPath = path.join(batchDir, "campaign-aggressive-matrix.spec.json");
        writeJson(specPath, buildCampaignSpec({
          experimentId: "dinner_campaign_aggressive_matrix",
          title: "Dinner Campaign Aggressive Matrix",
          policyIds: ["aggressive"],
          seedCount: 8,
          concurrency: 4,
        }));
        return {
          cwd: ROOT,
          output,
          report,
          command: process.execPath,
          args: [
            path.join(ROOT, "scripts", "run-balance-orchestrator.js"),
            "--mode", "run",
            "--spec", specPath,
            "--output", output,
            "--report", report,
            "--job", job,
            "--traces-dir", tracesDir,
          ],
        };
      },
    },
    {
      id: "campaign_balanced_matrix",
      title: "Campaign Balanced Matrix",
      description: "5-seed balanced full-campaign sanity run across all classes.",
      expectedMinutes: 50,
      buildCommand() {
        const output = path.join(batchDir, "campaign-balanced-matrix.json");
        const report = output.replace(/\.json$/i, ".md");
        const job = output.replace(/\.json$/i, ".job.json");
        const tracesDir = output.replace(/\.json$/i, "-traces");
        const specPath = path.join(batchDir, "campaign-balanced-matrix.spec.json");
        writeJson(specPath, buildCampaignSpec({
          experimentId: "dinner_campaign_balanced_matrix",
          title: "Dinner Campaign Balanced Matrix",
          policyIds: ["balanced"],
          seedCount: 5,
          concurrency: 4,
        }));
        return {
          cwd: ROOT,
          output,
          report,
          command: process.execPath,
          args: [
            path.join(ROOT, "scripts", "run-balance-orchestrator.js"),
            "--mode", "run",
            "--spec", specPath,
            "--output", output,
            "--report", report,
            "--job", job,
            "--traces-dir", tracesDir,
          ],
        };
      },
    },
  ];
}

function main() {
  const startedAt = new Date();
  const batchId = `dinner-balance-batch-${timestampForFile(startedAt)}`;
  const batchDir = path.join(BALANCE_DIR, batchId);
  const logPath = path.join(batchDir, "batch.log");
  const statusPath = path.join(batchDir, "batch.status.json");
  const manifestPath = path.join(batchDir, "batch.manifest.json");
  const latestPath = path.join(BALANCE_DIR, "latest-dinner-balance-batch.json");
  const scenarios = createScenarios(batchDir);

  function writeStatus(partial = {}) {
    writeJson(statusPath, {
      batchId,
      startedAt: startedAt.toISOString(),
      updatedAt: new Date().toISOString(),
      timeBudgetMs: THREE_HOURS_MS,
      elapsedMs: Date.now() - startedAt.getTime(),
      batchDir,
      logPath,
      manifestPath,
      scenarios,
      ...partial,
    });
  }

  writeJson(manifestPath, {
    batchId,
    createdAt: startedAt.toISOString(),
    timeBudgetMs: THREE_HOURS_MS,
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      expectedMinutes: scenario.expectedMinutes,
    })),
  });
  writeJson(latestPath, { batchId, batchDir, statusPath, logPath, manifestPath });
  writeStatus({
    state: "running",
    currentScenarioId: "",
    completedScenarioIds: [],
    skippedScenarioIds: [],
    failedScenarioIds: [],
  });
  appendLog(logPath, `[${new Date().toISOString()}] dinner batch start ${batchId}`);

  const completedScenarioIds = [];
  const skippedScenarioIds = [];
  const failedScenarioIds = [];

  for (const scenario of scenarios) {
    const elapsedMs = Date.now() - startedAt.getTime();
    const timeLeftMs = THREE_HOURS_MS - elapsedMs;
    if (timeLeftMs <= Math.max(5 * 60 * 1000, scenario.expectedMinutes * 60 * 1000 * 0.5)) {
      skippedScenarioIds.push(scenario.id);
      appendLog(logPath, `[${new Date().toISOString()}] skip ${scenario.id} time_left_ms=${timeLeftMs}`);
      writeStatus({
        state: "running",
        currentScenarioId: "",
        completedScenarioIds,
        skippedScenarioIds,
        failedScenarioIds,
        message: `skipped ${scenario.id} due to time budget`,
      });
      continue;
    }

    const commandSpec = scenario.buildCommand();
    appendLog(
      logPath,
      `[${new Date().toISOString()}] start ${scenario.id} -> ${commandSpec.command} ${commandSpec.args.join(" ")}`
    );
    writeStatus({
      state: "running",
      currentScenarioId: scenario.id,
      completedScenarioIds,
      skippedScenarioIds,
      failedScenarioIds,
      message: `running ${scenario.id}`,
      currentOutput: commandSpec.output,
      currentReport: commandSpec.report || "",
    });

    const logHandle = fs.openSync(logPath, "a");
    const result = spawnSync(commandSpec.command, commandSpec.args, {
      cwd: commandSpec.cwd,
      stdio: ["ignore", logHandle, logHandle],
    });
    fs.closeSync(logHandle);

    if (result.status === 0) {
      completedScenarioIds.push(scenario.id);
      appendLog(logPath, `[${new Date().toISOString()}] completed ${scenario.id}`);
    } else {
      failedScenarioIds.push(scenario.id);
      appendLog(
        logPath,
        `[${new Date().toISOString()}] failed ${scenario.id} exit=${result.status ?? "signal"}`
      );
    }

    writeStatus({
      state: "running",
      currentScenarioId: "",
      completedScenarioIds,
      skippedScenarioIds,
      failedScenarioIds,
      message: result.status === 0 ? `completed ${scenario.id}` : `failed ${scenario.id}`,
    });
  }

  appendLog(logPath, `[${new Date().toISOString()}] dinner batch complete ${batchId}`);
  writeStatus({
    state: "completed",
    finished: true,
    currentScenarioId: "",
    completedScenarioIds,
    skippedScenarioIds,
    failedScenarioIds,
    message: "dinner batch completed",
  });
}

main();
