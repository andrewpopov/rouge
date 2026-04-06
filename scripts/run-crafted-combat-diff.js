#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const parsed = {
    beforePath: "",
    afterPath: "",
    outputPath: "",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--before" && next) {
      parsed.beforePath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--after" && next) {
      parsed.afterPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.outputPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  if (!parsed.beforePath || !parsed.afterPath) {
    throw new Error("Missing --before <path> or --after <path>.");
  }

  return parsed;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function delta(before, after, digits = 3) {
  return round(Number(after || 0) - Number(before || 0), digits);
}

function formatSigned(value, suffix = "") {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${amount}${suffix}`;
}

function isCraftedReport(data) {
  return data && Array.isArray(data.encounters) && data.build && data.overall && data.requested;
}

function isSuiteSummary(data) {
  return data && Array.isArray(data.results) && data.aggregate;
}

function diffCraftedReports(before, after, beforePath, afterPath) {
  const encounterMap = new Map((before.encounters || []).map((entry) => [entry.encounterId, entry]));
  const encounters = (after.encounters || []).map((entry) => {
    const previous = encounterMap.get(entry.encounterId) || {};
    return {
      encounterId: entry.encounterId,
      encounterName: entry.encounterName,
      winRateBefore: round(previous.winRate || 0),
      winRateAfter: round(entry.winRate || 0),
      winRateDelta: delta(previous.winRate, entry.winRate),
      powerRatioBefore: round(previous.powerRatio || 0, 2),
      powerRatioAfter: round(entry.powerRatio || 0, 2),
      powerRatioDelta: delta(previous.powerRatio, entry.powerRatio, 2),
      averageTurnsBefore: round(previous.averageTurns || 0, 2),
      averageTurnsAfter: round(entry.averageTurns || 0, 2),
      averageTurnsDelta: delta(previous.averageTurns, entry.averageTurns, 2),
      skillActionRateBefore: round(previous.skillActionRate || 0),
      skillActionRateAfter: round(entry.skillActionRate || 0),
      skillActionRateDelta: delta(previous.skillActionRate, entry.skillActionRate),
      slot2UseRateBefore: round(previous.slot2UseRate || 0),
      slot2UseRateAfter: round(entry.slot2UseRate || 0),
      slot2UseRateDelta: delta(previous.slot2UseRate, entry.slot2UseRate),
      slot3UseRateBefore: round(previous.slot3UseRate || 0),
      slot3UseRateAfter: round(entry.slot3UseRate || 0),
      slot3UseRateDelta: delta(previous.slot3UseRate, entry.slot3UseRate),
      beamDecisionRateBefore: round(previous.beamDecisionRate || 0),
      beamDecisionRateAfter: round(entry.beamDecisionRate || 0),
      beamDecisionRateDelta: delta(previous.beamDecisionRate, entry.beamDecisionRate),
    };
  });

  return {
    type: "crafted_report",
    beforePath,
    afterPath,
    labelBefore: before.label,
    labelAfter: after.label,
    classId: after.requested.classId,
    build: {
      powerScoreBefore: round(before.build?.powerScore || 0, 2),
      powerScoreAfter: round(after.build?.powerScore || 0, 2),
      powerScoreDelta: delta(before.build?.powerScore, after.build?.powerScore, 2),
      bossReadinessBefore: round(before.build?.bossReadinessScore || 0, 2),
      bossReadinessAfter: round(after.build?.bossReadinessScore || 0, 2),
      bossReadinessDelta: delta(before.build?.bossReadinessScore, after.build?.bossReadinessScore, 2),
      favoredTreeBefore: before.build?.training?.favoredTreeId || "",
      favoredTreeAfter: after.build?.training?.favoredTreeId || "",
      equippedSkillIdsBefore: before.build?.training?.equippedSkillIds || {},
      equippedSkillIdsAfter: after.build?.training?.equippedSkillIds || {},
    },
    overall: {
      winRateBefore: round(before.overall?.winRate || 0),
      winRateAfter: round(after.overall?.winRate || 0),
      winRateDelta: delta(before.overall?.winRate, after.overall?.winRate),
      averageTurnsBefore: round(before.overall?.averageTurns || 0, 2),
      averageTurnsAfter: round(after.overall?.averageTurns || 0, 2),
      averageTurnsDelta: delta(before.overall?.averageTurns, after.overall?.averageTurns, 2),
      averageHeroLifePctBefore: round(before.overall?.averageHeroLifePct || 0, 2),
      averageHeroLifePctAfter: round(after.overall?.averageHeroLifePct || 0, 2),
      averageHeroLifePctDelta: delta(before.overall?.averageHeroLifePct, after.overall?.averageHeroLifePct, 2),
      averageEnemyLifePctBefore: round(before.overall?.averageEnemyLifePct || 0, 2),
      averageEnemyLifePctAfter: round(after.overall?.averageEnemyLifePct || 0, 2),
      averageEnemyLifePctDelta: delta(before.overall?.averageEnemyLifePct, after.overall?.averageEnemyLifePct, 2),
      beamDecisionRateBefore: round(before.overall?.beamDecisionRate || 0),
      beamDecisionRateAfter: round(after.overall?.beamDecisionRate || 0),
      beamDecisionRateDelta: delta(before.overall?.beamDecisionRate, after.overall?.beamDecisionRate),
      beamOverrideRateBefore: round(before.overall?.beamOverrideRate || 0),
      beamOverrideRateAfter: round(after.overall?.beamOverrideRate || 0),
      beamOverrideRateDelta: delta(before.overall?.beamOverrideRate, after.overall?.beamOverrideRate),
    },
    encounters,
  };
}

function diffSuiteSummaries(before, after, beforePath, afterPath) {
  const beforeMap = new Map((before.results || []).map((entry) => [entry.specPath, entry]));
  const results = (after.results || []).map((entry) => {
    const previous = beforeMap.get(entry.specPath) || {};
    return {
      specPath: entry.specPath,
      label: entry.label,
      classId: entry.classId,
      winRateBefore: round(previous.winRate || 0),
      winRateAfter: round(entry.winRate || 0),
      winRateDelta: delta(previous.winRate, entry.winRate),
      powerScoreBefore: round(previous.powerScore || 0, 2),
      powerScoreAfter: round(entry.powerScore || 0, 2),
      powerScoreDelta: delta(previous.powerScore, entry.powerScore, 2),
      bossReadinessBefore: round(previous.bossReadinessScore || 0, 2),
      bossReadinessAfter: round(entry.bossReadinessScore || 0, 2),
      bossReadinessDelta: delta(previous.bossReadinessScore, entry.bossReadinessScore, 2),
    };
  });

  return {
    type: "suite_summary",
    beforePath,
    afterPath,
    overall: {
      averageWinRateBefore: round(before.aggregate?.averageWinRate || 0),
      averageWinRateAfter: round(after.aggregate?.averageWinRate || 0),
      averageWinRateDelta: delta(before.aggregate?.averageWinRate, after.aggregate?.averageWinRate),
      averagePowerScoreBefore: round(before.aggregate?.averagePowerScore || 0, 2),
      averagePowerScoreAfter: round(after.aggregate?.averagePowerScore || 0, 2),
      averagePowerScoreDelta: delta(before.aggregate?.averagePowerScore, after.aggregate?.averagePowerScore, 2),
      averageBossReadinessBefore: round(before.aggregate?.averageBossReadinessScore || 0, 2),
      averageBossReadinessAfter: round(after.aggregate?.averageBossReadinessScore || 0, 2),
      averageBossReadinessDelta: delta(before.aggregate?.averageBossReadinessScore, after.aggregate?.averageBossReadinessScore, 2),
    },
    results,
  };
}

function printCraftedReportDiff(diff) {
  console.log(`${diff.labelBefore} -> ${diff.labelAfter}`);
  console.log(`Power ${diff.build.powerScoreBefore} -> ${diff.build.powerScoreAfter} (${formatSigned(diff.build.powerScoreDelta)})`);
  console.log(`Boss readiness ${diff.build.bossReadinessBefore} -> ${diff.build.bossReadinessAfter} (${formatSigned(diff.build.bossReadinessDelta)})`);
  console.log(`Win rate ${diff.overall.winRateBefore} -> ${diff.overall.winRateAfter} (${formatSigned(diff.overall.winRateDelta)})`);
  console.log(`Enemy life ${diff.overall.averageEnemyLifePctBefore}% -> ${diff.overall.averageEnemyLifePctAfter}% (${formatSigned(diff.overall.averageEnemyLifePctDelta, "%")})`);
  diff.encounters.forEach((entry) => {
    console.log(
      `  ${entry.encounterName}: win ${entry.winRateBefore} -> ${entry.winRateAfter} (${formatSigned(entry.winRateDelta)}), ratio ${entry.powerRatioBefore} -> ${entry.powerRatioAfter} (${formatSigned(entry.powerRatioDelta)}), slot3 ${entry.slot3UseRateBefore} -> ${entry.slot3UseRateAfter} (${formatSigned(entry.slot3UseRateDelta)})`
    );
  });
}

function printSuiteSummaryDiff(diff) {
  console.log(`Suite summary diff`);
  console.log(
    `Overall win ${diff.overall.averageWinRateBefore} -> ${diff.overall.averageWinRateAfter} (${formatSigned(diff.overall.averageWinRateDelta)})`
  );
  console.log(
    `Overall power ${diff.overall.averagePowerScoreBefore} -> ${diff.overall.averagePowerScoreAfter} (${formatSigned(diff.overall.averagePowerScoreDelta)})`
  );
  diff.results.forEach((entry) => {
    console.log(
      `  ${entry.label}: win ${entry.winRateBefore} -> ${entry.winRateAfter} (${formatSigned(entry.winRateDelta)}), boss ${entry.bossReadinessBefore} -> ${entry.bossReadinessAfter} (${formatSigned(entry.bossReadinessDelta)})`
    );
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const before = readJson(options.beforePath);
  const after = readJson(options.afterPath);

  let diff;
  if (isCraftedReport(before) && isCraftedReport(after)) {
    diff = diffCraftedReports(before, after, options.beforePath, options.afterPath);
  } else if (isSuiteSummary(before) && isSuiteSummary(after)) {
    diff = diffSuiteSummaries(before, after, options.beforePath, options.afterPath);
  } else {
    throw new Error("Inputs must both be crafted combat reports or both be crafted suite summaries.");
  }

  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, JSON.stringify(diff, null, 2));
  }

  if (options.json) {
    console.log(JSON.stringify(diff, null, 2));
    return;
  }

  if (diff.type === "crafted_report") {
    printCraftedReportDiff(diff);
  } else {
    printSuiteSummaryDiff(diff);
  }
  if (options.outputPath) {
    console.log(`\nSaved diff: ${options.outputPath}`);
  }
}

main();
