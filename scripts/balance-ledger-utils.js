const fs = require("node:fs");
const path = require("node:path");
const {
  getBalanceDatabasePath,
  insertBalanceHistoryRow,
  openBalanceDatabase,
  readBalanceHistoryRowsFromDatabase,
} = require("./balance-db.js");

const ROOT = path.resolve(__dirname, "..");

function getBalanceArtifactDirectory(rootDir = ROOT) {
  return path.join(rootDir, "artifacts", "balance");
}

function getBalanceHistoryStorePath(rootDir = ROOT) {
  return path.join(getBalanceArtifactDirectory(rootDir), "row-history.jsonl");
}

function getCommittedHistoryPath(rootDir = ROOT) {
  return path.join(getBalanceArtifactDirectory(rootDir), "committed-history.json");
}

function getCommittedHistoryReportPath(rootDir = ROOT) {
  return path.join(getBalanceArtifactDirectory(rootDir), "committed-history.md");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonSafe(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value, "utf8");
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
}

function normalizeSkillBar(skillBar) {
  if (!skillBar) {
    return null;
  }
  return {
    favoredTreeId: String(skillBar.favoredTreeId || ""),
    unlockedSkillCount: toNumber(skillBar.unlockedSkillCount || 0),
    unlockedSkillIds: toStringArray(skillBar.unlockedSkillIds),
    unlockedSkillNames: toStringArray(skillBar.unlockedSkillNames),
    slotStateLabel: String(skillBar.slotStateLabel || ""),
    equippedSkillIds: {
      slot1: String(skillBar.equippedSkillIds?.slot1 || ""),
      slot2: String(skillBar.equippedSkillIds?.slot2 || ""),
      slot3: String(skillBar.equippedSkillIds?.slot3 || ""),
    },
    equippedSkillNames: {
      slot1: String(skillBar.equippedSkillNames?.slot1 || ""),
      slot2: String(skillBar.equippedSkillNames?.slot2 || ""),
      slot3: String(skillBar.equippedSkillNames?.slot3 || ""),
    },
  };
}

function buildTrainingRealization(requestedTrainingLoadout, skillBar) {
  if (!requestedTrainingLoadout && !skillBar) {
    return null;
  }
  const requestedUnlockedSkillIds = toStringArray(requestedTrainingLoadout?.unlockedSkillIds);
  const actualUnlockedSkillIds = toStringArray(skillBar?.unlockedSkillIds);
  const slot2RequestedSkillId = String(requestedTrainingLoadout?.equippedSkillIds?.slot2 || "");
  const slot3RequestedSkillId = String(requestedTrainingLoadout?.equippedSkillIds?.slot3 || "");
  const slot2ActualSkillId = String(skillBar?.equippedSkillIds?.slot2 || "");
  const slot3ActualSkillId = String(skillBar?.equippedSkillIds?.slot3 || "");
  const favoredTreeRequested = String(requestedTrainingLoadout?.favoredTreeId || "");
  const favoredTreeActual = String(skillBar?.favoredTreeId || "");
  const favoredTreeMatched = !favoredTreeRequested || favoredTreeRequested === favoredTreeActual;
  const slot2Matched = !slot2RequestedSkillId || slot2RequestedSkillId === slot2ActualSkillId;
  const slot3Matched = !slot3RequestedSkillId || slot3RequestedSkillId === slot3ActualSkillId;
  const unlockedMatched = requestedUnlockedSkillIds.every((skillId) => actualUnlockedSkillIds.includes(skillId));
  return {
    favoredTreeRequested,
    favoredTreeActual,
    favoredTreeMatched,
    requestedUnlockedSkillIds,
    actualUnlockedSkillIds,
    slot2RequestedSkillId,
    slot2ActualSkillId,
    slot2Matched,
    slot3RequestedSkillId,
    slot3ActualSkillId,
    slot3Matched,
    fullyRealized: favoredTreeMatched && slot2Matched && slot3Matched && unlockedMatched,
  };
}

