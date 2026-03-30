const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const ORCHESTRATOR_SCRIPT = path.join(ROOT, "scripts", "run-balance-orchestrator.js");

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildSeedOffsets(seedCount) {
  return Array.from({ length: Math.max(1, Number(seedCount || 1)) }, (_, index) => index);
}

function deriveArtifactPaths(basePath) {
  return {
    output: basePath,
    reportPath: basePath.replace(/\.json$/i, ".md"),
    indexPath: basePath.replace(/\.json$/i, ".index.json"),
    jobPath: basePath.replace(/\.json$/i, ".job.json"),
    tracesDir: basePath.replace(/\.json$/i, "-traces"),
  };
}

function buildRunKey(spec, run) {
  return `${spec.experimentId}:${spec.scenarioType}:${run.classId}:${run.policyId}:${run.seedOffset}${run.targetArchetypeId ? `:${run.targetArchetypeId}` : ""}`;
}

function buildEmptyFinalBuild(run = {}) {
  const finalBuild = run.finalBuild || run.summary?.finalBuild || {};
  return {
    level: Number(finalBuild.level || run.finalLevel || 0),
    deckSize: Number(finalBuild.deckSize || 0),
    topCards: Array.isArray(finalBuild.topCards) ? finalBuild.topCards : [],
    deckProficiencies: Array.isArray(finalBuild.deckProficiencies) ? finalBuild.deckProficiencies : [],
    hero: {
      maxLife: Number(finalBuild.hero?.maxLife || 0),
      maxEnergy: Number(finalBuild.hero?.maxEnergy || 0),
      handSize: Number(finalBuild.hero?.handSize || 5),
      potionHeal: Number(finalBuild.hero?.potionHeal || 0),
      damageBonus: Number(finalBuild.hero?.damageBonus || 0),
      guardBonus: Number(finalBuild.hero?.guardBonus || 0),
      burnBonus: Number(finalBuild.hero?.burnBonus || 0),
    },
    mercenary: {
      name: String(finalBuild.mercenary?.name || ""),
      maxLife: Number(finalBuild.mercenary?.maxLife || 0),
      attack: Number(finalBuild.mercenary?.attack || 0),
    },
    weapon: finalBuild.weapon || null,
    armor: finalBuild.armor || null,
    favoredTreeId: String(finalBuild.favoredTreeId || ""),
    favoredTreeName: String(finalBuild.favoredTreeName || ""),
    dominantArchetypeId: String(finalBuild.dominantArchetypeId || ""),
    dominantArchetypeLabel: String(finalBuild.dominantArchetypeLabel || ""),
    dominantArchetypeScore: Number(finalBuild.dominantArchetypeScore || 0),
    secondaryArchetypeId: String(finalBuild.secondaryArchetypeId || ""),
    secondaryArchetypeLabel: String(finalBuild.secondaryArchetypeLabel || ""),
    secondaryArchetypeScore: Number(finalBuild.secondaryArchetypeScore || 0),
    archetypeScores: Array.isArray(finalBuild.archetypeScores) ? finalBuild.archetypeScores : [],
    activeRunewords: Array.isArray(finalBuild.activeRunewords) ? finalBuild.activeRunewords : [],
    archetypeCommitment: finalBuild.archetypeCommitment || null,
  };
}

function normalizeLegacySummary(run = {}) {
  const summary = run.summary && typeof run.summary === "object" ? { ...run.summary } : {};
  summary.runSummary = summary.runSummary || {};
  summary.zoneKindCounts = summary.zoneKindCounts || {};
  summary.zoneRoleCounts = summary.zoneRoleCounts || {};
  summary.nodeTypeCounts = summary.nodeTypeCounts || {};
  summary.rewardKindCounts = summary.rewardKindCounts || {};
  summary.choiceKindCounts = summary.choiceKindCounts || {};
  summary.rewardEffectCounts = summary.rewardEffectCounts || {};
  summary.rewardRoleCounts = summary.rewardRoleCounts || {};
  summary.strategyRoleCounts = summary.strategyRoleCounts || {};
  summary.encounterResults = Array.isArray(summary.encounterResults) ? summary.encounterResults : [];
  summary.encounterMetricsByKind = summary.encounterMetricsByKind || {};
  summary.world = summary.world || {
    resolvedNodeCount: 0,
    worldFlagCount: 0,
    questOutcomes: 0,
    questFollowUpsResolved: 0,
    questChainsResolved: 0,
    shrineOutcomes: 0,
    eventOutcomes: 0,
    opportunityOutcomes: 0,
  };
  summary.finalBuild = buildEmptyFinalBuild(run);
  return summary;
}

