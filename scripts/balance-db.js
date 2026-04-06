const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const ROOT = path.resolve(__dirname, "..");

function getBalanceDatabasePath(rootDir = ROOT) {
  return path.join(rootDir, "artifacts", "balance", "balance-runs.db");
}

function resolveDatabasePath(options = {}) {
  if (options.dbPath) {
    return path.isAbsolute(options.dbPath)
      ? options.dbPath
      : path.resolve(options.rootDir || ROOT, options.dbPath);
  }
  return getBalanceDatabasePath(options.rootDir || ROOT);
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS balance_run_history (
      history_row_id TEXT PRIMARY KEY,
      run_key TEXT NOT NULL,
      experiment_id TEXT NOT NULL,
      scenario_type TEXT NOT NULL,
      class_id TEXT NOT NULL,
      class_name TEXT NOT NULL,
      policy_id TEXT NOT NULL,
      policy_label TEXT NOT NULL,
      seed_offset INTEGER NOT NULL,
      target_archetype_id TEXT NOT NULL,
      target_archetype_label TEXT NOT NULL,
      target_band TEXT NOT NULL,
      commitment_mode TEXT NOT NULL,
      outcome TEXT NOT NULL,
      final_act_number INTEGER NOT NULL,
      final_level INTEGER NOT NULL,
      failure_encounter_name TEXT NOT NULL,
      failure_zone_title TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      final_checkpoint_power_score REAL NOT NULL,
      last_boss_power_ratio REAL NOT NULL,
      training_fully_realized INTEGER NOT NULL,
      slot3_skill_id TEXT NOT NULL,
      source_artifact_path TEXT NOT NULL,
      source_generated_at TEXT NOT NULL,
      history_row_json TEXT NOT NULL,
      run_record_json TEXT,
      inserted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_balance_run_history_run_key
      ON balance_run_history (run_key, completed_at DESC, source_generated_at DESC, history_row_id DESC);
    CREATE INDEX IF NOT EXISTS idx_balance_run_history_artifact
      ON balance_run_history (source_artifact_path, completed_at DESC, history_row_id DESC);
    CREATE INDEX IF NOT EXISTS idx_balance_run_history_experiment
      ON balance_run_history (experiment_id, scenario_type, completed_at DESC);

    CREATE TABLE IF NOT EXISTS balance_artifacts (
      artifact_path TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      title TEXT NOT NULL,
      scenario_type TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      report_path TEXT NOT NULL,
      index_path TEXT NOT NULL,
      job_path TEXT NOT NULL,
      traces_dir TEXT NOT NULL,
      run_count INTEGER NOT NULL,
      completed_runs INTEGER NOT NULL,
      coverage_rate REAL NOT NULL,
      overall_win_rate REAL NOT NULL,
      aggregate_json TEXT NOT NULL,
      bands_json TEXT NOT NULL,
      baseline_comparison_json TEXT NOT NULL,
      artifact_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_balance_artifacts_generated_at
      ON balance_artifacts (generated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_balance_artifacts_experiment
      ON balance_artifacts (experiment_id, scenario_type, generated_at DESC);

    CREATE TABLE IF NOT EXISTS balance_job_state (
      artifact_path TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      job_path TEXT NOT NULL,
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      total_runs INTEGER NOT NULL,
      completed_runs INTEGER NOT NULL,
      pending_run_keys_json TEXT NOT NULL,
      failed_run_keys_json TEXT NOT NULL,
      slow_run_keys_json TEXT NOT NULL,
      state_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_balance_job_state_updated_at
      ON balance_job_state (updated_at DESC);
  `);
}

function openBalanceDatabase(options = {}) {
  const dbPath = resolveDatabasePath(options);
  if (options.readonly && !fs.existsSync(dbPath)) {
    return null;
  }
  if (!options.readonly) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath, {
    readonly: Boolean(options.readonly),
    fileMustExist: Boolean(options.readonly),
  });
  if (!options.readonly) {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    ensureSchema(db);
  }
  return db;
}

function parseJson(value, fallback = null) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function stringifyJson(value, fallback = "null") {
  if (typeof value === "undefined") {
    return fallback;
  }
  return JSON.stringify(value);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function insertBalanceHistoryRow(db, historyRow, options = {}) {
  if (!db || !historyRow) {
    return;
  }
  db.prepare(`
    INSERT OR IGNORE INTO balance_run_history (
      history_row_id,
      run_key,
      experiment_id,
      scenario_type,
      class_id,
      class_name,
      policy_id,
      policy_label,
      seed_offset,
      target_archetype_id,
      target_archetype_label,
      target_band,
      commitment_mode,
      outcome,
      final_act_number,
      final_level,
      failure_encounter_name,
      failure_zone_title,
      completed_at,
      duration_ms,
      final_checkpoint_power_score,
      last_boss_power_ratio,
      training_fully_realized,
      slot3_skill_id,
      source_artifact_path,
      source_generated_at,
      history_row_json,
      run_record_json
    ) VALUES (
      @history_row_id,
      @run_key,
      @experiment_id,
      @scenario_type,
      @class_id,
      @class_name,
      @policy_id,
      @policy_label,
      @seed_offset,
      @target_archetype_id,
      @target_archetype_label,
      @target_band,
      @commitment_mode,
      @outcome,
      @final_act_number,
      @final_level,
      @failure_encounter_name,
      @failure_zone_title,
      @completed_at,
      @duration_ms,
      @final_checkpoint_power_score,
      @last_boss_power_ratio,
      @training_fully_realized,
      @slot3_skill_id,
      @source_artifact_path,
      @source_generated_at,
      @history_row_json,
      @run_record_json
    )
  `).run({
    history_row_id: String(historyRow.historyRowId || historyRow.history_row_id || ""),
    run_key: String(historyRow.runKey || historyRow.rowKey || ""),
    experiment_id: String(historyRow.experimentId || ""),
    scenario_type: String(historyRow.scenarioType || ""),
    class_id: String(historyRow.classId || ""),
    class_name: String(historyRow.className || ""),
    policy_id: String(historyRow.policyId || ""),
    policy_label: String(historyRow.policyLabel || ""),
    seed_offset: toNumber(historyRow.seedOffset || 0),
    target_archetype_id: String(historyRow.targetArchetypeId || ""),
    target_archetype_label: String(historyRow.targetArchetypeLabel || ""),
    target_band: String(historyRow.targetBand || ""),
    commitment_mode: String(historyRow.commitmentMode || ""),
    outcome: String(historyRow.outcome || ""),
    final_act_number: toNumber(historyRow.finalActNumber || 0),
    final_level: toNumber(historyRow.finalLevel || 0),
    failure_encounter_name: String(historyRow.failureEncounterName || ""),
    failure_zone_title: String(historyRow.failureZoneTitle || ""),
    completed_at: String(historyRow.completedAt || ""),
    duration_ms: toNumber(historyRow.durationMs || 0),
    final_checkpoint_power_score: toNumber(historyRow.finalCheckpoint?.powerScore || 0),
    last_boss_power_ratio: toNumber(historyRow.lastBoss?.powerRatio || 0),
    training_fully_realized: historyRow.trainingRealization?.fullyRealized ? 1 : 0,
    slot3_skill_id: String(historyRow.skillBar?.equippedSkillIds?.slot3 || ""),
    source_artifact_path: String(historyRow.sourceArtifactPath || ""),
    source_generated_at: String(historyRow.sourceGeneratedAt || ""),
    history_row_json: stringifyJson(historyRow, "{}"),
    run_record_json: options.runRecord ? stringifyJson(options.runRecord, "{}") : null,
  });
}

function readBalanceHistoryRowsFromDatabase(db, options = {}) {
  if (!db) {
    return [];
  }
  const clauses = [];
  const params = [];
  if (options.experimentId) {
    clauses.push("experiment_id = ?");
    params.push(options.experimentId);
  }
  if (options.scenarioType) {
    clauses.push("scenario_type = ?");
    params.push(options.scenarioType);
  }
  if (options.artifactPath) {
    clauses.push("source_artifact_path = ?");
    params.push(options.artifactPath);
  }
  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT history_row_json
    FROM balance_run_history
    ${whereClause}
    ORDER BY completed_at ASC, source_generated_at ASC, history_row_id ASC
  `).all(...params)
    .map((row) => parseJson(row.history_row_json, null))
    .filter(Boolean);
}

function readLatestRunRecordsForArtifact(db, artifactPath) {
  if (!db || !artifactPath) {
    return [];
  }
  const rows = db.prepare(`
    SELECT run_key, run_record_json
    FROM balance_run_history
    WHERE source_artifact_path = ?
    ORDER BY completed_at ASC, source_generated_at ASC, history_row_id ASC
  `).all(artifactPath);
  const latestByRunKey = new Map();
  rows.forEach((row) => {
    const parsed = parseJson(row.run_record_json, null);
    if (parsed) {
      latestByRunKey.set(String(row.run_key || ""), parsed);
    }
  });
  return [...latestByRunKey.values()];
}

function upsertBalanceArtifact(db, artifactPath, artifact, options = {}) {
  if (!db || !artifactPath || !artifact) {
    return;
  }
  db.prepare(`
    INSERT INTO balance_artifacts (
      artifact_path,
      experiment_id,
      title,
      scenario_type,
      generated_at,
      report_path,
      index_path,
      job_path,
      traces_dir,
      run_count,
      completed_runs,
      coverage_rate,
      overall_win_rate,
      aggregate_json,
      bands_json,
      baseline_comparison_json,
      artifact_json,
      updated_at
    ) VALUES (
      @artifact_path,
      @experiment_id,
      @title,
      @scenario_type,
      @generated_at,
      @report_path,
      @index_path,
      @job_path,
      @traces_dir,
      @run_count,
      @completed_runs,
      @coverage_rate,
      @overall_win_rate,
      @aggregate_json,
      @bands_json,
      @baseline_comparison_json,
      @artifact_json,
      datetime('now')
    )
    ON CONFLICT(artifact_path) DO UPDATE SET
      experiment_id = excluded.experiment_id,
      title = excluded.title,
      scenario_type = excluded.scenario_type,
      generated_at = excluded.generated_at,
      report_path = excluded.report_path,
      index_path = excluded.index_path,
      job_path = excluded.job_path,
      traces_dir = excluded.traces_dir,
      run_count = excluded.run_count,
      completed_runs = excluded.completed_runs,
      coverage_rate = excluded.coverage_rate,
      overall_win_rate = excluded.overall_win_rate,
      aggregate_json = excluded.aggregate_json,
      bands_json = excluded.bands_json,
      baseline_comparison_json = excluded.baseline_comparison_json,
      artifact_json = excluded.artifact_json,
      updated_at = datetime('now')
  `).run({
    artifact_path: artifactPath,
    experiment_id: String(artifact.experiment?.experimentId || ""),
    title: String(artifact.experiment?.title || ""),
    scenario_type: String(artifact.experiment?.scenarioType || ""),
    generated_at: String(artifact.generatedAt || ""),
    report_path: String(options.reportPath || ""),
    index_path: String(options.indexPath || ""),
    job_path: String(options.jobPath || ""),
    traces_dir: String(options.tracesDir || ""),
    run_count: toNumber(Array.isArray(artifact.runs) ? artifact.runs.length : 0),
    completed_runs: toNumber(
      typeof artifact.aggregate?.completedRuns !== "undefined"
        ? artifact.aggregate.completedRuns
        : Array.isArray(artifact.runs)
          ? artifact.runs.length
          : 0
    ),
    coverage_rate: toNumber(artifact.aggregate?.coverageRate || 0),
    overall_win_rate: toNumber(artifact.aggregate?.overall?.winRate || 0),
    aggregate_json: stringifyJson(artifact.aggregate, "{}"),
    bands_json: stringifyJson(artifact.bands, "[]"),
    baseline_comparison_json: stringifyJson(artifact.baselineComparison, "null"),
    artifact_json: stringifyJson(artifact, "{}"),
  });
}

function readBalanceArtifactFromDatabase(db, artifactPath) {
  if (!db || !artifactPath) {
    return null;
  }
  const row = db.prepare(`
    SELECT artifact_json
    FROM balance_artifacts
    WHERE artifact_path = ?
  `).get(artifactPath);
  return row ? parseJson(row.artifact_json, null) : null;
}

function readBalanceArtifactIndexFromDatabase(db, options = {}) {
  if (!db) {
    return [];
  }
  const clauses = [];
  const params = [];
  if (options.experimentId) {
    clauses.push("experiment_id = ?");
    params.push(options.experimentId);
  }
  if (options.scenarioType) {
    clauses.push("scenario_type = ?");
    params.push(options.scenarioType);
  }
  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.max(1, Number(options.limit || 50));
  return db.prepare(`
    SELECT
      artifact_path AS artifactPath,
      experiment_id AS experimentId,
      title,
      scenario_type AS scenarioType,
      generated_at AS generatedAt,
      run_count AS runCount,
      coverage_rate AS coverageRate,
      overall_win_rate AS overallWinRate
    FROM balance_artifacts
    ${whereClause}
    ORDER BY generated_at DESC
    LIMIT ?
  `).all(...params, limit);
}

function readBalanceArtifactsFromDatabase(db, options = {}) {
  if (!db) {
    return [];
  }
  const limit = Math.max(1, Number(options.limit || 10));
  return db.prepare(`
    SELECT artifact_json
    FROM balance_artifacts
    ORDER BY generated_at DESC
    LIMIT ?
  `).all(limit)
    .map((row) => parseJson(row.artifact_json, null))
    .filter(Boolean);
}

function upsertBalanceJobState(db, state, options = {}) {
  if (!db || !state) {
    return;
  }
  db.prepare(`
    INSERT INTO balance_job_state (
      artifact_path,
      experiment_id,
      mode,
      job_path,
      started_at,
      updated_at,
      total_runs,
      completed_runs,
      pending_run_keys_json,
      failed_run_keys_json,
      slow_run_keys_json,
      state_json
    ) VALUES (
      @artifact_path,
      @experiment_id,
      @mode,
      @job_path,
      @started_at,
      @updated_at,
      @total_runs,
      @completed_runs,
      @pending_run_keys_json,
      @failed_run_keys_json,
      @slow_run_keys_json,
      @state_json
    )
    ON CONFLICT(artifact_path) DO UPDATE SET
      experiment_id = excluded.experiment_id,
      mode = excluded.mode,
      job_path = excluded.job_path,
      started_at = excluded.started_at,
      updated_at = excluded.updated_at,
      total_runs = excluded.total_runs,
      completed_runs = excluded.completed_runs,
      pending_run_keys_json = excluded.pending_run_keys_json,
      failed_run_keys_json = excluded.failed_run_keys_json,
      slow_run_keys_json = excluded.slow_run_keys_json,
      state_json = excluded.state_json
  `).run({
    artifact_path: String(options.artifactPath || state.artifactPath || ""),
    experiment_id: String(state.experimentId || ""),
    mode: String(state.mode || ""),
    job_path: String(options.jobPath || ""),
    started_at: String(state.startedAt || ""),
    updated_at: String(state.updatedAt || ""),
    total_runs: toNumber(state.totalRuns || 0),
    completed_runs: toNumber(state.completedRuns || 0),
    pending_run_keys_json: stringifyJson(state.pendingRunKeys, "[]"),
    failed_run_keys_json: stringifyJson(state.failedRunKeys, "[]"),
    slow_run_keys_json: stringifyJson(state.slowRunKeys, "[]"),
    state_json: stringifyJson(state, "{}"),
  });
}

function readBalanceJobStateByArtifactPath(db, artifactPath) {
  if (!db || !artifactPath) {
    return null;
  }
  const row = db.prepare(`
    SELECT state_json
    FROM balance_job_state
    WHERE artifact_path = ?
  `).get(artifactPath);
  return row ? parseJson(row.state_json, null) : null;
}

function readLatestBalanceJobState(db) {
  if (!db) {
    return null;
  }
  const row = db.prepare(`
    SELECT state_json
    FROM balance_job_state
    ORDER BY updated_at DESC
    LIMIT 1
  `).get();
  return row ? parseJson(row.state_json, null) : null;
}

module.exports = {
  ROOT,
  getBalanceDatabasePath,
  openBalanceDatabase,
  insertBalanceHistoryRow,
  readBalanceHistoryRowsFromDatabase,
  readLatestRunRecordsForArtifact,
  upsertBalanceArtifact,
  readBalanceArtifactFromDatabase,
  readBalanceArtifactIndexFromDatabase,
  readBalanceArtifactsFromDatabase,
  upsertBalanceJobState,
  readBalanceJobStateByArtifactPath,
  readLatestBalanceJobState,
};
