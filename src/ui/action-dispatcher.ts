(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getActionTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest("[data-action]") as HTMLElement | null;
  }

  const TOGGLE_SETTING_KEYS = new Set(["showHints", "reduceMotion", "compactMode"]);

  function buildActionHandlers(): Record<string, (ctx: ActionHandlerContext) => boolean> {
    return {
      "start-character-select"({ appState, appEngine, render }) {
        appEngine.startCharacterSelect(appState);
        render();
        return true;
      },
      "select-class"({ actionEl, appState, appEngine, render }) {
        appEngine.setSelectedClass(appState, actionEl.dataset.classId || "");
        render();
        return true;
      },
      "select-mercenary"({ actionEl, appState, appEngine, render }) {
        appEngine.setSelectedMercenary(appState, actionEl.dataset.mercenaryId || "");
        render();
        return true;
      },
      "start-run"({ appState, appEngine, render }) {
        appEngine.startRun(appState);
        render();
        return true;
      },
      "continue-saved-run"({ appState, appEngine, render }) {
        appEngine.continueSavedRun(appState);
        render();
        return true;
      },
      "prompt-abandon-saved-run"({ appState, render }) {
        appState.ui.confirmAbandonSavedRun = true;
        render();
        return true;
      },
      "cancel-abandon-saved-run"({ appState, render }) {
        appState.ui.confirmAbandonSavedRun = false;
        render();
        return true;
      },
      "confirm-abandon-saved-run"({ appState, appEngine, render }) {
        appEngine.abandonSavedRun(appState);
        render();
        return true;
      },
      "focus-town-npc"({ actionEl, appState, render }) {
        appState.ui.townFocus = actionEl.dataset.npcId || "";
        render();
        return true;
      },
      "close-town-npc"({ appState, render }) {
        appState.ui.townFocus = "";
        render();
        return true;
      },
      "leave-safe-zone"({ appState, appEngine, render }) {
        appState.ui.townFocus = "";
        appEngine.leaveSafeZone(appState);
        render();
        return true;
      },
      "return-safe-zone"({ appState, appEngine, render }) {
        appEngine.returnToSafeZone(appState);
        render();
        return true;
      },
      "use-town-action"({ actionEl, appState, appEngine, render }) {
        appEngine.useTownAction(appState, actionEl.dataset.townActionId || "");
        render();
        return true;
      },
      "select-zone"({ actionEl, appState, appEngine, render }) {
        appEngine.selectZone(appState, actionEl.dataset.zoneId || "");
        render();
        return true;
      },
      "begin-encounter"({ appState, render }) {
        appState.ui.exploring = false;
        appState.ui.explorationEvent = null;
        render();
        return true;
      },
      "pick-event-choice"({ actionEl, appState, render }) {
        const explorationEvents = runtimeWindow.ROUGE_EXPLORATION_EVENTS;
        const event = appState.ui.explorationEvent;
        const choiceId = actionEl.dataset.choiceId || "";
        if (explorationEvents && event && choiceId) {
          const choice = event.choices.find((c) => c.id === choiceId);
          if (choice?.requiresCardPick) {
            event.pendingChoiceId = choiceId;
          } else {
            explorationEvents.applyExplorationEventChoice(appState.run, event, choiceId, appState.content);
            appState.ui.explorationEvent = null;
            appState.ui.exploring = false;
          }
        }
        render();
        return true;
      },
      "pick-event-card"({ actionEl, appState, render }) {
        const explorationEvents = runtimeWindow.ROUGE_EXPLORATION_EVENTS;
        const event = appState.ui.explorationEvent;
        const cardId = actionEl.dataset.cardId || "";
        if (explorationEvents && event?.pendingChoiceId && cardId) {
          explorationEvents.applyExplorationEventChoice(appState.run, event, event.pendingChoiceId, appState.content, cardId);
          appState.ui.explorationEvent = null;
          appState.ui.exploring = false;
        }
        render();
        return true;
      },
      "skip-event-card-pick"({ appState, render }) {
        if (appState.ui.explorationEvent) {
          appState.ui.explorationEvent.pendingChoiceId = undefined;
        }
        render();
        return true;
      },
      "skip-exploration-event"({ appState, render }) {
        appState.ui.explorationEvent = null;
        appState.ui.exploring = false;
        render();
        return true;
      },
      "select-enemy"({ actionEl, appState, render }) {
        if (appState.combat) {
          appState.combat.selectedEnemyId = actionEl.dataset.enemyId || "";
          render();
        }
        return true;
      },
      "play-card"({ actionEl, appState, combatEngine, syncCombatResultAndRender }) {
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
      },
      "end-turn"({ appState, combatEngine, syncCombatResultAndRender }) {
        if (appState.combat) {
          combatEngine.endTurn(appState.combat);
          syncCombatResultAndRender();
        }
        return true;
      },
      "use-potion-hero"({ appState, combatEngine, syncCombatResultAndRender }) {
        if (appState.combat) {
          combatEngine.usePotion(appState.combat, "hero");
          syncCombatResultAndRender();
        }
        return true;
      },
      "use-potion-mercenary"({ appState, combatEngine, syncCombatResultAndRender }) {
        if (appState.combat) {
          combatEngine.usePotion(appState.combat, "mercenary");
          syncCombatResultAndRender();
        }
        return true;
      },
      "claim-reward-choice"({ actionEl, appState, appEngine, render }) {
        appEngine.claimRewardAndAdvance(appState, actionEl.dataset.choiceId || "");
        render();
        return true;
      },
      "continue-act-transition"({ appState, appEngine, render }) {
        appEngine.continueActTransition(appState);
        render();
        return true;
      },
      "return-front-door"({ appState, appEngine, render }) {
        appEngine.returnToFrontDoor(appState);
        appState.ui.hallExpanded = true;
        render();
        return true;
      },
      "expand-hall"({ actionEl, appState, render }) {
        appState.ui.hallExpanded = true;
        appState.ui.hallSection = actionEl.dataset.section || "";
        render();
        return true;
      },
      "collapse-hall"({ appState, render }) {
        appState.ui.hallExpanded = false;
        appState.ui.hallSection = "";
        render();
        return true;
      },
      "switch-hall-section"({ actionEl, appState, render }) {
        appState.ui.hallSection = actionEl.dataset.section || "";
        render();
        return true;
      },
      "set-account-progression-focus"({ actionEl, appState, appEngine, render }) {
        appEngine.setAccountProgressionFocus(appState, actionEl.dataset.accountTreeId || "");
        render();
        return true;
      },
      "toggle-profile-setting"({ actionEl, appState, appEngine, render }) {
        const key = actionEl.dataset.settingKey || "";
        if (TOGGLE_SETTING_KEYS.has(key)) {
          appEngine.updateProfileSettings(appState, { [key]: actionEl.dataset.settingValue === "true" });
          render();
          return true;
        }
        return false;
      },
      "set-preferred-class"({ actionEl, appState, appEngine, render }) {
        appEngine.setPreferredClass(appState, actionEl.dataset.classId || "");
        render();
        return true;
      },
      "set-planned-runeword"({ actionEl, appState, appEngine, render }) {
        appEngine.setPlannedRuneword(
          appState,
          actionEl.dataset.planningSlot === "armor" ? "armor" : "weapon",
          actionEl.dataset.runewordId || ""
        );
        render();
        return true;
      },
      "set-run-history-review"({ actionEl, appState, appEngine, render }) {
        appEngine.setRunHistoryReviewIndex(appState, Number.parseInt(actionEl.dataset.historyIndex || "0", 10) || 0);
        render();
        return true;
      },
      "complete-tutorial"({ actionEl, appState, appEngine, render }) {
        appEngine.completeTutorial(appState, actionEl.dataset.tutorialId || "");
        render();
        return true;
      },
      "dismiss-tutorial"({ actionEl, appState, appEngine, render }) {
        appEngine.dismissTutorial(appState, actionEl.dataset.tutorialId || "");
        render();
        return true;
      },
      "restore-tutorial"({ actionEl, appState, appEngine, render }) {
        appEngine.restoreTutorial(appState, actionEl.dataset.tutorialId || "");
        render();
        return true;
      },
    };
  }

  const actionHandlers = buildActionHandlers();

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
      case "toggle-game-menu": {
        const panel = document.getElementById("game-menu-panel");
        if (panel) panel.classList.toggle("game-menu__panel--open");
        return true;
      }
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
      case "focus-town-npc":
        appState.ui.townFocus = actionEl.dataset.npcId || "";
        render();
        return true;
      case "close-town-npc":
        appState.ui.townFocus = "";
        render();
        return true;
      case "leave-safe-zone":
        appState.ui.townFocus = "";
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
      case "begin-encounter":
        appState.ui.exploring = false;
        render();
        return true;
      case "debug-skip-encounter":
        appEngine.debugSkipEncounter(appState);
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
        appState.ui.hallExpanded = true;
        render();
        return true;
      case "expand-hall":
        appState.ui.hallExpanded = true;
        appState.ui.hallSection = actionEl.dataset.section || "";
        render();
        return true;
      case "collapse-hall":
        appState.ui.hallExpanded = false;
        appState.ui.hallSection = "";
        render();
        return true;
      case "switch-hall-section":
        appState.ui.hallSection = actionEl.dataset.section || "";
        render();
        return true;
      case "set-account-progression-focus":
        appEngine.setAccountProgressionFocus(appState, actionEl.dataset.accountTreeId || "");
        render();
        return true;
      case "toggle-profile-setting":
        if (actionEl.dataset.settingKey === "showHints") {
          appEngine.updateProfileSettings(appState, {
            showHints: actionEl.dataset.settingValue === "true",
          });
          render();
          return true;
        }
        if (actionEl.dataset.settingKey === "reduceMotion") {
          appEngine.updateProfileSettings(appState, {
            reduceMotion: actionEl.dataset.settingValue === "true",
          });
          render();
          return true;
        }
        if (actionEl.dataset.settingKey === "compactMode") {
          appEngine.updateProfileSettings(appState, {
            compactMode: actionEl.dataset.settingValue === "true",
          });
          render();
          return true;
        }
        if ((actionEl.dataset.settingKey || "").startsWith("debugMode.")) {
          const debugKey = actionEl.dataset.settingKey.split(".")[1];
          const current = appState.profile?.meta?.settings?.debugMode || {};
          appEngine.updateProfileSettings(appState, {
            debugMode: { ...current, [debugKey]: actionEl.dataset.settingValue === "true" },
          });
          render();
          return true;
        }
        return false;
      case "set-preferred-class":
        appEngine.setPreferredClass(appState, actionEl.dataset.classId || "");
        render();
        return true;
      case "set-planned-runeword":
        appEngine.setPlannedRuneword(
          appState,
          actionEl.dataset.planningSlot === "armor" ? "armor" : "weapon",
          actionEl.dataset.runewordId || ""
        );
        render();
        return true;
      case "set-run-history-review":
        appEngine.setRunHistoryReviewIndex(appState, Number.parseInt(actionEl.dataset.historyIndex || "0", 10) || 0);
        render();
        return true;
      case "complete-tutorial":
        appEngine.completeTutorial(appState, actionEl.dataset.tutorialId || "");
        render();
        return true;
      case "dismiss-tutorial":
        appEngine.dismissTutorial(appState, actionEl.dataset.tutorialId || "");
        render();
        return true;
      case "restore-tutorial":
        appEngine.restoreTutorial(appState, actionEl.dataset.tutorialId || "");
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
