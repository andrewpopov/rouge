#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HELPER_PATH = path.join(ROOT, "generated", "tests", "helpers", "balance-orchestration.js");

function parseArgs(argv) {
  const parsed = {
    mode: "run",
    suite: "",
    specPath: "",
    output: "",
    reportPath: "",
    indexPath: path.join(ROOT, "artifacts", "balance", "index.json"),
    jobPath: "",
    tracesDir: "",
    baselinePath: "",
    stopAfter: 0,
    json: false,
    token: "",
    tokenFile: "",
    taskJson: "",
    classIds: [],
    policyIds: [],
    scenarioIds: [],
    targetArchetypeId: "",
    commitmentMode: "",
    commitAct: 0,
    commitCheckpoint: "",
    throughActNumber: 0,
    probeRuns: -1,
    maxCombatTurns: 0,
    encounterSetId: "",
    runsPerEncounter: 0,
    encounterLimit: 0,
    seedOffsets: [],
    seedCount: 0,
    concurrency: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--mode" && next) {
      parsed.mode = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--suite" && next) {
      parsed.suite = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--spec" && next) {
      parsed.specPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--report" && next) {
      parsed.reportPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--index" && next) {
      parsed.indexPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--job" && next) {
      parsed.jobPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--traces-dir" && next) {
      parsed.tracesDir = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--baseline" && next) {
      parsed.baselinePath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--stop-after" && next) {
      parsed.stopAfter = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--token" && next) {
      parsed.token = next;
      index += 1;
      continue;
    }
    if (arg === "--token-file" && next) {
      parsed.tokenFile = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--task-json" && next) {
      parsed.taskJson = next;
      index += 1;
      continue;
    }
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
    if (arg === "--scenario" && next) {
      parsed.scenarioIds = next.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === "--archetype" && next) {
      parsed.targetArchetypeId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--commitment-mode" && next) {
      parsed.commitmentMode = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--commit-act" && next) {
      parsed.commitAct = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--commit-checkpoint" && next) {
      parsed.commitCheckpoint = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--through-act" && next) {
      parsed.throughActNumber = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--probe-runs" && next) {
      parsed.probeRuns = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--max-turns" && next) {
      parsed.maxCombatTurns = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--set" && next) {
      parsed.encounterSetId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--runs" && next) {
      parsed.runsPerEncounter = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--limit" && next) {
      parsed.encounterLimit = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--seeds" && next) {
      parsed.seedCount = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--seed-offsets" && next) {
      parsed.seedOffsets = next.split(",").map((value) => Number.parseInt(value.trim(), 10)).filter((value) => Number.isFinite(value) && value >= 0);
      index += 1;
      continue;
    }
    if (arg === "--concurrency" && next) {
      parsed.concurrency = Math.max(0, Number.parseInt(next, 10) || 0);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function ensureHelper() {
  if (!fs.existsSync(HELPER_PATH)) {
    console.error("Missing compiled balance orchestration helper. Run `npm run build` first.");
    process.exit(1);
  }
  return require(HELPER_PATH);
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function defaultArtifactPaths(spec, parsed) {
  const baseDir = path.join(ROOT, "artifacts", "balance");
  const output = parsed.output || path.join(baseDir, `${spec.experimentId}.json`);
  const reportPath = parsed.reportPath || output.replace(/\.json$/i, ".md");
  const jobPath = parsed.jobPath || output.replace(/\.json$/i, ".job.json");
  const tracesDir = parsed.tracesDir || output.replace(/\.json$/i, "-traces");
  return { output, reportPath, jobPath, tracesDir };
}

function applyOverrides(spec, parsed) {
  const next = { ...spec };
  if (parsed.classIds.length > 0) {
    next.classIds = [...parsed.classIds];
  }
  if (parsed.policyIds.length > 0) {
    next.policyIds = [...parsed.policyIds];
  }
  if (parsed.scenarioIds.length > 0) {
    next.scenarioIds = [...parsed.scenarioIds];
  }
  if (parsed.targetArchetypeId) {
    next.targetArchetypeId = parsed.targetArchetypeId;
  }
  if (parsed.commitmentMode) {
    next.commitmentMode = parsed.commitmentMode;
  }
  if (parsed.commitAct > 0) {
    next.commitAct = parsed.commitAct;
  }
  if (parsed.commitCheckpoint) {
    next.commitCheckpoint = parsed.commitCheckpoint;
  }
  if (parsed.throughActNumber > 0) {
    next.throughActNumber = parsed.throughActNumber;
  }
  if (parsed.probeRuns >= 0) {
    next.probeRuns = parsed.probeRuns;
  }
  if (parsed.maxCombatTurns > 0) {
    next.maxCombatTurns = parsed.maxCombatTurns;
  }
  if (parsed.encounterSetId) {
    next.encounterSetId = parsed.encounterSetId;
  }
  if (parsed.runsPerEncounter > 0) {
    next.runsPerEncounter = parsed.runsPerEncounter;
  }
  if (parsed.encounterLimit > 0) {
    next.encounterLimit = parsed.encounterLimit;
  }
  if (parsed.seedOffsets.length > 0) {
    next.seedOffsets = [...parsed.seedOffsets];
  } else if (parsed.seedCount > 0) {
    next.seedOffsets = Array.from({ length: parsed.seedCount }, (_, index) => index);
  }
  if (parsed.concurrency > 0) {
    next.concurrency = parsed.concurrency;
  }
  if (parsed.baselinePath) {
    next.baselineArtifactPath = parsed.baselinePath;
  }
  return next;
}

function loadSpec(parsed, helper) {
  if (parsed.specPath) {
    return applyOverrides(loadJson(parsed.specPath), parsed);
  }
  const catalog = helper.getBalanceExperimentCatalog();
  const suiteId = parsed.suite || "nightly_full_matrix";
  if (!catalog[suiteId]) {
    throw new Error(`Unknown balance suite: ${suiteId}`);
  }
  return applyOverrides(catalog[suiteId], parsed);
}

function loadExistingArtifact(outputPath) {
  if (!outputPath || !fs.existsSync(outputPath)) {
    return null;
  }
  return loadJson(outputPath);
}

function upsertIndex(indexPath, artifactPath, artifact) {
  let index = [];
  if (fs.existsSync(indexPath)) {
    index = loadJson(indexPath);
  }
  const entry = {
    experimentId: artifact.experiment.experimentId,
    title: artifact.experiment.title,
    scenarioType: artifact.experiment.scenarioType,
    generatedAt: artifact.generatedAt,
    artifactPath,
    runCount: artifact.runs.length,
    coverageRate: artifact.aggregate.coverageRate,
    overallWinRate: artifact.aggregate.overall.winRate,
  };
  const remaining = Array.isArray(index)
    ? index.filter((candidate) => candidate.artifactPath !== artifactPath)
    : [];
  remaining.unshift(entry);
  writeJson(indexPath, remaining.slice(0, 50));
}

function buildPendingTasks(mode, tasks, existingArtifact, slowThresholdMs) {
  const existingMap = new Map();
  (existingArtifact?.runs || []).forEach((record) => {
    existingMap.set(record.runKey, record);
  });

  if (mode === "retry-failures") {
    return tasks.filter((task) => existingMap.get(task.runKey ? `${task.runKey.experimentId}:${task.runKey.scenarioType}:${task.runKey.classId}:${task.runKey.policyId}:${task.runKey.seedOffset}` : "")?.outcome === "run_failed");
  }

  if (mode === "retry-slow-runs") {
    return tasks.filter((task) => {
      const key = `${task.runKey.experimentId}:${task.runKey.scenarioType}:${task.runKey.classId}:${task.runKey.policyId}:${task.runKey.seedOffset}`;
      return Number(existingMap.get(key)?.durationMs || 0) >= Number(slowThresholdMs || 0) && Number(slowThresholdMs || 0) > 0;
    });
  }

  return tasks.filter((task) => {
    const key = `${task.runKey.experimentId}:${task.runKey.scenarioType}:${task.runKey.classId}:${task.runKey.policyId}:${task.runKey.seedOffset}`;
    return !existingMap.has(key);
  });
}

function buildArtifactState(helper, spec, outputPath) {
  const existing = loadExistingArtifact(outputPath);
  const baselineArtifact =
    spec.baselineArtifactPath && fs.existsSync(spec.baselineArtifactPath) ? loadJson(spec.baselineArtifactPath) : null;
  const artifact = existing || helper.buildBalanceArtifact(spec, [], baselineArtifact);
  return { artifact, baselineArtifact };
}

function writeArtifactBundle(helper, spec, records, paths, baselineArtifact) {
  const artifact = helper.buildBalanceArtifact(spec, records, baselineArtifact);
  writeJson(paths.output, artifact);
  writeText(paths.reportPath, helper.buildBalanceMarkdownReport(artifact));
  upsertIndex(paths.indexPath, paths.output, artifact);
  return artifact;
}

function writeJobState(paths, state) {
  writeJson(paths.jobPath, state);
}

function buildChildTaskPayload(spec, task) {
  return Buffer.from(JSON.stringify({ spec, task }), "utf8").toString("base64url");
}

function runTaskChild(taskJson) {
  const helper = ensureHelper();
  const payload = JSON.parse(Buffer.from(taskJson, "base64url").toString("utf8"));
  const result = helper.executeBalanceRunTask(payload.spec, payload.task);
  console.log(JSON.stringify(result));
}

async function runTaskPool(helper, spec, tasks, paths, existingArtifact, baselineArtifact, parsed) {
  const runMap = new Map();
  (existingArtifact?.runs || []).forEach((record) => runMap.set(record.runKey, record));
  const totalRuns = helper.buildBalanceRunTasks(spec).length;
  const queue = [...tasks];
  const concurrency = Math.max(1, Number(spec.concurrency || 1));
  const taskTimeoutMs = Math.max(
    5 * 60 * 1000,
    Number(spec.taskTimeoutMs || 0),
    Number(spec.slowRunThresholdMs || 0) > 0 ? Number(spec.slowRunThresholdMs || 0) * 20 : 0
  );
  let completedNewRuns = 0;
  let completedRuns = runMap.size;

  const updateJob = () => {
    const pendingRunKeys = queue.map((task) => `${task.runKey.experimentId}:${task.runKey.scenarioType}:${task.runKey.classId}:${task.runKey.policyId}:${task.runKey.seedOffset}`);
    const records = [...runMap.values()];
    writeJobState(paths, {
      startedAt: existingArtifact?.generatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: parsed.mode,
      experimentId: spec.experimentId,
      artifactPath: paths.output,
      totalRuns,
      completedRuns,
      pendingRunKeys,
      failedRunKeys: records.filter((record) => record.outcome === "run_failed").map((record) => record.runKey),
      slowRunKeys: records.filter((record) => Number(record.durationMs || 0) >= Number(spec.slowRunThresholdMs || 0) && Number(spec.slowRunThresholdMs || 0) > 0).map((record) => record.runKey),
    });
  };

  const persistResult = (result) => {
    result.tracePayloads.forEach((trace) => {
      const tracePath = path.join(paths.tracesDir, `${trace.traceId.replace(/[^a-z0-9:_-]+/gi, "_")}.json`);
      writeJson(tracePath, trace.payload);
      const recordTrace = result.record.traces.find((entry) => entry.traceId === trace.traceId);
      if (recordTrace) {
        recordTrace.artifactPath = tracePath;
      }
    });
    runMap.set(result.record.runKey, result.record);
    completedNewRuns += 1;
    completedRuns = runMap.size;
    writeArtifactBundle(helper, spec, [...runMap.values()], paths, baselineArtifact);
    updateJob();
  };

  await new Promise((resolve, reject) => {
    let active = 0;
    let stopped = false;

    const launchNext = () => {
      if (stopped) {
        return;
      }
      while (active < concurrency && queue.length > 0) {
        if (parsed.stopAfter > 0 && completedNewRuns >= parsed.stopAfter) {
          stopped = true;
          break;
        }
        const task = queue.shift();
        if (!task) {
          break;
        }
        active += 1;
        const child = spawn(process.execPath, [__filename, "--mode", "run-task", "--task-json", buildChildTaskPayload(spec, task)], {
          cwd: ROOT,
          stdio: ["ignore", "pipe", "pipe"],
        });
        let timedOut = false;
        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, taskTimeoutMs);
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => {
          stdout += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
          stderr += String(chunk);
        });
        child.on("close", (code) => {
          clearTimeout(timeoutHandle);
          active -= 1;
          if (timedOut) {
            const result = {
              record: helper.createSyntheticBalanceRunRecord(spec, task, {
                outcome: "run_failed",
                durationMs: taskTimeoutMs,
                failureLabel: "Worker timeout",
                errorMessage: `Timed out after ${taskTimeoutMs}ms`,
              }),
              tracePayloads: [],
            };
            persistResult(result);
            console.error(`[timeout] ${result.record.classId} / ${result.record.policyId} / seed ${result.record.seedOffset}: exceeded ${taskTimeoutMs}ms`);
            if (queue.length === 0 && active === 0) {
              resolve(undefined);
              return;
            }
            launchNext();
            return;
          }
          if (code !== 0) {
            const result = {
              record: helper.createSyntheticBalanceRunRecord(spec, task, {
                outcome: "run_failed",
                durationMs: 0,
                failureLabel: "Worker error",
                errorMessage: (stderr || `Child task failed with exit code ${code}`).trim(),
              }),
              tracePayloads: [],
            };
            persistResult(result);
            console.error(`[worker-error] ${result.record.classId} / ${result.record.policyId} / seed ${result.record.seedOffset}: ${stderr || `exit ${code}`}`);
            if (queue.length === 0 && active === 0) {
              resolve(undefined);
              return;
            }
            launchNext();
            return;
          }
          try {
            const result = JSON.parse(stdout);
            persistResult(result);
            console.log(`[${completedRuns}/${totalRuns}] ${result.record.className} / ${result.record.policyLabel} / seed ${result.record.seedOffset}: ${result.record.outcome}, act ${result.record.finalActNumber}, level ${result.record.finalLevel}`);
            if (queue.length === 0 && active === 0) {
              resolve(undefined);
              return;
            }
            launchNext();
          } catch (error) {
            reject(error);
          }
        });
      }

      if ((queue.length === 0 || stopped) && active === 0) {
        resolve(undefined);
      }
    };

    launchNext();
  });
}

function handleTraceFromToken(helper, parsed) {
  const token = parsed.token || (parsed.tokenFile ? fs.readFileSync(parsed.tokenFile, "utf8").trim() : "");
  if (!token) {
    throw new Error("trace-from-token requires --token or --token-file");
  }
  const payload = helper.traceFromBalanceSnapshotToken(token, parsed.maxCombatTurns || undefined);
  if (parsed.output) {
    writeJson(parsed.output, payload);
  }
  if (parsed.json || !parsed.output) {
    console.log(JSON.stringify(payload, null, 2));
  }
}

function handleReport(helper, parsed) {
  if (!parsed.output) {
    throw new Error("report mode requires --output pointing to an existing artifact");
  }
  const artifact = loadJson(parsed.output);
  const spec = artifact.experiment;
  const baselineArtifact =
    parsed.baselinePath && fs.existsSync(parsed.baselinePath) ? loadJson(parsed.baselinePath) :
    spec.baselineArtifactPath && fs.existsSync(spec.baselineArtifactPath) ? loadJson(spec.baselineArtifactPath) : null;
  const rebuilt = helper.buildBalanceArtifact(spec, artifact.runs || [], baselineArtifact);
  const paths = {
    ...defaultArtifactPaths(spec, parsed),
    indexPath: parsed.indexPath,
  };
  writeJson(paths.output, rebuilt);
  writeText(paths.reportPath, helper.buildBalanceMarkdownReport(rebuilt));
  upsertIndex(paths.indexPath, paths.output, rebuilt);
  if (parsed.json) {
    console.log(JSON.stringify(rebuilt, null, 2));
  } else {
    console.log(`Rebuilt ${paths.output}`);
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.mode === "run-task") {
    runTaskChild(parsed.taskJson);
    return;
  }

  const helper = ensureHelper();

  if (parsed.mode === "trace-from-token") {
    handleTraceFromToken(helper, parsed);
    return;
  }

  if (parsed.mode === "report") {
    handleReport(helper, parsed);
    return;
  }

  const spec = loadSpec(parsed, helper);
  const paths = {
    ...defaultArtifactPaths(spec, parsed),
    indexPath: parsed.indexPath,
  };
  const { artifact: existingArtifact, baselineArtifact } = buildArtifactState(helper, spec, paths.output);
  const tasks = helper.buildBalanceRunTasks(spec);
  const pendingTasks = buildPendingTasks(parsed.mode, tasks, existingArtifact, spec.slowRunThresholdMs);

  writeJobState(paths, {
    startedAt: existingArtifact?.generatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: parsed.mode,
    experimentId: spec.experimentId,
    artifactPath: paths.output,
    totalRuns: tasks.length,
    completedRuns: Array.isArray(existingArtifact?.runs) ? existingArtifact.runs.length : 0,
    pendingRunKeys: pendingTasks.map((task) => `${task.runKey.experimentId}:${task.runKey.scenarioType}:${task.runKey.classId}:${task.runKey.policyId}:${task.runKey.seedOffset}`),
    failedRunKeys: Array.isArray(existingArtifact?.runs) ? existingArtifact.runs.filter((record) => record.outcome === "run_failed").map((record) => record.runKey) : [],
    slowRunKeys: Array.isArray(existingArtifact?.runs) ? existingArtifact.runs.filter((record) => Number(record.durationMs || 0) >= Number(spec.slowRunThresholdMs || 0) && Number(spec.slowRunThresholdMs || 0) > 0).map((record) => record.runKey) : [],
  });

  await runTaskPool(helper, spec, pendingTasks, paths, existingArtifact, baselineArtifact, parsed);

  const finalArtifact = loadJson(paths.output);
  if (parsed.json) {
    console.log(JSON.stringify(finalArtifact, null, 2));
  } else {
    console.log(`Completed ${finalArtifact.runs.length}/${tasks.length} runs -> ${paths.output}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
