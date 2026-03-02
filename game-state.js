(() => {
  function createPlayerState({ baseMaxHull, baseMaxEnergy, playerStartHeat, trackLanes }) {
    return {
      maxHull: baseMaxHull,
      hull: baseMaxHull,
      block: 0,
      heat: playerStartHeat,
      energy: baseMaxEnergy,
      maxEnergy: baseMaxEnergy,
      lane: Math.floor(trackLanes / 2),
      movedThisTurn: false,
      nextAttackMultiplier: 1,
      overclockUsed: false,
    };
  }

  function createFreshRunState({
    baseMaxHull,
    baseMaxEnergy,
    playerStartHeat,
    trackLanes,
    createRunSeedFn = () => 1,
    createDefaultRunStatsFn,
    createDefaultRecordHighlightsFn,
    createDefaultRunTimelineFn,
  }) {
    const runSeedRaw = Number.parseInt(createRunSeedFn(), 10);
    const runSeed = Number.isInteger(runSeedRaw) && runSeedRaw > 0 ? runSeedRaw : 1;

    return {
      phase: "player",
      turn: 1,
      sectorIndex: 0,
      runSeed,
      turnCardsPlayed: 0,
      encounterModifier: null,
      player: createPlayerState({
        baseMaxHull,
        baseMaxEnergy,
        playerStartHeat,
        trackLanes,
      }),
      enemies: [],
      telegraphs: [],
      drawPile: [],
      discardPile: [],
      hand: [],
      exhaustPile: [],
      selectedEnemyId: null,
      openEnemyTooltipId: null,
      highlightLanes: [],
      highlightLockKey: null,
      rewardChoices: [],
      artifacts: [],
      interlude: null,
      interludeDeck: [],
      runStats: createDefaultRunStatsFn(),
      runRecordHighlights: createDefaultRecordHighlightsFn(),
      runTimeline: createDefaultRunTimelineFn(),
      showFullTimeline: false,
      nextCardInstanceId: 1,
      nextTelegraphId: 1,
    };
  }

  function createInitialGameState({
    baseMaxHull,
    baseMaxEnergy,
    playerStartHeat,
    trackLanes,
    createRunSeedFn = () => 1,
    createDefaultUpgradeStateFn,
    createDefaultMetaUnlockStateFn = () => ({}),
    createDefaultMetaBranchStateFn = () => ({}),
    createDefaultRunStatsFn,
    createDefaultRunRecordsFn,
    createDefaultRecordHighlightsFn,
    createDefaultRunTimelineFn,
  }) {
    const freshRun = createFreshRunState({
      baseMaxHull,
      baseMaxEnergy,
      playerStartHeat,
      trackLanes,
      createRunSeedFn,
      createDefaultRunStatsFn,
      createDefaultRecordHighlightsFn,
      createDefaultRunTimelineFn,
    });

    return {
      ...freshRun,
      upgrades: createDefaultUpgradeStateFn(),
      metaUnlocks: createDefaultMetaUnlockStateFn(),
      metaBranches: createDefaultMetaBranchStateFn(),
      runRecords: createDefaultRunRecordsFn(),
      metaResetArmedUntil: 0,
      runRecordsResetArmedUntil: 0,
      showOnboarding: true,
      onboardingDismissed: false,
      log: "",
    };
  }

  function applyFreshRunState({
    game,
    baseMaxHull,
    baseMaxEnergy,
    playerStartHeat,
    trackLanes,
    createRunSeedFn = () => 1,
    createDefaultRunStatsFn,
    createDefaultRecordHighlightsFn,
    createDefaultRunTimelineFn,
  }) {
    const freshRun = createFreshRunState({
      baseMaxHull,
      baseMaxEnergy,
      playerStartHeat,
      trackLanes,
      createRunSeedFn,
      createDefaultRunStatsFn,
      createDefaultRecordHighlightsFn,
      createDefaultRunTimelineFn,
    });

    Object.assign(game, freshRun);
    return game;
  }

  window.BRASSLINE_GAME_STATE = {
    createPlayerState,
    createFreshRunState,
    createInitialGameState,
    applyFreshRunState,
  };
})();
