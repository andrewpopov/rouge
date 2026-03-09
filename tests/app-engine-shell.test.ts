export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("front door can review, continue, and abandon an active saved run", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  assert.equal(appEngine.hasSavedRun(), true);

  appEngine.returnToFrontDoor(state);
  assert.equal(state.phase, appEngine.PHASES.FRONT_DOOR);
  assert.equal(appEngine.hasSavedRun(), true);

  const summary = appEngine.getSavedRunSummary();
  assert.ok(summary);
  assert.equal(summary.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(summary.className, state.registries.classes[0].name);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.WORLD_MAP);

  const abandonState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const abandonResult = appEngine.abandonSavedRun(abandonState);
  assert.equal(abandonResult.ok, true);
  assert.equal(abandonState.phase, appEngine.PHASES.FRONT_DOOR);
  assert.equal(appEngine.hasSavedRun(), false);
  assert.equal(appEngine.getSavedRunSummary(), null);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
});

test("app shell renders boot loading and error states", () => {
  const { appShell, browserWindow } = createHarness();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "loading", error: "" },
  });
  assert.match(root.innerHTML, /Opening The Account Hall/);
  assert.match(root.innerHTML, /Starting Up/);

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "error", error: "Failed to load ./data/seeds/d2/classes.json: 500" },
  });
  assert.match(root.innerHTML, /The Account Hall Failed To Open/);
  assert.match(root.innerHTML, /Boot Failure/);
  assert.match(root.innerHTML, /Failed to load \.\/data\/seeds\/d2\/classes\.json: 500/);
});

test("app shell renders front-door, safe-zone, world-map, and reward shell surfaces", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Account Hall/);
  assert.match(root.innerHTML, /Hall Navigator/);
  assert.match(root.innerHTML, /Decision Support Desk/);
  assert.match(root.innerHTML, /Expedition Wing/);
  assert.match(root.innerHTML, /Unlock Galleries/);
  assert.match(root.innerHTML, /Vault Logistics/);
  assert.match(root.innerHTML, /Progression Gallery/);
  assert.match(root.innerHTML, /Capstone Watch/);
  assert.match(root.innerHTML, /Vault And Archive/);
  assert.match(root.innerHTML, /Control Annex/);
  assert.match(root.innerHTML, /Convergence Pressure/);
  assert.match(root.innerHTML, /Next Move Board/);
  assert.match(root.innerHTML, /Account Tree Review/);
  assert.match(root.innerHTML, /Archive Signal Board/);
  assert.match(root.innerHTML, /Account Controls/);
  assert.match(root.innerHTML, /Unlock Archive/);
  assert.match(root.innerHTML, /Tutorial Ledger/);
  assert.match(root.innerHTML, /Settings Console/);
  assert.match(root.innerHTML, /Class Command/);
  assert.match(root.innerHTML, /Archive Review Desk/);
  assert.match(root.innerHTML, /Focus Trade Network/);
  assert.match(root.innerHTML, /Path To First Blood/);
  assert.match(root.innerHTML, /Open A New Expedition/);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Town Districts/);
  assert.match(root.innerHTML, /Departure Board/);
  assert.match(root.innerHTML, /Town Navigator/);
  assert.match(root.innerHTML, /Run State Vs Profile State/);
  assert.match(root.innerHTML, /Progression Board/);
  assert.match(root.innerHTML, /Account Signals/);
  assert.match(root.innerHTML, /Prep Comparison Board/);
  assert.match(root.innerHTML, /Live Account Bonuses/);
  assert.match(root.innerHTML, /Account Progression Focus/);
  assert.match(root.innerHTML, /World Ledger/);
  assert.match(root.innerHTML, /Loadout Bench/);
  assert.match(root.innerHTML, /Service Drilldowns/);
  assert.match(root.innerHTML, /Ready To Leave Town\?/);
  assert.match(root.innerHTML, /Mercenary Barracks/);

  appEngine.leaveSafeZone(state);
  appEngine.returnToFrontDoor(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Resume Expedition/);
  assert.match(root.innerHTML, /Continue Saved Run/);
  assert.match(root.innerHTML, /Release This Expedition/);

  state.ui.confirmAbandonSavedRun = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Archive This Expedition/);

  appEngine.continueSavedRun(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Route Decision Desk/);
  assert.match(root.innerHTML, /What Changed/);
  assert.match(root.innerHTML, /What Is Blocked/);
  assert.match(root.innerHTML, /Account Pressure Carry-Through/);
  assert.match(root.innerHTML, /Next Route Action/);
  assert.match(root.innerHTML, /Act Pressure/);
  assert.match(root.innerHTML, /Route Intel/);
  assert.match(root.innerHTML, /Consequence Ledger/);
  assert.match(root.innerHTML, /Boss Pressure/);
  assert.match(root.innerHTML, /Node Legend/);
  assert.match(root.innerHTML, /Convergence Lanes/);
  assert.match(root.innerHTML, /Covenant Node/);
  assert.match(root.innerHTML, /Aftermath Nodes/);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Battle Orders/);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Continuity Delta Desk/);
  assert.match(root.innerHTML, /Route Carry-Through/);
  assert.match(root.innerHTML, /Next Shell Handoff/);
  assert.match(root.innerHTML, /Choose A Mutation/);
  assert.match(root.innerHTML, /Combat Reward/);
  assert.match(root.innerHTML, /Advance Guide/);
  assert.match(root.innerHTML, /Permanent Mutation/);
  assert.match(root.innerHTML, /Before And After/);

  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);
  state.phase = appEngine.PHASES.ACT_TRANSITION;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Act Delta Review/);
  assert.match(root.innerHTML, /Carry Forward State/);
  assert.match(root.innerHTML, /Next Town Orders/);
});

