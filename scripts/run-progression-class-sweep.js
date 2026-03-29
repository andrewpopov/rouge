#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const ORCHESTRATOR_SCRIPT = path.join(ROOT, "scripts", "run-balance-orchestrator.js");

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];

function parseArgs(argv) {
  const parsed = {
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: ["aggressive"],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 2,
    output: "",
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
      parsed.output = path.resolve(ROOT, next);
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
        reachedAct2: 0,
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
    entry.reachedAct2 += run.finalActNumber >= 2 ? 1 : 0;
    entry.reachedAct5 += run.finalActNumber >= 5 ? 1 : 0;
    entry.averageFinalAct += run.finalActNumber;
    entry.averageFinalLevel += run.finalLevel;
    entry.outcomes.push({
      seedOffset: run.seedOffset,
      outcome: run.outcome,
      finalActNumber: run.finalActNumber,
      finalLevel: run.finalLevel,
      failure: run.failure || null,
    });
  }

  summary.forEach((entry) => {
    entry.winRate = Number((entry.wins / Math.max(1, entry.runs)).toFixed(3));
    entry.failureRate = Number((entry.failures / Math.max(1, entry.runs)).toFixed(3));
    entry.act2Rate = Number((entry.reachedAct2 / Math.max(1, entry.runs)).toFixed(3));
    entry.act5Rate = Number((entry.reachedAct5 / Math.max(1, entry.runs)).toFixed(3));
    entry.averageFinalAct = Number((entry.averageFinalAct / Math.max(1, entry.runs)).toFixed(2));
    entry.averageFinalLevel = Number((entry.averageFinalLevel / Math.max(1, entry.runs)).toFixed(2));
  });

  return summary.sort((left, right) => left.className.localeCompare(right.className) || left.policyLabel.localeCompare(right.policyLabel));
}

function printSummary(summary, options) {
  console.log(`\nOrchestrated class sweep through Act ${options.throughActNumber} | ${options.seedCount} seeds`);
  for (const entry of summary) {
    console.log(
      `\n${entry.className} / ${entry.policyLabel}: ${(entry.winRate * 100).toFixed(1)}% complete, ${(entry.failureRate * 100).toFixed(1)}% failed, Act 2 ${(entry.act2Rate * 100).toFixed(1)}%, Act 5 ${(entry.act5Rate * 100).toFixed(1)}%, avg final act ${entry.averageFinalAct}, avg level ${entry.averageFinalLevel}`
    );
    entry.outcomes.forEach((outcome) => {
      const failureLabel = outcome.failure ? `, fail ${outcome.failure.zoneTitle} / ${outcome.failure.encounterName}` : "";
      console.log(`  seed ${outcome.seedOffset}: ${outcome.outcome}, act ${outcome.finalActNumber}, level ${outcome.finalLevel}${failureLabel}`);
    });
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-class-sweep-"));

  try {
    const spec = {
      experimentId: "progression_class_sweep",
      title: "Progression Class Sweep",
      scenarioType: "campaign",
      classIds: options.classIds,
      policyIds: options.policyIds,
      seedOffsets: Array.from({ length: options.seedCount }, (_, index) => index),
      throughActNumber: options.throughActNumber,
      probeRuns: options.probeRuns,
      maxCombatTurns: options.maxCombatTurns,
      concurrency: 1,
      traceFailures: false,
      traceOutliers: false,
      slowRunThresholdMs: 60000,
      expectedBands: [],
      tags: ["wrapper", "class-sweep"],
    };

    const specPath = path.join(tempDir, "spec.json");
    const outputPath = options.output || path.join(tempDir, "artifact.json");
    const reportPath = outputPath.replace(/\.json$/i, ".md");
    const indexPath = path.join(tempDir, "index.json");

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
    ], { cwd: ROOT, stdio: "pipe" });

    const artifact = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const summary = summarizeRuns(Array.isArray(artifact.runs) ? artifact.runs : []);

    if (options.json) {
      console.log(JSON.stringify({
        generatedAt: artifact.generatedAt,
        throughActNumber: options.throughActNumber,
        seedCount: options.seedCount,
        artifactPath: outputPath,
        summary,
      }, null, 2));
      return;
    }

    printSummary(summary, options);
    if (options.output) {
      console.log(`\nArtifact: ${outputPath}`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
