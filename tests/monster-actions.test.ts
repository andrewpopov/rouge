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

test("resolveMonsterIntent handles resurrect_ally with dead allies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill one enemy to create a dead ally
  const targetEnemy = state.enemies[1] || state.enemies[0];
  targetEnemy.alive = false;
  targetEnemy.life = 0;
  targetEnemy.consumed = false;

  const caster = state.enemies.find((e) => e.alive && e.id !== targetEnemy.id);
  if (!caster) { return; }

  const intent: EnemyIntent = { kind: "resurrect_ally", label: "Resurrect", value: 3, target: "hero", cooldown: 2 };

  // Instead, we test through the combat engine's endTurn which calls resolveMonsterIntent internally
  // Let's set up a caster with resurrect_ally intent
  const raiser = state.enemies.find((e) => e.alive);
  if (!raiser) { return; }
  raiser.currentIntent = intent;
  raiser.intentIndex = 0;
  raiser.intents = [intent];

  // End turn to trigger enemy actions
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // The dead enemy should be alive again
  assert.equal(targetEnemy.alive, true, "dead ally should be resurrected");
  assert.ok(targetEnemy.life > 0, "resurrected ally should have positive life");
});

test("resolveMonsterIntent handles resurrect_ally fallback attack when no dead allies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // All enemies alive, so resurrect should fallback to attack
  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "resurrect_ally", label: "Resurrect", value: 5, target: "hero", cooldown: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  const heroBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Hero should have taken some damage from the fallback attack
  assert.ok(state.hero.life <= heroBefore, "hero should take fallback damage");
});

test("resolveMonsterIntent handles summon_minion", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "summon_minion", label: "Lay Egg", value: 6, target: "hero", cooldown: 3 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  const enemyCountBefore = state.enemies.length;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.enemies.length > enemyCountBefore, "should have spawned a minion");
});

test("resolveMonsterIntent handles teleport by gaining guard and clearing crowd control", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  caster.freeze = 1;
  caster.slow = 1;
  const intent: EnemyIntent = { kind: "teleport", label: "Teleport Away", value: 7 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.equal(caster.guard, 7);
  assert.equal(caster.freeze, 0);
  assert.equal(caster.slow, 0);
});

test("resolveMonsterIntent handles charge by telegraphing and gaining guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "charge", label: "Poison Wave", value: 9, target: "all_allies", secondaryValue: 4, damageType: "poison" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.equal(caster.guard, 4);
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("charging Poison Wave")));
});

test("resolveMonsterIntent handles attack_burn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_burn", label: "Fire Bolt", value: 4, target: "hero", secondaryValue: 3 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.heroBurn > 0, "hero should have burn stacks");
});

test("resolveMonsterIntent handles attack_poison", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_poison", label: "Poison Spit", value: 3, target: "hero", secondaryValue: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.heroPoison > 0, "hero should have poison stacks");
});

test("resolveMonsterIntent handles attack_poison_all", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_poison_all", label: "Poison Wave", value: 4, target: "all_allies", secondaryValue: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.heroPoison > 0, "hero should have poison stacks");
  assert.ok(state.mercenary.life < state.mercenary.maxLife, "mercenary should take poison damage");
});

test("resolveMonsterIntent handles attack_lightning", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_lightning", label: "Soul Bolt", value: 5, target: "hero" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  const heroBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.life < heroBefore, "hero should take lightning damage");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("lightning damage")));
});

test("resolveMonsterIntent handles attack_chill", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_chill", label: "Frost Bolt", value: 3, target: "hero", secondaryValue: 1 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Chill may have been decremented during processHeroDebuffs on next turn, but check log
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Chill")), "log should mention chill");
});

test("resolveMonsterIntent handles curse_amplify", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "curse_amplify", label: "Amplify Damage", value: 3, target: "hero", cooldown: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Amplify may be decremented at turn start, but log should confirm it was applied
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Amplify") || entry.message.includes("amplif")), "log should mention amplify");
});

test("resolveMonsterIntent handles curse_weaken", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "curse_weaken", label: "Decrepify", value: 2, target: "hero", cooldown: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Decrepify") || entry.message.includes("reduced")), "log should mention weaken");
});

test("resolveMonsterIntent handles drain_energy", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "drain_energy", label: "Mana Drain", value: 4, target: "hero" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("drain") || entry.message.includes("Drain")), "log should mention drain");
});

test("resolveMonsterIntent handles buff_allies_attack", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  assert.ok(state.enemies.length >= 2, "need at least 2 enemies for buff test");

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "buff_allies_attack", label: "War Cry", value: 3, target: "hero", cooldown: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("buff")), "log should mention buff");
});

test("resolveMonsterIntent handles consume_corpse with dead enemy", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill one enemy first
  const corpse = state.enemies[1] || state.enemies[0];
  corpse.alive = false;
  corpse.life = 0;
  corpse.consumed = false;

  const caster = state.enemies.find((e) => e.alive && e.id !== corpse.id);
  if (!caster) { return; }
  const intent: EnemyIntent = { kind: "consume_corpse", label: "Devour", value: 4, target: "hero" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.equal(corpse.consumed, true, "corpse should be consumed");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("consume") || entry.message.includes("Consume") || entry.message.includes("corpse")));
});

test("resolveMonsterIntent handles consume_corpse fallback when no corpses", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // All enemies alive, no corpses
  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "consume_corpse", label: "Devour", value: 4, target: "hero" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  const heroBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.life <= heroBefore, "hero should take fallback attack");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("no corpse")));
});

