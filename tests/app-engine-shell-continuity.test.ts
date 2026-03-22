export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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

  state.ui.hallExpanded = true;
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
  assert.match(root.innerHTML, /Act \d+ Complete/);

  persistence.recordRunHistory(state.profile, state.run, "completed");
  state.profile.activeRunSnapshot = null;
  state.phase = appEngine.PHASES.RUN_COMPLETE;
  render();
  assert.match(root.innerHTML, /Expedition Summary/);
});

test("account-meta drilldowns persist across the full shell", () => {
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
  const assertDrilldowns = () => {
    assert.match(root.innerHTML, /Account Meta Drilldowns/);
    assert.match(root.innerHTML, /Charter Forecast/);
    assert.match(root.innerHTML, /Weapon Charter/);
    assert.match(root.innerHTML, /Armor Charter/);
    assert.match(root.innerHTML, /Convergence Drilldown/);
    assert.match(root.innerHTML, /Weapon charter staging: White/);
    assert.match(root.innerHTML, /Armor charter staging: Lionheart/);
    assert.match(root.innerHTML, /Focused tree momentum:/);
  };

  state.profile.meta.planning.weaponRunewordId = "white";
  state.profile.meta.planning.armorRunewordId = "lionheart";
  state.ui.hallExpanded = true;

  render();
  assertDrilldowns();

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  render();
  assertDrilldowns();

  appEngine.leaveSafeZone(state);
  render();
  assertDrilldowns();

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const encounterResult = appEngine.selectZone(state, openingZoneId);
  assert.equal(encounterResult.ok, true);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);
  render();
  assertDrilldowns();

  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);
  state.phase = appEngine.PHASES.ACT_TRANSITION;
  render();
  assert.match(root.innerHTML, /Act \d+ Complete/);

  persistence.recordRunHistory(state.profile, state.run, "completed");
  state.profile.activeRunSnapshot = null;
  state.phase = appEngine.PHASES.RUN_COMPLETE;
  render();
  assert.match(root.innerHTML, /Expedition Summary/);
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
  state.ui.hallExpanded = true;
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
  assert.match(root.innerHTML, /actmap/);

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
