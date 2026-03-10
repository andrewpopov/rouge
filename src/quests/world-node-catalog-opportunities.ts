(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  runtimeWindow.ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES =
    runtimeWindow.__ROUGE_OPP_STAGING as WorldNodeCatalogOpportunitiesApi;
})();
