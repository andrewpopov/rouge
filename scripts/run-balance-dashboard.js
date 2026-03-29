#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const parsed = {
    indexPath: path.join(ROOT, "artifacts", "balance", "index.json"),
    latestJobPath: path.join(ROOT, "artifacts", "balance", "latest-orchestrator-job.json"),
    output: path.join(ROOT, "artifacts", "balance", "dashboard.md"),
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--index" && next) {
      parsed.indexPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--job" && next) {
      parsed.latestJobPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function loadJson(filePath, fallback) {
  if (!filePath || !fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildDashboard(indexEntries, latestJob) {
  const activeJob = latestJob
    ? (() => {
        const jobStatePath = latestJob.output ? latestJob.output.replace(/\.json$/i, ".job.json") : "";
        const jobState = loadJson(jobStatePath, null);
        const artifact = loadJson(latestJob.output || "", null);
        return {
          ...latestJob,
          jobState,
          artifactCoverage: artifact
            ? {
                completedRuns: artifact.aggregate?.completedRuns || 0,
                totalRuns: artifact.aggregate?.runs || 0,
                coverageRate: artifact.aggregate?.coverageRate || 0,
              }
            : null,
        };
      })()
    : null;

  const latestArtifacts = (Array.isArray(indexEntries) ? indexEntries : []).slice(0, 10).map((entry) => {
    const artifact = loadJson(entry.artifactPath || "", null);
    return {
      ...entry,
      bands: artifact?.bands || [],
      baselineComparison: artifact?.baselineComparison || null,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    activeJob,
    latestArtifacts,
  };
}

function buildMarkdown(dashboard) {
  const lines = [
    "# Balance Dashboard",
    "",
    `Generated: ${dashboard.generatedAt}`,
    "",
    "## Active Job",
  ];

  if (!dashboard.activeJob) {
    lines.push("- None");
  } else {
    const job = dashboard.activeJob;
    lines.push(`- Suite: \`${job.suite}\``);
    lines.push(`- Started: ${job.startedAt}`);
    lines.push(`- PID: ${job.pid}`);
    lines.push(`- Artifact: \`${job.output}\``);
    lines.push(`- Log: \`${job.log}\``);
    if (job.jobState) {
      lines.push(
        `- Progress: ${job.jobState.completedRuns}/${job.jobState.totalRuns} completed, ${job.jobState.pendingRunKeys.length} pending, ${job.jobState.failedRunKeys.length} failed, ${job.jobState.slowRunKeys.length} slow`
      );
    }
    if (job.artifactCoverage) {
      lines.push(`- Artifact coverage: ${(Number(job.artifactCoverage.coverageRate || 0) * 100).toFixed(1)}%`);
    }
  }

  lines.push("", "## Latest Artifacts");
  if ((dashboard.latestArtifacts || []).length === 0) {
    lines.push("- None");
  } else {
    dashboard.latestArtifacts.forEach((entry) => {
      const failedBands = (entry.bands || []).filter((band) => band.status === "fail").length;
      lines.push(
        `- \`${entry.experimentId}\` (${entry.scenarioType}): ${(Number(entry.coverageRate || 0) * 100).toFixed(1)}% coverage, ${(Number(entry.overallWinRate || 0) * 100).toFixed(1)}% win, ${failedBands} failed bands`
      );
    });
  }

  return lines.join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const dashboard = buildDashboard(
    loadJson(options.indexPath, []),
    loadJson(options.latestJobPath, null)
  );

  if (options.json) {
    console.log(JSON.stringify(dashboard, null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, buildMarkdown(dashboard));
  console.log(options.output);
}

main();
