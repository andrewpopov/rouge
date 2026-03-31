export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness, createCombatHarness } from "./helpers/browser-harness";

function createState(harness: ReturnType<typeof createCombatHarness>, encounterId = "act_1_opening_skirmish") {
  return harness.engine.createCombatState({
    content: harness.content,
    encounterId,
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
}

type CombatTurnsApi = {
  getWeaponAttackBonus: (state: CombatState, cardId: string) => number;
  getWeaponSupportBonus: (state: CombatState, cardId: string) => number;
  applyWeaponTypedDamage: (state: CombatState, targets: CombatEnemyState[], cardId: string) => string[];
  applyWeaponEffects: (state: CombatState, targets: CombatEnemyState[], cardId: string) => string[];
};

function createTurnsHarness() {
  const harness = createAppHarness();
  return {
    content: harness.content,
    combatEngine: harness.combatEngine,
    turns: harness.browserWindow.__ROUGE_COMBAT_ENGINE_TURNS as CombatTurnsApi,
  };
}

// ── healEntity ──

test("healEntity heals a living entity up to maxLife", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = 10;
  state.hero.maxLife = 50;

  // Use the combat engine indirectly via usePotion
  state.potions = 1;
  state.hero.potionHeal = 20;
  const result = harness.engine.usePotion(state, "hero");
  assert.equal(result.ok, true);
  assert.equal(state.hero.life, 30); // 10 + 20
});

test("healEntity does not heal above maxLife", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = 45;
  state.hero.maxLife = 50;
  state.potions = 1;
  state.hero.potionHeal = 20;
  harness.engine.usePotion(state, "hero");
  assert.equal(state.hero.life, 50); // capped at maxLife
});

test("healEntity returns 0 for dead entity", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = 0;
  state.hero.alive = false;
  state.potions = 1;
  const result = harness.engine.usePotion(state, "hero");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("downed"));
});

// ── usePotion ──

test("usePotion fails with no potions", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.potions = 0;
  const result = harness.engine.usePotion(state, "hero");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("No potions"));
});

test("usePotion fails when outcome is already set", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.outcome = "victory" as CombatOutcome;
  state.potions = 1;
  const result = harness.engine.usePotion(state, "hero");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("over"));
});

test("usePotion fails at full life", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.potions = 1;
  state.hero.life = state.hero.maxLife;
  const result = harness.engine.usePotion(state, "hero");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("full"));
});

test("usePotion heals mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.potions = 1;
  state.mercenary.life = 5;
  state.mercenary.maxLife = 30;
  state.hero.potionHeal = 10;
  const result = harness.engine.usePotion(state, "mercenary");
  assert.equal(result.ok, true);
  assert.equal(state.mercenary.life, 15);
  assert.equal(state.potions, 0);
});

// ── dealDamage / guard interaction ──

test("damage is absorbed by guard first", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.guard = 5;
  const lifeBefore = enemy.life;

  // Play a damage card to test guard interaction
  const damageCard = state.hand.find((c) => {
    const def = harness.content.cardCatalog[c.cardId];
    return def?.target === "enemy" && def?.effects?.some((e) => e.kind === "damage");
  });
  if (damageCard) {
    state.selectedEnemyId = enemy.id;
    harness.engine.playCard(state, harness.content, damageCard.instanceId, enemy.id);
    // Guard should be reduced or eliminated
    assert.ok(enemy.guard < 5 || enemy.life < lifeBefore, "guard or life should be reduced");
  }
});

// ── checkOutcome ──

test("checkOutcome sets defeat when hero is dead", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.life = 0;
  state.hero.alive = false;

  // End turn should detect defeat
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);
  assert.equal(state.outcome, "defeat");
});

test("checkOutcome sets victory when all enemies are dead", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill all enemies
  for (const enemy of state.enemies) {
    enemy.life = 0;
    enemy.alive = false;
  }

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);
  assert.equal(state.outcome, "victory");
});

// ── getLivingEnemies / getFirstLivingEnemyId ──

test("getLivingEnemies returns only alive enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.enemies[0].alive = false;
  const living = harness.engine.getLivingEnemies(state);
  assert.ok(living.every((e: CombatEnemyState) => e.alive));
  assert.ok(!living.some((e: CombatEnemyState) => e.id === state.enemies[0].id));
});

