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
              "Return to the account hall and check the archive desk for the newly logged expedition.",
              "Review account-tree focus if this run changed the archive, economy, or mastery pressure you want next.",
              "Draft a new class or resume a parked route only after you understand what this archive entry just changed.",
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
      </div>
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
