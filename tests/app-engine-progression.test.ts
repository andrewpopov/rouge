export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("reward choices can add a new card to the run deck", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const deckSizeBeforeReward = state.run.deck.length;
  appEngine.selectZone(state, openingZoneId);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const cardChoice = state.run.pendingReward.choices.find((choice) => choice.kind === "card");
  assert.ok(cardChoice);
  const cardId = cardChoice.effects.find((effect) => effect.kind === "add_card")?.cardId;
  assert.ok(cardId);

  appEngine.claimRewardAndAdvance(state, cardChoice.id);

  assert.equal(state.run.deck.length, deckSizeBeforeReward + 1);
  assert.ok(state.run.deck.includes(cardId));
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
});

test("equipment rewards persist on the run and feed the next encounter state", () => {
  const { content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const equipmentChoice = state.run.pendingReward.choices.find((choice) => {
    return choice.kind === "item" || choice.kind === "rune";
  });
  assert.ok(equipmentChoice);

  appEngine.claimRewardAndAdvance(state, equipmentChoice.id);

  const equipmentEffect = equipmentChoice.effects[0];
  if (equipmentEffect.kind === "equip_item") {
    const item = content.itemCatalog[equipmentEffect.itemId];
    const loadoutKey = item.slot === "ring" ? "ring1" : item.slot;
    assert.equal((state.run.loadout as Record<string, RunEquipmentState | null>)[loadoutKey]?.itemId, item.id);
  } else {
    const rune = content.runeCatalog[equipmentEffect.runeId];
    const slot = equipmentEffect.slot;
    assert.ok(slot);
    const slotKey = slot === "ring" ? "ring1" : slot;
    assert.ok((state.run.loadout as Record<string, RunEquipmentState | null>)[slotKey]);
    assert.ok((state.run.loadout as Record<string, RunEquipmentState | null>)[slotKey].insertedRunes.includes(rune.id));
  }

  const combatBonuses = itemSystem.buildCombatBonuses(state.run, content);
  // claimRewardAndAdvance auto-advances into the next encounter when the zone isn't cleared
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);
  assert.equal(state.combat.hero.damageBonus, combatBonuses.heroDamageBonus || 0);
  assert.equal(state.combat.hero.guardBonus, combatBonuses.heroGuardBonus || 0);
  assert.equal(state.combat.hero.burnBonus, combatBonuses.heroBurnBonus || 0);
  assert.equal(state.combat.hero.maxLife, state.run.hero.maxLife + (combatBonuses.heroMaxLife || 0));
  assert.equal(state.combat.mercenary.attack, state.run.mercenary.attack + (combatBonuses.mercenaryAttack || 0));

  const target = state.combat.enemies[0];
  if ((combatBonuses.heroGuardBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_guard", cardId: "shield_slam" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_guard", target.id);
    assert.equal(state.combat.hero.guard, 4 + (combatBonuses.heroGuardBonus || 0));
    return;
  }

  if ((combatBonuses.heroDamageBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_damage", cardId: "quick_slash" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_damage", target.id);
    assert.equal(target.life, target.maxLife - (7 + (combatBonuses.heroDamageBonus || 0)));
    return;
  }

  if ((combatBonuses.heroBurnBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_burn", cardId: "fire_bolt" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_burn", target.id);
    assert.equal(target.burn, 2 + (combatBonuses.heroBurnBonus || 0));
    return;
  }

  assert.ok((combatBonuses.heroMaxLife || 0) > 0 || (combatBonuses.mercenaryAttack || 0) > 0);
});

