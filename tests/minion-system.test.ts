export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness, createCombatHarness } from "./helpers/browser-harness";

type CombatTurnsApi = {
  MAX_ACTIVE_MINIONS: number;
  getSummonPreview(state: CombatState, effect: CardEffect): string;
  resolveMinionPhase(state: CombatState): void;
};

function createState(
  harness: ReturnType<typeof createCombatHarness> | ReturnType<typeof createAppHarness>,
  encounterId = "act_1_opening_skirmish"
) {
  const engine = "engine" in harness ? harness.engine : harness.combatEngine;
  return engine.createCombatState({
    content: harness.content,
    encounterId,
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
}

function addCardToHand(state: CombatState, cardId: string) {
  const instanceId = `test_${cardId}_${state.hand.length}_${state.discardPile.length}`;
  state.hand.push({ cardId, instanceId });
  return instanceId;
}

test("replaying a summon card reinforces the existing minion", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.energy = 99;

  const targetId = state.enemies[0].id;
  const firstInstanceId = addCardToHand(state, "necromancer_raise_skeleton");
  harness.engine.playCard(state, harness.content, firstInstanceId, targetId);

  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "necromancer_skeleton");
  assert.equal(state.minions[0].stackCount, 1);
  const powerBefore = state.minions[0].power;

  const secondInstanceId = addCardToHand(state, "necromancer_raise_skeleton");
  harness.engine.playCard(state, harness.content, secondInstanceId, targetId);

  assert.equal(state.minions.length, 1, "replays should not create duplicate summon bodies");
  assert.equal(state.minions[0].stackCount, 2, "replay should advance the summon stack count");
  assert.ok(state.minions[0].power > powerBefore, "replay should reinforce the existing minion");
});

test("temporary trap minions expire after taking their last action", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);
  const totalLifeBefore = state.enemies.reduce((sum, enemy) => sum + enemy.life, 0);

  state.minions.push({
    id: "trap_1",
    templateId: "assassin_wake_of_fire",
    name: "Wake of Fire",
    skillLabel: "Flame Sweep",
    actionKind: "attack_all_burn",
    targetRule: "all_enemies",
    power: 3,
    secondaryValue: 1,
    remainingTurns: 1,
    persistent: false,
    life: 20,
    maxLife: 20,
    guard: 0,
    alive: true,
    taunt: false,
      invulnerable: false,
      stackAbilities: [],
  });

  turns.resolveMinionPhase(state);

  const totalLifeAfter = state.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  assert.ok(totalLifeAfter < totalLifeBefore, "the trap should damage the enemy line before expiring");
  assert.equal(state.minions.length, 0, "the trap should leave the field when its duration ends");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("fades from the field")), "the expiration should be logged");
});

test("temporary trap summons reinforce up to a 3-stack cap and then only refresh duration", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);
  state.hero.energy = 99;
  state.enemies.forEach((enemy: CombatEnemyState) => {
    enemy.life = 999;
    enemy.maxLife = 999;
    enemy.guard = 0;
    enemy.alive = true;
  });

  for (let cast = 0; cast < 3; cast += 1) {
    const instanceId = addCardToHand(state, "assassin_lightning_sentry");
    harness.combatEngine.playCard(state, harness.content, instanceId);
  }

  assert.equal(state.minions.length, 1, "recasting the same trap should keep one device on the board");
  assert.equal(state.minions[0].templateId, "assassin_lightning_sentry");
  assert.equal(state.minions[0].stackCount, 3, "trap stacks should cap at three");
  const powerAtCap = state.minions[0].power;
  const turnsAtCap = state.minions[0].remainingTurns;

  const cappedPreview = turns.getSummonPreview(state, {
    kind: "summon_minion",
    minionId: "assassin_lightning_sentry",
    value: 8,
    secondaryValue: 3,
    duration: 4,
  });
  assert.match(cappedPreview, /Refresh Lightning Sentry/);
  assert.match(cappedPreview, /Stack 3\/3/);

  const fourthInstanceId = addCardToHand(state, "assassin_lightning_sentry");
  harness.combatEngine.playCard(state, harness.content, fourthInstanceId);

  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].stackCount, 3, "additional casts should stop at the trap stack cap");
  assert.equal(state.minions[0].power, powerAtCap, "power should stop growing past the trap stack cap");
  assert.ok(state.minions[0].remainingTurns > turnsAtCap, "extra casts should still refresh trap duration");
});

