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
  assert.equal(restoredEnvelope.schemaVersion, 8);
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
  assert.equal(accountSummary.unlockedMilestoneCount, 18);
  assert.equal(accountSummary.milestoneCount, 21);
  assert.equal(accountSummary.focusedTreeId, "archives");
  assert.equal(accountSummary.nextMilestoneId, "sovereign_annals");
  assert.equal(accountSummary.nextMilestoneTitle, "Sovereign Annals");
  assert.ok(accountSummary.unlockedFeatureIds.includes("economy_ledger"));
  assert.ok(accountSummary.unlockedFeatureIds.includes("brokerage_charter"));
  assert.equal(accountSummary.treeCount, 3);
  assert.equal(accountSummary.runHistoryCapacity, 75);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 5);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 7);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 6);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 3);
  assert.equal(accountSummary.review.unlockedConvergenceCount, 3);
  assert.equal(accountSummary.review.nextConvergenceTitle, "Sovereign Exchange");
  assert.equal(accountSummary.convergences.length, 6);
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "chronicle_exchange")?.status, "unlocked");
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "sovereign_exchange")?.status, "locked");
  assert.equal(accountSummary.archive.highestLoadoutTier, 7);
  assert.equal(accountSummary.archive.planningArchiveCount, 6);
  assert.equal(accountSummary.profile.dismissedTutorialCount, 0);
});

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
    completedPlannedRunewordIds: [],
    activeRunewordIds: ["steel"],
    newFeatureIds: [],
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
  assert.equal(accountSummary.unlockedMilestoneCount, 21);
  assert.equal(accountSummary.milestoneCount, 21);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 6);
  assert.equal(accountSummary.review.unlockedConvergenceCount, 6);
  assert.equal(accountSummary.nextMilestoneId, "");
  assert.equal(accountSummary.review.nextConvergenceTitle, "");
  assert.equal(accountSummary.runHistoryCapacity, 100);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 6);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 8);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 7);
  assert.equal(accountSummary.convergences.find((entry) => entry.id === "ascendant_exchange")?.status, "unlocked");
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

test("economy ledger changes vendor prices and refresh cost in town", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const buildState = (featureIds = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    state.run.gold = 200;

    const equipResult = itemSystem.applyChoice(
      state.run,
      {
        id: "economy_ledger_loadout",
        kind: "item",
        title: "Short Sword",
        subtitle: "Equip Weapon",
        description: "",
        previewLines: [],
        effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
      },
      content
    );
    assert.equal(equipResult.ok, true);

    const unequipResult = appEngine.useTownAction(state, "inventory_unequip_weapon");
    assert.equal(unequipResult.ok, true);

    state.run.town.vendor.stock = [
      {
        entryId: "vendor_test_blade",
        kind: "equipment",
        equipment: {
          entryId: "",
          itemId: "item_short_sword",
          slot: "weapon",
          socketsUnlocked: 0,
          insertedRunes: [],
          runewordId: "",
        },
      },
    ];

    return state;
  };
  const getTownAction = (state, actionId) => {
    return browserWindow.ROUGE_TOWN_SERVICES.listActions(content, state.run, state.profile).find((action) => action.id === actionId) || null;
  };

  const baselineState = buildState();
  const ledgerState = buildState(["economy_ledger"]);

  const baselineRefresh = getTownAction(baselineState, "vendor_refresh_stock");
  const ledgerRefresh = getTownAction(ledgerState, "vendor_refresh_stock");
  const baselineBuy = getTownAction(baselineState, "vendor_buy_vendor_test_blade");
  const ledgerBuy = getTownAction(ledgerState, "vendor_buy_vendor_test_blade");
  const baselineInventoryEntry = baselineState.run.inventory.carried[0];
  const ledgerInventoryEntry = ledgerState.run.inventory.carried[0];
  assert.ok(baselineInventoryEntry);
  assert.ok(ledgerInventoryEntry);
  const baselineSell = getTownAction(baselineState, `inventory_sell_${baselineInventoryEntry.entryId}`);
  const ledgerSell = getTownAction(ledgerState, `inventory_sell_${ledgerInventoryEntry.entryId}`);

  assert.ok(baselineRefresh);
  assert.ok(ledgerRefresh);
  assert.ok(baselineBuy);
  assert.ok(ledgerBuy);
  assert.ok(baselineSell);
  assert.ok(ledgerSell);
  assert.ok(ledgerRefresh.cost < baselineRefresh.cost);
  assert.ok(ledgerBuy.cost < baselineBuy.cost);

  let result = appEngine.useTownAction(baselineState, "vendor_buy_vendor_test_blade");
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(ledgerState, "vendor_buy_vendor_test_blade");
  assert.equal(result.ok, true);
  assert.ok(ledgerState.run.gold > baselineState.run.gold);

  result = appEngine.useTownAction(baselineState, `inventory_sell_${baselineInventoryEntry.entryId}`);
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(ledgerState, `inventory_sell_${ledgerInventoryEntry.entryId}`);
  assert.equal(result.ok, true);
  assert.ok(ledgerState.run.gold > baselineState.run.gold);
});

test("advanced vendor stock improves opening-town offer depth on a progressed account", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const buildState = (featureIds = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    state.run.town.vendor.refreshCount = 1;
    return state;
  };
  const getMaxTier = (state) => {
    return state.run.town.vendor.stock
      .filter((entry) => entry.kind === "equipment")
      .reduce((highestTier, entry) => {
        return Math.max(highestTier, content.itemCatalog[entry.equipment.itemId]?.progressionTier || 0);
      }, 0);
  };

  const baselineState = buildState();
  const advancedState = buildState(["advanced_vendor_stock"]);

  assert.ok(advancedState.run.town.vendor.stock.length > baselineState.run.town.vendor.stock.length);
  assert.ok(getMaxTier(advancedState) > getMaxTier(baselineState));
});

test("runeword codex widens vendor rune routing for unfinished recipes", () => {
  const { content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const buildState = (featureIds = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);

    ([
      {
        id: "codex_weapon",
        kind: "item",
        title: "Short Sword",
        subtitle: "Equip Weapon",
        description: "",
        previewLines: [],
        effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
      },
      {
        id: "codex_socket_1",
        kind: "socket",
        title: "Socket",
        subtitle: "Open Socket",
        description: "",
        previewLines: [],
        effects: [{ kind: "add_socket", slot: "weapon" }],
      },
      {
        id: "codex_socket_2",
        kind: "socket",
        title: "Socket",
        subtitle: "Open Socket",
        description: "",
        previewLines: [],
        effects: [{ kind: "add_socket", slot: "weapon" }],
      },
    ] satisfies RewardChoice[]).forEach((choice) => {
      const applyResult = itemSystem.applyChoice(state.run, choice, content);
      assert.equal(applyResult.ok, true);
    });

    state.run.town.vendor.stock = [];
    itemSystem.hydrateRunInventory(state.run, content, state.profile);
    return state;
  };
  const getVendorRunes = (state) => {
    return state.run.town.vendor.stock.filter((entry) => entry.kind === "rune").map((entry) => entry.runeId);
  };

  const baselineState = buildState();
  const codexState = buildState(["runeword_codex"]);
  const baselineRunes = getVendorRunes(baselineState);
  const codexRunes = getVendorRunes(codexState);

  assert.ok(baselineRunes.includes("rune_tir"));
  assert.ok(!baselineRunes.includes("rune_el"));
  assert.ok(codexRunes.includes("rune_tir"));
  assert.ok(codexRunes.includes("rune_el"));
  assert.ok(codexRunes.length > baselineRunes.length);
});

