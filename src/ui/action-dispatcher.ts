(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { doCombatAction, addTempClass } = runtimeWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;
  const { spawnRewardParticles } = runtimeWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;
  const { handleKeydown, setRunSummaryStep } = runtimeWindow.__ROUGE_ACTION_DISPATCHER_KEYBOARD;
  const CHARACTER_SELECT_TAB_ORDER = ["overview", "kit", "playstyle", "paths"] as const;
  const TOWN_OVERVIEW_TAB_ORDER = ["departure", "loadout", "services", "account", "districts", "debug"] as const;

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
      case "noop":
        return true;
      case "auth-sign-out":
        runtimeWindow.ROGUE_AUTH?.signOut().then(() => render());
        return true;
      case "start-character-select":
        appState.ui.spellbookOpen = false;
        appEngine.startCharacterSelect(appState);
        render();
        return true;
      case "toggle-game-menu": {
        const panel = document.getElementById("game-menu-panel");
        if (panel) {
          const nextOpen = !panel.classList.contains("game-menu__panel--open");
          panel.classList.toggle("game-menu__panel--open", nextOpen);
          if (actionEl) {
            actionEl.setAttribute("aria-expanded", nextOpen ? "true" : "false");
          }
        }
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
      case "select-character-select-tab": {
        const nextTab = actionEl.dataset.characterSelectTab || "overview";
        if (CHARACTER_SELECT_TAB_ORDER.includes(nextTab as typeof CHARACTER_SELECT_TAB_ORDER[number])) {
          appState.ui.characterSelectTab = nextTab as typeof CHARACTER_SELECT_TAB_ORDER[number];
          render();
          return true;
        }
        return false;
      }
      case "shift-character-select-tab": {
        const direction = actionEl.dataset.direction === "backward" ? -1 : 1;
        const currentIndex = Math.max(0, CHARACTER_SELECT_TAB_ORDER.indexOf(appState.ui.characterSelectTab));
        const nextIndex = (currentIndex + direction + CHARACTER_SELECT_TAB_ORDER.length) % CHARACTER_SELECT_TAB_ORDER.length;
        appState.ui.characterSelectTab = CHARACTER_SELECT_TAB_ORDER[nextIndex];
        render();
        return true;
      }
      case "open-bloodline-record": {
        const modal = document.querySelector("[data-record-modal]") as HTMLElement | null;
        if (modal) {
          modal.hidden = false;
        }
        return true;
      }
      case "close-bloodline-record": {
        const modal = (actionEl.closest("[data-record-modal]") as HTMLElement | null)
          || (document.querySelector("[data-record-modal]") as HTMLElement | null);
        if (modal) {
          modal.hidden = true;
        }
        return true;
      }
      case "open-class-path": {
        const modalId = actionEl.dataset.pathModalId || "";
        const modal = modalId ? document.getElementById(modalId) as HTMLElement | null : null;
        if (modal) {
          modal.hidden = false;
        }
        return true;
      }
      case "close-class-path": {
        const modal = actionEl.closest("[data-path-modal]") as HTMLElement | null;
        if (modal) {
          modal.hidden = true;
        }
        return true;
      }
      case "select-mercenary":
        appEngine.setSelectedMercenary(appState, actionEl.dataset.mercenaryId || "");
        render();
        return true;
      case "start-run":
        appEngine.startRun(appState);
        render();
        return true;
      case "continue-saved-run":
        appState.ui.spellbookOpen = false;
        appEngine.continueSavedRun(appState);
        if (appState.run?.guide?.overlayKind && (appState.phase === appEngine.PHASES.WORLD_MAP || appState.phase === appEngine.PHASES.ACT_TRANSITION)) {
          appEngine.continueActGuide(appState);
        }
        render();
        return true;
      case "open-spellbook":
        appState.ui.spellbookOpen = true;
        render();
        return true;
      case "close-spellbook":
        appState.ui.spellbookOpen = false;
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
      case "select-town-overview-tab": {
        const nextTab = actionEl.dataset.townOverviewTab || "departure";
        if (TOWN_OVERVIEW_TAB_ORDER.includes(nextTab as typeof TOWN_OVERVIEW_TAB_ORDER[number])) {
          appState.ui.townOverviewTab = nextTab as typeof TOWN_OVERVIEW_TAB_ORDER[number];
          render();
          return true;
        }
        return false;
      }
      case "open-training-view":
        appEngine.openTrainingView(appState, actionEl.dataset.trainingSource === "act_transition" ? "act_transition" : "safe_zone");
        render();
        return true;
      case "close-training-view":
        appEngine.closeTrainingView(appState);
        render();
        return true;
      case "select-training-tree":
        appEngine.selectTrainingTree(appState, actionEl.dataset.treeId || "");
        render();
        return true;
      case "select-training-skill":
        appEngine.selectTrainingSkill(appState, actionEl.dataset.skillId || "");
        render();
        return true;
      case "select-training-slot": {
        const rawSlotKey = actionEl.dataset.slotKey || "";
        const slotKey = rawSlotKey === "slot1" || rawSlotKey === "slot2" || rawSlotKey === "slot3" ? rawSlotKey : "";
        appEngine.selectTrainingSlot(appState, slotKey);
        render();
        return true;
      }
      case "set-training-mode": {
        const rawMode = actionEl.dataset.trainingMode || "";
        const mode = rawMode === "unlock" || rawMode === "equip" || rawMode === "swap" ? rawMode : "browse";
        appEngine.setTrainingMode(appState, mode);
        render();
        return true;
      }
      case "set-training-compare":
        appEngine.setTrainingCompare(appState, actionEl.dataset.compareSkillId || actionEl.dataset.skillId || "");
        render();
        return true;
      case "clear-training-compare":
        appEngine.setTrainingCompare(appState, "");
        render();
        return true;
      case "unlock-training-skill":
        appEngine.unlockTrainingSkill(appState, actionEl.dataset.skillId || "");
        render();
        return true;
      case "equip-training-skill": {
        const rawSlotKey = actionEl.dataset.slotKey || "";
        const slotKey = rawSlotKey === "slot1" || rawSlotKey === "slot2" || rawSlotKey === "slot3" ? rawSlotKey : "slot1";
        appEngine.equipTrainingSkill(appState, slotKey, actionEl.dataset.skillId || "");
        render();
        return true;
      }
      case "swap-training-skill": {
        const rawSlotKey = actionEl.dataset.slotKey || "";
        const slotKey = rawSlotKey === "slot1" || rawSlotKey === "slot2" || rawSlotKey === "slot3" ? rawSlotKey : "slot1";
        appEngine.swapTrainingSkill(appState, slotKey, actionEl.dataset.skillId || "");
        render();
        return true;
      }
      case "open-inventory":
        appState.ui.inventoryOpen = true;
        render();
        return true;
      case "switch-inv-tab":
        appState.ui.inventoryTab = actionEl.dataset.invTab || "inventory";
        if (appState.ui.inventoryTab !== "inventory") {
          appState.ui.inventoryDetailEntryId = "";
        }
        render();
        return true;
      case "select-inventory-entry":
        appState.ui.inventoryDetailEntryId = actionEl.dataset.entryId || "";
        render();
        return true;
      case "clear-inventory-detail":
        appState.ui.inventoryDetailEntryId = "";
        render();
        return true;
      case "close-inventory":
        appState.ui.inventoryOpen = false;
        appState.ui.inventoryDetailEntryId = "";
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
        }
        return true;
      case "open-combat-pile":
        if (appState.combat && appState.phase === appEngine.PHASES.ENCOUNTER) {
          const rawPileId = actionEl.dataset.pileId;
          let pileId: "" | "draw" | "discard" | "decklist";
          if (rawPileId === "discard") {
            pileId = "discard";
          } else if (rawPileId === "decklist") {
            pileId = "decklist";
          } else {
            pileId = "draw";
          }
          appState.ui.combatLogOpen = false;
          appState.ui.combatPileView = appState.ui.combatPileView === pileId ? "" : pileId;
          render();
          return true;
        }
        return false;
      case "close-combat-pile":
        if (appState.ui.combatPileView) {
          appState.ui.combatPileView = "";
          render();
          return true;
        }
        return false;
      case "toggle-combat-log":
        if (appState.combat && appState.phase === appEngine.PHASES.ENCOUNTER) {
          appState.ui.combatPileView = "";
          appState.ui.combatLogOpen = !appState.ui.combatLogOpen;
          render();
          return true;
        }
        return false;
      case "close-combat-log":
        if (appState.ui.combatLogOpen) {
          appState.ui.combatLogOpen = false;
          render();
          return true;
        }
        return false;
      case "scroll-hand-cards": {
        const handLayout = actionEl.closest(".combat-command__hand-layout") as HTMLElement | null;
        const fan = handLayout?.querySelector(".card-fan") as HTMLElement | null;
        if (!fan) {
          return false;
        }
        const direction = actionEl.dataset.direction === "backward" ? -1 : 1;
        const firstCard = fan.querySelector(".fan-card") as HTMLElement | null;
        const computed = runtimeWindow.getComputedStyle(fan);
        const gap = Number.parseFloat(computed.columnGap || computed.gap || "0") || 0;
        const cardWidth = firstCard?.getBoundingClientRect().width || Math.max(140, fan.clientWidth * 0.72);
        fan.scrollBy({
          left: direction * (cardWidth + gap),
          behavior: "smooth",
        });
        return true;
      }
      case "play-card":
        if (appState.combat) {
          const instanceId = actionEl.dataset.instanceId || "";
          const targetId = appState.combat.selectedEnemyId || "";
          const cardInst = appState.combat.hand.find((c: CardInstance) => c.instanceId === instanceId);
          const cardDef = cardInst ? appState.content.cardCatalog[cardInst.cardId] : null;
          if (cardDef) {
            const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
            const reduction = evo ? evo.getTreeCostReduction(cardInst!.cardId, appState.combat.deckCardIds, appState.content.cardCatalog) : 0;
            const skillReduction = Math.max(0, appState.combat.skillModifiers?.nextCardCostReduction || 0);
            const cost = Math.max(0, cardDef.cost - reduction - skillReduction);
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
      case "use-combat-skill":
        if (appState.combat) {
          const rawSlotKey = actionEl.dataset.slotKey || "";
          const slotKey = rawSlotKey === "slot1" || rawSlotKey === "slot2" || rawSlotKey === "slot3" ? rawSlotKey : "slot1";
          doCombatAction(
            appState.combat,
            () => combatEngine.useSkill(appState.combat, slotKey, appState.combat?.selectedEnemyId || ""),
            syncCombatResultAndRender
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
      case "continue-act-guide":
        appEngine.continueActGuide(appState);
        render();
        return true;
      case "open-act-transition-scroll":
        appState.ui.actTransitionScrollOpen = true;
        render();
        return true;
      case "close-act-transition-scroll":
        appState.ui.actTransitionScrollOpen = false;
        render();
        return true;
      case "continue-act-transition":
        appState.ui.actTransitionScrollOpen = false;
        appEngine.continueActTransition(appState);
        render();
        return true;
      case "set-run-summary-step": {
        const nextStep = actionEl.dataset.runSummaryStep || "finale";
        if (setRunSummaryStep(appState, nextStep)) {
          render();
          return true;
        }
        return false;
      }
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
        if (actionEl.dataset.settingKey === "showHints" || actionEl.dataset.settingKey === "reduceMotion" || actionEl.dataset.settingKey === "compactMode") {
          appEngine.updateProfileSettings(appState, {
            [actionEl.dataset.settingKey]: actionEl.dataset.settingValue === "true",
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
      case "manage-charm":
        if (runtimeWindow.ROUGE_CHARM_SYSTEM && appState.profile) {
          const charmId = actionEl.dataset.charmId || "";
          if (actionEl.dataset.charmAction === "equip") { runtimeWindow.ROUGE_CHARM_SYSTEM.equipCharm(appState.profile, charmId); }
          if (actionEl.dataset.charmAction === "unequip") { runtimeWindow.ROUGE_CHARM_SYSTEM.unequipCharm(appState.profile, charmId); }
          runtimeWindow.ROUGE_PERSISTENCE?.saveProfileToStorage(appState.profile);
        }
        render();
        return true;
      case "set-planned-runeword":
        appEngine.setPlannedRuneword(appState, actionEl.dataset.planningSlot === "armor" ? "armor" : "weapon", actionEl.dataset.runewordId || "");
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
    handleKeydown,
  };
})();
