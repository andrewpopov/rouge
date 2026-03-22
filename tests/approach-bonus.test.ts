export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

test("applyBonus guard bonus increases hero guard", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const guardBefore = state.hero.guard;
  approachBonus.applyBonus(state, "guard:5");
  assert.equal(state.hero.guard, guardBefore + 5);
  assert.ok(state.log.some((msg: string) => msg.includes("Careful approach")));
});

test("applyBonus damage bonus increases hero damageBonus", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const damageBefore = state.hero.damageBonus;
  approachBonus.applyBonus(state, "damage:2");
  assert.equal(state.hero.damageBonus, damageBefore + 2);
  assert.ok(state.log.some((msg: string) => msg.includes("Aggressive charge")));
});

test("applyBonus energy bonus increases hero energy", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const energyBefore = state.hero.energy;
  approachBonus.applyBonus(state, "energy:1");
  assert.equal(state.hero.energy, energyBefore + 1);
  assert.ok(state.log.some((msg: string) => msg.includes("Strategic positioning")));
});

test("applyBonus potion bonus increases potions", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const potionsBefore = state.potions;
  approachBonus.applyBonus(state, "potion:1");
  assert.equal(state.potions, potionsBefore + 1);
  assert.ok(state.log.some((msg: string) => msg.includes("Scavenged supplies")));
});

test("applyBonus guard_bonus increases hero guardBonus", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const guardBonusBefore = state.hero.guardBonus;
  approachBonus.applyBonus(state, "guard_bonus:1");
  assert.equal(state.hero.guardBonus, guardBonusBefore + 1);
  assert.ok(state.log.some((msg: string) => msg.includes("Fortified stance")));
});

test("applyBonus burn_bonus increases hero burnBonus", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const burnBonusBefore = state.hero.burnBonus;
  approachBonus.applyBonus(state, "burn_bonus:1");
  assert.equal(state.hero.burnBonus, burnBonusBefore + 1);
  assert.ok(state.log.some((msg: string) => msg.includes("Infernal preparation")));
});

test("applyBonus draw bonus draws extra cards", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow, content, combatEngine } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  const handBefore = state.hand.length;
  approachBonus.applyBonus(state, "draw:1");
  assert.ok(state.hand.length >= handBefore);
  assert.ok(state.log.some((msg: string) => msg.includes("Tactical insight")));
});

test("applyBonus with invalid combat state does not throw", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  assert.doesNotThrow(() => {
    approachBonus.applyBonus(null, "guard:5");
  });
  assert.doesNotThrow(() => {
    approachBonus.applyBonus({}, "guard:5");
  });
});

test("pickBonus returns valid ids for all approach types", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  for (const approach of ["cautious", "aggressive", "tactical"]) {
    const bonus = approachBonus.pickBonus(approach, 42);
    assert.ok(bonus.id, `pickBonus returned empty id for ${approach}`);
    assert.ok(bonus.label, `pickBonus returned empty label for ${approach}`);
    assert.ok(bonus.id.includes(":"), `pickBonus id should contain colon: ${bonus.id}`);
  }

  // Unknown approach defaults to cautious
  const fallback = approachBonus.pickBonus("unknown", 42);
  const cautious = approachBonus.pickBonus("cautious", 42);
  assert.equal(fallback.id, cautious.id);
});

test("pickBonus produces different bonuses for different seeds", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const { browserWindow } = createAppHarness();
  const approachBonus = browserWindow.__ROUGE_APPROACH_BONUS;

  const ids = new Set<string>();
  for (let seed = 0; seed < 20; seed++) {
    ids.add(approachBonus.pickBonus("cautious", seed).id);
  }
  assert.ok(ids.size > 1, "pickBonus should produce variety across seeds");
});
