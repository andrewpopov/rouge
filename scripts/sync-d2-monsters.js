#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://diablo-archive.fandom.com/api.php";
const INDEX_PAGE_TITLE = "Monsters (Diablo II)";
const INDEX_PAGE_URL = "https://diablo-archive.fandom.com/wiki/Monsters_(Diablo_II)";
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "seeds", "d2", "monsters.json");
const OUTPUT_BOSSES_PATH = path.join(ROOT, "data", "seeds", "d2", "bosses.json");
const OUTPUT_BOSS_ASSETS_PATH = path.join(ROOT, "data", "seeds", "d2", "boss-assets-manifest.json");
const ENEMY_POOLS_PATH = path.join(ROOT, "data", "seeds", "d2", "enemy-pools.json");
const ASSETS_MANIFEST_PATH = path.join(ROOT, "data", "seeds", "d2", "assets-manifest.json");
const SPRITER_ASSET_NAME_MAP_PATH = path.join(ROOT, "assets", "diablo2_downloads", "spriters_asset_name_map.tsv");
const SPRITER_RAW_DIRECTORY = path.join(ROOT, "assets", "diablo2_downloads", "organized", "sprites", "raw", "spriters");
const BOSS_WIKI_IMAGE_DIRECTORY = path.join(
  ROOT,
  "assets",
  "diablo2_downloads",
  "potential_art",
  "bosses",
  "wiki"
);
const DETAIL_BATCH_SIZE = 12;
const IMAGE_INFO_BATCH_SIZE = 20;
const REFERENCE_ASSET_DIRECTORIES = [
  path.join(ROOT, "assets", "diablo2_downloads", "potential_art", "monsters_random", "sprites"),
  path.join(ROOT, "assets", "diablo2_downloads", "potential_art", "bosses", "sprites"),
  path.join(ROOT, "assets", "diablo2_downloads", "potential_art", "armor_sets", "sprites"),
  path.join(ROOT, "assets", "diablo2_downloads", "organized", "sprites", "extracted"),
];
const BOSS_ASSET_MATCH_ORDER = {
  exact: 0,
  variant: 1,
  family: 2,
  surrogate: 3,
  missing: 4,
};
const BOSS_ASSET_CLASS_ORDER = {
  sprite: 0,
  page_image: 1,
  unknown: 2,
};
const BOSS_ASSET_SOURCE_ORDER = {
  spriter_exact_name: 0,
  assets_manifest: 1,
  local_scored_candidate: 2,
  wiki_source_image: 3,
};
const SHIPPING_SAFE_ICON_DEFAULTS = {
  regular: "./assets/curated/themes/diablo-inspired/icons/enemies/01_diablo-skull.svg",
  super_unique: "./assets/curated/themes/diablo-inspired/icons/enemies/12_crowned-skull.svg",
  uber: "./assets/curated/themes/diablo-inspired/icons/enemies/11_dragon-head.svg",
};
const SHIPPING_SAFE_ICON_RULES = [
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/07_shambling-zombie.svg",
    keywords: ["zombie", "mummy", "corpse", "reanimated", "cadaver", "putrid"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/10_death-skull.svg",
    keywords: ["skeleton", "bone", "wraith", "ghost", "willowisp", "undead", "corpsefire"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/02_cultist.svg",
    keywords: ["rogue", "priest", "shaman", "witch", "countess", "summoner", "council"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/03_warlock-hood.svg",
    keywords: ["mage", "warlock", "oblivion", "succubus", "vampire", "andariel", "mephisto", "baal"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/04_ogre.svg",
    keywords: ["goatman", "blunderbore", "abominable", "mauler", "beast", "overseer"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/05_troll.svg",
    keywords: ["wendigo", "hulk", "defiler", "siege beast", "minion of destruction", "blood lord"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/06_vampire-dracula.svg",
    keywords: ["vampire", "succubus", "lilith"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/09_devil-mask.svg",
    keywords: ["fallen", "carver", "imp", "fetish", "frog demon", "baboon demon"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/11_dragon-head.svg",
    keywords: ["hawk", "bat", "vulture", "scarab", "viper", "spider", "maggot", "mosquito", "swarm"],
  },
  {
    icon: "./assets/curated/themes/diablo-inspired/icons/enemies/12_crowned-skull.svg",
    keywords: ["boss", "super unique", "uber", "diablo", "duriel", "andariel", "mephisto", "izual"],
  },
];

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMonsterId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizePageTitle(value) {
  return normalizeWhitespace(String(value || "").replace(/_/g, " "));
}

function normalizeFileTitle(value) {
  return normalizeWhitespace(String(value || "").replace(/^File:/i, "").replace(/_/g, " "));
}

function normalizeSearchText(value) {
  return ` ${String(value || "")
    .toLowerCase()
    .replace(/\(diablo ii\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

function cleanMarkup(value) {
  let text = String(value || "");
  const replacements = [
    [/\{\{2\|([^{}|]+)\|([^{}]+)\}\}/g, "$2"],
    [/\{\{2\|([^{}]+)\}\}/g, "$1"],
    [/\{\{rr\|([^{}|]+)\}\}/gi, "$1"],
    [/\{\{c\|([^{}|]+)\}\}/gi, "$1"],
    [/\{\{[^{}|]+\|([^{}|]+)\}\}/g, "$1"],
    [/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2"],
    [/\[\[([^\]]+)\]\]/g, "$1"],
    [/'''/g, ""],
    [/''/g, ""],
    [/<br\s*\/?>/gi, ", "],
    [/&nbsp;/gi, " "],
  ];

  replacements.forEach(([pattern, nextValue]) => {
    text = text.replace(pattern, nextValue);
  });

  return normalizeWhitespace(text);
}

function normalizeMaybeEmpty(value) {
  const cleaned = cleanMarkup(value);
  if (!cleaned || cleaned === "-" || /^none$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function dedupeList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .filter((value, index, source) => source.indexOf(value) === index);
}

function splitListValue(value) {
  const cleaned = normalizeMaybeEmpty(value);
  if (!cleaned) {
    return [];
  }
  return dedupeList(cleaned.split(/\s*,\s*/));
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function romanToActNumber(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const lookup = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
  };
  return lookup[normalized] || null;
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

function walkFiles(dirPath, rootDir = ROOT) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, {
    withFileTypes: true,
  });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath, rootDir);
    }
    if (!/\.(gif|png|jpg|jpeg|webp|svg)$/i.test(entry.name)) {
      return [];
    }
    return [path.relative(rootDir, fullPath)];
  });
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

function singularizeToken(value) {
  const token = String(value || "").trim().toLowerCase();
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith("s") && token.length > 4) {
    return token.slice(0, -1);
  }
  return token;
}

function normalizeLabelTokens(value) {
  return dedupeList(
    normalizeSearchText(value)
      .trim()
      .split(/\s+/)
      .map((entry) => singularizeToken(entry))
      .filter(Boolean)
  );
}

function buildNormalizedLabelKey(value) {
  return normalizeLabelTokens(value).join(" ");
}

function labelsTokenCompatible(left, right) {
  const leftTokens = normalizeLabelTokens(left);
  const rightTokens = normalizeLabelTokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const leftSubset = leftTokens.every((token) => rightSet.has(token));
  const rightSubset = rightTokens.every((token) => leftSet.has(token));
  return leftSubset || rightSubset;
}

function stripFileExtension(value) {
  return String(value || "").replace(/\.[a-z0-9]+$/i, "");
}

function extractFileTitleLabel(title) {
  const withoutPrefix = String(title || "").replace(/^File:/i, "");
  return normalizeWhitespace(stripFileExtension(withoutPrefix).replace(/\(Diablo II\)/gi, "").replace(/_/g, " "));
}

function safeAssetFileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9()._-]+/g, "_");
}

function extractAssetIdFromPath(assetPath) {
  const match = String(assetPath || "").match(/(?:^|\/)(\d{4,})(?:__|\/|\.|$)/);
  return match ? match[1] : null;
}

function readSpriterAssetNameMap(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      rows: [],
      byId: new Map(),
    };
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.slice(1).map((line) => {
    const [id, name] = line.split("\t");
    return {
      id: String(id || "").trim(),
      name: normalizeWhitespace(name),
    };
  });

  return {
    rows,
    byId: new Map(rows.filter((entry) => entry.id).map((entry) => [entry.id, entry.name])),
  };
}

function buildAssetPathsById(paths) {
  const byId = new Map();
  (Array.isArray(paths) ? paths : []).forEach((assetPath) => {
    const assetId = extractAssetIdFromPath(assetPath);
    if (!assetId) {
      return;
    }
    const existing = byId.get(assetId) || [];
    existing.push(assetPath);
    byId.set(assetId, existing);
  });
  return byId;
}

function rankLocalSpritePath(assetPath) {
  if (/\/potential_art\/bosses\/sprites\//i.test(assetPath)) {
    return 0;
  }
  if (/\/organized\/sprites\/extracted\//i.test(assetPath)) {
    return 1;
  }
  if (/\/potential_art\/armor_sets\/sprites\//i.test(assetPath)) {
    return 2;
  }
  if (/\/potential_art\/monsters_random\/sprites\//i.test(assetPath)) {
    return 3;
  }
  if (/\/organized\/sprites\/raw\/spriters\//i.test(assetPath)) {
    return 4;
  }
  return 9;
}

function inferAssetLabelFromPath(assetPath, spriterAssetNamesById) {
  const assetId = extractAssetIdFromPath(assetPath);
  if (assetId && spriterAssetNamesById?.has(assetId)) {
    return spriterAssetNamesById.get(assetId);
  }

  const folderMatch = String(assetPath || "").match(/\/\d+__([^/]+)(?:\/|$)/);
  if (folderMatch?.[1]) {
    return normalizeWhitespace(folderMatch[1].replace(/_/g, " "));
  }

  return normalizeWhitespace(
    stripFileExtension(path.basename(String(assetPath || "")))
      .replace(/_/g, " ")
      .replace(/\(Diablo II\)/gi, "")
  );
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
      "user-agent": "rouge-monster-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}) for ${response.url}`);
  }
  return response.json();
}

async function fetchIndexWikitext() {
  const payload = await fetchJson({
    action: "parse",
    page: INDEX_PAGE_TITLE,
    prop: "wikitext",
  });
  const wikitext = payload?.parse?.wikitext;
  if (typeof wikitext !== "string" || !wikitext.trim()) {
    throw new Error("Monster index wikitext was empty.");
  }
  return wikitext;
}

function extractSection(wikitext, startMarker, endMarker) {
  const startIndex = wikitext.indexOf(startMarker);
  if (startIndex === -1) {
    return "";
  }

  const fromStart = wikitext.slice(startIndex);
  if (!endMarker) {
    return fromStart;
  }

  const endIndex = fromStart.indexOf(endMarker);
  return endIndex === -1 ? fromStart : fromStart.slice(0, endIndex);
}

function collectTableBlocks(sectionText) {
  const lines = String(sectionText || "").split("\n");
  const blocks = [];
  let active = null;

  lines.forEach((line) => {
    if (line.startsWith("{|")) {
      active = [line];
      return;
    }
    if (!active) {
      return;
    }
    active.push(line);
    if (line.trim() === "|}") {
      blocks.push(active.join("\n"));
      active = null;
    }
  });

  return blocks;
}

function splitTableRows(tableText) {
  const lines = String(tableText || "").split("\n");
  const rows = [];
  let current = [];

  lines.forEach((line) => {
    if (line.trim() === "|-") {
      if (current.length > 0) {
        rows.push(current);
        current = [];
      }
      return;
    }
    current.push(line);
  });

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

function parseRowCells(rowLines) {
  return (Array.isArray(rowLines) ? rowLines : [])
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line !== "|}" && line !== "|-")
    .map((line) => line.slice(1).trim());
}

function parseImageCell(cellValue) {
  const cell = String(cellValue || "");
  const match = cell.match(/\[\[Image:([^\]|]+)[^\]]*?\|link=\s*([^\]|]+)\]\]/i);
  if (!match) {
    return null;
  }

  return {
    imageName: cleanMarkup(match[1]),
    pageTitle: normalizePageTitle(match[2]),
  };
}

function parseLabelCell(cellValue) {
  const withoutStyle = String(cellValue || "").replace(/^style=[^|]+\|\s*/, "").trim();
  if (!withoutStyle || withoutStyle === "&nbsp;" || /^\(Quest Related\)$/i.test(withoutStyle)) {
    return null;
  }

  const wikiLinkMatch = withoutStyle.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (wikiLinkMatch) {
    return {
      name: cleanMarkup(wikiLinkMatch[2] || wikiLinkMatch[1]),
      pageTitle: normalizePageTitle(wikiLinkMatch[1]),
    };
  }

  const templateMatch = withoutStyle.match(/^\{\{2\|(.+?)\}\}$/);
  if (!templateMatch) {
    return null;
  }

  const templateParts = templateMatch[1]
    .split("|")
    .map((part) => cleanMarkup(part))
    .filter(Boolean);
  if (templateParts.length === 0) {
    return null;
  }

  return {
    name: templateParts[templateParts.length - 1],
    pageTitle: null,
  };
}

function parseQuestFlags(cells) {
  return (Array.isArray(cells) ? cells : []).map((cell) => /Quest Related/i.test(String(cell || "")));
}

function buildSourceUrl(pageTitle) {
  return `https://diablo-archive.fandom.com/wiki/${encodeURIComponent(String(pageTitle || "").replace(/ /g, "_"))}`;
}

function parseTableBlock(tableText, group) {
  const actMatch = tableText.match(/\|\s*\{\{2\|Act\s+([IVX]+)\}\}/i);
  const act = actMatch ? romanToActNumber(actMatch[1]) : null;
  const isUberBlock = /\|\s*Ubers/i.test(tableText);
  if (!act && !isUberBlock) {
    return [];
  }

  const rows = splitTableRows(tableText);
  const entries = [];
  let pendingImageCells = null;
  let lastCreatedEntries = [];

  rows.forEach((row) => {
    const cells = parseRowCells(row);
    if (cells.length === 0) {
      return;
    }

    const imageCells = cells.map(parseImageCell);
    if (imageCells.some(Boolean)) {
      pendingImageCells = imageCells;
      return;
    }

    const labelCells = cells.map(parseLabelCell);
    if (labelCells.some(Boolean)) {
      const created = [];
      const maxLength = Math.max(labelCells.length, pendingImageCells ? pendingImageCells.length : 0);

      for (let index = 0; index < maxLength; index += 1) {
        const imageCell = pendingImageCells?.[index] || null;
        const labelCell = labelCells[index] || null;
        if (!imageCell && !labelCell) {
          continue;
        }

        const pageTitle = normalizePageTitle(imageCell?.pageTitle || labelCell?.pageTitle || labelCell?.name || "");
        const name = cleanMarkup(labelCell?.name || pageTitle);
        if (!name) {
          continue;
        }

        const entry = {
          id: normalizeMonsterId(name),
          name,
          pageTitle,
          pageSlug: pageTitle.replace(/ /g, "_"),
          sourceUrl: buildSourceUrl(pageTitle),
          group,
          act,
          order: entries.length + created.length + 1,
          questRelated: false,
          sourceImage: imageCell?.imageName || null,
        };
        created.push(entry);
      }

      entries.push(...created);
      lastCreatedEntries = created;
      pendingImageCells = null;
      return;
    }

    const questFlags = parseQuestFlags(cells);
    if (questFlags.some(Boolean) && lastCreatedEntries.length > 0) {
      lastCreatedEntries.forEach((entry, index) => {
        if (questFlags[index]) {
          entry.questRelated = true;
        }
      });
    }
  });

  return entries;
}

function parseIndexEntries(wikitext) {
  const regularSection = extractSection(wikitext, "== List of Monsters", "== List of Super Uniques ==");
  const superUniqueSection = extractSection(wikitext, "== List of Super Uniques ==", "=== Ubers ===");
  const uberSection = extractSection(wikitext, "=== Ubers ===", "{{Diablo II Monsters}}");

  const sections = [
    { key: "regular", text: regularSection },
    { key: "super_unique", text: superUniqueSection },
    { key: "uber", text: uberSection },
  ];

  return sections.flatMap((section) =>
    collectTableBlocks(section.text).flatMap((tableText) => parseTableBlock(tableText, section.key))
  );
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

function inferMonsterTypeFromCategories(categories) {
  const normalized = new Set((Array.isArray(categories) ? categories : []).map((entry) => String(entry || "").toLowerCase()));
  if (normalized.has("animals")) {
    return "Animal";
  }
  if (normalized.has("undead")) {
    return "Undead";
  }
  if (normalized.has("demons")) {
    return "Demon";
  }
  return null;
}

function extractCategories(wikitext) {
  return Array.from(String(wikitext || "").matchAll(/\[\[category:([^\]]+)\]\]/gi))
    .map((match) => cleanMarkup(match[1]))
    .filter(Boolean)
    .filter((value, index, source) => source.indexOf(value) === index);
}

function extractGuestMonsterActs(wikitext) {
  return Array.from(String(wikitext || "").matchAll(/==\s*Act\s+([IVX]+)\s+Guest Monster\s*==/gi))
    .map((match) => romanToActNumber(match[1]))
    .filter(Boolean)
    .filter((value, index, source) => source.indexOf(value) === index);
}

function extractLeadSummary(wikitext) {
  const beforeHeading = String(wikitext || "").split(/\n==/)[0] || "";
  return normalizeMaybeEmpty(beforeHeading);
}

function extractNamedSection(wikitext, heading) {
  const lines = String(wikitext || "").split("\n");
  const startMatcher = new RegExp(`^==\\s*${escapeRegex(heading)}\\s*==\\s*$`, "i");
  const endMatcher = /^==[^=].*==\s*$/;
  const startIndex = lines.findIndex((line) => startMatcher.test(line.trim()));
  if (startIndex === -1) {
    return "";
  }

  const body = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (endMatcher.test(line.trim())) {
      break;
    }
    body.push(line);
  }

  return body.join("\n").trim();
}

function extractSectionBullets(sectionText) {
  return dedupeList(
    String(sectionText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\*+/.test(line))
      .map((line) => cleanMarkup(line.replace(/^\*+\s*/, "")))
  );
}

function extractSectionParagraphs(sectionText) {
  const paragraphs = [];
  let current = [];

  String(sectionText || "")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      const isNonContent =
        !trimmed ||
        /^\*+/.test(trimmed) ||
        trimmed.startsWith("{{") ||
        trimmed.startsWith("|}") ||
        /^<gallery>/i.test(trimmed) ||
        /^<\/gallery>/i.test(trimmed) ||
        /^Image:/i.test(trimmed) ||
        /^File:/i.test(trimmed) ||
        /^\[\[category:/i.test(trimmed);

      if (isNonContent) {
        if (current.length > 0) {
          paragraphs.push(cleanMarkup(current.join(" ")));
          current = [];
        }
        return;
      }

      current.push(trimmed);
    });

  if (current.length > 0) {
    paragraphs.push(cleanMarkup(current.join(" ")));
  }

  return dedupeList(paragraphs);
}

function extractLabeledBulletGroup(sectionText, label) {
  const lines = String(sectionText || "").split("\n");
  const normalizedLabel = `${String(label || "").trim().toLowerCase()}:`;
  const items = [];
  let collecting = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const cleaned = cleanMarkup(trimmed).toLowerCase();
    if (!collecting && cleaned === normalizedLabel) {
      collecting = true;
      return;
    }

    if (!collecting) {
      return;
    }

    if (/^\*+/.test(trimmed)) {
      items.push(cleanMarkup(trimmed.replace(/^\*+\s*/, "")));
      return;
    }

    if (!trimmed) {
      return;
    }

    collecting = false;
  });

  return dedupeList(items);
}