function pickFinalCheckpoint(run) {
  if (run?.analysis?.finalCheckpoint) {
    return {
      checkpointId: String(run.analysis.finalCheckpoint.checkpointId || ""),
      checkpointKind: String(run.analysis.finalCheckpoint.checkpointKind || ""),
      actNumber: toNumber(run.analysis.finalCheckpoint.actNumber || 0),
      level: toNumber(run.analysis.finalCheckpoint.level || 0),
      powerScore: toNumber(run.analysis.finalCheckpoint.powerScore || 0),
      bossReadinessScore: toNumber(run.analysis.finalCheckpoint.bossReadinessScore || 0),
      bossAdjustedPowerScore: toNumber(run.analysis.finalCheckpoint.bossAdjustedPowerScore || 0),
    };
  }
  const checkpoints = Array.isArray(run?.checkpoints) ? run.checkpoints : [];
  const finalCheckpoint = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  if (!finalCheckpoint) {
    return null;
  }
  return {
    checkpointId: String(finalCheckpoint.checkpointId || ""),
    checkpointKind: String(finalCheckpoint.checkpointKind || ""),
    actNumber: toNumber(finalCheckpoint.actNumber || 0),
    level: toNumber(finalCheckpoint.level || 0),
    powerScore: toNumber(finalCheckpoint.powerScore || 0),
    bossReadinessScore: toNumber(finalCheckpoint.bossReadinessScore || 0),
    bossAdjustedPowerScore: toNumber(finalCheckpoint.bossAdjustedPowerScore || 0),
  };
}

function pickEncounter(summary, kind) {
  const encounterResults = Array.isArray(summary?.encounterResults) ? summary.encounterResults : [];
  if (encounterResults.length === 0) {
    return null;
  }
  if (!kind) {
    return encounterResults[encounterResults.length - 1];
  }
  for (let index = encounterResults.length - 1; index >= 0; index -= 1) {
    if (encounterResults[index]?.kind === kind) {
      return encounterResults[index];
    }
  }
  return null;
}

function summarizeEncounter(encounter) {
  if (!encounter) {
    return null;
  }
  return {
    encounterId: String(encounter.encounterId || ""),
    encounterName: String(encounter.encounterName || ""),
    zoneTitle: String(encounter.zoneTitle || ""),
    kind: String(encounter.kind || ""),
    outcome: String(encounter.outcome || ""),
    turns: toNumber(encounter.turns || 0),
    heroPowerScore: toNumber(encounter.heroPowerScore || 0),
    enemyPowerScore: toNumber(encounter.enemyPowerScore || 0),
    powerRatio: toNumber(encounter.powerRatio || 0),
  };
}

function summarizeFinalBuild(run) {
  const finalBuild = run?.summary?.finalBuild || {};
  const deckProfile = finalBuild.deckProfile || {};
  const analysisFinalBuild = run?.analysis?.finalBuild || {};
  return {
    hero: analysisFinalBuild.hero || {
      maxLife: toNumber(finalBuild.hero?.maxLife || 0),
      maxEnergy: toNumber(finalBuild.hero?.maxEnergy || 0),
      handSize: toNumber(finalBuild.hero?.handSize || 0),
      potionHeal: toNumber(finalBuild.hero?.potionHeal || 0),
      damageBonus: toNumber(finalBuild.hero?.damageBonus || 0),
      guardBonus: toNumber(finalBuild.hero?.guardBonus || 0),
      burnBonus: toNumber(finalBuild.hero?.burnBonus || 0),
    },
    mercenary: analysisFinalBuild.mercenary || {
      name: String(finalBuild.mercenary?.name || ""),
      maxLife: toNumber(finalBuild.mercenary?.maxLife || 0),
      attack: toNumber(finalBuild.mercenary?.attack || 0),
    },
    weaponName: String(analysisFinalBuild.weaponName || finalBuild.weapon?.name || ""),
    weaponFamily: String(analysisFinalBuild.weaponFamily || finalBuild.weapon?.family || ""),
    armorName: String(analysisFinalBuild.armorName || finalBuild.armor?.name || ""),
    favoredTreeId: String(analysisFinalBuild.favoredTreeId || finalBuild.favoredTreeId || ""),
    favoredTreeName: String(analysisFinalBuild.favoredTreeName || finalBuild.favoredTreeName || ""),
    dominantArchetypeId: String(analysisFinalBuild.dominantArchetypeId || finalBuild.dominantArchetypeId || ""),
    dominantArchetypeLabel: String(analysisFinalBuild.dominantArchetypeLabel || finalBuild.dominantArchetypeLabel || ""),
    secondaryArchetypeId: String(analysisFinalBuild.secondaryArchetypeId || finalBuild.secondaryArchetypeId || ""),
    secondaryArchetypeLabel: String(analysisFinalBuild.secondaryArchetypeLabel || finalBuild.secondaryArchetypeLabel || ""),
    deckFamily: String(analysisFinalBuild.deckFamily || deckProfile.deckFamily || ""),
    targetShapeFit: toNumber(analysisFinalBuild.targetShapeFit || deckProfile.targetShapeFit || 0),
    starterShellCardsRemaining: toNumber(analysisFinalBuild.starterShellCardsRemaining || deckProfile.starterShellCardsRemaining || 0),
    reinforcedCardCount: toNumber(analysisFinalBuild.reinforcedCardCount || deckProfile.reinforcedCardCount || 0),
    deckSize: toNumber(analysisFinalBuild.deckSize || finalBuild.deckSize || 0),
    activeRunewords: toStringArray(analysisFinalBuild.activeRunewords || finalBuild.activeRunewords),
    counterCoverageTags: toStringArray(analysisFinalBuild.counterCoverageTags || finalBuild.counterCoverageTags),
    offTreeUtilityCount: toNumber(analysisFinalBuild.offTreeUtilityCount || finalBuild.offTreeUtilityCount || 0),
    offTreeDamageCount: toNumber(analysisFinalBuild.offTreeDamageCount || finalBuild.offTreeDamageCount || 0),
    topCards: toStringArray(analysisFinalBuild.topCards || finalBuild.topCards),
    centerpieceCards: toStringArray(
      analysisFinalBuild.centerpieceCards || (Array.isArray(deckProfile.centerpieceCards)
        ? deckProfile.centerpieceCards.map((entry) => entry.title || entry.cardId)
        : [])
    ),
  };
}

