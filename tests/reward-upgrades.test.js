const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const {
  launchBrowser,
  closeBrowser,
  openGamePage,
  getTurn,
  waitForTurnAdvance,
} = require("./helpers/playwright-game");

let browser;

before(async () => {
  browser = await launchBrowser();
});

after(async () => {
  await closeBrowser(browser);
});

test("sector clear reward choices include an upgrade path option", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.updateHud();

      return {
        phase: g.phase,
        hasUpgradeChoice: g.rewardChoices.some((choice) => choice?.type === "upgrade"),
        renderedUpgradeNodes: document.querySelectorAll("#rewardChoices .reward-upgrade").length,
      };
    });

    assert.equal(result.phase, "reward");
    assert.equal(result.hasUpgradeChoice, true);
    assert.ok(result.renderedUpgradeNodes >= 1);
  } finally {
    await page.close();
  }
});

test("maxed upgrade paths stop offering upgrade rewards", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.upgrades.condenser_bank = 3;
      g.upgrades.coolant_loop = 3;
      g.upgrades.hull_plating = 3;
      g.upgrades.guard_protocol = 3;

      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.updateHud();

      return {
        phase: g.phase,
        hasUpgradeChoice: g.rewardChoices.some((choice) => choice?.type === "upgrade"),
        renderedUpgradeNodes: document.querySelectorAll("#rewardChoices .reward-upgrade").length,
        rewardMetaText: document.getElementById("rewardMeta")?.textContent || "",
      };
    });

    assert.equal(result.phase, "reward");
    assert.equal(result.hasUpgradeChoice, false);
    assert.equal(result.renderedUpgradeNodes, 0);
    assert.match(result.rewardMetaText, /12\/12 levels installed/i);
    assert.match(result.rewardMetaText, /all upgrade paths are maxed/i);
  } finally {
    await page.close();
  }
});

test("reward panel meta summary shows path chips and suggested next upgrade", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.upgrades.condenser_bank = 1;
      g.upgrades.guard_protocol = 2;
      g.phase = "reward";
      g.rewardChoices = [{ type: "card", cardId: "spark_lance" }];
      dbg.updateHud();

      return {
        metaText: document.getElementById("rewardMeta")?.textContent || "",
        chipCount: document.querySelectorAll("#rewardMeta .reward-meta-chip").length,
      };
    });

    assert.equal(result.chipCount, 4);
    assert.match(result.metaText, /meta progress/i);
    assert.match(result.metaText, /3\/12 levels installed/i);
    assert.match(result.metaText, /suggested next/i);
    assert.match(result.metaText, /coolant loop/i);
  } finally {
    await page.close();
  }
});

test("suggested upgrade choice is highlighted in reward cards", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;

      g.upgrades.condenser_bank = 2;
      g.upgrades.coolant_loop = 0;
      g.upgrades.hull_plating = 1;
      g.upgrades.guard_protocol = 0;

      g.phase = "reward";
      g.rewardChoices = [
        { type: "upgrade", upgradeId: "guard_protocol" },
        { type: "upgrade", upgradeId: "coolant_loop" },
        { type: "card", cardId: "spark_lance" },
      ];
      dbg.updateHud();

      const suggestedNodes = Array.from(
        document.querySelectorAll("#rewardChoices .reward-upgrade.suggested-upgrade")
      );
      return {
        suggestedCount: suggestedNodes.length,
        suggestedText: suggestedNodes.map((node) => node.textContent || "").join(" "),
        tagCount: document.querySelectorAll("#rewardChoices .reward-upgrade .reward-suggested-tag").length,
      };
    });

    assert.equal(result.suggestedCount, 1);
    assert.equal(result.tagCount, 1);
    assert.match(result.suggestedText, /coolant loop/i);
  } finally {
    await page.close();
  }
});

