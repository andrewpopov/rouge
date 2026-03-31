#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DOWNLOADS_DIR = path.join(os.homedir(), "Downloads");
const ROUGE_ART_DIR = path.join(ROOT, "assets/curated/rouge-art");
const MANIFEST_PATH = path.join(ROOT, "src/content/rouge-art-manifest.ts");

const KIND_TO_FOLDER = {
  enemy: "enemies",
  boss: "bosses",
  portrait: "portraits",
  mercenary: "mercenaries",
};

function parseArgs(argv) {
  const parsed = {
    kind: "",
    slug: "",
    variant: "",
    downloadsDir: DOWNLOADS_DIR,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--kind") {
      parsed.kind = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--slug") {
      parsed.slug = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--variant") {
      parsed.variant = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--downloads-dir") {
      parsed.downloadsDir = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!KIND_TO_FOLDER[parsed.kind]) {
    throw new Error(`Missing or invalid --kind. Use one of: ${Object.keys(KIND_TO_FOLDER).join(", ")}`);
  }
  if (!/^[a-z0-9_]+$/.test(parsed.slug)) {
    throw new Error("Missing or invalid --slug. Use lowercase snake_case only.");
  }
  if (parsed.variant && !/^[a-z0-9_]+$/.test(parsed.variant)) {
    throw new Error("Invalid --variant. Use lowercase snake_case only.");
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node scripts/import-latest-generated-art.js --kind enemy --slug fallen

Options:
  --kind enemy|boss|portrait|mercenary
  --slug snake_case target asset id
  --variant snake_case alt label (writes slug__variant.webp)
  --downloads-dir /custom/path
  --dry-run
`);
}

function getLatestImageFile(downloadsDir) {
  const entries = fs
    .readdirSync(downloadsDir)
    .map((name) => {
      const fullPath = path.join(downloadsDir, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, stat };
    })
    .filter((entry) => entry.stat.isFile())
    .filter((entry) => /\.(png|jpg|jpeg|webp)$/i.test(entry.name))
    .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);

  if (entries.length === 0) {
    throw new Error(`No image files found in ${downloadsDir}`);
  }

  return entries[0];
}

function ensureRougeArtDirs() {
  Object.values(KIND_TO_FOLDER).forEach((folder) => {
    fs.mkdirSync(path.join(ROUGE_ART_DIR, folder), { recursive: true });
  });
}

function importImageFile(sourcePath, destinationPath) {
  const sourceExt = path.extname(sourcePath).toLowerCase();
  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { force: true });
  }

  if (sourceExt === ".webp") {
    fs.renameSync(sourcePath, destinationPath);
    return;
  }

  const magickResult = spawnSync("magick", [sourcePath, "-quality", "90", destinationPath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (magickResult.status !== 0) {
    throw new Error(`ImageMagick failed: ${magickResult.stderr || magickResult.stdout}`.trim());
  }
  fs.rmSync(sourcePath, { force: true });
}

function buildManifestObject() {
  const readFolder = (folder) => {
    const grouped = new Map();
    const entries = fs
      .readdirSync(path.join(ROUGE_ART_DIR, folder), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(png|webp)$/i.test(entry.name))
      .map((entry) => entry.name);

    entries.forEach((fileName) => {
      const baseName = path.parse(fileName).name;
      const variantIndex = baseName.indexOf("__");
      const slug = variantIndex === -1 ? baseName : baseName.slice(0, variantIndex);
      if (!grouped.has(slug)) {
        grouped.set(slug, []);
      }
      grouped.get(slug).push(fileName);
    });

    const slugs = [...grouped.keys()].sort();
    const variants = Object.fromEntries(
      slugs.map((slug) => {
        const primaryFile = `${slug}.webp`;
        const files = (grouped.get(slug) || []).sort((left, right) => {
          if (left === primaryFile) {
            return -1;
          }
          if (right === primaryFile) {
            return 1;
          }
          if (left === `${slug}.png`) {
            return -1;
          }
          if (right === `${slug}.png`) {
            return 1;
          }
          return left.localeCompare(right);
        });
        return [slug, files];
      })
    );

    return { slugs, variants };
  };

  const enemies = readFolder("enemies");
  const bosses = readFolder("bosses");
  const portraits = readFolder("portraits");
  const mercenaries = readFolder("mercenaries");

  return {
    enemies: enemies.slugs,
    bosses: bosses.slugs,
    portraits: portraits.slugs,
    mercenaries: mercenaries.slugs,
    enemyVariants: enemies.variants,
    bossVariants: bosses.variants,
    portraitVariants: portraits.variants,
    mercenaryVariants: mercenaries.variants,
  };
}

function writeManifestFile(manifest) {
  const content = `(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  runtimeWindow.__ROUGE_UNIQUE_ART_MANIFEST = ${JSON.stringify(manifest, null, 2)};
})();
`;
  fs.writeFileSync(MANIFEST_PATH, content, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const latestImage = getLatestImageFile(args.downloadsDir);
  const folder = KIND_TO_FOLDER[args.kind];
  const fileName = `${args.slug}${args.variant ? `__${args.variant}` : ""}.webp`;
  const destinationPath = path.join(ROUGE_ART_DIR, folder, fileName);

  console.log(`latest download: ${latestImage.fullPath}`);
  console.log(`target asset: ${destinationPath}`);

  if (args.dryRun) {
    return;
  }

  ensureRougeArtDirs();
  importImageFile(latestImage.fullPath, destinationPath);
  const manifest = buildManifestObject();
  writeManifestFile(manifest);

  console.log(`imported ${args.slug} (${args.kind})`);
  console.log(`updated manifest: ${MANIFEST_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
