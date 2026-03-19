export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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
  assert.deepEqual(state.run.deck, content.classStarterDecks.sorceress);
  assert.ok(Object.keys(content.generatedActEncounterIds).length >= 5);
  assert.equal(appEngine.hasSavedRun(), true);
});

test("createAppState falls back to a fresh profile when persisted storage is malformed", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  storage.setItem(persistence.PROFILE_STORAGE_KEY, '{"broken":');
  storage.setItem(persistence.STORAGE_KEY, '{"broken":');

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  assert.equal(state.phase, appEngine.PHASES.FRONT_DOOR);
  assert.equal(state.profile.activeRunSnapshot, null);
  assert.equal(state.profile.runHistory.length, 0);
  assert.equal(appEngine.hasSavedRun(), false);
  assert.equal(appEngine.getSavedRunSummary(), null);
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
  const result = appEngine.selectZone(state, openingZoneId);
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
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  const zone = runFactory.getZoneById(state.run, openingZoneId);
  assert.equal(zone.encountersCleared, 1);
  assert.equal(zone.cleared, false);
  assert.equal(state.run.hero.currentLife, 33);
  assert.equal(state.run.belt.current, 1);
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

  // Kill current mercenary, then revive via town service (act-filtered: only act mercs available)
  state.run.mercenary.currentLife = 0;
  const currentMercId = state.run.mercenary.id;
  const goldAfterRecovery = state.run.gold;
  result = appEngine.useTownAction(state, `mercenary_contract_${currentMercId}`);
  assert.equal(result.ok, true);
  assert.ok(state.run.mercenary.currentLife > 0);
  assert.ok(state.run.gold < goldAfterRecovery);

  appEngine.leaveSafeZone(state);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  result = appEngine.selectZone(state, openingZoneId);
  assert.equal(result.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  // Fight through the second encounter so the zone clears and we reach world_map
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  appEngine.claimRewardAndAdvance(state);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  result = appEngine.returnToSafeZone(state);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(runFactory.getZoneById(state.run, openingZoneId).encountersCleared, 2);
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
