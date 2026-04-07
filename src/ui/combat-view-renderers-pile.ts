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

  const TONE_PRESENTATION: Record<CombatLogTone, { icon: string; label: string }> = {
    strike: { icon: "\u2694", label: "Strike" },
    status: { icon: "\u2727", label: "Affliction" },
    surge: { icon: "\u26E8", label: "Surge" },
    summon: { icon: "\u2726", label: "Summon" },
    loss: { icon: "\u2620", label: "Loss" },
    maneuver: { icon: "\u21BB", label: "Shift" },
    report: { icon: "\u2022", label: "Report" },
  };

  function sentenceCase(text: string): string {
    if (!text) {
      return text;
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function normalizeCombatLogMessage(message: string): string {
    let text = message.trim();
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

  const ACTOR_LABEL: Record<string, string> = {
    hero: "Wanderer",
    mercenary: "Companion",
    enemy: "Enemy",
    minion: "Summon",
    environment: "",
  };

  const EFFECT_STATUS_ICON: Record<string, string> = {
    burn: "\u{1F525}",
    poison: "\u2620",
    chill: "\u2744",
    freeze: "\u2744",
    stun: "\u26A1",
    paralyze: "\u26A1",
    slow: "\u23F3",
  };

  function getEntryPresentation(entry: CombatLogEntry): { tone: CombatLogTone; icon: string; label: string } {
    const presentation = TONE_PRESENTATION[entry.tone] || TONE_PRESENTATION.report;
    return { tone: entry.tone, icon: presentation.icon, label: presentation.label };
  }

  function formatCombatLogEntryText(message: string, escapeHtml: (s: string) => string): string {
    return escapeHtml(message)
      .replace(/(\d+)/g, '<span class="combat-log-entry__value">$1</span>')
      .replace(
        /\b(Burn|Poison|Chill|Freeze|Stun|Paralyze|Slow|Guard|damage|fire|lightning|cold|energy|heals?|drains?|spawns?|resurrects?)\b/gi,
        '<span class="combat-log-entry__keyword">$1</span>'
      );
  }

  function renderEffectChips(entry: CombatLogEntry, escapeHtml: (s: string) => string): string {
    if (!entry.effects || entry.effects.length === 0) {
      return "";
    }
    const chips: string[] = [];
    for (const effect of entry.effects) {
      if (effect.damage && effect.damage > 0) {
        chips.push(`<span class="combat-log-chip combat-log-chip--damage">${effect.damage} dmg</span>`);
      }
      if (effect.healing && effect.healing > 0) {
        chips.push(`<span class="combat-log-chip combat-log-chip--healing">+${effect.healing} hp</span>`);
      }
      if (effect.guardApplied && effect.guardApplied > 0) {
        chips.push(`<span class="combat-log-chip combat-log-chip--guard">+${effect.guardApplied} guard</span>`);
      }
      if (effect.guardDamage && effect.guardDamage > 0) {
        chips.push(`<span class="combat-log-chip combat-log-chip--damage">${effect.guardDamage} guard broken</span>`);
      }
      if (effect.statusApplied) {
        const statusIcon = EFFECT_STATUS_ICON[effect.statusApplied.kind] || "";
        chips.push(
          `<span class="combat-log-chip combat-log-chip--status">${statusIcon} ${escapeHtml(effect.statusApplied.kind)} ${effect.statusApplied.stacks}</span>`
        );
      }
      if (effect.killed) {
        chips.push(`<span class="combat-log-chip combat-log-chip--kill">\u2620 ${escapeHtml(effect.targetName)}</span>`);
      }
    }
    if (chips.length === 0) {
      return "";
    }
    return `<div class="combat-log-entry__chips">${chips.join("")}</div>`;
  }

  function renderActorTag(entry: CombatLogEntry, escapeHtml: (s: string) => string): string {
    if (entry.actor === "environment") {
      return "";
    }
    const name = entry.actorName
      ? escapeHtml(entry.actorName.replace(/\b[Tt]he\s+/g, ""))
      : ACTOR_LABEL[entry.actor] || "";
    if (!name) {
      return "";
    }
    return `<span class="combat-log-entry__actor combat-log-entry__actor--${entry.actor}">${name}</span>`;
  }

  function renderCombatLogPanel(combat: CombatState, logOpen: boolean, escapeHtml: (s: string) => string): string {
    const latestMessage = combat.log[0] ? normalizeCombatLogMessage(combat.log[0].message) : "No exchanges yet.";
    const latestMeta = combat.log[0] ? getEntryPresentation(combat.log[0]) : TONE_PRESENTATION.report;

    return `
      <div class="combat-log${logOpen ? " combat-log--open" : ""}" aria-label="Combat Log">
        <button type="button" class="combat-log__toggle" data-action="toggle-combat-log" aria-expanded="${logOpen ? "true" : "false"}" aria-controls="combat-log-panel">
          <span class="combat-log__toggle-mark" aria-hidden="true">${latestMeta.icon}</span>
          <span class="combat-log__toggle-label">Field Log</span>
          <span class="combat-log__toggle-latest">
            <span class="combat-log__toggle-icon" aria-hidden="true">${latestMeta.icon}</span>
            <span class="combat-log__toggle-text">${formatCombatLogEntryText(latestMessage, escapeHtml)}</span>
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
                ${combat.log.map((entry: CombatLogEntry, index: number) => {
                  const normalizedMessage = normalizeCombatLogMessage(entry.message);
                  const { tone, icon, label } = getEntryPresentation(entry);
                  const nextEntry = combat.log[index + 1] as CombatLogEntry | undefined;
                  const showTurnDivider = nextEntry && nextEntry.turn < entry.turn && entry.turn > 0;
                  const actorTag = renderActorTag(entry, escapeHtml);
                  const chips = renderEffectChips(entry, escapeHtml);
                  return `
                    <li class="combat-log-entry combat-log-entry--${tone}${index === 0 ? " combat-log-entry--latest" : ""}">
                      <div class="combat-log-entry__meta">
                        <span class="combat-log-entry__when">${index === 0 ? "Latest" : `${index} beat${index === 1 ? "" : "s"} ago`}</span>
                        <span class="combat-log-entry__meta-right">
                          ${actorTag}
                          <span class="combat-log-entry__tag">${escapeHtml(label)}</span>
                        </span>
                      </div>
                      <div class="combat-log-entry__line">
                        <span class="combat-log-entry__icon" aria-hidden="true">${icon}</span>
                        <p class="combat-log-entry__text">${formatCombatLogEntryText(normalizedMessage, escapeHtml)}</p>
                      </div>
                      ${chips}
                    </li>
                    ${showTurnDivider ? `<li class="combat-log-divider" aria-hidden="true"><span class="combat-log-divider__label">Turn ${nextEntry.turn}</span></li>` : ""}
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
