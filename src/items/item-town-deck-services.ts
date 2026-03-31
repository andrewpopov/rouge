(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const blacksmithApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_BLACKSMITH as {
    buildBlacksmithActions(run: RunState, content: GameContent): TownAction[];
    applyBlacksmithAction(run: RunState, content: GameContent, actionId: string): ActionResult;
  };
  const sageApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SAGE as {
    buildSageActions(run: RunState, content: GameContent): TownAction[];
    applySageAction(run: RunState, content: GameContent, actionId: string): ActionResult;
  };
  const gamblerApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_GAMBLER as {
    buildGamblerActions(run: RunState): TownAction[];
    applyGamblerAction(run: RunState, content: GameContent, actionId: string): ActionResult;
  };

  runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES = {
    buildBlacksmithActions: blacksmithApi.buildBlacksmithActions,
    applyBlacksmithAction: blacksmithApi.applyBlacksmithAction,
    buildSageActions: sageApi.buildSageActions,
    applySageAction: sageApi.applySageAction,
    buildGamblerActions: gamblerApi.buildGamblerActions,
    applyGamblerAction: gamblerApi.applyGamblerAction,
  };
})();
