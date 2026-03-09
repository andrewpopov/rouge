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

  function getTrainingRanks(run: RunState): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(run.progression?.training?.[track] ?? 0), 10) || 0);
    }, 0);
  }

  function buildActDeltaMarkup(
    appState: AppState,
    services: UiRenderServices,
    run: RunState,
    nextAct: ActState | null
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const review = accountSummary.review || {
      availableConvergenceCount: 0,
      nextConvergenceTitle: "",
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const trainingRanks = getTrainingRanks(run);
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const loadoutLines = derivedParty.loadoutLines.length > 0 ? derivedParty.loadoutLines : ["Current weapon, armor, and runewords carry intact into the next town."];
    const planningStageLines = common.getPlanningCharterStageLines
      ? common.getPlanningCharterStageLines(planning, appState.content)
      : [];
    const planningOverview = planning.overview;
    const ledgerTitles = [
      ...Object.values(run.world?.questOutcomes || {}).map((entry) => entry.outcomeTitle),
      ...Object.values(run.world?.shrineOutcomes || {}).map((entry) => entry.outcomeTitle),
      ...Object.values(run.world?.eventOutcomes || {}).map((entry) => entry.outcomeTitle),
      ...Object.values(run.world?.opportunityOutcomes || {}).map((entry) => entry.outcomeTitle),
    ];
    const ledgerCount = ledgerTitles.length;

    const nextTownOrders = [];
    if (run.hero.currentLife < derivedParty.hero.maxLife) {
      nextTownOrders.push(`Heal ${run.hero.name} before leaving ${nextAct?.town || "town"} again.`);
    }
    if (run.belt.current < run.belt.max) {
      nextTownOrders.push("Refill belt charges before the next route push.");
    }
    const spendablePoints =
      run.progression.skillPointsAvailable + run.progression.classPointsAvailable + run.progression.attributePointsAvailable;
    if (spendablePoints > 0) {
      nextTownOrders.push(`Spend ${spendablePoints} pending progression point${spendablePoints === 1 ? "" : "s"} before departing again.`);
    }
    if (planning.plannedRunewordCount > 0) {
      nextTownOrders.push(planningOverview.nextActionSummary || "Review charter targets against vendor stock, stash, and replacement pressure in town.");
    }
    if (nextTownOrders.length === 0) {
      nextTownOrders.push("Check services once, then reopen the route board with the carried build intact.");
    }

    let accountPressureLabel = "Focused Tree";
    let accountPressureTone = accountSummary.focusedTreeId ? "cleared" : "locked";
    let accountPressureLines = [
      `Focused tree: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
      `Training carried forward: ${trainingRanks}.`,
      ...planningStageLines.slice(0, 1),
    ].filter(Boolean);

    if (review.availableConvergenceCount > 0) {
      accountPressureLabel = "Convergence Ready";
      accountPressureTone = "available";
      accountPressureLines = [
        `Ready convergence lane${review.availableConvergenceCount === 1 ? "" : "s"}: ${review.availableConvergenceCount}.`,
        `Next convergence: ${review.nextConvergenceTitle || "all current convergence lanes are online"}.`,
        ...planningStageLines.slice(0, 1),
      ].filter(Boolean);
    } else if (planning.plannedRunewordCount > 0) {
      accountPressureLabel = "Charters Live";
      accountPressureTone = "available";
      accountPressureLines = [
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        planningOverview.nextActionSummary || "No active runeword charter is pinned across the account.",
        ...planningStageLines.slice(0, 1),
      ].filter(Boolean);
    }

    return `
      <section class="panel flow-panel">
        <div class="panel-head">
          <h2>Act Delta Review</h2>
          <p>The transition wrapper now closes the act with the same continuity model as hall, town, map, and reward: what changed, what pressure carries forward, and what to do in the next town.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Act Result</strong>
              ${buildBadge("Cleared", "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Acts", run.summary.actsCleared)}
              ${buildStat("Bosses", run.summary.bossesDefeated)}
              ${buildStat("Zones", run.summary.zonesCleared)}
              ${buildStat("Ledger", ledgerCount)}
            </div>
            ${buildStringList(
              [
                `${run.bossName} is down and ${run.actTitle} is closed.`,
                `Recent route outcomes: ${getPreviewLabel(ledgerTitles, "none logged yet")}.`,
                `Next town on deck: ${nextAct?.town || "end of run"}.`,
              ],
              "log-list reward-list reward-preview-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Carry Forward State</strong>
              ${buildBadge("Persistent", "available")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Hero", `${run.hero.currentLife}/${derivedParty.hero.maxLife}`)}
              ${buildStat("Belt", `${run.belt.current}/${run.belt.max}`)}
              ${buildStat("Gold", run.gold)}
              ${buildStat("Runewords", derivedParty.activeRunewords.length)}
            </div>
            ${buildStringList(
              [
                loadoutLines[0],
                `Active runewords: ${getPreviewLabel(derivedParty.activeRunewords, "none active yet")}.`,
                `Training ranks carried into town: ${trainingRanks}.`,
              ],
              "log-list reward-list reward-preview-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Account Pressure Carry-Through</strong>
              ${buildBadge(accountPressureLabel, accountPressureTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Next Milestone", accountSummary.nextMilestoneTitle || "Cleared")}
              ${buildStat("Ready Conv.", review.availableConvergenceCount)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
            </div>
            ${buildStringList(accountPressureLines, "log-list reward-list reward-preview-list")}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Town Orders</strong>
              ${buildBadge(nextAct?.town || "Final Screen", "available")}
            </div>
            <p>${escapeHtml(`After this wrapper the shell moves to ${nextAct?.town || "the final screen"}.`)}</p>
            <div class="entity-stat-grid">
              ${buildStat("Town", nextAct?.town || "Final")}
              ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
              ${buildStat("Class Pts", run.progression.classPointsAvailable)}
              ${buildStat("Attr Pts", run.progression.attributePointsAvailable)}
            </div>
            ${buildStringList(nextTownOrders, "log-list reward-list reward-preview-list")}
          </article>
        </div>
      </section>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);

    services.renderUtils.buildShell(root, {
      eyebrow: "Act Transition",
      title: `${run.actTitle} Cleared`,
      copy:
        "The shell now treats act completion as a readable wrapper. You finish the act, review the progress, then move cleanly into the next town instead of abruptly dropping back into the route loop.",
      body: `
        ${common.renderRunStatus(run, "Act Transition", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
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
          ${buildActDeltaMarkup(appState, services, run, nextAct || null)}
          ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "Act transition keeps the same account-meta board live while the run pivots into the next town, so archive pressure, charter staging, mastery focus, and convergence readiness survive the act wrapper too.",
          })}
          ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "The act wrapper now keeps charter slots and the next convergence lane readable while the party crosses into the next town, so the next service pass starts from explicit account pressure.",
            charterFollowThrough:
              "If charter pressure still matters after the boss, treat the next town stop as vault and vendor prep before you reopen the route board.",
            convergenceFollowThrough:
              "If convergence pressure is ready after the act clear, review the progression focus in the next town before you spend or depart again.",
          })}
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
