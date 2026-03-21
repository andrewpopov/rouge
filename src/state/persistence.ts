(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { toNumber } = runtimeWindow.ROUGE_UTILS;
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
    saveProfileToStorage,
    loadProfileFromStorage,
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE;

  const {
    getProfileSummary,
    getAccountProgressSummary,
    buildRunHistoryEntry,
  } = runtimeWindow.__ROUGE_PERSISTENCE_SUMMARIES;

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
    saveToStorage,
    loadFromStorage,
    hasSavedSnapshot,
    clearStorage,
  };
})();
