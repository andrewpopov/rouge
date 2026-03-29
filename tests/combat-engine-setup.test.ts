export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createCombatHarness } from "./helpers/browser-harness";

const createHarness = createCombatHarness;

test("createCombatState builds hero, mercenary, and encounter pack", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  assert.equal(state.hero.name, "Wanderer");
  assert.equal(state.mercenary.name, "Rogue Scout");
  assert.equal(state.enemies.length, 3);
  assert.equal(state.turn, 1);
  assert.equal(state.phase, "player");
  assert.equal(state.hand.length, state.hero.handSize);
});

test("playCard spends energy and damages the selected enemy", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.hand = [{ instanceId: "card_test", cardId: "quick_slash" }];
  state.hero.energy = 3;

  const result = engine.playCard(state, content, "card_test", target.id);

  assert.equal(result.ok, true);
  assert.equal(state.hero.energy, 2);
  assert.equal(target.life, target.maxLife - 7);
  assert.equal(state.discardPile.length, 1);
});

test("endTurn triggers the mercenary before enemies resolve", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "catacombs_gate",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const target = state.enemies[0];
  state.mercenary.nextAttackBonus = 3;
  state.selectedEnemyId = target.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(target.life <= target.maxLife - 8);
  assert.equal(state.phase, "player");
  assert.equal(state.turn, 2);
});

test("usePotion heals the mercenary and consumes a charge", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  state.mercenary.life = 20;
  state.potions = 2;

  const result = engine.usePotion(state, "mercenary");

  assert.equal(result.ok, true);
  assert.equal(state.potions, 1);
  assert.equal(state.mercenary.life, 32);
});

test("createCombatState accepts run-state overrides for hero, mercenary, deck, and potions", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "iron_wolf",
    heroState: {
      name: "Sorceress",
      className: "Sorceress",
      maxLife: 40,
      life: 27,
      maxEnergy: 4,
      handSize: 4,
      potionHeal: 14,
    },
    mercenaryState: {
      maxLife: 30,
      life: 18,
      attack: 6,
    },
    starterDeck: ["fire_bolt", "fire_bolt", "multishot", "second_wind"],
    initialPotions: 1,
    randomFn: () => 0,
  });

  assert.equal(state.hero.name, "Sorceress");
  assert.equal(state.hero.life, 27);
  assert.equal(state.hero.maxEnergy, 4);
  assert.equal(state.mercenary.life, 18);
  assert.equal(state.mercenary.attack, 6);
  assert.equal(state.potions, 1);
  assert.equal(state.drawPile.length + state.hand.length, 4);
});

test("generated elite and boss templates sit above the raw encounter baseline", () => {
  const { content } = createHarness();
  const rawRoleLife: Record<string, number> = { raider: 12, ranged: 10, support: 11, brute: 18, boss: 38 };
  const rawRoleAttack: Record<string, number> = { raider: 4, ranged: 5, support: 3, brute: 6, boss: 9 };
  const actNumber = 1;

  const eliteTemplateId = Object.keys(content.enemyCatalog).find((templateId) => templateId.startsWith("act_1_") && templateId.includes("_elite"));
  const bossTemplateId = Object.keys(content.enemyCatalog).find((templateId) => templateId.startsWith("act_1_") && templateId.endsWith("_boss"));
  assert.ok(eliteTemplateId);
  assert.ok(bossTemplateId);

  const eliteTemplate = content.enemyCatalog[eliteTemplateId];
  const bossTemplate = content.enemyCatalog[bossTemplateId];
  const rawEliteLife = (rawRoleLife[eliteTemplate.role] || 10) + actNumber * 10;
  const rawEliteAttack = (rawRoleAttack[eliteTemplate.role] || 4) + actNumber * 2;
  const rawBossLife = rawRoleLife.boss + actNumber * 18;
  const rawBossAttack = rawRoleAttack.boss + actNumber * 4;

  assert.ok(eliteTemplate.maxLife > rawEliteLife);
  assert.ok(eliteTemplate.intents.some((intent) => (intent.value || 0) > rawEliteAttack));
  assert.ok(bossTemplate.maxLife > rawBossLife);
  assert.ok(bossTemplate.intents.some((intent) => (intent.value || 0) > rawBossAttack));
});

