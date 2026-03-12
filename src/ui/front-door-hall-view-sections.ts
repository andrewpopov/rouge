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

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function getArchiveReviewState(appState: AppState, accountSummary: ProfileAccountSummary) {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const historyEntries = Array.isArray(appState.profile?.runHistory) ? appState.profile.runHistory : [];
    const reviewedHistoryIndex = Math.min(
      Math.max(0, Number.parseInt(String(appState.ui.reviewedHistoryIndex || 0), 10) || 0),
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
      recentFeatureIds: [],
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
      classesPlayed: [],
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
                `Unlocked classes: ${getPreviewLabel(unlockedClassLabels, "none yet")}.`,
                `Boss trophies: ${getPreviewLabel(unlockedBossLabels, "none yet")}.`,
                `Runewords forged: ${getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                `Account systems online: ${getPreviewLabel(unlockedTownFeatureLabels, "none yet")}.`,
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
                `Seen guidance: ${getPreviewLabel(seenTutorialLabels, "none yet")}.`,
                `Completed guidance: ${getPreviewLabel(completedTutorialLabels, "none yet")}.`,
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
    const unlocks = appState.profile?.meta?.unlocks || { classIds: [], bossIds: [], runewordIds: [] };
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

  function buildUnlockGalleryMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
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
      planningCompletionCount: 0,
      planningMissCount: 0,
      recentFeatureIds: [],
      recentPlannedRunewordIds: [],
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const unlocks = appState.profile?.meta?.unlocks || {
      classIds: [],
      bossIds: [],
      runewordIds: [],
      townFeatureIds: [],
    };
    const unlockedClassLabels = (unlocks.classIds || []).map((classId) => getClassName(appState, classId));
    const unlockedBossLabels = (unlocks.bossIds || []).map((bossId) => {
      return getLabelFromId(appState.content.enemyCatalog?.[bossId]?.name || bossId);
    });
    const unlockedRunewordLabels = (unlocks.runewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));
    const unlockedTownFeatureLabels = (unlocks.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const unlockedFeatureLabels = (accountSummary.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentFeatureLabels = (archiveSummary.recentFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archiveSummary.recentPlannedRunewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));

    return `
      <section class="panel flow-panel" id="hall-unlocks">
        <div class="panel-head">
          <h2>Unlock Galleries</h2>
          <p>The hall now breaks account unlocks out into dedicated gallery cards, so roster breadth, boss trophies, runeword growth, and newer account-system unlock bursts stay readable at a glance.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Class Roster Archive</strong>
              ${buildBadge(`${profileSummary.unlockedClassCount} online`, profileSummary.unlockedClassCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Classes", profileSummary.unlockedClassCount)}
              ${buildStat("Played", profileSummary.classesPlayedCount)}
              ${buildStat("Preferred", profileSummary.preferredClassId ? getClassName(appState, profileSummary.preferredClassId) : "Unset")}
              ${buildStat("Latest", archiveSummary.latestClassName || "Awaiting")}
            </div>
            ${buildStringList(
              [
                `Class roster: ${getPreviewLabel(unlockedClassLabels, "none yet")}.`,
                `Focused draft signal: ${profileSummary.preferredClassId ? getClassName(appState, profileSummary.preferredClassId) : "no preferred class pinned yet"}.`,
                `Recent class pressure: ${archiveSummary.latestClassName || "no archive yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Boss Trophy Gallery</strong>
              ${buildBadge(`${profileSummary.unlockedBossCount} trophies`, profileSummary.unlockedBossCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Bosses", profileSummary.unlockedBossCount)}
              ${buildStat("Highest Act", profileSummary.highestActCleared)}
              ${buildStat("Lifetime Kills", profileSummary.totalBossesDefeated)}
              ${buildStat("Favored", archiveSummary.favoredTreeName || "Unset")}
            </div>
            ${buildStringList(
              [
                `Boss gallery: ${getPreviewLabel(unlockedBossLabels, "none yet")}.`,
                `Latest favored tree: ${archiveSummary.favoredTreeName || "no archived focus yet"}.`,
                `The mastery lane now feeds these trophies without needing another hall rewrite.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Codex</strong>
              ${buildBadge(`${profileSummary.unlockedRunewordCount} entries`, profileSummary.unlockedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
              ${buildStat("Archived", archiveSummary.runewordArchiveCount)}
              ${buildStat("Fulfilled", archiveSummary.planningCompletionCount)}
            </div>
            ${buildStringList(
              [
                `Runeword codex: ${getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                `Recent charter pressure: ${getPreviewLabel(recentPlannedRunewordLabels, "no recent charter carry-through")}.`,
                `Weapon ledger: ${planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "no weapon charter"}. Armor ledger: ${planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "no armor charter"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Recent Unlock Wave</strong>
              ${buildBadge(`${archiveSummary.featureUnlockCount} bursts`, archiveSummary.featureUnlockCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Tree Rewards", unlockedFeatureLabels.length)}
              ${buildStat("Town Hooks", profileSummary.townFeatureCount)}
              ${buildStat("Recent", archiveSummary.recentFeatureIds.length)}
              ${buildStat("Archives", archiveSummary.entryCount)}
            </div>
            <p>${escapeHtml("These are read-only hall summaries built on the current unlock and archive seams, leaving room for broader Agent 2 progression read models later.")}</p>
            ${buildStringList(
              [
                `Focused tree rewards: ${getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                `Town systems online: ${getPreviewLabel(unlockedTownFeatureLabels, "none yet")}.`,
                `Recent feature burst: ${getPreviewLabel(recentFeatureLabels, "no new feature burst")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildVaultLogisticsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
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
      planningCompletionCount: 0,
      planningMissCount: 0,
      recentFeatureIds: [],
      recentPlannedRunewordIds: [],
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const stashEntries = Array.isArray(appState.profile?.stash?.entries) ? appState.profile.stash.entries : [];
    const equipmentEntries = stashEntries.filter((entry): entry is InventoryEquipmentEntry => entry.kind === "equipment");
    const runeEntries = stashEntries.filter((entry): entry is InventoryRuneEntry => entry.kind === "rune");
    const stashEquipmentLabels = equipmentEntries.map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const stashRuneLabels = runeEntries.map((entry) => getRuneLabel(appState, entry.runeId));
    const socketTrackedLabels = equipmentEntries
      .filter((entry) => entry.equipment.socketsUnlocked > 0)
      .map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const chargedBaseLabels = equipmentEntries
      .filter((entry) => entry.equipment.insertedRunes.length > 0 || Boolean(entry.equipment.runewordId))
      .map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const plannedWeaponLabel = planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "Unset";
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const planningOverview = planning.overview;
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;
    const { tone: forecastTone, copy: forecastCopy } = getVaultForecast(planning);

    const vaultIsEmpty = stashSummary.entryCount === 0 && planning.plannedRunewordCount === 0;

    if (vaultIsEmpty) {
      return `
        <section class="panel flow-panel feature-card--empty" id="hall-vault">
          <div class="panel-head">
            <h2>Vault Logistics</h2>
          </div>
          <p class="feature-card__empty-hint">The vault is empty. Send items to stash and pin runeword charters to populate this section.</p>
        </section>
      `;
    }

    return `
      <section class="panel flow-panel" id="hall-vault">
        <div class="panel-head">
          <h2>Vault Logistics</h2>
          <p>The hall now gives stash and planning state their own logistics pass, so carry-forward gear, rune reserve, and charter pressure are readable before you open another expedition.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Vault Logistics</strong>
              ${buildBadge(`${stashSummary.entryCount} stored`, stashSummary.entryCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Entries", stashSummary.entryCount)}
              ${buildStat("Gear", stashSummary.equipmentCount)}
              ${buildStat("Runes", stashSummary.runeCount)}
              ${buildStat("Archives", archiveSummary.entryCount)}
            </div>
            ${buildStringList(
              [
                `Vault loadout watch: ${getPreviewLabel(stashEquipmentLabels, "no stored gear")}.`,
                `Rune reserve: ${getPreviewLabel(stashRuneLabels, "no banked runes")}.`,
                `Latest archive push: ${archiveSummary.latestClassName || "no archived class yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Socket And Base Watch</strong>
              ${buildBadge(`${stashSummary.socketReadyEquipmentCount} tracked`, stashSummary.socketReadyEquipmentCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Socket Bases", stashSummary.socketReadyEquipmentCount)}
              ${buildStat("Socketed Runes", stashSummary.socketedRuneCount)}
              ${buildStat("Runeword Bases", stashSummary.runewordEquipmentCount)}
              ${buildStat("Highest Tier", archiveSummary.highestLoadoutTier)}
            </div>
            ${buildStringList(
              [
                `Socket-tracked gear: ${getPreviewLabel(socketTrackedLabels, "none with sockets yet")}.`,
                `Charged bases: ${getPreviewLabel(chargedBaseLabels, "no runed or runeword bases")}.`,
                `Archived loadout tier pressure: ${archiveSummary.highestLoadoutTier || 0}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Charter Pressure</strong>
              ${buildBadge(`${planning.plannedRunewordCount} live`, planning.plannedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
            </div>
            ${buildStringList(
              [
                charterStageLines[0],
                charterStageLines[1],
                `Next vault push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
                `Archive fulfillment: ${planning.fulfilledPlanCount} cleared, ${planning.unfulfilledPlanCount} missed.`,
                `Best charter pushes: weapon act ${planning.weaponBestActsCleared}, armor act ${planning.armorBestActsCleared}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Draft Forecast</strong>
              ${buildBadge(forecastTone === "cleared" ? "Open Vault" : "Charter Pressure", forecastTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Planning Runs", archiveSummary.planningArchiveCount)}
              ${buildStat("Complete", archiveSummary.planningCompletionCount)}
              ${buildStat("Miss", archiveSummary.planningMissCount)}
              ${buildStat("Gold Peak", archiveSummary.highestGoldGained)}
            </div>
            <p>${escapeHtml(forecastCopy)}</p>
            ${buildStringList(
              [
                `Current planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
                planningOverview.nextActionSummary || "No active runeword charter is pinned across the account.",
                "This panel is intentionally shell-owned and summary-heavy so Agent 2 can later widen stash or planning read models without another front-door rewrite.",
              ],
              "log-list reward-list ledger-list"
            )}
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
    getPreviewLabel,
    getArchiveReviewState,
    getCapstoneTone,
    getCapstoneReviewTone,
    getVaultForecast,
    getTreeCapstoneBadgeLabel,
    buildAccountOverviewMarkup,
    buildAccountDashboardMarkup,
    buildUnlockGalleryMarkup,
    buildVaultLogisticsMarkup,
  };
})();
