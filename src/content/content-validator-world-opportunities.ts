/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & {
    ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES?: ContentValidatorWorldOpportunitiesApi;
  };
  const {
    collectAccordPathStates,
    collectCovenantPathStates,
    collectCulminationPathStates,
    collectDetourPathStates,
    collectEscalationPathStates,
    collectLegacyPathStates,
    collectOpportunityChoiceStates,
    collectReckoningPathStates,
    collectRecoveryPathStates,
    collectRelayPathStates,
    collectReservePathStates,
    doesReserveOpportunityVariantMatchPath,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
    getReserveOpportunityVariantRequirementSignature,
    getReserveOpportunityVariantSpecificity,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const MIN_RESERVE_OPPORTUNITY_VARIANTS = 3;
  const MIN_RELAY_OPPORTUNITY_VARIANTS = 3;
  const MIN_CULMINATION_OPPORTUNITY_VARIANTS = 3;
  const MIN_LEGACY_OPPORTUNITY_VARIANTS = 3;
  const MIN_RECKONING_OPPORTUNITY_VARIANTS = 3;
  const MIN_RECOVERY_OPPORTUNITY_VARIANTS = 3;
  const MIN_ACCORD_OPPORTUNITY_VARIANTS = 3;
  const MIN_COVENANT_OPPORTUNITY_VARIANTS = 3;
  const MIN_DETOUR_OPPORTUNITY_VARIANTS = 3;
  const MIN_ESCALATION_OPPORTUNITY_VARIANTS = 3;

  function pushError(errors, message) { errors.push(message); }

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

  function validateGrants(grants, label, errors) {
    ["gold", "xp", "potions"].forEach((field) => {
      if (!Number.isFinite(Number(grants?.[field]))) {
        pushError(errors, `${label}.${field} must be numeric.`);
      }
    });
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

  function validateOpportunityShell(definition, label, errors) {
    if (!definition?.zoneTitle) {
      pushError(errors, `${label} is missing a zoneTitle.`);
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
  }

  function validateRequiredNodeReference(definition, label, fieldName, expectedDefinition, referenceLabel, errors) {
    if (!definition?.[fieldName]) {
      pushError(errors, `${label} is missing ${fieldName}.`);
      return;
    }
    if (expectedDefinition?.id && definition[fieldName] !== expectedDefinition.id) {
      pushError(
        errors,
        `${label} requires ${referenceLabel} "${definition[fieldName]}" but act ${referenceLabel} is "${expectedDefinition.id}".`
      );
    }
  }

  function validateReserveStyleOpportunityVariants(options) {
    const {
      definition,
      errors,
      knownFlagIds,
      label,
      linkedQuestId,
      makeInfluenceCounts,
      minVariants,
      pathKindLabel,
      pathStates,
      recordInfluenceCounts,
      validateInfluenceCounts,
    } = options;

    if (!Array.isArray(definition?.variants) || definition.variants.length === 0) {
      pushError(errors, `${label} is missing variants.`);
      return;
    }

    if (definition.variants.length < minVariants) {
      pushError(errors, `${label} must define at least ${minVariants} variants.`);
    }

    const seenVariantIds = new Set();
    const seenRequirementSignatures = new Map();
    const influenceCounts = makeInfluenceCounts();
    const unconditionalVariantCount = definition.variants.filter((variantDefinition) => {
      return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
    }).length;

    if (unconditionalVariantCount > 1) {
      pushError(errors, `${label} has multiple unconditional variants.`);
    }

    definition.variants.forEach((variantDefinition, index) => {
      const requiredFlagIds = Array.isArray(variantDefinition?.requiresFlagIds) ? variantDefinition.requiresFlagIds : [];
      recordInfluenceCounts(influenceCounts, requiredFlagIds);

      if (variantDefinition?.id) {
        if (seenVariantIds.has(variantDefinition.id)) {
          pushError(errors, `${label} reuses variant id "${variantDefinition.id}".`);
        }
        seenVariantIds.add(variantDefinition.id);
      }

      const requirementSignature = getReserveOpportunityVariantRequirementSignature(variantDefinition);
      const existingVariantId = seenRequirementSignatures.get(requirementSignature);
      if (existingVariantId) {
        pushError(errors, `${label}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`);
      } else if (variantDefinition?.id) {
        seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
      } else {
        seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
      }

      validateStringIdList(variantDefinition.requiresFlagIds, `${label}.variants[${index}].requiresFlagIds`, errors);
      validateKnownStringIds(
        variantDefinition.requiresFlagIds,
        knownFlagIds,
        `${label}.variants[${index}].requiresFlagIds`,
        errors,
        "flag"
      );
      validateRewardDefinition(
        {
          ...variantDefinition,
          id: definition.id,
        },
        `${label}.variants[${index}]`,
        "opportunity",
        errors,
        linkedQuestId
      );
    });

    validateInfluenceCounts(influenceCounts, errors);

    pathStates.forEach((pathState) => {
      const hasMatchingVariant = definition.variants.some((variantDefinition) => {
        return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasMatchingVariant) {
        pushError(errors, `${label} has no variant covering authored ${pathKindLabel} path "${pathState.label}".`);
      }
    });

    definition.variants.forEach((variantDefinition, index) => {
      const hasReachablePath = pathStates.some((pathState) => {
        return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasReachablePath) {
        pushError(errors, `${label}.variants[${index}] is unreachable from any authored ${pathKindLabel} path.`);
      }
    });

    pathStates.forEach((pathState) => {
      const matchingVariants = definition.variants
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
          `${label} has ambiguous variants for authored ${pathKindLabel} path "${pathState.label}": ${mostSpecificMatches
            .map((entry) => `variants[${entry.index}]`)
            .join(", ")}.`
        );
      }
    });
  }

  function validateReserveOpportunityFamily(options) {
    const {
      actKey,
      crossroadOpportunityDefinition,
      errors,
      opportunityDefinition,
      reserveOpportunityDefinition,
      shrineOpportunityDefinition,
      questDefinition,
    } = options;
    const label = `worldNodes.reserveOpportunities.${actKey}`;

    if (!reserveOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a reserve opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(reserveOpportunityDefinition, label, errors);
    validateRequiredNodeReference(reserveOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(reserveOpportunityDefinition, label, "requiresOpportunityId", opportunityDefinition, "opportunity", errors);
    validateRequiredNodeReference(
      reserveOpportunityDefinition,
      label,
      "requiresShrineOpportunityId",
      shrineOpportunityDefinition,
      "shrine opportunity",
      errors
    );
    validateRequiredNodeReference(
      reserveOpportunityDefinition,
      label,
      "requiresCrossroadOpportunityId",
      crossroadOpportunityDefinition,
      "crossroad opportunity",
      errors
    );

    const reservePathStates = collectReservePathStates(
      opportunityDefinition,
      shrineOpportunityDefinition,
      crossroadOpportunityDefinition
    );
    const reserveFlagIds = new Set(reservePathStates.flatMap((pathState) => pathState.flagIds));

    validateReserveStyleOpportunityVariants({
      definition: reserveOpportunityDefinition,
      errors,
      knownFlagIds: reserveFlagIds,
      label,
      linkedQuestId: reserveOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return { crossroadInfluencedVariantCount: 0 };
      },
      minVariants: MIN_RESERVE_OPPORTUNITY_VARIANTS,
      pathKindLabel: "reserve",
      pathStates: reservePathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.crossroadInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.crossroadInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one late-route variant.`);
        }
      },
    });
  }

  function validateRelayOpportunityFamily(options) {
    const { actKey, errors, relayOpportunityDefinition, reserveOpportunityDefinition, questDefinition } = options;
    const label = `worldNodes.relayOpportunities.${actKey}`;

    if (!relayOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a relay opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(relayOpportunityDefinition, label, errors);
    validateRequiredNodeReference(relayOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      relayOpportunityDefinition,
      label,
      "requiresReserveOpportunityId",
      reserveOpportunityDefinition,
      "reserve opportunity",
      errors
    );

    const relayPathStates = collectRelayPathStates(reserveOpportunityDefinition);
    const relayFlagIds = new Set(relayPathStates.flatMap((pathState) => pathState.flagIds));

    validateReserveStyleOpportunityVariants({
      definition: relayOpportunityDefinition,
      errors,
      knownFlagIds: relayFlagIds,
      label,
      linkedQuestId: relayOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return { reserveInfluencedVariantCount: 0 };
      },
      minVariants: MIN_RELAY_OPPORTUNITY_VARIANTS,
      pathKindLabel: "relay",
      pathStates: relayPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.reserveInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.reserveInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reserve-influenced variant.`);
        }
      },
    });
  }

  function validateCulminationOpportunityFamily(options) {
    const {
      actKey,
      culminationOpportunityDefinition,
      errors,
      questDefinition,
      referenceState,
      relayOpportunityDefinition,
      shrineDefinition,
    } = options;
    const label = `worldNodes.culminationOpportunities.${actKey}`;

    if (!culminationOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a culmination opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(culminationOpportunityDefinition, label, errors);
    validateRequiredNodeReference(culminationOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      culminationOpportunityDefinition,
      label,
      "requiresRelayOpportunityId",
      relayOpportunityDefinition,
      "relay opportunity",
      errors
    );

    if (
      !Array.isArray(culminationOpportunityDefinition.variants) ||
      culminationOpportunityDefinition.variants.length === 0
    ) {
      pushError(errors, `${label} is missing variants.`);
      return;
    }

    if (culminationOpportunityDefinition.variants.length < MIN_CULMINATION_OPPORTUNITY_VARIANTS) {
      pushError(errors, `${label} must define at least ${MIN_CULMINATION_OPPORTUNITY_VARIANTS} variants.`);
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
      pushError(errors, `${label} has multiple unconditional variants.`);
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
          pushError(errors, `${label} reuses variant id "${variantDefinition.id}".`);
        }
        seenVariantIds.add(variantDefinition.id);
      }
      const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
      const existingVariantId = seenRequirementSignatures.get(requirementSignature);
      if (existingVariantId) {
        pushError(errors, `${label}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`);
      } else if (variantDefinition?.id) {
        seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
      } else {
        seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
      }
      validateStringIdList(
        variantDefinition.requiresPrimaryOutcomeIds,
        `${label}.variants[${index}].requiresPrimaryOutcomeIds`,
        errors
      );
      validateStringIdList(
        variantDefinition.requiresFollowUpOutcomeIds,
        `${label}.variants[${index}].requiresFollowUpOutcomeIds`,
        errors
      );
      validateStringIdList(
        variantDefinition.requiresConsequenceIds,
        `${label}.variants[${index}].requiresConsequenceIds`,
        errors
      );
      validateStringIdList(variantDefinition.requiresFlagIds, `${label}.variants[${index}].requiresFlagIds`, errors);
      validateStringIdList(
        variantDefinition.requiresMercenaryIds,
        `${label}.variants[${index}].requiresMercenaryIds`,
        errors
      );
      validateKnownStringIds(
        variantDefinition.requiresPrimaryOutcomeIds,
        referenceState.primaryOutcomeIds,
        `${label}.variants[${index}].requiresPrimaryOutcomeIds`,
        errors,
        "primary quest outcome"
      );
      validateKnownStringIds(
        variantDefinition.requiresFollowUpOutcomeIds,
        referenceState.followUpOutcomeIds,
        `${label}.variants[${index}].requiresFollowUpOutcomeIds`,
        errors,
        "follow-up outcome"
      );
      validateKnownStringIds(
        variantDefinition.requiresConsequenceIds,
        referenceState.consequenceIds,
        `${label}.variants[${index}].requiresConsequenceIds`,
        errors,
        "quest consequence"
      );
      validateKnownStringIds(
        variantDefinition.requiresFlagIds,
        culminationFlagIds,
        `${label}.variants[${index}].requiresFlagIds`,
        errors,
        "flag"
      );
      validateKnownStringIds(
        variantDefinition.requiresMercenaryIds,
        knownMercenaryIds,
        `${label}.variants[${index}].requiresMercenaryIds`,
        errors,
        "mercenary"
      );
      validateRewardDefinition(
        {
          ...variantDefinition,
          id: culminationOpportunityDefinition.id,
        },
        `${label}.variants[${index}]`,
        "opportunity",
        errors,
        culminationOpportunityDefinition.requiresQuestId
      );
    });

    if (relayInfluencedVariantCount === 0) {
      pushError(errors, `${label} must include at least one relay-influenced variant.`);
    }
    if (earlyChainVariantCount === 0) {
      pushError(errors, `${label} must include at least one earlier-chain variant.`);
    }

    culminationPathStates.forEach((pathState) => {
      const hasMatchingVariant = culminationOpportunityDefinition.variants.some((variantDefinition) => {
        return doesVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasMatchingVariant) {
        pushError(errors, `${label} has no variant covering authored culmination path "${pathState.label}".`);
      }
    });

    culminationOpportunityDefinition.variants.forEach((variantDefinition, index) => {
      const hasReachablePath = culminationPathStates.some((pathState) => {
        return doesVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasReachablePath) {
        pushError(errors, `${label}.variants[${index}] is unreachable from any authored culmination path.`);
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
          `${label} has ambiguous variants for authored culmination path "${pathState.label}": ${mostSpecificMatches
            .map((entry) => `variants[${entry.index}]`)
            .join(", ")}.`
        );
      }
    });
  }

  function validateLegacyOpportunityFamily(options) {
    const { actKey, culminationOpportunityDefinition, errors, legacyOpportunityDefinition, questDefinition } = options;
    const label = `worldNodes.legacyOpportunities.${actKey}`;

    if (!legacyOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a legacy opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(legacyOpportunityDefinition, label, errors);
    validateRequiredNodeReference(legacyOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      legacyOpportunityDefinition,
      label,
      "requiresCulminationOpportunityId",
      culminationOpportunityDefinition,
      "culmination opportunity",
      errors
    );

    const legacyPathStates = collectLegacyPathStates(culminationOpportunityDefinition);
    const legacyFlagIds = new Set(legacyPathStates.flatMap((pathState) => pathState.flagIds));

    validateReserveStyleOpportunityVariants({
      definition: legacyOpportunityDefinition,
      errors,
      knownFlagIds: legacyFlagIds,
      label,
      linkedQuestId: legacyOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return { culminationInfluencedVariantCount: 0 };
      },
      minVariants: MIN_LEGACY_OPPORTUNITY_VARIANTS,
      pathKindLabel: "legacy",
      pathStates: legacyPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.culminationInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.culminationInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one culmination-influenced variant.`);
        }
      },
    });
  }

  function validateReckoningOpportunityFamily(options) {
    const {
      actKey,
      culminationOpportunityDefinition,
      errors,
      questDefinition,
      reckoningOpportunityDefinition,
      reserveOpportunityDefinition,
    } = options;
    const label = `worldNodes.reckoningOpportunities.${actKey}`;

    if (!reckoningOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a reckoning opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(reckoningOpportunityDefinition, label, errors);
    validateRequiredNodeReference(reckoningOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      reckoningOpportunityDefinition,
      label,
      "requiresReserveOpportunityId",
      reserveOpportunityDefinition,
      "reserve opportunity",
      errors
    );
    validateRequiredNodeReference(
      reckoningOpportunityDefinition,
      label,
      "requiresCulminationOpportunityId",
      culminationOpportunityDefinition,
      "culmination opportunity",
      errors
    );

    const reckoningPathStates = collectReckoningPathStates(culminationOpportunityDefinition, reserveOpportunityDefinition);
    const reckoningFlagIds = new Set(reckoningPathStates.flatMap((pathState) => pathState.flagIds));
    const reserveFlagIds = new Set(
      collectOpportunityChoiceStates(reserveOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: reckoningOpportunityDefinition,
      errors,
      knownFlagIds: reckoningFlagIds,
      label,
      linkedQuestId: reckoningOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          combinedLateVariantCount: 0,
          culminationInfluencedVariantCount: 0,
          reserveInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_RECKONING_OPPORTUNITY_VARIANTS,
      pathKindLabel: "reckoning",
      pathStates: reckoningPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasReserveFlag = requiredFlagIds.some((flagId) => reserveFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

        if (hasReserveFlag) {
          influenceCounts.reserveInfluencedVariantCount += 1;
        }
        if (hasCulminationFlag) {
          influenceCounts.culminationInfluencedVariantCount += 1;
        }
        if (hasReserveFlag && hasCulminationFlag) {
          influenceCounts.combinedLateVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.reserveInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reserve-influenced variant.`);
        }
        if (influenceCounts.culminationInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one culmination-influenced variant.`);
        }
        if (influenceCounts.combinedLateVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reserve-and-culmination influenced variant.`);
        }
      },
    });
  }

  function validateRecoveryOpportunityFamily(options) {
    const {
      actKey,
      culminationOpportunityDefinition,
      errors,
      questDefinition,
      recoveryOpportunityDefinition,
      shrineOpportunityDefinition,
    } = options;
    const label = `worldNodes.recoveryOpportunities.${actKey}`;

    if (!recoveryOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a recovery opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(recoveryOpportunityDefinition, label, errors);
    validateRequiredNodeReference(recoveryOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      recoveryOpportunityDefinition,
      label,
      "requiresShrineOpportunityId",
      shrineOpportunityDefinition,
      "shrine opportunity",
      errors
    );
    validateRequiredNodeReference(
      recoveryOpportunityDefinition,
      label,
      "requiresCulminationOpportunityId",
      culminationOpportunityDefinition,
      "culmination opportunity",
      errors
    );

    const recoveryPathStates = collectRecoveryPathStates(culminationOpportunityDefinition, shrineOpportunityDefinition);
    const recoveryFlagIds = new Set(recoveryPathStates.flatMap((pathState) => pathState.flagIds));
    const shrineFlagIds = new Set(
      collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: recoveryOpportunityDefinition,
      errors,
      knownFlagIds: recoveryFlagIds,
      label,
      linkedQuestId: recoveryOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          combinedLateVariantCount: 0,
          culminationInfluencedVariantCount: 0,
          shrineInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_RECOVERY_OPPORTUNITY_VARIANTS,
      pathKindLabel: "recovery",
      pathStates: recoveryPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasShrineFlag = requiredFlagIds.some((flagId) => shrineFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

        if (hasShrineFlag) {
          influenceCounts.shrineInfluencedVariantCount += 1;
        }
        if (hasCulminationFlag) {
          influenceCounts.culminationInfluencedVariantCount += 1;
        }
        if (hasShrineFlag && hasCulminationFlag) {
          influenceCounts.combinedLateVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.shrineInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one shrine-influenced variant.`);
        }
        if (influenceCounts.culminationInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one culmination-influenced variant.`);
        }
        if (influenceCounts.combinedLateVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one shrine-and-culmination influenced variant.`);
        }
      },
    });
  }

  function validateAccordOpportunityFamily(options) {
    const {
      actKey,
      accordOpportunityDefinition,
      crossroadOpportunityDefinition,
      culminationOpportunityDefinition,
      errors,
      questDefinition,
      shrineOpportunityDefinition,
    } = options;
    const label = `worldNodes.accordOpportunities.${actKey}`;

    if (!accordOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing an accord opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(accordOpportunityDefinition, label, errors);
    validateRequiredNodeReference(accordOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      accordOpportunityDefinition,
      label,
      "requiresShrineOpportunityId",
      shrineOpportunityDefinition,
      "shrine opportunity",
      errors
    );
    validateRequiredNodeReference(
      accordOpportunityDefinition,
      label,
      "requiresCrossroadOpportunityId",
      crossroadOpportunityDefinition,
      "crossroad opportunity",
      errors
    );
    validateRequiredNodeReference(
      accordOpportunityDefinition,
      label,
      "requiresCulminationOpportunityId",
      culminationOpportunityDefinition,
      "culmination opportunity",
      errors
    );

    const accordPathStates = collectAccordPathStates(
      culminationOpportunityDefinition,
      shrineOpportunityDefinition,
      crossroadOpportunityDefinition
    );
    const accordFlagIds = new Set(accordPathStates.flatMap((pathState) => pathState.flagIds));
    const shrineFlagIds = new Set(
      collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const crossroadFlagIds = new Set(
      collectOpportunityChoiceStates(crossroadOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: accordOpportunityDefinition,
      errors,
      knownFlagIds: accordFlagIds,
      label,
      linkedQuestId: accordOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          combinedLateVariantCount: 0,
          combinedRouteVariantCount: 0,
          crossroadInfluencedVariantCount: 0,
          culminationInfluencedVariantCount: 0,
          shrineInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_ACCORD_OPPORTUNITY_VARIANTS,
      pathKindLabel: "accord",
      pathStates: accordPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasShrineFlag = requiredFlagIds.some((flagId) => shrineFlagIds.has(flagId));
        const hasCrossroadFlag = requiredFlagIds.some((flagId) => crossroadFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId) => culminationFlagIds.has(flagId));

        if (hasShrineFlag) {
          influenceCounts.shrineInfluencedVariantCount += 1;
        }
        if (hasCrossroadFlag) {
          influenceCounts.crossroadInfluencedVariantCount += 1;
        }
        if (hasCulminationFlag) {
          influenceCounts.culminationInfluencedVariantCount += 1;
        }
        if (hasShrineFlag && hasCrossroadFlag) {
          influenceCounts.combinedRouteVariantCount += 1;
        }
        if (hasShrineFlag && hasCrossroadFlag && hasCulminationFlag) {
          influenceCounts.combinedLateVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.shrineInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one shrine-influenced variant.`);
        }
        if (influenceCounts.crossroadInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one crossroad-influenced variant.`);
        }
        if (influenceCounts.culminationInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one culmination-influenced variant.`);
        }
        if (influenceCounts.combinedRouteVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one shrine-and-crossroad influenced variant.`);
        }
        if (influenceCounts.combinedLateVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one shrine-and-crossroad-and-culmination influenced variant.`);
        }
      },
    });
  }

  function validateCovenantOpportunityFamily(options) {
    const {
      accordOpportunityDefinition,
      actKey,
      covenantOpportunityDefinition,
      errors,
      legacyOpportunityDefinition,
      questDefinition,
      reckoningOpportunityDefinition,
      recoveryOpportunityDefinition,
    } = options;
    const label = `worldNodes.covenantOpportunities.${actKey}`;

    if (!covenantOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a covenant opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(covenantOpportunityDefinition, label, errors);
    validateRequiredNodeReference(covenantOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      covenantOpportunityDefinition,
      label,
      "requiresLegacyOpportunityId",
      legacyOpportunityDefinition,
      "legacy opportunity",
      errors
    );
    validateRequiredNodeReference(
      covenantOpportunityDefinition,
      label,
      "requiresReckoningOpportunityId",
      reckoningOpportunityDefinition,
      "reckoning opportunity",
      errors
    );
    validateRequiredNodeReference(
      covenantOpportunityDefinition,
      label,
      "requiresRecoveryOpportunityId",
      recoveryOpportunityDefinition,
      "recovery opportunity",
      errors
    );
    validateRequiredNodeReference(
      covenantOpportunityDefinition,
      label,
      "requiresAccordOpportunityId",
      accordOpportunityDefinition,
      "accord opportunity",
      errors
    );

    const covenantPathStates = collectCovenantPathStates(
      legacyOpportunityDefinition,
      reckoningOpportunityDefinition,
      recoveryOpportunityDefinition,
      accordOpportunityDefinition
    );
    const covenantFlagIds = new Set(covenantPathStates.flatMap((pathState) => pathState.flagIds));
    const legacyFlagIds = new Set(
      collectOpportunityChoiceStates(legacyOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const reckoningFlagIds = new Set(
      collectOpportunityChoiceStates(reckoningOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const recoveryFlagIds = new Set(
      collectOpportunityChoiceStates(recoveryOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const accordFlagIds = new Set(
      collectOpportunityChoiceStates(accordOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: covenantOpportunityDefinition,
      errors,
      knownFlagIds: covenantFlagIds,
      label,
      linkedQuestId: covenantOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          accordInfluencedVariantCount: 0,
          allLateRoutesVariantCount: 0,
          legacyInfluencedVariantCount: 0,
          reckoningInfluencedVariantCount: 0,
          recoveryAndAccordVariantCount: 0,
          recoveryInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_COVENANT_OPPORTUNITY_VARIANTS,
      pathKindLabel: "covenant",
      pathStates: covenantPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasLegacyFlag = requiredFlagIds.some((flagId) => legacyFlagIds.has(flagId));
        const hasReckoningFlag = requiredFlagIds.some((flagId) => reckoningFlagIds.has(flagId));
        const hasRecoveryFlag = requiredFlagIds.some((flagId) => recoveryFlagIds.has(flagId));
        const hasAccordFlag = requiredFlagIds.some((flagId) => accordFlagIds.has(flagId));

        if (hasLegacyFlag) {
          influenceCounts.legacyInfluencedVariantCount += 1;
        }
        if (hasReckoningFlag) {
          influenceCounts.reckoningInfluencedVariantCount += 1;
        }
        if (hasRecoveryFlag) {
          influenceCounts.recoveryInfluencedVariantCount += 1;
        }
        if (hasAccordFlag) {
          influenceCounts.accordInfluencedVariantCount += 1;
        }
        if (hasRecoveryFlag && hasAccordFlag) {
          influenceCounts.recoveryAndAccordVariantCount += 1;
        }
        if (hasLegacyFlag && hasReckoningFlag && hasRecoveryFlag && hasAccordFlag) {
          influenceCounts.allLateRoutesVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.legacyInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one legacy-influenced variant.`);
        }
        if (influenceCounts.reckoningInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reckoning-influenced variant.`);
        }
        if (influenceCounts.recoveryInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one recovery-influenced variant.`);
        }
        if (influenceCounts.accordInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one accord-influenced variant.`);
        }
        if (influenceCounts.recoveryAndAccordVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one recovery-and-accord influenced variant.`);
        }
        if (influenceCounts.allLateRoutesVariantCount === 0) {
          pushError(
            validationErrors,
            `${label} must include at least one legacy-and-reckoning-and-recovery-and-accord influenced variant.`
          );
        }
      },
    });
  }

  function validateDetourOpportunityFamily(options) {
    const {
      accordOpportunityDefinition,
      actKey,
      covenantOpportunityDefinition,
      detourOpportunityDefinition,
      errors,
      questDefinition,
      recoveryOpportunityDefinition,
    } = options;
    const label = `worldNodes.detourOpportunities.${actKey}`;

    if (!detourOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a detour opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(detourOpportunityDefinition, label, errors);
    validateRequiredNodeReference(detourOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      detourOpportunityDefinition,
      label,
      "requiresRecoveryOpportunityId",
      recoveryOpportunityDefinition,
      "recovery opportunity",
      errors
    );
    validateRequiredNodeReference(
      detourOpportunityDefinition,
      label,
      "requiresAccordOpportunityId",
      accordOpportunityDefinition,
      "accord opportunity",
      errors
    );
    validateRequiredNodeReference(
      detourOpportunityDefinition,
      label,
      "requiresCovenantOpportunityId",
      covenantOpportunityDefinition,
      "covenant opportunity",
      errors
    );

    const detourPathStates = collectDetourPathStates(
      covenantOpportunityDefinition,
      recoveryOpportunityDefinition,
      accordOpportunityDefinition
    );
    const detourFlagIds = new Set(detourPathStates.flatMap((pathState) => pathState.flagIds));
    const recoveryFlagIds = new Set(
      collectOpportunityChoiceStates(recoveryOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const accordFlagIds = new Set(
      collectOpportunityChoiceStates(accordOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const covenantFlagIds = new Set(
      collectOpportunityChoiceStates(covenantOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: detourOpportunityDefinition,
      errors,
      knownFlagIds: detourFlagIds,
      label,
      linkedQuestId: detourOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          accordInfluencedVariantCount: 0,
          covenantInfluencedVariantCount: 0,
          fullDetourVariantCount: 0,
          recoveryAndAccordVariantCount: 0,
          recoveryInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_DETOUR_OPPORTUNITY_VARIANTS,
      pathKindLabel: "detour",
      pathStates: detourPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasRecoveryFlag = requiredFlagIds.some((flagId) => recoveryFlagIds.has(flagId));
        const hasAccordFlag = requiredFlagIds.some((flagId) => accordFlagIds.has(flagId));
        const hasCovenantFlag = requiredFlagIds.some((flagId) => covenantFlagIds.has(flagId));

        if (hasRecoveryFlag) {
          influenceCounts.recoveryInfluencedVariantCount += 1;
        }
        if (hasAccordFlag) {
          influenceCounts.accordInfluencedVariantCount += 1;
        }
        if (hasCovenantFlag) {
          influenceCounts.covenantInfluencedVariantCount += 1;
        }
        if (hasRecoveryFlag && hasAccordFlag) {
          influenceCounts.recoveryAndAccordVariantCount += 1;
        }
        if (hasRecoveryFlag && hasAccordFlag && hasCovenantFlag) {
          influenceCounts.fullDetourVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.recoveryInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one recovery-influenced variant.`);
        }
        if (influenceCounts.accordInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one accord-influenced variant.`);
        }
        if (influenceCounts.covenantInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one covenant-influenced variant.`);
        }
        if (influenceCounts.recoveryAndAccordVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one recovery-and-accord influenced variant.`);
        }
        if (influenceCounts.fullDetourVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one recovery-and-accord-and-covenant influenced variant.`);
        }
      },
    });
  }

  function validateEscalationOpportunityFamily(options) {
    const {
      actKey,
      covenantOpportunityDefinition,
      errors,
      escalationOpportunityDefinition,
      legacyOpportunityDefinition,
      questDefinition,
      reckoningOpportunityDefinition,
    } = options;
    const label = `worldNodes.escalationOpportunities.${actKey}`;

    if (!escalationOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing an escalation opportunity definition for act ${actKey}.`);
      return;
    }

    validateOpportunityShell(escalationOpportunityDefinition, label, errors);
    validateRequiredNodeReference(escalationOpportunityDefinition, label, "requiresQuestId", questDefinition, "quest", errors);
    validateRequiredNodeReference(
      escalationOpportunityDefinition,
      label,
      "requiresLegacyOpportunityId",
      legacyOpportunityDefinition,
      "legacy opportunity",
      errors
    );
    validateRequiredNodeReference(
      escalationOpportunityDefinition,
      label,
      "requiresReckoningOpportunityId",
      reckoningOpportunityDefinition,
      "reckoning opportunity",
      errors
    );
    validateRequiredNodeReference(
      escalationOpportunityDefinition,
      label,
      "requiresCovenantOpportunityId",
      covenantOpportunityDefinition,
      "covenant opportunity",
      errors
    );

    const escalationPathStates = collectEscalationPathStates(
      covenantOpportunityDefinition,
      legacyOpportunityDefinition,
      reckoningOpportunityDefinition
    );
    const escalationFlagIds = new Set(escalationPathStates.flatMap((pathState) => pathState.flagIds));
    const legacyFlagIds = new Set(
      collectOpportunityChoiceStates(legacyOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const reckoningFlagIds = new Set(
      collectOpportunityChoiceStates(reckoningOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );
    const covenantFlagIds = new Set(
      collectOpportunityChoiceStates(covenantOpportunityDefinition).flatMap((pathState) => pathState.flagIds)
    );

    validateReserveStyleOpportunityVariants({
      definition: escalationOpportunityDefinition,
      errors,
      knownFlagIds: escalationFlagIds,
      label,
      linkedQuestId: escalationOpportunityDefinition.requiresQuestId,
      makeInfluenceCounts() {
        return {
          covenantInfluencedVariantCount: 0,
          fullEscalationVariantCount: 0,
          legacyAndReckoningVariantCount: 0,
          legacyInfluencedVariantCount: 0,
          reckoningInfluencedVariantCount: 0,
        };
      },
      minVariants: MIN_ESCALATION_OPPORTUNITY_VARIANTS,
      pathKindLabel: "escalation",
      pathStates: escalationPathStates,
      recordInfluenceCounts(influenceCounts, requiredFlagIds) {
        const hasLegacyFlag = requiredFlagIds.some((flagId) => legacyFlagIds.has(flagId));
        const hasReckoningFlag = requiredFlagIds.some((flagId) => reckoningFlagIds.has(flagId));
        const hasCovenantFlag = requiredFlagIds.some((flagId) => covenantFlagIds.has(flagId));

        if (hasLegacyFlag) {
          influenceCounts.legacyInfluencedVariantCount += 1;
        }
        if (hasReckoningFlag) {
          influenceCounts.reckoningInfluencedVariantCount += 1;
        }
        if (hasCovenantFlag) {
          influenceCounts.covenantInfluencedVariantCount += 1;
        }
        if (hasLegacyFlag && hasReckoningFlag) {
          influenceCounts.legacyAndReckoningVariantCount += 1;
        }
        if (hasLegacyFlag && hasReckoningFlag && hasCovenantFlag) {
          influenceCounts.fullEscalationVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts, validationErrors) {
        if (influenceCounts.legacyInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one legacy-influenced variant.`);
        }
        if (influenceCounts.reckoningInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reckoning-influenced variant.`);
        }
        if (influenceCounts.covenantInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one covenant-influenced variant.`);
        }
        if (influenceCounts.legacyAndReckoningVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one legacy-and-reckoning influenced variant.`);
        }
        if (influenceCounts.fullEscalationVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one legacy-and-reckoning-and-covenant influenced variant.`);
        }
      },
    });
  }

  function validateLateRouteOpportunityFamilies(options) {
    validateReserveOpportunityFamily(options);
    validateRelayOpportunityFamily(options);
    validateCulminationOpportunityFamily(options);
    validateLegacyOpportunityFamily(options);
    validateReckoningOpportunityFamily(options);
    validateRecoveryOpportunityFamily(options);
    validateAccordOpportunityFamily(options);
    validateCovenantOpportunityFamily(options);
    validateDetourOpportunityFamily(options);
    validateEscalationOpportunityFamily(options);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES = {
    validateGrants,
    validateKnownStringIds,
    validateLateRouteOpportunityFamilies,
    validateRewardDefinition,
    validateStringIdList,
  };
})();
