#!/usr/bin/env node

const path = require("node:path");

const { runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    scenarioIds: [],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 16,
    encounterLimit: 0,
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
    if (arg === "--scenario" && next) {
      parsed.scenarioIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--set" && next) {
      parsed.encounterSetId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--runs" && next) {
      parsed.runsPerEncounter = Math.max(1, Number.parseInt(next, 10) || parsed.runsPerEncounter);
      index += 1;
      continue;
    }
    if (arg === "--limit" && next) {
      parsed.encounterLimit = Math.max(0, Number.parseInt(next, 10) || 0);
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

function printHumanReport(report) {
  console.log(`${report.encounterSetLabel} | ${report.runsPerEncounter} runs per encounter`);
  for (const classReport of report.classReports) {
    console.log(`\n${classReport.className}`);
    for (const scenario of classReport.scenarios) {
      const build = scenario.build;
      const weaponLabel = build.weapon ? `${build.weapon.name} (${build.weapon.rarity})` : "Unarmed";
      console.log(`  ${scenario.label}`);
      console.log(
        `    Build: Lv ${build.level}, power ${build.powerScore}, deck ${build.deckSize}, potions ${build.potions}, hero ${build.hero.maxLife} Life / ${build.hero.maxEnergy} Energy / ${build.hero.handSize} Hand / heal ${build.hero.potionHeal}, weapon ${weaponLabel}`
      );
      console.log(
        `    Overall: ${formatPct(scenario.overall.winRate)} win, avg turns ${scenario.overall.averageTurns}, hero ${scenario.overall.averageHeroLifePct}% life, enemy ${scenario.overall.averageEnemyLifePct}% remaining`
      );

      const hardest = [...scenario.encounters]
        .sort((left, right) => left.winRate - right.winRate || right.averageEnemyLifePct - left.averageEnemyLifePct)
        .slice(0, 5);
      hardest.forEach((encounter) => {
        console.log(
          `    ${encounter.zoneTitle} / ${encounter.encounterName}: ${formatPct(encounter.winRate)} win, avg turns ${encounter.averageTurns}, hero ${encounter.averageHeroLifePct}%, enemy power ${encounter.enemyPowerScore}, ratio ${encounter.powerRatio}x`
        );
      });
    }
  }
}

function buildReport(artifact, options) {
  const classMap = new Map();
  for (const run of artifact.runs) {
    if (!classMap.has(run.classId)) {
      classMap.set(run.classId, {
        classId: run.classId,
        className: run.className,
        scenarios: [],
      });
    }
    classMap.get(run.classId).scenarios.push({
      scenarioId: run.combat?.scenarioId || run.policyId,
      label: run.combat?.scenarioLabel || run.policyLabel,
      assumptions: run.combat?.assumptions || [],
      build: {
        level: run.combat?.build.level || run.finalLevel,
        powerScore: run.combat?.build.powerScore || 0,
        deckSize: run.combat?.build.deckSize || 0,
        potions: run.combat?.overall.averagePotionsRemaining || 0,
        hero: run.combat?.build.hero || run.summary.finalBuild.hero,
        weapon: run.combat?.build.weapon || run.summary.finalBuild.weapon,
      },
      overall: run.combat?.overall || {
        winRate: 0,
        averageTurns: 0,
        averageHeroLifePct: 0,
        averageEnemyLifePct: 0,
      },
      encounters: run.combat?.encounters || [],
    });
  }

  return {
    generatedAt: artifact.generatedAt,
    encounterSetId: options.encounterSetId,
    encounterSetLabel: artifact.runs[0]?.combat?.encounterSetLabel || options.encounterSetId,
    runsPerEncounter: options.runsPerEncounter,
    classReports: [...classMap.values()].sort((left, right) => left.className.localeCompare(right.className)),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = {
    experimentId: "balance_sim",
    title: "Balance Simulation",
    scenarioType: "combat_balance",
    classIds: options.classIds,
    policyIds: [],
    scenarioIds: options.scenarioIds,
    seedOffsets: [0],
    throughActNumber: 5,
    probeRuns: 0,
    maxCombatTurns: 36,
    concurrency: 1,
    encounterSetId: options.encounterSetId,
    runsPerEncounter: options.runsPerEncounter,
    encounterLimit: options.encounterLimit,
    traceFailures: false,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "combat-balance"],
  };

  const result = runOrchestratorSpec(spec, {
    mode: options.resume ? "resume" : "run",
    output: options.output,
    stopAfter: options.stopAfter,
  });
  const report = buildReport(result.artifact, options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  result.cleanup();
}

main();
