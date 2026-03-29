#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BALANCE_DIR = path.join(ROOT, "artifacts", "balance");
const ORCHESTRATOR_SCRIPT = path.join(ROOT, "scripts", "run-balance-orchestrator.js");
const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const DEFAULT_POLICY_IDS = ["aggressive", "balanced", "control", "bulwark"];

function parseArgs(argv) {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");

  const parsed = {
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: [...DEFAULT_POLICY_IDS],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 5,
    concurrency: 4,
    output: path.join(BALANCE_DIR, `background-batch-${stamp}.json`),
    log: path.join(BALANCE_DIR, `background-batch-${stamp}.log`),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--class" && next) {
      parsed.classIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--policy" && next) {
      parsed.policyIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--through-act" && next) {
      parsed.throughActNumber = Math.max(1, Math.min(5, Number.parseInt(next, 10) || parsed.throughActNumber));
      index += 1;
      continue;
    }
    if (arg === "--probe-runs" && next) {
      parsed.probeRuns = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(12, Number.parseInt(next, 10) || parsed.maxCombatTurns);
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      parsed.seedCount = Math.max(1, Number.parseInt(next, 10) || parsed.seedCount);
      index += 1;
      continue;
    }
    if (arg === "--concurrency" && next) {
      parsed.concurrency = Math.max(1, Number.parseInt(next, 10) || parsed.concurrency);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--log" && next) {
      parsed.log = path.resolve(ROOT, next);
      index += 1;
    }
  }

  return parsed;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.mkdirSync(path.dirname(options.log), { recursive: true });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-background-batch-"));
  const specPath = path.join(tempDir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify({
    experimentId: "background_batch_report",
    title: "Background Batch Report",
    scenarioType: "campaign",
    classIds: options.classIds,
    policyIds: options.policyIds,
    seedOffsets: Array.from({ length: options.seedCount }, (_, index) => index),
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    concurrency: options.concurrency,
    traceFailures: true,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["background", "batch"],
  }, null, 2));

  const logStream = fs.openSync(options.log, "a");
  const child = spawn(process.execPath, [
    ORCHESTRATOR_SCRIPT,
    "--mode",
    "resume",
    "--spec",
    specPath,
    "--output",
    options.output,
  ], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", logStream, logStream],
  });

  child.unref();

  const jobInfo = {
    startedAt: new Date().toISOString(),
    pid: child.pid,
    cwd: ROOT,
    output: options.output,
    log: options.log,
    specPath,
    classIds: options.classIds,
    policyIds: options.policyIds,
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    seedCount: options.seedCount,
    concurrency: options.concurrency,
    command: `${process.execPath} ${ORCHESTRATOR_SCRIPT} --mode resume --spec ${specPath} --output ${options.output}`,
  };

  const jobPath = path.join(BALANCE_DIR, "latest-background-job.json");
  fs.writeFileSync(jobPath, JSON.stringify(jobInfo, null, 2));
  console.log(JSON.stringify(jobInfo, null, 2));
}

main();
