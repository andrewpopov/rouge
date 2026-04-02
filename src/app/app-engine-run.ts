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
        charms: {
          unlockedCharmIds: [],
          equippedCharmIds: [],
        },
      },
    };
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
      runtimeWindow.ROUGE_RUN_STATE.syncSummaryLifeFloors(state.run);
      persistence.recordRunHistory(state.profile, state.run, outcome, state.content);
    }
    state.ui.reviewedHistoryIndex = 0;
    clearActiveRunProfile(state);
  }

  function recordSnapshotRunHistory(state: AppState, outcome: RunHistoryEntry["outcome"]): void {
    const persistence = getPersistence();
    const snapshot = state.profile.activeRunSnapshot || persistence?.loadFromStorage?.() || null;
    if (persistence?.recordRunHistory && snapshot?.run) {
      runtimeWindow.ROUGE_RUN_STATE.syncSummaryLifeFloors(snapshot.run);
      persistence.recordRunHistory(state.profile, snapshot.run, outcome, state.content);
    }
    state.ui.reviewedHistoryIndex = 0;
    clearActiveRunProfile(state);
  }

  const { getTrainingRankCount, syncSummaryLifeFloors } = runtimeWindow.ROUGE_RUN_STATE;

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

  function getPreferredClassId(classes: ClassDefinition[], profile: ProfileState): string {
    const candidates = [profile?.meta?.progression?.preferredClassId, profile?.meta?.progression?.lastPlayedClassId];
    return candidates.find((classId) => classes.some((entry) => entry.id === classId)) || classes[0]?.id || "";
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
    if (state.run) {
      syncSummaryLifeFloors(state.run);
    }
    const snapshot = createRunSnapshot(state);
    if (!snapshot || state.phase === PHASES.ENCOUNTER || state.phase === PHASES.RUN_COMPLETE || state.phase === PHASES.RUN_FAILED) {
      return;
    }
    state.profile.activeRunSnapshot = snapshot;
    persistence?.saveToStorage?.(snapshot);
    persistProfile(state);
  }

  function normalizeLoadedPhase(phase: string): AppPhase {
    const allowedPhases = new Set([
      PHASES.SAFE_ZONE,
      PHASES.WORLD_MAP,
      PHASES.REWARD,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ]);
    return (allowedPhases.has(phase) ? phase : PHASES.SAFE_ZONE) as AppPhase;
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

  runtimeWindow.__ROUGE_APP_ENGINE_RUN = {
    PHASES,
    getPersistence,
    createFallbackProfile,
    syncProfileMetaSelection,
    loadProfile,
    persistProfile,
    clearActiveRunProfile,
    recordRunHistory,
    recordSnapshotRunHistory,
    getTrainingRankCount,
    parseInteger,
    buildMercenaryRouteCombatBonuses,
    getPhaseLabel,
    resetFrontDoorUi,
    clampRunHistoryReviewIndex,
    getPreferredClassId,
    createRunSnapshot,
    persistRunIfPossible,
    restoreSnapshotIntoState,
  };
})();