test("itemization progression can open sockets and activate a runeword", () => {
  const { content, combatEngine, appEngine, itemSystem, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const applyChoice = (choice: RewardChoice) => {
    const result = itemSystem.applyChoice(state.run, choice, content);
    assert.equal(result.ok, true);
  };

  applyChoice({
    id: "equip_short_sword",
    kind: "item",
    title: "Short Sword",
    subtitle: "Equip Weapon",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
  });
  applyChoice({
    id: "socket_weapon_1",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_weapon_2",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_tir",
    kind: "rune",
    title: "Tir",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_tir" }],
  });
  applyChoice({
    id: "socket_el",
    kind: "rune",
    title: "El",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_el" }],
  });

  assert.equal(state.run.loadout.weapon?.itemId, "item_short_sword");
  assert.equal(Array.from(state.run.loadout.weapon?.insertedRunes || []).join(","), "rune_tir,rune_el");
  assert.equal(Array.from(itemSystem.getActiveRunewords(state.run, content)).join(","), "Steel");
  assert.equal(Array.from(state.run.progression.activatedRunewords || []).join(","), "steel");
  assert.equal(state.run.summary.runewordsForged, 1);

  const combatBonuses = itemSystem.buildCombatBonuses(state.run, content);
  assert.ok((combatBonuses.heroDamageBonus || 0) >= 5);
});

test("class and attribute progression spends survive snapshot restore and change derived combat bonuses", () => {
  const { content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.startRun(state);

  const classProgression = content.classProgressionCatalog?.[state.run.classId];
  assert.ok(classProgression);
  assert.ok(classProgression.trees.length > 0);

  const firstTreeId = classProgression.trees[0].id;
  const summarizeBonuses = (bonuses: ItemBonusSet) => {
    return Object.values(bonuses).reduce((total, value) => total + (Number.parseInt(String(value || 0), 10) || 0), 0);
  };

  const bonusesBefore = runFactory.buildCombatBonuses(state.run, content);
  state.run.progression.classPointsAvailable = 1;
  state.run.progression.attributePointsAvailable = 2;

  let result = appEngine.useTownAction(state, `progression_tree_${firstTreeId}`);
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(state, "progression_attribute_strength");
  assert.equal(result.ok, true);
  result = appEngine.useTownAction(state, "progression_attribute_energy");
  assert.equal(result.ok, true);

  assert.equal(state.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(state.run.progression.classProgression.favoredTreeId, firstTreeId);
  assert.ok(state.run.progression.classProgression.unlockedSkillIds.length >= 1);
  assert.equal(state.run.progression.attributes.strength, 1);
  assert.equal(state.run.progression.attributes.energy, 1);

  const bonusesAfter = runFactory.buildCombatBonuses(state.run, content);
  assert.ok(summarizeBonuses(bonusesAfter) > summarizeBonuses(bonusesBefore));

  appEngine.leaveSafeZone(state);
  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(restoredSnapshot.run.progression.attributes.strength, 1);
  assert.equal(restoredSnapshot.run.progression.attributes.energy, 1);
  assert.ok(restoredSnapshot.run.progression.classProgression.unlockedSkillIds.length >= 1);

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, snapshot);
  assert.equal(importResult.ok, true);
  assert.equal(importedState.run.progression.classProgression.treeRanks[firstTreeId], 1);
  assert.equal(importedState.run.progression.attributes.strength, 1);
  assert.equal(importedState.run.progression.attributes.energy, 1);
  assert.ok(importedState.run.progression.classProgression.unlockedSkillIds.length >= 1);
});

test("progression summaries cap tree investment and surface favored-tree detail", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.startRun(state);

  const classProgression = content.classProgressionCatalog?.[state.run.classId];
  assert.ok(classProgression);

  const targetTree = classProgression.trees[0];
  state.run.progression.classPointsAvailable = targetTree.maxRank + 1;

  for (let index = 0; index < targetTree.maxRank; index += 1) {
    const result = appEngine.useTownAction(state, `progression_tree_${targetTree.id}`);
    assert.equal(result.ok, true);
  }

  const cappedSpend = appEngine.useTownAction(state, `progression_tree_${targetTree.id}`);
  assert.equal(cappedSpend.ok, false);
  assert.equal(state.run.progression.classProgression.treeRanks[targetTree.id], targetTree.maxRank);
  const directCapResult = runFactory.applyProgressionAction(state.run, `progression_tree_${targetTree.id}`, content);
  assert.equal(directCapResult.ok, false);
  assert.match(directCapResult.message || "", /fully invested/i);

  const progressionSummary = runFactory.getProgressionSummary(state.run, content);
  const targetTreeSummary = progressionSummary.treeSummaries.find((entry) => entry.treeId === targetTree.id);
  assert.equal(progressionSummary.favoredTreeId, targetTree.id);
  assert.equal(progressionSummary.favoredTreeName, targetTree.name);
  assert.ok(targetTreeSummary);
  assert.equal(targetTreeSummary.rank, targetTree.maxRank);
  assert.ok(targetTreeSummary.bonusLines.length > 0);
  assert.ok(progressionSummary.bonusSummaryLines.length > 0);
  assert.match(progressionSummary.nextClassUnlock, /unlock/i);
});

test("profile meta tracks unlocks, tutorials, and lifetime summaries after a run is archived", () => {
  const { content, combatEngine, appEngine, itemSystem, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  const archivedClassId = state.run.classId;
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
    id: "equip_short_sword_meta",
    kind: "item",
    title: "Short Sword",
    subtitle: "Equip Weapon",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
  });
  applyChoice({
    id: "socket_meta_1",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_meta_2",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "socket_meta_tir",
    kind: "rune",
    title: "Tir",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_tir" }],
  });
  applyChoice({
    id: "socket_meta_el",
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

  appEngine.abandonSavedRun(state);

  const archivedProfile = persistence.loadProfileFromStorage();
  assert.ok(archivedProfile);
  assert.ok(archivedProfile.meta.unlocks.classIds.includes(archivedClassId));
  assert.ok(archivedProfile.meta.unlocks.bossIds.includes("andariel"));
  assert.ok(archivedProfile.meta.unlocks.runewordIds.includes("steel"));
  assert.ok(archivedProfile.meta.tutorials.completedIds.includes("first_run_overview"));
  assert.ok(archivedProfile.meta.tutorials.completedIds.includes("safe_zone_progression_board"));
  assert.ok(archivedProfile.meta.tutorials.completedIds.includes("profile_stash"));
  assert.ok(archivedProfile.meta.tutorials.completedIds.includes("runeword_forging"));

  const profileSummary = persistence.getProfileSummary(archivedProfile);
  assert.ok(profileSummary.unlockedBossCount >= 1);
  assert.ok(profileSummary.unlockedRunewordCount >= 1);
  assert.ok(profileSummary.completedTutorialCount >= 4);
  assert.ok(profileSummary.totalGoldCollected >= 77);
  assert.ok(profileSummary.totalRunewordsForged >= 1);
});

test("app engine mutates settings and tutorial state through profile domain APIs", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  let result = appEngine.updateProfileSettings(state, {
    showHints: false,
    compactMode: true,
  });
  assert.equal(result.ok, true);

  result = appEngine.dismissTutorial(state, "front_door_profile_hall");
  assert.equal(result.ok, true);

  result = appEngine.setAccountProgressionFocus(state, "mastery");
  assert.equal(result.ok, true);

  let accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.settings.showHints, false);
  assert.equal(accountSummary.settings.compactMode, true);
  assert.equal(accountSummary.dismissedTutorialCount, 1);
  assert.equal(accountSummary.focusedTreeId, "mastery");
  assert.ok(!accountSummary.activeTutorialIds.includes("front_door_profile_hall"));

  let storedProfile = persistence.loadProfileFromStorage();
  assert.ok(storedProfile);
  assert.equal(storedProfile.meta.settings.showHints, false);
  assert.equal(storedProfile.meta.settings.compactMode, true);
  assert.equal(storedProfile.meta.accountProgression.focusedTreeId, "mastery");
  assert.ok(storedProfile.meta.tutorials.dismissedIds.includes("front_door_profile_hall"));

  result = appEngine.restoreTutorial(state, "front_door_profile_hall");
  assert.equal(result.ok, true);
  accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.dismissedTutorialCount, 0);
  assert.ok(accountSummary.activeTutorialIds.includes("front_door_profile_hall"));

  result = appEngine.completeTutorial(state, "front_door_profile_hall");
  assert.equal(result.ok, true);
  accountSummary = appEngine.getAccountProgressSummary(state);
  assert.ok(!accountSummary.activeTutorialIds.includes("front_door_profile_hall"));
  assert.equal(accountSummary.profile.completedTutorialCount, 1);

  storedProfile = persistence.loadProfileFromStorage();
  assert.ok(storedProfile.meta.tutorials.completedIds.includes("front_door_profile_hall"));
  assert.ok(!storedProfile.meta.tutorials.dismissedIds.includes("front_door_profile_hall"));
});

