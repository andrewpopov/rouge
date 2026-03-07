export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";

const ROOT = path.resolve(__dirname, "../..");
const GENERATED_ROOT = path.join(ROOT, "generated");

function loadBrowserScript(filename, sandbox) {
  const fullPath = path.join(GENERATED_ROOT, filename);
  const source = fs.readFileSync(fullPath, "utf8");
  new vm.Script(source, { filename: fullPath }).runInContext(sandbox);
}

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key) || null : null;
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

class FakeElement {
  dataset: Record<string, string>;

  constructor(dataset: Record<string, string> = {}) {
    this.dataset = dataset;
  }

  closest(selector: string): FakeElement | null {
    return selector === "[data-action]" ? this : null;
  }
}

function createHarness() {
  const storage = createMemoryStorage();
  const sandbox = {
    window: {
      localStorage: storage,
      Element: FakeElement,
    },
    console,
    Math,
    Date,
    Element: FakeElement,
  };
  vm.createContext(sandbox);
  loadBrowserScript("src/content/game-content.js", sandbox);
  loadBrowserScript("src/combat/combat-engine.js", sandbox);
  loadBrowserScript("src/content/content-validator.js", sandbox);
  loadBrowserScript("src/content/encounter-registry.js", sandbox);
  loadBrowserScript("src/character/class-registry.js", sandbox);
  loadBrowserScript("src/ui/render-utils.js", sandbox);
  loadBrowserScript("src/items/item-system.js", sandbox);
  loadBrowserScript("src/rewards/reward-engine.js", sandbox);
  loadBrowserScript("src/quests/world-node-engine.js", sandbox);
  loadBrowserScript("src/run/run-factory.js", sandbox);
  loadBrowserScript("src/town/service-registry.js", sandbox);
  loadBrowserScript("src/state/save-migrations.js", sandbox);
  loadBrowserScript("src/state/profile-migrations.js", sandbox);
  loadBrowserScript("src/state/persistence.js", sandbox);
  loadBrowserScript("src/app/app-engine.js", sandbox);
  loadBrowserScript("src/ui/ui-common.js", sandbox);
  loadBrowserScript("src/ui/front-door-view.js", sandbox);
  loadBrowserScript("src/ui/character-select-view.js", sandbox);
  loadBrowserScript("src/ui/safe-zone-view.js", sandbox);
  loadBrowserScript("src/ui/world-map-view.js", sandbox);
  loadBrowserScript("src/ui/combat-view.js", sandbox);
  loadBrowserScript("src/ui/reward-view.js", sandbox);
  loadBrowserScript("src/ui/act-transition-view.js", sandbox);
  loadBrowserScript("src/ui/run-summary-view.js", sandbox);
  loadBrowserScript("src/ui/app-shell.js", sandbox);
  loadBrowserScript("src/ui/action-dispatcher.js", sandbox);

  const seedBundle = {
    classes: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/classes.json"), "utf8")),
    skills: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/skills.json"), "utf8")),
    zones: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/zones.json"), "utf8")),
    bosses: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/bosses.json"), "utf8")),
    enemyPools: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/enemy-pools.json"), "utf8")),
    items: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/items.json"), "utf8")),
    runes: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/runes.json"), "utf8")),
    runewords: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/runewords.json"), "utf8")),
  };
  const browserWindow = sandbox.window as unknown as Window;
  const classRuntimeContent = browserWindow.ROUGE_CLASS_REGISTRY.createRuntimeContent(browserWindow.ROUGE_GAME_CONTENT, seedBundle);
  const itemizedContent = browserWindow.ROUGE_ITEM_SYSTEM.createRuntimeContent(classRuntimeContent, seedBundle);
  const runtimeContent = browserWindow.ROUGE_ENCOUNTER_REGISTRY.createRuntimeContent(itemizedContent, seedBundle);

  return {
    content: runtimeContent,
    combatEngine: browserWindow.ROUGE_COMBAT_ENGINE,
    classRegistry: browserWindow.ROUGE_CLASS_REGISTRY,
    itemSystem: browserWindow.ROUGE_ITEM_SYSTEM,
    persistence: browserWindow.ROUGE_PERSISTENCE,
    runFactory: browserWindow.ROUGE_RUN_FACTORY,
    appEngine: browserWindow.ROUGE_APP_ENGINE,
    appShell: browserWindow.ROUGE_APP_SHELL,
    actionDispatcher: browserWindow.ROUGE_ACTION_DISPATCHER,
    browserWindow,
    createActionTarget: (dataset: Record<string, string>) => new FakeElement(dataset) as unknown as EventTarget,
    seedBundle,
    storage,
  };
}

test("startRun creates a class-derived run and enters the safe zone", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  const result = appEngine.startRun(state);

  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(state.run.classId, "sorceress");
  assert.equal(state.run.hero.name, "Sorceress");
  assert.equal(state.run.hero.maxEnergy, 4);
  assert.equal(state.run.safeZoneName, "Rogue Encampment");
  assert.equal(state.run.acts.length, 5);
  assert.deepEqual(state.run.deck, content.starterDeckProfiles.caster);
  assert.ok(Object.keys(content.generatedActEncounterIds).length >= 5);
  assert.equal(appEngine.hasSavedRun(), true);
});

