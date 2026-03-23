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

  /* ── Card 3D tilt on hover (event delegation) ── */

  let currentTiltCard: HTMLElement | null = null;

  function clearTilt(): void {
    if (currentTiltCard) {
      currentTiltCard.style.removeProperty("transform");
      currentTiltCard = null;
    }
  }

  root.addEventListener("mousemove", (event) => {
    const card = (event.target as Element).closest?.(".fan-card") as HTMLElement | null;
    if (!card || card.classList.contains("fan-card--disabled")) {
      clearTilt();
      return;
    }
    if (card !== currentTiltCard) {
      clearTilt();
      currentTiltCard = card;
    }
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 14;
    const tiltY = (x - 0.5) * 14;
    card.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-10px) scale(1.08)`;
  });

  root.addEventListener("mouseleave", clearTilt, true);

  /* ── Parallax backdrop on mouse ── */

  root.addEventListener("mousemove", (event) => {
    const backdrop = root.querySelector(".stage__backdrop") as HTMLElement | null;
    if (!backdrop) { return; }
    const x = (event.clientX / window.innerWidth - 0.5) * 6;
    const y = (event.clientY / window.innerHeight - 0.5) * 4;
    backdrop.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
  });

  if (window.ROGUE_AUTH) {
    window.ROGUE_AUTH.initializeGoogleAuth();
    window.ROGUE_AUTH.onAuthChange(() => render());
  }

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
