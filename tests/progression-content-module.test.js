const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadProgressionContentModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "progression-content.js"), "utf8");
  new vm.Script(source, { filename: "progression-content.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_PROGRESSION_CONTENT;
}

test("progression content module exposes default content providers", () => {
  const api = loadProgressionContentModule();

  assert.equal(typeof api?.getDefaultRunSectors, "function");
  assert.equal(typeof api?.getDefaultStarterDeckRecipe, "function");
  assert.equal(typeof api?.getDefaultRewardPool, "function");
  assert.equal(typeof api?.getDefaultInterludes, "function");
  assert.equal(typeof api?.getDefaultUpgradePathCatalog, "function");
});

test("progression content providers return defensive copies", () => {
  const api = loadProgressionContentModule();

  const sectorsA = api.getDefaultRunSectors();
  const sectorsB = api.getDefaultRunSectors();
  assert.equal(sectorsA.length, 5);
  assert.equal(sectorsB.length, 5);

  sectorsA[0].name = "Mutated";
  sectorsA[0].enemies[0].power = 99;
  assert.equal(sectorsB[0].name, "Freight Corridor");
  assert.equal(sectorsB[0].enemies[0].power, 1);

  const starterA = api.getDefaultStarterDeckRecipe();
  const starterB = api.getDefaultStarterDeckRecipe();
  starterA.push("rail_cannon");
  assert.equal(starterB.includes("rail_cannon"), false);

  const rewardsA = api.getDefaultRewardPool();
  const rewardsB = api.getDefaultRewardPool();
  rewardsA.length = 0;
  assert.ok(rewardsB.length > 0);

  const interludesA = api.getDefaultInterludes();
  const interludesB = api.getDefaultInterludes();
  interludesA.push({ afterSector: 1 });
  assert.equal(interludesB.length, 0);

  const upgradeA = api.getDefaultUpgradePathCatalog();
  const upgradeB = api.getDefaultUpgradePathCatalog();
  upgradeA.condenser_bank.title = "Mutated";
  assert.equal(upgradeB.condenser_bank.title, "Condenser Bank");
});
