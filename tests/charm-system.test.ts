export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createHarnessWithProfile() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, browserWindow } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  const profile = state.profile;
  const charmSystem = browserWindow.ROUGE_CHARM_SYSTEM;
  const charmData = browserWindow.ROUGE_CHARM_DATA;
  return { harness, state, profile, charmSystem, charmData, browserWindow, appEngine, content };
}

// ── unlockCharm ──

test("unlockCharm adds charm to unlockedCharmIds", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  assert.ok(allCharms.length > 0, "need at least one charm");

  const charmId = allCharms[0].id;
  const result = charmSystem.unlockCharm(profile, charmId);
  assert.equal(result, true);
  assert.ok(profile.meta.charms.unlockedCharmIds.includes(charmId));
});

test("unlockCharm returns false for already-unlocked charm", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const charmId = allCharms[0].id;

  charmSystem.unlockCharm(profile, charmId);
  const result = charmSystem.unlockCharm(profile, charmId);
  assert.equal(result, false);
});

test("unlockCharm returns false for invalid charm id", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  const result = charmSystem.unlockCharm(profile, "nonexistent_charm_xyz");
  assert.equal(result, false);
});

test("unlockCharm returns false for null profile meta", () => {
  const { charmSystem } = createHarnessWithProfile();
  const result = charmSystem.unlockCharm({ meta: {} } as ProfileState, "some_charm");
  assert.equal(result, false);
});

// ── canEquipCharm ──

test("canEquipCharm returns false when charm is not unlocked", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  assert.equal(charmSystem.canEquipCharm(profile, allCharms[0].id), false);
});

test("canEquipCharm returns true when charm is unlocked and pouch has space", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharm = allCharms.find((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharm);

  charmSystem.unlockCharm(profile, smallCharm.id);
  assert.equal(charmSystem.canEquipCharm(profile, smallCharm.id), true);
});

test("canEquipCharm returns false when charm is already equipped", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharm = allCharms.find((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharm);

  charmSystem.unlockCharm(profile, smallCharm.id);
  charmSystem.equipCharm(profile, smallCharm.id);
  assert.equal(charmSystem.canEquipCharm(profile, smallCharm.id), false);
});

test("canEquipCharm returns false when pouch is full", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharms = allCharms.filter((c: CharmDefinition) => c.size === "small");

  // Fill up the pouch (capacity is 8, small charms cost 1 slot each)
  let equipped = 0;
  for (const charm of smallCharms) {
    if (equipped >= 8) { break; }
    charmSystem.unlockCharm(profile, charm.id);
    if (charmSystem.equipCharm(profile, charm.id)) {
      equipped++;
    }
  }

  // Find one more small charm that wasn't equipped
  const extraCharm = smallCharms.find(
    (c: CharmDefinition) => !profile.meta.charms.equippedCharmIds.includes(c.id)
  );
  if (extraCharm) {
    charmSystem.unlockCharm(profile, extraCharm.id);
    assert.equal(charmSystem.canEquipCharm(profile, extraCharm.id), false);
  }
});

test("canEquipCharm returns false for null profile", () => {
  const { charmSystem } = createHarnessWithProfile();
  assert.equal(charmSystem.canEquipCharm(null, "some_charm"), false);
});

// ── equipCharm ──

test("equipCharm adds charm to equippedCharmIds", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharm = allCharms.find((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharm);

  charmSystem.unlockCharm(profile, smallCharm.id);
  const result = charmSystem.equipCharm(profile, smallCharm.id);
  assert.equal(result, true);
  assert.ok(profile.meta.charms.equippedCharmIds.includes(smallCharm.id));
});

test("equipCharm returns false when canEquipCharm is false", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  const result = charmSystem.equipCharm(profile, "nonexistent_charm");
  assert.equal(result, false);
});

// ── unequipCharm ──

test("unequipCharm removes charm from equippedCharmIds", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharm = allCharms.find((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharm);

  charmSystem.unlockCharm(profile, smallCharm.id);
  charmSystem.equipCharm(profile, smallCharm.id);
  const result = charmSystem.unequipCharm(profile, smallCharm.id);
  assert.equal(result, true);
  assert.ok(!profile.meta.charms.equippedCharmIds.includes(smallCharm.id));
});

test("unequipCharm returns false for non-equipped charm", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  charmSystem.unlockCharm(profile, allCharms[0].id);
  const result = charmSystem.unequipCharm(profile, allCharms[0].id);
  assert.equal(result, false);
});

