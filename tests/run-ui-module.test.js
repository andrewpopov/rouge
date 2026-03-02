const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadRunUiModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "run-ui.js"), "utf8");
  new vm.Script(source, { filename: "run-ui.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_RUN_UI;
}

test("toggleRunTimelineView toggles state and requests rerender", () => {
  const runUi = loadRunUiModule();
  const game = {
    showFullTimeline: false,
  };
  let renderCalls = 0;

  const first = runUi.toggleRunTimelineView({
    game,
    renderRunSummaryPanelFn: () => {
      renderCalls += 1;
    },
  });

  assert.equal(first, true);
  assert.equal(game.showFullTimeline, true);
  assert.equal(renderCalls, 1);

  runUi.toggleRunTimelineView({
    game,
    renderRunSummaryPanelFn: () => {
      renderCalls += 1;
    },
  });

  assert.equal(game.showFullTimeline, false);
  assert.equal(renderCalls, 2);
});

test("toggleRunTimelineView safely handles invalid game input", () => {
  const runUi = loadRunUiModule();
  const result = runUi.toggleRunTimelineView({
    game: null,
    renderRunSummaryPanelFn: () => {
      throw new Error("should not render");
    },
  });
  assert.equal(result, false);
});
