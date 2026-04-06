export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";

const requireFromTests = createRequire(__filename);
const balanceDb = requireFromTests(path.resolve(__dirname, "../../scripts/balance-db.js")) as {
  insertBalanceHistoryRow(db: unknown, historyRow: Record<string, unknown>, options?: { runRecord?: Record<string, unknown> }): void;
  openBalanceDatabase(options?: { dbPath?: string; readonly?: boolean }): { close(): void };
  readBalanceArtifactFromDatabase(db: unknown, artifactPath: string): Record<string, unknown> | null;
  readBalanceArtifactIndexFromDatabase(
    db: unknown,
    options?: { experimentId?: string; limit?: number; scenarioType?: string }
  ): Array<Record<string, unknown>>;
  readBalanceHistoryRowsFromDatabase(
    db: unknown,
    options?: { artifactPath?: string; experimentId?: string; scenarioType?: string }
  ): Array<Record<string, unknown>>;
  readBalanceJobStateByArtifactPath(db: unknown, artifactPath: string): Record<string, unknown> | null;
  readLatestRunRecordsForArtifact(db: unknown, artifactPath: string): Array<Record<string, unknown>>;
  upsertBalanceArtifact(
    db: unknown,
    artifactPath: string,
    artifact: Record<string, unknown>,
    options?: { indexPath?: string; jobPath?: string; reportPath?: string; tracesDir?: string }
  ): void;
  upsertBalanceJobState(
    db: unknown,
    state: Record<string, unknown>,
    options?: { artifactPath?: string; jobPath?: string }
  ): void;
};
const balanceLedger = requireFromTests(path.resolve(__dirname, "../../scripts/balance-ledger-utils.js")) as {
  appendBalanceHistoryRows(
    rows: Array<Record<string, unknown>>,
    options?: { historyPath?: string }
  ): void;
  buildLedgerFromHistoryRows(
    historyRows: Array<Record<string, unknown>>,
    options?: { experimentId?: string; scenarioType?: string }
  ): {
    historyRowCount: number;
    rowCount: number;
    rows: Array<Record<string, unknown>>;
  };
  buildMergedHistoryRows(
    indexEntries: Array<Record<string, unknown>>,
    options?: { dbPath?: string; experimentId?: string; historyStorePath?: string; scenarioType?: string }
  ): {
    artifactHistoryRowCount: number;
    persistedHistoryRowCount: number;
    rows: Array<Record<string, unknown>>;
  };
  summarizeRunForHistory(run: Record<string, unknown>, artifactMeta?: Record<string, unknown>): Record<string, unknown>;
};

