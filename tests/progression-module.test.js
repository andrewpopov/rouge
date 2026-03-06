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

test("buildConfiguredProgression preserves elite enemy flags and route signatures", () => {
  const progression = loadProgressionModule();

  const result = progression.buildConfiguredProgression({
    progressionBalance: {
      sectors: [
        {
          name: "Elite Track",
          enemies: [{ key: "rail_hound", power: 1.2, elite: true }],
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
    starterDeckConfig: ["spark_lance"],
    defaultStarterDeck: ["spark_lance"],
    rewardPoolConfig: ["spark_lance"],
    defaultRewardPool: ["spark_lance"],
    interludeConfig: [],
    defaultInterludes: [],
    cardCatalog: {
      spark_lance: { title: "Spark Lance" },
    },
  });

  assert.equal(result.runSectors[0].enemies[0].elite, true);

  const signature = progression.buildRunRouteSignature({
    runSectors: result.runSectors,
    runInterludes: [],
  });
  assert.match(signature, /rail_hound:1\.2:elite/);
});

test("pickSectorEncounter applies weighted deterministic selection per run seed", () => {
  const progression = loadProgressionModule();

  const sector = {
    name: "Weighted Yard",
    encounterSize: 2,
    enemies: [
      { key: "rail_hound", power: 1, weight: 8 },
      { key: "ash_gunner", power: 1, weight: 1 },
      { key: "mortar_engineer", power: 1, weight: 1, elite: true },
    ],
  };

  const pickA = progression.pickSectorEncounter({
    sector,
    sectorIndex: 1,
    runSeed: 12345,
  });
  const pickB = progression.pickSectorEncounter({
    sector,
    sectorIndex: 1,
    runSeed: 12345,
  });

  assert.deepEqual(pickA, pickB);
  assert.equal(pickA.length, 2);
  assert.equal(new Set(pickA.map((entry) => entry.key)).size, 2);
  assert.ok(pickA.some((entry) => entry.key === "rail_hound"));

  let houndSeen = 0;
  let gunnerSeen = 0;
  let mortarSeen = 0;

  for (let seed = 1; seed <= 40; seed += 1) {
    const picks = progression.pickSectorEncounter({
      sector,
      sectorIndex: 1,
      runSeed: seed,
    });
    picks.forEach((entry) => {
      if (entry.key === "rail_hound") {
        houndSeen += 1;
      } else if (entry.key === "ash_gunner") {
        gunnerSeen += 1;
      } else if (entry.key === "mortar_engineer") {
        mortarSeen += 1;
      }
    });
  }

  assert.ok(houndSeen > gunnerSeen);
  assert.ok(houndSeen > mortarSeen);
});

test("estimateEncounterEliteChance returns stable weighted no-replacement elite odds", () => {
  const progression = loadProgressionModule();

  const none = progression.estimateEncounterEliteChance({
    sector: {
      encounterSize: 2,
      enemies: [
        { key: "rail_hound", weight: 2, elite: false },
        { key: "ash_gunner", weight: 1, elite: false },
      ],
    },
  });
  assert.equal(none, 0);

  const all = progression.estimateEncounterEliteChance({
    sector: {
      encounterSize: 1,
      enemies: [
        { key: "rail_sentry", weight: 1, elite: true },
        { key: "mortar_engineer", weight: 2, elite: true },
      ],
    },
  });
  assert.equal(all, 1);

  const simple = progression.estimateEncounterEliteChance({
    sector: {
      encounterSize: 1,
      enemies: [
        { key: "rail_hound", weight: 1, elite: false },
        { key: "ash_gunner", weight: 1, elite: false },
        { key: "mortar_engineer", weight: 1, elite: true },
      ],
    },
  });
  assert.ok(Math.abs(simple - 1 / 3) < 1e-9);

  const weighted = progression.estimateEncounterEliteChance({
    sector: {
      encounterSize: 1,
      enemies: [
        { key: "rail_hound", weight: 1, elite: false },
        { key: "ash_gunner", weight: 1, elite: false },
        { key: "mortar_engineer", weight: 5, elite: true },
      ],
    },
  });
  assert.ok(weighted > simple);
  assert.ok(Math.abs(weighted - 5 / 7) < 1e-9);
});

test("estimateEncounterKeyInclusionChances returns grouped weighted odds", () => {
  const progression = loadProgressionModule();

  const sector = {
    encounterSize: 1,
    enemies: [
      { key: "a", weight: 1, elite: false },
      { key: "b", weight: 1, elite: true },
      { key: "b", weight: 1, elite: false },
    ],
  };

  const odds = progression.estimateEncounterKeyInclusionChances({ sector });
  assert.equal(odds.length, 2);

  const chanceA = odds.find((entry) => entry.key === "a");
  const chanceB = odds.find((entry) => entry.key === "b");
  assert.ok(chanceA);
  assert.ok(chanceB);
  assert.ok(Math.abs(chanceA.chance - 1 / 3) < 1e-9);
  assert.ok(Math.abs(chanceB.chance - 2 / 3) < 1e-9);
  assert.equal(chanceB.hasElite, true);
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
    gearRewarded: 0,
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

test("appendRunTimelineEntry prefixes sector/turn and trims to max entries", () => {
  const progression = loadProgressionModule();
  const game = {};

  progression.appendRunTimelineEntry({
    game,
    message: "Entered Freight Corridor.",
    options: { sectorIndex: 0, turn: 1, type: "sector" },
    createDefaultRunTimelineFn: () => [],
    clamp,
    runSectorsLength: 5,
    maxEntries: 3,
  });
  progression.appendRunTimelineEntry({
    game,
    message: "Reward selected.",
    options: { sectorIndex: 0, turn: 2, type: "reward" },
    createDefaultRunTimelineFn: () => [],
    clamp,
    runSectorsLength: 5,
    maxEntries: 3,
  });
  progression.appendRunTimelineEntry({
    game,
    message: "Interlude event.",
    options: { sectorIndex: 1, turn: 3, type: "info" },
    createDefaultRunTimelineFn: () => [],
    clamp,
    runSectorsLength: 5,
    maxEntries: 3,
  });
  progression.appendRunTimelineEntry({
    game,
    message: "Boss approach.",
    options: { sectorIndex: 4, turn: 4, type: "danger" },
    createDefaultRunTimelineFn: () => [],
    clamp,
    runSectorsLength: 5,
    maxEntries: 3,
  });

  assert.equal(game.runTimeline.length, 3);
  assert.deepEqual(
    Array.from(game.runTimeline).map((entry) => entry.line),
    ["S1 T2 // Reward selected.", "S2 T3 // Interlude event.", "S5 T4 // Boss approach."]
  );
  assert.deepEqual(
    Array.from(game.runTimeline).map((entry) => entry.type),
    ["reward", "info", "danger"]
  );
});

test("normalizeRewardChoice and getRewardChoiceKey support artifact rewards", () => {
  const progression = loadProgressionModule();
  const normalized = progression.normalizeRewardChoice({
    type: "artifact",
    artifactId: "aegis_booster",
  });

  assert.equal(normalized?.type, "artifact");
  assert.equal(normalized?.artifactId, "aegis_booster");
  assert.equal(progression.getRewardChoiceKey(normalized), "artifact:aegis_booster");
});

test("normalizeRewardChoice and getRewardChoiceKey preserve upgrade branch ids", () => {
  const progression = loadProgressionModule();
  const normalized = progression.normalizeRewardChoice({
    type: "upgrade",
    upgradeId: "condenser_bank",
    branchId: "condenser_bank_branch_cold_baffles",
  });

  assert.equal(normalized?.type, "upgrade");
  assert.equal(normalized?.upgradeId, "condenser_bank");
  assert.equal(normalized?.branchId, "condenser_bank_branch_cold_baffles");
  assert.equal(
    progression.getRewardChoiceKey(normalized),
    "upgrade:condenser_bank#condenser_bank_branch_cold_baffles"
  );
});

test("normalizeRewardChoice and getRewardChoiceKey support gear rewards", () => {
  const progression = loadProgressionModule();
  const normalized = progression.normalizeRewardChoice({
    type: "gear",
    gearId: "nightfang_blade",
  });

  assert.equal(normalized?.type, "gear");
  assert.equal(normalized?.gearId, "nightfang_blade");
  assert.equal(progression.getRewardChoiceKey(normalized), "gear:nightfang_blade");
});

test("buildStageNodeRoute produces deterministic node paths with enemy-first sectors", () => {
  const progression = loadProgressionModule();
  const runSectors = [
    { name: "Act I - Blood Moor", boss: false, enemies: [{ key: "fallen", power: 1 }] },
    { name: "Act I - Catacombs", boss: true, enemies: [{ key: "andariel", power: 1 }] },
  ];
  const encounterModel = {
    encountersPerStage: { min: 2, max: 3 },
    actNodeWeights: {
      1: { enemy: 0.6, chest: 0.25, shrine: 0.15 },
    },
  };

  const routeA = progression.buildStageNodeRoute({
    runSectors,
    runSeed: 77,
    encounterModel,
  });
  const routeB = progression.buildStageNodeRoute({
    runSectors,
    runSeed: 77,
    encounterModel,
  });

  assert.deepEqual(routeA, routeB);
  assert.equal(routeA.stageNodesBySector.length, 2);
  assert.equal(routeA.stageNodesBySector[0][0].type, "enemy");
  assert.ok(routeA.stageNodesBySector[0].length >= 2);
  assert.ok(routeA.stageNodesBySector[0].slice(1).every((node) => node.type === "chest" || node.type === "shrine"));
  assert.deepEqual(
    Array.from(routeA.stageNodesBySector[1]).map((node) => node.type),
    ["enemy"]
  );
});

test("sanitizeStageNodeRoute and getStageProgress normalize route state safely", () => {
  const progression = loadProgressionModule();
  const sanitized = progression.sanitizeStageNodeRoute({
    runSectors: [
      { name: "Act I - Blood Moor" },
      { name: "Act I - Catacombs", boss: true },
    ],
    rawStageNodesBySector: [
      [{ type: "shrine" }, { type: "chest" }],
      [{ type: "chest" }, { type: "shrine" }],
    ],
  });

  assert.equal(sanitized.stageNodesBySector[0][0].type, "enemy");
  assert.equal(sanitized.stageNodesBySector[1].length, 1);
  assert.equal(sanitized.stageNodesBySector[1][0].type, "enemy");

  const progress = progression.getStageProgress({
    stageNodesBySector: sanitized.stageNodesBySector,
    sectorIndex: 0,
    stageNodeIndex: 1,
    runSectorsLength: 2,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(progress)), {
    totalNodes: 3,
    completedNodes: 1,
    nodesInSector: 2,
    stageNodeIndex: 1,
  });
});
