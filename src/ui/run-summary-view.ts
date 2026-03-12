(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat } = services.renderUtils;
    const run = appState.run;
    const victory = appState.phase === services.appEngine.PHASES.RUN_COMPLETE;
    const profileSummary = services.appEngine.getProfileSummary(appState);

    const outcomeBadge = victory
      ? buildBadge("Victory", "cleared")
      : buildBadge("Defeated", "locked");

    services.renderUtils.buildShell(root, {
      eyebrow: victory ? "Victory" : "Defeat",
      title: victory ? `${run.className} Conquers The World` : `${run.className} Has Fallen`,
      copy: victory
        ? `All acts cleared. ${run.className} returns to the hall in glory.`
        : `The expedition ends at ${run.actTitle}. The archive records the attempt.`,
      body: `
        ${common.renderRunStatus(run, victory ? "Victory" : "Defeat", services.renderUtils)}

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Expedition Summary</h2>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Outcome</strong>
                ${outcomeBadge}
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Acts", run.summary.actsCleared)}
                ${buildStat("Zones", run.summary.zonesCleared)}
                ${buildStat("Encounters", run.summary.encountersCleared)}
                ${buildStat("Bosses", run.summary.bossesDefeated)}
              </div>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Hero</strong>
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Class", run.className)}
                ${buildStat("Level", run.level)}
                ${buildStat("XP Gained", run.summary.xpGained)}
                ${buildStat("Levels Gained", run.summary.levelsGained)}
              </div>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Loot</strong>
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Gold", run.summary.goldGained)}
                ${buildStat("Runewords", run.summary.runewordsForged)}
                ${buildStat("Skill Pts", run.summary.skillPointsEarned)}
                ${buildStat("Class Pts", run.summary.classPointsEarned)}
              </div>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Training</strong>
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Attr Pts", run.summary.attributePointsEarned)}
                ${buildStat("Training Ranks", run.summary.trainingRanksGained)}
                ${buildStat("Deck Size", run.deck.length)}
                ${buildStat("Final Gold", run.gold)}
              </div>
            </article>
          </div>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Account Records</h2>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Archive</strong>
                ${buildBadge(`Run #${profileSummary.runHistoryCount}`, "cleared")}
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Total Runs", profileSummary.runHistoryCount)}
                ${buildStat("Highest Lv", profileSummary.highestLevel)}
                ${buildStat("Highest Act", profileSummary.highestActCleared)}
                ${buildStat("Total Gold", profileSummary.totalGoldCollected)}
              </div>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Unlocks</strong>
              </div>
              <div class="entity-stat-grid">
                ${buildStat("Classes", profileSummary.unlockedClassCount)}
                ${buildStat("Bosses", profileSummary.unlockedBossCount)}
                ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
                ${buildStat("Town Features", profileSummary.townFeatureCount)}
              </div>
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
