#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "run-progression-simulator.js");

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];

function parseArgs(argv) {
  const parsed = {
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: ["aggressive"],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 2,
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
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function summarizeRuns(results) {
  const summary = [];

  for (const result of results) {
    const classReport = result.report.classReports[0];
    const policyReport = classReport.policyReports[0];
    let entry = summary.find((candidate) => candidate.classId === classReport.classId && candidate.policyId === policyReport.policyId);
    if (!entry) {
      entry = {
        classId: classReport.classId,
        className: classReport.className,
        policyId: policyReport.policyId,
        policyLabel: policyReport.policyLabel,
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
    entry.wins += policyReport.outcome === "run_complete" ? 1 : 0;
    entry.failures += policyReport.outcome === "run_failed" ? 1 : 0;
    entry.reachedAct2 += policyReport.finalActNumber >= 2 ? 1 : 0;
    entry.reachedAct5 += policyReport.finalActNumber >= 5 ? 1 : 0;
    entry.averageFinalAct += policyReport.finalActNumber;
    entry.averageFinalLevel += policyReport.finalLevel;
    entry.outcomes.push({
      seedOffset: result.seedOffset,
      outcome: policyReport.outcome,
      finalActNumber: policyReport.finalActNumber,
      finalLevel: policyReport.finalLevel,
      failure: policyReport.failure,
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

function printProgress(result, totalRuns, completedRuns) {
  const classReport = result.report.classReports[0];
  const policyReport = classReport.policyReports[0];
  const failureLabel = policyReport.failure
    ? ` fail ${policyReport.failure.zoneTitle} / ${policyReport.failure.encounterName}`
    : "";
  console.log(
    `[${completedRuns}/${totalRuns}] ${classReport.className} / ${policyReport.policyLabel} / seed ${result.seedOffset}: ${policyReport.outcome}, act ${policyReport.finalActNumber}, level ${policyReport.finalLevel}${failureLabel}`
  );
}

function printSummary(summary, options) {
  console.log(`\nSequential class sweep through Act ${options.throughActNumber} | ${options.seedCount} seeds`);
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
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled progression simulator helper. Run `npm run build` first.");
    process.exit(1);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { runProgressionSimulationReport } = require(HELPER_PATH);
  const options = parseArgs(process.argv.slice(2));

  const totalRuns = options.classIds.length * options.policyIds.length * options.seedCount;
  let completedRuns = 0;
  const results = [];

  for (const classId of options.classIds) {
    for (const policyId of options.policyIds) {
      for (let seedOffset = 0; seedOffset < options.seedCount; seedOffset += 1) {
        const report = runProgressionSimulationReport({
          classIds: [classId],
          policyIds: [policyId],
          throughActNumber: options.throughActNumber,
          probeRuns: options.probeRuns,
          maxCombatTurns: options.maxCombatTurns,
          seedOffset,
        });
        const result = { classId, policyId, seedOffset, report };
        results.push(result);
        completedRuns += 1;
        if (!options.json) {
          printProgress(result, totalRuns, completedRuns);
        }
      }
    }
  }

  const summary = summarizeRuns(results);

  if (options.json) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      throughActNumber: options.throughActNumber,
      seedCount: options.seedCount,
      summary,
    }, null, 2));
    return;
  }

  printSummary(summary, options);
}

main();
