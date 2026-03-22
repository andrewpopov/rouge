export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("profile persistence round-trips stash and run history beyond the active run snapshot", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 240;

  const vendorEquipment = state.run.town.vendor.stock.find((entry) => entry.kind === "equipment");
  assert.ok(vendorEquipment);
  let result = appEngine.useTownAction(state, `vendor_buy_${vendorEquipment.entryId}`);
  assert.equal(result.ok, true);

  const carriedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(carriedEquipment);
  result = appEngine.useTownAction(state, `inventory_stash_${carriedEquipment.entryId}`);
  assert.equal(result.ok, true);

  const savedProfile = persistence.loadProfileFromStorage();
  assert.ok(savedProfile);
  assert.equal(savedProfile.stash.entries.length, 1);
  assert.ok(savedProfile.activeRunSnapshot);

  const serializedProfile = persistence.serializeProfile(savedProfile);
  const restoredEnvelope = persistence.restoreProfile(serializedProfile);
  assert.ok(restoredEnvelope);
  assert.equal(restoredEnvelope.profile.stash.entries.length, 1);
  assert.ok(restoredEnvelope.profile.activeRunSnapshot);

  const lastPlayedClassId = state.run.classId;
  const abandonResult = appEngine.abandonSavedRun(state);
  assert.equal(abandonResult.ok, true);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.activeRunSnapshot, null);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
  assert.equal(archivedProfile.meta.progression.lastPlayedClassId, lastPlayedClassId);
  assert.ok(archivedProfile.meta.progression.classesPlayed.includes(lastPlayedClassId));

  const freshState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  assert.equal(freshState.ui.selectedClassId, lastPlayedClassId);
});

test("profile migrations backfill unlock and tutorial ownership for older envelopes", () => {
  const { persistence } = createHarness();
  const restoredEnvelope = persistence.restoreProfile(
    JSON.stringify({
      schemaVersion: 2,
      savedAt: new Date(0).toISOString(),
      profile: {
        activeRunSnapshot: null,
        stash: { entries: [] },
        runHistory: [
          {
            runId: "legacy_run",
            classId: "sorceress",
            className: "Sorceress",
            level: 6,
            actsCleared: 2,
            bossesDefeated: 2,
            goldGained: 0,
            runewordsForged: 0,
            skillPointsEarned: 0,
            classPointsEarned: 0,
            attributePointsEarned: 0,
            trainingRanksGained: 0,
            favoredTreeId: "",
            favoredTreeName: "",
            unlockedClassSkills: 0,
            loadoutTier: 0,
            loadoutSockets: 0,
            carriedEquipmentCount: 0,
            carriedRuneCount: 0,
            stashEntryCount: 0,
            stashEquipmentCount: 0,
            stashRuneCount: 0,
            activeRunewordIds: [],
            newFeatureIds: [],
            completedAt: new Date(0).toISOString(),
            outcome: "completed",
          },
        ],
        meta: {
          settings: {
            showHints: true,
            reduceMotion: false,
            compactMode: false,
          },
          progression: {
            highestLevel: 6,
            highestActCleared: 0,
            totalBossesDefeated: 0,
            totalGoldCollected: 0,
            totalRunewordsForged: 0,
            classesPlayed: ["sorceress"],
            preferredClassId: "sorceress",
            lastPlayedClassId: "sorceress",
          },
        },
      },
    })
  );

  assert.ok(restoredEnvelope);
  assert.equal(restoredEnvelope.profile.meta.progression.highestActCleared, 2);
  assert.ok(restoredEnvelope.profile.meta.unlocks.classIds.includes("sorceress"));
  assert.ok(restoredEnvelope.profile.meta.unlocks.townFeatureIds.includes("front_door_profile_hall"));
  assert.equal(restoredEnvelope.schemaVersion, 9);
  assert.equal(restoredEnvelope.profile.meta.planning.weaponRunewordId, "");
  assert.equal(restoredEnvelope.profile.meta.planning.armorRunewordId, "");
  assert.equal(restoredEnvelope.profile.meta.accountProgression.focusedTreeId, "archives");

  const profileSummary = persistence.getProfileSummary(restoredEnvelope.profile);
  assert.equal(profileSummary.unlockedClassCount, 1);
  assert.ok(profileSummary.townFeatureCount >= 1);
});

