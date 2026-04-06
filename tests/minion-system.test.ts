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
  const powerBefore = state.minions[0].power;

  const secondInstanceId = addCardToHand(state, "necromancer_raise_skeleton");
  harness.engine.playCard(state, harness.content, secondInstanceId, targetId);

  assert.equal(state.minions.length, 1, "replays should not create duplicate summon bodies");
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
  });

  turns.resolveMinionPhase(state);

  const totalLifeAfter = state.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  assert.ok(totalLifeAfter < totalLifeBefore, "the trap should damage the enemy line before expiring");
  assert.equal(state.minions.length, 0, "the trap should leave the field when its duration ends");
  assert.ok(state.log.some((entry) => entry.includes("fades from the field")), "the expiration should be logged");
});

test("minion cap blocks new summon types while previews surface the limit", () => {
  const harness = createAppHarness();
  const turns = harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi;
  const state = createState(harness);

  state.minions = [
    {
      id: "minion_1",
      templateId: "necromancer_skeleton",
      name: "Skeleton",
      skillLabel: "Rusty Slash",
      actionKind: "attack",
      targetRule: "selected_enemy",
      power: 4,
      secondaryValue: 0,
      remainingTurns: 0,
      persistent: true,
    },
    {
      id: "minion_2",
      templateId: "druid_oak_sage",
      name: "Oak Sage",
      skillLabel: "Vital Bloom",
      actionKind: "heal_party",
      targetRule: "all_enemies",
      power: 3,
      secondaryValue: 0,
      remainingTurns: 0,
      persistent: true,
    },
    {
      id: "minion_3",
      templateId: "assassin_wake_of_fire",
      name: "Wake of Fire",
      skillLabel: "Flame Sweep",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      power: 3,
      secondaryValue: 1,
      remainingTurns: 2,
      persistent: false,
    },
  ];

  const preview = turns.getSummonPreview(state, { kind: "summon_minion", value: 3, minionId: "druid_poison_creeper" });
  assert.ok(preview.includes("limit"), "preview should warn when the minion cap is full");

  state.hero.energy = 99;
  const instanceId = addCardToHand(state, "druid_poison_creeper");
  harness.combatEngine.playCard(state, harness.content, instanceId);

  assert.equal(state.minions.length, turns.MAX_ACTIVE_MINIONS, "new minion types should be blocked at the cap");
  assert.ok(state.log.some((entry) => entry.includes("Minion limit reached")), "the blocked summon should be logged");
});