test("world-map and reward shell render node-specific quest and aftermath guidance", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  render();

  assert.match(root.innerHTML, /Quest Forks/);
  assert.match(root.innerHTML, /Aftermath Nodes/);

  let questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  let questUnlockAttempts = 0;
  while (questZone?.status !== "available" && questUnlockAttempts < 5) {
    questUnlockAttempts += 1;
    const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
    const openingResult = appEngine.selectZone(state, openingZoneId);
    assert.equal(openingResult.ok, true);
    state.combat.outcome = "victory";
    appEngine.syncEncounterOutcome(state);
    appEngine.claimRewardAndAdvance(state, state.run.pendingReward.choices[0].id);
    assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
    questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  }

  assert.ok(questZone);
  assert.equal(questZone.status, "available");
  const questResult = appEngine.selectZone(state, questZone.id);
  assert.equal(questResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);

  render();
  assert.match(root.innerHTML, /Quest Resolution/);
  assert.match(root.innerHTML, /quest outcome/i);

  appEngine.claimRewardAndAdvance(state, state.run.pendingReward.choices[0].id);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  render();
  assert.match(root.innerHTML, /Triggered by/);

  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(eventZone);
  const eventResult = appEngine.selectZone(state, eventZone.id);
  assert.equal(eventResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "event");

  render();
  assert.match(root.innerHTML, /Aftermath Follow-Up/);
  assert.match(root.innerHTML, /Triggered by/);
});

test("reward continuity desk tracks world-map, act-transition, and run-end handoffs", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const encounterResult = appEngine.selectZone(state, openingZoneId);
  assert.equal(encounterResult.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  assert.equal(state.phase, appEngine.PHASES.REWARD);

  render();
  assert.match(root.innerHTML, /After this claim the shell moves to World Map\./);

  state.run.pendingReward.endsAct = true;
  render();
  assert.match(root.innerHTML, /After this claim the shell moves to Act Transition\./);

  state.run.pendingReward.endsAct = true;
  state.run.pendingReward.endsRun = true;
  render();
  assert.match(root.innerHTML, /After this claim the shell moves to Run-End Review\./);
});

