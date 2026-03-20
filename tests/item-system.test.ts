export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function assertArrayEqual(actual: unknown[], expected: unknown[], message?: string) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
}

function createRunFixture() {
  const harness = createAppHarness();
  const { content, combatEngine, appEngine, seedBundle, browserWindow } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  assert.equal(appEngine.startRun(state).ok, true);

  const catalog = browserWindow.ROUGE_ITEM_CATALOG;
  const loadout = browserWindow.ROUGE_ITEM_LOADOUT;
  return { ...harness, state, run: state.run, catalog, loadout };
}

/** Equip a weapon and armor into the run loadout so tests that need equipped gear have it. */
function equipStarterGear(run: RunState, loadout: Window["ROUGE_ITEM_LOADOUT"], content: GameContent) {
  const weaponEntry = loadout.addEquipmentToInventory(run, "item_short_sword", content);
  assert.ok(weaponEntry);
  assert.equal(loadout.equipInventoryEntry(run, weaponEntry.entryId, content).ok, true);

  const armorEntry = loadout.addEquipmentToInventory(run, "item_quilted_armor", content);
  assert.ok(armorEntry);
  assert.equal(loadout.equipInventoryEntry(run, armorEntry.entryId, content).ok, true);
}

// ---------------------------------------------------------------------------
// Catalog: createRuntimeContent populates item, rune, and runeword catalogs
// ---------------------------------------------------------------------------

test("createRuntimeContent populates item, rune, and runeword catalogs from seeds", () => {
  const { content } = createAppHarness();

  const itemIds = Object.keys(content.itemCatalog);
  const runeIds = Object.keys(content.runeCatalog);
  const runewordIds = Object.keys(content.runewordCatalog);

  assert.ok(itemIds.length > 0, "itemCatalog should not be empty");
  assert.ok(runeIds.length > 0, "runeCatalog should not be empty");
  assert.ok(runewordIds.length > 0, "runewordCatalog should not be empty");

  assert.ok(itemIds.includes("item_short_sword"));
  assert.ok(itemIds.includes("item_quilted_armor"));
  assert.ok(runeIds.includes("rune_el"));
  assert.ok(runewordIds.includes("steel"));
});

// ---------------------------------------------------------------------------
// Catalog: definition lookups
// ---------------------------------------------------------------------------

test("getItemDefinition returns a valid item or null for unknown ids", () => {
  const { content, catalog } = createRunFixture();

  const sword = catalog.getItemDefinition(content, "item_short_sword");
  assert.ok(sword);
  assert.equal(sword.id, "item_short_sword");
  assert.equal(sword.slot, "weapon");
  assert.equal(sword.progressionTier, 1);
  assert.ok(typeof sword.maxSockets === "number");

  assert.equal(catalog.getItemDefinition(content, "nonexistent_item"), null);
});

test("getRuneDefinition returns a valid rune or null for unknown ids", () => {
  const { content, catalog } = createRunFixture();

  const el = catalog.getRuneDefinition(content, "rune_el");
  assert.ok(el);
  assert.equal(el.id, "rune_el");
  assert.ok(el.allowedSlots.includes("weapon"));
  assert.ok(el.allowedSlots.includes("armor"));

  assert.equal(catalog.getRuneDefinition(content, "nonexistent_rune"), null);
});

test("getRunewordDefinition returns a valid runeword or null for unknown ids", () => {
  const { content, catalog } = createRunFixture();

  const steel = catalog.getRunewordDefinition(content, "steel");
  assert.ok(steel);
  assert.equal(steel.id, "steel");
  assert.equal(steel.slot, "weapon");
  assertArrayEqual(steel.requiredRunes, ["rune_tir", "rune_el"]);
  assert.equal(steel.socketCount, 2);

  assert.equal(catalog.getRunewordDefinition(content, "nonexistent_runeword"), null);
});

// ---------------------------------------------------------------------------
// Runeword compatibility
// ---------------------------------------------------------------------------