test("run summary panel appears on victory and game over with stats", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;

      dbg.updateHud();
      const hiddenDuringPlay = document.getElementById("runSummaryPanel")?.classList.contains("hidden") ?? false;

      g.phase = "run_victory";
      g.turn = 9;
      g.runStats.cardsPlayed = 14;
      g.runStats.damageDealt = 83;
      g.runStats.damageTaken = 18;
      g.runStats.enemiesDestroyed = 7;
      g.runStats.rewardsClaimed = 2;
      g.runStats.rewardSkips = 1;
      g.upgrades.guard_protocol = 2;
      dbg.updateHud();

      const victory = {
        hidden: document.getElementById("runSummaryPanel")?.classList.contains("hidden") ?? true,
        title: document.getElementById("runSummaryTitle")?.textContent || "",
        subtitle: document.getElementById("runSummarySubtitle")?.textContent || "",
        text: document.getElementById("runSummaryStats")?.textContent || "",
      };

      g.phase = "gameover";
      g.sectorIndex = 1;
      dbg.updateHud();
      const gameover = {
        hidden: document.getElementById("runSummaryPanel")?.classList.contains("hidden") ?? true,
        title: document.getElementById("runSummaryTitle")?.textContent || "",
        subtitle: document.getElementById("runSummarySubtitle")?.textContent || "",
      };

      return {
        hiddenDuringPlay,
        victory,
        gameover,
      };
    });

    assert.equal(result.hiddenDuringPlay, true);
    assert.equal(result.victory.hidden, false);
    assert.match(result.victory.title, /route secured/i);
    assert.match(result.victory.subtitle, /foundry crown secured in 9 turns/i);
    assert.match(result.victory.text, /83/);
    assert.match(result.victory.text, /2\/12/);

    assert.equal(result.gameover.hidden, false);
    assert.match(result.gameover.title, /reactor lost/i);
    assert.match(result.gameover.subtitle, /sector 2\/5/i);
  } finally {
    await page.close();
  }
});

test("run summary timeline shows sector, reward, and end-state milestones", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;

      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();

      g.rewardChoices = [{ type: "card", cardId: "spark_lance" }];
      dbg.applyRewardAndAdvance({ type: "card", cardId: "spark_lance" });

      g.player.hull = 0;
      dbg.checkEndStates();
      dbg.updateHud();

      return {
        phase: g.phase,
        timelineText: document.getElementById("runSummaryTimeline")?.textContent || "",
        itemCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-item").length,
        rewardTagCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-tag.reward").length,
        dangerTagCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-tag.danger").length,
        rewardIconCount: document.querySelectorAll(
          '#runSummaryTimeline .run-timeline-tag.reward .run-timeline-icon[src*="energy_battery-50.svg"]'
        ).length,
        dangerIconCount: document.querySelectorAll(
          '#runSummaryTimeline .run-timeline-tag.danger .run-timeline-icon[src*="crit_cross-flare.svg"]'
        ).length,
      };
    });

    assert.equal(result.phase, "gameover");
    assert.ok(result.itemCount >= 6);
    assert.match(result.timelineText, /run started/i);
    assert.match(result.timelineText, /entered freight corridor/i);
    assert.match(result.timelineText, /freight corridor cleared/i);
    assert.match(result.timelineText, /reward: added spark lance/i);
    assert.match(result.timelineText, /entered soot tunnels/i);
    assert.match(result.timelineText, /run lost/i);
    assert.ok(result.rewardTagCount >= 1);
    assert.ok(result.dangerTagCount >= 1);
    assert.ok(result.rewardIconCount >= 1);
    assert.ok(result.dangerIconCount >= 1);
  } finally {
    await page.close();
  }
});

test("timeline toggle switches between recent and full history", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const before = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.phase = "run_victory";
      g.runTimeline = Array.from({ length: 20 }, (_v, i) => ({
        line: `S1 T${i + 1} // Event ${i + 1}`,
        type: i % 2 === 0 ? "sector" : "reward",
      }));
      g.showFullTimeline = false;
      dbg.updateHud();

      const btn = document.getElementById("toggleRunTimelineBtn");
      return {
        visible: !(btn?.classList.contains("hidden") ?? true),
        text: btn?.textContent || "",
        itemCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-item").length,
        countText: document.querySelector("#runSummaryTimeline .run-timeline-count")?.textContent || "",
        iconCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-item .run-timeline-icon").length,
      };
    });

    assert.equal(before.visible, true);
    assert.match(before.text, /show full timeline/i);
    assert.equal(before.itemCount, 14);
    assert.match(before.countText, /recent 14\/20/i);
    assert.equal(before.iconCount, 14);

    await page.click("#toggleRunTimelineBtn");
    const after = await page.evaluate(() => {
      const btn = document.getElementById("toggleRunTimelineBtn");
      return {
        text: btn?.textContent || "",
        itemCount: document.querySelectorAll("#runSummaryTimeline .run-timeline-item").length,
        countText: document.querySelector("#runSummaryTimeline .run-timeline-count")?.textContent || "",
      };
    });

    assert.match(after.text, /show recent timeline/i);
    assert.equal(after.itemCount, 20);
    assert.match(after.countText, /showing all 20 events/i);
  } finally {
    await page.close();
  }
});

