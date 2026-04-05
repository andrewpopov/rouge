(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & {
    __ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT?: ContentValidatorRuntimeContentApi;
  };
  const { collectEffectFlagIds } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const ALLOWED_INTENT_KINDS = new Set([
    "attack", "attack_all", "attack_and_guard", "attack_burn", "attack_burn_all",
    "attack_chill", "attack_lightning", "attack_lightning_all", "attack_poison",
    "attack_poison_all", "buff_allies_attack", "charge", "consume_corpse",
    "corpse_explosion", "curse_amplify", "curse_weaken", "drain_attack", "drain_energy",
    "guard", "guard_allies", "heal_ally", "heal_allies", "heal_and_guard",
    "resurrect_ally", "summon_minion", "sunder_attack", "teleport",
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

  function pushError(errors: string[], message: string) { errors.push(message); }

  function validateCardIdList(cardIds: unknown, cardCatalog: Record<string, CardDefinition>, label: string, errors: string[]) {
    (Array.isArray(cardIds) ? cardIds : []).forEach((cardId: string, index: number) => {
      if (!cardCatalog?.[cardId]) {
        pushError(errors, `${label}[${index}] references missing card "${cardId}".`);
      }
    });
  }

  function validateStringIdList(values: unknown, label: string, errors: string[]) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value !== "string" || !value) {
        pushError(errors, `${label}[${index}] must be a non-empty string.`);
      }
    });
  }

  function validateKnownStringIds(values: unknown, knownValues: Set<string>, label: string, errors: string[], referenceType: string) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value === "string" && value && !knownValues.has(value)) {
        pushError(errors, `${label}[${index}] references unknown ${referenceType} "${value}".`);
      }
    });
  }

  function getConsequenceEncounterPackageRequirementSignature(encounterPackage: ConsequenceEncounterPackageDefinition | null | undefined) {
    const requiredFlagIds = Array.isArray(encounterPackage?.requiredFlagIds)
      ? Array.from(new Set(encounterPackage.requiredFlagIds.filter((value: string) => typeof value === "string" && value))).sort()
      : [];
    return `${encounterPackage?.zoneRole || "-"}|${requiredFlagIds.join("&") || "-"}`;
  }

  function getConsequenceRewardPackageRequirementSignature(rewardPackage: ConsequenceRewardPackageDefinition | null | undefined) {
    const requiredFlagIds = Array.isArray(rewardPackage?.requiredFlagIds)
      ? Array.from(new Set(rewardPackage.requiredFlagIds.filter((value: string) => typeof value === "string" && value))).sort()
      : [];
    return `${rewardPackage?.zoneRole || "-"}|${requiredFlagIds.join("&") || "-"}`;
  }

  function collectKnownWorldFlagIds(worldNodeCatalog: WorldNodeCatalog | null | undefined) {
    const flagIds = new Set<string>();
    const catalogKeys = [
      "quests", "shrines", "opportunities", "crossroadOpportunities", "shrineOpportunities",
      "reserveOpportunities", "relayOpportunities", "culminationOpportunities", "legacyOpportunities",
      "reckoningOpportunities", "recoveryOpportunities", "accordOpportunities", "covenantOpportunities",
      "detourOpportunities", "escalationOpportunities",
    ];

    for (const catalogKey of catalogKeys) {
      for (const rawDef of Object.values((worldNodeCatalog as unknown as Record<string, Record<string, unknown>>)?.[catalogKey] || {})) {
        const definition = rawDef as Record<string, unknown>;
        const choices = catalogKey === "quests" && Array.isArray(definition.choices) ? definition.choices : [];
        const variantChoices = Array.isArray(definition.variants)
          ? (definition.variants as Record<string, unknown>[]).flatMap((v) => (Array.isArray(v.choices) ? v.choices : []))
          : [];

        for (const choice of [...choices, ...variantChoices]) {
          collectEffectFlagIds(choice?.effects).forEach((flagId: string) => flagIds.add(flagId));
          const followUpChoices = Array.isArray(choice?.followUp?.choices) ? choice.followUp.choices : [];
          followUpChoices.forEach((followUp: Record<string, unknown>) => {
            collectEffectFlagIds(followUp?.effects as RewardChoiceEffect[] | null | undefined).forEach((flagId: string) => flagIds.add(flagId));
          });
        }
      }
    }

    return flagIds;
  }

  function validateCardAndClassContent(content: GameContent, cardCatalog: Record<string, CardDefinition>, errors: string[]) {
    validateCardIdList(content?.starterDeck, cardCatalog, "starterDeck", errors);

    Object.entries(content?.starterDeckProfiles || {}).forEach(([profileId, cardIds]: [string, string[]]) => {
      validateCardIdList(cardIds, cardCatalog, `starterDeckProfiles.${profileId}`, errors);
    });

    Object.entries(content?.classDeckProfiles || {}).forEach(([classId, profileId]: [string, string]) => {
      const profileKey = String(profileId || "");
      if (!content?.starterDeckProfiles?.[profileKey]) {
        pushError(errors, `classDeckProfiles.${classId} references missing starter deck profile "${profileKey}".`);
      }
      if (!content?.classProgressionCatalog?.[classId]) {
        pushError(errors, `classProgressionCatalog is missing class "${classId}".`);
      }
    });

    Object.entries(content?.classProgressionCatalog || {}).forEach(([classId, progressionEntry]: [string, unknown]) => {
      const progression = progressionEntry as RuntimeClassProgressionDefinition | undefined;
      if (!Array.isArray(progression?.trees) || progression.trees.length === 0) {
        pushError(errors, `classProgressionCatalog.${classId} is missing trees.`);
        return;
      }
      if (!progression?.starterSkillId) {
        pushError(errors, `classProgressionCatalog.${classId} is missing starterSkillId.`);
      }

      const classSkillIds = new Set<string>();
      let hasStarterSkill = false;
      progression.trees.forEach((tree: RuntimeClassTreeDefinition, index: number) => {
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
          return;
        }
        tree.skills.forEach((skill: RuntimeClassSkillDefinition, skillIndex: number) => {
          if (!skill?.id || !skill?.name) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing identity fields.`);
            return;
          }
          classSkillIds.add(skill.id);
          if (skill.id === progression.starterSkillId) {
            hasStarterSkill = true;
            if (skill.slot !== 1 || skill.tier !== "starter") {
              pushError(
                errors,
                `classProgressionCatalog.${classId}.starterSkillId must reference a slot-1 starter skill.`
              );
            }
          }
          if (!["state", "command", "answer", "trigger_arming", "conversion", "recovery", "commitment"].includes(skill.family)) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] has invalid family "${String(skill.family || "")}".`);
          }
          if (skill.slot !== 1 && skill.slot !== 2 && skill.slot !== 3) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] has invalid slot "${String(skill.slot || "")}".`);
          }
          if (skill.tier !== "starter" && skill.tier !== "bridge" && skill.tier !== "capstone") {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] has invalid tier "${String(skill.tier || "")}".`);
          }
          if (!Number.isFinite(Number(skill.requiredLevel)) || Number(skill.requiredLevel) <= 0) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing a valid requiredLevel.`);
          }
          if (!Number.isFinite(Number(skill.cost)) || Number(skill.cost) < 0) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing a valid cost.`);
          }
          if (!Number.isFinite(Number(skill.cooldown)) || Number(skill.cooldown) < 0) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing a valid cooldown.`);
          }
          if (!String(skill.summary || "").trim()) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing summary.`);
          }
          if (!String(skill.exactText || "").trim()) {
            pushError(errors, `classProgressionCatalog.${classId}.trees[${index}].skills[${skillIndex}] is missing exactText.`);
          }
        });
      });

      if (progression?.starterSkillId && !classSkillIds.has(progression.starterSkillId)) {
        pushError(errors, `classProgressionCatalog.${classId}.starterSkillId references missing skill "${progression.starterSkillId}".`);
      } else if (progression?.starterSkillId && !hasStarterSkill) {
        pushError(errors, `classProgressionCatalog.${classId}.starterSkillId does not resolve to a slot-1 starter skill.`);
      }
    });

    Object.entries(content?.classStarterDecks || {}).forEach(([classId, cardIds]: [string, string[]]) => {
      validateCardIdList(cardIds, cardCatalog, `classStarterDecks.${classId}`, errors);
    });

    Object.entries(content?.classRewardPools || {}).forEach(([classId, tiers]: [string, ClassRewardTiers]) => {
      validateCardIdList(tiers.early, cardCatalog, `classRewardPools.${classId}.early`, errors);
      validateCardIdList(tiers.mid, cardCatalog, `classRewardPools.${classId}.mid`, errors);
      validateCardIdList(tiers.late, cardCatalog, `classRewardPools.${classId}.late`, errors);
    });

    Object.entries(content?.rewardPools?.profileCards || {}).forEach(([profileId, cardIds]: [string, string[]]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.profileCards.${profileId}`, errors);
    });
    Object.entries(content?.rewardPools?.zoneRoleCards || {}).forEach(([zoneRole, cardIds]: [string, string[]]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.zoneRoleCards.${zoneRole}`, errors);
    });
    validateCardIdList(content?.rewardPools?.bossCards, cardCatalog, "rewardPools.bossCards", errors);
  }

  function validateEnemyCatalog(enemyCatalog: Record<string, EnemyTemplate>, eliteAffixesByAct: Record<number, Set<string>>, errors: string[]) {
    (Object.values(enemyCatalog) as EnemyTemplate[]).forEach((template) => {
      if (!template?.templateId) {
        pushError(errors, "Enemy catalog contains a template without a templateId.");
        return;
      }
      if (!Array.isArray(template.intents) || template.intents.length === 0) {
        pushError(errors, `Enemy template "${template.templateId}" is missing intents.`);
        return;
      }
      template.intents.forEach((intent: EnemyIntent, index: number) => {
        if (!ALLOWED_INTENT_KINDS.has(intent?.kind)) {
          pushError(errors, `Enemy template "${template.templateId}" has unsupported intent "${intent?.kind}" at index ${index}.`);
        }
      });

      const affixes = Array.isArray(template.affixes) ? template.affixes : [];
      affixes.forEach((affixId: string, index: number) => {
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
        affixes.forEach((affixId: string) => eliteAffixesByAct[actNumber].add(affixId));
      }
    });
  }

  function validateEncounterCatalog(encounterCatalog: Record<string, EncounterDefinition>, enemyCatalog: Record<string, EnemyTemplate>, errors: string[]) {
    (Object.values(encounterCatalog) as EncounterDefinition[]).forEach((encounter) => {
      if (!Array.isArray(encounter?.enemies) || encounter.enemies.length === 0) {
        pushError(errors, `Encounter "${encounter?.id || "unknown"}" does not include any enemies.`);
        return;
      }
      (Array.isArray(encounter?.modifiers) ? encounter.modifiers : []).forEach((modifier: EncounterModifier, index: number) => {
        if (!ALLOWED_ENCOUNTER_MODIFIERS.has(modifier?.kind)) {
          pushError(errors, `Encounter "${encounter.id}" has unsupported modifier "${modifier?.kind || ""}" at index ${index}.`);
        }
        if (!Number.isFinite(Number(modifier?.value))) {
          pushError(errors, `Encounter "${encounter.id}" modifier[${index}] must define a numeric value.`);
        }
      });
      encounter.enemies.forEach((enemyEntry: EncounterEnemyEntry, index: number) => {
        if (!enemyCatalog?.[enemyEntry?.templateId]) {
          pushError(
            errors,
            `Encounter "${encounter.id}" enemy[${index}] references missing template "${enemyEntry?.templateId}".`
          );
        }
      });
    });
  }

  function validateGeneratedActEncounters(content: GameContent, encounterCatalog: Record<string, EncounterDefinition>, eliteAffixesByAct: Record<number, Set<string>>, errors: string[]) {
    Object.entries(content?.generatedActEncounterIds || {}).forEach(([actNumber, groups]: [string, unknown]) => {
      Object.entries((groups || {}) as Record<string, string[]>).forEach(([groupName, encounterIds]: [string, string[]]) => {
        if (!Array.isArray(encounterIds) || encounterIds.length === 0) {
          pushError(errors, `generatedActEncounterIds.${actNumber}.${groupName} is empty.`);
          return;
        }
        const minimumCount = (MIN_GENERATED_GROUP_SIZES as Record<string, number>)[groupName];
        if (minimumCount && encounterIds.length < minimumCount) {
          pushError(errors, `generatedActEncounterIds.${actNumber}.${groupName} must contain at least ${minimumCount} encounters.`);
        }
        encounterIds.forEach((encounterId: string, index: number) => {
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
          .flatMap((encounter: EncounterDefinition) => (Array.isArray(encounter?.modifiers) ? encounter.modifiers : []))
          .map((modifier: EncounterModifier) => modifier?.kind)
          .filter((modifierKind: string) => typeof modifierKind === "string" && modifierKind)
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

  function validateConsequenceEncounterPackages(actNumber: string, content: GameContent, encounterCatalog: Record<string, EncounterDefinition>, knownWorldFlagIds: Set<string>, errors: string[]) {
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

    encounterPackages.forEach((encounterPackage: ConsequenceEncounterPackageDefinition, index: number) => {
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
        (roleCounts as Record<string, number>)[encounterPackage.zoneRole] += 1;
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

    for (const [role, minCount] of Object.entries(MIN_CONSEQUENCE_PACKAGES_PER_ROLE)) {
      if ((roleCounts[role as keyof typeof roleCounts] || 0) < minCount) {
        pushError(errors, `consequenceEncounterPackages.${actNumber} must include at least ${minCount} packages for zoneRole "${role}".`);
      }
    }
  }

  function validateConsequenceRewardPackages(actNumber: string, content: GameContent, knownWorldFlagIds: Set<string>, errors: string[]) {
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

    rewardPackages.forEach((rewardPackage: ConsequenceRewardPackageDefinition, index: number) => {
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
        (rewardRoleCounts as Record<string, number>)[rewardPackage.zoneRole] += 1;
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
        const grantValues = ["gold", "xp", "potions"].map((grantKey: string) => {
          const grantValue = Number.parseInt(String((rewardPackage.grants as unknown as Record<string, unknown>)?.[grantKey] || 0), 10);
          if (!Number.isFinite(grantValue) || grantValue < 0) {
            pushError(errors, `${packageLabel}.grants.${grantKey} must be a non-negative integer.`);
          }
          return Math.max(0, Number.isFinite(grantValue) ? grantValue : 0);
        });
        if (grantValues.every((grantValue: number) => grantValue === 0)) {
          pushError(errors, `${packageLabel}.grants must define at least one positive reward bonus.`);
        }
      }

      validateStringIdList(rewardPackage?.bonusLines, `${packageLabel}.bonusLines`, errors);
    });

    for (const [role, minCount] of Object.entries(MIN_CONSEQUENCE_PACKAGES_PER_ROLE)) {
      if ((rewardRoleCounts[role as keyof typeof rewardRoleCounts] || 0) < minCount) {
        pushError(errors, `consequenceRewardPackages.${actNumber} must include at least ${minCount} packages for zoneRole "${role}".`);
      }
    }
  }

  runtimeWindow.__ROUGE_CV_RUNTIME_VALIDATORS = {
    pushError, collectKnownWorldFlagIds, validateCardAndClassContent,
    validateEnemyCatalog, validateEncounterCatalog, validateGeneratedActEncounters,
    validateConsequenceEncounterPackages, validateConsequenceRewardPackages,
  };
})();
