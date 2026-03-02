const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const INDEX_PATH = path.resolve(__dirname, "..", "index.html");

function getScriptOrder() {
  const html = fs.readFileSync(INDEX_PATH, "utf8");
  const srcs = [];
  const regex = /<script\s+src="([^"]+)"><\/script>/g;
  let match;
  while ((match = regex.exec(html))) {
    srcs.push(match[1]);
  }
  return srcs;
}

test("index loads required runtime modules before main.js", () => {
  const scripts = getScriptOrder();
  const mainIndex = scripts.indexOf("./main.js");
  assert.ok(mainIndex >= 0, "index.html must include ./main.js");

  const requiredBeforeMain = [
    "./utils.js",
    "./runtime-utils.js",
    "./persistence.js",
    "./progression.js",
    "./progression-content.js",
    "./tuning-readers.js",
    "./encounter-modifiers.js",
    "./enemy-catalog.js",
    "./card-catalog.js",
    "./forecast.js",
    "./threats.js",
    "./enemy-phase.js",
    "./combat-core.js",
    "./player-actions.js",
    "./run-flow.js",
    "./meta-progression.js",
    "./game-state.js",
    "./hud-state.js",
    "./enemy-ui.js",
    "./controls-ui.js",
    "./run-snapshot.js",
    "./run-ui.js",
  ];

  requiredBeforeMain.forEach((script) => {
    const idx = scripts.indexOf(script);
    assert.ok(idx >= 0, `index.html must include ${script}`);
    assert.ok(idx < mainIndex, `${script} must load before ./main.js`);
  });
});