test("world map zones loop encounter to reward and preserve multi-encounter progress", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  let result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeZoneId, openingZoneId);
  assert.match(state.run.activeEncounterId, /^act_1_/);

  state.combat.outcome = "victory";
  state.combat.hero.life = 33;
  state.combat.mercenary.life = 17;
  state.combat.potions = 1;
  appEngine.syncEncounterOutcome(state);

  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.clearsZone, false);
  assert.equal(state.run.pendingReward.choices.length, 3);

  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  const zone = runFactory.getZoneById(state.run, openingZoneId);
  assert.equal(zone.encountersCleared, 1);
  assert.equal(zone.cleared, false);
  assert.equal(state.run.hero.currentLife, 33);
  assert.equal(state.run.belt.current, 1);

  result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
});

test("safe-zone services can heal, refill, and change mercenary contracts without losing map progress", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 200;
  state.run.hero.currentLife = 18;
  state.run.mercenary.currentLife = 10;
  state.run.belt.current = 0;

  let result = appEngine.useTownAction(state, "healer_restore_party");
  assert.equal(result.ok, true);
  assert.ok(state.run.hero.currentLife >= state.run.hero.maxLife);
  assert.ok(state.run.mercenary.currentLife >= state.run.mercenary.maxLife);

  result = appEngine.useTownAction(state, "quartermaster_refill_belt");
  assert.equal(result.ok, true);
  assert.equal(state.run.belt.current, state.run.belt.max);

  const goldAfterRecovery = state.run.gold;
  result = appEngine.useTownAction(state, "mercenary_contract_iron_wolf");
  assert.equal(result.ok, true);
  assert.equal(state.run.mercenary.id, "iron_wolf");
  assert.ok(state.run.gold < goldAfterRecovery);

  appEngine.leaveSafeZone(state);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  result = appEngine.returnToSafeZone(state);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(runFactory.getZoneById(state.run, openingZoneId).encountersCleared, 1);
});

test("safe-zone services can revive a fallen current mercenary", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 200;
  state.run.mercenary.currentLife = 0;

  const result = appEngine.useTownAction(state, `mercenary_contract_${state.run.mercenary.id}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.mercenary.currentLife >= state.run.mercenary.maxLife);
});

test("town actions can spend skill points and move inventory through vendor, loadout, and stash flows", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 240;
  state.run.progression.skillPointsAvailable = 1;

  const heroLifeBefore = state.run.hero.maxLife;
  let result = appEngine.useTownAction(state, "progression_spend_vitality");
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.skillPointsAvailable, 0);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);

  const vendorEquipment = state.run.town.vendor.stock.find((entry) => entry.kind === "equipment");
  assert.ok(vendorEquipment);
  const goldBeforeBuy = state.run.gold;
  result = appEngine.useTownAction(state, `vendor_buy_${vendorEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.gold < goldBeforeBuy);
  assert.ok(state.run.inventory.carried.some((entry) => entry.kind === "equipment"));

  const carriedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(carriedEquipment);
  result = appEngine.useTownAction(state, `inventory_equip_${carriedEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.loadout[carriedEquipment.equipment.slot]?.itemId, carriedEquipment.equipment.itemId);

  result = appEngine.useTownAction(state, `inventory_unequip_${carriedEquipment.equipment.slot}`);
  assert.equal(result.ok, true);
  const returnedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(returnedEquipment);

  result = appEngine.useTownAction(state, `inventory_stash_${returnedEquipment.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.profile.stash.entries.length, 1);
  assert.equal(state.run.inventory.carried.length, 0);

  result = appEngine.useTownAction(state, `stash_withdraw_${state.profile.stash.entries[0].entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.profile.stash.entries.length, 0);
  assert.equal(state.run.inventory.carried.length, 1);

  const saleTarget = state.run.inventory.carried[0];
  const goldBeforeSale = state.run.gold;
  result = appEngine.useTownAction(state, `inventory_sell_${saleTarget.entryId}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.gold > goldBeforeSale);

  const persistedProfile = persistence.loadProfileFromStorage();
  assert.ok(persistedProfile);
  assert.ok(persistedProfile.activeRunSnapshot);
});

test("profile persistence round-trips stash and run history beyond the active run snapshot", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 240;

  const vendorEquipment = state.run.town.vendor.stock.find((entry) => entry.kind === "equipment");
  assert.ok(vendorEquipment);
  let result = appEngine.useTownAction(state, `vendor_buy_${vendorEquipment.entryId}`);
  assert.equal(result.ok, true);

  const carriedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(carriedEquipment);
  result = appEngine.useTownAction(state, `inventory_stash_${carriedEquipment.entryId}`);
  assert.equal(result.ok, true);

  const savedProfile = persistence.loadProfileFromStorage();
  assert.ok(savedProfile);
  assert.equal(savedProfile.stash.entries.length, 1);
  assert.ok(savedProfile.activeRunSnapshot);

  const serializedProfile = persistence.serializeProfile(savedProfile);
  const restoredEnvelope = persistence.restoreProfile(serializedProfile);
  assert.ok(restoredEnvelope);
  assert.equal(restoredEnvelope.profile.stash.entries.length, 1);
  assert.ok(restoredEnvelope.profile.activeRunSnapshot);

  const lastPlayedClassId = state.run.classId;
  const abandonResult = appEngine.abandonSavedRun(state);
  assert.equal(abandonResult.ok, true);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.activeRunSnapshot, null);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
  assert.equal(archivedProfile.meta.progression.lastPlayedClassId, lastPlayedClassId);
  assert.ok(archivedProfile.meta.progression.classesPlayed.includes(lastPlayedClassId));

  const freshState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  assert.equal(freshState.ui.selectedClassId, lastPlayedClassId);
});