test("treasury exchange adds direct vendor-to-stash consignment and stash-aware rune routing", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const buildState = (featureIds = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    state.run.gold = 1000;
    state.profile.stash.entries = [
      {
        entryId: "stash_plan_blade",
        kind: "equipment",
        equipment: {
          entryId: "stash_plan_blade",
          itemId: "item_short_sword",
          slot: "weapon",
          socketsUnlocked: 2,
          insertedRunes: ["rune_tir"],
          runewordId: "",
        },
      },
    ];
    state.run.town.vendor.refreshCount = 1;
    state.run.town.vendor.stock = [];
    itemSystem.hydrateRunInventory(state.run, content, state.profile);
    return state;
  };
  const getVendorRunes = (state) => {
    return state.run.town.vendor.stock.filter((entry) => entry.kind === "rune").map((entry) => entry.runeId);
  };

  const baselineState = buildState();
  const treasuryState = buildState(["treasury_exchange"]);
  const stashEquipment = treasuryState.profile.stash.entries.find((entry) => entry.kind === "equipment")?.equipment || null;
  const planningRuneword = browserWindow.ROUGE_ITEM_CATALOG.getPreferredRunewordForEquipment(stashEquipment, treasuryState.run, content);
  assert.ok(planningRuneword);
  const targetRuneId = planningRuneword.requiredRunes[stashEquipment.insertedRunes.length];
  assert.ok(targetRuneId);

  const baselineRunes = getVendorRunes(baselineState);
  const treasuryRunes = getVendorRunes(treasuryState);
  assert.ok(!baselineRunes.includes(targetRuneId));
  assert.ok(treasuryRunes.includes(targetRuneId));

  const baselineActions = itemSystem.listTownActions(baselineState.run, baselineState.profile, content);
  const treasuryActions = itemSystem.listTownActions(treasuryState.run, treasuryState.profile, content);
  assert.equal(baselineActions.some((action) => action.id.startsWith("vendor_consign_")), false);

  const consignTarget = treasuryState.run.town.vendor.stock.find((entry) => entry.kind === "equipment") || treasuryState.run.town.vendor.stock[0];
  assert.ok(consignTarget);
  const consignAction = treasuryActions.find((action) => action.id === `vendor_consign_${consignTarget.entryId}`);
  assert.ok(consignAction);
  assert.match(consignAction.previewLines.join(" "), /consignment fee/i);

  const startingGold = treasuryState.run.gold;
  const startingStashEntries = treasuryState.profile.stash.entries.length;
  const startingCarriedEntries = treasuryState.run.inventory.carried.length;
  const startingVendorEntries = treasuryState.run.town.vendor.stock.length;
  const result = appEngine.useTownAction(treasuryState, consignAction.id);
  assert.equal(result.ok, true);
  assert.equal(treasuryState.run.gold, startingGold - consignAction.cost);
  assert.equal(treasuryState.profile.stash.entries.length, startingStashEntries + 1);
  assert.equal(treasuryState.run.inventory.carried.length, startingCarriedEntries);
  assert.equal(treasuryState.run.town.vendor.stock.length, startingVendorEntries - 1);

  const consignedEntry = treasuryState.profile.stash.entries.find((entry) => entry.entryId !== "stash_plan_blade");
  assert.ok(consignedEntry);
  const inventorySummary = itemSystem.getInventorySummary(treasuryState.run, treasuryState.profile, content);
  assert.match(inventorySummary.join(" "), /consign vendor offers directly into stash/i);
});

test("runeword planning charters steer vendor consignment previews and reward item pivots", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  [
    "advanced_vendor_stock",
    "runeword_codex",
    "economy_ledger",
    "salvage_tithes",
    "artisan_stock",
    "brokerage_charter",
    "treasury_exchange",
  ].forEach((featureId) => {
    if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
      state.profile.meta.unlocks.townFeatureIds.push(featureId);
    }
  });

  let result = appEngine.setPlannedRuneword(state, "weapon", "white");
  assert.equal(result.ok, true);
  result = appEngine.setPlannedRuneword(state, "armor", "lionheart");
  assert.equal(result.ok, true);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  state.run.gold = 1500;
  state.run.currentActIndex = 4;
  state.run.level = 11;
  state.run.summary.zonesCleared = 8;
  state.run.summary.encountersCleared = 12;
  state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
  state.run.town.vendor.refreshCount = 2;
  state.run.town.vendor.stock = [];
  state.run.loadout.weapon = null;
  state.run.loadout.armor = {
    entryId: "planning_armor_base",
    itemId: "item_quilted_armor",
    slot: "armor",
    socketsUnlocked: 0,
    insertedRunes: [],
    runewordId: "",
  };
  runFactory.hydrateRun(state.run, content);
  itemSystem.hydrateRunInventory(state.run, content, state.profile);

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponRunewordId, "white");
  assert.equal(accountSummary.planning.armorRunewordId, "lionheart");
  assert.equal(accountSummary.planning.unfulfilledPlanCount, 2);
  assert.equal(accountSummary.planning.overview.nextActionLabel, "Hunt Bases");
  assert.equal(accountSummary.planning.overview.missingBaseCharterCount, 2);

  const consignmentAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id.startsWith("vendor_consign_") && /Armor charter match: Lionheart/i.test(action.previewLines.join(" ")));
  assert.ok(consignmentAction);
  const refreshAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  assert.ok(refreshAction);
  assert.match(refreshAction.previewLines.join(" "), /Next charter push: Hunt Bases\./i);
  assert.match(refreshAction.previewLines.join(" "), /Archive charter still open for White and Lionheart/i);

  state.run.town.vendor.stock = [
    {
      entryId: "repeat_white_offer",
      kind: "equipment",
      equipment: {
        entryId: "repeat_white_offer",
        itemId: "item_bone_wand",
        slot: "weapon",
        socketsUnlocked: 2,
        insertedRunes: [],
        runewordId: "",
      },
    },
  ];
  const preArchiveRepeatConsignAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id === "vendor_consign_repeat_white_offer");
  assert.ok(preArchiveRepeatConsignAction);

  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);
  const rewardChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: state.run.actNumber,
    encounterNumber: 1,
    profile: state.profile,
  });
  assert.ok(rewardChoice);
  assert.equal(rewardChoice.kind, "item");
  assert.match(rewardChoice.previewLines.join(" "), /Planning charter: White/i);
  assert.match(rewardChoice.previewLines.join(" "), /Archive charter still unfulfilled across the account/i);

  state.run.summary.actsCleared = 4;
  state.run.summary.runewordsForged = 1;
  state.run.progression.activatedRunewords = ["white"];
  browserWindow.ROUGE_PERSISTENCE.recordRunHistory(state.profile, state.run, "completed", content);

  const archivedSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(archivedSummary.planning.weaponCompletedRunCount, 1);
  assert.equal(archivedSummary.planning.unfulfilledPlanCount, 1);
  assert.equal(archivedSummary.planning.weaponCharter?.bestCompletedClassName, state.run.className);
  assert.equal(archivedSummary.planning.weaponCharter?.bestActsCleared, 4);
  assert.ok((archivedSummary.planning.overview.fulfilledRunewordIds || []).includes("white"));
  assert.equal(archivedSummary.planning.overview.bestFulfilledActsCleared, 4);

  state.run.town.vendor.stock = [
    {
      entryId: "repeat_white_offer",
      kind: "equipment",
      equipment: {
        entryId: "repeat_white_offer",
        itemId: "item_bone_wand",
        slot: "weapon",
        socketsUnlocked: 2,
        insertedRunes: [],
        runewordId: "",
      },
    },
  ];
  const archivedRepeatConsignAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id === "vendor_consign_repeat_white_offer");
  assert.ok(archivedRepeatConsignAction);
  assert.notEqual(archivedRepeatConsignAction.cost, preArchiveRepeatConsignAction.cost);
  assert.match(archivedRepeatConsignAction.previewLines.join(" "), /Archive already completed White through Act 4/i);
  assert.match(archivedRepeatConsignAction.previewLines.join(" "), /repeat forge lane/i);

  state.profile.stash.entries.push({
    entryId: "stash_ready_white",
    kind: "equipment",
    equipment: {
      entryId: "stash_ready_white",
      itemId: "item_bone_wand",
      slot: "weapon",
      socketsUnlocked: 2,
      insertedRunes: ["rune_dol"],
      runewordId: "",
    },
  });
  itemSystem.hydrateProfileStash(state.profile, content);

  const stagedSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(stagedSummary.planning.overview.nextActionLabel, "Stock Runes");
  assert.equal(stagedSummary.planning.overview.readyCharterCount, 1);
  assert.match(stagedSummary.planning.overview.nextActionSummary, /repeat forge/i);

  state.run.town.vendor.stock = [];
  itemSystem.hydrateRunInventory(state.run, content, state.profile);
  const settledRefreshAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  assert.ok(settledRefreshAction);
  assert.match(settledRefreshAction.previewLines.join(" "), /Next charter push: Stock Runes\./i);
  assert.match(settledRefreshAction.previewLines.join(" "), /Archive mastery: White already cleared up through Act 4/i);
  assert.match(settledRefreshAction.previewLines.join(" "), /Archive charter still open for Lionheart/i);
  assert.doesNotMatch(settledRefreshAction.previewLines.join(" "), /Archive charter still open for White and Lionheart/i);

  const archivedRewardChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: state.run.actNumber,
    encounterNumber: 1,
    profile: state.profile,
  });
  assert.ok(archivedRewardChoice);
  assert.doesNotMatch(archivedRewardChoice.previewLines.join(" "), /Archive charter still unfulfilled across the account/i);
  assert.match(archivedRewardChoice.previewLines.join(" "), /repeat forge/i);
});