function summarizeCombatLogForHistory(run) {
  const logSummary = run?.combatLogSummary || run?.combat?.logSummary || run?.logSummary || null;
  if (!logSummary) {
    return null;
  }
  return {
    totalEntries: toNumber(logSummary.totalEntries || 0),
    totalTurns: toNumber(logSummary.totalTurns || 0),
    outcome: String(logSummary.outcome || ""),
    defeatCause: String(logSummary.defeatCause || ""),
    cardsPlayed: toNumber(logSummary.cardsPlayed || 0),
    skillsUsed: toNumber(logSummary.skillsUsed || 0),
    potionsUsed: toNumber(logSummary.potionsUsed || 0),
    heroActions: toNumber(logSummary.heroActions || 0),
    mercenaryActions: toNumber(logSummary.mercenaryActions || 0),
    enemyActions: toNumber(logSummary.enemyActions || 0),
    enemyIntents: toNumber(logSummary.enemyIntents || 0),
    deaths: toNumber(logSummary.deaths || 0),
    statusEffects: toNumber(logSummary.statusEffects || 0),
    byAction: logSummary.byAction || {},
    byTone: logSummary.byTone || {},
  };
}

function buildHistoryRowId(row) {
  return [
    String(row.runKey || row.rowKey || ""),
    String(row.completedAt || ""),
    String(row.sourceArtifactPath || ""),
    String(row.outcome || ""),
    String(row.finalActNumber || 0),
    String(row.finalLevel || 0),
  ].join("::");
}

