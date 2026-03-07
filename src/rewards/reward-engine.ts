(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const MAX_HERO_ENERGY = 6;
  const MAX_BELT_SIZE = 5;
  const MAX_POTION_HEAL = 24;

  const BOON_POOLS = {
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

  const PROGRESSION_BOON_POOLS = {
    branchBattle: [
      {
        id: "battle_instinct",
        title: "Battle Instinct",
        subtitle: "Build Boon",
        description: "Gain 1 attribute point to sharpen the current run's stat line.",
        effects: [{ kind: "attribute_point", value: 1 }],
      },
    ],
    branchMiniboss: [
      {
        id: "heroic_instinct",
        title: "Heroic Instinct",
        subtitle: "Build Boon",
        description: "Gain 1 attribute point and 10 gold to shape the next stretch of the route.",
        effects: [
          { kind: "attribute_point", value: 1 },
          { kind: "gold_bonus", value: 10 },
        ],
      },
    ],
    boss: [
      {
        id: "class_mastery",
        title: "Class Mastery",
        subtitle: "Major Build Boon",
        description: "Gain 1 class point and 1 attribute point for a real post-boss build pivot.",
        effects: [
          { kind: "class_point", value: 1 },
          { kind: "attribute_point", value: 1 },
        ],
      },
    ],
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getDeckProfileId(content, classId) {
    return content.classDeckProfiles?.[classId] || "warrior";
  }

  function getChoiceSeed(run, zone, actNumber, encounterNumber) {
    return actNumber * 41 + encounterNumber * 17 + run.deck.length * 7 + zone.title.length;
  }

  function pickUniqueCardId(pool, seed, usedCardIds, content) {
    const candidates = (Array.isArray(pool) ? pool : []).filter((cardId) => {
      return Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId);
    });
    if (candidates.length === 0) {
      return "";
    }
    return candidates[seed % candidates.length];
  }

  function getUpgradableCardIds(run, content) {
    const seen = new Set();
    return run.deck.filter((cardId) => {
      const upgradedCardId = `${cardId}_plus`;
      if (seen.has(cardId) || !content.cardCatalog[upgradedCardId]) {
        return false;
      }
      seen.add(cardId);
      return true;
    });
  }

  function buildCardChoice(cardId, content, subtitle) {
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
      effects: [{ kind: "add_card", cardId }],
    };
  }

  function buildUpgradeChoice(fromCardId, content) {
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
      effects: [{ kind: "upgrade_card", fromCardId, toCardId: upgradedCardId }],
    };
  }

  function buildBoonChoice(boonDefinition) {
    return {
      id: `reward_boon_${boonDefinition.id}`,
      kind: "boon",
      title: boonDefinition.title,
      subtitle: boonDefinition.subtitle,
      description: boonDefinition.description,
      previewLines: boonDefinition.effects.map(describeEffectPreview),
      effects: boonDefinition.effects.map((effect) => ({ ...effect })),
    };
  }

  function describeEffectPreview(effect) {
    if (effect.kind === "hero_max_life") {
      return `Hero max Life +${effect.value}.`;
    }
    if (effect.kind === "hero_max_energy") {
      return `Hero max Energy +${effect.value}.`;
    }
    if (effect.kind === "hero_potion_heal") {
      return `Potion healing +${effect.value}.`;
    }
    if (effect.kind === "mercenary_attack") {
      return `Mercenary attack +${effect.value}.`;
    }
    if (effect.kind === "mercenary_max_life") {
      return `Mercenary max Life +${effect.value}.`;
    }
    if (effect.kind === "belt_capacity") {
      return `Belt capacity +${effect.value}.`;
    }
    if (effect.kind === "refill_potions") {
      return `Refill ${effect.value} potion charge${effect.value === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "gold_bonus") {
      return `Gain ${effect.value} extra gold.`;
    }
    if (effect.kind === "class_point") {
      return `Gain ${effect.value} class point${effect.value === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "attribute_point") {
      return `Gain ${effect.value} attribute point${effect.value === 1 ? "" : "s"}.`;
    }
    return "Run improves.";
  }

  function pickBoonChoice(zoneRole, seed) {
    const pool = BOON_POOLS[zoneRole] || BOON_POOLS.opening;
    const definition = pool[seed % pool.length];
    return buildBoonChoice(definition);
  }

  function pickProgressionChoice(zone, seed) {
    const pool = PROGRESSION_BOON_POOLS[zone.kind] || PROGRESSION_BOON_POOLS[zone.zoneRole] || [];
    if (pool.length === 0) {
      return null;
    }
    return buildBoonChoice(pool[seed % pool.length]);
  }

  function ensureThreeChoices(choices, run, zone, content, seed, usedCardIds) {
    const profileId = getDeckProfileId(content, run.classId);
    const fallbackPools = [
      content.rewardPools?.profileCards?.[profileId] || [],
      content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [],
      content.rewardPools?.bossCards || [],
    ];

    for (let poolIndex = 0; choices.length < 3 && poolIndex < fallbackPools.length; poolIndex += 1) {
      const pool = fallbackPools[poolIndex];
      const cardId = pickUniqueCardId(pool, seed + poolIndex + choices.length, usedCardIds, content);
      if (!cardId) {
        continue;
      }
      usedCardIds.add(cardId);
      choices.push(buildCardChoice(cardId, content, "Fallback Skill"));
    }

    while (choices.length < 3) {
      choices.push(pickBoonChoice(zone.zoneRole, seed + choices.length));
    }

    return choices.slice(0, 3);
  }

  function buildRewardChoices({ content, run, zone, actNumber, encounterNumber }) {
    const seed = getChoiceSeed(run, zone, actNumber, encounterNumber);
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const usedCardIds = new Set();
    const choices = [];
    const profileId = getDeckProfileId(content, run.classId);
    const profilePool = content.rewardPools?.profileCards?.[profileId] || [];
    const zonePool = content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [];
    const bossPool = content.rewardPools?.bossCards || [];
    const upgradableCardIds = getUpgradableCardIds(run, content);
    const upgradeCardId = upgradableCardIds.length > 0 ? upgradableCardIds[seed % upgradableCardIds.length] : "";
    const upgradeChoice = upgradeCardId ? buildUpgradeChoice(upgradeCardId, content) : null;
    const equipmentChoice = itemSystem?.buildEquipmentChoice({
      content,
      run,
      zone,
      actNumber,
      encounterNumber,
    });
    const progressionChoice = pickProgressionChoice(zone, seed + 3);

    const firstCardPool = zone.kind === "boss" ? [...bossPool, ...profilePool] : [...profilePool, ...zonePool];
    const firstCardId = pickUniqueCardId(firstCardPool, seed, usedCardIds, content);
    if (firstCardId) {
      usedCardIds.add(firstCardId);
      choices.push(buildCardChoice(firstCardId, content, "Class Skill"));
    }

    if (progressionChoice) {
      choices.push(progressionChoice);
    }

    if (equipmentChoice) {
      choices.push(equipmentChoice);
    }

    if (zone.kind === "boss") {
      if (choices.length < 3) {
        choices.push(pickBoonChoice("boss", seed + 9));
      }
      if (upgradeChoice && choices.length < 3) {
        choices.push(upgradeChoice);
      }
    } else if ((zone.kind === "miniboss" || zone.zoneRole === "branchBattle") && upgradeChoice) {
      if (choices.length >= 3) {
        choices[choices.length - 1] = upgradeChoice;
      } else {
        choices.push(upgradeChoice);
      }
    }

    const boonRole = zone.kind === "boss" ? "boss" : zone.zoneRole;
    if (zone.kind !== "boss" && choices.length < 3) {
      choices.push(pickBoonChoice(boonRole, seed + 9));
    }

    const secondCardPool = zone.kind === "boss" ? [...zonePool, ...profilePool] : [...zonePool, ...profilePool, ...bossPool];
    if (choices.length < 3) {
      const secondCardId = pickUniqueCardId(secondCardPool, seed + 5, usedCardIds, content);
      if (secondCardId) {
        usedCardIds.add(secondCardId);
        choices.push(buildCardChoice(secondCardId, content, "Route Skill"));
      }
    }

    return ensureThreeChoices(choices, run, zone, content, seed + 13, usedCardIds);
  }

  function addCardToDeck(run, cardId, content) {
    if (!content.cardCatalog[cardId]) {
      return { ok: false, message: `Unknown reward card: ${cardId}` };
    }
    run.deck.push(cardId);
    return { ok: true };
  }

  function upgradeCardInDeck(run, fromCardId, toCardId, content) {
    if (!fromCardId || !toCardId || !content.cardCatalog[toCardId]) {
      return { ok: false, message: "Reward upgrade is invalid." };
    }
    const deckIndex = run.deck.findIndex((cardId) => cardId === fromCardId);
    if (deckIndex < 0) {
      return { ok: false, message: `No ${fromCardId} copy remains in the deck.` };
    }
    run.deck.splice(deckIndex, 1, toCardId);
    return { ok: true };
  }

  function applyChoice(run, choice, content) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const equipmentEffects = effects.filter((effect) => {
      return effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket";
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
      if (effect.kind === "equip_item" || effect.kind === "socket_rune" || effect.kind === "add_socket") {
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
        const lifeGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.hero.maxLife += lifeGain;
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "hero_max_energy") {
        const energyGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.hero.maxEnergy = clamp(run.hero.maxEnergy + energyGain, 1, MAX_HERO_ENERGY);
        continue;
      }

      if (effect.kind === "hero_potion_heal") {
        const potionGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.hero.potionHeal = clamp(run.hero.potionHeal + potionGain, 1, MAX_POTION_HEAL);
        continue;
      }

      if (effect.kind === "mercenary_attack") {
        const attackGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.mercenary.attack += attackGain;
        continue;
      }

      if (effect.kind === "mercenary_max_life") {
        const lifeGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.mercenary.maxLife += lifeGain;
        run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "belt_capacity") {
        const capacityGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.belt.max = clamp(run.belt.max + capacityGain, 1, MAX_BELT_SIZE);
        continue;
      }

      if (effect.kind === "refill_potions") {
        const refillAmount = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.belt.current = Math.min(run.belt.max, run.belt.current + refillAmount);
        continue;
      }

      if (effect.kind === "gold_bonus") {
        const goldGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.gold += goldGain;
        run.summary.goldGained += goldGain;
        continue;
      }

      if (effect.kind === "class_point") {
        const pointGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.progression.classPointsAvailable += pointGain;
        run.summary.classPointsEarned += pointGain;
        continue;
      }

      if (effect.kind === "attribute_point") {
        const pointGain = Number.parseInt(String(effect.value || 0), 10) || 0;
        run.progression.attributePointsAvailable += pointGain;
        run.summary.attributePointsEarned += pointGain;
      }
    }

    return { ok: true };
  }

  runtimeWindow.ROUGE_REWARD_ENGINE = {
    buildRewardChoices,
    applyChoice,
  };
})();
