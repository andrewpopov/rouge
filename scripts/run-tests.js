#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const suite = process.argv[2] || "default";
const testsDir = path.join(__dirname, "..", "generated", "tests");

const SLOW_TEST_FILES = new Set([
  "balance-orchestration.test.js",
  "power-calibration-report.test.js",
  "power-curve-report.test.js",
  "run-progression-simulator.test.js",
]);

function isSelectedSuite(testFileName) {
  if (suite === "all") {
    return true;
  }
  if (suite === "slow") {
    return SLOW_TEST_FILES.has(testFileName);
  }
  if (suite === "default") {
    return !SLOW_TEST_FILES.has(testFileName);
  }

  throw new Error(`Unknown test suite "${suite}". Expected "default", "slow", or "all".`);
}

const selectedTests = fs
  .readdirSync(testsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.js"))
  .map((entry) => entry.name)
  .sort()
  .filter(isSelectedSuite)
  .map((fileName) => path.join(testsDir, fileName));

if (selectedTests.length === 0) {
  console.log(`No tests matched suite "${suite}".`);
  process.exit(0);
}

const result = spawnSync(process.execPath, ["--test", ...selectedTests], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status === null ? 1 : result.status);
