(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { CORE_TOWN_FEATURE_IDS } = runtimeWindow.__ROUGE_PROFILE_MIGRATIONS_DATA;

  const ACCOUNT_PROGRESSION_TREES = [
    {
      id: "archives",
      title: "Archive Discipline",
      description: "Turn archived expeditions into a deeper account memory seam.",
      nodes: [
        { id: "archive_ledger", title: "Archive Ledger", description: "Archive your first expedition.", rewardFeatureId: "archive_ledger", tier: 1, prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "chronicle_vault", title: "Chronicle Vault", description: "Archive four expeditions to widen the retained account ledger.", rewardFeatureId: "chronicle_vault", tier: 2, prerequisiteIds: ["archive_ledger"], target: 4, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "heroic_annals", title: "Heroic Annals", description: "Complete two expeditions to deepen the long-form account chronicle.", rewardFeatureId: "heroic_annals", tier: 2, prerequisiteIds: ["archive_ledger"], target: 2, getProgress: (metrics: Record<string, number>) => metrics.completedRuns },
        { id: "mythic_annals", title: "Mythic Annals", description: "Archive six expeditions to preserve a deeper long-horizon account record.", rewardFeatureId: "mythic_annals", tier: 3, prerequisiteIds: ["chronicle_vault"], target: 6, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "eternal_annals", title: "Eternal Annals", description: "Complete four expeditions after establishing Mythic Annals to unlock comparison-grade archive review.", rewardFeatureId: "eternal_annals", tier: 4, isCapstone: true, prerequisiteIds: ["heroic_annals", "mythic_annals"], target: 4, getProgress: (metrics: Record<string, number>) => metrics.completedRuns },
        { id: "sovereign_annals", title: "Sovereign Annals", description: "Archive eight expeditions after Eternal Annals to turn the ledger into a sovereign long-horizon archive.", rewardFeatureId: "sovereign_annals", tier: 5, isCapstone: true, prerequisiteIds: ["eternal_annals"], target: 8, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
        { id: "imperial_annals", title: "Imperial Annals", description: "Archive ten expeditions after Sovereign Annals to preserve an imperial-scale long-horizon ledger.", rewardFeatureId: "imperial_annals", tier: 6, isCapstone: true, prerequisiteIds: ["sovereign_annals"], target: 10, getProgress: (metrics: Record<string, number>) => metrics.runHistoryCount },
      ],
    },
    {
      id: "economy",
      title: "Trade Network",
      description: "Grow the long-horizon town economy beyond one-off vendor perks.",
      nodes: [
        { id: "advanced_vendor_stock", title: "Advanced Vendor Stock", description: "Clear through Act III to unlock deeper town economy support.", rewardFeatureId: "advanced_vendor_stock", tier: 1, prerequisiteIds: [], target: 3, getProgress: (metrics: Record<string, number>) => metrics.highestActCleared },
        { id: "runeword_codex", title: "Runeword Codex", description: "Forge and archive your first runeword.", rewardFeatureId: "runeword_codex", tier: 1, prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.unlockedRunewordCount },
        { id: "economy_ledger", title: "Economy Ledger", description: "Collect 500 total gold across archived expeditions.", rewardFeatureId: "economy_ledger", tier: 2, prerequisiteIds: ["advanced_vendor_stock"], target: 500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "salvage_tithes", title: "Salvage Tithes", description: "Collect 1200 total gold to deepen buy or sell leverage across the account.", rewardFeatureId: "salvage_tithes", tier: 2, prerequisiteIds: ["economy_ledger"], target: 1200, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "artisan_stock", title: "Artisan Stock", description: "Clear through Act V to bias late vendors toward socket-ready endgame stock.", rewardFeatureId: "artisan_stock", tier: 3, prerequisiteIds: ["advanced_vendor_stock"], target: 5, getProgress: (metrics: Record<string, number>) => metrics.highestActCleared },
        { id: "brokerage_charter", title: "Brokerage Charter", description: "Collect 2500 total gold to widen late-account trade leverage and vendor depth.", rewardFeatureId: "brokerage_charter", tier: 3, prerequisiteIds: ["salvage_tithes"], target: 2500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "treasury_exchange", title: "Treasury Exchange", description: "Collect 4000 total gold after late-act trade expansion to unlock deeper stash planning and premium market leverage.", rewardFeatureId: "treasury_exchange", tier: 4, isCapstone: true, prerequisiteIds: ["artisan_stock", "brokerage_charter"], target: 4000, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "merchant_principate", title: "Merchant Principate", description: "Collect 6500 total gold after Treasury Exchange to open a sovereign late-market lane across the account.", rewardFeatureId: "merchant_principate", tier: 5, isCapstone: true, prerequisiteIds: ["treasury_exchange"], target: 6500, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
        { id: "trade_hegemony", title: "Trade Hegemony", description: "Collect 9000 total gold after Merchant Principate to turn late-account trade into a hegemonic market lane.", rewardFeatureId: "trade_hegemony", tier: 6, isCapstone: true, prerequisiteIds: ["merchant_principate"], target: 9000, getProgress: (metrics: Record<string, number>) => metrics.totalGoldCollected },
      ],
    },
    {
      id: "mastery",
      title: "Mastery Hall",
      description: "Turn class breadth and boss trophies into stronger build pivots.",
      nodes: [
        { id: "boss_trophy_gallery", title: "Boss Trophy Gallery", description: "Defeat and archive your first boss trophy.", rewardFeatureId: "boss_trophy_gallery", tier: 1, prerequisiteIds: [], target: 1, getProgress: (metrics: Record<string, number>) => metrics.unlockedBossCount },
        { id: "class_roster_archive", title: "Class Roster Archive", description: "Play three different classes across the account.", rewardFeatureId: "class_roster_archive", tier: 1, prerequisiteIds: [], target: 3, getProgress: (metrics: Record<string, number>) => metrics.classesPlayedCount },
        { id: "training_grounds", title: "Training Grounds", description: "Reach level 10 on the account to unlock stronger progression pivots.", rewardFeatureId: "training_grounds", tier: 2, prerequisiteIds: ["class_roster_archive"], target: 10, getProgress: (metrics: Record<string, number>) => metrics.highestLevel },
        { id: "horadric_cube", title: "Horadric Cube", description: "Reach level 8 to unlock the Horadric Cube for transmutation.", rewardFeatureId: "horadric_cube", tier: 2, prerequisiteIds: ["boss_trophy_gallery"], target: 8, getProgress: (metrics: Record<string, number>) => metrics.highestLevel },
        { id: "war_college", title: "War College", description: "Defeat five bosses across the account to sharpen late-run build pivots.", rewardFeatureId: "war_college", tier: 3, prerequisiteIds: ["boss_trophy_gallery", "training_grounds"], target: 5, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "paragon_doctrine", title: "Paragon Doctrine", description: "Defeat eight bosses across the account to codify stronger late-act mastery pivots.", rewardFeatureId: "paragon_doctrine", tier: 3, prerequisiteIds: ["war_college"], target: 8, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "apex_doctrine", title: "Apex Doctrine", description: "Defeat twelve bosses after codifying Paragon Doctrine to unlock apex late-act mastery pivots.", rewardFeatureId: "apex_doctrine", tier: 4, isCapstone: true, prerequisiteIds: ["war_college", "paragon_doctrine"], target: 12, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "legend_doctrine", title: "Legend Doctrine", description: "Defeat sixteen bosses after Apex Doctrine to codify a second-wave mastery summit for late-act pivots.", rewardFeatureId: "legend_doctrine", tier: 5, isCapstone: true, prerequisiteIds: ["apex_doctrine"], target: 16, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
        { id: "mythic_doctrine", title: "Mythic Doctrine", description: "Defeat twenty bosses after Legend Doctrine to codify a mythic mastery summit for the strongest late-act pivots.", rewardFeatureId: "mythic_doctrine", tier: 6, isCapstone: true, prerequisiteIds: ["legend_doctrine"], target: 20, getProgress: (metrics: Record<string, number>) => metrics.totalBossesDefeated },
      ],
    },
  ];

  const ACCOUNT_CONVERGENCES = [
    { id: "chronicle_exchange", title: "Chronicle Exchange", description: "Bind Eternal Annals to Treasury Exchange so archive memory turns into premium trade leverage.", rewardFeatureId: "chronicle_exchange", effectSummary: "Deepens archive retention, refresh leverage, and stash-planning pressure in town.", requiredFeatureIds: ["eternal_annals", "treasury_exchange"] },
    { id: "war_annals", title: "War Annals", description: "Bind Eternal Annals to Apex Doctrine so archived expeditions sharpen late-act mastery pivots.", rewardFeatureId: "war_annals", effectSummary: "Adds archive-backed weight to late-act boss and miniboss progression rewards.", requiredFeatureIds: ["eternal_annals", "apex_doctrine"] },
    { id: "paragon_exchange", title: "Paragon Exchange", description: "Bind Treasury Exchange to Apex Doctrine so peak trade leverage and mastery doctrine demand premium replacements.", rewardFeatureId: "paragon_exchange", effectSummary: "Pushes late-act vendors and equipment rewards toward premium socket-ready pivots.", requiredFeatureIds: ["treasury_exchange", "apex_doctrine"] },
    { id: "sovereign_exchange", title: "Sovereign Exchange", description: "Bind Sovereign Annals to Merchant Principate so archived depth and sovereign trade both reinforce late-market planning.", rewardFeatureId: "sovereign_exchange", effectSummary: "Deepens archive retention and late-act vendor leverage around stash-planning pressure.", requiredFeatureIds: ["sovereign_annals", "merchant_principate"] },
    { id: "legendary_annals", title: "Legendary Annals", description: "Bind Sovereign Annals to Legend Doctrine so long-form archive memory reinforces the next mastery summit.", rewardFeatureId: "legendary_annals", effectSummary: "Adds another archive-backed layer to late-act mastery and boss progression pivots.", requiredFeatureIds: ["sovereign_annals", "legend_doctrine"] },
    { id: "ascendant_exchange", title: "Ascendant Exchange", description: "Bind Merchant Principate to Legend Doctrine so sovereign trade and late mastery demand premium Act V replacements.", rewardFeatureId: "ascendant_exchange", effectSummary: "Pushes premium Act V vendors and equipment rewards toward the strongest staged replacements.", requiredFeatureIds: ["merchant_principate", "legend_doctrine"] },
    { id: "imperial_exchange", title: "Imperial Exchange", description: "Bind Imperial Annals to Trade Hegemony so imperial archive depth and hegemonic trade reinforce long-horizon stash planning.", rewardFeatureId: "imperial_exchange", effectSummary: "Deepens archive retention, late-market leverage, and rune-routing pressure around staged charter bases.", requiredFeatureIds: ["imperial_annals", "trade_hegemony"] },
    { id: "immortal_annals", title: "Immortal Annals", description: "Bind Imperial Annals to Mythic Doctrine so the deepest archive memory reinforces the mythic mastery summit.", rewardFeatureId: "immortal_annals", effectSummary: "Adds another archive-backed layer to late-act mastery and boss progression pivots.", requiredFeatureIds: ["imperial_annals", "mythic_doctrine"] },
    { id: "mythic_exchange", title: "Mythic Exchange", description: "Bind Trade Hegemony to Mythic Doctrine so hegemonic trade and mythic mastery demand the strongest staged replacements.", rewardFeatureId: "mythic_exchange", effectSummary: "Pushes late-act vendors and equipment rewards toward mythic four-socket replacement pivots.", requiredFeatureIds: ["trade_hegemony", "mythic_doctrine"] },
  ];

  runtimeWindow.__ROUGE_PERSISTENCE_CORE_DATA = {
    CORE_TOWN_FEATURE_IDS,
    ACCOUNT_PROGRESSION_TREES,
    ACCOUNT_CONVERGENCES,
  };
})();
