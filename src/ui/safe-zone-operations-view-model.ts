(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;

  const { getTrainingRankCount } = runtimeWindow.ROUGE_RUN_STATE;

  function buildWorldLedgerLines(run: RunState): string[] {
    const questLines = Object.values(run.world?.questOutcomes || {}).map((entry) => {
      return `Quest · ${entry.title}: ${entry.outcomeTitle} (Act ${entry.actNumber})`;
    });
    const shrineLines = Object.values(run.world?.shrineOutcomes || {}).map((entry) => {
      return `Shrine · ${entry.title}: ${entry.outcomeTitle} (Act ${entry.actNumber})`;
    });
    const eventLines = Object.values(run.world?.eventOutcomes || {}).map((entry) => {
      return `Aftermath · ${entry.title}: ${entry.outcomeTitle} (Act ${entry.actNumber})`;
    });
    const opportunityLines = Object.values(run.world?.opportunityOutcomes || {}).map((entry) => {
      return `Opportunity · ${entry.title}: ${entry.outcomeTitle} (Act ${entry.actNumber})`;
    });
    return [...questLines, ...shrineLines, ...eventLines, ...opportunityLines];
  }

  function createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const run = appState.run;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const townActions = services.townServices.listActions(appState.content, run, appState.profile);
    const serviceActions = townActions.filter((action) => action.category === "service");
    const healerActions = serviceActions.filter((action) => action.id.startsWith("healer_"));
    const quartermasterActions = serviceActions.filter((action) => action.id.startsWith("quartermaster_"));
    const progressionActions = townActions.filter((action) => action.category === "progression");
    const vendorActions = townActions.filter((action) => action.category === "vendor");
    const blacksmithActions = townActions.filter((action) => action.category === "blacksmith");
    const sageActions = townActions.filter((action) => action.category === "sage");
    const gamblerActions = townActions.filter((action) => action.category === "gambler");
    const inventoryActions = townActions.filter((action) => action.category === "inventory");
    const stashActions = townActions.filter((action) => action.category === "stash");
    const mercenaryActions = townActions.filter((action) => action.category === "mercenary");
    const routeSnapshot = common.buildSafeZoneSnapshot(run, services.runFactory);
    const trainingRanks = getTrainingRankCount(run.progression?.training);
    const carriedEntries = run.inventory?.carried?.length || 0;
    const vendorStock = run.town?.vendor?.stock?.length || 0;
    const vendorRefreshes = run.town?.vendor?.refreshCount || 0;
    const stashEntries = appState.profile?.stash?.entries?.length || 0;
    const questOutcomeCount = Object.keys(run.world?.questOutcomes || {}).length;
    const shrineOutcomeCount = Object.keys(run.world?.shrineOutcomes || {}).length;
    const eventOutcomeCount = Object.keys(run.world?.eventOutcomes || {}).length;
    const opportunityOutcomeCount = Object.keys(run.world?.opportunityOutcomes || {}).length;
    const worldOutcomeCount = questOutcomeCount + shrineOutcomeCount + eventOutcomeCount + opportunityOutcomeCount;
    const profileSummary = services.appEngine.getProfileSummary(appState);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const review: ProfileAccountReviewSummary = accountSummary.review || common.createDefaultReviewSummary();
    const stashSummary: ProfileStashSummary = accountSummary.stash || common.createDefaultStashSummary(stashEntries);
    const planningOverview = planning.overview;
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Unset";
    const planningLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId);
    const plannedWeaponLabel = planning.weaponRunewordId
      ? appState.content.runewordCatalog?.[planning.weaponRunewordId]?.name || planning.weaponRunewordId
      : "Unset";
    const plannedArmorLabel = planning.armorRunewordId
      ? appState.content.runewordCatalog?.[planning.armorRunewordId]?.name || planning.armorRunewordId
      : "Unset";
    const plannedRunewordLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId);
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;
    const townFeatureLabels = (appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const seenTutorialIds = appState.profile?.meta?.tutorials?.seenIds || [];
    const completedTutorialIds = appState.profile?.meta?.tutorials?.completedIds || [];
    const pendingTutorialIds = seenTutorialIds.filter((tutorialId) => !completedTutorialIds.includes(tutorialId));
    const nextTutorialLabel = pendingTutorialIds.length > 0 ? common.getTutorialLabel(pendingTutorialIds[0]) : "Town guidance is caught up";
    const missingHeroLife = Math.max(0, derivedParty.hero.maxLife - derivedParty.hero.currentLife);
    const missingMercenaryLife = Math.max(0, derivedParty.mercenary.maxLife - derivedParty.mercenary.currentLife);
    const missingBelt = Math.max(0, run.belt.max - run.belt.current);
    const spendablePointCount =
      run.progression.skillPointsAvailable + run.progression.classPointsAvailable + run.progression.attributePointsAvailable;
    const progressionActionTitles = progressionActions.map((action) => action.title);
    const recoveryActionTitles = [...healerActions, ...quartermasterActions].map((action) => action.title);
    const tradeActionTitles = [...vendorActions, ...inventoryActions, ...stashActions].map((action) => action.title);
    const mercenaryActionTitles = mercenaryActions.map((action) => action.title);
    const readinessIssues = [
      missingHeroLife > 0 ? `Hero is missing ${missingHeroLife} Life.` : "",
      missingMercenaryLife > 0 ? `Mercenary is missing ${missingMercenaryLife} Life.` : "",
      missingBelt > 0 ? `Belt can still recover ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.` : "",
      spendablePointCount > 0 ? `${spendablePointCount} spendable point${spendablePointCount === 1 ? "" : "s"} remain in training.` : "",
      tradeActionTitles.length > 0 ? `${tradeActionTitles.length} trade or inventory action${tradeActionTitles.length === 1 ? "" : "s"} are still open.` : "",
      routeSnapshot.nextZone ? `Next route ready: ${routeSnapshot.nextZone.title}.` : "Read the map before leaving town.",
    ].filter(Boolean);
    let readinessTone = "locked";
    if (readinessIssues.length <= 1) {
      readinessTone = "cleared";
    } else if (routeSnapshot.nextZone) {
      readinessTone = "available";
    }
    const readinessBadgeLabel = readinessIssues.length <= 1 ? "Ready To Leave" : `${readinessIssues.length - 1} prep check${readinessIssues.length - 1 === 1 ? "" : "s"}`;
    const liveBonusBadgeLabel = review.availableConvergenceCount > 0 ? "Convergence Ready" : accountSummary.focusedTreeTitle || "Unset";
    let liveBonusTone = "locked";
    if (review.availableConvergenceCount > 0) {
      liveBonusTone = "available";
    } else if (accountSummary.focusedTreeId) {
      liveBonusTone = "cleared";
    }
    const equippedCount = Object.values(run.loadout || {}).filter(Boolean).length;

    let nextPrepLabel = routeSnapshot.nextZone ? "Leave Town" : "Read Map";
    let nextPrepTone = routeSnapshot.nextZone ? "cleared" : "locked";
    let nextPrepCopy = routeSnapshot.nextZone
      ? `${routeSnapshot.nextZone.title} is already open. Town prep is clean enough to leave.`
      : "No route node is immediately open. Review the map and boss gate before spending more gold.";
    let nextPrepLines = [
      `Live route target: ${routeSnapshot.nextZone?.title || run.bossName}.`,
      `Focused tree support stays active while you travel: ${accountSummary.focusedTreeTitle || "no focused tree"}.`,
      readinessIssues[0] || "No immediate departure issue is blocking the route.",
    ];

    if (missingHeroLife > 0 || missingMercenaryLife > 0 || missingBelt > 0) {
      nextPrepLabel = "Recover First";
      nextPrepTone = "available";
      nextPrepCopy = "Life or belt pressure is still active. Use the recovery districts before you spend elsewhere.";
      nextPrepLines = [
        `Recovery gap: hero ${missingHeroLife} Life, mercenary ${missingMercenaryLife} Life, belt ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.`,
        "Recovery stays run-owned; this board only makes the pressure obvious before departure.",
        routeSnapshot.nextZone ? `${routeSnapshot.nextZone.title} remains open after the recovery pass.` : "Review the map after you stabilize the party.",
      ];
    } else if (spendablePointCount > 0) {
      nextPrepLabel = "Spend Pending";
      nextPrepTone = "available";
      nextPrepCopy = "Unspent progression is still parked in town. Resolve that build pressure before you leave.";
      nextPrepLines = [
        `${run.progression.skillPointsAvailable} skill, ${run.progression.classPointsAvailable} class, and ${run.progression.attributePointsAvailable} attribute points remain.`,
        `Training ranks already banked: ${trainingRanks}.`,
        `Focused tree momentum: ${accountSummary.focusedTreeTitle || "no focus"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
      ];
    } else if (tradeActionTitles.length > 0 || planning.plannedRunewordCount > 0) {
      nextPrepLabel = "Resolve Charter Pressure";
      nextPrepTone = tradeActionTitles.length > 0 || planningOverview.readyCharterCount > 0 || planningOverview.preparedCharterCount > 0 ? "available" : "locked";
      nextPrepCopy = planningOverview.nextActionSummary || "Carry, stash, and vendor pressure still matter for the next departure, especially if you are steering around a pinned runeword target.";
      nextPrepLines = [
        `Trade lane: ${common.getPreviewLabel(tradeActionTitles, "no open trade actions")}.`,
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        `Vault readiness: ${planningOverview.readyCharterCount} ready, ${planningOverview.preparedCharterCount} prepared, ${planningOverview.missingBaseCharterCount} missing base.`,
      ];
    } else if (review.availableConvergenceCount > 0) {
      nextPrepLabel = "Leave With Bonus";
      nextPrepTone = "available";
      nextPrepCopy = "Town is already stable and the account layer is online. Leave once you are satisfied with the route target.";
      nextPrepLines = [
        `Ready convergence lane${review.availableConvergenceCount === 1 ? "" : "s"}: ${review.availableConvergenceCount}.`,
        `Next convergence: ${review.nextConvergenceTitle || "every current convergence already online"}.`,
        `Current account focus already pushing this run: ${accountSummary.focusedTreeTitle || "no focus set"}.`,
      ];
    }

    const routeProgressTone =
      routeSnapshot.clearedZones === routeSnapshot.currentZones.length && routeSnapshot.currentZones.length > 0
        ? "cleared"
        : "available";
    const objectiveTone = routeSnapshot.nextZone || routeSnapshot.bossZone?.status === "available" ? "available" : "locked";
    const objectiveSummary = common.getObjectiveSummary(routeSnapshot);
    const bossTone = common.getBossStatusTone(routeSnapshot.bossZone?.status);
    const bossBadgeLabel = common.getBossStatusLabel(routeSnapshot.bossZone?.status);
    const companionTone = run.mercenary.currentLife > 0 ? "available" : "locked";
    const worldLedgerLines = buildWorldLedgerLines(run);
    const departureBriefingLines = [
      routeSnapshot.nextZone
        ? `Recommended next route: ${routeSnapshot.nextZone.title} is already open on the map.`
        : `${run.bossName} remains gated until more route pressure is cleared.`,
      `Recovery still available: hero ${missingHeroLife} Life, mercenary ${missingMercenaryLife} Life, belt ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.`,
      `${worldOutcomeCount} world outcomes, ${run.progression.skillPointsAvailable} skill points, ${run.progression.classPointsAvailable} class points, ${run.progression.attributePointsAvailable} attribute points, and ${derivedParty.activeRunewords.length} active runewords all persist when you leave town.`,
    ];

    return {
      run,
      derivedParty,
      routeSnapshot,
      profileSummary,
      accountSummary,
      townActions,
      healerActions,
      quartermasterActions,
      progressionActions,
      vendorActions,
      blacksmithActions,
      sageActions,
      gamblerActions,
      inventoryActions,
      stashActions,
      mercenaryActions,
      trainingRanks,
      carriedEntries,
      vendorStock,
      vendorRefreshes,
      stashEntries,
      questOutcomeCount,
      shrineOutcomeCount,
      eventOutcomeCount,
      opportunityOutcomeCount,
      worldOutcomeCount,
      preferredClassName,
      planningLabels,
      nextTutorialLabel,
      missingHeroLife,
      missingMercenaryLife,
      missingBelt,
      spendablePointCount,
      progressionActionTitles,
      recoveryActionTitles,
      tradeActionTitles,
      mercenaryActionTitles,
      readinessIssues,
      readinessTone,
      readinessBadgeLabel,
      debugEnabled: appState.profile?.meta?.settings?.debugMode?.enabled ?? false,
      planning,
      review,
      stashSummary,
      planningOverview,
      plannedWeaponLabel,
      plannedArmorLabel,
      plannedRunewordLabels,
      charterStageLines,
      readyCharterCount,
      preparedCharterCount,
      townFeatureLabels,
      liveBonusBadgeLabel,
      liveBonusTone,
      equippedCount,
      nextPrepLabel,
      nextPrepTone,
      nextPrepCopy,
      nextPrepLines,
      routeProgressTone,
      objectiveTone,
      objectiveSummary,
      bossTone,
      bossBadgeLabel,
      companionTone,
      worldLedgerLines,
      departureBriefingLines,
    };
  }

  registryWindow.__ROUGE_SAFE_ZONE_OPS_MODEL = {
    createOperationsModel,
  };
})();