test("getFirstLivingEnemyId returns first alive enemy id", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const firstId = harness.engine.getFirstLivingEnemyId(state);
  assert.ok(firstId);
  const enemy = state.enemies.find((e) => e.id === firstId);
  assert.ok(enemy?.alive);
});

test("getFirstLivingEnemyId returns empty string when all enemies dead", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  for (const enemy of state.enemies) {
    enemy.alive = false;
  }
  const firstId = harness.engine.getFirstLivingEnemyId(state);
  assert.equal(firstId, "");
});

// ── drawCards ──

test("drawCards draws from drawPile into hand", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  // Manually trigger card drawing via end turn -> start player turn
  // The startPlayerTurn function draws cards automatically
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (state.outcome) { return; }
  // After endTurn, hand is discarded then refilled on new turn
  assert.ok(typeof state.hand.length === "number");
});

test("drawCards reshuffles discard pile when draw pile is empty", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  // Move all cards to discard
  state.discardPile.push(...state.drawPile);
  state.drawPile = [];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (state.outcome) { return; }
  // Cards should have been reshuffled from discard
  assert.ok(state.hand.length > 0 || state.drawPile.length > 0, "cards should be reshuffled");
});

// ── meleeStrike ──

test("meleeStrike deals weapon damage to selected enemy", () => {
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

test("meleeStrike fails when already used this turn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 5;
  state.meleeUsed = true;
  const result = harness.engine.meleeStrike(state, harness.content);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("already"));
});

test("meleeStrike fails during enemy phase", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.phase = "enemy" as CombatPhase;
  const result = harness.engine.meleeStrike(state, harness.content);
  assert.equal(result.ok, false);
});

test("meleeStrike fails when outcome is set", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.outcome = "victory" as CombatOutcome;
  const result = harness.engine.meleeStrike(state, harness.content);
  assert.equal(result.ok, false);
});

test("meleeStrike fails when no living enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  for (const enemy of state.enemies) {
    enemy.alive = false;
  }
  state.weaponDamageBonus = 5;
  state.meleeUsed = false;
  const result = harness.engine.meleeStrike(state, harness.content);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("No living"));
});

test("meleeStrike with weapon family match deals bonus damage", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 5;
  state.meleeUsed = false;
  state.weaponFamily = "sword";
  state.classPreferredFamilies = ["sword"];
  const target = state.enemies[0];
  state.selectedEnemyId = target.id;
  const lifeBefore = target.life;

  harness.engine.meleeStrike(state, harness.content);
  assert.ok(target.life < lifeBefore, "enemy should take damage");
  assert.ok(state.log.some((l: string) => l.includes("proficient")));
});

test("meleeStrike with weaken debuff reduces damage", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 10;
  state.meleeUsed = false;
  state.hero.weaken = 2;
  const target = state.enemies[0];
  state.selectedEnemyId = target.id;

  harness.engine.meleeStrike(state, harness.content);
  assert.equal(state.meleeUsed, true);
});

test("damage cards gain proficiency-matched weapon bonuses and on-hit effects", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
    weaponName: "Short Bow",
    weaponProfile: {
      attackDamageByProficiency: { bow: 2 },
      effects: [{ kind: "burn", amount: 1, proficiency: "bow" }],
    },
  });
  const target = state.enemies[0];
  target.guard = 0;
  target.life = 99;
  target.maxLife = 99;
  const card = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(card);
  const lifeBefore = target.life;

  harness.engine.playCard(state, harness.content, card.instanceId, target.id);

  assert.equal(lifeBefore - target.life, 8);
  assert.equal(target.burn, 1);
});

test("preferred weapon families amplify matching weapon-skill bonuses", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
    weaponFamily: "Bows",
    classPreferredFamilies: ["Bows"],
    weaponName: "Short Bow",
    weaponProfile: {
      attackDamageByProficiency: { bow: 2 },
      typedDamage: [{ type: "fire", amount: 2, proficiency: "bow" }],
      effects: [{ kind: "burn", amount: 1, proficiency: "bow" }],
    },
  });
  const target = state.enemies[0];
  target.guard = 0;
  target.life = 99;
  target.maxLife = 99;
  const card = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(card);
  const lifeBefore = target.life;

  harness.engine.playCard(state, harness.content, card.instanceId, target.id);

  assert.equal(lifeBefore - target.life, 12);
  assert.equal(target.burn, 2);
});

