(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    pickProgressionChoice,
    getRewardAccountFeatures,
    scaleGoldValue,
    buildBoonChoice,
  } = runtimeWindow.__ROUGE_REWARD_ENGINE_PROGRESSION;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const strategies = runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER_STRATEGIES;

  function getDeckUpgradeThreshold(actNumber: number) { return 12 + Math.max(0, actNumber) * 2; }
  function getDeckSoftCardCap(actNumber: number) { return 14 + Math.max(0, actNumber) * 2; }
  function getDeckHardCardCap(actNumber: number) { return 18 + Math.max(0, actNumber) * 3; }

  const BOON_POOLS: Record<string, { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }[]> = {
    opening: [
      {
        id: "field_training",
        title: "Field Training",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 6 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 6 }],
      },
      {
        id: "supply_cache",
        title: "Supply Cache",
        subtitle: "Run Economy",
        description: "Take extra gold and top off one potion charge for the road ahead.",
        effects: [
          { kind: "gold_bonus", value: 18 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "mercenary_drill",
        title: "Mercenary Drill",
        subtitle: "Companion Boon",
        description: "Harden your mercenary with +1 attack and +4 max Life.",
        effects: [
          { kind: "mercenary_attack", value: 1 },
          { kind: "mercenary_max_life", value: 4 },
        ],
      },
    ],
    branchBattle: [
      {
        id: "battlefield_rites",
        title: "Battlefield Rites",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 8 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 8 }],
      },
      {
        id: "war_chest",
        title: "War Chest",
        subtitle: "Run Economy",
        description: "Take extra gold and refill one potion charge.",
        effects: [
          { kind: "gold_bonus", value: 26 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "escort_contract",
        title: "Escort Contract",
        subtitle: "Companion Boon",
        description: "Raise mercenary attack by 1 and max Life by 6.",
        effects: [
          { kind: "mercenary_attack", value: 1 },
          { kind: "mercenary_max_life", value: 6 },
        ],
      },
    ],
    branchMiniboss: [
      {
        id: "veteran_instinct",
        title: "Veteran Instinct",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 10 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 10 }],
      },
      {
        id: "belt_satchel",
        title: "Belt Satchel",
        subtitle: "Utility Boon",
        description: "Increase belt capacity by 1 and immediately gain 1 potion charge.",
        effects: [
          { kind: "belt_capacity", value: 1 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "mercenary_veterancy",
        title: "Mercenary Veterancy",
        subtitle: "Companion Boon",
        description: "Raise mercenary attack by 2 and max Life by 6.",
        effects: [
          { kind: "mercenary_attack", value: 2 },
          { kind: "mercenary_max_life", value: 6 },
        ],
      },
    ],
    boss: [
      {
        id: "horadric_satchel",
        title: "Horadric Satchel",
        subtitle: "Major Boon",
        description: "Increase belt capacity by 1 and immediately refill 2 potion charges.",
        effects: [
          { kind: "belt_capacity", value: 1 },
          { kind: "refill_potions", value: 2 },
        ],
      },
      {
        id: "inner_focus",
        title: "Inner Focus",
        subtitle: "Major Boon",
        description: "Raise max Energy by 1 and improve potion healing by 2.",
        effects: [
          { kind: "hero_max_energy", value: 1 },
          { kind: "hero_potion_heal", value: 2 },
        ],
      },
      {
        id: "warband_command",
        title: "Warband Command",
        subtitle: "Major Boon",
        description: "Raise hero max Life by 12 and mercenary attack by 2 and max Life by 8.",
        effects: [
          { kind: "hero_max_life", value: 12 },
          { kind: "mercenary_attack", value: 2 },
          { kind: "mercenary_max_life", value: 8 },
        ],
      },
    ],
  };

  function getChoiceSeed(run: RunState, zone: ZoneState, actNumber: number, encounterNumber: number) {
    return actNumber * 41 + encounterNumber * 17 + run.deck.length * 7 + zone.title.length;
  }

  function getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent) {
    return (Array.isArray(pool) ? pool : []).filter((cardId: string) => Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId));
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
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = getPoolCandidates(pool, usedCardIds, content);
    if (candidates.length === 0) {
      return "";
    }
    return pickCandidateWithTreeBias(candidates, seed, preferredTrees, supportTrees);
  }

  function pickRoleScopedCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = getPoolCandidates(pool, usedCardIds, content).filter((cardId: string) => archetypes.getCardRewardRole(cardId, content) === role);
    return pickCandidateWithTreeBias(candidates, seed, preferredTrees, supportTrees);
  }

  function pickCardForRole(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const strictMatch = pickRoleScopedCardId(pool, seed, usedCardIds, content, role, preferredTrees, supportTrees);
    if (strictMatch) {
      return strictMatch;
    }
    return pickPreferredCardId(pool, seed, usedCardIds, content, preferredTrees, supportTrees);
  }

  function buildRoleSubtitle(buildPath: ReturnType<typeof archetypes.getRewardPathPreference>, role: CardRewardRole) {
    const roleLabel = archetypes.CARD_ROLE_LABELS[role] || archetypes.CARD_ROLE_LABELS.engine;
    return buildPath ? `${buildPath.label} ${roleLabel}` : `${roleLabel} Skill`;
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
    const pool = (BOON_POOLS as Record<string, typeof BOON_POOLS.opening>)[zoneRole] || BOON_POOLS.opening;
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

    if (allowFallbackCards) {
      for (let poolIndex = 0; choices.length < 3 && poolIndex < fallbackPools.length; poolIndex += 1) {
        const pool = fallbackPools[poolIndex];
        const cardId = pickPreferredCardId(
          pool,
          seed + poolIndex + choices.length,
          usedCardIds,
          content,
          buildPath?.primaryTrees || [],
          buildPath?.supportTrees || []
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
    const preferredUpgradeCandidates = upgradableCardIds.filter((cardId: string) => {
      const tree = archetypes.getCardTree(cardId);
      return buildPath?.primaryTrees?.includes(tree) || buildPath?.supportTrees?.includes(tree);
    });
    const upgradeSource = preferredUpgradeCandidates.length > 0 ? preferredUpgradeCandidates : upgradableCardIds;
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

    const firstCardPool = zone.kind === ZONE_KIND.BOSS ? [...bossPool, ...profilePool] : [...profilePool, ...zonePool];
    const firstCardId = pickCardForRole(
      firstCardPool,
      seed,
      usedCardIds,
      content,
      "engine",
      buildPath?.primaryTrees || [],
      buildPath?.supportTrees || []
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

    const secondCardPool = zone.kind === ZONE_KIND.BOSS ? [...zonePool, ...profilePool] : [...zonePool, ...profilePool, ...bossPool];
    const canOfferSecondaryCard = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    if (choices.length < 3 && canOfferSecondaryCard) {
      let secondCardId = pickRoleScopedCardId(
        secondCardPool,
        seed + 5,
        usedCardIds,
        content,
        "support",
        buildPath?.supportTrees || buildPath?.primaryTrees || [],
        buildPath?.primaryTrees || []
      );
      if (!secondCardId) {
        secondCardId = pickRoleScopedCardId(
          secondCardPool,
          seed + 6,
          usedCardIds,
          content,
          "tech",
          buildPath?.primaryTrees || buildPath?.supportTrees || [],
          buildPath?.supportTrees || []
        );
      }
      if (!secondCardId) {
        secondCardId = pickCardForRole(
          secondCardPool,
          seed + 5,
          usedCardIds,
          content,
          "support",
          buildPath?.supportTrees || buildPath?.primaryTrees || [],
          buildPath?.primaryTrees || []
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
