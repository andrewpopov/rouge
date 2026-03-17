(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & {
    ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT?: ContentValidatorRuntimeContentApi;
  };
  const { collectEffectFlagIds } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;
  const { validateMercenaryCatalog } = runtimeWindow.__ROUGE_CV_RUNTIME_MERCENARIES;

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
    branchBattle: 5,
    branchMiniboss: 5,
    boss: 7,
  };

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

  function collectKnownWorldFlagIds(worldNodeCatalog) {
    const flagIds = new Set();
    const catalogKeys = [
      "quests", "shrines", "opportunities", "crossroadOpportunities", "shrineOpportunities",
      "reserveOpportunities", "relayOpportunities", "culminationOpportunities", "legacyOpportunities",
      "reckoningOpportunities", "recoveryOpportunities", "accordOpportunities", "covenantOpportunities",
      "detourOpportunities", "escalationOpportunities",
    ];

    for (const catalogKey of catalogKeys) {
      for (const rawDef of Object.values(worldNodeCatalog?.[catalogKey] || {})) {
        const definition = rawDef as Record<string, unknown>;
        const choices = catalogKey === "quests" && Array.isArray(definition.choices) ? definition.choices : [];
        const variantChoices = Array.isArray(definition.variants)
          ? (definition.variants as Record<string, unknown>[]).flatMap((v) => (Array.isArray(v.choices) ? v.choices : []))
          : [];

        for (const choice of [...choices, ...variantChoices]) {
          collectEffectFlagIds(choice?.effects).forEach((flagId) => flagIds.add(flagId));
          const followUpChoices = Array.isArray(choice?.followUp?.choices) ? choice.followUp.choices : [];
          followUpChoices.forEach((followUp) => {
            collectEffectFlagIds(followUp?.effects).forEach((flagId) => flagIds.add(flagId));
          });
        }
      }
    }

    return flagIds;
  }

  function validateCardAndClassContent(content, cardCatalog, errors) {
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
  }

  function validateEnemyCatalog(enemyCatalog, eliteAffixesByAct, errors) {
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
  }

  function validateEncounterCatalog(encounterCatalog, enemyCatalog, errors) {
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
  }

  function validateGeneratedActEncounters(content, encounterCatalog, eliteAffixesByAct, errors) {
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
  }

  function validateConsequenceEncounterPackages(actNumber, content, encounterCatalog, knownWorldFlagIds, errors) {
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
    const roleCounts = { branchBattle: 0, branchMiniboss: 0, boss: 0 };

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
      pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle} packages for zoneRole "branchBattle".`);
    }
    if (roleCounts.branchMiniboss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss) {
      pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss} packages for zoneRole "branchMiniboss".`);
    }
    if (roleCounts.boss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss) {
      pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss} packages for zoneRole "boss".`);
    }
  }

  function validateConsequenceRewardPackages(actNumber, content, knownWorldFlagIds, errors) {
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
    const rewardRoleCounts = { branchBattle: 0, branchMiniboss: 0, boss: 0 };

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
      pushError(errors, `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchBattle} packages for zoneRole "branchBattle".`);
    }
    if (rewardRoleCounts.branchMiniboss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss) {
      pushError(errors, `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.branchMiniboss} packages for zoneRole "branchMiniboss".`);
    }
    if (rewardRoleCounts.boss < MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss) {
      pushError(errors, `consequenceRewardPackages.${actNumber} must include at least ${MIN_CONSEQUENCE_PACKAGES_PER_ROLE.boss} packages for zoneRole "boss".`);
    }
  }

  function validateRuntimeContent(content) {
    const errors = [];
    const cardCatalog = content?.cardCatalog || {};
    const mercenaryCatalog = content?.mercenaryCatalog || {};
    const enemyCatalog = content?.enemyCatalog || {};
    const encounterCatalog = content?.encounterCatalog || {};
    const eliteAffixesByAct = {};
    const worldNodeCatalog = runtimeWindow.ROUGE_WORLD_NODE_CATALOG?.getCatalog?.();
    const knownWorldFlagIds = collectKnownWorldFlagIds(worldNodeCatalog);

    (Object.values(mercenaryCatalog) as MercenaryDefinition[]).forEach((mercenary) => {
      (Array.isArray(mercenary?.routePerks) ? mercenary.routePerks : []).forEach((routePerk) => {
        (Array.isArray(routePerk?.requiredFlagIds) ? routePerk.requiredFlagIds : []).forEach((flagId) => {
          if (typeof flagId === "string" && flagId) {
            knownWorldFlagIds.add(flagId);
          }
        });
      });
    });
    validateMercenaryCatalog(mercenaryCatalog, knownWorldFlagIds, worldNodeCatalog, errors);

    validateCardAndClassContent(content, cardCatalog, errors);
    validateEnemyCatalog(enemyCatalog, eliteAffixesByAct, errors);
    validateEncounterCatalog(encounterCatalog, enemyCatalog, errors);
    validateGeneratedActEncounters(content, encounterCatalog, eliteAffixesByAct, errors);

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
      const hasEncounterPackages = Array.isArray(content?.consequenceEncounterPackages?.[Number(actNumber)]);
      const hasRewardPackages = Array.isArray(content?.consequenceRewardPackages?.[Number(actNumber)]);
      if (!hasEncounterPackages && !hasRewardPackages) {
        return;
      }
      validateConsequenceEncounterPackages(actNumber, content, encounterCatalog, knownWorldFlagIds, errors);
      validateConsequenceRewardPackages(actNumber, content, knownWorldFlagIds, errors);
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