function extractDifficultyMap(sectionText, label) {
  const values = {};
  extractLabeledBulletGroup(sectionText, label).forEach((item) => {
    const match = item.match(/^(Normal|Nightmare|Hell)\s*:\s*(.+)$/i);
    if (!match) {
      return;
    }
    const difficulty = String(match[1] || "").toLowerCase();
    values[difficulty] = normalizeWhitespace(match[2]);
  });

  return Object.keys(values).length > 0 ? values : null;
}

function extractGalleryImages(wikitext) {
  const matches = Array.from(String(wikitext || "").matchAll(/<gallery>([\s\S]*?)<\/gallery>/gi));
  return dedupeList(
    matches.flatMap((match) =>
      String(match[1] || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => normalizeWhitespace(line.replace(/^(?:Image|File):/i, "")))
    )
  );
}

function simplifyVariant(fields, fallbackName) {
  const images = {
    normal: fields.image || null,
    nightmare: fields.imageN || null,
    hell: fields.imageH || null,
  };
  const locations = {
    normal: fields.location || null,
    nightmare: fields.locationN || null,
    hell: fields.locationH || null,
  };
  const uniqueSpawnLocations = {
    normal: fields.ulocation || null,
    nightmare: fields.ulocationN || null,
    hell: fields.ulocationH || null,
  };
  const runeDrops = {
    normal: fields.rune || null,
    nightmare: fields.runeN || null,
    hell: fields.runeH || null,
  };
  const health = {
    normal: fields.health || null,
    nightmare: fields.healthN || null,
    hell: fields.healthH || null,
  };
  const resistances = {
    normal: {
      cold: fields.cold || null,
      fire: fields.fire || null,
      lightning: fields.lightning || null,
      magic: fields.magic || null,
      physical: fields.physical || null,
      poison: fields.poison || null,
    },
    nightmare: {
      cold: fields.coldN || null,
      fire: fields.fireN || null,
      lightning: fields.lightningN || null,
      magic: fields.magicN || null,
      physical: fields.physicalN || null,
      poison: fields.poisonN || null,
    },
    hell: {
      cold: fields.coldH || null,
      fire: fields.fireH || null,
      lightning: fields.lightningH || null,
      magic: fields.magicH || null,
      physical: fields.physicalH || null,
      poison: fields.poisonH || null,
    },
  };
  const drainEffectiveness = {
    normal: fields.drain || null,
    nightmare: fields.drainN || null,
    hell: fields.drainH || null,
  };
  const abilities = splitListValue(fields.abilities);

  return {
    id: normalizeMonsterId(fields.name || fallbackName),
    name: fields.name || fallbackName,
    images,
    image: fields.image || null,
    breed: fields.breed || null,
    type: fields.type || null,
    baseMonster: fields.basemonster || null,
    superUnique: fields.superunique || null,
    health,
    resistances,
    drainEffectiveness,
    locations,
    locationList: {
      normal: splitListValue(fields.location),
      nightmare: splitListValue(fields.locationN),
      hell: splitListValue(fields.locationH),
    },
    uniqueSpawnLocations,
    uniqueSpawnLocationList: {
      normal: splitListValue(fields.ulocation),
      nightmare: splitListValue(fields.ulocationN),
      hell: splitListValue(fields.ulocationH),
    },
    abilities,
    presets: fields.presets || null,
    runeDrops,
  };
}

