export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";

const requireFromTests = createRequire(__filename);
const balanceLedger = requireFromTests(path.resolve(__dirname, "../../scripts/balance-ledger-utils.js")) as {
  appendBalanceHistoryRows(
    rows: Array<Record<string, unknown>>,
    options?: { historyPath?: string }
  ): void;
  buildHistoryDataset(
    historyRows: Array<Record<string, unknown>>,
    options?: { experimentId?: string; scenarioType?: string }
  ): {
    historyRowCount: number;
    mostRerunRows: Array<{ runKey: string; count: number }>;
    runKeyCount: number;
    rows: Array<Record<string, unknown>>;
  };
  buildLedgerFromHistoryRows(
    historyRows: Array<Record<string, unknown>>,
    options?: { experimentId?: string; scenarioType?: string }
  ): {
    clearRate: number;
    historyRowCount: number;
    rowCount: number;
    rows: Array<Record<string, unknown>>;
  };
  buildMergedHistoryRows(
    indexEntries: Array<Record<string, unknown>>,
    options?: { experimentId?: string; historyStorePath?: string; scenarioType?: string }
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
      unlockedSkillCount: 1,
      unlockedSkillIds: ["amazon_critical_strike"],
      unlockedSkillNames: ["Critical Strike"],
      slotStateLabel: "2 / 3",
      equippedSkillIds: {
        slot1: "amazon_call_the_shot",
        slot2: "amazon_critical_strike",
        slot3: "",
      },
      equippedSkillNames: {
        slot1: "Call the Shot",
        slot2: "Critical Strike",
        slot3: "",
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
          actNumber: 3,
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
          maxLife: 310,
          maxEnergy: 7,
          handSize: 5,
          potionHeal: 12,
          damageBonus: 22,
          guardBonus: 8,
          burnBonus: 0,
        },
        mercenary: {
          name: "Blackwood Hunter",
          maxLife: 180,
          attack: 44,
        },
        weapon: {
          name: "Long Bow",
          family: "Bows",
        },
        armor: {
          name: "Scale Mail",
        },
        favoredTreeId: "amazon_bow_and_crossbow",
        favoredTreeName: "Bow and Crossbow",
        dominantArchetypeId: "amazon_bow_and_crossbow",
        dominantArchetypeLabel: "Bow Volley",
        secondaryArchetypeId: "amazon_passive_and_magic",
        secondaryArchetypeLabel: "Passive Tempo",
        offTreeUtilityCount: 2,
        offTreeDamageCount: 1,
        activeRunewords: ["Edge"],
        counterCoverageTags: ["anti_summon", "anti_fire_pressure"],
        topCards: ["Guided Arrow+", "Pierce+"],
        deckProfile: {
          deckFamily: "setup_payoff",
          targetShapeFit: 0.62,
          starterShellCardsRemaining: 1,
          reinforcedCardCount: 12,
          centerpieceCards: [
            { cardId: "amazon_guided_arrow_plus", title: "Guided Arrow+" },
            { cardId: "amazon_pierce_plus", title: "Pierce+" },
          ],
        },
      },
    },
  };
  return { ...run, ...overrides };
}

test("balance history summarization extracts final power, skills, and training realization", () => {
  const row = balanceLedger.summarizeRunForHistory(
    createSyntheticRun(),
    {
      artifactPath: "/tmp/balance-artifact.json",
      generatedAt: "2026-04-05T10:00:01.000Z",
      experimentId: "committed_archetype_campaign",
      scenarioType: "campaign",
    }
  ) as {
    finalBuild: { weaponName: string; topCards: string[] };
    finalCheckpoint: { powerScore: number };
    lastBoss: { enemyPowerScore: number; heroPowerScore: number; powerRatio: number };
    requestedTrainingLoadout: { favoredTreeId: string };
    skillBar: { equippedSkillIds: { slot3: string }; unlockedSkillIds: string[] };
    trainingRealization: { fullyRealized: boolean; slot3Matched: boolean };
  };

  assert.equal(row.finalCheckpoint.powerScore, 980.5);
  assert.equal(row.lastBoss.heroPowerScore, 1100);
  assert.equal(row.lastBoss.enemyPowerScore, 1350);
  assert.equal(row.lastBoss.powerRatio, 0.815);
  assert.equal(row.requestedTrainingLoadout.favoredTreeId, "amazon_bow_and_crossbow");
  assert.deepEqual(row.skillBar.unlockedSkillIds, ["amazon_critical_strike"]);
  assert.equal(row.skillBar.equippedSkillIds.slot3, "");
  assert.equal(row.trainingRealization.slot3Matched, false);
  assert.equal(row.trainingRealization.fullyRealized, false);
  assert.equal(row.finalBuild.weaponName, "Long Bow");
  assert.deepEqual(row.finalBuild.topCards, ["Guided Arrow+", "Pierce+"]);
});

