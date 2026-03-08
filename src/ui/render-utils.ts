(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function buildStat(label, value) {
    return `<div class="entity-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function buildStringList(lines, className = "log-list reward-list") {
    return `<ol class="${escapeHtml(className)}">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>`;
  }

  function buildBadge(label, tone = "locked") {
    return `<span class="badge badge-${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
  }

  function buildBadgeRow(labels, tone = "available") {
    const list = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (list.length === 0) {
      return "";
    }
    return `<div class="badge-row">${list.map((label) => buildBadge(label, tone)).join("")}</div>`;
  }

  function humanizeLabel(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  function getActionBadgeTone(action) {
    if (action.cost <= 0) {
      return "cleared";
    }
    if (action.disabled) {
      return "locked";
    }
    return "available";
  }

  function buildShell(root, { eyebrow, title, copy, body, footer = "" }) {
    root.innerHTML = `
      <section class="hero-banner panel">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-copy">${escapeHtml(copy)}</p>
      </section>
      <div class="shell-body">
        ${body}
      </div>
      ${footer ? `<div class="shell-footer">${footer}</div>` : ""}
    `;
  }

  function buildNoticePanel(message, label = "Notice") {
    if (!message) {
      return "";
    }
    return `
      <section class="panel notice-panel">
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(message)}</p>
      </section>
    `;
  }

  function buildChoiceCard(choice, actionName = "claim-reward-choice") {
    const effectLabels = Array.from(
      new Set(
        (Array.isArray(choice?.effects) ? choice.effects : [])
          .map((effect) => {
            switch (effect?.kind) {
              case "add_card":
                return "Deck +1";
              case "upgrade_card":
                return "Upgrade";
              case "hero_max_life":
                return "Hero Life";
              case "hero_max_energy":
                return "Hero Energy";
              case "hero_potion_heal":
                return "Potion Power";
              case "mercenary_max_life":
                return "Merc Life";
              case "mercenary_attack":
                return "Merc Attack";
              case "belt_capacity":
                return "Belt Size";
              case "refill_potions":
                return "Potion Refill";
              case "gold_bonus":
                return "Gold";
              case "equip_item":
                return "Equip";
              case "add_socket":
                return "Socket";
              case "socket_rune":
                return "Rune";
              case "record_quest_outcome":
                return "Quest Log";
              case "record_quest_follow_up":
                return "Follow-Up";
              case "record_quest_consequence":
                return "Chain";
              case "record_node_outcome":
                if (effect.nodeType === "shrine") {
                  return "Blessing";
                }
                if (effect.nodeType === "opportunity") {
                  return "Opportunity";
                }
                return "Aftermath";
              default:
                return "";
            }
          })
          .filter(Boolean)
      )
    );

    return `
      <button class="entity-card ally choice-card" data-action="${escapeHtml(actionName)}" data-choice-id="${escapeHtml(choice.id)}">
        <div class="entity-name-row">
          <strong class="entity-name">${escapeHtml(choice.title)}</strong>
          ${buildBadge(choice.kind || choice.subtitle || "choice", "available")}
        </div>
        <p class="service-subtitle">${escapeHtml(choice.subtitle)}</p>
        <p class="entity-passive">${escapeHtml(choice.description)}</p>
        ${buildBadgeRow(effectLabels)}
        ${buildStringList(choice.previewLines)}
      </button>
    `;
  }

  function buildChoiceList(choices, actionName = "claim-reward-choice") {
    const list = Array.isArray(choices) ? choices : [];
    if (list.length === 0) {
      return '<p class="flow-copy">No reward choices are available.</p>';
    }
    return `<div class="selection-grid choice-list">${list.map((choice) => buildChoiceCard(choice, actionName)).join("")}</div>`;
  }

  function buildWorldMapNodeCard({ zone, reachable, actionLabel, prerequisiteLabel, hookLabel, summaryLine = "", detailLines = [] }) {
    let tone = "locked";
    if (zone.status === "cleared") {
      tone = "cleared";
    } else if (reachable) {
      tone = "available";
    }

    const resolutionLabel = ["quest", "shrine", "event", "opportunity"].includes(zone.kind) ? "Reward Resolution" : "Combat Route";
    let roleLabel = "Route";
    if (zone.nodeType) {
      roleLabel = humanizeLabel(zone.nodeType);
    } else if (zone.zoneRole) {
      roleLabel = humanizeLabel(zone.zoneRole);
    }
    let statusLabel = "Locked";
    if (zone.status === "available") {
      statusLabel = "Open";
    } else if (zone.status === "cleared") {
      statusLabel = "Resolved";
    }

    return `
      <article class="entity-card map-node ${escapeHtml(zone.status)} map-node-${escapeHtml(zone.kind)}">
        <div class="entity-name-row">
          <strong class="entity-name">${escapeHtml(zone.title)}</strong>
          <div class="badge-stack">
            ${buildBadge(zone.kind, tone)}
            ${buildBadge(statusLabel, tone)}
          </div>
        </div>
        <p class="service-subtitle">${escapeHtml(roleLabel)}</p>
        <p class="entity-passive">${escapeHtml(summaryLine || zone.description)}</p>
        ${buildBadgeRow([hookLabel, resolutionLabel], tone)}
        ${detailLines.length > 0 ? buildStringList(detailLines, "log-list reward-list map-node-details") : ""}
        <div class="entity-stat-grid">
          ${buildStat("Encounters", `${zone.encountersCleared}/${zone.encounterTotal}`)}
          ${buildStat("Requires", prerequisiteLabel)}
          ${buildStat("Reachable", reachable ? "Yes" : "No")}
          ${buildStat("Pressure", actionLabel)}
        </div>
        <div class="cta-row cta-row-tight">
          <button class="primary-btn" data-action="select-zone" data-zone-id="${escapeHtml(zone.id)}" ${zone.status !== "available" ? "disabled" : ""}>${escapeHtml(actionLabel)}</button>
        </div>
      </article>
    `;
  }

  function buildTownActionCard(action) {
    const buttonLabel = action.cost > 0 ? `${action.actionLabel} (${action.cost}g)` : action.actionLabel;
    const badgeLabel = action.cost > 0 ? `${action.cost}g` : action.actionLabel;
    const badgeTone = getActionBadgeTone(action);

    return `
      <article class="feature-card service-card ${action.disabled ? "service-card-disabled" : "service-card-ready"}">
        <div class="entity-name-row">
          <strong>${escapeHtml(action.title)}</strong>
          ${buildBadge(badgeLabel, badgeTone)}
        </div>
        <p class="service-subtitle">${escapeHtml(action.subtitle)}</p>
        <p>${escapeHtml(action.description)}</p>
        ${buildStringList(action.previewLines, "log-list reward-list service-preview")}
        <div class="cta-row cta-row-tight">
          <button class="neutral-btn" data-action="use-town-action" data-town-action-id="${escapeHtml(action.id)}" ${action.disabled ? "disabled" : ""}>${escapeHtml(buttonLabel)}</button>
        </div>
      </article>
    `;
  }

  function buildMercenaryActionCard(action) {
    const buttonLabel = action.cost > 0 ? `${action.actionLabel} (${action.cost}g)` : action.actionLabel;
    const badgeLabel = action.cost > 0 ? `${action.cost}g` : action.actionLabel;
    const badgeTone = getActionBadgeTone(action);

    return `
      <article class="entity-card ally mercenary-card ${action.disabled ? "mercenary-card-disabled" : ""}">
        <div class="entity-name-row">
          <strong class="entity-name">${escapeHtml(action.title)}</strong>
          ${buildBadge(badgeLabel, badgeTone)}
        </div>
        <p class="service-subtitle">${escapeHtml(action.subtitle)}</p>
        <p class="entity-passive">${escapeHtml(action.description)}</p>
        ${buildStringList(action.previewLines, "log-list reward-list service-preview")}
        <div class="cta-row cta-row-tight">
          <button class="neutral-btn" data-action="use-town-action" data-town-action-id="${escapeHtml(action.id)}" ${action.disabled ? "disabled" : ""}>${escapeHtml(buttonLabel)}</button>
        </div>
      </article>
    `;
  }

  runtimeWindow.ROUGE_RENDER_UTILS = {
    escapeHtml,
    buildStat,
    buildStringList,
    buildBadge,
    buildNoticePanel,
    buildChoiceList,
    buildWorldMapNodeCard,
    buildShell,
    buildTownActionCard,
    buildMercenaryActionCard,
  };
})();
