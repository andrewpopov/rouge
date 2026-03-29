#!/usr/bin/env node

const path = require("node:path");

const { buildSeedOffsets, roundTo, runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const DEFAULT_POLICY_IDS = ["aggressive", "balanced", "control", "bulwark"];

function parseArgs(argv) {
  const parsed = {
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: [...DEFAULT_POLICY_IDS],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 2,
    stabilityChecks: 0,
    json: false,
    output: "",
    resume: false,
    stopAfter: 0,
    concurrency: 1,
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
    if (arg === "--stability-checks" && next) {
      parsed.stabilityChecks = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--stop-after" && next) {
      parsed.stopAfter = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--resume") {
      parsed.resume = true;
      continue;
    }
    if (arg === "--concurrency" && next) {
      parsed.concurrency = Math.max(1, Number.parseInt(next, 10) || 1);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function buildSpec(options) {
  return {
    experimentId: "batch_report",
    title: "Batch Report",
    scenarioType: "campaign",
    classIds: options.classIds,
    policyIds: options.policyIds,
    seedOffsets: buildSeedOffsets(options.seedCount),
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    concurrency: options.concurrency,
    traceFailures: true,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "batch"],
  };
}

function printHumanSummary(result, options) {
  console.log(
    `Batch report through Act ${options.throughActNumber} | ${options.seedCount} seeds | policies ${options.policyIds.join(", ")}`
  );
  if (options.stabilityChecks > 0) {
    console.log(`Replay stability checks requested: ${options.stabilityChecks} (not yet executed by orchestrator wrapper)`);
  }
  console.log(
    `Overall: win ${(result.artifact.aggregate.overall.winRate * 100).toFixed(1)}%, act2 ${(result.artifact.aggregate.overall.act2Rate * 100).toFixed(1)}%, act5 ${(result.artifact.aggregate.overall.act5Rate * 100).toFixed(1)}%, avg level ${result.artifact.aggregate.overall.averageFinalLevel}`
  );

  result.artifact.aggregate.groups.forEach((group) => {
    console.log(
      `\n${group.className} / ${group.policyLabel}: ${(group.winRate * 100).toFixed(1)}% complete, ${(group.failureRate * 100).toFixed(1)}% failed, Act 2 ${(group.act2Rate * 100).toFixed(1)}%, Act 5 ${(group.act5Rate * 100).toFixed(1)}%, avg final act ${group.averageFinalAct}, avg level ${group.averageFinalLevel}`
    );
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = buildSpec(options);
  const result = runOrchestratorSpec(spec, {
    mode: options.resume ? "resume" : "run",
    output: options.output,
    stopAfter: options.stopAfter,
  });

  const payload = {
    generatedAt: result.artifact.generatedAt,
    artifactPath: options.output || "",
    experiment: result.artifact.experiment,
    overall: result.artifact.aggregate.overall,
    summary: result.artifact.aggregate.groups,
    runs: result.artifact.runs,
    stability: {
      requestedChecks: options.stabilityChecks,
      status: options.stabilityChecks > 0 ? "not_implemented_in_wrapper" : "not_requested",
    },
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printHumanSummary(result, options);
  }

  result.cleanup();
}

main();