test("act bosses expose unique scripted mechanics by act theme", () => {
  const { content } = createHarness();
  const andariel = content.enemyCatalog.act_1_andariel_boss;
  const duriel = content.enemyCatalog.act_2_duriel_boss;
  const mephisto = content.enemyCatalog.act_3_mephisto_boss;
  const diablo = content.enemyCatalog.act_4_diablo_boss;
  const baal = content.enemyCatalog.act_5_baal_boss;

  assert.ok(andariel.intents.some((intent) => intent.kind === "attack_poison"));
  assert.ok(duriel.intents.some((intent) => intent.kind === "sunder_attack" && intent.target === "mercenary"));
  assert.ok(mephisto.intents.some((intent) => intent.kind === "attack_lightning_all"));
  assert.ok(diablo.intents.some((intent) => intent.kind === "attack_burn_all"));
  assert.ok(baal.intents.some((intent) => intent.kind === "teleport"));
  assert.ok(baal.intents.some((intent) => intent.kind === "summon_minion"));
});

test("base boss encounters preserve the scripted boss opener while starting behind a screen", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);
  assert.equal(boss.currentIntent.kind, "guard_allies");
  assert.ok(boss.guard >= 8);
});

test("mercenary contract bonuses can add opening guard and deterministic damage bonuses", () => {
  const { content, engine } = createCombatHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "blood_moor_raiders",
    mercenaryId: "rogue_scout",
    mercenaryState: {
      contractAttackBonus: 2,
      contractBehaviorBonus: 1,
      contractStartGuard: 2,
      contractHeroDamageBonus: 1,
      contractHeroStartGuard: 3,
      contractOpeningDraw: 1,
      contractPerkLabels: ["Forward Spotters"],
    },
    randomFn: () => 0,
  });
  const target = state.enemies[0];

  assert.equal(state.hero.guard, 3);
  assert.equal(state.hero.damageBonus, 1);
  assert.equal(state.hand.length, state.hero.handSize + 1);
  assert.equal(state.mercenary.guard, 2);
  assert.ok(state.log.some((line) => line.includes("Forward Spotters")));

  state.hand = [{ instanceId: "card_test", cardId: "quick_slash" }];
  state.hero.energy = 3;
  const cardResult = engine.playCard(state, content, "card_test", target.id);
  assert.equal(cardResult.ok, true);
  assert.equal(target.life, target.maxLife - 8);
  target.life = target.maxLife;

  state.enemies.forEach((enemy) => {
    if (enemy.id !== target.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.mercenary.markedEnemyId = target.id;
  state.mercenary.markBonus = 4;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(target.life, target.maxLife - (state.mercenary.attack + 2 + 4 + 1));
});

test("content validation fails clearly when a seeded act boss reference is missing", () => {
  const { seedBundle, validator } = createCombatHarness();
  const brokenSeedBundle = {
    ...seedBundle,
    bosses: {
      ...seedBundle.bosses,
      entries: seedBundle.bosses.entries.filter((entry) => entry.id !== "andariel"),
    },
  };

  assert.throws(() => {
    validator.assertValidSeedBundle(brokenSeedBundle);
  }, /Act 1 boss "andariel" has no matching bosses entry\./);
});

test("content validation fails clearly when an elite affix is invalid", () => {
  const { content, validator } = createCombatHarness();
  const eliteTemplateId = Object.keys(content.enemyCatalog).find((templateId) => templateId.startsWith("act_1_") && templateId.endsWith("_elite"));
  assert.ok(eliteTemplateId);
  const brokenContent = {
    ...content,
    enemyCatalog: {
      ...content.enemyCatalog,
      [eliteTemplateId]: {
        ...content.enemyCatalog[eliteTemplateId],
        variant: "elite",
        affixes: ["bad_affix"],
      },
    },
  };

  assert.throws(() => {
    validator.assertValidRuntimeContent(brokenContent);
  }, new RegExp(`Enemy template "${eliteTemplateId}" has unsupported affix "bad_affix" at index 0\\.`));
});

test("content validation fails clearly when a mercenary behavior is invalid", () => {
  const { content, validator } = createCombatHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        behavior: "bad_behavior",
      },
    },
  };

  assert.throws(() => {
    validator.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout\.behavior "bad_behavior" is not supported\./);
});

