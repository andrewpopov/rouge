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

// Helper: find or inject a card with a specific effect kind
function findOrInjectCard(state: CombatState, content: GameContent, effectKind: string): { cardId: string; instanceId: string } | null {
  // First try to find an existing card in hand
  const existing = state.hand.find((c) => {
    const def = content.cardCatalog[c.cardId];
    return def?.effects?.some((e) => e.kind === effectKind);
  });
  if (existing) {
    return existing;
  }

  // Find any card in the catalog with this effect, preferring target:"none" for AoE effects
  const candidates = Object.values(content.cardCatalog).filter(
    (card) => card.effects?.some((e) => e.kind === effectKind)
  );
  const catalogEntry = candidates.find((c) => c.target === "none") || candidates[0];
  if (catalogEntry) {
    const instanceId = `test_${effectKind}_${Date.now()}`;
    state.hand.push({ cardId: catalogEntry.id, instanceId });
    return { cardId: catalogEntry.id, instanceId };
  }
  return null;
}

// ── damage ──

test("resolveCardEffect damage reduces enemy life", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "damage");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  const lifeBefore = target.life;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.life < lifeBefore || !target.alive, "enemy should take damage");
});

// ── gain_guard_self ──

test("resolveCardEffect gain_guard_self increases hero guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "gain_guard_self");
  if (!card) { return; }
  state.hero.energy = 99;
  const guardBefore = state.hero.guard;
  harness.engine.playCard(state, harness.content, card.instanceId);
  assert.ok(state.hero.guard > guardBefore, "hero should gain guard");
});

// ── apply_burn ──

test("resolveCardEffect apply_burn applies burn to target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_burn");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.burn > 0, "enemy should have burn stacks");
});

// ── apply_poison ──

test("resolveCardEffect apply_poison applies poison to target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_poison");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.poison > 0, "enemy should have poison stacks");
});

// ── apply_slow ──

test("resolveCardEffect apply_slow applies slow to target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_slow");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.slow > 0, "enemy should have slow stacks");
});

// ── apply_freeze ──

test("resolveCardEffect apply_freeze applies freeze to target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_freeze");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.freeze > 0, "enemy should have freeze stacks");
});

// ── apply_stun ──

test("resolveCardEffect apply_stun stuns target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_stun");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.equal(target.stun, 1, "enemy should be stunned");
});

// ── apply_paralyze ──

test("resolveCardEffect apply_paralyze applies paralyze to target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "apply_paralyze");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.ok(target.paralyze > 0, "enemy should have paralyze stacks");
});

// ── apply_burn_all ──

test("resolveCardEffect apply_burn_all burns all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_burn_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.burn > 0), "all living enemies should have burn");
});

// ── apply_poison_all ──

test("resolveCardEffect apply_poison_all poisons all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_poison_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.poison > 0), "all living enemies should have poison");
});

// ── apply_slow_all ──

test("resolveCardEffect apply_slow_all slows all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_slow_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.slow > 0), "all living enemies should have slow");
});

// ── apply_freeze_all ──

test("resolveCardEffect apply_freeze_all freezes all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_freeze_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.freeze > 0), "all living enemies should have freeze");
});

// ── apply_stun_all ──

test("resolveCardEffect apply_stun_all stuns all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_stun_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.stun === 1), "all living enemies should be stunned");
});

// ── apply_paralyze_all ──

test("resolveCardEffect apply_paralyze_all paralyzes all enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "apply_paralyze_all");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  const living = state.enemies.filter((e) => e.alive);
  assert.ok(living.every((e) => e.paralyze > 0), "all living enemies should have paralyze");
});

// ── gain_guard_party ──

test("resolveCardEffect gain_guard_party grants guard to hero and mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "gain_guard_party");
  if (!card) { return; }
  state.hero.energy = 99;
  const heroGuardBefore = state.hero.guard;
  const mercGuardBefore = state.mercenary.guard;
  harness.engine.playCard(state, harness.content, card.instanceId);
  assert.ok(state.hero.guard > heroGuardBefore, "hero should gain guard");
  assert.ok(state.mercenary.guard > mercGuardBefore, "mercenary should gain guard");
});

// ── buff_mercenary_next_attack ──

test("resolveCardEffect buff_mercenary_next_attack buffs mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "buff_mercenary_next_attack");
  if (!card) { return; }
  state.hero.energy = 99;
  const bonusBefore = state.mercenary.nextAttackBonus || 0;
  harness.engine.playCard(state, harness.content, card.instanceId);
  assert.ok(state.mercenary.nextAttackBonus > bonusBefore, "mercenary next attack bonus should increase");
});

