export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("account progression trees drive mastery focus and archive retention behavior", () => {
  const { browserWindow, content, combatEngine, appEngine, persistence, runFactory, seedBundle } = createHarness();
  const buildState = (featureIds: string[] = [], focusedTreeId = "") => {
    persistence.clearStorage();
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
    if (focusedTreeId) {
      const focusResult = appEngine.setAccountProgressionFocus(state, focusedTreeId);
      assert.equal(focusResult.ok, true);
    }

    appEngine.startCharacterSelect(state);
    appEngine.startRun(state);
    return state;
  };
  const prepareLateActState = (state: AppState) => {
    state.run.currentActIndex = 4;
    state.run.level = 11;
    state.run.summary.zonesCleared = 8;
    state.run.summary.encountersCleared = 12;
    state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
    state.run.town.vendor.refreshCount = 2;
    state.run.town.vendor.stock = [];
    runFactory.hydrateRun(state.run, content);
  };

  const baselineMasteryState = buildState(["boss_trophy_gallery", "training_grounds"], "mastery");
  const focusedMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college"], "mastery");
  const paragonMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine"], "mastery");
  const apexMasteryState = buildState(["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine"], "mastery");
  const warAnnalsState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "war_annals"],
    "mastery"
  );
  const legendMasteryState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "legend_doctrine"],
    "mastery"
  );
  const mythicMasteryState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "legend_doctrine", "mythic_doctrine"],
    "mastery"
  );
  const legendaryAnnalsState = buildState(
    ["boss_trophy_gallery", "training_grounds", "war_college", "paragon_doctrine", "apex_doctrine", "legend_doctrine", "legendary_annals"],
    "mastery"
  );
  const immortalAnnalsState = buildState(
    [
      "boss_trophy_gallery",
      "training_grounds",
      "war_college",
      "paragon_doctrine",
      "apex_doctrine",
      "legend_doctrine",
      "mythic_doctrine",
      "immortal_annals",
    ],
    "mastery"
  );
  prepareLateActState(baselineMasteryState);
  prepareLateActState(focusedMasteryState);
  prepareLateActState(paragonMasteryState);
  prepareLateActState(apexMasteryState);
  prepareLateActState(warAnnalsState);
  prepareLateActState(legendMasteryState);
  prepareLateActState(mythicMasteryState);
  prepareLateActState(legendaryAnnalsState);
  prepareLateActState(immortalAnnalsState);
  const baselineBossZone = runFactory.getCurrentZones(baselineMasteryState.run).find((zone) => zone.kind === "boss");
  const focusedBossZone = runFactory.getCurrentZones(focusedMasteryState.run).find((zone) => zone.kind === "boss");
  const paragonBossZone = runFactory.getCurrentZones(paragonMasteryState.run).find((zone) => zone.kind === "boss");
  const apexBossZone = runFactory.getCurrentZones(apexMasteryState.run).find((zone) => zone.kind === "boss");
  const warAnnalsBossZone = runFactory.getCurrentZones(warAnnalsState.run).find((zone) => zone.kind === "boss");
  const legendBossZone = runFactory.getCurrentZones(legendMasteryState.run).find((zone) => zone.kind === "boss");
  const mythicBossZone = runFactory.getCurrentZones(mythicMasteryState.run).find((zone) => zone.kind === "boss");
  const legendaryAnnalsBossZone = runFactory.getCurrentZones(legendaryAnnalsState.run).find((zone) => zone.kind === "boss");
  const immortalAnnalsBossZone = runFactory.getCurrentZones(immortalAnnalsState.run).find((zone) => zone.kind === "boss");

  assert.ok(baselineBossZone);
  assert.ok(focusedBossZone);
  assert.ok(paragonBossZone);
  assert.ok(apexBossZone);
  assert.ok(warAnnalsBossZone);
  assert.ok(legendBossZone);
  assert.ok(mythicBossZone);
  assert.ok(legendaryAnnalsBossZone);
  assert.ok(immortalAnnalsBossZone);

  const baselineBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baselineMasteryState.run,
    zone: baselineBossZone,
    actNumber: baselineBossZone.actNumber,
    encounterNumber: 1,
    profile: baselineMasteryState.profile,
  });
  const focusedBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: focusedMasteryState.run,
    zone: focusedBossZone,
    actNumber: focusedBossZone.actNumber,
    encounterNumber: 1,
    profile: focusedMasteryState.profile,
  });
  const paragonBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: paragonMasteryState.run,
    zone: paragonBossZone,
    actNumber: paragonBossZone.actNumber,
    encounterNumber: 1,
    profile: paragonMasteryState.profile,
  });
  const apexBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: apexMasteryState.run,
    zone: apexBossZone,
    actNumber: apexBossZone.actNumber,
    encounterNumber: 1,
    profile: apexMasteryState.profile,
  });
  const warAnnalsBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: warAnnalsState.run,
    zone: warAnnalsBossZone,
    actNumber: warAnnalsBossZone.actNumber,
    encounterNumber: 1,
    profile: warAnnalsState.profile,
  });
  const legendBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: legendMasteryState.run,
    zone: legendBossZone,
    actNumber: legendBossZone.actNumber,
    encounterNumber: 1,
    profile: legendMasteryState.profile,
  });
  const mythicBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: mythicMasteryState.run,
    zone: mythicBossZone,
    actNumber: mythicBossZone.actNumber,
    encounterNumber: 1,
    profile: mythicMasteryState.profile,
  });
  const legendaryAnnalsBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: legendaryAnnalsState.run,
    zone: legendaryAnnalsBossZone,
    actNumber: legendaryAnnalsBossZone.actNumber,
    encounterNumber: 1,
    profile: legendaryAnnalsState.profile,
  });
  const immortalAnnalsBossChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: immortalAnnalsState.run,
    zone: immortalAnnalsBossZone,
    actNumber: immortalAnnalsBossZone.actNumber,
    encounterNumber: 1,
    profile: immortalAnnalsState.profile,
  });

  const baselineBossProgression = baselineBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const focusedBossProgression = focusedBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const paragonBossProgression = paragonBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const apexBossProgression = apexBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const warAnnalsBossProgression = warAnnalsBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const legendBossProgression = legendBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const mythicBossProgression = mythicBossChoices.find((choice) => choice.effects.some((effect) => effect.kind === "class_point"));
  const legendaryAnnalsBossProgression = legendaryAnnalsBossChoices.find((choice) =>
    choice.effects.some((effect) => effect.kind === "class_point")
  );
  const immortalAnnalsBossProgression = immortalAnnalsBossChoices.find((choice) =>
    choice.effects.some((effect) => effect.kind === "class_point")
  );

  assert.ok(baselineBossProgression);
  assert.ok(focusedBossProgression);
  assert.ok(paragonBossProgression);
  assert.ok(apexBossProgression);
  assert.ok(warAnnalsBossProgression);
  assert.ok(legendBossProgression);
  assert.ok(mythicBossProgression);
  assert.ok(legendaryAnnalsBossProgression);
  assert.ok(immortalAnnalsBossProgression);

  const baselineBossProgressionPoints = baselineBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const focusedBossProgressionPoints = focusedBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const paragonBossProgressionPoints = paragonBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const apexBossProgressionPoints = apexBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const warAnnalsBossProgressionPoints = warAnnalsBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const legendBossProgressionPoints = legendBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const mythicBossProgressionPoints = mythicBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const legendaryAnnalsBossProgressionPoints = legendaryAnnalsBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);
  const immortalAnnalsBossProgressionPoints = immortalAnnalsBossProgression.effects.reduce((total, effect) => {
    return total + (effect.kind === "class_point" || effect.kind === "attribute_point" ? effect.value : 0);
  }, 0);

  assert.ok(focusedBossProgressionPoints > baselineBossProgressionPoints);
  assert.ok(paragonBossProgressionPoints > focusedBossProgressionPoints);
  assert.ok(apexBossProgressionPoints > paragonBossProgressionPoints);
  assert.ok(warAnnalsBossProgressionPoints > apexBossProgressionPoints);
  assert.ok(legendBossProgressionPoints > warAnnalsBossProgressionPoints);
  assert.ok(mythicBossProgressionPoints > legendBossProgressionPoints);
  assert.ok(legendaryAnnalsBossProgressionPoints > legendBossProgressionPoints);
  assert.ok(immortalAnnalsBossProgressionPoints > mythicBossProgressionPoints);
  assert.match(focusedBossProgression.previewLines.join(" "), /Training Grounds|Mastery Hall focus|War College/i);
  assert.match(paragonBossProgression.previewLines.join(" "), /Paragon Doctrine/i);
  assert.match(apexBossProgression.previewLines.join(" "), /Apex Doctrine/i);
  assert.match(warAnnalsBossProgression.previewLines.join(" "), /War Annals/i);
  assert.match(legendBossProgression.previewLines.join(" "), /Legend Doctrine/i);
  assert.match(mythicBossProgression.previewLines.join(" "), /Mythic Doctrine/i);
  assert.match(legendaryAnnalsBossProgression.previewLines.join(" "), /Legendary Annals/i);
  assert.match(immortalAnnalsBossProgression.previewLines.join(" "), /Immortal Annals/i);

  const archiveProfile = persistence.createEmptyProfile();
  archiveProfile.meta.unlocks.townFeatureIds.push("archive_ledger", "chronicle_vault", "heroic_annals", "mythic_annals", "eternal_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 65);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 70);

  archiveProfile.meta.unlocks.townFeatureIds.push("treasury_exchange", "chronicle_exchange");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.ok(persistence.getRunHistoryCapacity(archiveProfile) >= 70);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 75);

  archiveProfile.meta.unlocks.townFeatureIds.push("sovereign_annals", "sovereign_exchange", "legendary_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.ok(persistence.getRunHistoryCapacity(archiveProfile) >= 95);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 100);

  archiveProfile.meta.unlocks.townFeatureIds.push("imperial_annals", "imperial_exchange", "immortal_annals");
  persistence.ensureProfileMeta(archiveProfile);
  persistence.setAccountProgressionFocus(archiveProfile, "economy");
  assert.ok(persistence.getRunHistoryCapacity(archiveProfile) >= 120);
  persistence.setAccountProgressionFocus(archiveProfile, "archives");
  assert.equal(persistence.getRunHistoryCapacity(archiveProfile), 125);

  const focusedEconomyState = buildState(["advanced_vendor_stock", "runeword_codex", "economy_ledger", "salvage_tithes"], "economy");
  for (let index = 0; index < 100; index += 1) {
    const archivedRun = JSON.parse(JSON.stringify(focusedEconomyState.run)) as RunState;
    archivedRun.id = `archive_focus_${index}`;
    persistence.recordRunHistory(archiveProfile, archivedRun, "abandoned", content);
  }

  assert.equal(archiveProfile.runHistory.length, 100);
});
