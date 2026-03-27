export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("economy ledger changes vendor prices and refresh cost in town", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const buildState = (featureIds: string[] = []) => {
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
  const getTownAction = (state: AppState, actionId: string) => {
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
  const buildState = (featureIds: string[] = []) => {
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
  const getMaxTier = (state: AppState) => {
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
  const buildState = (featureIds: string[] = []) => {
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
  const getVendorRunes = (state: AppState) => {
    return state.run.town.vendor.stock.filter((entry) => entry.kind === "rune").map((entry) => entry.runeId);
  };

  const baselineState = buildState();
  const codexState = buildState(["runeword_codex"]);
  const baselineRunes = getVendorRunes(baselineState);
  const codexRunes = getVendorRunes(codexState);

  assert.ok(baselineRunes.includes("rune_tir"));
  assert.ok(codexRunes.includes("rune_tir"));
  assert.ok(codexRunes.includes("rune_el"));
  assert.ok(codexRunes.slice(0, 2).includes("rune_tir"));
  assert.ok(codexRunes.slice(0, 2).includes("rune_el"));
  assert.ok(codexRunes.length > baselineRunes.length);
});

test("treasury exchange adds direct vendor-to-stash consignment and stash-aware rune routing", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const buildState = (featureIds: string[] = []) => {
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
  const getVendorRunes = (state: AppState) => {
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
  assert.ok(treasuryRunes.includes(targetRuneId));
  assert.equal(treasuryRunes[0], targetRuneId);
  assert.ok(
    baselineRunes.indexOf(targetRuneId) === -1 ||
    treasuryRunes.indexOf(targetRuneId) < baselineRunes.indexOf(targetRuneId)
  );

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
