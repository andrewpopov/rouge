#!/usr/bin/env node

const path = require("node:path");

const { roundTo, runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

const TARGET_BANDS = {
  boss: { min: 1.1, max: 1.4 },
  elite: { min: 1.4, max: 1.8 },
  battle: { min: 2.0, max: 3.0 },
};

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    policyIds: [],
    throughActNumber: 5,
    probeRuns: 3,
    maxCombatTurns: 36,
    seedOffset: 0,
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
    if (arg === "--seed-offset" && next) {
      parsed.seedOffset = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function getBandStatus(ratio, band) {
  if (ratio < band.min) {
    return "below_target";
  }
  if (ratio > band.max) {
    return "above_target";
  }
  return "on_target";
}

function buildReport(artifact, throughActNumber) {
  const byClass = new Map();

  artifact.runs.forEach((run) => {
    if (!byClass.has(run.classId)) {
      byClass.set(run.classId, {
        classId: run.classId,
        className: run.className,
        policyReports: [],
      });
    }
    const counts = { below_target: 0, on_target: 0, above_target: 0 };
    const checkpoints = (run.checkpoints || []).map((checkpoint) => {
      const probes = (checkpoint.probes || []).map((probe) => {
        const targetBand = TARGET_BANDS[probe.kind];
        const status = getBandStatus(Number(probe.powerRatio || 0), targetBand);
        counts[status] += 1;
        return {
          kind: probe.kind,
          encounterName: probe.encounterName,
          zoneTitle: probe.zoneTitle,
          enemyPowerScore: probe.enemyPowerScore,
          powerDelta: probe.powerDelta,
          powerRatio: probe.powerRatio,
          averageTurns: probe.averageTurns,
          winRate: probe.winRate,
          targetBand,
          status,
        };
      });
      return {
        actNumber: checkpoint.actNumber,
        label: checkpoint.label,
        heroPowerScore: checkpoint.powerScore,
        probes,
      };
    });

    byClass.get(run.classId).policyReports.push({
      policyId: run.policyId,
      policyLabel: run.policyLabel,
      outcome: run.outcome,
      finalActNumber: run.finalActNumber,
      finalLevel: run.finalLevel,
      checkpoints,
      counts,
    });
  });

  return {
    generatedAt: artifact.generatedAt,
    targetBands: TARGET_BANDS,
    throughActNumber,
    classReports: [...byClass.values()].sort((left, right) => left.className.localeCompare(right.className)),
  };
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

  report.classReports.forEach((classReport) => {
    console.log(`\n${classReport.className}`);
    classReport.policyReports.forEach((policyReport) => {
      const counts = policyReport.counts;
      console.log(
        `  ${policyReport.policyLabel}: ${policyReport.outcome}, final act ${policyReport.finalActNumber}, level ${policyReport.finalLevel}, below ${counts.below_target}, on ${counts.on_target}, above ${counts.above_target}`
      );
      policyReport.checkpoints.forEach((checkpoint) => {
        console.log(`    ${checkpoint.label}: hero power ${roundTo(checkpoint.heroPowerScore)}`);
        checkpoint.probes.forEach((probe) => {
          console.log(
            `      ${probe.kind} ${probe.zoneTitle} / ${probe.encounterName}: ${probe.powerRatio}x, ${probe.status}, target ${probe.targetBand.min.toFixed(2)}-${probe.targetBand.max.toFixed(2)}x, avg turns ${probe.averageTurns}, win ${(probe.winRate * 100).toFixed(1)}%`
          );
        });
      });
    });
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = {
    experimentId: "power_curve_report",
    title: "Power Curve Report",
    scenarioType: "checkpoint_probe",
    classIds: options.classIds,
    policyIds: options.policyIds,
    seedOffsets: [options.seedOffset],
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    concurrency: 1,
    traceFailures: false,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "power-curve"],
  };

  const result = runOrchestratorSpec(spec, { output: options.output });
  const report = buildReport(result.artifact, options.throughActNumber);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  result.cleanup();
}

main();
