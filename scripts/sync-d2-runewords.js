#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://diablo-archive.fandom.com/api.php";
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "seeds", "d2", "runewords.json");
const RUNES_SEED_PATH = path.join(ROOT, "data", "seeds", "d2", "runes.json");
const ITEMS_SEED_PATH = path.join(ROOT, "data", "seeds", "d2", "items.json");
const RUNEWORDS_TEMPLATE_TITLE = "Template:Rune Words";
const RUNEWORDS_INDEX_PAGE_URL = "https://diablo-archive.fandom.com/wiki/Rune_Words_(Diablo_II)";
const DETAIL_BATCH_SIZE = 20;
const DEFAULT_RUNEWORD_ICON = "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg";

const RELEASE_KEY_BY_GROUP = {
  "Original Rune Words": "original",
  "1.10 Rune Words": "patch_1_10",
  "1.10 Ladder Rune Words": "patch_1_10_ladder",
  "1.11 Rune Words": "patch_1_11",
};

const ITEM_CATEGORY_ALIASES = {
  Armor: "Body Armor",
  Axe: "Axes",
  Axes: "Axes",
  "Body Armor": "Body Armor",
  Bow: "Bows",
  Bows: "Bows",
  Club: "Clubs",
  Clubs: "Clubs",
  Claw: "Claws",
  Claws: "Claws",
  Crossbow: "Crossbows",
  Crossbows: "Crossbows",
  Hammer: "Hammers",
  Hammers: "Hammers",
  Helm: "Helms",
  Helms: "Helms",
  Mace: "Maces",
  Maces: "Maces",
  "Melee Weapon": "Melee Weapons",
  "Melee Weapons": "Melee Weapons",
  "Missile Weapon": "Missile Weapons",
  "Missile Weapons": "Missile Weapons",
  "Paladin Shield": "Paladin Shields",
  "Paladin Shields": "Paladin Shields",
  Polearm: "Polearms",
  Polearms: "Polearms",
  Scepter: "Scepters",
  Scepters: "Scepters",
  Shield: "Shields",
  Shields: "Shields",
  Staff: "Staves",
  Staves: "Staves",
  Sword: "Swords",
  Swords: "Swords",
  Wand: "Wands",
  Wands: "Wands",
  Weapon: "Weapons",
  Weapons: "Weapons",
};

