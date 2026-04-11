(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;

  function getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent) {
    return (Array.isArray(pool) ? pool : []).filter((cardId: string) => {
      return Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId);
    });
  }

  function getSupportSplashCap(buildPath: ReturnType<typeof archetypes.getRewardPathPreference>) {
    const stage = buildPath?.specializationStage || "exploratory";
    return stage === "primary" || stage === "mastery" ? 3 : 4;
  }

  function getBaseCardId(cardId: string) {
    return String(cardId || "").replace(/_plus$/i, "");
  }

  function getDeckCardCopyCount(run: RunState, cardId: string) {
    const baseCardId = getBaseCardId(cardId);
    return (Array.isArray(run.deck) ? run.deck : []).reduce((count: number, deckCardId: string) => {
      return getBaseCardId(deckCardId) === baseCardId ? count + 1 : count;
    }, 0);
  }

  function getEvolutionTerminalCardId(cardId: string) {
    return String(runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getEvolutionTerminalCardId?.(cardId) || getBaseCardId(cardId));
  }

  function getDeckEvolutionFamilyCount(run: RunState, cardId: string) {
    const terminalBaseId = getBaseCardId(getEvolutionTerminalCardId(cardId));
    return (Array.isArray(run.deck) ? run.deck : []).reduce((count: number, deckCardId: string) => {
      return getBaseCardId(getEvolutionTerminalCardId(deckCardId)) === terminalBaseId ? count + 1 : count;
    }, 0);
  }

  function getEvolutionFamilyDuplicateLimit(cardId: string, content: GameContent) {
    const terminalCardId = getEvolutionTerminalCardId(cardId);
    const terminalCard = content.cardCatalog[terminalCardId] || content.cardCatalog[getBaseCardId(terminalCardId)];
    if (!terminalCard) {
      return Number.POSITIVE_INFINITY;
    }
    if (getBaseCardId(terminalCardId) === "amazon_pierce") {
      return 4;
    }
    if (getBaseCardId(terminalCardId) === "paladin_conviction") {
      return 3;
    }
    if (getBaseCardId(terminalCardId) === "barbarian_berserk") {
      return 1;
    }
    if (getBaseCardId(terminalCardId) === "necromancer_revive") {
      return 2;
    }
    if (getBaseCardId(terminalCardId) === "druid_fury") {
      return 6;
    }
    if (getBaseCardId(terminalCardId) === "druid_armageddon") {
      return 4;
    }
    if (getBaseCardId(terminalCardId) === "druid_summon_grizzly") {
      return 5;
    }
    if (getBaseCardId(terminalCardId) === "druid_heart_of_wolverine") {
      return 5;
    }
    if (getBaseCardId(terminalCardId) === "sorceress_frozen_orb") {
      return 10;
    }
    if (getBaseCardId(terminalCardId) === "sorceress_hydra") {
      return 4;
    }
    if (getBaseCardId(terminalCardId) === "sorceress_lightning_mastery") {
      return 4;
    }
    if (getBaseCardId(terminalCardId) === "assassin_shadow_warrior") {
      return 4;
    }
    const role = archetypes.getCardRewardRole(terminalCardId, content);
    const roleTag = String(terminalCard?.roleTag || "answer");
    const tier = Number(terminalCard?.tier || 1);
    if (role === "engine") {
      if (roleTag === "payoff" && tier >= 4) {
        return 7;
      }
      return tier >= 4 ? 2 : 3;
    }
    return Number.POSITIVE_INFINITY;
  }

  function isBelowDuplicateLimits(run: RunState, cardId: string, content: GameContent) {
    if (getDeckCardCopyCount(run, cardId) >= getRewardDuplicateLimit(cardId, content)) {
      return false;
    }
    const familyLimit = getEvolutionFamilyDuplicateLimit(cardId, content);
    if (Number.isFinite(familyLimit) && getDeckEvolutionFamilyCount(run, cardId) >= familyLimit) {
      return false;
    }
    return true;
  }

  function getRewardDuplicateLimit(cardId: string, content: GameContent) {
    const role = archetypes.getCardRewardRole(cardId, content);
    const card = content.cardCatalog[cardId];
    const roleTag = String(card?.roleTag || "answer");
    const tier = Number(card?.tier || 1);
    const splashRole = String(card?.splashRole || "utility_splash_ok");
    const baseCardId = getBaseCardId(cardId);

    if (baseCardId === "barbarian_weapon_mastery" || baseCardId === "barbarian_steel_skin" || baseCardId === "barbarian_unyielding") {
      return 3;
    }
    if (role === "engine") {
      if (roleTag === "payoff" && tier >= 4) {
        return 2;
      }
      if ((roleTag === "support" || roleTag === "answer") && tier >= 3 && splashRole === "primary_only") {
        return 2;
      }
      if (roleTag === "payoff") {
        return 3;
      }
      if (roleTag === "setup") {
        return 4;
      }
      return 4;
    }
    if (role === "support" || role === "tech") {
      return 3;
    }
    return 2;
  }

  function thinCandidatesByDuplicateLimit(cardIds: string[], run: RunState, content: GameContent) {
    const belowLimit = cardIds.filter((cardId: string) => isBelowDuplicateLimits(run, cardId, content));
    return belowLimit;
  }

  runtimeWindow.__ROUGE_REWARD_STRATEGY_SCORING = {
    getBaseCardId, getEvolutionTerminalCardId,
    getDeckCardCopyCount, getDeckEvolutionFamilyCount,
    getEvolutionFamilyDuplicateLimit,
  };

  function getReinforcementNeedScore(...args: unknown[]) {
    return runtimeWindow.__ROUGE_REWARD_STRATEGY_NEED_SCORING.getReinforcementNeedScore(...args);
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

  function sortReinforceCandidates(
    cardIds: string[],
    content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>,
    run: RunState
  ) {
    return [...cardIds].sort((left, right) => {
      const leftTree = archetypes.getCardTree(left);
      const rightTree = archetypes.getCardTree(right);
      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }

      const needDelta = getReinforcementNeedScore(right, run, content, buildPath) - getReinforcementNeedScore(left, run, content, buildPath);
      if (needDelta !== 0) {
        return needDelta;
      }

      const leftRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = archetypes.CARD_ROLE_SCORE_WEIGHTS[archetypes.getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      const duplicateDelta = getDeckCardCopyCount(run, left) - getDeckCardCopyCount(run, right);
      if (duplicateDelta !== 0) {
        return duplicateDelta;
      }

      const familyDelta = getDeckEvolutionFamilyCount(run, left) - getDeckEvolutionFamilyCount(run, right);
      if (familyDelta !== 0) {
        return familyDelta;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortSupportCandidates(
    cardIds: string[],
    content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>,
    run: RunState
  ) {
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

      const duplicateDelta = getDeckCardCopyCount(run, left) - getDeckCardCopyCount(run, right);
      if (duplicateDelta !== 0) {
        return duplicateDelta;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortPivotCandidates(
    cardIds: string[],
    content: GameContent,
    primaryArchetypeId: string,
    pivotArchetypeId: string,
    run: RunState
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

      const duplicateDelta = getDeckCardCopyCount(run, left) - getDeckCardCopyCount(run, right);
      if (duplicateDelta !== 0) {
        return duplicateDelta;
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

  function countCardsInTrees(run: RunState, trees: string[] = []) {
    if (!Array.isArray(trees) || trees.length === 0) {
      return 0;
    }
    return (Array.isArray(run.deck) ? run.deck : []).reduce((sum: number, cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      return treeId && trees.includes(treeId) ? sum + 1 : sum;
    }, 0);
  }

  function getUtilitySplashCardCount(
    run: RunState,
    content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>
  ) {
    if (!buildPath) {
      return 0;
    }
    return (Array.isArray(run.deck) ? run.deck : []).reduce((sum: number, cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      if (!treeId || buildPath.primaryTrees.includes(treeId)) {
        return sum;
      }
      const card = content.cardCatalog[cardId];
      const roleTag = String(card?.roleTag || "answer");
      const rewardRole = archetypes.getCardRewardRole(cardId, content);
      const isUtilityRole =
        roleTag === "support" ||
        roleTag === "salvage" ||
        roleTag === "answer" ||
        rewardRole === "support" ||
        rewardRole === "tech" ||
        rewardRole === "foundation";
      if ((card?.splashRole || "primary_only") === "utility_splash_ok" || (buildPath.supportTrees.includes(treeId) && isUtilityRole)) {
        return sum + 1;
      }
      return sum;
    }, 0);
  }

  runtimeWindow.__ROUGE_REWARD_BUILDER_STRATEGY_HELPERS = {
    getPoolCandidates, getSupportSplashCap, getUpgradableCardIds,
    sortReinforceCandidates, sortSupportCandidates, sortPivotCandidates,
    getClassPoolForZone, getStrategicRewardPool, filterCardsByPathPriority,
    isUtilitySplashCandidate, countCardsInTrees, getUtilitySplashCardCount,
    thinCandidatesByDuplicateLimit,
  };
})();
