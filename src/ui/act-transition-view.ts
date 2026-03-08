(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];

    services.renderUtils.buildShell(root, {
      eyebrow: "Act Transition",
      title: `${run.actTitle} Cleared`,
      copy:
        "The shell now treats act completion as a readable wrapper. You finish the act, review the progress, then move cleanly into the next town instead of abruptly dropping back into the route loop.",
      body: `
        ${common.renderRunStatus(run, "Act Transition", services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Caravan Crossing</h2>
            <p>The act boss is down. The party regroups in town before the next route web opens, keeping the full shell continuous across acts.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Cleared Boss</strong>
                ${buildBadge("Defeated", "cleared")}
              </div>
              <p>${escapeHtml(run.bossName)}</p>
            </article>
            <article class="feature-card">
              <strong>Next Town</strong>
              <p>${escapeHtml(nextAct?.town || "End Of Run")}</p>
            </article>
            <article class="feature-card">
              <strong>Acts Cleared</strong>
              <div class="entity-stat-grid">
                ${buildStat("Acts", run.summary.actsCleared)}
                ${buildStat("Bosses", run.summary.bossesDefeated)}
                ${buildStat("Zones", run.summary.zonesCleared)}
                ${buildStat("Encounters", run.summary.encountersCleared)}
              </div>
            </article>
            <article class="feature-card">
              <strong>Carry Forward</strong>
              <p>${escapeHtml(`${run.hero.currentLife}/${run.hero.maxLife} hero Life, ${run.belt.current}/${run.belt.max} belt charges, ${run.gold} gold, and the full loadout all continue into the next town.`)}</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="primary-btn" data-action="continue-act-transition">Enter ${escapeHtml(nextAct?.town || "Final Screen")}</button>
          </div>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_ACT_TRANSITION_VIEW = {
    render,
  };
})();
