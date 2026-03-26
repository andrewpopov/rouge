#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "power-curve-report.js");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    policyIds: [],
    throughActNumber: 5,
    probeRuns: 3,
    maxCombatTurns: 36,
    seedOffset: 0,
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
    if (arg === "--seed-offset" && next) {
      parsed.seedOffset = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function printBand(label, band) {
  return `${label} ${band.min.toFixed(2)}-${band.max.toFixed(2)}x`;
}

function printHumanReport(report) {
  console.log(`Power curve report through Act ${report.throughActNumber}`);
  console.log(
    [
      printBand("Boss", report.targetBands.boss),
      printBand("Elite", report.targetBands.elite),
      printBand("Battle", report.targetBands.battle),
    ].join(" | ")
  );

  for (const classReport of report.classReports) {
    console.log(`\n${classReport.className}`);
    for (const policyReport of classReport.policyReports) {
      const counts = policyReport.counts;
      console.log(
        `  ${policyReport.policyLabel}: ${policyReport.outcome}, final act ${policyReport.finalActNumber}, level ${policyReport.finalLevel}, below ${counts.below_target}, on ${counts.on_target}, above ${counts.above_target}`
      );

      for (const checkpoint of policyReport.checkpoints) {
        console.log(`    ${checkpoint.label}: hero power ${checkpoint.heroPowerScore}`);
        checkpoint.probes.forEach((probe) => {
          console.log(
            `      ${probe.kind} ${probe.zoneTitle} / ${probe.encounterName}: ${probe.powerRatio}x, ${probe.status}, target ${probe.targetBand.min.toFixed(2)}-${probe.targetBand.max.toFixed(2)}x, avg turns ${probe.averageTurns}, win ${(probe.winRate * 100).toFixed(1)}%`
          );
        });
      }
    }
  }
}

function main() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled power curve helper. Run `npm run build` or `npm run sim:power-curve`.");
    process.exit(1);
  }

  const { runPowerCurveReport } = require(HELPER_PATH);
  const options = parseArgs(process.argv.slice(2));
  const report = runPowerCurveReport(options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report);
}

main();
