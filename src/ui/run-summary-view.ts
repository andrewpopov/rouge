/* eslint-disable max-lines, max-params */

(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const actVisuals = (runtimeWindow as Window & {
    __ROUGE_ACT_VISUAL_ASSETS: {
      getPosterSrc(actNumber: number): string;
      getTownArtSrc(actNumber: number): string;
      getEnvironmentSrc(actNumber: number): string;
    };
  }).__ROUGE_ACT_VISUAL_ASSETS;

  const SUMMARY_STEPS = ["finale", "ledger", "archive"] as const;
  type RunSummaryStep = (typeof SUMMARY_STEPS)[number];

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

  function getRunEndAssetSrc(step: RunSummaryStep, victory: boolean): string {
    if (step === "finale") {
      return victory
        ? "./assets/curated/run-end/finale-victory.png"
        : "./assets/curated/run-end/finale-defeat.png";
    }

    if (step === "ledger") {
      return "./assets/curated/run-end/road-ledger.png";
    }

    return "./assets/curated/run-end/archive-hall.png";
  }

  function getBackdrop(run: RunState, step: RunSummaryStep, victory: boolean): string {
    const actNumber = Math.max(1, Math.min(5, Number(run.actNumber) || 1));
    const environmentSrc = actVisuals.getEnvironmentSrc(actNumber);
    const posterSrc = actVisuals.getPosterSrc(actNumber);
    const townSrc = actVisuals.getTownArtSrc(actNumber);
    const runEndAssetSrc = getRunEndAssetSrc(step, victory);

    if (step === "finale") {
      return `url('${runEndAssetSrc}'), url('${environmentSrc}')`;
    }

    if (step === "ledger") {
      return `url('${runEndAssetSrc}'), url('${posterSrc || environmentSrc}')`;
    }

    return `url('${runEndAssetSrc}'), url('${townSrc || posterSrc || environmentSrc}')`;
  }

  function formatLifeFloor(life: number, maxLife: number): string {
    const normalizedMax = Math.max(1, Number(maxLife) || 1);
    const normalizedLife = Math.max(0, Number(life) || 0);
    return `${normalizedLife}/${normalizedMax}`;
  }

  function getOutcomeCopy(run: RunState, victory: boolean, enemiesDefeated: number, lowestHeroLifeLabel: string): string {
    if (victory) {
      return `The road closes behind ${run.className}. ${enemiesDefeated} foes fall on the march, and the closest call comes at ${lowestHeroLifeLabel} Life.`;
    }
    return `${run.className} falls before the campaign is spent. ${run.actTitle} keeps the dead, but the archive keeps the lesson of ${enemiesDefeated} slain foes and a low-water mark of ${lowestHeroLifeLabel} Life.`;
  }

  function getFigureCopy(
    run: RunState,
    victory: boolean,
    enemiesDefeated: number,
    cardsPlayed: number,
    potionsUsed: number,
    lowestHeroLifeLabel: string
  ): string {
    if (victory) {
      return `The bloodline returns with ${run.summary.actsCleared} act${run.summary.actsCleared === 1 ? "" : "s"} broken, ${run.summary.bossesDefeated} boss${run.summary.bossesDefeated === 1 ? "" : "es"} felled, ${enemiesDefeated} foes buried, and ${cardsPlayed} cards committed. Closest call: ${lowestHeroLifeLabel} Life. ${potionsUsed > 0 ? `${potionsUsed} potion${potionsUsed === 1 ? "" : "s"} kept the road alive.` : "No potion was needed to keep the road alive."}`;
    }
    return `The expedition ends in ${run.actTitle}. Even in defeat, the ledger keeps ${enemiesDefeated} slain foes, ${cardsPlayed} cards played, ${potionsUsed} potion${potionsUsed === 1 ? "" : "s"} spent, and the moment the line fell to ${lowestHeroLifeLabel} Life.`;
  }

  function toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getAverage(entries: RunHistoryEntry[], selector: (entry: RunHistoryEntry) => number): number {
    if (!entries.length) {
      return 0;
    }
    return entries.reduce((total, entry) => total + selector(entry), 0) / entries.length;
  }

  function getMax(entries: RunHistoryEntry[], selector: (entry: RunHistoryEntry) => number): number {
    return entries.reduce((highest, entry) => Math.max(highest, selector(entry)), 0);
  }

  function renderDeltaChip(label: string, value: string, tone: "up" | "down" | "even", escapeHtml: (value: unknown) => string): string {
    return `
      <div class="run-summary-delta-chip run-summary-delta-chip--${tone}">
        <span class="run-summary-delta-chip__label">${escapeHtml(label)}</span>
        <strong class="run-summary-delta-chip__value">${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderArchiveMeter(
    label: string,
    current: number,
    best: number,
    escapeHtml: (value: unknown) => string,
    formatter: (value: number) => string = (value) => String(value)
  ): string {
    const scaleMax = Math.max(1, current, best);
    const currentWidth = Math.max(8, Math.round((current / scaleMax) * 100));
    const bestOffset = Math.max(0, Math.min(100, Math.round((best / scaleMax) * 100)));
    return `
      <div class="run-summary-meter">
        <div class="run-summary-meter__head">
          <span class="run-summary-meter__label">${escapeHtml(label)}</span>
          <strong class="run-summary-meter__value">${escapeHtml(formatter(current))}</strong>
        </div>
        <div class="run-summary-meter__track">
          <span class="run-summary-meter__fill" style="width:${currentWidth}%"></span>
          <span class="run-summary-meter__marker" style="left:${bestOffset}%"></span>
        </div>
        <div class="run-summary-meter__foot">Archive best ${escapeHtml(formatter(best))}</div>
      </div>
    `;
  }

  function renderHistoryChart(entries: Array<{ label: string; level: number; acts: number; outcome: string; current?: boolean }>, escapeHtml: (value: unknown) => string): string {
    const maxLevel = Math.max(1, ...entries.map((entry) => entry.level));
    return `
      <div class="run-summary-history-chart">
        ${entries.map((entry) => {
          const height = Math.max(18, Math.round((entry.level / maxLevel) * 100));
          let tone = "abandoned";
          if (entry.current) {
            tone = entry.outcome === "failed" ? "current-failed" : "current";
          } else if (entry.outcome === "completed") {
            tone = "completed";
          } else if (entry.outcome === "failed") {
            tone = "failed";
          }
          return `
            <div class="run-summary-history-bar run-summary-history-bar--${tone}">
              <span class="run-summary-history-bar__value">Lv.${escapeHtml(entry.level)}</span>
              <div class="run-summary-history-bar__track">
                <span class="run-summary-history-bar__fill" style="height:${height}%"></span>
              </div>
              <span class="run-summary-history-bar__label">${escapeHtml(entry.label)}</span>
              <span class="run-summary-history-bar__sub">${escapeHtml(`${entry.acts} act${entry.acts === 1 ? "" : "s"}`)}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function getStep(value: string | null | undefined): RunSummaryStep {
    return SUMMARY_STEPS.includes((value || "") as RunSummaryStep) ? (value as RunSummaryStep) : "finale";
  }

  function renderStepButton(
    step: RunSummaryStep,
    activeStep: RunSummaryStep,
    title: string,
    subtitle: string,
    escapeHtml: (value: unknown) => string
  ): string {
    const active = step === activeStep;
    return `
      <button
        class="run-summary-step-btn${active ? " run-summary-step-btn--active" : ""}"
        data-action="set-run-summary-step"
        data-run-summary-step="${escapeHtml(step)}"
        aria-pressed="${active ? "true" : "false"}"
      >
        <span class="run-summary-step-btn__title">${escapeHtml(title)}</span>
        <span class="run-summary-step-btn__sub">${escapeHtml(subtitle)}</span>
      </button>
    `;
  }

  function renderFigurePanel(
    run: RunState,
    victory: boolean,
    heroPortraitSrc: string,
    enemiesDefeated: number,
    cardsPlayed: number,
    potionsUsed: number,
    lowestHeroLifeLabel: string,
    finalHeroLifeLabel: string,
    finalMercLifeLabel: string,
    escapeHtml: (value: unknown) => string
  ): string {
    return `
      <aside class="run-summary-figure">
        <div class="run-summary-figure__art">
          ${heroPortraitSrc
            ? `<img src="${escapeHtml(heroPortraitSrc)}" class="run-summary-figure__portrait" alt="${escapeHtml(run.className)}" loading="lazy" onerror="this.style.display='none'" />`
            : `<div class="run-summary-figure__monogram" aria-hidden="true">${escapeHtml(run.className.charAt(0))}</div>`}
        </div>

        <div class="run-summary-figure__copy">
          <span class="run-summary-label">Final Chronicle</span>
          <strong class="run-summary-figure__headline">${escapeHtml(victory ? "The expedition returns in glory." : "The expedition is sealed in ash.")}</strong>
          <p class="run-summary-figure__text">${escapeHtml(getFigureCopy(run, victory, enemiesDefeated, cardsPlayed, potionsUsed, lowestHeroLifeLabel))}</p>
        </div>

        <div class="run-summary-figure__trail">
          ${renderStat("Class", run.className, escapeHtml)}
          ${renderStat("Final Life", finalHeroLifeLabel, escapeHtml)}
          ${renderStat("Companion", finalMercLifeLabel, escapeHtml)}
          ${renderStat("Closest Call", lowestHeroLifeLabel, escapeHtml)}
        </div>
      </aside>
    `;
  }

  function renderActionRow(markup: string): string {
    return `<div class="run-summary-actions">${markup}</div>`;
  }

  function renderFinalePill(label: string, value: string | number, escapeHtml: (value: unknown) => string): string {
    return `
      <div class="run-summary-finale-pill">
        <span class="run-summary-finale-pill__label">${escapeHtml(label)}</span>
        <strong class="run-summary-finale-pill__value">${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderFinaleStage(
    run: RunState,
    victory: boolean,
    heroPortraitSrc: string,
    finaleArtSrc: string,
    enemiesDefeated: number,
    cardsPlayed: number,
    potionsUsed: number,
    lowestHeroLifeLabel: string,
    lowestMercLifeLabel: string,
    finalHeroLifeLabel: string,
    finalMercLifeLabel: string,
    uniqueItemsFound: number,
    archiveCallouts: string[],
    escapeHtml: (value: unknown) => string
  ): string {
    const honors = archiveCallouts.length ? archiveCallouts : ["The archive takes its first mark from this road."];
    const summaryPills = victory
      ? [
          { label: "Enemies Slain", value: enemiesDefeated },
          { label: "Cards Played", value: cardsPlayed },
          { label: "Closest Call", value: lowestHeroLifeLabel },
          { label: "Gold Won", value: `${run.summary.goldGained}g` },
        ]
      : [
          { label: "Foes Slain", value: enemiesDefeated },
          { label: "Cards Spent", value: cardsPlayed },
          { label: "Low-Water Mark", value: lowestHeroLifeLabel },
          { label: "Spoils Recovered", value: `${run.summary.goldGained}g` },
        ];
    const impressionLabel = victory ? "Bloodline Impression" : "Last Record";
    const archiveLabel = victory ? "Archive Notes" : "Archive Judgment";
    const ledgerActionLabel = victory ? "Open Road Ledger" : "Review Last Ledger";
    const spoilsTitle = victory ? "Recovered Spoils" : "What Returned";
    return `
      <section class="run-summary-finale-stage">
        <article class="run-summary-finale-banner run-summary-finale-banner--${victory ? "victory" : "defeat"}" style="background-image:url('${escapeHtml(finaleArtSrc)}')">
          <div class="run-summary-finale-banner__art">
            <div class="run-summary-finale-banner__portrait-wrap">
              ${heroPortraitSrc
                ? `<img src="${escapeHtml(heroPortraitSrc)}" class="run-summary-finale-banner__portrait" alt="${escapeHtml(run.className)}" loading="lazy" onerror="this.style.display='none'" />`
                : `<div class="run-summary-finale-banner__monogram" aria-hidden="true">${escapeHtml(run.className.charAt(0))}</div>`}
            </div>
          </div>

          <div class="run-summary-finale-banner__copy">
            <div class="run-summary-finale-banner__intro">
              <span class="run-summary-label">${escapeHtml(victory ? "Campaign Complete" : "Expedition Lost")}</span>
              <h2 class="run-summary-finale__title">${escapeHtml(victory ? "The bloodline walks back out of the dark." : "The road keeps its due, but the bloodline keeps the lesson.")}</h2>
              <p class="run-summary-finale__lede">${escapeHtml(getOutcomeCopy(run, victory, enemiesDefeated, lowestHeroLifeLabel))}</p>
            </div>

            <div class="run-summary-finale-ribbon">
              ${summaryPills.map((pill) => renderFinalePill(pill.label, pill.value, escapeHtml)).join("")}
            </div>

            <div class="run-summary-finale__notes">
              <article class="run-summary-finale__note-card run-summary-finale__note-card--${victory ? "victory" : "defeat"}">
                <span class="run-summary-label">${escapeHtml(impressionLabel)}</span>
                <strong class="run-summary-finale__note-title">${escapeHtml(victory ? "A road worth remembering." : "A failure worth studying.")}</strong>
                <p class="run-summary-finale__note-copy">${escapeHtml(victory
                  ? `${run.className} ends the road at ${finalHeroLifeLabel} Life with ${run.summary.bossesDefeated} boss${run.summary.bossesDefeated === 1 ? "" : "es"} fallen and ${run.summary.actsCleared} act${run.summary.actsCleared === 1 ? "" : "s"} broken.`
                  : `${run.className} falls at ${finalHeroLifeLabel} Life remaining, but the ledger still carries the path, the close call at ${lowestHeroLifeLabel}, and the spoils that made it home.`)}</p>
              </article>

              <article class="run-summary-finale__note-card run-summary-finale__note-card--${victory ? "victory" : "defeat"}">
                <span class="run-summary-label">${escapeHtml(archiveLabel)}</span>
                <strong class="run-summary-finale__note-title">${escapeHtml(honors[0])}</strong>
                <ul class="run-summary-honor-list">
                  ${honors.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
                </ul>
              </article>
            </div>

            ${renderActionRow(`
              <button class="secondary-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="ledger">${escapeHtml(ledgerActionLabel)}</button>
              <button class="neutral-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="archive">Open Archive</button>
              <button class="primary-btn run-summary__cta-btn" data-action="return-front-door">Return To Account Hall</button>
            `)}
          </div>
        </article>

        <div class="run-summary-finale__highlights">
          ${renderSummaryCard("Final Toll", "Road Ends", [
            { label: "Potions Used", value: potionsUsed },
            { label: "Merc Low", value: lowestMercLifeLabel },
            { label: "Hero Finish", value: finalHeroLifeLabel },
            { label: "Merc Finish", value: finalMercLifeLabel },
          ], escapeHtml, { className: "battle" })}
          ${renderSummaryCard(spoilsTitle, "What Returned", [
            { label: "Gold Won", value: `${run.summary.goldGained}g` },
            { label: "Runewords", value: run.summary.runewordsForged },
            { label: "Unique Finds", value: uniqueItemsFound },
            { label: "Bosses Felled", value: run.summary.bossesDefeated },
          ], escapeHtml, { className: "spoils" })}
        </div>
      </section>
    `;
  }

  function renderLedgerStage(
    run: RunState,
    victory: boolean,
    heroPortraitSrc: string,
    actsCleared: number,
    bossesDefeated: number,
    zonesCleared: number,
    encountersCleared: number,
    uniqueItemsFound: number,
    enemiesDefeated: number,
    cardsPlayed: number,
    potionsUsed: number,
    lowestHeroLifeLabel: string,
    lowestMercLifeLabel: string,
    finalHeroLifeLabel: string,
    finalMercLifeLabel: string,
    escapeHtml: (value: unknown) => string
  ): string {
    const ledgerLede = victory
      ? "Spoils, scars, and lasting gains carried home from the road."
      : "What survives the failed march still enters the bloodline ledger.";
    const reportTag = victory ? "Chronicle Sealed" : "Ash Recorded";
    const trailTitle = victory ? "Trail Record" : "Last March";
    const paceTitle = victory ? "Campaign Pace" : "Final Push";
    const battleTitle = victory ? "Battle Ledger" : "Fallen Toll";
    const closeTitle = victory ? "Close Calls" : "Breaking Point";
    const growthTitle = victory ? "Growth" : "What Endured";
    const cacheTitle = victory ? "Recovered Cache" : "What Survived";
    const archiveActionLabel = victory ? "Open Archive" : "Study The Archive";
    return `
      <section class="run-summary-stage run-summary-stage--ledger">
        ${renderFigurePanel(
          run,
          victory,
          heroPortraitSrc,
          enemiesDefeated,
          cardsPlayed,
          potionsUsed,
          lowestHeroLifeLabel,
          finalHeroLifeLabel,
          finalMercLifeLabel,
          escapeHtml
        )}

        <div class="run-summary-report">
          <div class="run-summary-report__hero">
            <div class="run-summary-report__hero-copy">
              <span class="run-summary-label">Road Ledger</span>
              <h2 class="run-summary-report__title">What Returns From The Road</h2>
              <p class="run-summary-report__lede">${escapeHtml(ledgerLede)}</p>
            </div>
            <strong class="run-summary-report__tag">${escapeHtml(reportTag)}</strong>
          </div>

          <div class="run-summary-card-grid run-summary-card-grid--ledger">
            ${renderSummaryCard(trailTitle, "Final Count", [
              { label: "Outcome", value: victory ? "Victory" : "Defeat" },
              { label: "Acts", value: actsCleared },
              { label: "Bosses", value: bossesDefeated },
              { label: "Final Level", value: `Lv.${run.level}` },
            ], escapeHtml, { className: "trail" })}
            ${renderSummaryCard(paceTitle, "Road Ledger", [
              { label: "Zones", value: zonesCleared },
              { label: "Encounters", value: encountersCleared },
              { label: "Deck Size", value: run.deck.length },
              { label: "XP Gained", value: run.summary.xpGained },
            ], escapeHtml, { className: "road" })}
            ${renderSummaryCard(battleTitle, "Run Stats", [
              { label: "Enemies Slain", value: enemiesDefeated },
              { label: "Cards Played", value: cardsPlayed },
              { label: "Potions Used", value: potionsUsed },
              { label: "Gold Carried", value: `${run.gold}g` },
            ], escapeHtml, { className: "battle" })}
            ${renderSummaryCard(closeTitle, "Run Stats", [
              { label: "Hero Low", value: lowestHeroLifeLabel },
              { label: "Merc Low", value: lowestMercLifeLabel },
              { label: "Hero Finish", value: finalHeroLifeLabel },
              { label: "Merc Finish", value: finalMercLifeLabel },
            ], escapeHtml, { className: "close" })}
            ${renderSummaryCard(growthTitle, "Lasting Gain", [
              { label: "Skill Pts", value: run.summary.skillPointsEarned },
              { label: "Class Pts", value: run.summary.classPointsEarned },
              { label: "Attr Pts", value: run.summary.attributePointsEarned },
              { label: "Training Ranks", value: run.summary.trainingRanksGained },
            ], escapeHtml, { className: "growth" })}
            ${renderSummaryCard(cacheTitle, "Spoils", [
              { label: "Gold", value: run.summary.goldGained },
              { label: "Runewords", value: run.summary.runewordsForged },
              { label: "Unique Finds", value: uniqueItemsFound },
              { label: "Final Level", value: `Lv.${run.level}` },
            ], escapeHtml, { className: "spoils" })}
          </div>

          ${renderActionRow(`
            <button class="neutral-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="finale">Back To Finale</button>
            <button class="secondary-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="archive">${escapeHtml(archiveActionLabel)}</button>
            <button class="primary-btn run-summary__cta-btn" data-action="return-front-door">Return To Account Hall</button>
          `)}
        </div>
      </section>
    `;
  }

  function renderArchiveStage(
    run: RunState,
    victory: boolean,
    actsCleared: number,
    bossesDefeated: number,
    enemiesDefeated: number,
    archiveBestLevel: number,
    archiveBestActs: number,
    archiveBestGold: number,
    avgLevel: number,
    avgGold: number,
    avgBosses: number,
    levelDelta: number,
    goldDelta: number,
    bossDelta: number,
    archiveCallouts: string[],
    chartEntries: Array<{ label: string; level: number; acts: number; outcome: string; current?: boolean }>,
    profileSummary: ReturnType<typeof runtimeWindow.ROUGE_APP_ENGINE.getProfileSummary>,
    escapeHtml: (value: unknown) => string
  ): string {
    const getDeltaTone = (value: number): "up" | "down" | "even" => {
      if (value > 0) {
        return "up";
      }
      if (value < 0) {
        return "down";
      }
      return "even";
    };

    const honors = archiveCallouts.length
      ? archiveCallouts
      : ["A steady archive run. No new peak, but the ledger stays strong."];
    const priorChronicles = Math.max(0, profileSummary.runHistoryCount - 1);
    const bannerTitle = victory
      ? "The Archive Weighs This Run Against The Dead."
      : "The Archive Measures What Was Lost And What Still Returned.";
    const bannerLede = priorChronicles > 0
      ? (victory
          ? `${honors[0]} Compared against ${priorChronicles} earlier chronicle${priorChronicles === 1 ? "" : "s"}, this road closes at Lv.${run.level} with ${actsCleared} act${actsCleared === 1 ? "" : "s"} cleared and ${run.summary.goldGained}g recovered.`
          : `${honors[0]} Compared against ${priorChronicles} earlier chronicle${priorChronicles === 1 ? "" : "s"}, this failed road still marks Lv.${run.level}, ${enemiesDefeated} foes buried, and ${run.summary.goldGained}g recovered.`)
      : (victory
          ? "This is the first sealed chronicle in the hall. Every future road will be measured from this mark."
          : "This is the first fallen chronicle in the hall. Every future road will be judged against the lesson it leaves behind.");
    const noteLabel = victory ? "Historical Notes" : "Lessons Logged";
    const comparisonTitle = victory ? "How This Run Stacks Up" : "How This Fall Stacks Up";
    const archiveActionLabel = victory ? "Back To Road Ledger" : "Back To Fallen Ledger";
    const chartNote = chartEntries.length > 1
      ? (victory
          ? "Bars track final level. The current run stays highlighted at the end of the ledger."
          : "Bars track final level. The current failed run stays marked at the end of the ledger.")
      : "This is the opening mark in the archive. Future runs will stack here for quick comparison.";

    return `
      <section class="run-summary-archive-stage">
        <div class="run-summary-archive-main">
          <article class="run-summary-archive-banner">
            <div class="run-summary-archive-banner__copy">
              <span class="run-summary-label">Bloodline Hall</span>
              <strong class="run-summary-archive-banner__title">${escapeHtml(bannerTitle)}</strong>
              <p class="run-summary-archive-banner__lede">${escapeHtml(bannerLede)}</p>
            </div>
            <strong class="run-summary-report__tag">Historical Standing</strong>
          </article>

          <article class="run-summary-compare-card">
            <div class="run-summary-compare-card__head">
              <span class="run-summary-label">Archive Comparison</span>
              <strong class="run-summary-compare-card__title">${escapeHtml(comparisonTitle)}</strong>
            </div>
            <div class="run-summary-delta-row">
              ${renderDeltaChip("Level vs Avg", `${levelDelta > 0 ? "+" : ""}${levelDelta}`, getDeltaTone(levelDelta), escapeHtml)}
              ${renderDeltaChip("Gold vs Avg", `${goldDelta > 0 ? "+" : ""}${goldDelta}g`, getDeltaTone(goldDelta), escapeHtml)}
              ${renderDeltaChip("Bosses vs Avg", `${bossDelta > 0 ? "+" : ""}${bossDelta}`, getDeltaTone(bossDelta), escapeHtml)}
            </div>
            <div class="run-summary-meter-stack">
              ${renderArchiveMeter("Final Level", run.level, archiveBestLevel || run.level, escapeHtml, (value) => `Lv.${value}`)}
              ${renderArchiveMeter("Acts Cleared", actsCleared, archiveBestActs || actsCleared, escapeHtml)}
              ${renderArchiveMeter("Gold Won", run.summary.goldGained, archiveBestGold || run.summary.goldGained, escapeHtml, (value) => `${value}g`)}
            </div>
            <p class="run-summary-compare-card__note">${escapeHtml(`Archive averages sit at Lv.${Math.round(avgLevel || run.level)}, ${Math.round(avgBosses || bossesDefeated)} boss${Math.round(avgBosses || bossesDefeated) === 1 ? "" : "es"}, and ${Math.round(avgGold || run.summary.goldGained)}g.`)}</p>
          </article>

          <article class="run-summary-compare-card run-summary-compare-card--chart">
            <div class="run-summary-compare-card__head">
              <span class="run-summary-label">Recent Chronicle</span>
              <strong class="run-summary-compare-card__title">Last Six Runs By Level</strong>
            </div>
            ${renderHistoryChart(chartEntries, escapeHtml)}
            <p class="run-summary-compare-card__note">${escapeHtml(chartNote)}</p>
          </article>
        </div>

        <aside class="run-summary-archive-side">
          <article class="run-summary-archive-note">
            <span class="run-summary-label">${escapeHtml(noteLabel)}</span>
            <strong class="run-summary-archive-note__title">${escapeHtml(honors[0])}</strong>
            <ul class="run-summary-honor-list">
              ${honors.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
            </ul>
          </article>

          <div class="run-summary-archive-cards">
            ${renderSummaryCard("Archive", "Bloodline Record", [
              { label: "Total Runs", value: profileSummary.runHistoryCount },
              { label: "Completed", value: profileSummary.completedRuns },
              { label: "Highest Lv", value: profileSummary.highestLevel },
              { label: "Total Gold", value: profileSummary.totalGoldCollected },
            ], escapeHtml)}
            ${renderSummaryCard("Unlocks", "Bloodline Record", [
              { label: "Classes", value: profileSummary.unlockedClassCount },
              { label: "Bosses", value: profileSummary.unlockedBossCount },
              { label: "Runewords", value: profileSummary.unlockedRunewordCount },
              { label: "Town Features", value: profileSummary.townFeatureCount },
            ], escapeHtml)}
          </div>

          ${renderActionRow(`
            <button class="neutral-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="ledger">${escapeHtml(archiveActionLabel)}</button>
            <button class="secondary-btn run-summary__step-btn" data-action="set-run-summary-step" data-run-summary-step="finale">Back To Finale</button>
            <button class="primary-btn run-summary__cta-btn" data-action="return-front-door">Return To Account Hall</button>
          `)}
        </aside>
      </section>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const run = appState.run;
    const victory = appState.phase === services.appEngine.PHASES.RUN_COMPLETE;
    const profileSummary = services.appEngine.getProfileSummary(appState);
    const notice = common.renderNotice(appState, services.renderUtils);
    const step = getStep(appState.ui.runSummaryStep);
    const title = victory ? `${run.className} Victorious` : `${run.className} Has Fallen`;
    const heroPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const finaleArtSrc = getRunEndAssetSrc("finale", victory);
    const backdropSrc = getBackdrop(run, step, victory);
    const actsCleared = Math.max(Number(run.summary?.actsCleared) || 0, 0);
    const bossesDefeated = Math.max(Number(run.summary?.bossesDefeated) || 0, 0);
    const zonesCleared = Math.max(Number(run.summary?.zonesCleared) || 0, 0);
    const encountersCleared = Math.max(Number(run.summary?.encountersCleared) || 0, 0);
    const uniqueItemsFound = Math.max(Number(run.summary?.uniqueItemsFound) || 0, 0);
    const enemiesDefeated = Math.max(Number(run.summary?.enemiesDefeated) || 0, 0);
    const cardsPlayed = Math.max(Number(run.summary?.cardsPlayed) || 0, 0);
    const potionsUsed = Math.max(Number(run.summary?.potionsUsed) || 0, 0);
    const lowestHeroLifeLabel = formatLifeFloor(
      Math.max(0, Number(run.summary?.lowestHeroLife) || run.hero.currentLife),
      Math.max(1, Number(run.summary?.lowestHeroLifeMax) || run.hero.maxLife)
    );
    const lowestMercLifeLabel = formatLifeFloor(
      Math.max(0, Number(run.summary?.lowestMercenaryLife) || run.mercenary.currentLife),
      Math.max(1, Number(run.summary?.lowestMercenaryLifeMax) || run.mercenary.maxLife)
    );
    const finalHeroLifeLabel = formatLifeFloor(run.hero.currentLife, run.hero.maxLife);
    const finalMercLifeLabel = formatLifeFloor(run.mercenary.currentLife, run.mercenary.maxLife);
    const historyEntries = Array.isArray(appState.profile?.runHistory) ? appState.profile.runHistory : [];
    const priorEntries = historyEntries.filter((entry) => entry?.runId !== run.id);
    const archiveBestLevel = getMax(priorEntries, (entry) => toNumber(entry?.level, 0));
    const archiveBestActs = getMax(priorEntries, (entry) => toNumber(entry?.actsCleared, 0));
    const archiveBestBosses = getMax(priorEntries, (entry) => toNumber(entry?.bossesDefeated, 0));
    const archiveBestGold = getMax(priorEntries, (entry) => toNumber(entry?.goldGained, 0));
    const avgLevel = getAverage(priorEntries, (entry) => toNumber(entry?.level, 0));
    const avgGold = getAverage(priorEntries, (entry) => toNumber(entry?.goldGained, 0));
    const avgBosses = getAverage(priorEntries, (entry) => toNumber(entry?.bossesDefeated, 0));
    const levelDelta = Math.round(run.level - avgLevel);
    const goldDelta = Math.round(run.summary.goldGained - avgGold);
    const bossDelta = Math.round(bossesDefeated - avgBosses);
    const archiveCallouts = [];
    if (priorEntries.length === 0) {
      archiveCallouts.push(victory ? "First archived expedition." : "First fallen chronicle.");
    } else {
      if (run.level > archiveBestLevel) {
        archiveCallouts.push("New best level.");
      }
      if (actsCleared > archiveBestActs) {
        archiveCallouts.push("Deepest act push so far.");
      }
      if (run.summary.goldGained > archiveBestGold) {
        archiveCallouts.push("Richest payout on record.");
      }
      if (bossesDefeated > archiveBestBosses) {
        archiveCallouts.push("Most bosses felled in a single run.");
      }
      if (archiveCallouts.length === 0) {
        archiveCallouts.push(
          victory
            ? "A steady archive run. No new peak, but the ledger stays strong."
            : "The fall breaks short of the archive peaks, but the road still leaves a mark."
        );
      }
    }
    const chartEntries = [
      ...priorEntries.slice(0, 5).reverse().map((entry, index) => ({
        label: `${index + 1}`,
        level: Math.max(1, toNumber(entry?.level, 1)),
        acts: Math.max(0, toNumber(entry?.actsCleared, 0)),
        outcome: entry?.outcome || "abandoned",
      })),
      {
        label: "Now",
        level: Math.max(1, run.level),
        acts: Math.max(0, actsCleared),
        outcome: victory ? "completed" : "failed",
        current: true,
      },
    ];

    let stageMarkup = "";
    if (step === "finale") {
      stageMarkup = renderFinaleStage(
        run,
        victory,
        heroPortraitSrc,
        finaleArtSrc,
        enemiesDefeated,
        cardsPlayed,
        potionsUsed,
        lowestHeroLifeLabel,
        lowestMercLifeLabel,
        finalHeroLifeLabel,
        finalMercLifeLabel,
        uniqueItemsFound,
        archiveCallouts,
        escapeHtml
      );
    } else if (step === "ledger") {
      stageMarkup = renderLedgerStage(
        run,
        victory,
        heroPortraitSrc,
        actsCleared,
        bossesDefeated,
        zonesCleared,
        encountersCleared,
        uniqueItemsFound,
        enemiesDefeated,
        cardsPlayed,
        potionsUsed,
        lowestHeroLifeLabel,
        lowestMercLifeLabel,
        finalHeroLifeLabel,
        finalMercLifeLabel,
        escapeHtml
      );
    } else {
      stageMarkup = renderArchiveStage(
        run,
        victory,
        actsCleared,
        bossesDefeated,
        enemiesDefeated,
        archiveBestLevel,
        archiveBestActs,
        archiveBestGold,
        avgLevel,
        avgGold,
        avgBosses,
        levelDelta,
        goldDelta,
        bossDelta,
        archiveCallouts,
        chartEntries,
        profileSummary,
        escapeHtml
      );
    }

    root.innerHTML = `
      ${notice}
      <div class="run-summary-screen run-summary-screen--${escapeHtml(step)} run-summary-screen--${escapeHtml(victory ? "victory" : "defeat")}">
        <div class="run-summary-screen__backdrop" style="background-image:${escapeHtml(backdropSrc)}"></div>
        <div class="run-summary-screen__shade"></div>

        <div class="run-summary-shell run-summary-shell--${escapeHtml(step)}">
          <header class="run-summary-header">
            <div class="run-summary-header__copy">
              <p class="run-summary-header__eyebrow">Expedition Summary</p>
              <h1 class="run-summary-header__title">${escapeHtml(title)}</h1>
              <p class="run-summary-header__act">${escapeHtml(`${victory ? "Victory" : "Defeat"} · ${run.actTitle}`)}</p>
              <p class="run-summary-header__lede">${escapeHtml(getOutcomeCopy(run, victory, enemiesDefeated, lowestHeroLifeLabel))}</p>
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
                <span class="run-summary-label">Gold</span>
                <strong class="run-summary-chip__value">${escapeHtml(`${run.gold}g`)}</strong>
              </div>
            </div>
          </header>

          <nav class="run-summary-step-nav" aria-label="Run summary steps">
            ${renderStepButton("finale", step, "Finale", "Outcome and mood", escapeHtml)}
            ${renderStepButton("ledger", step, "Road Ledger", "Run stats and spoils", escapeHtml)}
            ${renderStepButton("archive", step, "Archive", "History and comparison", escapeHtml)}
          </nav>

          ${stageMarkup}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_RUN_SUMMARY_VIEW = {
    render,
  };
})();