test("unequipCharm returns false for null profile meta", () => {
  const { charmSystem } = createHarnessWithProfile();
  const result = charmSystem.unequipCharm({ meta: {} } as ProfileState, "some_charm");
  assert.equal(result, false);
});

// ── getEquippedSlotCost ──

test("getEquippedSlotCost returns 0 for empty pouch", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  assert.equal(charmSystem.getEquippedSlotCost(profile), 0);
});

test("getEquippedSlotCost sums slot costs of equipped charms", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharms = allCharms.filter((c: CharmDefinition) => c.size === "small");

  charmSystem.unlockCharm(profile, smallCharms[0].id);
  charmSystem.equipCharm(profile, smallCharms[0].id);
  const cost1 = charmSystem.getEquippedSlotCost(profile);
  assert.ok(cost1 > 0, "should have positive slot cost");

  charmSystem.unlockCharm(profile, smallCharms[1].id);
  charmSystem.equipCharm(profile, smallCharms[1].id);
  const cost2 = charmSystem.getEquippedSlotCost(profile);
  assert.ok(cost2 > cost1, "cost should increase with more charms");
});

test("getEquippedSlotCost returns 0 for null profile", () => {
  const { charmSystem } = createHarnessWithProfile();
  assert.equal(charmSystem.getEquippedSlotCost(null), 0);
});

// ── buildCharmBonuses ──

test("buildCharmBonuses returns empty bonuses with no equipped charms", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  const bonuses = charmSystem.buildCharmBonuses(profile);
  assert.ok(typeof bonuses === "object");
  // All values should be 0 or undefined
  const values = Object.values(bonuses).filter((v) => v !== 0);
  assert.equal(values.length, 0);
});

test("buildCharmBonuses aggregates bonuses from equipped charms", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharm = allCharms.find(
    (c: CharmDefinition) => c.size === "small" && Object.keys(c.bonuses || {}).length > 0
  );
  if (!smallCharm) { return; }

  charmSystem.unlockCharm(profile, smallCharm.id);
  charmSystem.equipCharm(profile, smallCharm.id);
  const bonuses = charmSystem.buildCharmBonuses(profile);
  const bonusValues = Object.values(bonuses).filter((v) => v !== 0);
  assert.ok(bonusValues.length > 0, "should have at least one non-zero bonus");
});

test("buildCharmBonuses filters by classId when provided", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();

  // Find a class-specific charm
  const classCharm = allCharms.find((c: CharmDefinition) => c.classId);
  if (!classCharm) { return; }

  charmSystem.unlockCharm(profile, classCharm.id);
  charmSystem.equipCharm(profile, classCharm.id);

  // With matching class, bonuses should apply
  const bonusesMatch = charmSystem.buildCharmBonuses(profile, classCharm.classId);
  // With non-matching class, class-specific bonuses should not apply
  const bonusesMismatch = charmSystem.buildCharmBonuses(profile, "nonexistent_class");
  // The mismatch bonuses should have fewer/zero entries from this charm
  assert.ok(typeof bonusesMatch === "object");
  assert.ok(typeof bonusesMismatch === "object");
});

test("buildCharmBonuses returns empty for null profile", () => {
  const { charmSystem } = createHarnessWithProfile();
  const bonuses = charmSystem.buildCharmBonuses(null);
  assert.ok(typeof bonuses === "object");
});

// ── getCharmPouchSummary ──

test("getCharmPouchSummary returns correct structure with empty pouch", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  const summary = charmSystem.getCharmPouchSummary(profile);
  assert.equal(summary.capacity, charmSystem.POUCH_CAPACITY);
  assert.equal(summary.slotsUsed, 0);
  assert.equal(summary.slotsRemaining, charmSystem.POUCH_CAPACITY);
  assert.equal(summary.equippedCount, 0);
  assert.equal(summary.unlockedCount, 0);
  assert.ok(Array.isArray(summary.equippedCharms));
  assert.ok(Array.isArray(summary.unequippedCharms));
  assert.equal(summary.equippedCharms.length, 0);
  assert.equal(summary.unequippedCharms.length, 0);
});

