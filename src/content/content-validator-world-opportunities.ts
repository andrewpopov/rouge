(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & {
    __ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES?: ContentValidatorWorldOpportunitiesApi;
  };

  const {
    validateGrants,
    validateKnownStringIds,
    validateRewardDefinition,
    validateStringIdList,
  } = runtimeWindow.__ROUGE_CVWO_HELPERS;

  const {
    validateReserveOpportunityFamily,
    validateRelayOpportunityFamily,
    validateCulminationOpportunityFamily,
    validateLegacyOpportunityFamily,
    validateReckoningOpportunityFamily,
  } = runtimeWindow.__ROUGE_CVWO_FAMILIES_A;

  const {
    validateRecoveryOpportunityFamily,
    validateAccordOpportunityFamily,
    validateCovenantOpportunityFamily,
    validateDetourOpportunityFamily,
    validateEscalationOpportunityFamily,
  } = runtimeWindow.__ROUGE_CVWO_FAMILIES_B;

  function validateLateRouteOpportunityFamilies(options: ContentValidatorLateRouteOpportunityValidationArgs) {
    validateReserveOpportunityFamily(options);
    validateRelayOpportunityFamily(options);
    validateCulminationOpportunityFamily(options);
    validateLegacyOpportunityFamily(options);
    validateReckoningOpportunityFamily(options);
    validateRecoveryOpportunityFamily(options);
    validateAccordOpportunityFamily(options);
    validateCovenantOpportunityFamily(options);
    validateDetourOpportunityFamily(options);
    validateEscalationOpportunityFamily(options);
  }

  runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES = {
    validateGrants,
    validateKnownStringIds,
    validateLateRouteOpportunityFamilies,
    validateRewardDefinition,
    validateStringIdList,
  };
})();
