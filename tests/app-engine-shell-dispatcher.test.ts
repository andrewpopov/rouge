export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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

  state.ui.hallExpanded = true;
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
  assert.match(root.innerHTML, /Choose Your Hero/);

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
  assert.match(root.innerHTML, /First Expedition Charter/);
  assert.match(root.innerHTML, /continue-act-guide/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "continue-act-guide" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
  assert.match(root.innerHTML, /actmap/);

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
  assert.match(root.innerHTML, /explore-screen/);
  state.ui.exploring = false;
  render();
  assert.match(root.innerHTML, /combat-screen/);

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
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  // Zone has a second encounter — fight through it so we land on world_map
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
  assert.equal(runFactory.getZoneById(state.run, openingZoneId).encountersCleared, 2);
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
  assert.match(root.innerHTML, /After this claim the shell moves to the Act Guide\./);

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
  assert.match(root.innerHTML, /Act Boss Reward/);
  assert.match(root.innerHTML, /continue-act-guide/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "continue-act-guide" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  assert.equal(handled, true);
  assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
  assert.match(root.innerHTML, /Act \d+ Complete/);
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
  assert.match(root.innerHTML, /Has Fallen/);
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

  state.ui.hallExpanded = true;
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

test("action dispatcher opens and closes the training overlay from the safe zone", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, seedBundle } =
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

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);
  render();

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "open-training-view", trainingSource: "safe_zone" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.trainingView.open, true);
  assert.match(root.innerHTML, /Training Hall/);
  assert.match(root.innerHTML, /Training Desk/);
  assert.match(root.innerHTML, /Town Districts/);
  assert.match(root.innerHTML, /Camp Services/);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "close-training-view" }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.ui.trainingView.open, false);
});

test("action dispatcher routes swap-training-skill through the training overlay flow", () => {
  const { actionDispatcher, appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, seedBundle } =
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

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  const classProgression = browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "amazon");
  assert.ok(classProgression);
  const firstBridge = classProgression.trees[0].skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2);
  const secondBridge = classProgression.trees[1].skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2);
  assert.ok(firstBridge);
  assert.ok(secondBridge);

  state.run.level = 12;
  state.run.progression.classPointsAvailable = 8;
  for (let index = 0; index < 3; index += 1) {
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${classProgression.trees[0].id}`, content);
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${classProgression.trees[1].id}`, content);
  }
  browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, firstBridge.id);
  browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, secondBridge.id);
  appEngine.equipTrainingSkill(state, "slot2", firstBridge.id);
  appEngine.openTrainingView(state, "safe_zone");
  appEngine.setTrainingMode(state, "swap");
  appEngine.selectTrainingTree(state, classProgression.trees[1].id);
  render();
  assert.match(root.innerHTML, /Training Hall/);

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "swap-training-skill", slotKey: "slot2", skillId: secondBridge.id }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender: render,
  });
  assert.equal(handled, true);
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot2SkillId, secondBridge.id);
  assert.equal(state.ui.trainingView.mode, "swap");
});
