export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("late-act reward equipment choices prioritize replacement pivots and honor economy-gated curation", () => {
  const { browserWindow, content, combatEngine, appEngine, itemSystem, runFactory, seedBundle } = createHarness();
  const allItems = Object.values(content.itemCatalog);
  const lowestTierWeapon = [...allItems]
    .filter((item) => item.slot === "weapon")
    .sort((left, right) => {
      const tierDelta = left.progressionTier - right.progressionTier;
      if (tierDelta !== 0) {
        return tierDelta;
      }
      return left.maxSockets - right.maxSockets;
    })[0];
  const highestTierArmor = [...allItems]
    .filter((item) => item.slot === "armor")
    .sort((left, right) => {
      const tierDelta = right.progressionTier - left.progressionTier;
      if (tierDelta !== 0) {
        return tierDelta;
      }
      return right.maxSockets - left.maxSockets;
    })[0];

  assert.ok(lowestTierWeapon);
  assert.ok(highestTierArmor);

  const buildLateActState = (featureIds: string[] = [], focusedTreeId = "") => {
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
    state.run.currentActIndex = 4;
    state.run.level = 11;
    state.run.summary.zonesCleared = 8;
    state.run.summary.encountersCleared = 12;
    state.run.progression.bossTrophies = ["andariel", "duriel", "mephisto"];
    runFactory.hydrateRun(state.run, content);
    state.run.loadout.weapon = {
      entryId: "late_reward_weapon",
      itemId: lowestTierWeapon.id,
      slot: "weapon",
      socketsUnlocked: 0,
      insertedRunes: [],
      runewordId: "",
    };
    state.run.loadout.armor = {
      entryId: "late_reward_armor",
      itemId: highestTierArmor.id,
      slot: "armor",
      socketsUnlocked: Math.min(2, highestTierArmor.maxSockets || 0),
      insertedRunes: [],
      runewordId: "",
    };
    itemSystem.hydrateRunLoadout(state.run, content);

    const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
    assert.ok(bossZone);

    return { state, bossZone };
  };

  const baseline = buildLateActState();
  const baselineChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: baseline.state.run,
    zone: baseline.bossZone,
    actNumber: baseline.bossZone.actNumber,
    encounterNumber: 1,
    profile: baseline.state.profile,
  });
  const baselineEquipmentChoice = baselineChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(baselineEquipmentChoice);
  assert.equal(baselineEquipmentChoice.kind, "item");
  const baselineRewardItemId = baselineEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const baselineRewardItem = content.itemCatalog[baselineRewardItemId];
  assert.ok(baselineRewardItem);
  assert.ok(baselineRewardItem.progressionTier > lowestTierWeapon.progressionTier);
  assert.match(baselineEquipmentChoice.previewLines.join(" "), /Late-act pivot/i);

  const featured = buildLateActState(["artisan_stock", "brokerage_charter"], "economy");
  const treasuryFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange"], "economy");
  const merchantFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate"], "economy");
  const hegemonyFeatured = buildLateActState(
    ["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate", "trade_hegemony"],
    "economy"
  );
  const paragonFeatured = buildLateActState(["artisan_stock", "brokerage_charter", "treasury_exchange", "paragon_exchange"], "economy");
  const ascendantFeatured = buildLateActState(
    ["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate", "ascendant_exchange"],
    "economy"
  );
  const imperialFeatured = buildLateActState(
    ["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate", "trade_hegemony", "imperial_exchange"],
    "economy"
  );
  const mythicFeatured = buildLateActState(
    ["artisan_stock", "brokerage_charter", "treasury_exchange", "merchant_principate", "trade_hegemony", "mythic_exchange"],
    "economy"
  );
  const featuredChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: featured.state.run,
    zone: featured.bossZone,
    actNumber: featured.bossZone.actNumber,
    encounterNumber: 1,
    profile: featured.state.profile,
  });
  const featuredEquipmentChoice = featuredChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(featuredEquipmentChoice);
  assert.equal(featuredEquipmentChoice.kind, "item");
  const featuredRewardItemId = featuredEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const featuredRewardItem = content.itemCatalog[featuredRewardItemId];
  assert.ok(featuredRewardItem);
  assert.ok((featuredRewardItem.maxSockets || 0) >= (baselineRewardItem.maxSockets || 0));
  assert.match(featuredEquipmentChoice.previewLines.join(" "), /Trade Network/i);

  const treasuryChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: treasuryFeatured.state.run,
    zone: treasuryFeatured.bossZone,
    actNumber: treasuryFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: treasuryFeatured.state.profile,
  });
  const treasuryEquipmentChoice = treasuryChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(treasuryEquipmentChoice);
  assert.equal(treasuryEquipmentChoice.kind, "item");
  const treasuryRewardItemId = treasuryEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const treasuryRewardItem = content.itemCatalog[treasuryRewardItemId];
  assert.ok(treasuryRewardItem);
  assert.match(treasuryEquipmentChoice.previewLines.join(" "), /Treasury Exchange/i);

  const paragonChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: paragonFeatured.state.run,
    zone: paragonFeatured.bossZone,
    actNumber: paragonFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: paragonFeatured.state.profile,
  });
  const merchantChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: merchantFeatured.state.run,
    zone: merchantFeatured.bossZone,
    actNumber: merchantFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: merchantFeatured.state.profile,
  });
  const hegemonyChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: hegemonyFeatured.state.run,
    zone: hegemonyFeatured.bossZone,
    actNumber: hegemonyFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: hegemonyFeatured.state.profile,
  });
  const ascendantChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: ascendantFeatured.state.run,
    zone: ascendantFeatured.bossZone,
    actNumber: ascendantFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: ascendantFeatured.state.profile,
  });
  const imperialChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: imperialFeatured.state.run,
    zone: imperialFeatured.bossZone,
    actNumber: imperialFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: imperialFeatured.state.profile,
  });
  const mythicChoices = browserWindow.ROUGE_REWARD_ENGINE.buildRewardChoices({
    content,
    run: mythicFeatured.state.run,
    zone: mythicFeatured.bossZone,
    actNumber: mythicFeatured.bossZone.actNumber,
    encounterNumber: 1,
    profile: mythicFeatured.state.profile,
  });
  const paragonEquipmentChoice = paragonChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const merchantEquipmentChoice = merchantChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const hegemonyEquipmentChoice = hegemonyChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const ascendantEquipmentChoice = ascendantChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const imperialEquipmentChoice = imperialChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  const mythicEquipmentChoice = mythicChoices.find((choice) => {
    return choice.effects.some((effect) => effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket");
  });
  assert.ok(paragonEquipmentChoice);
  assert.ok(merchantEquipmentChoice);
  assert.ok(hegemonyEquipmentChoice);
  assert.ok(ascendantEquipmentChoice);
  assert.ok(imperialEquipmentChoice);
  assert.ok(mythicEquipmentChoice);
  assert.equal(paragonEquipmentChoice.kind, "item");
  assert.equal(merchantEquipmentChoice.kind, "item");
  assert.equal(hegemonyEquipmentChoice.kind, "item");
  assert.equal(ascendantEquipmentChoice.kind, "item");
  assert.equal(imperialEquipmentChoice.kind, "item");
  assert.equal(mythicEquipmentChoice.kind, "item");
  const merchantRewardItemId = merchantEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const hegemonyRewardItemId = hegemonyEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const paragonRewardItemId = paragonEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const ascendantRewardItemId = ascendantEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const imperialRewardItemId = imperialEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const mythicRewardItemId = mythicEquipmentChoice.effects.find((effect) => effect.kind === "equip_item")?.itemId || "";
  const merchantRewardItem = content.itemCatalog[merchantRewardItemId];
  const hegemonyRewardItem = content.itemCatalog[hegemonyRewardItemId];
  const paragonRewardItem = content.itemCatalog[paragonRewardItemId];
  const ascendantRewardItem = content.itemCatalog[ascendantRewardItemId];
  const imperialRewardItem = content.itemCatalog[imperialRewardItemId];
  const mythicRewardItem = content.itemCatalog[mythicRewardItemId];
  assert.ok(merchantRewardItem);
  assert.ok(hegemonyRewardItem);
  assert.ok(paragonRewardItem);
  assert.ok(ascendantRewardItem);
  assert.ok(imperialRewardItem);
  assert.ok(mythicRewardItem);
  assert.ok((merchantRewardItem.maxSockets || 0) >= (treasuryRewardItem.maxSockets || 0));
  assert.ok(merchantRewardItem.progressionTier >= treasuryRewardItem.progressionTier);
  assert.ok((hegemonyRewardItem.maxSockets || 0) >= (merchantRewardItem.maxSockets || 0));
  assert.ok(hegemonyRewardItem.progressionTier >= merchantRewardItem.progressionTier);
  assert.ok((paragonRewardItem.maxSockets || 0) >= (treasuryRewardItem.maxSockets || 0));
  assert.ok(paragonRewardItem.progressionTier >= treasuryRewardItem.progressionTier);
  assert.ok((ascendantRewardItem.maxSockets || 0) >= (paragonRewardItem.maxSockets || 0));
  assert.ok(ascendantRewardItem.progressionTier >= paragonRewardItem.progressionTier);
  assert.ok((imperialRewardItem.maxSockets || 0) >= (ascendantRewardItem.maxSockets || 0));
  assert.ok(imperialRewardItem.progressionTier >= ascendantRewardItem.progressionTier);
  assert.ok((mythicRewardItem.maxSockets || 0) >= (imperialRewardItem.maxSockets || 0));
  assert.ok(mythicRewardItem.progressionTier >= imperialRewardItem.progressionTier);
  assert.match(merchantEquipmentChoice.previewLines.join(" "), /Merchant Principate/i);
  assert.match(hegemonyEquipmentChoice.previewLines.join(" "), /Trade Hegemony/i);
  assert.match(paragonEquipmentChoice.previewLines.join(" "), /Paragon Exchange/i);
  assert.match(ascendantEquipmentChoice.previewLines.join(" "), /Ascendant Exchange/i);
  assert.match(imperialEquipmentChoice.previewLines.join(" "), /Imperial Exchange/i);
  assert.match(mythicEquipmentChoice.previewLines.join(" "), /Mythic Exchange/i);
});
