(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function collectEffectFlagIds(effects: RewardChoiceEffect[] | null | undefined) {
    return (Array.isArray(effects) ? effects : []).reduce((flagIds: Set<string>, effect: RewardChoiceEffect) => {
      (Array.isArray(effect?.flagIds) ? effect.flagIds : []).forEach((flagId: string) => {
        if (typeof flagId === "string" && flagId) {
          flagIds.add(flagId);
        }
      });
      return flagIds;
    }, new Set<string>());
  }

  function getQuestOutcomeEffect(choiceDefinition: WorldNodeChoiceDefinition | null | undefined) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect: RewardChoiceEffect) => {
      return effect.kind === "record_quest_outcome";
    });
  }

  function getQuestFollowUpEffect(choiceDefinition: WorldNodeChoiceDefinition | null | undefined) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect: RewardChoiceEffect) => {
      return effect.kind === "record_quest_follow_up";
    });
  }

  function getNodeOutcomeEffect(choiceDefinition: WorldNodeChoiceDefinition | null | undefined, nodeType: string) {
    return (Array.isArray(choiceDefinition?.effects) ? choiceDefinition.effects : []).find((effect: RewardChoiceEffect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === nodeType;
    });
  }

  function getMercenaryStates() {
    const mercenaryIds = Object.keys(runtimeWindow.ROUGE_GAME_CONTENT?.mercenaryCatalog || {});
    return mercenaryIds.length > 0
      ? mercenaryIds.map((mercenaryId: string) => ({
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

  function collectActReferenceState(questDefinition: QuestNodeDefinition | null | undefined, shrineDefinition: ShrineNodeDefinition | null | undefined) {
    const primaryOutcomeIds = new Set<string>();
    const followUpOutcomeIds = new Set<string>();
    const consequenceIds = new Set<string>();
    const shrineOutcomeIds = new Set<string>();
    const flagIds = new Set<string>();

    (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).forEach((choiceDefinition: WorldNodeChoiceDefinition) => {
      const questEffect = getQuestOutcomeEffect(choiceDefinition);
      if (questEffect?.outcomeId) {
        primaryOutcomeIds.add(questEffect.outcomeId);
      }
      collectEffectFlagIds(choiceDefinition?.effects).forEach((flagId: string) => flagIds.add(flagId));

      (Array.isArray(choiceDefinition?.followUp?.choices) ? choiceDefinition.followUp.choices : []).forEach((followUpChoiceDefinition: WorldNodeChoiceDefinition) => {
        const followUpEffect = getQuestFollowUpEffect(followUpChoiceDefinition);
        if (followUpEffect?.outcomeId) {
          followUpOutcomeIds.add(followUpEffect.outcomeId);
        }
        if (followUpEffect?.consequenceId) {
          consequenceIds.add(followUpEffect.consequenceId);
        }
        collectEffectFlagIds(followUpChoiceDefinition?.effects).forEach((flagId: string) => flagIds.add(flagId));
      });
    });

    (Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : []).forEach((choiceDefinition: WorldNodeChoiceDefinition) => {
      const shrineEffect = getNodeOutcomeEffect(choiceDefinition, "shrine");
      if (shrineEffect?.outcomeId) {
        shrineOutcomeIds.add(shrineEffect.outcomeId);
      }
      collectEffectFlagIds(choiceDefinition?.effects).forEach((flagId: string) => flagIds.add(flagId));
    });

    return {
      primaryOutcomeIds,
      followUpOutcomeIds,
      consequenceIds,
      shrineOutcomeIds,
      flagIds,
    };
  }

  function collectActPathStates(questDefinition: QuestNodeDefinition | null | undefined, shrineDefinition: ShrineNodeDefinition | null | undefined, options: { includeEmptyShrineState?: boolean } = {}) {
    const shrineChoices = Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : [];
    const shrineFlagSets = [
      ...(options.includeEmptyShrineState === false
        ? []
        : [
            {
              labelSuffix: "",
              flagIds: [] as string[],
            },
          ]),
      ...shrineChoices.map((choiceDefinition: WorldNodeChoiceDefinition) => ({
        labelSuffix: ` + shrine:${choiceDefinition?.id || "unknown"}`,
        flagIds: Array.from(collectEffectFlagIds(choiceDefinition?.effects)),
      })),
    ];
    const mercenaryStates = getMercenaryStates();

    return (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).reduce((states: ContentValidatorActPathState[], choiceDefinition: WorldNodeChoiceDefinition) => {
      const questEffect = getQuestOutcomeEffect(choiceDefinition);
      if (!questEffect?.outcomeId) {
        return states;
      }

      const primaryFlags = Array.from(collectEffectFlagIds(choiceDefinition?.effects));
      (Array.isArray(choiceDefinition?.followUp?.choices) ? choiceDefinition.followUp.choices : []).forEach((followUpChoiceDefinition: WorldNodeChoiceDefinition) => {
        const followUpEffect = getQuestFollowUpEffect(followUpChoiceDefinition);
        if (!followUpEffect?.outcomeId || !followUpEffect?.consequenceId) {
          return;
        }

        const followUpFlags = Array.from(collectEffectFlagIds(followUpChoiceDefinition?.effects));
        shrineFlagSets.forEach((shrineState: { labelSuffix: string; flagIds: string[] }) => {
          mercenaryStates.forEach((mercenaryState: { labelSuffix: string; mercenaryId: string }) => {
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

  function collectShrinePathStates(shrineDefinition: ShrineNodeDefinition | null | undefined) {
    const mercenaryStates = getMercenaryStates();

    return (Array.isArray(shrineDefinition?.choices) ? shrineDefinition.choices : []).reduce((states: ContentValidatorShrinePathState[], choiceDefinition: WorldNodeChoiceDefinition) => {
      const shrineEffect = getNodeOutcomeEffect(choiceDefinition, "shrine");
      if (!shrineEffect?.outcomeId) {
        return states;
      }

      const flagIds = Array.from(collectEffectFlagIds(choiceDefinition?.effects));
      mercenaryStates.forEach((mercenaryState: { labelSuffix: string; mercenaryId: string }) => {
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

  function collectOpportunityChoiceStates(opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    return (Array.isArray(opportunityDefinition?.variants) ? opportunityDefinition.variants : []).reduce((states: ContentValidatorFlagPathState[], variantDefinition: { choices?: WorldNodeChoiceDefinition[] }) => {
      (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).forEach((choiceDefinition: WorldNodeChoiceDefinition) => {
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

  function collectReservePathStates(opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const routeStates = collectOpportunityChoiceStates(opportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);
    const crossroadStates = collectOpportunityChoiceStates(crossroadOpportunityDefinition);

    return routeStates.reduce((states: ContentValidatorFlagPathState[], routeState: ContentValidatorFlagPathState) => {
      shrineStates.forEach((shrineState: ContentValidatorFlagPathState) => {
        crossroadStates.forEach((crossroadState: ContentValidatorFlagPathState) => {
          states.push({
            label: `${routeState.label} + ${shrineState.label} + ${crossroadState.label}`,
            flagIds: Array.from(new Set([...routeState.flagIds, ...shrineState.flagIds, ...crossroadState.flagIds])),
          });
        });
      });
      return states;
    }, []);
  }

  function collectRelayPathStates(reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    return collectOpportunityChoiceStates(reserveOpportunityDefinition);
  }

  function collectCulminationPathStates(questDefinition: QuestNodeDefinition | null | undefined, shrineDefinition: ShrineNodeDefinition | null | undefined, relayOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const actPathStates = collectActPathStates(questDefinition, shrineDefinition, {
      includeEmptyShrineState: false,
    });
    const relayStates = collectOpportunityChoiceStates(relayOpportunityDefinition);

    return actPathStates.reduce((states: ContentValidatorActPathState[], actPathState: ContentValidatorActPathState) => {
      relayStates.forEach((relayState: ContentValidatorFlagPathState) => {
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

  function collectLegacyPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    return collectOpportunityChoiceStates(culminationOpportunityDefinition);
  }

  function collectReckoningPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const reserveStates = collectOpportunityChoiceStates(reserveOpportunityDefinition);

    return culminationStates.reduce((states: ContentValidatorFlagPathState[], culminationState: ContentValidatorFlagPathState) => {
      reserveStates.forEach((reserveState: ContentValidatorFlagPathState) => {
        states.push({
          label: `${reserveState.label} + culmination:${culminationState.label}`,
          flagIds: Array.from(new Set([...reserveState.flagIds, ...culminationState.flagIds])),
        });
      });
      return states;
    }, []);
  }

  function collectRecoveryPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);

    return culminationStates.reduce((states: ContentValidatorFlagPathState[], culminationState: ContentValidatorFlagPathState) => {
      shrineStates.forEach((shrineState: ContentValidatorFlagPathState) => {
        states.push({
          label: `${shrineState.label} + culmination:${culminationState.label}`,
          flagIds: Array.from(new Set([...shrineState.flagIds, ...culminationState.flagIds])),
        });
      });
      return states;
    }, []);
  }

  function collectAccordPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const culminationStates = collectOpportunityChoiceStates(culminationOpportunityDefinition);
    const shrineStates = collectOpportunityChoiceStates(shrineOpportunityDefinition);
    const crossroadStates = collectOpportunityChoiceStates(crossroadOpportunityDefinition);

    return culminationStates.reduce((states: ContentValidatorFlagPathState[], culminationState: ContentValidatorFlagPathState) => {
      shrineStates.forEach((shrineState: ContentValidatorFlagPathState) => {
        crossroadStates.forEach((crossroadState: ContentValidatorFlagPathState) => {
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
    legacyOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reckoningOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    recoveryOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    accordOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ) {
    const legacyStates = collectOpportunityChoiceStates(legacyOpportunityDefinition);
    const reckoningStates = collectOpportunityChoiceStates(reckoningOpportunityDefinition);
    const recoveryStates = collectOpportunityChoiceStates(recoveryOpportunityDefinition);
    const accordStates = collectOpportunityChoiceStates(accordOpportunityDefinition);

    return legacyStates.reduce((states: ContentValidatorFlagPathState[], legacyState: ContentValidatorFlagPathState) => {
      reckoningStates.forEach((reckoningState: ContentValidatorFlagPathState) => {
        recoveryStates.forEach((recoveryState: ContentValidatorFlagPathState) => {
          accordStates.forEach((accordState: ContentValidatorFlagPathState) => {
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

  function collectDetourPathStates(covenantOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, recoveryOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, accordOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const covenantStates = collectOpportunityChoiceStates(covenantOpportunityDefinition);
    const recoveryStates = collectOpportunityChoiceStates(recoveryOpportunityDefinition);
    const accordStates = collectOpportunityChoiceStates(accordOpportunityDefinition);

    return covenantStates.reduce((states: ContentValidatorFlagPathState[], covenantState: ContentValidatorFlagPathState) => {
      recoveryStates.forEach((recoveryState: ContentValidatorFlagPathState) => {
        accordStates.forEach((accordState: ContentValidatorFlagPathState) => {
          states.push({
            label: `${recoveryState.label} + ${accordState.label} + covenant:${covenantState.label}`,
            flagIds: Array.from(new Set([...recoveryState.flagIds, ...accordState.flagIds, ...covenantState.flagIds])),
          });
        });
      });
      return states;
    }, []);
  }

  function collectEscalationPathStates(covenantOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, legacyOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined, reckoningOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined) {
    const covenantStates = collectOpportunityChoiceStates(covenantOpportunityDefinition);
    const legacyStates = collectOpportunityChoiceStates(legacyOpportunityDefinition);
    const reckoningStates = collectOpportunityChoiceStates(reckoningOpportunityDefinition);

    return covenantStates.reduce((states: ContentValidatorFlagPathState[], covenantState: ContentValidatorFlagPathState) => {
      legacyStates.forEach((legacyState: ContentValidatorFlagPathState) => {
        reckoningStates.forEach((reckoningState: ContentValidatorFlagPathState) => {
          states.push({
            label: `${legacyState.label} + ${reckoningState.label} + covenant:${covenantState.label}`,
            flagIds: Array.from(new Set([...legacyState.flagIds, ...reckoningState.flagIds, ...covenantState.flagIds])),
          });
        });
      });
      return states;
    }, []);
  }

  function normalizeRequirementIds(values: string[] | null | undefined) {
    if (!Array.isArray(values) || values.length === 0) {
      return "-";
    }

    return Array.from(new Set(values.filter((value: string) => typeof value === "string" && value))).sort().join(",");
  }

  function countRequiredValues(values: string[] | null | undefined) {
    return Array.isArray(values) ? new Set(values.filter((value: string) => typeof value === "string" && value)).size : 0;
  }

  function getOpportunityVariantRequirementSignature(variantDefinition: OpportunityNodeVariantDefinition | null | undefined) {
    return [
      `primary:${normalizeRequirementIds(variantDefinition?.requiresPrimaryOutcomeIds)}`,
      `followUp:${normalizeRequirementIds(variantDefinition?.requiresFollowUpOutcomeIds)}`,
      `consequence:${normalizeRequirementIds(variantDefinition?.requiresConsequenceIds)}`,
      `flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`,
      `mercenaries:${normalizeRequirementIds(variantDefinition?.requiresMercenaryIds)}`,
    ].join("|");
  }

  function getShrineOpportunityVariantRequirementSignature(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined) {
    return [
      `shrine:${normalizeRequirementIds(variantDefinition?.requiresShrineOutcomeIds)}`,
      `flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`,
      `mercenaries:${normalizeRequirementIds(variantDefinition?.requiresMercenaryIds)}`,
    ].join("|");
  }

  function getReserveOpportunityVariantRequirementSignature(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined) {
    return [`flags:${normalizeRequirementIds(variantDefinition?.requiresFlagIds)}`].join("|");
  }

  function getOpportunityVariantSpecificity(variantDefinition: OpportunityNodeVariantDefinition | null | undefined) {
    return (
      countRequiredValues(variantDefinition?.requiresPrimaryOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresFollowUpOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresConsequenceIds) +
      countRequiredValues(variantDefinition?.requiresFlagIds) +
      countRequiredValues(variantDefinition?.requiresMercenaryIds)
    );
  }

  function getShrineOpportunityVariantSpecificity(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined) {
    return (
      countRequiredValues(variantDefinition?.requiresShrineOutcomeIds) +
      countRequiredValues(variantDefinition?.requiresFlagIds) +
      countRequiredValues(variantDefinition?.requiresMercenaryIds)
    );
  }

  function getReserveOpportunityVariantSpecificity(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined) {
    return countRequiredValues(variantDefinition?.requiresFlagIds);
  }

  function matchesRequiredValue(requiredIds: string[] | null | undefined, value: string) {
    return !Array.isArray(requiredIds) || requiredIds.length === 0 || requiredIds.includes(value);
  }

  function includesRequiredValues(requiredIds: string[] | null | undefined, availableIds: string[]) {
    if (!Array.isArray(requiredIds) || requiredIds.length === 0) {
      return true;
    }

    return requiredIds.every((requiredId: string) => availableIds.includes(requiredId));
  }

  function doesVariantMatchPath(variantDefinition: OpportunityNodeVariantDefinition | null | undefined, pathState: ContentValidatorActPathState) {
    return (
      matchesRequiredValue(variantDefinition?.requiresPrimaryOutcomeIds, pathState.primaryOutcomeId) &&
      matchesRequiredValue(variantDefinition?.requiresFollowUpOutcomeIds, pathState.followUpOutcomeId) &&
      includesRequiredValues(variantDefinition?.requiresConsequenceIds, pathState.consequenceIds) &&
      includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds) &&
      matchesRequiredValue(variantDefinition?.requiresMercenaryIds, pathState.mercenaryId)
    );
  }

  function doesShrineOpportunityVariantMatchPath(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined, pathState: ContentValidatorShrinePathState) {
    return (
      matchesRequiredValue(variantDefinition?.requiresShrineOutcomeIds, pathState.shrineOutcomeId) &&
      includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds) &&
      matchesRequiredValue(variantDefinition?.requiresMercenaryIds, pathState.mercenaryId)
    );
  }

  function doesReserveOpportunityVariantMatchPath(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined, pathState: ContentValidatorFlagPathState) {
    return includesRequiredValues(variantDefinition?.requiresFlagIds, pathState.flagIds);
  }

  runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS = {
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
    collectDetourPathStates,
    collectEscalationPathStates,
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
