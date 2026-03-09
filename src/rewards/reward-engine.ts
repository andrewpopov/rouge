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

  function hasTownFeature(profile, featureId) {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function getFocusedAccountTreeId(profile) {
    return typeof profile?.meta?.accountProgression?.focusedTreeId === "string" ? profile.meta.accountProgression.focusedTreeId : "";
  }

  function getRewardAccountFeatures(profile) {
    const focusedTreeId = getFocusedAccountTreeId(profile);
    const masteryUnlocked =
      hasTownFeature(profile, "boss_trophy_gallery") ||
      hasTownFeature(profile, "class_roster_archive") ||
      hasTownFeature(profile, "training_grounds") ||
      hasTownFeature(profile, "war_college") ||
      hasTownFeature(profile, "paragon_doctrine") ||
      hasTownFeature(profile, "apex_doctrine") ||
      hasTownFeature(profile, "legend_doctrine");
    return {
      economyLedger: hasTownFeature(profile, "economy_ledger"),
      bossTrophyGallery: hasTownFeature(profile, "boss_trophy_gallery"),
      trainingGrounds: hasTownFeature(profile, "training_grounds"),
      warCollege: hasTownFeature(profile, "war_college"),
      paragonDoctrine: hasTownFeature(profile, "paragon_doctrine"),
      apexDoctrine: hasTownFeature(profile, "apex_doctrine"),
      legendDoctrine: hasTownFeature(profile, "legend_doctrine"),
      warAnnals: hasTownFeature(profile, "war_annals"),
      legendaryAnnals: hasTownFeature(profile, "legendary_annals"),
      masteryFocus: focusedTreeId === "mastery" && masteryUnlocked,
    };
  }

  function getArchiveRewardSignals(profile) {
    const accountSummary = runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile) || null;
    return {
      completedCount: clamp(accountSummary?.archive?.completedCount || 0, 0, 999),
      featureUnlockCount: clamp(accountSummary?.archive?.featureUnlockCount || 0, 0, 999),
      favoredTreeName: typeof accountSummary?.archive?.favoredTreeName === "string" ? accountSummary.archive.favoredTreeName : "",
    };
  }

  function scaleGoldValue(value, profile) {
    const features = getRewardAccountFeatures(profile);
    if (!features.economyLedger) {
      return value;
    }
    return Math.max(0, Math.ceil(value * 1.25));
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

  function pickBoonChoice(zoneRole, seed, profile = null, actNumber = 1) {
    const pool = BOON_POOLS[zoneRole] || BOON_POOLS.opening;
    const definition = pool[seed % pool.length];
    const scaledEffects = definition.effects.map((effect) => {
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
    if (getRewardAccountFeatures(profile).economyLedger && scaledEffects.some((effect) => effect.kind === "gold_bonus")) {
      choice.previewLines.push("Economy Ledger dividend is active on this payout.");
    }
    return choice;
  }

  function pickProgressionChoice(zone, seed, run, actNumber, content, profile = null) {
    const pool = PROGRESSION_BOON_POOLS[zone.kind] || PROGRESSION_BOON_POOLS[zone.zoneRole] || [];
    if (pool.length === 0) {
      return null;
    }

    const definition = pool[seed % pool.length];
    const progressionSummary = runtimeWindow.ROUGE_RUN_FACTORY?.getProgressionSummary?.(run, content) || null;
    const focusedTreeName = progressionSummary?.favoredTreeName || run.className || "Current build";
    const features = getRewardAccountFeatures(profile);
    const archiveSignals = getArchiveRewardSignals(profile);
    const trainingGroundsClassBonus =
      features.trainingGrounds && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") ? 1 : 0;
    const masteryFocusClassBonus = features.masteryFocus && zone.kind === "boss" ? 1 : 0;
    const warCollegeClassBonus = features.warCollege && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") ? 1 : 0;
    const paragonDoctrineClassBonus =
      features.paragonDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4 ? 1 : 0;
    const apexDoctrineClassBonus =
      features.apexDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5 ? 1 : 0;
    const legendDoctrineClassBonus =
      features.legendDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 1 + Number(zone.kind === "boss")
        : 0;
    const warAnnalsClassBonus =
      features.warAnnals && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4
        ? 1 + Number(zone.kind === "boss" && actNumber >= 5 && archiveSignals.completedCount >= 4)
        : 0;
    const legendaryAnnalsClassBonus =
      features.legendaryAnnals && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 6)
        : 0;
    const trainingGroundsAttributeBonus = features.trainingGrounds && zone.kind === "boss" && actNumber >= 4 ? 1 : 0;
    const masteryFocusAttributeBonus = features.masteryFocus && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const warCollegeAttributeBonus = features.warCollege && zone.kind === "boss" && actNumber >= 4 ? 1 : 0;
    const paragonDoctrineAttributeBonus = features.paragonDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const apexDoctrineAttributeBonus = features.apexDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const legendDoctrineAttributeBonus = features.legendDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const warAnnalsAttributeBonus =
      features.warAnnals && zone.kind === "boss" && actNumber >= 4
        ? 1 + Number(actNumber >= 5 && archiveSignals.featureUnlockCount >= 3)
        : 0;
    const legendaryAnnalsAttributeBonus =
      features.legendaryAnnals && zone.kind === "boss" && actNumber >= 5
        ? 1 + Number(archiveSignals.featureUnlockCount >= 4)
        : 0;
    const scaledEffects = definition.effects.map((effect) => {
      if (effect.kind === "class_point") {
        return {
          ...effect,
          value:
            effect.value +
            (zone.kind === "boss" ? Math.min(2, Math.floor(Math.max(0, actNumber - 1) / 2)) : 0) +
            (features.bossTrophyGallery && zone.kind === "boss" ? 1 : 0) +
            trainingGroundsClassBonus +
            warCollegeClassBonus +
            paragonDoctrineClassBonus +
            apexDoctrineClassBonus +
            legendDoctrineClassBonus +
            warAnnalsClassBonus +
            legendaryAnnalsClassBonus +
            masteryFocusClassBonus,
        };
      }

      if (effect.kind === "attribute_point") {
        return {
          ...effect,
          value:
            effect.value +
            (zone.kind === "boss" && actNumber >= 4 ? 1 : 0) +
            (features.bossTrophyGallery && zone.kind === "boss" && actNumber >= 5 ? 1 : 0) +
            trainingGroundsAttributeBonus +
            warCollegeAttributeBonus +
            paragonDoctrineAttributeBonus +
            apexDoctrineAttributeBonus +
            legendDoctrineAttributeBonus +
            warAnnalsAttributeBonus +
            legendaryAnnalsAttributeBonus +
            masteryFocusAttributeBonus,
        };
      }

      if (effect.kind === "gold_bonus") {
        return {
          ...effect,
          value: scaleGoldValue(effect.value + actNumber * 4, profile),
        };
      }

      return { ...effect };
    });

    if ((zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 3) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    } else if (zone.zoneRole === "branchBattle" && actNumber >= 4) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.trainingGrounds && !scaledEffects.some((effect) => effect.kind === "class_point") && (zone.kind === "miniboss" || zone.kind === "boss")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.trainingGrounds && zone.kind === "boss" && !scaledEffects.some((effect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 4) + Number(features.masteryFocus && actNumber >= 5) });
    }
    if (features.warCollege && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(actNumber >= 4) });
    }
    if (features.warCollege && zone.kind === "boss") {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 5) });
    }
    if (features.paragonDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.apexDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.apexDoctrine && zone.kind === "boss" && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 });
    }
    if (features.legendDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss") });
    }
    if (features.legendDoctrine && zone.kind === "boss" && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 });
    }
    if (features.warAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && !scaledEffects.some((effect) => effect.kind === "class_point")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss" && actNumber >= 5) });
    }
    if (features.warAnnals && zone.kind === "boss" && actNumber >= 4 && !scaledEffects.some((effect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 5 && archiveSignals.completedCount >= 4) });
    }
    if (features.legendaryAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && !scaledEffects.some((effect) => effect.kind === "class_point")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 6) });
    }
    if (features.legendaryAnnals && zone.kind === "boss" && !scaledEffects.some((effect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(archiveSignals.featureUnlockCount >= 4) });
    }

    const choice = buildBoonChoice({
      ...definition,
      id: `${definition.id}_${zone.id}_${actNumber}`,
      title: zone.kind === "boss" ? `${focusedTreeName} Mastery` : definition.title,
      description:
        zone.kind === "boss"
          ? `Gain a late-act build pivot that reinforces ${focusedTreeName.toLowerCase()} and keeps the run growing into town spends.`
          : `${definition.description} Current focus: ${focusedTreeName}.`,
      effects: scaledEffects,
    });

    if (progressionSummary?.nextClassUnlock) {
      choice.previewLines.push(progressionSummary.nextClassUnlock);
    }
    if (features.bossTrophyGallery && zone.kind === "boss") {
      choice.previewLines.push("Boss Trophy Gallery is reinforcing this post-boss build pivot.");
    }
    if (features.trainingGrounds && (zone.kind === "miniboss" || zone.kind === "boss")) {
      choice.previewLines.push("Training Grounds is converting account mastery into extra progression points.");
    }
    if (features.masteryFocus && zone.kind === "boss") {
      choice.previewLines.push("Mastery Hall focus is sharpening this reward pivot.");
    }
    if (features.warCollege && (zone.kind === "miniboss" || zone.kind === "boss")) {
      choice.previewLines.push("War College is hardening this late-run progression pivot.");
    }
    if (features.paragonDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 4) {
      choice.previewLines.push("Paragon Doctrine is codifying an extra late-act mastery dividend.");
    }
    if (features.apexDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Apex Doctrine is converting the archive of boss kills into an apex late-act mastery swing.");
    }
    if (features.legendDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Legend Doctrine is pushing this reward into a second-wave mastery summit for late-act pivots.");
    }
    if (features.warAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 4) {
      const favoredTreeLine = archiveSignals.favoredTreeName ? ` Archived memory is still centered on ${archiveSignals.favoredTreeName}.` : "";
      choice.previewLines.push(`War Annals is translating archived expeditions into another mastery pivot.${favoredTreeLine}`);
    }
    if (features.legendaryAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Legendary Annals is translating the sovereign archive into another late-act mastery dividend.");
    }
    if (features.economyLedger && scaledEffects.some((effect) => effect.kind === "gold_bonus")) {
      choice.previewLines.push("Economy Ledger dividend is active on this build payout.");
    }

    return choice;
  }

  function ensureThreeChoices(choices, run, zone, content, seed, usedCardIds, profile = null, actNumber = 1) {
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
      choices.push(pickBoonChoice(zone.zoneRole, seed + choices.length, profile, actNumber));
    }

    return choices.slice(0, 3);
  }

  function buildRewardChoices({ content, run, zone, actNumber, encounterNumber, profile = null }) {
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
      profile,
    });
    const progressionChoice = pickProgressionChoice(zone, seed + 3, run, actNumber, content, profile);

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
        choices.push(pickBoonChoice("boss", seed + 9, profile, actNumber));
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
      choices.push(pickBoonChoice(boonRole, seed + 9, profile, actNumber));
    }

    const secondCardPool = zone.kind === "boss" ? [...zonePool, ...profilePool] : [...zonePool, ...profilePool, ...bossPool];
    if (choices.length < 3) {
      const secondCardId = pickUniqueCardId(secondCardPool, seed + 5, usedCardIds, content);
      if (secondCardId) {
        usedCardIds.add(secondCardId);
        choices.push(buildCardChoice(secondCardId, content, "Route Skill"));
      }
    }

    return ensureThreeChoices(choices, run, zone, content, seed + 13, usedCardIds, profile, actNumber);
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
