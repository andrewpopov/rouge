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
    assert.ok(modifierKinds.size >= 14, `expected act ${actNumber} to expose at least fourteen encounter modifier families`);
    assert.ok(content.generatedActEncounterIds[actNumber].opening.length >= 6);
    assert.ok(content.generatedActEncounterIds[actNumber].branchBattle.length >= 5);
    assert.ok(content.generatedActEncounterIds[actNumber].branchMiniboss.length >= 4);
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
  }, /generatedActEncounterIds\.1 must expose at least 14 encounter modifier families\./);
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
  state.hero.guard = 9;
  state.hero.life = state.hero.maxLife;
  boss.currentIntent = boss.intents.find((intent) => intent.kind === "sunder_attack");
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(state.hero.guard, 0);
  assert.ok(state.hero.life < state.hero.maxLife);
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
  support.currentIntent = support.intents.find((intent) => intent.kind === "guard_allies");
  assert.ok(support.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(support.guard > 0);
  assert.ok(ally.guard > 0);
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
  assert.equal(brute.currentIntent.value, bruteTemplate.intents[0].value + 1);
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
  const state = engine.createCombatState({
    content,
    encounterId: "act_3_branch_bulwark",
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

test("elite onslaught modifiers push elite packs into their harder follow-up without advancing non-elites", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_5_branch_warhost",
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
  assert.equal(boss.guard, 2);
  assert.equal(ranged.guard, 4);
  assert.equal(elite.guard, 0);
  assert.equal(boss.currentIntent.value, bossTemplate.intents[0].value + 2);
});

test("phalanx march modifiers advance elite and brute escorts without moving support scripts", () => {
  const { content, engine } = createHarness();
  const state = engine.createCombatState({
    content,
    encounterId: "act_4_branch_phalanx",
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
  support.life -= 5;
  ally.life -= 4;
  support.currentIntent = support.intents.find((intent) => intent.kind === "heal_allies");
  assert.ok(support.currentIntent);
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.ok(support.life > support.maxLife - 5);
  assert.ok(ally.life > ally.maxLife - 4);
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
  state.selectedEnemyId = nonElite.id;
  state.hand = [];

  const result = engine.endTurn(state);

  assert.equal(result.ok, true);
  assert.equal(elite.life, elite.maxLife - (state.mercenary.attack + 3));
});
