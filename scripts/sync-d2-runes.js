#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://diablo-archive.fandom.com/api.php";
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "seeds", "d2", "runes.json");
const RUNE_WIKI_IMAGE_DIRECTORY = path.join(
  ROOT,
  "assets",
  "diablo2_downloads",
  "potential_art",
  "runes",
  "wiki"
);
const DETAIL_BATCH_SIZE = 20;
const IMAGE_INFO_BATCH_SIZE = 20;
const RUNES_INDEX_PAGE_TITLE = "Runes (Diablo II)";
const RUNES_INDEX_PAGE_URL = "https://diablo-archive.fandom.com/wiki/Runes_(Diablo_II)";
const DEFAULT_RUNE_ICON = "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg";
const HIGH_RUNE_ICON = "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg";
const COUNT_WORDS = {
  one: 1,
  two: 2,
  three: 3,
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
      "user-agent": "rouge-rune-sync/1.0",
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
      "user-agent": "rouge-rune-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Asset download failed (${response.status} ${response.statusText}) for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destinationPath, buffer);
}

async function resolveRuneWikiImageAssets(entries) {
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
    const absolutePath = path.join(RUNE_WIKI_IMAGE_DIRECTORY, fileName);
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

function parseLinkCell(cell) {
  const value = String(cell || "").trim();
  const match = value.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (!match) {
    const cleaned = cleanMarkup(value);
    return {
      pageTitle: normalizePageTitle(cleaned),
      label: cleaned,
    };
  }
  return {
    pageTitle: normalizePageTitle(match[1]),
    label: cleanMarkup(match[2] || match[1]),
  };
}

function parseFileCell(cell) {
  const value = String(cell || "").trim();
  const match = value.match(/^\[\[(?:File|Image):([^\]|]+)(?:\|[^\]]*)?\]\]$/i);
  return match ? normalizeFileTitle(match[1]) : null;
}

function parseRuneIndexEntries(wikitext) {
  const sectionMatch = String(wikitext || "").match(/==\s*List of Runes\s*==([\s\S]*?)\{\{Items/);
  const section = sectionMatch ? sectionMatch[1] : "";
  const lines = section.split("\n");
  const rows = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === "|-") {
      if (current) {
        rows.push(current);
      }
      current = null;
      return;
    }
    if (!trimmed.startsWith("|") || trimmed === "|}" || trimmed.startsWith("{|")) {
      return;
    }
    current = current ? `${current} ${trimmed}` : trimmed;
  });

  if (current) {
    rows.push(current);
  }

  return rows
    .map((row) =>
      row
        .replace(/^\|/, "")
        .split(/\s*\|\|\s*/)
        .map((cell) => cell.trim())
    )
    .filter((cells) => cells.length >= 7)
    .filter((cells) => /^\d+$/.test(cells[0]))
    .map((cells) => {
      const rank = Number.parseInt(cells[0], 10);
      const nameCell = parseLinkCell(cells[1]);
      const bossCell = parseLinkCell(cells[5]);
      const levelRequirementRaw = normalizeMaybeEmpty(cells[3]);
      const dropChanceRaw = normalizeMaybeEmpty(cells[4]);
      return {
        rank,
        name: nameCell.label,
        id: normalizeId(nameCell.label),
        pageTitle: `${nameCell.label} (Diablo II)`,
        sourceUrl: buildSourceUrl(`${nameCell.label} (Diablo II)`),
        imageTitle: parseFileCell(cells[2]),
        levelRequirement: levelRequirementRaw ? Number.parseInt(levelRequirementRaw, 10) || null : null,
        levelRequirementRaw,
        dropChance: {
          raw: dropChanceRaw,
          percent: dropChanceRaw ? Number.parseFloat(dropChanceRaw.replace(/%/g, "")) : null,
          rate: dropChanceRaw ? Number.parseFloat(dropChanceRaw.replace(/%/g, "")) / 100 : null,
        },
        bestDropSource: {
          bossName: bossCell.label,
          bossPageTitle: bossCell.pageTitle,
          difficulty: normalizeMaybeEmpty(cells[6]),
          bossSourceUrl: buildSourceUrl(bossCell.pageTitle),
        },
        isHighRune: rank >= 23,
      };
    });
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

