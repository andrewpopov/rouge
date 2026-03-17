(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    getCatalogEntry,
    includesRequiredValues,
    getReserveOpportunityVariantSpecificity,
  } = runtimeWindow.__ROUGE_WNV_HELPERS;

  function resolveLegacyOpportunityVariant(run: RunState, actNumber: number) {
    const legacyOpportunityDefinition = getCatalogEntry("legacyOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[legacyOpportunityDefinition.requiresQuestId] || null;
    const culminationOpportunityRecord = run?.world?.opportunityOutcomes?.[legacyOpportunityDefinition.requiresCulminationOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Legacy opportunity node "${legacyOpportunityDefinition.id}" requires resolved quest "${legacyOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Legacy opportunity node "${legacyOpportunityDefinition.id}" requires a resolved follow-up outcome for "${legacyOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!culminationOpportunityRecord?.outcomeId) {
      throw new Error(
        `Legacy opportunity node "${legacyOpportunityDefinition.id}" requires resolved culmination opportunity "${legacyOpportunityDefinition.requiresCulminationOpportunityId}".`
      );
    }

    const variant =
      legacyOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Legacy opportunity node "${legacyOpportunityDefinition.id}" has no authored variant for culmination lane "${culminationOpportunityRecord.outcomeId}".`
      );
    }

    return {
      legacyOpportunityDefinition,
      questRecord,
      culminationOpportunityRecord,
      variant,
    };
  }

  function resolveReckoningOpportunityVariant(run: RunState, actNumber: number) {
    const reckoningOpportunityDefinition = getCatalogEntry("reckoningOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[reckoningOpportunityDefinition.requiresQuestId] || null;
    const reserveOpportunityRecord = run?.world?.opportunityOutcomes?.[reckoningOpportunityDefinition.requiresReserveOpportunityId] || null;
    const culminationOpportunityRecord = run?.world?.opportunityOutcomes?.[reckoningOpportunityDefinition.requiresCulminationOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Reckoning opportunity node "${reckoningOpportunityDefinition.id}" requires resolved quest "${reckoningOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Reckoning opportunity node "${reckoningOpportunityDefinition.id}" requires a resolved follow-up outcome for "${reckoningOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!reserveOpportunityRecord?.outcomeId) {
      throw new Error(
        `Reckoning opportunity node "${reckoningOpportunityDefinition.id}" requires resolved reserve opportunity "${reckoningOpportunityDefinition.requiresReserveOpportunityId}".`
      );
    }

    if (!culminationOpportunityRecord?.outcomeId) {
      throw new Error(
        `Reckoning opportunity node "${reckoningOpportunityDefinition.id}" requires resolved culmination opportunity "${reckoningOpportunityDefinition.requiresCulminationOpportunityId}".`
      );
    }

    const variant =
      reckoningOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Reckoning opportunity node "${reckoningOpportunityDefinition.id}" has no authored variant for reserve lane "${reserveOpportunityRecord.outcomeId}" and culmination lane "${culminationOpportunityRecord.outcomeId}".`
      );
    }

    return {
      reckoningOpportunityDefinition,
      questRecord,
      reserveOpportunityRecord,
      culminationOpportunityRecord,
      variant,
    };
  }

  function resolveRecoveryOpportunityVariant(run: RunState, actNumber: number) {
    const recoveryOpportunityDefinition = getCatalogEntry("recoveryOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[recoveryOpportunityDefinition.requiresQuestId] || null;
    const shrineOpportunityRecord = run?.world?.opportunityOutcomes?.[recoveryOpportunityDefinition.requiresShrineOpportunityId] || null;
    const culminationOpportunityRecord = run?.world?.opportunityOutcomes?.[recoveryOpportunityDefinition.requiresCulminationOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Recovery opportunity node "${recoveryOpportunityDefinition.id}" requires resolved quest "${recoveryOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Recovery opportunity node "${recoveryOpportunityDefinition.id}" requires a resolved follow-up outcome for "${recoveryOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!shrineOpportunityRecord?.outcomeId) {
      throw new Error(
        `Recovery opportunity node "${recoveryOpportunityDefinition.id}" requires resolved shrine opportunity "${recoveryOpportunityDefinition.requiresShrineOpportunityId}".`
      );
    }

    if (!culminationOpportunityRecord?.outcomeId) {
      throw new Error(
        `Recovery opportunity node "${recoveryOpportunityDefinition.id}" requires resolved culmination opportunity "${recoveryOpportunityDefinition.requiresCulminationOpportunityId}".`
      );
    }

    const variant =
      recoveryOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Recovery opportunity node "${recoveryOpportunityDefinition.id}" has no authored variant for shrine lane "${shrineOpportunityRecord.outcomeId}" and culmination lane "${culminationOpportunityRecord.outcomeId}".`
      );
    }

    return {
      recoveryOpportunityDefinition,
      questRecord,
      shrineOpportunityRecord,
      culminationOpportunityRecord,
      variant,
    };
  }

  function resolveAccordOpportunityVariant(run: RunState, actNumber: number) {
    const accordOpportunityDefinition = getCatalogEntry("accordOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[accordOpportunityDefinition.requiresQuestId] || null;
    const shrineOpportunityRecord = run?.world?.opportunityOutcomes?.[accordOpportunityDefinition.requiresShrineOpportunityId] || null;
    const crossroadOpportunityRecord = run?.world?.opportunityOutcomes?.[accordOpportunityDefinition.requiresCrossroadOpportunityId] || null;
    const culminationOpportunityRecord = run?.world?.opportunityOutcomes?.[accordOpportunityDefinition.requiresCulminationOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(`Accord opportunity node "${accordOpportunityDefinition.id}" requires resolved quest "${accordOpportunityDefinition.requiresQuestId}".`);
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Accord opportunity node "${accordOpportunityDefinition.id}" requires a resolved follow-up outcome for "${accordOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!shrineOpportunityRecord?.outcomeId) {
      throw new Error(
        `Accord opportunity node "${accordOpportunityDefinition.id}" requires resolved shrine opportunity "${accordOpportunityDefinition.requiresShrineOpportunityId}".`
      );
    }

    if (!crossroadOpportunityRecord?.outcomeId) {
      throw new Error(
        `Accord opportunity node "${accordOpportunityDefinition.id}" requires resolved crossroad opportunity "${accordOpportunityDefinition.requiresCrossroadOpportunityId}".`
      );
    }

    if (!culminationOpportunityRecord?.outcomeId) {
      throw new Error(
        `Accord opportunity node "${accordOpportunityDefinition.id}" requires resolved culmination opportunity "${accordOpportunityDefinition.requiresCulminationOpportunityId}".`
      );
    }

    const variant =
      accordOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Accord opportunity node "${accordOpportunityDefinition.id}" has no authored variant for shrine lane "${shrineOpportunityRecord.outcomeId}", crossroad "${crossroadOpportunityRecord.outcomeId}", and culmination lane "${culminationOpportunityRecord.outcomeId}".`
      );
    }

    return {
      accordOpportunityDefinition,
      questRecord,
      shrineOpportunityRecord,
      crossroadOpportunityRecord,
      culminationOpportunityRecord,
      variant,
    };
  }

  function resolveCovenantOpportunityVariant(run: RunState, actNumber: number) {
    const covenantOpportunityDefinition = getCatalogEntry("covenantOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[covenantOpportunityDefinition.requiresQuestId] || null;
    const legacyOpportunityRecord = run?.world?.opportunityOutcomes?.[covenantOpportunityDefinition.requiresLegacyOpportunityId] || null;
    const reckoningOpportunityRecord = run?.world?.opportunityOutcomes?.[covenantOpportunityDefinition.requiresReckoningOpportunityId] || null;
    const recoveryOpportunityRecord = run?.world?.opportunityOutcomes?.[covenantOpportunityDefinition.requiresRecoveryOpportunityId] || null;
    const accordOpportunityRecord = run?.world?.opportunityOutcomes?.[covenantOpportunityDefinition.requiresAccordOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(`Covenant opportunity node "${covenantOpportunityDefinition.id}" requires resolved quest "${covenantOpportunityDefinition.requiresQuestId}".`);
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" requires a resolved follow-up outcome for "${covenantOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!legacyOpportunityRecord?.outcomeId) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" requires resolved legacy opportunity "${covenantOpportunityDefinition.requiresLegacyOpportunityId}".`
      );
    }

    if (!reckoningOpportunityRecord?.outcomeId) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" requires resolved reckoning opportunity "${covenantOpportunityDefinition.requiresReckoningOpportunityId}".`
      );
    }

    if (!recoveryOpportunityRecord?.outcomeId) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" requires resolved recovery opportunity "${covenantOpportunityDefinition.requiresRecoveryOpportunityId}".`
      );
    }

    if (!accordOpportunityRecord?.outcomeId) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" requires resolved accord opportunity "${covenantOpportunityDefinition.requiresAccordOpportunityId}".`
      );
    }

    const variant =
      covenantOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Covenant opportunity node "${covenantOpportunityDefinition.id}" has no authored variant for legacy lane "${legacyOpportunityRecord.outcomeId}", reckoning lane "${reckoningOpportunityRecord.outcomeId}", recovery lane "${recoveryOpportunityRecord.outcomeId}", and accord lane "${accordOpportunityRecord.outcomeId}".`
      );
    }

    return {
      covenantOpportunityDefinition,
      questRecord,
      legacyOpportunityRecord,
      reckoningOpportunityRecord,
      recoveryOpportunityRecord,
      accordOpportunityRecord,
      variant,
    };
  }

  function resolveDetourOpportunityVariant(run: RunState, actNumber: number) {
    const detourOpportunityDefinition = getCatalogEntry("detourOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[detourOpportunityDefinition.requiresQuestId] || null;
    const recoveryOpportunityRecord = run?.world?.opportunityOutcomes?.[detourOpportunityDefinition.requiresRecoveryOpportunityId] || null;
    const accordOpportunityRecord = run?.world?.opportunityOutcomes?.[detourOpportunityDefinition.requiresAccordOpportunityId] || null;
    const covenantOpportunityRecord = run?.world?.opportunityOutcomes?.[detourOpportunityDefinition.requiresCovenantOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(`Detour opportunity node "${detourOpportunityDefinition.id}" requires resolved quest "${detourOpportunityDefinition.requiresQuestId}".`);
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Detour opportunity node "${detourOpportunityDefinition.id}" requires a resolved follow-up outcome for "${detourOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!recoveryOpportunityRecord?.outcomeId) {
      throw new Error(
        `Detour opportunity node "${detourOpportunityDefinition.id}" requires resolved recovery opportunity "${detourOpportunityDefinition.requiresRecoveryOpportunityId}".`
      );
    }

    if (!accordOpportunityRecord?.outcomeId) {
      throw new Error(
        `Detour opportunity node "${detourOpportunityDefinition.id}" requires resolved accord opportunity "${detourOpportunityDefinition.requiresAccordOpportunityId}".`
      );
    }

    if (!covenantOpportunityRecord?.outcomeId) {
      throw new Error(
        `Detour opportunity node "${detourOpportunityDefinition.id}" requires resolved covenant opportunity "${detourOpportunityDefinition.requiresCovenantOpportunityId}".`
      );
    }

    const variant =
      detourOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Detour opportunity node "${detourOpportunityDefinition.id}" has no authored variant for recovery lane "${recoveryOpportunityRecord.outcomeId}", accord lane "${accordOpportunityRecord.outcomeId}", and covenant lane "${covenantOpportunityRecord.outcomeId}".`
      );
    }

    return {
      accordOpportunityRecord,
      covenantOpportunityRecord,
      detourOpportunityDefinition,
      questRecord,
      recoveryOpportunityRecord,
      variant,
    };
  }

  function resolveEscalationOpportunityVariant(run: RunState, actNumber: number) {
    const escalationOpportunityDefinition = getCatalogEntry("escalationOpportunities", actNumber);
    const questRecord = run?.world?.questOutcomes?.[escalationOpportunityDefinition.requiresQuestId] || null;
    const legacyOpportunityRecord = run?.world?.opportunityOutcomes?.[escalationOpportunityDefinition.requiresLegacyOpportunityId] || null;
    const reckoningOpportunityRecord = run?.world?.opportunityOutcomes?.[escalationOpportunityDefinition.requiresReckoningOpportunityId] || null;
    const covenantOpportunityRecord = run?.world?.opportunityOutcomes?.[escalationOpportunityDefinition.requiresCovenantOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" requires resolved quest "${escalationOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" requires a resolved follow-up outcome for "${escalationOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!legacyOpportunityRecord?.outcomeId) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" requires resolved legacy opportunity "${escalationOpportunityDefinition.requiresLegacyOpportunityId}".`
      );
    }

    if (!reckoningOpportunityRecord?.outcomeId) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" requires resolved reckoning opportunity "${escalationOpportunityDefinition.requiresReckoningOpportunityId}".`
      );
    }

    if (!covenantOpportunityRecord?.outcomeId) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" requires resolved covenant opportunity "${escalationOpportunityDefinition.requiresCovenantOpportunityId}".`
      );
    }

    const variant =
      escalationOpportunityDefinition.variants.reduce((bestMatch: ReserveOpportunityVariantDefinition | null, variantDefinition: ReserveOpportunityVariantDefinition) => {
        if (!includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getReserveOpportunityVariantSpecificity(variantDefinition) > getReserveOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Escalation opportunity node "${escalationOpportunityDefinition.id}" has no authored variant for legacy lane "${legacyOpportunityRecord.outcomeId}", reckoning lane "${reckoningOpportunityRecord.outcomeId}", and covenant lane "${covenantOpportunityRecord.outcomeId}".`
      );
    }

    return {
      covenantOpportunityRecord,
      escalationOpportunityDefinition,
      legacyOpportunityRecord,
      questRecord,
      reckoningOpportunityRecord,
      variant,
    };
  }

  // Combine the first batch from the staging partial with the late resolvers
  // and publish the complete WorldNodeVariantsApi.
  runtimeWindow.ROUGE_WORLD_NODE_VARIANTS = {
    ...runtimeWindow.__ROUGE_WNV_PARTIAL,
    resolveLegacyOpportunityVariant,
    resolveReckoningOpportunityVariant,
    resolveRecoveryOpportunityVariant,
    resolveAccordOpportunityVariant,
    resolveCovenantOpportunityVariant,
    resolveDetourOpportunityVariant,
    resolveEscalationOpportunityVariant,
  };
})();