function inferShippingSafeIcon(entry) {
  const searchBlob = normalizeSearchText(
    [
      entry.group,
      entry.name,
      entry.breed,
      entry.baseMonster,
      entry.monsterType,
      ...(Array.isArray(entry.categories) ? entry.categories : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  const matchedRule = SHIPPING_SAFE_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchBlob.includes(normalizeSearchText(keyword)))
  );

  if (matchedRule) {
    return matchedRule.icon;
  }

  if (entry.monsterType === "Undead") {
    return "./assets/curated/themes/diablo-inspired/icons/enemies/10_death-skull.svg";
  }
  if (entry.monsterType === "Demon") {
    return "./assets/curated/themes/diablo-inspired/icons/enemies/09_devil-mask.svg";
  }
  if (entry.monsterType === "Animal") {
    return "./assets/curated/themes/diablo-inspired/icons/enemies/11_dragon-head.svg";
  }
  return SHIPPING_SAFE_ICON_DEFAULTS[entry.group] || SHIPPING_SAFE_ICON_DEFAULTS.regular;
}

function collectManifestAssetReferences(entry, assetsManifest) {
  const manifest = assetsManifest && typeof assetsManifest === "object" ? assetsManifest : {};
  const searchKeys = [
    entry.seedKey,
    normalizeMonsterId(entry.name),
    normalizeMonsterId(entry.breed),
    normalizeMonsterId(entry.baseMonster),
  ].filter(Boolean);

  const refs = [];
  const buckets = [
    ["enemySpriteSamples", manifest.enemySpriteSamples || {}],
    ["questBosses", manifest.questBosses || {}],
    ["actBosses", manifest.actBosses || {}],
  ];

  buckets.forEach(([bucketName, bucket]) => {
    searchKeys.forEach((key) => {
      const assetPath = bucket[key];
      if (!assetPath) {
        return;
      }
      refs.push({
        bucket: bucketName,
        path: assetPath,
      });
    });
  });

  return refs.filter(
    (entryRef, index, source) =>
      source.findIndex((candidate) => candidate.bucket === entryRef.bucket && candidate.path === entryRef.path) === index
  );
}

function buildAssetSearchTokens(entry) {
  const strong = [
    entry.name,
    entry.pageTitle,
    entry.pageTitle?.replace(/\s*\(Diablo II\)\s*/i, ""),
    entry.seedKey ? String(entry.seedKey).replace(/_/g, " ") : null,
    entry.breed,
    ...(Array.isArray(entry.variants) ? entry.variants.map((variant) => variant?.name) : []),
  ]
    .map((value) => normalizeSearchText(value).trim())
    .filter((value) => value.length >= 5)
    .filter((value, index, source) => source.indexOf(value) === index);

  return {
    strong,
  };
}

function scoreReferenceAssetPath(assetPath, tokens) {
  const haystack = normalizeSearchText(
    String(assetPath || "")
      .replace(/^assets\/diablo2_downloads\//i, "")
      .replace(/^assets\//i, "")
  );
  let score = 0;

  (Array.isArray(tokens?.strong) ? tokens.strong : []).forEach((token) => {
    if (!token) {
      return;
    }
    if (haystack.includes(` ${token} `)) {
      score += 40 + token.length;
    } else if (haystack.includes(token)) {
      score += 18 + token.length;
    }
  });

  if (score > 0) {
    if (/\/idle\.(png|gif)$/i.test(assetPath)) {
      score += 12;
    }
    if (/\/extracted\//i.test(assetPath)) {
      score += 8;
    }
  }

  return score;
}

function collectLocalReferenceAssetCandidates(entry, referenceAssetPaths, manifestRefs) {
  const manifestPaths = new Set((Array.isArray(manifestRefs) ? manifestRefs : []).map((ref) => ref.path));
  const tokens = buildAssetSearchTokens(entry);

  return (Array.isArray(referenceAssetPaths) ? referenceAssetPaths : [])
    .map((assetPath) => ({
      path: assetPath,
      score: scoreReferenceAssetPath(assetPath, tokens),
    }))
    .filter(
      (candidate) =>
        candidate.score > 0 &&
        !manifestPaths.has(candidate.path) &&
        !/(?:^|\/)[^/]*(?:floor|wall|ground)(?:[^/]*)(?:\/|$)/i.test(candidate.path)
    )
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 5)
    .map((candidate) => candidate.path);
}

function stripBossVariantPrefix(value) {
  return normalizeWhitespace(String(value || "").replace(/^(Uber|Pandemonium)\s+/i, ""));
}

function buildBossAliasSets(entry) {
  const exactLabels = dedupeList([
    entry?.name,
    entry?.pageTitle?.replace(/\s*\(Diablo II\)\s*$/i, ""),
  ]).filter(Boolean);
  const exactKeys = new Set(exactLabels.map((value) => buildNormalizedLabelKey(value)).filter(Boolean));

  const variantLabels = dedupeList([
    stripBossVariantPrefix(entry?.name),
    stripBossVariantPrefix(entry?.pageTitle?.replace(/\s*\(Diablo II\)\s*$/i, "")),
  ]).filter((value) => value && !exactLabels.includes(value));
  const variantKeys = new Set(variantLabels.map((value) => buildNormalizedLabelKey(value)).filter(Boolean));

  const familyLabels = dedupeList([
    entry?.breed,
    entry?.baseMonster,
    ...(Array.isArray(entry?.variants)
      ? entry.variants.flatMap((variant) => [variant?.breed, variant?.baseMonster, variant?.superUnique])
      : []),
  ]).filter((value) => {
    const key = buildNormalizedLabelKey(value);
    return Boolean(key) && !exactKeys.has(key) && !variantKeys.has(key);
  });

  return {
    exactLabels,
    exactKeys,
    variantLabels,
    variantKeys,
    familyLabels,
  };
}

function buildCandidateKey(candidate) {
  if (candidate?.path) {
    return `path:${candidate.path}`;
  }
  if (candidate?.title) {
    return `title:${candidate.title}`;
  }
  if (candidate?.url) {
    return `url:${candidate.url}`;
  }
  return null;
}

function mergeSourceRefs(left, right) {
  const refs = [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])];
  return refs.filter(
    (ref, index, source) => source.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(ref)) === index
  );
}