test("blade sentinel now summons a real line-attack device that reinforces instead of fizzling", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);
  state.hero.energy = 99;
  state.enemies.forEach((enemy: CombatEnemyState) => {
    enemy.life = 50;
    enemy.maxLife = 50;
    enemy.guard = 0;
    enemy.alive = true;
  });

  const firstInstanceId = addCardToHand(state, "assassin_blade_sentinel");
  harness.combatEngine.playCard(state, harness.content, firstInstanceId);

  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "assassin_blade_sentinel");
  assert.equal(state.minions[0].actionKind, "attack_all");
  assert.equal(state.minions[0].invulnerable, true);

  const secondInstanceId = addCardToHand(state, "assassin_blade_sentinel");
  harness.combatEngine.playCard(state, harness.content, secondInstanceId);

  assert.equal(state.minions.length, 1, "repeat casts should reinforce the active sentinel");
  assert.equal(state.minions[0].stackCount, 2);

  const totalLifeBefore = state.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  turns.resolveMinionPhase(state);
  const totalLifeAfter = state.enemies.reduce((sum, enemy) => sum + enemy.life, 0);

  assert.ok(totalLifeAfter < totalLifeBefore, "the sentinel should slash the enemy line during the minion phase");
});

test("wake of inferno preview and summon state use the new inferno template", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);
  state.hero.energy = 99;

  const preview = turns.getSummonPreview(state, {
    kind: "summon_minion",
    minionId: "assassin_wake_of_inferno",
    value: 9,
    secondaryValue: 5,
    duration: 3,
  });
  assert.match(preview, /Wake of Inferno/);
  assert.match(preview, /Burn 5/);

  const instanceId = addCardToHand(state, "assassin_wake_of_inferno");
  harness.combatEngine.playCard(state, harness.content, instanceId);

  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "assassin_wake_of_inferno");
  assert.equal(state.minions[0].secondaryValue, 5);
});

test("minion cap blocks new summon types while previews surface the limit", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);

  // Fill creature cap (3 creatures)
  state.minions = [
    {
      id: "minion_1",
      templateId: "necromancer_skeleton",
      name: "Skeleton Army",
      skillLabel: "Bone Rush",
      actionKind: "attack",
      targetRule: "selected_enemy",
      power: 4,
      secondaryValue: 0,
      remainingTurns: 0,
      persistent: true,
      life: 20,
      maxLife: 20,
      guard: 0,
      alive: true,
      taunt: false,
      invulnerable: false,
      stackAbilities: [],
    },
    {
      id: "minion_2",
      templateId: "druid_grizzly",
      name: "Grizzly",
      skillLabel: "Mauling Swipe",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      power: 6,
      secondaryValue: 4,
      remainingTurns: 0,
      persistent: true,
      life: 24,
      maxLife: 24,
      guard: 0,
      alive: true,
      taunt: true,
      invulnerable: false,
      stackAbilities: [],
    },
    {
      id: "minion_3",
      templateId: "druid_raven",
      name: "Raven",
      skillLabel: "Pecking Mark",
      actionKind: "attack_mark",
      targetRule: "lowest_life",
      power: 3,
      secondaryValue: 1,
      remainingTurns: 0,
      persistent: true,
      life: 6,
      maxLife: 6,
      guard: 0,
      alive: true,
      taunt: false,
      invulnerable: false,
      stackAbilities: [],
    },
  ];

  const preview = turns.getSummonPreview(state, { kind: "summon_minion", value: 3, minionId: "druid_poison_creeper" });
  assert.ok(preview.includes("limit"), "preview should warn when the creature cap is full");

  state.hero.energy = 99;
  const instanceId = addCardToHand(state, "druid_poison_creeper");
  harness.combatEngine.playCard(state, harness.content, instanceId);

  const creatures = state.minions.filter((m: CombatMinionState) => !m.invulnerable);
  assert.equal(creatures.length, 3, "new creature types should be blocked at the creature cap");
  assert.ok(!state.minions.some((m: CombatMinionState) => m.templateId === "druid_poison_creeper"), "poison creeper should not appear at cap");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("limit reached")), "the blocked summon should be logged");
});
