export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createCombatHarness } from "./helpers/browser-harness";

function createState(
  harness: ReturnType<typeof createCombatHarness>,
  options: {
    encounterId?: string;
    armorProfile?: ArmorMitigationProfile | null;
    starterDeck?: string[] | null;
  } = {}
) {
  return harness.engine.createCombatState({
    content: harness.content,
    encounterId: options.encounterId || "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    armorProfile: options.armorProfile || null,
    starterDeck: options.starterDeck || null,
  });
}

function setEnemyIntent(enemy: CombatEnemyState, intent: EnemyIntent) {
  enemy.intents = [{ ...intent }];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...intent };
}

function getRuntimeCardEffectKinds(content: GameContent) {
  const kinds = new Set<string>();
  Object.values(content.cardCatalog).forEach((card) => {
    (card.effects || []).forEach((effect) => {
      kinds.add(effect.kind);
    });
  });
  return Array.from(kinds).sort();
}

function getHandledCardEffectKindsFromSource() {
  const source = fs.readFileSync("src/combat/card-effects.ts", "utf8");
  return new Set(Array.from(source.matchAll(/effect\.kind === "([^"]+)"/g), (match) => match[1]));
}

function findRepresentativeCard(content: GameContent, effectKind: string) {
  return Object.values(content.cardCatalog)
    .filter((card) => (card.effects || []).some((effect) => effect.kind === effectKind))
    .sort((left, right) => {
      const targetBias = left.target === "none" ? -1 : 1;
      const otherTargetBias = right.target === "none" ? -1 : 1;
      if (targetBias !== otherTargetBias) {
        return targetBias - otherTargetBias;
      }
      const effectDelta = Number(left.effects?.length || 0) - Number(right.effects?.length || 0);
      if (effectDelta !== 0) {
        return effectDelta;
      }
      return Number(left.cost || 0) - Number(right.cost || 0);
    })[0] || null;
}

test("live runtime card effect kinds stay supported by the combat card resolver", () => {
  const harness = createCombatHarness();
  const runtimeKinds = getRuntimeCardEffectKinds(harness.content);
  const handledKinds = getHandledCardEffectKindsFromSource();
  const unsupported = runtimeKinds.filter((kind) => !handledKinds.has(kind));

  assert.deepEqual(unsupported, [], `unsupported runtime card effect kinds: ${unsupported.join(", ")}`);
});

test("representative cards for every live effect kind play successfully through the combat engine", () => {
  const harness = createCombatHarness();
  const failures: string[] = [];

  getRuntimeCardEffectKinds(harness.content).forEach((effectKind) => {
    const card = findRepresentativeCard(harness.content, effectKind);
    if (!card) {
      failures.push(`${effectKind}: no representative card found`);
      return;
    }
    const state = createState(harness);
    const target = state.enemies.find((enemy) => enemy.alive) || null;
    state.hand = [{ instanceId: `test_${effectKind}`, cardId: card.id }];
    state.hero.energy = 99;
    state.hero.guard = 0;
    state.hero.life = Math.max(1, state.hero.maxLife - 10);
    state.mercenary.guard = 0;
    state.mercenary.life = Math.max(1, state.mercenary.maxLife - 10);
    state.enemies.forEach((enemy) => {
      enemy.guard = 0;
    });

    const result = harness.engine.playCard(
      state,
      harness.content,
      `test_${effectKind}`,
      card.target === "enemy" ? target?.id || "" : ""
    );
    if (!result?.ok) {
      failures.push(`${effectKind}: ${card.id} failed with "${result?.message || "unknown error"}"`);
    }
  });

  assert.deepEqual(failures, []);
});

test("enemy burn ticks through guard and decays once per enemy turn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.life = 40;
  enemy.maxLife = 40;
  enemy.guard = 1;
  enemy.burn = 2;
  setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0 });

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(enemy.life, 39);
  assert.equal(enemy.guard, 0);
  assert.equal(enemy.burn, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(enemy.life, 38);
  assert.equal(enemy.burn, 0);
});

