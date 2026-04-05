/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    pickProgressionChoice,
    getRewardAccountFeatures,
    scaleGoldValue,
    buildBoonChoice,
  } = runtimeWindow.__ROUGE_REWARD_ENGINE_PROGRESSION;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const strategies = runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER_STRATEGIES;
  const dataApi = registryWindow.__ROUGE_REWARD_ENGINE_BUILDER_DATA as {
    BOON_POOLS: Record<string, { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }[]>;
  };

  function getDeckUpgradeThreshold(actNumber: number) { return 12 + Math.max(0, actNumber) * 2; }
  function getDeckSoftCardCap(actNumber: number) { return 14 + Math.max(0, actNumber) * 2; }
  function getDeckHardCardCap(actNumber: number) { return 18 + Math.max(0, actNumber) * 3; }

  function getChoiceSeed(run: RunState, zone: ZoneState, actNumber: number, encounterNumber: number) {
    const runSeed = Number(run.seed || 1) >>> 0;
    return (runSeed * 131 + actNumber * 41 + encounterNumber * 17 + run.deck.length * 7 + zone.title.length) >>> 0;
  }

  function getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent) {
    return (Array.isArray(pool) ? pool : []).filter((cardId: string) => Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId));
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
    const roleTag = String(terminalCard.roleTag || "answer");
    const tier = Number(terminalCard.tier || 1);
    if (role === "engine" && roleTag === "payoff" && tier >= 4) {
      return 7;
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
    const baseCardId = getBaseCardId(cardId);

    if (baseCardId === "barbarian_weapon_mastery" || baseCardId === "barbarian_steel_skin" || baseCardId === "barbarian_unyielding") {
      return 3;
    }
    if (roleTag === "payoff" && tier >= 4) {
      return 3;
    }
    if (roleTag === "payoff") {
      return 4;
    }
    if (roleTag === "setup" && role === "engine") {
      return 5;
    }
    if (role === "engine") {
      return 4;
    }
    if (role === "support" || role === "tech") {
      return 3;
    }
    return 2;
  }

  function thinCandidatesByDuplicateLimit(candidates: string[], run: RunState, content: GameContent, strict = false) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [];
    }
    const belowLimit = candidates.filter((cardId: string) => isBelowDuplicateLimits(run, cardId, content));
    if (belowLimit.length > 0) {
      return belowLimit;
    }
    return strict ? [] : candidates;
  }

  function sortCandidatesByDuplicateNeed(candidates: string[], run: RunState) {
    return [...candidates].sort((left: string, right: string) => {
      const duplicateDelta = getDeckCardCopyCount(run, left) - getDeckCardCopyCount(run, right);
      if (duplicateDelta !== 0) {
        return duplicateDelta;
      }
      const familyDelta = getDeckEvolutionFamilyCount(run, left) - getDeckEvolutionFamilyCount(run, right);
      if (familyDelta !== 0) {
        return familyDelta;
      }
      return left.localeCompare(right);
    });
  }

  function pickCandidateWithTreeBias(candidates: string[], seed: number, preferredTrees: string[] = [], supportTrees: string[] = []) {
    if (candidates.length === 0) {
      return "";
    }
    if (preferredTrees.length > 0) {
      const primaryCandidates = candidates.filter((cardId: string) => preferredTrees.includes(archetypes.getCardTree(cardId)));
      if (primaryCandidates.length > 0) {
        return primaryCandidates[seed % primaryCandidates.length];
      }
    }
    if (supportTrees.length > 0) {
      const supportCandidates = candidates.filter((cardId: string) => supportTrees.includes(archetypes.getCardTree(cardId)));
      if (supportCandidates.length > 0) {
        return supportCandidates[seed % supportCandidates.length];
      }
    }
    return candidates[seed % candidates.length];
  }

  function pickPreferredCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    run: RunState,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = thinCandidatesByDuplicateLimit(getPoolCandidates(pool, usedCardIds, content), run, content);
    if (candidates.length === 0) {
      return "";
    }
    return pickCandidateWithTreeBias(sortCandidatesByDuplicateNeed(candidates, run), seed, preferredTrees, supportTrees);
  }

  function pickRoleScopedCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    run: RunState,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = sortCandidatesByDuplicateNeed(
      thinCandidatesByDuplicateLimit(
        getPoolCandidates(pool, usedCardIds, content).filter((cardId: string) => archetypes.getCardRewardRole(cardId, content) === role),
        run,
        content,
        true
      ),
      run
    );
    return pickCandidateWithTreeBias(candidates, seed, preferredTrees, supportTrees);
  }

  function pickCardForRole(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    run: RunState,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const strictMatch = pickRoleScopedCardId(pool, seed, usedCardIds, content, run, role, preferredTrees, supportTrees);
    if (strictMatch) {
      return strictMatch;
    }
    return pickPreferredCardId(pool, seed, usedCardIds, content, run, preferredTrees, supportTrees);
  }

  function getTreeCardCounts(run: RunState) {
    const counts: Record<string, number> = {};
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      if (!treeId) {
        return;
      }
      counts[treeId] = Number(counts[treeId] || 0) + 1;
    });
    return counts;
  }

  function getStableSeedFromText(text: string) {
    return String(text || "").split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
  }

  function pickExploratoryCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    run: RunState,
    preferredRoles: CardRewardRole[],
    excludedTrees: string[] = []
  ) {
    const candidates = getPoolCandidates(pool, usedCardIds, content);
    if (candidates.length === 0) {
      return "";
    }

    const excludedTreeSet = new Set((Array.isArray(excludedTrees) ? excludedTrees : []).filter(Boolean));
    const treeCounts = getTreeCardCounts(run);
    const candidatesByTree = candidates.reduce((map, cardId: string) => {
      const treeId = archetypes.getCardTree(cardId) || "neutral";
      if (excludedTreeSet.has(treeId)) {
        return map;
      }
      if (!map[treeId]) {
        map[treeId] = [];
      }
      map[treeId].push(cardId);
      return map;
    }, {} as Record<string, string[]>);

    const treeIds = Object.keys(candidatesByTree);
    const rankedTrees = treeIds.sort((left, right) => {
      const countDiff = Number(treeCounts[left] || 0) - Number(treeCounts[right] || 0);
      if (countDiff !== 0) {
        return countDiff;
      }
      return left.localeCompare(right);
    });

    for (let roleIndex = 0; roleIndex < preferredRoles.length; roleIndex += 1) {
      const role = preferredRoles[roleIndex];
      const roleEligibleTrees = rankedTrees.filter((treeId) => {
        return candidatesByTree[treeId].some((cardId: string) => archetypes.getCardRewardRole(cardId, content) === role);
      });
      if (roleEligibleTrees.length === 0) {
        continue;
      }
      const lowestCount = Number(treeCounts[roleEligibleTrees[0]] || 0);
      const lowestCountTrees = roleEligibleTrees.filter((treeId) => Number(treeCounts[treeId] || 0) === lowestCount);
      const selectedTreeId = lowestCountTrees[(seed + roleIndex) % lowestCountTrees.length];
      const roleMatches = candidatesByTree[selectedTreeId].filter((cardId: string) => archetypes.getCardRewardRole(cardId, content) === role);
      if (roleMatches.length > 0) {
        return roleMatches[(seed + getStableSeedFromText(selectedTreeId) + roleIndex) % roleMatches.length];
      }
    }

    const lowestCount = rankedTrees.length > 0 ? Number(treeCounts[rankedTrees[0]] || 0) : 0;
    const lowestCountTrees = rankedTrees.filter((treeId) => Number(treeCounts[treeId] || 0) === lowestCount);
    if (lowestCountTrees.length > 0) {
      const selectedTreeId = lowestCountTrees[seed % lowestCountTrees.length];
      const treeCandidates = candidatesByTree[selectedTreeId];
      if (treeCandidates.length > 0) {
        return treeCandidates[(seed + getStableSeedFromText(selectedTreeId)) % treeCandidates.length];
      }
    }

    return candidates[seed % candidates.length];
  }

  function buildRoleSubtitle(buildPath: ReturnType<typeof archetypes.getRewardPathPreference>, role: CardRewardRole) {
    const roleLabel = archetypes.CARD_ROLE_LABELS[role] || archetypes.CARD_ROLE_LABELS.engine;
    return buildPath ? `${buildPath.label} ${roleLabel}` : `${roleLabel} Skill`;
  }

  function getTreeBiasForRewardSlot(
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>,
    actNumber: number,
    mode: "primary" | "support" | "fallback",
    needsPrimaryReinforcement = false
  ) {
    if (!buildPath) {
      return { preferredTrees: [] as string[], supportTrees: [] as string[] };
    }

    const stage = buildPath.specializationStage || "exploratory";
    if (stage === "exploratory" && actNumber <= 1) {
      return { preferredTrees: [] as string[], supportTrees: [] as string[] };
    }

    if (mode === "primary") {
      if (stage === "candidate" && actNumber <= 1) {
        return {
          preferredTrees: [...buildPath.primaryTrees],
          supportTrees: [],
        };
      }
      return {
        preferredTrees: [...buildPath.primaryTrees],
        supportTrees: [...buildPath.supportTrees],
      };
    }

    if (mode === "support") {
      const preferredTrees =
        !needsPrimaryReinforcement && buildPath.supportTrees.length > 0
          ? [...buildPath.supportTrees]
          : [...buildPath.primaryTrees];
      const supportTrees = needsPrimaryReinforcement
        ? [...buildPath.supportTrees]
        : [...buildPath.primaryTrees];
      if (stage === "candidate" && actNumber <= 1) {
        return {
          preferredTrees,
          supportTrees: [],
        };
      }
      return {
        preferredTrees,
        supportTrees,
      };
    }

    if (stage === "candidate" && actNumber <= 1) {
      return {
        preferredTrees: [...buildPath.primaryTrees],
        supportTrees: [],
      };
    }

    return {
      preferredTrees: [...buildPath.primaryTrees],
      supportTrees: [...buildPath.supportTrees],
    };
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

  function getSupportSplashCap(buildPath: ReturnType<typeof archetypes.getRewardPathPreference>) {
    const stage = buildPath?.specializationStage || "exploratory";
    return stage === "primary" || stage === "mastery" ? 3 : 4;
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
      const splashRole = String(card?.splashRole || "primary_only");
      const rewardRole = archetypes.getCardRewardRole(cardId, content);
      const isUtilityRole =
        roleTag === "support" ||
        roleTag === "salvage" ||
        roleTag === "answer" ||
        rewardRole === "support" ||
        rewardRole === "tech" ||
        rewardRole === "foundation";
      if (splashRole === "utility_splash_ok" || (buildPath.supportTrees.includes(treeId) && isUtilityRole)) {
        return sum + 1;
      }
      return sum;
    }, 0);
  }

  function filterPoolForSpecialization(
    cardIds: string[],
    content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>,
    mode: "primary" | "support" | "pivot"
  ) {
    if (!buildPath || cardIds.length === 0) {
      return [...cardIds];
    }
    const stage = buildPath.specializationStage || "exploratory";
    if (stage === "exploratory") {
      return [...cardIds];
    }
    const filtered = cardIds.filter((cardId: string) => {
      const card = content.cardCatalog[cardId];
      const treeId = archetypes.getCardTree(cardId);
      const splashRole = card?.splashRole || "primary_only";
      const onPrimary = buildPath.primaryTrees.includes(treeId);
      const onSupport = buildPath.supportTrees.includes(treeId);
      if (onPrimary) {
        return true;
      }
      if (mode === "primary") {
        return stage === "candidate" && onSupport;
      }
      if (mode === "support") {
        if (onSupport && splashRole !== "primary_only") {
          return true;
        }
        return splashRole === "utility_splash_ok";
      }
      return splashRole !== "primary_only";
    });
    return filtered.length > 0 ? filtered : [...cardIds];
  }

  function getUpgradableCardIds(run: RunState, content: GameContent) {
    const seen = new Set();
    return run.deck.filter((cardId: string) => {
      const upgradedCardId = `${cardId}_plus`;
      if (seen.has(cardId) || !content.cardCatalog[upgradedCardId]) {
        return false;
      }
      seen.add(cardId);
      return true;
    });
  }

  function buildCardChoice(cardId: string, content: GameContent, subtitle: string) {
    const card = content.cardCatalog[cardId];
    const cardRewardRole = archetypes.getCardRewardRole(cardId, content);
    const archetypeTags = archetypes.getCardArchetypeTags(cardId, content);
    const archetypeLabels = archetypes.getArchetypeLabels(archetypeTags);
    return {
      id: `reward_card_${cardId}`,
      kind: "card",
      title: card.title,
      subtitle,
      description: card.text,
      previewLines: [
        `Role: ${archetypes.CARD_ROLE_LABELS[cardRewardRole]}.`,
        ...(archetypeLabels.length > 0 ? [`Archetypes: ${archetypeLabels.join(" / ")}.`] : []),
        `Add ${card.title} to your deck.`,
        `Deck size +1.`,
      ],
      cardRewardRole,
      archetypeTags,
      effects: [{ kind: "add_card" as const, cardId }],
    };
  }

  function buildUpgradeChoice(fromCardId: string, content: GameContent) {
    const upgradedCardId = `${fromCardId}_plus`;
    const baseCard = content.cardCatalog[fromCardId];
    const upgradedCard = content.cardCatalog[upgradedCardId];
    if (!baseCard || !upgradedCard) {
      return null;
    }

    return {
      id: `reward_upgrade_${fromCardId}`,
      kind: "upgrade",
      title: `Upgrade ${baseCard.title}`,
      subtitle: `Sharpen ${archetypes.CARD_ROLE_LABELS[archetypes.getCardRewardRole(fromCardId, content)]}`,
      description: upgradedCard.text,
      previewLines: [
        `Replace 1x ${baseCard.title} with ${upgradedCard.title}.`,
        `Keep deck size the same.`,
      ],
      cardRewardRole: archetypes.getCardRewardRole(fromCardId, content),
      archetypeTags: archetypes.getCardArchetypeTags(fromCardId, content),
      effects: [{ kind: "upgrade_card" as const, fromCardId, toCardId: upgradedCardId }],
    };
  }

  function pickBoonChoice(zoneRole: string, seed: number, profile: ProfileState | null = null, actNumber: number = 1) {
    const pool = dataApi.BOON_POOLS[zoneRole] || dataApi.BOON_POOLS.opening;
    const definition = pool[seed % pool.length];
    const scaledEffects = definition.effects.map((effect: RewardChoiceEffect) => {
      if (effect.kind === "gold_bonus") {
        return {
          ...effect,
          value: scaleGoldValue(effect.value + Math.max(0, actNumber - 1) * 2, profile),
        };
      }
      return { ...effect };
    });
    const choice = buildBoonChoice({
      ...definition,
      effects: scaledEffects,
    });
    if (getRewardAccountFeatures(profile).economyLedger && scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "gold_bonus")) {
      choice.previewLines.push("Economy Ledger dividend is active on this payout.");
    }
    return choice;
  }

  function ensureThreeChoices({
    choices,
    run,
    zone,
    content,
    seed,
    usedCardIds,
    profile = null,
    actNumber = 1,
    allowFallbackCards = true,
  }: {
    choices: RewardChoice[];
    run: RunState;
    zone: ZoneState;
    content: GameContent;
    seed: number;
    usedCardIds: Set<string>;
    profile?: ProfileState | null;
    actNumber?: number;
    allowFallbackCards?: boolean;
  }) {
    const profileId = archetypes.getDeckProfileId(content, run.classId);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    const fallbackPools = [
      content.rewardPools?.profileCards?.[profileId] || [],
      content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [],
      content.rewardPools?.bossCards || [],
    ];
    const supportCardCount = countCardsInTrees(run, buildPath?.supportTrees || []);
    const utilitySplashCount = getUtilitySplashCardCount(run, content, buildPath);
    const supportSplashCap = getSupportSplashCap(buildPath);
    const supportSaturated =
      Boolean(buildPath) && (supportCardCount >= supportSplashCap || utilitySplashCount >= supportSplashCap + 1);
    const fallbackBias = supportSaturated
      ? { preferredTrees: [...(buildPath?.primaryTrees || [])], supportTrees: [] as string[] }
      : getTreeBiasForRewardSlot(buildPath, actNumber, "fallback");

    if (allowFallbackCards) {
      for (let poolIndex = 0; choices.length < 3 && poolIndex < fallbackPools.length; poolIndex += 1) {
        const pool = filterPoolForSpecialization(fallbackPools[poolIndex], content, buildPath, "pivot");
        const cardId = pickPreferredCardId(
          pool,
          seed + poolIndex + choices.length,
          usedCardIds,
          content,
          run,
          fallbackBias.preferredTrees,
          fallbackBias.supportTrees
        );
        if (!cardId) {
          continue;
        }
        usedCardIds.add(cardId);
        choices.push(buildCardChoice(cardId, content, buildPath ? `${buildPath.label} Skill` : "Fallback Skill"));
      }
    }

    while (choices.length < 3) {
      choices.push(pickBoonChoice(zone.zoneRole, seed + choices.length, profile, actNumber));
    }

    return choices.slice(0, runtimeWindow.ROUGE_LIMITS.REWARD_CHOICES);
  }

  function buildRewardChoices({ content, run, zone, actNumber, encounterNumber, profile = null }: { content: GameContent; run: RunState; zone: ZoneState; actNumber: number; encounterNumber: number; profile?: ProfileState | null }) {
    archetypes.annotateCardRewardMetadata(content);
    const seed = getChoiceSeed(run, zone, actNumber, encounterNumber);
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const usedCardIds = new Set<string>();
    const choices: RewardChoice[] = [];
    const profileId = archetypes.getDeckProfileId(content, run.classId);
    const buildPath = archetypes.getRewardPathPreference(run, content);
    const classPool = strategies.getClassPoolForZone(content, run.classId, zone.zoneRole, actNumber);
    const profilePool = classPool.length > 0 ? classPool : (content.rewardPools?.profileCards?.[profileId] || []);
    const zonePool = content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [];
    const bossPool = content.rewardPools?.bossCards || [];
    const upgradableCardIds = getUpgradableCardIds(run, content);
    const primaryCardCount = countCardsInTrees(run, buildPath?.primaryTrees || []);
    const supportCardCount = countCardsInTrees(run, buildPath?.supportTrees || []);
    const utilitySplashCount = getUtilitySplashCardCount(run, content, buildPath);
    const supportSplashCap = getSupportSplashCap(buildPath);
    const specializationStage = buildPath?.specializationStage || "exploratory";
    const needsPrimaryReinforcement = Boolean(buildPath) && (primaryCardCount < 4 || primaryCardCount < supportCardCount);
    const supportSaturated =
      Boolean(buildPath) && (supportCardCount >= supportSplashCap || utilitySplashCount >= supportSplashCap + 1);
    const primaryBias = getTreeBiasForRewardSlot(buildPath, actNumber, "primary", needsPrimaryReinforcement);
    const supportBias = getTreeBiasForRewardSlot(buildPath, actNumber, "support", needsPrimaryReinforcement);
    const preferredUpgradeCandidates = upgradableCardIds.filter((cardId: string) => {
      const tree = archetypes.getCardTree(cardId);
      if (needsPrimaryReinforcement) {
        return buildPath?.primaryTrees?.includes(tree);
      }
      if (supportSaturated) {
        return buildPath?.primaryTrees?.includes(tree);
      }
      return buildPath?.primaryTrees?.includes(tree) || buildPath?.supportTrees?.includes(tree);
    });
    let upgradeSource: string[];
    if (preferredUpgradeCandidates.length > 0) {
      upgradeSource = preferredUpgradeCandidates;
    } else if (Boolean(buildPath) && specializationStage !== "exploratory") {
      upgradeSource = [];
    } else {
      upgradeSource = upgradableCardIds;
    }
    const upgradeCardId = upgradeSource.length > 0 ? upgradeSource[seed % upgradeSource.length] : "";
    const upgradeChoice = upgradeCardId ? buildUpgradeChoice(upgradeCardId, content) : null;
    const deckSize = Array.isArray(run.deck) ? run.deck.length : 0;
    const upgradeThreshold = getDeckUpgradeThreshold(actNumber);
    const softCardCap = getDeckSoftCardCap(actNumber);
    const hardCardCap = getDeckHardCardCap(actNumber);
    const preferUpgrade = deckSize >= upgradeThreshold && Boolean(upgradeChoice);
    const softCapCards = deckSize >= softCardCap;
    const hardCapCards = deckSize >= hardCardCap;
    const equipmentChoice = itemSystem?.buildEquipmentChoice({
      content,
      run,
      zone,
      actNumber,
      encounterNumber,
      profile,
    });
    const progressionChoice = pickProgressionChoice(zone, seed + 3, run, actNumber, content, profile);

    const firstCardPool = filterPoolForSpecialization(
      zone.kind === ZONE_KIND.BOSS || zone.kind === ZONE_KIND.MINIBOSS
        ? [...bossPool, ...profilePool]
        : [...profilePool, ...zonePool],
      content,
      buildPath,
      "primary"
    );
    const exploratoryOpen = !buildPath && actNumber <= 1;
    const firstCardId = exploratoryOpen
      ? pickExploratoryCardId(
          firstCardPool,
          seed,
          usedCardIds,
          content,
          run,
          ["engine", "support", "tech", "foundation"]
        )
      : pickCardForRole(
          firstCardPool,
          seed,
          usedCardIds,
          content,
          run,
          "engine",
          primaryBias.preferredTrees,
          primaryBias.supportTrees
        );
    const canOfferPrimaryCard = !hardCapCards;
    if (firstCardId && canOfferPrimaryCard) {
      usedCardIds.add(firstCardId);
      choices.push(buildCardChoice(firstCardId, content, buildRoleSubtitle(buildPath, archetypes.getCardRewardRole(firstCardId, content))));
    } else if (preferUpgrade && upgradeChoice) {
      choices.push(upgradeChoice);
    }

    if (progressionChoice) {
      choices.push(progressionChoice);
    }

    if (equipmentChoice) {
      choices.push(equipmentChoice);
    }

    if (preferUpgrade && upgradeChoice && !choices.some((choice) => choice.id === upgradeChoice.id) && choices.length < 3) {
      choices.push(upgradeChoice);
    }

    if (zone.kind === ZONE_KIND.BOSS) {
      if (choices.length < 3) {
        choices.push(pickBoonChoice("boss", seed + 9, profile, actNumber));
      }
      if (upgradeChoice && choices.length < 3 && !choices.some((choice) => choice.id === upgradeChoice.id)) {
        choices.push(upgradeChoice);
      }
    } else if ((zone.kind === ZONE_KIND.MINIBOSS || zone.zoneRole === "branchBattle") && upgradeChoice) {
      if (choices.length >= 3) {
        choices[choices.length - 1] = upgradeChoice;
      } else {
        choices.push(upgradeChoice);
      }
    }

    const boonRole = zone.kind === ZONE_KIND.BOSS ? "boss" : zone.zoneRole;
    if (zone.kind !== ZONE_KIND.BOSS && choices.length < 3) {
      choices.push(pickBoonChoice(boonRole, seed + 9, profile, actNumber));
    }

    const secondCardPoolBase = filterPoolForSpecialization(
      zone.kind === ZONE_KIND.BOSS ? [...zonePool, ...profilePool] : [...zonePool, ...profilePool, ...bossPool],
      content,
      buildPath,
      "support"
    );
    const secondCardPool =
      supportSaturated && buildPath?.primaryTrees?.length
        ? (() => {
            const primaryOnly = secondCardPoolBase.filter((cardId: string) => {
              const treeId = archetypes.getCardTree(cardId);
              return Boolean(treeId) && buildPath.primaryTrees.includes(treeId);
            });
            return primaryOnly.length > 0 ? primaryOnly : secondCardPoolBase;
          })()
        : secondCardPoolBase;
    const canOfferSecondaryCard = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    if (choices.length < 3 && canOfferSecondaryCard) {
      const secondaryPrimaryTrees = primaryBias.preferredTrees;
      const secondarySupportTrees = supportSaturated ? primaryBias.preferredTrees : supportBias.preferredTrees;
      const supportPreferredTrees = supportSaturated ? primaryBias.preferredTrees : supportBias.preferredTrees;
      const supportFallbackTrees = supportSaturated ? [] : supportBias.supportTrees;
      let secondCardId = exploratoryOpen
        ? pickExploratoryCardId(
            secondCardPool,
            seed + 5,
            usedCardIds,
            content,
            run,
            ["support", "tech", "engine", "foundation"],
            firstCardId ? [archetypes.getCardTree(firstCardId) || ""] : []
          )
        : pickRoleScopedCardId(
            secondCardPool,
            seed + 5,
            usedCardIds,
            content,
            run,
            "support",
            supportPreferredTrees,
            supportFallbackTrees
          );
      if (!secondCardId) {
        secondCardId = pickRoleScopedCardId(
          secondCardPool,
          seed + 6,
          usedCardIds,
          content,
          run,
          "tech",
          secondaryPrimaryTrees,
          secondarySupportTrees
        );
      }
      if (!secondCardId && needsPrimaryReinforcement) {
        secondCardId = pickRoleScopedCardId(
          secondCardPool,
          seed + 7,
          usedCardIds,
          content,
          run,
          "foundation",
          secondaryPrimaryTrees,
          secondarySupportTrees
        );
      }
      if (!secondCardId) {
        secondCardId = pickCardForRole(
          secondCardPool,
          seed + 5,
          usedCardIds,
          content,
          run,
          "support",
          supportPreferredTrees,
          supportFallbackTrees
        );
      }
      if (secondCardId) {
        usedCardIds.add(secondCardId);
        choices.push(buildCardChoice(secondCardId, content, buildRoleSubtitle(buildPath, archetypes.getCardRewardRole(secondCardId, content))));
      }
    }

    const allowFallbackCards = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    return ensureThreeChoices({
      choices,
      run,
      zone,
      content,
      seed: seed + 13,
      usedCardIds,
      profile,
      actNumber,
      allowFallbackCards,
    });
  }

    runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER = {
    buildRewardChoices,
    getUpgradableCardIds,
    resolveReinforceBuildReward: strategies.resolveReinforceBuildReward,
    resolveSupportBuildReward: strategies.resolveSupportBuildReward,
    resolvePivotBuildReward: strategies.resolvePivotBuildReward,
  };
})();
