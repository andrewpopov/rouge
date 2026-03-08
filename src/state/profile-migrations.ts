(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const CURRENT_PROFILE_SCHEMA_VERSION = 8;
  const CORE_TOWN_FEATURE_IDS = [
    "front_door_profile_hall",
    "safe_zone_services",
    "vendor_economy",
    "profile_stash",
    "mercenary_contracts",
    "class_progression",
  ];
  const ACCOUNT_PROGRESSION_TREES = [
    {
      id: "archives",
      nodes: [
        {
          id: "archive_ledger",
          rewardFeatureId: "archive_ledger",
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "chronicle_vault",
          rewardFeatureId: "chronicle_vault",
          prerequisiteIds: ["archive_ledger"],
          target: 4,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "heroic_annals",
          rewardFeatureId: "heroic_annals",
          prerequisiteIds: ["archive_ledger"],
          target: 2,
          getProgress: (metrics) => metrics.completedRuns,
        },
        {
          id: "mythic_annals",
          rewardFeatureId: "mythic_annals",
          prerequisiteIds: ["chronicle_vault"],
          target: 6,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "eternal_annals",
          rewardFeatureId: "eternal_annals",
          prerequisiteIds: ["heroic_annals", "mythic_annals"],
          target: 4,
          getProgress: (metrics) => metrics.completedRuns,
        },
      ],
    },
    {
      id: "economy",
      nodes: [
        {
          id: "advanced_vendor_stock",
          rewardFeatureId: "advanced_vendor_stock",
          prerequisiteIds: [],
          target: 3,
          getProgress: (metrics) => metrics.highestActCleared,
        },
        {
          id: "runeword_codex",
          rewardFeatureId: "runeword_codex",
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.unlockedRunewordCount,
        },
        {
          id: "economy_ledger",
          rewardFeatureId: "economy_ledger",
          prerequisiteIds: ["advanced_vendor_stock"],
          target: 500,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "salvage_tithes",
          rewardFeatureId: "salvage_tithes",
          prerequisiteIds: ["economy_ledger"],
          target: 1200,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "artisan_stock",
          rewardFeatureId: "artisan_stock",
          prerequisiteIds: ["advanced_vendor_stock"],
          target: 5,
          getProgress: (metrics) => metrics.highestActCleared,
        },
        {
          id: "brokerage_charter",
          rewardFeatureId: "brokerage_charter",
          prerequisiteIds: ["salvage_tithes"],
          target: 2500,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "treasury_exchange",
          rewardFeatureId: "treasury_exchange",
          prerequisiteIds: ["artisan_stock", "brokerage_charter"],
          target: 4000,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
      ],
    },
    {
      id: "mastery",
      nodes: [
        {
          id: "boss_trophy_gallery",
          rewardFeatureId: "boss_trophy_gallery",
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.unlockedBossCount,
        },
        {
          id: "class_roster_archive",
          rewardFeatureId: "class_roster_archive",
          prerequisiteIds: [],
          target: 3,
          getProgress: (metrics) => metrics.classesPlayedCount,
        },
        {
          id: "training_grounds",
          rewardFeatureId: "training_grounds",
          prerequisiteIds: ["class_roster_archive"],
          target: 10,
          getProgress: (metrics) => metrics.highestLevel,
        },
        {
          id: "war_college",
          rewardFeatureId: "war_college",
          prerequisiteIds: ["boss_trophy_gallery", "training_grounds"],
          target: 5,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
        {
          id: "paragon_doctrine",
          rewardFeatureId: "paragon_doctrine",
          prerequisiteIds: ["war_college"],
          target: 8,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
        {
          id: "apex_doctrine",
          rewardFeatureId: "apex_doctrine",
          prerequisiteIds: ["war_college", "paragon_doctrine"],
          target: 12,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
      ],
    },
  ];
  const ACCOUNT_CONVERGENCES = [
    {
      id: "chronicle_exchange",
      rewardFeatureId: "chronicle_exchange",
      requiredFeatureIds: ["eternal_annals", "treasury_exchange"],
    },
    {
      id: "war_annals",
      rewardFeatureId: "war_annals",
      requiredFeatureIds: ["eternal_annals", "apex_doctrine"],
    },
    {
      id: "paragon_exchange",
      rewardFeatureId: "paragon_exchange",
      requiredFeatureIds: ["treasury_exchange", "apex_doctrine"],
    },
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object";
  }

  function toNumber(value, fallback = 0) {
    return Number.parseInt(String(value ?? fallback), 10) || fallback;
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter((entry) => typeof entry === "string" && entry)));
  }

  function sanitizePlannedRunewordId(runewordId, slot, content = null) {
    if (typeof runewordId !== "string" || !runewordId) {
      return "";
    }
    if (!content?.runewordCatalog) {
      return runewordId;
    }
    const runeword = content.runewordCatalog[runewordId] || null;
    return runeword?.slot === slot ? runeword.id : "";
  }

  function sanitizeHistoryPlanningEntry(entry, content = null) {
    if (!entry || !content?.runewordCatalog) {
      return entry;
    }

    const plannedWeaponRunewordId = sanitizePlannedRunewordId(entry.plannedWeaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(entry.plannedArmorRunewordId, "armor", content);
    const allowedRunewordIds = new Set([plannedWeaponRunewordId, plannedArmorRunewordId].filter(Boolean));
    entry.plannedWeaponRunewordId = plannedWeaponRunewordId;
    entry.plannedArmorRunewordId = plannedArmorRunewordId;
    entry.completedPlannedRunewordIds = uniqueStrings((entry.completedPlannedRunewordIds || []).filter((runewordId) => allowedRunewordIds.has(runewordId)));
    return entry;
  }

  function ensureHistoryEntry(entry, content = null) {
    if (!isObject(entry)) {
      return null;
    }

    const outcome = typeof entry.outcome === "string" ? entry.outcome : "abandoned";
    return sanitizeHistoryPlanningEntry({
      runId: typeof entry.runId === "string" ? entry.runId : "",
      classId: typeof entry.classId === "string" ? entry.classId : "",
      className: typeof entry.className === "string" ? entry.className : "",
      level: Number.parseInt(String(entry.level || 1), 10) || 1,
      actsCleared: Number.parseInt(String(entry.actsCleared || 0), 10) || 0,
      bossesDefeated: Number.parseInt(String(entry.bossesDefeated || 0), 10) || 0,
      goldGained: Number.parseInt(String(entry.goldGained || 0), 10) || 0,
      runewordsForged: Number.parseInt(String(entry.runewordsForged || 0), 10) || 0,
      skillPointsEarned: Number.parseInt(String(entry.skillPointsEarned || 0), 10) || 0,
      classPointsEarned: Number.parseInt(String(entry.classPointsEarned || 0), 10) || 0,
      attributePointsEarned: Number.parseInt(String(entry.attributePointsEarned || 0), 10) || 0,
      trainingRanksGained: Number.parseInt(String(entry.trainingRanksGained || 0), 10) || 0,
      favoredTreeId: typeof entry.favoredTreeId === "string" ? entry.favoredTreeId : "",
      favoredTreeName: typeof entry.favoredTreeName === "string" ? entry.favoredTreeName : "",
      unlockedClassSkills: Number.parseInt(String(entry.unlockedClassSkills || 0), 10) || 0,
      loadoutTier: Number.parseInt(String(entry.loadoutTier || 0), 10) || 0,
      loadoutSockets: Number.parseInt(String(entry.loadoutSockets || 0), 10) || 0,
      carriedEquipmentCount: Number.parseInt(String(entry.carriedEquipmentCount || 0), 10) || 0,
      carriedRuneCount: Number.parseInt(String(entry.carriedRuneCount || 0), 10) || 0,
      stashEntryCount: Number.parseInt(String(entry.stashEntryCount || 0), 10) || 0,
      stashEquipmentCount: Number.parseInt(String(entry.stashEquipmentCount || 0), 10) || 0,
      stashRuneCount: Number.parseInt(String(entry.stashRuneCount || 0), 10) || 0,
      plannedWeaponRunewordId: typeof entry.plannedWeaponRunewordId === "string" ? entry.plannedWeaponRunewordId : "",
      plannedArmorRunewordId: typeof entry.plannedArmorRunewordId === "string" ? entry.plannedArmorRunewordId : "",
      completedPlannedRunewordIds: uniqueStrings(entry.completedPlannedRunewordIds),
      activeRunewordIds: uniqueStrings(entry.activeRunewordIds),
      newFeatureIds: uniqueStrings(entry.newFeatureIds),
      completedAt: typeof entry.completedAt === "string" ? entry.completedAt : new Date(0).toISOString(),
      outcome: outcome === "completed" || outcome === "failed" || outcome === "abandoned" ? outcome : "abandoned",
    }, content);
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
        highestActCleared: 0,
        totalBossesDefeated: 0,
        totalGoldCollected: 0,
        totalRunewordsForged: 0,
        classesPlayed: [],
        preferredClassId: "",
        lastPlayedClassId: "",
      },
      unlocks: {
        classIds: [],
        bossIds: [],
        runewordIds: [],
        townFeatureIds: [...CORE_TOWN_FEATURE_IDS],
      },
      tutorials: {
        seenIds: [],
        completedIds: [],
        dismissedIds: [],
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

  function buildProfileMetrics(meta, runHistory) {
    const history = Array.isArray(runHistory) ? runHistory : [];
    return {
      runHistoryCount: history.length,
      completedRuns: history.filter((entry) => entry?.outcome === "completed").length,
      failedRuns: history.filter((entry) => entry?.outcome === "failed").length,
      highestLevel: toNumber(meta?.progression?.highestLevel, 1),
      highestActCleared: toNumber(meta?.progression?.highestActCleared, 0),
      totalBossesDefeated: toNumber(meta?.progression?.totalBossesDefeated, 0),
      totalGoldCollected: toNumber(meta?.progression?.totalGoldCollected, 0),
      classesPlayedCount: Array.isArray(meta?.progression?.classesPlayed) ? meta.progression.classesPlayed.length : 0,
      unlockedBossCount: Array.isArray(meta?.unlocks?.bossIds) ? meta.unlocks.bossIds.length : 0,
      unlockedRunewordCount: Array.isArray(meta?.unlocks?.runewordIds) ? meta.unlocks.runewordIds.length : 0,
    };
  }

  function getDefaultFocusedTreeId(meta, runHistory) {
    const milestones = listUnlockedMilestones(meta, runHistory);
    const firstIncompleteTree = ACCOUNT_PROGRESSION_TREES.find((tree) => {
      return tree.nodes.some((milestone) => !milestones.includes(milestone.id));
    });
    return firstIncompleteTree?.id || ACCOUNT_PROGRESSION_TREES[0].id;
  }

  function listUnlockedMilestones(meta, runHistory) {
    const metrics = buildProfileMetrics(meta, runHistory);
    return ACCOUNT_PROGRESSION_TREES.flatMap((tree) => {
      const unlockedMilestoneIds = new Set();
      return tree.nodes
        .filter((milestone) => {
          const blockedByIds = uniqueStrings(milestone.prerequisiteIds || []).filter((milestoneId) => !unlockedMilestoneIds.has(milestoneId));
          if (blockedByIds.length > 0 || toNumber(milestone.getProgress(metrics), 0) < milestone.target) {
            return false;
          }
          unlockedMilestoneIds.add(milestone.id);
          return true;
        })
        .map((milestone) => milestone.id);
    });
  }

  function listUnlockedMilestoneFeatureIds(meta, runHistory) {
    const unlockedMilestoneIds = new Set(listUnlockedMilestones(meta, runHistory));
    return uniqueStrings(
      ACCOUNT_PROGRESSION_TREES.flatMap((tree) => {
        return tree.nodes.filter((milestone) => unlockedMilestoneIds.has(milestone.id)).map((milestone) => milestone.rewardFeatureId);
      })
    );
  }

  function applyDerivedAccountUnlocks(meta, runHistory) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(meta, runHistory);
    const unlockedFeatureIds = uniqueStrings([...(meta.unlocks?.townFeatureIds || []), ...CORE_TOWN_FEATURE_IDS, ...unlockedMilestoneFeatureIds]);
    const unlockedFeatureIdSet = new Set(unlockedFeatureIds);
    const unlockedConvergenceFeatureIds = ACCOUNT_CONVERGENCES.filter((convergence) => {
      return uniqueStrings(convergence.requiredFeatureIds || []).every((featureId) => unlockedFeatureIdSet.has(featureId));
    }).map((convergence) => convergence.rewardFeatureId);
    meta.unlocks.townFeatureIds = uniqueStrings([...unlockedFeatureIds, ...unlockedConvergenceFeatureIds]);
  }

  function ensureMeta(meta, runHistory, activeRunSnapshot, content = null) {
    const source = isObject(meta) ? meta : {};
    const history = Array.isArray(runHistory) ? runHistory : [];
    const defaultMeta = createDefaultMeta();
    const activeRun = isObject(activeRunSnapshot?.run) ? activeRunSnapshot.run : null;
    const historyHighestLevel = history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.level, 1)), 1);
    const historyBosses = history.reduce((total, entry) => total + toNumber(entry?.bossesDefeated, 0), 0);
    const historyClasses = uniqueStrings([...history.map((entry) => entry?.classId), activeRun?.classId]);

    const completedTutorialIds = uniqueStrings(source.tutorials?.completedIds);
    const dismissedTutorialIds = uniqueStrings((Array.isArray(source.tutorials?.dismissedIds) ? source.tutorials.dismissedIds : []).filter((entry) => !completedTutorialIds.includes(entry)));
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
          history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
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
      (tree) => tree.id === normalizedMeta.accountProgression.focusedTreeId
    )
      ? normalizedMeta.accountProgression.focusedTreeId
      : getDefaultFocusedTreeId(normalizedMeta, history);
    if (content?.runewordCatalog) {
      normalizedMeta.planning.weaponRunewordId = sanitizePlannedRunewordId(normalizedMeta.planning.weaponRunewordId, "weapon", content);
      normalizedMeta.planning.armorRunewordId = sanitizePlannedRunewordId(normalizedMeta.planning.armorRunewordId, "armor", content);
      history.forEach((entry) => sanitizeHistoryPlanningEntry(entry, content));
    }
    applyDerivedAccountUnlocks(normalizedMeta, history);
    return normalizedMeta;
  }

  function ensureProfileState(profile, content = null) {
    const source = isObject(profile) ? profile : {};
    const activeRunSnapshot = source.activeRunSnapshot ? runtimeWindow.ROUGE_SAVE_MIGRATIONS?.migrateSnapshot(source.activeRunSnapshot) || null : null;
    const runHistory = Array.isArray(source.runHistory) ? source.runHistory.map((entry) => ensureHistoryEntry(entry, content)).filter(Boolean) : [];
    return {
      activeRunSnapshot,
      stash: {
        entries: Array.isArray(source.stash?.entries)
          ? source.stash.entries.filter((entry) => isObject(entry)).map((entry) => deepClone(entry))
          : [],
      },
      runHistory,
      meta: ensureMeta(source.meta, runHistory, activeRunSnapshot, content),
    };
  }

  function normalizeProfileEnvelope(profile, content = null) {
    if (!profile) {
      return {
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: new Date(0).toISOString(),
        profile: ensureProfileState(null, content),
      };
    }

    if (isObject(profile) && isObject(profile.profile)) {
      return {
        schemaVersion: Number.parseInt(String(profile.schemaVersion || CURRENT_PROFILE_SCHEMA_VERSION), 10) || CURRENT_PROFILE_SCHEMA_VERSION,
        savedAt: typeof profile.savedAt === "string" ? profile.savedAt : new Date(0).toISOString(),
        profile: ensureProfileState(profile.profile, content),
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

  function migrateProfile(profile, content = null) {
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
