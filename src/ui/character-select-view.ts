(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
    const selectedClass = services.classRegistry.getClassDefinition(appState.seedBundle, appState.ui.selectedClassId);
    const selectedHero = selectedClass ? services.classRegistry.createHeroFromClass(appState.content, selectedClass) : null;
    const selectedMercenary = appState.registries.mercenaries.find((mercenary) => mercenary.id === appState.ui.selectedMercenaryId) || null;
    const preferredClassId = appState.profile?.meta?.progression?.preferredClassId || "";
    const returningPlayer = (appState.profile?.runHistory?.length || 0) > 0;
    const deckProfileId = services.classRegistry.getDeckProfileId(appState.content, appState.ui.selectedClassId);

    services.renderUtils.buildShell(root, {
      eyebrow: "Character Select",
      title: "Recruit A Hero And Companion",
      copy:
        "This screen frames the run start like a real deployment draft: choose the class shell, sign a mercenary contract, then move into town with clear expectations for the full loop.",
      body: `
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Recruitment Brief</h2>
            <p>${escapeHtml(returningPlayer ? "Your account history is already feeding back into the draft." : "First-run guidance is surfaced here before you ever step into town.")}</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <strong>Class Shell</strong>
              <p>Hero stats, starter deck profile, and class progression all key off the selected class entry rather than a fixed debug template.</p>
            </article>
            <article class="feature-card">
              <strong>Mercenary Role</strong>
              <p>The mercenary is a separate contract. They auto-act in combat and can later be swapped or revived in town without resetting route progress.</p>
            </article>
            <article class="feature-card">
              <strong>Next Stop</strong>
              <p>Starting the run opens Rogue Encampment, where the safe-zone shell explains recovery, supply, training, stash, and departure without hiding game rules.</p>
            </article>
            <article class="feature-card">
              <strong>Loop Shape</strong>
              <p>Town to world map to encounter to reward repeats until the act boss drops, then the act wrapper hands you into the next town.</p>
            </article>
          </div>
        </section>
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Class Dossiers</h2>
            <p>Pick the hero shell first. Every card below previews the seeded statline and deck posture the run will inherit.</p>
          </div>
          <div class="selection-grid">
            ${appState.registries.classes
              .map((entry) => {
                const previewHero = services.classRegistry.createHeroFromClass(appState.content, entry);
                const isSelected = entry.id === appState.ui.selectedClassId;
                const isPreferred = entry.id === preferredClassId;
                const deckProfile = services.classRegistry.getDeckProfileId(appState.content, entry.id);

                return `
                  <button class="entity-card class-card ${isSelected ? "selected" : ""}" data-action="select-class" data-class-id="${escapeHtml(entry.id)}">
                    <div class="entity-name-row">
                      <strong class="entity-name">${escapeHtml(entry.name)}</strong>
                      ${buildBadge(isPreferred ? "Preferred" : deckProfile, isPreferred ? "cleared" : "available")}
                    </div>
                    <p class="service-subtitle">${escapeHtml(entry.skillTrees.join(" · "))}</p>
                    <div class="entity-stat-grid">
                      ${buildStat("Life", previewHero.maxLife)}
                      ${buildStat("Energy", previewHero.maxEnergy)}
                      ${buildStat("Hand", previewHero.handSize)}
                      ${buildStat("Potion", previewHero.potionHeal)}
                    </div>
                    <p class="entity-passive">${escapeHtml(`Deck posture: ${deckProfile}. Select this hero if you want ${entry.name.toLowerCase()} progression and tree unlocks driving the run.`)}</p>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Mercenary Contracts</h2>
            <p>Choose the companion who will stabilize the early route. This stays a run-local contract and does not overwrite account ownership.</p>
          </div>
          <div class="selection-grid selection-grid-mercs">
            ${appState.registries.mercenaries
              .map((mercenary) => {
                const isSelected = mercenary.id === appState.ui.selectedMercenaryId;
                return `
                  <button class="entity-card ${isSelected ? "selected" : ""}" data-action="select-mercenary" data-mercenary-id="${escapeHtml(mercenary.id)}">
                    <div class="entity-name-row">
                      <strong class="entity-name">${escapeHtml(mercenary.name)}</strong>
                      ${buildBadge(mercenary.role, "available")}
                    </div>
                    <p class="service-subtitle">${escapeHtml(mercenary.behavior)}</p>
                    <div class="entity-stat-grid">
                      ${buildStat("Life", mercenary.maxLife)}
                      ${buildStat("Attack", mercenary.attack)}
                      ${buildStat("Support", "Auto")}
                      ${buildStat("Contract", isSelected ? "Selected" : "Open")}
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
            <h2>Deployment Checklist</h2>
            <p>Everything below is render-only guidance. The actual run construction still belongs to the existing class, run, and content registries.</p>
          </div>
          <div class="front-door-snapshot-grid">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Selected Hero</strong>
                ${buildBadge(selectedClass?.name || "Choose One", selectedClass ? "available" : "locked")}
              </div>
              ${
                selectedHero
                  ? `
                    <div class="entity-stat-grid">
                      ${buildStat("Life", selectedHero.maxLife)}
                      ${buildStat("Energy", selectedHero.maxEnergy)}
                      ${buildStat("Hand", selectedHero.handSize)}
                      ${buildStat("Potion", selectedHero.potionHeal)}
                    </div>
                    <p>${escapeHtml(`Skill trees: ${selectedClass.skillTrees.join(", ")}.`)}</p>
                  `
                  : "<p>No class is selected yet.</p>"
              }
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Companion Contract</strong>
                ${buildBadge(selectedMercenary?.name || "Choose One", selectedMercenary ? "available" : "locked")}
              </div>
              ${
                selectedMercenary
                  ? `
                    <div class="entity-stat-grid">
                      ${buildStat("Life", selectedMercenary.maxLife)}
                      ${buildStat("Attack", selectedMercenary.attack)}
                      ${buildStat("Role", selectedMercenary.role)}
                      ${buildStat("Behavior", selectedMercenary.behavior)}
                    </div>
                    <p>${escapeHtml(selectedMercenary.passiveText)}</p>
                  `
                  : "<p>No mercenary contract is selected yet.</p>"
              }
            </article>
            <article class="feature-card">
              <strong>What Happens Next</strong>
              ${buildStringList(
                [
                  `Town opens with departure guidance, service grouping, and run-vs-profile state separation.`,
                  `The current deck profile is ${deckProfileId}. It will seed the opening run before rewards start mutating it.`,
                  "After town, the world map will call out battle routes, side nodes, boss pressure, and the return path back to safety.",
                ],
                "log-list reward-list ledger-list"
              )}
            </article>
          </div>
          <div class="cta-row">
            <button class="neutral-btn" data-action="return-front-door">Back To Hall</button>
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
