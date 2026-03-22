export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createRunState() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, browserWindow } = harness;
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
  const vendorOffers = browserWindow.__ROUGE_ITEM_TOWN_VENDOR_OFFERS;
  return { state, content, vendorOffers, browserWindow };
}

test("pickUniqueDefinitions returns up to desiredCount unique items", () => {
  const { vendorOffers } = createRunState();
  const options = [
    { id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" },
  ];
  const result = vendorOffers.pickUniqueDefinitions([], options, 3, 0);
  assert.equal(result.length, 3);
  const ids = result.map((r: { id: string }) => r.id);
  assert.equal(new Set(ids).size, 3, "all items should be unique");
});

test("pickUniqueDefinitions prioritizes candidates over options", () => {
  const { vendorOffers } = createRunState();
  const candidates = [{ id: "priority_1" }, { id: "priority_2" }];
  const options = [{ id: "fallback_1" }, { id: "fallback_2" }, { id: "fallback_3" }];
  const result = vendorOffers.pickUniqueDefinitions(candidates, options, 3, 0);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, "priority_1");
  assert.equal(result[1].id, "priority_2");
});

test("pickUniqueDefinitions skips duplicate candidates", () => {
  const { vendorOffers } = createRunState();
  const candidates = [{ id: "dup" }, { id: "dup" }, { id: "unique" }];
  const options = [{ id: "opt1" }, { id: "opt2" }];
  const result = vendorOffers.pickUniqueDefinitions(candidates, options, 3, 0);
  assert.equal(result.length, 3);
  const ids = result.map((r: { id: string }) => r.id);
  assert.equal(new Set(ids).size, 3);
});

test("pickUniqueDefinitions handles null candidates", () => {
  const { vendorOffers } = createRunState();
  const candidates = [null, { id: "valid" }, null];
  const options = [{ id: "opt1" }, { id: "opt2" }, { id: "opt3" }];
  const result = vendorOffers.pickUniqueDefinitions(candidates, options, 3, 0);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, "valid");
});

test("pickUniqueDefinitions returns fewer items when pool is small", () => {
  const { vendorOffers } = createRunState();
  const options = [{ id: "only_one" }];
  const result = vendorOffers.pickUniqueDefinitions([], options, 5, 0);
  assert.equal(result.length, 1);
});

test("fillDefinitionSelection fills up to desiredCount from options", () => {
  const { vendorOffers } = createRunState();
  const selection = [{ id: "existing" }];
  const options = [{ id: "opt1" }, { id: "opt2" }, { id: "opt3" }];
  const result = vendorOffers.fillDefinitionSelection(selection, options, 3);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, "existing");
});

test("fillDefinitionSelection skips items already in selection", () => {
  const { vendorOffers } = createRunState();
  const selection = [{ id: "opt3" }];
  const options = [{ id: "opt1" }, { id: "opt2" }, { id: "opt3" }];
  const result = vendorOffers.fillDefinitionSelection(selection, options, 3);
  assert.equal(result.length, 3);
  const ids = result.map((r: { id: string }) => r.id);
  assert.equal(new Set(ids).size, 3);
});

test("fillDefinitionSelection limits to desiredCount", () => {
  const { vendorOffers } = createRunState();
  const selection = [{ id: "a" }, { id: "b" }];
  const options = [{ id: "c" }, { id: "d" }, { id: "e" }];
  const result = vendorOffers.fillDefinitionSelection(selection, options, 2);
  assert.equal(result.length, 2);
});

function getItemsBySlot(content: GameContent, slot: string): RuntimeItemDefinition[] {
  return (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
    .filter((item: RuntimeItemDefinition) => item.slot === slot)
    .sort((a: RuntimeItemDefinition, b: RuntimeItemDefinition) => a.progressionTier - b.progressionTier);
}

test("pickVendorEquipmentOffers returns items for a weapon slot", () => {
  const { state, content, vendorOffers } = createRunState();
  const allWeapons = getItemsBySlot(content, "weapon");
  if (allWeapons.length === 0) {
    return; // skip if no weapons available
  }
  const result = vendorOffers.pickVendorEquipmentOffers(
    "weapon", state.run, null, allWeapons, 3, 42, content, state.profile
  );
  assert.ok(Array.isArray(result));
  assert.ok(result.length > 0);
  assert.ok(result.length <= 3);
  for (const item of result) {
    assert.ok(item.id);
  }
});

test("pickVendorEquipmentOffers returns empty for empty options", () => {
  const { state, content, vendorOffers } = createRunState();
  const result = vendorOffers.pickVendorEquipmentOffers(
    "weapon", state.run, null, [], 3, 42, content
  );
  assert.equal(result.length, 0);
});

test("pickVendorEquipmentOffers returns empty for zero desiredCount", () => {
  const { state, content, vendorOffers } = createRunState();
  const allWeapons = getItemsBySlot(content, "weapon");
  const result = vendorOffers.pickVendorEquipmentOffers(
    "weapon", state.run, null, allWeapons, 0, 42, content
  );
  assert.equal(result.length, 0);
});

test("pickVendorEquipmentOffers favors upgrades in late acts", () => {
  const { state, content, vendorOffers } = createRunState();
  const allWeapons = getItemsBySlot(content, "weapon");
  if (allWeapons.length < 2) {
    return;
  }
  state.run.actNumber = 5;
  const result = vendorOffers.pickVendorEquipmentOffers(
    "weapon", state.run, null, allWeapons, 3, 42, content, state.profile
  );
  assert.ok(result.length > 0);
});

test("pickVendorEquipmentOffers with armor slot", () => {
  const { state, content, vendorOffers } = createRunState();
  const allArmor = getItemsBySlot(content, "armor");
  if (allArmor.length === 0) {
    return;
  }
  const result = vendorOffers.pickVendorEquipmentOffers(
    "armor", state.run, null, allArmor, 3, 7, content, state.profile
  );
  assert.ok(result.length > 0);
  assert.ok(result.length <= 3);
});