function createSyntheticRun(overrides: Partial<Record<string, unknown>> = {}) {
  const run = {
    runKey: "committed_archetype_campaign:campaign:amazon:balanced:0:amazon_bow_and_crossbow",
    experimentId: "committed_archetype_campaign",
    scenarioType: "campaign",
    classId: "amazon",
    className: "Amazon",
    policyId: "balanced",
    policyLabel: "Balanced",
    seedOffset: 0,
    targetArchetypeId: "amazon_bow_and_crossbow",
    targetArchetypeLabel: "Bow Volley",
    targetBand: "flagship",
    commitmentMode: "committed",
    outcome: "run_failed",
    finalActNumber: 3,
    finalLevel: 29,
    failure: {
      encounterName: "The Cinder Tyrant",
      zoneTitle: "Ashen Throne",
    },
    durationMs: 1234,
    completedAt: "2026-04-05T10:00:00.000Z",
    requestedTrainingLoadout: {
      favoredTreeId: "amazon_bow_and_crossbow",
      unlockedSkillIds: ["amazon_critical_strike", "amazon_kill_zone"],
      equippedSkillIds: {
        slot2: "amazon_critical_strike",
        slot3: "amazon_kill_zone",
      },
    },
    skillBar: {
      favoredTreeId: "amazon_bow_and_crossbow",
      unlockedSkillCount: 2,
      unlockedSkillIds: ["amazon_critical_strike", "amazon_kill_zone"],
      unlockedSkillNames: ["Critical Strike", "Kill Zone"],
      slotStateLabel: "3 / 3",
      equippedSkillIds: {
        slot1: "amazon_call_the_shot",
        slot2: "amazon_critical_strike",
        slot3: "amazon_kill_zone",
      },
      equippedSkillNames: {
        slot1: "Call the Shot",
        slot2: "Critical Strike",
        slot3: "Kill Zone",
      },
    },
    analysis: {
      finalCheckpoint: {
        checkpointId: "act_3_safe_zone",
        checkpointKind: "safe_zone",
        actNumber: 3,
        level: 29,
        powerScore: 980.5,
        bossReadinessScore: 801.2,
        bossAdjustedPowerScore: 922.1,
      },
      lastEncounter: {
        encounterId: "act_3_elite",
        encounterName: "Ashen Vanguard",
        zoneTitle: "Ashen Throne",
        kind: "elite",
        outcome: "victory",
        turns: 6,
        heroPowerScore: 1110,
        enemyPowerScore: 1000,
        powerRatio: 1.11,
      },
      lastBoss: {
        encounterId: "act_3_boss",
        encounterName: "The Cinder Tyrant",
        zoneTitle: "Ashen Throne",
        kind: "boss",
        outcome: "defeat",
        turns: 7,
        heroPowerScore: 1100,
        enemyPowerScore: 1350,
        powerRatio: 0.815,
      },
      trainingRealization: {
        favoredTreeRequested: "amazon_bow_and_crossbow",
        favoredTreeActual: "amazon_bow_and_crossbow",
        favoredTreeMatched: true,
        requestedUnlockedSkillIds: ["amazon_critical_strike", "amazon_kill_zone"],
        actualUnlockedSkillIds: ["amazon_critical_strike", "amazon_kill_zone"],
        slot2RequestedSkillId: "amazon_critical_strike",
        slot2ActualSkillId: "amazon_critical_strike",
        slot2Matched: true,
        slot3RequestedSkillId: "amazon_kill_zone",
        slot3ActualSkillId: "amazon_kill_zone",
        slot3Matched: true,
        fullyRealized: true,
      },
      finalBuild: {
        hero: {
          maxLife: 71,
          maxEnergy: 6,
          handSize: 6,
          potionHeal: 12,
          damageBonus: 4,
          guardBonus: 3,
          burnBonus: 0,
        },
        mercenary: {
          name: "Rogue Scout",
          maxLife: 42,
          attack: 8,
        },
        weaponName: "Hunter's Bow",
        weaponFamily: "bow",
        armorName: "Studded Leather",
        favoredTreeId: "amazon_bow_and_crossbow",
        favoredTreeName: "Bow and Crossbow",
        dominantArchetypeId: "amazon_bow_and_crossbow",
        dominantArchetypeLabel: "Bow Volley",
        secondaryArchetypeId: "amazon_passives",
        secondaryArchetypeLabel: "Battle Instinct",
        deckFamily: "precision",
        targetShapeFit: 0.84,
        starterShellCardsRemaining: 2,
        reinforcedCardCount: 7,
        deckSize: 22,
        activeRunewords: ["Edge"],
        counterCoverageTags: ["single_target"],
        offTreeUtilityCount: 1,
        offTreeDamageCount: 0,
        topCards: ["Call the Shot", "Kill Zone"],
        centerpieceCards: ["Kill Zone"],
      },
    },
    checkpoints: [
      {
        checkpointId: "act_3_safe_zone",
        checkpointKind: "safe_zone",
        actNumber: 3,
        level: 29,
        powerScore: 980.5,
        bossReadinessScore: 801.2,
        bossAdjustedPowerScore: 922.1,
      },
    ],
    summary: {
      encounterResults: [
        {
          encounterId: "act_3_boss",
          encounterName: "The Cinder Tyrant",
          zoneTitle: "Ashen Throne",
          kind: "boss",
          outcome: "defeat",
          turns: 7,
          heroPowerScore: 1100,
          enemyPowerScore: 1350,
          powerRatio: 0.815,
        },
      ],
      finalBuild: {
        deckSize: 22,
        hero: {
          maxLife: 71,
          maxEnergy: 6,
          handSize: 6,
          potionHeal: 12,
          damageBonus: 4,
          guardBonus: 3,
          burnBonus: 0,
        },
        mercenary: {
          name: "Rogue Scout",
          maxLife: 42,
          attack: 8,
        },
        weapon: {
          name: "Hunter's Bow",
          family: "bow",
        },
        armor: {
          name: "Studded Leather",
        },
        favoredTreeId: "amazon_bow_and_crossbow",
        favoredTreeName: "Bow and Crossbow",
        dominantArchetypeId: "amazon_bow_and_crossbow",
        dominantArchetypeLabel: "Bow Volley",
        secondaryArchetypeId: "amazon_passives",
        secondaryArchetypeLabel: "Battle Instinct",
        deckProfile: {
          deckFamily: "precision",
          targetShapeFit: 0.84,
          starterShellCardsRemaining: 2,
          reinforcedCardCount: 7,
          centerpieceCards: [
            {
              cardId: "amazon_kill_zone",
              title: "Kill Zone",
            },
          ],
        },
        activeRunewords: ["Edge"],
        counterCoverageTags: ["single_target"],
        offTreeUtilityCount: 1,
        offTreeDamageCount: 0,
        topCards: ["Call the Shot", "Kill Zone"],
      },
    },
  };
  return {
    ...run,
    ...overrides,
    failure: overrides.failure === null
      ? null
      : {
          ...run.failure,
          ...((overrides.failure as Record<string, unknown> | undefined) || {}),
        },
    analysis: {
      ...run.analysis,
      ...((overrides.analysis as Record<string, unknown> | undefined) || {}),
    },
    summary: {
      ...run.summary,
      ...((overrides.summary as Record<string, unknown> | undefined) || {}),
    },
  };
}

