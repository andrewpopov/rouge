export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createAppHarness, createCombatHarness } from "./helpers/browser-harness";

const createHarness = createCombatHarness;

function getRuntimeClassSkills(harness: ReturnType<typeof createAppHarness>) {
  const { browserWindow, content } = harness;
  return ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"]
    .flatMap((classId) => browserWindow.ROUGE_CLASS_REGISTRY.getClassProgression(content, classId)?.trees || [])
    .flatMap((tree) => tree.skills || []);
}

function getRuntimeSkill(harness: ReturnType<typeof createAppHarness>, skillId: string) {
  return getRuntimeClassSkills(harness).find((skill) => skill.id === skillId) || null;
}

function getExplicitPreviewCoverageFromSource() {
  const previewDataSource = fs.readFileSync("src/ui/skill-preview-data.ts", "utf8");
  const previewSkillSource = fs.readFileSync("src/ui/combat-view-preview-skills.ts", "utf8");
  const collectIds = (source: string, pattern: RegExp) => new Set(Array.from(source.matchAll(pattern), (match) => match[1]));
  const staticIds = collectIds(previewDataSource, /case\s+"([^"]+)":/g);
  const modifierSection = previewDataSource.match(/const SKILL_MODIFIER_MAP:[\s\S]*?const SKILL_PASSIVE_MAP:/)?.[0] || "";
  const passiveSection = previewDataSource.match(/const SKILL_PASSIVE_MAP:[\s\S]*?function renderPassivePart/)?.[0] || "";
  const modifierIds = collectIds(modifierSection, /^\s*([a-z0-9_]+):\s*\[/gm);
  const passiveIds = collectIds(passiveSection, /^\s*([a-z0-9_]+):\s*\[/gm);
  const summonSection = previewSkillSource.match(/function createSkillSummonEffect[\s\S]*?\/\/ ── Skill modifier preview/)?.[0] || "";
  const summonIds = collectIds(summonSection, /case\s+"([^"]+)":\s+return build/g);
  const complexSection =
    previewSkillSource.match(/\/\/ Skill-specific active outcomes \(complex logic that can't be data-driven\)[\s\S]*?default:\n\s+break;/)?.[0]
    || "";
  const complexIds = collectIds(complexSection, /case\s+"([^"]+)":/g);
  const weaponMasterySection = previewSkillSource.match(/const BARBARIAN_WEAPON_MASTERIES = \[(.*?)\];/s)?.[1] || "";
  const weaponMasteryIds = new Set(Array.from(weaponMasterySection.matchAll(/"([^"]+)"/g), (match) => match[1]));
  return {
    active: new Set([...staticIds, ...summonIds, ...complexIds]),
    passive: new Set([...staticIds, ...modifierIds, ...passiveIds, ...summonIds, ...complexIds, ...weaponMasteryIds]),
  };
}

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

  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
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

test("starter command skills can mark a target and prep the next card", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
    equippedSkills: [
      {
        slotKey: "slot1",
        skill: {
          id: "amazon_call_the_shot",
          name: "Call the Shot",
          requiredLevel: 1,
          family: "command",
          slot: 1,
          tier: "starter",
          cost: 1,
          cooldown: 1,
          summary: "Mark one enemy and tee up the next shot.",
          exactText: "Choose an enemy. Mark it for +4 mercenary damage and give your next card +2 damage.",
          active: true,
          skillType: "debuff",
          damageType: "none",
        },
      },
    ],
  });

  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  state.hero.energy = 10;

  const result = engine.useSkill(state, "slot1", target.id);
  assert.equal(result.ok, true);
  assert.equal(state.mercenary.markedEnemyId, target.id);
  assert.equal(state.mercenary.markBonus, 4);
  assert.equal(state.skillModifiers.nextCardDamageBonus, 2);
  assert.equal(target.life, target.maxLife, "Call the Shot should set up the line without dealing direct damage");
});

test("starter summon skills can reinforce an existing board instead of dropping through generic summon fallback", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot1",
        skill: {
          id: "necromancer_raise_servant",
          name: "Raise Servant",
          requiredLevel: 1,
          family: "command",
          slot: 1,
          tier: "starter",
          cost: 1,
          cooldown: 1,
          summary: "Put a short-lived servant on the field or reinforce your board.",
          exactText: "Summon a Servant for 2 turns. If you already control a summon, reinforce it by +2 instead.",
          active: true,
          skillType: "summon",
          damageType: "physical",
        },
      },
    ],
  });
  state.hero.energy = 10;

  let result = engine.useSkill(state, "slot1");
  assert.equal(result.ok, true);
  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].templateId, "necromancer_servant");
  assert.equal(state.minions[0].power, 2);
  assert.equal(state.minions[0].remainingTurns, 2);
  assert.equal(state.minions[0].persistent, false);

  const reinforceState = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot1",
        skill: {
          id: "necromancer_raise_servant",
          name: "Raise Servant",
          requiredLevel: 1,
          family: "command",
          slot: 1,
          tier: "starter",
          cost: 1,
          cooldown: 1,
          summary: "Put a short-lived servant on the field or reinforce your board.",
          exactText: "Summon a Servant for 2 turns. If you already control a summon, reinforce it by +2 instead.",
          active: true,
          skillType: "summon",
          damageType: "physical",
        },
      },
    ],
  });
  reinforceState.hero.energy = 10;
  reinforceState.minions.push({
    id: "existing_skeleton",
    templateId: "necromancer_skeleton",
    name: "Skeleton",
    skillLabel: "Rusty Slash",
    actionKind: "attack",
    targetRule: "selected_enemy",
    power: 1,
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
  });

  result = engine.useSkill(reinforceState, "slot1");
  assert.equal(result.ok, true);
  assert.equal(reinforceState.minions.length, 1);
  assert.equal(reinforceState.minions[0].templateId, "necromancer_skeleton");
  assert.equal(reinforceState.minions[0].power, 3);
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

