const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadQuestSystemModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "quest-system.js"), "utf8");
  new vm.Script(source, { filename: "quest-system.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_QUEST_SYSTEM;
}

function createRouteFixture() {
  return {
    runSectors: [
      { name: "Act I - Graveyard" },
      { name: "Act I - Bone Reliquary", boss: true },
      { name: "Act II - Ash Chapel" },
      { name: "Act II - Iron Crown", boss: true },
    ],
    stageNodesBySector: [
      [
        { id: "s1_n1_enemy", type: "enemy", label: "Enemy" },
        { id: "s1_n2_chest", type: "chest", label: "Chest" },
      ],
      [{ id: "s2_n1_enemy", type: "enemy", label: "Enemy" }],
      [
        { id: "s3_n1_enemy", type: "enemy", label: "Enemy" },
        { id: "s3_n2_shrine", type: "shrine", label: "Shrine" },
      ],
      [{ id: "s4_n1_enemy", type: "enemy", label: "Enemy" }],
    ],
  };
}

test("quest system exposes catalog, state, and completion APIs", () => {
  const api = loadQuestSystemModule();
  assert.equal(typeof api?.cloneQuestCatalog, "function");
  assert.equal(typeof api?.createDefaultQuestState, "function");
  assert.equal(typeof api?.sanitizeQuestState, "function");
  assert.equal(typeof api?.getQuestProgressEntries, "function");
  assert.equal(typeof api?.resolveQuestCompletions, "function");
});

test("sanitizeQuestState generates deterministic route contracts with unique reward types", () => {
  const api = loadQuestSystemModule();
  const questCatalog = api.cloneQuestCatalog();
  const route = createRouteFixture();

  const first = api.sanitizeQuestState({
    questCatalog,
    rawState: {},
    runSeed: 77,
    runSectors: route.runSectors,
    stageNodesBySector: route.stageNodesBySector,
  });
  const second = api.sanitizeQuestState({
    questCatalog,
    rawState: {},
    runSeed: 77,
    runSectors: route.runSectors,
    stageNodesBySector: route.stageNodesBySector,
  });

  assert.deepEqual(first, second);
  assert.equal(first.activeQuests.length, 3);
  assert.deepEqual(new Set(first.activeQuests.map((quest) => quest.kind)), new Set(["chest_cache", "shrine_attunement", "boss_bounty"]));

  const chestQuest = first.activeQuests.find((quest) => quest.kind === "chest_cache");
  const shrineQuest = first.activeQuests.find((quest) => quest.kind === "shrine_attunement");
  const bossQuest = first.activeQuests.find((quest) => quest.kind === "boss_bounty");

  assert.ok(chestQuest.description.includes("Act I - Graveyard"));
  assert.ok(["blackroad_glaive", "reliquary_heart"].includes(chestQuest.rewards.gearId));
  assert.equal(shrineQuest.rewards.statPoints, 2);
  assert.equal(bossQuest.rewards.skillPoints, 1);
});

test("resolveQuestCompletions grants gear, stat points, and skill points on matching map events", () => {
  const api = loadQuestSystemModule();
  const questCatalog = api.cloneQuestCatalog();
  const route = createRouteFixture();
  const state = api.sanitizeQuestState({
    questCatalog,
    rawState: {},
    runSeed: 91,
    runSectors: route.runSectors,
    stageNodesBySector: route.stageNodesBySector,
  });

  const chestQuest = state.activeQuests.find((quest) => quest.kind === "chest_cache");
  const shrineQuest = state.activeQuests.find((quest) => quest.kind === "shrine_attunement");
  const bossQuest = state.activeQuests.find((quest) => quest.kind === "boss_bounty");
  const awardedGearIds = [];
  const game = {
    gold: 0,
    healingPotions: 0,
    itemUpgradeTokens: 0,
    sectorIndex: chestQuest.target.sectorIndex,
    sectorDamageTakenStart: 0,
    player: {
      hull: 8,
      maxHull: 10,
      heat: shrineQuest.objective.heatLimit,
    },
    classState: {
      statPoints: 0,
      skillPoints: 0,
    },
    runStats: {
      damageTaken: 0,
    },
  };

  const chestResult = api.resolveQuestCompletions({
    questCatalog,
    questState: state,
    game,
    context: {
      type: "stage_node",
      node: {
        id: chestQuest.target.nodeId,
        type: chestQuest.target.nodeType,
      },
      sectorIndex: chestQuest.target.sectorIndex,
      damageTakenThisSector: 0,
    },
    applyGearReward: (gearId) => {
      awardedGearIds.push(gearId);
      return {
        gear: {
          id: gearId,
        },
      };
    },
  });

  assert.deepEqual(awardedGearIds, [chestQuest.rewards.gearId]);
  assert.deepEqual(Array.from(chestResult.newlyCompletedQuests.map((quest) => quest.id)), [chestQuest.id]);

  game.sectorIndex = shrineQuest.target.sectorIndex;
  game.player.heat = shrineQuest.objective.heatLimit;

  const shrineResult = api.resolveQuestCompletions({
    questCatalog,
    questState: chestResult.state,
    game,
    context: {
      type: "stage_node",
      node: {
        id: shrineQuest.target.nodeId,
        type: shrineQuest.target.nodeType,
      },
      sectorIndex: shrineQuest.target.sectorIndex,
      currentHeat: shrineQuest.objective.heatLimit,
    },
  });

  assert.deepEqual(Array.from(shrineResult.newlyCompletedQuests.map((quest) => quest.id)), [shrineQuest.id]);
  assert.equal(game.classState.statPoints, 2);

  game.sectorIndex = bossQuest.target.sectorIndex;
  game.runStats.damageTaken = bossQuest.objective.damageLimit;

  const bossResult = api.resolveQuestCompletions({
    questCatalog,
    questState: shrineResult.state,
    game,
    context: {
      type: "sector_cleared",
      sectorIndex: bossQuest.target.sectorIndex,
      sector: {
        boss: true,
      },
      damageTakenThisSector: bossQuest.objective.damageLimit,
    },
  });

  assert.deepEqual(Array.from(bossResult.newlyCompletedQuests.map((quest) => quest.id)), [bossQuest.id]);
  assert.equal(game.classState.skillPoints, 1);
  assert.deepEqual(new Set(bossResult.state.completedQuestIds), new Set(state.activeQuestIds));
});

test("resolveQuestCompletions marks a quest missed when the map challenge is failed", () => {
  const api = loadQuestSystemModule();
  const questCatalog = api.cloneQuestCatalog();
  const route = createRouteFixture();
  const state = api.sanitizeQuestState({
    questCatalog,
    rawState: {},
    runSeed: 22,
    runSectors: route.runSectors,
    stageNodesBySector: route.stageNodesBySector,
  });
  const shrineQuest = state.activeQuests.find((quest) => quest.kind === "shrine_attunement");
  const game = {
    sectorIndex: shrineQuest.target.sectorIndex,
    sectorDamageTakenStart: 0,
    player: {
      heat: shrineQuest.objective.heatLimit + 5,
    },
    classState: {
      statPoints: 0,
      skillPoints: 0,
    },
    runStats: {
      damageTaken: 0,
    },
  };

  const result = api.resolveQuestCompletions({
    questCatalog,
    questState: state,
    game,
    context: {
      type: "stage_node",
      node: {
        id: shrineQuest.target.nodeId,
        type: shrineQuest.target.nodeType,
      },
      sectorIndex: shrineQuest.target.sectorIndex,
      currentHeat: shrineQuest.objective.heatLimit + 5,
    },
  });

  assert.deepEqual(Array.from(result.newlyFailedQuests.map((quest) => quest.id)), [shrineQuest.id]);
  assert.deepEqual(Array.from(result.state.failedQuestIds), [shrineQuest.id]);
  assert.equal(game.classState.statPoints, 0);

  const entries = api.getQuestProgressEntries({
    questCatalog,
    questState: result.state,
    game,
  });
  const entry = entries.find((item) => item.id === shrineQuest.id);
  assert.equal(entry.failed, true);
  assert.equal(entry.statusLabel, "Missed");
  assert.ok(entry.locationLabel.includes("Ash Chapel"));
});
