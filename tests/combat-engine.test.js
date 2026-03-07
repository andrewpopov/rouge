const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadBrowserScript(filename, sandbox) {
  const fullPath = path.join(ROOT, filename);
  const source = fs.readFileSync(fullPath, "utf8");
  new vm.Script(source, { filename: fullPath }).runInContext(sandbox);
}

function createHarness() {
  const sandbox = {
    window: {},
    console,
    Math,
  };
  vm.createContext(sandbox);
  loadBrowserScript("content.js", sandbox);
  loadBrowserScript("combat-engine.js", sandbox);
  return {
    content: sandbox.window.ROUGE_GAME_CONTENT,
    engine: sandbox.window.ROUGE_COMBAT_ENGINE,
  };
}

test("createCombatState builds hero, mercenary, and encounter pack", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  assert.equal(state.hero.name, "Wanderer");
  assert.equal(state.mercenary.name, "Rogue Scout");
  assert.equal(state.enemies.length, 3);
  assert.equal(state.turn, 1);
  assert.equal(state.phase, "player");
  assert.equal(state.hand.length, state.hero.handSize);
});

test("playCard spends energy and damages the selected enemy", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.hand = [{ instanceId: "card_test", cardId: "quick_slash" }];
  state.hero.energy = 3;

  const result = engine.playCard(state, content, "card_test", target.id);

  assert.equal(result.ok, true);
  assert.equal(state.hero.energy, 2);
  assert.equal(target.life, target.maxLife - 7);
  assert.equal(state.discardPile.length, 1);
});

test("endTurn triggers the mercenary before enemies resolve", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "catacombs_gate",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.mercenary.nextAttackBonus = 3;
  state.selectedEnemyId = target.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(target.life <= target.maxLife - 8);
  assert.equal(state.phase, "player");
  assert.equal(state.turn, 2);
});

test("usePotion heals the mercenary and consumes a charge", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  state.mercenary.life = 20;
  state.potions = 2;

  const result = engine.usePotion(state, "mercenary");

  assert.equal(result.ok, true);
  assert.equal(state.potions, 1);
  assert.equal(state.mercenary.life, 32);
});
