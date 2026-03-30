(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectAccordPathStates,
    collectCovenantPathStates,
    collectOpportunityChoiceStates,
    collectRecoveryPathStates,
  } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const {
    pushError,
    validateOpportunityShell,
    validateRequiredNodeReference,
    validateReserveStyleOpportunityVariants,
  } = runtimeWindow.__ROUGE_CVWO_HELPERS;

  const MIN_RECOVERY_OPPORTUNITY_VARIANTS = 3;
  const MIN_ACCORD_OPPORTUNITY_VARIANTS = 3;
  const MIN_COVENANT_OPPORTUNITY_VARIANTS = 3;

  function validateRecoveryOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const recoveryFlagIds = new Set(recoveryPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));
    const shrineFlagIds = new Set(
      collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        const hasShrineFlag = requiredFlagIds.some((flagId: string) => shrineFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId: string) => culminationFlagIds.has(flagId));

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
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
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

  function validateAccordOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const accordFlagIds = new Set(accordPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));
    const shrineFlagIds = new Set(
      collectOpportunityChoiceStates(shrineOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const crossroadFlagIds = new Set(
      collectOpportunityChoiceStates(crossroadOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const culminationFlagIds = new Set(
      collectOpportunityChoiceStates(culminationOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        const hasShrineFlag = requiredFlagIds.some((flagId: string) => shrineFlagIds.has(flagId));
        const hasCrossroadFlag = requiredFlagIds.some((flagId: string) => crossroadFlagIds.has(flagId));
        const hasCulminationFlag = requiredFlagIds.some((flagId: string) => culminationFlagIds.has(flagId));

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
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
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

  function validateCovenantOpportunityFamily(options: ContentValidatorLateRouteOpportunityValidationArgs) {
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
    const covenantFlagIds = new Set(covenantPathStates.flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds));
    const legacyFlagIds = new Set(
      collectOpportunityChoiceStates(legacyOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const reckoningFlagIds = new Set(
      collectOpportunityChoiceStates(reckoningOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const recoveryFlagIds = new Set(
      collectOpportunityChoiceStates(recoveryOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
    );
    const accordFlagIds = new Set(
      collectOpportunityChoiceStates(accordOpportunityDefinition).flatMap((pathState: ContentValidatorFlagPathState) => pathState.flagIds)
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
      recordInfluenceCounts(influenceCounts: Record<string, number>, requiredFlagIds: string[]) {
        const hasLegacyFlag = requiredFlagIds.some((flagId: string) => legacyFlagIds.has(flagId));
        const hasReckoningFlag = requiredFlagIds.some((flagId: string) => reckoningFlagIds.has(flagId));
        const hasRecoveryFlag = requiredFlagIds.some((flagId: string) => recoveryFlagIds.has(flagId));
        const hasAccordFlag = requiredFlagIds.some((flagId: string) => accordFlagIds.has(flagId));

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
      validateInfluenceCounts(influenceCounts: Record<string, number>, validationErrors: string[]) {
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

  const {
    validateDetourOpportunityFamily,
    validateEscalationOpportunityFamily,
  } = runtimeWindow.__ROUGE_CVWO_FAMILIES_C;

  runtimeWindow.__ROUGE_CVWO_FAMILIES_B = {
    validateRecoveryOpportunityFamily,
    validateAccordOpportunityFamily,
    validateCovenantOpportunityFamily,
    validateDetourOpportunityFamily,
    validateEscalationOpportunityFamily,
  };
})();
