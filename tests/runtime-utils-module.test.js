const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadRuntimeUtilsModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "runtime-utils.js"), "utf8");
  new vm.Script(source, { filename: "runtime-utils.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_RUNTIME_UTILS;
}

test("runtime utils module exposes createRuntimeUtils", () => {
  const api = loadRuntimeUtilsModule();
  assert.equal(typeof api?.createRuntimeUtils, "function");
});

test("runtime utils module provides safe fallbacks", () => {
  const api = loadRuntimeUtilsModule();
  const resolved = api.createRuntimeUtils({ utils: {}, trackLanes: 5 });

  assert.equal(resolved.clamp(12, 0, 10), 10);
  assert.equal(resolved.clamp(-3, 0, 10), 0);

  const list = [1, 2, 3, 4, 5];
  resolved.shuffleInPlace(list);
  assert.equal(list.length, 5);
  assert.deepEqual([...list].sort((a, b) => a - b), [1, 2, 3, 4, 5]);

  assert.equal(resolved.escapeHtml("<&\"'>"), "&lt;&amp;&quot;&#39;&gt;");
  assert.equal(resolved.formatLaneCoverage([0, 1, 3]), "T1-T2, T4");
  assert.deepEqual(Array.from(resolved.parseLaneData("0, 1, 7, x, 2")), [0, 1, 2]);
  assert.equal(resolved.getTelegraphProgress({ cookTurns: 4, turnsLeft: 2 }), 0.5);
});

test("runtime utils module uses provided utility functions when available", () => {
  const api = loadRuntimeUtilsModule();
  const calls = [];
  const custom = {
    clamp: (value, min, max) => {
      calls.push(["clamp", value, min, max]);
      return max;
    },
    randomInt: (max) => {
      calls.push(["randomInt", max]);
      return 0;
    },
    shuffleInPlace: (list) => {
      calls.push(["shuffleInPlace", list.length]);
      list.reverse();
    },
    escapeHtml: (text) => `escaped:${text}`,
    formatLaneCoverage: (lanes) => `lanes:${lanes.join("|")}`,
    parseLaneData: (raw, laneCount) => {
      calls.push(["parseLaneData", laneCount]);
      return [raw.length];
    },
    getTelegraphProgress: () => 0.25,
  };

  const resolved = api.createRuntimeUtils({ utils: custom, trackLanes: 9 });

  const arr = [1, 2, 3];
  resolved.shuffleInPlace(arr);
  assert.deepEqual(arr, [3, 2, 1]);
  assert.equal(resolved.clamp(3, 0, 1), 1);
  assert.equal(resolved.randomInt(5), 0);
  assert.equal(resolved.escapeHtml("x"), "escaped:x");
  assert.equal(resolved.formatLaneCoverage([0, 2]), "lanes:0|2");
  assert.deepEqual(Array.from(resolved.parseLaneData("abc")), [3]);
  assert.equal(resolved.getTelegraphProgress({}), 0.25);

  assert.ok(calls.some((entry) => entry[0] === "parseLaneData" && entry[1] === 9));
});
