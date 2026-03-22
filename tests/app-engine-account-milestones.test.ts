export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("account progress summary unlocks second-wave milestones and convergences from persisted profile progress", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  profile.runHistory = Array.from({ length: 8 }, (_, index) => ({
    runId: `second_wave_${index}`,
    classId: "amazon",
    className: "Amazon",
    level: 12,
    actsCleared: 5,
    bossesDefeated: 2,
    goldGained: 820,
    runewordsForged: 1,
    skillPointsEarned: 3,
    classPointsEarned: 2,
    attributePointsEarned: 3,
    trainingRanksGained: 2,
    favoredTreeId: "amazon_bow",
    favoredTreeName: "Bow",
    unlockedClassSkills: 3,
    loadoutTier: 8,
    loadoutSockets: 4,
    carriedEquipmentCount: 2,
    carriedRuneCount: 1,
    stashEntryCount: 3,
    stashEquipmentCount: 2,
    stashRuneCount: 1,
    plannedWeaponRunewordId: "",
    plannedArmorRunewordId: "",
    completedPlannedRunewordIds: [] as string[],
    activeRunewordIds: ["steel"],
    newFeatureIds: [] as string[],
    completedAt: new Date(`2026-03-0${(index % 8) + 1}T00:00:00.000Z`).toISOString(),
    outcome: "completed",
  }));
  profile.meta.progression.highestLevel = 12;
  profile.meta.progression.highestActCleared = 5;
  profile.meta.progression.totalBossesDefeated = 16;
  profile.meta.progression.totalGoldCollected = 6600;
  profile.meta.progression.totalRunewordsForged = 8;
  profile.meta.progression.classesPlayed = ["amazon", "sorceress", "necromancer", "barbarian"];
  profile.meta.unlocks.bossIds = ["andariel"];
  profile.meta.unlocks.runewordIds = ["steel"];

  persistence.ensureProfileMeta(profile);

  const accountSummary = persistence.getAccountProgressSummary(profile);
  const unlockedFeatureIds = new Set(profile.meta.unlocks.townFeatureIds);

  assert.ok(unlockedFeatureIds.has("sovereign_annals"));
  assert.ok(unlockedFeatureIds.has("merchant_principate"));
  assert.ok(unlockedFeatureIds.has("legend_doctrine"));
  assert.ok(unlockedFeatureIds.has("sovereign_exchange"));
  assert.ok(unlockedFeatureIds.has("legendary_annals"));
  assert.ok(unlockedFeatureIds.has("ascendant_exchange"));
  assert.equal(accountSummary.unlockedMilestoneCount, 22);
  assert.equal(accountSummary.milestoneCount, 25);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 6);
  assert.equal(accountSummary.review.unlockedConvergenceCount, 6);
  assert.equal(accountSummary.nextMilestoneId, "imperial_annals");
  assert.equal(accountSummary.nextMilestoneTitle, "Imperial Annals");
  assert.equal(accountSummary.review.nextConvergenceTitle, "Imperial Exchange");
  assert.equal(accountSummary.runHistoryCapacity, 100);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 6);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 8);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 8);
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "ascendant_exchange")?.status, "unlocked");
});

