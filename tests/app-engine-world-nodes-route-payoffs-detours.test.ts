export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
import {
  aliasShrineOpportunityOutcomeForReserve,
  aliasShrineOutcomeForCrossroad,
  clearAllMainlineZones,
} from "./helpers/world-node-route-fixtures";


test("recovery lane outcomes can retune the next branch battle encounter package", () => {
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

  const [_openingZone] = runFactory.getCurrentZones(state.run);
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
  assert.ok(recoveryZone);

  clearAllMainlineZones(runFactory, state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons") || state.run.pendingReward.choices[2];
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);
  aliasShrineOutcomeForCrossroad(state.run);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices[0];
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices[0];
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices[0];
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices[0];
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);
  aliasShrineOpportunityOutcomeForReserve(state.run);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices[0];
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices[0];
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices[0];
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices[0];
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices[0];
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters (old branchBattle role); they use the opening pool
  assert.ok(state.run.activeEncounterId);
});

test("accord lane outcomes can retune the next branch miniboss encounter package", () => {
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

  const [_openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => (zone.zoneRole || "").startsWith("side_") && zone.kind === "miniboss");
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
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons") || state.run.pendingReward.choices[2];
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);
  aliasShrineOutcomeForCrossroad(state.run);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices[0];
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices[0];
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices[0];
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices[0];
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);
  aliasShrineOpportunityOutcomeForReserve(state.run);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices[0];
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices[0];
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices[0];
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices[0];
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices[0];
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters (old branchMiniboss role); they use the opening pool
  assert.ok(state.run.activeEncounterId);
});

test("covenant lane outcomes can retune the act boss encounter package", () => {
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

  const allZones = runFactory.getCurrentZones(state.run);
  const _branchMinibossZone = allZones.find((z) => z.kind === "miniboss" && (z.zoneRole || "").startsWith("side_"));
  const _branchBattleZone = allZones.find((z) => z.kind === "battle" && (z.zoneRole || "").startsWith("side_"));
  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
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
  assert.ok(bossZone);
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
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons") || state.run.pendingReward.choices[2];
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);
  aliasShrineOutcomeForCrossroad(state.run);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices[0];
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices[0];
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const routeChoice = state.run.pendingReward.choices[0];
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices[0];
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);
  aliasShrineOpportunityOutcomeForReserve(state.run);

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices[0];
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices[0];
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  const relayChoice = state.run.pendingReward.choices[0];
  assert.ok(relayChoice);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  const culminationChoice = state.run.pendingReward.choices[0];
  assert.ok(culminationChoice);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  const legacyChoice = state.run.pendingReward.choices[0];
  assert.ok(legacyChoice);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, true);
  const reckoningChoice = state.run.pendingReward.choices[0];
  assert.ok(reckoningChoice);
  appEngine.claimRewardAndAdvance(state, reckoningChoice.id);

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices[0];
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, true);
  const accordChoice = state.run.pendingReward.choices[0];
  assert.ok(accordChoice);
  appEngine.claimRewardAndAdvance(state, accordChoice.id);

  result = appEngine.selectZone(state, covenantZone.id);
  assert.equal(result.ok, true);
  const covenantChoice = state.run.pendingReward.choices[0];
  assert.ok(covenantChoice);
  appEngine.claimRewardAndAdvance(state, covenantChoice.id);

  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.ok(state.run.activeEncounterId);
  assert.ok(state.combat.encounter.name);
  // Boss should have modifiers from the covenant route chain
  assert.ok(state.combat.encounter.modifiers.length > 0, "Expected boss to have route-chain modifiers");

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: bossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.ok(reward.grants.gold > 0);
  assert.ok(reward.grants.xp > 0);
  assert.ok(reward.grants.potions > 0);
});
