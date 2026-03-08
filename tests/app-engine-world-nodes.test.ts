export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("zone roles map to distinct encounter themes within the same act", () => {
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
  const actOneEncounters = content.generatedActEncounterIds[1];
  assert.ok(openingZone.encounterIds.every((encounterId) => encounterId.startsWith("act_1_opening_")));
  assert.ok(branchMinibossZone.encounterIds.every((encounterId) => actOneEncounters.branchMiniboss.includes(encounterId)));
  assert.ok(branchBattleZone.encounterIds.every((encounterId) => actOneEncounters.branchBattle.includes(encounterId)));

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, branchMinibossZone.id);
  assert.equal(result.ok, true);
  assert.match(state.run.activeEncounterId, /^act_1_branch_miniboss/);

  appEngine.returnToFrontDoor(state);
  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZoneAgain, , branchBattleZoneAgain] = runFactory.getCurrentZones(state.run);
  openingZoneAgain.encountersCleared = openingZoneAgain.encounterTotal;
  openingZoneAgain.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  result = appEngine.selectZone(state, branchBattleZoneAgain.id);
  assert.equal(result.ok, true);
  assert.match(state.run.activeEncounterId, /^act_1_branch_battle/);
});

test("quest world nodes resolve through the reward flow and persist outcomes on the run", () => {
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
  assert.ok(questZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const selectResult = appEngine.selectZone(state, questZone.id);
  assert.equal(selectResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "quest");

  const choice = state.run.pendingReward.choices[0];
  const recordEffect = choice.effects.find((effect) => effect.kind === "record_quest_outcome");
  const heroLifeBefore = state.run.hero.maxLife;
  assert.ok(recordEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, choice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.ok(state.run.world.resolvedNodeIds.includes(questZone.id));
  assert.equal(state.run.world.questOutcomes[recordEffect.questId].outcomeId, recordEffect.outcomeId);
  assert.ok(runFactory.getZoneById(state.run, questZone.id).cleared);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);
});

test("shrine world nodes resolve through the reward flow and persist shrine outcomes on the run", () => {
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
  assert.ok(shrineZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const selectResult = appEngine.selectZone(state, shrineZone.id);
  assert.equal(selectResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "shrine");

  const choice = state.run.pendingReward.choices[0];
  const recordEffect = choice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(recordEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, choice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.ok(state.run.world.resolvedNodeIds.includes(shrineZone.id));
  assert.equal(state.run.world.shrineOutcomes[recordEffect.nodeId].outcomeId, recordEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes(recordEffect.flagIds[0]));
  assert.ok(runFactory.getZoneById(state.run, shrineZone.id).cleared);
});

test("event world nodes branch off quest outcomes and persist follow-up consequences", () => {
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
  assert.equal(eventZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);

  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  let claimResult = appEngine.claimRewardAndAdvance(state, questChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(runFactory.getZoneById(state.run, eventZone.id).status, "available");

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "event");
  assert.equal(state.run.pendingReward.title, "Night Watch");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report")));

  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  const nodeEffect = eventChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  const followUpEffect = eventChoice.effects.find((effect) => effect.kind === "record_quest_follow_up");
  assert.ok(nodeEffect);
  assert.ok(followUpEffect);

  claimResult = appEngine.claimRewardAndAdvance(state, eventChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(state.run.world.eventOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.equal(state.run.world.questOutcomes[followUpEffect.questId].status, "follow_up_resolved");
  assert.equal(state.run.world.questOutcomes[followUpEffect.questId].followUpOutcomeId, followUpEffect.outcomeId);
  assert.ok(state.run.world.questOutcomes[followUpEffect.questId].consequenceIds.includes(followUpEffect.consequenceId));
  assert.ok(state.run.world.worldFlags.includes(nodeEffect.flagIds[0]));
});

test("opportunity world nodes resolve through the reward flow and extend the quest chain", () => {
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
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);
  assert.equal(runFactory.getZoneById(state.run, opportunityZone.id).status, "available");

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Scout Detachment");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));

  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Equip the Vanguard");
  assert.ok(opportunityChoice);
  const nodeEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  const consequenceEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_quest_consequence");
  assert.ok(nodeEffect);
  assert.ok(consequenceEffect);

  const claimResult = appEngine.claimRewardAndAdvance(state, opportunityChoice.id);
  assert.equal(claimResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.equal(state.run.world.questOutcomes[consequenceEffect.questId].status, "chain_resolved");
  assert.ok(state.run.world.questOutcomes[consequenceEffect.questId].consequenceIds.includes(consequenceEffect.consequenceId));
  assert.ok(state.run.world.worldFlags.includes(nodeEffect.flagIds[0]));
  assert.ok(runFactory.getZoneById(state.run, opportunityZone.id).cleared);
});

test("shrine outcomes can unlock shrine-specific opportunity variants later in the act", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "desert_guard");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Volley");
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
  assert.equal(state.run.pendingReward.title, "Vigil Counterline");

  const specialChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Call the Volley Line");
  assert.ok(specialChoice);
  const nodeEffect = specialChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(nodeEffect);
  appEngine.claimRewardAndAdvance(state, specialChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_vigil_volley"));
});

test("mercenary contracts can unlock more specific opportunity variants on top of shrine branches", () => {
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
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Volley");
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
  assert.equal(state.run.pendingReward.title, "Rogue Forward Screen");

  const specialChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Post the Forward Spotters");
  assert.ok(specialChoice);
  const nodeEffect = specialChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(nodeEffect);
  appEngine.claimRewardAndAdvance(state, specialChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.equal(state.run.mercenary.id, "rogue_scout");
});

test("mercenary route perks turn mercenary-specific opportunity flags into the next combat bonus package", () => {
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
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Volley");
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
  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Post the Forward Spotters");
  assert.ok(opportunityChoice);
  appEngine.claimRewardAndAdvance(state, opportunityChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 1);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 1);
  assert.equal(state.combat.mercenary.contractStartGuard, 1);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 1);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 1);
  assert.equal(state.combat.hero.damageBonus, 1);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 1);
  assert.ok(state.combat.log.some((line) => line.includes("Forward Spotters")));
});

test("shrine opportunity lanes unlock separately and can feed mercenary route perks into the next combat", () => {
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
  const opportunityZones = runFactory.getCurrentZones(state.run).filter((zone) => zone.kind === "opportunity");
  const shrineOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "shrine_opportunity");
  const questOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "opportunity");
  const crossroadOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "reserve_opportunity");
  const relayOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "relay_opportunity");
  const culminationOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "recovery_opportunity");
  const accordOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "accord_opportunity");
  const covenantOpportunityZone = opportunityZones.find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(questOpportunityZone);
  assert.ok(crossroadOpportunityZone);
  assert.ok(reserveOpportunityZone);
  assert.ok(relayOpportunityZone);
  assert.ok(culminationOpportunityZone);
  assert.ok(legacyOpportunityZone);
  assert.ok(reckoningOpportunityZone);
  assert.ok(recoveryOpportunityZone);
  assert.ok(accordOpportunityZone);
  assert.ok(covenantOpportunityZone);
  assert.equal(opportunityZones.length, 11);
  assert.equal(shrineOpportunityZone.status, "locked");
  assert.equal(crossroadOpportunityZone.status, "locked");
  assert.equal(reserveOpportunityZone.status, "locked");
  assert.equal(relayOpportunityZone.status, "locked");
  assert.equal(culminationOpportunityZone.status, "locked");
  assert.equal(legacyOpportunityZone.status, "locked");
  assert.equal(reckoningOpportunityZone.status, "locked");
  assert.equal(recoveryOpportunityZone.status, "locked");
  assert.equal(accordOpportunityZone.status, "locked");
  assert.equal(covenantOpportunityZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Volley");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  assert.equal(runFactory.getZoneById(state.run, shrineOpportunityZone.id).status, "available");
  assert.equal(runFactory.getZoneById(state.run, questOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, crossroadOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, reserveOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, relayOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, culminationOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, reckoningOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, recoveryOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, accordOpportunityZone.id).status, "locked");
  assert.equal(runFactory.getZoneById(state.run, covenantOpportunityZone.id).status, "locked");

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Scout Screen");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier shrine result: Blessing of Volley.")));

  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Post the Forward Spotters");
  assert.ok(opportunityChoice);
  const nodeEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(nodeEffect);
  appEngine.claimRewardAndAdvance(state, opportunityChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_route_forward_spotters"));
  assert.ok(runFactory.getZoneById(state.run, shrineOpportunityZone.id).cleared);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 1);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 1);
  assert.equal(state.combat.mercenary.contractStartGuard, 1);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 1);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 1);
  assert.equal(state.combat.hero.damageBonus, 1);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 1);
  assert.ok(state.combat.log.some((line) => line.includes("Forward Spotters")));
});

