#!/usr/bin/env node

const path = require("node:path");

const { runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    policyIds: [],
    throughActNumber: 5,
    probeRuns: 3,
    maxCombatTurns: 36,
    seedOffset: 0,
    output: "",
    resume: false,
    stopAfter: 0,
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
    if (arg === "--stop-after" && next) {
      parsed.stopAfter = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--resume") {
      parsed.resume = true;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function formatPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function sortRuns(runs) {
  return [...runs].sort(
    (left, right) =>
      left.className.localeCompare(right.className) ||
      left.policyLabel.localeCompare(right.policyLabel) ||
      left.seedOffset - right.seedOffset
  );
}

function buildReport(artifact, throughActNumber) {
  const classMap = new Map();
  for (const run of sortRuns(artifact.runs)) {
    if (!classMap.has(run.classId)) {
      classMap.set(run.classId, {
        classId: run.classId,
        className: run.className,
        policyReports: [],
      });
    }
    classMap.get(run.classId).policyReports.push({
      policyId: run.policyId,
      policyLabel: run.policyLabel,
      outcome: run.outcome,
      finalActNumber: run.finalActNumber,
      finalLevel: run.finalLevel,
      failure: run.failure,
      checkpoints: run.checkpoints || [],
    });
  }

  return {
    generatedAt: artifact.generatedAt,
    throughActNumber,
    classReports: [...classMap.values()],
    artifactPath: "",
  };
}

function printHumanReport(report) {
  console.log(`Run progression simulation through Act ${report.throughActNumber}`);
  for (const classReport of report.classReports) {
    console.log(`\n${classReport.className}`);
    for (const policyReport of classReport.policyReports) {
      console.log(
        `  ${policyReport.policyLabel}: ${policyReport.outcome}, final act ${policyReport.finalActNumber}, level ${policyReport.finalLevel}`
      );
      for (const checkpoint of policyReport.checkpoints) {
        const weaponLabel = checkpoint.weapon ? `${checkpoint.weapon.name} (${checkpoint.weapon.rarity})` : "Unarmed";
        console.log(
          `    ${checkpoint.label}: Lv ${checkpoint.level}, power ${checkpoint.powerScore}, hero ${checkpoint.hero.maxLife} Life / ${checkpoint.hero.maxEnergy} Energy / ${checkpoint.hero.handSize} Hand / +${checkpoint.hero.damageBonus} dmg / +${checkpoint.hero.guardBonus} guard, weapon ${weaponLabel}`
        );
        if ((checkpoint.activeRunewords || []).length > 0 || Number(checkpoint.runewordsForged || 0) > 0) {
          console.log(
            `      Runewords: forged ${checkpoint.runewordsForged}${(checkpoint.activeRunewords || []).length > 0 ? `, active ${checkpoint.activeRunewords.join(", ")}` : ""}`
          );
        }
        (checkpoint.probes || []).forEach((probe) => {
          console.log(
            `      ${probe.kind} ${probe.zoneTitle} / ${probe.encounterName}: ${formatPct(probe.winRate)} win, avg turns ${probe.averageTurns}, hero ${probe.averageHeroLifePct}%, enemy power ${probe.enemyPowerScore}, ratio ${probe.powerRatio}x`
          );
        });
      }
      if (policyReport.failure) {
        console.log(
          `    Failure: Act ${policyReport.failure.actNumber} ${policyReport.failure.zoneTitle} / ${policyReport.failure.encounterName}`
        );
      }
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = {
    experimentId: "progression_sim",
    title: "Progression Simulation",
    scenarioType: options.probeRuns > 0 ? "checkpoint_probe" : "campaign",
    classIds: options.classIds,
    policyIds: options.policyIds,
    seedOffsets: [options.seedOffset],
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    concurrency: 1,
    traceFailures: true,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "progression"],
  };

  const result = runOrchestratorSpec(spec, {
    mode: options.resume ? "resume" : "run",
    output: options.output,
    stopAfter: options.stopAfter,
  });
  const report = buildReport(result.artifact, options.throughActNumber);
  report.artifactPath = options.output || "";

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  result.cleanup();
}

main();
