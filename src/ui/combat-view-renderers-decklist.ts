(() => {
  type CardTextLine = { short: string; full: string };
  type CardTextApi = {
    describeCompactEffect(effect: CardEffect): CardTextLine;
    formatCompactRuleLine(
      line: string,
      escapeHtml: (value: string) => string,
      valueClass: string,
      keywordClass: string
    ): string;
  };

  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & { ROUGE_CARD_TEXT?: CardTextApi };
  const { getCardElement, ELEMENT_LABELS } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const cardText = runtimeWindow.ROUGE_CARD_TEXT;

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  function isTemplatedIllustrationSrc(src: string | null | undefined): boolean {
    return typeof src === "string" && src.includes("/themes/diablo-inspired/icons/cards/");
  }

  type DecklistEntry = { cardId: string; card: CardDefinition; count: number; locations: string[] };
  type DeckRoleKey = "attack" | "guard" | "affliction" | "draw" | "summon" | "setup" | "support" | "utility";
  type DeckCardFamilyKey = "attack" | "skill" | "hex" | "summon";
  const CARD_DISPLAY_TITLES: Record<string, string> = {
    rally_mercenary: "Rally Merc.",
    merciless_command: "Merciless Cmd.",
  };

  function deriveDeckRole(card: CardDefinition): { key: DeckRoleKey; label: string } {
    const kinds = new Set(card.effects.map((effect) => effect.kind));
    if (kinds.has("summon_minion")) {
      return { key: "summon", label: "Summon" };
    }
    if ([...kinds].some((kind) => kind.startsWith("apply_"))) {
      return { key: "affliction", label: "Hex" };
    }

    switch (card.roleTag) {
      case "answer":
        return { key: "guard", label: "Guard" };
      case "setup":
        return { key: "setup", label: "Setup" };
      case "payoff":
        return { key: "attack", label: "Strike" };
      case "support":
        return { key: "support", label: "Support" };
      case "salvage":
        return { key: "draw", label: "Draw" };
      case "conversion":
        return { key: "utility", label: "Convert" };
    }

    if (kinds.has("gain_guard_self") || kinds.has("gain_guard_party") || kinds.has("heal_hero") || kinds.has("heal_mercenary")) {
      return { key: "guard", label: "Guard" };
    }
    if (kinds.has("draw")) {
      return { key: "draw", label: "Draw" };
    }
    if (kinds.has("mark_enemy_for_mercenary") || kinds.has("buff_mercenary_next_attack")) {
      return { key: "setup", label: "Setup" };
    }
    if (kinds.has("damage") || kinds.has("damage_all")) {
      return { key: "attack", label: "Strike" };
    }

    return { key: "utility", label: "Tactic" };
  }

  function deriveDeckCardFamily(card: CardDefinition, role: { key: DeckRoleKey }): { key: DeckCardFamilyKey; label: string } {
    const kinds = new Set(card.effects.map((effect) => effect.kind));
    if (kinds.has("summon_minion")) {
      return { key: "summon", label: "Summon" };
    }
    if (kinds.has("damage") || kinds.has("damage_all")) {
      return { key: "attack", label: "Attack" };
    }
    if ([...kinds].some((kind) => kind.startsWith("apply_"))) {
      return { key: "hex", label: "Hex" };
    }
    if (role.key === "summon") {
      return { key: "summon", label: "Summon" };
    }
    return { key: "skill", label: "Skill" };
  }

  function _deriveTargetLabel(card: CardDefinition): string {
    switch (card.target) {
      case "enemy":
        return "Enemy";
      case "none":
      default:
        return "Command";
    }
  }

  function describeCompactEffect(effect: CardEffect): { short: string; full: string } {
    return cardText?.describeCompactEffect(effect) || { short: "Special", full: "Special effect." };
  }

  function formatCompactRuleLine(line: string, escapeHtml: (s: string) => string, valueClass: string, keywordClass: string): string {
    return cardText?.formatCompactRuleLine(line, escapeHtml, valueClass, keywordClass) || escapeHtml(line);
  }

  function getCardTitleFitClass(title: string): string {
    if (title.length >= 16) { return " dl-card--title-very-long"; }
    if (title.length >= 13) { return " dl-card--title-long"; }
    return "";
  }

  function getDisplayCardTitle(cardId: string, title: string): string {
    const upgraded = cardId.endsWith("_plus");
    const baseId = upgraded ? cardId.slice(0, -5) : cardId;
    const mapped = CARD_DISPLAY_TITLES[baseId] || title;
    return upgraded && !mapped.endsWith("+") ? `${mapped}+` : mapped;
  }

  function renderDecklistCard(entry: DecklistEntry, escapeHtml: (s: string) => string): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = getCardElement(entry.card);
    const sigilSrc = assets ? assets.getCardIcon(entry.cardId, entry.card.effects) : "";
    const illustrationSrc = assets?.getCardIllustration ? assets.getCardIllustration(entry.cardId) : null;
    const templatedIllustration = isTemplatedIllustrationSrc(illustrationSrc);
    const isUpgraded = entry.cardId.endsWith("_plus");
    const role = deriveDeckRole(entry.card);
    const family = deriveDeckCardFamily(entry.card, role);
    const frameSrc = assets?.getCardFrame ? assets.getCardFrame(role.key) : null;
    const typeLine = family.label;
    const emblemSrc = templatedIllustration ? illustrationSrc : sigilSrc;
    const styleAttr = frameSrc ? ` style="--card-frame-url:url('${escapeHtml(frameSrc)}')"` : "";
    const displayTitle = getDisplayCardTitle(entry.cardId, entry.card.title);
    const titleFitClass = getCardTitleFitClass(displayTitle);
    const prototypeClass = entry.cardId === "amazon_fire_arrow" || entry.cardId === "amazon_fire_arrow_plus"
      ? " dl-card--prototype-primary"
      : "";

    const emblemInner = `
      <div class="dl-card__art-emblem">
        ${emblemSrc ? svgIcon(emblemSrc, `dl-card__art-emblem-icon${templatedIllustration ? " dl-card__art-emblem-icon--templated" : ""}`, entry.card.title) : `<span class="dl-card__art-fallback">${entry.card.target === "enemy" ? "\u2694" : "\u{1F6E1}"}</span>`}
      </div>
    `;
    const artInner = illustrationSrc
      ? `
        ${templatedIllustration ? emblemInner : ""}
        <img src="${illustrationSrc}" class="dl-card__art-illustration${templatedIllustration ? " dl-card__art-illustration--templated" : ""}" alt="" aria-hidden="true" loading="eager" decoding="async" onerror="this.style.display='none'" />
        ${sigilSrc ? `<span class="dl-card__sigil">${svgIcon(sigilSrc, "dl-card__sigil-icon", entry.card.title)}</span>` : ""}
      `
      : emblemInner;

    const ruleLines = entry.card.effects
      .map((effect) => describeCompactEffect(effect))
      .slice(0, 4);
    const rulesText = ruleLines.length > 0
      ? ruleLines.map((line) => line.full).join(" ")
      : entry.card.text;
    const rulesHtml = `<p class="dl-card__tooltip-paragraph">${formatCompactRuleLine(rulesText, escapeHtml, "dl-card__tooltip-value", "dl-card__tooltip-keyword")}</p>`;

    return `
      <article class="dl-card dl-card--${element} dl-card--role-${role.key} dl-card--family-${family.key}${isUpgraded ? " dl-card--upgraded" : ""}${frameSrc ? " dl-card--framed" : ""}${titleFitClass}${prototypeClass}" data-card-id="${escapeHtml(entry.cardId)}" title="${escapeHtml(entry.card.text)}"${styleAttr}>
        <div class="dl-card__header">
          <div class="dl-card__cost">${entry.card.cost}</div>
          <div class="dl-card__title-ribbon">
            <span class="dl-card__name" title="${escapeHtml(entry.card.title)}">
              <span class="dl-card__name-text">${escapeHtml(displayTitle)}</span>
            </span>
          </div>
          ${entry.count > 1 ? `<span class="dl-card__count-badge">\u00d7${entry.count}</span>` : `<span class="dl-card__count-spacer" aria-hidden="true"></span>`}
        </div>
        <div class="dl-card__art">
          <div class="dl-card__art-frame${illustrationSrc ? " dl-card__art-frame--illustrated" : " dl-card__art-frame--sigil"}${templatedIllustration ? " dl-card__art-frame--templated" : ""}">
            ${artInner}
          </div>
        </div>
        <div class="dl-card__type-line">
          <span class="dl-card__type-label">${escapeHtml(typeLine)}</span>
        </div>
        <div class="dl-card__body">
          <div class="dl-card__tooltip-text">${rulesHtml}</div>
        </div>
      </article>
    `;
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
