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
