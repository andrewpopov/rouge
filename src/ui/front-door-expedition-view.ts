(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { formatTimestamp, getPhaseTone } = runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS;

  function getSavedRunPhaseGuidance(savedRunSummary: SavedRunSummary, appEngine: AppEngineApi): SavedRunPhaseGuidance {
    switch (savedRunSummary.phase) {
      case appEngine.PHASES.SAFE_ZONE:
        return {
          expeditionLabel: "Town Resume",
          decisionLabel: "Resume Town Prep",
          nextSurfaceLabel: "Safe Zone",
          focusLabel: "Recovery And Departure",
          summaryLine: "Town recovery, loadout review, stash pressure, and departure prep are the first read on return.",
          checklistLines: [
            "Next shell: Safe Zone. Recovery, vendor, stash, and spend boards are live first.",
            `The next departure still points toward ${savedRunSummary.bossName}.`,
            "Leave town only after the prep comparison and departure boards read clean.",
          ],
        };
      case appEngine.PHASES.WORLD_MAP:
        return {
          expeditionLabel: "Route Resume",
          decisionLabel: "Resume Route Board",
          nextSurfaceLabel: "World Map",
          focusLabel: "Route Decision",
          summaryLine: "Route intel, blocked nodes, and the next zone choice are the first read on return.",
          checklistLines: [
            "Next shell: World Map. Route intel, consequence lanes, and boss pressure are live first.",
            `The next click is a zone pick or a return to ${savedRunSummary.safeZoneName}.`,
            `Resume only if you want to keep pushing toward ${savedRunSummary.bossName} right away.`,
          ],
        };
      case appEngine.PHASES.REWARD:
        return {
          expeditionLabel: "Reward Pending",
          decisionLabel: "Resolve Pending Reward",
          nextSurfaceLabel: "Reward",
          focusLabel: "Reward Claim",
          summaryLine: "A reward claim is parked — choose one before the route moves again.",
          checklistLines: [
            "Next shell: Reward. Pick one reward before the expedition advances.",
            "The next decision is a reward pick, not a zone pick or town service.",
            "Deck, loadout, progression, and supply changes can land immediately from this claim.",
          ],
        };
      case appEngine.PHASES.ACT_TRANSITION:
        return {
          expeditionLabel: "Act Handoff",
          decisionLabel: "Review Act Handoff",
          nextSurfaceLabel: "Act Transition",
          focusLabel: "Carry-Forward Review",
          summaryLine: "Act delta review is parked, then the next town opens with the same expedition state.",
          checklistLines: [
            "Next shell: Act Transition. Review carry-forward state before the next town opens.",
            "The next click is Continue Act Transition, not a route pick.",
            "Act pressure is already closed on this checkpoint; the shell is staging the town handoff.",
          ],
        };
      case appEngine.PHASES.RUN_COMPLETE:
        return {
          expeditionLabel: "Victory Review",
          decisionLabel: "Review Victory Summary",
          nextSurfaceLabel: "Run Summary",
          focusLabel: "Archive Delta",
          summaryLine: "The victory handoff is parked, so review the archive delta before drafting again.",
          checklistLines: [
            "Next shell: Run Summary. The expedition is already over; only archive review remains.",
            "Review the hall handoff before you start another draft.",
            "This checkpoint exists to preserve the account-facing summary, not route momentum.",
          ],
        };
      case appEngine.PHASES.RUN_FAILED:
        return {
          expeditionLabel: "Failure Review",
          decisionLabel: "Review Fallen Summary",
          nextSurfaceLabel: "Run Summary",
          focusLabel: "Archive And Return",
          summaryLine: "The fallen-run handoff is parked, so read the loss review before drafting again.",
          checklistLines: [
            "Next shell: Run Summary. The expedition is already logged as fallen; only archive review remains.",
            "Read the hall handoff before you clear the save or start another draft.",
            "This checkpoint exists to preserve the failure summary, not a live route.",
          ],
        };
      default:
        return {
          expeditionLabel: "Saved Expedition",
          decisionLabel: "Resume Expedition",
          nextSurfaceLabel: savedRunSummary.phaseLabel,
          focusLabel: "Expedition Review",
          summaryLine: "The parked expedition restores directly into the saved shell state.",
          checklistLines: [
            `Next shell: ${savedRunSummary.phaseLabel}.`,
            `The route is still pointed at ${savedRunSummary.bossName}.`,
            "Archive only if you explicitly want to clear the autosave and start a new class draft.",
          ],
        };
    }
  }

  function buildGuidedStartMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null
  ): string {
    const { escapeHtml } = services.renderUtils;
    const resumeGuidance = savedRunSummary ? getSavedRunPhaseGuidance(savedRunSummary, services.appEngine) : null;
    const classCount = appState.registries.classes.length;
    const mercCount = appState.registries.mercenaries.length;

    return `
      <section class="panel flow-panel" id="hall-guided">
        <div class="panel-head">
          <h2>Path To First Blood</h2>
          <p>The shell explains what to do next without inventing a separate tutorial phase. The same surfaces now reflect persistent tutorial state back out of the account model.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <strong>1. Recruit A Hero</strong>
            <p>Choose from ${escapeHtml(classCount)} seeded classes. The selected class sets hero stats, deck profile, and the skill trees you will chase during the run.</p>
          </article>
          <article class="feature-card">
            <strong>2. Hire A Companion</strong>
            <p>Pick one of ${escapeHtml(mercCount)} mercenary contracts. That companion auto-acts in combat and stays part of the run contract until you swap or revive them in town.</p>
          </article>
          <article class="feature-card">
            <strong>3. Prepare In Town</strong>
            <p>Heal, refill the belt, spend training, inspect vendor stock, and move gear between carried inventory and profile stash before you step onto the map.</p>
          </article>
          <article class="feature-card">
            <strong>4. Read The Route</strong>
            <p>Battle, miniboss, boss, shrine, quest, aftermath, and opportunity nodes all stay visible. The shell explains whether a node resolves through combat or through the reward seam.</p>
          </article>
          <article class="feature-card">
            <strong>5. Resolve Encounters</strong>
            <p>Select a living enemy for targeted cards, use potions only when they matter, then claim one reward choice to permanently mutate the run before the route resumes.</p>
          </article>
          <article class="feature-card">
            <strong>Checkpoint Policy</strong>
            <p>${savedRunSummary ? `One autosaved expedition is already waiting in the hall. Next shell: ${resumeGuidance?.nextSurfaceLabel || savedRunSummary.phaseLabel}.` : "Autosave snapshots are written outside combat, so you always re-enter from a readable run-state checkpoint."}</p>
          </article>
        </div>
      </section>
    `;
  }

  function buildSavedRunMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary): string {
    const { buildBadge, buildStat, escapeHtml, buildStringList } = services.renderUtils;
    const resumeGuidance = getSavedRunPhaseGuidance(savedRunSummary, services.appEngine);
    const confirmSection = appState.ui.confirmAbandonSavedRun
      ? `
          <section class="panel notice-panel confirm-panel">
            <strong>Archive This Expedition</strong>
            <p>Confirming will abandon the live snapshot, push the route into run history, and reopen the hall for a fresh recruitment flow.</p>
          </section>
        `
      : "";
    const actionRow = appState.ui.confirmAbandonSavedRun
      ? `
          <button class="neutral-btn" data-action="cancel-abandon-saved-run">Keep Expedition</button>
          <button class="neutral-btn" data-action="confirm-abandon-saved-run">Archive Expedition</button>
        `
      : '<button class="danger-link-btn" data-action="prompt-abandon-saved-run">Release This Expedition</button>';

    return `
      <section class="panel flow-panel" id="hall-expedition">
        <div class="panel-head">
          <h2>Resume Expedition</h2>
          <p>Only one autosaved route waits in the hall at a time. Review its state, then continue or archive it deliberately.</p>
        </div>
        <div class="front-door-snapshot-grid">
          <article class="entity-card ally snapshot-card">
            <div class="entity-name-row">
              <strong class="entity-name">${escapeHtml(savedRunSummary.className)}</strong>
              ${buildBadge(savedRunSummary.phaseLabel, getPhaseTone(savedRunSummary, services.appEngine))}
            </div>
            <p class="service-subtitle">${escapeHtml(`${savedRunSummary.actTitle} · ${savedRunSummary.safeZoneName}`)}</p>
            <div class="entity-stat-grid">
              ${buildStat("Level", savedRunSummary.level)}
              ${buildStat("Gold", savedRunSummary.gold)}
              ${buildStat("Deck", savedRunSummary.deckSize)}
              ${buildStat("Belt", savedRunSummary.beltState)}
            </div>
            <p class="entity-passive">${escapeHtml(`Saved ${formatTimestamp(savedRunSummary.savedAt)}. Next shell: ${resumeGuidance.nextSurfaceLabel}. ${resumeGuidance.summaryLine}`)}</p>
          </article>
          <article class="feature-card">
            <strong>Momentum Check</strong>
            <div class="entity-stat-grid">
              ${buildStat("Zones", savedRunSummary.zonesCleared)}
              ${buildStat("Encounters", savedRunSummary.encountersCleared)}
              ${buildStat("Skill Pts", savedRunSummary.skillPointsAvailable)}
              ${buildStat("Training", savedRunSummary.trainingRanks)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Class Pts", savedRunSummary.classPointsAvailable)}
              ${buildStat("Attr Pts", savedRunSummary.attributePointsAvailable)}
              ${buildStat("Skills", savedRunSummary.unlockedClassSkills)}
              ${buildStat("Runewords", savedRunSummary.activeRunewords)}
            </div>
            <p>${escapeHtml(`Boss trophies ${savedRunSummary.bossTrophies}, resolved quests ${savedRunSummary.resolvedQuestOutcomes}, active runewords ${savedRunSummary.activeRunewords}. Resume focus: ${resumeGuidance.focusLabel}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Re-entry Checklist</strong>
            ${buildStringList(resumeGuidance.checklistLines, "log-list reward-list ledger-list")}
          </article>
        </div>
        ${confirmSection}
        <div class="cta-row">
          <button class="primary-btn" data-action="continue-saved-run">Continue Saved Run</button>
          ${actionRow}
        </div>
      </section>
    `;
  }

  function buildFreshStartMarkup(appState: AppState, services: UiRenderServices): string {
    const { buildBadge, buildStringList, escapeHtml } = services.renderUtils;
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Any Class";

    return `
      <section class="panel flow-panel" id="hall-expedition">
        <div class="panel-head">
          <h2>Open A New Expedition</h2>
          <p>No active autosave is blocking the hall. Step into character draft, choose a class and mercenary, then enter town with clear guidance for the first route.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Character Hall</strong>
              ${buildBadge(preferredClassName, "available")}
            </div>
            <p>${escapeHtml(`The next recruitment screen will surface your preferred class signal: ${preferredClassName}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Autosave Contract</strong>
            ${buildStringList(
              [
                "Snapshots are written at readable checkpoints outside combat.",
                "Abandoning is explicit so the front door never destroys a live route accidentally.",
                "Run history remains profile-owned after the route ends.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <strong>First Destination</strong>
            <p>Character select leads straight into Forsaken Palisade, where the shell explains town services, route pressure, and what persists when you step back onto the world map.</p>
          </article>
        </div>
        <div class="cta-row">
          <button class="primary-btn" data-action="start-character-select">Enter Character Hall</button>
        </div>
      </section>
    `;
  }

  function buildExpeditionSectionMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null): string {
    return savedRunSummary ? buildSavedRunMarkup(appState, services, savedRunSummary) : buildFreshStartMarkup(appState, services);
  }

  runtimeWindow.ROUGE_FRONT_DOOR_EXPEDITION_VIEW = {
    getSavedRunPhaseGuidance,
    buildHallNavigatorMarkup: runtimeWindow.__ROUGE_EXPEDITION_DECISION.buildHallNavigatorMarkup,
    buildHallDecisionSupportMarkup: runtimeWindow.__ROUGE_EXPEDITION_DECISION.buildHallDecisionSupportMarkup,
    buildGuidedStartMarkup,
    buildExpeditionSectionMarkup,
  };
})();
