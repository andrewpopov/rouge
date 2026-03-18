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
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.slice(0, runtimeWindow.ROUGE_LIMITS.STASH_PREVIEW_ENTRIES) : [];
    return entries.map((entry) => {
      if (entry.kind === "equipment") {
        const item = content.itemCatalog?.[entry.equipment.itemId] || null;
        return item ? `${item.name} (${item.slot})` : entry.equipment.itemId;
      }
      if (entry.kind === "rune") {
        const rune = content.runeCatalog?.[entry.runeId] || null;
        return rune ? `${rune.name} rune` : entry.runeId;
      }
      return "Unknown entry";
    });
  }

  function buildRecentRunMarkup(profile: ProfileState, renderUtils: RenderUtilsApi): string {
    const { buildBadge, buildStat, escapeHtml } = renderUtils;
    const entries = Array.isArray(profile?.runHistory) ? profile.runHistory.slice(0, runtimeWindow.ROUGE_LIMITS.RUN_HISTORY_PREVIEW) : [];
    if (entries.length === 0) {
      return '<p class="flow-copy">No expeditions are archived yet. Completed, failed, and abandoned runs will all appear here.</p>';
    }

    return `
      <div class="feature-grid history-card-grid">
        ${entries
          .map((entry) => {
            return `
              <article class="feature-card history-entry-card">
                <div class="entity-name-row">
                  <strong>${escapeHtml(entry.className)}</strong>
                  ${buildBadge(entry.outcome, getRunOutcomeTone(entry.outcome))}
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Level", entry.level)}
                  ${buildStat("Acts", entry.actsCleared)}
                  ${buildStat("Bosses", entry.bossesDefeated)}
                  ${buildStat("Logged", formatTimestamp(entry.completedAt, true))}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderWelcomeScreen(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const runCount = appState.profile?.runHistory?.length || 0;
    const classCount = appState.registries.classes.length;

    const savedRunCard = savedRunSummary
      ? `<section class="panel flow-panel welcome-saved-run">
          <div class="panel-head panel-head-compact">
            <h2>Expedition In Progress</h2>
            ${buildBadge(savedRunSummary.phaseLabel || "Active", getPhaseTone(savedRunSummary, services.appEngine))}
          </div>
          <div class="entity-stat-grid" style="margin:12px 0">
            ${buildStat("Class", escapeHtml(savedRunSummary.className || "Unknown"))}
            ${buildStat("Level", savedRunSummary.level || 1)}
            ${buildStat("Act", escapeHtml(savedRunSummary.actTitle || "Act I"))}
            ${buildStat("Zones", savedRunSummary.zonesCleared || 0)}
          </div>
          <div class="cta-row" style="margin-top:18px">
            <button class="primary-btn" data-action="continue-saved-run">Continue Expedition</button>
            <button class="danger-link-btn" data-action="prompt-abandon-saved-run">Abandon Run</button>
          </div>
          ${appState.ui.confirmAbandonSavedRun ? `
            <div class="panel confirm-panel" style="margin-top:14px;padding:16px 18px">
              <p class="flow-copy" style="margin:0 0 12px">This will permanently archive the run. Are you sure?</p>
              <div class="cta-row cta-row-tight">
                <button class="neutral-btn" style="border-color:rgba(207,123,111,0.5);color:var(--danger)" data-action="confirm-abandon-saved-run">Yes, Abandon</button>
                <button class="neutral-btn" data-action="cancel-abandon-saved-run">Cancel</button>
              </div>
            </div>
          ` : ""}
        </section>`
      : "";

    const startSection = !savedRunSummary
      ? `<section class="welcome-cta-section" style="text-align:center;padding:8px 0">
          <button class="primary-btn welcome-cta" data-action="start-character-select">
            ${runCount > 0 ? "New Expedition" : "Begin Expedition"}
          </button>
        </section>`
      : "";

    const recentRuns = Array.isArray(appState.profile?.runHistory) ? appState.profile.runHistory.slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_RUNS_SUMMARY) : [];
    const lastRun = recentRuns[0] || null;

    const stashCount = Array.isArray(appState.profile?.stash?.entries) ? appState.profile.stash.entries.length : 0;
    const unlockCount = (appState.profile?.meta?.unlocks?.classIds?.length || 0)
      + (appState.profile?.meta?.unlocks?.bossIds?.length || 0)
      + (appState.profile?.meta?.unlocks?.runewordIds?.length || 0);

    const menuItems = runCount > 0
      ? `<nav class="welcome-menu">
          <button class="welcome-menu-item" data-action="expand-hall" data-section="vault">
            <span class="welcome-menu-label">Recent Expeditions</span>
            <span class="welcome-menu-detail">${lastRun ? `${escapeHtml(lastRun.className)} \u00b7 Lv.${lastRun.level} \u00b7 ${escapeHtml(lastRun.outcome)}` : `${runCount} archived`}</span>
            <span class="welcome-menu-arrow">\u203a</span>
          </button>
          <button class="welcome-menu-item" data-action="expand-hall" data-section="overview">
            <span class="welcome-menu-label">Account</span>
            <span class="welcome-menu-detail">${runCount} run${runCount === 1 ? "" : "s"} \u00b7 ${unlockCount} unlock${unlockCount === 1 ? "" : "s"} \u00b7 ${stashCount} stash</span>
            <span class="welcome-menu-arrow">\u203a</span>
          </button>
          <button class="welcome-menu-item" data-action="expand-hall" data-section="settings">
            <span class="welcome-menu-label">Settings</span>
            <span class="welcome-menu-detail">Hints ${appState.profile?.meta?.settings?.showHints !== false ? "on" : "off"} \u00b7 Motion ${appState.profile?.meta?.settings?.reduceMotion ? "reduced" : "full"}</span>
            <span class="welcome-menu-arrow">\u203a</span>
          </button>
        </nav>`
      : "";

    const recentRunStrip = recentRuns.length > 0
      ? `<div class="welcome-recent-runs">
          <p class="welcome-recent-heading">Recent Expeditions</p>
          ${recentRuns.map((run) => `
            <div class="welcome-recent-entry">
              <span class="welcome-recent-class">${escapeHtml(run.className || "Unknown")}</span>
              <span class="welcome-recent-detail">Lv.${run.level} \u00b7 ${escapeHtml(run.outcome || "unknown")}</span>
            </div>
          `).join("")}
        </div>`
      : "";

    const flavorSection = runCount === 0
      ? `<div class="welcome-flavor">
          <p class="welcome-flavor-text">Build a deck. Forge runewords. Conquer five acts.</p>
        </div>`
      : "";

    root.innerHTML = `
      <section class="welcome-hero panel">
        <p class="eyebrow">Roguelite Deckbuilder</p>
        <h1 class="welcome-title">Rouge</h1>
        <hr class="welcome-divider" />
        <p class="welcome-tagline">
          ${runCount > 0
            ? `${runCount} expedition${runCount === 1 ? "" : "s"} archived \u2022 ${classCount} classes await your next draft`
            : `Choose a hero, sign a mercenary contract, and fight through five acts of Diablo\u2011inspired combat`}
        </p>
      </section>
      <div class="shell-body">
        ${savedRunCard}
        ${startSection}
        ${flavorSection}
        ${menuItems}
        ${!savedRunSummary ? recentRunStrip : ""}
      </div>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (!appState.ui.hallExpanded) {
      renderWelcomeScreen(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const hallView = runtimeWindow.ROUGE_FRONT_DOOR_HALL_VIEW;
    const expeditionView = runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW;
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const phaseTone = getPhaseTone(savedRunSummary, services.appEngine);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const stashPreviewLines = getStashPreviewLines(appState.profile, appState.content);
    const recentRunMarkup = buildRecentRunMarkup(appState.profile, services.renderUtils);
    const expeditionSection = expeditionView.buildExpeditionSectionMarkup(appState, services, savedRunSummary);
    const section = appState.ui.hallSection || "overview";
    const tabClass = (s: string) => s !== section ? "hall-tab--hidden" : "";

    root.innerHTML = `
      <section class="hero-banner panel" style="padding:24px 32px 0">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
          <button class="neutral-btn" style="padding:6px 14px;font-size:0.85rem" data-action="collapse-hall">\u2190 Back</button>
          <div>
            <p class="eyebrow" style="margin:0">Account Hall</p>
            <h1 style="font-size:1.6rem;margin:0">Rouge</h1>
          </div>
        </div>
      </section>
      <div class="shell-body">
        ${hallView.buildHallTabNav(section)}
        <div data-hall-tab="overview" class="${tabClass("overview")}">
          ${hallView.buildAccountDashboardMarkup(appState, services, savedRunSummary, phaseTone, accountSummary)}
        </div>
        <div data-hall-tab="expedition" class="${tabClass("expedition")}">
          ${expeditionSection}
          ${common.buildExpeditionLaunchFlowMarkup(appState, accountSummary, services.renderUtils, {
            currentStep: "hall",
            copy:
              "The hall now treats recruit, draft, and first-town prep as one expedition launch runway, so the account signal you read here carries cleanly into the opening town.",
            hallFollowThrough: savedRunSummary
              ? "Resolve the parked expedition first, then reopen character draft once the hall is clear."
              : "Open character draft once the hall signal is settled.",
            draftFollowThrough:
              "Pin the class shell and mercenary contract here, then carry that exact launch plan into Rogue Encampment.",
            townFollowThrough:
              "The first town pass should confirm recovery, supply, stash pressure, and departure before the map opens.",
          })}
          ${expeditionView.buildGuidedStartMarkup(appState, services, savedRunSummary)}
        </div>
        <div data-hall-tab="progression" class="${tabClass("progression")}">
          ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "The hall now pins the same archive, charter, mastery, and convergence pressure that the rest of the shell carries forward, so your next draft starts from one stable account board.",
          })}
          ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "The hall now turns shared account pressure into slot-by-slot charter calls and the next convergence lane, so you can choose between vault work, progression review, or a fresh draft with one account-side read.",
            charterFollowThrough:
              "If charter pressure wins the hall, review the vault wing and planning desk before you open another expedition.",
            convergenceFollowThrough:
              "If convergence pressure wins the hall, review the progression gallery before you lock in the next class or archived route.",
          })}
          <section class="panel flow-panel" id="hall-progression">
            <div class="panel-head">
              <h2>Account Tree Review</h2>
              <p>Archive, trade, and mastery focus now render through the hall itself. Redirecting focus here updates the same profile-owned tree state that drives retention, town economy, and reward pivots.</p>
            </div>
            ${common.buildAccountTreeReviewMarkup(accountSummary, services.renderUtils)}
          </section>
          ${hallView.buildCapstoneWatchMarkup(services, accountSummary)}
        </div>
        <div data-hall-tab="vault" class="${tabClass("vault")}">
          ${hallView.buildVaultLogisticsMarkup(appState, services, accountSummary)}
          ${hallView.buildVaultChronicleMarkup(appState, services, accountSummary, stashPreviewLines, recentRunMarkup)}
          ${hallView.buildUnlockGalleryMarkup(appState, services, accountSummary)}
        </div>
        <div data-hall-tab="settings" class="${tabClass("settings")}">
          ${hallView.buildAccountControlsMarkup(appState, services, accountSummary)}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_FRONT_DOOR_VIEW = {
    render,
  };
})();
