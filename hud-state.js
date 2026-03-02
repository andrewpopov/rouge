(() => {
  function getHeatState({ heat }) {
    if (heat < 55) {
      return {
        tier: "normal",
        label: "Stable Pressure",
        hint: "Reactor stable. Push output when ready.",
      };
    }
    if (heat < 80) {
      return {
        tier: "warn",
        label: "High Pressure",
        hint: "Warning: vent soon or accept fault risk.",
      };
    }
    return {
      tier: "critical",
      label: "Meltdown Risk",
      hint: "Critical pressure! Core faults are active.",
    };
  }

  function updateSectorLabel({ game, sectorLabelEl, getCurrentSectorFn, runSectorsLength }) {
    if (!sectorLabelEl) {
      return;
    }
    if (game.phase === "run_victory") {
      sectorLabelEl.textContent = "All sectors cleared // Route secured";
      return;
    }

    const sector = getCurrentSectorFn();
    if (!sector) {
      sectorLabelEl.textContent = "Route Status Unknown";
      return;
    }

    const bossTag = sector.boss ? " // Boss" : "";
    const modifierTag =
      game.encounterModifier && typeof game.encounterModifier.title === "string"
        ? ` // ${game.encounterModifier.title}`
        : "";
    const clearedTag = game.phase === "reward" ? " // Cleared" : "";
    sectorLabelEl.textContent = `Sector ${game.sectorIndex + 1}/${runSectorsLength} // ${sector.name}${bossTag}${modifierTag}${clearedTag}`;
  }

  function updateHud({
    game,
    els,
    clamp,
    maxHeat,
    trackLanes,
    rewardHealSkip,
    getHeatStateFn,
    getForecastUiStateFn,
    getEndTurnLockMessageFn,
    hasInstalledMetaUpgradesFn,
    isMetaResetArmedFn,
    hasRunRecordsDataFn,
    isRunRecordsResetArmedFn,
    renderControlRecommendationsFn,
    updateSectorLabelFn,
    renderRewardPanelFn,
    renderInterludePanelFn,
    renderRunSummaryPanelFn,
    renderUpgradeStripFn,
    renderArtifactStripFn,
    renderLaneThreatForecastFn,
    renderOnboardingPanelFn,
    saveRunSnapshotStateFn,
  }) {
    game.player.heat = clamp(game.player.heat, 0, maxHeat);
    const heatInfo = getHeatStateFn(game.player.heat);

    els.heatFill.style.width = `${Math.min(100, game.player.heat)}%`;
    els.heatValue.textContent = `${game.player.heat}%`;
    els.heatState.textContent = heatInfo.label;
    els.warningText.textContent = heatInfo.hint;

    els.hullValue.textContent = String(game.player.hull);
    els.blockValue.textContent = String(game.player.block);
    els.energyValue.textContent = String(game.player.energy);
    els.laneValue.textContent = String(game.player.lane + 1);
    els.turnValue.textContent = String(game.turn);

    els.drawCount.textContent = String(game.drawPile.length);
    els.discardCount.textContent = String(game.discardPile.length);
    els.handCount.textContent = String(game.hand.length);

    if (game.phase === "player") {
      els.phaseBadge.textContent = "Player Phase";
    } else if (game.phase === "enemy") {
      els.phaseBadge.textContent = "Enemy Phase";
    } else if (game.phase === "reward") {
      els.phaseBadge.textContent = "Intermission";
    } else if (game.phase === "interlude") {
      els.phaseBadge.textContent = "Route Stop";
    } else if (game.phase === "run_victory") {
      els.phaseBadge.textContent = "Run Clear";
    } else {
      els.phaseBadge.textContent = "Game Over";
    }

    const restartMode = game.phase === "gameover" || game.phase === "run_victory";
    const canShiftNow =
      game.phase === "player" &&
      !game.player.movedThisTurn &&
      game.player.energy >= 1 &&
      !restartMode;
    const forecastUi = getForecastUiStateFn();
    const endTurnLockMessage = getEndTurnLockMessageFn(
      forecastUi.projection,
      forecastUi.endTurnLockedByLethal
    );
    els.overclockBtn.disabled = game.phase !== "player" || game.player.overclockUsed;
    els.endTurnBtn.disabled = game.phase !== "player" || forecastUi.endTurnLockedByLethal;
    if (endTurnLockMessage) {
      els.endTurnBtn.dataset.lockReason = endTurnLockMessage;
      els.endTurnBtn.title = endTurnLockMessage;
    } else {
      delete els.endTurnBtn.dataset.lockReason;
      els.endTurnBtn.removeAttribute("title");
    }
    els.shiftLeftBtn.disabled = !canShiftNow || game.player.lane <= 0;
    els.shiftRightBtn.disabled = !canShiftNow || game.player.lane >= trackLanes - 1;
    els.cycleHandBtn.disabled = restartMode ? false : game.phase !== "player";
    els.cycleHandBtn.textContent = restartMode ? "Restart Run" : "Purge Hand (1 Steam)";
    const canResetMeta = hasInstalledMetaUpgradesFn();
    const armedReset = canResetMeta && isMetaResetArmedFn();
    els.resetMetaBtn.disabled = !canResetMeta;
    els.resetMetaBtn.classList.toggle("armed", armedReset);
    els.resetMetaBtn.textContent = armedReset ? "Confirm Reset Meta" : "Reset Meta Paths";
    if (!canResetMeta) {
      els.resetMetaBtn.title = "No saved upgrade paths to reset.";
    } else if (armedReset) {
      els.resetMetaBtn.title = "Click again soon to permanently clear saved upgrade paths.";
    } else {
      els.resetMetaBtn.title = "Clear saved upgrade paths and restart run.";
    }

    if (els.resetRunRecordsBtn) {
      const canResetRecords = hasRunRecordsDataFn();
      const armedRecordsReset = canResetRecords && isRunRecordsResetArmedFn();
      els.resetRunRecordsBtn.disabled = !canResetRecords;
      els.resetRunRecordsBtn.classList.toggle("armed", armedRecordsReset);
      els.resetRunRecordsBtn.textContent = armedRecordsReset
        ? "Confirm Reset Records"
        : "Reset Run Records";
      if (!canResetRecords) {
        els.resetRunRecordsBtn.title = "No saved run records to reset.";
      } else if (armedRecordsReset) {
        els.resetRunRecordsBtn.title = "Click again soon to permanently clear saved run records.";
      } else {
        els.resetRunRecordsBtn.title = "Clear saved run records.";
      }
    }

    els.skipRewardBtn.textContent = `Skip Reward (+${rewardHealSkip} Hull)`;
    els.skipRewardBtn.disabled = game.phase !== "reward";
    renderControlRecommendationsFn(forecastUi);

    document.body.dataset.alert = heatInfo.tier;
    document.body.dataset.phase = game.phase;

    updateSectorLabelFn();
    renderRewardPanelFn();
    renderInterludePanelFn();
    renderRunSummaryPanelFn();
    renderUpgradeStripFn();
    if (typeof renderArtifactStripFn === "function") {
      renderArtifactStripFn();
    }
    renderLaneThreatForecastFn(forecastUi);
    renderOnboardingPanelFn();
    saveRunSnapshotStateFn();
  }

  window.BRASSLINE_HUD_STATE = {
    getHeatState,
    updateSectorLabel,
    updateHud,
  };
})();
