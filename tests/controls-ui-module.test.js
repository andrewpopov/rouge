const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadControlsUiModule() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "controls-ui.js"), "utf8");
  new vm.Script(source, { filename: "controls-ui.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_CONTROLS_UI;
}

function createEvent(overrides = {}) {
  let prevented = false;
  return {
    defaultPrevented: false,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    code: "",
    target: null,
    preventDefault() {
      prevented = true;
    },
    wasPrevented() {
      return prevented;
    },
    ...overrides,
  };
}

function createButton(id) {
  const listeners = {};
  return {
    id,
    disabled: false,
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    click() {
      if (typeof listeners.click === "function") {
        listeners.click();
      }
    },
  };
}

test("createControlHotkeyHandler triggers lane-shift shortcuts", () => {
  const controlsUi = loadControlsUiModule();
  const triggered = [];

  const handler = controlsUi.createControlHotkeyHandler({
    isInteractiveShortcutTargetFn: () => false,
    triggerControlShortcutFn: (button) => {
      triggered.push(button.id);
      return true;
    },
    shiftLeftBtn: { id: "left" },
    shiftRightBtn: { id: "right" },
    endTurnBtn: { id: "end", dataset: {} },
  });

  const event = createEvent({ code: "KeyQ" });
  handler(event);

  assert.deepEqual(triggered, ["left"]);
  assert.equal(event.wasPrevented(), true);
});

test("createControlHotkeyHandler reports locked end turn reason", () => {
  const controlsUi = loadControlsUiModule();
  const reasons = [];

  const handler = controlsUi.createControlHotkeyHandler({
    isInteractiveShortcutTargetFn: () => false,
    triggerControlShortcutFn: (button) => button.id !== "end",
    shiftLeftBtn: { id: "left" },
    shiftRightBtn: { id: "right" },
    endTurnBtn: { id: "end", dataset: { lockReason: "Unsafe to end turn." } },
    onEndTurnLocked: (reason) => reasons.push(reason),
  });

  const event = createEvent({ code: "Space" });
  handler(event);

  assert.deepEqual(reasons, ["Unsafe to end turn."]);
  assert.equal(event.wasPrevented(), true);
});

test("createControlHotkeyHandler ignores modifier-key events", () => {
  const controlsUi = loadControlsUiModule();
  let calls = 0;

  const handler = controlsUi.createControlHotkeyHandler({
    isInteractiveShortcutTargetFn: () => false,
    triggerControlShortcutFn: () => {
      calls += 1;
      return true;
    },
    shiftLeftBtn: { id: "left" },
    shiftRightBtn: { id: "right" },
    endTurnBtn: { id: "end", dataset: {} },
  });

  const event = createEvent({ code: "KeyE", ctrlKey: true });
  handler(event);

  assert.equal(calls, 0);
  assert.equal(event.wasPrevented(), false);
});

test("bindPrimaryControls wires click handlers for provided controls", () => {
  const controlsUi = loadControlsUiModule();
  const calls = [];
  const buttons = {
    overclock: createButton("overclock"),
    endTurn: createButton("endTurn"),
    shiftLeft: createButton("shiftLeft"),
    shiftRight: createButton("shiftRight"),
    cycleHand: createButton("cycleHand"),
    toggleOnboarding: createButton("toggleOnboarding"),
    dismissOnboarding: createButton("dismissOnboarding"),
    resetMeta: createButton("resetMeta"),
    resetRunRecords: createButton("resetRunRecords"),
    toggleRunTimeline: createButton("toggleRunTimeline"),
    skipReward: createButton("skipReward"),
  };

  controlsUi.bindPrimaryControls({
    overclockBtn: buttons.overclock,
    endTurnBtn: buttons.endTurn,
    shiftLeftBtn: buttons.shiftLeft,
    shiftRightBtn: buttons.shiftRight,
    cycleHandBtn: buttons.cycleHand,
    toggleOnboardingBtn: buttons.toggleOnboarding,
    dismissOnboardingBtn: buttons.dismissOnboarding,
    resetMetaBtn: buttons.resetMeta,
    resetRunRecordsBtn: buttons.resetRunRecords,
    toggleRunTimelineBtn: buttons.toggleRunTimeline,
    skipRewardBtn: buttons.skipReward,
    onUseOverclock: () => calls.push("overclock"),
    onEndTurn: () => calls.push("endTurn"),
    onShiftLeft: () => calls.push("shiftLeft"),
    onShiftRight: () => calls.push("shiftRight"),
    onCycleHand: () => calls.push("cycleHand"),
    onToggleOnboarding: () => calls.push("toggleOnboarding"),
    onDismissOnboarding: () => calls.push("dismissOnboarding"),
    onResetMeta: () => calls.push("resetMeta"),
    onResetRunRecords: () => calls.push("resetRunRecords"),
    onToggleRunTimeline: () => calls.push("toggleRunTimeline"),
    onSkipReward: () => calls.push("skipReward"),
  });

  Object.values(buttons).forEach((button) => {
    button.click();
  });

  assert.deepEqual(calls, [
    "overclock",
    "endTurn",
    "shiftLeft",
    "shiftRight",
    "cycleHand",
    "toggleOnboarding",
    "dismissOnboarding",
    "resetMeta",
    "resetRunRecords",
    "toggleRunTimeline",
    "skipReward",
  ]);
});

test("createEnemyTooltipDismissHandler closes tooltip only when clicking outside enemies", () => {
  const controlsUi = loadControlsUiModule();
  const state = {
    openEnemyTooltipId: "enemy_1",
    clearCalls: 0,
    renderCalls: 0,
  };

  const handler = controlsUi.createEnemyTooltipDismissHandler({
    getOpenEnemyTooltipId: () => state.openEnemyTooltipId,
    setOpenEnemyTooltipId: (value) => {
      state.openEnemyTooltipId = value;
    },
    clearLaneHighlightFn: (force) => {
      if (force) {
        state.clearCalls += 1;
      }
    },
    renderEnemiesFn: () => {
      state.renderCalls += 1;
    },
  });

  handler({
    target: {
      closest: () => ({ id: "enemy-button" }),
    },
  });
  assert.equal(state.openEnemyTooltipId, "enemy_1");
  assert.equal(state.clearCalls, 0);
  assert.equal(state.renderCalls, 0);

  handler({
    target: {
      closest: () => null,
    },
  });
  assert.equal(state.openEnemyTooltipId, null);
  assert.equal(state.clearCalls, 1);
  assert.equal(state.renderCalls, 1);
});

test("createOnboardingController toggles panel visibility and updates HUD", () => {
  const controlsUi = loadControlsUiModule();
  const game = {
    showOnboarding: false,
    onboardingDismissed: false,
  };
  let updateCalls = 0;

  const controller = controlsUi.createOnboardingController({
    game,
    saveOnboardingStateFn: () => {},
    updateHudFn: () => {
      updateCalls += 1;
    },
  });

  const result = controller.toggleOnboardingPanel();
  assert.equal(result, true);
  assert.equal(game.showOnboarding, true);
  assert.equal(updateCalls, 1);
});

test("createOnboardingController dismiss persists once and hides panel", () => {
  const controlsUi = loadControlsUiModule();
  const game = {
    showOnboarding: true,
    onboardingDismissed: false,
  };
  let saveCalls = 0;
  let updateCalls = 0;

  const controller = controlsUi.createOnboardingController({
    game,
    saveOnboardingStateFn: () => {
      saveCalls += 1;
    },
    updateHudFn: () => {
      updateCalls += 1;
    },
  });

  controller.dismissOnboarding();
  assert.equal(game.onboardingDismissed, true);
  assert.equal(game.showOnboarding, false);
  assert.equal(saveCalls, 1);
  assert.equal(updateCalls, 1);

  controller.dismissOnboarding();
  assert.equal(saveCalls, 1);
  assert.equal(updateCalls, 2);
});
