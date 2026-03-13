(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectDetourPathStates,
    collectEscalationPathStates,
    collectOpportunityChoiceStates,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const {
    pushError,
    validateOpportunityShell,
    validateRequiredNodeReference,
    validateReserveStyleOpportunityVariants,
  } = runtimeWindow.__ROUGE_CVWO_HELPERS;

  const MIN_DETOUR_OPPORTUNITY_VARIANTS = 3;
  const MIN_ESCALATION_OPPORTUNITY_VARIANTS = 3;

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

  runtimeWindow.__ROUGE_CVWO_FAMILIES_C = {
    validateDetourOpportunityFamily,
    validateEscalationOpportunityFamily,
  };
})();
