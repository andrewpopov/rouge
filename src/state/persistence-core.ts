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
        {
          id: "sovereign_annals",
          title: "Sovereign Annals",
          description: "Archive eight expeditions after Eternal Annals to turn the ledger into a sovereign long-horizon archive.",
          rewardFeatureId: "sovereign_annals",
          tier: 5,
          isCapstone: true,
          prerequisiteIds: ["eternal_annals"],
          target: 8,
          getProgress: (metrics) => metrics.runHistoryCount,
        },
        {
          id: "imperial_annals",
          title: "Imperial Annals",
          description: "Archive ten expeditions after Sovereign Annals to preserve an imperial-scale long-horizon ledger.",
          rewardFeatureId: "imperial_annals",
          tier: 6,
          isCapstone: true,
          prerequisiteIds: ["sovereign_annals"],
          target: 10,
          getProgress: (metrics) => metrics.runHistoryCount,
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
        {
          id: "merchant_principate",
          title: "Merchant Principate",
          description: "Collect 6500 total gold after Treasury Exchange to open a sovereign late-market lane across the account.",
          rewardFeatureId: "merchant_principate",
          tier: 5,
          isCapstone: true,
          prerequisiteIds: ["treasury_exchange"],
          target: 6500,
          getProgress: (metrics) => metrics.totalGoldCollected,
        },
        {
          id: "trade_hegemony",
          title: "Trade Hegemony",
          description: "Collect 9000 total gold after Merchant Principate to turn late-account trade into a hegemonic market lane.",
          rewardFeatureId: "trade_hegemony",
          tier: 6,
          isCapstone: true,
          prerequisiteIds: ["merchant_principate"],
          target: 9000,
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
        {
          id: "legend_doctrine",
          title: "Legend Doctrine",
          description: "Defeat sixteen bosses after Apex Doctrine to codify a second-wave mastery summit for late-act pivots.",
          rewardFeatureId: "legend_doctrine",
          tier: 5,
          isCapstone: true,
          prerequisiteIds: ["apex_doctrine"],
          target: 16,
          getProgress: (metrics) => metrics.totalBossesDefeated,
        },
        {
          id: "mythic_doctrine",
          title: "Mythic Doctrine",
          description: "Defeat twenty bosses after Legend Doctrine to codify a mythic mastery summit for the strongest late-act pivots.",
          rewardFeatureId: "mythic_doctrine",
          tier: 6,
          isCapstone: true,
          prerequisiteIds: ["legend_doctrine"],
          target: 20,
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
    {
      id: "sovereign_exchange",
      title: "Sovereign Exchange",
      description: "Bind Sovereign Annals to Merchant Principate so archived depth and sovereign trade both reinforce late-market planning.",
      rewardFeatureId: "sovereign_exchange",
      effectSummary: "Deepens archive retention and late-act vendor leverage around stash-planning pressure.",
      requiredFeatureIds: ["sovereign_annals", "merchant_principate"],
    },
    {
      id: "legendary_annals",
      title: "Legendary Annals",
      description: "Bind Sovereign Annals to Legend Doctrine so long-form archive memory reinforces the next mastery summit.",
      rewardFeatureId: "legendary_annals",
      effectSummary: "Adds another archive-backed layer to late-act mastery and boss progression pivots.",
      requiredFeatureIds: ["sovereign_annals", "legend_doctrine"],
    },
    {
      id: "ascendant_exchange",
      title: "Ascendant Exchange",
      description: "Bind Merchant Principate to Legend Doctrine so sovereign trade and late mastery demand premium Act V replacements.",
      rewardFeatureId: "ascendant_exchange",
      effectSummary: "Pushes premium Act V vendors and equipment rewards toward the strongest staged replacements.",
      requiredFeatureIds: ["merchant_principate", "legend_doctrine"],
    },
    {
      id: "imperial_exchange",
      title: "Imperial Exchange",
      description: "Bind Imperial Annals to Trade Hegemony so imperial archive depth and hegemonic trade reinforce long-horizon stash planning.",
      rewardFeatureId: "imperial_exchange",
      effectSummary: "Deepens archive retention, late-market leverage, and rune-routing pressure around staged charter bases.",
      requiredFeatureIds: ["imperial_annals", "trade_hegemony"],
    },
    {
      id: "immortal_annals",
      title: "Immortal Annals",
      description: "Bind Imperial Annals to Mythic Doctrine so the deepest archive memory reinforces the mythic mastery summit.",
      rewardFeatureId: "immortal_annals",
      effectSummary: "Adds another archive-backed layer to late-act mastery and boss progression pivots.",
      requiredFeatureIds: ["imperial_annals", "mythic_doctrine"],
    },
    {
      id: "mythic_exchange",
      title: "Mythic Exchange",
      description: "Bind Trade Hegemony to Mythic Doctrine so hegemonic trade and mythic mastery demand the strongest staged replacements.",
      rewardFeatureId: "mythic_exchange",
      effectSummary: "Pushes late-act vendors and equipment rewards toward mythic four-socket replacement pivots.",
      requiredFeatureIds: ["trade_hegemony", "mythic_doctrine"],
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
        debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false },
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
