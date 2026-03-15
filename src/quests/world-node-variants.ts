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

  function getCatalogEntry(key, actNumber) {
    const entries = getCatalog()[key];
    if (entries[actNumber]) {
      return entries[actNumber];
    }
    const keys = Object.keys(entries).map(Number).sort((a, b) => a - b);
    return entries[keys[0]];
  }

  function findChoiceByOutcomeId(definition, outcomeId) {
    return definition.choices.find((choiceDefinition) => {
      return choiceDefinition.effects.some((effect) => effect.kind === "record_quest_outcome" && effect.outcomeId === outcomeId);
    });
  }

  function resolveEventFollowUp(run, actNumber) {
    const eventDefinition = getCatalogEntry("events", actNumber);
    const questDefinition = getCatalogEntry("quests", actNumber);
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
    const opportunityDefinition = getCatalogEntry("opportunities", actNumber);
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
    const crossroadOpportunityDefinition = getCatalogEntry("crossroadOpportunities", actNumber);
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
    const shrineOpportunityDefinition = getCatalogEntry("shrineOpportunities", actNumber);
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
    const reserveOpportunityDefinition = getCatalogEntry("reserveOpportunities", actNumber);
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
    const relayOpportunityDefinition = getCatalogEntry("relayOpportunities", actNumber);
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
    const culminationOpportunityDefinition = getCatalogEntry("culminationOpportunities", actNumber);
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

  // Expose helpers + first batch of resolvers; the second batch lives in world-node-variants-b.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (runtimeWindow as any).ROUGE_WORLD_NODE_VARIANTS = {
    resolveEventFollowUp,
    resolveOpportunityVariant,
    resolveCrossroadOpportunityVariant,
    resolveShrineOpportunityVariant,
    resolveReserveOpportunityVariant,
    resolveRelayOpportunityVariant,
    resolveCulminationOpportunityVariant,
  };

  // Share utility functions with the companion file
  runtimeWindow.__ROUGE_WNV_HELPERS = {
    getWorldNodeCatalogApi,
    getCatalog,
    getCatalogEntry,
    matchesRequiredValue,
    includesRequiredValues,
    getOpportunityVariantSpecificity,
    getReserveOpportunityVariantSpecificity,
  };

})();
