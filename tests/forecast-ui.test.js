const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const {
  launchBrowser,
  closeBrowser,
  openGamePage,
  getNumericText,
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

async function setupScenario(page, scenarioName) {
  await page.evaluate(
    ({ name }) => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      g.phase = "encounter";
      g.combatSubphase = "player_turn";
      g.openEnemyTooltipId = null;
      g.highlightLanes = [];
      g.highlightLockKey = null;
      g.player.energy = 3;
      g.player.movedThisTurn = false;
      g.player.overclockUsed = false;
      g.telegraphs = [];

      const alive = g.enemies.filter((enemy) => enemy.alive);
      alive.forEach((enemy) => {
        enemy.attackBuff = 0;
        enemy.aimed = false;
        enemy.aimedLane = null;
        enemy.intent = { kind: "guard", value: 0, hits: 0, label: "Idle" };
      });

      if (name === "shift_to_live") {
        g.player.hull = 12;
        g.player.block = 0;
        g.player.heat = 35;
        g.player.lane = 2;
        g.telegraphs = [
          {
            id: "tg_shift_live",
            type: "lob",
            damage: 13,
            cookTurns: 2,
            turnsLeft: 1,
            cookTier: "fast",
            targetLane: 2,
            lanes: [],
            radius: 0,
            direction: null,
            sourceEnemyId: alive[0]?.id || null,
          },
        ];
      } else if (name === "shift_unavailable") {
        g.player.hull = 12;
        g.player.block = 0;
        g.player.heat = 35;
        g.player.lane = 2;
        g.player.energy = 0;
        g.player.movedThisTurn = true;
        g.telegraphs = [
          {
            id: "tg_shift_unavailable",
            type: "lob",
            damage: 13,
            cookTurns: 2,
            turnsLeft: 1,
            cookTier: "fast",
            targetLane: 2,
            lanes: [],
            radius: 0,
            direction: null,
            sourceEnemyId: alive[0]?.id || null,
          },
        ];
      } else if (name === "vent_to_live") {
        g.player.hull = 10;
        g.player.block = 0;
        g.player.heat = 100;
        g.player.lane = 2;
        if (alive[0]) {
          alive[0].intent = { kind: "attack", value: 8, hits: 1, label: "Unavoidable Shot" };
        }
      } else if (name === "safe_end_turn") {
        g.player.hull = 40;
        g.player.block = 8;
        g.player.heat = 30;
        g.player.lane = 2;
      } else if (name === "projection_match") {
        g.player.hull = 50;
        g.player.block = 4;
        g.player.heat = 95;
        g.player.lane = 2;
        if (alive[0]) {
          alive[0].intent = { kind: "attack", value: 6, hits: 1, label: "Tap Shot" };
        }
        if (alive[1]) {
          alive[1].aimed = true;
          alive[1].aimedLane = 2;
          alive[1].intent = { kind: "attack", value: 5, hits: 1, label: "Locked Shot" };
        }
        g.telegraphs = [
          {
            id: "tg_projection_1",
            type: "sweep",
            damage: 8,
            cookTurns: 2,
            turnsLeft: 1,
            cookTier: "fast",
            targetLane: null,
            lanes: [2],
            radius: 0,
            direction: "right",
            sourceEnemyId: alive[2]?.id || null,
          },
          {
            id: "tg_projection_2",
            type: "lob",
            damage: 5,
            cookTurns: 3,
            turnsLeft: 1,
            cookTier: "slow",
            targetLane: 1,
            lanes: [],
            radius: 1,
            direction: null,
            sourceEnemyId: alive[3]?.id || null,
          },
        ];
      } else if (name === "aimed_dodge") {
        g.player.hull = 12;
        g.player.block = 0;
        g.player.heat = 35;
        g.player.lane = 2;
        if (alive[0]) {
          alive[0].aimed = true;
          alive[0].aimedLane = 2;
          alive[0].intent = { kind: "attack", value: 9, hits: 1, label: "Rifle Shot" };
        }
      }

      dbg.renderTrackMap();
      dbg.renderEnemies();
      dbg.renderCards();
      dbg.updateHud();
    },
    { name: scenarioName }
  );
}