test("shared account-meta continuity board persists across the full shell", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };
  const assertMetaBoard = () => {
    assert.match(root.innerHTML, /Account Meta Continuity/);
    assert.match(root.innerHTML, /Archive Pressure/);
    assert.match(root.innerHTML, /Charter Staging/);
    assert.match(root.innerHTML, /Mastery Pressure/);
    assert.match(root.innerHTML, /Convergence Watch/);
  };

  render();
  assertMetaBoard();

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  render();
  assertMetaBoard();

  appEngine.leaveSafeZone(state);
  render();
  assertMetaBoard();

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const encounterResult = appEngine.selectZone(state, openingZoneId);
  assert.equal(encounterResult.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  render();
  assertMetaBoard();

  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);
  state.phase = appEngine.PHASES.ACT_TRANSITION;
  render();
  assertMetaBoard();

  persistence.recordRunHistory(state.profile, state.run, "completed");
  state.profile.activeRunSnapshot = null;
  state.phase = appEngine.PHASES.RUN_COMPLETE;
  render();
  assertMetaBoard();
});

test("action dispatcher drives the front-door continue and abandon shell flow", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, persistence, createActionTarget, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  state.profile.meta.unlocks.townFeatureIds.push("eternal_annals", "treasury_exchange", "apex_doctrine");
  persistence.ensureProfileMeta(state.profile);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  appEngine.returnToFrontDoor(state);
  render();

  assert.match(root.innerHTML, /Chronicle Exchange/);
  assert.match(root.innerHTML, /War Annals/);
  assert.match(root.innerHTML, /Paragon Exchange/);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-account-progression-focus", accountTreeId: "mastery" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getAccountProgressSummary(state).focusedTreeId, "mastery");
  assert.match(root.innerHTML, /Focused: Mastery Hall/);
  assert.equal(persistence.loadProfileFromStorage()?.meta.accountProgression.focusedTreeId, "mastery");

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "prompt-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.confirmAbandonSavedRun, true);
  assert.match(root.innerHTML, /Archive This Expedition/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "cancel-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.confirmAbandonSavedRun, false);
  assert.doesNotMatch(root.innerHTML, /Archive This Expedition/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "continue-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.match(root.innerHTML, /Act Pressure/);

  appEngine.returnToFrontDoor(state);
  render();

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "prompt-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "confirm-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.hasSavedRun(), false);
  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.equal(archivedProfile.runHistory.length, 1);
  assert.equal(archivedProfile.runHistory[0].outcome, "abandoned");
});

test("action dispatcher drives the outer loop from the hall through world map and back to town", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, runFactory, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };
  const syncCombatResultAndRender = () => {
    appEngine.syncEncounterOutcome(state);
    render();
  };

  render();
  assert.match(root.innerHTML, /Open A New Expedition/);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "start-character-select" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.CHARACTER_SELECT);
  assert.match(root.innerHTML, /Recruit A Hero And Companion/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-class", classId: "sorceress" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.selectedClassId, "sorceress");

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-mercenary", mercenaryId: "iron_wolf" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.selectedMercenaryId, "iron_wolf");

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "start-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.match(root.innerHTML, /Town Districts/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "leave-safe-zone" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.match(root.innerHTML, /Route Atlas/);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-zone", zoneId: openingZoneId }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.match(root.innerHTML, /Battle Orders/);

  state.combat.outcome = "victory";
  syncCombatResultAndRender();
  assert.equal(state.phase, appEngine.PHASES.REWARD);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "claim-reward-choice", choiceId: state.run.pendingReward.choices[0].id }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "return-safe-zone" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.match(root.innerHTML, /Town Districts/);
  assert.equal(runFactory.getZoneById(state.run, openingZoneId).encountersCleared, 1);
});

