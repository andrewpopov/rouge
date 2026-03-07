#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright");

const DEFAULT_TAGS = ["steampunk", "machine", "smoke", "light", "energy"];

async function downloadTagArchive(page, tag, outputDir) {
  const url = `https://game-icons.net/tags/${tag}.html`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });

  if (!response || response.status() !== 200) {
    throw new Error(`Failed to load ${url} (status: ${response ? response.status() : "none"})`);
  }

  const title = (await page.textContent("h1#tag-name"))?.trim() || `${tag} icons`;
  const iconNames = await page.$$eval("ul.icons img.icon", (imgs) =>
    imgs.map((img) => (img.getAttribute("alt") || "").replace(/\s+icon$/i, "").trim()).filter(Boolean),
  );

  const outZip = path.join(outputDir, `${tag}.svg.zip`);
  const archiveHref = await page.$$eval(
    "#download a",
    (links, currentTag) => {
      const hrefs = links.map((link) => link.getAttribute("href") || "").filter(Boolean);
      const exactTransparent = hrefs.find(
        (href) => href.includes(`/archives/000000/transparent/${currentTag}.svg.zip`),
      );
      if (exactTransparent) {return exactTransparent;}

      const anySvg = hrefs.find((href) => href.includes(`${currentTag}.svg.zip`));
      return anySvg || null;
    },
    tag,
  );

  if (!archiveHref) {
    throw new Error(`Could not find SVG archive href for tag "${tag}"`);
  }

  const archiveUrl = new URL(archiveHref, page.url()).toString();
  const responseArchive = await page.context().request.get(archiveUrl);
  if (!responseArchive.ok()) {
    throw new Error(`Failed to fetch archive ${archiveUrl} (${responseArchive.status()})`);
  }

  await fs.writeFile(outZip, await responseArchive.body());

  return { title, iconCount: iconNames.length, iconNames, zipPath: outZip };
}

async function main() {
  const tags = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_TAGS;
  const outputDir = path.resolve(process.cwd(), "assets/source/game-icons");
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "https://game-icons.net",
    license: "CC BY 3.0",
    tags: {},
  };

  try {
    for (const tag of tags) {
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      try {
        const info = await downloadTagArchive(page, tag, outputDir);
        manifest.tags[tag] = info;
        console.log(`Downloaded ${tag}: ${info.iconCount} icons -> ${info.zipPath}`);
      } finally {
        await context.close();
      }
    }

    const manifestPath = path.join(outputDir, "manifest.json");
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Wrote manifest: ${manifestPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