async function readForecast(page) {
  return page.evaluate(() => {
    const root = document.getElementById("laneThreatForecast");
    const actionButtons = {};
    root.querySelectorAll(".lane-action-btn[data-action]").forEach((button) => {
      const action = button.dataset.action;
      actionButtons[action] = {
        disabled: button.disabled,
        recommended: button.classList.contains("recommended"),
        text: button.textContent?.trim() || "",
        keyShortcuts: button.getAttribute("aria-keyshortcuts") || "",
        lockReason: button.dataset.lockReason || "",
        title: button.getAttribute("title") || "",
      };
    });
    const mainButtonMap = {
      shift_left: document.getElementById("shiftLeftBtn"),
      shift_right: document.getElementById("shiftRightBtn"),
      end_turn: document.getElementById("endTurnBtn"),
    };
    const mainControls = {};
    Object.entries(mainButtonMap).forEach(([action, button]) => {
      mainControls[action] = {
        disabled: Boolean(button?.disabled),
        recommended: Boolean(button?.classList.contains("recommended")),
        riskLocked: Boolean(button?.classList.contains("risk-locked")),
        lockReason: button?.dataset.lockReason || "",
        title: button?.getAttribute("title") || "",
      };
    });

    return {
      advice: root?.dataset.advice || "",
      recommendedAction: root?.dataset.recommendedAction || "",
      endTurnLocked: root?.dataset.endTurnLocked || "0",
      currentLoss: Number.parseInt(root?.dataset.currentLoss || "0", 10),
      bestLoss: Number.parseInt(root?.dataset.bestLoss || "0", 10),
      hullAfterCurrent: Number.parseInt(root?.dataset.hullAfterCurrent || "0", 10),
      adviceText: root?.querySelector(".lane-threat-advice")?.textContent?.trim() || "",
      actionButtons,
      mainControls,
    };
  });
}

async function getHull(page) {
  return getNumericText(page, "#hullValue");
}

async function getLane(page) {
  return getNumericText(page, "#laneValue");
}

async function waitForLaneChange(page, previousLane, timeout = 900) {
  await page.waitForFunction(
    (prev) => {
      const value = Number.parseInt(document.getElementById("laneValue")?.textContent || "0", 10);
      return Number.isInteger(value) && value !== prev;
    },
    previousLane,
    { timeout }
  );
}

async function waitForForecastEndTurnLocked(page, expectedLocked, timeout = 900) {
  await page.waitForFunction(
    (expected) => document.getElementById("laneThreatForecast")?.dataset.endTurnLocked === expected,
    expectedLocked,
    { timeout }
  );
}

async function waitForHighlightCount(page, expectedCount, timeout = 900) {
  await page.waitForFunction(
    (expected) => document.querySelectorAll("#trackMap .track-lane.threat-highlight").length === expected,
    expectedCount,
    { timeout }
  );
}

async function waitForHighlightCountAtLeast(page, minCount, timeout = 900) {
  await page.waitForFunction(
    (min) => document.querySelectorAll("#trackMap .track-lane.threat-highlight").length >= min,
    minCount,
    { timeout }
  );
}

test("forecast emits expected advice and recommended actions", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "shift_to_live");
    const shiftData = await readForecast(page);
    assert.equal(shiftData.advice, "shift_to_live");
    assert.equal(shiftData.endTurnLocked, "1");
    assert.ok(["shift_left", "shift_right"].includes(shiftData.recommendedAction));
    assert.equal(shiftData.mainControls.end_turn.riskLocked, true);
    assert.equal(shiftData.mainControls[shiftData.recommendedAction].recommended, true);
    assert.match(shiftData.adviceText, /Shift to T/i);

    await setupScenario(page, "vent_to_live");
    const ventData = await readForecast(page);
    assert.equal(ventData.advice, "vent_to_live");
    assert.equal(ventData.recommendedAction, "");
    assert.match(ventData.adviceText, /Vent Heat/i);

    await setupScenario(page, "safe_end_turn");
    const safeData = await readForecast(page);
    assert.equal(safeData.advice, "safe_end_turn");
    assert.equal(safeData.recommendedAction, "end_turn");
    assert.equal(safeData.mainControls.end_turn.recommended, true);
    assert.equal(safeData.mainControls.end_turn.riskLocked, false);
    assert.match(safeData.adviceText, /Safe to end turn/i);
  } finally {
    await page.close();
  }
});

