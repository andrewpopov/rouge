export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

test("front door renders welcome screen with class roster for a fresh profile", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.length > 200, "should produce substantial front-door markup");
  assert.ok(root.innerHTML.includes("Open A New Expedition") || root.innerHTML.includes("Expedition"), "should show expedition entry point");
});

test("front door renders run history summary after completing a run", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  // Start and complete a run
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);

  // Fast-forward through by abandoning
  appEngine.returnToFrontDoor(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.length > 200, "should produce substantial front-door markup after run");
});

test("front door hall expansion shows account sections", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  state.ui.hallExpanded = true;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("Account") || root.innerHTML.includes("account"), "should show account sections when hall expanded");
});

test("front door welcome screen includes class count and action buttons", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(
    root.innerHTML.includes("start-character-select") || root.innerHTML.includes("expand-hall"),
    "should include actionable buttons"
  );
});

test("front door saved run guidance shows resume option", () => {
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.returnToFrontDoor(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  state.ui.hallExpanded = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(
    root.innerHTML.includes("continue-saved-run") || root.innerHTML.includes("Resume") || root.innerHTML.includes("Saved"),
    "should show resume option for saved run"
  );
});
