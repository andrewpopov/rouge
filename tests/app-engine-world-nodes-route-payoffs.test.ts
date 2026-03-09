export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

type ResolveActOneToCovenantOptions = {
  routeChoiceTitle?: string;
  crossroadChoiceTitle?: string;
  accordChoiceTitle?: string;
  covenantChoiceTitle?: string;
};

function getRequiredZone(state, runFactory, label, predicate) {
  const zones = runFactory.getCurrentZones(state.run);
  const zone = zones.find(predicate);
  assert.ok(zone, `Missing ${label} zone. Current zones: ${zones.map((candidate) => candidate.id).join(", ")}`);
  return zone;
}

function getRequiredChoice(state, title) {
  const choices = Array.isArray(state.run?.pendingReward?.choices) ? state.run.pendingReward.choices : [];
  const choice = choices.find((candidate) => candidate.title === title);
  assert.ok(choice, `Missing reward choice "${title}". Available: ${choices.map((candidate) => candidate.title).join(", ")}`);
  return choice;
}

function selectZoneAndClaimChoice(state, appEngine, runFactory, label, predicate, choiceTitle) {
  const zone = getRequiredZone(state, runFactory, label, predicate);
  const result = appEngine.selectZone(state, zone.id);
  assert.equal(result.ok, true, `Expected ${label} zone ${zone.id} to be selectable.`);
  const choice = getRequiredChoice(state, choiceTitle);
  assert.equal(appEngine.claimRewardAndAdvance(state, choice.id).ok, true);
  return { zone, choice };
}

function resolveActOneToCovenant(
  state,
  appEngine,
  runFactory,
  options: ResolveActOneToCovenantOptions | string = "Seal the Wayfinder Ledger"
) {
  const normalizedOptions: ResolveActOneToCovenantOptions =
    typeof options === "string" ? { covenantChoiceTitle: options } : options || {};
  const routeChoiceTitle = normalizedOptions.routeChoiceTitle || "Signal the Crossroads";
  const crossroadChoiceTitle = normalizedOptions.crossroadChoiceTitle || "Assign the Hidden Wayfinders";
  const accordChoiceTitle = normalizedOptions.accordChoiceTitle || "Recount the Cloister Paths";
  const covenantChoiceTitle = normalizedOptions.covenantChoiceTitle || "Seal the Wayfinder Ledger";
  const [openingZone, branchMinibossZone, branchBattleZone] = runFactory.getCurrentZones(state.run);
  const bossZone = getRequiredZone(state, runFactory, "boss", (zone) => zone.kind === "boss");
  const legacyZone = getRequiredZone(state, runFactory, "legacy opportunity", (zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = getRequiredZone(
    state,
    runFactory,
    "reckoning opportunity",
    (zone) => zone.nodeType === "reckoning_opportunity"
  );
  const recoveryZone = getRequiredZone(state, runFactory, "recovery opportunity", (zone) => zone.nodeType === "recovery_opportunity");
  const detourZone = getRequiredZone(state, runFactory, "detour opportunity", (zone) => zone.nodeType === "detour_opportunity");
  const escalationZone = getRequiredZone(
    state,
    runFactory,
    "escalation opportunity",
    (zone) => zone.nodeType === "escalation_opportunity"
  );

  assert.ok(openingZone);
  assert.ok(branchMinibossZone);
  assert.ok(branchBattleZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  selectZoneAndClaimChoice(state, appEngine, runFactory, "shrine", (zone) => zone.kind === "shrine", "Blessing of Beacons");
  selectZoneAndClaimChoice(state, appEngine, runFactory, "quest", (zone) => zone.kind === "quest", "Take Scout Report");
  selectZoneAndClaimChoice(state, appEngine, runFactory, "event", (zone) => zone.kind === "event", "Mark the Paths");
  selectZoneAndClaimChoice(state, appEngine, runFactory, "opportunity", (zone) => zone.nodeType === "opportunity", routeChoiceTitle);
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "shrine opportunity",
    (zone) => zone.nodeType === "shrine_opportunity",
    "Raise the Signal Lanterns"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "crossroad opportunity",
    (zone) => zone.nodeType === "crossroad_opportunity",
    crossroadChoiceTitle
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "reserve opportunity",
    (zone) => zone.nodeType === "reserve_opportunity",
    "Cache the Hidden Reserve"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "relay opportunity",
    (zone) => zone.nodeType === "relay_opportunity",
    "Extend the Hidden Chain"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "culmination opportunity",
    (zone) => zone.nodeType === "culmination_opportunity",
    "Commission the Last Wayfinders"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "legacy opportunity",
    (zone) => zone.nodeType === "legacy_opportunity",
    "Extend the Wayfinder Chain"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "reckoning opportunity",
    (zone) => zone.nodeType === "reckoning_opportunity",
    "Break the Last Chapel Ledger"
  );
  selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "recovery opportunity",
    (zone) => zone.nodeType === "recovery_opportunity",
    "Rehang the Chapel Lanterns"
  );
  const { zone: accordZone } = selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "accord opportunity",
    (zone) => zone.nodeType === "accord_opportunity",
    accordChoiceTitle
  );
  const { zone: covenantZone } = selectZoneAndClaimChoice(
    state,
    appEngine,
    runFactory,
    "covenant opportunity",
    (zone) => zone.nodeType === "covenant_opportunity",
    covenantChoiceTitle
  );

  return {
    accordZone,
    bossZone,
    branchBattleZone,
    branchMinibossZone,
    covenantZone,
    detourZone,
    escalationZone,
    legacyZone,
    recoveryZone,
    reckoningZone,
  };
}

