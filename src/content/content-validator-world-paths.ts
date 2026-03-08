(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function collectEffectFlagIds(effects) {
    return (Array.isArray(effects) ? effects : []).reduce((flagIds, effect) => {
      (Array.isArray(effect?.flagIds) ? effect.flagIds : []).forEach((flagId) => {
        if (typeof flagId === "string" && flagId) {
          flagIds.add(flagId);
        }
      });
      return flagIds;
    }, new Set<string>());
  }

  function getQuestOutcomeEffect(choiceDefinition) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect) => {
      return effect.kind === "record_quest_outcome";
    });
  }

  function getQuestFollowUpEffect(choiceDefinition) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect) => {
      return effect.kind === "record_quest_follow_up";
    });
  }

  function getNodeOutcomeEffect(choiceDefinition, nodeType) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === nodeType;
    });
  }

  function getMercenaryStates() {
    const mercenaryIds = Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {});
    return mercenaryIds.length > 0
      ? mercenaryIds.map((mercenaryId) => ({
          labelSuffix: ` + merc:${mercenaryId}`,
          mercenaryId,
        }))
      : [
          {
            labelSuffix: "",
            mercenaryId: "",
          },
        ];
  }

  function collectActReferenceState(questDefinition, shrineDefinition) {
    const primaryOutcomeIds = new Set<string>();
    const followUpOutcomeIds = new Set<string>();
    const consequenceIds = new Set<string>();
    const shrineOutcomeIds = new Set<string>();
    const flagIds = new Set<string>();

    (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).forEach((choiceDefinition) => {
      const questEffect = getQuestOutcomeEffect(choiceDefinition);
      if (questEffect?.outcomeId) {
        primaryOutcomeIds.add(questEffect.outcomeId);
      }
      collectEffectFlagIds(choiceDefinition?.effects).forEach((flagId) => flagIds.add(flagId));

      (Array.isArray(choiceDefinition?.followUp?.choices) ? choiceDefinition.followUp.choices : []).forEach((followUpChoiceDefinition) => {
        const followUpEffect = getQuestFollowUpEffect(followUpChoiceDefinition);
        if (followUpEffect?.outcomeId) {
          followUpOutcomeIds.add(followUpEffect.outcomeId);
        }
        if (followUpEffect?.consequenceId) {
          consequenceIds.add(followUpEffect.consequenceId);
        }
        collectEffectFlagIds(followUpChoiceDefinition?.effects).forEach((flagId) => flagIds.add(flagId));
      });
    });

    (Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : []).forEach((choiceDefinition) => {
      const shrineEffect = getNodeOutcomeEffect(choiceDefinition, "shrine");
      if (shrineEffect?.outcomeId) {
        shrineOutcomeIds.add(shrineEffect.outcomeId);
      }
      collectEffectFlagIds(choiceDefinition?.effects).forEach((flagId) => flagIds.add(flagId));
    });

    return {
      primaryOutcomeIds,
      followUpOutcomeIds,
      consequenceIds,
      shrineOutcomeIds,
      flagIds,
    };
  }

  function collectActPathStates(questDefinition, shrineDefinition, options: { includeEmptyShrineState?: boolean } = {}) {
    const shrineChoices = Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : [];
    const shrineFlagSets = [
      ...(options.includeEmptyShrineState === false
        ? []
        : [
            {
              labelSuffix: "",
              flagIds: [],
            },
          ]),
      ...shrineChoices.map((choiceDefinition) => ({
        labelSuffix: ` + shrine:${choiceDefinition?.id || "unknown"}`,
        flagIds: Array.from(collectEffectFlagIds(choiceDefinition?.effects)),
      })),
    ];
    const mercenaryStates = getMercenaryStates();

    return (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).reduce((states, choiceDefinition) => {
      const questEffect = getQuestOutcomeEffect(choiceDefinition);
      if (!questEffect?.outcomeId) {
        return states;
      }

      const primaryFlags = Array.from(collectEffectFlagIds(choiceDefinition?.effects));
      (Array.isArray(choiceDefinition?.followUp?.choices) ? choiceDefinition.followUp.choices : []).forEach((followUpChoiceDefinition) => {
        const followUpEffect = getQuestFollowUpEffect(followUpChoiceDefinition);
        if (!followUpEffect?.outcomeId || !followUpEffect?.consequenceId) {
          return;
        }

        const followUpFlags = Array.from(collectEffectFlagIds(followUpChoiceDefinition?.effects));
        shrineFlagSets.forEach((shrineState) => {
          mercenaryStates.forEach((mercenaryState) => {
            states.push({
              label: `${questEffect.outcomeId} -> ${followUpEffect.outcomeId}${shrineState.labelSuffix}${mercenaryState.labelSuffix}`,
              primaryOutcomeId: questEffect.outcomeId,
              followUpOutcomeId: followUpEffect.outcomeId,
              consequenceIds: [followUpEffect.consequenceId],
              flagIds: Array.from(new Set([...primaryFlags, ...followUpFlags, ...shrineState.flagIds])),
              mercenaryId: mercenaryState.mercenaryId,
            });
          });
        });
      });

      return states;
    }, []);
  }

  function collectShrinePathStates(shrineDefinition) {
    const mercenaryStates = getMercenaryStates();

    return (Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : []).reduce((states, choiceDefinition) => {
      const shrineEffect = getNodeOutcomeEffect(choiceDefinition, "shrine");
      if (!shrineEffect?.outcomeId) {
        return states;
      }

      const flagIds = Array.from(collectEffectFlagIds(choiceDefinition?.effects));
      mercenaryStates.forEach((mercenaryState) => {
        states.push({
          label: `${shrineEffect.outcomeId}${mercenaryState.labelSuffix}`,
          shrineOutcomeId: shrineEffect.outcomeId,
          flagIds,
          mercenaryId: mercenaryState.mercenaryId,
        });
      });
      return states;
    }, []);
  }

  function collectOpportunityChoiceStates(opportunityDefinition) {
    return (Array.isArray(opportunityDefinition?.variants) ? opportunityDefinition.variants : []).reduce((states, variantDefinition) => {
      (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).forEach((choiceDefinition) => {
        const nodeEffect = getNodeOutcomeEffect(choiceDefinition, "opportunity");
        if (!nodeEffect?.outcomeId) {
          return;
        }

        states.push({
          label: nodeEffect.outcomeId,
          flagIds: Array.from(collectEffectFlagIds(choiceDefinition?.effects)),
        });
      });
      return states;
    }, []);
  }

  function collectReservePathStates(opportunityDefinition, shrineOpportunityDefinition, crossroadOpportunityDefinition) {
    const routeStates = collectOpportunityChoiceStates(opportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);
    const crossroadStates = collectOpportunityChoiceStates(crossroadOpportunityDefinition);

    return routeStates.reduce((states, routeState) => {
      shrineStates.forEach((shrineState) => {
        crossroadStates.forEach((crossroadState) => {
          states.push({
            label: `${routeState.label} + ${shrineState.label} + ${crossroadState.label}`,
            flagIds: Array.from(new Set([...routeState.flagIds, ...shrineState.flagIds, ...crossroadState.flagIds])),
          });
        });
      });
      return states;
    }, []);
  }

  function collectRelayPathStates(reserveOpportunityDefinition) {
    return collectOpportunityChoiceStates(reserveOpportunityDefinition);
  }

  function collectCulminationPathStates(questDefinition, shrineDefinition, relayOpportunityDefinition) {
    const actPathStates = collectActPathStates(questDefinition, shrineDefinition, {
      includeEmptyShrineState: false,
    });
    const relayStates = collectOpportunityChoiceStates(relayOpportunityDefinition);

    return actPathStates.reduce((states, actPathState) => {
      relayStates.forEach((relayState) => {
        states.push({
          label: `${actPathState.label} + relay:${relayState.label}`,
          primaryOutcomeId: actPathState.primaryOutcomeId,
          followUpOutcomeId: actPathState.followUpOutcomeId,
          consequenceIds: [...actPathState.consequenceIds],
          flagIds: Array.from(new Set([...actPathState.flagIds, ...relayState.flagIds])),
          mercenaryId: actPathState.mercenaryId,
        });
      });
      return states;
    }, []);
  }

  function collectLegacyPathStates(culminationOpportunityDefinition) {
    return collectOpportunityChoiceStates(culminationOpportunityDefinition);
  }

  function collectReckoningPathStates(culminationOpportunityDefinition, reserveOpportunityDefinition) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const reserveStates = collectOpportunityChoiceStates(reserveOpportunityDefinition);

    return culminationStates.reduce((states, culminationState) => {
      reserveStates.forEach((reserveState) => {
        states.push({
          label: `${reserveState.label} + culmination:${culminationState.label}`,
          flagIds: Array.from(new Set([...reserveState.flagIds, ...culminationState.flagIds])),
        });
      });
      return states;
    }, []);
  }

  function collectRecoveryPathStates(culminationOpportunityDefinition, shrineOpportunityDefinition) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);

    return culminationStates.reduce((states, culminationState) => {
      shrineStates.forEach((shrineState) => {
        states.push({
          label: `${shrineState.label} + culmination:${culminationState.label}`,
          flagIds: Array.from(new Set([...shrineState.flagIds, ...culminationState.flagIds])),
        });
      });
      return states;
    }, []);
  }

  function collectAccordPathStates(culminationOpportunityDefinition, shrineOpportunityDefinition, crossroadOpportunityDefinition) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);
    const crossroadStates = collectOpportunityChoiceStates(crossroadOpportunityDefinition);

    return culminationStates.reduce((states, culminationState) => {
      shrineStates.forEach((shrineState) => {
        crossroadStates.forEach((crossroadState) => {
          states.push({
            label: `${shrineState.label} + ${crossroadState.label} + culmination:${culminationState.label}`,
            flagIds: Array.from(new Set([...shrineState.flagIds, ...crossroadState.flagIds, ...culminationState.flagIds])),
          });
        });
      });
      return states;
    }, []);
  }

  function collectCovenantPathStates(
    legacyOpportunityDefinition,
    reckoningOpportunityDefinition,
    recoveryOpportunityDefinition,
    accordOpportunityDefinition
  ) {
    const legacyStates = collectOpportunityChoiceStates(legacyOpportunityDefinition);
    const reckoningStates = collectOpportunityChoiceStates(reckoningOpportunityDefinition);
    const recoveryStates = collectOpportunityChoiceStates(recoveryOpportunityDefinition);
    const accordStates = collectOpportunityChoiceStates(accordOpportunityDefinition);

    return legacyStates.reduce((states, legacyState) => {
      reckoningStates.forEach((reckoningState) => {
        recoveryStates.forEach((recoveryState) => {
          accordStates.forEach((accordState) => {
            states.push({
              label: `${legacyState.label} + ${reckoningState.label} + ${recoveryState.label} + ${accordState.label}`,
              flagIds: Array.from(new Set([...legacyState.flagIds, ...reckoningState.flagIds, ...recoveryState.flagIds, ...accordState.flagIds])),
            });
          });
        });
      });
      return states;
    }, []);
  }

  function normalizeRequirementIds(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return "-";
    }

    return Array.from(new Set(values.filter((value) => typeof value === "string" && value))).sort().join(",");
  }

  function countRequiredValues(values) {
    return Array.isArray(values) ? new Set(values.filter((value) => typeof value === "string" && value)).size : 0;
  }

  function getOpportunityVariantRequirementSignature(variantDefinition) {
    return [
      `primary:${normalizeRequirementIds(variantDefinition?.requiresPrimaryOutcomeIds)}`,
      `followUp:${normalizeRequirementIds(variantDefinition?.requiresFollowUpOutcomeIds)}`,
      `consequence:${normalizeRequirementIds(variantDefinition?.requiresConsequenceIds)}`,
      `flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`,
      `mercenaries:${normalizeRequirementIds(variantDefinition?.requiresMercenaryIds)}`,
    ].join("|");
  }

  function getShrineOpportunityVariantRequirementSignature(variantDefinition) {
    return [
      `shrine:${normalizeRequirementIds(variantDefinition?.requiresShrineOutcomeIds)}`,
      `flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`,
      `mercenaries:${normalizeRequirementIds(variantDefinition?.requiresMercenaryIds)}`,
    ].join("|");
  }

  function getReserveOpportunityVariantRequirementSignature(variantDefinition) {
    return [`flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`].join("|");
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

  function matchesRequiredValue(requiredIds, value) {
    return !Array.isArray(requiredIds) || requiredIds.length === 0 || requiredIds.includes(value);
  }

  function includesRequiredValues(requiredIds, availableIds) {
    if (!Array.isArray(requiredIds) || requiredIds.length === 0) {
      return true;
    }

    return requiredIds.every((requiredId) => availableIds.includes(requiredId));
  }

  function doesVariantMatchPath(variantDefinition, pathState) {
    return (
      matchesRequiredValue(variantDefinition?.requiresPrimaryOutcomeIds, pathState.primaryOutcomeId) &&
      matchesRequiredValue(variantDefinition?.requiresFollowUpOutcomeIds, pathState.followUpOutcomeId) &&
      includesRequiredValues(variantDefinition?.requiresConsequenceIds, pathState.consequenceIds) &&
      includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds) &&
      matchesRequiredValue(variantDefinition?.requiresMercenaryIds, pathState.mercenaryId)
    );
  }

  function doesShrineOpportunityVariantMatchPath(variantDefinition, pathState) {
    return (
      matchesRequiredValue(variantDefinition?.requiresShrineOutcomeIds, pathState.shrineOutcomeId) &&
      includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds) &&
      matchesRequiredValue(variantDefinition?.requiresMercenaryIds, pathState.mercenaryId)
    );
  }

  function doesReserveOpportunityVariantMatchPath(variantDefinition, pathState) {
    return includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS = {
    collectEffectFlagIds,
    collectActReferenceState,
    collectActPathStates,
    collectShrinePathStates,
    collectOpportunityChoiceStates,
    collectReservePathStates,
    collectRelayPathStates,
    collectCulminationPathStates,
    collectLegacyPathStates,
    collectReckoningPathStates,
    collectRecoveryPathStates,
    collectAccordPathStates,
    collectCovenantPathStates,
    getOpportunityVariantRequirementSignature,
    getShrineOpportunityVariantRequirementSignature,
    getReserveOpportunityVariantRequirementSignature,
    getOpportunityVariantSpecificity,
    getShrineOpportunityVariantSpecificity,
    getReserveOpportunityVariantSpecificity,
    doesVariantMatchPath,
    doesShrineOpportunityVariantMatchPath,
    doesReserveOpportunityVariantMatchPath,
  };
})();
