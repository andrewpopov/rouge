#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "run-progression-simulator.js");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    policyIds: [],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    seedCount: 8,
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

function summarizeSeedRuns(reportBySeed) {
  const summary = [];

  for (const seedRun of reportBySeed) {
    for (const classReport of seedRun.report.classReports) {
      for (const policyReport of classReport.policyReports) {
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
        entry.reachedAct5 += policyReport.finalActNumber >= 5 ? 1 : 0;
        entry.averageFinalAct += policyReport.finalActNumber;
        entry.averageFinalLevel += policyReport.finalLevel;
        entry.outcomes.push({
          seedOffset: seedRun.seedOffset,
          outcome: policyReport.outcome,
          finalActNumber: policyReport.finalActNumber,
          finalLevel: policyReport.finalLevel,
          failure: policyReport.failure,
        });
      }
    }
  }

  summary.forEach((entry) => {
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
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled progression simulator helper. Run `npm run build` or `npm run sim:progression-sweep`.");
    process.exit(1);
  }

  const { runProgressionSimulationReport } = require(HELPER_PATH);
  const options = parseArgs(process.argv.slice(2));
  const reportBySeed = Array.from({ length: options.seedCount }, (_, seedOffset) => ({
    seedOffset,
    report: runProgressionSimulationReport({
      classIds: options.classIds,
      policyIds: options.policyIds,
      throughActNumber: options.throughActNumber,
      probeRuns: options.probeRuns,
      maxCombatTurns: options.maxCombatTurns,
      seedOffset,
    }),
  }));
  const summary = summarizeSeedRuns(reportBySeed);

  if (options.json) {
    console.log(JSON.stringify({ seedCount: options.seedCount, throughActNumber: options.throughActNumber, summary }, null, 2));
    return;
  }

  printHumanReport(summary, options.seedCount, options.throughActNumber);
}

main();
