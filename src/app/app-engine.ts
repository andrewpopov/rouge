(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const PHASES = {
    BOOT: "boot",
    FRONT_DOOR: "front_door",
    CHARACTER_SELECT: "character_select",
    SAFE_ZONE: "safe_zone",
    WORLD_MAP: "world_map",
    ENCOUNTER: "encounter",
    REWARD: "reward",
    ACT_TRANSITION: "act_transition",
    RUN_COMPLETE: "run_complete",
    RUN_FAILED: "run_failed",
  };

  function getPersistence() {
    return runtimeWindow.ROUGE_PERSISTENCE || null;
  }

  function createFallbackProfile(): ProfileState {
    return getPersistence()?.createEmptyProfile?.() || {
      activeRunSnapshot: null,
      stash: {
        entries: [],
      },
      runHistory: [],
      meta: {
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
          townFeatureIds: [
            "front_door_profile_hall",
            "safe_zone_services",
            "vendor_economy",
            "profile_stash",
            "mercenary_contracts",
            "class_progression",
          ],
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
          focusedTreeId: "archives",
        },
      },
    };
  }

  function getPreferredClassId(classes: ClassDefinition[], profile: ProfileState): string {
    const candidates = [profile?.meta?.progression?.preferredClassId, profile?.meta?.progression?.lastPlayedClassId];
    return candidates.find((classId) => classes.some((entry) => entry.id === classId)) || classes[0]?.id || "";
  }

  function syncProfileMetaSelection(profile: ProfileState, classId: string): void {
    if (!classId) {
      return;
    }

    const persistence = getPersistence();
    const defaultMeta = createFallbackProfile().meta;
    profile.meta = profile.meta || defaultMeta;
    profile.meta.settings = {
      ...defaultMeta.settings,
      ...(profile.meta.settings || {}),
    };
    profile.meta.progression = {
      ...defaultMeta.progression,
      ...(profile.meta.progression || {}),
      classesPlayed: Array.isArray(profile.meta.progression?.classesPlayed) ? [...profile.meta.progression.classesPlayed] : [],
    };
    const previousLastPlayedClassId = profile.meta.progression.lastPlayedClassId || "";
    const previousPreferredClassId = profile.meta.progression.preferredClassId || "";
    profile.meta.progression.lastPlayedClassId = classId;
    if (!previousPreferredClassId || previousPreferredClassId === previousLastPlayedClassId) {
      profile.meta.progression.preferredClassId = classId;
    }
    profile.meta.progression.classesPlayed = Array.from(
      new Set([...(profile.meta.progression.classesPlayed || []), classId].filter(Boolean))
    );
    persistence?.unlockProfileEntries?.(profile, "classIds", [classId]);
    persistence?.markTutorialSeen?.(profile, "first_run_overview");
  }

  function loadProfile(content: GameContent): ProfileState {
    const persistence = getPersistence();
    const storedProfile = persistence?.loadProfileFromStorage?.(undefined, content) || null;
    const profile = storedProfile || persistence?.createEmptyProfile?.() || createFallbackProfile();
    const serializedBeforeHydration = JSON.stringify(profile);

    persistence?.ensureProfileMeta?.(profile, content);
    persistence?.markTutorialSeen?.(profile, "front_door_profile_hall");
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateProfileStash?.(profile, content);

    if (serializedBeforeHydration !== JSON.stringify(profile)) {
      persistence?.saveProfileToStorage?.(profile);
    }

    return profile;
  }

  function persistProfile(state: AppState): void {
    getPersistence()?.saveProfileToStorage?.(state.profile);
  }

  function clearActiveRunProfile(state: AppState): void {
    state.profile.activeRunSnapshot = null;
    getPersistence()?.clearStorage();
    persistProfile(state);
  }

  function recordRunHistory(state: AppState, outcome: RunHistoryEntry["outcome"]): void {
    const persistence = getPersistence();
    if (persistence?.recordRunHistory && state.run) {
      persistence.recordRunHistory(state.profile, state.run, outcome, state.content);
    }
    state.ui.reviewedHistoryIndex = 0;
    clearActiveRunProfile(state);
  }

  function recordSnapshotRunHistory(state: AppState, outcome: RunHistoryEntry["outcome"]): void {
    const persistence = getPersistence();
    const snapshot = state.profile.activeRunSnapshot || persistence?.loadFromStorage?.() || null;
    if (persistence?.recordRunHistory && snapshot?.run) {
      persistence.recordRunHistory(state.profile, snapshot.run, outcome, state.content);
    }
    state.ui.reviewedHistoryIndex = 0;
    clearActiveRunProfile(state);
  }

  function getTrainingRankCount(training: RunProgressionState["training"] | undefined): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(training?.[track] ?? 0), 10) || 0);
    }, 0);
  }

  function parseInteger(value: unknown, fallback = 0): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

  function getScaledRoutePerkValue(
    routePerk: MercenaryRoutePerkDefinition,
    baseField: keyof Pick<
      MercenaryRoutePerkDefinition,
      "attackBonus" | "behaviorBonus" | "startGuard" | "heroDamageBonus" | "heroStartGuard" | "openingDraw"
    >,
    perActField: keyof Pick<
      MercenaryRoutePerkDefinition,
      "attackBonusPerAct" | "behaviorBonusPerAct" | "startGuardPerAct" | "heroDamageBonusPerAct" | "heroStartGuardPerAct" | "openingDrawPerAct"
    >,
    actNumber: number
  ): number {
    const baseValue = Math.max(0, parseInteger(routePerk?.[baseField], 0));
    const perActValue = Math.max(0, parseInteger(routePerk?.[perActField], 0));
    const scalingStartAct = Math.max(1, parseInteger(routePerk?.scalingStartAct, actNumber));
    return baseValue + Math.max(0, actNumber - scalingStartAct) * perActValue;
  }

  function buildMercenaryRouteCombatBonuses(run: RunState, content: GameContent): CombatMercenaryRouteBonusState {
    const mercenaryDefinition = content?.mercenaryCatalog?.[run?.mercenary?.id || ""] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const actNumber = Math.max(1, parseInteger(run?.actNumber, 1));
    const activePerks = (Array.isArray(mercenaryDefinition?.routePerks) ? mercenaryDefinition.routePerks : []).filter((routePerk) => {
      const requiredFlagIds = Array.isArray(routePerk?.requiredFlagIds) ? routePerk.requiredFlagIds : [];
      return requiredFlagIds.length > 0 && requiredFlagIds.every((flagId) => worldFlags.includes(flagId));
    });

    return activePerks.reduce(
      (bonuses, routePerk) => {
        bonuses.contractAttackBonus += getScaledRoutePerkValue(routePerk, "attackBonus", "attackBonusPerAct", actNumber);
        bonuses.contractBehaviorBonus += getScaledRoutePerkValue(routePerk, "behaviorBonus", "behaviorBonusPerAct", actNumber);
        bonuses.contractStartGuard += getScaledRoutePerkValue(routePerk, "startGuard", "startGuardPerAct", actNumber);
        bonuses.contractHeroDamageBonus += getScaledRoutePerkValue(routePerk, "heroDamageBonus", "heroDamageBonusPerAct", actNumber);
        bonuses.contractHeroStartGuard += getScaledRoutePerkValue(routePerk, "heroStartGuard", "heroStartGuardPerAct", actNumber);
        bonuses.contractOpeningDraw += getScaledRoutePerkValue(routePerk, "openingDraw", "openingDrawPerAct", actNumber);
        if (routePerk?.title) {
          bonuses.contractPerkLabels.push(routePerk.title);
        }
        return bonuses;
      },
      {
        contractAttackBonus: 0,
        contractBehaviorBonus: 0,
        contractStartGuard: 0,
        contractHeroDamageBonus: 0,
        contractHeroStartGuard: 0,
        contractOpeningDraw: 0,
        contractPerkLabels: [],
      } as CombatMercenaryRouteBonusState
    );
  }

  function getPhaseLabel(phase: AppPhase): string {
    switch (phase) {
      case PHASES.SAFE_ZONE:
        return "Safe Zone";
      case PHASES.WORLD_MAP:
        return "World Map";
      case PHASES.REWARD:
        return "Reward";
      case PHASES.ACT_TRANSITION:
        return "Act Transition";
      case PHASES.RUN_COMPLETE:
        return "Run Complete";
      case PHASES.RUN_FAILED:
        return "Run Failed";
      default:
        return "Run In Progress";
    }
  }

  function resetFrontDoorUi(state: AppState): void {
    state.ui.confirmAbandonSavedRun = false;
  }

  function clampRunHistoryReviewIndex(state: AppState, historyIndex: number): number {
    const historyLength = Array.isArray(state.profile?.runHistory) ? state.profile.runHistory.length : 0;
    if (historyLength <= 0) {
      return 0;
    }
    return Math.min(Math.max(0, parseInteger(historyIndex, 0)), historyLength - 1);
  }

  function createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn = Math.random,
  }: {
    content: GameContent;
    seedBundle: SeedBundle;
    combatEngine: CombatEngineApi;
    randomFn?: RandomFn;
  }): AppState {
    const classRegistry = runtimeWindow.ROUGE_CLASS_REGISTRY;
    const classes = classRegistry.listPlayableClasses(seedBundle);
    const mercenaries = Object.values(content.mercenaryCatalog) as MercenaryDefinition[];
    const profile = loadProfile(content);

    return {
      phase: PHASES.FRONT_DOOR,
      content,
      seedBundle,
      combatEngine,
      randomFn,
      registries: {
        classes,
        mercenaries,
      },
      ui: {
        selectedClassId: getPreferredClassId(classes, profile),
        selectedMercenaryId: mercenaries[0]?.id || "",
        reviewedHistoryIndex: 0,
        confirmAbandonSavedRun: false,
      },
      profile,
      run: null,
      combat: null,
      error: "",
    };
  }

  function setSelectedClass(state: AppState, classId: string): void {
    if (state.registries.classes.some((entry) => entry.id === classId)) {
      state.ui.selectedClassId = classId;
    }
  }

  function setSelectedMercenary(state: AppState, mercenaryId: string): void {
    if (state.registries.mercenaries.some((entry) => entry.id === mercenaryId)) {
      state.ui.selectedMercenaryId = mercenaryId;
    }
  }

  function setRunHistoryReviewIndex(state: AppState, historyIndex: number): void {
    state.ui.reviewedHistoryIndex = clampRunHistoryReviewIndex(state, historyIndex);
  }

  function createRunSnapshot(state: AppState) {
    const persistence = getPersistence();
    if (!persistence || !state.run) {
      return null;
    }

    return persistence.createSnapshot({
      phase: state.phase,
      selectedClassId: state.ui.selectedClassId,
      selectedMercenaryId: state.ui.selectedMercenaryId,
      run: state.run,
    });
  }

  function persistRunIfPossible(state: AppState) {
    const persistence = getPersistence();
    const snapshot = createRunSnapshot(state);
    if (!snapshot || state.phase === PHASES.ENCOUNTER || state.phase === PHASES.RUN_COMPLETE || state.phase === PHASES.RUN_FAILED) {
      return;
    }
    state.profile.activeRunSnapshot = snapshot;
    persistence?.saveToStorage?.(snapshot);
    persistProfile(state);
  }

  function normalizeLoadedPhase(phase) {
    const allowedPhases = new Set([
      PHASES.SAFE_ZONE,
      PHASES.WORLD_MAP,
      PHASES.REWARD,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ]);
    return allowedPhases.has(phase) ? phase : PHASES.SAFE_ZONE;
  }

  function restoreSnapshotIntoState(state: AppState, snapshot: RunSnapshotEnvelope): ActionResult {
    if (!snapshot?.run) {
      state.error = "Run snapshot is invalid.";
      return { ok: false, message: state.error };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const persistence = getPersistence();
    state.run = runFactory.hydrateRun(snapshot.run, state.content);
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunInventory?.(state.run, state.content, state.profile);
    persistence?.syncProfileMetaFromRun?.(state.profile, state.run);
    state.profile.activeRunSnapshot = snapshot;
    state.ui.selectedClassId = snapshot.selectedClassId || state.run.classId || state.ui.selectedClassId;
    state.ui.selectedMercenaryId = snapshot.selectedMercenaryId || state.run.mercenary.id || state.ui.selectedMercenaryId;
    resetFrontDoorUi(state);
    state.combat = null;
    state.phase = normalizeLoadedPhase(snapshot.phase);
    state.error = "";
    return { ok: true };
  }

  function startCharacterSelect(state: AppState): void {
    resetFrontDoorUi(state);
    state.ui.selectedClassId = getPreferredClassId(state.registries.classes, state.profile);
    state.phase = PHASES.CHARACTER_SELECT;
    state.error = "";
    state.combat = null;
  }

  function startRun(state: AppState): ActionResult {
    const classRegistry = runtimeWindow.ROUGE_CLASS_REGISTRY;
    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const classDefinition = classRegistry.getClassDefinition(state.seedBundle, state.ui.selectedClassId);
    if (!classDefinition) {
      state.error = "Choose a valid class before starting the run.";
      return { ok: false, message: state.error };
    }

    const heroDefinition = classRegistry.createHeroFromClass(state.content, classDefinition);
    const starterDeck = classRegistry.getStarterDeckForClass(state.content, classDefinition.id);
    state.run = runFactory.createRun({
      content: state.content,
      seedBundle: state.seedBundle,
      classDefinition,
      heroDefinition,
      mercenaryId: state.ui.selectedMercenaryId,
      starterDeck,
    });
    syncProfileMetaSelection(state.profile, classDefinition.id);
    getPersistence()?.syncProfileMetaFromRun?.(state.profile, state.run);
    state.run.town.vendor.stock = [];
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunInventory?.(state.run, state.content, state.profile);
    resetFrontDoorUi(state);
    state.phase = PHASES.SAFE_ZONE;
    state.combat = null;
    state.error = "";
    persistRunIfPossible(state);
    return { ok: true };
  }

  function continueSavedRun(state: AppState): ActionResult {
    const persistence = getPersistence();
    if (!persistence) {
      state.error = "Persistence is not available in this runtime.";
      return { ok: false, message: state.error };
    }

    const snapshot = state.profile.activeRunSnapshot || persistence.loadFromStorage();
    if (!snapshot) {
      state.error = "No saved run is available.";
      return { ok: false, message: state.error };
    }

    const result = restoreSnapshotIntoState(state, snapshot);
    if (result.ok) {
      persistRunIfPossible(state);
    }
    return result;
  }

  function hasSavedRun(): boolean {
    const persistence = getPersistence();
    return Boolean(persistence?.loadProfileFromStorage?.()?.activeRunSnapshot || persistence?.hasSavedSnapshot?.());
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
    return (
      persistence?.getAccountProgressSummary?.(profile, state?.content || null) ||
      persistence?.getAccountProgressSummary?.(null, state?.content || null) || {
        profile: getProfileSummary(state),
        settings: {
          showHints: true,
          reduceMotion: false,
          compactMode: false,
        },
        unlockedFeatureIds: [],
        activeTutorialIds: [],
        dismissedTutorialCount: 0,
        planning: {
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
        },
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
      }
    );
  }

  function mutateProfileMeta(state: AppState, applyMutation: (persistence: PersistenceApi, profile: ProfileState) => void): ActionResult {
    const persistence = getPersistence();
    if (!persistence || !state.profile) {
      state.error = "Profile persistence is not available.";
      return { ok: false, message: state.error };
    }
    applyMutation(persistence, state.profile);
    persistProfile(state);
    state.error = "";
    return { ok: true };
  }

  function updateProfileSettings(state: AppState, patch: ProfileSettingsPatch): ActionResult {
    return mutateProfileMeta(state, (persistence, profile) => {
      persistence.updateProfileSettings(profile, patch);
    });
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

  function getSavedRunSummary(): SavedRunSummary | null {
    const persistence = getPersistence();
    const snapshot = persistence?.loadProfileFromStorage?.()?.activeRunSnapshot || persistence?.loadFromStorage() || null;
    if (!snapshot?.run) {
      return null;
    }

    const run = snapshot.run;
    return {
      savedAt: snapshot.savedAt,
      phase: snapshot.phase,
      phaseLabel: getPhaseLabel(snapshot.phase),
      className: run.className,
      actTitle: run.actTitle,
      safeZoneName: run.safeZoneName,
      bossName: run.bossName,
      level: run.level,
      gold: run.gold,
      deckSize: run.deck.length,
      beltState: `${run.belt.current}/${run.belt.max}`,
      skillPointsAvailable: run.progression?.skillPointsAvailable || 0,
      classPointsAvailable: run.progression?.classPointsAvailable || 0,
      attributePointsAvailable: run.progression?.attributePointsAvailable || 0,
      trainingRanks: getTrainingRankCount(run.progression?.training),
      favoredTreeId: run.progression?.classProgression?.favoredTreeId || "",
      unlockedClassSkills: Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
        ? run.progression.classProgression.unlockedSkillIds.length
        : 0,
      bossTrophies: Array.isArray(run.progression?.bossTrophies) ? run.progression.bossTrophies.length : 0,
      activeRunewords: Array.isArray(run.progression?.activatedRunewords) ? run.progression.activatedRunewords.length : 0,
      resolvedQuestOutcomes: Object.keys(run.world?.questOutcomes || {}).length,
      encountersCleared: run.summary?.encountersCleared || 0,
      zonesCleared: run.summary?.zonesCleared || 0,
    };
  }

  function saveRunSnapshot(state: AppState): string | null {
    const persistence = getPersistence();
    const snapshot = createRunSnapshot(state);
    if (!persistence || !snapshot) {
      return null;
    }
    return persistence.serializeSnapshot(snapshot);
  }

  function loadRunSnapshot(state: AppState, serializedSnapshot: string): ActionResult {
    const persistence = getPersistence();
    if (!persistence) {
      state.error = "Persistence is not available in this runtime.";
      return { ok: false, message: state.error };
    }

    const snapshot = persistence.restoreSnapshot(serializedSnapshot);
    if (!snapshot) {
      state.error = "Run snapshot could not be restored.";
      return { ok: false, message: state.error };
    }

    const result = restoreSnapshotIntoState(state, snapshot);
    if (result.ok) {
      persistRunIfPossible(state);
    }
    return result;
  }

  function clearSavedRun(): void {
    const persistence = getPersistence();
    const profile = persistence?.loadProfileFromStorage?.() || null;
    if (profile) {
      profile.activeRunSnapshot = null;
      persistence?.saveProfileToStorage?.(profile);
    }
    persistence?.clearStorage();
  }

  function abandonSavedRun(state: AppState): ActionResult {
    if (state.run) {
      recordRunHistory(state, "abandoned");
    } else if (state.profile.activeRunSnapshot || getPersistence()?.loadFromStorage?.()) {
      recordSnapshotRunHistory(state, "abandoned");
    } else {
      clearActiveRunProfile(state);
    }
    clearSavedRun();
    resetFrontDoorUi(state);
    state.phase = PHASES.FRONT_DOOR;
    state.run = null;
    state.combat = null;
    state.error = "";
    return { ok: true };
  }

  function leaveSafeZone(state: AppState): ActionResult {
    if (!state.run) {
      return { ok: false, message: "No active run." };
    }
    runtimeWindow.ROUGE_RUN_FACTORY.recomputeZoneStatuses(state.run);
    state.phase = PHASES.WORLD_MAP;
    state.error = "";
    persistRunIfPossible(state);
    return { ok: true };
  }

  function returnToSafeZone(state: AppState): ActionResult {
    if (state.phase !== PHASES.WORLD_MAP || !state.run) {
      return { ok: false, message: "You are not on the world map." };
    }
    state.phase = PHASES.SAFE_ZONE;
    state.error = "";
    persistRunIfPossible(state);
    return { ok: true };
  }

  function useTownAction(state: AppState, actionId: string): ActionResult {
    if (state.phase !== PHASES.SAFE_ZONE || !state.run) {
      return { ok: false, message: "Town actions are only available in the safe zone." };
    }

    const townServices = runtimeWindow.ROUGE_TOWN_SERVICES;
    const result = townServices.applyAction(state.run, state.profile, state.content, actionId);
    if (!result.ok) {
      state.error = result.message || "Town action failed.";
      return result;
    }

    getPersistence()?.syncProfileMetaFromRun?.(state.profile, state.run);
    state.error = "";
    persistRunIfPossible(state);
    return result;
  }

  function selectZone(state: AppState, zoneId: string): ActionResult {
    if (state.phase !== PHASES.WORLD_MAP || !state.run) {
      return { ok: false, message: "You cannot enter a zone right now." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const result = runFactory.beginZone(state.run, zoneId, state.content);
    if (!result.ok) {
      state.error = result.message;
      return result;
    }

    state.error = "";
    if (result.type === "reward") {
      state.run.pendingReward = result.reward;
      state.combat = null;
      state.phase = PHASES.REWARD;
      persistRunIfPossible(state);
      return { ok: true };
    }

    const overrides = runFactory.createCombatOverrides(state.run, state.content);
    const mercenaryRouteBonuses = buildMercenaryRouteCombatBonuses(state.run, state.content);
    state.combat = state.combatEngine.createCombatState({
      content: {
        ...state.content,
        hero: overrides.heroState,
      },
      encounterId: result.encounterId,
      mercenaryId: state.run.mercenary.id,
      heroState: overrides.heroState,
      mercenaryState: {
        ...overrides.mercenaryState,
        ...mercenaryRouteBonuses,
      },
      starterDeck: overrides.starterDeck,
      initialPotions: overrides.initialPotions,
      randomFn: state.randomFn,
    });
    state.phase = PHASES.ENCOUNTER;
    return { ok: true };
  }

  function syncEncounterOutcome(state: AppState): ActionResult {
    if (state.phase !== PHASES.ENCOUNTER || !state.combat?.outcome || !state.run) {
      return { ok: false, message: "Encounter is still in progress." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    runFactory.snapshotPartyFromCombat(state.run, state.combat, state.content);

    if (state.combat.outcome === "defeat") {
      state.phase = PHASES.RUN_FAILED;
      recordRunHistory(state, "failed");
      return { ok: true };
    }

    const zone = runFactory.getZoneById(state.run, state.run.activeZoneId);
    state.run.pendingReward = runFactory.buildEncounterReward({
      content: state.content,
      run: state.run,
      zone,
      combatState: state.combat,
      profile: state.profile,
    });
    state.combat = null;
    state.phase = PHASES.REWARD;
    persistRunIfPossible(state);
    return { ok: true };
  }

  function claimRewardAndAdvance(state: AppState, choiceId = ""): ActionResult {
    if (state.phase !== PHASES.REWARD || !state.run?.pendingReward) {
      return { ok: false, message: "There is no reward to claim." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const reward = state.run.pendingReward;
    const applyResult = runFactory.applyReward(state.run, reward, choiceId, state.content);
    if (!applyResult.ok) {
      state.error = applyResult.message || "Reward application failed.";
      return applyResult;
    }
    getPersistence()?.syncProfileMetaFromRun?.(state.profile, state.run);
    state.run.pendingReward = null;
    state.error = "";

    if (reward.endsRun || runFactory.runIsComplete(state.run)) {
      state.phase = PHASES.RUN_COMPLETE;
      recordRunHistory(state, "completed");
      return { ok: true };
    }

    if (reward.endsAct || runFactory.actIsComplete(state.run)) {
      state.phase = PHASES.ACT_TRANSITION;
      persistRunIfPossible(state);
      return { ok: true };
    }

    state.phase = PHASES.WORLD_MAP;
    persistRunIfPossible(state);
    return { ok: true };
  }

  function continueActTransition(state: AppState): ActionResult {
    if (state.phase !== PHASES.ACT_TRANSITION || !state.run) {
      return { ok: false, message: "No act transition is active." };
    }
    const advanced = runtimeWindow.ROUGE_RUN_FACTORY.advanceToNextAct(state.run, state.content);
    if (!advanced) {
      return { ok: false, message: "Cannot advance acts right now." };
    }
    getPersistence()?.syncProfileMetaFromRun?.(state.profile, state.run);
    state.phase = PHASES.SAFE_ZONE;
    persistRunIfPossible(state);
    return { ok: true };
  }

  function returnToFrontDoor(state: AppState): void {
    resetFrontDoorUi(state);
    state.phase = PHASES.FRONT_DOOR;
    state.run = null;
    state.combat = null;
    state.error = "";
  }

  runtimeWindow.ROUGE_APP_ENGINE = {
    PHASES,
    createAppState,
    setSelectedClass,
    setSelectedMercenary,
    startCharacterSelect,
    startRun,
    continueSavedRun,
    getProfileSummary,
    getAccountProgressSummary,
    updateProfileSettings,
    setPreferredClass,
    setPlannedRuneword,
    setRunHistoryReviewIndex,
    setAccountProgressionFocus,
    markTutorialSeen,
    completeTutorial,
    dismissTutorial,
    restoreTutorial,
    hasSavedRun,
    getSavedRunSummary,
    saveRunSnapshot,
    loadRunSnapshot,
    clearSavedRun,
    abandonSavedRun,
    leaveSafeZone,
    returnToSafeZone,
    useTownAction,
    selectZone,
    syncEncounterOutcome,
    claimRewardAndAdvance,
    continueActTransition,
    returnToFrontDoor,
  };
})();
