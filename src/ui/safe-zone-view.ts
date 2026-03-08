(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getTrainingRanks(run: RunState): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(run.progression?.training?.[track] ?? 0), 10) || 0);
    }, 0);
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

  function buildTownDistrictMarkup(
    title: string,
    copy: string,
    actions: TownAction[],
    emptyCopy: string,
    renderCard: (action: TownAction) => string,
    gridClass = "feature-grid town-service-grid"
  ): string {
    // Districts are a presentation layer over existing town actions; the service modules still own execution.
    return `
      <article class="district-card">
        <div class="panel-head panel-head-compact">
          <h3>${title}</h3>
          <p>${copy}</p>
        </div>
        ${
          actions.length > 0
            ? `<div class="${gridClass}">${actions.map((action) => renderCard(action)).join("")}</div>`
            : `<p class="flow-copy">${emptyCopy}</p>`
        }
      </article>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
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
    const routeProgressTone =
      routeSnapshot.clearedZones === routeSnapshot.currentZones.length && routeSnapshot.currentZones.length > 0
        ? "cleared"
        : "available";
    const objectiveTone = routeSnapshot.nextZone || routeSnapshot.bossZone?.status === "available" ? "available" : "locked";
    const objectiveSummary = common.getObjectiveSummary(routeSnapshot);
    const bossTone = common.getBossStatusTone(routeSnapshot.bossZone?.status);
    const companionTone = run.mercenary.currentLife > 0 ? "available" : "locked";
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
    const worldLedgerMarkup = buildWorldLedgerMarkup(run, services.renderUtils);
    const departureBriefingMarkup = buildDepartureBriefingMarkup(run, routeSnapshot, derivedParty, worldOutcomeCount, services.renderUtils);
    const loadoutBenchMarkup = buildLoadoutBenchMarkup(run, appState.content, services.renderUtils);
    const profileSummary = services.appEngine.getProfileSummary(appState);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const preferredClassName =
      appState.registries.classes.find((entry) => entry.id === appState.profile?.meta?.progression?.preferredClassId)?.name || "Unset";
    const seenTutorialIds = appState.profile?.meta?.tutorials?.seenIds || [];
    const completedTutorialIds = appState.profile?.meta?.tutorials?.completedIds || [];
    const pendingTutorialIds = seenTutorialIds.filter((tutorialId) => !completedTutorialIds.includes(tutorialId));
    const nextTutorialLabel = pendingTutorialIds.length > 0 ? common.getTutorialLabel(pendingTutorialIds[0]) : "Town guidance is caught up";

    // This split makes the town read like a hub: route/build state on the left, actionable districts on the right.
    services.renderUtils.buildShell(root, {
      eyebrow: "Safe Zone",
      title: run.safeZoneName,
      copy:
        "Town is now organized as a real run hub. Recovery, training, stash, loadout, contracts, and departure planning all have clear homes while mutation still stays in the domain modules.",
      body: `
        ${common.renderRunStatus(run, "Safe Zone", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="safe-zone-grid">
          <article class="panel battle-panel">
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
                    `Town features online: ${(appState.profile?.meta?.unlocks?.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId)).slice(0, 3).join(", ") || "none yet"}.`,
                  ],
                  "log-list reward-list ledger-list"
                )}
              </article>
            </div>

            <div class="panel-head">
              <h2>Account Progression Focus</h2>
              <p>Town now exposes the live archive, economy, and mastery lanes that are shaping vendor pressure, archive retention, and reward pivots. Focus changes still route through the account seam, not the shell.</p>
            </div>
            ${common.buildAccountTreeReviewMarkup(accountSummary, services.renderUtils)}

            <div class="panel-head">
              <h2>Loadout Bench</h2>
              <p>Read the build before you leave. Equipped gear, sockets, runes, and runewords already feed the next combat state.</p>
            </div>
            <div class="selection-grid loadout-bench-grid">
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
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Town Districts</h2>
              <p>Each live service now has a named district. The shell groups recovery, supply, training, trade, stash, and companion management instead of flattening them into one list.</p>
            </div>
            <div class="district-grid">
              ${buildTownDistrictMarkup(
                "Recovery Ward",
                "Restore the party before re-entering the route.",
                healerActions,
                "No recovery actions are needed right now.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Quartermaster Stores",
                "Refill belt stock and stabilize the next departure.",
                quartermasterActions,
                "The belt is already full.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Training Hall",
                "Spend skill, class, and attribute points without moving build rules into the shell.",
                progressionActions,
                "No progression spend is available right now.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Vendor Arcade",
                "Buy upgrades or refresh the local stock.",
                vendorActions,
                "Vendor stock is empty.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Field Pack",
                "Equip, socket, sell, and stash carried entries before you leave.",
                inventoryActions,
                "No carried inventory actions are available.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Profile Vault",
                "Withdraw profile stash items into the live expedition.",
                stashActions,
                "The profile stash is empty.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Mercenary Barracks",
                "Swap contracts or revive a fallen companion without losing route progress.",
                mercenaryActions,
                "No mercenary actions are available.",
                (action) => services.renderUtils.buildMercenaryActionCard(action),
                "selection-grid selection-grid-mercs mercenary-hall-grid"
              )}
            </div>
            <div class="safe-zone-cta">
              <div>
                <p class="eyebrow">Departure Gate</p>
                <h3>${escapeHtml(routeSnapshot.nextZone?.title || "World Map")}</h3>
                <p class="service-subtitle">
                  ${escapeHtml(
                    routeSnapshot.nextZone
                      ? `Return to ${routeSnapshot.nextZone.title} with current map progress, loadout, and world outcomes intact.`
                      : "Open the map to read unlocked routes, side-node pressure, and boss access before leaving town."
                  )}
                </p>
              </div>
              <button class="primary-btn" data-action="leave-safe-zone">Step Onto The World Map</button>
            </div>
          </article>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_SAFE_ZONE_VIEW = {
    render,
  };
})();
