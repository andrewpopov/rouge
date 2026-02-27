(() => {
  function safeEscape(escapeHtml, value) {
    if (typeof escapeHtml === "function") {
      return escapeHtml(value);
    }
    return String(value);
  }

  function createUpgradeNode({
    path,
    onClick,
    options = {},
    getUpgradeLevel,
    reactorFrame,
    escapeHtml,
  }) {
    const currentLevel = getUpgradeLevel(path.id);
    const nextLevel = Math.min(path.maxLevel, currentLevel + 1);
    const suggestedTag = options.suggested
      ? '<span class="reward-suggested-tag" aria-label="Suggested upgrade">Suggested</span>'
      : "";
    const node = document.createElement("article");
    node.className = "card reward-upgrade";
    if (options.suggested) {
      node.classList.add("suggested-upgrade");
    }
    node.style.setProperty("--card-frame", `url("${reactorFrame}")`);
    node.innerHTML = `
    <div class="card-top">
      <div>
        <p class="card-type">Upgrade Path</p>
        <h3 class="card-title">${safeEscape(escapeHtml, path.title)}</h3>
      </div>
      <span class="card-cost">L${nextLevel}</span>
    </div>
    ${suggestedTag}
    <img class="card-icon" src="${path.icon}" alt="${safeEscape(escapeHtml, path.title)}" />
    <p class="card-text">${safeEscape(escapeHtml, path.description)}</p>
    <span class="card-foot">${safeEscape(escapeHtml, `Lv ${currentLevel}/${path.maxLevel} -> Lv ${nextLevel}/${path.maxLevel} // ${path.bonusLabel(nextLevel)}`)}</span>
  `;
    node.addEventListener("click", onClick);
    return node;
  }

  function getSuggestedUpgradePathId({ upgradePathCatalog, getUpgradeLevel }) {
    const suggested = Object.values(upgradePathCatalog)
      .map((path) => ({
        path,
        level: getUpgradeLevel(path.id),
      }))
      .filter((entry) => entry.level < entry.path.maxLevel)
      .sort((a, b) => a.level - b.level || a.path.title.localeCompare(b.path.title))[0];
    return suggested ? suggested.path.id : null;
  }

  function renderUpgradeStrip({
    upgradeStripEl,
    upgradePathCatalog,
    getUpgradeLevel,
    getMetaInstalledLevelsTotal,
    getMetaPossibleLevelsTotal,
    escapeHtml,
  }) {
    if (!upgradeStripEl) {
      return;
    }

    const totalLevels = getMetaInstalledLevelsTotal();
    const totalPossible = getMetaPossibleLevelsTotal();
    const headRow = `
    <div class="upgrade-head-row">
      <p class="upgrade-head">Upgrade Paths</p>
      <span class="upgrade-progress-pill">${safeEscape(escapeHtml, `${totalLevels}/${totalPossible}`)}</span>
    </div>
  `;

    const activeUpgrades = Object.values(upgradePathCatalog)
      .map((path) => {
        const level = getUpgradeLevel(path.id);
        if (level <= 0) {
          return null;
        }
        return {
          path,
          level,
        };
      })
      .filter(Boolean);

    if (activeUpgrades.length === 0) {
      upgradeStripEl.innerHTML = `
      ${headRow}
      <p class="upgrade-empty">
        none installed.
      </p>
    `;
      return;
    }

    const chips = activeUpgrades
      .map(
        (entry) => `
        <div class="upgrade-chip">
          <strong>${safeEscape(escapeHtml, `${entry.path.title} Lv ${entry.level}/${entry.path.maxLevel}`)}</strong>
          <small>${safeEscape(escapeHtml, entry.path.bonusLabel(entry.level))}</small>
        </div>
      `
      )
      .join("");

    upgradeStripEl.innerHTML = `
    ${headRow}
    <div class="upgrade-grid">${chips}</div>
  `;
  }

  function renderRewardMetaSummary({
    rewardMetaEl,
    upgradePathCatalog,
    getUpgradeLevel,
    getSuggestedUpgradePathIdFn,
    escapeHtml,
  }) {
    if (!rewardMetaEl) {
      return;
    }

    const pathLevels = Object.values(upgradePathCatalog).map((path) => ({
      path,
      level: getUpgradeLevel(path.id),
    }));
    const totalLevels = pathLevels.reduce((sum, entry) => sum + entry.level, 0);
    const totalPossible = pathLevels.reduce((sum, entry) => sum + entry.path.maxLevel, 0);
    const suggestedPathId = getSuggestedUpgradePathIdFn();
    const suggested = suggestedPathId ? pathLevels.find((entry) => entry.path.id === suggestedPathId) : null;

    const chips = pathLevels
      .map(
        (entry) =>
          `<span class="reward-meta-chip">${safeEscape(escapeHtml, `${entry.path.title} Lv ${entry.level}/${entry.path.maxLevel}`)}</span>`
      )
      .join("");
    const suggestionText = suggested
      ? `Suggested next: ${suggested.path.title} Lv ${suggested.level + 1}/${suggested.path.maxLevel}.`
      : "All upgrade paths are maxed.";
    const suggestionClass = suggested ? "reward-meta-tip" : "reward-meta-tip done";

    rewardMetaEl.innerHTML = `
    <div class="reward-meta-top">
      <p class="reward-meta-title">Meta Progress</p>
      <strong>${safeEscape(escapeHtml, `${totalLevels}/${totalPossible} levels installed`)}</strong>
    </div>
    <div class="reward-meta-grid">${chips}</div>
    <p class="${suggestionClass}">${safeEscape(escapeHtml, suggestionText)}</p>
  `;
  }

  function renderRewardPanel({
    rewardPanelEl,
    rewardMetaEl,
    rewardSubtitleEl,
    rewardChoicesEl,
    phase,
    intermissionHealing,
    sectorIndex,
    runSectors,
    sector,
    rewardChoices,
    getSuggestedUpgradePathIdFn,
    renderRewardMetaSummaryFn,
    upgradePathCatalog,
    createUpgradeNodeFn,
    createCardNodeFn,
    cardCatalog,
    onApplyRewardAndAdvance,
  }) {
    const visible = phase === "reward";
    rewardPanelEl.classList.toggle("hidden", !visible);
    if (!visible) {
      if (rewardMetaEl) {
        rewardMetaEl.innerHTML = "";
      }
      return;
    }

    const suggestedPathId = getSuggestedUpgradePathIdFn();
    rewardSubtitleEl.textContent = `Sector ${sectorIndex + 1}/${runSectors.length} cleared (${sector.name}). Pick 1 reward (card or upgrade path) and repair +${intermissionHealing} Hull.`;
    renderRewardMetaSummaryFn();
    rewardChoicesEl.innerHTML = "";

    rewardChoices.forEach((choice) => {
      if (choice?.type === "upgrade") {
        const path = upgradePathCatalog[choice.upgradeId];
        if (!path) {
          return;
        }
        const node = createUpgradeNodeFn(
          path,
          () => {
            onApplyRewardAndAdvance(choice);
          },
          { suggested: path.id === suggestedPathId }
        );
        node.classList.add("reward-choice");
        rewardChoicesEl.appendChild(node);
        return;
      }

      const cardId = typeof choice === "string" ? choice : choice?.cardId;
      const card = cardCatalog[cardId];
      if (!card) {
        return;
      }
      const node = createCardNodeFn(card, true, () => {
        onApplyRewardAndAdvance({ type: "card", cardId });
      });
      node.classList.add("reward-choice");
      rewardChoicesEl.appendChild(node);
    });
  }

  function renderInterludePanel({
    interludePanelEl,
    interludeTitleEl,
    interludeSubtitleEl,
    interludeChoicesEl,
    phase,
    interlude,
    describeInterludeOptionEffectsFn,
    escapeHtml,
    onResolveInterludeOption,
  }) {
    if (!interludePanelEl || !interludeTitleEl || !interludeSubtitleEl || !interludeChoicesEl) {
      return;
    }

    const visible = phase === "interlude" && Boolean(interlude);
    interludePanelEl.classList.toggle("hidden", !visible);
    if (!visible) {
      interludeTitleEl.textContent = "Interlude";
      interludeSubtitleEl.textContent = "";
      interludeChoicesEl.innerHTML = "";
      return;
    }

    interludeTitleEl.textContent = interlude.type === "shop" ? `Depot: ${interlude.title}` : interlude.title;
    interludeSubtitleEl.textContent = interlude.description;
    interludeChoicesEl.innerHTML = "";

    interlude.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "control-btn neutral interlude-choice-btn";
      const effectText = describeInterludeOptionEffectsFn(option);
      button.innerHTML = `
      <strong>${safeEscape(escapeHtml, option.label)}</strong>
      <small>${safeEscape(escapeHtml, effectText || "No immediate reactor change.")}</small>
    `;
      button.addEventListener("click", () => {
        onResolveInterludeOption(index);
      });
      interludeChoicesEl.appendChild(button);
    });
  }

  function buildRunSummaryRows({
    won,
    turn,
    stats,
    records,
    sectorsCleared,
    sectorCount,
    deckSize,
    installedLevels,
    possibleLevels,
  }) {
    return [
      { label: "Sectors Cleared", value: `${sectorsCleared}/${sectorCount}` },
      { label: "Turns", value: String(turn) },
      { label: "Cards Played", value: String(stats.cardsPlayed) },
      { label: "Damage Dealt", value: String(stats.damageDealt) },
      { label: "Damage Taken", value: String(stats.damageTaken) },
      { label: "Enemies Destroyed", value: String(stats.enemiesDestroyed) },
      { label: "Rewards Taken", value: String(stats.rewardsClaimed) },
      { label: "Reward Skips", value: String(stats.rewardSkips) },
      { label: "Deck Size", value: String(deckSize) },
      { label: "Meta Levels", value: `${installedLevels}/${possibleLevels}` },
      { label: "Profile Runs", value: String(records.totalRuns) },
      { label: "Profile Wins", value: String(records.wins) },
      {
        key: "bestVictoryTurns",
        label: "Best Clear (Turns)",
        value: records.bestVictoryTurns === null ? "--" : String(records.bestVictoryTurns),
      },
      { key: "bestDamageDealt", label: "Best Damage", value: String(records.bestDamageDealt) },
      { key: "bestSectorsCleared", label: "Best Sector Clear", value: `${records.bestSectorsCleared}/${sectorCount}` },
      { key: "bestMetaLevels", label: "Best Meta Levels", value: `${records.bestMetaLevels}/${possibleLevels}` },
    ];
  }

  function normalizeTimelineEvents(rawTimeline) {
    return (Array.isArray(rawTimeline) ? rawTimeline : [])
      .map((entry) => {
        if (typeof entry === "string") {
          return {
            line: entry,
            type: "info",
          };
        }
        if (entry && typeof entry === "object" && typeof entry.line === "string") {
          return {
            line: entry.line,
            type: typeof entry.type === "string" && entry.type ? entry.type : "info",
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function renderRunSummaryPanel({
    runSummaryPanelEl,
    runSummaryTitleEl,
    runSummarySubtitleEl,
    runSummaryStatsEl,
    runSummaryTimelineEl,
    toggleRunTimelineBtnEl,
    phase,
    turn,
    sectorIndex,
    runSectors,
    runTimeline,
    showFullTimeline,
    runRecordHighlights,
    runTimelineRecentCount,
    getCurrentSectorFn,
    ensureRunStatsFn,
    ensureRunRecordsFn,
    getMetaInstalledLevelsTotalFn,
    getMetaPossibleLevelsTotalFn,
    collectDeckInstancesFn,
    clamp,
    escapeHtml,
  }) {
    if (
      !runSummaryPanelEl ||
      !runSummaryTitleEl ||
      !runSummarySubtitleEl ||
      !runSummaryStatsEl ||
      !runSummaryTimelineEl
    ) {
      return;
    }

    const visible = phase === "run_victory" || phase === "gameover";
    runSummaryPanelEl.classList.toggle("hidden", !visible);
    if (!visible) {
      runSummaryTitleEl.textContent = "Run Summary";
      runSummarySubtitleEl.textContent = "";
      runSummaryStatsEl.innerHTML = "";
      if (toggleRunTimelineBtnEl) {
        toggleRunTimelineBtnEl.classList.add("hidden");
        toggleRunTimelineBtnEl.textContent = "Show Full Timeline";
      }
      runSummaryTimelineEl.innerHTML = "";
      return;
    }

    const stats = ensureRunStatsFn();
    const records = ensureRunRecordsFn();
    const won = phase === "run_victory";
    const installedLevels = getMetaInstalledLevelsTotalFn();
    const possibleLevels = getMetaPossibleLevelsTotalFn();
    const deckSize = collectDeckInstancesFn().length;
    const sectorsCleared = won ? runSectors.length : clamp(sectorIndex, 0, runSectors.length);

    runSummaryTitleEl.textContent = won ? "Route Secured" : "Reactor Lost";
    if (won) {
      runSummarySubtitleEl.textContent = `Foundry Crown secured in ${turn} turns.`;
    } else {
      const sector = getCurrentSectorFn();
      const sectorName = sector ? sector.name : "Unknown Sector";
      const displayIndex = clamp(sectorIndex + 1, 1, runSectors.length);
      runSummarySubtitleEl.textContent = `Destroyed in Sector ${displayIndex}/${runSectors.length} (${sectorName}).`;
    }

    const rows = buildRunSummaryRows({
      won,
      turn,
      stats,
      records,
      sectorsCleared,
      sectorCount: runSectors.length,
      deckSize,
      installedLevels,
      possibleLevels,
    });

    runSummaryStatsEl.innerHTML = rows
      .map((row) => {
        const recordKey = typeof row.key === "string" ? row.key : "";
        const highlight = recordKey ? Boolean(runRecordHighlights?.[recordKey]) : false;
        const className = highlight ? "run-summary-stat new-record" : "run-summary-stat";
        const keyAttr = recordKey ? ` data-record-key="${safeEscape(escapeHtml, recordKey)}"` : "";
        const badge = highlight ? '<em class="run-record-badge">New</em>' : "";
        return `
        <div class="${className}"${keyAttr}>
          <span>${safeEscape(escapeHtml, row.label)}${badge}</span>
          <strong>${safeEscape(escapeHtml, row.value)}</strong>
        </div>
      `;
      })
      .join("");

    const timelineEvents = normalizeTimelineEvents(runTimeline);
    const totalTimelineItems = timelineEvents.length;
    const shouldClampTimeline = totalTimelineItems > runTimelineRecentCount;
    const showFull = !shouldClampTimeline || showFullTimeline;
    const timelineItems = (showFull ? timelineEvents : timelineEvents.slice(-runTimelineRecentCount)).reverse();

    if (toggleRunTimelineBtnEl) {
      toggleRunTimelineBtnEl.classList.toggle("hidden", !shouldClampTimeline);
      toggleRunTimelineBtnEl.textContent = showFull ? "Show Recent Timeline" : "Show Full Timeline";
    }

    if (timelineItems.length === 0) {
      runSummaryTimelineEl.innerHTML = `
      <p class="run-timeline-empty">No timeline events recorded.</p>
    `;
      return;
    }

    const typeMeta = {
      info: {
        label: "INFO",
        icon: "./assets/curated/icons/ui/idea_light-bulb.svg",
      },
      system: {
        label: "SYSTEM",
        icon: "./assets/curated/icons/ui/idea_light-bulb.svg",
      },
      sector: {
        label: "SECTOR",
        icon: "./assets/curated/icons/ui/turn_pocket-watch.svg",
      },
      reward: {
        label: "REWARD",
        icon: "./assets/curated/icons/ui/energy_battery-50.svg",
      },
      danger: {
        label: "DANGER",
        icon: "./assets/curated/icons/ui/crit_cross-flare.svg",
      },
      victory: {
        label: "VICTORY",
        icon: "./assets/curated/icons/ui/hp_life-bar.svg",
      },
    };
    const timelineHtml = timelineItems
      .map((entry) => {
        const meta = typeMeta[entry.type] || typeMeta.info;
        return `
        <li class="run-timeline-item">
          <span class="run-timeline-tag ${safeEscape(escapeHtml, entry.type)}">
            <img class="run-timeline-icon" src="${safeEscape(escapeHtml, meta.icon)}" alt="" />
            ${safeEscape(escapeHtml, meta.label)}
          </span>
          <span class="run-timeline-line">${safeEscape(escapeHtml, entry.line)}</span>
        </li>
      `;
      })
      .join("");
    const countText = showFull
      ? `Showing all ${totalTimelineItems} events`
      : `Showing recent ${timelineItems.length}/${totalTimelineItems} events`;
    runSummaryTimelineEl.innerHTML = `
    <p class="run-timeline-title">Run Timeline</p>
    <p class="run-timeline-count">${safeEscape(escapeHtml, countText)}</p>
    <ol class="run-timeline-list">${timelineHtml}</ol>
  `;
  }

  window.BRASSLINE_RUN_UI = {
    createUpgradeNode,
    getSuggestedUpgradePathId,
    renderUpgradeStrip,
    renderRewardMetaSummary,
    renderRewardPanel,
    renderInterludePanel,
    renderRunSummaryPanel,
  };
})();
