/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;
  const dataApi = registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_DATA as {
    CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number>;
    TREE_RANK_SCORE_WEIGHT: number;
    FAVORED_TREE_SCORE_BONUS: number;
    PRIMARY_TREE_CARD_SCORE_MULTIPLIER: number;
    SUPPORT_TREE_CARD_SCORE_MULTIPLIER: number;
    SECONDARY_WEAPON_FAMILY_THRESHOLD: number;
    BUILD_PATHS: Record<string, Record<string, {
      label: string;
      primaryTrees: string[];
      supportTrees: string[];
      targetBand: "flagship" | "secondary";
      behaviorTags: CardBehaviorTag[];
      counterTags: CounterTag[];
      splashRole: CardSplashRole;
    }>>;
    ARCHETYPE_WEAPON_FAMILIES: Record<string, string[]>;
  };
  const classificationApi = registryWindow.__ROUGE_REWARD_ENGINE_CARD_CLASSIFICATION as {
    getCard(cardId: string, content?: GameContent | null): CardDefinition | null;
    getCardTree(cardId: string): string;
    getCardClassId(cardId: string, card?: CardDefinition | null): string;
    inferCardRewardRole(cardId: string, card: CardDefinition | null): CardRewardRole;
    inferCardRoleTag(cardId: string, card: CardDefinition | null): CardRoleTag;
    inferCardBehaviorTags(cardId: string, card: CardDefinition | null): CardBehaviorTag[];
    inferCardCounterTags(cardId: string, card: CardDefinition | null): CounterTag[];
    inferCardSplashRole(cardId: string, card: CardDefinition | null): CardSplashRole;
    buildCardArchetypeTags(cardId: string, card?: CardDefinition | null): string[];
  };

  const {
    CARD_ROLE_SCORE_WEIGHTS,
    TREE_RANK_SCORE_WEIGHT,
    FAVORED_TREE_SCORE_BONUS,
    PRIMARY_TREE_CARD_SCORE_MULTIPLIER,
    SUPPORT_TREE_CARD_SCORE_MULTIPLIER,
    SECONDARY_WEAPON_FAMILY_THRESHOLD,
    BUILD_PATHS,
    ARCHETYPE_WEAPON_FAMILIES,
  } = dataApi;

  const EARLY_PATH_SCORE_LEAD_THRESHOLD = 6;
  const EARLY_PATH_TREE_RANK_THRESHOLD = 3;
  const FLAGSHIP_SUPPORT_WITHOUT_PRIMARY_MULTIPLIER = 0.35;
  const FLAGSHIP_SUPPORT_SINGLE_PRIMARY_MULTIPLIER = 0.7;
  const SECONDARY_SUPPORT_BASE_MULTIPLIER = 0.55;
  const HYBRID_SUPPORT_BASE_MULTIPLIER = 0.4;

  function uniqueTags<T>(values: T[]) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function buildTreeCardCounts(run: RunState) {
    const counts: Record<string, number> = {};
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const treeId = classificationApi.getCardTree(cardId);
      if (!treeId) {
        return;
      }
      counts[treeId] = toNumber(counts[treeId], 0) + 1;
    });
    return counts;
  }

  function getArchetypePathForId(archetypeId: string) {
    const classId = String(archetypeId || "").split("_")[0] || "";
    return BUILD_PATHS[classId]?.[archetypeId] || null;
  }

  function getArchetypeIdsForSupportTree(classId: string, supportTreeId: string) {
    return Object.entries(BUILD_PATHS[classId] || {})
      .filter(([, path]) => path.primaryTrees.includes(supportTreeId))
      .map(([archetypeId]) => archetypeId);
  }

  function getDeckProfileId(content: GameContent, classId: string) {
    return content.classDeckProfiles?.[classId] || "warrior";
  }

  function getBuildPath(classId: string, treeId: string) {
    return BUILD_PATHS[classId]?.[treeId] || null;
  }

  function getArchetypeCatalog(classId?: string) {
    const classIds = classId ? [classId] : Object.keys(BUILD_PATHS);
    return Object.fromEntries(
      classIds
        .filter((candidateClassId) => Boolean(BUILD_PATHS[candidateClassId]))
        .map((candidateClassId) => [
          candidateClassId,
          Object.fromEntries(
            Object.entries(BUILD_PATHS[candidateClassId] || {}).map(([archetypeId, path]) => [
              archetypeId,
              {
                archetypeId,
                label: path.label,
                primaryTrees: [...path.primaryTrees],
                supportTrees: [...path.supportTrees],
                weaponFamilies: [...(ARCHETYPE_WEAPON_FAMILIES[archetypeId] || [])],
                targetBand: path.targetBand,
                behaviorTags: [...path.behaviorTags],
                counterTags: [...path.counterTags],
                splashRole: path.splashRole,
              },
            ])
          ),
        ])
    );
  }

  function annotateCardRewardMetadata(content: GameContent) {
    Object.values(content?.cardCatalog || {}).forEach((card: CardDefinition) => {
      if (!card) {
        return;
      }
      card.rewardRole = (card.rewardRole as CardRewardRole | undefined) || classificationApi.inferCardRewardRole(card.id, card);
      card.archetypeTags = Array.isArray(card.archetypeTags) && card.archetypeTags.length > 0
        ? [...card.archetypeTags]
        : classificationApi.buildCardArchetypeTags(card.id, card);
      card.behaviorTags = Array.isArray(card.behaviorTags) && card.behaviorTags.length > 0
        ? [...card.behaviorTags]
        : classificationApi.inferCardBehaviorTags(card.id, card);
      card.roleTag = (card.roleTag as CardRoleTag | undefined) || classificationApi.inferCardRoleTag(card.id, card);
      card.counterTags = Array.isArray(card.counterTags) && card.counterTags.length > 0
        ? [...card.counterTags]
        : classificationApi.inferCardCounterTags(card.id, card);
      card.splashRole = (card.splashRole as CardSplashRole | undefined) || classificationApi.inferCardSplashRole(card.id, card);
    });
  }

  function getCardRewardRole(cardId: string, content: GameContent | null = null): CardRewardRole {
    const card = classificationApi.getCard(cardId, content);
    return (card?.rewardRole as CardRewardRole | undefined) || classificationApi.inferCardRewardRole(cardId, card);
  }

  function getCardArchetypeTags(cardId: string, content: GameContent | null = null) {
    const card = classificationApi.getCard(cardId, content);
    return Array.isArray(card?.archetypeTags) ? [...card.archetypeTags] : classificationApi.buildCardArchetypeTags(cardId, card);
  }

  function getArchetypeLabels(archetypeTags: string[]) {
    return archetypeTags
      .map((tag) => {
        const classId = tag.split("_").shift() || "";
        return BUILD_PATHS[classId]?.[tag]?.label || "";
      })
      .filter(Boolean);
  }

  function getArchetypeWeaponFamilies(archetypeId: string) {
    return [...(ARCHETYPE_WEAPON_FAMILIES[archetypeId] || [])];
  }

  function createEmptyArchetypeScores(classId: string) {
    return Object.fromEntries(
      Object.keys(BUILD_PATHS[classId] || {}).map((archetypeId) => [archetypeId, 0])
    ) as Record<string, number>;
  }

  function getArchetypePrimaryCardCount(
    path: {
      primaryTrees: string[];
      supportTrees: string[];
      targetBand: "flagship" | "secondary";
      splashRole: CardSplashRole;
    },
    treeCardCounts: Record<string, number>
  ) {
    return path.primaryTrees.reduce((total, primaryTreeId) => total + toNumber(treeCardCounts[primaryTreeId], 0), 0);
  }

  function getSecondarySupportPresenceMultiplier(
    path: {
      targetBand: "flagship" | "secondary";
      splashRole: CardSplashRole;
    },
    primaryCardCount: number
  ) {
    if (path.splashRole === "hybrid_only") {
      if (primaryCardCount >= 4) {
        return 1;
      }
      if (primaryCardCount === 3) {
        return 0.8;
      }
      if (primaryCardCount === 2) {
        return 0.45;
      }
      if (primaryCardCount === 1) {
        return 0.18;
      }
      return 0.05;
    }
    if (primaryCardCount >= 4) {
      return 1;
    }
    if (primaryCardCount === 3) {
      return 0.85;
    }
    if (primaryCardCount === 2) {
      return 0.55;
    }
    if (primaryCardCount === 1) {
      return 0.25;
    }
    return 0.05;
  }

  function getSupportTreeCardScoreMultiplier(
    path: {
      targetBand: "flagship" | "secondary";
      splashRole: CardSplashRole;
    },
    primaryCardCount: number,
    role: CardRewardRole
  ) {
    if (path.targetBand === "flagship") {
      if (primaryCardCount >= 2) {
        return SUPPORT_TREE_CARD_SCORE_MULTIPLIER;
      }
      if (primaryCardCount === 1) {
        return SUPPORT_TREE_CARD_SCORE_MULTIPLIER * FLAGSHIP_SUPPORT_SINGLE_PRIMARY_MULTIPLIER;
      }
      return SUPPORT_TREE_CARD_SCORE_MULTIPLIER * FLAGSHIP_SUPPORT_WITHOUT_PRIMARY_MULTIPLIER;
    }
    const bandBaseMultiplier = path.splashRole === "hybrid_only"
      ? HYBRID_SUPPORT_BASE_MULTIPLIER
      : SECONDARY_SUPPORT_BASE_MULTIPLIER;
    const presenceMultiplier = getSecondarySupportPresenceMultiplier(path, primaryCardCount);
    let roleMultiplier = 1;
    if (role === "engine") {
      roleMultiplier = 0.45;
    } else if (role === "foundation") {
      roleMultiplier = 0.7;
    }
    return SUPPORT_TREE_CARD_SCORE_MULTIPLIER * bandBaseMultiplier * presenceMultiplier * roleMultiplier;
  }

  function getArchetypeCardMatchMultiplier(
    classId: string,
    archetypeId: string,
    treeId: string,
    role: CardRewardRole,
    treeCardCounts: Record<string, number>
  ) {
    const path = BUILD_PATHS[classId]?.[archetypeId];
    if (!path || !treeId) {
      return 0;
    }
    if (path.primaryTrees.includes(treeId)) {
      return PRIMARY_TREE_CARD_SCORE_MULTIPLIER;
    }
    if (path.supportTrees.includes(treeId)) {
      const primaryCardCount = getArchetypePrimaryCardCount(path, treeCardCounts);
      return getSupportTreeCardScoreMultiplier(path, primaryCardCount, role);
    }
    return 0;
  }

  function sortArchetypeScoreEntries(classId: string, scores: Record<string, number>) {
    const classPaths = BUILD_PATHS[classId] || {};
    return Object.entries(scores || {})
      .filter(([archetypeId]) => Boolean(classPaths[archetypeId]))
      .map(([archetypeId, rawScore]) => ({
        archetypeId,
        label: classPaths[archetypeId].label,
        score: Math.max(0, toNumber(rawScore, 0)),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  }

  function computeArchetypeScores(run: RunState, content: GameContent) {
    annotateCardRewardMetadata(content);
    const scores = createEmptyArchetypeScores(run.classId);
    const classProgression = run.progression?.classProgression;
    const favoredTreeId = classProgression?.favoredTreeId || "";
    const treeCardCounts = buildTreeCardCounts(run);

    Object.keys(scores).forEach((archetypeId) => {
      const treeRank = toNumber(classProgression?.treeRanks?.[archetypeId], 0);
      if (treeRank > 0) {
        scores[archetypeId] += treeRank * TREE_RANK_SCORE_WEIGHT;
      }
      if (favoredTreeId === archetypeId && treeRank > 0) {
        scores[archetypeId] += FAVORED_TREE_SCORE_BONUS;
      }
    });

    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const treeId = classificationApi.getCardTree(cardId);
      if (!treeId) {
        return;
      }
      const role = getCardRewardRole(cardId, content);
      const weight = CARD_ROLE_SCORE_WEIGHTS[role] || CARD_ROLE_SCORE_WEIGHTS.foundation;
      Object.keys(scores).forEach((archetypeId) => {
        if (Object.prototype.hasOwnProperty.call(scores, archetypeId)) {
          const treeMatchMultiplier = getArchetypeCardMatchMultiplier(run.classId, archetypeId, treeId, role, treeCardCounts);
          if (treeMatchMultiplier > 0) {
            scores[archetypeId] += weight * treeMatchMultiplier;
          }
        }
      });
    });

    return scores;
  }

  function getRankedArchetypeState(run: RunState, content: GameContent) {
    const scores = computeArchetypeScores(run, content);
    return Object.keys(BUILD_PATHS[run.classId] || {})
      .map((archetypeId) => ({
        archetypeId,
        rank: toNumber(run.progression?.classProgression?.treeRanks?.[archetypeId], 0),
        score: toNumber(scores[archetypeId], 0),
      }))
      .sort((left, right) => right.rank - left.rank || right.score - left.score || left.archetypeId.localeCompare(right.archetypeId));
  }

  function getSupportUtilityArchetypeId(classId: string, primaryArchetypeId: string, rankedEntries: Array<{ archetypeId: string; rank: number; score: number }>) {
    const primaryPath = getArchetypePathForId(primaryArchetypeId);
    if (!primaryPath) {
      return "";
    }
    const supportArchetypeIds = uniqueTags(
      primaryPath.supportTrees.flatMap((supportTreeId) => getArchetypeIdsForSupportTree(classId, supportTreeId))
    ).filter((candidateId) => candidateId !== primaryArchetypeId);
    const rankedSupport = rankedEntries.find((entry) => supportArchetypeIds.includes(entry.archetypeId) && entry.rank > 0);
    if (rankedSupport) {
      return rankedSupport.archetypeId;
    }
    return rankedEntries.find((entry) => entry.archetypeId !== primaryArchetypeId && entry.rank > 0)?.archetypeId || "";
  }

  function buildCounterCoverageTags(run: RunState, content: GameContent) {
    const tags = new Set<CounterTag>();
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const card = classificationApi.getCard(cardId, content);
      (Array.isArray(card?.counterTags) ? card.counterTags : classificationApi.inferCardCounterTags(cardId, card)).forEach((tag) => {
        tags.add(tag);
      });
    });
    const armorProfile = runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatMitigationProfile?.(run, content) || null;
    (armorProfile?.resistances || []).forEach((entry: { type: DamageType; amount: number }) => {
      if (entry.type === "fire" && toNumber(entry.amount, 0) >= 4) {
        tags.add("anti_fire_pressure");
      }
      if (entry.type === "lightning" && toNumber(entry.amount, 0) >= 4) {
        tags.add("anti_lightning_pressure");
      }
    });
    return [...tags].sort();
  }

  function getSpecializationSnapshot(run: RunState, content: GameContent): RewardEngineSpecializationSnapshot {
    const rankedEntries = getRankedArchetypeState(run, content);
    const top = rankedEntries[0] || { archetypeId: "", rank: 0, score: 0 };
    const second = rankedEntries[1] || { archetypeId: "", rank: 0, score: 0 };
    const favoredTreeId = run.progression?.classProgression?.favoredTreeId || "";
    const lead = top.rank - second.rank;
    let specializationStage: RunSpecializationStage = "exploratory";
    if (top.rank >= 6) {
      specializationStage = "mastery";
    } else if (top.rank >= 4 && lead >= 2) {
      specializationStage = "primary";
    } else if (top.rank >= 2) {
      specializationStage = "candidate";
    }

    const primaryTreeId = specializationStage === "exploratory" ? "" : top.archetypeId;
    const primaryPath = getArchetypePathForId(primaryTreeId);
    let offTreeUtilityCount = 0;
    let offTreeDamageCount = 0;
    if (primaryPath) {
      (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
        const card = classificationApi.getCard(cardId, content);
        const treeId = classificationApi.getCardTree(cardId);
        const onPrimary = primaryPath.primaryTrees.includes(treeId);
        if (onPrimary) {
          return;
        }
        const roleTag = (card?.roleTag as CardRoleTag | undefined) || classificationApi.inferCardRoleTag(cardId, card);
        if (primaryPath.supportTrees.includes(treeId) || (card?.splashRole || classificationApi.inferCardSplashRole(cardId, card)) === "utility_splash_ok") {
          if (roleTag === "support" || roleTag === "salvage" || roleTag === "setup") {
            offTreeUtilityCount += 1;
            return;
          }
        }
        offTreeDamageCount += 1;
      });
    }

    return {
      favoredTreeId,
      primaryTreeId,
      secondaryUtilityTreeId: primaryTreeId ? getSupportUtilityArchetypeId(run.classId, primaryTreeId, rankedEntries) : "",
      specializationStage,
      offTreeUtilityCount,
      offTreeDamageCount,
      counterCoverageTags: buildCounterCoverageTags(run, content),
    };
  }

  function syncArchetypeScores(run: RunState, content: GameContent) {
    const nextScores = computeArchetypeScores(run, content);
    if (run.progression?.classProgression) {
      run.progression.classProgression.archetypeScores = { ...nextScores };
      Object.assign(run.progression.classProgression, getSpecializationSnapshot(run, content));
    }
    return nextScores;
  }

  function getArchetypeScoreEntries(run: RunState, content: GameContent) {
    const scores = syncArchetypeScores(run, content);
    return sortArchetypeScoreEntries(run.classId, scores);
  }

  function getDominantArchetype(run: RunState, content: GameContent) {
    const ranked = getArchetypeScoreEntries(run, content);
    return {
      primary: ranked[0] || null,
      secondary: ranked[1] || null,
    };
  }

  function getStrategicWeaponFamilies(run: RunState, content: GameContent) {
    const dominant = getDominantArchetype(run, content);
    const families: string[] = [];
    const primaryFamilies = getArchetypeWeaponFamilies(dominant.primary?.archetypeId || "");
    const secondaryFamilies = getArchetypeWeaponFamilies(dominant.secondary?.archetypeId || "");
    const classFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
    const includeSecondaryFamilies =
      primaryFamilies.length === 0 ||
      (
        secondaryFamilies.length > 0 &&
        toNumber(dominant.secondary?.score, 0) >= toNumber(dominant.primary?.score, 0) * SECONDARY_WEAPON_FAMILY_THRESHOLD
      );
    let prioritizedFamilies = classFamilies;
    if (primaryFamilies.length > 0) {
      prioritizedFamilies = [
        ...primaryFamilies,
        ...(includeSecondaryFamilies ? secondaryFamilies : []),
      ];
    } else if (secondaryFamilies.length > 0) {
      prioritizedFamilies = secondaryFamilies;
    }
    prioritizedFamilies.forEach((family) => {
      if (!families.includes(family)) {
        families.push(family);
      }
    });
    return families;
  }

  function inferDeckBuildPath(run: RunState) {
    const treeCounts = new Map<string, number>();
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const tree = classificationApi.getCardTree(cardId);
      if (!tree) {
        return;
      }
      treeCounts.set(tree, (treeCounts.get(tree) || 0) + 1);
    });
    const ranked = [...treeCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    const [topTree, topCount] = ranked[0] || ["", 0];
    const secondCount = ranked[1]?.[1] || 0;
    if (!topTree || topCount < 2 || topCount <= secondCount) {
      return null;
    }

    const classPaths = BUILD_PATHS[run.classId] || {};
    return (
      Object.entries(classPaths).find(([, path]) => path.primaryTrees.includes(topTree))?.[0] ||
      Object.entries(classPaths).find(([, path]) => path.supportTrees.includes(topTree))?.[0] ||
      ""
    );
  }

  function getRewardPathPreference(run: RunState, content: GameContent): RewardPathPreference | null {
    const specialization = getSpecializationSnapshot(run, content);
    const dominantArchetypes = getDominantArchetype(run, content);
    const primaryScore = toNumber(dominantArchetypes.primary?.score, 0);
    const secondaryScore = toNumber(dominantArchetypes.secondary?.score, 0);
    const scoreLead = primaryScore - secondaryScore;
    const trackedArchetypeId = specialization.primaryTreeId || dominantArchetypes.primary?.archetypeId || "";
    const trackedPath = trackedArchetypeId ? getBuildPath(run.classId, trackedArchetypeId) : null;
    const trackedRank = trackedArchetypeId
      ? toNumber(run.progression?.classProgression?.treeRanks?.[trackedArchetypeId], 0)
      : 0;
    const needsMoreExploration =
      Number(run.actNumber || 1) <= 1 &&
      (
        specialization.specializationStage === "exploratory" ||
        (
          specialization.specializationStage === "candidate" &&
          trackedRank < EARLY_PATH_TREE_RANK_THRESHOLD &&
          scoreLead < EARLY_PATH_SCORE_LEAD_THRESHOLD
        )
      );
    if (needsMoreExploration) {
      return null;
    }
    if (
      trackedPath &&
      (
        specialization.specializationStage === "primary" ||
        specialization.specializationStage === "mastery" ||
        !dominantArchetypes.secondary ||
        primaryScore > secondaryScore
      )
    ) {
      return {
        source: "tracked",
        treeId: trackedArchetypeId,
        label: trackedPath.label,
        score: toNumber(run.progression?.classProgression?.archetypeScores?.[trackedArchetypeId], 0) || primaryScore,
        specializationStage: specialization.specializationStage,
        primaryTreeId: specialization.primaryTreeId,
        secondaryUtilityTreeId: specialization.secondaryUtilityTreeId,
        primaryTrees: [...trackedPath.primaryTrees],
        supportTrees: [...trackedPath.supportTrees],
        behaviorTags: [...trackedPath.behaviorTags],
        counterTags: [...trackedPath.counterTags],
      };
    }

    const favoredTreeId = specialization.favoredTreeId;
    const favoredPath = favoredTreeId ? getBuildPath(run.classId, favoredTreeId) : null;
    if (favoredPath) {
      return {
        source: "favored",
        treeId: favoredTreeId,
        label: favoredPath.label,
        score: toNumber(run.progression?.classProgression?.archetypeScores?.[favoredTreeId], 0),
        specializationStage: specialization.specializationStage,
        primaryTreeId: specialization.primaryTreeId,
        secondaryUtilityTreeId: specialization.secondaryUtilityTreeId,
        primaryTrees: [...favoredPath.primaryTrees],
        supportTrees: [...favoredPath.supportTrees],
        behaviorTags: [...favoredPath.behaviorTags],
        counterTags: [...favoredPath.counterTags],
      };
    }

    const inferredTreeId = inferDeckBuildPath(run);
    const inferredPath = inferredTreeId ? getBuildPath(run.classId, inferredTreeId) : null;
    if (inferredPath) {
      return {
        source: "emerging",
        treeId: inferredTreeId,
        label: inferredPath.label,
        score: toNumber(run.progression?.classProgression?.archetypeScores?.[inferredTreeId], 0),
        specializationStage: specialization.specializationStage,
        primaryTreeId: specialization.primaryTreeId,
        secondaryUtilityTreeId: specialization.secondaryUtilityTreeId,
        primaryTrees: [...inferredPath.primaryTrees],
        supportTrees: [...inferredPath.supportTrees],
        behaviorTags: [...inferredPath.behaviorTags],
        counterTags: [...inferredPath.counterTags],
      };
    }

    return null;
  }

  registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_POLICY = {
    getDeckProfileId,
    getArchetypeCatalog,
    annotateCardRewardMetadata,
    getCardRewardRole,
    getCardArchetypeTags,
    getArchetypeLabels,
    computeArchetypeScores,
    syncArchetypeScores,
    getArchetypeScoreEntries,
    getDominantArchetype,
    getArchetypeWeaponFamilies,
    getStrategicWeaponFamilies,
    getSpecializationSnapshot,
    getRewardPathPreference,
  };
})();