test("content validation fails clearly when an encounter modifier is invalid", () => {
  const { content, validator } = createHarness();
  const brokenContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      act_1_opening_skirmish: {
        ...content.encounterCatalog.act_1_opening_skirmish,
        modifiers: [{ kind: "bad_modifier", value: 1 }],
      },
    },
  };

  assert.throws(() => {
    validator.assertValidRuntimeContent(brokenContent);
  }, /Encounter "act_1_opening_skirmish" has unsupported modifier "bad_modifier" at index 0\./);
});

test("generated encounters include broader elite and encounter-package breadth inside each act", () => {
  const { content } = createHarness();

  assert.ok(Object.keys(content.mercenaryCatalog).length >= 7);

  for (let actNumber = 1; actNumber <= 5; actNumber += 1) {
    const affixIds = new Set(
      Object.values(content.enemyCatalog)
        .filter((template) => template.templateId.startsWith(`act_${actNumber}_`) && template.variant === "elite")
        .flatMap((template) => template.affixes || [])
    );
    const modifierKinds = new Set(
      Object.values(content.encounterCatalog)
        .filter((encounter) => encounter.id.startsWith(`act_${actNumber}_`))
        .flatMap((encounter) => encounter.modifiers || [])
        .map((modifier) => modifier.kind)
    );

    assert.ok(affixIds.size >= 4, `expected act ${actNumber} to have at least four elite affix families`);
    assert.ok(modifierKinds.size >= 20, `expected act ${actNumber} to expose at least twenty encounter modifier families`);
    assert.ok(content.generatedActEncounterIds[actNumber].opening.length >= 6);
    assert.ok(content.generatedActEncounterIds[actNumber].branchBattle.length >= 6);
    assert.ok(content.generatedActEncounterIds[actNumber].branchMiniboss.length >= 6);
  }
});

test("content validation fails clearly when an act exposes too few encounter modifier families", () => {
  const { content, validator } = createHarness();
  const brokenContent = {
    ...content,
    encounterCatalog: Object.fromEntries(
      Object.entries(content.encounterCatalog).map(([encounterId, encounter]) => {
        if (!encounterId.startsWith("act_1_")) {
          return [encounterId, encounter];
        }
        return [
          encounterId,
          {
            ...encounter,
            modifiers: encounter.modifiers?.length ? [{ kind: "fortified_line", value: 1 }] : [],
          },
        ];
      })
    ),
  };

  assert.throws(() => {
    validator.assertValidRuntimeContent(brokenContent);
  }, /generatedActEncounterIds\.1 must expose at least 20 encounter modifier families\./);
});

test("scripted boss intents can shatter guard before dealing damage", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_boss",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  assert.ok(boss);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== boss.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.mercenary.guard = 9;
  state.mercenary.life = state.mercenary.maxLife;
  boss.currentIntent = boss.intents.find((intent) => intent.kind === "sunder_attack");
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(state.mercenary.guard, 0);
  assert.ok(state.mercenary.life < state.mercenary.maxLife);
});

test("fortified encounters start with Guard on the full enemy line", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_screen",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  state.enemies.forEach((enemy) => {
    assert.equal(enemy.guard, 2);
  });
});

test("ambush encounters advance raider and ranged enemies to their second scripted intent", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_1_opening_raid",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const raider = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(raider);

  const template = content.enemyCatalog[raider.templateId];
  assert.equal(raider.intentIndex, 1);
  assert.equal(raider.currentIntent.label, template.intents[1].label);
});

