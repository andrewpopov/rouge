/* eslint-disable @typescript-eslint/no-explicit-any -- migration code transforms arbitrary legacy data */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    CURRENT_PROFILE_SCHEMA_VERSION,
    CORE_TOWN_FEATURE_IDS,
    ACCOUNT_PROGRESSION_TREES,
    ACCOUNT_CONVERGENCES,
    deepClone,
    isObject,
    toNumber,
    uniqueStrings,
    sanitizePlannedRunewordId,
    sanitizeHistoryPlanningEntry,
    ensureHistoryEntry,
  } = runtimeWindow.__ROUGE_PROFILE_MIGRATIONS_DATA;

  function createDefaultMeta() {
    return {
      settings: {
        showHints: true,
        reduceMotion: false,
        compactMode: false,
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
    };
  }

  function buildProfileMetrics(meta: Record<string, any> | null, runHistory: RunHistoryEntry[]) {
    const history = Array.isArray(runHistory) ? runHistory : [];
    return {
      runHistoryCount: history.length,
      completedRuns: history.filter((entry: RunHistoryEntry) => entry?.outcome === "completed").length,
      failedRuns: history.filter((entry: RunHistoryEntry) => entry?.outcome === "failed").length,
      highestLevel: toNumber(meta?.progression?.highestLevel, 1),
      highestActCleared: toNumber(meta?.progression?.highestActCleared, 0),
      totalBossesDefeated: toNumber(meta?.progression?.totalBossesDefeated, 0),
      totalGoldCollected: toNumber(meta?.progression?.totalGoldCollected, 0),
      classesPlayedCount: Array.isArray(meta?.progression?.classesPlayed) ? meta.progression.classesPlayed.length : 0,
      unlockedBossCount: Array.isArray(meta?.unlocks?.bossIds) ? meta.unlocks.bossIds.length : 0,
      unlockedRunewordCount: Array.isArray(meta?.unlocks?.runewordIds) ? meta.unlocks.runewordIds.length : 0,
    };
  }

  function getDefaultFocusedTreeId(meta: Record<string, any> | null, runHistory: RunHistoryEntry[]) {
    const milestones = listUnlockedMilestones(meta, runHistory);
    const firstIncompleteTree = ACCOUNT_PROGRESSION_TREES.find((tree: { id: string; nodes: { id: string }[] }) => {
      return tree.nodes.some((milestone: { id: string }) => !milestones.includes(milestone.id));
    });
    return firstIncompleteTree?.id || ACCOUNT_PROGRESSION_TREES[0].id;
  }

  function listUnlockedMilestones(meta: Record<string, any> | null, runHistory: RunHistoryEntry[]) {
    const metrics = buildProfileMetrics(meta, runHistory);
    return ACCOUNT_PROGRESSION_TREES.flatMap((tree: { id: string; nodes: { id: string; prerequisiteIds: string[]; target: number; getProgress: (metrics: Record<string, number>) => number; rewardFeatureId: string }[] }) => {
      const unlockedMilestoneIds = new Set<string>();
      return tree.nodes
        .filter((milestone: { id: string; prerequisiteIds: string[]; target: number; getProgress: (metrics: Record<string, number>) => number }) => {
          const blockedByIds = uniqueStrings(milestone.prerequisiteIds || []).filter((milestoneId: string) => !unlockedMilestoneIds.has(milestoneId));
          if (blockedByIds.length > 0 || toNumber(milestone.getProgress(metrics), 0) < milestone.target) {
            return false;
          }
          unlockedMilestoneIds.add(milestone.id);
          return true;
        })
        .map((milestone: { id: string }) => milestone.id);
    });
  }

  function listUnlockedMilestoneFeatureIds(meta: Record<string, any> | null, runHistory: RunHistoryEntry[]) {
    const unlockedMilestoneIds = new Set(listUnlockedMilestones(meta, runHistory));
    return uniqueStrings(
      ACCOUNT_PROGRESSION_TREES.flatMap((tree: { id: string; nodes: { id: string; rewardFeatureId: string }[] }) => {
        return tree.nodes.filter((milestone: { id: string }) => unlockedMilestoneIds.has(milestone.id)).map((milestone: { rewardFeatureId: string }) => milestone.rewardFeatureId);
      })
    );
  }

  function applyDerivedAccountUnlocks(meta: Record<string, any>, runHistory: RunHistoryEntry[]) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(meta, runHistory);
    const unlockedFeatureIds = uniqueStrings([...(meta.unlocks?.townFeatureIds || []), ...CORE_TOWN_FEATURE_IDS, ...unlockedMilestoneFeatureIds]);
    const unlockedFeatureIdSet = new Set(unlockedFeatureIds);
    const unlockedConvergenceFeatureIds = ACCOUNT_CONVERGENCES.filter((convergence: { requiredFeatureIds: string[]; rewardFeatureId: string }) => {
      return uniqueStrings(convergence.requiredFeatureIds || []).every((featureId: string) => unlockedFeatureIdSet.has(featureId));
    }).map((convergence: { rewardFeatureId: string }) => convergence.rewardFeatureId);
    meta.unlocks.townFeatureIds = uniqueStrings([...unlockedFeatureIds, ...unlockedConvergenceFeatureIds]);
  }

  function ensureMeta(meta: unknown, runHistory: RunHistoryEntry[], activeRunSnapshot: Record<string, any> | null, content: GameContent | null = null) {
    const source = isObject(meta) ? meta as Record<string, any> : {} as Record<string, any>;
    const history = Array.isArray(runHistory) ? runHistory : [];
    const defaultMeta = createDefaultMeta();
    const activeRun: Record<string, any> | null = isObject(activeRunSnapshot?.run) ? activeRunSnapshot.run as Record<string, any> : null;
    const historyHighestLevel = history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.level, 1)), 1);
    const historyBosses = history.reduce((total: number, entry: RunHistoryEntry) => total + toNumber(entry?.bossesDefeated, 0), 0);
    const historyClasses = uniqueStrings([...history.map((entry: RunHistoryEntry) => entry?.classId), activeRun?.classId]);

    const completedTutorialIds = uniqueStrings(source.tutorials?.completedIds);
    const dismissedTutorialIds = uniqueStrings((Array.isArray(source.tutorials?.dismissedIds) ? source.tutorials.dismissedIds : []).filter((entry: string) => !completedTutorialIds.includes(entry)));
    const normalizedMeta = {
      settings: {
        ...defaultMeta.settings,
        ...(isObject(source.settings) ? source.settings : {}),
      },
      progression: {
        ...defaultMeta.progression,
        ...(isObject(source.progression) ? source.progression : {}),
        highestLevel: Math.max(toNumber(source.progression?.highestLevel, 1), historyHighestLevel, toNumber(activeRun?.level, 1)),
        highestActCleared: Math.max(
          toNumber(source.progression?.highestActCleared, 0),
          history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
          toNumber(activeRun?.summary?.actsCleared, 0)
        ),
        totalBossesDefeated: Math.max(toNumber(source.progression?.totalBossesDefeated, 0), historyBosses),
        totalGoldCollected: Math.max(toNumber(source.progression?.totalGoldCollected, 0), 0),
        totalRunewordsForged: Math.max(toNumber(source.progression?.totalRunewordsForged, 0), 0),
        classesPlayed: uniqueStrings([...(Array.isArray(source.progression?.classesPlayed) ? source.progression.classesPlayed : []), ...historyClasses]),
        preferredClassId: typeof source.progression?.preferredClassId === "string" ? source.progression.preferredClassId : "",
        lastPlayedClassId:
          typeof source.progression?.lastPlayedClassId === "string"
            ? source.progression.lastPlayedClassId
            : historyClasses[0] || "",
      },
      unlocks: {
        ...defaultMeta.unlocks,
        ...(isObject(source.unlocks) ? source.unlocks : {}),
        classIds: uniqueStrings([
          ...(Array.isArray(source.unlocks?.classIds) ? source.unlocks.classIds : []),
          ...(Array.isArray(source.progression?.classesPlayed) ? source.progression.classesPlayed : []),
          ...historyClasses,
        ]),
        bossIds: uniqueStrings([
          ...(Array.isArray(source.unlocks?.bossIds) ? source.unlocks.bossIds : []),
          ...(Array.isArray(activeRun?.progression?.bossTrophies) ? activeRun.progression.bossTrophies : []),
        ]),
        runewordIds: uniqueStrings([
          ...(Array.isArray(source.unlocks?.runewordIds) ? source.unlocks.runewordIds : []),
          ...(Array.isArray(activeRun?.progression?.activatedRunewords) ? activeRun.progression.activatedRunewords : []),
        ]),
        townFeatureIds: uniqueStrings([...(Array.isArray(source.unlocks?.townFeatureIds) ? source.unlocks.townFeatureIds : []), ...CORE_TOWN_FEATURE_IDS]),
      },
      tutorials: {
        ...defaultMeta.tutorials,
        ...(isObject(source.tutorials) ? source.tutorials : {}),
        seenIds: uniqueStrings([...(Array.isArray(source.tutorials?.seenIds) ? source.tutorials.seenIds : []), ...completedTutorialIds, ...dismissedTutorialIds]),
        completedIds: completedTutorialIds,
        dismissedIds: dismissedTutorialIds,
      },
      planning: {
        ...defaultMeta.planning,
        ...(isObject(source.planning) ? source.planning : {}),
        weaponRunewordId: typeof source.planning?.weaponRunewordId === "string" ? source.planning.weaponRunewordId : "",
        armorRunewordId: typeof source.planning?.armorRunewordId === "string" ? source.planning.armorRunewordId : "",
      },
      accountProgression: {
        ...defaultMeta.accountProgression,
        ...(isObject(source.accountProgression) ? source.accountProgression : {}),
      },
    };
    normalizedMeta.accountProgression.focusedTreeId = ACCOUNT_PROGRESSION_TREES.some(
      (tree: { id: string }) => tree.id === normalizedMeta.accountProgression.focusedTreeId
    )
      ? normalizedMeta.accountProgression.focusedTreeId
      : getDefaultFocusedTreeId(normalizedMeta, history);
    if (content?.runewordCatalog) {
      normalizedMeta.planning.weaponRunewordId = sanitizePlannedRunewordId(normalizedMeta.planning.weaponRunewordId, "weapon", content);
      normalizedMeta.planning.armorRunewordId = sanitizePlannedRunewordId(normalizedMeta.planning.armorRunewordId, "armor", content);
      history.forEach((entry: RunHistoryEntry) => sanitizeHistoryPlanningEntry(entry, content));
    }
    applyDerivedAccountUnlocks(normalizedMeta, history);
    return normalizedMeta;
  }

  function ensureProfileState(profile: unknown, content: GameContent | null = null) {
    const source = isObject(profile) ? profile as Record<string, any> : {} as Record<string, any>;
    const activeRunSnapshot = source.activeRunSnapshot ? runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(source.activeRunSnapshot) || null : null;
    const runHistory = Array.isArray(source.runHistory) ? source.runHistory.map((entry: unknown) => ensureHistoryEntry(entry, content)).filter(Boolean) : [];
    return {
      activeRunSnapshot,
      stash: {
        entries: Array.isArray(source.stash?.entries)
          ? source.stash.entries.filter((entry: unknown) => isObject(entry)).map((entry: unknown) => deepClone(entry))
          : [],
      },
      runHistory,
      meta: ensureMeta(source.meta, runHistory, activeRunSnapshot as Record<string, any> | null, content),
    };
  }

  function normalizeProfileEnvelope(profile: unknown, content: GameContent | null = null) {
    if (!profile) {
      return {
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: new Date(0).toISOString(),
        profile: ensureProfileState(null, content),
      };
    }

    const profileObj = profile as Record<string, any>;
    if (isObject(profile) && isObject(profileObj.profile)) {
      return {
        schemaVersion: Number.parseInt(String(profileObj.schemaVersion || CURRENT_PROFILE_SCHEMA_VERSION), 10) || CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: typeof profileObj.savedAt === "string" ? profileObj.savedAt : new Date(0).toISOString(),
        profile: ensureProfileState(profileObj.profile, content),
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
        }, content),
      };
    }

    return null;
  }

  function migrateProfile(profile: unknown, content: GameContent | null = null) {
    let envelope = normalizeProfileEnvelope(profile, content);
    if (!envelope) {
      return null;
    }

    while (envelope.schemaVersion < CURRENT_PROFILE_SCHEMA_VERSION) {
      if (envelope.schemaVersion === 1) {
        envelope = {
          schemaVersion: 2,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 2) {
        envelope = {
          schemaVersion: 3,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 3) {
        envelope = {
          schemaVersion: 4,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 4) {
        envelope = {
          schemaVersion: 5,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 5) {
        envelope = {
          schemaVersion: 6,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 6) {
        envelope = {
          schemaVersion: 7,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      if (envelope.schemaVersion === 7) {
        envelope = {
          schemaVersion: 8,
          savedAt: envelope.savedAt,
          profile: ensureProfileState(envelope.profile, content),
        };
        continue;
      }
      return null;
    }

    if (envelope.schemaVersion !== CURRENT_PROFILE_SCHEMA_VERSION) {
      return null;
    }
    envelope.profile = ensureProfileState(envelope.profile, content);
    return envelope;
  }

  runtimeWindow.ROUGE_PROFILE_MIGRATIONS = {
    CURRENT_PROFILE_SCHEMA_VERSION,
    migrateProfile,
  };
})();
