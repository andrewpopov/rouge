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

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node scripts/import-latest-generated-art.js --kind enemy --slug fallen

Options:
  --kind enemy|boss|portrait|mercenary
  --slug snake_case target asset id
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

  if (sourceExt === ".png") {
    fs.renameSync(sourcePath, destinationPath);
    return;
  }

  const magickResult = spawnSync("magick", [sourcePath, destinationPath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (magickResult.status !== 0) {
    throw new Error(`ImageMagick failed: ${magickResult.stderr || magickResult.stdout}`.trim());
  }
  fs.rmSync(sourcePath, { force: true });
}

function buildManifestObject() {
  const readFolder = (folder) =>
    fs
      .readdirSync(path.join(ROUGE_ART_DIR, folder), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
      .map((entry) => path.parse(entry.name).name)
      .sort();

  return {
    enemies: readFolder("enemies"),
    bosses: readFolder("bosses"),
    portraits: readFolder("portraits"),
    mercenaries: readFolder("mercenaries"),
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
  const destinationPath = path.join(ROUGE_ART_DIR, folder, `${args.slug}.png`);

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
