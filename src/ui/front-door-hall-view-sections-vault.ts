(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    getLabelFromId,
    getClassName,
    getItemLabel,
    getRuneLabel,
    getRunewordLabel,
    getVaultForecast,
  } = runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS;

  function buildUnlockGalleryMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const archiveSummary = accountSummary.archive || common.createDefaultArchiveSummary(profileSummary);
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const unlocks = appState.profile?.meta?.unlocks || {
      classIds: [],
      bossIds: [],
      runewordIds: [],
      townFeatureIds: [],
    };
    const unlockedClassLabels = (unlocks.classIds || []).map((classId) => getClassName(appState, classId));
    const unlockedBossLabels = (unlocks.bossIds || []).map((bossId) => {
      return getLabelFromId(appState.content.enemyCatalog?.[bossId]?.name || bossId);
    });
    const unlockedRunewordLabels = (unlocks.runewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));
    const unlockedTownFeatureLabels = (unlocks.townFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const unlockedFeatureLabels = (accountSummary.unlockedFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentFeatureLabels = (archiveSummary.recentFeatureIds || []).map((featureId) => common.getTownFeatureLabel(featureId));
    const recentPlannedRunewordLabels = (archiveSummary.recentPlannedRunewordIds || []).map((runewordId) => getRunewordLabel(appState, runewordId));

    return `
      <section class="panel flow-panel" id="hall-unlocks">
        <div class="panel-head">
          <h2>Unlock Galleries</h2>
          <p>The hall now breaks account unlocks out into dedicated gallery cards, so roster breadth, boss trophies, runeword growth, and newer account-system unlock bursts stay readable at a glance.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Class Roster Archive</strong>
              ${buildBadge(`${profileSummary.unlockedClassCount} online`, profileSummary.unlockedClassCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Classes", profileSummary.unlockedClassCount)}
              ${buildStat("Played", profileSummary.classesPlayedCount)}
              ${buildStat("Preferred", profileSummary.preferredClassId ? getClassName(appState, profileSummary.preferredClassId) : "Unset")}
              ${buildStat("Latest", archiveSummary.latestClassName || "Awaiting")}
            </div>
            ${buildStringList(
              [
                `Class roster: ${common.getPreviewLabel(unlockedClassLabels, "none yet")}.`,
                `Focused draft signal: ${profileSummary.preferredClassId ? getClassName(appState, profileSummary.preferredClassId) : "no preferred class pinned yet"}.`,
                `Recent class pressure: ${archiveSummary.latestClassName || "no archive yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Boss Trophy Gallery</strong>
              ${buildBadge(`${profileSummary.unlockedBossCount} trophies`, profileSummary.unlockedBossCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Bosses", profileSummary.unlockedBossCount)}
              ${buildStat("Highest Act", profileSummary.highestActCleared)}
              ${buildStat("Lifetime Kills", profileSummary.totalBossesDefeated)}
              ${buildStat("Favored", archiveSummary.favoredTreeName || "Unset")}
            </div>
            ${buildStringList(
              [
                `Boss gallery: ${common.getPreviewLabel(unlockedBossLabels, "none yet")}.`,
                `Latest favored tree: ${archiveSummary.favoredTreeName || "no archived focus yet"}.`,
                `The mastery lane now feeds these trophies without needing another hall rewrite.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Codex</strong>
              ${buildBadge(`${profileSummary.unlockedRunewordCount} entries`, profileSummary.unlockedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Runewords", profileSummary.unlockedRunewordCount)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
              ${buildStat("Archived", archiveSummary.runewordArchiveCount)}
              ${buildStat("Fulfilled", archiveSummary.planningCompletionCount)}
            </div>
            ${buildStringList(
              [
                `Runeword codex: ${common.getPreviewLabel(unlockedRunewordLabels, "none yet")}.`,
                `Recent charter pressure: ${common.getPreviewLabel(recentPlannedRunewordLabels, "no recent charter carry-through")}.`,
                `Weapon ledger: ${planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "no weapon charter"}. Armor ledger: ${planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "no armor charter"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Recent Unlock Wave</strong>
              ${buildBadge(`${archiveSummary.featureUnlockCount} bursts`, archiveSummary.featureUnlockCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Tree Rewards", unlockedFeatureLabels.length)}
              ${buildStat("Town Hooks", profileSummary.townFeatureCount)}
              ${buildStat("Recent", archiveSummary.recentFeatureIds.length)}
              ${buildStat("Archives", archiveSummary.entryCount)}
            </div>
            <p>${escapeHtml("These are read-only hall summaries built on the current unlock and archive seams, leaving room for broader Agent 2 progression read models later.")}</p>
            ${buildStringList(
              [
                `Focused tree rewards: ${common.getPreviewLabel(unlockedFeatureLabels, "none yet")}.`,
                `Town systems online: ${common.getPreviewLabel(unlockedTownFeatureLabels, "none yet")}.`,
                `Recent feature burst: ${common.getPreviewLabel(recentFeatureLabels, "no new feature burst")}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  function buildVaultLogisticsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const profileSummary = accountSummary.profile || services.appEngine.getProfileSummary(appState);
    const stashSummary = accountSummary.stash || common.createDefaultStashSummary(profileSummary.stashEntries);
    const archiveSummary = accountSummary.archive || common.createDefaultArchiveSummary(profileSummary);
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const stashEntries = Array.isArray(appState.profile?.stash?.entries) ? appState.profile.stash.entries : [];
    const equipmentEntries = stashEntries.filter((entry): entry is InventoryEquipmentEntry => entry.kind === "equipment");
    const runeEntries = stashEntries.filter((entry): entry is InventoryRuneEntry => entry.kind === "rune");
    const stashEquipmentLabels = equipmentEntries.map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const stashRuneLabels = runeEntries.map((entry) => getRuneLabel(appState, entry.runeId));
    const socketTrackedLabels = equipmentEntries
      .filter((entry) => entry.equipment.socketsUnlocked > 0)
      .map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const chargedBaseLabels = equipmentEntries
      .filter((entry) => entry.equipment.insertedRunes.length > 0 || Boolean(entry.equipment.runewordId))
      .map((entry) => getItemLabel(appState, entry.equipment.itemId));
    const plannedWeaponLabel = planning.weaponRunewordId ? getRunewordLabel(appState, planning.weaponRunewordId) : "Unset";
    const plannedArmorLabel = planning.armorRunewordId ? getRunewordLabel(appState, planning.armorRunewordId) : "Unset";
    const charterStageLines = common.getPlanningCharterStageLines(planning, appState.content);
    const planningOverview = planning.overview;
    const readyCharterCount = planningOverview.readyCharterCount;
    const preparedCharterCount = planningOverview.preparedCharterCount;
    const { tone: forecastTone, copy: forecastCopy } = getVaultForecast(planning);

    const vaultIsEmpty = stashSummary.entryCount === 0 && planning.plannedRunewordCount === 0;

    if (vaultIsEmpty) {
      return `
        <section class="panel flow-panel feature-card--empty" id="hall-vault">
          <div class="panel-head">
            <h2>Vault Logistics</h2>
          </div>
          <p class="feature-card__empty-hint">The vault is empty. Send items to stash and pin runeword charters to populate this section.</p>
        </section>
      `;
    }

    return `
      <section class="panel flow-panel" id="hall-vault">
        <div class="panel-head">
          <h2>Vault Logistics</h2>
          <p>The hall now gives stash and planning state their own logistics pass, so carry-forward gear, rune reserve, and charter pressure are readable before you open another expedition.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Vault Logistics</strong>
              ${buildBadge(`${stashSummary.entryCount} stored`, stashSummary.entryCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Entries", stashSummary.entryCount)}
              ${buildStat("Gear", stashSummary.equipmentCount)}
              ${buildStat("Runes", stashSummary.runeCount)}
              ${buildStat("Archives", archiveSummary.entryCount)}
            </div>
            ${buildStringList(
              [
                `Vault loadout watch: ${common.getPreviewLabel(stashEquipmentLabels, "no stored gear")}.`,
                `Rune reserve: ${common.getPreviewLabel(stashRuneLabels, "no banked runes")}.`,
                `Latest archive push: ${archiveSummary.latestClassName || "no archived class yet"}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Socket And Base Watch</strong>
              ${buildBadge(`${stashSummary.socketReadyEquipmentCount} tracked`, stashSummary.socketReadyEquipmentCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Socket Bases", stashSummary.socketReadyEquipmentCount)}
              ${buildStat("Socketed Runes", stashSummary.socketedRuneCount)}
              ${buildStat("Runeword Bases", stashSummary.runewordEquipmentCount)}
              ${buildStat("Highest Tier", archiveSummary.highestLoadoutTier)}
            </div>
            ${buildStringList(
              [
                `Socket-tracked gear: ${common.getPreviewLabel(socketTrackedLabels, "none with sockets yet")}.`,
                `Charged bases: ${common.getPreviewLabel(chargedBaseLabels, "no runed or runeword bases")}.`,
                `Archived loadout tier pressure: ${archiveSummary.highestLoadoutTier || 0}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Runeword Charter Pressure</strong>
              ${buildBadge(`${planning.plannedRunewordCount} live`, planning.plannedRunewordCount > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Weapon", plannedWeaponLabel)}
              ${buildStat("Armor", plannedArmorLabel)}
              ${buildStat("Ready", readyCharterCount)}
              ${buildStat("Prepared", preparedCharterCount)}
            </div>
            ${buildStringList(
              [
                charterStageLines[0],
                charterStageLines[1],
                `Next vault push: ${planningOverview.nextActionLabel || "Quiet"}. ${planningOverview.nextActionSummary || "No active runeword charter is pinned across the account."}`,
                `Archive fulfillment: ${planning.fulfilledPlanCount} cleared, ${planning.unfulfilledPlanCount} missed.`,
                `Best charter pushes: weapon act ${planning.weaponBestActsCleared}, armor act ${planning.armorBestActsCleared}.`,
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Draft Forecast</strong>
              ${buildBadge(forecastTone === "cleared" ? "Open Vault" : "Charter Pressure", forecastTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Planning Runs", archiveSummary.planningArchiveCount)}
              ${buildStat("Complete", archiveSummary.planningCompletionCount)}
              ${buildStat("Miss", archiveSummary.planningMissCount)}
              ${buildStat("Gold Peak", archiveSummary.highestGoldGained)}
            </div>
            <p>${escapeHtml(forecastCopy)}</p>
            ${buildStringList(
              [
                `Current planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
                planningOverview.nextActionSummary || "No active runeword charter is pinned across the account.",
                "This panel is intentionally shell-owned and summary-heavy so Agent 2 can later widen stash or planning read models without another front-door rewrite.",
              ],
              "log-list reward-list ledger-list"
            )}
          </article>
        </div>
      </section>
    `;
  }

  runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS_VAULT = {
    buildUnlockGalleryMarkup,
    buildVaultLogisticsMarkup,
  };

  // Patch the parent global so consumers see vault functions on __ROUGE_HALL_VIEW_SECTIONS
  runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS.buildUnlockGalleryMarkup = buildUnlockGalleryMarkup;
  runtimeWindow.__ROUGE_HALL_VIEW_SECTIONS.buildVaultLogisticsMarkup = buildVaultLogisticsMarkup;
})();
