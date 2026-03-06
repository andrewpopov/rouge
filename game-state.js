(() => {
  function cloneQuestState(value) {
    if (!value || typeof value !== "object") {
      return {
        activeQuestIds: [],
        completedQuestIds: [],
      };
    }

    return {
      ...value,
      activeQuestIds: Array.isArray(value.activeQuestIds) ? [...value.activeQuestIds] : [],
      activeQuests: Array.isArray(value.activeQuests)
        ? value.activeQuests.map((quest) => (quest && typeof quest === "object" ? JSON.parse(JSON.stringify(quest)) : null)).filter(Boolean)
        : undefined,
      completedQuestIds: Array.isArray(value.completedQuestIds) ? [...value.completedQuestIds] : [],
      failedQuestIds: Array.isArray(value.failedQuestIds) ? [...value.failedQuestIds] : undefined,
    };
  }

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
      nextAttackFlatBonus: 0,
      pendingEnergyNextTurn: 0,
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
    createDefaultRunGearStateFn = () => ({
      gearInventory: [],
      equippedGear: {
        weapon: "",
        armor: "",
        trinket: "",
      },
    }),
    createDefaultQuestStateFn = () => ({
      activeQuestIds: [],
      completedQuestIds: [],
    }),
    createDefaultRewardTreeStateFn = () => ({
      objectives: {
        sectorsCleared: 0,
        bossKills: 0,
        flawlessClears: 0,
        speedClears: 0,
      },
      unlockedNodeIds: [],
    }),
    createDefaultClassStateFn = () => ({
      classId: "",
      level: 1,
      xp: 0,
      skillPoints: 0,
      statPoints: 0,
      allocatedStats: {
        strength: 0,
        dexterity: 0,
        vitality: 0,
        energy: 0,
      },
      nodeRanks: {},
      cooldowns: {},
      spellRanks: {},
      baseStats: {},
      baseResistances: {},
    }),
  }) {
    const runSeedRaw = Number.parseInt(createRunSeedFn(), 10);
    const runSeed = Number.isInteger(runSeedRaw) && runSeedRaw > 0 ? runSeedRaw : 1;
    const runGearState = createDefaultRunGearStateFn();
    const questState = createDefaultQuestStateFn();
    const rewardTreeState = createDefaultRewardTreeStateFn();
    const classState = createDefaultClassStateFn();

    return {
      phase: "encounter",
      combatSubphase: "player_turn",
      turn: 1,
      sectorIndex: 0,
      stageNodeIndex: 0,
      stageNodesBySector: [],
      stageProgress: {
        totalNodes: 0,
        completedNodes: 0,
        nodesInSector: 1,
        stageNodeIndex: 0,
      },
      runSeed,
      turnCardsPlayed: 0,
      turnSpellActionsUsed: 0,
      encounterModifier: null,
      player: createPlayerState({
        baseMaxHull,
        baseMaxEnergy,
        playerStartHeat,
        trackLanes,
      }),
      enemies: [],
      telegraphs: [],
      recentImpacts: [],
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
      gearInventory: Array.isArray(runGearState?.gearInventory) ? [...runGearState.gearInventory] : [],
      equippedGear:
        runGearState?.equippedGear && typeof runGearState.equippedGear === "object"
          ? { ...runGearState.equippedGear }
          : { weapon: "", armor: "", trinket: "" },
      questState:
        questState && typeof questState === "object"
          ? cloneQuestState(questState)
          : cloneQuestState(null),
      rewardTreeState:
        rewardTreeState && typeof rewardTreeState === "object"
          ? {
              objectives:
                rewardTreeState.objectives && typeof rewardTreeState.objectives === "object"
                  ? { ...rewardTreeState.objectives }
                  : { sectorsCleared: 0, bossKills: 0, flawlessClears: 0, speedClears: 0 },
              unlockedNodeIds: Array.isArray(rewardTreeState.unlockedNodeIds)
                ? [...rewardTreeState.unlockedNodeIds]
                : [],
            }
          : {
              objectives: { sectorsCleared: 0, bossKills: 0, flawlessClears: 0, speedClears: 0 },
              unlockedNodeIds: [],
            },
      interlude: null,
      interludeDeck: [],
      classState:
        classState && typeof classState === "object"
          ? {
              ...classState,
              nodeRanks:
                classState.nodeRanks && typeof classState.nodeRanks === "object"
                  ? { ...classState.nodeRanks }
                  : {},
              cooldowns:
                classState.cooldowns && typeof classState.cooldowns === "object"
                  ? { ...classState.cooldowns }
                  : {},
              spellRanks:
                classState.spellRanks && typeof classState.spellRanks === "object"
                  ? { ...classState.spellRanks }
                  : {},
              allocatedStats:
                classState.allocatedStats && typeof classState.allocatedStats === "object"
                  ? { ...classState.allocatedStats }
                  : { strength: 0, dexterity: 0, vitality: 0, energy: 0 },
              baseStats:
                classState.baseStats && typeof classState.baseStats === "object"
                  ? { ...classState.baseStats }
                  : {},
              baseResistances:
                classState.baseResistances && typeof classState.baseResistances === "object"
                  ? { ...classState.baseResistances }
                  : {},
            }
          : createDefaultClassStateFn(),
      classItems: [],
      gold: 0,
      healingPotions: 0,
      itemUpgradeTokens: 0,
      runStats: createDefaultRunStatsFn(),
      runRecordHighlights: createDefaultRecordHighlightsFn(),
      runTimeline: createDefaultRunTimelineFn(),
      showFullTimeline: false,
      sectorDamageTakenStart: 0,
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
    createDefaultRunGearStateFn,
    createDefaultQuestStateFn,
    createDefaultRewardTreeStateFn,
    createDefaultClassStateFn,
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
      createDefaultRunGearStateFn,
      createDefaultQuestStateFn,
      createDefaultRewardTreeStateFn,
      createDefaultClassStateFn,
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
    createDefaultRunGearStateFn,
    createDefaultQuestStateFn,
    createDefaultRewardTreeStateFn,
    createDefaultClassStateFn,
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
      createDefaultRunGearStateFn,
      createDefaultQuestStateFn,
      createDefaultRewardTreeStateFn,
      createDefaultClassStateFn,
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
