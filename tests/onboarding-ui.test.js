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

test("onboarding panel is visible on first run and supports dismiss + toggle", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const initial = await page.evaluate(() => ({
      visible: !document.getElementById("onboardingPanel")?.classList.contains("hidden"),
      toggleText: document.getElementById("toggleOnboardingBtn")?.textContent || "",
      shiftLeftHighlighted: document.getElementById("shiftLeftBtn")?.classList.contains("onboarding-focus") || false,
      shiftRightHighlighted: document.getElementById("shiftRightBtn")?.classList.contains("onboarding-focus") || false,
      endTurnHighlighted: document.getElementById("endTurnBtn")?.classList.contains("onboarding-focus") || false,
      onboardingState: document.body?.dataset?.onboarding || "",
    }));

    assert.equal(initial.visible, true);
    assert.match(initial.toggleText, /hide how to play/i);
    assert.equal(initial.shiftLeftHighlighted, true);
    assert.equal(initial.shiftRightHighlighted, true);
    assert.equal(initial.endTurnHighlighted, true);
    assert.equal(initial.onboardingState, "active");

    await page.click("#dismissOnboardingBtn");

    const dismissed = await page.evaluate(() => {
      const raw = window.localStorage?.getItem("brassline_onboarding_v1") || "";
      let dismissedStored = false;
      try {
        dismissedStored = Boolean(JSON.parse(raw)?.dismissed);
      } catch (_error) {
        dismissedStored = false;
      }
      return {
        visible: !document.getElementById("onboardingPanel")?.classList.contains("hidden"),
        toggleText: document.getElementById("toggleOnboardingBtn")?.textContent || "",
        shiftLeftHighlighted: document.getElementById("shiftLeftBtn")?.classList.contains("onboarding-focus") || false,
        shiftRightHighlighted: document.getElementById("shiftRightBtn")?.classList.contains("onboarding-focus") || false,
        endTurnHighlighted: document.getElementById("endTurnBtn")?.classList.contains("onboarding-focus") || false,
        onboardingState: document.body?.dataset?.onboarding || "",
        dismissedStored,
      };
    });

    assert.equal(dismissed.visible, false);
    assert.match(dismissed.toggleText, /how to play/i);
    assert.equal(dismissed.shiftLeftHighlighted, false);
    assert.equal(dismissed.shiftRightHighlighted, false);
    assert.equal(dismissed.endTurnHighlighted, false);
    assert.equal(dismissed.onboardingState, "dismissed");
    assert.equal(dismissed.dismissedStored, true);

    await page.click("#toggleOnboardingBtn");

    const reopened = await page.evaluate(() => ({
      visible: !document.getElementById("onboardingPanel")?.classList.contains("hidden"),
      shiftLeftHighlighted: document.getElementById("shiftLeftBtn")?.classList.contains("onboarding-focus") || false,
      onboardingState: document.body?.dataset?.onboarding || "",
    }));

    assert.equal(reopened.visible, true);
    assert.equal(reopened.shiftLeftHighlighted, false);
    assert.equal(reopened.onboardingState, "dismissed");
  } finally {
    await page.close();
  }
});