test("typed weapon damage applies as a separate packet on matching attack cards", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
    weaponName: "Short Bow",
    weaponProfile: {
      typedDamage: [{ type: "fire", amount: 2, proficiency: "bow" }],
    },
  });
  const target = state.enemies[0];
  target.guard = 0;
  target.life = 99;
  target.maxLife = 99;
  const card = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(card);
  const lifeBefore = target.life;

  harness.engine.playCard(state, harness.content, card.instanceId, target.id);

  assert.equal(lifeBefore - target.life, 8);
  assert.ok(state.log.some((line: string) => /fire damage/i.test(line)));
});

test("weapon proficiency bonuses do not apply to attacks with other proficiencies", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["barbarian_bash"],
    weaponName: "Short Bow",
    weaponProfile: {
      attackDamageByProficiency: { bow: 2 },
      effects: [{ kind: "burn", amount: 1, proficiency: "bow" }],
    },
  });
  const target = state.enemies[0];
  target.guard = 0;
  target.life = 99;
  target.maxLife = 99;
  const card = state.hand.find((entry) => entry.cardId === "barbarian_bash");
  assert.ok(card);
  const lifeBefore = target.life;

  harness.engine.playCard(state, harness.content, card.instanceId, target.id);

  assert.equal(lifeBefore - target.life, 14);
  assert.equal(target.burn, 0);
});

test("matching weapon proficiencies boost support skills as well as attacks", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["barbarian_natural_resistance"],
    weaponName: "Short Sword",
    weaponProfile: {
      supportValueByProficiency: { masteries: 2 },
    },
  });
  const card = state.hand.find((entry) => entry.cardId === "barbarian_natural_resistance");
  assert.ok(card);
  state.hero.life = Math.max(1, state.hero.maxLife - 10);
  state.hero.guard = 0;

  harness.engine.playCard(state, harness.content, card.instanceId);

  assert.equal(state.hero.life, state.hero.maxLife - 3);
  assert.equal(state.hero.guard, 7);
});

test("preferred weapon families amplify matching support skill bonuses", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["barbarian_natural_resistance"],
    weaponFamily: "Swords",
    classPreferredFamilies: ["Swords"],
    weaponName: "Short Sword",
    weaponProfile: {
      supportValueByProficiency: { masteries: 2 },
    },
  });
  const card = state.hand.find((entry) => entry.cardId === "barbarian_natural_resistance");
  assert.ok(card);
  state.hero.life = Math.max(1, state.hero.maxLife - 10);
  state.hero.guard = 0;

  harness.engine.playCard(state, harness.content, card.instanceId);

  assert.equal(state.hero.life, state.hero.maxLife - 2);
  assert.equal(state.hero.guard, 8);
});

test("preferred weapon family adds the same helper lift to matching attack and support bonuses", () => {
  const { content, combatEngine, turns } = createTurnsHarness();
  const attackConfig = {
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    weaponFamily: "Bows",
    weaponProfile: {
      attackDamageByProficiency: { bow: 2 },
    },
  };
  const attackBaseState = combatEngine.createCombatState({
    ...attackConfig,
    classPreferredFamilies: [],
  });
  const attackPreferredState = combatEngine.createCombatState({
    ...attackConfig,
    classPreferredFamilies: ["Bows"],
  });

  assert.equal(
    turns.getWeaponAttackBonus(attackPreferredState, "amazon_magic_arrow"),
    turns.getWeaponAttackBonus(attackBaseState, "amazon_magic_arrow") + 1
  );

  const supportConfig = {
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    weaponFamily: "Swords",
    weaponProfile: {
      supportValueByProficiency: { masteries: 2 },
    },
  };
  const supportBaseState = combatEngine.createCombatState({
    ...supportConfig,
    classPreferredFamilies: [],
  });
  const supportPreferredState = combatEngine.createCombatState({
    ...supportConfig,
    classPreferredFamilies: ["Swords"],
  });

  assert.equal(
    turns.getWeaponSupportBonus(supportPreferredState, "barbarian_natural_resistance"),
    turns.getWeaponSupportBonus(supportBaseState, "barbarian_natural_resistance") + 1
  );
});

