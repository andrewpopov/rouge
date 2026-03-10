(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function humanize(id: string): string {
    return String(id || "")
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const selectedClass = services.classRegistry.getClassDefinition(appState.seedBundle, appState.ui.selectedClassId);
    const deckProfileId = services.classRegistry.getDeckProfileId(appState.content, appState.ui.selectedClassId);

    const heroSprites = appState.registries.classes
      .map((entry) => {
        const isSelected = entry.id === appState.ui.selectedClassId;
        return `
          <button class="campfire-hero ${isSelected ? "campfire-hero--selected" : ""}"
                  data-action="select-class" data-class-id="${escapeHtml(entry.id)}"
                  title="${escapeHtml(entry.name)}">
            <img class="campfire-hero__sprite"
                 src="./assets/curated/portraits/${escapeHtml(entry.id)}.png"
                 alt="${escapeHtml(entry.name)}"
                 draggable="false" />
            <span class="campfire-hero__name">${escapeHtml(entry.name)}</span>
          </button>
        `;
      })
      .join("");

    const selectedPanel = selectedClass
      ? (() => {
          const previewHero = services.classRegistry.createHeroFromClass(
            appState.content,
            appState.registries.classes.find((c) => c.id === appState.ui.selectedClassId)!
          );
          const trees = selectedClass.skillTrees.map(humanize).join(" \u00b7 ");
          return `
            <div class="campfire-detail">
              <div class="campfire-detail__header">
                <h2 class="campfire-detail__name">${escapeHtml(selectedClass.name)}</h2>
                ${buildBadge(humanize(deckProfileId), "cleared")}
              </div>
              <p class="campfire-detail__trees">${escapeHtml(trees)}</p>
              <div class="campfire-detail__stats">
                ${buildStat("Life", previewHero.maxLife)}
                ${buildStat("Energy", previewHero.maxEnergy)}
                ${buildStat("Hand", previewHero.handSize)}
                ${buildStat("Potion", previewHero.potionHeal)}
              </div>
            </div>
          `;
        })()
      : `<div class="campfire-detail campfire-detail--empty">
           <p class="campfire-detail__prompt">Select a hero to begin your expedition</p>
         </div>`;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="campfire-screen">
        <div class="campfire-sky">
          <p class="eyebrow">New Expedition</p>
          <h1 class="campfire-title">Choose Your Hero</h1>
        </div>
        <div class="campfire-ground">
          <div class="campfire-fire"></div>
          <div class="campfire-lineup">
            ${heroSprites}
          </div>
        </div>
        ${selectedPanel}
        <div class="campfire-actions">
          <button class="neutral-btn" data-action="return-front-door">Back</button>
          <button class="primary-btn" data-action="start-run" ${selectedClass ? "" : "disabled"}>Enter Rogue Encampment</button>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW = {
    render,
  };
})();