test("legacy bridge passives promoted into runtime slots carry concrete opener effects", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const previewApi = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS;
  const runtimeSkills = new Map(getRuntimeClassSkills(harness).map((skill) => [skill.id, skill]));
  const cases = [
    {
      id: "amazon_avoid",
      heroGuard: 6,
      heroDamageBonus: 0,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 3, nextCardGuard: 2, nextCardIgnoreGuard: 0, nextCardDraw: 0 },
      previewParts: ["Guard 6", "Next card Guard 2", "Next card +3 damage"],
    },
    {
      id: "amazon_penetrate",
      heroGuard: 0,
      heroDamageBonus: 3,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 3, nextCardGuard: 0, nextCardIgnoreGuard: 4, nextCardDraw: 0 },
      previewParts: ["Damage +3", "Next card +3 damage", "Next card ignore 4 guard"],
    },
    {
      id: "assassin_weapon_block",
      heroGuard: 6,
      heroDamageBonus: 0,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 2, nextCardGuard: 3, nextCardIgnoreGuard: 0, nextCardDraw: 0 },
      previewParts: ["Guard 6", "Next card Guard 3", "Next card +2 damage"],
    },
    {
      id: "barbarian_spear_mastery",
      heroGuard: 0,
      heroDamageBonus: 3,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 0, nextCardGuard: 1, nextCardIgnoreGuard: 0, nextCardDraw: 0 },
      previewParts: ["Damage +3", "Next card Guard 1"],
    },
    {
      id: "barbarian_increased_stamina",
      heroGuard: 5,
      heroDamageBonus: 0,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 0, nextCardGuard: 2, nextCardIgnoreGuard: 0, nextCardDraw: 1 },
      previewParts: ["Guard 5", "Next card Guard 2", "Next card Draw 1"],
    },
    {
      id: "barbarian_iron_skin",
      heroGuard: 7,
      heroDamageBonus: 0,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      modifiers: { nextCardDamageBonus: 0, nextCardGuard: 3, nextCardIgnoreGuard: 0, nextCardDraw: 0 },
      previewParts: ["Guard 7", "Next card Guard 3"],
    },
    {
      id: "necromancer_golem_mastery",
      heroGuard: 0,
      heroDamageBonus: 0,
      summonPowerBonus: 4,
      summonSecondaryBonus: 2,
      modifiers: { nextCardDamageBonus: 0, nextCardGuard: 2, nextCardIgnoreGuard: 0, nextCardDraw: 0 },
      previewParts: ["Summon power +4", "Summon riders +2", "Next card Guard 2"],
    },
  ];

  cases.forEach((entry) => {
    const skill = runtimeSkills.get(entry.id);
    assert.ok(skill, `missing runtime skill ${entry.id}`);
    const state = combatEngine.createCombatState({
      content,
      encounterId: "act_1_boss",
      mercenaryId: "rogue_scout",
      randomFn: () => 0,
      starterDeck: ["amazon_magic_arrow"],
      equippedSkills: [{ slotKey: `slot${skill.slot}`, skill }],
    });
    const equipped = state.equippedSkills[0];
    const preview = previewApi.buildSkillPreviewOutcome(state, equipped, null);

    assert.equal(state.hero.guard, entry.heroGuard, `${entry.id} hero guard`);
    assert.equal(state.hero.damageBonus, entry.heroDamageBonus, `${entry.id} hero damage bonus`);
    assert.equal(state.summonPowerBonus, entry.summonPowerBonus, `${entry.id} summon power`);
    assert.equal(state.summonSecondaryBonus, entry.summonSecondaryBonus, `${entry.id} summon riders`);
    assert.equal(state.skillModifiers.nextCardDamageBonus, entry.modifiers.nextCardDamageBonus, `${entry.id} next-card damage`);
    assert.equal(state.skillModifiers.nextCardGuard, entry.modifiers.nextCardGuard, `${entry.id} next-card guard`);
    assert.equal(state.skillModifiers.nextCardIgnoreGuard, entry.modifiers.nextCardIgnoreGuard, `${entry.id} next-card ignore guard`);
    assert.equal(state.skillModifiers.nextCardDraw, entry.modifiers.nextCardDraw, `${entry.id} next-card draw`);
    entry.previewParts.forEach((part) => assert.match(preview, new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("amazon inner sight can reveal one target for mercenary and precise follow-up hits", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "amazon_inner_sight");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.equal(target.slow, 1);
  assert.equal(state.mercenary.skillTargetEnemyId, target.id);
  assert.equal(state.mercenary.skillTargetDamageBonus, 6);
  assert.equal(state.skillWindows.length, 1);
  assert.equal(state.skillWindows[0].damageBonus, 3);
  assert.equal(state.skillWindows[0].ignoreGuard, 3);
  assert.equal(state.skillWindows[0].remainingUses, 2);
  assert.equal(state.skillWindows[0].requireTargetEnemyId, target.id);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("amazon magic arrow can pierce guard and refill the hand", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "amazon_magic_arrow");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.guard = 10;
  state.hand = [];
  state.drawPile = [{ instanceId: "draw_magic_arrow", cardId: "amazon_jab" }];
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.equal(state.hand.length, 1);
  assert.equal(state.hand[0].cardId, "amazon_jab");
  assert.ok(target.life < target.maxLife, "Magic Arrow should still deal life damage through heavy Guard");
  assert.ok(target.guard > 0 && target.guard < 10, "Magic Arrow should ignore part of Guard instead of fully stripping it");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("amazon slow missiles now blunts ranged pressure instead of falling through generic debuff prep", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "amazon_slow_missiles");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.hero.guard, 5);
  assert.ok(state.enemies.every((enemy) => !enemy.alive || enemy.slow >= 2));
  const rangedOrSupport = state.enemies.filter((enemy) => enemy.alive && ["ranged", "support"].includes(enemy.role));
  assert.ok(rangedOrSupport.length > 0, "crossfire encounter should provide ranged pressure");
  assert.ok(rangedOrSupport.every((enemy) => enemy.nextAttackPenalty >= 6));
  assert.equal(state.nextEnemyAttackReduction, 0, "ranged encounters should use the authored missile slowdown path");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("amazon fend sweeps multiple hits and refunds energy setup on primed targets", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "amazon_fend");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot3", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.slow = 1;
  state.hero.energy = 10;
  const before = state.enemies.map((enemy) => enemy.life);

  const result = combatEngine.useSkill(state, "slot3", target.id);
  assert.equal(result.ok, true);
  assert.equal(state.pendingEnergyNextTurn, 1);
  const damagedCount = state.enemies.filter((enemy, index) => enemy.life < before[index]).length;
  assert.ok(damagedCount >= 2, "Fend should sweep across the frontline instead of acting like a generic single hit");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("energy next turn payouts are granted and cleared at the next player turn", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "sorceress_kindle");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const enemy = state.enemies[0];
  enemy.intents = [{ kind: "guard", label: "Brace", value: 0 }];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...enemy.intents[0] };
  state.enemies = [enemy];
  state.selectedEnemyId = enemy.id;
  state.mercenary.attack = 0;
  state.hero.energy = 10;

  assert.equal(combatEngine.useSkill(state, "slot2", enemy.id).ok, true);
  assert.equal(state.pendingEnergyNextTurn, 1);

  assert.equal(combatEngine.endTurn(state).ok, true);
  assert.equal(state.turn, 2);
  assert.equal(state.hero.energy, state.hero.maxEnergy + 1);
  assert.equal(state.pendingEnergyNextTurn, 0);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("assassin tiger strike now arms a real melee follow-up window", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "assassin_tiger_strike");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  const window = state.skillWindows.find((entry) => entry.skillId === skill.id);
  assert.ok(window, "Tiger Strike should add a skill window for the next Assassin melee card");
  assert.equal(window?.damageBonus, 3);
  assert.equal(Array.from(window?.requireKindsAll || []).join(","), "assassin,melee");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("assassin dragon claw now cashes in status openings instead of generic attack fallback", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "assassin_dragon_claw");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.guard = 0;
  target.poison = 1;
  state.hero.energy = 10;
  const beforeLife = target.life;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.ok(beforeLife - target.life >= 20, "Dragon Claw should add its status payoff instead of resolving as a flat hit");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("assassin wake of fire now creates a real trap and scorches the opening line", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "assassin_wake_of_fire");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.minions[0]?.templateId, "assassin_wake_of_fire");
  const burnedEnemies = state.enemies.filter((enemy) => enemy.alive && enemy.burn >= 3);
  assert.ok(burnedEnemies.length >= 2, "Wake of Fire should burn the line before the trap starts ticking");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("assassin mind blast now stuns non-boss enemies and blunts the next attack cycle", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "assassin_mind_blast");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot3", skill }],
  });
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot3");
  assert.equal(result.ok, true);
  const nonBossEnemies = state.enemies.filter((enemy) => enemy.alive && !enemy.templateId.endsWith("_boss"));
  assert.ok(nonBossEnemies.every((enemy) => enemy.stun >= 1));
  assert.ok(state.enemies.filter((enemy) => enemy.alive).every((enemy) => enemy.nextAttackPenalty >= 3));
  assert.equal(state.hero.guard, 6);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("paladin sacrifice now trades life for a real heavy hit", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "paladin_sacrifice");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.guard = 0;
  state.hero.energy = 10;
  const beforeLife = state.hero.life;
  const beforeTargetLife = target.life;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.equal(state.hero.life, beforeLife - 3);
  assert.ok(target.life <= beforeTargetLife - 10, "Sacrifice should land as a real heavy hit");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("paladin smite now stuns through guard instead of falling through the generic attack template", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "paladin_smite");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.guard = 8;
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.equal(target.stun, 1);
  assert.ok(target.guard < 8, "Smite should break through some guard instead of behaving like a flat hit");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("paladin cleansing now removes party debuffs and restores a guarded recovery turn", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "paladin_cleansing");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.hero.energy = 10;
  state.hero.heroPoison = 4;

  const result = combatEngine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.hero.heroPoison, 0);
  assert.equal(state.hero.guard, 6);
  assert.ok(state.hero.life <= state.hero.maxLife);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("paladin blessed aim now creates a real two-attack setup window", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "paladin_blessed_aim");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  const window = state.skillWindows.find((entry) => entry.skillId === skill.id);
  assert.ok(window);
  assert.equal(window?.damageBonus, 4);
  assert.equal(window?.remainingUses, 2);
  assert.equal(Array.from(window?.requireKindsAny || []).join(","), "attack");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("barbarian bash now lands as a real heavy strike instead of a generic bridge hit", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "barbarian_bash");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  target.guard = 0;
  state.hero.energy = 10;
  const beforeLife = target.life;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  assert.ok(target.life <= beforeLife - 10, "Bash should resolve as a real heavy hit");

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("barbarian taunt now opens a focused attack window instead of falling through generic debuff prep", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "barbarian_taunt");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  const target = state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot2", target.id);
  assert.equal(result.ok, true);
  const window = state.skillWindows.find((entry) => entry.skillId === skill.id);
  assert.ok(window);
  assert.equal(window?.damageBonus, 6);
  assert.equal(window?.requireTargetEnemyId, target.id);
  assert.equal(state.mercenary.skillTargetEnemyId, target.id);
  assert.ok(state.mercenary.skillTargetDamageBonus >= 6);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("barbarian battle orders now functions as a real party command button", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "barbarian_battle_orders");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot3", skill }],
  });
  state.hero.energy = 10;

  const result = combatEngine.useSkill(state, "slot3");
  assert.equal(result.ok, true);
  assert.equal(state.hero.guard, 22);
  assert.equal(state.mercenary.guard, 22);
  assert.ok(state.mercenary.nextAttackBonus >= 16);
  assert.ok(state.enemies.every((enemy) => !enemy.alive || enemy.slow >= 1));

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("barbarian find potion now creates a real recovery button", () => {
  const harness = createAppHarness();
  const { browserWindow, content } = harness;
  const combatEngine = browserWindow.ROUGE_COMBAT_ENGINE;
  assert.ok(combatEngine);
  const skill = getRuntimeSkill(harness, "barbarian_find_potion");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.hero.energy = 10;
  state.hero.life = Math.max(1, state.hero.life - 6);
  const beforeLife = state.hero.life;

  const result = combatEngine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.hero.guard, 4);
  assert.ok(state.hero.life > beforeLife);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
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

test("slot-authored active skills stay explicitly implemented in combat and preview surfaces", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const previewApi = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS;
  const skillSeed = JSON.parse(fs.readFileSync("data/seeds/d2/skills.json", "utf8"));
  const slotSkills = (skillSeed.classes || [])
    .flatMap((classEntry: { trees?: Array<{ skills?: unknown[] }> }) => classEntry.trees || [])
    .flatMap((tree: { skills?: unknown[] }) => tree.skills || [])
    .filter((skill: { active?: boolean; slot?: number; id?: string }) => skill.active !== false && typeof skill.slot === "number" && typeof skill.id === "string")
    .map((skill: { id: string }) => skill.id);
  const combatSource = fs.readFileSync("src/combat/combat-engine-skills.ts", "utf8");
  const missingCombat = slotSkills.filter((id: string) => !combatSource.includes(`"${id}"`));
  const missingPreview = slotSkills.filter((id: string) => {
    const skill = getRuntimeSkill(harness, id);
    if (!skill) {
      return true;
    }
    const state = combatEngine.createCombatState({
      content,
      encounterId: "act_1_boss",
      mercenaryId: "rogue_scout",
      randomFn: () => 0,
      equippedSkills: [{ slotKey: `slot${skill.slot}` as RunSkillBarSlotKey, skill }],
    });
    const preview = previewApi.buildSkillPreviewOutcome(state, state.equippedSkills[0], state.enemies.find((enemy) => enemy.alive) || null);
    return typeof preview !== "string" || !preview.trim();
  });

  assert.deepEqual(missingCombat, [], `missing combat handlers for: ${missingCombat.join(", ")}`);
  assert.deepEqual(missingPreview, [], `missing preview handlers for: ${missingPreview.join(", ")}`);
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("normalized runtime class skills stay usable and previewable across the live catalog", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const previewApi = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS;
  const failures: string[] = [];

  getRuntimeClassSkills(harness).forEach((skill) => {
    const state = combatEngine.createCombatState({
      content,
      encounterId: "act_1_boss",
      mercenaryId: "rogue_scout",
      randomFn: () => 0,
      starterDeck: ["amazon_magic_arrow"],
      equippedSkills: [{ slotKey: `slot${skill.slot}`, skill }],
    });
    const equipped = state.equippedSkills[0];
    const target = state.enemies.find((enemy) => enemy.alive) || null;
    const preview = previewApi.buildSkillPreviewOutcome(state, equipped, target);

    if (typeof preview !== "string" || !preview.trim()) {
      failures.push(`${skill.id}: missing preview output`);
      return;
    }
    if (!equipped.active && preview === "Resolve") {
      failures.push(`${skill.id}: passive preview fell through to generic Resolve`);
      return;
    }
    if (!equipped.active) {
      return;
    }

    const result = combatEngine.useSkill(state, equipped.slotKey, target?.id || "");
    if (!result?.ok) {
      failures.push(`${skill.id}: useSkill failed with "${result?.message || "unknown error"}"`);
    }
  });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.deepEqual(failures, []);
});

test("normalized runtime class skills keep complete authored runtime metadata", () => {
  const harness = createAppHarness();
  const failures = getRuntimeClassSkills(harness).flatMap((skill) => {
    const local: string[] = [];
    if (![1, 2, 3].includes(skill.slot)) {
      local.push(`${skill.id}: invalid slot ${String(skill.slot)}`);
    }
    if (!["starter", "bridge", "capstone"].includes(skill.tier)) {
      local.push(`${skill.id}: invalid tier ${String(skill.tier)}`);
    }
    if (!["state", "command", "answer", "trigger_arming", "conversion", "recovery", "commitment"].includes(skill.family)) {
      local.push(`${skill.id}: invalid family ${String(skill.family)}`);
    }
    if (skill.tier !== "capstone" && skill.family === "commitment") {
      local.push(`${skill.id}: non-capstone skill should not use commitment family`);
    }
    if (typeof skill.summary !== "string" || !skill.summary.trim()) {
      local.push(`${skill.id}: missing summary`);
    }
    if (typeof skill.exactText !== "string" || !skill.exactText.trim()) {
      local.push(`${skill.id}: missing exactText`);
    }
    if (typeof skill.skillType !== "string" || !skill.skillType.trim()) {
      local.push(`${skill.id}: missing skillType`);
    }
    return local;
  });

  harness.browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.deepEqual(failures, []);
});

test("normalized runtime class skills stay inside the tier economy envelope", () => {
  const harness = createAppHarness();
  const failures = getRuntimeClassSkills(harness).flatMap((skill) => {
    const local: string[] = [];
    if (skill.tier === "starter") {
      if (skill.cost > 1) { local.push(`${skill.id}: starter cost ${skill.cost} exceeds 1`); }
      if (skill.cooldown > 2) { local.push(`${skill.id}: starter cooldown ${skill.cooldown} exceeds 2`); }
    } else if (skill.tier === "bridge") {
      if (skill.cost > 2) { local.push(`${skill.id}: bridge cost ${skill.cost} exceeds 2`); }
      if (skill.cooldown > 3) { local.push(`${skill.id}: bridge cooldown ${skill.cooldown} exceeds 3`); }
    } else if (skill.tier === "capstone") {
      if (skill.cost > 3) { local.push(`${skill.id}: capstone cost ${skill.cost} exceeds 3`); }
      if (skill.cooldown > 5) { local.push(`${skill.id}: capstone cooldown ${skill.cooldown} exceeds 5`); }
    }
    return local;
  });

  harness.browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.deepEqual(failures, []);
});

test("normalized runtime class skills have explicit preview source coverage across split preview modules", () => {
  const harness = createAppHarness();
  const coverage = getExplicitPreviewCoverageFromSource();
  const missing = getRuntimeClassSkills(harness)
    .filter((skill) => (skill.active === false ? !coverage.passive.has(skill.id) : !coverage.active.has(skill.id)))
    .map((skill) => skill.id);

  harness.browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.deepEqual(missing, [], `missing explicit preview source coverage for: ${missing.join(", ")}`);
});

test("active runtime skills that deal direct damage declare a damage type", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const failures: string[] = [];

  getRuntimeClassSkills(harness)
    .filter((skill) => skill.active !== false && (!skill.damageType || skill.damageType === "none"))
    .forEach((skill) => {
      const state = combatEngine.createCombatState({
        content,
        encounterId: "act_1_opening_crossfire",
        mercenaryId: "rogue_scout",
        randomFn: () => 0,
        starterDeck: ["amazon_magic_arrow"],
        equippedSkills: [{ slotKey: `slot${skill.slot}`, skill }],
      });
      state.hero.energy = 10;
      state.enemies.forEach((enemy) => {
        enemy.guard = 0;
      });
      const beforeLife = state.enemies.reduce((total, enemy) => total + enemy.life, 0);
      const target = state.enemies.find((enemy) => enemy.alive) || null;
      const result = combatEngine.useSkill(state, state.equippedSkills[0].slotKey, target?.id || "");
      if (!result?.ok) {
        failures.push(`${skill.id}: useSkill failed with "${result?.message || "unknown error"}"`);
        return;
      }
      const afterLife = state.enemies.reduce((total, enemy) => total + enemy.life, 0);
      if (afterLife < beforeLife) {
        failures.push(skill.id);
      }
    });

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
  assert.deepEqual(failures, [], `direct-damage runtime skills missing damageType: ${failures.join(", ")}`);
});