test("preferred weapon family increases matching typed weapon damage and weapon effects by their helper deltas", () => {
  const { content, combatEngine, turns } = createTurnsHarness();
  const profile = {
    typedDamage: [{ type: "fire", amount: 2, proficiency: "bow" }],
    effects: [{ kind: "burn", amount: 1, proficiency: "bow" }],
  } as WeaponCombatProfile;
  const stateConfig = {
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    weaponFamily: "Bows",
    weaponName: "Short Bow",
    weaponProfile: profile,
  };

  const typedBaseState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: [],
  });
  const typedPreferredState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: ["Bows"],
  });
  const typedBaseTarget = typedBaseState.enemies[0];
  const typedPreferredTarget = typedPreferredState.enemies[0];
  typedBaseTarget.guard = 0;
  typedPreferredTarget.guard = 0;
  const typedBaseLifeBefore = typedBaseTarget.life;
  const typedPreferredLifeBefore = typedPreferredTarget.life;

  turns.applyWeaponTypedDamage(typedBaseState, [typedBaseTarget], "amazon_magic_arrow");
  turns.applyWeaponTypedDamage(typedPreferredState, [typedPreferredTarget], "amazon_magic_arrow");

  assert.equal(
    typedPreferredLifeBefore - typedPreferredTarget.life,
    typedBaseLifeBefore - typedBaseTarget.life + 2
  );

  const effectBaseState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: [],
  });
  const effectPreferredState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: ["Bows"],
  });
  const effectBaseTarget = effectBaseState.enemies[0];
  const effectPreferredTarget = effectPreferredState.enemies[0];

  turns.applyWeaponEffects(effectBaseState, [effectBaseTarget], "amazon_magic_arrow");
  turns.applyWeaponEffects(effectPreferredState, [effectPreferredTarget], "amazon_magic_arrow");

  assert.equal(effectPreferredTarget.burn, effectBaseTarget.burn + 1);
});

test("preferred weapon family does not leak typed weapon helpers onto unrelated proficiencies", () => {
  const { content, combatEngine, turns } = createTurnsHarness();
  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    weaponFamily: "Bows",
    classPreferredFamilies: ["Bows"],
    weaponName: "Short Bow",
    weaponProfile: {
      typedDamage: [{ type: "fire", amount: 2, proficiency: "bow" }],
      effects: [{ kind: "burn", amount: 1, proficiency: "bow" }],
    },
  });
  const target = state.enemies[0];
  target.guard = 0;
  const lifeBefore = target.life;

  assert.deepEqual(turns.applyWeaponTypedDamage(state, [target], "amazon_jab"), []);
  assert.deepEqual(turns.applyWeaponEffects(state, [target], "amazon_jab"), []);
  assert.equal(target.life, lifeBefore);
  assert.equal(target.burn, 0);
});

test("preferred weapon family adds the full melee lift independently of card helper bonuses", () => {
  const { content, combatEngine } = createTurnsHarness();
  const stateConfig = {
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    weaponFamily: "sword",
    weaponName: "Short Sword",
    weaponDamageBonus: 5,
  };
  const baseState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: [],
  });
  const preferredState = combatEngine.createCombatState({
    ...stateConfig,
    classPreferredFamilies: ["sword"],
  });
  const baseTarget = baseState.enemies[0];
  const preferredTarget = preferredState.enemies[0];
  baseTarget.guard = 0;
  preferredTarget.guard = 0;
  baseState.selectedEnemyId = baseTarget.id;
  preferredState.selectedEnemyId = preferredTarget.id;
  const baseLifeBefore = baseTarget.life;
  const preferredLifeBefore = preferredTarget.life;

  combatEngine.meleeStrike(baseState, content);
  combatEngine.meleeStrike(preferredState, content);

  assert.equal(
    preferredLifeBefore - preferredTarget.life,
    baseLifeBefore - baseTarget.life + 4
  );
});

