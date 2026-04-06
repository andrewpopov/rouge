#!/usr/bin/env node
/* global document, HTMLImageElement, HTMLElement, window */

const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const APP_ROOT = path.join(ROOT, "dist");
const OUT_DIR = path.join(ROOT, "screenshots");
const TIMEOUT = 5000;
const GENERATED_HARNESS_PATH = path.join(ROOT, "generated/tests/helpers/browser-harness.js");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const fullPath = path.resolve(APP_ROOT, relative);

    if (!fullPath.startsWith(APP_ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    fs.createReadStream(fullPath).pipe(res);
  });
}

async function startServer() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const addr = server.address();
  return { server, baseUrl: `http://127.0.0.1:${addr.port}` };
}

/** Try to click a button matching name. Returns true if clicked. */
async function tryClick(page, name, waitMs = 350) {
  const btn = page.getByRole("button", { name });
  try {
    await btn.first().waitFor({ state: "visible", timeout: TIMEOUT });
    await btn.first().click();
    await page.waitForTimeout(waitMs);
    return true;
  } catch {
    return false;
  }
}

async function shot(page, name, opts = {}) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, type: "png", fullPage: Boolean(opts.fullPage) });
  console.log(`  ✓ ${name}.png${opts.fullPage ? " (full page)" : ""}`);
}

async function shotLocator(locator, name) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await locator.screenshot({ path: filePath, type: "png" });
  console.log(`  ✓ ${name}.png`);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const scrollers = Array.from(document.querySelectorAll("*")).filter((node) => {
      if (!(node instanceof HTMLElement)) { return false; }
      return node.scrollHeight > node.clientHeight + 8;
    });
    for (const scroller of scrollers) {
      scroller.scrollTop = 0;
    }
  });
  await page.waitForTimeout(120);
}

async function openGameMenu(page) {
  const debugToggle = page.locator('[data-setting-key="debugMode.enabled"]').first();
  if (await debugToggle.isVisible().catch(() => false)) {
    return true;
  }
  const menuToggle = page.locator('[data-action="toggle-game-menu"]').first();
  if (!(await menuToggle.isVisible().catch(() => false))) {
    return false;
  }
  await menuToggle.click();
  await page.waitForTimeout(250);
  return await debugToggle.isVisible().catch(() => false);
}

async function closeGameMenu(page) {
  const debugToggle = page.locator('[data-setting-key="debugMode.enabled"]').first();
  if (!(await debugToggle.isVisible().catch(() => false))) {
    return;
  }
  const menuToggle = page.locator('[data-action="toggle-game-menu"]').first();
  if (!(await menuToggle.isVisible().catch(() => false))) {
    return;
  }
  await menuToggle.click();
  await page.waitForTimeout(250);
}

async function waitForActGuideArt(page) {
  try {
    await page.waitForFunction(() => {
      const poster = document.querySelector(".act-guide-scroll__poster");
      const destination = document.querySelector(".act-guide-destination__art-img");
      return [poster, destination].every((img) => {
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
      });
    }, { timeout: TIMEOUT * 2 });
  } catch {
    // Best-effort only; the shot can still proceed with the current frame.
  }
}