function addBossAssetCandidate(candidateMap, candidate) {
  const key = buildCandidateKey(candidate);
  if (!key) {
    return;
  }

  const existing = candidateMap.get(key);
  if (!existing) {
    candidateMap.set(key, candidate);
    return;
  }

  candidateMap.set(key, {
    ...existing,
    label: existing.label || candidate.label,
    assetClass: existing.assetClass || candidate.assetClass,
    path: existing.path || candidate.path,
    url: existing.url || candidate.url,
    title: existing.title || candidate.title,
    descriptionUrl: existing.descriptionUrl || candidate.descriptionUrl || null,
    descriptionShortUrl: existing.descriptionShortUrl || candidate.descriptionShortUrl || null,
    extension: existing.extension || candidate.extension || null,
    spriterAssetId: existing.spriterAssetId || candidate.spriterAssetId || null,
    sourceRefs: mergeSourceRefs(existing.sourceRefs, candidate.sourceRefs),
  });
}

function buildLocalBossSpriteCandidate(assetPath, spriterAssetNamesById, sourceRef) {
  return {
    label: inferAssetLabelFromPath(assetPath, spriterAssetNamesById),
    assetClass: "sprite",
    path: assetPath,
    extension: path.extname(assetPath).replace(/^\./, "").toLowerCase() || null,
    spriterAssetId: extractAssetIdFromPath(assetPath),
    sourceRefs: sourceRef ? [sourceRef] : [],
  };
}