test("mercenary route perks can scale hero-facing guard support by act", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedMercenary(state, "desert_guard");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  state.run.actNumber = 5;
  state.run.world.worldFlags.push("sunwell_spearwall_posts");

  const openingZone = runFactory.getCurrentZones(state.run)[0];
  const result = appEngine.selectZone(state, openingZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractStartGuard, 5);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 4);
  assert.equal(state.combat.hero.guard, 4);
});

test("crossroad opportunity lanes unlock after both shrine and event paths resolve and pay off both states together", () => {
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
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(crossroadZone);
  assert.equal(crossroadZone.status, "locked");

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Beacons");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);
  assert.equal(runFactory.getZoneById(state.run, crossroadZone.id).status, "locked");

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

  assert.equal(runFactory.getZoneById(state.run, crossroadZone.id).status, "available");

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Rogue Scout Countermarch");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Earlier shrine result: Blessing of Beacons.")));

  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  const nodeEffect = crossroadChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(nodeEffect);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_crossroads_hidden_wayfinders"));
  assert.ok(runFactory.getZoneById(state.run, crossroadZone.id).cleared);
});

test("reserve opportunity lanes unlock after the earlier opportunity branches resolve and pay off all three route lanes together", () => {
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
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.equal(reserveZone.status, "locked");

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
  const routeChoice = state.run.pendingReward.choices[0];
  assert.ok(routeChoice);
  appEngine.claimRewardAndAdvance(state, routeChoice.id);

  result = appEngine.selectZone(state, shrineOpportunityZone.id);
  assert.equal(result.ok, true);
  const shrineOpportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Signal Lanterns");
  assert.ok(shrineOpportunityChoice);
  appEngine.claimRewardAndAdvance(state, shrineOpportunityChoice.id);

  assert.equal(runFactory.getZoneById(state.run, reserveZone.id).status, "locked");

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  assert.equal(runFactory.getZoneById(state.run, reserveZone.id).status, "available");

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Hidden Wayfinder Reserve");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier route lane: ${routeChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier shrine lane: ${shrineOpportunityChoice.title}.`)));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier crossroad: ${crossroadChoice.title}.`)));

  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  const reserveEffect = reserveChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(reserveEffect);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[reserveEffect.nodeId].outcomeId, reserveEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_reserve_hidden_cache"));
  assert.ok(runFactory.getZoneById(state.run, reserveZone.id).cleared);
});

