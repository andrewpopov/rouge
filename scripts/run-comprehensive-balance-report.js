#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const PROGRESSION_HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "run-progression-simulator.js");
const BALANCE_HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "combat-simulator.js");
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

function average(sum, count, digits = 2) {
  return Number((sum / Math.max(1, count)).toFixed(digits));
}

function incrementCount(target, key, amount = 1) {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) {
    return;
  }
  target[normalizedKey] = (target[normalizedKey] || 0) + amount;
}

function mergeCountMap(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    incrementCount(target, key, Number(value || 0));
  });
}

function topCounts(source, limit = 8) {
  return Object.entries(source || {})
    .sort((left, right) => Number(right[1]) - Number(left[1]) || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count: Number(count || 0) }));
}

function getFailureLabel(failure) {
  if (!failure) {
    return "";
  }
  return `${failure.zoneTitle} / ${failure.encounterName}`;
}

function getTotalArmorResistance(armor) {
  return Array.isArray(armor?.resistances)
    ? armor.resistances.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    : 0;
}

function loadHelpers() {
  if (!fs.existsSync(PROGRESSION_HELPER_PATH) || !fs.existsSync(BALANCE_HELPER_PATH)) {
    throw new Error("Missing compiled simulator helpers. Run the TypeScript build first.");
  }
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { runProgressionSimulationReport } = require(PROGRESSION_HELPER_PATH);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { runBalanceSimulationReport } = require(BALANCE_HELPER_PATH);
  return { runProgressionSimulationReport, runBalanceSimulationReport };
}