const MACE_SUBTYPE_BY_NAME = {
  Club: "Clubs",
  "Spiked Club": "Clubs",
  Cudgel: "Clubs",
  "Barbed Club": "Clubs",
  Truncheon: "Clubs",
  "Tyrant Club": "Clubs",
  Mace: "Maces",
  "Morning Star": "Maces",
  Flail: "Maces",
  "Flanged Mace": "Maces",
  "Jagged Star": "Maces",
  Knout: "Maces",
  "Reinforced Mace": "Maces",
  "Devil Star": "Maces",
  Scourge: "Maces",
  "War Hammer": "Hammers",
  Maul: "Hammers",
  "Great Maul": "Hammers",
  "Battle Hammer": "Hammers",
  "War Club": "Hammers",
  "Martel de Fer": "Hammers",
  "Legendary Mallet": "Hammers",
  "Ogre Maul": "Hammers",
  "Thunder Maul": "Hammers",
};

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePageTitle(value) {
  return normalizeWhitespace(String(value || "").replace(/_/g, " "));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]+/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizeMaybeEmpty(value) {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned || cleaned === "-" || /^none$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function cleanMarkup(value) {
  let text = String(value || "");
  const replacements = [
    [/\{\{2\|([^{}|]+)\|([^{}]+)\}\}/g, "$2"],
    [/\{\{2\|([^{}]+)\}\}/g, "$1"],
    [/\{\{p2\|([^{}]+)\}\}/gi, "$1"],
    [/\{\{c\|([^{}|]+)\}\}/gi, "$1"],
    [/\{\{[^{}|]+\|([^{}|]+)\}\}/g, "$1"],
    [/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2"],
    [/\[\[([^\]]+)\]\]/g, "$1"],
    [/'''/g, ""],
    [/''/g, ""],
    [/<br\s*\/?>/gi, "\n"],
    [/&nbsp;/gi, " "],
  ];

  replacements.forEach(([pattern, nextValue]) => {
    text = text.replace(pattern, nextValue);
  });

  return normalizeWhitespace(text);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chunk(source, size) {
  const items = Array.isArray(source) ? source : [];
  const safeSize = Math.max(1, Number.parseInt(size, 10) || 1);
  const result = [];
  for (let index = 0; index < items.length; index += safeSize) {
    result.push(items.slice(index, index + safeSize));
  }
  return result;
}

function readJsonSync(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildApiUrl(params) {
  const url = new URL(API_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchJson(params) {
  const response = await fetch(buildApiUrl(params), {
    headers: {
      "user-agent": "rouge-runeword-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}) for ${response.url}`);
  }
  return response.json();
}

function buildSourceUrl(pageTitle) {
  return `https://diablo-archive.fandom.com/wiki/${encodeURIComponent(String(pageTitle || "").replace(/ /g, "_"))}`;
}

async function fetchPageWikitext(pageTitle) {
  const payload = await fetchJson({
    action: "parse",
    page: pageTitle,
    prop: "wikitext",
  });
  const wikitext = payload?.parse?.wikitext;
  if (typeof wikitext !== "string" || !wikitext.trim()) {
    throw new Error(`Wikitext was empty for ${pageTitle}`);
  }
  return wikitext;
}

async function fetchPageDetailsForTitles(titles) {
  const titleList = [...new Set((Array.isArray(titles) ? titles : []).map((title) => normalizePageTitle(title)).filter(Boolean))];
  const detailMap = new Map();

  for (const titleBatch of chunk(titleList, DETAIL_BATCH_SIZE)) {
    const payload = await fetchJson({
      action: "query",
      prop: "extracts|revisions",
      redirects: "1",
      exintro: "1",
      explaintext: "1",
      rvslots: "main",
      rvprop: "content",
      titles: titleBatch.join("|"),
    });

    (Array.isArray(payload?.query?.pages) ? payload.query.pages : []).forEach((page) => {
      const title = normalizePageTitle(page?.title || "");
      if (!title) {
        return;
      }
      detailMap.set(title, {
        pageId: Number.isInteger(page?.pageid) ? page.pageid : null,
        summary: normalizeMaybeEmpty(page?.extract || ""),
        wikitext: page?.revisions?.[0]?.slots?.main?.content || "",
      });
    });
  }

  return detailMap;
}

async function fetchTemplateWikitextByTitle(titles) {
  const titleList = [...new Set((Array.isArray(titles) ? titles : []).map((title) => normalizePageTitle(title)).filter(Boolean))];
  const detailMap = new Map();

  for (const titleBatch of chunk(titleList, DETAIL_BATCH_SIZE)) {
    const payload = await fetchJson({
      action: "query",
      prop: "revisions",
      redirects: "1",
      rvslots: "main",
      rvprop: "content",
      titles: titleBatch.join("|"),
    });

    (Array.isArray(payload?.query?.pages) ? payload.query.pages : []).forEach((page) => {
      const title = normalizePageTitle(page?.title || "");
      if (!title) {
        return;
      }
      detailMap.set(title, page?.revisions?.[0]?.slots?.main?.content || "");
    });
  }

  return detailMap;
}

function parseReleaseGroups(wikitext) {
  const groups = [];
  const pattern = /\|Group(\d+)\s*=\s*([^\n]+)\n\|Body\1\s*=\s*([\s\S]*?)(?=\n\|Group|\n}})/g;
  for (const match of String(wikitext || "").matchAll(pattern)) {
    const label = normalizeWhitespace(match[2]);
    const names = [...match[3].matchAll(/\{\{2r\|([^}]+)\}\}/g)].map((itemMatch) => normalizeWhitespace(itemMatch[1]));
    if (!label || !names.length) {
      continue;
    }
    groups.push({
      label,
      key: RELEASE_KEY_BY_GROUP[label] || normalizeId(label),
      ladderOnly: /ladder/i.test(label),
      names,
    });
  }
  return groups;
}

function extractRunewordTemplateNames(wikitext) {
  return [...new Set(
    [...String(wikitext || "").matchAll(/\{\{([^{}\n]+? \(Diablo II\))\}\}/g)]
      .map((match) => normalizePageTitle(match[1]))
      .filter((title) => /\(Diablo II\)$/.test(title) && !/^Rune Words$/i.test(title))
  )];
}

function extractTemplateValue(wikitext, key) {
  const match = String(wikitext || "").match(new RegExp(`^\\|${escapeRegex(key)}\\s*=\\s*(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function resolveTemplateConditionalValue(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned.startsWith("{{#if:") || !cleaned.endsWith("}}")) {
    return cleaned;
  }
  const fallback = cleaned.slice(0, -2);
  const lastPipeIndex = fallback.lastIndexOf("|");
  if (lastPipeIndex === -1) {
    return cleaned;
  }
  return fallback.slice(lastPipeIndex + 1).trim();
}

function parseTemplateRuneIngredients(value, runeById) {
  const runes = [...String(value || "").matchAll(/\{\{2\|([^{}|]+)(?:\|[^{}]+)?\}\}/g)].map((match) => normalizeWhitespace(match[1]));
  return runes.map((name) => {
    const id = normalizeId(name);
    const rune = runeById.get(id) || null;
    return {
      id,
      name,
      rank: Number.isInteger(rune?.rank) ? rune.rank : null,
      sourceUrl: rune?.sourceUrl || buildSourceUrl(`${name} (Diablo II)`),
    };
  });
}

function parseStatsList(value) {
  return cleanMarkup(value)
    .split(/\n+/)
    .map((entry) => normalizeWhitespace(entry))
    .filter(Boolean);
}

function parseLevelRequirement(baseStats) {
  const match = cleanMarkup(baseStats).match(/Level Requirement:\s*([0-9]+)/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function normalizeItemCategoryToken(value) {
  return ITEM_CATEGORY_ALIASES[normalizeWhitespace(value)] || normalizeWhitespace(value);
}

function parseBaseItemDescriptor(baseItemValue) {
  const resolved = cleanMarkup(resolveTemplateConditionalValue(baseItemValue));
  const socketsMatch = resolved.match(/([0-9]+)\s+Socket/i);
  const socketsRequired = socketsMatch ? Number.parseInt(socketsMatch[1], 10) : null;
  const categoryText = normalizeWhitespace(resolved.replace(/^[0-9]+\s+Sockets?\s+/i, ""));
  const categories = categoryText
    .split("/")
    .map((token) => normalizeItemCategoryToken(token))
    .filter(Boolean);

  return {
    text: resolved,
    socketsRequired,
    categories,
  };
}

function buildItemCategoryTags(item) {
  const tags = new Set();
  const family = normalizeWhitespace(item?.family || "");
  const name = normalizeWhitespace(item?.name || "");

  if (item?.kind === "weapon") {
    tags.add("Weapons");
  }

  switch (family) {
    case "Amazon Weapons":
      if (/Bow$/i.test(name)) {
        tags.add("Bows");
        tags.add("Missile Weapons");
      } else if (/(Spear|Pike)$/i.test(name)) {
        tags.add("Spears");
        tags.add("Melee Weapons");
      }
      break;
    case "Assassin Katars":
      tags.add("Claws");
      tags.add("Melee Weapons");
      break;
    case "Axes":
      tags.add("Axes");
      tags.add("Melee Weapons");
      break;
    case "Barbarian Helms":
    case "Circlets":
    case "Druid Pelts":
    case "Helms":
      tags.add("Helms");
      break;
    case "Body Armor":
      tags.add("Body Armor");
      break;
    case "Bows":
      tags.add("Bows");
      tags.add("Missile Weapons");
      break;
    case "Crossbows":
      tags.add("Crossbows");
      tags.add("Missile Weapons");
      break;
    case "Daggers":
      tags.add("Daggers");
      tags.add("Melee Weapons");
      break;
    case "Maces": {
      const subtype = MACE_SUBTYPE_BY_NAME[name] || "Maces";
      tags.add(subtype);
      tags.add("Melee Weapons");
      break;
    }
    case "Necromancer Shrunken Heads":
      tags.add("Shields");
      break;
    case "Paladin Shields":
      tags.add("Paladin Shields");
      tags.add("Shields");
      break;
    case "Polearms":
      tags.add("Polearms");
      tags.add("Melee Weapons");
      break;
    case "Scepters":
      tags.add("Scepters");
      tags.add("Melee Weapons");
      break;
    case "Shields":
      tags.add("Shields");
      break;
    case "Sorceress Orbs":
      break;
    case "Spears":
      tags.add("Spears");
      tags.add("Melee Weapons");
      break;
    case "Staves":
      tags.add("Staves");
      tags.add("Melee Weapons");
      break;
    case "Swords":
      tags.add("Swords");
      tags.add("Melee Weapons");
      break;
    case "Wands":
      tags.add("Wands");
      tags.add("Melee Weapons");
      break;
    default:
      break;
  }

  return tags;
}

function resolveEligibleBaseItems(items, categories, socketsRequired) {
  return items
    .filter((item) => {
      const maxSockets = item?.stats?.socketsMax;
      if (!Number.isFinite(maxSockets) || !Number.isFinite(socketsRequired) || maxSockets < socketsRequired) {
        return false;
      }
      const tags = buildItemCategoryTags(item);
      return categories.some((category) => tags.has(category));
    })
    .sort((left, right) => {
      const tierOrder = {
        normal: 0,
        exceptional: 1,
        elite: 2,
      };
      const leftTier = tierOrder[left?.tier] ?? 9;
      const rightTier = tierOrder[right?.tier] ?? 9;
      if (leftTier !== rightTier) {
        return leftTier - rightTier;
      }
      return String(left?.name || "").localeCompare(String(right?.name || ""));
    });
}

function buildRepresentativeBaseItem(items) {
  return items.find((item) => item?.assetRefs?.referenceOnly?.downloadedImage) || items[0] || null;
}

function summarizeVariant(baseItemText, ingredients, levelRequirement, uniqueStats) {
  const ingredientText = ingredients.map((ingredient) => ingredient.name).join(" + ");
  const prefix = `${baseItemText} using ${ingredientText}.`;
  const requirementText = Number.isInteger(levelRequirement) ? ` Req Lv ${levelRequirement}.` : "";
  const highlightText = uniqueStats.slice(0, 3).join(", ");
  return normalizeWhitespace(`${prefix}${requirementText}${highlightText ? ` ${highlightText}.` : ""}`);
}

function buildEntrySummary(pageSummary, variants, ladderOnly) {
  const cleanedPageSummary = normalizeMaybeEmpty(pageSummary);
  if (
    cleanedPageSummary &&
    !/^This Rune Word only works for Ladder characters\.?$/i.test(cleanedPageSummary)
  ) {
    return cleanedPageSummary;
  }

  const fallback = variants[0]?.summary || cleanedPageSummary || null;
  if (!fallback) {
    return cleanedPageSummary;
  }
  if (!ladderOnly || /Ladder/i.test(fallback)) {
    return fallback;
  }
  return `${fallback} Ladder-only runeword.`;
}

function buildRunewordDocument(entries) {
  const byRelease = Object.fromEntries(
    Object.keys(RELEASE_KEY_BY_GROUP).map((label) => [
      label,
      entries.filter((entry) => entry.releaseGroup === label).length,
    ])
  );
  const counts = {
    total: entries.length,
    ladderOnly: entries.filter((entry) => entry.ladderOnly).length,
    multiVariant: entries.filter((entry) => entry.variants.length > 1).length,
    totalVariants: entries.reduce((sum, entry) => sum + entry.variants.length, 0),
    byRelease,
    uniqueRunesReferenced: new Set(
      entries.flatMap((entry) => entry.ingredients.map((ingredient) => ingredient.id).filter(Boolean))
    ).size,
    entriesWithRepresentativeBaseArt: entries.filter((entry) =>
      entry.variants.some((variant) => variant.assetRefs?.referenceOnly?.representativeBaseItemImage)
    ).length,
  };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      pageTitle: "Rune Words (Diablo II)",
      pageUrl: RUNEWORDS_INDEX_PAGE_URL,
      templateTitle: RUNEWORDS_TEMPLATE_TITLE,
      apiUrl: buildApiUrl({
        action: "parse",
        page: RUNEWORDS_TEMPLATE_TITLE,
        prop: "wikitext",
      }),
    },
    counts,
    releaseGroups: Object.entries(RELEASE_KEY_BY_GROUP).map(([label, key]) => ({
      key,
      label,
      count: counts.byRelease[label] || 0,
    })),
    entries,
  };
}

async function main() {
  const runesSeed = readJsonSync(RUNES_SEED_PATH);
  const itemsSeed = readJsonSync(ITEMS_SEED_PATH);
  const runeById = new Map((Array.isArray(runesSeed?.entries) ? runesSeed.entries : []).map((entry) => [entry.id, entry]));
  const items = Array.isArray(itemsSeed?.entries) ? itemsSeed.entries : [];

  const runewordTemplateWikitext = await fetchPageWikitext(RUNEWORDS_TEMPLATE_TITLE);
  const releaseGroups = parseReleaseGroups(runewordTemplateWikitext);
  const runewordEntries = releaseGroups.flatMap((group) =>
    group.names.map((name, index) => ({
      name,
      index,
      releaseGroup: group.label,
      releaseKey: group.key,
      ladderOnly: group.ladderOnly,
      pageTitle: `${name} (Diablo II Rune Word)`,
    }))
  );

  const pageDetailsByTitle = await fetchPageDetailsForTitles(runewordEntries.map((entry) => entry.pageTitle));
  const templateTitles = [
    ...new Set(
      runewordEntries.flatMap((entry) => extractRunewordTemplateNames(pageDetailsByTitle.get(entry.pageTitle)?.wikitext || ""))
    ),
  ].map((title) => `Template:${title}`);
  const templateWikitextByTitle = await fetchTemplateWikitextByTitle(templateTitles);

  const entries = runewordEntries
    .map((runeword) => {
      const pageDetail = pageDetailsByTitle.get(runeword.pageTitle);
      if (!pageDetail) {
        throw new Error(`Missing page detail for ${runeword.pageTitle}`);
      }

      const transcludedTemplates = extractRunewordTemplateNames(pageDetail.wikitext);
      if (!transcludedTemplates.length) {
        throw new Error(`No item templates found for ${runeword.pageTitle}`);
      }

      const variants = transcludedTemplates.map((transcludedTemplate) => {
        const templateTitle = `Template:${transcludedTemplate}`;
        const templateWikitext = templateWikitextByTitle.get(templateTitle) || "";
        if (!templateWikitext.trim()) {
          throw new Error(`Template was empty for ${templateTitle}`);
        }

        const baseItem = parseBaseItemDescriptor(extractTemplateValue(templateWikitext, "baseitem"));
        const ingredients = parseTemplateRuneIngredients(extractTemplateValue(templateWikitext, "ingredients"), runeById);
        const baseStats = parseStatsList(resolveTemplateConditionalValue(extractTemplateValue(templateWikitext, "basestats")));
        const uniqueStats = parseStatsList(extractTemplateValue(templateWikitext, "uniquestats"));
        const eligibleBaseItems = resolveEligibleBaseItems(items, baseItem.categories, baseItem.socketsRequired);
        const representativeBaseItem = buildRepresentativeBaseItem(eligibleBaseItems);
        const variantLabel = normalizeWhitespace(
          transcludedTemplate.replace(/\s+\(Diablo II\)$/i, "")
        );

        return {
          id: normalizeId(variantLabel),
          name: variantLabel,
          templateTitle,
          templateUrl: buildSourceUrl(templateTitle),
          baseItem,
          ingredients,
          levelRequirement: parseLevelRequirement(baseStats.join("\n")),
          baseStats,
          uniqueStats,
          eligibleBaseItems: {
            count: eligibleBaseItems.length,
            itemIds: eligibleBaseItems.map((item) => item.id),
            familyNames: [...new Set(eligibleBaseItems.map((item) => item.family))],
          },
          summary: summarizeVariant(baseItem.text, ingredients, parseLevelRequirement(baseStats.join("\n")), uniqueStats),
          assetRefs: {
            shippingSafeIcon: representativeBaseItem?.assetRefs?.shippingSafeIcon || DEFAULT_RUNEWORD_ICON,
            referenceOnly: {
              representativeBaseItemId: representativeBaseItem?.id || null,
              representativeBaseItemName: representativeBaseItem?.name || null,
              representativeBaseItemImage: representativeBaseItem?.assetRefs?.referenceOnly?.downloadedImage || null,
              representativeBaseItemSourceUrl: representativeBaseItem?.sourceUrl || null,
              ingredientRuneImages: ingredients
                .map((ingredient) => runeById.get(ingredient.id))
                .filter(Boolean)
                .map((rune) => ({
                  id: rune.id,
                  name: rune.name,
                  downloadedImage: rune?.assetRefs?.referenceOnly?.downloadedImage || null,
                  imageUrl: rune?.assetRefs?.referenceOnly?.imageUrl || null,
                  descriptionUrl: rune?.assetRefs?.referenceOnly?.descriptionUrl || null,
                })),
            },
          },
        };
      });

      const primaryIngredients = variants[0].ingredients;
      const representativeBaseImages = variants
        .map((variant) => ({
          variantId: variant.id,
          variantName: variant.name,
          downloadedImage: variant.assetRefs?.referenceOnly?.representativeBaseItemImage || null,
          representativeBaseItemId: variant.assetRefs?.referenceOnly?.representativeBaseItemId || null,
        }))
        .filter((entry) => entry.downloadedImage || entry.representativeBaseItemId);

      return {
        id: normalizeId(runeword.name),
        name: runeword.name,
        pageTitle: runeword.pageTitle,
        pageId: pageDetail.pageId,
        sourceUrl: buildSourceUrl(runeword.pageTitle),
        releaseGroup: runeword.releaseGroup,
        releaseKey: runeword.releaseKey,
        ladderOnly: runeword.ladderOnly,
        summary: buildEntrySummary(pageDetail.summary, variants, runeword.ladderOnly),
        ingredients: primaryIngredients,
        variantNames: variants.map((variant) => variant.name),
        applicableItemCategories: [...new Set(variants.flatMap((variant) => variant.baseItem.categories))],
        variants,
        availability: {
          internalWiki: true,
          rewardPool: false,
          gearCatalog: false,
          note: "D2 runeword reference only; runewords and socketing are not implemented in the Rouge runtime.",
        },
        assetRefs: {
          shippingSafeIcon: DEFAULT_RUNEWORD_ICON,
          referenceOnly: {
            representativeBaseImages,
            ingredientRuneImages: primaryIngredients
              .map((ingredient) => runeById.get(ingredient.id))
              .filter(Boolean)
              .map((rune) => ({
                id: rune.id,
                name: rune.name,
                downloadedImage: rune?.assetRefs?.referenceOnly?.downloadedImage || null,
                imageUrl: rune?.assetRefs?.referenceOnly?.imageUrl || null,
                descriptionUrl: rune?.assetRefs?.referenceOnly?.descriptionUrl || null,
              })),
          },
        },
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const doc = buildRunewordDocument(entries);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(doc, null, 2)}\n`);

  console.log(
    `Synced ${doc.counts.total} Diablo II runewords (${doc.counts.totalVariants} variants) to ${path.relative(ROOT, OUTPUT_PATH)}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