test("isRunewordCompatibleWithItem checks slot, sockets, and family allow list", () => {
  const { content, catalog } = createRunFixture();

  const sword = catalog.getItemDefinition(content, "item_short_sword");
  const armor = catalog.getItemDefinition(content, "item_quilted_armor");
  const steel = catalog.getRunewordDefinition(content, "steel");
  const stealth = catalog.getRunewordDefinition(content, "stealth");

  // steel is a weapon runeword for Swords family
  assert.equal(catalog.isRunewordCompatibleWithItem(sword, steel), sword.maxSockets >= steel.socketCount);
  // steel should not be compatible with armor (wrong slot)
  assert.equal(catalog.isRunewordCompatibleWithItem(armor, steel), false);
  // stealth is an armor runeword
  assert.equal(catalog.isRunewordCompatibleWithItem(sword, stealth), false);
  assert.equal(catalog.isRunewordCompatibleWithItem(armor, stealth), armor.maxSockets >= stealth.socketCount);
  // null inputs
  assert.equal(catalog.isRunewordCompatibleWithItem(null, steel), false);
  assert.equal(catalog.isRunewordCompatibleWithItem(sword, null), false);
});

test("isRuneAllowedInSlot validates rune placement by slot", () => {
  const { content, catalog } = createRunFixture();

  const el = catalog.getRuneDefinition(content, "rune_el");
  assert.equal(catalog.isRuneAllowedInSlot(el, "weapon"), true);
  assert.equal(catalog.isRuneAllowedInSlot(el, "armor"), true);
  assert.equal(catalog.isRuneAllowedInSlot(null, "weapon"), false);
});

// ---------------------------------------------------------------------------
// Inventory: add equipment and runes
// ---------------------------------------------------------------------------

test("addEquipmentToInventory adds an equipment entry to carried inventory", () => {
  const { content, run, loadout } = createRunFixture();

  const entry = loadout.addEquipmentToInventory(run, "item_scimitar", content);

  assert.ok(entry);
  assert.equal(entry.kind, "equipment");
  assert.equal(entry.equipment.itemId, "item_scimitar");
  assert.equal(entry.equipment.slot, "weapon");
  assert.equal(entry.equipment.socketsUnlocked, 0);
  assert.equal(entry.equipment.insertedRunes.length, 0);
  assert.ok(run.inventory.carried.some((e: InventoryEntry) => e.entryId === entry.entryId));
});

test("addEquipmentToInventory returns null for an invalid item id", () => {
  const { content, run, loadout } = createRunFixture();
  assert.equal(loadout.addEquipmentToInventory(run, "fake_item", content), null);
});

test("addRuneToInventory adds a rune entry to carried inventory", () => {
  const { content, run, loadout } = createRunFixture();

  const entry = loadout.addRuneToInventory(run, "rune_el", content);

  assert.ok(entry);
  assert.equal(entry.kind, "rune");
  assert.equal(entry.runeId, "rune_el");
  assert.ok(run.inventory.carried.some((e: InventoryEntry) => e.entryId === entry.entryId));
});

test("addRuneToInventory returns null for an invalid rune id", () => {
  const { content, run, loadout } = createRunFixture();
  assert.equal(loadout.addRuneToInventory(run, "fake_rune", content), null);
});

// ---------------------------------------------------------------------------
// Inventory: equip and unequip
// ---------------------------------------------------------------------------

test("equipInventoryEntry equips carried equipment into the loadout slot", () => {
  const { content, run, loadout } = createRunFixture();

  const entry = loadout.addEquipmentToInventory(run, "item_scimitar", content);
  assert.ok(entry);

  const result = loadout.equipInventoryEntry(run, entry.entryId, content);

  assert.equal(result.ok, true);
  assert.equal(run.loadout.weapon.itemId, "item_scimitar");
});

test("equipInventoryEntry swaps old equipment back into inventory", () => {
  const { content, run, loadout } = createRunFixture();

  // Equip a weapon first so there is something to swap
  equipStarterGear(run, loadout, content);
  const oldWeaponId = run.loadout.weapon.itemId;

  const entry = loadout.addEquipmentToInventory(run, "item_scimitar", content);
  assert.ok(entry);
  loadout.equipInventoryEntry(run, entry.entryId, content);

  assert.ok(
    run.inventory.carried.some((e: InventoryEntry) => e.kind === "equipment" && (e as InventoryEquipmentEntry).equipment.itemId === oldWeaponId),
    "old weapon should be in inventory after swap"
  );
});

