(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function nodeOutcomeEffect(nodeType, nodeId, outcomeId, outcomeTitle, flagIds = []) {
    return {
      kind: "record_node_outcome",
      nodeType,
      nodeId,
      outcomeId,
      outcomeTitle,
      flagIds: [...flagIds],
    };
  }

  function questConsequenceEffect(questId, outcomeId, outcomeTitle, consequenceId, flagIds = []) {
    return {
      kind: "record_quest_consequence",
      questId,
      outcomeId,
      outcomeTitle,
      consequenceId,
      flagIds: [...flagIds],
    };
  }

  function buildOpportunityChoice(subtitle, nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle,
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildLateRouteVariant(choiceBuilder, nodeId, questId, variantDefinition) {
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
    buildOpportunityChoice,
    buildLateRouteVariant,
  };
})();
