#!/usr/bin/env node

const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HARNESS_PATH = path.join(ROOT, "generated", "tests", "helpers", "browser-harness.js");

const EFFECT_WEIGHTS = {
  damage: 1.0,
  damage_all: 1.7,
  gain_guard_self: 0.75,
  gain_guard_party: 1.2,
  heal_hero: 0.7,
  heal_mercenary: 0.45,
  draw: 3.5,
  mark_enemy_for_mercenary: 0.75,
  buff_mercenary_next_attack: 0.65,
  apply_burn: 1.15,
  apply_burn_all: 1.8,
  apply_poison: 1.1,
  apply_poison_all: 1.7,
  apply_slow: 2.0,
  apply_slow_all: 3.1,
  apply_freeze: 3.2,
  apply_freeze_all: 4.8,
  apply_stun: 3.8,
  apply_stun_all: 5.2,
  apply_paralyze: 2.8,
  apply_paralyze_all: 4.2,
};

function parseArgs(argv) {
  return {
    classId: argv.includes("--class")
      ? argv[argv.indexOf("--class") + 1] || ""
      : "",
    json: argv.includes("--json"),
  };
}

function getClassIdFromCardId(cardId) {
  return String(cardId || "").split("_")[0] || "unknown";
}

function inferRole(card) {
  const effects = Array.isArray(card.effects) ? card.effects : [];
  const hasAoe = effects.some((effect) => String(effect.kind || "").endsWith("_all"));
  const hasDamage = effects.some((effect) => effect.kind === "damage" || effect.kind === "damage_all");
  const hasSupport = effects.some((effect) =>
    [
      "gain_guard_self",
      "gain_guard_party",
      "heal_hero",
      "heal_mercenary",
      "draw",
      "mark_enemy_for_mercenary",
      "buff_mercenary_next_attack",
    ].includes(effect.kind)
  );

  if (hasAoe && hasSupport) {
    return "aoe_hybrid";
  }
  if (hasAoe) {
    return "aoe";
  }
  if (hasDamage && hasSupport) {
    return "hybrid";
  }
  if (hasDamage) {
    return "single";
  }
  return "support";
}

function scoreCard(card) {
  return Number(
    (Array.isArray(card.effects) ? card.effects : []).reduce((total, effect) => {
      const weight = EFFECT_WEIGHTS[effect.kind] || 0;
      return total + weight * Number(effect.value || 0);
    }, 0).toFixed(2)
  );
}

function buildAuditEntries(browserWindow, classFilter) {
  const cards = Object.values(browserWindow?.__ROUGE_CLASS_CARDS?.classCardCatalog || {});
  return cards
    .map((card) => {
      const classId = getClassIdFromCardId(card.id);
      return {
        classId,
        cardId: card.id,
        title: card.title,
        tier: Number(card.tier || 0),
        cost: Number(card.cost || 0),
        role: inferRole(card),
        proficiency: card.proficiency || "neutral",
        score: scoreCard(card),
        effects: Array.isArray(card.effects) ? card.effects.map((effect) => `${effect.kind}:${effect.value}`).join(", ") : "",
      };
    })
    .filter((entry) => !classFilter || entry.classId === classFilter);
}

function summarizeEntries(entries) {
  const groupMap = new Map();
  for (const entry of entries) {
    const key = `${entry.tier}|${entry.cost}|${entry.role}`;
    const existing = groupMap.get(key) || { key, total: 0, count: 0 };
    existing.total += entry.score;
    existing.count += 1;
    groupMap.set(key, existing);
  }

  return entries
    .map((entry) => {
      const key = `${entry.tier}|${entry.cost}|${entry.role}`;
      const group = groupMap.get(key);
      const average = group ? group.total / Math.max(1, group.count) : entry.score;
      const delta = Number((entry.score - average).toFixed(2));
      const ratio = Number((entry.score / Math.max(0.01, average)).toFixed(2));
      return {
        ...entry,
        groupAverage: Number(average.toFixed(2)),
        deltaFromBand: delta,
        ratioToBand: ratio,
      };
    })
    .sort((left, right) => left.classId.localeCompare(right.classId) || left.tier - right.tier || left.cost - right.cost || left.title.localeCompare(right.title));
}

function printHumanReport(entries) {
  const byClass = new Map();
  for (const entry of entries) {
    const list = byClass.get(entry.classId) || [];
    list.push(entry);
    byClass.set(entry.classId, list);
  }

  for (const [classId, classEntries] of byClass.entries()) {
    console.log(`\n${classId}`);
    classEntries.forEach((entry) => {
      console.log(
        `  T${entry.tier} C${entry.cost} ${entry.role.padEnd(10)} ${String(entry.proficiency).padEnd(18)} ${entry.title.padEnd(22)} score ${entry.score.toFixed(2)} | band ${entry.groupAverage.toFixed(2)} | ${entry.ratioToBand.toFixed(2)}x`
      );
    });
  }

  const outliers = [...entries]
    .filter((entry) => entry.ratioToBand <= 0.85 || entry.ratioToBand >= 1.15)
    .sort((left, right) => Math.abs(right.deltaFromBand) - Math.abs(left.deltaFromBand));

  console.log("\nOutliers");
  outliers.slice(0, 30).forEach((entry) => {
    const direction = entry.deltaFromBand >= 0 ? "+" : "";
    console.log(
      `  ${entry.classId} ${entry.title}: T${entry.tier} C${entry.cost} ${entry.role}, ${entry.proficiency}, score ${entry.score.toFixed(2)}, band ${entry.groupAverage.toFixed(2)}, delta ${direction}${entry.deltaFromBand.toFixed(2)}`
    );
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { createAppHarness } = require(HARNESS_PATH);
  const harness = createAppHarness();
  const entries = summarizeEntries(buildAuditEntries(harness.browserWindow, options.classId));

  if (options.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  printHumanReport(entries);
}

main();