test("enemy poison bypasses guard and decays once per enemy turn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.life = 40;
  enemy.maxLife = 40;
  enemy.guard = 6;
  enemy.poison = 2;
  setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0 });

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(enemy.life, 38);
  assert.equal(enemy.guard, 6);
  assert.equal(enemy.poison, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(enemy.life, 37);
  assert.equal(enemy.poison, 0);
});

test("freeze stacks skip multiple enemy phases before expiring", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.freeze = 2;
  setEnemyIntent(enemy, { kind: "attack", label: "Strike", value: 5, target: "hero" });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.life, heroBefore);
  assert.equal(enemy.freeze, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.life, heroBefore);
  assert.equal(enemy.freeze, 0);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 5);
});

test("stun is consumed by a single skipped enemy phase even when overapplied", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.stun = 2;
  setEnemyIntent(enemy, { kind: "attack", label: "Strike", value: 5, target: "hero" });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.life, heroBefore);
  assert.equal(enemy.stun, 0);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 5);
});

test("slow repeats the current enemy intent for each stack before intent advancement resumes", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.slow = 2;
  enemy.intents = [
    { kind: "attack", label: "Jab", value: 4, target: "hero" },
    { kind: "attack", label: "Heavy Swing", value: 9, target: "hero" },
  ];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...enemy.intents[0] };
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 4);
  assert.equal(enemy.slow, 1);
  assert.equal(enemy.currentIntent.value, 4);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 8);
  assert.equal(enemy.slow, 0);
  assert.equal(enemy.currentIntent.value, 4);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 12);
  assert.equal(enemy.currentIntent.value, 9);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 21);
});

test("paralyze weakens attacks for each remaining stack and then clears", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.paralyze = 2;
  setEnemyIntent(enemy, { kind: "attack", label: "Strike", value: 9, target: "hero" });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 4);
  assert.equal(enemy.paralyze, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 8);
  assert.equal(enemy.paralyze, 0);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 17);
});

test("hero burn and poison stacks tick at turn start for each stack and ignore guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  assert.ok(enemy);
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 99;
  state.hero.heroBurn = 2;
  state.hero.heroPoison = 2;
  setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0 });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 4);
  assert.equal(state.hero.guard, 0);
  assert.equal(state.hero.heroBurn, 1);
  assert.equal(state.hero.heroPoison, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 6);
  assert.equal(state.hero.heroBurn, 0);
  assert.equal(state.hero.heroPoison, 0);
});

test("chill and energy drain stacks reduce the next two player turns and then expire", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const [chiller, drainerA, drainerB] = state.enemies.slice(0, 3);
  assert.ok(chiller && drainerA && drainerB);
  state.enemies = [chiller, drainerA, drainerB];
  state.mercenary.alive = false;
  chiller.intents = [{ kind: "attack_chill", label: "Frost Bolt", value: 0, target: "hero", secondaryValue: 2 }];
  chiller.intentIndex = 0;
  chiller.currentIntent = { ...chiller.intents[0] };
  drainerA.intents = [{ kind: "drain_energy", label: "Mana Drain", value: 0, target: "hero" }];
  drainerA.intentIndex = 0;
  drainerA.currentIntent = { ...drainerA.intents[0] };
  drainerB.intents = [{ kind: "drain_energy", label: "Mana Drain", value: 0, target: "hero" }];
  drainerB.intentIndex = 0;
  drainerB.currentIntent = { ...drainerB.intents[0] };

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.turn, 2);
  assert.equal(state.hero.energy, state.hero.maxEnergy - 1);
  assert.equal(state.hand.length, Math.max(0, state.hero.handSize - 1));
  assert.equal(state.hero.chill, 2);
  assert.equal(state.hero.energyDrain, 2);

  state.enemies.forEach((enemy) => setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0 }));
  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.turn, 3);
  assert.equal(state.hero.energy, state.hero.maxEnergy - 1);
  assert.equal(state.hand.length, Math.max(0, state.hero.handSize - 1));
  assert.equal(state.hero.chill, 1);
  assert.equal(state.hero.energyDrain, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.turn, 4);
  assert.equal(state.hero.energy, state.hero.maxEnergy);
  assert.equal(state.hand.length, state.hero.handSize);
  assert.equal(state.hero.chill, 0);
  assert.equal(state.hero.energyDrain, 0);
});