test("archived run history captures progression, economy, and account feature carry-through", () => {
  const { classRegistry, content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.startRun(state);

  const classProgression = classRegistry.getClassProgression(content, state.run.classId);
  assert.ok(classProgression);
  const favoredTree = classProgression.trees[0];
  assert.ok(favoredTree);

  state.run.progression.classProgression.favoredTreeId = favoredTree.id;
  state.run.progression.classProgression.treeRanks[favoredTree.id] = 1;
  state.run.progression.classProgression.unlockedSkillIds = [favoredTree.skills[0].id];
  state.run.progression.activatedRunewords = ["steel"];
  state.run.progression.bossTrophies = ["andariel"];
  state.run.loadout.weapon = {
    entryId: "history_weapon",
    itemId: "item_short_sword",
    slot: "weapon",
    socketsUnlocked: 0,
    insertedRunes: [],
    runewordId: "",
  };
  state.run.loadout.armor = {
    entryId: "history_armor",
    itemId: "item_quilted_armor",
    slot: "armor",
    socketsUnlocked: 1,
    insertedRunes: ["rune_el"],
    runewordId: "",
  };
  state.run.inventory.carried = [
    {
      entryId: "carry_equipment",
      kind: "equipment",
      equipment: {
        entryId: "carry_equipment",
        itemId: "item_short_sword",
        slot: "weapon",
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    },
    {
      entryId: "carry_rune",
      kind: "rune",
      runeId: "rune_el",
    },
  ];
  state.profile.stash.entries = [
    {
      entryId: "stash_armor",
      kind: "equipment",
      equipment: {
        entryId: "stash_armor",
        itemId: "item_quilted_armor",
        slot: "armor",
        socketsUnlocked: 1,
        insertedRunes: [],
        runewordId: "",
      },
    },
    {
      entryId: "stash_rune",
      kind: "rune",
      runeId: "rune_tir",
    },
  ];
  state.run.summary.actsCleared = 3;
  state.run.summary.bossesDefeated = 1;
  state.run.summary.goldGained = 540;
  state.run.summary.runewordsForged = 1;
  state.run.summary.skillPointsEarned = 4;
  state.run.summary.classPointsEarned = 2;
  state.run.summary.attributePointsEarned = 1;
  state.run.summary.trainingRanksGained = 3;

  const progressionSummary = runFactory.getProgressionSummary(state.run, content);
  persistence.recordRunHistory(state.profile, state.run, "completed", content);

  const historyEntry = state.profile.runHistory[0];
  assert.equal(historyEntry.goldGained, 540);
  assert.equal(historyEntry.runewordsForged, 1);
  assert.equal(historyEntry.skillPointsEarned, 4);
  assert.equal(historyEntry.classPointsEarned, 2);
  assert.equal(historyEntry.attributePointsEarned, 1);
  assert.equal(historyEntry.trainingRanksGained, 3);
  assert.equal(historyEntry.favoredTreeId, progressionSummary.favoredTreeId);
  assert.equal(historyEntry.favoredTreeName, progressionSummary.favoredTreeName);
  assert.equal(historyEntry.unlockedClassSkills, progressionSummary.unlockedClassSkills);
  assert.ok(historyEntry.loadoutTier > 0);
  assert.equal(historyEntry.loadoutSockets, 1);
  assert.equal(historyEntry.carriedEquipmentCount, 1);
  assert.equal(historyEntry.carriedRuneCount, 1);
  assert.equal(historyEntry.stashEntryCount, 2);
  assert.equal(historyEntry.stashEquipmentCount, 1);
  assert.equal(historyEntry.stashRuneCount, 1);
  assert.ok(historyEntry.activeRunewordIds.includes("steel"));
  assert.ok(historyEntry.newFeatureIds.includes("archive_ledger"));
  assert.ok(historyEntry.newFeatureIds.includes("boss_trophy_gallery"));
  assert.ok(historyEntry.newFeatureIds.includes("runeword_codex"));
  assert.ok(historyEntry.newFeatureIds.includes("advanced_vendor_stock"));
  assert.ok(historyEntry.newFeatureIds.includes("economy_ledger"));
});

test("reward generation consumes account milestones for payout and boss pivots", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const buildState = (featureIds = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    return state;
  };
  const fakeCombatState = (state) =>
    ({
      hero: { life: state.run.hero.currentLife },
      mercenary: { life: state.run.mercenary.currentLife },
    } as CombatState);

  const baselineState = buildState();
  const featuredState = buildState(["economy_ledger", "boss_trophy_gallery"]);

  const minibossZone = runFactory.getCurrentZones(baselineState.run).find((zone) => zone.kind === "miniboss");
  const bossZone = runFactory.getCurrentZones(baselineState.run).find((zone) => zone.kind === "boss");
  const featuredMinibossZone = runFactory.getCurrentZones(featuredState.run).find((zone) => zone.kind === "miniboss");
  const featuredBossZone = runFactory.getCurrentZones(featuredState.run).find((zone) => zone.kind === "boss");
  assert.ok(minibossZone);
  assert.ok(bossZone);
  assert.ok(featuredMinibossZone);
  assert.ok(featuredBossZone);

  const baselineMinibossReward = runFactory.buildEncounterReward({
    run: baselineState.run,
    zone: minibossZone,
    combatState: fakeCombatState(baselineState),
    content,
    profile: baselineState.profile,
  });
  const featuredMinibossReward = runFactory.buildEncounterReward({
    run: featuredState.run,
    zone: featuredMinibossZone,
    combatState: fakeCombatState(featuredState),
    content,
    profile: featuredState.profile,
  });

  assert.ok(featuredMinibossReward.grants.gold > baselineMinibossReward.grants.gold);
  assert.match(featuredMinibossReward.lines.join(" "), /Economy Ledger dividend/i);

  const baselineMinibossGoldBonus = baselineMinibossReward.choices
    .flatMap((choice) => choice.effects.filter((effect) => effect.kind === "gold_bonus"))
    .reduce((highest, effect) => Math.max(highest, effect.value), 0);
  const featuredMinibossGoldBonus = featuredMinibossReward.choices
    .flatMap((choice) => choice.effects.filter((effect) => effect.kind === "gold_bonus"))
    .reduce((highest, effect) => Math.max(highest, effect.value), 0);

  assert.ok(featuredMinibossGoldBonus > baselineMinibossGoldBonus);

  const baselineBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baselineState.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
    profile: baselineState.profile,
  });
  const featuredBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: featuredState.run,
    zone: featuredBossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
    profile: featuredState.profile,
  });

  const baselineBossProgression = baselineBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const featuredBossProgression = featuredBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  assert.ok(baselineBossProgression);
  assert.ok(featuredBossProgression);

  const baselineBossClassPoints = baselineBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" ? effect.value : 0);
  }, 0);
  const featuredBossClassPoints = featuredBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" ? effect.value : 0);
  }, 0);

  assert.ok(featuredBossClassPoints > baselineBossClassPoints);
  assert.match(featuredBossProgression.previewLines.join(" "), /Boss Trophy Gallery/i);
});