function summarizeRunForHistory(run, artifactMeta = {}) {
  const skillBar = normalizeSkillBar(run.skillBar);
  const finalCheckpoint = pickFinalCheckpoint(run);
  const summary = run.summary || {};
  const lastEncounter = summarizeEncounter(run?.analysis?.lastEncounter || pickEncounter(summary, ""));
  const lastBoss = summarizeEncounter(run?.analysis?.lastBoss || pickEncounter(summary, "boss"));
  const trainingRealization = run?.analysis?.trainingRealization || buildTrainingRealization(run.requestedTrainingLoadout, skillBar);
  const finalBuild = summarizeFinalBuild(run);
  const historyRow = {
    rowKey: String(run.runKey || ""),
    runKey: String(run.runKey || ""),
    experimentId: String(run.experimentId || artifactMeta.experimentId || ""),
    scenarioType: String(run.scenarioType || artifactMeta.scenarioType || ""),
    classId: String(run.classId || ""),
    className: String(run.className || ""),
    policyId: String(run.policyId || ""),
    policyLabel: String(run.policyLabel || ""),
    seedOffset: toNumber(run.seedOffset || 0),
    targetArchetypeId: String(run.targetArchetypeId || ""),
    targetArchetypeLabel: String(run.targetArchetypeLabel || ""),
    targetBand: String(run.targetBand || ""),
    commitmentMode: String(run.commitmentMode || ""),
    outcome: String(run.outcome || ""),
    finalActNumber: toNumber(run.finalActNumber || 0),
    finalLevel: toNumber(run.finalLevel || 0),
    failureEncounterName: String(run.failure?.encounterName || ""),
    failureZoneTitle: String(run.failure?.zoneTitle || ""),
    completedAt: String(run.completedAt || artifactMeta.generatedAt || ""),
    durationMs: toNumber(run.durationMs || 0),
    requestedTrainingLoadout: run.requestedTrainingLoadout
      ? {
          favoredTreeId: String(run.requestedTrainingLoadout.favoredTreeId || ""),
          unlockedSkillIds: toStringArray(run.requestedTrainingLoadout.unlockedSkillIds),
          equippedSkillIds: {
            slot2: String(run.requestedTrainingLoadout.equippedSkillIds?.slot2 || ""),
            slot3: String(run.requestedTrainingLoadout.equippedSkillIds?.slot3 || ""),
          },
        }
      : null,
    skillBar,
    trainingRealization,
    finalCheckpoint,
    encounterCount: Array.isArray(summary.encounterResults) ? summary.encounterResults.length : 0,
    bossEncounterCount: Array.isArray(summary.encounterResults)
      ? summary.encounterResults.filter((encounter) => encounter?.kind === "boss").length
      : 0,
    lastEncounter,
    lastBoss,
    finalBuild,
    combatLogSummary: summarizeCombatLogForHistory(run),
    sourceArtifactPath: String(artifactMeta.artifactPath || ""),
    sourceGeneratedAt: String(artifactMeta.generatedAt || ""),
  };
  return {
    ...historyRow,
    historyRowId: buildHistoryRowId(historyRow),
  };
}

function compareHistoryRows(left, right) {
  const leftCompletedAt = String(left?.completedAt || left?.sourceGeneratedAt || "");
  const rightCompletedAt = String(right?.completedAt || right?.sourceGeneratedAt || "");
  if (leftCompletedAt !== rightCompletedAt) {
    return leftCompletedAt.localeCompare(rightCompletedAt);
  }
  const leftSource = String(left?.sourceArtifactPath || "");
  const rightSource = String(right?.sourceArtifactPath || "");
  if (leftSource !== rightSource) {
    return leftSource.localeCompare(rightSource);
  }
  return String(left?.historyRowId || "").localeCompare(String(right?.historyRowId || ""));
}

function dedupeHistoryRows(rows) {
  const historyById = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) {
      continue;
    }
    const normalizedRow = row.historyRowId ? row : { ...row, historyRowId: buildHistoryRowId(row) };
    const existing = historyById.get(normalizedRow.historyRowId);
    if (!existing || compareHistoryRows(existing, normalizedRow) < 0) {
      historyById.set(normalizedRow.historyRowId, normalizedRow);
    }
  }
  return [...historyById.values()].sort(compareHistoryRows);
}

function readBalanceHistoryRows(historyPath = getBalanceHistoryStorePath(ROOT), options = {}) {
  if (!historyPath || !fs.existsSync(historyPath)) {
    const databaseRows = options.dbPath || options.db
      ? (() => {
          const db = options.db || openBalanceDatabase({ dbPath: options.dbPath, readonly: true });
          if (!db) {
            return [];
          }
          try {
            return readBalanceHistoryRowsFromDatabase(db, {
              experimentId: options.experimentId,
              scenarioType: options.scenarioType,
            });
          } finally {
            if (!options.db) {
              db.close();
            }
          }
        })()
      : [];
    return dedupeHistoryRows(databaseRows);
  }
  const lines = fs.readFileSync(historyPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object") {
        rows.push(parsed);
      }
    } catch (_error) {
      continue;
    }
  }
  if (!options.dbPath && !options.db) {
    return dedupeHistoryRows(rows);
  }
  const db = options.db || openBalanceDatabase({ dbPath: options.dbPath, readonly: true });
  if (!db) {
    return dedupeHistoryRows(rows);
  }
  try {
    return dedupeHistoryRows([
      ...rows,
      ...readBalanceHistoryRowsFromDatabase(db, {
        experimentId: options.experimentId,
        scenarioType: options.scenarioType,
      }),
    ]);
  } finally {
    if (!options.db) {
      db.close();
    }
  }
}