test("account progress summary unlocks third-wave milestones and convergences from persisted profile progress", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  profile.runHistory = Array.from({ length: 10 }, (_, index) => ({
    runId: `third_wave_${index}`,
    classId: "amazon",
    className: "Amazon",
    level: 13,
    actsCleared: 5,
    bossesDefeated: 2,
    goldGained: 920,
    runewordsForged: 1,
    skillPointsEarned: 3,
    classPointsEarned: 2,
    attributePointsEarned: 4,
    trainingRanksGained: 2,
    favoredTreeId: "amazon_bow",
    favoredTreeName: "Bow",
    unlockedClassSkills: 3,
    loadoutTier: 8,
    loadoutSockets: 4,
    carriedEquipmentCount: 2,
    carriedRuneCount: 1,
    stashEntryCount: 3,
    stashEquipmentCount: 2,
    stashRuneCount: 1,
    plannedWeaponRunewordId: "",
    plannedArmorRunewordId: "",
    completedPlannedRunewordIds: [] as string[],
    activeRunewordIds: ["steel"],
    newFeatureIds: [] as string[],
    completedAt: new Date(`2026-03-${String((index % 9) + 1).padStart(2, "0")}T00:00:00.000Z`).toISOString(),
    outcome: "completed",
  }));
  profile.meta.progression.highestLevel = 13;
  profile.meta.progression.highestActCleared = 5;
  profile.meta.progression.totalBossesDefeated = 20;
  profile.meta.progression.totalGoldCollected = 9200;
  profile.meta.progression.totalRunewordsForged = 10;
  profile.meta.progression.classesPlayed = ["amazon", "sorceress", "necromancer", "barbarian"];
  profile.meta.unlocks.bossIds = ["andariel"];
  profile.meta.unlocks.runewordIds = ["steel"];

  persistence.ensureProfileMeta(profile);

  const accountSummary = persistence.getAccountProgressSummary(profile);
  const unlockedFeatureIds = new Set(profile.meta.unlocks.townFeatureIds);

  assert.ok(unlockedFeatureIds.has("imperial_annals"));
  assert.ok(unlockedFeatureIds.has("trade_hegemony"));
  assert.ok(unlockedFeatureIds.has("mythic_doctrine"));
  assert.ok(unlockedFeatureIds.has("imperial_exchange"));
  assert.ok(unlockedFeatureIds.has("immortal_annals"));
  assert.ok(unlockedFeatureIds.has("mythic_exchange"));
  assert.equal(accountSummary.unlockedMilestoneCount, 25);
  assert.equal(accountSummary.milestoneCount, 25);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 9);
  assert.equal(accountSummary.review.unlockedConvergenceCount, 9);
  assert.equal(accountSummary.nextMilestoneId, "");
  assert.equal(accountSummary.review.nextConvergenceTitle, "");
  assert.equal(accountSummary.runHistoryCapacity, 125);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 7);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 9);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 9);
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "mythic_exchange")?.status, "unlocked");
});

test("profile migrations backfill richer archived run-history fields for older entries", () => {
  const { persistence } = createHarness();
  const restoredEnvelope = persistence.restoreProfile(
    JSON.stringify({
      schemaVersion: 2,
      savedAt: new Date("2026-03-07T00:00:00.000Z").toISOString(),
      profile: {
        activeRunSnapshot: null,
        stash: { entries: [] },
        runHistory: [
          {
            runId: "legacy_run",
            classId: "sorceress",
            className: "Sorceress",
            level: 8,
            actsCleared: 2,
            bossesDefeated: 1,
            completedAt: new Date("2026-03-07T01:00:00.000Z").toISOString(),
            outcome: "completed",
          },
        ],
        meta: {},
      },
    })
  );

  assert.ok(restoredEnvelope);
  const historyEntry = restoredEnvelope.profile.runHistory[0];
  assert.equal(historyEntry.goldGained, 0);
  assert.equal(historyEntry.runewordsForged, 0);
  assert.equal(historyEntry.skillPointsEarned, 0);
  assert.equal(historyEntry.classPointsEarned, 0);
  assert.equal(historyEntry.attributePointsEarned, 0);
  assert.equal(historyEntry.trainingRanksGained, 0);
  assert.equal(historyEntry.favoredTreeId, "");
  assert.equal(historyEntry.favoredTreeName, "");
  assert.equal(historyEntry.unlockedClassSkills, 0);
  assert.equal(historyEntry.loadoutTier, 0);
  assert.equal(historyEntry.loadoutSockets, 0);
  assert.equal(historyEntry.carriedEquipmentCount, 0);
  assert.equal(historyEntry.carriedRuneCount, 0);
  assert.equal(historyEntry.stashEntryCount, 0);
  assert.equal(historyEntry.stashEquipmentCount, 0);
  assert.equal(historyEntry.stashRuneCount, 0);
  assert.equal(Array.isArray(historyEntry.activeRunewordIds), true);
  assert.equal(historyEntry.activeRunewordIds.length, 0);
  assert.equal(Array.isArray(historyEntry.newFeatureIds), true);
  assert.equal(historyEntry.newFeatureIds.length, 0);
});
