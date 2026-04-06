(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const actVisuals = (runtimeWindow as Window & {
    __ROUGE_ACT_VISUAL_ASSETS: {
      getPosterSrc(actNumber: number): string;
      getTownArtSrc(actNumber: number): string;
      getEnvironmentSrc(actNumber: number): string;
    };
  }).__ROUGE_ACT_VISUAL_ASSETS;

  const ACT_BOSS_TEMPLATE_MAP: Record<number, string> = {
    1: "act_1_andariel_boss",
    2: "act_2_duriel_boss",
    3: "act_3_mephisto_boss",
    4: "act_4_diablo_boss",
    5: "act_5_baal_boss",
  };

  interface ActCutscene {
    lines: string[];
    closing: string;
  }

  function renderImage(src: string, cls: string, alt: string, escapeHtml: (value: unknown) => string): string {
    if (!src) { return ""; }
    return `<img src="${escapeHtml(src)}" class="${cls}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  function getDestinationBrief(clearedActNumber: number, nextTown: string): string {
    switch (clearedActNumber) {
      case 1:
        return `${nextTown} waits beyond the badlands. The next charter opens under torchlight and dust.`;
      case 2:
        return `${nextTown} rots beneath river fog and idol smoke. The hunt turns south into drowned processions and shrine roads.`;
      case 3:
        return `${nextTown} stands at the lip of the ash war. The last refuge beyond the river is already burning.`;
      case 4:
        return `${nextTown} is the final mustering ground. Snow, siege fire, and the last ascent are all that remain.`;
      default:
        return `${nextTown} is the next refuge, but the road only darkens from here.`;
    }
  }

  function getScrollDropCopy(clearedActNumber: number, bossName: string, nextTown: string): string {
    switch (clearedActNumber) {
      case 1:
        return `As ${bossName} perishes, a blood-sealed way scroll slips from the ruin. Its markings chart the caravan road east to ${nextTown}.`;
      case 2:
        return `${bossName} falls with a sand-stained charter bound at the tomb's heart, opening the sea road toward ${nextTown}.`;
      case 3:
        return `With ${bossName} broken, a scorched guide scroll is recovered from the temple vault, naming the path onward to ${nextTown}.`;
      case 4:
        return `${bossName}'s defeat yields a frost-bitten war scroll bearing the final route to ${nextTown} and the siege beyond.`;
      default:
        return `${bossName}'s death leaves behind a marked route scroll pointing the expedition toward ${nextTown}.`;
    }
  }

  function getCutscene(clearedActNumber: number, bossName: string, nextTown: string): ActCutscene {
    const cutscenes: Record<number, ActCutscene> = {
      1: {
        lines: [
          `${bossName} lies broken beneath the abbey vault.`,
          "The blackwood covenant is cut open, but the road east is already marked in older blood.",
          `A sepulcher charter recovered from the vault points the expedition toward ${nextTown}.`,
          "The caravan leaves before the ash on the page can dry.",
        ],
        closing: "The desert road opens.",
      },
      2: {
        lines: [
          `${bossName} is buried at the heart of the royal sepulcher.`,
          "The tomb road is won, but the trail does not end in sand.",
          `A waterlogged charter now names ${nextTown}, where drowned processions and idol fires swallow the riverbank.`,
          "The sea road opens before the dunes can settle.",
        ],
        closing: "The river calls.",
      },
      3: {
        lines: [
          `${bossName} falls in the drowned sanctum.`,
          "The river idols go dark, but the war beyond them has already begun.",
          `A scorched charter points past the last shrine toward ${nextTown}, where the ash gate stands open.`,
          "Only the stubborn keep walking when the road ahead already burns.",
        ],
        closing: "Ash waits beyond the gate.",
      },
      4: {
        lines: [
          `${bossName} is cast down at the Ashen Throne.`,
          "The breach is closed, but the last charter points north into siege weather and mountain fire.",
          `The road now climbs toward ${nextTown}, where the final ascent and the ruin crown wait.`,
          "What remains will be settled in snow and iron.",
        ],
        closing: "The mountain must hold.",
      },
    };

    return cutscenes[clearedActNumber] || {
      lines: [
        `${bossName} has been defeated.`,
        `The journey continues to ${nextTown}.`,
      ],
      closing: "Onward.",
    };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const { escapeHtml } = services.renderUtils;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];
    const nextTown = nextAct?.town || "the next town";
    const cutscene = getCutscene(run.actNumber, run.bossName, nextTown);
    const destinationActNumber = nextAct?.actNumber || run.actNumber;
    const destinationTownSrc = actVisuals.getTownArtSrc(destinationActNumber) || "";
    const backdropSrc = actVisuals.getEnvironmentSrc(destinationActNumber) || destinationTownSrc;
    const bossTemplateId = ACT_BOSS_TEMPLATE_MAP[run.actNumber] || "";
    const bossSpriteSrc = bossTemplateId ? assets?.getEnemyIcon(bossTemplateId) || "" : "";
    const classPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const actsCleared = Math.max(run.summary?.actsCleared || 0, 1);
    const bossesDefeated = Math.max(run.summary?.bossesDefeated || 0, 1);
    const destinationBrief = getDestinationBrief(run.actNumber, nextTown);
    const nextActPosterSrc = actVisuals.getPosterSrc(destinationActNumber) || "";
    const scrollDropCopy = getScrollDropCopy(run.actNumber, run.bossName, nextTown);
    const trainingModel = runtimeWindow.ROUGE_RUN_PROGRESSION?.buildTrainingScreenModel?.(appState, appState.content) || null;
    const skillBarSummary = trainingModel
      ? `${trainingModel.slotStateLabel} Slots`
      : "Unavailable";
    const skillBarNames = trainingModel?.slots
      .filter((slot: TrainingSlotViewModel) => Boolean(slot.equippedSkillName))
      .map((slot: TrainingSlotViewModel) => slot.equippedSkillName)
      .join(" / ") || "";
    const skillBarFollowThrough = skillBarNames
      ? `${skillBarSummary}. ${skillBarNames}.`
      : trainingModel?.nextSlotGateLabel || "Review training before the next act opens.";
    const trainingOverlay = runtimeWindow.ROUGE_TRAINING_VIEW?.buildTrainingOverlay?.(appState, services) || "";
    const scrollOverlay = appState.ui.actTransitionScrollOpen ? `
      <div class="act-transition-scroll-overlay" data-action="close-act-transition-scroll">
        <div class="act-transition-scroll-overlay__panel" data-action="noop">
          <div class="act-transition-scroll-overlay__head">
            <span class="act-transition-label">Recovered Guide Scroll</span>
            <button class="act-transition-scroll-overlay__close" data-action="close-act-transition-scroll" aria-label="Close Scroll">Close</button>
          </div>
          <div class="act-transition-scroll-overlay__frame">
            ${renderImage(nextActPosterSrc, "act-transition-scroll-overlay__poster", nextAct?.title || nextTown, escapeHtml)}
          </div>
        </div>
      </div>
    ` : "";

    const chronicleLines = cutscene.lines.slice(1);
    const narrativeLines = chronicleLines
      .map((line) => `<p class="cutscene__line">${escapeHtml(line)}</p>`)
      .join("\n");
    const chapterSummary = cutscene.lines.slice(0, 2).join(" ");

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="cutscene act-transition-screen">
        <div class="cutscene__backdrop" style="background-image:url('${escapeHtml(backdropSrc)}')"></div>
        <div class="act-transition-screen__shade"></div>

        <div class="cutscene__content act-transition-shell">
          <header class="act-transition-header">
            <div class="act-transition-header__title-block">
              <p class="cutscene__eyebrow">Act ${run.actNumber} Complete</p>
              <h1 class="cutscene__title">${escapeHtml(run.actTitle)}</h1>
              <p class="act-transition-header__closing">${escapeHtml(cutscene.closing)}</p>
              <p class="act-transition-header__copy">${escapeHtml(`The chapter is closed. A recovered way scroll now names the road to ${nextTown}.`)}</p>
            </div>

            <div class="act-transition-header__chips">
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Bloodline</span>
                <strong class="act-transition-chip__value">${escapeHtml(run.className)} Lv.${run.level}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Acts</span>
                <strong class="act-transition-chip__value">${actsCleared}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Bosses</span>
                <strong class="act-transition-chip__value">${bossesDefeated}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Coin</span>
                <strong class="act-transition-chip__value">${run.gold}g</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Skill Bar</span>
                <strong class="act-transition-chip__value">${escapeHtml(skillBarSummary)}</strong>
              </div>
            </div>
          </header>

          <section class="act-transition-body">
            <aside class="act-transition-chapter">
              <div class="act-transition-chapter__head">
                <span class="act-transition-label">Boss Fallen</span>
                <strong class="act-transition-chapter__boss-name">${escapeHtml(run.bossName)}</strong>
                <p class="act-transition-chapter__boss-text">The blood debt of this chapter is paid, but the hunt only turns darker from here.</p>
              </div>

              <div class="act-transition-chapter__boss-figure">
                ${bossSpriteSrc
                  ? renderImage(bossSpriteSrc, "act-transition-chapter__boss-img", run.bossName, escapeHtml)
                  : '<span class="act-transition-chapter__boss-glyph" aria-hidden="true">☠</span>'}
              </div>

              <div class="act-transition-chapter__seal">
                <span class="act-transition-label">Chapter Aftermath</span>
                <p class="act-transition-chapter__seal-copy">${escapeHtml(chapterSummary)}</p>
              </div>
            </aside>

            <article class="act-transition-chronicle">
              <div class="act-transition-chronicle__head">
                <span class="act-transition-label">War Chronicle</span>
                <strong class="cutscene__closing">${escapeHtml(cutscene.closing)}</strong>
              </div>
              <div class="act-transition-scroll-drop">
                <div class="act-transition-scroll-drop__copy">
                  <p class="act-transition-scroll-drop__text">${escapeHtml(scrollDropCopy)}</p>
                  <div class="act-transition-scroll-drop__action">
                    <span class="act-transition-scroll-drop__action-label">Open the recovered scroll</span>
                    <button
                      class="act-transition-scroll-drop__seal"
                      data-action="open-act-transition-scroll"
                      aria-label="Open Scroll"
                      title="Open Scroll"
                    >📜</button>
                  </div>
                </div>
              </div>
              <div class="cutscene__narrative">
                ${narrativeLines}
              </div>
            </article>

            <aside class="act-transition-destination">
              <div class="act-transition-destination__art">
                ${renderImage(destinationTownSrc, "act-transition-destination__art-img", nextTown, escapeHtml)}
                ${classPortraitSrc ? renderImage(classPortraitSrc, "act-transition-destination__escort", run.className, escapeHtml) : ""}
              </div>

              <div class="act-transition-destination__copy">
                <span class="act-transition-label">Next Refuge</span>
                <h2 class="act-transition-destination__town">${escapeHtml(nextTown)}</h2>
                <p class="act-transition-destination__act">${escapeHtml(nextAct?.title || "The Final Reckoning")}</p>
                <p class="act-transition-destination__brief">${escapeHtml(destinationBrief)}</p>
                <p class="act-transition-destination__brief act-transition-destination__brief--minor">${escapeHtml(`Skill Bar: ${skillBarFollowThrough}`)}</p>
              </div>

              <div class="cutscene__cta">
                <button class="neutral-btn act-transition__secondary-btn" data-action="open-training-view" data-training-source="act_transition">Review Training</button>
                <button class="primary-btn act-transition__cta-btn" data-action="continue-act-transition">Ride for ${escapeHtml(nextTown)}</button>
              </div>
            </aside>
          </section>
        </div>
      </div>
      ${scrollOverlay}
      ${trainingOverlay}
      ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
        copy:
          "The act handoff now keeps archive pressure, charter staging, mastery focus, and convergence pressure visible while the expedition shifts between acts.",
      })}
      ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
        copy:
          "Act transition now carries the same charter and convergence drilldowns forward, so the next-town decision inherits the same account-side read.",
        charterFollowThrough:
          "If charter pressure wins the handoff, use the next town to settle vault or loadout posture before reopening the route.",
        convergenceFollowThrough:
          "If convergence pressure wins the handoff, review the account focus before the next act leaves town.",
      })}
    `;
  }

  runtimeWindow.ROUGE_ACT_TRANSITION_VIEW = {
    render,
  };
})();
