const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadForecastModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "forecast.js"), "utf8");
  new vm.Script(source, { filename: "forecast.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_FORECAST;
}

test("createForecastUiState recommends shifting when current lane is lethal", () => {
  const forecast = loadForecastModule();

  const state = forecast.createForecastUiState({
    phase: "encounter",
      combatSubphase: "player_turn",
    trackLanes: 3,
    player: {
      lane: 1,
      movedThisTurn: false,
      energy: 1,
      hull: 5,
      block: 0,
      heat: 20,
    },
    telegraphs: [
      {
        id: "tg_1",
        type: "sweep",
        turnsLeft: 1,
        damage: 6,
        lanes: [1],
        cookTier: "fast",
      },
    ],
    enemies: [],
    telegraphAffectsLane: (telegraph, lane) =>
      telegraph?.type === "sweep" && Array.isArray(telegraph?.lanes) && telegraph.lanes.includes(lane),
    getTelegraphCoverageLanes: (telegraph) =>
      telegraph?.type === "sweep" ? [...(Array.isArray(telegraph?.lanes) ? telegraph.lanes : [])] : [],
    getLockedAimLane: () => null,
    getAimedShotDamage: () => 0,
    clampLane: (lane) => Math.max(0, Math.min(2, lane)),
  });

  assert.deepEqual(Array.from(state.forecast.laneDamage), [0, 6, 0]);
  assert.equal(state.projection.currentTotalLoss, 5);
  assert.equal(state.projection.bestReachableTotalLoss, 0);
  assert.equal(state.projection.canEscapeCurrentLethal, true);
  assert.equal(state.advice.code, "shift_to_live");
  assert.equal(state.recommendedAction, "shift_left");
  assert.equal(state.endTurnLockedByLethal, true);
});

test("createForecastUiState does not recommend end turn outside player phase", () => {
  const forecast = loadForecastModule();

  const state = forecast.createForecastUiState({
    phase: "encounter",
      combatSubphase: "enemy_resolve",
    trackLanes: 3,
    player: {
      lane: 1,
      movedThisTurn: false,
      energy: 3,
      hull: 10,
      block: 0,
      heat: 20,
    },
    telegraphs: [],
    enemies: [],
    telegraphAffectsLane: () => false,
    getTelegraphCoverageLanes: () => [],
    getLockedAimLane: () => null,
    getAimedShotDamage: () => 0,
    clampLane: (lane) => Math.max(0, Math.min(2, lane)),
  });

  assert.deepEqual(Array.from(state.forecast.laneDamage), [0, 0, 0]);
  assert.equal(state.projection.currentTotalLoss, 0);
  assert.equal(state.advice.code, "safe_end_turn");
  assert.equal(state.recommendedAction, null);
  assert.equal(state.endTurnLockedByLethal, false);
  assert.equal(state.shiftCapability.canShiftNow, false);
});
