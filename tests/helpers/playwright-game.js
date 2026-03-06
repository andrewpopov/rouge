const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { chromium } = require("playwright");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const GAME_URL = "http://127.0.0.1:<dynamic>/index.html";
const DEFAULT_VIEWPORT = { width: 1460, height: 920 };
const STORAGE_KEYS = [
  "brassline_meta_v1",
  "brassline_run_records_v1",
  "brassline_run_snapshot_v1",
  "brassline_onboarding_v1",
];
const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
};

let staticServer = null;
let staticServerUrl = "";
let staticServerStartPromise = null;

function clearStorageInPage(keys) {
  try {
    (Array.isArray(keys) ? keys : []).forEach((key) => {
      window.localStorage?.removeItem(key);
    });
  } catch (_error) {
    // Ignore storage cleanup failures in tests.
  }
}

async function launchBrowser() {
  return chromium.launch({ headless: true });
}

function createStaticServerHandler() {
  return (req, res) => {
    const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname || "/");
    const requestPath = decodedPath === "/" ? "/index.html" : decodedPath;
    const absolutePath = path.resolve(ROOT_DIR, `.${requestPath}`);
    if (absolutePath !== ROOT_DIR && !absolutePath.startsWith(`${ROOT_DIR}${path.sep}`)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.readFile(absolutePath, (error, data) => {
      if (error) {
        const statusCode = error.code === "ENOENT" ? 404 : 500;
        res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(statusCode === 404 ? "Not Found" : "Internal Server Error");
        return;
      }

      const ext = path.extname(absolutePath).toLowerCase();
      const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
      });
      res.end(data);
    });
  };
}

async function ensureStaticServer() {
  if (staticServerUrl) {
    return staticServerUrl;
  }
  if (staticServerStartPromise) {
    return staticServerStartPromise;
  }

  staticServerStartPromise = new Promise((resolve, reject) => {
    const server = http.createServer(createStaticServerHandler());
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port =
        address && typeof address === "object" && Number.isInteger(address.port) ? address.port : null;
      if (!port) {
        reject(new Error("Failed to resolve static server port."));
        return;
      }
      staticServer = server;
      staticServerUrl = `http://127.0.0.1:${port}/index.html`;
      resolve(staticServerUrl);
    });
  }).catch((error) => {
    staticServer = null;
    staticServerUrl = "";
    staticServerStartPromise = null;
    throw error;
  });

  return staticServerStartPromise;
}

async function closeStaticServer() {
  if (!staticServer) {
    staticServerUrl = "";
    staticServerStartPromise = null;
    return;
  }
  const server = staticServer;
  staticServer = null;
  staticServerUrl = "";
  staticServerStartPromise = null;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
  }
  await closeStaticServer();
}

async function openGamePage(
  browser,
  {
    resetStorage = true,
    waitForSelector = "#laneThreatForecast",
    viewport = DEFAULT_VIEWPORT,
  } = {}
) {
  const page = await browser.newPage({ viewport });
  const gameUrl = await ensureStaticServer();
  if (resetStorage) {
    await page.addInitScript(clearStorageInPage, STORAGE_KEYS);
  }
  await page.goto(gameUrl);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector);
  }
  if (resetStorage) {
    await page.evaluate(clearStorageInPage, STORAGE_KEYS);
  }
  return page;
}

async function getNumericText(page, selector) {
  const value = await page.locator(selector).innerText();
  return Number.parseInt(value, 10);
}

async function getTurn(page) {
  return getNumericText(page, "#turnValue");
}

async function waitForTurnAdvance(page, previousTurn, timeout = 1800) {
  await page.waitForFunction(
    (prev) => {
      const value = Number.parseInt(document.getElementById("turnValue")?.textContent || "0", 10);
      return Number.isInteger(value) && value > prev;
    },
    previousTurn,
    { timeout }
  );
}

module.exports = {
  GAME_URL,
  launchBrowser,
  closeBrowser,
  openGamePage,
  getNumericText,
  getTurn,
  waitForTurnAdvance,
};
