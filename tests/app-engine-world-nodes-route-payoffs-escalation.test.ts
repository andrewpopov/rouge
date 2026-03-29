export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
import { resolveActOneToCovenant } from "./helpers/world-node-route-fixtures";


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
