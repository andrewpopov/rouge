(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function buildDebugBar(debug: DebugModeConfig): string {
    const flag = (key: string, label: string, active: boolean) =>
      `<button class="debug-flag ${active ? "debug-flag--on" : ""}"
        data-action="toggle-profile-setting"
        data-setting-key="debugMode.${key}"
        data-setting-value="${String(!active)}">${label}</button>`;

    return `<div class="debug-bar">
      <span class="debug-bar__label">\u{1F41E} DEBUG</span>
      ${flag("skipBattles", "Skip Battles", debug.skipBattles)}
      ${flag("invulnerable", "Invulnerable", debug.invulnerable)}
      ${flag("oneHitKill", "1-Hit Kill", debug.oneHitKill)}
      ${flag("infiniteGold", "\u221E Gold", debug.infiniteGold)}
    </div>`;
  }

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

    const debug = appState.profile?.meta?.settings?.debugMode;
    const debugBar = debug?.enabled ? buildDebugBar(debug) : "";

    // Render into a wrapper so the debug bar persists above
    const stateWithContent = { ...appState, content };
    const phaseRoot = document.createElement("div");

    switch (appState.phase) {
      case services.appEngine.PHASES.FRONT_DOOR:
        runtimeWindow.ROUGE_FRONT_DOOR_VIEW.render(phaseRoot, appState, services);
        break;
      case services.appEngine.PHASES.CHARACTER_SELECT:
        runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW.render(phaseRoot, appState, services);
        break;
      case services.appEngine.PHASES.SAFE_ZONE:
        runtimeWindow.ROUGE_SAFE_ZONE_VIEW.render(phaseRoot, stateWithContent, services);
        break;
      case services.appEngine.PHASES.WORLD_MAP:
        runtimeWindow.ROUGE_WORLD_MAP_VIEW.render(phaseRoot, appState, services);
        break;
      case services.appEngine.PHASES.ENCOUNTER:
        runtimeWindow.ROUGE_COMBAT_VIEW.render(phaseRoot, appState, services);
        break;
      case services.appEngine.PHASES.REWARD:
        runtimeWindow.ROUGE_REWARD_VIEW.render(phaseRoot, stateWithContent, services);
        break;
      case services.appEngine.PHASES.ACT_TRANSITION:
        runtimeWindow.ROUGE_ACT_TRANSITION_VIEW.render(phaseRoot, appState, services);
        break;
      case services.appEngine.PHASES.RUN_COMPLETE:
      case services.appEngine.PHASES.RUN_FAILED:
        runtimeWindow.ROUGE_RUN_SUMMARY_VIEW.render(phaseRoot, appState, services);
        break;
      default:
        common.renderBootState(phaseRoot, bootState, services.renderUtils);
    }

    root.innerHTML = debugBar + phaseRoot.innerHTML;
  }

  runtimeWindow.ROUGE_APP_SHELL = {
    render,
  };
})();