function extractFirstTemplateTitle(wikitext) {
  const match = String(wikitext || "").match(/^\s*\{\{([^{}|]+?)(?:\|[^{}]*)?\}\}/m);
  if (!match) {
    return null;
  }
  const rawTitle = normalizePageTitle(match[1]);
  return /^template:/i.test(rawTitle) ? rawTitle : `Template:${rawTitle}`;
}

function extractNamedSection(wikitext, headings) {
  const normalizedHeadings = (Array.isArray(headings) ? headings : [headings]).map((heading) =>
    String(heading || "").trim().toLowerCase()
  );
  const lines = String(wikitext || "").split("\n");
  const headingLine = /^==\s*(.*?)\s*==\s*$/;
  const startIndex = lines.findIndex((line) => {
    const match = line.trim().match(headingLine);
    return match ? normalizedHeadings.includes(String(match[1] || "").trim().toLowerCase()) : false;
  });

  if (startIndex === -1) {
    return "";
  }

  const body = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (headingLine.test(line.trim())) {
      break;
    }
    body.push(line);
  }

  return body.join("\n").trim();
}

function extractSectionTemplateTitles(sectionText) {
  return Array.from(String(sectionText || "").matchAll(/\{\{([^{}|]+?)(?:\|[^{}]*)?\}\}/g))
    .map((match) => normalizePageTitle(match[1]))
    .filter((title) => /\(Diablo II\)$/i.test(title))
    .filter((title, index, source) => source.indexOf(title) === index)
    .filter(Boolean);
}

function extractSectionBullets(sectionText) {
  return String(sectionText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\*+/.test(line))
    .map((line) => cleanMarkup(line.replace(/^\*+\s*/, "")))
    .filter(Boolean);
}

function extractSectionParagraphs(sectionText) {
  const paragraphs = [];
  let current = [];

  String(sectionText || "")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      const isNonContent = !trimmed || /^\*+/.test(trimmed) || trimmed.startsWith("{{") || /^<div/i.test(trimmed);
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

  return paragraphs.filter(Boolean);
}

function parseRuneSocketBonuses(baseStatsText) {
  const lines = cleanMarkup(baseStatsText)
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const result = {
    weapon: null,
    armor: null,
    helm: null,
    shield: null,
    levelRequirement: null,
    levelRequirementRaw: null,
  };

  lines.forEach((line) => {
    const match = line.match(/^(Weapons?|Armor|Helms?|Shields?)\s*:\s*(.+)$/i);
    if (match) {
      const key = String(match[1] || "").toLowerCase();
      const value = normalizeWhitespace(match[2]);
      if (key.startsWith("weapon")) {
        result.weapon = value;
      } else if (key.startsWith("armor")) {
        result.armor = value;
      } else if (key.startsWith("helm")) {
        result.helm = value;
      } else if (key.startsWith("shield")) {
        result.shield = value;
      }
      return;
    }

    const levelMatch = line.match(/^Level Requirement\s*:\s*(.+)$/i);
    if (levelMatch) {
      result.levelRequirementRaw = normalizeMaybeEmpty(levelMatch[1]);
      result.levelRequirement = result.levelRequirementRaw ? Number.parseInt(result.levelRequirementRaw, 10) || null : null;
    }
  });

  return result;
}