test("interesting class cards with authored conditional text have explicit runtime coverage", () => {
  const { content } = createHarness();
  const runtimeSource = fs.readFileSync("src/combat/combat-engine-combat.ts", "utf8");
  const classCardPrefixes = /^(amazon|assassin|barbarian|druid|necromancer|paladin|sorceress)_/;
  const authoredBehaviorText = /(If |Your next|The next enemy|This combat|for each|Each of your summons|Each summon|already|dies this turn|died last turn|instead of you next turn|takes 4 more damage from summons and mercenary this turn)/i;
  const missing = Object.values(content.cardCatalog)
    .filter((card) => classCardPrefixes.test(card.id) && authoredBehaviorText.test(card.text))
    .filter((card) => !card.auraId && !runtimeSource.includes(`"${card.id}"`))
    .map((card) => card.id)
    .sort();

  assert.deepEqual(missing, []);
});

test("druid pack call reinforces an existing summon instead of falling through generic summon prep", () => {
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
          id: "druid_pack_call",
          name: "Pack Call",
          requiredLevel: 6,
          family: "command",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Summon or reinforce a wolf pack.",
          exactText: "Summon a Wolf for 2 turns. If you already control a summon, reinforce it by +2 instead.",
          active: true,
          skillType: "summon",
          damageType: "physical",
        },
      },
    ],
  });
  state.hero.energy = 10;
  state.minions.push({
    id: "existing_wolf",
    templateId: "druid_spirit_wolf",
    name: "Wolf Pack",
    skillLabel: "Pack Strike",
    actionKind: "attack",
    targetRule: "selected_enemy",
    power: 2,
    secondaryValue: 0,
    remainingTurns: 2,
    persistent: false,
    life: 8,
    maxLife: 8,
    guard: 0,
    alive: true,
    taunt: false,
    invulnerable: false,
    stackAbilities: [],
  });

  const result = engine.useSkill(state, "slot2");
  assert.equal(result.ok, true);
  assert.equal(state.minions.length, 1);
  assert.equal(state.minions[0].power, 4);
});