test("app engine mutates profile-owned runeword planning targets through the account seam", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  let result = appEngine.setPlannedRuneword(state, "weapon", "white");
  assert.equal(result.ok, true);

  result = appEngine.setPlannedRuneword(state, "armor", "lionheart");
  assert.equal(result.ok, true);

  result = appEngine.setPlannedRuneword(state, "weapon", "lionheart");
  assert.equal(result.ok, false);

  let accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponRunewordId, "white");
  assert.equal(accountSummary.planning.armorRunewordId, "lionheart");
  assert.equal(accountSummary.planning.plannedRunewordCount, 2);

  let storedProfile = persistence.loadProfileFromStorage();
  assert.ok(storedProfile);
  assert.equal(storedProfile.meta.planning.weaponRunewordId, "white");
  assert.equal(storedProfile.meta.planning.armorRunewordId, "lionheart");

  result = appEngine.setPlannedRuneword(state, "weapon", "");
  assert.equal(result.ok, true);

  accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponRunewordId, "");
  assert.equal(accountSummary.planning.plannedRunewordCount, 1);

  storedProfile = persistence.loadProfileFromStorage();
  assert.ok(storedProfile);
  assert.equal(storedProfile.meta.planning.weaponRunewordId, "");
  assert.equal(storedProfile.meta.planning.armorRunewordId, "lionheart");
});

