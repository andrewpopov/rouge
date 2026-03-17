(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getTrainingRanks(run: RunState): number {
    return (["vitality", "focus", "command"] as const).reduce((total, track) => {
      return total + (Number.parseInt(String(run.progression?.training?.[track] ?? 0), 10) || 0);
    }, 0);
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
                `Current loadout: ${common.getPreviewLabel(derivedParty.loadoutLines, "no equipment equipped yet")}.`,
                `Active runewords: ${common.getPreviewLabel(derivedParty.activeRunewords, "none on this run yet")}.`,
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
                `Pinned charters: ${common.getPreviewLabel(plannedRunewordLabels, "none active")}.`,
                `Trade pressure: ${common.getPreviewLabel(tradeActionTitles, "no open trade or stash actions")}.`,
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
                `Town systems online: ${common.getPreviewLabel(townFeatureLabels, "none yet")}.`,
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

    return renderUtils.buildStringList(worldLines.slice(0, runtimeWindow.ROUGE_LIMITS.WORLD_OUTCOMES_LOG), "log-list reward-list ledger-list");
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

  runtimeWindow.__ROUGE_SAFE_ZONE_OPS_MARKUP = {
    buildPrepComparisonMarkup,
    buildWorldLedgerMarkup,
    buildDepartureBriefingMarkup,
    buildLoadoutBenchMarkup,
  };
})();
