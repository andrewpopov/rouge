(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface LateRouteVariantInput {
    id: string;
    title: string;
    description: string;
    summary: string;
    grants?: RewardGrants;
    requiresFlagIds?: string[];
    choice: {
      outcomeId: string;
      title: string;
      description: string;
      consequenceId: string;
      flagIds?: string[];
      extraEffects?: RewardChoiceEffect[];
    };
  }

  function nodeOutcomeEffect(
    nodeType: string, nodeId: string, outcomeId: string, outcomeTitle: string, flagIds: string[] = []
  ): RewardChoiceEffect {
    return {
      kind: "record_node_outcome",
      nodeType,
      nodeId,
      outcomeId,
      outcomeTitle,
      flagIds: [...flagIds],
    };
  }

  function questConsequenceEffect(
    questId: string, outcomeId: string, outcomeTitle: string, consequenceId: string, flagIds: string[] = []
  ): RewardChoiceEffect {
    return {
      kind: "record_quest_consequence",
      questId,
      outcomeId,
      outcomeTitle,
      consequenceId,
      flagIds: [...flagIds],
    };
  }

  function buildOpportunityChoiceFactory(subtitle: string) {
    return (
      nodeId: string, questId: string, outcomeId: string,
      title: string, description: string, consequenceId: string,
      flagIds: string[] = [], extraEffects: RewardChoiceEffect[] = []
    ): WorldNodeChoiceDefinition => ({
      id: outcomeId,
      title,
      subtitle,
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    });
  }

  function buildLateRouteVariant(
    choiceBuilder: (...args: unknown[]) => WorldNodeChoiceDefinition,
    nodeId: string, questId: string, variantDefinition: LateRouteVariantInput
  ): ReserveOpportunityVariantDefinition {
    return {
      id: variantDefinition.id,
      title: variantDefinition.title,
      description: variantDefinition.description,
      summary: variantDefinition.summary,
      grants: { ...(variantDefinition.grants || { gold: 0, xp: 0, potions: 0 }) },
      requiresFlagIds: [...(Array.isArray(variantDefinition.requiresFlagIds) ? variantDefinition.requiresFlagIds : [])],
      choices: [
        choiceBuilder(
          nodeId,
          questId,
          variantDefinition.choice.outcomeId,
          variantDefinition.choice.title,
          variantDefinition.choice.description,
          variantDefinition.choice.consequenceId,
          variantDefinition.choice.flagIds,
          variantDefinition.choice.extraEffects
        ),
      ],
    };
  }

  runtimeWindow.__ROUGE_OPP_HELPERS = {
    nodeOutcomeEffect,
    questConsequenceEffect,
    buildOpportunityChoiceFactory,
    buildLateRouteVariant,
  };
})();
