(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

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

  const { getTrainingRankCount } = runtimeWindow.ROUGE_RUN_STATE;

  function getTownPrepActionBadgeTone(action: TownAction | null): string {
    if (!action) {
      return "locked";
    }
    if (action.disabled && action.cost <= 0) {
      return "cleared";
    }
    return action.disabled ? "locked" : "available";
  }

  function getTownPrepActionBadgeLabel(action: TownAction | null, stableLabel: string): string {
    if (!action) {
      return stableLabel;
    }
    if (action.disabled && action.cost <= 0) {
      return stableLabel;
    }
    return action.disabled ? "Blocked" : action.actionLabel;
  }

  function formatTransition(beforeValue: string | number, afterValue: string | number): string {
    return `${beforeValue} -> ${afterValue}`;
  }

  function buildTownPrepOutcomeCard(
    title: string,
    subtitle: string,
    action: TownAction | null,
    stats: Array<{ label: string; value: string | number }>,
    lines: string[],
    renderUtils: RenderUtilsApi,
    stableLabel = "Stable"
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;

    return `
      <article class="feature-card mutation-delta-card">
        <div class="entity-name-row">
          <strong>${escapeHtml(title)}</strong>
          ${buildBadge(getTownPrepActionBadgeLabel(action, stableLabel), getTownPrepActionBadgeTone(action))}
        </div>
        <p class="service-subtitle">${escapeHtml(subtitle)}</p>
        <div class="entity-stat-grid">
          ${stats.map((stat) => buildStat(stat.label, stat.value)).join("")}
        </div>
        ${buildStringList(lines, "log-list reward-list ledger-list")}
      </article>
    `;
  }

  function buildRecoveryOutcomeCard(run: RunState, derivedParty: DerivedPartyState, healerAction: TownAction | null, renderUtils: RenderUtilsApi): string {
    const heroBefore = `${derivedParty.hero.currentLife}/${derivedParty.hero.maxLife}`;
    const heroAfter = `${derivedParty.hero.maxLife}/${derivedParty.hero.maxLife}`;
    const mercenaryBefore = `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}`;
    const mercenaryAfter =
      run.mercenary.currentLife > 0 ? `${derivedParty.mercenary.maxLife}/${derivedParty.mercenary.maxLife}` : mercenaryBefore;
    const projectedGold = Math.max(0, run.gold - (healerAction?.cost || 0));

    return buildTownPrepOutcomeCard(
      "Recovery Reset",
      "See the recovery pass before you spend gold on it.",
      healerAction,
      [
        { label: "Hero Life", value: formatTransition(heroBefore, heroAfter) },
        { label: "Merc Life", value: formatTransition(mercenaryBefore, mercenaryAfter) },
        { label: "Belt", value: formatTransition(`${run.belt.current}/${run.belt.max}`, `${run.belt.current}/${run.belt.max}`) },
        { label: "Gold", value: formatTransition(run.gold, projectedGold) },
      ],
      [
        `Projected recovery: hero ${heroBefore} -> ${heroAfter}, mercenary ${mercenaryBefore} -> ${mercenaryAfter}, gold ${run.gold} -> ${projectedGold}.`,
        ...(healerAction?.previewLines || ["Party already restored.", "No recovery spend is needed."]),
        run.mercenary.currentLife > 0
          ? "Akara restores the living party without touching route, stash, or progression state."
          : "A fallen mercenary still needs the contract desk after this recovery pass.",
      ],
      renderUtils,
      "Recovered"
    );
  }

  function buildQuartermasterOutcomeCard(run: RunState, quartermasterAction: TownAction | null, renderUtils: RenderUtilsApi): string {
    const missingCharges = Math.max(0, run.belt.max - run.belt.current);
    const projectedGold = Math.max(0, run.gold - (quartermasterAction?.cost || 0));

    return buildTownPrepOutcomeCard(
      "Belt Refill",
      "Check the potion reset before you lock in the town spend.",
      quartermasterAction,
      [
        { label: "Belt", value: formatTransition(`${run.belt.current}/${run.belt.max}`, `${run.belt.max}/${run.belt.max}`) },
        { label: "Missing", value: formatTransition(missingCharges, 0) },
        { label: "Gold", value: formatTransition(run.gold, projectedGold) },
        { label: "Route", value: formatTransition(run.safeZoneName, run.safeZoneName) },
      ],
      [
        `Projected refill: belt ${run.belt.current}/${run.belt.max} -> ${run.belt.max}/${run.belt.max}, gold ${run.gold} -> ${projectedGold}.`,
        ...(quartermasterAction?.previewLines || ["Belt already full.", "No purchase needed."]),
        "Quartermaster spend changes supplies only; map progress and build state stay intact.",
      ],
      renderUtils,
      "Full"
    );
  }

  function buildProgressionOutcomeCard(run: RunState, progressionAction: TownAction | null, renderUtils: RenderUtilsApi): string {
    if (!progressionAction) {
      return buildTownPrepOutcomeCard(
        "Spend Next Point",
        "No progression spend is currently staged in town.",
        null,
        [
          { label: "Skill", value: formatTransition(run.progression.skillPointsAvailable, run.progression.skillPointsAvailable) },
          { label: "Class", value: formatTransition(run.progression.classPointsAvailable, run.progression.classPointsAvailable) },
          { label: "Attr", value: formatTransition(run.progression.attributePointsAvailable, run.progression.attributePointsAvailable) },
          { label: "Training", value: formatTransition(getTrainingRankCount(run.progression?.training), getTrainingRankCount(run.progression?.training)) },
        ],
        ["Projected spend: town is build-stable right now, so no point allocation is queued before departure."],
        renderUtils
      );
    }

    const skillAfter = progressionAction.id.startsWith("progression_spend_") ? Math.max(0, run.progression.skillPointsAvailable - 1) : run.progression.skillPointsAvailable;
    const classAfter = progressionAction.id.startsWith("progression_tree_") ? Math.max(0, run.progression.classPointsAvailable - 1) : run.progression.classPointsAvailable;
    const attributeAfter =
      progressionAction.id.startsWith("progression_attribute_") ? Math.max(0, run.progression.attributePointsAvailable - 1) : run.progression.attributePointsAvailable;

    let projectedLine = "Projected spend keeps the town build stable without a queued mutation.";
    let focusLabel = progressionAction.title;
    let focusBefore = "Current";
    let focusAfter = "Next";

    if (progressionAction.id.startsWith("progression_spend_")) {
      const track = progressionAction.id.replace("progression_spend_", "") as keyof RunState["progression"]["training"];
      const currentRank = toNumber(run.progression.training?.[track], 0);
      focusLabel = `${progressionAction.title} Rank`;
      focusBefore = String(currentRank);
      focusAfter = String(currentRank + 1);
      projectedLine = `Projected spend: skill points ${run.progression.skillPointsAvailable} -> ${skillAfter}, ${progressionAction.title.toLowerCase()} rank ${currentRank} -> ${currentRank + 1}.`;
    } else if (progressionAction.id.startsWith("progression_attribute_")) {
      const attribute = progressionAction.id.replace("progression_attribute_", "") as keyof RunAttributeState;
      const currentRank = toNumber(run.progression.attributes?.[attribute], 0);
      focusLabel = `${progressionAction.title} Rank`;
      focusBefore = String(currentRank);
      focusAfter = String(currentRank + 1);
      projectedLine = `Projected spend: attribute points ${run.progression.attributePointsAvailable} -> ${attributeAfter}, ${progressionAction.title.toLowerCase()} rank ${currentRank} -> ${currentRank + 1}.`;
    } else if (progressionAction.id.startsWith("progression_tree_")) {
      const treeId = progressionAction.id.replace("progression_tree_", "");
      const currentRank = toNumber(run.progression.classProgression?.treeRanks?.[treeId], 0);
      focusLabel = `${progressionAction.title} Rank`;
      focusBefore = String(currentRank);
      focusAfter = String(currentRank + 1);
      projectedLine = `Projected spend: class points ${run.progression.classPointsAvailable} -> ${classAfter}, ${progressionAction.title} rank ${currentRank} -> ${currentRank + 1}.`;
    }

    return buildTownPrepOutcomeCard(
      "Spend Next Point",
      "Read the next build mutation before the route reopens.",
      progressionAction,
      [
        { label: "Skill", value: formatTransition(run.progression.skillPointsAvailable, skillAfter) },
        { label: "Class", value: formatTransition(run.progression.classPointsAvailable, classAfter) },
        { label: "Attr", value: formatTransition(run.progression.attributePointsAvailable, attributeAfter) },
        { label: focusLabel, value: formatTransition(focusBefore, focusAfter) },
      ],
      [projectedLine, progressionAction.description, ...progressionAction.previewLines.slice(0, runtimeWindow.ROUGE_LIMITS.PROGRESSION_PREVIEW_LINES)],
      renderUtils,
      "Stable"
    );
  }

  function buildMarketOutcomeCard(
    run: RunState,
    marketAction: TownAction | null,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi
  ): string {
    const projectedGold = Math.max(0, run.gold - (marketAction?.cost || 0));
    const planningOverview = accountSummary.planning?.overview || runtimeWindow.ROUGE_UI_COMMON.createDefaultPlanningSummary().overview;

    return buildTownPrepOutcomeCard(
      "Market Reset",
      "Make the next vendor reroll readable before the fee is committed.",
      marketAction,
      [
        { label: "Gold", value: formatTransition(run.gold, projectedGold) },
        { label: "Refresh", value: formatTransition(run.town.vendor.refreshCount, run.town.vendor.refreshCount + 1) },
        { label: "Stock", value: formatTransition(run.town.vendor.stock.length, "rerolled") },
        { label: "Charter", value: planningOverview.nextActionLabel || "Quiet" },
      ],
      [
        `Projected market reset: gold ${run.gold} -> ${projectedGold}, refresh ${run.town.vendor.refreshCount} -> ${run.town.vendor.refreshCount + 1}, stock rerolls after the fee.`,
        ...(marketAction?.previewLines.slice(0, runtimeWindow.ROUGE_LIMITS.MARKET_PREVIEW_LINES) || ["Vendor refresh is the live trade reset for this town stop."]),
        `Current charter push stays visible through the reroll: ${planningOverview.nextActionLabel || "Quiet"}.`,
      ],
      renderUtils,
      "Stable"
    );
  }

  function buildContractOutcomeCard(
    run: RunState,
    contractAction: TownAction | null,
    derivedParty: DerivedPartyState,
    renderUtils: RenderUtilsApi
  ): string {
    const projectedGold = Math.max(0, run.gold - (contractAction?.cost || 0));
    const mercenaryBefore = `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}`;
    const mercenaryAfter = `${derivedParty.mercenary.maxLife}/${derivedParty.mercenary.maxLife}`;

    return buildTownPrepOutcomeCard(
      "Contract Recovery",
      "Surface the mercenary reset before the route reopens without a companion.",
      contractAction,
      [
        { label: "Merc Life", value: formatTransition(mercenaryBefore, mercenaryAfter) },
        { label: "Contract", value: formatTransition(run.mercenary.name, run.mercenary.name) },
        { label: "Attack", value: formatTransition(derivedParty.mercenary.attack, derivedParty.mercenary.attack) },
        { label: "Gold", value: formatTransition(run.gold, projectedGold) },
      ],
      [
        `Projected contract recovery: mercenary ${mercenaryBefore} -> ${mercenaryAfter}, gold ${run.gold} -> ${projectedGold}.`,
        ...(contractAction?.previewLines || ["Current mercenary must be revived before the route reopens."]),
        "This reset restores the current contract; route progress and world state remain untouched.",
      ],
      renderUtils,
      "Stable"
    );
  }

  function buildTownPrepOutcomeMarkup(
    run: RunState,
    derivedParty: DerivedPartyState,
    townActions: {
      healer: TownAction[];
      quartermaster: TownAction[];
      progression: TownAction[];
      vendor: TownAction[];
      mercenary: TownAction[];
    },
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi
  ): string {
    const healerAction = townActions.healer[0] || null;
    const quartermasterAction = townActions.quartermaster[0] || null;
    const selectedProgressionAction = townActions.progression.find((action) => !action.disabled) || townActions.progression[0] || null;
    const marketAction = townActions.vendor.find((action) => action.id === "vendor_refresh_stock") || townActions.vendor[0] || null;
    const currentContractAction = townActions.mercenary.find((action) => action.id === `mercenary_contract_${run.mercenary.id}`) || null;

    return `
      <section class="panel flow-panel" id="town-prep-outcomes">
        <div class="panel-head">
          <h2>Before Or After Desk</h2>
          <p>Town now turns the highest-value prep actions into explicit before-or-after reads, so recovery, belt, build, and market or contract changes are visible before you commit gold or points.</p>
        </div>
        <div class="feature-grid feature-grid-wide mutation-delta-grid">
          ${buildRecoveryOutcomeCard(run, derivedParty, healerAction, renderUtils)}
          ${buildQuartermasterOutcomeCard(run, quartermasterAction, renderUtils)}
          ${buildProgressionOutcomeCard(run, selectedProgressionAction, renderUtils)}
          ${
            run.mercenary.currentLife <= 0 && currentContractAction
              ? buildContractOutcomeCard(run, currentContractAction, derivedParty, renderUtils)
              : buildMarketOutcomeCard(run, marketAction, accountSummary, renderUtils)
          }
        </div>
      </section>
    `;
  }

  const commonApi = runtimeWindow.ROUGE_UI_COMMON as UiCommonApi & {
    buildTownPrepOutcomeMarkup?: typeof buildTownPrepOutcomeMarkup;
  };
  commonApi.buildExpeditionLaunchFlowMarkup = buildExpeditionLaunchFlowMarkup;
  commonApi.buildTownPrepOutcomeMarkup = buildTownPrepOutcomeMarkup;
})();
