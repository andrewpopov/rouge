#!/usr/bin/env node

const path = require("node:path");

const { buildSeedOffsets, roundTo, runOrchestratorSpec } = require("./orchestrator-wrapper-utils");

const POWER_RATIO_BANDS = [
  { id: "underpowered", label: "Underpowered", maxExclusive: 1.0 },
  { id: "fair", label: "Fair", maxExclusive: 1.5 },
  { id: "strong", label: "Strong", maxExclusive: 2.25 },
  { id: "dominant", label: "Dominant", maxExclusive: Number.POSITIVE_INFINITY },
];

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];

function parseArgs(argv) {
  const parsed = {
    classIds: [...DEFAULT_CLASS_IDS],
    policyIds: ["aggressive", "balanced", "control", "bulwark"],
    throughActNumber: 4,
    probeRuns: 1,
    maxCombatTurns: 36,
    seedCount: 2,
    output: "",
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
    if (arg === "--policy" && next) {
      parsed.policyIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--through-act" && next) {
      parsed.throughActNumber = Math.max(1, Math.min(5, Number.parseInt(next, 10) || parsed.throughActNumber));
      index += 1;
      continue;
    }
    if (arg === "--probe-runs" && next) {
      parsed.probeRuns = Math.max(1, Number.parseInt(next, 10) || parsed.probeRuns);
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(12, Number.parseInt(next, 10) || parsed.maxCombatTurns);
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      parsed.seedCount = Math.max(1, Number.parseInt(next, 10) || parsed.seedCount);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function getRatioBand(powerRatio) {
  return POWER_RATIO_BANDS.find((band) => powerRatio < band.maxExclusive) || POWER_RATIO_BANDS[POWER_RATIO_BANDS.length - 1];
}

function aggregateBosses(runs) {
  const byBoss = new Map();

  runs.forEach((run) => {
    (run.checkpoints || []).forEach((checkpoint) => {
      (checkpoint.probes || []).forEach((probe) => {
        if (probe.kind !== "boss") {
          return;
        }
        const bossKey = `${probe.zoneTitle} / ${probe.encounterName}`;
        if (!byBoss.has(bossKey)) {
          byBoss.set(bossKey, {
            boss: bossKey,
            samples: 0,
            totalTurns: 0,
            totalWinRate: 0,
            totalPowerRatio: 0,
            minTurns: Number.POSITIVE_INFINITY,
            maxTurns: 0,
            classes: new Set(),
            policies: new Set(),
            seeds: new Set(),
            bands: {},
          });
        }

        const entry = byBoss.get(bossKey);
        entry.samples += 1;
        entry.totalTurns += Number(probe.averageTurns || 0);
        entry.totalWinRate += Number(probe.winRate || 0);
        entry.totalPowerRatio += Number(probe.powerRatio || 0);
        entry.minTurns = Math.min(entry.minTurns, Number(probe.averageTurns || 0));
        entry.maxTurns = Math.max(entry.maxTurns, Number(probe.averageTurns || 0));
        entry.classes.add(run.className);
        entry.policies.add(run.policyLabel);
        entry.seeds.add(run.seedOffset);

        const band = getRatioBand(Number(probe.powerRatio || 0));
        if (!entry.bands[band.id]) {
          entry.bands[band.id] = {
            bandId: band.id,
            bandLabel: band.label,
            samples: 0,
            totalTurns: 0,
            totalWinRate: 0,
            totalPowerRatio: 0,
            oneTurnishSamples: 0,
          };
        }
        const bandEntry = entry.bands[band.id];
        bandEntry.samples += 1;
        bandEntry.totalTurns += Number(probe.averageTurns || 0);
        bandEntry.totalWinRate += Number(probe.winRate || 0);
        bandEntry.totalPowerRatio += Number(probe.powerRatio || 0);
        if (Number(probe.averageTurns || 0) <= 1.5) {
          bandEntry.oneTurnishSamples += 1;
        }
      });
    });
  });

  return [...byBoss.values()]
    .map((entry) => ({
      boss: entry.boss,
      samples: entry.samples,
      avgTurns: roundTo(entry.totalTurns / Math.max(1, entry.samples)),
      minTurns: roundTo(entry.minTurns),
      maxTurns: roundTo(entry.maxTurns),
      avgWinRate: roundTo(entry.totalWinRate / Math.max(1, entry.samples), 3),
      avgPowerRatio: roundTo(entry.totalPowerRatio / Math.max(1, entry.samples)),
      classes: [...entry.classes].sort(),
      policies: [...entry.policies].sort(),
      seeds: [...entry.seeds].sort(),
      byPowerBand: Object.values(entry.bands).map((bandEntry) => ({
        bandId: bandEntry.bandId,
        bandLabel: bandEntry.bandLabel,
        samples: bandEntry.samples,
        avgTurns: roundTo(bandEntry.totalTurns / Math.max(1, bandEntry.samples)),
        avgWinRate: roundTo(bandEntry.totalWinRate / Math.max(1, bandEntry.samples), 3),
        avgPowerRatio: roundTo(bandEntry.totalPowerRatio / Math.max(1, bandEntry.samples)),
        oneTurnishRate: roundTo(bandEntry.oneTurnishSamples / Math.max(1, bandEntry.samples), 3),
      })),
    }))
    .sort((left, right) => left.boss.localeCompare(right.boss));
}

function printHumanReport(report) {
  console.log(
    `Boss strength report through Act ${report.throughActNumber} | ${report.seedCount} seeds | policies ${report.policyIds.join(", ")}`
  );
  report.bosses.forEach((boss) => {
    console.log(
      `\n${boss.boss}: avg turns ${boss.avgTurns}, min ${boss.minTurns}, max ${boss.maxTurns}, avg win ${(boss.avgWinRate * 100).toFixed(1)}%, avg ratio ${boss.avgPowerRatio}x`
    );
    boss.byPowerBand.forEach((band) => {
      console.log(
        `  ${band.bandLabel}: ${band.samples} samples, avg turns ${band.avgTurns}, avg ratio ${band.avgPowerRatio}x, one-turn-ish ${(band.oneTurnishRate * 100).toFixed(1)}%`
      );
    });
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const spec = {
    experimentId: "boss_strength_report",
    title: "Boss Strength Report",
    scenarioType: "boss_probe",
    classIds: options.classIds,
    policyIds: options.policyIds,
    seedOffsets: buildSeedOffsets(options.seedCount),
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    maxCombatTurns: options.maxCombatTurns,
    concurrency: 1,
    traceFailures: false,
    traceOutliers: false,
    slowRunThresholdMs: 60000,
    expectedBands: [],
    tags: ["wrapper", "boss"],
  };

  const result = runOrchestratorSpec(spec, { output: options.output });
  const report = {
    generatedAt: result.artifact.generatedAt,
    throughActNumber: options.throughActNumber,
    seedCount: options.seedCount,
    policyIds: options.policyIds,
    classIds: options.classIds,
    bosses: aggregateBosses(result.artifact.runs),
    artifactPath: options.output || "",
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  result.cleanup();
}

main();
