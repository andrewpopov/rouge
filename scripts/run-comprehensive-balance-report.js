#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { buildSeedOffsets, runOrchestratorSpec, ROOT } = require("./orchestrator-wrapper-utils");

const SKILL_AUDIT_SCRIPT_PATH = path.join(ROOT, "scripts", "run-skill-audit.js");
const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
const DEFAULT_WEAK_POLICY_IDS = ["balanced", "control", "bulwark"];

function parseArgs(argv) {
  return {
    classIds: argv.includes("--class")
      ? (argv[argv.indexOf("--class") + 1] || "").split(",").map((value) => value.trim()).filter(Boolean)
      : [...DEFAULT_CLASS_IDS],
    fullSeeds: argv.includes("--full-seeds")
      ? Math.max(1, Number.parseInt(argv[argv.indexOf("--full-seeds") + 1] || "4", 10) || 4)
      : 4,
    weakSeeds: argv.includes("--weak-seeds")
      ? Math.max(1, Number.parseInt(argv[argv.indexOf("--weak-seeds") + 1] || "4", 10) || 4)
      : 4,
    weakPolicies: argv.includes("--weak-policies")
      ? (argv[argv.indexOf("--weak-policies") + 1] || "").split(",").map((value) => value.trim()).filter(Boolean)
      : [...DEFAULT_WEAK_POLICY_IDS],
    checkpointProbeRuns: argv.includes("--checkpoint-probe-runs")
      ? Math.max(0, Number.parseInt(argv[argv.indexOf("--checkpoint-probe-runs") + 1] || "1", 10) || 1)
      : 1,
    endgameRuns: argv.includes("--endgame-runs")
      ? Math.max(1, Number.parseInt(argv[argv.indexOf("--endgame-runs") + 1] || "6", 10) || 6)
      : 6,
    output: argv.includes("--output")
      ? path.resolve(ROOT, argv[argv.indexOf("--output") + 1] || "artifacts/balance/comprehensive-latest.json")
      : path.join(ROOT, "artifacts", "balance", "comprehensive-latest.json"),
    json: argv.includes("--json"),
  };
}

function runSkillAudit() {
  const output = execFileSync(process.execPath, [SKILL_AUDIT_SCRIPT_PATH, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
  return JSON.parse(output);
}

function topSkillAudit(entries, direction) {
  const filtered = [...entries].sort((left, right) => {
    if (direction === "desc") {
      return Number(right.ratioToBand || 0) - Number(left.ratioToBand || 0);
    }
    return Number(left.ratioToBand || 0) - Number(right.ratioToBand || 0);
  });
  return filtered.slice(0, 20).map((entry) => ({
    classId: entry.classId,
    title: entry.title,
    tier: entry.tier,
    role: entry.role,
    proficiency: entry.proficiency,
    score: entry.score,
    ratioToBand: entry.ratioToBand,
  }));
}

function buildSuiteSpec(experimentId, title, scenarioType, classIds, policyIds, seedCount, throughActNumber, probeRuns) {
  return {
    experimentId,
    title,
    scenarioType,
    classIds,
    policyIds,
    seedOffsets: buildSeedOffsets(seedCount),
    throughActNumber,
    probeRuns,
    maxCombatTurns: 36,
    concurrency: 1,
    traceFailures: true,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "comprehensive", experimentId],
  };
}

function printHumanReport(report) {
  console.log("Comprehensive balance report");
  Object.entries(report.suites).forEach(([suiteId, suite]) => {
    console.log(
      `\n${suiteId}: runs ${suite.aggregate.runs}, win ${(suite.aggregate.overall.winRate * 100).toFixed(1)}%, act2 ${(suite.aggregate.overall.act2Rate * 100).toFixed(1)}%, act5 ${(suite.aggregate.overall.act5Rate * 100).toFixed(1)}%`
    );
  });
  console.log(`\nStrongest audited cards: ${report.skillAudit.strongest.length}`);
  console.log(`Weakest audited cards: ${report.skillAudit.weakest.length}`);
  console.log(`Endgame run count parameter retained for compatibility: ${report.meta.endgameRuns}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const optimized = runOrchestratorSpec(
    buildSuiteSpec("optimized_campaign", "Optimized Campaign", "campaign", options.classIds, ["aggressive"], options.fullSeeds, 5, 0)
  );
  const weak = runOrchestratorSpec(
    buildSuiteSpec("weak_campaign", "Weak Campaign", "campaign", options.classIds, options.weakPolicies, options.weakSeeds, 2, 0)
  );
  const boss = runOrchestratorSpec(
    buildSuiteSpec("boss_pacing", "Boss Pacing", "boss_probe", options.classIds, ["aggressive", "balanced"], options.fullSeeds, 5, options.checkpointProbeRuns)
  );
  const loot = runOrchestratorSpec(
    buildSuiteSpec("loot_rune_economy", "Loot Rune Economy", "loot_economy", options.classIds, ["aggressive"], options.fullSeeds, 5, 0)
  );
  const archetype = runOrchestratorSpec(
    buildSuiteSpec("archetype_convergence", "Archetype Convergence", "archetype_convergence", options.classIds, ["aggressive", "balanced"], options.fullSeeds, 5, 0)
  );
  const quest = runOrchestratorSpec(
    buildSuiteSpec("quest_strategy_pressure", "Quest Strategy Pressure", "quest_strategy", options.classIds, ["aggressive", "balanced"], options.fullSeeds, 5, 0)
  );
  const skillAuditEntries = runSkillAudit();

  const report = {
    generatedAt: new Date().toISOString(),
    meta: {
      classIds: options.classIds,
      fullSeeds: options.fullSeeds,
      weakSeeds: options.weakSeeds,
      weakPolicies: options.weakPolicies,
      checkpointProbeRuns: options.checkpointProbeRuns,
      endgameRuns: options.endgameRuns,
    },
    suites: {
      optimized_campaign: {
        aggregate: optimized.artifact.aggregate,
        bands: optimized.artifact.bands,
      },
      weak_campaign: {
        aggregate: weak.artifact.aggregate,
        bands: weak.artifact.bands,
      },
      boss_pacing: {
        aggregate: boss.artifact.aggregate,
        bands: boss.artifact.bands,
      },
      loot_rune_economy: {
        aggregate: loot.artifact.aggregate,
        bands: loot.artifact.bands,
      },
      archetype_convergence: {
        aggregate: archetype.artifact.aggregate,
        bands: archetype.artifact.bands,
      },
      quest_strategy_pressure: {
        aggregate: quest.artifact.aggregate,
        bands: quest.artifact.bands,
      },
    },
    skillAudit: {
      cardCount: skillAuditEntries.length,
      strongest: topSkillAudit(skillAuditEntries, "desc"),
      weakest: topSkillAudit(skillAuditEntries, "asc"),
    },
  };

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, JSON.stringify(report, null, 2));

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
    console.log(`\nArtifact: ${options.output}`);
  }

  optimized.cleanup();
  weak.cleanup();
  boss.cleanup();
  loot.cleanup();
  archetype.cleanup();
  quest.cleanup();
}

main();
