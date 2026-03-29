const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const ORCHESTRATOR_SCRIPT = path.join(ROOT, "scripts", "run-balance-orchestrator.js");

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildSeedOffsets(seedCount) {
  return Array.from({ length: Math.max(1, Number(seedCount || 1)) }, (_, index) => index);
}

function deriveArtifactPaths(basePath) {
  return {
    output: basePath,
    reportPath: basePath.replace(/\.json$/i, ".md"),
    indexPath: basePath.replace(/\.json$/i, ".index.json"),
    jobPath: basePath.replace(/\.json$/i, ".job.json"),
    tracesDir: basePath.replace(/\.json$/i, "-traces"),
  };
}

function runOrchestratorSpec(spec, options = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-orch-wrapper-"));
  const specPath = path.join(tempDir, "spec.json");
  const artifactBase = options.output
    ? path.resolve(ROOT, options.output)
    : path.join(tempDir, `${spec.experimentId}.json`);
  const paths = deriveArtifactPaths(artifactBase);

  fs.mkdirSync(path.dirname(paths.output), { recursive: true });
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  const args = [
    ORCHESTRATOR_SCRIPT,
    "--mode",
    options.mode || "run",
    "--spec",
    specPath,
    "--output",
    paths.output,
    "--report",
    paths.reportPath,
    "--index",
    paths.indexPath,
    "--job",
    paths.jobPath,
    "--traces-dir",
    paths.tracesDir,
  ];

  if (Number(options.stopAfter || 0) > 0) {
    args.push("--stop-after", String(options.stopAfter));
  }

  execFileSync(process.execPath, args, {
    cwd: ROOT,
    stdio: "pipe",
    maxBuffer: 1024 * 1024 * 50,
  });

  const artifact = JSON.parse(fs.readFileSync(paths.output, "utf8"));
  const report = fs.existsSync(paths.reportPath) ? fs.readFileSync(paths.reportPath, "utf8") : "";
  const index = fs.existsSync(paths.indexPath) ? JSON.parse(fs.readFileSync(paths.indexPath, "utf8")) : [];

  return {
    artifact,
    report,
    index,
    paths,
    cleanup() {
      if (!options.output) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    },
  };
}

module.exports = {
  ROOT,
  ORCHESTRATOR_SCRIPT,
  buildSeedOffsets,
  roundTo,
  runOrchestratorSpec,
};
