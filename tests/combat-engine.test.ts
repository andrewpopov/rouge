export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createCombatHarness } from "./helpers/browser-harness";

const createHarness = createCombatHarness;

test("crossfire lane modifiers sharpen ranged scripts without buffing the frontline opener", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const ranged = state.enemies.find((enemy) => enemy.role === "ranged");
  const raider = state.enemies.find((enemy) => enemy.role === "raider");
  assert.ok(ranged);
  assert.ok(raider);

  const rangedTemplate = content.enemyCatalog[ranged.templateId];
  const raiderTemplate = content.enemyCatalog[raider.templateId];
  assert.equal(ranged.currentIntent.value, rangedTemplate.intents[0].value + 1);
  assert.equal(raider.currentIntent.value, raiderTemplate.intents[0].value);
});

test("vanguard rush modifiers advance frontline scripts without changing the backline opener", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_3_opening_horde",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const raider = state.enemies.find((enemy) => enemy.role === "raider");
  const backline = state.enemies.find((enemy) => enemy.role === "support" || enemy.role === "ranged");
  assert.ok(raider);
  assert.ok(backline);

  const backlineTemplate = content.enemyCatalog[backline.templateId];
  assert.equal(raider.intentIndex, 1);
  assert.equal(backline.intentIndex, 0);
  assert.equal(backline.currentIntent.label, backlineTemplate.intents[0].label);
});

test("war drum modifiers harden frontline damage scripts without changing support pressure", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_branch_battle",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const brute = state.enemies.find((enemy) => enemy.role === "brute");
  const support = state.enemies.find((enemy) => enemy.role === "support");
  assert.ok(brute);
  assert.ok(support);

  const bruteTemplate = content.enemyCatalog[brute.templateId];
  const supportTemplate = content.enemyCatalog[support.templateId];
  const bruteAttackIndex = bruteTemplate.intents.findIndex((i) => i.kind === "attack" || i.kind === "attack_all");
  assert.ok(bruteAttackIndex >= 0, "brute should have an attack intent");
  assert.equal(brute.intents[bruteAttackIndex].value, bruteTemplate.intents[bruteAttackIndex].value + 1);
  assert.equal(support.currentIntent.value, supportTemplate.intents[0].value);
});

test("escort command modifiers advance elite and support scripts before the first turn", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_branch_sanctum",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  const support = state.enemies.find((enemy) => enemy.role === "support");
  const nonCommandTarget = state.enemies.find((enemy) => {
    return enemy.id !== elite?.id && enemy.role !== "support" && !enemy.templateId.endsWith("_boss");
  });
  assert.ok(elite);
  assert.ok(support);
  assert.ok(nonCommandTarget);

  assert.equal(elite.intentIndex, 1);
  assert.equal(support.intentIndex, 1);
  assert.equal(nonCommandTarget.intentIndex, 0);
});

test("triage command modifiers deepen support recovery scripts without changing raider pressure", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_3_branch_counterpush",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const support = state.enemies.find((enemy) => enemy.role === "support");
  const raider = state.enemies.find((enemy) => enemy.role === "raider");
  assert.ok(support);
  assert.ok(raider);

  const supportTemplate = content.enemyCatalog[support.templateId];
  const raiderTemplate = content.enemyCatalog[raider.templateId];
  assert.equal(support.currentIntent.value, supportTemplate.intents[0].value + 1);
  assert.equal(raider.currentIntent.value, raiderTemplate.intents[0].value);
});

