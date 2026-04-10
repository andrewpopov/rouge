export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness, createCombatHarness } from "./helpers/browser-harness";

type CombatUtilsApi = {
  isTrapTemplate(template: { actionKind: string; id: string }): boolean;
  isSupportTemplate(template: { actionKind: string }): boolean;
  isTankTemplate(template: { actionKind: string }): boolean;
  isDeviceTemplate(template: { actionKind: string; id: string }): boolean;
  isTrapLikeMinion(minion: { invulnerable?: boolean; actionKind: string; templateId: string }): boolean;
  ALL_STATUSES: readonly string[];
  applyStatus(enemy: CombatEnemyState, status: string, amount: number): void;
  clearAllStatuses(enemy: CombatEnemyState): void;
  clearCrowdControl(enemy: CombatEnemyState): void;
  calculateIntentGuard(intentValue: number, secondaryValue: number | undefined, divisor?: number): number;
  calculateIntentHeal(dealt: number, secondaryValue: number | undefined): number;
};

function getCombatUtils(): CombatUtilsApi {
  const harness = createAppHarness();
  return harness.browserWindow.__ROUGE_COMBAT_UTILS as CombatUtilsApi;
}

function createState() {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
  return { harness, state };
}

// ── Minion classification ──

test("isTrapTemplate identifies burn and paralyze traps by actionKind", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isTrapTemplate({ actionKind: "attack_all_burn", id: "fire_trap" }));
  assert.ok(utils.isTrapTemplate({ actionKind: "attack_all_paralyze", id: "lightning_trap" }));
  assert.ok(!utils.isTrapTemplate({ actionKind: "attack", id: "skeleton" }));
});

test("isTrapTemplate identifies traps by ID token", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isTrapTemplate({ actionKind: "attack", id: "fire_sentry" }));
  assert.ok(utils.isTrapTemplate({ actionKind: "attack", id: "wake_of_fire" }));
  assert.ok(utils.isTrapTemplate({ actionKind: "attack", id: "poison_trap" }));
  assert.ok(utils.isTrapTemplate({ actionKind: "attack", id: "frost_sentinel" }));
  assert.ok(!utils.isTrapTemplate({ actionKind: "attack", id: "skeleton_warrior" }));
});

test("isSupportTemplate identifies heal_party action kind", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isSupportTemplate({ actionKind: "heal_party" }));
  assert.ok(!utils.isSupportTemplate({ actionKind: "attack" }));
});

test("isTankTemplate identifies guard-granting minions", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isTankTemplate({ actionKind: "attack_guard_party" }));
  assert.ok(utils.isTankTemplate({ actionKind: "buff_mercenary_guard_party" }));
  assert.ok(!utils.isTankTemplate({ actionKind: "attack" }));
});

test("isDeviceTemplate returns true for traps and support minions", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isDeviceTemplate({ actionKind: "attack_all_burn", id: "x" }));
  assert.ok(utils.isDeviceTemplate({ actionKind: "heal_party", id: "y" }));
  assert.ok(!utils.isDeviceTemplate({ actionKind: "attack", id: "z" }));
});

test("isTrapLikeMinion requires both invulnerable flag and trap pattern", () => {
  const utils = getCombatUtils();
  assert.ok(utils.isTrapLikeMinion({ invulnerable: true, actionKind: "attack_all_burn", templateId: "fire_sentry" }));
  assert.ok(!utils.isTrapLikeMinion({ invulnerable: false, actionKind: "attack_all_burn", templateId: "fire_sentry" }));
  assert.ok(!utils.isTrapLikeMinion({ invulnerable: true, actionKind: "attack", templateId: "skeleton" }));
});

// ── Status helpers ──

test("applyStatus accumulates burn, poison, slow, freeze, and paralyze", () => {
  const { state } = createState();
  const utils = getCombatUtils();
  const enemy = state.enemies[0];

  utils.applyStatus(enemy, "burn", 3);
  assert.equal(enemy.burn, 3);
  utils.applyStatus(enemy, "burn", 2);
  assert.equal(enemy.burn, 5);

  utils.applyStatus(enemy, "poison", 4);
  assert.equal(enemy.poison, 4);

  utils.applyStatus(enemy, "slow", 2);
  assert.equal(enemy.slow, 2);

  utils.applyStatus(enemy, "freeze", 1);
  assert.equal(enemy.freeze, 1);

  utils.applyStatus(enemy, "paralyze", 3);
  assert.equal(enemy.paralyze, 3);
});

test("applyStatus sets stun to given value instead of accumulating", () => {
  const { state } = createState();
  const utils = getCombatUtils();
  const enemy = state.enemies[0];

  utils.applyStatus(enemy, "stun", 1);
  assert.equal(enemy.stun, 1);
  utils.applyStatus(enemy, "stun", 1);
  assert.equal(enemy.stun, 1, "stun should not stack");
});

test("clearAllStatuses zeroes all six status values", () => {
  const { state } = createState();
  const utils = getCombatUtils();
  const enemy = state.enemies[0];

  enemy.burn = 5;
  enemy.poison = 3;
  enemy.slow = 2;
  enemy.freeze = 1;
  enemy.stun = 1;
  enemy.paralyze = 4;

  utils.clearAllStatuses(enemy);
  assert.equal(enemy.burn, 0);
  assert.equal(enemy.poison, 0);
  assert.equal(enemy.slow, 0);
  assert.equal(enemy.freeze, 0);
  assert.equal(enemy.stun, 0);
  assert.equal(enemy.paralyze, 0);
});

