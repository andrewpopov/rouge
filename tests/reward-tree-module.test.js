const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const REWARD_TREE_PATH = path.resolve(__dirname, "..", "reward-tree.js");

function loadRewardTree() {
  const source = fs.readFileSync(REWARD_TREE_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(source, { filename: REWARD_TREE_PATH }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_REWARD_TREE;
}

test("applyObjectiveProgress unlocks root node when requirements are met", () => {
  const rewardTree = loadRewardTree();
  const catalog = rewardTree.cloneRewardTreeCatalog();
  const state = rewardTree.createDefaultRewardTreeState();

  const result = rewardTree.applyObjectiveProgress({
    rewardTreeCatalog: catalog,
    state,
    delta: { sectorsCleared: 1 },
  });

  assert.ok(result.state.unlockedNodeIds.includes("ashmarked_resolve"));
  assert.ok(result.newlyUnlockedNodes.some((node) => node.id === "ashmarked_resolve"));
});

test("applyObjectiveProgress respects prereqs and chained unlocks", () => {
  const rewardTree = loadRewardTree();
  const catalog = rewardTree.cloneRewardTreeCatalog();
  let state = rewardTree.createDefaultRewardTreeState();

  let result = rewardTree.applyObjectiveProgress({
    rewardTreeCatalog: catalog,
    state,
    delta: { sectorsCleared: 1 },
  });
  state = result.state;
  assert.ok(state.unlockedNodeIds.includes("ashmarked_resolve"));
  assert.ok(!state.unlockedNodeIds.includes("hunter_ward"));

  result = rewardTree.applyObjectiveProgress({
    rewardTreeCatalog: catalog,
    state,
    delta: { flawlessClears: 1 },
  });
  state = result.state;
  assert.ok(state.unlockedNodeIds.includes("hunter_ward"));
});

test("getRewardTreeBonus sums unlocked node effects", () => {
  const rewardTree = loadRewardTree();
  const catalog = rewardTree.cloneRewardTreeCatalog();
  const state = {
    objectives: {
      sectorsCleared: 5,
      bossKills: 0,
      flawlessClears: 0,
      speedClears: 0,
    },
    unlockedNodeIds: ["ashmarked_resolve"],
  };

  const bonus = rewardTree.getRewardTreeBonus({
    rewardTreeCatalog: catalog,
    state,
    effectId: "max_hull_bonus",
  });
  assert.equal(bonus, 4);
});
