(() => {
  function isPlayerTurnPhase({ phase, combatSubphase }) {
    return phase === "encounter" && (combatSubphase || "player_turn") === "player_turn";
  }

  function describeTelegraphForTooltip({
    telegraph,
    cookTierLabel,
    getTelegraphCoverageLanes,
    formatLaneCoverage,
  }) {
    const tier = cookTierLabel[telegraph.cookTier];
    const turns = telegraph.turnsLeft;
    const lanes = getTelegraphCoverageLanes(telegraph);
    if (telegraph.type === "lob") {
      return {
        text: `${tier} LOB -> ${formatLaneCoverage(lanes)} in ${turns}t (${telegraph.damage} dmg)`,
        lanes,
        key: telegraph.id,
      };
    }
    if (telegraph.type === "sweep") {
      return {
        text: `${tier} SWEEP -> ${formatLaneCoverage(lanes)} in ${turns}t (${telegraph.damage} dmg)`,
        lanes,
        key: telegraph.id,
      };
    }
    return {
      text: `${tier} effect in ${turns}t`,
      lanes: [],
      key: telegraph.id,
    };
  }

  function getIntentPreview({
    enemy,
    getLockedAimLane,
    getAimedShotDamage,
    makeSweepLanes,
    formatLaneCoverage,
  }) {
    const intent = enemy.intent;
    if (!intent || !enemy.alive) {
      return null;
    }

    if (intent.kind === "attack") {
      const aimedLane = getLockedAimLane(enemy);
      if (aimedLane === null) {
        return null;
      }
      return {
        text: `Locked shot lane: T${aimedLane + 1} (${getAimedShotDamage(enemy, intent)} dmg)`,
        lanes: [aimedLane],
        key: `${enemy.id}_aim_lock`,
      };
    }

    if (intent.kind === "lob") {
      return {
        text: "Preview: target lane locks on enemy phase near your train.",
        lanes: [],
      };
    }
    if (intent.kind === "sweep") {
      const sweep = makeSweepLanes(intent.width ?? 3);
      return {
        text: `Preview lanes: ${formatLaneCoverage(sweep.lanes)} (${sweep.direction.toUpperCase()})`,
        lanes: sweep.lanes,
      };
    }
    return null;
  }

  function buildEnemyTooltipEntries({
    enemy,
    describeIntent,
    getIntentPreviewFn,
    getEnemyTelegraphsFn,
    describeTelegraphForTooltipFn,
  }) {
    if (!enemy.alive) {
      return [{ text: "Offline", primary: true }, { text: "No active telegraphs." }];
    }

    const lines = [{ text: `Next: ${describeIntent(enemy)}`, primary: true }];
    if (enemy.elite) {
      lines.push({
        text: enemy.eliteLabel ? `Elite: ${enemy.eliteLabel}` : "Elite threat: reinforced pattern cycle.",
      });
    }
    const preview = getIntentPreviewFn(enemy);
    if (preview) {
      lines.push({
        text: preview.text,
        lanes: preview.lanes ?? [],
        key: `${enemy.id}_preview`,
      });
    }

    const activeTelegraphs = getEnemyTelegraphsFn(enemy.id);
    if (activeTelegraphs.length === 0) {
      lines.push({ text: "Active telegraphs: none" });
    } else {
      activeTelegraphs.forEach((telegraph) => {
        lines.push(describeTelegraphForTooltipFn(telegraph));
      });
    }

    return lines;
  }

  function buildEnemyThreatRows({
    enemy,
    getEnemyTelegraphsFn,
    getTelegraphCoverageLanes,
    getTelegraphThreatTypeLabel,
    cookTierLabel,
    formatLaneCoverage,
    getTelegraphProgress,
    clamp,
    highlightLockKey,
  }) {
    if (!enemy.alive) {
      return [];
    }

    return getEnemyTelegraphsFn(enemy.id)
      .slice()
      .sort((a, b) => a.turnsLeft - b.turnsLeft || b.damage - a.damage)
      .map((telegraph) => {
        const lanes = getTelegraphCoverageLanes(telegraph);
        return {
          key: telegraph.id,
          lanes,
          typeLabel: getTelegraphThreatTypeLabel(telegraph),
          tierLabel: cookTierLabel[telegraph.cookTier],
          coverageLabel: formatLaneCoverage(lanes),
          turnsLeft: telegraph.turnsLeft,
          damage: telegraph.damage,
          progressPct: clamp(Math.round(getTelegraphProgress(telegraph) * 100), 0, 100),
          cookTier: telegraph.cookTier,
          locked: highlightLockKey === telegraph.id,
        };
      });
  }

  function createEnemyInteractionHandlers({
    getOpenEnemyTooltipId = () => null,
    setOpenEnemyTooltipId = () => {},
    setSelectedEnemyId = () => {},
    clearLaneHighlightFn = () => {},
    renderEnemiesFn = () => {},
  }) {
    return {
      onTooltipToggle(enemyId) {
        if (getOpenEnemyTooltipId() === enemyId) {
          setOpenEnemyTooltipId(null);
        } else {
          setOpenEnemyTooltipId(enemyId);
        }
        clearLaneHighlightFn(true);
        renderEnemiesFn();
      },
      onEnemySelect(enemyId) {
        setSelectedEnemyId(enemyId);
        setOpenEnemyTooltipId(null);
        clearLaneHighlightFn(true);
        renderEnemiesFn();
      },
    };
  }

  function renderEnemies({
    enemyRowEl,
    enemies,
    selectedEnemy,
    phase,
    combatSubphase = "player_turn",
    openEnemyTooltipId,
    getLockedAimLane,
    buildEnemyThreatRowsFn,
    buildEnemyTooltipEntriesFn,
    describeIntent,
    escapeHtml,
    bindLaneHighlightInteractions,
    onTooltipToggle,
    onEnemySelect,
  }) {
    if (!enemyRowEl) {
      return;
    }

    const safeEscape = typeof escapeHtml === "function" ? escapeHtml : (value) => String(value);
    const now = Date.now();
    enemyRowEl.innerHTML = "";

    (Array.isArray(enemies) ? enemies : []).forEach((enemy) => {
      const card = document.createElement("article");
      card.className = "enemy";
      if (!enemy.alive) {
        card.classList.add("dead");
      }
      if (enemy.aimed && enemy.alive) {
        card.classList.add("aiming");
      }
      if (enemy.elite) {
        card.classList.add("elite");
      }
      if (selectedEnemy && selectedEnemy.id === enemy.id && enemy.alive) {
        card.classList.add("active");
      }
      if (Number.isFinite(enemy.hitFlashAt) && now - enemy.hitFlashAt < 260) {
        card.classList.add("hit-flash");
      }
      if (!enemy.alive && Number.isFinite(enemy.destroyedAt) && now - enemy.destroyedAt < 520) {
        card.classList.add("destroy-flash");
      }

      const hpLabel = `${enemy.hp}/${enemy.maxHp}`;
      const blockLabel = enemy.block > 0 ? ` | BLK ${enemy.block}` : "";
      const aimedLane = getLockedAimLane(enemy);
      const aimedLabel = aimedLane !== null ? ` | AIM T${aimedLane + 1}` : "";
      const aimBannerHtml =
        aimedLane !== null
          ? `<div class="enemy-aim-banner" data-lanes="${aimedLane}" data-highlight-key="${safeEscape(`${enemy.id}_aim_lane`)}">Aim Locked: Track ${aimedLane + 1} (+5 dmg)</div>`
          : "";
      const threatRows = buildEnemyThreatRowsFn(enemy);
      const threatRowsHtml =
        threatRows.length === 0
          ? `<p class="enemy-threat-empty">No active telegraphs.</p>`
          : threatRows
              .map((row) => {
                const classes = ["enemy-threat", `tier-${row.cookTier}`];
                if (row.locked) {
                  classes.push("locked");
                }
                const lanesAttr = row.lanes.length > 0 ? ` data-lanes="${row.lanes.join(",")}"` : "";
                return `<div class="${classes.join(" ")}"${lanesAttr} data-highlight-key="${safeEscape(row.key)}">
                <div class="enemy-threat-head">
                  <span class="enemy-threat-name">${safeEscape(`${row.tierLabel} ${row.typeLabel}`)}</span>
                  <span class="enemy-threat-turn">${row.turnsLeft}t</span>
                </div>
                <p class="enemy-threat-meta">${safeEscape(`${row.coverageLabel} | ${row.damage} dmg`)}</p>
                <div class="enemy-threat-bar"><span style="width:${row.progressPct}%"></span></div>
              </div>`;
              })
              .join("");
      const tooltipEntries = buildEnemyTooltipEntriesFn(enemy);
      const tooltipHtml = tooltipEntries
        .map((entry, index) => {
          const classes = [];
          if (entry.primary || index === 0) {
            classes.push("primary");
          }
          if (entry.lanes && entry.lanes.length > 0) {
            classes.push("lane-link");
          }
          const classAttr = classes.join(" ");
          const lanesAttr =
            entry.lanes && entry.lanes.length > 0 ? ` data-lanes="${entry.lanes.join(",")}"` : "";
          const keyAttr = entry.key ? ` data-highlight-key="${safeEscape(entry.key)}"` : "";
          return `<p class="${classAttr}"${lanesAttr}${keyAttr}>${safeEscape(entry.text)}</p>`;
        })
        .join("");
      const eliteBadgeHtml = enemy.elite
        ? '<span class="enemy-badge enemy-badge-elite" aria-label="Elite enemy">ELITE</span>'
        : "";

      card.innerHTML = `
      <div class="enemy-head">
        <div class="enemy-head-main">
          <img class="enemy-icon" src="${enemy.icon}" alt="${enemy.name}" />
          <div class="enemy-meta">
            <strong>${safeEscape(enemy.name)}${eliteBadgeHtml}</strong>
            <small>HP ${hpLabel}${blockLabel}${aimedLabel}</small>
          </div>
        </div>
        <button class="enemy-tooltip-toggle" type="button" aria-label="Show skill details" aria-expanded="false">i</button>
      </div>
      <div class="enemy-intent">${describeIntent(enemy)}</div>
      ${aimBannerHtml}
      <div class="enemy-threats">${threatRowsHtml}</div>
      <div class="enemy-tooltip" hidden>
        ${tooltipHtml}
      </div>
    `;

      const tooltipToggle = card.querySelector(".enemy-tooltip-toggle");
      const tooltip = card.querySelector(".enemy-tooltip");
      const tooltipOpen = openEnemyTooltipId === enemy.id;

      tooltip.hidden = !tooltipOpen;
      tooltipToggle.setAttribute("aria-expanded", tooltipOpen ? "true" : "false");
      if (tooltipOpen) {
        card.classList.add("tooltip-open");
      }

      tooltipToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onTooltipToggle === "function") {
          onTooltipToggle(enemy.id);
        }
      });

      if (typeof bindLaneHighlightInteractions === "function") {
        bindLaneHighlightInteractions(tooltip.querySelectorAll("p[data-lanes]"), `${enemy.id}_tooltip`);
        bindLaneHighlightInteractions(
          card.querySelectorAll(".enemy-threat[data-lanes]"),
          `${enemy.id}_threat`
        );
        bindLaneHighlightInteractions(
          card.querySelectorAll(".enemy-aim-banner[data-lanes]"),
          `${enemy.id}_aim`
        );
      }

      if (
        enemy.alive &&
        isPlayerTurnPhase({
          phase,
          combatSubphase,
        })
      ) {
        card.addEventListener("click", () => {
          if (typeof onEnemySelect === "function") {
            onEnemySelect(enemy.id);
          }
        });
      }

      enemyRowEl.appendChild(card);
    });
  }

  window.BRASSLINE_ENEMY_UI = {
    describeTelegraphForTooltip,
    getIntentPreview,
    buildEnemyTooltipEntries,
    buildEnemyThreatRows,
    createEnemyInteractionHandlers,
    renderEnemies,
  };
})();
