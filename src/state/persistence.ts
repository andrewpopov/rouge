(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const SCHEMA_VERSION = runtimeWindow.ROUGE_SAVE_MIGRATIONS?.CURRENT_SCHEMA_VERSION || 4;
  const PROFILE_SCHEMA_VERSION = runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.CURRENT_PROFILE_SCHEMA_VERSION || 1;
  const STORAGE_KEY = "rouge.run.snapshot";
  const PROFILE_STORAGE_KEY = "rouge.profile";

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultStorage() {
    return runtimeWindow.localStorage || null;
  }

  function createSnapshot({ phase, selectedClassId, selectedMercenaryId, run }) {
    return {
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      phase,
      selectedClassId,
      selectedMercenaryId,
      run: deepClone(run),
    };
  }

  function createEmptyProfile() {
    return {
      activeRunSnapshot: null,
      stash: {
        entries: [],
      },
      runHistory: [],
      meta: {
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
      },
    };
  }

  function ensureMeta(profile) {
    profile.meta = profile.meta || createEmptyProfile().meta;
    profile.meta.settings = {
      ...createEmptyProfile().meta.settings,
      ...(profile.meta.settings || {}),
    };
    profile.meta.progression = {
      ...createEmptyProfile().meta.progression,
      ...(profile.meta.progression || {}),
      classesPlayed: Array.isArray(profile.meta.progression?.classesPlayed)
        ? Array.from(new Set(profile.meta.progression.classesPlayed.filter((entry) => typeof entry === "string" && entry)))
        : [],
    };
  }

  function createProfileEnvelope(profile) {
    if (profile?.profile) {
      return {
        schemaVersion: PROFILE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        profile: deepClone(profile.profile),
      };
    }

    return {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      profile: deepClone(profile || createEmptyProfile()),
    };
  }

  function serializeSnapshot(snapshot) {
    return JSON.stringify(snapshot);
  }

  function restoreSnapshot(snapshotOrSerialized) {
    try {
      const parsed =
        typeof snapshotOrSerialized === "string" ? JSON.parse(snapshotOrSerialized) : deepClone(snapshotOrSerialized || null);
      return runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(parsed) || null;
    } catch {
      return null;
    }
  }

  function serializeProfile(profileOrEnvelope) {
    return JSON.stringify(createProfileEnvelope(profileOrEnvelope));
  }

  function restoreProfile(profileOrSerialized) {
    try {
      const parsed =
        typeof profileOrSerialized === "string" ? JSON.parse(profileOrSerialized) : deepClone(profileOrSerialized || null);
      return runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.migrateProfile(parsed) || null;
    } catch {
      return null;
    }
  }

  function saveProfileToStorage(profile, storage = getDefaultStorage()) {
    if (!storage?.setItem) {
      return { ok: false, message: "No storage provider is available." };
    }

    const serialized = typeof profile === "string" ? profile : serializeProfile(profile);

    try {
      storage.setItem(PROFILE_STORAGE_KEY, serialized);
      if (storage.removeItem) {
        storage.removeItem(STORAGE_KEY);
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save profile state.",
      };
    }
  }

  function loadProfileFromStorage(storage = getDefaultStorage()) {
    if (!storage?.getItem) {
      return null;
    }

    try {
      const serializedProfile = storage.getItem(PROFILE_STORAGE_KEY);
      if (serializedProfile) {
        return restoreProfile(serializedProfile)?.profile || null;
      }

      const serializedLegacyRun = storage.getItem(STORAGE_KEY);
      if (!serializedLegacyRun) {
        return null;
      }

      const migratedEnvelope = restoreProfile(serializedLegacyRun);
      if (!migratedEnvelope) {
        return null;
      }

      saveProfileToStorage(migratedEnvelope, storage);
      return migratedEnvelope.profile;
    } catch {
      return null;
    }
  }

  function getProfileSummary(profile) {
    const source = profile || createEmptyProfile();
    ensureMeta(source);
    const history = Array.isArray(source.runHistory) ? source.runHistory : [];
    return {
      hasActiveRun: Boolean(source.activeRunSnapshot),
      stashEntries: Array.isArray(source.stash?.entries) ? source.stash.entries.length : 0,
      runHistoryCount: history.length,
      completedRuns: history.filter((entry) => entry?.outcome === "completed").length,
      failedRuns: history.filter((entry) => entry?.outcome === "failed").length,
      highestLevel: Number.parseInt(String(source.meta.progression?.highestLevel || 1), 10) || 1,
      totalBossesDefeated: Number.parseInt(String(source.meta.progression?.totalBossesDefeated || 0), 10) || 0,
      classesPlayedCount: Array.isArray(source.meta.progression?.classesPlayed) ? source.meta.progression.classesPlayed.length : 0,
      preferredClassId: typeof source.meta.progression?.preferredClassId === "string" ? source.meta.progression.preferredClassId : "",
    };
  }

  function recordRunHistory(profile, run, outcome) {
    ensureMeta(profile);
    profile.runHistory = Array.isArray(profile.runHistory) ? profile.runHistory : [];
    profile.runHistory.unshift({
      runId: run.id,
      classId: run.classId,
      className: run.className,
      level: run.level,
      actsCleared: run.summary?.actsCleared || 0,
      bossesDefeated: run.summary?.bossesDefeated || 0,
      completedAt: new Date().toISOString(),
      outcome,
    });
    profile.runHistory = profile.runHistory.slice(0, 20);
    profile.meta.progression.highestLevel = Math.max(profile.meta.progression.highestLevel || 1, run.level || 1);
    profile.meta.progression.totalBossesDefeated =
      (Number.parseInt(String(profile.meta.progression.totalBossesDefeated || 0), 10) || 0) + (run.summary?.bossesDefeated || 0);
    profile.meta.progression.lastPlayedClassId = run.classId || profile.meta.progression.lastPlayedClassId || "";
    profile.meta.progression.preferredClassId = run.classId || profile.meta.progression.preferredClassId || "";
    profile.meta.progression.classesPlayed = Array.from(
      new Set([...(profile.meta.progression.classesPlayed || []), run.classId].filter(Boolean))
    );
  }

  function saveToStorage(snapshot, storage = getDefaultStorage()) {
    const restoredSnapshot = typeof snapshot === "string" ? restoreSnapshot(snapshot) : restoreSnapshot(snapshot);
    if (!restoredSnapshot) {
      return { ok: false, message: "Run snapshot could not be restored." };
    }

    const profile = loadProfileFromStorage(storage) || createEmptyProfile();
    profile.activeRunSnapshot = restoredSnapshot;
    return saveProfileToStorage(profile, storage);
  }

  function loadFromStorage(storage = getDefaultStorage()) {
    return loadProfileFromStorage(storage)?.activeRunSnapshot || null;
  }

  function hasSavedSnapshot(storage = getDefaultStorage()) {
    return Boolean(loadFromStorage(storage));
  }

  function clearStorage(storage = getDefaultStorage()) {
    const profile = loadProfileFromStorage(storage);
    if (profile) {
      profile.activeRunSnapshot = null;
      saveProfileToStorage(profile, storage);
      return;
    }

    if (!storage?.removeItem) {
      return;
    }
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // Ignore storage clear failures. The live run should remain playable.
    }
  }

  runtimeWindow.ROUGE_PERSISTENCE = {
    SCHEMA_VERSION,
    STORAGE_KEY,
    PROFILE_STORAGE_KEY,
    createSnapshot,
    createEmptyProfile,
    serializeSnapshot,
    restoreSnapshot,
    serializeProfile,
    restoreProfile,
    saveProfileToStorage,
    loadProfileFromStorage,
    getProfileSummary,
    recordRunHistory,
    saveToStorage,
    loadFromStorage,
    hasSavedSnapshot,
    clearStorage,
  };
})();
