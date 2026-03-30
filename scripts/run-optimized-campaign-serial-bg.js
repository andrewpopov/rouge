#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const { runProgressionSimulationReport } = require("../generated/tests/helpers/run-progression-simulator.js");

const DEFAULT_CLASSES = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const DEFAULT_SEEDS = [0, 1, 2, 3, 4];

function parseArgs(argv) {
  const parsed = {
    output: path.resolve("artifacts/balance/optimized-campaign-serial-bg-20260329.json"),
    state: path.resolve("artifacts/balance/optimized-campaign-serial-bg-20260329.state.json"),
    policyId: "aggressive",
    throughActNumber: 5,
    maxCombatTurns: 36,
    classes: [...DEFAULT_CLASSES],
    seeds: [...DEFAULT_SEEDS],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--output" && next) {
      parsed.output = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--state" && next) {
      parsed.state = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--policy" && next) {
      parsed.policyId = next.trim() || parsed.policyId;
      index += 1;
      continue;
    }
    if (arg === "--through-act" && next) {
      parsed.throughActNumber = Math.max(1, Math.min(5, Number.parseInt(next, 10) || parsed.throughActNumber));
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(12, Number.parseInt(next, 10) || parsed.maxCombatTurns);
      index += 1;
      continue;
    }
    if (arg === "--class" && next) {
      parsed.classes = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      parsed.seeds = next
        .split(",")
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value >= 0);
      index += 1;
    }
  }

  return parsed;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildClassSummaries(classes, runs) {
  return classes.map((classId) => {
    const classRuns = runs.filter((run) => run.classId === classId);
    const clears = classRuns.filter((run) => run.outcome === "run_complete").length;
    return {
      classId,
      className: classRuns[0]?.className || classId,
      clears,
      runs: classRuns.length,
      clearRate: classRuns.length > 0 ? clears / classRuns.length : 0,
      failures: classRuns
        .filter((run) => run.failure)
        .map((run) => ({ seedOffset: run.seedOffset, failure: run.failure })),
    };
  });
}

function writeArtifacts(config, runs, current) {
  const artifact = {
    generatedAt: new Date().toISOString(),
    scenario: "optimized_campaign_serial_bg",
    policyId: config.policyId,
    throughActNumber: config.throughActNumber,
    seeds: config.seeds,
    runs,
    classSummaries: buildClassSummaries(config.classes, runs),
  };
  fs.writeFileSync(config.output, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(
    config.state,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        current,
        completed: runs.length,
        total: config.classes.length * config.seeds.length,
      },
      null,
      2
    )
  );
}

function main() {
  const config = parseArgs(process.argv.slice(2));
  const existing = readJsonIfExists(config.output);
  const runs = Array.isArray(existing?.runs) ? existing.runs : [];
  const doneKeys = new Set(runs.map((run) => `${run.classId}:${run.seedOffset}`));

  for (const classId of config.classes) {
    for (const seedOffset of config.seeds) {
      const key = `${classId}:${seedOffset}`;
      if (doneKeys.has(key)) {
        console.log(`[skip] ${key}`);
        continue;
      }

      console.log(`[run] ${classId} ${config.policyId} seed ${seedOffset}`);
      writeArtifacts(config, runs, { classId, seedOffset, status: "running" });

      const report = runProgressionSimulationReport({
        classIds: [classId],
        policyIds: [config.policyId],
        throughActNumber: config.throughActNumber,
        probeRuns: 0,
        maxCombatTurns: config.maxCombatTurns,
        seedOffset,
      });
      const classReport = report.classReports[0];
      const run = classReport.policyReports[0];

      runs.push({
        classId,
        className: classReport.className,
        policyId: config.policyId,
        seedOffset,
        outcome: run.outcome,
        finalActNumber: run.finalActNumber,
        finalLevel: run.finalLevel,
        failure: run.failure || null,
        finalBuild: run.finalBuild || null,
        checkpoints: run.checkpoints || [],
      });
      doneKeys.add(key);
      writeArtifacts(config, runs, { classId, seedOffset, status: "completed" });
      console.log(
        `[done] ${classId} seed ${seedOffset} -> ${run.outcome}${run.failure ? ` @ ${run.failure.zoneTitle} / ${run.failure.encounterName}` : ""}`
      );
    }
  }

  writeArtifacts(config, runs, { status: "completed" });
  console.log("[complete] optimized campaign serial rerun finished");
}

main();