test("stacked summon variants carry their stack abilities into minion actions", () => {
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
          requiredLevel: 6,
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
      {
        slotKey: "slot3",
        skill: {
          id: "necromancer_skeletal_mage",
          name: "Skeletal Mage",
          requiredLevel: 12,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Add a mage to the army.",
          exactText: "Summon a mage.",
          active: true,
          skillType: "summon",
          damageType: "poison",
        },
      },
    ],
  });
  state.hero.energy = 10;

  assert.equal(engine.useSkill(state, "slot2").ok, true);
  assert.equal(engine.useSkill(state, "slot3").ok, true);
  assert.equal(state.minions.length, 1, "skeleton and mage should stack into one army slot");
  assert.equal(state.minions[0].stackCount, 2, "stacked summon families should increment visual stack count");
  assert.ok(state.minions[0].stackAbilities.includes("poison"));

  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);
  state.selectedEnemyId = target.id;
  engine.endTurn(state);
  assert.ok(
    state.log.some((entry) => entry.effects.some((effect) => effect.targetId === target.id && effect.statusApplied?.kind === "poison")),
    "stacked poison rider should fire during the minion phase"
  );
});

test("static flow draws when the next spell damages multiple enemies", () => {
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
          id: "sorceress_static_flow",
          name: "Static Flow",
          requiredLevel: 6,
          family: "state",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Charge the next spell.",
          exactText: "Gain 1 Energy now. Your next Spell this turn draws 1 if it hits multiple enemies.",
          active: true,
          skillType: "buff",
          damageType: "lightning",
        },
      },
    ],
  });
  state.hero.energy = 10;
  state.hand = [{ instanceId: "card_1", cardId: "sorceress_frost_nova" }];
  state.drawPile = [{ instanceId: "card_2", cardId: "sorceress_fire_bolt" }];
  state.discardPile = [];

  assert.equal(engine.useSkill(state, "slot2").ok, true);
  const playResult = engine.playCard(state, content, "card_1");
  assert.equal(playResult.ok, true);
  assert.equal(state.hand.length, 1, "Static Flow should refill the hand after a multi-hit spell");
  assert.equal(state.hand[0].cardId, "sorceress_fire_bolt");
});

