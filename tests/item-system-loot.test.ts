export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createRunFixture(classId = "amazon") {
  const harness = createAppHarness();
  const { content, combatEngine, appEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, classId);
  appEngine.setSelectedMercenary(state, "iron_wolf");
  assert.equal(appEngine.startRun(state).ok, true);

  return { ...harness, state, run: state.run };
}

function computeExpectedLegacyWeight({
  item,
  targetTier,
  currentWeaponTier,
  currentArmorTier,
  zone,
  lateBias,
  preferredWeaponFamilies,
  strategicWeaponFamilies,
  primaryStrategicWeaponFamily,
}: {
  item: RuntimeItemDefinition;
  targetTier: number;
  currentWeaponTier: number;
  currentArmorTier: number;
  zone: ZoneState | null;
  lateBias: { tierBias: number; socketBias: number };
  preferredWeaponFamilies: string[];
  strategicWeaponFamilies: string[];
  primaryStrategicWeaponFamily: string;
}): number {
  const tier = Number(item.progressionTier || 1);
  let weight = Math.max(1, 10 - Math.abs(tier - targetTier) * 3);
  if (item.slot === "weapon" || item.slot === "armor") {
    weight += 3;
  } else if (item.slot === "shield" || item.slot === "helm") {
    weight += 1;
  }
  if (item.slot === "weapon" && (item.family || "") === primaryStrategicWeaponFamily) {
    weight += 8;
  } else if (item.slot === "weapon" && strategicWeaponFamilies.includes(item.family || "")) {
    weight += 5;
  } else if (item.slot === "weapon" && preferredWeaponFamilies.includes(item.family || "")) {
    weight += 3;
  }
  if (item.slot === "weapon" && tier > currentWeaponTier) {
    weight += 2 + (tier - currentWeaponTier) * 2;
    if ((item.family || "") === primaryStrategicWeaponFamily) {
      weight += 6;
    } else if (strategicWeaponFamilies.includes(item.family || "")) {
      weight += 4;
    } else if (preferredWeaponFamilies.includes(item.family || "")) {
      weight += 2;
    }
  }
  if (item.slot === "armor" && tier > currentArmorTier) {
    weight += 1 + (tier - currentArmorTier);
  }
  if (zone?.kind === "boss" && tier >= targetTier) {
    weight += 1;
  }
  if (zone?.kind === "battle" && tier > targetTier) {
    weight = Math.max(1, weight - 2);
  }
  if (lateBias.tierBias > 0 || lateBias.socketBias > 0) {
    weight += tier * lateBias.tierBias;
    weight += Number(item.maxSockets || 0) * lateBias.socketBias;
  }
  return weight;
}

test("item-system loot table weights stay aligned with the pre-extraction weapon weighting formula", () => {
  const { browserWindow, content, run } = createRunFixture("amazon");
  const loot = browserWindow.__ROUGE_ITEM_SYSTEM_LOOT;

  run.level = 5;
  run.summary.encountersCleared = 4;
  run.summary.uniqueItemsFound = 0;

  const zone = { id: "weight_probe", title: "Weight Probe", kind: "battle", zoneRole: "battle", actNumber: 1 } as ZoneState;
  const targetTier = loot.getTargetItemTier(run, zone, 1, content);
  const profile: ProfileState | null = null;
  const lateBias = { tierBias: 0, socketBias: 0 };
  const preferredWeaponFamilies = browserWindow.ROUGE_CLASS_REGISTRY.getPreferredWeaponFamilies(run.classId);
  const strategicWeaponFamilies = browserWindow.ROUGE_REWARD_ENGINE.getStrategicWeaponFamilies(run, content);
  const primaryStrategicWeaponFamily = strategicWeaponFamilies[0] || preferredWeaponFamilies[0] || "";
  assert.ok(primaryStrategicWeaponFamily);

  const entries = loot.getEquipmentTableEntries(run, zone, 1, content, profile);
  const currentWeaponTier = Math.max(0, Number(content.itemCatalog?.[run.loadout?.weapon?.itemId || ""]?.progressionTier || 0));
  const currentArmorTier = Math.max(0, Number(content.itemCatalog?.[run.loadout?.armor?.itemId || ""]?.progressionTier || 0));
  const strategicUpgrade = entries.find((entry) => {
    return entry.item.slot === "weapon"
      && (entry.item.family || "") === primaryStrategicWeaponFamily
      && Number(entry.item.progressionTier || 0) > currentWeaponTier;
  });

  assert.ok(targetTier >= 3, "fixture should produce a 2+ tier gap from the empty opening weapon");
  assert.ok(strategicUpgrade, "expected a strategic weapon upgrade candidate for the amazon reward table");

  const expectedWeight = computeExpectedLegacyWeight({
    item: strategicUpgrade.item,
    targetTier,
    currentWeaponTier,
    currentArmorTier,
    zone,
    lateBias,
    preferredWeaponFamilies,
    strategicWeaponFamilies,
    primaryStrategicWeaponFamily,
  });

  assert.equal(strategicUpgrade.weight, expectedWeight);
});
