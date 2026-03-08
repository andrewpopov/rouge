/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectActPathStates,
    collectActReferenceState,
    collectCulminationPathStates,
    collectCovenantPathStates,
    collectEffectFlagIds,
    collectLegacyPathStates,
    collectOpportunityChoiceStates,
    collectReckoningPathStates,
    collectRecoveryPathStates,
    collectAccordPathStates,
    collectRelayPathStates,
    collectReservePathStates,
    collectShrinePathStates,
    doesReserveOpportunityVariantMatchPath,
    doesShrineOpportunityVariantMatchPath,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
    getReserveOpportunityVariantRequirementSignature,
    getReserveOpportunityVariantSpecificity,
    getShrineOpportunityVariantRequirementSignature,
    getShrineOpportunityVariantSpecificity,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const ALLOWED_INTENT_KINDS = new Set([
    "attack",
    "attack_all",
    "attack_and_guard",
    "drain_attack",
    "guard",
    "guard_allies",
    "heal_ally",
    "heal_allies",
    "heal_and_guard",
    "sunder_attack",
  ]);

  const ALLOWED_ELITE_AFFIXES = new Set([
    "warded",
    "huntsman",
    "gravebound",
    "blackarrow",
    "rampaging",
    "dunebound",
    "sunscorched",
    "sandwarden",
    "vampiric",
    "hexbound",
    "fetid",
    "bloodpriest",
    "hellforged",
    "tormentor",
    "cinderlord",
    "doomtide",
    "warcaller",
    "frostbound",
    "stormbanner",
    "icevein",
  ]);

  const ALLOWED_MERCENARY_BEHAVIORS = new Set([
    "mark_hunter",
    "guard_after_attack",
    "burn_finisher",
    "backline_hunter",
    "guard_breaker",
    "boss_hunter",
    "wounded_hunter",
  ]);

  const ALLOWED_ENCOUNTER_MODIFIERS = new Set([
    "fortified_line",
    "ambush_opening",
    "escort_bulwark",
    "backline_screen",
    "vanguard_rush",
    "escort_command",
    "crossfire_lanes",
    "war_drums",
    "triage_command",
    "triage_screen",
    "elite_onslaught",
    "sniper_nest",
    "phalanx_march",
  ]);
  const ALLOWED_CONSEQUENCE_ENCOUNTER_ZONE_ROLES = new Set(["branchBattle", "branchMiniboss"]);

  const MIN_GENERATED_GROUP_SIZES = { opening: 6, branchBattle: 5, branchMiniboss: 4, boss: 1 };
  const MIN_CONSEQUENCE_ENCOUNTER_PACKAGES_PER_ACT = 2;

  const MIN_MERCENARY_CONTRACTS = 7;
  const MIN_ROUTE_PERKS_PER_MERCENARY = 12;
  const MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY = 2;
  const MIN_SCALING_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES = 5;
  const MIN_ELITE_AFFIX_FAMILIES_PER_ACT = 4;
  const MIN_ENCOUNTER_MODIFIER_FAMILIES_PER_ACT = 13;
  const MIN_QUEST_CHOICES = 3;
  const MIN_SHRINE_CHOICES = 3;
  const MIN_OPPORTUNITY_VARIANTS = 6;
  const MIN_CROSSROAD_OPPORTUNITY_VARIANTS = 3;
  const MIN_SHRINE_OPPORTUNITY_VARIANTS = 3;
  const MIN_RESERVE_OPPORTUNITY_VARIANTS = 3;
  const MIN_RELAY_OPPORTUNITY_VARIANTS = 3;
  const MIN_CULMINATION_OPPORTUNITY_VARIANTS = 3;
  const MIN_LEGACY_OPPORTUNITY_VARIANTS = 3;
  const MIN_RECKONING_OPPORTUNITY_VARIANTS = 3;
  const MIN_RECOVERY_OPPORTUNITY_VARIANTS = 3;
  const MIN_ACCORD_OPPORTUNITY_VARIANTS = 3;
  const MIN_COVENANT_OPPORTUNITY_VARIANTS = 3;

  function pushError(errors, message) { errors.push(message); }

  function hasAtLeastOneEnemy(poolEntry) {
    return [
      ...(Array.isArray(poolEntry?.enemies) ? poolEntry.enemies : []),
      ...(Array.isArray(poolEntry?.nativeEnemies) ? poolEntry.nativeEnemies : []),
      ...(Array.isArray(poolEntry?.guestEnemiesNightmareHell) ? poolEntry.guestEnemiesNightmareHell : []),
    ].length > 0;
  }

  function validateCardIdList(cardIds, cardCatalog, label, errors) {
    (Array.isArray(cardIds) ? cardIds : []).forEach((cardId, index) => {
      if (!cardCatalog?.[cardId]) {
        pushError(errors, `${label}[${index}] references missing card "${cardId}".`);
      }
    });
  }

  function validateGrants(grants, label, errors) {
    ["gold", "xp", "potions"].forEach((field) => {
      if (!Number.isFinite(Number(grants?.[field]))) {
        pushError(errors, `${label}.${field} must be numeric.`);
      }
    });
  }

  function validateStringIdList(values, label, errors) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value, index) => {
      if (typeof value !== "string" || !value) {
        pushError(errors, `${label}[${index}] must be a non-empty string.`);
      }
    });
  }

  function validateKnownStringIds(values, knownValues, label, errors, referenceType) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value, index) => {
      if (typeof value === "string" && value && !knownValues.has(value)) {
        pushError(errors, `${label}[${index}] references unknown ${referenceType} "${value}".`);
      }
    });
  }

  function getConsequenceEncounterPackageRequirementSignature(encounterPackage) {
    const requiredFlagIds = Array.isArray(encounterPackage?.requiredFlagIds)
      ? Array.from(new Set(encounterPackage.requiredFlagIds.filter((value) => typeof value === "string" && value))).sort()
      : [];
    return `${encounterPackage?.zoneRole || "-"}|${requiredFlagIds.join("&") || "-"}`;
  }

  function validateNodeChoice(definition, choiceDefinition, label, expectedNodeType, errors, linkedQuestId = "") {
    if (!choiceDefinition?.id) {
      pushError(errors, `${label} is missing an id.`);
    }
    if (!choiceDefinition?.title) {
      pushError(errors, `${label} is missing a title.`);
    }
    if (!Array.isArray(choiceDefinition?.effects) || choiceDefinition.effects.length === 0) {
      pushError(errors, `${label} is missing effects.`);
      return;
    }

    if (expectedNodeType === "quest") {
      const questEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_outcome");
      if (!questEffect?.questId || !questEffect?.outcomeId || !questEffect?.outcomeTitle) {
        pushError(errors, `${label} is missing a valid record_quest_outcome effect.`);
      } else if (questEffect.questId !== definition.id) {
        pushError(errors, `${label} record_quest_outcome references "${questEffect.questId}" but expected "${definition.id}".`);
      }
      if (!choiceDefinition.followUp) {
        pushError(errors, `${label} is missing follow-up event content.`);
      }
      return;
    }

    const nodeEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_node_outcome");
    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      pushError(errors, `${label} is missing a valid record_node_outcome effect.`);
    } else {
      if (nodeEffect.nodeType !== expectedNodeType) {
        pushError(errors, `${label} record_node_outcome must use nodeType "${expectedNodeType}".`);
      }
      if (nodeEffect.nodeId !== definition.id) {
        pushError(errors, `${label} record_node_outcome references "${nodeEffect.nodeId}" but expected "${definition.id}".`);
      }
    }

    if (expectedNodeType === "event") {
      const followUpEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_follow_up");
      if (!followUpEffect?.questId || !followUpEffect?.outcomeId || !followUpEffect?.outcomeTitle || !followUpEffect?.consequenceId) {
        pushError(errors, `${label} is missing a valid record_quest_follow_up effect.`);
      } else if (followUpEffect.questId !== linkedQuestId) {
        pushError(errors, `${label} record_quest_follow_up references "${followUpEffect.questId}" but expected "${linkedQuestId}".`);
      }
      return;
    }

    if (expectedNodeType === "opportunity") {
      if (!linkedQuestId) {
        return;
      }
      const consequenceEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_consequence");
      if (!consequenceEffect?.questId || !consequenceEffect?.outcomeId || !consequenceEffect?.outcomeTitle || !consequenceEffect?.consequenceId) {
        pushError(errors, `${label} is missing a valid record_quest_consequence effect.`);
      } else if (consequenceEffect.questId !== linkedQuestId) {
        pushError(errors, `${label} record_quest_consequence references "${consequenceEffect.questId}" but expected "${linkedQuestId}".`);
      }
    }
  }

  function validateRewardDefinition(definition, label, expectedNodeType, errors, linkedQuestId = "") {
    if (!definition?.id) {
      pushError(errors, `${label} is missing an id.`);
    }
    if (!definition?.title) {
      pushError(errors, `${label} is missing a title.`);
    }
    if (!definition?.description) {
      pushError(errors, `${label} is missing a description.`);
    }
    if (!definition?.summary) {
      pushError(errors, `${label} is missing a summary.`);
    }
    validateGrants(definition?.grants, `${label}.grants`, errors);

    if (!Array.isArray(definition?.choices) || definition.choices.length === 0) {
      pushError(errors, `${label} is missing choices.`);
      return;
    }

    const seenChoiceIds = new Set();
    definition.choices.forEach((choiceDefinition, index) => {
      if (choiceDefinition?.id) {
        if (seenChoiceIds.has(choiceDefinition.id)) {
          pushError(errors, `${label} reuses choice id "${choiceDefinition.id}".`);
        }
        seenChoiceIds.add(choiceDefinition.id);
      }
      validateNodeChoice(definition, choiceDefinition, `${label}.choices[${index}]`, expectedNodeType, errors, linkedQuestId);
    });
  }

  function validateSeedBundle(seedBundle) {
    const errors = [];
    const classEntries = Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
    const skillClasses = Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const enemyPools = Array.isArray(seedBundle?.enemyPools?.enemyPools) ? seedBundle.enemyPools.enemyPools : [];

    if (classEntries.length === 0) {
      pushError(errors, "Seed bundle is missing playable classes.");
    }

    if (skillClasses.length === 0) {
      pushError(errors, "Seed bundle is missing skills.json class progression content.");
    }

    const knownClassIds = new Set(classEntries.map((entry) => entry?.id).filter(Boolean));
    const seenSkillClassIds = new Set();
    skillClasses.forEach((entry, index) => {
      if (!entry?.classId) {
        pushError(errors, `skills.classes[${index}] is missing a classId.`);
        return;
      }
      if (!knownClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes[${index}] references unknown class "${entry.classId}".`);
      }
      if (seenSkillClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes contains duplicate classId "${entry.classId}".`);
      }
      seenSkillClassIds.add(entry.classId);

      const trees = Array.isArray(entry.trees) ? entry.trees : [];
      if (trees.length === 0) {
        pushError(errors, `skills.classes[${index}] is missing skill trees.`);
        return;
      }

      trees.forEach((tree, treeIndex) => {
        if (!tree?.id) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing an id.`);
        }
        if (!tree?.name) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing a name.`);
        }
        const skills = Array.isArray(tree?.skills) ? tree.skills : [];
        if (skills.length === 0) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing skills.`);
          return;
        }
        skills.forEach((skill, skillIndex) => {
          if (!skill?.id || !skill?.name) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing identity fields.`);
          }
          if (!Number.isFinite(Number(skill?.requiredLevel))) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing a numeric requiredLevel.`);
          }
        });
      });
    });

    classEntries.forEach((entry) => {
      if (entry?.id && !seenSkillClassIds.has(entry.id)) {
        pushError(errors, `Playable class "${entry.id}" is missing skills.json progression data.`);
      }
    });

    if (acts.length === 0) {
      pushError(errors, "Seed bundle is missing zone acts.");
    }

    const seenActs = new Set();
    acts.forEach((actSeed, index) => {
      if (!Number.isInteger(actSeed?.act)) {
        pushError(errors, `zones.acts[${index}] is missing a valid act number.`);
        return;
      }
      if (seenActs.has(actSeed.act)) {
        pushError(errors, `zones.acts contains duplicate act number ${actSeed.act}.`);
      }
      seenActs.add(actSeed.act);

      if (!actSeed?.boss?.id) {
        pushError(errors, `Act ${actSeed.act} is missing a boss id.`);
      } else if (!bossEntries.some((entry) => entry.id === actSeed.boss.id)) {
        pushError(errors, `Act ${actSeed.act} boss "${actSeed.boss.id}" has no matching bosses entry.`);
      }

      const poolEntry = enemyPools.find((entry) => entry.act === actSeed.act) || null;
      if (!poolEntry) {
        pushError(errors, `Act ${actSeed.act} is missing an enemy pool entry.`);
      } else if (!hasAtLeastOneEnemy(poolEntry)) {
        pushError(errors, `Act ${actSeed.act} enemy pool does not contain any enemies.`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function validateRuntimeContent(content) {
    const errors = [];
    const cardCatalog = content?.cardCatalog || {};
    const mercenaryCatalog = content?.mercenaryCatalog || {};
    const enemyCatalog = content?.enemyCatalog || {};
    const encounterCatalog = content?.encounterCatalog || {};
    const eliteAffixesByAct = {};
    const worldNodeCatalog = runtimeWindow.ROUGE_WORLD_NODES?.getCatalog?.();
    const knownWorldFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.quests || {}).flatMap((questDefinition) => (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects), ...(Array.isArray(choiceDefinition?.followUp?.choices) ? choiceDefinition.followUp.choices : []).flatMap((followUpChoiceDefinition) => [...collectEffectFlagIds(followUpChoiceDefinition?.effects)])])),
      ...Object.values(worldNodeCatalog?.shrines || {}).flatMap((shrineDefinition) => (Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)])),
      ...Object.values(worldNodeCatalog?.opportunities || {}).flatMap((opportunityDefinition) => (Array.isArray(opportunityDefinition?.variants) ? opportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.crossroadOpportunities || {}).flatMap((crossroadOpportunityDefinition) => (Array.isArray(crossroadOpportunityDefinition?.variants) ? crossroadOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.shrineOpportunities || {}).flatMap((shrineOpportunityDefinition) => (Array.isArray(shrineOpportunityDefinition?.variants) ? shrineOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.reserveOpportunities || {}).flatMap((reserveOpportunityDefinition) => (Array.isArray(reserveOpportunityDefinition?.variants) ? reserveOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.relayOpportunities || {}).flatMap((relayOpportunityDefinition) => (Array.isArray(relayOpportunityDefinition?.variants) ? relayOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.culminationOpportunities || {}).flatMap((culminationOpportunityDefinition) => (Array.isArray(culminationOpportunityDefinition?.variants) ? culminationOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.legacyOpportunities || {}).flatMap((legacyOpportunityDefinition) => (Array.isArray(legacyOpportunityDefinition?.variants) ? legacyOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.reckoningOpportunities || {}).flatMap((reckoningOpportunityDefinition) => (Array.isArray(reckoningOpportunityDefinition?.variants) ? reckoningOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.recoveryOpportunities || {}).flatMap((recoveryOpportunityDefinition) => (Array.isArray(recoveryOpportunityDefinition?.variants) ? recoveryOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.accordOpportunities || {}).flatMap((accordOpportunityDefinition) => (Array.isArray(accordOpportunityDefinition?.variants) ? accordOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.covenantOpportunities || {}).flatMap((covenantOpportunityDefinition) => (Array.isArray(covenantOpportunityDefinition?.variants) ? covenantOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const reserveRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.reserveOpportunities || {}).flatMap((reserveOpportunityDefinition) => (Array.isArray(reserveOpportunityDefinition?.variants) ? reserveOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const relayRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.relayOpportunities || {}).flatMap((relayOpportunityDefinition) => (Array.isArray(relayOpportunityDefinition?.variants) ? relayOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const culminationRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.culminationOpportunities || {}).flatMap((culminationOpportunityDefinition) => (Array.isArray(culminationOpportunityDefinition?.variants) ? culminationOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const legacyRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.legacyOpportunities || {}).flatMap((legacyOpportunityDefinition) => (Array.isArray(legacyOpportunityDefinition?.variants) ? legacyOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const reckoningRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.reckoningOpportunities || {}).flatMap((reckoningOpportunityDefinition) => (Array.isArray(reckoningOpportunityDefinition?.variants) ? reckoningOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const recoveryRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.recoveryOpportunities || {}).flatMap((recoveryOpportunityDefinition) => (Array.isArray(recoveryOpportunityDefinition?.variants) ? recoveryOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const accordRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.accordOpportunities || {}).flatMap((accordOpportunityDefinition) => (Array.isArray(accordOpportunityDefinition?.variants) ? accordOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
    const covenantRouteFlagIds = new Set([
      ...Object.values(worldNodeCatalog?.covenantOpportunities || {}).flatMap((covenantOpportunityDefinition) => (Array.isArray(covenantOpportunityDefinition?.variants) ? covenantOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);

    if (Object.keys(mercenaryCatalog).length < MIN_MERCENARY_CONTRACTS) {
      pushError(errors, `mercenaryCatalog must define at least ${MIN_MERCENARY_CONTRACTS} mercenary contracts.`);
    }

    validateCardIdList(content?.starterDeck, cardCatalog, "starterDeck", errors);

    Object.entries(content?.starterDeckProfiles || {}).forEach(([profileId, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `starterDeckProfiles.${profileId}`, errors);
    });

    Object.entries(content?.classDeckProfiles || {}).forEach(([classId, profileId]) => {
      const profileKey = String(profileId || "");
      if (!content?.starterDeckProfiles?.[profileKey]) {
        pushError(errors, `classDeckProfiles.${classId} references missing starter deck profile "${profileKey}".`);
      }
      if (!content?.classProgressionCatalog?.[classId]) {
        pushError(errors, `classProgressionCatalog is missing class "${classId}".`);
      }
    });

    Object.entries(content?.classProgressionCatalog || {}).forEach(([classId, progressionEntry]) => {
      const progression = progressionEntry as RuntimeClassProgressionDefinition | undefined;
      if (!Array.isArray(progression?.trees) || progression.trees.length === 0) {
        pushError(errors, `classProgressionCatalog.${classId} is missing trees.`);
        return;
      }

      progression.trees.forEach((tree, index) => {
        if (!tree?.id || !tree?.name) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing identity fields.`);
        }
        if (!tree?.archetypeId) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing an archetypeId.`);
        }
        if (!Number.isFinite(Number(tree?.maxRank)) || Number(tree.maxRank) <= 0) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing a valid maxRank.`);
        }
        if (!Number.isFinite(Number(tree?.unlockThreshold)) || Number(tree.unlockThreshold) <= 0) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing a valid unlockThreshold.`);
        }
        if (!Array.isArray(tree?.skills) || tree.skills.length === 0) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing skills.`);
        }
      });
    });

    Object.entries(content?.rewardPools?.profileCards || {}).forEach(([profileId, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.profileCards.${profileId}`, errors);
    });
    Object.entries(content?.rewardPools?.zoneRoleCards || {}).forEach(([zoneRole, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.zoneRoleCards.${zoneRole}`, errors);
    });
    validateCardIdList(content?.rewardPools?.bossCards, cardCatalog, "rewardPools.bossCards", errors);

    const routePerkBonusFamilies = new Set();
    (Object.values(mercenaryCatalog) as MercenaryDefinition[]).forEach((mercenary, index) => {
      const label = `mercenaryCatalog.${mercenary?.id || index}`;
      if (!mercenary?.id) {
        pushError(errors, `${label} is missing an id.`);
      }
      if (!mercenary?.name) {
        pushError(errors, `${label} is missing a name.`);
      }
      if (!mercenary?.role) {
        pushError(errors, `${label} is missing a role.`);
      }
      if (!Number.isFinite(Number(mercenary?.maxLife))) {
        pushError(errors, `${label}.maxLife must be numeric.`);
      }
      if (!Number.isFinite(Number(mercenary?.attack))) {
        pushError(errors, `${label}.attack must be numeric.`);
      }
      if (!mercenary?.passiveText) {
        pushError(errors, `${label} is missing passiveText.`);
      }
      if (!ALLOWED_MERCENARY_BEHAVIORS.has(mercenary?.behavior)) {
        pushError(errors, `${label}.behavior "${mercenary?.behavior || ""}" is not supported.`);
      }

      if (!Array.isArray(mercenary?.routePerks) || mercenary.routePerks.length < MIN_ROUTE_PERKS_PER_MERCENARY) {
        pushError(errors, `${label} must define at least ${MIN_ROUTE_PERKS_PER_MERCENARY} route perks.`);
        return;
      }

      const seenRoutePerkIds = new Set();
      let compoundRoutePerkCount = 0;
      let scalingRoutePerkCount = 0;
      let reserveLinkedRoutePerkCount = 0;
      let relayLinkedRoutePerkCount = 0;
      let culminationLinkedRoutePerkCount = 0;
      let legacyLinkedRoutePerkCount = 0;
      let reckoningLinkedRoutePerkCount = 0;
      let recoveryLinkedRoutePerkCount = 0;
      let accordLinkedRoutePerkCount = 0;
      let covenantLinkedRoutePerkCount = 0;
      mercenary.routePerks.forEach((routePerk, routePerkIndex) => {
        const routePerkLabel = `${label}.routePerks[${routePerkIndex}]`;
        if (!routePerk?.id) {
          pushError(errors, `${routePerkLabel} is missing an id.`);
        } else if (seenRoutePerkIds.has(routePerk.id)) {
          pushError(errors, `${label} reuses route perk id "${routePerk.id}".`);
        } else {
          seenRoutePerkIds.add(routePerk.id);
        }
        if (!routePerk?.title) {
          pushError(errors, `${routePerkLabel} is missing a title.`);
        }
        validateStringIdList(routePerk?.requiredFlagIds, `${routePerkLabel}.requiredFlagIds`, errors);
        if (!Array.isArray(routePerk?.requiredFlagIds) || routePerk.requiredFlagIds.length === 0) {
          pushError(errors, `${routePerkLabel} must require at least one world flag.`);
        } else if (routePerk.requiredFlagIds.length > 1) {
          compoundRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => reserveRouteFlagIds.has(flagId))) {
          reserveLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => relayRouteFlagIds.has(flagId))) {
          relayLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => culminationRouteFlagIds.has(flagId))) {
          culminationLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => legacyRouteFlagIds.has(flagId))) {
          legacyLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => reckoningRouteFlagIds.has(flagId))) {
          reckoningLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => recoveryRouteFlagIds.has(flagId))) {
          recoveryLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => accordRouteFlagIds.has(flagId))) {
          accordLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId) => covenantRouteFlagIds.has(flagId))) {
          covenantLinkedRoutePerkCount += 1;
        }
        if (knownWorldFlagIds.size > 0) {
          validateKnownStringIds(routePerk?.requiredFlagIds, knownWorldFlagIds, `${routePerkLabel}.requiredFlagIds`, errors, "world flag");
        }

        [
          "attackBonus",
          "attackBonusPerAct",
          "behaviorBonus",
          "behaviorBonusPerAct",
          "startGuard",
          "startGuardPerAct",
          "heroDamageBonus",
          "heroDamageBonusPerAct",
          "heroStartGuard",
          "heroStartGuardPerAct",
          "openingDraw",
          "openingDrawPerAct",
        ].forEach((field) => {
          const routePerkValue = routePerk?.[field];
          if ((routePerkValue ?? null) !== null && !Number.isFinite(Number(routePerkValue))) {
            pushError(errors, `${routePerkLabel}.${field} must be numeric when present.`);
          }
        });

        [
          ["attack_bonus", routePerk?.attackBonus, routePerk?.attackBonusPerAct],
          ["behavior_bonus", routePerk?.behaviorBonus, routePerk?.behaviorBonusPerAct],
          ["start_guard", routePerk?.startGuard, routePerk?.startGuardPerAct],
          ["hero_damage_bonus", routePerk?.heroDamageBonus, routePerk?.heroDamageBonusPerAct],
          ["hero_start_guard", routePerk?.heroStartGuard, routePerk?.heroStartGuardPerAct],
          ["opening_draw", routePerk?.openingDraw, routePerk?.openingDrawPerAct],
        ].forEach(([familyId, baseValue, perActValue]) => {
          if (Number(baseValue || 0) > 0 || Number(perActValue || 0) > 0) {
            routePerkBonusFamilies.add(familyId);
          }
        });

        const hasCombatBonus =
          Number(routePerk?.attackBonus || 0) > 0 ||
          Number(routePerk?.attackBonusPerAct || 0) > 0 ||
          Number(routePerk?.behaviorBonus || 0) > 0 ||
          Number(routePerk?.behaviorBonusPerAct || 0) > 0 ||
          Number(routePerk?.startGuard || 0) > 0 ||
          Number(routePerk?.startGuardPerAct || 0) > 0 ||
          Number(routePerk?.heroDamageBonus || 0) > 0 ||
          Number(routePerk?.heroDamageBonusPerAct || 0) > 0 ||
          Number(routePerk?.heroStartGuard || 0) > 0 ||
          Number(routePerk?.heroStartGuardPerAct || 0) > 0 ||
          Number(routePerk?.openingDraw || 0) > 0 ||
          Number(routePerk?.openingDrawPerAct || 0) > 0;
        if (!hasCombatBonus) {
          pushError(errors, `${routePerkLabel} must grant at least one combat bonus or scaling bonus.`);
        }

        const hasPerActScaling =
          Number(routePerk?.attackBonusPerAct || 0) > 0 ||
          Number(routePerk?.behaviorBonusPerAct || 0) > 0 ||
          Number(routePerk?.startGuardPerAct || 0) > 0 ||
          Number(routePerk?.heroDamageBonusPerAct || 0) > 0 ||
          Number(routePerk?.heroStartGuardPerAct || 0) > 0 ||
          Number(routePerk?.openingDrawPerAct || 0) > 0;
        if (hasPerActScaling) {
          scalingRoutePerkCount += 1;
        }
        if (hasPerActScaling && !Number.isInteger(Number(routePerk?.scalingStartAct))) {
          pushError(errors, `${routePerkLabel}.scalingStartAct must be an integer when per-act scaling is used.`);
        }
      });

      if (compoundRoutePerkCount < MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY} compound route perks with multiple required world flags.`
        );
      }
      if (scalingRoutePerkCount < MIN_SCALING_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_SCALING_ROUTE_PERKS_PER_MERCENARY} route perk with per-act scaling.`
        );
      }
      if (
        reserveRouteFlagIds.size > 0 &&
        reserveLinkedRoutePerkCount < MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY} reserve-linked route perk.`
        );
      }
      if (relayRouteFlagIds.size > 0 && relayLinkedRoutePerkCount < MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY} relay-linked route perk.`
        );
      }
      if (
        culminationRouteFlagIds.size > 0 &&
        culminationLinkedRoutePerkCount < MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY} culmination-linked route perk.`
        );
      }
      if (legacyRouteFlagIds.size > 0 && legacyLinkedRoutePerkCount < MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY} legacy-linked route perk.`
        );
      }
      if (
        reckoningRouteFlagIds.size > 0 &&
        reckoningLinkedRoutePerkCount < MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY} reckoning-linked route perk.`
        );
      }
      if (recoveryRouteFlagIds.size > 0 && recoveryLinkedRoutePerkCount < MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY} recovery-linked route perk.`
        );
      }
      if (accordRouteFlagIds.size > 0 && accordLinkedRoutePerkCount < MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY} accord-linked route perk.`
        );
      }
      if (covenantRouteFlagIds.size > 0 && covenantLinkedRoutePerkCount < MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY} covenant-linked route perk.`
        );
      }
    });

    if (routePerkBonusFamilies.size < MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES) {
      pushError(
        errors,
        `mercenaryCatalog must expose at least ${MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES} route perk bonus families.`
      );
    }

    (Object.values(enemyCatalog) as EnemyTemplate[]).forEach((template) => {
      if (!template?.templateId) {
        pushError(errors, "Enemy catalog contains a template without a templateId.");
        return;
      }
      if (!Array.isArray(template.intents) || template.intents.length === 0) {
        pushError(errors, `Enemy template "${template.templateId}" is missing intents.`);
        return;
      }
      template.intents.forEach((intent, index) => {
        if (!ALLOWED_INTENT_KINDS.has(intent?.kind)) {
          pushError(errors, `Enemy template "${template.templateId}" has unsupported intent "${intent?.kind}" at index ${index}.`);
        }
      });

      const affixes = Array.isArray(template.affixes) ? template.affixes : [];
      affixes.forEach((affixId, index) => {
        if (!ALLOWED_ELITE_AFFIXES.has(affixId)) {
          pushError(errors, `Enemy template "${template.templateId}" has unsupported affix "${affixId}" at index ${index}.`);
        }
      });

      if (template.variant === "elite" && affixes.length === 0) {
        pushError(errors, `Enemy template "${template.templateId}" is marked elite but has no affixes.`);
      }
      if (template.variant !== "elite" && affixes.length > 0) {
        pushError(errors, `Enemy template "${template.templateId}" has affixes but is not marked elite.`);
      }

      const actMatch = /^act_(\d+)_/.exec(template.templateId);
      if (template.variant === "elite" && actMatch) {
        const actNumber = Number(actMatch[1]);
        eliteAffixesByAct[actNumber] = eliteAffixesByAct[actNumber] || new Set();
        affixes.forEach((affixId) => eliteAffixesByAct[actNumber].add(affixId));
      }
    });

    (Object.values(encounterCatalog) as EncounterDefinition[]).forEach((encounter) => {
      if (!Array.isArray(encounter?.enemies) || encounter.enemies.length === 0) {
        pushError(errors, `Encounter "${encounter?.id || "unknown"}" does not include any enemies.`);
        return;
      }
      (Array.isArray(encounter?.modifiers) ? encounter.modifiers : []).forEach((modifier, index) => {
        if (!ALLOWED_ENCOUNTER_MODIFIERS.has(modifier?.kind)) {
          pushError(errors, `Encounter "${encounter.id}" has unsupported modifier "${modifier?.kind || ""}" at index ${index}.`);
        }
        if (!Number.isFinite(Number(modifier?.value))) {
          pushError(errors, `Encounter "${encounter.id}" modifier[${index}] must define a numeric value.`);
        }
      });
      encounter.enemies.forEach((enemyEntry, index) => {
        if (!enemyCatalog?.[enemyEntry?.templateId]) {
          pushError(
            errors,
            `Encounter "${encounter.id}" enemy[${index}] references missing template "${enemyEntry?.templateId}".`
          );
        }
      });
    });

    Object.entries(content?.generatedActEncounterIds || {}).forEach(([actNumber, groups]) => {
      const modifierKinds = new Set();
      Object.entries((groups || {}) as Record<string, string[]>).forEach(([groupName, encounterIds]) => {
        if (!Array.isArray(encounterIds) || encounterIds.length === 0) {
          pushError(errors, `generatedActEncounterIds.${actNumber}.${groupName} is empty.`);
          return;
        }
        const minimumCount = MIN_GENERATED_GROUP_SIZES[groupName];
        if (minimumCount && encounterIds.length < minimumCount) {
          pushError(errors, `generatedActEncounterIds.${actNumber}.${groupName} must contain at least ${minimumCount} encounters.`);
        }
        encounterIds.forEach((encounterId, index) => {
          if (!encounterCatalog?.[encounterId]) {
            pushError(
              errors,
              `generatedActEncounterIds.${actNumber}.${groupName}[${index}] references missing encounter "${encounterId}".`
            );
            return;
          }
          (Array.isArray(encounterCatalog[encounterId]?.modifiers) ? encounterCatalog[encounterId].modifiers : []).forEach((modifier) => {
            if (typeof modifier?.kind === "string" && modifier.kind) {
              modifierKinds.add(modifier.kind);
            }
          });
        });
      });

      const affixCount = eliteAffixesByAct[Number(actNumber)]?.size || 0;
      if (affixCount < MIN_ELITE_AFFIX_FAMILIES_PER_ACT) {
        pushError(
          errors,
          `generatedActEncounterIds.${actNumber} must expose at least ${MIN_ELITE_AFFIX_FAMILIES_PER_ACT} elite affix families.`
        );
      }
      if (modifierKinds.size < MIN_ENCOUNTER_MODIFIER_FAMILIES_PER_ACT) {
        pushError(
          errors,
          `generatedActEncounterIds.${actNumber} must expose at least ${MIN_ENCOUNTER_MODIFIER_FAMILIES_PER_ACT} encounter modifier families.`
        );
      }
    });

    Object.keys(content?.consequenceEncounterPackages || {}).forEach((actNumber) => {
      if (!content?.generatedActEncounterIds?.[Number(actNumber)]) {
        pushError(errors, `consequenceEncounterPackages.${actNumber} references unknown act ${actNumber}.`);
      }
    });

    Object.keys(content?.generatedActEncounterIds || {}).forEach((actNumber) => {
      const encounterPackages = Array.isArray(content?.consequenceEncounterPackages?.[Number(actNumber)])
        ? content.consequenceEncounterPackages[Number(actNumber)]
        : [];
      if (encounterPackages.length < MIN_CONSEQUENCE_ENCOUNTER_PACKAGES_PER_ACT) {
        pushError(
          errors,
          `consequenceEncounterPackages.${actNumber} must define at least ${MIN_CONSEQUENCE_ENCOUNTER_PACKAGES_PER_ACT} consequence encounter packages.`
        );
      }

      const seenPackageIds = new Set();
      const seenRequirementSignatures = new Map();
      const roleCounts = {
        branchBattle: 0,
        branchMiniboss: 0,
      };

      encounterPackages.forEach((encounterPackage, index) => {
        const packageLabel = `consequenceEncounterPackages.${actNumber}[${index}]`;
        if (!encounterPackage?.id) {
          pushError(errors, `${packageLabel} is missing an id.`);
        } else if (seenPackageIds.has(encounterPackage.id)) {
          pushError(errors, `consequenceEncounterPackages.${actNumber} reuses package id "${encounterPackage.id}".`);
        } else {
          seenPackageIds.add(encounterPackage.id);
        }

        if (!encounterPackage?.title) {
          pushError(errors, `${packageLabel} is missing a title.`);
        }
        if (!ALLOWED_CONSEQUENCE_ENCOUNTER_ZONE_ROLES.has(encounterPackage?.zoneRole)) {
          pushError(errors, `${packageLabel}.zoneRole "${encounterPackage?.zoneRole || ""}" is not supported.`);
        } else if (encounterPackage.zoneRole === "branchBattle" || encounterPackage.zoneRole === "branchMiniboss") {
          roleCounts[encounterPackage.zoneRole] += 1;
        }

        validateStringIdList(encounterPackage?.requiredFlagIds, `${packageLabel}.requiredFlagIds`, errors);
        if (!Array.isArray(encounterPackage?.requiredFlagIds) || encounterPackage.requiredFlagIds.length === 0) {
          pushError(errors, `${packageLabel} must require at least one world flag.`);
        } else {
          validateKnownStringIds(
            encounterPackage.requiredFlagIds,
            knownWorldFlagIds,
            `${packageLabel}.requiredFlagIds`,
            errors,
            "world flag"
          );
        }

        const requirementSignature = getConsequenceEncounterPackageRequirementSignature(encounterPackage);
        const existingPackageId = seenRequirementSignatures.get(requirementSignature);
        if (existingPackageId) {
          pushError(errors, `${packageLabel} reuses requirement signature with package "${existingPackageId}".`);
        } else if (encounterPackage?.id) {
          seenRequirementSignatures.set(requirementSignature, encounterPackage.id);
        } else {
          seenRequirementSignatures.set(requirementSignature, `[${index}]`);
        }

        if (!encounterPackage?.encounterId) {
          pushError(errors, `${packageLabel} is missing an encounterId.`);
        } else {
          if (!encounterCatalog?.[encounterPackage.encounterId]) {
            pushError(errors, `${packageLabel}.encounterId references missing encounter "${encounterPackage.encounterId}".`);
          }
          if (!encounterPackage.encounterId.startsWith(`act_${actNumber}_`)) {
            pushError(errors, `${packageLabel}.encounterId must point at an act ${actNumber} encounter.`);
          }
        }
      });

      if (roleCounts.branchBattle === 0) {
        pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least 1 package for zoneRole "branchBattle".`);
      }
      if (roleCounts.branchMiniboss === 0) {
        pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least 1 package for zoneRole "branchMiniboss".`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function validateWorldNodeCatalog(worldNodeCatalog) {
    const errors = [];
    const quests = worldNodeCatalog?.quests || {};
    const shrines = worldNodeCatalog?.shrines || {};
    const events = worldNodeCatalog?.events || {};
    const opportunities = worldNodeCatalog?.opportunities || {};
    const crossroadOpportunities = worldNodeCatalog?.crossroadOpportunities || {};
    const shrineOpportunities = worldNodeCatalog?.shrineOpportunities || {};
    const reserveOpportunities = worldNodeCatalog?.reserveOpportunities || {};
    const relayOpportunities = worldNodeCatalog?.relayOpportunities || {};
    const culminationOpportunities = worldNodeCatalog?.culminationOpportunities || {};
    const legacyOpportunities = worldNodeCatalog?.legacyOpportunities || {};
    const reckoningOpportunities = worldNodeCatalog?.reckoningOpportunities || {};
    const recoveryOpportunities = worldNodeCatalog?.recoveryOpportunities || {};
    const accordOpportunities = worldNodeCatalog?.accordOpportunities || {};
    const covenantOpportunities = worldNodeCatalog?.covenantOpportunities || {};
    const actNumbers = new Set([
      ...Object.keys(quests),
      ...Object.keys(shrines),
      ...Object.keys(events),
      ...Object.keys(opportunities),
      ...Object.keys(crossroadOpportunities),
      ...Object.keys(shrineOpportunities),
      ...Object.keys(reserveOpportunities),
      ...Object.keys(relayOpportunities),
      ...Object.keys(culminationOpportunities),
      ...Object.keys(legacyOpportunities),
      ...Object.keys(reckoningOpportunities),
      ...Object.keys(recoveryOpportunities),
      ...Object.keys(accordOpportunities),
      ...Object.keys(covenantOpportunities),
    ]);
    const seenNodeIds = new Map();

    if (actNumbers.size === 0) {
      pushError(errors, "World-node catalog is empty.");
    }

    actNumbers.forEach((actKey) => {
      const actNumber = Number(actKey);
      const questDefinition = quests[actNumber];
      const shrineDefinition = shrines[actNumber];
      const eventDefinition = events[actNumber];
      const opportunityDefinition = opportunities[actNumber];
      const crossroadOpportunityDefinition = crossroadOpportunities[actNumber];
      const shrineOpportunityDefinition = shrineOpportunities[actNumber];
      const reserveOpportunityDefinition = reserveOpportunities[actNumber];
      const relayOpportunityDefinition = relayOpportunities[actNumber];
      const culminationOpportunityDefinition = culminationOpportunities[actNumber];
      const legacyOpportunityDefinition = legacyOpportunities[actNumber];
      const reckoningOpportunityDefinition = reckoningOpportunities[actNumber];
      const recoveryOpportunityDefinition = recoveryOpportunities[actNumber];
      const accordOpportunityDefinition = accordOpportunities[actNumber];
      const covenantOpportunityDefinition = covenantOpportunities[actNumber];

      [
        { definition: questDefinition, label: `worldNodes.quests.${actKey}` },
        { definition: shrineDefinition, label: `worldNodes.shrines.${actKey}` },
        { definition: eventDefinition, label: `worldNodes.events.${actKey}` },
        { definition: opportunityDefinition, label: `worldNodes.opportunities.${actKey}` },
        { definition: crossroadOpportunityDefinition, label: `worldNodes.crossroadOpportunities.${actKey}` },
        { definition: shrineOpportunityDefinition, label: `worldNodes.shrineOpportunities.${actKey}` },
        { definition: reserveOpportunityDefinition, label: `worldNodes.reserveOpportunities.${actKey}` },
        { definition: relayOpportunityDefinition, label: `worldNodes.relayOpportunities.${actKey}` },
        { definition: culminationOpportunityDefinition, label: `worldNodes.culminationOpportunities.${actKey}` },
        { definition: legacyOpportunityDefinition, label: `worldNodes.legacyOpportunities.${actKey}` },
        { definition: reckoningOpportunityDefinition, label: `worldNodes.reckoningOpportunities.${actKey}` },
        { definition: recoveryOpportunityDefinition, label: `worldNodes.recoveryOpportunities.${actKey}` },
        { definition: accordOpportunityDefinition, label: `worldNodes.accordOpportunities.${actKey}` },
        { definition: covenantOpportunityDefinition, label: `worldNodes.covenantOpportunities.${actKey}` },
      ].forEach(({ definition, label }) => {
        if (!definition?.id) {
          return;
        }
        const duplicateLabel = seenNodeIds.get(definition.id);
        if (duplicateLabel) {
          pushError(errors, `${label} reuses node id "${definition.id}" already claimed by ${duplicateLabel}.`);
          return;
        }
        seenNodeIds.set(definition.id, label);
      });

      if (!questDefinition) {
        pushError(errors, `World-node catalog is missing a quest definition for act ${actKey}.`);
      } else {
        if (!questDefinition.zoneTitle) {
          pushError(errors, `worldNodes.quests.${actKey} is missing a zoneTitle.`);
        }
        if (!Array.isArray(questDefinition.choices) || questDefinition.choices.length < MIN_QUEST_CHOICES) {
          pushError(errors, `worldNodes.quests.${actKey} must define at least ${MIN_QUEST_CHOICES} quest choices.`);
        }
        validateRewardDefinition(questDefinition, `worldNodes.quests.${actKey}`, "quest", errors);
      }

      if (!shrineDefinition) {
        pushError(errors, `World-node catalog is missing a shrine definition for act ${actKey}.`);
      } else {
        if (!shrineDefinition.zoneTitle) {
          pushError(errors, `worldNodes.shrines.${actKey} is missing a zoneTitle.`);
        }
        if (!Array.isArray(shrineDefinition.choices) || shrineDefinition.choices.length < MIN_SHRINE_CHOICES) {
          pushError(errors, `worldNodes.shrines.${actKey} must define at least ${MIN_SHRINE_CHOICES} shrine choices.`);
        }
        validateRewardDefinition(shrineDefinition, `worldNodes.shrines.${actKey}`, "shrine", errors);
      }

      if (!eventDefinition) {
        pushError(errors, `World-node catalog is missing an event definition for act ${actKey}.`);
      } else {
        if (!eventDefinition.zoneTitle) {
          pushError(errors, `worldNodes.events.${actKey} is missing a zoneTitle.`);
        }
        if (!eventDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.events.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && eventDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.events.${actKey} requires quest "${eventDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(eventDefinition?.grants, `worldNodes.events.${actKey}.grants`, errors);
      }

      const referenceState = collectActReferenceState(questDefinition, shrineDefinition);

      if (!opportunityDefinition) {
        pushError(errors, `World-node catalog is missing an opportunity definition for act ${actKey}.`);
      } else {
        if (!opportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!opportunityDefinition.title) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a title.`);
        }
        if (!opportunityDefinition.description) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a description.`);
        }
        if (!opportunityDefinition.summary) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a summary.`);
        }
        if (!opportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && opportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.opportunities.${actKey} requires quest "${opportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(opportunityDefinition?.grants, `worldNodes.opportunities.${actKey}.grants`, errors);

        if (!Array.isArray(opportunityDefinition.variants) || opportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing variants.`);
        } else {
          if (opportunityDefinition.variants.length < MIN_OPPORTUNITY_VARIANTS) {
            pushError(errors, `worldNodes.opportunities.${actKey} must define at least ${MIN_OPPORTUNITY_VARIANTS} variants.`);
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
          let consequenceGatedVariantCount = 0;
          const unconditionalVariantCount = opportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.opportunities.${actKey} has multiple unconditional variants.`);
          }

          opportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresConsequenceIds) && variantDefinition.requiresConsequenceIds.length > 0) {
              consequenceGatedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.opportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresPrimaryOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFollowUpOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresConsequenceIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresMercenaryIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresPrimaryOutcomeIds,
              referenceState.primaryOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors,
              "primary quest outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresFollowUpOutcomeIds,
              referenceState.followUpOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors,
              "follow-up outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresConsequenceIds,
              referenceState.consequenceIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors,
              "quest consequence"
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              referenceState.flagIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateKnownStringIds(
              variantDefinition.requiresMercenaryIds,
              knownMercenaryIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors,
              "mercenary contract"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: opportunityDefinition.id,
              },
              `worldNodes.opportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              opportunityDefinition.requiresQuestId
            );
          });

          if (consequenceGatedVariantCount === 0) {
            pushError(errors, `worldNodes.opportunities.${actKey} must include at least one consequence-gated variant.`);
          }

          const authoredStates = collectActPathStates(questDefinition, shrineDefinition);
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = opportunityDefinition.variants.some((variantDefinition) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey} has no variant covering authored path "${pathState.label}".`
              );
            }
          });

          opportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey}.variants[${index}] is unreachable from any authored quest/event/shrine path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = opportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getOpportunityVariantSpecificity(variantDefinition),
                matches: doesVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey} has ambiguous variants for authored path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!crossroadOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a crossroad opportunity definition for act ${actKey}.`);
      } else {
        if (!crossroadOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!crossroadOpportunityDefinition.title) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a title.`);
        }
        if (!crossroadOpportunityDefinition.description) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a description.`);
        }
        if (!crossroadOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a summary.`);
        }
        if (!crossroadOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && crossroadOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.crossroadOpportunities.${actKey} requires quest "${crossroadOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!crossroadOpportunityDefinition.requiresShrineId) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing requiresShrineId.`);
        } else if (shrineDefinition?.id && crossroadOpportunityDefinition.requiresShrineId !== shrineDefinition.id) {
          pushError(
            errors,
            `worldNodes.crossroadOpportunities.${actKey} requires shrine "${crossroadOpportunityDefinition.requiresShrineId}" but act shrine is "${shrineDefinition.id}".`
          );
        }
        validateGrants(crossroadOpportunityDefinition?.grants, `worldNodes.crossroadOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(crossroadOpportunityDefinition.variants) || crossroadOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing variants.`);
        } else {
          if (crossroadOpportunityDefinition.variants.length < MIN_CROSSROAD_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.crossroadOpportunities.${actKey} must define at least ${MIN_CROSSROAD_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
          let shrineInfluencedVariantCount = 0;
          const unconditionalVariantCount = crossroadOpportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.crossroadOpportunities.${actKey} has multiple unconditional variants.`);
          }

          crossroadOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (
              (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) ||
              (Array.isArray(variantDefinition?.requiresMercenaryIds) && variantDefinition.requiresMercenaryIds.length > 0)
            ) {
              shrineInfluencedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.crossroadOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresPrimaryOutcomeIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFollowUpOutcomeIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresConsequenceIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresMercenaryIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresPrimaryOutcomeIds,
              referenceState.primaryOutcomeIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors,
              "primary quest outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresFollowUpOutcomeIds,
              referenceState.followUpOutcomeIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors,
              "follow-up outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresConsequenceIds,
              referenceState.consequenceIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors,
              "quest consequence"
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              referenceState.flagIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateKnownStringIds(
              variantDefinition.requiresMercenaryIds,
              knownMercenaryIds,
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors,
              "mercenary contract"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: crossroadOpportunityDefinition.id,
              },
              `worldNodes.crossroadOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              crossroadOpportunityDefinition.requiresQuestId
            );
          });

          if (shrineInfluencedVariantCount === 0) {
            pushError(
              errors,
              `worldNodes.crossroadOpportunities.${actKey} must include at least one shrine-influenced or mercenary-gated variant.`
            );
          }

          const authoredStates = collectActPathStates(questDefinition, shrineDefinition, {
            includeEmptyShrineState: false,
          });
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = crossroadOpportunityDefinition.variants.some((variantDefinition) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey} has no variant covering authored crossroad path "${pathState.label}".`
              );
            }
          });

          crossroadOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey}.variants[${index}] is unreachable from any authored quest/event/shrine crossroad path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = crossroadOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getOpportunityVariantSpecificity(variantDefinition),
                matches: doesVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey} has ambiguous variants for authored crossroad path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!shrineOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a shrine opportunity definition for act ${actKey}.`);
      } else {
        if (!shrineOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!shrineOpportunityDefinition.title) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a title.`);
        }
        if (!shrineOpportunityDefinition.description) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a description.`);
        }
        if (!shrineOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a summary.`);
        }
        if (!shrineOpportunityDefinition.requiresShrineId) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing requiresShrineId.`);
        } else if (shrineDefinition?.id && shrineOpportunityDefinition.requiresShrineId !== shrineDefinition.id) {
          pushError(
            errors,
            `worldNodes.shrineOpportunities.${actKey} requires shrine "${shrineOpportunityDefinition.requiresShrineId}" but act shrine is "${shrineDefinition.id}".`
          );
        }
        validateGrants(shrineOpportunityDefinition?.grants, `worldNodes.shrineOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(shrineOpportunityDefinition.variants) || shrineOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing variants.`);
        } else {
          if (shrineOpportunityDefinition.variants.length < MIN_SHRINE_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.shrineOpportunities.${actKey} must define at least ${MIN_SHRINE_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
          let mercenaryGatedVariantCount = 0;
          const unconditionalVariantCount = shrineOpportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresShrineOutcomeIds) || variantDefinition.requiresShrineOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.shrineOpportunities.${actKey} has multiple unconditional variants.`);
          }

          shrineOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresMercenaryIds) && variantDefinition.requiresMercenaryIds.length > 0) {
              mercenaryGatedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.shrineOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getShrineOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresShrineOutcomeIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresShrineOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresMercenaryIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresShrineOutcomeIds,
              referenceState.shrineOutcomeIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresShrineOutcomeIds`,
              errors,
              "shrine outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              referenceState.flagIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateKnownStringIds(
              variantDefinition.requiresMercenaryIds,
              knownMercenaryIds,
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors,
              "mercenary contract"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: shrineOpportunityDefinition.id,
              },
              `worldNodes.shrineOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors
            );
          });

          if (mercenaryGatedVariantCount === 0) {
            pushError(errors, `worldNodes.shrineOpportunities.${actKey} must include at least one mercenary-gated variant.`);
          }

          const authoredStates = collectShrinePathStates(shrineDefinition);
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = shrineOpportunityDefinition.variants.some((variantDefinition) => {
              return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey} has no variant covering authored shrine path "${pathState.label}".`
              );
            }
          });

          shrineOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey}.variants[${index}] is unreachable from any authored shrine path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = shrineOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getShrineOpportunityVariantSpecificity(variantDefinition),
                matches: doesShrineOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey} has ambiguous variants for authored shrine path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!reserveOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a reserve opportunity definition for act ${actKey}.`);
      } else {
        if (!reserveOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!reserveOpportunityDefinition.title) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing a title.`);
        }
        if (!reserveOpportunityDefinition.description) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing a description.`);
        }
        if (!reserveOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing a summary.`);
        }
        if (!reserveOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && reserveOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.reserveOpportunities.${actKey} requires quest "${reserveOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!reserveOpportunityDefinition.requiresOpportunityId) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing requiresOpportunityId.`);
        } else if (opportunityDefinition?.id && reserveOpportunityDefinition.requiresOpportunityId !== opportunityDefinition.id) {
          pushError(
            errors,
            `worldNodes.reserveOpportunities.${actKey} requires opportunity "${reserveOpportunityDefinition.requiresOpportunityId}" but act opportunity is "${opportunityDefinition.id}".`
          );
        }
        if (!reserveOpportunityDefinition.requiresShrineOpportunityId) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing requiresShrineOpportunityId.`);
        } else if (
          shrineOpportunityDefinition?.id &&
          reserveOpportunityDefinition.requiresShrineOpportunityId !== shrineOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.reserveOpportunities.${actKey} requires shrine opportunity "${reserveOpportunityDefinition.requiresShrineOpportunityId}" but act shrine opportunity is "${shrineOpportunityDefinition.id}".`
          );
        }
        if (!reserveOpportunityDefinition.requiresCrossroadOpportunityId) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing requiresCrossroadOpportunityId.`);
        } else if (
          crossroadOpportunityDefinition?.id &&
          reserveOpportunityDefinition.requiresCrossroadOpportunityId !== crossroadOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.reserveOpportunities.${actKey} requires crossroad opportunity "${reserveOpportunityDefinition.requiresCrossroadOpportunityId}" but act crossroad opportunity is "${crossroadOpportunityDefinition.id}".`
          );
        }
        validateGrants(reserveOpportunityDefinition?.grants, `worldNodes.reserveOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(reserveOpportunityDefinition.variants) || reserveOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.reserveOpportunities.${actKey} is missing variants.`);
        } else {
          if (reserveOpportunityDefinition.variants.length < MIN_RESERVE_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.reserveOpportunities.${actKey} must define at least ${MIN_RESERVE_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let crossroadInfluencedVariantCount = 0;
          const reservePathStates = collectReservePathStates(opportunityDefinition, shrineOpportunityDefinition, crossroadOpportunityDefinition);
          const reserveFlagIds = new Set(reservePathStates.flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = reserveOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.reserveOpportunities.${actKey} has multiple unconditional variants.`);
          }

          reserveOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) {
              crossroadInfluencedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.reserveOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.reserveOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.reserveOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              reserveFlagIds,
              `worldNodes.reserveOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: reserveOpportunityDefinition.id,
              },
              `worldNodes.reserveOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              reserveOpportunityDefinition.requiresQuestId
            );
          });

          if (crossroadInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.reserveOpportunities.${actKey} must include at least one late-route variant.`);
          }

          reservePathStates.forEach((pathState) => {
            const hasMatchingVariant = reserveOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.reserveOpportunities.${actKey} has no variant covering authored reserve path "${pathState.label}".`
              );
            }
          });

          reserveOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = reservePathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.reserveOpportunities.${actKey}.variants[${index}] is unreachable from any authored reserve path.`
              );
            }
          });

          reservePathStates.forEach((pathState) => {
            const matchingVariants = reserveOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.reserveOpportunities.${actKey} has ambiguous variants for authored reserve path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!relayOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a relay opportunity definition for act ${actKey}.`);
      } else {
        if (!relayOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!relayOpportunityDefinition.title) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing a title.`);
        }
        if (!relayOpportunityDefinition.description) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing a description.`);
        }
        if (!relayOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing a summary.`);
        }
        if (!relayOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && relayOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.relayOpportunities.${actKey} requires quest "${relayOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!relayOpportunityDefinition.requiresReserveOpportunityId) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing requiresReserveOpportunityId.`);
        } else if (
          reserveOpportunityDefinition?.id &&
          relayOpportunityDefinition.requiresReserveOpportunityId !== reserveOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.relayOpportunities.${actKey} requires reserve opportunity "${relayOpportunityDefinition.requiresReserveOpportunityId}" but act reserve opportunity is "${reserveOpportunityDefinition.id}".`
          );
        }
        validateGrants(relayOpportunityDefinition?.grants, `worldNodes.relayOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(relayOpportunityDefinition.variants) || relayOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.relayOpportunities.${actKey} is missing variants.`);
        } else {
          if (relayOpportunityDefinition.variants.length < MIN_RELAY_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.relayOpportunities.${actKey} must define at least ${MIN_RELAY_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let reserveInfluencedVariantCount = 0;
          const relayPathStates = collectRelayPathStates(reserveOpportunityDefinition);
          const relayFlagIds = new Set(relayPathStates.flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = relayOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.relayOpportunities.${actKey} has multiple unconditional variants.`);
          }

          relayOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) {
              reserveInfluencedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.relayOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.relayOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.relayOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              relayFlagIds,
              `worldNodes.relayOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: relayOpportunityDefinition.id,
              },
              `worldNodes.relayOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              relayOpportunityDefinition.requiresQuestId
            );
          });

          if (reserveInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.relayOpportunities.${actKey} must include at least one reserve-influenced variant.`);
          }

          relayPathStates.forEach((pathState) => {
            const hasMatchingVariant = relayOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.relayOpportunities.${actKey} has no variant covering authored relay path "${pathState.label}".`
              );
            }
          });

          relayOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = relayPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.relayOpportunities.${actKey}.variants[${index}] is unreachable from any authored relay path.`
              );
            }
          });

          relayPathStates.forEach((pathState) => {
            const matchingVariants = relayOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.relayOpportunities.${actKey} has ambiguous variants for authored relay path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!culminationOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a culmination opportunity definition for act ${actKey}.`);
      } else {
        if (!culminationOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!culminationOpportunityDefinition.title) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing a title.`);
        }
        if (!culminationOpportunityDefinition.description) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing a description.`);
        }
        if (!culminationOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing a summary.`);
        }
        if (!culminationOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && culminationOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.culminationOpportunities.${actKey} requires quest "${culminationOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!culminationOpportunityDefinition.requiresRelayOpportunityId) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing requiresRelayOpportunityId.`);
        } else if (
          relayOpportunityDefinition?.id &&
          culminationOpportunityDefinition.requiresRelayOpportunityId !== relayOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.culminationOpportunities.${actKey} requires relay opportunity "${culminationOpportunityDefinition.requiresRelayOpportunityId}" but act relay opportunity is "${relayOpportunityDefinition.id}".`
          );
        }
        validateGrants(culminationOpportunityDefinition?.grants, `worldNodes.culminationOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(culminationOpportunityDefinition.variants) || culminationOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.culminationOpportunities.${actKey} is missing variants.`);
        } else {
          if (culminationOpportunityDefinition.variants.length < MIN_CULMINATION_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.culminationOpportunities.${actKey} must define at least ${MIN_CULMINATION_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let relayInfluencedVariantCount = 0;
          let earlyChainVariantCount = 0;
          const culminationPathStates = collectCulminationPathStates(questDefinition, shrineDefinition, relayOpportunityDefinition);
          const culminationFlagIds = new Set(culminationPathStates.flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = culminationOpportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition?.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition?.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition?.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
              (!Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition?.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.culminationOpportunities.${actKey} has multiple unconditional variants.`);
          }

          culminationOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) {
              relayInfluencedVariantCount += 1;
            }
            if (
              (Array.isArray(variantDefinition?.requiresPrimaryOutcomeIds) && variantDefinition.requiresPrimaryOutcomeIds.length > 0) ||
              (Array.isArray(variantDefinition?.requiresFollowUpOutcomeIds) && variantDefinition.requiresFollowUpOutcomeIds.length > 0) ||
              (Array.isArray(variantDefinition?.requiresConsequenceIds) && variantDefinition.requiresConsequenceIds.length > 0)
            ) {
              earlyChainVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.culminationOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.culminationOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresPrimaryOutcomeIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFollowUpOutcomeIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresConsequenceIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresMercenaryIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresPrimaryOutcomeIds,
              referenceState.primaryOutcomeIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors,
              "primary quest outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresFollowUpOutcomeIds,
              referenceState.followUpOutcomeIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors,
              "follow-up outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresConsequenceIds,
              referenceState.consequenceIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors,
              "quest consequence"
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              culminationFlagIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateKnownStringIds(
              variantDefinition.requiresMercenaryIds,
              knownMercenaryIds,
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors,
              "mercenary"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: culminationOpportunityDefinition.id,
              },
              `worldNodes.culminationOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              culminationOpportunityDefinition.requiresQuestId
            );
          });

          if (relayInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.culminationOpportunities.${actKey} must include at least one relay-influenced variant.`);
          }

          if (earlyChainVariantCount === 0) {
            pushError(errors, `worldNodes.culminationOpportunities.${actKey} must include at least one earlier-chain variant.`);
          }

          culminationPathStates.forEach((pathState) => {
            const hasMatchingVariant = culminationOpportunityDefinition.variants.some((variantDefinition) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.culminationOpportunities.${actKey} has no variant covering authored culmination path "${pathState.label}".`
              );
            }
          });

          culminationOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = culminationPathStates.some((pathState) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.culminationOpportunities.${actKey}.variants[${index}] is unreachable from any authored culmination path.`
              );
            }
          });

          culminationPathStates.forEach((pathState) => {
            const matchingVariants = culminationOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getOpportunityVariantSpecificity(variantDefinition),
                matches: doesVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.culminationOpportunities.${actKey} has ambiguous variants for authored culmination path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!legacyOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a legacy opportunity definition for act ${actKey}.`);
      } else {
        if (!legacyOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!legacyOpportunityDefinition.title) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing a title.`);
        }
        if (!legacyOpportunityDefinition.description) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing a description.`);
        }
        if (!legacyOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing a summary.`);
        }
        if (!legacyOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && legacyOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.legacyOpportunities.${actKey} requires quest "${legacyOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!legacyOpportunityDefinition.requiresCulminationOpportunityId) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing requiresCulminationOpportunityId.`);
        } else if (
          culminationOpportunityDefinition?.id &&
          legacyOpportunityDefinition.requiresCulminationOpportunityId !== culminationOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.legacyOpportunities.${actKey} requires culmination opportunity "${legacyOpportunityDefinition.requiresCulminationOpportunityId}" but act culmination opportunity is "${culminationOpportunityDefinition.id}".`
          );
        }
        validateGrants(legacyOpportunityDefinition?.grants, `worldNodes.legacyOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(legacyOpportunityDefinition.variants) || legacyOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.legacyOpportunities.${actKey} is missing variants.`);
        } else {
          if (legacyOpportunityDefinition.variants.length < MIN_LEGACY_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.legacyOpportunities.${actKey} must define at least ${MIN_LEGACY_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let culminationInfluencedVariantCount = 0;
          const legacyPathStates = collectLegacyPathStates(culminationOpportunityDefinition);
          const legacyFlagIds = new Set(legacyPathStates.flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = legacyOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.legacyOpportunities.${actKey} has multiple unconditional variants.`);
          }

          legacyOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) {
              culminationInfluencedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.legacyOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.legacyOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.legacyOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              legacyFlagIds,
              `worldNodes.legacyOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: legacyOpportunityDefinition.id,
              },
              `worldNodes.legacyOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              legacyOpportunityDefinition.requiresQuestId
            );
          });

          if (culminationInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.legacyOpportunities.${actKey} must include at least one culmination-influenced variant.`);
          }

          legacyPathStates.forEach((pathState) => {
            const hasMatchingVariant = legacyOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.legacyOpportunities.${actKey} has no variant covering authored legacy path "${pathState.label}".`
              );
            }
          });

          legacyOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = legacyPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.legacyOpportunities.${actKey}.variants[${index}] is unreachable from any authored legacy path.`
              );
            }
          });

          legacyPathStates.forEach((pathState) => {
            const matchingVariants = legacyOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.legacyOpportunities.${actKey} has ambiguous variants for authored legacy path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!reckoningOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a reckoning opportunity definition for act ${actKey}.`);
      } else {
        if (!reckoningOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!reckoningOpportunityDefinition.title) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing a title.`);
        }
        if (!reckoningOpportunityDefinition.description) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing a description.`);
        }
        if (!reckoningOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing a summary.`);
        }
        if (!reckoningOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && reckoningOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.reckoningOpportunities.${actKey} requires quest "${reckoningOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!reckoningOpportunityDefinition.requiresReserveOpportunityId) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing requiresReserveOpportunityId.`);
        } else if (
          reserveOpportunityDefinition?.id &&
          reckoningOpportunityDefinition.requiresReserveOpportunityId !== reserveOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.reckoningOpportunities.${actKey} requires reserve opportunity "${reckoningOpportunityDefinition.requiresReserveOpportunityId}" but act reserve opportunity is "${reserveOpportunityDefinition.id}".`
          );
        }
        if (!reckoningOpportunityDefinition.requiresCulminationOpportunityId) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing requiresCulminationOpportunityId.`);
        } else if (
          culminationOpportunityDefinition?.id &&
          reckoningOpportunityDefinition.requiresCulminationOpportunityId !== culminationOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.reckoningOpportunities.${actKey} requires culmination opportunity "${reckoningOpportunityDefinition.requiresCulminationOpportunityId}" but act culmination opportunity is "${culminationOpportunityDefinition.id}".`
          );
        }
        validateGrants(reckoningOpportunityDefinition?.grants, `worldNodes.reckoningOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(reckoningOpportunityDefinition.variants) || reckoningOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.reckoningOpportunities.${actKey} is missing variants.`);
        } else {
          if (reckoningOpportunityDefinition.variants.length < MIN_RECKONING_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.reckoningOpportunities.${actKey} must define at least ${MIN_RECKONING_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let reserveInfluencedVariantCount = 0;
          let culminationInfluencedVariantCount = 0;
          let combinedLateVariantCount = 0;
          const reckoningPathStates = collectReckoningPathStates(culminationOpportunityDefinition, reserveOpportunityDefinition);
          const reckoningFlagIds = new Set(reckoningPathStates.flatMap((pathState) => pathState.flagIds));
          const reserveFlagIds = new Set(collectOpportunityChoiceStates(reserveOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const culminationFlagIds = new Set(collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = reckoningOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.reckoningOpportunities.${actKey} has multiple unconditional variants.`);
          }

          reckoningOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const requiredFlagIds = Array.isArray(variantDefinition?.requiresFlagIds) ? variantDefinition.requiresFlagIds : [];
            const hasReserveFlag = requiredFlagIds.some((flagId) => reserveFlagIds.has(flagId));
            const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

            if (hasReserveFlag) {
              reserveInfluencedVariantCount += 1;
            }
            if (hasCulminationFlag) {
              culminationInfluencedVariantCount += 1;
            }
            if (hasReserveFlag && hasCulminationFlag) {
              combinedLateVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.reckoningOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.reckoningOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.reckoningOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              reckoningFlagIds,
              `worldNodes.reckoningOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: reckoningOpportunityDefinition.id,
              },
              `worldNodes.reckoningOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              reckoningOpportunityDefinition.requiresQuestId
            );
          });

          if (reserveInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.reckoningOpportunities.${actKey} must include at least one reserve-influenced variant.`);
          }
          if (culminationInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.reckoningOpportunities.${actKey} must include at least one culmination-influenced variant.`);
          }
          if (combinedLateVariantCount === 0) {
            pushError(errors, `worldNodes.reckoningOpportunities.${actKey} must include at least one reserve-and-culmination influenced variant.`);
          }

          reckoningPathStates.forEach((pathState) => {
            const hasMatchingVariant = reckoningOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.reckoningOpportunities.${actKey} has no variant covering authored reckoning path "${pathState.label}".`
              );
            }
          });

          reckoningOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = reckoningPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.reckoningOpportunities.${actKey}.variants[${index}] is unreachable from any authored reckoning path.`
              );
            }
          });

          reckoningPathStates.forEach((pathState) => {
            const matchingVariants = reckoningOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.reckoningOpportunities.${actKey} has ambiguous variants for authored reckoning path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!recoveryOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a recovery opportunity definition for act ${actKey}.`);
      } else {
        if (!recoveryOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!recoveryOpportunityDefinition.title) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing a title.`);
        }
        if (!recoveryOpportunityDefinition.description) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing a description.`);
        }
        if (!recoveryOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing a summary.`);
        }
        if (!recoveryOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && recoveryOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.recoveryOpportunities.${actKey} requires quest "${recoveryOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!recoveryOpportunityDefinition.requiresShrineOpportunityId) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing requiresShrineOpportunityId.`);
        } else if (
          shrineOpportunityDefinition?.id &&
          recoveryOpportunityDefinition.requiresShrineOpportunityId !== shrineOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.recoveryOpportunities.${actKey} requires shrine opportunity "${recoveryOpportunityDefinition.requiresShrineOpportunityId}" but act shrine opportunity is "${shrineOpportunityDefinition.id}".`
          );
        }
        if (!recoveryOpportunityDefinition.requiresCulminationOpportunityId) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing requiresCulminationOpportunityId.`);
        } else if (
          culminationOpportunityDefinition?.id &&
          recoveryOpportunityDefinition.requiresCulminationOpportunityId !== culminationOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.recoveryOpportunities.${actKey} requires culmination opportunity "${recoveryOpportunityDefinition.requiresCulminationOpportunityId}" but act culmination opportunity is "${culminationOpportunityDefinition.id}".`
          );
        }
        validateGrants(recoveryOpportunityDefinition?.grants, `worldNodes.recoveryOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(recoveryOpportunityDefinition.variants) || recoveryOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.recoveryOpportunities.${actKey} is missing variants.`);
        } else {
          if (recoveryOpportunityDefinition.variants.length < MIN_RECOVERY_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.recoveryOpportunities.${actKey} must define at least ${MIN_RECOVERY_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let shrineInfluencedVariantCount = 0;
          let culminationInfluencedVariantCount = 0;
          let combinedLateVariantCount = 0;
          const recoveryPathStates = collectRecoveryPathStates(culminationOpportunityDefinition, shrineOpportunityDefinition);
          const recoveryFlagIds = new Set(recoveryPathStates.flatMap((pathState) => pathState.flagIds));
          const shrineFlagIds = new Set(collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const culminationFlagIds = new Set(collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = recoveryOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.recoveryOpportunities.${actKey} has multiple unconditional variants.`);
          }

          recoveryOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const requiredFlagIds = Array.isArray(variantDefinition?.requiresFlagIds) ? variantDefinition.requiresFlagIds : [];
            const hasShrineFlag = requiredFlagIds.some((flagId) => shrineFlagIds.has(flagId));
            const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

            if (hasShrineFlag) {
              shrineInfluencedVariantCount += 1;
            }
            if (hasCulminationFlag) {
              culminationInfluencedVariantCount += 1;
            }
            if (hasShrineFlag && hasCulminationFlag) {
              combinedLateVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.recoveryOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.recoveryOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.recoveryOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              recoveryFlagIds,
              `worldNodes.recoveryOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: recoveryOpportunityDefinition.id,
              },
              `worldNodes.recoveryOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              recoveryOpportunityDefinition.requiresQuestId
            );
          });

          if (shrineInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.recoveryOpportunities.${actKey} must include at least one shrine-influenced variant.`);
          }
          if (culminationInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.recoveryOpportunities.${actKey} must include at least one culmination-influenced variant.`);
          }
          if (combinedLateVariantCount === 0) {
            pushError(errors, `worldNodes.recoveryOpportunities.${actKey} must include at least one shrine-and-culmination influenced variant.`);
          }

          recoveryPathStates.forEach((pathState) => {
            const hasMatchingVariant = recoveryOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.recoveryOpportunities.${actKey} has no variant covering authored recovery path "${pathState.label}".`
              );
            }
          });

          recoveryOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = recoveryPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.recoveryOpportunities.${actKey}.variants[${index}] is unreachable from any authored recovery path.`
              );
            }
          });

          recoveryPathStates.forEach((pathState) => {
            const matchingVariants = recoveryOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.recoveryOpportunities.${actKey} has ambiguous variants for authored recovery path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!accordOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing an accord opportunity definition for act ${actKey}.`);
      } else {
        if (!accordOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!accordOpportunityDefinition.title) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing a title.`);
        }
        if (!accordOpportunityDefinition.description) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing a description.`);
        }
        if (!accordOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing a summary.`);
        }
        if (!accordOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && accordOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.accordOpportunities.${actKey} requires quest "${accordOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!accordOpportunityDefinition.requiresShrineOpportunityId) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing requiresShrineOpportunityId.`);
        } else if (
          shrineOpportunityDefinition?.id &&
          accordOpportunityDefinition.requiresShrineOpportunityId !== shrineOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.accordOpportunities.${actKey} requires shrine opportunity "${accordOpportunityDefinition.requiresShrineOpportunityId}" but act shrine opportunity is "${shrineOpportunityDefinition.id}".`
          );
        }
        if (!accordOpportunityDefinition.requiresCrossroadOpportunityId) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing requiresCrossroadOpportunityId.`);
        } else if (
          crossroadOpportunityDefinition?.id &&
          accordOpportunityDefinition.requiresCrossroadOpportunityId !== crossroadOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.accordOpportunities.${actKey} requires crossroad opportunity "${accordOpportunityDefinition.requiresCrossroadOpportunityId}" but act crossroad opportunity is "${crossroadOpportunityDefinition.id}".`
          );
        }
        if (!accordOpportunityDefinition.requiresCulminationOpportunityId) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing requiresCulminationOpportunityId.`);
        } else if (
          culminationOpportunityDefinition?.id &&
          accordOpportunityDefinition.requiresCulminationOpportunityId !== culminationOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.accordOpportunities.${actKey} requires culmination opportunity "${accordOpportunityDefinition.requiresCulminationOpportunityId}" but act culmination opportunity is "${culminationOpportunityDefinition.id}".`
          );
        }
        validateGrants(accordOpportunityDefinition?.grants, `worldNodes.accordOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(accordOpportunityDefinition.variants) || accordOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.accordOpportunities.${actKey} is missing variants.`);
        } else {
          if (accordOpportunityDefinition.variants.length < MIN_ACCORD_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.accordOpportunities.${actKey} must define at least ${MIN_ACCORD_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let shrineInfluencedVariantCount = 0;
          let crossroadInfluencedVariantCount = 0;
          let culminationInfluencedVariantCount = 0;
          let combinedRouteVariantCount = 0;
          let combinedLateVariantCount = 0;
          const accordPathStates = collectAccordPathStates(
            culminationOpportunityDefinition,
            shrineOpportunityDefinition,
            crossroadOpportunityDefinition
          );
          const accordFlagIds = new Set(accordPathStates.flatMap((pathState) => pathState.flagIds));
          const shrineFlagIds = new Set(collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const crossroadFlagIds = new Set(collectOpportunityChoiceStates(crossroadOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const culminationFlagIds = new Set(collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = accordOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} has multiple unconditional variants.`);
          }

          accordOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const requiredFlagIds = Array.isArray(variantDefinition?.requiresFlagIds) ? variantDefinition.requiresFlagIds : [];
            const hasShrineFlag = requiredFlagIds.some((flagId) => shrineFlagIds.has(flagId));
            const hasCrossroadFlag = requiredFlagIds.some((flagId) => crossroadFlagIds.has(flagId));
            const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

            if (hasShrineFlag) {
              shrineInfluencedVariantCount += 1;
            }
            if (hasCrossroadFlag) {
              crossroadInfluencedVariantCount += 1;
            }
            if (hasCulminationFlag) {
              culminationInfluencedVariantCount += 1;
            }
            if (hasShrineFlag && hasCrossroadFlag) {
              combinedRouteVariantCount += 1;
            }
            if (hasShrineFlag && hasCrossroadFlag && hasCulminationFlag) {
              combinedLateVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.accordOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.accordOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.accordOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              accordFlagIds,
              `worldNodes.accordOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: accordOpportunityDefinition.id,
              },
              `worldNodes.accordOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              accordOpportunityDefinition.requiresQuestId
            );
          });

          if (shrineInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} must include at least one shrine-influenced variant.`);
          }
          if (crossroadInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} must include at least one crossroad-influenced variant.`);
          }
          if (culminationInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} must include at least one culmination-influenced variant.`);
          }
          if (combinedRouteVariantCount === 0) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} must include at least one shrine-and-crossroad influenced variant.`);
          }
          if (combinedLateVariantCount === 0) {
            pushError(errors, `worldNodes.accordOpportunities.${actKey} must include at least one shrine-and-crossroad-and-culmination influenced variant.`);
          }

          accordPathStates.forEach((pathState) => {
            const hasMatchingVariant = accordOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.accordOpportunities.${actKey} has no variant covering authored accord path "${pathState.label}".`
              );
            }
          });

          accordOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = accordPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.accordOpportunities.${actKey}.variants[${index}] is unreachable from any authored accord path.`
              );
            }
          });

          accordPathStates.forEach((pathState) => {
            const matchingVariants = accordOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.accordOpportunities.${actKey} has ambiguous variants for authored accord path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!covenantOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a covenant opportunity definition for act ${actKey}.`);
      } else {
        if (!covenantOpportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!covenantOpportunityDefinition.title) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing a title.`);
        }
        if (!covenantOpportunityDefinition.description) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing a description.`);
        }
        if (!covenantOpportunityDefinition.summary) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing a summary.`);
        }
        if (!covenantOpportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && covenantOpportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.covenantOpportunities.${actKey} requires quest "${covenantOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        if (!covenantOpportunityDefinition.requiresLegacyOpportunityId) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing requiresLegacyOpportunityId.`);
        } else if (
          legacyOpportunityDefinition?.id &&
          covenantOpportunityDefinition.requiresLegacyOpportunityId !== legacyOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.covenantOpportunities.${actKey} requires legacy opportunity "${covenantOpportunityDefinition.requiresLegacyOpportunityId}" but act legacy opportunity is "${legacyOpportunityDefinition.id}".`
          );
        }
        if (!covenantOpportunityDefinition.requiresReckoningOpportunityId) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing requiresReckoningOpportunityId.`);
        } else if (
          reckoningOpportunityDefinition?.id &&
          covenantOpportunityDefinition.requiresReckoningOpportunityId !== reckoningOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.covenantOpportunities.${actKey} requires reckoning opportunity "${covenantOpportunityDefinition.requiresReckoningOpportunityId}" but act reckoning opportunity is "${reckoningOpportunityDefinition.id}".`
          );
        }
        if (!covenantOpportunityDefinition.requiresRecoveryOpportunityId) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing requiresRecoveryOpportunityId.`);
        } else if (
          recoveryOpportunityDefinition?.id &&
          covenantOpportunityDefinition.requiresRecoveryOpportunityId !== recoveryOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.covenantOpportunities.${actKey} requires recovery opportunity "${covenantOpportunityDefinition.requiresRecoveryOpportunityId}" but act recovery opportunity is "${recoveryOpportunityDefinition.id}".`
          );
        }
        if (!covenantOpportunityDefinition.requiresAccordOpportunityId) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing requiresAccordOpportunityId.`);
        } else if (
          accordOpportunityDefinition?.id &&
          covenantOpportunityDefinition.requiresAccordOpportunityId !== accordOpportunityDefinition.id
        ) {
          pushError(
            errors,
            `worldNodes.covenantOpportunities.${actKey} requires accord opportunity "${covenantOpportunityDefinition.requiresAccordOpportunityId}" but act accord opportunity is "${accordOpportunityDefinition.id}".`
          );
        }
        validateGrants(covenantOpportunityDefinition?.grants, `worldNodes.covenantOpportunities.${actKey}.grants`, errors);

        if (!Array.isArray(covenantOpportunityDefinition.variants) || covenantOpportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.covenantOpportunities.${actKey} is missing variants.`);
        } else {
          if (covenantOpportunityDefinition.variants.length < MIN_COVENANT_OPPORTUNITY_VARIANTS) {
            pushError(
              errors,
              `worldNodes.covenantOpportunities.${actKey} must define at least ${MIN_COVENANT_OPPORTUNITY_VARIANTS} variants.`
            );
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          let legacyInfluencedVariantCount = 0;
          let reckoningInfluencedVariantCount = 0;
          let recoveryInfluencedVariantCount = 0;
          let accordInfluencedVariantCount = 0;
          let recoveryAndAccordVariantCount = 0;
          let allLateRoutesVariantCount = 0;
          const covenantPathStates = collectCovenantPathStates(
            legacyOpportunityDefinition,
            reckoningOpportunityDefinition,
            recoveryOpportunityDefinition,
            accordOpportunityDefinition
          );
          const covenantFlagIds = new Set(covenantPathStates.flatMap((pathState) => pathState.flagIds));
          const legacyFlagIds = new Set(collectOpportunityChoiceStates(legacyOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const reckoningFlagIds = new Set(
            collectOpportunityChoiceStates(reckoningOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
          );
          const recoveryFlagIds = new Set(collectOpportunityChoiceStates(recoveryOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const accordFlagIds = new Set(collectOpportunityChoiceStates(accordOpportunityDefinition).flatMap((pathState) => pathState.flagIds));
          const unconditionalVariantCount = covenantOpportunityDefinition.variants.filter((variantDefinition) => {
            return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} has multiple unconditional variants.`);
          }

          covenantOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const requiredFlagIds = Array.isArray(variantDefinition?.requiresFlagIds) ? variantDefinition.requiresFlagIds : [];
            const hasLegacyFlag = requiredFlagIds.some((flagId) => legacyFlagIds.has(flagId));
            const hasReckoningFlag = requiredFlagIds.some((flagId) => reckoningFlagIds.has(flagId));
            const hasRecoveryFlag = requiredFlagIds.some((flagId) => recoveryFlagIds.has(flagId));
            const hasAccordFlag = requiredFlagIds.some((flagId) => accordFlagIds.has(flagId));

            if (hasLegacyFlag) {
              legacyInfluencedVariantCount += 1;
            }
            if (hasReckoningFlag) {
              reckoningInfluencedVariantCount += 1;
            }
            if (hasRecoveryFlag) {
              recoveryInfluencedVariantCount += 1;
            }
            if (hasAccordFlag) {
              accordInfluencedVariantCount += 1;
            }
            if (hasRecoveryFlag && hasAccordFlag) {
              recoveryAndAccordVariantCount += 1;
            }
            if (hasLegacyFlag && hasReckoningFlag && hasRecoveryFlag && hasAccordFlag) {
              allLateRoutesVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.covenantOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.covenantOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.covenantOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              covenantFlagIds,
              `worldNodes.covenantOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: covenantOpportunityDefinition.id,
              },
              `worldNodes.covenantOpportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              covenantOpportunityDefinition.requiresQuestId
            );
          });

          if (legacyInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one legacy-influenced variant.`);
          }
          if (reckoningInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one reckoning-influenced variant.`);
          }
          if (recoveryInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one recovery-influenced variant.`);
          }
          if (accordInfluencedVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one accord-influenced variant.`);
          }
          if (recoveryAndAccordVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one recovery-and-accord influenced variant.`);
          }
          if (allLateRoutesVariantCount === 0) {
            pushError(errors, `worldNodes.covenantOpportunities.${actKey} must include at least one legacy-and-reckoning-and-recovery-and-accord influenced variant.`);
          }

          covenantPathStates.forEach((pathState) => {
            const hasMatchingVariant = covenantOpportunityDefinition.variants.some((variantDefinition) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.covenantOpportunities.${actKey} has no variant covering authored covenant path "${pathState.label}".`
              );
            }
          });

          covenantOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = covenantPathStates.some((pathState) => {
              return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.covenantOpportunities.${actKey}.variants[${index}] is unreachable from any authored covenant path.`
              );
            }
          });

          covenantPathStates.forEach((pathState) => {
            const matchingVariants = covenantOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
                matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.covenantOpportunities.${actKey} has ambiguous variants for authored covenant path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).forEach((choiceDefinition, index) => {
        if (!choiceDefinition?.followUp) {
          return;
        }
        validateRewardDefinition(
          {
            ...choiceDefinition.followUp,
            id: eventDefinition?.id || choiceDefinition.followUp.id,
          },
          `worldNodes.quests.${actKey}.choices[${index}].followUp`,
          "event",
          errors,
          eventDefinition?.requiresQuestId || ""
        );
      });
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function assertValid(report) {
    if (report.ok) {
      return;
    }
    throw new Error(`Content validation failed:\n- ${report.errors.join("\n- ")}`);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR = {
    validateSeedBundle,
    assertValidSeedBundle(seedBundle) {
      assertValid(validateSeedBundle(seedBundle));
    },
    validateRuntimeContent,
    assertValidRuntimeContent(content) {
      assertValid(validateRuntimeContent(content));
    },
    validateWorldNodeCatalog,
    assertValidWorldNodeCatalog(worldNodeCatalog) {
      assertValid(validateWorldNodeCatalog(worldNodeCatalog));
    },
  };
})();
