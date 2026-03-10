export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function clearAllMainlineZones(runFactory, run) {
  const zones = runFactory.getCurrentZones(run);
  const mainlineZones = zones.filter(
    (z) => z.kind === "battle" && (z.zoneRole === "opening" || (z.zoneRole || "").startsWith("mainline_")) && !z.zoneRole?.startsWith("side_")
  );
  for (const z of mainlineZones) {
    z.encountersCleared = z.encounterTotal;
    z.cleared = true;
  }
  runFactory.recomputeZoneStatuses(run);
}

test("legacy mercenary route perks feed the next combat after the full post-culmination route resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "battle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 5);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 5);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 5);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 5);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 5);
  assert.equal(state.combat.hero.guard, 5);
  assert.equal(state.combat.hero.damageBonus, 5);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 5);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Last Wayfinders")));
});

test("reckoning opportunity lanes unlock alongside legacy and pay off reserve plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.equal(reckoningZone.status, "locked");

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Reckoning");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier reserve lane: ${reserveChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  const reckoningEffect = reckoningChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(reckoningEffect);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[reckoningEffect.nodeId].outcomeId, reckoningEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_reckoning_chapel_ledger"));
  assert.ok(runFactory.getZoneById(state.run, reckoningZone.id).cleared);
});

test("recovery opportunity lanes unlock alongside legacy and reckoning and pay off shrine plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.equal(recoveryZone.status, "locked");
  assert.equal(accordZone.status, "locked");

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, recoveryZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, accordZone.id).status, "available");

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Lantern Recovery");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier shrine lane: ${shrineOpportunityChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  const recoveryEffect = recoveryChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(recoveryEffect);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[recoveryEffect.nodeId].outcomeId, recoveryEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_recovery_chapel_lanterns"));
  assert.ok(runFactory.getZoneById(state.run, recoveryZone.id).cleared);
});

test("accord opportunity lanes unlock alongside the other late routes and pay off shrine plus crossroad plus culmination together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.equal(accordZone.status, "locked");

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, reckoningZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, recoveryZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, accordZone.id).status, "available");

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Accord");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier shrine lane: ${shrineOpportunityChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier crossroad: ${crossroadChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  const accordEffect = accordChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(accordEffect);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[accordEffect.nodeId].outcomeId, accordEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_accord_cloister_paths"));
  assert.ok(runFactory.getZoneById(state.run, accordZone.id).cleared);
});

test("covenant opportunity lanes unlock after the full late-route quartet resolves and pay off every late lane together", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);
  assert.equal(covenantZone.status, "locked");

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  assert.equal(runFactory.getZoneById(state.run, covenantZone.id).status, "available");

  result = appEngine.selectZone(state, covenantZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Wayfinder Covenant");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier legacy lane: ${legacyChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier reckoning lane: ${reckoningChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier recovery lane: ${recoveryChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier accord lane: ${accordChoice.title}.`)));

  const covenantChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Seal the Wayfinder Ledger");
  assert.ok(covenantChoice);
  const covenantEffect = covenantChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(covenantEffect);
  appEngine.claimRewardAndAdvance(state, covenantChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[covenantEffect.nodeId].outcomeId, covenantEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_covenant_wayfinder_ledger"));
  assert.ok(runFactory.getZoneById(state.run, covenantZone.id).cleared);
});

test("accord mercenary route perks feed the next combat once the accord lane resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "battle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(accordZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 5);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 5);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 5);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 5);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 5);
  assert.equal(state.combat.hero.guard, 5);
  assert.equal(state.combat.hero.damageBonus, 5);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 5);
  assert.ok(state.combat.log.some((line) => line.includes("Cloister Accord")));
});

test("reckoning mercenary route perks stack with legacy after the parallel post-culmination lanes resolve", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "battle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 6);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 6);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 6);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 6);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 6);
  assert.equal(state.combat.hero.guard, 6);
  assert.equal(state.combat.hero.damageBonus, 6);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 6);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Chapel Reckoning")));
});

test("recovery mercenary route perks stack with the parallel post-culmination lanes after recovery resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "battle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 7);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 7);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 7);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 7);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 7);
  assert.equal(state.combat.hero.guard, 7);
  assert.equal(state.combat.hero.damageBonus, 7);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 7);
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Legacy")));
  assert.ok(state.combat.log.some((line) => line.includes("Chapel Reckoning")));
  assert.ok(state.combat.log.some((line) => line.includes("Lantern Recovery")));
});

test("covenant mercenary route perks feed the next combat once the covenant lane resolves", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "battle");
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Break the Last Chapel Ledger");
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Recount the Cloister Paths");
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, covenantZone.id);
  assert.equal(result.ok, true);
  const covenantChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Seal the Wayfinder Ledger");
  assert.ok(covenantChoice);
  appEngine.claimRewardAndAdvance(state, covenantChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 9);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 9);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 9);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 9);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 9);
  assert.equal(state.combat.hero.guard, 9);
  assert.equal(state.combat.hero.damageBonus, 9);
  assert.equal(state.combat.hand.length, Math.min(state.run.deck.length, state.combat.hero.handSize + 9));
  assert.ok(state.combat.log.some((line) => line.includes("Wayfinder Covenant")));
});
