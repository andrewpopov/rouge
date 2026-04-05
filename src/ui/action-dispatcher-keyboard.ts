(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const RUN_SUMMARY_STEP_ORDER = ["finale", "ledger", "archive"] as const;

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return target.isContentEditable
      || target.tagName === "INPUT"
      || target.tagName === "TEXTAREA"
      || target.tagName === "SELECT";
  }

  function setRunSummaryStep(appState: AppState, nextStep: string): boolean {
    const validSteps: readonly string[] = RUN_SUMMARY_STEP_ORDER;
    if (!validSteps.includes(nextStep)) {
      return false;
    }
    const currentStep = appState.ui.runSummaryStep || "finale";
    const currentIndex = RUN_SUMMARY_STEP_ORDER.indexOf(currentStep as typeof RUN_SUMMARY_STEP_ORDER[number]);
    const nextIndex = RUN_SUMMARY_STEP_ORDER.indexOf(nextStep as typeof RUN_SUMMARY_STEP_ORDER[number]);
    if (nextIndex > currentIndex) {
      appState.ui.runSummaryStepDirection = "forward";
    } else if (nextIndex < currentIndex) {
      appState.ui.runSummaryStepDirection = "backward";
    } else {
      appState.ui.runSummaryStepDirection = "none";
    }
    appState.ui.runSummaryStep = nextStep as typeof RUN_SUMMARY_STEP_ORDER[number];
    return true;
  }

  function handleKeydown({
    event,
    appState,
    appEngine,
    render,
  }: ActionDispatcherConfig & { event: KeyboardEvent }): boolean {
    if (!appState || isTypingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }

    const inRunSummary = appState.phase === appEngine.PHASES.RUN_COMPLETE || appState.phase === appEngine.PHASES.RUN_FAILED;
    if (appState.phase === appEngine.PHASES.FRONT_DOOR && appState.ui.spellbookOpen && event.key === "Escape") {
      event.preventDefault();
      appState.ui.spellbookOpen = false;
      render();
      return true;
    }
    if (appState.ui.trainingView.open && event.key === "Escape") {
      event.preventDefault();
      appEngine.closeTrainingView(appState);
      render();
      return true;
    }
    if (appState.phase === appEngine.PHASES.ENCOUNTER && appState.ui.combatPileView && event.key === "Escape") {
      event.preventDefault();
      appState.ui.combatPileView = "";
      render();
      return true;
    }
    if (!inRunSummary) {
      return false;
    }

    const currentStep = appState.ui.runSummaryStep || "finale";
    const currentIndex = RUN_SUMMARY_STEP_ORDER.indexOf(currentStep as typeof RUN_SUMMARY_STEP_ORDER[number]);
    if (currentIndex < 0) {
      return false;
    }

    if (event.key === "ArrowRight" && currentIndex < RUN_SUMMARY_STEP_ORDER.length - 1) {
      event.preventDefault();
      setRunSummaryStep(appState, RUN_SUMMARY_STEP_ORDER[currentIndex + 1]);
      render();
      return true;
    }

    if (event.key === "ArrowLeft" && currentIndex > 0) {
      event.preventDefault();
      setRunSummaryStep(appState, RUN_SUMMARY_STEP_ORDER[currentIndex - 1]);
      render();
      return true;
    }

    return false;
  }

  runtimeWindow.__ROUGE_ACTION_DISPATCHER_KEYBOARD = {
    handleKeydown,
    setRunSummaryStep,
  };
})();