test("balance sqlite store keeps latest run payloads and metadata", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-balance-db-"));
  const dbPath = path.join(tempDir, "balance.db");
  const artifactPath = path.join(tempDir, "artifact.json");
  const reportPath = path.join(tempDir, "artifact.md");
  const indexPath = path.join(tempDir, "index.json");
  const jobPath = path.join(tempDir, "artifact.job.json");
  const tracesDir = path.join(tempDir, "traces");
  const db = balanceDb.openBalanceDatabase({ dbPath });

  try {
    const olderRun = createSyntheticRun();
    const newerRun = createSyntheticRun({
      completedAt: "2026-04-05T11:00:00.000Z",
      outcome: "run_complete",
      finalActNumber: 5,
      finalLevel: 41,
      failure: null,
      analysis: {
        finalCheckpoint: {
          checkpointId: "act_5_safe_zone",
          checkpointKind: "safe_zone",
          actNumber: 5,
          level: 41,
          powerScore: 1490.5,
          bossReadinessScore: 1220.2,
          bossAdjustedPowerScore: 1401.3,
        },
        lastBoss: {
          encounterId: "act_5_boss",
          encounterName: "Baal",
          zoneTitle: "Worldstone Keep",
          kind: "boss",
          outcome: "victory",
          turns: 9,
          heroPowerScore: 1610,
          enemyPowerScore: 1500,
          powerRatio: 1.073,
        },
      },
    });
    const olderRow = balanceLedger.summarizeRunForHistory(olderRun, {
      artifactPath,
      generatedAt: olderRun.completedAt,
    });
    const newerRow = balanceLedger.summarizeRunForHistory(newerRun, {
      artifactPath,
      generatedAt: newerRun.completedAt,
    });

    balanceDb.insertBalanceHistoryRow(db, olderRow, { runRecord: olderRun });
    balanceDb.insertBalanceHistoryRow(db, newerRow, { runRecord: newerRun });

    const artifact = {
      generatedAt: newerRun.completedAt,
      experiment: {
        experimentId: "committed_archetype_campaign",
        title: "Committed Archetype Campaign",
        scenarioType: "campaign",
      },
      runs: [newerRun],
      aggregate: {
        runs: 1,
        completedRuns: 1,
        coverageRate: 1,
        overall: {
          winRate: 1,
        },
      },
      bands: [] as unknown[],
      baselineComparison: null as unknown,
    };
    balanceDb.upsertBalanceArtifact(db, artifactPath, artifact, {
      reportPath,
      indexPath,
      jobPath,
      tracesDir,
    });
    balanceDb.upsertBalanceJobState(db, {
      startedAt: "2026-04-05T11:00:00.000Z",
      updatedAt: "2026-04-05T11:05:00.000Z",
      mode: "resume",
      experimentId: "committed_archetype_campaign",
      totalRuns: 1,
      completedRuns: 1,
      pendingRunKeys: [],
      failedRunKeys: [],
      slowRunKeys: [],
    }, {
      artifactPath,
      jobPath,
    });

    const historyRows = balanceDb.readBalanceHistoryRowsFromDatabase(db, {
      experimentId: "committed_archetype_campaign",
      scenarioType: "campaign",
    });
    const latestRuns = balanceDb.readLatestRunRecordsForArtifact(db, artifactPath);
    const storedArtifact = balanceDb.readBalanceArtifactFromDatabase(db, artifactPath);
    const artifactIndex = balanceDb.readBalanceArtifactIndexFromDatabase(db, { limit: 5 });
    const storedJobState = balanceDb.readBalanceJobStateByArtifactPath(db, artifactPath);
    const storedArtifactRuns = Array.isArray(storedArtifact?.runs) ? storedArtifact.runs : [];

    assert.equal(historyRows.length, 2);
    assert.equal(latestRuns.length, 1);
    assert.equal(latestRuns[0].outcome, "run_complete");
    assert.equal(latestRuns[0].finalActNumber, 5);
    assert.equal(storedArtifact?.generatedAt, "2026-04-05T11:00:00.000Z");
    assert.equal(Array.isArray(storedArtifact?.runs), true);
    assert.equal(storedArtifactRuns.length, 1);
    assert.equal(artifactIndex[0].artifactPath, artifactPath);
    assert.equal(artifactIndex[0].overallWinRate, 1);
    assert.equal(storedJobState?.completedRuns, 1);
    assert.equal(Array.isArray(storedJobState?.pendingRunKeys), true);
  } finally {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("balance ledger merges sqlite history rows with file history rows", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-balance-merge-"));
  const dbPath = path.join(tempDir, "balance.db");
  const historyPath = path.join(tempDir, "row-history.jsonl");
  const db = balanceDb.openBalanceDatabase({ dbPath });

  try {
    const olderRun = createSyntheticRun();
    const newerRun = createSyntheticRun({
      completedAt: "2026-04-05T12:00:00.000Z",
      outcome: "run_complete",
      finalActNumber: 5,
      finalLevel: 43,
      failure: null,
    });
    const olderRow = balanceLedger.summarizeRunForHistory(olderRun, {
      artifactPath: "/tmp/older-artifact.json",
      generatedAt: olderRun.completedAt,
    });
    const newerRow = balanceLedger.summarizeRunForHistory(newerRun, {
      artifactPath: "/tmp/newer-artifact.json",
      generatedAt: newerRun.completedAt,
    });

    balanceLedger.appendBalanceHistoryRows([olderRow], { historyPath });
    balanceDb.insertBalanceHistoryRow(db, newerRow, { runRecord: newerRun });

    const mergedHistory = balanceLedger.buildMergedHistoryRows([], {
      dbPath,
      experimentId: "committed_archetype_campaign",
      historyStorePath: historyPath,
      scenarioType: "campaign",
    });
    const ledger = balanceLedger.buildLedgerFromHistoryRows(mergedHistory.rows, {
      experimentId: "committed_archetype_campaign",
      scenarioType: "campaign",
    });

    assert.equal(mergedHistory.persistedHistoryRowCount, 2);
    assert.equal(mergedHistory.rows.length, 2);
    assert.equal(ledger.historyRowCount, 2);
    assert.equal(ledger.rowCount, 1);
    assert.equal(ledger.rows[0].outcome, "run_complete");
    assert.equal(ledger.rows[0].historyCount, 2);
    assert.ok(ledger.rows[0].delta);
  } finally {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