test("account progress summary derives milestone feature unlocks from persisted profile progress", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  profile.runHistory = [
    {
      runId: "run_001",
      classId: "amazon",
      className: "Amazon",
      level: 12,
      actsCleared: 3,
      bossesDefeated: 1,
      goldGained: 540,
      runewordsForged: 1,
      skillPointsEarned: 3,
      classPointsEarned: 2,
      attributePointsEarned: 4,
      trainingRanksGained: 3,
      favoredTreeId: "amazon_bow",
      favoredTreeName: "Bow",
      unlockedClassSkills: 3,
      loadoutTier: 6,
      loadoutSockets: 2,
      carriedEquipmentCount: 1,
      carriedRuneCount: 1,
      stashEntryCount: 2,
      stashEquipmentCount: 1,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: ["steel"],
      newFeatureIds: ["front_door_profile_hall"],
      completedAt: new Date("2026-03-07T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
    {
      runId: "run_002",
      classId: "sorceress",
      className: "Sorceress",
      level: 11,
      actsCleared: 2,
      bossesDefeated: 1,
      goldGained: 330,
      runewordsForged: 0,
      skillPointsEarned: 2,
      classPointsEarned: 1,
      attributePointsEarned: 2,
      trainingRanksGained: 2,
      favoredTreeId: "sorceress_fire",
      favoredTreeName: "Fire",
      unlockedClassSkills: 2,
      loadoutTier: 5,
      loadoutSockets: 1,
      carriedEquipmentCount: 1,
      carriedRuneCount: 0,
      stashEntryCount: 1,
      stashEquipmentCount: 1,
      stashRuneCount: 0,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: new Date("2026-03-06T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
    {
      runId: "run_003",
      classId: "necromancer",
      className: "Necromancer",
      level: 10,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 210,
      runewordsForged: 0,
      skillPointsEarned: 2,
      classPointsEarned: 1,
      attributePointsEarned: 1,
      trainingRanksGained: 1,
      favoredTreeId: "necromancer_summon",
      favoredTreeName: "Summoning",
      unlockedClassSkills: 2,
      loadoutTier: 4,
      loadoutSockets: 1,
      carriedEquipmentCount: 0,
      carriedRuneCount: 1,
      stashEntryCount: 1,
      stashEquipmentCount: 0,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: new Date("2026-03-05T00:00:00.000Z").toISOString(),
      outcome: "failed",
    },
    {
      runId: "run_004",
      classId: "amazon",
      className: "Amazon",
      level: 9,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 120,
      runewordsForged: 0,
      skillPointsEarned: 1,
      classPointsEarned: 1,
      attributePointsEarned: 1,
      trainingRanksGained: 1,
      favoredTreeId: "amazon_javelin",
      favoredTreeName: "Javelin",
      unlockedClassSkills: 1,
      loadoutTier: 3,
      loadoutSockets: 0,
      carriedEquipmentCount: 1,
      carriedRuneCount: 0,
      stashEntryCount: 0,
      stashEquipmentCount: 0,
      stashRuneCount: 0,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: new Date("2026-03-04T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
    {
      runId: "run_005",
      classId: "barbarian",
      className: "Barbarian",
      level: 13,
      actsCleared: 4,
      bossesDefeated: 2,
      goldGained: 700,
      runewordsForged: 1,
      skillPointsEarned: 4,
      classPointsEarned: 2,
      attributePointsEarned: 3,
      trainingRanksGained: 2,
      favoredTreeId: "barbarian_mastery",
      favoredTreeName: "Mastery",
      unlockedClassSkills: 4,
      loadoutTier: 7,
      loadoutSockets: 3,
      carriedEquipmentCount: 2,
      carriedRuneCount: 1,
      stashEntryCount: 3,
      stashEquipmentCount: 2,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: ["steel"],
      newFeatureIds: [],
      completedAt: new Date("2026-03-03T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
    {
      runId: "run_006",
      classId: "paladin",
      className: "Paladin",
      level: 8,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 160,
      runewordsForged: 0,
      skillPointsEarned: 1,
      classPointsEarned: 1,
      attributePointsEarned: 1,
      trainingRanksGained: 1,
      favoredTreeId: "paladin_combat",
      favoredTreeName: "Combat",
      unlockedClassSkills: 2,
      loadoutTier: 3,
      loadoutSockets: 1,
      carriedEquipmentCount: 0,
      carriedRuneCount: 1,
      stashEntryCount: 1,
      stashEquipmentCount: 0,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: new Date("2026-03-02T00:00:00.000Z").toISOString(),
      outcome: "failed",
    },
  ];
  profile.meta.progression.highestLevel = 12;
  profile.meta.progression.highestActCleared = 5;
  profile.meta.progression.totalBossesDefeated = 12;
  profile.meta.progression.totalGoldCollected = 4200;
  profile.meta.progression.totalRunewordsForged = 3;
  profile.meta.progression.classesPlayed = ["amazon", "sorceress", "necromancer", "barbarian", "paladin"];
  profile.meta.unlocks.bossIds = ["andariel"];
  profile.meta.unlocks.runewordIds = ["steel"];

  persistence.ensureProfileMeta(profile);

  const accountSummary = persistence.getAccountProgressSummary(profile);
  const unlockedFeatureIds = new Set(profile.meta.unlocks.townFeatureIds);

  assert.ok(unlockedFeatureIds.has("archive_ledger"));
  assert.ok(unlockedFeatureIds.has("boss_trophy_gallery"));
  assert.ok(unlockedFeatureIds.has("runeword_codex"));
  assert.ok(unlockedFeatureIds.has("advanced_vendor_stock"));
  assert.ok(unlockedFeatureIds.has("class_roster_archive"));
  assert.ok(unlockedFeatureIds.has("economy_ledger"));
  assert.ok(unlockedFeatureIds.has("chronicle_vault"));
  assert.ok(unlockedFeatureIds.has("heroic_annals"));
  assert.ok(unlockedFeatureIds.has("mythic_annals"));
  assert.ok(unlockedFeatureIds.has("eternal_annals"));
  assert.ok(unlockedFeatureIds.has("salvage_tithes"));
  assert.ok(unlockedFeatureIds.has("artisan_stock"));
  assert.ok(unlockedFeatureIds.has("brokerage_charter"));
  assert.ok(unlockedFeatureIds.has("treasury_exchange"));
  assert.ok(unlockedFeatureIds.has("training_grounds"));
  assert.ok(unlockedFeatureIds.has("war_college"));
  assert.ok(unlockedFeatureIds.has("paragon_doctrine"));
  assert.ok(unlockedFeatureIds.has("apex_doctrine"));
  assert.ok(unlockedFeatureIds.has("chronicle_exchange"));
  assert.ok(unlockedFeatureIds.has("war_annals"));
  assert.ok(unlockedFeatureIds.has("paragon_exchange"));
  assert.equal(accountSummary.unlockedMilestoneCount, 19);
  assert.equal(accountSummary.milestoneCount, 25);
  assert.equal(accountSummary.focusedTreeId, "archives");
  assert.equal(accountSummary.nextMilestoneId, "sovereign_annals");
  assert.equal(accountSummary.nextMilestoneTitle, "Sovereign Annals");
  assert.ok(accountSummary.unlockedFeatureIds.includes("economy_ledger"));
  assert.ok(accountSummary.unlockedFeatureIds.includes("brokerage_charter"));
  assert.equal(accountSummary.treeCount, 3);
  assert.equal(accountSummary.runHistoryCapacity, 75);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 5);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 7);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 7);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 3);
  assert.equal(accountSummary.review.unlockedConvergenceCount, 3);
  assert.equal(accountSummary.review.nextConvergenceTitle, "Sovereign Exchange");
  assert.equal(accountSummary.convergences.length, 9);
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "chronicle_exchange")?.status, "unlocked");
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "sovereign_exchange")?.status, "locked");
  assert.equal(accountSummary.archive.highestLoadoutTier, 7);
  assert.equal(accountSummary.archive.planningArchiveCount, 6);
  assert.equal(accountSummary.profile.dismissedTutorialCount, 0);
});
