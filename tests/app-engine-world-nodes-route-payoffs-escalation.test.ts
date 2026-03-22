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
  assert.ok(state.run.pendingReward.title);
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier recovery lane:")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier accord lane:")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier covenant lane:")));
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  const detourEffect = detourChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(detourEffect);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  assert.ok(state.run.pendingReward.title);
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier legacy lane:")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier reckoning lane:")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier covenant lane:")));
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  const escalationEffect = escalationChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(escalationEffect);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  assert.ok(detourEffect.flagIds.length > 0);
  assert.ok(state.run.world.worldFlags.includes(detourEffect.flagIds[0]));
  assert.ok(escalationEffect.flagIds.length > 0);
  assert.ok(state.run.world.worldFlags.includes(escalationEffect.flagIds[0]));
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
    const detourChoice = state.run.pendingReward.choices[0];
    assert.ok(detourChoice);
    const detourEffect = detourChoice.effects.find((effect) => effect.kind === "record_node_outcome");
    assert.equal(appEngine.claimRewardAndAdvance(state, detourChoice.id).ok, true);

    result = appEngine.selectZone(state, escalationZone.id);
    assert.equal(result.ok, true, `Escalation payoff should open on replay ${replay}.`);
    const escalationChoice = state.run.pendingReward.choices[0];
    assert.ok(escalationChoice);
    const escalationEffect = escalationChoice.effects.find((effect) => effect.kind === "record_node_outcome");
    assert.equal(appEngine.claimRewardAndAdvance(state, escalationChoice.id).ok, true);

    assert.ok(detourEffect.flagIds.length > 0, `Detour flag missing on replay ${replay}.`);
    assert.ok(state.run.world.worldFlags.includes(detourEffect.flagIds[0]), `Detour flag missing on replay ${replay}.`);
    assert.ok(escalationEffect.flagIds.length > 0, `Escalation flag missing on replay ${replay}.`);
    assert.ok(
      state.run.world.worldFlags.includes(escalationEffect.flagIds[0]),
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
    accordChoiceIndex: 1,
    covenantChoiceIndex: 1,
  });

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  assert.ok(state.run.pendingReward.title);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  const detourEffect = detourChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(detourEffect);
  assert.equal(appEngine.claimRewardAndAdvance(state, detourChoice.id).ok, true);
  assert.ok(detourEffect.flagIds.length > 0);
  assert.ok(state.run.world.worldFlags.includes(detourEffect.flagIds[0]));

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
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
    routeChoiceIndex: 1,
  });

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
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
    1
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, branchBattleZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
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
    accordChoiceIndex: 1,
    covenantChoiceIndex: 1,
  });

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  assert.ok(state.run.pendingReward.title);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  const escalationEffect = escalationChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(escalationEffect);
  assert.equal(appEngine.claimRewardAndAdvance(state, escalationChoice.id).ok, true);
  assert.ok(escalationEffect.flagIds.length > 0);
  assert.ok(state.run.world.worldFlags.includes(escalationEffect.flagIds[0]));

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
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
    routeChoiceIndex: 1,
  });

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
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
    1
  );

  let result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  // Side zones no longer trigger consequence encounters; they use the opening pool
  assert.ok(state.run.activeEncounterId);
});

