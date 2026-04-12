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
    encounterId?: string;
    armorProfile?: ArmorMitigationProfile | null;
    heroState?: Record<string, unknown> | null;
    mercenaryState?: Record<string, unknown> | null;
  } = {}
) {
  return h.engine.createCombatState({
    content: h.content,
    encounterId: options.encounterId || "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
    armorProfile: options.armorProfile || null,
    heroState: options.heroState || null,
    mercenaryState: options.mercenaryState || null,
  });
}

function setEnemyIntent(enemy: CombatEnemyState, intent: EnemyIntent) {
  enemy.intents = [{ ...intent }];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...intent };
}

function isolateBoss(state: CombatState) {
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);
  state.enemies = [boss];
  state.selectedEnemyId = boss.id;
  return boss;
}

function prepareForEnemyPhase(state: CombatState, guard = 120) {
  state.phase = "player" as CombatPhase;
  state.hand = [];
  state.hero.life = state.hero.maxLife;
  state.hero.guard = guard;
  state.mercenary.life = state.mercenary.maxLife;
  state.mercenary.guard = guard;
}

function passRound(h: ReturnType<typeof createHarness>, state: CombatState, guard = 120) {
  prepareForEnemyPhase(state, guard);
  const result = h.engine.endTurn(state);
  assert.equal(result.ok, true);
  return result;
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

test("act one boss opener fortifies the court, pressures the party, and advances to brood swarm", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_1_boss",
    heroState: { maxLife: 140, life: 140 },
    mercenaryState: { maxLife: 120, life: 120 },
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);
  const guardBefore = new Map(state.enemies.map((enemy) => [enemy.id, enemy.guard]));
  const heroBefore = state.hero.life;
  const mercBefore = state.mercenary.life;
  state.hand = [];

  state.phase = "player" as CombatPhase;
  const result = h.engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(state.outcome, null);
  assert.equal(state.turn, 2);
  assert.equal(state.phase, "player");
  assert.equal(boss.currentIntent.kind, "summon_minion");
  assert.ok(state.hero.life < heroBefore, "boss court opener should pressure the hero");
  assert.ok(state.mercenary.life < mercBefore, "boss court opener should pressure the mercenary");
  assert.ok(
    state.enemies.every((enemy) => enemy.guard > Number(guardBefore.get(enemy.id) || 0)),
    "boss opener should leave the full court more fortified than before the enemy phase"
  );
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("fortifies the enemy line")));
});

test("isolated act one boss progresses from brood screen into brood swarm and telegraphed poison burst", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_1_boss",
    heroState: { maxLife: 160, life: 160 },
    mercenaryState: { maxLife: 120, life: 120 },
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);
  state.enemies = [boss];
  state.selectedEnemyId = boss.id;
  state.hand = [];

  state.phase = "player" as CombatPhase;
  assert.equal(h.engine.endTurn(state).ok, true);
  assert.equal(state.turn, 2);
  assert.equal(state.outcome, null);
  assert.equal(boss.currentIntent.kind, "summon_minion");

  state.hand = [];
  state.phase = "player" as CombatPhase;
  assert.equal(h.engine.endTurn(state).ok, true);

  const minions = state.enemies.filter((enemy) => enemy.id !== boss.id);
  assert.equal(state.turn, 3);
  assert.equal(state.outcome, null);
  assert.equal(minions.length, 3);
  assert.ok(minions.every((enemy) => enemy.role === "raider"));
  assert.equal(boss.currentIntent.kind, "charge");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("spawns 3 minions")));
});

test("act one miniboss opener heals a wounded elite and advances the whole pack into follow-up scripts", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_1_branch_miniboss",
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.endsWith("_elite"));
  const support = state.enemies.find((enemy) => enemy.role === "support");
  const brute = state.enemies.find((enemy) => enemy.role === "brute" && enemy.id !== elite?.id);
  assert.ok(elite);
  assert.ok(support);
  assert.ok(brute);
  elite.life = 8;
  state.hand = [];

  state.phase = "player" as CombatPhase;
  const result = h.engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(state.turn, 2);
  assert.equal(state.outcome, null);
  assert.equal(elite.life, 12);
  assert.ok(elite.guard > 22, "elite should be fortified by its opener");
  assert.ok(brute.guard > 0, "brute should be fortified by the elite opener");
  assert.equal(elite.currentIntent.kind, "attack_and_guard");
  assert.equal(support.currentIntent.kind, "attack");
  assert.equal(brute.currentIntent.kind, "attack");
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("heals Warded Goatman for 4")));
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("fortifies the enemy line")));
});

