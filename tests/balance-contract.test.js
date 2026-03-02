const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const BALANCE_PATH = path.resolve(__dirname, "..", "balance.js");

function loadBalanceConfig() {
  const source = fs.readFileSync(BALANCE_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const script = new vm.Script(source, { filename: BALANCE_PATH });
  script.runInContext(sandbox);
  return sandbox.window.BRASSLINE_BALANCE;
}

test("balance config defines required top-level sections", () => {
  const balance = loadBalanceConfig();
  assert.ok(balance && typeof balance === "object");

  const required = [
    "rules",
    "rewards",
    "telegraph",
    "player",
    "upgrades",
    "upgradePaths",
    "overclock",
    "enemies",
    "cards",
    "progression",
    "ui",
  ];

  required.forEach((key) => {
    assert.ok(key in balance, `Missing balance section: ${key}`);
  });
});

test("progression entries reference known enemy and card ids", () => {
  const balance = loadBalanceConfig();
  const enemyIds = new Set(Object.keys(balance.enemies || {}));
  const cardIds = new Set(Object.keys(balance.cards || {}));

  assert.ok(enemyIds.size > 0, "No enemy ids defined in balance.enemies");
  assert.ok(cardIds.size > 0, "No card ids defined in balance.cards");

  const sectors = balance.progression?.sectors || [];
  assert.ok(Array.isArray(sectors) && sectors.length > 0, "No progression sectors configured");
  sectors.forEach((sector, sectorIndex) => {
    assert.ok(Array.isArray(sector.enemies) && sector.enemies.length > 0, `Sector ${sectorIndex + 1} has no enemies`);
    if ("encounterSize" in sector) {
      assert.ok(
        Number.isInteger(sector.encounterSize) && sector.encounterSize > 0,
        `progression.sectors[${sectorIndex}].encounterSize must be a positive integer`
      );
      assert.ok(
        sector.encounterSize <= sector.enemies.length,
        `progression.sectors[${sectorIndex}].encounterSize cannot exceed enemy pool size`
      );
    }
    sector.enemies.forEach((entry) => {
      assert.ok(
        enemyIds.has(entry.key),
        `Unknown enemy id in progression.sectors[${sectorIndex}]: ${String(entry.key)}`
      );
      assert.ok(Number.isFinite(entry.power) && entry.power > 0, `Invalid enemy power for ${entry.key}`);
      if ("elite" in entry) {
        assert.equal(
          typeof entry.elite,
          "boolean",
          `progression.sectors[${sectorIndex}].enemies entry elite flag must be boolean`
        );
      }
      if ("weight" in entry) {
        assert.ok(
          Number.isFinite(entry.weight) && entry.weight > 0,
          `progression.sectors[${sectorIndex}].enemies entry weight must be > 0`
        );
      }
    });
  });

  const starterDeck = balance.progression?.starterDeck || [];
  assert.ok(Array.isArray(starterDeck) && starterDeck.length > 0, "No progression starter deck configured");
  starterDeck.forEach((cardId) => {
    assert.ok(cardIds.has(cardId), `Unknown card id in progression.starterDeck: ${String(cardId)}`);
  });

  const rewardPool = balance.progression?.rewardPool || [];
  assert.ok(Array.isArray(rewardPool) && rewardPool.length > 0, "No progression reward pool configured");
  rewardPool.forEach((cardId) => {
    assert.ok(cardIds.has(cardId), `Unknown card id in progression.rewardPool: ${String(cardId)}`);
  });

  const interludes = balance.progression?.interludes || [];
  assert.ok(Array.isArray(interludes), "progression.interludes must be an array");
  interludes.forEach((entry, interludeIndex) => {
    assert.ok(Number.isInteger(entry.afterSector), `interludes[${interludeIndex}].afterSector must be an integer`);
    assert.ok(
      typeof entry.type === "string" && (entry.type === "event" || entry.type === "shop"),
      `interludes[${interludeIndex}].type must be event or shop`
    );
    assert.ok(Array.isArray(entry.options) && entry.options.length > 0, `interludes[${interludeIndex}] must define options`);
    entry.options.forEach((option, optionIndex) => {
      assert.ok(
        typeof option.label === "string" && option.label.trim().length > 0,
        `interludes[${interludeIndex}].options[${optionIndex}].label must be non-empty`
      );
      if (option.addCard !== undefined && option.addCard !== null) {
        assert.ok(
          cardIds.has(option.addCard),
          `Unknown card id in interludes[${interludeIndex}].options[${optionIndex}].addCard`
        );
      }
      if (option.removeCard !== undefined && option.removeCard !== null) {
        assert.ok(
          cardIds.has(option.removeCard),
          `Unknown card id in interludes[${interludeIndex}].options[${optionIndex}].removeCard`
        );
      }
      if (option.targetSector !== undefined && option.targetSector !== null) {
        assert.ok(
          Number.isInteger(option.targetSector) && option.targetSector > entry.afterSector,
          `interludes[${interludeIndex}].options[${optionIndex}].targetSector must be an integer > afterSector`
        );
      }
    });
  });
});

test("default progression ships with event + shop interludes and at least one branch route", () => {
  const balance = loadBalanceConfig();
  const interludes = Array.isArray(balance.progression?.interludes) ? balance.progression.interludes : [];

  assert.ok(interludes.length >= 2, "Expected at least 2 default interludes");

  const types = new Set(interludes.map((entry) => entry?.type).filter(Boolean));
  assert.ok(types.has("event"), "Expected at least one default event interlude");
  assert.ok(types.has("shop"), "Expected at least one default shop interlude");

  const hasBranch = interludes.some((entry) =>
    Array.isArray(entry?.options) &&
    entry.options.some((option) => Number.isInteger(option?.targetSector))
  );
  assert.ok(hasBranch, "Expected at least one default branching interlude option");

  const branchOptionCount = interludes.reduce((sum, entry) => {
    if (!Array.isArray(entry?.options)) {
      return sum;
    }
    return sum + entry.options.filter((option) => Number.isInteger(option?.targetSector)).length;
  }, 0);
  assert.ok(branchOptionCount >= 2, "Expected at least two default branch options across interludes");
});

test("default progression includes a targeted deck-thinning interlude option", () => {
  const balance = loadBalanceConfig();
  const interludes = Array.isArray(balance.progression?.interludes) ? balance.progression.interludes : [];
  const hasTargetedThin = interludes.some((entry) =>
    Array.isArray(entry?.options) &&
    entry.options.some((option) => typeof option?.removeCard === "string" && !option?.addCard)
  );

  assert.ok(hasTargetedThin, "Expected at least one remove-only interlude option for deck thinning");
});

test("default progression includes weighted encounter pools with per-run sampling", () => {
  const balance = loadBalanceConfig();
  const sectors = Array.isArray(balance.progression?.sectors) ? balance.progression.sectors : [];

  const hasSampledPool = sectors.some((sector) => {
    const encounterSize = sector?.encounterSize;
    const enemyCount = Array.isArray(sector?.enemies) ? sector.enemies.length : 0;
    return Number.isInteger(encounterSize) && encounterSize > 0 && encounterSize < enemyCount;
  });
  assert.ok(hasSampledPool, "Expected at least one default sector with encounterSize smaller than pool size");

  const hasWeightedEnemy = sectors.some((sector) =>
    Array.isArray(sector?.enemies) && sector.enemies.some((entry) => Number.isFinite(entry?.weight) && entry.weight > 1)
  );
  assert.ok(hasWeightedEnemy, "Expected at least one weighted enemy entry in default progression");
});

test("upgrade path ids and max levels are valid", () => {
  const balance = loadBalanceConfig();
  const paths = balance.upgradePaths || {};
  const ids = Object.keys(paths).sort();
  const expectedIds = ["condenser_bank", "coolant_loop", "guard_protocol", "hull_plating"];

  assert.deepEqual(ids, expectedIds);
  ids.forEach((id) => {
    const entry = paths[id];
    assert.equal(typeof entry.title, "string", `upgradePaths.${id}.title must be string`);
    assert.equal(typeof entry.description, "string", `upgradePaths.${id}.description must be string`);
    assert.equal(typeof entry.icon, "string", `upgradePaths.${id}.icon must be string`);
    assert.ok(Number.isFinite(entry.maxLevel), `upgradePaths.${id}.maxLevel must be numeric`);
    assert.ok(entry.maxLevel >= 1, `upgradePaths.${id}.maxLevel must be >= 1`);
  });
});

test("card and enemy payloads contain required baseline fields", () => {
  const balance = loadBalanceConfig();

  Object.entries(balance.cards || {}).forEach(([cardId, card]) => {
    assert.ok(Number.isFinite(card.cost), `cards.${cardId}.cost must be numeric`);
    assert.equal(typeof card.text, "string", `cards.${cardId}.text must be string`);
    assert.equal(typeof card.heatText, "string", `cards.${cardId}.heatText must be string`);
  });

  Object.entries(balance.enemies || {}).forEach(([enemyId, enemy]) => {
    assert.ok(Number.isFinite(enemy.maxHp), `enemies.${enemyId}.maxHp must be numeric`);
    assert.ok(Array.isArray(enemy.intents) && enemy.intents.length > 0, `enemies.${enemyId}.intents must be non-empty`);
    enemy.intents.forEach((intent, intentIndex) => {
      assert.ok(
        Number.isFinite(intent.value),
        `enemies.${enemyId}.intents[${intentIndex}].value must be numeric`
      );
    });
  });
});

test("default card set includes at least one keyword rules card", () => {
  const balance = loadBalanceConfig();
  const cardEntries = Object.entries(balance.cards || {});
  const hasComboKeyword = cardEntries.some(([_cardId, card]) =>
    typeof card?.text === "string" && /\bcombo:/i.test(card.text)
  );

  assert.ok(hasComboKeyword, "Expected at least one card text to define the Combo keyword");
});

test("default card set includes at least one Firstfire keyword card", () => {
  const balance = loadBalanceConfig();
  const cardEntries = Object.entries(balance.cards || {});
  const hasFirstfireKeyword = cardEntries.some(([_cardId, card]) =>
    typeof card?.text === "string" && /\bfirstfire:/i.test(card.text)
  );

  assert.ok(hasFirstfireKeyword, "Expected at least one card text to define the Firstfire keyword");
});
