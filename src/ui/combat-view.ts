(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildStat } = services.renderUtils;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
    let phaseText = "Enemy Turn";
    if (combat.outcome === "victory") {
      phaseText = "Victory";
    } else if (combat.outcome === "defeat") {
      phaseText = "Defeat";
    } else if (combat.phase === "player") {
      phaseText = "Player Turn";
    }

    let targetHint = "Select a living enemy.";
    if (selectedEnemy) {
      targetHint = `Selected target: ${selectedEnemy.name}`;
    } else if (combat.outcome === "victory") {
      targetHint = "Encounter cleared. Claim the reward to continue the run.";
    } else if (combat.outcome === "defeat") {
      targetHint = "The hero fell. Return to the front door to start a new run.";
    }

    services.renderUtils.buildShell(root, {
      eyebrow: "Encounter",
      title: `${zone?.title || combat.encounter.name}`,
      copy:
        "This screen is still powered by the deterministic combat engine, but it now sits inside the larger run phase model and carries state back into the app loop.",
      body: `
        ${common.renderRunStatus(run, phaseText, services.renderUtils)}
        <section class="status-strip panel">
          <div class="status-item">
            <span class="status-label">Encounter</span>
            <strong>${escapeHtml(`${(zone?.encountersCleared || 0) + 1}/${zone?.encounterTotal || 1}`)}</strong>
          </div>
          <div class="status-item">
            <span class="status-label">Turn</span>
            <strong>${escapeHtml(combat.turn)}</strong>
          </div>
          <div class="status-item">
            <span class="status-label">Energy</span>
            <strong>${escapeHtml(`${combat.hero.energy}/${combat.hero.maxEnergy}`)}</strong>
          </div>
          <div class="status-item">
            <span class="status-label">Potions</span>
            <strong>${escapeHtml(combat.potions)}</strong>
          </div>
          <div class="status-item">
            <span class="status-label">Deck</span>
            <strong>${escapeHtml(combat.drawPile.length)}</strong>
          </div>
          <div class="status-item">
            <span class="status-label">Discard</span>
            <strong>${escapeHtml(combat.discardPile.length)}</strong>
          </div>
        </section>

        <section class="battle-grid">
          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Party</h2>
              <p>Run-state life and potion values are carried into this encounter and will be written back out on resolution.</p>
            </div>
            <div class="entity-row">
              <article class="entity-card ally ${combat.hero.alive ? "" : "dead"}">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(combat.hero.name)}</strong>
                  <span class="entity-role">${escapeHtml(combat.hero.className)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${combat.hero.life}/${combat.hero.maxLife}`)}
                  ${buildStat("Guard", combat.hero.guard)}
                  ${buildStat("Energy", `${combat.hero.energy}/${combat.hero.maxEnergy}`)}
                  ${buildStat("Hand", combat.hand.length)}
                </div>
                <p class="entity-passive">Cards remain the primary input surface. Potions and mercenary support stay outside the hand.</p>
              </article>
              <article class="entity-card ally ${combat.mercenary.alive ? "" : "dead"}">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(combat.mercenary.name)}</strong>
                  <span class="entity-role">${escapeHtml(combat.mercenary.role)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${combat.mercenary.life}/${combat.mercenary.maxLife}`)}
                  ${buildStat("Guard", combat.mercenary.guard)}
                  ${buildStat("Attack", combat.mercenary.attack)}
                  ${buildStat("Bonus", combat.mercenary.nextAttackBonus)}
                </div>
                <p class="entity-passive">${escapeHtml(combat.mercenary.passiveText)}</p>
              </article>
            </div>
            <div class="action-row">
              <button class="neutral-btn" data-action="use-potion-hero" ${combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || combat.outcome ? "disabled" : ""}>Potion Hero</button>
              <button class="neutral-btn" data-action="use-potion-mercenary" ${combat.potions <= 0 || !combat.mercenary.alive || combat.mercenary.life >= combat.mercenary.maxLife || combat.outcome ? "disabled" : ""}>Potion Mercenary</button>
              <button class="primary-btn" data-action="end-turn" ${combat.phase !== "player" || combat.outcome ? "disabled" : ""}>End Turn</button>
            </div>
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Enemies</h2>
              <p>Select a target for single-target skills. Enemies resolve after the mercenary.</p>
            </div>
            <div class="entity-row enemy-row">
              ${combat.enemies
                .map((enemy) => {
                  const enemyStateClass = enemy.alive ? "" : "dead";
                  const enemySelectionClass = selectedEnemy?.id === enemy.id ? "selected" : "";
                  const enemyDisabled = !enemy.alive || Boolean(combat.outcome);
                  const enemyStatusLabel = enemy.alive ? "Hostile" : "Downed";
                  return `
                    <button class="entity-card enemy ${enemyStateClass} ${enemySelectionClass}" data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}" ${enemyDisabled ? "disabled" : ""}>
                      <div class="entity-name-row">
                        <strong class="entity-name">${escapeHtml(enemy.name)}</strong>
                        <span class="entity-role">${enemyStatusLabel}</span>
                      </div>
                      <div class="entity-stat-grid">
                        ${buildStat("Life", `${enemy.life}/${enemy.maxLife}`)}
                        ${buildStat("Guard", enemy.guard)}
                        ${buildStat("Burn", enemy.burn)}
                        ${buildStat("Intent", enemy.intentIndex + 1)}
                      </div>
                      <p class="entity-intent">${escapeHtml(services.combatEngine.describeIntent(enemy.currentIntent))}</p>
                    </button>
                  `;
                })
                .join("")}
            </div>
            <p class="target-hint">${escapeHtml(targetHint)}</p>
          </article>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Turn Guide</h2>
            <p>The shell now explains targeting and turn order without changing the combat engine.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <strong>Select Target</strong>
              <p>${escapeHtml(targetHint)}</p>
            </article>
            <article class="feature-card">
              <strong>Spend Actions</strong>
              <p>Play cards while you have energy. Targeted skills require a selected living enemy; potions and party skills do not.</p>
            </article>
            <article class="feature-card">
              <strong>Advance The Run</strong>
              <p>End the turn to let the mercenary and enemies act, then claim the reward after victory to return to the route.</p>
            </article>
          </div>
        </section>

        <section class="panel hand-panel">
          <div class="panel-head">
            <h2>Hand</h2>
            <p>Areas can require one to five encounters. The deck resets each encounter, but life and potions carry through the run.</p>
          </div>
          <div class="hand-row">
            ${combat.hand
              .map((instance) => {
                const card = appState.content.cardCatalog[instance.cardId];
                const requiresTarget = card.target === "enemy";
                const disabled =
                  combat.outcome ||
                  combat.phase !== "player" ||
                  combat.hero.energy < card.cost ||
                  (requiresTarget && !selectedEnemy);
                return `
                  <button class="card-btn" data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}" ${disabled ? "disabled" : ""}>
                    <div class="card-top">
                      <strong class="card-title">${escapeHtml(card.title)}</strong>
                      <span class="card-cost">${escapeHtml(card.cost)}</span>
                    </div>
                    <p class="card-copy">${escapeHtml(card.text)}</p>
                    <p class="card-target">${card.target === "enemy" ? "Targeted Skill" : "Party Skill"}</p>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>

        <section class="panel log-panel">
          <div class="panel-head">
            <h2>Combat Log</h2>
            <p>Latest events appear first.</p>
          </div>
          <ol class="log-list">
            ${combat.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
          </ol>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
