(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;
  const { RUN_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;

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
    if (outcome === RUN_OUTCOME.COMPLETED) {
      return "cleared";
    }
    if (outcome === RUN_OUTCOME.FAILED) {
      return "locked";
    }
    return "available";
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

  function getRunewordLabel(appState: AppState, runewordId: string): string {
    return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
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

  function buildHallNavigatorMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string {
    const { buildBadge, buildStat, escapeHtml } = services.renderUtils;
    const resumeGuidance = savedRunSummary
      ? runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW.getSavedRunPhaseGuidance(savedRunSummary, services.appEngine)
      : null;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const settings = accountSummary.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
    };
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
    const unlocks = appState.profile?.meta?.unlocks || {
      classIds: [],
      bossIds: [],
      runewordIds: [],
      townFeatureIds: [],
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
              ${buildBadge(savedRunSummary ? resumeGuidance?.expeditionLabel || "Saved Expedition" : "Fresh Draft", savedRunSummary ? getPhaseTone(savedRunSummary, services.appEngine) : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Snapshot", savedRunSummary ? savedRunSummary.phaseLabel : "No Save")}
              ${buildStat("Class", savedRunSummary ? savedRunSummary.className : "Open")}
              ${buildStat("Act", savedRunSummary ? savedRunSummary.actTitle : "Start")}
              ${buildStat("Next", savedRunSummary ? resumeGuidance?.nextSurfaceLabel || "Resume" : "Draft")}
            </div>
            <p>${escapeHtml(savedRunSummary ? `${resumeGuidance?.summaryLine || `Resume the parked ${savedRunSummary.className} expedition without losing route momentum.`}` : "Open character draft and move directly into the town-prep shell.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Unlock Galleries</strong>
              ${buildBadge(`${unlocks.classIds.length + unlocks.bossIds.length + unlocks.runewordIds.length} tracked`, unlocks.classIds.length > 0 || unlocks.bossIds.length > 0 || unlocks.runewordIds.length > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Classes", unlocks.classIds.length)}
              ${buildStat("Bosses", unlocks.bossIds.length)}
              ${buildStat("Runewords", unlocks.runewordIds.length)}
              ${buildStat("Recent", accountSummary.archive.recentFeatureIds.length)}
            </div>
            <p>${escapeHtml("Review the class roster, trophy gallery, runeword codex, and newest account-system bursts without digging through archive entries first.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Vault Logistics</strong>
              ${buildBadge(`${stashSummary.entryCount} stored`, stashSummary.entryCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Entries", stashSummary.entryCount)}
              ${buildStat("Gear", stashSummary.equipmentCount)}
              ${buildStat("Runes", stashSummary.runeCount)}
              ${buildStat("Socket Bases", stashSummary.socketReadyEquipmentCount)}
            </div>
            <p>${escapeHtml("The vault now has its own logistics pass so stash pressure, socket-ready gear, and charter preparation are readable before you draft another run.")}</p>
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
            <p>${escapeHtml("The stash preview, archive review desk, and new archive signal board now live together as one chronicle wing.")}</p>
          </article>
          <article class="feature-card hall-link-card">
            <div class="entity-name-row">
              <strong>Capstone Watch</strong>
              ${buildBadge(review.nextCapstoneTitle || "No Capstone", getCapstoneReviewTone(review))}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Total", review.capstoneCount)}
              ${buildStat("Ready", review.readyCapstoneCount)}
              ${buildStat("Unlocked", review.unlockedCapstoneCount)}
              ${buildStat("Blocked", review.blockedCapstoneCount)}
            </div>
            <p>${escapeHtml("Late account pressure now has dedicated hall space, so the next capstone is visible before you dive into the fuller tree review.")}</p>
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
          <a class="neutral-btn" href="#hall-unlocks">Unlock Galleries</a>
          <a class="neutral-btn" href="#hall-vault">Vault Logistics</a>
          <a class="neutral-btn" href="#hall-progression">Progression Gallery</a>
          <a class="neutral-btn" href="#hall-capstones">Capstone Watch</a>
          <a class="neutral-btn" href="#hall-archive">Vault And Archive</a>
          <a class="neutral-btn" href="#hall-controls">Control Annex</a>
          <a class="neutral-btn" href="#hall-guided">Guided Start</a>
        </div>
      </section>
    `;
  }

  function buildHallDecisionSupportMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
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
      planningCompletionCount: 0,
      planningMissCount: 0,
      recentFeatureIds: [],
      recentPlannedRunewordIds: [],
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const planningOverview = planning.overview;
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
    const convergences = Array.isArray(accountSummary.convergences) ? accountSummary.convergences : [];
    const nextConvergence =
      convergences.find((convergence) => convergence.id === review.nextConvergenceId) ||
      convergences.find((convergence) => !convergence.unlocked) ||
      null;
    const recentFeatureLabels = (archiveSummary.recentFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archiveSummary.recentPlannedRunewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));
    const plannedRunewordLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => getRunewordLabel(appState, runewordId));
    let convergenceTone = "locked";
    if (review.availableConvergenceCount > 0) {
      convergenceTone = "available";
    } else if (review.unlockedConvergenceCount >= review.convergenceCount && review.convergenceCount > 0) {
      convergenceTone = "cleared";
    }

    let nextMoveLabel = "Start New Draft";
    let nextMoveTone = "cleared";
    let nextMoveCopy = "No parked route or urgent hall pressure is blocking a fresh class draft.";
    let nextMoveLines = [
      `Preferred class signal: ${profileSummary.preferredClassId ? getClassName(appState, profileSummary.preferredClassId) : "no preferred class pinned yet"}.`,
      "Enter the character hall only after the current archive and progression signals read the way you want.",
    ];

    if (savedRunSummary) {
      nextMoveLabel = resumeGuidance?.decisionLabel || "Resume Parked Expedition";
      nextMoveTone = getPhaseTone(savedRunSummary, services.appEngine);
      nextMoveCopy = `A ${savedRunSummary.className} expedition is parked at ${savedRunSummary.phaseLabel}. ${resumeGuidance?.summaryLine || "Resume it if route momentum matters more than retargeting the account."}`;
      nextMoveLines = [
        `Next shell: ${resumeGuidance?.nextSurfaceLabel || savedRunSummary.phaseLabel}. Resume focus: ${resumeGuidance?.focusLabel || "Expedition review"}.`,
        `Parked route: ${savedRunSummary.actTitle}, ${savedRunSummary.zonesCleared} zones cleared, next boss ${savedRunSummary.bossName}.`,
        review.availableConvergenceCount > 0
          ? `${review.availableConvergenceCount} convergence lane${review.availableConvergenceCount === 1 ? "" : "s"} are also ready in the hall.`
          : `No ready convergence is competing with the live route right now; next lane is ${review.nextConvergenceTitle || "already online"}.`,
        planning.plannedRunewordCount > 0
          ? `If you archive or finish the run first, re-check Vault Logistics for ${common.getPreviewLabel(plannedRunewordLabels, "current charters")}.`
          : "No charter target is currently asking you to abandon the parked route for vault work.",
      ];
    } else if (review.availableConvergenceCount > 0) {
      nextMoveLabel = "Review Convergence Ready";
      nextMoveTone = "available";
      nextMoveCopy = `${review.availableConvergenceCount} cross-tree convergence lane${review.availableConvergenceCount === 1 ? "" : "s"} can move now. Review the progression wing before you open a new run.`;
      nextMoveLines = [
        `Next convergence: ${review.nextConvergenceTitle || "see the progression gallery"}.`,
        nextConvergence ? `Effect waiting behind it: ${nextConvergence.effectSummary}` : "Review the convergence cards for the exact reward effect.",
        planning.plannedRunewordCount > 0
          ? `Charter pressure is still live too: ${common.getPreviewLabel(plannedRunewordLabels, "no charter names available")}.`
          : "No active runeword charter is competing with that convergence review.",
      ];
    } else if (planning.plannedRunewordCount > 0) {
      nextMoveLabel = "Audit Charter Pressure";
      nextMoveTone = planningOverview.readyCharterCount > 0 || planningOverview.preparedCharterCount > 0 ? "available" : "locked";
      nextMoveCopy = planningOverview.nextActionSummary || "Charters are pinned, but the vault is still short on base or rune depth. Review logistics before you draft.";
      nextMoveLines = [
        `Pinned targets: ${common.getPreviewLabel(plannedRunewordLabels, "no current charter labels")}.`,
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        `Vault readiness: ${planningOverview.readyCharterCount} ready, ${planningOverview.preparedCharterCount} prepared, ${planningOverview.missingBaseCharterCount} missing base.`,
        `Archive charter record: ${planning.fulfilledPlanCount} cleared, ${planning.unfulfilledPlanCount} missed.`,
      ];
    } else if (archiveSummary.entryCount > 0) {
      nextMoveLabel = archiveSummary.recentFeatureIds.length > 0 ? "Review What Changed" : "Read Archive Pulse";
      nextMoveTone = archiveSummary.recentFeatureIds.length > 0 ? "available" : "cleared";
      nextMoveCopy =
        archiveSummary.recentFeatureIds.length > 0
          ? "The latest archived expedition changed account state. Review the archive and unlock wings before you draft again."
          : "No fresh feature burst landed, but the archive pulse can still steer the next class or focus choice.";
      nextMoveLines = [
        `Latest expedition: ${archiveSummary.latestClassName || "unknown class"} (${archiveSummary.latestOutcome || "awaiting outcome"}).`,
        `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "none from the latest archive")}.`,
        `Latest favored tree: ${archiveSummary.favoredTreeName || accountSummary.focusedTreeTitle || "no favored tree archived yet"}.`,
      ];
    }

    return `
      <section class="panel flow-panel" id="hall-decision-support">
        <div class="panel-head">
          <h2>Decision Support Desk</h2>
          <p>The hall now answers the account-level questions directly: what changed, what is blocked, and what the cleanest next move is before you resume or draft.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>What Changed</strong>
              ${buildBadge(
                archiveSummary.latestClassName || "No Archive",
                archiveSummary.entryCount > 0 ? getRunOutcomeTone(archiveSummary.latestOutcome || RUN_OUTCOME.ABANDONED) : "locked"
              )}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Outcome", archiveSummary.latestOutcome ? getLabelFromId(archiveSummary.latestOutcome) : "Awaiting")}
              ${buildStat("Recent Features", archiveSummary.recentFeatureIds.length)}
              ${buildStat("Charter Echoes", archiveSummary.recentPlannedRunewordIds.length)}
              ${buildStat("Last Logged", archiveSummary.latestCompletedAt ? formatTimestamp(archiveSummary.latestCompletedAt, true) : "Awaiting")}
            </div>
            ${buildStringList(
              [
                `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "no new account features")}.`,
                `Recent charter carry-through: ${common.getPreviewLabel(recentPlannedRunewordLabels, "no charter targets echoed into the archive")}.`,
                `Archive spread now reads ${archiveSummary.completedCount} cleared, ${archiveSummary.failedCount} failed, ${archiveSummary.abandonedCount} abandoned.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Convergence Pressure</strong>
              ${buildBadge(review.nextConvergenceTitle || "No Pending Lane", convergenceTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Ready", review.availableConvergenceCount)}
              ${buildStat("Blocked", review.blockedConvergenceCount)}
              ${buildStat("Unlocked", review.unlockedConvergenceCount)}
              ${buildStat("Missing", nextConvergence?.missingFeatureIds.length || 0)}
            </div>
            ${buildStringList(
              [
                `Focused tree momentum: ${accountSummary.focusedTreeTitle || "no active tree focus"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
                `Next convergence: ${review.nextConvergenceTitle || "every current convergence is already online"}.`,
                nextConvergence
                  ? `Missing links: ${common.getPreviewLabel(nextConvergence.missingFeatureTitles, "none; all links are already in place")}.`
                  : "No blocked convergence details remain because the current authored lanes are already online.",
                nextConvergence ? `Effect: ${nextConvergence.effectSummary}` : "Review the progression gallery for the full cross-tree ledger.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Focus And Charter Pressure</strong>
              ${buildBadge(accountSummary.focusedTreeTitle || "Unset", accountSummary.focusedTreeId ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Focused", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Next Milestone", accountSummary.nextMilestoneTitle || "Cleared")}
              ${buildStat("Charters", planning.plannedRunewordCount)}
              ${buildStat("Missed", planning.unfulfilledPlanCount)}
            </div>
            ${buildStringList(
              [
                `Pinned runewords: ${common.getPreviewLabel(plannedRunewordLabels, "no active runeword charter")}.`,
                `Capstone pressure: ${review.nextCapstoneTitle || "every current capstone is online"}.`,
                `Vault support: ${stashSummary.socketReadyEquipmentCount} socket-ready bases, ${stashSummary.runeCount} runes, ${stashSummary.runewordEquipmentCount} active runeword base${stashSummary.runewordEquipmentCount === 1 ? "" : "s"} in storage.`,
                `Archive charter record: ${planning.fulfilledPlanCount} fulfilled, ${planning.unfulfilledPlanCount} missed across ${archiveSummary.planningArchiveCount} tracked planning run${archiveSummary.planningArchiveCount === 1 ? "" : "s"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Move Board</strong>
              ${buildBadge(nextMoveLabel, nextMoveTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Snapshot", savedRunSummary ? savedRunSummary.phaseLabel : "Open")}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Convergences", `${review.unlockedConvergenceCount}/${review.convergenceCount}`)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
            </div>
            <p>${escapeHtml(nextMoveCopy)}</p>
            ${buildStringList(nextMoveLines, "log-list reward-list ledger-list")}
          </article>
        </div>
      </section>
    `;
  }

  runtimeWindow.__ROUGE_EXPEDITION_DECISION = {
    buildHallNavigatorMarkup,
    buildHallDecisionSupportMarkup,
  };
})();