test("account planning summaries track archived charter fulfillment", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  let result = appEngine.setPlannedRuneword(state, "weapon", "white");
  assert.equal(result.ok, true);
  result = appEngine.setPlannedRuneword(state, "armor", "lionheart");
  assert.equal(result.ok, true);

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  state.run.summary.actsCleared = 4;
  state.run.summary.runewordsForged = 1;
  state.run.progression.activatedRunewords = ["white"];

  persistence.recordRunHistory(state.profile, state.run, "completed", content);

  const accountSummary = appEngine.getAccountProgressSummary(state);
  assert.equal(accountSummary.planning.weaponArchivedRunCount, 1);
  assert.equal(accountSummary.planning.weaponCompletedRunCount, 1);
  assert.equal(accountSummary.planning.weaponBestActsCleared, 4);
  assert.equal(accountSummary.planning.armorArchivedRunCount, 1);
  assert.equal(accountSummary.planning.armorCompletedRunCount, 0);
  assert.equal(accountSummary.planning.fulfilledPlanCount, 1);
  assert.equal(accountSummary.planning.unfulfilledPlanCount, 1);
  assert.equal(accountSummary.archive.planningCompletionCount, 1);
  assert.equal(accountSummary.archive.planningMissCount, 1);
  assert.ok(accountSummary.archive.recentPlannedRunewordIds.includes("white"));
  assert.ok(accountSummary.archive.recentPlannedRunewordIds.includes("lionheart"));
});

