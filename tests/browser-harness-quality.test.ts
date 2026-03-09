export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { getAppRuntimeFiles } from "./helpers/browser-harness";

const ROOT = path.resolve(__dirname, "../..");
const INDEX_PATH = path.join(ROOT, "index.html");
const E2E_OWNED_BOOT_FILES = ["src/content/seed-loader.js", "src/app/main.js"];

function readBundledRuntimeFiles(): string[] {
  const indexSource = fs.readFileSync(INDEX_PATH, "utf8");
  return Array.from(indexSource.matchAll(/<script\s+src="\.\/generated\/([^"]+)"><\/script>/g), (match) => match[1]);
}

test("compiled-browser harness differs from the shipped bundle only for browser-owned boot scripts", () => {
  const bundledRuntimeFiles = readBundledRuntimeFiles();
  const harnessRuntimeFiles = getAppRuntimeFiles();

  const bundledOnly = bundledRuntimeFiles.filter((filename) => !harnessRuntimeFiles.includes(filename));
  const harnessOnly = harnessRuntimeFiles.filter((filename) => !bundledRuntimeFiles.includes(filename));

  assert.deepEqual(bundledOnly, E2E_OWNED_BOOT_FILES);
  assert.deepEqual(harnessOnly, []);
});

test("compiled-browser harness runtime order stays aligned with the shipped bundle order", () => {
  const bundledRuntimeFiles = readBundledRuntimeFiles().filter((filename) => !E2E_OWNED_BOOT_FILES.includes(filename));

  assert.deepEqual(getAppRuntimeFiles(), bundledRuntimeFiles);
});
