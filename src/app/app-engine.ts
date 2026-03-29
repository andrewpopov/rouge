(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    getProfileSummary,
    getAccountProgressSummary,
    updateProfileSettings,
    setPreferredClass,
    setPlannedRuneword,
    setAccountProgressionFocus,
    markTutorialSeen,
    completeTutorial,
    dismissTutorial,
    restoreTutorial,
  } = runtimeWindow.__ROUGE_APP_ENGINE_PROFILE;

  const { RUN_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    PHASES,
    getPersistence,
    syncProfileMetaSelection,
    loadProfile,

    clearActiveRunProfile,
    recordRunHistory,
    recordSnapshotRunHistory,
    getTrainingRankCount,
    buildMercenaryRouteCombatBonuses,
    getPhaseLabel,
    resetFrontDoorUi,
    clampRunHistoryReviewIndex,
    getPreferredClassId,
    createRunSnapshot,
    persistRunIfPossible,
    restoreSnapshotIntoState,
  } = runtimeWindow.__ROUGE_APP_ENGINE_RUN;

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
        hallExpanded: false,
        hallSection: "",
        townFocus: "",
        inventoryOpen: false,
        inventoryTab: "",
        exploring: false,
        explorationEvent: null,
        scrollMapOpen: false,
        routeIntelOpen: false,
        actTransitionScrollOpen: false,
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

  function selectClass(state: AppState, classId: string): void {
    setSelectedClass(state, classId);
  }

  function selectMercenary(state: AppState, mercenaryId: string): void {
    setSelectedMercenary(state, mercenaryId);
  }

  function setRunHistoryReviewIndex(state: AppState, historyIndex: number): void {
    state.ui.reviewedHistoryIndex = clampRunHistoryReviewIndex(state, historyIndex);
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
    const runSeed = Math.max(1, Math.floor(state.randomFn() * 0x100000000) >>> 0);
    state.run = runFactory.createRun({
      content: state.content,
      seedBundle: state.seedBundle,
      classDefinition,
      heroDefinition,
      mercenaryId: state.ui.selectedMercenaryId,
      starterDeck,
      runSeed,
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
      recordRunHistory(state, RUN_OUTCOME.ABANDONED);
    } else if (state.profile.activeRunSnapshot || getPersistence()?.loadFromStorage?.()) {
      recordSnapshotRunHistory(state, RUN_OUTCOME.ABANDONED);
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
    const introActNumber = state.run.actNumber;
    const hasPendingIntro = state.run.guide?.overlayKind === "intro" && state.run.guide?.targetActNumber === introActNumber;
    const shouldQueueIntro = introActNumber === 1 && !state.run.guide?.seenIntroActNumbers?.includes(introActNumber);
    if (hasPendingIntro || shouldQueueIntro) {
      state.run.guide.overlayKind = "intro";
      state.run.guide.targetActNumber = introActNumber;
      if (shouldQueueIntro) {
        state.run.guide.seenIntroActNumbers.push(introActNumber);
      }
    }
    state.ui.routeIntelOpen = false;
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

  function buildAndStartCombat(state: AppState, encounterId: string): void {
    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    const overrides = runFactory.createCombatOverrides(state.run, state.content, state.profile);
    const mercenaryRouteBonuses = buildMercenaryRouteCombatBonuses(state.run, state.content);
    const combatBonuses = runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatBonuses?.(state.run, state.content) || {};
    const armorProfile = runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatMitigationProfile?.(state.run, state.content) || null;
    const weaponEquipment = state.run.loadout?.weapon || null;
    const weaponItemId = state.run.loadout?.weapon?.itemId || "";
    const weaponItem = runtimeWindow.ROUGE_ITEM_CATALOG?.getItemDefinition?.(state.content, weaponItemId) || null;
    const weaponProfile = runtimeWindow.ROUGE_ITEM_CATALOG?.buildEquipmentWeaponProfile?.(weaponEquipment, state.content) || null;
    const weaponFamily = runtimeWindow.ROUGE_ITEM_CATALOG?.getWeaponFamily?.(weaponItemId, state.content) || "";
    const classPreferred = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(state.run.classId) || [];
    state.combat = state.combatEngine.createCombatState({
      content: { ...state.content, hero: overrides.heroState },
      encounterId,
      mercenaryId: state.run.mercenary.id,
      heroState: overrides.heroState,
      mercenaryState: { ...overrides.mercenaryState, ...mercenaryRouteBonuses },
      starterDeck: overrides.starterDeck,
      initialPotions: overrides.initialPotions,
      randomFn: state.randomFn,
      weaponFamily,
      weaponName: weaponItem?.name || "",
      weaponDamageBonus: combatBonuses.heroDamageBonus || 0,
      weaponProfile,
      armorProfile,
      classPreferredFamilies: classPreferred,
    });
    state.phase = PHASES.ENCOUNTER;
    state.ui.exploring = true;
    runtimeWindow.ROUGE_DEBUG = state.profile?.meta?.settings?.debugMode || null;
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

    buildAndStartCombat(state, result.encounterId);
    return { ok: true };
  }

  function debugSkipEncounter(state: AppState): ActionResult {
    if (state.phase !== PHASES.ENCOUNTER || !state.run) {
      return { ok: false, message: "No encounter to skip." };
    }
    if (!state.profile?.meta?.settings?.debugMode?.skipBattles) {
      return { ok: false, message: "Skip battles is not enabled." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
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

  function syncEncounterOutcome(state: AppState): ActionResult {
    if (state.phase !== PHASES.ENCOUNTER || !state.combat?.outcome || !state.run) {
      return { ok: false, message: "Encounter is still in progress." };
    }

    const runFactory = runtimeWindow.ROUGE_RUN_FACTORY;
    runFactory.snapshotPartyFromCombat(state.run, state.combat, state.content, state.profile);

    if (state.combat.outcome === "defeat") {
      state.phase = PHASES.RUN_FAILED;
      recordRunHistory(state, RUN_OUTCOME.FAILED);
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
    if (state.profile?.meta?.settings?.debugMode?.infiniteGold && reward.grants) {
      reward.grants.gold = 9999;
    }
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
      recordRunHistory(state, RUN_OUTCOME.COMPLETED);
      return { ok: true };
    }

    if (reward.endsAct || runFactory.actIsComplete(state.run)) {
      state.run.guide.overlayKind = "reward";
      state.run.guide.targetActNumber = state.run.actNumber + 1;
      state.phase = PHASES.ACT_TRANSITION;
      persistRunIfPossible(state);
      return { ok: true };
    }

    // Zone still has encounters remaining — go straight into the next fight
    if (!reward.clearsZone && reward.zoneId) {
      const beginResult = runFactory.beginZone(state.run, reward.zoneId, state.content);
      if (beginResult.ok && beginResult.type === "encounter") {
        buildAndStartCombat(state, beginResult.encounterId);
        persistRunIfPossible(state);
        return { ok: true };
      }
      // If beginZone returns a reward-type (world node) or fails, fall through to world map
      if (beginResult.ok && beginResult.type === "reward") {
        state.run.pendingReward = beginResult.reward;
        state.combat = null;
        state.phase = PHASES.REWARD;
        persistRunIfPossible(state);
        return { ok: true };
      }
    }

    state.phase = PHASES.WORLD_MAP;
    persistRunIfPossible(state);
    return { ok: true };
  }

  function continueActGuide(state: AppState): ActionResult {
    if (!state.run?.guide?.overlayKind) {
      return { ok: false, message: "No guide scroll is open." };
    }

    const overlayKind = state.run.guide.overlayKind;
    const guideOpenOnWorldMap = state.phase === PHASES.WORLD_MAP && overlayKind === "intro";
    const guideOpenOnActTransition = state.phase === PHASES.ACT_TRANSITION && overlayKind === "reward";
    if (!guideOpenOnWorldMap && !guideOpenOnActTransition) {
      return { ok: false, message: "The guide scroll is not active on this surface." };
    }

    state.run.guide.overlayKind = "";
    state.run.guide.targetActNumber = 0;
    state.error = "";
    persistRunIfPossible(state);
    return { ok: true };
  }

  function continueActTransition(state: AppState): ActionResult {
    if (state.phase !== PHASES.ACT_TRANSITION || !state.run) {
      return { ok: false, message: "No act transition is active." };
    }
    if (state.run.guide?.overlayKind === "reward") {
      state.run.guide.overlayKind = "";
      state.run.guide.targetActNumber = 0;
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
    selectClass,
    selectMercenary,
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
    debugSkipEncounter,
    syncEncounterOutcome,
    claimRewardAndAdvance,
    continueActGuide,
    continueActTransition,
    returnToFrontDoor,
  };
})();
