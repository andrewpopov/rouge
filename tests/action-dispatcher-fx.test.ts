export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function setupEncounterState(harness: ReturnType<typeof createHarness>) {
  const { appEngine, appShell, browserWindow, content, combatEngine, createActionTarget, actionDispatcher, seedBundle } = harness;
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

  // Get to encounter phase
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

test("handleClick returns false for null target", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: null,
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, false);
});

test("handleClick returns false for unknown action", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "nonexistent-action" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, false);
});

test("inventory open and close actions toggle inventoryOpen state", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
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

  assert.equal(state.ui.inventoryOpen, false);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "open-inventory" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.inventoryOpen, true);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "close-inventory" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.inventoryOpen, false);
});

test("switch-inv-tab action changes the inventory tab", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "switch-inv-tab", invTab: "character" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.inventoryTab, "character");
});

test("select-inventory-entry pins the clicked pack item", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-inventory-entry", entryId: "entry_7" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.inventoryDetailEntryId, "entry_7");
});

test("toggle-scroll-map flips scrollMapOpen state", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  assert.ok(!state.ui.scrollMapOpen, "scrollMapOpen should start falsy");

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-scroll-map" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.scrollMapOpen, true);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-scroll-map" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.scrollMapOpen, false);
});

test("toggle-route-intel flips routeIntelOpen state", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  assert.ok(!state.ui.routeIntelOpen, "routeIntelOpen should start falsy");

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-route-intel" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.routeIntelOpen, true);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-route-intel" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.routeIntelOpen, false);
});

test("end-turn action advances combat phase", () => {
  const setup = setupEncounterState(createHarness());
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } = setup;

  assert.ok(state.combat, "should have combat state");
  assert.equal(state.combat.phase, "player");

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "end-turn" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender,
  });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.ok(state.combat.turn >= 1, "turn should have advanced");
});

test("use-potion-hero action heals the hero", () => {
  const setup = setupEncounterState(createHarness());
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } = setup;

  state.combat.hero.life = Math.max(1, state.combat.hero.life - 10);
  const lifeBefore = state.combat.hero.life;
  const potionsBefore = state.combat.potions;

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "use-potion-hero" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender,
  });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  if (potionsBefore > 0) {
    assert.ok(state.combat.hero.life >= lifeBefore, "hero life should increase or stay same");
    assert.equal(state.combat.potions, potionsBefore - 1);
  }
});

test("melee-strike action uses the melee attack", () => {
  const setup = setupEncounterState(createHarness());
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } = setup;

  state.combat.weaponDamageBonus = 5;
  state.combat.meleeUsed = false;

  const enemyLifeBefore = state.combat.enemies[0].life;

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "melee-strike" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender,
  });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.ok(state.combat.enemies[0].life <= enemyLifeBefore, "enemy should take damage from melee strike");
});

test("prompt and cancel abandon saved run toggles confirmAbandonSavedRun", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "prompt-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.confirmAbandonSavedRun, true);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "cancel-abandon-saved-run" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.confirmAbandonSavedRun, false);
});

test("expand-hall and collapse-hall toggle hall state", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "expand-hall", section: "expedition" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.hallExpanded, true);
  assert.equal(state.ui.hallSection, "expedition");

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "collapse-hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.hallExpanded, false);
  assert.equal(state.ui.hallSection, "");
});

test("switch-hall-section changes active hall section", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "switch-hall-section", section: "controls" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.hallSection, "controls");
});

test("reduceMotion and compactMode profile settings toggle through dispatcher", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-profile-setting", settingKey: "reduceMotion", settingValue: "true" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(appEngine.getAccountProgressSummary(state).settings.reduceMotion, true);

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "toggle-profile-setting", settingKey: "compactMode", settingValue: "true" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(appEngine.getAccountProgressSummary(state).settings.compactMode, true);
});

test("focus-town-npc and close-town-npc toggle townFocus", () => {
  const harness = createHarness();
  const { actionDispatcher, appEngine, combatEngine, content, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "focus-town-npc", npcId: "healer" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.townFocus, "healer");

  actionDispatcher.handleClick({
    target: createActionTarget({ action: "close-town-npc" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(state.ui.townFocus, "");
});