test("sorceress classic tree skills resolve authored control, setup, and tempo behavior", () => {
  const { content, engine } = createHarness();

  const iceBlastState = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "sorceress_ice_blast",
          name: "Ice Blast",
          requiredLevel: 6,
          family: "answer",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Freeze a single foe.",
          exactText: "Deal 12 cold damage. Apply 1 Freeze and 2 Slow. If the target is already Slowed, deal 6 more.",
          active: true,
          skillType: "spell",
          damageType: "cold",
        },
      },
    ],
  });
  iceBlastState.hero.energy = 10;
  const chilledTarget = iceBlastState.enemies.find((enemy) => enemy.alive);
  assert.ok(chilledTarget);
  chilledTarget.slow = 1;
  chilledTarget.guard = 0;
  const startLife = chilledTarget.life;
  assert.equal(engine.useSkill(iceBlastState, "slot2").ok, true);
  assert.ok(startLife - chilledTarget.life >= 18, "Ice Blast should cash in extra damage against slowed targets");
  assert.ok(chilledTarget.freeze >= 1);
  assert.ok(chilledTarget.slow >= 3);

  const enchantState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "sorceress_enchant",
          name: "Enchant",
          requiredLevel: 18,
          family: "state",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Empower the next damage plays.",
          exactText: "Your next 2 damage cards this turn deal +4 damage and apply 1 Burn. Mercenary next attack +6.",
          active: true,
          skillType: "buff",
          damageType: "fire",
        },
      },
    ],
  });
  enchantState.hero.energy = 10;
  assert.equal(engine.useSkill(enchantState, "slot2").ok, true);
  assert.equal(enchantState.mercenary.nextAttackBonus, 6);
  const enchantWindow = enchantState.skillWindows.find((window) => window.skillId === "sorceress_enchant");
  assert.ok(enchantWindow);
  assert.equal(enchantWindow.remainingUses, 2);
  assert.equal(enchantWindow.damageBonus, 4);
  assert.equal(enchantWindow.burn, 1);

  const teleportState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "sorceress_teleport",
          name: "Teleport",
          requiredLevel: 18,
          family: "answer",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Reposition and smooth the next cast.",
          exactText: "Gain 8 Guard for you and your mercenary. Draw 1. Your next Spell this turn costs 1 less.",
          active: true,
          skillType: "spell",
        },
      },
    ],
  });
  teleportState.hero.energy = 10;
  teleportState.hand = [{ instanceId: "next_spell", cardId: "sorceress_fireball" }];
  teleportState.drawPile = [];
  teleportState.discardPile = [];
  assert.equal(engine.useSkill(teleportState, "slot3").ok, true);
  assert.ok(teleportState.hero.guard >= 8);
  assert.ok(teleportState.mercenary.guard >= 8);
  assert.ok(teleportState.skillWindows.some((window) =>
    window.skillId === "sorceress_teleport" && window.costReduction === 1 && window.requireKindsAny.includes("spell")
  ));

  const novaState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "sorceress_nova",
          name: "Nova",
          requiredLevel: 12,
          family: "answer",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Shock the whole line.",
          exactText: "Deal 5 lightning damage to all enemies. Apply 1 Paralyze to all. If you played another Spell this turn, draw 1.",
          active: true,
          skillType: "spell",
          damageType: "lightning",
        },
      },
    ],
  });
  novaState.hero.energy = 10;
  novaState.playedCardIdsThisTurn = ["sorceress_fire_bolt"];
  novaState.drawPile = [{ instanceId: "refill", cardId: "sorceress_ice_bolt" }];
  novaState.hand = [];
  novaState.discardPile = [];
  assert.equal(engine.useSkill(novaState, "slot2").ok, true);
  assert.equal(novaState.hand.length, 1, "Nova should reward earlier spell sequencing with draw");
  assert.ok(novaState.enemies.filter((enemy) => enemy.alive).every((enemy) => enemy.paralyze >= 1));
});

