(() => {
  function getCombatSubphase(game) {
    if (!game || typeof game !== "object") {
      return "";
    }
    return game.combatSubphase === "enemy_resolve" ? "enemy_resolve" : "player_turn";
  }

  function isPlayerTurn(game) {
    return game?.phase === "encounter" && getCombatSubphase(game) === "player_turn";
  }

  function isEnemyResolve(game) {
    return game?.phase === "encounter" && getCombatSubphase(game) === "enemy_resolve";
  }

  function isRunComplete(game) {
    return game?.phase === "run_complete";
  }

  function isRunFailed(game) {
    return game?.phase === "run_failed";
  }

  function isRunTerminal(game) {
    return isRunComplete(game) || isRunFailed(game);
  }

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
    if (isRunComplete(game)) {
      sectorLabelEl.textContent = "All sectors cleared // Route secured";
      return;
    }

    const sector = getCurrentSectorFn();
    if (!sector) {
      sectorLabelEl.textContent = "Route Status Unknown";
      return;
    }

    const bossTag = sector.boss ? " // Boss" : "";
    const stageNodes = Array.isArray(game.stageNodesBySector?.[game.sectorIndex])
      ? game.stageNodesBySector[game.sectorIndex]
      : [];
    const nodeCount = stageNodes.length > 0 ? stageNodes.length : 1;
    const nodeIndexRaw = Number.parseInt(game.stageNodeIndex, 10);
    const nodeIndex =
      Number.isInteger(nodeIndexRaw) && nodeIndexRaw >= 0
        ? Math.min(nodeCount - 1, nodeIndexRaw)
        : 0;
    const nodeTag = ` // Node ${nodeIndex + 1}/${nodeCount}`;
    const modifierTag =
      game.encounterModifier && typeof game.encounterModifier.title === "string"
        ? ` // ${game.encounterModifier.title}`
        : "";
    const clearedTag = game.phase === "reward" ? " // Cleared" : "";
    sectorLabelEl.textContent = `Sector ${game.sectorIndex + 1}/${runSectorsLength}${nodeTag} // ${sector.name}${bossTag}${modifierTag}${clearedTag}`;
  }

  function getQuickGuideCopy({ game, forecastUi }) {
    if (!game || typeof game !== "object") {
      return {
        goal: "Goal: Clear the current sector.",
        step: "Step: Target an enemy, play combat cards, then end turn.",
      };
    }

    if (game.phase === "reward") {
      return {
        goal: "Goal: Pick one reward and move to the next sector.",
        step: "Step: Card = deck add, Gear/Artifact = run passive, Upgrade = permanent meta bonus.",
      };
    }
    if (game.phase === "world_map") {
      return {
        goal: "Goal: Choose a route option to continue.",
        step: "Step: Options can heal, change heat, change deck, or alter your route.",
      };
    }
    if (isEnemyResolve(game)) {
      return {
        goal: "Goal: Survive incoming enemy actions.",
        step: "Step: Enemy attacks and telegraphs are resolving now.",
      };
    }
    if (isRunComplete(game)) {
      return {
        goal: "Goal: Run completed.",
        step: "Step: Restart to begin a fresh route with your unlocked meta upgrades.",
      };
    }
    if (isRunFailed(game)) {
      return {
        goal: "Goal: Reactor destroyed.",
        step: "Step: Restart and prioritize safer lanes before ending turn.",
      };
    }

    const aliveEnemies = (Array.isArray(game.enemies) ? game.enemies : []).filter((enemy) => enemy?.alive);
    const enemyCount = aliveEnemies.length;
    const hasTarget =
      typeof game.selectedEnemyId === "string" &&
      aliveEnemies.some((enemy) => enemy.id === game.selectedEnemyId);
    const currentLaneLethal = Boolean(forecastUi?.projection?.canEscapeCurrentLethal);

    if (!hasTarget && enemyCount > 0) {
      return {
        goal: `Goal: Destroy all ${enemyCount} enemies in this sector.`,
        step: "Step: Click an enemy in Enemy Units, then play combat cards from your hand.",
      };
    }
    if (Number.isFinite(game.player?.energy) && game.player.energy <= 0) {
      return {
        goal: `Goal: Destroy all ${enemyCount} enemies in this sector.`,
        step: "Step: You are out of Steam. End turn to refresh Steam and draw.",
      };
    }
    if (currentLaneLethal && !game.player?.movedThisTurn) {
      const safeLane = Number.parseInt(forecastUi?.projection?.bestReachableLane, 10);
      const laneText = Number.isInteger(safeLane) ? ` to T${safeLane + 1}` : "";
      return {
        goal: `Goal: Destroy all ${enemyCount} enemies in this sector.`,
        step: `Step: Danger. Shift${laneText} before ending turn.`,
      };
    }
    if (currentLaneLethal && game.player?.movedThisTurn) {
      return {
        goal: `Goal: Destroy all ${enemyCount} enemies in this sector.`,
        step: "Step: Shift already used. Gain Block or remove threats before ending turn.",
      };
    }

    return {
      goal: `Goal: Destroy all ${enemyCount} enemies in this sector.`,
      step: "Step: Combat cards are one-turn actions. Use them, then end turn when ready.",
    };
  }

  function getFlowLabelCopy({ game }) {
    if (!game || typeof game !== "object") {
      return "You are the blue marker on the track map. Enemy units are the cards below the map.";
    }

    if (isPlayerTurn(game)) {
      return "Your turn: target an enemy unit, play combat cards, optionally shift once, then end turn.";
    }
    if (isEnemyResolve(game)) {
      return "Enemy turn: telegraphed attacks on the track map are resolving now.";
    }
    if (game.phase === "reward") {
      return "Battle won: choose one reward to continue (Card deck add, Gear/Artifact run passive, or Upgrade path).";
    }
    if (game.phase === "world_map") {
      return "Route stop: choose one route event, then continue to the next sector.";
    }
    if (isRunComplete(game)) {
      return "Run clear: restart when you are ready for a new route.";
    }
    return "Reactor lost: restart and prioritize safer lanes before ending turn.";
  }

  function getTurnFlowCopy({ game }) {
    if (!game || typeof game !== "object") {
      return "Turn loop: Your Turn -> Enemy Turn -> repeat.";
    }

    if (isPlayerTurn(game)) {
      return "Turn loop: Your Turn (active now) -> Enemy Turn -> repeat.";
    }
    if (isEnemyResolve(game)) {
      return "Turn loop: Your Turn -> Enemy Turn (active now) -> repeat.";
    }
    if (game.phase === "reward" || game.phase === "world_map") {
      return "Turn loop paused: resolve reward/route choice to start the next battle turn cycle.";
    }
    return "Turn loop ended for this run. Restart to begin a new cycle.";
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
    renderGearStripFn,
    renderRewardTreeStripFn,
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
    if (els.classLevelValue) {
      els.classLevelValue.textContent = String(game.classState?.level || 1);
    }
    if (els.skillPointValue) {
      els.skillPointValue.textContent = String(game.classState?.skillPoints || 0);
    }
    if (els.statPointValue) {
      els.statPointValue.textContent = String(game.classState?.statPoints || 0);
    }
    if (els.goldValue) {
      els.goldValue.textContent = String(game.gold || 0);
    }
    if (els.potionValue) {
      els.potionValue.textContent = String(game.healingPotions || 0);
    }
    if (els.itemUpgradeValue) {
      els.itemUpgradeValue.textContent = String(game.itemUpgradeTokens || 0);
    }

    els.drawCount.textContent = String(game.drawPile.length);
    els.discardCount.textContent = String(game.discardPile.length);
    els.handCount.textContent = String(game.hand.length);

    if (isPlayerTurn(game)) {
      els.phaseBadge.textContent = "Your Turn (Player Phase)";
    } else if (isEnemyResolve(game)) {
      els.phaseBadge.textContent = "Enemy Turn";
    } else if (game.phase === "reward") {
      els.phaseBadge.textContent = "Reward Choice";
    } else if (game.phase === "world_map") {
      els.phaseBadge.textContent = "Route Stop";
    } else if (isRunComplete(game)) {
      els.phaseBadge.textContent = "Run Clear";
    } else {
      els.phaseBadge.textContent = "Game Over";
    }

    const restartMode = isRunTerminal(game);
    const canShiftNow =
      isPlayerTurn(game) &&
      !game.player.movedThisTurn &&
      game.player.energy >= 1 &&
      !restartMode;
    const forecastUi = getForecastUiStateFn();
    const endTurnLockMessage = getEndTurnLockMessageFn(
      forecastUi.projection,
      forecastUi.endTurnLockedByLethal
    );
    els.overclockBtn.disabled = !isPlayerTurn(game) || game.player.overclockUsed;
    if (els.usePotionBtn) {
      const canUsePotion =
        !isRunTerminal(game) &&
        (game.healingPotions || 0) > 0 &&
        game.player.hull < game.player.maxHull;
      els.usePotionBtn.disabled = !canUsePotion;
      els.usePotionBtn.textContent = `Use Potion (${game.healingPotions || 0})`;
    }
    els.endTurnBtn.disabled = !isPlayerTurn(game) || forecastUi.endTurnLockedByLethal;
    if (endTurnLockMessage) {
      els.endTurnBtn.dataset.lockReason = endTurnLockMessage;
      els.endTurnBtn.title = endTurnLockMessage;
    } else {
      delete els.endTurnBtn.dataset.lockReason;
      els.endTurnBtn.removeAttribute("title");
    }
    els.shiftLeftBtn.disabled = !canShiftNow || game.player.lane <= 0;
    els.shiftRightBtn.disabled = !canShiftNow || game.player.lane >= trackLanes - 1;
    els.cycleHandBtn.disabled = restartMode ? false : !isPlayerTurn(game);
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

    const quickGuide = getQuickGuideCopy({ game, forecastUi });
    if (els.quickGuideGoal) {
      els.quickGuideGoal.textContent = quickGuide.goal;
    }
    if (els.quickGuideStep) {
      els.quickGuideStep.textContent = quickGuide.step;
    }
    if (els.flowLabel) {
      els.flowLabel.textContent = getFlowLabelCopy({ game });
    }
    if (els.turnFlowText) {
      els.turnFlowText.textContent = getTurnFlowCopy({ game });
    }
    if (els.mapRoleNote) {
      els.mapRoleNote.textContent =
        "YOU = blue marker. Red telegraphs and lock markers show enemy attacks.";
    }
    if (els.enemySectionHint) {
      els.enemySectionHint.textContent =
        "Enemy Units are the cards below. Click one to set your target for single-target attacks.";
    }
    if (els.handZoneHint) {
      els.handZoneHint.textContent =
        "Hand cards are combat actions for this battle. Permanent upgrades only appear after sector clears.";
    }
    if (els.targetHint) {
      const aliveEnemies = (Array.isArray(game.enemies) ? game.enemies : []).filter((enemy) => enemy?.alive);
      const selectedEnemy =
        typeof game.selectedEnemyId === "string"
          ? aliveEnemies.find((enemy) => enemy.id === game.selectedEnemyId) || null
          : null;
      if (!isPlayerTurn(game) || aliveEnemies.length === 0) {
        els.targetHint.textContent = "";
      } else if (!selectedEnemy) {
        els.targetHint.textContent = "Click an enemy to target it before playing attack cards.";
      } else {
        els.targetHint.textContent = `Target: ${selectedEnemy.name}. Attack cards hit this enemy unless noted otherwise.`;
      }
    }

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
    if (typeof renderGearStripFn === "function") {
      renderGearStripFn();
    }
    if (typeof renderRewardTreeStripFn === "function") {
      renderRewardTreeStripFn();
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