test("run stats track card play, damage, and reward decisions", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;

      g.enemies.forEach((enemy, index) => {
        if (index > 0) {
          enemy.alive = false;
          enemy.hp = 0;
        }
      });
      const target = g.enemies[0];
      target.hp = 8;
      target.block = 0;
      target.alive = true;
      target.intent = { kind: "guard", value: 0, hits: 0, label: "Idle" };
      g.selectedEnemyId = target.id;

      g.phase = "player";
      g.player.energy = 3;
      g.player.heat = 35;
      g.hand = [{ cardId: "spark_lance", instanceId: "test_card_1" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderEnemies();
      dbg.renderCards();
      dbg.updateHud();
      document.querySelector("#cardRow .card")?.click();

      g.phase = "player";
      g.player.heat = 100;
      g.player.overclockUsed = false;
      dbg.updateHud();
      document.getElementById("overclockBtn")?.click();

      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "guard_protocol" }];
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "guard_protocol" });

      g.phase = "reward";
      g.rewardChoices = [{ type: "card", cardId: "spark_lance" }];
      dbg.applyRewardAndAdvance(null);

      return { ...g.runStats };
    });

    assert.ok(result.cardsPlayed >= 1);
    assert.ok(result.damageDealt >= 8);
    assert.ok(result.enemiesDestroyed >= 1);
    assert.ok(result.damageTaken >= 3);
    assert.ok(result.rewardsClaimed >= 1);
    assert.ok(result.upgradesRewarded >= 1);
    assert.ok(result.rewardSkips >= 1);
  } finally {
    await page.close();
  }
});

test("run records persist and keep best outcomes across runs", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      try {
        window.localStorage?.removeItem("brassline_run_records_v1");
      } catch (_error) {
        // Ignore storage failures in tests.
      }

      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      const sectorCount = window.BRASSLINE_BALANCE?.progression?.sectors?.length || 0;

      g.sectorIndex = Math.max(0, sectorCount - 1);
      g.turn = 7;
      g.runStats.damageDealt = 60;
      g.upgrades.guard_protocol = 1;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      const phaseAfterWin = g.phase;

      const afterWin = JSON.parse(window.localStorage?.getItem("brassline_run_records_v1") || "{}");

      dbg.initGame();
      g.sectorIndex = 1;
      g.turn = 13;
      g.runStats.damageDealt = 24;
      g.player.hull = 0;
      dbg.checkEndStates();
      const phaseAfterLoss = g.phase;

      const afterLoss = JSON.parse(window.localStorage?.getItem("brassline_run_records_v1") || "{}");

      return {
        sectorCount,
        phaseAfterWin,
        phaseAfterLoss,
        afterWin,
        afterLoss,
      };
    });

    assert.equal(result.phaseAfterWin, "run_victory");
    assert.equal(result.phaseAfterLoss, "gameover");
    assert.equal(result.afterWin.totalRuns, 1);
    assert.equal(result.afterWin.wins, 1);
    assert.equal(result.afterWin.bestVictoryTurns, 7);
    assert.equal(result.afterWin.bestDamageDealt, 60);
    assert.equal(result.afterWin.bestSectorsCleared, result.sectorCount);
    assert.equal(result.afterWin.bestMetaLevels, 1);

    assert.equal(result.afterLoss.totalRuns, 2);
    assert.equal(result.afterLoss.wins, 1);
    assert.equal(result.afterLoss.bestVictoryTurns, 7);
    assert.equal(result.afterLoss.bestDamageDealt, 60);
    assert.equal(result.afterLoss.bestSectorsCleared, result.sectorCount);
    assert.equal(result.afterLoss.bestMetaLevels, 1);
  } finally {
    await page.close();
  }
});

