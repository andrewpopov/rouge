export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertNormalizedEqual(actual: unknown, expected: unknown) {
  assert.equal(JSON.stringify(normalize(actual)), JSON.stringify(expected));
}

function createAmazonRunFixture() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, browserWindow, runFactory } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  assert.equal(appEngine.startRun(state).ok, true);

  return {
    state,
    content,
    browserWindow,
    zone: runFactory.getCurrentZones(state.run)[0],
  };
}

test("reward-engine archetype metadata stays stable for representative cards", () => {
  const { content, browserWindow } = createAmazonRunFixture();
  browserWindow.ROUGE_REWARD_ENGINE.annotateCardRewardMetadata(content);

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_magic_arrow", content), "foundation");
  assertNormalizedEqual(browserWindow.ROUGE_REWARD_ENGINE.getCardArchetypeTags("amazon_magic_arrow", content), ["amazon_bow_and_crossbow"]);
  assertNormalizedEqual(content.cardCatalog.amazon_magic_arrow.behaviorTags, ["pressure", "salvage", "payoff"]);
  assertNormalizedEqual(content.cardCatalog.amazon_magic_arrow.counterTags, ["anti_backline"]);
  assert.equal(content.cardCatalog.amazon_magic_arrow.splashRole, "utility_splash_ok");

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_inner_sight", content), "foundation");
  assertNormalizedEqual(
    browserWindow.ROUGE_REWARD_ENGINE.getCardArchetypeTags("amazon_inner_sight", content),
    ["amazon_bow_and_crossbow", "amazon_javelin_and_spear", "amazon_passive_and_magic"]
  );

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("amazon_freezing_arrow", content), "engine");
  assertNormalizedEqual(content.cardCatalog.amazon_freezing_arrow.behaviorTags, [
    "pressure",
    "disruption",
    "mitigation",
    "payoff",
  ]);
  assertNormalizedEqual(content.cardCatalog.amazon_freezing_arrow.counterTags, [
    "anti_attrition",
    "anti_fire_pressure",
    "anti_summon",
    "anti_backline",
    "telegraph_respect",
  ]);

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("quick_slash", content), "foundation");
  assertNormalizedEqual(content.cardCatalog.quick_slash.behaviorTags, ["pressure"]);
  assertNormalizedEqual(content.cardCatalog.quick_slash.counterTags, []);
  assert.equal(content.cardCatalog.quick_slash.splashRole, "primary_only");

  assert.equal(browserWindow.ROUGE_REWARD_ENGINE.getCardRewardRole("rally_mercenary", content), "foundation");
  assertNormalizedEqual(content.cardCatalog.rally_mercenary.behaviorTags, ["mitigation", "protection", "salvage"]);
  assertNormalizedEqual(content.cardCatalog.rally_mercenary.counterTags, [
    "anti_attrition",
    "anti_fire_pressure",
    "anti_tax",
  ]);
  assert.equal(content.cardCatalog.rally_mercenary.splashRole, "utility_splash_ok");
});

test("reward-engine opening reward choices stay deterministic for the same seeded amazon opener", () => {
  const { state, content, browserWindow, zone } = createAmazonRunFixture();
  const rewardChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: state.run,
    zone,
    actNumber: state.run.actNumber,
    encounterNumber: 1,
    profile: state.profile,
  });

  assert.equal(zone.id, "act_1_blighted_moors");
  assert.equal(zone.zoneRole, "opening");
  assertNormalizedEqual(
    rewardChoices.map((choice) => choice.id),
    [
      "reward_card_amazon_power_strike",
      "reward_loot_act_1_blighted_moors_1",
      "reward_boon_field_training",
    ]
  );
  assertNormalizedEqual(
    rewardChoices.map((choice) => choice.subtitle),
    ["Engine Skill", "Zone Loot Table", "Hero Boon"]
  );
  assert.equal(rewardChoices[0].previewLines[0], "Role: Engine.");
  assert.equal(rewardChoices[1].previewLines[0], "Blighted Moors rolled 1 loot drop at target tier 1.");
  assert.equal(rewardChoices[2].previewLines[0], "Hero max Life +6.");
});

test("reward-engine specialization snapshot stays stable for a fresh amazon run", () => {
  const { state, content, browserWindow } = createAmazonRunFixture();
  const specialization = browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES.getSpecializationSnapshot(state.run, content);
  const buildPath = browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES.getRewardPathPreference(state.run, content);

  assertNormalizedEqual(specialization, {
    favoredTreeId: "",
    primaryTreeId: "",
    secondaryUtilityTreeId: "",
    specializationStage: "exploratory",
    offTreeUtilityCount: 0,
    offTreeDamageCount: 0,
    counterCoverageTags: ["anti_attrition", "anti_backline", "anti_fire_pressure", "anti_summon", "anti_tax", "telegraph_respect"],
  });
  assert.equal(buildPath, null);
});

test("support-heavy hybrid scoring still requires real primary-tree investment", () => {
  const { state, content, browserWindow } = createAmazonRunFixture();

  state.run.deck = [
    "amazon_magic_arrow",
    "amazon_fire_arrow",
    "amazon_multiple_shot",
    "amazon_exploding_arrow",
    "amazon_jab",
    "amazon_power_strike",
    "amazon_inner_sight",
    "rally_mercenary",
  ];

  const dominant = browserWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES.getDominantArchetype(state.run, content);
  assert.equal(dominant.primary?.archetypeId, "amazon_bow_and_crossbow");
  assert.notEqual(dominant.primary?.archetypeId, "amazon_passive_and_magic");
});
