const { execFileSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACT_HISTORY_LIMIT = 25;
const QUALITY_ARTIFACT_DIR = path.join(ROOT, "artifacts", "quality");

function getArtifactDirectory(rootDir = ROOT) {
  return path.join(rootDir, "artifacts", "quality");
}

function getHistoryFilePath(kind, rootDir = ROOT) {
  return path.join(getArtifactDirectory(rootDir), `${kind}-history.json`);
}

function getLatestReportPath(rootDir = ROOT) {
  return path.join(getArtifactDirectory(rootDir), "latest.md");
}

function ensureArtifactDirectory(rootDir = ROOT) {
  fs.mkdirSync(getArtifactDirectory(rootDir), { recursive: true });
}

function readHistoryFile(kind, rootDir = ROOT) {
  const filePath = getHistoryFilePath(kind, rootDir);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`Resetting malformed ${kind} artifact history at ${filePath}: ${detail}`);
    return [];
  }
}

function writeHistoryFile(kind, entries, rootDir = ROOT) {
  ensureArtifactDirectory(rootDir);
  fs.writeFileSync(getHistoryFilePath(kind, rootDir), `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function trimHistory(entries) {
  if (entries.length <= ARTIFACT_HISTORY_LIMIT) {
    return entries;
  }
  return entries.slice(entries.length - ARTIFACT_HISTORY_LIMIT);
}

function getLastMatchValue(text, pattern) {
  const regex = new RegExp(pattern, "gm");
  let match = regex.exec(text);
  let lastValue = null;

  while (match) {
    lastValue = match[1];
    match = regex.exec(text);
  }

  return lastValue;
}

function parseNodeTestSummary(output) {
  const tests = getLastMatchValue(output, "^ℹ tests\\s+(\\d+)$");
  if (tests === null) {
    return null;
  }

  const pass = getLastMatchValue(output, "^ℹ pass\\s+(\\d+)$");
  const fail = getLastMatchValue(output, "^ℹ fail\\s+(\\d+)$");
  const cancelled = getLastMatchValue(output, "^ℹ cancelled\\s+(\\d+)$");
  const skipped = getLastMatchValue(output, "^ℹ skipped\\s+(\\d+)$");
  const todo = getLastMatchValue(output, "^ℹ todo\\s+(\\d+)$");
  const durationMs = getLastMatchValue(output, "^ℹ duration_ms\\s+([\\d.]+)$");

  return {
    tests: Number(tests),
    pass: Number(pass || 0),
    fail: Number(fail || 0),
    cancelled: Number(cancelled || 0),
    skipped: Number(skipped || 0),
    todo: Number(todo || 0),
    durationMs: Number(durationMs || 0),
  };
}

function parseCoverageSummary(output) {
  const match = output.match(/^ℹ all files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/m);
  if (!match) {
    return null;
  }

  return {
    linePct: Number(match[1]),
    branchPct: Number(match[2]),
    functionsPct: Number(match[3]),
  };
}

function getGitContext(rootDir = ROOT) {
  return {
    branch: readGitValue(["rev-parse", "--abbrev-ref", "HEAD"], rootDir),
    commit: readGitValue(["rev-parse", "--short", "HEAD"], rootDir),
  };
}

function readGitValue(args, rootDir) {
  try {
    return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function formatRecordedAt(recordedAt) {
  return new Date(recordedAt).toISOString().replace("T", " ").replace(".000Z", "Z");
}

function formatDurationMs(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}

function formatCoverageValue(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "-";
}

function formatDelta(currentValue, previousValue) {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) {
    return "n/a";
  }

  const delta = currentValue - previousValue;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

function summarizeQualityStatus(entry) {
  if (entry.success) {
    return "success";
  }
  return entry.failedStage ? `failed (${entry.failedStage})` : "failed";
}

function summarizeTestCounts(summary) {
  if (!summary) {
    return "-";
  }
  return `${summary.pass}/${summary.fail}`;
}

function findPreviousSuccessfulCoverage(history, latestEntry) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry === latestEntry) {
      continue;
    }
    if (entry.success && entry.coverage) {
      return entry;
    }
  }

  return null;
}

function renderLatestReport(qualityHistory, coverageHistory) {
  const latestQuality = qualityHistory[qualityHistory.length - 1] || null;
  const latestCoverage = coverageHistory[coverageHistory.length - 1] || null;
  const previousCoverage = latestCoverage ? findPreviousSuccessfulCoverage(coverageHistory, latestCoverage) : null;
  const lines = [
    "# Quality Artifacts",
    "",
    "Generated locally by `npm run quality` and `npm run test:coverage`.",
    "",
  ];

  if (latestQuality) {
    lines.push("## Latest quality run");
    lines.push("");
    lines.push(`- Recorded: ${formatRecordedAt(latestQuality.recordedAt)}`);
    lines.push(`- Commit: ${latestQuality.gitBranch}@${latestQuality.gitCommit}`);
    lines.push(`- Status: ${summarizeQualityStatus(latestQuality)}`);
    lines.push(`- Duration: ${formatDurationMs(latestQuality.durationMs)}`);
    lines.push(`- Compiled tests (pass/fail): ${summarizeTestCounts(latestQuality.compiledTests)}`);
    lines.push(`- Built smoke (pass/fail): ${summarizeTestCounts(latestQuality.builtBundleSmoke)}`);
    lines.push("");
  } else {
    lines.push("## Latest quality run");
    lines.push("");
    lines.push("- No quality artifacts recorded yet.");
    lines.push("");
  }

  if (latestCoverage) {
    lines.push("## Latest coverage run");
    lines.push("");
    lines.push(`- Recorded: ${formatRecordedAt(latestCoverage.recordedAt)}`);
    lines.push(`- Commit: ${latestCoverage.gitBranch}@${latestCoverage.gitCommit}`);
    lines.push(`- Status: ${latestCoverage.success ? "success" : "failed"}`);
    lines.push(`- Duration: ${formatDurationMs(latestCoverage.durationMs)}`);
    if (latestCoverage.coverage) {
      lines.push(
        `- Coverage: lines ${formatCoverageValue(latestCoverage.coverage.linePct)} (${formatDelta(latestCoverage.coverage.linePct, previousCoverage?.coverage?.linePct)}), branches ${formatCoverageValue(latestCoverage.coverage.branchPct)} (${formatDelta(latestCoverage.coverage.branchPct, previousCoverage?.coverage?.branchPct)}), functions ${formatCoverageValue(latestCoverage.coverage.functionsPct)} (${formatDelta(latestCoverage.coverage.functionsPct, previousCoverage?.coverage?.functionsPct)})`
      );
    } else {
      lines.push("- Coverage: unavailable");
    }
    lines.push(`- Tests (pass/fail): ${summarizeTestCounts(latestCoverage.testSummary)}`);
    lines.push("");
  } else {
    lines.push("## Latest coverage run");
    lines.push("");
    lines.push("- No coverage artifacts recorded yet.");
    lines.push("");
  }

  lines.push("## Recent quality history");
  lines.push("");
  lines.push("| Recorded | Status | Compiled | E2E | Duration | Commit |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const entry of qualityHistory.slice(-5).reverse()) {
    lines.push(
      `| ${formatRecordedAt(entry.recordedAt)} | ${summarizeQualityStatus(entry)} | ${summarizeTestCounts(entry.compiledTests)} | ${summarizeTestCounts(entry.builtBundleSmoke)} | ${formatDurationMs(entry.durationMs)} | ${entry.gitCommit} |`
    );
  }
  if (qualityHistory.length === 0) {
    lines.push("| - | - | - | - | - | - |");
  }
  lines.push("");

  lines.push("## Recent coverage history");
  lines.push("");
  lines.push("| Recorded | Status | Lines | Branches | Functions | Duration | Commit |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const entry of coverageHistory.slice(-5).reverse()) {
    lines.push(
      `| ${formatRecordedAt(entry.recordedAt)} | ${entry.success ? "success" : "failed"} | ${formatCoverageValue(entry.coverage?.linePct)} | ${formatCoverageValue(entry.coverage?.branchPct)} | ${formatCoverageValue(entry.coverage?.functionsPct)} | ${formatDurationMs(entry.durationMs)} | ${entry.gitCommit} |`
    );
  }
  if (coverageHistory.length === 0) {
    lines.push("| - | - | - | - | - | - | - |");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function recordRunArtifact(kind, entry, options = {}) {
  const rootDir = options.rootDir || ROOT;
  const history = readHistoryFile(kind, rootDir);
  history.push(entry);
  const trimmedHistory = trimHistory(history);
  writeHistoryFile(kind, trimmedHistory, rootDir);

  const qualityHistory = kind === "quality" ? trimmedHistory : readHistoryFile("quality", rootDir);
  const coverageHistory = kind === "coverage" ? trimmedHistory : readHistoryFile("coverage", rootDir);
  ensureArtifactDirectory(rootDir);
  fs.writeFileSync(getLatestReportPath(rootDir), renderLatestReport(qualityHistory, coverageHistory), "utf8");
}

function runLoggedCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd || ROOT,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(chunk);
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolve({
        code: typeof code === "number" ? code : 1,
        signal,
        durationMs: Date.now() - startedAt,
        output,
      });
    });
  });
}

module.exports = {
  ARTIFACT_HISTORY_LIMIT,
  QUALITY_ARTIFACT_DIR,
  getArtifactDirectory,
  getHistoryFilePath,
  getLatestReportPath,
  getGitContext,
  parseCoverageSummary,
  parseNodeTestSummary,
  recordRunArtifact,
  renderLatestReport,
  runLoggedCommand,
  trimHistory,
};
