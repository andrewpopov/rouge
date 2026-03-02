const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadMetaProgressionModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "meta-progression.js"), "utf8");
  new vm.Script(source, { filename: "meta-progression.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_META_PROGRESSION;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

test("meta progression module exposes tier unlock APIs", () => {
  const api = loadMetaProgressionModule();
  assert.equal(typeof api?.createDefaultMetaUnlockState, "function");
  assert.equal(typeof api?.hydrateMetaUnlockState, "function");
  assert.equal(typeof api?.getUnlockedTierCount, "function");
});

test("hydrateMetaUnlockState auto-unlocks tiers by level and filters unknown ids", () => {
  const api = loadMetaProgressionModule();

  const upgradePathCatalog = {
    condenser_bank: {
      id: "condenser_bank",
      maxLevel: 3,
      tierUnlocks: [
        { id: "cb_t2", level: 2, effect: "milestone", value: 0 },
        { id: "cb_t3", level: 3, effect: "max_energy_bonus", value: 1 },
      ],
    },
    guard_protocol: {
      id: "guard_protocol",
      maxLevel: 3,
      tierUnlocks: [{ id: "gp_t2", level: 2, effect: "milestone", value: 0 }],
    },
  };

  const hydrated = api.hydrateMetaUnlockState({
    upgradePathCatalog,
    upgrades: {
      condenser_bank: 3,
      guard_protocol: 0,
    },
    metaUnlocks: {
      condenser_bank: ["cb_t2", "unknown_id"],
      guard_protocol: ["gp_t2"],
    },
  });

  assert.deepEqual(Array.from(hydrated.condenser_bank), ["cb_t2", "cb_t3"]);
  assert.deepEqual(Array.from(hydrated.guard_protocol), ["gp_t2"]);
  assert.equal(api.getUnlockedTierCount({ metaUnlocks: hydrated }), 3);
});

test("applyUpgradePath unlocks tiers progressively and reports newly unlocked tiers", () => {
  const api = loadMetaProgressionModule();

  const upgradePathCatalog = {
    condenser_bank: {
      id: "condenser_bank",
      title: "Condenser Bank",
      maxLevel: 3,
      tierUnlocks: [
        { id: "cb_t2", level: 2, title: "Tier 2", effect: "milestone", value: 0 },
        { id: "cb_t3", level: 3, title: "Tier 3", effect: "max_energy_bonus", value: 1 },
      ],
    },
  };

  const game = {
    player: {
      hull: 72,
      maxHull: 72,
      energy: 2,
      maxEnergy: 3,
    },
    upgrades: {
      condenser_bank: 1,
    },
    metaUnlocks: {
      condenser_bank: [],
    },
  };

  const getUpgradeLevelFn = (pathId) => game.upgrades[pathId] || 0;
  const saveCalls = [];

  const applyUpgradeDerivedCapsFn = () => {
    api.applyUpgradeDerivedCaps({
      game,
      getUpgradeLevelFn,
      baseMaxHull: 72,
      hullPerHullPlatingLevel: 6,
      baseMaxEnergy: 3,
      clamp,
      upgradePathCatalog,
      metaUnlocks: game.metaUnlocks,
    });
  };

  const first = api.applyUpgradePath({
    game,
    pathId: "condenser_bank",
    upgradePathCatalog,
    getUpgradeLevelFn,
    applyUpgradeDerivedCapsFn,
    clamp,
    saveMetaUpgradeStateFn: () => saveCalls.push("saved"),
  });

  assert.equal(first.nextLevel, 2);
  assert.deepEqual(
    Array.from(first.newlyUnlockedTiers).map((tier) => tier.id),
    ["cb_t2"]
  );
  assert.deepEqual(Array.from(game.metaUnlocks.condenser_bank), ["cb_t2"]);
  assert.equal(game.player.maxEnergy, 5);
  assert.equal(game.player.energy, 5);

  const second = api.applyUpgradePath({
    game,
    pathId: "condenser_bank",
    upgradePathCatalog,
    getUpgradeLevelFn,
    applyUpgradeDerivedCapsFn,
    clamp,
    saveMetaUpgradeStateFn: () => saveCalls.push("saved"),
  });

  assert.equal(second.nextLevel, 3);
  assert.deepEqual(
    Array.from(second.newlyUnlockedTiers).map((tier) => tier.id),
    ["cb_t3"]
  );
  assert.deepEqual(Array.from(game.metaUnlocks.condenser_bank), ["cb_t2", "cb_t3"]);
  assert.equal(game.player.maxEnergy, 7);
  assert.equal(game.player.energy, 7);
  assert.equal(saveCalls.length, 2);
});

test("tier unlock effects contribute to caps and turn-start bonuses", () => {
  const api = loadMetaProgressionModule();

  const upgradePathCatalog = {
    condenser_bank: {
      id: "condenser_bank",
      tierUnlocks: [{ id: "cb_t3", level: 3, effect: "max_energy_bonus", value: 1 }],
    },
    coolant_loop: {
      id: "coolant_loop",
      tierUnlocks: [{ id: "cl_t3", level: 3, effect: "turn_start_cooling_bonus", value: 2 }],
    },
    hull_plating: {
      id: "hull_plating",
      tierUnlocks: [{ id: "hp_t3", level: 3, effect: "max_hull_bonus", value: 4 }],
    },
    guard_protocol: {
      id: "guard_protocol",
      tierUnlocks: [{ id: "gp_t3", level: 3, effect: "turn_start_block_bonus", value: 2 }],
    },
  };

  const game = {
    player: {
      hull: 94,
      maxHull: 94,
      energy: 7,
      maxEnergy: 7,
    },
    upgrades: {
      condenser_bank: 3,
      coolant_loop: 3,
      hull_plating: 3,
      guard_protocol: 3,
    },
  };
  const getUpgradeLevelFn = (pathId) => game.upgrades[pathId] || 0;

  const metaUnlocks = {
    condenser_bank: ["cb_t3"],
    coolant_loop: ["cl_t3"],
    hull_plating: ["hp_t3"],
    guard_protocol: ["gp_t3"],
  };

  api.applyUpgradeDerivedCaps({
    game,
    getUpgradeLevelFn,
    baseMaxHull: 72,
    hullPerHullPlatingLevel: 6,
    baseMaxEnergy: 3,
    clamp,
    upgradePathCatalog,
    metaUnlocks,
  });

  const cooling = api.getTurnStartCoolingAmount({
    turnStartCoolingBase: 8,
    getUpgradeLevelFn,
    turnStartCoolingPerLevel: 2,
    upgradePathCatalog,
    metaUnlocks,
  });

  const block = api.getTurnStartBlockAmount({
    getUpgradeLevelFn,
    turnStartBlockPerGuardLevel: 3,
    upgradePathCatalog,
    metaUnlocks,
  });

  assert.equal(game.player.maxHull, 94);
  assert.equal(game.player.maxEnergy, 7);
  assert.equal(cooling, 16);
  assert.equal(block, 11);
});

test("hydrateMetaBranchState auto-selects a valid branch when unlocked", () => {
  const api = loadMetaProgressionModule();

  const upgradePathCatalog = {
    condenser_bank: {
      id: "condenser_bank",
      maxLevel: 3,
      branchChoices: {
        unlockLevel: 2,
        options: [
          { id: "branch_a", title: "Branch A", effect: "max_energy_bonus", value: 1 },
          { id: "branch_b", title: "Branch B", effect: "turn_start_cooling_bonus", value: 2 },
        ],
      },
    },
    guard_protocol: {
      id: "guard_protocol",
      maxLevel: 3,
    },
  };

  const hydrated = api.hydrateMetaBranchState({
    upgradePathCatalog,
    upgrades: {
      condenser_bank: 2,
      guard_protocol: 0,
    },
    metaBranches: {
      condenser_bank: "unknown_branch",
    },
  });

  assert.equal(hydrated.condenser_bank, "branch_a");
  assert.equal(hydrated.guard_protocol, "");
});

test("getUpgradeablePathChoices emits branch variants when a branch unlock is pending", () => {
  const api = loadMetaProgressionModule();

  const upgradePathCatalog = {
    condenser_bank: {
      id: "condenser_bank",
      maxLevel: 3,
      branchChoices: {
        unlockLevel: 2,
        options: [
          { id: "branch_a", title: "Branch A", effect: "max_energy_bonus", value: 1 },
          { id: "branch_b", title: "Branch B", effect: "turn_start_cooling_bonus", value: 2 },
        ],
      },
    },
  };

  const pendingChoices = api.getUpgradeablePathChoices({
    upgradePathCatalog,
    getUpgradeLevelFn: () => 1,
    getMetaBranchSelectionFn: () => "",
  });
  assert.deepEqual(
    Array.from(pendingChoices).map((choice) => `${choice.upgradeId}:${choice.branchId || ""}`),
    ["condenser_bank:branch_a", "condenser_bank:branch_b"]
  );

  const normalChoice = api.getUpgradeablePathChoices({
    upgradePathCatalog,
    getUpgradeLevelFn: () => 1,
    getMetaBranchSelectionFn: () => "branch_a",
  });
  assert.deepEqual(
    Array.from(normalChoice).map((choice) => `${choice.upgradeId}:${choice.branchId || ""}`),
    ["condenser_bank:"]
  );
});
