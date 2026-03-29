#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "run-progression-simulator.js");

function parseArgs(argv) {
  const parsed = {
    classId: "druid",
    policyId: "aggressive",
    targetActNumber: 4,
    encounterId: "",
    seedOffset: 0,
    maxCombatTurns: 36,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--class" && next) {
      parsed.classId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--policy" && next) {
      parsed.policyId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--act" && next) {
      parsed.targetActNumber = Math.max(1, Math.min(5, Number.parseInt(next, 10) || parsed.targetActNumber));
      index += 1;
      continue;
    }
    if (arg === "--encounter" && next) {
      parsed.encounterId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--seed-offset" && next) {
      parsed.seedOffset = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(12, Number.parseInt(next, 10) || parsed.maxCombatTurns);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  if (!parsed.encounterId) {
    parsed.encounterId = `act_${parsed.targetActNumber}_boss`;
  }

  return parsed;
}

function printSnapshot(label, snapshot) {
  console.log(`  ${label}`);
  console.log(
    `    Hero: ${snapshot.hero.life}/${snapshot.hero.maxLife} life, ${snapshot.hero.guard} guard, ${snapshot.hero.energy} energy` +
      `${snapshot.hero.burn ? `, burn ${snapshot.hero.burn}` : ""}` +
      `${snapshot.hero.poison ? `, poison ${snapshot.hero.poison}` : ""}` +
      `${snapshot.hero.chill ? `, chill ${snapshot.hero.chill}` : ""}`
  );
  console.log(
    `    Merc: ${snapshot.mercenary.life}/${snapshot.mercenary.maxLife} life, ${snapshot.mercenary.guard} guard` +
      `${snapshot.mercenary.nextAttackBonus ? `, next atk +${snapshot.mercenary.nextAttackBonus}` : ""}`
  );
  snapshot.enemies.forEach((enemy) => {
    console.log(`    Enemy: ${enemy.name} ${enemy.life}/${enemy.maxLife} life, ${enemy.guard} guard, intent ${enemy.intent}`);
  });
  console.log(`    Hand: ${snapshot.hand.map((entry) => `${entry.title}(${entry.cost})`).join(", ")}`);
}

function printHumanReport(report) {
  console.log(`${report.classId} / ${report.policyLabel} / seed ${report.seedOffset}`);
  console.log(`${report.zoneTitle} / ${report.encounterName} (${report.encounterId})`);
  console.log(`Outcome: ${report.outcome}`);
  report.turns.forEach((turn) => {
    console.log(`\nTurn ${turn.turn}`);
    printSnapshot("Start", turn.start);
    console.log(`  Actions: ${(turn.actions || []).join(" | ")}`);
    printSnapshot("End", turn.end);
    const logLines = Array.isArray(turn.log) ? turn.log.slice(-6) : [];
    if (logLines.length > 0) {
      console.log("  Recent log:");
      logLines.forEach((line) => console.log(`    ${line}`));
    }
  });
  if (Array.isArray(report.recentLog) && report.recentLog.length > 0) {
    console.log("\nFinal log:");
    report.recentLog.slice(-12).forEach((line) => console.log(`  ${line}`));
  }
}

function main() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled progression simulator helper. Run `npm run build` first.");
    process.exit(1);
  }

  const { runProgressionEncounterTrace } = require(HELPER_PATH);
  const options = parseArgs(process.argv.slice(2));
  const report = runProgressionEncounterTrace(options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report);
}

main();
