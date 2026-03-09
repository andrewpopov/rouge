(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & {
    ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT?: ContentValidatorRuntimeContentApi;
  };
  const { collectEffectFlagIds } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

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
    "court_reserves",
    "backline_screen",
    "vanguard_rush",
    "escort_command",
    "escort_rotation",
    "crossfire_lanes",
    "war_drums",
    "triage_command",
    "triage_screen",
    "linebreaker_charge",
    "ritual_cadence",
    "elite_onslaught",
    "sniper_nest",
    "boss_screen",
    "boss_salvo",
    "boss_onslaught",
    "phalanx_march",
  ]);

  const ALLOWED_CONSEQUENCE_ENCOUNTER_ZONE_ROLES = new Set(["branchBattle", "branchMiniboss", "boss"]);
  const ALLOWED_CONSEQUENCE_REWARD_ZONE_ROLES = new Set(["branchBattle", "branchMiniboss", "boss"]);

  const MIN_GENERATED_GROUP_SIZES = { opening: 6, branchBattle: 6, branchMiniboss: 6, boss: 1 };
  const MIN_CONSEQUENCE_ENCOUNTER_PACKAGES_PER_ACT = 3;
  const MIN_CONSEQUENCE_REWARD_PACKAGES_PER_ACT = 3;
  const MIN_CONSEQUENCE_PACKAGES_PER_ROLE = {
    branchBattle: 4,
    branchMiniboss: 4,
    boss: 6,
  };

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
  const MIN_ENCOUNTER_MODIFIER_FAMILIES_PER_ACT = 20;

  function pushError(errors, message) { errors.push(message); }

  function validateCardIdList(cardIds, cardCatalog, label, errors) {
    (Array.isArray(cardIds) ? cardIds : []).forEach((cardId, index) => {
      if (!cardCatalog?.[cardId]) {
        pushError(errors, `${label}[${index}] references missing card "${cardId}".`);
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

  function getConsequenceRewardPackageRequirementSignature(rewardPackage) {
    const requiredFlagIds = Array.isArray(rewardPackage?.requiredFlagIds)
      ? Array.from(new Set(rewardPackage.requiredFlagIds.filter((value) => typeof value === "string" && value))).sort()
      : [];
    return `${rewardPackage?.zoneRole || "-"}|${requiredFlagIds.join("&") || "-"}`;
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
      ...Object.values(worldNodeCatalog?.detourOpportunities || {}).flatMap((detourOpportunityDefinition) => (Array.isArray(detourOpportunityDefinition?.variants) ? detourOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
      ...Object.values(worldNodeCatalog?.escalationOpportunities || {}).flatMap((escalationOpportunityDefinition) => (Array.isArray(escalationOpportunityDefinition?.variants) ? escalationOpportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
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
          }
        });
      });

      const modifierKinds = new Set(
        (Object.values(encounterCatalog) as EncounterDefinition[])
          .filter((encounter) => typeof encounter?.id === "string" && encounter.id.startsWith(`act_${actNumber}_`))
          .flatMap((encounter) => (Array.isArray(encounter?.modifiers) ? encounter.modifiers : []))
          .map((modifier) => modifier?.kind)
          .filter((modifierKind) => typeof modifierKind === "string" && modifierKind)
      );
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

    Object.keys(content?.consequenceRewardPackages || {}).forEach((actNumber) => {
      if (!content?.generatedActEncounterIds?.[Number(actNumber)]) {
        pushError(errors, `consequenceRewardPackages.${actNumber} references unknown act ${actNumber}.`);
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
        boss: 0,
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
        } else if (
          encounterPackage.zoneRole === "branchBattle" ||
          encounterPackage.zoneRole === "branchMiniboss" ||
          encounterPackage.zoneRole === "boss"
        ) {
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

      if (roleCounts.branchBattle < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle) {
        pushError(
          errors,
          `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle} packages for zoneRole "branchBattle".`
        );
      }
      if (roleCounts.branchMiniboss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss) {
        pushError(
          errors,
          `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss} packages for zoneRole "branchMiniboss".`
        );
      }
      if (roleCounts.boss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss) {
        pushError(
          errors,
          `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss} packages for zoneRole "boss".`
        );
      }

      const rewardPackages = Array.isArray(content?.consequenceRewardPackages?.[Number(actNumber)])
        ? content.consequenceRewardPackages[Number(actNumber)]
        : [];
      if (rewardPackages.length < MIN_CONSEQUENCE_REWARD_PACKAGES_PER_ACT) {
        pushError(
          errors,
          `consequenceRewardPackages.${actNumber} must define at least ${MIN_CONSEQUENCE_REWARD_PACKAGES_PER_ACT} consequence reward packages.`
        );
      }

      const seenRewardPackageIds = new Set();
      const seenRewardSignatures = new Map();
      const rewardRoleCounts = {
        branchBattle: 0,
        branchMiniboss: 0,
        boss: 0,
      };

      rewardPackages.forEach((rewardPackage, index) => {
        const packageLabel = `consequenceRewardPackages.${actNumber}[${index}]`;
        if (!rewardPackage?.id) {
          pushError(errors, `${packageLabel} is missing an id.`);
        } else if (seenRewardPackageIds.has(rewardPackage.id)) {
          pushError(errors, `consequenceRewardPackages.${actNumber} reuses package id "${rewardPackage.id}".`);
        } else {
          seenRewardPackageIds.add(rewardPackage.id);
        }

        if (!rewardPackage?.title) {
          pushError(errors, `${packageLabel} is missing a title.`);
        }
        if (!ALLOWED_CONSEQUENCE_REWARD_ZONE_ROLES.has(rewardPackage?.zoneRole)) {
          pushError(errors, `${packageLabel}.zoneRole "${rewardPackage?.zoneRole || ""}" is not supported.`);
        } else if (
          rewardPackage.zoneRole === "branchBattle" ||
          rewardPackage.zoneRole === "branchMiniboss" ||
          rewardPackage.zoneRole === "boss"
        ) {
          rewardRoleCounts[rewardPackage.zoneRole] += 1;
        }

        validateStringIdList(rewardPackage?.requiredFlagIds, `${packageLabel}.requiredFlagIds`, errors);
        if (!Array.isArray(rewardPackage?.requiredFlagIds) || rewardPackage.requiredFlagIds.length === 0) {
          pushError(errors, `${packageLabel} must require at least one world flag.`);
        } else {
          validateKnownStringIds(
            rewardPackage.requiredFlagIds,
            knownWorldFlagIds,
            `${packageLabel}.requiredFlagIds`,
            errors,
            "world flag"
          );
        }

        const requirementSignature = getConsequenceRewardPackageRequirementSignature(rewardPackage);
        const existingPackageId = seenRewardSignatures.get(requirementSignature);
        if (existingPackageId) {
          pushError(errors, `${packageLabel} reuses requirement signature with package "${existingPackageId}".`);
        } else if (rewardPackage?.id) {
          seenRewardSignatures.set(requirementSignature, rewardPackage.id);
        } else {
          seenRewardSignatures.set(requirementSignature, `[${index}]`);
        }

        if (!rewardPackage?.grants || typeof rewardPackage.grants !== "object") {
          pushError(errors, `${packageLabel}.grants must be an object.`);
        } else {
          const grantValues = ["gold", "xp", "potions"].map((grantKey) => {
            const grantValue = Number.parseInt(String(rewardPackage.grants?.[grantKey] || 0), 10);
            if (!Number.isFinite(grantValue) || grantValue < 0) {
              pushError(errors, `${packageLabel}.grants.${grantKey} must be a non-negative integer.`);
            }
            return Math.max(0, Number.isFinite(grantValue) ? grantValue : 0);
          });
          if (grantValues.every((grantValue) => grantValue === 0)) {
            pushError(errors, `${packageLabel}.grants must define at least one positive reward bonus.`);
          }
        }

        validateStringIdList(rewardPackage?.bonusLines, `${packageLabel}.bonusLines`, errors);
      });

      if (rewardRoleCounts.branchBattle < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle) {
        pushError(
          errors,
          `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle} packages for zoneRole "branchBattle".`
        );
      }
      if (rewardRoleCounts.branchMiniboss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss) {
        pushError(
          errors,
          `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss} packages for zoneRole "branchMiniboss".`
        );
      }
      if (rewardRoleCounts.boss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss) {
        pushError(
          errors,
          `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss} packages for zoneRole "boss".`
        );
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT = {
    validateRuntimeContent,
  };
})();