test("forecast does not suggest impossible shift actions", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "shift_unavailable");
    const data = await readForecast(page);
    assert.equal(data.advice, "needs_mitigation");
    assert.equal(data.recommendedAction, "");
    assert.equal(data.endTurnLocked, "0");
    assert.equal(data.actionButtons.end_turn?.disabled, false);
    const mainEndTurnDisabled = await page.locator("#endTurnBtn").isDisabled();
    assert.equal(mainEndTurnDisabled, false);
  } finally {
    await page.close();
  }
});

test("forecast action buttons perform shift and end turn behavior", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "shift_to_live");
    const shiftData = await readForecast(page);
    assert.equal(shiftData.endTurnLocked, "1");
    assert.equal(shiftData.actionButtons.end_turn?.disabled, true);
    assert.ok(["shift_left", "shift_right"].includes(shiftData.recommendedAction));

    const laneBefore = await getLane(page);
    await page.click(`#laneThreatForecast .lane-action-btn[data-action="${shiftData.recommendedAction}"]`);
    await waitForLaneChange(page, laneBefore);
    const laneAfter = await getLane(page);
    assert.notEqual(laneAfter, laneBefore);

    const afterShift = await readForecast(page);
    assert.equal(afterShift.endTurnLocked, "0");
    assert.equal(afterShift.actionButtons.end_turn?.disabled, false);

    await setupScenario(page, "safe_end_turn");
    const safeData = await readForecast(page);
    assert.equal(safeData.recommendedAction, "end_turn");
    assert.equal(safeData.actionButtons.end_turn?.disabled, false);
    assert.equal(safeData.actionButtons.end_turn?.recommended, true);

    const turnBefore = await getTurn(page);
    await page.click('#laneThreatForecast .lane-action-btn[data-action="end_turn"]');
    await waitForTurnAdvance(page, turnBefore);
    const turnAfter = await getTurn(page);
    assert.ok(turnAfter > turnBefore);
  } finally {
    await page.close();
  }
});

test("main controls mirror forecast recommendation and risk lock", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "shift_to_live");
    const locked = await readForecast(page);
    assert.equal(locked.endTurnLocked, "1");
    assert.equal(locked.mainControls.end_turn.disabled, true);
    assert.equal(locked.mainControls.end_turn.riskLocked, true);
    assert.match(locked.mainControls.end_turn.lockReason, /End Turn locked here/i);
    assert.match(locked.mainControls.end_turn.title, /End Turn locked here/i);
    assert.match(locked.actionButtons.end_turn.lockReason, /End Turn locked here/i);
    assert.match(locked.actionButtons.end_turn.title, /End Turn locked here/i);
    assert.ok(["shift_left", "shift_right"].includes(locked.recommendedAction));
    assert.equal(locked.mainControls[locked.recommendedAction].recommended, true);

    const recommendedMainSelector =
      locked.recommendedAction === "shift_left" ? "#shiftLeftBtn" : "#shiftRightBtn";
    await page.click(recommendedMainSelector);
    await waitForForecastEndTurnLocked(page, "0");

    const unlocked = await readForecast(page);
    assert.equal(unlocked.endTurnLocked, "0");
    assert.equal(unlocked.mainControls.end_turn.disabled, false);
    assert.equal(unlocked.mainControls.end_turn.riskLocked, false);
    assert.equal(unlocked.mainControls.end_turn.lockReason, "");
    assert.equal(unlocked.mainControls.end_turn.title, "");
    assert.equal(unlocked.actionButtons.end_turn.lockReason, "");
    assert.equal(unlocked.actionButtons.end_turn.title, "");

    await setupScenario(page, "safe_end_turn");
    const safe = await readForecast(page);
    assert.equal(safe.recommendedAction, "end_turn");
    assert.equal(safe.mainControls.end_turn.recommended, true);
    assert.equal(safe.mainControls.end_turn.riskLocked, false);
  } finally {
    await page.close();
  }
});

