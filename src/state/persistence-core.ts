(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { RUN_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    CORE_TOWN_FEATURE_IDS,
    ACCOUNT_PROGRESSION_TREES,
    ACCOUNT_CONVERGENCES,
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE_DATA;
  const { sanitizePlannedRunewordId } = runtimeWindow.__ROUGE_PROFILE_MIGRATIONS_DATA;
  const { deepClone, toNumber, uniqueStrings } = runtimeWindow.ROUGE_UTILS;

  const SCHEMA_VERSION = runtimeWindow.ROUGE_SAVE_MIGRATIONS?.CURRENT_SCHEMA_VERSION || 5;
  const PROFILE_SCHEMA_VERSION = runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.CURRENT_PROFILE_SCHEMA_VERSION || 8;
  const STORAGE_KEY = "rogue.run.snapshot";
  const PROFILE_STORAGE_KEY = "rogue.profile";
  const LEGACY_STORAGE_KEY = "rouge.run.snapshot";
  const LEGACY_PROFILE_STORAGE_KEY = "rouge.profile";

  function getDefaultStorage() {
    return runtimeWindow.localStorage || null;
  }

  function getMilestoneTierLabel(milestone: { isCapstone?: boolean; tier?: number } | null) {
    if (milestone?.isCapstone) {
      return "Capstone";
    }
    return `Tier ${Math.max(1, toNumber(milestone?.tier, 1))}`;
  }

  function sanitizeRunHistoryPlanningEntry(entry: RunHistoryEntry, content: GameContent | null = null) {
    if (!entry || !content?.runewordCatalog) {
      return;
    }

    const plannedWeaponRunewordId = sanitizePlannedRunewordId(entry.plannedWeaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(entry.plannedArmorRunewordId, "armor", content);
    const allowedRunewordIds = new Set([plannedWeaponRunewordId, plannedArmorRunewordId].filter(Boolean));
    entry.plannedWeaponRunewordId = plannedWeaponRunewordId;
    entry.plannedArmorRunewordId = plannedArmorRunewordId;
    entry.completedPlannedRunewordIds = uniqueStrings((entry.completedPlannedRunewordIds || []).filter((runewordId: string) => allowedRunewordIds.has(runewordId)));
  }

  function sanitizePlanningState(profile: ProfileState, content: GameContent | null = null) {
    if (!profile?.meta?.planning || !content?.runewordCatalog) {
      return;
    }

    profile.meta.planning.weaponRunewordId = sanitizePlannedRunewordId(profile.meta.planning.weaponRunewordId, "weapon", content);
    profile.meta.planning.armorRunewordId = sanitizePlannedRunewordId(profile.meta.planning.armorRunewordId, "armor", content);
    (Array.isArray(profile.runHistory) ? profile.runHistory : []).forEach((entry: RunHistoryEntry) => sanitizeRunHistoryPlanningEntry(entry, content));
  }

  function getAccountFeatureTitle(featureId: string) {
    for (let treeIndex = 0; treeIndex < ACCOUNT_PROGRESSION_TREES.length; treeIndex += 1) {
      const milestone = ACCOUNT_PROGRESSION_TREES[treeIndex].nodes.find((entry: { id: string; rewardFeatureId: string }) => entry.id === featureId || entry.rewardFeatureId === featureId);
      if (milestone?.title) {
        return milestone.title;
      }
    }
    const convergence = ACCOUNT_CONVERGENCES.find((entry: { id: string; rewardFeatureId: string }) => entry.id === featureId || entry.rewardFeatureId === featureId);
    return convergence?.title || featureId;
  }

  function createDefaultMeta() {
    return {
      settings: {
        showHints: true,
        reduceMotion: false,
        compactMode: false,
        debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false },
      },
      progression: {
        highestLevel: 1,
        highestActCleared: 0,
        totalBossesDefeated: 0,
        totalGoldCollected: 0,
        totalRunewordsForged: 0,
        classesPlayed: [] as string[],
        preferredClassId: "",
        lastPlayedClassId: "",
      },
      unlocks: {
        classIds: [] as string[],
        bossIds: [] as string[],
        runewordIds: [] as string[],
        townFeatureIds: [...CORE_TOWN_FEATURE_IDS],
      },
      tutorials: {
        seenIds: [] as string[],
        completedIds: [] as string[],
        dismissedIds: [] as string[],
      },
      planning: {
        weaponRunewordId: "",
        armorRunewordId: "",
      },
      accountProgression: {
        focusedTreeId: ACCOUNT_PROGRESSION_TREES[0].id,
      },
      charms: {
        unlockedCharmIds: [] as string[],
        equippedCharmIds: [] as string[],
      },
    };
  }

  function createSnapshot({ phase, selectedClassId, selectedMercenaryId, run }: { phase: string; selectedClassId: string; selectedMercenaryId: string; run: RunState }) {
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
      activeRunSnapshot: null as RunSnapshotEnvelope | null,
      stash: {
        entries: [] as InventoryEntry[],
      },
      runHistory: [] as RunHistoryEntry[],
      meta: createDefaultMeta(),
    };
  }

  function buildProfileMetrics(profile: ProfileState | null) {
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    return {
      runHistoryCount: history.length,
      completedRuns: history.filter((entry: RunHistoryEntry) => entry?.outcome === RUN_OUTCOME.COMPLETED).length,
      failedRuns: history.filter((entry: RunHistoryEntry) => entry?.outcome === RUN_OUTCOME.FAILED).length,
      highestLevel: toNumber(profile?.meta?.progression?.highestLevel, 1),
      highestActCleared: toNumber(profile?.meta?.progression?.highestActCleared, 0),
      totalBossesDefeated: toNumber(profile?.meta?.progression?.totalBossesDefeated, 0),
      totalGoldCollected: toNumber(profile?.meta?.progression?.totalGoldCollected, 0),
      totalRunewordsForged: toNumber(profile?.meta?.progression?.totalRunewordsForged, 0),
      classesPlayedCount: Array.isArray(profile?.meta?.progression?.classesPlayed) ? profile.meta.progression.classesPlayed.length : 0,
      unlockedBossCount: Array.isArray(profile?.meta?.unlocks?.bossIds) ? profile.meta.unlocks.bossIds.length : 0,
      unlockedRunewordCount: Array.isArray(profile?.meta?.unlocks?.runewordIds) ? profile.meta.unlocks.runewordIds.length : 0,
      stashEntryCount: stashEntries.length,
      stashEquipmentCount: stashEntries.filter((entry: InventoryEntry) => entry?.kind === "equipment").length,
      stashRuneCount: stashEntries.filter((entry: InventoryEntry) => entry?.kind === "rune").length,
    };
  }

  function listAccountMilestoneSummaries(profile: ProfileState | null) {
    const metrics = buildProfileMetrics(profile);
    return ACCOUNT_PROGRESSION_TREES.flatMap((tree: { id: string; title: string; description: string; nodes: { id: string; title: string; description: string; rewardFeatureId: string; tier: number; isCapstone?: boolean; prerequisiteIds: string[]; target: number; getProgress: (metrics: Record<string, number>) => number }[] }) => {
      const unlockedMilestoneIds = new Set<string>();
      return tree.nodes.map((milestone: { id: string; title: string; description: string; rewardFeatureId: string; tier: number; isCapstone?: boolean; prerequisiteIds: string[]; target: number; getProgress: (metrics: Record<string, number>) => number }) => {
        const progress = Math.max(0, toNumber(milestone.getProgress(metrics), 0));
        const prerequisiteIds = uniqueStrings(milestone.prerequisiteIds || []);
        const blockedByIds = prerequisiteIds.filter((milestoneId: string) => !unlockedMilestoneIds.has(milestoneId));
        const blockedByTitles = blockedByIds.map((milestoneId: string) => {
          return tree.nodes.find((treeMilestone: { id: string; title?: string }) => treeMilestone.id === milestoneId)?.title || milestoneId;
        });
        const unlocked = blockedByIds.length === 0 && progress >= milestone.target;
        if (unlocked) {
          unlockedMilestoneIds.add(milestone.id);
        }
        let status: ProfileAccountMilestoneSummary["status"] = "locked";
        if (unlocked) {
          status = "unlocked";
        } else if (blockedByIds.length === 0) {
          status = "available";
        }

        return {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          rewardFeatureId: milestone.rewardFeatureId,
          treeId: tree.id,
          treeTitle: tree.title,
          tier: Math.max(1, toNumber(milestone.tier, 1)),
          tierLabel: getMilestoneTierLabel(milestone),
          isCapstone: Boolean(milestone.isCapstone),
          isEligible: blockedByIds.length === 0,
          status,
          blockedByIds,
          blockedByTitles,
          unlocked,
          progress: Math.min(progress, milestone.target),
          target: milestone.target,
        };
      });
    });
  }

  function getDefaultFocusedTreeId(profile: ProfileState | null) {
    const milestones = listAccountMilestoneSummaries(profile);
    const firstIncompleteTree = ACCOUNT_PROGRESSION_TREES.find((tree: { id: string }) => {
      return milestones.some((milestone: ProfileAccountMilestoneSummary) => milestone.treeId === tree.id && !milestone.unlocked);
    });
    return firstIncompleteTree?.id || ACCOUNT_PROGRESSION_TREES[0].id;
  }

  function getFocusedTreeId(profile: ProfileState | null) {
    const focusedTreeId = typeof profile?.meta?.accountProgression?.focusedTreeId === "string" ? profile.meta.accountProgression.focusedTreeId : "";
    return ACCOUNT_PROGRESSION_TREES.some((tree: { id: string }) => tree.id === focusedTreeId) ? focusedTreeId : getDefaultFocusedTreeId(profile);
  }

  function getAccountTreeSummaries(profile: ProfileState | null) {
    const milestones = listAccountMilestoneSummaries(profile);
    const focusedTreeId = getFocusedTreeId(profile);
    return ACCOUNT_PROGRESSION_TREES.map((tree: { id: string; title: string; description: string }) => {
      const treeMilestones = milestones.filter((milestone: ProfileAccountMilestoneSummary) => milestone.treeId === tree.id);
      const nextMilestone = treeMilestones.find((milestone: ProfileAccountMilestoneSummary) => milestone.status === "available") || treeMilestones.find((milestone: ProfileAccountMilestoneSummary) => !milestone.unlocked) || null;
      const capstone = [...treeMilestones].reverse().find((milestone) => milestone.isCapstone) || null;
      const capstoneStatus: ProfileAccountTreeSummary["capstoneStatus"] = capstone?.status || "locked";
      return {
        id: tree.id,
        title: tree.title,
        description: tree.description,
        isFocused: tree.id === focusedTreeId,
        currentRank: treeMilestones.filter((milestone: ProfileAccountMilestoneSummary) => milestone.unlocked).length,
        maxRank: treeMilestones.length,
        eligibleMilestoneCount: treeMilestones.filter((milestone: ProfileAccountMilestoneSummary) => milestone.isEligible && !milestone.unlocked).length,
        blockedMilestoneCount: treeMilestones.filter((milestone: ProfileAccountMilestoneSummary) => !milestone.isEligible && !milestone.unlocked).length,
        nextMilestoneId: nextMilestone?.id || "",
        nextMilestoneTitle: nextMilestone?.title || "",
        capstoneId: capstone?.id || "",
        capstoneTitle: capstone?.title || "",
        capstoneUnlocked: Boolean(capstone?.unlocked),
        capstoneStatus,
        unlockedFeatureIds: treeMilestones.filter((milestone: ProfileAccountMilestoneSummary) => milestone.unlocked).map((milestone: ProfileAccountMilestoneSummary) => milestone.rewardFeatureId),
        milestones: treeMilestones,
      };
    });
  }

  function listUnlockedMilestoneFeatureIds(profile: ProfileState | null) {
    return uniqueStrings(
      listAccountMilestoneSummaries(profile)
        .filter((milestone: ProfileAccountMilestoneSummary) => milestone.unlocked)
        .map((milestone: ProfileAccountMilestoneSummary) => milestone.rewardFeatureId)
    );
  }

  function getAccountConvergenceSummaries(profile: ProfileState | null) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(profile);
    const availableFeatureIds = new Set(uniqueStrings([...(profile?.meta?.unlocks?.townFeatureIds || []), ...unlockedMilestoneFeatureIds]));
    return ACCOUNT_CONVERGENCES.map((convergence: { id: string; title: string; description: string; rewardFeatureId: string; effectSummary: string; requiredFeatureIds: string[] }) => {
      const requiredFeatureIds = uniqueStrings(convergence.requiredFeatureIds || []);
      const unlockedRequirementCount = requiredFeatureIds.filter((featureId: string) => availableFeatureIds.has(featureId)).length;
      const missingFeatureIds = requiredFeatureIds.filter((featureId: string) => !availableFeatureIds.has(featureId));
      const unlocked = availableFeatureIds.has(convergence.rewardFeatureId) || missingFeatureIds.length === 0;
      let status: ProfileAccountConvergenceSummary["status"] = "locked";
      if (unlocked) {
        status = "unlocked";
      } else if (unlockedRequirementCount > 0) {
        status = "available";
      }

      return {
        id: convergence.id,
        title: convergence.title,
        description: convergence.description,
        rewardFeatureId: convergence.rewardFeatureId,
        effectSummary: convergence.effectSummary,
        status,
        unlocked,
        unlockedRequirementCount,
        requiredFeatureCount: requiredFeatureIds.length,
        requiredFeatureIds,
        requiredFeatureTitles: requiredFeatureIds.map((featureId: string) => getAccountFeatureTitle(featureId)),
        missingFeatureIds,
        missingFeatureTitles: missingFeatureIds.map((featureId: string) => getAccountFeatureTitle(featureId)),
      };
    });
  }

  function hasAccountFeature(profile: ProfileState | null, featureId: string) {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function getRunHistoryCapacity(profile: ProfileState | null) {
    const archiveFocusActive = getFocusedTreeId(profile) === "archives" && hasAccountFeature(profile, "archive_ledger");
    return (
      20 +
      (hasAccountFeature(profile, "chronicle_vault") ? 10 : 0) +
      (hasAccountFeature(profile, "heroic_annals") ? 10 : 0) +
      (hasAccountFeature(profile, "mythic_annals") ? 10 : 0) +
      (hasAccountFeature(profile, "eternal_annals") ? 15 : 0) +
      (hasAccountFeature(profile, "sovereign_annals") ? 15 : 0) +
      (hasAccountFeature(profile, "imperial_annals") ? 15 : 0) +
      (hasAccountFeature(profile, "chronicle_exchange") ? 5 : 0) +
      (hasAccountFeature(profile, "sovereign_exchange") ? 5 : 0) +
      (hasAccountFeature(profile, "legendary_annals") ? 5 : 0) +
      (hasAccountFeature(profile, "imperial_exchange") ? 5 : 0) +
      (hasAccountFeature(profile, "immortal_annals") ? 5 : 0) +
      (archiveFocusActive ? 5 : 0)
    );
  }

  function applyDerivedAccountUnlocks(profile: ProfileState) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(profile);
    const unlockedFeatureIds = uniqueStrings([...(profile.meta.unlocks?.townFeatureIds || []), ...CORE_TOWN_FEATURE_IDS, ...unlockedMilestoneFeatureIds]);
    const unlockedFeatureIdSet = new Set(unlockedFeatureIds);
    const unlockedConvergenceFeatureIds = ACCOUNT_CONVERGENCES.filter((convergence: { requiredFeatureIds: string[]; rewardFeatureId: string }) => {
      return uniqueStrings(convergence.requiredFeatureIds || []).every((featureId: string) => unlockedFeatureIdSet.has(featureId));
    }).map((convergence: { rewardFeatureId: string }) => convergence.rewardFeatureId);
    profile.meta.unlocks.townFeatureIds = uniqueStrings([...unlockedFeatureIds, ...unlockedConvergenceFeatureIds]);
  }

  function ensureMeta(profile: ProfileState, content: GameContent | null = null) {
    const defaultMeta = createDefaultMeta();
    profile.meta = profile.meta || defaultMeta;
    profile.meta.settings = {
      ...defaultMeta.settings,
      ...(profile.meta.settings || {}),
    };
    profile.meta.progression = {
      ...defaultMeta.progression,
      ...(profile.meta.progression || {}),
      classesPlayed: uniqueStrings(profile.meta.progression?.classesPlayed),
    };
    profile.meta.unlocks = {
      ...defaultMeta.unlocks,
      ...(profile.meta.unlocks || {}),
      classIds: uniqueStrings(profile.meta.unlocks?.classIds),
      bossIds: uniqueStrings(profile.meta.unlocks?.bossIds),
      runewordIds: uniqueStrings(profile.meta.unlocks?.runewordIds),
      townFeatureIds: uniqueStrings([...(profile.meta.unlocks?.townFeatureIds || []), ...CORE_TOWN_FEATURE_IDS]),
    };
    const completedTutorialIds = uniqueStrings(profile.meta.tutorials?.completedIds);
    const dismissedTutorialIds = uniqueStrings((profile.meta.tutorials?.dismissedIds || []).filter((tutorialId: string) => !completedTutorialIds.includes(tutorialId)));
    profile.meta.tutorials = {
      ...defaultMeta.tutorials,
      ...(profile.meta.tutorials || {}),
      seenIds: uniqueStrings([...(profile.meta.tutorials?.seenIds || []), ...completedTutorialIds, ...dismissedTutorialIds]),
      completedIds: completedTutorialIds,
      dismissedIds: dismissedTutorialIds,
    };
    profile.meta.planning = {
      ...defaultMeta.planning,
      ...(profile.meta.planning || {}),
      weaponRunewordId: typeof profile.meta.planning?.weaponRunewordId === "string" ? profile.meta.planning.weaponRunewordId : "",
      armorRunewordId: typeof profile.meta.planning?.armorRunewordId === "string" ? profile.meta.planning.armorRunewordId : "",
    };
    profile.meta.accountProgression = {
      ...defaultMeta.accountProgression,
      ...(profile.meta.accountProgression || {}),
    };
    profile.meta.charms = {
      ...defaultMeta.charms,
      ...(profile.meta.charms || {}),
      unlockedCharmIds: uniqueStrings(profile.meta.charms?.unlockedCharmIds),
      equippedCharmIds: uniqueStrings(profile.meta.charms?.equippedCharmIds),
    };
    profile.meta.accountProgression.focusedTreeId = getFocusedTreeId(profile);
    sanitizePlanningState(profile, content);
    applyDerivedAccountUnlocks(profile);
  }

  function createProfileEnvelope(profile: ProfileState | ProfileEnvelope, content: GameContent | null = null) {
    if ((profile as ProfileEnvelope)?.profile) {
      const clonedProfile = deepClone((profile as ProfileEnvelope).profile);
      ensureMeta(clonedProfile, content);
      return {
        schemaVersion: PROFILE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        profile: clonedProfile,
      };
    }

    const clonedProfile = deepClone((profile as ProfileState) || createEmptyProfile());
    ensureMeta(clonedProfile, content);
    return {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      profile: clonedProfile,
    };
  }

  function serializeSnapshot(snapshot: RunSnapshotEnvelope) {
    return JSON.stringify(snapshot);
  }

  function restoreSnapshot(snapshotOrSerialized: unknown) {
    try {
      const parsed =
        typeof snapshotOrSerialized === "string" ? JSON.parse(snapshotOrSerialized) : deepClone(snapshotOrSerialized || null);
      return runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(parsed) || null;
    } catch {
      return null;
    }
  }

  function serializeProfile(profileOrEnvelope: ProfileState | ProfileEnvelope, content: GameContent | null = null) {
    return JSON.stringify(createProfileEnvelope(profileOrEnvelope, content));
  }

  function restoreProfile(profileOrSerialized: unknown, content: GameContent | null = null) {
    try {
      const parsed =
        typeof profileOrSerialized === "string" ? JSON.parse(profileOrSerialized) : deepClone(profileOrSerialized || null);
      return runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.migrateProfile(parsed, content) || null;
    } catch {
      return null;
    }
  }

  function saveProfileToStorage(profile: ProfileState | ProfileEnvelope | string, storage: StorageLike | null = getDefaultStorage(), content: GameContent | null = null) {
    if (!storage?.setItem) {
      return { ok: false, message: "No storage provider is available." };
    }

    const serialized = typeof profile === "string" ? profile : serializeProfile(profile, content);

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

  function loadProfileFromStorage(storage: StorageLike | null = getDefaultStorage(), content: GameContent | null = null) {
    if (!storage?.getItem) {
      return null;
    }

    try {
      let serializedProfile = storage.getItem(PROFILE_STORAGE_KEY);

      if (!serializedProfile) {
        const legacyProfile = storage.getItem(LEGACY_PROFILE_STORAGE_KEY);
        if (legacyProfile) {
          serializedProfile = legacyProfile;
          if (storage.setItem) { storage.setItem(PROFILE_STORAGE_KEY, legacyProfile); }
          if (storage.removeItem) { storage.removeItem(LEGACY_PROFILE_STORAGE_KEY); }
        }
      }

      if (serializedProfile) {
        return restoreProfile(serializedProfile, content)?.profile || null;
      }

      let serializedLegacyRun = storage.getItem(STORAGE_KEY);
      if (!serializedLegacyRun) {
        serializedLegacyRun = storage.getItem(LEGACY_STORAGE_KEY);
      }
      if (!serializedLegacyRun) {
        return null;
      }

      const migratedEnvelope = restoreProfile(serializedLegacyRun, content);
      if (!migratedEnvelope) {
        return null;
      }

      saveProfileToStorage(migratedEnvelope, storage, content);
      if (storage.removeItem) {
        storage.removeItem(LEGACY_STORAGE_KEY);
        storage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
      }
      return migratedEnvelope.profile;
    } catch {
      return null;
    }
  }

  runtimeWindow.__ROUGE_PERSISTENCE_CORE = {
    SCHEMA_VERSION,
    STORAGE_KEY,
    PROFILE_STORAGE_KEY,
    CORE_TOWN_FEATURE_IDS,
    ACCOUNT_PROGRESSION_TREES,
    uniqueStrings,
    toNumber,
    sanitizePlannedRunewordId,
    sanitizePlanningState,
    createSnapshot,
    createEmptyProfile,
    buildProfileMetrics,
    listAccountMilestoneSummaries,
    getDefaultFocusedTreeId,
    getFocusedTreeId,
    getAccountTreeSummaries,
    getAccountConvergenceSummaries,
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
  };
})();
