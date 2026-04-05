(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const renderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS;

  function renderPileCard({
    instance,
    card,
    effectiveCost,
    stateLabel: _stateLabel,
    escapeHtml,
  }: {
    instance: { instanceId: string; cardId: string };
    card: CardDefinition;
    effectiveCost: number;
    stateLabel?: string;
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = renderers.getCardElement(card);
    const isUpgraded = instance.cardId.endsWith("_plus");
    const sigilSrc = assets ? assets.getCardIcon(instance.cardId, card.effects) : "";
    const customIllustrationSrc = assets?.getCardIllustration ? assets.getCardIllustration(instance.cardId) : null;
    const templatedIllustration = renderers.isTemplatedIllustrationSrc(customIllustrationSrc);
    const role = renderers.deriveCombatCardRole(card);
    const family = renderers.deriveCombatCardFamily(card, role);
    const frameSrc = assets?.getCardFrame ? assets.getCardFrame(role.key) : null;
    const typeLine = family.label;
    const emblemSrc = templatedIllustration ? customIllustrationSrc : sigilSrc;
    const styleAttr = frameSrc ? ` style="--card-frame-url:url('${escapeHtml(frameSrc)}')"` : "";
    const displayTitle = renderers.getDisplayCardTitle(instance.cardId, card.title);
    const titleFitClass = renderers.getHandCardTitleFitClass(displayTitle);
    const ruleLines = card.effects
      .map((effect: CardEffect) => renderers.describeCompactEffect(effect))
      .slice(0, 4);
    const rulesText = ruleLines.length > 0
      ? ruleLines.map((line: { short: string; full: string }) => line.full).join(" ")
      : card.text;
    const cardRulesHtml = `<p class="fan-card__rules-paragraph">${renderers.formatCompactRuleLine(rulesText, escapeHtml, "fan-card__text-value", "fan-card__text-keyword")}</p>`;
    const emblemInner = `
      <div class="fan-card__art-emblem">
        ${emblemSrc ? renderers.svgIcon(emblemSrc, `fan-card__art-emblem-icon fan-card__art-emblem-icon--${element}${templatedIllustration ? " fan-card__art-emblem-icon--templated" : ""}`, card.title) : `<div class="fan-card__art-fallback" aria-hidden="true">${card.target === "enemy" ? "\u2694" : "\u{1F6E1}"}</div>`}
      </div>
    `;

    return `
      <article class="fan-card fan-card--viewer fan-card--${element} fan-card--role-${role.key} fan-card--family-${family.key}${isUpgraded ? " fan-card--upgraded" : ""}${customIllustrationSrc ? " fan-card--illustrated" : " fan-card--icon-forward"}${templatedIllustration ? " fan-card--templated" : ""}${frameSrc ? " fan-card--framed" : ""}${titleFitClass}"
               data-card-id="${escapeHtml(instance.cardId)}"${styleAttr}>
        <div class="fan-card__surface">
          <div class="fan-card__header">
            <div class="fan-card__cost ${effectiveCost < card.cost ? "fan-card__cost--discounted" : ""}">${effectiveCost}</div>
            <div class="fan-card__title-ribbon">
              <div class="fan-card__name" title="${escapeHtml(card.title)}">
                <span class="fan-card__name-text">${escapeHtml(displayTitle)}</span>
              </div>
            </div>
          </div>
          <div class="fan-card__art">
            <div class="fan-card__art-stage fan-card__art-stage--${element}${customIllustrationSrc ? " fan-card__art-stage--illustrated" : " fan-card__art-stage--sigil"}${templatedIllustration ? " fan-card__art-stage--templated" : ""}">
              ${customIllustrationSrc ? `
                ${templatedIllustration ? emblemInner : ""}
                <img src="${customIllustrationSrc}" class="fan-card__art-illustration fan-card__art-illustration--${element}${templatedIllustration ? " fan-card__art-illustration--templated" : ""}" alt="" aria-hidden="true" loading="eager" decoding="async" onerror="this.style.display='none'" />
                ${sigilSrc ? `<span class="fan-card__sigil">${renderers.svgIcon(sigilSrc, `fan-card__sigil-icon fan-card__sigil-icon--${element}`, card.title)}</span>` : ""}
              ` : `
                ${emblemInner}
              `}
              <div class="fan-card__art-rim" aria-hidden="true"></div>
            </div>
          </div>
          <div class="fan-card__type-line">
            <span class="fan-card__type-label">${escapeHtml(typeLine)}</span>
          </div>
          <div class="fan-card__copy">
            <div class="fan-card__rules">
              <div class="fan-card__desc">${cardRulesHtml}</div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  type CombatLogTone = "strike" | "status" | "surge" | "summon" | "loss" | "maneuver" | "report";

  function classifyCombatLogEntry(entry: string): { tone: CombatLogTone; icon: string; label: string } {
    const lower = entry.toLowerCase();
    if (lower.includes("encounter lost") || lower.includes(" falls") || lower.includes("falls.")) {
      return { tone: "loss", icon: "\u2620", label: "Loss" };
    }
    if (lower.includes("explodes") || lower.includes("erupts in flame") || lower.includes("frost nova")) {
      return { tone: "loss", icon: "\u2739", label: "Burst" };
    }
    if (lower.includes("resurrect") || lower.includes("spawn") || lower.includes("summon")) {
      return { tone: "summon", icon: "\u2726", label: "Summon" };
    }
    if (
      lower.includes("burn") ||
      lower.includes("poison") ||
      lower.includes("chill") ||
      lower.includes("freeze") ||
      lower.includes("stun") ||
      lower.includes("paralyze") ||
      lower.includes("amplifies") ||
      lower.includes("drains")
    ) {
      return { tone: "status", icon: "\u2727", label: "Affliction" };
    }
    if (lower.includes("guard") || lower.includes("heal") || lower.includes("heals") || lower.includes("gains")) {
      return { tone: "surge", icon: "\u26E8", label: "Surge" };
    }
    if (lower.includes("charging") || lower.includes("flees") || lower.includes("blinking") || lower.includes("teleport")) {
      return { tone: "maneuver", icon: "\u21BB", label: "Shift" };
    }
    if (lower.includes("uses") || lower.includes("attacks") || lower.includes("deals") || lower.includes("zaps")) {
      return { tone: "strike", icon: "\u2694", label: "Strike" };
    }
    return { tone: "report", icon: "\u2022", label: "Report" };
  }

  function formatCombatLogEntryText(entry: string, escapeHtml: (s: string) => string): string {
    return escapeHtml(entry)
      .replace(/(\d+)/g, '<span class="combat-log-entry__value">$1</span>')
      .replace(
        /\b(Burn|Poison|Chill|Freeze|Stun|Paralyze|Slow|Guard|damage|fire|lightning|cold|energy|heals?|drains?|spawns?|resurrects?)\b/gi,
        '<span class="combat-log-entry__keyword">$1</span>'
      );
  }

  function renderCombatLogPanel(combat: CombatState, escapeHtml: (s: string) => string): string {
    const latestEntry = combat.log[0] || "No exchanges yet.";
    const latestMeta = classifyCombatLogEntry(latestEntry);

    return `
      <details class="combat-log" aria-label="Combat Log">
        <summary class="combat-log__toggle">
          <span class="combat-log__toggle-label">Combat Log</span>
          <span class="combat-log__toggle-latest">
            <span class="combat-log__toggle-icon" aria-hidden="true">${latestMeta.icon}</span>
            <span class="combat-log__toggle-text">${escapeHtml(latestEntry)}</span>
          </span>
          <span class="combat-log__toggle-count">${combat.log.length} event${combat.log.length === 1 ? "" : "s"}</span>
        </summary>
        ${combat.log.length > 0 ? `
          <ol class="log-list combat-log-list">
            ${combat.log.map((entry, index) => {
              const { tone, icon, label } = classifyCombatLogEntry(entry);
              return `
                <li class="combat-log-entry combat-log-entry--${tone}${index === 0 ? " combat-log-entry--latest" : ""}">
                  <div class="combat-log-entry__meta">
                    <span class="combat-log-entry__when">${index === 0 ? "Latest" : `${index} beat${index === 1 ? "" : "s"} ago`}</span>
                    <span class="combat-log-entry__tag">${escapeHtml(label)}</span>
                  </div>
                  <div class="combat-log-entry__line">
                    <span class="combat-log-entry__icon" aria-hidden="true">${icon}</span>
                    <p class="combat-log-entry__text">${formatCombatLogEntryText(entry, escapeHtml)}</p>
                  </div>
                </li>
              `;
            }).join("")}
          </ol>
        ` : `
          <div class="combat-log__empty">No exchanges yet. The field is still holding its breath.</div>
        `}
      </details>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS_PILE = {
    renderPileCard,
    renderCombatLogPanel,
  };
})();
