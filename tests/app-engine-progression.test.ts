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

test("favored class trees bias reward card offers toward the committed build path", { concurrency: false }, () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  state.run.actNumber = 2;
  state.run.progression.classProgression.favoredTreeId = "amazon_bow_and_crossbow";
  state.run.progression.classProgression.treeRanks.amazon_bow_and_crossbow = 1;

  const zone = {
    id: "reward_probe_branch",
    title: "Reward Probe",
    kind: "battle",
    zoneRole: "branchBattle",
    actNumber: 2,
  } as ZoneState;

  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone,
    actNumber: 2,
    encounterNumber: 1,
  });
  const cardChoice = rewardChoices.find((choice) => choice.kind === "card");
  assert.ok(cardChoice);

  const cardId = cardChoice.effects.find((effect) => effect.kind === "add_card")?.cardId;
  assert.ok(cardId);
  assert.equal(browserWindow.__ROUGE_SKILL_EVOLUTION.getCardTree(cardId), "bow");
  assert.match(cardChoice.subtitle, /Bow Volley/);
  assert.match(cardChoice.subtitle, /Engine/);
});

test("early deck identity can infer the dominant archetype before a favored tree is locked in", { concurrency: false }, () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  state.run.actNumber = 2;
  state.run.deck = [
    "amazon_jab",
    "amazon_power_strike",
    "amazon_charged_strike",
    "amazon_dodge",
    "field_dressing",
  ];

  const zone = {
    id: "reward_probe_branch",
    title: "Reward Probe",
    kind: "battle",
    zoneRole: "branchBattle",
    actNumber: 2,
  } as ZoneState;

  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone,
    actNumber: 2,
    encounterNumber: 1,
  });
  const cardChoice = rewardChoices.find((choice) => choice.kind === "card");
  assert.ok(cardChoice);

  const cardId = cardChoice.effects.find((effect) => effect.kind === "add_card")?.cardId;
  assert.ok(cardId);
  assert.match(cardChoice.subtitle, /Javelin Storm/);
  assert.match(cardChoice.subtitle, /Engine/);

  const dominantArchetype = browserWindow.ROUGE_REWARD_ENGINE.getDominantArchetype(state.run, content);
  assert.equal(dominantArchetype.primary?.archetypeId, "amazon_javelin_and_spear");
  assert.equal(dominantArchetype.secondary?.archetypeId, "amazon_passive_and_magic");
  assert.ok((state.run.progression.classProgression.archetypeScores.amazon_javelin_and_spear || 0) > (state.run.progression.classProgression.archetypeScores.amazon_bow_and_crossbow || 0));
});

test("archetype scoring prioritizes primary-tree commitment over support splashes", { concurrency: false }, () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "druid");
  appEngine.startRun(state);

  state.run.actNumber = 4;
  state.run.deck = [
    "druid_firestorm",
    "druid_fissure",
    "druid_volcano",
    "druid_tornado",
    "druid_hurricane",
    "druid_armageddon",
    "druid_oak_sage",
    "druid_summon_grizzly",
    "field_dressing",
  ];

  browserWindow.ROUGE_REWARD_ENGINE.syncArchetypeScores(state.run, content);

  const dominantArchetype = browserWindow.ROUGE_REWARD_ENGINE.getDominantArchetype(state.run, content);
  const strategicFamilies = browserWindow.ROUGE_REWARD_ENGINE.getStrategicWeaponFamilies(state.run, content);
  assert.equal(dominantArchetype.primary?.archetypeId, "druid_elemental");
  assert.equal(dominantArchetype.secondary?.archetypeId, "druid_summoning");
  assert.equal(strategicFamilies[0], "Staves");
});

test("reward engine annotates cards with archetype tags and reward roles", { concurrency: false }, () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  browserWindow.ROUGE_REWARD_ENGINE.annotateCardRewardMetadata(content);

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_magic_arrow", content), "foundation");
  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_dodge", content), "support");
  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_freezing_arrow", content), "engine");
  assert.deepEqual(
    Array.from(browserWindow.ROUGE_REWARD_ENGINE.getCardArchetypeTags("amazon_magic_arrow", content)),
    ["amazon_bow_and_crossbow"]
  );
  assert.equal(content.cardCatalog.amazon_magic_arrow.rewardRole, "foundation");
  assert.deepEqual(Array.from(content.cardCatalog.amazon_magic_arrow.archetypeTags || []), ["amazon_bow_and_crossbow"]);
});

