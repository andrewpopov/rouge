#!/usr/bin/env node

const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots");
const TIMEOUT = 5000;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const fullPath = path.resolve(ROOT, relative);

    if (!fullPath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    fs.createReadStream(fullPath).pipe(res);
  });
}

async function startServer() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const addr = server.address();
  return { server, baseUrl: `http://127.0.0.1:${addr.port}` };
}

/** Try to click a button matching name. Returns true if clicked. */
async function tryClick(page, name, waitMs = 350) {
  const btn = page.getByRole("button", { name });
  try {
    await btn.first().waitFor({ state: "visible", timeout: TIMEOUT });
    await btn.first().click();
    await page.waitForTimeout(waitMs);
    return true;
  } catch {
    return false;
  }
}

async function shot(page, name, opts = {}) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, type: "png", fullPage: !!opts.fullPage });
  console.log(`  ✓ ${name}.png${opts.fullPage ? " (full page)" : ""}`);
}

async function captureScreenshots(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204, body: "" }));

  console.log("\n📸 Capturing screenshots…\n");

  // Clear localStorage for a fresh start
  await page.goto(baseUrl);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.goto(baseUrl);
  await page.waitForTimeout(600);

  // ── 01. Title screen ──
  await shot(page, "01-title-screen");

  // ── 02. Character select ──
  if (!(await tryClick(page, "Begin Expedition", 500)) &&
      !(await tryClick(page, "New Expedition", 500))) {
    console.log("  ⚠ Could not start expedition");
    await browser.close();
    return;
  }
  await page.waitForTimeout(400);
  await shot(page, "02-character-select", { fullPage: true });

  // ── 03. Enter town ──
  if (!(await tryClick(page, /Enter .* Encampment/, 500))) {
    console.log("  ⚠ Could not enter town");
    await browser.close();
    return;
  }
  await shot(page, "03-town");

  // ── 04. Vendor ──
  if (await tryClick(page, /Gheed/i, 400)) {
    await shot(page, "04-vendor", { fullPage: true });
    await tryClick(page, /Leave/, 300);
  }

  // ── 05. Inventory (trigger via JS evaluation, screenshot, then close) ──
  try {
    const hasInvBtn = await page.locator('[data-action="open-inventory"]').count();
    if (hasInvBtn > 0) {
      await page.evaluate(() => {
        const btn = document.querySelector('[data-action="open-inventory"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(500);
      await shot(page, "05-inventory");
      // Close inventory via JS
      await page.evaluate(() => {
        const overlay = document.querySelector('.inv-overlay');
        if (overlay) overlay.click();
      });
      await page.waitForTimeout(400);
    } else {
      console.log("  ⚠ Inventory button not in DOM");
    }
  } catch (e) {
    console.log("  ⚠ Inventory error:", e.message);
  }

  // ── 06. World map ──
  // We may need to click the on-map exit gate button, not the overlay one
  const exitGate = page.locator(".town-exit-gate");
  const worldMapBtn = page.getByRole("button", { name: /World Map/i });
  let onWorldMap = false;

  try {
    if (await exitGate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exitGate.click();
      await page.waitForTimeout(400);
      onWorldMap = true;
    } else if (await worldMapBtn.isVisible().catch(() => false)) {
      await worldMapBtn.click();
      await page.waitForTimeout(400);
      onWorldMap = true;
    }
  } catch {}

  if (onWorldMap) {
    await shot(page, "06-world-map", { fullPage: true });

    // ── 07. Enter first zone ──
    if (await tryClick(page, /Blood Moor/i, 400)) {
      await shot(page, "07-encounter-choices");

      // ── 08. Combat ──
      if (await tryClick(page, /Charge Forward|Scout Ahead|Follow the Trail/i, 600)) {
        await shot(page, "08-combat");
      }
    }
  }

  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { server, baseUrl } = await startServer();
  console.log(`Server running at ${baseUrl}`);

  try {
    await captureScreenshots(baseUrl);
    console.log(`\n✅ Screenshots saved to screenshots/\n`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exitCode = 1;
});
