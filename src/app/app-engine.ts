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
          totalBossesDefeated: 0,
          classesPlayed: [],
          preferredClassId: "",
          lastPlayedClassId: "",
        },
      },
    };
  }

  function getPreferredClassId(classes: ClassDefinition[], profile: ProfileState): string {
    const candidates = [profile?.meta?.progression?.lastPlayedClassId, profile?.meta?.progression?.preferredClassId];
    return candidates.find((classId) => classes.some((entry) => entry.id === classId)) || classes[0]?.id || "";
  }

  function syncProfileMetaSelection(profile: ProfileState, classId: string): void {
    if (!classId) {
      return;
    }

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
    profile.meta.progression.lastPlayedClassId = classId;
    if (!profile.meta.progression.preferredClassId) {
      profile.meta.progression.preferredClassId = classId;
    }
    profile.meta.progression.classesPlayed = Array.from(
      new Set([...(profile.meta.progression.classesPlayed || []), classId].filter(Boolean))
    );
  }

  function loadProfile(content: GameContent): ProfileState {
    const persistence = getPersistence();
    const storedProfile = persistence?.loadProfileFromStorage?.() || null;
    const profile = storedProfile || persistence?.createEmptyProfile?.() || createFallbackProfile();
    const serializedBeforeHydration = storedProfile ? JSON.stringify(storedProfile) : "";

    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateProfileStash?.(profile, content);

    if (storedProfile && serializedBeforeHydration !== JSON.stringify(profile)) {
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
      persistence.recordRunHistory(state.profile, state.run, outcome);
    }
    clearActiveRunProfile(state);
  }

  function recordSnapshotRunHistory(state: AppState, outcome: RunHistoryEntry["outcome"]): void {
    const persistence = getPersistence();
    const snapshot = state.profile.activeRunSnapshot || persistence?.loadFromStorage?.() || null;
    if (persistence?.recordRunHistory && snapshot?.run) {
      persistence.recordRunHistory(state.profile, snapshot.run, outcome);
    }
    clearActiveRunProfile(state);
  }

  function getTrainingRankCount(training: RunProgressionState["training"] | undefined): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(training?.[track] ?? 0), 10) || 0);
    }, 0);
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
    state.run = runFactory.hydrateRun(snapshot.run, state.content);
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

    state.error = "";
    persistRunIfPossible(state);
    return result;
  }

  function selectZone(state: AppState, zoneId: string): ActionResult {
    if (state.phase !== PHASES.WORLD_MAP || !state.run) {
      return { ok: false, message: "You cannot enter a zone right now." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const result = runFactory.beginZone(state.run, zoneId);
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
    state.combat = state.combatEngine.createCombatState({
      content: {
        ...state.content,
        hero: overrides.heroState,
      },
      encounterId: result.encounterId,
      mercenaryId: state.run.mercenary.id,
      heroState: overrides.heroState,
      mercenaryState: overrides.mercenaryState,
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
