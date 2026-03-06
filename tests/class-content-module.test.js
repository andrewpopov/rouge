const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function loadClassContent() {
  const sandbox = {
    window: {
      BRASSLINE_SEEDS_D2: {
        classes: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/classes.json"), "utf8")),
        skills: JSON.parse(fs.readFileSync(path.join(ROOT, "data/seeds/d2/skills.json"), "utf8")),
      },
    },
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(ROOT, "class-content.js"), "utf8");
  new vm.Script(source, { filename: "class-content.js" }).runInContext(sandbox);
  return sandbox.window.BRASSLINE_CLASS_CONTENT;
}

test("class content module exposes editable providers with clone semantics", () => {
  const classContent = loadClassContent();
  assert.equal(typeof classContent?.getLevelTable, "function");
  assert.equal(typeof classContent?.getClassCatalog, "function");
  assert.equal(typeof classContent?.getSkillTreeCatalog, "function");
  assert.equal(typeof classContent?.getSkillCatalog, "function");
  assert.equal(typeof classContent?.getSpellCatalog, "function");
  assert.equal(typeof classContent?.getItemCatalog, "function");

  const classesA = classContent.getClassCatalog();
  const classesB = classContent.getClassCatalog();
  classesA.amazon.title = "Mutated";
  assert.notEqual(classesB.amazon.title, "Mutated");

  const skills = classContent.getSkillCatalog();
  const spells = classContent.getSpellCatalog();
  const items = classContent.getItemCatalog();
  const levelTable = classContent.getLevelTable();
  const trees = classContent.getSkillTreeCatalog();

  assert.equal(Array.isArray(levelTable), true);
  assert.ok(levelTable.length > 1);
  assert.ok(Object.keys(classesB).length >= 7);
  assert.equal(classesB.sorceress.archetype, "caster");
  assert.ok(Array.isArray(classesB.sorceress.treeIds));
  assert.equal(skills.amazon_magic_arrow.spellId, "amazon_magic_arrow_spell");
  assert.equal(skills.amazon_magic_arrow.treeId, "amazon_bow_and_crossbow");
  assert.equal(spells.amazon_magic_arrow_spell.linkedSkillId, "amazon_magic_arrow");
  assert.equal(spells.amazon_magic_arrow_spell.rankCap, 5);
  assert.equal(spells.sorceress_fireball_spell.deckSynergy.sameTreeDistinctBonus >= 1, true);
  assert.equal(trees.sorceress_discipline_path.nodes.length, 3);
  assert.equal(items.chipped_ruby.effects.res_fire, 6);
  assert.ok(Array.isArray(classesB.amazon.starterItemIds));
});
