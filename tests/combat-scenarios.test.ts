export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createHarness() {
  const harness = createAppHarness();
  return {
    harness,
    engine: harness.combatEngine,
    content: harness.content,
    combatLog: harness.browserWindow.__ROUGE_COMBAT_LOG,
  };
}

function createState(
  h: ReturnType<typeof createHarness>,
  options: {
    armorProfile?: ArmorMitigationProfile | null;
  } = {}
) {
  return h.engine.createCombatState({
    content: h.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
    armorProfile: options.armorProfile || null,
  });
}

function setEnemyIntent(enemy: CombatEnemyState, intent: EnemyIntent) {
  enemy.intents = [{ ...intent }];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...intent };
}

test("elemental immunities negate matching attacks and statuses through a full enemy phase", () => {
  const h = createHarness();
  const state = createState(h, {
    armorProfile: {
      immunities: ["fire", "poison", "cold"],
    },
  });
  const [burnEnemy, poisonEnemy, chillEnemy] = state.enemies.slice(0, 3);
  assert.ok(burnEnemy && poisonEnemy && chillEnemy);
  state.enemies = [burnEnemy, poisonEnemy, chillEnemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  setEnemyIntent(burnEnemy, { kind: "attack_burn", label: "Flame Lash", value: 5, target: "hero", secondaryValue: 2 });
  setEnemyIntent(poisonEnemy, { kind: "attack_poison", label: "Poison Spit", value: 4, target: "hero", secondaryValue: 2 });
  setEnemyIntent(chillEnemy, { kind: "attack_chill", label: "Frost Bolt", value: 3, target: "hero", secondaryValue: 1 });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);

  assert.equal(state.turn, 2);
  assert.equal(state.hero.life, heroBefore);
  assert.equal(state.hero.heroBurn, 0);
  assert.equal(state.hero.heroPoison, 0);
  assert.equal(state.hero.chill, 0);
  assert.equal(state.outcome, null);
});

test("burn and poison scenarios tick through turn start, respect resistance, and decay correctly", () => {
  const h = createHarness();
  const state = createState(h, {
    armorProfile: {
      resistances: [
        { type: "fire", amount: 2 },
        { type: "poison", amount: 1 },
      ],
    },
  });
  const [burnEnemy, poisonEnemy] = state.enemies.slice(0, 2);
  assert.ok(burnEnemy && poisonEnemy);
  state.enemies = [burnEnemy, poisonEnemy];
  state.mercenary.alive = false;
  state.hero.guard = 8;
  setEnemyIntent(burnEnemy, { kind: "attack_burn", label: "Flame Lash", value: 0, target: "hero", secondaryValue: 3 });
  setEnemyIntent(poisonEnemy, { kind: "attack_poison", label: "Poison Spit", value: 0, target: "hero", secondaryValue: 2 });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);

  assert.equal(state.turn, 2);
  assert.equal(heroBefore - state.hero.life, 2);
  assert.equal(state.hero.guard, 0);
  assert.equal(state.hero.heroBurn, 2);
  assert.equal(state.hero.heroPoison, 1);
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Burn damage")));
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Poison damage")));
});

test("fatal turn-start burn ends combat before a new hand is drawn", () => {
  const h = createHarness();
  const state = createState(h);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.life = 2;
  state.hero.guard = 10;
  state.hero.heroBurn = 3;
  setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0, target: "hero" });

  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);

  assert.equal(state.outcome, "defeat");
  assert.equal(state.phase, "defeat");
  assert.equal(state.hero.alive, false);
  assert.equal(state.hand.length, 0);
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Burn damage")));
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("Encounter lost")));
  assert.ok(!state.log.some((entry: CombatLogEntry) => entry.action === "turn_start" && entry.turn === 2));
});

test("attack_all pressure still hits the whole party even while taunt and fade are active", () => {
  const h = createHarness();
  const state = createState(h);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.hero.guard = 0;
  state.mercenary.guard = 0;
  state.tauntTarget = "mercenary";
  state.tauntTurnsRemaining = 2;
  state.heroFade = 1;
  setEnemyIntent(enemy, { kind: "attack_all", label: "Volley", value: 5, target: "all_allies" });
  const heroBefore = state.hero.life;
  const mercBefore = state.mercenary.life;

  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);

  assert.ok(state.hero.life < heroBefore, "hero should still take attack_all damage");
  assert.ok(state.mercenary.life < mercBefore, "mercenary should still take attack_all damage");
});
