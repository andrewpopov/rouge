(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

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
    const { RUN_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
    if (outcome === RUN_OUTCOME.COMPLETED) {
      return "cleared";
    }
    if (outcome === RUN_OUTCOME.FAILED) {
      return "locked";
    }
    return "available";
  }

  function getStashPreviewLines(profile: ProfileState, content: GameContent): string[] {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.slice(0, runtimeWindow.ROUGE_LIMITS.STASH_PREVIEW_ENTRIES) : [];
    return entries.map((entry) => {
      if (entry.kind === ENTRY_KIND.EQUIPMENT) {
        const item = content.itemCatalog?.[entry.equipment.itemId] || null;
        return item ? `${item.name} (${item.slot})` : entry.equipment.itemId;
      }
      if (entry.kind === ENTRY_KIND.RUNE) {
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

  function deriveWelcomeModel(appState: AppState, services: UiRenderServices) {
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const runCount = appState.profile?.runHistory?.length || 0;
    const recentRuns = Array.isArray(appState.profile?.runHistory) ? appState.profile.runHistory.slice(0, runtimeWindow.ROUGE_LIMITS.RECENT_RUNS_SUMMARY) : [];
    const lastRun = recentRuns[0] || null;
    const stashCount = Array.isArray(appState.profile?.stash?.entries) ? appState.profile.stash.entries.length : 0;
    const unlockCount = (appState.profile?.meta?.unlocks?.classIds?.length || 0)
      + (appState.profile?.meta?.unlocks?.bossIds?.length || 0)
      + (appState.profile?.meta?.unlocks?.runewordIds?.length || 0);

    return { savedRunSummary, runCount, recentRuns, lastRun, stashCount, unlockCount };
  }

  function renderWelcomeScreen(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const vm = deriveWelcomeModel(appState, services);
    const { savedRunSummary, runCount, recentRuns, lastRun, stashCount, unlockCount } = vm;

    const savedRunCard = savedRunSummary
      ? `<section class="panel flow-panel welcome-saved-run">
          <div class="panel-head panel-head-compact">
            <h2>Expedition In Progress</h2>
            ${buildBadge(savedRunSummary.phaseLabel || "Active", getPhaseTone(savedRunSummary, services.appEngine))}
          </div>
          <div class="entity-stat-grid welcome-saved-run__stats">
            ${buildStat("Class", escapeHtml(savedRunSummary.className || "Unknown"))}
            ${buildStat("Level", savedRunSummary.level || 1)}
            ${buildStat("Act", escapeHtml(savedRunSummary.actTitle || "Act I"))}
            ${buildStat("Zones", savedRunSummary.zonesCleared || 0)}
          </div>
          <div class="cta-row welcome-saved-run__actions">
            <button class="primary-btn" data-action="continue-saved-run">Continue Expedition</button>
            <button class="danger-link-btn" data-action="prompt-abandon-saved-run">Abandon Run</button>
          </div>
          ${appState.ui.confirmAbandonSavedRun ? `
            <div class="panel confirm-panel welcome-saved-run__confirm">
              <p class="welcome-saved-run__confirm-title">Archive this expedition and reopen the hall?</p>
              <p class="flow-copy welcome-saved-run__confirm-copy">The parked route will be written into the archive and removed from the live hall slot.</p>
              <div class="cta-row cta-row-tight welcome-saved-run__confirm-actions">
                <button class="neutral-btn welcome-saved-run__confirm-danger" data-action="confirm-abandon-saved-run">Yes, Abandon</button>
                <button class="neutral-btn" data-action="cancel-abandon-saved-run">Cancel</button>
              </div>
            </div>
          ` : ""}
        </section>`
      : "";

    const menuItems = runCount > 0
      ? `<nav class="welcome-menu">
          <button class="welcome-menu-item" data-action="expand-hall" data-section="vault">
            <span class="welcome-menu-icon">\u{1F4DC}</span>
            <span class="welcome-menu-body">
              <span class="welcome-menu-label">Recent Expeditions</span>
              <span class="welcome-menu-detail">${lastRun ? `${escapeHtml(lastRun.className)} \u00b7 Lv.${lastRun.level} \u00b7 ${escapeHtml(lastRun.outcome)}` : `${runCount} archived`}</span>
            </span>
            <span class="welcome-menu-arrow">\u203a</span>
          </button>
          <button class="welcome-menu-item" data-action="expand-hall" data-section="overview">
            <span class="welcome-menu-icon">\u2726</span>
            <span class="welcome-menu-body">
              <span class="welcome-menu-label">Account</span>
              <span class="welcome-menu-detail">${runCount} run${runCount === 1 ? "" : "s"} \u00b7 ${unlockCount} unlock${unlockCount === 1 ? "" : "s"} \u00b7 ${stashCount} stash</span>
            </span>
            <span class="welcome-menu-arrow">\u203a</span>
          </button>
          <button class="welcome-menu-item" data-action="expand-hall" data-section="settings">
            <span class="welcome-menu-icon">\u2699</span>
            <span class="welcome-menu-body">
              <span class="welcome-menu-label">Settings</span>
              <span class="welcome-menu-detail">Hints ${appState.profile?.meta?.settings?.showHints !== false ? "on" : "off"} \u00b7 Motion ${appState.profile?.meta?.settings?.reduceMotion ? "reduced" : "full"}</span>
            </span>
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

    const auth = runtimeWindow.ROGUE_AUTH?.getAuthState?.() || { user: null, loading: false, ready: false };
    const authRow = auth.user
      ? `<div class="auth-user-row">
          ${auth.user.avatarUrl ? `<img class="auth-avatar" src="${auth.user.avatarUrl}" alt="" referrerpolicy="no-referrer" />` : ""}
          <span class="auth-user-name">${services.renderUtils.escapeHtml(auth.user.name || auth.user.email)}</span>
          <button class="auth-signout-btn" data-action="auth-sign-out">Sign out</button>
        </div>`
      : '<div class="auth-signin-row" id="google-signin-container"></div>';
    const introParagraph = runCount > 0
      ? "The black gate is still burning. Every archived run leaves another name in the ash, and every fresh draft is another march back toward the fire."
      : "Under the eclipse, the black gate calls mercenaries, rune-bearers, and doomed pilgrims to the same road. Blood Rogue begins in ash and only grows darker from there.";
    let instructionText = "Choose a hero, sign a mercenary contract, and fight through five acts of Diablo-inspired combat.";
    if (savedRunSummary) {
      instructionText = "Resume your expedition from the hall below, or clear the road before drafting another hero.";
    } else if (runCount > 0) {
      instructionText = "Choose a hero, bind your runes, and march back through five acts of blood-soaked combat.";
    }
    const heroActionMarkup = savedRunSummary
      ? `<p class="welcome-hero-note">A live expedition already waits in the hall below. Resume it there before drafting another contract.</p>`
      : `<div class="welcome-hero-actions">
          <button class="primary-btn welcome-cta" data-action="start-character-select">
            <span class="welcome-cta__label">${runCount > 0 ? "New Expedition" : "Begin Expedition"}</span>
          </button>
        </div>`;

    root.innerHTML = `
      <section class="welcome-hero panel">
        <div class="welcome-hero-art" aria-hidden="true">
          <img class="welcome-cover-art" src="./assets/curated/title-screen/welcome-cover-art.jpg" alt="" />
        </div>
        <div class="welcome-hero-content">
          <div class="welcome-hero-copy">
            <p class="eyebrow">Roguelite Deckbuilder</p>
            <h1 class="welcome-title">
              <img class="welcome-title-logo" src="./assets/curated/title-screen/blood-rogue-logo.png" alt="Blood Rogue" />
            </h1>
            <div class="welcome-copy-block">
              <p class="welcome-intro">${introParagraph}</p>
              <p class="welcome-tagline">
                ${instructionText}
              </p>
            </div>
            ${heroActionMarkup}
            ${authRow}
          </div>
        </div>
      </section>
      <div class="shell-body">
        ${savedRunCard}
        ${flavorSection}
        ${menuItems}
        ${!savedRunSummary ? recentRunStrip : ""}
      </div>
    `;

    if (!auth.user && runtimeWindow.ROGUE_AUTH?.renderSignInButton && root.querySelector) {
      const container = root.querySelector("#google-signin-container") as HTMLElement | null;
      if (container) {
        runtimeWindow.ROGUE_AUTH.renderSignInButton(container);
      }
    }
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (!appState.ui.hallExpanded) {
      renderWelcomeScreen(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const hallView = runtimeWindow.ROUGE_FRONT_DOOR_HALL_VIEW;
    const expeditionView = runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW;
    const { escapeHtml } = services.renderUtils;
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const phaseTone = getPhaseTone(savedRunSummary, services.appEngine);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const stashPreviewLines = getStashPreviewLines(appState.profile, appState.content);
    const recentRunMarkup = buildRecentRunMarkup(appState.profile, services.renderUtils);
    const expeditionSection = expeditionView.buildExpeditionSectionMarkup(appState, services, savedRunSummary);
    const section = appState.ui.hallSection || "overview";
    const tabClass = (s: string) => s !== section ? "hall-section hall-section--hidden" : "hall-section";
    const sectionMeta: Record<string, { title: string; copy: string }> = {
      overview: {
        title: "Hall Overview",
        copy: "Read the state of the archive, the stash, and the live expedition without leaving the account chamber.",
      },
      expedition: {
        title: "Expedition Wing",
        copy: "Resume the parked route or open the next draft with the same account signals carried forward.",
      },
      progression: {
        title: "Progression Gallery",
        copy: "Review class-tree pressure, convergence lanes, and capstone readiness before the next march.",
      },
      vault: {
        title: "Vault And Chronicle",
        copy: "Track stored gear, archived runs, and unlock waves from the same logistics wing.",
      },
      settings: {
        title: "Command Desk",
        copy: "Tune guidance, preferred class routing, and charter pressure from one persistent control surface.",
      },
    };
    const currentSectionMeta = sectionMeta[section] || sectionMeta.overview;
    const liveExpeditionLabel = savedRunSummary ? `${savedRunSummary.className} · ${savedRunSummary.phaseLabel}` : "Hall Open";

    root.innerHTML = `
      <section class="hall-hero panel">
        <div class="hall-hero__top">
          <button class="neutral-btn hall-back-btn" data-action="collapse-hall">\u2190 Return To Cover</button>
          <span class="hall-hero__state">${savedRunSummary ? "Live Expedition Parked" : "Archive Open"}</span>
        </div>
        <div class="hall-hero__body">
          <div class="hall-hero__copy">
            <p class="eyebrow">Account Hall</p>
            <h1>Blood Rogue</h1>
            <p class="hall-hero__lead">The archive remembers every march. Review the live route, stored relics, and long-horizon account pressure before you choose what the next expedition becomes.</p>
          </div>
          <div class="hall-hero__stats">
            <div class="hall-hero__stat">
              <span>Archived Runs</span>
              <strong>${profileSummary.runHistoryCount}</strong>
            </div>
            <div class="hall-hero__stat">
              <span>Unlocked Classes</span>
              <strong>${profileSummary.unlockedClassCount}</strong>
            </div>
            <div class="hall-hero__stat">
              <span>Vault Entries</span>
              <strong>${profileSummary.stashEntries}</strong>
            </div>
            <div class="hall-hero__stat">
              <span>Hall State</span>
              <strong>${escapeHtml(liveExpeditionLabel)}</strong>
            </div>
          </div>
        </div>
      </section>
      <div class="shell-body hall-shell__body">
        <section class="panel hall-nav-shell">
          <div class="hall-nav-shell__head">
            <div>
              <p class="hall-nav-shell__eyebrow">Navigator</p>
              <h2 class="hall-nav-shell__title">${escapeHtml(currentSectionMeta.title)}</h2>
            </div>
            <p class="hall-nav-shell__copy">${escapeHtml(currentSectionMeta.copy)}</p>
          </div>
          ${hallView.buildHallTabNav(section)}
        </section>
        <div class="hall-section-stack">
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
      </div>
    `;
  }

  runtimeWindow.ROUGE_FRONT_DOOR_VIEW = {
    render,
  };
})();
