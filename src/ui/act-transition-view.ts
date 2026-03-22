(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface ActCutscene {
    lines: string[];
    closing: string;
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
    const run = appState.run;
    const nextAct = run.acts[run.currentActIndex + 1];
    const nextTown = nextAct?.town || "the next town";
    const cutscene = getCutscene(run.actNumber, run.bossName, nextTown);

    const narrativeLines = cutscene.lines
      .map((line) => `<p class="cutscene__line">${escapeHtml(line)}</p>`)
      .join("\n");

    const common = runtimeWindow.ROUGE_UI_COMMON;
    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="cutscene">
        <div class="cutscene__backdrop"></div>
        <div class="cutscene__content">
          <p class="cutscene__eyebrow">Act ${run.actNumber} Complete</p>
          <h1 class="cutscene__title">${escapeHtml(run.actTitle)}</h1>
          <div class="cutscene__narrative">
            ${narrativeLines}
          </div>
          <p class="cutscene__closing">${escapeHtml(cutscene.closing)}</p>
          <div class="cutscene__cta">
            <button class="primary-btn" data-action="continue-act-transition">Continue to ${escapeHtml(nextTown)}</button>
          </div>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_ACT_TRANSITION_VIEW = {
    render,
  };
})();
