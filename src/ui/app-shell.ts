(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function buildDebugBar(debug: DebugModeConfig, appState: AppState): string {
    const flag = (key: string, label: string, active: boolean) =>
      `<button class="debug-flag ${active ? "debug-flag--on" : ""}"
        data-action="toggle-profile-setting"
        data-setting-key="debugMode.${key}"
        data-setting-value="${String(!active)}">${label}</button>`;

    const run = appState.run;
    const actPicker = run?.acts?.length > 1
      ? `<span class="debug-bar__sep">|</span>
         <span class="debug-bar__label">Act</span>
         ${run.acts.map((act: ActState, i: number) =>
           `<button class="debug-flag ${i === run.currentActIndex ? "debug-flag--on" : ""}"
              data-action="debug-set-act" data-act-index="${i}">${act.actNumber}</button>`
         ).join("")}`
      : "";

    return `<div class="debug-bar">
      <span class="debug-bar__label">\u{1F41E} DEBUG</span>
      ${flag("skipBattles", "Skip Battles", debug.skipBattles)}
      ${flag("invulnerable", "Invulnerable", debug.invulnerable)}
      ${flag("oneHitKill", "1-Hit Kill", debug.oneHitKill)}
      ${flag("infiniteGold", "\u221E Gold", debug.infiniteGold)}
      ${actPicker}
      ${debug.skipBattles && appState.phase === "encounter"
        ? `<span class="debug-bar__sep">|</span>
           <button class="debug-flag debug-flag--on" data-action="debug-skip-encounter">Skip \u25B6</button>`
        : ""}
    </div>`;
  }

  /** Phases that represent an active run */
  const RUN_PHASES = new Set([
    "safe_zone", "world_map", "encounter", "reward",
    "act_transition", "run_complete", "run_failed",
  ]);

  function buildGameMenu(appState: AppState): string {
    const debug = appState.profile?.meta?.settings?.debugMode;
    const debugEnabled = debug?.enabled ?? false;

    return `<div class="game-menu">
      <button class="game-menu__toggle" data-action="toggle-game-menu">\u2630</button>
      <div class="game-menu__panel" id="game-menu-panel">
        <div class="game-menu__section">
          <button class="game-menu__item" data-action="open-inventory">\u{1F392} Inventory</button>
          <button class="game-menu__item" data-action="return-safe-zone">\u2190 Return to Town</button>
          <button class="game-menu__item game-menu__item--danger" data-action="prompt-abandon-saved-run">\u2717 Abandon Run</button>
        </div>
        <div class="game-menu__section">
          <button class="game-menu__item ${debugEnabled ? "game-menu__item--active" : ""}"
            data-action="toggle-profile-setting"
            data-setting-key="debugMode.enabled"
            data-setting-value="${String(!debugEnabled)}">\u{1F41E} Debug ${debugEnabled ? "ON" : "OFF"}</button>
        </div>
      </div>
    </div>`;
  }

  function render(root: HTMLElement, { appState, baseContent, bootState }: AppShellRenderConfig): void {
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
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
        break;
      case services.appEngine.PHASES.CHARACTER_SELECT:
        runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW.render(root, appState, services);
        break;
      case services.appEngine.PHASES.SAFE_ZONE:
        runtimeWindow.ROUGE_SAFE_ZONE_VIEW.render(root, stateWithContent, services);
        break;
      case services.appEngine.PHASES.WORLD_MAP:
        runtimeWindow.ROUGE_WORLD_MAP_VIEW.render(root, appState, services);
        break;
      case services.appEngine.PHASES.ENCOUNTER:
        runtimeWindow.ROUGE_COMBAT_VIEW.render(root, appState, services);
        break;
      case services.appEngine.PHASES.REWARD:
        runtimeWindow.ROUGE_REWARD_VIEW.render(root, stateWithContent, services);
        break;
      case services.appEngine.PHASES.ACT_TRANSITION:
        runtimeWindow.ROUGE_ACT_TRANSITION_VIEW.render(root, appState, services);
        break;
      case services.appEngine.PHASES.RUN_COMPLETE:
      case services.appEngine.PHASES.RUN_FAILED:
        runtimeWindow.ROUGE_RUN_SUMMARY_VIEW.render(root, appState, services);
        break;
      default:
        common.renderBootState(root, bootState, services.renderUtils);
    }

    const debug = appState.profile?.meta?.settings?.debugMode;
    if (debug?.enabled) {
      root.innerHTML = buildDebugBar(debug, appState) + root.innerHTML;
    }

    if (RUN_PHASES.has(appState.phase)) {
      root.innerHTML = buildGameMenu(appState) + root.innerHTML;
    }

    if (appState.ui.inventoryOpen && appState.run && RUN_PHASES.has(appState.phase)) {
      root.innerHTML += `<div class="inv-overlay" data-action="close-inventory">
        <div data-action="noop">${runtimeWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(appState, services)}</div>
      </div>`;
    }
  }

  runtimeWindow.ROUGE_APP_SHELL = {
    render,
  };
})();
