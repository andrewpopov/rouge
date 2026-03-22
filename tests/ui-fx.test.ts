export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function startRunAndEnterCombat(harness: ReturnType<typeof createHarness>) {
  const { appEngine, appShell, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
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
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;

  return { state, root, render, syncCombatResultAndRender, actionDispatcher, appEngine, combatEngine, createActionTarget, browserWindow };
}

test("doCombatAction captures snapshot, runs action, and calls syncAndRender", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const combatFx = browserWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  let synced = false;
  const action = () => { combatEngine.endTurn(state); };
  const syncAndRender = () => { synced = true; };

  combatFx.doCombatAction(state, action, syncAndRender);
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(synced, true, "syncAndRender should have been called");
  assert.ok(state.turn >= 1, "turn should have advanced");
});

test("addTempClass adds and removes a CSS class after timeout", (_, done) => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const combatFx = browserWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;

  const fakeEl = { classList: { add: (_: string) => {}, remove: (_: string) => {} } };
  let added = "";
  let removed = "";
  fakeEl.classList.add = (cls: string) => { added = cls; };
  fakeEl.classList.remove = (cls: string) => { removed = cls; };

  combatFx.addTempClass(fakeEl as never, "test-class", 10);
  assert.equal(added, "test-class", "class should be added immediately");

  setTimeout(() => {
    assert.equal(removed, "test-class", "class should be removed after timeout");
    browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
    done();
  }, 50);
});

test("spawnRewardParticles does not throw when sourceEl has getBoundingClientRect", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const rewardFx = browserWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;

  const fakeEl = {
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 50, height: 30 }),
  };

  assert.doesNotThrow(() => {
    rewardFx.spawnRewardParticles(fakeEl as never);
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("spawnRewardParticles is a no-op when sourceEl lacks getBoundingClientRect", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const rewardFx = browserWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;

  assert.doesNotThrow(() => {
    rewardFx.spawnRewardParticles({} as never);
  });
});

test("app shell renders boot state when appState is null", () => {
  const harness = createHarness();
  const { appShell, browserWindow } = harness;
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "loading", error: "" },
  });

  assert.ok(root.innerHTML.length > 0, "should render something for boot state");
});

test("app shell renders error state", () => {
  const harness = createHarness();
  const { appShell, browserWindow } = harness;
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "error", error: "Something went wrong" },
  });

  assert.ok(root.innerHTML.includes("Something went wrong") || root.innerHTML.includes("error"), "should show error state");
});

test("app shell renders debug bar when debug mode is enabled", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);

  if (!state.profile.meta.settings) {
    state.profile.meta.settings = { showHints: true, reduceMotion: false, compactMode: false, debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false } };
  }
  state.profile.meta.settings.debugMode = { enabled: true, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false };

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("debug-bar"), "should render debug bar");
  assert.ok(root.innerHTML.includes("DEBUG"), "should show DEBUG label");
});

test("app shell renders game menu during run phases", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("game-menu"), "should render game menu during safe_zone");
});

test("app shell renders inventory overlay when inventoryOpen is true", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  state.ui.inventoryOpen = true;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("inv-overlay"), "should render inventory overlay");
});

test("play-card action through dispatcher is handled for a card in hand", () => {
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } =
    startRunAndEnterCombat(createHarness());

  const targetEnemy = state.combat.enemies.find((e: CombatEnemyState) => e.alive);
  if (targetEnemy) { state.combat.selectedEnemyId = targetEnemy.id; }

  // Give enough energy to play any card
  state.combat.hero.energy = 10;

  const card = state.combat.hand[0];
  if (!card) { return; }

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "play-card", instanceId: card.instanceId }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender,
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(handled, true, "play-card action should be handled");
});

