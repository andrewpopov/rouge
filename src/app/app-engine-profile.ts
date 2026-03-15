(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getPersistence() {
    return runtimeWindow.ROUGE_PERSISTENCE || null;
  }

  function getProfileSummary(state: AppState | null = null): ProfileSummary {
    const persistence = getPersistence();
    const profile = state?.profile || persistence?.loadProfileFromStorage?.() || null;
    return persistence?.getProfileSummary?.(profile) || persistence?.getProfileSummary?.(null) || {
      hasActiveRun: false,
      stashEntries: 0,
      runHistoryCount: 0,
      completedRuns: 0,
      failedRuns: 0,
      highestLevel: 1,
      highestActCleared: 0,
      totalBossesDefeated: 0,
      totalGoldCollected: 0,
      totalRunewordsForged: 0,
      classesPlayedCount: 0,
      preferredClassId: "",
      lastPlayedClassId: "",
      unlockedClassCount: 0,
      unlockedBossCount: 0,
      unlockedRunewordCount: 0,
      townFeatureCount: 0,
      seenTutorialCount: 0,
      completedTutorialCount: 0,
      dismissedTutorialCount: 0,
    };
  }

  function getAccountProgressSummary(state: AppState | null = null): ProfileAccountSummary {
    const persistence = getPersistence();
    const profile = state?.profile || persistence?.loadProfileFromStorage?.() || null;
    const fallbackPlanning: ProfilePlanningSummary = {
      weaponRunewordId: "",
      armorRunewordId: "",
      plannedRunewordCount: 0,
      fulfilledPlanCount: 0,
      unfulfilledPlanCount: 0,
      weaponArchivedRunCount: 0,
      weaponCompletedRunCount: 0,
      weaponBestActsCleared: 0,
      armorArchivedRunCount: 0,
      armorCompletedRunCount: 0,
      armorBestActsCleared: 0,
      overview: {
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
        nextActionLabel: "No Live Charter",
        nextActionSummary: "No runeword charter is pinned on the account yet.",
      },
      weaponCharter: undefined,
      armorCharter: undefined,
    };
    const fallbackAccountSummary: ProfileAccountSummary = {
      profile: getProfileSummary(state),
      settings: {
        showHints: true,
        reduceMotion: false,
        compactMode: false,
        debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false },
      },
      unlockedFeatureIds: [],
      activeTutorialIds: [],
      dismissedTutorialCount: 0,
      planning: fallbackPlanning,
      stash: {
        entryCount: 0,
        equipmentCount: 0,
        runeCount: 0,
        socketReadyEquipmentCount: 0,
        socketedRuneCount: 0,
        runewordEquipmentCount: 0,
        itemIds: [],
        runeIds: [],
      },
      archive: {
        entryCount: 0,
        completedCount: 0,
        failedCount: 0,
        abandonedCount: 0,
        latestClassId: "",
        latestClassName: "",
        latestOutcome: "",
        latestCompletedAt: "",
        highestLevel: 0,
        highestActsCleared: 0,
        highestGoldGained: 0,
        highestLoadoutTier: 0,
        runewordArchiveCount: 0,
        featureUnlockCount: 0,
        favoredTreeId: "",
        favoredTreeName: "",
        planningArchiveCount: 0,
        planningCompletionCount: 0,
        planningMissCount: 0,
        recentFeatureIds: [],
        recentPlannedRunewordIds: [],
      },
      review: {
        capstoneCount: 0,
        unlockedCapstoneCount: 0,
        blockedCapstoneCount: 0,
        readyCapstoneCount: 0,
        nextCapstoneId: "",
        nextCapstoneTitle: "",
        convergenceCount: 0,
        unlockedConvergenceCount: 0,
        blockedConvergenceCount: 0,
        availableConvergenceCount: 0,
        nextConvergenceId: "",
        nextConvergenceTitle: "",
      },
      convergences: [],
      focusedTreeId: "",
      focusedTreeTitle: "",
      treeCount: 0,
      trees: [],
      runHistoryCapacity: 20,
      nextMilestoneId: "",
      nextMilestoneTitle: "",
      unlockedMilestoneCount: 0,
      milestoneCount: 0,
      milestones: [],
    };
    return (
      persistence?.getAccountProgressSummary?.(profile, state?.content || null) ||
      persistence?.getAccountProgressSummary?.(null, state?.content || null) ||
      fallbackAccountSummary
    );
  }

  function mutateProfileMeta(state: AppState, applyMutation: (persistence: PersistenceApi, profile: ProfileState) => void): ActionResult {
    const persistence = getPersistence();
    if (!persistence || !state.profile) {
      state.error = "Profile persistence is not available.";
      return { ok: false, message: state.error };
    }
    applyMutation(persistence, state.profile);
    persistence.saveProfileToStorage(state.profile);
    state.error = "";
    return { ok: true };
  }

  function updateProfileSettings(state: AppState, patch: ProfileSettingsPatch): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.updateProfileSettings(profile, patch);
    });
  }

  function getPreferredClassId(classes: ClassDefinition[], profile: ProfileState): string {
    const candidates = [profile?.meta?.progression?.preferredClassId, profile?.meta?.progression?.lastPlayedClassId];
    return candidates.find((classId) => classes.some((entry) => entry.id === classId)) || classes[0]?.id || "";
  }

  function setPreferredClass(state: AppState, classId: string): ActionResult {
    const result = mutateProfileMeta(state, (persistence, profile) => {
      persistence.setPreferredClass(profile, classId);
    });
    if (result.ok) {
      state.ui.selectedClassId = getPreferredClassId(state.registries.classes, state.profile);
    }
    return result;
  }

  function setPlannedRuneword(state: AppState, slot: "weapon" | "armor", runewordId: string): ActionResult {
    if (slot !== "weapon" && slot !== "armor") {
      state.error = "Unknown planning slot.";
      return { ok: false, message: state.error };
    }
    if (runewordId) {
      const runeword = state.content?.runewordCatalog?.[runewordId] || null;
      if (!runeword) {
        state.error = "Unknown runeword planning target.";
        return { ok: false, message: state.error };
      }
      if (runeword.slot !== slot) {
        state.error = "That runeword does not match the selected planning slot.";
        return { ok: false, message: state.error };
      }
    }
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.setPlannedRuneword(profile, slot, runewordId, state.content);
    });
  }

  function setAccountProgressionFocus(state: AppState, treeId: string): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.setAccountProgressionFocus(profile, treeId);
    });
  }

  function markTutorialSeen(state: AppState, tutorialId: string): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.markTutorialSeen(profile, tutorialId);
    });
  }

  function completeTutorial(state: AppState, tutorialId: string): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.markTutorialCompleted(profile, tutorialId);
    });
  }

  function dismissTutorial(state: AppState, tutorialId: string): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.dismissTutorial(profile, tutorialId);
    });
  }

  function restoreTutorial(state: AppState, tutorialId: string): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.restoreTutorial(profile, tutorialId);
    });
  }

  runtimeWindow.__ROUGE_APP_ENGINE_PROFILE = {
    getProfileSummary,
    getAccountProgressSummary,
    mutateProfileMeta,
    updateProfileSettings,
    setPreferredClass,
    setPlannedRuneword,
    setAccountProgressionFocus,
    markTutorialSeen,
    completeTutorial,
    dismissTutorial,
    restoreTutorial,
  };
})();