test("relay opportunity lanes unlock after reserve and pay off the reserve choice downstream", () => {
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
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);
  assert.ok(relayZone);
  assert.equal(relayZone.status, "locked");

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
  const routeChoice = state.run.pendingReward.choices[0];
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

  assert.equal(runFactory.getZoneById(state.run, relayZone.id).status, "locked");

  result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, true);
  const reserveChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Cache the Hidden Reserve");
  assert.ok(reserveChoice);
  appEngine.claimRewardAndAdvance(state, reserveChoice.id);

  assert.equal(runFactory.getZoneById(state.run, relayZone.id).status, "available");

  result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Hidden Relay Chain");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier reserve lane: ${reserveChoice.title}.`)));

  const relayChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Extend the Hidden Chain");
  assert.ok(relayChoice);
  const relayEffect = relayChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(relayEffect);
  appEngine.claimRewardAndAdvance(state, relayChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[relayEffect.nodeId].outcomeId, relayEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_relay_hidden_chain"));
  assert.ok(runFactory.getZoneById(state.run, relayZone.id).cleared);
});

test("culmination opportunity lanes unlock after relay and pay off the earlier quest chain one more time", () => {
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
  assert.equal(culminationZone.status, "locked");

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

  assert.equal(runFactory.getZoneById(state.run, culminationZone.id).status, "available");

  result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.kind, "opportunity");
  assert.equal(state.run.pendingReward.title, "Rogue Scout Last Wayfinders");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Take Scout Report -> Mark the Paths")));
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes(`Earlier relay lane: ${relayChoice.title}.`)));

  const culminationChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Commission the Last Wayfinders");
  assert.ok(culminationChoice);
  const culminationEffect = culminationChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(culminationEffect);
  appEngine.claimRewardAndAdvance(state, culminationChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[culminationEffect.nodeId].outcomeId, culminationEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_culmination_last_wayfinders"));
  assert.ok(runFactory.getZoneById(state.run, culminationZone.id).cleared);
});

