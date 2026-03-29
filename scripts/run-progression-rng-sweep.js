#!/usr/bin/env node

const path = require("node:path");

const { buildSeedOffsets, runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    policyIds: [],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 8,
    output: "",
    resume: false,
    stopAfter: 0,
    concurrency: 1,
    json: false,
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

function summarizeRuns(runs) {
  const summary = [];

  for (const run of runs) {
    let entry = summary.find((candidate) => candidate.classId === run.classId && candidate.policyId === run.policyId);
    if (!entry) {
      entry = {
        classId: run.classId,
        className: run.className,
        policyId: run.policyId,
        policyLabel: run.policyLabel,
        runs: 0,
        wins: 0,
        failures: 0,
        reachedAct5: 0,
        averageFinalAct: 0,
        averageFinalLevel: 0,
        outcomes: [],
      };
      summary.push(entry);
    }

    entry.runs += 1;
    entry.wins += run.outcome === "run_complete" ? 1 : 0;
    entry.failures += run.outcome === "run_failed" ? 1 : 0;
    entry.reachedAct5 += run.finalActNumber >= 5 ? 1 : 0;
    entry.averageFinalAct += Number(run.finalActNumber || 0);
    entry.averageFinalLevel += Number(run.finalLevel || 0);
    entry.outcomes.push({
      seedOffset: run.seedOffset,
      outcome: run.outcome,
      finalActNumber: run.finalActNumber,
      finalLevel: run.finalLevel,
      failure: run.failure,
    });
  }

  summary.forEach((entry) => {
    entry.outcomes.sort((left, right) => left.seedOffset - right.seedOffset);
    entry.winRate = Number((entry.wins / Math.max(1, entry.runs)).toFixed(3));
    entry.failureRate = Number((entry.failures / Math.max(1, entry.runs)).toFixed(3));
    entry.averageFinalAct = Number((entry.averageFinalAct / Math.max(1, entry.runs)).toFixed(2));
    entry.averageFinalLevel = Number((entry.averageFinalLevel / Math.max(1, entry.runs)).toFixed(2));
  });

  return summary.sort((left, right) => left.className.localeCompare(right.className) || left.policyLabel.localeCompare(right.policyLabel));
}

function printHumanReport(summary, seedCount, throughActNumber) {
  console.log(`Progression RNG sweep through Act ${throughActNumber} | ${seedCount} seeds`);
  for (const entry of summary) {
    console.log(
      `\n${entry.className} / ${entry.policyLabel}: ${(entry.winRate * 100).toFixed(1)}% complete, ${(entry.failureRate * 100).toFixed(1)}% failed, avg final act ${entry.averageFinalAct}, avg level ${entry.averageFinalLevel}`
    );
    entry.outcomes.forEach((outcome) => {
      const failureLabel = outcome.failure ? `, fail ${outcome.failure.zoneTitle} / ${outcome.failure.encounterName}` : "";
      console.log(
        `  seed ${outcome.seedOffset}: ${outcome.outcome}, act ${outcome.finalActNumber}, level ${outcome.finalLevel}${failureLabel}`
      );
    });
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = {
    experimentId: "progression_rng_sweep",
    title: "Progression RNG Sweep",
    scenarioType: options.probeRuns > 0 ? "checkpoint_probe" : "campaign",
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
    tags: ["wrapper", "rng-sweep"],
  };

  const result = runOrchestratorSpec(spec, {
    mode: options.resume ? "resume" : "run",
    output: options.output,
    stopAfter: options.stopAfter,
  });
  const summary = summarizeRuns(result.artifact.runs);
  const payload = {
    generatedAt: result.artifact.generatedAt,
    artifactPath: options.output || "",
    seedCount: options.seedCount,
    throughActNumber: options.throughActNumber,
    summary,
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printHumanReport(summary, options.seedCount, options.throughActNumber);
  }

  result.cleanup();
}

main();