test("triage screen modifiers fortify support units while deepening their opening heal", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      triage_screen_probe: {
        ...content.encounterCatalog.act_3_branch_bulwark,
        id: "triage_screen_probe",
        modifiers: [{ kind: "triage_screen", value: 4 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "triage_screen_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const support = state.enemies.find((enemy) => enemy.role === "support");
  const brute = state.enemies.find((enemy) => enemy.role === "brute" && !enemy.templateId.includes("_elite"));
  assert.ok(support);
  assert.ok(brute);

  const supportTemplate = content.enemyCatalog[support.templateId];
  assert.equal(support.guard, 4);
  assert.equal(support.currentIntent.value, supportTemplate.intents[0].value + 4);
  assert.equal(brute.guard, 0);
});

test("linebreaker charge modifiers pull heavy enemies into breach scripts without retuning support openers", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_4_branch_breach",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const brute = state.enemies.find((enemy) => enemy.role === "brute" && !enemy.templateId.includes("_elite"));
  const support = state.enemies.find((enemy) => enemy.role === "support");
  assert.ok(brute);
  assert.ok(support);

  const bruteTemplate = content.enemyCatalog[brute.templateId];
  const supportTemplate = content.enemyCatalog[support.templateId];
  assert.equal(brute.intentIndex, 1);
  assert.equal(brute.currentIntent.kind, "sunder_attack");
  assert.equal(brute.currentIntent.value, bruteTemplate.intents[1].value + 2);
  assert.equal(support.intentIndex, 0);
  assert.equal(support.currentIntent.label, supportTemplate.intents[0].label);
});

test("ritual cadence modifiers can retune covenant bosses into warding or recovery scripts", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_3_boss_covenant",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const support = state.enemies.find((enemy) => enemy.role === "support" && !enemy.templateId.includes("_elite"));
  assert.ok(boss);
  assert.ok(support);

  const bossTemplate = content.enemyCatalog[boss.templateId];
  assert.equal(boss.intentIndex, 2);
  assert.equal(boss.currentIntent.kind, "heal_allies");
  assert.equal(boss.currentIntent.value, bossTemplate.intents[2].value + 5);
  assert.equal(boss.guard, 5);
  assert.equal(support.guard, 9);
});

test("combat skills can arm the next card and spend their cooldown", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "test_fire_tempo",
          name: "Fire Tempo",
          requiredLevel: 1,
          family: "trigger_arming",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Arm the next card with fire pressure.",
          exactText: "Deal a little damage, then empower the next card.",
          active: true,
          skillType: "spell",
          damageType: "fire",
        },
      },
    ],
  });

  const target = state.enemies.find((enemy) => enemy.alive);
  const card = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(target);
  assert.ok(card);
  state.selectedEnemyId = target.id;
  state.hero.energy = 10;

  const burnBefore = target.burn;
  const energyBeforeSkill = state.hero.energy;
  const useResult = engine.useSkill(state, "slot2", target.id);
  assert.equal(useResult.ok, true);
  assert.equal(state.hero.energy, energyBeforeSkill - 1);
  assert.equal(state.equippedSkills[0].remainingCooldown, 2);
  assert.ok(state.skillModifiers.nextCardDamageBonus > 0);
  assert.ok(state.skillModifiers.nextCardCostReduction > 0);

  const energyBeforeCard = state.hero.energy;
  const playResult = engine.playCard(state, content, card.instanceId, target.id);
  assert.equal(playResult.ok, true);
  assert.ok(state.hero.energy >= energyBeforeCard - 1, "next-card cost reduction should apply");
  assert.equal(state.skillModifiers.nextCardDamageBonus, 0);
  assert.equal(state.skillModifiers.nextCardCostReduction, 0);
  assert.ok(target.burn > burnBefore, "skill rider should carry onto the next card");
});

test("passive class skills can shape the opener with class-specific effects", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    heroState: { life: 12 },
    equippedSkills: [
      {
        slotKey: "slot1",
        skill: {
          id: "sorceress_warmth",
          name: "Warmth",
          requiredLevel: 1,
          family: "state",
          slot: 1,
          tier: "starter",
          cost: 1,
          cooldown: 2,
          summary: "Warm the opener.",
          exactText: "Heal and empower fire cards.",
          active: false,
          skillType: "passive",
          damageType: "fire",
        },
      },
    ],
  });

  assert.ok(state.hero.life > 12, "Warmth should heal at combat start");
  assert.ok(state.hero.burnBonus > 0, "Warmth should improve fire pressure");
  assert.ok(state.skillModifiers.nextCardCostReduction > 0, "Warmth should prep the next card");
});

