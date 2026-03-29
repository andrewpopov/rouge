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

test("continueSavedRun restores a safe-zone snapshot and can re-enter the route", () => {
  const { content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  assert.equal(appEngine.startRun(state).ok, true);
  appEngine.returnToFrontDoor(state);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.SAFE_ZONE);

  const savedSummary = appEngine.getSavedRunSummary();
  assert.ok(savedSummary);
  assert.equal(savedSummary.phase, appEngine.PHASES.SAFE_ZONE);

  assert.equal(appEngine.leaveSafeZone(resumedState).ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.WORLD_MAP);

  const worldMapSummary = appEngine.getSavedRunSummary();
  assert.ok(worldMapSummary);
  assert.equal(worldMapSummary.phase, appEngine.PHASES.WORLD_MAP);
});

test("continueSavedRun restores a reward snapshot and advances back to the route", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
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
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  state.combat.outcome = "victory";
  assert.equal(appEngine.syncEncounterOutcome(state).ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  appEngine.returnToFrontDoor(state);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.REWARD);
  assert.ok(resumedState.run?.pendingReward);

  const rewardChoiceId = resumedState.run.pendingReward.choices[0].id;
  assert.equal(appEngine.claimRewardAndAdvance(resumedState, rewardChoiceId).ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(resumedState.run.pendingReward, null);
});

test("front-door saved-run cards change guidance by saved phase", () => {
  const { content, combatEngine, appEngine, appShell, runFactory, browserWindow, seedBundle } = createHarness();
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const renderFrontDoorForPhase = (phase: AppPhase): string => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    appEngine.startCharacterSelect(state);
    assert.equal(appEngine.startRun(state).ok, true);

    if (phase === appEngine.PHASES.WORLD_MAP || phase === appEngine.PHASES.REWARD || phase === appEngine.PHASES.ACT_TRANSITION) {
      assert.equal(appEngine.leaveSafeZone(state).ok, true);
    }

    if (phase === appEngine.PHASES.REWARD || phase === appEngine.PHASES.ACT_TRANSITION) {
      const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
      assert.equal(appEngine.selectZone(state, openingZoneId).ok, true);
      state.combat.outcome = "victory";
      assert.equal(appEngine.syncEncounterOutcome(state).ok, true);
    }

    if (phase === appEngine.PHASES.ACT_TRANSITION) {
      assert.ok(state.run?.pendingReward);
      state.run.pendingReward.endsAct = true;
      assert.equal(appEngine.claimRewardAndAdvance(state, state.run.pendingReward.choices[0].id).ok, true);
      assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
    }

    appEngine.returnToFrontDoor(state);
    state.ui.hallExpanded = true;
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
    return root.innerHTML;
  };

  const safeZoneHtml = renderFrontDoorForPhase(appEngine.PHASES.SAFE_ZONE);
  assert.match(safeZoneHtml, /Town recovery, loadout review, stash pressure, and departure prep are the first read on return\./);
  assert.match(safeZoneHtml, /Continue Saved Run/);

  const worldMapHtml = renderFrontDoorForPhase(appEngine.PHASES.WORLD_MAP);
  assert.match(worldMapHtml, /Route intel, blocked nodes, and the next zone choice are the first read on return\./);
  assert.match(worldMapHtml, /Continue Saved Run/);

  const rewardHtml = renderFrontDoorForPhase(appEngine.PHASES.REWARD);
  assert.match(rewardHtml, /A reward claim is parked — choose one before the route moves again\./);
  assert.match(rewardHtml, /Continue Saved Run/);

  const actTransitionHtml = renderFrontDoorForPhase(appEngine.PHASES.ACT_TRANSITION);
  assert.match(actTransitionHtml, /Act delta review is parked, then the next town opens with the same expedition state\./);
  assert.match(actTransitionHtml, /Continue Saved Run/);
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
  assert.match(root.innerHTML, /Loading classes/);

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

  state.ui.hallExpanded = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Account Hall/);
  assert.match(root.innerHTML, /Account Overview/);
  assert.match(root.innerHTML, /Career Stats/);
  assert.match(root.innerHTML, /Account Tree Review/);
  assert.match(root.innerHTML, /Account Controls/);
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
  assert.match(root.innerHTML, /Town Ledger/);
  assert.match(root.innerHTML, /Run State Vs Profile State/);
  assert.match(root.innerHTML, /Progression Board/);
  assert.match(root.innerHTML, /Account Signals/);
  assert.match(root.innerHTML, /Prep Comparison Board/);
  assert.match(root.innerHTML, /Before Or After Desk/);
  assert.match(root.innerHTML, /Recovery Reset/);
  assert.match(root.innerHTML, /Market Reset/);
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
  assert.match(root.innerHTML, /First Expedition Charter/);
  assert.match(root.innerHTML, /continue-act-guide/);

  appEngine.continueActGuide(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /actmap/);
  assert.match(root.innerHTML, /Act \d/);
  assert.match(root.innerHTML, /actmap__canvas/);
  assert.match(root.innerHTML, /waypoint/);
  assert.doesNotMatch(root.innerHTML, /Route Atlas/);
  assert.match(root.innerHTML, /View Route Intel/);

  state.ui.routeIntelOpen = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Route Atlas/);
  assert.match(root.innerHTML, /Hide Route Intel/);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /explore-screen/);
  state.ui.exploring = false;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /combat-screen/);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Choose Your Reward/);
  assert.match(root.innerHTML, /Combat Reward/);
  assert.match(root.innerHTML, /Before &amp; After/);
  assert.match(root.innerHTML, /Next Phase/);
  assert.match(root.innerHTML, /Party State/);
  assert.match(root.innerHTML, /reward-choice-card__category/);

  state.run.summary.actsCleared = Math.max(state.run.summary.actsCleared, 1);
  state.run.summary.bossesDefeated = Math.max(state.run.summary.bossesDefeated, 1);
  state.run.guide.overlayKind = "reward";
  state.run.guide.targetActNumber = state.run.actNumber + 1;
  state.phase = appEngine.PHASES.ACT_TRANSITION;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Act Boss Reward/);
  assert.match(root.innerHTML, /Recovered Guide Scroll/);

  appEngine.continueActGuide(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Act \d+ Complete/);
  assert.match(root.innerHTML, /cutscene/);
  assert.match(root.innerHTML, /continue-act-transition/);
});

