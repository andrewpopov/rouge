const assert = require("node:assert/strict");
const { test } = require("node:test");
const { chromium } = require("playwright");

const BASE_URL = process.env.ROUGE_BASE_URL;

if (!BASE_URL) {
  throw new Error("ROUGE_BASE_URL is required for e2e smoke tests.");
}

async function expectPhase(page, selector, phaseLabel) {
  const locator = page.locator(selector);

  try {
    await locator.waitFor({ state: "visible", timeout: 15000 });
  } catch (error) {
    throw new Error(`Smoke failed while waiting for ${phaseLabel} (${selector}).`, {
      cause: error,
    });
  }

  return locator;
}

test("built app boots through the outer loop and restores the saved run path", async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(async () => {
    await browser.close();
  });

  const page = await browser.newPage();
  const failures = [];
  const recordFailure = (kind, message) => {
    failures.push(`${kind}: ${message}`);
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      recordFailure("console", message.text());
    }
  });
  page.on("pageerror", (error) => {
    recordFailure("pageerror", error.message);
  });
  page.on("requestfailed", (request) => {
    recordFailure("requestfailed", `${request.method()} ${request.url()} -> ${request.failure()?.errorText || "unknown"}`);
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  await (await expectPhase(page, '[data-action="start-character-select"]', "front door boot")).click();
  await expectPhase(page, '[data-action="start-run"]', "character select");

  await page.locator('[data-action="select-class"][data-class-id="sorceress"]').click();
  await page.locator('[data-action="select-mercenary"][data-mercenary-id="iron_wolf"]').click();
  await page.locator('[data-action="start-run"]').click();

  await (await expectPhase(page, '[data-action="leave-safe-zone"]', "safe zone")).click();
  await expectPhase(page, '[data-action="return-safe-zone"]', "world map");

  await page.reload({ waitUntil: "domcontentloaded" });
  await (await expectPhase(page, '[data-action="continue-saved-run"]', "front door saved-run restore")).click();
  await (await expectPhase(page, '[data-action="return-safe-zone"]', "world map after continue")).click();
  await expectPhase(page, '[data-action="leave-safe-zone"]', "safe zone return path");

  assert.deepEqual(failures, []);
});