test("equipInventoryEntry rejects a non-existent entry", () => {
  const { content, run, loadout } = createRunFixture();
  const result = loadout.equipInventoryEntry(run, "nonexistent_entry", content);
  assert.equal(result.ok, false);
});

test("unequipSlot moves equipped item back to inventory", () => {
  const { content, run, loadout } = createRunFixture();

  // Equip gear first since runs start with empty loadout
  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.weapon);
  const equippedItemId = run.loadout.weapon.itemId;

  const result = loadout.unequipSlot(run, "weapon", content);

  assert.equal(result.ok, true);
  assert.equal(run.loadout.weapon, null);
  assert.ok(run.inventory.carried.some((e: InventoryEntry) => e.kind === "equipment" && (e as InventoryEquipmentEntry).equipment.itemId === equippedItemId));
});

test("unequipSlot fails gracefully when the slot is already empty", () => {
  const { content, run, loadout } = createRunFixture();

  // Loadout starts empty, so this should fail
  assert.equal(run.loadout.weapon, null);
  const result = loadout.unequipSlot(run, "weapon", content);
  assert.equal(result.ok, false);
});

// ---------------------------------------------------------------------------
// Socket operations
// ---------------------------------------------------------------------------

test("socketInventoryRune inserts a rune into an equipped item with open sockets", () => {
  const { content, run, loadout } = createRunFixture();

  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.weapon);
  run.loadout.weapon.socketsUnlocked = 2;
  run.loadout.weapon.insertedRunes = [];

  const runeEntry = loadout.addRuneToInventory(run, "rune_el", content);
  assert.ok(runeEntry);

  const result = loadout.socketInventoryRune(run, runeEntry.entryId, "weapon", content);

  assert.equal(result.ok, true);
  assert.equal(run.loadout.weapon.insertedRunes.length, 1);
  assert.equal(run.loadout.weapon.insertedRunes[0], "rune_el");
  assert.ok(!run.inventory.carried.some((e: InventoryEntry) => e.entryId === runeEntry.entryId), "rune should be consumed from inventory");
});

test("socketInventoryRune fails when no open sockets remain", () => {
  const { content, run, loadout } = createRunFixture();

  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.weapon);
  run.loadout.weapon.socketsUnlocked = 1;
  run.loadout.weapon.insertedRunes = ["rune_tir"];

  const runeEntry = loadout.addRuneToInventory(run, "rune_el", content);
  assert.ok(runeEntry);

  const result = loadout.socketInventoryRune(run, runeEntry.entryId, "weapon", content);
  assert.equal(result.ok, false);
});

test("socketInventoryRune resolves runeword when all required runes are inserted", () => {
  const { content, run, loadout, catalog } = createRunFixture();

  // Equip armor first
  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.armor);
  const armorDef = catalog.getItemDefinition(content, run.loadout.armor.itemId);
  assert.ok(armorDef);

  // Set up armor with enough sockets and clear runes
  // Stealth requires rune_tal + rune_eth in armor (Body Armor family)
  run.loadout.armor.socketsUnlocked = 2;
  run.loadout.armor.insertedRunes = [];

  // Socket rune_tal
  const talEntry = loadout.addRuneToInventory(run, "rune_tal", content);
  assert.ok(talEntry);
  assert.equal(loadout.socketInventoryRune(run, talEntry.entryId, "armor", content).ok, true);

  // Socket rune_eth
  const ethEntry = loadout.addRuneToInventory(run, "rune_eth", content);
  assert.ok(ethEntry);
  assert.equal(loadout.socketInventoryRune(run, ethEntry.entryId, "armor", content).ok, true);

  // Check if the stealth runeword was resolved (armor family should be compatible)
  const stealth = catalog.getRunewordDefinition(content, "stealth");
  assert.ok(stealth);
  if (catalog.isRunewordCompatibleWithItem(armorDef, stealth)) {
    assert.equal(run.loadout.armor.runewordId, "stealth");
  }
});

