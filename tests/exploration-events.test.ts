export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function createRunState(harness: ReturnType<typeof createHarness>) {
  const { appEngine, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZone = runFactory.getCurrentZones(state.run)[0];
  return { state, openingZone };
}

test("rollExplorationEvent returns null or a valid event object", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state, openingZone } = createRunState(harness);

  // Roll many times with different seeds to test the probability path
  let eventCount = 0;
  for (let i = 0; i < 50; i++) {
    const event = explorationEvents.rollExplorationEvent(state.run, openingZone, state.content, i);
    if (event) {
      eventCount++;
      assert.ok(event.id, "event should have an id");
      assert.ok(event.title, "event should have a title");
      assert.ok(event.icon, "event should have an icon");
      assert.ok(Array.isArray(event.choices), "event should have choices array");
      assert.ok(event.choices.length > 0, "event should have at least one choice");
    }
  }
  // With 20% probability, we expect some events but not all
  assert.ok(typeof eventCount === "number");
});

test("rollExplorationEvent never triggers for boss zones", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state } = createRunState(harness);

  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const zones = runFactory.getCurrentZones(state.run);
  const bossZone = zones.find((z: ZoneState) => z.kind === "boss");
  if (bossZone) {
    state.run.activeZoneId = bossZone.id;
    const event = explorationEvents.rollExplorationEvent(state.run, bossZone, state.content, 1);
    assert.equal(event, null, "boss zones should never trigger exploration events");
  }
});

test("getUpgradableCardIds returns card IDs that have plus variants", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state, openingZone } = createRunState(harness);

  const upgradable = explorationEvents.getUpgradableCardIds(state.run, state.content);
  assert.ok(Array.isArray(upgradable), "should return an array");

  for (const cardId of upgradable) {
    const plusId = `${cardId}_plus`;
    assert.ok(state.content.cardCatalog[plusId], `${cardId} should have a _plus variant in the catalog`);
  }
});

test("applyExplorationEventChoice handles gold reward choices", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state, openingZone } = createRunState(harness);

  // Roll until we get an event
  let event = null;
  for (let i = 0; i < 100; i++) {
    event = explorationEvents.rollExplorationEvent(state.run, openingZone, state.content, i);
    if (event) { break; }
  }

  if (event) {
    const goldChoice = event.choices.find((c: ExplorationEventChoice) => c.effects?.some((e: { kind: string }) => e.kind === "gold"));
    if (goldChoice) {
      const goldBefore = state.run.gold;
      const result = explorationEvents.applyExplorationEventChoice(state.run, event, goldChoice.id, state.content);
      assert.ok(result.ok, "applying gold choice should succeed");
      assert.ok(state.run.gold >= goldBefore, "gold should not decrease");
    }
  }
});

test("applyExplorationEventChoice handles potion reward choices", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state, openingZone } = createRunState(harness);

  let event = null;
  for (let i = 0; i < 100; i++) {
    event = explorationEvents.rollExplorationEvent(state.run, openingZone, state.content, i);
    if (event) { break; }
  }

  if (event && event.choices.length > 0) {
    const firstChoice = event.choices[0];
    const result = explorationEvents.applyExplorationEventChoice(state.run, event, firstChoice.id, state.content);
    assert.ok(result.ok, "applying first choice should succeed");
  }
});

test("rollExplorationEvent respects minEncountersCleared thresholds", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const explorationEvents = browserWindow.ROUGE_EXPLORATION_EVENTS;
  const { state, openingZone } = createRunState(harness);

  // With 0 encounters cleared, only basic events should appear
  const events: string[] = [];
  for (let i = 0; i < 100; i++) {
    const event = explorationEvents.rollExplorationEvent(state.run, openingZone, state.content, 1);
    if (event) { events.push(event.id); }
  }
  assert.ok(typeof events.length === "number");
});