function buildWikiBossImageCandidate(imageAsset) {
  if (!imageAsset?.path) {
    return null;
  }

  return {
    label: extractFileTitleLabel(imageAsset.title),
    assetClass: "page_image",
    path: imageAsset.path,
    url: imageAsset.url || null,
    title: imageAsset.title || null,
    descriptionUrl: imageAsset.descriptionUrl || null,
    descriptionShortUrl: imageAsset.descriptionShortUrl || null,
    extension: path.extname(imageAsset.path).replace(/^\./, "").toLowerCase() || null,
    sourceRefs: [
      {
        kind: "wiki_source_image",
        title: imageAsset.title,
      },
    ],
  };
}

function collectNamedBossSpriteCandidates(entry, spriterAssetMetadata, assetPathsById) {
  const aliases = buildBossAliasSets(entry);
  const namedRows = (Array.isArray(spriterAssetMetadata?.rows) ? spriterAssetMetadata.rows : []).filter((asset) => {
    const labelKey = buildNormalizedLabelKey(asset?.name);
    return aliases.exactKeys.has(labelKey) || aliases.variantKeys.has(labelKey);
  });

  const candidates = [];
  namedRows.forEach((asset) => {
    const matchedPaths = [...new Set(assetPathsById?.get(asset.id) || [])]
      .sort((left, right) => rankLocalSpritePath(left) - rankLocalSpritePath(right) || left.localeCompare(right));
    matchedPaths.forEach((assetPath) => {
      candidates.push(
        buildLocalBossSpriteCandidate(assetPath, spriterAssetMetadata?.byId, {
          kind: "spriter_exact_name",
          assetId: asset.id,
          assetName: asset.name,
        })
      );
    });
  });

  return candidates;
}

function classifyBossAssetCandidate(entry, candidate) {
  const aliases = buildBossAliasSets(entry);
  const candidateLabel = normalizeWhitespace(candidate?.label || "");
  const candidateKey = buildNormalizedLabelKey(candidateLabel);
  const manifestBucket = (Array.isArray(candidate?.sourceRefs) ? candidate.sourceRefs : []).find(
    (ref) => ref?.kind === "assets_manifest"
  )?.bucket;

  if (candidateKey && aliases.exactKeys.has(candidateKey)) {
    return {
      matchType: "exact",
      matchReason: "Asset label matches the boss name.",
    };
  }

  if (candidateKey && aliases.variantKeys.has(candidateKey)) {
    return {
      matchType: "variant",
      matchReason: "Asset label matches the base boss variant reused by this entry.",
    };
  }

  if (
    manifestBucket === "enemySpriteSamples" ||
    aliases.familyLabels.some((familyLabel) => labelsTokenCompatible(familyLabel, candidateLabel))
  ) {
    return {
      matchType: "family",
      matchReason: "Asset label matches the boss family or base monster.",
    };
  }

  return {
    matchType: "surrogate",
    matchReason: "Asset is related reference art, but not an exact or family match.",
  };
}

function candidateSourceOrder(candidate) {
  const sourceOrders = (Array.isArray(candidate?.sourceRefs) ? candidate.sourceRefs : []).map(
    (ref) => BOSS_ASSET_SOURCE_ORDER[ref?.kind] ?? 9
  );
  return sourceOrders.length > 0 ? Math.min(...sourceOrders) : 9;
}