test("amplify from enemy curses boosts the current and next enemy phase, then expires", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const [casterA, casterB, striker] = state.enemies.slice(0, 3);
  assert.ok(casterA && casterB && striker);
  state.enemies = [casterA, casterB, striker];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  state.enemies.forEach((enemy) => {
    enemy.traits = [];
  });
  setEnemyIntent(casterA, { kind: "curse_amplify", label: "Amplify Damage", value: 1, target: "hero" });
  setEnemyIntent(casterB, { kind: "curse_amplify", label: "Amplify Damage", value: 1, target: "hero" });
  setEnemyIntent(striker, { kind: "attack", label: "Strike", value: 4, target: "hero" });
  const heroBefore = state.hero.life;

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 6);
  assert.equal(state.hero.amplify, 2);

  state.enemies.forEach((enemy) => setEnemyIntent(enemy, { kind: "attack", label: "Strike", value: enemy.id === striker.id ? 4 : 0, target: "hero" }));
  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 12);
  assert.equal(state.hero.amplify, 1);

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(heroBefore - state.hero.life, 16);
  assert.equal(state.hero.amplify, 0);
});

test("weaken from enemy curses reduces the next two player turns and then clears", () => {
  const harness = createCombatHarness();
  const baseline = createState(harness);
  const baselineTarget = baseline.enemies[0];
  assert.ok(baselineTarget);
  baseline.enemies = [baselineTarget];
  baseline.mercenary.alive = false;
  baseline.weaponDamageBonus = 10;
  baseline.selectedEnemyId = baselineTarget.id;
  baselineTarget.life = 50;
  baselineTarget.maxLife = 50;
  baselineTarget.guard = 0;
  const baselineLifeBefore = baselineTarget.life;
  assert.equal(harness.engine.meleeStrike(baseline, harness.content).ok, true);
  const baselineDamage = baselineLifeBefore - baselineTarget.life;

  const state = createState(harness);
  const [curserA, curserB, target] = state.enemies.slice(0, 3);
  assert.ok(curserA && curserB && target);
  state.enemies = [curserA, curserB, target];
  state.mercenary.alive = false;
  state.weaponDamageBonus = 10;
  state.selectedEnemyId = target.id;
  target.life = 50;
  target.maxLife = 50;
  target.guard = 0;
  state.enemies.forEach((enemy) => {
    enemy.traits = [];
  });
  setEnemyIntent(curserA, { kind: "curse_weaken", label: "Decrepify", value: 1, target: "hero" });
  setEnemyIntent(curserB, { kind: "curse_weaken", label: "Decrepify", value: 1, target: "hero" });
  setEnemyIntent(target, { kind: "guard", label: "Brace", value: 0 });

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.weaken, 2);

  const turnTwoLifeBefore = target.life;
  assert.equal(harness.engine.meleeStrike(state, harness.content).ok, true);
  assert.equal(turnTwoLifeBefore - target.life, Math.max(1, Math.floor(baselineDamage * 0.7)));

  state.enemies.forEach((enemy) => setEnemyIntent(enemy, { kind: "guard", label: "Brace", value: 0 }));
  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.weaken, 1);

  const turnThreeLifeBefore = target.life;
  assert.equal(harness.engine.meleeStrike(state, harness.content).ok, true);
  assert.equal(turnThreeLifeBefore - target.life, Math.max(1, Math.floor(baselineDamage * 0.7)));

  state.phase = "player" as CombatPhase;
  assert.equal(harness.engine.endTurn(state).ok, true);
  assert.equal(state.hero.weaken, 0);

  const turnFourLifeBefore = target.life;
  assert.equal(harness.engine.meleeStrike(state, harness.content).ok, true);
  assert.equal(turnFourLifeBefore - target.life, baselineDamage);
});