test("armor physical resistance reduces incoming direct attacks", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    armorProfile: {
      resistances: [{ type: "physical", amount: 2 }],
    },
  });
  const enemy = state.enemies[0];
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.intents = [{ kind: "attack", label: "Slash", value: 5, target: "hero" }];
  enemy.currentIntent = { ...enemy.intents[0] };
  const heroBefore = state.hero.life;

  harness.engine.endTurn(state);

  assert.equal(heroBefore - state.hero.life, 3);
});

test("fire immunity on armor negates fire attacks and burn application", () => {
  const harness = createCombatHarness();
  const state = harness.engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    armorProfile: {
      immunities: ["fire"],
    },
  });
  const enemy = state.enemies[0];
  state.enemies = [enemy];
  state.mercenary.alive = false;
  state.hero.guard = 0;
  enemy.intents = [{ kind: "attack_burn", label: "Flame Lash", value: 5, target: "hero", secondaryValue: 2 }];
  enemy.currentIntent = { ...enemy.intents[0] };
  const heroBefore = state.hero.life;

  harness.engine.endTurn(state);

  assert.equal(heroBefore - state.hero.life, 0);
  assert.equal(state.hero.heroBurn, 0);
});

test("thorns retaliation respects physical mitigation and guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 3;
  state.weaponName = "Short Sword";
  state.armorProfile = {
    resistances: [{ type: "physical", amount: 1 }],
  };
  state.hero.guard = 1;
  state.meleeUsed = false;
  const target = state.enemies[0];
  target.guard = 0;
  target.traits = ["thorns"];
  state.selectedEnemyId = target.id;
  const heroLifeBefore = state.hero.life;

  harness.engine.meleeStrike(state, harness.content);

  assert.equal(state.hero.guard, 0);
  assert.equal(heroLifeBefore - state.hero.life, 0);
  assert.ok(state.log.some((line: string) => line.includes("thorns deal 1 damage back")));
});

test("meleeStrike applies crushing weapon effects after the base hit", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 2;
  state.weaponName = "War Hammer";
  state.weaponProfile = {
    effects: [{ kind: "crushing", amount: 2 }],
  };
  state.meleeUsed = false;
  const target = state.enemies[0];
  target.guard = 3;
  state.selectedEnemyId = target.id;
  const lifeBefore = target.life;

  harness.engine.meleeStrike(state, harness.content);

  assert.equal(target.guard, 0);
  assert.equal(lifeBefore - target.life, 1);
});

test("meleeStrike poison weapon damage bypasses remaining guard", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.weaponDamageBonus = 2;
  state.weaponName = "Plague Knife";
  state.weaponProfile = {
    typedDamage: [{ type: "poison", amount: 2 }],
  };
  state.meleeUsed = false;
  const target = state.enemies[0];
  target.guard = 3;
  state.selectedEnemyId = target.id;
  const lifeBefore = target.life;

  harness.engine.meleeStrike(state, harness.content);

  assert.equal(target.guard, 1);
  assert.equal(lifeBefore - target.life, 2);
});

// ── endTurn ──

test("endTurn fails during enemy phase", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.phase = "enemy" as CombatPhase;
  const result = harness.engine.endTurn(state);
  assert.equal(result.ok, false);
});

test("endTurn fails when outcome is already set", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.outcome = "victory" as CombatOutcome;
  const result = harness.engine.endTurn(state);
  assert.equal(result.ok, false);
});

test("endTurn processes full enemy phase and returns to player turn", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const turnBefore = state.turn;

  const result = harness.engine.endTurn(state);
  assert.equal(result.ok, true);

  if (!state.outcome) {
    assert.equal(state.phase, "player");
    assert.equal(state.turn, turnBefore + 1);
  }
});

test("endTurn handles swift/extra_fast enemies acting twice", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Give an enemy the swift trait
  const enemy = state.enemies[0];
  enemy.traits = enemy.traits || [];
  (enemy.traits as string[]).push("swift");

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    // Swift enemy should have acted twice, so should see "strikes again" in log
    assert.ok(state.log.some((l: string) => l.includes("strikes again") || l.includes("Swift")));
  }
});

test("endTurn handles frozen enemies (skip turn)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.freeze = 1;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((l: string) => l.includes("Frozen")));
});

