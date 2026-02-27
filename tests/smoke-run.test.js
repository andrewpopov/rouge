const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const {
  launchBrowser,
  closeBrowser,
  openGamePage,
  getTurn,
} = require("./helpers/playwright-game");

let browser;

before(async () => {
  browser = await launchBrowser();
});

after(async () => {
  await closeBrowser(browser);
});

test("scripted debug smoke run reaches run victory and records a win", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      let guard = 0;
      let rewardsSeen = 0;
      let interludesSeen = 0;

      while (guard < 40 && g.phase !== "run_victory" && g.phase !== "gameover") {
        if (g.phase === "player") {
          g.enemies.forEach((enemy) => {
            enemy.alive = false;
            enemy.hp = 0;
            enemy.intent = null;
          });
          dbg.checkEndStates();
        } else if (g.phase === "reward") {
          rewardsSeen += 1;
          dbg.applyRewardAndAdvance(null);
        } else if (g.phase === "interlude") {
          interludesSeen += 1;
          dbg.resolveInterludeOption(0);
        } else {
          break;
        }
        guard += 1;
      }

      dbg.updateHud();

      const runSummaryPanel = document.getElementById("runSummaryPanel");
      const runSummaryTitle = document.getElementById("runSummaryTitle")?.textContent || "";
      const runSummaryVisible = runSummaryPanel ? !runSummaryPanel.classList.contains("hidden") : false;
      const timelineText = document.getElementById("runSummaryTimeline")?.textContent || "";

      return {
        phase: g.phase,
        guard,
        sectorIndex: g.sectorIndex,
        rewardsSeen,
        interludesSeen,
        runSummaryVisible,
        runSummaryTitle,
        timelineText,
        totalRuns: g.runRecords.totalRuns,
        wins: g.runRecords.wins,
      };
    });

    assert.equal(result.phase, "run_victory");
    assert.ok(result.guard < 40);
    assert.equal(result.rewardsSeen, result.sectorIndex);
    assert.ok(result.interludesSeen >= 1);
    assert.equal(result.runSummaryVisible, true);
    assert.match(result.runSummaryTitle, /secured/i);
    assert.match(result.timelineText, /route secured|foundry crown secured/i);
    assert.equal(result.totalRuns, 1);
    assert.equal(result.wins, 1);
  } finally {
    await page.close();
  }
});

test("scripted debug smoke loss reaches gameover and records a loss", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      g.player.hull = 0;
      dbg.checkEndStates();
      dbg.updateHud();

      const runSummaryPanel = document.getElementById("runSummaryPanel");
      const runSummaryTitle = document.getElementById("runSummaryTitle")?.textContent || "";
      const runSummaryVisible = runSummaryPanel ? !runSummaryPanel.classList.contains("hidden") : false;
      const timelineText = document.getElementById("runSummaryTimeline")?.textContent || "";

      return {
        phase: g.phase,
        runSummaryVisible,
        runSummaryTitle,
        timelineText,
        totalRuns: g.runRecords.totalRuns,
        wins: g.runRecords.wins,
      };
    });

    assert.equal(result.phase, "gameover");
    assert.equal(result.runSummaryVisible, true);
    assert.match(result.runSummaryTitle, /reactor lost/i);
    assert.match(result.timelineText, /run lost/i);
    assert.equal(result.totalRuns, 1);
    assert.equal(result.wins, 0);
  } finally {
    await page.close();
  }
});

test("ui-only smoke round advances from turn 1 to turn 2", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const startTurn = await getTurn(page);
    assert.equal(startTurn, 1);

    const firstEnemy = page.locator("#enemyRow .enemy").first();
    await firstEnemy.click();

    const firstPlayableCard = page.locator("#cardRow .card:not(.locked)").first();
    if ((await firstPlayableCard.count()) > 0) {
      await firstPlayableCard.click();
    }

    const endTurnButton = page.locator("#endTurnBtn");
    assert.equal(await endTurnButton.isDisabled(), false);
    await endTurnButton.click();

    await page.waitForFunction(
      (prev) => {
        const next = Number.parseInt(document.getElementById("turnValue")?.textContent || "0", 10);
        return Number.isInteger(next) && next > prev;
      },
      startTurn,
      { timeout: 2200 }
    );

    const result = await page.evaluate(() => {
      const phase = document.getElementById("phaseBadge")?.textContent || "";
      const turn = Number.parseInt(document.getElementById("turnValue")?.textContent || "0", 10);
      const hull = Number.parseInt(document.getElementById("hullValue")?.textContent || "0", 10);
      return {
        phase,
        turn,
        hull,
      };
    });

    assert.equal(result.turn, 2);
    assert.match(result.phase, /player phase/i);
    assert.ok(result.hull > 0);
  } finally {
    await page.close();
  }
});