test("run summary highlights newly-beaten record rows", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      window.localStorage?.setItem(
        "brassline_run_records_v1",
        JSON.stringify({
          totalRuns: 4,
          wins: 2,
          bestVictoryTurns: 10,
          bestDamageDealt: 50,
          bestSectorsCleared: 2,
          bestMetaLevels: 1,
        })
      );

      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      const sectorCount = window.BRASSLINE_BALANCE?.progression?.sectors?.length || 0;

      g.sectorIndex = Math.max(0, sectorCount - 1);
      g.turn = 8;
      g.runStats.damageDealt = 77;
      g.upgrades.guard_protocol = 2;
      g.upgrades.condenser_bank = 1;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.updateHud();

      const keys = Array.from(
        document.querySelectorAll("#runSummaryStats .run-summary-stat.new-record[data-record-key]")
      )
        .map((node) => node.getAttribute("data-record-key") || "")
        .filter(Boolean)
        .sort();

      const badgeCount = document.querySelectorAll("#runSummaryStats .run-record-badge").length;
      return { keys, badgeCount };
    });

    assert.deepEqual(result.keys, [
      "bestDamageDealt",
      "bestMetaLevels",
      "bestSectorsCleared",
      "bestVictoryTurns",
    ]);
    assert.equal(result.badgeCount, 4);
  } finally {
    await page.close();
  }
});

test("reset run records button clears persistent run records", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const initial = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      dbg.updateHud();
      const btn = document.getElementById("resetRunRecordsBtn");
      return {
        disabled: Boolean(btn?.disabled),
        title: btn?.getAttribute("title") || "",
        text: btn?.textContent || "",
      };
    });

    assert.equal(initial.disabled, true);
    assert.match(initial.title, /no saved run records/i);
    assert.match(initial.text, /reset run records/i);

    const seeded = await page.evaluate(() => {
      window.localStorage?.setItem(
        "brassline_run_records_v1",
        JSON.stringify({
          totalRuns: 3,
          wins: 1,
          bestVictoryTurns: 11,
          bestDamageDealt: 33,
          bestSectorsCleared: 2,
          bestMetaLevels: 1,
        })
      );
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      dbg.updateHud();

      const btn = document.getElementById("resetRunRecordsBtn");
      return {
        disabled: Boolean(btn?.disabled),
        title: btn?.getAttribute("title") || "",
        text: btn?.textContent || "",
      };
    });

    assert.equal(seeded.disabled, false);
    assert.match(seeded.title, /clear saved run records/i);
    assert.match(seeded.text, /reset run records/i);

    await page.click("#resetRunRecordsBtn");
    const armed = await page.evaluate(() => {
      const btn = document.getElementById("resetRunRecordsBtn");
      return {
        text: btn?.textContent || "",
        title: btn?.getAttribute("title") || "",
        stored: window.localStorage?.getItem("brassline_run_records_v1"),
        log: document.getElementById("combatLog")?.textContent || "",
      };
    });
    assert.match(armed.text, /confirm reset records/i);
    assert.match(armed.title, /click again soon/i);
    assert.ok(typeof armed.stored === "string" && armed.stored.length > 0);
    assert.match(armed.log, /again within 2\.5s to confirm/i);

    await page.click("#resetRunRecordsBtn");
    const after = await page.evaluate(() => {
      const btn = document.getElementById("resetRunRecordsBtn");
      return {
        text: btn?.textContent || "",
        title: btn?.getAttribute("title") || "",
        disabled: Boolean(btn?.disabled),
        stored: window.localStorage?.getItem("brassline_run_records_v1"),
        log: document.getElementById("combatLog")?.textContent || "",
      };
    });
    assert.equal(after.stored, null);
    assert.equal(after.disabled, true);
    assert.match(after.text, /reset run records/i);
    assert.match(after.title, /no saved run records/i);
    assert.match(after.log, /run records cleared/i);
  } finally {
    await page.close();
  }
});

test("upgrade reward increases path level and applies its stat effect", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.updateHud();

      const before = {
        maxEnergy: g.player.maxEnergy,
        sectorIndex: g.sectorIndex,
      };
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "condenser_bank" });

      return {
        before,
        after: {
          maxEnergy: g.player.maxEnergy,
          sectorIndex: g.sectorIndex,
          upgradeLevel: g.upgrades.condenser_bank,
          phase: g.phase,
        },
      };
    });

    assert.equal(result.after.maxEnergy, result.before.maxEnergy + 1);
    assert.equal(result.after.upgradeLevel, 1);
    assert.equal(result.after.sectorIndex, result.before.sectorIndex + 1);
    assert.equal(result.after.phase, "player");
  } finally {
    await page.close();
  }
});