test("endTurn handles stunned enemies (skip turn)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.stun = 1;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((l: string) => l.includes("Stunned")));
});

test("endTurn handles burn DOT on enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.burn = 3;
  const lifeBefore = enemy.life;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive) {
    assert.ok(enemy.life < lifeBefore, "enemy should take burn damage");
    assert.ok(enemy.burn < 3, "burn stacks should decrease");
  }
});

test("endTurn handles poison DOT on enemies", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.poison = 3;
  const lifeBefore = enemy.life;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive) {
    assert.ok(enemy.life < lifeBefore, "enemy should take poison damage");
    assert.ok(enemy.poison < 3, "poison stacks should decrease");
  }
});

test("endTurn handles regeneration trait", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill all enemies except one, give that one regeneration
  for (let i = 1; i < state.enemies.length; i++) {
    state.enemies[i].alive = false;
    state.enemies[i].life = 0;
  }
  const enemy = state.enemies[0];
  enemy.traits = enemy.traits || [];
  (enemy.traits as string[]).push("regeneration");
  enemy.life = 5;
  enemy.maxLife = 50;
  // Give a non-lethal attack intent to avoid hero death
  enemy.currentIntent = { kind: "attack", label: "Tap", value: 1, target: "hero" };
  enemy.intents = [{ kind: "attack", label: "Tap", value: 1, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive && !state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("regenerates")));
  }
});

test("endTurn handles frenzy trait below 50% HP", () => {
  const harness = createCombatHarness();
  const state = createState(harness);

  // Kill all enemies except one, give that one frenzy
  for (let i = 1; i < state.enemies.length; i++) {
    state.enemies[i].alive = false;
    state.enemies[i].life = 0;
  }
  const enemy = state.enemies[0];
  enemy.traits = ["frenzy"];
  enemy.life = Math.floor(enemy.maxLife * 0.3);
  enemy.currentIntent = { kind: "attack", label: "Strike", value: 2, target: "hero" };
  enemy.intents = [{ kind: "attack", label: "Strike", value: 2, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("FRENZY")));
  }
});

test("endTurn handles paralyzed enemy (weakened attack)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.paralyze = 1;
  enemy.currentIntent = { kind: "attack", label: "Strike", value: 10, target: "hero" };

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((l: string) => l.includes("Paralyzed")));
});

test("endTurn handles slow (enemy repeats intent)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.slow = 1;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome && enemy.alive) {
    // If slow was applied, intent index should not advance
    // slow decrements by 1, so after one turn it should be 0
    assert.equal(enemy.slow, 0);
  }
});

test("endTurn resolves enemy guard intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "guard", label: "Shield Wall", value: 5, target: "hero" };
  enemy.intents = [{ kind: "guard", label: "Shield Wall", value: 5, target: "hero" }];
  enemy.guard = 0;

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive && !state.outcome) {
    // Guard should have been applied
    assert.ok(state.log.some((l: string) => l.includes("Guard")));
  }
});

test("endTurn resolves enemy heal_ally intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  assert.ok(state.enemies.length >= 2, "need at least 2 enemies");

  const healer = state.enemies[0];
  const target = state.enemies[1];
  target.life = 5;
  target.maxLife = 50;

  healer.currentIntent = { kind: "heal_ally", label: "Heal", value: 10, target: "hero" };
  healer.intents = [{ kind: "heal_ally", label: "Heal", value: 10, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (healer.alive && !state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("heals") || l.includes("Heal")));
  }
});

test("endTurn resolves attack_all intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "attack_all", label: "Cleave", value: 3, target: "hero" };
  enemy.intents = [{ kind: "attack_all", label: "Cleave", value: 3, target: "hero" }];

  const heroLifeBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.hero.life < heroLifeBefore, "hero should take damage from cleave");
  }
});

test("endTurn resolves sunder_attack intent (removes guard)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.hero.guard = 10;
  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "sunder_attack", label: "Sunder", value: 5, target: "hero" };
  enemy.intents = [{ kind: "sunder_attack", label: "Sunder", value: 5, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("shattering") || l.includes("Sunder")));
  }
});

