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
      return '<p class="flow-copy">No quest, shrine, aftermath, or opportunity outcomes are logged on this run yet.</p>';
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
      ? `Next route: ${routeSnapshot.nextZone.title} is open on the world map.`
      : `${run.bossName} stays gated until more route progress is cleared.`;

    return renderUtils.buildStringList(
      [
        nextRouteCopy,
        `Recovery still available in town: hero ${missingHeroLife} life, mercenary ${missingMercenaryLife} life, belt ${missingBelt} charges.`,
        `${worldOutcomeCount} world outcomes, ${run.progression.skillPointsAvailable} skill points, ${run.progression.classPointsAvailable} class points, ${run.progression.attributePointsAvailable} attribute points, and ${derivedParty.activeRunewords.length} active runewords persist when you leave town.`,
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
              <p class="service-subtitle">No gear equipped</p>
              <p class="entity-passive">Reward choices can equip an item here, unlock sockets, and begin a future runeword route.</p>
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
            <p class="entity-passive">${escapeHtml(`Runes: ${runeNames.length > 0 ? runeNames.join(", ") : "none socketed yet"}.`)}</p>
          </article>
        `;
      })
      .join("");
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat, buildStringList } = services.renderUtils;
    const run = appState.run;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const townActions = services.townServices.listActions(appState.content, run, appState.profile);
    const serviceActions = townActions.filter((action) => action.category === "service");
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
    const missingHeroLife = Math.max(0, derivedParty.hero.maxLife - derivedParty.hero.currentLife);
    const missingMercenaryLife = Math.max(0, derivedParty.mercenary.maxLife - derivedParty.mercenary.currentLife);
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

    services.renderUtils.buildShell(root, {
      eyebrow: "Safe Zone",
      title: run.safeZoneName,
      copy:
        "Town now works like a real run hub. Recovery, supply, contract changes, and route planning stay in the safe zone while map progress remains on the run.",
      body: `
        ${common.renderRunStatus(run, "Safe Zone", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="safe-zone-grid">
          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Town Square</h2>
              <p>${escapeHtml(routeSnapshot.currentAct?.town || run.safeZoneName)} anchors the act loop. Review the route, then leave town without resetting area progress.</p>
            </div>
            <div class="feature-grid town-ledger">
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
                  <strong>Boss Watch</strong>
                  ${buildBadge(common.getBossStatusLabel(routeSnapshot.bossZone?.status), bossTone)}
                </div>
                <p>${escapeHtml(`${run.bossName} waits beyond ${routeSnapshot.bossZone?.title || "the final route"}.`)}</p>
              </article>
              <article class="feature-card">
                <div class="entity-name-row">
                  <strong>Companion Status</strong>
                  ${buildBadge(run.mercenary.currentLife > 0 ? "Active" : "Downed", companionTone)}
                </div>
                <p>${escapeHtml(`${run.mercenary.name} is your current ${run.mercenary.role.toLowerCase()} contract.`)}</p>
              </article>
            </div>

            <div class="panel-head">
              <h2>Party Contract</h2>
              <p>Your party state now belongs to the run, not to a single encounter.</p>
            </div>
            <div class="entity-row">
              <article class="entity-card ally">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(run.hero.name)}</strong>
                  <span class="entity-role">${escapeHtml(run.className)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${derivedParty.hero.currentLife}/${derivedParty.hero.maxLife}`)}
                  ${buildStat("Energy", derivedParty.hero.maxEnergy)}
                  ${buildStat("Potion", derivedParty.hero.potionHeal)}
                  ${buildStat("Belt", `${run.belt.current}/${run.belt.max}`)}
                </div>
                <p class="entity-passive">Class shell loaded from seed data. Deck profile comes from the class registry adapter.</p>
              </article>
              <article class="entity-card ally">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(run.mercenary.name)}</strong>
                  <span class="entity-role">${escapeHtml(run.mercenary.role)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${derivedParty.mercenary.currentLife}/${derivedParty.mercenary.maxLife}`)}
                  ${buildStat("Attack", derivedParty.mercenary.attack)}
                  ${buildStat("Behavior", run.mercenary.behavior)}
                  ${buildStat("Deck", run.deck.length)}
                </div>
                <p class="entity-passive">${escapeHtml(run.mercenary.passiveText)}</p>
              </article>
            </div>

            <div class="feature-grid town-operations-grid">
              <article class="feature-card">
                <strong>Recovery State</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Hero Heal", missingHeroLife)}
                  ${buildStat("Merc Heal", missingMercenaryLife)}
                  ${buildStat("Belt Fill", Math.max(0, run.belt.max - run.belt.current))}
                  ${buildStat("Gold", run.gold)}
                </div>
                <p>Healing, belt refill, and mercenary recovery are all town-owned actions. Route progress stays untouched when you use them.</p>
              </article>
              <article class="feature-card">
                <strong>Progression Board</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
                  ${buildStat("Class Pts", run.progression.classPointsAvailable)}
                  ${buildStat("Attr Pts", run.progression.attributePointsAvailable)}
                  ${buildStat("Training", trainingRanks)}
                </div>
                <p>${escapeHtml(`Training tracks: Vitality ${run.progression.training.vitality}, Focus ${run.progression.training.focus}, Command ${run.progression.training.command}.`)}</p>
                <p>${escapeHtml(`Unlocked class skills ${run.progression.classProgression.unlockedSkillIds.length}, boss trophies ${run.progression.bossTrophies.length}, active runewords ${derivedParty.activeRunewords.length}.`)}</p>
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
                  ${buildStat("Carried", carriedEntries)}
                  ${buildStat("Stash", stashEntries)}
                  ${buildStat("Vendor", vendorStock)}
                  ${buildStat("Refresh", vendorRefreshes)}
                </div>
                <p>Vendor stock, carried inventory, profile stash, and training spend paths now all resolve through the same safe-zone action seam.</p>
              </article>
              <article class="feature-card">
                <strong>Persists On The Run</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Route", `${routeSnapshot.clearedZones}/${routeSnapshot.currentZones.length}`)}
                  ${buildStat("World", worldOutcomeCount)}
                  ${buildStat("Loadout", derivedParty.loadoutLines.length)}
                  ${buildStat("Runes", derivedParty.activeRunewords.length)}
                </div>
                <p>Route progress, world outcomes, training, equipment, runes, and runewords all remain on the run after you leave town.</p>
              </article>
              <article class="feature-card">
                <strong>Departure Briefing</strong>
                ${departureBriefingMarkup}
              </article>
            </div>
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Loadout Bench</h2>
              <p>Equipment, sockets, inserted runes, and active runewords are visible here before you leave town.</p>
            </div>
            <div class="selection-grid loadout-bench-grid">
              ${loadoutBenchMarkup}
            </div>
            <div class="feature-grid">
              <article class="feature-card">
                <strong>Active Runewords</strong>
                ${
                  derivedParty.activeRunewords.length > 0
                    ? buildStringList(derivedParty.activeRunewords, "log-list reward-list ledger-list")
                    : '<p class="flow-copy">No active runewords are forged on this run yet.</p>'
                }
              </article>
              <article class="feature-card">
                <strong>Build Carry-Through</strong>
                <p>
                  Equipment and runes already modify the next encounter. Hero skill damage +${escapeHtml(common.getBonusValue(derivedParty.bonuses.heroDamageBonus))},
                  Guard +${escapeHtml(common.getBonusValue(derivedParty.bonuses.heroGuardBonus))},
                  Burn +${escapeHtml(common.getBonusValue(derivedParty.bonuses.heroBurnBonus))}.
                </p>
                <p>${escapeHtml(`Current loadout summary: ${derivedParty.loadoutLines.join(" / ") || "No equipment equipped yet."}`)}</p>
              </article>
            </div>
            <div class="panel-head">
              <h2>Town Services</h2>
              <p>Recovery, supplies, and mercenary management stay here so the world map only owns route selection.</p>
            </div>
            <div class="feature-grid town-service-grid">
              ${serviceActions.map((action) => services.renderUtils.buildTownActionCard(action)).join("")}
            </div>
            ${
              progressionActions.length > 0
                ? `
            <div class="panel-head">
              <h2>Progression Hall</h2>
              <p>Skill, class, and attribute points all resolve through domain actions here instead of pushing build rules into the shell.</p>
            </div>
            <div class="feature-grid town-service-grid">
              ${progressionActions.map((action) => services.renderUtils.buildTownActionCard(action)).join("")}
            </div>
            `
                : ""
            }
            ${
              vendorActions.length > 0
                ? `
            <div class="panel-head">
              <h2>Vendor Stock</h2>
              <p>Buying, selling, and refresh pricing stay inside the town and item domain modules.</p>
            </div>
            <div class="feature-grid town-service-grid">
              ${vendorActions.map((action) => services.renderUtils.buildTownActionCard(action)).join("")}
            </div>
            `
                : ""
            }
            ${
              inventoryActions.length > 0
                ? `
            <div class="panel-head">
              <h2>Inventory Bench</h2>
              <p>Equip, socket, sell, and stash carried entries without pushing inventory rules into combat or UI files.</p>
            </div>
            <div class="feature-grid town-service-grid">
              ${inventoryActions.map((action) => services.renderUtils.buildTownActionCard(action)).join("")}
            </div>
            `
                : ""
            }
            ${
              stashActions.length > 0
                ? `
            <div class="panel-head">
              <h2>Stash</h2>
              <p>Profile-level stash entries can be withdrawn into the current run from any safe zone.</p>
            </div>
            <div class="feature-grid town-service-grid">
              ${stashActions.map((action) => services.renderUtils.buildTownActionCard(action)).join("")}
            </div>
            `
                : ""
            }
            <div class="panel-head">
              <h2>Mercenary Hall</h2>
              <p>Switch contracts or revive a fallen companion without giving up current act progress.</p>
            </div>
            <div class="selection-grid selection-grid-mercs mercenary-hall-grid">
              ${mercenaryActions.map((action) => services.renderUtils.buildMercenaryActionCard(action)).join("")}
            </div>
            <div class="safe-zone-cta">
              <div>
                <p class="eyebrow">Departure Gate</p>
                <h3>${escapeHtml(routeSnapshot.nextZone?.title || "World Map")}</h3>
                <p class="service-subtitle">
                  ${escapeHtml(
                    routeSnapshot.nextZone
                      ? `Return to ${routeSnapshot.nextZone.title} with current progress intact.`
                      : "Open the world map to review unlocked routes and boss access."
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
