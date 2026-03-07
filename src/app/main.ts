(() => {
  const root = document.getElementById("appRoot");
  if (!root) {
    throw new Error("Missing #appRoot container.");
  }

  const {
    ROUGE_ACTION_DISPATCHER: actionDispatcher,
    ROUGE_APP_ENGINE: appEngine,
    ROUGE_APP_SHELL: appShell,
    ROUGE_CLASS_REGISTRY: classRegistry,
    ROUGE_COMBAT_ENGINE: combatEngine,
    ROUGE_ENCOUNTER_REGISTRY: encounterRegistry,
    ROUGE_GAME_CONTENT: baseContent,
    ROUGE_ITEM_SYSTEM: itemSystem,
    ROUGE_SEED_LOADER: seedLoader,
  } = window;

  let appState: AppState | null = null;
  const bootState: BootState = {
    status: "loading",
    error: "",
  };

  function render(): void {
    appShell.render(root, {
      appState,
      baseContent,
      bootState,
    });
  }

  function syncCombatResultAndRender(): void {
    if (appState) {
      appEngine.syncEncounterOutcome(appState);
    }
    render();
  }

  root.addEventListener("click", (event) => {
    actionDispatcher.handleClick({
      target: event.target,
      appState,
      appEngine,
      combatEngine,
      render,
      syncCombatResultAndRender,
    });
  });

  render();

  seedLoader
    .loadSeedBundle()
    .then((seedBundle) => {
      const classRuntimeContent = classRegistry.createRuntimeContent(baseContent, seedBundle);
      const itemizedContent = itemSystem.createRuntimeContent(classRuntimeContent, seedBundle);
      const runtimeContent = encounterRegistry.createRuntimeContent(itemizedContent, seedBundle);
      appState = appEngine.createAppState({
        content: runtimeContent,
        seedBundle,
        combatEngine,
      });
      bootState.status = "ready";
      render();
    })
    .catch((error) => {
      bootState.status = "error";
      bootState.error = error instanceof Error ? error.message : String(error);
      render();
    });
})();
