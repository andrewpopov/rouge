interface SafeZoneOperationsModel {
  run: RunState;
  derivedParty: DerivedPartyState;
  routeSnapshot: SafeZoneSnapshot;
  profileSummary: ProfileSummary;
  accountSummary: ProfileAccountSummary;
  townActions: TownAction[];
  healerActions: TownAction[];
  quartermasterActions: TownAction[];
  progressionActions: TownAction[];
  vendorActions: TownAction[];
  inventoryActions: TownAction[];
  stashActions: TownAction[];
  mercenaryActions: TownAction[];
  trainingRanks: number;
  carriedEntries: number;
  vendorStock: number;
  vendorRefreshes: number;
  stashEntries: number;
  questOutcomeCount: number;
  shrineOutcomeCount: number;
  eventOutcomeCount: number;
  opportunityOutcomeCount: number;
  worldOutcomeCount: number;
  preferredClassName: string;
  planningLabels: string[];
  nextTutorialLabel: string;
  missingHeroLife: number;
  missingMercenaryLife: number;
  missingBelt: number;
  spendablePointCount: number;
  progressionActionTitles: string[];
  recoveryActionTitles: string[];
  tradeActionTitles: string[];
  mercenaryActionTitles: string[];
  readinessIssues: string[];
  readinessTone: string;
  readinessBadgeLabel: string;
}

interface SafeZoneOperationsViewApi {
  createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel;
  buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string;
}

interface Window {
  ROUGE_SAFE_ZONE_OPERATIONS_VIEW: SafeZoneOperationsViewApi;
}

