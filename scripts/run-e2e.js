#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const E2E_ROOT = path.join(ROOT, "tests", "e2e");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
};

function getMimeType(filename) {
  return MIME_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

function resolveDistPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const fullPath = path.resolve(DIST, relativePath);

  if (!fullPath.startsWith(DIST)) {
    return null;
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    return path.join(fullPath, "index.html");
  }

  return fullPath;
}

function createStaticServer() {
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method Not Allowed");
      return;
    }

    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const fullPath = resolveDistPath(requestUrl.pathname);

    if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": getMimeType(fullPath),
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(fullPath).pipe(response);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function listE2eTests() {
  if (!fs.existsSync(E2E_ROOT)) {
    throw new Error("Missing tests/e2e directory.");
  }

  return fs
    .readdirSync(E2E_ROOT)
    .filter((filename) => filename.endsWith(".test.js"))
    .sort()
    .map((filename) => path.join("tests", "e2e", filename));
}

function runNodeTests(baseUrl, files) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--test", ...files], {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        ROUGE_BASE_URL: baseUrl,
      },
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`E2E runner exited from signal ${signal}.`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`E2E runner exited with code ${code}.`));
        return;
      }
      resolve();
    });
  });
}

async function main() {
  const entryPoint = path.join(DIST, "index.html");
  if (!fs.existsSync(entryPoint)) {
    throw new Error("Missing dist/index.html. Run `npm run build` before `npm run test:e2e:built`.");
  }

  const testFiles = listE2eTests();
  if (testFiles.length === 0) {
    throw new Error("No e2e test files were found under tests/e2e.");
  }

  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer(server);
    throw new Error("Unable to determine the e2e server address.");
  }

  try {
    await runNodeTests(`http://127.0.0.1:${address.port}`, testFiles);
  } finally {
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