test("boss rewards can grant progression points and saved summaries surface the new pools", () => {
  const { browserWindow, content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);

  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
  });
  const progressionChoice = rewardChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "class_point" || effect.kind === "attribute_point");
  });
  assert.ok(progressionChoice);

  const rewardResult = runFactory.applyReward(
    state.run,
    {
      zoneId: bossZone.id,
      zoneTitle: bossZone.title,
      kind: bossZone.kind,
      title: "Boss Reward",
      lines: [],
      grants: { gold: 0, xp: 0, potions: 0 },
      choices: rewardChoices,
      encounterNumber: 1,
      clearsZone: false,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: state.run.hero.currentLife,
      mercenaryLifeAfterFight: state.run.mercenary.currentLife,
    },
    progressionChoice.id,
    content
  );

  assert.equal(rewardResult.ok, true);
  assert.ok(state.run.progression.classPointsAvailable >= 1);
  assert.ok(state.run.progression.attributePointsAvailable >= 1);
  assert.ok(state.run.summary.classPointsEarned >= 1);
  assert.ok(state.run.summary.attributePointsEarned >= 1);

  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);
  const saveResult = persistence.saveToStorage(snapshot);
  assert.equal(saveResult.ok, true);

  const savedSummary = appEngine.getSavedRunSummary();
  assert.ok(savedSummary);
  assert.equal(savedSummary.classPointsAvailable, state.run.progression.classPointsAvailable);
  assert.equal(savedSummary.attributePointsAvailable, state.run.progression.attributePointsAvailable);
  assert.equal(savedSummary.unlockedClassSkills, state.run.progression.classProgression.unlockedSkillIds.length);
});

test("late-act economy curates stronger vendor stock and boss build pivots", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const applyChoice = (choice: RewardChoice) => {
    const applyResult = itemSystem.applyChoice(state.run, choice, content);
    assert.equal(applyResult.ok, true);
  };

  applyChoice({
    id: "late_equip_weapon",
    kind: "item",
    title: "Short Sword",
    subtitle: "Equip Weapon",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_short_sword" }],
  });
  applyChoice({
    id: "late_equip_armor",
    kind: "item",
    title: "Archon Plate",
    subtitle: "Equip Armor",
    description: "",
    previewLines: [],
    effects: [{ kind: "equip_item", itemId: "item_archon_plate" }],
  });
  applyChoice({
    id: "late_socket_weapon_1",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "late_socket_weapon_2",
    kind: "socket",
    title: "Socket",
    subtitle: "Open Socket",
    description: "",
    previewLines: [],
    effects: [{ kind: "add_socket", slot: "weapon" }],
  });
  applyChoice({
    id: "late_socket_tir",
    kind: "rune",
    title: "Tir",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_tir" }],
  });
  applyChoice({
    id: "late_socket_el",
    kind: "rune",
    title: "El",
    subtitle: "Socket Weapon Rune",
    description: "",
    previewLines: [],
    effects: [{ kind: "socket_rune", slot: "weapon", runeId: "rune_el" }],
  });

  state.run.currentActIndex = 4;
  state.run.level = 11;
  state.run.summary.zonesCleared = 8;
  state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
  state.run.town.vendor.refreshCount = 2;
  state.run.town.vendor.stock = [];
  runFactory.hydrateRun(state.run, content);

  const vendorStock = state.run.town.vendor.stock;
  assert.ok(content.itemCatalog.item_colossus_blade);
  assert.ok(content.itemCatalog.item_archon_plate);
  assert.ok(content.runeCatalog.rune_mal);
  assert.ok(content.runewordCatalog.crescent_moon);
  assert.ok(vendorStock.length >= 10);

  const stockedItems = vendorStock
    .filter((entry) => entry.kind === "equipment")
    .map((entry) => content.itemCatalog[entry.equipment.itemId]);
  const stockedRunes = vendorStock.filter((entry) => entry.kind === "rune").map((entry) => entry.runeId);

  assert.ok(stockedItems.some((item) => item.progressionTier >= 7));
  assert.ok(stockedRunes.includes("rune_mal"));

  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);

  const equipmentChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
  });
  assert.ok(equipmentChoice);
  const equipmentItemIds = equipmentChoice.effects.flatMap((effect) => (effect.kind === "equip_item" ? [effect.itemId] : []));
  assert.equal(equipmentItemIds.length, 1);
  // With all equipment slots available, the reward engine may offer any slot — verify it's a valid item
  assert.ok(content.itemCatalog[equipmentItemIds[0]], "reward should be a valid item from the catalog");

  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
  });
  const progressionChoice = rewardChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "class_point" || effect.kind === "attribute_point");
  });
  assert.ok(progressionChoice);

  const totalClassPoints = progressionChoice.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" ? effect.value : 0);
  }, 0);

  assert.ok(totalClassPoints >= 2);
  assert.match(progressionChoice.title, /Mastery/);
  assert.ok(progressionChoice.previewLines.some((line) => /unlock/i.test(line)));
});

