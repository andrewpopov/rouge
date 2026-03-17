/* eslint-disable @typescript-eslint/no-explicit-any -- migration code transforms arbitrary legacy data */
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
        { id: "archive_ledger", rewardFeatureId: "archive_ledger", prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "chronicle_vault", rewardFeatureId: "chronicle_vault", prerequisiteIds: ["archive_ledger"], target: 4, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "heroic_annals", rewardFeatureId: "heroic_annals", prerequisiteIds: ["archive_ledger"], target: 2, getProgress: (metrics: Record<string, number>) => metrics.completedRuns },
        { id: "mythic_annals", rewardFeatureId: "mythic_annals", prerequisiteIds: ["chronicle_vault"], target: 6, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "eternal_annals", rewardFeatureId: "eternal_annals", prerequisiteIds: ["heroic_annals", "mythic_annals"], target: 4, getProgress: (metrics: Record<string, number>) => metrics.completedRuns },
        { id: "sovereign_annals", rewardFeatureId: "sovereign_annals", prerequisiteIds: ["eternal_annals"], target: 8, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "imperial_annals", rewardFeatureId: "imperial_annals", prerequisiteIds: ["sovereign_annals"], target: 10, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
      ],
    },
    {
      id: "economy",
      nodes: [
        { id: "advanced_vendor_stock", rewardFeatureId: "advanced_vendor_stock", prerequisiteIds: [], target: 3, getProgress: (metrics: Record<string, number>) => metrics.highestActCleared },
        { id: "runeword_codex", rewardFeatureId: "runeword_codex", prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.unlockedRunewordCount },
        { id: "economy_ledger", rewardFeatureId: "economy_ledger", prerequisiteIds: ["advanced_vendor_stock"], target: 500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "salvage_tithes", rewardFeatureId: "salvage_tithes", prerequisiteIds: ["economy_ledger"], target: 1200, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "artisan_stock", rewardFeatureId: "artisan_stock", prerequisiteIds: ["advanced_vendor_stock"], target: 5, getProgress: (metrics: Record<string, number>) => metrics.highestActCleared },
        { id: "brokerage_charter", rewardFeatureId: "brokerage_charter", prerequisiteIds: ["salvage_tithes"], target: 2500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "treasury_exchange", rewardFeatureId: "treasury_exchange", prerequisiteIds: ["artisan_stock", "brokerage_charter"], target: 4000, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "merchant_principate", rewardFeatureId: "merchant_principate", prerequisiteIds: ["treasury_exchange"], target: 6500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "trade_hegemony", rewardFeatureId: "trade_hegemony", prerequisiteIds: ["merchant_principate"], target: 9000, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
      ],
    },
    {
      id: "mastery",
      nodes: [
        { id: "boss_trophy_gallery", rewardFeatureId: "boss_trophy_gallery", prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.unlockedBossCount },
        { id: "class_roster_archive", rewardFeatureId: "class_roster_archive", prerequisiteIds: [], target: 3, getProgress: (metrics: Record<string, number>) => metrics.classesPlayedCount },
        { id: "training_grounds", rewardFeatureId: "training_grounds", prerequisiteIds: ["class_roster_archive"], target: 10, getProgress: (metrics: Record<string, number>) => metrics.highestLevel },
        { id: "war_college", rewardFeatureId: "war_college", prerequisiteIds: ["boss_trophy_gallery", "training_grounds"], target: 5, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "paragon_doctrine", rewardFeatureId: "paragon_doctrine", prerequisiteIds: ["war_college"], target: 8, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "apex_doctrine", rewardFeatureId: "apex_doctrine", prerequisiteIds: ["war_college", "paragon_doctrine"], target: 12, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "legend_doctrine", rewardFeatureId: "legend_doctrine", prerequisiteIds: ["apex_doctrine"], target: 16, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "mythic_doctrine", rewardFeatureId: "mythic_doctrine", prerequisiteIds: ["legend_doctrine"], target: 20, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
      ],
    },
  ];
  const ACCOUNT_CONVERGENCES = [
    { id: "chronicle_exchange", rewardFeatureId: "chronicle_exchange", requiredFeatureIds: ["eternal_annals", "treasury_exchange"] },
    { id: "war_annals", rewardFeatureId: "war_annals", requiredFeatureIds: ["eternal_annals", "apex_doctrine"] },
    { id: "paragon_exchange", rewardFeatureId: "paragon_exchange", requiredFeatureIds: ["treasury_exchange", "apex_doctrine"] },
    { id: "sovereign_exchange", rewardFeatureId: "sovereign_exchange", requiredFeatureIds: ["sovereign_annals", "merchant_principate"] },
    { id: "legendary_annals", rewardFeatureId: "legendary_annals", requiredFeatureIds: ["sovereign_annals", "legend_doctrine"] },
    { id: "ascendant_exchange", rewardFeatureId: "ascendant_exchange", requiredFeatureIds: ["merchant_principate", "legend_doctrine"] },
    { id: "imperial_exchange", rewardFeatureId: "imperial_exchange", requiredFeatureIds: ["imperial_annals", "trade_hegemony"] },
    { id: "immortal_annals", rewardFeatureId: "immortal_annals", requiredFeatureIds: ["imperial_annals", "mythic_doctrine"] },
    { id: "mythic_exchange", rewardFeatureId: "mythic_exchange", requiredFeatureIds: ["trade_hegemony", "mythic_doctrine"] },
  ];

  const { deepClone, toNumber, uniqueStrings } = runtimeWindow.ROUGE_UTILS;

  function isObject(value: unknown) {
    return Boolean(value) && typeof value === "object";
  }

  function sanitizePlannedRunewordId(runewordId: unknown, slot: string, content: GameContent | null = null) {
    if (typeof runewordId !== "string" || !runewordId) {
      return "";
    }
    if (!content?.runewordCatalog) {
      return runewordId;
    }
    const runeword = content.runewordCatalog[runewordId] || null;
    return runeword?.slot === slot ? runeword.id : "";
  }

  function sanitizeHistoryPlanningEntry(entry: RunHistoryEntry, content: GameContent | null = null) {
    if (!entry || !content?.runewordCatalog) {
      return entry;
    }

    const plannedWeaponRunewordId = sanitizePlannedRunewordId(entry.plannedWeaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(entry.plannedArmorRunewordId, "armor", content);
    const allowedRunewordIds = new Set([plannedWeaponRunewordId, plannedArmorRunewordId].filter(Boolean));
    entry.plannedWeaponRunewordId = plannedWeaponRunewordId;
    entry.plannedArmorRunewordId = plannedArmorRunewordId;
    entry.completedPlannedRunewordIds = uniqueStrings((entry.completedPlannedRunewordIds || []).filter((runewordId: string) => allowedRunewordIds.has(runewordId)));
    return entry;
  }

  function ensureHistoryEntry(entry: unknown, content: GameContent | null = null) {
    if (!isObject(entry)) {
      return null;
    }

    const source = entry as Record<string, any>;
    const outcome = typeof source.outcome === "string" ? source.outcome : "abandoned";
    return sanitizeHistoryPlanningEntry({
      runId: typeof source.runId === "string" ? source.runId : "",
      classId: typeof source.classId === "string" ? source.classId : "",
      className: typeof source.className === "string" ? source.className : "",
      level: Number.parseInt(String(source.level || 1), 10) || 1,
      actsCleared: Number.parseInt(String(source.actsCleared || 0), 10) || 0,
      bossesDefeated: Number.parseInt(String(source.bossesDefeated || 0), 10) || 0,
      goldGained: Number.parseInt(String(source.goldGained || 0), 10) || 0,
      runewordsForged: Number.parseInt(String(source.runewordsForged || 0), 10) || 0,
      skillPointsEarned: Number.parseInt(String(source.skillPointsEarned || 0), 10) || 0,
      classPointsEarned: Number.parseInt(String(source.classPointsEarned || 0), 10) || 0,
      attributePointsEarned: Number.parseInt(String(source.attributePointsEarned || 0), 10) || 0,
      trainingRanksGained: Number.parseInt(String(source.trainingRanksGained || 0), 10) || 0,
      favoredTreeId: typeof source.favoredTreeId === "string" ? source.favoredTreeId : "",
      favoredTreeName: typeof source.favoredTreeName === "string" ? source.favoredTreeName : "",
      unlockedClassSkills: Number.parseInt(String(source.unlockedClassSkills || 0), 10) || 0,
      loadoutTier: Number.parseInt(String(source.loadoutTier || 0), 10) || 0,
      loadoutSockets: Number.parseInt(String(source.loadoutSockets || 0), 10) || 0,
      carriedEquipmentCount: Number.parseInt(String(source.carriedEquipmentCount || 0), 10) || 0,
      carriedRuneCount: Number.parseInt(String(source.carriedRuneCount || 0), 10) || 0,
      stashEntryCount: Number.parseInt(String(source.stashEntryCount || 0), 10) || 0,
      stashEquipmentCount: Number.parseInt(String(source.stashEquipmentCount || 0), 10) || 0,
      stashRuneCount: Number.parseInt(String(source.stashRuneCount || 0), 10) || 0,
      plannedWeaponRunewordId: typeof source.plannedWeaponRunewordId === "string" ? source.plannedWeaponRunewordId : "",
      plannedArmorRunewordId: typeof source.plannedArmorRunewordId === "string" ? source.plannedArmorRunewordId : "",
      completedPlannedRunewordIds: uniqueStrings(source.completedPlannedRunewordIds),
      activeRunewordIds: uniqueStrings(source.activeRunewordIds),
      newFeatureIds: uniqueStrings(source.newFeatureIds),
      completedAt: typeof source.completedAt === "string" ? source.completedAt : new Date(0).toISOString(),
      outcome: outcome === "completed" || outcome === "failed" || outcome === "abandoned" ? outcome : "abandoned",
    }, content);
  }

  runtimeWindow.__ROUGE_PROFILE_MIGRATIONS_DATA = {
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
  };
})();