test("action dispatcher drives act-transition and failed-run shell exits", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, runFactory, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };
  const syncCombatResultAndRender = () => {
    appEngine.syncEncounterOutcome(state);
    render();
  };

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-zone", zoneId: runFactory.getCurrentZones(state.run)[0].id }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  state.combat.outcome = "victory";
  syncCombatResultAndRender();
  assert.equal(state.phase, appEngine.PHASES.REWARD);

  state.run.pendingReward.endsAct = true;
  state.run.acts[state.run.currentActIndex].complete = true;
  render();
  assert.match(root.innerHTML, /After this claim the shell moves to Act Transition\./);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "claim-reward-choice", choiceId: state.run.pendingReward.choices[0].id }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
  assert.match(root.innerHTML, /Act Delta Review/);
  state.run.acts[state.run.currentActIndex].complete = true;
  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "continue-act-transition" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.match(root.innerHTML, /Town Districts/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "leave-safe-zone" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-zone", zoneId: runFactory.getCurrentZones(state.run)[0].id }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  state.combat.outcome = "defeat";
  syncCombatResultAndRender();
  assert.equal(state.phase, appEngine.PHASES.RUN_FAILED);
  assert.match(root.innerHTML, /Expedition Logged As Fallen/);
  assert.match(root.innerHTML, /Return To Account Hall/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "return-front-door" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.FRONT_DOOR);
  assert.match(root.innerHTML, /Account Hall/);
});

test("action dispatcher drives runeword planning controls through the front-door shell", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, persistence, createActionTarget, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  render();
  assert.match(root.innerHTML, /Runeword Planning Desk/);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-planned-runeword", planningSlot: "weapon", runewordId: "white" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getAccountProgressSummary(state).planning.weaponRunewordId, "white");
  assert.match(root.innerHTML, /White/);
  assert.equal(persistence.loadProfileFromStorage()?.meta.planning.weaponRunewordId, "white");

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-planned-runeword", planningSlot: "armor", runewordId: "lionheart" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getAccountProgressSummary(state).planning.armorRunewordId, "lionheart");
  assert.match(root.innerHTML, /Lionheart/);
  assert.equal(persistence.loadProfileFromStorage()?.meta.planning.armorRunewordId, "lionheart");
});