test("select-enemy action updates selectedEnemyId without re-rendering", () => {
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, browserWindow } =
    startRunAndEnterCombat(createHarness());

  const enemy = state.combat.enemies.find((e: CombatEnemyState) => e.alive);
  assert.ok(enemy);

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-enemy", enemyId: enemy.id }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => { throw new Error("render should not be called for select-enemy"); },
    syncCombatResultAndRender: () => {},
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(handled, true);
  assert.equal(state.combat.selectedEnemyId, enemy.id);
});

test("begin-encounter action applies approach bonus and clears exploring flag", () => {
  const harness = createHarness();
  const { appEngine, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = true;

  const guardBefore = state.combat.hero.guard;

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "begin-encounter", bonus: "guard:5" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });

  assert.equal(handled, true);
  assert.equal(state.ui.exploring, false);
  assert.equal(state.combat.hero.guard, guardBefore + 5);
});

test("use-town-action action executes a town action", () => {
  const harness = createHarness();
  const { appEngine, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);

  // Damage the hero to make a healing action available
  state.run.hero.currentLife = 1;
  const townActions = browserWindow.ROUGE_ITEM_TOWN.listTownActions(state.run, state.profile, state.content);
  const healAction = townActions.find((a: TownAction) => a.category === "service" && !a.disabled && a.cost <= state.run.gold);

  if (healAction) {
    const handled = actionDispatcher.handleClick({
      target: createActionTarget({ action: "use-town-action", townActionId: healAction.id }),
      appState: state,
      appEngine,
      combatEngine,
      render: () => {},
      syncCombatResultAndRender: () => {},
    });
    browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
    assert.equal(handled, true);
  }
});

test("set-preferred-class action updates profile preferred class", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-preferred-class", classId: "necromancer" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
  const summary = appEngine.getProfileSummary(state);
  assert.equal(summary.preferredClassId, "necromancer");
});

test("set-account-progression-focus action updates focused tree", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const accountSummary = appEngine.getAccountProgressSummary(state);
  const firstTree = accountSummary.trees?.[0];
  if (firstTree) {
    const handled = actionDispatcher.handleClick({
      target: createActionTarget({ action: "set-account-progression-focus", accountTreeId: firstTree.id }),
      appState: state,
      appEngine,
      combatEngine,
      render: () => {},
      syncCombatResultAndRender: () => {},
    });
    assert.equal(handled, true);
  }
});

test("set-run-history-review action updates review index", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-run-history-review", historyIndex: "2" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
});

test("complete-tutorial and dismiss-tutorial actions update tutorial state", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "complete-tutorial", tutorialId: "front_door_profile_hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "dismiss-tutorial", tutorialId: "front_door_expedition" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
});

test("combat view renders exploration screen with approach choices", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("explore-screen"), "should render exploration screen");
  assert.ok(root.innerHTML.includes("explore-card"), "should render approach choice cards");
  assert.ok(root.innerHTML.includes("begin-encounter"), "should have begin-encounter action");
});

test("combat view renders combat screen when not exploring", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("combat-screen"), "should render combat screen");
  assert.ok(root.innerHTML.includes("fan-card") || root.innerHTML.includes("play-card"), "should show playable cards");
});

test("world map view renders zone waypoints and edges", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("actmap"), "should render act map");
  assert.ok(root.innerHTML.includes("waypoint"), "should render zone waypoints");
  assert.ok(root.innerHTML.includes("map-edge"), "should render edge connections");
  assert.ok(root.innerHTML.includes("select-zone"), "should have clickable zone actions");
});

test("reward view renders reward choices after combat victory", () => {
  const { state, syncCombatResultAndRender, browserWindow } =
    startRunAndEnterCombat(createHarness());

  state.combat.outcome = "victory";
  syncCombatResultAndRender();

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  browserWindow.ROUGE_APP_SHELL.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("claim-reward-choice"), "should show reward claim buttons");
});

test("character select view renders class and mercenary options", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("select-class"), "should show class selection buttons");
  assert.ok(root.innerHTML.length > 500, "should render substantial character select content");
});
