const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadEngineCore() {
  const sandbox = {
    window: {},
    console,
    Date,
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "engine-core.js"), "utf8");
  new vm.Script(source, { filename: "engine-core.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_ENGINE_CORE;
}

test("phase controller validates transitions and tracks history", () => {
  const engineCore = loadEngineCore();
  assert.equal(typeof engineCore?.createPhaseController, "function");

  const phase = engineCore.createPhaseController({
    initialPhase: "encounter",
    transitions: {
      encounter: ["reward"],
      reward: ["encounter"],
    },
  });

  assert.equal(phase.getPhase(), "encounter");
  const invalid = phase.setPhase("world_map", { reason: "bad" });
  assert.equal(invalid.ok, false);
  assert.equal(phase.getPhase(), "encounter");

  const rewardTransition = phase.setPhase("reward", { reason: "sector_cleared" });
  assert.equal(rewardTransition.ok, true);
  assert.equal(phase.getPhase(), "reward");

  const worldMapTransition = phase.setPhase("world_map", { force: true, reason: "forced" });
  assert.equal(worldMapTransition.ok, true);
  assert.equal(phase.getPhase(), "world_map");

  const history = phase.getHistory();
  assert.equal(history.length, 2);
  assert.equal(history[0].from, "encounter");
  assert.equal(history[0].to, "reward");
  assert.equal(history[1].to, "world_map");
});

test("action loop dispatches actions in order", () => {
  const engineCore = loadEngineCore();
  assert.equal(typeof engineCore?.createActionLoop, "function");

  const calls = [];
  const loop = engineCore.createActionLoop();

  loop.dispatch("a", () => {
    calls.push("a");
    loop.dispatch("b", () => {
      calls.push("b");
    });
  });

  assert.deepEqual(calls, ["a", "b"]);
  const stats = loop.getStats();
  assert.equal(stats.pending, 0);
  assert.equal(stats.processed, 2);
});

test("game engine syncs phase to game state and emits diagnostics", () => {
  const engineCore = loadEngineCore();
  assert.equal(typeof engineCore?.createGameEngine, "function");

  const game = {
    phase: "encounter",
    combatSubphase: "player_turn",
    turn: 1,
  };
  const renders = [];
  const transitions = [];

  const engine = engineCore.createGameEngine({
    game,
    onRender: (payload) => {
      renders.push(payload.reason);
    },
    onTransition: (entry) => {
      transitions.push(`${entry.from}->${entry.to}`);
    },
  });

  const result = engine.transition("reward", "sector_cleared");
  assert.equal(result.ok, true);
  assert.equal(game.phase, "reward");
  assert.equal(engine.getPhase(), "reward");

  let marker = 0;
  engine.dispatch("increment", () => {
    marker += 1;
  });
  assert.equal(marker, 1);

  const diagnostics = engine.getDiagnostics();
  assert.equal(diagnostics.phase, "reward");
  assert.ok(diagnostics.actionLoop.processed >= 1);
  assert.ok(diagnostics.renderLoop.renderCount >= 2);
  assert.ok(transitions.includes("encounter->reward"));
  assert.ok(renders.some((reason) => reason.includes("phase:reward")));
});
