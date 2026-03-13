(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getBonusValue(value: unknown): number {
    return Number.parseInt(String(value ?? 0), 10) || 0;
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

  function buildAccountMetaContinuityMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountMetaContinuityOptions = {}
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
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
                `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "none in recent archives")}.`,
                `Recent charter pressure: ${common.getPreviewLabel(recentPlannedRunewordLabels, "no charter carry-through yet")}.`,
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
                  ? `Missing links: ${common.getPreviewLabel(nextConvergence.missingFeatureTitles, "none; every required link is already in place")}.`
                  : "Missing links: no blocked convergence requirements remain.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  runtimeWindow.ROUGE_UI_ACCOUNT_META = {
    getTownFeatureLabel,
    getTutorialLabel,
    createDefaultPlanningSummary,
    getPlanningCharterStageLines,
    buildAccountMetaContinuityMarkup,
    // Patched by ui-account-meta-drilldown.ts after load
    buildAccountMetaDrilldownMarkup: (() => "") as UiAccountMetaApi["buildAccountMetaDrilldownMarkup"],
    buildAccountTreeReviewMarkup: (() => "") as UiAccountMetaApi["buildAccountTreeReviewMarkup"],
  };
})();
