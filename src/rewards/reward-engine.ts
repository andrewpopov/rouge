(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const builder = runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER;
  const apply = runtimeWindow.__ROUGE_REWARD_ENGINE_APPLY;

  runtimeWindow.ROUGE_REWARD_ENGINE = {
    annotateCardRewardMetadata: archetypes.annotateCardRewardMetadata,
    getCardRewardRole: archetypes.getCardRewardRole,
    getCardArchetypeTags: archetypes.getCardArchetypeTags,
    computeArchetypeScores: archetypes.computeArchetypeScores,
    syncArchetypeScores: archetypes.syncArchetypeScores,
    getArchetypeScoreEntries: archetypes.getArchetypeScoreEntries,
    getDominantArchetype: archetypes.getDominantArchetype,
    getArchetypeCatalog: archetypes.getArchetypeCatalog,
    getArchetypeWeaponFamilies: archetypes.getArchetypeWeaponFamilies,
    getStrategicWeaponFamilies: archetypes.getStrategicWeaponFamilies,
    buildRewardChoices: builder.buildRewardChoices,
    applyChoice: apply.applyChoice,
    getUpgradableCardIds: builder.getUpgradableCardIds,
    resolveReinforceBuildReward: builder.resolveReinforceBuildReward,
    resolveSupportBuildReward: builder.resolveSupportBuildReward,
    resolvePivotBuildReward: builder.resolvePivotBuildReward,
  };
})();