test("forecast projection matches actual end turn hull loss", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "projection_match");
    const forecast = await readForecast(page);
    const hullBefore = await getHull(page);
    const turnBefore = await getTurn(page);

    assert.equal(forecast.actionButtons.end_turn?.disabled, false);
    await page.click('#laneThreatForecast .lane-action-btn[data-action="end_turn"]');
    await waitForTurnAdvance(page, turnBefore);

    const hullAfter = await getHull(page);
    const actualLoss = hullBefore - hullAfter;

    assert.equal(actualLoss, forecast.currentLoss);
    assert.equal(hullAfter, forecast.hullAfterCurrent);
  } finally {
    await page.close();
  }
});

test("forecast lane chips hover and click highlight lanes", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "shift_to_live");

    const highlightCount = () => page.locator("#trackMap .track-lane.threat-highlight").count();
    const beforeHover = await highlightCount();
    assert.equal(beforeHover, 0);

    await page.evaluate(() => {
      const chip = document.querySelector("#laneThreatForecast .lane-threat-chip[data-lanes]");
      chip?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    });
    await waitForHighlightCountAtLeast(page, 1);
    const afterHover = await highlightCount();
    assert.ok(afterHover > 0);

    await page.evaluate(() => {
      const chip = document.querySelector("#laneThreatForecast .lane-threat-chip[data-lanes]");
      chip?.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    });
    await waitForHighlightCount(page, 0);
    const afterLeave = await highlightCount();
    assert.equal(afterLeave, 0);

    await page.evaluate(() => {
      const chip = document.querySelector("#laneThreatForecast .lane-threat-chip[data-lanes]");
      chip?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await waitForHighlightCountAtLeast(page, 1);
    const afterLock = await highlightCount();
    assert.ok(afterLock > 0);

    await page.evaluate(() => {
      const chip = document.querySelector("#laneThreatForecast .lane-threat-chip[data-lanes]");
      chip?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await waitForHighlightCount(page, 0);
    const afterUnlock = await highlightCount();
    assert.equal(afterUnlock, 0);
  } finally {
    await page.close();
  }
});

test("aimed shot is dodged after recommended shift", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "aimed_dodge");
    const forecast = await readForecast(page);

    assert.equal(forecast.advice, "shift_to_live");
    assert.equal(forecast.endTurnLocked, "1");
    assert.ok(["shift_left", "shift_right"].includes(forecast.recommendedAction));

    const hullBefore = await getHull(page);
    const laneBeforeShift = await getLane(page);
    await page.click(`#laneThreatForecast .lane-action-btn[data-action="${forecast.recommendedAction}"]`);
    await waitForLaneChange(page, laneBeforeShift);

    const laneAfterShift = await getLane(page);
    assert.notEqual(laneAfterShift, laneBeforeShift);

    const postShiftForecast = await readForecast(page);
    assert.equal(postShiftForecast.endTurnLocked, "0");

    const turnBefore = await getTurn(page);
    await page.click('#laneThreatForecast .lane-action-btn[data-action="end_turn"]');
    await waitForTurnAdvance(page, turnBefore);

    const hullAfter = await getHull(page);
    assert.equal(hullAfter, hullBefore);

    const combatLog = (await page.locator("#combatLog").innerText()).toLowerCase();
    assert.match(combatLog, /dodged the shot/);
  } finally {
    await page.close();
  }
});

