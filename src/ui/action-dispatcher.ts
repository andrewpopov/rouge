(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  /* ── Combat FX: damage numbers, hit flashes, screen shake ── */

  interface CombatSnapshot {
    heroLife: number;
    heroGuard: number;
    mercLife: number;
    mercGuard: number;
    mercAlive: boolean;
    enemies: Array<{ id: string; life: number; guard: number; alive: boolean }>;
  }

  function captureCombatSnapshot(combat: CombatState): CombatSnapshot {
    return {
      heroLife: combat.hero.life,
      heroGuard: combat.hero.guard,
      mercLife: combat.mercenary.life,
      mercGuard: combat.mercenary.guard,
      mercAlive: combat.mercenary.alive,
      enemies: combat.enemies.map((e) => ({
        id: e.id,
        life: e.life,
        guard: e.guard,
        alive: e.alive,
      })),
    };
  }

  function spawnDamageNumber(spriteEl: HTMLElement, text: string, cssClass: string): void {
    const el = document.createElement("div");
    el.className = `damage-number ${cssClass}`;
    el.textContent = text;
    spriteEl.style.position = "relative";
    spriteEl.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function addTempClass(el: HTMLElement, cls: string, durationMs: number): void {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), durationMs);
  }

  function applyCombatFx(before: CombatSnapshot, after: CombatState): void {
    requestAnimationFrame(() => {
      const stage = document.querySelector(".stage") as HTMLElement | null;
      const screen = document.querySelector(".combat-screen") as HTMLElement | null;
      if (!stage) { return; }

      let totalDamageDealt = 0;
      let anyEnemyKilled = false;

      // Check enemy damage
      const enemySprites = stage.querySelectorAll(".sprite--enemy");
      for (const enemy of after.enemies) {
        const old = before.enemies.find((e) => e.id === enemy.id);
        if (!old) { continue; }

        const spriteEl = Array.from(enemySprites).find(
          (el) => (el as HTMLElement).dataset.enemyId === enemy.id
        ) as HTMLElement | undefined;
        if (!spriteEl) { continue; }

        const lifeLost = old.life - enemy.life;
        const guardLost = old.guard - enemy.guard;

        if (lifeLost > 0) {
          totalDamageDealt += lifeLost;
          const isBig = lifeLost >= enemy.maxLife * 0.3;
          spawnDamageNumber(spriteEl, `-${lifeLost}`, isBig ? "damage-number--big-damage" : "damage-number--damage");
          addTempClass(spriteEl, "sprite--hit", 400);
          addTempClass(spriteEl, "sprite--shake", 350);
        } else if (guardLost > 0) {
          spawnDamageNumber(spriteEl, `-${guardLost}`, "damage-number--guard");
          addTempClass(spriteEl, "sprite--shake", 350);
        }

        if (old.alive && !enemy.alive) {
          anyEnemyKilled = true;
        }
      }

      // Check hero/merc damage (from end-turn enemy attacks)
      const allies = stage.querySelector(".stage__allies");
      if (allies) {
        const allySprites = allies.querySelectorAll(".sprite");
        const heroSprite = allySprites[0] as HTMLElement | undefined;
        const mercSprite = allySprites[1] as HTMLElement | undefined;

        if (heroSprite) {
          const heroLifeLost = before.heroLife - after.hero.life;
          const heroGuardGain = after.hero.guard - before.heroGuard;
          if (heroLifeLost > 0) {
            spawnDamageNumber(heroSprite, `-${heroLifeLost}`, "damage-number--damage");
            addTempClass(heroSprite, "sprite--hit", 400);
            addTempClass(heroSprite, "sprite--shake", 350);
          }
          if (heroGuardGain > 0) {
            spawnDamageNumber(heroSprite, `+${heroGuardGain}`, "damage-number--guard");
          }
          const heroHealAmt = after.hero.life - before.heroLife;
          if (heroHealAmt > 0) {
            spawnDamageNumber(heroSprite, `+${heroHealAmt}`, "damage-number--heal");
            addTempClass(heroSprite, "sprite--healed", 500);
          }
        }

        if (mercSprite) {
          const mercLifeLost = before.mercLife - after.mercenary.life;
          const mercGuardGain = after.mercenary.guard - before.mercGuard;
          if (mercLifeLost > 0) {
            spawnDamageNumber(mercSprite, `-${mercLifeLost}`, "damage-number--damage");
            addTempClass(mercSprite, "sprite--hit", 400);
            addTempClass(mercSprite, "sprite--shake", 350);
          }
          if (mercGuardGain > 0) {
            spawnDamageNumber(mercSprite, `+${mercGuardGain}`, "damage-number--guard");
          }
          const mercHealAmt = after.mercenary.life - before.mercLife;
          if (mercHealAmt > 0) {
            spawnDamageNumber(mercSprite, `+${mercHealAmt}`, "damage-number--heal");
            addTempClass(mercSprite, "sprite--healed", 500);
          }
        }
      }

      // Screen shake on big hits or kills
      if (screen && (totalDamageDealt >= 15 || anyEnemyKilled)) {
        addTempClass(screen, "combat-screen--shake", 350);
      }
    });
  }

  function doCombatAction(
    combat: CombatState,
    action: () => void,
    syncAndRender: () => void
  ): void {
    const snapshot = captureCombatSnapshot(combat);
    action();
    syncAndRender();
    applyCombatFx(snapshot, combat);
  }

  /* ── End Combat FX ── */

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
      case "toggle-game-menu": {
        const panel = document.getElementById("game-menu-panel");
        if (panel) { panel.classList.toggle("game-menu__panel--open"); }
        return true;
      }
      case "toggle-scroll-map":
        appState.ui.scrollMapOpen = !appState.ui.scrollMapOpen;
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
          const instanceId = actionEl.dataset.instanceId || "";
          const targetId = appState.combat.selectedEnemyId || "";
          doCombatAction(
            appState.combat,
            () => combatEngine.playCard(appState.combat, appState.content, instanceId, targetId),
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
            syncCombatResultAndRender
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
