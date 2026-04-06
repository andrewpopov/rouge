(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;

  function createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel {
    const modelApi = registryWindow.__ROUGE_SAFE_ZONE_OPS_MODEL as {
      createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel;
    };
    return modelApi.createOperationsModel(appState, services);
  }

  function buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string {
    const opsMarkup = runtimeWindow.__ROUGE_SAFE_ZONE_OPS_MARKUP;
    const operations = model || createOperationsModel(appState, services);
    return opsMarkup.buildOperationsMarkupFromModel(operations, appState, services);
  }

  function buildOperationsSections(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel) {
    const opsMarkup = runtimeWindow.__ROUGE_SAFE_ZONE_OPS_MARKUP;
    const operations = model || createOperationsModel(appState, services);
    return opsMarkup.buildOperationsSectionsFromModel(operations, appState, services);
  }

  runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW = {
    createOperationsModel,
    buildOperationsMarkup,
    buildOperationsSections,
  };
})();
