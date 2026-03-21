(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { getTrainingRankCount } = runtimeWindow.ROUGE_RUN_STATE;

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
    };
  }

  function buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const opsMarkup = runtimeWindow.__ROUGE_SAFE_ZONE_OPS_MARKUP;
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
    const worldLedgerMarkup = opsMarkup.buildWorldLedgerMarkup(run, services.renderUtils);
    const departureBriefingMarkup = opsMarkup.buildDepartureBriefingMarkup(run, routeSnapshot, derivedParty, worldOutcomeCount, services.renderUtils);
    const loadoutBenchMarkup = opsMarkup.buildLoadoutBenchMarkup(run, appState.content, services.renderUtils);
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
                `Town features online: ${(appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId)).slice(0, runtimeWindow.ROUGE_LIMITS.TOWN_FEATURES_PREVIEW).join(", ") || "none yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>

        ${opsMarkup.buildPrepComparisonMarkup(operations, appState, services)}

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
              `Recovery actions: ${common.getPreviewLabel(recoveryActionTitles, "none queued")}.`,
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
              `Training actions: ${common.getPreviewLabel(progressionActionTitles, "no spend actions")}.`,
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
              `Trade actions: ${common.getPreviewLabel(tradeActionTitles, "no open trade pressure")}.`,
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
              `Contract actions: ${common.getPreviewLabel(mercenaryActionTitles, "no contract changes")}.`,
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
