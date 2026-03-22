export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("account progression trees drive economy focus behavior with late-act vendor and convergence scaling", () => {
  const { content, combatEngine, appEngine, itemSystem, persistence, runFactory, seedBundle } = createHarness();
  const buildState = (featureIds: string[] = [], focusedTreeId = "") => {
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
  const hegemonyEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
      "trade_hegemony",
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
  const imperialEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
      "trade_hegemony",
      "imperial_exchange",
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
  const mythicEconomyState = buildState(
    [
      "advanced_vendor_stock",
      "runeword_codex",
      "economy_ledger",
      "salvage_tithes",
      "artisan_stock",
      "brokerage_charter",
      "treasury_exchange",
      "merchant_principate",
      "trade_hegemony",
      "mythic_exchange",
    ],
    "economy"
  );
  prepareLateActState(lateEconomyBaselineState, true);
  prepareLateActState(lateEconomyArtisanState, true);
  prepareLateActState(lateEconomyBrokerageState, true);
  prepareLateActState(lateEconomyTreasuryState, true);
  prepareLateActState(chronicleEconomyState, true);
  prepareLateActState(merchantEconomyState, true);
  prepareLateActState(hegemonyEconomyState, true);
  prepareLateActState(sovereignEconomyState, true);
  prepareLateActState(imperialEconomyState, true);
  prepareLateActState(ascendantEconomyState, true);
  prepareLateActState(mythicEconomyState, true);

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
  const hegemonyLateSocketOffers = hegemonyEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 4);
  const sovereignLateSocketOffers = sovereignEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const imperialLateSocketOffers = imperialEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 4);
  const ascendantLateSocketOffers = ascendantEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 3);
  const mythicLateSocketOffers = mythicEconomyState.run.town.vendor.stock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId])
    .filter((item) => (item?.maxSockets || 0) >= 4);
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
  const hegemonyLateRefreshAction = itemSystem
    .listTownActions(hegemonyEconomyState.run, hegemonyEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const sovereignLateRefreshAction = itemSystem
    .listTownActions(sovereignEconomyState.run, sovereignEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const imperialLateRefreshAction = itemSystem
    .listTownActions(imperialEconomyState.run, imperialEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const ascendantLateRefreshAction = itemSystem
    .listTownActions(ascendantEconomyState.run, ascendantEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");
  const mythicLateRefreshAction = itemSystem
    .listTownActions(mythicEconomyState.run, mythicEconomyState.profile, content)
    .find((action) => action.id === "vendor_refresh_stock");

  assert.ok(baselineLateRefreshAction);
  assert.ok(artisanLateRefreshAction);
  assert.ok(brokerageLateRefreshAction);
  assert.ok(treasuryLateRefreshAction);
  assert.ok(chronicleLateRefreshAction);
  assert.ok(merchantLateRefreshAction);
  assert.ok(hegemonyLateRefreshAction);
  assert.ok(sovereignLateRefreshAction);
  assert.ok(imperialLateRefreshAction);
  assert.ok(ascendantLateRefreshAction);
  assert.ok(mythicLateRefreshAction);
  assert.ok(artisanLateRefreshAction.cost < baselineLateRefreshAction.cost);
  assert.ok(brokerageLateRefreshAction.cost < artisanLateRefreshAction.cost);
  assert.ok(treasuryLateRefreshAction.cost < brokerageLateRefreshAction.cost);
  assert.ok(chronicleLateRefreshAction.cost <= treasuryLateRefreshAction.cost);
  assert.ok(merchantLateRefreshAction.cost < treasuryLateRefreshAction.cost);
  assert.ok(hegemonyLateRefreshAction.cost <= merchantLateRefreshAction.cost);
  assert.ok(sovereignLateRefreshAction.cost <= merchantLateRefreshAction.cost);
  assert.ok(imperialLateRefreshAction.cost <= sovereignLateRefreshAction.cost);
  assert.ok(ascendantLateRefreshAction.cost <= sovereignLateRefreshAction.cost);
  assert.ok(mythicLateRefreshAction.cost <= ascendantLateRefreshAction.cost);
  assert.ok(artisanLateSocketOffers.length >= baselineLateSocketOffers.length);
  assert.ok(brokerageLateSocketOffers.length >= artisanLateSocketOffers.length);
  assert.ok(treasuryLateSocketOffers.length >= brokerageLateSocketOffers.length);
  assert.ok(chronicleLateSocketOffers.length >= treasuryLateSocketOffers.length);
  assert.ok(merchantLateSocketOffers.length >= treasuryLateSocketOffers.length);
  assert.ok(hegemonyLateSocketOffers.length >= merchantLateSocketOffers.filter((item) => (item?.maxSockets || 0) >= 4).length);
  assert.ok(sovereignLateSocketOffers.length >= merchantLateSocketOffers.length);
  assert.ok(imperialLateSocketOffers.length >= hegemonyLateSocketOffers.length);
  assert.ok(ascendantLateSocketOffers.length >= sovereignLateSocketOffers.length);
  assert.ok(mythicLateSocketOffers.length >= imperialLateSocketOffers.length);
  assert.ok(artisanLateSocketOffers.length > 0);
  assert.ok(lateEconomyBrokerageState.run.town.vendor.stock.length >= lateEconomyArtisanState.run.town.vendor.stock.length);
  assert.ok(lateEconomyTreasuryState.run.town.vendor.stock.length >= lateEconomyBrokerageState.run.town.vendor.stock.length);
  assert.ok(chronicleEconomyState.run.town.vendor.stock.length >= lateEconomyTreasuryState.run.town.vendor.stock.length);
  assert.ok(merchantEconomyState.run.town.vendor.stock.length >= lateEconomyTreasuryState.run.town.vendor.stock.length);
  assert.ok(hegemonyEconomyState.run.town.vendor.stock.length >= merchantEconomyState.run.town.vendor.stock.length);
  assert.ok(sovereignEconomyState.run.town.vendor.stock.length >= merchantEconomyState.run.town.vendor.stock.length);
  assert.ok(imperialEconomyState.run.town.vendor.stock.length >= sovereignEconomyState.run.town.vendor.stock.length);
  assert.ok(ascendantEconomyState.run.town.vendor.stock.length >= sovereignEconomyState.run.town.vendor.stock.length);
  assert.ok(mythicEconomyState.run.town.vendor.stock.length >= ascendantEconomyState.run.town.vendor.stock.length);
  assert.match(treasuryLateRefreshAction.previewLines.join(" "), /Treasury Exchange/i);
  assert.match(chronicleLateRefreshAction.previewLines.join(" "), /Chronicle Exchange/i);
  assert.match(merchantLateRefreshAction.previewLines.join(" "), /Merchant Principate/i);
  assert.match(hegemonyLateRefreshAction.previewLines.join(" "), /Trade Hegemony/i);
  assert.match(sovereignLateRefreshAction.previewLines.join(" "), /Sovereign Exchange/i);
  assert.match(imperialLateRefreshAction.previewLines.join(" "), /Imperial Exchange/i);
  assert.match(ascendantLateRefreshAction.previewLines.join(" "), /Ascendant Exchange/i);
  assert.match(mythicLateRefreshAction.previewLines.join(" "), /Mythic Exchange/i);
});