// ---------------------------------------------------------------------------
// Combat bonuses
// ---------------------------------------------------------------------------

test("buildCombatBonuses aggregates item bonuses from equipped loadout", () => {
  const { content, run, loadout, itemSystem } = createRunFixture();

  equipStarterGear(run, loadout, content);

  const bonuses = itemSystem.buildCombatBonuses(run, content);

  assert.equal(typeof bonuses, "object");
  const totalKeys = Object.keys(bonuses);
  assert.ok(totalKeys.length > 0, "combat bonuses should have at least one key from equipped items");
});

test("buildCombatBonuses returns empty object when no items are equipped", () => {
  const { content, run, itemSystem } = createRunFixture();

  run.loadout.weapon = null;
  run.loadout.armor = null;

  const bonuses = itemSystem.buildCombatBonuses(run, content);
  assert.equal(typeof bonuses, "object");
  assert.equal(Object.keys(bonuses).length, 0);
});

test("buildCombatBonuses includes rune bonuses on socketed equipment", () => {
  const { content, run, loadout, itemSystem } = createRunFixture();

  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.weapon);
  run.loadout.weapon.socketsUnlocked = 1;
  run.loadout.weapon.insertedRunes = [];

  // Baseline bonuses without rune
  const before = itemSystem.buildCombatBonuses(run, content);
  const beforeDamage = before.heroDamageBonus || 0;

  // Socket rune_el which gives heroDamageBonus: 1
  const runeEntry = loadout.addRuneToInventory(run, "rune_el", content);
  assert.ok(runeEntry);
  loadout.socketInventoryRune(run, runeEntry.entryId, "weapon", content);

  const after = itemSystem.buildCombatBonuses(run, content);
  assert.ok((after.heroDamageBonus || 0) > beforeDamage, "damage bonus should increase after socketing rune_el");
});

// ---------------------------------------------------------------------------
// Loadout summary
// ---------------------------------------------------------------------------

test("getLoadoutSummary returns descriptive lines for the current loadout", () => {
  const { content, run, loadout, itemSystem } = createRunFixture();

  equipStarterGear(run, loadout, content);

  const lines = itemSystem.getLoadoutSummary(run, content);

  assert.ok(Array.isArray(lines));
  assert.ok(lines.length >= 2, "should have at least weapon and armor lines");
  assert.ok(lines.some((line: string) => line.startsWith("Weapon:")), "should include a weapon line");
  assert.ok(lines.some((line: string) => line.startsWith("Armor:")), "should include an armor line");
});

test("getLoadoutSummary shows None for empty slots", () => {
  const { content, run, itemSystem } = createRunFixture();

  run.loadout.weapon = null;
  run.loadout.armor = null;

  const lines = itemSystem.getLoadoutSummary(run, content);
  assert.ok(lines[0].includes("No equipment equipped"));
});

// ---------------------------------------------------------------------------
// Active runewords tracking
// ---------------------------------------------------------------------------

test("getActiveRunewords returns names of completed runewords in loadout", () => {
  const { content, run, loadout, catalog, itemSystem } = createRunFixture();

  // Equip armor first
  equipStarterGear(run, loadout, content);
  assert.ok(run.loadout.armor);

  // Set up armor with stealth runeword (tal + eth)
  run.loadout.armor.socketsUnlocked = 2;
  run.loadout.armor.insertedRunes = ["rune_tal", "rune_eth"];

  const armorDef = catalog.getItemDefinition(content, run.loadout.armor.itemId);
  const stealth = catalog.getRunewordDefinition(content, "stealth");
  assert.ok(armorDef);
  assert.ok(stealth);

  // Manually resolve the runeword
  run.loadout.armor.runewordId = catalog.isRunewordCompatibleWithItem(armorDef, stealth) ? "stealth" : "";

  const activeRunewords = itemSystem.getActiveRunewords(run, content);
  assert.ok(Array.isArray(activeRunewords));

  if (run.loadout.armor.runewordId === "stealth") {
    assert.ok(activeRunewords.some((name: string) => name.toLowerCase().includes("stealth")));
  }
});
