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

function main() {
  cleanDist();

  const runtimeFiles = getRuntimeFiles();
  runtimeFiles.forEach(copyFile);
  REQUIRED_DIRECTORIES.forEach(copyDirectory);

  const buildManifest = {
    builtAt: new Date().toISOString(),
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