test("act-specific support archetypes can fortify the enemy line", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_2_opening_skirmish",
    mercenaryId: "desert_guard",
    randomFn: () => 0,
  });
  const support = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "support");
  const ally = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(support);
  assert.ok(ally);

  state.enemies.forEach((enemy) => {
    if (enemy.id !== support.id && enemy.id !== ally.id) {
      enemy.life = 0;
      enemy.alive = false;
    }
  });
  state.selectedEnemyId = ally.id;
  support.currentIntent = support.intents[0];
  assert.ok(support.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
});

test("escort bulwark modifiers harden elite escorts but not the whole enemy pack", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_5_branch_warhost",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const elite = state.enemies.find((enemy) => enemy.templateId.includes("_elite"));
  const brute = state.enemies.find((enemy) => {
    return content.enemyCatalog[enemy.templateId].role === "brute" && !enemy.templateId.includes("_elite");
  });
  assert.ok(elite);
  assert.ok(brute);

  assert.equal(elite.guard, 6);
  assert.equal(brute.guard, 0);
});

test("escort rotation modifiers fortify and advance non-boss escorts without moving the boss", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      escort_rotation_probe: {
        ...content.encounterCatalog.act_1_boss,
        id: "escort_rotation_probe",
        modifiers: [{ kind: "escort_rotation", value: 2 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "escort_rotation_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const escorts = state.enemies.filter((enemy) => enemy.id !== boss?.id);
  assert.ok(boss);
  assert.ok(escorts.length > 0);

  assert.equal(boss.guard, 0);
  assert.equal(boss.intentIndex, 0);
  escorts.forEach((escort) => {
    assert.equal(escort.guard, 2);
    assert.equal(escort.intentIndex, 1);
  });
});

test("court reserve modifiers harden elite and backline escorts without fortifying the boss", () => {
  const { content, engine } = createHarness();
  const customContent = {
    ...content,
    encounterCatalog: {
      ...content.encounterCatalog,
      court_reserves_probe: {
        ...content.encounterCatalog.act_1_boss_aftermath,
        id: "court_reserves_probe",
        modifiers: [{ kind: "court_reserves", value: 2 }],
      },
    },
  };
  const state = engine.createCombatState({
    content: customContent,
    encounterId: "court_reserves_probe",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const boss = state.enemies.find((enemy) => enemy.templateId.endsWith("_boss"));
  const reserveTargets = state.enemies.filter((enemy) => {
    return !enemy.templateId.endsWith("_boss") && (
      enemy.templateId.includes("_elite") ||
      enemy.role === "ranged" ||
      enemy.role === "support"
    );
  });
  const reserveIntentKinds = new Set(["attack", "attack_all", "attack_and_guard", "drain_attack", "sunder_attack", "heal_ally", "heal_allies", "heal_and_guard"]);
  assert.ok(boss);
  assert.ok(reserveTargets.length > 0);

  reserveTargets.forEach((target) => {
    const template = content.enemyCatalog[target.templateId];
    const baseGuard = Array.isArray(template.traits) && template.traits.includes("stone_skin")
      ? Math.floor(template.maxLife * 0.3)
      : 0;
    assert.equal(target.guard, baseGuard + 2);
    target.intents.forEach((intent, index) => {
      const baseIntent = template.intents[index];
      const expectedValue = reserveIntentKinds.has(baseIntent.kind) ? baseIntent.value + 2 : baseIntent.value;
      assert.equal(intent.value, expectedValue);
    });
  });
});

test("backline screen modifiers harden ranged and support enemies without shielding the frontline", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_3_opening_pressure",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const ranged = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "ranged");
  const support = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "support");
  const raider = state.enemies.find((enemy) => content.enemyCatalog[enemy.templateId].role === "raider");
  assert.ok(ranged);
  assert.ok(support);
  assert.ok(raider);

  assert.equal(ranged.guard, 3);
  assert.equal(support.guard, 3);
  assert.equal(raider.guard, 0);
});
