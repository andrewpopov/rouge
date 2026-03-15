export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  questZone.encountersCleared = questZone.encounterTotal;
  questZone.cleared = true;
  eventZone.encountersCleared = eventZone.encounterTotal;
  eventZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
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

test("crossroad opportunity nodes fail cleanly when the shrine state is missing", () => {
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
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  assert.ok(shrineZone);
  assert.ok(eventZone);
  assert.ok(crossroadZone);
  assert.ok(questZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  shrineZone.encountersCleared = shrineZone.encounterTotal;
  shrineZone.cleared = true;
  eventZone.encountersCleared = eventZone.encounterTotal;
  eventZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved shrine/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("reserve opportunity nodes fail cleanly when the crossroad state is missing", () => {
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
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  opportunityZone.encountersCleared = opportunityZone.encounterTotal;
  opportunityZone.cleared = true;
  shrineOpportunityZone.encountersCleared = shrineOpportunityZone.encounterTotal;
  shrineOpportunityZone.cleared = true;
  crossroadZone.encountersCleared = crossroadZone.encounterTotal;
  crossroadZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_route_opportunity = {
    nodeId: "sunwell_route_opportunity",
    zoneId: opportunityZone.id,
    actNumber: 1,
    title: "Sunwell Route Opportunity",
    outcomeId: "drive_the_lance_column",
    outcomeTitle: "Drive the Lance Column",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_lance_column"],
  };
  state.run.world.opportunityOutcomes.sunwell_shrine_opportunity = {
    nodeId: "sunwell_shrine_opportunity",
    zoneId: shrineOpportunityZone.id,
    actNumber: 1,
    title: "Sunwell Shrine Opportunity",
    outcomeId: "raise_the_signal_lanterns",
    outcomeTitle: "Raise the Signal Lanterns",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_shrine_signal_lanterns"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved crossroad opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("relay opportunity nodes fail cleanly when the reserve state is missing", () => {
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

  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  assert.ok(reserveZone);
  assert.ok(relayZone);

  reserveZone.encountersCleared = reserveZone.encounterTotal;
  reserveZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved reserve opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("culmination opportunity nodes fail cleanly when the relay state is missing", () => {
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
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  relayZone.encountersCleared = relayZone.encounterTotal;
  relayZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved relay opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("legacy opportunity nodes fail cleanly when the culmination state is missing", () => {
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
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved culmination opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("reckoning opportunity nodes fail cleanly when the reserve state is missing", () => {
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
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(reckoningZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_culmination_opportunity = {
    nodeId: "sunwell_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Sunwell Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved reserve opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("recovery opportunity nodes fail cleanly when the shrine state is missing", () => {
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
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(recoveryZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_culmination_opportunity = {
    nodeId: "sunwell_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Sunwell Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved shrine opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("accord opportunity nodes fail cleanly when the crossroad state is missing", () => {
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
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(culminationZone);
  assert.ok(accordZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_shrine_opportunity = {
    nodeId: "sunwell_shrine_opportunity",
    zoneId: shrineOpportunityZone.id,
    actNumber: 1,
    title: "Sunwell Shrine Opportunity",
    outcomeId: "raise_the_signal_lanterns",
    outcomeTitle: "Raise the Signal Lanterns",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_shrine_signal_lanterns"],
  };
  state.run.world.opportunityOutcomes.sunwell_culmination_opportunity = {
    nodeId: "sunwell_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Sunwell Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved crossroad opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("covenant opportunity nodes fail cleanly when the accord state is missing", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
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
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  legacyZone.encountersCleared = legacyZone.encounterTotal;
  legacyZone.cleared = true;
  reckoningZone.encountersCleared = reckoningZone.encounterTotal;
  reckoningZone.cleared = true;
  recoveryZone.encountersCleared = recoveryZone.encounterTotal;
  recoveryZone.cleared = true;
  accordZone.encountersCleared = accordZone.encounterTotal;
  accordZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_legacy_opportunity = {
    nodeId: "sunwell_legacy_opportunity",
    zoneId: legacyZone.id,
    actNumber: 1,
    title: "Sunwell Legacy",
    outcomeId: "extend_the_wayfinder_chain",
    outcomeTitle: "Extend the Wayfinder Chain",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_legacy_wayfinder_chain"],
  };
  state.run.world.opportunityOutcomes.sunwell_reckoning_opportunity = {
    nodeId: "sunwell_reckoning_opportunity",
    zoneId: reckoningZone.id,
    actNumber: 1,
    title: "Sunwell Reckoning",
    outcomeId: "break_the_last_chapel_ledger",
    outcomeTitle: "Break the Last Chapel Ledger",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_reckoning_chapel_ledger"],
  };
  state.run.world.opportunityOutcomes.sunwell_recovery_opportunity = {
    nodeId: "sunwell_recovery_opportunity",
    zoneId: recoveryZone.id,
    actNumber: 1,
    title: "Sunwell Recovery",
    outcomeId: "rehang_the_chapel_lanterns",
    outcomeTitle: "Rehang the Chapel Lanterns",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_recovery_chapel_lanterns"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  assert.throws(() => {
    browserWindow.ROUGE_WORLD_NODES.buildZoneReward({ run: state.run, zone: covenantZone });
  }, /requires resolved accord opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("detour opportunity nodes fail cleanly when the covenant state is missing", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
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
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const detourZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "detour_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(detourZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  recoveryZone.encountersCleared = recoveryZone.encounterTotal;
  recoveryZone.cleared = true;
  accordZone.encountersCleared = accordZone.encounterTotal;
  accordZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_recovery_opportunity = {
    nodeId: "sunwell_recovery_opportunity",
    zoneId: recoveryZone.id,
    actNumber: 1,
    title: "Sunwell Recovery",
    outcomeId: "rehang_the_chapel_lanterns",
    outcomeTitle: "Rehang the Chapel Lanterns",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_recovery_chapel_lanterns"],
  };
  state.run.world.opportunityOutcomes.sunwell_accord_opportunity = {
    nodeId: "sunwell_accord_opportunity",
    zoneId: accordZone.id,
    actNumber: 1,
    title: "Sunwell Accord",
    outcomeId: "recount_the_cloister_paths",
    outcomeTitle: "Recount the Cloister Paths",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_accord_cloister_paths"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  assert.throws(() => {
    browserWindow.ROUGE_WORLD_NODES.buildZoneReward({ run: state.run, zone: detourZone });
  }, /requires resolved covenant opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("escalation opportunity nodes fail cleanly when the legacy state is missing", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
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
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  const escalationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "escalation_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(reckoningZone);
  assert.ok(covenantZone);
  assert.ok(escalationZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  reckoningZone.encountersCleared = reckoningZone.encounterTotal;
  reckoningZone.cleared = true;
  covenantZone.encountersCleared = covenantZone.encounterTotal;
  covenantZone.cleared = true;
  state.run.world.questOutcomes.lost_reliquary = {
    questId: "lost_reliquary",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Lost Reliquary",
    outcomeId: "seal_the_chamber",
    outcomeTitle: "Seal the Chamber",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "relay_to_the_caravan",
    followUpOutcomeTitle: "Relay to the Caravan",
    consequenceIds: ["caravan_warded"],
    flags: ["lost_reliquary_caravan_warded"],
  };
  state.run.world.opportunityOutcomes.sunwell_reckoning_opportunity = {
    nodeId: "sunwell_reckoning_opportunity",
    zoneId: reckoningZone.id,
    actNumber: 1,
    title: "Sunwell Reckoning",
    outcomeId: "break_the_last_chapel_ledger",
    outcomeTitle: "Break the Last Chapel Ledger",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_reckoning_chapel_ledger"],
  };
  state.run.world.opportunityOutcomes.sunwell_covenant_opportunity = {
    nodeId: "sunwell_covenant_opportunity",
    zoneId: covenantZone.id,
    actNumber: 1,
    title: "Sunwell Covenant",
    outcomeId: "seal_the_wayfinder_ledger",
    outcomeTitle: "Seal the Wayfinder Ledger",
    linkedQuestId: "lost_reliquary",
    flagIds: ["sunwell_covenant_wayfinder_ledger"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  assert.throws(() => {
    browserWindow.ROUGE_WORLD_NODES.buildZoneReward({ run: state.run, zone: escalationZone });
  }, /requires resolved legacy opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

