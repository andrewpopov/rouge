(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    collectActPathStates,
    collectActReferenceState,
    collectShrinePathStates,
    doesShrineOpportunityVariantMatchPath,
    doesVariantMatchPath,
    getOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
    getShrineOpportunityVariantRequirementSignature,
    getShrineOpportunityVariantSpecificity,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;
  const {
    validateGrants,
    validateKnownStringIds,
    validateLateRouteOpportunityFamilies,
    validateRewardDefinition,
    validateStringIdList,
  } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES;
  const { validateRuntimeContent } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT;
  const MIN_QUEST_CHOICES = 3;
  const MIN_SHRINE_CHOICES = 3;
  const MIN_OPPORTUNITY_VARIANTS = 6;
  const MIN_CROSSROAD_OPPORTUNITY_VARIANTS = 3;
  const MIN_SHRINE_OPPORTUNITY_VARIANTS = 3;

  function pushError(errors, message) { errors.push(message); }

  function hasAtLeastOneEnemy(poolEntry) {
    return [
      ...(Array.isArray(poolEntry?.enemies) ? poolEntry.enemies : []),
      ...(Array.isArray(poolEntry?.nativeEnemies) ? poolEntry.nativeEnemies : []),
      ...(Array.isArray(poolEntry?.guestEnemiesNightmareHell) ? poolEntry.guestEnemiesNightmareHell : []),
    ].length > 0;
  }

  function validateSeedBundle(seedBundle) {
    const errors = [];
    const classEntries = Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
    const skillClasses = Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const enemyPools = Array.isArray(seedBundle?.enemyPools?.enemyPools) ? seedBundle.enemyPools.enemyPools : [];

    if (classEntries.length === 0) {
      pushError(errors, "Seed bundle is missing playable classes.");
    }

    if (skillClasses.length === 0) {
      pushError(errors, "Seed bundle is missing skills.json class progression content.");
    }

    const knownClassIds = new Set(classEntries.map((entry) => entry?.id).filter(Boolean));
    const seenSkillClassIds = new Set();
    skillClasses.forEach((entry, index) => {
      if (!entry?.classId) {
        pushError(errors, `skills.classes[${index}] is missing a classId.`);
        return;
      }
      if (!knownClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes[${index}] references unknown class "${entry.classId}".`);
      }
      if (seenSkillClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes contains duplicate classId "${entry.classId}".`);
      }
      seenSkillClassIds.add(entry.classId);

      const trees = Array.isArray(entry.trees) ? entry.trees : [];
      if (trees.length === 0) {
        pushError(errors, `skills.classes[${index}] is missing skill trees.`);
        return;
      }

      trees.forEach((tree, treeIndex) => {
        if (!tree?.id) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing an id.`);
        }
        if (!tree?.name) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing a name.`);
        }
        const skills = Array.isArray(tree?.skills) ? tree.skills : [];
        if (skills.length === 0) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing skills.`);
          return;
        }
        skills.forEach((skill, skillIndex) => {
          if (!skill?.id || !skill?.name) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing identity fields.`);
          }
          if (!Number.isFinite(Number(skill?.requiredLevel))) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing a numeric requiredLevel.`);
          }
        });
      });
    });

    classEntries.forEach((entry) => {
      if (entry?.id && !seenSkillClassIds.has(entry.id)) {
        pushError(errors, `Playable class "${entry.id}" is missing skills.json progression data.`);
      }
    });

    if (acts.length === 0) {
      pushError(errors, "Seed bundle is missing zone acts.");
    }

    const seenActs = new Set();
    acts.forEach((actSeed, index) => {
      if (!Number.isInteger(actSeed?.act)) {
        pushError(errors, `zones.acts[${index}] is missing a valid act number.`);
        return;
      }
      if (seenActs.has(actSeed.act)) {
        pushError(errors, `zones.acts contains duplicate act number ${actSeed.act}.`);
      }
      seenActs.add(actSeed.act);

      if (!actSeed?.boss?.id) {
        pushError(errors, `Act ${actSeed.act} is missing a boss id.`);
      } else if (!bossEntries.some((entry) => entry.id === actSeed.boss.id)) {
        pushError(errors, `Act ${actSeed.act} boss "${actSeed.boss.id}" has no matching bosses entry.`);
      }

      const poolEntry = enemyPools.find((entry) => entry.act === actSeed.act) || null;
      if (!poolEntry) {
        pushError(errors, `Act ${actSeed.act} is missing an enemy pool entry.`);
      } else if (!hasAtLeastOneEnemy(poolEntry)) {
        pushError(errors, `Act ${actSeed.act} enemy pool does not contain any enemies.`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

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

      if (!questDefinition) {
        pushError(errors, `World-node catalog is missing a quest definition for act ${actKey}.`);
      } else {
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

      if (!eventDefinition) {
        pushError(errors, `World-node catalog is missing an event definition for act ${actKey}.`);
      } else {
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

      if (!opportunityDefinition) {
        pushError(errors, `World-node catalog is missing an opportunity definition for act ${actKey}.`);
      } else {
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

      if (!crossroadOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a crossroad opportunity definition for act ${actKey}.`);
      } else {
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
          const unconditionalVariantCount = crossroadOpportunityDefinition.variants.filter((variantDefinition) => {
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

          crossroadOpportunityDefinition.variants.forEach((variantDefinition, index) => {
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
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = crossroadOpportunityDefinition.variants.some((variantDefinition) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey} has no variant covering authored crossroad path "${pathState.label}".`
              );
            }
          });

          crossroadOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.crossroadOpportunities.${actKey}.variants[${index}] is unreachable from any authored quest/event/shrine crossroad path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = crossroadOpportunityDefinition.variants
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
                `worldNodes.crossroadOpportunities.${actKey} has ambiguous variants for authored crossroad path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      if (!shrineOpportunityDefinition) {
        pushError(errors, `World-node catalog is missing a shrine opportunity definition for act ${actKey}.`);
      } else {
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
          const unconditionalVariantCount = shrineOpportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresShrineOutcomeIds) || variantDefinition.requiresShrineOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresMercenaryIds) || variantDefinition.requiresMercenaryIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.shrineOpportunities.${actKey} has multiple unconditional variants.`);
          }

          shrineOpportunityDefinition.variants.forEach((variantDefinition, index) => {
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
          authoredStates.forEach((pathState) => {
            const hasMatchingVariant = shrineOpportunityDefinition.variants.some((variantDefinition) => {
              return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasMatchingVariant) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey} has no variant covering authored shrine path "${pathState.label}".`
              );
            }
          });

          shrineOpportunityDefinition.variants.forEach((variantDefinition, index) => {
            const hasReachablePath = authoredStates.some((pathState) => {
              return doesShrineOpportunityVariantMatchPath(variantDefinition, pathState);
            });
            if (!hasReachablePath) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey}.variants[${index}] is unreachable from any authored shrine path.`
              );
            }
          });

          authoredStates.forEach((pathState) => {
            const matchingVariants = shrineOpportunityDefinition.variants
              .map((variantDefinition, index) => ({
                index,
                specificity: getShrineOpportunityVariantSpecificity(variantDefinition),
                matches: doesShrineOpportunityVariantMatchPath(variantDefinition, pathState),
              }))
              .filter((entry) => entry.matches);
            const maxSpecificity = matchingVariants.reduce((maxValue, entry) => Math.max(maxValue, entry.specificity), 0);
            const mostSpecificMatches = matchingVariants.filter((entry) => entry.specificity === maxSpecificity);
            if (mostSpecificMatches.length > 1) {
              pushError(
                errors,
                `worldNodes.shrineOpportunities.${actKey} has ambiguous variants for authored shrine path "${pathState.label}": ${mostSpecificMatches
                  .map((entry) => `variants[${entry.index}]`)
                  .join(", ")}.`
              );
            }
          });
        }
      }

      validateLateRouteOpportunityFamilies({
        accordOpportunityDefinition,
        actKey,
        covenantOpportunityDefinition,
        crossroadOpportunityDefinition,
        culminationOpportunityDefinition,
        errors,
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

  function assertValid(report) {
    if (report.ok) {
      return;
    }
    throw new Error(`Content validation failed:\n- ${report.errors.join("\n- ")}`);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR = {
    validateSeedBundle,
    assertValidSeedBundle(seedBundle) {
      assertValid(validateSeedBundle(seedBundle));
    },
    validateRuntimeContent,
    assertValidRuntimeContent(content) {
      assertValid(validateRuntimeContent(content));
    },
    validateWorldNodeCatalog,
    assertValidWorldNodeCatalog(worldNodeCatalog) {
      assertValid(validateWorldNodeCatalog(worldNodeCatalog));
    },
  };
})();
