(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectActPathStates,
    collectShrinePathStates,
    doesShrineOpportunityVariantMatchPath,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
    getShrineOpportunityVariantRequirementSignature,
    getShrineOpportunityVariantSpecificity,
  } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;
  const {
    validateGrants,
    validateKnownStringIds,
    validateRewardDefinition,
    validateStringIdList,
  } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES;

  const MIN_CROSSROAD_OPPORTUNITY_VARIANTS = 3;
  const MIN_SHRINE_OPPORTUNITY_VARIANTS = 3;

  function pushError(errors: string[], message: string) { errors.push(message); }

  function validateCrossroadOpportunitySection(
    actKey: string,
    crossroadOpportunityDefinition: CrossroadOpportunityDefinition | null | undefined,
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    referenceState: ContentValidatorActReferenceState,
    errors: string[]
  ) {
    if (!crossroadOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a crossroad opportunity definition for act ${actKey}.`);
      return;
    }
    if (!crossroadOpportunityDefinition.zoneTitle) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a zoneTitle.`);
    }
    if (!crossroadOpportunityDefinition.title) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a title.`);
    }
    if (!crossroadOpportunityDefinition.description) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a description.`);
    }
    if (!crossroadOpportunityDefinition.summary) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing a summary.`);
    }
    if (!crossroadOpportunityDefinition.requiresQuestId) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing requiresQuestId.`);
    } else if (questDefinition?.id && crossroadOpportunityDefinition.requiresQuestId !== questDefinition.id) {
      pushError(
        errors,
        `worldNodes.crossroadOpportunities.${actKey} requires quest "${crossroadOpportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
      );
    }
    if (!crossroadOpportunityDefinition.requiresShrineId) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing requiresShrineId.`);
    } else if (shrineDefinition?.id && crossroadOpportunityDefinition.requiresShrineId !== shrineDefinition.id) {
      pushError(
        errors,
        `worldNodes.crossroadOpportunities.${actKey} requires shrine "${crossroadOpportunityDefinition.requiresShrineId}" but act shrine is "${shrineDefinition.id}".`
      );
    }
    validateGrants(crossroadOpportunityDefinition?.grants, `worldNodes.crossroadOpportunities.${actKey}.grants`, errors);

    if (!Array.isArray(crossroadOpportunityDefinition.variants) || crossroadOpportunityDefinition.variants.length === 0) {
      pushError(errors, `worldNodes.crossroadOpportunities.${actKey} is missing variants.`);
    } else {
      if (crossroadOpportunityDefinition.variants.length < MIN_CROSSROAD_OPPORTUNITY_VARIANTS) {
        pushError(
          errors,
          `worldNodes.crossroadOpportunities.${actKey} must define at least ${MIN_CROSSROAD_OPPORTUNITY_VARIANTS} variants.`
        );
      }
      const seenVariantIds = new Set();
      const seenRequirementSignatures = new Map();
      const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
      let shrineInfluencedVariantCount = 0;
      const unconditionalVariantCount = crossroadOpportunityDefinition.variants.filter((variantDefinition: OpportunityNodeVariantDefinition) => {
        return (
          (!Array.isArray(variantDefinition.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
        );
      }).length;

      if (unconditionalVariantCount > 1) {
        pushError(errors, `worldNodes.crossroadOpportunities.${actKey} has multiple unconditional variants.`);
      }

      crossroadOpportunityDefinition.variants.forEach((variantDefinition: OpportunityNodeVariantDefinition, index: number) => {
        if (
          (Array.isArray(variantDefinition?.requiresFlagIds) && variantDefinition.requiresFlagIds.length > 0) ||
          (Array.isArray(variantDefinition?.requiresMercenaryIds) && variantDefinition.requiresMercenaryIds.length > 0)
        ) {
          shrineInfluencedVariantCount += 1;
        }
        if (variantDefinition?.id) {
          if (seenVariantIds.has(variantDefinition.id)) {
            pushError(errors, `worldNodes.crossroadOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
          }
          seenVariantIds.add(variantDefinition.id);
        }
        const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
        const existingVariantId = seenRequirementSignatures.get(requirementSignature);
        if (existingVariantId) {
          pushError(
            errors,
            `worldNodes.crossroadOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
          );
        } else if (variantDefinition?.id) {
          seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
        } else {
          seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
        }
        validateStringIdList(
          variantDefinition.requiresPrimaryOutcomeIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresFollowUpOutcomeIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresConsequenceIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresFlagIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresMercenaryIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
          errors
        );
        validateKnownStringIds(
          variantDefinition.requiresPrimaryOutcomeIds,
          referenceState.primaryOutcomeIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
          errors,
          "primary quest outcome"
        );
        validateKnownStringIds(
          variantDefinition.requiresFollowUpOutcomeIds,
          referenceState.followUpOutcomeIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
          errors,
          "follow-up outcome"
        );
        validateKnownStringIds(
          variantDefinition.requiresConsequenceIds,
          referenceState.consequenceIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
          errors,
          "quest consequence"
        );
        validateKnownStringIds(
          variantDefinition.requiresFlagIds,
          referenceState.flagIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
          errors,
          "flag"
        );
        validateKnownStringIds(
          variantDefinition.requiresMercenaryIds,
          knownMercenaryIds,
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
          errors,
          "mercenary contract"
        );
        validateRewardDefinition(
          {
            ...variantDefinition,
            id: crossroadOpportunityDefinition.id,
          },
          `worldNodes.crossroadOpportunities.${actKey}.variants[${index}]`,
          "opportunity",
          errors,
          crossroadOpportunityDefinition.requiresQuestId
        );
      });

      if (shrineInfluencedVariantCount === 0) {
        pushError(
          errors,
          `worldNodes.crossroadOpportunities.${actKey} must include at least one shrine-influenced or mercenary-gated variant.`
        );
      }

      const authoredStates = collectActPathStates(questDefinition, shrineDefinition, {
        includeEmptyShrineState: false,
      });
      authoredStates.forEach((pathState: ContentValidatorActPathState) => {
        const hasMatchingVariant = crossroadOpportunityDefinition.variants.some((variantDefinition: OpportunityNodeVariantDefinition) => {
          return doesVariantMatchPath(variantDefinition, pathState);
        });
        if (!hasMatchingVariant) {
          pushError(
            errors,
            `worldNodes.crossroadOpportunities.${actKey} has no variant covering authored crossroad path "${pathState.label}".`
          );
        }
      });

      crossroadOpportunityDefinition.variants.forEach((variantDefinition: OpportunityNodeVariantDefinition, index: number) => {
        const hasReachablePath = authoredStates.some((pathState: ContentValidatorActPathState) => {
          return doesVariantMatchPath(variantDefinition, pathState);
        });
        if (!hasReachablePath) {
          pushError(
            errors,
            `worldNodes.crossroadOpportunities.${actKey}.variants[${index}] is unreachable from any authored quest/event/shrine crossroad path.`
          );
        }
      });

      authoredStates.forEach((pathState: ContentValidatorActPathState) => {
        const matchingVariants = crossroadOpportunityDefinition.variants
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
            `worldNodes.crossroadOpportunities.${actKey} has ambiguous variants for authored crossroad path "${pathState.label}": ${mostSpecificMatches
              .map((entry: { index: number; specificity: number; matches: boolean }) => `variants[${entry.index}]`)
              .join(", ")}.`
          );
        }
      });
    }
  }

  function validateShrineOpportunitySection(
    actKey: string,
    shrineOpportunityDefinition: ShrineOpportunityDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    referenceState: ContentValidatorActReferenceState,
    errors: string[]
  ) {
    if (!shrineOpportunityDefinition) {
      pushError(errors, `World-node catalog is missing a shrine opportunity definition for act ${actKey}.`);
      return;
    }
    if (!shrineOpportunityDefinition.zoneTitle) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a zoneTitle.`);
    }
    if (!shrineOpportunityDefinition.title) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a title.`);
    }
    if (!shrineOpportunityDefinition.description) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a description.`);
    }
    if (!shrineOpportunityDefinition.summary) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing a summary.`);
    }
    if (!shrineOpportunityDefinition.requiresShrineId) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing requiresShrineId.`);
    } else if (shrineDefinition?.id && shrineOpportunityDefinition.requiresShrineId !== shrineDefinition.id) {
      pushError(
        errors,
        `worldNodes.shrineOpportunities.${actKey} requires shrine "${shrineOpportunityDefinition.requiresShrineId}" but act shrine is "${shrineDefinition.id}".`
      );
    }
    validateGrants(shrineOpportunityDefinition?.grants, `worldNodes.shrineOpportunities.${actKey}.grants`, errors);

    if (!Array.isArray(shrineOpportunityDefinition.variants) || shrineOpportunityDefinition.variants.length === 0) {
      pushError(errors, `worldNodes.shrineOpportunities.${actKey} is missing variants.`);
    } else {
      if (shrineOpportunityDefinition.variants.length < MIN_SHRINE_OPPORTUNITY_VARIANTS) {
        pushError(
          errors,
          `worldNodes.shrineOpportunities.${actKey} must define at least ${MIN_SHRINE_OPPORTUNITY_VARIANTS} variants.`
        );
      }
      const seenVariantIds = new Set();
      const seenRequirementSignatures = new Map();
      const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
      let mercenaryGatedVariantCount = 0;
      const unconditionalVariantCount = shrineOpportunityDefinition.variants.filter((variantDefinition: ShrineOpportunityVariantDefinition) => {
        return (
          (!Array.isArray(variantDefinition.requiresShrineOutcomeIds) || variantDefinition.requiresShrineOutcomeIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
          (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
        );
      }).length;

      if (unconditionalVariantCount > 1) {
        pushError(errors, `worldNodes.shrineOpportunities.${actKey} has multiple unconditional variants.`);
      }

      shrineOpportunityDefinition.variants.forEach((variantDefinition: ShrineOpportunityVariantDefinition, index: number) => {
        if (Array.isArray(variantDefinition?.requiresMercenaryIds) && variantDefinition.requiresMercenaryIds.length > 0) {
          mercenaryGatedVariantCount += 1;
        }
        if (variantDefinition?.id) {
          if (seenVariantIds.has(variantDefinition.id)) {
            pushError(errors, `worldNodes.shrineOpportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
          }
          seenVariantIds.add(variantDefinition.id);
        }
        const requirementSignature = getShrineOpportunityVariantRequirementSignature(variantDefinition);
        const existingVariantId = seenRequirementSignatures.get(requirementSignature);
        if (existingVariantId) {
          pushError(
            errors,
            `worldNodes.shrineOpportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
          );
        } else if (variantDefinition?.id) {
          seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
        } else {
          seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
        }
        validateStringIdList(
          variantDefinition.requiresShrineOutcomeIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresShrineOutcomeIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresFlagIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
          errors
        );
        validateStringIdList(
          variantDefinition.requiresMercenaryIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
          errors
        );
        validateKnownStringIds(
          variantDefinition.requiresShrineOutcomeIds,
          referenceState.shrineOutcomeIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresShrineOutcomeIds`,
          errors,
          "shrine outcome"
        );
        validateKnownStringIds(
          variantDefinition.requiresFlagIds,
          referenceState.flagIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresFlagIds`,
          errors,
          "flag"
        );
        validateKnownStringIds(
          variantDefinition.requiresMercenaryIds,
          knownMercenaryIds,
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
          errors,
          "mercenary contract"
        );
        validateRewardDefinition(
          {
            ...variantDefinition,
            id: shrineOpportunityDefinition.id,
          },
          `worldNodes.shrineOpportunities.${actKey}.variants[${index}]`,
          "opportunity",
          errors
        );
      });

      if (mercenaryGatedVariantCount === 0) {
        pushError(errors, `worldNodes.shrineOpportunities.${actKey} must include at least one mercenary-gated variant.`);
      }

      const authoredStates = collectShrinePathStates(shrineDefinition);
      authoredStates.forEach((pathState: ContentValidatorShrinePathState) => {
        const hasMatchingVariant = shrineOpportunityDefinition.variants.some((variantDefinition: ShrineOpportunityVariantDefinition) => {
          return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
        });
        if (!hasMatchingVariant) {
          pushError(
            errors,
            `worldNodes.shrineOpportunities.${actKey} has no variant covering authored shrine path "${pathState.label}".`
          );
        }
      });

      shrineOpportunityDefinition.variants.forEach((variantDefinition: ShrineOpportunityVariantDefinition, index: number) => {
        const hasReachablePath = authoredStates.some((pathState: ContentValidatorShrinePathState) => {
          return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
        });
        if (!hasReachablePath) {
          pushError(
            errors,
            `worldNodes.shrineOpportunities.${actKey}.variants[${index}] is unreachable from any authored shrine path.`
          );
        }
      });

      authoredStates.forEach((pathState: ContentValidatorShrinePathState) => {
        const matchingVariants = shrineOpportunityDefinition.variants
          .map((variantDefinition: ShrineOpportunityVariantDefinition, index: number) => ({
            index,
            specificity: getShrineOpportunityVariantSpecificity(variantDefinition),
            matches: doesShrineOpportunityVariantMatchPath(variantDefinition, pathState),
          }))
          .filter((entry: { index: number; specificity: number; matches: boolean }) => entry.matches);
        const maxSpecificity = matchingVariants.reduce((maxValue: number, entry: { index: number; specificity: number; matches: boolean }) => Math.max(maxValue, entry.specificity), 0);
        const mostSpecificMatches = matchingVariants.filter((entry: { index: number; specificity: number; matches: boolean }) => entry.specificity === maxSpecificity);
        if (mostSpecificMatches.length > 1) {
          pushError(
            errors,
            `worldNodes.shrineOpportunities.${actKey} has ambiguous variants for authored shrine path "${pathState.label}": ${mostSpecificMatches
              .map((entry: { index: number; specificity: number; matches: boolean }) => `variants[${entry.index}]`)
              .join(", ")}.`
          );
        }
      });
    }
  }

  runtimeWindow.__ROUGE_CV_WORLD_CATALOG_SECTIONS = {
    validateCrossroadOpportunitySection,
    validateShrineOpportunitySection,
  };
})();