test("legacy opportunity lanes unlock after culmination and pay off the culmination lane one more time", () => {
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
});

test("culmination mercenary route perks feed the next combat after the full post-relay route resolves", () => {
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

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 4);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 4);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 4);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 4);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 4);
  assert.equal(state.combat.hero.guard, 4);
  assert.equal(state.combat.hero.damageBonus, 4);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 4);
  assert.ok(state.combat.log.some((line) => line.includes("Hidden Wayfinders")));
  assert.ok(state.combat.log.some((line) => line.includes("Hidden Reserve Network")));
  assert.ok(state.combat.log.some((line) => line.includes("Ghost Relay")));
  assert.ok(state.combat.log.some((line) => line.includes("Last Wayfinders")));
});

test("reserve mercenary route perks feed the next combat after the full route fabric resolves", () => {
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
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);

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

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 2);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 2);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 2);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 2);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 2);
  assert.equal(state.combat.hero.guard, 2);
  assert.equal(state.combat.hero.damageBonus, 2);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 2);
  assert.ok(state.combat.log.some((line) => line.includes("Hidden Wayfinders")));
  assert.ok(state.combat.log.some((line) => line.includes("Hidden Reserve Network")));
});

test("crossroad mercenary route perks feed the next combat after the full route chain resolves", () => {
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
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  assert.ok(branchZone);
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(crossroadZone);

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

  result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, true);
  const crossroadChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Assign the Hidden Wayfinders");
  assert.ok(crossroadChoice);
  appEngine.claimRewardAndAdvance(state, crossroadChoice.id);

  result = appEngine.selectZone(state, branchZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.mercenary.contractAttackBonus, 1);
  assert.equal(state.combat.mercenary.contractBehaviorBonus, 1);
  assert.equal(state.combat.mercenary.contractStartGuard, 0);
  assert.equal(state.combat.mercenary.contractHeroDamageBonus, 1);
  assert.equal(state.combat.mercenary.contractHeroStartGuard, 1);
  assert.equal(state.combat.mercenary.contractOpeningDraw, 1);
  assert.equal(state.combat.hero.guard, 1);
  assert.equal(state.combat.hero.damageBonus, 1);
  assert.equal(state.combat.hand.length, state.combat.hero.handSize + 1);
  assert.ok(state.combat.log.some((line) => line.includes("Hidden Wayfinders")));
});

test("more specific shrine-gated opportunity variants beat generic follow-up matches", () => {
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
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Blessing of Grit");
  assert.ok(shrineChoice);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Escort Survivors");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Quarter the Caravan");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Grit Redoubt");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Escort Survivors -> Quarter the Caravan")));

  const specialChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Harden the Refuge Line");
  assert.ok(specialChoice);
  const nodeEffect = specialChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(nodeEffect);
  appEngine.claimRewardAndAdvance(state, specialChoice.id);

  assert.equal(state.run.world.opportunityOutcomes[nodeEffect.nodeId].outcomeId, nodeEffect.outcomeId);
  assert.ok(state.run.world.worldFlags.includes("rogue_vigil_grit"));
});

