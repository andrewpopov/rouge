(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const helpers = runtimeWindow.__ROUGE_REWARD_BUILDER_STRATEGY_HELPERS;

  function resolveReinforceBuildReward(run: RunState, content: GameContent) {
    archetypes.annotateCardRewardMetadata(content);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    if (!buildPath?.treeId) {
      return {
        effect: { kind: "class_point" as const, value: 1 },
        previewLine: "Build reinforcement: Gain 1 class point.",
      };
    }

    const matchingUpgrades = helpers.sortReinforceCandidates(
      helpers.filterCardsByPathPriority(
        helpers.getUpgradableCardIds(run, content).filter((cardId: string) => archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
        content, buildPath, "primary"
      ),
      content, buildPath, run
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
    const addCandidates = helpers.sortReinforceCandidates(
      helpers.thinCandidatesByDuplicateLimit(
        helpers.filterCardsByPathPriority(
          helpers.getPoolCandidates(helpers.getStrategicRewardPool(run, content), usedCardIds, content)
            .filter((cardId: string) => archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
          content, buildPath, "primary"
        ), run, content
      ),
      content, buildPath, run
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
    const supportCardCount = helpers.countCardsInTrees(run, buildPath.supportTrees || []);
    const utilitySplashCount = helpers.getUtilitySplashCardCount(run, content, buildPath);
    const supportSplashCap = helpers.getSupportSplashCap(buildPath);
    const supportSaturated = supportCardCount >= supportSplashCap || utilitySplashCount >= supportSplashCap + 1;

    const matchingUpgrades = helpers.sortSupportCandidates(
      helpers.filterCardsByPathPriority(
        helpers.getUpgradableCardIds(run, content).filter((cardId: string) => {
          const treeId = archetypes.getCardTree(cardId);
          if (supportSaturated && !buildPath.primaryTrees.includes(treeId)) { return false; }
          if (!archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) { return false; }
          if (!helpers.isUtilitySplashCandidate(cardId, content, buildPath)) { return false; }
          const role = archetypes.getCardRewardRole(cardId, content);
          return role === "support" || role === "tech" || role === "foundation";
        }),
        content, buildPath, "support"
      ),
      content, buildPath, run
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
    const addCandidates = helpers.sortSupportCandidates(
      helpers.thinCandidatesByDuplicateLimit(
        helpers.filterCardsByPathPriority(
          helpers.getPoolCandidates(helpers.getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
            const treeId = archetypes.getCardTree(cardId);
            if (supportSaturated && !buildPath.primaryTrees.includes(treeId)) { return false; }
            if (!archetypes.getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) { return false; }
            if (!helpers.isUtilitySplashCandidate(cardId, content, buildPath)) { return false; }
            const role = archetypes.getCardRewardRole(cardId, content);
            return role === "support" || role === "tech" || role === "foundation";
          }),
          content, buildPath, "support"
        ), run, content
      ),
      content, buildPath, run
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
    const addCandidates = helpers.sortPivotCandidates(
      helpers.thinCandidatesByDuplicateLimit(
        helpers.getPoolCandidates(helpers.getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
          const tags = archetypes.getCardArchetypeTags(cardId, content);
          if (tags.length === 0) { return false; }
          if (pivotArchetypeId) { return tags.includes(pivotArchetypeId); }
          return tags.some((tag) => tag && tag !== primaryArchetypeId);
        }),
        run, content
      ),
      content, primaryArchetypeId, pivotArchetypeId, run
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
    getClassPoolForZone: helpers.getClassPoolForZone,
    resolveReinforceBuildReward,
    resolveSupportBuildReward,
    resolvePivotBuildReward,
  };
})();
