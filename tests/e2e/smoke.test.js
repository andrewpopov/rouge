const assert = require("node:assert/strict");
const { test } = require("node:test");
const { chromium } = require("playwright");
const { createAppHarness } = require("../../generated/tests/helpers/browser-harness.js");

const BASE_URL = process.env.ROUGE_BASE_URL;

if (!BASE_URL) {
  throw new Error("ROUGE_BASE_URL is required for e2e smoke tests.");
}

function buildSavedRewardFixture({ endsAct = false, endsRun = false } = {}) {
  const { appEngine, combatEngine, content, persistence, runFactory, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  assert.equal(appEngine.startRun(state).ok, true);
  assert.equal(appEngine.leaveSafeZone(state).ok, true);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  assert.equal(appEngine.selectZone(state, openingZoneId).ok, true);
  if (state.phase === appEngine.PHASES.ENCOUNTER) {
    state.combat.outcome = "victory";
    assert.equal(appEngine.syncEncounterOutcome(state).ok, true);
  }

  assert.equal(state.phase, appEngine.PHASES.REWARD);
  state.run.pendingReward.endsAct = endsAct;
  state.run.pendingReward.endsRun = endsRun;

  const snapshotValue = appEngine.saveRunSnapshot(state);
  assert.ok(snapshotValue);
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildSafeZoneFixture() {
  const { appEngine, combatEngine, content, persistence, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  assert.equal(appEngine.startRun(state).ok, true);

  const snapshotValue = appEngine.saveRunSnapshot(state);
  assert.ok(snapshotValue);
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildActTransitionFixture() {
  const { appEngine, combatEngine, content, persistence, runFactory, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  assert.equal(appEngine.startRun(state).ok, true);
  assert.equal(appEngine.leaveSafeZone(state).ok, true);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  assert.equal(appEngine.selectZone(state, openingZoneId).ok, true);
  if (state.phase === appEngine.PHASES.ENCOUNTER) {
    state.combat.outcome = "victory";
    assert.equal(appEngine.syncEncounterOutcome(state).ok, true);
  }

  state.run.pendingReward.endsAct = true;
  const rewardChoiceId = state.run.pendingReward.choices[0].id;
  assert.equal(appEngine.claimRewardAndAdvance(state, rewardChoiceId).ok, true);
  assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
  state.run.acts[state.run.currentActIndex].complete = true;
  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);

  const snapshotValue = appEngine.saveRunSnapshot(state);
  assert.ok(snapshotValue);
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

const SAFE_ZONE_FIXTURE = buildSafeZoneFixture();
const ACT_TRANSITION_FIXTURE = buildActTransitionFixture();
const RUN_SUMMARY_FIXTURE = buildSavedRewardFixture({ endsRun: true });

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

async function expectText(page, text, phaseLabel) {
  const locator = page.getByText(text, { exact: false }).first();

  try {
    await locator.waitFor({ state: "visible", timeout: 15000 });
  } catch (error) {
    throw new Error(`Smoke failed while waiting for ${phaseLabel} text (${text}).`, {
      cause: error,
    });
  }

  return locator;
}

async function createSmokePage(browser, storageFixture = null) {
  const context = await browser.newContext();
  if (storageFixture) {
    await context.addInitScript((fixture) => {
      localStorage.clear();
      localStorage.setItem(fixture.profileKey, fixture.profileValue);
      localStorage.setItem(fixture.snapshotKey, fixture.snapshotValue);
    }, storageFixture);
  }

  const page = await context.newPage();
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

  return { context, page, failures };
}

test("built app boots through the outer loop and restores the saved run path", async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(async () => {
    await browser.close();
  });

  const { context: browserContext, page, failures } = await createSmokePage(browser);
  context.after(async () => {
    await browserContext.close();
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

test("built app restores a saved safe-zone expedition and resumes route prep", async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(async () => {
    await browser.close();
  });

  const { context: browserContext, page, failures } = await createSmokePage(browser, SAFE_ZONE_FIXTURE);
  context.after(async () => {
    await browserContext.close();
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  await (await expectPhase(page, '[data-action="continue-saved-run"]', "front door safe-zone restore")).click();
  await expectText(page, "Town Districts", "safe zone shell");
  await (await expectPhase(page, '[data-action="leave-safe-zone"]', "safe zone restore controls")).click();
  await expectText(page, "Route Decision Desk", "world map after safe-zone restore");

  assert.deepEqual(failures, []);
});

test("built app smoke reaches encounter, reward, act transition, and run summary checkpoints", async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(async () => {
    await browser.close();
  });

  const livePage = await createSmokePage(browser);
  context.after(async () => {
    await livePage.context.close();
  });

  await livePage.page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await (await expectPhase(livePage.page, '[data-action="start-character-select"]', "front door boot")).click();
  await expectPhase(livePage.page, '[data-action="start-run"]', "character select");
  await livePage.page.locator('[data-action="select-class"][data-class-id="sorceress"]').click();
  await livePage.page.locator('[data-action="select-mercenary"][data-mercenary-id="iron_wolf"]').click();
  await livePage.page.locator('[data-action="start-run"]').click();
  await (await expectPhase(livePage.page, '[data-action="leave-safe-zone"]', "safe zone")).click();
  await expectPhase(livePage.page, '[data-action="select-zone"][data-zone-id="act_1_blood_moor"]', "world map route open");
  await livePage.page.locator('[data-action="select-zone"][data-zone-id="act_1_blood_moor"]').dispatchEvent("click");
  await expectText(livePage.page, "Encounter Brief", "encounter shell");
  await expectPhase(livePage.page, '[data-action="end-turn"]', "encounter controls");
  assert.deepEqual(livePage.failures, []);

  const actTransitionPage = await createSmokePage(browser, ACT_TRANSITION_FIXTURE);
  context.after(async () => {
    await actTransitionPage.context.close();
  });

  await actTransitionPage.page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await (await expectPhase(actTransitionPage.page, '[data-action="continue-saved-run"]', "front door reward restore")).click();
  await expectText(actTransitionPage.page, "Act Delta Review", "act transition review");
  await (await expectPhase(actTransitionPage.page, '[data-action="continue-act-transition"]', "act transition continue")).click();
  await expectText(actTransitionPage.page, "Town Districts", "next town safe zone");
  assert.deepEqual(actTransitionPage.failures, []);

  const runSummaryPage = await createSmokePage(browser, RUN_SUMMARY_FIXTURE);
  context.after(async () => {
    await runSummaryPage.context.close();
  });

  await runSummaryPage.page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await (await expectPhase(runSummaryPage.page, '[data-action="continue-saved-run"]', "front door reward-to-summary restore")).click();
  await expectText(runSummaryPage.page, "Choose A Mutation", "run-ending reward screen");
  await runSummaryPage.page.locator('[data-action="claim-reward-choice"]').first().waitFor({ state: "visible", timeout: 15000 });
  await runSummaryPage.page.locator('[data-action="claim-reward-choice"]').first().click();
  await expectText(runSummaryPage.page, "Hall Handoff", "run summary review");
  await (await expectPhase(runSummaryPage.page, '[data-action="return-front-door"]', "run summary exit")).click();
  await expectText(runSummaryPage.page, "Account Hall", "front door after run summary");
  assert.deepEqual(runSummaryPage.failures, []);
});

test("built app renders a boot error when seed loading fails", async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(async () => {
    await browser.close();
  });

  const { context: browserContext, page, failures } = await createSmokePage(browser);
  context.after(async () => {
    await browserContext.close();
  });

  await browserContext.route("**/data/seeds/d2/classes.json", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "text/plain; charset=utf-8",
      body: "seed bundle unavailable",
    });
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  await expectText(page, "Boot Failure", "boot failure shell");
  await expectText(page, "Failed to load ./data/seeds/d2/classes.json: 500", "seed failure detail");

  assert.deepEqual(
    failures.filter((failure) => !failure.includes("status of 500 (Internal Server Error)")),
    []
  );
});