test("invalid or stale reward selection does not advance sector", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "card", cardId: "spark_lance" }];
      const before = {
        sectorIndex: g.sectorIndex,
        phase: g.phase,
        hull: g.player.hull,
      };

      dbg.applyRewardAndAdvance({ type: "card", cardId: "rail_cannon" });
      const after = {
        sectorIndex: g.sectorIndex,
        phase: g.phase,
        hull: g.player.hull,
        log: document.getElementById("combatLog")?.textContent || "",
      };

      return { before, after };
    });

    assert.equal(result.after.sectorIndex, result.before.sectorIndex);
    assert.equal(result.after.phase, result.before.phase);
    assert.equal(result.after.hull, result.before.hull);
    assert.match(result.after.log, /reward no longer available/i);
  } finally {
    await page.close();
  }
});

test("upgrades persist across run restarts via local storage", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      try {
        window.localStorage?.removeItem("brassline_meta_v1");
      } catch (_error) {
        // Ignore storage failures in tests.
      }

      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;

      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "guard_protocol" }];
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "guard_protocol" });
      const afterUpgrade = g.upgrades.guard_protocol;

      g.upgrades.guard_protocol = 0;
      dbg.initGame();
      const afterRestart = dbg.game.upgrades.guard_protocol;

      return { afterUpgrade, afterRestart };
    });

    assert.equal(result.afterUpgrade, 1);
    assert.equal(result.afterRestart, 1);
  } finally {
    await page.close();
  }
});

test("turn-start upgrade bonuses affect cooling and block", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.upgrades.coolant_loop = 2; // base 8 + 4 bonus = 12 cooling
      g.upgrades.guard_protocol = 1; // +3 block at turn start
      g.player.heat = 60;
      g.player.block = 0;
      g.player.energy = g.player.maxEnergy;
      g.player.movedThisTurn = false;
      g.telegraphs = [];
      g.enemies
        .filter((enemy) => enemy.alive)
        .forEach((enemy) => {
          enemy.attackBuff = 0;
          enemy.aimed = false;
          enemy.aimedLane = null;
          enemy.intent = { kind: "guard", value: 0, hits: 0, label: "Idle" };
        });
      dbg.renderTrackMap();
      dbg.renderEnemies();
      dbg.renderCards();
      dbg.updateHud();
    });

    const turnBefore = await getTurn(page);
    await page.click("#endTurnBtn");
    await waitForTurnAdvance(page, turnBefore);

    const values = await page.evaluate(() => {
      const heatText = document.getElementById("heatValue")?.textContent || "0%";
      const heat = Number.parseInt(heatText.replace("%", ""), 10);
      const block = Number.parseInt(document.getElementById("blockValue")?.textContent || "0", 10);
      return { heat, block };
    });

    assert.equal(values.heat, 48);
    assert.equal(values.block, 3);
  } finally {
    await page.close();
  }
});

test("upgrade strip reflects installed upgrade paths", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const before = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      dbg.updateHud();
      const strip = document.getElementById("upgradeStrip");
      return {
        text: strip?.textContent || "",
        chipCount: strip?.querySelectorAll(".upgrade-chip").length || 0,
      };
    });

    assert.equal(before.chipCount, 0);
    assert.match(before.text, /none installed/i);
    assert.match(before.text, /0\/12/i);

    const after = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "guard_protocol" }];
      dbg.updateHud();
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "guard_protocol" });
      dbg.updateHud();

      const strip = document.getElementById("upgradeStrip");
      return {
        text: strip?.textContent || "",
        chipCount: strip?.querySelectorAll(".upgrade-chip").length || 0,
      };
    });

    assert.ok(after.chipCount >= 1);
    assert.match(after.text, /guard protocol/i);
    assert.match(after.text, /start-turn block/i);
    assert.match(after.text, /1\/12/i);
  } finally {
    await page.close();
  }
});

