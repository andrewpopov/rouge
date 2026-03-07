#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://diablo-archive.fandom.com/api.php";
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "seeds", "d2", "items.json");
const ITEM_WIKI_IMAGE_DIRECTORY = path.join(
  ROOT,
  "assets",
  "diablo2_downloads",
  "potential_art",
  "items",
  "wiki"
);
const DETAIL_BATCH_SIZE = 20;
const IMAGE_INFO_BATCH_SIZE = 20;
const ITEMS_INDEX_PAGE_TITLE = "Items (Diablo II)";
const ITEMS_INDEX_PAGE_URL = "https://diablo-archive.fandom.com/wiki/Items_(Diablo_II)";
const ITEM_FAMILY_PAGES = [
  { kind: "weapon", family: "Axes", pageTitle: "Axes (Diablo II)" },
  { kind: "weapon", family: "Bows", pageTitle: "Bows (Diablo II)" },
  { kind: "weapon", family: "Crossbows", pageTitle: "Crossbows (Diablo II)" },
  { kind: "weapon", family: "Daggers", pageTitle: "Daggers (Diablo II)" },
  { kind: "weapon", family: "Javelins", pageTitle: "Javelins (Diablo II)" },
  { kind: "weapon", family: "Maces", pageTitle: "Maces (Diablo II)" },
  { kind: "weapon", family: "Polearms", pageTitle: "Polearms (Diablo II)" },
  { kind: "weapon", family: "Scepters", pageTitle: "Scepters (Diablo II)" },
  { kind: "weapon", family: "Spears", pageTitle: "Spears (Diablo II)" },
  { kind: "weapon", family: "Staves", pageTitle: "Staves (Diablo II)" },
  { kind: "weapon", family: "Swords", pageTitle: "Swords (Diablo II)" },
  { kind: "weapon", family: "Throwing Weapons", pageTitle: "Throwing Weapons (Diablo II)" },
  { kind: "weapon", family: "Wands", pageTitle: "Wands (Diablo II)" },
  { kind: "weapon", family: "Amazon Weapons", pageTitle: "Amazon Weapons (Diablo II)" },
  { kind: "weapon", family: "Assassin Katars", pageTitle: "Assassin Katars (Diablo II)" },
  { kind: "weapon", family: "Sorceress Orbs", pageTitle: "Sorceress Orbs (Diablo II)" },
  { kind: "armor", family: "Body Armor", pageTitle: "Body Armor (Diablo II)" },
  { kind: "armor", family: "Belts", pageTitle: "Belts (Diablo II)" },
  { kind: "armor", family: "Boots", pageTitle: "Boots (Diablo II)" },
  { kind: "armor", family: "Circlets", pageTitle: "Circlets (Diablo II)" },
  { kind: "armor", family: "Gloves", pageTitle: "Gloves (Diablo II)" },
  { kind: "armor", family: "Helms", pageTitle: "Helms (Diablo II)" },
  { kind: "armor", family: "Shields", pageTitle: "Shields (Diablo II)" },
  { kind: "armor", family: "Barbarian Helms", pageTitle: "Barbarian Helms (Diablo II)" },
  { kind: "armor", family: "Druid Pelts", pageTitle: "Druid Pelts (Diablo II)" },
  { kind: "armor", family: "Necromancer Shrunken Heads", pageTitle: "Necromancer Shrunken Heads (Diablo II)" },
  { kind: "armor", family: "Paladin Shields", pageTitle: "Paladin Shields (Diablo II)" },
];

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

function normalizeFileTitle(value) {
  return normalizeWhitespace(String(value || "").replace(/^File:/i, "").replace(/_/g, " "));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
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

function chunk(source, size) {
  const items = Array.isArray(source) ? source : [];
  const safeSize = Math.max(1, Number.parseInt(size, 10) || 1);
  const result = [];
  for (let index = 0; index < items.length; index += safeSize) {
    result.push(items.slice(index, index + safeSize));
  }
  return result;
}

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, {
    recursive: true,
  });
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_error) {
    return false;
  }
}

function safeAssetFileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9()._-]+/g, "_");
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
      "user-agent": "rouge-item-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}) for ${response.url}`);
  }
  return response.json();
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

async function fetchImageInfoForTitles(titles) {
  const titleList = [...new Set((Array.isArray(titles) ? titles : []).map((title) => normalizeFileTitle(title)).filter(Boolean))];
  const imageInfoByTitle = new Map();

  for (const titleBatch of chunk(titleList, IMAGE_INFO_BATCH_SIZE)) {
    const payload = await fetchJson({
      action: "query",
      prop: "imageinfo",
      iiprop: "url",
      titles: titleBatch.map((title) => (String(title).startsWith("File:") ? title : `File:${title}`)).join("|"),
    });

    (Array.isArray(payload?.query?.pages) ? payload.query.pages : []).forEach((page) => {
      const normalizedTitle = normalizeFileTitle(page?.title || "");
      if (!normalizedTitle) {
        return;
      }

      const imageInfo = page?.imageinfo?.[0] || null;
      imageInfoByTitle.set(normalizedTitle, {
        title: normalizeWhitespace(page?.title || ""),
        url: imageInfo?.url || null,
        descriptionUrl: imageInfo?.descriptionurl || null,
        descriptionShortUrl: imageInfo?.descriptionshorturl || null,
      });
    });
  }

  return imageInfoByTitle;
}

async function downloadFileToPath(url, destinationPath) {
  ensureDirectorySync(path.dirname(destinationPath));
  const response = await fetch(url, {
    headers: {
      "user-agent": "rouge-item-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Asset download failed (${response.status} ${response.statusText}) for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destinationPath, buffer);
}

async function resolveItemWikiImageAssets(entries) {
  const titles = [...new Set(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => normalizeFileTitle(entry?.imageTitle || ""))
      .filter(Boolean)
  )];
  const imageInfoByTitle = await fetchImageInfoForTitles(titles);
  const assetsByTitle = new Map();

  for (const title of titles) {
    const imageInfo = imageInfoByTitle.get(title) || null;
    if (!imageInfo?.url) {
      continue;
    }

    const fileName = safeAssetFileName(String(imageInfo.title || title).replace(/^File:/i, ""));
    const absolutePath = path.join(ITEM_WIKI_IMAGE_DIRECTORY, fileName);
    if (!fileExists(absolutePath)) {
      await downloadFileToPath(imageInfo.url, absolutePath);
    }

    assetsByTitle.set(title, {
      title: imageInfo.title || `File:${title}`,
      url: imageInfo.url,
      descriptionUrl: imageInfo.descriptionUrl || null,
      descriptionShortUrl: imageInfo.descriptionShortUrl || null,
      path: path.relative(ROOT, absolutePath),
    });
  }

  return assetsByTitle;
}

function buildSourceUrl(pageTitle) {
  return `https://diablo-archive.fandom.com/wiki/${encodeURIComponent(String(pageTitle || "").replace(/ /g, "_"))}`;
}

function extractBalancedTemplates(sourceText, startToken) {
  const source = String(sourceText || "");
  const matches = [];
  let cursor = 0;

  while (cursor < source.length) {
    const startIndex = source.indexOf(startToken, cursor);
    if (startIndex === -1) {
      break;
    }

    let index = startIndex;
    let depth = 0;
    while (index < source.length - 1) {
      const pair = source.slice(index, index + 2);
      if (pair === "{{") {
        depth += 1;
        index += 2;
        continue;
      }
      if (pair === "}}") {
        depth -= 1;
        index += 2;
        if (depth === 0) {
          matches.push(source.slice(startIndex, index));
          break;
        }
        continue;
      }
      index += 1;
    }

    cursor = index;
  }

  return matches;
}

function parseTemplateFields(templateText) {
  const fields = {};
  const lines = String(templateText || "").split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      return;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      return;
    }

    const key = trimmed.slice(1, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!key) {
      return;
    }
    fields[key] = normalizeMaybeEmpty(value);
  });

  return fields;
}