test("necromancer curse and bone skills resolve authored setup, sustain, and line pressure", () => {
  const { content, engine } = createHarness();

  const amplifyState = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "necromancer_amplify_damage",
          name: "Amplify Damage",
          requiredLevel: 1,
          family: "state",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Open a target for attacks.",
          exactText: "Deal 2 damage. Your mercenary deals +8 to this target. Your next 2 attacks against it deal +4. Draw 1.",
          active: true,
          skillType: "debuff",
        },
      },
    ],
  });
  amplifyState.hero.energy = 10;
  amplifyState.drawPile = [{ instanceId: "refill", cardId: "necromancer_teeth" }];
  amplifyState.hand = [];
  amplifyState.discardPile = [];
  const amplifyTarget = amplifyState.enemies.find((enemy) => enemy.alive);
  assert.ok(amplifyTarget);
  assert.equal(engine.useSkill(amplifyState, "slot2").ok, true);
  assert.equal(amplifyState.mercenary.skillTargetEnemyId, amplifyTarget.id);
  assert.equal(amplifyState.mercenary.skillTargetDamageBonus, 8);
  const amplifyWindow = amplifyState.skillWindows.find((window) => window.skillId === "necromancer_amplify_damage");
  assert.ok(amplifyWindow);
  assert.equal(amplifyWindow.damageBonus, 4);
  assert.equal(amplifyWindow.remainingUses, 2);
  assert.equal(amplifyState.hand.length, 1);

  const lifeTapState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "necromancer_life_tap",
          name: "Life Tap",
          requiredLevel: 18,
          family: "recovery",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Recover and stabilize.",
          exactText: "Heal 6. Gain 5 Guard. Draw 1.",
          active: true,
          skillType: "debuff",
        },
      },
    ],
  });
  lifeTapState.hero.energy = 10;
  lifeTapState.hero.life = Math.max(1, lifeTapState.hero.life - 10);
  lifeTapState.drawPile = [{ instanceId: "refill", cardId: "necromancer_bone_armor" }];
  lifeTapState.hand = [];
  lifeTapState.discardPile = [];
  const preTapLife = lifeTapState.hero.life;
  assert.equal(engine.useSkill(lifeTapState, "slot2").ok, true);
  assert.ok(lifeTapState.hero.life > preTapLife);
  assert.ok(lifeTapState.hero.guard >= 5);
  assert.equal(lifeTapState.hand.length, 1);

  const poisonExplosionState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "necromancer_poison_explosion",
          name: "Poison Explosion",
          requiredLevel: 18,
          family: "conversion",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Poison the whole line.",
          exactText: "Deal 4 poison damage to all enemies. Apply 3 Poison to all.",
          active: true,
          skillType: "spell",
          damageType: "poison",
        },
      },
    ],
  });
  poisonExplosionState.hero.energy = 10;
  assert.equal(engine.useSkill(poisonExplosionState, "slot3").ok, true);
  assert.ok(poisonExplosionState.enemies.filter((enemy) => enemy.alive).every((enemy) => enemy.poison >= 3));
});

