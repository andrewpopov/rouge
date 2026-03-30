(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectCulminationPathStates,
    collectLegacyPathStates,
    collectOpportunityChoiceStates,
    collectReckoningPathStates,
    collectRelayPathStates,
    collectReservePathStates,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
  } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const {
    pushError,
    validateKnownStringIds,
    validateOpportunityShell,
    validateRequiredNodeReference,
    validateReserveStyleOpportunityVariants,
    validateRewardDefinition,
    validateStringIdList,
  } = runtimeWindow.__ROUGE_CVWO_HELPERS;

  const MIN_RESERVE_OPPORTUNITY_VARIANTS = 3;
  const MIN_RELAY_OPPORTUNITY_VARIANTS = 3;
  const MIN_CULMINATION_OPPORTUNITY_VARIANTS = 3;
  const MIN_LEGACY_OPPORTUNITY_VARIANTS = 3;
  const MIN_RECKONING_OPPORTUNITY_VARIANTS = 3;

  function validateReserveOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const reserveFlagIds = new Set(reservePathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));

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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.crossroadInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
        if (influenceCounts.crossroadInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one late-route variant.`);
        }
      },
    });
  }

  function validateRelayOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const relayFlagIds = new Set(relayPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));

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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.reserveInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
        if (influenceCounts.reserveInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one reserve-influenced variant.`);
        }
      },
    });
  }

  function validateCulminationOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const culminationFlagIds = new Set(culminationPathStates.flatMap((pathState: ContentValidatorActPathState) => pathState.flagIds));
    const unconditionalVariantCount = culminationOpportunityDefinition.variants.filter((variantDefinition: OpportunityNodeVariantDefinition) => {
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

    culminationOpportunityDefinition.variants.forEach((variantDefinition: OpportunityNodeVariantDefinition, index: number) => {
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

    culminationPathStates.forEach((pathState: ContentValidatorActPathState) => {
      const hasMatchingVariant = culminationOpportunityDefinition.variants.some((variantDefinition: OpportunityNodeVariantDefinition) => {
        return doesVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasMatchingVariant) {
        pushError(errors, `${label} has no variant covering authored culmination path "${pathState.label}".`);
      }
    });

    culminationOpportunityDefinition.variants.forEach((variantDefinition: OpportunityNodeVariantDefinition, index: number) => {
      const hasReachablePath = culminationPathStates.some((pathState: ContentValidatorActPathState) => {
        return doesVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasReachablePath) {
        pushError(errors, `${label}.variants[${index}] is unreachable from any authored culmination path.`);
      }
    });

    culminationPathStates.forEach((pathState: ContentValidatorActPathState) => {
      const matchingVariants = culminationOpportunityDefinition.variants
        .map((variantDefinition: OpportunityNodeVariantDefinition, index: number) => ({
          index,
          specificity: getOpportunityVariantSpecificity(variantDefinition),
          matches: doesVariantMatchPath(variantDefinition, pathState),
        }))
        .filter((entry: { index: number; specificity: number; matches: boolean }) => entry.matches);
      const maxSpecificity = matchingVariants.reduce((maxValue: number, entry: { index: number; specificity: number; matches: boolean }) => Math.max(maxValue, entry.specificity), 0);
      const mostSpecificMatches = matchingVariants.filter((entry: { index: number; specificity: number; matches: boolean }) => entry.specificity === maxSpecificity);
      if (mostSpecificMatches.length > 1) {
        pushError(
          errors,
          `${label} has ambiguous variants for authored culmination path "${pathState.label}": ${mostSpecificMatches
            .map((entry: { index: number; specificity: number; matches: boolean }) => `variants[${entry.index}]`)
            .join(", ")}.`
        );
      }
    });
  }

  function validateLegacyOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const legacyFlagIds = new Set(legacyPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));

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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        if (requiredFlagIds.length > 0) {
          influenceCounts.culminationInfluencedVariantCount += 1;
        }
      },
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
        if (influenceCounts.culminationInfluencedVariantCount === 0) {
          pushError(validationErrors, `${label} must include at least one culmination-influenced variant.`);
        }
      },
    });
  }

  function validateReckoningOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const reckoningFlagIds = new Set(reckoningPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));
    const reserveFlagIds = new Set(
      collectOpportunityChoiceStates(reserveOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        const hasReserveFlag = requiredFlagIds.some((flagId: string) => reserveFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId: string) => culminationFlagIds.has(flagId));

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
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
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

  runtimeWindow.__ROUGE_CVWO_FAMILIES_A = {
    validateReserveOpportunityFamily,
    validateRelayOpportunityFamily,
    validateCulminationOpportunityFamily,
    validateLegacyOpportunityFamily,
    validateReckoningOpportunityFamily,
  };
})();
