(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ACT_ENVIRONMENT_MAP: Record<number, string> = {
    1: "./assets/curated/combat-backgrounds/desert.webp",
    2: "./assets/curated/combat-backgrounds/jungle.webp",
    3: "./assets/curated/combat-backgrounds/hell.webp",
    4: "./assets/curated/combat-backgrounds/mountain.webp",
    5: "./assets/curated/combat-backgrounds/worldstone_keep.webp",
  };

  function renderStat(label: string, value: string | number, escapeHtml: (value: unknown) => string): string {
    return `
      <div class="run-summary-stat">
        <span class="run-summary-stat__label">${escapeHtml(label)}</span>
        <strong class="run-summary-stat__value">${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderSummaryCard(
    title: string,
    eyebrow: string,
    stats: Array<{ label: string; value: string | number }>,
    escapeHtml: (value: unknown) => string,
    options: { className?: string } = {}
  ): string {
    const cardClass = options.className ? ` run-summary-card--${options.className}` : "";
    return `
      <article class="run-summary-card${cardClass}">
        <div class="run-summary-card__head">
          <span class="run-summary-label">${escapeHtml(eyebrow)}</span>
          <strong class="run-summary-card__title">${escapeHtml(title)}</strong>
        </div>
        <div class="run-summary-stat-grid">
          ${stats.map((entry) => renderStat(entry.label, entry.value, escapeHtml)).join("")}
        </div>
      </article>
    `;
  }

  function getBackdrop(run: RunState): string {
    const actNumber = Math.max(1, Math.min(5, Number(run.actNumber) || 1));
    return ACT_ENVIRONMENT_MAP[actNumber] || ACT_ENVIRONMENT_MAP[1];
  }

  function getOutcomeCopy(run: RunState, victory: boolean): string {
    if (victory) {
      return `The road closes behind ${run.className}. The hall receives the spoils, the scars, and the memory of ${run.actTitle}.`;
    }
    return `${run.className} falls before the campaign is spent. ${run.actTitle} keeps the dead, but the archive keeps the lesson.`;
  }

  function getFigureCopy(run: RunState, victory: boolean): string {
    if (victory) {
      return `The bloodline returns with ${run.summary.actsCleared} act${run.summary.actsCleared === 1 ? "" : "s"} broken, ${run.summary.bossesDefeated} boss${run.summary.bossesDefeated === 1 ? "" : "es"} felled, and ${run.gold} gold carried home.`;
    }
    return `The expedition ends in ${run.actTitle}. Even in defeat, the ledger keeps the gold won, the runes forged, and the strength earned on the march.`;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const run = appState.run;
    const victory = appState.phase === services.appEngine.PHASES.RUN_COMPLETE;
    const profileSummary = services.appEngine.getProfileSummary(appState);
    const notice = common.renderNotice(appState, services.renderUtils);
    const title = victory ? `${run.className} Victorious` : `${run.className} Has Fallen`;
    const heroPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const backdropSrc = getBackdrop(run);
    const actsCleared = Math.max(Number(run.summary?.actsCleared) || 0, 0);
    const bossesDefeated = Math.max(Number(run.summary?.bossesDefeated) || 0, 0);
    const zonesCleared = Math.max(Number(run.summary?.zonesCleared) || 0, 0);
    const encountersCleared = Math.max(Number(run.summary?.encountersCleared) || 0, 0);
    const uniqueItemsFound = Math.max(Number(run.summary?.uniqueItemsFound) || 0, 0);

    root.innerHTML = `
      ${notice}
      <div class="run-summary-screen">
        <div class="run-summary-screen__backdrop" style="background-image:url('${escapeHtml(backdropSrc)}')"></div>
        <div class="run-summary-screen__shade"></div>

        <div class="run-summary-shell">
          <header class="run-summary-header">
            <div class="run-summary-header__copy">
              <p class="run-summary-header__eyebrow">Expedition Summary</p>
              <h1 class="run-summary-header__title">${escapeHtml(title)}</h1>
              <p class="run-summary-header__act">${escapeHtml(`${victory ? "Victory" : "Defeat"} · ${run.actTitle}`)}</p>
              <p class="run-summary-header__lede">${escapeHtml(getOutcomeCopy(run, victory))}</p>
            </div>

            <div class="run-summary-header__chips">
              <div class="run-summary-chip">
                <span class="run-summary-label">Acts Cleared</span>
                <strong class="run-summary-chip__value">${actsCleared}</strong>
              </div>
              <div class="run-summary-chip">
                <span class="run-summary-label">Bosses Felled</span>
                <strong class="run-summary-chip__value">${bossesDefeated}</strong>
              </div>
              <div class="run-summary-chip">
                <span class="run-summary-label">Final Level</span>
                <strong class="run-summary-chip__value">${escapeHtml(`Lv.${run.level}`)}</strong>
              </div>
              <div class="run-summary-chip">
                <span class="run-summary-label">Treasury</span>
                <strong class="run-summary-chip__value">${escapeHtml(`${run.gold}g`)}</strong>
              </div>
            </div>
          </header>

          <section class="run-summary-stage">
            <aside class="run-summary-figure">
              <div class="run-summary-figure__art">
                ${heroPortraitSrc
                  ? `<img src="${escapeHtml(heroPortraitSrc)}" class="run-summary-figure__portrait" alt="${escapeHtml(run.className)}" loading="lazy" onerror="this.style.display='none'" />`
                  : `<div class="run-summary-figure__monogram" aria-hidden="true">${escapeHtml(run.className.charAt(0))}</div>`}
              </div>

              <div class="run-summary-figure__copy">
                <span class="run-summary-label">Final Chronicle</span>
                <strong class="run-summary-figure__headline">${escapeHtml(victory ? "The expedition returns in glory." : "The expedition is sealed in ash.")}</strong>
                <p class="run-summary-figure__text">${escapeHtml(getFigureCopy(run, victory))}</p>
              </div>

              <div class="run-summary-figure__trail">
                ${renderStat("Zones", zonesCleared, escapeHtml)}
                ${renderStat("Bosses", bossesDefeated, escapeHtml)}
                ${renderStat("Gold", `${run.gold}g`, escapeHtml)}
                ${renderStat("Runewords", run.summary.runewordsForged, escapeHtml)}
              </div>
            </aside>

            <div class="run-summary-report">
              <div class="run-summary-report__head">
                <div>
                  <span class="run-summary-label">Hall Record</span>
                  <h2 class="run-summary-report__title">What Returns From The Road</h2>
                </div>
                <strong class="run-summary-report__tag">${escapeHtml(victory ? "Chronicle Sealed" : "Ash Recorded")}</strong>
              </div>

              <div class="run-summary-card-grid">
                ${renderSummaryCard("Trail Record", "Final Count", [
                  { label: "Outcome", value: victory ? "Victory" : "Defeat" },
                  { label: "Acts", value: actsCleared },
                  { label: "Bosses", value: bossesDefeated },
                  { label: "Zones", value: zonesCleared },
                  { label: "Encounters", value: encountersCleared },
                  { label: "Final Gold", value: `${run.gold}g` },
                ], escapeHtml, { className: "wide" })}
                ${renderSummaryCard("Bloodline", "Hero Record", [
                  { label: "Class", value: run.className },
                  { label: "Level", value: run.level },
                  { label: "XP Gained", value: run.summary.xpGained },
                  { label: "Deck Size", value: run.deck.length },
                ], escapeHtml)}
                ${renderSummaryCard("Growth", "Lasting Gain", [
                  { label: "Skill Pts", value: run.summary.skillPointsEarned },
                  { label: "Class Pts", value: run.summary.classPointsEarned },
                  { label: "Attr Pts", value: run.summary.attributePointsEarned },
                  { label: "Training Ranks", value: run.summary.trainingRanksGained },
                ], escapeHtml)}
                ${renderSummaryCard("Recovered Cache", "Spoils", [
                  { label: "Gold", value: run.summary.goldGained },
                  { label: "Runewords", value: run.summary.runewordsForged },
                  { label: "Unique Finds", value: uniqueItemsFound },
                  { label: "Encounters", value: encountersCleared },
                ], escapeHtml, { className: "muted" })}
              </div>

              ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
                copy:
                  "The archive review now keeps the same account-meta board live, so the run-end read connects directly back to hall, town, rewards, and route planning.",
              })}
              ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
                copy:
                  "Run-end review now carries the same charter and convergence drilldowns, so the account-side lesson is visible before you reopen the hall.",
                charterFollowThrough:
                  "If charter pressure still leads at run end, settle the hall or vault before launching the next expedition.",
                convergenceFollowThrough:
                  "If convergence pressure now leads, revisit the account focus before locking the next run path.",
              })}

              <div class="run-summary-report__footer">
                <details class="run-summary-intel">
                  <summary class="run-summary-intel__summary">Account Records</summary>
                  <div class="run-summary-intel__body">
                    <div class="run-summary-intel__cards">
                      ${renderSummaryCard("Archive", "Account Records", [
                        { label: "Total Runs", value: profileSummary.runHistoryCount },
                        { label: "Completed", value: profileSummary.completedRuns },
                        { label: "Highest Lv", value: profileSummary.highestLevel },
                        { label: "Total Gold", value: profileSummary.totalGoldCollected },
                      ], escapeHtml)}
                      ${renderSummaryCard("Unlocks", "Account Records", [
                        { label: "Classes", value: profileSummary.unlockedClassCount },
                        { label: "Bosses", value: profileSummary.unlockedBossCount },
                        { label: "Runewords", value: profileSummary.unlockedRunewordCount },
                        { label: "Town Features", value: profileSummary.townFeatureCount },
                      ], escapeHtml)}
                    </div>
                  </div>
                </details>

                <button class="primary-btn run-summary__cta-btn" data-action="return-front-door">Return To Account Hall</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_RUN_SUMMARY_VIEW = {
    render,
  };
})();