test("necromancer summon focus directs summoned attacks to the marked target and boosts their damage", () => {
  const harness = createAppHarness();
  const { browserWindow, content, combatEngine } = harness;
  const skill = getRuntimeSkill(harness, "necromancer_attract");
  assert.ok(skill);

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [{ slotKey: "slot2", skill }],
  });
  state.mercenary.alive = false;
  state.hero.energy = 10;
  const focusTarget = state.enemies.find((enemy) => enemy.alive && enemy.id !== state.selectedEnemyId) || state.enemies.find((enemy) => enemy.alive);
  const selectedTarget = state.enemies.find((enemy) => enemy.alive && enemy.id === state.selectedEnemyId) || null;
  assert.ok(focusTarget);
  assert.ok(selectedTarget);
  state.enemies.forEach((enemy) => {
    enemy.guard = 0;
    enemy.life = 30;
    enemy.maxLife = 30;
  });
  state.minions.push({
    id: "focused_skeleton",
    templateId: "necromancer_skeleton",
    name: "Skeleton Army",
    skillLabel: "Bone Rush",
    actionKind: "attack",
    targetRule: "selected_enemy",
    power: 4,
    secondaryValue: 0,
    remainingTurns: 0,
    persistent: true,
    life: 18,
    maxLife: 18,
    guard: 0,
    alive: true,
    taunt: false,
    invulnerable: false,
    stackAbilities: [],
  });

  assert.equal(combatEngine.useSkill(state, "slot2", focusTarget.id).ok, true);
  assert.equal(combatEngine.endTurn(state).ok, true);
  assert.equal(focusTarget.life, 22, "the focused enemy should take the summon's base damage plus the focus bonus");
  assert.equal(selectedTarget.life, 30, "summons should abandon the selected enemy once focus is set");
  assert.equal(state.summonFocusEnemyId, "");
  assert.equal(state.summonFocusDamageBonus, 0);

  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("druid elemental and shapeshift skills resolve authored setup, payoff, and recovery behavior", () => {
  const { content, engine } = createHarness();

  const feralRageState = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "druid_feral_rage",
          name: "Feral Rage",
          requiredLevel: 12,
          family: "state",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Prime the next shapeshift strike.",
          exactText: "Deal 8 damage. Heal 4. Your next Shapeshift or melee card this turn deals +3 damage.",
          active: true,
          skillType: "attack",
          damageType: "physical",
        },
      },
    ],
  });
  feralRageState.hero.energy = 10;
  feralRageState.hero.life = Math.max(1, feralRageState.hero.life - 8);
  const preFeralLife = feralRageState.hero.life;
  assert.equal(engine.useSkill(feralRageState, "slot2").ok, true);
  assert.ok(feralRageState.hero.life > preFeralLife);
  const feralWindow = feralRageState.skillWindows.find((window) => window.skillId === "druid_feral_rage");
  assert.ok(feralWindow);
  assert.equal(feralWindow.damageBonus, 3);

  const tornadoState = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "druid_tornado",
          name: "Tornado",
          requiredLevel: 24,
          family: "conversion",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Cash in slowed targets.",
          exactText: "Deal 12 damage to all enemies. If any enemy is Slowed, deal 4 more to it.",
          active: true,
          skillType: "spell",
          damageType: "physical",
        },
      },
    ],
  });
  tornadoState.hero.energy = 10;
  const slowedTarget = tornadoState.enemies.find((enemy) => enemy.alive);
  assert.ok(slowedTarget);
  slowedTarget.slow = 1;
  const preTornadoLife = slowedTarget.life;
  assert.equal(engine.useSkill(tornadoState, "slot3").ok, true);
  assert.ok(preTornadoLife - slowedTarget.life >= 16, "Tornado should cash in slowed enemies for bonus damage");

  const hungerState = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "druid_hunger",
          name: "Hunger",
          requiredLevel: 24,
          family: "recovery",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Drain a slowed target.",
          exactText: "Deal 18 damage. Heal 10. If the target is Slowed, deal 6 more.",
          active: true,
          skillType: "attack",
          damageType: "physical",
        },
      },
    ],
  });
  hungerState.hero.energy = 10;
  hungerState.hero.life = Math.max(1, hungerState.hero.life - 14);
  const prey = hungerState.enemies.find((enemy) => enemy.alive);
  assert.ok(prey);
  prey.slow = 1;
  prey.guard = 0;
  const preHungerLife = hungerState.hero.life;
  const prePreyLife = prey.life;
  assert.equal(engine.useSkill(hungerState, "slot3").ok, true);
  assert.ok(hungerState.hero.life > preHungerLife);
  assert.ok(prePreyLife - prey.life >= 24, "Hunger should spike slowed prey");
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

  assert.equal(boss.intentIndex, 0);
  assert.equal(boss.currentIntent.kind, "charge");
  assert.equal(boss.currentIntent.value, 23);
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

  const rangedTemplate = content.enemyCatalog[ranged.templateId];
  assert.equal(boss.intentIndex, 0);
  assert.equal(boss.currentIntent.kind, "charge");
  assert.equal(boss.currentIntent.value, 22);
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
  assert.equal(woundedTarget.life, 16 - (state.mercenary.attack + 3 + 2));
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

test("persistent aura cards boost matching cards after activation", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
    starterDeck: ["amazon_arrow_mastery", "amazon_magic_arrow"],
  });
  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
  const auraCard = state.hand.find((entry) => entry.cardId === "amazon_arrow_mastery");
  const attackCard = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(target);
  assert.ok(auraCard);
  assert.ok(attackCard);

  state.hero.energy = 10;
  const auraResult = engine.playCard(state, content, auraCard.instanceId);
  assert.equal(auraResult.ok, true);
  assert.ok(state.activePlayerAuras.includes("amazon_ranged_mastery"));

  const lifeBefore = target.life;
  const guardBefore = target.guard;
  const attackResult = engine.playCard(state, content, attackCard.instanceId, target.id);
  assert.equal(attackResult.ok, true);
  const totalDamage = (lifeBefore - target.life) + (guardBefore - target.guard);
  assert.equal(totalDamage, 10);
});

