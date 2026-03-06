const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadClassRuntime() {
  const sandbox = {
    window: {
      BRASSLINE_SEEDS_D2: {
        classes: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/classes.json"), "utf8")),
        skills: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/skills.json"), "utf8")),
      },
    },
  };
  vm.createContext(sandbox);
  const contentSource = fs.readFileSync(path.join(ROOT, "class-content.js"), "utf8");
  const systemSource = fs.readFileSync(path.join(ROOT, "class-system.js"), "utf8");
  new vm.Script(contentSource, { filename: "class-content.js" }).runInContext(sandbox);
  new vm.Script(systemSource, { filename: "class-system.js" }).runInContext(sandbox);
  return {
    classContent: sandbox.window.BRASSLINE_CLASS_CONTENT,
    classSystem: sandbox.window.BRASSLINE_CLASS_SYSTEM,
  };
}

test("class system upgrades nodes and unlocks skills via tree config", () => {
  const { classContent, classSystem } = loadClassRuntime();
  const classCatalog = classContent.getClassCatalog();
  const skillTreeCatalog = classContent.getSkillTreeCatalog();
  const skillCatalog = classContent.getSkillCatalog();
  const spellCatalog = classContent.getSpellCatalog();
  const levelTable = classContent.getLevelTable();

  const classState = classSystem.createDefaultClassState({
    classCatalog,
    skillTreeCatalog,
    spellCatalog,
    classId: "amazon",
  });
  classState.skillPoints = 3;
  classState.level = 6;

  assert.equal(
    classSystem.canUpgradeNode({
      classCatalog,
      skillTreeCatalog,
      classState,
      nodeId: "amazon_amazon_bow_and_crossbow_attunement",
    }),
    true
  );

  const firstUpgrade = classSystem.upgradeNode({
    classCatalog,
    skillTreeCatalog,
    classState,
    nodeId: "amazon_amazon_bow_and_crossbow_attunement",
  });
  assert.equal(firstUpgrade?.nextRank, 1);
  assert.equal(
    classSystem.getNodeBonus({
      classCatalog,
      skillTreeCatalog,
      classState,
      effectId: "tree_attack_bonus_amazon_bow_and_crossbow",
    }),
    1
  );

  const unlockedSkills = classSystem.getUnlockedSkillIds({
    classCatalog,
    skillTreeCatalog,
    classState,
    skillCatalog,
  });
  assert.ok(unlockedSkills.includes("amazon_magic_arrow"));
  assert.ok(unlockedSkills.includes("amazon_multiple_shot"));

  const xpResult = classSystem.gainXp({
    classState,
    amount: 999,
    levelTable,
  });
  assert.ok(xpResult.gainedLevels > 0);
  assert.ok(classState.skillPoints >= 1);
  assert.ok(xpResult.statPointsGained >= 5);
  assert.ok(classState.statPoints >= 5);
});

test("class system enforces skill cooldowns after cast", () => {
  const { classContent, classSystem } = loadClassRuntime();
  const classCatalog = classContent.getClassCatalog();
  const skillTreeCatalog = classContent.getSkillTreeCatalog();
  const skillCatalog = classContent.getSkillCatalog();
  const spellCatalog = classContent.getSpellCatalog();

  const classState = classSystem.createDefaultClassState({
    classCatalog,
    skillTreeCatalog,
    spellCatalog,
    classId: "amazon",
  });
  classState.level = 6;
  classState.nodeRanks.amazon_amazon_bow_and_crossbow_attunement = 1;

  assert.equal(
    classSystem.canUseSkill({
      classCatalog,
      skillTreeCatalog,
      classState,
      skillCatalog,
      skillId: "amazon_multiple_shot",
      phase: "encounter",
      combatSubphase: "player_turn",
      energy: 3,
    }),
    true
  );

  const used = classSystem.useSkill({
    classState,
    skillCatalog,
    skillId: "amazon_multiple_shot",
  });
  assert.equal(used?.id, "amazon_multiple_shot");
  assert.equal(classState.cooldowns.amazon_multiple_shot, 1);

  classSystem.tickSkillCooldowns({ classState });
  assert.equal(classState.cooldowns.amazon_multiple_shot, undefined);
});

test("class system ranks spells and applies same-tree deck synergy", () => {
  const { classContent, classSystem } = loadClassRuntime();
  const classCatalog = classContent.getClassCatalog();
  const skillTreeCatalog = classContent.getSkillTreeCatalog();
  const skillCatalog = classContent.getSkillCatalog();
  const spellCatalog = classContent.getSpellCatalog();

  const classState = classSystem.createDefaultClassState({
    classCatalog,
    skillTreeCatalog,
    spellCatalog,
    classId: "sorceress",
  });
  classState.level = 18;
  classState.nodeRanks.sorceress_sorceress_fire_attunement = 2;

  const rankResult = classSystem.gainSpellRank({
    classState,
    spellCatalog,
    spellId: "sorceress_fireball_spell",
    amount: 2,
  });
  assert.equal(rankResult?.nextRank, 3);

  const breakdown = classSystem.getSpellPowerBreakdown({
    classCatalog,
    skillTreeCatalog,
    classState,
    skillCatalog,
    spellCatalog,
    spellId: "sorceress_fireball_spell",
    deckCardIds: [
      "sorceress_fireball_spell",
      "sorceress_inferno_spell",
      "sorceress_blaze_spell",
    ],
  });

  assert.equal(breakdown.rank, 3);
  assert.ok(breakdown.rankBonus > 0);
  assert.ok(breakdown.sameTreeDistinctBonus > 0);
  assert.ok(breakdown.supportPresenceBonus > 0);
  assert.ok(breakdown.treeNodeBonus > 0);
  assert.ok(breakdown.totalValue > breakdown.baseValue);
});