test("consequence-gated shrine variants can override the broader follow-up branch", () => {
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
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

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
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Escort Survivors");
  assert.ok(questChoice);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Train the Watch");
  assert.ok(eventChoice);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.pendingReward.title, "Beacon Bastion");
  assert.ok(state.run.pendingReward.lines.some((line) => line.includes("Escort Survivors -> Train the Watch")));

  const specialChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Raise the Ridge Lanterns");
  assert.ok(specialChoice);
  const consequenceEffect = specialChoice.effects.find((effect) => effect.kind === "record_quest_consequence");
  assert.ok(consequenceEffect);
  appEngine.claimRewardAndAdvance(state, specialChoice.id);

  assert.ok(state.run.world.questOutcomes.tristram_relief.consequenceIds.includes("watch_trained"));
  assert.ok(state.run.world.questOutcomes[consequenceEffect.questId].consequenceIds.includes(consequenceEffect.consequenceId));
  assert.ok(state.run.world.worldFlags.includes("rogue_vigil_beacons"));
});

test("world-node state survives snapshot restore and continue", () => {
  const { content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
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
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  assert.ok(shrineZone);
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  let result = appEngine.selectZone(state, shrineZone.id);
  assert.equal(result.ok, true);
  const shrineChoice = state.run.pendingReward.choices[0];
  const shrineEffect = shrineChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(shrineEffect);
  appEngine.claimRewardAndAdvance(state, shrineChoice.id);

  result = appEngine.selectZone(state, questZone.id);
  assert.equal(result.ok, true);
  const questChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Take Scout Report");
  const questEffect = questChoice.effects.find((effect) => effect.kind === "record_quest_outcome");
  assert.ok(questEffect);
  appEngine.claimRewardAndAdvance(state, questChoice.id);

  result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, true);
  const eventChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Mark the Paths");
  const eventEffect = eventChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(eventEffect);
  appEngine.claimRewardAndAdvance(state, eventChoice.id);

  result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, true);
  const opportunityChoice = state.run.pendingReward.choices.find((choice) => choice.title === "Signal the Crossroads");
  const opportunityEffect = opportunityChoice.effects.find((effect) => effect.kind === "record_node_outcome");
  assert.ok(opportunityEffect);
  appEngine.claimRewardAndAdvance(state, opportunityChoice.id);

  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.run.world.shrineOutcomes[shrineEffect.nodeId].outcomeId, shrineEffect.outcomeId);
  assert.equal(restoredSnapshot.run.world.eventOutcomes[eventEffect.nodeId].outcomeId, eventEffect.outcomeId);
  assert.equal(restoredSnapshot.run.world.opportunityOutcomes[opportunityEffect.nodeId].outcomeId, opportunityEffect.outcomeId);
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(shrineEffect.flagIds[0]));
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(eventEffect.flagIds[0]));
  assert.ok(restoredSnapshot.run.world.worldFlags.includes(opportunityEffect.flagIds[0]));

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.run.world.shrineOutcomes[shrineEffect.nodeId].outcomeId, shrineEffect.outcomeId);
  assert.equal(resumedState.run.world.eventOutcomes[eventEffect.nodeId].outcomeId, eventEffect.outcomeId);
  assert.equal(resumedState.run.world.opportunityOutcomes[opportunityEffect.nodeId].outcomeId, opportunityEffect.outcomeId);
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "shrine"));
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "event"));
  assert.ok(runFactory.getCurrentZones(resumedState.run).some((zone) => zone.kind === "opportunity"));
});

test("legacy run snapshots backfill shrine, event, and opportunity nodes during hydrate", () => {
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

  const legacySnapshot = JSON.parse(appEngine.saveRunSnapshot(state));
  legacySnapshot.run.acts.forEach((act) => {
    act.zones = act.zones.filter((zone) => zone.kind !== "shrine" && zone.kind !== "event" && zone.kind !== "opportunity");
  });

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, JSON.stringify(legacySnapshot));
  assert.equal(importResult.ok, true);

  const zoneKinds = runFactory.getCurrentZones(importedState.run).map((zone) => zone.kind);
  assert.ok(zoneKinds.includes("shrine"));
  assert.ok(zoneKinds.includes("event"));
  assert.ok(zoneKinds.includes("opportunity"));

  const [openingZone] = runFactory.getCurrentZones(importedState.run);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  runFactory.recomputeZoneStatuses(importedState.run);

  const questZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "quest");
  const shrineZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "shrine");
  const eventZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(importedState.run).find((zone) => zone.nodeType === "opportunity");
  assert.equal(questZone.status, "available");
  assert.equal(shrineZone.status, "available");
  assert.equal(eventZone.status, "locked");
  assert.equal(opportunityZone.status, "locked");
});
