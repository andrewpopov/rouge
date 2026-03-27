(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { doCombatAction, addTempClass } = runtimeWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;
  const { spawnRewardParticles } = runtimeWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;

  function getActionTarget(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest("[data-action]") as HTMLElement | null : null;
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
      // eslint-disable-next-line no-console
      if (!actionEl && typeof console !== "undefined") { console.debug("[action-dispatcher] click had no [data-action] target"); }
      return false;
    }

    const action = actionEl.dataset.action || "";
    switch (action) {
      case "auth-sign-out":
        runtimeWindow.ROGUE_AUTH?.signOut().then(() => render());
        return true;
      case "start-character-select":
        appEngine.startCharacterSelect(appState);
        render();
        return true;
      case "toggle-game-menu": {
        const panel = document.getElementById("game-menu-panel");
        if (panel) { panel.classList.toggle("game-menu__panel--open"); }
        return true;
      }
      case "toggle-scroll-map":
        appState.ui.scrollMapOpen = !appState.ui.scrollMapOpen;
        render();
        return true;
      case "toggle-route-intel":
        appState.ui.routeIntelOpen = !appState.ui.routeIntelOpen;
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
      case "focus-town-npc":
        appState.ui.townFocus = actionEl.dataset.npcId || "";
        render();
        return true;
      case "close-town-npc":
        appState.ui.townFocus = "";
        render();
        return true;
      case "open-inventory":
        appState.ui.inventoryOpen = true;
        render();
        return true;
      case "switch-inv-tab":
        appState.ui.inventoryTab = actionEl.dataset.invTab || "inventory";
        render();
        return true;
      case "close-inventory":
        appState.ui.inventoryOpen = false;
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
        addTempClass(actionEl, "merchant-card--bought", 500);
        appEngine.useTownAction(appState, actionEl.dataset.townActionId || "");
        render();
        return true;
      case "select-zone":
        appEngine.selectZone(appState, actionEl.dataset.zoneId || "");
        render();
        return true;
      case "begin-encounter":
        runtimeWindow.__ROUGE_APPROACH_BONUS.applyBonus(appState.combat, actionEl.dataset.bonus || "guard:5");
        appState.ui.exploring = false;
        render();
        return true;
      case "pick-event-card": {
        const event = appState.ui.explorationEvent;
        if (event?.pendingChoiceId) {
          runtimeWindow.ROUGE_EXPLORATION_EVENTS.applyExplorationEventChoice(
            appState.run, event, event.pendingChoiceId, appState.content, actionEl.dataset.cardId || ""
          );
          appState.ui.explorationEvent = null;
        }
        render();
        return true;
      }
      case "skip-event-card-pick":
        appState.ui.explorationEvent = null;
        render();
        return true;
      case "pick-event-choice": {
        const event = appState.ui.explorationEvent;
        if (event) {
          const choiceId = actionEl.dataset.choiceId || "";
          const choice = event.choices.find((c) => c.id === choiceId);
          if (choice?.requiresCardPick) {
            event.pendingChoiceId = choiceId;
          } else {
            runtimeWindow.ROUGE_EXPLORATION_EVENTS.applyExplorationEventChoice(
              appState.run, event, choiceId, appState.content
            );
            appState.ui.explorationEvent = null;
          }
        }
        render();
        return true;
      }
      case "skip-exploration-event":
        appState.ui.explorationEvent = null;
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
          const instanceId = actionEl.dataset.instanceId || "";
          const targetId = appState.combat.selectedEnemyId || "";
          const cardInst = appState.combat.hand.find((c: CardInstance) => c.instanceId === instanceId);
          const cardDef = cardInst ? appState.content.cardCatalog[cardInst.cardId] : null;
          if (cardDef) {
            const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
            const reduction = evo ? evo.getTreeCostReduction(cardInst!.cardId, appState.combat.deckCardIds, appState.content.cardCatalog) : 0;
            const cost = Math.max(0, cardDef.cost - reduction);
            if (appState.combat.hero.energy < cost) {
              addTempClass(actionEl, "fan-card--rejected", 400);
              return true;
            }
            if (cardDef.target === "enemy" && !appState.combat.selectedEnemyId) {
              addTempClass(actionEl, "fan-card--rejected", 400);
              return true;
            }
          }
          doCombatAction(
            appState.combat,
            () => combatEngine.playCard(appState.combat, appState.content, instanceId, targetId),
            syncCombatResultAndRender,
            { playedCardEl: actionEl }
          );
        }
        return true;
      case "melee-strike":
        if (appState.combat) {
          doCombatAction(
            appState.combat,
            () => combatEngine.meleeStrike(appState.combat, appState.content),
            syncCombatResultAndRender
          );
        }
        return true;
      case "end-turn":
        if (appState.combat) {
          doCombatAction(
            appState.combat,
            () => combatEngine.endTurn(appState.combat),
            syncCombatResultAndRender,
            { sequenceEnemyPhase: true }
          );
        }
        return true;
      case "use-potion-hero":
        if (appState.combat) {
          doCombatAction(
            appState.combat,
            () => combatEngine.usePotion(appState.combat, "hero"),
            syncCombatResultAndRender
          );
        }
        return true;
      case "use-potion-mercenary":
        if (appState.combat) {
          doCombatAction(
            appState.combat,
            () => combatEngine.usePotion(appState.combat, "mercenary"),
            syncCombatResultAndRender
          );
        }
        return true;
      case "claim-reward-choice":
        spawnRewardParticles(actionEl);
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
      case "debug-set-act": {
        const run = appState.run;
        const targetIndex = Number.parseInt(actionEl.dataset.actIndex || "0", 10);
        if (run?.acts && targetIndex >= 0 && targetIndex < run.acts.length && targetIndex !== run.currentActIndex) {
          const routeBuilder = runtimeWindow.ROUGE_RUN_ROUTE_BUILDER;
          run.currentActIndex = targetIndex;
          routeBuilder.syncCurrentActFields(run);
          run.activeZoneId = "";
          run.activeEncounterId = "";
          routeBuilder.recomputeZoneStatuses(run);
          appState.phase = appEngine.PHASES.WORLD_MAP;
          render();
        }
        return true;
      }
      case "set-preferred-class":
        appEngine.setPreferredClass(appState, actionEl.dataset.classId || "");
        render();
        return true;
      case "manage-charm": {
        const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
        if (charmSystem && appState.profile) {
          const charmAction = actionEl.dataset.charmAction || "";
          const charmId = actionEl.dataset.charmId || "";
          if (charmAction === "equip") {
            charmSystem.equipCharm(appState.profile, charmId);
          } else if (charmAction === "unequip") {
            charmSystem.unequipCharm(appState.profile, charmId);
          }
          runtimeWindow.ROUGE_PERSISTENCE?.saveProfileToStorage(appState.profile);
        }
        render();
        return true;
      }
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
