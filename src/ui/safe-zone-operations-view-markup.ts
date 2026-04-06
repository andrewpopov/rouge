/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  function buildPrepComparisonMarkup(model: SafeZoneOperationsModel, appState: AppState, services: UiRenderServices): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const {
      derivedParty,
      routeSnapshot,
      accountSummary,
      carriedEntries,
      tradeActionTitles,
      spendablePointCount,
      missingHeroLife,
      missingMercenaryLife,
      missingBelt,
      stashEntries,
      stashSummary,
      planning,
      review,
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
    } = model;

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

  function buildWorldLedgerMarkup(worldLedgerLines: string[], renderUtils: RenderUtilsApi): string {
    if (worldLedgerLines.length === 0) {
      return '<p class="flow-copy">No world outcomes are logged on this run yet. Quest chains, shrine blessings, and aftermath nodes will all write back here.</p>';
    }

    return renderUtils.buildStringList(worldLedgerLines.slice(0, runtimeWindow.ROUGE_LIMITS.WORLD_OUTCOMES_LOG), "log-list reward-list ledger-list");
  }

  function buildDepartureBriefingMarkup(departureBriefingLines: string[], renderUtils: RenderUtilsApi): string {
    return renderUtils.buildStringList(
      departureBriefingLines,
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

  function buildOperationsSectionsFromModel(model: SafeZoneOperationsModel, appState: AppState, services: UiRenderServices) {
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
      tradeActionTitles,
      mercenaryActionTitles,
      readinessIssues,
      readinessTone,
      readinessBadgeLabel,
      debugEnabled,
      routeProgressTone,
      objectiveTone,
      objectiveSummary,
      bossTone,
      bossBadgeLabel,
      companionTone,
      worldLedgerLines,
      departureBriefingLines,
    } = model;
    const worldLedgerMarkup = buildWorldLedgerMarkup(worldLedgerLines, services.renderUtils);
    const departureBriefingMarkup = buildDepartureBriefingMarkup(departureBriefingLines, services.renderUtils);
    const loadoutBenchMarkup = buildLoadoutBenchMarkup(run, appState.content, services.renderUtils);
    const prepDeskMarkup = commonWithPrep.buildTownPrepOutcomeMarkup?.(
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
    ) || "";
    const accountMetaMarkup = `
      <article class="panel battle-panel" id="town-account">
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
        ${buildPrepComparisonMarkup(model, appState, services)}
        <div class="feature-grid feature-grid-wide town-operations-grid">
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
      </article>
    `;

    const debugLedgerMarkup = debugEnabled
      ? `
        <section class="panel flow-panel town-debug-ledger" id="town-debug-ledger">
          <div class="panel-head">
            <h2>Debug Ledger</h2>
            <p>Internal run, profile, and account continuity surfaces kept available for tuning, QA, and balance review.</p>
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
        </section>
      `
      : "";

    const departureMarkup = `
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
              ${buildBadge(bossBadgeLabel, bossTone)}
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
          <article class="feature-card">
            <strong>Departure Checklist</strong>
            ${departureBriefingMarkup}
          </article>
        </div>
        ${prepDeskMarkup}
      </article>
    `;

    const loadoutMarkup = `
      <article class="panel battle-panel" id="town-loadout-panel">
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
              ${buildStat("Hand+", common.getBonusValue(derivedParty.bonuses.heroHandSize))}
              ${buildStat("Merc Attack+", common.getBonusValue(derivedParty.bonuses.mercenaryAttack))}
              ${buildStat("Merc Life+", common.getBonusValue(derivedParty.bonuses.mercenaryMaxLife))}
            </div>
            <p>${escapeHtml(`Current loadout summary: ${derivedParty.loadoutLines.join(" / ") || "No equipment equipped yet."}`)}</p>
          </article>
        </div>
      </article>
    `;

    const servicesMarkup = `
      <article class="panel battle-panel" id="town-services">
        <div class="panel-head">
          <h2>Camp Services</h2>
          <p>Use this plain-language view when you want to see the desks that matter before you leave: healing, training, trade, mercenary support, and the final departure check.</p>
        </div>
        <div class="feature-grid feature-grid-wide" id="town-drilldowns">
          ${buildServiceDrilldownCard(
            "Healing Desk",
            missingHeroLife > 0 || missingMercenaryLife > 0 || missingBelt > 0 ? "Action Available" : "Stable",
            missingHeroLife > 0 || missingMercenaryLife > 0 || missingBelt > 0 ? "available" : "cleared",
            [
              { label: "Hero", value: `${derivedParty.hero.currentLife}/${derivedParty.hero.maxLife}` },
              { label: "Merc", value: `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}` },
              { label: "Belt", value: `${run.belt.current}/${run.belt.max}` },
              { label: "Actions", value: healerActions.length + quartermasterActions.length },
            ],
            [
              `Recovery options: ${common.getPreviewLabel(model.recoveryActionTitles, "none queued")}.`,
              `Hero missing ${missingHeroLife} Life, mercenary missing ${missingMercenaryLife}, belt missing ${missingBelt} charge${missingBelt === 1 ? "" : "s"}.`,
              "Use this desk first if you want a safer opening fight on the road.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Training Desk",
            spendablePointCount > 0 ? "Spend Pending" : "Spent Clean",
            spendablePointCount > 0 ? "available" : "cleared",
            [
              { label: "Skill", value: run.progression.skillPointsAvailable },
              { label: "Class", value: run.progression.classPointsAvailable },
              { label: "Attr", value: run.progression.attributePointsAvailable },
              { label: "Training", value: trainingRanks },
            ],
            [
              `Training options: ${common.getPreviewLabel(progressionActionTitles, "no spend actions")}.`,
              `Unlocked class skills ${run.progression.classProgression.unlockedSkillIds.length}, boss trophies ${run.progression.bossTrophies.length}.`,
              "Spend points here if you already know your next build step before leaving camp.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Trade Desk",
            tradeActionTitles.length > 0 ? `${tradeActionTitles.length} live` : "Quiet",
            tradeActionTitles.length > 0 ? "available" : "cleared",
            [
              { label: "Vendor", value: vendorStock },
              { label: "Carried", value: carriedEntries },
              { label: "Stash", value: stashEntries },
              { label: "Refresh", value: vendorRefreshes },
            ],
            [
              `Trade actions: ${common.getPreviewLabel(tradeActionTitles, "no open trade pressure")}.`,
              `Inventory pressure: ${carriedEntries} carried, ${stashEntries} stashed, ${vendorStock} offers on the board.`,
              "Sell, stash, or refresh here before you reopen the road.",
            ],
            services.renderUtils
          )}
          ${buildServiceDrilldownCard(
            "Mercenary Desk",
            mercenaryActions.length > 0 ? "Contract Open" : "Contract Stable",
            mercenaryActions.length > 0 ? companionTone : "cleared",
            [
              { label: "Merc", value: run.mercenary.name },
              { label: "Role", value: run.mercenary.role },
              { label: "Life", value: `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}` },
              { label: "Actions", value: mercenaryActions.length },
            ],
            [
              `Contract options: ${common.getPreviewLabel(mercenaryActionTitles, "no contract changes")}.`,
              `${run.mercenary.name} currently projects ${derivedParty.mercenary.attack} attack into the next combat.`,
              "Revive or adjust the contract here before you leave if you want mercenary support online.",
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

    return {
      departure: departureMarkup,
      loadout: loadoutMarkup,
      services: servicesMarkup,
      account: accountMetaMarkup,
      debug: debugLedgerMarkup,
    };
  }

  function buildOperationsMarkupFromModel(model: SafeZoneOperationsModel, appState: AppState, services: UiRenderServices): string {
    const sections = buildOperationsSectionsFromModel(model, appState, services);
    return `${sections.departure}${sections.loadout}${sections.services}${sections.account}${sections.debug}`;
  }

  runtimeWindow.__ROUGE_SAFE_ZONE_OPS_MARKUP = {
    buildOperationsSectionsFromModel,
    buildOperationsMarkupFromModel,
    buildPrepComparisonMarkup,
    buildWorldLedgerMarkup,
    buildDepartureBriefingMarkup,
    buildLoadoutBenchMarkup,
  };
})();
