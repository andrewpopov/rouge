const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadNamespace(fileName, namespaceName) {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, fileName), "utf8");
  new vm.Script(source, { filename: fileName }).runInContext(sandbox);
  return sandbox.window[namespaceName];
}

test("enemy catalog builder applies tuning callbacks with fallback defaults", () => {
  const enemyCatalog = loadNamespace("enemy-catalog.js", "BRASSLINE_ENEMY_CATALOG");
  assert.equal(typeof enemyCatalog?.createEnemyBlueprints, "function");

  const blueprints = enemyCatalog.createEnemyBlueprints({
    enemyTune: (enemyId, key, fallback) => {
      if (enemyId === "rail_hound" && key === "maxHp") {
        return 41;
      }
      if (enemyId === "rail_sentry" && key === "startIntentIndex") {
        return 1;
      }
      return fallback;
    },
    enemyIntentTune: (enemyId, intentIndex, key, fallback) => {
      if (enemyId === "rail_hound" && intentIndex === 0 && key === "value") {
        return 9;
      }
      return fallback;
    },
  });

  assert.equal(blueprints.rail_hound.maxHp, 41);
  assert.equal(blueprints.rail_hound.intents[0].value, 9);
  assert.equal(blueprints.ash_gunner.maxHp, 25);
  assert.equal(blueprints.rail_sentry.startIntentIndex, 1);
});

test("card catalog builder applies tuned values in runtime card behavior", () => {
  const cardCatalog = loadNamespace("card-catalog.js", "BRASSLINE_CARD_CATALOG");
  assert.equal(typeof cardCatalog?.createCardCatalog, "function");

  const catalog = cardCatalog.createCardCatalog({
    cardTune: (cardId, key, fallback) => {
      if (cardId === "spark_lance" && key === "baseDamage") {
        return 99;
      }
      if (cardId === "spark_lance" && key === "heatGain") {
        return 0;
      }
      if (cardId === "spark_lance" && key === "cost") {
        return 0;
      }
      return fallback;
    },
  });

  const enemy = {
    name: "Test Drone",
    hp: 120,
  };
  const game = {
    player: {
      heat: 10,
    },
  };

  let lastDamage = 0;
  const ctx = {
    game,
    target: enemy,
    gainHeat: (amount) => {
      game.player.heat += amount;
    },
    consumeAttackMultiplier: (base) => base,
    damageEnemy: (_target, damage) => {
      lastDamage = damage;
      enemy.hp -= damage;
      return damage;
    },
    log: () => {},
  };

  catalog.spark_lance.play(ctx);

  assert.equal(catalog.spark_lance.cost, 0);
  assert.equal(lastDamage, 99);
  assert.equal(enemy.hp, 21);
  assert.equal(game.player.heat, 10);
});
