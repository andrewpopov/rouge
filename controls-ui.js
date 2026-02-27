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

  window.BRASSLINE_CONTROLS_UI = {
    renderOnboardingPanel,
    isTypingTarget,
    isInteractiveShortcutTarget,
    triggerControlShortcut,
  };
})();
