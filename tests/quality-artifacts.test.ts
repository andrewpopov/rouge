export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const requireFromTests = createRequire(__filename);
const artifactHelpers = requireFromTests(path.resolve(__dirname, "../../scripts/quality-artifacts.js")) as {
  ARTIFACT_HISTORY_LIMIT: number;
  getArtifactDirectory(rootDir?: string): string;
  parseCoverageSummary(output: string): {
    branchPct: number;
    functionsPct: number;
    linePct: number;
  } | null;
  parseNodeTestSummary(output: string): {
    cancelled: number;
    durationMs: number;
    fail: number;
    pass: number;
    skipped: number;
    tests: number;
    todo: number;
  } | null;
  recordRunArtifact(kind: "quality" | "coverage", entry: Record<string, unknown>, options?: { rootDir?: string }): void;
};

test("quality artifact helpers parse node-test and coverage summaries", () => {
  const testSummary = artifactHelpers.parseNodeTestSummary(`
✔ smoke one (10.1ms)
✔ smoke two (11.3ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 123.45
`);
  assert.deepEqual(testSummary, {
    tests: 2,
    pass: 2,
    fail: 0,
    cancelled: 0,
    skipped: 1,
    todo: 0,
    durationMs: 123.45,
  });

  const coverageSummary = artifactHelpers.parseCoverageSummary(`
ℹ start of coverage report
ℹ -------------------------------------------------------------------
ℹ all files                                   |  91.10 |    66.22 |   95.89 |
ℹ -------------------------------------------------------------------
ℹ end of coverage report
`);
  assert.deepEqual(coverageSummary, {
    linePct: 91.1,
    branchPct: 66.22,
    functionsPct: 95.89,
  });
});

test("quality artifact recording trims history and writes a latest trend report", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-quality-artifacts-"));

  for (let index = 0; index < artifactHelpers.ARTIFACT_HISTORY_LIMIT + 2; index += 1) {
    artifactHelpers.recordRunArtifact(
      "quality",
      {
        recordedAt: new Date(Date.UTC(2026, 2, 9, 10, index, 0)).toISOString(),
        gitBranch: "master",
        gitCommit: `q${index}`,
        success: true,
        failedStage: "",
        durationMs: 1000 + index,
        stages: [
          { name: "lint", durationMs: 100, success: true, exitCode: 0 },
          { name: "build", durationMs: 200, success: true, exitCode: 0 },
          { name: "test:compiled", durationMs: 300, success: true, exitCode: 0 },
          { name: "test:e2e:built", durationMs: 400, success: true, exitCode: 0 },
        ],
        compiledTests: { pass: 180, fail: 0 },
        builtBundleSmoke: { pass: 3, fail: 0 },
      },
      { rootDir: tempRoot }
    );
  }

  artifactHelpers.recordRunArtifact(
    "quality",
    {
      recordedAt: new Date(Date.UTC(2026, 2, 9, 10, 59, 0)).toISOString(),
      gitBranch: "master",
      gitCommit: "q-final",
      success: true,
      failedStage: "",
      durationMs: 2100,
      stages: [
        { name: "lint", durationMs: 140, success: true, exitCode: 0 },
        { name: "build", durationMs: 260, success: true, exitCode: 0 },
        { name: "test:compiled", durationMs: 360, success: true, exitCode: 0 },
        { name: "test:e2e:built", durationMs: 520, success: true, exitCode: 0 },
      ],
      compiledTests: { pass: 182, fail: 0 },
      builtBundleSmoke: { pass: 4, fail: 0 },
    },
    { rootDir: tempRoot }
  );

  artifactHelpers.recordRunArtifact(
    "coverage",
    {
      recordedAt: new Date(Date.UTC(2026, 2, 9, 11, 0, 0)).toISOString(),
      gitBranch: "master",
      gitCommit: "c0",
      success: true,
      failedStage: "",
      durationMs: 5000,
      stages: [],
      testSummary: { pass: 180, fail: 0 },
      coverage: { linePct: 91.1, branchPct: 66.22, functionsPct: 95.89 },
      thresholds: { lines: 90, branches: 65, functions: 95 },
    },
    { rootDir: tempRoot }
  );

  artifactHelpers.recordRunArtifact(
    "coverage",
    {
      recordedAt: new Date(Date.UTC(2026, 2, 9, 12, 0, 0)).toISOString(),
      gitBranch: "master",
      gitCommit: "c1",
      success: true,
      failedStage: "",
      durationMs: 5100,
      stages: [],
      testSummary: { pass: 180, fail: 0 },
      coverage: { linePct: 91.2, branchPct: 66.3, functionsPct: 95.95 },
      thresholds: { lines: 90, branches: 65, functions: 95 },
    },
    { rootDir: tempRoot }
  );

  const artifactDir = artifactHelpers.getArtifactDirectory(tempRoot);
  const qualityHistory = JSON.parse(fs.readFileSync(path.join(artifactDir, "quality-history.json"), "utf8")) as Array<{
    gitCommit: string;
  }>;
  const latestReport = fs.readFileSync(path.join(artifactDir, "latest.md"), "utf8");

  assert.equal(qualityHistory.length, artifactHelpers.ARTIFACT_HISTORY_LIMIT);
  assert.equal(qualityHistory[0].gitCommit, "q3");
  assert.match(latestReport, /Latest quality run/);
  assert.match(latestReport, /Latest coverage run/);
  assert.match(latestReport, /master@c1/);
  assert.match(
    latestReport,
    /Delta vs previous success: compiled pass \+2, fail \+0; built smoke pass \+1, fail \+0; total duration \+1\.07 s/
  );
  assert.match(
    latestReport,
    /Stage deltas: lint \+40 ms, build \+60 ms, test:compiled \+60 ms, test:e2e:built \+120 ms/
  );
  assert.match(latestReport, /91\.20 \(\+0\.10\)/);
  assert.match(latestReport, /Delta vs previous success: tests pass \+0, fail \+0; total duration \+100 ms/);
  assert.match(latestReport, /Threshold headroom: lines \+1\.20, branches \+1\.30, functions \+0\.95/);
});
