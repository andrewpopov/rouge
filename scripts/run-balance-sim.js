#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "combat-simulator.js");

function parseArgs(argv) {
  const parsed = {
    classIds: [],
    scenarioIds: [],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 16,
    encounterLimit: 0,
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
        `    Build: Lv ${build.level}, power ${build.powerScore}, deck ${build.deckSize}, potions ${build.potions}, hero ${build.hero.maxLife} Life / ${build.hero.maxEnergy} Energy / heal ${build.hero.potionHeal}, weapon ${weaponLabel}`
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

function main() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled simulator helper. Run `npm run build` or `npm run sim:balance`.");
    process.exit(1);
  }

  const {
    runBalanceSimulationReport,
  } = require(HELPER_PATH);
  const options = parseArgs(process.argv.slice(2));
  const report = runBalanceSimulationReport(options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report);
}

main();
