const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "4173", 10);
const DIST_DIR = path.resolve(__dirname, "../../dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" || ext === ".js" || ext === ".css" ? "no-cache, no-store, must-revalidate" : "public, max-age=86400",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  let filePath = path.join(DIST_DIR, url.pathname);

  if (filePath.endsWith("/")) {
    filePath = path.join(filePath, "index.html");
  }

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, filePath);
    } else if (!err && stats.isDirectory()) {
      serveFile(res, path.join(filePath, "index.html"));
    } else {
      serveFile(res, path.join(DIST_DIR, "index.html"));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Rouge static server running on http://localhost:${PORT}`);
  console.log(`Serving files from ${DIST_DIR}`);
});
