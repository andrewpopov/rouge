export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("startRun creates a class-derived run and enters the safe zone", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  const result = appEngine.startRun(state);

  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(state.run.classId, "sorceress");
  assert.equal(state.run.hero.name, "Sorceress");
  assert.equal(state.run.hero.maxEnergy, 4);
  assert.equal(state.run.safeZoneName, "Rogue Encampment");
  assert.equal(state.run.acts.length, 5);
  assert.deepEqual(state.run.deck, content.starterDeckProfiles.caster);
  assert.ok(Object.keys(content.generatedActEncounterIds).length >= 5);
  assert.equal(appEngine.hasSavedRun(), true);
});

test("world map zones loop encounter to reward and preserve multi-encounter progress", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  let result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeZoneId, openingZoneId);
  assert.match(state.run.activeEncounterId, /^act_1_/);

  state.combat.outcome = "victory";
  state.combat.hero.life = 33;
  state.combat.mercenary.life = 17;
  state.combat.potions = 1;
  appEngine.syncEncounterOutcome(state);

  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.clearsZone, false);
  assert.equal(state.run.pendingReward.choices.length, 3);

  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  const zone = runFactory.getZoneById(state.run, openingZoneId);
  assert.equal(zone.encountersCleared, 1);
  assert.equal(zone.cleared, false);
  assert.equal(state.run.hero.currentLife, 33);
  assert.equal(state.run.belt.current, 1);

  result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
});

test("safe-zone services can heal, refill, and change mercenary contracts without losing map progress", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 200;
  state.run.hero.currentLife = 18;
  state.run.mercenary.currentLife = 10;
  state.run.belt.current = 0;

  let result = appEngine.useTownAction(state, "healer_restore_party");
  assert.equal(result.ok, true);
  assert.ok(state.run.hero.currentLife >= state.run.hero.maxLife);
  assert.ok(state.run.mercenary.currentLife >= state.run.mercenary.maxLife);

  result = appEngine.useTownAction(state, "quartermaster_refill_belt");
  assert.equal(result.ok, true);
  assert.equal(state.run.belt.current, state.run.belt.max);

  const goldAfterRecovery = state.run.gold;
  result = appEngine.useTownAction(state, "mercenary_contract_iron_wolf");
  assert.equal(result.ok, true);
  assert.equal(state.run.mercenary.id, "iron_wolf");
  assert.ok(state.run.gold < goldAfterRecovery);

  appEngine.leaveSafeZone(state);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  result = appEngine.returnToSafeZone(state);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(runFactory.getZoneById(state.run, openingZoneId).encountersCleared, 1);
});

