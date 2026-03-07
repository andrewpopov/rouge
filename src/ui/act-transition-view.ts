(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];

    services.renderUtils.buildShell(root, {
      eyebrow: "Act Transition",
      title: `${run.actTitle} Cleared`,
      copy:
        "The high-frequency world_map to encounter to reward loop now hands off into the next act wrapper instead of ending the run.",
      body: `
        ${common.renderRunStatus(run, "Act Transition", services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Next Destination</h2>
            <p>The party restores in town before the next act route opens.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <strong>Cleared Boss</strong>
              <p>${escapeHtml(run.bossName)}</p>
            </article>
            <article class="feature-card">
              <strong>Next Town</strong>
              <p>${escapeHtml(nextAct?.town || "End Of Run")}</p>
            </article>
            <article class="feature-card">
              <strong>Acts Cleared</strong>
              <p>${escapeHtml(run.summary.actsCleared)}</p>
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
