export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
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
  assert.match(root.innerHTML, /Boss gallery: The Briar Matron\./);
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
