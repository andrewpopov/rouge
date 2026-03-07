(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function formatTimestamp(timestamp: string, includeYear = false): string {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {}),
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getPhaseTone(savedRunSummary: SavedRunSummary | null, appEngine: AppEngineApi): string {
    if (savedRunSummary?.phase === appEngine.PHASES.RUN_COMPLETE) {
      return "cleared";
    }
    if (savedRunSummary?.phase === appEngine.PHASES.RUN_FAILED) {
      return "locked";
    }
    return "available";
  }

  function getRunOutcomeTone(outcome: RunHistoryEntry["outcome"]): string {
    if (outcome === "completed") {
      return "cleared";
    }
    if (outcome === "failed") {
      return "locked";
    }
    return "available";
  }

  function getStashPreviewLines(profile: ProfileState, content: GameContent): string[] {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.slice(0, 4) : [];
    return entries.map((entry) => {
      if (entry.kind === "equipment") {
        const item = content.itemCatalog?.[entry.equipment.itemId] || null;
        return `${item?.name || entry.equipment.itemId} · ${item?.slot || entry.equipment.slot} gear held in stash.`;
      }

      const rune = content.runeCatalog?.[entry.runeId] || null;
      return `${rune?.name || entry.runeId} rune stored for a future socket or runeword line.`;
    });
  }

  function buildRecentRunMarkup(profile: ProfileState, renderUtils: RenderUtilsApi): string {
    const { buildBadge, escapeHtml } = renderUtils;
    const entries = Array.isArray(profile?.runHistory) ? profile.runHistory.slice(0, 4) : [];
    if (entries.length === 0) {
      return '<p class="flow-copy">No runs are archived yet. Your first route completion, failure, or abandon will appear here.</p>';
    }

    return `
      <div class="feature-grid">
        ${entries
          .map((entry) => {
            return `
              <article class="feature-card">
                <div class="entity-name-row">
                  <strong>${escapeHtml(entry.className)}</strong>
                  ${buildBadge(entry.outcome, getRunOutcomeTone(entry.outcome))}
                </div>
                <div class="entity-stat-grid">
                  <div class="entity-stat"><span>Level</span><strong>${escapeHtml(entry.level)}</strong></div>
                  <div class="entity-stat"><span>Acts</span><strong>${escapeHtml(entry.actsCleared)}</strong></div>
                  <div class="entity-stat"><span>Bosses</span><strong>${escapeHtml(entry.bossesDefeated)}</strong></div>
                  <div class="entity-stat"><span>Logged</span><strong>${escapeHtml(formatTimestamp(entry.completedAt, true))}</strong></div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
    const classCount = appState.registries.classes.length;
    const mercCount = appState.registries.mercenaries.length;
    const stashEntries = appState.profile?.stash?.entries?.length || 0;
    const runHistoryCount = appState.profile?.runHistory?.length || 0;
    const stashEquipmentCount = (appState.profile?.stash?.entries || []).filter((entry) => entry.kind === "equipment").length;
    const stashRuneCount = (appState.profile?.stash?.entries || []).filter((entry) => entry.kind === "rune").length;
    const completedRuns = (appState.profile?.runHistory || []).filter((entry) => entry.outcome === "completed").length;
    const failedRuns = (appState.profile?.runHistory || []).filter((entry) => entry.outcome === "failed").length;
    const abandonedRuns = (appState.profile?.runHistory || []).filter((entry) => entry.outcome === "abandoned").length;
    const profileMeta = appState.profile?.meta?.progression || {
      highestLevel: 1,
      totalBossesDefeated: 0,
      classesPlayed: [],
      preferredClassId: "",
    };
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === profileMeta.preferredClassId)?.name || profileMeta.preferredClassId || "Untracked";
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const hasSavedRun = Boolean(savedRunSummary);
    const savedAtLabel = savedRunSummary ? formatTimestamp(savedRunSummary.savedAt) : "";
    const phaseTone = getPhaseTone(savedRunSummary, services.appEngine);
    const stashPreviewLines = getStashPreviewLines(appState.profile, appState.content);
    const recentRunMarkup = buildRecentRunMarkup(appState.profile, services.renderUtils);
    let entrySection = `
      <section class="panel flow-panel">
        <div class="panel-head">
          <h2>Start Fresh</h2>
          <p>No active autosave is blocking the entry flow. Pick a class, choose a mercenary, and enter town.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <strong>Next Action</strong>
            <p>Start a new run, enter character select, then use the safe-zone departure gate when you are ready to open the map.</p>
          </article>
          <article class="feature-card">
            <strong>First Combat Tip</strong>
            <p>Target a living enemy before playing targeted skills. Party skills and potions do not require a target.</p>
          </article>
        </div>
        <div class="cta-row">
          <button class="primary-btn" data-action="start-character-select">Start New Run</button>
        </div>
      </section>
    `;

    if (hasSavedRun && savedRunSummary) {
      const confirmSection = appState.ui.confirmAbandonSavedRun
        ? `
            <section class="panel notice-panel confirm-panel">
              <strong>Discard This Run</strong>
              <p>Abandoning clears the active autosave. Keep the snapshot if you still want to resume this route later.</p>
            </section>
          `
        : "";
      const actionRow = appState.ui.confirmAbandonSavedRun
        ? `
            <button class="neutral-btn" data-action="cancel-abandon-saved-run">Keep Snapshot</button>
            <button class="neutral-btn" data-action="confirm-abandon-saved-run">Abandon Run</button>
          `
        : '<button class="neutral-btn" data-action="prompt-abandon-saved-run">Abandon Saved Run</button>';

      entrySection = `
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Saved Snapshot</h2>
            <p>Review the active run before resuming it. New runs stay gated until you intentionally discard this snapshot.</p>
          </div>
          <div class="front-door-snapshot-grid">
            <article class="entity-card ally snapshot-card">
              <div class="entity-name-row">
                <strong class="entity-name">${escapeHtml(savedRunSummary.className)}</strong>
                ${buildBadge(savedRunSummary.phaseLabel, phaseTone)}
              </div>
              <p class="service-subtitle">${escapeHtml(`${savedRunSummary.actTitle} · ${savedRunSummary.safeZoneName}`)}</p>
              <div class="entity-stat-grid">
                ${buildStat("Level", savedRunSummary.level)}
                ${buildStat("Gold", savedRunSummary.gold)}
                ${buildStat("Deck", savedRunSummary.deckSize)}
                ${buildStat("Belt", savedRunSummary.beltState)}
              </div>
              <p class="entity-passive">${escapeHtml(`Saved ${savedAtLabel}. Resume the route toward ${savedRunSummary.bossName}.`)}</p>
            </article>
            <article class="feature-card">
              <strong>Resume State</strong>
              <div class="entity-stat-grid">
                ${buildStat("Zones", savedRunSummary.zonesCleared)}
                ${buildStat("Encounters", savedRunSummary.encountersCleared)}
                ${buildStat("Skill Pts", savedRunSummary.skillPointsAvailable)}
                ${buildStat("Training", savedRunSummary.trainingRanks)}
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Class Pts", savedRunSummary.classPointsAvailable)}
                ${buildStat("Attr Pts", savedRunSummary.attributePointsAvailable)}
                ${buildStat("Skills", savedRunSummary.unlockedClassSkills)}
                ${buildStat("Runewords", savedRunSummary.activeRunewords)}
              </div>
              <p>Boss trophies ${escapeHtml(savedRunSummary.bossTrophies)}, active runewords ${escapeHtml(savedRunSummary.activeRunewords)}, resolved quests ${escapeHtml(savedRunSummary.resolvedQuestOutcomes)}.</p>
            </article>
          </div>
          ${confirmSection}
          <div class="cta-row">
            <button class="primary-btn" data-action="continue-saved-run">Continue Saved Run</button>
            ${actionRow}
          </div>
        </section>
      `;
    }

    services.renderUtils.buildShell(root, {
      eyebrow: "Front Door",
      title: "Rouge Front Door",
      copy:
        hasSavedRun
          ? "A saved run is waiting at the front door. Resume it or discard it explicitly before starting over."
          : "The front door now doubles as a profile surface and onboarding layer for the current run loop.",
      body: `
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Profile Hall</h2>
            <p>Review the active run, stash, and recorded history before you enter the current shell.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Active Run</strong>
                ${buildBadge(hasSavedRun ? savedRunSummary.phaseLabel : "Empty", hasSavedRun ? phaseTone : "locked")}
              </div>
              ${
                hasSavedRun && savedRunSummary
                  ? `
                    <div class="entity-stat-grid">
                      ${buildStat("Class", savedRunSummary.className)}
                      ${buildStat("Act", savedRunSummary.actTitle)}
                      ${buildStat("Zones", savedRunSummary.zonesCleared)}
                      ${buildStat("Saved", savedAtLabel)}
                    </div>
                    <p>${escapeHtml(`Resume at ${savedRunSummary.safeZoneName} and push toward ${savedRunSummary.bossName}.`)}</p>
                  `
                  : "<p>No active snapshot is parked at the front door right now.</p>"
              }
            </article>
            <article class="feature-card">
              <strong>Stash Vault</strong>
              <div class="entity-stat-grid">
                ${buildStat("Entries", stashEntries)}
                ${buildStat("Gear", stashEquipmentCount)}
                ${buildStat("Runes", stashRuneCount)}
                ${buildStat("Ready", stashEntries > 0 ? "Yes" : "Empty")}
              </div>
              <p>Profile stash entries can be withdrawn into any run from the safe zone without changing the phase model.</p>
            </article>
            <article class="feature-card">
              <strong>Run Ledger</strong>
              <div class="entity-stat-grid">
                ${buildStat("Runs", runHistoryCount)}
                ${buildStat("Cleared", completedRuns)}
                ${buildStat("Failed", failedRuns)}
                ${buildStat("Abandoned", abandonedRuns)}
              </div>
              <p>Run history stays profile-owned while the current autosave remains the only resumable route.</p>
            </article>
            <article class="feature-card">
              <strong>Profile Meta</strong>
              <div class="entity-stat-grid">
                ${buildStat("Highest Lv", profileMeta.highestLevel || 1)}
                ${buildStat("Bosses", profileMeta.totalBossesDefeated || 0)}
                ${buildStat("Classes", Array.isArray(profileMeta.classesPlayed) ? profileMeta.classesPlayed.length : 0)}
                ${buildStat("Preferred", preferredClassName)}
              </div>
              <p>Settings, unlocks, and long-run summaries now live on the profile without taking ownership away from the active run snapshot.</p>
            </article>
          </div>
          <div class="front-door-snapshot-grid">
            <article class="feature-card">
              <strong>Stash Preview</strong>
              ${
                stashPreviewLines.length > 0
                  ? buildStringList(stashPreviewLines, "log-list reward-list ledger-list")
                  : '<p class="flow-copy">The profile stash is empty. Equipment and runes sent there from town will appear here.</p>'
              }
            </article>
            <article class="feature-card">
              <strong>Recent Runs</strong>
              ${recentRunMarkup}
            </article>
          </div>
        </section>
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>First Run Guide</h2>
            <p>These cards explain the core loop without adding a separate tutorial phase.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <strong>1. Choose A Start</strong>
              <p>Pick one of ${escapeHtml(classCount)} seeded classes and one of ${escapeHtml(mercCount)} mercenary contracts before the run begins.</p>
            </article>
            <article class="feature-card">
              <strong>2. Leave Town Intentionally</strong>
              <p>Heal, refill the belt, spend progression, and review stash or vendor state before stepping onto the world map.</p>
            </article>
            <article class="feature-card">
              <strong>3. Read The Map</strong>
              <p>Battle, quest, shrine, and aftermath nodes all stay visible on the map so you can plan route order before entering them.</p>
            </article>
            <article class="feature-card">
              <strong>4. Target And Resolve</strong>
              <p>In combat, target a living enemy for targeted skills, then claim one reward choice before the run advances again.</p>
            </article>
            <article class="feature-card">
              <strong>Run Persistence</strong>
              <p>${hasSavedRun ? "A schema-versioned autosave is ready to resume." : "Autosave snapshots are written at non-combat checkpoints."}</p>
            </article>
            <article class="feature-card">
              <strong>Current Slice</strong>
              <p>Front door to character select to safe zone to world map to encounter to reward, repeated through all five acts.</p>
            </article>
          </div>
        </section>
        ${entrySection}
      `,
    });
  }

  runtimeWindow.ROUGE_FRONT_DOOR_VIEW = {
    render,
  };
})();