test("account progression trees drive archive retention, economy focus, and mastery focus behavior", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, persistence, runFactory, seedBundle } = createHarness();
  const buildState = (featureIds = [], focusedTreeId = "") => {
    persistence.clearStorage();
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });
    if (focusedTreeId) {
      const focusResult = appEngine.setAccountProgressionFocus(state, focusedTreeId);
      assert.equal(focusResult.ok, true);
    }

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    return state;
  };
  const prepareLateActState = (state: AppState, includeVendorHydration = false) => {
    state.run.currentActIndex = 4;
    state.run.level = 11;
    state.run.summary.zonesCleared = 8;
    state.run.summary.encountersCleared = 12;
    state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
    state.run.town.vendor.refreshCount = 2;
    state.run.town.vendor.stock = [];
    runFactory.hydrateRun(state.run, content);
    if (includeVendorHydration) {
      itemSystem.hydrateRunInventory(state.run, content, state.profile);
    }
  };

  const baselineEconomyState = buildState(["advanced_vendor_stock", "runeword_codex", "economy_ledger"]);
  const focusedEconomyState = buildState(["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes"], "economy");

  baselineEconomyState.run.town.vendor.refreshCount = 2;
  focusedEconomyState.run.town.vendor.refreshCount = 2;

  const baselineRefreshAction = itemSystem
    .listTownActions(baselineEconomyState.run, baselineEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const focusedRefreshAction = itemSystem
    .listTownActions(focusedEconomyState.run, focusedEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");

  assert.ok(baselineRefreshAction);
  assert.ok(focusedRefreshAction);
  assert.ok(focusedEconomyState.run.town.vendor.stock.length > baselineEconomyState.run.town.vendor.stock.length);
  assert.ok(focusedRefreshAction.cost < baselineRefreshAction.cost);

  const lateEconomyBaselineState = buildState(["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes"], "economy");
  const lateEconomyArtisanState = buildState(
    ["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes", "artisan_stock"],
    "economy"
  );
  const lateEconomyBrokerageState = buildState(
    ["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes", "artisan_stock", "brokerage_charter"],
    "economy"
  );
  const lateEconomyTreasuryState = buildState(
    ["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes", "artisan_stock", "brokerage_charter", "treasury_exchange"],
    "economy"
  );
  const chronicleEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "chronicle_exchange",
    ],
    "economy"
  );
  const merchantEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
    ],
    "economy"
  );
  const sovereignEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
      "sovereign_exchange",
    ],
    "economy"
  );
  const ascendantEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
      "ascendant_exchange",
    ],
    "economy"
  );
  prepareLateActState(lateEconomyBaselineState, true);
  prepareLateActState(lateEconomyArtisanState, true);
  prepareLateActState(lateEconomyBrokerageState, true);
  prepareLateActState(lateEconomyTreasuryState, true);
  prepareLateActState(chronicleEconomyState, true);
  prepareLateActState(merchantEconomyState, true);
  prepareLateActState(sovereignEconomyState, true);
  prepareLateActState(ascendantEconomyState, true);

  const baselineLateSocketOffers = lateEconomyBaselineState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const artisanLateSocketOffers = lateEconomyArtisanState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const brokerageLateSocketOffers = lateEconomyBrokerageState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const treasuryLateSocketOffers = lateEconomyTreasuryState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const chronicleLateSocketOffers = chronicleEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const merchantLateSocketOffers = merchantEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const sovereignLateSocketOffers = sovereignEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const ascendantLateSocketOffers = ascendantEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const baselineLateRefreshAction = itemSystem
    .listTownActions(lateEconomyBaselineState.run, lateEconomyBaselineState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const artisanLateRefreshAction = itemSystem
    .listTownActions(lateEconomyArtisanState.run, lateEconomyArtisanState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const brokerageLateRefreshAction = itemSystem
    .listTownActions(lateEconomyBrokerageState.run, lateEconomyBrokerageState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const treasuryLateRefreshAction = itemSystem
    .listTownActions(lateEconomyTreasuryState.run, lateEconomyTreasuryState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const chronicleLateRefreshAction = itemSystem
    .listTownActions(chronicleEconomyState.run, chronicleEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const merchantLateRefreshAction = itemSystem
    .listTownActions(merchantEconomyState.run, merchantEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const sovereignLateRefreshAction = itemSystem
    .listTownActions(sovereignEconomyState.run, sovereignEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const ascendantLateRefreshAction = itemSystem
    .listTownActions(ascendantEconomyState.run, ascendantEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");

  assert.ok(baselineLateRefreshAction);
  assert.ok(artisanLateRefreshAction);
  assert.ok(brokerageLateRefreshAction);
  assert.ok(treasuryLateRefreshAction);
  assert.ok(chronicleLateRefreshAction);
  assert.ok(merchantLateRefreshAction);
  assert.ok(sovereignLateRefreshAction);
  assert.ok(ascendantLateRefreshAction);
  assert.ok(artisanLateRefreshAction.cost < baselineLateRefreshAction.cost);
  assert.ok(brokerageLateRefreshAction.cost < artisanLateRefreshAction.cost);
  assert.ok(treasuryLateRefreshAction.cost < brokerageLateRefreshAction.cost);
  assert.ok(chronicleLateRefreshAction.cost <= treasuryLateRefreshAction.cost);
  assert.ok(merchantLateRefreshAction.cost < treasuryLateRefreshAction.cost);
  assert.ok(sovereignLateRefreshAction.cost <= merchantLateRefreshAction.cost);
  assert.ok(ascendantLateRefreshAction.cost <= sovereignLateRefreshAction.cost);
  assert.ok(artisanLateSocketOffers.length >= baselineLateSocketOffers.length);
  assert.ok(brokerageLateSocketOffers.length >= artisanLateSocketOffers.length);
  assert.ok(treasuryLateSocketOffers.length >= brokerageLateSocketOffers.length);
  assert.ok(chronicleLateSocketOffers.length >= treasuryLateSocketOffers.length);
  assert.ok(merchantLateSocketOffers.length >= treasuryLateSocketOffers.length);
  assert.ok(sovereignLateSocketOffers.length >= merchantLateSocketOffers.length);
  assert.ok(ascendantLateSocketOffers.length >= sovereignLateSocketOffers.length);
  assert.ok(artisanLateSocketOffers.length > 0);
  assert.ok(lateEconomyBrokerageState.run.town.vendor.stock.length >= lateEconomyArtisanState.run.town.vendor.stock.length);
  assert.ok(lateEconomyTreasuryState.run.town.vendor.stock.length >= lateEconomyBrokerageState.run.town.vendor.stock.length);
  assert.ok(chronicleEconomyState.run.town.vendor.stock.length >= lateEconomyTreasuryState.run.town.vendor.stock.length);
  assert.ok(merchantEconomyState.run.town.vendor.stock.length >= lateEconomyTreasuryState.run.town.vendor.stock.length);
  assert.ok(sovereignEconomyState.run.town.vendor.stock.length >= merchantEconomyState.run.town.vendor.stock.length);
  assert.ok(ascendantEconomyState.run.town.vendor.stock.length >= sovereignEconomyState.run.town.vendor.stock.length);
  assert.match(treasuryLateRefreshAction.previewLines.join(" "), /Treasury Exchange/i);
  assert.match(chronicleLateRefreshAction.previewLines.join(" "), /Chronicle Exchange/i);
  assert.match(merchantLateRefreshAction.previewLines.join(" "), /Merchant Principate/i);
  assert.match(sovereignLateRefreshAction.previewLines.join(" "), /Sovereign Exchange/i);
  assert.match(ascendantLateRefreshAction.previewLines.join(" "), /Ascendant Exchange/i);

  const baselineMasteryState = buildState(["boss_trophy_gallery", "training_grounds"], "mastery");
  const focusedMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college"], "mastery");
  const paragonMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine"], "mastery");
  const apexMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine"], "mastery");
  const warAnnalsState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "war_annals"],
    "mastery"
  );
  const legendMasteryState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "legend_doctrine"],
    "mastery"
  );
  const legendaryAnnalsState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "legend_doctrine", "legendary_annals"],
    "mastery"
  );
  prepareLateActState(baselineMasteryState);
  prepareLateActState(focusedMasteryState);
  prepareLateActState(paragonMasteryState);
  prepareLateActState(apexMasteryState);
  prepareLateActState(warAnnalsState);
  prepareLateActState(legendMasteryState);
  prepareLateActState(legendaryAnnalsState);
  const baselineBossZone = runFactory.getCurrentZones(baselineMasteryState.run).find((zone) => zone.kind === "boss");
  const focusedBossZone = runFactory.getCurrentZones(focusedMasteryState.run).find((zone) => zone.kind === "boss");
  const paragonBossZone = runFactory.getCurrentZones(paragonMasteryState.run).find((zone) => zone.kind === "boss");
  const apexBossZone = runFactory.getCurrentZones(apexMasteryState.run).find((zone) => zone.kind === "boss");
  const warAnnalsBossZone = runFactory.getCurrentZones(warAnnalsState.run).find((zone) => zone.kind === "boss");
  const legendBossZone = runFactory.getCurrentZones(legendMasteryState.run).find((zone) => zone.kind === "boss");
  const legendaryAnnalsBossZone = runFactory.getCurrentZones(legendaryAnnalsState.run).find((zone) => zone.kind === "boss");

  assert.ok(baselineBossZone);
  assert.ok(focusedBossZone);
  assert.ok(paragonBossZone);
  assert.ok(apexBossZone);
  assert.ok(warAnnalsBossZone);
  assert.ok(legendBossZone);
  assert.ok(legendaryAnnalsBossZone);

  const baselineBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baselineMasteryState.run,
    zone: baselineBossZone,
    actNumber: baselineBossZone.actNumber,
    encounterNumber: 1,
    profile: baselineMasteryState.profile,
  });
  const focusedBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: focusedMasteryState.run,
    zone: focusedBossZone,
    actNumber: focusedBossZone.actNumber,
    encounterNumber: 1,
    profile: focusedMasteryState.profile,
  });
  const paragonBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: paragonMasteryState.run,
    zone: paragonBossZone,
    actNumber: paragonBossZone.actNumber,
    encounterNumber: 1,
    profile: paragonMasteryState.profile,
  });
  const apexBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: apexMasteryState.run,
    zone: apexBossZone,
    actNumber: apexBossZone.actNumber,
    encounterNumber: 1,
    profile: apexMasteryState.profile,
  });
  const warAnnalsBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: warAnnalsState.run,
    zone: warAnnalsBossZone,
    actNumber: warAnnalsBossZone.actNumber,
    encounterNumber: 1,
    profile: warAnnalsState.profile,
  });
  const legendBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: legendMasteryState.run,
    zone: legendBossZone,
    actNumber: legendBossZone.actNumber,
    encounterNumber: 1,
    profile: legendMasteryState.profile,
  });
  const legendaryAnnalsBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: legendaryAnnalsState.run,
    zone: legendaryAnnalsBossZone,
    actNumber: legendaryAnnalsBossZone.actNumber,
    encounterNumber: 1,
    profile: legendaryAnnalsState.profile,
  });

  const baselineBossProgression = baselineBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const focusedBossProgression = focusedBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const paragonBossProgression = paragonBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const apexBossProgression = apexBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const warAnnalsBossProgression = warAnnalsBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const legendBossProgression = legendBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const legendaryAnnalsBossProgression = legendaryAnnalsBossChoices.find((choice) =>
    choice.effects.some((effect) => effect.kind === "class_point")
  );

  assert.ok(baselineBossProgression);
  assert.ok(focusedBossProgression);
  assert.ok(paragonBossProgression);
  assert.ok(apexBossProgression);
  assert.ok(warAnnalsBossProgression);
  assert.ok(legendBossProgression);
  assert.ok(legendaryAnnalsBossProgression);

  const baselineBossProgressionPoints = baselineBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const focusedBossProgressionPoints = focusedBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const paragonBossProgressionPoints = paragonBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const apexBossProgressionPoints = apexBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const warAnnalsBossProgressionPoints = warAnnalsBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const legendBossProgressionPoints = legendBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const legendaryAnnalsBossProgressionPoints = legendaryAnnalsBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);

  assert.ok(focusedBossProgressionPoints > baselineBossProgressionPoints);
  assert.ok(paragonBossProgressionPoints > focusedBossProgressionPoints);
  assert.ok(apexBossProgressionPoints > paragonBossProgressionPoints);
  assert.ok(warAnnalsBossProgressionPoints > apexBossProgressionPoints);
  assert.ok(legendBossProgressionPoints > warAnnalsBossProgressionPoints);
  assert.ok(legendaryAnnalsBossProgressionPoints > legendBossProgressionPoints);
  assert.match(focusedBossProgression.previewLines.join(" "), /Training Grounds|Mastery Hall focus|War College/i);
  assert.match(paragonBossProgression.previewLines.join(" "), /Paragon Doctrine/i);
  assert.match(apexBossProgression.previewLines.join(" "), /Apex Doctrine/i);
  assert.match(warAnnalsBossProgression.previewLines.join(" "), /War Annals/i);
  assert.match(legendBossProgression.previewLines.join(" "), /Legend Doctrine/i);
  assert.match(legendaryAnnalsBossProgression.previewLines.join(" "), /Legendary Annals/i);

  const archiveProfile = persistence.createEmptyProfile();
  archiveProfile.meta.unlocks.townFeatureIds.push("archive_ledger", "chronicle_vault", "heroic_annals", "mythic_annals", "eternal_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 65);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 70);

  archiveProfile.meta.unlocks.townFeatureIds.push("treasury_exchange", "chronicle_exchange");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.ok(persistence.getRunHistoryCapacity(archiveProfile) >= 70);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 75);

  archiveProfile.meta.unlocks.townFeatureIds.push("sovereign_annals", "sovereign_exchange", "legendary_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.ok(persistence.getRunHistoryCapacity(archiveProfile) >= 95);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 100);

  for (let index = 0; index < 100; index += 1) {
    const archivedRun = JSON.parse(JSON.stringify(focusedEconomyState.run)) as RunState;
    archivedRun.id = `archive_focus_${index}`;
    persistence.recordRunHistory(archiveProfile, archivedRun, "abandoned", content);
  }

  assert.equal(archiveProfile.runHistory.length, 100);
});

