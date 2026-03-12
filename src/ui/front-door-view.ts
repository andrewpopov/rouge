(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getSettingLabel(flag: boolean, onLabel: string, offLabel: string): string {
    return flag ? onLabel : offLabel;
  }

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

  function getLabelFromId(id: string): string {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function buildAccountOverviewMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    phaseTone: string,
    accountSummary: ProfileAccountSummary
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    // Keep account-facing concerns visible here, but read them through the live account summary seams.
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
      debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false },
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
          <article class="feature-card">
            <strong>Stash Vault</strong>
            <div class="entity-stat-grid">
              ${buildStat("Entries", stashEntries)}
              ${buildStat("Gear", stashEquipmentCount)}
              ${buildStat("Runes", stashRuneCount)}
              ${buildStat("Socket Bases", stashSummary.socketReadyEquipmentCount)}
            </div>
            <p>${escapeHtml(`Anything sent to stash leaves the current run inventory and waits here for withdrawal from a future town. Socketed runes stored: ${stashSummary.socketedRuneCount}. Active runeword bases archived: ${stashSummary.runewordEquipmentCount}.`)}</p>
          </article>
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
              ${buildBadge(settings.showHints ? "Hints Visible" : "Hints Hidden", settings.showHints ? "available" : "locked")}
              ${buildBadge(settings.reduceMotion ? "Reduced Motion" : "Full Motion", settings.reduceMotion ? "cleared" : "available")}
              ${buildBadge(settings.compactMode ? "Compact Layout" : "Full Layout", settings.compactMode ? "cleared" : "available")}
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

  function buildHallNavigatorMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string {
    return runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.buildHallNavigatorMarkup(appState, services, savedRunSummary, accountSummary);
  }

  function buildHallDecisionSupportMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string {
    return runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.buildHallDecisionSupportMarkup(appState, services, savedRunSummary, accountSummary);
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
                `Class roster: ${common.getPreviewLabel(unlockedClassLabels, "none yet")}.`,
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
                `Boss gallery: ${common.getPreviewLabel(unlockedBossLabels, "none yet")}.`,
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
                `Runeword codex: ${common.getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                `Recent charter pressure: ${common.getPreviewLabel(recentPlannedRunewordLabels, "no recent charter carry-through")}.`,
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
                `Focused tree rewards: ${common.getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                `Town systems online: ${common.getPreviewLabel(unlockedTownFeatureLabels, "none yet")}.`,
                `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "no new feature burst")}.`,
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
                `Vault loadout watch: ${common.getPreviewLabel(stashEquipmentLabels, "no stored gear")}.`,
                `Rune reserve: ${common.getPreviewLabel(stashRuneLabels, "no banked runes")}.`,
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
                `Socket-tracked gear: ${common.getPreviewLabel(socketTrackedLabels, "none with sockets yet")}.`,
                `Charged bases: ${common.getPreviewLabel(chargedBaseLabels, "no runed or runeword bases")}.`,
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

  function buildGuidedStartMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null
  ): string {
    return runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.buildGuidedStartMarkup(appState, services, savedRunSummary);
  }

  function buildAccountControlsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const settings = accountSummary.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
      debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false },
    };
    const preferredClassId = profileSummary.preferredClassId || "";
    const lastPlayedClassId = profileSummary.lastPlayedClassId || "";
    const classesPlayedIds = Array.isArray(appState.profile?.meta?.progression?.classesPlayed) ? appState.profile.meta.progression.classesPlayed : [];
    const preferredClassLabel = preferredClassId ? getClassName(appState, preferredClassId) : "Unset";
    const lastPlayedClassLabel = lastPlayedClassId ? getClassName(appState, lastPlayedClassId) : "No expedition yet";
    const classPreviewLabels = classesPlayedIds.map((classId) => getClassName(appState, classId));
    let classCommandLabel = "Unset";
    let classCommandTone = "locked";
    if (lastPlayedClassId) {
      classCommandLabel = "Following Recent";
      classCommandTone = "cleared";
    }
    if (preferredClassId && preferredClassId !== lastPlayedClassId) {
      classCommandLabel = "Pinned Preference";
      classCommandTone = "available";
    }
    let defaultClassMode = "First Class";
    if (lastPlayedClassId) {
      defaultClassMode = "Recent";
    }
    if (preferredClassId) {
      defaultClassMode = "Pinned";
    }
    const activeTutorialIds = Array.isArray(accountSummary.activeTutorialIds) ? accountSummary.activeTutorialIds : [];
    const dismissedTutorialIds = Array.isArray(appState.profile?.meta?.tutorials?.dismissedIds) ? appState.profile.meta.tutorials.dismissedIds : [];
    const completedTutorialIds = Array.isArray(appState.profile?.meta?.tutorials?.completedIds) ? appState.profile.meta.tutorials.completedIds : [];
    const activePreviewLabels = activeTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const dismissedPreviewLabels = dismissedTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const completedPreviewLabels = completedTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const plannedWeaponLabel = planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "Unset";
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const planningOverview = planning.overview;
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;

    const buildSettingButton = (settingKey: string, enabled: boolean, enabledLabel: string, disabledLabel: string): string => {
      return `
        <button
          class="neutral-btn"
          data-action="toggle-profile-setting"
          data-setting-key="${settingKey}"
          data-setting-value="${String(!enabled)}"
        >
          ${escapeHtml(enabled ? disabledLabel : enabledLabel)}
        </button>
      `;
    };

    const buildTutorialActionRows = (tutorialIds: string[], primaryAction: string, primaryLabel: string, secondaryAction = "", secondaryLabel = ""): string => {
      return tutorialIds
        .slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_ACTION_ROWS)
        .map((tutorialId) => {
          const tutorialLabel = common.getTutorialLabel(tutorialId);
          return `
            <div class="feature-card">
              <div class="entity-name-row">
                <strong>${escapeHtml(tutorialLabel)}</strong>
                ${buildBadge(primaryAction === "restore-tutorial" ? "Dismissed" : "Active", primaryAction === "restore-tutorial" ? "locked" : "available")}
              </div>
              <div class="cta-row">
                <button class="primary-btn" data-action="${primaryAction}" data-tutorial-id="${tutorialId}">
                  ${escapeHtml(`${primaryLabel} ${tutorialLabel}`)}
                </button>
                ${
                  secondaryAction
                    ? `
                        <button class="neutral-btn" data-action="${secondaryAction}" data-tutorial-id="${tutorialId}">
                          ${escapeHtml(`${secondaryLabel} ${tutorialLabel}`)}
                        </button>
                      `
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("");
    };

    const buildPlanningButtons = (slot: "weapon" | "armor"): string => {
      const selectedRunewordId = slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId;
      const slotRunewords = (Object.values(appState.content.runewordCatalog || {}) as RuntimeRunewordDefinition[]).filter((runeword) => runeword.slot === slot);
      return `
        <div class="cta-row">
          <button
            class="${selectedRunewordId ? "neutral-btn" : "primary-btn"}"
            data-action="set-planned-runeword"
            data-planning-slot="${slot}"
            data-runeword-id=""
          >
            ${escapeHtml(`Clear ${slot === "weapon" ? "Weapon" : "Armor"} Charter`)}
          </button>
          ${slotRunewords
            .map((runeword) => {
              const selected = runeword.id === selectedRunewordId;
              return `
                <button
                  class="${selected ? "primary-btn" : "neutral-btn"}"
                  data-action="set-planned-runeword"
                  data-planning-slot="${slot}"
                  data-runeword-id="${escapeHtml(runeword.id)}"
                >
                  ${escapeHtml(selected ? `Chartered ${runeword.name}` : `Charter ${runeword.name}`)}
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    };

    return `
      <section class="panel flow-panel" id="hall-controls">
        <div class="panel-head">
          <h2>Account Controls</h2>
          <p>The hall now writes directly into persisted settings and tutorial state. These controls stay thin and route through the existing account APIs rather than inventing new shell-owned state.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Settings Console</strong>
              ${buildBadge(settings.showHints ? "Guidance Enabled" : "Guidance Muted", settings.showHints ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Hints", settings.showHints ? "On" : "Off")}
              ${buildStat("Motion", settings.reduceMotion ? "Reduced" : "Full")}
              ${buildStat("Layout", settings.compactMode ? "Compact" : "Full")}
              ${buildStat("Scope", "Profile")}
            </div>
            <div class="cta-row">
              ${buildSettingButton("showHints", settings.showHints, "Show Hints", "Hide Hints")}
              ${buildSettingButton("reduceMotion", settings.reduceMotion, "Enable Reduced Motion", "Disable Reduced Motion")}
              ${buildSettingButton("compactMode", settings.compactMode, "Enable Compact Layout", "Disable Compact Layout")}
              ${buildSettingButton("debugMode.enabled", settings.debugMode?.enabled, "Enable Debug Mode", "Disable Debug Mode")}
            </div>
            ${settings.debugMode?.enabled ? `
            <div class="cta-row" style="border-top:1px solid rgba(255,200,100,0.15);padding-top:8px;margin-top:4px">
              <strong style="width:100%;color:#d4a050;font-size:0.85em">\u{1F41E} Debug Options</strong>
              ${buildSettingButton("debugMode.skipBattles", settings.debugMode?.skipBattles, "Skip Battles", "Fight Battles")}
              ${buildSettingButton("debugMode.invulnerable", settings.debugMode?.invulnerable, "Invulnerable", "Normal HP")}
              ${buildSettingButton("debugMode.oneHitKill", settings.debugMode?.oneHitKill, "One-Hit Kill", "Normal Damage")}
              ${buildSettingButton("debugMode.infiniteGold", settings.debugMode?.infiniteGold, "Infinite Gold", "Normal Gold")}
            </div>
            ` : ""}
            </div>
            <p>${escapeHtml("These toggles update the persisted profile immediately, so the next hall render reads the same account state without another settings layer.")}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Class Command</strong>
              ${buildBadge(classCommandLabel, classCommandTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Preferred", preferredClassLabel)}
              ${buildStat("Recent", lastPlayedClassLabel)}
              ${buildStat("Played", profileSummary.classesPlayedCount)}
              ${buildStat("Default", defaultClassMode)}
            </div>
            <div class="cta-row">
              ${appState.registries.classes
                .map((classEntry) => {
                  const isPreferred = classEntry.id === preferredClassId;
                  return `
                    <button class="${isPreferred ? "primary-btn" : "neutral-btn"}" data-action="set-preferred-class" data-class-id="${escapeHtml(classEntry.id)}">
                      ${escapeHtml(isPreferred ? `Preferred ${classEntry.name}` : `Prefer ${classEntry.name}`)}
                    </button>
                  `;
                })
                .join("")}
            </div>
            ${
              lastPlayedClassId
                ? `
                    <div class="cta-row">
                      <button class="neutral-btn" data-action="set-preferred-class" data-class-id="${escapeHtml(lastPlayedClassId)}">
                        Follow Recent Signal
                      </button>
                    </div>
                  `
                : ""
            }
            <p>${escapeHtml("Explicit preference now lives in persisted profile state. If preferred and recent match, the next run keeps following your latest class automatically.")}</p>
            ${buildStringList(
              [
                `Played classes: ${common.getPreviewLabel(classPreviewLabels, "none archived yet")}.`,
                `Recent signal: ${lastPlayedClassId ? `${lastPlayedClassLabel}. Use Follow Recent Signal to keep the default draft tracking your latest expedition.` : "Start one expedition to seed the recent-class signal."}`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Planning Desk</strong>
              ${buildBadge(`${planning.plannedRunewordCount} chartered`, planning.plannedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
            </div>
            ${buildPlanningButtons("weapon")}
            ${buildPlanningButtons("armor")}
            ${buildStringList(
              [
                "Runeword charters now live in profile-owned planning state instead of a temporary town-only preference.",
                "Late vendor bases, rune routing, and treasury-exchange consignment pressure now read these charters when steering stash planning.",
                `Next charter push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
                charterStageLines[0],
                charterStageLines[1],
                planning.weaponRunewordId
                  ? `Weapon ledger: ${planning.weaponCompletedRunCount}/${planning.weaponArchivedRunCount} archived runs fulfilled ${plannedWeaponLabel}.`
                  : "Weapon ledger: no weapon charter archived yet.",
                planning.armorRunewordId
                  ? `Armor ledger: ${planning.armorCompletedRunCount}/${planning.armorArchivedRunCount} archived runs fulfilled ${plannedArmorLabel}.`
                  : "Armor ledger: no armor charter archived yet.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Active Guidance</strong>
              ${buildBadge(`${activeTutorialIds.length} active`, activeTutorialIds.length > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Active", activeTutorialIds.length)}
              ${buildStat("Dismissed", dismissedTutorialIds.length)}
              ${buildStat("Completed", completedTutorialIds.length)}
              ${buildStat("Hints", settings.showHints ? "Visible" : "Hidden")}
            </div>
            ${
              activeTutorialIds.length > 0
                ? `
                    <div class="feature-grid">
                      ${buildTutorialActionRows(activeTutorialIds, "complete-tutorial", "Complete", "dismiss-tutorial", "Dismiss")}
                    </div>
                  `
                : '<p class="flow-copy">No active account prompts remain. Current guidance is either complete or temporarily dismissed.</p>'
            }
            ${buildStringList(
              [
                `Active prompts: ${common.getPreviewLabel(activePreviewLabels, "none right now")}.`,
                `Completed prompts: ${common.getPreviewLabel(completedPreviewLabels, "none yet")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Dismissed Guidance</strong>
              ${buildBadge(`${dismissedTutorialIds.length} parked`, dismissedTutorialIds.length > 0 ? "locked" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Dismissed", dismissedTutorialIds.length)}
              ${buildStat("Restorable", Math.min(2, dismissedTutorialIds.length))}
              ${buildStat("Completed", completedTutorialIds.length)}
              ${buildStat("Queue", activeTutorialIds.length > 0 ? "Live" : "Clear")}
            </div>
            ${
              dismissedTutorialIds.length > 0
                ? `
                    <div class="feature-grid">
                      ${buildTutorialActionRows(dismissedTutorialIds, "restore-tutorial", "Restore")}
                    </div>
                  `
                : '<p class="flow-copy">No prompts are currently dismissed. Use the active-guidance controls to park hints without deleting the account record.</p>'
            }
            ${buildStringList(
              [
                `Dismissed prompts: ${common.getPreviewLabel(dismissedPreviewLabels, "none right now")}.`,
                "Restore returns a prompt to the active queue without losing its seen history.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildArchiveDeskMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList } = services.renderUtils;
    const archiveState = getArchiveReviewState(appState, accountSummary);
    const {
      historyEntries,
      reviewedHistoryIndex,
      reviewedHistoryEntry,
      reviewedRunewordLabels,
      reviewedPlannedRunewordLabels,
      reviewedCompletedPlannedRunewordLabels,
      reviewedFeatureLabels,
      reviewedFavoredTreeLabel,
    } = archiveState;

    return `
      <article class="feature-card archive-focus-card">
        <div class="entity-name-row">
          <strong>Archive Review Desk</strong>
          ${buildBadge(
            reviewedHistoryEntry ? `Entry ${reviewedHistoryIndex + 1}/${historyEntries.length}` : "No Archives",
            reviewedHistoryEntry ? getRunOutcomeTone(reviewedHistoryEntry.outcome) : "locked"
          )}
        </div>
        ${
          reviewedHistoryEntry
            ? `
                <div class="entity-stat-grid">
                  ${buildStat("Class", reviewedHistoryEntry.className)}
                  ${buildStat("Outcome", getLabelFromId(reviewedHistoryEntry.outcome))}
                  ${buildStat("Level", reviewedHistoryEntry.level)}
                  ${buildStat("Acts", reviewedHistoryEntry.actsCleared)}
                  ${buildStat("Bosses", reviewedHistoryEntry.bossesDefeated)}
                  ${buildStat("Gold", reviewedHistoryEntry.goldGained)}
                  ${buildStat("Runewords", reviewedHistoryEntry.runewordsForged)}
                  ${buildStat("Logged", formatTimestamp(reviewedHistoryEntry.completedAt, true))}
                </div>
                <div class="cta-row">
                  ${
                    reviewedHistoryIndex > 0
                      ? `<button class="neutral-btn" data-action="set-run-history-review" data-history-index="${reviewedHistoryIndex - 1}">Newer Entry</button>`
                      : ""
                  }
                  ${
                    reviewedHistoryIndex < historyEntries.length - 1
                      ? `<button class="neutral-btn" data-action="set-run-history-review" data-history-index="${reviewedHistoryIndex + 1}">Older Entry</button>`
                      : ""
                  }
                  ${
                    reviewedHistoryIndex !== 0
                      ? '<button class="primary-btn" data-action="set-run-history-review" data-history-index="0">Latest Entry</button>'
                      : ""
                  }
                </div>
                ${buildStringList(
                  [
                    `Progression gains: ${reviewedHistoryEntry.skillPointsEarned} skill, ${reviewedHistoryEntry.classPointsEarned} class, ${reviewedHistoryEntry.attributePointsEarned} attribute, ${reviewedHistoryEntry.trainingRanksGained} training.`,
                    `Favored tree: ${reviewedFavoredTreeLabel}. Unlocked class skills: ${reviewedHistoryEntry.unlockedClassSkills}.`,
                    `Archived loadout: tier ${reviewedHistoryEntry.loadoutTier}, sockets ${reviewedHistoryEntry.loadoutSockets}, carried ${reviewedHistoryEntry.carriedEquipmentCount} gear and ${reviewedHistoryEntry.carriedRuneCount} runes.`,
                    `Stash snapshot: ${reviewedHistoryEntry.stashEntryCount} stored entries (${reviewedHistoryEntry.stashEquipmentCount} gear, ${reviewedHistoryEntry.stashRuneCount} runes).`,
                    `Planned charters: ${common.getPreviewLabel(reviewedPlannedRunewordLabels, "none archived")}.`,
                    `Completed charter targets: ${common.getPreviewLabel(reviewedCompletedPlannedRunewordLabels, "none fulfilled")}.`,
                    `Active runewords: ${common.getPreviewLabel(reviewedRunewordLabels, "none forged")}.`,
                    `New account features: ${common.getPreviewLabel(reviewedFeatureLabels, "no new feature gates")}.`,
                  ],
                  "log-list reward-list ledger-list"
                )}
              `
            : `
                <div class="entity-stat-grid">
                  ${buildStat("Archive Cap", archiveState.runHistoryCapacity)}
                  ${buildStat("Stored", historyEntries.length)}
                  ${buildStat("Latest", "None")}
                  ${buildStat("Outcome", "Awaiting")}
                </div>
                <p class="flow-copy">Richer archived run summaries are live, but the desk stays empty until an expedition is completed, failed, or abandoned.</p>
                ${buildStringList(
                  [
                    "Archived runs retain progression gains, favored-tree state, active runewords, and newly unlocked feature deltas.",
                    "Latest-first review lets the hall inspect long-horizon account growth without adding another persistence surface.",
                  ],
                  "log-list reward-list ledger-list"
                )}
              `
        }
      </article>
    `;
  }

  function buildArchiveSignalBoardMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList } = services.renderUtils;
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
    const latestOutcomeLabel = archiveSummary.latestOutcome ? getLabelFromId(archiveSummary.latestOutcome) : "Awaiting";
    const recentFeatureLabels = (archiveSummary.recentFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archiveSummary.recentPlannedRunewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));
    const unlockedFeatureLabels = (accountSummary.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));

    return `
      <div class="panel-head panel-head-compact">
        <h3>Archive Signal Board</h3>
        <p>The archive wing now separates single-entry review from whole-account signals, so the hall can show broader archive pressure without replacing the focused review desk.</p>
      </div>
      <div class="feature-grid feature-grid-wide">
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Latest Expedition Pulse</strong>
            ${buildBadge(archiveSummary.latestClassName || "No Archive", archiveSummary.entryCount > 0 ? getRunOutcomeTone(archiveSummary.latestOutcome || "abandoned") : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Class", archiveSummary.latestClassName || "Awaiting")}
            ${buildStat("Outcome", latestOutcomeLabel)}
            ${buildStat("Highest Lv", archiveSummary.highestLevel)}
            ${buildStat("Highest Act", archiveSummary.highestActsCleared)}
          </div>
          ${buildStringList(
            [
              `Latest favored tree: ${archiveSummary.favoredTreeName || "no archived focus yet"}.`,
              `Archive spread: ${archiveSummary.completedCount} cleared, ${archiveSummary.failedCount} failed, ${archiveSummary.abandonedCount} abandoned.`,
              `Recent archive pulse: ${archiveSummary.latestCompletedAt ? formatTimestamp(archiveSummary.latestCompletedAt, true) : "no archived timestamp yet"}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Planning Retrospective</strong>
            ${buildBadge(`${archiveSummary.planningArchiveCount} tracked`, archiveSummary.planningArchiveCount > 0 ? "available" : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Planning Runs", archiveSummary.planningArchiveCount)}
            ${buildStat("Fulfilled", archiveSummary.planningCompletionCount)}
            ${buildStat("Missed", archiveSummary.planningMissCount)}
            ${buildStat("Runeword Runs", archiveSummary.runewordArchiveCount)}
          </div>
          ${buildStringList(
            [
              `Recent charter pressure: ${common.getPreviewLabel(recentPlannedRunewordLabels, "no recent charter carry-through")}.`,
              `Planning completion rate: ${archiveSummary.planningCompletionCount}/${Math.max(archiveSummary.planningArchiveCount, 1)} tracked runs landed a charter target.`,
              `Runeword-bearing archive runs: ${archiveSummary.runewordArchiveCount}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Unlock Burst Ledger</strong>
            ${buildBadge(`${archiveSummary.featureUnlockCount} unlocks`, archiveSummary.featureUnlockCount > 0 ? "available" : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Feature Bursts", archiveSummary.featureUnlockCount)}
            ${buildStat("Recent", archiveSummary.recentFeatureIds.length)}
            ${buildStat("Tree Rewards", unlockedFeatureLabels.length)}
            ${buildStat("Gold Peak", archiveSummary.highestGoldGained)}
          </div>
          ${buildStringList(
            [
              `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "no new feature burst")}.`,
              `Focused tree rewards now online: ${common.getPreviewLabel(unlockedFeatureLabels, "no milestone rewards online yet")}.`,
              `Archive gold peak: ${archiveSummary.highestGoldGained}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
      </div>
    `;
  }

  function buildSavedRunMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary): string {
    return runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.buildExpeditionSectionMarkup(appState, services, savedRunSummary);
  }

  function buildFreshStartMarkup(appState: AppState, services: UiRenderServices): string {
    return runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.buildExpeditionSectionMarkup(appState, services, null);
  }

  function buildVaultChronicleMarkup(
    appState: AppState,
    services: UiRenderServices,
    accountSummary: ProfileAccountSummary,
    stashPreviewLines: string[],
    recentRunMarkup: string
  ): string {
    return `
      <section class="panel flow-panel" id="hall-archive">
        <div class="panel-head">
          <h2>Vault And Chronicle</h2>
          <p>Account storage and run history now share a dedicated archive wing so stash review, recent runs, and long-form archive drilldowns stay together.</p>
        </div>
        <div class="front-door-snapshot-grid">
          <article class="feature-card">
            <strong>Stash Preview</strong>
            ${
              stashPreviewLines.length > 0
                ? services.renderUtils.buildStringList(stashPreviewLines, "log-list reward-list ledger-list")
                : '<p class="flow-copy">The profile stash is empty. Gear and runes moved out of town inventory will appear here.</p>'
            }
          </article>
          <article class="feature-card">
            <strong>Recent Expeditions</strong>
            ${recentRunMarkup}
          </article>
          ${buildArchiveDeskMarkup(appState, services, accountSummary)}
        </div>
        ${buildArchiveSignalBoardMarkup(appState, services, accountSummary)}
      </section>
    `;
  }

  function buildCapstoneWatchMarkup(services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const trees = Array.isArray(accountSummary.trees) ? accountSummary.trees : [];
    const focusedTree = trees.find((tree) => tree.isFocused) || trees[0] || null;
    const review = accountSummary.review || {
      capstoneCount: 0,
      unlockedCapstoneCount: 0,
      blockedCapstoneCount: 0,
      readyCapstoneCount: 0,
      nextCapstoneId: "",
      nextCapstoneTitle: "",
      convergenceCount: 0,
      unlockedConvergenceCount: 0,
      blockedConvergenceCount: 0,
      availableConvergenceCount: 0,
      nextConvergenceId: "",
      nextConvergenceTitle: "",
    };

    return `
      <section class="panel flow-panel" id="hall-capstones">
        <div class="panel-head">
          <h2>Capstone Watch</h2>
          <p>Late account goals are now broken out from the wider tree review, so capstone pressure stays visible while the hall remains ready for deeper Agent 2 progression read models later.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Late Account Pressure</strong>
              ${buildBadge(review.nextCapstoneTitle || "No Capstone", getCapstoneReviewTone(review))}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Total", review.capstoneCount)}
              ${buildStat("Ready", review.readyCapstoneCount)}
              ${buildStat("Unlocked", review.unlockedCapstoneCount)}
              ${buildStat("Blocked", review.blockedCapstoneCount)}
            </div>
            <p>${escapeHtml("Capstones stay summary-first here. Retargeting focus still happens in the main account tree review so the shell does not duplicate control ownership.")}</p>
            ${buildStringList(
              [
                `Focused tree pressure: ${focusedTree ? focusedTree.title : "no tree focus online"}.`,
                `Next capstone: ${review.nextCapstoneTitle || "every current capstone is already online"}.`,
                `Nearest milestone: ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          ${trees
            .map((tree) => {
              const capstoneMilestone = tree.milestones.find((milestone) => milestone.isCapstone) || null;
              const unlockedFeatureLabels = (tree.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
              const treeBadgeLabel = getTreeCapstoneBadgeLabel(tree);

              return `
                <article class="feature-card">
                  <div class="entity-name-row">
                    <strong>${escapeHtml(tree.title)}</strong>
                    ${buildBadge(treeBadgeLabel, getCapstoneTone(tree.capstoneStatus))}
                  </div>
                  <div class="entity-stat-grid">
                    ${buildStat("Rank", `${tree.currentRank}/${tree.maxRank}`)}
                    ${buildStat("Ready", tree.eligibleMilestoneCount)}
                    ${buildStat("Blocked", tree.blockedMilestoneCount)}
                    ${buildStat("Focus", tree.isFocused ? "Active" : "Standby")}
                  </div>
                  ${buildStringList(
                    [
                      `Capstone state: ${tree.capstoneTitle || "no capstone authored"}.`,
                      `Capstone progress: ${capstoneMilestone ? `${capstoneMilestone.progress}/${capstoneMilestone.target}` : "n/a"}.`,
                      `Tree rewards online: ${common.getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                      `Next step: ${tree.nextMilestoneTitle || "all milestones cleared"}.`,
                    ],
                    "log-list reward-list ledger-list"
                  )}
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
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
    const hide = (s: string) => s !== section ? "display:none" : "";

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
        <div data-hall-tab="overview" style="${hide("overview")}">
          ${hallView.buildAccountDashboardMarkup(appState, services, savedRunSummary, phaseTone, accountSummary)}
        </div>
        <div data-hall-tab="expedition" style="${hide("expedition")}">
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
        <div data-hall-tab="progression" style="${hide("progression")}">
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
        <div data-hall-tab="vault" style="${hide("vault")}">
          ${hallView.buildVaultLogisticsMarkup(appState, services, accountSummary)}
          ${hallView.buildVaultChronicleMarkup(appState, services, accountSummary, stashPreviewLines, recentRunMarkup)}
          ${hallView.buildUnlockGalleryMarkup(appState, services, accountSummary)}
        </div>
        <div data-hall-tab="settings" style="${hide("settings")}">
          ${hallView.buildAccountControlsMarkup(appState, services, accountSummary)}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_FRONT_DOOR_VIEW = {
    render,
  };
})();
