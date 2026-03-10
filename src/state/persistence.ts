(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
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
    getDefaultFocusedTreeId,
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
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE;

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
    const overview: ProfilePlanningOverviewSummary = {
      compatibleCharterCount: 0,
      preparedCharterCount: 0,
      readyCharterCount: 0,
      missingBaseCharterCount: 0,
      socketCommissionCharterCount: 0,
      repeatForgeReadyCharterCount: 0,
      trackedBaseCount: 0,
      highestTrackedBaseTier: 0,
      totalSocketStepsRemaining: 0,
      compatibleRunewordIds: [],
      preparedRunewordIds: [],
      readyRunewordIds: [],
      missingBaseRunewordIds: [],
      fulfilledRunewordIds: [],
      bestFulfilledActsCleared: 0,
      bestFulfilledLoadoutTier: 0,
      nextAction: "idle",
      nextActionLabel: "Quiet",
      nextActionSummary: "No active runeword charter is pinned across the account.",
    };
    return overview;
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

  function buildPlanningCharterSummary(
    profile,
    runewordId,
    slot,
    historySummary,
    content = null
  ): ProfilePlanningCharterSummary | null {
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
    const bestCompletedEntry =
      historySummary.completedEntries
        .slice()
        .sort((left, right) => {
          if (toNumber(left?.actsCleared, 0) !== toNumber(right?.actsCleared, 0)) {
            return toNumber(right?.actsCleared, 0) - toNumber(left?.actsCleared, 0);
          }
          if (toNumber(left?.loadoutTier, 0) !== toNumber(right?.loadoutTier, 0)) {
            return toNumber(right?.loadoutTier, 0) - toNumber(left?.loadoutTier, 0);
          }
          if (toNumber(left?.loadoutSockets, 0) !== toNumber(right?.loadoutSockets, 0)) {
            return toNumber(right?.loadoutSockets, 0) - toNumber(left?.loadoutSockets, 0);
          }
          if (toNumber(left?.level, 0) !== toNumber(right?.level, 0)) {
            return toNumber(right?.level, 0) - toNumber(left?.level, 0);
          }
          return String(right?.completedAt || "").localeCompare(String(left?.completedAt || ""));
        })
        .shift() || null;
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
      bestCompletedRunId: bestCompletedEntry?.runId || "",
      bestCompletedClassId: bestCompletedEntry?.classId || "",
      bestCompletedClassName: bestCompletedEntry?.className || "",
      bestCompletedAt: bestCompletedEntry?.completedAt || "",
      bestCompletedLoadoutTier: toNumber(bestCompletedEntry?.loadoutTier, 0),
      bestCompletedLoadoutSockets: toNumber(bestCompletedEntry?.loadoutSockets, 0),
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
      bestBaseSocketGap: Math.max(0, toNumber(runeword.socketCount, 0) - toNumber(bestBase?.socketsUnlocked, 0)),
      commissionableBaseCount: compatibleBases.filter((entry) => entry.socketsUnlocked < toNumber(runeword.socketCount, 0)).length,
      hasReadyBase: readyBases.length > 0,
      repeatForgeReady: readyBases.length > 0 && historySummary.completedRunCount > 0,
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
    const fulfilledCharters = activeCharters.filter((charter) => toNumber(charter.completedRunCount, 0) > 0);
    const socketCommissionCharters = activeCharters.filter((charter) => charter.compatibleBaseCount > 0 && toNumber(charter.bestBaseSocketGap, 0) > 0);
    const repeatForgeReadyCharters = activeCharters.filter((charter) => charter.repeatForgeReady);
    const compatibleRunewordIds = compatibleCharters.map((charter) => charter.runewordId);
    const preparedRunewordIds = preparedCharters.map((charter) => charter.runewordId);
    const readyRunewordIds = readyCharters.map((charter) => charter.runewordId);
    const missingBaseRunewordIds = missingBaseCharters.map((charter) => charter.runewordId);
    const fulfilledRunewordIds = fulfilledCharters.map((charter) => charter.runewordId);
    const readyFulfilledRunewordIds = readyCharters.filter((charter) => toNumber(charter.completedRunCount, 0) > 0).map((charter) => charter.runewordId);

    const overview: ProfilePlanningOverviewSummary = {
      compatibleCharterCount: compatibleCharters.length,
      preparedCharterCount: preparedCharters.length,
      readyCharterCount: readyCharters.length,
      missingBaseCharterCount: missingBaseCharters.length,
      socketCommissionCharterCount: socketCommissionCharters.length,
      repeatForgeReadyCharterCount: repeatForgeReadyCharters.length,
      trackedBaseCount: compatibleCharters.reduce((total, charter) => total + toNumber(charter.compatibleBaseCount, 0), 0),
      highestTrackedBaseTier: compatibleCharters.reduce((highest, charter) => Math.max(highest, toNumber(charter.bestBaseTier, 0)), 0),
      totalSocketStepsRemaining: socketCommissionCharters.reduce((total, charter) => total + toNumber(charter.bestBaseSocketGap, 0), 0),
      compatibleRunewordIds,
      preparedRunewordIds,
      readyRunewordIds,
      missingBaseRunewordIds,
      fulfilledRunewordIds,
      bestFulfilledActsCleared: fulfilledCharters.reduce((highest, charter) => Math.max(highest, toNumber(charter.bestActsCleared, 0)), 0),
      bestFulfilledLoadoutTier: fulfilledCharters.reduce((highest, charter) => Math.max(highest, toNumber(charter.bestCompletedLoadoutTier, 0)), 0),
      nextAction: "hunt_bases",
      nextActionLabel: "Hunt Bases",
      nextActionSummary: `Pinned charters still lack a compatible parked base: ${getPlanningRunewordListLabel(missingBaseRunewordIds, content)}.`,
    };

    if (readyRunewordIds.length > 0) {
      overview.nextAction = "stock_runes";
      overview.nextActionLabel = "Stock Runes";
      overview.nextActionSummary = `Ready base parked for ${getPlanningRunewordListLabel(readyRunewordIds, content)}. Prioritize rune depth before another replacement base.`;
      if (readyFulfilledRunewordIds.length > 0) {
        overview.nextActionSummary = `Ready base parked for ${getPlanningRunewordListLabel(readyRunewordIds, content)}. Archive already proved ${getPlanningRunewordListLabel(
          readyFulfilledRunewordIds,
          content
        )} up through Act ${Math.max(1, overview.bestFulfilledActsCleared)}. Prioritize rune depth for a repeat forge.`;
      }
      return overview;
    }

    if (preparedRunewordIds.length > 0) {
      overview.nextAction = "open_sockets";
      overview.nextActionLabel = "Commission Sockets";
      overview.nextActionSummary = `Prepared base parked for ${getPlanningRunewordListLabel(
        preparedRunewordIds,
        content
      )}. Commission ${Math.max(1, overview.totalSocketStepsRemaining)} more socket${overview.totalSocketStepsRemaining === 1 ? "" : "s"} across the best parked bases before chasing more replacements.`;
      return overview;
    }

    if (compatibleRunewordIds.length > 0) {
      overview.nextAction = "prepare_bases";
      overview.nextActionLabel = "Commission Sockets";
      overview.nextActionSummary = `Compatible base parked for ${getPlanningRunewordListLabel(
        compatibleRunewordIds,
        content
      )}. Commission ${Math.max(1, overview.totalSocketStepsRemaining)} socket${overview.totalSocketStepsRemaining === 1 ? "" : "s"} to start live base prep instead of chasing more replacements.`;
      return overview;
    }

    return overview;
  }

  function buildPlanningSummary(profile, content = null): ProfilePlanningSummary {
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
          completedEntries: [],
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
        completedEntries,
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

  function getAccountProgressSummary(profile, content = null): ProfileAccountSummary {
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
    if (nextSettings.debugMode && typeof nextSettings.debugMode === "object") {
      if (!profile.meta.settings.debugMode || typeof profile.meta.settings.debugMode !== "object") {
        profile.meta.settings.debugMode = { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false };
      }
      for (const key of ["enabled", "skipBattles", "invulnerable", "oneHitKill", "infiniteGold"]) {
        if (typeof nextSettings.debugMode[key] === "boolean") {
          profile.meta.settings.debugMode[key] = nextSettings.debugMode[key];
        }
      }
    }
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