test("act two boss cycles from shell-up opener into telegraphed burrow charge and guard break", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_2_boss",
    heroState: { maxLife: 180, life: 180 },
    mercenaryState: { maxLife: 150, life: 150 },
  });
  const boss = isolateBoss(state);

  assert.equal(boss.currentIntent.kind, "guard");

  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "charge");

  const guardAfterShell = boss.guard;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "sunder_attack");
  assert.ok(boss.guard > guardAfterShell);

  state.phase = "player" as CombatPhase;
  state.hand = [];
  state.hero.life = state.hero.maxLife;
  state.hero.guard = 120;
  state.mercenary.life = state.mercenary.maxLife;
  state.mercenary.guard = 30;
  assert.equal(h.engine.endTurn(state).ok, true);

  assert.equal(state.turn, 4);
  assert.equal(boss.currentIntent.kind, "attack");
  assert.equal(state.mercenary.guard, 0);
  assert.ok(state.mercenary.life < state.mercenary.maxLife);
});

test("act three boss telegraphs lightning nova, recovers behind the court, and then hits the full party", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_3_boss",
    heroState: { maxLife: 180, life: 180 },
    mercenaryState: { maxLife: 150, life: 150 },
  });
  const boss = isolateBoss(state);

  assert.equal(boss.currentIntent.kind, "guard_allies");

  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "charge");

  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "heal_and_guard");

  boss.life = Math.max(1, boss.life - 12);
  const woundedLife = boss.life;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "attack_lightning_all");
  assert.ok(boss.life > woundedLife);

  prepareForEnemyPhase(state);
  const heroGuardBefore = state.hero.guard;
  const mercGuardBefore = state.mercenary.guard;
  assert.equal(h.engine.endTurn(state).ok, true);

  assert.equal(state.turn, 5);
  assert.equal(boss.currentIntent.kind, "attack_lightning");
  assert.ok(state.hero.guard < heroGuardBefore);
  assert.ok(state.mercenary.guard < mercGuardBefore);
});

test("act four boss telegraphs apocalypse, burns the party, then recovers before the charge follow-up", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_4_boss",
    armorProfile: {
      resistances: [{ type: "fire", amount: 10 }],
    },
    heroState: { maxLife: 190, life: 190 },
    mercenaryState: { maxLife: 150, life: 150 },
  });
  const boss = isolateBoss(state);

  assert.equal(boss.currentIntent.kind, "guard_allies");

  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "charge");

  const guardBeforeApocalypse = boss.guard;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "attack_burn_all");
  assert.ok(boss.guard > guardBeforeApocalypse);

  prepareForEnemyPhase(state);
  const heroGuardBefore = state.hero.guard;
  const mercGuardBefore = state.mercenary.guard;
  assert.equal(h.engine.endTurn(state).ok, true);
  assert.equal(boss.currentIntent.kind, "heal_and_guard");
  assert.ok(state.hero.guard < heroGuardBefore);
  assert.ok(state.mercenary.guard < mercGuardBefore);
  assert.ok(state.log.some((entry: CombatLogEntry) => entry.message.includes("inflicts 1 Burn")));

  boss.life = Math.max(1, boss.life - 14);
  const woundedLife = boss.life;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "sunder_attack");
  assert.ok(boss.life > woundedLife);
});

test("act five boss teleports free, summons the war host, and stabilizes before the volley turn", () => {
  const h = createHarness();
  const state = createState(h, {
    encounterId: "act_5_boss",
    heroState: { maxLife: 210, life: 210 },
    mercenaryState: { maxLife: 170, life: 170 },
  });
  const boss = isolateBoss(state);
  boss.freeze = 2;
  boss.stun = 1;
  boss.paralyze = 1;

  assert.equal(boss.currentIntent.kind, "teleport");

  const openingGuard = boss.guard;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "summon_minion");
  assert.ok(boss.guard > openingGuard);
  assert.equal(boss.freeze, 0);
  assert.equal(boss.stun, 0);
  assert.equal(boss.paralyze, 0);

  const livingBeforeSummon = state.enemies.filter((enemy) => enemy.alive).length;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "heal_and_guard");
  assert.ok(state.enemies.filter((enemy) => enemy.alive).length > livingBeforeSummon);

  const woundedMinion = state.enemies.find((enemy) => enemy.id !== boss.id);
  assert.ok(woundedMinion);
  woundedMinion.life = Math.max(1, woundedMinion.life - 6);
  const minionLifeBeforeRecovery = woundedMinion.life;
  passRound(h, state);
  assert.equal(boss.currentIntent.kind, "charge");
  assert.ok(woundedMinion.life > minionLifeBeforeRecovery);
  assert.ok(boss.guard > 0);
});
