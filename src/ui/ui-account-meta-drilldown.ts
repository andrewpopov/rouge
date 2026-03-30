(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    getTownFeatureLabel,
    createDefaultPlanningSummary,
    createDefaultReviewSummary,
    getPlanningCharterStageLines,
  } = runtimeWindow.ROUGE_UI_ACCOUNT_META;

  const { toNumber: getBonusValue } = runtimeWindow.ROUGE_UTILS;

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

  function humanizeId(id: string): string {
    return id
      .split("_")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
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

  function buildAccountMetaDrilldownMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountMetaDrilldownOptions = {}
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
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
    const review = accountSummary?.review || createDefaultReviewSummary();
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
                  ? `Missing links: ${common.getPreviewLabel(nextConvergence.missingFeatureTitles, "none; every required link is already in place")}.`
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

  function buildAccountTreeReviewMarkup(
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options: AccountTreeReviewOptions = {}
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = renderUtils;
    const showControls = options.showControls !== false;
    const trees = Array.isArray(accountSummary?.trees) ? accountSummary.trees : [];
    const focusedTree = trees.find((tree) => tree.isFocused) || trees[0] || null;
    const nextMilestone = getNextAccountTreeMilestone(focusedTree);
    const review = accountSummary?.review || createDefaultReviewSummary();
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
                    `Unlocked features: ${common.getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
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
                          `Requirements: ${common.getPreviewLabel(convergence.requiredFeatureTitles, "none")}.`,
                          convergence.missingFeatureTitles.length > 0
                            ? `Missing links: ${common.getPreviewLabel(convergence.missingFeatureTitles, "none")}.`
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

  runtimeWindow.__ROUGE_ACCOUNT_META_DRILLDOWN = {
    buildAccountMetaDrilldownMarkup,
    buildAccountTreeReviewMarkup,
  };

  // Patch the parent global so consumers see the drilldown functions on ROUGE_UI_ACCOUNT_META
  runtimeWindow.ROUGE_UI_ACCOUNT_META.buildAccountMetaDrilldownMarkup = buildAccountMetaDrilldownMarkup;
  runtimeWindow.ROUGE_UI_ACCOUNT_META.buildAccountTreeReviewMarkup = buildAccountTreeReviewMarkup;
})();