test("legacy opportunity lanes unlock after culmination and pay off the culmination lane one more time", () => {
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
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
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
  assert.equal(legacyZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

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

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Last Wayfinders Legacy");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const legacyChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Wayfinder Chain");
  assert.ok(legacyChoice);
  const legacyEffect = legacyChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(legacyEffect);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[legacyEffect.nodeId].outcomeId, legacyEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_legacy_wayfinder_chain"));
  assert.ok(runFactory.getZoneById(state.run, legacyZone.id).cleared);
});

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

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchBattle");
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

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

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

  result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, true);
  const recoveryChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Rehang the Chapel Lanterns");
  assert.ok(recoveryChoice);
  appEngine.claimRewardAndAdvance(state, recoveryChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_branch_recovery");
  assert.equal(state.combat.encounter.name, "Monastery Recovery Line");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "triage_command"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 20);
  assert.equal(reward.grants.xp, 13);
  assert.equal(reward.grants.potions, 1);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Lantern Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("Recovery stores from the chapel lantern line")));
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

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const branchZone = runFactory.getCurrentZones(state.run).find((zone) => zone.zoneRole === "branchMiniboss");
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

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

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
  assert.equal(state.run.activeEncounterId, "act_1_miniboss_accord");
  assert.equal(state.combat.encounter.name, "Burial Grounds Accord Host");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "escort_command"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "elite_onslaught"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 30);
  assert.equal(reward.grants.xp, 18);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Cloister Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("next miniboss clear into a richer contract payout")));
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

  const [openingZone, branchMinibossZone, branchBattleZone] = runFactory.getCurrentZones(state.run);
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

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

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

  branchMinibossZone.encountersCleared = branchMinibossZone.encounterTotal;
  branchMinibossZone.cleared = true;
  branchBattleZone.encountersCleared = branchBattleZone.encounterTotal;
  branchBattleZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_boss_covenant");
  assert.equal(state.combat.encounter.name, "Catacomb Covenant");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "boss_screen"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "sniper_nest"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: bossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 50);
  assert.equal(reward.grants.xp, 32);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Wayfinder Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("act boss reward into a true late-route settlement")));
});

test("post-covenant detour and escalation lanes unlock together and pay off different late-route states", () => {
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

  const { detourZone, escalationZone } = resolveActOneToCovenant(state, appEngine, runFactory);
  assert.equal(runFactory.getZoneById(state.run, detourZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, escalationZone.id).status, "available");

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Wayfinder Detour");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier recovery lane: Rehang the Chapel Lanterns.")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier accord lane: Recount the Cloister Paths.")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier covenant lane: Seal the Wayfinder Ledger.")));
  const detourChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Stage the Hidden Abbey Convoy");
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Catacomb Escalation");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier legacy lane: Extend the Wayfinder Chain.")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier reckoning lane: Break the Last Chapel Ledger.")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier covenant lane: Seal the Wayfinder Ledger.")));
  const escalationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Drive the Catacomb Surge");
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  assert.ok(state.run.world.worldFlags.includes("rogue_detour_hidden_convoy"));
  assert.ok(state.run.world.worldFlags.includes("rogue_escalation_catacomb_surge"));
});

