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
  assert.match(root.innerHTML, /Town Navigator/);
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
  assert.match(root.innerHTML, /actmap/);
  assert.match(root.innerHTML, /Act \d/);
  assert.match(root.innerHTML, /actmap__canvas/);
  assert.match(root.innerHTML, /waypoint/);
  assert.match(root.innerHTML, /Route Atlas/);

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
  state.phase = appEngine.PHASES.ACT_TRANSITION;
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
  assert.match(root.innerHTML, /Enter Rogue Encampment/);

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

  state.ui.hallExpanded = true;
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

  state.ui.hallExpanded = true;
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

  state.ui.hallExpanded = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Account Overview/);
  assert.match(root.innerHTML, /Career Stats/);
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

  state.ui.hallExpanded = true;
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Account Overview/);
  assert.match(root.innerHTML, /Career Stats/);

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
  assert.match(root.innerHTML, /Expedition Summary/);
  assert.match(root.innerHTML, /Outcome/);
  assert.match(root.innerHTML, /Account Records/);
  assert.match(root.innerHTML, /Archive/);
  assert.match(root.innerHTML, /Unlocks/);
  assert.match(root.innerHTML, /Return To Account Hall/);

  appEngine.returnToFrontDoor(state);
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });
  assert.match(root.innerHTML, /Recent Expeditions|Account Overview/);
});
