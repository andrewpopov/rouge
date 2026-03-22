export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function clearAllMainlineZones(runFactory: RunFactoryApi, run: RunState) {
  const zones = runFactory.getCurrentZones(run);
  const mainlineZones = zones.filter(
    (z: ZoneState) => z.kind === "battle" && (z.zoneRole === "opening" || (z.zoneRole || "").startsWith("mainline_")) && !z.zoneRole?.startsWith("side_")
  );
  for (const z of mainlineZones) {
    z.encountersCleared = z.encounterTotal;
    z.cleared = true;
  }
  runFactory.recomputeZoneStatuses(run);
}

type ResolveActOneToCovenantOptions = {
  routeChoiceIndex?: number;
  crossroadChoiceIndex?: number;
  accordChoiceIndex?: number;
  covenantChoiceIndex?: number;
};

function getRequiredZone(state: AppState, runFactory: RunFactoryApi, label: string, predicate: (z: ZoneState) => boolean) {
  const zones = runFactory.getCurrentZones(state.run);
  const zone = zones.find(predicate);
  assert.ok(zone, `Missing ${label} zone. Current zones: ${zones.map((candidate: ZoneState) => candidate.id).join(", ")}`);
  return zone;
}

function selectZoneAndClaimByIndex(state: AppState, appEngine: AppEngineApi, runFactory: RunFactoryApi, label: string, predicate: (z: ZoneState) => boolean, choiceIndex = 0) {
  const zone = getRequiredZone(state, runFactory, label, predicate);
  const result = appEngine.selectZone(state, zone.id);
  assert.equal(result.ok, true, `Expected ${label} zone ${zone.id} to be selectable.`);
  const choices = Array.isArray(state.run?.pendingReward?.choices) ? state.run.pendingReward.choices : [];
  assert.ok(choices.length > choiceIndex, `Expected at least ${choiceIndex + 1} choices for ${label}.`);
  const choice = choices[choiceIndex];
  assert.equal(appEngine.claimRewardAndAdvance(state, choice.id).ok, true);
  return { zone, choice };
}

/**
 * When act 1 falls back to act 2 crossroad/reserve definitions, those definitions
 * expect act 2's shrine ID and shrine-opportunity ID.  After naturally resolving
 * act 1's shrine and shrine-opportunity, copy the outcome records under the keys
 * that the downstream definitions actually reference.
 */
function aliasShrineOutcomeForCrossroad(run: RunState) {
  const world = run.world;
  if (!world) { return; }
  const existingShrineKey = Object.keys(world.shrineOutcomes || {})[0];
  if (existingShrineKey && existingShrineKey !== "sunwell_shrine") {
    world.shrineOutcomes["sunwell_shrine"] = { ...world.shrineOutcomes[existingShrineKey] };
  }
}

function aliasShrineOpportunityOutcomeForReserve(run: RunState) {
  const world = run.world;
  if (!world) { return; }
  if (world.opportunityOutcomes["rogue_vigil_route_opportunity"] && !world.opportunityOutcomes["sunwell_shrine_opportunity"]) {
    world.opportunityOutcomes["sunwell_shrine_opportunity"] = { ...world.opportunityOutcomes["rogue_vigil_route_opportunity"] };
  }
}

function resolveActOneToCovenant(
  state: AppState,
  appEngine: AppEngineApi,
  runFactory: RunFactoryApi,
  options: ResolveActOneToCovenantOptions | number = 0
) {
  const normalizedOptions: ResolveActOneToCovenantOptions =
    typeof options === "number" ? { covenantChoiceIndex: options } : options || {};
  const routeChoiceIndex = normalizedOptions.routeChoiceIndex || 0;
  const crossroadChoiceIndex = normalizedOptions.crossroadChoiceIndex || 0;
  const accordChoiceIndex = normalizedOptions.accordChoiceIndex || 0;
  const covenantChoiceIndex = normalizedOptions.covenantChoiceIndex || 0;
  const zones = runFactory.getCurrentZones(state.run);
  const branchMinibossZone = zones.find((z) => z.kind === "miniboss" && (z.zoneRole || "").startsWith("side_"));
  const branchBattleZone = zones.find((z) => z.kind === "battle" && (z.zoneRole || "").startsWith("side_"));
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

  assert.ok(branchMinibossZone);
  assert.ok(branchBattleZone);

  clearAllMainlineZones(runFactory, state.run);

  selectZoneAndClaimByIndex(state, appEngine, runFactory, "shrine", (zone) => zone.kind === "shrine", 0);
  aliasShrineOutcomeForCrossroad(state.run);
  selectZoneAndClaimByIndex(state, appEngine, runFactory, "quest", (zone) => zone.kind === "quest", 0);
  selectZoneAndClaimByIndex(state, appEngine, runFactory, "event", (zone) => zone.kind === "event", 0);
  selectZoneAndClaimByIndex(state, appEngine, runFactory, "opportunity", (zone) => zone.nodeType === "opportunity", routeChoiceIndex);
  selectZoneAndClaimByIndex(state, appEngine, runFactory, "shrine opportunity", (zone) => zone.nodeType === "shrine_opportunity", 0);
  aliasShrineOpportunityOutcomeForReserve(state.run);
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "crossroad opportunity",
    (zone) => zone.nodeType === "crossroad_opportunity", crossroadChoiceIndex
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "reserve opportunity",
    (zone) => zone.nodeType === "reserve_opportunity", 0
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "relay opportunity",
    (zone) => zone.nodeType === "relay_opportunity", 0
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "culmination opportunity",
    (zone) => zone.nodeType === "culmination_opportunity", 0
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "legacy opportunity",
    (zone) => zone.nodeType === "legacy_opportunity", 0
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "reckoning opportunity",
    (zone) => zone.nodeType === "reckoning_opportunity", 0
  );
  selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "recovery opportunity",
    (zone) => zone.nodeType === "recovery_opportunity", 0
  );
  const { zone: accordZone } = selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "accord opportunity",
    (zone) => zone.nodeType === "accord_opportunity", accordChoiceIndex
  );
  const { zone: covenantZone } = selectZoneAndClaimByIndex(
    state, appEngine, runFactory, "covenant opportunity",
    (zone) => zone.nodeType === "covenant_opportunity", covenantChoiceIndex
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

  const [_openingZone] = runFactory.getCurrentZones(state.run);
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

  assert.equal(runFactory.getZoneById(state.run, legacyZone.id).status, "available");

  result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.ok(state.run.pendingReward.title);
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`${questChoice.title  } -> ${  eventChoice.title}`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier culmination lane: ${culminationChoice.title}.`)));

  const legacyChoice = state.run.pendingReward.choices[0];
  assert.ok(legacyChoice);
  const legacyEffect = legacyChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(legacyEffect);
  appEngine.claimRewardAndAdvance(state, legacyChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[legacyEffect.nodeId].outcomeId, legacyEffect.outcomeId);
  assert.ok(legacyEffect.flagIds.length > 0);
  assert.ok(state.run.world.worldFlags.includes(legacyEffect.flagIds[0]));
  assert.ok(runFactory.getZoneById(state.run, legacyZone.id).cleared);
});