function buildActTransitionFixture() {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

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
  if (!appEngine.startRun(state).ok) {
    return null;
  }
  if (!appEngine.leaveSafeZone(state).ok) {
    return null;
  }

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  if (!appEngine.selectZone(state, openingZoneId).ok) {
    return null;
  }
  if (state.phase === appEngine.PHASES.ENCOUNTER) {
    state.combat.outcome = "victory";
    if (!appEngine.syncEncounterOutcome(state).ok) {
      return null;
    }
  }

  state.run.pendingReward.endsAct = true;
  const rewardChoiceId = state.run.pendingReward.choices[0].id;
  if (!appEngine.claimRewardAndAdvance(state, rewardChoiceId).ok) {
    return null;
  }

  state.run.acts[state.run.currentActIndex].complete = true;
  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildRunSummaryFixture() {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

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
  if (!appEngine.startRun(state).ok) {
    return null;
  }
  if (!appEngine.leaveSafeZone(state).ok) {
    return null;
  }

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  if (!appEngine.selectZone(state, openingZoneId).ok) {
    return null;
  }
  if (state.phase === appEngine.PHASES.ENCOUNTER) {
    state.combat.outcome = "victory";
    if (!appEngine.syncEncounterOutcome(state).ok) {
      return null;
    }
  }

  state.run.pendingReward.endsRun = true;
  state.run.level = 12;
  state.run.xp = 550;
  state.run.gold = 148;
  state.run.hero.currentLife = Math.max(1, Math.min(state.run.hero.maxLife, 19));
  state.run.mercenary.currentLife = Math.max(1, Math.min(state.run.mercenary.maxLife, 11));
  state.run.summary.encountersCleared = 11;
  state.run.summary.zonesCleared = 4;
  state.run.summary.actsCleared = 1;
  state.run.summary.goldGained = 312;
  state.run.summary.xpGained = 92;
  state.run.summary.levelsGained = 3;
  state.run.summary.skillPointsEarned = 4;
  state.run.summary.classPointsEarned = 3;
  state.run.summary.attributePointsEarned = 10;
  state.run.summary.trainingRanksGained = 5;
  state.run.summary.bossesDefeated = 1;
  state.run.summary.runewordsForged = 1;
  state.run.summary.uniqueItemsFound = 1;
  state.run.summary.enemiesDefeated = 37;
  state.run.summary.cardsPlayed = 64;
  state.run.summary.potionsUsed = 3;
  state.run.summary.lowestHeroLife = 4;
  state.run.summary.lowestHeroLifeMax = state.run.hero.maxLife;
  state.run.summary.lowestMercenaryLife = 3;
  state.run.summary.lowestMercenaryLifeMax = state.run.mercenary.maxLife;
  state.profile.meta.progression.highestLevel = 12;
  state.profile.meta.progression.highestActCleared = 1;
  state.profile.meta.progression.totalBossesDefeated = 1;
  state.profile.meta.progression.totalGoldCollected = 1298;
  state.profile.meta.progression.totalRunewordsForged = 1;
  state.profile.runHistory = [
    {
      runId: "archive-1",
      classId: "amazon",
      className: "Amazon",
      level: 7,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 144,
      enemiesDefeated: 29,
      cardsPlayed: 46,
      potionsUsed: 2,
      lowestHeroLife: 6,
      lowestHeroLifeMax: 36,
      lowestMercenaryLife: 5,
      lowestMercenaryLifeMax: 24,
      runewordsForged: 0,
      skillPointsEarned: 2,
      classPointsEarned: 2,
      attributePointsEarned: 5,
      trainingRanksGained: 1,
      favoredTreeId: "huntress",
      favoredTreeName: "Huntress",
      unlockedClassSkills: 5,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-20T10:15:00.000Z",
      outcome: "completed",
    },
    {
      runId: "archive-2",
      classId: "paladin",
      className: "Paladin",
      level: 9,
      actsCleared: 2,
      bossesDefeated: 2,
      goldGained: 238,
      enemiesDefeated: 33,
      cardsPlayed: 58,
      potionsUsed: 1,
      lowestHeroLife: 7,
      lowestHeroLifeMax: 40,
      lowestMercenaryLife: 4,
      lowestMercenaryLifeMax: 26,
      runewordsForged: 1,
      skillPointsEarned: 3,
      classPointsEarned: 2,
      attributePointsEarned: 8,
      trainingRanksGained: 3,
      favoredTreeId: "zeal",
      favoredTreeName: "Zeal",
      unlockedClassSkills: 7,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-22T10:15:00.000Z",
      outcome: "failed",
    },
    {
      runId: "archive-3",
      classId: "necromancer",
      className: "Necromancer",
      level: 11,
      actsCleared: 2,
      bossesDefeated: 2,
      goldGained: 284,
      enemiesDefeated: 41,
      cardsPlayed: 73,
      potionsUsed: 4,
      lowestHeroLife: 5,
      lowestHeroLifeMax: 38,
      lowestMercenaryLife: 2,
      lowestMercenaryLifeMax: 25,
      runewordsForged: 1,
      skillPointsEarned: 4,
      classPointsEarned: 3,
      attributePointsEarned: 10,
      trainingRanksGained: 4,
      favoredTreeId: "bone",
      favoredTreeName: "Bone",
      unlockedClassSkills: 8,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-24T10:15:00.000Z",
      outcome: "completed",
    },
    {
      runId: "archive-4",
      classId: "druid",
      className: "Druid",
      level: 8,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 167,
      enemiesDefeated: 24,
      cardsPlayed: 49,
      potionsUsed: 3,
      lowestHeroLife: 3,
      lowestHeroLifeMax: 37,
      lowestMercenaryLife: 6,
      lowestMercenaryLifeMax: 24,
      runewordsForged: 0,
      skillPointsEarned: 2,
      classPointsEarned: 2,
      attributePointsEarned: 6,
      trainingRanksGained: 2,
      favoredTreeId: "wildheart",
      favoredTreeName: "Wildheart",
      unlockedClassSkills: 6,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-26T10:15:00.000Z",
      outcome: "abandoned",
    },
    {
      runId: "archive-5",
      classId: "sorceress",
      className: "Sorceress",
      level: 10,
      actsCleared: 2,
      bossesDefeated: 2,
      goldGained: 255,
      enemiesDefeated: 35,
      cardsPlayed: 61,
      potionsUsed: 2,
      lowestHeroLife: 8,
      lowestHeroLifeMax: 34,
      lowestMercenaryLife: 4,
      lowestMercenaryLifeMax: 22,
      runewordsForged: 1,
      skillPointsEarned: 4,
      classPointsEarned: 3,
      attributePointsEarned: 8,
      trainingRanksGained: 4,
      favoredTreeId: "stormcraft",
      favoredTreeName: "Stormcraft",
      unlockedClassSkills: 8,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-28T10:15:00.000Z",
      outcome: "completed",
    },
  ];

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildRunFailedSummaryFixture() {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

  const { appEngine, combatEngine, content, persistence, runFactory, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  if (!appEngine.startRun(state).ok) {
    return null;
  }
  if (!appEngine.leaveSafeZone(state).ok) {
    return null;
  }

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  if (!appEngine.selectZone(state, openingZoneId).ok) {
    return null;
  }
  if (state.phase === appEngine.PHASES.ENCOUNTER) {
    state.combat.outcome = "defeat";
    state.combat.cardsPlayed = 31;
    state.combat.potionsUsed = 2;
    state.combat.lowestHeroLife = 0;
    state.combat.lowestMercenaryLife = 2;
    if (!appEngine.syncEncounterOutcome(state).ok) {
      return null;
    }
  }

  state.run.level = 8;
  state.run.xp = 350;
  state.run.gold = 74;
  state.run.hero.currentLife = 0;
  state.run.mercenary.currentLife = Math.max(1, Math.min(state.run.mercenary.maxLife, 5));
  state.run.summary.encountersCleared = 5;
  state.run.summary.zonesCleared = 2;
  state.run.summary.actsCleared = 0;
  state.run.summary.goldGained = 118;
  state.run.summary.xpGained = 58;
  state.run.summary.levelsGained = 2;
  state.run.summary.skillPointsEarned = 2;
  state.run.summary.classPointsEarned = 1;
  state.run.summary.attributePointsEarned = 5;
  state.run.summary.trainingRanksGained = 2;
  state.run.summary.bossesDefeated = 0;
  state.run.summary.runewordsForged = 0;
  state.run.summary.uniqueItemsFound = 0;
  state.run.summary.enemiesDefeated = 17;
  state.run.summary.cardsPlayed = 31;
  state.run.summary.potionsUsed = 2;
  state.run.summary.lowestHeroLife = 0;
  state.run.summary.lowestHeroLifeMax = state.run.hero.maxLife;
  state.run.summary.lowestMercenaryLife = 2;
  state.run.summary.lowestMercenaryLifeMax = state.run.mercenary.maxLife;
  state.profile.meta.progression.highestLevel = 12;
  state.profile.meta.progression.highestActCleared = 1;
  state.profile.meta.progression.totalBossesDefeated = 1;
  state.profile.meta.progression.totalGoldCollected = 1298;
  state.profile.meta.progression.totalRunewordsForged = 1;
  state.profile.runHistory = [
    {
      runId: "archive-a",
      classId: "barbarian",
      className: "Barbarian",
      level: 6,
      actsCleared: 0,
      bossesDefeated: 0,
      goldGained: 96,
      enemiesDefeated: 14,
      cardsPlayed: 27,
      potionsUsed: 1,
      lowestHeroLife: 3,
      lowestHeroLifeMax: 42,
      lowestMercenaryLife: 4,
      lowestMercenaryLifeMax: 24,
      runewordsForged: 0,
      skillPointsEarned: 1,
      classPointsEarned: 1,
      attributePointsEarned: 4,
      trainingRanksGained: 1,
      favoredTreeId: "berserker",
      favoredTreeName: "Berserker",
      unlockedClassSkills: 4,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-21T10:15:00.000Z",
      outcome: "failed",
    },
    {
      runId: "archive-b",
      classId: "paladin",
      className: "Paladin",
      level: 9,
      actsCleared: 2,
      bossesDefeated: 2,
      goldGained: 238,
      enemiesDefeated: 33,
      cardsPlayed: 58,
      potionsUsed: 1,
      lowestHeroLife: 7,
      lowestHeroLifeMax: 40,
      lowestMercenaryLife: 4,
      lowestMercenaryLifeMax: 26,
      runewordsForged: 1,
      skillPointsEarned: 3,
      classPointsEarned: 2,
      attributePointsEarned: 8,
      trainingRanksGained: 3,
      favoredTreeId: "zeal",
      favoredTreeName: "Zeal",
      unlockedClassSkills: 7,
      plannedWeaponRunewordId: "",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: [],
      newFeatureIds: [],
      completedAt: "2026-03-22T10:15:00.000Z",
      outcome: "completed",
    },
  ];

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildTownOverlayFixture({ actNumber = 1, classId = "amazon", mercenaryId = "rogue_scout", gold = 19998 } = {}) {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

  const { appEngine, combatEngine, content, persistence, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, classId);
  appEngine.setSelectedMercenary(state, mercenaryId);
  if (!appEngine.startRun(state).ok) {
    return null;
  }

  state.run.gold = gold;
  if (actNumber > 1) {
    state.run.actNumber = actNumber;
    state.run.currentActIndex = Math.max(0, actNumber - 1);
    const currentAct = state.run.acts[state.run.currentActIndex];
    if (currentAct) {
      state.run.safeZoneName = currentAct.town;
      state.run.actTitle = currentAct.title;
      if (currentAct.boss?.name) {
        state.run.bossName = currentAct.boss.name;
      }
    }
  }

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildWorldMapFixture({ actNumber = 1, classId = "amazon", mercenaryId = "rogue_scout", gold = 19998 } = {}) {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

  const { appEngine, combatEngine, content, persistence, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, classId);
  appEngine.setSelectedMercenary(state, mercenaryId);
  if (!appEngine.startRun(state).ok) {
    return null;
  }

  state.run.gold = gold;
  state.run.level = Math.max(state.run.level, actNumber * 4);
  state.run.summary.actsCleared = Math.max(0, actNumber - 1);
  state.run.summary.zonesCleared = Math.max(state.run.summary.zonesCleared, (actNumber - 1) * 7);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, actNumber - 1);

  if (actNumber > 1) {
    state.run.actNumber = actNumber;
    state.run.currentActIndex = Math.max(0, actNumber - 1);
    for (let index = 0; index < state.run.acts.length; index += 1) {
      const act = state.run.acts[index];
      if (!act) { continue; }
      act.complete = index < state.run.currentActIndex;
    }
    const currentAct = state.run.acts[state.run.currentActIndex];
    if (currentAct) {
      state.run.safeZoneName = currentAct.town;
      state.run.actTitle = currentAct.title;
      if (currentAct.boss?.name) {
        state.run.bossName = currentAct.boss.name;
      }
    }
  }

  if (!appEngine.leaveSafeZone(state).ok) {
    return null;
  }

  state.run.guide.overlayKind = "";
  state.run.guide.targetActNumber = 0;
  state.ui.scrollMapOpen = false;
  state.ui.routeIntelOpen = false;

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildCombatFixture({ classId = "amazon", mercenaryId = "rogue_scout", handSize = 7 } = {}) {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

  const { appEngine, combatEngine, content, persistence, runFactory, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, classId);
  appEngine.setSelectedMercenary(state, mercenaryId);
  if (!appEngine.startRun(state).ok) {
    return null;
  }
  if (!appEngine.leaveSafeZone(state).ok) {
    return null;
  }

  const openingZoneId = runFactory.getCurrentZones(state.run)[0]?.id;
  if (!openingZoneId || !appEngine.selectZone(state, openingZoneId).ok || !state.combat) {
    return null;
  }

  state.ui.exploring = false;
  state.combat.hero.handSize = Math.max(state.combat.hero.handSize, handSize);
  while (state.combat.hand.length < handSize && state.combat.drawPile.length > 0) {
    const nextCard = state.combat.drawPile.shift();
    if (nextCard) {
      state.combat.hand.push(nextCard);
    }
  }
  const firstEnemy = state.combat.enemies.find((enemy) => enemy.alive) || null;
  if (firstEnemy) {
    state.combat.selectedEnemyId = firstEnemy.id;
    state.combat.mercenary.markedEnemyId = firstEnemy.id;
  }

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

function buildBossCombatFixture({ classId = "amazon", mercenaryId = "rogue_scout", handSize = 6 } = {}) {
  let createAppHarness;
  try {
    ({ createAppHarness } = require(GENERATED_HARNESS_PATH));
  } catch {
    return null;
  }

  const { appEngine, combatEngine, content, persistence, runFactory, seedBundle } = createAppHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, classId);
  appEngine.setSelectedMercenary(state, mercenaryId);
  if (!appEngine.startRun(state).ok) {
    return null;
  }

  const runtimeWindow = global.window || {};
  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  const encounterId = bossZone?.encounterIds?.[0] || "act_1_boss";
  const overrides = runFactory.createCombatOverrides(state.run, state.content, state.profile);
  overrides.heroState.handSize = Math.max(overrides.heroState.handSize, handSize);
  const mercenaryRouteBonuses = runtimeWindow.__ROUGE_APP_ENGINE_RUN?.buildMercenaryRouteCombatBonuses?.(state.run, state.content) || {};
  const combatBonuses = runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatBonuses?.(state.run, state.content) || {};
  const armorProfile = runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatMitigationProfile?.(state.run, state.content) || null;
  const weaponEquipment = state.run.loadout?.weapon || null;
  const weaponItemId = weaponEquipment?.itemId || "";
  const weaponItem = runtimeWindow.ROUGE_ITEM_CATALOG?.getItemDefinition?.(state.content, weaponItemId) || null;
  const weaponProfile = runtimeWindow.ROUGE_ITEM_CATALOG?.buildEquipmentWeaponProfile?.(weaponEquipment, state.content) || null;
  const weaponFamily = runtimeWindow.ROUGE_ITEM_CATALOG?.getWeaponFamily?.(weaponItemId, state.content) || "";
  const classPreferred = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(state.run.classId) || [];

  state.run.activeZoneId = bossZone?.id || state.run.activeZoneId;
  state.run.activeEncounterId = encounterId;
  state.combat = state.combatEngine.createCombatState({
    content: { ...state.content, hero: overrides.heroState },
    encounterId,
    mercenaryId: state.run.mercenary.id,
    heroState: overrides.heroState,
    mercenaryState: { ...overrides.mercenaryState, ...mercenaryRouteBonuses },
    starterDeck: overrides.starterDeck,
    initialPotions: overrides.initialPotions,
    randomFn: state.randomFn,
    weaponFamily,
    weaponName: weaponItem?.name || "",
    weaponDamageBonus: combatBonuses.heroDamageBonus || 0,
    weaponProfile,
    armorProfile,
    classPreferredFamilies: classPreferred,
  });
  state.phase = appEngine.PHASES.ENCOUNTER;
  state.ui.exploring = false;
  while (state.combat.hand.length < handSize && state.combat.drawPile.length > 0) {
    const nextCard = state.combat.drawPile.shift();
    if (nextCard) {
      state.combat.hand.push(nextCard);
    }
  }
  const bossEnemy = state.combat.enemies.find((enemy) => enemy.templateId.endsWith("_boss") && enemy.alive) || state.combat.enemies.find((enemy) => enemy.alive) || null;
  if (bossEnemy) {
    state.combat.selectedEnemyId = bossEnemy.id;
    state.combat.mercenary.markedEnemyId = bossEnemy.id;
  }

  const snapshotValue = appEngine.saveRunSnapshot(state);
  if (!snapshotValue) {
    return null;
  }
  state.profile.activeRunSnapshot = persistence.restoreSnapshot(snapshotValue);

  return {
    profileKey: persistence.PROFILE_STORAGE_KEY,
    profileValue: persistence.serializeProfile(state.profile, content),
    snapshotKey: persistence.STORAGE_KEY,
    snapshotValue,
  };
}

async function openFixturePage(browser, baseUrl, fixture) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await context.addInitScript((savedFixture) => {
    localStorage.clear();
    localStorage.setItem(savedFixture.profileKey, savedFixture.profileValue);
    localStorage.setItem(savedFixture.snapshotKey, savedFixture.snapshotValue);
  }, fixture);

  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));
  await page.goto(baseUrl);
  const continueSavedRun = page.locator('[data-action="continue-saved-run"]').first();
  if (await continueSavedRun.isVisible({ timeout: 1200 }).catch(() => false)) {
    await continueSavedRun.click();
  }
  await page.waitForTimeout(700);
  return { context, page };
}

async function openCombatFixturePage(browser, baseUrl, options) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));
  await page.goto(baseUrl);
  await page.waitForFunction(() => window.__ROUGE_SCREENSHOT_HELPERS?.ready === true, { timeout: TIMEOUT * 2 });
  const loaded = await page.evaluate((fixtureOptions) => {
    return window.__ROUGE_SCREENSHOT_HELPERS?.loadCombatFixture?.(fixtureOptions) || false;
  }, options);
  if (!loaded) {
    throw new Error("Combat fixture could not be loaded.");
  }
  await page.waitForTimeout(500);
  return { context, page };
}