test("route payoff lanes stay stable across repeated covenant replays", () => {
  for (let replay = 1; replay <= 4; replay += 1) {
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

    const { detourZone, escalationZone } = resolveActOneToCovenant(state, appEngine, runFactory);

    let result = appEngine.selectZone(state, detourZone.id);
    assert.equal(result.ok, true, `Detour payoff should open on replay ${replay}.`);
    const detourChoice = getRequiredChoice(state, "Stage the Hidden Abbey Convoy");
    assert.equal(appEngine.claimRewardAndAdvance(state, detourChoice.id).ok, true);

    result = appEngine.selectZone(state, escalationZone.id);
    assert.equal(result.ok, true, `Escalation payoff should open on replay ${replay}.`);
    const escalationChoice = getRequiredChoice(state, "Drive the Catacomb Surge");
    assert.equal(appEngine.claimRewardAndAdvance(state, escalationChoice.id).ok, true);

    assert.ok(state.run.world.worldFlags.includes("rogue_detour_hidden_convoy"), `Detour flag missing on replay ${replay}.`);
    assert.ok(
      state.run.world.worldFlags.includes("rogue_escalation_catacomb_surge"),
      `Escalation flag missing on replay ${replay}.`
    );
  }
});

test("non-wayfinder covenant detour outcomes stay on the supply detour path", () => {
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

  const { branchBattleZone, detourZone } = resolveActOneToCovenant(state, appEngine, runFactory, {
    accordChoiceTitle: "Hang the Last Wayfinder Bells",
    covenantChoiceTitle: "Tally the Last Monastery Ledger",
  });

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Supply Detour");
  const detourChoice = getRequiredChoice(state, "Secure the Abbey Sidepass");
  assert.equal(appEngine.claimRewardAndAdvance(state, detourChoice.id).ok, true);
  assert.ok(state.run.world.worldFlags.includes("rogue_detour_abbey_sidepass"));

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_branch_recovery");
  assert.equal(state.combat.encounter.name, "Monastery Recovery Line");
});

test("accord-backed detour outcomes can retune the next branch battle into the mobilized line", () => {
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

  const { branchBattleZone, detourZone } = resolveActOneToCovenant(state, appEngine, runFactory, {
    routeChoiceTitle: "Equip the Vanguard",
  });

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Stage the Hidden Abbey Convoy");
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_branch_detour_mobilized");
  assert.equal(state.combat.encounter.name, "Monastery Mobilized Detour");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "backline_screen"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "sniper_nest"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "court_reserves"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchBattleZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 27);
  assert.equal(reward.grants.xp, 16);
  assert.equal(reward.grants.potions, 1);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Cloister Convoy Dividend.")));
  assert.ok(
    reward.lines.some((line) => line.includes("cloister accord, armed vanguard, and signal lanterns now carry through the full abbey convoy"))
  );
});

test("mid-tier detour outcomes can retune the next branch battle without needing the full hidden convoy", () => {
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

  const { branchBattleZone, detourZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory,
    "Consecrate the Last Cloister Bell"
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Open the Chapel Sidepass");
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_branch_detour_guided");
  assert.equal(state.combat.encounter.name, "Monastery Guarded Detour");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "fortified_line"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "triage_screen"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchBattleZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 22);
  assert.equal(reward.grants.xp, 14);
  assert.equal(reward.grants.potions, 1);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Chapel Sidepass Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("guided monastery payout")));
});

test("non-wayfinder covenant escalation outcomes stay on the ledger escalation path", () => {
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

  const { branchMinibossZone, escalationZone } = resolveActOneToCovenant(state, appEngine, runFactory, {
    accordChoiceTitle: "Hang the Last Wayfinder Bells",
    covenantChoiceTitle: "Tally the Last Monastery Ledger",
  });

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Ledger Escalation");
  const escalationChoice = getRequiredChoice(state, "Crack the Chapel Surge");
  assert.equal(appEngine.claimRewardAndAdvance(state, escalationChoice.id).ok, true);
  assert.ok(state.run.world.worldFlags.includes("rogue_escalation_chapel_surge"));

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_miniboss_escalation_breach");
  assert.equal(state.combat.encounter.name, "Burial Grounds Breach Host");
});

