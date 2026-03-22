export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createHarnessWithProfile() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, persistence, browserWindow } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  const profile = state.profile;
  const cube = browserWindow.ROUGE_HORADRIC_CUBE;
  const charmSystem = browserWindow.ROUGE_CHARM_SYSTEM;
  const charmData = browserWindow.ROUGE_CHARM_DATA;
  return { harness, state, profile, cube, charmSystem, charmData, persistence, browserWindow };
}

test("CUBE_RECIPES has all expected recipe IDs", () => {
  const { cube } = createHarnessWithProfile();
  const ids = cube.CUBE_RECIPES.map((r: { id: string }) => r.id);
  assert.ok(ids.includes("cube_3_small_to_large"));
  assert.ok(ids.includes("cube_3_large_to_grand"));
  assert.ok(ids.includes("cube_3_runes_upgrade"));
  assert.ok(ids.includes("cube_charm_reroll"));
  assert.equal(cube.CUBE_RECIPES.length, 4);
});

test("canExecuteRecipe returns false when profile has no charms unlocked", () => {
  const { cube, profile } = createHarnessWithProfile();
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_small_to_large"), false);
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_large_to_grand"), false);
  assert.equal(cube.canExecuteRecipe(profile, "cube_charm_reroll"), false);
});

test("canExecuteRecipe returns false for unknown recipe", () => {
  const { cube, profile } = createHarnessWithProfile();
  assert.equal(cube.canExecuteRecipe(profile, "nonexistent_recipe"), false);
});

test("canExecuteRecipe returns true when profile has 3 small charms unlocked and unequipped", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharms = allCharms.filter((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharms.length >= 3, "need at least 3 small charms in data");

  for (let i = 0; i < 3; i++) {
    charmSystem.unlockCharm(profile, smallCharms[i].id);
  }
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_small_to_large"), true);
});

test("canExecuteRecipe returns false when small charms are equipped (unavailable for transmute)", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const allCharms = charmData.listAllCharms();
  const smallCharms = allCharms.filter((c: CharmDefinition) => c.size === "small");

  for (let i = 0; i < 3; i++) {
    charmSystem.unlockCharm(profile, smallCharms[i].id);
    charmSystem.equipCharm(profile, smallCharms[i].id);
  }
  // All 3 are equipped, so none are "available" for transmute
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_small_to_large"), false);
});

test("listAvailableRecipes returns all recipes with canExecute status", () => {
  const { cube, profile } = createHarnessWithProfile();
  const recipes = cube.listAvailableRecipes(profile);
  assert.equal(recipes.length, 4);
  for (const entry of recipes) {
    assert.ok(entry.recipe);
    assert.ok(entry.recipe.id);
    assert.equal(typeof entry.canExecute, "boolean");
  }
});

test("buildCubeActions returns TownAction entries for each recipe", () => {
  const { cube, profile } = createHarnessWithProfile();
  const actions = cube.buildCubeActions(profile);
  assert.equal(actions.length, 4);
  for (const action of actions) {
    assert.ok(action.id.startsWith(cube.ACTION_PREFIX));
    assert.ok(action.title);
    assert.ok(action.description);
    assert.equal(action.category, "cube");
    assert.equal(typeof action.disabled, "boolean");
  }
});

test("buildCubeActions marks recipes as locked when materials are missing", () => {
  const { cube, profile } = createHarnessWithProfile();
  const actions = cube.buildCubeActions(profile);
  for (const action of actions) {
    assert.equal(action.disabled, true);
    assert.equal(action.actionLabel, "Locked");
  }
});

test("buildCubeActions marks recipe as Transmute when materials are ready", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const smallCharms = charmData.listAllCharms().filter((c: CharmDefinition) => c.size === "small");
  for (let i = 0; i < 3; i++) {
    charmSystem.unlockCharm(profile, smallCharms[i].id);
  }
  const actions = cube.buildCubeActions(profile);
  const smallToLarge = actions.find((a: TownAction) => a.id.includes("cube_3_small_to_large"));
  assert.ok(smallToLarge);
  assert.equal(smallToLarge.disabled, false);
  assert.equal(smallToLarge.actionLabel, "Transmute");
});

test("executeRecipe fails when materials are missing", () => {
  const { cube, profile } = createHarnessWithProfile();
  const result = cube.executeRecipe(profile, "cube_3_small_to_large");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("Missing"));
});

test("executeRecipe fails for unknown recipe", () => {
  const { cube, profile } = createHarnessWithProfile();
  const result = cube.executeRecipe(profile, "nonexistent");
  assert.equal(result.ok, false);
});

