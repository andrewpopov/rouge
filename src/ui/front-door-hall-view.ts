(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    formatTimestamp,
    getRunOutcomeTone,
    getLabelFromId,
    getClassName,
    getRunewordLabel,
    getPreviewLabel,
    getArchiveReviewState,
    getCapstoneTone,
    getCapstoneReviewTone,
    getTreeCapstoneBadgeLabel,
    buildAccountOverviewMarkup,
    buildAccountDashboardMarkup,
    buildUnlockGalleryMarkup,
    buildVaultLogisticsMarkup,
  } = runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS;

  function buildAccountControlsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const settings = accountSummary.settings || {
      showHints: true,
      reduceMotion: false,
      compactMode: false,
    };
    const preferredClassId = profileSummary.preferredClassId || "";
    const lastPlayedClassId = profileSummary.lastPlayedClassId || "";
    const classesPlayedIds = Array.isArray(appState.profile?.meta?.progression?.classesPlayed) ? appState.profile.meta.progression.classesPlayed : [];
    const preferredClassLabel = preferredClassId ? getClassName(appState, preferredClassId) : "Unset";
    const lastPlayedClassLabel = lastPlayedClassId ? getClassName(appState, lastPlayedClassId) : "No expedition yet";
    const classPreviewLabels = classesPlayedIds.map((classId) => getClassName(appState, classId));
    let classCommandLabel = "Unset";
    let classCommandTone = "locked";
    if (lastPlayedClassId) {
      classCommandLabel = "Following Recent";
      classCommandTone = "cleared";
    }
    if (preferredClassId && preferredClassId !== lastPlayedClassId) {
      classCommandLabel = "Pinned Preference";
      classCommandTone = "available";
    }
    let defaultClassMode = "First Class";
    if (lastPlayedClassId) {
      defaultClassMode = "Recent";
    }
    if (preferredClassId) {
      defaultClassMode = "Pinned";
    }
    const activeTutorialIds = Array.isArray(accountSummary.activeTutorialIds) ? accountSummary.activeTutorialIds : [];
    const dismissedTutorialIds = Array.isArray(appState.profile?.meta?.tutorials?.dismissedIds) ? appState.profile.meta.tutorials.dismissedIds : [];
    const completedTutorialIds = Array.isArray(appState.profile?.meta?.tutorials?.completedIds) ? appState.profile.meta.tutorials.completedIds : [];
    const activePreviewLabels = activeTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const dismissedPreviewLabels = dismissedTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const completedPreviewLabels = completedTutorialIds.slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_CATEGORY_PREVIEW).map((tutorialId) => common.getTutorialLabel(tutorialId));
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const plannedWeaponLabel = planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "Unset";
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const planningOverview = planning.overview;
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;

    const buildSettingButton = (settingKey: string, enabled: boolean, enabledLabel: string, disabledLabel: string): string => {
      return `
        <button
          class="neutral-btn"
          data-action="toggle-profile-setting"
          data-setting-key="${settingKey}"
          data-setting-value="${String(!enabled)}"
        >
          ${escapeHtml(enabled ? disabledLabel : enabledLabel)}
        </button>
      `;
    };

    const buildTutorialActionRows = (tutorialIds: string[], primaryAction: string, primaryLabel: string, secondaryAction = "", secondaryLabel = ""): string => {
      return tutorialIds
        .slice(0, runtimeWindow.ROUGE_LIMITS.TUTORIAL_ACTION_ROWS)
        .map((tutorialId) => {
          const tutorialLabel = common.getTutorialLabel(tutorialId);
          return `
            <div class="feature-card">
              <div class="entity-name-row">
                <strong>${escapeHtml(tutorialLabel)}</strong>
                ${buildBadge(primaryAction === "restore-tutorial" ? "Dismissed" : "Active", primaryAction === "restore-tutorial" ? "locked" : "available")}
              </div>
              <div class="cta-row">
                <button class="primary-btn" data-action="${primaryAction}" data-tutorial-id="${tutorialId}">
                  ${escapeHtml(`${primaryLabel} ${tutorialLabel}`)}
                </button>
                ${
                  secondaryAction
                    ? `
                        <button class="neutral-btn" data-action="${secondaryAction}" data-tutorial-id="${tutorialId}">
                          ${escapeHtml(`${secondaryLabel} ${tutorialLabel}`)}
                        </button>
                      `
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("");
    };

    const buildPlanningButtons = (slot: "weapon" | "armor"): string => {
      const selectedRunewordId = slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId;
      const slotRunewords = (Object.values(appState.content.runewordCatalog || {}) as RuntimeRunewordDefinition[]).filter((runeword) => runeword.slot === slot);
      return `
        <div class="cta-row">
          <button
            class="${selectedRunewordId ? "neutral-btn" : "primary-btn"}"
            data-action="set-planned-runeword"
            data-planning-slot="${slot}"
            data-runeword-id=""
          >
            ${escapeHtml(`Clear ${slot === "weapon" ? "Weapon" : "Armor"} Charter`)}
          </button>
          ${slotRunewords
            .map((runeword) => {
              const selected = runeword.id === selectedRunewordId;
              return `
                <button
                  class="${selected ? "primary-btn" : "neutral-btn"}"
                  data-action="set-planned-runeword"
                  data-planning-slot="${slot}"
                  data-runeword-id="${escapeHtml(runeword.id)}"
                >
                  ${escapeHtml(selected ? `Chartered ${runeword.name}` : `Charter ${runeword.name}`)}
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    };

    return `
      <section class="panel flow-panel" id="hall-controls">
        <div class="panel-head">
          <h2>Account Controls</h2>
          <p>The hall now writes directly into persisted settings and tutorial state. These controls stay thin and route through the existing account APIs rather than inventing new shell-owned state.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Settings Console</strong>
              ${buildBadge(settings.showHints ? "Guidance Enabled" : "Guidance Muted", settings.showHints ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Hints", settings.showHints ? "On" : "Off")}
              ${buildStat("Motion", settings.reduceMotion ? "Reduced" : "Full")}
              ${buildStat("Layout", settings.compactMode ? "Compact" : "Full")}
              ${buildStat("Scope", "Profile")}
            </div>
            <div class="cta-row">
              ${buildSettingButton("showHints", settings.showHints, "Show Hints", "Hide Hints")}
              ${buildSettingButton("reduceMotion", settings.reduceMotion, "Enable Reduced Motion", "Disable Reduced Motion")}
              ${buildSettingButton("compactMode", settings.compactMode, "Enable Compact Layout", "Disable Compact Layout")}
            </div>
            <p>${escapeHtml("These toggles update the persisted profile immediately, so the next hall render reads the same account state without another settings layer.")}</p>
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Class Command</strong>
              ${buildBadge(classCommandLabel, classCommandTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Preferred", preferredClassLabel)}
              ${buildStat("Recent", lastPlayedClassLabel)}
              ${buildStat("Played", profileSummary.classesPlayedCount)}
              ${buildStat("Default", defaultClassMode)}
            </div>
            <div class="cta-row">
              ${appState.registries.classes
                .map((classEntry) => {
                  const isPreferred = classEntry.id === preferredClassId;
                  return `
                    <button class="${isPreferred ? "primary-btn" : "neutral-btn"}" data-action="set-preferred-class" data-class-id="${escapeHtml(classEntry.id)}">
                      ${escapeHtml(isPreferred ? `Preferred ${classEntry.name}` : `Prefer ${classEntry.name}`)}
                    </button>
                  `;
                })
                .join("")}
            </div>
            ${
              lastPlayedClassId
                ? `
                    <div class="cta-row">
                      <button class="neutral-btn" data-action="set-preferred-class" data-class-id="${escapeHtml(lastPlayedClassId)}">
                        Follow Recent Signal
                      </button>
                    </div>
                  `
                : ""
            }
            <p>${escapeHtml("Explicit preference now lives in persisted profile state. If preferred and recent match, the next run keeps following your latest class automatically.")}</p>
            ${buildStringList(
              [
                `Played classes: ${getPreviewLabel(classPreviewLabels, "none archived yet")}.`,
                `Recent signal: ${lastPlayedClassId ? `${lastPlayedClassLabel}. Use Follow Recent Signal to keep the default draft tracking your latest expedition.` : "Start one expedition to seed the recent-class signal."}`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Planning Desk</strong>
              ${buildBadge(`${planning.plannedRunewordCount} chartered`, planning.plannedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
            </div>
            ${buildPlanningButtons("weapon")}
            ${buildPlanningButtons("armor")}
            ${buildStringList(
              [
                "Runeword charters now live in profile-owned planning state instead of a temporary town-only preference.",
                "Late vendor bases, rune routing, and treasury-exchange consignment pressure now read these charters when steering stash planning.",
                `Next charter push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
                charterStageLines[0],
                charterStageLines[1],
                planning.weaponRunewordId
                  ? `Weapon ledger: ${planning.weaponCompletedRunCount}/${planning.weaponArchivedRunCount} archived runs fulfilled ${plannedWeaponLabel}.`
                  : "Weapon ledger: no weapon charter archived yet.",
                planning.armorRunewordId
                  ? `Armor ledger: ${planning.armorCompletedRunCount}/${planning.armorArchivedRunCount} archived runs fulfilled ${plannedArmorLabel}.`
                  : "Armor ledger: no armor charter archived yet.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Active Guidance</strong>
              ${buildBadge(`${activeTutorialIds.length} active`, activeTutorialIds.length > 0 ? "available" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Active", activeTutorialIds.length)}
              ${buildStat("Dismissed", dismissedTutorialIds.length)}
              ${buildStat("Completed", completedTutorialIds.length)}
              ${buildStat("Hints", settings.showHints ? "Visible" : "Hidden")}
            </div>
            ${
              activeTutorialIds.length > 0
                ? `
                    <div class="feature-grid">
                      ${buildTutorialActionRows(activeTutorialIds, "complete-tutorial", "Complete", "dismiss-tutorial", "Dismiss")}
                    </div>
                  `
                : '<p class="flow-copy">No active account prompts remain. Current guidance is either complete or temporarily dismissed.</p>'
            }
            ${buildStringList(
              [
                `Active prompts: ${getPreviewLabel(activePreviewLabels, "none right now")}.`,
                `Completed prompts: ${getPreviewLabel(completedPreviewLabels, "none yet")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Dismissed Guidance</strong>
              ${buildBadge(`${dismissedTutorialIds.length} parked`, dismissedTutorialIds.length > 0 ? "locked" : "cleared")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Dismissed", dismissedTutorialIds.length)}
              ${buildStat("Restorable", Math.min(2, dismissedTutorialIds.length))}
              ${buildStat("Completed", completedTutorialIds.length)}
              ${buildStat("Queue", activeTutorialIds.length > 0 ? "Live" : "Clear")}
            </div>
            ${
              dismissedTutorialIds.length > 0
                ? `
                    <div class="feature-grid">
                      ${buildTutorialActionRows(dismissedTutorialIds, "restore-tutorial", "Restore")}
                    </div>
                  `
                : '<p class="flow-copy">No prompts are currently dismissed. Use the active-guidance controls to park hints without deleting the account record.</p>'
            }
            ${buildStringList(
              [
                `Dismissed prompts: ${getPreviewLabel(dismissedPreviewLabels, "none right now")}.`,
                "Restore returns a prompt to the active queue without losing its seen history.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildArchiveDeskMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const { buildBadge, buildStat, buildStringList } = services.renderUtils;
    const archiveState = getArchiveReviewState(appState, accountSummary);
    const {
      historyEntries,
      reviewedHistoryIndex,
      reviewedHistoryEntry,
      reviewedRunewordLabels,
      reviewedPlannedRunewordLabels,
      reviewedCompletedPlannedRunewordLabels,
      reviewedFeatureLabels,
      reviewedFavoredTreeLabel,
    } = archiveState;

    return `
      <article class="feature-card archive-focus-card">
        <div class="entity-name-row">
          <strong>Archive Review Desk</strong>
          ${buildBadge(
            reviewedHistoryEntry ? `Entry ${reviewedHistoryIndex + 1}/${historyEntries.length}` : "No Archives",
            reviewedHistoryEntry ? getRunOutcomeTone(reviewedHistoryEntry.outcome) : "locked"
          )}
        </div>
        ${
          reviewedHistoryEntry
            ? `
                <div class="entity-stat-grid">
                  ${buildStat("Class", reviewedHistoryEntry.className)}
                  ${buildStat("Outcome", getLabelFromId(reviewedHistoryEntry.outcome))}
                  ${buildStat("Level", reviewedHistoryEntry.level)}
                  ${buildStat("Acts", reviewedHistoryEntry.actsCleared)}
                  ${buildStat("Bosses", reviewedHistoryEntry.bossesDefeated)}
                  ${buildStat("Gold", reviewedHistoryEntry.goldGained)}
                  ${buildStat("Runewords", reviewedHistoryEntry.runewordsForged)}
                  ${buildStat("Logged", formatTimestamp(reviewedHistoryEntry.completedAt, true))}
                </div>
                <div class="cta-row">
                  ${
                    reviewedHistoryIndex > 0
                      ? `<button class="neutral-btn" data-action="set-run-history-review" data-history-index="${reviewedHistoryIndex - 1}">Newer Entry</button>`
                      : ""
                  }
                  ${
                    reviewedHistoryIndex < historyEntries.length - 1
                      ? `<button class="neutral-btn" data-action="set-run-history-review" data-history-index="${reviewedHistoryIndex + 1}">Older Entry</button>`
                      : ""
                  }
                  ${
                    reviewedHistoryIndex !== 0
                      ? '<button class="primary-btn" data-action="set-run-history-review" data-history-index="0">Latest Entry</button>'
                      : ""
                  }
                </div>
                ${buildStringList(
                  [
                    `Progression gains: ${reviewedHistoryEntry.skillPointsEarned} skill, ${reviewedHistoryEntry.classPointsEarned} class, ${reviewedHistoryEntry.attributePointsEarned} attribute, ${reviewedHistoryEntry.trainingRanksGained} training.`,
                    `Favored tree: ${reviewedFavoredTreeLabel}. Unlocked class skills: ${reviewedHistoryEntry.unlockedClassSkills}.`,
                    `Archived loadout: tier ${reviewedHistoryEntry.loadoutTier}, sockets ${reviewedHistoryEntry.loadoutSockets}, carried ${reviewedHistoryEntry.carriedEquipmentCount} gear and ${reviewedHistoryEntry.carriedRuneCount} runes.`,
                    `Stash snapshot: ${reviewedHistoryEntry.stashEntryCount} stored entries (${reviewedHistoryEntry.stashEquipmentCount} gear, ${reviewedHistoryEntry.stashRuneCount} runes).`,
                    `Planned charters: ${getPreviewLabel(reviewedPlannedRunewordLabels, "none archived")}.`,
                    `Completed charter targets: ${getPreviewLabel(reviewedCompletedPlannedRunewordLabels, "none fulfilled")}.`,
                    `Active runewords: ${getPreviewLabel(reviewedRunewordLabels, "none forged")}.`,
                    `New account features: ${getPreviewLabel(reviewedFeatureLabels, "no new feature gates")}.`,
                  ],
                  "log-list reward-list ledger-list"
                )}
              `
            : `
                <div class="entity-stat-grid">
                  ${buildStat("Archive Cap", archiveState.runHistoryCapacity)}
                  ${buildStat("Stored", historyEntries.length)}
                  ${buildStat("Latest", "None")}
                  ${buildStat("Outcome", "Awaiting")}
                </div>
                <p class="flow-copy">Richer archived run summaries are live, but the desk stays empty until an expedition is completed, failed, or abandoned.</p>
                ${buildStringList(
                  [
                    "Archived runs retain progression gains, favored-tree state, active runewords, and newly unlocked feature deltas.",
                    "Latest-first review lets the hall inspect long-horizon account growth without adding another persistence surface.",
                  ],
                  "log-list reward-list ledger-list"
                )}
              `
        }
      </article>
    `;
  }

  function buildArchiveSignalBoardMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const archiveSummary = accountSummary.archive || {
      entryCount: profileSummary.runHistoryCount,
      completedCount: profileSummary.completedRuns,
      failedCount: profileSummary.failedRuns,
      abandonedCount: Math.max(0, profileSummary.runHistoryCount - profileSummary.completedRuns - profileSummary.failedRuns),
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
    const latestOutcomeLabel = archiveSummary.latestOutcome ? getLabelFromId(archiveSummary.latestOutcome) : "Awaiting";
    const recentFeatureLabels = (archiveSummary.recentFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archiveSummary.recentPlannedRunewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));
    const unlockedFeatureLabels = (accountSummary.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));

    return `
      <div class="panel-head panel-head-compact">
        <h3>Archive Signal Board</h3>
        <p>The archive wing now separates single-entry review from whole-account signals, so the hall can show broader archive pressure without replacing the focused review desk.</p>
      </div>
      <div class="feature-grid feature-grid-wide">
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Latest Expedition Pulse</strong>
            ${buildBadge(archiveSummary.latestClassName || "No Archive", archiveSummary.entryCount > 0 ? getRunOutcomeTone(archiveSummary.latestOutcome || "abandoned") : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Class", archiveSummary.latestClassName || "Awaiting")}
            ${buildStat("Outcome", latestOutcomeLabel)}
            ${buildStat("Highest Lv", archiveSummary.highestLevel)}
            ${buildStat("Highest Act", archiveSummary.highestActsCleared)}
          </div>
          ${buildStringList(
            [
              `Latest favored tree: ${archiveSummary.favoredTreeName || "no archived focus yet"}.`,
              `Archive spread: ${archiveSummary.completedCount} cleared, ${archiveSummary.failedCount} failed, ${archiveSummary.abandonedCount} abandoned.`,
              `Recent archive pulse: ${archiveSummary.latestCompletedAt ? formatTimestamp(archiveSummary.latestCompletedAt, true) : "no archived timestamp yet"}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Planning Retrospective</strong>
            ${buildBadge(`${archiveSummary.planningArchiveCount} tracked`, archiveSummary.planningArchiveCount > 0 ? "available" : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Planning Runs", archiveSummary.planningArchiveCount)}
            ${buildStat("Fulfilled", archiveSummary.planningCompletionCount)}
            ${buildStat("Missed", archiveSummary.planningMissCount)}
            ${buildStat("Runeword Runs", archiveSummary.runewordArchiveCount)}
          </div>
          ${buildStringList(
            [
              `Recent charter pressure: ${getPreviewLabel(recentPlannedRunewordLabels, "no recent charter carry-through")}.`,
              `Planning completion rate: ${archiveSummary.planningCompletionCount}/${Math.max(archiveSummary.planningArchiveCount, 1)} tracked runs landed a charter target.`,
              `Runeword-bearing archive runs: ${archiveSummary.runewordArchiveCount}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Unlock Burst Ledger</strong>
            ${buildBadge(`${archiveSummary.featureUnlockCount} unlocks`, archiveSummary.featureUnlockCount > 0 ? "available" : "locked")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Feature Bursts", archiveSummary.featureUnlockCount)}
            ${buildStat("Recent", archiveSummary.recentFeatureIds.length)}
            ${buildStat("Tree Rewards", unlockedFeatureLabels.length)}
            ${buildStat("Gold Peak", archiveSummary.highestGoldGained)}
          </div>
          ${buildStringList(
            [
              `Recent feature burst: ${getPreviewLabel(recentFeatureLabels, "no new feature burst")}.`,
              `Focused tree rewards now online: ${getPreviewLabel(unlockedFeatureLabels, "no milestone rewards online yet")}.`,
              `Archive gold peak: ${archiveSummary.highestGoldGained}.`,
            ],
            "log-list reward-list ledger-list"
          )}
        </article>
      </div>
    `;
  }

  function buildVaultChronicleMarkup(
    appState: AppState,
    services: UiRenderServices,
    accountSummary: ProfileAccountSummary,
    stashPreviewLines: string[],
    recentRunMarkup: string
  ): string {
    return `
      <section class="panel flow-panel" id="hall-archive">
        <div class="panel-head">
          <h2>Vault And Chronicle</h2>
          <p>Account storage and run history now share a dedicated archive wing so stash review, recent runs, and long-form archive drilldowns stay together.</p>
        </div>
        <div class="front-door-snapshot-grid">
          <article class="feature-card">
            <strong>Stash Preview</strong>
            ${
              stashPreviewLines.length > 0
                ? services.renderUtils.buildStringList(stashPreviewLines, "log-list reward-list ledger-list")
                : '<p class="flow-copy">The profile stash is empty. Gear and runes moved out of town inventory will appear here.</p>'
            }
          </article>
          <article class="feature-card">
            <strong>Recent Expeditions</strong>
            ${recentRunMarkup}
          </article>
          ${buildArchiveDeskMarkup(appState, services, accountSummary)}
        </div>
        ${buildArchiveSignalBoardMarkup(appState, services, accountSummary)}
      </section>
    `;
  }

  function buildCapstoneWatchMarkup(services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const trees = Array.isArray(accountSummary.trees) ? accountSummary.trees : [];
    const focusedTree = trees.find((tree) => tree.isFocused) || trees[0] || null;
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

    return `
      <section class="panel flow-panel" id="hall-capstones">
        <div class="panel-head">
          <h2>Capstone Watch</h2>
          <p>Late account goals are now broken out from the wider tree review, so capstone pressure stays visible while the hall remains ready for deeper Agent 2 progression read models later.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Late Account Pressure</strong>
              ${buildBadge(review.nextCapstoneTitle || "No Capstone", getCapstoneReviewTone(review))}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Total", review.capstoneCount)}
              ${buildStat("Ready", review.readyCapstoneCount)}
              ${buildStat("Unlocked", review.unlockedCapstoneCount)}
              ${buildStat("Blocked", review.blockedCapstoneCount)}
            </div>
            <p>${escapeHtml("Capstones stay summary-first here. Retargeting focus still happens in the main account tree review so the shell does not duplicate control ownership.")}</p>
            ${buildStringList(
              [
                `Focused tree pressure: ${focusedTree ? focusedTree.title : "no tree focus online"}.`,
                `Next capstone: ${review.nextCapstoneTitle || "every current capstone is already online"}.`,
                `Nearest milestone: ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          ${trees
            .map((tree) => {
              const capstoneMilestone = tree.milestones.find((milestone) => milestone.isCapstone) || null;
              const unlockedFeatureLabels = (tree.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
              const treeBadgeLabel = getTreeCapstoneBadgeLabel(tree);

              return `
                <article class="feature-card">
                  <div class="entity-name-row">
                    <strong>${escapeHtml(tree.title)}</strong>
                    ${buildBadge(treeBadgeLabel, getCapstoneTone(tree.capstoneStatus))}
                  </div>
                  <div class="entity-stat-grid">
                    ${buildStat("Rank", `${tree.currentRank}/${tree.maxRank}`)}
                    ${buildStat("Ready", tree.eligibleMilestoneCount)}
                    ${buildStat("Blocked", tree.blockedMilestoneCount)}
                    ${buildStat("Focus", tree.isFocused ? "Active" : "Standby")}
                  </div>
                  ${buildStringList(
                    [
                      `Capstone state: ${tree.capstoneTitle || "no capstone authored"}.`,
                      `Capstone progress: ${capstoneMilestone ? `${capstoneMilestone.progress}/${capstoneMilestone.target}` : "n/a"}.`,
                      `Tree rewards online: ${getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                      `Next step: ${tree.nextMilestoneTitle || "all milestones cleared"}.`,
                    ],
                    "log-list reward-list ledger-list"
                  )}
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function buildHallTabNav(activeSection: string): string {
    const tabs = [
      { id: "overview", label: "Overview" },
      { id: "expedition", label: "Expedition" },
      { id: "progression", label: "Progression" },
      { id: "vault", label: "Vault & Archive" },
      { id: "settings", label: "Settings" },
    ];
    return `
      <nav class="hall-tab-nav" style="display:flex;gap:0;flex-wrap:wrap;border-bottom:2px solid var(--border);margin-bottom:24px">
        ${tabs.map((tab) => {
          const isActive = tab.id === activeSection;
          return `<button
            class="hall-tab${isActive ? " hall-tab-active" : ""}"
            style="padding:10px 18px;background:${isActive ? "var(--surface)" : "transparent"};border:2px solid ${isActive ? "var(--border)" : "transparent"};border-bottom:${isActive ? "2px solid var(--surface)" : "none"};margin-bottom:-2px;color:${isActive ? "var(--text)" : "var(--muted)"};cursor:pointer;font-weight:${isActive ? "700" : "500"};font-size:0.92rem;letter-spacing:0.02em;transition:color 0.15s"
            data-action="switch-hall-section"
            data-section="${tab.id}"
          >${tab.label}</button>`;
        }).join("")}
      </nav>
    `;
  }

  runtimeWindow.ROUGE_FRONT_DOOR_HALL_VIEW = {
    buildHallTabNav,
    buildAccountOverviewMarkup,
    buildAccountDashboardMarkup,
    buildUnlockGalleryMarkup,
    buildVaultLogisticsMarkup,
    buildAccountControlsMarkup,
    buildVaultChronicleMarkup,
    buildCapstoneWatchMarkup,
  };
})();
