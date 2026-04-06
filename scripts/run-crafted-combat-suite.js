#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "combat-simulator.js");
const DEFAULT_SPEC_DIR = path.join(ROOT, "data", "balance", "crafted-combat-specs");

function parseArgs(argv) {
  const parsed = {
    specDir: DEFAULT_SPEC_DIR,
    specPaths: [],
    classIds: [],
    tags: [],
    encounterIds: [],
    outputDir: "",
    summaryPath: "",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--spec-dir" && next) {
      parsed.specDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--spec" && next) {
      parsed.specPaths = next.split(",").map((value) => path.resolve(value.trim())).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--class" && next) {
      parsed.classIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--tag" && next) {
      parsed.tags = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--encounter" && next) {
      parsed.encounterIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--output-dir" && next) {
      parsed.outputDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--summary" && next) {
      parsed.summaryPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function readSpec(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function matchesFilters(spec, options) {
  if (options.classIds.length > 0 && !options.classIds.includes(String(spec.classId || ""))) {
    return false;
  }
  if (options.tags.length > 0) {
    const tagSet = new Set((Array.isArray(spec.tags) ? spec.tags : []).map((tag) => String(tag || "")));
    if (!options.tags.every((tag) => tagSet.has(tag))) {
      return false;
    }
  }
  if (options.encounterIds.length > 0) {
    const encounterIds = new Set([
      ...(spec.encounterId ? [String(spec.encounterId)] : []),
      ...(Array.isArray(spec.encounterIds) ? spec.encounterIds.map((value) => String(value)) : []),
      ...(spec.encounterSetId ? [String(spec.encounterSetId)] : []),
    ]);
    if (!options.encounterIds.some((encounterId) => encounterIds.has(encounterId))) {
      return false;
    }
  }
  return true;
}

function listSpecEntries(options) {
  if (options.specPaths.length > 0) {
    return options.specPaths.map((specPath) => ({ specPath, spec: readSpec(specPath) }));
  }
  if (!fs.existsSync(options.specDir)) {
    throw new Error(`Spec directory does not exist: ${options.specDir}`);
  }
  return fs.readdirSync(options.specDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(options.specDir, name))
    .map((specPath) => ({ specPath, spec: readSpec(specPath) }))
    .filter((entry) => matchesFilters(entry.spec, options));
}

function formatPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function printHumanSummary(summary) {
  console.log(`Crafted combat suite | ${summary.results.length} spec(s)`);
  summary.results.forEach((result) => {
    console.log(
      `${result.label}: ${formatPct(result.winRate)} win | power ${result.powerScore} | boss ${result.bossReadinessScore} | encounters ${result.encounterIds.join(", ")}${result.tags.length > 0 ? ` | tags ${result.tags.join(", ")}` : ""}`
    );
  });
  console.log(
    `Overall: ${formatPct(summary.aggregate.averageWinRate)} avg win | ${summary.aggregate.averagePowerScore} avg power | ${summary.aggregate.averageBossReadinessScore} avg boss readiness`
  );
}

function main() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled combat simulator helper. Run `npx tsc -p ./tsconfig.tests.json` first.");
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  const specEntries = listSpecEntries(options);
  if (specEntries.length === 0) {
    throw new Error("No crafted combat specs matched the requested filters.");
  }
  const { runCraftedCombatSimulationReport } = require(HELPER_PATH);

  const results = specEntries.map(({ specPath, spec }) => {
    const report = runCraftedCombatSimulationReport(spec);
    if (options.outputDir) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      const outputPath = path.join(options.outputDir, `${path.basename(specPath, ".json")}.report.json`);
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }
    return {
      specPath,
      label: report.label,
      classId: report.requested.classId,
      encounterIds: report.encounterSource.encounterIds,
      winRate: report.overall.winRate,
      powerScore: report.build.powerScore,
      bossReadinessScore: report.build.bossReadinessScore,
      favoredTreeId: report.build.training.favoredTreeId,
      equippedSkillIds: report.build.training.equippedSkillIds,
      tags: (Array.isArray(spec.tags) ? spec.tags : []).map((tag) => String(tag || "")),
      report,
    };
  });

  const divisor = Math.max(1, results.length);
  const summary = {
    generatedAt: new Date().toISOString(),
    specDir: options.specDir,
    count: results.length,
    filters: {
      classIds: [...options.classIds],
      tags: [...options.tags],
      encounterIds: [...options.encounterIds],
    },
    results: results.map((result) => ({
      specPath: result.specPath,
      label: result.label,
      classId: result.classId,
      encounterIds: result.encounterIds,
      winRate: result.winRate,
      powerScore: result.powerScore,
      bossReadinessScore: result.bossReadinessScore,
      favoredTreeId: result.favoredTreeId,
      equippedSkillIds: result.equippedSkillIds,
      tags: result.tags,
    })),
    aggregate: {
      averageWinRate: Number((results.reduce((sum, result) => sum + Number(result.winRate || 0), 0) / divisor).toFixed(3)),
      averagePowerScore: Number((results.reduce((sum, result) => sum + Number(result.powerScore || 0), 0) / divisor).toFixed(2)),
      averageBossReadinessScore: Number((results.reduce((sum, result) => sum + Number(result.bossReadinessScore || 0), 0) / divisor).toFixed(2)),
    },
  };

  if (options.summaryPath) {
    fs.mkdirSync(path.dirname(options.summaryPath), { recursive: true });
    fs.writeFileSync(options.summaryPath, JSON.stringify(summary, null, 2));
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  printHumanSummary(summary);
  if (options.outputDir) {
    console.log(`\nSaved reports: ${options.outputDir}`);
  }
  if (options.summaryPath) {
    console.log(`Saved summary: ${options.summaryPath}`);
  }
}

main();
