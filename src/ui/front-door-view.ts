/* eslint-disable max-lines */
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

  function getSettingLabel(enabled: boolean, positiveLabel: string, negativeLabel: string): string {
    return enabled ? positiveLabel : negativeLabel;
  }

  function getStashPreviewLines(profile: ProfileState, content: GameContent): string[] {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.slice(0, 4) : [];
    return entries.map((entry) => {
      if (entry.kind === "equipment") {
        const item = content.itemCatalog?.[entry.equipment.itemId] || null;
        return `${item?.name || entry.equipment.itemId} held in profile stash for a future loadout swap.`;
      }

      const rune = content.runeCatalog?.[entry.runeId] || null;
      return `${rune?.name || entry.runeId} banked for sockets, runewords, or a later class build.`;
    });
  }

  function buildRecentRunMarkup(profile: ProfileState, renderUtils: RenderUtilsApi): string {
    const { buildBadge, buildStat, escapeHtml } = renderUtils;
    const entries = Array.isArray(profile?.runHistory) ? profile.runHistory.slice(0, 4) : [];
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

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function getClassName(appState: AppState, classId: string): string {
    return appState.registries.classes.find((entry) => entry.id === classId)?.name || classId;
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
                  <p>${escapeHtml(`Resume in ${savedRunSummary.safeZoneName} and keep pushing toward ${savedRunSummary.bossName}.`)}</p>
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

  function buildHallNavigatorMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string {
    const { buildBadge, buildStat, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const settings = accountSummary.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
    };
    const activeTutorialIds = Array.isArray(accountSummary.activeTutorialIds) ? accountSummary.activeTutorialIds : [];
    const archiveState = getArchiveReviewState(appState, accountSummary);

    return `
      <section class="panel flow-panel" id="hall-navigator">
        <div class="panel-head">
          <h2>Hall Navigator</h2>
          <p>The account hall now has stable wings. Jump straight to the expedition, archive, progression, control, or onboarding surfaces instead of scanning one uninterrupted scroll.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Expedition Wing</strong>
              ${buildBadge(savedRunSummary ? "Live Route" : "Fresh Draft", savedRunSummary ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Snapshot", savedRunSummary ? savedRunSummary.phaseLabel : "No Save")}
              ${buildStat("Class", savedRunSummary ? savedRunSummary.className : "Open")}
              ${buildStat("Act", savedRunSummary ? savedRunSummary.actTitle : "Start")}
              ${buildStat("Next", savedRunSummary ? "Resume" : "Draft")}
            </div>
            <p>${escapeHtml(savedRunSummary ? `Resume the parked ${savedRunSummary.className} expedition without losing route momentum.` : "Open character draft and move directly into the town-prep shell.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Progression Gallery</strong>
              ${buildBadge(accountSummary.focusedTreeTitle || "Unset", accountSummary.focusedTreeId ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Focused", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Next", accountSummary.nextMilestoneTitle || "Cleared")}
              ${buildStat("Milestones", `${accountSummary.unlockedMilestoneCount}/${accountSummary.milestoneCount}`)}
              ${buildStat("Trees", accountSummary.treeCount)}
            </div>
            <p>${escapeHtml("Archive, trade, and mastery focus stay visible as a dedicated wing so progression steering is not buried under controls.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Vault And Archive</strong>
              ${buildBadge(`${profileSummary.runHistoryCount} logged`, profileSummary.runHistoryCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Stash", profileSummary.stashEntries)}
              ${buildStat("Archives", profileSummary.runHistoryCount)}
              ${buildStat("Reviewed", archiveState.reviewedHistoryEntry ? archiveState.reviewedHistoryIndex + 1 : 0)}
              ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
            </div>
            <p>${escapeHtml("The stash preview, recent expeditions, and focused archive desk now live together as one chronicle wing.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Control Annex</strong>
              ${buildBadge(settings.showHints ? "Guided" : "Muted", settings.showHints ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Hints", settings.showHints ? "On" : "Off")}
              ${buildStat("Motion", settings.reduceMotion ? "Reduced" : "Full")}
              ${buildStat("Layout", settings.compactMode ? "Compact" : "Full")}
              ${buildStat("Active Prompts", activeTutorialIds.length)}
            </div>
            <p>${escapeHtml("Settings, preferred class, runeword charters, and tutorial queue controls stay grouped in one account-owned annex.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Guided Start</strong>
              ${buildBadge(profileSummary.completedTutorialCount > 0 ? "Returning" : "First Run", profileSummary.completedTutorialCount > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Seen", profileSummary.seenTutorialCount)}
              ${buildStat("Done", profileSummary.completedTutorialCount)}
              ${buildStat("Classes", appState.registries.classes.length)}
              ${buildStat("Mercs", appState.registries.mercenaries.length)}
            </div>
            <p>${escapeHtml("Onboarding continuity now has its own wing so the hall clearly hands the player into draft, town, route, reward, and archive review.")}</p>
          </article>
        </div>
        <div class="cta-row hall-jump-row">
          <a class="neutral-btn" href="#hall-expedition">Expedition Wing</a>
          <a class="neutral-btn" href="#hall-progression">Progression Gallery</a>
          <a class="neutral-btn" href="#hall-archive">Vault And Archive</a>
          <a class="neutral-btn" href="#hall-controls">Control Annex</a>
          <a class="neutral-btn" href="#hall-guided">Guided Start</a>
        </div>
      </section>
    `;
  }

  function buildGuidedStartMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null
  ): string {
    const { escapeHtml } = services.renderUtils;
    const classCount = appState.registries.classes.length;
    const mercCount = appState.registries.mercenaries.length;

    return `
      <section class="panel flow-panel" id="hall-guided">
        <div class="panel-head">
          <h2>Path To First Blood</h2>
          <p>The shell explains what to do next without inventing a separate tutorial phase. The same surfaces now reflect persistent tutorial state back out of the account model.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <strong>1. Recruit A Hero</strong>
            <p>Choose from ${escapeHtml(classCount)} seeded classes. The selected class sets hero stats, deck profile, and the skill trees you will chase during the run.</p>
          </article>
          <article class="feature-card">
            <strong>2. Hire A Companion</strong>
            <p>Pick one of ${escapeHtml(mercCount)} mercenary contracts. That companion auto-acts in combat and stays part of the run contract until you swap or revive them in town.</p>
          </article>
          <article class="feature-card">
            <strong>3. Prepare In Town</strong>
            <p>Heal, refill the belt, spend training, inspect vendor stock, and move gear between carried inventory and profile stash before you step onto the map.</p>
          </article>
          <article class="feature-card">
            <strong>4. Read The Route</strong>
            <p>Battle, miniboss, boss, shrine, quest, aftermath, and opportunity nodes all stay visible. The shell explains whether a node resolves through combat or through the reward seam.</p>
          </article>
          <article class="feature-card">
            <strong>5. Resolve Encounters</strong>
            <p>Select a living enemy for targeted cards, use potions only when they matter, then claim one reward choice to permanently mutate the run before the route resumes.</p>
          </article>
          <article class="feature-card">
            <strong>Checkpoint Policy</strong>
            <p>${savedRunSummary ? "One autosaved expedition is already waiting in the hall." : "Autosave snapshots are written outside combat, so you always re-enter from a readable run-state checkpoint."}</p>
          </article>
        </div>
      </section>
    `;
  }

  function buildAccountControlsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const settings = accountSummary.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
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
    const activePreviewLabels = activeTutorialIds.slice(0, 3).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const dismissedPreviewLabels = dismissedTutorialIds.slice(0, 3).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const completedPreviewLabels = completedTutorialIds.slice(0, 3).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const planning = accountSummary.planning || {
      weaponRunewordId: "",
      armorRunewordId: "",
      plannedRunewordCount: 0,
      fulfilledPlanCount: 0,
      unfulfilledPlanCount: 0,
      weaponArchivedRunCount: 0,
      weaponCompletedRunCount: 0,
      weaponBestActsCleared: 0,
      armorArchivedRunCount: 0,
      armorCompletedRunCount: 0,
      armorBestActsCleared: 0,
    };
    const getRunewordLabel = (runewordId: string): string => {
      return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
    };
    const plannedWeaponLabel = planning.weaponRunewordId ? getRunewordLabel(planning.weaponRunewordId) : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? getRunewordLabel(planning.armorRunewordId) : "Unset";

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
        .slice(0, 2)
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
                `Played classes: ${getPreviewLabel(classPreviewLabels, "none archived yet")}.`,
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
              ${buildStat("Targets", planning.plannedRunewordCount)}
              ${buildStat("Scope", "Account")}
            </div>
            ${buildPlanningButtons("weapon")}
            ${buildPlanningButtons("armor")}
            ${buildStringList(
              [
                "Runeword charters now live in profile-owned planning state instead of a temporary town-only preference.",
                "Late vendor bases, rune routing, and treasury-exchange consignment pressure now read these charters when steering stash planning.",
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
                `Active prompts: ${getPreviewLabel(activePreviewLabels, "none right now")}.`,
                `Completed prompts: ${getPreviewLabel(completedPreviewLabels, "none yet")}.`,
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
                `Dismissed prompts: ${getPreviewLabel(dismissedPreviewLabels, "none right now")}.`,
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
                    `Planned charters: ${getPreviewLabel(reviewedPlannedRunewordLabels, "none archived")}.`,
                    `Completed charter targets: ${getPreviewLabel(reviewedCompletedPlannedRunewordLabels, "none fulfilled")}.`,
                    `Active runewords: ${getPreviewLabel(reviewedRunewordLabels, "none forged")}.`,
                    `New account features: ${getPreviewLabel(reviewedFeatureLabels, "no new feature gates")}.`,
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

  function buildSavedRunMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary): string {
    const { buildBadge, buildStat, escapeHtml, buildStringList } = services.renderUtils;
    // The front door reviews the saved route, but resume/abandon decisions still resolve through app-engine.
    const confirmSection = appState.ui.confirmAbandonSavedRun
      ? `
          <section class="panel notice-panel confirm-panel">
            <strong>Archive This Expedition</strong>
            <p>Confirming will abandon the live snapshot, push the route into run history, and reopen the hall for a fresh recruitment flow.</p>
          </section>
        `
      : "";
    const actionRow = appState.ui.confirmAbandonSavedRun
      ? `
          <button class="neutral-btn" data-action="cancel-abandon-saved-run">Keep Expedition</button>
          <button class="neutral-btn" data-action="confirm-abandon-saved-run">Archive Expedition</button>
        `
      : '<button class="neutral-btn" data-action="prompt-abandon-saved-run">Release This Expedition</button>';

    return `
      <section class="panel flow-panel" id="hall-expedition">
        <div class="panel-head">
          <h2>Resume Expedition</h2>
          <p>Only one autosaved route waits in the hall at a time. Review its state, then continue or archive it deliberately.</p>
        </div>
        <div class="front-door-snapshot-grid">
          <article class="entity-card ally snapshot-card">
            <div class="entity-name-row">
              <strong class="entity-name">${escapeHtml(savedRunSummary.className)}</strong>
              ${buildBadge(savedRunSummary.phaseLabel, getPhaseTone(savedRunSummary, services.appEngine))}
            </div>
            <p class="service-subtitle">${escapeHtml(`${savedRunSummary.actTitle} · ${savedRunSummary.safeZoneName}`)}</p>
            <div class="entity-stat-grid">
              ${buildStat("Level", savedRunSummary.level)}
              ${buildStat("Gold", savedRunSummary.gold)}
              ${buildStat("Deck", savedRunSummary.deckSize)}
              ${buildStat("Belt", savedRunSummary.beltState)}
            </div>
            <p class="entity-passive">${escapeHtml(`Saved ${formatTimestamp(savedRunSummary.savedAt)}. The route is still pointed at ${savedRunSummary.bossName}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Momentum Check</strong>
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
            <p>${escapeHtml(`Boss trophies ${savedRunSummary.bossTrophies}, resolved quests ${savedRunSummary.resolvedQuestOutcomes}, active runewords ${savedRunSummary.activeRunewords}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Re-entry Checklist</strong>
            ${buildStringList(
              [
                `Resume in ${savedRunSummary.phaseLabel.toLowerCase()} state without rebuilding the run shell.`,
                `Town, map, reward, and run-end screens all keep the same account-facing vocabulary on return.`,
                "Archive only if you explicitly want to clear the autosave and start a new class draft.",
              ],
              "log-list reward-list ledger-list"
            )}
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

  function buildFreshStartMarkup(appState: AppState, services: UiRenderServices): string {
    const { buildBadge, buildStringList, escapeHtml } = services.renderUtils;
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Any Class";

    return `
      <section class="panel flow-panel" id="hall-expedition">
        <div class="panel-head">
          <h2>Open A New Expedition</h2>
          <p>No active autosave is blocking the hall. Step into character draft, choose a class and mercenary, then enter town with clear guidance for the first route.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Character Hall</strong>
              ${buildBadge(preferredClassName, "available")}
            </div>
            <p>${escapeHtml(`The next recruitment screen will surface your preferred class signal: ${preferredClassName}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Autosave Contract</strong>
            ${buildStringList(
              [
                "Snapshots are written at readable checkpoints outside combat.",
                "Abandoning is explicit so the front door never destroys a live route accidentally.",
                "Run history remains profile-owned after the route ends.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <strong>First Destination</strong>
            <p>Character select leads straight into Rogue Encampment, where the shell explains town services, route pressure, and what persists when you step back onto the world map.</p>
          </article>
        </div>
        <div class="cta-row">
          <button class="primary-btn" data-action="start-character-select">Enter Character Hall</button>
        </div>
      </section>
    `;
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
      </section>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const savedRunSummary = services.appEngine.getSavedRunSummary();
    const phaseTone = getPhaseTone(savedRunSummary, services.appEngine);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const stashPreviewLines = getStashPreviewLines(appState.profile, appState.content);
    const recentRunMarkup = buildRecentRunMarkup(appState.profile, services.renderUtils);
    const expeditionSection = savedRunSummary
      ? buildSavedRunMarkup(appState, services, savedRunSummary)
      : buildFreshStartMarkup(appState, services);

    services.renderUtils.buildShell(root, {
      eyebrow: "Front Door",
      title: savedRunSummary ? "A Route Waits In The Hall" : "Rouge Account Hall",
      copy: savedRunSummary
        ? "The front door now behaves like a durable account-entry shell. Resume the parked expedition or archive it intentionally before drafting a new one."
        : "The front door is no longer a debug launcher. It surfaces profile state, guided play, future account hooks, and the next clean step into the run loop.",
      body: `
        ${buildAccountOverviewMarkup(appState, services, savedRunSummary, phaseTone, accountSummary)}
        ${buildHallNavigatorMarkup(appState, services, savedRunSummary, accountSummary)}
        ${expeditionSection}
        <section class="panel flow-panel" id="hall-progression">
          <div class="panel-head">
            <h2>Account Tree Review</h2>
            <p>Archive, trade, and mastery focus now render through the hall itself. Redirecting focus here updates the same profile-owned tree state that drives retention, town economy, and reward pivots.</p>
          </div>
          ${common.buildAccountTreeReviewMarkup(accountSummary, services.renderUtils)}
        </section>
        ${buildVaultChronicleMarkup(appState, services, accountSummary, stashPreviewLines, recentRunMarkup)}
        ${buildAccountControlsMarkup(appState, services, accountSummary)}
        ${buildGuidedStartMarkup(appState, services, savedRunSummary)}
      `,
    });
  }

  runtimeWindow.ROUGE_FRONT_DOOR_VIEW = {
    render,
  };
})();