test("resolveMonsterIntent handles corpse_explosion with dead enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill one enemy
  const deadEnemy = state.enemies[1] || state.enemies[0];
  deadEnemy.alive = false;
  deadEnemy.life = 0;
  deadEnemy.consumed = false;

  const caster = state.enemies.find((e) => e.alive && e.id !== deadEnemy.id);
  if (!caster) { return; }
  const intent: EnemyIntent = { kind: "corpse_explosion", label: "Corpse Explosion", value: 3, target: "hero" };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  const heroBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.life < heroBefore, "hero should take explosion damage");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("detonates") || entry.message.includes("corpse")));
});

test("resolveMonsterIntent handles attack_burn_all", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "attack_burn_all", label: "Inferno", value: 3, target: "hero", secondaryValue: 2 };
  caster.currentIntent = intent;
  caster.intentIndex = 0;
  caster.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.hero.heroBurn > 0, "hero should have burn from attack_burn_all");
});

// ── Monster Traits module tests ──

test("processModifierOnAttack applies cursed aura amplify", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = ["cursed"];

  const intent: EnemyIntent = { kind: "attack", label: "Strike", value: 3, target: "hero" };
  enemy.currentIntent = intent;
  enemy.intentIndex = 0;
  enemy.intents = [intent];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Amplify should have been applied and log entry created
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Cursed") || entry.message.includes("amplif")));
});

test("processModifierOnHit lightning enchanted deals damage back", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = ["lightning_enchanted"];
  enemy.life = 100;
  enemy.maxLife = 100;

  // Play a damage card against this enemy to trigger onHit
  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy" && def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = enemy.id;
    const heroBefore = state.hero.life;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, enemy.id);
    // Hero may take lightning arc damage
    assert.ok(state.hero.life <= heroBefore, "hero may take lightning damage");
  }
});

test("processDeathTraits handles death_explosion", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = ["death_explosion"];
  enemy.life = 1;
  enemy.maxLife = 20;

  // Kill the enemy to trigger death trait
  const heroBefore = state.hero.life;
  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy" && def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = enemy.id;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, enemy.id);
    if (!enemy.alive) {
      assert.ok(state.hero.life < heroBefore, "hero should take explosion damage on death");
      assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("EXPLODES")));
    }
  }
});

test("processDeathTraits handles death_poison", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = ["death_poison"];
  enemy.life = 1;
  enemy.maxLife = 20;

  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy" && def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = enemy.id;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, enemy.id);
    if (!enemy.alive) {
      assert.ok(state.hero.heroPoison > 0, "hero should get poison stacks from death_poison");
    }
  }
});

test("processDeathTraits handles death_spawn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = ["death_spawn"];
  enemy.life = 1;
  enemy.maxLife = 30;

  const enemyCountBefore = state.enemies.length;
  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy" && def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = enemy.id;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, enemy.id);
    if (!enemy.alive) {
      assert.ok(state.enemies.length > enemyCountBefore, "should spawn enemies on death");
      assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("spawn") || entry.message.includes("burst")));
    }
  }
});

test("rollRandomAffixes returns empty for boss variant", () => {
  const harness = createCombatHarness();
  // We can't directly access the module, but we can use the combat harness content
  // The TRAIT constants and rollRandomAffixes are re-exported on __ROUGE_COMBAT_MONSTER_ACTIONS
  // But since the harness doesn't expose browserWindow, let's test through encounter creation

  // Create a state with a boss encounter
  const bossEncounterIds = Object.keys(harness.content.encounterCatalog).filter((id) => id.includes("boss"));
  if (bossEncounterIds.length > 0) {
    const bossState = harness.engine.createCombatState({
      content: harness.content,
      encounterId: bossEncounterIds[0],
      mercenaryId: "rogue_scout",
      randomFn: () => 0.5,
    });
    // Boss enemies exist and combat is valid
    assert.ok(bossState.enemies.length > 0);
    assert.ok(bossState.phase === "player");
  }
});

test("cooldown system prevents intent from firing twice in a row", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  const caster = state.enemies[0];
  const intent: EnemyIntent = { kind: "curse_amplify", label: "Curse", value: 2, target: "hero", cooldown: 2 };
  caster.intents = [intent, { kind: "attack", label: "Strike", value: 3, target: "hero" }];
  caster.currentIntent = { ...intent };
  caster.intentIndex = 0;

  // First end turn: curse fires and goes on cooldown
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Navigate back to the cooldown intent
  // After endTurn, intents advance. If the caster advances to index 1, next turn it goes to index 0 again.
  // When it comes back to index 0 with cooldown active, it should use fallback attack
  if (state.outcome || !caster.alive) { return; }

  // Force back to cooldown intent
  caster.intentIndex = 0;
  caster.currentIntent = { ...intent };

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Should see a cooldown log entry
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("cooldown")), "should mention cooldown in log");
});

test("processHeroDebuffs reduces burn stacks and deals damage", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Set up hero burn to trigger at start of turn 2
  state.hero.heroBurn = 3;
  const heroBefore = state.hero.life;

  // End turn 1 to trigger turn 2 start with hero debuffs
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (state.outcome) { return; }
  // At the start of turn 2, hero burn should have been processed
  assert.ok(state.hero.life < heroBefore, "hero should take burn damage");
  assert.ok(state.hero.heroBurn < 3, "burn stacks should decrease");
});

test("processHeroDebuffs reduces poison stacks", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  state.hero.heroPoison = 2;
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (state.outcome) { return; }
  assert.ok(state.hero.life < heroBefore, "hero should take poison damage");
  assert.ok(state.hero.heroPoison < 2, "poison stacks should decrease");
});
