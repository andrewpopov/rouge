const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadEncounterModifiersModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "encounter-modifiers.js"), "utf8");
  new vm.Script(source, { filename: "encounter-modifiers.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_ENCOUNTER_MODIFIERS;
}

test("encounter modifiers module exposes required APIs", () => {
  const api = loadEncounterModifiersModule();
  assert.equal(typeof api?.buildEncounterModifierCatalog, "function");
  assert.equal(typeof api?.getRandomEncounterModifier, "function");
  assert.equal(typeof api?.applyEncounterModifier, "function");
});

test("encounter modifier catalog supports overrides and disable flags", () => {
  const api = loadEncounterModifiersModule();
  const disabledByDefault = api.buildEncounterModifierCatalog({});
  assert.equal(Object.keys(disabledByDefault).length, 0);

  const catalog = api.buildEncounterModifierCatalog({
    modifierConfig: {
      fortified_patrol: {
        enabled: true,
        value: 7,
        title: "Steel Column",
      },
      pressure_front: {
        enabled: true,
      },
      steam_surge: {
        enabled: false,
      },
    },
  });

  assert.equal(catalog.fortified_patrol.value, 7);
  assert.equal(catalog.fortified_patrol.title, "Steel Column");
  assert.equal(Boolean(catalog.steam_surge), false);
  assert.equal(Boolean(catalog.pressure_front), true);
});

test("random encounter modifier selection excludes disallowed boss modifiers", () => {
  const api = loadEncounterModifiersModule();
  const catalog = api.buildEncounterModifierCatalog({
    modifierConfig: {
      fortified_patrol: { enabled: true },
      pressure_front: { enabled: true },
      steam_surge: { enabled: true },
    },
  });

  const normalSectorModifier = api.getRandomEncounterModifier({
    sector: { name: "Normal" },
    modifierCatalog: catalog,
    randomInt: () => 0,
  });
  assert.equal(normalSectorModifier.id, "fortified_patrol");

  const bossSectorModifier = api.getRandomEncounterModifier({
    sector: { name: "Boss", boss: true },
    modifierCatalog: catalog,
    randomInt: () => 0,
  });
  assert.notEqual(bossSectorModifier.id, "fortified_patrol");
});

test("applyEncounterModifier mutates game state based on effect", () => {
  const api = loadEncounterModifiersModule();
  const game = {
    player: {
      heat: 30,
      energy: 3,
    },
    enemies: [
      { alive: true, block: 1 },
      { alive: true, block: 0 },
      { alive: false, block: 2 },
    ],
  };

  const enemyMessage = api.applyEncounterModifier({
    game,
    modifier: {
      id: "fortified_patrol",
      title: "Fortified Patrol",
      effect: "enemy_block",
      value: 4,
    },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    maxHeat: 120,
  });
  assert.equal(enemyMessage.includes("Fortified Patrol"), true);
  assert.deepEqual(game.enemies.map((enemy) => enemy.block), [5, 4, 2]);

  api.applyEncounterModifier({
    game,
    modifier: {
      id: "pressure_front",
      title: "Pressure Front",
      effect: "player_heat",
      value: 12,
    },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    maxHeat: 35,
  });
  assert.equal(game.player.heat, 35);

  api.applyEncounterModifier({
    game,
    modifier: {
      id: "steam_surge",
      title: "Steam Surge",
      effect: "player_energy",
      value: 2,
    },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    maxHeat: 120,
  });
  assert.equal(game.player.energy, 5);
});