test("run rewards can level the party and snapshots restore the progressed run", () => {
  const { content, combatEngine, appEngine, itemSystem, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  state.run.gold = 73;
  const heroLifeBefore = state.run.hero.maxLife;
  const heroEnergyBefore = state.run.hero.maxEnergy;
  const mercenaryAttackBefore = state.run.mercenary.attack;

  const openingZone = runFactory.getCurrentZones(state.run)[0];
  const initialEquipmentChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: 1,
    encounterNumber: 1,
  });
  const initialItemEffect = initialEquipmentChoice?.effects.find((effect) => effect.kind === "equip_item");
  const initialItemId = initialItemEffect?.itemId || "";
  assert.ok(initialItemId);
  const initialItemTier = content.itemCatalog[initialItemId].progressionTier;
  const rewardResult = runFactory.applyReward(
    state.run,
    {
      zoneId: openingZone.id,
      zoneTitle: openingZone.title,
      kind: openingZone.kind,
      title: "Progress Test",
      lines: [],
      grants: { gold: 0, xp: 160, potions: 0 },
      choices: [
        {
          id: "noop",
          kind: "boon",
          title: "Noop",
          subtitle: "Noop",
          description: "",
          previewLines: [],
          effects: [],
        },
      ],
      encounterNumber: 1,
      clearsZone: false,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: state.run.hero.currentLife,
      mercenaryLifeAfterFight: state.run.mercenary.currentLife,
    },
    "noop",
    content
  );

  assert.equal(rewardResult.ok, true);
  assert.equal(state.run.level, 4);
  assert.equal(state.run.progression.skillPointsAvailable, 3);
  assert.equal(state.run.progression.training.vitality, 1);
  assert.equal(state.run.progression.training.focus, 1);
  assert.equal(state.run.progression.training.command, 1);
  assert.equal(state.run.summary.levelsGained, 3);
  assert.equal(state.run.summary.skillPointsEarned, 3);
  assert.equal(state.run.summary.trainingRanksGained, 3);
  assert.ok(state.run.hero.maxLife > heroLifeBefore);
  assert.ok(state.run.hero.maxEnergy > heroEnergyBefore);
  assert.ok(state.run.mercenary.attack > mercenaryAttackBefore);

  const progressedCombatState = runFactory.createCombatOverrides(state.run, content);
  assert.ok(progressedCombatState.heroState.maxLife > heroLifeBefore);
  assert.ok(progressedCombatState.heroState.maxEnergy > heroEnergyBefore);
  assert.ok(progressedCombatState.mercenaryState.attack > mercenaryAttackBefore);

  const progressedEquipmentChoice = itemSystem.buildEquipmentChoice({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: 1,
    encounterNumber: 1,
  });
  const progressedItemEffect = progressedEquipmentChoice?.effects.find((effect) => effect.kind === "equip_item");
  const progressedItemId = progressedItemEffect?.itemId || "";
  assert.ok(progressedItemId);
  assert.ok(content.itemCatalog[progressedItemId].progressionTier > initialItemTier);

  appEngine.leaveSafeZone(state);
  const snapshot = appEngine.saveRunSnapshot(state);
  assert.ok(snapshot);

  const restoredSnapshot = persistence.restoreSnapshot(snapshot);
  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.schemaVersion, persistence.SCHEMA_VERSION);
  assert.equal(restoredSnapshot.run.level, state.run.level);
  assert.equal(restoredSnapshot.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(restoredSnapshot.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(restoredSnapshot.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(restoredSnapshot.run.progression.training.command, state.run.progression.training.command);

  const resumedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const resumeResult = appEngine.continueSavedRun(resumedState);
  assert.equal(resumeResult.ok, true);
  assert.equal(resumedState.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(resumedState.run.level, state.run.level);
  assert.equal(resumedState.run.gold, state.run.gold);
  assert.equal(resumedState.run.summary.levelsGained, state.run.summary.levelsGained);
  assert.equal(resumedState.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(resumedState.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(resumedState.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(resumedState.run.progression.training.command, state.run.progression.training.command);

  const importedState = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const importResult = appEngine.loadRunSnapshot(importedState, snapshot);
  assert.equal(importResult.ok, true);
  assert.equal(importedState.phase, appEngine.PHASES.WORLD_MAP);
  assert.equal(importedState.run.level, state.run.level);
  assert.equal(importedState.run.progression.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(importedState.run.progression.training.vitality, state.run.progression.training.vitality);
  assert.equal(importedState.run.progression.training.focus, state.run.progression.training.focus);
  assert.equal(importedState.run.progression.training.command, state.run.progression.training.command);
});

test("legacy snapshots migrate into the socketed equipment schema", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);

  const legacyRun = JSON.parse(JSON.stringify(state.run));
  const heroLifeBeforeMigration = legacyRun.hero.maxLife;
  const heroEnergyBeforeMigration = legacyRun.hero.maxEnergy;
  legacyRun.loadout = {
    weapon: "item_short_sword",
    armor: "",
    weaponRune: "rune_el",
    armorRune: "",
  };
  legacyRun.xp = 100;
  legacyRun.level = 3;
  legacyRun.summary.levelsGained = 2;
  delete legacyRun.progression;

  const migrated = persistence.restoreSnapshot(legacyRun);
  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, persistence.SCHEMA_VERSION);
  assert.equal(migrated.run.loadout.weapon?.itemId, "item_short_sword");
  assert.equal(Array.from(migrated.run.loadout.weapon?.insertedRunes || []).join(","), "rune_el");
  assert.equal(migrated.run.loadout.weapon?.socketsUnlocked, 1);
  assert.equal(migrated.run.progression.skillPointsAvailable, 2);
  assert.equal(migrated.run.progression.training.vitality, 1);
  assert.equal(migrated.run.progression.training.focus, 1);
  assert.equal(migrated.run.progression.training.command, 0);
  assert.ok(migrated.run.hero.maxLife > heroLifeBeforeMigration);
  assert.ok(migrated.run.hero.maxEnergy > heroEnergyBeforeMigration);
});

test("upgrade rewards can upgrade a card already in the deck through the app flow", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "paladin");
  appEngine.startRun(state);
  state.run.deck = ["quick_slash"];
  appEngine.leaveSafeZone(state);

  const [openingZone, hubZone, branchMinibossZone] = runFactory.getCurrentZones(state.run);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  hubZone.encountersCleared = hubZone.encounterTotal;
  hubZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  appEngine.selectZone(state, branchMinibossZone.id);
  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const upgradeChoice: RewardChoice = {
    id: "manual_upgrade_quick_slash",
    kind: "upgrade",
    title: "Upgrade Quick Slash",
    subtitle: "Sharpen Skill",
    description: content.cardCatalog.quick_slash_plus.text,
    previewLines: [
      "Replace 1x Quick Slash with Quick Slash+.",
      "Keep deck size the same.",
    ],
    effects: [{ kind: "upgrade_card", fromCardId: "quick_slash", toCardId: "quick_slash_plus" }],
  };
  state.run.pendingReward.choices = [upgradeChoice];
  const upgradeEffect = upgradeChoice.effects.find((effect) => effect.kind === "upgrade_card");
  assert.ok(upgradeEffect);

  const fromCountBefore = state.run.deck.filter((cardId) => cardId === upgradeEffect.fromCardId).length;
  const toCountBefore = state.run.deck.filter((cardId) => cardId === upgradeEffect.toCardId).length;

  appEngine.claimRewardAndAdvance(state, upgradeChoice.id);

  assert.equal(state.run.deck.filter((cardId) => cardId === upgradeEffect.fromCardId).length, fromCountBefore - 1);
  assert.equal(state.run.deck.filter((cardId) => cardId === upgradeEffect.toCardId).length, toCountBefore + 1);
});