test("front-door account controls mutate settings, tutorials, and preferred class through shell actions", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, persistence, createActionTarget, seedBundle } =
    createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  render();
  assert.match(root.innerHTML, /Account Controls/);
  assert.match(root.innerHTML, /Hide Hints/);
  assert.match(root.innerHTML, /Class Command/);
  assert.match(root.innerHTML, /Prefer Sorceress/);
  assert.match(root.innerHTML, /Complete Account Hall Orientation/);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-profile-setting", settingKey: "showHints", settingValue: "false" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getAccountProgressSummary(state).settings.showHints, false);
  assert.match(root.innerHTML, /Show Hints/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "dismiss-tutorial", tutorialId: "front_door_profile_hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.ok(!appEngine.getAccountProgressSummary(state).activeTutorialIds.includes("front_door_profile_hall"));
  assert.match(root.innerHTML, /Restore Account Hall Orientation/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "restore-tutorial", tutorialId: "front_door_profile_hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.ok(appEngine.getAccountProgressSummary(state).activeTutorialIds.includes("front_door_profile_hall"));
  assert.match(root.innerHTML, /Complete Account Hall Orientation/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "complete-tutorial", tutorialId: "front_door_profile_hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.ok(!appEngine.getAccountProgressSummary(state).activeTutorialIds.includes("front_door_profile_hall"));
  assert.match(root.innerHTML, /Completed prompts: Account Hall Orientation\./);
  assert.equal(persistence.loadProfileFromStorage()?.meta.settings.showHints, false);
  assert.ok(persistence.loadProfileFromStorage()?.meta.tutorials.completedIds.includes("front_door_profile_hall"));

  state.profile.meta.progression.lastPlayedClassId = "amazon";
  persistence.saveProfileToStorage(state.profile);
  render();
  assert.match(root.innerHTML, /Follow Recent Signal/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-preferred-class", classId: "sorceress" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getProfileSummary(state).preferredClassId, "sorceress");
  assert.equal(appEngine.getProfileSummary(state).lastPlayedClassId, "amazon");
  assert.equal(persistence.loadProfileFromStorage()?.meta.progression.preferredClassId, "sorceress");

  appEngine.startCharacterSelect(state);
  assert.equal(state.ui.selectedClassId, "sorceress");
  appEngine.returnToFrontDoor(state);
  render();

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-preferred-class", classId: "amazon" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(appEngine.getProfileSummary(state).preferredClassId, "amazon");

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  const startResult = appEngine.startRun(state);
  assert.equal(startResult.ok, true);
  assert.equal(state.profile.meta.progression.preferredClassId, "barbarian");
  assert.equal(state.profile.meta.progression.lastPlayedClassId, "barbarian");
});

test("front-door archive review controls navigate richer run-history entries through shell actions", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };

  state.profile.runHistory = [
    {
      runId: "latest_archive",
      classId: "sorceress",
      className: "Sorceress",
      level: 18,
      actsCleared: 3,
      bossesDefeated: 4,
      goldGained: 912,
      runewordsForged: 2,
      skillPointsEarned: 3,
      classPointsEarned: 2,
      attributePointsEarned: 4,
      trainingRanksGained: 2,
      favoredTreeId: "embers",
      favoredTreeName: "Ash Ledger",
      unlockedClassSkills: 7,
      loadoutTier: 10,
      loadoutSockets: 4,
      carriedEquipmentCount: 2,
      carriedRuneCount: 1,
      stashEntryCount: 3,
      stashEquipmentCount: 2,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "white",
      plannedArmorRunewordId: "lionheart",
      completedPlannedRunewordIds: ["white"],
      activeRunewordIds: ["latest_stormbind"],
      newFeatureIds: ["economy_ledger"],
      completedAt: "2026-03-08T12:00:00.000Z",
      outcome: "completed",
    },
    {
      runId: "older_archive",
      classId: "barbarian",
      className: "Barbarian",
      level: 12,
      actsCleared: 1,
      bossesDefeated: 1,
      goldGained: 244,
      runewordsForged: 1,
      skillPointsEarned: 1,
      classPointsEarned: 1,
      attributePointsEarned: 2,
      trainingRanksGained: 1,
      favoredTreeId: "storm",
      favoredTreeName: "Tempest Table",
      unlockedClassSkills: 4,
      loadoutTier: 5,
      loadoutSockets: 2,
      carriedEquipmentCount: 1,
      carriedRuneCount: 1,
      stashEntryCount: 1,
      stashEquipmentCount: 1,
      stashRuneCount: 0,
      plannedWeaponRunewordId: "steel",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: ["older_moonmark"],
      newFeatureIds: ["war_college"],
      completedAt: "2026-03-06T08:30:00.000Z",
      outcome: "failed",
    },
  ];

  render();
  assert.match(root.innerHTML, /Archive Review Desk/);
  assert.match(root.innerHTML, /Entry 1\/2/);
  assert.match(root.innerHTML, /Ash Ledger/);
  assert.match(root.innerHTML, /Economy Ledger/);
  assert.match(root.innerHTML, /Planned charters: White, Lionheart\./);
  assert.match(root.innerHTML, /Completed charter targets: White\./);
  assert.match(root.innerHTML, /Latest Stormbind/);

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-run-history-review", historyIndex: "1" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.reviewedHistoryIndex, 1);
  assert.match(root.innerHTML, /Entry 2\/2/);
  assert.match(root.innerHTML, /Tempest Table/);
  assert.match(root.innerHTML, /War College/);
  assert.match(root.innerHTML, /Planned charters: Steel\./);
  assert.match(root.innerHTML, /Completed charter targets: none fulfilled\./);
  assert.match(root.innerHTML, /Older Moonmark/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-run-history-review", historyIndex: "0" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.reviewedHistoryIndex, 0);
  assert.match(root.innerHTML, /Entry 1\/2/);
  assert.match(root.innerHTML, /Ash Ledger/);
});

test("front-door account hall renders richer unlock, vault, archive-signal, and capstone drilldowns", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  state.profile.meta.progression.preferredClassId = "sorceress";
  state.profile.meta.progression.lastPlayedClassId = "amazon";
  state.profile.meta.unlocks.classIds = ["amazon", "sorceress"];
  state.profile.meta.unlocks.bossIds = ["andariel"];
  state.profile.meta.unlocks.runewordIds = ["steel", "white"];
  state.profile.meta.unlocks.townFeatureIds = ["front_door_profile_hall", "economy_ledger", "war_college"];
  state.profile.meta.planning.weaponRunewordId = "white";
  state.profile.meta.planning.armorRunewordId = "lionheart";
  state.profile.stash.entries = [
    {
      entryId: "vault_blade",
      kind: "equipment",
      equipment: {
        entryId: "vault_blade",
        itemId: "item_short_sword",
        slot: "weapon",
        socketsUnlocked: 2,
        insertedRunes: ["rune_tir"],
        runewordId: "",
      },
    },
    {
      entryId: "vault_rune",
      kind: "rune",
      runeId: "rune_el",
    },
  ];
  state.profile.runHistory = [
    {
      runId: "latest_archive",
      classId: "sorceress",
      className: "Sorceress",
      level: 18,
      actsCleared: 3,
      bossesDefeated: 4,
      goldGained: 912,
      runewordsForged: 2,
      skillPointsEarned: 3,
      classPointsEarned: 2,
      attributePointsEarned: 4,
      trainingRanksGained: 2,
      favoredTreeId: "economy",
      favoredTreeName: "Trade Network",
      unlockedClassSkills: 7,
      loadoutTier: 10,
      loadoutSockets: 4,
      carriedEquipmentCount: 2,
      carriedRuneCount: 1,
      stashEntryCount: 3,
      stashEquipmentCount: 2,
      stashRuneCount: 1,
      plannedWeaponRunewordId: "white",
      plannedArmorRunewordId: "lionheart",
      completedPlannedRunewordIds: ["white"],
      activeRunewordIds: ["latest_stormbind"],
      newFeatureIds: ["economy_ledger"],
      completedAt: "2026-03-08T12:00:00.000Z",
      outcome: "completed",
    },
    {
      runId: "older_archive",
      classId: "amazon",
      className: "Amazon",
      level: 14,
      actsCleared: 2,
      bossesDefeated: 2,
      goldGained: 488,
      runewordsForged: 1,
      skillPointsEarned: 2,
      classPointsEarned: 1,
      attributePointsEarned: 2,
      trainingRanksGained: 1,
      favoredTreeId: "mastery",
      favoredTreeName: "Mastery Hall",
      unlockedClassSkills: 5,
      loadoutTier: 6,
      loadoutSockets: 2,
      carriedEquipmentCount: 1,
      carriedRuneCount: 1,
      stashEntryCount: 1,
      stashEquipmentCount: 1,
      stashRuneCount: 0,
      plannedWeaponRunewordId: "steel",
      plannedArmorRunewordId: "",
      completedPlannedRunewordIds: [],
      activeRunewordIds: ["older_moonmark"],
      newFeatureIds: ["war_college"],
      completedAt: "2026-03-06T08:30:00.000Z",
      outcome: "failed",
    },
  ];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Decision Support Desk/);
  assert.match(root.innerHTML, /What Changed/);
  assert.match(root.innerHTML, /Convergence Pressure/);
  assert.match(root.innerHTML, /Next Move Board/);
  assert.match(root.innerHTML, /Unlock Galleries/);
  assert.match(root.innerHTML, /Vault Logistics/);
  assert.match(root.innerHTML, /Archive Signal Board/);
  assert.match(root.innerHTML, /Capstone Watch/);
  assert.match(root.innerHTML, /Boss gallery: Andariel\./);
  assert.match(root.innerHTML, /Runeword codex: Steel, White\./);
  assert.match(root.innerHTML, /Vault loadout watch: Short Sword\./);
  assert.match(root.innerHTML, /Rune reserve: El\./);
  assert.match(root.innerHTML, /Recent feature burst: Economy Ledger, War College\./);
  assert.match(root.innerHTML, /Recent charter pressure: White, Lionheart(?:, Steel)?\./);
  assert.match(root.innerHTML, /Weapon charter staging: White -&gt; 0 ready, 0 prepared, best base not parked yet\./);
  assert.match(root.innerHTML, /Armor charter staging: Lionheart -&gt; 0 ready, 0 prepared, best base not parked yet\./);
  assert.match(root.innerHTML, /Next vault push: Hunt Bases\. Pinned charters still lack a compatible parked base: White and Lionheart\./);
  assert.match(root.innerHTML, /Next capstone:/);
});

