(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

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

  function getRunOutcomeTone(outcome: RunHistoryEntry["outcome"]): string {
    if (outcome === "completed") {
      return "cleared";
    }
    if (outcome === "failed") {
      return "locked";
    }
    return "available";
  }

  function getSettingLabel(enabled: boolean, positiveLabel: string, negativeLabel: string): string {
    return enabled ? positiveLabel : negativeLabel;
  }

  function getLabelFromId(id: string): string {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function getClassName(appState: AppState, classId: string): string {
    return appState.registries.classes.find((entry) => entry.id === classId)?.name || classId;
  }

  function getItemLabel(appState: AppState, itemId: string): string {
    return appState.content.itemCatalog?.[itemId]?.name || getLabelFromId(itemId);
  }

  function getRuneLabel(appState: AppState, runeId: string): string {
    return appState.content.runeCatalog?.[runeId]?.name || getLabelFromId(runeId);
  }

  function getRunewordLabel(appState: AppState, runewordId: string): string {
    return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
  }

  function getArchiveReviewState(appState: AppState, accountSummary: ProfileAccountSummary) {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const historyEntries = Array.isArray(appState.profile?.runHistory) ? appState.profile.runHistory : [];
    const reviewedHistoryIndex = Math.min(
      Math.max(0, toNumber(appState.ui.reviewedHistoryIndex, 0)),
      Math.max(0, historyEntries.length - 1)
    );
    const reviewedHistoryEntry = historyEntries[reviewedHistoryIndex] || null;
    const reviewedRunewordLabels = (reviewedHistoryEntry?.activeRunewordIds || []).map((runewordId) => {
      return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
    });
    const reviewedPlannedRunewordLabels = [reviewedHistoryEntry?.plannedWeaponRunewordId, reviewedHistoryEntry?.plannedArmorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId));
    const reviewedCompletedPlannedRunewordLabels = (reviewedHistoryEntry?.completedPlannedRunewordIds || []).map((runewordId) => {
      return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
    });
    const reviewedFeatureLabels = (reviewedHistoryEntry?.newFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const reviewedFavoredTreeLabel = reviewedHistoryEntry
      ? reviewedHistoryEntry.favoredTreeName || getLabelFromId(reviewedHistoryEntry.favoredTreeId || "unknown_tree")
      : "No archive yet";

    return {
      historyEntries,
      reviewedHistoryIndex,
      reviewedHistoryEntry,
      reviewedRunewordLabels,
      reviewedPlannedRunewordLabels,
      reviewedCompletedPlannedRunewordLabels,
      reviewedFeatureLabels,
      reviewedFavoredTreeLabel,
      runHistoryCapacity: accountSummary.runHistoryCapacity,
    };
  }

  function getCapstoneTone(status: ProfileAccountTreeSummary["capstoneStatus"] | ""): string {
    if (status === "unlocked") {
      return "cleared";
    }
    if (status === "available") {
      return "available";
    }
    return "locked";
  }

  function getCapstoneReviewTone(review: {
    readyCapstoneCount: number;
    unlockedCapstoneCount: number;
    capstoneCount: number;
  }): string {
    if (review.readyCapstoneCount > 0) {
      return "available";
    }
    if (review.unlockedCapstoneCount >= review.capstoneCount && review.capstoneCount > 0) {
      return "cleared";
    }
    return "locked";
  }

  function getVaultForecast(planning: ProfilePlanningSummary): {
    tone: string;
    copy: string;
  } {
    const overview = planning?.overview;
    if ((planning?.plannedRunewordCount || 0) === 0) {
      return {
        tone: "cleared",
        copy: "No charter pressure is pinned yet, so the vault is free to hold generic future upgrades.",
      };
    }
    if ((overview?.readyCharterCount || 0) > 0) {
      return {
        tone: "available",
        copy: overview?.nextActionSummary || "A ready charter base is parked in stash, so rune depth is the next leverage point.",
      };
    }
    if ((overview?.preparedCharterCount || 0) > 0) {
      return {
        tone: "locked",
        copy: overview?.nextActionSummary || "A prepared charter base is parked, but socket work is still incomplete.",
      };
    }
    if ((overview?.compatibleCharterCount || 0) > 0) {
      return {
        tone: "locked",
        copy: overview?.nextActionSummary || "A compatible charter base is parked, but socket work has not started yet.",
      };
    }
    return {
      tone: "locked",
      copy: overview?.nextActionSummary || "Charters are pinned, but the vault is not yet stocked with a compatible base.",
    };
  }

  function getTreeCapstoneBadgeLabel(tree: ProfileAccountTreeSummary): string {
    if (!tree.capstoneTitle) {
      return "No Capstone";
    }
    if (tree.capstoneStatus === "unlocked") {
      return `Unlocked: ${tree.capstoneTitle}`;
    }
    if (tree.capstoneStatus === "available") {
      return `Ready: ${tree.capstoneTitle}`;
    }
    return `Locked: ${tree.capstoneTitle}`;
  }

  function buildAccountOverviewMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    phaseTone: string,
    accountSummary: ProfileAccountSummary
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const resumeGuidance = savedRunSummary
      ? runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.getSavedRunPhaseGuidance(savedRunSummary, services.appEngine)
      : null;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const stashSummary = accountSummary.stash || {
      entryCount: profileSummary.stashEntries,
      equipmentCount: 0,
      runeCount: 0,
      socketReadyEquipmentCount: 0,
      socketedRuneCount: 0,
      runewordEquipmentCount: 0,
      itemIds: [],
      runeIds: [],
    };
    const archiveSummary = accountSummary.archive || {
      entryCount: profileSummary.runHistoryCount,
      completedCount: profileSummary.completedRuns,
      failedCount: profileSummary.failedRuns,
      abandonedCount: Math.max(0, profileSummary.runHistoryCount - profileSummary.completedRuns - profileSummary.failedRuns),
      latestClassId: "",
      latestClassName: "",
      latestOutcome: "",
      latestCompletedAt: "",
      highestLevel: profileSummary.highestLevel,
      highestActsCleared: profileSummary.highestActCleared,
      highestGoldGained: 0,
      highestLoadoutTier: 0,
      runewordArchiveCount: 0,
      featureUnlockCount: 0,
      favoredTreeId: "",
      favoredTreeName: "",
      planningArchiveCount: 0,
      recentFeatureIds: [] as string[],
    };
    const stashEntries = stashSummary.entryCount;
    const runHistoryCount = archiveSummary.entryCount;
    const stashEquipmentCount = stashSummary.equipmentCount;
    const stashRuneCount = stashSummary.runeCount;
    const completedRuns = archiveSummary.completedCount;
    const failedRuns = archiveSummary.failedCount;
    const abandonedRuns = archiveSummary.abandonedCount;
    const profileMeta = appState.profile?.meta?.progression || {
      highestLevel: 1,
      highestActCleared: 0,
      totalBossesDefeated: 0,
      totalGoldCollected: 0,
      totalRunewordsForged: 0,
      classesPlayed: [] as string[],
      preferredClassId: "",
    };
    const unlocks = appState.profile?.meta?.unlocks || {
      classIds: [],
      bossIds: [],
      runewordIds: [],
      townFeatureIds: [],
    };
    const tutorials = appState.profile?.meta?.tutorials || {
      seenIds: [],
      completedIds: [],
      dismissedIds: [],
    };
    const settings = appState.profile?.meta?.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
    };
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === profileMeta.preferredClassId)?.name || profileMeta.preferredClassId || "Unset";
    const unlockedClassLabels = (unlocks.classIds || []).map((classId) => getClassName(appState, classId));
    const unlockedBossLabels = (unlocks.bossIds || []).map((bossId) => {
      return getLabelFromId(appState.content.enemyCatalog?.[bossId]?.name || bossId);
    });
    const unlockedRunewordLabels = (unlocks.runewordIds || []).map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId);
    const unlockedTownFeatureLabels = (unlocks.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const seenTutorialLabels = (tutorials.seenIds || []).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const completedTutorialLabels = (tutorials.completedIds || []).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const pendingTutorialIds = (tutorials.seenIds || []).filter((tutorialId) => !(tutorials.completedIds || []).includes(tutorialId));
    const nextTutorialLabel = pendingTutorialIds.length > 0 ? common.getTutorialLabel(pendingTutorialIds[0]) : "All surfaced guidance complete";

    return `
      <section class="panel flow-panel" id="hall-overview">
        <div class="panel-head">
          <h2>Account Hall</h2>
          <p>Profile-owned state lives here: active expedition review, stash custody, run archives, settings signals, and the live account unlock or tutorial records now feeding the shell.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Active Expedition</strong>
              ${buildBadge(savedRunSummary ? savedRunSummary.phaseLabel : "No Snapshot", savedRunSummary ? phaseTone : "locked")}
            </div>
            ${
              savedRunSummary
                ? `
                  <div class="entity-stat-grid">
                    ${buildStat("Class", savedRunSummary.className)}
                    ${buildStat("Act", savedRunSummary.actTitle)}
                    ${buildStat("Zones", savedRunSummary.zonesCleared)}
                    ${buildStat("Saved", formatTimestamp(savedRunSummary.savedAt))}
                  </div>
                  <p>${escapeHtml(`Resume into ${resumeGuidance?.nextSurfaceLabel || savedRunSummary.phaseLabel}. ${resumeGuidance?.summaryLine || `The route is still pointed at ${savedRunSummary.bossName}.`}`)}</p>
                `
                : "<p>No autosaved route is currently parked in the hall.</p>"
            }
          </article>
          ${stashEntries === 0 && stashEquipmentCount === 0 && stashRuneCount === 0
            ? `<article class="feature-card feature-card--empty">
                <div class="entity-name-row">
                  <strong>Stash Vault</strong>
                  ${buildBadge("Empty", "locked")}
                </div>
                <p class="feature-card__empty-hint">Send items to stash during a town visit to store them here.</p>
              </article>`
            : `<article class="feature-card">
                <strong>Stash Vault</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Entries", stashEntries)}
                  ${buildStat("Gear", stashEquipmentCount)}
                  ${buildStat("Runes", stashRuneCount)}
                  ${buildStat("Socket Bases", stashSummary.socketReadyEquipmentCount)}
                </div>
                <p>${escapeHtml(`Anything sent to stash leaves the current run inventory and waits here for withdrawal from a future town. Socketed runes stored: ${stashSummary.socketedRuneCount}. Active runeword bases archived: ${stashSummary.runewordEquipmentCount}.`)}</p>
              </article>`
          }
          <article class="feature-card">
            <strong>Archive Ledger</strong>
            <div class="entity-stat-grid">
              ${buildStat("Runs", runHistoryCount)}
              ${buildStat("Cleared", completedRuns)}
              ${buildStat("Failed", failedRuns)}
              ${buildStat("Abandoned", abandonedRuns)}
            </div>
            <p>${escapeHtml(`Run-end review feeds back into this archive so the front door always reads like an account surface instead of a launcher. Best archived loadout tier ${archiveSummary.highestLoadoutTier}, runeword-bearing runs ${archiveSummary.runewordArchiveCount}, feature unlock bursts ${archiveSummary.featureUnlockCount}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Class Signal</strong>
            <div class="entity-stat-grid">
              ${buildStat("Preferred", preferredClassName)}
              ${buildStat("Highest Lv", profileSummary.highestLevel || 1)}
              ${buildStat("Highest Act", profileSummary.highestActCleared || 0)}
              ${buildStat("Classes", profileSummary.classesPlayedCount)}
            </div>
            <p>${escapeHtml(`The next class picker already defaults toward your recent or preferred play history. Lifetime bosses ${profileSummary.totalBossesDefeated}, gold ${profileSummary.totalGoldCollected}, runewords ${profileSummary.totalRunewordsForged}.`)}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Settings Alcove</strong>
              ${buildBadge(settings.showHints ? "Guidance On" : "Guidance Off", settings.showHints ? "available" : "locked")}
            </div>
            <div class="badge-row">
              ${buildBadge(getSettingLabel(settings.showHints, "Hints Visible", "Hints Hidden"), settings.showHints ? "available" : "locked")}
              ${buildBadge(getSettingLabel(settings.reduceMotion, "Reduced Motion", "Full Motion"), settings.reduceMotion ? "cleared" : "available")}
              ${buildBadge(getSettingLabel(settings.compactMode, "Compact Layout", "Full Layout"), settings.compactMode ? "cleared" : "available")}
            </div>
            <p>These are render-facing settings today. Future shell controls can attach here without moving profile ownership out of state modules.</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Unlock Archive</strong>
              ${buildBadge(`${profileSummary.unlockedRunewordCount + profileSummary.unlockedBossCount + profileSummary.unlockedClassCount} tracked`, profileSummary.unlockedClassCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Classes", profileSummary.unlockedClassCount)}
              ${buildStat("Bosses", profileSummary.unlockedBossCount)}
              ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
              ${buildStat("Town Hooks", profileSummary.townFeatureCount)}
            </div>
            ${buildStringList(
              [
                `Unlocked classes: ${common.getPreviewLabel(unlockedClassLabels, "none yet")}.`,
                `Boss trophies: ${common.getPreviewLabel(unlockedBossLabels, "none yet")}.`,
                `Runewords forged: ${common.getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                `Account systems online: ${common.getPreviewLabel(unlockedTownFeatureLabels, "none yet")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Tutorial Ledger</strong>
              ${buildBadge(
                profileSummary.completedTutorialCount >= profileSummary.seenTutorialCount && profileSummary.seenTutorialCount > 0 ? "Complete" : "Tracking",
                profileSummary.completedTutorialCount >= profileSummary.seenTutorialCount && profileSummary.seenTutorialCount > 0 ? "cleared" : "available"
              )}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Seen", profileSummary.seenTutorialCount)}
              ${buildStat("Done", profileSummary.completedTutorialCount)}
              ${buildStat("Pending", Math.max(0, profileSummary.seenTutorialCount - profileSummary.completedTutorialCount))}
              ${buildStat("Hints", settings.showHints ? "On" : "Off")}
            </div>
            ${buildStringList(
              [
                `Seen guidance: ${common.getPreviewLabel(seenTutorialLabels, "none yet")}.`,
                `Completed guidance: ${common.getPreviewLabel(completedTutorialLabels, "none yet")}.`,
                `Next account prompt: ${nextTutorialLabel}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildAccountDashboardMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    phaseTone: string,
    accountSummary: ProfileAccountSummary
  ): string {
    const { buildBadge, buildStat } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const archiveSummary = accountSummary.archive || {
      entryCount: profileSummary.runHistoryCount,
      completedCount: profileSummary.completedRuns,
      failedCount: profileSummary.failedRuns,
      abandonedCount: 0,
      latestClassName: "",
      latestOutcome: "",
    };
    const unlocks = appState.profile?.meta?.unlocks || { classIds: [] as string[], bossIds: [] as string[], runewordIds: [] as string[] };
    const unlockTotal = (unlocks.classIds?.length || 0) + (unlocks.bossIds?.length || 0) + (unlocks.runewordIds?.length || 0);
    const stashEntries = accountSummary.stash?.entryCount || 0;

    const expeditionCard = savedRunSummary
      ? `<article class="feature-card">
          <div class="entity-name-row">
            <strong>Active Expedition</strong>
            ${buildBadge(savedRunSummary.phaseLabel, phaseTone)}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Class", savedRunSummary.className)}
            ${buildStat("Level", savedRunSummary.level)}
            ${buildStat("Act", savedRunSummary.actTitle)}
            ${buildStat("Zones", savedRunSummary.zonesCleared)}
          </div>
          <div class="cta-row" style="margin-top:12px">
            <button class="primary-btn" data-action="continue-saved-run">Continue Expedition</button>
          </div>
        </article>`
      : `<article class="feature-card">
          <div class="entity-name-row">
            <strong>No Active Expedition</strong>
            ${buildBadge("Ready", "cleared")}
          </div>
          <p>Choose a hero, hire a mercenary, and begin a new run.</p>
          <div class="cta-row" style="margin-top:12px">
            <button class="primary-btn" data-action="start-character-select">New Expedition</button>
          </div>
        </article>`;

    return `
      <section class="panel flow-panel" id="hall-overview">
        <div class="panel-head">
          <h2>Account Overview</h2>
        </div>
        <div class="feature-grid feature-grid-wide">
          ${expeditionCard}
          <article class="feature-card">
            <strong>Career Stats</strong>
            <div class="entity-stat-grid">
              ${buildStat("Runs", archiveSummary.entryCount)}
              ${buildStat("Cleared", archiveSummary.completedCount)}
              ${buildStat("Highest Lv", profileSummary.highestLevel || 1)}
              ${buildStat("Highest Act", profileSummary.highestActCleared || 0)}
            </div>
            <div class="entity-stat-grid" style="margin-top:8px">
              ${buildStat("Unlocks", unlockTotal)}
              ${buildStat("Stash", stashEntries)}
              ${buildStat("Bosses Slain", profileSummary.totalBossesDefeated)}
              ${buildStat("Gold Earned", profileSummary.totalGoldCollected)}
            </div>
          </article>
        </div>
      </section>
    `;
  }

  runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS = {
    formatTimestamp,
    getRunOutcomeTone,
    getSettingLabel,
    getLabelFromId,
    getClassName,
    getItemLabel,
    getRuneLabel,
    getRunewordLabel,
    getArchiveReviewState,
    getCapstoneTone,
    getCapstoneReviewTone,
    getVaultForecast,
    getTreeCapstoneBadgeLabel,
    buildAccountOverviewMarkup,
    buildAccountDashboardMarkup,
    // Patched by front-door-hall-view-sections-vault.ts after load
    buildUnlockGalleryMarkup: (() => "") as (...args: unknown[]) => string,
    buildVaultLogisticsMarkup: (() => "") as (...args: unknown[]) => string,
  };
})();
