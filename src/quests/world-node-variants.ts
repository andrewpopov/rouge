(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getWorldNodeCatalogApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_CATALOG) {
      throw new Error("World-node catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_CATALOG;
  }

  function getCatalog() {
    return getWorldNodeCatalogApi().getCatalog();
  }

  function getQuestDefinition(actNumber) {
    const quests = getCatalog().quests;
    return quests[actNumber] || quests[1];
  }

  function getEventDefinition(actNumber) {
    const events = getCatalog().events;
    return events[actNumber] || events[1];
  }

  function getOpportunityDefinition(actNumber) {
    const opportunities = getCatalog().opportunities;
    return opportunities[actNumber] || opportunities[1];
  }

  function getCrossroadOpportunityDefinition(actNumber) {
    const crossroadOpportunities = getCatalog().crossroadOpportunities;
    return crossroadOpportunities[actNumber] || crossroadOpportunities[1];
  }

  function getShrineOpportunityDefinition(actNumber) {
    const shrineOpportunities = getCatalog().shrineOpportunities;
    return shrineOpportunities[actNumber] || shrineOpportunities[1];
  }

  function getReserveOpportunityDefinition(actNumber) {
    const reserveOpportunities = getCatalog().reserveOpportunities;
    return reserveOpportunities[actNumber] || reserveOpportunities[1];
  }

  function getRelayOpportunityDefinition(actNumber) {
    const relayOpportunities = getCatalog().relayOpportunities;
    return relayOpportunities[actNumber] || relayOpportunities[1];
  }

  function getCulminationOpportunityDefinition(actNumber) {
    const culminationOpportunities = getCatalog().culminationOpportunities;
    return culminationOpportunities[actNumber] || culminationOpportunities[1];
  }

  function getLegacyOpportunityDefinition(actNumber) {
    const legacyOpportunities = getCatalog().legacyOpportunities;
    return legacyOpportunities[actNumber] || legacyOpportunities[1];
  }

  function getReckoningOpportunityDefinition(actNumber) {
    const reckoningOpportunities = getCatalog().reckoningOpportunities;
    return reckoningOpportunities[actNumber] || reckoningOpportunities[1];
  }

  function getRecoveryOpportunityDefinition(actNumber) {
    const recoveryOpportunities = getCatalog().recoveryOpportunities;
    return recoveryOpportunities[actNumber] || recoveryOpportunities[1];
  }

  function getAccordOpportunityDefinition(actNumber) {
    const accordOpportunities = getCatalog().accordOpportunities;
    return accordOpportunities[actNumber] || accordOpportunities[1];
  }

  function getCovenantOpportunityDefinition(actNumber) {
    const covenantOpportunities = getCatalog().covenantOpportunities;
    return covenantOpportunities[actNumber] || covenantOpportunities[1];
  }

  function getDetourOpportunityDefinition(actNumber) {
    const detourOpportunities = getCatalog().detourOpportunities;
    return detourOpportunities[actNumber] || detourOpportunities[1];
  }

  function getEscalationOpportunityDefinition(actNumber) {
    const escalationOpportunities = getCatalog().escalationOpportunities;
    return escalationOpportunities[actNumber] || escalationOpportunities[1];
  }

  function findChoiceByOutcomeId(definition, outcomeId) {
    return definition.choices.find((choiceDefinition) => {
      return choiceDefinition.effects.some((effect) => effect.kind === "record_quest_outcome" && effect.outcomeId === outcomeId);
    });
  }

  function resolveEventFollowUp(run, actNumber) {
    const eventDefinition = getEventDefinition(actNumber);
    const questDefinition = getQuestDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[eventDefinition.requiresQuestId] || null;

    if (!questRecord?.outcomeId) {
      throw new Error(`Event node "${eventDefinition.id}" requires resolved quest "${eventDefinition.requiresQuestId}".`);
    }

    const questChoice = findChoiceByOutcomeId(questDefinition, questRecord.outcomeId);
    if (!questChoice?.followUp) {
      throw new Error(`Quest "${questDefinition.id}" is missing follow-up content for outcome "${questRecord.outcomeId}".`);
    }

    return {
      eventDefinition,
      questRecord,
      followUp: questChoice.followUp,
    };
  }

  function matchesRequiredValue(requiredIds, value) {
    return !Array.isArray(requiredIds) || requiredIds.length === 0 || requiredIds.includes(value);
  }

  function includesRequiredValues(requiredIds, availableIds) {
    if (!Array.isArray(requiredIds) || requiredIds.length === 0) {
      return true;
    }
    return requiredIds.every((requiredId) => availableIds.includes(requiredId));
  }

  function countRequiredValues(requiredIds) {
    return Array.isArray(requiredIds) ? new Set(requiredIds.filter((requiredId) => typeof requiredId === "string" && requiredId)).size : 0;
  }

  function getOpportunityVariantSpecificity(variantDefinition) {
    return (
      countRequiredValues(variantDefinition?.requiresPrimaryOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresFollowUpOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresConsequenceIds) +
      countRequiredValues(variantDefinition?.requiresFlagIds) +
      countRequiredValues(variantDefinition?.requiresMercenaryIds)
    );
  }

  function getShrineOpportunityVariantSpecificity(variantDefinition) {
    return (
      countRequiredValues(variantDefinition?.requiresShrineOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresFlagIds) +
      countRequiredValues(variantDefinition?.requiresMercenaryIds)
    );
  }

  function getReserveOpportunityVariantSpecificity(variantDefinition) {
    return countRequiredValues(variantDefinition?.requiresFlagIds);
  }

  function resolveOpportunityVariant(run, actNumber) {
    const opportunityDefinition = getOpportunityDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[opportunityDefinition.requiresQuestId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const currentMercenaryId = String(run?.mercenary?.id || "");

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" requires resolved quest "${opportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" requires a resolved follow-up outcome for "${opportunityDefinition.requiresQuestId}".`
      );
    }

    const variant =
      opportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
        const matches =
          matchesRequiredValue(variantDefinition.requiresPrimaryOutcomeIds, questRecord.outcomeId) &&
          matchesRequiredValue(variantDefinition.requiresFollowUpOutcomeIds, questRecord.followUpOutcomeId) &&
          includesRequiredValues(variantDefinition.requiresConsequenceIds, questRecord.consequenceIds || []) &&
          includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags) &&
          matchesRequiredValue(variantDefinition.requiresMercenaryIds, currentMercenaryId);

        if (!matches) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getOpportunityVariantSpecificity(variantDefinition) > getOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" has no authored variant for follow-up outcome "${questRecord.followUpOutcomeId}" and mercenary "${currentMercenaryId || "unknown"}".`
      );
    }

    return {
      opportunityDefinition,
      questRecord,
      variant,
    };
  }

  function resolveCrossroadOpportunityVariant(run, actNumber) {
    const crossroadOpportunityDefinition = getCrossroadOpportunityDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[crossroadOpportunityDefinition.requiresQuestId] || null;
    const shrineRecord = run?.world?.shrineOutcomes?.[crossroadOpportunityDefinition.requiresShrineId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const currentMercenaryId = String(run?.mercenary?.id || "");

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Crossroad opportunity node "${crossroadOpportunityDefinition.id}" requires resolved quest "${crossroadOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Crossroad opportunity node "${crossroadOpportunityDefinition.id}" requires a resolved follow-up outcome for "${crossroadOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!shrineRecord?.outcomeId) {
      throw new Error(
        `Crossroad opportunity node "${crossroadOpportunityDefinition.id}" requires resolved shrine "${crossroadOpportunityDefinition.requiresShrineId}".`
      );
    }

    const variant =
      crossroadOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
        const matches =
          matchesRequiredValue(variantDefinition.requiresPrimaryOutcomeIds, questRecord.outcomeId) &&
          matchesRequiredValue(variantDefinition.requiresFollowUpOutcomeIds, questRecord.followUpOutcomeId) &&
          includesRequiredValues(variantDefinition.requiresConsequenceIds, questRecord.consequenceIds || []) &&
          includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags) &&
          matchesRequiredValue(variantDefinition.requiresMercenaryIds, currentMercenaryId);

        if (!matches) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getOpportunityVariantSpecificity(variantDefinition) > getOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Crossroad opportunity node "${crossroadOpportunityDefinition.id}" has no authored variant for follow-up outcome "${questRecord.followUpOutcomeId}", shrine "${shrineRecord.outcomeId}", and mercenary "${currentMercenaryId || "unknown"}".`
      );
    }

    return {
      crossroadOpportunityDefinition,
      questRecord,
      shrineRecord,
      variant,
    };
  }

  function resolveShrineOpportunityVariant(run, actNumber) {
    const shrineOpportunityDefinition = getShrineOpportunityDefinition(actNumber);
    const shrineRecord = run?.world?.shrineOutcomes?.[shrineOpportunityDefinition.requiresShrineId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const currentMercenaryId = String(run?.mercenary?.id || "");

    if (!shrineRecord?.outcomeId) {
      throw new Error(
        `Shrine opportunity node "${shrineOpportunityDefinition.id}" requires resolved shrine "${shrineOpportunityDefinition.requiresShrineId}".`
      );
    }

    const variant =
      shrineOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
        const matches =
          matchesRequiredValue(variantDefinition.requiresShrineOutcomeIds, shrineRecord.outcomeId) &&
          includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags) &&
          matchesRequiredValue(variantDefinition.requiresMercenaryIds, currentMercenaryId);

        if (!matches) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getShrineOpportunityVariantSpecificity(variantDefinition) > getShrineOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Shrine opportunity node "${shrineOpportunityDefinition.id}" has no authored variant for shrine outcome "${shrineRecord.outcomeId}" and mercenary "${currentMercenaryId || "unknown"}".`
      );
    }

    return {
      shrineOpportunityDefinition,
      shrineRecord,
      variant,
    };
  }

  function resolveReserveOpportunityVariant(run, actNumber) {
    const reserveOpportunityDefinition = getReserveOpportunityDefinition(actNumber);
    const opportunityRecord = run?.world?.opportunityOutcomes?.[reserveOpportunityDefinition.requiresOpportunityId] || null;
    const shrineOpportunityRecord = run?.world?.opportunityOutcomes?.[reserveOpportunityDefinition.requiresShrineOpportunityId] || null;
    const crossroadOpportunityRecord = run?.world?.opportunityOutcomes?.[reserveOpportunityDefinition.requiresCrossroadOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!opportunityRecord?.outcomeId) {
      throw new Error(
        `Reserve opportunity node "${reserveOpportunityDefinition.id}" requires resolved opportunity "${reserveOpportunityDefinition.requiresOpportunityId}".`
      );
    }

    if (!shrineOpportunityRecord?.outcomeId) {
      throw new Error(
        `Reserve opportunity node "${reserveOpportunityDefinition.id}" requires resolved shrine opportunity "${reserveOpportunityDefinition.requiresShrineOpportunityId}".`
      );
    }

    if (!crossroadOpportunityRecord?.outcomeId) {
      throw new Error(
        `Reserve opportunity node "${reserveOpportunityDefinition.id}" requires resolved crossroad opportunity "${reserveOpportunityDefinition.requiresCrossroadOpportunityId}".`
      );
    }

    const variant =
      reserveOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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
        `Reserve opportunity node "${reserveOpportunityDefinition.id}" has no authored variant for route "${opportunityRecord.outcomeId}", shrine lane "${shrineOpportunityRecord.outcomeId}", and crossroad "${crossroadOpportunityRecord.outcomeId}".`
      );
    }

    return {
      reserveOpportunityDefinition,
      opportunityRecord,
      shrineOpportunityRecord,
      crossroadOpportunityRecord,
      variant,
    };
  }

  function resolveRelayOpportunityVariant(run, actNumber) {
    const relayOpportunityDefinition = getRelayOpportunityDefinition(actNumber);
    const reserveOpportunityRecord = run?.world?.opportunityOutcomes?.[relayOpportunityDefinition.requiresReserveOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!reserveOpportunityRecord?.outcomeId) {
      throw new Error(
        `Relay opportunity node "${relayOpportunityDefinition.id}" requires resolved reserve opportunity "${relayOpportunityDefinition.requiresReserveOpportunityId}".`
      );
    }

    const variant =
      relayOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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
        `Relay opportunity node "${relayOpportunityDefinition.id}" has no authored variant for reserve lane "${reserveOpportunityRecord.outcomeId}".`
      );
    }

    return {
      relayOpportunityDefinition,
      reserveOpportunityRecord,
      variant,
    };
  }

  function resolveCulminationOpportunityVariant(run, actNumber) {
    const culminationOpportunityDefinition = getCulminationOpportunityDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[culminationOpportunityDefinition.requiresQuestId] || null;
    const relayOpportunityRecord = run?.world?.opportunityOutcomes?.[culminationOpportunityDefinition.requiresRelayOpportunityId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];
    const currentMercenaryId = String(run?.mercenary?.id || "");

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Culmination opportunity node "${culminationOpportunityDefinition.id}" requires resolved quest "${culminationOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Culmination opportunity node "${culminationOpportunityDefinition.id}" requires a resolved follow-up outcome for "${culminationOpportunityDefinition.requiresQuestId}".`
      );
    }

    if (!relayOpportunityRecord?.outcomeId) {
      throw new Error(
        `Culmination opportunity node "${culminationOpportunityDefinition.id}" requires resolved relay opportunity "${culminationOpportunityDefinition.requiresRelayOpportunityId}".`
      );
    }

    const variant =
      culminationOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
        const matches =
          matchesRequiredValue(variantDefinition.requiresPrimaryOutcomeIds, questRecord.outcomeId) &&
          matchesRequiredValue(variantDefinition.requiresFollowUpOutcomeIds, questRecord.followUpOutcomeId) &&
          includesRequiredValues(variantDefinition.requiresConsequenceIds, questRecord.consequenceIds || []) &&
          includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags) &&
          matchesRequiredValue(variantDefinition.requiresMercenaryIds, currentMercenaryId);

        if (!matches) {
          return bestMatch;
        }

        if (!bestMatch) {
          return variantDefinition;
        }

        return getOpportunityVariantSpecificity(variantDefinition) > getOpportunityVariantSpecificity(bestMatch)
          ? variantDefinition
          : bestMatch;
      }, null) || null;

    if (!variant) {
      throw new Error(
        `Culmination opportunity node "${culminationOpportunityDefinition.id}" has no authored variant for follow-up outcome "${questRecord.followUpOutcomeId}", relay "${relayOpportunityRecord.outcomeId}", and mercenary "${currentMercenaryId || "unknown"}".`
      );
    }

    return {
      culminationOpportunityDefinition,
      questRecord,
      relayOpportunityRecord,
      variant,
    };
  }

  function resolveLegacyOpportunityVariant(run, actNumber) {
    const legacyOpportunityDefinition = getLegacyOpportunityDefinition(actNumber);
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
      legacyOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveReckoningOpportunityVariant(run, actNumber) {
    const reckoningOpportunityDefinition = getReckoningOpportunityDefinition(actNumber);
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
      reckoningOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveRecoveryOpportunityVariant(run, actNumber) {
    const recoveryOpportunityDefinition = getRecoveryOpportunityDefinition(actNumber);
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
      recoveryOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveAccordOpportunityVariant(run, actNumber) {
    const accordOpportunityDefinition = getAccordOpportunityDefinition(actNumber);
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
      accordOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveCovenantOpportunityVariant(run, actNumber) {
    const covenantOpportunityDefinition = getCovenantOpportunityDefinition(actNumber);
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
      covenantOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveDetourOpportunityVariant(run, actNumber) {
    const detourOpportunityDefinition = getDetourOpportunityDefinition(actNumber);
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
      detourOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  function resolveEscalationOpportunityVariant(run, actNumber) {
    const escalationOpportunityDefinition = getEscalationOpportunityDefinition(actNumber);
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
      escalationOpportunityDefinition.variants.reduce((bestMatch, variantDefinition) => {
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

  runtimeWindow.ROUGE_WORLD_NODE_VARIANTS = {
    resolveEventFollowUp,
    resolveOpportunityVariant,
    resolveCrossroadOpportunityVariant,
    resolveShrineOpportunityVariant,
    resolveReserveOpportunityVariant,
    resolveRelayOpportunityVariant,
    resolveCulminationOpportunityVariant,
    resolveLegacyOpportunityVariant,
    resolveReckoningOpportunityVariant,
    resolveRecoveryOpportunityVariant,
    resolveAccordOpportunityVariant,
    resolveCovenantOpportunityVariant,
    resolveDetourOpportunityVariant,
    resolveEscalationOpportunityVariant,
  };
})();