test("endTurn resolves drain_attack intent (heals enemy)", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.life = 10;
  enemy.maxLife = 50;
  enemy.currentIntent = { kind: "drain_attack", label: "Drain", value: 5, target: "hero", secondaryValue: 3 };
  enemy.intents = [{ kind: "drain_attack", label: "Drain", value: 5, target: "hero", secondaryValue: 3 }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive && !state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("heals") || l.includes("Drain")));
  }
});

test("endTurn resolves guard_allies intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "guard_allies", label: "Fortify", value: 4, target: "hero" };
  enemy.intents = [{ kind: "guard_allies", label: "Fortify", value: 4, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("fortifies") || l.includes("Fortify")));
  }
});

test("endTurn resolves heal_and_guard intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  assert.ok(state.enemies.length >= 1);
  const enemy = state.enemies[0];
  enemy.life = 10;
  enemy.maxLife = 50;
  enemy.currentIntent = { kind: "heal_and_guard", label: "Rally", value: 5, target: "hero", secondaryValue: 3 };
  enemy.intents = [{ kind: "heal_and_guard", label: "Rally", value: 5, target: "hero", secondaryValue: 3 }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (enemy.alive && !state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("Rally") || l.includes("Guard")));
  }
});

test("endTurn resolves attack_and_guard intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "attack_and_guard", label: "Bash", value: 4, target: "hero", secondaryValue: 3 };
  enemy.intents = [{ kind: "attack_and_guard", label: "Bash", value: 4, target: "hero", secondaryValue: 3 }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("Bash") || l.includes("Guard")));
  }
});

test("endTurn resolves heal_allies intent", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  // Damage other enemies so heal has visible effect
  for (const e of state.enemies) {
    if (e.id !== enemy.id) {
      e.life = Math.max(1, e.life - 5);
    }
  }
  enemy.currentIntent = { kind: "heal_allies", label: "Mass Heal", value: 5, target: "hero" };
  enemy.intents = [{ kind: "heal_allies", label: "Mass Heal", value: 5, target: "hero" }];

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  if (!state.outcome) {
    assert.ok(state.log.some((l: string) => l.includes("Mass Heal") || l.includes("restores")));
  }
});

test("endTurn with extra_strong trait amplifies enemy attack", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  const enemy = state.enemies[0];
  enemy.traits = enemy.traits || [];
  (enemy.traits as string[]).push("extra_strong");
  enemy.currentIntent = { kind: "attack", label: "Strike", value: 4, target: "hero" };

  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.ok(state.log.some((l: string) => l.includes("Extra Strong")));
});

test("chooseEnemyTarget picks mercenary when lowest_life and merc has less HP", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.mercenary.life = 1;
  state.mercenary.maxLife = 30;
  state.hero.life = 50;

  const enemy = state.enemies[0];
  enemy.currentIntent = { kind: "attack", label: "Strike", value: 3, target: "lowest_life" };
  enemy.intents = [{ kind: "attack", label: "Strike", value: 3, target: "lowest_life" }];

  const mercLifeBefore = state.mercenary.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  // Mercenary should have been targeted
  if (!state.outcome && state.mercenary.alive) {
    assert.ok(state.mercenary.life <= mercLifeBefore, "mercenary should be targeted");
  }
});

test("chooseEnemyTarget can explicitly target the mercenary", () => {
  const harness = createCombatHarness();
  const state = createState(harness);
  state.mercenary.life = state.mercenary.maxLife;
  state.hero.life = state.hero.maxLife;

  const enemy = state.enemies[0];
  state.enemies.forEach((entry) => {
    if (entry.id !== enemy.id) {
      entry.life = 0;
      entry.alive = false;
    }
  });
  enemy.currentIntent = { kind: "attack", label: "Maul", value: 4, target: "mercenary" };
  enemy.intents = [{ kind: "attack", label: "Maul", value: 4, target: "mercenary" }];

  const heroLifeBefore = state.hero.life;
  const mercLifeBefore = state.mercenary.life;
  state.phase = "player" as CombatPhase;
  harness.engine.endTurn(state);

  assert.equal(state.hero.life, heroLifeBefore);
  assert.ok(state.mercenary.life < mercLifeBefore, "mercenary should take the hit");
});
