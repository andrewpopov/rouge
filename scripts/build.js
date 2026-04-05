#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const REQUIRED_DIRECTORIES = [
  "assets/curated",
  "assets/raw",
  "data/seeds",
];

let esbuild = null;
try {
  esbuild = require("esbuild");
} catch {
  console.warn("esbuild not installed — skipping minification (install with: npm i -D esbuild)");
}

function ensureExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing build input: ${relativePath}`);
  }
  return fullPath;
}

function copyFile(relativePath) {
  const sourcePath = ensureExists(relativePath);
  const destinationPath = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(relativePath) {
  const sourcePath = ensureExists(relativePath);
  const destinationPath = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function getScriptPaths() {
  const indexSource = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const scriptPattern = /<script\s+src="\.\/([^"]+\.js)"/g;
  const scripts = [];
  let match = scriptPattern.exec(indexSource);
  while (match) {
    scripts.push(match[1]);
    match = scriptPattern.exec(indexSource);
  }
  return scripts;
}

function getRuntimeFiles() {
  const indexSource = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const filePattern = /(?:href|src)="\.\/([^"]+)"/g;
  const files = new Set(["index.html"]);
  let match = filePattern.exec(indexSource);

  while (match) {
    const relativePath = match[1];
    if (relativePath && !relativePath.endsWith("/")) {
      files.add(relativePath);
    }
    match = filePattern.exec(indexSource);
  }

  return [...files].sort();
}

function cleanDist() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      fs.rmSync(DIST, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
  fs.mkdirSync(DIST, { recursive: true });
}

function bundleAndMinify() {
  if (!esbuild) {
    console.log("Skipping bundle step (esbuild not available).");
    return false;
  }

  const scriptPaths = getScriptPaths();
  if (scriptPaths.length === 0) {
    console.warn("No script tags found in index.html — skipping bundle.");
    return false;
  }

  const chunks = scriptPaths.map((relativePath) => {
    const fullPath = path.join(DIST, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Bundle input missing: ${relativePath}`);
    }
    return fs.readFileSync(fullPath, "utf8");
  });

  const concatenated = chunks.join("\n");

  const result = esbuild.buildSync({
    stdin: { contents: concatenated, loader: "js" },
    write: false,
    minify: true,
    target: "es2022",
    charset: "utf8",
  });

  const bundlePath = path.join(DIST, "bundle.min.js");
  fs.writeFileSync(bundlePath, result.outputFiles[0].text, "utf8");

  const originalSize = Buffer.byteLength(concatenated, "utf8");
  const minifiedSize = Buffer.byteLength(result.outputFiles[0].text, "utf8");
  console.log(`Bundled ${scriptPaths.length} scripts: ${(originalSize / 1024).toFixed(0)}KB → ${(minifiedSize / 1024).toFixed(0)}KB (${((1 - minifiedSize / originalSize) * 100).toFixed(0)}% reduction)`);

  return true;
}

function minifyCss() {
  if (!esbuild) { return; }

  const cssPath = path.join(DIST, "styles.css");
  if (!fs.existsSync(cssPath)) { return; }

  const original = fs.readFileSync(cssPath, "utf8");
  const result = esbuild.buildSync({
    stdin: { contents: original, loader: "css" },
    write: false,
    minify: true,
    target: "es2022",
    charset: "utf8",
  });

  fs.writeFileSync(cssPath, result.outputFiles[0].text, "utf8");

  const originalSize = Buffer.byteLength(original, "utf8");
  const minifiedSize = Buffer.byteLength(result.outputFiles[0].text, "utf8");
  console.log(`Minified CSS: ${(originalSize / 1024).toFixed(0)}KB → ${(minifiedSize / 1024).toFixed(0)}KB (${((1 - minifiedSize / originalSize) * 100).toFixed(0)}% reduction)`);
}

function rewriteIndexForBundle() {
  const indexPath = path.join(DIST, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  // Remove all individual generated script tags
  html = html.replace(/\s*<script src="\.\/generated\/[^"]+\.js"><\/script>/g, "");

  // Insert single bundle script before closing </body>
  html = html.replace("</body>", '    <script src="./bundle.min.js"></script>\n  </body>');

  fs.writeFileSync(indexPath, html, "utf8");
}

function cacheBustIndex() {
  const indexPath = path.join(DIST, "index.html");
  const version = Date.now().toString(36);
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(/(\.(?:js|css))"/g, `$1?v=${version}"`);
  fs.writeFileSync(indexPath, html, "utf8");
}

function main() {
  cleanDist();

  const runtimeFiles = getRuntimeFiles();
  runtimeFiles.forEach(copyFile);
  REQUIRED_DIRECTORIES.forEach(copyDirectory);

  const bundled = bundleAndMinify();
  if (bundled) {
    rewriteIndexForBundle();
  }
  minifyCss();
  cacheBustIndex();

  const buildManifest = {
    builtAt: new Date().toISOString(),
    bundled,
    runtimeFiles,
    copiedDirectories: REQUIRED_DIRECTORIES,
  };

  fs.writeFileSync(
    path.join(DIST, "build-manifest.json"),
    `${JSON.stringify(buildManifest, null, 2)}\n`,
    "utf8"
  );

  console.log(`Built static bundle in ${DIST}`);
  console.log(`Copied ${runtimeFiles.length} runtime files and ${REQUIRED_DIRECTORIES.length} directories.`);
}

main();
