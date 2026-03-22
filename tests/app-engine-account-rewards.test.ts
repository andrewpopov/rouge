export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("archived run history captures progression, economy, and account feature carry-through", () => {
  const { classRegistry, content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.startRun(state);

  const classProgression = classRegistry.getClassProgression(content, state.run.classId);
  assert.ok(classProgression);
  const favoredTree = classProgression.trees[0];
  assert.ok(favoredTree);

  state.run.progression.classProgression.favoredTreeId = favoredTree.id;
  state.run.progression.classProgression.treeRanks[favoredTree.id] = 1;
  state.run.progression.classProgression.unlockedSkillIds = [favoredTree.skills[0].id];
  state.run.progression.activatedRunewords = ["steel"];
  state.run.progression.bossTrophies = ["andariel"];
  state.run.loadout.weapon = {
    entryId: "history_weapon",
    itemId: "item_short_sword",
    slot: "weapon",
    socketsUnlocked: 0,
    insertedRunes: [],
    runewordId: "",
  };
  state.run.loadout.armor = {
    entryId: "history_armor",
    itemId: "item_quilted_armor",
    slot: "armor",
    socketsUnlocked: 1,
    insertedRunes: ["rune_el"],
    runewordId: "",
  };
  state.run.inventory.carried = [
    {
      entryId: "carry_equipment",
      kind: "equipment",
      equipment: {
        entryId: "carry_equipment",
        itemId: "item_short_sword",
        slot: "weapon",
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    },
    {
      entryId: "carry_rune",
      kind: "rune",
      runeId: "rune_el",
    },
  ];
  state.profile.stash.entries = [
    {
      entryId: "stash_armor",
      kind: "equipment",
      equipment: {
        entryId: "stash_armor",
        itemId: "item_quilted_armor",
        slot: "armor",
        socketsUnlocked: 1,
        insertedRunes: [],
        runewordId: "",
      },
    },
    {
      entryId: "stash_rune",
      kind: "rune",
      runeId: "rune_tir",
    },
  ];
  state.run.summary.actsCleared = 3;
  state.run.summary.bossesDefeated = 1;
  state.run.summary.goldGained = 540;
  state.run.summary.runewordsForged = 1;
  state.run.summary.skillPointsEarned = 4;
  state.run.summary.classPointsEarned = 2;
  state.run.summary.attributePointsEarned = 1;
  state.run.summary.trainingRanksGained = 3;

  const progressionSummary = runFactory.getProgressionSummary(state.run, content);
  persistence.recordRunHistory(state.profile, state.run, "completed", content);

  const historyEntry = state.profile.runHistory[0];
  assert.equal(historyEntry.goldGained, 540);
  assert.equal(historyEntry.runewordsForged, 1);
  assert.equal(historyEntry.skillPointsEarned, 4);
  assert.equal(historyEntry.classPointsEarned, 2);
  assert.equal(historyEntry.attributePointsEarned, 1);
  assert.equal(historyEntry.trainingRanksGained, 3);
  assert.equal(historyEntry.favoredTreeId, progressionSummary.favoredTreeId);
  assert.equal(historyEntry.favoredTreeName, progressionSummary.favoredTreeName);
  assert.equal(historyEntry.unlockedClassSkills, progressionSummary.unlockedClassSkills);
  assert.ok(historyEntry.loadoutTier > 0);
  assert.equal(historyEntry.loadoutSockets, 1);
  assert.equal(historyEntry.carriedEquipmentCount, 1);
  assert.equal(historyEntry.carriedRuneCount, 1);
  assert.equal(historyEntry.stashEntryCount, 2);
  assert.equal(historyEntry.stashEquipmentCount, 1);
  assert.equal(historyEntry.stashRuneCount, 1);
  assert.ok(historyEntry.activeRunewordIds.includes("steel"));
  assert.ok(historyEntry.newFeatureIds.includes("archive_ledger"));
  assert.ok(historyEntry.newFeatureIds.includes("boss_trophy_gallery"));
  assert.ok(historyEntry.newFeatureIds.includes("runeword_codex"));
  assert.ok(historyEntry.newFeatureIds.includes("advanced_vendor_stock"));
  assert.ok(historyEntry.newFeatureIds.includes("economy_ledger"));
});

test("reward generation consumes account milestones for payout and boss pivots", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const buildState = (featureIds: string[] = []) => {
    const state = appEngine.createAppState({
      content,
      seedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    featureIds.forEach((featureId) => {
      if (!state.profile.meta.unlocks.townFeatureIds.includes(featureId)) {
        state.profile.meta.unlocks.townFeatureIds.push(featureId);
      }
    });

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    return state;
  };
  const fakeCombatState = (state: AppState) =>
    ({
      hero: { life: state.run.hero.currentLife },
      mercenary: { life: state.run.mercenary.currentLife },
    } as CombatState);

  const baselineState = buildState();
  const featuredState = buildState(["economy_ledger", "boss_trophy_gallery"]);

  const minibossZone = runFactory.getCurrentZones(baselineState.run).find((zone) => zone.kind === "miniboss");
  const bossZone = runFactory.getCurrentZones(baselineState.run).find((zone) => zone.kind === "boss");
  const featuredMinibossZone = runFactory.getCurrentZones(featuredState.run).find((zone) => zone.kind === "miniboss");
  const featuredBossZone = runFactory.getCurrentZones(featuredState.run).find((zone) => zone.kind === "boss");
  assert.ok(minibossZone);
  assert.ok(bossZone);
  assert.ok(featuredMinibossZone);
  assert.ok(featuredBossZone);

  const baselineMinibossReward = runFactory.buildEncounterReward({
    run: baselineState.run,
    zone: minibossZone,
    combatState: fakeCombatState(baselineState),
    content,
    profile: baselineState.profile,
  });
  const featuredMinibossReward = runFactory.buildEncounterReward({
    run: featuredState.run,
    zone: featuredMinibossZone,
    combatState: fakeCombatState(featuredState),
    content,
    profile: featuredState.profile,
  });

  assert.ok(featuredMinibossReward.grants.gold > baselineMinibossReward.grants.gold);
  assert.match(featuredMinibossReward.lines.join(" "), /Economy Ledger dividend/i);

  const baselineBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baselineState.run,
    zone: bossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
    profile: baselineState.profile,
  });
  const featuredBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: featuredState.run,
    zone: featuredBossZone,
    actNumber: bossZone.actNumber,
    encounterNumber: 1,
    profile: featuredState.profile,
  });

  const baselineBossProgression = baselineBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const featuredBossProgression = featuredBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  assert.ok(baselineBossProgression);
  assert.ok(featuredBossProgression);

  const baselineBossClassPoints = baselineBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" ? effect.value : 0);
  }, 0);
  const featuredBossClassPoints = featuredBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" ? effect.value : 0);
  }, 0);

  assert.ok(featuredBossClassPoints > baselineBossClassPoints);
  assert.match(featuredBossProgression.previewLines.join(" "), /Boss Trophy Gallery/i);
});