function looksLikeLegacyWrapperArtifact(value) {
  return Boolean(value) &&
    typeof value === "object" &&
    Array.isArray(value.runs) &&
    !value.experiment &&
    Array.isArray(value.classIds) &&
    Array.isArray(value.policyIds);
}

function buildAggregateFromRuns(spec, runs) {
  const totalExpected = Math.max(1, (spec.classIds || []).length * (spec.policyIds || []).length * (spec.seedOffsets || []).length);
  const groups = new Map();
  let wins = 0;
  let failures = 0;
  let act2 = 0;
  let act5 = 0;
  let finalActTotal = 0;
  let finalLevelTotal = 0;
  let durationTotal = 0;
  let runewordTotal = 0;
  let offArchetypeWeapons = 0;
  let handSizeBonusCount = 0;

  for (const run of runs) {
    const key = `${run.classId}:${run.policyId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        classId: run.classId,
        className: run.className,
        policyId: run.policyId,
        policyLabel: run.policyLabel,
        runs: 0,
        wins: 0,
        failures: 0,
        act2: 0,
        act5: 0,
        finalActTotal: 0,
        finalLevelTotal: 0,
        durationTotal: 0,
      });
    }
    const group = groups.get(key);
    const isWin = run.outcome === "run_complete" ? 1 : 0;
    const isFailure = run.outcome === "run_failed" ? 1 : 0;
    group.runs += 1;
    group.wins += isWin;
    group.failures += isFailure;
    group.act2 += run.finalActNumber >= 2 ? 1 : 0;
    group.act5 += run.finalActNumber >= 5 ? 1 : 0;
    group.finalActTotal += Number(run.finalActNumber || 0);
    group.finalLevelTotal += Number(run.finalLevel || 0);
    group.durationTotal += Number(run.durationMs || 0);

    wins += isWin;
    failures += isFailure;
    act2 += run.finalActNumber >= 2 ? 1 : 0;
    act5 += run.finalActNumber >= 5 ? 1 : 0;
    finalActTotal += Number(run.finalActNumber || 0);
    finalLevelTotal += Number(run.finalLevel || 0);
    durationTotal += Number(run.durationMs || 0);
    runewordTotal += Number(run.summary?.finalBuild?.activeRunewords?.length || 0);
    offArchetypeWeapons += run.summary?.finalBuild?.weapon?.preferredForClass === false ? 1 : 0;
    handSizeBonusCount += Number(run.summary?.finalBuild?.hero?.handSize || 5) > 5 ? 1 : 0;
  }

  const divisor = Math.max(1, runs.length);
  return {
    experimentId: spec.experimentId,
    title: spec.title,
    scenarioType: spec.scenarioType,
    runs: runs.length,
    completedRuns: runs.length,
    coverageRate: roundTo(runs.length / totalExpected, 3),
    overall: {
      winRate: roundTo(wins / divisor, 3),
      failureRate: roundTo(failures / divisor, 3),
      act2Rate: roundTo(act2 / divisor, 3),
      act5Rate: roundTo(act5 / divisor, 3),
      averageFinalAct: roundTo(finalActTotal / divisor, 3),
      averageFinalLevel: roundTo(finalLevelTotal / divisor, 3),
      averageDurationMs: roundTo(durationTotal / divisor, 3),
      averageRunewords: roundTo(runewordTotal / divisor, 3),
      offArchetypeWeaponRate: roundTo(offArchetypeWeapons / divisor, 3),
      handSizeBonusRate: roundTo(handSizeBonusCount / divisor, 3),
      combatSampleWinRate: roundTo(wins / divisor, 3),
    },
    encounterMetricsByKind: {},
    strategyRoleCounts: {},
    rewardRoleCounts: {},
    groups: [...groups.values()].map((group) => ({
      classId: group.classId,
      className: group.className,
      policyId: group.policyId,
      policyLabel: group.policyLabel,
      runs: group.runs,
      winRate: roundTo(group.wins / Math.max(1, group.runs), 3),
      failureRate: roundTo(group.failures / Math.max(1, group.runs), 3),
      act2Rate: roundTo(group.act2 / Math.max(1, group.runs), 3),
      act5Rate: roundTo(group.act5 / Math.max(1, group.runs), 3),
      averageFinalAct: roundTo(group.finalActTotal / Math.max(1, group.runs), 3),
      averageFinalLevel: roundTo(group.finalLevelTotal / Math.max(1, group.runs), 3),
      averageDurationMs: roundTo(group.durationTotal / Math.max(1, group.runs), 3),
    })),
  };
}

function migrateLegacyWrapperArtifact(spec, artifactPath) {
  if (!artifactPath || !fs.existsSync(artifactPath)) {
    return;
  }
  const parsed = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  if (!looksLikeLegacyWrapperArtifact(parsed)) {
    return;
  }

  const backupPath = artifactPath.replace(/\.json$/i, ".legacy.json");
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(artifactPath, backupPath);
  }

  const runs = (parsed.runs || []).map((run) => ({
    runKey: buildRunKey(spec, run),
    experimentId: spec.experimentId,
    scenarioType: spec.scenarioType,
    classId: run.classId,
    className: run.className || run.classId,
    policyId: run.policyId,
    policyLabel: run.policyLabel || run.policyId,
    seedOffset: Number(run.seedOffset || 0),
    targetArchetypeId: String(run.targetArchetypeId || ""),
    targetArchetypeLabel: String(run.targetArchetypeLabel || ""),
    targetBand: run.targetBand || "",
    commitmentMode: run.commitmentMode || "natural",
    outcome: run.outcome || "run_failed",
    finalActNumber: Number(run.finalActNumber || 0),
    finalLevel: Number(run.finalLevel || 0),
    failure: run.failure || null,
    durationMs: Number(run.durationMs || 0),
    completedAt: parsed.generatedAt || new Date().toISOString(),
    checkpoints: Array.isArray(run.checkpoints) ? run.checkpoints : [],
    summary: normalizeLegacySummary(run),
    snapshots: {},
    traces: [],
    archetypeEvaluation: run.archetypeEvaluation || run.summary?.archetypeCommitment || null,
  }));

  const migrated = {
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    experiment: spec,
    runs,
    aggregate: buildAggregateFromRuns(spec, runs),
    bands: [],
    baselineComparison: null,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(migrated, null, 2));
}

function runOrchestratorSpec(spec, options = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-orch-wrapper-"));
  const specPath = path.join(tempDir, "spec.json");
  const artifactBase = options.output
    ? path.resolve(ROOT, options.output)
    : path.join(tempDir, `${spec.experimentId}.json`);
  const paths = deriveArtifactPaths(artifactBase);

  fs.mkdirSync(path.dirname(paths.output), { recursive: true });
  if ((options.mode || "run") === "resume") {
    migrateLegacyWrapperArtifact(spec, paths.output);
  }
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  const args = [
    ORCHESTRATOR_SCRIPT,
    "--mode",
    options.mode || "run",
    "--spec",
    specPath,
    "--output",
    paths.output,
    "--report",
    paths.reportPath,
    "--index",
    paths.indexPath,
    "--job",
    paths.jobPath,
    "--traces-dir",
    paths.tracesDir,
  ];

  if (Number(options.stopAfter || 0) > 0) {
    args.push("--stop-after", String(options.stopAfter));
  }

  execFileSync(process.execPath, args, {
    cwd: ROOT,
    stdio: "pipe",
    maxBuffer: 1024 * 1024 * 50,
  });

  const artifact = JSON.parse(fs.readFileSync(paths.output, "utf8"));
  const report = fs.existsSync(paths.reportPath) ? fs.readFileSync(paths.reportPath, "utf8") : "";
  const index = fs.existsSync(paths.indexPath) ? JSON.parse(fs.readFileSync(paths.indexPath, "utf8")) : [];

  return {
    artifact,
    report,
    index,
    paths,
    cleanup() {
      if (!options.output) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    },
  };
}

module.exports = {
  ROOT,
  ORCHESTRATOR_SCRIPT,
  buildSeedOffsets,
  roundTo,
  runOrchestratorSpec,
};