test("expedition launch flow persists from hall through character select into town", () => {
  const { content, combatEngine, appEngine, appShell, browserWindow, seedBundle } = createHarness();
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

  state.profile.meta.progression.preferredClassId = "sorceress";
  state.ui.hallExpanded = true;

  render();
  assert.match(root.innerHTML, /Expedition Launch Flow/);
  assert.match(root.innerHTML, /Hall Signal/);
  assert.match(root.innerHTML, /Draft Commit/);
  assert.match(root.innerHTML, /Town Arrival/);
  assert.match(root.innerHTML, /Preferred draft signal: Sorceress\./);
  assert.match(root.innerHTML, /Open character draft once the hall signal is settled\./);

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  render();
  assert.match(root.innerHTML, /Choose Your Hero/);
  assert.match(root.innerHTML, /Sorceress/);
  assert.match(root.innerHTML, /Begin Hunt/);

  appEngine.startRun(state);
  render();
  const selectedMercenaryName = state.registries.mercenaries.find((mercenary) => mercenary.id === "iron_wolf")?.name || "Choose a companion";
  assert.match(root.innerHTML, /Expedition Launch Flow/);
  assert.match(root.innerHTML, new RegExp(`Town arrival: ${state.run.safeZoneName}\\.`));
  assert.match(root.innerHTML, new RegExp(`Current launch carries Sorceress with ${selectedMercenaryName}\\.`));
  assert.match(root.innerHTML, /Use this first town pass to validate recovery, spend pressure, stash pressure, and the departure board before you reopen the route\./);
});

