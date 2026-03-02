const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const GAME_STATE_PATH = path.resolve(__dirname, "..", "game-state.js");

function loadGameStateModule() {
  const source = fs.readFileSync(GAME_STATE_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const script = new vm.Script(source, { filename: GAME_STATE_PATH });
  script.runInContext(sandbox);
  return sandbox.window.BRASSLINE_GAME_STATE;
}

test("createInitialGameState builds a full default state payload", () => {
  const gameState = loadGameStateModule();

  const state = gameState.createInitialGameState({
    baseMaxHull: 72,
    baseMaxEnergy: 3,
    playerStartHeat: 35,
    trackLanes: 5,
    createRunSeedFn: () => 42,
    createDefaultUpgradeStateFn: () => ({ condenser_bank: 1 }),
    createDefaultMetaUnlockStateFn: () => ({ condenser_bank: ["cb_t2"] }),
    createDefaultMetaBranchStateFn: () => ({ condenser_bank: "condenser_bank_branch_pressure_cells" }),
    createDefaultRunStatsFn: () => ({ cardsPlayed: 0 }),
    createDefaultRunRecordsFn: () => ({ totalRuns: 0 }),
    createDefaultRecordHighlightsFn: () => ({ bestDamageDealt: false }),
    createDefaultRunTimelineFn: () => [],
  });

  assert.equal(state.phase, "player");
  assert.equal(state.turn, 1);
  assert.equal(state.sectorIndex, 0);
  assert.equal(state.runSeed, 42);
  assert.equal(state.turnCardsPlayed, 0);
  assert.equal(state.encounterModifier, null);
  assert.equal(state.player.hull, 72);
  assert.equal(state.player.maxHull, 72);
  assert.equal(state.player.energy, 3);
  assert.equal(state.player.maxEnergy, 3);
  assert.equal(state.player.lane, 2);
  assert.deepEqual(state.upgrades, { condenser_bank: 1 });
  assert.deepEqual(state.metaUnlocks, { condenser_bank: ["cb_t2"] });
  assert.deepEqual(state.metaBranches, { condenser_bank: "condenser_bank_branch_pressure_cells" });
  assert.deepEqual(state.runStats, { cardsPlayed: 0 });
  assert.deepEqual(state.runRecords, { totalRuns: 0 });
  assert.deepEqual(state.runRecordHighlights, { bestDamageDealt: false });
  assert.deepEqual(Array.from(state.runTimeline), []);
  assert.deepEqual(Array.from(state.artifacts), []);
});

test("applyFreshRunState resets transient run fields without touching meta state", () => {
  const gameState = loadGameStateModule();

  const game = {
    upgrades: { condenser_bank: 2 },
    metaUnlocks: { condenser_bank: ["cb_t2"] },
    runRecords: { totalRuns: 5 },
    phase: "reward",
    turn: 9,
    sectorIndex: 4,
    runSeed: 19,
    turnCardsPlayed: 6,
    player: {
      hull: 1,
      maxHull: 99,
      block: 4,
      heat: 88,
      energy: 0,
      maxEnergy: 6,
      lane: 0,
      movedThisTurn: true,
      nextAttackMultiplier: 4,
      overclockUsed: true,
    },
    enemies: [{ id: "e1" }],
    telegraphs: [{ id: "t1" }],
    drawPile: [{ instanceId: "c1" }],
    discardPile: [{ instanceId: "c2" }],
    hand: [{ instanceId: "c3" }],
    exhaustPile: [{ instanceId: "c4" }],
    selectedEnemyId: "e1",
    openEnemyTooltipId: "e1",
    highlightLanes: [1, 2],
    highlightLockKey: "lock",
    rewardChoices: [{ type: "card", cardId: "spark_lance" }],
    artifacts: ["aegis_booster"],
    interlude: { title: "Depot" },
    interludeDeck: [{ instanceId: "c9" }],
    runStats: { cardsPlayed: 99 },
    runRecordHighlights: { bestDamageDealt: true },
    runTimeline: [{ line: "old entry" }],
    showFullTimeline: true,
    nextCardInstanceId: 50,
    nextTelegraphId: 60,
    metaResetArmedUntil: 123,
    runRecordsResetArmedUntil: 456,
    showOnboarding: false,
    onboardingDismissed: true,
    log: "old",
  };

  gameState.applyFreshRunState({
    game,
    baseMaxHull: 72,
    baseMaxEnergy: 3,
    playerStartHeat: 35,
    trackLanes: 5,
    createRunSeedFn: () => 77,
    createDefaultRunStatsFn: () => ({ cardsPlayed: 0 }),
    createDefaultRecordHighlightsFn: () => ({ bestDamageDealt: false }),
    createDefaultRunTimelineFn: () => [],
  });

  assert.equal(game.phase, "player");
  assert.equal(game.turn, 1);
  assert.equal(game.sectorIndex, 0);
  assert.equal(game.runSeed, 77);
  assert.equal(game.turnCardsPlayed, 0);
  assert.equal(game.encounterModifier, null);
  assert.equal(game.nextCardInstanceId, 1);
  assert.equal(game.nextTelegraphId, 1);
  assert.equal(game.player.hull, 72);
  assert.equal(game.player.energy, 3);
  assert.equal(game.player.lane, 2);
  assert.deepEqual(Array.from(game.enemies), []);
  assert.deepEqual(Array.from(game.telegraphs), []);
  assert.deepEqual(Array.from(game.runTimeline), []);
  assert.deepEqual(Array.from(game.artifacts), []);
  assert.deepEqual(game.runStats, { cardsPlayed: 0 });
  assert.deepEqual(game.runRecordHighlights, { bestDamageDealt: false });
  assert.equal(game.upgrades.condenser_bank, 2);
  assert.deepEqual(game.metaUnlocks, { condenser_bank: ["cb_t2"] });
  assert.equal(game.runRecords.totalRuns, 5);
  assert.equal(game.metaResetArmedUntil, 123);
  assert.equal(game.runRecordsResetArmedUntil, 456);
  assert.equal(game.showOnboarding, false);
  assert.equal(game.onboardingDismissed, true);
});