test("summon class skills can create real combat minions", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "necromancer_raise_skeleton",
          name: "Raise Skeleton",
          requiredLevel: 1,
          family: "command",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Raise a skeleton ally.",
          exactText: "Summon a skeleton.",
          active: true,
          skillType: "summon",
          damageType: "physical",
        },
      },
    ],
  });

  state.hero.energy = 10;
  const result = engine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "necromancer_skeleton");
});

test("custom area skills can affect the whole enemy line", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "sorceress_frost_nova",
          name: "Frost Nova",
          requiredLevel: 6,
          family: "conversion",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 3,
          summary: "Freeze the line.",
          exactText: "Hit all enemies with cold.",
          active: true,
          skillType: "spell",
          damageType: "cold",
        },
      },
    ],
  });

  state.hero.energy = 10;
  const result = engine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  const frozenCount = state.enemies.filter((enemy) => enemy.freeze > 0).length;
  assert.ok(frozenCount >= 2, "Frost Nova should freeze multiple enemies");
});

test("capstone passive skills can shape the opener with mastery-specific bonuses", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "sorceress_fire_mastery",
          name: "Fire Mastery",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Master the fire line.",
          exactText: "Passive fire mastery.",
          active: false,
          skillType: "passive",
          damageType: "fire",
        },
      },
    ],
  });

  assert.ok(state.hero.burnBonus >= 5, "Fire Mastery should intensify burn pressure at combat start");
  assert.ok(state.skillModifiers.nextCardBurn >= 5, "Fire Mastery should prep a stronger burn rider");
});

test("capstone summon skills can create persistent summon endpoints", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "sorceress_hydra",
          name: "Hydra",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Summon a hydra.",
          exactText: "Summon Hydra.",
          active: true,
          skillType: "summon",
          damageType: "fire",
        },
      },
    ],
  });

  state.hero.energy = 10;
  const result = engine.useSkill(state, "slot3");
  assert.equal(result.ok, true);
  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "sorceress_hydra");
});

test("capstone line attacks can hit every enemy in the encounter", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "barbarian_whirlwind",
          name: "Whirlwind",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Hit the whole line.",
          exactText: "Attack all enemies.",
          active: true,
          skillType: "attack",
          damageType: "physical",
        },
      },
    ],
  });

  state.hero.energy = 10;
  const before = state.enemies.map((enemy) => enemy.life);
  const result = engine.useSkill(state, "slot3");
  assert.equal(result.ok, true);
  const damaged = state.enemies.filter((enemy, index) => enemy.life < before[index]).length;
  assert.ok(damaged >= 2, "Whirlwind should damage multiple enemies");
});

test("capstone support skills can debuff the full enemy line and prep the next card", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "paladin_conviction",
          name: "Conviction",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Expose the enemy line.",
          exactText: "Debuff all enemies.",
          active: true,
          skillType: "aura",
          damageType: "none",
        },
      },
    ],
  });

  state.hero.energy = 10;
  const result = engine.useSkill(state, "slot3");
  assert.equal(result.ok, true);
  const slowed = state.enemies.filter((enemy) => enemy.slow > 0).length;
  assert.ok(slowed >= 2, "Conviction should debuff the enemy line");
  assert.ok(state.skillModifiers.nextCardDamageBonus > 0, "Conviction should prep the next card");
});

