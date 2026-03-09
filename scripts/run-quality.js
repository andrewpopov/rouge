#!/usr/bin/env node

const path = require("node:path");
const {
  getGitContext,
  getLatestReportPath,
  parseNodeTestSummary,
  recordRunArtifact,
  runLoggedCommand,
} = require("./quality-artifacts");

const ROOT = path.resolve(__dirname, "..");
const NPM_EXECUTABLE = process.platform === "win32" ? "npm.cmd" : "npm";

const STAGES = [
  { name: "lint", command: NPM_EXECUTABLE, args: ["run", "lint"] },
  { name: "build", command: NPM_EXECUTABLE, args: ["run", "build"] },
  { name: "test:compiled", command: NPM_EXECUTABLE, args: ["run", "test:compiled"] },
  { name: "test:e2e:built", command: NPM_EXECUTABLE, args: ["run", "test:e2e:built"] },
];

async function main() {
  const startedAt = Date.now();
  const gitContext = getGitContext(ROOT);
  const entry = {
    recordedAt: new Date().toISOString(),
    gitBranch: gitContext.branch,
    gitCommit: gitContext.commit,
    success: true,
    failedStage: "",
    durationMs: 0,
    stages: [],
    compiledTests: null,
    builtBundleSmoke: null,
    error: "",
  };

  for (const stage of STAGES) {
    try {
      const result = await runLoggedCommand(stage.command, stage.args, { cwd: ROOT });
      entry.stages.push({
        name: stage.name,
        success: result.code === 0,
        durationMs: result.durationMs,
        exitCode: result.code,
      });

      if (stage.name === "test:compiled") {
        entry.compiledTests = parseNodeTestSummary(result.output);
      }

      if (stage.name === "test:e2e:built") {
        entry.builtBundleSmoke = parseNodeTestSummary(result.output);
      }

      if (result.code !== 0) {
        entry.success = false;
        entry.failedStage = stage.name;
        entry.error = `Stage ${stage.name} exited with code ${result.code}.`;
        break;
      }
    } catch (error) {
      entry.success = false;
      entry.failedStage = stage.name;
      entry.error = error instanceof Error ? error.message : String(error);
      entry.stages.push({
        name: stage.name,
        success: false,
        durationMs: 0,
        exitCode: 1,
      });
      break;
    }
  }

  entry.durationMs = Date.now() - startedAt;
  recordRunArtifact("quality", entry);
  console.log(`Quality artifacts updated at ${getLatestReportPath(ROOT)}.`);

  if (!entry.success) {
    throw new Error(entry.error || `Stage ${entry.failedStage} failed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
