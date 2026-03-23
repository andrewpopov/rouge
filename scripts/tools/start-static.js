const http = require("http");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = parseInt(process.env.PORT || "4173", 10);
const DIST_DIR = path.resolve(__dirname, "../../dist");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SESSION_SECRET = process.env.ROGUE_SESSION_SECRET || "dev-secret-change-me";
const MAX_BODY_SIZE = 16 * 1024;

let db = null;
try {
  db = require("./db");
} catch (_) {
  console.warn("SQLite db module not available — auth endpoints disabled");
}

// Kill any previous server on this port
try {
  const pids = execSync(`lsof -ti tcp:${PORT}`, { encoding: "utf-8" }).trim();
  if (pids) {
    for (const pid of pids.split("\n")) {
      try { process.kill(Number(pid), "SIGKILL"); } catch (_) {}
    }
    // Wait for port to be released
    execSync("sleep 0.5");
    console.log(`Killed previous process(es) on port ${PORT}`);
  }
} catch (_) {
  // No process on port — nothing to kill
}

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

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function signSession(googleId) {
  const payload = JSON.stringify({ sub: googleId, iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifySession(cookie) {
  if (!cookie) { return null; }
  const [encoded, sig] = cookie.split(".");
  if (!encoded || !sig) { return null; }
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) { return null; }
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getSessionCookie(req) {
  const header = req.headers.cookie || "";
  const match = header.match(/(?:^|;\s*)rogue_session=([^\s;]+)/);
  return match ? match[1] : null;
}

function setSessionCookie(res, value, maxAge) {
  const parts = [`rogue_session=${value}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (maxAge !== undefined) { parts.push(`Max-Age=${maxAge}`); }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    https.get(url, (resp) => {
      const chunks = [];
      resp.on("data", (chunk) => chunks.push(chunk));
      resp.on("end", () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (resp.statusCode !== 200) {
            reject(new Error(body.error_description || "Token verification failed"));
            return;
          }
          resolve(body);
        } catch {
          reject(new Error("Invalid tokeninfo response"));
        }
      });
    }).on("error", reject);
  });
}

function formatUserResponse(row) {
  return {
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
  };
}

async function handleApiRoute(req, res, url) {
  const route = url.pathname;

  if (route === "/api/auth/google" && req.method === "POST") {
    if (!db) {
      sendJson(res, 503, { ok: false, error: "Auth not configured" });
      return;
    }
    try {
      const body = await parseJsonBody(req);
      const credential = body.credential;
      if (!credential) {
        sendJson(res, 400, { ok: false, error: "Missing credential" });
        return;
      }
      const tokenInfo = await verifyGoogleToken(credential);
      if (GOOGLE_CLIENT_ID && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
        sendJson(res, 403, { ok: false, error: "Invalid audience" });
        return;
      }
      const user = db.upsertUser(tokenInfo.sub, tokenInfo.email, tokenInfo.name || "", tokenInfo.picture || "");
      setSessionCookie(res, signSession(tokenInfo.sub), 30 * 24 * 60 * 60);
      sendJson(res, 200, { ok: true, user: formatUserResponse(user) });
    } catch (err) {
      sendJson(res, 401, { ok: false, error: err.message });
    }
    return;
  }

  if (route === "/api/auth/status" && req.method === "GET") {
    const session = verifySession(getSessionCookie(req));
    if (!session?.sub || !db) {
      sendJson(res, 200, { authenticated: false });
      return;
    }
    const user = db.getUserByGoogleId(session.sub);
    if (!user) {
      sendJson(res, 200, { authenticated: false });
      return;
    }
    sendJson(res, 200, { authenticated: true, user: formatUserResponse(user) });
    return;
  }

  if (route === "/api/auth/logout" && req.method === "POST") {
    setSessionCookie(res, "deleted", 0);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (url.pathname.startsWith("/api/")) {
    handleApiRoute(req, res, url).catch((err) => {
      sendJson(res, 500, { error: "Internal error" });
    });
    return;
  }

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
  console.log(`Rogue static server running on http://localhost:${PORT}`);
  console.log(`Serving files from ${DIST_DIR}`);
});
