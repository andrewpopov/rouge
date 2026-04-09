/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    addBonusSet,
    clamp,
    createDefaultAttributes,
    createDefaultClassProgression,
    createDefaultInventory,
    createDefaultGuideState,
    createDefaultProgression,
    createDefaultSummary,
    createDefaultTownState,
    createDefaultTraining,
    createDefaultWorldState,
    getLevelForXp,
    recordSummaryLifeFloor,
    syncSummaryLifeFloors,
    toBonusValue,
  } = runtimeWindow.ROUGE_RUN_STATE;
  const {
    createActState,
    getCurrentAct,
    getCurrentZones,
    getReachableZones,
    getZoneById,
    normalizeRunActs,
    recomputeZoneStatuses,
    syncCurrentActFields,
  } = runtimeWindow.ROUGE_RUN_ROUTE_BUILDER;
  const {
    applyProgressionAction,
    buildProgressionBonuses,
    getProgressionSummary,
    listProgressionActions,
    syncLevelProgression,
    syncUnlockedClassSkills,
  } = runtimeWindow.ROUGE_RUN_PROGRESSION;
  const {
    actIsComplete,
    advanceToNextAct,
    applyReward,
    buildEncounterReward: buildBaseEncounterReward,
    runIsComplete,
  } = runtimeWindow.ROUGE_RUN_REWARD_FLOW;
  const CONSEQUENCE_ENCOUNTER_ZONE_ROLES = new Set(["branchBattle", "branchMiniboss", "boss"]);
  const CONSEQUENCE_REWARD_ZONE_ROLES = new Set(["branchBattle", "branchMiniboss", "boss"]);

  function hashString(value: string) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeRunSeed(seed: unknown, fallbackSource: string) {
    const parsed = Number(seed);
    if (Number.isFinite(parsed)) {
      const normalized = parsed >>> 0;
      if (normalized > 0) {
        return normalized;
      }
    }
    return hashString(fallbackSource) || 1;
  }

  function getCombatBonuses(run: RunState, content: GameContent, profile?: ProfileState | null): ItemBonusSet {
    const total: ItemBonusSet = {};
    addBonusSet(total, buildProgressionBonuses(run, content));
    addBonusSet(total, runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatBonuses(run, content) || {});
    addBonusSet(total, runtimeWindow.ROUGE_CHARM_SYSTEM?.buildCharmBonuses(profile, run.classId) || {});
    return total;
  }

  function buildCombatBonuses(run: RunState, content: GameContent, profile?: ProfileState | null): ItemBonusSet {
    return getCombatBonuses(run, content, profile);
  }

  function hydrateRun(run: RunState, content: GameContent) {
    run.seed = normalizeRunSeed(run.seed, [run.id || "run", run.classId || "class", String(run.level || 1)].join("|"));
    run.world = {
      ...createDefaultWorldState(),
      ...(run.world || {}),
      resolvedNodeIds: Array.isArray(run.world?.resolvedNodeIds) ? [...run.world.resolvedNodeIds] : [],
      questOutcomes: run.world?.questOutcomes || {},
      shrineOutcomes: run.world?.shrineOutcomes || {},
      eventOutcomes: run.world?.eventOutcomes || {},
      opportunityOutcomes: run.world?.opportunityOutcomes || {},
      worldFlags: Array.isArray(run.world?.worldFlags) ? [...run.world.worldFlags] : [],
    };
    normalizeRunActs(run);
    syncCurrentActFields(run);
    run.progression = {
      ...createDefaultProgression(),
      ...(run.progression || {}),
      bossTrophies: Array.isArray(run.progression?.bossTrophies) ? [...run.progression.bossTrophies] : [],
      activatedRunewords: Array.isArray(run.progression?.activatedRunewords) ? [...run.progression.activatedRunewords] : [],
      skillPointsAvailable: toBonusValue(run.progression?.skillPointsAvailable),
      trainingPointsSpent: toBonusValue(run.progression?.trainingPointsSpent),
      classPointsAvailable: toBonusValue(run.progression?.classPointsAvailable),
      classPointsSpent: toBonusValue(run.progression?.classPointsSpent),
      attributePointsAvailable: toBonusValue(run.progression?.attributePointsAvailable),
      attributePointsSpent: toBonusValue(run.progression?.attributePointsSpent),
      attributes: {
        ...createDefaultAttributes(),
        ...(run.progression?.attributes || {}),
      },
      classProgression: {
        ...createDefaultClassProgression(),
        ...(run.progression?.classProgression || {}),
        treeRanks: { ...(run.progression?.classProgression?.treeRanks || {}) },
        unlockedSkillIds: Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
          ? [...run.progression.classProgression.unlockedSkillIds]
          : [],
        equippedSkillBar: {
          slot1SkillId: run.progression?.classProgression?.equippedSkillBar?.slot1SkillId || "",
          slot2SkillId: run.progression?.classProgression?.equippedSkillBar?.slot2SkillId || "",
          slot3SkillId: run.progression?.classProgression?.equippedSkillBar?.slot3SkillId || "",
        },
        archetypeScores: { ...(run.progression?.classProgression?.archetypeScores || {}) },
        counterCoverageTags: Array.isArray(run.progression?.classProgression?.counterCoverageTags)
          ? [...run.progression.classProgression.counterCoverageTags]
          : [],
      },
      training: {
        ...createDefaultTraining(),
        ...(run.progression?.training || {}),
      },
    };
    run.summary = {
      ...createDefaultSummary(),
      ...(run.summary || {}),
    };
    syncSummaryLifeFloors(run);
    run.inventory = {
      ...createDefaultInventory(),
      ...(run.inventory || {}),
      nextEntryId: Math.max(1, toBonusValue(run.inventory?.nextEntryId) || 1),
      carried: Array.isArray(run.inventory?.carried) ? [...run.inventory.carried] : [],
    };
    let overlayKind: RunGuideState["overlayKind"] = "";
    if (run.guide?.overlayKind === "reward") {
      overlayKind = "reward";
    } else if (run.guide?.overlayKind === "intro") {
      overlayKind = "intro";
    }
    run.guide = {
      ...createDefaultGuideState(),
      ...(run.guide || {}),
      seenIntroActNumbers: Array.isArray(run.guide?.seenIntroActNumbers) ? [...run.guide.seenIntroActNumbers] : [],
      overlayKind,
      targetActNumber: Math.max(0, toBonusValue(run.guide?.targetActNumber)),
    };
    run.town = {
      ...createDefaultTownState(),
      ...(run.town || {}),
      vendor: {
        ...createDefaultTownState().vendor,
        ...(run.town?.vendor || {}),
        refreshCount: toBonusValue(run.town?.vendor?.refreshCount),
        stock: Array.isArray(run.town?.vendor?.stock) ? [...run.town.vendor.stock] : [],
      },
    };
    run.level = Math.max(getLevelForXp(run.xp), Math.max(1, toBonusValue(run.level)));
    if (!run.loadout || typeof run.loadout !== "object") {
      run.loadout = {
        weapon: null,
        armor: null,
        helm: null,
        shield: null,
        gloves: null,
        boots: null,
        belt: null,
        ring1: null,
        ring2: null,
        amulet: null,
      };
    }

    syncLevelProgression(run);
    syncUnlockedClassSkills(run, content);
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunLoadout(run, content);
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunInventory(run, content);
    syncCurrentActFields(run);
    recomputeZoneStatuses(run);
    return run;
  }

  function createRun({
    content,
    seedBundle,
    classDefinition,
    heroDefinition,
    mercenaryId,
    starterDeck,
    runSeed,
  }: {
    content: GameContent;
    seedBundle: SeedBundle;
    classDefinition: ClassDefinition;
    heroDefinition: HeroDefinition;
    mercenaryId: string;
    starterDeck: string[];
    runSeed?: number;
  }) {
    const mercenaryDefinition = content.mercenaryCatalog[mercenaryId];
    const actSeeds = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const acts = actSeeds.map((actSeed: ActSeed) =>
      createActState(actSeed, bossEntries.find((entry: BossEntry) => entry.id === actSeed.boss.id) || null, content)
    );
    const seed = normalizeRunSeed(
      runSeed,
      [classDefinition.id, mercenaryId, starterDeck.join("|"), String(heroDefinition.maxLife), String(actSeeds.length)].join("|")
    );

    const run = {
      id: `run_${classDefinition.id}_${seed.toString(36)}`,
      seed,
      currentActIndex: 0,
      acts,
      actNumber: 1,
      actTitle: "",
      safeZoneName: "",
      bossName: "",
      classId: classDefinition.id,
      className: classDefinition.name,
      hero: {
        ...heroDefinition,
        currentLife: heroDefinition.maxLife,
      },
      mercenary: {
        ...mercenaryDefinition,
        currentLife: mercenaryDefinition.maxLife,
      },
      deck: [...starterDeck],
      gold: 0,
      xp: 0,
      level: 1,
      belt: {
        current: 2,
        max: 3,
      },
      inventory: createDefaultInventory(),
      loadout: {
        weapon: null as RunEquipmentState | null,
        armor: null as RunEquipmentState | null,
        helm: null as RunEquipmentState | null,
        shield: null as RunEquipmentState | null,
        gloves: null as RunEquipmentState | null,
        boots: null as RunEquipmentState | null,
        belt: null as RunEquipmentState | null,
        ring1: null as RunEquipmentState | null,
        ring2: null as RunEquipmentState | null,
        amulet: null as RunEquipmentState | null,
      },
      town: createDefaultTownState(),
      progression: createDefaultProgression(),
      activeZoneId: "",
      activeEncounterId: "",
      pendingReward: null as RunReward | null,
      guide: createDefaultGuideState(),
      world: createDefaultWorldState(),
      summary: createDefaultSummary(),
    };

    return hydrateRun(run, content);
  }

  function includesRequiredValues(requiredValues: string[] | undefined, actualValues: string[]): boolean {
    const expectedValues = Array.isArray(requiredValues) ? requiredValues : [];
    return expectedValues.every((value) => actualValues.includes(value));
  }

  function resolveConsequenceEncounterId(run: RunState, zone: ZoneState, content: GameContent | null | undefined): string | null {
    if (!zone || zone.encountersCleared > 0 || !CONSEQUENCE_ENCOUNTER_ZONE_ROLES.has(String(zone.zoneRole || ""))) {
      return null;
    }

    const actPackages = Array.isArray(content?.consequenceEncounterPackages?.[zone.actNumber])
      ? content.consequenceEncounterPackages[zone.actNumber]
      : [];
    if (actPackages.length === 0) {
      return null;
    }

    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const matchingPackages = actPackages.filter((encounterPackage) => {
      return encounterPackage?.zoneRole === zone.zoneRole && includesRequiredValues(encounterPackage.requiredFlagIds, worldFlags);
    });
    if (matchingPackages.length === 0) {
      return null;
    }

    const maxSpecificity = matchingPackages.reduce((maxValue, encounterPackage) => {
      return Math.max(maxValue, Array.isArray(encounterPackage?.requiredFlagIds) ? encounterPackage.requiredFlagIds.length : 0);
    }, 0);
    const mostSpecificMatches = matchingPackages.filter((encounterPackage) => {
      return (Array.isArray(encounterPackage?.requiredFlagIds) ? encounterPackage.requiredFlagIds.length : 0) === maxSpecificity;
    });
    if (mostSpecificMatches.length > 1) {
      throw new Error(
        `Zone "${zone.id}" has ambiguous consequence encounter packages: ${mostSpecificMatches
          .map((encounterPackage) => encounterPackage.id || encounterPackage.encounterId || "unknown")
          .join(", ")}.`
      );
    }

    return mostSpecificMatches[0]?.encounterId || null;
  }

  function parseRewardGrantValue(value: unknown): number {
    const parsed = Number.parseInt(String(value ?? 0), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function resolveConsequenceRewardPackage(
    run: RunState,
    zone: ZoneState,
    content: GameContent | null | undefined
  ): ConsequenceRewardPackageDefinition | null {
    if (!zone || zone.encountersCleared > 0 || !CONSEQUENCE_REWARD_ZONE_ROLES.has(String(zone.zoneRole || ""))) {
      return null;
    }

    const actPackages = Array.isArray(content?.consequenceRewardPackages?.[zone.actNumber])
      ? content.consequenceRewardPackages[zone.actNumber]
      : [];
    if (actPackages.length === 0) {
      return null;
    }

    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const matchingPackages = actPackages.filter((rewardPackage) => {
      return rewardPackage?.zoneRole === zone.zoneRole && includesRequiredValues(rewardPackage.requiredFlagIds, worldFlags);
    });
    if (matchingPackages.length === 0) {
      return null;
    }

    const maxSpecificity = matchingPackages.reduce((maxValue, rewardPackage) => {
      return Math.max(maxValue, Array.isArray(rewardPackage?.requiredFlagIds) ? rewardPackage.requiredFlagIds.length : 0);
    }, 0);
    const mostSpecificMatches = matchingPackages.filter((rewardPackage) => {
      return (Array.isArray(rewardPackage?.requiredFlagIds) ? rewardPackage.requiredFlagIds.length : 0) === maxSpecificity;
    });
    if (mostSpecificMatches.length > 1) {
      throw new Error(
        `Zone "${zone.id}" has ambiguous consequence reward packages: ${mostSpecificMatches
          .map((rewardPackage) => rewardPackage.id || rewardPackage.title || "unknown")
          .join(", ")}.`
      );
    }

    return mostSpecificMatches[0] || null;
  }

  function buildEncounterReward(config: {
    run: RunState;
    zone: ZoneState;
    combatState: CombatState;
    content: GameContent;
    profile?: ProfileState | null;
  }): RunReward {
    const reward = buildBaseEncounterReward(config);
    const rewardPackage = resolveConsequenceRewardPackage(config.run, config.zone, config.content);
    if (!rewardPackage) {
      return reward;
    }

    const bonusGold = Math.max(0, parseRewardGrantValue(rewardPackage.grants?.gold));
    const bonusXp = Math.max(0, parseRewardGrantValue(rewardPackage.grants?.xp));
    const bonusPotions = Math.max(0, parseRewardGrantValue(rewardPackage.grants?.potions));
    reward.grants = {
      gold: parseRewardGrantValue(reward.grants?.gold) + bonusGold,
      xp: parseRewardGrantValue(reward.grants?.xp) + bonusXp,
      potions: parseRewardGrantValue(reward.grants?.potions) + bonusPotions,
    };

    const packageLines = [`Late-route payoff: ${rewardPackage.title}.`];
    if (bonusGold > 0) {
      packageLines.push(`+${bonusGold} bonus gold.`);
    }
    if (bonusXp > 0) {
      packageLines.push(`+${bonusXp} bonus experience.`);
    }
    if (bonusPotions > 0) {
      packageLines.push(`+${bonusPotions} potion charge${bonusPotions === 1 ? "" : "s"}.`);
    }
    packageLines.push(...(Array.isArray(rewardPackage.bonusLines) ? rewardPackage.bonusLines : []));

    const chooseLineIndex = reward.lines.findIndex((line) => line === "Choose one reward to shape the run.");
    const insertIndex = chooseLineIndex >= 0 ? chooseLineIndex : reward.lines.length;
    reward.lines = [...reward.lines];
    reward.lines.splice(insertIndex, 0, ...packageLines);
    return reward;
  }

  function beginZone(run: RunState, zoneId: string, content: GameContent | null = null) {
    const zone = getZoneById(run, zoneId);
    if (!zone) {
      return { ok: false, message: "Unknown zone." };
    }
    recomputeZoneStatuses(run);
    if (zone.status !== "available") {
      return { ok: false, message: "Zone is not available." };
    }

    const previousVisited = zone.visited;
    const previousActiveZoneId = run.activeZoneId;
    const previousActiveEncounterId = run.activeEncounterId;
    zone.visited = true;
    run.activeZoneId = zone.id;

    if (runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone)) {
      run.activeEncounterId = "";
      try {
        const reward = runtimeWindow.ROUGE_WORLD_NODES.buildZoneReward({
          run,
          zone,
          content,
        });
        return {
          ok: true,
          type: "reward",
          zone,
          reward,
        };
      } catch (error) {
        zone.visited = previousVisited;
        run.activeZoneId = previousActiveZoneId;
        run.activeEncounterId = previousActiveEncounterId;
        return {
          ok: false,
          message: error instanceof Error ? error.message : "World node resolution failed.",
        };
      }
    }

    let encounterId = zone.encounterIds[zone.encountersCleared];
    try {
      encounterId = resolveConsequenceEncounterId(run, zone, content) || encounterId;
    } catch (error) {
      zone.visited = previousVisited;
      run.activeZoneId = previousActiveZoneId;
      run.activeEncounterId = previousActiveEncounterId;
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Encounter resolution failed.",
      };
    }
    if (!encounterId) {
      return { ok: false, message: "Zone is missing an encounter definition." };
    }

    run.activeEncounterId = encounterId;
    return {
      ok: true,
      type: "encounter",
      zone,
      encounterId,
      encounterIndex: zone.encountersCleared + 1,
      encounterTotal: zone.encounterTotal,
    };
  }

  function snapshotPartyFromCombat(run: RunState, combatState: CombatState, content: GameContent, profile?: ProfileState | null) {
    const bonuses = getCombatBonuses(run, content, profile);
    run.hero.currentLife = Math.max(0, combatState.hero.life);
    run.hero.maxLife = Math.max(1, combatState.hero.maxLife - toBonusValue(bonuses.heroMaxLife));
    run.hero.maxEnergy = Math.max(1, combatState.hero.maxEnergy - toBonusValue(bonuses.heroMaxEnergy));
    run.hero.handSize = Math.max(1, combatState.hero.handSize - toBonusValue(bonuses.heroHandSize));
    run.hero.potionHeal = Math.max(1, combatState.hero.potionHeal - toBonusValue(bonuses.heroPotionHeal));
    run.mercenary.currentLife = Math.max(0, combatState.mercenary.life);
    run.mercenary.maxLife = Math.max(1, combatState.mercenary.maxLife - toBonusValue(bonuses.mercenaryMaxLife));
    run.mercenary.attack = Math.max(0, combatState.mercenary.attack - toBonusValue(bonuses.mercenaryAttack));
    run.belt.current = combatState.potions;
    run.summary.enemiesDefeated = toBonusValue(run.summary?.enemiesDefeated, 0) + combatState.enemies.filter((enemy) => !enemy.alive).length;
    run.summary.cardsPlayed = toBonusValue(run.summary?.cardsPlayed, 0) + toBonusValue(combatState.cardsPlayed, 0);
    run.summary.potionsUsed = toBonusValue(run.summary?.potionsUsed, 0) + toBonusValue(combatState.potionsUsed, 0);
    recordSummaryLifeFloor(run.summary, "hero", combatState.lowestHeroLife, run.hero.maxLife);
    recordSummaryLifeFloor(run.summary, "mercenary", combatState.lowestMercenaryLife, run.mercenary.maxLife);
    syncSummaryLifeFloors(run);
  }

  function createCombatOverrides(run: RunState, content: GameContent, profile?: ProfileState | null) {
    const bonuses = getCombatBonuses(run, content, profile);
    const heroMaxLife = run.hero.maxLife + toBonusValue(bonuses.heroMaxLife);
    const heroMaxEnergy = clamp(run.hero.maxEnergy + toBonusValue(bonuses.heroMaxEnergy), 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
    const heroHandSize = run.hero.handSize + toBonusValue(bonuses.heroHandSize);
    const heroPotionHeal = run.hero.potionHeal + toBonusValue(bonuses.heroPotionHeal);
    // Mercenary auto-scales with act progression: +8 HP and +1 ATK per act
    const actIndex = Math.max(0, run.currentActIndex || 0);
    const mercenaryMaxLife = run.mercenary.maxLife + toBonusValue(bonuses.mercenaryMaxLife) + actIndex * 8;
    const mercenaryAttack = run.mercenary.attack + toBonusValue(bonuses.mercenaryAttack) + actIndex;

    return {
      heroState: {
        ...run.hero,
        maxLife: heroMaxLife,
        maxEnergy: heroMaxEnergy,
        handSize: heroHandSize,
        potionHeal: heroPotionHeal,
        life: clamp(run.hero.currentLife, 0, heroMaxLife),
        damageBonus: toBonusValue(bonuses.heroDamageBonus),
        guardBonus: toBonusValue(bonuses.heroGuardBonus),
        burnBonus: toBonusValue(bonuses.heroBurnBonus),
      },
      mercenaryState: {
        ...run.mercenary,
        maxLife: mercenaryMaxLife,
        attack: mercenaryAttack,
        life: clamp(run.mercenary.currentLife, 0, mercenaryMaxLife),
      },
      starterDeck: [...run.deck],
      initialPotions: run.belt.current,
    };
  }

  runtimeWindow.ROUGE_RUN_FACTORY = {
    createRun,
    hydrateRun,
    createCombatOverrides,
    beginZone,
    getCurrentAct,
    getCurrentZones,
    getZoneById,
    getReachableZones,
    recomputeZoneStatuses,
    snapshotPartyFromCombat,
    buildEncounterReward,
    applyReward,
    buildCombatBonuses,
    getProgressionSummary,
    listProgressionActions,
    applyProgressionAction,
    actIsComplete,
    runIsComplete,
    advanceToNextAct,
  };
})();
