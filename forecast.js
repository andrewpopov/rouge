(() => {
  function applyProjectedDamage(simState, amount, ignoreBlock = false) {
    const damage = Math.max(0, Math.floor(amount));
    let hullHit = damage;
    if (!ignoreBlock) {
      const absorbed = Math.min(simState.block, damage);
      simState.block -= absorbed;
      hullHit = damage - absorbed;
    }
    simState.hull = Math.max(0, simState.hull - hullHit);
    return hullHit;
  }

  function getAimedShotLaneThreats({ enemies, getLockedAimLane, getAimedShotDamage }) {
    const laneThreats = new Map();
    (Array.isArray(enemies) ? enemies : []).forEach((enemy) => {
      if (!enemy?.alive) {
        return;
      }
      const aimedLane = getLockedAimLane(enemy);
      if (aimedLane === null) {
        return;
      }
      if (!enemy.intent || enemy.intent.kind !== "attack") {
        return;
      }
      const damage = getAimedShotDamage(enemy, enemy.intent);
      const entry = laneThreats.get(aimedLane) || { count: 0, maxDamage: 0 };
      entry.count += 1;
      entry.maxDamage = Math.max(entry.maxDamage, damage);
      laneThreats.set(aimedLane, entry);
    });
    return laneThreats;
  }

  function getNextEnemyPhaseForecast({
    trackLanes,
    telegraphs,
    enemies,
    getTelegraphCoverageLanes,
    getLockedAimLane,
    getAimedShotDamage,
  }) {
    const laneDamage = Array.from({ length: trackLanes }, () => 0);
    let unavoidableDamage = 0;

    (Array.isArray(telegraphs) ? telegraphs : []).forEach((telegraph) => {
      if (telegraph.turnsLeft !== 1) {
        return;
      }
      const lanes = getTelegraphCoverageLanes(telegraph);
      lanes.forEach((lane) => {
        laneDamage[lane] += telegraph.damage;
      });
    });

    (Array.isArray(enemies) ? enemies : []).forEach((enemy) => {
      if (!enemy?.alive) {
        return;
      }
      const intent = enemy.intent;
      if (!intent || intent.kind !== "attack") {
        return;
      }
      const hits = Math.max(1, intent.hits ?? 1);
      const totalDamage = getAimedShotDamage(enemy, intent) * hits;
      const aimedLane = getLockedAimLane(enemy);
      if (aimedLane !== null) {
        laneDamage[aimedLane] += totalDamage;
        return;
      }
      unavoidableDamage += totalDamage;
    });

    return {
      laneDamage,
      unavoidableDamage,
    };
  }

  function getShiftCapability({ phase, playerLane, movedThisTurn, playerEnergy, trackLanes }) {
    const canShiftNow = phase === "player" && !movedThisTurn && playerEnergy >= 1;
    return {
      canShiftNow,
      canShiftLeft: canShiftNow && playerLane > 0,
      canShiftRight: canShiftNow && playerLane < trackLanes - 1,
    };
  }

  function getEndTurnProjection({
    trackLanes,
    player,
    telegraphs,
    enemies,
    forecast,
    shiftCapability,
    telegraphAffectsLane,
    getLockedAimLane,
    getAimedShotDamage,
    clampLane,
  }) {
    const currentLane = clampLane(player.lane);
    const laneDamage = forecast.laneDamage;
    const currentLaneRaw = laneDamage[currentLane] ?? 0;

    let bestLaneRaw = laneDamage[0] ?? 0;
    for (let lane = 1; lane < laneDamage.length; lane += 1) {
      if (laneDamage[lane] < bestLaneRaw) {
        bestLaneRaw = laneDamage[lane];
      }
    }

    function simulateLaneOutcome(lane) {
      const simState = {
        hull: player.hull,
        block: Math.max(0, player.block),
        heatFaultDamage: 0,
        telegraphDamage: 0,
        enemyDamage: 0,
      };

      if (player.heat >= 90) {
        const faultDamage = Math.floor((player.heat - 80) / 10) + 1;
        simState.heatFaultDamage = applyProjectedDamage(simState, faultDamage, true);
      }

      if (simState.hull > 0) {
        (Array.isArray(telegraphs) ? telegraphs : []).forEach((telegraph) => {
          if (telegraph.turnsLeft !== 1) {
            return;
          }
          if (!telegraphAffectsLane(telegraph, lane)) {
            return;
          }
          if (simState.hull <= 0) {
            return;
          }
          const took = applyProjectedDamage(simState, telegraph.damage, false);
          simState.telegraphDamage += took;
        });
      }

      if (simState.hull > 0) {
        (Array.isArray(enemies) ? enemies : []).forEach((enemy) => {
          if (!enemy?.alive || simState.hull <= 0) {
            return;
          }
          const intent = enemy.intent;
          if (!intent || intent.kind !== "attack") {
            return;
          }
          const lockedLane = getLockedAimLane(enemy);
          if (lockedLane !== null && lane !== lockedLane) {
            return;
          }
          const hitDamage = getAimedShotDamage(enemy, intent);
          const hits = Math.max(1, intent.hits ?? 1);
          for (let hit = 0; hit < hits; hit += 1) {
            const took = applyProjectedDamage(simState, hitDamage, false);
            simState.enemyDamage += took;
            if (simState.hull <= 0) {
              break;
            }
          }
        });
      }

      const totalLoss = player.hull - simState.hull;
      return {
        lane,
        totalLoss,
        hullAfter: simState.hull,
        heatFaultDamage: simState.heatFaultDamage,
        telegraphDamage: simState.telegraphDamage,
        enemyDamage: simState.enemyDamage,
      };
    }

    const laneOutcomes = Array.from({ length: trackLanes }, (_, lane) => simulateLaneOutcome(lane));
    const currentOutcome = laneOutcomes[currentLane];
    let bestOutcome = laneOutcomes[0];
    for (let lane = 1; lane < laneOutcomes.length; lane += 1) {
      const candidate = laneOutcomes[lane];
      if (candidate.totalLoss < bestOutcome.totalLoss) {
        bestOutcome = candidate;
      }
    }

    const reachableLanes = [currentLane];
    if (shiftCapability.canShiftLeft) {
      reachableLanes.push(currentLane - 1);
    }
    if (shiftCapability.canShiftRight) {
      reachableLanes.push(currentLane + 1);
    }
    let bestReachableOutcome = laneOutcomes[reachableLanes[0]];
    reachableLanes.slice(1).forEach((lane) => {
      const candidate = laneOutcomes[lane];
      if (candidate.totalLoss < bestReachableOutcome.totalLoss) {
        bestReachableOutcome = candidate;
      }
    });

    const canEscapeCurrentLethal =
      currentOutcome.totalLoss >= player.hull &&
      bestReachableOutcome.totalLoss < player.hull &&
      bestReachableOutcome.lane !== currentLane;

    return {
      currentLane,
      bestLane: bestOutcome.lane,
      bestReachableLane: bestReachableOutcome.lane,
      currentLaneRaw,
      bestLaneRaw,
      unavoidableRaw: Math.max(0, forecast.unavoidableDamage),
      block: Math.max(0, player.block),
      heatFaultDamage: currentOutcome.heatFaultDamage,
      currentTotalLoss: currentOutcome.totalLoss,
      bestTotalLoss: bestOutcome.totalLoss,
      bestReachableTotalLoss: bestReachableOutcome.totalLoss,
      hullAfterCurrent: currentOutcome.hullAfter,
      hullAfterBest: bestOutcome.hullAfter,
      hullAfterBestReachable: bestReachableOutcome.hullAfter,
      movementSaves: Math.max(0, currentOutcome.totalLoss - bestOutcome.totalLoss),
      reachableMovementSaves: Math.max(0, currentOutcome.totalLoss - bestReachableOutcome.totalLoss),
      currentLethal: currentOutcome.totalLoss >= player.hull,
      bestLethal: bestOutcome.totalLoss >= player.hull,
      bestReachableLethal: bestReachableOutcome.totalLoss >= player.hull,
      canEscapeCurrentLethal,
      currentHeatFaultDamage: currentOutcome.heatFaultDamage,
      bestHeatFaultDamage: bestOutcome.heatFaultDamage,
      bestReachableHeatFaultDamage: bestReachableOutcome.heatFaultDamage,
      currentTelegraphDamage: currentOutcome.telegraphDamage,
      bestTelegraphDamage: bestOutcome.telegraphDamage,
      bestReachableTelegraphDamage: bestReachableOutcome.telegraphDamage,
      currentEnemyDamage: currentOutcome.enemyDamage,
      bestEnemyDamage: bestOutcome.enemyDamage,
      bestReachableEnemyDamage: bestReachableOutcome.enemyDamage,
    };
  }

  function getProjectionAdvice({ projection, shiftCapability, playerHull }) {
    if (projection.bestReachableLethal) {
      const neededMitigation = projection.bestReachableTotalLoss - playerHull + 1;
      const lethalWithoutHeatFault = projection.bestReachableTotalLoss - projection.bestReachableHeatFaultDamage;
      if (projection.bestReachableHeatFaultDamage > 0 && lethalWithoutHeatFault < playerHull) {
        return {
          code: "vent_to_live",
          text: `Recommended: Vent Heat below 90; that removes ${projection.bestReachableHeatFaultDamage} direct damage and avoids lethal.`,
        };
      }
      if (projection.currentLethal && projection.bestLane !== projection.currentLane && !shiftCapability.canShiftNow) {
        return {
          code: "needs_mitigation",
          text: `Recommended: Shift unavailable this turn. Need at least ${neededMitigation} mitigation to survive.`,
        };
      }
      return {
        code: "needs_mitigation",
        text: `Recommended: Need at least ${neededMitigation} mitigation (Block, kills, or weakening) before ending turn.`,
      };
    }

    if (projection.canEscapeCurrentLethal) {
      return {
        code: "shift_to_live",
        text: `Recommended: Shift to T${projection.bestReachableLane + 1} now (${projection.reachableMovementSaves} damage prevented).`,
      };
    }

    if (projection.bestReachableHeatFaultDamage > 0 && projection.reachableMovementSaves === 0) {
      return {
        code: "vent_heat",
        text: `Recommended: Vent Heat below 90 to remove ${projection.bestReachableHeatFaultDamage} direct damage.`,
      };
    }

    if (projection.reachableMovementSaves > 0) {
      return {
        code: "shift_for_value",
        text: `Recommended: Shift to T${projection.bestReachableLane + 1} for ${projection.reachableMovementSaves} less damage.`,
      };
    }

    if (projection.bestReachableTotalLoss > 0) {
      const dominant = Math.max(
        projection.bestReachableTelegraphDamage,
        projection.bestReachableEnemyDamage,
        projection.bestReachableHeatFaultDamage
      );
      if (dominant === projection.bestReachableTelegraphDamage && dominant > 0) {
        return {
          code: "clear_telegraphs",
          text: `Recommended: Remove telegraph sources or add ${projection.bestReachableTotalLoss} Block before ending turn.`,
        };
      }
      if (dominant === projection.bestReachableEnemyDamage && dominant > 0) {
        return {
          code: "reduce_attackers",
          text: `Recommended: Reduce incoming attacks or add ${projection.bestReachableTotalLoss} Block before ending turn.`,
        };
      }
      return {
        code: "mitigate",
        text: `Recommended: Add ${projection.bestReachableTotalLoss} Block to cancel projected damage.`,
      };
    }

    return {
      code: "safe_end_turn",
      text: "Recommended: Safe to end turn.",
    };
  }

  function getForecastRecommendedAction({
    projection,
    adviceCode,
    shiftCapability,
    endTurnLockedByLethal,
    phase,
  }) {
    const laneDelta = projection.bestReachableLane - projection.currentLane;
    const shiftAction = laneDelta < 0 ? "shift_left" : laneDelta > 0 ? "shift_right" : null;

    if (
      (adviceCode === "shift_to_live" || adviceCode === "shift_for_value" || endTurnLockedByLethal) &&
      shiftAction
    ) {
      if (shiftAction === "shift_left" && shiftCapability.canShiftLeft) {
        return "shift_left";
      }
      if (shiftAction === "shift_right" && shiftCapability.canShiftRight) {
        return "shift_right";
      }
    }
    if (adviceCode === "safe_end_turn" && phase === "player" && !endTurnLockedByLethal) {
      return "end_turn";
    }
    return null;
  }

  function createForecastUiState({
    phase,
    trackLanes,
    player,
    telegraphs,
    enemies,
    telegraphAffectsLane,
    getTelegraphCoverageLanes,
    getLockedAimLane,
    getAimedShotDamage,
    clampLane,
  }) {
    const forecast = getNextEnemyPhaseForecast({
      trackLanes,
      telegraphs,
      enemies,
      getTelegraphCoverageLanes,
      getLockedAimLane,
      getAimedShotDamage,
    });

    const shiftCapability = getShiftCapability({
      phase,
      playerLane: player?.lane ?? 0,
      movedThisTurn: Boolean(player?.movedThisTurn),
      playerEnergy: Number.isFinite(player?.energy) ? player.energy : 0,
      trackLanes,
    });

    const projection = getEndTurnProjection({
      trackLanes,
      player,
      telegraphs,
      enemies,
      forecast,
      shiftCapability,
      telegraphAffectsLane,
      getLockedAimLane,
      getAimedShotDamage,
      clampLane,
    });

    const advice = getProjectionAdvice({
      projection,
      shiftCapability,
      playerHull: player?.hull ?? 0,
    });

    const endTurnLockedByLethal = phase === "player" && projection.canEscapeCurrentLethal;
    const recommendedAction = getForecastRecommendedAction({
      projection,
      adviceCode: advice.code,
      shiftCapability,
      endTurnLockedByLethal,
      phase,
    });

    return {
      forecast,
      projection,
      shiftCapability,
      advice,
      recommendedAction,
      endTurnLockedByLethal,
    };
  }

  function getForecastThreatClassName(damage) {
    if (damage <= 0) {
      return "safe";
    }
    if (damage <= 8) {
      return "low";
    }
    if (damage <= 16) {
      return "medium";
    }
    return "high";
  }

  function getEndTurnLockMessage({ projection, endTurnLockedByLethal }) {
    if (!endTurnLockedByLethal) {
      return "";
    }
    return `End Turn locked here: move toward T${projection.bestReachableLane + 1} first.`;
  }

  function renderLaneThreatForecast({
    rootEl,
    phase,
    playerLane,
    forecastUi,
    getForecastThreatClassNameFn,
    getEndTurnLockMessageFn,
    escapeHtml,
    bindLaneHighlightInteractions,
    onShiftLane,
    onEndTurn,
  }) {
    if (!rootEl || !forecastUi) {
      return;
    }

    const { forecast, projection, shiftCapability, advice, recommendedAction, endTurnLockedByLethal } =
      forecastUi;
    const totalLaneDamage = forecast.laneDamage.reduce((sum, value) => sum + value, 0);
    const hasThreats =
      totalLaneDamage > 0 || forecast.unavoidableDamage > 0 || projection.heatFaultDamage > 0;
    const phaseLabel = phase === "player" ? "Next Enemy Phase" : "Enemy Pressure";
    const unavoidableClass = forecast.unavoidableDamage > 0 ? "hot" : "safe";
    const canShiftLeft = shiftCapability.canShiftLeft;
    const canShiftRight = shiftCapability.canShiftRight;
    const canEndTurn = phase === "player";
    const disableEndTurnAction = !canEndTurn || endTurnLockedByLethal;
    const chipsHtml = forecast.laneDamage
      .map((damage, lane) => {
        const classes = [
          "lane-threat-chip",
          typeof getForecastThreatClassNameFn === "function"
            ? getForecastThreatClassNameFn(damage)
            : getForecastThreatClassName(damage),
        ];
        if (lane === playerLane) {
          classes.push("player");
        }
        const dataAttrs =
          damage > 0 ? ` data-lanes="${lane}" data-highlight-key="forecast_lane_${lane}"` : "";
        return `<div class="${classes.join(" ")}" data-lane="${lane}" data-damage="${damage}"${dataAttrs}>
        <span>T${lane + 1}</span>
        <strong>${damage}</strong>
      </div>`;
      })
      .join("");

    let projectionClass = "safe";
    if (projection.bestReachableLethal || projection.currentLethal) {
      projectionClass = "lethal";
    } else if (projection.reachableMovementSaves > 0 || projection.heatFaultDamage > 0) {
      projectionClass = "warn";
    }

    let footText = "No damage queued for next enemy phase.";
    if (projection.bestReachableLethal) {
      if (
        projection.currentLethal &&
        projection.bestLane !== projection.currentLane &&
        !shiftCapability.canShiftNow
      ) {
        footText = "A safer lane exists, but shift is unavailable this turn.";
      } else {
        footText = "Unavoidable lethal next phase. Gain Block, kill threats, or reduce Heat.";
      }
    } else if (projection.canEscapeCurrentLethal) {
      footText = `Current lane is lethal. Shift to T${projection.bestReachableLane + 1} before ending turn.`;
    } else if (projection.reachableMovementSaves > 0) {
      footText = `Shifting to T${projection.bestReachableLane + 1} saves ${projection.reachableMovementSaves} damage.`;
    } else if (projection.heatFaultDamage > 0) {
      footText = `Heat fault adds ${projection.heatFaultDamage} direct damage this turn.`;
    } else if (hasThreats) {
      footText = "Current lane is already safest.";
    }

    const heatFaultNote =
      projection.heatFaultDamage > 0
        ? `<span class="lane-threat-proj-note">Includes heat fault ${projection.heatFaultDamage} (direct)</span>`
        : "";
    const shiftLeftClass =
      recommendedAction === "shift_left" ? "lane-action-btn recommended" : "lane-action-btn";
    const shiftRightClass =
      recommendedAction === "shift_right" ? "lane-action-btn recommended" : "lane-action-btn";
    const endTurnClass =
      recommendedAction === "end_turn" ? "lane-action-btn recommended" : "lane-action-btn";
    const actionLockText =
      typeof getEndTurnLockMessageFn === "function"
        ? getEndTurnLockMessageFn({ projection, endTurnLockedByLethal })
        : getEndTurnLockMessage({ projection, endTurnLockedByLethal });
    const safeEscape = typeof escapeHtml === "function" ? escapeHtml : (value) => String(value);
    const endTurnLockAttr = actionLockText
      ? ` data-lock-reason="${safeEscape(actionLockText)}" title="${safeEscape(actionLockText)}"`
      : "";
    const shiftLeftDisabledAttr = canShiftLeft ? "" : " disabled";
    const shiftRightDisabledAttr = canShiftRight ? "" : " disabled";
    const endTurnDisabledAttr = disableEndTurnAction ? " disabled" : "";

    rootEl.innerHTML = `
    <div class="lane-threat-head">
      <span>${phaseLabel} Damage (raw)</span>
      <small class="lane-threat-unavoidable ${unavoidableClass}">Unavoidable ${forecast.unavoidableDamage}</small>
    </div>
    <div class="lane-threat-grid">${chipsHtml}</div>
    <div class="lane-threat-projection ${projectionClass}">
      <strong>End Turn Projection</strong>
      <span>Current T${projection.currentLane + 1}: ${projection.currentTotalLoss} dmg -> Hull ${projection.hullAfterCurrent}</span>
      <span>Best Reachable T${projection.bestReachableLane + 1}: ${projection.bestReachableTotalLoss} dmg -> Hull ${projection.hullAfterBestReachable}</span>
      ${heatFaultNote}
    </div>
    <div class="lane-threat-actions">
      <button type="button" class="${shiftLeftClass}" data-action="shift_left" aria-keyshortcuts="Q"${shiftLeftDisabledAttr}>Shift Left [Q]</button>
      <button type="button" class="${shiftRightClass}" data-action="shift_right" aria-keyshortcuts="E"${shiftRightDisabledAttr}>Shift Right [E]</button>
      <button type="button" class="${endTurnClass}" data-action="end_turn" aria-keyshortcuts="Space Enter"${endTurnLockAttr}${endTurnDisabledAttr}>End Turn [Space/Enter]</button>
    </div>
    ${actionLockText ? `<p class="lane-threat-action-note">${actionLockText}</p>` : ""}
    <p class="lane-threat-advice">${advice.text}</p>
    <p class="lane-threat-foot">${footText}</p>
  `;

    rootEl.dataset.unavoidable = String(forecast.unavoidableDamage);
    rootEl.dataset.totalLane = String(totalLaneDamage);
    rootEl.dataset.currentLane = String(projection.currentLane);
    rootEl.dataset.bestLane = String(projection.bestReachableLane);
    rootEl.dataset.bestGlobalLane = String(projection.bestLane);
    rootEl.dataset.currentLoss = String(projection.currentTotalLoss);
    rootEl.dataset.bestLoss = String(projection.bestReachableTotalLoss);
    rootEl.dataset.bestGlobalLoss = String(projection.bestTotalLoss);
    rootEl.dataset.hullAfterCurrent = String(projection.hullAfterCurrent);
    rootEl.dataset.hullAfterBest = String(projection.hullAfterBestReachable);
    rootEl.dataset.heatFault = String(projection.heatFaultDamage);
    rootEl.dataset.currentLethal = projection.currentLethal ? "1" : "0";
    rootEl.dataset.bestLethal = projection.bestReachableLethal ? "1" : "0";
    rootEl.dataset.advice = advice.code;
    rootEl.dataset.recommendedAction = recommendedAction || "";
    rootEl.dataset.endTurnLocked = endTurnLockedByLethal ? "1" : "0";

    if (typeof bindLaneHighlightInteractions === "function") {
      bindLaneHighlightInteractions(rootEl.querySelectorAll(".lane-threat-chip[data-lanes]"), "forecast");
    }

    rootEl.querySelectorAll(".lane-action-btn[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const action = button.dataset.action;
        if (action === "shift_left") {
          if (typeof onShiftLane === "function") {
            onShiftLane(-1);
          }
          return;
        }
        if (action === "shift_right") {
          if (typeof onShiftLane === "function") {
            onShiftLane(1);
          }
          return;
        }
        if (action === "end_turn" && typeof onEndTurn === "function") {
          onEndTurn();
        }
      });
    });
  }

  function renderControlRecommendations({ shiftLeftBtn, shiftRightBtn, endTurnBtn, forecastUi }) {
    const mainButtons = {
      shift_left: shiftLeftBtn,
      shift_right: shiftRightBtn,
      end_turn: endTurnBtn,
    };

    Object.values(mainButtons).forEach((button) => {
      if (button) {
        button.classList.remove("recommended", "risk-locked");
      }
    });

    const action = forecastUi?.recommendedAction;
    if (action && mainButtons[action]) {
      mainButtons[action].classList.add("recommended");
    }

    if (forecastUi?.endTurnLockedByLethal && endTurnBtn) {
      endTurnBtn.classList.add("risk-locked");
    }
  }

  window.BRASSLINE_FORECAST = {
    getAimedShotLaneThreats,
    getNextEnemyPhaseForecast,
    getShiftCapability,
    getEndTurnProjection,
    getProjectionAdvice,
    getForecastRecommendedAction,
    createForecastUiState,
    getForecastThreatClassName,
    getEndTurnLockMessage,
    renderLaneThreatForecast,
    renderControlRecommendations,
  };
})();
