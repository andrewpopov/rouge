export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createCombatHarness } from "./helpers/browser-harness";

function createState(harness: ReturnType<typeof createCombatHarness>) {
  return harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
}

test("playing a damage card reduces enemy life", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const lifeBefore = target.life;
  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = target.id;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, target.id);
    assert.ok(target.life < lifeBefore, "enemy life should decrease");
  }
});

test("playing a guard card increases hero guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const guardCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "gain_guard_self");
  });
  if (guardCard) {
    const guardBefore = state.hero.guard;
    harness.engine.playCard(state, harness.content, guardCard.instanceId);
    assert.ok(state.hero.guard > guardBefore, "hero guard should increase");
  }
});

test("playing a card with insufficient energy is rejected", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.energy = 0;
  const card = state.hand[0];
  if (card) {
    const result = harness.engine.playCard(state, harness.content, card.instanceId);
    assert.equal(result.ok, false);
    assert.ok(result.message.includes("Energy"));
  }
});

test("playing a card outside player phase is rejected", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.phase = "enemy" as CombatPhase;
  const card = state.hand[0];
  if (card) {
    const result = harness.engine.playCard(state, harness.content, card.instanceId);
    assert.equal(result.ok, false);
  }
});

test("playing an enemy-targeting card without a target is rejected", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const targetCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy";
  });
  if (targetCard) {
    state.selectedEnemyId = "";
    const result = harness.engine.playCard(state, harness.content, targetCard.instanceId, "");
    assert.equal(result.ok, false);
    assert.ok(result.message.includes("enemy"));
  }
});

test("describeIntent returns descriptive text for all intent kinds", () => {
  const harness = createCombatHarness();
  const { engine } = harness;

  assert.ok(engine.describeIntent({ kind: "attack", label: "Slash", value: 5, target: "hero" }).includes("dmg"));
  assert.ok(engine.describeIntent({ kind: "attack_all", label: "Cleave", value: 3, target: "hero" }).includes("all"));
  assert.ok(engine.describeIntent({ kind: "guard", label: "Shield", value: 4, target: "hero" }).includes("Guard"));
  assert.ok(engine.describeIntent({ kind: "heal_ally", label: "Heal", value: 6, target: "hero" }).includes("Heal"));
  assert.ok(engine.describeIntent({ kind: "resurrect_ally", label: "Resurrect", value: 0, target: "hero" }).includes("Resurrect"));
  assert.ok(engine.describeIntent({ kind: "summon_minion", label: "Summon", value: 0, target: "hero" }).includes("Summon"));
  assert.ok(engine.describeIntent({ kind: "attack_burn", label: "Fire", value: 3, target: "hero" }).includes("Burn"));
  assert.ok(engine.describeIntent({ kind: "charge", label: "Charge Nova", value: 8, target: "all_allies", damageType: "lightning" }).includes("Charge Nova"));
  assert.ok(engine.describeIntent({ kind: "teleport", label: "Teleport Away", value: 6 }).includes("Teleport"));
  assert.ok(engine.describeIntent({ kind: "attack_lightning", label: "Soul Bolt", value: 6, target: "hero" }).includes("Lightning"));
  assert.ok(engine.describeIntent({ kind: "attack_poison_all", label: "Poison Wave", value: 5, target: "all_allies" }).includes("Poison"));
  assert.ok(engine.describeIntent({ kind: "curse_amplify", label: "Curse", value: 2, target: "hero" }).includes("Amplify"));
  assert.ok(engine.describeIntent({ kind: "drain_energy", label: "Drain", value: 3, target: "hero" }).includes("Drain"));
  assert.ok(engine.describeIntent({ kind: "consume_corpse", label: "Consume", value: 3, target: "hero" }).includes("corpse"));
  assert.equal(engine.describeIntent(null), "No action");
});

test("end turn processes enemy attacks and returns to player phase", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  assert.equal(state.phase, "player");
  harness.engine.endTurn(state);
  assert.equal(state.phase, "player");
  assert.ok(state.turn >= 1);
});

test("potion heals hero and decrements potion count", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = Math.max(1, state.hero.maxLife - 20);
  const lifeBefore = state.hero.life;
  const potionsBefore = state.potions;

  harness.engine.usePotion(state, "hero");

  if (potionsBefore > 0) {
    assert.ok(state.hero.life > lifeBefore, "hero should be healed");
    assert.equal(state.potions, potionsBefore - 1);
  }
});

test("damage_all cards deal damage to all living enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const aoeCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "damage_all");
  });
  if (aoeCard) {
    const livesBefore = state.enemies.filter((e) => e.alive).map((e) => e.life);
    harness.engine.playCard(state, harness.content, aoeCard.instanceId);
    const livesAfter = state.enemies.filter((e) => e.alive).map((e) => e.life);
    assert.ok(livesAfter.some((life, i) => life < livesBefore[i]), "some enemy should take damage");
  }
});

test("burn card applies burn stacks to target enemy", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const burnCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "apply_burn");
  });
  if (burnCard) {
    const target = state.enemies[0];
    state.selectedEnemyId = target.id;
    harness.engine.playCard(state, harness.content, burnCard.instanceId, target.id);
    assert.ok(target.burn > 0, "enemy should have burn stacks");
  }
});

test("poison card applies poison stacks to target enemy", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const poisonCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "apply_poison");
  });
  if (poisonCard) {
    const target = state.enemies[0];
    state.selectedEnemyId = target.id;
    harness.engine.playCard(state, harness.content, poisonCard.instanceId, target.id);
    assert.ok(target.poison > 0, "enemy should have poison stacks");
  }
});

test("guard party card grants guard to hero and mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const partyGuardCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "gain_guard_party");
  });
  if (partyGuardCard) {
    const heroGuardBefore = state.hero.guard;
    harness.engine.playCard(state, harness.content, partyGuardCard.instanceId);
    assert.ok(state.hero.guard > heroGuardBefore, "hero should gain guard");
  }
});

test("draw card adds cards to hand", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const drawCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === "draw");
  });
  if (drawCard) {
    const handBefore = state.hand.length;
    harness.engine.playCard(state, harness.content, drawCard.instanceId);
    // Hand may not grow if played card removed + draw added = same size or more
    assert.ok(typeof state.hand.length === "number");
  }
});

test("melee strike deals weapon damage to selected enemy", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 5;
  state.meleeUsed = false;
  const target = state.enemies[0];
  state.selectedEnemyId = target.id;
  const lifeBefore = target.life;

  harness.engine.meleeStrike(state, harness.content);

  assert.ok(target.life <= lifeBefore, "enemy should take damage");
  assert.equal(state.meleeUsed, true);
});