test("createAppState sanitizes persisted stash entries before town actions consume them", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const seededProfile = persistence.createEmptyProfile();
  seededProfile.stash.entries = [
    {
      entryId: "stash_blade",
      kind: "equipment",
      equipment: {
        entryId: "stash_blade",
        itemId: "item_short_sword",
        slot: "weapon",
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    },
    { entryId: "bad_rune", kind: "rune", runeId: "rune_missing" },
    { entryId: "dup", kind: "rune", runeId: "rune_el" },
    { entryId: "dup", kind: "rune", runeId: "rune_tir" },
    {
      entryId: "stash_armor",
      kind: "equipment",
      equipment: {
        entryId: "stash_armor",
        itemId: "item_quilted_armor",
        slot: "armor",
        socketsUnlocked: 1,
        insertedRunes: ["rune_el"],
        runewordId: "",
      },
    },
  ];

  storage.setItem(
    persistence.PROFILE_STORAGE_KEY,
    persistence.serializeProfile(seededProfile)
  );

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  assert.equal(state.profile.stash.entries.length, 4);
  const stashEntryIds = state.profile.stash.entries.map((entry) => entry.entryId);
  assert.equal(new Set(stashEntryIds).size, state.profile.stash.entries.length);
  assert.ok(state.profile.stash.entries.some((entry) => entry.entryId.startsWith("stash_")));

  const persistedProfile = persistence.loadProfileFromStorage();
  assert.ok(persistedProfile);
  assert.equal(persistedProfile.stash.entries.length, 4);
  assert.equal(new Set(persistedProfile.stash.entries.map((entry) => entry.entryId)).size, 4);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const withdrawTarget = state.profile.stash.entries[0];
  const result = appEngine.useTownAction(state, `stash_withdraw_${withdrawTarget.entryId}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.inventory.carried.length, 1);
  assert.equal(state.profile.stash.entries.length, 3);
});

test("front door can review, continue, and abandon an active saved run", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  assert.equal(appEngine.hasSavedRun(), true);

  appEngine.returnToFrontDoor(state);
  assert.equal(state.phase, appEngine.PHASES.FRONT_DOOR);
  assert.equal(appEngine.hasSavedRun(), true);

  const summary = appEngine.getSavedRunSummary();
  assert.ok(summary);
  assert.equal(summary.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(summary.className, state.registries.classes[0].name);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.WORLD_MAP);

  const abandonState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const abandonResult = appEngine.abandonSavedRun(abandonState);
  assert.equal(abandonResult.ok, true);
  assert.equal(abandonState.phase, appEngine.PHASES.FRONT_DOOR);
  assert.equal(appEngine.hasSavedRun(), false);
  assert.equal(appEngine.getSavedRunSummary(), null);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
});

test("app shell renders front-door, safe-zone, world-map, and reward shell surfaces", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Start Fresh/);
  assert.match(root.innerHTML, /Profile Hall/);
  assert.match(root.innerHTML, /First Run Guide/);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Town Services/);
  assert.match(root.innerHTML, /Departure Gate/);
  assert.match(root.innerHTML, /Progression Board/);
  assert.match(root.innerHTML, /World Ledger/);
  assert.match(root.innerHTML, /Departure Briefing/);
  assert.match(root.innerHTML, /Loadout Bench/);

  appEngine.leaveSafeZone(state);
  appEngine.returnToFrontDoor(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Saved Snapshot/);
  assert.match(root.innerHTML, /Continue Saved Run/);
  assert.match(root.innerHTML, /Abandon Saved Run/);

  state.ui.confirmAbandonSavedRun = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Discard This Run/);

  appEngine.continueSavedRun(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Route Overview/);
  assert.match(root.innerHTML, /Boss Pressure/);
  assert.match(root.innerHTML, /Map Guide/);
  assert.match(root.innerHTML, /Aftermath Nodes/);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Turn Guide/);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Choose One Reward/);
  assert.match(root.innerHTML, /Combat Reward/);
  assert.match(root.innerHTML, /Advance Guide/);
  assert.match(root.innerHTML, /Permanent Run Mutation/);
});

test("world-map and reward shell render node-specific quest and aftermath guidance", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  render();

  assert.match(root.innerHTML, /Quest Nodes/);
  assert.match(root.innerHTML, /Aftermath Nodes/);

  let questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  let questUnlockAttempts = 0;
  while (questZone?.status !== "available" && questUnlockAttempts < 5) {
    questUnlockAttempts += 1;
    const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
    const openingResult = appEngine.selectZone(state, openingZoneId);
    assert.equal(openingResult.ok, true);
    state.combat.outcome = "victory";
    appEngine.syncEncounterOutcome(state);
    appEngine.claimRewardAndAdvance(state, state.run.pendingReward.choices[0].id);
    assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
    questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  }

  assert.ok(questZone);
  assert.equal(questZone.status, "available");
  const questResult = appEngine.selectZone(state, questZone.id);
  assert.equal(questResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);

  render();
  assert.match(root.innerHTML, /Quest Resolution/);
  assert.match(root.innerHTML, /quest outcome/i);

  appEngine.claimRewardAndAdvance(state, state.run.pendingReward.choices[0].id);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  render();
  assert.match(root.innerHTML, /Triggered by/);

  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(eventZone);
  const eventResult = appEngine.selectZone(state, eventZone.id);
  assert.equal(eventResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "event");

  render();
  assert.match(root.innerHTML, /Aftermath Follow-Up/);
  assert.match(root.innerHTML, /Triggered by/);
});

test("action dispatcher drives the front-door continue and abandon shell flow", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, persistence, createActionTarget, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  appEngine.returnToFrontDoor(state);
  render();

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "prompt-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.confirmAbandonSavedRun, true);
  assert.match(root.innerHTML, /Discard This Run/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "cancel-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.confirmAbandonSavedRun, false);
  assert.doesNotMatch(root.innerHTML, /Discard This Run/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "continue-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.match(root.innerHTML, /Route Overview/);

  appEngine.returnToFrontDoor(state);
  render();

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "prompt-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "confirm-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.hasSavedRun(), false);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
});

test("reward choices can add a new card to the run deck", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const deckSizeBeforeReward = state.run.deck.length;
  appEngine.selectZone(state, openingZoneId);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const cardChoice = state.run.pendingReward.choices.find((choice) => choice.kind === "card");
  assert.ok(cardChoice);
  const cardId = cardChoice.effects.find((effect) => effect.kind === "add_card")?.cardId;
  assert.ok(cardId);

  appEngine.claimRewardAndAdvance(state, cardChoice.id);

  assert.equal(state.run.deck.length, deckSizeBeforeReward + 1);
  assert.ok(state.run.deck.includes(cardId));
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("equipment rewards persist on the run and feed the next encounter state", () => {
  const { content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const equipmentChoice = state.run.pendingReward.choices.find((choice) => {
    return choice.kind === "item" || choice.kind === "rune";
  });
  assert.ok(equipmentChoice);

  appEngine.claimRewardAndAdvance(state, equipmentChoice.id);

  const equipmentEffect = equipmentChoice.effects[0];
  if (equipmentEffect.kind === "equip_item") {
    const item = content.itemCatalog[equipmentEffect.itemId];
    assert.equal(state.run.loadout[item.slot]?.itemId, item.id);
  } else {
    const rune = content.runeCatalog[equipmentEffect.runeId];
    const slot = equipmentEffect.slot;
    assert.ok(slot);
    assert.ok(state.run.loadout[slot]);
    assert.ok(state.run.loadout[slot].insertedRunes.includes(rune.id));
  }

  const combatBonuses = itemSystem.buildCombatBonuses(state.run, content);
  const result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.hero.damageBonus, combatBonuses.heroDamageBonus || 0);
  assert.equal(state.combat.hero.guardBonus, combatBonuses.heroGuardBonus || 0);
  assert.equal(state.combat.hero.burnBonus, combatBonuses.heroBurnBonus || 0);
  assert.equal(state.combat.hero.maxLife, state.run.hero.maxLife + (combatBonuses.heroMaxLife || 0));
  assert.equal(state.combat.mercenary.attack, state.run.mercenary.attack + (combatBonuses.mercenaryAttack || 0));

  const target = state.combat.enemies[0];
  if ((combatBonuses.heroGuardBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_guard", cardId: "shield_slam" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_guard", target.id);
    assert.equal(state.combat.hero.guard, 4 + (combatBonuses.heroGuardBonus || 0));
    return;
  }

  if ((combatBonuses.heroDamageBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_damage", cardId: "quick_slash" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_damage", target.id);
    assert.equal(target.life, target.maxLife - (7 + (combatBonuses.heroDamageBonus || 0)));
    return;
  }

  if ((combatBonuses.heroBurnBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_burn", cardId: "fire_bolt" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_burn", target.id);
    assert.equal(target.burn, 2 + (combatBonuses.heroBurnBonus || 0));
    return;
  }

  assert.ok((combatBonuses.heroMaxLife || 0) > 0 || (combatBonuses.mercenaryAttack || 0) > 0);
});

test("itemization progression can open sockets and activate a runeword", () => {
  const { content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const applyChoice = (choice: RewardChoice) => {
    const result = itemSystem.applyChoice(state.run, choice, content);
    assert.equal(result.ok, true);
  };

  applyChoice({
    id: "equip_short_sword",
    kind: "item",
    title: "Short Sword",
    subtitle: "Equip Weapon",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
  });
  applyChoice({
    id: "socket_weapon_1",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_weapon_2",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_tir",
    kind: "rune",
    title: "Tir",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_tir" }],
  });
  applyChoice({
    id: "socket_el",
    kind: "rune",
    title: "El",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_el" }],
  });

  assert.equal(state.run.loadout.weapon?.itemId, "item_short_sword");
  assert.equal(Array.from(state.run.loadout.weapon?.insertedRunes || []).join(","), "rune_tir,rune_el");
  assert.equal(Array.from(itemSystem.getActiveRunewords(state.run, content)).join(","), "Steel");
  assert.equal(Array.from(state.run.progression.activatedRunewords || []).join(","), "steel");
  assert.equal(state.run.summary.runewordsForged, 1);

  const combatBonuses = itemSystem.buildCombatBonuses(state.run, content);
  assert.ok((combatBonuses.heroDamageBonus || 0) >= 5);
});

test("class and attribute progression spends survive snapshot restore and change derived combat bonuses", () => {
  const { content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.startRun(state);

  const classProgression = content.classProgressionCatalog?.[state.run.classId];
  assert.ok(classProgression);
  assert.ok(classProgression.trees.length > 0);

  const firstTreeId = classProgression.trees[0].id;
  const summarizeBonuses = (bonuses: ItemBonusSet) => {
    return Object.values(bonuses).reduce((total, value) => total + (Number.parseInt(String(value || 0), 10) || 0), 0);
  };

  const bonusesBefore = runFactory.buildCombatBonuses(state.run, content);
  state.run.progression.classPointsAvailable = 1;
  state.run.progression.attributePointsAvailable = 2;

  let result = appEngine.useTownAction(state, `progression_tree_${firstTreeId}`);
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(state, "progression_attribute_strength");
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(state, "progression_attribute_energy");
  assert.equal(result.ok, true);

  assert.equal(state.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(state.run.progression.classProgression.favoredTreeId, firstTreeId);
  assert.ok(state.run.progression.classProgression.unlockedSkillIds.length >= 1);
  assert.equal(state.run.progression.attributes.strength, 1);
  assert.equal(state.run.progression.attributes.energy, 1);

  const bonusesAfter = runFactory.buildCombatBonuses(state.run, content);
  assert.ok(summarizeBonuses(bonusesAfter) > summarizeBonuses(bonusesBefore));

  appEngine.leaveSafeZone(state);
  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(restoredSnapshot.run.progression.attributes.strength, 1);
  assert.equal(restoredSnapshot.run.progression.attributes.energy, 1);
  assert.ok(restoredSnapshot.run.progression.classProgression.unlockedSkillIds.length >= 1);

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, snapshot);
  assert.equal(importResult.ok, true);
  assert.equal(importedState.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(importedState.run.progression.attributes.strength, 1);
  assert.equal(importedState.run.progression.attributes.energy, 1);
  assert.ok(importedState.run.progression.classProgression.unlockedSkillIds.length >= 1);
});

test("boss rewards can grant progression points and saved summaries surface the new pools", () => {
  const { browserWindow, content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);

  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
  });
  const progressionChoice = rewardChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "class_point" || effect.kind === "attribute_point");
  });
  assert.ok(progressionChoice);

  const rewardResult = runFactory.applyReward(
    state.run,
    {
      zoneId: bossZone.id,
      zoneTitle: bossZone.title,
      kind: bossZone.kind,
      title: "Boss Reward",
      lines: [],
      grants: { gold: 0, xp: 0, potions: 0 },
      choices: rewardChoices,
      encounterNumber: 1,
      clearsZone: false,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: state.run.hero.currentLife,
      mercenaryLifeAfterFight: state.run.mercenary.currentLife,
    },
    progressionChoice.id,
    content
  );

  assert.equal(rewardResult.ok, true);
  assert.ok(state.run.progression.classPointsAvailable >= 1);
  assert.ok(state.run.progression.attributePointsAvailable >= 1);
  assert.ok(state.run.summary.classPointsEarned >= 1);
  assert.ok(state.run.summary.attributePointsEarned >= 1);

  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);
  const saveResult = persistence.saveToStorage(snapshot);
  assert.equal(saveResult.ok, true);

  const savedSummary = appEngine.getSavedRunSummary();
  assert.ok(savedSummary);
  assert.equal(savedSummary.classPointsAvailable, state.run.progression.classPointsAvailable);
  assert.equal(savedSummary.attributePointsAvailable, state.run.progression.attributePointsAvailable);
  assert.equal(savedSummary.unlockedClassSkills, state.run.progression.classProgression.unlockedSkillIds.length);
});

test("run rewards can level the party and snapshots restore the progressed run", () => {
  const { content, combatEngine, appEngine, itemSystem, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 73;
  const heroLifeBefore = state.run.hero.maxLife;
  const heroEnergyBefore = state.run.hero.maxEnergy;
  const mercenaryAttackBefore = state.run.mercenary.attack;

  const openingZone = runFactory.getCurrentZones(state.run)[0];
  const initialEquipmentChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: 1,
    encounterNumber: 1,
  });
  const initialItemEffect = initialEquipmentChoice?.effects.find((effect) => effect.kind === "equip_item");
  const initialItemId = initialItemEffect?.itemId || "";
  assert.ok(initialItemId);
  const initialItemTier = content.itemCatalog[initialItemId].progressionTier;
  const rewardResult = runFactory.applyReward(
    state.run,
    {
      zoneId: openingZone.id,
      zoneTitle: openingZone.title,
      kind: openingZone.kind,
      title: "Progress Test",
      lines: [],
      grants: { gold: 0, xp: 160, potions: 0 },
      choices: [
        {
          id: "noop",
          kind: "boon",
          title: "Noop",
          subtitle: "Noop",
          description: "",
          previewLines: [],
          effects: [],
        },
      ],
      encounterNumber: 1,
      clearsZone: false,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: state.run.hero.currentLife,
      mercenaryLifeAfterFight: state.run.mercenary.currentLife,
    },
    "noop",
    content
  );

  assert.equal(rewardResult.ok, true);
  assert.equal(state.run.level, 4);
  assert.equal(state.run.progression.skillPointsAvailable, 3);
  assert.equal(state.run.progression.training.vitality, 1);
  assert.equal(state.run.progression.training.focus, 1);
  assert.equal(state.run.progression.training.command, 1);
  assert.equal(state.run.summary.levelsGained, 3);
  assert.equal(state.run.summary.skillPointsEarned, 3);
  assert.equal(state.run.summary.trainingRanksGained, 3);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);
  assert.ok(state.run.hero.maxEnergy > heroEnergyBefore);
  assert.ok(state.run.mercenary.attack > mercenaryAttackBefore);

  const progressedCombatState = runFactory.createCombatOverrides(state.run, content);
  assert.ok(progressedCombatState.heroState.maxLife > heroLifeBefore);
  assert.ok(progressedCombatState.heroState.maxEnergy > heroEnergyBefore);
  assert.ok(progressedCombatState.mercenaryState.attack > mercenaryAttackBefore);

  const progressedEquipmentChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: 1,
    encounterNumber: 1,
  });
  const progressedItemEffect = progressedEquipmentChoice?.effects.find((effect) => effect.kind === "equip_item");
  const progressedItemId = progressedItemEffect?.itemId || "";
  assert.ok(progressedItemId);
  assert.ok(content.itemCatalog[progressedItemId].progressionTier > initialItemTier);

  appEngine.leaveSafeZone(state);
  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.schemaVersion, persistence.SCHEMA_VERSION);
  assert.equal(restoredSnapshot.run.level, state.run.level);
  assert.equal(restoredSnapshot.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(restoredSnapshot.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(restoredSnapshot.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(restoredSnapshot.run.progression.training.command, state.run.progression.training.command);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(resumedState.run.level, state.run.level);
  assert.equal(resumedState.run.gold, state.run.gold);
  assert.equal(resumedState.run.summary.levelsGained, state.run.summary.levelsGained);
  assert.equal(resumedState.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(resumedState.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(resumedState.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(resumedState.run.progression.training.command, state.run.progression.training.command);

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, snapshot);
  assert.equal(importResult.ok, true);
  assert.equal(importedState.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(importedState.run.level, state.run.level);
  assert.equal(importedState.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(importedState.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(importedState.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(importedState.run.progression.training.command, state.run.progression.training.command);
});

test("legacy snapshots migrate into the socketed equipment schema", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const legacyRun = JSON.parse(JSON.stringify(state.run));
  const heroLifeBeforeMigration = legacyRun.hero.maxLife;
  const heroEnergyBeforeMigration = legacyRun.hero.maxEnergy;
  legacyRun.loadout = {
    weapon: "item_short_sword",
    armor: "",
    weaponRune: "rune_el",
    armorRune: "",
  };
  legacyRun.xp = 100;
  legacyRun.level = 3;
  legacyRun.summary.levelsGained = 2;
  delete legacyRun.progression;

  const migrated = persistence.restoreSnapshot(legacyRun);
  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, persistence.SCHEMA_VERSION);
  assert.equal(migrated.run.loadout.weapon?.itemId, "item_short_sword");
  assert.equal(Array.from(migrated.run.loadout.weapon?.insertedRunes || []).join(","), "rune_el");
  assert.equal(migrated.run.loadout.weapon?.socketsUnlocked, 1);
  assert.equal(migrated.run.progression.skillPointsAvailable, 2);
  assert.equal(migrated.run.progression.training.vitality, 1);
  assert.equal(migrated.run.progression.training.focus, 1);
  assert.equal(migrated.run.progression.training.command, 0);
  assert.ok(migrated.run.hero.maxLife > heroLifeBeforeMigration);
  assert.ok(migrated.run.hero.maxEnergy > heroEnergyBeforeMigration);
});

test("upgrade rewards can upgrade a card already in the deck through the app flow", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "paladin");
  appEngine.startRun(state);
  state.run.deck = ["quick_slash"];
  appEngine.leaveSafeZone(state);

  const [openingZone, branchMinibossZone] = runFactory.getCurrentZones(state.run);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  appEngine.selectZone(state, branchMinibossZone.id);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const upgradeChoice: RewardChoice = {
    id: "manual_upgrade_quick_slash",
    kind: "upgrade",
    title: "Upgrade Quick Slash",
    subtitle: "Sharpen Skill",
    description: content.cardCatalog.quick_slash_plus.text,
    previewLines: [
      "Replace 1x Quick Slash with Quick Slash+.",
      "Keep deck size the same.",
    ],
    effects: [{ kind: "upgrade_card", fromCardId: "quick_slash", toCardId: "quick_slash_plus" }],
  };
  state.run.pendingReward.choices = [upgradeChoice];
  const upgradeEffect = upgradeChoice.effects.find((effect) => effect.kind === "upgrade_card");
  assert.ok(upgradeEffect);

  const fromCountBefore = state.run.deck.filter((cardId) => cardId === upgradeEffect.fromCardId).length;
  const toCountBefore = state.run.deck.filter((cardId) => cardId === upgradeEffect.toCardId).length;

  appEngine.claimRewardAndAdvance(state, upgradeChoice.id);

  assert.equal(state.run.deck.filter((cardId) => cardId === upgradeEffect.fromCardId).length, fromCountBefore - 1);
  assert.equal(state.run.deck.filter((cardId) => cardId === upgradeEffect.toCardId).length, toCountBefore + 1);
});

test("zone roles map to distinct encounter themes within the same act", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone, branchMinibossZone, branchBattleZone] = runFactory.getCurrentZones(state.run);
  assert.ok(openingZone.encounterIds.every((encounterId) => encounterId.startsWith("act_1_opening_")));
  assert.ok(branchMinibossZone.encounterIds.every((encounterId) => encounterId.startsWith("act_1_branch_miniboss")));
  assert.ok(
    branchBattleZone.encounterIds.every(
      (encounterId) => encounterId.startsWith("act_1_branch_battle") || encounterId.startsWith("act_1_branch_ambush")
    )
  );

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.match(state.run.activeEncounterId, /^act_1_branch_miniboss/);

  appEngine.returnToFrontDoor(state);
  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZoneAgain, , branchBattleZoneAgain] = runFactory.getCurrentZones(state.run);
  openingZoneAgain.encountersCleared = openingZoneAgain.encounterTotal;
  openingZoneAgain.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, branchBattleZoneAgain.id);
  assert.equal(result.ok, true);
  assert.match(state.run.activeEncounterId, /^act_1_branch_battle/);
});

test("quest world nodes resolve through the reward flow and persist outcomes on the run", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  assert.ok(questZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const selectResult = appEngine.selectZone(state, questZone.id);
  assert.equal(selectResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "quest");

  const choice = state.run.pendingReward.choices[0];
  const recordEffect = choice.effects.find((effect) => effect.kind === "record_quest_outcome");
  const heroLifeBefore = state.run.hero.maxLife;
  assert.ok(recordEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, choice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.ok(state.run.world.resolvedNodeIds.includes(questZone.id));
  assert.equal(state.run.world.questOutcomes[recordEffect.questId].outcomeId, recordEffect.outcomeId);
  assert.ok(runFactory.getZoneById(state.run, questZone.id).cleared);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);
});

test("shrine world nodes resolve through the reward flow and persist shrine outcomes on the run", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  assert.ok(shrineZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const selectResult = appEngine.selectZone(state, shrineZone.id);
  assert.equal(selectResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "shrine");

  const choice = state.run.pendingReward.choices[0];
  const recordEffect = choice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(recordEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, choice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.ok(state.run.world.resolvedNodeIds.includes(shrineZone.id));
  assert.equal(state.run.world.shrineOutcomes[recordEffect.nodeId].outcomeId, recordEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes(recordEffect.flagIds[0]));
  assert.ok(runFactory.getZoneById(state.run, shrineZone.id).cleared);
});

test("event world nodes branch off quest outcomes and persist follow-up consequences", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.equal(eventZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);

  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  let claimResult = appEngine.claimRewardAndAdvance(state, questChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(runFactory.getZoneById(state.run, eventZone.id).status, "available");

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "event");
  assert.equal(state.run.pendingReward.title, "Night Watch");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report")));

  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  const nodeEffect = eventChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  const followUpEffect = eventChoice.effects.find((effect) => effect.kind === "record_quest_follow_up");
  assert.ok(nodeEffect);
  assert.ok(followUpEffect);

  claimResult = appEngine.claimRewardAndAdvance(state, eventChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(state.run.world.eventOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.equal(state.run.world.questOutcomes[followUpEffect.questId].status, "follow_up_resolved");
  assert.equal(state.run.world.questOutcomes[followUpEffect.questId].followUpOutcomeId, followUpEffect.outcomeId);
  assert.ok(state.run.world.questOutcomes[followUpEffect.questId].consequenceIds.includes(followUpEffect.consequenceId));
  assert.ok(state.run.world.worldFlags.includes(nodeEffect.flagIds[0]));
});

test("opportunity world nodes resolve through the reward flow and extend the quest chain", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);
  assert.equal(runFactory.getZoneById(state.run, opportunityZone.id).status, "available");

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Scout Detachment");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));

  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Equip the Vanguard");
  assert.ok(opportunityChoice);
  const nodeEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  const consequenceEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_quest_consequence");
  assert.ok(nodeEffect);
  assert.ok(consequenceEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, opportunityChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.equal(state.run.world.questOutcomes[consequenceEffect.questId].status, "chain_resolved");
  assert.ok(state.run.world.questOutcomes[consequenceEffect.questId].consequenceIds.includes(consequenceEffect.consequenceId));
  assert.ok(state.run.world.worldFlags.includes(nodeEffect.flagIds[0]));
  assert.ok(runFactory.getZoneById(state.run, opportunityZone.id).cleared);
});

test("world-node state survives snapshot restore and continue", () => {
  const { content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices[0];
  const shrineEffect = shrineChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(shrineEffect);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  const questEffect = questChoice.effects.find((effect) => effect.kind === "record_quest_outcome");
  assert.ok(questEffect);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  const eventEffect = eventChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(eventEffect);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  const opportunityEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(opportunityEffect);
  appEngine.claimRewardAndAdvance(state, opportunityChoice.id);

  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.run.world.shrineOutcomes[shrineEffect.nodeId].outcomeId, shrineEffect.outcomeId);
  assert.equal(restoredSnapshot.run.world.eventOutcomes[eventEffect.nodeId].outcomeId, eventEffect.outcomeId);
  assert.equal(restoredSnapshot.run.world.opportunityOutcomes[opportunityEffect.nodeId].outcomeId, opportunityEffect.outcomeId);
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(shrineEffect.flagIds[0]));
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(eventEffect.flagIds[0]));
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(opportunityEffect.flagIds[0]));

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.run.world.shrineOutcomes[shrineEffect.nodeId].outcomeId, shrineEffect.outcomeId);
  assert.equal(resumedState.run.world.eventOutcomes[eventEffect.nodeId].outcomeId, eventEffect.outcomeId);
  assert.equal(resumedState.run.world.opportunityOutcomes[opportunityEffect.nodeId].outcomeId, opportunityEffect.outcomeId);
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "shrine"));
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "event"));
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "opportunity"));
});

test("legacy run snapshots backfill shrine, event, and opportunity nodes during hydrate", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const legacySnapshot = JSON.parse(appEngine.saveRunSnapshot(state));
  legacySnapshot.run.acts.forEach((act) => {
    act.zones = act.zones.filter((zone) => zone.kind !== "shrine" && zone.kind !== "event" && zone.kind !== "opportunity");
  });

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, JSON.stringify(legacySnapshot));
  assert.equal(importResult.ok, true);

  const zoneKinds = runFactory.getCurrentZones(importedState.run).map((zone) => zone.kind);
  assert.ok(zoneKinds.includes("shrine"));
  assert.ok(zoneKinds.includes("event"));
  assert.ok(zoneKinds.includes("opportunity"));

  const [openingZone] = runFactory.getCurrentZones(importedState.run);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(importedState.run);

  const questZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "quest");
  const shrineZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "shrine");
  const eventZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "opportunity");
  assert.equal(questZone.status, "available");
  assert.equal(shrineZone.status, "available");
  assert.equal(eventZone.status, "locked");
  assert.equal(opportunityZone.status, "locked");
});

test("world-node validation fails clearly when quest follow-up data is missing", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  delete catalog.quests[1].choices[0].followUp;

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.quests\.1\.choices\[0\] is missing follow-up event content\./);
});

test("world-node validation fails clearly when an opportunity choice is missing quest consequence data", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants[0].choices[0].effects = catalog.opportunities[1].variants[0].choices[0].effects.filter((effect) => {
    return effect.kind !== "record_quest_consequence";
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[0\]\.choices\[0\] is missing a valid record_quest_consequence effect\./);
});

test("event nodes fail cleanly when the required quest state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(questZone);
  assert.ok(eventZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  questZone.encountersCleared = questZone.encounterTotal;
  questZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved quest/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("opportunity nodes fail cleanly when the required follow-up state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  questZone.encountersCleared = questZone.encounterTotal;
  questZone.cleared = true;
  eventZone.encountersCleared = eventZone.encounterTotal;
  eventZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "primary_resolved",
    followUpNodeId: "",
    followUpOutcomeId: "",
    followUpOutcomeTitle: "",
    consequenceIds: [],
    flags: [],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires a resolved follow-up outcome/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("boss rewards transition into the next act instead of ending the run early", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "paladin");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone, branchZoneOne, branchZoneTwo] = runFactory.getCurrentZones(state.run);
  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  branchZoneOne.encountersCleared = branchZoneOne.encounterTotal;
  branchZoneOne.cleared = true;
  branchZoneTwo.encountersCleared = branchZoneTwo.encounterTotal;
  branchZoneTwo.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const boonChoice = state.run.pendingReward.choices.find((choice) => choice.kind === "boon");
  assert.ok(boonChoice);
  const heroLifeBeforeReward = state.run.hero.maxLife;
  const heroEnergyBeforeReward = state.run.hero.maxEnergy;
  const mercAttackBeforeReward = state.run.mercenary.attack;
  const beltMaxBeforeReward = state.run.belt.max;

  appEngine.claimRewardAndAdvance(state, boonChoice.id);

  assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
  assert.equal(state.run.summary.actsCleared, 1);
  assert.equal(state.run.summary.bossesDefeated, 1);
  assert.equal(state.run.progression.bossTrophies.length, 1);
  assert.equal(state.run.progression.bossTrophies[0], state.run.acts[0].boss.id);

  if (boonChoice.effects.some((effect) => effect.kind === "belt_capacity")) {
    assert.ok(state.run.belt.max > beltMaxBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "hero_max_energy")) {
    assert.ok(state.run.hero.maxEnergy > heroEnergyBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "hero_max_life")) {
    assert.ok(state.run.hero.maxLife > heroLifeBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "mercenary_attack")) {
    assert.ok(state.run.mercenary.attack > mercAttackBeforeReward);
  }

  appEngine.continueActTransition(state);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(state.run.currentActIndex, 1);
  assert.equal(state.run.safeZoneName, "Lut Gholein");
  assert.equal(state.run.hero.currentLife, state.run.hero.maxLife);
  assert.equal(state.run.belt.current, state.run.belt.max);

  appEngine.leaveSafeZone(state);
  const actTwoOpeningZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const nextResult = appEngine.selectZone(state, actTwoOpeningZoneId);
  assert.equal(nextResult.ok, true);
  assert.match(state.run.activeEncounterId, /^act_2_/);
});
