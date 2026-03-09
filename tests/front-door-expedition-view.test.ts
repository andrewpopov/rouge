export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

test("front-door expedition module renders fresh-start and route-resume sections", () => {
  const { content, combatEngine, appEngine, browserWindow, seedBundle } = createHarness();
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const expeditionView = browserWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  let markup = expeditionView.buildExpeditionSectionMarkup(state, services, null);
  assert.match(markup, /Open A New Expedition/);
  assert.match(markup, /Enter Character Hall/);

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);
  assert.equal(appEngine.leaveSafeZone(state).ok, true);
  appEngine.returnToFrontDoor(state);

  const savedRunSummary = appEngine.getSavedRunSummary();
  assert.ok(savedRunSummary);
  const accountSummary = appEngine.getAccountProgressSummary(state);

  markup = expeditionView.buildExpeditionSectionMarkup(state, services, savedRunSummary);
  assert.match(markup, /Resume Expedition/);
  assert.match(markup, /Route intel, blocked nodes, and the next zone choice are the first read on return\./);

  const navigatorMarkup = expeditionView.buildHallNavigatorMarkup(state, services, savedRunSummary, accountSummary);
  assert.match(navigatorMarkup, /Route Resume/);
  assert.match(navigatorMarkup, /World Map/);

  const decisionMarkup = expeditionView.buildHallDecisionSupportMarkup(state, services, savedRunSummary, accountSummary);
  assert.match(decisionMarkup, /Resume Route Board/);
  assert.match(decisionMarkup, /Resume focus: Route Decision\./);
});

test("front-door expedition module keeps reward recovery guidance phase-specific", () => {
  const { content, combatEngine, appEngine, browserWindow, runFactory, seedBundle } = createHarness();
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const expeditionView = browserWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);
  assert.equal(appEngine.leaveSafeZone(state).ok, true);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  assert.equal(appEngine.selectZone(state, openingZoneId).ok, true);
  state.combat.outcome = "victory";
  assert.equal(appEngine.syncEncounterOutcome(state).ok, true);
  appEngine.returnToFrontDoor(state);

  const savedRunSummary = appEngine.getSavedRunSummary();
  assert.ok(savedRunSummary);
  assert.equal(savedRunSummary.phase, appEngine.PHASES.REWARD);
  const accountSummary = appEngine.getAccountProgressSummary(state);

  const expeditionMarkup = expeditionView.buildExpeditionSectionMarkup(state, services, savedRunSummary);
  assert.match(expeditionMarkup, /Mutation Claim/);

  const decisionMarkup = expeditionView.buildHallDecisionSupportMarkup(state, services, savedRunSummary, accountSummary);
  assert.match(decisionMarkup, /Resolve Pending Reward/);
  assert.match(decisionMarkup, /A reward claim is parked, so one mutation must resolve before the route moves again\./);

  const guidedMarkup = expeditionView.buildGuidedStartMarkup(state, services, savedRunSummary);
  assert.match(guidedMarkup, /Next shell: Reward\./);
});