test("reset meta button clears persistent upgrade progression", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const initial = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      dbg.updateHud();
      const btn = document.getElementById("resetMetaBtn");
      return {
        disabled: Boolean(btn?.disabled),
        title: btn?.getAttribute("title") || "",
      };
    });

    assert.equal(initial.disabled, true);
    assert.match(initial.title, /no saved upgrade paths/i);

    const seeded = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "condenser_bank" });
      dbg.updateHud();
      const btn = document.getElementById("resetMetaBtn");
      return {
        level: g.upgrades.condenser_bank,
        maxEnergy: g.player.maxEnergy,
        resetDisabled: Boolean(btn?.disabled),
        resetTitle: btn?.getAttribute("title") || "",
        resetText: btn?.textContent || "",
      };
    });

    assert.equal(seeded.level, 1);
    assert.equal(seeded.maxEnergy, 4);
    assert.equal(seeded.resetDisabled, false);
    assert.match(seeded.resetTitle, /clear saved upgrade paths/i);
    assert.match(seeded.resetText, /reset meta paths/i);

    await page.click("#resetMetaBtn");

    const armed = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const g = dbg.game;
      const btn = document.getElementById("resetMetaBtn");
      const stored = window.localStorage?.getItem("brassline_meta_v1");
      const log = document.getElementById("combatLog")?.textContent || "";
      return {
        phase: g.phase,
        sectorIndex: g.sectorIndex,
        maxEnergy: g.player.maxEnergy,
        condenserLevel: g.upgrades.condenser_bank,
        stored,
        resetText: btn?.textContent || "",
        resetTitle: btn?.getAttribute("title") || "",
        log,
      };
    });

    assert.equal(armed.phase, "player");
    assert.equal(armed.sectorIndex, 1);
    assert.equal(armed.maxEnergy, 4);
    assert.equal(armed.condenserLevel, 1);
    assert.ok(typeof armed.stored === "string" && armed.stored.length > 0);
    assert.match(armed.resetText, /confirm reset meta/i);
    assert.match(armed.resetTitle, /click again soon/i);
    assert.match(armed.log, /again within 2\.5s to confirm/i);

    await page.click("#resetMetaBtn");

    const after = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const g = dbg.game;
      const stored = window.localStorage?.getItem("brassline_meta_v1");
      const btn = document.getElementById("resetMetaBtn");
      return {
        phase: g.phase,
        sectorIndex: g.sectorIndex,
        turn: g.turn,
        maxHull: g.player.maxHull,
        maxEnergy: g.player.maxEnergy,
        condenserLevel: g.upgrades.condenser_bank,
        guardLevel: g.upgrades.guard_protocol,
        stored,
        resetDisabled: Boolean(btn?.disabled),
        resetTitle: btn?.getAttribute("title") || "",
        resetText: btn?.textContent || "",
      };
    });

    assert.equal(after.phase, "player");
    assert.equal(after.sectorIndex, 0);
    assert.equal(after.turn, 1);
    assert.equal(after.maxHull, 72);
    assert.equal(after.maxEnergy, 3);
    assert.equal(after.condenserLevel, 0);
    assert.equal(after.guardLevel, 0);
    assert.equal(after.stored, null);
    assert.equal(after.resetDisabled, true);
    assert.match(after.resetTitle, /no saved upgrade paths/i);
    assert.match(after.resetText, /reset meta paths/i);
  } finally {
    await page.close();
  }
});

test("expired reset arm requires confirmation again", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();
      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.applyRewardAndAdvance({ type: "upgrade", upgradeId: "condenser_bank" });
      dbg.updateHud();
    });

    await page.click("#resetMetaBtn");
    const armed = await page.evaluate(() => {
      const btn = document.getElementById("resetMetaBtn");
      return {
        text: btn?.textContent || "",
        stored: window.localStorage?.getItem("brassline_meta_v1") || "",
      };
    });
    assert.match(armed.text, /confirm reset meta/i);
    assert.ok(armed.stored.length > 0);

    const expired = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.game.metaResetArmedUntil = Date.now() - 1;
      dbg.updateHud();
      const btn = document.getElementById("resetMetaBtn");
      return {
        text: btn?.textContent || "",
        stored: window.localStorage?.getItem("brassline_meta_v1") || "",
      };
    });
    assert.match(expired.text, /reset meta paths/i);
    assert.ok(expired.stored.length > 0);

    await page.click("#resetMetaBtn");
    const rearmed = await page.evaluate(() => {
      const btn = document.getElementById("resetMetaBtn");
      return {
        text: btn?.textContent || "",
        stored: window.localStorage?.getItem("brassline_meta_v1") || "",
      };
    });
    assert.match(rearmed.text, /confirm reset meta/i);
    assert.ok(rearmed.stored.length > 0);
  } finally {
    await page.close();
  }
});