test("spell setup cards arm the next matching spells for authored bonus damage", () => {
  const { content, engine } = createHarness();
  const baseline = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
    starterDeck: ["sorceress_enchant", "sorceress_fireball", "sorceress_fireball"],
  });
  const baselineTarget = baseline.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || baseline.enemies.find((enemy) => enemy.alive);
  const baselineFireball = baseline.hand.find((entry) => entry.cardId === "sorceress_fireball");
  assert.ok(baselineTarget);
  assert.ok(baselineFireball);
  baseline.hero.energy = 10;
  const baselineLifeBefore = baselineTarget.life;
  const baselineGuardBefore = baselineTarget.guard;
  const baselineResult = engine.playCard(baseline, content, baselineFireball.instanceId, baselineTarget.id);
  assert.equal(baselineResult.ok, true);
  const baselineDamage = (baselineLifeBefore - baselineTarget.life) + (baselineGuardBefore - baselineTarget.guard);

  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
    starterDeck: ["sorceress_enchant", "sorceress_fireball", "sorceress_fireball"],
  });
  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
  const setupCard = state.hand.find((entry) => entry.cardId === "sorceress_enchant");
  const fireball = state.hand.find((entry) => entry.cardId === "sorceress_fireball");
  assert.ok(target);
  assert.ok(setupCard);
  assert.ok(fireball);

  state.hero.energy = 10;
  const setupResult = engine.playCard(state, content, setupCard.instanceId);
  assert.equal(setupResult.ok, true);
  assert.ok(state.skillWindows.some((window) => window.skillId === "sorceress_enchant" && window.remainingUses === 2));

  const lifeBefore = target.life;
  const guardBefore = target.guard;
  const fireballResult = engine.playCard(state, content, fireball.instanceId, target.id);
  assert.equal(fireballResult.ok, true);
  const totalDamage = (lifeBefore - target.life) + (guardBefore - target.guard);
  assert.equal(totalDamage, baselineDamage + 4);
  assert.ok(state.skillWindows.some((window) => window.skillId === "sorceress_enchant" && window.remainingUses === 1));
});

test("spell-chain conditionals pay off after an earlier spell this turn", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
  });
  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
  assert.ok(target);

  state.hand = [
    { instanceId: "telekinesis", cardId: "sorceress_telekinesis" },
    { instanceId: "nova", cardId: "sorceress_nova" },
  ];
  state.drawPile = [
    { instanceId: "draw_1", cardId: "kick" },
    { instanceId: "draw_2", cardId: "kick" },
  ];
  state.discardPile = [];
  state.hero.energy = 10;

  const telekinesisResult = engine.playCard(state, content, "telekinesis", target.id);
  assert.equal(telekinesisResult.ok, true);
  assert.equal(state.hand.length, 2);

  const novaResult = engine.playCard(state, content, "nova");
  assert.equal(novaResult.ok, true);
  assert.equal(state.hand.length, 2, "Nova should draw the extra card after an earlier spell");
});

test("rogue scout precision aura boosts ranged card damage", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: ["amazon_magic_arrow"],
  });
  const target = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies.find((enemy) => enemy.alive);
  const card = state.hand.find((entry) => entry.cardId === "amazon_magic_arrow");
  assert.ok(target);
  assert.ok(card);

  state.hero.energy = 10;
  const lifeBefore = target.life;
  const guardBefore = target.guard;
  const result = engine.playCard(state, content, card.instanceId, target.id);
  assert.equal(result.ok, true);
  const totalDamage = (lifeBefore - target.life) + (guardBefore - target.guard);
  assert.equal(totalDamage, 9);
});

test("harrogath captain battle cry reduces boss attack damage", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "harrogath_captain",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.alive && enemy.templateId.endsWith("_boss"))
    || state.enemies[0];
  assert.ok(boss);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== boss.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  boss.guard = 0;
  boss.currentIntent = { kind: "attack", label: "Boss Strike", value: 10, target: "hero" };
  boss.intents = [{ kind: "attack", label: "Boss Strike", value: 10, target: "hero" }];
  boss.intentIndex = 0;
  state.hand = [];
  state.hero.guard = 0;

  const heroLifeBefore = state.hero.life;
  const result = engine.endTurn(state);
  assert.equal(result.ok, true);
  assert.equal(heroLifeBefore - state.hero.life, 7);
});

test("summon-scaled cards do not overdeal without a board and ramp correctly once summons are present", () => {
  const { content, engine } = createHarness();
  const emptyBoard = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const emptyTarget = emptyBoard.enemies.find((enemy) => enemy.alive);
  assert.ok(emptyTarget);
  emptyBoard.hand = [{ instanceId: "stampede", cardId: "druid_wild_stampede" }];
  emptyBoard.drawPile = [];
  emptyBoard.discardPile = [];
  emptyBoard.hero.energy = 10;
  const emptyLifeBefore = emptyTarget.life;
  const emptyGuardBefore = emptyTarget.guard;
  assert.equal(engine.playCard(emptyBoard, content, "stampede").ok, true);
  assert.equal((emptyLifeBefore - emptyTarget.life) + (emptyGuardBefore - emptyTarget.guard), 0);

  const stackedBoard = engine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  stackedBoard.hand = [{ instanceId: "stampede", cardId: "druid_wild_stampede" }];
  stackedBoard.drawPile = [];
  stackedBoard.discardPile = [];
  stackedBoard.hero.energy = 10;
  stackedBoard.minions.push({
    id: "wolf_1",
    templateId: "druid_spirit_wolf",
    name: "Spirit Wolf",
    skillLabel: "Pack Strike",
    actionKind: "attack",
    targetRule: "selected_enemy",
    power: 4,
    secondaryValue: 0,
    remainingTurns: 2,
    persistent: false,
    life: 10,
    maxLife: 10,
    guard: 0,
    alive: true,
    taunt: false,
    invulnerable: false,
    stackAbilities: [],
  });
  stackedBoard.minions.push({
    id: "wolf_2",
    templateId: "druid_spirit_wolf",
    name: "Spirit Wolf",
    skillLabel: "Pack Strike",
    actionKind: "attack",
    targetRule: "selected_enemy",
    power: 4,
    secondaryValue: 0,
    remainingTurns: 2,
    persistent: false,
    life: 10,
    maxLife: 10,
    guard: 0,
    alive: true,
    taunt: false,
    invulnerable: false,
    stackAbilities: [],
  });
  const before = stackedBoard.enemies.map((enemy) => ({ id: enemy.id, life: enemy.life, guard: enemy.guard }));
  assert.equal(engine.playCard(stackedBoard, content, "stampede").ok, true);
  const damageByEnemy = stackedBoard.enemies.map((enemy, index) => {
    const snapshot = before[index];
    return (snapshot.life - enemy.life) + (snapshot.guard - enemy.guard);
  });
  assert.ok(damageByEnemy.every((damage) => damage === 10));
});