function parseItemFamilyPage(config, wikitext) {
  const lines = String(wikitext || "").split("\n");
  const entries = [];
  let tier = null;
  let subgroup = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const tierMatch = trimmed.match(/^==\s*(Normal|Exceptional|Elite)\s*==$/i);
    if (tierMatch) {
      tier = String(tierMatch[1] || "").toLowerCase();
      subgroup = null;
      return;
    }

    const subgroupMatch = trimmed.match(/^===\s*(.+?)\s*===$/);
    if (subgroupMatch) {
      subgroup = normalizeWhitespace(subgroupMatch[1]);
      return;
    }

    const dataMatches = Array.from(trimmed.matchAll(/\{\{\s*(Data:Items\/[^}|]+?)\s*\}\}/gi));
    dataMatches.forEach((match) => {
      const dataPageTitle = normalizePageTitle(match[1]);
      const name = normalizeWhitespace(
        dataPageTitle.replace(/^Data:Items\//i, "").replace(/\s*\(Diablo II\)\s*$/i, "")
      );
      entries.push({
        id: normalizeId(name),
        name,
        kind: config.kind,
        family: config.family,
        familyOrder: entries.length + 1,
        familyPageTitle: config.pageTitle,
        familyPageUrl: buildSourceUrl(config.pageTitle),
        dataPageTitle,
        dataPageUrl: buildSourceUrl(dataPageTitle),
        tier,
        subgroup,
      });
    });
  });

  return entries;
}

function parseInteger(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const cleaned = String(value).replace(/%/g, "").trim();
  if (!cleaned || cleaned === "-" || /^indestructible$/i.test(cleaned)) {
    return null;
  }
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseRange(minValue, maxValue) {
  const min = parseInteger(minValue);
  const max = parseInteger(maxValue);
  if (min === null && max === null) {
    return null;
  }
  return {
    min,
    max,
  };
}

function formatRange(range) {
  if (!range || (range.min === null && range.max === null)) {
    return null;
  }
  if (range.min !== null && range.max !== null) {
    return `${range.min}-${range.max}`;
  }
  return String(range.min ?? range.max);
}

function titleCaseTier(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "normal") {
    return "Normal";
  }
  if (normalized === "exceptional") {
    return "Exceptional";
  }
  if (normalized === "elite") {
    return "Elite";
  }
  if (normalized === "untiered") {
    return "Untiered";
  }
  return normalizeWhitespace(value);
}

function inferShippingSafeIcon(entry) {
  if (entry.kind === "weapon") {
    if (/mace|wand|scepter|stave|orb/i.test(entry.family)) {
      return "./assets/curated/themes/diablo-inspired/icons/cards/20_bone-mace.svg";
    }
    return "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg";
  }

  if (/glove/i.test(entry.family)) {
    return "./assets/curated/themes/diablo-inspired/icons/cards/08_gauntlet.svg";
  }
  return "./assets/curated/themes/diablo-inspired/icons/cards/18_chest-armor.svg";
}

