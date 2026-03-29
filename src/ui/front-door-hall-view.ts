(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    getClassName,
    getRunewordLabel,
    buildAccountOverviewMarkup,
    buildAccountDashboardMarkup,
    buildUnlockGalleryMarkup,
    buildVaultLogisticsMarkup,
  } = runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS;

  const { getPreviewLabel } = runtimeWindow.ROUGE_UI_COMMON;

  function buildCharmPouchCard(appState: AppState, services: UiRenderServices): string {
    const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
    if (!charmSystem || !appState.profile?.meta?.charms) {
      return "";
    }
    const summary = charmSystem.getCharmPouchSummary(appState.profile);
    if (summary.unlockedCount === 0) {
      return "";
    }
    const { buildBadge, buildStat, escapeHtml } = services.renderUtils;
    const { describeBonusSet } = runtimeWindow.ROUGE_RUN_STATE;

    function buildCharmRow(charm: CharmDefinition, equipped: boolean): string {
      const bonusLines = describeBonusSet(charm.bonuses);
      const bonusText = bonusLines.join(" ");
      const classNote = charm.classId ? ` (${charm.classId})` : "";
      const charmAction = equipped ? "unequip" : "equip";
      const canEquip = !equipped && charmSystem.canEquipCharm(appState.profile, charm.id);
      const disabled = !equipped && !canEquip;
      const btnLabel = equipped ? "Remove" : "Equip";
      const btnClass = equipped ? "danger-btn" : "neutral-btn";
      return `
        <div class="charm-row ${equipped ? "charm-row--equipped" : ""}">
          <div class="charm-row__info">
            <strong class="charm-row__name">${escapeHtml(charm.name)}${escapeHtml(classNote)}</strong>
            <span class="charm-row__bonuses">${escapeHtml(bonusText)}</span>
            <span class="charm-row__meta">${escapeHtml(charm.size)} · ${charm.slotCost} slot${charm.slotCost === 1 ? "" : "s"}</span>
          </div>
          ${!disabled ? `
            <button class="${btnClass}" data-action="manage-charm"
                    data-charm-id="${escapeHtml(charm.id)}"
                    data-charm-action="${charmAction}">${escapeHtml(btnLabel)}</button>
          ` : `<span class="charm-row__full">Full</span>`}
        </div>
      `;
    }

    const equippedRows = summary.equippedCharms.map((c: CharmDefinition) => buildCharmRow(c, true)).join("");
    const availableRows = summary.unequippedCharms.map((c: CharmDefinition) => buildCharmRow(c, false)).join("");

    return `
      <article class="feature-card">
        <div class="entity-name-row">
          <strong>Charm Pouch</strong>
          ${buildBadge(`${summary.slotsUsed}/${summary.capacity} slots`, summary.slotsRemaining > 0 ? "available" : "locked")}
        </div>
        <div class="entity-stat-grid">
          ${buildStat("Equipped", summary.equippedCount)}
          ${buildStat("Available", summary.unequippedCharms.length)}
          ${buildStat("Unlocked", summary.unlockedCount)}
          ${buildStat("Capacity", summary.capacity)}
        </div>
        ${equippedRows ? `
          <div class="charm-section">
            <div class="charm-section__label">Equipped</div>
            ${equippedRows}
          </div>
        ` : ""}
        ${availableRows ? `
          <div class="charm-section">
            <div class="charm-section__label">Available</div>
            ${availableRows}
          </div>
        ` : ""}
        ${summary.unlockedCount === 0 ? "<p>No charms unlocked yet. Complete acts and defeat bosses to earn charms.</p>" : ""}
      </article>
    `;
  }

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
          ${buildCharmPouchCard(appState, services)}
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

  function buildHallTabNav(activeSection: string): string {
    const tabs = [
      { id: "overview", label: "Overview", detail: "Hall pulse, archive, and account summary", icon: "\u2726" },
      { id: "expedition", label: "Expedition", detail: "Live route, launch flow, and re-entry", icon: "\u2694" },
      { id: "progression", label: "Progression", detail: "Trees, convergence, and capstones", icon: "\u2B50" },
      { id: "vault", label: "Vault & Archive", detail: "Stash, chronicle, and unlock galleries", icon: "\u{1F5DC}" },
      { id: "settings", label: "Settings", detail: "Guidance, class command, and charters", icon: "\u2699" },
    ];
    return `
      <nav class="hall-tab-nav">
        ${tabs.map((tab) => {
          const isActive = tab.id === activeSection;
          return `<button
            class="hall-tab${isActive ? " hall-tab-active" : ""}"
            data-action="switch-hall-section"
            data-section="${tab.id}"
          >
            <span class="hall-tab__icon" aria-hidden="true">${tab.icon}</span>
            <span class="hall-tab__copy">
              <span class="hall-tab__label">${tab.label}</span>
              <span class="hall-tab__detail">${tab.detail}</span>
            </span>
          </button>`;
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
    buildVaultChronicleMarkup: runtimeWindow.__ROUGE_HALL_VIEW_ARCHIVE.buildVaultChronicleMarkup,
    buildCapstoneWatchMarkup: runtimeWindow.__ROUGE_HALL_VIEW_ARCHIVE.buildCapstoneWatchMarkup,
  };
})();
