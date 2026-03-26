(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ACT_POSTER_MAP: Record<number, string> = {
    1: "./assets/curated/act-maps/act1-the-sightless-eye.png",
    2: "./assets/curated/act-maps/act2-the-secret-of-the-vizjerei.png",
    3: "./assets/curated/act-maps/act3-the-infernal-gate.png",
    4: "./assets/curated/act-maps/act4-the-harrowing.png",
    5: "./assets/curated/act-maps/act5-lord-of-destruction.png",
  };

  const TOWN_ART_MAP: Record<number, string> = {
    1: "./assets/curated/town-maps/act1.webp",
    2: "./assets/curated/town-maps/act2.webp",
    3: "./assets/curated/town-maps/act3.webp",
    4: "./assets/curated/town-maps/act4.webp",
    5: "./assets/curated/town-maps/act5.webp",
  };

  const ACT_ENVIRONMENT_MAP: Record<number, string> = {
    1: "./assets/curated/combat-backgrounds/desert.webp",
    2: "./assets/curated/combat-backgrounds/jungle.webp",
    3: "./assets/curated/combat-backgrounds/hell.webp",
    4: "./assets/curated/combat-backgrounds/mountain.webp",
    5: "./assets/curated/combat-backgrounds/worldstone_keep.webp",
  };

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
        return `${nextTown} waits beyond the wastes. Caravans gather under torchlight for the desert crossing.`;
      case 2:
        return `${nextTown} rots behind gilded walls and river fog. The chase turns south into corrupted trade routes.`;
      case 3:
        return `${nextTown} stands at the lip of damnation. The fortress will not hold unless you do.`;
      case 4:
        return `${nextTown} is the final mustering ground. Snow, siege fire, and the Worldstone road are all that remain.`;
      default:
        return `${nextTown} is the next refuge, but the road only darkens from here.`;
    }
  }

  function getCutscene(clearedActNumber: number, bossName: string, nextTown: string): ActCutscene {
    const cutscenes: Record<number, ActCutscene> = {
      1: {
        lines: [
          `${bossName}, Maiden of Anguish, lies broken in the catacombs beneath the monastery.`,
          "The corruption that poisoned the Sisterhood of the Sightless Eye has been cut at its source.",
          "But darker forces stir in the east. The Dark Wanderer moves toward the desert, and the trail of destruction follows.",
          `The Rogues speak of a port city, ${nextTown}, where answers may lie among the ancient Vizjerei tombs.`,
          "The caravan departs at dawn.",
        ],
        closing: "The road east awaits.",
      },
      2: {
        lines: [
          `${bossName}, the Pain Lord, has been shattered in the depths of Tal Rasha's tomb.`,
          "The true tomb is unsealed, but too late. The Dark Wanderer has already freed Baal from his ancient prison.",
          "Two of the three Prime Evils now walk the mortal world. Mephisto, Lord of Hatred, awaits in the jungles of Kehjistan.",
          `A ship departs for ${nextTown}. The corruption there runs deep, and the Zakarum priests have fallen to shadow.`,
          "There is no time to rest.",
        ],
        closing: "The jungle calls.",
      },
      3: {
        lines: [
          `${bossName}, Lord of Hatred, has been cast back into the Burning Hells.`,
          "His soulstone is destroyed, but the damage is done. Diablo has reached the Pandemonium Fortress.",
          "The gates between Hell and the mortal world hang by a thread.",
          `The portal to ${nextTown} stands open. Beyond it lies the last bastion before Hell itself.`,
          "Only the brave or the mad would step through.",
        ],
        closing: "Hell awaits beyond the gate.",
      },
      4: {
        lines: [
          `${bossName}, Lord of Terror, has been vanquished in the heart of his own domain.`,
          "But the war is not over. Baal marches on Mount Arreat, seeking the Worldstone itself.",
          "If he corrupts it, all of creation will be unmade.",
          `The Barbarian homeland of ${nextTown} is the last stand. The ancient guardians prepare for war.`,
          "This ends at the summit.",
        ],
        closing: "The mountain trembles.",
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
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];
    const nextTown = nextAct?.town || "the next town";
    const cutscene = getCutscene(run.actNumber, run.bossName, nextTown);
    const currentActPosterSrc = ACT_POSTER_MAP[run.actNumber] || "";
    const destinationTownSrc = TOWN_ART_MAP[nextAct?.actNumber || run.actNumber] || "";
    const backdropSrc = ACT_ENVIRONMENT_MAP[nextAct?.actNumber || run.actNumber] || destinationTownSrc;
    const bossTemplateId = ACT_BOSS_TEMPLATE_MAP[run.actNumber] || "";
    const bossSpriteSrc = bossTemplateId ? assets?.getEnemyIcon(bossTemplateId) || "" : "";
    const classPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const actsCleared = Math.max(run.summary?.actsCleared || 0, 1);
    const bossesDefeated = Math.max(run.summary?.bossesDefeated || 0, 1);
    const destinationBrief = getDestinationBrief(run.actNumber, nextTown);

    const narrativeLines = cutscene.lines
      .map((line) => `<p class="cutscene__line">${escapeHtml(line)}</p>`)
      .join("\n");

    const common = runtimeWindow.ROUGE_UI_COMMON;
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
              <p class="act-transition-header__copy">${escapeHtml(cutscene.closing)}</p>
            </div>

            <div class="act-transition-header__chips">
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Bloodline</span>
                <strong class="act-transition-chip__value">${escapeHtml(run.className)} Lv.${run.level}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Acts Cleared</span>
                <strong class="act-transition-chip__value">${actsCleared}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Bosses Felled</span>
                <strong class="act-transition-chip__value">${bossesDefeated}</strong>
              </div>
              <div class="act-transition-chip">
                <span class="act-transition-chip__label">Treasury</span>
                <strong class="act-transition-chip__value">${run.gold}g</strong>
              </div>
            </div>
          </header>

          <section class="act-transition-body">
            <aside class="act-transition-chapter">
              <div class="act-transition-chapter__poster">
                ${renderImage(currentActPosterSrc, "act-transition-chapter__poster-img", run.actTitle, escapeHtml)}
              </div>

              <div class="act-transition-chapter__boss-card">
                <div class="act-transition-chapter__boss-icon">
                  ${bossSpriteSrc
                    ? renderImage(bossSpriteSrc, "act-transition-chapter__boss-img", run.bossName, escapeHtml)
                    : '<span class="act-transition-chapter__boss-glyph" aria-hidden="true">☠</span>'}
                </div>
                <div class="act-transition-chapter__boss-copy">
                  <span class="act-transition-label">Boss Fallen</span>
                  <strong class="act-transition-chapter__boss-name">${escapeHtml(run.bossName)}</strong>
                  <p class="act-transition-chapter__boss-text">The blood debt of this chapter is paid, but the hunt only turns darker from here.</p>
                </div>
              </div>
            </aside>

            <article class="act-transition-chronicle">
              <div class="act-transition-chronicle__head">
                <span class="act-transition-label">War Chronicle</span>
                <strong class="cutscene__closing">${escapeHtml(cutscene.closing)}</strong>
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
              </div>

              <div class="cutscene__cta">
                <button class="primary-btn act-transition__cta-btn" data-action="continue-act-transition">Ride for ${escapeHtml(nextTown)}</button>
              </div>
            </aside>
          </section>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_ACT_TRANSITION_VIEW = {
    render,
  };
})();
