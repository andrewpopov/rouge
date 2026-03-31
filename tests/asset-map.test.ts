export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

test("getCardIcon returns a path for known card IDs", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const icon = assets.getCardIcon("barbarian_bash");
  assert.ok(icon.includes("barbarian"), "should return barbarian skill icon path");

  const neutral = assets.getCardIcon("strike");
  assert.ok(neutral.includes(".png"), "should return a png path for neutral cards");
});

test("getCardIcon returns fallback icon for unknown card IDs", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const icon = assets.getCardIcon("nonexistent_card_xyz");
  assert.ok(icon.includes(".svg"), "should return an SVG fallback");
});

test("getCardIcon strips _plus suffix for variant lookup", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const base = assets.getCardIcon("barbarian_bash");
  const plus = assets.getCardIcon("barbarian_bash_plus");
  assert.equal(base, plus, "plus variant should resolve to same icon as base");
});

test("getEnemyIcon returns a path for enemy template IDs", () => {
  const { browserWindow, content } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const templateIds = Object.keys(content.enemyCatalog).slice(0, 5);
  for (const templateId of templateIds) {
    const icon = assets.getEnemyIcon(templateId);
    assert.ok(icon, `should return an icon for ${templateId}`);
    assert.ok(icon.includes(".webp") || icon.includes(".png") || icon.includes(".svg"), `icon should be an image: ${icon}`);
  }
});

test("getEnemySprite returns null for unknown templates and a path for known ones", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const unknown = assets.getEnemySprite("totally_unknown_monster_id");
  assert.equal(unknown, null, "should return null for unknown template");
});

test("getClassPortrait returns a path for known classes", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const portrait = assets.getClassPortrait("barbarian");
  assert.ok(portrait, "should return a portrait path");
  assert.ok(portrait.includes("barbarian"), "should include class name in path");

  const unknown = assets.getClassPortrait("unknown_class");
  assert.equal(unknown, null, "should return null for unknown class");
});

test("getMercenarySprite returns a sprite path", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const sprite = assets.getMercenarySprite("rogue scout");
  assert.ok(sprite, "should return a sprite path");
  assert.ok(sprite.includes("rogue_scout"), "should normalize spaces to underscores");
});

test("getUiIcon returns paths for known UI icon keys", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  assert.ok(assets.getUiIcon("hp"), "should have hp icon");
  assert.ok(assets.getUiIcon("energy"), "should have energy icon");
  assert.equal(assets.getUiIcon("nonexistent"), null, "should return null for unknown key");
});

test("getIntentIcon returns appropriate icons based on description text", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const attack = assets.getIntentIcon("deal 5 damage");
  assert.ok(attack.includes(".svg"), "should return svg icon for attack intent");

  const guard = assets.getIntentIcon("gain 3 guard");
  assert.ok(guard, "should return an icon for guard intent");

  const heal = assets.getIntentIcon("heal 4 HP");
  assert.ok(heal, "should return an icon for heal intent");
});

test("listAllCharms returns all charm definitions", () => {
  const { browserWindow } = createHarness();
  const charmData = browserWindow.ROUGE_CHARM_DATA;

  const all = charmData.listAllCharms();
  assert.ok(Array.isArray(all), "should return an array");
  assert.ok(all.length > 0, "should have at least one charm");
  for (const charm of all) {
    assert.ok(charm.id, "each charm should have an id");
    assert.ok(charm.name, "each charm should have a name");
  }
});

test("getClassSprite returns same as getClassPortrait", () => {
  const { browserWindow } = createHarness();
  const assets = browserWindow.ROUGE_ASSET_MAP;

  const portrait = assets.getClassPortrait("sorceress");
  const sprite = assets.getClassSprite("sorceress");
  assert.equal(portrait, sprite, "getClassSprite should alias getClassPortrait");
});
