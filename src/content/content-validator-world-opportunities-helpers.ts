(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    doesReserveOpportunityVariantMatchPath,
    getReserveOpportunityVariantRequirementSignature,
    getReserveOpportunityVariantSpecificity,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

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

  runtimeWindow.__ROUGE_CVWO_HELPERS = {
    pushError,
    validateGrants,
    validateKnownStringIds,
    validateNodeChoice,
    validateOpportunityShell,
    validateRequiredNodeReference,
    validateReserveStyleOpportunityVariants,
    validateRewardDefinition,
    validateStringIdList,
  };
})();