function sortBossAssetCandidates(candidates) {
  return [...(Array.isArray(candidates) ? candidates : [])].sort((left, right) => {
    const matchOrder =
      (BOSS_ASSET_MATCH_ORDER[left?.matchType] ?? 9) - (BOSS_ASSET_MATCH_ORDER[right?.matchType] ?? 9);
    if (matchOrder !== 0) {
      return matchOrder;
    }

    const assetClassOrder =
      (BOSS_ASSET_CLASS_ORDER[left?.assetClass] ?? 9) - (BOSS_ASSET_CLASS_ORDER[right?.assetClass] ?? 9);
    if (assetClassOrder !== 0) {
      return assetClassOrder;
    }

    const sourceOrder = candidateSourceOrder(left) - candidateSourceOrder(right);
    if (sourceOrder !== 0) {
      return sourceOrder;
    }

    const spritePathOrder = rankLocalSpritePath(left?.path || "") - rankLocalSpritePath(right?.path || "");
    if (spritePathOrder !== 0) {
      return spritePathOrder;
    }

    return String(left?.path || left?.title || left?.label || "").localeCompare(
      String(right?.path || right?.title || right?.label || "")
    );
  });
}

function buildBossAssetPrimarySelection(entry) {
  if (!entry) {
    return {
      matchType: "missing",
      assetClass: null,
      label: null,
      path: null,
      sourceKinds: [],
    };
  }

  return {
    matchType: entry.matchType,
    matchReason: entry.matchReason,
    assetClass: entry.assetClass,
    label: entry.label || null,
    path: entry.path || null,
    title: entry.title || null,
    url: entry.url || null,
    sourceKinds: dedupeList((Array.isArray(entry.sourceRefs) ? entry.sourceRefs : []).map((ref) => ref.kind)),
  };
}

function buildBossAssetCatalogEntry(entry, spriterAssetMetadata, assetPathsById, wikiImageAsset) {
  const candidateMap = new Map();

  (Array.isArray(entry?.assetRefs?.referenceOnly?.manifest) ? entry.assetRefs.referenceOnly.manifest : []).forEach((ref) => {
    if (!ref?.path) {
      return;
    }
    addBossAssetCandidate(
      candidateMap,
      buildLocalBossSpriteCandidate(ref.path, spriterAssetMetadata?.byId, {
        kind: "assets_manifest",
        bucket: ref.bucket,
      })
    );
  });

  (Array.isArray(entry?.assetRefs?.referenceOnly?.localSpriteCandidates)
    ? entry.assetRefs.referenceOnly.localSpriteCandidates
    : []
  ).forEach((assetPath) => {
    addBossAssetCandidate(
      candidateMap,
      buildLocalBossSpriteCandidate(assetPath, spriterAssetMetadata?.byId, {
        kind: "local_scored_candidate",
      })
    );
  });

  collectNamedBossSpriteCandidates(entry, spriterAssetMetadata, assetPathsById).forEach((candidate) => {
    addBossAssetCandidate(candidateMap, candidate);
  });

  addBossAssetCandidate(candidateMap, buildWikiBossImageCandidate(wikiImageAsset));

  const sortedCandidates = sortBossAssetCandidates(
    Array.from(candidateMap.values()).map((candidate) => ({
      ...candidate,
      ...classifyBossAssetCandidate(entry, candidate),
      sourceKinds: dedupeList((Array.isArray(candidate.sourceRefs) ? candidate.sourceRefs : []).map((ref) => ref.kind)),
    }))
  );

  const groupedCandidates = {
    exact: sortedCandidates.filter((candidate) => candidate.matchType === "exact"),
    variant: sortedCandidates.filter((candidate) => candidate.matchType === "variant"),
    family: sortedCandidates.filter((candidate) => candidate.matchType === "family"),
    surrogate: sortedCandidates.filter((candidate) => candidate.matchType === "surrogate"),
  };

  const primary = buildBossAssetPrimarySelection(sortedCandidates[0] || null);

  return {
    id: entry.id,
    name: entry.name,
    pageTitle: entry.pageTitle,
    sourceUrl: entry.sourceUrl,
    tier: entry?.bossProfile?.tier || null,
    act: entry?.bossProfile?.act ?? entry?.act ?? null,
    zone: entry?.bossProfile?.zone || null,
    seedKey: entry?.seedKey || null,
    sourceImageTitle: entry?.assetRefs?.referenceOnly?.sourceImage || null,
    shippingSafeIcon: entry?.assetRefs?.shippingSafeIcon || null,
    primary,
    candidates: groupedCandidates,
  };
}

function extractWikiSections(wikitext) {
  const tacticsSection = extractNamedSection(wikitext, "Tactics");
  const additionalInfoSection = extractNamedSection(wikitext, "Additional Information");
  const triviaSection = extractNamedSection(wikitext, "Trivia");
  const quotesSection = extractNamedSection(wikitext, "Quotes");
  const specialAbilities = dedupeList([
    ...extractLabeledBulletGroup(additionalInfoSection, "Special Abilities"),
  ]);

  return {
    tactics: extractSectionParagraphs(tacticsSection),
    additionalInformation: {
      paragraphs: extractSectionParagraphs(additionalInfoSection).filter(
        (entry) => !/^(Minions|Special Abilities):$/i.test(entry)
      ),
      bullets: extractSectionBullets(additionalInfoSection),
    },
    minionsByDifficulty: extractDifficultyMap(additionalInfoSection, "Minions"),
    specialAbilities,
    trivia: dedupeList([
      ...extractSectionParagraphs(triviaSection),
      ...extractSectionBullets(triviaSection),
    ]),
    quotes: dedupeList([
      ...extractSectionParagraphs(quotesSection),
      ...extractSectionBullets(quotesSection),
    ]),
    galleryImages: extractGalleryImages(wikitext),
  };
}