function buildItemSummary(entry) {
  const lead = [
    titleCaseTier(entry.tier || "untiered"),
    entry.kind === "weapon" ? "weapon" : "armor",
    entry.subgroup ? `from ${entry.subgroup}` : `from ${entry.family}`,
  ]
    .filter(Boolean)
    .join(" ");

  const details = [];
  const oneHand = formatRange(entry.stats?.damage?.oneHand);
  const twoHand = formatRange(entry.stats?.damage?.twoHand);
  const throwDamage = formatRange(entry.stats?.damage?.throw);
  const defense = formatRange(entry.stats?.defense);
  const smite = formatRange(entry.stats?.damage?.smite);
  const kick = formatRange(entry.stats?.damage?.kick);

  if (oneHand) {
    details.push(`1H ${oneHand} damage`);
  }
  if (twoHand) {
    details.push(`2H ${twoHand} damage`);
  }
  if (throwDamage) {
    details.push(`throw ${throwDamage} damage`);
  }
  if (defense) {
    details.push(`${defense} defense`);
  }
  if (smite) {
    details.push(`${smite} smite damage`);
  }
  if (kick) {
    details.push(`${kick} kick damage`);
  }
  if (entry.stats?.speed !== null) {
    details.push(`speed ${entry.stats.speed}`);
  }
  if (entry.stats?.meleeRange !== null) {
    details.push(`range ${entry.stats.meleeRange}`);
  }
  if (entry.requirements?.strength !== null) {
    details.push(`Req Str ${entry.requirements.strength}`);
  }
  if (entry.requirements?.dexterity !== null) {
    details.push(`Req Dex ${entry.requirements.dexterity}`);
  }
  if (entry.requirements?.level !== null) {
    details.push(`Req Lv ${entry.requirements.level}`);
  }
  if (entry.stats?.socketsMax !== null) {
    details.push(`${entry.stats.socketsMax} sockets max`);
  }
  if (entry.stats?.potionSlots !== null) {
    details.push(`${entry.stats.potionSlots} potion slots`);
  }
  if (entry.stats?.armorType) {
    details.push(`${entry.stats.armorType} armor`);
  }

  return `${lead}. ${details.join(", ")}.`
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function buildItemEntry(indexEntry, fields, wikiImageAsset) {
  const imageTitle = normalizeFileTitle(fields.image || "");
  const entry = {
    id: indexEntry.id,
    name: fields.item_name_en || indexEntry.name,
    kind: indexEntry.kind,
    family: indexEntry.family,
    familyOrder: indexEntry.familyOrder,
    familyPageTitle: indexEntry.familyPageTitle,
    familyPageUrl: indexEntry.familyPageUrl,
    dataPageTitle: indexEntry.dataPageTitle,
    dataPageUrl: indexEntry.dataPageUrl,
    tier: indexEntry.tier,
    subgroup: indexEntry.subgroup || null,
    sourceUrl: indexEntry.familyPageUrl,
    imageTitle,
    notableSetItem: fields.set_name || null,
    notableUniqueItem: fields.item_unique || null,
    qualityLevel: parseInteger(fields.item_quality),
    requirements: {
      strength: parseInteger(fields.item_req_str),
      dexterity: parseInteger(fields.item_req_dex),
      level: parseInteger(fields.item_req_level),
    },
    stats: {
      defense: parseRange(fields.item_defense_min, fields.item_defense_max),
      damage: {
        oneHand: parseRange(fields.item_damage_1H_min, fields.item_damage_1H_max),
        twoHand: parseRange(fields.item_damage_2H_min, fields.item_damage_2H_max),
        throw: parseRange(fields.item_damage_throw_min, fields.item_damage_throw_max),
        smite: parseRange(fields.item_smite_dmg_min, fields.item_smite_dmg_max),
        kick: parseRange(fields.item_kick_dmg_min, fields.item_kick_dmg_max),
      },
      meleeRange: parseInteger(fields.item_melee_range),
      speed: parseInteger(fields.item_speed),
      durability: {
        value: parseInteger(fields.item_durability),
        raw: fields.item_durability || null,
      },
      socketsMax: parseInteger(fields.item_sockets_max),
      potionSlots: parseInteger(fields.item_potion_slots),
      armorType: fields.item_armor_type || null,
      blockChance: {
        paladin: parseInteger(fields.item_block_P),
        amazonAssassinBarbarian: parseInteger(fields.item_block_AmAsB),
        druidNecromancerSorceress: parseInteger(fields.item_block_DNS),
      },
    },
    availability: {
      internalWiki: true,
      rewardPool: false,
      gearCatalog: false,
      note: "Base D2 reference item only; not automatically available in Rouge runtime rewards.",
    },
    assetRefs: {
      shippingSafeIcon: inferShippingSafeIcon(indexEntry),
      referenceOnly: {
        sourceImage: imageTitle || null,
        downloadedImage: wikiImageAsset?.path || null,
        imageUrl: wikiImageAsset?.url || null,
        descriptionUrl: wikiImageAsset?.descriptionUrl || null,
      },
    },
  };

  entry.summary = buildItemSummary(entry);
  return entry;
}

function buildOutput(entries) {
  const counts = (Array.isArray(entries) ? entries : []).reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.kind === "weapon") {
        acc.weapons += 1;
      } else if (entry.kind === "armor") {
        acc.armor += 1;
      }
      if (entry.tier && Object.hasOwn(acc.byTier, entry.tier)) {
        acc.byTier[entry.tier] += 1;
      } else {
        acc.byTier.untiered += 1;
      }
      acc.byFamily[entry.family] = (acc.byFamily[entry.family] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      weapons: 0,
      armor: 0,
      byTier: {
        normal: 0,
        exceptional: 0,
        elite: 0,
        untiered: 0,
      },
      byFamily: {},
    }
  );

  const families = ITEM_FAMILY_PAGES.map((config) => ({
    ...config,
    pageUrl: buildSourceUrl(config.pageTitle),
    itemCount: counts.byFamily[config.family] || 0,
  }));

  return {
    version: `d2-items-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    source: {
      indexPageTitle: ITEMS_INDEX_PAGE_TITLE,
      indexPage: ITEMS_INDEX_PAGE_URL,
      api: API_URL,
      pageSource: "Diablo Archive Fandom MediaWiki API",
      downloadedWikiImageDir: path.relative(ROOT, ITEM_WIKI_IMAGE_DIRECTORY),
      notes: "All downloaded item art is reference-only and not shipping-safe production art.",
    },
    counts: {
      ...counts,
      uniqueWikiSourceImages: 0,
    },
    families,
    entries,
  };
}

async function main() {
  const indexedEntries = [];

  for (const config of ITEM_FAMILY_PAGES) {
    const wikitext = await fetchPageWikitext(config.pageTitle);
    indexedEntries.push(...parseItemFamilyPage(config, wikitext));
  }

  const templateWikitextByTitle = await fetchTemplateWikitextByTitle(indexedEntries.map((entry) => entry.dataPageTitle));
  const parsedEntries = indexedEntries.map((entry) => {
    const wikitext = templateWikitextByTitle.get(entry.dataPageTitle) || "";
    const displayTemplate = extractBalancedTemplates(wikitext, "{{Item Display (Diablo II)").map(parseTemplateFields)[0] || {};
    return {
      ...entry,
      imageTitle: normalizeFileTitle(displayTemplate.image || ""),
      fields: displayTemplate,
    };
  });

  const wikiImageAssets = await resolveItemWikiImageAssets(parsedEntries);
  const finalEntries = parsedEntries
    .map((entry) =>
      buildItemEntry(entry, entry.fields, wikiImageAssets.get(normalizeFileTitle(entry.imageTitle || "")) || null)
    )
    .sort((left, right) => {
      const kindOrder = String(left.kind).localeCompare(String(right.kind));
      if (kindOrder !== 0) {
        return kindOrder;
      }
      const familyOrder = String(left.family).localeCompare(String(right.family));
      if (familyOrder !== 0) {
        return familyOrder;
      }
      const tierOrder =
        ["normal", "exceptional", "elite", "untiered"].indexOf(left.tier || "untiered") -
        ["normal", "exceptional", "elite", "untiered"].indexOf(right.tier || "untiered");
      if (tierOrder !== 0) {
        return tierOrder;
      }
      const familyIndexOrder = (left.familyOrder || 0) - (right.familyOrder || 0);
      if (familyIndexOrder !== 0) {
        return familyIndexOrder;
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    });

  const output = buildOutput(finalEntries);
  output.counts.uniqueWikiSourceImages = wikiImageAssets.size;

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outputPath: path.relative(ROOT, OUTPUT_PATH),
        counts: output.counts,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