async function captureTownNpcOverlay(page, npcId, screenshotName) {
  const npcButton = page.locator(`[data-action="focus-town-npc"][data-npc-id="${npcId}"]`).first();
  await npcButton.waitFor({ state: "visible", timeout: TIMEOUT });
  await npcButton.click();
  await page.waitForTimeout(500);
  await shot(page, screenshotName);
  const leaveButton = page.locator(".merchant-leave").first();
  if (await leaveButton.isVisible().catch(() => false)) {
    await leaveButton.click();
  } else {
    await page.locator('[data-action="close-town-npc"]').first().click();
  }
  await page.waitForTimeout(350);
}

async function captureScreenshots(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));

  console.log("\n📸 Capturing screenshots…\n");

  // Clear localStorage for a fresh start
  await page.goto(baseUrl);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage bootstrap failures in the screenshot harness.
    }
  });
  await page.goto(baseUrl);
  await page.waitForTimeout(600);

  // ── 01. Title screen ──
  await shot(page, "01-title-screen");

  // ── 01a. Spellbook ──
  if (await tryClick(page, "Open Spellbook", 400)) {
    const spellbookOverlay = page.locator(".spellbook-overlay__panel").first();
    if (await spellbookOverlay.isVisible().catch(() => false)) {
      await shotLocator(spellbookOverlay, "01a-spellbook");
      await page.locator('[data-action="close-spellbook"]').last().click().catch(() => {});
      await page.waitForTimeout(250);
    }
  }

  // ── 02. Character select ──
  if (!(await tryClick(page, "Begin Expedition", 500)) &&
      !(await tryClick(page, "New Expedition", 500))) {
    console.log("  ⚠ Could not start expedition");
    await browser.close();
    return;
  }
  await page.waitForTimeout(400);
  await shot(page, "02-character-select", { fullPage: true });
  await page.setViewportSize({ width: 430, height: 980 });
  await page.waitForTimeout(250);
  await shot(page, "02a-character-select-mobile", { fullPage: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(250);

  // ── 03. Enter town ──
  if (!(await tryClick(page, /Begin Hunt|Begin Run|Enter .* Encampment|Enter Encampment/, 500))) {
    console.log("  ⚠ Could not enter town");
    await browser.close();
    return;
  }
  await shot(page, "03-town");
  try {
    const townDetailsToggle = page.locator(".town-operations-toggle").first();
    if (await townDetailsToggle.isVisible().catch(() => false)) {
      await townDetailsToggle.click();
      await page.waitForTimeout(350);
      const townDetailsSurface = page.locator(".town-operations-surface").first();
      if (await townDetailsSurface.isVisible().catch(() => false)) {
        await shotLocator(townDetailsSurface, "03a-town-overview-tabs");
      }
    }
  } catch (e) {
    console.log("  ⚠ Town details tab capture error:", e.message);
  }

  // ── 04. Town service desks ──
  try {
    await captureTownNpcOverlay(page, "vendor", "04-vendor");
    await captureTownNpcOverlay(page, "healer", "04a-healer-quartermaster");
    await captureTownNpcOverlay(page, "blacksmith", "04b-blacksmith");
    await captureTownNpcOverlay(page, "mercenary", "04c-mercenary-captain");
    await captureTownNpcOverlay(page, "stash", "04d-stash-vault");
    await captureTownNpcOverlay(page, "travel", "04e-travel-gate");
  } catch (e) {
    console.log("  ⚠ Town NPC overlay capture error:", e.message);
  }

  // ── 05. Inventory (trigger via JS evaluation, screenshot, then close) ──
  try {
    const hasInvBtn = await page.locator('[data-action="open-inventory"]').count();
    if (hasInvBtn > 0) {
      await page.evaluate(() => {
        const btn = document.querySelector('[data-action="open-inventory"]');
        if (btn) {
          btn.click();
        }
      });
      await page.waitForTimeout(500);
      await shot(page, "05-inventory");
      // Close inventory via JS
      await page.evaluate(() => {
        const overlay = document.querySelector('.inv-overlay');
        if (overlay) {
          overlay.click();
        }
      });
      await page.waitForTimeout(400);
    } else {
      console.log("  ⚠ Inventory button not in DOM");
    }
  } catch (e) {
    console.log("  ⚠ Inventory error:", e.message);
  }

  // ── 06. World map ──
  // We may need to click the on-map exit gate button, not the overlay one
  const exitGate = page.locator(".town-exit-gate");
  const worldMapBtn = page.getByRole("button", { name: /World Map/i });
  let onWorldMap = false;

  try {
    if (await exitGate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exitGate.click();
      await page.waitForTimeout(400);
      onWorldMap = true;
    } else if (await worldMapBtn.isVisible().catch(() => false)) {
      await worldMapBtn.click();
      await page.waitForTimeout(400);
      onWorldMap = true;
    }
  } catch {
    // Best-effort entry into the world map for screenshot capture.
  }

  if (onWorldMap) {
    const introGuide = page.locator('[data-action="continue-act-guide"]').first();
    const introGuideShell = page.locator(".act-guide-shell").first();
    if (await introGuideShell.isVisible({ timeout: 1200 }).catch(() => false)) {
      await waitForActGuideArt(page);
      await resetScroll(page);
      await shotLocator(introGuideShell, "06a-act-guide-intro");
      await introGuide.click();
      await page.waitForTimeout(500);
    }

    await resetScroll(page);
    await shot(page, "06-world-map");

    // ── 07. Enter first zone ──
    if (await tryClick(page, /Blighted Moors|Blood Moor/i, 400)) {
      await shot(page, "07-encounter-choices");

      // ── 08. Combat ──
      if (await tryClick(page, /Charge Forward|Scout Ahead|Follow the Trail/i, 600)) {
        const combatShell = page.locator(".combat-shell").first();
        await resetScroll(page);
        if (await combatShell.isVisible({ timeout: 1200 }).catch(() => false)) {
          await shotLocator(combatShell, "08-combat");
        } else {
          await shot(page, "08-combat");
        }

        // ── 09. Reward ──
        try {
          const debugToggle = page.locator('[data-setting-key="debugMode.enabled"]').first();
          const skipBattlesToggle = page.locator('[data-setting-key="debugMode.skipBattles"]').first();
          const debugSkipEncounter = page.locator('[data-action="debug-skip-encounter"]').first();

          if (await openGameMenu(page)) {
            await debugToggle.click();
            await page.waitForTimeout(350);
            await closeGameMenu(page);
          }

          await skipBattlesToggle.waitFor({ state: "visible", timeout: TIMEOUT });
          await skipBattlesToggle.click();
          await page.waitForTimeout(350);

          await debugSkipEncounter.waitFor({ state: "visible", timeout: TIMEOUT });
          await debugSkipEncounter.click();
          await page.waitForTimeout(700);

          const rewardChoice = page.locator('[data-action="claim-reward-choice"]').first();
          if (await rewardChoice.isVisible({ timeout: 1200 }).catch(() => false)) {
            await rewardChoice.waitFor({ state: "visible", timeout: TIMEOUT });
          }

          if (await openGameMenu(page)) {
            await debugToggle.click();
            await page.waitForTimeout(350);
            await closeGameMenu(page);
          }

          await page.waitForTimeout(900);
          await shot(page, "09-reward");
        } catch (e) {
          console.log("  ⚠ Reward capture error:", e.message);
        }
      }
    }
  }

  try {
    const { context: sevenCardContext, page: sevenCardPage } = await openCombatFixturePage(browser, baseUrl, {
      classId: "amazon",
      mercenaryId: "rogue_scout",
      handSize: 7,
      boss: false,
    });
    const sevenCardCombatShell = sevenCardPage.locator(".combat-shell").first();
    if (await sevenCardCombatShell.isVisible({ timeout: TIMEOUT }).catch(() => false)) {
      await shotLocator(sevenCardCombatShell, "08a-combat-seven-card");
    }
    await sevenCardContext.close();
  } catch (e) {
    console.log("  ⚠ 7-card combat capture error:", e.message);
  }

  try {
    const { context: decklistContext, page: decklistPage } = await openCombatFixturePage(browser, baseUrl, {
      classId: "amazon",
      mercenaryId: "rogue_scout",
      handSize: 7,
      boss: false,
      openPile: "decklist",
    });
    const decklistOverlay = decklistPage.locator(".decklist-overlay__panel").first();
    if (await decklistOverlay.isVisible({ timeout: TIMEOUT }).catch(() => false)) {
      await shotLocator(decklistOverlay, "08c-combat-decklist");
    }
    await decklistContext.close();
  } catch (e) {
    console.log("  ⚠ Decklist combat capture error:", e.message);
  }

  try {
    const { context: combatLogContext, page: combatLogPage } = await openCombatFixturePage(browser, baseUrl, {
      classId: "amazon",
      mercenaryId: "rogue_scout",
      handSize: 7,
      boss: false,
    });
    await combatLogPage.locator('[data-action="toggle-combat-log"]').first().click();
    await combatLogPage.waitForTimeout(250);
    const combatLogShell = combatLogPage.locator(".combat-shell").first();
    if (await combatLogShell.isVisible({ timeout: TIMEOUT }).catch(() => false)) {
      await shotLocator(combatLogShell, "08d-combat-log-open");
    }
    await combatLogContext.close();
  } catch (e) {
    console.log("  ⚠ Combat log capture error:", e.message);
  }

  try {
    const { context: bossCombatContext, page: bossCombatPage } = await openCombatFixturePage(browser, baseUrl, {
      classId: "amazon",
      mercenaryId: "rogue_scout",
      handSize: 6,
      boss: true,
    });
    const bossCombatShell = bossCombatPage.locator(".combat-shell").first();
    if (await bossCombatShell.isVisible({ timeout: TIMEOUT }).catch(() => false)) {
      await shotLocator(bossCombatShell, "08b-combat-boss");
    }
    await bossCombatContext.close();
  } catch (e) {
    console.log("  ⚠ Boss combat capture error:", e.message);
  }

  // ── 10. Act transition ──
  const actTransitionFixture = buildActTransitionFixture();
  if (actTransitionFixture) {
    const transitionContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await transitionContext.addInitScript((fixture) => {
      localStorage.clear();
      localStorage.setItem(fixture.profileKey, fixture.profileValue);
      localStorage.setItem(fixture.snapshotKey, fixture.snapshotValue);
    }, actTransitionFixture);

    const transitionPage = await transitionContext.newPage();
    transitionPage.setDefaultTimeout(TIMEOUT);
    await transitionPage.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));
    await transitionPage.goto(baseUrl);
    const transitionContinue = transitionPage.locator('[data-action="continue-saved-run"]').first();
    if (await transitionContinue.isVisible({ timeout: 1200 }).catch(() => false)) {
      await transitionContinue.click();
    }
    const guideAdvance = transitionPage.locator('[data-action="continue-act-guide"]').first();
    if (await guideAdvance.isVisible({ timeout: 1200 }).catch(() => false)) {
      await guideAdvance.waitFor({ state: "visible", timeout: TIMEOUT });
      await waitForActGuideArt(transitionPage);
      await shot(transitionPage, "10a-act-guide-reward");
      await guideAdvance.click();
      await transitionPage.waitForTimeout(500);
    }
    const transitionAdvance = transitionPage.locator('[data-action="continue-act-transition"]').first();
    if (await transitionAdvance.isVisible({ timeout: 1200 }).catch(() => false)) {
      await transitionAdvance.waitFor({ state: "visible", timeout: TIMEOUT });
    }
    await transitionPage.waitForTimeout(700);
    await shot(transitionPage, "10-act-transition");
    await transitionContext.close();
  } else {
    console.log("  ⚠ Could not build act transition fixture");
  }

  // ── 11. Run summary ──
  const runSummaryFixture = buildRunSummaryFixture();
  if (runSummaryFixture) {
    const summaryContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await summaryContext.addInitScript((fixture) => {
      localStorage.clear();
      localStorage.setItem(fixture.profileKey, fixture.profileValue);
      localStorage.setItem(fixture.snapshotKey, fixture.snapshotValue);
    }, runSummaryFixture);

    const summaryPage = await summaryContext.newPage();
    summaryPage.setDefaultTimeout(TIMEOUT);
    await summaryPage.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));
    await summaryPage.goto(baseUrl);
    const summaryContinue = summaryPage.locator('[data-action="continue-saved-run"]').first();
    if (await summaryContinue.isVisible({ timeout: 1200 }).catch(() => false)) {
      await summaryContinue.click();
    }
    const rewardClaim = summaryPage.locator('[data-action="claim-reward-choice"]').first();
    if (await rewardClaim.isVisible({ timeout: 1200 }).catch(() => false)) {
      await rewardClaim.click();
    }
    const returnFrontDoor = summaryPage.locator('[data-action="return-front-door"]').first();
    if (await returnFrontDoor.isVisible({ timeout: 1200 }).catch(() => false)) {
      await returnFrontDoor.waitFor({ state: "visible", timeout: TIMEOUT });
    }
    await summaryPage.waitForTimeout(850);
    await shot(summaryPage, "11-run-summary");
    const ledgerStep = summaryPage.locator('[data-action="set-run-summary-step"][data-run-summary-step="ledger"]').first();
    if (await ledgerStep.isVisible({ timeout: 1200 }).catch(() => false)) {
      await ledgerStep.click();
      await summaryPage.waitForTimeout(720);
      await shot(summaryPage, "11a-run-ledger");
    }
    const archiveStep = summaryPage.locator('[data-action="set-run-summary-step"][data-run-summary-step="archive"]').first();
    if (await archiveStep.isVisible({ timeout: 1200 }).catch(() => false)) {
      await archiveStep.click();
      await summaryPage.waitForTimeout(720);
      await shot(summaryPage, "11b-run-archive");
    }
    await summaryContext.close();
  } else {
    console.log("  ⚠ Could not build run summary fixture");
  }

  const runFailedFixture = buildRunFailedSummaryFixture();
  if (runFailedFixture) {
    const failedContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await failedContext.addInitScript((fixture) => {
      localStorage.clear();
      localStorage.setItem(fixture.profileKey, fixture.profileValue);
      localStorage.setItem(fixture.snapshotKey, fixture.snapshotValue);
    }, runFailedFixture);

    const failedPage = await failedContext.newPage();
    failedPage.setDefaultTimeout(TIMEOUT);
    await failedPage.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));
    await failedPage.goto(baseUrl);
    const failedContinue = failedPage.locator('[data-action="continue-saved-run"]').first();
    if (await failedContinue.isVisible({ timeout: 1200 }).catch(() => false)) {
      await failedContinue.click();
    }
    const failedReturn = failedPage.locator('[data-action="return-front-door"]').first();
    if (await failedReturn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await failedReturn.waitFor({ state: "visible", timeout: TIMEOUT });
    }
    await failedPage.waitForTimeout(850);
    await shot(failedPage, "11c-run-summary-defeat");
    const failedLedgerStep = failedPage.locator('[data-action="set-run-summary-step"][data-run-summary-step="ledger"]').first();
    if (await failedLedgerStep.isVisible({ timeout: 1200 }).catch(() => false)) {
      await failedLedgerStep.click();
      await failedPage.waitForTimeout(720);
      await shot(failedPage, "11d-run-ledger-defeat");
    }
    const failedArchiveStep = failedPage.locator('[data-action="set-run-summary-step"][data-run-summary-step="archive"]').first();
    if (await failedArchiveStep.isVisible({ timeout: 1200 }).catch(() => false)) {
      await failedArchiveStep.click();
      await failedPage.waitForTimeout(720);
      await shot(failedPage, "11e-run-archive-defeat");
    }
    await failedContext.close();
  } else {
    console.log("  ⚠ Could not build failed run summary fixture");
  }

  // ── 11b. Cain overlay in a rescued town state ──
  const cainTownFixture = buildTownOverlayFixture({ actNumber: 2 });
  if (cainTownFixture) {
    const { context: cainContext, page: cainPage } = await openFixturePage(browser, baseUrl, cainTownFixture);
    try {
      await captureTownNpcOverlay(cainPage, "cain", "11-deckard-cain-training");
    } finally {
      await cainContext.close();
    }
  } else {
    console.log("  ⚠ Could not build Cain town fixture");
  }

  // ── 12. Additional act campaign boards ──
  const worldMapShots = [
    { actNumber: 2, name: "12-act2-campaign-board" },
    { actNumber: 3, name: "13-act3-campaign-board" },
    { actNumber: 4, name: "14-act4-campaign-board" },
    { actNumber: 5, name: "15-act5-campaign-board" },
  ];
  for (const worldMapShot of worldMapShots) {
    const fixture = buildWorldMapFixture({ actNumber: worldMapShot.actNumber });
    if (!fixture) {
      console.log(`  ⚠ Could not build world map fixture for act ${worldMapShot.actNumber}`);
      continue;
    }
    const { context: worldContext, page: worldPage } = await openFixturePage(browser, baseUrl, fixture);
    try {
      await resetScroll(worldPage);
      await shot(worldPage, worldMapShot.name);
    } finally {
      await worldContext.close();
    }
  }

  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { server, baseUrl } = await startServer();
  console.log(`Server running at ${baseUrl} from ${APP_ROOT}`);

  try {
    await captureScreenshots(baseUrl);
    console.log(`\n✅ Screenshots saved to screenshots/\n`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exitCode = 1;
});
