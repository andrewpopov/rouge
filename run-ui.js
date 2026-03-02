(() => {
  function normalizeArtifactRarity(artifact) {
    const explicit = typeof artifact?.rarity === "string" ? artifact.rarity.trim().toLowerCase() : "";
    if (explicit === "common" || explicit === "uncommon" || explicit === "rare") {
      return explicit;
    }

    const weight = Number.parseInt(artifact?.weight, 10);
    if (Number.isInteger(weight)) {
      if (weight <= 1) {
        return "rare";
      }
      if (weight <= 2) {
        return "uncommon";
      }
    }
    return "common";
  }

  function getArtifactRarityLabel(artifact) {
    const rarity = normalizeArtifactRarity(artifact);
    if (rarity === "rare") {
      return "Rare";
    }
    if (rarity === "uncommon") {
      return "Uncommon";
    }
    return "Common";
  }

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
    const nextTierUnlock = (Array.isArray(path.tierUnlocks) ? path.tierUnlocks : []).find(
      (tier) => tier.level === nextLevel
    );
    const nextTierText = nextTierUnlock ? ` // Unlock ${nextTierUnlock.title}` : "";
    const suggestedTag = options.suggested
      ? '<span class="reward-suggested-tag" aria-label="Suggested upgrade">Suggested</span>'
      : "";
    const branchChoice = options.branchChoice && typeof options.branchChoice === "object"
      ? options.branchChoice
      : null;
    const branchTypeText =
      branchChoice && typeof branchChoice.title === "string" ? "Upgrade Path // Branch" : "Upgrade Path";
    const branchFootText =
      branchChoice && typeof branchChoice.title === "string"
        ? ` // Branch ${branchChoice.title}`
        : "";
    const branchDescription =
      branchChoice && typeof branchChoice.description === "string" && branchChoice.description.trim()
        ? ` // ${branchChoice.description.trim()}`
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
        <p class="card-type">${safeEscape(escapeHtml, branchTypeText)}</p>
        <h3 class="card-title">${safeEscape(escapeHtml, path.title)}</h3>
      </div>
      <span class="card-cost">L${nextLevel}</span>
    </div>
    ${suggestedTag}
    <img class="card-icon" src="${path.icon}" alt="${safeEscape(escapeHtml, path.title)}" />
    <p class="card-text">${safeEscape(escapeHtml, `${path.description}${branchDescription}`)}</p>
    <span class="card-foot">${safeEscape(escapeHtml, `Lv ${currentLevel}/${path.maxLevel} -> Lv ${nextLevel}/${path.maxLevel} // ${path.bonusLabel(nextLevel)}${nextTierText}${branchFootText}`)}</span>
  `;
    node.addEventListener("click", onClick);
    return node;
  }

  function createArtifactNode({
    artifact,
    onClick,
    reactorFrame,
    escapeHtml,
  }) {
    const rarity = normalizeArtifactRarity(artifact);
    const rarityLabel = getArtifactRarityLabel(artifact);
    const node = document.createElement("article");
    node.className = "card reward-artifact";
    node.classList.add(`rarity-${rarity}`);
    node.style.setProperty("--card-frame", `url("${reactorFrame}")`);
    node.innerHTML = `
    <div class="card-top">
      <div>
        <p class="card-type">Artifact // ${safeEscape(escapeHtml, rarityLabel)}</p>
        <h3 class="card-title">${safeEscape(escapeHtml, artifact.title)}</h3>
      </div>
      <div class="artifact-meta">
        <span class="artifact-rarity-pill rarity-${safeEscape(escapeHtml, rarity)}">${safeEscape(
          escapeHtml,
          rarityLabel
        )}</span>
        <span class="card-cost">Passive</span>
      </div>
    </div>
    <img class="card-icon" src="${artifact.icon}" alt="${safeEscape(escapeHtml, artifact.title)}" />
    <p class="card-text">${safeEscape(escapeHtml, artifact.description)}</p>
    <span class="card-foot">${safeEscape(escapeHtml, "Unique // One per run")}</span>
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
        const unlockedTiers = (Array.isArray(path.tierUnlocks) ? path.tierUnlocks : []).filter(
          (tier) => level >= tier.level
        );
        return {
          path,
          level,
          unlockedTiers,
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
          <small>${safeEscape(
            escapeHtml,
            `Tiers ${entry.unlockedTiers.length}/${Array.isArray(entry.path.tierUnlocks) ? entry.path.tierUnlocks.length : 0}`
          )}</small>
        </div>
      `
      )
      .join("");

    upgradeStripEl.innerHTML = `
    ${headRow}
    <div class="upgrade-grid">${chips}</div>
  `;
  }

  function renderArtifactStrip({
    artifactStripEl,
    artifactCatalog,
    artifacts,
    escapeHtml,
  }) {
    if (!artifactStripEl) {
      return;
    }

    const ownedArtifacts = (Array.isArray(artifacts) ? artifacts : [])
      .map((artifactId) => artifactCatalog?.[artifactId])
      .filter(Boolean);
    const headRow = `
    <div class="upgrade-head-row">
      <p class="upgrade-head">Artifacts</p>
      <span class="upgrade-progress-pill">${safeEscape(escapeHtml, `${ownedArtifacts.length}`)}</span>
    </div>
  `;

    if (ownedArtifacts.length === 0) {
      artifactStripEl.innerHTML = `
      ${headRow}
      <p class="upgrade-empty">
        none installed.
      </p>
    `;
      return;
    }

    const chips = ownedArtifacts
      .map(
        (artifact) => {
          const rarity = normalizeArtifactRarity(artifact);
          const rarityLabel = getArtifactRarityLabel(artifact);
          return `
        <div class="artifact-chip rarity-${safeEscape(escapeHtml, rarity)}">
          <strong>${safeEscape(escapeHtml, artifact.title)}</strong>
          <small class="artifact-rarity">${safeEscape(escapeHtml, rarityLabel)}</small>
          <small>${safeEscape(escapeHtml, artifact.description)}</small>
        </div>
      `;
        }
      )
      .join("");

    artifactStripEl.innerHTML = `
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
    const unlockedTiers = pathLevels.reduce(
      (sum, entry) =>
        sum +
        (Array.isArray(entry.path.tierUnlocks)
          ? entry.path.tierUnlocks.filter((tier) => entry.level >= tier.level).length
          : 0),
      0
    );
    const totalTiers = pathLevels.reduce(
      (sum, entry) => sum + (Array.isArray(entry.path.tierUnlocks) ? entry.path.tierUnlocks.length : 0),
      0
    );
    const suggestedPathId = getSuggestedUpgradePathIdFn();
    const suggested = suggestedPathId ? pathLevels.find((entry) => entry.path.id === suggestedPathId) : null;

    const chips = pathLevels
      .map(
        (entry) =>
          `<span class="reward-meta-chip">${safeEscape(
            escapeHtml,
            `${entry.path.title} Lv ${entry.level}/${entry.path.maxLevel} // T${Array.isArray(entry.path.tierUnlocks)
              ? entry.path.tierUnlocks.filter((tier) => entry.level >= tier.level).length
              : 0}`
          )}</span>`
      )
      .join("");
    const suggestionText = suggested
      ? `Suggested next: ${suggested.path.title} Lv ${suggested.level + 1}/${suggested.path.maxLevel}.`
      : "All upgrade paths are maxed.";
    const suggestionClass = suggested ? "reward-meta-tip" : "reward-meta-tip done";

    rewardMetaEl.innerHTML = `
    <div class="reward-meta-top">
      <p class="reward-meta-title">Meta Progress</p>
      <strong>${safeEscape(escapeHtml, `${totalLevels}/${totalPossible} levels installed // ${unlockedTiers}/${totalTiers} tiers unlocked`)}</strong>
    </div>
    <div class="reward-meta-grid">${chips}</div>
    <p class="${suggestionClass}">${safeEscape(escapeHtml, suggestionText)}</p>
  `;
  }

  function renderRewardPanel({
    rewardPanelEl,
    rewardMetaEl,
    rewardIntelEl,
    rewardSubtitleEl,
    rewardChoicesEl,
    phase,
    intermissionHealing,
    sectorIndex,
    runSectors,
    sector,
    nextSectorIntel = null,
    rewardChoices,
    artifactCatalog,
    getSuggestedUpgradePathIdFn,
    renderRewardMetaSummaryFn,
    upgradePathCatalog,
    createUpgradeNodeFn,
    createArtifactNodeFn,
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
      if (rewardIntelEl) {
        rewardIntelEl.innerHTML = "";
      }
      return;
    }

    const suggestedPathId = getSuggestedUpgradePathIdFn();
    rewardSubtitleEl.textContent = `Sector ${sectorIndex + 1}/${runSectors.length} cleared (${sector.name}). Pick 1 reward (card, artifact, or upgrade path) and repair +${intermissionHealing} Hull.`;
    renderRewardMetaSummaryFn();
    if (rewardIntelEl) {
      const nextSector = nextSectorIntel || runSectors[sectorIndex + 1] || null;
      const intelTitle = nextSector
        ? `Next Sector ${sectorIndex + 2}/${runSectors.length}: ${nextSector.name}${nextSector.boss ? " // Boss" : ""}`
        : "Final push ahead";
      const intelLines = [];
      if (nextSector) {
        const enemyPoolSize = Array.isArray(nextSector.enemies) ? nextSector.enemies.length : 0;
        const encounterSizeRaw = Number.parseInt(nextSector?.encounterSize, 10);
        const encounterSize =
          Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
            ? Math.min(encounterSizeRaw, Math.max(1, enemyPoolSize))
            : enemyPoolSize;
        const eliteChanceRaw =
          Number.isFinite(nextSector?.eliteChance) && nextSector.eliteChance >= 0 && nextSector.eliteChance <= 1
            ? nextSector.eliteChance
            : 0;
        const elitePct = Math.round(eliteChanceRaw * 100);
        const modifierSummary =
          typeof nextSector?.modifierSummary === "string" && nextSector.modifierSummary.trim()
            ? nextSector.modifierSummary.trim()
            : "Mutators: none configured.";
        const likelyThreats =
          Array.isArray(nextSector?.likelyThreats) && nextSector.likelyThreats.length > 0
            ? `Likely threats: ${nextSector.likelyThreats.join(" // ")}`
            : "Likely threats: unknown.";
        const likelyThreatEntries = Array.isArray(nextSector?.likelyThreatEntries)
          ? nextSector.likelyThreatEntries
          : [];
        const threatGridHtml =
          likelyThreatEntries.length > 0
            ? `<div class="reward-intel-threat-grid">
                ${likelyThreatEntries
                  .map((entry) => {
                    const eliteTag = entry?.elite ? '<em class="reward-intel-threat-elite">ELITE</em>' : "";
                    const iconHtml =
                      typeof entry?.icon === "string" && entry.icon.trim()
                        ? `<img src="${safeEscape(escapeHtml, entry.icon)}" alt="" />`
                        : "";
                    const intelDescription =
                      typeof entry?.intelDescription === "string" && entry.intelDescription.trim()
                        ? entry.intelDescription.trim()
                        : "Pattern intel unavailable.";
                    return `<div class="reward-intel-threat-chip" title="${safeEscape(
                      escapeHtml,
                      intelDescription
                    )}" aria-label="${safeEscape(escapeHtml, intelDescription)}">
                      <div class="reward-intel-threat-head">
                        ${iconHtml}
                        <strong>${safeEscape(escapeHtml, entry?.name || entry?.key || "Unknown")}</strong>
                      </div>
                      <small>${safeEscape(escapeHtml, `${entry?.chancePct ?? 0}%`)}</small>
                      ${eliteTag}
                    </div>`;
                  })
                  .join("")}
              </div>`
            : "";
        intelLines.push(`Encounter: ${encounterSize} from ${enemyPoolSize} templates.`);
        intelLines.push(elitePct > 0 ? `Elite risk: ${elitePct}%` : "Elite risk: none.");
        intelLines.push(likelyThreats);
        intelLines.push(modifierSummary);
        intelLines.push(threatGridHtml);
      } else {
        intelLines.push("No further sectors after this reward.");
      }
      rewardIntelEl.innerHTML = `
      <p class="reward-intel-title">${safeEscape(escapeHtml, intelTitle)}</p>
      <div class="reward-intel-lines">
        ${intelLines
          .map((line) =>
            line.startsWith('<div class="reward-intel-threat-grid">')
              ? line
              : `<p class="reward-intel-line">${safeEscape(escapeHtml, line)}</p>`
          )
          .join("")}
      </div>
    `;
    }
    rewardChoicesEl.innerHTML = "";

    rewardChoices.forEach((choice) => {
      if (choice?.type === "upgrade") {
        const path = upgradePathCatalog[choice.upgradeId];
        if (!path) {
          return;
        }
        const branchChoice =
          typeof choice?.branchId === "string" && Array.isArray(path?.branchChoices?.options)
            ? path.branchChoices.options.find((option) => option?.id === choice.branchId) || null
            : null;
        const node = createUpgradeNodeFn(
          path,
          () => {
            onApplyRewardAndAdvance(choice);
          },
          { suggested: path.id === suggestedPathId, branchChoice }
        );
        node.classList.add("reward-choice");
        rewardChoicesEl.appendChild(node);
        return;
      }

      if (choice?.type === "artifact") {
        const artifact = artifactCatalog?.[choice.artifactId];
        if (!artifact) {
          return;
        }
        const node = createArtifactNodeFn({
          artifact,
          onClick: () => {
            onApplyRewardAndAdvance(choice);
          },
        });
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
    artifactCount,
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
      { label: "Artifacts", value: String(artifactCount) },
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

  function buildRunSummaryArtifactHtml({ artifactCatalog, artifacts, escapeHtml }) {
    const ownedArtifacts = (Array.isArray(artifacts) ? artifacts : [])
      .map((artifactId) => artifactCatalog?.[artifactId])
      .filter(Boolean);
    if (ownedArtifacts.length === 0) {
      return '<p class="run-summary-artifacts-empty">Artifacts: none installed.</p>';
    }
    const chips = ownedArtifacts
      .map(
        (artifact) => `
        <span
          class="run-summary-artifact-chip rarity-${safeEscape(escapeHtml, normalizeArtifactRarity(artifact))}"
          title="${safeEscape(escapeHtml, `${artifact.description} // ${getArtifactRarityLabel(artifact)}`)}"
        >
          <em>${safeEscape(escapeHtml, getArtifactRarityLabel(artifact))}</em>
          ${safeEscape(escapeHtml, artifact.title)}
        </span>
      `
      )
      .join("");
    return `
    <div class="run-summary-artifacts">
      <p class="run-summary-artifacts-title">Artifacts</p>
      <div class="run-summary-artifact-grid">${chips}</div>
    </div>
  `;
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
    artifactCatalog = {},
    artifacts = [],
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
      artifactCount: (Array.isArray(artifacts) ? artifacts : []).length,
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
      const artifactsHtml = buildRunSummaryArtifactHtml({
        artifactCatalog,
        artifacts,
        escapeHtml,
      });
      runSummaryTimelineEl.innerHTML = `
      ${artifactsHtml}
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
    const artifactsHtml = buildRunSummaryArtifactHtml({
      artifactCatalog,
      artifacts,
      escapeHtml,
    });
    runSummaryTimelineEl.innerHTML = `
    ${artifactsHtml}
    <p class="run-timeline-title">Run Timeline</p>
    <p class="run-timeline-count">${safeEscape(escapeHtml, countText)}</p>
    <ol class="run-timeline-list">${timelineHtml}</ol>
  `;
  }

  function toggleRunTimelineView({ game, renderRunSummaryPanelFn }) {
    if (!game || typeof game !== "object") {
      return false;
    }
    game.showFullTimeline = !game.showFullTimeline;
    if (typeof renderRunSummaryPanelFn === "function") {
      renderRunSummaryPanelFn();
    }
    return true;
  }

  window.BRASSLINE_RUN_UI = {
    createUpgradeNode,
    createArtifactNode,
    getSuggestedUpgradePathId,
    renderUpgradeStrip,
    renderArtifactStrip,
    renderRewardMetaSummary,
    renderRewardPanel,
    renderInterludePanel,
    toggleRunTimelineView,
    renderRunSummaryPanel,
  };
})();
