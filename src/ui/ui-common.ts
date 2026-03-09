/* eslint-disable max-lines */
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
      case "sovereign_annals":
        return "Sovereign Annals";
      case "chronicle_exchange":
        return "Chronicle Exchange";
      case "sovereign_exchange":
        return "Sovereign Exchange";
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
      case "merchant_principate":
        return "Merchant Principate";
      case "training_grounds":
        return "Training Grounds";
      case "war_college":
        return "War College";
      case "paragon_doctrine":
        return "Paragon Doctrine";
      case "apex_doctrine":
        return "Apex Doctrine";
      case "legend_doctrine":
        return "Legend Doctrine";
      case "war_annals":
        return "War Annals";
      case "legendary_annals":
        return "Legendary Annals";
      case "paragon_exchange":
        return "Paragon Exchange";
      case "ascendant_exchange":
        return "Ascendant Exchange";
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

  function createDefaultPlanningSummary(): ProfilePlanningSummary {
    const overview: ProfilePlanningOverviewSummary = {
      compatibleCharterCount: 0,
      preparedCharterCount: 0,
      readyCharterCount: 0,
      missingBaseCharterCount: 0,
      socketCommissionCharterCount: 0,
      repeatForgeReadyCharterCount: 0,
      trackedBaseCount: 0,
      highestTrackedBaseTier: 0,
      totalSocketStepsRemaining: 0,
      compatibleRunewordIds: [],
      preparedRunewordIds: [],
      readyRunewordIds: [],
      missingBaseRunewordIds: [],
      fulfilledRunewordIds: [],
      bestFulfilledActsCleared: 0,
      bestFulfilledLoadoutTier: 0,
      nextAction: "idle",
      nextActionLabel: "No Live Charter",
      nextActionSummary: "No runeword charter is pinned on the account yet.",
    };
    return {
      weaponRunewordId: "",
      armorRunewordId: "",
      plannedRunewordCount: 0,
      fulfilledPlanCount: 0,
      unfulfilledPlanCount: 0,
      weaponArchivedRunCount: 0,
      weaponCompletedRunCount: 0,
      weaponBestActsCleared: 0,
      armorArchivedRunCount: 0,
      armorCompletedRunCount: 0,
      armorBestActsCleared: 0,
      overview,
      weaponCharter: undefined,
      armorCharter: undefined,
    };
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

  function buildAccountMetaContinuityMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountMetaContinuityOptions = {}
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    const title = options.title || "Account Meta Continuity";
    const copy =
      options.copy ||
      "Archive pressure, charter staging, mastery pressure, and convergence pressure now stay visible through the same board instead of resetting at each shell phase.";
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
    const archive = accountSummary?.archive || {
      entryCount: profileSummary.runHistoryCount,
      completedCount: profileSummary.completedRuns,
      failedCount: profileSummary.failedRuns,
      abandonedCount: 0,
      latestClassId: "",
      latestClassName: "",
      latestOutcome: "",
      latestCompletedAt: "",
      highestLevel: profileSummary.highestLevel,
      highestActsCleared: profileSummary.highestActCleared,
      highestGoldGained: 0,
      highestLoadoutTier: 0,
      runewordArchiveCount: 0,
      featureUnlockCount: 0,
      favoredTreeId: "",
      favoredTreeName: "",
      planningArchiveCount: 0,
      planningCompletionCount: 0,
      planningMissCount: 0,
      recentFeatureIds: [],
      recentPlannedRunewordIds: [],
    };
    const planning = accountSummary?.planning || createDefaultPlanningSummary();
    const stash = accountSummary?.stash || {
      entryCount: profileSummary.stashEntries,
      equipmentCount: 0,
      runeCount: 0,
      socketReadyEquipmentCount: 0,
      socketedRuneCount: 0,
      runewordEquipmentCount: 0,
      itemIds: [],
      runeIds: [],
    };
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
    const focusedTree = (Array.isArray(accountSummary?.trees) ? accountSummary.trees : []).find((tree) => tree.isFocused) || accountSummary?.trees?.[0] || null;
    const nextMilestone = getNextAccountTreeMilestone(focusedTree);
    const convergences = Array.isArray(accountSummary?.convergences) ? accountSummary.convergences : [];
    const nextConvergence =
      convergences.find((convergence) => convergence.id === review.nextConvergenceId) ||
      convergences.find((convergence) => convergence.status === "available") ||
      convergences.find((convergence) => !convergence.unlocked) ||
      null;
    const recentFeatureLabels = (archive.recentFeatureIds || []).map((featureId) => getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archive.recentPlannedRunewordIds || []).map((runewordId) => {
      return appState.content.runewordCatalog?.[runewordId]?.name || humanizeId(runewordId);
    });
    const planningStageLines = getPlanningCharterStageLines(planning, appState.content);
    const readyCharterCount = getBonusValue(planning.weaponCharter?.readyBaseCount) + getBonusValue(planning.armorCharter?.readyBaseCount);
    const preparedCharterCount = getBonusValue(planning.weaponCharter?.preparedBaseCount) + getBonusValue(planning.armorCharter?.preparedBaseCount);

    let archiveTone = "locked";
    let archiveBadgeLabel = "Quiet";
    if (recentFeatureLabels.length > 0 || archive.planningCompletionCount > 0 || archive.planningMissCount > 0) {
      archiveTone = "available";
      archiveBadgeLabel = "Recent Delta";
    } else if (archive.entryCount > 0) {
      archiveTone = "cleared";
      archiveBadgeLabel = `${archive.entryCount} logged`;
    }

    let charterTone = "cleared";
    let charterBadgeLabel = "No Live Charter";
    if (readyCharterCount > 0) {
      charterTone = "available";
      charterBadgeLabel = `${readyCharterCount} ready`;
    } else if (planning.plannedRunewordCount > 0) {
      charterTone = preparedCharterCount > 0 ? "available" : "locked";
      charterBadgeLabel = `${planning.plannedRunewordCount} live`;
    }

    let convergenceTone = "locked";
    let convergenceBadgeLabel = "No Pending Lane";
    if (review.availableConvergenceCount > 0) {
      convergenceTone = "available";
      convergenceBadgeLabel = `${review.availableConvergenceCount} ready`;
    } else if (review.convergenceCount > 0 && review.unlockedConvergenceCount >= review.convergenceCount) {
      convergenceTone = "cleared";
      convergenceBadgeLabel = "All Online";
    } else if (nextConvergence?.title) {
      convergenceBadgeLabel = nextConvergence.title;
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
              <strong>Archive Pressure</strong>
              ${buildBadge(archiveBadgeLabel, archiveTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Archives", archive.entryCount)}
              ${buildStat("Completed", archive.completedCount)}
              ${buildStat("Feature Bursts", archive.featureUnlockCount)}
              ${buildStat("Archive Cap", accountSummary.runHistoryCapacity)}
            </div>
            ${buildStringList(
              [
                archive.latestClassName
                  ? `Latest archive: ${archive.latestClassName} · ${humanizeId(archive.latestOutcome || "completed")}.`
                  : "Latest archive: no run has been logged yet.",
                `Recent feature burst: ${getPreviewLabel(recentFeatureLabels, "none in recent archives")}.`,
                `Recent charter pressure: ${getPreviewLabel(recentPlannedRunewordLabels, "no charter carry-through yet")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Charter Staging</strong>
              ${buildBadge(charterBadgeLabel, charterTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Live", planning.plannedRunewordCount)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
              ${buildStat("Vault", stash.socketReadyEquipmentCount)}
            </div>
            ${buildStringList(
              [
                planningStageLines[0],
                planningStageLines[1],
                `Archive charter record: ${planning.fulfilledPlanCount} fulfilled, ${planning.unfulfilledPlanCount} missed.`,
                `Vault support: ${stash.socketReadyEquipmentCount} socket-ready bases, ${stash.runeCount} runes, ${stash.runewordEquipmentCount} runeword base${stash.runewordEquipmentCount === 1 ? "" : "s"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Mastery Pressure</strong>
              ${buildBadge(accountSummary.focusedTreeTitle || "Unset", getAccountTreeTone(focusedTree))}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Trees", accountSummary.treeCount)}
              ${buildStat("Milestones", `${accountSummary.unlockedMilestoneCount}/${accountSummary.milestoneCount}`)}
              ${buildStat("Capstones", `${review.unlockedCapstoneCount}/${review.capstoneCount}`)}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
            </div>
            ${buildStringList(
              [
                focusedTree?.description || "Archive, trade, and mastery pressure stay account-owned even while the current phase changes.",
                `Next milestone: ${nextMilestone ? `${nextMilestone.title} (${nextMilestone.progress}/${nextMilestone.target})` : "all milestones cleared"}.`,
                `Next capstone: ${review.nextCapstoneTitle || "every current capstone is already online"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Convergence Watch</strong>
              ${buildBadge(convergenceBadgeLabel, convergenceTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Ready", review.availableConvergenceCount)}
              ${buildStat("Blocked", review.blockedConvergenceCount)}
              ${buildStat("Unlocked", review.unlockedConvergenceCount)}
              ${buildStat("Total", review.convergenceCount)}
            </div>
            ${buildStringList(
              [
                nextConvergence ? `Next convergence: ${nextConvergence.title}.` : "Next convergence: every current cross-tree lane is already online.",
                nextConvergence?.effectSummary ? `Effect: ${nextConvergence.effectSummary}` : "Effect: no further convergence effect is pending right now.",
                nextConvergence
                  ? `Missing links: ${getPreviewLabel(nextConvergence.missingFeatureTitles, "none; every required link is already in place")}.`
                  : "Missing links: no blocked convergence requirements remain.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildAccountMetaDrilldownMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountMetaDrilldownOptions = {}
  ): string {
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    const title = options.title || "Account Meta Drilldowns";
    const copy =
      options.copy ||
      "The continuity board keeps account pressure visible; these drilldowns turn that pressure into slot-by-slot charter posture and the next convergence lane.";
    const charterFollowThrough =
      options.charterFollowThrough ||
      "Review the vault and stash against the pinned charter before the next draft, town prep, or route pivot.";
    const convergenceFollowThrough =
      options.convergenceFollowThrough ||
      "Review the progression wing before the next run-side decision if convergence pressure now outranks a fresh draft.";
    const planning = accountSummary?.planning || createDefaultPlanningSummary();
    const planningOverview = planning.overview || createDefaultPlanningSummary().overview;
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
    const nextConvergence =
      convergences.find((convergence) => convergence.id === review.nextConvergenceId) ||
      convergences.find((convergence) => convergence.status === "available") ||
      convergences.find((convergence) => !convergence.unlocked) ||
      null;
    const planningStageLines = getPlanningCharterStageLines(planning, appState.content);

    const buildCharterCard = (
      slotLabel: "Weapon" | "Armor",
      index: number,
      charter: ProfilePlanningCharterSummary | undefined
    ): string => {
      const runewordId = charter?.runewordId || (slotLabel === "Weapon" ? planning.weaponRunewordId : planning.armorRunewordId);
      const runewordLabel = runewordId ? appState.content.runewordCatalog?.[runewordId]?.name || humanizeId(runewordId) : "Unpinned";
      const readyCount = getBonusValue(charter?.readyBaseCount);
      const preparedCount = getBonusValue(charter?.preparedBaseCount);
      const compatibleCount = getBonusValue(charter?.compatibleBaseCount);
      const bestBaseLabel = charter?.bestBaseItemId
        ? appState.content.itemCatalog?.[charter.bestBaseItemId]?.name || humanizeId(charter.bestBaseItemId)
        : "no parked base yet";
      let tone = "locked";
      let badgeLabel = "Unpinned";

      if (runewordId) {
        badgeLabel = runewordLabel;
        if (readyCount > 0) {
          tone = "available";
          badgeLabel = `${readyCount} ready`;
        } else if (preparedCount > 0 || compatibleCount > 0) {
          tone = "available";
          badgeLabel = preparedCount > 0 ? `${preparedCount} prepared` : `${compatibleCount} tracked`;
        }
      }

      return `
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>${escapeHtml(`${slotLabel} Charter`)}</strong>
            ${buildBadge(badgeLabel, tone)}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Runeword", runewordLabel)}
            ${buildStat("Ready", readyCount)}
            ${buildStat("Prepared", preparedCount)}
            ${buildStat("Compatible", compatibleCount)}
          </div>
          ${buildStringList(
            [
              planningStageLines[index],
              `Best parked base: ${bestBaseLabel}.`,
              charter
                ? `Socket posture: ${getBonusValue(charter.bestBaseSocketsUnlocked)}/${getBonusValue(charter.bestBaseMaxSockets) || getBonusValue(charter.requiredSocketCount)} sockets, rune gap ${getBonusValue(charter.bestBaseMissingRuneCount)}.`
                : `${slotLabel} charter socket posture: no compatible base is parked yet.`,
              charter
                ? `Archive record: ${getBonusValue(charter.completedRunCount)} completed archive${getBonusValue(charter.completedRunCount) === 1 ? "" : "s"}, best act ${getBonusValue(charter.bestActsCleared)}.`
                : `${slotLabel} charter archive record: no archived base has fed this slot yet.`,
              charterFollowThrough,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
      `;
    };

    let charterTone = "locked";
    let charterBadgeLabel = planningOverview.nextActionLabel || "No Live Charter";
    if (planningOverview.readyCharterCount > 0) {
      charterTone = "available";
      charterBadgeLabel = `${planningOverview.readyCharterCount} ready`;
    } else if (planning.plannedRunewordCount > 0) {
      charterTone = "available";
      charterBadgeLabel = planningOverview.nextActionLabel || `${planning.plannedRunewordCount} live`;
    }

    let convergenceTone = "locked";
    let convergenceBadgeLabel = review.nextConvergenceTitle || "No Pending Lane";
    if (nextConvergence) {
      convergenceTone = getConvergenceTone(nextConvergence);
      if (nextConvergence.unlocked) {
        convergenceBadgeLabel = "Unlocked";
      } else if (nextConvergence.status === "available") {
        convergenceBadgeLabel = `${review.availableConvergenceCount} ready`;
      } else {
        convergenceBadgeLabel = nextConvergence.title;
      }
    } else if (review.convergenceCount > 0 && review.unlockedConvergenceCount >= review.convergenceCount) {
      convergenceTone = "cleared";
      convergenceBadgeLabel = "All Online";
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
              <strong>Charter Forecast</strong>
              ${buildBadge(charterBadgeLabel, charterTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Live", planning.plannedRunewordCount)}
              ${buildStat("Ready", planningOverview.readyCharterCount)}
              ${buildStat("Prepared", planningOverview.preparedCharterCount)}
              ${buildStat("Missing", planningOverview.missingBaseCharterCount)}
            </div>
            ${buildStringList(
              [
                `Next charter push: ${planningOverview.nextActionLabel || "Quiet"}.`,
                planningOverview.nextActionSummary || "No active runeword charter is pinned across the account.",
                `Tracked bases: ${planningOverview.trackedBaseCount}, highest tracked tier ${planningOverview.highestTrackedBaseTier || "none"}.`,
                `Archive charter record: ${planning.fulfilledPlanCount} fulfilled, ${planning.unfulfilledPlanCount} missed.`,
                charterFollowThrough,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          ${buildCharterCard("Weapon", 0, planning.weaponCharter)}
          ${buildCharterCard("Armor", 1, planning.armorCharter)}
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Convergence Drilldown</strong>
              ${buildBadge(convergenceBadgeLabel, convergenceTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Ready", review.availableConvergenceCount)}
              ${buildStat("Blocked", review.blockedConvergenceCount)}
              ${buildStat("Missing", nextConvergence?.missingFeatureIds.length || 0)}
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
            </div>
            ${buildStringList(
              [
                `Focused tree momentum: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
                nextConvergence ? `Next lane: ${nextConvergence.title}.` : "Next lane: every current cross-tree lane is already online.",
                nextConvergence?.effectSummary ? `Effect waiting there: ${nextConvergence.effectSummary}` : "Effect waiting there: no further convergence effect is pending right now.",
                nextConvergence
                  ? `Missing links: ${getPreviewLabel(nextConvergence.missingFeatureTitles, "none; every required link is already in place")}.`
                  : "Missing links: no blocked convergence requirements remain.",
                convergenceFollowThrough,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
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
    createDefaultPlanningSummary,
    getPlanningCharterStageLines,
    buildAccountMetaContinuityMarkup,
    buildAccountMetaDrilldownMarkup,
    buildExpeditionLaunchFlowMarkup: () => "",
    buildAccountTreeReviewMarkup,
  };
})();