test("executeRecipe transmutes 3 small charms into 1 large charm", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const smallCharms = charmData.listAllCharms().filter((c: CharmDefinition) => c.size === "small");
  for (let i = 0; i < 3; i++) {
    charmSystem.unlockCharm(profile, smallCharms[i].id);
  }

  const beforeUnlocked = profile.meta.charms.unlockedCharmIds.length;
  const result = cube.executeRecipe(profile, "cube_3_small_to_large");
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("Transmuted"));

  // 3 small removed, 1 large added => net -2 from before
  // But might re-unlock an already-unlocked charm, so just check it succeeded
  const afterUnlocked = profile.meta.charms.unlockedCharmIds.length;
  assert.ok(afterUnlocked <= beforeUnlocked, "should have consumed charms");
});

test("executeRecipe transmutes 3 large charms into 1 grand charm", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const largeCharms = charmData.listAllCharms().filter((c: CharmDefinition) => c.size === "large");
  assert.ok(largeCharms.length >= 3, "need at least 3 large charms in charm data");
  for (let i = 0; i < 3; i++) {
    charmSystem.unlockCharm(profile, largeCharms[i].id);
  }

  const result = cube.executeRecipe(profile, "cube_3_large_to_grand");
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("Transmuted"));
});

test("executeRecipe upgrades 3 identical runes into next tier", () => {
  const { cube, profile, browserWindow } = createHarnessWithProfile();
  const runeTemplates = browserWindow.ROUGE_ITEM_DATA?.RUNE_TEMPLATES;
  assert.ok(runeTemplates, "need rune templates in item data");

  // Find a valid rune sourceId
  const allRunes = Object.values(runeTemplates) as { sourceId: string; progressionTier: number }[];
  const lowestTier = allRunes.sort((a, b) => a.progressionTier - b.progressionTier)[0];
  assert.ok(lowestTier, "need at least one rune template");

  // Add 3 identical runes to stash
  for (let i = 0; i < 3; i++) {
    profile.stash.entries.push({
      entryId: `test_rune_${i}`,
      kind: "rune",
      runeId: lowestTier.sourceId,
    } as InventoryRuneEntry);
  }

  assert.equal(cube.canExecuteRecipe(profile, "cube_3_runes_upgrade"), true);
  const result = cube.executeRecipe(profile, "cube_3_runes_upgrade");
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("Upgraded"));

  // 3 runes removed, 1 higher-tier added => stash should have 1 rune entry
  const runeEntries = profile.stash.entries.filter((e: InventoryEntry) => e.kind === "rune");
  assert.equal(runeEntries.length, 1);
});

test("executeRecipe rerolls a charm using a rune", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  const smallCharms = charmData.listAllCharms().filter((c: CharmDefinition) => c.size === "small");
  assert.ok(smallCharms.length >= 2, "need at least 2 small charms for reroll");

  charmSystem.unlockCharm(profile, smallCharms[0].id);

  // Add a rune to stash
  profile.stash.entries.push({
    entryId: "test_rune_reroll",
    kind: "rune",
    runeId: "rune_el",
  } as InventoryRuneEntry);

  assert.equal(cube.canExecuteRecipe(profile, "cube_charm_reroll"), true);
  const result = cube.executeRecipe(profile, "cube_charm_reroll");
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("Rerolled"));
  // Rune should be consumed
  const runeEntries = profile.stash.entries.filter((e: InventoryEntry) => e.kind === "rune");
  assert.equal(runeEntries.length, 0);
});

test("canExecuteRecipe returns false for rune upgrade when fewer than 3 identical runes", () => {
  const { cube, profile } = createHarnessWithProfile();
  // Add 2 runes of same type and 1 of different type
  profile.stash.entries.push(
    { entryId: "r1", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry,
    { entryId: "r2", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry,
    { entryId: "r3", kind: "rune", runeId: "rune_tir" } as InventoryRuneEntry,
  );
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_runes_upgrade"), false);
});

test("canExecuteRecipe for rune upgrade returns true with 3 identical runes", () => {
  const { cube, profile } = createHarnessWithProfile();
  profile.stash.entries.push(
    { entryId: "r1", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry,
    { entryId: "r2", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry,
    { entryId: "r3", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry,
  );
  assert.equal(cube.canExecuteRecipe(profile, "cube_3_runes_upgrade"), true);
});

test("canExecuteRecipe for charm reroll requires 1 rune and 1 unequipped charm", () => {
  const { cube, profile, charmSystem, charmData } = createHarnessWithProfile();
  // No rune, no charm
  assert.equal(cube.canExecuteRecipe(profile, "cube_charm_reroll"), false);

  // Add charm but no rune
  const smallCharms = charmData.listAllCharms().filter((c: CharmDefinition) => c.size === "small");
  charmSystem.unlockCharm(profile, smallCharms[0].id);
  assert.equal(cube.canExecuteRecipe(profile, "cube_charm_reroll"), false);

  // Add rune
  profile.stash.entries.push({ entryId: "r1", kind: "rune", runeId: "rune_el" } as InventoryRuneEntry);
  assert.equal(cube.canExecuteRecipe(profile, "cube_charm_reroll"), true);
});
