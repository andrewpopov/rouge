#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BALANCE_DIR = path.join(ROOT, "artifacts", "balance");

function parseArgs(argv) {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");

  const parsed = {
    suite: "nightly_full_matrix",
    output: path.join(BALANCE_DIR, `orchestrator-${stamp}.json`),
    log: path.join(BALANCE_DIR, `orchestrator-${stamp}.log`),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--suite" && next) {
      parsed.suite = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--output" && next) {
      parsed.output = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--log" && next) {
      parsed.log = path.resolve(ROOT, next);
      index += 1;
    }
  }

  return parsed;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.mkdirSync(path.dirname(options.log), { recursive: true });

  const logStream = fs.openSync(options.log, "a");
  const child = spawn("npm", [
    "run",
    "sim:orchestrate",
    "--",
    "--mode",
    "resume",
    "--suite",
    options.suite,
    "--output",
    options.output,
  ], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", logStream, logStream],
  });
  child.unref();

  const jobInfo = {
    startedAt: new Date().toISOString(),
    pid: child.pid,
    cwd: ROOT,
    suite: options.suite,
    output: options.output,
    log: options.log,
  };

  fs.writeFileSync(path.join(BALANCE_DIR, "latest-orchestrator-job.json"), JSON.stringify(jobInfo, null, 2));
  console.log(JSON.stringify(jobInfo, null, 2));
}

main();
