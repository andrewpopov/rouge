(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectAccordPathStates,
    collectCovenantPathStates,
    collectDetourPathStates,
    collectEscalationPathStates,
    collectOpportunityChoiceStates,
    collectRecoveryPathStates,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const {
    pushError,
    validateOpportunityShell,
    validateRequiredNodeReference,
    validateReserveStyleOpportunityVariants,
  } = runtimeWindow.__ROUGE_CVWO_HELPERS;

  const MIN_RECOVERY_OPPORTUNITY_VARIANTS = 3;
  const MIN_ACCORD_OPPORTUNITY_VARIANTS = 3;
  const MIN_COVENANT_OPPORTUNITY_VARIANTS = 3;
  const MIN_DETOUR_OPPORTUNITY_VARIANTS = 3;
  const MIN_ESCALATION_OPPORTUNITY_VARIANTS = 3;

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

  runtimeWindow.__ROUGE_CVWO_FAMILIES_B = {
    validateRecoveryOpportunityFamily,
    validateAccordOpportunityFamily,
    validateCovenantOpportunityFamily,
    validateDetourOpportunityFamily,
    validateEscalationOpportunityFamily,
  };
})();
