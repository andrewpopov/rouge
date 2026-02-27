const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const PROGRESSION_PATH = path.resolve(__dirname, "..", "progression.js");

function loadProgressionModule() {
  const source = fs.readFileSync(PROGRESSION_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const script = new vm.Script(source, { filename: PROGRESSION_PATH });
  script.runInContext(sandbox);
  return sandbox.window.BRASSLINE_PROGRESSION;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

test("buildConfiguredProgression sanitizes sectors, card lists, and interludes", () => {
  const progression = loadProgressionModule();

  const result = progression.buildConfiguredProgression({
    progressionBalance: {
      sectors: [
        {
          name: "Broken",
          enemies: [{ key: "unknown_enemy", power: 1 }],
        },
      ],
    },
    defaultRunSectors: [
      {
        name: "Fallback Sector",
        boss: false,
        enemies: [{ key: "rail_hound", power: 1 }],
      },
    ],
    enemyBlueprints: {
      rail_hound: { key: "rail_hound" },
    },
    starterDeckConfig: ["not_real_card", "stoke_burners"],
    defaultStarterDeck: ["spark_lance"],
    rewardPoolConfig: ["not_real_card"],
    defaultRewardPool: ["rail_cannon"],
    interludeConfig: [
      {
        afterSector: 1,
        type: "event",
        title: "Signal Fork",
        options: [
          {
            label: "Patch Hull",
            hull: 5,
            addCard: "stoke_burners",
            targetSector: 99,
          },
          {
            label: "Bad Card Option",
            addCard: "not_real_card",
          },
        ],
      },
      {
        afterSector: 0,
        options: [{ label: "Invalid Interlude" }],
      },
    ],
    defaultInterludes: [],
    cardCatalog: {
      stoke_burners: { title: "Stoke Burners" },
      spark_lance: { title: "Spark Lance" },
      rail_cannon: { title: "Rail Cannon" },
    },
  });

  assert.equal(result.runSectors.length, 1);
  assert.equal(result.runSectors[0].name, "Fallback Sector");

  assert.deepEqual(Array.from(result.starterDeckRecipe), ["stoke_burners"]);
  assert.deepEqual(Array.from(result.rewardPool), ["rail_cannon"]);

  assert.equal(result.runInterludes.length, 1);
  assert.equal(result.runInterludes[0].title, "Signal Fork");
  assert.equal(result.runInterludes[0].options.length, 2);
  assert.equal(result.runInterludes[0].options[0].targetSector, null);
  assert.equal(result.runInterludes[0].options[1].addCard, null);
});

test("buildUpgradePathCatalog applies tuning, clamps max levels, and builds bonus labels", () => {
  const progression = loadProgressionModule();

  const catalog = progression.buildUpgradePathCatalog({
    defaultUpgradePathCatalog: {
      condenser_bank: {
        id: "condenser_bank",
        title: "Condenser Bank",
        icon: "icon_a",
        description: "desc",
        maxLevel: 3,
      },
      coolant_loop: {
        id: "coolant_loop",
        title: "Coolant Loop",
        icon: "icon_b",
        description: "desc",
        maxLevel: 3,
      },
    },
    upgradePathTune: (pathId, key, fallback) => {
      if (pathId === "condenser_bank" && key === "title") {
        return "Pressure Cells";
      }
      if (pathId === "condenser_bank" && key === "maxLevel") {
        return 99;
      }
      if (pathId === "coolant_loop" && key === "maxLevel") {
        return -5;
      }
      return fallback;
    },
    clamp,
    turnStartCoolingBase: 8,
    turnStartCoolingPerLevel: 2,
    hullPerHullPlatingLevel: 6,
    turnStartBlockPerGuardLevel: 3,
  });

  assert.equal(catalog.condenser_bank.title, "Pressure Cells");
  assert.equal(catalog.condenser_bank.maxLevel, 9);
  assert.equal(catalog.coolant_loop.maxLevel, 1);
  assert.equal(catalog.condenser_bank.bonusLabel(3), "Max Steam +3");
  assert.equal(catalog.coolant_loop.bonusLabel(2), "Turn-start cooling 12");
});

test("ensureRunStats normalizes missing and invalid values", () => {
  const progression = loadProgressionModule();
  const game = {
    runStats: {
      cardsPlayed: 2.9,
      damageDealt: -8,
      damageTaken: "oops",
      enemiesDestroyed: 4,
    },
  };

  const stats = progression.ensureRunStats({ game });

  assert.deepEqual(stats, {
    cardsPlayed: 2,
    damageDealt: 0,
    damageTaken: 0,
    enemiesDestroyed: 4,
    rewardsClaimed: 0,
    cardsRewarded: 0,
    upgradesRewarded: 0,
    rewardSkips: 0,
  });
});

test("ensureRunRecords normalizes numeric fields and bestVictoryTurns", () => {
  const progression = loadProgressionModule();
  const game = {
    runRecords: {
      totalRuns: 5.8,
      wins: -3,
      bestVictoryTurns: "12",
      bestDamageDealt: 44.9,
      bestSectorsCleared: "bad",
      bestMetaLevels: 3.2,
    },
  };

  const records = progression.ensureRunRecords({ game });

  assert.deepEqual(records, {
    totalRuns: 5,
    wins: 0,
    bestVictoryTurns: 12,
    bestDamageDealt: 44,
    bestSectorsCleared: 0,
    bestMetaLevels: 3,
  });
});
