(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  const {
    pickProgressionChoice,
    getRewardAccountFeatures,
    scaleGoldValue,

    buildBoonChoice,
  } = runtimeWindow.__ROUGE_REWARD_ENGINE_PROGRESSION;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;

  const MAX_BELT_SIZE = 5;
  function getDeckUpgradeThreshold(actNumber: number) {
    return 12 + Math.max(0, actNumber) * 2;
  }

  function getDeckSoftCardCap(actNumber: number) {
    return 14 + Math.max(0, actNumber) * 2;
  }

  function getDeckHardCardCap(actNumber: number) {
    return 18 + Math.max(0, actNumber) * 3;
  }

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

  function getDeckProfileId(content: GameContent, classId: string) {
    return content.classDeckProfiles?.[classId] || "warrior";
  }

  function getChoiceSeed(run: RunState, zone: ZoneState, actNumber: number, encounterNumber: number) {
    return actNumber * 41 + encounterNumber * 17 + run.deck.length * 7 + zone.title.length;
  }

  function pickUniqueCardId(pool: string[], seed: number, usedCardIds: Set<string>, content: GameContent) {
    const candidates = (Array.isArray(pool) ? pool : []).filter((cardId: string) => {
      return Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId);
    });
    if (candidates.length === 0) {
      return "";
    }
    return candidates[seed % candidates.length];
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
    return {
      id: `reward_card_${cardId}`,
      kind: "card",
      title: card.title,
      subtitle,
      description: card.text,
      previewLines: [
        `Add ${card.title} to your deck.`,
        `Deck size +1.`,
      ],
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
      subtitle: "Sharpen Skill",
      description: upgradedCard.text,
      previewLines: [
        `Replace 1x ${baseCard.title} with ${upgradedCard.title}.`,
        `Keep deck size the same.`,
      ],
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

  function ensureThreeChoices(
    choices: RewardChoice[],
    run: RunState,
    zone: ZoneState,
    content: GameContent,
    seed: number,
    usedCardIds: Set<string>,
    profile: ProfileState | null = null,
    actNumber: number = 1,
    allowFallbackCards = true
  ) {
    const profileId = getDeckProfileId(content, run.classId);
    const fallbackPools = [
      content.rewardPools?.profileCards?.[profileId] || [],
      content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [],
      content.rewardPools?.bossCards || [],
    ];

    if (allowFallbackCards) {
      for (let poolIndex = 0; choices.length < 3 && poolIndex < fallbackPools.length; poolIndex += 1) {
        const pool = fallbackPools[poolIndex];
        const cardId = pickUniqueCardId(pool, seed + poolIndex + choices.length, usedCardIds, content);
        if (!cardId) {
          continue;
        }
        usedCardIds.add(cardId);
        choices.push(buildCardChoice(cardId, content, "Fallback Skill"));
      }
    }

    while (choices.length < 3) {
      choices.push(pickBoonChoice(zone.zoneRole, seed + choices.length, profile, actNumber));
    }

    return choices.slice(0, runtimeWindow.ROUGE_LIMITS.REWARD_CHOICES);
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

  function buildRewardChoices({ content, run, zone, actNumber, encounterNumber, profile = null }: { content: GameContent; run: RunState; zone: ZoneState; actNumber: number; encounterNumber: number; profile?: ProfileState | null }) {
    const seed = getChoiceSeed(run, zone, actNumber, encounterNumber);
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const usedCardIds = new Set<string>();
    const choices: RewardChoice[] = [];
    const profileId = getDeckProfileId(content, run.classId);
    const classPool = getClassPoolForZone(content, run.classId, zone.zoneRole, actNumber);
    const profilePool = classPool.length > 0 ? classPool : (content.rewardPools?.profileCards?.[profileId] || []);
    const zonePool = content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [];
    const bossPool = content.rewardPools?.bossCards || [];
    const upgradableCardIds = getUpgradableCardIds(run, content);
    const upgradeCardId = upgradableCardIds.length > 0 ? upgradableCardIds[seed % upgradableCardIds.length] : "";
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
    const firstCardId = pickUniqueCardId(firstCardPool, seed, usedCardIds, content);
    const canOfferPrimaryCard = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !hardCapCards;
    if (firstCardId && canOfferPrimaryCard) {
      usedCardIds.add(firstCardId);
      choices.push(buildCardChoice(firstCardId, content, "Class Skill"));
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
      const secondCardId = pickUniqueCardId(secondCardPool, seed + 5, usedCardIds, content);
      if (secondCardId) {
        usedCardIds.add(secondCardId);
        choices.push(buildCardChoice(secondCardId, content, "Route Skill"));
      }
    }

    const allowFallbackCards = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    return ensureThreeChoices(choices, run, zone, content, seed + 13, usedCardIds, profile, actNumber, allowFallbackCards);
  }

  function addCardToDeck(run: RunState, cardId: string, content: GameContent) {
    if (!content.cardCatalog[cardId]) {
      return { ok: false, message: `Unknown reward card: ${cardId}` };
    }
    run.deck.push(cardId);
    return { ok: true };
  }

  function upgradeCardInDeck(run: RunState, fromCardId: string, toCardId: string, content: GameContent) {
    if (!fromCardId || !toCardId || !content.cardCatalog[toCardId]) {
      return { ok: false, message: "Reward upgrade is invalid." };
    }
    const deckIndex = run.deck.findIndex((cardId: string) => cardId === fromCardId);
    if (deckIndex < 0) {
      return { ok: false, message: `No ${fromCardId} copy remains in the deck.` };
    }
    run.deck.splice(deckIndex, 1, toCardId);
    return { ok: true };
  }

  function applyChoice(run: RunState, choice: RewardChoice, content: GameContent) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const equipmentEffects = effects.filter((effect: RewardChoiceEffect) => {
      return (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      );
    });

    if (equipmentEffects.length > 0 && itemSystem) {
      const equipmentResult = itemSystem.applyChoice(
        run,
        {
          ...choice,
          effects: equipmentEffects,
        },
        content
      );
      if (!equipmentResult.ok) {
        return equipmentResult;
      }
    }

    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];
      if (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      ) {
        continue;
      }

      if (effect.kind === "add_card") {
        const result = addCardToDeck(run, effect.cardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "upgrade_card") {
        const result = upgradeCardInDeck(run, effect.fromCardId, effect.toCardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "hero_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.hero.maxLife += lifeGain;
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "hero_max_energy") {
        const energyGain = toNumber(effect.value, 0);
        run.hero.maxEnergy = clamp(run.hero.maxEnergy + energyGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
        continue;
      }

      if (effect.kind === "hero_potion_heal") {
        const potionGain = toNumber(effect.value, 0);
        run.hero.potionHeal = clamp(run.hero.potionHeal + potionGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
        continue;
      }

      if (effect.kind === "mercenary_attack") {
        const attackGain = toNumber(effect.value, 0);
        run.mercenary.attack += attackGain;
        continue;
      }

      if (effect.kind === "mercenary_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.mercenary.maxLife += lifeGain;
        run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "belt_capacity") {
        const capacityGain = toNumber(effect.value, 0);
        run.belt.max = clamp(run.belt.max + capacityGain, 1, MAX_BELT_SIZE);
        continue;
      }

      if (effect.kind === "refill_potions") {
        const refillAmount = toNumber(effect.value, 0);
        run.belt.current = Math.min(run.belt.max, run.belt.current + refillAmount);
        continue;
      }

      if (effect.kind === "gold_bonus") {
        const goldGain = toNumber(effect.value, 0);
        run.gold += goldGain;
        run.summary.goldGained += goldGain;
        continue;
      }

      if (effect.kind === "class_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.classPointsAvailable += pointGain;
        run.summary.classPointsEarned += pointGain;
        continue;
      }

      if (effect.kind === "attribute_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.attributePointsAvailable += pointGain;
        run.summary.attributePointsEarned += pointGain;
      }
    }

    return { ok: true };
  }

  runtimeWindow.ROUGE_REWARD_ENGINE = {
    buildRewardChoices,
    applyChoice,
    getUpgradableCardIds,
  };
})();
