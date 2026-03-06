const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const { launchBrowser, closeBrowser, openGamePage } = require("./helpers/playwright-game");

let browser;

before(async () => {
  browser = await launchBrowser();
});

after(async () => {
  await closeBrowser(browser);
});

async function clearGameStorage(page) {
  await page.evaluate(() => {
    try {
      window.localStorage?.removeItem("brassline_meta_v1");
      window.localStorage?.removeItem("brassline_run_records_v1");
      window.localStorage?.removeItem("brassline_run_snapshot_v1");
      window.localStorage?.removeItem("brassline_onboarding_v1");
    } catch (_error) {
      // Ignore storage cleanup failures in tests.
    }
  });
}

test("reload restores an in-progress run snapshot", { concurrency: false }, async () => {
  const page = await openGamePage(browser, { resetStorage: false });
  try {
    await clearGameStorage(page);

    const expected = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
        enemy.intent = null;
      });
      dbg.checkEndStates();
      dbg.applyRewardAndAdvance(null);

      g.phase = "encounter";
      g.combatSubphase = "player_turn";
      g.turn = 4;
      g.turnCardsPlayed = 2;
      g.runSeed = 24680;
      g.player.hull = Math.max(1, g.player.maxHull - 19);
      g.player.block = 7;
      g.player.heat = 68;
      g.player.energy = 2;
      g.player.lane = 3;
      g.player.movedThisTurn = true;
      g.player.overclockUsed = true;
      g.player.nextAttackMultiplier = 2;
      g.drawPile = [{ cardId: "spark_lance", instanceId: "c_900_spark_lance" }];
      g.discardPile = [{ cardId: "pressure_vent", instanceId: "c_901_pressure_vent" }];
      g.hand = [{ cardId: "rail_cannon", instanceId: "c_902_rail_cannon" }];
      g.exhaustPile = [{ cardId: "overpressure", instanceId: "c_903_overpressure" }];
      g.nextCardInstanceId = 904;

      if (g.enemies[0]) {
        g.enemies[0].hp = Math.max(1, g.enemies[0].hp - 6);
        g.enemies[0].block = 3;
      }
      g.telegraphs = [
        {
          id: "tg_77",
          type: "lob",
          damage: 11,
          cookTurns: 2,
          turnsLeft: 1,
          cookTier: "medium",
          targetLane: 2,
          lanes: [],
          radius: 1,
          direction: null,
          sourceEnemyId: g.enemies[0]?.id ?? null,
        },
      ];
      g.nextTelegraphId = 78;
      g.selectedEnemyId = g.enemies[0]?.id ?? null;
      g.artifacts = ["aegis_booster"];
      g.questState = {
        activeQuestIds: ["graveyard_shift", "black_road_supplies", "crown_bounty"],
        completedQuestIds: ["graveyard_shift"],
      };
      g.upgrades.condenser_bank = 2;
      g.metaBranches = {
        condenser_bank: "condenser_bank_branch_pressure_cells",
        coolant_loop: "",
        hull_plating: "",
        guard_protocol: "",
      };
      dbg.updateHud();

      return {
        phase: g.phase,
        combatSubphase: g.combatSubphase,
        turn: g.turn,
        turnCardsPlayed: g.turnCardsPlayed,
        runSeed: g.runSeed,
        sectorIndex: g.sectorIndex,
        artifacts: Array.isArray(g.artifacts) ? g.artifacts.slice() : [],
        questState: JSON.parse(JSON.stringify(g.questState || {})),
        metaBranches: { ...(g.metaBranches || {}) },
        player: {
          hull: g.player.hull,
          heat: g.player.heat,
          energy: g.player.energy,
          lane: g.player.lane,
          block: g.player.block,
        },
        hand: g.hand.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        drawPile: g.drawPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        discardPile: g.discardPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        exhaustPile: g.exhaustPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        enemyHp: g.enemies.map((enemy) => enemy.hp),
        enemyBlock: g.enemies.map((enemy) => enemy.block),
        telegraphs: g.telegraphs.map((entry) => ({
          id: entry.id,
          type: entry.type,
          damage: entry.damage,
          turnsLeft: entry.turnsLeft,
          targetLane: entry.targetLane,
          radius: entry.radius,
        })),
      };
    });

    await page.reload();
    await page.waitForSelector("#laneThreatForecast");

    const restored = await page.evaluate(() => {
      const g = window.__brasslineDebug.game;
      return {
        phase: g.phase,
        combatSubphase: g.combatSubphase,
        turn: g.turn,
        turnCardsPlayed: g.turnCardsPlayed,
        runSeed: g.runSeed,
        sectorIndex: g.sectorIndex,
        artifacts: Array.isArray(g.artifacts) ? g.artifacts.slice() : [],
        questState: JSON.parse(JSON.stringify(g.questState || {})),
        metaBranches: { ...(g.metaBranches || {}) },
        player: {
          hull: g.player.hull,
          heat: g.player.heat,
          energy: g.player.energy,
          lane: g.player.lane,
          block: g.player.block,
        },
        hand: g.hand.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        drawPile: g.drawPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        discardPile: g.discardPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        exhaustPile: g.exhaustPile.map((entry) => `${entry.instanceId}:${entry.cardId}`),
        enemyHp: g.enemies.map((enemy) => enemy.hp),
        enemyBlock: g.enemies.map((enemy) => enemy.block),
        telegraphs: g.telegraphs.map((entry) => ({
          id: entry.id,
          type: entry.type,
          damage: entry.damage,
          turnsLeft: entry.turnsLeft,
          targetLane: entry.targetLane,
          radius: entry.radius,
        })),
      };
    });

    assert.deepEqual(restored, expected);
  } finally {
    await page.close();
  }
});

test("corrupt snapshot payload falls back to a fresh run", { concurrency: false }, async () => {
  const page = await openGamePage(browser, { resetStorage: false });
  try {
    await clearGameStorage(page);

    await page.evaluate(() => {
      window.localStorage.setItem(
        "brassline_run_snapshot_v1",
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          routeSignature: "invalid-route-signature",
          phase: "encounter",
          combatSubphase: "player_turn",
          turn: 99,
          sectorIndex: 99,
        })
      );
    });

    await page.reload();
    await page.waitForSelector("#laneThreatForecast");

    const state = await page.evaluate(() => {
      const g = window.__brasslineDebug.game;
      let snapshotVersion = null;
      try {
        const parsed = JSON.parse(window.localStorage.getItem("brassline_run_snapshot_v1") || "{}");
        snapshotVersion = parsed.version ?? null;
      } catch (_error) {
        snapshotVersion = null;
      }
      return {
        phase: g.phase,
        combatSubphase: g.combatSubphase,
        turn: g.turn,
        sectorIndex: g.sectorIndex,
        hull: g.player.hull,
        maxHull: g.player.maxHull,
        handCount: g.hand.length,
        snapshotVersion,
      };
    });

    assert.equal(state.phase, "encounter");
    assert.equal(state.combatSubphase, "player_turn");
    assert.equal(state.turn, 1);
    assert.equal(state.sectorIndex, 0);
    assert.equal(state.hull, state.maxHull);
    assert.ok(state.handCount > 0);
    assert.equal(state.snapshotVersion, 1);
  } finally {
    await page.close();
  }
});
