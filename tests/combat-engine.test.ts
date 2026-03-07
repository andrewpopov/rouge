export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";

const ROOT = path.resolve(__dirname, "../..");
const GENERATED_ROOT = path.join(ROOT, "generated");

function loadBrowserScript(filename, sandbox) {
  const fullPath = path.join(GENERATED_ROOT, filename);
  const source = fs.readFileSync(fullPath, "utf8");
  new vm.Script(source, { filename: fullPath }).runInContext(sandbox);
}

function createHarness() {
  const sandbox = {
    window: {},
    console,
    Math,
    Date,
  };
  vm.createContext(sandbox);
  loadBrowserScript("src/content/game-content.js", sandbox);
  loadBrowserScript("src/combat/combat-engine.js", sandbox);
  loadBrowserScript("src/content/content-validator.js", sandbox);
  loadBrowserScript("src/character/class-registry.js", sandbox);
  loadBrowserScript("src/content/encounter-registry.js", sandbox);
  const browserWindow = sandbox.window as Window;
  const seedBundle = {
    classes: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/classes.json"), "utf8")),
    skills: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/skills.json"), "utf8")),
    zones: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/zones.json"), "utf8")),
    bosses: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/bosses.json"), "utf8")),
    enemyPools: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/enemy-pools.json"), "utf8")),
  };
  const classRuntimeContent = browserWindow.ROUGE_CLASS_REGISTRY.createRuntimeContent(browserWindow.ROUGE_GAME_CONTENT, seedBundle);
  const runtimeContent = browserWindow.ROUGE_ENCOUNTER_REGISTRY.createRuntimeContent(classRuntimeContent, seedBundle);
  return {
    content: runtimeContent,
    engine: browserWindow.ROUGE_COMBAT_ENGINE,
    validator: browserWindow.ROUGE_CONTENT_VALIDATOR,
    seedBundle,
  };
}

test("createCombatState builds hero, mercenary, and encounter pack", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  assert.equal(state.hero.name, "Wanderer");
  assert.equal(state.mercenary.name, "Rogue Scout");
  assert.equal(state.enemies.length, 3);
  assert.equal(state.turn, 1);
  assert.equal(state.phase, "player");
  assert.equal(state.hand.length, state.hero.handSize);
});

test("playCard spends energy and damages the selected enemy", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.hand = [{ instanceId: "card_test", cardId: "quick_slash" }];
  state.hero.energy = 3;

  const result = engine.playCard(state, content, "card_test", target.id);

  assert.equal(result.ok, true);
  assert.equal(state.hero.energy, 2);
  assert.equal(target.life, target.maxLife - 7);
  assert.equal(state.discardPile.length, 1);
});

test("endTurn triggers the mercenary before enemies resolve", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "catacombs_gate",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.mercenary.nextAttackBonus = 3;
  state.selectedEnemyId = target.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(target.life <= target.maxLife - 8);
  assert.equal(state.phase, "player");
  assert.equal(state.turn, 2);
});

test("usePotion heals the mercenary and consumes a charge", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  state.mercenary.life = 20;
  state.potions = 2;

  const result = engine.usePotion(state, "mercenary");

  assert.equal(result.ok, true);
  assert.equal(state.potions, 1);
  assert.equal(state.mercenary.life, 32);
});

test("createCombatState accepts run-state overrides for hero, mercenary, deck, and potions", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "iron_wolf",
    heroState: {
      name: "Sorceress",
      className: "Sorceress",
      maxLife: 40,
      life: 27,
      maxEnergy: 4,
      handSize: 4,
      potionHeal: 14,
    },
    mercenaryState: {
      maxLife: 30,
      life: 18,
      attack: 6,
    },
    starterDeck: ["fire_bolt", "fire_bolt", "multishot", "second_wind"],
    initialPotions: 1,
    randomFn: () => 0,
  });

  assert.equal(state.hero.name, "Sorceress");
  assert.equal(state.hero.life, 27);
  assert.equal(state.hero.maxEnergy, 4);
  assert.equal(state.mercenary.life, 18);
  assert.equal(state.mercenary.attack, 6);
  assert.equal(state.potions, 1);
  assert.equal(state.drawPile.length + state.hand.length, 4);
});

test("content validation fails clearly when a seeded act boss reference is missing", () => {
  const { seedBundle, validator } = createHarness();
  const brokenSeedBundle = {
    ...seedBundle,
    bosses: {
      ...seedBundle.bosses,
      entries: seedBundle.bosses.entries.filter((entry) => entry.id !== "andariel"),
    },
  };

  assert.throws(() => {
    validator.assertValidSeedBundle(brokenSeedBundle);
  }, /Act 1 boss "andariel" has no matching bosses entry\./);
});

test("content validation fails clearly when an elite affix is invalid", () => {
  const { content, validator } = createHarness();
  const eliteTemplateId = Object.keys(content.enemyCatalog).find((templateId) => templateId.startsWith("act_1_") && templateId.endsWith("_elite"));
  assert.ok(eliteTemplateId);
  const brokenContent = {
    ...content,
    enemyCatalog: {
      ...content.enemyCatalog,
      [eliteTemplateId]: {
        ...content.enemyCatalog[eliteTemplateId],
        variant: "elite",
        affixes: ["bad_affix"],
      },
    },
  };

  assert.throws(() => {
    validator.assertValidRuntimeContent(brokenContent);
  }, new RegExp(`Enemy template "${eliteTemplateId}" has unsupported affix "bad_affix" at index 0\\.`));
});

test("generated encounters include multiple elite affix families inside each act package", () => {
  const { content } = createHarness();

  for (let actNumber = 1; actNumber <= 5; actNumber += 1) {
    const affixIds = new Set(
      Object.values(content.enemyCatalog)
        .filter((template) => template.templateId.startsWith(`act_${actNumber}_`) && template.variant === "elite")
        .flatMap((template) => template.affixes || [])
    );

    assert.ok(affixIds.size >= 2, `expected act ${actNumber} to have at least two elite affix families`);
  }
});

test("scripted boss intents can shatter guard before dealing damage", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_boss",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== boss.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.hero.guard = 9;
  state.hero.life = state.hero.maxLife;
  boss.currentIntent = boss.intents.find((intent) => intent.kind === "sunder_attack");
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(state.hero.guard, 0);
  assert.ok(state.hero.life < state.hero.maxLife);
});

test("act-specific support archetypes can fortify the enemy line", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_opening_skirmish",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  const support = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "support");
  const ally = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(support);
  assert.ok(ally);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== support.id && enemy.id !== ally.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.selectedEnemyId = ally.id;
  support.currentIntent = support.intents.find((intent) => intent.kind === "guard_allies");
  assert.ok(support.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(support.guard > 0);
  assert.ok(ally.guard > 0);
});

test("elite affix intents can hit and fortify in the same action", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_branch_miniboss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.endsWith("_elite"));
  assert.ok(elite);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== elite.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  elite.currentIntent = elite.intents.find((intent) => intent.kind === "attack_and_guard");
  state.hero.life = state.hero.maxLife;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(state.hero.life < state.hero.maxLife);
  assert.ok(elite.guard > 0);
});