test("favored tree identity stays sticky until a new tree meaningfully overtakes it", () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.startRun(state);

  state.run.progression.classPointsAvailable = 3;

  let result = browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, "progression_tree_barbarian_combat_skills", content);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.favoredTreeId, "barbarian_combat_skills");

  result = browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, "progression_tree_barbarian_warcries", content);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.favoredTreeId, "barbarian_combat_skills");

  result = browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, "progression_tree_barbarian_warcries", content);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.favoredTreeId, "barbarian_warcries");
});

test("runs seed the starter class skill into the learned list and slot 1", () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  const classProgression = browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "amazon");
  const starterSkillId = classProgression?.starterSkillId || "";

  assert.ok(starterSkillId);
  assert.ok(state.run.progression.classProgression.unlockedSkillIds.includes(starterSkillId));
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot1SkillId, starterSkillId);
});

test("class progression uses explicit authored starter skills instead of alphabetical fallbacks", () => {
  const { browserWindow, content } = createHarness();

  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "amazon")?.starterSkillId, "amazon_call_the_shot");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "assassin")?.starterSkillId, "assassin_shadow_feint");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "barbarian")?.starterSkillId, "barbarian_core_bash");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "druid")?.starterSkillId, "druid_primal_attunement");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "necromancer")?.starterSkillId, "necromancer_raise_servant");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "paladin")?.starterSkillId, "paladin_sanctify");
  assert.equal(browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "sorceress")?.starterSkillId, "sorceress_core_fire_bolt");
});

test("starter deck seeding keeps starter slot skills separate from opening deck cards", () => {
  const { browserWindow, content } = createHarness();

  const amazonStarterDeck = browserWindow.ROUGE_CLASS_REGISTRY.getStarterDeckForClass(content, "amazon");
  assert.equal(amazonStarterDeck.length, content.classStarterDecks.amazon.length);
  assert.ok(!amazonStarterDeck.includes("amazon_call_the_shot"));
  assert.ok(amazonStarterDeck.includes("amazon_fire_arrow"));
  assert.ok(amazonStarterDeck.includes("amazon_magic_arrow"));

  const necromancerStarterDeck = browserWindow.ROUGE_CLASS_REGISTRY.getStarterDeckForClass(content, "necromancer");
  assert.equal(necromancerStarterDeck.length, content.classStarterDecks.necromancer.length);
  assert.ok(!necromancerStarterDeck.includes("necromancer_raise_servant"));
  assert.ok(necromancerStarterDeck.includes("necromancer_raise_skeleton"));
  assert.ok(necromancerStarterDeck.includes("necromancer_clay_golem"));
});

