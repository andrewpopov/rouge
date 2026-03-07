(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, { appState, baseContent, bootState }: AppShellRenderConfig): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const services = common.getServices();

    if (!appState) {
      common.renderBootState(root, bootState, services.renderUtils);
      return;
    }

    const content = appState.content || baseContent;
    if (!content) {
      common.renderBootState(root, { status: "error", error: "Game content is missing." }, services.renderUtils);
      return;
    }

    const stateWithContent = { ...appState, content };
    switch (appState.phase) {
      case services.appEngine.PHASES.FRONT_DOOR:
        runtimeWindow.ROUGE_FRONT_DOOR_VIEW.render(root, appState, services);
        return;
      case services.appEngine.PHASES.CHARACTER_SELECT:
        runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW.render(root, appState, services);
        return;
      case services.appEngine.PHASES.SAFE_ZONE:
        runtimeWindow.ROUGE_SAFE_ZONE_VIEW.render(root, stateWithContent, services);
        return;
      case services.appEngine.PHASES.WORLD_MAP:
        runtimeWindow.ROUGE_WORLD_MAP_VIEW.render(root, appState, services);
        return;
      case services.appEngine.PHASES.ENCOUNTER:
        runtimeWindow.ROUGE_COMBAT_VIEW.render(root, appState, services);
        return;
      case services.appEngine.PHASES.REWARD:
        runtimeWindow.ROUGE_REWARD_VIEW.render(root, stateWithContent, services);
        return;
      case services.appEngine.PHASES.ACT_TRANSITION:
        runtimeWindow.ROUGE_ACT_TRANSITION_VIEW.render(root, appState, services);
        return;
      case services.appEngine.PHASES.RUN_COMPLETE:
      case services.appEngine.PHASES.RUN_FAILED:
        runtimeWindow.ROUGE_RUN_SUMMARY_VIEW.render(root, appState, services);
        return;
      default:
        common.renderBootState(root, bootState, services.renderUtils);
    }
  }

  runtimeWindow.ROUGE_APP_SHELL = {
    render,
  };
})();