test("safe-zone shell turns priority town prep actions into before-or-after reads", () => {
  const { content, combatEngine, appEngine, appShell, browserWindow, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  state.run.hero.currentLife = Math.max(1, state.run.hero.maxLife - 12);
  state.run.mercenary.currentLife = Math.max(1, state.run.mercenary.maxLife - 9);
  state.run.belt.current = 1;
  state.run.progression.skillPointsAvailable = 1;
  state.run.gold = 240;
  state.run.town.vendor.refreshCount = 2;
  state.run.town.vendor.stock = [];

  const townActions = browserWindow.ROUGE_TOWN_SERVICES.listActions(content, state.run, state.profile);
  const healerAction = townActions.find((action) => action.id === "healer_restore_party");
  const quartermasterAction = townActions.find((action) => action.id === "quartermaster_refill_belt");
  const progressionAction = townActions.find((action) => action.id === "progression_spend_vitality");
  const marketAction = townActions.find((action) => action.id === "vendor_refresh_stock");
  assert.ok(healerAction);
  assert.ok(quartermasterAction);
  assert.ok(progressionAction);
  assert.ok(marketAction);

  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Before Or After Desk/);
  assert.match(
    root.innerHTML,
    new RegExp(
      `Projected recovery: hero ${state.run.hero.currentLife}\\/${state.run.hero.maxLife} -&gt; ${state.run.hero.maxLife}\\/${state.run.hero.maxLife}, mercenary ${state.run.mercenary.currentLife}\\/${state.run.mercenary.maxLife} -&gt; ${state.run.mercenary.maxLife}\\/${state.run.mercenary.maxLife}, gold ${state.run.gold} -&gt; ${state.run.gold - healerAction.cost}\\.`
    )
  );
  assert.match(
    root.innerHTML,
    new RegExp(
      `Projected refill: belt ${state.run.belt.current}\\/${state.run.belt.max} -&gt; ${state.run.belt.max}\\/${state.run.belt.max}, gold ${state.run.gold} -&gt; ${state.run.gold - quartermasterAction.cost}\\.`
    )
  );
  assert.match(root.innerHTML, /Projected spend: skill points 1 -&gt; 0, vitality drill rank 0 -&gt; 1\./i);
  assert.match(
    root.innerHTML,
    new RegExp(
      `Projected market reset: gold ${state.run.gold} -&gt; ${state.run.gold - marketAction.cost}, refresh ${state.run.town.vendor.refreshCount} -&gt; ${state.run.town.vendor.refreshCount + 1}, stock rerolls after the fee\\.`
    )
  );
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
  appEngine.continueActGuide(state);
  state.ui.routeIntelOpen = true;
  render();

  assert.match(root.innerHTML, /Quest Fork/);
  assert.match(root.innerHTML, /Aftermath Node/);

  // Clear all mainline zones to unlock world nodes (quest, shrine, event, opportunity)
  const mainlineZones = runFactory.getCurrentZones(state.run).filter(
    (z) => z.kind === "battle" && (z.zoneRole === "opening" || (z.zoneRole || "").startsWith("mainline_")) && !z.zoneRole?.startsWith("side_")
  );
  for (const z of mainlineZones) {
    z.encountersCleared = z.encounterTotal;
    z.cleared = true;
  }
  runFactory.recomputeZoneStatuses(state.run);

  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
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

  state.ui.routeIntelOpen = true;
  render();
  assert.match(root.innerHTML, /actmap/);

  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(eventZone);
  const eventResult = appEngine.selectZone(state, eventZone.id);
  assert.equal(eventResult.ok, true);
  assert.equal(state.phase, appEngine.PHASES.REWARD);
  assert.equal(state.run.pendingReward.kind, "event");

  render();
  assert.match(root.innerHTML, /Aftermath Follow-Up/);
});
