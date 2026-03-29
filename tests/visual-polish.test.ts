export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

// ── Combat View ──

function createCombatFixture() {
  const { content, combatEngine, appEngine, appShell, browserWindow, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);
  assert.equal(appEngine.leaveSafeZone(state).ok, true);
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  assert.equal(appEngine.selectZone(state, openingZoneId).ok, true);
  // Skip exploration screen to render actual combat
  state.ui.exploring = false;

  return { state, appShell, browserWindow };
}

test("combat view renders energy orb with label text", () => {
  const { state, appShell } = createCombatFixture();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: state.content,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /energy-orb__label/);
  assert.match(root.innerHTML, /Energy/);
  assert.match(root.innerHTML, /energy-orb__value/);
  assert.match(root.innerHTML, /energy-orb__max/);
});

test("combat view End Turn button has no encounter number", () => {
  const { state, appShell } = createCombatFixture();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: state.content,
    bootState: { status: "ready", error: "" },
  });

  const endTurnMatch = root.innerHTML.match(/data-action="end-turn"[^>]*>([^<]+)</);
  assert.ok(endTurnMatch, "End Turn button should exist");
  assert.equal(endTurnMatch[1].trim(), "End Turn");
});

test("combat view renders allies and enemies in separate stage sections", () => {
  const { state, appShell } = createCombatFixture();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: state.content,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /stage__allies/);
  assert.match(root.innerHTML, /stage__enemies/);
  assert.match(root.innerHTML, /stage__backdrop/);
  assert.match(root.innerHTML, /stage__floor/);
});

// ── Safe-Zone View (Merchant & NPC badges) ──

function createTownFixture() {
  const { content, combatEngine, appEngine, appShell, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);

  return { state, appShell, browserWindow };
}

test("safe-zone view renders NPC badge tooltips with action counts", () => {
  const { state, appShell } = createTownFixture();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: state,
    baseContent: state.content,
    bootState: { status: "ready", error: "" },
  });

  // NPC badges should have title attributes with action counts
  const badgeMatches = root.innerHTML.match(/town-npc-icon__badge[^>]*title="[^"]*action/g);
  assert.ok(badgeMatches && badgeMatches.length > 0, "NPC badges should include action count tooltips");
});

test("safe-zone merchant overlay includes description text", () => {
  const { state, appShell, browserWindow: _browserWindow } = createTownFixture();

  // Focus on a vendor NPC to trigger the overlay
  state.ui.townFocus = "vendor";

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: state.content,
    bootState: { status: "ready", error: "" },
  });

  // Merchant overlay should render with merchant-card__desc elements
  assert.match(root.innerHTML, /merchant-card__desc/);
  assert.match(root.innerHTML, /merchant-screen/);
});

test("safe-zone merchant helper renders extracted overlay markup directly", () => {
  const { state, browserWindow } = createTownFixture();
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const operations = browserWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW.createOperationsModel(state, services);
  const overlay = browserWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT.buildNpcOverlay(
    {
      id: "vendor",
      name: "Gheed",
      role: "Vendor & Gambler",
      icon: "\u2696",
      actions: operations.vendorActions,
      emptyLabel: "Vendor stock is empty.",
    },
    state.run.gold,
    state.content,
    services.renderUtils.escapeHtml
  );

  assert.match(overlay, /merchant-screen/);
  assert.match(overlay, /merchant-refresh|merchant-card__desc|merchant-item/);
});

// ── Account Hall: Empty Section Collapsing ──

test("account hall collapses stash vault card when stash is empty", () => {
  const { content, combatEngine, appEngine, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const hallSections = browserWindow.__ROUGE_HALL_VIEW_SECTIONS;
  const accountSummary = appEngine.getAccountProgressSummary(state);

  const markup = hallSections.buildAccountOverviewMarkup(
    state,
    services,
    null,
    "locked",
    accountSummary
  );

  // With an empty stash, the card should have the --empty modifier
  assert.match(markup, /feature-card--empty/);
  assert.match(markup, /Stash Vault/);
  assert.match(markup, /Send items to stash/);
  // Should NOT contain the full stat grid for stash
  assert.doesNotMatch(markup, /Socket Bases/);
});

test("account hall collapses vault logistics when stash and planning are empty", () => {
  const { content, combatEngine, appEngine, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const hallSections = browserWindow.__ROUGE_HALL_VIEW_SECTIONS;
  const accountSummary = appEngine.getAccountProgressSummary(state);

  const markup = hallSections.buildVaultLogisticsMarkup(state, services, accountSummary);

  // With empty vault, should show the collapsed version
  assert.match(markup, /The vault is empty/);
  assert.match(markup, /feature-card--empty/);
  // Should NOT contain the full vault detail cards
  assert.doesNotMatch(markup, /Socket And Base Watch/);
  assert.doesNotMatch(markup, /Runeword Charter Pressure/);
  assert.doesNotMatch(markup, /Next Draft Forecast/);
});