function appendBalanceHistoryRows(rows, options = {}) {
  const historyPath = options.historyPath || getBalanceHistoryStorePath(options.rootDir || ROOT);
  const normalizedRows = dedupeHistoryRows(Array.isArray(rows) ? rows : []);
  if (!normalizedRows.length) {
    return;
  }
  ensureDir(historyPath);
  fs.appendFileSync(
    historyPath,
    `${normalizedRows.map((row) => JSON.stringify(row)).join("\n")}\n`,
    "utf8"
  );
  if (options.dbPath || options.db) {
    const db = options.db || openBalanceDatabase({ dbPath: options.dbPath, rootDir: options.rootDir });
    try {
      normalizedRows.forEach((row) => insertBalanceHistoryRow(db, row));
    } finally {
      if (!options.db) {
        db.close();
      }
    }
  }
}

function buildArtifactHistoryRows(indexEntries, options = {}) {
  const relevantEntries = (Array.isArray(indexEntries) ? indexEntries : [])
    .filter((entry) => {
      if (options.experimentId && entry.experimentId !== options.experimentId) {
        return false;
      }
      if (options.scenarioType && entry.scenarioType !== options.scenarioType) {
        return false;
      }
      return Boolean(entry.artifactPath);
    });

  const rows = [];
  const sourceArtifacts = [];
  const skippedArtifacts = [];
  for (const entry of relevantEntries) {
    const artifact = readJsonSafe(entry.artifactPath, null);
    if (!artifact || !Array.isArray(artifact.runs)) {
      skippedArtifacts.push({
        artifactPath: entry.artifactPath,
        generatedAt: entry.generatedAt || "",
      });
      continue;
    }
    sourceArtifacts.push({
      artifactPath: entry.artifactPath,
      generatedAt: entry.generatedAt || "",
      runCount: artifact.runs.length,
    });
    for (const run of artifact.runs) {
      if (run?.runKey) {
        rows.push(summarizeRunForHistory(run, entry));
      }
    }
  }

  return {
    rows: dedupeHistoryRows(rows),
    sourceArtifacts,
    skippedArtifacts,
  };
}

function buildMergedHistoryRows(indexEntries, options = {}) {
  const persistedRows = readBalanceHistoryRows(
    options.historyStorePath || getBalanceHistoryStorePath(options.rootDir || ROOT),
    {
      dbPath: options.dbPath,
      experimentId: options.experimentId,
      scenarioType: options.scenarioType,
    }
  );
  const artifactHistory = buildArtifactHistoryRows(indexEntries, options);
  const rows = dedupeHistoryRows([...persistedRows, ...artifactHistory.rows])
    .filter((row) => {
      if (options.experimentId && row.experimentId !== options.experimentId) {
        return false;
      }
      if (options.scenarioType && row.scenarioType !== options.scenarioType) {
        return false;
      }
      return true;
    });
  return {
    rows,
    sourceArtifacts: artifactHistory.sourceArtifacts,
    skippedArtifacts: artifactHistory.skippedArtifacts,
    persistedHistoryRowCount: persistedRows.length,
    artifactHistoryRowCount: artifactHistory.rows.length,
  };
}

function summarizePreviousRow(row) {
  if (!row) {
    return null;
  }
  return {
    completedAt: row.completedAt,
    sourceArtifactPath: row.sourceArtifactPath,
    outcome: row.outcome,
    finalActNumber: row.finalActNumber,
    finalLevel: row.finalLevel,
    finalCheckpointPowerScore: toNumber(row.finalCheckpoint?.powerScore || 0),
    lastBossPowerRatio: toNumber(row.lastBoss?.powerRatio || 0),
    slotStateLabel: String(row.skillBar?.slotStateLabel || ""),
    slot3SkillId: String(row.skillBar?.equippedSkillIds?.slot3 || ""),
  };
}