test("late-act reward equipment choices prioritize replacement pivots and honor economy-gated curation", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const allItems = Object.values(content.itemCatalog);
  const lowestTierWeapon = [...allItems]
    .filter((item) => item.slot === "weapon")
    .sort((left, right) => {
      const tierDelta = left.progressionTier - right.progressionTier;
      if (tierDelta !== 0) {
        return tierDelta;
      }
      return left.maxSockets - right.maxSockets;
    })[0];
  const highestTierArmor = [...allItems]
    .filter((item) => item.slot === "armor")
    .sort((left, right) => {
      const tierDelta = right.progressionTier - left.progressionTier;
      if (tierDelta !== 0) {
        return tierDelta;
      }
      return right.maxSockets - left.maxSockets;
    })[0];

  assert.ok(lowestTierWeapon);
  assert.ok(highestTierArmor);

  const buildLateActState = (featureIds: string[] = [], focusedTreeId = "") => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });
    if (focusedTreeId) {
      const focusResult = appEngine.setAccountProgressionFocus(state, focusedTreeId);
      assert.equal(focusResult.ok, true);
    }

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    state.run.currentActIndex = 4;
    state.run.level = 11;
    state.run.summary.zonesCleared = 8;
    state.run.summary.encountersCleared = 12;
    state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
    runFactory.hydrateRun(state.run, content);
    state.run.loadout.weapon = {
      entryId: "late_reward_weapon",
      itemId: lowestTierWeapon.id,
      slot: "weapon",
      socketsUnlocked: 0,
      insertedRunes: [],
      runewordId: "",
    };
    state.run.loadout.armor = {
      entryId: "late_reward_armor",
      itemId: highestTierArmor.id,
      slot: "armor",
      socketsUnlocked: Math.min(2, highestTierArmor.maxSockets || 0),
      insertedRunes: [],
      runewordId: "",
    };
    itemSystem.hydrateRunLoadout(state.run, content);

    const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
    assert.ok(bossZone);

    return { state, bossZone };
  };

  const baseline = buildLateActState();
  const baselineChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baseline.state.run,
    zone: baseline.bossZone,
    actNumber: baseline.bossZone.actNumber,
    encounterNumber: 1,
    profile: baseline.state.profile,
  });
  const baselineEquipmentChoice = baselineChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(baselineEquipmentChoice);
  assert.equal(baselineEquipmentChoice.kind, "item");
  const baselineRewardItemId = baselineEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const baselineRewardItem = content.itemCatalog[baselineRewardItemId];
  assert.ok(baselineRewardItem);
  assert.ok(baselineRewardItem.progressionTier > lowestTierWeapon.progressionTier);
  assert.match(baselineEquipmentChoice.previewLines.join(" "), /Late-act pivot/i);

  const featured = buildLateActState(["artisan_stock", "brokerage_charter"], "economy");
  const treasuryFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange"], "economy");
  const merchantFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate"], "economy");
  const paragonFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange", "paragon_exchange"], "economy");
  const ascendantFeatured = buildLateActState(
    ["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate", "ascendant_exchange"],
    "economy"
  );
  const featuredChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: featured.state.run,
    zone: featured.bossZone,
    actNumber: featured.bossZone.actNumber,
    encounterNumber: 1,
    profile: featured.state.profile,
  });
  const featuredEquipmentChoice = featuredChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(featuredEquipmentChoice);
  assert.equal(featuredEquipmentChoice.kind, "item");
  const featuredRewardItemId = featuredEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const featuredRewardItem = content.itemCatalog[featuredRewardItemId];
  assert.ok(featuredRewardItem);
  assert.ok((featuredRewardItem.maxSockets || 0) >= (baselineRewardItem.maxSockets || 0));
  assert.match(featuredEquipmentChoice.previewLines.join(" "), /Trade Network/i);

  const treasuryChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: treasuryFeatured.state.run,
    zone: treasuryFeatured.bossZone,
    actNumber: treasuryFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: treasuryFeatured.state.profile,
  });
  const treasuryEquipmentChoice = treasuryChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(treasuryEquipmentChoice);
  assert.equal(treasuryEquipmentChoice.kind, "item");
  const treasuryRewardItemId = treasuryEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const treasuryRewardItem = content.itemCatalog[treasuryRewardItemId];
  assert.ok(treasuryRewardItem);
  assert.match(treasuryEquipmentChoice.previewLines.join(" "), /Treasury Exchange/i);

  const paragonChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: paragonFeatured.state.run,
    zone: paragonFeatured.bossZone,
    actNumber: paragonFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: paragonFeatured.state.profile,
  });
  const merchantChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: merchantFeatured.state.run,
    zone: merchantFeatured.bossZone,
    actNumber: merchantFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: merchantFeatured.state.profile,
  });
  const ascendantChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: ascendantFeatured.state.run,
    zone: ascendantFeatured.bossZone,
    actNumber: ascendantFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: ascendantFeatured.state.profile,
  });
  const paragonEquipmentChoice = paragonChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const merchantEquipmentChoice = merchantChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const ascendantEquipmentChoice = ascendantChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(paragonEquipmentChoice);
  assert.ok(merchantEquipmentChoice);
  assert.ok(ascendantEquipmentChoice);
  assert.equal(paragonEquipmentChoice.kind, "item");
  assert.equal(merchantEquipmentChoice.kind, "item");
  assert.equal(ascendantEquipmentChoice.kind, "item");
  const merchantRewardItemId = merchantEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const paragonRewardItemId = paragonEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const ascendantRewardItemId = ascendantEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const merchantRewardItem = content.itemCatalog[merchantRewardItemId];
  const paragonRewardItem = content.itemCatalog[paragonRewardItemId];
  const ascendantRewardItem = content.itemCatalog[ascendantRewardItemId];
  assert.ok(merchantRewardItem);
  assert.ok(paragonRewardItem);
  assert.ok(ascendantRewardItem);
  assert.ok((merchantRewardItem.maxSockets || 0) >= (treasuryRewardItem.maxSockets || 0));
  assert.ok(merchantRewardItem.progressionTier >= treasuryRewardItem.progressionTier);
  assert.ok((paragonRewardItem.maxSockets || 0) >= (treasuryRewardItem.maxSockets || 0));
  assert.ok(paragonRewardItem.progressionTier >= treasuryRewardItem.progressionTier);
  assert.ok((ascendantRewardItem.maxSockets || 0) >= (paragonRewardItem.maxSockets || 0));
  assert.ok(ascendantRewardItem.progressionTier >= paragonRewardItem.progressionTier);
  assert.match(merchantEquipmentChoice.previewLines.join(" "), /Merchant Principate/i);
  assert.match(paragonEquipmentChoice.previewLines.join(" "), /Paragon Exchange/i);
  assert.match(ascendantEquipmentChoice.previewLines.join(" "), /Ascendant Exchange/i);
});

