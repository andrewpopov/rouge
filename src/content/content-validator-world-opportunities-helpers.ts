(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    doesReserveOpportunityVariantMatchPath,
    getReserveOpportunityVariantRequirementSignature,
    getReserveOpportunityVariantSpecificity,
  } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  function pushError(errors: string[], message: string) { errors.push(message); }

  function validateStringIdList(values: unknown, label: string, errors: string[]) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value !== "string" || !value) {
        pushError(errors, `${label}[${index}] must be a non-empty string.`);
      }
    });
  }

  function validateKnownStringIds(values: unknown, knownValues: Set<string>, label: string, errors: string[], referenceType: string) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value === "string" && value && !knownValues.has(value)) {
        pushError(errors, `${label}[${index}] references unknown ${referenceType} "${value}".`);
      }
    });
  }

  function validateGrants(grants: unknown, label: string, errors: string[]) {
    ["gold", "xp", "potions"].forEach((field: string) => {
      if (!Number.isFinite(Number((grants as Record<string, unknown>)?.[field]))) {
        pushError(errors, `${label}.${field} must be numeric.`);
      }
    });
  }

  function validateNodeChoice(definition: Record<string, unknown>, choiceDefinition: Record<string, unknown>, label: string, expectedNodeType: string, errors: string[], linkedQuestId: string = "") {
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
      const questEffect = choiceDefinition.effects.find((effect: RewardChoiceEffect) => effect.kind === "record_quest_outcome");
      if (!questEffect?.questId || !questEffect?.outcomeId || !questEffect?.outcomeTitle) {
        pushError(errors, `${label} is missing a valid record_quest_outcome effect.`);
      } else if (questEffect.questId !== definition.id) {
        pushError(errors, `${label} record_quest_outcome references "${questEffect.questId}" but expected "${definition.id}".`);
      }
      if (!(choiceDefinition as Record<string, unknown>).followUp) {
        pushError(errors, `${label} is missing follow-up event content.`);
      }
      return;
    }

    const nodeEffect = choiceDefinition.effects.find((effect: RewardChoiceEffect) => effect.kind === "record_node_outcome");
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
      const followUpEffect = choiceDefinition.effects.find((effect: RewardChoiceEffect) => effect.kind === "record_quest_follow_up");
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
      const consequenceEffect = choiceDefinition.effects.find((effect: RewardChoiceEffect) => effect.kind === "record_quest_consequence");
      if (!consequenceEffect?.questId || !consequenceEffect?.outcomeId || !consequenceEffect?.outcomeTitle || !consequenceEffect?.consequenceId) {
        pushError(errors, `${label} is missing a valid record_quest_consequence effect.`);
      } else if (consequenceEffect.questId !== linkedQuestId) {
        pushError(errors, `${label} record_quest_consequence references "${consequenceEffect.questId}" but expected "${linkedQuestId}".`);
      }
    }
  }

  function validateRewardDefinition(definition: Record<string, unknown>, label: string, expectedNodeType: string, errors: string[], linkedQuestId: string = "") {
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
    definition.choices.forEach((choiceDefinition: Record<string, unknown>, index: number) => {
      if (choiceDefinition?.id) {
        if (seenChoiceIds.has(choiceDefinition.id)) {
          pushError(errors, `${label} reuses choice id "${choiceDefinition.id}".`);
        }
        seenChoiceIds.add(choiceDefinition.id);
      }
      validateNodeChoice(definition, choiceDefinition, `${label}.choices[${index}]`, expectedNodeType, errors, linkedQuestId);
    });
  }

  function validateOpportunityShell(definition: Record<string, unknown>, label: string, errors: string[]) {
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

  function validateRequiredNodeReference(definition: unknown, label: string, fieldName: string, expectedDefinition: unknown, referenceLabel: string, errors: string[]) {
    if (!(definition as Record<string, unknown>)?.[fieldName]) {
      pushError(errors, `${label} is missing ${fieldName}.`);
      return;
    }
    if ((expectedDefinition as Record<string, unknown>)?.id && (definition as Record<string, unknown>)[fieldName] !== (expectedDefinition as Record<string, unknown>).id) {
      pushError(
        errors,
        `${label} requires ${referenceLabel} "${(definition as Record<string, unknown>)[fieldName]}" but act ${referenceLabel} is "${(expectedDefinition as Record<string, unknown>).id}".`
      );
    }
  }

  function validateReserveStyleOpportunityVariants(options: Record<string, unknown>) {
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
    } = options as {
      definition: Record<string, unknown>;
      errors: string[];
      knownFlagIds: Set<string>;
      label: string;
      linkedQuestId: string;
      makeInfluenceCounts: () => Record<string, number>;
      minVariants: number;
      pathKindLabel: string;
      pathStates: ContentValidatorFlagPathState[];
      recordInfluenceCounts: (influenceCounts: Record<string, number>, requiredFlagIds: string[]) => void;
      validateInfluenceCounts: (influenceCounts: Record<string, number>, errors: string[]) => void;
    };

    if (!Array.isArray(definition?.variants) || definition.variants.length === 0) {
      pushError(errors, `${label} is missing variants.`);
      return;
    }

    const variants = definition.variants as ReserveOpportunityVariantDefinition[];

    if (variants.length < minVariants) {
      pushError(errors, `${label} must define at least ${minVariants} variants.`);
    }

    const seenVariantIds = new Set();
    const seenRequirementSignatures = new Map();
    const influenceCounts = makeInfluenceCounts();
    const unconditionalVariantCount = variants.filter((variantDefinition: ReserveOpportunityVariantDefinition) => {
      return !Array.isArray(variantDefinition?.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0;
    }).length;

    if (unconditionalVariantCount > 1) {
      pushError(errors, `${label} has multiple unconditional variants.`);
    }

    variants.forEach((variantDefinition: ReserveOpportunityVariantDefinition, index: number) => {
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

    pathStates.forEach((pathState: ContentValidatorFlagPathState) => {
      const hasMatchingVariant = variants.some((variantDefinition: ReserveOpportunityVariantDefinition) => {
        return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasMatchingVariant) {
        pushError(errors, `${label} has no variant covering authored ${pathKindLabel} path "${pathState.label}".`);
      }
    });

    variants.forEach((variantDefinition: ReserveOpportunityVariantDefinition, index: number) => {
      const hasReachablePath = pathStates.some((pathState: ContentValidatorFlagPathState) => {
        return doesReserveOpportunityVariantMatchPath(variantDefinition, pathState);
      });
      if (!hasReachablePath) {
        pushError(errors, `${label}.variants[${index}] is unreachable from any authored ${pathKindLabel} path.`);
      }
    });

    pathStates.forEach((pathState: ContentValidatorFlagPathState) => {
      const matchingVariants = variants
        .map((variantDefinition: ReserveOpportunityVariantDefinition, index: number) => ({
          index,
          specificity: getReserveOpportunityVariantSpecificity(variantDefinition),
          matches: doesReserveOpportunityVariantMatchPath(variantDefinition, pathState),
        }))
        .filter((entry: { index: number; specificity: number; matches: boolean }) => entry.matches);
      const maxSpecificity = matchingVariants.reduce((maxValue: number, entry: { index: number; specificity: number; matches: boolean }) => Math.max(maxValue, entry.specificity), 0);
      const mostSpecificMatches = matchingVariants.filter((entry: { index: number; specificity: number; matches: boolean }) => entry.specificity === maxSpecificity);
      if (mostSpecificMatches.length > 1) {
        pushError(
          errors,
          `${label} has ambiguous variants for authored ${pathKindLabel} path "${pathState.label}": ${mostSpecificMatches
            .map((entry: { index: number; specificity: number; matches: boolean }) => `variants[${entry.index}]`)
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