function runSkillAudit() {
  const output = execFileSync(process.execPath, [SKILL_AUDIT_SCRIPT_PATH, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
  return JSON.parse(output);
}

function runSinglePolicy(runProgressionSimulationReport, classId, policyId, throughActNumber, probeRuns, seedOffset) {
  const report = runProgressionSimulationReport({
    classIds: [classId],
    policyIds: [policyId],
    throughActNumber,
    probeRuns,
    maxCombatTurns: 36,
    seedOffset,
  });
  return report.classReports[0].policyReports[0];
}

function aggregateSkillAudit(entries) {
  const byClass = {};
  const strongest = [...entries]
    .filter((entry) => Number(entry.ratioToBand || 0) >= 1.15)
    .sort((left, right) => Number(right.ratioToBand || 0) - Number(left.ratioToBand || 0))
    .slice(0, 20);
  const weakest = [...entries]
    .filter((entry) => Number(entry.ratioToBand || 0) <= 0.85)
    .sort((left, right) => Number(left.ratioToBand || 0) - Number(right.ratioToBand || 0))
    .slice(0, 20);

  entries.forEach((entry) => {
    if (!byClass[entry.classId]) {
      byClass[entry.classId] = {
        classId: entry.classId,
        cards: 0,
        strongest: [],
        weakest: [],
      };
    }
    byClass[entry.classId].cards += 1;
  });

  Object.values(byClass).forEach((entry) => {
    entry.strongest = [...entries]
      .filter((candidate) => candidate.classId === entry.classId)
      .sort((left, right) => Number(right.ratioToBand || 0) - Number(left.ratioToBand || 0))
      .slice(0, 5)
      .map((candidate) => ({
        title: candidate.title,
        tier: candidate.tier,
        cost: candidate.cost,
        role: candidate.role,
        proficiency: candidate.proficiency,
        score: candidate.score,
        ratioToBand: candidate.ratioToBand,
      }));
    entry.weakest = [...entries]
      .filter((candidate) => candidate.classId === entry.classId)
      .sort((left, right) => Number(left.ratioToBand || 0) - Number(right.ratioToBand || 0))
      .slice(0, 5)
      .map((candidate) => ({
        title: candidate.title,
        tier: candidate.tier,
        cost: candidate.cost,
        role: candidate.role,
        proficiency: candidate.proficiency,
        score: candidate.score,
        ratioToBand: candidate.ratioToBand,
      }));
  });

  return {
    cardCount: entries.length,
    strongest,
    weakest,
    byClass: Object.values(byClass).sort((left, right) => left.classId.localeCompare(right.classId)),
  };
}

function aggregateAggressiveRuns(results) {
  const byClass = new Map();

  results.forEach((result) => {
    const key = result.classId;
    const policyReport = result.policyReport;
    let entry = byClass.get(key);
    if (!entry) {
      entry = {
        classId: result.classId,
        className: result.className,
        runs: 0,
        wins: 0,
        failures: 0,
        finalActTotal: 0,
        finalLevelTotal: 0,
        finalHandSizeTotal: 0,
        handSizeBonusRuns: 0,
        runewordsForgedTotal: 0,
        uniqueItemsFoundTotal: 0,
        questOutcomeTotal: 0,
        shrineOutcomeTotal: 0,
        eventOutcomeTotal: 0,
        opportunityOutcomeTotal: 0,
        preferredWeaponRuns: 0,
        armorResistanceTotal: 0,
        immunityRuns: 0,
        weaponFamilies: {},
        weaponRarities: {},
        activeRunewords: {},
        topCards: {},
        failuresByEncounter: {},
        rewardKinds: {},
        rewardEffects: {},
      };
      byClass.set(key, entry);
    }

    const summary = policyReport.summary;
    const finalBuild = summary.finalBuild;
    entry.runs += 1;
    entry.wins += policyReport.outcome === "run_complete" ? 1 : 0;
    entry.failures += policyReport.outcome === "run_failed" ? 1 : 0;
    entry.finalActTotal += Number(policyReport.finalActNumber || 0);
    entry.finalLevelTotal += Number(policyReport.finalLevel || 0);
    entry.finalHandSizeTotal += Number(finalBuild.hero.handSize || 0);
    entry.handSizeBonusRuns += Number(finalBuild.hero.handSize || 0) > 5 ? 1 : 0;
    entry.runewordsForgedTotal += Number(summary.runSummary.runewordsForged || 0);
    entry.uniqueItemsFoundTotal += Number(summary.runSummary.uniqueItemsFound || 0);
    entry.questOutcomeTotal += Number(summary.world.questOutcomes || 0);
    entry.shrineOutcomeTotal += Number(summary.world.shrineOutcomes || 0);
    entry.eventOutcomeTotal += Number(summary.world.eventOutcomes || 0);
    entry.opportunityOutcomeTotal += Number(summary.world.opportunityOutcomes || 0);
    entry.armorResistanceTotal += getTotalArmorResistance(finalBuild.armor);
    entry.immunityRuns += Array.isArray(finalBuild.armor?.immunities) && finalBuild.armor.immunities.length > 0 ? 1 : 0;

    if (finalBuild.weapon) {
      incrementCount(entry.weaponFamilies, finalBuild.weapon.family || "unknown");
      incrementCount(entry.weaponRarities, finalBuild.weapon.rarity || "unknown");
      if (finalBuild.weapon.preferredForClass) {
        entry.preferredWeaponRuns += 1;
      }
    }

    finalBuild.activeRunewords.forEach((runewordId) => {
      incrementCount(entry.activeRunewords, runewordId);
    });
    finalBuild.topCards.forEach((title) => {
      incrementCount(entry.topCards, title);
    });
    mergeCountMap(entry.rewardKinds, summary.rewardKindCounts);
    mergeCountMap(entry.rewardEffects, summary.rewardEffectCounts);
    incrementCount(entry.failuresByEncounter, getFailureLabel(policyReport.failure) || "none");
  });

  return [...byClass.values()]
    .map((entry) => ({
      classId: entry.classId,
      className: entry.className,
      runs: entry.runs,
      winRate: average(entry.wins, entry.runs, 3),
      failureRate: average(entry.failures, entry.runs, 3),
      averageFinalAct: average(entry.finalActTotal, entry.runs),
      averageFinalLevel: average(entry.finalLevelTotal, entry.runs),
      averageFinalHandSize: average(entry.finalHandSizeTotal, entry.runs),
      handSizeBonusRate: average(entry.handSizeBonusRuns, entry.runs, 3),
      averageRunewordsForged: average(entry.runewordsForgedTotal, entry.runs),
      averageUniqueItemsFound: average(entry.uniqueItemsFoundTotal, entry.runs),
      averageQuestOutcomes: average(entry.questOutcomeTotal, entry.runs),
      averageShrineOutcomes: average(entry.shrineOutcomeTotal, entry.runs),
      averageEventOutcomes: average(entry.eventOutcomeTotal, entry.runs),
      averageOpportunityOutcomes: average(entry.opportunityOutcomeTotal, entry.runs),
      preferredWeaponRate: average(entry.preferredWeaponRuns, entry.runs, 3),
      averageArmorResistance: average(entry.armorResistanceTotal, entry.runs),
      immunityRate: average(entry.immunityRuns, entry.runs, 3),
      topWeaponFamilies: topCounts(entry.weaponFamilies, 4),
      topWeaponRarities: topCounts(entry.weaponRarities, 4),
      topRunewords: topCounts(entry.activeRunewords, 6),
      topCards: topCounts(entry.topCards, 8),
      topFailurePoints: topCounts(entry.failuresByEncounter, 4),
      topRewardKinds: topCounts(entry.rewardKinds, 8),
      topRewardEffects: topCounts(entry.rewardEffects, 12),
    }))
    .sort((left, right) => left.className.localeCompare(right.className));
}

function aggregateCheckpointProgression(results) {
  const byAct = new Map();

  results.forEach((result) => {
    const preferredFamilies = new Set(
      Array.isArray(result.policyReport.summary.finalBuild.weapon?.preferredForClass)
        ? result.policyReport.summary.finalBuild.weapon.preferredForClass
        : []
    );
    result.policyReport.checkpoints.forEach((checkpoint) => {
      let entry = byAct.get(checkpoint.actNumber);
      if (!entry) {
        entry = {
          actNumber: checkpoint.actNumber,
          samples: 0,
          powerScoreTotal: 0,
          handSizeTotal: 0,
          handSizeBonusRuns: 0,
          runewordCountTotal: 0,
          armorResistanceTotal: 0,
          immunityRuns: 0,
          weaponFamilies: {},
          weaponRarities: {},
          probesByKind: {},
        };
        byAct.set(checkpoint.actNumber, entry);
      }
      entry.samples += 1;
      entry.powerScoreTotal += Number(checkpoint.powerScore || 0);
      entry.handSizeTotal += Number(checkpoint.hero.handSize || 0);
      entry.handSizeBonusRuns += Number(checkpoint.hero.handSize || 0) > 5 ? 1 : 0;
      entry.runewordCountTotal += Array.isArray(checkpoint.activeRunewords) ? checkpoint.activeRunewords.length : 0;
      entry.armorResistanceTotal += getTotalArmorResistance(checkpoint.armor);
      entry.immunityRuns += Array.isArray(checkpoint.armor?.immunities) && checkpoint.armor.immunities.length > 0 ? 1 : 0;
      if (checkpoint.weapon) {
        incrementCount(entry.weaponFamilies, checkpoint.weapon.family || "unknown");
        incrementCount(entry.weaponRarities, checkpoint.weapon.rarity || "unknown");
      }
      (checkpoint.probes || []).forEach((probe) => {
        if (!entry.probesByKind[probe.kind]) {
          entry.probesByKind[probe.kind] = {
            kind: probe.kind,
            samples: 0,
            powerRatioTotal: 0,
            winRateTotal: 0,
            averageTurnsTotal: 0,
            averageHeroLifePctTotal: 0,
          };
        }
        const probeEntry = entry.probesByKind[probe.kind];
        probeEntry.samples += 1;
        probeEntry.powerRatioTotal += Number(probe.powerRatio || 0);
        probeEntry.winRateTotal += Number(probe.winRate || 0);
        probeEntry.averageTurnsTotal += Number(probe.averageTurns || 0);
        probeEntry.averageHeroLifePctTotal += Number(probe.averageHeroLifePct || 0);
      });
    });
  });

  return [...byAct.values()]
    .map((entry) => ({
      actNumber: entry.actNumber,
      samples: entry.samples,
      averagePowerScore: average(entry.powerScoreTotal, entry.samples),
      averageHandSize: average(entry.handSizeTotal, entry.samples),
      handSizeBonusRate: average(entry.handSizeBonusRuns, entry.samples, 3),
      averageActiveRunewords: average(entry.runewordCountTotal, entry.samples),
      averageArmorResistance: average(entry.armorResistanceTotal, entry.samples),
      immunityRate: average(entry.immunityRuns, entry.samples, 3),
      topWeaponFamilies: topCounts(entry.weaponFamilies, 5),
      topWeaponRarities: topCounts(entry.weaponRarities, 4),
      probes: Object.values(entry.probesByKind)
        .map((probeEntry) => ({
          kind: probeEntry.kind,
          samples: probeEntry.samples,
          averagePowerRatio: average(probeEntry.powerRatioTotal, probeEntry.samples),
          averageWinRate: average(probeEntry.winRateTotal, probeEntry.samples, 3),
          averageTurns: average(probeEntry.averageTurnsTotal, probeEntry.samples),
          averageHeroLifePct: average(probeEntry.averageHeroLifePctTotal, probeEntry.samples),
        }))
        .sort((left, right) => left.kind.localeCompare(right.kind)),
    }))
    .sort((left, right) => left.actNumber - right.actNumber);
}

function aggregateWeakRuns(results) {
  const byClassPolicy = new Map();
  results.forEach((result) => {
    const key = `${result.classId}|${result.policyId}`;
    let entry = byClassPolicy.get(key);
    if (!entry) {
      entry = {
        classId: result.classId,
        className: result.className,
        policyId: result.policyId,
        policyLabel: result.policyReport.policyLabel,
        runs: 0,
        reachedAct2: 0,
        act1Fails: 0,
        failuresByEncounter: {},
      };
      byClassPolicy.set(key, entry);
    }
    entry.runs += 1;
    const reachedAct2 = result.policyReport.outcome === "reached_checkpoint" || Number(result.policyReport.finalActNumber || 0) >= 2;
    entry.reachedAct2 += reachedAct2 ? 1 : 0;
    entry.act1Fails += reachedAct2 ? 0 : 1;
    incrementCount(entry.failuresByEncounter, getFailureLabel(result.policyReport.failure) || "none");
  });

  return [...byClassPolicy.values()]
    .map((entry) => ({
      classId: entry.classId,
      className: entry.className,
      policyId: entry.policyId,
      policyLabel: entry.policyLabel,
      runs: entry.runs,
      act2ReachRate: average(entry.reachedAct2, entry.runs, 3),
      act1FailureRate: average(entry.act1Fails, entry.runs, 3),
      topFailurePoints: topCounts(entry.failuresByEncounter, 4),
    }))
    .sort((left, right) => left.className.localeCompare(right.className) || left.policyLabel.localeCompare(right.policyLabel));
}

function aggregateEndgame(report) {
  const scenarios = {};
  const encounters = {};

  report.classReports.forEach((classReport) => {
    classReport.scenarios.forEach((scenario) => {
      if (!scenarios[scenario.scenarioId]) {
        scenarios[scenario.scenarioId] = {
          scenarioId: scenario.scenarioId,
          label: scenario.label,
          samples: 0,
          winRateTotal: 0,
          averageTurnsTotal: 0,
          averageHeroLifePctTotal: 0,
        };
      }
      const scenarioEntry = scenarios[scenario.scenarioId];
      scenarioEntry.samples += 1;
      scenarioEntry.winRateTotal += Number(scenario.overall.winRate || 0);
      scenarioEntry.averageTurnsTotal += Number(scenario.overall.averageTurns || 0);
      scenarioEntry.averageHeroLifePctTotal += Number(scenario.overall.averageHeroLifePct || 0);

      scenario.encounters.forEach((encounter) => {
        const key = `${scenario.scenarioId}|${encounter.encounterId}`;
        if (!encounters[key]) {
          encounters[key] = {
            scenarioId: scenario.scenarioId,
            encounterId: encounter.encounterId,
            encounterName: encounter.encounterName,
            zoneTitle: encounter.zoneTitle,
            kind: encounter.kind,
            samples: 0,
            winRateTotal: 0,
            averageTurnsTotal: 0,
            averageHeroLifePctTotal: 0,
            powerRatioTotal: 0,
            enemyPowerScoreTotal: 0,
          };
        }
        const encounterEntry = encounters[key];
        encounterEntry.samples += 1;
        encounterEntry.winRateTotal += Number(encounter.winRate || 0);
        encounterEntry.averageTurnsTotal += Number(encounter.averageTurns || 0);
        encounterEntry.averageHeroLifePctTotal += Number(encounter.averageHeroLifePct || 0);
        encounterEntry.powerRatioTotal += Number(encounter.powerRatio || 0);
        encounterEntry.enemyPowerScoreTotal += Number(encounter.enemyPowerScore || 0);
      });
    });
  });

  return {
    scenarios: Object.values(scenarios)
      .map((entry) => ({
        scenarioId: entry.scenarioId,
        label: entry.label,
        samples: entry.samples,
        averageWinRate: average(entry.winRateTotal, entry.samples, 3),
        averageTurns: average(entry.averageTurnsTotal, entry.samples),
        averageHeroLifePct: average(entry.averageHeroLifePctTotal, entry.samples),
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    hardestEncounters: Object.values(encounters)
      .map((entry) => ({
        scenarioId: entry.scenarioId,
        encounterId: entry.encounterId,
        encounterName: entry.encounterName,
        zoneTitle: entry.zoneTitle,
        kind: entry.kind,
        samples: entry.samples,
        averageWinRate: average(entry.winRateTotal, entry.samples, 3),
        averageTurns: average(entry.averageTurnsTotal, entry.samples),
        averageHeroLifePct: average(entry.averageHeroLifePctTotal, entry.samples),
        averagePowerRatio: average(entry.powerRatioTotal, entry.samples),
        averageEnemyPowerScore: average(entry.enemyPowerScoreTotal, entry.samples),
      }))
      .sort((left, right) => left.averageWinRate - right.averageWinRate || right.averageTurns - left.averageTurns)
      .slice(0, 20),
  };
}

function printSummary(report) {
  console.log(`Comprehensive balance report generated at ${report.generatedAt}`);
  console.log(`Optimized aggressive full-run seeds: ${report.config.fullSeeds}`);
  report.optimizedFullRuns.byClass.forEach((entry) => {
    console.log(`  ${entry.className}: ${(entry.winRate * 100).toFixed(1)}% clears, avg level ${entry.averageFinalLevel}, hand ${entry.averageFinalHandSize}`);
  });
  console.log(`Weak early-run seeds: ${report.config.weakSeeds}`);
  const notableWeak = report.weakEarlyRuns.byClassPolicy
    .filter((entry) => entry.act1FailureRate > 0)
    .slice(0, 8);
  notableWeak.forEach((entry) => {
    console.log(`  ${entry.className} / ${entry.policyLabel}: ${(entry.act1FailureRate * 100).toFixed(1)}% fail before Act II`);
  });
  console.log("Hardest endgame checks:");
  report.endgame.hardestEncounters.slice(0, 6).forEach((entry) => {
    console.log(`  ${entry.scenarioId} ${entry.zoneTitle} / ${entry.encounterName}: ${(entry.averageWinRate * 100).toFixed(1)}% win, ${entry.averageTurns} turns`);
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { runProgressionSimulationReport, runBalanceSimulationReport } = loadHelpers();
  const skillAuditEntries = runSkillAudit();

  const optimizedResults = [];
  for (const classId of options.classIds) {
    for (let seedOffset = 0; seedOffset < options.fullSeeds; seedOffset += 1) {
      const policyReport = runSinglePolicy(runProgressionSimulationReport, classId, "aggressive", 5, 0, seedOffset);
      optimizedResults.push({
        classId,
        className: classId,
        seedOffset,
        policyId: "aggressive",
        policyReport,
      });
    }
  }

  const weakResults = [];
  for (const classId of options.classIds) {
    for (const policyId of options.weakPolicies) {
      for (let seedOffset = 0; seedOffset < options.weakSeeds; seedOffset += 1) {
        const policyReport = runSinglePolicy(runProgressionSimulationReport, classId, policyId, 2, 0, seedOffset);
        weakResults.push({
          classId,
          className: classId,
          policyId,
          seedOffset,
          policyReport,
        });
      }
    }
  }

  const checkpointResults = [];
  for (const classId of options.classIds) {
    const policyReport = runSinglePolicy(runProgressionSimulationReport, classId, "aggressive", 5, options.checkpointProbeRuns, 0);
    checkpointResults.push({
      classId,
      policyReport,
    });
  }

  const endgameReport = runBalanceSimulationReport({
    classIds: options.classIds,
    scenarioIds: ["mainline_conservative", "mainline_rewarded"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: options.endgameRuns,
  });

  const classNameById = Object.fromEntries(
    endgameReport.classReports.map((entry) => [entry.classId, entry.className])
  );
  optimizedResults.forEach((entry) => {
    entry.className = classNameById[entry.classId] || entry.classId;
  });
  weakResults.forEach((entry) => {
    entry.className = classNameById[entry.classId] || entry.classId;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    config: {
      classIds: options.classIds,
      fullSeeds: options.fullSeeds,
      weakSeeds: options.weakSeeds,
      weakPolicies: options.weakPolicies,
      checkpointProbeRuns: options.checkpointProbeRuns,
      endgameRuns: options.endgameRuns,
    },
    skillAudit: aggregateSkillAudit(skillAuditEntries),
    optimizedFullRuns: {
      byClass: aggregateAggressiveRuns(optimizedResults),
    },
    checkpointProgression: {
      byAct: aggregateCheckpointProgression(checkpointResults),
    },
    weakEarlyRuns: {
      byClassPolicy: aggregateWeakRuns(weakResults),
    },
    endgame: aggregateEndgame(endgameReport),
  };

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printSummary(report);
  console.log(`\nSaved JSON report to ${options.output}`);
}

main();
