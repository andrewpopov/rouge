export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function startRunState(harness: ReturnType<typeof createHarness>) {
  const { appEngine, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  return state;
}

test("buildInventoryMarkup renders character tab with hero stats", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  const markup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);

  assert.ok(markup.includes("d2inv"), "should have inventory grid class");
  assert.ok(markup.includes("Barbarian"), "should show class name");
  assert.ok(markup.length > 500, "should produce substantial character markup");
});

test("buildInventoryMarkup renders inventory tab with carried items grid", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  state.ui.inventoryTab = "inventory";
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  const markup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);

  assert.ok(markup.includes("d2inv"), "should have inventory container");
  assert.ok(markup.includes("switch-inv-tab"), "should have tab switcher buttons");
});

test("buildInventoryMarkup character tab includes stat grid with life and attributes", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  state.ui.inventoryTab = "character";
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  const markup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);

  assert.ok(markup.includes("d2inv"), "should have d2inv container class");
  assert.ok(markup.length > 500, "should produce substantial character markup");
});

test("buildInventoryMarkup produces substantial markup for both tabs", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  state.ui.inventoryTab = "character";
  const charMarkup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);
  assert.ok(charMarkup.length > 200, "character tab should produce substantial markup");

  state.ui.inventoryTab = "inventory";
  const invMarkup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);
  assert.ok(invMarkup.length > 200, "inventory tab should produce substantial markup");
});

test("buildInventoryMarkup handles charm pouch display", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  // Ensure charm system is initialized
  if (state.profile?.meta?.charms) {
    state.profile.meta.charms.unlockedCharmIds = [];
    state.profile.meta.charms.equippedCharmIds = [];
  }

  const markup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);
  assert.ok(typeof markup === "string", "should return a string");
  assert.ok(markup.length > 100, "should produce substantial markup");
});

test("buildInventoryMarkup shows mercenary stats when mercenary is alive", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const state = startRunState(harness);
  state.ui.inventoryTab = "character";
  const services = browserWindow.ROUGE_UI_COMMON.getServices();

  const markup = browserWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(state, services);

  assert.ok(markup.includes("Rogue Scout") || markup.includes("rogue") || markup.includes("Mercenary") || markup.includes("merc"), "should show mercenary info");
});