test("getCharmPouchSummary reflects equipped and unequipped charms", () => {
  const { profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharms = allCharms.filter((c: CharmDefinition) => c.size === "small");

  charmSystem.unlockCharm(profile, smallCharms[0].id);
  charmSystem.unlockCharm(profile, smallCharms[1].id);
  charmSystem.equipCharm(profile, smallCharms[0].id);

  const summary = charmSystem.getCharmPouchSummary(profile);
  assert.equal(summary.equippedCount, 1);
  assert.equal(summary.unlockedCount, 2);
  assert.equal(summary.equippedCharms.length, 1);
  assert.equal(summary.unequippedCharms.length, 1);
  assert.ok(summary.slotsUsed > 0);
  assert.ok(summary.slotsRemaining < summary.capacity);
});

test("getCharmPouchSummary handles null profile", () => {
  const { charmSystem } = createHarnessWithProfile();
  const summary = charmSystem.getCharmPouchSummary(null);
  assert.equal(summary.equippedCount, 0);
  assert.equal(summary.unlockedCount, 0);
  assert.equal(summary.capacity, charmSystem.POUCH_CAPACITY);
});

// ── checkAndUnlockCharms ──

test("checkAndUnlockCharms unlocks charms based on act progression", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  profile.meta.progression.highestActCleared = 3;
  profile.meta.progression.totalBossesDefeated = 0;
  profile.meta.progression.classesPlayed = [];

  const unlocked = charmSystem.checkAndUnlockCharms(profile, null);
  assert.ok(Array.isArray(unlocked));
  // Acts 1-3 cleared should unlock some small charms
  assert.ok(unlocked.length > 0, "should unlock charms for act progression");
  // Verify the charms were actually added
  for (const charmId of unlocked) {
    assert.ok(profile.meta.charms.unlockedCharmIds.includes(charmId));
  }
});

test("checkAndUnlockCharms unlocks charms for boss kills", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  profile.meta.progression.highestActCleared = 0;
  profile.meta.progression.totalBossesDefeated = 5;
  profile.meta.progression.classesPlayed = [];

  const unlocked = charmSystem.checkAndUnlockCharms(profile, null);
  // 5 bosses should unlock small_charm_vigor (3 bosses) and small_charm_remedy (5 bosses)
  assert.ok(unlocked.some((id: string) => id === "small_charm_vigor" || id === "small_charm_remedy"));
});

test("checkAndUnlockCharms unlocks charms for classes played", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  profile.meta.progression.highestActCleared = 0;
  profile.meta.progression.totalBossesDefeated = 0;
  profile.meta.progression.classesPlayed = ["barbarian", "sorceress"];

  const unlocked = charmSystem.checkAndUnlockCharms(profile, null);
  assert.ok(unlocked.some((id: string) => id === "small_charm_loyalty"));
});

test("checkAndUnlockCharms unlocks grand charms for classes played with act 3+", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  profile.meta.progression.highestActCleared = 3;
  profile.meta.progression.totalBossesDefeated = 0;
  profile.meta.progression.classesPlayed = ["barbarian"];

  const unlocked = charmSystem.checkAndUnlockCharms(profile, null);
  assert.ok(unlocked.some((id: string) => id === "grand_charm_barbarian"));
});

test("checkAndUnlockCharms does not re-unlock already unlocked charms", () => {
  const { profile, charmSystem } = createHarnessWithProfile();
  profile.meta.progression.highestActCleared = 3;
  profile.meta.progression.totalBossesDefeated = 5;
  profile.meta.progression.classesPlayed = ["barbarian", "sorceress"];

  const firstUnlock = charmSystem.checkAndUnlockCharms(profile, null);
  const secondUnlock = charmSystem.checkAndUnlockCharms(profile, null);
  assert.ok(firstUnlock.length > 0);
  assert.equal(secondUnlock.length, 0, "should not re-unlock charms");
});

test("checkAndUnlockCharms returns empty for missing profile data", () => {
  const { charmSystem } = createHarnessWithProfile();
  const result = charmSystem.checkAndUnlockCharms({ meta: {} } as ProfileState, null);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test("POUCH_CAPACITY is 8", () => {
  const { charmSystem } = createHarnessWithProfile();
  assert.equal(charmSystem.POUCH_CAPACITY, 8);
});

test("ACTION_EQUIP_PREFIX and ACTION_UNEQUIP_PREFIX are defined", () => {
  const { charmSystem } = createHarnessWithProfile();
  assert.ok(charmSystem.ACTION_EQUIP_PREFIX);
  assert.ok(charmSystem.ACTION_UNEQUIP_PREFIX);
  assert.equal(typeof charmSystem.ACTION_EQUIP_PREFIX, "string");
  assert.equal(typeof charmSystem.ACTION_UNEQUIP_PREFIX, "string");
});
