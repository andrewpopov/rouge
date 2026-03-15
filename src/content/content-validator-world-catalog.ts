(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectActPathStates,
    collectActReferenceState,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;
  const {
    validateGrants,
    validateKnownStringIds,
    validateLateRouteOpportunityFamilies,
    validateRewardDefinition,
    validateStringIdList,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES;
  const {
    validateCrossroadOpportunitySection,
    validateShrineOpportunitySection,
  } = runtimeWindow.__ROUGE_CV_WORLD_CATALOG_SECTIONS;
  const MIN_QUEST_CHOICES = 3;
  const MIN_SHRINE_CHOICES = 3;
  const MIN_OPPORTUNITY_VARIANTS = 6;

  function pushError(errors, message) { errors.push(message); }

  function validateWorldNodeCatalog(worldNodeCatalog) {
    const errors = [];
    const quests = worldNodeCatalog?.quests || {};
    const shrines = worldNodeCatalog?.shrines || {};
    const events = worldNodeCatalog?.events || {};
    const opportunities = worldNodeCatalog?.opportunities || {};
    const crossroadOpportunities = worldNodeCatalog?.crossroadOpportunities || {};
    const shrineOpportunities = worldNodeCatalog?.shrineOpportunities || {};
    const reserveOpportunities = worldNodeCatalog?.reserveOpportunities || {};
    const relayOpportunities = worldNodeCatalog?.relayOpportunities || {};
    const culminationOpportunities = worldNodeCatalog?.culminationOpportunities || {};
    const legacyOpportunities = worldNodeCatalog?.legacyOpportunities || {};
    const reckoningOpportunities = worldNodeCatalog?.reckoningOpportunities || {};
    const recoveryOpportunities = worldNodeCatalog?.recoveryOpportunities || {};
    const accordOpportunities = worldNodeCatalog?.accordOpportunities || {};
    const covenantOpportunities = worldNodeCatalog?.covenantOpportunities || {};
    const detourOpportunities = worldNodeCatalog?.detourOpportunities || {};
    const escalationOpportunities = worldNodeCatalog?.escalationOpportunities || {};
    const actNumbers = new Set([
      ...Object.keys(quests),
      ...Object.keys(shrines),
      ...Object.keys(events),
      ...Object.keys(opportunities),
      ...Object.keys(crossroadOpportunities),
      ...Object.keys(shrineOpportunities),
      ...Object.keys(reserveOpportunities),
      ...Object.keys(relayOpportunities),
      ...Object.keys(culminationOpportunities),
      ...Object.keys(legacyOpportunities),
      ...Object.keys(reckoningOpportunities),
      ...Object.keys(recoveryOpportunities),
      ...Object.keys(accordOpportunities),
      ...Object.keys(covenantOpportunities),
      ...Object.keys(detourOpportunities),
      ...Object.keys(escalationOpportunities),
    ]);
    const seenNodeIds = new Map();

    if (actNumbers.size === 0) {
      pushError(errors, "World-node catalog is empty.");
    }

    actNumbers.forEach((actKey) => {
      const actNumber = Number(actKey);
      const questDefinition = quests[actNumber];
      const shrineDefinition = shrines[actNumber];
      const eventDefinition = events[actNumber];
      const opportunityDefinition = opportunities[actNumber];
      const crossroadOpportunityDefinition = crossroadOpportunities[actNumber];
      const shrineOpportunityDefinition = shrineOpportunities[actNumber];
      const reserveOpportunityDefinition = reserveOpportunities[actNumber];
      const relayOpportunityDefinition = relayOpportunities[actNumber];
      const culminationOpportunityDefinition = culminationOpportunities[actNumber];
      const legacyOpportunityDefinition = legacyOpportunities[actNumber];
      const reckoningOpportunityDefinition = reckoningOpportunities[actNumber];
      const recoveryOpportunityDefinition = recoveryOpportunities[actNumber];
      const accordOpportunityDefinition = accordOpportunities[actNumber];
      const covenantOpportunityDefinition = covenantOpportunities[actNumber];
      const detourOpportunityDefinition = detourOpportunities[actNumber];
      const escalationOpportunityDefinition = escalationOpportunities[actNumber];

      [
        { definition: questDefinition, label: `worldNodes.quests.${actKey}` },
        { definition: shrineDefinition, label: `worldNodes.shrines.${actKey}` },
        { definition: eventDefinition, label: `worldNodes.events.${actKey}` },
        { definition: opportunityDefinition, label: `worldNodes.opportunities.${actKey}` },
        { definition: crossroadOpportunityDefinition, label: `worldNodes.crossroadOpportunities.${actKey}` },
        { definition: shrineOpportunityDefinition, label: `worldNodes.shrineOpportunities.${actKey}` },
        { definition: reserveOpportunityDefinition, label: `worldNodes.reserveOpportunities.${actKey}` },
        { definition: relayOpportunityDefinition, label: `worldNodes.relayOpportunities.${actKey}` },
        { definition: culminationOpportunityDefinition, label: `worldNodes.culminationOpportunities.${actKey}` },
        { definition: legacyOpportunityDefinition, label: `worldNodes.legacyOpportunities.${actKey}` },
        { definition: reckoningOpportunityDefinition, label: `worldNodes.reckoningOpportunities.${actKey}` },
        { definition: recoveryOpportunityDefinition, label: `worldNodes.recoveryOpportunities.${actKey}` },
        { definition: accordOpportunityDefinition, label: `worldNodes.accordOpportunities.${actKey}` },
        { definition: covenantOpportunityDefinition, label: `worldNodes.covenantOpportunities.${actKey}` },
        { definition: detourOpportunityDefinition, label: `worldNodes.detourOpportunities.${actKey}` },
        { definition: escalationOpportunityDefinition, label: `worldNodes.escalationOpportunities.${actKey}` },
      ].forEach(({ definition, label }) => {
        if (!definition?.id) {
          return;
        }
        const duplicateLabel = seenNodeIds.get(definition.id);
        if (duplicateLabel) {
          pushError(errors, `${label} reuses node id "${definition.id}" already claimed by ${duplicateLabel}.`);
          return;
        }
        seenNodeIds.set(definition.id, label);
      });

      const isQuestAct = actNumber in quests || actNumber in events || actNumber in opportunities;

      if (!questDefinition && isQuestAct) {
        pushError(errors, `World-node catalog is missing a quest definition for act ${actKey}.`);
      } else if (questDefinition) {
        if (!questDefinition.zoneTitle) {
          pushError(errors, `worldNodes.quests.${actKey} is missing a zoneTitle.`);
        }
        if (!Array.isArray(questDefinition.choices) || questDefinition.choices.length < MIN_QUEST_CHOICES) {
          pushError(errors, `worldNodes.quests.${actKey} must define at least ${MIN_QUEST_CHOICES} quest choices.`);
        }
        validateRewardDefinition(questDefinition, `worldNodes.quests.${actKey}`, "quest", errors);
      }

      if (!shrineDefinition) {
        pushError(errors, `World-node catalog is missing a shrine definition for act ${actKey}.`);
      } else {
        if (!shrineDefinition.zoneTitle) {
          pushError(errors, `worldNodes.shrines.${actKey} is missing a zoneTitle.`);
        }
        if (!Array.isArray(shrineDefinition.choices) || shrineDefinition.choices.length < MIN_SHRINE_CHOICES) {
          pushError(errors, `worldNodes.shrines.${actKey} must define at least ${MIN_SHRINE_CHOICES} shrine choices.`);
        }
        validateRewardDefinition(shrineDefinition, `worldNodes.shrines.${actKey}`, "shrine", errors);
      }

      if (!eventDefinition && isQuestAct) {
        pushError(errors, `World-node catalog is missing an event definition for act ${actKey}.`);
      } else if (eventDefinition) {
        if (!eventDefinition.zoneTitle) {
          pushError(errors, `worldNodes.events.${actKey} is missing a zoneTitle.`);
        }
        if (!eventDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.events.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && eventDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.events.${actKey} requires quest "${eventDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(eventDefinition?.grants, `worldNodes.events.${actKey}.grants`, errors);
      }

      const referenceState = collectActReferenceState(questDefinition, shrineDefinition);

      if (!opportunityDefinition && isQuestAct) {
        pushError(errors, `World-node catalog is missing an opportunity definition for act ${actKey}.`);
      } else if (opportunityDefinition) {
        if (!opportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!opportunityDefinition.title) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a title.`);
        }
        if (!opportunityDefinition.description) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a description.`);
        }
        if (!opportunityDefinition.summary) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a summary.`);
        }
        if (!opportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && opportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.opportunities.${actKey} requires quest "${opportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(opportunityDefinition?.grants, `worldNodes.opportunities.${actKey}.grants`, errors);

        if (!Array.isArray(opportunityDefinition.variants) || opportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing variants.`);
        } else {
          if (opportunityDefinition.variants.length < MIN_OPPORTUNITY_VARIANTS) {
            pushError(errors, `worldNodes.opportunities.${actKey} must define at least ${MIN_OPPORTUNITY_VARIANTS} variants.`);
          }
          const seenVariantIds = new Set();
          const seenRequirementSignatures = new Map();
          const knownMercenaryIds = new Set(Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {}));
          let consequenceGatedVariantCount = 0;
          const unconditionalVariantCount = opportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.opportunities.${actKey} has multiple unconditional variants.`);
          }

          opportunityDefinition.variants.forEach((variantDefinition, index) => {
            if (Array.isArray(variantDefinition?.requiresConsequenceIds) && variantDefinition.requiresConsequenceIds.length > 0) {
              consequenceGatedVariantCount += 1;
            }
            if (variantDefinition?.id) {
              if (seenVariantIds.has(variantDefinition.id)) {
                pushError(errors, `worldNodes.opportunities.${actKey} reuses variant id "${variantDefinition.id}".`);
              }
              seenVariantIds.add(variantDefinition.id);
            }
            const requirementSignature = getOpportunityVariantRequirementSignature(variantDefinition);
            const existingVariantId = seenRequirementSignatures.get(requirementSignature);
            if (existingVariantId) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey}.variants[${index}] reuses requirement signature with variant "${existingVariantId}".`
              );
            } else if (variantDefinition?.id) {
              seenRequirementSignatures.set(requirementSignature, variantDefinition.id);
            } else {
              seenRequirementSignatures.set(requirementSignature, `variants[${index}]`);
            }
            validateStringIdList(
              variantDefinition.requiresPrimaryOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFollowUpOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresConsequenceIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresMercenaryIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors
            );
            validateKnownStringIds(
              variantDefinition.requiresPrimaryOutcomeIds,
              referenceState.primaryOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors,
              "primary quest outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresFollowUpOutcomeIds,
              referenceState.followUpOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors,
              "follow-up outcome"
            );
            validateKnownStringIds(
              variantDefinition.requiresConsequenceIds,
              referenceState.consequenceIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors,
              "quest consequence"
            );
            validateKnownStringIds(
              variantDefinition.requiresFlagIds,
              referenceState.flagIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors,
              "flag"
            );
            validateKnownStringIds(
              variantDefinition.requiresMercenaryIds,
              knownMercenaryIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresMercenaryIds`,
              errors,
              "mercenary contract"
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: opportunityDefinition.id,
              },
              `worldNodes.opportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              opportunityDefinition.requiresQuestId
            );
          });

          if (consequenceGatedVariantCount === 0) {
            pushError(errors, `worldNodes.opportunities.${actKey} must include at least one consequence-gated variant.`);
          }

          const authoredStates = collectActPathStates(questDefinition, shrineDefinition);
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = opportunityDefinition.variants.some((variantDefinition) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey} has no variant covering authored path "${pathState.label}".`
              );
            }
          });

          opportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey}.variants[${index}] is unreachable from any authored quest/event/shrine path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = opportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getOpportunityVariantSpecificity(variantDefinition),
                matches: doesVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.opportunities.${actKey} has ambiguous variants for authored path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (isQuestAct) {
        validateCrossroadOpportunitySection(
          actKey,
          crossroadOpportunityDefinition,
          questDefinition,
          shrineDefinition,
          referenceState,
          errors
        );
      }

      validateShrineOpportunitySection(
        actKey,
        shrineOpportunityDefinition,
        shrineDefinition,
        referenceState,
        errors
      );

      if (!isQuestAct) {
        return;
      }

      validateLateRouteOpportunityFamilies({
        accordOpportunityDefinition,
        actKey,
        covenantOpportunityDefinition,
        detourOpportunityDefinition,
        crossroadOpportunityDefinition,
        culminationOpportunityDefinition,
        errors,
        escalationOpportunityDefinition,
        legacyOpportunityDefinition,
        opportunityDefinition,
        questDefinition,
        reckoningOpportunityDefinition,
        recoveryOpportunityDefinition,
        referenceState,
        relayOpportunityDefinition,
        reserveOpportunityDefinition,
        shrineDefinition,
        shrineOpportunityDefinition,
      });

      (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).forEach((choiceDefinition, index) => {
        if (!choiceDefinition?.followUp) {
          return;
        }
        validateRewardDefinition(
          {
            ...choiceDefinition.followUp,
            id: eventDefinition?.id || choiceDefinition.followUp.id,
          },
          `worldNodes.quests.${actKey}.choices[${index}].followUp`,
          "event",
          errors,
          eventDefinition?.requiresQuestId || ""
        );
      });
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  runtimeWindow.__ROUGE_CV_WORLD_CATALOG = {
    validateWorldNodeCatalog,
  };
})();
