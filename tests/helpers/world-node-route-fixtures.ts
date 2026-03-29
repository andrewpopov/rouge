import assert from "node:assert/strict";

export type ResolveActOneToCovenantOptions = {
  routeChoiceIndex?: number;
  crossroadChoiceIndex?: number;
  accordChoiceIndex?: number;
  covenantChoiceIndex?: number;
};

export function clearAllMainlineZones(runFactory: RunFactoryApi, run: RunState) {
  const zones = runFactory.getCurrentZones(run);
  const mainlineZones = zones.filter(
    (zone: ZoneState) =>
      zone.kind === "battle" &&
      (zone.zoneRole === "opening" || (zone.zoneRole || "").startsWith("mainline_")) &&
      !zone.zoneRole?.startsWith("side_")
  );
  for (const zone of mainlineZones) {
    zone.encountersCleared = zone.encounterTotal;
    zone.cleared = true;
  }
  runFactory.recomputeZoneStatuses(run);
}

export function aliasShrineOutcomeForCrossroad(run: RunState) {
  const world = run.world;
  if (!world) {
    return;
  }
  const existingShrineKey = Object.keys(world.shrineOutcomes || {})[0];
  if (existingShrineKey && existingShrineKey !== "sunwell_shrine") {
    world.shrineOutcomes.sunwell_shrine = { ...world.shrineOutcomes[existingShrineKey] };
  }
}

export function aliasShrineOpportunityOutcomeForReserve(run: RunState) {
  const world = run.world;
  if (!world) {
    return;
  }
  if (world.opportunityOutcomes.rogue_vigil_route_opportunity && !world.opportunityOutcomes.sunwell_shrine_opportunity) {
    world.opportunityOutcomes.sunwell_shrine_opportunity = { ...world.opportunityOutcomes.rogue_vigil_route_opportunity };
  }
}

export function getRequiredZone(
  state: AppState,
  runFactory: RunFactoryApi,
  label: string,
  predicate: (zone: ZoneState) => boolean
) {
  const zones = runFactory.getCurrentZones(state.run);
  const zone = zones.find(predicate);
  assert.ok(zone, `Missing ${label} zone. Current zones: ${zones.map((candidate: ZoneState) => candidate.id).join(", ")}`);
  return zone;
}

export function selectZoneAndClaimByIndex(
  state: AppState,
  appEngine: AppEngineApi,
  runFactory: RunFactoryApi,
  label: string,
  predicate: (zone: ZoneState) => boolean,
  choiceIndex = 0
) {
  const zone = getRequiredZone(state, runFactory, label, predicate);
  const result = appEngine.selectZone(state, zone.id);
  assert.equal(result.ok, true, `Expected ${label} zone ${zone.id} to be selectable.`);
  const choices = Array.isArray(state.run?.pendingReward?.choices) ? state.run.pendingReward.choices : [];
  assert.ok(choices.length > choiceIndex, `Expected at least ${choiceIndex + 1} choices for ${label}.`);
  const choice = choices[choiceIndex];
  assert.equal(appEngine.claimRewardAndAdvance(state, choice.id).ok, true);
  return { zone, choice };
}

export function resolveActOneToCovenant(
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
  const branchMinibossZone = zones.find((zone) => zone.kind === "miniboss" && (zone.zoneRole || "").startsWith("side_"));
  const branchBattleZone = zones.find((zone) => zone.kind === "battle" && (zone.zoneRole || "").startsWith("side_"));
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
    branchBattleZone: branchBattleZone as ZoneState,
    branchMinibossZone: branchMinibossZone as ZoneState,
    covenantZone,
    detourZone,
    escalationZone,
    legacyZone,
    recoveryZone,
    reckoningZone,
  };
}
