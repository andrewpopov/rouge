(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;

  function getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent) {
    return (Array.isArray(pool) ? pool : []).filter((cardId: string) => {
      return Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId);
    });
  }

  function getUpgradableCardIds(run: RunState, content: GameContent) {
    const seen = new Set<string>();
    return run.deck.filter((cardId: string) => {
      const upgradedCardId = `${cardId}_plus`;
      if (seen.has(cardId) || !content.cardCatalog[upgradedCardId]) {
        return false;
      }
      seen.add(cardId);
      return true;
    });
  }

  function sortReinforceCandidates(cardIds: string[], content: GameContent, buildPath: ReturnType<typeof archetypes.getRewardPathPreference>) {
    return [...cardIds].sort((left, right) => {
      const leftTree = archetypes.getCardTree(left);
      const rightTree = archetypes.getCardTree(right);
      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }

      const leftRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortSupportCandidates(cardIds: string[], content: GameContent, buildPath: ReturnType<typeof archetypes.getRewardPathPreference>) {
    return [...cardIds].sort((left, right) => {
      const leftTree = archetypes.getCardTree(left);
      const rightTree = archetypes.getCardTree(right);
      const leftSupportTree = Number(Boolean(buildPath?.supportTrees?.includes(leftTree)));
      const rightSupportTree = Number(Boolean(buildPath?.supportTrees?.includes(rightTree)));
      if (leftSupportTree !== rightSupportTree) {
        return rightSupportTree - leftSupportTree;
      }

      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }

      const leftRoleWeight = archetypes.SUPPORT_ROLE_PRIORITY[archetypes.getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = archetypes.SUPPORT_ROLE_PRIORITY[archetypes.getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortPivotCandidates(
    cardIds: string[],
    content: GameContent,
    primaryArchetypeId: string,
    pivotArchetypeId: string
  ) {
    return [...cardIds].sort((left, right) => {
      const leftTags = archetypes.getCardArchetypeTags(left, content);
      const rightTags = archetypes.getCardArchetypeTags(right, content);
      const leftExactPivot = Number(Boolean(pivotArchetypeId && leftTags.includes(pivotArchetypeId)));
      const rightExactPivot = Number(Boolean(pivotArchetypeId && rightTags.includes(pivotArchetypeId)));
      if (leftExactPivot !== rightExactPivot) {
        return rightExactPivot - leftExactPivot;
      }

      const leftEscapesPrimary = Number(leftTags.some((tag) => tag && tag !== primaryArchetypeId));
      const rightEscapesPrimary = Number(rightTags.some((tag) => tag && tag !== primaryArchetypeId));
      if (leftEscapesPrimary !== rightEscapesPrimary) {
        return rightEscapesPrimary - leftEscapesPrimary;
      }

      const leftRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function getClassPoolForZone(content: GameContent, classId: string, zoneRole: string, actNumber: number) {
    const classPools = content.classRewardPools?.[classId];
    if (!classPools) {
      return [];
    }
    if (actNumber >= 4 || zoneRole === "boss") {
      return [...classPools.late, ...classPools.mid];
    }
    if (actNumber >= 2 || zoneRole === "branchMiniboss" || zoneRole === "branchBattle") {
      return [...classPools.mid, ...classPools.early];
    }
    return [...classPools.early];
  }

  function getStrategicRewardPool(run: RunState, content: GameContent) {
    const classPool = getClassPoolForZone(content, run.classId, "boss", run.actNumber);
    const profileId = archetypes.getDeckProfileId(content, run.classId);
    return classPool.length > 0 ? classPool : (content.rewardPools?.profileCards?.[profileId] || []);
  }

  function filterCardsByPathPriority(
    cardIds: string[],
    content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>,
    mode: "primary" | "support"
  ) {
    if (!buildPath) {
      return [...cardIds];
    }

    const primaryMatches = cardIds.filter((cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      return Boolean(treeId) && buildPath.primaryTrees.includes(treeId);
    });
    const supportMatches = cardIds.filter((cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      return Boolean(treeId) && buildPath.supportTrees.includes(treeId);
    });

    if (mode === "primary") {
      if (primaryMatches.length > 0) {
        return primaryMatches;
      }
      if (supportMatches.length > 0) {
        return supportMatches;
      }
      return [...cardIds];
    }

    if (supportMatches.length > 0) {
      return supportMatches;
    }
    if (primaryMatches.length > 0) {
      return primaryMatches;
    }
    return [...cardIds];
  }

  function isUtilitySplashCandidate(cardId: string, content: GameContent, buildPath: ReturnType<typeof archetypes.getRewardPathPreference>) {
    const card = content.cardCatalog[cardId];
    const treeId = archetypes.getCardTree(cardId);
    if (buildPath?.primaryTrees?.includes(treeId)) {
      return true;
    }
    if (buildPath?.supportTrees?.includes(treeId)) {
      return (card?.splashRole || "primary_only") !== "primary_only";
    }
    return (card?.splashRole || "primary_only") === "utility_splash_ok";
  }

  function resolveReinforceBuildReward(run: RunState, content: GameContent) {
    archetypes.annotateCardRewardMetadata(content);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    if (!buildPath?.treeId) {
      return {
        effect: { kind: "class_point" as const, value: 1 },
        previewLine: "Build reinforcement: Gain 1 class point.",
      };
    }

    const matchingUpgrades = sortReinforceCandidates(
      filterCardsByPathPriority(
        getUpgradableCardIds(run, content).filter((cardId: string) => archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
        content,
        buildPath,
        "primary"
      ),
      content,
      buildPath
    );
    const upgradeCardId = matchingUpgrades[0] || "";
    if (upgradeCardId) {
      const upgradedCardId = `${upgradeCardId}_plus`;
      const baseTitle = content.cardCatalog[upgradeCardId]?.title || upgradeCardId;
      const upgradedTitle = content.cardCatalog[upgradedCardId]?.title || upgradedCardId;
      return {
        effect: { kind: "upgrade_card" as const, fromCardId: upgradeCardId, toCardId: upgradedCardId },
        previewLine: `Build reinforcement: Upgrade ${baseTitle} to ${upgradedTitle}.`,
      };
    }

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const addCandidates = sortReinforceCandidates(
      filterCardsByPathPriority(
        getPoolCandidates(getStrategicRewardPool(run, content), usedCardIds, content)
          .filter((cardId: string) => archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
        content,
        buildPath,
        "primary"
      ),
      content,
      buildPath
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Build reinforcement: Add ${addedTitle} to your deck.`,
      };
    }

    return {
      effect: { kind: "class_point" as const, value: 1 },
      previewLine: `Build reinforcement: Gain 1 class point for ${buildPath.label}.`,
    };
  }

  function resolveSupportBuildReward(run: RunState, content: GameContent) {
    archetypes.annotateCardRewardMetadata(content);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    if (!buildPath?.treeId) {
      return {
        effect: { kind: "hero_max_life" as const, value: 3 },
        previewLine: "Build support: Gain 3 max Life.",
      };
    }

    const matchingUpgrades = sortSupportCandidates(
      filterCardsByPathPriority(
        getUpgradableCardIds(run, content).filter((cardId: string) => {
          if (!archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) {
            return false;
          }
          if (!isUtilitySplashCandidate(cardId, content, buildPath)) {
            return false;
          }
          const role = archetypes.getCardRewardRole(cardId, content);
          return role === "support" || role === "tech" || role === "foundation";
        }),
        content,
        buildPath,
        "support"
      ),
      content,
      buildPath
    );
    const upgradeCardId = matchingUpgrades[0] || "";
    if (upgradeCardId) {
      const upgradedCardId = `${upgradeCardId}_plus`;
      const baseTitle = content.cardCatalog[upgradeCardId]?.title || upgradeCardId;
      const upgradedTitle = content.cardCatalog[upgradedCardId]?.title || upgradedCardId;
      return {
        effect: { kind: "upgrade_card" as const, fromCardId: upgradeCardId, toCardId: upgradedCardId },
        previewLine: `Build support: Upgrade ${baseTitle} to ${upgradedTitle}.`,
      };
    }

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const addCandidates = sortSupportCandidates(
      filterCardsByPathPriority(
        getPoolCandidates(getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
          if (!archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) {
            return false;
          }
          if (!isUtilitySplashCandidate(cardId, content, buildPath)) {
            return false;
          }
          const role = archetypes.getCardRewardRole(cardId, content);
          return role === "support" || role === "tech" || role === "foundation";
        }),
        content,
        buildPath,
        "support"
      ),
      content,
      buildPath
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Build support: Add ${addedTitle} to steady ${buildPath.label}.`,
      };
    }

    return {
      effect: { kind: "hero_max_life" as const, value: 3 },
      previewLine: `Build support: Gain 3 max Life for ${buildPath.label}.`,
    };
  }

  function resolvePivotBuildReward(run: RunState, content: GameContent) {
    archetypes.annotateCardRewardMetadata(content);
    const dominant = archetypes.getDominantArchetype(run, content);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    const primaryArchetypeId = dominant.primary?.archetypeId || buildPath?.treeId || "";
    const pivotArchetypeId =
      dominant.secondary?.archetypeId && dominant.secondary.archetypeId !== primaryArchetypeId
        ? dominant.secondary.archetypeId
        : "";
    const pivotLabel = archetypes.getArchetypeLabels([pivotArchetypeId])[0] || "an alternate build";

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const addCandidates = sortPivotCandidates(
      getPoolCandidates(getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
        const tags = archetypes.getCardArchetypeTags(cardId, content);
        if (tags.length === 0) {
          return false;
        }
        if (pivotArchetypeId) {
          return tags.includes(pivotArchetypeId);
        }
        return tags.some((tag) => tag && tag !== primaryArchetypeId);
      }),
      content,
      primaryArchetypeId,
      pivotArchetypeId
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Strategic pivot: Add ${addedTitle} to keep ${pivotLabel} open.`,
      };
    }

    return {
      effect: { kind: "class_point" as const, value: 1 },
      previewLine: `Strategic pivot: Gain 1 class point to keep ${pivotLabel} open.`,
    };
  }

  runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER_STRATEGIES = {
    getClassPoolForZone,
    resolveReinforceBuildReward,
    resolveSupportBuildReward,
    resolvePivotBuildReward,
  };
})();
