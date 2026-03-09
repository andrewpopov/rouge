(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function humanizeId(id: string): string {
    return String(id || "")
      .split("_")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function buildExpeditionLaunchFlowMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: ExpeditionLaunchFlowOptions = {}
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    const title = options.title || "Expedition Launch Flow";
    const copy =
      options.copy ||
      "Hall, character draft, and first-town prep now read like one launch runway, so the shell carries the same expedition intent from account review into the opening town.";
    const currentStep = options.currentStep || "hall";
    const hallFollowThrough = options.hallFollowThrough || "Open character draft once the hall signal is settled.";
    const draftFollowThrough = options.draftFollowThrough || "Choose the class shell and mercenary contract, then carry that plan directly into town.";
    const townFollowThrough =
      options.townFollowThrough || "Use the first town pass to confirm recovery, loadout, stash pressure, and departure before the map opens.";
    const profileSummary = accountSummary?.profile || {
      hasActiveRun: false,
      stashEntries: 0,
      runHistoryCount: 0,
      completedRuns: 0,
      failedRuns: 0,
      highestLevel: 1,
      highestActCleared: 0,
      totalBossesDefeated: 0,
      totalGoldCollected: 0,
      totalRunewordsForged: 0,
      classesPlayedCount: 0,
      preferredClassId: "",
      lastPlayedClassId: "",
      unlockedClassCount: 0,
      unlockedBossCount: 0,
      unlockedRunewordCount: 0,
      townFeatureCount: 0,
      seenTutorialCount: 0,
      completedTutorialCount: 0,
      dismissedTutorialCount: 0,
    };
    const preferredClassId = profileSummary.preferredClassId || appState.profile?.meta?.progression?.preferredClassId || "";
    const selectedClassId = appState.run?.classId || appState.ui.selectedClassId || preferredClassId;
    const selectedClass =
      appState.registries.classes.find((entry) => entry.id === selectedClassId) ||
      runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassDefinition?.(appState.seedBundle, selectedClassId) ||
      null;
    const preferredClass =
      appState.registries.classes.find((entry) => entry.id === preferredClassId) ||
      runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassDefinition?.(appState.seedBundle, preferredClassId) ||
      null;
    const lastPlayedClass =
      appState.registries.classes.find((entry) => entry.id === profileSummary.lastPlayedClassId) ||
      runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassDefinition?.(appState.seedBundle, profileSummary.lastPlayedClassId) ||
      null;
    const selectedMercenary =
      (appState.run?.mercenary
        ? {
            name: appState.run.mercenary.name,
            role: appState.run.mercenary.role,
            behavior: appState.run.mercenary.behavior,
            maxLife: appState.run.mercenary.maxLife,
            attack: appState.run.mercenary.attack,
          }
        : null) ||
      appState.registries.mercenaries.find((mercenary) => mercenary.id === appState.ui.selectedMercenaryId) ||
      null;
    const selectedClassLabel = appState.run?.className || selectedClass?.name || "Choose a class";
    const preferredClassLabel = preferredClass?.name || (preferredClassId ? humanizeId(preferredClassId) : "No preferred class");
    const lastPlayedClassLabel =
      lastPlayedClass?.name || (profileSummary.lastPlayedClassId ? humanizeId(profileSummary.lastPlayedClassId) : "No archived run yet");
    const selectedMercenaryLabel = selectedMercenary?.name || "Choose a companion";
    const deckProfileId = selectedClassId ? runtimeWindow.ROUGE_CLASS_REGISTRY?.getDeckProfileId?.(appState.content, selectedClassId) || "Unset" : "Unset";
    const townName = appState.run?.safeZoneName || "Rogue Encampment";
    const routeLabel = appState.run?.actTitle || "Act I Route";
    const hallBlocked = Boolean(profileSummary.hasActiveRun);
    const draftReady = Boolean(selectedClassId && selectedMercenary?.name);

    let hallBadgeLabel = "Step 1";
    let hallTone = currentStep === "hall" ? "available" : "cleared";
    if (hallBlocked) {
      hallBadgeLabel = "Resolve Run";
      hallTone = "available";
    } else if (currentStep !== "hall") {
      hallBadgeLabel = "Cleared";
    }

    let draftBadgeLabel = "Choose Draft";
    let draftTone = "locked";
    if (draftReady) {
      draftBadgeLabel = currentStep === "town" ? "Committed" : "Commit Ready";
      draftTone = currentStep === "draft" ? "available" : "cleared";
    } else if (selectedClassId) {
      draftBadgeLabel = "Class Pinned";
      draftTone = "available";
    }

    let townBadgeLabel = "Next Stop";
    let townTone = "locked";
    if (appState.run) {
      townBadgeLabel = currentStep === "town" ? townName : "Town Ready";
      townTone = currentStep === "town" ? "available" : "cleared";
    }

    return `
      <section class="panel flow-panel">
        <div class="panel-head">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(copy)}</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Hall Signal</strong>
              ${buildBadge(hallBadgeLabel, hallTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Launch", hallBlocked ? "Blocked" : "Clear")}
              ${buildStat("Preferred", preferredClassLabel)}
              ${buildStat("Last", lastPlayedClassLabel)}
              ${buildStat("Tutorials", `${profileSummary.completedTutorialCount}/${profileSummary.seenTutorialCount}`)}
            </div>
            ${buildStringList(
              [
                hallBlocked
                  ? "A parked expedition is still in the hall. Resume or archive it before starting a fresh launch."
                  : "The hall is clear for a fresh expedition launch.",
                `Preferred draft signal: ${preferredClassLabel}.`,
                `Last expedition signal: ${lastPlayedClassLabel}.`,
                hallFollowThrough,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Draft Commit</strong>
              ${buildBadge(draftBadgeLabel, draftTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Class", selectedClassLabel)}
              ${buildStat("Merc", selectedMercenaryLabel)}
              ${buildStat("Deck", deckProfileId)}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
            </div>
            ${buildStringList(
              [
                `Selected class: ${selectedClassLabel}.`,
                `Selected contract: ${selectedMercenaryLabel}.`,
                `Deck profile: ${deckProfileId}.`,
                draftFollowThrough,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Town Arrival</strong>
              ${buildBadge(townBadgeLabel, townTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Town", townName)}
              ${buildStat("Route", routeLabel)}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Features", profileSummary.townFeatureCount)}
            </div>
            ${buildStringList(
              [
                `Town arrival: ${townName}.`,
                appState.run
                  ? `Current launch carries ${selectedClassLabel} with ${selectedMercenaryLabel}.`
                  : "The drafted hero and contract carry straight into the first town pass.",
                "The first town pass groups recovery, supply, stash, training, and departure review before the map opens.",
                townFollowThrough,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  runtimeWindow.ROUGE_UI_COMMON.buildExpeditionLaunchFlowMarkup = buildExpeditionLaunchFlowMarkup;
})();