(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getTrainingRanks(run: RunState): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(run.progression?.training?.[track] ?? 0), 10) || 0);
    }, 0);
  }

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function buildServiceDrilldownCard(
    title: string,
    badgeLabel: string,
    badgeTone: string,
    stats: Array<{ label: string; value: string | number }>,
    lines: string[],
    renderUtils: RenderUtilsApi
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;

    return `
      <article class="feature-card service-focus-card">
        <div class="entity-name-row">
          <strong>${escapeHtml(title)}</strong>
          ${buildBadge(badgeLabel, badgeTone)}
        </div>
        <div class="entity-stat-grid">
          ${stats.map((stat) => buildStat(stat.label, stat.value)).join("")}
        </div>
        ${buildStringList(lines, "log-list reward-list ledger-list")}
      </article>
    `;
  }

  function buildWorldLedgerMarkup(run: RunState, renderUtils: RenderUtilsApi): string {
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
    const worldLines = [...questLines, ...shrineLines, ...eventLines, ...opportunityLines];

    if (worldLines.length === 0) {
      return '<p class="flow-copy">No world outcomes are logged on this run yet. Quest chains, shrine blessings, and aftermath nodes will all write back here.</p>';
    }

    return renderUtils.buildStringList(worldLines.slice(0, 6), "log-list reward-list ledger-list");
  }

  function buildDepartureBriefingMarkup(
    run: RunState,
    routeSnapshot: SafeZoneSnapshot,
    derivedParty: DerivedPartyState,
    worldOutcomeCount: number,
    renderUtils: RenderUtilsApi
  ): string {
    const missingHeroLife = Math.max(0, derivedParty.hero.maxLife - derivedParty.hero.currentLife);
    const missingMercenaryLife = Math.max(0, derivedParty.mercenary.maxLife - derivedParty.mercenary.currentLife);
    const missingBelt = Math.max(0, run.belt.max - run.belt.current);
    const nextRouteCopy = routeSnapshot.nextZone
      ? `Recommended next route: ${routeSnapshot.nextZone.title} is already open on the map.`
      : `${run.bossName} remains gated until more route pressure is cleared.`;

    return renderUtils.buildStringList(
      [
        nextRouteCopy,
        `Recovery still available: hero ${missingHeroLife} Life, mercenary ${missingMercenaryLife} Life, belt ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.`,
        `${worldOutcomeCount} world outcomes, ${run.progression.skillPointsAvailable} skill points, ${run.progression.classPointsAvailable} class points, ${run.progression.attributePointsAvailable} attribute points, and ${derivedParty.activeRunewords.length} active runewords all persist when you leave town.`,
      ],
      "log-list reward-list ledger-list"
    );
  }

  function buildLoadoutBenchMarkup(run: RunState, content: GameContent, renderUtils: RenderUtilsApi): string {
    const { buildBadge, buildStat, escapeHtml } = renderUtils;

    return ([
      { slot: "weapon", label: "Weapon" },
      { slot: "armor", label: "Armor" },
    ] as const)
      .map(({ slot, label }) => {
        const equipment = run.loadout?.[slot] || null;
        if (!equipment) {
          return `
            <article class="entity-card ally loadout-bench-card">
              <div class="entity-name-row">
                <strong class="entity-name">${escapeHtml(label)}</strong>
                ${buildBadge("Empty", "locked")}
              </div>
              <p class="service-subtitle">Open slot</p>
              <p class="entity-passive">Future rewards, vendor buys, or stash withdrawals can fill this slot and start a socket or runeword lane.</p>
            </article>
          `;
        }

        const item = content.itemCatalog?.[equipment.itemId] || null;
        const runeword = equipment.runewordId ? content.runewordCatalog?.[equipment.runewordId] || null : null;
        const runeNames = equipment.insertedRunes.map((runeId) => content.runeCatalog?.[runeId]?.name || runeId);

        return `
          <article class="entity-card ally loadout-bench-card">
            <div class="entity-name-row">
              <strong class="entity-name">${escapeHtml(item?.name || equipment.itemId)}</strong>
              ${buildBadge(runeword ? "Runeword Active" : label, runeword ? "cleared" : "available")}
            </div>
            <p class="service-subtitle">${escapeHtml(`${label} · ${item?.family || "Equipped slot"}`)}</p>
            <div class="entity-stat-grid">
              ${buildStat("Tier", item ? `Act ${item.actRequirement} / T${item.progressionTier}` : "Unknown")}
              ${buildStat("Sockets", `${equipment.insertedRunes.length}/${equipment.socketsUnlocked}/${item?.maxSockets || equipment.socketsUnlocked}`)}
              ${buildStat("Runes", runeNames.length)}
              ${buildStat("Runeword", runeword ? runeword.name : "Dormant")}
            </div>
            <p class="entity-passive">${escapeHtml(item?.summary || "Equipped gear persists across the run.")}</p>
            <p class="entity-passive">${escapeHtml(`Runes socketed: ${runeNames.length > 0 ? runeNames.join(", ") : "none"}.`)}</p>
          </article>
        `;
      })
      .join("");
  }

  function buildPrepComparisonMarkup(model: SafeZoneOperationsModel, appState: AppState, services: UiRenderServices): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const {
      run,
      derivedParty,
      routeSnapshot,
      accountSummary,
      carriedEntries,
      stashEntries,
      tradeActionTitles,
      readinessIssues,
      spendablePointCount,
      missingHeroLife,
      missingMercenaryLife,
      missingBelt,
    } = model;
    const stashSummary = accountSummary.stash || {
      entryCount: stashEntries,
      equipmentCount: 0,
      runeCount: 0,
      socketReadyEquipmentCount: 0,
      socketedRuneCount: 0,
      runewordEquipmentCount: 0,
      itemIds: [],
      runeIds: [],
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const review = accountSummary.review || {
      capstoneCount: 0,
      unlockedCapstoneCount: 0,
      blockedCapstoneCount: 0,
      readyCapstoneCount: 0,
      nextCapstoneId: "",
      nextCapstoneTitle: "",
      convergenceCount: 0,
      unlockedConvergenceCount: 0,
      blockedConvergenceCount: 0,
      availableConvergenceCount: 0,
      nextConvergenceId: "",
      nextConvergenceTitle: "",
    };
    const equippedCount = Object.values(run.loadout || {}).filter(Boolean).length;
    const plannedWeaponLabel = planning.weaponRunewordId ? appState.content.runewordCatalog?.[planning.weaponRunewordId]?.name || planning.weaponRunewordId : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? appState.content.runewordCatalog?.[planning.armorRunewordId]?.name || planning.armorRunewordId : "Unset";
    const plannedRunewordLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId);
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const planningOverview = planning.overview;
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;
    const townFeatureLabels = (appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const liveBonusBadgeLabel = review.availableConvergenceCount > 0 ? "Convergence Ready" : accountSummary.focusedTreeTitle || "Unset";
    let liveBonusTone = "locked";
    if (review.availableConvergenceCount > 0) {
      liveBonusTone = "available";
    } else if (accountSummary.focusedTreeId) {
      liveBonusTone = "cleared";
    }

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
        `Training ranks already banked: ${getTrainingRanks(run)}.`,
        `Focused tree momentum: ${accountSummary.focusedTreeTitle || "no focus"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
      ];
    } else if (tradeActionTitles.length > 0 || planning.plannedRunewordCount > 0) {
      nextPrepLabel = "Resolve Charter Pressure";
      nextPrepTone = tradeActionTitles.length > 0 || planningOverview.readyCharterCount > 0 || planningOverview.preparedCharterCount > 0 ? "available" : "locked";
      nextPrepCopy = planningOverview.nextActionSummary || "Carry, stash, and vendor pressure still matter for the next departure, especially if you are steering around a pinned runeword target.";
      nextPrepLines = [
        `Trade lane: ${getPreviewLabel(tradeActionTitles, "no open trade actions")}.`,
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

    return `
      <section class="panel flow-panel" id="town-prep-comparison">
        <div class="panel-head">
          <h2>Prep Comparison Board</h2>
          <p>Town now compares carried loadout, stash pressure, charter targets, and live account bonuses in one place so the next departure decision is readable instead of implied.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Loadout Vs Vault</strong>
              ${buildBadge(carriedEntries > 0 ? `${carriedEntries} carried` : "Packed Clean", carriedEntries > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Equipped", equippedCount)}
              ${buildStat("Carried", carriedEntries)}
              ${buildStat("Stash", stashEntries)}
              ${buildStat("Runewords", derivedParty.activeRunewords.length)}
            </div>
            ${buildStringList(
              [
                `Current loadout: ${getPreviewLabel(derivedParty.loadoutLines, "no equipment equipped yet")}.`,
                `Active runewords: ${getPreviewLabel(derivedParty.activeRunewords, "none on this run yet")}.`,
                `Vault reserve: ${stashSummary.equipmentCount} gear, ${stashSummary.runeCount} runes, ${stashSummary.socketReadyEquipmentCount} socket-ready bases.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Charter Pressure</strong>
              ${buildBadge(planning.plannedRunewordCount > 0 ? `${planning.plannedRunewordCount} live` : "Quiet", planning.plannedRunewordCount > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
            </div>
            ${buildStringList(
              [
                `Pinned charters: ${getPreviewLabel(plannedRunewordLabels, "none active")}.`,
                `Trade pressure: ${getPreviewLabel(tradeActionTitles, "no open trade or stash actions")}.`,
                `Next charter push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
                charterStageLines[0],
                charterStageLines[1],
                `Archive charter record: ${planning.fulfilledPlanCount} fulfilled, ${planning.unfulfilledPlanCount} missed.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Live Account Bonuses</strong>
              ${buildBadge(liveBonusBadgeLabel, liveBonusTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Hero Life+", common.getBonusValue(derivedParty.bonuses.heroMaxLife))}
              ${buildStat("Hero Energy+", common.getBonusValue(derivedParty.bonuses.heroMaxEnergy))}
              ${buildStat("Merc Attack+", common.getBonusValue(derivedParty.bonuses.mercenaryAttack))}
              ${buildStat("Merc Life+", common.getBonusValue(derivedParty.bonuses.mercenaryMaxLife))}
            </div>
            ${buildStringList(
              [
                `Focused tree: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
                `Next capstone: ${review.nextCapstoneTitle || "every current capstone is already online"}.`,
                `Next convergence: ${review.nextConvergenceTitle || "every current convergence is already online"}.`,
                `Town systems online: ${getPreviewLabel(townFeatureLabels, "none yet")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Prep Step</strong>
              ${buildBadge(nextPrepLabel, nextPrepTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Recovery", missingHeroLife + missingMercenaryLife + missingBelt)}
              ${buildStat("Spend", spendablePointCount)}
              ${buildStat("Trade", tradeActionTitles.length)}
              ${buildStat("Route", routeSnapshot.nextZone?.title || "Map")}
            </div>
            <p>${escapeHtml(nextPrepCopy)}</p>
            ${buildStringList(nextPrepLines, "log-list reward-list ledger-list")}
          </article>
        </div>
      </section>
    `;
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
    const inventoryActions = townActions.filter((action) => action.category === "inventory");
    const stashActions = townActions.filter((action) => action.category === "stash");
    const mercenaryActions = townActions.filter((action) => action.category === "mercenary");
    const routeSnapshot = common.buildSafeZoneSnapshot(run, services.runFactory);
    const trainingRanks = getTrainingRanks(run);
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
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Unset";
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const planningLabels = [planning.weaponRunewordId, planning.armorRunewordId]
      .filter(Boolean)
      .map((runewordId) => appState.content.runewordCatalog?.[runewordId]?.name || runewordId);
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
    };
  }

  function buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const commonWithPrep = common as UiCommonApi & {
      buildTownPrepOutcomeMarkup?: (
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
      ) => string;
    };
    const operations = model || createOperationsModel(appState, services);
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
    const {
      run,
      derivedParty,
      routeSnapshot,
      profileSummary,
      accountSummary,
      healerActions,
      quartermasterActions,
      progressionActions,
      vendorActions,
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
    } = operations;
    const routeProgressTone =
      routeSnapshot.clearedZones === routeSnapshot.currentZones.length && routeSnapshot.currentZones.length > 0
        ? "cleared"
        : "available";
    const objectiveTone = routeSnapshot.nextZone || routeSnapshot.bossZone?.status === "available" ? "available" : "locked";
    const objectiveSummary = common.getObjectiveSummary(routeSnapshot);
    const bossTone = common.getBossStatusTone(routeSnapshot.bossZone?.status);
    const companionTone = run.mercenary.currentLife > 0 ? "available" : "locked";
    const worldLedgerMarkup = buildWorldLedgerMarkup(run, services.renderUtils);
    const departureBriefingMarkup = buildDepartureBriefingMarkup(run, routeSnapshot, derivedParty, worldOutcomeCount, services.renderUtils);
    const loadoutBenchMarkup = buildLoadoutBenchMarkup(run, appState.content, services.renderUtils);
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const townJumpRow = `
      <div class="cta-row hall-jump-row">
        <a class="neutral-btn" href="#town-departure">Departure Board</a>
        <a class="neutral-btn" href="#town-loadout">Loadout Bench</a>
        <a class="neutral-btn" href="#town-prep-outcomes">Before / After Desk</a>
        <a class="neutral-btn" href="#town-drilldowns">Service Drilldowns</a>
        <a class="neutral-btn" href="#town-districts">Town Districts</a>
      </div>
    `;

    return `
      <article class="panel battle-panel" id="town-departure">
        <div class="panel-head">
          <h2>Departure Board</h2>
          <p>${escapeHtml(`${routeSnapshot.currentAct?.town || run.safeZoneName} anchors the act. Leave town only when the route, party, and build all read the way you want.`)}</p>
        </div>
        <div class="feature-grid feature-grid-wide town-ledger">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Route Progress</strong>
              ${buildBadge(`${routeSnapshot.clearedZones}/${routeSnapshot.currentZones.length} areas`, routeProgressTone)}
            </div>
            <p>${escapeHtml(`${routeSnapshot.encountersCleared}/${routeSnapshot.encounterTotal} encounters cleared in ${run.actTitle}.`)}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Objective</strong>
              ${buildBadge(objectiveSummary.badgeLabel, objectiveTone)}
            </div>
            <p>${escapeHtml(objectiveSummary.copy)}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Boss Gate</strong>
              ${buildBadge(common.getBossStatusLabel(routeSnapshot.bossZone?.status), bossTone)}
            </div>
            <p>${escapeHtml(`${run.bossName} waits beyond ${routeSnapshot.bossZone?.title || "the final route"}.`)}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Companion Status</strong>
              ${buildBadge(run.mercenary.currentLife > 0 ? "Ready" : "Downed", companionTone)}
            </div>
            <p>${escapeHtml(`${run.mercenary.name} is under contract as your ${run.mercenary.role.toLowerCase()}.`)}</p>
          </article>
        </div>

        <div class="panel-head">
          <h2>Town Navigator</h2>
          <p>Use these anchors to move between departure, loadout, prep drilldowns, and the live district list without losing the run-vs-profile framing.</p>
        </div>
        ${townJumpRow}

        <div class="panel-head">
          <h2>Run State Vs Profile State</h2>
          <p>The town shell separates what belongs to this expedition from what belongs to your account without pushing those rules into the view layer.</p>
        </div>
        <div class="front-door-snapshot-grid">
          <article class="feature-card">
            <strong>Run State</strong>
            <div class="entity-stat-grid">
              ${buildStat("Gold", run.gold)}
              ${buildStat("Deck", run.deck.length)}
              ${buildStat("Belt", `${run.belt.current}/${run.belt.max}`)}
              ${buildStat("Carried", carriedEntries)}
            </div>
            <p>Run-local inventory, route progress, town economy, loadout, and world outcomes all remain tied to the current expedition.</p>
          </article>
          <article class="feature-card">
            <strong>Profile State</strong>
            <div class="entity-stat-grid">
              ${buildStat("Stash", stashEntries)}
              ${buildStat("Archives", profileSummary.runHistoryCount)}
              ${buildStat("Preferred", preferredClassName)}
              ${buildStat("Highest Lv", profileSummary.highestLevel || 1)}
            </div>
            <p>${escapeHtml(`Profile stash, run history, class preference, and account hooks stay account-owned even while town is active. Highest act ${profileSummary.highestActCleared}, lifetime gold ${profileSummary.totalGoldCollected}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Progression Board</strong>
            <div class="entity-stat-grid">
              ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
              ${buildStat("Class Pts", run.progression.classPointsAvailable)}
              ${buildStat("Attr Pts", run.progression.attributePointsAvailable)}
              ${buildStat("Training", trainingRanks)}
            </div>
            <p>${escapeHtml(`Training ranks: Vitality ${run.progression.training.vitality}, Focus ${run.progression.training.focus}, Command ${run.progression.training.command}.`)}</p>
            <p>${escapeHtml(`Unlocked class skills ${run.progression.classProgression.unlockedSkillIds.length}, boss trophies ${run.progression.bossTrophies.length}.`)}</p>
          </article>
          <article class="feature-card">
            <strong>Departure Checklist</strong>
            ${departureBriefingMarkup}
          </article>
          <article class="feature-card">
            <strong>Account Signals</strong>
            <div class="entity-stat-grid">
              ${buildStat("Unlocks", profileSummary.unlockedClassCount + profileSummary.unlockedBossCount + profileSummary.unlockedRunewordCount)}
              ${buildStat("Features", profileSummary.townFeatureCount)}
              ${buildStat("Tutorials", `${profileSummary.completedTutorialCount}/${profileSummary.seenTutorialCount}`)}
              ${buildStat("Next Hint", nextTutorialLabel)}
            </div>
            ${buildStringList(
              [
                `Unlocked classes ${profileSummary.unlockedClassCount}, boss trophies ${profileSummary.unlockedBossCount}, runewords ${profileSummary.unlockedRunewordCount}.`,
                `Tutorials completed ${profileSummary.completedTutorialCount} of ${profileSummary.seenTutorialCount}, with ${Math.max(0, profileSummary.seenTutorialCount - profileSummary.completedTutorialCount)} still pending.`,
                `Focused tree ${accountSummary.focusedTreeTitle || "Unset"}, next milestone ${accountSummary.nextMilestoneTitle || "all cleared"}.`,
                `Planning charters: ${planningLabels.join(" / ") || "none active"}.`,
                `Town features online: ${(appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId)).slice(0, 3).join(", ") || "none yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>

        ${buildPrepComparisonMarkup(operations, appState, services)}

        ${
          commonWithPrep.buildTownPrepOutcomeMarkup?.(
            run,
            derivedParty,
            {
              healer: healerActions,
              quartermaster: quartermasterActions,
              progression: progressionActions,
              vendor: vendorActions,
              mercenary: mercenaryActions,
            },
            accountSummary,
            services.renderUtils
          ) || ""
        }

        ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
          copy:
            "Town keeps the same account-meta board live beside run-local prep, so archive pressure, charter staging, mastery focus, and convergence readiness stay readable before you leave again.",
        })}
        ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
          copy:
            "Town can now compare departure prep against account-side charter and convergence pressure without hiding the run-local service picture.",
          charterFollowThrough:
            "If charter pressure is louder than departure pressure, stay in town and use stash, vendor, or loadout actions before reopening the route.",
          convergenceFollowThrough:
            "If convergence pressure is ready, review the progression focus here before you spend gold or depart again.",
        })}

        <div class="panel-head">
          <h2>Account Progression Focus</h2>
          <p>Town now exposes the live archive, economy, and mastery lanes that are shaping vendor pressure, archive retention, and reward pivots. Focus changes still route through the account seam, not the shell.</p>
        </div>
        ${common.buildAccountTreeReviewMarkup(accountSummary, services.renderUtils)}

        <div class="panel-head">
          <h2>Loadout Bench</h2>
          <p>Read the build before you leave. Equipped gear, sockets, runes, and runewords already feed the next combat state.</p>
        </div>
        <div class="selection-grid loadout-bench-grid" id="town-loadout">
          ${loadoutBenchMarkup}
        </div>
        <div class="feature-grid feature-grid-wide town-operations-grid">
          <article class="feature-card">
            <strong>Active Runewords</strong>
            ${
              derivedParty.activeRunewords.length > 0
                ? buildStringList(derivedParty.activeRunewords, "log-list reward-list ledger-list")
                : '<p class="flow-copy">No active runewords are forged on this expedition yet.</p>'
            }
          </article>
          <article class="feature-card">
            <strong>Build Carry-Through</strong>
            <div class="entity-stat-grid">
              ${buildStat("Hero Life+", common.getBonusValue(derivedParty.bonuses.heroMaxLife))}
              ${buildStat("Hero Energy+", common.getBonusValue(derivedParty.bonuses.heroMaxEnergy))}
              ${buildStat("Merc Attack+", common.getBonusValue(derivedParty.bonuses.mercenaryAttack))}
              ${buildStat("Merc Life+", common.getBonusValue(derivedParty.bonuses.mercenaryMaxLife))}
            </div>
            <p>${escapeHtml(`Current loadout summary: ${derivedParty.loadoutLines.join(" / ") || "No equipment equipped yet."}`)}</p>
          </article>
          <article class="feature-card">
            <strong>World Ledger</strong>
            <div class="entity-stat-grid">
              ${buildStat("Quest", questOutcomeCount)}
              ${buildStat("Shrine", shrineOutcomeCount)}
              ${buildStat("Aftermath", eventOutcomeCount)}
              ${buildStat("Opportunity", opportunityOutcomeCount)}
            </div>
            ${worldLedgerMarkup}
          </article>
          <article class="feature-card">
            <strong>Town Economy</strong>
            <div class="entity-stat-grid">
              ${buildStat("Vendor", vendorStock)}
              ${buildStat("Refresh", vendorRefreshes)}
              ${buildStat("Carried", carriedEntries)}
              ${buildStat("Stash", stashEntries)}
            </div>
            <p>Vendor stock, carried inventory, and profile stash all resolve through town actions here instead of leaking into map or combat UI.</p>
          </article>
        </div>

        <div class="panel-head">
          <h2>Service Drilldowns</h2>
          <p>The hub now surfaces the most important prep comparisons directly: recovery, spend pressure, trade pressure, companion status, and whether it is actually time to leave town.</p>
        </div>
        <div class="feature-grid feature-grid-wide" id="town-drilldowns">
          ${buildServiceDrilldownCard(
            "Recovery Triage",
            missingHeroLife > 0 || missingMercenaryLife > 0 || missingBelt > 0 ? "Action Available" : "Stable",
            missingHeroLife > 0 || missingMercenaryLife > 0 || missingBelt > 0 ? "available" : "cleared",
            [
              { label: "Hero", value: `${derivedParty.hero.currentLife}/${derivedParty.hero.maxLife}` },
              { label: "Merc", value: `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}` },
              { label: "Belt", value: `${run.belt.current}/${run.belt.max}` },
              { label: "Actions", value: healerActions.length + quartermasterActions.length },
            ],
            [
              `Recovery actions: ${getPreviewLabel(recoveryActionTitles, "none queued")}.`,
              `Hero missing ${missingHeroLife} Life, mercenary missing ${missingMercenaryLife}, belt missing ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.`,
              "Use recovery before departure when preserving route momentum matters more than banking gold.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Build Spend Board",
            spendablePointCount > 0 ? "Spend Pending" : "Spent Clean",
            spendablePointCount > 0 ? "available" : "cleared",
            [
              { label: "Skill", value: run.progression.skillPointsAvailable },
              { label: "Class", value: run.progression.classPointsAvailable },
              { label: "Attr", value: run.progression.attributePointsAvailable },
              { label: "Training", value: trainingRanks },
            ],
            [
              `Training actions: ${getPreviewLabel(progressionActionTitles, "no spend actions")}.`,
              `Unlocked class skills ${run.progression.classProgression.unlockedSkillIds.length}, boss trophies ${run.progression.bossTrophies.length}.`,
              "Town only explains the spend pressure here. Progression ownership stays with the run systems.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Trade And Stash Pressure",
            tradeActionTitles.length > 0 ? `${tradeActionTitles.length} live` : "Quiet",
            tradeActionTitles.length > 0 ? "available" : "cleared",
            [
              { label: "Vendor", value: vendorStock },
              { label: "Carried", value: carriedEntries },
              { label: "Stash", value: stashEntries },
              { label: "Charters", value: planning.plannedRunewordCount },
            ],
            [
              `Trade actions: ${getPreviewLabel(tradeActionTitles, "no open trade pressure")}.`,
              `Planning charters: ${planningLabels.join(" / ") || "none active"}.`,
              "Review this lane before leaving when you want to pivot bases, socket pressure, or stash custody ahead of the next route.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Mercenary Contract Desk",
            mercenaryActions.length > 0 ? "Contract Open" : "Contract Stable",
            mercenaryActions.length > 0 ? companionTone : "cleared",
            [
              { label: "Merc", value: run.mercenary.name },
              { label: "Role", value: run.mercenary.role },
              { label: "Life", value: `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}` },
              { label: "Actions", value: mercenaryActions.length },
            ],
            [
              `Contract actions: ${getPreviewLabel(mercenaryActionTitles, "no contract changes")}.`,
              `${run.mercenary.name} currently projects ${derivedParty.mercenary.attack} attack into the next combat.`,
              "Revives and contract swaps remain town actions; this panel only clarifies the pressure before departure.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Ready To Leave Town?",
            readinessBadgeLabel,
            readinessTone,
            [
              { label: "Route", value: routeSnapshot.nextZone?.title || "Map Read" },
              { label: "World", value: worldOutcomeCount },
              { label: "Tutorial", value: nextTutorialLabel },
              { label: "Issues", value: Math.max(0, readinessIssues.length - 1) },
            ],
            readinessIssues,
            services.renderUtils
          )}
        </div>
      </article>
    `;
  }

  runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW = {
    createOperationsModel,
    buildOperationsMarkup,
  };
})();
