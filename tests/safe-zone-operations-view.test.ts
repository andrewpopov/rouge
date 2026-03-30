export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function createSafeZoneFixture() {
  const { content, combatEngine, appEngine, appShell, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);

  state.run.hero.currentLife = Math.max(1, state.run.hero.maxLife - 9);
  state.run.mercenary.currentLife = Math.max(1, state.run.mercenary.maxLife - 7);
  state.run.belt.current = Math.max(0, state.run.belt.max - 2);
  state.run.progression.skillPointsAvailable = 1;
  state.run.progression.classPointsAvailable = 1;
  state.run.world.questOutcomes.quest_alpha = {
    questId: "quest_alpha",
    zoneId: "act_1_blood_moor",
    title: "The Search For Cain",
    outcomeId: "mapped_road",
    outcomeTitle: "The road is mapped",
    actNumber: 1,
    status: "primary_resolved",
    consequenceIds: [],
    flags: [],
  } as QuestOutcomeRecord;
  state.run.world.shrineOutcomes.shrine_alpha = {
    nodeId: "shrine_alpha",
    zoneId: "act_1_blood_moor",
    title: "Old Cairn",
    outcomeId: "blessing_taken",
    outcomeTitle: "Blessing taken",
    actNumber: 1,
    flagIds: [],
  } as WorldNodeOutcomeRecord;
  state.run.world.eventOutcomes.event_alpha = {
    nodeId: "event_alpha",
    zoneId: "act_1_blood_moor",
    title: "Ash Trail",
    outcomeId: "scouts_routed",
    outcomeTitle: "Scouts routed",
    actNumber: 1,
    flagIds: [],
  } as WorldNodeOutcomeRecord;
  state.run.world.opportunityOutcomes.opportunity_alpha = {
    nodeId: "opportunity_alpha",
    zoneId: "act_1_blood_moor",
    title: "Moonlit Cache",
    outcomeId: "cache_opened",
    outcomeTitle: "Cache opened",
    actNumber: 1,
    flagIds: [],
  } as WorldNodeOutcomeRecord;
  state.run.loadout.weapon = {
    entryId: "weapon_entry_1",
    itemId: "short_sword",
    slot: "weapon",
    socketsUnlocked: 2,
    insertedRunes: ["tir"],
    runewordId: "steel",
  } as RunEquipmentState;

  return { state, appShell, browserWindow };
}

test("safe-zone shell exposes departure, build, and drilldown operations through one town contract", () => {
  const { state, appShell, browserWindow } = createSafeZoneFixture();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Departure Board/);
  assert.match(root.innerHTML, /Recommended next route: Blighted Moors is already open on the map\./);
  assert.match(root.innerHTML, /Recovery still available: hero 9 Life, mercenary 7 Life, belt 2 charges\./);
  assert.match(root.innerHTML, /Prep Desk/);
  assert.match(root.innerHTML, /Loadout Bench/);
  assert.match(root.innerHTML, /Build Carry-Through/);
  assert.match(root.innerHTML, /Camp Services/);
  assert.match(root.innerHTML, /Healing Desk/);
  assert.match(root.innerHTML, /Training Desk/);
  assert.match(root.innerHTML, /Trade Desk/);
  assert.match(root.innerHTML, /Mercenary Desk/);
  assert.match(root.innerHTML, /Ready To Leave Town\?/);
  assert.doesNotMatch(root.innerHTML, /Account Signals/);
  assert.doesNotMatch(root.innerHTML, /World Ledger/);
});

test("safe-zone operations module exposes a reusable model and standalone markup contract", () => {
  const { state, browserWindow } = createSafeZoneFixture();
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const operationsApi = browserWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW;
  const model = operationsApi.createOperationsModel(state, services);
  const markup = operationsApi.buildOperationsMarkup(state, services, model);

  assert.equal(model.worldOutcomeCount, 4);
  assert.equal(model.missingHeroLife, 9);
  assert.equal(model.missingMercenaryLife, 7);
  assert.equal(model.missingBelt, 2);
  assert.equal(model.routeSnapshot.nextZone?.title, "Blighted Moors");
  assert.equal(model.readinessTone, "available");
  assert.match(model.readinessIssues.join(" "), /Hero is missing 9 Life\./);
  assert.match(model.readinessIssues.join(" "), /Mercenary is missing 7 Life\./);
  assert.match(model.readinessIssues.join(" "), /Belt can still recover 2 charges\./);
  assert.match(markup, /Camp Services/);
  assert.match(markup, /Build Carry-Through/);
  assert.match(markup, /Trade Desk/);
  assert.match(markup, /Ready To Leave Town\?/);
  assert.doesNotMatch(markup, /Account Signals/);
});

test("safe-zone operations reveals debug-only ledger sections when debug mode is enabled", () => {
  const { state, browserWindow } = createSafeZoneFixture();
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  state.profile.meta.settings.debugMode.enabled = true;

  const markup = browserWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW.buildOperationsMarkup(state, services);

  assert.match(markup, /Debug Ledger/);
  assert.match(markup, /Account Signals/);
  assert.match(markup, /Prep Comparison Board/);
  assert.match(markup, /Live Account Bonuses/);
  assert.match(markup, /World Ledger/);
});
