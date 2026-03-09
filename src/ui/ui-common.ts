(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getServices(): UiRenderServices {
    return {
      appEngine: runtimeWindow.ROUGE_APP_ENGINE,
      classRegistry: runtimeWindow.ROUGE_CLASS_REGISTRY,
      combatEngine: runtimeWindow.ROUGE_COMBAT_ENGINE,
      itemSystem: runtimeWindow.ROUGE_ITEM_SYSTEM,
      renderUtils: runtimeWindow.ROUGE_RENDER_UTILS,
      runFactory: runtimeWindow.ROUGE_RUN_FACTORY,
      townServices: runtimeWindow.ROUGE_TOWN_SERVICES,
    };
  }

  function getBonusValue(value: unknown): number {
    return Number.parseInt(String(value ?? 0), 10) || 0;
  }

  function getConvergenceTone(convergence: ProfileAccountConvergenceSummary): string {
    if (convergence.unlocked) {
      return "cleared";
    }
    if (convergence.status === "available") {
      return "available";
    }
    return "locked";
  }

  function getConvergenceBadgeLabel(convergence: ProfileAccountConvergenceSummary): string {
    if (convergence.unlocked) {
      return "Unlocked";
    }
    if (convergence.status === "available") {
      return `${convergence.unlockedRequirementCount}/${convergence.requiredFeatureCount} Ready`;
    }
    return "Locked";
  }

  function getConvergenceStatusLabel(convergence: ProfileAccountConvergenceSummary): string {
    if (convergence.unlocked) {
      return "Unlocked";
    }
    if (convergence.status === "available") {
      return "Available";
    }
    return "Locked";
  }

  function getDerivedPartyState(run: RunState, content: GameContent, itemSystem: ItemSystemApi): DerivedPartyState {
    const bonuses = runtimeWindow.ROUGE_RUN_FACTORY?.buildCombatBonuses?.(run, content) || itemSystem?.buildCombatBonuses(run, content) || {};
    const heroMaxLife = run.hero.maxLife + getBonusValue(bonuses.heroMaxLife);
    const heroMaxEnergy = run.hero.maxEnergy + getBonusValue(bonuses.heroMaxEnergy);
    const heroPotionHeal = run.hero.potionHeal + getBonusValue(bonuses.heroPotionHeal);
    const mercenaryMaxLife = run.mercenary.maxLife + getBonusValue(bonuses.mercenaryMaxLife);
    const mercenaryAttack = run.mercenary.attack + getBonusValue(bonuses.mercenaryAttack);

    return {
      hero: {
        currentLife: Math.min(run.hero.currentLife, heroMaxLife),
        maxLife: heroMaxLife,
        maxEnergy: heroMaxEnergy,
        potionHeal: heroPotionHeal,
      },
      mercenary: {
        currentLife: Math.min(run.mercenary.currentLife, mercenaryMaxLife),
        maxLife: mercenaryMaxLife,
        attack: mercenaryAttack,
      },
      loadoutLines: itemSystem?.getLoadoutSummary(run, content) || [],
      activeRunewords: itemSystem?.getActiveRunewords(run, content) || [],
      bonuses,
    };
  }

  function renderBootState(root: HTMLElement, bootState: BootState, renderUtils: RenderUtilsApi): void {
    const { escapeHtml } = renderUtils;
    if (bootState.status === "error") {
      renderUtils.buildShell(root, {
        eyebrow: "Boot Error",
        title: "The Account Hall Failed To Open",
        copy: bootState.error || "Rouge could not finish loading the seed data bundle required to build the shell.",
        body: `
          <section class="panel flow-panel">
            <div class="panel-head">
              <h2>Boot Failure</h2>
              <p>The shell cannot initialize without class, route, and content registries.</p>
            </div>
            <p class="flow-copy">${escapeHtml(bootState.error)}</p>
          </section>
        `,
      });
      return;
    }

    renderUtils.buildShell(root, {
      eyebrow: "Boot",
      title: "Opening The Account Hall",
      copy: "Initializing the seed bundle, class registry, run factory, and the phase-driven shell that carries the run from front door to archive.",
      body: `
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Starting Up</h2>
            <p>The live shell will move through front door, character select, town, world map, encounter, reward, and run-end review once the registries are ready.</p>
          </div>
          <p class="flow-copy">Loading classes, zones, monsters, items, runes, runewords, bosses, and world-node hooks from the seed bundle.</p>
        </section>
      `,
    });
  }

  function renderRunStatus(run: RunState, phaseLabel: string, renderUtils: RenderUtilsApi): string {
    const { escapeHtml } = renderUtils;
    if (!run) {
      return "";
    }

    return `
      <section class="status-strip panel status-strip-wide">
        <div class="status-item">
          <span class="status-label">Phase</span>
          <strong>${escapeHtml(phaseLabel)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Class</span>
          <strong>${escapeHtml(run.className)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Act</span>
          <strong>${escapeHtml(run.actTitle)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Gold</span>
          <strong>${escapeHtml(run.gold)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Deck</span>
          <strong>${escapeHtml(run.deck.length)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Level</span>
          <strong>${escapeHtml(run.level)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">XP</span>
          <strong>${escapeHtml(run.xp)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Skill Pts</span>
          <strong>${escapeHtml(run.progression.skillPointsAvailable)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Belt</span>
          <strong>${escapeHtml(`${run.belt.current}/${run.belt.max}`)}</strong>
        </div>
      </section>
    `;
  }

  function renderNotice(appState: AppState, renderUtils: RenderUtilsApi): string {
    return renderUtils.buildNoticePanel(appState?.error || "", "Notice");
  }

  function buildSafeZoneSnapshot(run: RunState, runFactory: RunFactoryApi): SafeZoneSnapshot {
    const currentAct = runFactory.getCurrentAct(run);
    const currentZones = runFactory.getCurrentZones(run);
    const reachableZones = runFactory.getReachableZones(run).filter((zone) => zone.status === "available");
    const clearedZones = currentZones.filter((zone) => zone.cleared).length;
    const encountersCleared = currentZones.reduce((total, zone) => total + zone.encountersCleared, 0);
    const encounterTotal = currentZones.reduce((total, zone) => total + zone.encounterTotal, 0);
    const bossZone = currentZones.find((zone) => zone.kind === "boss") || currentZones[currentZones.length - 1] || null;
    const nextZone = reachableZones[0] || null;

    return {
      currentAct,
      currentZones,
      reachableZones,
      clearedZones,
      encountersCleared,
      encounterTotal,
      bossZone,
      nextZone,
    };
  }

  function getBossStatusTone(status: string | undefined): string {
    if (status === "cleared") {
      return "cleared";
    }
    if (status === "available") {
      return "available";
    }
    return "locked";
  }

  function getBossStatusLabel(status: string | undefined): string {
    if (status === "cleared") {
      return "Cleared";
    }
    if (status === "available") {
      return "Unlocked";
    }
    return "Locked";
  }

  function getObjectiveSummary(routeSnapshot: SafeZoneSnapshot): ObjectiveSummary {
    if (routeSnapshot.nextZone) {
      return {
        badgeLabel: `${routeSnapshot.reachableZones.length} open`,
        copy: `${routeSnapshot.nextZone.title} is ready on the world map.`,
      };
    }

    if (routeSnapshot.bossZone?.status === "available") {
      return {
        badgeLabel: "Boss ready",
        copy: `${routeSnapshot.bossZone.title} has unlocked for this act.`,
      };
    }

    return {
      badgeLabel: "Prepare",
      copy: "No new route is unlocked yet. Recover and check supplies before heading out.",
    };
  }

  function getTownFeatureLabel(featureId: string): string {
    switch (featureId) {
      case "front_door_profile_hall":
        return "Account Hall";
      case "safe_zone_services":
        return "Safe-Zone Services";
      case "vendor_economy":
        return "Vendor Economy";
      case "profile_stash":
        return "Profile Stash";
      case "mercenary_contracts":
        return "Mercenary Contracts";
      case "class_progression":
        return "Class Progression";
      case "archive_ledger":
        return "Archive Ledger";
      case "chronicle_vault":
        return "Chronicle Vault";
      case "heroic_annals":
        return "Heroic Annals";
      case "mythic_annals":
        return "Mythic Annals";
      case "eternal_annals":
        return "Eternal Annals";
      case "chronicle_exchange":
        return "Chronicle Exchange";
      case "boss_trophy_gallery":
        return "Boss Trophy Gallery";
      case "runeword_codex":
        return "Runeword Codex";
      case "advanced_vendor_stock":
        return "Advanced Vendor Stock";
      case "class_roster_archive":
        return "Class Roster Archive";
      case "economy_ledger":
        return "Economy Ledger";
      case "salvage_tithes":
        return "Salvage Tithes";
      case "artisan_stock":
        return "Artisan Stock";
      case "brokerage_charter":
        return "Brokerage Charter";
      case "treasury_exchange":
        return "Treasury Exchange";
      case "training_grounds":
        return "Training Grounds";
      case "war_college":
        return "War College";
      case "paragon_doctrine":
        return "Paragon Doctrine";
      case "apex_doctrine":
        return "Apex Doctrine";
      case "war_annals":
        return "War Annals";
      case "paragon_exchange":
        return "Paragon Exchange";
      default:
        return featureId
          .split("_")
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(" ");
    }
  }

  function getTutorialLabel(tutorialId: string): string {
    switch (tutorialId) {
      case "front_door_profile_hall":
        return "Account Hall Orientation";
      case "first_run_overview":
        return "First Run Overview";
      case "safe_zone_progression_board":
        return "Progression Board";
      case "profile_stash":
        return "Profile Stash";
      case "safe_zone_vendor_economy":
        return "Vendor Economy";
      case "runeword_forging":
        return "Runeword Forging";
      case "world_node_rewards":
        return "World Node Rewards";
      default:
        return tutorialId
          .split("_")
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(" ");
    }
  }

  function humanizeId(id: string): string {
    return id
      .split("_")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function getPlanningCharterStageLines(planning: ProfilePlanningSummary | null, content: GameContent | null): string[] {
    const normalizedPlanning = planning || null;
    const buildStageLine = (slotLabel: string, runewordId: string, charter?: ProfilePlanningCharterSummary) => {
      const activeRunewordId = charter?.runewordId || runewordId;
      if (!activeRunewordId) {
        return `${slotLabel} charter staging: no ${slotLabel.toLowerCase()} charter pinned.`;
      }

      const runewordLabel = content?.runewordCatalog?.[activeRunewordId]?.name || humanizeId(activeRunewordId);
      const readyCount = getBonusValue(charter?.readyBaseCount);
      const preparedCount = getBonusValue(charter?.preparedBaseCount);
      const bestBaseLabel = charter?.bestBaseItemId
        ? content?.itemCatalog?.[charter.bestBaseItemId]?.name || humanizeId(charter.bestBaseItemId)
        : "best base not parked yet";
      return `${slotLabel} charter staging: ${runewordLabel} -> ${readyCount} ready, ${preparedCount} prepared, ${bestBaseLabel}.`;
    };

    return [
      buildStageLine("Weapon", normalizedPlanning?.weaponRunewordId || "", normalizedPlanning?.weaponCharter),
      buildStageLine("Armor", normalizedPlanning?.armorRunewordId || "", normalizedPlanning?.armorCharter),
    ];
  }

  function getAccountTreeTone(tree: ProfileAccountTreeSummary | null): string {
    if (!tree) {
      return "locked";
    }
    if (tree.currentRank >= tree.maxRank && tree.maxRank > 0) {
      return "cleared";
    }
    if (tree.isFocused || tree.currentRank > 0) {
      return "available";
    }
    return "locked";
  }

  function getNextAccountTreeMilestone(tree: ProfileAccountTreeSummary | null): ProfileAccountMilestoneSummary | null {
    return tree?.milestones?.find((milestone) => milestone.status === "available") || tree?.milestones?.find((milestone) => !milestone.unlocked) || null;
  }

  function buildAccountTreeReviewMarkup(
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountTreeReviewOptions = {}
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    const showControls = options.showControls !== false;
    const trees = Array.isArray(accountSummary?.trees) ? accountSummary.trees : [];
    const focusedTree = trees.find((tree) => tree.isFocused) || trees[0] || null;
    const nextMilestone = getNextAccountTreeMilestone(focusedTree);
    const review = accountSummary?.review || {
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
    const convergences = Array.isArray(accountSummary?.convergences) ? accountSummary.convergences : [];

    if (trees.length === 0) {
      return '<p class="flow-copy">Account progression trees have not unlocked yet.</p>';
    }

    return `
      <div class="feature-grid feature-grid-wide">
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Focused Tree</strong>
            ${buildBadge(accountSummary.focusedTreeTitle || "Unset", getAccountTreeTone(focusedTree))}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Trees", accountSummary.treeCount)}
            ${buildStat("Milestones", `${accountSummary.unlockedMilestoneCount}/${accountSummary.milestoneCount}`)}
            ${buildStat("Capstones", `${review.unlockedCapstoneCount}/${review.capstoneCount}`)}
            ${buildStat("Convergences", `${review.unlockedConvergenceCount}/${review.convergenceCount}`)}
            ${buildStat("Archive Cap", accountSummary.runHistoryCapacity)}
          </div>
          <p>${escapeHtml(focusedTree?.description || "Focus can be redirected between archive, economy, and mastery lanes.")}</p>
          <p>${escapeHtml(nextMilestone ? `Next milestone: ${nextMilestone.title}.` : "All account milestones are currently unlocked.")}</p>
          <p>${escapeHtml(review.nextCapstoneTitle ? `Next capstone: ${review.nextCapstoneTitle}.` : "Every current capstone is already online.")}</p>
          <p>${escapeHtml(review.nextConvergenceTitle ? `Next convergence: ${review.nextConvergenceTitle}.` : "Every current cross-tree convergence is already online.")}</p>
          ${
            showControls
              ? `
                  <div class="cta-row">
                    ${trees
                      .map((tree) => {
                        const buttonClass = tree.isFocused ? "primary-btn" : "neutral-btn";
                        const buttonLabel = tree.isFocused ? `Focused: ${tree.title}` : `Focus ${tree.title}`;
                        return `<button class="${buttonClass}" data-action="set-account-progression-focus" data-account-tree-id="${tree.id}">${escapeHtml(buttonLabel)}</button>`;
                      })
                      .join("")}
                  </div>
                `
              : ""
          }
        </article>
        ${trees
          .map((tree) => {
            const treeNextMilestone = getNextAccountTreeMilestone(tree);
            const unlockedFeatureLabels = (tree.unlockedFeatureIds || []).map((featureId) => getTownFeatureLabel(featureId));
            let capstoneBadgeLabel = "No Capstone";
            if (tree.capstoneTitle) {
              if (tree.capstoneUnlocked) {
                capstoneBadgeLabel = `Capstone: ${tree.capstoneTitle}`;
              } else if (tree.capstoneStatus === "available") {
                capstoneBadgeLabel = `Capstone Ready: ${tree.capstoneTitle}`;
              } else {
                capstoneBadgeLabel = `Capstone Locked: ${tree.capstoneTitle}`;
              }
            }
            const blockedMilestone = tree.milestones.find((milestone) => milestone.status === "locked") || null;

            return `
              <article class="feature-card">
                <div class="entity-name-row">
                  <strong>${escapeHtml(tree.title)}</strong>
                  ${buildBadge(tree.isFocused ? "Focused" : `Rank ${tree.currentRank}/${tree.maxRank}`, getAccountTreeTone(tree))}
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Rank", `${tree.currentRank}/${tree.maxRank}`)}
                  ${buildStat("Unlocked", tree.unlockedFeatureIds.length)}
                  ${buildStat("Ready", tree.eligibleMilestoneCount)}
                  ${buildStat("Blocked", tree.blockedMilestoneCount)}
                  ${buildStat("Focus", tree.isFocused ? "Active" : "Standby")}
                </div>
                ${buildStringList(
                  [
                    tree.description,
                    capstoneBadgeLabel,
                    `Unlocked features: ${getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                    `Next milestone: ${treeNextMilestone ? `${treeNextMilestone.title} (${treeNextMilestone.progress}/${treeNextMilestone.target})` : "All milestones cleared."}`,
                    blockedMilestone ? `Blocked by prerequisites: ${blockedMilestone.blockedByTitles.join(", ")}.` : "No prerequisite blocks remain in this tree.",
                  ],
                  "log-list reward-list ledger-list"
                )}
              </article>
            `;
          })
          .join("")}
        ${
          convergences.length > 0
            ? convergences
                .map((convergence) => {
                  const convergenceTone = getConvergenceTone(convergence);
                  return `
                    <article class="feature-card">
                      <div class="entity-name-row">
                        <strong>${escapeHtml(convergence.title)}</strong>
                        ${buildBadge(getConvergenceBadgeLabel(convergence), convergenceTone)}
                      </div>
                      <div class="entity-stat-grid">
                        ${buildStat("Requirements", `${convergence.unlockedRequirementCount}/${convergence.requiredFeatureCount}`)}
                        ${buildStat("Missing", convergence.missingFeatureIds.length)}
                        ${buildStat("Status", getConvergenceStatusLabel(convergence))}
                      </div>
                      ${buildStringList(
                        [
                          convergence.description,
                          `Requirements: ${getPreviewLabel(convergence.requiredFeatureTitles, "none")}.`,
                          convergence.missingFeatureTitles.length > 0
                            ? `Missing links: ${getPreviewLabel(convergence.missingFeatureTitles, "none")}.`
                            : "Every required capstone is already in place.",
                          `Effect: ${convergence.effectSummary}`,
                        ],
                        "log-list reward-list ledger-list"
                      )}
                    </article>
                  `;
                })
                .join("")
            : ""
        }
      </div>
    `;
  }

  runtimeWindow.ROUGE_UI_COMMON = {
    getServices,
    getBonusValue,
    getDerivedPartyState,
    renderBootState,
    renderRunStatus,
    renderNotice,
    buildSafeZoneSnapshot,
    getBossStatusTone,
    getBossStatusLabel,
    getObjectiveSummary,
    getTownFeatureLabel,
    getTutorialLabel,
    getPlanningCharterStageLines,
    buildAccountTreeReviewMarkup,
  };
})();
