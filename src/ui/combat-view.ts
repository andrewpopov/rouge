(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
    const livingEnemies = combat.enemies.filter((enemy) => enemy.alive).length;
    const playableCards = combat.hand.filter((instance) => {
      const card = appState.content.cardCatalog[instance.cardId];
      return card && combat.hero.energy >= card.cost;
    }).length;
    let phaseText = "Enemy Turn";
    if (combat.outcome === "victory") {
      phaseText = "Victory";
    } else if (combat.outcome === "defeat") {
      phaseText = "Defeat";
    } else if (combat.phase === "player") {
      phaseText = "Player Turn";
    }

    let targetHint = "Select a living enemy before using a targeted card.";
    if (selectedEnemy) {
      targetHint = `Target locked: ${selectedEnemy.name}.`;
    } else if (combat.outcome === "victory") {
      targetHint = "Encounter cleared. The next click on a reward advances the run.";
    } else if (combat.outcome === "defeat") {
      targetHint = "The expedition failed here. Review the run-end summary and return to the front door.";
    }

    const actionWindowLabel = combat.phase === "player" && !combat.outcome ? "Your Turn" : phaseText;
    const actionWindowTone = combat.phase === "player" && !combat.outcome ? "available" : "locked";
    let exitBadgeLabel = `${livingEnemies} hostiles`;
    let exitBadgeTone = "available";
    let exitCopy = "Defeat every hostile to hand back into the reward phase.";
    if (combat.outcome === "victory") {
      exitBadgeLabel = "Reward Ready";
      exitBadgeTone = "cleared";
      exitCopy = "Claim a reward to mutate the run and return to the route.";
    } else if (combat.outcome === "defeat") {
      exitBadgeLabel = "Run Ended";
      exitBadgeTone = "locked";
      exitCopy = "The run summary now owns the failure review.";
    }

    services.renderUtils.buildShell(root, {
      eyebrow: "Encounter",
      title: zone?.title || combat.encounter.name,
      copy:
        "Combat still runs through the deterministic engine, but the surrounding shell now explains encounter progress, target selection, turn flow, and how victory feeds back into the map.",
      body: `
        ${common.renderRunStatus(run, phaseText, services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Encounter Brief</h2>
            <p>${escapeHtml(`${zone?.title || combat.encounter.name} is one stop in the current route. Life, belt charges, and loadout bonuses will all carry back out when this fight resolves.`)}</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Encounter Count</strong>
                ${buildBadge(`${(zone?.encountersCleared || 0) + 1}/${zone?.encounterTotal || 1}`, "available")}
              </div>
              <p>${escapeHtml(zone ? `${zone.title} keeps its cleared progress if you later return to town.` : "This encounter resolves against the active route state.")}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Target Rail</strong>
                ${buildBadge(selectedEnemy ? selectedEnemy.name : "No Target", selectedEnemy ? "available" : "locked")}
              </div>
              <p>${escapeHtml(targetHint)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Action Window</strong>
                ${buildBadge(actionWindowLabel, actionWindowTone)}
              </div>
              <p>${escapeHtml(`${playableCards} card${playableCards === 1 ? "" : "s"} are currently affordable with ${combat.hero.energy} energy.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Exit Condition</strong>
                ${buildBadge(exitBadgeLabel, exitBadgeTone)}
              </div>
              <p>${escapeHtml(exitCopy)}</p>
            </article>
          </div>
        </section>

        <section class="battle-grid">
          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Allied Line</h2>
              <p>Party state is run-owned. Potions, damage taken, and mercenary survival will all write back into the expedition on resolution.</p>
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
                <p class="entity-passive">Targeted skills need a locked enemy. Potions and party-wide tools do not.</p>
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
              <h2>Enemy Front</h2>
              <p>Select a hostile to anchor targeted card play. Enemy intent text stays visible so the shell communicates pressure without touching combat rules.</p>
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
            <h2>Battle Orders</h2>
            <p>The shell now tells the player what to do next in combat without adding new combat-side state.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <strong>1. Lock A Target</strong>
              <p>${escapeHtml(targetHint)}</p>
            </article>
            <article class="feature-card">
              <strong>2. Spend Energy</strong>
              <p>Play cards while you have energy. If a skill says enemy target, the shell expects a selected living hostile.</p>
            </article>
            <article class="feature-card">
              <strong>3. Keep The Party Alive</strong>
              <p>Potions are scarce and carry between encounters. Use them when preserving run momentum matters, not just to perfect a single fight.</p>
            </article>
            <article class="feature-card">
              <strong>4. End Turn Cleanly</strong>
              <p>Once your line is spent, end the turn so the mercenary and enemy intents can resolve. Victory sends you to reward; defeat sends you to run-end review.</p>
            </article>
          </div>
        </section>

        <section class="panel hand-panel">
          <div class="panel-head">
            <h2>Hand</h2>
            <p>Encounter decks reset per fight, but the route remembers what happened to Life, potions, and build state after the outcome is synced.</p>
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
            <p>Most recent actions stay at the top so the player can reconstruct why the encounter state looks the way it does.</p>
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
