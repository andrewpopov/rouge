#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const { runPowerCalibrationReport } = require("../generated/tests/helpers/power-calibration-report.js");

function parseArgs(argv) {
  const parsed = {
    source: "synthetic",
    classIds: [],
    scenarioIds: [],
    policyIds: [],
    seedOffsets: [],
    encounterSetIds: [],
    runsPerEncounter: 3,
    encounterLimit: 0,
    determinismChecks: 2,
    throughActNumber: 5,
    probeRuns: 3,
    maxCombatTurns: 36,
    checkpointProbeProfile: "default",
    output: "",
    progressLog: "",
    statusFile: "",
    verboseProgress: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--source" && next) {
      parsed.source = next === "progression" ? "progression" : "synthetic";
      index += 1;
      continue;
    }
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
    if (arg === "--policy" && next) {
      parsed.policyIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--seed-offsets" && next) {
      parsed.seedOffsets = next.split(",").map((value) => Number.parseInt(value.trim(), 10)).filter(Number.isFinite);
      index += 1;
      continue;
    }
    if (arg === "--encounter-set" && next) {
      parsed.encounterSetIds = next.split(",").map((value) => value.trim()).filter(Boolean);
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
    if (arg === "--through-act" && next) {
      parsed.throughActNumber = Math.max(1, Math.min(5, Number.parseInt(next, 10) || parsed.throughActNumber));
      index += 1;
      continue;
    }
    if (arg === "--probe-runs" && next) {
      parsed.probeRuns = Math.max(0, Number.parseInt(next, 10) || parsed.probeRuns);
      index += 1;
      continue;
    }
    if (arg === "--probe-profile" && next) {
      parsed.checkpointProbeProfile = next === "pressure" ? "pressure" : "default";
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(12, Number.parseInt(next, 10) || parsed.maxCombatTurns);
      index += 1;
      continue;
    }
    if (arg === "--determinism-checks" && next) {
      parsed.determinismChecks = Math.max(1, Number.parseInt(next, 10) || parsed.determinismChecks);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--progress-log" && next) {
      parsed.progressLog = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--status-file" && next) {
      parsed.statusFile = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--verbose-progress") {
      parsed.verboseProgress = true;
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

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatProgressLine(event) {
  const unitParts = [];
  if (event.classId) {
    unitParts.push(event.classId);
  }
  if (event.policyId) {
    unitParts.push(event.policyId);
  }
  if (event.scenarioId) {
    unitParts.push(event.scenarioId);
  }
  if (Number.isFinite(event.seedOffset)) {
    unitParts.push(`seed ${event.seedOffset}`);
  }
  if (event.encounterSetId && event.encounterSetId !== "progression_checkpoints") {
    unitParts.push(event.encounterSetId);
  }
  if (event.detail) {
    unitParts.push(event.detail);
  }
  const statusLabel =
    event.status === "started"
      ? `start ${event.completedUnits + 1}/${event.totalUnits}`
      : event.status === "completed"
        ? `done ${event.completedUnits}/${event.totalUnits}`
        : event.status === "combat"
          ? `combat ${event.completedUnits + 1}/${event.totalUnits}`
          : event.status === "operation"
            ? `op ${event.completedUnits + 1}/${event.totalUnits}`
        : event.status;
  return [
    `[${new Date().toISOString()}]`,
    `pass ${event.passIndex}/${event.totalPasses}`,
    statusLabel,
    unitParts.join(" | "),
    `elapsed ${formatDuration(event.elapsedMs)}`,
  ].filter(Boolean).join(" ");
}

function writeProgressLine(progressLogPath, line) {
  fs.appendFileSync(progressLogPath, `${line}\n`, "utf8");
}

function writeLifecycleLine(progressLogPath, label, detail = "") {
  if (!progressLogPath) {
    return;
  }
  const suffix = detail ? ` ${detail}` : "";
  writeProgressLine(progressLogPath, `[${new Date().toISOString()}] ${label}${suffix}`);
}

function writeStatusFile(statusFilePath, payload) {
  if (!statusFilePath) {
    return;
  }
  fs.mkdirSync(path.dirname(statusFilePath), { recursive: true });
  const tmpPath = `${statusFilePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, statusFilePath);
}

function printKindSummary(summary) {
  console.log(`\n${summary.kind.toUpperCase()}`);
  console.log(
    `  samples ${summary.sampleCount}, runs ${summary.runCount}, avg ratio ${summary.averagePowerRatio.toFixed(2)}x, win ${formatPct(summary.averageWinRate)}, turns ${summary.averageTurns.toFixed(2)}`
  );
  console.log(
    `  target band: ${summary.targetBandSummary.band.min.toFixed(2)}-${summary.targetBandSummary.band.max.toFixed(2)}x, samples ${summary.targetBandSummary.encounterCount}, win ${formatPct(summary.targetBandSummary.winRate)}, turns ${summary.targetBandSummary.averageTurns.toFixed(2)}`
  );
  console.log(
    `  monotonicity: win ${summary.monotonicity.winRateNonDecreasing ? "ok" : "violations"}, turns ${summary.monotonicity.turnsNonIncreasing ? "ok" : "violations"}`
  );
  summary.buckets
    .filter((bucket) => bucket.encounterCount > 0)
    .forEach((bucket) => {
      console.log(
        `    ${bucket.label}: encounters ${bucket.encounterCount}, runs ${bucket.runCount}, ratio ${bucket.averagePowerRatio.toFixed(2)}x, win ${formatPct(bucket.winRate)}, turns ${bucket.averageTurns.toFixed(2)}`
      );
    });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const progressLogPath = options.progressLog || (options.output
    ? options.output.replace(/\.json$/i, ".progress.log")
    : "");
  const statusFilePath = options.statusFile || (options.output
    ? options.output.replace(/\.json$/i, ".status.json")
    : "");
  const calibrationStartedAt = new Date().toISOString();
  const baseStatus = {
    pid: process.pid,
    source: options.source,
    classIds: options.classIds,
    scenarioIds: options.scenarioIds,
    policyIds: options.policyIds,
    seedOffsets: options.seedOffsets,
    encounterSetIds: options.encounterSetIds,
    throughActNumber: options.throughActNumber,
    probeRuns: options.probeRuns,
    checkpointProbeProfile: options.checkpointProbeProfile,
    runsPerEncounter: options.runsPerEncounter,
    determinismChecks: options.determinismChecks,
    output: options.output || "",
    progressLog: progressLogPath || "",
    startedAt: calibrationStartedAt,
  };
  function updateStatus(partial) {
    writeStatusFile(statusFilePath, {
      ...baseStatus,
      updatedAt: new Date().toISOString(),
      ...partial,
    });
  }
  let finished = false;
  if (progressLogPath) {
    fs.mkdirSync(path.dirname(progressLogPath), { recursive: true });
    writeLifecycleLine(progressLogPath, "calibration start", `source=${options.source}`);
  }
  updateStatus({
    state: "running",
    finished: false,
    message: "calibration started",
  });
  process.on("exit", (code) => {
    if (!finished) {
      writeLifecycleLine(progressLogPath, "calibration exit", `code=${code}`);
      updateStatus({
        state: code === 0 ? "exited" : "crashed",
        finished: true,
        exitCode: code,
        message: `process exited before clean completion (code=${code})`,
      });
    }
  });
  process.on("SIGINT", () => {
    writeLifecycleLine(progressLogPath, "calibration signal", "SIGINT");
    updateStatus({
      state: "signaled",
      finished: true,
      signal: "SIGINT",
      message: "received SIGINT",
    });
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    writeLifecycleLine(progressLogPath, "calibration signal", "SIGTERM");
    updateStatus({
      state: "signaled",
      finished: true,
      signal: "SIGTERM",
      message: "received SIGTERM",
    });
    process.exit(143);
  });
  process.on("uncaughtException", (error) => {
    writeLifecycleLine(progressLogPath, "calibration uncaughtException", error?.stack || String(error));
    updateStatus({
      state: "crashed",
      finished: true,
      errorType: "uncaughtException",
      message: error?.stack || String(error),
    });
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    writeLifecycleLine(progressLogPath, "calibration unhandledRejection", reason?.stack || String(reason));
    updateStatus({
      state: "crashed",
      finished: true,
      errorType: "unhandledRejection",
      message: reason?.stack || String(reason),
    });
    process.exit(1);
  });
  const progressOptions = {
    ...options,
    onProgress: (event) => {
      const line = formatProgressLine(event);
      if (progressLogPath) {
        writeProgressLine(progressLogPath, line);
      }
      updateStatus({
        state: "running",
        finished: false,
        message: line,
        lastEvent: event,
        completedUnits: event.completedUnits,
        totalUnits: event.totalUnits,
      });
      console.error(line);
    },
  };
  const startedAt = Date.now();
  const report = runPowerCalibrationReport(progressOptions);

  if (options.output) {
    fs.writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  if (progressLogPath) {
    writeLifecycleLine(
      progressLogPath,
      "calibration complete",
      `samples=${report.overall.sampleCount} runs=${report.overall.runCount} elapsed=${formatDuration(Date.now() - startedAt)}`
    );
  }
  updateStatus({
    state: "completed",
    finished: true,
    exitCode: 0,
    message: "calibration completed",
    overall: report.overall,
  });
  finished = true;

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("Power calibration report");
  console.log(`Source: ${report.source}`);
  console.log(
    `Determinism: ${report.determinism.identical ? "stable" : "drift"} across ${report.determinism.checks} identical reruns`
  );
  console.log(
    `Overall: ${report.overall.sampleCount} encounter samples, ${report.overall.runCount} simulated runs, avg ratio ${report.overall.averagePowerRatio.toFixed(2)}x, win ${formatPct(report.overall.averageWinRate)}, turns ${report.overall.averageTurns.toFixed(2)}`
  );

  printKindSummary(report.kinds.boss);
  printKindSummary(report.kinds.elite);
  printKindSummary(report.kinds.battle);
}

main();
