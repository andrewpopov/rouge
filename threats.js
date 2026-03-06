(() => {
  function telegraphAffectsLane({ telegraph, lane, getLobLanes }) {
    if (telegraph?.type === "lob") {
      return getLobLanes(telegraph.targetLane, telegraph.radius).includes(lane);
    }
    if (telegraph?.type === "sweep") {
      return Array.isArray(telegraph.lanes) && telegraph.lanes.includes(lane);
    }
    return false;
  }

  function getEnemyTelegraphs({ telegraphs, enemyId }) {
    return (Array.isArray(telegraphs) ? telegraphs : []).filter((telegraph) => telegraph.sourceEnemyId === enemyId);
  }

  function getTelegraphCoverageLanes({ telegraph, getLobLanes }) {
    if (telegraph?.type === "lob") {
      return getLobLanes(telegraph.targetLane, telegraph.radius);
    }
    if (telegraph?.type === "sweep") {
      return [...(Array.isArray(telegraph.lanes) ? telegraph.lanes : [])];
    }
    return [];
  }

  function getTelegraphThreatTypeLabel({ telegraph }) {
    if (telegraph?.type === "lob") {
      return "LOB";
    }
    if (telegraph?.type === "sweep") {
      if (telegraph.direction === "left") {
        return "SWEEP <";
      }
      if (telegraph.direction === "right") {
        return "SWEEP >";
      }
      return "SWEEP";
    }
    return "THREAT";
  }

  function createLaneHighlightController({
    game,
    parseLaneDataFn = () => [],
    renderTrackMapFn = () => {},
  }) {
    function setLaneHighlight(lanes, lockKey = null) {
      if (!game || typeof game !== "object") {
        return;
      }
      const uniqueLanes = [...new Set(Array.isArray(lanes) ? lanes : [])];
      game.highlightLanes = uniqueLanes;
      game.highlightLockKey = lockKey;
      renderTrackMapFn();
    }

    function clearLaneHighlight(force = false) {
      if (!game || typeof game !== "object") {
        return;
      }
      if (!force && game.highlightLockKey !== null) {
        return;
      }
      if (game.highlightLanes.length === 0 && game.highlightLockKey === null) {
        return;
      }
      game.highlightLanes = [];
      game.highlightLockKey = null;
      renderTrackMapFn();
    }

    function toggleLockedHighlight(lockKey, lanes) {
      if (!game || typeof game !== "object") {
        return;
      }
      if (game.highlightLockKey === lockKey) {
        clearLaneHighlight(true);
        return;
      }
      setLaneHighlight(lanes, lockKey);
    }

    function bindLaneHighlightInteractions(items, keyPrefix) {
      const list = items && typeof items.forEach === "function" ? items : [];
      list.forEach((item, index) => {
        const lanes = parseLaneDataFn(item?.dataset?.lanes || "");
        if (lanes.length === 0) {
          return;
        }
        const fallback = (item.textContent || "").trim() || `row_${index + 1}`;
        const highlightKey = item.dataset.highlightKey || `${keyPrefix}_${index + 1}_${fallback}`;

        item.addEventListener("pointerenter", (event) => {
          event.stopPropagation();
          if (game.highlightLockKey !== null) {
            return;
          }
          setLaneHighlight(lanes, null);
        });

        item.addEventListener("pointerleave", (event) => {
          event.stopPropagation();
          if (game.highlightLockKey !== null) {
            return;
          }
          clearLaneHighlight(false);
        });

        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleLockedHighlight(highlightKey, lanes);
        });
      });
    }

    return {
      setLaneHighlight,
      clearLaneHighlight,
      toggleLockedHighlight,
      bindLaneHighlightInteractions,
    };
  }

  function renderTrackMap({
    rootEl,
    trackLanes,
    playerLane,
    highlightLanes,
    telegraphs,
    recentImpacts,
    aimedThreats,
    telegraphAffectsLaneFn,
    getTelegraphProgress,
    cookTierLabel,
    trainMarkerSrc,
  }) {
    if (!rootEl) {
      return;
    }

    const highlightSet = new Set(Array.isArray(highlightLanes) ? highlightLanes : []);
    const activeTelegraphs = Array.isArray(telegraphs) ? telegraphs : [];
    const now = Date.now();
    const activeImpacts = (Array.isArray(recentImpacts) ? recentImpacts : []).filter(
      (impact) => Number.isFinite(impact?.until) && impact.until > now
    );
    const laneThreats = aimedThreats instanceof Map ? aimedThreats : new Map();
    rootEl.innerHTML = "";

    for (let lane = 0; lane < trackLanes; lane += 1) {
      const laneEl = document.createElement("div");
      laneEl.className = "track-lane";
      if (highlightSet.has(lane)) {
        laneEl.classList.add("threat-highlight");
      }
      if (lane === playerLane) {
        laneEl.classList.add("player-lane");
      }
      if (laneThreats.has(lane)) {
        laneEl.classList.add("aim-threat-lane");
      }

      const laneId = document.createElement("span");
      laneId.className = "lane-id";
      laneId.textContent = `T${lane + 1}`;
      laneEl.appendChild(laneId);

      activeTelegraphs.forEach((telegraph) => {
        const affectsLane =
          typeof telegraphAffectsLaneFn === "function"
            ? telegraphAffectsLaneFn(telegraph, lane)
            : telegraph?.type === "sweep" && Array.isArray(telegraph.lanes)
              ? telegraph.lanes.includes(lane)
              : false;
        if (!affectsLane) {
          return;
        }

        const marker = document.createElement("div");
        const progress = typeof getTelegraphProgress === "function" ? getTelegraphProgress(telegraph) : 0;
        const progressPct = `${Math.round(progress * 100)}%`;
        marker.style.setProperty("--fill-pct", progressPct);
        marker.classList.add(`tier-${telegraph.cookTier}`);

        if (telegraph.type === "lob") {
          marker.className = "telegraph lob";
          marker.classList.add(`tier-${telegraph.cookTier}`);
          if (lane !== telegraph.targetLane) {
            marker.classList.add("spill");
          }
        } else if (telegraph.type === "sweep") {
          marker.className = `telegraph directional ${telegraph.direction || "right"}`;
          marker.classList.add(`tier-${telegraph.cookTier}`);
        }

        const tierBadge = document.createElement("span");
        tierBadge.className = "telegraph-tier";
        tierBadge.textContent = cookTierLabel[telegraph.cookTier];
        marker.appendChild(tierBadge);
        laneEl.appendChild(marker);
      });

      const laneImpact = activeImpacts.find(
        (impact) => Array.isArray(impact?.lanes) && impact.lanes.includes(lane)
      );
      if (laneImpact) {
        const impactEl = document.createElement("span");
        impactEl.className = `lane-impact lane-impact-${laneImpact.type || "hit"}`;
        laneEl.appendChild(impactEl);
      }

      if (laneThreats.has(lane)) {
        const threat = laneThreats.get(lane);
        const marker = document.createElement("span");
        marker.className = "aim-threat-marker";
        marker.textContent = threat.count > 1 ? `LOCK x${threat.count}` : "LOCK";
        marker.title = `Aimed shot threat: up to ${threat.maxDamage} dmg`;
        laneEl.appendChild(marker);
      }

      if (lane === playerLane) {
        const playerBadge = document.createElement("span");
        playerBadge.className = "player-lane-badge";
        playerBadge.textContent = "YOU";
        laneEl.appendChild(playerBadge);

        const marker = document.createElement("img");
        marker.className = "train-marker";
        marker.src = trainMarkerSrc;
        marker.alt = "Your Position";
        laneEl.appendChild(marker);
      }

      rootEl.appendChild(laneEl);
    }
  }

  window.BRASSLINE_THREATS = {
    telegraphAffectsLane,
    getEnemyTelegraphs,
    getTelegraphCoverageLanes,
    getTelegraphThreatTypeLabel,
    createLaneHighlightController,
    renderTrackMap,
  };
})();
