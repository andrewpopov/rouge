export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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
