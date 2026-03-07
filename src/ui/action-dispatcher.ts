(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getActionTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest("[data-action]") as HTMLElement | null;
  }

  function handleClick({
    target,
    appState,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  }: ActionDispatcherConfig): boolean {
    const actionEl = getActionTarget(target);
    if (!actionEl || !appState) {
      return false;
    }

    const action = actionEl.dataset.action || "";
    switch (action) {
      case "start-character-select":
        appEngine.startCharacterSelect(appState);
        render();
        return true;
      case "select-class":
        appEngine.setSelectedClass(appState, actionEl.dataset.classId || "");
        render();
        return true;
      case "select-mercenary":
        appEngine.setSelectedMercenary(appState, actionEl.dataset.mercenaryId || "");
        render();
        return true;
      case "start-run":
        appEngine.startRun(appState);
        render();
        return true;
      case "continue-saved-run":
        appEngine.continueSavedRun(appState);
        render();
        return true;
      case "prompt-abandon-saved-run":
        appState.ui.confirmAbandonSavedRun = true;
        render();
        return true;
      case "cancel-abandon-saved-run":
        appState.ui.confirmAbandonSavedRun = false;
        render();
        return true;
      case "confirm-abandon-saved-run":
        appEngine.abandonSavedRun(appState);
        render();
        return true;
      case "leave-safe-zone":
        appEngine.leaveSafeZone(appState);
        render();
        return true;
      case "return-safe-zone":
        appEngine.returnToSafeZone(appState);
        render();
        return true;
      case "use-town-action":
        appEngine.useTownAction(appState, actionEl.dataset.townActionId || "");
        render();
        return true;
      case "select-zone":
        appEngine.selectZone(appState, actionEl.dataset.zoneId || "");
        render();
        return true;
      case "select-enemy":
        if (appState.combat) {
          appState.combat.selectedEnemyId = actionEl.dataset.enemyId || "";
          render();
        }
        return true;
      case "play-card":
        if (appState.combat) {
          combatEngine.playCard(
            appState.combat,
            appState.content,
            actionEl.dataset.instanceId || "",
            appState.combat.selectedEnemyId || ""
          );
          syncCombatResultAndRender();
        }
        return true;
      case "end-turn":
        if (appState.combat) {
          combatEngine.endTurn(appState.combat);
          syncCombatResultAndRender();
        }
        return true;
      case "use-potion-hero":
        if (appState.combat) {
          combatEngine.usePotion(appState.combat, "hero");
          syncCombatResultAndRender();
        }
        return true;
      case "use-potion-mercenary":
        if (appState.combat) {
          combatEngine.usePotion(appState.combat, "mercenary");
          syncCombatResultAndRender();
        }
        return true;
      case "claim-reward-choice":
        appEngine.claimRewardAndAdvance(appState, actionEl.dataset.choiceId || "");
        render();
        return true;
      case "continue-act-transition":
        appEngine.continueActTransition(appState);
        render();
        return true;
      case "return-front-door":
        appEngine.returnToFrontDoor(appState);
        render();
        return true;
      default:
        return false;
    }
  }

  runtimeWindow.ROUGE_ACTION_DISPATCHER = {
    handleClick,
  };
})();
