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

  function getLabelFromId(id: string): string {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
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

  function getSavedRunPhaseGuidance(savedRunSummary: SavedRunSummary, appEngine: AppEngineApi): SavedRunPhaseGuidance {
    switch (savedRunSummary.phase) {
      case appEngine.PHASES.SAFE_ZONE:
        return {
          expeditionLabel: "Town Resume",
          decisionLabel: "Resume Town Prep",
          nextSurfaceLabel: "Safe Zone",
          focusLabel: "Recovery And Departure",
          summaryLine: "Town recovery, loadout review, stash pressure, and departure prep are the first read on return.",
          checklistLines: [
            "Next shell: Safe Zone. Recovery, vendor, stash, and spend boards are live first.",
            `The next departure still points toward ${savedRunSummary.bossName}.`,
            "Leave town only after the prep comparison and departure boards read clean.",
          ],
        };
      case appEngine.PHASES.WORLD_MAP:
        return {
          expeditionLabel: "Route Resume",
          decisionLabel: "Resume Route Board",
          nextSurfaceLabel: "World Map",
          focusLabel: "Route Decision",
          summaryLine: "Route intel, blocked nodes, and the next zone choice are the first read on return.",
          checklistLines: [
            "Next shell: World Map. Route intel, consequence lanes, and boss pressure are live first.",
            `The next click is a zone pick or a return to ${savedRunSummary.safeZoneName}.`,
            `Resume only if you want to keep pushing toward ${savedRunSummary.bossName} right away.`,
          ],
        };
      case appEngine.PHASES.REWARD:
        return {
          expeditionLabel: "Reward Pending",
          decisionLabel: "Resolve Pending Reward",
          nextSurfaceLabel: "Reward",
          focusLabel: "Reward Claim",
          summaryLine: "A reward claim is parked — choose one before the route moves again.",
          checklistLines: [
            "Next shell: Reward. Pick one reward before the expedition advances.",
            "The next decision is a reward pick, not a zone pick or town service.",
            "Deck, loadout, progression, and supply changes can land immediately from this claim.",
          ],
        };
      case appEngine.PHASES.ACT_TRANSITION:
        return {
          expeditionLabel: "Act Handoff",
          decisionLabel: "Review Act Handoff",
          nextSurfaceLabel: "Act Transition",
          focusLabel: "Carry-Forward Review",
          summaryLine: "Act delta review is parked, then the next town opens with the same expedition state.",
          checklistLines: [
            "Next shell: Act Transition. Review carry-forward state before the next town opens.",
            "The next click is Continue Act Transition, not a route pick.",
            "Act pressure is already closed on this checkpoint; the shell is staging the town handoff.",
          ],
        };
      case appEngine.PHASES.RUN_COMPLETE:
        return {
          expeditionLabel: "Victory Review",
          decisionLabel: "Review Victory Summary",
          nextSurfaceLabel: "Run Summary",
          focusLabel: "Archive Delta",
          summaryLine: "The victory handoff is parked, so review the archive delta before drafting again.",
          checklistLines: [
            "Next shell: Run Summary. The expedition is already over; only archive review remains.",
            "Review the hall handoff before you start another draft.",
            "This checkpoint exists to preserve the account-facing summary, not route momentum.",
          ],
        };
      case appEngine.PHASES.RUN_FAILED:
        return {
          expeditionLabel: "Failure Review",
          decisionLabel: "Review Fallen Summary",
          nextSurfaceLabel: "Run Summary",
          focusLabel: "Archive And Return",
          summaryLine: "The fallen-run handoff is parked, so read the loss review before drafting again.",
          checklistLines: [
            "Next shell: Run Summary. The expedition is already logged as fallen; only archive review remains.",
            "Read the hall handoff before you clear the save or start another draft.",
            "This checkpoint exists to preserve the failure summary, not a live route.",
          ],
        };
      default:
        return {
          expeditionLabel: "Saved Expedition",
          decisionLabel: "Resume Expedition",
          nextSurfaceLabel: savedRunSummary.phaseLabel,
          focusLabel: "Expedition Review",
          summaryLine: "The parked expedition restores directly into the saved shell state.",
          checklistLines: [
            `Next shell: ${savedRunSummary.phaseLabel}.`,
            `The route is still pointed at ${savedRunSummary.bossName}.`,
            "Archive only if you explicitly want to clear the autosave and start a new class draft.",
          ],
        };
    }
  }

  function buildHallNavigatorMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string {
    const { buildBadge, buildStat, escapeHtml } = services.renderUtils;
    const resumeGuidance = savedRunSummary ? getSavedRunPhaseGuidance(savedRunSummary, services.appEngine) : null;
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
    const resumeGuidance = savedRunSummary ? getSavedRunPhaseGuidance(savedRunSummary, services.appEngine) : null;
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
          ? `If you archive or finish the run first, re-check Vault Logistics for ${getPreviewLabel(plannedRunewordLabels, "current charters")}.`
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
          ? `Charter pressure is still live too: ${getPreviewLabel(plannedRunewordLabels, "no charter names available")}.`
          : "No active runeword charter is competing with that convergence review.",
      ];
    } else if (planning.plannedRunewordCount > 0) {
      nextMoveLabel = "Audit Charter Pressure";
      nextMoveTone = planningOverview.readyCharterCount > 0 || planningOverview.preparedCharterCount > 0 ? "available" : "locked";
      nextMoveCopy = planningOverview.nextActionSummary || "Charters are pinned, but the vault is still short on base or rune depth. Review logistics before you draft.";
      nextMoveLines = [
        `Pinned targets: ${getPreviewLabel(plannedRunewordLabels, "no current charter labels")}.`,
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        `Vault readiness: ${planningOverview.readyCharterCount} ready, ${planningOverview.preparedCharterCount} prepared, ${planningOverview.missingBaseCharterCount} missing base.`,
        `Archive charter record: ${planning.fulfilledPlanCount} fulfilled, ${planning.unfulfilledPlanCount} missed.`,
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
        `Recent feature burst: ${getPreviewLabel(recentFeatureLabels, "none from the latest archive")}.`,
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
                archiveSummary.entryCount > 0 ? getRunOutcomeTone(archiveSummary.latestOutcome || "abandoned") : "locked"
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
                `Recent feature burst: ${getPreviewLabel(recentFeatureLabels, "no new account features")}.`,
                `Recent charter carry-through: ${getPreviewLabel(recentPlannedRunewordLabels, "no charter targets echoed into the archive")}.`,
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
                  ? `Missing links: ${getPreviewLabel(nextConvergence.missingFeatureTitles, "none; all links are already in place")}.`
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
                `Pinned runewords: ${getPreviewLabel(plannedRunewordLabels, "no active runeword charter")}.`,
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

  function buildGuidedStartMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null
  ): string {
    const { escapeHtml } = services.renderUtils;
    const resumeGuidance = savedRunSummary ? getSavedRunPhaseGuidance(savedRunSummary, services.appEngine) : null;
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
            <p>${savedRunSummary ? `One autosaved expedition is already waiting in the hall. Next shell: ${resumeGuidance?.nextSurfaceLabel || savedRunSummary.phaseLabel}.` : "Autosave snapshots are written outside combat, so you always re-enter from a readable run-state checkpoint."}</p>
          </article>
        </div>
      </section>
    `;
  }

  function buildSavedRunMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary): string {
    const { buildBadge, buildStat, escapeHtml, buildStringList } = services.renderUtils;
    const resumeGuidance = getSavedRunPhaseGuidance(savedRunSummary, services.appEngine);
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
      : '<button class="danger-link-btn" data-action="prompt-abandon-saved-run">Release This Expedition</button>';

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
            <p class="entity-passive">${escapeHtml(`Saved ${formatTimestamp(savedRunSummary.savedAt)}. Next shell: ${resumeGuidance.nextSurfaceLabel}. ${resumeGuidance.summaryLine}`)}</p>
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
            <p>${escapeHtml(`Boss trophies ${savedRunSummary.bossTrophies}, resolved quests ${savedRunSummary.resolvedQuestOutcomes}, active runewords ${savedRunSummary.activeRunewords}. Resume focus: ${resumeGuidance.focusLabel}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Re-entry Checklist</strong>
            ${buildStringList(resumeGuidance.checklistLines, "log-list reward-list ledger-list")}
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

  function buildExpeditionSectionMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null): string {
    return savedRunSummary ? buildSavedRunMarkup(appState, services, savedRunSummary) : buildFreshStartMarkup(appState, services);
  }

  runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW = {
    getSavedRunPhaseGuidance,
    buildHallNavigatorMarkup,
    buildHallDecisionSupportMarkup,
    buildGuidedStartMarkup,
    buildExpeditionSectionMarkup,
  };
})();
