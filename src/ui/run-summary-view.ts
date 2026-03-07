(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const victory = appState.phase === services.appEngine.PHASES.RUN_COMPLETE;

    services.renderUtils.buildShell(root, {
      eyebrow: victory ? "Run Complete" : "Run Failed",
      title: victory ? "Baal Defeated" : "Run Ended",
      copy:
        victory
          ? "The full multi-act shell is in place. The repeated world-map to encounter to reward loop now carries the party all the way through the final act."
          : "The hero was defeated before the act route closed. The run contract resets here, not inside the combat screen.",
      body: `
        ${common.renderRunStatus(run, victory ? "Victory" : "Defeat", services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Run Summary</h2>
            <p>These values are owned by the run layer, not the encounter layer.</p>
          </div>
          <div class="feature-grid">
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
            <article class="feature-card">
              <strong>Party State</strong>
              <p>${escapeHtml(`${run.hero.currentLife}/${run.hero.maxLife} hero life, ${run.belt.current}/${run.belt.max} belt`)}</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="primary-btn" data-action="return-front-door">Return To Front Door</button>
          </div>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_RUN_SUMMARY_VIEW = {
    render,
  };
})();