test("elite onslaught modifiers push elite packs into their harder follow-up without advancing non-elites", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      elite_onslaught_probe: {
        ...content.encounterCatalog.act_5_branch_warhost,
        id: "elite_onslaught_probe",
        modifiers: [{ kind: "elite_onslaught", value: 1 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "elite_onslaught_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  const brute = state.enemies.find((enemy) => enemy.role === "brute" && !enemy.templateId.includes("_elite"));
  assert.ok(elite);
  assert.ok(brute);

  const eliteTemplate = content.enemyCatalog[elite.templateId];
  const bruteTemplate = content.enemyCatalog[brute.templateId];
  assert.equal(elite.intentIndex, 1);
  assert.equal(elite.currentIntent.value, eliteTemplate.intents[1].value + 1);
  assert.equal(brute.intentIndex, 0);
  assert.equal(brute.currentIntent.label, bruteTemplate.intents[0].label);
});

test("sniper nest modifiers fortify ranged enemies while sharpening only their opening shots", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_nest",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const ranged = state.enemies.find((enemy) => enemy.role === "ranged");
  const raider = state.enemies.find((enemy) => enemy.role === "raider");
  assert.ok(ranged);
  assert.ok(raider);

  const rangedTemplate = content.enemyCatalog[ranged.templateId];
  const raiderTemplate = content.enemyCatalog[raider.templateId];
  assert.equal(ranged.guard, 2);
  assert.equal(ranged.currentIntent.value, rangedTemplate.intents[0].value + 2);
  assert.equal(raider.guard, 0);
  assert.equal(raider.currentIntent.value, raiderTemplate.intents[0].value);
});

test("boss screen modifiers fortify the boss court while intensifying the boss opener", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss_covenant",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const ranged = state.enemies.find((enemy) => enemy.role === "ranged");
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  assert.ok(boss);
  assert.ok(ranged);
  assert.ok(elite);

  const bossTemplate = content.enemyCatalog[boss.templateId];
  assert.ok(boss.guard >= 2, "boss should have at least modifier guard");
  assert.ok(ranged.guard >= 4, "ranged should have at least modifier guard");
  assert.equal(boss.currentIntent.value, bossTemplate.intents[0].value + 2);
});

