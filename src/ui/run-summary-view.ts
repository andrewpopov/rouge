(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function getLabelFromId(id: string): string {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function buildArchiveDeltaMarkup(
    latestHistoryEntry: RunHistoryEntry | null,
    profileSummary: ProfileSummary,
    renderUtils: RenderUtilsApi,
    common: UiCommonApi,
    appState: AppState
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    if (!latestHistoryEntry) {
      return '<p class="flow-copy">The archive already updated, but no latest history entry could be read for a delta breakdown.</p>';
    }

    const previousArchiveCount = Math.max(0, profileSummary.runHistoryCount - 1);
    const previousGoldTotal = Math.max(0, profileSummary.totalGoldCollected - latestHistoryEntry.goldGained);
    const previousBossTotal = Math.max(0, profileSummary.totalBossesDefeated - latestHistoryEntry.bossesDefeated);
    const previousRunewordTotal = Math.max(0, profileSummary.totalRunewordsForged - latestHistoryEntry.runewordsForged);
    const featureLabels = (latestHistoryEntry.newFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const runewordLabels = (latestHistoryEntry.activeRunewordIds || []).map((runewordId) => {
      return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
    });

    return `
      <div class="feature-grid feature-grid-wide">
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Archive Delta</strong>
            ${buildBadge(`+1 archive`, "cleared")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Archives", `${previousArchiveCount} -> ${profileSummary.runHistoryCount}`)}
            ${buildStat("Gold", `${previousGoldTotal} -> ${profileSummary.totalGoldCollected}`)}
            ${buildStat("Bosses", `${previousBossTotal} -> ${profileSummary.totalBossesDefeated}`)}
            ${buildStat("Runewords", `${previousRunewordTotal} -> ${profileSummary.totalRunewordsForged}`)}
          </div>
          ${buildStringList(
            [
              `This run added ${latestHistoryEntry.goldGained} gold, ${latestHistoryEntry.bossesDefeated} boss kill${latestHistoryEntry.bossesDefeated === 1 ? "" : "s"}, and ${latestHistoryEntry.runewordsForged} forged runeword${latestHistoryEntry.runewordsForged === 1 ? "" : "s"}.`,
              `Progression delta: +${latestHistoryEntry.skillPointsEarned} skill, +${latestHistoryEntry.classPointsEarned} class, +${latestHistoryEntry.attributePointsEarned} attribute, +${latestHistoryEntry.trainingRanksGained} training.`,
              `Feature gates opened: ${getPreviewLabel(featureLabels, "none this run")}.`,
              `Archived runeword posture: ${getPreviewLabel(runewordLabels, "none forged")}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
        <article class="feature-card">
          <strong>Hall Re-entry Guide</strong>
          <p>${escapeHtml("The front door now receives this archive delta immediately. Use it to decide whether to review history, retarget account focus, or step straight into another draft.")}</p>
          ${buildStringList(
            [
              "Return to the account hall and check the archive desk plus archive signal board for the newly logged expedition.",
              "Review unlock galleries, vault logistics, and capstone watch before you lock in the next class draft.",
              "Review account-tree focus if this run changed the archive, economy, or mastery pressure you want next.",
              "Draft a new class or resume a parked route only after you understand what this archive entry just changed.",
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
      </div>
    `;
  }

  function buildHallHandoffMarkup(
    appState: AppState,
    services: UiRenderServices,
    accountSummary: ProfileAccountSummary,
    latestHistoryEntry: RunHistoryEntry | null
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
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
    const latestFeatureLabels = (latestHistoryEntry?.newFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const completedPlannedRunewordLabels = (latestHistoryEntry?.completedPlannedRunewordIds || []).map((runewordId) => {
      return appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId);
    });
    const plannedWeaponLabel = planning.weaponRunewordId
      ? appState.content.runewordCatalog?.[planning.weaponRunewordId]?.name || getLabelFromId(planning.weaponRunewordId)
      : "Unset";
    const plannedArmorLabel = planning.armorRunewordId
      ? appState.content.runewordCatalog?.[planning.armorRunewordId]?.name || getLabelFromId(planning.armorRunewordId)
      : "Unset";
    const plannedRunewordLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || getLabelFromId(runewordId));
    const planningOverview = planning.overview;
    let convergenceTone = "locked";
    if (review.availableConvergenceCount > 0) {
      convergenceTone = "available";
    } else if (review.unlockedConvergenceCount >= review.convergenceCount && review.convergenceCount > 0) {
      convergenceTone = "cleared";
    }

    let nextHallLabel = "Enter Character Hall";
    let nextHallTone = "cleared";
    let nextHallCopy = "No urgent hall-side pressure outranks a fresh draft. Review the latest archive if you want context, then recruit again.";
    let nextHallLines = [
      `Focused tree signal: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
      `Archives now logged: ${profileSummary.runHistoryCount}.`,
    ];

    if (latestFeatureLabels.length > 0) {
      nextHallLabel = "Review Unlock Galleries";
      nextHallTone = "available";
      nextHallCopy = "This run changed account state. Read the unlock and archive wings before you commit to the next route.";
      nextHallLines = [
        `Feature burst from this run: ${getPreviewLabel(latestFeatureLabels, "none")}.`,
        `Latest archive now points back into ${accountSummary.focusedTreeTitle || "the current focused tree"}.`,
        planning.plannedRunewordCount > 0
          ? `Current charters still matter too: ${getPreviewLabel(plannedRunewordLabels, "none active")}.`
          : "No live runeword charter is competing with the new unlock wave.",
      ];
    } else if (review.availableConvergenceCount > 0) {
      nextHallLabel = "Check Account Tree Review";
      nextHallTone = "available";
      nextHallCopy = "Cross-tree pressure is ready now. Review the progression wing before you start another class.";
      nextHallLines = [
        `Ready convergence lane${review.availableConvergenceCount === 1 ? "" : "s"}: ${review.availableConvergenceCount}.`,
        `Next convergence: ${review.nextConvergenceTitle || "every current convergence is online"}.`,
        nextConvergence ? `Effect waiting there: ${nextConvergence.effectSummary}` : "Review the convergence cards for the exact payoff.",
      ];
    } else if (planning.plannedRunewordCount > 0) {
      nextHallLabel = "Check Vault Logistics";
      nextHallTone = planningOverview.readyCharterCount > 0 || planningOverview.preparedCharterCount > 0 ? "available" : "locked";
      nextHallCopy = planningOverview.nextActionSummary || "The run is archived, but charter pressure is still live. Compare the vault against your pinned runeword targets before you draft again.";
      nextHallLines = [
        `Pinned charters: ${getPreviewLabel(plannedRunewordLabels, "none active")}.`,
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        `This run completed: ${getPreviewLabel(completedPlannedRunewordLabels, "no planned target completed this run")}.`,
      ];
    }

    return `
      <section class="panel flow-panel">
        <div class="panel-head">
          <h2>Hall Handoff</h2>
          <p>The expedition is over, but the next account decision is not. These cards compare convergence, charter, and archive pressure before the hall takes over again.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Convergence Carry-Through</strong>
              ${buildBadge(review.nextConvergenceTitle || "No Pending Lane", convergenceTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Ready", review.availableConvergenceCount)}
              ${buildStat("Blocked", review.blockedConvergenceCount)}
              ${buildStat("Unlocked", review.unlockedConvergenceCount)}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
            </div>
            ${buildStringList(
              [
                `Focused tree momentum: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
                `Next capstone: ${review.nextCapstoneTitle || "every current capstone is already online"}.`,
                nextConvergence
                  ? `Missing links: ${getPreviewLabel(nextConvergence.missingFeatureTitles, "none; all required links are already online")}.`
                  : "No blocked convergence details remain because the authored lanes are already online.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Charter Carry-Through</strong>
              ${buildBadge(planning.plannedRunewordCount > 0 ? `${planning.plannedRunewordCount} live` : "Quiet", planning.plannedRunewordCount > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Fulfilled", planning.fulfilledPlanCount)}
              ${buildStat("Missed", planning.unfulfilledPlanCount)}
            </div>
            ${buildStringList(
              [
                `Pinned targets: ${getPreviewLabel(plannedRunewordLabels, "no active charter")}.`,
                `This archive entry completed: ${getPreviewLabel(completedPlannedRunewordLabels, "no planned target completed this run")}.`,
                `Next charter push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Hall Decision</strong>
              ${buildBadge(nextHallLabel, nextHallTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Archives", profileSummary.runHistoryCount)}
              ${buildStat("Features", latestFeatureLabels.length)}
              ${buildStat("Convergences", `${review.unlockedConvergenceCount}/${review.convergenceCount}`)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
            </div>
            <p>${escapeHtml(nextHallCopy)}</p>
            ${buildStringList(nextHallLines, "log-list reward-list ledger-list")}
          </article>
        </div>
      </section>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
    const run = appState.run;
    const victory = appState.phase === services.appEngine.PHASES.RUN_COMPLETE;
    const latestHistoryEntry = appState.profile?.runHistory?.[0] || null;
    const profileSummary = services.appEngine.getProfileSummary(appState);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Unset";
    const unlockedBossLabels = (appState.profile?.meta?.unlocks?.bossIds || []).map((bossId) => {
      return getLabelFromId(appState.content.enemyCatalog?.[bossId]?.name || bossId);
    });
    const unlockedRunewordLabels = (appState.profile?.meta?.unlocks?.runewordIds || []).map(
      (runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId
    );
    const completedTutorialLabels = (appState.profile?.meta?.tutorials?.completedIds || []).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const townFeatureLabels = (appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));

    services.renderUtils.buildShell(root, {
      eyebrow: victory ? "Run Complete" : "Run Failed",
      title: victory ? "Expedition Archived In Glory" : "Expedition Logged As Fallen",
      copy: victory
        ? "The shell now carries the player all the way from front door to final archive. This review closes the run, updates profile history, and hands the player back to the account hall."
        : "Failure now resolves through a proper run-end review. The archive updates here, then the player returns to the account hall with the outcome clearly recorded.",
      body: `
        ${common.renderRunStatus(run, victory ? "Victory" : "Defeat", services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Archive Update</h2>
            <p>The run has already been recorded back into profile history. This screen ties the expedition result directly to the account hall that will receive you next.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Outcome</strong>
                ${buildBadge(victory ? "Completed" : "Failed", victory ? "cleared" : "locked")}
              </div>
              <p>${escapeHtml(victory ? `Baal is down and ${run.className} leaves the run archive as a completed expedition.` : `${run.className} fell before the act route closed, and the archive reflects the failed expedition.`)}</p>
            </article>
            <article class="feature-card">
              <strong>Front Door Impact</strong>
              <p>${escapeHtml(`${appState.profile.runHistory.length} archived run${appState.profile.runHistory.length === 1 ? "" : "s"} now live in the account hall. Preferred class signal currently points at ${preferredClassName}.`)}</p>
            </article>
            <article class="feature-card">
              <strong>Latest Archive Entry</strong>
              <p>${escapeHtml(latestHistoryEntry ? `${latestHistoryEntry.className} · ${latestHistoryEntry.outcome} · level ${latestHistoryEntry.level}` : "No archive entry could be read.")}</p>
            </article>
            <article class="feature-card">
              <strong>Party At Exit</strong>
              <p>${escapeHtml(`${run.hero.currentLife}/${run.hero.maxLife} hero Life, ${run.mercenary.currentLife}/${run.mercenary.maxLife} mercenary Life, ${run.belt.current}/${run.belt.max} belt.`)}</p>
            </article>
          </div>
          <div class="panel-head panel-head-compact">
            <h3>Archive Delta Review</h3>
            <p>These lines answer the key run-end question directly: what changed on the account because this expedition was logged?</p>
          </div>
          ${buildArchiveDeltaMarkup(latestHistoryEntry, profileSummary, services.renderUtils, common, appState)}
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Account Progress</h2>
            <p>The archived run has already updated account unlocks, tutorials, and lifetime progression totals. This screen now shows the same account layer the front door will read next.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <strong>Lifetime Totals</strong>
              <div class="entity-stat-grid">
                ${buildStat("Highest Lv", profileSummary.highestLevel)}
                ${buildStat("Highest Act", profileSummary.highestActCleared)}
                ${buildStat("Bosses", profileSummary.totalBossesDefeated)}
                ${buildStat("Gold", profileSummary.totalGoldCollected)}
              </div>
              <p>${escapeHtml(`Runewords forged across the account: ${profileSummary.totalRunewordsForged}. Classes played: ${profileSummary.classesPlayedCount}.`)}</p>
            </article>
            <article class="feature-card">
              <strong>Unlock Carry-Through</strong>
              <div class="entity-stat-grid">
                ${buildStat("Classes", profileSummary.unlockedClassCount)}
                ${buildStat("Bosses", profileSummary.unlockedBossCount)}
                ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
                ${buildStat("Town Hooks", profileSummary.townFeatureCount)}
              </div>
              ${buildStringList(
                [
                  `Boss trophies online: ${getPreviewLabel(unlockedBossLabels, "none yet")}.`,
                  `Runewords online: ${getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                  `Town systems online: ${getPreviewLabel(townFeatureLabels, "none yet")}.`,
                ],
                "log-list reward-list ledger-list"
              )}
            </article>
            <article class="feature-card">
              <strong>Tutorial Carry-Through</strong>
              <div class="entity-stat-grid">
                ${buildStat("Seen", profileSummary.seenTutorialCount)}
                ${buildStat("Done", profileSummary.completedTutorialCount)}
                ${buildStat("Preferred", preferredClassName)}
                ${buildStat("Archives", profileSummary.runHistoryCount)}
              </div>
              <p>${escapeHtml(`Completed guidance now tracked on the account: ${getPreviewLabel(completedTutorialLabels, "none yet")}.`)}</p>
            </article>
          </div>
          <div class="panel-head panel-head-compact">
            <h3>Account Tree Carry-Through</h3>
            <p>The archive update has already recomputed account-tree milestones. Review or retarget the next focus here before you step back into the hall.</p>
          </div>
          ${common.buildAccountTreeReviewMarkup(accountSummary, services.renderUtils)}
        </section>

        ${buildHallHandoffMarkup(appState, services, accountSummary, latestHistoryEntry)}
        ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
          copy:
            "Run-end review now hands the hall one stable account-meta board too, so archive pressure, charter staging, mastery focus, and convergence readiness stay visible after the expedition closes.",
        })}

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Final Ledger</h2>
            <p>These are expedition-owned values. They are shown here so the player can understand exactly what the archive and profile review are summarizing back at the front door.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <strong>Encounters Cleared</strong>
              <p>${escapeHtml(run.summary.encountersCleared)}</p>
            </article>
            <article class="feature-card">
              <strong>Zones Cleared</strong>
              <p>${escapeHtml(run.summary.zonesCleared)}</p>
            </article>
            <article class="feature-card">
              <strong>Acts Cleared</strong>
              <p>${escapeHtml(run.summary.actsCleared)}</p>
            </article>
            <article class="feature-card">
              <strong>Gold Gained</strong>
              <p>${escapeHtml(run.summary.goldGained)}</p>
            </article>
            <article class="feature-card">
              <strong>XP Gained</strong>
              <p>${escapeHtml(run.summary.xpGained)}</p>
            </article>
            <article class="feature-card">
              <strong>Levels Gained</strong>
              <p>${escapeHtml(run.summary.levelsGained)}</p>
            </article>
            <article class="feature-card">
              <strong>Skill Points</strong>
              <p>${escapeHtml(run.summary.skillPointsEarned)}</p>
            </article>
            <article class="feature-card">
              <strong>Class Points</strong>
              <p>${escapeHtml(run.summary.classPointsEarned)}</p>
            </article>
            <article class="feature-card">
              <strong>Attribute Points</strong>
              <p>${escapeHtml(run.summary.attributePointsEarned)}</p>
            </article>
            <article class="feature-card">
              <strong>Training Ranks</strong>
              <p>${escapeHtml(run.summary.trainingRanksGained)}</p>
            </article>
            <article class="feature-card">
              <strong>Bosses Defeated</strong>
              <p>${escapeHtml(run.summary.bossesDefeated)}</p>
            </article>
            <article class="feature-card">
              <strong>Runewords Forged</strong>
              <p>${escapeHtml(run.summary.runewordsForged)}</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="primary-btn" data-action="return-front-door">Return To Account Hall</button>
          </div>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_RUN_SUMMARY_VIEW = {
    render,
  };
})();