test("createAppState sanitizes persisted stash entries before town actions consume them", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const seededProfile = persistence.createEmptyProfile();
  seededProfile.stash.entries = [
    {
      entryId: "stash_blade",
      kind: "equipment",
      equipment: {
        entryId: "stash_blade",
        itemId: "item_short_sword",
        slot: "weapon",
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    },
    { entryId: "bad_rune", kind: "rune", runeId: "rune_missing" },
    { entryId: "dup", kind: "rune", runeId: "rune_el" },
    { entryId: "dup", kind: "rune", runeId: "rune_tir" },
    {
      entryId: "stash_armor",
      kind: "equipment",
      equipment: {
        entryId: "stash_armor",
        itemId: "item_quilted_armor",
        slot: "armor",
        socketsUnlocked: 1,
        insertedRunes: ["rune_el"],
        runewordId: "",
      },
    },
  ];

  storage.setItem(
    persistence.PROFILE_STORAGE_KEY,
    persistence.serializeProfile(seededProfile)
  );

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  assert.equal(state.profile.stash.entries.length, 4);
  const stashEntryIds = state.profile.stash.entries.map((entry) => entry.entryId);
  assert.equal(new Set(stashEntryIds).size, state.profile.stash.entries.length);
  assert.ok(state.profile.stash.entries.some((entry) => entry.entryId.startsWith("stash_")));

  const persistedProfile = persistence.loadProfileFromStorage();
  assert.ok(persistedProfile);
  assert.equal(persistedProfile.stash.entries.length, 4);
  assert.equal(new Set(persistedProfile.stash.entries.map((entry) => entry.entryId)).size, 4);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const withdrawTarget = state.profile.stash.entries[0];
  const result = appEngine.useTownAction(state, `stash_withdraw_${withdrawTarget.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.inventory.carried.length, 1);
  assert.equal(state.profile.stash.entries.length, 3);
});

test("createAppState rebuilds stash-ready charter summaries from persisted planning and stash state", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const seededProfile = persistence.createEmptyProfile();

  seededProfile.meta.planning.weaponRunewordId = "honor";
  seededProfile.meta.planning.armorRunewordId = "lionheart";
  seededProfile.stash.entries = [
    {
      entryId: "stash_ready_honor",
      kind: "equipment",
      equipment: {
        entryId: "stash_ready_honor",
        itemId: "item_rune_sword",
        slot: "weapon",
        socketsUnlocked: 3,
        insertedRunes: ["rune_amn"],
        runewordId: "",
      },
    },
    {
      entryId: "stash_prepared_lionheart",
      kind: "equipment",
      equipment: {
        entryId: "stash_prepared_lionheart",
        itemId: "item_archon_plate",
        slot: "armor",
        socketsUnlocked: 2,
        insertedRunes: ["rune_hel"],
        runewordId: "",
      },
    },
  ];

  storage.setItem(persistence.PROFILE_STORAGE_KEY, persistence.serializeProfile(seededProfile));

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponRunewordId, "honor");
  assert.equal(accountSummary.planning.armorRunewordId, "lionheart");
  assert.equal(accountSummary.planning.weaponCharter?.compatibleBaseCount, 1);
  assert.equal(accountSummary.planning.weaponCharter?.readyBaseCount, 1);
  assert.equal(accountSummary.planning.weaponCharter?.preparedBaseCount, 1);
  assert.equal(accountSummary.planning.weaponCharter?.bestBaseItemId, "item_rune_sword");
  assert.equal(accountSummary.planning.weaponCharter?.bestBaseInsertedRuneCount, 1);
  assert.equal(accountSummary.planning.weaponCharter?.bestBaseMaxSockets, 3);
  assert.equal(accountSummary.planning.armorCharter?.compatibleBaseCount, 1);
  assert.equal(accountSummary.planning.armorCharter?.readyBaseCount || 0, 0);
  assert.equal(accountSummary.planning.armorCharter?.preparedBaseCount, 1);
  assert.equal(accountSummary.planning.armorCharter?.bestBaseItemId, "item_archon_plate");
  assert.equal(accountSummary.planning.armorCharter?.bestBaseSocketsUnlocked, 2);
  assert.equal(accountSummary.planning.weaponCharter?.requiredSocketCount, 3);
  assert.equal(accountSummary.planning.weaponCharter?.bestBaseMissingRuneCount, 2);
  assert.equal(accountSummary.planning.overview.compatibleCharterCount, 2);
  assert.equal(accountSummary.planning.overview.preparedCharterCount, 1);
  assert.equal(accountSummary.planning.overview.readyCharterCount, 1);
  assert.equal(accountSummary.planning.overview.nextActionLabel, "Stock Runes");
  assert.match(accountSummary.planning.overview.nextActionSummary, /Ready base parked for Honor/i);
});

test("planning summaries expose socket commission queue and repeat-forge readiness", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const seededProfile = persistence.createEmptyProfile();

  seededProfile.meta.planning.weaponRunewordId = "white";
  seededProfile.meta.planning.armorRunewordId = "lionheart";
  seededProfile.stash.entries = [
    {
      entryId: "stash_ready_white",
      kind: "equipment",
      equipment: {
        entryId: "stash_ready_white",
        itemId: "item_bone_wand",
        slot: "weapon",
        socketsUnlocked: 2,
        insertedRunes: ["rune_dol"],
        runewordId: "",
      },
    },
    {
      entryId: "stash_prepared_lionheart",
      kind: "equipment",
      equipment: {
        entryId: "stash_prepared_lionheart",
        itemId: "item_archon_plate",
        slot: "armor",
        socketsUnlocked: 2,
        insertedRunes: ["rune_hel"],
        runewordId: "",
      },
    },
  ];
  seededProfile.runHistory = [
    {
      runId: "white_archive",
      classId: "necromancer",
      className: "Necromancer",
      level: 11,
      actsCleared: 4,
      bossesDefeated: 2,
      goldGained: 320,
      runewordsForged: 1,
      skillPointsEarned: 0,
      classPointsEarned: 0,
      attributePointsEarned: 0,
      trainingRanksGained: 0,
      favoredTreeId: "",
      favoredTreeName: "",
      unlockedClassSkills: 0,
      loadoutTier: 6,
      loadoutSockets: 3,
      carriedEquipmentCount: 0,
      carriedRuneCount: 0,
      stashEntryCount: 0,
      stashEquipmentCount: 0,
      stashRuneCount: 0,
      plannedWeaponRunewordId: "white",
      plannedArmorRunewordId: "lionheart",
      completedPlannedRunewordIds: ["white"],
      activeRunewordIds: ["white"],
      newFeatureIds: [],
      completedAt: new Date("2026-03-09T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
  ];

  storage.setItem(persistence.PROFILE_STORAGE_KEY, persistence.serializeProfile(seededProfile));

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponCharter?.repeatForgeReady, true);
  assert.equal(accountSummary.planning.weaponCharter?.bestBaseSocketGap, 0);
  assert.equal(accountSummary.planning.armorCharter?.bestBaseSocketGap, 1);
  assert.equal(accountSummary.planning.armorCharter?.commissionableBaseCount, 1);
  assert.equal(accountSummary.planning.overview.socketCommissionCharterCount, 1);
  assert.equal(accountSummary.planning.overview.repeatForgeReadyCharterCount, 1);
  assert.equal(accountSummary.planning.overview.totalSocketStepsRemaining, 1);
  assert.equal(accountSummary.planning.overview.nextActionLabel, "Stock Runes");
  assert.match(accountSummary.planning.overview.nextActionSummary, /repeat forge/i);
});

test("town socket commissions advance equipped, carried, and stashed bases", () => {
  const { content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  ["economy_ledger", "salvage_tithes", "treasury_exchange", "merchant_principate"].forEach((featureId) => {
    if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
      state.profile.meta.unlocks.townFeatureIds.push(featureId);
    }
  });

  let result = appEngine.setPlannedRuneword(state, "weapon", "white");
  assert.equal(result.ok, true);
  result = appEngine.setPlannedRuneword(state, "armor", "lionheart");
  assert.equal(result.ok, true);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  state.run.gold = 1200;
  state.run.loadout.weapon = {
    entryId: "equipped_blade",
    itemId: "item_short_sword",
    slot: "weapon",
    socketsUnlocked: 0,
    insertedRunes: [],
    runewordId: "",
  };
  state.run.inventory.carried = [
    {
      entryId: "carry_white",
      kind: "equipment",
      equipment: {
        entryId: "carry_white",
        itemId: "item_bone_wand",
        slot: "weapon",
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    },
  ];
  state.profile.stash.entries = [
    {
      entryId: "stash_lionheart",
      kind: "equipment",
      equipment: {
        entryId: "stash_lionheart",
        itemId: "item_archon_plate",
        slot: "armor",
        socketsUnlocked: 2,
        insertedRunes: ["rune_hel"],
        runewordId: "",
      },
    },
  ];

  itemSystem.hydrateRunLoadout(state.run, content);
  itemSystem.hydrateProfileStash(state.profile, content);
  itemSystem.hydrateRunInventory(state.run, content, state.profile);

  const actions = itemSystem.listTownActions(state.run, state.profile, content);
  const loadoutCommission = actions.find((action) => action.id === "inventory_commission_loadout_weapon");
  const carriedCommission = actions.find((action) => action.id === "inventory_commission_carry_white");
  const stashCommission = actions.find((action) => action.id === "stash_commission_stash_lionheart");
  assert.ok(loadoutCommission);
  assert.ok(carriedCommission);
  assert.ok(stashCommission);
  assert.match(carriedCommission.previewLines.join(" "), /Weapon charter match: White/i);
  assert.match(carriedCommission.previewLines.join(" "), /Archive charter is still open for White/i);
  assert.match(stashCommission.previewLines.join(" "), /Treasury Exchange is routing this socket work directly onto stash stock/i);
  assert.match(stashCommission.previewLines.join(" "), /Armor charter match: Lionheart/i);
  assert.match(itemSystem.getInventorySummary(state.run, state.profile, content).join(" "), /commission stash sockets directly against stored gear/i);

  const totalCost = loadoutCommission.cost + carriedCommission.cost + stashCommission.cost;
  result = appEngine.useTownAction(state, "inventory_commission_loadout_weapon");
  assert.equal(result.ok, true);
  assert.equal(state.run.loadout.weapon?.socketsUnlocked, 1);

  result = appEngine.useTownAction(state, "inventory_commission_carry_white");
  assert.equal(result.ok, true);
  const carriedCommissionedEntry = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.equal(carriedCommissionedEntry?.kind, "equipment");
  assert.equal(carriedCommissionedEntry?.equipment?.socketsUnlocked, 1);

  result = appEngine.useTownAction(state, "stash_commission_stash_lionheart");
  assert.equal(result.ok, true);
  const commissionedStashEntry = state.profile.stash.entries.find((entry) => entry.kind === "equipment");
  assert.equal(commissionedStashEntry?.kind, "equipment");
  assert.equal(commissionedStashEntry?.equipment?.socketsUnlocked, 3);
  assert.equal(state.run.gold, 1200 - totalCost);

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.armorCharter?.readyBaseCount, 1);
  assert.equal(accountSummary.planning.overview.readyCharterCount, 1);
  assert.equal(accountSummary.planning.overview.nextActionLabel, "Stock Runes");
});

test("createAppState sanitizes stale planning charters before archive and town systems consume them", () => {
  const { content, combatEngine, appEngine, itemSystem, persistence, seedBundle, storage } = createHarness();
  const seededProfile = persistence.createEmptyProfile();

  seededProfile.meta.unlocks.townFeatureIds = Array.from(
    new Set([...(seededProfile.meta.unlocks.townFeatureIds || []), "chronicle_exchange"])
  );
  seededProfile.meta.planning.weaponRunewordId = "lionheart";
  seededProfile.meta.planning.armorRunewordId = "ghost_word";
  seededProfile.runHistory = [
    {
      runId: "stale_planning",
      classId: "necromancer",
      className: "Necromancer",
      level: 8,
      actsCleared: 4,
      bossesDefeated: 2,
      goldGained: 220,
      runewordsForged: 1,
      skillPointsEarned: 0,
      classPointsEarned: 0,
      attributePointsEarned: 0,
      trainingRanksGained: 0,
      favoredTreeId: "",
      favoredTreeName: "",
      unlockedClassSkills: 0,
      loadoutTier: 5,
      loadoutSockets: 2,
      carriedEquipmentCount: 0,
      carriedRuneCount: 0,
      stashEntryCount: 0,
      stashEquipmentCount: 0,
      stashRuneCount: 0,
      activeRunewordIds: ["white"],
      plannedWeaponRunewordId: "lionheart",
      plannedArmorRunewordId: "ghost_word",
      completedPlannedRunewordIds: ["lionheart", "ghost_word", "white"],
      newFeatureIds: [],
      completedAt: new Date("2026-03-08T00:00:00.000Z").toISOString(),
      outcome: "completed",
    },
  ];

  storage.setItem(persistence.PROFILE_STORAGE_KEY, persistence.serializeProfile(seededProfile));

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  assert.equal(state.profile.meta.planning.weaponRunewordId, "");
  assert.equal(state.profile.meta.planning.armorRunewordId, "");
  assert.equal(state.profile.runHistory[0].plannedWeaponRunewordId, "");
  assert.equal(state.profile.runHistory[0].plannedArmorRunewordId, "");
  assert.deepEqual([...state.profile.runHistory[0].completedPlannedRunewordIds], []);

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.plannedRunewordCount, 0);
  assert.equal(accountSummary.planning.fulfilledPlanCount, 0);
  assert.equal(accountSummary.planning.unfulfilledPlanCount, 0);
  assert.equal(accountSummary.archive.planningArchiveCount, 0);
  assert.equal(accountSummary.archive.planningCompletionCount, 0);
  assert.deepEqual([...accountSummary.archive.recentPlannedRunewordIds], []);

  const persistedProfile = persistence.loadProfileFromStorage(undefined, content);
  assert.ok(persistedProfile);
  assert.equal(persistedProfile.meta.planning.weaponRunewordId, "");
  assert.equal(persistedProfile.meta.planning.armorRunewordId, "");
  assert.deepEqual([...persistedProfile.runHistory[0].completedPlannedRunewordIds], []);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const refreshAction = itemSystem
    .listTownActions(state.run, state.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  assert.ok(refreshAction);
  assert.doesNotMatch(refreshAction.previewLines.join(" "), /Planning charters active/i);
  assert.doesNotMatch(refreshAction.previewLines.join(" "), /Archive charter still open/i);
});
