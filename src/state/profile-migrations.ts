(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const CURRENT_PROFILE_SCHEMA_VERSION = 2;

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object";
  }

  function toNumber(value, fallback = 0) {
    return Number.parseInt(String(value ?? fallback), 10) || fallback;
  }

  function ensureHistoryEntry(entry) {
    if (!isObject(entry)) {
      return null;
    }

    const outcome = typeof entry.outcome === "string" ? entry.outcome : "abandoned";
    return {
      runId: typeof entry.runId === "string" ? entry.runId : "",
      classId: typeof entry.classId === "string" ? entry.classId : "",
      className: typeof entry.className === "string" ? entry.className : "",
      level: Number.parseInt(String(entry.level || 1), 10) || 1,
      actsCleared: Number.parseInt(String(entry.actsCleared || 0), 10) || 0,
      bossesDefeated: Number.parseInt(String(entry.bossesDefeated || 0), 10) || 0,
      completedAt: typeof entry.completedAt === "string" ? entry.completedAt : new Date(0).toISOString(),
      outcome: outcome === "completed" || outcome === "failed" || outcome === "abandoned" ? outcome : "abandoned",
    };
  }

  function createDefaultMeta() {
    return {
      settings: {
        showHints: true,
        reduceMotion: false,
        compactMode: false,
      },
      progression: {
        highestLevel: 1,
        totalBossesDefeated: 0,
        classesPlayed: [],
        preferredClassId: "",
        lastPlayedClassId: "",
      },
    };
  }

  function ensureMeta(meta, runHistory) {
    const source = isObject(meta) ? meta : {};
    const history = Array.isArray(runHistory) ? runHistory : [];
    const defaultMeta = createDefaultMeta();
    const historyHighestLevel = history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.level, 1)), 1);
    const historyBosses = history.reduce((total, entry) => total + toNumber(entry?.bossesDefeated, 0), 0);
    const historyClasses = history.map((entry) => entry?.classId).filter((entry) => typeof entry === "string" && entry);

    return {
      settings: {
        ...defaultMeta.settings,
        ...(isObject(source.settings) ? source.settings : {}),
      },
      progression: {
        ...defaultMeta.progression,
        ...(isObject(source.progression) ? source.progression : {}),
        highestLevel: Math.max(toNumber(source.progression?.highestLevel, 1), historyHighestLevel),
        totalBossesDefeated: Math.max(toNumber(source.progression?.totalBossesDefeated, 0), historyBosses),
        classesPlayed: Array.from(
          new Set([
            ...(Array.isArray(source.progression?.classesPlayed)
              ? source.progression.classesPlayed.filter((entry) => typeof entry === "string" && entry)
              : []),
            ...historyClasses,
          ])
        ),
        preferredClassId: typeof source.progression?.preferredClassId === "string" ? source.progression.preferredClassId : "",
        lastPlayedClassId:
          typeof source.progression?.lastPlayedClassId === "string"
            ? source.progression.lastPlayedClassId
            : historyClasses[0] || "",
      },
    };
  }

  function ensureProfileState(profile) {
    const source = isObject(profile) ? profile : {};
    const activeRunSnapshot = source.activeRunSnapshot ? runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(source.activeRunSnapshot) || null : null;
    const runHistory = Array.isArray(source.runHistory) ? source.runHistory.map(ensureHistoryEntry).filter(Boolean) : [];
    return {
      activeRunSnapshot,
      stash: {
        entries: Array.isArray(source.stash?.entries)
          ? source.stash.entries.filter((entry) => isObject(entry)).map((entry) => deepClone(entry))
          : [],
      },
      runHistory,
      meta: ensureMeta(source.meta, runHistory),
    };
  }

  function normalizeProfileEnvelope(profile) {
    if (!profile) {
      return {
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: new Date(0).toISOString(),
        profile: ensureProfileState(null),
      };
    }

    if (isObject(profile) && isObject(profile.profile)) {
      return {
        schemaVersion: Number.parseInt(String(profile.schemaVersion || CURRENT_PROFILE_SCHEMA_VERSION), 10) || CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: typeof profile.savedAt === "string" ? profile.savedAt : new Date(0).toISOString(),
        profile: ensureProfileState(profile.profile),
      };
    }

    const migratedRunSnapshot = runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(profile) || null;
    if (migratedRunSnapshot) {
      return {
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: new Date(0).toISOString(),
        profile: ensureProfileState({
          activeRunSnapshot: migratedRunSnapshot,
          stash: {
            entries: [],
          },
          runHistory: [],
        }),
      };
    }

    return null;
  }

  function migrateProfile(profile) {
    let envelope = normalizeProfileEnvelope(profile);
    if (!envelope) {
      return null;
    }

    while (envelope.schemaVersion < CURRENT_PROFILE_SCHEMA_VERSION) {
      if (envelope.schemaVersion === 1) {
        envelope = {
          schemaVersion: 2,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile),
        };
        continue;
      }
      return null;
    }

    if (envelope.schemaVersion !== CURRENT_PROFILE_SCHEMA_VERSION) {
      return null;
    }
    envelope.profile = ensureProfileState(envelope.profile);
    return envelope;
  }

  runtimeWindow.ROUGE_PROFILE_MIGRATIONS = {
    CURRENT_PROFILE_SCHEMA_VERSION,
    migrateProfile,
  };
})();
