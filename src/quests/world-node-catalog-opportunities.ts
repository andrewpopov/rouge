(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const EXPECTED_OPP_KEYS: (keyof WorldNodeCatalogOpportunitiesApi)[] = [
    "additionalOpportunityVariants",
    "shrineOpportunityDefinitions",
    "crossroadOpportunityDefinitions",
    "reserveOpportunityDefinitions",
    "relayOpportunityDefinitions",
    "culminationOpportunityDefinitions",
    "legacyOpportunityDefinitions",
    "reckoningOpportunityDefinitions",
    "recoveryOpportunityDefinitions",
    "accordOpportunityDefinitions",
    "covenantOpportunityDefinitions",
    "detourOpportunityDefinitions",
    "escalationOpportunityDefinitions",
  ];

  const staging = runtimeWindow.__ROUGE_OPP_STAGING || {};
  const missing = EXPECTED_OPP_KEYS.filter((key) => !staging[key]);
  if (missing.length > 0) {
    console.warn(`OPP_STAGING incomplete — missing: ${missing.join(", ")}. Check script load order in index.html.`);
  }

  runtimeWindow.ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES =
    staging as WorldNodeCatalogOpportunitiesApi;
})();