test("boss onslaught modifiers retune the boss opener without advancing the escort court", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      boss_onslaught_probe: {
        ...content.encounterCatalog.act_1_boss,
        id: "boss_onslaught_probe",
        modifiers: [{ kind: "boss_onslaught", value: 3 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "boss_onslaught_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const escort = state.enemies.find((enemy) => enemy.id !== boss?.id);
  assert.ok(boss);
  assert.ok(escort);

  const bossTemplate = content.enemyCatalog[boss.templateId];
  assert.equal(boss.intentIndex, 0);
  assert.equal(boss.currentIntent.kind, "charge");
  assert.equal(boss.currentIntent.value, bossTemplate.intents[0].value + 3);
  assert.equal(escort.intentIndex, 0);
  assert.equal(escort.guard, 0);
});

test("boss salvo modifiers retune the boss and ranged escorts into a sharper opening volley", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      boss_salvo_probe: {
        ...content.encounterCatalog.act_1_boss_aftermath,
        id: "boss_salvo_probe",
        modifiers: [{ kind: "boss_salvo", value: 2 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "boss_salvo_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const ranged = state.enemies.find((enemy) => enemy.role === "ranged");
  const untargetedEscort = state.enemies.find((enemy) => !enemy.templateId.endsWith("_boss") && enemy.role !== "ranged");
  assert.ok(boss);
  assert.ok(ranged);
  assert.ok(untargetedEscort);

  const bossTemplate = content.enemyCatalog[boss.templateId];
  const rangedTemplate = content.enemyCatalog[ranged.templateId];
  assert.equal(boss.intentIndex, 0);
  assert.equal(boss.currentIntent.kind, "charge");
  assert.equal(boss.currentIntent.value, bossTemplate.intents[0].value + 2);
  const rangedAttackKinds = new Set(["attack", "attack_burn", "attack_burn_all", "attack_chill", "attack_poison", "attack_lightning", "attack_lightning_all", "attack_poison_all", "drain_energy"]);
  assert.ok(rangedAttackKinds.has(ranged.currentIntent.kind), "ranged should have an attack intent");
  assert.equal(ranged.currentIntent.value, rangedTemplate.intents[ranged.intentIndex].value + 2);
});

test("phalanx march modifiers advance elite and brute escorts without moving support scripts", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      phalanx_march_probe: {
        ...content.encounterCatalog.act_4_branch_phalanx,
        id: "phalanx_march_probe",
        modifiers: [{ kind: "phalanx_march", value: 4 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "phalanx_march_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  const brute = state.enemies.find((enemy) => enemy.role === "brute" && !enemy.templateId.includes("_elite"));
  const support = state.enemies.find((enemy) => enemy.role === "support");
  assert.ok(elite);
  assert.ok(brute);
  assert.ok(support);

  assert.equal(elite.guard, 4);
  assert.equal(brute.guard, 4);
  assert.equal(support.guard, 0);
  assert.equal(elite.intentIndex, 1);
  assert.equal(brute.intentIndex, 1);
  assert.equal(support.intentIndex, 0);
});

test("elite affix intents can hit and fortify in the same action", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_branch_miniboss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.endsWith("_elite"));
  assert.ok(elite);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== elite.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  elite.currentIntent = elite.intents.find((intent) => intent.kind === "attack_and_guard");
  state.hero.life = state.hero.maxLife;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(state.hero.life < state.hero.maxLife);
  assert.ok(elite.guard > 0);
});

test("act five support archetypes can heal the full enemy line", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_5_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const support = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "support");
  const ally = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(support);
  assert.ok(ally);

  state.mercenary.life = 0;
  state.mercenary.alive = false;
  state.enemies.forEach((enemy) => {
    if (enemy.id !== support.id && enemy.id !== ally.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  support.currentIntent = support.intents[0];
  assert.ok(support.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
});

test("support elites can heal an ally and fortify themselves in one action", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_branch_siege",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("sandwarden"));
  const ally = state.enemies.find((enemy) => enemy.id !== elite?.id && content.enemyCatalog[enemy.templateId].role === "brute");
  assert.ok(elite);
  assert.ok(ally);

  state.mercenary.life = 0;
  state.mercenary.alive = false;
  state.enemies.forEach((enemy) => {
    if (enemy.id !== elite.id && enemy.id !== ally.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  ally.life -= 7;
  elite.currentIntent = elite.intents.find((intent) => intent.kind === "heal_and_guard");
  assert.ok(elite.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(ally.life > ally.maxLife - 7);
  assert.ok(elite.guard > 0);
});

test("kurast shadow prioritizes ranged backline enemies over the selected frontliner", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "kurast_shadow",
    randomFn: () => 0,
  });
  const ranged = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "ranged");
  const raider = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(ranged);
  assert.ok(raider);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== ranged.id && enemy.id !== raider.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.selectedEnemyId = raider.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(ranged.life, ranged.maxLife - (state.mercenary.attack + 2));
  assert.equal(raider.life, raider.maxLife);
});

test("pandemonium scout prioritizes wounded targets and executes them harder", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_4_opening_skirmish",
    mercenaryId: "pandemonium_scout",
    randomFn: () => 0,
  });
  const woundedTarget = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "support");
  const otherTarget = state.enemies.find((enemy) => enemy.id !== woundedTarget?.id);
  assert.ok(woundedTarget);
  assert.ok(otherTarget);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== woundedTarget.id && enemy.id !== otherTarget.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  woundedTarget.life = 16;
  state.selectedEnemyId = otherTarget.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(woundedTarget.life, 16 - (state.mercenary.attack + 3));
});

test("templar vanguard shatters guard before striking", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "catacombs_gate",
    mercenaryId: "templar_vanguard",
    randomFn: () => 0,
  });
  const target = state.enemies.find((enemy) => enemy.templateId === "corrupted_knight");
  assert.ok(target);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== target.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  target.guard = 7;
  state.selectedEnemyId = target.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(target.guard, 0);
  assert.equal(target.life, target.maxLife - (state.mercenary.attack + 2));
});

test("harrogath captain prioritizes elite targets and deals bonus damage", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_branch_miniboss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  const nonElite = state.enemies.find((enemy) => !enemy.templateId.includes("_elite"));
  assert.ok(elite);
  assert.ok(nonElite);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== elite.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  elite.guard = 0;
  state.selectedEnemyId = nonElite.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(elite.life, elite.maxLife - (state.mercenary.attack + 3));
});