test("safe-zone services can revive a fallen current mercenary", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 200;
  state.run.mercenary.currentLife = 0;

  const result = appEngine.useTownAction(state, `mercenary_contract_${state.run.mercenary.id}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.mercenary.currentLife >= state.run.mercenary.maxLife);
});

test("town actions can spend skill points and move inventory through vendor, loadout, and stash flows", () => {
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
  state.run.progression.skillPointsAvailable = 1;

  const heroLifeBefore = state.run.hero.maxLife;
  let result = appEngine.useTownAction(state, "progression_spend_vitality");
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.skillPointsAvailable, 0);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);

  const vendorEquipment = state.run.town.vendor.stock.find((entry) => entry.kind === "equipment");
  assert.ok(vendorEquipment);
  const goldBeforeBuy = state.run.gold;
  result = appEngine.useTownAction(state, `vendor_buy_${vendorEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.gold < goldBeforeBuy);
  assert.ok(state.run.inventory.carried.some((entry) => entry.kind === "equipment"));

  const carriedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(carriedEquipment);
  result = appEngine.useTownAction(state, `inventory_equip_${carriedEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.loadout[carriedEquipment.equipment.slot]?.itemId, carriedEquipment.equipment.itemId);

  result = appEngine.useTownAction(state, `inventory_unequip_${carriedEquipment.equipment.slot}`);
  assert.equal(result.ok, true);
  const returnedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(returnedEquipment);

  result = appEngine.useTownAction(state, `inventory_stash_${returnedEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.profile.stash.entries.length, 1);
  assert.equal(state.run.inventory.carried.length, 0);

  result = appEngine.useTownAction(state, `stash_withdraw_${state.profile.stash.entries[0].entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.profile.stash.entries.length, 0);
  assert.equal(state.run.inventory.carried.length, 1);

  const saleTarget = state.run.inventory.carried[0];
  const goldBeforeSale = state.run.gold;
  result = appEngine.useTownAction(state, `inventory_sell_${saleTarget.entryId}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.gold > goldBeforeSale);

  const persistedProfile = persistence.loadProfileFromStorage();
  assert.ok(persistedProfile);
  assert.ok(persistedProfile.activeRunSnapshot);
});

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
  assert.equal(accountSummary.unlockedMilestoneCount, 18);
  assert.equal(accountSummary.milestoneCount, 18);
  assert.equal(accountSummary.focusedTreeId, "archives");
  assert.equal(accountSummary.nextMilestoneId, "");
  assert.equal(accountSummary.nextMilestoneTitle, "");
  assert.ok(accountSummary.unlockedFeatureIds.includes("economy_ledger"));
  assert.ok(accountSummary.unlockedFeatureIds.includes("brokerage_charter"));
  assert.equal(accountSummary.treeCount, 3);
  assert.equal(accountSummary.runHistoryCapacity, 70);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "archives")?.currentRank, 5);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "economy")?.currentRank, 7);
  assert.equal(accountSummary.trees.find((tree) => tree.id === "mastery")?.currentRank, 6);
  assert.equal(accountSummary.review.unlockedCapstoneCount, 3);
  assert.equal(accountSummary.archive.highestLoadoutTier, 7);
  assert.equal(accountSummary.archive.planningArchiveCount, 6);
  assert.equal(accountSummary.profile.dismissedTutorialCount, 0);
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
  prepareLateActState(lateEconomyBaselineState, true);
  prepareLateActState(lateEconomyArtisanState, true);
  prepareLateActState(lateEconomyBrokerageState, true);
  prepareLateActState(lateEconomyTreasuryState, true);

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

  assert.ok(baselineLateRefreshAction);
  assert.ok(artisanLateRefreshAction);
  assert.ok(brokerageLateRefreshAction);
  assert.ok(treasuryLateRefreshAction);
  assert.ok(artisanLateRefreshAction.cost < baselineLateRefreshAction.cost);
  assert.ok(brokerageLateRefreshAction.cost < artisanLateRefreshAction.cost);
  assert.ok(treasuryLateRefreshAction.cost < brokerageLateRefreshAction.cost);
  assert.ok(artisanLateSocketOffers.length >= baselineLateSocketOffers.length);
  assert.ok(brokerageLateSocketOffers.length >= artisanLateSocketOffers.length);
  assert.ok(treasuryLateSocketOffers.length >= brokerageLateSocketOffers.length);
  assert.ok(artisanLateSocketOffers.length > 0);
  assert.ok(lateEconomyBrokerageState.run.town.vendor.stock.length >= lateEconomyArtisanState.run.town.vendor.stock.length);
  assert.ok(lateEconomyTreasuryState.run.town.vendor.stock.length >= lateEconomyBrokerageState.run.town.vendor.stock.length);
  assert.match(treasuryLateRefreshAction.previewLines.join(" "), /Treasury Exchange/i);

  const baselineMasteryState = buildState(["boss_trophy_gallery", "training_grounds"], "mastery");
  const focusedMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college"], "mastery");
  const paragonMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine"], "mastery");
  const apexMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine"], "mastery");
  prepareLateActState(baselineMasteryState);
  prepareLateActState(focusedMasteryState);
  prepareLateActState(paragonMasteryState);
  prepareLateActState(apexMasteryState);
  const baselineBossZone = runFactory.getCurrentZones(baselineMasteryState.run).find((zone) => zone.kind === "boss");
  const focusedBossZone = runFactory.getCurrentZones(focusedMasteryState.run).find((zone) => zone.kind === "boss");
  const paragonBossZone = runFactory.getCurrentZones(paragonMasteryState.run).find((zone) => zone.kind === "boss");
  const apexBossZone = runFactory.getCurrentZones(apexMasteryState.run).find((zone) => zone.kind === "boss");

  assert.ok(baselineBossZone);
  assert.ok(focusedBossZone);
  assert.ok(paragonBossZone);
  assert.ok(apexBossZone);

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

  const baselineBossProgression = baselineBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const focusedBossProgression = focusedBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const paragonBossProgression = paragonBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const apexBossProgression = apexBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));

  assert.ok(baselineBossProgression);
  assert.ok(focusedBossProgression);
  assert.ok(paragonBossProgression);
  assert.ok(apexBossProgression);

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

  assert.ok(focusedBossProgressionPoints > baselineBossProgressionPoints);
  assert.ok(paragonBossProgressionPoints > focusedBossProgressionPoints);
  assert.ok(apexBossProgressionPoints > paragonBossProgressionPoints);
  assert.match(focusedBossProgression.previewLines.join(" "), /Training Grounds|Mastery Hall focus|War College/i);
  assert.match(paragonBossProgression.previewLines.join(" "), /Paragon Doctrine/i);
  assert.match(apexBossProgression.previewLines.join(" "), /Apex Doctrine/i);

  const archiveProfile = persistence.createEmptyProfile();
  archiveProfile.meta.unlocks.townFeatureIds.push("archive_ledger", "chronicle_vault", "heroic_annals", "mythic_annals", "eternal_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 65);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 70);

  for (let index = 0; index < 75; index += 1) {
    const archivedRun = JSON.parse(JSON.stringify(focusedEconomyState.run)) as RunState;
    archivedRun.id = `archive_focus_${index}`;
    persistence.recordRunHistory(archiveProfile, archivedRun, "abandoned", content);
  }

  assert.equal(archiveProfile.runHistory.length, 70);
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

test("legacy mercenary route perks feed the next combat after the full post-culmination route resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 5);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 5);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 5);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 5);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 5);
  assert.equal(state.combat.hero.guard, 5);
  assert.equal(state.combat.hero.damageBonus, 5);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 5);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Last Wayfinders")));
});