test("balance history preserves reruns and ledger rows expose previous-run deltas", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rouge-balance-history-"));
  const historyPath = path.join(tempDir, "row-history.jsonl");
  const artifactPath = path.join(tempDir, "artifact.json");

  const olderRow = balanceLedger.summarizeRunForHistory(
    createSyntheticRun(),
    { artifactPath: "/tmp/old.json", generatedAt: "2026-04-05T10:00:01.000Z" }
  );
  balanceLedger.appendBalanceHistoryRows([olderRow], { historyPath });

  const newerArtifact = {
    generatedAt: "2026-04-05T11:00:00.000Z",
    runs: [
      createSyntheticRun({
        outcome: "run_complete",
        finalActNumber: 5,
        finalLevel: 52,
        completedAt: "2026-04-05T11:00:00.000Z",
        failure: null,
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
        checkpoints: [
          {
            checkpointId: "act_5_safe_zone",
            checkpointKind: "safe_zone",
            actNumber: 5,
            level: 52,
            powerScore: 4551.59,
            bossReadinessScore: 3900,
            bossAdjustedPowerScore: 4200,
          },
        ],
        summary: {
          encounterResults: [
            {
              actNumber: 5,
              encounterId: "act_5_boss",
              encounterName: "The Siege Tyrant",
              zoneTitle: "Crown of Ruin",
              kind: "boss",
              outcome: "victory",
              turns: 3,
              heroPowerScore: 4551.59,
              enemyPowerScore: 3362.08,
              powerRatio: 1.35,
            },
          ],
          finalBuild: {
            deckSize: 35,
            hero: {
              maxLife: 523,
              maxEnergy: 11,
              handSize: 5,
              potionHeal: 24,
              damageBonus: 64,
              guardBonus: 17,
              burnBonus: 4,
            },
            mercenary: {
              name: "Blackwood Hunter",
              maxLife: 299,
              attack: 83,
            },
            weapon: {
              name: "Hydra Bow",
              family: "Bows",
            },
            armor: {
              name: "Archon Plate",
            },
            favoredTreeId: "amazon_bow_and_crossbow",
            favoredTreeName: "Bow and Crossbow",
            dominantArchetypeId: "amazon_bow_and_crossbow",
            dominantArchetypeLabel: "Bow Volley",
            secondaryArchetypeId: "amazon_passive_and_magic",
            secondaryArchetypeLabel: "Passive Tempo",
            offTreeUtilityCount: 5,
            offTreeDamageCount: 5,
            activeRunewords: ["Edge", "Smoke"],
            counterCoverageTags: ["anti_summon", "anti_fire_pressure"],
            topCards: ["Pierce+", "Deadly Strike+"],
            deckProfile: {
              deckFamily: "setup_payoff",
              targetShapeFit: 0.74,
              starterShellCardsRemaining: 0,
              reinforcedCardCount: 35,
              centerpieceCards: [
                { cardId: "amazon_pierce_plus", title: "Pierce+" },
              ],
            },
          },
        },
      }),
    ],
  };
  fs.writeFileSync(artifactPath, JSON.stringify(newerArtifact, null, 2));

  const merged = balanceLedger.buildMergedHistoryRows(
    [
      {
        experimentId: "committed_archetype_campaign",
        scenarioType: "campaign",
        generatedAt: "2026-04-05T11:00:00.000Z",
        artifactPath,
      },
    ],
    {
      experimentId: "committed_archetype_campaign",
      scenarioType: "campaign",
      historyStorePath: historyPath,
    }
  );
  const ledger = balanceLedger.buildLedgerFromHistoryRows(merged.rows, {
    experimentId: "committed_archetype_campaign",
    scenarioType: "campaign",
  }) as unknown as {
    historyRowCount: number;
    rowCount: number;
    rows: Array<{
      delta: { finalActNumber: number; lastBossPowerRatio: number; outcomeChanged: boolean; slot3Changed: boolean } | null;
      finalActNumber: number;
      historyCount: number;
      outcome: string;
      previousRow: { finalActNumber: number; outcome: string } | null;
      skillBar: { equippedSkillIds: { slot3: string } };
    }>;
  };
  const historyDataset = balanceLedger.buildHistoryDataset(merged.rows, {
    experimentId: "committed_archetype_campaign",
    scenarioType: "campaign",
  });

  assert.equal(merged.persistedHistoryRowCount, 1);
  assert.equal(merged.artifactHistoryRowCount, 1);
  assert.equal(ledger.historyRowCount, 2);
  assert.equal(ledger.rowCount, 1);
  assert.equal(historyDataset.historyRowCount, 2);
  assert.equal(historyDataset.runKeyCount, 1);
  assert.equal(historyDataset.mostRerunRows[0]?.count, 2);
  assert.equal(ledger.rows[0].historyCount, 2);
  assert.equal(ledger.rows[0].outcome, "run_complete");
  assert.equal(ledger.rows[0].previousRow?.outcome, "run_failed");
  assert.equal(ledger.rows[0].finalActNumber, 5);
  assert.equal(ledger.rows[0].previousRow?.finalActNumber, 3);
  assert.equal(ledger.rows[0].delta?.finalActNumber, 2);
  assert.equal(ledger.rows[0].delta?.outcomeChanged, true);
  assert.equal(ledger.rows[0].delta?.slot3Changed, true);
  assert.equal(ledger.rows[0].skillBar.equippedSkillIds.slot3, "amazon_kill_zone");
});
