/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const SCHEMA_VERSION = runtimeWindow.ROUGE_SAVE_MIGRATIONS?.CURRENT_SCHEMA_VERSION || 4;
  const PROFILE_SCHEMA_VERSION = runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.CURRENT_PROFILE_SCHEMA_VERSION || 1;
  const STORAGE_KEY = "rouge.run.snapshot";
  const PROFILE_STORAGE_KEY = "rouge.profile";
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
      title: "Archive Discipline",
      description: "Turn archived expeditions into a deeper account memory seam.",
      nodes: [
        {
          id: "archive_ledger",
          title: "Archive Ledger",
          description: "Archive your first expedition.",
          rewardFeatureId: "archive_ledger",
          tier: 1,
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "chronicle_vault",
          title: "Chronicle Vault",
          description: "Archive four expeditions to widen the retained account ledger.",
          rewardFeatureId: "chronicle_vault",
          tier: 2,
          prerequisiteIds: ["archive_ledger"],
          target: 4,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "heroic_annals",
          title: "Heroic Annals",
          description: "Complete two expeditions to deepen the long-form account chronicle.",
          rewardFeatureId: "heroic_annals",
          tier: 2,
          prerequisiteIds: ["archive_ledger"],
          target: 2,
          getProgress: (metrics) => metrics.completedRuns,
        },
        {
          id: "mythic_annals",
          title: "Mythic Annals",
          description: "Archive six expeditions to preserve a deeper long-horizon account record.",
          rewardFeatureId: "mythic_annals",
          tier: 3,
          prerequisiteIds: ["chronicle_vault"],
          target: 6,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "eternal_annals",
          title: "Eternal Annals",
          description: "Complete four expeditions after establishing Mythic Annals to unlock comparison-grade archive review.",
          rewardFeatureId: "eternal_annals",
          tier: 4,
          isCapstone: true,
          prerequisiteIds: ["heroic_annals", "mythic_annals"],
          target: 4,
          getProgress: (metrics) => metrics.completedRuns,
        },
      ],
    },
    {
      id: "economy",
      title: "Trade Network",
      description: "Grow the long-horizon town economy beyond one-off vendor perks.",
      nodes: [
        {
          id: "advanced_vendor_stock",
          title: "Advanced Vendor Stock",
          description: "Clear through Act III to unlock deeper town economy support.",
          rewardFeatureId: "advanced_vendor_stock",
          tier: 1,
          prerequisiteIds: [],
          target: 3,
          getProgress: (metrics) => metrics.highestActCleared,
        },
        {
          id: "runeword_codex",
          title: "Runeword Codex",
          description: "Forge and archive your first runeword.",
          rewardFeatureId: "runeword_codex",
          tier: 1,
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.unlockedRunewordCount,
        },
        {
          id: "economy_ledger",
          title: "Economy Ledger",
          description: "Collect 500 total gold across archived expeditions.",
          rewardFeatureId: "economy_ledger",
          tier: 2,
          prerequisiteIds: ["advanced_vendor_stock"],
          target: 500,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "salvage_tithes",
          title: "Salvage Tithes",
          description: "Collect 1200 total gold to deepen buy or sell leverage across the account.",
          rewardFeatureId: "salvage_tithes",
          tier: 2,
          prerequisiteIds: ["economy_ledger"],
          target: 1200,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "artisan_stock",
          title: "Artisan Stock",
          description: "Clear through Act V to bias late vendors toward socket-ready endgame stock.",
          rewardFeatureId: "artisan_stock",
          tier: 3,
          prerequisiteIds: ["advanced_vendor_stock"],
          target: 5,
          getProgress: (metrics) => metrics.highestActCleared,
        },
        {
          id: "brokerage_charter",
          title: "Brokerage Charter",
          description: "Collect 2500 total gold to widen late-account trade leverage and vendor depth.",
          rewardFeatureId: "brokerage_charter",
          tier: 3,
          prerequisiteIds: ["salvage_tithes"],
          target: 2500,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "treasury_exchange",
          title: "Treasury Exchange",
          description: "Collect 4000 total gold after late-act trade expansion to unlock deeper stash planning and premium market leverage.",
          rewardFeatureId: "treasury_exchange",
          tier: 4,
          isCapstone: true,
          prerequisiteIds: ["artisan_stock", "brokerage_charter"],
          target: 4000,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
      ],
    },
    {
      id: "mastery",
      title: "Mastery Hall",
      description: "Turn class breadth and boss trophies into stronger build pivots.",
      nodes: [
        {
          id: "boss_trophy_gallery",
          title: "Boss Trophy Gallery",
          description: "Defeat and archive your first boss trophy.",
          rewardFeatureId: "boss_trophy_gallery",
          tier: 1,
          prerequisiteIds: [],
          target: 1,
          getProgress: (metrics) => metrics.unlockedBossCount,
        },
        {
          id: "class_roster_archive",
          title: "Class Roster Archive",
          description: "Play three different classes across the account.",
          rewardFeatureId: "class_roster_archive",
          tier: 1,
          prerequisiteIds: [],
          target: 3,
          getProgress: (metrics) => metrics.classesPlayedCount,
        },
        {
          id: "training_grounds",
          title: "Training Grounds",
          description: "Reach level 10 on the account to unlock stronger progression pivots.",
          rewardFeatureId: "training_grounds",
          tier: 2,
          prerequisiteIds: ["class_roster_archive"],
          target: 10,
          getProgress: (metrics) => metrics.highestLevel,
        },
        {
          id: "war_college",
          title: "War College",
          description: "Defeat five bosses across the account to sharpen late-run build pivots.",
          rewardFeatureId: "war_college",
          tier: 3,
          prerequisiteIds: ["boss_trophy_gallery", "training_grounds"],
          target: 5,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
        {
          id: "paragon_doctrine",
          title: "Paragon Doctrine",
          description: "Defeat eight bosses across the account to codify stronger late-act mastery pivots.",
          rewardFeatureId: "paragon_doctrine",
          tier: 3,
          prerequisiteIds: ["war_college"],
          target: 8,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
        {
          id: "apex_doctrine",
          title: "Apex Doctrine",
          description: "Defeat twelve bosses after codifying Paragon Doctrine to unlock apex late-act mastery pivots.",
          rewardFeatureId: "apex_doctrine",
          tier: 4,
          isCapstone: true,
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
      title: "Chronicle Exchange",
      description: "Bind Eternal Annals to Treasury Exchange so archive memory turns into premium trade leverage.",
      rewardFeatureId: "chronicle_exchange",
      effectSummary: "Deepens archive retention, refresh leverage, and stash-planning pressure in town.",
      requiredFeatureIds: ["eternal_annals", "treasury_exchange"],
    },
    {
      id: "war_annals",
      title: "War Annals",
      description: "Bind Eternal Annals to Apex Doctrine so archived expeditions sharpen late-act mastery pivots.",
      rewardFeatureId: "war_annals",
      effectSummary: "Adds archive-backed weight to late-act boss and miniboss progression rewards.",
      requiredFeatureIds: ["eternal_annals", "apex_doctrine"],
    },
    {
      id: "paragon_exchange",
      title: "Paragon Exchange",
      description: "Bind Treasury Exchange to Apex Doctrine so peak trade leverage and mastery doctrine demand premium replacements.",
      rewardFeatureId: "paragon_exchange",
      effectSummary: "Pushes late-act vendors and equipment rewards toward premium socket-ready pivots.",
      requiredFeatureIds: ["treasury_exchange", "apex_doctrine"],
    },
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultStorage() {
    return runtimeWindow.localStorage || null;
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter((entry) => typeof entry === "string" && entry)));
  }

  function toNumber(value, fallback = 0) {
    return Number.parseInt(String(value ?? fallback), 10) || fallback;
  }

  function getMilestoneTierLabel(milestone) {
    if (milestone?.isCapstone) {
      return "Capstone";
    }
    return `Tier ${Math.max(1, toNumber(milestone?.tier, 1))}`;
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

  function sanitizeRunHistoryPlanningEntry(entry, content = null) {
    if (!entry || !content?.runewordCatalog) {
      return;
    }

    const plannedWeaponRunewordId = sanitizePlannedRunewordId(entry.plannedWeaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(entry.plannedArmorRunewordId, "armor", content);
    const allowedRunewordIds = new Set([plannedWeaponRunewordId, plannedArmorRunewordId].filter(Boolean));
    entry.plannedWeaponRunewordId = plannedWeaponRunewordId;
    entry.plannedArmorRunewordId = plannedArmorRunewordId;
    entry.completedPlannedRunewordIds = uniqueStrings((entry.completedPlannedRunewordIds || []).filter((runewordId) => allowedRunewordIds.has(runewordId)));
  }

  function sanitizePlanningState(profile, content = null) {
    if (!profile?.meta?.planning || !content?.runewordCatalog) {
      return;
    }

    profile.meta.planning.weaponRunewordId = sanitizePlannedRunewordId(profile.meta.planning.weaponRunewordId, "weapon", content);
    profile.meta.planning.armorRunewordId = sanitizePlannedRunewordId(profile.meta.planning.armorRunewordId, "armor", content);
    (Array.isArray(profile.runHistory) ? profile.runHistory : []).forEach((entry) => sanitizeRunHistoryPlanningEntry(entry, content));
  }

  function getAccountFeatureTitle(featureId) {
    for (let treeIndex = 0; treeIndex < ACCOUNT_PROGRESSION_TREES.length; treeIndex += 1) {
      const milestone = ACCOUNT_PROGRESSION_TREES[treeIndex].nodes.find((entry) => entry.id === featureId || entry.rewardFeatureId === featureId);
      if (milestone?.title) {
        return milestone.title;
      }
    }
    const convergence = ACCOUNT_CONVERGENCES.find((entry) => entry.id === featureId || entry.rewardFeatureId === featureId);
    return convergence?.title || featureId;
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
      meta: createDefaultMeta(),
    };
  }

  function buildProfileMetrics(profile) {
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    return {
      runHistoryCount: history.length,
      completedRuns: history.filter((entry) => entry?.outcome === "completed").length,
      failedRuns: history.filter((entry) => entry?.outcome === "failed").length,
      highestLevel: toNumber(profile?.meta?.progression?.highestLevel, 1),
      highestActCleared: toNumber(profile?.meta?.progression?.highestActCleared, 0),
      totalBossesDefeated: toNumber(profile?.meta?.progression?.totalBossesDefeated, 0),
      totalGoldCollected: toNumber(profile?.meta?.progression?.totalGoldCollected, 0),
      totalRunewordsForged: toNumber(profile?.meta?.progression?.totalRunewordsForged, 0),
      classesPlayedCount: Array.isArray(profile?.meta?.progression?.classesPlayed) ? profile.meta.progression.classesPlayed.length : 0,
      unlockedBossCount: Array.isArray(profile?.meta?.unlocks?.bossIds) ? profile.meta.unlocks.bossIds.length : 0,
      unlockedRunewordCount: Array.isArray(profile?.meta?.unlocks?.runewordIds) ? profile.meta.unlocks.runewordIds.length : 0,
      stashEntryCount: stashEntries.length,
      stashEquipmentCount: stashEntries.filter((entry) => entry?.kind === "equipment").length,
      stashRuneCount: stashEntries.filter((entry) => entry?.kind === "rune").length,
    };
  }

  function listAccountMilestoneSummaries(profile) {
    const metrics = buildProfileMetrics(profile);
    return ACCOUNT_PROGRESSION_TREES.flatMap((tree) => {
      const unlockedMilestoneIds = new Set();
      return tree.nodes.map((milestone) => {
        const progress = Math.max(0, toNumber(milestone.getProgress(metrics), 0));
        const prerequisiteIds = uniqueStrings(milestone.prerequisiteIds || []);
        const blockedByIds = prerequisiteIds.filter((milestoneId) => !unlockedMilestoneIds.has(milestoneId));
        const blockedByTitles = blockedByIds.map((milestoneId) => {
          return tree.nodes.find((treeMilestone) => treeMilestone.id === milestoneId)?.title || milestoneId;
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

  function getDefaultFocusedTreeId(profile) {
    const milestones = listAccountMilestoneSummaries(profile);
    const firstIncompleteTree = ACCOUNT_PROGRESSION_TREES.find((tree) => {
      return milestones.some((milestone) => milestone.treeId === tree.id && !milestone.unlocked);
    });
    return firstIncompleteTree?.id || ACCOUNT_PROGRESSION_TREES[0].id;
  }

  function getFocusedTreeId(profile) {
    const focusedTreeId = typeof profile?.meta?.accountProgression?.focusedTreeId === "string" ? profile.meta.accountProgression.focusedTreeId : "";
    return ACCOUNT_PROGRESSION_TREES.some((tree) => tree.id === focusedTreeId) ? focusedTreeId : getDefaultFocusedTreeId(profile);
  }

  function getAccountTreeSummaries(profile) {
    const milestones = listAccountMilestoneSummaries(profile);
    const focusedTreeId = getFocusedTreeId(profile);
    return ACCOUNT_PROGRESSION_TREES.map((tree) => {
      const treeMilestones = milestones.filter((milestone) => milestone.treeId === tree.id);
      const nextMilestone = treeMilestones.find((milestone) => milestone.status === "available") || treeMilestones.find((milestone) => !milestone.unlocked) || null;
      const capstone = [...treeMilestones].reverse().find((milestone) => milestone.isCapstone) || null;
      const capstoneStatus: ProfileAccountTreeSummary["capstoneStatus"] = capstone?.status || "locked";
      return {
        id: tree.id,
        title: tree.title,
        description: tree.description,
        isFocused: tree.id === focusedTreeId,
        currentRank: treeMilestones.filter((milestone) => milestone.unlocked).length,
        maxRank: treeMilestones.length,
        eligibleMilestoneCount: treeMilestones.filter((milestone) => milestone.isEligible && !milestone.unlocked).length,
        blockedMilestoneCount: treeMilestones.filter((milestone) => !milestone.isEligible && !milestone.unlocked).length,
        nextMilestoneId: nextMilestone?.id || "",
        nextMilestoneTitle: nextMilestone?.title || "",
        capstoneId: capstone?.id || "",
        capstoneTitle: capstone?.title || "",
        capstoneUnlocked: Boolean(capstone?.unlocked),
        capstoneStatus,
        unlockedFeatureIds: treeMilestones.filter((milestone) => milestone.unlocked).map((milestone) => milestone.rewardFeatureId),
        milestones: treeMilestones,
      };
    });
  }

  function listUnlockedMilestoneFeatureIds(profile) {
    return uniqueStrings(
      listAccountMilestoneSummaries(profile)
        .filter((milestone) => milestone.unlocked)
        .map((milestone) => milestone.rewardFeatureId)
    );
  }

  function getAccountConvergenceSummaries(profile) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(profile);
    const availableFeatureIds = new Set(uniqueStrings([...(profile?.meta?.unlocks?.townFeatureIds || []), ...unlockedMilestoneFeatureIds]));
    return ACCOUNT_CONVERGENCES.map((convergence) => {
      const requiredFeatureIds = uniqueStrings(convergence.requiredFeatureIds || []);
      const unlockedRequirementCount = requiredFeatureIds.filter((featureId) => availableFeatureIds.has(featureId)).length;
      const missingFeatureIds = requiredFeatureIds.filter((featureId) => !availableFeatureIds.has(featureId));
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
        requiredFeatureTitles: requiredFeatureIds.map((featureId) => getAccountFeatureTitle(featureId)),
        missingFeatureIds,
        missingFeatureTitles: missingFeatureIds.map((featureId) => getAccountFeatureTitle(featureId)),
      };
    });
  }

  function hasAccountFeature(profile, featureId) {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function getRunHistoryCapacity(profile) {
    const archiveFocusActive = getFocusedTreeId(profile) === "archives" && hasAccountFeature(profile, "archive_ledger");
    return (
      20 +
      (hasAccountFeature(profile, "chronicle_vault") ? 10 : 0) +
      (hasAccountFeature(profile, "heroic_annals") ? 10 : 0) +
      (hasAccountFeature(profile, "mythic_annals") ? 10 : 0) +
      (hasAccountFeature(profile, "eternal_annals") ? 15 : 0) +
      (hasAccountFeature(profile, "chronicle_exchange") ? 5 : 0) +
      (archiveFocusActive ? 5 : 0)
    );
  }

  function applyDerivedAccountUnlocks(profile) {
    const unlockedMilestoneFeatureIds = listUnlockedMilestoneFeatureIds(profile);
    const unlockedFeatureIds = uniqueStrings([...(profile.meta.unlocks?.townFeatureIds || []), ...CORE_TOWN_FEATURE_IDS, ...unlockedMilestoneFeatureIds]);
    const unlockedFeatureIdSet = new Set(unlockedFeatureIds);
    const unlockedConvergenceFeatureIds = ACCOUNT_CONVERGENCES.filter((convergence) => {
      return uniqueStrings(convergence.requiredFeatureIds || []).every((featureId) => unlockedFeatureIdSet.has(featureId));
    }).map((convergence) => convergence.rewardFeatureId);
    profile.meta.unlocks.townFeatureIds = uniqueStrings([...unlockedFeatureIds, ...unlockedConvergenceFeatureIds]);
  }

  function ensureMeta(profile, content = null) {
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
    const dismissedTutorialIds = uniqueStrings((profile.meta.tutorials?.dismissedIds || []).filter((tutorialId) => !completedTutorialIds.includes(tutorialId)));
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
    profile.meta.accountProgression.focusedTreeId = getFocusedTreeId(profile);
    sanitizePlanningState(profile, content);
    applyDerivedAccountUnlocks(profile);
  }

  function createProfileEnvelope(profile, content = null) {
    if (profile?.profile) {
      const clonedProfile = deepClone(profile.profile);
      ensureMeta(clonedProfile, content);
      return {
        schemaVersion: PROFILE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        profile: clonedProfile,
      };
    }

    const clonedProfile = deepClone(profile || createEmptyProfile());
    ensureMeta(clonedProfile, content);
    return {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      profile: clonedProfile,
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

  function serializeProfile(profileOrEnvelope, content = null) {
    return JSON.stringify(createProfileEnvelope(profileOrEnvelope, content));
  }

  function restoreProfile(profileOrSerialized, content = null) {
    try {
      const parsed =
        typeof profileOrSerialized === "string" ? JSON.parse(profileOrSerialized) : deepClone(profileOrSerialized || null);
      return runtimeWindow.ROUGE_PROFILE_MIGRATIONS?.migrateProfile(parsed, content) || null;
    } catch {
      return null;
    }
  }

  function saveProfileToStorage(profile, storage = getDefaultStorage(), content = null) {
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

  function loadProfileFromStorage(storage = getDefaultStorage(), content = null) {
    if (!storage?.getItem) {
      return null;
    }

    try {
      const serializedProfile = storage.getItem(PROFILE_STORAGE_KEY);
      if (serializedProfile) {
        return restoreProfile(serializedProfile, content)?.profile || null;
      }

      const serializedLegacyRun = storage.getItem(STORAGE_KEY);
      if (!serializedLegacyRun) {
        return null;
      }

      const migratedEnvelope = restoreProfile(serializedLegacyRun, content);
      if (!migratedEnvelope) {
        return null;
      }

      saveProfileToStorage(migratedEnvelope, storage, content);
      return migratedEnvelope.profile;
    } catch {
      return null;
    }
  }

  function getProfileSummary(profile, content = null) {
    const source = profile || createEmptyProfile();
    ensureMeta(source, content);
    const metrics = buildProfileMetrics(source);
    return {
      hasActiveRun: Boolean(source.activeRunSnapshot),
      stashEntries: Array.isArray(source.stash?.entries) ? source.stash.entries.length : 0,
      runHistoryCount: metrics.runHistoryCount,
      completedRuns: metrics.completedRuns,
      failedRuns: metrics.failedRuns,
      highestLevel: metrics.highestLevel,
      highestActCleared: metrics.highestActCleared,
      totalBossesDefeated: metrics.totalBossesDefeated,
      totalGoldCollected: metrics.totalGoldCollected,
      totalRunewordsForged: metrics.totalRunewordsForged,
      classesPlayedCount: metrics.classesPlayedCount,
      preferredClassId: typeof source.meta.progression?.preferredClassId === "string" ? source.meta.progression.preferredClassId : "",
      lastPlayedClassId: typeof source.meta.progression?.lastPlayedClassId === "string" ? source.meta.progression.lastPlayedClassId : "",
      unlockedClassCount: Array.isArray(source.meta.unlocks?.classIds) ? source.meta.unlocks.classIds.length : 0,
      unlockedBossCount: metrics.unlockedBossCount,
      unlockedRunewordCount: metrics.unlockedRunewordCount,
      townFeatureCount: Array.isArray(source.meta.unlocks?.townFeatureIds) ? source.meta.unlocks.townFeatureIds.length : 0,
      seenTutorialCount: Array.isArray(source.meta.tutorials?.seenIds) ? source.meta.tutorials.seenIds.length : 0,
      completedTutorialCount: Array.isArray(source.meta.tutorials?.completedIds) ? source.meta.tutorials.completedIds.length : 0,
      dismissedTutorialCount: Array.isArray(source.meta.tutorials?.dismissedIds) ? source.meta.tutorials.dismissedIds.length : 0,
    };
  }

  function buildStashSummary(profile) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const equipmentEntries = entries.filter((entry) => entry?.kind === "equipment");
    const runeEntries = entries.filter((entry) => entry?.kind === "rune");
    return {
      entryCount: entries.length,
      equipmentCount: equipmentEntries.length,
      runeCount: runeEntries.length,
      socketReadyEquipmentCount: equipmentEntries.filter((entry) => toNumber(entry?.equipment?.socketsUnlocked, 0) > 0).length,
      socketedRuneCount: equipmentEntries.reduce((total, entry) => total + toNumber(entry?.equipment?.insertedRunes?.length, 0), 0),
      runewordEquipmentCount: equipmentEntries.filter((entry) => entry?.equipment?.runewordId).length,
      itemIds: uniqueStrings(equipmentEntries.map((entry) => entry?.equipment?.itemId)).slice(0, 4),
      runeIds: uniqueStrings(runeEntries.map((entry) => entry?.runeId)).slice(0, 4),
    };
  }

  function buildArchiveSummary(profile) {
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const latestEntry = history[0] || null;
    const favoredTreeCounts = new Map();
    const getPlannedRunewordIds = (entry) =>
      uniqueStrings([entry?.plannedWeaponRunewordId, entry?.plannedArmorRunewordId]);
    const getCompletedPlannedRunewordIds = (entry) => uniqueStrings(entry?.completedPlannedRunewordIds);
    history.forEach((entry) => {
      if (!entry?.favoredTreeId) {
        return;
      }
      const existing = favoredTreeCounts.get(entry.favoredTreeId) || {
        count: 0,
        title: entry.favoredTreeName || entry.favoredTreeId,
      };
      existing.count += 1;
      if (entry.favoredTreeName) {
        existing.title = entry.favoredTreeName;
      }
      favoredTreeCounts.set(entry.favoredTreeId, existing);
    });
    const topFavoredTree = [...favoredTreeCounts.entries()].sort((left, right) => right[1].count - left[1].count)[0] || null;

    return {
      entryCount: history.length,
      completedCount: history.filter((entry) => entry?.outcome === "completed").length,
      failedCount: history.filter((entry) => entry?.outcome === "failed").length,
      abandonedCount: history.filter((entry) => entry?.outcome === "abandoned").length,
      latestClassId: latestEntry?.classId || "",
      latestClassName: latestEntry?.className || "",
      latestOutcome: latestEntry?.outcome || "",
      latestCompletedAt: latestEntry?.completedAt || "",
      highestLevel: history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.level, 0)), 0),
      highestActsCleared: history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
      highestGoldGained: history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.goldGained, 0)), 0),
      highestLoadoutTier: history.reduce((highest, entry) => Math.max(highest, toNumber(entry?.loadoutTier, 0)), 0),
      runewordArchiveCount: history.filter((entry) => Array.isArray(entry?.activeRunewordIds) && entry.activeRunewordIds.length > 0).length,
      featureUnlockCount: uniqueStrings(history.flatMap((entry) => entry?.newFeatureIds || [])).length,
      favoredTreeId: topFavoredTree?.[0] || "",
      favoredTreeName: topFavoredTree?.[1]?.title || "",
      planningArchiveCount: history.filter((entry) => {
        return toNumber(entry?.stashEntryCount, 0) > 0 || toNumber(entry?.carriedEquipmentCount, 0) > 0 || toNumber(entry?.carriedRuneCount, 0) > 0;
      }).length,
      planningCompletionCount: history.filter((entry) => getCompletedPlannedRunewordIds(entry).length > 0).length,
      planningMissCount: history.filter((entry) => {
        const plannedRunewordIds = getPlannedRunewordIds(entry);
        if (plannedRunewordIds.length === 0) {
          return false;
        }
        const completedPlannedRunewordIds = getCompletedPlannedRunewordIds(entry);
        return plannedRunewordIds.some((runewordId) => !completedPlannedRunewordIds.includes(runewordId));
      }).length,
      recentFeatureIds: uniqueStrings(history.slice(0, 4).flatMap((entry) => entry?.newFeatureIds || [])).slice(0, 6),
      recentPlannedRunewordIds: uniqueStrings(history.slice(0, 4).flatMap((entry) => getPlannedRunewordIds(entry))).slice(0, 6),
    };
  }

  function buildAccountReviewSummary(milestones, convergences = []) {
    const capstones = (Array.isArray(milestones) ? milestones : []).filter((milestone) => milestone?.isCapstone);
    const nextCapstone = capstones.find((milestone) => milestone.status === "available") || capstones.find((milestone) => !milestone.unlocked) || null;
    const convergenceEntries = Array.isArray(convergences) ? convergences : [];
    const nextConvergence =
      convergenceEntries.find((convergence) => convergence.status === "available") ||
      convergenceEntries.find((convergence) => !convergence.unlocked) ||
      null;
    return {
      capstoneCount: capstones.length,
      unlockedCapstoneCount: capstones.filter((milestone) => milestone.unlocked).length,
      blockedCapstoneCount: capstones.filter((milestone) => milestone.status === "locked").length,
      readyCapstoneCount: capstones.filter((milestone) => milestone.status === "available").length,
      nextCapstoneId: nextCapstone?.id || "",
      nextCapstoneTitle: nextCapstone?.title || "",
      convergenceCount: convergenceEntries.length,
      unlockedConvergenceCount: convergenceEntries.filter((convergence) => convergence.unlocked).length,
      blockedConvergenceCount: convergenceEntries.filter((convergence) => convergence.status === "locked").length,
      availableConvergenceCount: convergenceEntries.filter((convergence) => convergence.status === "available").length,
      nextConvergenceId: nextConvergence?.id || "",
      nextConvergenceTitle: nextConvergence?.title || "",
    };
  }

  function createDefaultPlanningOverview(): ProfilePlanningOverviewSummary {
    return {
      compatibleCharterCount: 0,
      preparedCharterCount: 0,
      readyCharterCount: 0,
      missingBaseCharterCount: 0,
      trackedBaseCount: 0,
      highestTrackedBaseTier: 0,
      compatibleRunewordIds: [],
      preparedRunewordIds: [],
      readyRunewordIds: [],
      missingBaseRunewordIds: [],
      nextAction: "idle",
      nextActionLabel: "Quiet",
      nextActionSummary: "No active runeword charter is pinned across the account.",
    };
  }

  function getPlanningRunewordLabel(runewordId, content = null) {
    return (content?.runewordCatalog?.[runewordId]?.name || runewordId || "").trim();
  }

  function getPlanningRunewordListLabel(runewordIds, content = null) {
    const labels = uniqueStrings((Array.isArray(runewordIds) ? runewordIds : []).map((runewordId) => getPlanningRunewordLabel(runewordId, content)));
    if (labels.length === 0) {
      return "no charter targets";
    }
    if (labels.length === 1) {
      return labels[0];
    }
    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }
    return `${labels.slice(0, 2).join(", ")}, +${labels.length - 2} more`;
  }

  function buildPlanningCharterSummary(profile, runewordId, slot, historySummary, content = null) {
    if (!runewordId) {
      return null;
    }

    const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG || null;
    const runeword =
      itemCatalog?.getRunewordDefinition?.(content, runewordId) ||
      (content?.runewordCatalog ? content.runewordCatalog[runewordId] || null : null);
    if (!runeword || runeword.slot !== slot) {
      return null;
    }

    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const compatibleBases = entries
      .filter((entry) => entry?.kind === "equipment" && entry?.equipment && !entry.equipment.runewordId)
      .map((entry) => {
        const equipment = entry.equipment;
        const item =
          itemCatalog?.getItemDefinition?.(content, equipment?.itemId || "") ||
          (content?.itemCatalog ? content.itemCatalog[equipment?.itemId || ""] || null : null);
        if (!item) {
          return null;
        }
        const compatible =
          itemCatalog?.isRunewordCompatibleWithEquipment?.(equipment, runeword, content) ||
          itemCatalog?.isRunewordCompatibleWithItem?.(item, runeword) ||
          false;
        if (!compatible) {
          return null;
        }
        return {
          equipment,
          item,
          socketsUnlocked: toNumber(equipment?.socketsUnlocked, 0),
          insertedRuneCount: Array.isArray(equipment?.insertedRunes) ? equipment.insertedRunes.length : 0,
        };
      })
      .filter(Boolean);

    const preparedBases = compatibleBases.filter((entry) => entry.socketsUnlocked > 0 || entry.insertedRuneCount > 0);
    const readyBases = compatibleBases.filter((entry) => entry.socketsUnlocked >= toNumber(runeword.socketCount, 0));
    const bestBase =
      compatibleBases
        .slice()
        .sort((left, right) => {
          const leftReady = Number(left.socketsUnlocked >= toNumber(runeword.socketCount, 0));
          const rightReady = Number(right.socketsUnlocked >= toNumber(runeword.socketCount, 0));
          if (leftReady !== rightReady) {
            return rightReady - leftReady;
          }
          if (toNumber(left.item?.progressionTier, 0) !== toNumber(right.item?.progressionTier, 0)) {
            return toNumber(right.item?.progressionTier, 0) - toNumber(left.item?.progressionTier, 0);
          }
          if (left.socketsUnlocked !== right.socketsUnlocked) {
            return right.socketsUnlocked - left.socketsUnlocked;
          }
          if (left.insertedRuneCount !== right.insertedRuneCount) {
            return right.insertedRuneCount - left.insertedRuneCount;
          }
          return String(left.item?.id || "").localeCompare(String(right.item?.id || ""));
        })
        .shift() || null;

    return {
      slot,
      runewordId,
      archivedRunCount: historySummary.archivedRunCount,
      completedRunCount: historySummary.completedRunCount,
      bestActsCleared: historySummary.bestActsCleared,
      requiredSocketCount: toNumber(runeword.socketCount, 0),
      compatibleBaseCount: compatibleBases.length,
      preparedBaseCount: preparedBases.length,
      readyBaseCount: readyBases.length,
      bestBaseItemId: bestBase?.item?.id || "",
      bestBaseTier: toNumber(bestBase?.item?.progressionTier, 0),
      bestBaseSocketsUnlocked: toNumber(bestBase?.socketsUnlocked, 0),
      bestBaseMaxSockets: toNumber(bestBase?.item?.maxSockets, 0),
      bestBaseInsertedRuneCount: toNumber(bestBase?.insertedRuneCount, 0),
      bestBaseMissingRuneCount: Math.max(0, toNumber(runeword.socketCount, 0) - toNumber(bestBase?.insertedRuneCount, 0)),
      hasReadyBase: readyBases.length > 0,
    };
  }

  function buildPlanningOverviewSummary(charters, content = null): ProfilePlanningOverviewSummary {
    const activeCharters = (Array.isArray(charters) ? charters : []).filter(Boolean);
    if (activeCharters.length === 0) {
      return createDefaultPlanningOverview();
    }

    const compatibleCharters = activeCharters.filter((charter) => charter.compatibleBaseCount > 0);
    const preparedCharters = activeCharters.filter((charter) => charter.preparedBaseCount > 0 && !charter.hasReadyBase);
    const readyCharters = activeCharters.filter((charter) => charter.hasReadyBase);
    const missingBaseCharters = activeCharters.filter((charter) => charter.compatibleBaseCount === 0);
    const compatibleRunewordIds = compatibleCharters.map((charter) => charter.runewordId);
    const preparedRunewordIds = preparedCharters.map((charter) => charter.runewordId);
    const readyRunewordIds = readyCharters.map((charter) => charter.runewordId);
    const missingBaseRunewordIds = missingBaseCharters.map((charter) => charter.runewordId);

    const overview: ProfilePlanningOverviewSummary = {
      compatibleCharterCount: compatibleCharters.length,
      preparedCharterCount: preparedCharters.length,
      readyCharterCount: readyCharters.length,
      missingBaseCharterCount: missingBaseCharters.length,
      trackedBaseCount: compatibleCharters.reduce((total, charter) => total + toNumber(charter.compatibleBaseCount, 0), 0),
      highestTrackedBaseTier: compatibleCharters.reduce((highest, charter) => Math.max(highest, toNumber(charter.bestBaseTier, 0)), 0),
      compatibleRunewordIds,
      preparedRunewordIds,
      readyRunewordIds,
      missingBaseRunewordIds,
      nextAction: "hunt_bases",
      nextActionLabel: "Hunt Bases",
      nextActionSummary: `Pinned charters still lack a compatible parked base: ${getPlanningRunewordListLabel(missingBaseRunewordIds, content)}.`,
    };

    if (readyRunewordIds.length > 0) {
      overview.nextAction = "stock_runes";
      overview.nextActionLabel = "Stock Runes";
      overview.nextActionSummary = `Ready base parked for ${getPlanningRunewordListLabel(readyRunewordIds, content)}. Prioritize rune depth before another replacement base.`;
      return overview;
    }

    if (preparedRunewordIds.length > 0) {
      overview.nextAction = "open_sockets";
      overview.nextActionLabel = "Open Sockets";
      overview.nextActionSummary = `Prepared base parked for ${getPlanningRunewordListLabel(preparedRunewordIds, content)}. Finish socket work before chasing more replacements.`;
      return overview;
    }

    if (compatibleRunewordIds.length > 0) {
      overview.nextAction = "prepare_bases";
      overview.nextActionLabel = "Prepare Bases";
      overview.nextActionSummary = `Compatible base parked for ${getPlanningRunewordListLabel(compatibleRunewordIds, content)}, but socket work has not started yet.`;
      return overview;
    }

    return overview;
  }

  function buildPlanningSummary(profile, content = null) {
    sanitizePlanningState(profile, content);
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const weaponRunewordId = typeof profile?.meta?.planning?.weaponRunewordId === "string" ? profile.meta.planning.weaponRunewordId : "";
    const armorRunewordId = typeof profile?.meta?.planning?.armorRunewordId === "string" ? profile.meta.planning.armorRunewordId : "";
    const summarizeRuneword = (runewordId, slotKey) => {
      if (!runewordId) {
        return {
          archivedRunCount: 0,
          completedRunCount: 0,
          bestActsCleared: 0,
        };
      }

      const archivedEntries = history.filter((entry) => entry?.[slotKey] === runewordId);
      const completedEntries = archivedEntries.filter((entry) => {
        return Array.isArray(entry?.completedPlannedRunewordIds) && entry.completedPlannedRunewordIds.includes(runewordId);
      });
      return {
        archivedRunCount: archivedEntries.length,
        completedRunCount: completedEntries.length,
        bestActsCleared: completedEntries.reduce((highest, entry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
      };
    };

    const weaponSummary = summarizeRuneword(weaponRunewordId, "plannedWeaponRunewordId");
    const armorSummary = summarizeRuneword(armorRunewordId, "plannedArmorRunewordId");
    const weaponCharter = buildPlanningCharterSummary(profile, weaponRunewordId, "weapon", weaponSummary, content);
    const armorCharter = buildPlanningCharterSummary(profile, armorRunewordId, "armor", armorSummary, content);
    return {
      weaponRunewordId,
      armorRunewordId,
      plannedRunewordCount: [weaponRunewordId, armorRunewordId].filter(Boolean).length,
      fulfilledPlanCount: Number(Boolean(weaponRunewordId) && weaponSummary.completedRunCount > 0) + Number(Boolean(armorRunewordId) && armorSummary.completedRunCount > 0),
      unfulfilledPlanCount: Number(Boolean(weaponRunewordId) && weaponSummary.completedRunCount === 0) + Number(Boolean(armorRunewordId) && armorSummary.completedRunCount === 0),
      weaponArchivedRunCount: weaponSummary.archivedRunCount,
      weaponCompletedRunCount: weaponSummary.completedRunCount,
      weaponBestActsCleared: weaponSummary.bestActsCleared,
      armorArchivedRunCount: armorSummary.archivedRunCount,
      armorCompletedRunCount: armorSummary.completedRunCount,
      armorBestActsCleared: armorSummary.bestActsCleared,
      overview: buildPlanningOverviewSummary([weaponCharter, armorCharter], content),
      weaponCharter,
      armorCharter,
    };
  }

  function getAccountProgressSummary(profile, content = null) {
    const source = profile || createEmptyProfile();
    ensureMeta(source, content);
    const profileSummary = getProfileSummary(source, content);
    const completedTutorialIds = source.meta.tutorials?.completedIds || [];
    const dismissedTutorialIds = source.meta.tutorials?.dismissedIds || [];
    const activeTutorialIds = (source.meta.tutorials?.seenIds || []).filter((tutorialId) => {
      return !completedTutorialIds.includes(tutorialId) && !dismissedTutorialIds.includes(tutorialId);
    });
    const trees = getAccountTreeSummaries(source);
    const milestones = trees.flatMap((tree) => tree.milestones);
    const convergences = getAccountConvergenceSummaries(source);
    const focusedTree = trees.find((tree) => tree.isFocused) || trees[0] || null;
    const nextMilestone = focusedTree?.milestones.find((milestone) => milestone.status === "available") || focusedTree?.milestones.find((milestone) => !milestone.unlocked) || milestones.find((milestone) => milestone.status === "available") || milestones.find((milestone) => !milestone.unlocked) || null;
    const stashSummary = buildStashSummary(source);
    const archiveSummary = buildArchiveSummary(source);
    const reviewSummary = buildAccountReviewSummary(milestones, convergences);
    const planningSummary = buildPlanningSummary(source, content);

    return {
      profile: profileSummary,
      settings: {
        ...source.meta.settings,
      },
      unlockedFeatureIds: [...(source.meta.unlocks?.townFeatureIds || [])],
      activeTutorialIds,
      dismissedTutorialCount: profileSummary.dismissedTutorialCount,
      planning: planningSummary,
      stash: stashSummary,
      archive: archiveSummary,
      review: reviewSummary,
      convergences,
      focusedTreeId: focusedTree?.id || "",
      focusedTreeTitle: focusedTree?.title || "",
      treeCount: trees.length,
      trees,
      runHistoryCapacity: getRunHistoryCapacity(source),
      nextMilestoneId: nextMilestone?.id || "",
      nextMilestoneTitle: nextMilestone?.title || "",
      unlockedMilestoneCount: milestones.filter((milestone) => milestone.unlocked).length,
      milestoneCount: milestones.length,
      milestones,
    };
  }

  function unlockProfileEntries(profile, category, ids) {
    ensureMeta(profile);
    const existing = Array.isArray(profile.meta.unlocks?.[category]) ? profile.meta.unlocks[category] : [];
    profile.meta.unlocks[category] = uniqueStrings([...existing, ...(Array.isArray(ids) ? ids : [])]);
    applyDerivedAccountUnlocks(profile);
  }

  function updateProfileSettings(profile, patch) {
    ensureMeta(profile);
    const nextSettings = patch && typeof patch === "object" ? patch : {};
    ["showHints", "reduceMotion", "compactMode"].forEach((settingKey) => {
      if (typeof nextSettings[settingKey] === "boolean") {
        profile.meta.settings[settingKey] = nextSettings[settingKey];
      }
    });
  }

  function setPreferredClass(profile, classId) {
    ensureMeta(profile);
    if (typeof classId !== "string") {
      return;
    }
    profile.meta.progression.preferredClassId = classId;
  }

  function setPlannedRuneword(profile, slot, runewordId, content = null) {
    ensureMeta(profile, content);
    if (slot !== "weapon" && slot !== "armor") {
      return;
    }
    const key = slot === "weapon" ? "weaponRunewordId" : "armorRunewordId";
    profile.meta.planning[key] = sanitizePlannedRunewordId(runewordId, slot, content);
  }

  function setAccountProgressionFocus(profile, treeId) {
    ensureMeta(profile);
    if (!ACCOUNT_PROGRESSION_TREES.some((tree) => tree.id === treeId)) {
      profile.meta.accountProgression.focusedTreeId = getDefaultFocusedTreeId(profile);
      return;
    }
    profile.meta.accountProgression.focusedTreeId = treeId;
  }

  function markTutorialSeen(profile, tutorialId) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    profile.meta.tutorials.seenIds = uniqueStrings([...(profile.meta.tutorials.seenIds || []), tutorialId]);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry) => entry !== tutorialId));
  }

  function markTutorialCompleted(profile, tutorialId) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    profile.meta.tutorials.completedIds = uniqueStrings([...(profile.meta.tutorials.completedIds || []), tutorialId]);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry) => entry !== tutorialId));
  }

  function dismissTutorial(profile, tutorialId) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    if ((profile.meta.tutorials?.completedIds || []).includes(tutorialId)) {
      profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry) => entry !== tutorialId));
      return;
    }
    profile.meta.tutorials.dismissedIds = uniqueStrings([...(profile.meta.tutorials.dismissedIds || []), tutorialId]);
  }

  function restoreTutorial(profile, tutorialId) {
    ensureMeta(profile);
    if (!tutorialId) {
      return;
    }
    markTutorialSeen(profile, tutorialId);
    profile.meta.tutorials.dismissedIds = uniqueStrings((profile.meta.tutorials.dismissedIds || []).filter((entry) => entry !== tutorialId));
  }

  function getWorldOutcomeCount(run) {
    return (
      Object.keys(run?.world?.questOutcomes || {}).length +
      Object.keys(run?.world?.shrineOutcomes || {}).length +
      Object.keys(run?.world?.eventOutcomes || {}).length +
      Object.keys(run?.world?.opportunityOutcomes || {}).length
    );
  }

  function getRunHistoryLoadoutMetrics(run, content) {
    const loadoutEntries = [run?.loadout?.weapon, run?.loadout?.armor].filter(Boolean);
    const carriedEntries = Array.isArray(run?.inventory?.carried) ? run.inventory.carried : [];
    return {
      loadoutTier: loadoutEntries.reduce((total, entry) => {
        return total + toNumber(content?.itemCatalog?.[entry.itemId]?.progressionTier, 0);
      }, 0),
      loadoutSockets: loadoutEntries.reduce((total, entry) => total + toNumber(entry?.socketsUnlocked, 0), 0),
      carriedEquipmentCount: carriedEntries.filter((entry) => entry?.kind === "equipment").length,
      carriedRuneCount: carriedEntries.filter((entry) => entry?.kind === "rune").length,
    };
  }

  function getProfileStashCounts(profile) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    return {
      stashEntryCount: entries.length,
      stashEquipmentCount: entries.filter((entry) => entry?.kind === "equipment").length,
      stashRuneCount: entries.filter((entry) => entry?.kind === "rune").length,
    };
  }

  function syncProfileMetaFromRun(profile, run) {
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
  }

  function buildRunHistoryEntry(profile, run, outcome, content, newFeatureIds = []) {
    const progressionSummary = content ? runtimeWindow.ROUGE_RUN_FACTORY?.getProgressionSummary?.(run, content) || null : null;
    const loadoutMetrics = getRunHistoryLoadoutMetrics(run, content);
    const stashCounts = getProfileStashCounts(profile);
    const plannedWeaponRunewordId = sanitizePlannedRunewordId(profile?.meta?.planning?.weaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(profile?.meta?.planning?.armorRunewordId, "armor", content);
    const activeRunewordIds = uniqueStrings(run?.progression?.activatedRunewords || []);
    const completedPlannedRunewordIds = uniqueStrings([plannedWeaponRunewordId, plannedArmorRunewordId].filter((runewordId) => activeRunewordIds.includes(runewordId)));
    return {
      runId: run.id,
      classId: run.classId,
      className: run.className,
      level: run.level,
      actsCleared: toNumber(run.summary?.actsCleared, 0),
      bossesDefeated: toNumber(run.summary?.bossesDefeated, 0),
      goldGained: toNumber(run.summary?.goldGained, 0),
      runewordsForged: toNumber(run.summary?.runewordsForged, 0),
      skillPointsEarned: toNumber(run.summary?.skillPointsEarned, 0),
      classPointsEarned: toNumber(run.summary?.classPointsEarned, 0),
      attributePointsEarned: toNumber(run.summary?.attributePointsEarned, 0),
      trainingRanksGained: toNumber(run.summary?.trainingRanksGained, 0),
      favoredTreeId: progressionSummary?.favoredTreeId || run?.progression?.classProgression?.favoredTreeId || "",
      favoredTreeName: progressionSummary?.favoredTreeName || "",
      unlockedClassSkills: progressionSummary?.unlockedClassSkills || (Array.isArray(run?.progression?.classProgression?.unlockedSkillIds) ? run.progression.classProgression.unlockedSkillIds.length : 0),
      loadoutTier: loadoutMetrics.loadoutTier,
      loadoutSockets: loadoutMetrics.loadoutSockets,
      carriedEquipmentCount: loadoutMetrics.carriedEquipmentCount,
      carriedRuneCount: loadoutMetrics.carriedRuneCount,
      stashEntryCount: stashCounts.stashEntryCount,
      stashEquipmentCount: stashCounts.stashEquipmentCount,
      stashRuneCount: stashCounts.stashRuneCount,
      plannedWeaponRunewordId,
      plannedArmorRunewordId,
      completedPlannedRunewordIds,
      activeRunewordIds,
      newFeatureIds: uniqueStrings(newFeatureIds),
      completedAt: new Date().toISOString(),
      outcome,
    };
  }

  function recordRunHistory(profile, run, outcome, content = null) {
    ensureMeta(profile);
    profile.runHistory = Array.isArray(profile.runHistory) ? profile.runHistory : [];
    const previousFeatureIds = uniqueStrings(profile.meta.unlocks?.townFeatureIds || []);
    syncProfileMetaFromRun(profile, run);
    profile.meta.progression.totalBossesDefeated =
      (Number.parseInt(String(profile.meta.progression.totalBossesDefeated || 0), 10) || 0) + (run?.summary?.bossesDefeated || 0);
    profile.meta.progression.totalGoldCollected =
      (Number.parseInt(String(profile.meta.progression.totalGoldCollected || 0), 10) || 0) + (run?.summary?.goldGained || 0);
    profile.meta.progression.totalRunewordsForged =
      (Number.parseInt(String(profile.meta.progression.totalRunewordsForged || 0), 10) || 0) + (run?.summary?.runewordsForged || 0);
    markTutorialCompleted(profile, "first_run_overview");
    const entry = buildRunHistoryEntry(profile, run, outcome, content);
    profile.runHistory.unshift(entry);
    applyDerivedAccountUnlocks(profile);
    profile.runHistory = profile.runHistory.slice(0, getRunHistoryCapacity(profile));
    entry.newFeatureIds = uniqueStrings((profile.meta.unlocks?.townFeatureIds || []).filter((featureId) => !previousFeatureIds.includes(featureId)));
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
