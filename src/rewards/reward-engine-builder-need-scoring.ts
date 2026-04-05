(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const scoring = runtimeWindow.__ROUGE_REWARD_STRATEGY_SCORING;

  function getPrimaryRoleCounts(
    run: RunState, content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>
  ) {
    const counts: Record<string, number> = {};
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const treeId = archetypes.getCardTree(cardId);
      if (!buildPath?.primaryTrees?.includes(treeId)) { return; }
      const roleTag = String(content.cardCatalog[cardId]?.roleTag || "answer");
      counts[roleTag] = Number(counts[roleTag] || 0) + 1;
    });
    return counts;
  }

  function getReinforcementNeedScore(
    cardId: string, run: RunState, content: GameContent,
    buildPath: ReturnType<typeof archetypes.getRewardPathPreference>
  ) {
    const card = content.cardCatalog[cardId];
    const roleTag = String(card?.roleTag || "answer");
    const duplicateCount = scoring.getDeckCardCopyCount(run, cardId);
    const familyCount = scoring.getDeckEvolutionFamilyCount(run, cardId);
    const familyLimit = scoring.getEvolutionFamilyDuplicateLimit(cardId, content);
    const primaryRoleCounts = getPrimaryRoleCounts(run, content, buildPath);
    const setupCount = Number(primaryRoleCounts.setup || 0);
    const payoffCount = Number(primaryRoleCounts.payoff || 0);
    const salvageCount = Number(primaryRoleCounts.salvage || 0);
    const answerCount = Number(primaryRoleCounts.answer || 0);
    const supportCount = Number(primaryRoleCounts.support || 0);

    let score = 0;
    score -= duplicateCount * 8;
    if (roleTag === "setup") {
      score += Math.max(0, payoffCount - setupCount) * 6;
      if (duplicateCount >= 3) { score -= (duplicateCount - 2) * 14; }
    }
    if (roleTag === "payoff") {
      score += Math.max(0, setupCount - payoffCount) * 4;
      if (duplicateCount >= 1) { score -= duplicateCount * 10; }
    }
    if (roleTag === "answer") {
      if (answerCount === 0) { score += 14; }
      if (duplicateCount >= 2) { score -= (duplicateCount - 1) * 16; }
    }
    if (roleTag === "salvage" && salvageCount === 0) { score += 18; }
    if (roleTag === "support" && supportCount < 2) { score += 8; }
    if (roleTag === "support" && duplicateCount >= 2) { score -= (duplicateCount - 1) * 12; }
    if ((roleTag === "support" || roleTag === "answer") && duplicateCount >= 3) { score -= (duplicateCount - 2) * 12; }
    if (Number.isFinite(familyLimit)) {
      const softFamilyCeiling = Math.max(4, familyLimit - 3);
      if (familyCount > softFamilyCeiling) { score -= (familyCount - softFamilyCeiling) * 18; }
      if (familyCount >= familyLimit) { score -= 120; }
    }

    const baseId = scoring.getBaseCardId(scoring.getEvolutionTerminalCardId(cardId));
    const penaltyCards: Record<string, { tree: string; famThresh: number; famPen: number; dupPen: number }> = {
      amazon_pierce: { tree: "passive", famThresh: 2, famPen: 28, dupPen: 18 },
      paladin_conviction: { tree: "offensive_auras", famThresh: 2, famPen: 28, dupPen: 18 },
      assassin_shadow_warrior: { tree: "shadow", famThresh: 2, famPen: 26, dupPen: 18 },
      assassin_phoenix_strike: { tree: "martial_arts", famThresh: 2, famPen: 30, dupPen: 20 },
      sorceress_lightning_mastery: { tree: "lightning", famThresh: 2, famPen: 28, dupPen: 18 },
    };
    const penalty = penaltyCards[baseId];
    if (penalty && !buildPath?.primaryTrees?.includes(penalty.tree)) {
      if (familyCount >= penalty.famThresh) { score -= (familyCount - penalty.famThresh + 1) * penalty.famPen; }
      if (duplicateCount >= 1) { score -= duplicateCount * penalty.dupPen; }
    }

    if (baseId === "assassin_shadow_warrior") {
      if (familyCount >= 4) { score -= (familyCount - 3) * 24; }
      if (duplicateCount >= 3) { score -= (duplicateCount - 2) * 18; }
    }
    if (baseId === "barbarian_berserk") {
      if (familyCount >= 1) { score -= familyCount * 26; }
      if (duplicateCount >= 1) { score -= duplicateCount * 20; }
    }
    if (baseId === "necromancer_revive") {
      if (familyCount >= 1) { score -= familyCount * 28; }
      if (duplicateCount >= 1) { score -= duplicateCount * 20; }
    }
    if (baseId === "druid_fury") {
      if (familyCount >= 5) { score -= (familyCount - 4) * 24; }
      if (duplicateCount >= 3) { score -= (duplicateCount - 2) * 20; }
    }
    if (baseId === "druid_armageddon") {
      if (familyCount >= 4) { score -= (familyCount - 3) * 24; }
      if (duplicateCount >= 2) { score -= (duplicateCount - 1) * 20; }
    }
    if (baseId === "druid_summon_grizzly") {
      if (familyCount >= 4) { score -= (familyCount - 3) * 24; }
      if (duplicateCount >= 3) { score -= (duplicateCount - 2) * 20; }
    }
    if (baseId === "druid_heart_of_wolverine") {
      if (familyCount >= 4) { score -= (familyCount - 3) * 20; }
      if (duplicateCount >= 3) { score -= (duplicateCount - 2) * 16; }
    }
    if (baseId === "sorceress_frozen_orb") {
      if (familyCount >= 9) { score -= (familyCount - 8) * 18; }
      if (duplicateCount >= 5) { score -= (duplicateCount - 4) * 16; }
    }
    const rawBaseId = scoring.getBaseCardId(cardId);
    if (rawBaseId === "barbarian_weapon_mastery" || rawBaseId === "barbarian_steel_skin" || rawBaseId === "barbarian_unyielding") {
      if (duplicateCount >= 4) { score -= (duplicateCount - 3) * 24; }
    }
    return score;
  }

  runtimeWindow.__ROUGE_REWARD_STRATEGY_NEED_SCORING = {
    getPrimaryRoleCounts,
    getReinforcementNeedScore,
  };
})();
