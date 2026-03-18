#!/usr/bin/env node

const path = require("node:path");
const {
  getGitContext,
  getLatestReportPath,
  parseCoverageSummary,
  parseNodeTestSummary,
  recordRunArtifact,
  runLoggedCommand,
} = require("./quality-artifacts");

const ROOT = path.resolve(__dirname, "..");
const NPM_EXECUTABLE = process.platform === "win32" ? "npm.cmd" : "npm";
const COVERAGE_THRESHOLDS = {
  lines: 88,
  branches: 65,
  functions: 90,
};
const COVERAGE_ARGS = [
  "--experimental-test-coverage",
  "--test-coverage-lines=88",
  "--test-coverage-branches=65",
  "--test-coverage-functions=90",
  '--test-coverage-include=generated/src/**/*.js',
  '--test-coverage-include=generated/tests/helpers/**/*.js',
  '--test-coverage-exclude=generated/src/app/main.js',
  '--test-coverage-exclude=generated/src/content/seed-loader.js',
  "--test",
  "generated/tests/*.test.js",
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
    testSummary: null,
    coverage: null,
    thresholds: COVERAGE_THRESHOLDS,
    error: "",
  };

  const stages = [
    { name: "compile", command: NPM_EXECUTABLE, args: ["run", "build"] },
    { name: "coverage", command: process.execPath, args: COVERAGE_ARGS },
  ];

  for (const stage of stages) {
    try {
      const result = await runLoggedCommand(stage.command, stage.args, { cwd: ROOT });
      entry.stages.push({
        name: stage.name,
        success: result.code === 0,
        durationMs: result.durationMs,
        exitCode: result.code,
      });

      if (stage.name === "coverage") {
        entry.testSummary = parseNodeTestSummary(result.output);
        entry.coverage = parseCoverageSummary(result.output);
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
  recordRunArtifact("coverage", entry);
  console.log(`Quality artifacts updated at ${getLatestReportPath(ROOT)}.`);

  if (!entry.success) {
    throw new Error(entry.error || `Stage ${entry.failedStage} failed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
