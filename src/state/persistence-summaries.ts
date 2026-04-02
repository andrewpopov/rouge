(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { RUN_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    uniqueStrings,
    toNumber,
    sanitizePlannedRunewordId,
    createEmptyProfile,
    buildProfileMetrics,
    ensureMeta,
    getAccountTreeSummaries,
    getAccountConvergenceSummaries,
    getRunHistoryCapacity,
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE;

  const {
    buildPlanningSummary,
  } = runtimeWindow.__ROUGE_PERSISTENCE_PLANNING;

  function getProfileSummary(profile: ProfileState | null, content: GameContent | null = null) {
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

  function buildStashSummary(profile: ProfileState | null) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const equipmentEntries = entries.filter((entry: InventoryEntry) => entry?.kind === "equipment");
    const runeEntries = entries.filter((entry: InventoryEntry) => entry?.kind === "rune");
    return {
      entryCount: entries.length,
      equipmentCount: equipmentEntries.length,
      runeCount: runeEntries.length,
      socketReadyEquipmentCount: equipmentEntries.filter((entry: InventoryEntry) => toNumber((entry as InventoryEquipmentEntry)?.equipment?.socketsUnlocked, 0) > 0).length,
      socketedRuneCount: equipmentEntries.reduce((total: number, entry: InventoryEntry) => total + toNumber((entry as InventoryEquipmentEntry)?.equipment?.insertedRunes?.length, 0), 0),
      runewordEquipmentCount: equipmentEntries.filter((entry: InventoryEntry) => (entry as InventoryEquipmentEntry)?.equipment?.runewordId).length,
      itemIds: uniqueStrings(equipmentEntries.map((entry: InventoryEntry) => (entry as InventoryEquipmentEntry)?.equipment?.itemId)).slice(0, runtimeWindow.ROUGE_LIMITS.STASH_PREVIEW_IDS),
      runeIds: uniqueStrings(runeEntries.map((entry: InventoryEntry) => (entry as InventoryRuneEntry)?.runeId)).slice(0, runtimeWindow.ROUGE_LIMITS.STASH_PREVIEW_IDS),
    };
  }

  function buildArchiveSummary(profile: ProfileState | null) {
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const latestEntry = history[0] || null;
    const favoredTreeCounts = new Map();
    const getPlannedRunewordIds = (entry: RunHistoryEntry) =>
      uniqueStrings([entry?.plannedWeaponRunewordId, entry?.plannedArmorRunewordId]);
    const getCompletedPlannedRunewordIds = (entry: RunHistoryEntry) => uniqueStrings(entry?.completedPlannedRunewordIds);
    history.forEach((entry: RunHistoryEntry) => {
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
    const topFavoredTree = [...favoredTreeCounts.entries()].sort((left: [string, { count: number; title: string }], right: [string, { count: number; title: string }]) => right[1].count - left[1].count)[0] || null;

    return {
      entryCount: history.length,
      completedCount: history.filter((entry: RunHistoryEntry) => entry?.outcome === RUN_OUTCOME.COMPLETED).length,
      failedCount: history.filter((entry: RunHistoryEntry) => entry?.outcome === RUN_OUTCOME.FAILED).length,
      abandonedCount: history.filter((entry: RunHistoryEntry) => entry?.outcome === RUN_OUTCOME.ABANDONED).length,
      latestClassId: latestEntry?.classId || "",
      latestClassName: latestEntry?.className || "",
      latestOutcome: (latestEntry?.outcome || "") as ProfileArchiveSummary["latestOutcome"],
      latestCompletedAt: latestEntry?.completedAt || "",
      highestLevel: history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.level, 0)), 0),
      highestActsCleared: history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
      highestGoldGained: history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.goldGained, 0)), 0),
      highestLoadoutTier: history.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.loadoutTier, 0)), 0),
      runewordArchiveCount: history.filter((entry: RunHistoryEntry) => Array.isArray(entry?.activeRunewordIds) && entry.activeRunewordIds.length > 0).length,
      featureUnlockCount: uniqueStrings(history.flatMap((entry: RunHistoryEntry) => entry?.newFeatureIds || [])).length,
      favoredTreeId: topFavoredTree?.[0] || "",
      favoredTreeName: topFavoredTree?.[1]?.title || "",
      planningArchiveCount: history.filter((entry: RunHistoryEntry) => {
        return toNumber(entry?.stashEntryCount, 0) > 0 || toNumber(entry?.carriedEquipmentCount, 0) > 0 || toNumber(entry?.carriedRuneCount, 0) > 0;
      }).length,
      planningCompletionCount: history.filter((entry: RunHistoryEntry) => getCompletedPlannedRunewordIds(entry).length > 0).length,
      planningMissCount: history.filter((entry: RunHistoryEntry) => {
        const plannedRunewordIds = getPlannedRunewordIds(entry);
        if (plannedRunewordIds.length === 0) {
          return false;
        }
        const completedPlannedRunewordIds = getCompletedPlannedRunewordIds(entry);
        return plannedRunewordIds.some((runewordId: string) => !completedPlannedRunewordIds.includes(runewordId));
      }).length,
      recentFeatureIds: uniqueStrings(history.slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_RUNS_SCAN).flatMap((entry: RunHistoryEntry) => entry?.newFeatureIds || [])).slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_FEATURE_IDS),
      recentPlannedRunewordIds: uniqueStrings(history.slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_RUNS_SCAN).flatMap((entry: RunHistoryEntry) => getPlannedRunewordIds(entry))).slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_RUNEWORD_IDS),
    };
  }

  function buildAccountReviewSummary(milestones: ProfileAccountMilestoneSummary[], convergences: ProfileAccountConvergenceSummary[] = []) {
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

  function getAccountProgressSummary(profile: ProfileState | null, content: GameContent | null = null): ProfileAccountSummary {
    const source = profile || createEmptyProfile();
    ensureMeta(source, content);
    const profileSummary = getProfileSummary(source, content);
    const completedTutorialIds = source.meta.tutorials?.completedIds || [];
    const dismissedTutorialIds = source.meta.tutorials?.dismissedIds || [];
    const activeTutorialIds = (source.meta.tutorials?.seenIds || []).filter((tutorialId: string) => {
      return !completedTutorialIds.includes(tutorialId) && !dismissedTutorialIds.includes(tutorialId);
    });
    const trees = getAccountTreeSummaries(source);
    const milestones = trees.flatMap((tree: ProfileAccountTreeSummary) => tree.milestones);
    const convergences = getAccountConvergenceSummaries(source);
    const focusedTree = trees.find((tree: ProfileAccountTreeSummary) => tree.isFocused) || trees[0] || null;
    const nextMilestone = focusedTree?.milestones.find((milestone: ProfileAccountMilestoneSummary) => milestone.status === "available") || focusedTree?.milestones.find((milestone: ProfileAccountMilestoneSummary) => !milestone.unlocked) || milestones.find((milestone: ProfileAccountMilestoneSummary) => milestone.status === "available") || milestones.find((milestone: ProfileAccountMilestoneSummary) => !milestone.unlocked) || null;
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
      unlockedMilestoneCount: milestones.filter((milestone: ProfileAccountMilestoneSummary) => milestone.unlocked).length,
      milestoneCount: milestones.length,
      milestones,
    };
  }

  function getRunHistoryLoadoutMetrics(run: RunState, content: GameContent) {
    const loadoutEntries = [run?.loadout?.weapon, run?.loadout?.armor].filter(Boolean);
    const carriedEntries = Array.isArray(run?.inventory?.carried) ? run.inventory.carried : [];
    return {
      loadoutTier: loadoutEntries.reduce((total: number, entry: RunEquipmentState) => {
        return total + toNumber(content?.itemCatalog?.[entry.itemId]?.progressionTier, 0);
      }, 0),
      loadoutSockets: loadoutEntries.reduce((total: number, entry: RunEquipmentState) => total + toNumber(entry?.socketsUnlocked, 0), 0),
      carriedEquipmentCount: carriedEntries.filter((entry: InventoryEntry) => entry?.kind === "equipment").length,
      carriedRuneCount: carriedEntries.filter((entry: InventoryEntry) => entry?.kind === "rune").length,
    };
  }

  function getProfileStashCounts(profile: ProfileState | null) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    return {
      stashEntryCount: entries.length,
      stashEquipmentCount: entries.filter((entry: InventoryEntry) => entry?.kind === "equipment").length,
      stashRuneCount: entries.filter((entry: InventoryEntry) => entry?.kind === "rune").length,
    };
  }

  function buildRunHistoryEntry(profile: ProfileState, run: RunState, outcome: string, content: GameContent, newFeatureIds: string[] = []) {
    const progressionSummary = content ? runtimeWindow.ROUGE_RUN_FACTORY?.getProgressionSummary?.(run, content) || null : null;
    const loadoutMetrics = getRunHistoryLoadoutMetrics(run, content);
    const stashCounts = getProfileStashCounts(profile);
    const plannedWeaponRunewordId = sanitizePlannedRunewordId(profile?.meta?.planning?.weaponRunewordId, "weapon", content);
    const plannedArmorRunewordId = sanitizePlannedRunewordId(profile?.meta?.planning?.armorRunewordId, "armor", content);
    const activeRunewordIds = uniqueStrings(run?.progression?.activatedRunewords || []);
    const completedPlannedRunewordIds = uniqueStrings([plannedWeaponRunewordId, plannedArmorRunewordId].filter((runewordId: string) => activeRunewordIds.includes(runewordId)));
    return {
      runId: run.id,
      classId: run.classId,
      className: run.className,
      level: run.level,
      actsCleared: toNumber(run.summary?.actsCleared, 0),
      bossesDefeated: toNumber(run.summary?.bossesDefeated, 0),
      goldGained: toNumber(run.summary?.goldGained, 0),
      enemiesDefeated: toNumber(run.summary?.enemiesDefeated, 0),
      cardsPlayed: toNumber(run.summary?.cardsPlayed, 0),
      potionsUsed: toNumber(run.summary?.potionsUsed, 0),
      lowestHeroLife: toNumber(run.summary?.lowestHeroLife, 0),
      lowestHeroLifeMax: toNumber(run.summary?.lowestHeroLifeMax, 0),
      lowestMercenaryLife: toNumber(run.summary?.lowestMercenaryLife, 0),
      lowestMercenaryLifeMax: toNumber(run.summary?.lowestMercenaryLifeMax, 0),
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
      newCharmIds: [] as string[],
      completedAt: new Date().toISOString(),
      outcome: outcome as RunHistoryEntry["outcome"],
    };
  }

  runtimeWindow.__ROUGE_PERSISTENCE_SUMMARIES = {
    getProfileSummary,
    buildStashSummary,
    buildArchiveSummary,
    buildAccountReviewSummary,
    getAccountProgressSummary,
    getRunHistoryLoadoutMetrics,
    getProfileStashCounts,
    buildRunHistoryEntry,
  };
})();