test("account shell surfaces live unlock and tutorial summaries through town, run-end, and front door", () => {
  const { content, combatEngine, appEngine, appShell, itemSystem, persistence, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Unlock Archive/);
  assert.match(root.innerHTML, /Tutorial Ledger/);
  assert.match(root.innerHTML, /Decision Support Desk/);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 240;
  state.run.progression.skillPointsAvailable = 1;

  let result = appEngine.useTownAction(state, "progression_spend_vitality");
  assert.equal(result.ok, true);

  const vendorEquipment = state.run.town.vendor.stock.find((entry) => entry.kind === "equipment");
  assert.ok(vendorEquipment);
  result = appEngine.useTownAction(state, `vendor_buy_${vendorEquipment.entryId}`);
  assert.equal(result.ok, true);

  const carriedEquipment = state.run.inventory.carried.find((entry) => entry.kind === "equipment");
  assert.ok(carriedEquipment);
  result = appEngine.useTownAction(state, `inventory_stash_${carriedEquipment.entryId}`);
  assert.equal(result.ok, true);

  const applyChoice = (choice: RewardChoice) => {
    const applyResult = itemSystem.applyChoice(state.run, choice, content);
    assert.equal(applyResult.ok, true);
  };

  applyChoice({
    id: "account_shell_weapon",
    kind: "item",
    title: "Short Sword",
    subtitle: "Equip Weapon",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
  });
  applyChoice({
    id: "account_shell_socket_1",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "account_shell_socket_2",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "account_shell_tir",
    kind: "rune",
    title: "Tir",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_tir" }],
  });
  applyChoice({
    id: "account_shell_el",
    kind: "rune",
    title: "El",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_el" }],
  });

  state.run.progression.bossTrophies.push("andariel");
  state.run.summary.actsCleared = 1;
  state.run.summary.bossesDefeated = 1;
  state.run.summary.goldGained = Math.max(state.run.summary.goldGained, 77);
  state.run.summary.runewordsForged = Math.max(state.run.summary.runewordsForged, 1);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Prep Comparison Board/);
  assert.match(root.innerHTML, /Live Account Bonuses/);
  assert.match(root.innerHTML, /Next Prep Step/);
  assert.match(root.innerHTML, /Account Signals/);
  assert.match(root.innerHTML, /Account Progression Focus/);
  assert.match(root.innerHTML, /Town features online:/);

  persistence.recordRunHistory(state.profile, state.run, "completed");
  state.profile.activeRunSnapshot = null;
  persistence.saveProfileToStorage(state.profile);
  state.phase = appEngine.PHASES.RUN_COMPLETE;

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Hall Handoff/);
  assert.match(root.innerHTML, /Convergence Carry-Through/);
  assert.match(root.innerHTML, /Next Hall Decision/);
  assert.match(root.innerHTML, /Account Progress/);
  assert.match(root.innerHTML, /Archive Delta/);
  assert.match(root.innerHTML, /Hall Re-entry Guide/);
  assert.match(root.innerHTML, /Account Tree Carry-Through/);
  assert.match(root.innerHTML, /Unlock Carry-Through/);
  assert.match(root.innerHTML, /Tutorial Carry-Through/);
  assert.match(root.innerHTML, /Steel/);
  assert.match(root.innerHTML, /Andariel/);

  appEngine.returnToFrontDoor(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Runewords forged: Steel\./);
  assert.match(root.innerHTML, /Completed guidance:/);
  assert.match(root.innerHTML, /First Run Overview/);
  assert.match(root.innerHTML, /Next account prompt: Account Hall Orientation\./);
});
