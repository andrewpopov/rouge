(() => {
  function renderOnboardingPanel({
    onboardingPanelEl,
    toggleOnboardingBtnEl,
    dismissOnboardingBtnEl,
    shiftLeftBtnEl,
    shiftRightBtnEl,
    endTurnBtnEl,
    showOnboarding,
    onboardingDismissed,
  }) {
    if (!onboardingPanelEl || !toggleOnboardingBtnEl || !dismissOnboardingBtnEl) {
      return;
    }

    const visible = Boolean(showOnboarding);
    const firstRunHighlight = !onboardingDismissed;

    onboardingPanelEl.classList.toggle("hidden", !visible);
    toggleOnboardingBtnEl.textContent = visible ? "Hide How to Play" : "How to Play";
    toggleOnboardingBtnEl.setAttribute("aria-expanded", visible ? "true" : "false");
    dismissOnboardingBtnEl.textContent = onboardingDismissed ? "Hide Panel" : "Dismiss Tips";

    [shiftLeftBtnEl, shiftRightBtnEl, endTurnBtnEl].forEach((button) => {
      if (!button) {
        return;
      }
      button.classList.toggle("onboarding-focus", firstRunHighlight);
    });

    document.body.dataset.onboarding = firstRunHighlight ? "active" : "dismissed";
  }

  function isTypingTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (target.closest("input, textarea, select")) {
      return true;
    }
    return Boolean(target.closest('[contenteditable]:not([contenteditable="false"])'));
  }

  function isInteractiveShortcutTarget(target, isTypingTargetFn = isTypingTarget) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (isTypingTargetFn(target)) {
      return true;
    }
    return Boolean(target.closest('button, a[href], summary, [role="button"]'));
  }

  function triggerControlShortcut(button) {
    if (!button || button.disabled) {
      return false;
    }
    button.click();
    return true;
  }

  function createControlHotkeyHandler({
    isInteractiveShortcutTargetFn = isInteractiveShortcutTarget,
    triggerControlShortcutFn = triggerControlShortcut,
    shiftLeftBtn,
    shiftRightBtn,
    endTurnBtn,
    onEndTurnLocked = () => {},
  }) {
    return (event) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isInteractiveShortcutTargetFn(event.target)
      ) {
        return;
      }

      if (event.code === "KeyQ") {
        if (triggerControlShortcutFn(shiftLeftBtn)) {
          event.preventDefault();
        }
        return;
      }

      if (event.code === "KeyE") {
        if (triggerControlShortcutFn(shiftRightBtn)) {
          event.preventDefault();
        }
        return;
      }

      if (event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter") {
        if (triggerControlShortcutFn(endTurnBtn)) {
          event.preventDefault();
          return;
        }
        const lockReason = endTurnBtn?.dataset?.lockReason;
        if (lockReason) {
          event.preventDefault();
          onEndTurnLocked(lockReason);
        }
      }
    };
  }

  function bindPrimaryControls({
    overclockBtn,
    usePotionBtn,
    endTurnBtn,
    shiftLeftBtn,
    shiftRightBtn,
    cycleHandBtn,
    toggleComfortModeBtn,
    toggleOnboardingBtn,
    dismissOnboardingBtn,
    resetMetaBtn,
    resetRunRecordsBtn,
    toggleRunTimelineBtn,
    skipRewardBtn,
    onUseOverclock,
    onUsePotion,
    onEndTurn,
    onShiftLeft,
    onShiftRight,
    onCycleHand,
    onToggleComfortMode,
    onToggleOnboarding,
    onDismissOnboarding,
    onResetMeta,
    onResetRunRecords,
    onToggleRunTimeline,
    onSkipReward,
  }) {
    if (overclockBtn && typeof onUseOverclock === "function") {
      overclockBtn.addEventListener("click", onUseOverclock);
    }
    if (usePotionBtn && typeof onUsePotion === "function") {
      usePotionBtn.addEventListener("click", onUsePotion);
    }
    if (endTurnBtn && typeof onEndTurn === "function") {
      endTurnBtn.addEventListener("click", onEndTurn);
    }
    if (shiftLeftBtn && typeof onShiftLeft === "function") {
      shiftLeftBtn.addEventListener("click", onShiftLeft);
    }
    if (shiftRightBtn && typeof onShiftRight === "function") {
      shiftRightBtn.addEventListener("click", onShiftRight);
    }
    if (cycleHandBtn && typeof onCycleHand === "function") {
      cycleHandBtn.addEventListener("click", onCycleHand);
    }
    if (toggleComfortModeBtn && typeof onToggleComfortMode === "function") {
      toggleComfortModeBtn.addEventListener("click", onToggleComfortMode);
    }
    if (toggleOnboardingBtn && typeof onToggleOnboarding === "function") {
      toggleOnboardingBtn.addEventListener("click", onToggleOnboarding);
    }
    if (dismissOnboardingBtn && typeof onDismissOnboarding === "function") {
      dismissOnboardingBtn.addEventListener("click", onDismissOnboarding);
    }
    if (resetMetaBtn && typeof onResetMeta === "function") {
      resetMetaBtn.addEventListener("click", onResetMeta);
    }
    if (resetRunRecordsBtn && typeof onResetRunRecords === "function") {
      resetRunRecordsBtn.addEventListener("click", onResetRunRecords);
    }
    if (toggleRunTimelineBtn && typeof onToggleRunTimeline === "function") {
      toggleRunTimelineBtn.addEventListener("click", onToggleRunTimeline);
    }
    if (skipRewardBtn && typeof onSkipReward === "function") {
      skipRewardBtn.addEventListener("click", onSkipReward);
    }
  }

  function createOnboardingController({
    game,
    saveOnboardingStateFn = () => {},
    updateHudFn = () => {},
  }) {
    function toggleOnboardingPanel() {
      if (!game || typeof game !== "object") {
        return false;
      }
      game.showOnboarding = !game.showOnboarding;
      updateHudFn();
      return true;
    }

    function dismissOnboarding() {
      if (!game || typeof game !== "object") {
        return false;
      }
      if (!game.onboardingDismissed) {
        game.onboardingDismissed = true;
        saveOnboardingStateFn();
      }
      game.showOnboarding = false;
      updateHudFn();
      return true;
    }

    return {
      toggleOnboardingPanel,
      dismissOnboarding,
    };
  }

  function createEnemyTooltipDismissHandler({
    getOpenEnemyTooltipId = () => null,
    setOpenEnemyTooltipId = () => {},
    clearLaneHighlightFn = () => {},
    renderEnemiesFn = () => {},
  }) {
    return (event) => {
      const isEnemyTarget = Boolean(event?.target?.closest?.(".enemy"));
      if (!isEnemyTarget && getOpenEnemyTooltipId() !== null) {
        setOpenEnemyTooltipId(null);
        clearLaneHighlightFn(true);
        renderEnemiesFn();
      }
    };
  }

  window.BRASSLINE_CONTROLS_UI = {
    renderOnboardingPanel,
    isTypingTarget,
    isInteractiveShortcutTarget,
    triggerControlShortcut,
    createControlHotkeyHandler,
    bindPrimaryControls,
    createOnboardingController,
    createEnemyTooltipDismissHandler,
  };
})();