function buildRowDelta(latest, previous) {
  if (!previous) {
    return null;
  }
  return {
    finalActNumber: toNumber(latest.finalActNumber || 0) - toNumber(previous.finalActNumber || 0),
    finalLevel: toNumber(latest.finalLevel || 0) - toNumber(previous.finalLevel || 0),
    finalCheckpointPowerScore: roundTo(
      toNumber(latest.finalCheckpoint?.powerScore || 0) - toNumber(previous.finalCheckpoint?.powerScore || 0),
      2
    ),
    lastBossPowerRatio: roundTo(
      toNumber(latest.lastBoss?.powerRatio || 0) - toNumber(previous.lastBoss?.powerRatio || 0),
      3
    ),
    slot3Changed:
      String(latest.skillBar?.equippedSkillIds?.slot3 || "") !== String(previous.skillBar?.equippedSkillIds?.slot3 || ""),
    outcomeChanged: String(latest.outcome || "") !== String(previous.outcome || ""),
  };
}

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function buildLedgerFromHistoryRows(historyRows, options = {}) {
  const historyByRunKey = new Map();
  for (const row of Array.isArray(historyRows) ? historyRows : []) {
    const key = String(row.runKey || row.rowKey || "");
    if (!key) {
      continue;
    }
    const existing = historyByRunKey.get(key) || [];
    existing.push(row);
    existing.sort(compareHistoryRows);
    historyByRunKey.set(key, existing);
  }

  const rows = [...historyByRunKey.values()]
    .map((history) => {
      const latest = history[history.length - 1];
      const previous = history.length > 1 ? history[history.length - 2] : null;
      return {
        ...latest,
        historyCount: history.length,
        previousRow: summarizePreviousRow(previous),
        delta: buildRowDelta(latest, previous),
      };
    })
    .sort((left, right) =>
      left.classId.localeCompare(right.classId) ||
      left.policyId.localeCompare(right.policyId) ||
      left.targetArchetypeLabel.localeCompare(right.targetArchetypeLabel) ||
      left.seedOffset - right.seedOffset
    );

  const laneMap = new Map();
  const classPolicyMap = new Map();
  for (const row of rows) {
    const laneKey = [row.classId, row.policyId, row.targetArchetypeLabel].join("\t");
    const lane = laneMap.get(laneKey) || {
      classId: row.classId,
      policyId: row.policyId,
      targetArchetypeLabel: row.targetArchetypeLabel,
      targetArchetypeId: row.targetArchetypeId,
      runs: 0,
      clears: 0,
      slot3FilledRuns: 0,
      requestedSlot3Runs: 0,
      fullyRealizedRuns: 0,
      averageTargetShapeFit: 0,
      averageStarterShellCardsRemaining: 0,
      averageReinforcedCardCount: 0,
      averageFinalCheckpointPowerScore: 0,
      averageLastBossPowerRatio: 0,
      failureEncounters: {},
    };
    lane.runs += 1;
    lane.clears += row.outcome === "run_complete" ? 1 : 0;
    lane.slot3FilledRuns += row.skillBar?.equippedSkillIds?.slot3 ? 1 : 0;
    lane.requestedSlot3Runs += row.requestedTrainingLoadout?.equippedSkillIds?.slot3 ? 1 : 0;
    lane.fullyRealizedRuns += row.trainingRealization?.fullyRealized ? 1 : 0;
    lane.averageTargetShapeFit += toNumber(row.finalBuild?.targetShapeFit || 0);
    lane.averageStarterShellCardsRemaining += toNumber(row.finalBuild?.starterShellCardsRemaining || 0);
    lane.averageReinforcedCardCount += toNumber(row.finalBuild?.reinforcedCardCount || 0);
    lane.averageFinalCheckpointPowerScore += toNumber(row.finalCheckpoint?.powerScore || 0);
    lane.averageLastBossPowerRatio += toNumber(row.lastBoss?.powerRatio || 0);
    if (row.failureEncounterName) {
      lane.failureEncounters[row.failureEncounterName] = toNumber(lane.failureEncounters[row.failureEncounterName] || 0) + 1;
    }
    laneMap.set(laneKey, lane);

    const classPolicyKey = [row.classId, row.policyId].join("\t");
    const classPolicy = classPolicyMap.get(classPolicyKey) || {
      classId: row.classId,
      policyId: row.policyId,
      runs: 0,
      clears: 0,
      slot3FilledRuns: 0,
      requestedSlot3Runs: 0,
      fullyRealizedRuns: 0,
    };
    classPolicy.runs += 1;
    classPolicy.clears += row.outcome === "run_complete" ? 1 : 0;
    classPolicy.slot3FilledRuns += row.skillBar?.equippedSkillIds?.slot3 ? 1 : 0;
    classPolicy.requestedSlot3Runs += row.requestedTrainingLoadout?.equippedSkillIds?.slot3 ? 1 : 0;
    classPolicy.fullyRealizedRuns += row.trainingRealization?.fullyRealized ? 1 : 0;
    classPolicyMap.set(classPolicyKey, classPolicy);
  }

  const lanes = [...laneMap.values()]
    .map((lane) => ({
      ...lane,
      clearRate: lane.runs > 0 ? lane.clears / lane.runs : 0,
      slot3FillRate: lane.runs > 0 ? lane.slot3FilledRuns / lane.runs : 0,
      requestedSlot3Rate: lane.runs > 0 ? lane.requestedSlot3Runs / lane.runs : 0,
      trainingRealizationRate: lane.runs > 0 ? lane.fullyRealizedRuns / lane.runs : 0,
      averageTargetShapeFit: lane.runs > 0 ? lane.averageTargetShapeFit / lane.runs : 0,
      averageStarterShellCardsRemaining: lane.runs > 0 ? lane.averageStarterShellCardsRemaining / lane.runs : 0,
      averageReinforcedCardCount: lane.runs > 0 ? lane.averageReinforcedCardCount / lane.runs : 0,
      averageFinalCheckpointPowerScore: lane.runs > 0 ? lane.averageFinalCheckpointPowerScore / lane.runs : 0,
      averageLastBossPowerRatio: lane.runs > 0 ? lane.averageLastBossPowerRatio / lane.runs : 0,
      commonFailureEncounters: Object.entries(lane.failureEncounters)
        .sort((left, right) => Number(right[1]) - Number(left[1]) || String(left[0]).localeCompare(String(right[0])))
        .slice(0, 3)
        .map(([name, count]) => ({ name, count })),
    }))
    .sort((left, right) =>
      left.clearRate - right.clearRate ||
      left.classId.localeCompare(right.classId) ||
      left.policyId.localeCompare(right.policyId) ||
      left.targetArchetypeLabel.localeCompare(right.targetArchetypeLabel)
    );

  const classPolicies = [...classPolicyMap.values()]
    .map((entry) => ({
      ...entry,
      clearRate: entry.runs > 0 ? entry.clears / entry.runs : 0,
      slot3FillRate: entry.runs > 0 ? entry.slot3FilledRuns / entry.runs : 0,
      requestedSlot3Rate: entry.runs > 0 ? entry.requestedSlot3Runs / entry.runs : 0,
      trainingRealizationRate: entry.runs > 0 ? entry.fullyRealizedRuns / entry.runs : 0,
    }))
    .sort((left, right) =>
      left.clearRate - right.clearRate ||
      left.classId.localeCompare(right.classId) ||
      left.policyId.localeCompare(right.policyId)
    );

  const clears = rows.filter((row) => row.outcome === "run_complete").length;
  return {
    generatedAt: new Date().toISOString(),
    experimentId: options.experimentId || "",
    scenarioType: options.scenarioType || "",
    historyRowCount: historyRows.length,
    rowCount: rows.length,
    clearCount: clears,
    clearRate: rows.length > 0 ? clears / rows.length : 0,
    rows,
    aggregates: {
      classPolicies,
      lanes,
    },
  };
}

