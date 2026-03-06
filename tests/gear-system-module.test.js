const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const GEAR_SYSTEM_PATH = path.resolve(__dirname, "..", "gear-system.js");

function loadGearSystem() {
  const source = fs.readFileSync(GEAR_SYSTEM_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(source, { filename: GEAR_SYSTEM_PATH }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_GEAR_SYSTEM;
}

test("applyGearReward adds gear to inventory and equips by slot", () => {
  const gearSystem = loadGearSystem();
  const gearCatalog = gearSystem.cloneGearCatalog();
  const game = {
    gearInventory: [],
    equippedGear: {
      weapon: "",
      armor: "",
      trinket: "",
    },
  };

  const first = gearSystem.applyGearReward({
    game,
    gearId: "nightfang_blade",
    gearCatalog,
  });
  assert.equal(first?.slot, "weapon");
  assert.equal(game.equippedGear.weapon, "nightfang_blade");
  assert.deepEqual(Array.from(game.gearInventory), ["nightfang_blade"]);

  const second = gearSystem.applyGearReward({
    game,
    gearId: "bone_mace",
    gearCatalog,
  });
  assert.equal(second?.slot, "weapon");
  assert.equal(second?.replacedGear?.id, "nightfang_blade");
  assert.equal(game.equippedGear.weapon, "bone_mace");
  assert.deepEqual(Array.from(game.gearInventory), ["nightfang_blade", "bone_mace"]);
});

test("normalizeRunGearState strips invalid inventory and slot entries", () => {
  const gearSystem = loadGearSystem();
  const gearCatalog = gearSystem.cloneGearCatalog();

  const normalized = gearSystem.normalizeRunGearState({
    gearCatalog,
    game: {
      gearInventory: ["nightfang_blade", "missing_item", "nightfang_blade"],
      equippedGear: {
        weapon: "nightfang_blade",
        armor: "missing_item",
        trinket: "soul_chalice",
      },
    },
  });

  assert.deepEqual(Array.from(normalized.gearInventory), ["nightfang_blade"]);
  assert.equal(normalized.equippedGear.weapon, "nightfang_blade");
  assert.equal(normalized.equippedGear.armor, "");
  assert.equal(normalized.equippedGear.trinket, "");
});

test("getEquippedGearBonus sums effects from equipped slots", () => {
  const gearSystem = loadGearSystem();
  const gearCatalog = gearSystem.cloneGearCatalog();
  const bonus = gearSystem.getEquippedGearBonus({
    gearCatalog,
    equippedGear: {
      weapon: "bone_mace",
      armor: "bloodmail_plate",
      trinket: "ember_relic",
    },
    effectId: "turn_start_block_bonus",
  });
  assert.equal(bonus, 1);
});

test("getAvailableGearChoices excludes quest-only relics from normal rolls", () => {
  const gearSystem = loadGearSystem();
  const gearCatalog = gearSystem.cloneGearCatalog();
  const availableIds = gearSystem.getAvailableGearChoices({
    gearCatalog,
    gearInventory: [],
  }).map((entry) => entry.id);

  assert.equal(availableIds.includes("blackroad_glaive"), false);
  assert.equal(availableIds.includes("reliquary_heart"), false);
});
