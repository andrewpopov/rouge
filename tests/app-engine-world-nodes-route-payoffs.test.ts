export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
import { resolveActOneToCovenant } from "./helpers/world-node-route-fixtures";


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

  const { bossZone, branchBattleZone: _branchBattleZone, branchMinibossZone: _branchMinibossZone, detourZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.ok(state.run.activeEncounterId);
  assert.ok(state.combat.encounter.name);
  // Boss should have modifiers from the route chain
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

test("alternate covenant bells plus sidepass and breach can retune the act boss into the posted aftermath court", () => {
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

  const { bossZone, branchBattleZone: _branchBattleZone, branchMinibossZone: _branchMinibossZone, detourZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory,
    {
      covenantChoiceIndex: 1,
    }
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  assert.equal(appEngine.claimRewardAndAdvance(state, detourChoice.id).ok, true);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  assert.equal(appEngine.claimRewardAndAdvance(state, escalationChoice.id).ok, true);

  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.ok(state.run.activeEncounterId);
  assert.ok(state.combat.encounter.name);
  // Boss should have modifiers from the alternate route chain
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

  const { bossZone, branchBattleZone: _branchBattleZone, branchMinibossZone: _branchMinibossZone, detourZone, escalationZone } = resolveActOneToCovenant(
    state,
    appEngine,
    runFactory,
    {
      routeChoiceIndex: 1,
    }
  );

  let result = appEngine.selectZone(state, detourZone.id);
  assert.equal(result.ok, true);
  const detourChoice = state.run.pendingReward.choices[0];
  assert.ok(detourChoice);
  appEngine.claimRewardAndAdvance(state, detourChoice.id);

  result = appEngine.selectZone(state, escalationZone.id);
  assert.equal(result.ok, true);
  const escalationChoice = state.run.pendingReward.choices[0];
  assert.ok(escalationChoice);
  appEngine.claimRewardAndAdvance(state, escalationChoice.id);

  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.ok(state.run.activeEncounterId);
  assert.ok(state.combat.encounter.name);
  // Boss should have modifiers from the alternate armed route
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
