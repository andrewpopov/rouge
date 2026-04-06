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
    return renderers.renderCombatCardComponent({
      shellClass: "fan-card",
      rootTag: "article",
      rootAttrs: `data-card-id="${escapeHtml(instance.cardId)}"`,
      extraRootClasses: " fan-card--viewer",
      cardId: instance.cardId,
      card,
      effectiveCost,
      escapeHtml,
      maxRuleLines: 4,
    });
  }

  type CombatLogTone = "strike" | "status" | "surge" | "summon" | "loss" | "maneuver" | "report";

  function sentenceCase(text: string): string {
    if (!text) {
      return text;
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function normalizeCombatLogEntry(entry: string): string {
    let text = entry.trim();
    if (!text) {
      return "No exchanges yet.";
    }

    text = text
      .replace(/\b[Tt]he Wanderer\b/g, "Wanderer")
      .replace(/\s*—\s*/g, ". ")
      .replace(/!+/g, ".")
      .replace(/\s+\./g, ".")
      .replace(/\.\s*\(/g, " (");

    text = text.replace(
      /^([^:]+):\s*A pack of (.+?) denizens blocks the path(?:\.)?$/i,
      (_match, encounterName: string, denizens: string) => `${encounterName} begins. ${sentenceCase(denizens)} denizens block the path.`
    );

    text = text.replace(
      /^A pack of (.+?) denizens blocks the path(?:\.)?$/i,
      (_match, denizens: string) => `${sentenceCase(denizens)} denizens block the path.`
    );

    text = text.replace(
      /^Wanderer enters with (\d+) Guard from contract route support(?:\.)?$/i,
      (_match, guard: string) => `Route support: Wanderer enters with ${guard} Guard.`
    );

    text = text.replace(
      /^(.+) enters with (\d+) Guard from contract route support(?:\.)?$/i,
      (_match, allyName: string, guard: string) => `Route support: ${allyName} enters with ${guard} Guard.`
    );

    text = text.replace(
      /^(.+) route support sharpens the Wanderer's attacks by (\d+)(?:\.)?$/i,
      (_match, _allyName: string, bonus: string) => `Route support: Wanderer gains +${bonus} damage.`
    );

    text = text.replace(
      /^(.+) route intel draws (\d+) extra card(s?) for the opening hand(?:\.)?$/i,
      (_match, _allyName: string, drawn: string, plural: string) => `Route intel: Draw ${drawn} extra card${plural}.`
    );

    text = text.replace(
      /^(.+) route perks active: (.+?)(?:\.)?$/i,
      (_match, _allyName: string, perks: string) => `Route perks: ${perks}.`
    );

    text = text.replace(
      /^Potion used on (.+) for (\d+)(?:\.)?$/i,
      (_match, targetName: string, healed: string) => `Potion: Heal ${targetName} for ${healed}.`
    );

    text = text.replace(
      /^The prepared skill window fades at end of turn(?:\.)?$/i,
      "Prepared skill fades."
    );

    text = text.replace(
      /^([^:]+):\s*([a-z])/,
      (_match, prefix: string, firstChar: string) => `${prefix}: ${firstChar.toUpperCase()}`
    );

    text = text.replace(/\s{2,}/g, " ").trim();

    if (!/[.!?]$/.test(text)) {
      text += ".";
    }

    return text;
  }

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

  function renderCombatLogPanel(combat: CombatState, logOpen: boolean, escapeHtml: (s: string) => string): string {
    const latestEntry = normalizeCombatLogEntry(combat.log[0] || "No exchanges yet.");
    const latestMeta = classifyCombatLogEntry(latestEntry);

    return `
      <div class="combat-log${logOpen ? " combat-log--open" : ""}" aria-label="Combat Log">
        <button type="button" class="combat-log__toggle" data-action="toggle-combat-log" aria-expanded="${logOpen ? "true" : "false"}" aria-controls="combat-log-panel">
          <span class="combat-log__toggle-mark" aria-hidden="true">${latestMeta.icon}</span>
          <span class="combat-log__toggle-label">Field Log</span>
          <span class="combat-log__toggle-latest">
            <span class="combat-log__toggle-icon" aria-hidden="true">${latestMeta.icon}</span>
            <span class="combat-log__toggle-text">${formatCombatLogEntryText(latestEntry, escapeHtml)}</span>
          </span>
          <span class="combat-log__toggle-count">${combat.log.length}</span>
        </button>
        ${logOpen ? `
          <div class="combat-log__backdrop" data-action="close-combat-log" aria-hidden="true"></div>
          <section class="combat-log__panel" id="combat-log-panel" aria-label="Field Log details">
            <header class="combat-log__panel-head">
              <div class="combat-log__panel-meta">
                <span class="combat-log__panel-eyebrow">Field Log</span>
                <h3 class="combat-log__panel-title">${combat.log.length} event${combat.log.length === 1 ? "" : "s"}</h3>
              </div>
              <button type="button" class="combat-log__panel-close" data-action="close-combat-log" aria-label="Close field log">Close</button>
            </header>
            ${combat.log.length > 0 ? `
              <ol class="log-list combat-log-list">
                ${combat.log.map((entry, index) => {
                  const normalizedEntry = normalizeCombatLogEntry(entry);
                  const { tone, icon, label } = classifyCombatLogEntry(normalizedEntry);
                  return `
                    <li class="combat-log-entry combat-log-entry--${tone}${index === 0 ? " combat-log-entry--latest" : ""}">
                      <div class="combat-log-entry__meta">
                        <span class="combat-log-entry__when">${index === 0 ? "Latest" : `${index} beat${index === 1 ? "" : "s"} ago`}</span>
                        <span class="combat-log-entry__tag">${escapeHtml(label)}</span>
                      </div>
                      <div class="combat-log-entry__line">
                        <span class="combat-log-entry__icon" aria-hidden="true">${icon}</span>
                        <p class="combat-log-entry__text">${formatCombatLogEntryText(normalizedEntry, escapeHtml)}</p>
                      </div>
                    </li>
                  `;
                }).join("")}
              </ol>
            ` : `
              <div class="combat-log__empty">No exchanges yet. The field is still holding its breath.</div>
            `}
          </section>
        ` : ""}
      </div>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS_PILE = {
    renderPileCard,
    renderCombatLogPanel,
  };
})();
