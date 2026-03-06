const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadEnemyPhase() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "enemy-phase.js"), "utf8");
  new vm.Script(source, { filename: "enemy-phase.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_ENEMY_PHASE;
}

function makeResolverDeps() {
  return {
    playerLane: 2,
    getPlayerHull: () => 100,
    getAimedShotDamage: () => 0,
    getLockedAimLane: () => null,
    damagePlayer: () => 0,
    gainHeat: () => {},
    queueTelegraph: () => {},
    clampLane: (lane) => lane,
    randomInt: () => 1,
    normalizeCookTier: (tier) => tier || "medium",
    getCookTurns: () => 2,
    makeSweepLanes: () => ({ lanes: [1, 2], direction: "right" }),
    cookTierLabel: {
      fast: "FAST",
      medium: "MED",
      slow: "SLOW",
    },
  };
}

test("resurrect intent revives matching fallen allies with partial health", () => {
  const enemyPhase = loadEnemyPhase();
  assert.equal(typeof enemyPhase?.resolveEnemyIntent, "function");

  const shaman = {
    id: "enemy_shaman",
    key: "fallen_shaman",
    name: "Fallen Shaman",
    alive: true,
    intent: {
      kind: "resurrect",
      value: 1,
      healPercent: 50,
      targetKey: "fallen",
      label: "Resurrect",
    },
  };
  const fallen = {
    id: "enemy_fallen",
    key: "fallen",
    name: "Fallen",
    alive: false,
    maxHp: 24,
    hp: 0,
    block: 3,
    aimed: true,
    aimedLane: 1,
    intent: { kind: "attack", value: 3, hits: 1 },
  };
  const zombie = {
    id: "enemy_zombie",
    key: "zombie",
    name: "Zombie",
    alive: false,
    maxHp: 32,
    hp: 0,
    block: 0,
    aimed: false,
    aimedLane: null,
    intent: null,
  };

  const message = enemyPhase.resolveEnemyIntent({
    enemy: shaman,
    enemies: [shaman, fallen, zombie],
    ...makeResolverDeps(),
  });

  assert.match(message, /resurrected 1 ally/i);
  assert.equal(fallen.alive, true);
  assert.equal(fallen.hp, 12);
  assert.equal(fallen.block, 0);
  assert.equal(fallen.aimed, false);
  assert.equal(fallen.aimedLane, null);
  assert.equal(fallen.intent, null);
  assert.equal(zombie.alive, false);
});

test("resurrect intent reports no target when no valid corpse exists", () => {
  const enemyPhase = loadEnemyPhase();

  const shaman = {
    id: "enemy_shaman",
    key: "fallen_shaman",
    name: "Fallen Shaman",
    alive: true,
    intent: {
      kind: "resurrect",
      value: 2,
      targetKey: "fallen",
      label: "Resurrect",
    },
  };
  const ally = {
    id: "enemy_fallen",
    key: "fallen",
    name: "Fallen",
    alive: true,
    maxHp: 24,
    hp: 24,
    block: 0,
    aimed: false,
    aimedLane: null,
    intent: null,
  };

  const message = enemyPhase.resolveEnemyIntent({
    enemy: shaman,
    enemies: [shaman, ally],
    ...makeResolverDeps(),
  });

  assert.match(message, /no corpses answered/i);
  assert.equal(ally.alive, true);
  assert.equal(ally.hp, 24);
});