function buildHistoryDataset(historyRows, options = {}) {
  const rows = dedupeHistoryRows(historyRows);
  const runsByKey = new Map();
  for (const row of rows) {
    runsByKey.set(String(row.runKey || row.rowKey || ""), (runsByKey.get(String(row.runKey || row.rowKey || "")) || 0) + 1);
  }
  const mostRerunRows = [...runsByKey.entries()]
    .map(([runKey, count]) => ({ runKey, count }))
    .sort((left, right) => right.count - left.count || left.runKey.localeCompare(right.runKey))
    .slice(0, 25);
  return {
    generatedAt: new Date().toISOString(),
    experimentId: options.experimentId || "",
    scenarioType: options.scenarioType || "",
    historyRowCount: rows.length,
    runKeyCount: runsByKey.size,
    mostRerunRows,
    rows,
  };
}

function formatPercent(value) {
  return `${(toNumber(value || 0) * 100).toFixed(1)}%`;
}

function buildLedgerMarkdown(ledger) {
  const lines = [
    "# Balance Ledger",
    "",
    `Generated: ${ledger.generatedAt}`,
    "",
    `Rows: ${ledger.rowCount}`,
    `History rows available: ${ledger.historyRowCount}`,
    `Clear rate: ${formatPercent(ledger.clearRate)}`,
    "",
    "## How To Use",
    "",
    "- Treat each ledger row as the latest known result for one `class / policy / lane / seed` run key.",
    "- Use `previousRow` and `delta` to compare a rerun against the immediately previous result for that same run key.",
    "- Use the history dataset when you want the full append-only row trail instead of only the newest row.",
    "",
    "## Weakest Class/Policy Cells",
    "",
  ];

  (ledger.aggregates.classPolicies || []).slice(0, 10).forEach((entry) => {
    lines.push(
      `- \`${entry.classId} / ${entry.policyId}\`: ${entry.clears}/${entry.runs} (${formatPercent(entry.clearRate)}), slot3 ${formatPercent(entry.slot3FillRate)}, training ${formatPercent(entry.trainingRealizationRate)}`
    );
  });

  lines.push("", "## Weakest Lanes", "");
  (ledger.aggregates.lanes || []).slice(0, 15).forEach((lane) => {
    const failures = (lane.commonFailureEncounters || []).map((entry) => `${entry.name} x${entry.count}`).join(", ");
    lines.push(
      `- \`${lane.classId} / ${lane.policyId} / ${lane.targetArchetypeLabel}\`: ${lane.clears}/${lane.runs} (${formatPercent(lane.clearRate)}), slot3 ${formatPercent(lane.slot3FillRate)}, training ${formatPercent(lane.trainingRealizationRate)}, boss ratio ${lane.averageLastBossPowerRatio.toFixed(2)}, checkpoint power ${lane.averageFinalCheckpointPowerScore.toFixed(1)}${failures ? `, failures: ${failures}` : ""}`
    );
  });

  lines.push("", "## Recent Row Changes", "");
  ledger.rows
    .filter((row) => row.previousRow)
    .slice(-20)
    .reverse()
    .forEach((row) => {
      lines.push(
        `- \`${row.classId} / ${row.policyId} / ${row.targetArchetypeLabel} / seed ${row.seedOffset}\`: ${row.previousRow.outcome} -> ${row.outcome}, act ${row.previousRow.finalActNumber} -> ${row.finalActNumber}, level ${row.previousRow.finalLevel} -> ${row.finalLevel}, boss ratio Δ ${toNumber(row.delta?.lastBossPowerRatio || 0).toFixed(3)}`
      );
    });

  return lines.join("\n");
}

