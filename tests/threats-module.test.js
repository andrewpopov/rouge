const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadThreatsModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "threats.js"), "utf8");
  new vm.Script(source, { filename: "threats.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_THREATS;
}

function parseLaneData(raw) {
  return String(raw || "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 0);
}

function createFakeItem({ lanes = "", highlightKey = "", text = "row" } = {}) {
  const listeners = {};
  return {
    dataset: {
      lanes,
      highlightKey,
    },
    textContent: text,
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    trigger(type) {
      const handler = listeners[type];
      if (typeof handler !== "function") {
        return;
      }
      handler({
        preventDefault() {},
        stopPropagation() {},
      });
    },
  };
}

test("createLaneHighlightController manages set/clear/toggle transitions", () => {
  const threats = loadThreatsModule();
  const game = {
    highlightLanes: [],
    highlightLockKey: null,
  };
  let renderCalls = 0;

  const controller = threats.createLaneHighlightController({
    game,
    parseLaneDataFn: parseLaneData,
    renderTrackMapFn: () => {
      renderCalls += 1;
    },
  });

  controller.setLaneHighlight([1, 1, 2], "lock_a");
  assert.deepEqual(Array.from(game.highlightLanes), [1, 2]);
  assert.equal(game.highlightLockKey, "lock_a");
  assert.equal(renderCalls, 1);

  controller.clearLaneHighlight(false);
  assert.deepEqual(Array.from(game.highlightLanes), [1, 2]);
  assert.equal(game.highlightLockKey, "lock_a");
  assert.equal(renderCalls, 1);

  controller.clearLaneHighlight(true);
  assert.deepEqual(Array.from(game.highlightLanes), []);
  assert.equal(game.highlightLockKey, null);
  assert.equal(renderCalls, 2);

  controller.toggleLockedHighlight("lock_b", [3]);
  assert.deepEqual(Array.from(game.highlightLanes), [3]);
  assert.equal(game.highlightLockKey, "lock_b");
  assert.equal(renderCalls, 3);

  controller.toggleLockedHighlight("lock_b", [3]);
  assert.deepEqual(Array.from(game.highlightLanes), []);
  assert.equal(game.highlightLockKey, null);
  assert.equal(renderCalls, 4);
});

test("bindLaneHighlightInteractions applies hover + lock behavior for lane-linked rows", () => {
  const threats = loadThreatsModule();
  const game = {
    highlightLanes: [],
    highlightLockKey: null,
  };

  const controller = threats.createLaneHighlightController({
    game,
    parseLaneDataFn: parseLaneData,
    renderTrackMapFn: () => {},
  });

  const item = createFakeItem({
    lanes: "0,2",
    highlightKey: "lock_row",
    text: "Threat Link",
  });

  controller.bindLaneHighlightInteractions([item], "enemy_tooltip");

  item.trigger("pointerenter");
  assert.deepEqual(Array.from(game.highlightLanes), [0, 2]);
  assert.equal(game.highlightLockKey, null);

  item.trigger("click");
  assert.deepEqual(Array.from(game.highlightLanes), [0, 2]);
  assert.equal(game.highlightLockKey, "lock_row");

  item.trigger("pointerleave");
  assert.deepEqual(Array.from(game.highlightLanes), [0, 2]);
  assert.equal(game.highlightLockKey, "lock_row");

  item.trigger("click");
  assert.deepEqual(Array.from(game.highlightLanes), []);
  assert.equal(game.highlightLockKey, null);
});
