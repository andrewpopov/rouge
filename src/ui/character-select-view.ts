(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildStat } = services.renderUtils;
    const selectedClass = services.classRegistry.getClassDefinition(appState.seedBundle, appState.ui.selectedClassId);

    services.renderUtils.buildShell(root, {
      eyebrow: "Character Select",
      title: "Choose Class And Mercenary",
      copy:
        "Class choice defines the hero shell for the run. Mercenary choice defines your automatic second combatant. Deck profiles are currently grouped into warrior, hunter, and caster packages.",
      body: `
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Classes</h2>
            <p>The hero shell now comes from the D2 class seed data instead of a fixed Wanderer profile.</p>
          </div>
          <div class="selection-grid">
            ${appState.registries.classes
              .map((entry) => {
                const previewHero = services.classRegistry.createHeroFromClass(appState.content, entry);
                const isSelected = entry.id === appState.ui.selectedClassId;
                return `
                  <button class="entity-card class-card ${isSelected ? "selected" : ""}" data-action="select-class" data-class-id="${escapeHtml(entry.id)}">
                    <div class="entity-name-row">
                      <strong class="entity-name">${escapeHtml(entry.name)}</strong>
                      <span class="entity-role">${escapeHtml(services.classRegistry.getDeckProfileId(appState.content, entry.id))}</span>
                    </div>
                    <div class="entity-stat-grid">
                      ${buildStat("Life", previewHero.maxLife)}
                      ${buildStat("Energy", previewHero.maxEnergy)}
                      ${buildStat("Hand", previewHero.handSize)}
                      ${buildStat("Potion", previewHero.potionHeal)}
                    </div>
                    <p class="entity-passive">Trees: ${escapeHtml(entry.skillTrees.join(", "))}</p>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Mercenaries</h2>
            <p>Mercenaries remain a separate run contract. They should scale and diversify later without living inside the deck layer.</p>
          </div>
          <div class="selection-grid selection-grid-mercs">
            ${appState.registries.mercenaries
              .map((mercenary) => {
                const isSelected = mercenary.id === appState.ui.selectedMercenaryId;
                return `
                  <button class="entity-card ${isSelected ? "selected" : ""}" data-action="select-mercenary" data-mercenary-id="${escapeHtml(mercenary.id)}">
                    <div class="entity-name-row">
                      <strong class="entity-name">${escapeHtml(mercenary.name)}</strong>
                      <span class="entity-role">${escapeHtml(mercenary.role)}</span>
                    </div>
                    <div class="entity-stat-grid">
                      ${buildStat("Life", mercenary.maxLife)}
                      ${buildStat("Attack", mercenary.attack)}
                      ${buildStat("Behavior", mercenary.behavior)}
                      ${buildStat("Support", "Auto")}
                    </div>
                    <p class="entity-passive">${escapeHtml(mercenary.passiveText)}</p>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Run Preview</h2>
            <p>The first playable slice now spans all five acts with act transitions around the repeated area-clearing loop.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <strong>Selected Class</strong>
              <p>${escapeHtml(selectedClass?.name || "None")}</p>
            </article>
            <article class="feature-card">
              <strong>Deck Profile</strong>
              <p>${escapeHtml(services.classRegistry.getDeckProfileId(appState.content, appState.ui.selectedClassId))}</p>
            </article>
            <article class="feature-card">
              <strong>Loop Shape</strong>
              <p>Safe zone to world map to encounter to reward, repeated until the act boss is cleared.</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="neutral-btn" data-action="return-front-door">Back</button>
            <button class="primary-btn" data-action="start-run">Enter Rogue Encampment</button>
          </div>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW = {
    render,
  };
})();
