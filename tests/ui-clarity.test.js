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

test("combat ui explains player identity, enemies, cards, and turn loop", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const state = await page.evaluate(() => ({
      flowLabel: document.getElementById("flowLabel")?.textContent || "",
      mapRoleNote: document.getElementById("mapRoleNote")?.textContent || "",
      enemySectionHint: document.getElementById("enemySectionHint")?.textContent || "",
      handZoneHint: document.getElementById("handZoneHint")?.textContent || "",
      turnFlowText: document.getElementById("turnFlowText")?.textContent || "",
      targetHint: document.getElementById("targetHint")?.textContent || "",
      playerLaneBadgeText:
        document.querySelector("#trackMap .track-lane.player-lane .player-lane-badge")?.textContent || "",
    }));

    assert.match(state.flowLabel, /your turn|blue marker/i);
    assert.match(state.mapRoleNote, /you = blue marker/i);
    assert.match(state.enemySectionHint, /enemy units/i);
    assert.match(state.handZoneHint, /combat actions/i);
    assert.match(state.turnFlowText, /turn loop/i);
    assert.match(state.targetHint, /target:/i);
    assert.equal(state.playerLaneBadgeText.trim(), "YOU");
  } finally {
    await page.close();
  }
});