function parseUpgradeRecipe(text, runeName) {
  const source = normalizeWhitespace(String(text || ""));
  if (!source || !/horadric cube/i.test(source)) {
    return null;
  }

  const simpleMatch = source.match(
    /\b(Three|Two|One)\s+([A-Za-z' -]+?)\s+runes?\s+are needed to create one\s+([A-Za-z' -]+?)\s+through the Horadric Cube(?:\s*\(([^)]+)\))?/i
  );
  if (simpleMatch) {
    return {
      sources: [
        {
          type: "rune",
          count: COUNT_WORDS[String(simpleMatch[1] || "").toLowerCase()] || null,
          name: normalizeWhitespace(simpleMatch[2]),
          id: normalizeId(simpleMatch[2]),
        },
      ],
      output: {
        name: normalizeWhitespace(simpleMatch[3] || runeName),
        id: normalizeId(simpleMatch[3] || runeName),
      },
      note: normalizeMaybeEmpty(simpleMatch[4]) || null,
    };
  }

  const gemMatch = source.match(
    /\b(Two|Three|One)\s+([A-Za-z' -]+?)\s+runes?\s+and\s+one\s+([A-Za-z' -]+?)\s+are needed to create one\s+([A-Za-z' -]+?)\s+through the Horadric Cube(?:\s*\(([^)]+)\))?/i
  );
  if (gemMatch) {
    return {
      sources: [
        {
          type: "rune",
          count: COUNT_WORDS[String(gemMatch[1] || "").toLowerCase()] || null,
          name: normalizeWhitespace(gemMatch[2]),
          id: normalizeId(gemMatch[2]),
        },
        {
          type: "gem",
          count: 1,
          name: normalizeWhitespace(gemMatch[3]),
          id: normalizeId(gemMatch[3]),
        },
      ],
      output: {
        name: normalizeWhitespace(gemMatch[4] || runeName),
        id: normalizeId(gemMatch[4] || runeName),
      },
      note: normalizeMaybeEmpty(gemMatch[5]) || null,
    };
  }

  return null;
}

function parseRunePageMetadata(detail, runeName) {
  const wikitext = detail?.wikitext || "";
  const runewords = extractSectionTemplateTitles(extractNamedSection(wikitext, ["Rune Words", "Rune words"])).map((title) =>
    title.replace(/\s*\(Diablo II\)\s*$/i, "")
  );
  const ladderOnlyRunewords = extractSectionTemplateTitles(
    extractNamedSection(wikitext, ["Ladder-Only Rune Words", "Ladder-Only Rune words"])
  ).map((title) => title.replace(/\s*\(Diablo II\)\s*$/i, ""));
  const craftedItemUses = extractSectionBullets(extractNamedSection(wikitext, ["Crafted Items"]));
  const trivia = [
    ...extractSectionParagraphs(extractNamedSection(wikitext, ["Trivia"])),
    ...extractSectionBullets(extractNamedSection(wikitext, ["Trivia"])),
  ];
  const leadParagraphs = extractSectionParagraphs(wikitext.split(/^==/m)[0] || "");
  const introText = leadParagraphs.join(" ");

  return {
    summary: detail?.summary || leadParagraphs[0] || null,
    templateTitle: extractFirstTemplateTitle(wikitext),
    runewords,
    ladderOnlyRunewords,
    craftedItemUses,
    trivia,
    cubeUpgradeRecipe: parseUpgradeRecipe(introText, runeName),
  };
}

function buildRuneEntry(indexEntry, detail, templateFields, pageMetadata, wikiImageAsset) {
  const socketBonuses = parseRuneSocketBonuses(templateFields?.basestats || "");
  return {
    id: indexEntry.id,
    name: indexEntry.name,
    rank: indexEntry.rank,
    pageTitle: indexEntry.pageTitle,
    pageId: detail?.pageId ?? null,
    sourceUrl: indexEntry.sourceUrl,
    summary: normalizeWhitespace(pageMetadata.summary),
    isHighRune: indexEntry.isHighRune,
    levelRequirement: socketBonuses.levelRequirement ?? indexEntry.levelRequirement,
    levelRequirementRaw: socketBonuses.levelRequirementRaw ?? indexEntry.levelRequirementRaw,
    bestDropSource: indexEntry.bestDropSource,
    dropChance: indexEntry.dropChance,
    socketBonuses: {
      weapon: socketBonuses.weapon,
      armor: socketBonuses.armor,
      helm: socketBonuses.helm,
      shield: socketBonuses.shield,
    },
    cubeUpgradeRecipe: pageMetadata.cubeUpgradeRecipe,
    runewords: {
      standard: pageMetadata.runewords,
      ladderOnly: pageMetadata.ladderOnlyRunewords,
      total: pageMetadata.runewords.length + pageMetadata.ladderOnlyRunewords.length,
    },
    craftedItemUses: pageMetadata.craftedItemUses,
    trivia: pageMetadata.trivia,
    availability: {
      internalWiki: true,
      rewardPool: false,
      gearCatalog: false,
      note: "D2 rune reference only; runes, runewords, and socketing are not implemented in the Rouge runtime.",
    },
    assetRefs: {
      shippingSafeIcon: indexEntry.isHighRune ? HIGH_RUNE_ICON : DEFAULT_RUNE_ICON,
      referenceOnly: {
        sourceImage: indexEntry.imageTitle || normalizeFileTitle(templateFields?.image || ""),
        downloadedImage: wikiImageAsset?.path || null,
        imageUrl: wikiImageAsset?.url || null,
        descriptionUrl: wikiImageAsset?.descriptionUrl || null,
      },
    },
  };
}

function buildOutput(entries) {
  const counts = (Array.isArray(entries) ? entries : []).reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.isHighRune) {
        acc.highRunes += 1;
      }
      const difficulty = entry?.bestDropSource?.difficulty || "Unknown";
      acc.byBestDropDifficulty[difficulty] = (acc.byBestDropDifficulty[difficulty] || 0) + 1;
      const bossName = entry?.bestDropSource?.bossName || "Unknown";
      acc.byBestDropBoss[bossName] = (acc.byBestDropBoss[bossName] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      highRunes: 0,
      byBestDropDifficulty: {},
      byBestDropBoss: {},
      uniqueWikiSourceImages: 0,
    }
  );

  return {
    version: `d2-runes-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    source: {
      indexPageTitle: RUNES_INDEX_PAGE_TITLE,
      indexPage: RUNES_INDEX_PAGE_URL,
      api: API_URL,
      pageSource: "Diablo Archive Fandom MediaWiki API",
      downloadedWikiImageDir: path.relative(ROOT, RUNE_WIKI_IMAGE_DIRECTORY),
      notes: "All downloaded rune art is reference-only and not shipping-safe production art.",
    },
    counts,
    entries,
  };
}

async function main() {
  const indexWikitext = await fetchPageWikitext(RUNES_INDEX_PAGE_TITLE);
  const indexedEntries = parseRuneIndexEntries(indexWikitext);
  const detailMap = await fetchPageDetailsForTitles(indexedEntries.map((entry) => entry.pageTitle));
  const pageMetadataById = new Map();
  const templateTitles = [];

  indexedEntries.forEach((entry) => {
    const detail = detailMap.get(entry.pageTitle) || {
      pageId: null,
      summary: null,
      wikitext: "",
    };
    const pageMetadata = parseRunePageMetadata(detail, entry.name);
    pageMetadataById.set(entry.id, pageMetadata);
    if (pageMetadata.templateTitle) {
      templateTitles.push(pageMetadata.templateTitle);
    }
  });

  const templateWikitextByTitle = await fetchTemplateWikitextByTitle(templateTitles);
  const parsedEntries = indexedEntries.map((entry) => {
    const pageMetadata = pageMetadataById.get(entry.id) || {};
    const templateWikitext = pageMetadata.templateTitle
      ? templateWikitextByTitle.get(pageMetadata.templateTitle) || ""
      : "";
    return {
      ...entry,
      detail: detailMap.get(entry.pageTitle) || {
        pageId: null,
        summary: null,
        wikitext: "",
      },
      pageMetadata,
      templateFields: parseTemplateFields(templateWikitext),
      imageTitle: entry.imageTitle || normalizeFileTitle(parseTemplateFields(templateWikitext).image || ""),
    };
  });

  const wikiImageAssets = await resolveRuneWikiImageAssets(parsedEntries);
  const entries = parsedEntries.map((entry) =>
    buildRuneEntry(
      entry,
      entry.detail,
      entry.templateFields,
      entry.pageMetadata,
      wikiImageAssets.get(normalizeFileTitle(entry.imageTitle || "")) || null
    )
  );

  const output = buildOutput(entries);
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