test("training skills unlock and equip through bridge and capstone gates", () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  const classProgression = browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "amazon");
  assert.ok(classProgression);
  const primaryTree = classProgression.trees[0];
  const secondaryTree = classProgression.trees[1];
  const bridgeSkill = primaryTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2);
  const capstoneSkill = primaryTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 3);
  assert.ok(primaryTree);
  assert.ok(secondaryTree);
  assert.ok(bridgeSkill);
  assert.ok(capstoneSkill);

  let result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, bridgeSkill.id);
  assert.equal(result.ok, false);
  assert.match(result.message || "", /Requires Level 6|Requires Level/);

  state.run.level = Math.max(12, capstoneSkill.requiredLevel);
  state.run.progression.classPointsAvailable = 11;
  for (let index = 0; index < 6; index += 1) {
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${primaryTree.id}`, content);
  }
  for (let index = 0; index < 5; index += 1) {
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${secondaryTree.id}`, content);
  }

  result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, bridgeSkill.id);
  assert.equal(result.ok, true);
  result = browserWindow.ROUGE_RUN_PROGRESSION.equipTrainingSkill(state.run, content, "slot2", bridgeSkill.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot2SkillId, bridgeSkill.id);

  result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, capstoneSkill.id);
  assert.equal(result.ok, false);
  assert.match(result.message || "", /favored lead/);

  state.run.progression.classPointsAvailable = 1;
  browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${primaryTree.id}`, content);

  result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, capstoneSkill.id);
  assert.equal(result.ok, true);
  result = browserWindow.ROUGE_RUN_PROGRESSION.equipTrainingSkill(state.run, content, "slot3", capstoneSkill.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot3SkillId, capstoneSkill.id);

  result = browserWindow.ROUGE_RUN_PROGRESSION.equipTrainingSkill(state.run, content, "slot1", classProgression.starterSkillId);
  assert.equal(result.ok, false);
  assert.match(result.message || "", /Slot 1 is fixed/);
});

test("training screen model exposes the documented header and commitment data", () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);
  appEngine.openTrainingView(state, "safe_zone");

  const model = browserWindow.ROUGE_RUN_PROGRESSION.buildTrainingScreenModel(state, content);
  assert.ok(model);
  assert.equal(model.slotStateLabel, "1 / 3");
  assert.match(model.nextSlotGateLabel, /Slot 2 opens at Level 6/);
  assert.equal(model.slots[0].roleLabel, "Identity");
  assert.equal(model.slots[0].statusLabel, "Equipped");
  assert.ok(model.slots[0].shortRuleText.length > 0);
  assert.equal(model.skillPointsAvailable, state.run.progression.skillPointsAvailable);
  assert.equal(model.classPointsAvailable, state.run.progression.classPointsAvailable);
  assert.equal(model.attributePointsAvailable, state.run.progression.attributePointsAvailable);
  assert.ok(model.trees[0].commitmentBadgeLabels.length > 0);
  assert.ok(model.trees[0].nextMilestoneLabel.length > 0);
});

test("training swap mode prefers occupied tactical slots and can replace an equipped bridge skill", () => {
  const { browserWindow, content, combatEngine, appEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  const classProgression = browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, "amazon");
  assert.ok(classProgression);
  const primaryTree = classProgression.trees[0];
  const secondaryTree = classProgression.trees[1];
  const firstBridge = primaryTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2);
  const secondBridge = secondaryTree.skills.find((skill: RuntimeClassSkillDefinition) => skill.slot === 2);
  assert.ok(firstBridge);
  assert.ok(secondBridge);

  state.run.level = 12;
  state.run.progression.classPointsAvailable = 8;
  for (let index = 0; index < 3; index += 1) {
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${primaryTree.id}`, content);
    browserWindow.ROUGE_RUN_PROGRESSION.applyProgressionAction(state.run, `progression_tree_${secondaryTree.id}`, content);
  }

  let result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, firstBridge.id);
  assert.equal(result.ok, true);
  result = browserWindow.ROUGE_RUN_PROGRESSION.unlockTrainingSkill(state.run, content, secondBridge.id);
  assert.equal(result.ok, true);

  result = appEngine.equipTrainingSkill(state, "slot2", firstBridge.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot2SkillId, firstBridge.id);

  appEngine.setTrainingMode(state, "swap");
  assert.equal(state.ui.trainingView.selectedSlot, "slot2");

  result = appEngine.swapTrainingSkill(state, "slot2", secondBridge.id);
  assert.equal(result.ok, true);
  assert.equal(state.run.progression.classProgression.equippedSkillBar.slot2SkillId, secondBridge.id);
  assert.equal(state.ui.trainingView.mode, "swap");
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
    state.combat.hand = [{ instanceId: "card_guard", cardId: "measured_swing" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_guard", target.id);
    assert.equal(state.combat.hero.guard, 4 + (combatBonuses.heroGuardBonus || 0));
    return;
  }

  if ((combatBonuses.heroDamageBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_damage", cardId: "swing" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_damage", target.id);
    assert.equal(target.life, target.maxLife - (7 + (combatBonuses.heroDamageBonus || 0)));
    return;
  }

  if ((combatBonuses.heroBurnBonus || 0) > 0) {
    state.combat.hand = [{ instanceId: "card_burn", cardId: "throw_oil" }];
    state.combat.hero.energy = 3;
    combatEngine.playCard(state.combat, content, "card_burn", target.id);
    assert.equal(target.burn, 1 + (combatBonuses.heroBurnBonus || 0));
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
  assert.equal(progressionSummary.dominantArchetypeId, targetTree.id);
  assert.ok(progressionSummary.dominantArchetypeLabel.length > 0);
  assert.ok(progressionSummary.dominantArchetypeScore > 0);
  assert.ok(Array.isArray(progressionSummary.archetypeScores));
  assert.equal(progressionSummary.archetypeScores[0]?.archetypeId, targetTree.id);
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

test("vendor stock shifts toward the dominant archetype weapon family", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const createAmazonState = (deck: string[]) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    appEngine.startCharacterSelect(state);
    appEngine.setSelectedClass(state, "amazon");
    appEngine.startRun(state);
    state.run.currentActIndex = 1;
    state.run.level = 4;
    state.run.deck = [...deck];
    browserWindow.ROUGE_REWARD_ENGINE.syncArchetypeScores(state.run, content);
    state.run.town.vendor.stock = [];
    runFactory.hydrateRun(state.run, content);
    return state;
  };

  const bowState = createAmazonState([
    "amazon_magic_arrow",
    "amazon_cold_arrow",
    "amazon_multiple_shot",
    "field_dressing",
  ]);
  const javelinState = createAmazonState([
    "amazon_jab",
    "amazon_power_strike",
    "amazon_charged_strike",
    "field_dressing",
  ]);

  const getFirstWeaponFamily = (state: AppState) => {
    const weaponEntry = state.run.town.vendor.stock.find((entry): entry is InventoryEquipmentEntry => {
      return entry.kind === "equipment" && content.itemCatalog[entry.equipment.itemId]?.slot === "weapon";
    });
    assert.ok(weaponEntry);
    return content.itemCatalog[weaponEntry.equipment.itemId].family;
  };

  assert.ok(["Bows", "Crossbows"].includes(getFirstWeaponFamily(bowState)));
  assert.ok(["Javelins", "Spears"].includes(getFirstWeaponFamily(javelinState)));
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
  const progressedTargetTierMatch = progressedEquipmentChoice?.previewLines?.[0]?.match(/target tier (\d+)/i);
  const progressedTargetTier = Number(progressedTargetTierMatch?.[1] || 0);
  assert.ok(progressedTargetTier >= initialItemTier + 1);
  assert.ok(content.itemCatalog[progressedItemId].progressionTier >= initialItemTier);

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
  state.run.deck = ["swing"];
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
    id: "manual_upgrade_swing",
    kind: "upgrade",
    title: "Upgrade Swing",
    subtitle: "Sharpen Skill",
    description: content.cardCatalog.swing_plus.text,
    previewLines: [
      "Replace 1x Swing with Swing+.",
      "Keep deck size the same.",
    ],
    effects: [{ kind: "upgrade_card", fromCardId: "swing", toCardId: "swing_plus" }],
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

test("late-run reward choices shift away from extra card adds when the deck is already oversized", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle, browserWindow } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "paladin");
  appEngine.startRun(state);

  state.run.deck = Array.from({ length: 32 }, () => "swing");
  const openingZone = runFactory.getCurrentZones(state.run)[0];
  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: openingZone.actNumber,
    encounterNumber: 1,
    profile: state.profile,
  });

  const cardChoices = rewardChoices.filter((choice: RewardChoice) => choice.kind === "card");

  assert.equal(cardChoices.length, 0);
  assert.ok(rewardChoices.some((choice: RewardChoice) => choice.kind !== "card"));
});

test("early-act reward choices cap card growth sooner than the late-game deck ceiling", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle, browserWindow } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.startRun(state);

  state.run.deck = Array.from({ length: 24 }, () => "barbarian_bash");
  const openingZone = runFactory.getCurrentZones(state.run)[0];
  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone: openingZone,
    actNumber: openingZone.actNumber,
    encounterNumber: 1,
    profile: state.profile,
  });

  const cardChoices = rewardChoices.filter((choice: RewardChoice) => choice.kind === "card");

  assert.equal(cardChoices.length, 0);
  assert.ok(rewardChoices.some((choice: RewardChoice) => choice.kind !== "card"));
});
