const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadTuningReadersModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "tuning-readers.js"), "utf8");
  new vm.Script(source, { filename: "tuning-readers.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_TUNING_READERS;
}

test("tuning readers expose safe fallback coercion behavior", () => {
  const api = loadTuningReadersModule();
  assert.equal(typeof api?.getTuningValue, "function");

  assert.equal(api.getTuningValue({}, "missing", 12), 12);
  assert.equal(api.getTuningValue({ val: "bad" }, "val", 7), 7);
  assert.equal(api.getTuningValue({ val: 3 }, "val", 7), 3);
  assert.equal(api.getTuningValue({ val: 3 }, "val", "fallback"), "fallback");
  assert.equal(api.getTuningValue({ val: "ok" }, "val", "fallback"), "ok");
  assert.equal(api.getTuningValue({ val: true }, "val", false), true);
  assert.equal(api.getTuningValue({ val: "nope" }, "val", false), false);
});

test("created tuning readers resolve enemy/card/upgrade lookups", () => {
  const api = loadTuningReadersModule();
  assert.equal(typeof api?.createTuningReaders, "function");

  const readers = api.createTuningReaders({
    enemyTuning: {
      rail_hound: {
        maxHp: 41,
        intents: [{ value: 9, hits: 2 }],
      },
    },
    cardTuning: {
      spark_lance: {
        cost: 0,
      },
    },
    upgradePathTuning: {
      condenser_bank: {
        maxLevel: 4,
      },
    },
  });

  assert.equal(readers.enemyTune("rail_hound", "maxHp", 30), 41);
  assert.equal(readers.enemyIntentTune("rail_hound", 0, "value", 6), 9);
  assert.equal(readers.enemyIntentTune("rail_hound", 1, "value", 6), 6);
  assert.equal(readers.cardTune("spark_lance", "cost", 2), 0);
  assert.equal(readers.cardTune("missing", "cost", 2), 2);
  assert.equal(readers.upgradePathTune("condenser_bank", "maxLevel", 3), 4);
  assert.equal(readers.upgradePathTune("missing", "maxLevel", 3), 3);
});
