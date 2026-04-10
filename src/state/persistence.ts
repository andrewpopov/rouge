(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { deepClone, toNumber } = runtimeWindow.ROUGE_UTILS;
  const {
    SCHEMA_VERSION,
    STORAGE_KEY,
    PROFILE_STORAGE_KEY,
    CORE_TOWN_FEATURE_IDS,
    ACCOUNT_PROGRESSION_TREES,
    uniqueStrings,
    sanitizePlannedRunewordId,

    createSnapshot,
    createEmptyProfile,
    getDefaultFocusedTreeId,
    getRunHistoryCapacity,
    applyDerivedAccountUnlocks,
    ensureMeta,
    getDefaultStorage,
    serializeSnapshot,
    restoreSnapshot,
    serializeProfile,
    restoreProfile,
    saveProfileToStorage: saveProfileToBrowserStorage,
    loadProfileFromStorage: loadProfileFromBrowserStorage,
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE;

  const {
    getProfileSummary,
    getAccountProgressSummary,
    buildRunHistoryEntry,
  } = runtimeWindow.__ROUGE_PERSISTENCE_SUMMARIES;

  const backendProfileStore = {
    initialized: false,
    currentUserId: "",
    cachedProfile: null as ProfileState | null,
    syncPromise: null as Promise<void> | null,
    savePromise: null as Promise<void> | null,
    queuedSerializedProfile: null as string | null,
  };

  function isDefaultStorageProvider(storage: StorageLike | null | undefined) {
    return !storage || storage === getDefaultStorage();
  }

  function cloneProfile(profile: ProfileState | null, content: GameContent | null = null) {
    if (!profile) {
      return null;
    }
    const restored = restoreProfile(serializeProfile(profile, content), content)?.profile || null;
    return restored ? deepClone(restored) : deepClone(profile);
  }

  function getAuthState(): RogueAuthState {
    return runtimeWindow.ROGUE_AUTH?.getAuthState?.() || { user: null, loading: false, ready: true };
  }

  function canUseBackendProfileStore(storage: StorageLike | null | undefined) {
    const auth = getAuthState();
    return isDefaultStorageProvider(storage) && Boolean(auth.ready && auth.user && runtimeWindow.fetch);
  }

  async function readProfileFromBackend(content: GameContent | null = null) {
    const response = await runtimeWindow.fetch("/api/profile", {
      credentials: "same-origin",
    });
    const data = await response.json();
    const payload = typeof data === "object" && data ? (data as { ok?: boolean; profile?: unknown }) : {};
    if (payload.ok === false) {
      return null;
    }
    return payload.profile ? restoreProfile(payload.profile, content)?.profile || null : null;
  }

  async function writeProfileToBackend(serializedProfile: string) {
    const response = await runtimeWindow.fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ profile: serializedProfile }),
    });
    const data = await response.json();
    if (typeof data === "object" && data && (data as { ok?: boolean }).ok === false) {
      throw new Error("Backend profile save failed.");
    }
  }

  function postRunComplete(entry: Record<string, unknown>) {
    if (!canUseBackendProfileStore(null) || !runtimeWindow.fetch) {
      return;
    }
    runtimeWindow.fetch("/api/run-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ entry, encounters: [], combatLogs: [] }),
    }).catch(() => {
      // Fire-and-forget: run telemetry is best-effort
    });
  }

  function queueBackendProfileSave(serializedProfile: string) {
    backendProfileStore.queuedSerializedProfile = serializedProfile;
    if (backendProfileStore.savePromise) {
      return;
    }
    backendProfileStore.savePromise = (async () => {
      while (backendProfileStore.queuedSerializedProfile) {
        const nextSerializedProfile = backendProfileStore.queuedSerializedProfile;
        backendProfileStore.queuedSerializedProfile = null;
        try {
          await writeProfileToBackend(nextSerializedProfile);
        } catch {
          backendProfileStore.queuedSerializedProfile = backendProfileStore.queuedSerializedProfile || nextSerializedProfile;
          break;
        }
      }
    })().finally(() => {
      backendProfileStore.savePromise = null;
      if (backendProfileStore.queuedSerializedProfile) {
        queueBackendProfileSave(backendProfileStore.queuedSerializedProfile);
      }
    });
  }

  async function initializeProfileStore(content: GameContent | null = null) {
    if (backendProfileStore.syncPromise) {
      return backendProfileStore.syncPromise;
    }

    backendProfileStore.syncPromise = (async () => {
      await runtimeWindow.ROGUE_AUTH?.waitUntilReady?.();
      const auth = getAuthState();
      const previousCachedProfile = cloneProfile(backendProfileStore.cachedProfile, content);

      if (!auth.user || !runtimeWindow.fetch) {
        if (backendProfileStore.currentUserId && previousCachedProfile) {
          saveProfileToBrowserStorage(previousCachedProfile, getDefaultStorage(), content);
        }
        backendProfileStore.initialized = true;
        backendProfileStore.currentUserId = "";
        backendProfileStore.cachedProfile = loadProfileFromBrowserStorage(undefined, content) || previousCachedProfile || null;
        return;
      }

      if (backendProfileStore.initialized && backendProfileStore.currentUserId === auth.user.googleId && backendProfileStore.cachedProfile) {
        return;
      }

      const browserProfile = loadProfileFromBrowserStorage(undefined, content);
      const backendProfile = await readProfileFromBackend(content).catch((): ProfileState | null => null);

      if (backendProfile) {
        backendProfileStore.cachedProfile = cloneProfile(backendProfile, content);
      } else if (browserProfile) {
        backendProfileStore.cachedProfile = cloneProfile(browserProfile, content);
        queueBackendProfileSave(serializeProfile(browserProfile, content));
      } else {
        backendProfileStore.cachedProfile = createEmptyProfile();
      }

      backendProfileStore.initialized = true;
      backendProfileStore.currentUserId = auth.user.googleId;
    })().finally(() => {
      backendProfileStore.syncPromise = null;
    });

    return backendProfileStore.syncPromise;
  }

  function saveProfileToStorage(
    profile: ProfileState | ProfileEnvelope | string,
    storage: StorageLike | null = getDefaultStorage(),
    content: GameContent | null = null
  ) {
    if (!canUseBackendProfileStore(storage)) {
      return saveProfileToBrowserStorage(profile, storage, content);
    }

    const serialized = typeof profile === "string" ? profile : serializeProfile(profile, content);
    const restored = restoreProfile(serialized, content)?.profile || null;
    backendProfileStore.cachedProfile = cloneProfile(restored, content);
    backendProfileStore.initialized = true;
    backendProfileStore.currentUserId = getAuthState().user?.googleId || "";
    queueBackendProfileSave(serialized);
    return { ok: true };
  }

  function loadProfileFromStorage(storage: StorageLike | null = getDefaultStorage(), content: GameContent | null = null) {
    if (!canUseBackendProfileStore(storage)) {
      return loadProfileFromBrowserStorage(storage, content);
    }
    return cloneProfile(backendProfileStore.cachedProfile, content);
  }

  function unlockProfileEntries(profile: ProfileState, category: ProfileUnlockCategory, ids: string[]) {
    ensureMeta(profile);
    const existing = Array.isArray(profile.meta.unlocks?.[category]) ? profile.meta.unlocks[category] : [];
    profile.meta.unlocks[category] = uniqueStrings([...existing, ...(Array.isArray(ids) ? ids : [])]);
    applyDerivedAccountUnlocks(profile);
  }

  function updateProfileSettings(profile: ProfileState, patch: ProfileSettingsPatch) {
    ensureMeta(profile);
    const nextSettings = patch && typeof patch === "object" ? patch : {};
    (["showHints", "reduceMotion", "compactMode"] as const).forEach((settingKey) => {
      if (typeof nextSettings[settingKey] === "boolean") {
        profile.meta.settings[settingKey] = nextSettings[settingKey];
      }
    });
    if (nextSettings.debugMode && typeof nextSettings.debugMode === "object") {
      if (!profile.meta.settings.debugMode || typeof profile.meta.settings.debugMode !== "object") {
        profile.meta.settings.debugMode = { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false };
      }
      for (const key of ["enabled", "skipBattles", "invulnerable", "oneHitKill", "infiniteGold"] as (keyof DebugModeConfig)[]) {
        if (typeof nextSettings.debugMode[key] === "boolean") {
          profile.meta.settings.debugMode[key] = nextSettings.debugMode[key] as boolean;
        }
      }
    }
  }

  function setPreferredClass(profile: ProfileState, classId: string) {
    ensureMeta(profile);
    if (typeof classId !== "string") {
      return;
    }
    profile.meta.progression.preferredClassId = classId;
  }

  function setPlannedRuneword(profile: ProfileState, slot: string, runewordId: string, content: GameContent | null = null) {
    ensureMeta(profile, content);
    if (slot !== "weapon" && slot !== "armor") {
      return;
    }
    const key = slot === "weapon" ? "weaponRunewordId" : "armorRunewordId";
    profile.meta.planning[key] = sanitizePlannedRunewordId(runewordId, slot, content);
  }

  function setAccountProgressionFocus(profile: ProfileState, treeId: string) {
    ensureMeta(profile);
    if (!ACCOUNT_PROGRESSION_TREES.some((tree: { id: string }) => tree.id === treeId)) {
      profile.meta.accountProgression.focusedTreeId = getDefaultFocusedTreeId(profile);
      return;
    }
    profile.meta.accountProgression.focusedTreeId = treeId;
  }

  function markTutorialSeen(profile: ProfileState, tutorialId: string) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    profile.meta.tutorials.seenIds = uniqueStrings([...(profile.meta.tutorials.seenIds || []), tutorialId]);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry: string) => entry !== tutorialId));
  }

  function markTutorialCompleted(profile: ProfileState, tutorialId: string) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    profile.meta.tutorials.completedIds = uniqueStrings([...(profile.meta.tutorials.completedIds || []), tutorialId]);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry: string) => entry !== tutorialId));
  }

  function dismissTutorial(profile: ProfileState, tutorialId: string) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    if ((profile.meta.tutorials?.completedIds || []).includes(tutorialId)) {
      profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry: string) => entry !== tutorialId));
      return;
    }
    profile.meta.tutorials.dismissedIds = uniqueStrings([...(profile.meta.tutorials.dismissedIds || []), tutorialId]);
  }

  function restoreTutorial(profile: ProfileState, tutorialId: string) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry: string) => entry !== tutorialId));
  }

  function getWorldOutcomeCount(run: RunState) {
    return (
      Object.keys(run?.world?.questOutcomes || {}).length +
      Object.keys(run?.world?.shrineOutcomes || {}).length +
      Object.keys(run?.world?.eventOutcomes || {}).length +
      Object.keys(run?.world?.opportunityOutcomes || {}).length
    );
  }

  function syncProfileMetaFromRun(profile: ProfileState, run: RunState) {
    ensureMeta(profile);
    if (!run) {
      return;
    }

    const previousLastPlayedClassId = profile.meta.progression.lastPlayedClassId || "";
    const previousPreferredClassId = profile.meta.progression.preferredClassId || "";
    profile.meta.progression.highestLevel = Math.max(profile.meta.progression.highestLevel || 1, run?.level || 1);
    profile.meta.progression.highestActCleared = Math.max(profile.meta.progression.highestActCleared || 0, run?.summary?.actsCleared || 0);
    profile.meta.progression.lastPlayedClassId = run?.classId || profile.meta.progression.lastPlayedClassId || "";
    if (!previousPreferredClassId || previousPreferredClassId === previousLastPlayedClassId) {
      profile.meta.progression.preferredClassId = run?.classId || previousPreferredClassId || "";
    }
    profile.meta.progression.classesPlayed = uniqueStrings([...(profile.meta.progression.classesPlayed || []), run?.classId]);
    unlockProfileEntries(profile, "classIds", [run?.classId || ""]);
    unlockProfileEntries(profile, "bossIds", Array.isArray(run?.progression?.bossTrophies) ? run.progression.bossTrophies : []);
    unlockProfileEntries(
      profile,
      "runewordIds",
      Array.isArray(run?.progression?.activatedRunewords) ? run.progression.activatedRunewords : []
    );
    unlockProfileEntries(profile, "townFeatureIds", CORE_TOWN_FEATURE_IDS);

    markTutorialSeen(profile, "front_door_profile_hall");
    markTutorialSeen(profile, "first_run_overview");
    if (
      (run.progression?.skillPointsAvailable || 0) > 0 ||
      (run.progression?.classPointsAvailable || 0) > 0 ||
      (run.progression?.attributePointsAvailable || 0) > 0
    ) {
      markTutorialSeen(profile, "safe_zone_progression_board");
    }
    if (
      (run.progression?.trainingPointsSpent || 0) > 0 ||
      (run.progression?.classPointsSpent || 0) > 0 ||
      (run.progression?.attributePointsSpent || 0) > 0
    ) {
      markTutorialCompleted(profile, "safe_zone_progression_board");
    }
    if (Array.isArray(profile.stash?.entries) && profile.stash.entries.length > 0) {
      markTutorialCompleted(profile, "profile_stash");
    }
    if ((run.town?.vendor?.refreshCount || 0) > 0 || (run.inventory?.carried?.length || 0) > 0) {
      markTutorialCompleted(profile, "safe_zone_vendor_economy");
    }
    if (Array.isArray(run.progression?.activatedRunewords) && run.progression.activatedRunewords.length > 0) {
      markTutorialCompleted(profile, "runeword_forging");
    }
    if (getWorldOutcomeCount(run) > 0) {
      markTutorialCompleted(profile, "world_node_rewards");
    }
    applyDerivedAccountUnlocks(profile);
    runtimeWindow.ROUGE_CHARM_SYSTEM?.checkAndUnlockCharms(profile, run);
    const newClassUnlocks = runtimeWindow.ROUGE_CLASS_UNLOCK_RULES?.checkAndUnlockClasses(profile) || [];
    if (newClassUnlocks.length > 0) {
      unlockProfileEntries(profile, "classIds", newClassUnlocks);
    }
  }

  function recordRunHistory(profile: ProfileState, run: RunState, outcome: string, content: GameContent | null = null) {
    ensureMeta(profile);
    profile.runHistory = Array.isArray(profile.runHistory) ? profile.runHistory : [];
    const previousFeatureIds = uniqueStrings(profile.meta.unlocks?.townFeatureIds || []);
    const previousCharmIds = uniqueStrings(profile.meta.charms?.unlockedCharmIds || []);
    syncProfileMetaFromRun(profile, run);
    profile.meta.progression.totalBossesDefeated =
      toNumber(profile.meta.progression.totalBossesDefeated, 0) + (run?.summary?.bossesDefeated || 0);
    profile.meta.progression.totalGoldCollected =
      toNumber(profile.meta.progression.totalGoldCollected, 0) + (run?.summary?.goldGained || 0);
    profile.meta.progression.totalRunewordsForged =
      toNumber(profile.meta.progression.totalRunewordsForged, 0) + (run?.summary?.runewordsForged || 0);
    markTutorialCompleted(profile, "first_run_overview");
    const entry = buildRunHistoryEntry(profile, run, outcome, content);
    profile.runHistory.unshift(entry);
    applyDerivedAccountUnlocks(profile);
    profile.runHistory = profile.runHistory.slice(0, getRunHistoryCapacity(profile));
    entry.newFeatureIds = uniqueStrings((profile.meta.unlocks?.townFeatureIds || []).filter((featureId: string) => !previousFeatureIds.includes(featureId)));
    entry.newCharmIds = uniqueStrings((profile.meta.charms?.unlockedCharmIds || []).filter((charmId: string) => !previousCharmIds.includes(charmId)));

    // Record to server DB (fire-and-forget)
    postRunComplete(entry as unknown as Record<string, unknown>);
  }

  function saveToStorage(snapshot: RunSnapshotEnvelope | string, storage: StorageLike | null = getDefaultStorage()) {
    const restoredSnapshot = restoreSnapshot(snapshot);
    if (!restoredSnapshot) {
      return { ok: false, message: "Run snapshot could not be restored." };
    }

    const profile = loadProfileFromStorage(storage) || createEmptyProfile();
    profile.activeRunSnapshot = restoredSnapshot;
    return saveProfileToStorage(profile, storage);
  }

  function loadFromStorage(storage: StorageLike | null = getDefaultStorage()) {
    return loadProfileFromStorage(storage)?.activeRunSnapshot || null;
  }

  function hasSavedSnapshot(storage: StorageLike | null = getDefaultStorage()) {
    return Boolean(loadFromStorage(storage));
  }

  function clearStorage(storage: StorageLike | null = getDefaultStorage()) {
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
    ensureProfileMeta: ensureMeta,
    unlockProfileEntries,
    updateProfileSettings,
    setPreferredClass,
    setPlannedRuneword,
    setAccountProgressionFocus,
    markTutorialSeen,
    markTutorialCompleted,
    dismissTutorial,
    restoreTutorial,
    syncProfileMetaFromRun,
    getProfileSummary,
    getAccountProgressSummary,
    getRunHistoryCapacity,
    recordRunHistory,
    initializeProfileStore,
    saveToStorage,
    loadFromStorage,
    hasSavedSnapshot,
    clearStorage,
  };
})();