function extractPageMetadata({ summary, wikitext }) {
  const templates = extractBalancedTemplates(wikitext, "{{Monster (Diablo II)").map(parseTemplateFields);
  const categories = extractCategories(wikitext);
  const primary = templates[0] || {};
  const wikiSections = extractWikiSections(wikitext);
  const templateAbilities = dedupeList(templates.flatMap((fields) => splitListValue(fields.abilities)));

  return {
    summary: normalizeMaybeEmpty(summary) || extractLeadSummary(wikitext),
    categories,
    monsterType: primary.type || inferMonsterTypeFromCategories(categories),
    breed: primary.breed || null,
    baseMonster: primary.basemonster || null,
    guestMonsterActs: extractGuestMonsterActs(wikitext),
    specialAbilities: dedupeList([...templateAbilities, ...wikiSections.specialAbilities]),
    wikiSections,
    variants: templates.map((fields, index) =>
      simplifyVariant(fields, primary.name || `variant_${index + 1}`)
    ),
  };
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectSeedMetadata() {
  const enemyPoolsDoc = readJsonFile(ENEMY_POOLS_PATH);
  const assetsManifestDoc = readJsonFile(ASSETS_MANIFEST_PATH);
  const spriterAssetMetadata = readSpriterAssetNameMap(SPRITER_ASSET_NAME_MAP_PATH);
  const keys = new Set();
  const actBossesById = new Map();
  const questBossKeys = new Set(
    Object.keys(assetsManifestDoc?.questBosses || {})
      .map((key) => normalizeMonsterId(key))
      .filter(Boolean)
  );

  (Array.isArray(enemyPoolsDoc?.enemyPools) ? enemyPoolsDoc.enemyPools : []).forEach((pool) => {
    [...(Array.isArray(pool?.enemies) ? pool.enemies : []), ...(Array.isArray(pool?.nativeEnemies) ? pool.nativeEnemies : [])].forEach(
      (entry) => {
        const key = normalizeMonsterId(entry?.id || "");
        if (key) {
          keys.add(key);
        }
      }
    );
  });

  (Array.isArray(enemyPoolsDoc?.actBosses) ? enemyPoolsDoc.actBosses : []).forEach((entry) => {
    const key = normalizeMonsterId(entry?.id || "");
    if (key) {
      keys.add(key);
      actBossesById.set(key, {
        id: key,
        name: normalizeMaybeEmpty(entry?.name),
        act: Number.isInteger(Number.parseInt(entry?.act, 10)) ? Number.parseInt(entry.act, 10) : null,
        zone: normalizeMaybeEmpty(entry?.zone),
        canonicalTheme: Array.isArray(entry?.canonicalTheme) ? dedupeList(entry.canonicalTheme) : [],
      });
    }
  });

  questBossKeys.forEach((key) => {
    keys.add(key);
  });

  return {
    allKeys: keys,
    actBossesById,
    questBossKeys,
    assetsManifest: assetsManifestDoc,
    spriterAssetMetadata,
  };
}

async function fetchPageDetails(entries) {
  const titles = [...new Set((Array.isArray(entries) ? entries : []).map((entry) => entry.pageTitle).filter(Boolean))];
  return fetchPageDetailsForTitles(titles);
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
      "user-agent": "rouge-monster-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Asset download failed (${response.status} ${response.statusText}) for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destinationPath, buffer);
}

async function resolveBossWikiImageAssets(entries) {
  const titles = [...new Set(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => normalizeFileTitle(entry?.assetRefs?.referenceOnly?.sourceImage || ""))
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
    const absolutePath = path.join(BOSS_WIKI_IMAGE_DIRECTORY, fileName);
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

function hasResolvedDetails(detail) {
  return Boolean(detail?.summary || detail?.wikitext || detail?.pageId);
}

async function findFallbackPageTitle(entry) {
  const searchTerms = [entry?.pageTitle, entry?.name]
    .map((value) => normalizePageTitle(value))
    .filter(Boolean)
    .filter((value, index, source) => source.indexOf(value) === index);

  for (const term of searchTerms) {
    const payload = await fetchJson({
      action: "query",
      list: "search",
      srsearch: term,
      srlimit: "10",
    });
    const results = Array.isArray(payload?.query?.search) ? payload.query.search : [];
    const candidates = [normalizeSearchText(entry?.pageTitle).trim(), normalizeSearchText(entry?.name).trim()]
      .filter(Boolean)
      .filter((value, index, source) => source.indexOf(value) === index);

    const exactMatch = results.find((result) => {
      const titleKey = normalizeSearchText(result?.title).trim();
      return candidates.some(
        (candidate) => titleKey === candidate || titleKey.startsWith(`${candidate} `) || titleKey.startsWith(`${candidate}(`)
      );
    });
    if (exactMatch?.title) {
      return normalizePageTitle(exactMatch.title);
    }
  }

  return null;
}

async function resolveFallbackDetails(entries, detailMap) {
  const fallbackTitleByEntry = new Map();

  for (const entry of Array.isArray(entries) ? entries : []) {
    const currentDetails = detailMap.get(entry.pageTitle);
    if (hasResolvedDetails(currentDetails)) {
      continue;
    }

    const fallbackTitle = await findFallbackPageTitle(entry);
    if (fallbackTitle && fallbackTitle !== entry.pageTitle) {
      fallbackTitleByEntry.set(entry.pageTitle, fallbackTitle);
    }
  }

  const titlesToFetch = [...new Set(fallbackTitleByEntry.values())].filter((title) => !hasResolvedDetails(detailMap.get(title)));
  const fetchedDetails = await fetchPageDetailsForTitles(titlesToFetch);
  fetchedDetails.forEach((value, key) => {
    detailMap.set(key, value);
  });

  return fallbackTitleByEntry;
}

function buildBossProfile(entry, seedMetadata) {
  const actBossMeta =
    seedMetadata?.actBossesById?.get(entry?.seedKey || "") ||
    seedMetadata?.actBossesById?.get(entry?.id || "") ||
    null;

  if (entry?.group === "uber") {
    return {
      tier: "uber",
      act: entry?.act ?? null,
      zone: null,
      canonicalTheme: [],
    };
  }

  if (actBossMeta) {
    return {
      tier: "act_boss",
      act: actBossMeta.act ?? entry?.act ?? null,
      zone: actBossMeta.zone || null,
      canonicalTheme: Array.isArray(actBossMeta.canonicalTheme) ? [...actBossMeta.canonicalTheme] : [],
    };
  }

  if (entry?.group === "super_unique" && entry?.questRelated) {
    return {
      tier: "quest_boss",
      act: entry?.act ?? null,
      zone: null,
      canonicalTheme: [],
    };
  }

  if (entry?.group === "super_unique") {
    return {
      tier: "super_unique",
      act: entry?.act ?? null,
      zone: null,
      canonicalTheme: [],
    };
  }

  return null;
}

function buildBossOutput(entries) {
  const bossEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.bossProfile)
    .sort((a, b) => {
      const actA = Number.isInteger(a?.bossProfile?.act) ? a.bossProfile.act : 99;
      const actB = Number.isInteger(b?.bossProfile?.act) ? b.bossProfile.act : 99;
      return actA - actB || String(a?.name || "").localeCompare(String(b?.name || ""));
    });

  const counts = bossEntries.reduce(
    (acc, entry) => {
      acc.total += 1;
      const tier = entry?.bossProfile?.tier;
      if (tier === "act_boss") {
        acc.actBoss += 1;
      } else if (tier === "quest_boss") {
        acc.questBoss += 1;
      } else if (tier === "super_unique") {
        acc.superUnique += 1;
      } else if (tier === "uber") {
        acc.uber += 1;
      }
      return acc;
    },
    {
      total: 0,
      actBoss: 0,
      questBoss: 0,
      superUnique: 0,
      uber: 0,
    }
  );

  return {
    version: `d2-bosses-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    source: {
      derivedFrom: path.relative(ROOT, OUTPUT_PATH),
      pageSource: "Diablo Archive Fandom MediaWiki API",
    },
    counts,
    entries: bossEntries,
  };
}

function buildBossAssetsOutput(entries, spriterAssetMetadata, assetPathsById, wikiImageAssets) {
  const bossAssetEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.bossProfile)
    .map((entry) =>
      buildBossAssetCatalogEntry(
        entry,
        spriterAssetMetadata,
        assetPathsById,
        wikiImageAssets.get(normalizeFileTitle(entry?.assetRefs?.referenceOnly?.sourceImage || ""))
      )
    )
    .sort((left, right) => {
      const actA = Number.isInteger(left?.act) ? left.act : 99;
      const actB = Number.isInteger(right?.act) ? right.act : 99;
      return actA - actB || String(left?.name || "").localeCompare(String(right?.name || ""));
    });

  const counts = bossAssetEntries.reduce(
    (acc, entry) => {
      acc.total += 1;
      const primaryMatchType = entry?.primary?.matchType || "missing";
      acc.primary[primaryMatchType] = (acc.primary[primaryMatchType] || 0) + 1;

      ["exact", "variant", "family", "surrogate"].forEach((matchType) => {
        const candidates = Array.isArray(entry?.candidates?.[matchType]) ? entry.candidates[matchType] : [];
        if (candidates.some((candidate) => candidate.assetClass === "sprite")) {
          acc.localSpriteCoverage[matchType] += 1;
        }
        if (candidates.some((candidate) => candidate.sourceKinds.includes("wiki_source_image"))) {
          acc.wikiImageCoverage[matchType] += 1;
        }
      });

      return acc;
    },
    {
      total: 0,
      primary: {
        exact: 0,
        variant: 0,
        family: 0,
        surrogate: 0,
        missing: 0,
      },
      localSpriteCoverage: {
        exact: 0,
        variant: 0,
        family: 0,
        surrogate: 0,
      },
      wikiImageCoverage: {
        exact: 0,
        variant: 0,
        family: 0,
        surrogate: 0,
      },
      uniqueWikiSourceImages: wikiImageAssets.size,
    }
  );

  return {
    version: `d2-boss-assets-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    source: {
      derivedFrom: path.relative(ROOT, OUTPUT_BOSSES_PATH),
      imageApi: `${API_URL}?action=query&prop=imageinfo&iiprop=url`,
      downloadedWikiImageDir: path.relative(ROOT, BOSS_WIKI_IMAGE_DIRECTORY),
      notes: "All boss art in this manifest is reference-only and not shipping-safe production art.",
    },
    counts,
    entries: bossAssetEntries,
  };
}

function buildOutput(entries) {
  const counts = (Array.isArray(entries) ? entries : []).reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.group === "regular") {
        acc.regular += 1;
      } else if (entry.group === "super_unique") {
        acc.superUnique += 1;
      } else if (entry.group === "uber") {
        acc.uber += 1;
      }
      return acc;
    },
    {
      total: 0,
      regular: 0,
      superUnique: 0,
      uber: 0,
    }
  );

  return {
    version: `d2-monsters-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    source: {
      indexPage: INDEX_PAGE_URL,
      api: API_URL,
      pageSource: "Diablo Archive Fandom MediaWiki API",
    },
    counts,
    entries,
  };
}

async function main() {
  const seedMetadata = collectSeedMetadata();
  const existingSeedKeys = seedMetadata.allKeys;
  const assetsManifest = seedMetadata.assetsManifest;
  const spriterAssetMetadata = seedMetadata.spriterAssetMetadata;
  const referenceAssetPaths = REFERENCE_ASSET_DIRECTORIES.flatMap((dirPath) => walkFiles(dirPath));
  const namedSpriteAssetPaths = [
    ...referenceAssetPaths,
    ...walkFiles(SPRITER_RAW_DIRECTORY),
  ].filter((value, index, source) => source.indexOf(value) === index);
  const assetPathsById = buildAssetPathsById(namedSpriteAssetPaths);
  const indexWikitext = await fetchIndexWikitext();
  const indexedEntries = parseIndexEntries(indexWikitext);
  const detailMap = await fetchPageDetails(indexedEntries);
  const fallbackTitleByEntry = await resolveFallbackDetails(indexedEntries, detailMap);

  const entries = indexedEntries.map((entry) => {
    const resolvedPageTitle = fallbackTitleByEntry.get(entry.pageTitle) || entry.pageTitle;
    const details = detailMap.get(resolvedPageTitle) || {
      pageId: null,
      summary: null,
      wikitext: "",
    };
    const metadata = extractPageMetadata({
      summary: details.summary,
      wikitext: details.wikitext,
    });
    const seedKey = existingSeedKeys.has(entry.id) ? entry.id : null;
    const enrichedEntry = {
      ...entry,
      resolvedPageTitle,
      pageId: details.pageId,
      seedKey,
      pageResolved: Boolean(details.pageId),
      summary:
        metadata.summary ||
        `Indexed from the Diablo Archive monster roster; no dedicated source page was resolved for ${entry.name}.`,
      categories: metadata.categories,
      monsterType: metadata.monsterType,
      breed: metadata.breed,
      baseMonster: metadata.baseMonster,
      guestMonsterActs: metadata.guestMonsterActs,
      specialAbilities: metadata.specialAbilities,
      wikiSections: metadata.wikiSections,
      variants: metadata.variants,
    };
    const manifestRefs = collectManifestAssetReferences(enrichedEntry, assetsManifest);
    const localReferenceSprites = collectLocalReferenceAssetCandidates(
      enrichedEntry,
      referenceAssetPaths,
      manifestRefs
    );

    return {
      ...enrichedEntry,
      bossProfile: buildBossProfile(enrichedEntry, seedMetadata),
      assetRefs: {
        shippingSafeIcon: inferShippingSafeIcon(enrichedEntry),
        referenceOnly: {
          manifest: manifestRefs,
          localSpriteCandidates: localReferenceSprites,
          sourceImage: entry.sourceImage || null,
        },
      },
    };
  });

  const wikiImageAssets = await resolveBossWikiImageAssets(entries.filter((entry) => entry?.bossProfile));
  const bossAssetsOutput = buildBossAssetsOutput(entries, spriterAssetMetadata, assetPathsById, wikiImageAssets);
  const bossAssetSelectionById = new Map(bossAssetsOutput.entries.map((entry) => [entry.id, entry.primary]));
  const entriesWithBossAssets = entries.map((entry) => {
    const bossSelection = bossAssetSelectionById.get(entry.id) || null;
    if (!bossSelection) {
      return entry;
    }

    return {
      ...entry,
      assetRefs: {
        ...entry.assetRefs,
        referenceOnly: {
          ...entry.assetRefs.referenceOnly,
          selection: bossSelection,
        },
      },
    };
  });

  const output = buildOutput(entriesWithBossAssets);
  const bossOutput = buildBossOutput(entriesWithBossAssets);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUTPUT_BOSSES_PATH, `${JSON.stringify(bossOutput, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUTPUT_BOSS_ASSETS_PATH, `${JSON.stringify(bossAssetsOutput, null, 2)}\n`, "utf8");

  const missingDetails = entriesWithBossAssets.filter((entry) => !entry.summary).length;
  console.log(
    JSON.stringify(
      {
        outputPath: path.relative(ROOT, OUTPUT_PATH),
        bossOutputPath: path.relative(ROOT, OUTPUT_BOSSES_PATH),
        bossAssetsOutputPath: path.relative(ROOT, OUTPUT_BOSS_ASSETS_PATH),
        counts: output.counts,
        bossCounts: bossOutput.counts,
        bossAssetCounts: bossAssetsOutput.counts,
        missingDetails,
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