test("keyboard shortcuts trigger only enabled control actions", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const labelTexts = await Promise.all([
      page.locator("#shiftLeftBtn").innerText(),
      page.locator("#shiftRightBtn").innerText(),
      page.locator("#endTurnBtn").innerText(),
    ]);
    assert.match(labelTexts[0], /\[Q\]/);
    assert.match(labelTexts[1], /\[E\]/);
    assert.match(labelTexts[2], /\[space\/enter\]/i);
    assert.equal(await page.getAttribute("#shiftLeftBtn", "aria-keyshortcuts"), "Q");
    assert.equal(await page.getAttribute("#shiftRightBtn", "aria-keyshortcuts"), "E");
    assert.equal(await page.getAttribute("#endTurnBtn", "aria-keyshortcuts"), "Space Enter");

    await setupScenario(page, "safe_end_turn");
    const forecastLabels = await readForecast(page);
    assert.match(forecastLabels.actionButtons.shift_left.text, /\[q\]/i);
    assert.match(forecastLabels.actionButtons.shift_right.text, /\[e\]/i);
    assert.match(forecastLabels.actionButtons.end_turn.text, /\[space\/enter\]/i);
    assert.equal(forecastLabels.actionButtons.shift_left.keyShortcuts, "Q");
    assert.equal(forecastLabels.actionButtons.shift_right.keyShortcuts, "E");
    assert.equal(forecastLabels.actionButtons.end_turn.keyShortcuts, "Space Enter");

    const laneBeforeQ = await getLane(page);
    await page.keyboard.press("KeyQ");
    await waitForLaneChange(page, laneBeforeQ);
    const laneAfterQ = await getLane(page);
    assert.equal(laneAfterQ, laneBeforeQ - 1);

    await page.keyboard.press("KeyE");
    const laneAfterE = await getLane(page);
    assert.equal(laneAfterE, laneAfterQ);

    await setupScenario(page, "safe_end_turn");
    const turnBeforeSpace = await getTurn(page);
    await page.keyboard.press("Space");
    await waitForTurnAdvance(page, turnBeforeSpace);
    const turnAfterSpace = await getTurn(page);
    assert.ok(turnAfterSpace > turnBeforeSpace);

    await setupScenario(page, "safe_end_turn");
    const turnBeforeEnter = await getTurn(page);
    await page.keyboard.press("Enter");
    await waitForTurnAdvance(page, turnBeforeEnter);
    const turnAfterEnter = await getTurn(page);
    assert.ok(turnAfterEnter > turnBeforeEnter);

    await setupScenario(page, "safe_end_turn");
    const turnBeforeNumpadEnter = await getTurn(page);
    await page.keyboard.press("NumpadEnter");
    await waitForTurnAdvance(page, turnBeforeNumpadEnter);
    const turnAfterNumpadEnter = await getTurn(page);
    assert.ok(turnAfterNumpadEnter > turnBeforeNumpadEnter);

    await setupScenario(page, "shift_to_live");
    const turnBeforeLocked = await getTurn(page);
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await page.keyboard.press("NumpadEnter");
    const turnAfterLocked = await getTurn(page);
    assert.equal(turnAfterLocked, turnBeforeLocked);
    const lockLog = await page.locator("#combatLog").innerText();
    assert.match(lockLog, /End Turn locked here/i);

    await setupScenario(page, "shift_unavailable");
    const laneBeforeDisabledShift = await getLane(page);
    await page.keyboard.press("KeyQ");
    await page.keyboard.press("KeyE");
    const laneAfterDisabledShift = await getLane(page);
    assert.equal(laneAfterDisabledShift, laneBeforeDisabledShift);
  } finally {
    await page.close();
  }
});

test("keyboard shortcuts ignore typing targets and modifier keys", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    await setupScenario(page, "safe_end_turn");
    const laneBefore = await getLane(page);
    const turnBefore = await getTurn(page);

    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "hotkeyTypingTarget";
      document.body.appendChild(input);
      input.focus();
    });

    await page.keyboard.press("KeyQ");
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");

    const laneAfterTypingKeys = await getLane(page);
    const turnAfterTypingKeys = await getTurn(page);
    assert.equal(laneAfterTypingKeys, laneBefore);
    assert.equal(turnAfterTypingKeys, turnBefore);

    await page.evaluate(() => {
      const input = document.getElementById("hotkeyTypingTarget");
      if (input instanceof HTMLInputElement) {
        input.blur();
      }
      input?.remove();
    });

    await page.keyboard.press("Control+KeyQ");
    await page.keyboard.press("Control+KeyE");

    const laneAfterModifiers = await getLane(page);
    assert.equal(laneAfterModifiers, laneBefore);

    await setupScenario(page, "safe_end_turn");
    const turnBeforeButtonEnter = await getTurn(page);
    await page.focus("#overclockBtn");
    await page.keyboard.press("Enter");
    const turnAfterButtonEnter = await getTurn(page);
    assert.equal(turnAfterButtonEnter, turnBeforeButtonEnter);
  } finally {
    await page.close();
  }
});
