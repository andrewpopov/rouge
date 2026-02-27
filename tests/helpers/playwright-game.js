const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const GAME_URL = pathToFileURL(path.resolve(__dirname, "..", "..", "index.html")).href;
const DEFAULT_VIEWPORT = { width: 1460, height: 920 };
const STORAGE_KEYS = [
  "brassline_meta_v1",
  "brassline_run_records_v1",
  "brassline_run_snapshot_v1",
  "brassline_onboarding_v1",
];

function clearStorageInPage(keys) {
  try {
    (Array.isArray(keys) ? keys : []).forEach((key) => {
      window.localStorage?.removeItem(key);
    });
  } catch (_error) {
    // Ignore storage cleanup failures in tests.
  }
}

async function launchBrowser() {
  return chromium.launch({ headless: true });
}

async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
  }
}

async function openGamePage(
  browser,
  {
    resetStorage = true,
    waitForSelector = "#laneThreatForecast",
    viewport = DEFAULT_VIEWPORT,
  } = {}
) {
  const page = await browser.newPage({ viewport });
  if (resetStorage) {
    await page.addInitScript(clearStorageInPage, STORAGE_KEYS);
  }
  await page.goto(GAME_URL);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector);
  }
  if (resetStorage) {
    await page.evaluate(clearStorageInPage, STORAGE_KEYS);
  }
  return page;
}

async function getNumericText(page, selector) {
  const value = await page.locator(selector).innerText();
  return Number.parseInt(value, 10);
}

async function getTurn(page) {
  return getNumericText(page, "#turnValue");
}

async function waitForTurnAdvance(page, previousTurn, timeout = 1800) {
  await page.waitForFunction(
    (prev) => {
      const value = Number.parseInt(document.getElementById("turnValue")?.textContent || "0", 10);
      return Number.isInteger(value) && value > prev;
    },
    previousTurn,
    { timeout }
  );
}

module.exports = {
  GAME_URL,
  launchBrowser,
  closeBrowser,
  openGamePage,
  getNumericText,
  getTurn,
  waitForTurnAdvance,
};
