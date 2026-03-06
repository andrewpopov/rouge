const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const RUN_FLOW_PATH = path.resolve(__dirname, "..", "run-flow.js");

function loadRunFlowModule() {
  const source = fs.readFileSync(RUN_FLOW_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(source, { filename: RUN_FLOW_PATH }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_RUN_FLOW;
}

function createSeededRandomInt(seed = 1) {
  let state = (Number.isInteger(seed) ? seed : 1) >>> 0;
  if (state === 0) {
    state = 1;
  }
  return (maxExclusive) => {
    const cap = Number.isInteger(maxExclusive) && maxExclusive > 0 ? maxExclusive : 1;
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % cap;
  };
}

test("run-flow module exposes reward selection API", () => {
  const runFlow = loadRunFlowModule();
  assert.equal(typeof runFlow?.drawRewardChoices, "function");
});

test("drawRewardChoices supports legacy artifact-id lists", () => {
  const runFlow = loadRunFlowModule();
  const choices = runFlow.drawRewardChoices({
    rewardPool: [],
    rewardChoiceCount: 1,
    shuffleInPlace: () => {},
    getUpgradeablePathIds: () => [],
    getAvailableArtifactIds: () => ["artifact_alpha", "artifact_beta"],
    randomInt: () => 0,
  });

  assert.equal(choices.length, 1);
  assert.equal(choices[0].type, "artifact");
  assert.equal(choices[0].artifactId, "artifact_alpha");
});

test("drawRewardChoices favors higher-weight artifacts and avoids duplicate picks", () => {
  const runFlow = loadRunFlowModule();
  const randomInt = createSeededRandomInt(123456);

  let heavy = 0;
  let light = 0;
  for (let index = 0; index < 400; index += 1) {
    const choices = runFlow.drawRewardChoices({
      rewardPool: [],
      rewardChoiceCount: 1,
      shuffleInPlace: () => {},
      getUpgradeablePathIds: () => [],
      getAvailableArtifactIds: () => [
        { id: "heavy_artifact", weight: 8 },
        { id: "light_artifact", weight: 1 },
      ],
      randomInt,
    });
    if (choices[0]?.artifactId === "heavy_artifact") {
      heavy += 1;
    } else if (choices[0]?.artifactId === "light_artifact") {
      light += 1;
    }
  }

  assert.ok(heavy > light * 3, `Expected heavy artifacts to appear more often (${heavy} vs ${light})`);

  const uniqueBatch = runFlow.drawRewardChoices({
    rewardPool: [],
    rewardChoiceCount: 3,
    shuffleInPlace: () => {},
    getUpgradeablePathIds: () => [],
    getAvailableArtifactIds: () => [
      { id: "artifact_one", weight: 5 },
      { id: "artifact_two", weight: 2 },
      { id: "artifact_three", weight: 1 },
    ],
    randomInt: createSeededRandomInt(42),
  });
  const artifactIds = uniqueBatch.map((choice) => choice.artifactId);
  assert.equal(new Set(artifactIds).size, artifactIds.length);
});

test("drawRewardChoices supports upgrade choices with branch ids", () => {
  const runFlow = loadRunFlowModule();

  const choices = runFlow.drawRewardChoices({
    rewardPool: [],
    rewardChoiceCount: 1,
    shuffleInPlace: () => {},
    getUpgradeablePathIds: () => [],
    getUpgradeablePathChoices: () => [
      { upgradeId: "condenser_bank", branchId: "condenser_bank_branch_cold_baffles" },
      { upgradeId: "condenser_bank", branchId: "condenser_bank_branch_pressure_cells" },
    ],
    getAvailableArtifactIds: () => [],
    randomInt: () => 0,
  });

  assert.equal(choices.length, 1);
  assert.equal(choices[0].type, "upgrade");
  assert.equal(choices[0].upgradeId, "condenser_bank");
  assert.ok(
    [
      "condenser_bank_branch_cold_baffles",
      "condenser_bank_branch_pressure_cells",
    ].includes(choices[0].branchId)
  );
});

test("drawRewardChoices includes gear rewards when available", () => {
  const runFlow = loadRunFlowModule();

  const choices = runFlow.drawRewardChoices({
    rewardPool: [],
    rewardChoiceCount: 2,
    shuffleInPlace: () => {},
    getUpgradeablePathIds: () => [],
    getUpgradeablePathChoices: () => [],
    getAvailableArtifactIds: () => [],
    getAvailableGearIds: () => [
      { id: "nightfang_blade", weight: 4 },
      { id: "bloodmail_plate", weight: 2 },
    ],
    randomInt: () => 0,
  });

  assert.ok(choices.some((choice) => choice?.type === "gear"));
  const gearIds = choices.filter((choice) => choice?.type === "gear").map((choice) => choice.gearId);
  assert.equal(new Set(gearIds).size, gearIds.length);
});

test("applyRewardAndAdvance supports gear rewards and advances sector", () => {
  const runFlow = loadRunFlowModule();
  const stats = {
    rewardsClaimed: 0,
    cardsRewarded: 0,
    gearRewarded: 0,
    upgradesRewarded: 0,
    rewardSkips: 0,
  };
  const game = {
    phase: "reward",
    rewardChoices: [{ type: "gear", gearId: "nightfang_blade" }],
    player: {
      hull: 20,
      maxHull: 30,
    },
    sectorIndex: 0,
    artifacts: [],
  };
  let passiveCapsCalls = 0;
  let nextBattleStarted = false;

  runFlow.applyRewardAndAdvance({
    game,
    rewardChoice: { type: "gear", gearId: "nightfang_blade" },
    normalizeRewardChoice: (choice) => choice,
    getRewardChoiceKey: (choice) => `gear:${choice.gearId}`,
    setLog: () => {},
    renderRewardPanel: () => {},
    collectDeckInstances: () => [],
    rewardHealSkip: 4,
    rewardHealChosen: 8,
    cardCatalog: {},
    artifactCatalog: {},
    gearCatalog: {
      nightfang_blade: { id: "nightfang_blade", title: "Nightfang Blade", slot: "weapon" },
    },
    applyGearReward: () => ({
      gear: { id: "nightfang_blade", title: "Nightfang Blade", slot: "weapon" },
      slot: "weapon",
      replacedGear: null,
    }),
    getArtifactRewardHealBonus: () => 0,
    applyRunPassiveCaps: () => {
      passiveCapsCalls += 1;
    },
    makeCardInstance: () => null,
    ensureRunStats: () => stats,
    appendRunTimelineEntry: () => {},
    applyUpgradePath: () => null,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    runSectorsLength: 3,
    recordRunOutcome: () => {},
    renderEnemies: () => {},
    renderCards: () => {},
    renderTrackMap: () => {},
    updateHud: () => {},
    getInterludeForAfterSector: () => null,
    beginInterlude: () => false,
    beginSectorBattle: () => {
      nextBattleStarted = true;
    },
  });

  assert.equal(game.sectorIndex, 1);
  assert.equal(game.player.hull, 28);
  assert.equal(stats.rewardsClaimed, 1);
  assert.equal(stats.gearRewarded, 1);
  assert.equal(passiveCapsCalls, 1);
  assert.equal(nextBattleStarted, true);
});

test("applyRewardAndAdvance can convert duplicate class-card rewards into rank ups", () => {
  const runFlow = loadRunFlowModule();
  const stats = {
    rewardsClaimed: 0,
    cardsRewarded: 0,
    gearRewarded: 0,
    upgradesRewarded: 0,
    rewardSkips: 0,
  };
  const game = {
    phase: "reward",
    rewardChoices: [{ type: "card", cardId: "sorceress_fireball_spell" }],
    player: {
      hull: 12,
      maxHull: 20,
    },
    sectorIndex: 0,
    artifacts: [],
  };
  let nextDeck = null;

  runFlow.applyRewardAndAdvance({
    game,
    rewardChoice: { type: "card", cardId: "sorceress_fireball_spell" },
    normalizeRewardChoice: (choice) => choice,
    getRewardChoiceKey: (choice) => `card:${choice.cardId}`,
    setLog: () => {},
    renderRewardPanel: () => {},
    collectDeckInstances: () => [
      { cardId: "sorceress_fireball_spell", instanceId: "c_1_fireball" },
      { cardId: "sorceress_fireball_spell", instanceId: "c_2_fireball" },
    ],
    rewardHealSkip: 4,
    rewardHealChosen: 8,
    cardCatalog: {
      sorceress_fireball_spell: { id: "sorceress_fireball_spell", title: "Fireball" },
    },
    artifactCatalog: {},
    gearCatalog: {},
    applyGearReward: () => null,
    getArtifactRewardHealBonus: () => 0,
    applyRunPassiveCaps: () => {},
    makeCardInstance: (cardId) => ({ cardId, instanceId: `made_${cardId}` }),
    ensureRunStats: () => stats,
    appendRunTimelineEntry: () => {},
    applyUpgradePath: () => null,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    runSectorsLength: 2,
    recordRunOutcome: () => {},
    renderEnemies: () => {},
    renderCards: () => {},
    renderTrackMap: () => {},
    updateHud: () => {},
    getInterludeForAfterSector: () => null,
    beginInterlude: () => {},
    beginSectorBattle: (deck) => {
      nextDeck = deck;
    },
    resolveCardRewardFn: () => ({
      mode: "rank_up",
      timelineText: "Reward: empowered Fireball to Rank 2/5.",
      rewardMessage: "Empowered Fireball to Rank 2/5. Hull repaired by 8.",
    }),
  });

  assert.equal(stats.cardsRewarded, 1);
  assert.equal(nextDeck.length, 2);
  assert.equal(nextDeck.every((entry) => entry.cardId === "sorceress_fireball_spell"), true);
  assert.equal(game.player.hull, 20);
});

test("applyRewardAndAdvance defers post-reward flow when custom resolver handles it", () => {
  const runFlow = loadRunFlowModule();
  const game = {
    phase: "reward",
    rewardChoices: [{ type: "card", cardId: "spark_lance" }],
    player: {
      hull: 18,
      maxHull: 30,
    },
    sectorIndex: 0,
    artifacts: [],
  };
  let postRewardHandled = false;

  runFlow.applyRewardAndAdvance({
    game,
    rewardChoice: { type: "card", cardId: "spark_lance" },
    normalizeRewardChoice: (choice) => choice,
    getRewardChoiceKey: (choice) => `card:${choice.cardId}`,
    setLog: () => {},
    renderRewardPanel: () => {},
    collectDeckInstances: () => [],
    rewardHealSkip: 4,
    rewardHealChosen: 8,
    cardCatalog: {
      spark_lance: { title: "Spark Lance" },
    },
    artifactCatalog: {},
    gearCatalog: {},
    applyGearReward: () => null,
    getArtifactRewardHealBonus: () => 0,
    applyRunPassiveCaps: () => {},
    makeCardInstance: (cardId) => ({ cardId, instanceId: "c_1_test" }),
    ensureRunStats: () => ({
      rewardsClaimed: 0,
      cardsRewarded: 0,
      gearRewarded: 0,
      upgradesRewarded: 0,
      rewardSkips: 0,
    }),
    appendRunTimelineEntry: () => {},
    applyUpgradePath: () => null,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    runSectorsLength: 3,
    recordRunOutcome: () => {},
    renderEnemies: () => {},
    renderCards: () => {},
    renderTrackMap: () => {},
    updateHud: () => {},
    getInterludeForAfterSector: () => null,
    beginInterlude: () => false,
    beginSectorBattle: () => {},
    resolvePostRewardFlowFn: () => {
      postRewardHandled = true;
      return true;
    },
  });

  assert.equal(postRewardHandled, true);
  assert.equal(game.sectorIndex, 0);
});
