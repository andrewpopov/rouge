const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadEnemyUiModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "enemy-ui.js"), "utf8");
  new vm.Script(source, { filename: "enemy-ui.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_ENEMY_UI;
}

test("createEnemyInteractionHandlers toggles tooltip state and triggers rerender", () => {
  const enemyUi = loadEnemyUiModule();
  const state = {
    openEnemyTooltipId: null,
    selectedEnemyId: null,
    clearCalls: 0,
    renderCalls: 0,
  };

  const handlers = enemyUi.createEnemyInteractionHandlers({
    getOpenEnemyTooltipId: () => state.openEnemyTooltipId,
    setOpenEnemyTooltipId: (value) => {
      state.openEnemyTooltipId = value;
    },
    setSelectedEnemyId: (value) => {
      state.selectedEnemyId = value;
    },
    clearLaneHighlightFn: (force) => {
      if (force) {
        state.clearCalls += 1;
      }
    },
    renderEnemiesFn: () => {
      state.renderCalls += 1;
    },
  });

  handlers.onTooltipToggle("enemy_a");
  assert.equal(state.openEnemyTooltipId, "enemy_a");
  assert.equal(state.clearCalls, 1);
  assert.equal(state.renderCalls, 1);

  handlers.onTooltipToggle("enemy_a");
  assert.equal(state.openEnemyTooltipId, null);
  assert.equal(state.clearCalls, 2);
  assert.equal(state.renderCalls, 2);
  assert.equal(state.selectedEnemyId, null);
});

test("createEnemyInteractionHandlers selects enemy and closes open tooltip", () => {
  const enemyUi = loadEnemyUiModule();
  const state = {
    openEnemyTooltipId: "enemy_a",
    selectedEnemyId: null,
    clearCalls: 0,
    renderCalls: 0,
  };

  const handlers = enemyUi.createEnemyInteractionHandlers({
    getOpenEnemyTooltipId: () => state.openEnemyTooltipId,
    setOpenEnemyTooltipId: (value) => {
      state.openEnemyTooltipId = value;
    },
    setSelectedEnemyId: (value) => {
      state.selectedEnemyId = value;
    },
    clearLaneHighlightFn: (force) => {
      if (force) {
        state.clearCalls += 1;
      }
    },
    renderEnemiesFn: () => {
      state.renderCalls += 1;
    },
  });

  handlers.onEnemySelect("enemy_b");

  assert.equal(state.selectedEnemyId, "enemy_b");
  assert.equal(state.openEnemyTooltipId, null);
  assert.equal(state.clearCalls, 1);
  assert.equal(state.renderCalls, 1);
});
