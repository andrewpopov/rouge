#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "combat-simulator.js");

function parseArgs(argv) {
  const parsed = {
    specPath: "",
    outputPath: "",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--spec" && next) {
      parsed.specPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.outputPath = path.resolve(next);
      index += 1;
    }
  }

  if (!parsed.specPath) {
    throw new Error("Missing --spec <path>.");
  }

  return parsed;
}

function formatPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function printHumanReport(report) {
  console.log(`${report.label} | seed ${report.seed}`);
  console.log(
    `${report.build.className} | Lv ${report.build.level} | power ${report.build.powerScore} | boss readiness ${report.build.bossReadinessScore}`
  );
  console.log(
    `Deck ${report.build.deckSize} | favored tree ${report.build.training.favoredTreeId || "none"} | skills ${Object.values(report.build.training.equippedSkillNames).filter(Boolean).join(", ")}`
  );
  console.log(
    `Encounters ${report.encounterSource.encounterIds.join(", ")} | ${report.encounterSource.runsPerEncounter} run(s) each`
  );
  console.log(
    `Overall ${formatPct(report.overall.winRate)} win | avg turns ${report.overall.averageTurns} | hero ${report.overall.averageHeroLifePct}% | enemy ${report.overall.averageEnemyLifePct}%`
  );

  report.encounters.forEach((encounter) => {
    console.log(
      `  ${encounter.zoneTitle} / ${encounter.encounterName}: ${formatPct(encounter.winRate)} win, avg turns ${encounter.averageTurns}, power ratio ${encounter.powerRatio}x, beam ${encounter.beamDecisionRate}`
    );
  });
}

function main() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled combat simulator helper. Run `npx tsc -p ./tsconfig.tests.json` first.");
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(fs.readFileSync(options.specPath, "utf8"));
  const { runCraftedCombatSimulationReport } = require(HELPER_PATH);
  const report = runCraftedCombatSimulationReport(spec);

  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, JSON.stringify(report, null, 2));
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report);
  if (options.outputPath) {
    console.log(`\nSaved JSON: ${options.outputPath}`);
  }
}

main();