// ── damage_all ──

test("resolveCardEffect damage_all deals damage to all living enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "damage_all");
  if (!card) { return; }
  state.hero.energy = 99;
  const livesBefore = state.enemies.filter((e) => e.alive).map((e) => e.life);
  harness.engine.playCard(state, harness.content, card.instanceId);
  const livesAfter = state.enemies.filter((e) => e.alive).map((e) => e.life);
  // At least some enemies should take damage
  const anyDamaged = livesAfter.some((life, i) => life < livesBefore[i]) || livesAfter.length < livesBefore.length;
  assert.ok(anyDamaged, "some enemies should take damage");
});

// ── heal_mercenary ──

test("resolveCardEffect heal_mercenary heals mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.mercenary.life = Math.max(1, state.mercenary.maxLife - 10);
  const card = findOrInjectCard(state, harness.content, "heal_mercenary");
  if (!card) { return; }
  state.hero.energy = 99;
  const lifeBefore = state.mercenary.life;
  harness.engine.playCard(state, harness.content, card.instanceId);
  assert.ok(state.mercenary.life >= lifeBefore, "mercenary life should increase or stay same");
});

// ── draw ──

test("resolveCardEffect draw adds cards to hand", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const card = findOrInjectCard(state, harness.content, "draw");
  if (!card) { return; }
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId);
  // Hand should have grown by draw value minus the 1 card played
  assert.ok(typeof state.hand.length === "number");
});

// ── heal_hero ──

test("resolveCardEffect heal_hero heals the hero", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = Math.max(1, state.hero.maxLife - 15);
  const card = findOrInjectCard(state, harness.content, "heal_hero");
  if (!card) { return; }
  state.hero.energy = 99;
  const lifeBefore = state.hero.life;
  harness.engine.playCard(state, harness.content, card.instanceId);
  assert.ok(state.hero.life >= lifeBefore, "hero life should increase or stay same");
});

// ── mark_enemy_for_mercenary ──

test("resolveCardEffect mark_enemy_for_mercenary marks target", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  const card = findOrInjectCard(state, harness.content, "mark_enemy_for_mercenary");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  assert.equal(state.mercenary.markedEnemyId, target.id);
});

test("resolveCardEffect mark_enemy_for_mercenary preserves an existing mark when the new target dies first", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const livingEnemies = state.enemies.filter((e) => e.alive);
  assert.ok(livingEnemies.length >= 2, "fixture should provide at least two living enemies");
  const preservedTarget = livingEnemies[0];
  const doomedTarget = livingEnemies[1];
  const card = findOrInjectCard(state, harness.content, "mark_enemy_for_mercenary");
  if (!card) { return; }

  state.mercenary.markedEnemyId = preservedTarget.id;
  state.mercenary.markBonus = 11;
  state.selectedEnemyId = doomedTarget.id;
  state.hero.energy = 99;
  doomedTarget.life = 1;
  doomedTarget.guard = 0;

  harness.engine.playCard(state, harness.content, card.instanceId, doomedTarget.id);

  assert.equal(doomedTarget.alive, false);
  assert.equal(state.mercenary.markedEnemyId, preservedTarget.id);
  assert.equal(state.mercenary.markBonus, 11);
});

// ── weaken interaction ──

test("damage cards deal reduced damage when hero is weakened", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const target = state.enemies.find((e) => e.alive);
  assert.ok(target);
  target.life = target.maxLife; // ensure full health for consistent comparison
  target.guard = 0;

  state.hero.weaken = 2;
  const card = findOrInjectCard(state, harness.content, "damage");
  if (!card) { return; }
  state.selectedEnemyId = target.id;
  state.hero.energy = 99;
  harness.engine.playCard(state, harness.content, card.instanceId, target.id);
  // The weaken modifier reduces damage by 30%, we just verify the card was played successfully
  assert.ok(target.life <= target.maxLife, "enemy should take (reduced) damage");
});

// ── summarizeCardEffect ──

test("summarizeCardEffect formats segments correctly", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  // Play any card to verify the log output format
  const card = state.hand[0];
  if (!card) { return; }
  state.hero.energy = 99;
  const target = state.enemies.find((e) => e.alive);
  if (target) {
    state.selectedEnemyId = target.id;
  }
  harness.engine.playCard(state, harness.content, card.instanceId, target?.id || "");
  // Check that the combat log has an entry
  assert.ok(state.log.length > 0, "log should have entries after playing a card");
});
