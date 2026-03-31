(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const dataApi = registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_DATA as {
    CARD_ROLE_LABELS: Record<CardRewardRole, string>;
    CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number>;
    SUPPORT_ROLE_PRIORITY: Record<CardRewardRole, number>;
  };
  const classificationApi = registryWindow.__ROUGE_REWARD_ENGINE_CARD_CLASSIFICATION as {
    getCardClassId(cardId: string, card?: CardDefinition | null): string;
    getCardTree(cardId: string): string;
  };
  const policyApi = registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_POLICY as Omit<
    RewardEngineArchetypesApi,
    | "CARD_ROLE_LABELS"
    | "CARD_ROLE_SCORE_WEIGHTS"
    | "SUPPORT_ROLE_PRIORITY"
    | "getCardClassId"
    | "getCardTree"
  >;

  runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES = {
    CARD_ROLE_LABELS: dataApi.CARD_ROLE_LABELS,
    CARD_ROLE_SCORE_WEIGHTS: dataApi.CARD_ROLE_SCORE_WEIGHTS,
    SUPPORT_ROLE_PRIORITY: dataApi.SUPPORT_ROLE_PRIORITY,
    getCardClassId: classificationApi.getCardClassId,
    getCardTree: classificationApi.getCardTree,
    ...policyApi,
  };
})();