test("accord-backed escalation outcomes can retune the next branch miniboss into the mobilized host", () => {
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

  const { branchMinibossZone, escalationZone } = resolveActOneToCovenant(state, appEngine, runFactory, {
    routeChoiceTitle: "Equip the Vanguard",
  });

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Drive the Catacomb Surge");
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_miniboss_escalation_mobilized");
  assert.equal(state.combat.encounter.name, "Burial Grounds Mobilized Surge");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "linebreaker_charge"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "escort_command"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "court_reserves"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchMinibossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 35);
  assert.equal(reward.grants.xp, 22);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Cloister Surge Dividend.")));
  assert.ok(
    reward.lines.some((line) => line.includes("cloister accord, armed vanguard, and hidden wayfinders now route the full catacomb surge"))
  );
});

test("mid-tier escalation outcomes can retune the next branch miniboss without needing the full catacomb surge", () => {
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

  const { branchMinibossZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory,
    "Consecrate the Last Cloister Bell"
  );

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Crack the Chapel Surge");
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_miniboss_escalation_breach");
  assert.equal(state.combat.encounter.name, "Burial Grounds Breach Host");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "linebreaker_charge"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "war_drums"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: branchMinibossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 31);
  assert.equal(reward.grants.xp, 19);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Chapel Breach Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("sharper breach payout")));
});

test("detour and escalation outcomes can retune the act boss beyond the covenant baseline", () => {
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

  const { bossZone, branchBattleZone, branchMinibossZone, detourZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Stage the Hidden Abbey Convoy");
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Drive the Catacomb Surge");
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  branchMinibossZone.encountersCleared = branchMinibossZone.encounterTotal;
  branchMinibossZone.cleared = true;
  branchBattleZone.encountersCleared = branchBattleZone.encounterTotal;
  branchBattleZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_boss_aftermath_signaled");
  assert.equal(state.combat.encounter.name, "Catacomb Signaled Aftermath");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "boss_screen"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "sniper_nest"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "linebreaker_charge"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "escort_command"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "triage_command"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: bossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 58);
  assert.equal(reward.grants.xp, 36);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Signal Aftermath Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("shrine signal line and hidden wayfinders now settle the full catacomb aftermath")));
});

test("alternate route arming can retune the act boss into the drilled aftermath court", () => {
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

  const { bossZone, branchBattleZone, branchMinibossZone, detourZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory,
    {
      routeChoiceTitle: "Equip the Vanguard",
    }
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Stage the Hidden Abbey Convoy");
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Drive the Catacomb Surge");
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  branchMinibossZone.encountersCleared = branchMinibossZone.encounterTotal;
  branchMinibossZone.cleared = true;
  branchBattleZone.encountersCleared = branchBattleZone.encounterTotal;
  branchBattleZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.run.activeEncounterId, "act_1_boss_aftermath_mobilized");
  assert.equal(state.combat.encounter.name, "Catacomb Mobilized Aftermath");
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "boss_screen"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "escort_bulwark"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "phalanx_march"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "court_reserves"));
  assert.ok(state.combat.encounter.modifiers.some((modifier) => modifier.kind === "boss_salvo"));
  assert.ok(!state.combat.encounter.modifiers.some((modifier) => modifier.kind === "sniper_nest"));

  const reward = runFactory.buildEncounterReward({
    run: state.run,
    zone: bossZone,
    combatState: state.combat,
    content,
    profile: state.profile,
  });
  assert.equal(reward.grants.gold, 59);
  assert.equal(reward.grants.xp, 37);
  assert.equal(reward.grants.potions, 2);
  assert.ok(reward.lines.some((line) => line.includes("Late-route payoff: Cloister Mobilized Dividend.")));
  assert.ok(reward.lines.some((line) => line.includes("cloister accord, armed vanguard, and signal lanterns now settle the full catacomb aftermath")));
});