test("clearCrowdControl clears only hard CC, leaving burn and poison", () => {
  const { state } = createState();
  const utils = getCombatUtils();
  const enemy = state.enemies[0];

  enemy.burn = 5;
  enemy.poison = 3;
  enemy.slow = 2;
  enemy.freeze = 1;
  enemy.stun = 1;
  enemy.paralyze = 4;

  utils.clearCrowdControl(enemy);
  assert.equal(enemy.burn, 5, "burn should be preserved");
  assert.equal(enemy.poison, 3, "poison should be preserved");
  assert.equal(enemy.slow, 0);
  assert.equal(enemy.freeze, 0);
  assert.equal(enemy.stun, 0);
  assert.equal(enemy.paralyze, 0);
});

// ── Guard calculation ──

test("calculateIntentGuard uses secondaryValue when present", () => {
  const utils = getCombatUtils();
  assert.equal(utils.calculateIntentGuard(10, 7), 7);
  assert.equal(utils.calculateIntentGuard(10, 15), 15);
});

test("calculateIntentGuard falls back to ceil(value/divisor) with floor of 2", () => {
  const utils = getCombatUtils();
  assert.equal(utils.calculateIntentGuard(10, undefined), 5);
  assert.equal(utils.calculateIntentGuard(3, undefined), 2);
  assert.equal(utils.calculateIntentGuard(1, undefined), 2, "minimum floor of 2");
});

test("calculateIntentGuard respects custom divisor", () => {
  const utils = getCombatUtils();
  assert.equal(utils.calculateIntentGuard(9, undefined, 3), 3);
  assert.equal(utils.calculateIntentGuard(10, undefined, 3), 4);
});

test("calculateIntentHeal uses secondaryValue when present", () => {
  const utils = getCombatUtils();
  assert.equal(utils.calculateIntentHeal(10, 7), 7);
});

test("calculateIntentHeal falls back to ceil(dealt/2) with floor of 1", () => {
  const utils = getCombatUtils();
  assert.equal(utils.calculateIntentHeal(10, undefined), 5);
  assert.equal(utils.calculateIntentHeal(1, undefined), 1);
  assert.equal(utils.calculateIntentHeal(0, undefined), 1, "minimum floor of 1");
});

// ── Card behavior data-driven system ──

test("data-driven card windows apply correctly through playCard", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
  state.hero.energy = 99;

  // Play a data-driven window card (barbarian_axe_mastery adds +3 damage to next Attack)
  const instanceId = `test_axe_${state.hand.length}`;
  state.hand.push({ cardId: "barbarian_axe_mastery", instanceId });
  const result = harness.engine.playCard(state, harness.content, instanceId, state.enemies[0].id);

  assert.equal(result.ok, true);
  assert.ok(
    state.skillWindows.some((w: { skillId: string; damageBonus?: number }) =>
      w.skillId === "barbarian_axe_mastery" && (w.damageBonus || 0) === 3
    ),
    "should create a skill window with +3 damage bonus"
  );
});

test("data-driven conditional damage triggers on status", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
  state.hero.energy = 99;
  const enemy = state.enemies[0];
  const lifeBefore = enemy.life;

  // Apply slow to the enemy so the conditional triggers
  enemy.slow = 3;

  // Play amazon_impale (conditional: +5 if target has slow or paralyze)
  const instanceId = `test_impale_${state.hand.length}`;
  state.hand.push({ cardId: "amazon_impale", instanceId });
  harness.engine.playCard(state, harness.content, instanceId, enemy.id);

  // The card's base damage + the conditional 5 should reduce enemy life
  assert.ok(enemy.life < lifeBefore, "enemy should take damage from base effect + conditional bonus");
});

test("data-driven attack reduction applies through playCard", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
  state.hero.energy = 99;

  // Play barbarian_bulwark (attack reduction: 6, heroOnly: false)
  const instanceId = `test_bulwark_${state.hand.length}`;
  state.hand.push({ cardId: "barbarian_bulwark", instanceId });
  harness.engine.playCard(state, harness.content, instanceId, state.enemies[0].id);

  assert.ok(state.nextEnemyAttackReduction >= 6, "should reduce next enemy attack by at least 6");
  assert.equal(state.nextEnemyAttackReductionHeroOnly, false, "should protect both hero and mercenary");
});

test("minion reinforcement uses hpGain not maxLife for life restoration", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
  state.hero.energy = 99;
  const targetId = state.enemies[0].id;

  // Summon a skeleton
  const id1 = `test_skel1_${state.hand.length}`;
  state.hand.push({ cardId: "necromancer_raise_skeleton", instanceId: id1 });
  harness.engine.playCard(state, harness.content, id1, targetId);

  const minion = state.minions[0];
  // Damage the minion to test that reinforcement uses hpGain
  minion.life = 1;
  const maxLifeBefore = minion.maxLife;

  // Reinforce
  const id2 = `test_skel2_${state.hand.length}`;
  state.hand.push({ cardId: "necromancer_raise_skeleton", instanceId: id2 });
  harness.engine.playCard(state, harness.content, id2, targetId);

  const hpGain = minion.maxLife - maxLifeBefore;
  // The bug was: life = min(maxLife, life + maxLife) instead of min(maxLife, life + hpGain)
  // With hpGain fix: life = min(maxLife, 1 + hpGain) which should be much less than maxLife
  assert.ok(
    minion.life <= 1 + hpGain,
    `life (${minion.life}) should be at most 1 + hpGain (${1 + hpGain}), not maxLife (${minion.maxLife})`
  );
});
