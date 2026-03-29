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
    1: "./assets/curated/combat-backgrounds/grasslands.webp",
    2: "./assets/curated/combat-backgrounds/desert.webp",
    3: "./assets/curated/combat-backgrounds/jungle.webp",
    4: "./assets/curated/combat-backgrounds/hell.webp",
    5: "./assets/curated/combat-backgrounds/mountain.webp",
  };

  interface GuideViewModel {
    kind: "intro" | "reward";
    eyebrow: string;
    title: string;
    titleLine?: string;
    copy: string;
    closing: string;
    buttonLabel: string;
    destinationLabel: string;
    dossierTitle: string;
    dossierCopy: string;
    scrollLabel: string;
    scrollNote: string;
    routeLines: string[];
    backdropSrc: string;
    posterSrc: string;
    destinationArtSrc: string;
  }

  function renderImage(src: string, cls: string, alt: string, escapeHtml: (value: unknown) => string): string {
    if (!src) { return ""; }
    return `<img src="${escapeHtml(src)}" class="${cls}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  function hasOverlay(run: RunState | null | undefined, phase: AppPhase): boolean {
    if (!run?.guide?.overlayKind) {
      return false;
    }
    if (phase === "world_map") {
      return run.guide.overlayKind === "intro";
    }
    if (phase === "act_transition") {
      return run.guide.overlayKind === "reward";
    }
    return false;
  }

  function getIntroLines(run: RunState, currentAct: ActState): string[] {
    return [
      `${run.safeZoneName} does not send you blind. A smoke-stained route scroll is unbound over the campfire and marked in blood-red ink.`,
      `The charter names every cursed milestone of ${currentAct.title}, from the first breach beyond the palisade to the chamber where ${run.bossName} waits.`,
      "This is not a map for wandering. It is a hunter's guide, meant to be read, followed, and closed only when the act is paid for in full.",
    ];
  }

  function getRewardLines(run: RunState, currentAct: ActState, targetAct: ActState): string[] {
    const nextTown = targetAct?.town || "the next refuge";
    return [
      `Among the spoils of ${run.bossName} lies a sealed way-scroll carrying the next blood route east toward ${nextTown}.`,
      `${currentAct.title} is closed, but the hunt survives because the charter survives. Fresh markings name the roads, gates, and ruins of ${targetAct.title}.`,
      "Take the recovered guide, read the next territory, and carry the expedition forward before the trail goes cold.",
    ];
  }

  function buildViewModel(run: RunState): GuideViewModel {
    const guideKind = run.guide.overlayKind === "reward" ? "reward" : "intro";
    const currentAct = run.acts[run.currentActIndex];
    const targetActNumber = run.guide.targetActNumber || (guideKind === "reward" ? run.actNumber + 1 : run.actNumber);
    const targetAct = run.acts.find((act) => act.actNumber === targetActNumber) || currentAct;

    if (guideKind === "reward") {
      return {
        kind: "reward",
        eyebrow: "Act Boss Reward",
        title: "Recovered Guide Scroll",
        titleLine: targetAct.title,
        copy: `${run.bossName}'s fall has yielded the next charter east. ${targetAct.town} is now the marked refuge on your road.`,
        closing: "Carry the recovered charter into the next chapter.",
        buttonLabel: "Review Next Act",
        destinationLabel: targetAct.town,
        dossierTitle: "Recovered Charter",
        dossierCopy: `${targetAct.title} is now charted. The fortress-to-town handoff begins after you read the scroll.`,
        scrollLabel: "Guide Scroll",
        scrollNote: "Break the seal to carry the charter forward.",
        routeLines: getRewardLines(run, currentAct, targetAct),
        backdropSrc: ACT_ENVIRONMENT_MAP[targetAct.actNumber] || TOWN_ART_MAP[targetAct.actNumber] || "",
        posterSrc: ACT_POSTER_MAP[targetAct.actNumber] || "",
        destinationArtSrc: TOWN_ART_MAP[targetAct.actNumber] || "",
      };
    }

    return {
      kind: "intro",
      eyebrow: "First Expedition Charter",
      title: "Issued Route Charter",
      titleLine: currentAct.title,
      copy: `Before the first step into the wilds, the camp places the route itself in your hands. The charter marks the road from ${run.safeZoneName} to ${run.bossName}.`,
      closing: "Take the charter and open the road.",
      buttonLabel: "Open The Scroll",
      destinationLabel: run.safeZoneName,
      dossierTitle: "Issued In Camp",
      dossierCopy: "The opening act is read like a blood charter: route first, then the march, then the kill.",
      scrollLabel: "Boss Guide",
      scrollNote: "Break the seal to begin the first charter.",
      routeLines: getIntroLines(run, currentAct),
      backdropSrc: TOWN_ART_MAP[currentAct.actNumber] || ACT_ENVIRONMENT_MAP[currentAct.actNumber] || "",
      posterSrc: ACT_POSTER_MAP[currentAct.actNumber] || "",
      destinationArtSrc: TOWN_ART_MAP[currentAct.actNumber] || "",
    };
  }

  function buildOverlayMarkup(appState: AppState, services: UiRenderServices): string {
    const { escapeHtml } = services.renderUtils;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const run = appState.run;
    const viewModel = buildViewModel(run);
    const classPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";

    return `
      <div class="act-guide-screen act-guide-screen--${escapeHtml(viewModel.kind)}">
        <div class="act-guide-screen__backdrop" style="background-image:url('${escapeHtml(viewModel.backdropSrc)}')"></div>
        <div class="act-guide-screen__shade"></div>

        <div class="act-guide-shell">
          <header class="act-guide-header">
            <div class="act-guide-header__title-block">
              <p class="act-guide-header__eyebrow">${escapeHtml(viewModel.eyebrow)}</p>
              <h1 class="act-guide-header__title">${escapeHtml(viewModel.title)}</h1>
              ${viewModel.titleLine ? `<p class="act-guide-header__act-line">${escapeHtml(viewModel.titleLine)}</p>` : ""}
            </div>

            <div class="act-guide-header__chips">
              <div class="act-guide-chip">
                <span class="act-guide-chip__label">Bloodline</span>
                <strong class="act-guide-chip__value">${escapeHtml(run.className)} Lv.${run.level}</strong>
              </div>
              <div class="act-guide-chip">
                <span class="act-guide-chip__label">Current Act</span>
                <strong class="act-guide-chip__value">${escapeHtml(run.actTitle)}</strong>
              </div>
              <div class="act-guide-chip">
                <span class="act-guide-chip__label">${viewModel.kind === "reward" ? "Next Refuge" : "Issued From"}</span>
                <strong class="act-guide-chip__value">${escapeHtml(viewModel.destinationLabel)}</strong>
              </div>
              <div class="act-guide-chip">
                <span class="act-guide-chip__label">Boss Hunt</span>
                <strong class="act-guide-chip__value">${escapeHtml(run.bossName)}</strong>
              </div>
            </div>
          </header>

          <section class="act-guide-body">
            <aside class="act-guide-scroll">
              <span class="act-guide-label">${escapeHtml(viewModel.scrollLabel)}</span>
              <div class="act-guide-scroll__frame">
                ${renderImage(viewModel.posterSrc, "act-guide-scroll__poster", viewModel.title, escapeHtml)}
                <button
                  class="act-guide-scroll__seal"
                  data-action="continue-act-guide"
                  aria-label="${escapeHtml(viewModel.buttonLabel)}"
                  title="${escapeHtml(viewModel.buttonLabel)}"
                >📜</button>
              </div>
              <p class="act-guide-scroll__note">${escapeHtml(viewModel.scrollNote)}</p>
            </aside>

            <article class="act-guide-chronicle">
              <div class="act-guide-chronicle__head">
                <span class="act-guide-label">${escapeHtml(viewModel.dossierTitle)}</span>
                <strong class="act-guide-chronicle__closing">${escapeHtml(viewModel.closing)}</strong>
              </div>
              <p class="act-guide-chronicle__lead">${escapeHtml(viewModel.copy)}</p>
              <p class="act-guide-chronicle__copy">${escapeHtml(viewModel.dossierCopy)}</p>
              <div class="act-guide-route-list">
                ${viewModel.routeLines
                  .map((line) => `<p class="act-guide-route-list__line">${escapeHtml(line)}</p>`)
                  .join("")}
              </div>
            </article>

            <aside class="act-guide-destination">
              <div class="act-guide-destination__art">
                ${renderImage(viewModel.destinationArtSrc, "act-guide-destination__art-img", viewModel.destinationLabel, escapeHtml)}
                ${classPortraitSrc ? renderImage(classPortraitSrc, "act-guide-destination__escort", run.className, escapeHtml) : ""}
              </div>

              <div class="act-guide-destination__copy">
                <span class="act-guide-label">${viewModel.kind === "reward" ? "Next Destination" : "Departure Charter"}</span>
                <h2 class="act-guide-destination__title">${escapeHtml(viewModel.destinationLabel)}</h2>
                <p class="act-guide-destination__brief">${escapeHtml(viewModel.closing)}</p>
              </div>
            </aside>
          </section>
        </div>
      </div>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    root.innerHTML = `${common.renderNotice(appState, services.renderUtils)}${buildOverlayMarkup(appState, services)}`;
  }

  runtimeWindow.ROUGE_ACT_GUIDE_VIEW = {
    hasOverlay,
    buildOverlayMarkup,
    render,
  };
})();
