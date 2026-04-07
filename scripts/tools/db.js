const path = require("path");
const { PrismaClient } = require("@prisma/client");

const DB_PATH = path.resolve(__dirname, "../../data/rouge.db");

let _prisma = null;

function getDb() {
  if (!_prisma) {
    _prisma = new PrismaClient({
      datasources: {
        db: { url: `file:${DB_PATH}` },
      },
      log: [],
    });
  }
  return _prisma;
}

async function upsertUser(googleId, email, name, avatarUrl) {
  const db = getDb();
  const user = await db.user.upsert({
    where: { googleId },
    create: {
      googleId,
      email,
      name: name || "",
      avatarUrl: avatarUrl || "",
    },
    update: {
      email,
      name: name || "",
      avatarUrl: avatarUrl || "",
      lastSeen: new Date(),
      visitCount: { increment: 1 },
    },
  });
  return user;
}

async function getUserByGoogleId(googleId) {
  const db = getDb();
  return db.user.findUnique({ where: { googleId } });
}

async function upsertProfileByGoogleId(googleId, profileJson, schemaVersion = 0) {
  const db = getDb();
  const existing = await db.profile.findUnique({ where: { userId: googleId } });
  if (existing) {
    return db.profile.update({
      where: { userId: googleId },
      data: {
        profileJson: String(profileJson || ""),
        schemaVersion: Number(schemaVersion || 0),
      },
    });
  }
  return db.profile.create({
    data: {
      userId: googleId,
      profileJson: String(profileJson || ""),
      schemaVersion: Number(schemaVersion || 0),
    },
  });
}

async function getProfileByGoogleId(googleId) {
  const db = getDb();
  const profile = await db.profile.findUnique({ where: { userId: googleId } });
  if (!profile) {
    return null;
  }
  return {
    google_id: googleId,
    profile_json: profile.profileJson,
    schema_version: profile.schemaVersion,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };
}

async function disconnect() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

module.exports = {
  getDb,
  upsertUser,
  getUserByGoogleId,
  upsertProfileByGoogleId,
  getProfileByGoogleId,
  disconnect,
};
