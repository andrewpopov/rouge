(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { getCardElement, ELEMENT_LABELS } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const renderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS;

  type DecklistEntry = { cardId: string; card: CardDefinition; count: number; locations: string[] };

  function renderDecklistCard(entry: DecklistEntry, escapeHtml: (s: string) => string): string {
    const prototypeClass = entry.cardId === "amazon_fire_arrow" || entry.cardId === "amazon_fire_arrow_plus"
      ? " dl-card--prototype-primary"
      : "";
    return renderers.renderCombatCardComponent({
      shellClass: "dl-card",
      rootTag: "article",
      rootAttrs: `data-card-id="${escapeHtml(entry.cardId)}" title="${escapeHtml(entry.card.text)}"`,
      extraRootClasses: prototypeClass,
      headerRightHtml: entry.count > 1 ? `<span class="dl-card__count-badge">\u00d7${entry.count}</span>` : `<span class="dl-card__count-spacer" aria-hidden="true"></span>`,
      cardId: entry.cardId,
      card: entry.card,
      effectiveCost: entry.card.cost,
      escapeHtml,
      maxRuleLines: 4,
    });
  }

  type DecklistBand = { label: string; costKey: number; entries: DecklistEntry[] };

  function renderDecklistGroup(band: DecklistBand, escapeHtml: (s: string) => string): string {
    const totalCards = band.entries.reduce((sum, e) => sum + e.count, 0);
    const costDisplay = band.costKey >= 4 ? "4+" : String(band.costKey);
    const badgeClass = band.costKey >= 4 ? " dl-group__cost-badge--wide" : "";

    return `
      <section class="dl-group">
        <header class="dl-group__label">
          <span class="dl-group__cost-badge${badgeClass}">${escapeHtml(costDisplay)}</span>
          <span class="dl-group__label-text">${escapeHtml(band.label)}</span>
          <span class="dl-group__tally">${totalCards} card${totalCards === 1 ? "" : "s"}</span>
        </header>
        <div class="dl-group__cards">
          ${band.entries.map((entry) => renderDecklistCard(entry, escapeHtml)).join("")}
        </div>
      </section>
    `;
  }

  function buildCompositionPills(entries: DecklistEntry[], escapeHtml: (s: string) => string): string {
    const tally: Record<string, number> = {};
    for (const entry of entries) {
      const element = getCardElement(entry.card);
      tally[element] = (tally[element] || 0) + entry.count;
    }
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .map(([element, count]) => `<span class="dl-comp-pill dl-comp-pill--${element}">${escapeHtml(ELEMENT_LABELS[element] || element)} ${count}</span>`)
      .join("");
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS_DECKLIST = {
    renderDecklistCard,
    renderDecklistGroup,
    buildCompositionPills,
  };
})();