function buildHistoryMarkdown(historyDataset, ledger) {
  const lines = [
    "# Balance History",
    "",
    `Generated: ${historyDataset.generatedAt}`,
    "",
    `History rows: ${historyDataset.historyRowCount}`,
    `Unique run keys: ${historyDataset.runKeyCount}`,
    `Latest ledger rows: ${ledger.rowCount}`,
    "",
    "## Most Rerun Rows",
    "",
  ];

  (historyDataset.mostRerunRows || []).slice(0, 20).forEach((entry) => {
    lines.push(`- \`${entry.runKey}\`: ${entry.count} versions`);
  });

  lines.push("", "## Latest Changes", "");
  ledger.rows
    .filter((row) => row.previousRow)
    .slice(-20)
    .reverse()
    .forEach((row) => {
      lines.push(
        `- \`${row.classId} / ${row.policyId} / ${row.targetArchetypeLabel} / seed ${row.seedOffset}\`: ${row.previousRow.outcome} -> ${row.outcome}, checkpoint power Δ ${toNumber(row.delta?.finalCheckpointPowerScore || 0).toFixed(2)}, boss ratio Δ ${toNumber(row.delta?.lastBossPowerRatio || 0).toFixed(3)}`
      );
    });

  return lines.join("\n");
}

module.exports = {
  ROOT,
  getBalanceArtifactDirectory,
  getBalanceDatabasePath,
  getBalanceHistoryStorePath,
  getCommittedHistoryPath,
  getCommittedHistoryReportPath,
  readJsonSafe,
  writeJson,
  writeText,
  normalizeSkillBar,
  summarizeRunForHistory,
  buildTrainingRealization,
  buildHistoryRowId,
  readBalanceHistoryRows,
  appendBalanceHistoryRows,
  buildArtifactHistoryRows,
  buildMergedHistoryRows,
  buildLedgerFromHistoryRows,
  buildHistoryDataset,
  buildLedgerMarkdown,
  buildHistoryMarkdown,
};