test("reckoning opportunity lanes unlock alongside legacy and pay off reserve plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.equal(reckoningZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Reckoning");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier reserve lane: ${reserveChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  const reckoningEffect = reckoningChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(reckoningEffect);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[reckoningEffect.nodeId].outcomeId, reckoningEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_reckoning_chapel_ledger"));
  assert.ok(runFactory.getZoneById(state.run, reckoningZone.id).cleared);
});

test("recovery opportunity lanes unlock alongside legacy and reckoning and pay off shrine plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.equal(recoveryZone.status, "locked");
  assert.equal(accordZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, recoveryZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, accordZone.id).status, "available");

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Lantern Recovery");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier shrine lane: ${shrineOpportunityChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  const recoveryEffect = recoveryChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(recoveryEffect);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[recoveryEffect.nodeId].outcomeId, recoveryEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_recovery_chapel_lanterns"));
  assert.ok(runFactory.getZoneById(state.run, recoveryZone.id).cleared);
});

test("accord opportunity lanes unlock alongside the other late routes and pay off shrine plus crossroad plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.equal(accordZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, recoveryZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, accordZone.id).status, "available");

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Accord");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier shrine lane: ${shrineOpportunityChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier crossroad: ${crossroadChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  const accordEffect = accordChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(accordEffect);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[accordEffect.nodeId].outcomeId, accordEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_accord_cloister_paths"));
  assert.ok(runFactory.getZoneById(state.run, accordZone.id).cleared);
});

test("covenant opportunity lanes unlock after the full late-route quartet resolves and pay off every late lane together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);
  assert.equal(covenantZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  assert.equal(runFactory.getZoneById(state.run, covenantZone.id).status, "available");

  result = appEngine.selectZone(state, covenantZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Covenant");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier legacy lane: ${legacyChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier reckoning lane: ${reckoningChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier recovery lane: ${recoveryChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier accord lane: ${accordChoice.title}.`)));

  const covenantChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Seal the Wayfinder Ledger");
  assert.ok(covenantChoice);
  const covenantEffect = covenantChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(covenantEffect);
  appEngine.claimRewardAndAdvance(state, covenantChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[covenantEffect.nodeId].outcomeId, covenantEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_covenant_wayfinder_ledger"));
  assert.ok(runFactory.getZoneById(state.run, covenantZone.id).cleared);
});

test("accord mercenary route perks feed the next combat once the accord lane resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(accordZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 5);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 5);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 5);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 5);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 5);
  assert.equal(state.combat.hero.guard, 5);
  assert.equal(state.combat.hero.damageBonus, 5);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 5);
  assert.ok(state.combat.log.some((line) => line.includes("Cloister Accord")));
});

test("reckoning mercenary route perks stack with legacy after the parallel post-culmination lanes resolve", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 6);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 6);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 6);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 6);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 6);
  assert.equal(state.combat.hero.guard, 6);
  assert.equal(state.combat.hero.damageBonus, 6);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 6);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Chapel Reckoning")));
});

test("recovery mercenary route perks stack with the parallel post-culmination lanes after recovery resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 7);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 7);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 7);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 7);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 7);
  assert.equal(state.combat.hero.guard, 7);
  assert.equal(state.combat.hero.damageBonus, 7);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 7);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Chapel Reckoning")));
  assert.ok(state.combat.log.some((line) => line.includes("Lantern Recovery")));
});

test("covenant mercenary route perks feed the next combat once the covenant lane resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, covenantZone.id);
  assert.equal(result.ok, true);
  const covenantChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Seal the Wayfinder Ledger");
  assert.ok(covenantChoice);
  appEngine.claimRewardAndAdvance(state, covenantChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 9);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 9);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 9);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 9);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 9);
  assert.equal(state.combat.hero.guard, 9);
  assert.equal(state.combat.hero.damageBonus, 9);
  assert.equal(state.combat.hand.length, Math.min(state.run.deck.length, state.combat.hero.handSize + 9));
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Covenant")));
});

test("runtime content validation fails clearly when a mercenary loses its legacy-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_legacy_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 legacy-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its reckoning-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_reckoning_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 reckoning-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its recovery-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_recovery_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 recovery-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its accord-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_accord_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 accord-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its covenant-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_covenant_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 covenant-linked route perk\./);
});
