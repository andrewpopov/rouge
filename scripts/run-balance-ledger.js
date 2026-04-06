#!/usr/bin/env node

const path = require("node:path");

const {
  ROOT,
  buildHistoryDataset,
  buildHistoryMarkdown,
  buildLedgerFromHistoryRows,
  buildLedgerMarkdown,
  buildMergedHistoryRows,
  getBalanceDatabasePath,
  getBalanceHistoryStorePath,
  getCommittedHistoryPath,
  getCommittedHistoryReportPath,
  readJsonSafe,
  writeJson,
  writeText,
} = require("./balance-ledger-utils.js");

function parseArgs(argv) {
  const parsed = {
    indexPath: path.join(ROOT, "artifacts", "balance", "index.json"),
    dbPath: getBalanceDatabasePath(ROOT),
    historyStorePath: getBalanceHistoryStorePath(ROOT),
    output: path.join(ROOT, "artifacts", "balance", "committed-ledger.json"),
    reportPath: path.join(ROOT, "artifacts", "balance", "committed-ledger.md"),
    historyOutputPath: getCommittedHistoryPath(ROOT),
    historyReportPath: getCommittedHistoryReportPath(ROOT),
    experimentId: "committed_archetype_campaign",
    scenarioType: "",
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
    if (arg === "--db" && next) {
      parsed.dbPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--history-store" && next) {
      parsed.historyStorePath = path.resolve(ROOT, next);
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
    if (arg === "--history-output" && next) {
      parsed.historyOutputPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--history-report" && next) {
      parsed.historyReportPath = path.resolve(ROOT, next);
      index += 1;
      continue;
    }
    if (arg === "--experiment" && next) {
      parsed.experimentId = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--scenario-type" && next) {
      parsed.scenarioType = next.trim();
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
    }
  }

  return parsed;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const indexEntries = readJsonSafe(options.indexPath, []);
  const mergedHistory = buildMergedHistoryRows(indexEntries, {
    dbPath: options.dbPath,
    experimentId: options.experimentId,
    scenarioType: options.scenarioType,
    historyStorePath: options.historyStorePath,
  });
  const historyDataset = buildHistoryDataset(mergedHistory.rows, {
    experimentId: options.experimentId,
    scenarioType: options.scenarioType,
  });
  const ledger = {
    ...buildLedgerFromHistoryRows(mergedHistory.rows, {
      experimentId: options.experimentId,
      scenarioType: options.scenarioType,
    }),
    sourceArtifacts: mergedHistory.sourceArtifacts,
    skippedArtifacts: mergedHistory.skippedArtifacts,
    persistedHistoryRowCount: mergedHistory.persistedHistoryRowCount,
    artifactHistoryRowCount: mergedHistory.artifactHistoryRowCount,
  };

  if (options.json) {
    console.log(JSON.stringify(ledger, null, 2));
    return;
  }

  writeJson(options.output, ledger);
  writeText(options.reportPath, buildLedgerMarkdown(ledger));
  writeJson(options.historyOutputPath, historyDataset);
  writeText(options.historyReportPath, buildHistoryMarkdown(historyDataset, ledger));
  console.log(options.output);
  console.log(options.reportPath);
  console.log(options.historyOutputPath);
  console.log(options.historyReportPath);
}

main();
